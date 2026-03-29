'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface TeacherSidebarProps {
  courseId: string;
  activeMenuItem?: string;
}

export default function TeacherSidebar({ courseId, activeMenuItem }: TeacherSidebarProps) {
  const router = useRouter();

  const menuItems = [
    { key: 'attendance', label: '课程签到', path: `/teacher/course/${courseId}/attendance` },
    { key: 'chapters', label: '课程章节', path: `/teacher/course/${courseId}/chapters` },
    { key: 'resources', label: '课程附件', path: `/teacher/course/${courseId}/resources` },
    { key: 'discussion', label: '课程讨论', path: `/teacher/course/${courseId}/discussion` },
    { key: 'diagnosis', label: '学情诊断', path: `/teacher/course/${courseId}/diagnosis` },
    { key: 'assignments', label: '课程作业', path: `/teacher/course/${courseId}/assignments` },
  ];

  return (
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
          {menuItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => router.push(item.path)}
                className={`w-full text-left py-2 px-3 rounded-md ${activeMenuItem === item.key ? 'bg-blue-50 text-blue-600 font-medium' : 'hover:bg-gray-100'}`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
