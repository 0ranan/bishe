#!/usr/bin/env python3

import time
import grpc
import joblib
import numpy as np
from concurrent import futures

# 导入生成的gRPC代码
import grpc_gen.proto.student_analysis_pb2 as student_analysis_pb2
import grpc_gen.proto.student_analysis_pb2_grpc as student_analysis_pb2_grpc

# 加载模型和相关文件
class ModelLoader:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.features = None
        self.grade_mapping = None
        self.load_model()
    
    def load_model(self):
        print("加载模型...")
        self.model = joblib.load('models/best_model.pkl')
        self.scaler = joblib.load('models/scaler.pkl')
        self.features = joblib.load('models/features.pkl')
        self.grade_mapping = joblib.load('models/grade_mapping.pkl')
        print("模型加载完成")

# 实现学生分析服务
class StudentAnalysisService(student_analysis_pb2_grpc.StudentAnalysisServiceServicer):
    def __init__(self):
        self.model_loader = ModelLoader()
    
    def PredictGrade(self, request, context):
        print("接收到预测请求...")
        
        # 准备特征数据
        features = [
            request.video_learning,
            request.material_learning,
            request.chapter_study_count,
            request.discussion,
            request.attendance
        ]
        
        # 数据标准化
        features_scaled = self.model_loader.scaler.transform([features])
        
        # 预测
        prediction = self.model_loader.model.predict(features_scaled)[0]
        
        # 获取置信度
        try:
            # 对于分类模型，获取预测概率
            if hasattr(self.model_loader.model, 'predict_proba'):
                probabilities = self.model_loader.model.predict_proba(features_scaled)[0]
                confidence = float(max(probabilities))
            else:
                confidence = 0.0
        except:
            confidence = 0.0
        
        # 转换为成绩等级
        # 反转grade_mapping的键值对，因为实际存储的是{grade: code}而不是{code: grade}
        reverse_mapping = {v: k for k, v in self.model_loader.grade_mapping.items()}
        grade = reverse_mapping.get(prediction, "未知")
        
        print(f"预测结果: {grade} (置信度: {confidence:.2f})")
        
        # 返回响应
        return student_analysis_pb2.PredictResponse(
            grade=grade,
            grade_code=int(prediction),
            confidence=confidence
        )
    
    def GetModelInfo(self, request, context):
        print("接收到模型信息请求...")
        
        # 准备模型信息
        model_info = student_analysis_pb2.ModelInfoResponse(
            model_name="随机森林学生成绩预测模型",
            model_version="1.0.0",
            features=self.model_loader.features
        )
        
        # 添加成绩等级映射
        # 反转grade_mapping的键值对，因为实际存储的是{grade: code}而不是{code: grade}
        reverse_mapping = {v: k for k, v in self.model_loader.grade_mapping.items()}
        for code, grade in reverse_mapping.items():
            model_info.grade_mapping[code] = grade
        
        return model_info

# 启动gRPC服务
def serve():
    server = grpc.server(futures.ThreadPoolExecutor(max_workers=10))
    student_analysis_pb2_grpc.add_StudentAnalysisServiceServicer_to_server(
        StudentAnalysisService(), server
    )
    server.add_insecure_port('0.0.0.0:50051')
    server.start()
    print("gRPC服务启动成功，监听端口50051")
    
    # 保持服务运行
    try:
        while True:
            time.sleep(86400)  # 一天
    except KeyboardInterrupt:
        server.stop(0)

if __name__ == '__main__':
    serve()
