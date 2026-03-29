'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeacherNavbar from '@/components/teacher/TeacherNavbar';
import TeacherSidebar from '@/components/teacher/TeacherSidebar';
import CourseInfo from '@/components/teacher/CourseInfo';
import MessageToast from '@/components/teacher/MessageToast';

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

interface Resource {
  id: string;
  title: string;
  resource_url: string;
  description?: string;
  resource_type?: string;
  teacher_name: string;
  created_at: string;
}

export default function TeacherCourseResourcesPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [uploading, setUploading] = useState(false);

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

        const resourcesResponse = await fetch(`/api/teacher/courses/${courseId}/resources`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (resourcesResponse.ok) {
          const resourcesData = await resourcesResponse.json();
          setResources(resourcesData.resources);
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
    router.push('/teacher');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/');
        return;
      }

      const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', fileNameWithoutExt);

      const response = await fetch(`/api/teacher/courses/${courseId}/resources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setResources([data.resource, ...resources]);
        setMessage('附件上传成功');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || '上传失败');
        setMessageType('error');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('上传失败，请稍后重试');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('确定要删除这个附件吗？')) {
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/teacher/courses/${courseId}/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setResources(resources.filter(r => r.id !== resourceId));
        setMessage('附件删除成功');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('删除失败');
        setMessageType('error');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('删除失败，请稍后重试');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDownloadResource = (resourceUrl: string) => {
    window.open(resourceUrl, '_blank');
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
        <TeacherSidebar courseId={courseId} activeMenuItem="resources" />

        <div className="flex-1">
          <MessageToast message={message} type={messageType} />
          
          {course && <CourseInfo course={course} onBack={handleBack} />}

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">附件管理</h3>
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <button
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={uploading}
                >
                  {uploading ? '上传中...' : '上传附件'}
                </button>
              </div>
            </div>

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
                      <span className="text-sm text-gray-500">{new Date(resource.created_at).toLocaleString()}</span>
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
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleDownloadResource(resource.resource_url)}
                          className="bg-green-500 text-white py-1 px-3 rounded-md hover:bg-green-600 focus:outline-none text-sm"
                        >
                          下载
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="bg-red-500 text-white py-1 px-3 rounded-md hover:bg-red-600 focus:outline-none text-sm"
                        >
                          删除
                        </button>
                      </div>
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
