#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
WebSocket代理服务器，用于连接豆包实时语音大模型
"""
import asyncio
import websockets
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
import threading

# 配置
APP_ID = "5170768269"
ACCESS_TOKEN = "f-lqvDDO4HPv_wKWDN4plrLSu0_9fo"
DOUBAO_WS_URL = "wss://openspeech.bytedance.com/api/v3/realtime/dialogue"

# 存储活动的WebSocket连接
active_connections = {}

async def handle_doubao_connection(client_websocket, path):
    """处理与客户端的WebSocket连接，并转发到豆包API"""
    print(f"新的客户端连接: {path}")
    
    doubao_websocket = None
    
    try:
        # 连接到豆包WebSocket API
        headers = {
            "X-Api-App-ID": APP_ID,
            "X-Api-Access-Key": ACCESS_TOKEN,
            "X-Api-Resource-Id": "volc.speech.dialog",
            "X-Api-App-Key": "PlgvMymc7f3tQnJ6"
        }
        
        print(f"正在连接到豆包WebSocket API: {DOUBAO_WS_URL}")
        
        async with websockets.connect(
            DOUBAO_WS_URL,
            extra_headers=headers
        ) as doubao_websocket:
            print("已连接到豆包WebSocket API")
            
            # 创建双向转发任务
            async def client_to_doubao():
                """从客户端转发消息到豆包"""
                try:
                    async for message in client_websocket:
                        print(f"收到客户端消息: {message[:100]}...")
                        await doubao_websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    print("客户端连接已关闭")
            
            async def doubao_to_client():
                """从豆包转发消息到客户端"""
                try:
                    async for message in doubao_websocket:
                        print(f"收到豆包消息: {message[:100]}...")
                        await client_websocket.send(message)
                except websockets.exceptions.ConnectionClosed:
                    print("豆包连接已关闭")
            
            # 运行两个转发任务
            await asyncio.gather(
                client_to_doubao(),
                doubao_to_client()
            )
    
    except Exception as e:
        print(f"WebSocket连接错误: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        print("连接已关闭")

class SimpleHTTPHandler(BaseHTTPRequestHandler):
    """简单的HTTP处理器，用于健康检查"""
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def log_message(self, format, *args):
        print(f'[HTTP] {format % args}')

def run_http_server():
    """运行简单的HTTP服务器"""
    server = HTTPServer(('localhost', 8082), SimpleHTTPHandler)
    print(f"HTTP健康检查服务器运行在 http://localhost:8082/health")
    server.serve_forever()

async def main():
    """主函数"""
    # 启动HTTP健康检查服务器
    http_thread = threading.Thread(target=run_http_server, daemon=True)
    http_thread.start()
    
    # 启动WebSocket服务器
    print(f"WebSocket代理服务器运行在 ws://localhost:8081")
    print(f"转发到: {DOUBAO_WS_URL}")
    print("按 Ctrl+C 停止服务器")
    
    async with websockets.serve(handle_doubao_connection, "localhost", 8081):
        await asyncio.Future()  # 永远运行

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n正在停止服务器...")
