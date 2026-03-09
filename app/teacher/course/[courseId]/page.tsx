'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义视频接口
interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

// 定义班级接口
interface Class {
  class_id: string;
  class_name: string;
  grade: string;
  is_connected: boolean;
}

// 定义用户接口
interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 消息提示状态
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // 获取课程信息、视频列表和班级列表
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

        // 获取课程视频
        const videosResponse = await fetch(`/api/teacher/courses/${courseId}/videos`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        setVideos(videosData.videos);

        // 获取班级列表（包括绑定状态）
        const classesResponse = await fetch(`/api/teacher/courses/${courseId}/classes`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!classesResponse.ok) {
          throw new Error('获取班级列表失败');
        }

        const classesData = await classesResponse.json();
        setClasses(classesData.classes);
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

  // 处理班级绑定/解绑
  const handleToggleClassConnection = async (classId: string, isConnected: boolean) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const method = isConnected ? 'DELETE' : 'POST';
      const response = await fetch(`/api/teacher/courses/${courseId}/classes/${classId}`, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(isConnected ? '解绑班级失败' : '绑定班级失败');
      }

      // 重新获取班级列表
      const classesResponse = await fetch(`/api/teacher/courses/${courseId}/classes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const classesData = await classesResponse.json();
      setClasses(classesData.classes);

      setMessage(isConnected ? '班级解绑成功' : '班级绑定成功');
      setMessageType('success');
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
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
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  我的班级
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1">
          {/* 消息提示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* 课程信息 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">课程详情</h2>
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

          {/* 班级绑定 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">班级绑定</h3>
            <p className="text-gray-600 mb-4">选择要绑定到本课程的班级：</p>
            
            {classes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                暂无班级
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div key={cls.class_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md hover:bg-gray-50">
                    <div>
                      <h4 className="font-medium text-gray-900">{cls.class_name}</h4>
                      <div className="text-sm text-gray-500">年级: {cls.grade}</div>
                    </div>
                    <button
                      onClick={() => handleToggleClassConnection(cls.class_id, cls.is_connected)}
                      className={`py-2 px-4 rounded-md focus:outline-none ${cls.is_connected ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    >
                      {cls.is_connected ? '解绑' : '绑定'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 视频列表 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">课程视频</h3>
            
            {videos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无视频
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <div key={video.id} className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50">
                    <div className="flex-shrink-0 w-16 h-10 bg-gray-200 rounded flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-900">{video.title}</h4>
                      <div className="text-sm text-gray-500">时长: {video.duration}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => router.push(`/teacher/course/${courseId}/video/${video.id}`)}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                      >
                        观看视频
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
