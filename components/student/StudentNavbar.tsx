'use client';

import React from 'react';

interface StudentNavbarProps {
  title?: string;
  onBack?: () => void;
}

export default function StudentNavbar({ title, onBack }: StudentNavbarProps) {
  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button
                onClick={onBack}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                ← 返回课程列表
              </button>
            )}
            <h1 className="text-xl font-semibold text-gray-900">{title || '课程详情'}</h1>
          </div>
        </div>
      </div>
    </nav>
  );
}
