'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/student/StudentNavbar';
import StudentSidebar from '@/components/student/StudentSidebar';
import CourseInfo from '@/components/student/CourseInfo';
import PendingAttendance from '@/components/student/PendingAttendance';
import VideoList from '@/components/student/VideoList';

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
  
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          router.push('/');
          return;
        }

        const courseResponse = await fetch(`/api/student/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!courseResponse.ok) {
          throw new Error('获取课程信息失败');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.course);

        const videosResponse = await fetch(`/api/student/courses/${courseId}/videos`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        setVideos(videosData.videos);

        const attendanceResponse = await fetch(`/api/student/courses/${courseId}/attendances`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

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

    fetchCourseDetails();
  }, [courseId, router]);

  const handleBack = () => {
    router.push('/student');
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
      <StudentNavbar title="课程详情" onBack={handleBack} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <StudentSidebar courseId={courseId} activeMenuItem="dashboard" />

          <div className="lg:col-span-3">
            {course && <CourseInfo course={course} />}

            <PendingAttendance attendances={attendances} courseId={courseId} />

            <VideoList videos={videos} courseId={courseId} />
          </div>
        </div>
      </main>
    </div>
  );
}
