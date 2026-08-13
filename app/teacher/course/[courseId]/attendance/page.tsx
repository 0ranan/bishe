'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';
import MessageToast from '@/components/teacher/MessageToast';

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
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(30);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          router.push('/');
          return;
        }

        const attendanceResponse = await fetch(
          `/api/teacher/courses/${courseId}/attendances`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!attendanceResponse.ok) {
          throw new Error('获取签到记录失败');
        }

        const attendanceData = await attendanceResponse.json();
        setAttendances(attendanceData.attendances || []);

        const activeAttendance =
          attendanceData.attendances?.find(
            (att: Attendance) => att.status === 'active'
          ) || null;
        setCurrentAttendance(activeAttendance);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, router]);

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
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, duration }),
      });

      if (!response.ok) {
        throw new Error('发布签到失败');
      }

      const data = await response.json();
      setAttendances((prev) => [data.attendance, ...prev]);
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

  const handleEndAttendance = async (attendanceId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(
        `/api/teacher/courses/${courseId}/attendances/${attendanceId}/end`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('结束签到失败');
      }

      const data = await response.json();
      setAttendances((prev) =>
        prev.map((att) => (att.id === attendanceId ? data.attendance : att))
      );
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

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (courseLoading || moduleLoading) {
    return <CourseContentSkeleton />;
  }

  if (courseError || error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">{courseError || error}</div>
      </div>
    );
  }

  return (
    <>
      <MessageToast message={message} type={messageType} />

      {course && <CourseInfo course={course} />}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">发布签到</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              签到标题
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="请输入签到标题"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              签到时长（分钟）
            </label>
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

      {currentAttendance && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">最新签到</h3>
          <div className="border border-gray-200 rounded-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium text-gray-900">{currentAttendance.title}</h4>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                进行中
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">签到码</p>
                <p className="font-medium text-gray-900">{currentAttendance.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">签到状态</p>
                <p className="font-medium text-gray-900">
                  {currentAttendance.attended_students}/
                  {currentAttendance.total_students} 人已签到
                  <span className="text-red-600 ml-2">
                    （还差{' '}
                    {currentAttendance.total_students -
                      currentAttendance.attended_students}{' '}
                    人）
                  </span>
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">开始时间</p>
                <p className="font-medium text-gray-900">
                  {formatTime(currentAttendance.start_time)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">结束时间</p>
                <p className="font-medium text-gray-900">
                  {formatTime(currentAttendance.end_time)}
                </p>
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">历史签到</h3>
        {attendances.filter((att) => att.status === 'ended').length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无历史签到记录</div>
        ) : (
          <div className="space-y-4">
            {attendances
              .filter((att) => att.status === 'ended')
              .map((attendance) => (
                <div key={attendance.id} className="border border-gray-200 rounded-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-gray-900">{attendance.title}</h4>
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      已结束
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500">签到码</p>
                      <p className="font-medium text-gray-900">{attendance.code}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">签到状态</p>
                      <p className="font-medium text-gray-900">
                        {attendance.attended_students}/{attendance.total_students}{' '}
                        人已签到
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">开始时间</p>
                      <p className="font-medium text-gray-900">
                        {formatTime(attendance.start_time)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">结束时间</p>
                      <p className="font-medium text-gray-900">
                        {formatTime(attendance.end_time)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
