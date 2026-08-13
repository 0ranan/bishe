'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';
import PendingAttendance from '@/components/student/PendingAttendance';
import VideoList from '@/components/student/VideoList';

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

interface Attendance {
  id: string;
  title: string;
  code: string;
  start_time: string;
  end_time: string;
  status: 'active' | 'ended' | 'missed';
  attended: boolean;
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [videos, setVideos] = useState<Video[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          router.push('/');
          return;
        }

        const videosResponse = await fetch(`/api/student/courses/${courseId}/videos`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        setVideos(videosData.videos);

        const attendanceResponse = await fetch(
          `/api/student/courses/${courseId}/attendances`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json();
          setAttendances(attendanceData.attendances);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, router]);

  if (courseLoading || loading) {
    return <CourseContentSkeleton />;
  }

  if (courseError || error) {
    return <div className="text-red-600">{courseError || error}</div>;
  }

  return (
    <>
      {course && <CourseInfo course={course} />}

      <PendingAttendance attendances={attendances} courseId={courseId} />

      <VideoList videos={videos} courseId={courseId} />
    </>
  );
}
