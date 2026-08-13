'use client';

import React from 'react';
import type { CourseSummary } from '@/lib/course-context';

interface CourseInfoProps {
  course: CourseSummary;
}

/** 课程信息条（无返回按钮；返回由全局导航承担） */
export default function CourseInfo({ course }: CourseInfoProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{course.course_name}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="text-gray-600">课程ID: {course.course_id}</div>
        <div className="text-gray-600">学分: {course.credit}</div>
      </div>
    </div>
  );
}
