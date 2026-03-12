// 综合测试脚本：解决方案智能助手功能验证
// 运行方式：在浏览器控制台中执行

console.log('=== 解决方案智能助手功能测试开始 ===');

// 测试1：验证核心函数是否存在
function testCoreFunctions() {
    console.log('\n测试1：验证核心函数是否存在');
    
    const functionsToTest = {
        addMessage: typeof window.addMessage === 'function',
        getAIResponse: typeof window.getAIResponse === 'function',
        addLoadingMessage: typeof window.addLoadingMessage === 'function',
        removeLoadingMessage: typeof window.removeLoadingMessage === 'function'
    };
    
    console.log('核心函数状态:', functionsToTest);
    
    const allFunctionsExist = Object.values(functionsToTest).every(Boolean);
    console.log('所有核心函数存在:', allFunctionsExist);
    
    return allFunctionsExist;
}

// 测试2：验证解决方案智能助手按钮是否存在
function testSolutionAIAssistantButton() {
    console.log('\n测试2：验证解决方案智能助手按钮是否存在');
    
    const button = document.getElementById('solution-ai-assistant-btn');
    console.log('解决方案智能助手按钮存在:', !!button);
    
    if (button) {
        console.log('按钮文本:', button.textContent.trim());
        console.log('按钮类名:', button.className);
    }
    
    return !!button;
}

// 测试3：验证AI助手模态框是否存在
function testAIAssistantModal() {
    console.log('\n测试3：验证AI助手模态框是否存在');
    
    const modal = document.getElementById('ai-assistant-modal');
    console.log('AI助手模态框存在:', !!modal);
    
    if (modal) {
        console.log('模态框类名:', modal.className);
    }
    
    return !!modal;
}

// 测试4：验证AI聊天表单是否存在
function testAIChatForm() {
    console.log('\n测试4：验证AI聊天表单是否存在');
    
    const form = document.getElementById('ai-chat-form');
    const input = document.getElementById('ai-message-input');
    const container = document.getElementById('ai-chat-container');
    
    console.log('AI聊天表单存在:', !!form);
    console.log('消息输入框存在:', !!input);
    console.log('聊天容器存在:', !!container);
    
    return !!form && !!input && !!container;
}

// 测试5：测试AI响应功能
async function testAIResponse() {
    console.log('\n测试5：测试AI响应功能');
    
    if (typeof window.getAIResponse !== 'function') {
        console.error('getAIResponse函数不存在');
        return false;
    }
    
    try {
        console.log('发送测试消息: 你好，我需要Surface产品推荐');
        const response = await window.getAIResponse('你好，我需要Surface产品推荐');
        
        console.log('AI响应类型:', typeof response);
        console.log('AI响应长度:', response.length);
        console.log('AI响应内容:', response.substring(0, 200) + (response.length > 200 ? '...' : ''));
        
        return typeof response === 'string' && response.length > 0;
    } catch (error) {
        console.error('AI响应测试失败:', error);
        return false;
    }
}

// 测试6：测试本地模型服务器连接
async function testLocalModelServer() {
    console.log('\n测试6：测试本地模型服务器连接');
    
    try {
        const response = await fetch('http://localhost:3002/api/local/health');
        const data = await response.json();
        
        console.log('本地模型服务器健康检查状态:', response.status);
        console.log('本地模型服务器响应:', data);
        
        return response.status === 200 && data.status === 'ok';
    } catch (error) {
        console.error('本地模型服务器连接测试失败:', error);
        return false;
    }
}

// 测试7：测试语音输入功能
function testVoiceInput() {
    console.log('\n测试7：测试语音输入功能');
    
    const voiceButton = document.getElementById('voice-input-btn');
    console.log('语音输入按钮存在:', !!voiceButton);
    
    // 检查浏览器是否支持语音识别
    const speechRecognitionSupported = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    console.log('浏览器支持语音识别:', speechRecognitionSupported);
    
    return !!voiceButton && speechRecognitionSupported;
}

// 测试8：测试解决方案智能助手完整流程
async function testCompleteFlow() {
    console.log('\n测试8：测试解决方案智能助手完整流程');
    
    try {
        // 模拟点击解决方案智能助手按钮
        const button = document.getElementById('solution-ai-assistant-btn');
        if (button) {
            console.log('点击解决方案智能助手按钮');
            button.click();
            
            // 等待模态框显示
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const modal = document.getElementById('ai-assistant-modal');
            console.log('模态框显示状态:', !modal.classList.contains('hidden'));
            
            if (!modal.classList.contains('hidden')) {
                console.log('解决方案智能助手完整流程测试通过');
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('解决方案智能助手完整流程测试失败:', error);
        return false;
    }
}

// 运行所有测试
async function runAllTests() {
    console.log('开始运行所有测试...');
    
    const testResults = {
        coreFunctions: testCoreFunctions(),
        solutionAIAssistantButton: testSolutionAIAssistantButton(),
        aiAssistantModal: testAIAssistantModal(),
        aiChatForm: testAIChatForm(),
        voiceInput: testVoiceInput()
    };
    
    // 异步测试
    testResults.aiResponse = await testAIResponse();
    testResults.localModelServer = await testLocalModelServer();
    testResults.completeFlow = await testCompleteFlow();
    
    // 显示测试结果
    console.log('\n=== 测试结果汇总 ===');
    console.log(testResults);
    
    // 计算通过的测试数
    const passedTests = Object.values(testResults).filter(Boolean).length;
    const totalTests = Object.keys(testResults).length;
    
    console.log(`\n测试通过: ${passedTests}/${totalTests}`);
    
    if (passedTests === totalTests) {
        console.log('🎉 所有测试通过！解决方案智能助手功能正常。');
    } else {
        console.log('⚠️  部分测试失败，需要进一步检查。');
        
        // 显示失败的测试
        const failedTests = Object.entries(testResults)
            .filter(([_, passed]) => !passed)
            .map(([test]) => test);
        
        console.log('失败的测试:', failedTests);
    }
    
    console.log('=== 解决方案智能助手功能测试结束 ===');
    
    return testResults;
}

// 导出测试函数（如果在模块环境中）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        runAllTests,
        testCoreFunctions,
        testSolutionAIAssistantButton,
        testAIAssistantModal,
        testAIChatForm,
        testAIResponse,
        testLocalModelServer,
        testVoiceInput,
        testCompleteFlow
    };
} else {
    // 在浏览器环境中自动运行测试
    window.runSolutionAITests = runAllTests;
    console.log('测试函数已加载，可在控制台中执行 runSolutionAITests() 运行所有测试。');
    
    // 自动运行测试
    setTimeout(runAllTests, 1000);
}
