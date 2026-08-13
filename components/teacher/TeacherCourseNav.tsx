'use client';

import React from 'react';
import Link from 'next/link';

interface TeacherCourseNavProps {
  courseId: string;
  activeMenuItem?: string;
}

export default function TeacherCourseNav({
  courseId,
  activeMenuItem,
}: TeacherCourseNavProps) {
  const menuItems = [
    { key: 'attendance', label: '课程签到', path: `/teacher/course/${courseId}/attendance` },
    { key: 'chapters', label: '课程章节', path: `/teacher/course/${courseId}/chapters` },
    { key: 'resources', label: '课程附件', path: `/teacher/course/${courseId}/resources` },
    { key: 'discussion', label: '课程讨论', path: `/teacher/course/${courseId}/discussion` },
    { key: 'diagnosis', label: '学情诊断', path: `/teacher/course/${courseId}/diagnosis` },
    { key: 'assignments', label: '课程作业', path: `/teacher/course/${courseId}/assignments` },
    { key: 'ai-assistant', label: 'AI助教', path: `/teacher/course/${courseId}/ai-assistant` },
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">课程管理</h3>
      <ul className="space-y-2">
        {menuItems.map((item) => (
          <li key={item.key}>
            <Link
              href={item.path}
              className={`block w-full text-left py-2 px-3 rounded-md ${
                activeMenuItem === item.key
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
