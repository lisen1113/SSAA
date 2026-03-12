const http = require('http');

// 测试本地模型服务器的健康检查端点
function testHealthCheck() {
    console.log('测试健康检查端点...');
    
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/local/health',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        console.log(`健康检查状态码: ${res.statusCode}`);
        res.on('data', (chunk) => {
            console.log(`健康检查响应: ${chunk}`);
        });
    });
    
    req.on('error', (e) => {
        console.error(`健康检查错误: ${e.message}`);
    });
    
    req.end();
}

// 测试本地模型服务器的聊天端点
function testChatEndpoint() {
    console.log('\n测试聊天端点...');
    
    const postData = JSON.stringify({
        message: '你好，我需要Surface产品推荐'
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
        console.log(`聊天端点状态码: ${res.statusCode}`);
        res.on('data', (chunk) => {
            console.log(`聊天端点响应: ${chunk}`);
        });
    });
    
    req.on('error', (e) => {
        console.error(`聊天端点错误: ${e.message}`);
    });
    
    req.write(postData);
    req.end();
}

// 测试本地模型服务器的状态端点
function testStatusEndpoint() {
    console.log('\n测试状态端点...');
    
    const options = {
        hostname: 'localhost',
        port: 3002,
        path: '/api/local/status',
        method: 'GET'
    };
    
    const req = http.request(options, (res) => {
        console.log(`状态端点状态码: ${res.statusCode}`);
        res.on('data', (chunk) => {
            console.log(`状态端点响应: ${chunk}`);
        });
    });
    
    req.on('error', (e) => {
        console.error(`状态端点错误: ${e.message}`);
    });
    
    req.end();
}

// 运行所有测试
testHealthCheck();
setTimeout(testChatEndpoint, 1000);
setTimeout(testStatusEndpoint, 2000);
