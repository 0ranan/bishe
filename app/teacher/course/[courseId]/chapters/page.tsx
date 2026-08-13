'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

export default function TeacherCourseChaptersPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [videos, setVideos] = useState<Video[]>([]);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchModuleData = async () => {
      try {

        const videosResponse = await authFetch(`/api/teacher/courses/${courseId}/videos`);

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        const sortedVideos = videosData.videos.sort(
          (a: Video, b: Video) => a.order_index - b.order_index
        );
        setVideos(sortedVideos);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, router]);

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
      {course && <CourseInfo course={course} />}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">课程视频</h3>

        {videos.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无视频</div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <div className="flex-shrink-0 w-16 h-10 bg-gray-200 rounded flex items-center justify-center mr-4">
                  <span className="text-gray-500 font-medium">{video.order_index}</span>
                </div>
                <div className="flex-shrink-0 w-16 h-10 bg-gray-200 rounded flex items-center justify-center mr-4">
                  <svg
                    className="w-6 h-6 text-gray-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-grow">
                  <h4 className="font-medium text-gray-900">{video.title}</h4>
                  <div className="text-sm text-gray-500">时长: {video.duration}</div>
                </div>
                <div className="flex-shrink-0">
                  <button
                    onClick={() =>
                      router.push(`/teacher/course/${courseId}/video/${video.id}`)
                    }
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
    </>
  );
}
