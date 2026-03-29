'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import CourseInfo from '@/components/teacher/CourseInfo';

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

interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

export default function TeacherCourseChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        const sortedVideos = videosData.videos.sort((a: Video, b: Video) => a.order_index - b.order_index);
        setVideos(sortedVideos);
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
        <TeacherSidebar courseId={courseId} activeMenuItem="chapters" />

        <div className="flex-1">
          {course && <CourseInfo course={course} onBack={handleBack} />}

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">课程视频</h3>
            
            {videos.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无视频
              </div>
            ) : (
              <div className="space-y-4">
                {videos.map((video) => (
                  <div key={video.id} className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50">
                    <div className="flex-shrink-0 w-16 h-10 bg-gray-200 rounded flex items-center justify-center mr-4">
                      <span className="text-gray-500 font-medium">{video.order_index}</span>
                    </div>
                    <div className="flex-shrink-0 w-16 h-10 bg-gray-200 rounded flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-grow">
                      <h4 className="font-medium text-gray-900">{video.title}</h4>
                      <div className="text-sm text-gray-500">时长: {video.duration}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => router.push(`/teacher/course/${courseId}/video/${video.id}`)}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                      >
                        观看视频
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
