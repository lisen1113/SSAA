const { spawn } = require('child_process');

console.log('=== 直接测试Ollama模型调用 ===\n');

// 测试函数
function testModel(modelName) {
    return new Promise((resolve, reject) => {
        console.log(`测试模型: ${modelName}`);
        
        const child = spawn('ollama', ['run', modelName]);
        
        let stdout = '';
        let stderr = '';
        
        child.stdout.on('data', (data) => {
            stdout += data.toString();
            console.log(`[${modelName} 输出] ${data.toString().trim()}`);
        });
        
        child.stderr.on('data', (data) => {
            stderr += data.toString();
            console.log(`[${modelName} 错误] ${data.toString().trim()}`);
        });
        
        child.on('close', (code) => {
            console.log(`[${modelName}] 进程退出，代码: ${code}`);
            if (code === 0) {
                resolve({ success: true, stdout, stderr });
            } else {
                reject({ success: false, code, stdout, stderr });
            }
        });
        
        child.on('error', (error) => {
            console.log(`[${modelName}] 启动失败: ${error.message}`);
            reject({ success: false, error: error.message });
        });
        
        // 发送输入
        setTimeout(() => {
            console.log(`[${modelName}] 发送输入: 你好`);
            child.stdin.write('你好\n');
            child.stdin.end();
        }, 1000);
        
        // 超时处理
        setTimeout(() => {
            if (!child.killed) {
                console.log(`[${modelName}] 超时，终止进程`);
                child.kill();
                reject({ success: false, error: '超时' });
            }
        }, 30000);
    });
}

// 测试所有模型
async function testAllModels() {
    const models = ['gemma3:4b', 'llama2:7b', 'mistral:7b'];
    
    for (const model of models) {
        try {
            console.log(`\n--- 开始测试 ${model} ---`);
            const result = await testModel(model);
            console.log(`--- ${model} 测试成功 ---\n`);
        } catch (error) {
            console.log(`--- ${model} 测试失败: ${error.error || '未知错误'} ---\n`);
        }
    }
    
    console.log('=== 测试完成 ===');
}

// 开始测试
testAllModels();
