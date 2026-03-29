'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import CourseInfo from '@/components/teacher/CourseInfo';
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

interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

interface Class {
  class_id: string;
  class_name: string;
  grade: string;
  is_connected: boolean;
}

interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

export default function TeacherCourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!accessToken || !userData) {
          router.push('/');
          return;
        }

        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        if (parsedUser.type !== 'teacher') {
          router.push('/');
          return;
        }

        const courseResponse = await fetch(`/api/teacher/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!courseResponse.ok) {
          throw new Error('获取课程信息失败');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.course);

        const videosResponse = await fetch(`/api/teacher/courses/${courseId}/videos`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        setVideos(videosData.videos);

        const classesResponse = await fetch(`/api/teacher/courses/${courseId}/classes`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
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
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router]);

  const handleBack = () => {
    router.push('/teacher');
  };

  const handleToggleClassConnection = async (classId: string, isConnected: boolean) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const method = isConnected ? 'DELETE' : 'POST';
      const response = await fetch(`/api/teacher/courses/${courseId}/classes/${classId}`, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(isConnected ? '解绑班级失败' : '绑定班级失败');
      }

      const classesResponse = await fetch(`/api/teacher/courses/${courseId}/classes`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <TeacherNavbar user={user} />}

      <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TeacherSidebar courseId={courseId} />

        <div className="flex-1">
          <MessageToast message={message} type={messageType} />

          {course && <CourseInfo course={course} onBack={handleBack} />}

          <ClassBinding classes={classes} onToggleConnection={handleToggleClassConnection} />

          <VideoList videos={videos} courseId={courseId} />
        </div>
      </div>
    </div>
  );
}
