'use client';

import React from 'react';
import Link from 'next/link';
import { logout, type SessionUser } from '@/lib/auth-client';

interface TeacherNavbarProps {
  user: SessionUser;
}

export default function TeacherNavbar({ user }: TeacherNavbarProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">教师中心</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/teacher/profile"
              className="text-gray-700 hover:text-gray-900"
            >
              个人中心
            </Link>
            <span className="text-gray-700">欢迎，{user.name}</span>
            <button
              type="button"
              onClick={logout}
              className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 focus:outline-none"
            >
              登出
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
