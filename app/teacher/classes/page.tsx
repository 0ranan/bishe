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

export default function TeacherClassesPage() {
  const router = useRouter();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
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
  );
}
