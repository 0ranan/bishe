'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';


// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

export default function StudentPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 检查用户登录状态并获取课程
  useEffect(() => {
    const checkLoginAndGetCourses = async () => {
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
        if (parsedUser.type !== 'student') {
          window.location.href = '/';
          return;
        }

        // 获取学生所在班级的课程
        const response = await fetch('/api/student/courses', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取课程失败');
        }

        const data = await response.json();
        setCourses(data.courses);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程失败');
        // 登录过期或出错，重定向到登录页面
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    checkLoginAndGetCourses();
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
      <h2 className="text-2xl font-bold text-gray-900 mb-4">我的课程</h2>
      <p className="text-gray-600 mb-6">以下是您所在班级的所有课程：</p>

      {/* 课程列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            暂无课程
          </div>
        ) : (
          courses.map((course) => (
            <div key={course.course_id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.course_name}</h3>
              <div className="text-gray-600 mb-4">课程ID: {course.course_id}</div>
              <div className="text-gray-600 mb-4">学分: {course.credit}</div>
              <button 
                onClick={() => router.push(`/student/course/${course.course_id}`)}
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
