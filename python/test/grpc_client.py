#!/usr/bin/env python3

import grpc

# 导入生成的gRPC代码
import grpc_gen.proto.student_analysis_pb2 as student_analysis_pb2
import grpc_gen.proto.student_analysis_pb2_grpc as student_analysis_pb2_grpc

# 创建gRPC客户端
def run():
    # 连接到gRPC服务
    with grpc.insecure_channel('localhost:50051') as channel:
        # 创建服务 stub
        stub = student_analysis_pb2_grpc.StudentAnalysisServiceStub(channel)
        
        # 测试1: 获取模型信息
        print("=== 测试1: 获取模型信息 ===")
        try:
            response = stub.GetModelInfo(student_analysis_pb2.ModelInfoRequest())
            print(f"模型名称: {response.model_name}")
            print(f"模型版本: {response.model_version}")
            print(f"特征列表: {response.features}")
            print("成绩等级映射:")
            for code, grade in response.grade_mapping.items():
                print(f"  {code}: {grade}")
        except grpc.RpcError as e:
            print(f"获取模型信息失败: {e}")
        
        print("\n=== 测试2: 预测学生成绩 ===")
        # 测试2: 预测学生成绩
        test_cases = [
            {
                "name": "优秀学生",
                "video_learning": 95.0,
                "material_learning": 90.0,
                "chapter_study_count": 60,
                "discussion": 85.0,
                "attendance": 100.0
            },
            {
                "name": "中等学生",
                "video_learning": 75.0,
                "material_learning": 65.0,
                "chapter_study_count": 30,
                "discussion": 60.0,
                "attendance": 90.0
            },
            {
                "name": "需要关注的学生",
                "video_learning": 40.0,
                "material_learning": 30.0,
                "chapter_study_count": 10,
                "discussion": 20.0,
                "attendance": 60.0
            }
        ]
        
        for test_case in test_cases:
            print(f"\n测试学生: {test_case['name']}")
            try:
                # 构建请求
                request = student_analysis_pb2.PredictRequest(
                    video_learning=test_case['video_learning'],
                    material_learning=test_case['material_learning'],
                    chapter_study_count=test_case['chapter_study_count'],
                    discussion=test_case['discussion'],
                    attendance=test_case['attendance']
                )
                
                # 发送请求
                response = stub.PredictGrade(request)
                
                # 打印响应
                print(f"预测成绩等级: {response.grade}")
                print(f"成绩等级编码: {response.grade_code}")
                print(f"预测置信度: {response.confidence:.2f}")
            except grpc.RpcError as e:
                print(f"预测失败: {e}")

if __name__ == '__main__':
    run()
