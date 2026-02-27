# Surface AI Assistant - 增强AI智能体功能

## 项目概述

本项目实现了Surface AI Assistant的增强AI智能体功能，通过接入OpenAI的GPT模型，提供更智能、更专业的Surface产品解决方案建议。

## 功能特性

- **高级AI模型集成**：接入OpenAI的GPT-3.5/GPT-4模型，提供更智能的自然语言理解和生成能力
- **产品知识集成**：内置Surface产品知识库，确保AI能够提供准确的产品信息和推荐
- **上下文理解**：支持对话历史上下文，提供更连贯的交互体验
- **降级机制**：当API调用失败时，自动降级到本地响应，确保系统稳定性
- **语音输入支持**：保留了原有的语音输入功能，提高用户体验

## 技术架构

### 前端
- HTML5 + Tailwind CSS
- JavaScript + DOM manipulation
- Web Speech API (语音输入)

### 后端
- Node.js + Express
- OpenAI SDK
- CORS中间件

## 快速开始

### 1. 安装依赖

```bash
# 安装后端依赖
npm install
```

### 2. 配置API密钥

在`server.js`文件中配置OpenAI API密钥：

```javascript
const openai = new OpenAI({
  apiKey: 'YOUR_OPENAI_API_KEY' // 替换为你的OpenAI API密钥
});
```

### 3. 启动服务

```bash
# 启动后端服务
npm start

# 或使用开发模式（自动重启）
npm run dev
```

后端服务将在`http://localhost:3001`上运行。

### 4. 访问应用

打开浏览器，访问前端应用：

```
http://localhost:8000
```

## 使用方法

1. 在解决方案推荐页面，点击"AI智能助手"按钮
2. 在AI聊天界面中描述您的需求，例如：
   - "我们是一家教育机构，需要为教师配备适合教学的设备，预算在8000元左右"
   - "我是一名设计师，需要高性能的设备用于图形设计，预算在15000元左右"
   - "我们公司需要为员工配备远程办公设备，预算在10000元左右"
3. 您也可以使用语音输入功能，点击"开始语音"按钮并说出您的需求
4. AI智能助手会分析您的需求并提供专业的Surface产品解决方案建议

## 项目结构

```
Surface_AI_Assistant_V2.1/
├── index.html              # 前端主页面
├── server.js               # 后端服务
├── package.json            # 后端依赖配置
├── enhanced-ai-assistant.js # 增强AI智能体功能的脚本
└── README.md              # 项目说明
```

## 后端API

### 健康检查

- **端点**：`GET /api/health`
- **响应**：`{ "status": "ok", "message": "服务运行正常" }`

### AI聊天

- **端点**：`POST /api/ai/chat`
- **请求体**：
  ```json
  {
    "message": "用户消息",
    "history": "聊天历史（可选）"
  }
  ```
- **响应**：
  ```json
  {
    "response": "AI响应内容"
  }
  ```

## 注意事项

1. **API密钥安全**：确保OpenAI API密钥不被暴露，建议使用环境变量存储
2. **API调用成本**：GPT模型的API调用会产生费用，请合理设置token限制
3. **响应时间**：AI模型的响应时间可能会有所不同，具体取决于网络状况和模型负载
4. **浏览器兼容性**：语音输入功能依赖于Web Speech API，可能在某些浏览器中不可用

## 未来扩展

1. **多语言支持**：增加对多种语言的支持，满足国际化用户的需求
2. **个性化推荐**：基于用户历史需求提供个性化的产品推荐
3. **产品对比**：提供多个产品的详细对比功能
4. **实时库存和价格**：集成实时的产品库存和价格信息
5. **多模型支持**：支持切换不同的AI模型，如Claude、Gemini等

## 故障排除

### 后端服务启动失败

- 检查Node.js是否已安装
- 检查依赖是否已正确安装
- 检查OpenAI API密钥是否已配置

### AI响应缓慢

- 检查网络连接是否正常
- 检查OpenAI API的响应时间
- 考虑使用更轻量级的模型（如gpt-3.5-turbo）

### API调用失败

- 检查OpenAI API密钥是否有效
- 检查API配额是否已用尽
- 检查网络连接是否正常

## 许可证

MIT
