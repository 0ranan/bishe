import subprocess

# 运行pip freeze命令并将输出写入requirements.txt
result = subprocess.run(['pip', 'freeze'], capture_output=True, text=True)
with open('requirements.txt', 'w') as f:
    f.write(result.stdout)

print("依赖已导出到 requirements.txt")
