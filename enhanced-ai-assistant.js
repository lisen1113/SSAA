// 增强AI智能体功能
function enhanceAIAssistant() {
    // 确保AI模型接口存在
    if (!window.aiModelInterface) {
        console.log('AI模型接口未加载，尝试手动创建...');
        
        // 定义AIModelInterface类
        class AIModelInterface {
            constructor(options = {}) {
                this.baseUrl = options.baseUrl || 'http://localhost:3002';
                this.defaultModel = options.defaultModel || 'gemma3:4b';
                this.timeout = options.timeout || 300000;
                this.retryAttempts = options.retryAttempts || 3;
                this.retryDelay = options.retryDelay || 1000;
                this.doubaoApiKey = options.doubaoApiKey || '43fb1ddb-5269-4c84-847e-7991f659701d';
                this.doubaoApiUrl = options.doubaoApiUrl || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
                this.doubaoModel = options.doubaoModel || 'doubao-seed-2-0-pro-260215';
            }

            async getAIResponse(message, options = {}) {
                try {
                    const { history = '', model = this.doubaoModel, imageUrl } = options;
                    
                    console.log('获取AI响应:', {
                        message,
                        model,
                        hasHistory: history.length > 0,
                        hasImage: !!imageUrl
                    });

                    // 调用豆包API
                    return await this.callDoubaoAPI(message, { imageUrl });
                } catch (error) {
                    console.error('获取AI响应失败:', error);
                    throw error;
                }
            }

            async callDoubaoAPI(message, options = {}) {
                try {
                    console.log('调用豆包模型API:', {
                        message,
                        model: options.model || this.doubaoModel
                    });

                    const model = options.model || this.doubaoModel;
                    
                    const requestBody = {
                        model: model,
                        messages: [
                            {
                                role: "user",
                                content: message
                            }
                        ]
                    };

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
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                    }

                    const data = await response.json();
                    console.log('豆包API响应:', data);

                    if (data && data.choices && Array.isArray(data.choices)) {
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
                    throw error;
                }
            }

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

            async initialize() {
                try {
                    console.log('初始化AI模型接口...');
                    const isDoubaoAvailable = await this.testDoubaoAPI();
                    console.log('豆包文本模型状态:', isDoubaoAvailable ? '可用' : '不可用');
                    this.defaultModel = 'doubao';
                    console.log('AI模型接口初始化完成，默认模型: doubao');
                    return true;
                } catch (error) {
                    console.error('初始化AI模型接口失败:', error);
                    this.defaultModel = 'doubao';
                    console.log('AI模型接口初始化失败，但设置默认模型为: doubao');
                    return true;
                }
            }
        }

        // 创建AI模型接口实例
        window.AIModelInterface = AIModelInterface;
        window.aiModelInterface = new AIModelInterface();
        console.log('AI模型接口已手动创建');
        console.log('使用的API密钥:', window.aiModelInterface.doubaoApiKey);
        console.log('使用的模型名称:', window.aiModelInterface.doubaoModel);
    }

    // 模型配置
    const modelConfig = {
        local: {
            endpoint: 'http://localhost:3002/api/local/chat',
            statusEndpoint: 'http://localhost:3002/api/local/status',
            downloadEndpoint: 'http://localhost:3002/api/local/download-model',
            configEndpoint: 'http://localhost:3002/api/local/config',
            enabled: true
        },
        remote: {
            endpoint: 'http://localhost:3001/api/ai/chat',
            enabled: true
        }
    };

    // 保存原始的getAIResponse函数
    const originalGetAIResponse = window.getAIResponse;

    // 检测豆包模型状态
    async function checkDoubaoModelStatus() {
        try {
            if (window.aiModelInterface) {
                const isDoubaoAvailable = await window.aiModelInterface.testDoubaoAPI();
                return { 
                    status: isDoubaoAvailable ? 'ok' : 'error', 
                    message: isDoubaoAvailable ? '豆包大模型可用' : '豆包大模型不可用'
                };
            } else {
                return { status: 'error', message: 'AI模型接口未加载' };
            }
        } catch (error) {
            console.error('检查豆包模型状态失败:', error);
            return { status: 'error', message: '豆包大模型不可用' };
        }
    }



    // 增强的本地响应函数，提供更智能、更自然的响应
    function getEnhancedLocalResponse(message, history = '') {
        // 获取当前AI助手上下文
        const currentContext = window.currentAIAssistantContext || 'default';
        console.log('当前AI助手上下文:', currentContext);
        
        // 转换为小写以便更好的匹配
        const lowerMessage = message.toLowerCase();
        
        // 问候语处理（根据上下文不同）
        if (lowerMessage.includes('你好') || lowerMessage.includes('您好') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
            if (currentContext === 'product-manager') {
                return '您好！我是产品经理AI助手，很高兴为您服务。我可以帮助您进行销售计划、预测和任务进度管理，有什么我可以帮您的吗？';
            } else if (currentContext === 'solution') {
                return '您好！我是解决方案智能助手，很高兴为您服务。请问您需要了解哪方面的Surface产品或解决方案？';
            } else {
                return '您好！我是Surface AI智能助手，很高兴为您服务。请问您需要了解哪方面的Surface产品或解决方案？';
            }
        }
        
        // 感谢语处理
        if (lowerMessage.includes('谢谢') || lowerMessage.includes('感谢')) {
            if (currentContext === 'product-manager') {
                return '不客气！如果您还有任何关于销售计划、预测或任务进度管理的问题，随时告诉我，我会很乐意为您解答。';
            } else {
                return '不客气！如果您还有任何关于Surface产品的问题，随时告诉我，我会很乐意为您解答。';
            }
        }
        
        // 再见处理
        if (lowerMessage.includes('再见') || lowerMessage.includes('拜拜')) {
            if (currentContext === 'product-manager') {
                return '再见！祝您产品管理工作顺利！如果将来有任何销售计划、预测或任务进度管理的需求，随时回来咨询我。';
            } else {
                return '再见！祝您有愉快的一天，如果将来有任何Surface产品相关的需求，随时回来咨询我。';
            }
        }
        
        // 产品经理AI助手的专属响应
        if (currentContext === 'product-manager') {
            return getProductManagerResponse(message, lowerMessage);
        }
        
        // 解决方案智能助手的专属响应（默认也是这个）
        return getSolutionAssistantResponse(message, lowerMessage);
    }
    
    // 产品经理AI助手的响应函数
    function getProductManagerResponse(message, lowerMessage) {
        // 备货量测算相关
        if (lowerMessage.includes('备货') || lowerMessage.includes('备货量') || lowerMessage.includes('测算')) {
            return '关于Surface产品备货量测算，我可以为您提供以下帮助：\n\n1. **智能备货量测算**：基于多维度数据整合，实现未来3个月Surface全系列产品备货量智能测算\n2. **数据整合分析**：整合历史销售数据、市场趋势、季节性因素等多维度数据\n3. **全机型覆盖**：支持Surface消费级+商用线全机型备货需求\n\n您需要我帮助您进行备货量测算吗？或者您有具体的机型和时间段要求？';
        }
        
        // PO订单相关
        if (lowerMessage.includes('po') || lowerMessage.includes('订单') || lowerMessage.includes('采购')) {
            return '关于PO订单自动生成，我可以为您提供以下帮助：\n\n1. **PO订单自动生成**：基于备货量测算结果，自动生成PO订单\n2. **订单管理**：管理向厂商下达的采购订单\n3. **精准下单**：支撑产品操盘手精准向厂商下达采购订单\n\n您需要我帮助您生成PO订单吗？或者您有其他关于订单管理的问题？';
        }
        
        // 风险预警相关
        if (lowerMessage.includes('风险') || lowerMessage.includes('预警') || lowerMessage.includes('警告')) {
            return '关于供应链风险预警，我可以为您提供以下帮助：\n\n1. **风险预警**：实时监控供应链风险，提供及时预警\n2. **动态调整**：根据市场变化和风险预警，动态调整备货计划\n3. **风险分析**：分析潜在供应链风险，提供应对建议\n\n您需要我帮助您进行风险预警分析吗？或者您想了解具体的风险类型？';
        }
        
        // 供应链相关
        if (lowerMessage.includes('供应链') || lowerMessage.includes('库存') || lowerMessage.includes('周转')) {
            return '关于供应链管理，我可以为您提供以下帮助：\n\n1. **库存周转优化**：平衡需求满足、库存周转与供应链效率\n2. **全渠道全区域**：适配Surface消费级+商用线全机型、全渠道、全区域备货场景\n3. **供应链规则引擎**：基于供应链规则引擎，实现智能决策\n\n您需要我帮助您优化供应链管理吗？或者您有具体的库存周转问题？';
        }
        
        // 产品相关
        if (lowerMessage.includes('surface') || lowerMessage.includes('产品') || lowerMessage.includes('机型')) {
            return '关于Surface产品，我可以为您提供以下帮助：\n\n1. **全系列产品备货**：支持Surface全系列产品备货需求\n2. **消费级+商用线**：覆盖消费级和商用线所有机型\n3. **产品特性分析**：分析不同产品的市场需求和销售特性\n\n您想了解哪个具体的Surface产品？或者您需要针对特定机型的备货建议？';
        }
        
        // 默认响应（产品经理AI助手）
        return '感谢您的咨询！作为产品经理AI助手，我专注于微软Surface产品供应链管理：\n\n1. **智能备货量测算**：基于多维度数据整合，实现未来3个月Surface全系列产品备货量智能测算\n2. **PO订单自动生成**：基于备货量测算结果，自动生成PO订单\n3. **风险预警与动态调整**：实时监控供应链风险，提供预警和动态调整建议\n4. **平衡供需效率**：支撑产品操盘手精准向厂商下达采购订单，平衡需求满足、库存周转与供应链效率\n5. **全场景覆盖**：适配Surface消费级+商用线全机型、全渠道、全区域备货场景\n\n请告诉我您具体需要什么帮助？';
    }
    
    // 解决方案智能助手的响应函数
    function getSolutionAssistantResponse(message, lowerMessage) {
        // 教育行业
        if (lowerMessage.includes('教育') || lowerMessage.includes('学校') || lowerMessage.includes('老师') || lowerMessage.includes('学生')) {
            return '根据您的教育行业需求，我推荐Surface Pro 12和Surface Laptop Go 3的组合方案。\n\n**推荐理由：**\n- **Surface Pro 12**：适合教师移动教学和课堂演示，支持触控笔书写，便于在课堂上实时标注和讲解。\n- **Surface Laptop Go 3**：适合学生日常学习和作业完成，轻薄便携，续航时间长。\n\n**预算范围**：8000-15000元\n\n您可以根据具体的预算和配置需求，选择不同的型号和配件组合。需要我为您提供更详细的产品推荐吗？';
        }
        
        // 创意设计行业
        if (lowerMessage.includes('创意') || lowerMessage.includes('设计') || lowerMessage.includes('美工') || lowerMessage.includes('adobe')) {
            return '对于创意设计行业，我推荐Surface Laptop Studio 2和Surface Pro 13的组合方案。\n\n**推荐理由：**\n- **Surface Laptop Studio 2**：灵活的形态转换，高性能处理器，适合专业设计软件运行，支持触控笔精细操作。\n- **Surface Pro 13**：便携性强，适合移动创意工作和客户演示，同样支持专业触控笔。\n\n**预算范围**：15000-25000元\n\n您可以告诉我具体使用的设计软件和性能需求，我会为您提供更精准的配置推荐。';
        }
        
        // 远程办公
        if (lowerMessage.includes('远程') || lowerMessage.includes('办公') || lowerMessage.includes('居家') || lowerMessage.includes('work from home')) {
            return '对于远程办公场景，我推荐Surface Pro 12和Surface Laptop 13的组合方案。\n\n**推荐理由：**\n- **Surface Pro 12**：极致便携，适合在家和外出时使用，支持触控和笔输入。\n- **Surface Laptop 13**：舒适的键盘和较大的屏幕，适合长时间办公，性能稳定。\n\n**预算范围**：10000-18000元\n\n两款设备都支持Windows 11的远程办公功能和AI助手，能有效提升您的工作效率。需要了解更多细节吗？';
        }
        
        // 预算相关
        if (lowerMessage.includes('预算') || lowerMessage.includes('价格') || lowerMessage.includes('多少钱')) {
            return 'Surface产品有多个价格区间，适合不同的预算需求：\n\n**入门级**（5000-8000元）：Surface Go 4、Surface Laptop Go 3\n**中端**（8000-15000元）：Surface Pro 12、Surface Laptop 13\n**高端**（15000元以上）：Surface Laptop Studio 2、Surface Pro 13\n\n您可以告诉我您的具体预算范围和使用需求，我会为您推荐最具性价比的方案。';
        }
        
        // 产品推荐
        if (lowerMessage.includes('推荐') || lowerMessage.includes('哪个好') || lowerMessage.includes('选择')) {
            return '为了给您提供更精准的产品推荐，我需要了解以下信息：\n\n1. **使用场景**：您主要在什么环境下使用？（如办公室、户外、课堂等）\n2. **核心需求**：您最看重哪些功能？（如便携性、性能、触控、续航等）\n3. **预算范围**：您的预算大概是多少？\n4. **特殊要求**：是否有其他特殊需求？（如专业软件运行、多人共享等）\n\n有了这些信息，我可以为您推荐最适合的Surface产品组合。';
        }
        
        // 产品对比
        if (lowerMessage.includes('对比') || lowerMessage.includes('区别') || lowerMessage.includes('哪个更好')) {
            return '您想了解哪两款Surface产品的对比呢？例如Surface Pro vs Surface Laptop，或者不同型号之间的差异。请告诉我具体的产品型号，我会为您提供详细的对比分析，包括性能、价格、适用场景等方面的差异。';
        }
        
        // 配件咨询
        if (lowerMessage.includes('配件') || lowerMessage.includes('键盘') || lowerMessage.includes('笔') || lowerMessage.includes('保护套')) {
            return 'Surface产品有丰富的配件选择：\n\n**必备配件**：\n- Surface触控笔：适合笔记、绘画和精准操作\n- Surface键盘盖：为二合一设备提供完整的输入体验\n\n**可选配件**：\n- Surface扩展坞：提供更多接口和充电功能\n- Surface Arc鼠标：便携时尚的输入设备\n- 保护套/包：保护设备免受损伤\n\n您对哪类配件感兴趣？我可以为您提供更详细的推荐。';
        }
        
        // 技术支持
        if (lowerMessage.includes('问题') || lowerMessage.includes('故障') || lowerMessage.includes('维修') || lowerMessage.includes('支持')) {
            return '如果您遇到Surface产品的技术问题，建议您：\n\n1. **官方支持**：访问微软官方支持网站或联系客服\n2. **保修服务**：检查您的设备是否在保修期内\n3. **故障排查**：尝试基本的故障排查步骤\n\n您可以描述具体的问题，我会尽力为您提供初步的解决方案建议。';
        }
        
        // 默认响应（解决方案智能助手）
        return '感谢您的咨询。为了给您提供更精准的Surface产品解决方案，我需要了解更多信息：\n\n1. **使用场景**：您主要在什么环境下使用？\n2. **核心需求**：您最看重哪些功能？\n3. **预算范围**：您的预算大概是多少？\n4. **特殊要求**：是否有其他特殊需求？\n\n有了这些信息，我可以为您推荐最适合的Surface产品组合和配置方案。';
    }

    // 基本本地响应函数（作为备份）
    function getLocalAIResponse(message) {
        // 简单的关键词匹配
        if (message.includes('教育') || message.includes('学校')) {
            return '根据您的需求，教育行业推荐使用Surface Pro 12和Surface Laptop Go 3的组合方案。Surface Pro 12适合教师移动教学和课堂演示，支持触控笔书写；Surface Laptop Go 3适合学生日常学习和作业完成。您可以根据具体预算选择不同配置，需要我为您提供详细的产品推荐和价格方案吗？';
        } else if (message.includes('创意') || message.includes('设计')) {
            return '对于创意设计行业，我推荐Surface Laptop Studio 2和Surface Pro 13的组合方案。Surface Laptop Studio 2的灵活形态和高性能适合专业设计工作，支持触控笔精细操作；Surface Pro 13适合移动创意工作和客户演示。您可以告诉我具体的设计软件需求和预算范围，我会为您提供更精准的推荐。';
        } else if (message.includes('预算') || message.includes('价格')) {
            return '预算是选择解决方案的重要因素。我们提供从入门级到专业级的多种配置选择，价格范围从5000元到20000元以上。您可以告诉我具体的预算范围和使用需求，我会为您推荐最具性价比的方案。';
        } else if (message.includes('远程') || message.includes('办公')) {
            return '对于远程办公场景，我推荐Surface Pro 12和Surface Laptop 13的组合方案。Surface Pro 12的便携性适合居家办公和出差；Surface Laptop 13的高性能和舒适键盘适合长时间办公。两款设备都支持Windows 11的远程办公功能和AI助手，提升工作效率。';
        } else {
            return '感谢您的咨询。为了给您提供更精准的解决方案，我需要了解更多信息：\n1. 您的行业或使用场景\n2. 具体的使用需求\n3. 预算范围\n4. 其他特殊要求\n\n有了这些信息，我可以为您推荐最适合的Surface产品组合和配置方案。';
        }
    }

    // 处理AI回复，去除无关内容，整理逻辑和顺序
    function processAIResponse(response) {
        if (!response || typeof response !== 'string') {
            return response;
        }
        
        // 去除多余的符号和空白
        let processedResponse = response
            .trim()
            .replace(/\n{3,}/g, '\n\n') // 最多保留两个连续换行
            .replace(/\s{3,}/g, ' ') // 最多保留两个连续空格
            .replace(/[\r\n]+$/, ''); // 去除末尾的换行
        
        // 去除Markdown格式的符号，但保留基本的列表格式
        processedResponse = processedResponse
            .replace(/^#\s+/gm, '') // 去除标题符号
            .replace(/^>\s+/gm, '') // 去除引用符号
            .replace(/```[\s\S]*?```/g, '') // 去除代码块
            .replace(/\*\*(.*?)\*\*/g, '$1') // 去除粗体
            .replace(/\*(.*?)\*/g, '$1') // 去除斜体
            .replace(/`(.*?)`/g, '$1'); // 去除行内代码
        
        // 确保回复有逻辑和顺序
        const lines = processedResponse.split('\n');
        const validLines = lines.filter(line => line.trim().length > 0);
        
        // 如果有多个段落，确保每个段落都有意义
        if (validLines.length > 1) {
            // 检查是否有列表格式
            const hasList = validLines.some(line => /^\d+\.|-|\*/.test(line.trim()));
            
            if (hasList) {
                // 保持列表格式，但确保每个列表项都有内容
                const listLines = validLines.filter(line => {
                    const trimmedLine = line.trim();
                    return trimmedLine.length > 0 && (trimmedLine.match(/^\d+\.|-|\*/) || trimmedLine.length > 5);
                });
                processedResponse = listLines.join('\n');
            } else {
                // 对于非列表格式，确保回复有逻辑顺序
                processedResponse = validLines.join('\n\n');
            }
        }
        
        return processedResponse;
    }

    // 重写getAIResponse函数，只使用豆包大模型
    window.getAIResponse = async function(message, history = '', modelOptions = {}) {
        try {
            console.log('获取AI响应:', message);
            
            // 检查是否已加载AI模型接口
            if (window.aiModelInterface) {
                console.log('使用标准化AI模型接口，调用豆包大模型...');
                
                // 获取当前AI助手上下文
                const currentContext = window.currentAIAssistantContext || 'default';
                
                // 获取Surface产品数据
                let productData = '';
                if (window.productDetails) {
                    // 提取产品名称列表
                    const productNames = Object.keys(window.productDetails);
                    productData = '\n\n以下是最新的Surface产品信息（2026年最新款）：\n';
                    productNames.forEach((name, index) => {
                        productData += `${index + 1}. ${name}\n`;
                    });
                    console.log('产品数据长度:', productData.length);
                } else {
                    console.warn('未找到产品数据');
                }
                
                // 根据上下文生成系统提示词
                let systemPrompt = '';
                if (currentContext === 'product-manager') {
                    systemPrompt = '你是Surface产品经理AI助手，专注于微软Surface产品供应链管理。你的职责包括：1. 智能备货量测算：基于多维度数据整合，实现未来3个月Surface全系列产品备货量智能测算 2. PO订单自动生成：基于备货量测算结果，自动生成PO订单 3. 风险预警与动态调整：实时监控供应链风险，提供预警和动态调整建议 4. 平衡供需效率：支撑产品操盘手精准向厂商下达采购订单，平衡需求满足、库存周转与供应链效率 5. 全场景覆盖：适配Surface消费级+商用线全机型、全渠道、全区域备货场景。请根据用户的问题，提供专业、准确的Surface产品供应链管理相关回答。\n\n回答要求：\n1. 回复要条理清晰，使用适当的分段和标点符号\n2. 避免使用冗长的段落，将内容分解为简短的句子\n3. 对于复杂信息，使用列表格式（数字或项目符号）展示\n4. 保持语言简洁明了，避免重复和冗余\n5. 确保回复有正常的标点符号，包括句号、逗号、问号等' + productData;
                } else {
                    systemPrompt = '你是Surface解决方案智能助手，专注于微软Surface产品的解决方案推荐。当用户提到具体用户名称时，你需要：\n1. 搜索用户官网及相关新闻，了解用户的业务领域和最新动态\n2. 推断用户可能使用的场景，特别是AI相关场景\n3. 分析用户目前可能使用的产品和技术栈\n4. 根据本应用中的Surface产品信息和微软最新类似解决方案案例\n5. 推荐相应的Surface最新产品，最好附带具体使用场景\n6. 强调产品的AI功能和智能体开发潜力\n7. 提供综合解决方案，包括产品配置、使用场景、AI功能应用和智能体开发建议\n\n当用户提到竞品参与竞争时，你还需要：\n1. 分析竞品的特点和优势\n2. 详细说明Surface针对竞品的打击优势\n3. 从性能、设计、生态系统、AI功能等多个维度进行对比\n4. 提供Surface如何在竞争中脱颖而出的具体理由\n\n请根据用户的问题，提供专业、准确的Surface产品相关回答，包括产品推荐、配置建议、场景应用、AI功能、智能体开发建议和竞品分析等信息。\n\n回答要求：\n1. 回复要条理清晰，使用适当的分段和标点符号\n2. 避免使用冗长的段落，将内容分解为简短的句子\n3. 对于复杂信息，使用列表格式（数字或项目符号）展示\n4. 保持语言简洁明了，避免重复和冗余\n5. 确保回复有正常的标点符号，包括句号、逗号、问号等\n6. 回答要自然流畅，不要使用过多的符号或标记' + productData;
                }
                
                // 构建完整的消息，包含系统提示词
                const fullMessage = `${systemPrompt}\n\n用户问题：${message}`;
                
                console.log('构建完整消息:', fullMessage.substring(0, 100) + '...');
                
                // 确保使用正确的模型名称
                const response = await window.aiModelInterface.getAIResponse(fullMessage, {
                    history: history,
                    model: window.aiModelInterface.doubaoModel
                });
                console.log('豆包模型响应:', response);
                
                // 处理AI回复，去除无关内容，整理逻辑和顺序
                const processedResponse = processAIResponse(response);
                console.log('处理后的响应:', processedResponse);
                
                return processedResponse;
            } else {
                console.error('AI模型接口未加载，无法调用豆包大模型');
                throw new Error('AI模型接口未加载');
            }
        } catch (error) {
            console.error('调用豆包大模型失败:', error);
            
            // 处理API限制错误
            if (error.message.includes('429') || error.message.includes('API调用达到限制') || error.message.includes('SetLimitExceeded')) {
                return '抱歉，豆包大模型当前调用量达到限制，请稍后再试。\n\n建议：\n1. 等待一段时间后再尝试\n2. 访问Model Activation页面调整或关闭"安全体验模式"\n3. 检查您的API密钥是否有效';
            }
            
            // 不使用本地响应，直接返回错误信息
            return '抱歉，豆包大模型调用失败，请稍后重试。错误信息：' + error.message;
        }
    };

    // 创建模型管理界面
    function createModelManagementUI() {
        // 检查是否已经存在模型管理界面
        if (document.getElementById('model-management')) {
            return;
        }

        // 创建模型管理按钮
        const modelManagementBtn = document.createElement('button');
        modelManagementBtn.id = 'model-management-btn';
        modelManagementBtn.className = 'fixed bottom-4 left-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center z-10';
        modelManagementBtn.innerHTML = '<i class="fa fa-cog mr-2"></i> 模型管理';
        
        // 创建模型管理面板
        const modelManagementPanel = document.createElement('div');
        modelManagementPanel.id = 'model-management';
        modelManagementPanel.className = 'fixed bottom-16 left-4 bg-white rounded-lg shadow-lg p-4 max-w-md z-10 hidden';
        modelManagementPanel.innerHTML = `
            <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-semibold text-gray-800">模型管理</h3>
                <button id="close-model-management" class="text-gray-400 hover:text-gray-600">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <div id="model-status" class="mb-4 p-3 bg-gray-50 rounded-lg">
                <p class="text-sm text-gray-600">检查模型状态中...</p>
            </div>
            <div id="model-list" class="mb-4">
                <h4 class="text-md font-medium text-gray-700 mb-2">可用模型</h4>
                <div class="space-y-2">
                    <!-- 模型列表将通过JS动态添加 -->
                </div>
            </div>
            <div id="model-actions" class="flex space-x-2">
                <button id="refresh-model-status" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors flex items-center">
                    <i class="fa fa-refresh mr-2"></i> 刷新状态
                </button>
            </div>
        `;

        // 添加到页面body
        document.body.appendChild(modelManagementBtn);
        document.body.appendChild(modelManagementPanel);

        // 添加事件监听器
        modelManagementBtn.addEventListener('click', function() {
            modelManagementPanel.classList.toggle('hidden');
            if (!modelManagementPanel.classList.contains('hidden')) {
                updateModelStatus();
            }
        });

        // 关闭按钮
        const closeBtn = document.getElementById('close-model-management');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                modelManagementPanel.classList.add('hidden');
            });
        }

        // 刷新状态按钮
        const refreshBtn = document.getElementById('refresh-model-status');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', updateModelStatus);
        }
    }

    // 更新模型状态
    async function updateModelStatus() {
        const modelStatusElement = document.getElementById('model-status');
        const modelListElement = document.getElementById('model-list');
        
        if (!modelStatusElement || !modelListElement) {
            return;
        }

        // 显示加载状态
        modelStatusElement.innerHTML = '<p class="text-sm text-gray-600">检查模型状态中...</p>';

        try {
            // 获取豆包文本模型状态
            const doubaoModelStatus = await checkDoubaoModelStatus();
            
            // 更新模型状态显示
            if (doubaoModelStatus.status === 'ok') {
                // 显示文本模型状态
                const currentModel = window.aiModelInterface ? window.aiModelInterface.doubaoModel : 'doubao-seed-2-0-pro-260215';
                modelStatusElement.innerHTML = `
                    <div class="flex items-start">
                        <div class="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mr-3">
                            <i class="fa fa-check text-green-600"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-800">豆包大模型服务运行正常</p>
                            <p class="text-xs text-gray-500">模型名称: ${currentModel}</p>
                        </div>
                    </div>
                `;
            } else {
                // 显示文本模型错误状态
                modelStatusElement.innerHTML = `
                    <div class="flex items-start">
                        <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mr-3">
                            <i class="fa fa-exclamation text-red-600"></i>
                        </div>
                        <div>
                            <p class="text-sm font-medium text-gray-800">豆包大模型服务不可用</p>
                            <p class="text-xs text-gray-500">${doubaoModelStatus.message}</p>
                        </div>
                    </div>
                `;
            }

            // 更新模型列表
            const modelListContent = document.createElement('div');
            modelListContent.className = 'space-y-2';
            
            // 添加文本模型
            const textModelItem = document.createElement('div');
            textModelItem.className = 'p-3 border border-gray-200 rounded-lg';
            const currentModel = window.aiModelInterface ? window.aiModelInterface.doubaoModel : 'doubao-seed-2-0-pro-260215';
            textModelItem.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h5 class="text-sm font-medium text-gray-800">${currentModel}</h5>
                        <p class="text-xs text-gray-500">豆包大模型</p>
                        <p class="text-xs text-gray-600 mt-1">支持文本和图片输入，文本输出</p>
                    </div>
                    <div>
                        <span class="px-2 py-1 ${doubaoModelStatus.status === 'ok' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'} text-xs rounded">${doubaoModelStatus.status === 'ok' ? '已启用' : '不可用'}</span>
                    </div>
                </div>
            `;
            modelListContent.appendChild(textModelItem);

            // 清空并添加新的模型列表
            modelListElement.querySelector('.space-y-2').remove();
            modelListElement.appendChild(modelListContent);
        } catch (error) {
            console.error('更新模型状态失败:', error);
            modelStatusElement.innerHTML = `
                <div class="flex items-start">
                    <div class="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mr-3">
                        <i class="fa fa-exclamation text-red-600"></i>
                    </div>
                    <div>
                        <p class="text-sm font-medium text-gray-800">检查模型状态失败</p>
                        <p class="text-xs text-gray-500">${error.message}</p>
                    </div>
                </div>
            `;
        }
    }

    // 增强表单处理和输入框焦点管理
    function enhanceFormAndInput() {
        // 直接在DOM中查找元素
        const aiMessageInput = document.getElementById('ai-message-input');
        
        console.log('enhanceFormAndInput: 查找输入框元素...', {
            aiMessageInput: !!aiMessageInput
        });
        
        if (aiMessageInput) {
            console.log('enhanceFormAndInput: 找到输入框，设置焦点管理...');
            
            // 移除现有的事件监听器
            const newInput = aiMessageInput.cloneNode(true);
            aiMessageInput.parentNode.replaceChild(newInput, aiMessageInput);
            
            // 为消息输入框添加多种事件监听器，确保能够获得焦点
            newInput.addEventListener('click', function(e) {
                e.stopPropagation();
                this.focus();
                console.log('enhanceFormAndInput: 输入框被点击，设置焦点');
            });
            
            newInput.addEventListener('mousedown', function(e) {
                e.stopPropagation();
                console.log('enhanceFormAndInput: 输入框鼠标按下，阻止事件冒泡');
            });
            
            newInput.addEventListener('focusin', function() {
                console.log('enhanceFormAndInput: 输入框获得焦点');
            });
            
            newInput.addEventListener('keydown', function(e) {
                // 允许用户使用键盘导航和编辑
                console.log('enhanceFormAndInput: 输入框按键事件:', e.key);
            });
            
            newInput.addEventListener('input', function() {
                // 实时更新输入框内容
                console.log('enhanceFormAndInput: 输入框内容更新');
            });
            
            // 确保输入框在模态框打开时能够获得焦点
            const modals = document.querySelectorAll('[id*="modal"], [class*="modal"]');
            modals.forEach(modal => {
                modal.addEventListener('shown.bs.modal', function() {
                    if (!modal.classList.contains('hidden')) {
                        setTimeout(() => {
                            newInput.focus();
                            console.log('enhanceFormAndInput: 模态框打开，设置输入框焦点');
                        }, 100);
                    }
                });
            });
            
            // 为所有可能的AI助手按钮添加点击事件监听器，确保模态框打开时重新设置输入框
            const aiAssistantBtns = document.querySelectorAll('[id*="ai-assistant"], [class*="ai-assistant"]');
            aiAssistantBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    console.log('enhanceFormAndInput: AI助手按钮被点击，重新设置输入框焦点管理...');
                    setTimeout(enhanceFormAndInput, 200); // 延迟200毫秒，确保模态框已经显示
                });
            });
            
            // 为语音输入按钮添加事件监听器，确保语音输入完成后重新设置输入框
            const voiceInputBtns = document.querySelectorAll('[id*="voice"], [class*="voice"], [id*="microphone"], [class*="microphone"]');
            voiceInputBtns.forEach(btn => {
                btn.addEventListener('click', function() {
                    console.log('enhanceFormAndInput: 语音输入按钮被点击，重新设置输入框焦点管理...');
                    setTimeout(() => {
                        const input = document.getElementById('ai-message-input');
                        if (input) {
                            input.focus();
                        }
                    }, 500); // 延迟500毫秒，确保语音输入完成
                });
            });
        } else {
            console.warn('enhanceFormAndInput: 未找到输入框元素');
        }
    }

    // 尝试设置表单处理器和输入框焦点管理，如果元素未找到则重试
    function tryEnhanceFormAndInput(attempts = 0) {
        enhanceFormAndInput();
        if (attempts < 30) { // 增加尝试次数
            setTimeout(() => tryEnhanceFormAndInput(attempts + 1), 300); // 减少重试间隔
        }
    }

    // 立即尝试设置表单处理器和输入框焦点管理
    tryEnhanceFormAndInput();

    // 创建模型管理界面
    createModelManagementUI();

    // 添加模型状态检查
    updateModelStatus();
}

// 保存原始的addMessage和addLoadingMessage函数（如果存在）
let originalAddMessage = window.addMessage;
let originalRemoveLoadingMessage = window.removeLoadingMessage;

// 确保addMessage函数存在
if (typeof window.addMessage !== 'function') {
    window.addMessage = function(type, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'user' ? 'flex items-start justify-end' : 'flex items-start';
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="bg-primary bg-opacity-10 rounded-lg p-3 shadow-sm max-w-[80%]">
                    <p class="text-gray-800">${content}</p>
                </div>
                <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ml-3">
                    <i class="fa fa-user text-gray-600"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                    <i class="fa fa-robot text-white"></i>
                </div>
                <div class="bg-white rounded-lg p-3 shadow-sm max-w-[80%]">
                    <p class="text-gray-800">${content}</p>
                </div>
            `;
        }
        
        // 尝试获取聊天容器
        const aiChatContainer = document.getElementById('ai-chat-container');
        if (aiChatContainer) {
            aiChatContainer.appendChild(messageDiv);
            aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
        } else {
            console.error('聊天容器未找到');
        }
        return messageDiv;
    };
}

// 确保addLoadingMessage函数存在
if (typeof window.addLoadingMessage !== 'function') {
    window.addLoadingMessage = function() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'flex items-start';
        loadingDiv.id = 'ai-loading-' + Date.now();
        loadingDiv.innerHTML = `
            <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                <i class="fa fa-robot text-white"></i>
            </div>
            <div class="bg-white rounded-lg p-3 shadow-sm flex items-center">
                <div class="animate-pulse flex space-x-2">
                    <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                    <div class="w-2 h-2 rounded-full bg-gray-400"></div>
                </div>
            </div>
        `;
        
        const aiChatContainer = document.getElementById('ai-chat-container');
        if (aiChatContainer) {
            aiChatContainer.appendChild(loadingDiv);
            aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
        } else {
            console.error('聊天容器未找到');
        }
        return loadingDiv.id;
    };
}

// 确保removeLoadingMessage函数存在
if (typeof window.removeLoadingMessage !== 'function') {
    window.removeLoadingMessage = function(id) {
        const loadingDiv = document.getElementById(id);
        if (loadingDiv) {
            loadingDiv.remove();
        } else {
            console.error('加载消息未找到:', id);
        }
    };
}

// 存储音频上下文和源的全局变量
let doubaoAudioContext = null;
let doubaoAudioSource = null;

// 语音合成功能
function speakText(text) {
    try {
        // 检查浏览器是否支持语音合成
        if ('speechSynthesis' in window) {
            // 检查语音合成是否正在进行
            if (window.speechSynthesis.speaking) {
                console.log('语音合成正在进行，跳过当前请求');
                return;
            }
            
            console.log('开始语音合成:', text.substring(0, 50) + '...');
            
            // 限制语音合成的文本长度，避免过长导致卡死
            const maxLength = 1000;
            const speakText = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
            
            const utterance = new SpeechSynthesisUtterance(speakText);
            utterance.lang = 'zh-CN';
            utterance.rate = 0.9; // 稍微减慢语速，让语音更自然
            utterance.pitch = 1.1; // 稍微提高音调，让语音更生动
            utterance.volume = 1.0;
            
            // 尝试使用更自然的语音（如果可用）
            const voices = window.speechSynthesis.getVoices();
            if (voices.length > 0) {
                // 尝试找到中文语音
                const chineseVoice = voices.find(voice => 
                    voice.lang === 'zh-CN' || 
                    voice.lang === 'zh' ||
                    voice.name.includes('Chinese') ||
                    voice.name.includes('中文')
                );
                
                if (chineseVoice) {
                    utterance.voice = chineseVoice;
                    console.log('使用语音:', chineseVoice.name);
                } else {
                    // 如果没有中文语音，使用第一个可用语音
                    utterance.voice = voices[0];
                    console.log('使用默认语音:', voices[0].name);
                }
            }
            
            // 添加错误处理
            utterance.onerror = function(event) {
                console.error('语音合成错误:', event);
            };
            
            utterance.onend = function() {
                console.log('语音合成结束');
            };
            
            speechSynthesis.speak(utterance);
            console.log('语音合成开始');
        } else {
            console.warn('浏览器不支持语音合成');
        }
    } catch (error) {
        console.error('语音合成失败:', error);
    }
}

// 使用浏览器内置语音朗读
function speakTextWithDoubao(text) {
    try {
        console.log('使用浏览器内置语音朗读:', text.substring(0, 50) + '...');
        // 直接使用浏览器内置语音合成
        speakText(text);
    } catch (error) {
        console.error('语音朗读失败:', error);
        console.error('错误详情:', error.message);
    }
}

// 停止语音朗读功能
function stopReading() {
    try {
        // 停止浏览器语音合成
        if ('speechSynthesis' in window) {
            if (window.speechSynthesis.speaking) {
                window.speechSynthesis.cancel();
                console.log('浏览器语音朗读已停止');
            }
        }
        
        // 停止豆包TTS语音
        if (doubaoAudioSource) {
            try {
                doubaoAudioSource.stop();
                console.log('豆包语音朗读已停止');
                // 清理资源
                doubaoAudioSource = null;
                doubaoAudioContext = null;
            } catch (error) {
                console.error('停止豆包语音失败:', error);
            }
        }
        
        if (!window.speechSynthesis.speaking && !doubaoAudioSource) {
            console.log('没有正在进行的语音朗读');
        }
    } catch (error) {
        console.error('停止语音朗读失败:', error);
    }
}

// 暴露停止语音朗读的函数到全局作用域
window.stopReading = stopReading;

// 增强addMessage函数，只保留文字输出
const enhancedAddMessage = window.addMessage;
window.addMessage = function(type, content) {
    try {
        // 确保消息正常显示
        let result = null;
        if (enhancedAddMessage) {
            result = enhancedAddMessage(type, content);
        } else {
            // 如果没有原始函数，使用默认实现
            const messageDiv = document.createElement('div');
            messageDiv.className = type === 'user' ? 'flex items-start justify-end' : 'flex items-start';
            
            if (type === 'user') {
                messageDiv.innerHTML = `
                    <div class="bg-primary bg-opacity-10 rounded-lg p-3 shadow-sm max-w-[80%]">
                        <p class="text-gray-800">${content}</p>
                    </div>
                    <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ml-3">
                        <i class="fa fa-user text-gray-600"></i>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                        <i class="fa fa-robot text-white"></i>
                    </div>
                    <div class="bg-white rounded-lg p-3 shadow-sm max-w-[80%]">
                        <p class="text-gray-800">${content}</p>
                    </div>
                `;
            }
            
            // 尝试获取聊天容器
            const aiChatContainer = document.getElementById('ai-chat-container');
            if (aiChatContainer) {
                aiChatContainer.appendChild(messageDiv);
                aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
                result = messageDiv;
            } else {
                console.error('聊天容器未找到');
            }
        }
        
        // 移除语音合成功能，只保留文字输出
        console.log('消息已显示，类型:', type, '内容长度:', content.length);
        
        return result;
    } catch (error) {
        console.error('addMessage函数执行失败:', error);
        // 即使出错，也要确保消息正常显示
        const messageDiv = document.createElement('div');
        messageDiv.className = type === 'user' ? 'flex items-start justify-end' : 'flex items-start';
        
        if (type === 'user') {
            messageDiv.innerHTML = `
                <div class="bg-primary bg-opacity-10 rounded-lg p-3 shadow-sm max-w-[80%]">
                    <p class="text-gray-800">${content}</p>
                </div>
                <div class="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 ml-3">
                    <i class="fa fa-user text-gray-600"></i>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0 mr-3">
                    <i class="fa fa-robot text-white"></i>
                </div>
                <div class="bg-white rounded-lg p-3 shadow-sm max-w-[80%]">
                    <p class="text-gray-800">${content}</p>
                </div>
            `;
        }
        
        // 尝试获取聊天容器
        const aiChatContainer = document.getElementById('ai-chat-container');
        if (aiChatContainer) {
            aiChatContainer.appendChild(messageDiv);
            aiChatContainer.scrollTop = aiChatContainer.scrollHeight;
        }
        return messageDiv;
    }
};

// 增强语音输入功能
function enhanceVoiceInput() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setupEnhancedVoiceInput();
        });
    } else {
        setupEnhancedVoiceInput();
    }
}

// 移除停止语音按钮的设置，因为不再需要语音输出功能

// 设置增强的语音输入功能
function setupEnhancedVoiceInput() {
    // 查找所有可能的语音输入按钮，但排除小尹同学的语音按钮
    const voiceInputBtns = document.querySelectorAll('[id*="voice"], [class*="voice"], [id*="microphone"], [class*="microphone"]');
    const aiMessageInput = document.getElementById('ai-message-input');
    
    console.log('setupEnhancedVoiceInput: 查找语音输入按钮...', {
        voiceInputBtns: voiceInputBtns.length,
        aiMessageInput: !!aiMessageInput
    });
    
    // 存储语音识别实例
    let recognitionInstance = null;
    
    voiceInputBtns.forEach(voiceInputBtn => {
        // 排除小尹同学的语音按钮
        if (voiceInputBtn.id === 'xiaoyin-voice-input' || voiceInputBtn.id === 'xiaoyin-stop-voice') {
            console.log('setupEnhancedVoiceInput: 跳过小尹同学的语音按钮:', voiceInputBtn.id);
            return;
        }
        
        console.log('setupEnhancedVoiceInput: 找到语音输入按钮:', voiceInputBtn.id || voiceInputBtn.className);
        
        if (voiceInputBtn && aiMessageInput) {
            // 移除现有的事件监听器
            const newVoiceBtn = voiceInputBtn.cloneNode(true);
            voiceInputBtn.parentNode.replaceChild(newVoiceBtn, voiceInputBtn);
            
            // 添加新的增强事件监听器
            newVoiceBtn.addEventListener('click', function() {
                console.log('setupEnhancedVoiceInput: 语音输入按钮被点击');
                
                // 检查按钮状态，判断是开始还是停止
                if (newVoiceBtn.innerHTML.includes('开始语音')) {
                    // 检查浏览器支持
                    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
                        alert('您的浏览器不支持语音识别功能，请使用Chrome或Edge浏览器');
                        return;
                    }
                    
                    try {
                        console.log('语音识别初始化开始');
                        
                        // 首先请求麦克风权限
                        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                            console.log('请求麦克风权限...');
                            navigator.mediaDevices.getUserMedia({ audio: true })
                                .then(function(stream) {
                                    console.log('麦克风权限获取成功');
                                    stream.getTracks().forEach(track => track.stop()); // 停止流，因为我们只需要权限
                                    
                                    // 权限获取成功后，初始化语音识别
                                    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
                                    recognitionInstance = new SpeechRecognition();
                                    
                                    // 配置识别参数
                                    recognitionInstance.lang = 'zh-CN';
                                    recognitionInstance.continuous = true; // 设置为持续模式，直到用户手动停止
                                    recognitionInstance.interimResults = true; // 启用中间结果，提供更流畅的体验
                                    recognitionInstance.maxAlternatives = 1;
                                    
                                    // 更新按钮状态为停止按钮
                                    newVoiceBtn.innerHTML = '<i class="fa fa-stop"></i> 停止语音';
                                    newVoiceBtn.disabled = false; // 保持按钮可用，用于手动停止
                                    
                                    // 结果处理
                                    let finalTranscript = '';
                                    let isUserEditing = false;
                                    
                                    // 为输入框添加编辑事件监听器
                                    const currentInput = document.getElementById('ai-message-input');
                                    if (currentInput) {
                                        // 当用户开始编辑时，暂停语音识别
                                        currentInput.addEventListener('focus', function() {
                                            isUserEditing = true;
                                            console.log('用户开始编辑输入框');
                                        });
                                        
                                        // 当用户停止编辑时，恢复语音识别
                                        currentInput.addEventListener('blur', function() {
                                            isUserEditing = false;
                                            console.log('用户停止编辑输入框');
                                        });
                                        
                                        // 当用户输入时，暂停语音识别
                                        currentInput.addEventListener('input', function() {
                                            isUserEditing = true;
                                            console.log('用户正在输入');
                                        });
                                    }
                                    
                                    recognitionInstance.onresult = function(event) {
                                        // 如果用户正在编辑，跳过更新
                                        if (isUserEditing) {
                                            console.log('用户正在编辑，跳过语音识别结果更新');
                                            return;
                                        }
                                        
                                        // 处理所有识别结果
                                        for (let i = event.resultIndex; i < event.results.length; i++) {
                                            const transcript = event.results[i][0].transcript;
                                            if (event.results[i].isFinal) {
                                                // 最终结果
                                                finalTranscript += transcript;
                                                console.log('语音识别最终结果:', finalTranscript);
                                                console.log('最终结果长度:', finalTranscript.length);
                                                // 每次获取最新的输入框元素，避免引用旧元素
                                                const currentInput = document.getElementById('ai-message-input');
                                                if (currentInput) {
                                                    // 确保输入框能够容纳长内容
                                                    currentInput.maxLength = 10000; // 设置最大长度为10000字符
                                                    // 只有当用户没有在编辑时才更新输入框
                                                    if (!isUserEditing) {
                                                        currentInput.value = finalTranscript;
                                                        console.log('输入框值长度:', currentInput.value.length);
                                                    }
                                                } else {
                                                    console.error('语音识别结果处理失败: 未找到输入框元素');
                                                }
                                            } else {
                                                // 中间结果
                                                console.log('语音识别中间结果:', transcript);
                                            }
                                        }
                                    };
                                    
                                    // 结束处理
                                    recognitionInstance.onend = function() {
                                        newVoiceBtn.innerHTML = '<i class="fa fa-microphone"></i> 开始语音';
                                        newVoiceBtn.disabled = false;
                                        recognitionInstance = null;
                                        console.log('语音识别结束');
                                    };
                                    
                                    // 错误处理
                                    recognitionInstance.onerror = function(event) {
                                        console.error('语音识别错误:', event.error);
                                        newVoiceBtn.innerHTML = '<i class="fa fa-microphone"></i> 开始语音';
                                        newVoiceBtn.disabled = false;
                                        recognitionInstance = null;
                                        
                                        // 提供具体的错误信息
                                        let errorMessage = '语音识别失败，请重试';
                                        switch (event.error) {
                                            case 'no-speech':
                                                errorMessage = '未检测到语音，请靠近麦克风并清晰说话';
                                                break;
                                            case 'audio-capture':
                                                errorMessage = '无法访问麦克风，请检查麦克风权限设置';
                                                break;
                                            case 'not-allowed':
                                                errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
                                                break;
                                            case 'network':
                                                errorMessage = '网络连接错误，请检查网络连接';
                                                break;
                                        }
                                        alert(errorMessage);
                                    };
                                    
                                    // 开始识别
                                    recognitionInstance.start();
                                    console.log('语音识别开始');
                                })
                                .catch(function(error) {
                                    console.error('麦克风权限请求失败:', error);
                                    newVoiceBtn.innerHTML = '<i class="fa fa-microphone"></i> 开始语音';
                                    newVoiceBtn.disabled = false;
                                    recognitionInstance = null;
                                    
                                    let errorMessage = '麦克风权限请求失败';
                                    if (error.name === 'NotAllowedError') {
                                        errorMessage = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
                                    } else if (error.name === 'NotFoundError') {
                                        errorMessage = '未找到麦克风设备，请检查麦克风是否已连接';
                                    } else if (error.name === 'NotReadableError') {
                                        errorMessage = '麦克风被其他应用占用，请关闭其他使用麦克风的应用';
                                    }
                                    
                                    alert(errorMessage);
                                });
                        } else {
                            console.error('浏览器不支持getUserMedia API');
                            newVoiceBtn.innerHTML = '<i class="fa fa-microphone"></i> 开始语音';
                            newVoiceBtn.disabled = false;
                            alert('您的浏览器不支持麦克风访问，请使用Chrome或Edge浏览器');
                        }
                        
                    } catch (error) {
                        console.error('语音识别初始化错误:', error);
                        newVoiceBtn.innerHTML = '<i class="fa fa-microphone"></i> 开始语音';
                        newVoiceBtn.disabled = false;
                        recognitionInstance = null;
                        alert('语音识别初始化失败，请重试。错误信息：' + error.message);
                    }
                } else if (newVoiceBtn.innerHTML.includes('停止语音')) {
                    // 停止语音识别
                    console.log('用户手动停止语音识别');
                    if (recognitionInstance) {
                        try {
                            recognitionInstance.stop();
                            console.log('语音识别已停止');
                        } catch (error) {
                            console.error('停止语音识别时出错:', error);
                        }
                    } else {
                        console.warn('没有正在进行的语音识别实例');
                    }
                    // 重置按钮状态
                    newVoiceBtn.innerHTML = '<i class="fa fa-microphone"></i> 开始语音';
                    newVoiceBtn.disabled = false;
                    recognitionInstance = null;
                }
            });
            
            console.log('增强语音输入功能已设置');
        }
    });
    
    if (!voiceInputBtns.length || !aiMessageInput) {
        console.warn('语音输入按钮或消息输入框未找到');
    }
}

// 确保在DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，开始初始化AI助手...');
    
    // 等待AI模型接口就绪
    function waitForAIModelInterface(attempts = 0) {
        console.log('检查AI模型接口状态...', {
            aiModelInterface: typeof window.aiModelInterface,
            attempts: attempts
        });
        
        if (typeof window.aiModelInterface === 'object' && window.aiModelInterface !== null) {
            console.log('AI模型接口就绪，开始初始化AI助手功能...');
            // 初始化AI模型接口
            window.aiModelInterface.initialize().then(success => {
                console.log('AI模型接口初始化结果:', success);
                // 无论初始化是否成功，都初始化AI助手功能
                // 因为我们只使用豆包模型，即使初始化失败，也可以尝试调用
                enhanceAIAssistant();
                enhanceVoiceInput();
                console.log('AI助手初始化完成');
            }).catch(error => {
                console.error('AI模型接口初始化失败:', error);
                // 即使初始化失败，也初始化AI助手功能
                enhanceAIAssistant();
                enhanceVoiceInput();
                console.log('AI助手初始化完成（豆包模型初始化失败）');
            });
        } else if (attempts < 50) { // 增加尝试次数到50次
            console.log('AI模型接口未就绪，等待100毫秒后重试...');
            setTimeout(() => waitForAIModelInterface(attempts + 1), 100);
        } else {
            console.error('AI模型接口长时间未就绪，无法初始化AI助手功能');
            // 即使AI模型接口未就绪，也尝试初始化AI助手功能
            enhanceAIAssistant();
            enhanceVoiceInput();
            console.log('AI助手初始化完成（AI模型接口未就绪）');
        }
    }
    
    // 开始等待AI模型接口
    waitForAIModelInterface();
});
