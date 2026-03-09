'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

// 定义讨论接口
interface DiscussionTopic {
  id: string;
  title: string;
  content: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  comment_count: number;
}

// 定义评论接口
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

  // 获取课程信息
  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        // 从本地存储获取 token
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          // 未登录，重定向到登录页面
          router.push('/');
          return;
        }

        // 获取课程信息
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

        // 获取讨论列表
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

  // 返回到课程列表
  const handleBack = () => {
    router.push(`/student/course/${courseId}`);
  };

  // 获取评论
  const fetchComments = async (topicId: string) => {
    try {
      // 从本地存储获取 token
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

  // 切换展开/收起评论
  const toggleComments = (topicId: string) => {
    if (expandedTopic === topicId) {
      setExpandedTopic(null);
    } else {
      setExpandedTopic(topicId);
      // 如果还没有加载过评论，加载评论
      if (!comments[topicId]) {
        fetchComments(topicId);
      }
    }
  };

  // 提交评论
  const handleSubmitComment = async (topicId: string) => {
    if (!commentContent) {
      setCommentError('评论内容不能为空');
      return;
    }

    try {
      // 从本地存储获取 token
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
        // 更新讨论列表中的评论数
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
      {/* 顶部导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                ← 返回课程详情
              </button>
              <h1 className="text-xl font-semibold text-gray-900">课程讨论</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">课程功能</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`/student/course/${courseId}`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  代办界面
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/attendance`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  课程签到
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/chapters`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  课程章节
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/discussion`)}
                  className="w-full text-left p-3 rounded-md bg-blue-50 text-blue-600 font-medium"
                >
                  课程讨论
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/diagnosis`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  学情诊断
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/assignments`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  课程作业
                </button>
              </div>
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="lg:col-span-3">
            {/* 课程信息 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{course?.course_name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-gray-600">课程ID: {course?.course_id}</div>
                <div className="text-gray-600">学分: {course?.credit}</div>
              </div>
            </div>

            {/* 讨论内容 */}
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

                      {/* 评论区域 */}
                      {expandedTopic === discussion.id && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          {/* 评论列表 */}
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

                          {/* 评论输入框 */}
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
