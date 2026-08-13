'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { readSessionUser } from '@/lib/auth-client';

export default function TeacherGlobalNav() {
  const pathname = usePathname();
  const session = readSessionUser();
  const isAdmin = session?.type === 'teacher' && session.role === 'admin';

  const coursesActive =
    pathname === '/teacher' || pathname.startsWith('/teacher/course');
  const classesActive =
    pathname.startsWith('/teacher/classes') ||
    /^\/teacher\/class\//.test(pathname);
  const adminActive = pathname.startsWith('/admin');

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">导航菜单</h3>
      <ul className="space-y-2">
        <li>
          <Link
            href="/teacher"
            className={`block w-full text-left py-2 px-3 rounded-md ${
              coursesActive
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            我的课程
          </Link>
        </li>
        <li>
          <Link
            href="/teacher/classes"
            className={`block w-full text-left py-2 px-3 rounded-md ${
              classesActive
                ? 'bg-blue-50 text-blue-600 font-medium'
                : 'hover:bg-gray-100'
            }`}
          >
            我的班级
          </Link>
        </li>
        {isAdmin && (
          <li>
            <Link
              href="/admin/teachers"
              className={`block w-full text-left py-2 px-3 rounded-md ${
                adminActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'hover:bg-gray-100'
              }`}
            >
              教师管理
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}
