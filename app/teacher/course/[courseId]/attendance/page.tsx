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

// 定义签到接口
interface Attendance {
  id: string;
  course_id: string;
  title: string;
  code: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended';
  total_students: number;
  attended_students: number;
}

export default function TeacherCourseAttendancePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // 发布签到表单状态
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30); // 默认30分钟

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

        // 获取签到记录
        const attendanceResponse = await fetch(`/api/teacher/courses/${courseId}/attendances`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!attendanceResponse.ok) {
          throw new Error('获取签到记录失败');
        }

        const attendanceData = await attendanceResponse.json();
        setAttendances(attendanceData.attendances || []);
        
        // 查找当前活跃的签到
        const activeAttendance = attendanceData.attendances?.find((att: Attendance) => att.status === 'active') || null;
        setCurrentAttendance(activeAttendance);
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

  // 发布签到
  const handlePublishAttendance = async () => {
    try {
      if (!title) {
        setMessage('请输入签到标题');
        setMessageType('error');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/teacher/courses/${courseId}/attendances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, duration }),
      });

      if (!response.ok) {
        throw new Error('发布签到失败');
      }

      const data = await response.json();
      setAttendances(prev => [data.attendance, ...prev]);
      setCurrentAttendance(data.attendance);
      setTitle('');
      setDuration(30);
      setMessage('签到发布成功');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '发布签到失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 结束签到
  const handleEndAttendance = async (attendanceId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/teacher/courses/${courseId}/attendances/${attendanceId}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('结束签到失败');
      }

      const data = await response.json();
      setAttendances(prev => prev.map(att => att.id === attendanceId ? data.attendance : att));
      setCurrentAttendance(null);
      setMessage('签到已结束');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '结束签到失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 格式化时间
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
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
          {/* 消息提示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

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

          {/* 发布签到 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">发布签到</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签到标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入签到标题"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">签到时长（分钟）</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  min="5"
                  max="120"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                onClick={handlePublishAttendance}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                发布签到
              </button>
            </div>
          </div>

          {/* 最新签到 */}
          {currentAttendance && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">最新签到</h3>
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-medium text-gray-900">{currentAttendance.title}</h4>
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">进行中</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">签到码</p>
                    <p className="font-medium text-gray-900">{currentAttendance.code}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">签到状态</p>
                    <p className="font-medium text-gray-900">
                      {currentAttendance.attended_students}/{currentAttendance.total_students} 人已签到
                      <span className="text-red-600 ml-2">
                        （还差 {currentAttendance.total_students - currentAttendance.attended_students} 人）
                      </span>
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">开始时间</p>
                    <p className="font-medium text-gray-900">{formatTime(currentAttendance.start_time)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">结束时间</p>
                    <p className="font-medium text-gray-900">{formatTime(currentAttendance.end_time)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleEndAttendance(currentAttendance.id)}
                  className="bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none"
                >
                  结束签到
                </button>
              </div>
            </div>
          )}

          {/* 历史签到 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">历史签到</h3>
            {attendances.filter(att => att.status === 'ended').length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无历史签到记录
              </div>
            ) : (
              <div className="space-y-4">
                {attendances
                  .filter(att => att.status === 'ended')
                  .map((attendance) => (
                    <div key={attendance.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">{attendance.title}</h4>
                        <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">已结束</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">签到码</p>
                          <p className="font-medium text-gray-900">{attendance.code}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">签到状态</p>
                          <p className="font-medium text-gray-900">
                            {attendance.attended_students}/{attendance.total_students} 人已签到
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">开始时间</p>
                          <p className="font-medium text-gray-900">{formatTime(attendance.start_time)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">结束时间</p>
                          <p className="font-medium text-gray-900">{formatTime(attendance.end_time)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
