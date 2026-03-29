'use client';

import React from 'react';

interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

interface TeacherNavbarProps {
  user: User;
}

export default function TeacherNavbar({ user }: TeacherNavbarProps) {
  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">教师中心</h1>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">欢迎，{user.name}</span>
            <button
              onClick={handleLogout}
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
