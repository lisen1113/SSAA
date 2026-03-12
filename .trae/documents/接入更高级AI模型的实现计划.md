# 接入更高级AI模型的实现计划

## 1. 现状分析

当前的AI助手使用简单的关键词匹配逻辑，通过`getAIResponse`函数生成响应，只能处理预定义的几种情况，智能水平有限。

## 2. 解决方案

### 2.1 技术选型

- **AI模型选择**：接入OpenAI的GPT-3.5/GPT-4模型，提供强大的自然语言理解和生成能力
- **后端服务**：创建一个简单的Node.js后端服务，处理AI模型API调用
- **前端优化**：改进前端交互，提供更好的用户体验

### 2.2 实现步骤

#### 步骤1：创建后端服务

1. **初始化项目**：创建一个新的Node.js项目
2. **安装依赖**：安装Express、OpenAI SDK等必要的依赖
3. **配置API密钥**：设置OpenAI API密钥（环境变量）
4. **实现API端点**：创建一个`/api/ai/chat`端点，接收用户消息并返回AI响应
5. **实现提示工程**：设计专业的提示模板，包含Surface产品知识

#### 步骤2：改进前端代码

1. **修改`getAIResponse`函数**：将简单的关键词匹配替换为API调用
2. **实现加载状态**：在等待AI响应时显示加载动画
3. **实现错误处理**：处理API调用失败的情况
4. **优化用户界面**：添加更多交互元素，如消息状态、重试按钮等

#### 步骤3：集成产品知识

1. **创建产品知识库**：整理Surface产品的详细信息，包括规格、价格、适用场景等
2. **优化提示模板**：将产品知识库集成到提示中，确保AI能够提供准确的产品信息
3. **实现上下文管理**：维护对话历史，确保AI能够理解上下文

## 3. 技术实现细节

### 3.1 后端服务架构

```javascript
// server.js
const express = require('express');
const { OpenAI } = require('openai');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 产品知识库
const productKnowledge = `
Surface产品知识：
1. Surface Pro 12：二合一设备，适合移动办公和教学，支持触控笔
2. Surface Laptop 13：轻薄笔记本，适合日常办公，键盘舒适
3. Surface Laptop Studio 2：高性能设备，适合创意设计，支持多种形态
4. Surface Laptop Go 3：入门级设备，适合学生和基础办公
5. Surface Pro 13：高端二合一设备，适合专业用户和创意工作
`;

// 提示模板
const promptTemplate = (message, history) => `
你是一个专业的Surface产品顾问，根据以下产品知识和用户需求，提供详细的解决方案建议。

${productKnowledge}

对话历史：
${history}

用户最新消息：${message}

请提供专业、详细的Surface产品解决方案建议，包括具体的产品推荐、配置建议和价格范围。
`;

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = '' } = req.body;
    
    const prompt = promptTemplate(message, history);
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '你是一个专业的Surface产品顾问' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'AI响应生成失败，请重试' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### 3.2 前端代码修改

```javascript
// 修改getAIResponse函数
async function getAIResponse(message, history = '') {
  try {
    const response = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, history })
    });
    
    if (!response.ok) {
      throw new Error('API调用失败');
    }
    
    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('Error:', error);
    return '抱歉，AI服务暂时不可用，请稍后重试。';
  }
}

// 修改表单提交处理
if (aiChatForm) {
  aiChatForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const message = aiMessageInput.value.trim();
    if (message) {
      // 添加用户消息
      addMessage('user', message);
      aiMessageInput.value = '';
      
      // 显示加载状态
      const loadingId = addLoadingMessage();
      
      // 获取聊天历史
      const messages = [];
      const messageElements = aiChatContainer.querySelectorAll('.flex.items-start');
      messageElements.forEach(el => {
        const text = el.querySelector('p').textContent;
        messages.push(text);
      });
      const history = messages.slice(1, -1).join('\n'); // 排除系统消息和当前消息
      
      // 调用AI API
      try {
        const aiResponse = await getAIResponse(message, history);
        removeLoadingMessage(loadingId);
        addMessage('ai', aiResponse);
      } catch (error) {
        removeLoadingMessage(loadingId);
        addMessage('ai', '抱歉，AI服务暂时不可用，请稍后重试。');
      }
    }
  });
}
```

### 3.3 用户体验优化

1. **添加加载动画**：在等待AI响应时显示更美观的加载动画
2. **添加消息状态**：显示消息发送状态和AI响应状态
3. **添加重试按钮**：当API调用失败时，添加重试按钮
4. **优化响应时间**：实现流式响应，让用户更快看到AI的回复
5. **添加上下文提示**：在输入框中添加示例提示，引导用户提供更多信息

## 4. 预期效果

- **智能水平提升**：能够理解更复杂的用户需求，提供更专业的解决方案
- **响应质量提高**：生成更连贯、更准确的Surface产品推荐
- **用户体验改善**：提供更流畅、更直观的交互体验
- **可扩展性增强**：易于集成新的AI模型和产品知识

## 5. 注意事项

- **API密钥安全**：确保OpenAI API密钥不被暴露
- **API调用成本**：设置合理的token限制，控制API调用成本
- **响应时间**：优化提示和参数，确保响应时间在可接受范围内
- **错误处理**：完善错误处理机制，确保系统稳定性
- **数据隐私**：确保用户数据的安全和隐私保护

## 6. 后续扩展

- **集成更多AI模型**：如Claude、Gemini等，提供更多选择
- **添加多语言支持**：支持中英文等多种语言
- **实现个性化推荐**：基于用户历史需求提供个性化推荐
- **添加产品对比功能**：提供多个产品的详细对比
- **集成实时库存和价格**：提供实时的产品库存和价格信息