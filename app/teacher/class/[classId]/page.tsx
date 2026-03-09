'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义学生接口
interface Student {
  student_id: string;
  name: string;
  grade: string;
  major: string;
}

// 定义班级接口
interface Class {
  class_id: string;
  class_name: string;
  grade: string;
  student_count: number;
}

// 定义用户接口
interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

export default function TeacherClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 检查用户登录状态并获取班级详情
  useEffect(() => {
    const checkLoginAndGetClassDetails = async () => {
      try {
        // 从本地存储获取 token
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!accessToken || !userData) {
          // 未登录，重定向到登录页面
          window.location.href = '/';
          return;
        }

        // 解析用户信息
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // 验证用户类型
        if (parsedUser.type !== 'teacher') {
          window.location.href = '/';
          return;
        }

        // 获取班级详情
        const classResponse = await fetch(`/api/teacher/classes/${classId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!classResponse.ok) {
          throw new Error('获取班级信息失败');
        }

        const classData = await classResponse.json();
        setCls(classData.class);

        // 获取班级学生列表
        const studentsResponse = await fetch(`/api/teacher/classes/${classId}/students`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!studentsResponse.ok) {
          throw new Error('获取学生列表失败');
        }

        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取班级详情失败');
        // 登录过期或出错，重定向到登录页面
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    checkLoginAndGetClassDetails();
  }, [classId, router]);

  // 返回到班级列表
  const handleBack = () => {
    router.push('/teacher/classes');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">教师中心</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.name}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
                className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 侧边栏 */}
        <div className="w-64 mr-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">导航菜单</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push('/teacher')}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  我的课程
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/teacher/classes')}
                  className="w-full text-left py-2 px-3 rounded-md bg-blue-50 text-blue-600 font-medium"
                >
                  我的班级
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1">
          {/* 班级信息 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">班级详情</h2>
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                ← 返回班级列表
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-gray-600">班级ID: {cls?.class_id}</div>
              <div className="text-gray-600">班级名称: {cls?.class_name}</div>
              <div className="text-gray-600">年级: {cls?.grade}</div>
              <div className="text-gray-600">学生人数: {cls?.student_count}</div>
            </div>
          </div>

          {/* 学生列表 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">学生列表</h3>
            
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无学生
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        学号
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        姓名
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        年级
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        专业
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.student_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.major}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
