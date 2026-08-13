'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/student/StudentNavbar';
import StudentSidebar from '@/components/student/StudentSidebar';
import { CourseProvider } from '@/lib/course-context';
import {
  getAccessToken,
  readSessionUser,
  type SessionUser,
} from '@/lib/auth-client';

function resolveActiveMenuItem(pathname: string, courseId: string): string {
  const base = `/student/course/${courseId}`;
  if (pathname === base) return 'dashboard';
  const rest = pathname.slice(base.length + 1);
  const moduleKey = rest.split('/')[0];
  if (moduleKey === 'video') return 'chapters';
  return moduleKey || 'dashboard';
}

function resolveTitle(activeMenuItem: string): string {
  const titles: Record<string, string> = {
    dashboard: '课程详情',
    attendance: '课程签到',
    chapters: '课程章节',
    resources: '课程附件',
    discussion: '课程讨论',
    diagnosis: '学情诊断',
    assignments: '课程作业',
    'ai-assistant': 'AI助教',
  };
  return titles[activeMenuItem] || '课程详情';
}

export default function StudentCourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const activeMenuItem = useMemo(
    () => resolveActiveMenuItem(pathname, courseId),
    [pathname, courseId]
  );

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    const session = readSessionUser();
    if (!session || session.type !== 'student') {
      router.replace('/');
      return;
    }
    setUser(session);
    setReady(true);
  }, [router]);

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <CourseProvider courseId={courseId} role="student">
      <div className="min-h-screen bg-gray-50">
        <StudentNavbar
          user={user}
          title={resolveTitle(activeMenuItem)}
          onBack={() => router.push('/student')}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <StudentSidebar
              courseId={courseId}
              activeMenuItem={activeMenuItem}
            />
            <div className="flex-1 min-w-0">{children}</div>
          </div>
        </div>
      </div>
    </CourseProvider>
  );
}
