const express = require('express');
const cors = require('cors');
const { execSync, exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3002;

app.use(cors());
app.use(express.json());

// 模型配置
const modelConfig = {
  // 默认使用中文支持好的模型
  defaultModel: 'qwen2:1.5b',
  // 模型存储路径
  modelPath: path.join(__dirname, 'models'),
  // 支持的模型列表
  supportedModels: [
    { name: 'qwen2:1.5b', size: '~1.1GB', performance: 'very fast', description: '超轻量级中文模型，适合基本对话和产品推荐' },
    { name: 'qwen2:7b', size: '~4.2GB', performance: 'fast', description: '轻量级中文模型，适合复杂对话和详细推荐' },
    { name: 'gemma3:4b', size: '~3.3GB', performance: 'fast', description: '超轻量级模型，适合基本对话和产品推荐' },
    { name: 'llama2:7b', size: '~3.8GB', performance: 'fast', description: '轻量级模型，适合基本对话和产品推荐' },
    { name: 'mistral:7b', size: '~4.1GB', performance: 'medium', description: '中量级模型，适合复杂对话和详细推荐' }
  ],
  // 推理参数
  inferenceParams: {
    temperature: 0.3,     // 降低温度值，减少随机性
    maxTokens: 400,        // 减少最大 token 数
    topP: 0.7,            // 降低 topP，减少候选词数量
    maxTime: 30000         // 设置最大推理时间（毫秒）
  }
};

// 确保模型目录存在
if (!fs.existsSync(modelConfig.modelPath)) {
  fs.mkdirSync(modelConfig.modelPath, { recursive: true });
}

// Surface产品知识库
const productKnowledge = `
Surface产品知识：
1. Surface Pro 12：二合一设备，适合移动办公和教学，支持触控笔，价格范围：8000-15000元
2. Surface Laptop 13：轻薄笔记本，适合日常办公，键盘舒适，价格范围：7000-12000元
3. Surface Laptop Studio 2：高性能设备，适合创意设计，支持多种形态，价格范围：12000-20000元
4. Surface Laptop Go 3：入门级设备，适合学生和基础办公，价格范围：5000-8000元
5. Surface Pro 13：高端二合一设备，适合专业用户和创意工作，价格范围：10000-18000元
6. Surface Go 4：超便携设备，适合轻度办公和娱乐，价格范围：4000-6000元
7. Surface Hub 3：协作显示设备，适合会议室和团队协作，价格范围：20000-50000元

适用场景：
- 教育行业：Surface Pro 12 + Surface Laptop Go 3 组合，满足不同教学场景
- 创意设计：Surface Laptop Studio 2 + Surface Pro 13 组合，高性能和便携性
- 医疗行业：Surface Pro 12，适合移动查房和床边护理
- 金融行业：Surface Laptop 13，适合专业办公和客户演示
- 制造业：Surface Go 4，适合现场作业和数据采集
- 政府部门：Surface Pro 12，适合移动办公和安全需求

预算建议：
- 5000元以下：Surface Go 4
- 5000-8000元：Surface Laptop Go 3
- 8000-12000元：Surface Pro 12 或 Surface Laptop 13
- 12000-15000元：Surface Pro 13 或高配 Surface Laptop 13
- 15000元以上：Surface Laptop Studio 2 或 Surface Hub 3
`;

// 生成提示模板
function generatePrompt(message, history = '') {
  return `你是一个专业的Surface产品顾问，根据以下产品知识和用户需求，提供详细的解决方案建议。

${productKnowledge}

对话历史：
${history}

用户最新消息：${message}

请使用中文提供专业、详细的Surface产品解决方案建议，包括：
1. 推荐的产品组合
2. 推荐理由（基于用户需求和产品特点）
3. 预算范围
4. 适用场景分析
5. 其他相关建议

确保回答全面、专业、有针对性，直接解答用户的问题，不要使用任何引导性语言。所有回复必须使用中文。`;
}

// 检查Ollama是否安装
function checkOllamaInstalled() {
  try {
    execSync('ollama --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// 检查模型是否已下载
function checkModelExists(modelName) {
  try {
    const result = execSync('ollama list', { encoding: 'utf8' });
    return result.includes(modelName);
  } catch (error) {
    return false;
  }
}

// 下载模型
function downloadModel(modelName) {
  try {
    execSync(`ollama pull ${modelName}`, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('模型下载失败:', error);
    return false;
  }
}

// 本地模型推理函数
function inference(message, history = '', modelName = modelConfig.defaultModel) {
    return new Promise((resolve, reject) => {
        try {
            console.log(`开始推理，模型: ${modelName}, 消息: ${message.substring(0, 50)}...`);
            
            // 检查Ollama是否安装
            if (!checkOllamaInstalled()) {
                console.error('Ollama未安装');
                reject(new Error('Ollama未安装，请先安装Ollama推理引擎'));
                return;
            }

            // 检查模型是否存在，不存在则下载
            if (!checkModelExists(modelName)) {
                console.log(`模型 ${modelName} 不存在，正在下载...`);
                const success = downloadModel(modelName);
                if (!success) {
                    console.error(`模型 ${modelName} 下载失败`);
                    reject(new Error(`模型 ${modelName} 下载失败`));
                    return;
                }
            }

            // 生成提示
            const prompt = generatePrompt(message, history);
            console.log(`生成提示，长度: ${prompt.length} 字符`);

            // 使用Ollama的API模式（更稳定）
            const { exec } = require('child_process');
            
            // 增加超时时间到5分钟
            const timeout = 300000;
            
            // 使用临时文件传递提示内容，避免命令行长度限制和特殊字符问题
            const tempFilePath = path.join(__dirname, `temp_prompt_${Date.now()}.txt`);
            fs.writeFileSync(tempFilePath, prompt, 'utf8');
            console.log(`生成临时文件: ${tempFilePath}`);
            
            // 构建Ollama命令（使用PowerShell，确保正确处理中文字符编码）
            const command = `powershell -Command "& { Get-Content '${tempFilePath}' -Encoding UTF8 | ollama run ${modelName} }"`;
            console.log(`执行命令: ${command.substring(0, 100)}...`);
            
            let stdout = '';
            let stderr = '';
            
            const child = exec(command, {
                encoding: 'utf8',
                timeout: timeout,
                maxBuffer: 1024 * 1024 * 20 // 20MB缓冲区
            });
            
            // 收集标准输出
            child.stdout.on('data', (data) => {
                // 确保正确处理编码
                let output = data;
                if (Buffer.isBuffer(data)) {
                    // 尝试使用UTF-8编码
                    output = data.toString('utf8');
                }
                // 过滤掉ANSI转义序列（进度条等）
                const filteredData = output.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '');
                stdout += filteredData;
                console.log(`收到输出: ${filteredData.substring(0, 50)}...`);
            });
            
            // 收集标准错误
            child.stderr.on('data', (data) => {
                stderr += data.toString();
                console.error(`收到错误: ${data.toString()}`);
            });
            
            // 子进程退出
            child.on('exit', (code, signal) => {
                console.log(`子进程退出，代码: ${code}, 信号: ${signal}`);
                
                // 清理临时文件
                try {
                    if (fs.existsSync(tempFilePath)) {
                        fs.unlinkSync(tempFilePath);
                        console.log(`清理临时文件: ${tempFilePath}`);
                    }
                } catch (cleanupError) {
                    console.error('清理临时文件失败:', cleanupError);
                }
                
                if (stderr) {
                    console.error('推理 stderr:', stderr);
                }
                
                if (code !== 0) {
                    console.error('推理错误，退出代码:', code);
                    console.error('标准输出:', stdout);
                    reject(new Error(`模型推理失败，退出代码: ${code}`));
                    return;
                }
                
                console.log(`推理成功，输出长度: ${stdout.length} 字符`);
                console.log(`输出内容: ${stdout.substring(0, 100)}${stdout.length > 100 ? '...' : ''}`);
                resolve(stdout.trim());
            });

            // 监听子进程错误事件
            child.on('error', (err) => {
                console.error('子进程错误:', err);
                reject(new Error(`子进程错误: ${err.message}`));
            });

        } catch (error) {
            console.error('推理错误:', error);
            reject(new Error(`模型推理失败: ${error.message}`));
        }
    });
}

// 本地模型API端点
app.post('/api/local/chat', async (req, res) => {
  try {
    const { message, history = '', model = modelConfig.defaultModel } = req.body;

    if (!message) {
      return res.status(400).json({ error: '消息不能为空' });
    }

    // 执行模型推理
    const response = await inference(message, history, model);

    res.json({ response });
  } catch (error) {
    console.error('API错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 模型状态检查
app.get('/api/local/status', (req, res) => {
  try {
    // 检查Ollama是否安装
    const ollamaInstalled = checkOllamaInstalled();

    if (!ollamaInstalled) {
      return res.json({
        status: 'error',
        message: 'Ollama未安装，请先安装Ollama推理引擎',
        installUrl: 'https://ollama.com/download'
      });
    }

    // 获取已安装的模型
    const installedModels = [];
    try {
      const result = execSync('ollama list', { encoding: 'utf8' });
      const lines = result.split('\n');
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const parts = line.split(/\s+/);
          if (parts.length >= 2) {
            installedModels.push({
              name: parts[0],
              size: parts[1]
            });
          }
        }
      }
    } catch (error) {
      console.error('获取模型列表失败:', error);
    }

    // 检查系统资源
    let systemInfo = {};
    try {
      if (process.platform === 'win32') {
        const result = execSync('wmic cpu get Name,NumberOfCores,NumberOfLogicalProcessors', { encoding: 'utf8' });
        systemInfo.cpu = result;
        const memResult = execSync('wmic OS get FreePhysicalMemory,TotalVisibleMemorySize', { encoding: 'utf8' });
        systemInfo.memory = memResult;
      } else {
        const result = execSync('uname -a && lscpu | grep -E "Model name|CPU\(s\)|Thread|Core" && free -h', { encoding: 'utf8' });
        systemInfo = result;
      }
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }

    res.json({
      status: 'ok',
      ollamaInstalled,
      installedModels,
      supportedModels: modelConfig.supportedModels,
      defaultModel: modelConfig.defaultModel,
      systemInfo,
      message: '本地模型服务运行正常'
    });
  } catch (error) {
    console.error('状态检查错误:', error);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// 下载模型
app.post('/api/local/download-model', (req, res) => {
  try {
    const { modelName } = req.body;

    if (!modelName) {
      return res.status(400).json({ error: '模型名称不能为空' });
    }

    // 检查模型是否在支持列表中
    const modelExists = modelConfig.supportedModels.some(model => model.name === modelName);
    if (!modelExists) {
      return res.status(400).json({ error: '不支持的模型' });
    }

    // 下载模型
    console.log(`开始下载模型: ${modelName}`);
    const success = downloadModel(modelName);

    if (success) {
      res.json({ status: 'ok', message: `模型 ${modelName} 下载成功` });
    } else {
      res.status(500).json({ error: `模型 ${modelName} 下载失败` });
    }
  } catch (error) {
    console.error('下载模型错误:', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取模型配置
app.get('/api/local/config', (req, res) => {
  res.json({
    modelConfig,
    systemInfo: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version
    }
  });
});

// 健康检查
app.get('/api/local/health', (req, res) => {
  res.json({ status: 'ok', message: '本地模型服务运行正常' });
});

// 启动服务器
app.listen(port, () => {
  console.log(`本地模型服务运行在 http://localhost:${port}`);
  console.log('可用API端点:');
  console.log(`- POST http://localhost:${port}/api/local/chat - 本地模型聊天`);
  console.log(`- GET http://localhost:${port}/api/local/status - 模型状态检查`);
  console.log(`- POST http://localhost:${port}/api/local/download-model - 下载模型`);
  console.log(`- GET http://localhost:${port}/api/local/config - 获取模型配置`);
  console.log(`- GET http://localhost:${port}/api/local/health - 健康检查`);
  
  // 检查Ollama是否安装
  if (!checkOllamaInstalled()) {
    console.log('\n警告: Ollama未安装，请访问 https://ollama.com/download 下载并安装');
  } else {
    console.log('\nOllama已安装，服务就绪');
  }
});

// 导出模块（用于其他脚本调用）
module.exports = {
  app,
  modelConfig,
  checkOllamaInstalled,
  checkModelExists,
  downloadModel,
  inference
};
