'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { getAccessToken } from '@/lib/auth-client';

export type CourseSummary = {
  course_id: string;
  course_name: string;
  credit: number;
};

type CourseContextValue = {
  courseId: string;
  role: 'teacher' | 'student';
  course: CourseSummary | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
};

const CourseContext = createContext<CourseContextValue | null>(null);

export function CourseProvider({
  courseId,
  role,
  children,
}: {
  courseId: string;
  role: 'teacher' | 'student';
  children: React.ReactNode;
}) {
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      setError('未登录');
      setCourse(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const endpoint =
        role === 'teacher'
          ? `/api/teacher/courses/${courseId}`
          : `/api/student/courses/${courseId}`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) {
        throw new Error('获取课程信息失败');
      }
      const data = await response.json();
      setCourse(data.course ?? null);
    } catch (err) {
      setCourse(null);
      setError(err instanceof Error ? err.message : '获取课程信息失败');
    } finally {
      setLoading(false);
    }
  }, [courseId, role]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ courseId, role, course, loading, error, refresh }),
    [courseId, role, course, loading, error, refresh]
  );

  return (
    <CourseContext.Provider value={value}>{children}</CourseContext.Provider>
  );
}

export function useCourse(): CourseContextValue {
  const ctx = useContext(CourseContext);
  if (!ctx) {
    throw new Error('useCourse 必须在 CourseProvider 内使用');
  }
  return ctx;
}
