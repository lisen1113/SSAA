// AI模型标准化接口模块
// 提供与本地AI模型的稳定通信接口

/**
 * AI模型接口类
 * 提供标准化的方法来与本地模型服务器通信
 */
class AIModelInterface {
    constructor(options = {}) {
        this.baseUrl = options.baseUrl || 'http://localhost:3002';
        this.defaultModel = options.defaultModel || 'gemma3:4b';
        this.timeout = options.timeout || 300000; // 默认5分钟超时
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000; // 默认1秒重试延迟
        // 豆包模型API配置
        this.doubaoApiKey = options.doubaoApiKey || process.env.ARK_API_KEY || '43fb1ddb-5269-4c84-847e-7991f659701d'; // 使用新的API密钥
        this.doubaoApiUrl = options.doubaoApiUrl || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'; // 使用正确的API端点
        this.doubaoModel = options.doubaoModel || 'doubao-seed-2-0-pro-260215'; // 使用新的模型名称
    }

    /**
     * 发送HTTP请求
     * @param {string} endpoint - API端点
     * @param {Object} options - 请求选项
     * @returns {Promise} - 返回响应数据
     */
    async fetch(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const config = {
            timeout: this.timeout,
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        let attempts = 0;
        while (attempts < this.retryAttempts) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    ...config,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                attempts++;
                if (attempts >= this.retryAttempts) {
                    throw error;
                }
                console.warn(`请求失败，${this.retryDelay}ms后重试 (${attempts}/${this.retryAttempts})`, error.message);
                await new Promise(resolve => setTimeout(resolve, this.retryDelay));
            }
        }
    }

    /**
     * 获取AI响应
     * @param {string} message - 用户消息
     * @param {Object} options - 选项
     * @returns {Promise<string>} - 返回AI响应
     */
    async getAIResponse(message, options = {}) {
        try {
            const { history = '', model = this.doubaoModel, imageUrl } = options;
            
            console.log('获取AI响应:', {
                message,
                model,
                hasHistory: history.length > 0,
                hasImage: !!imageUrl
            });

            // 如果是豆包模型，调用豆包API
            if (model === 'doubao' || model === this.doubaoModel) {
                return await this.callDoubaoAPI(message, { imageUrl });
            }

            // 否则调用本地模型
            const response = await this.fetch('/api/local/chat', {
                method: 'POST',
                body: JSON.stringify({
                    message,
                    history,
                    model
                })
            });

            if (response.error) {
                throw new Error(response.error);
            }

            if (!response.response) {
                throw new Error('AI响应格式不正确');
            }

            console.log('AI响应成功:', response.response.substring(0, 100) + (response.response.length > 100 ? '...' : ''));
            return response.response;
        } catch (error) {
            console.error('获取AI响应失败:', error);
            throw error;
        }
    }

    /**
     * 获取模型状态
     * @returns {Promise<Object>} - 返回模型状态信息
     */
    async getModelStatus() {
        try {
            const status = await this.fetch('/api/local/status');
            console.log('模型状态:', status);
            return status;
        } catch (error) {
            console.error('获取模型状态失败:', error);
            throw error;
        }
    }

    /**
     * 获取模型配置
     * @returns {Promise<Object>} - 返回模型配置信息
     */
    async getModelConfig() {
        try {
            const config = await this.fetch('/api/local/config');
            console.log('模型配置:', config);
            return config;
        } catch (error) {
            console.error('获取模型配置失败:', error);
            throw error;
        }
    }

    /**
     * 健康检查
     * @returns {Promise<boolean>} - 返回服务是否健康
     */
    async healthCheck() {
        try {
            const health = await this.fetch('/api/local/health');
            const isHealthy = health.status === 'ok';
            console.log('健康检查:', isHealthy ? '正常' : '异常');
            return isHealthy;
        } catch (error) {
            console.error('健康检查失败:', error);
            return false;
        }
    }

    /**
     * 下载模型
     * @param {string} modelName - 模型名称
     * @returns {Promise<Object>} - 返回下载结果
     */
    async downloadModel(modelName) {
        try {
            console.log('下载模型:', modelName);
            const result = await this.fetch('/api/local/download-model', {
                method: 'POST',
                body: JSON.stringify({ modelName })
            });
            console.log('模型下载结果:', result);
            return result;
        } catch (error) {
            console.error('下载模型失败:', error);
            throw error;
        }
    }

    /**
     * 测试模型响应
     * @param {string} modelName - 模型名称
     * @returns {Promise<boolean>} - 返回模型是否响应正常
     */
    async testModelResponse(modelName) {
        try {
            console.log('测试模型响应:', modelName);
            const response = await this.getAIResponse('你好', { model: modelName });
            return typeof response === 'string' && response.length > 0;
        } catch (error) {
            console.error('测试模型响应失败:', error);
            return false;
        }
    }

    /**
     * 调用豆包模型API
     * @param {string} message - 用户消息
     * @param {Object} options - 选项
     * @returns {Promise<string>} - 返回AI响应
     */
    async callDoubaoAPI(message, options = {}) {
        try {
            console.log('调用豆包模型API:', {
                message,
                model: options.model || this.doubaoModel
            });

            // 确定使用的模型
            const model = options.model || this.doubaoModel;
            
            // 使用正确的请求格式
            const requestBody = {
                model: model,
                messages: [
                    {
                        role: "user",
                        content: message
                    }
                ]
            };

            // 使用正确的API端点
            const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
            console.log('使用API端点:', apiUrl);
            console.log('使用模型:', model);
            console.log('请求参数:', JSON.stringify(requestBody));

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.doubaoApiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('豆包API响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('豆包API错误:', errorText);
                
                // 处理429错误（API限制）
                if (response.status === 429) {
                    throw new Error('豆包API调用达到限制，请稍后再试。错误信息：' + errorText);
                }
                
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('豆包API响应:', data);

            // 解析响应数据
            if (data && data.choices && Array.isArray(data.choices)) {
                // 标准OpenAI格式响应
                for (const choice of data.choices) {
                    if (choice.message && choice.message.content) {
                        console.log('豆包响应成功:', choice.message.content.substring(0, 100) + (choice.message.content.length > 100 ? '...' : ''));
                        return choice.message.content;
                    }
                }
            }

            throw new Error('豆包API响应格式不正确');
        } catch (error) {
            console.error('调用豆包API失败:', error);
            // 抛出错误，以便调用者可以捕获并处理
            throw error;
        }
    }



    /**
     * 测试豆包模型API连接
     * @returns {Promise<boolean>} - 返回豆包API是否可用
     */
    async testDoubaoAPI() {
        try {
            console.log('测试豆包模型API连接...');
            const response = await this.callDoubaoAPI('你好，测试连接');
            return typeof response === 'string' && response.length > 0;
        } catch (error) {
            console.error('测试豆包API失败:', error);
            return false;
        }
    }



    /**
     * 获取最佳可用模型
     * @returns {Promise<string>} - 返回最佳可用模型名称
     */
    async getBestAvailableModel() {
        try {
            // 首先检查豆包模型是否可用
            const isDoubaoAvailable = await this.testDoubaoAPI();
            if (isDoubaoAvailable) {
                console.log('选择最佳模型: doubao');
                return 'doubao';
            }

            // 如果豆包模型不可用，检查本地模型
            const status = await this.getModelStatus();
            
            if (!status.installedModels || status.installedModels.length === 0) {
                return this.defaultModel;
            }

            // 优先顺序：gemma3:4b > llama2:7b > mistral:7b
            const preferredModels = ['gemma3:4b', 'llama2:7b', 'mistral:7b'];
            
            for (const model of preferredModels) {
                if (status.installedModels.some(m => m.name === model)) {
                    console.log('选择最佳模型:', model);
                    return model;
                }
            }

            // 如果没有首选模型，返回第一个已安装的模型
            const firstModel = status.installedModels[0].name;
            console.log('选择第一个已安装模型:', firstModel);
            return firstModel;
        } catch (error) {
            console.error('获取最佳可用模型失败，使用默认模型:', error);
            return this.defaultModel;
        }
    }



    /**
     * 初始化接口
     * @returns {Promise<boolean>} - 返回初始化是否成功
     */
    async initialize() {
        try {
            console.log('初始化AI模型接口...');
            
            // 检查豆包文本模型是否可用
            const isDoubaoAvailable = await this.testDoubaoAPI();
            console.log('豆包文本模型状态:', isDoubaoAvailable ? '可用' : '不可用');
            
            // 即使模型不可用，也设置为默认模型，因为我们只使用豆包模型
            this.defaultModel = 'doubao';
            console.log('AI模型接口初始化完成，默认模型: doubao');
            return true;
        } catch (error) {
            console.error('初始化AI模型接口失败:', error);
            // 即使初始化失败，也设置为默认模型
            this.defaultModel = 'doubao';
            console.log('AI模型接口初始化失败，但设置默认模型为: doubao');
            return true;
        }
    }

    /**
     * 让豆包模型学习上传的内容
     * @param {string} content - 要学习的内容
     * @param {string} contentType - 内容类型
     * @returns {Promise<string>} - 返回学习结果
     */
    async learnContent(content, contentType = 'text') {
        try {
            console.log('让豆包模型学习内容:', { contentType, contentLength: content.length });

            // 使用代码模型进行学习
            const codeModel = 'doubao-seed-2-0-code-preview-260215';
            
            // 构建学习请求
            const requestBody = {
                model: codeModel,
                messages: [
                    {
                        role: "system",
                        content: "你是一个智能学习助手，能够学习用户上传的内容并将其整合到你的知识库中。请认真学习以下内容，并确认你已经掌握了这些知识。"
                    },
                    {
                        role: "user",
                        content: `请学习以下${contentType}内容：\n\n${content}`
                    }
                ]
            };

            // 使用正确的API端点
            const apiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
            console.log('使用API端点:', apiUrl);
            console.log('使用模型:', codeModel);

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), this.timeout);

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.doubaoApiKey}`
                },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('豆包API响应状态:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('豆包API错误:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }

            const data = await response.json();
            console.log('豆包API响应:', data);

            // 解析响应数据
            if (data && data.choices && Array.isArray(data.choices)) {
                // 标准OpenAI格式响应
                for (const choice of data.choices) {
                    if (choice.message && choice.message.content) {
                        console.log('豆包学习响应成功:', choice.message.content.substring(0, 100) + (choice.message.content.length > 100 ? '...' : ''));
                        return choice.message.content;
                    }
                }
            }

            throw new Error('豆包API响应格式不正确');
        } catch (error) {
            console.error('调用豆包学习API失败:', error);
            throw error;
        }
    }
}

/**
 * 创建AI模型接口实例
 * @param {Object} options - 配置选项
 * @returns {AIModelInterface} - 返回AI模型接口实例
 */
function createAIModelInterface(options = {}) {
    return new AIModelInterface(options);
}

// 默认导出
const defaultInterface = createAIModelInterface();

// 为CommonJS环境提供导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        AIModelInterface,
        createAIModelInterface,
        aiModelInterface: defaultInterface
    };
}

// 为浏览器环境提供全局变量
if (typeof window !== 'undefined') {
    // 从localStorage或全局变量获取API密钥
    const getBrowserApiKey = () => {
        if (window.ARK_API_KEY) return window.ARK_API_KEY;
        if (localStorage.getItem('ARK_API_KEY')) return localStorage.getItem('ARK_API_KEY');
        return '43fb1ddb-5269-4c84-847e-7991f659701d';
    };
    
    // 创建使用浏览器API密钥的实例
    const browserInterface = createAIModelInterface({
        doubaoApiKey: getBrowserApiKey()
    });
    
    window.AIModelInterface = AIModelInterface;
    window.createAIModelInterface = createAIModelInterface;
    window.aiModelInterface = browserInterface;
    console.log('AI模型接口已添加到全局作用域');
    console.log('使用的API密钥:', browserInterface.doubaoApiKey);
}
