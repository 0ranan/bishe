'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

export default function TeacherClassesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 检查用户登录状态并获取班级列表
  useEffect(() => {
    const checkLoginAndGetClasses = async () => {
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

        // 获取教师的班级
        const response = await fetch('/api/teacher/classes', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取班级失败');
        }

        const data = await response.json();
        setClasses(data.classes);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取班级失败');
        // 登录过期或出错，重定向到登录页面
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    checkLoginAndGetClasses();
  }, []);

  // 登出功能
  const handleLogout = () => {
    // 清除本地存储的 token 和用户信息
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    // 重定向到登录页面
    window.location.href = '/';
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
                onClick={handleLogout}
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
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">我的班级</h2>
            <p className="text-gray-600 mb-6">以下是您所教授的所有班级：</p>

            {/* 班级列表 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500">
                  暂无班级
                </div>
              ) : (
                classes.map((cls) => (
                  <div key={cls.class_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{cls.class_name}</h3>
                    <div className="text-gray-600 mb-2">班级ID: {cls.class_id}</div>
                    <div className="text-gray-600 mb-2">年级: {cls.grade}</div>
                    <div className="text-gray-600 mb-4">学生人数: {cls.student_count}</div>
                    <button 
                      onClick={() => router.push(`/teacher/class/${cls.class_id}`)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                    >
                      查看详情
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
