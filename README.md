# Surface AI Assistant Backend

Surface AI Assistant 后端服务，使用豆包 2.0 API 提供智能产品咨询服务。

## 功能特性

- 智能产品咨询：基于 Surface 产品知识库提供专业建议
- 环境变量配置：通过环境变量安全管理 API 密钥
- 健康检查端点：方便监控服务状态

## 部署说明

### 1. 准备工作

1. **获取豆包 API 密钥**：
   - 访问 [豆包开放平台](https://cloud.baidu.com/product/wenxinworkshop)
   - 注册并创建应用
   - 获取 API 密钥（ARK_API_KEY）

2. **安装依赖**：
   ```bash
   npm install
   ```

### 2. 本地开发

1. **创建 .env 文件**（基于 .env.example）：
   ```bash
   cp .env.example .env
   # 编辑 .env 文件，填写 ARK_API_KEY
   ```

2. **启动服务**：
   ```bash
   npm start
   ```

3. **测试 API**：
   - 健康检查：`http://localhost:3001/api/health`
   - AI 聊天：`POST http://localhost:3001/api/ai/chat`

### 3. 腾讯云部署

#### 方法一：通过 GitHub 自动部署

1. **创建腾讯云函数**：
   - 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
   - 进入「云函数」服务
   - 选择「函数服务」>「新建」
   - 选择「从 GitHub 仓库部署」
   - 填写仓库信息，选择分支

2. **设置环境变量**：
   - 在「函数配置」>「环境变量」中添加：
     - 键：`ARK_API_KEY`
     - 值：你的豆包 API 密钥
     - 键：`PORT`
     - 值：`3001`

3. **配置触发方式**：
   - 添加「API 网关」触发
   - 配置 API 路径，如 `/api`

4. **部署并测试**：
   - 点击「部署」按钮
   - 使用生成的 API 地址进行测试

#### 方法二：手动部署

1. **打包代码**：
   ```bash
   # 安装依赖
   npm install
   
   # 打包
   zip -r surface-ai-assistant.zip .
   ```

2. **上传到腾讯云**：
   - 登录 [腾讯云控制台](https://console.cloud.tencent.com/)
   - 进入「云函数」服务
   - 选择「函数服务」>「新建」
   - 选择「本地上传」，上传打包文件

3. **设置环境变量**：
   - 与方法一相同，添加 `ARK_API_KEY` 和 `PORT` 环境变量

4. **配置触发方式**：
   - 与方法一相同

## API 文档

### 1. 健康检查

**请求**：
```
GET /api/health
```

**响应**：
```json
{
  "status": "ok",
  "message": "服务运行正常"
}
```

### 2. AI 聊天

**请求**：
```
POST /api/ai/chat
Content-Type: application/json

{
  "message": "我需要一台适合创意设计的 Surface 设备",
  "history": ""
}
```

**响应**：
```json
{
  "response": "基于您的需求，我推荐 Surface Laptop Studio 2，它是一款专为创意设计打造的高性能设备..."
}
```

## 注意事项

- **API 密钥安全**：不要将 API 密钥硬编码到代码中，始终使用环境变量
- **错误处理**：服务会返回详细的错误信息，便于排查问题
- **性能优化**：对于高并发场景，建议配置适当的超时和重试机制

## 技术栈

- Node.js
- Express
- 豆包 2.0 API

## 许可证

MIT License