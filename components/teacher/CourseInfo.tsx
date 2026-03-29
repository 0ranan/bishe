'use client';

import React from 'react';

interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

interface CourseInfoProps {
  course: Course;
  onBack: () => void;
}

export default function CourseInfo({ course, onBack }: CourseInfoProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900">课程详情</h2>
        <button
          onClick={onBack}
          className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
        >
          ← 返回课程列表
        </button>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.course_name}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="text-gray-600">课程ID: {course.course_id}</div>
        <div className="text-gray-600">学分: {course.credit}</div>
      </div>
    </div>
  );
}
