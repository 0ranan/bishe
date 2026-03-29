'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/student/StudentNavbar';
import StudentSidebar from '@/components/student/StudentSidebar';
import CourseInfo from '@/components/student/CourseInfo';

interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

interface Attendance {
  id: string;
  title: string;
  code: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'missed';
  attended: boolean;
}

export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [签到码, set签到码] = useState('');
  const [签到状态, set签到状态] = useState('');

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          router.push('/');
          return;
        }

        const courseResponse = await fetch(`/api/student/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!courseResponse.ok) {
          throw new Error('获取课程信息失败');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.course);

        const attendanceResponse = await fetch(`/api/student/courses/${courseId}/attendances`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!attendanceResponse.ok) {
          throw new Error('获取签到记录失败');
        }

        const attendanceData = await attendanceResponse.json();
        setAttendances(attendanceData.attendances);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router]);

  const handle签到 = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/');
        return;
      }

      if (!签到码) {
        set签到状态('请输入签到码');
        return;
      }

      const response = await fetch(`/api/student/courses/${courseId}/attendances`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: 签到码 }),
      });

      if (response.ok) {
        const data = await response.json();
        set签到状态(data.message);
        const attendanceResponse = await fetch(`/api/student/courses/${courseId}/attendances`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setAttendances(attendanceData.attendances);
        }
      } else {
        const data = await response.json();
        set签到状态(data.error);
      }
    } catch (err) {
      set签到状态('签到失败，请稍后重试');
    }
  };

  const handleBack = () => {
    router.push(`/student/course/${courseId}`);
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
      <StudentNavbar title="课程签到" onBack={handleBack} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <StudentSidebar courseId={courseId} activeMenuItem="attendance" />

          <div className="lg:col-span-3">
            {course && <CourseInfo course={course} />}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">提交签到</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">签到码</label>
                  <input
                    type="text"
                    value={签到码}
                    onChange={(e) => set签到码(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入签到码"
                  />
                </div>
                {签到状态 && (
                  <div className={`p-3 rounded-md ${签到状态.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {签到状态}
                  </div>
                )}
                <button
                  onClick={handle签到}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  提交签到
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">签到记录</h3>
              
              {attendances.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无签到记录
                </div>
              ) : (
                <div className="space-y-4">
                  {attendances.map((attendance) => (
                  <div key={attendance.id} className={`p-4 border rounded-md ${attendance.status === 'active' ? 'border-yellow-200 bg-yellow-50' : attendance.status === 'missed' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium text-gray-900">{attendance.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${attendance.status === 'active' ? 'bg-yellow-500 text-white' : attendance.status === 'missed' ? 'bg-red-500 text-white' : 'bg-gray-500 text-white'}`}>
                        {attendance.status === 'active' ? '进行中' : attendance.status === 'missed' ? '未签到' : '已结束'}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      <div>签到码: <span className="font-medium">{attendance.code}</span></div>
                      <div>开始时间: {new Date(attendance.start_time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
                      <div>结束时间: {new Date(attendance.end_time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
                      <div>签到状态: <span className={`font-medium ${attendance.attended ? 'text-green-600' : 'text-red-600'}`}>
                        {attendance.attended ? '已签到' : '未签到'}
                      </span></div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
