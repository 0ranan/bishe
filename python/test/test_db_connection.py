import os
import psycopg2
import pandas as pd

# 从环境变量获取数据库连接信息
host = os.environ.get('POSTGRES_HOST', 'postgres')
port = os.environ.get('POSTGRES_PORT', '5432')
user = os.environ.get('POSTGRES_USER', 'vibe_user')
password = os.environ.get('POSTGRES_PASSWORD', 'vibe_password')
database = os.environ.get('POSTGRES_DB', 'vibe_db')

print("正在连接到数据库...")
try:
    # 建立数据库连接
    conn = psycopg2.connect(
        host=host,
        port=port,
        user=user,
        password=password,
        database=database
    )
    print("数据库连接成功！")
    
    # 创建游标
    cur = conn.cursor()
    
    # 测试查询
    print("\n测试数据库查询:")
    
    # 检查students表是否存在
    cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'students')")
    students_exists = cur.fetchone()[0]
    print(f"students表存在: {students_exists}")
    
    # 如果students表存在，查询学生数量
    if students_exists:
        cur.execute("SELECT COUNT(*) FROM students")
        count = cur.fetchone()[0]
        print(f"学生数量: {count}")
    
    # 检查courses表是否存在
    cur.execute("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'courses')")
    courses_exists = cur.fetchone()[0]
    print(f"courses表存在: {courses_exists}")
    
    # 如果courses表存在，查询课程数量
    if courses_exists:
        cur.execute("SELECT COUNT(*) FROM courses")
        count = cur.fetchone()[0]
        print(f"课程数量: {count}")
    
    # 关闭游标和连接
    cur.close()
    conn.close()
    print("\n数据库连接已关闭")
    
    print("\n测试完成，连接成功！")
    
except Exception as e:
    print(f"数据库连接失败: {e}")
