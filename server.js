const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 从环境变量获取豆包API配置
const doubaoApiKey = process.env.ARK_API_KEY;
const doubaoApiUrl = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const doubaoModel = process.env.DOUBAO_MODEL || 'doubao-seed-2-0-code-preview-260215';
const doubaoEndpointId = process.env.DOUBAO_ENDPOINT_ID;

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

// 提示模板
const promptTemplate = (message, history) => `
你是一个专业的Surface产品顾问，根据以下产品知识和用户需求，提供详细的解决方案建议。

${productKnowledge}

对话历史：
${history}

用户最新消息：${message}

请提供专业、详细的Surface产品解决方案建议，包括：
1. 推荐的产品组合
2. 推荐理由（基于用户需求和产品特点）
3. 预算范围
4. 适用场景分析
5. 其他相关建议

确保回答全面、专业、有针对性，直接解答用户的问题，不要使用任何引导性语言。
`;

// AI聊天API端点
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = '' } = req.body;
    
    if (!doubaoApiKey) {
      throw new Error('ARK_API_KEY环境变量未设置');
    }
    
    const prompt = promptTemplate(message, history);
    
    console.log('生成的提示:', prompt);
    
    // 调用豆包API
    const response = await fetch(doubaoApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${doubaoApiKey}`
      },
      body: JSON.stringify({
        model: doubaoModel,
        messages: [
          { role: 'system', content: '你是一个专业的Surface产品顾问，精通各种Surface产品的特点和适用场景，能够根据用户需求提供详细、专业的解决方案建议。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`豆包API错误: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error('豆包API响应格式不正确');
    }
    
    console.log('AI响应:', data.choices[0].message.content);
    
    res.json({ response: data.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: `AI响应生成失败: ${error.message}` });
  }
});

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`健康检查: http://localhost:${port}/api/health`);
  console.log(`AI聊天API: http://localhost:${port}/api/ai/chat`);
});
