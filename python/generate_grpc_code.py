#!/usr/bin/env python3

import os
import subprocess

# 生成gRPC代码
print("生成gRPC代码...")

# 定义proto文件路径
proto_file = "proto/student_analysis.proto"

# 定义输出目录
output_dir = "grpc_gen"

# 创建输出目录
if not os.path.exists(output_dir):
    os.makedirs(output_dir)

# 生成gRPC代码
cmd = [
    "python", "-m", "grpc_tools.protoc",
    "-I=.",
    f"--python_out={output_dir}",
    f"--grpc_python_out={output_dir}",
    proto_file
]

result = subprocess.run(cmd, capture_output=True, text=True)

if result.returncode == 0:
    print("gRPC代码生成成功！")
    print(f"生成的文件:")
    for file in os.listdir(output_dir):
        print(f"  - {file}")
else:
    print("gRPC代码生成失败:")
    print(result.stderr)
