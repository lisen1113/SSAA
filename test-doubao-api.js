// 测试豆包模型API调用
const { aiModelInterface } = require('./ai-model-interface.js');

async function testDoubaoAPI() {
    console.log('开始测试豆包模型API...');
    
    try {
        // 测试豆包API连接
        const isDoubaoAvailable = await aiModelInterface.testDoubaoAPI();
        console.log('豆包API连接测试:', isDoubaoAvailable ? '成功' : '失败');
        
        if (isDoubaoAvailable) {
            // 测试发送消息
            console.log('测试发送消息到豆包模型...');
            const response = await aiModelInterface.getAIResponse('你好，豆包', { model: 'doubao' });
            console.log('豆包模型响应:', response);
            
            // 测试发送带图片的消息
            console.log('测试发送带图片的消息到豆包模型...');
            const imageResponse = await aiModelInterface.getAIResponse('你看见了什么？', {
                model: 'doubao',
                imageUrl: 'https://ark-project.tos-cn-beijing.volces.com/doc_image/ark_demo_img_1.png'
            });
            console.log('豆包模型图片响应:', imageResponse);
        }
        
        // 测试初始化
        console.log('测试AI模型接口初始化...');
        const isInitialized = await aiModelInterface.initialize();
        console.log('初始化结果:', isInitialized ? '成功' : '失败');
        console.log('默认模型:', aiModelInterface.defaultModel);
        
    } catch (error) {
        console.error('测试过程中出现错误:', error);
    }
}

// 运行测试
testDoubaoAPI();