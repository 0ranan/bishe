'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';
import MessageToast from '@/components/teacher/MessageToast';
import ClassBinding from '@/components/teacher/ClassBinding';
import VideoList from '@/components/teacher/VideoList';

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

interface Class {
  class_id: string;
  class_name: string;
  grade: string;
  is_connected: boolean;
}

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [videos, setVideos] = useState<Video[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [error, setError] = useState('');

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          router.push('/');
          return;
        }

        const videosResponse = await fetch(`/api/teacher/courses/${courseId}/videos`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        setVideos(videosData.videos);

        const classesResponse = await fetch(`/api/teacher/courses/${courseId}/classes`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!classesResponse.ok) {
          throw new Error('获取班级列表失败');
        }

        const classesData = await classesResponse.json();
        setClasses(classesData.classes);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, router]);

  const handleToggleClassConnection = async (classId: string, isConnected: boolean) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const method = isConnected ? 'DELETE' : 'POST';
      const response = await fetch(`/api/teacher/courses/${courseId}/classes/${classId}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(isConnected ? '解绑班级失败' : '绑定班级失败');
      }

      const classesResponse = await fetch(`/api/teacher/courses/${courseId}/classes`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const classesData = await classesResponse.json();
      setClasses(classesData.classes);

      setMessage(isConnected ? '班级解绑成功' : '班级绑定成功');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '操作失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (courseLoading || moduleLoading) {
    return <CourseContentSkeleton />;
  }

  if (courseError || error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">{courseError || error}</div>
      </div>
    );
  }

  return (
    <>
      <MessageToast message={message} type={messageType} />

      {course && <CourseInfo course={course} />}

      <ClassBinding classes={classes} onToggleConnection={handleToggleClassConnection} />

      <VideoList videos={videos} courseId={courseId} />
    </>
  );
}
