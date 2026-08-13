'use client';

import React from 'react';
import TeacherGlobalNav from '@/components/teacher/TeacherGlobalNav';
import TeacherCourseNav from '@/components/teacher/TeacherCourseNav';

interface TeacherSidebarProps {
  courseId: string;
  activeMenuItem?: string;
}

/** 课程页侧栏：全局导航 + 课程模块导航 */
export default function TeacherSidebar({
  courseId,
  activeMenuItem,
}: TeacherSidebarProps) {
  return (
    <div className="w-64 mr-8 shrink-0">
      <TeacherGlobalNav />
      <TeacherCourseNav courseId={courseId} activeMenuItem={activeMenuItem} />
    </div>
  );
}
