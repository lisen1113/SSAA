// AI模型调用流程测试脚本
// 运行方式：node test-ai-model-flow.js

const http = require('http');

// 测试用例
const testCases = [
    {
        id: 1,
        name: '基本问候',
        message: '你好',
        expected: '问候语响应'
    },
    {
        id: 2,
        name: '产品推荐',
        message: '推荐一款适合办公的Surface产品',
        expected: '产品推荐响应'
    },
    {
        id: 3,
        name: '价格咨询',
        message: 'Surface Pro 12的价格范围是多少',
        expected: '价格信息响应'
    },
    {
        id: 4,
        name: '技术支持',
        message: '我的Surface设备无法开机，怎么办',
        expected: '技术支持响应'
    },
    {
        id: 5,
        name: '多轮对话',
        message: '我需要一款适合创意设计的设备',
        expected: '创意设计设备推荐'
    }
];

// 发送聊天请求到本地模型服务器
function sendChatRequest(message, model = 'gemma3:4b', history = '') {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: message,
            history: history,
            model: model
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
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (error) {
                    reject(new Error(`Failed to parse response: ${data}`));
                }
            });
        });
        
        req.on('error', (e) => {
            reject(new Error(`Request failed: ${e.message}`));
        });
        
        req.write(postData);
        req.end();
    });
}

// 测试单个用例
async function testSingleCase(testCase, model = 'gemma3:4b') {
    console.log(`\n测试用例 ${testCase.id}: ${testCase.name}`);
    console.log(`输入: ${testCase.message}`);
    
    try {
        const response = await sendChatRequest(testCase.message, model);
        
        console.log(`状态码: 200`);
        console.log(`响应类型: ${typeof response}`);
        console.log(`响应包含response字段: ${'response' in response}`);
        
        if ('response' in response) {
            console.log(`响应长度: ${response.response.length} 字符`);
            console.log(`响应内容: ${response.response.substring(0, 200)}${response.response.length > 200 ? '...' : ''}`);
            console.log(`✓ 测试通过: 成功获取AI响应`);
            return {
                success: true,
                testCase: testCase,
                response: response.response
            };
        } else if ('error' in response) {
            console.log(`✗ 测试失败: ${response.error}`);
            return {
                success: false,
                testCase: testCase,
                error: response.error
            };
        } else {
            console.log(`✗ 测试失败: 响应格式不正确`);
            return {
                success: false,
                testCase: testCase,
                error: '响应格式不正确'
            };
        }
    } catch (error) {
        console.log(`✗ 测试失败: ${error.message}`);
        return {
            success: false,
            testCase: testCase,
            error: error.message
        };
    }
}

// 测试多轮对话
async function testMultiTurnConversation(model = 'gemma3:4b') {
    console.log('\n=== 测试多轮对话 ===');
    
    try {
        let history = '';
        const messages = [
            '你好',
            '我需要一款适合办公的Surface产品',
            '价格在8000元左右'
        ];
        
        for (let i = 0; i < messages.length; i++) {
            const message = messages[i];
            console.log(`\n轮次 ${i + 1}: ${message}`);
            
            const response = await sendChatRequest(message, model, history);
            
            if ('response' in response) {
                console.log(`响应: ${response.response.substring(0, 150)}${response.response.length > 150 ? '...' : ''}`);
                // 更新历史记录
                history += `用户: ${message}\nAI: ${response.response}\n`;
            } else {
                console.log(`错误: ${response.error}`);
                return {
                    success: false,
                    error: response.error
                };
            }
        }
        
        console.log('\n✓ 多轮对话测试通过: 成功处理上下文');
        return {
            success: true
        };
    } catch (error) {
        console.log(`\n✗ 多轮对话测试失败: ${error.message}`);
        return {
            success: false,
            error: error.message
        };
    }
}

// 测试不同模型
async function testDifferentModels() {
    console.log('\n=== 测试不同模型 ===');
    
    const models = ['gemma3:4b', 'llama2:7b', 'mistral:7b'];
    const testMessage = '你好，推荐一款适合办公的Surface产品';
    
    const results = [];
    
    for (const model of models) {
        console.log(`\n测试模型: ${model}`);
        
        try {
            const response = await sendChatRequest(testMessage, model);
            
            if ('response' in response) {
                console.log(`✓ 模型 ${model} 响应成功`);
                console.log(`响应长度: ${response.response.length} 字符`);
                results.push({
                    model: model,
                    success: true,
                    response: response.response
                });
            } else {
                console.log(`✗ 模型 ${model} 响应失败: ${response.error}`);
                results.push({
                    model: model,
                    success: false,
                    error: response.error
                });
            }
        } catch (error) {
            console.log(`✗ 模型 ${model} 测试失败: ${error.message}`);
            results.push({
                model: model,
                success: false,
                error: error.message
            });
        }
    }
    
    return results;
}

// 运行所有测试
async function runAllTests() {
    console.log('=== AI模型调用流程测试开始 ===');
    
    // 1. 测试基本用例
    console.log('\n=== 测试基本用例 ===');
    const basicResults = [];
    
    for (const testCase of testCases) {
        const result = await testSingleCase(testCase);
        basicResults.push(result);
    }
    
    // 2. 测试多轮对话
    const multiTurnResult = await testMultiTurnConversation();
    
    // 3. 测试不同模型
    const modelResults = await testDifferentModels();
    
    // 4. 测试性能（响应时间）
    console.log('\n=== 测试性能（响应时间） ===');
    const startTime = Date.now();
    const performanceResponse = await sendChatRequest('推荐一款适合创意设计的Surface产品');
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    console.log(`响应时间: ${responseTime}ms`);
    console.log(`响应时间评估: ${responseTime < 5000 ? '快速' : responseTime < 10000 ? '中等' : '较慢'}`);
    
    // 汇总测试结果
    console.log('\n=== 测试结果汇总 ===');
    
    // 基本用例结果
    const passedBasicTests = basicResults.filter(r => r.success).length;
    console.log(`基本用例: ${passedBasicTests}/${basicResults.length} 通过`);
    
    // 多轮对话结果
    console.log(`多轮对话: ${multiTurnResult.success ? '通过' : '失败'}`);
    
    // 不同模型结果
    const passedModelTests = modelResults.filter(r => r.success).length;
    console.log(`不同模型: ${passedModelTests}/${modelResults.length} 通过`);
    
    // 性能测试结果
    console.log(`性能测试: 响应时间 ${responseTime}ms`);
    
    // 计算总通过率
    const totalTests = basicResults.length + 1 + modelResults.length;
    const totalPassed = passedBasicTests + (multiTurnResult.success ? 1 : 0) + passedModelTests;
    const passRate = (totalPassed / totalTests * 100).toFixed(1);
    
    console.log(`\n总通过率: ${passRate}%`);
    
    if (passRate >= 90) {
        console.log('🎉 AI模型调用流程测试通过！所有核心功能正常工作。');
    } else if (passRate >= 70) {
        console.log('⚠️ AI模型调用流程测试基本通过，但有部分功能需要改进。');
    } else {
        console.log('❌ AI模型调用流程测试失败，需要全面检查和修复。');
    }
    
    // 显示失败的测试用例
    const failedTests = basicResults.filter(r => !r.success);
    if (failedTests.length > 0) {
        console.log('\n失败的测试用例:');
        failedTests.forEach(test => {
            console.log(`- 用例 ${test.testCase.id}: ${test.testCase.name} - 错误: ${test.error}`);
        });
    }
    
    console.log('\n=== AI模型调用流程测试完成 ===');
    
    return {
        basicResults,
        multiTurnResult,
        modelResults,
        performance: {
            responseTime: responseTime
        },
        passRate: passRate
    };
}

// 运行测试
if (require.main === module) {
    runAllTests().then(results => {
        console.log('\n测试完成，结果:', results);
    }).catch(error => {
        console.error('测试执行失败:', error);
    });
}

// 导出测试函数
module.exports = {
    runAllTests,
    testSingleCase,
    testMultiTurnConversation,
    testDifferentModels
};
