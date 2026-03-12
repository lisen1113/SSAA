// 测试服务启动
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

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '服务运行正常' });
});

// 测试端点
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    message: '测试成功',
    hasApiKey: !!doubaoApiKey,
    doubaoModel: doubaoModel,
    doubaoEndpointId: doubaoEndpointId,
    port: port
  });
});

app.listen(port, () => {
  console.log(`测试服务运行在端口 ${port}`);
  console.log(`健康检查: http://localhost:${port}/api/health`);
  console.log(`测试端点: http://localhost:${port}/api/test`);
  console.log(`是否设置了API密钥: ${!!doubaoApiKey}`);
  console.log(`使用的模型: ${doubaoModel}`);
  console.log(`使用的接入点ID: ${doubaoEndpointId || '未设置'}`);
});