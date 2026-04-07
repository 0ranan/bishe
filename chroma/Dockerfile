FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && apt-get install -y wget curl

# 安装Chroma
RUN pip install chromadb

# 暴露Chroma默认端口
EXPOSE 8000

# 启动Chroma服务
CMD ["chroma", "run", "--host=0.0.0.0", "--port=8000"]