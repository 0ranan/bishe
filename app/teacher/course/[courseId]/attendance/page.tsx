'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

// 定义用户接口
interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

export default function TeacherCourseAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取课程信息
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        // 从本地存储获取 token
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!accessToken || !userData) {
          // 未登录，重定向到登录页面
          router.push('/');
          return;
        }

        // 解析用户信息
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // 验证用户类型
        if (parsedUser.type !== 'teacher') {
          router.push('/');
          return;
        }

        // 获取课程信息
        const courseResponse = await fetch(`/api/teacher/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!courseResponse.ok) {
          throw new Error('获取课程信息失败');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.course);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router]);

  // 返回到课程列表
  const handleBack = () => {
    router.push('/teacher');
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
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
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
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  我的班级
                </button>
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">课程管理</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/attendance`)}
                  className="w-full text-left py-2 px-3 rounded-md bg-blue-50 text-blue-600 font-medium"
                >
                  课程签到
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/chapters`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  课程章节
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/discussion`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  课程讨论
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/diagnosis`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  学情诊断
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/assignments`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  课程作业
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1">
          {/* 课程信息 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">课程签到</h2>
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                ← 返回课程列表
              </button>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{course?.course_name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-gray-600">课程ID: {course?.course_id}</div>
              <div className="text-gray-600">学分: {course?.credit}</div>
            </div>
          </div>

          {/* 签到功能 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">签到管理</h3>
            <div className="text-center py-12 text-gray-500">
              课程签到功能开发中...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
