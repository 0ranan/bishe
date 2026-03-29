'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface StudentSidebarProps {
  courseId: string;
  activeMenuItem?: string;
}

export default function StudentSidebar({ courseId, activeMenuItem }: StudentSidebarProps) {
  const router = useRouter();

  const menuItems = [
    { key: 'dashboard', label: '代办界面', path: `/student/course/${courseId}` },
    { key: 'attendance', label: '课程签到', path: `/student/course/${courseId}/attendance` },
    { key: 'chapters', label: '课程章节', path: `/student/course/${courseId}/chapters` },
    { key: 'discussion', label: '课程讨论', path: `/student/course/${courseId}/discussion` },
    { key: 'diagnosis', label: '学情诊断', path: `/student/course/${courseId}/diagnosis` },
    { key: 'assignments', label: '课程作业', path: `/student/course/${courseId}/assignments` },
  ];

  return (
    <div className="lg:col-span-1">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">课程功能</h3>
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button 
              key={item.key}
              onClick={() => router.push(item.path)}
              className={`w-full text-left p-3 rounded-md ${activeMenuItem === item.key ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
