// 模型兼容性和连接机制测试脚本
// 运行方式：node test-model-compatibility.js

const http = require('http');

// 测试模型状态端点
function testModelStatus() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/local/status',
            method: 'GET'
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const status = JSON.parse(data);
                    resolve(status);
                } catch (error) {
                    reject(new Error('Failed to parse model status response'));
                }
            });
        });
        
        req.on('error', (e) => {
            reject(new Error(`Failed to connect to model server: ${e.message}`));
        });
        
        req.end();
    });
}

// 测试使用不同模型的聊天功能
function testModelChat(modelName, message) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: message,
            model: modelName
        });
        
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: '/api/local/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    console.log(`原始响应数据 (${modelName}):`, data);
                    const response = JSON.parse(data);
                    console.log(`解析后的响应 (${modelName}):`, response);
                    console.log(`响应中的response字段 (${modelName}):`, response.response);
                    console.log(`response字段类型 (${modelName}):`, typeof response.response);
                    resolve({ model: modelName, response: response.response });
                } catch (error) {
                    console.error(`解析响应失败 (${modelName}):`, error);
                    console.error(`原始响应数据 (${modelName}):`, data);
                    reject(new Error(`Failed to parse chat response for model ${modelName}: ${error.message}`));
                }
            });
        });
        
        req.on('error', (e) => {
            reject(new Error(`Failed to chat with model ${modelName}: ${e.message}`));
        });
        
        req.write(postData);
        req.end();
    });
}

// 测试连接稳定性（多次请求）
function testConnectionStability(modelName, message, iterations = 5) {
    console.log(`\n测试连接稳定性：${modelName}，${iterations}次请求`);
    
    const promises = [];
    for (let i = 0; i < iterations; i++) {
        promises.push(
            testModelChat(modelName, `${message} (测试 ${i + 1})`)
                .then(result => {
                    console.log(`✓ 请求 ${i + 1} 成功`);
                    return result;
                })
                .catch(error => {
                    console.log(`✗ 请求 ${i + 1} 失败: ${error.message}`);
                    throw error;
                })
        );
    }
    
    return Promise.all(promises);
}

// 主测试函数
async function runModelCompatibilityTests() {
    console.log('=== 模型兼容性和连接机制测试开始 ===');
    
    try {
        // 1. 测试模型状态
        console.log('\n1. 测试模型状态...');
        const modelStatus = await testModelStatus();
        console.log('模型状态获取成功:');
        console.log(`- 服务状态: ${modelStatus.status}`);
        console.log(`- Ollama安装: ${modelStatus.ollamaInstalled}`);
        console.log(`- 已安装模型: ${modelStatus.installedModels.length}`);
        modelStatus.installedModels.forEach(model => {
            console.log(`  * ${model.name}`);
        });
        console.log(`- 支持的模型: ${modelStatus.supportedModels.length}`);
        modelStatus.supportedModels.forEach(model => {
            console.log(`  * ${model.name} (${model.size}, ${model.performance})`);
        });
        
        // 2. 测试使用不同模型的聊天功能
        console.log('\n2. 测试模型聊天功能...');
        const testMessage = '你好，我需要Surface产品推荐，预算在10000元左右';
        
        const chatResults = [];
        for (const model of modelStatus.installedModels) {
            console.log(`\n测试模型: ${model.name}`);
            try {
                const result = await testModelChat(model.name, testMessage);
                console.log(`✓ 模型 ${model.name} 响应成功`);
                console.log(`  响应长度: ${result.response.length} 字符`);
                console.log(`  响应内容: ${result.response.substring(0, 150)}${result.response.length > 150 ? '...' : ''}`);
                chatResults.push(result);
            } catch (error) {
                console.log(`✗ 模型 ${model.name} 测试失败: ${error.message}`);
            }
        }
        
        // 3. 测试连接稳定性
        console.log('\n3. 测试连接稳定性...');
        if (modelStatus.installedModels.length > 0) {
            const testModel = modelStatus.installedModels[0].name; // 使用第一个已安装的模型
            try {
                const stabilityResults = await testConnectionStability(testModel, '测试连接稳定性');
                console.log(`✓ 连接稳定性测试通过，${stabilityResults.length} 次请求全部成功`);
            } catch (error) {
                console.log(`✗ 连接稳定性测试失败: ${error.message}`);
            }
        }
        
        // 4. 测试默认模型
        console.log('\n4. 测试默认模型...');
        try {
            const defaultResult = await testModelChat('default', testMessage);
            console.log('✓ 默认模型响应成功');
            console.log(`  响应长度: ${defaultResult.response.length} 字符`);
        } catch (error) {
            console.log(`✗ 默认模型测试失败: ${error.message}`);
        }
        
        console.log('\n=== 模型兼容性和连接机制测试完成 ===');
        console.log(`\n测试总结:`);
        console.log(`- 模型服务器状态: ${modelStatus.status === 'ok' ? '正常' : '异常'}`);
        console.log(`- 已安装模型数: ${modelStatus.installedModels.length}`);
        console.log(`- 成功测试的模型数: ${chatResults.length}`);
        console.log(`- 测试成功率: ${(chatResults.length / modelStatus.installedModels.length * 100).toFixed(1)}%`);
        
        if (chatResults.length === modelStatus.installedModels.length) {
            console.log('\n🎉 所有模型兼容性测试通过！');
        } else {
            console.log('\n⚠️  部分模型测试失败，需要进一步检查。');
        }
        
        return {
            success: true,
            modelStatus,
            chatResults
        };
        
    } catch (error) {
        console.error('\n测试执行失败:', error);
        console.log('\n=== 模型兼容性和连接机制测试失败 ===');
        return {
            success: false,
            error: error.message
        };
    }
}

// 运行测试
if (require.main === module) {
    runModelCompatibilityTests();
}

// 导出测试函数
module.exports = {
    runModelCompatibilityTests,
    testModelStatus,
    testModelChat,
    testConnectionStability
};
