'use client';

import React, { useState, useEffect } from 'react';
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

interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  comment_count: number;
}

export default function TeacherCourseDiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newDiscussion, setNewDiscussion] = useState({ title: '', content: '' });
  const [createError, setCreateError] = useState('');
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

        const discussionResponse = await fetch(`/api/teacher/courses/${courseId}/discussions`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (discussionResponse.ok) {
          const discussionData = await discussionResponse.json();
          setDiscussions(discussionData.discussions);
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

  const handleCreateDiscussion = async () => {
    if (!newDiscussion.title || !newDiscussion.content) {
      setCreateError('标题和内容不能为空');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/teacher/courses/${courseId}/discussions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newDiscussion),
      });

      if (response.ok) {
        const data = await response.json();
        setDiscussions([data, ...discussions]);
        setShowCreateModal(false);
        setNewDiscussion({ title: '', content: '' });
        setCreateError('');
        setMessage('讨论发布成功');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setCreateError(errorData.error || '发布失败');
      }
    } catch (err) {
      setCreateError('发布失败，请稍后重试');
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
        <TeacherSidebar courseId={courseId} activeMenuItem="discussion" />

        <div className="flex-1">
          <MessageToast message={message} type={messageType} />
          
          {course && <CourseInfo course={course} onBack={handleBack} />}

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900">讨论管理</h3>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
              >
                发布讨论
              </button>
            </div>

            {discussions.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无讨论内容
              </div>
            ) : (
              <div className="space-y-6">
                {discussions.map((discussion) => (
                  <div key={discussion.id} className="border border-gray-200 rounded-md p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-lg font-medium text-gray-900">{discussion.title}</h4>
                      <span className="text-sm text-gray-500">{new Date(discussion.created_at).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-600 mb-3">{discussion.content}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">发布者: {discussion.teacher_name}</span>
                      <span className="text-sm text-gray-500">评论数: {discussion.comment_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-md">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">发布讨论</h3>
                  {createError && (
                    <div className="bg-red-50 text-red-600 p-2 rounded-md mb-4">
                      {createError}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                      <input
                        type="text"
                        value={newDiscussion.title}
                        onChange={(e) => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入讨论标题"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
                      <textarea
                        value={newDiscussion.content}
                        onChange={(e) => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="请输入讨论内容"
                        rows={4}
                      />
                    </div>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowCreateModal(false);
                          setNewDiscussion({ title: '', content: '' });
                          setCreateError('');
                        }}
                        className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
                      >
                        取消
                      </button>
                      <button
                        onClick={handleCreateDiscussion}
                        className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                      >
                        发布
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
