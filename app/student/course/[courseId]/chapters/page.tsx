'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';
import VideoList from '@/components/student/VideoList';

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

export default function ChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchVideos = async () => {
      try {

        const videosResponse = await authFetch(`/api/student/courses/${courseId}/videos`);

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        setVideos(videosData.videos);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程视频失败');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
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

      <VideoList videos={videos} courseId={courseId} />
    </>
  );
}
