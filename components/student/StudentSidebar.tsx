'use client';

import React from 'react';
import Link from 'next/link';

interface StudentSidebarProps {
  courseId: string;
  activeMenuItem?: string;
}

export default function StudentSidebar({ courseId, activeMenuItem }: StudentSidebarProps) {
  const menuItems = [
    { key: 'dashboard', label: '代办界面', path: `/student/course/${courseId}` },
    { key: 'attendance', label: '课程签到', path: `/student/course/${courseId}/attendance` },
    { key: 'chapters', label: '课程章节', path: `/student/course/${courseId}/chapters` },
    { key: 'resources', label: '课程附件', path: `/student/course/${courseId}/resources` },
    { key: 'discussion', label: '课程讨论', path: `/student/course/${courseId}/discussion` },
    { key: 'diagnosis', label: '学情诊断', path: `/student/course/${courseId}/diagnosis` },
    { key: 'assignments', label: '课程作业', path: `/student/course/${courseId}/assignments` },
    { key: 'ai-assistant', label: 'AI助教', path: `/student/course/${courseId}/ai-assistant` },
  ];

  return (
    <div className="w-full lg:w-44 shrink-0">
      <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 sticky top-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 px-1">课程功能</h3>
        <div className="space-y-0.5">
          {menuItems.map((item) => (
            <Link
              key={item.key}
              href={item.path}
              className={`block w-full text-left px-3 py-2 rounded-md ${
                activeMenuItem === item.key
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
