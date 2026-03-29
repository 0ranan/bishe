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

interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  comment_count: number;
}

interface TopicComment {
  id: string;
  topic_id: string;
  student_id: string;
  student_name: string;
  content: string;
  created_at: string;
}

export default function DiscussionPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [discussions, setDiscussions] = useState<DiscussionTopic[]>([]);
  const [comments, setComments] = useState<Record<string, TopicComment[]>>({});
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [commentError, setCommentError] = useState('');

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

        const discussionResponse = await fetch(`/api/student/courses/${courseId}/discussions`, {
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
    router.push(`/student/course/${courseId}`);
  };

  const fetchComments = async (topicId: string) => {
    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/student/courses/${courseId}/discussions/${topicId}/comments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setComments({ ...comments, [topicId]: data.comments });
      }
    } catch (err) {
      console.error('获取评论失败:', err);
    }
  };

  const toggleComments = (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
      if (!comments[topicId]) {
        fetchComments(topicId);
      }
    }
  };

  const handleSubmitComment = async (topicId: string) => {
    if (!commentContent) {
      setCommentError('评论内容不能为空');
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/student/courses/${courseId}/discussions/${topicId}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentContent }),
      });

      if (response.ok) {
        const newComment = await response.json();
        setComments({ ...comments, [topicId]: [...(comments[topicId] || []), newComment] });
        setCommentContent('');
        setCommentError('');
        setDiscussions(discussions.map(discussion => {
          if (discussion.id === topicId) {
            return { ...discussion, comment_count: discussion.comment_count + 1 };
          }
          return discussion;
        }));
      } else {
        const errorData = await response.json();
        setCommentError(errorData.error || '评论失败');
      }
    } catch (err) {
      setCommentError('评论失败，请稍后重试');
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
      <StudentNavbar title="课程讨论" onBack={handleBack} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <StudentSidebar courseId={courseId} activeMenuItem="discussion" />

          <div className="lg:col-span-3">
            {course && <CourseInfo course={course} />}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">讨论区</h3>
              
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
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-500">发布者: {discussion.teacher_name}</span>
                        <button
                          onClick={() => toggleComments(discussion.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {expandedTopic === discussion.id ? '收起评论' : `查看评论 (${discussion.comment_count})`}
                        </button>
                      </div>

                      {expandedTopic === discussion.id && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="space-y-3 mb-4">
                            {comments[discussion.id]?.length === 0 ? (
                              <div className="text-sm text-gray-500">暂无评论</div>
                            ) : (
                              comments[discussion.id]?.map((comment) => (
                                <div key={comment.id} className="bg-gray-50 p-3 rounded-md">
                                  <div className="flex justify-between items-start mb-1">
                                    <span className="text-sm font-medium text-gray-900">{comment.student_name}</span>
                                    <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">{comment.content}</div>
                                </div>
                              ))
                            )}
                          </div>

                          <div>
                            {commentError && (
                              <div className="bg-red-50 text-red-600 text-sm p-2 rounded-md mb-2">
                                {commentError}
                              </div>
                            )}
                            <textarea
                              value={commentContent}
                              onChange={(e) => setCommentContent(e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                              placeholder="请输入评论内容"
                              rows={3}
                            />
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleSubmitComment(discussion.id)}
                                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                              >
                                提交评论
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
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
