// 测试解决方案智能助手功能
const fetch = require('node-fetch');

async function testSolutionAI() {
    console.log('开始测试解决方案智能助手功能...');
    
    try {
        // 测试1: 基本的AI模型调用
        console.log('\n测试1: 基本的AI模型调用');
        const testMessages = [
            '你好，我想了解Surface Pro 12的特点',
            '推荐一款适合远程办公的Surface产品',
            'Surface Laptop Studio 2和Surface Pro 13有什么区别'
        ];
        
        for (const message of testMessages) {
            console.log(`\n测试消息: ${message}`);
            const start = Date.now();
            const chatResponse = await fetch('http://localhost:3002/api/local/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    model: 'gemma3:4b'
                })
            });
            
            const end = Date.now();
            const chatData = await chatResponse.json();
            if (chatData.response) {
                console.log('AI响应:', chatData.response.substring(0, 200) + (chatData.response.length > 200 ? '...' : ''));
                console.log('响应长度:', chatData.response.length, '字符');
                console.log('响应时间:', end - start, '毫秒');
            } else if (chatData.error) {
                console.error('AI调用错误:', chatData.error);
            }
        }
        
        // 测试2: 检查本地模型服务器状态
        console.log('\n测试2: 检查本地模型服务器状态');
        const statusResponse = await fetch('http://localhost:3002/api/local/status');
        const statusData = await statusResponse.json();
        console.log('本地模型服务器状态:', statusData.status);
        console.log('Ollama安装状态:', statusData.ollamaInstalled);
        console.log('已安装模型:', statusData.installedModels.map(m => m.name));
        
        // 测试3: 检查主服务器状态
        console.log('\n测试3: 检查主服务器状态');
        const mainStatusResponse = await fetch('http://localhost:3001/api/health');
        const mainStatusData = await mainStatusResponse.json();
        console.log('主服务器状态:', mainStatusData.status);
        console.log('主服务器消息:', mainStatusData.message);
        
        console.log('\n解决方案智能助手功能测试完成！');
    } catch (error) {
        console.error('测试过程中发生错误:', error);
    }
}

// 运行测试
testSolutionAI();