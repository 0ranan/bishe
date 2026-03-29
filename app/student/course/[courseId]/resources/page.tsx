'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/student/StudentNavbar';
import StudentSidebar from '@/components/student/StudentSidebar';
import CourseInfo from '@/components/student/CourseInfo';

interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

interface Resource {
  id: string;
  title: string;
  resource_url: string;
  description?: string;
  resource_type?: string;
  teacher_name: string;
  created_at: string;
}

export default function StudentCourseResourcesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
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

        const resourcesResponse = await fetch(`/api/student/courses/${courseId}/resources`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (resourcesResponse.ok) {
          const resourcesData = await resourcesResponse.json();
          setResources(resourcesData.resources);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, router]);

  const handleBack = () => {
    router.push(`/student/course/${courseId}`);
  };

  const handleDownloadResource = (resourceUrl: string) => {
    window.open(resourceUrl, '_blank');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <StudentNavbar title="课程附件" onBack={handleBack} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <StudentSidebar courseId={courseId} activeMenuItem="resources" />

          <div className="lg:col-span-3">
            {course && <CourseInfo course={course} />}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">附件列表</h3>
              
              {resources.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无附件
                </div>
              ) : (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{resource.title}</h4>
                        <span className="text-sm text-gray-500">{formatDate(resource.created_at)}</span>
                      </div>
                      {resource.description && (
                        <div className="text-gray-600 mb-3">{resource.description}</div>
                      )}
                      {resource.resource_type && (
                        <div className="text-sm text-gray-500 mb-3">
                          类型: {resource.resource_type}
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">发布者: {resource.teacher_name}</span>
                        <button
                          onClick={() => handleDownloadResource(resource.resource_url)}
                          className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 focus:outline-none text-sm"
                        >
                          下载
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
