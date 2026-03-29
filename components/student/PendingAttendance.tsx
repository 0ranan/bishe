'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Attendance {
  id: string;
  title: string;
  code: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'missed';
  attended: boolean;
}

interface PendingAttendanceProps {
  attendances: Attendance[];
  courseId: string;
}

export default function PendingAttendance({ attendances, courseId }: PendingAttendanceProps) {
  const router = useRouter();
  const pendingAttendances = attendances.filter(a => a.status === 'active' && !a.attended);

  if (pendingAttendances.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">待签到</h3>
      <div className="space-y-4">
        {pendingAttendances.map((attendance) => (
          <div key={attendance.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">{attendance.title}</h4>
              <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded">进行中</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              <div>签到码: <span className="font-medium">{attendance.code}</span></div>
              <div>结束时间: {new Date(attendance.end_time).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</div>
            </div>
            <div className="mt-3">
              <button
                onClick={() => router.push(`/student/course/${courseId}/attendance`)}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                去签到
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
