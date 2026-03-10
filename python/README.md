# Python 环境配置与数据分析

## 目录说明

本目录包含用于学生数据分析和深度学习应用的Python环境配置和相关脚本。主要用于支持基于数据库的学生学习行为分析、预测模型构建和数据可视化。

## 文件结构

```
python/
├── Dockerfile              # Docker环境配置文件
├── main.py                 # 主分析脚本
├── code.ipynb              # Jupyter Notebook分析文件
├── grpc_server.py          # gRPC服务端实现
├── generate_grpc_code.py   # 生成gRPC代码的脚本
├── models/                 # 模型文件目录
│   ├── best_model.pkl      # 训练好的最佳模型
│   ├── scaler.pkl          # 数据标准化器
│   ├── features.pkl        # 特征列表
│   └── grade_mapping.pkl   # 成绩等级映射
├── img/                    # 生成的可视化图表
├── proto/                  # gRPC协议定义
│   └── student_analysis.proto  # 服务和消息定义
├── grpc_gen/               # 生成的gRPC代码
├── test/                   # 测试脚本目录
│   ├── check_grade_mapping.py  # 检查成绩映射脚本
│   ├── check_port.py       # 端口检查脚本
│   ├── test_db_connection.py   # 数据库连接测试脚本
│   └── grpc_client.py      # gRPC客户端示例
└── README.md               # 本说明文件
```

## Docker环境配置

### 基础镜像
- 使用 `python:3.10-slim` 作为基础镜像，提供轻量级的Python运行环境

### 系统依赖
- 安装了必要的系统依赖，包括 gcc、g++、make 和 libpq-dev
- libpq-dev 用于PostgreSQL数据库连接

### Python依赖
- psycopg2-binary: PostgreSQL数据库驱动
- pandas: 数据处理和分析
- numpy: 数值计算

### 工作目录
- 工作目录设置为 `/app`

### 环境变量
- 设置 `PYTHONUNBUFFERED=1` 以确保输出实时显示

## 数据库连接

### 连接配置
- 数据库连接信息通过环境变量从docker-compose.yml中获取
- 连接参数：
  - 主机：postgres
  - 端口：5432
  - 用户名：vibe_user
  - 密码：vibe_password
  - 数据库名：vibe_db

### 测试连接
- 使用 `test_db_connection.py` 脚本测试数据库连接
- 该脚本会检查数据库连接状态和基本表结构

## 模型文件说明

### models目录文件作用

1. **best_model.pkl**
   - 描述：训练好的最佳预测模型（随机森林模型）
   - 用途：用于预测学生成绩等级
   - 输入：学生学习行为特征（音视频学习、资料自主学习、章节学习次数、讨论、签到）
   - 输出：学生成绩等级预测结果

2. **scaler.pkl**
   - 描述：数据标准化器
   - 用途：对输入特征进行标准化处理，确保模型输入数据的一致性
   - 使用方法：在预测前，需要使用该标准化器对新数据进行与训练数据相同的处理

3. **features.pkl**
   - 描述：特征列表
   - 用途：存储模型使用的特征名称，确保预测时使用与训练时相同的特征顺序
   - 内容：['音视频学习(100%)', '资料自主学习(100%)', '章节学习次数', '讨论(100%)', '签到(100%)']

4. **grade_mapping.pkl**
   - 描述：成绩等级映射
   - 用途：将模型输出的数字标签映射回实际的成绩等级
   - 映射关系：{0: '不合格', 1: '合格', 2: '中', 3: '良', 4: '优'}

### 模型使用示例

```python
import joblib

# 加载模型和相关文件
best_model = joblib.load('models/best_model.pkl')
scaler = joblib.load('models/scaler.pkl')
features = joblib.load('models/features.pkl')
grade_mapping = joblib.load('models/grade_mapping.pkl')

# 准备新数据（示例）
new_data = {
    '音视频学习(100%)': 95,
    '资料自主学习(100%)': 85,
    '章节学习次数': 50,
    '讨论(100%)': 70,
    '签到(100%)': 100
}

# 转换为模型输入格式
X_new = [new_data[feature] for feature in features]
X_new_scaled = scaler.transform([X_new])

# 预测
prediction = best_model.predict(X_new_scaled)[0]

# 转换为成绩等级
grade = grade_mapping[prediction]
print(f"预测成绩等级: {grade}")
```

## 使用方法

### 1. 启动Docker容器

```bash
docker-compose up -d
```

### 2. 测试数据库连接

```bash
docker exec -it vibe_python python test/test_db_connection.py
```

### 3. 运行主分析脚本

```bash
docker exec -it vibe_python python main.py
```

### 4. 使用Jupyter Notebook

```bash
docker exec -it vibe_python jupyter notebook --ip=0.0.0.0 --port=8888 --no-browser --allow-root
```

然后在浏览器中访问输出的URL。

## 应用场景

1. **学生学习行为分析**：分析视频观看、资源下载、作业提交等行为数据
2. **学习成绩预测**：基于历史数据预测学生成绩
3. **dropout风险评估**：识别可能辍学的学生
4. **学习行为模式识别**：聚类分析不同类型的学习者
5. **评论情感分析**：分析学生对课程内容的反馈
6. **个性化学习推荐**：基于学习行为推荐适合的学习资源

## 数据来源

分析所需的数据主要来自项目数据库，包括：
- 学生基本信息（students表）
- 学习行为数据（video_play_duration、resource_downloads等表）
- 教学互动数据（attendance_records、topic_comments等表）
- 成绩数据（assignments表）

## 注意事项

1. **数据隐私**：处理学生数据时应注意隐私保护，确保数据匿名化
2. **环境配置**：根据实际需求调整Dockerfile中的依赖和配置
3. **资源需求**：深度学习模型训练可能需要较高的计算资源
4. **版本兼容**：确保Python包版本与项目需求兼容
5. **数据库连接**：确保PostgreSQL数据库服务正常运行

## gRPC服务

### 简介
本项目提供了基于gRPC的学生成绩预测服务，方便外部系统调用预测模型。

### 文件结构

```
python/
├── proto/                     # gRPC协议定义
│   └── student_analysis.proto  # 服务和消息定义
├── grpc_gen/                  # 生成的gRPC代码
├── grpc_server.py             # gRPC服务端实现
├── generate_grpc_code.py       # 生成gRPC代码的脚本
└── test/                      # 测试脚本目录
    └── grpc_client.py         # gRPC客户端示例
```

### 使用方法

#### 1. 生成gRPC代码

```bash
docker exec -it vibe_python python generate_grpc_code.py
```

#### 2. 启动gRPC服务

```bash
docker exec -d vibe_python python grpc_server.py
```

#### 3. 测试gRPC服务

```bash
docker exec -it vibe_python python test/grpc_client.py
```

### gRPC服务接口

#### 1. PredictGrade
- **功能**：预测学生成绩等级
- **请求参数**：
  - video_learning: 音视频学习完成率（0-100）
  - material_learning: 资料自主学习完成率（0-100）
  - chapter_study_count: 章节学习次数
  - discussion: 讨论参与度（0-100）
  - attendance: 签到完成率（0-100）
- **响应**：
  - grade: 预测的成绩等级（如"优"、"良"等）
  - grade_code: 预测的成绩等级编码
  - confidence: 预测置信度

#### 2. GetModelInfo
- **功能**：获取模型信息
- **请求参数**：无
- **响应**：
  - model_name: 模型名称
  - model_version: 模型版本
  - features: 特征列表
  - grade_mapping: 成绩等级映射

### 外部系统调用示例

```python
import grpc

# 导入生成的gRPC代码
import grpc_gen.proto.student_analysis_pb2 as student_analysis_pb2
import grpc_gen.proto.student_analysis_pb2_grpc as student_analysis_pb2_grpc

# 连接到gRPC服务
with grpc.insecure_channel('localhost:50051') as channel:
    # 创建服务 stub
    stub = student_analysis_pb2_grpc.StudentAnalysisServiceStub(channel)
    
    # 构建请求
    request = student_analysis_pb2.PredictRequest(
        video_learning=90.0,
        material_learning=85.0,
        chapter_study_count=50,
        discussion=70.0,
        attendance=95.0
    )
    
    # 发送请求
    response = stub.PredictGrade(request)
    
    # 处理响应
    print(f"预测成绩等级: {response.grade}")
    print(f"预测置信度: {response.confidence:.2f}")
```

## 后续步骤

1. 根据具体分析需求，修改和扩展 `main.py` 脚本
2. 使用 `code.ipynb` 进行交互式数据分析和可视化
3. 构建和训练深度学习模型
4. 部署分析模型（如需要）
5. 定期更新分析结果和模型
6. 集成gRPC服务到其他系统中

通过本环境配置，可以高效地进行学生数据的深度分析，为教育决策和学生发展提供有力支持。