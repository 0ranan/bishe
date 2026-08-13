'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

export default function TeacherPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 发布新课程相关状态
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseCredit, setNewCourseCredit] = useState(3);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [classes, setClasses] = useState<{class_id: string, class_name: string, grade: string}[]>([]);
  
  // 消息提示状态
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // 检查用户登录状态并获取课程和班级
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
        if (parsedUser.type !== 'teacher') {
          window.location.href = '/';
          return;
        }

        // 获取教师的课程
        const response = await fetch('/api/teacher/courses', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取课程失败');
        }

        const data = await response.json();
        setCourses(data.courses);

        // 获取教师的班级
        const classesResponse = await fetch('/api/teacher/classes', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!classesResponse.ok) {
          throw new Error('获取班级失败');
        }

        const classesData = await classesResponse.json();
        setClasses(classesData.classes);
        // 默认选择所有班级
        setSelectedClasses(classesData.classes.map((cls: any) => cls.class_id));
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

  // 处理发布新课程
  const handleAddCourse = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken || !newCourseName) return;

      const response = await fetch('/api/teacher/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_name: newCourseName,
          credit: newCourseCredit,
          class_ids: selectedClasses,
        }),
      });

      if (!response.ok) {
        throw new Error('发布课程失败');
      }

      // 重新获取课程列表
      const coursesResponse = await fetch('/api/teacher/courses', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const coursesData = await coursesResponse.json();
      setCourses(coursesData.courses);

      setNewCourseName('');
      setNewCourseCredit(3);
      setSelectedClasses(classes.map(cls => cls.class_id));
      setShowAddCourse(false);
      setMessage('课程发布成功');
      setMessageType('success');
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '发布课程失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 处理班级选择变化
  const handleClassChange = (classId: string) => {
    setSelectedClasses(prev => {
      if (prev.includes(classId)) {
        return prev.filter(id => id !== classId);
      } else {
        return [...prev, classId];
      }
    });
  };

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
    <div>
      {/* 消息提示 */}
      {message && (
        <div className={`mb-6 p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message}
        </div>
      )}

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">我的课程</h2>
          <button
            onClick={() => setShowAddCourse(!showAddCourse)}
            className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none"
          >
            {showAddCourse ? '取消发布' : '发布新课程'}
          </button>
        </div>
        <p className="text-gray-600 mb-6">以下是您所教授的所有课程：</p>

        {/* 发布新课程表单 */}
        {showAddCourse && (
          <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
            <h4 className="text-lg font-medium text-gray-900 mb-3">发布新课程</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">课程名称</label>
                <input
                  type="text"
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder="请输入课程名称"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">学分</label>
                <input
                  type="number"
                  value={newCourseCredit}
                  onChange={(e) => setNewCourseCredit(parseInt(e.target.value) || 0)}
                  min="1"
                  max="6"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">选择班级</label>
                <div className="space-y-2">
                  {classes.map((cls) => (
                    <div key={cls.class_id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`class-${cls.class_id}`}
                        checked={selectedClasses.includes(cls.class_id)}
                        onChange={() => handleClassChange(cls.class_id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`class-${cls.class_id}`} className="ml-2 block text-sm text-gray-700">
                        {cls.class_name} ({cls.grade})
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={handleAddCourse}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                发布课程
              </button>
            </div>
          </div>
        )}

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
                  onClick={() => router.push(`/teacher/course/${course.course_id}`)}
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
  );
}
