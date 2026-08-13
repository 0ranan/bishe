'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import { CourseProvider } from '@/lib/course-context';
import {
  getAccessToken,
  readSessionUser,
  type SessionUser,
} from '@/lib/auth-client';

function resolveActiveMenuItem(pathname: string): string | undefined {
  const segments = pathname.split('/').filter(Boolean);
  const module = segments[3];
  if (!module) return undefined;
  if (module === 'video') return 'chapters';
  return module;
}

function isBigscreenRoute(pathname: string): boolean {
  return pathname.includes('/bigscreen');
}

export default function TeacherCourseLayout({
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

  const bigscreen = useMemo(() => isBigscreenRoute(pathname), [pathname]);
  const activeMenuItem = useMemo(
    () => resolveActiveMenuItem(pathname),
    [pathname]
  );

  useEffect(() => {
    if (!getAccessToken()) {
      router.replace('/');
      return;
    }
    const session = readSessionUser();
    if (!session || session.type !== 'teacher') {
      router.replace('/');
      return;
    }
    setUser(session);
    setReady(true);
  }, [router]);

  if (bigscreen) {
    return <>{children}</>;
  }

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <CourseProvider courseId={courseId} role="teacher">
      <div className="min-h-screen bg-gray-50">
        <TeacherNavbar user={user} />
        <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <TeacherSidebar courseId={courseId} activeMenuItem={activeMenuItem} />
          <div className="flex-1 min-w-0">{children}</div>
        </div>
      </div>
    </CourseProvider>
  );
}
