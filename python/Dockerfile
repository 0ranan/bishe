# 使用官方Python基础镜像
FROM python:3.10-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    libpq-dev \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    xfonts-wqy \
    && rm -rf /var/lib/apt/lists/*

# 复制requirements.txt文件
COPY requirements.txt .

# 安装Python依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 设置环境变量
ENV PYTHONUNBUFFERED=1

# 暴露端口（如果需要）
# EXPOSE 8000

# 暴露gRPC服务端口
EXPOSE 50051

# 运行命令
CMD ["python", "grpc_server.py"]