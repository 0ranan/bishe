'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/student/StudentNavbar';
import {
  getAccessToken,
  readSessionUser,
  type SessionUser,
} from '@/lib/auth-client';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  const isCourseRoute = useMemo(
    () => pathname.startsWith('/student/course/'),
    [pathname]
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

  if (isCourseRoute) {
    return <>{children}</>;
  }

  const title =
    pathname.startsWith('/student/profile') ? '个人中心' : '学生中心';

  return (
    <div className="min-h-screen bg-gray-50">
      <StudentNavbar user={user} title={title} showProfile={!pathname.startsWith('/student/profile')} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
