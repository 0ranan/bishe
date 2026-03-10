#!/usr/bin/env python3

import socket

def check_port(port):
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    result = sock.connect_ex(('0.0.0.0', port))
    if result == 0:
        print(f"端口 {port} 已被绑定")
    else:
        print(f"端口 {port} 未被绑定")
    sock.close()

if __name__ == '__main__':
    check_port(50051)
