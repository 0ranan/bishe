'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';
import TeacherGlobalNav from '@/components/teacher/TeacherGlobalNav';
import {
  getAccessToken,
  readSessionUser,
  type SessionUser,
} from '@/lib/auth-client';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const isCourseRoute = useMemo(
    () => pathname.startsWith('/teacher/course/'),
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

  if (!ready || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  // 课程路由由嵌套 course layout 提供完整壳，避免双层侧栏/顶栏
  if (isCourseRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TeacherNavbar user={user} />
      <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-64 mr-8 shrink-0">
          <TeacherGlobalNav />
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
