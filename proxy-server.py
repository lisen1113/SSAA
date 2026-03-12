#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
代理服务器，支持HTTP和WebSocket协议，用于豆包API的CORS问题和WebSocket连接
"""
import sys
import asyncio
import json
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler
import websockets
import ssl

# 全局配置
DOUBAO_WEBSOCKET_URL = 'wss://openspeech.bytedance.com/api/v3/realtime/dialogue'
APP_ID = '5170768269'
ACCESS_TOKEN = 'f-c1qvDDO4HPv_wKVWDN4plrLSu0_9fo'

class ProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
    
    def do_POST(self):
        if self.path == '/proxy/doubao':
            self.handle_doubao_proxy()
        else:
            self.send_error(404)
    
    def handle_doubao_proxy(self):
        try:
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            # 解析请求数据
            request_data = json.loads(post_data.decode('utf-8'))
            print(f'收到请求数据: {json.dumps(request_data, indent=2, ensure_ascii=False)}')
            
            # 豆包API配置
            api_url = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
            
            # 尝试不同的认证方式和API端点
            credentials = [
                # 主要尝试：文本模型API Key + 语音模型
                ('文本模型API Key + 语音模型', '1a29a515-d131-48b8-9334-e48e7daf3ade', api_url),
                # 尝试不同的API端点
                ('文本模型API Key + responses端点', '1a29a515-d131-48b8-9334-e48e7daf3ade', 'https://ark.cn-beijing.volces.com/api/v3/responses'),
                # 尝试Access Token
                ('Access Token', 'f-c1qvDDO4HPv_wKVWDN4plrLSu0_9fo', api_url),
                # 尝试Secret Key
                ('Secret Key', '85271Gsb_oCsQ51qRKlTuaMjw-TW4HsJ', api_url),
            ]
            
            response_data = None
            last_error = None
            
            for cred_name, cred_value, endpoint in credentials:
                print(f'尝试使用 {cred_name}...')
                print(f'使用端点: {endpoint}')
                
                try:
                    # 准备请求
                    req = urllib.request.Request(
                        endpoint,
                        data=json.dumps(request_data).encode('utf-8'),
                        headers={
                            'Content-Type': 'application/json',
                            'Authorization': f'Bearer {cred_value}'
                        }
                    )
                    
                    # 发送请求
                    with urllib.request.urlopen(req, timeout=60) as response:
                        response_data = response.read()
                        print(f'{cred_name} 认证成功！')
                        print(f'响应状态: {response.status}')
                        break
                        
                except urllib.error.HTTPError as e:
                    error_content = e.read().decode('utf-8')
                    print(f'{cred_name} 认证失败: {e.code}')
                    print(f'错误信息: {error_content}')
                    last_error = (e.code, error_content)
                    continue
            
            if response_data:
                # 返回响应
                self.send_response(200)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(response_data)
            else:
                # 所有认证方式都失败了
                print('所有认证方式都失败了')
                self.send_response(last_error[0] if last_error else 500)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({'error': last_error[1] if last_error else '所有认证方式都失败'}).encode('utf-8')
                self.wfile.write(error_response)
                
        except Exception as e:
            print(f'代理错误: {str(e)}')
            import traceback
            traceback.print_exc()
            self.send_response(500)
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({'error': str(e)}).encode('utf-8')
            self.wfile.write(error_response)
    
    def log_message(self, format, *args):
        print(f'[{self.address_string()}] {format % args}')

# WebSocket代理处理
async def handle_websocket_proxy(websocket):
    print('新的WebSocket连接')
    
    # 连接到豆包WebSocket API
    doubao_ws = None
    try:
        # 构建WebSocket头部
        headers = {
            'X-Api-App-ID': APP_ID,
            'X-Api-Access-Key': ACCESS_TOKEN,
            'X-Api-Resource-Id': 'volc.speech.dialog',
            'X-Api-App-Key': 'PlgvMymc7f3tQnJ6'
        }
        
        # 连接到豆包WebSocket
        print(f'连接到豆包WebSocket: {DOUBAO_WEBSOCKET_URL}')
        print(f'WebSocket头部: {headers}')
        
        # 使用更底层的方式创建WebSocket连接，以便传递头部
        import urllib.parse
        import asyncio
        
        # 解析WebSocket URL
        parsed_url = urllib.parse.urlparse(DOUBAO_WEBSOCKET_URL)
        host = parsed_url.netloc
        path = parsed_url.path or '/' 
        
        # 创建SSL上下文
        ssl_context = ssl.create_default_context()
        
        # 建立TCP连接
        reader, writer = await asyncio.open_connection(
            host, 443, ssl=ssl_context
        )
        
        # 构建WebSocket握手请求
        request = [
            f'GET {path} HTTP/1.1',
            f'Host: {host}',
            'Upgrade: websocket',
            'Connection: Upgrade',
            'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
            'Sec-WebSocket-Version: 13',
        ]
        
        # 添加自定义头部
        for key, value in headers.items():
            request.append(f'{key}: {value}')
        
        # 发送握手请求
        request.append('')
        request.append('')
        writer.write('\r\n'.join(request).encode('utf-8'))
        await writer.drain()
        
        # 读取握手响应
        response = await reader.read(4096)
        response_str = response.decode('utf-8')
        print(f'握手响应: {response_str[:200]}...')
        
        # 检查响应状态
        if 'HTTP/1.1 101 Switching Protocols' not in response_str:
            raise Exception(f'WebSocket握手失败: {response_str[:200]}...')
        
        print('成功连接到豆包WebSocket')
        
        # 双向数据传输
        async def forward_client_to_server():
            async for message in websocket:
                try:
                    # 发送客户端消息到豆包
                    # 注意：这里需要实现WebSocket帧的编码
                    # 简化处理，直接发送原始数据
                    print(f'收到客户端消息: {message[:100]}...')
                    # 解析客户端消息
                    try:
                        client_data = json.loads(message)
                        print(f'解析后的客户端消息: {client_data}')
                    except json.JSONDecodeError:
                        print('客户端消息不是有效的JSON')
                    
                    # 直接发送原始数据
                    writer.write(message)
                    await writer.drain()
                    print(f'发送到豆包: {message[:100]}...')
                except Exception as e:
                    print(f'发送到豆包失败: {e}')
                    import traceback
                    traceback.print_exc()
                    break
        
        async def forward_server_to_client():
            while True:
                try:
                    # 读取豆包响应
                    data = await reader.read(4096)
                    if not data:
                        break
                    # 发送豆包响应到客户端
                    await websocket.send(data)
                    print(f'从豆包接收: {data[:100]}...')
                except Exception as e:
                    print(f'发送到客户端失败: {e}')
                    import traceback
                    traceback.print_exc()
                    break
        
        # 启动双向转发
        await asyncio.gather(
            forward_client_to_server(),
            forward_server_to_client()
        )
        
    except Exception as e:
        print(f'WebSocket代理错误: {e}')
        import traceback
        traceback.print_exc()
    finally:
        try:
            if 'writer' in locals():
                writer.close()
                await writer.wait_closed()
            await websocket.close()
        except:
            pass

def run_http_server(port=8081):
    server_address = ('', port)
    httpd = HTTPServer(server_address, ProxyHandler)
    print(f'HTTP代理服务器运行在 http://localhost:{port}')
    print(f'HTTP代理端点: http://localhost:{port}/proxy/doubao')
    httpd.serve_forever()

async def run_websocket_server(port=8082):
    async with websockets.serve(
        handle_websocket_proxy,
        'localhost',
        port,
        # 允许跨域
        extra_headers=[
            ('Access-Control-Allow-Origin', '*'),
            ('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'),
            ('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ]
    ):
        print(f'WebSocket代理服务器运行在 ws://localhost:{port}')
        print(f'WebSocket代理端点: ws://localhost:{port}')
        await asyncio.Future()  # 无限运行

def run_http_server_in_thread():
    """在单独的线程中运行HTTP服务器"""
    server_address = ('', 8081)
    httpd = HTTPServer(server_address, ProxyHandler)
    print(f'HTTP代理服务器运行在 http://localhost:8081')
    print(f'HTTP代理端点: http://localhost:8081/proxy/doubao')
    httpd.serve_forever()

async def main():
    # 在单独的线程中启动HTTP服务器
    import threading
    http_thread = threading.Thread(target=run_http_server_in_thread, daemon=True)
    http_thread.start()
    
    # 等待HTTP服务器启动
    await asyncio.sleep(1)
    
    # 启动WebSocket服务器
    print(f'WebSocket代理服务器运行在 ws://localhost:8082')
    print(f'WebSocket代理端点: ws://localhost:8082')
    
    async with websockets.serve(
        handle_websocket_proxy,
        'localhost',
        8082
    ):
        await asyncio.Future()  # 无限运行

if __name__ == '__main__':
    print('启动代理服务器...')
    print('豆包WebSocket API地址:', DOUBAO_WEBSOCKET_URL)
    print('APP ID:', APP_ID)
    print('Access Token:', ACCESS_TOKEN[:10] + '...')
    
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print('\n正在停止服务器...')
        sys.exit(0)
