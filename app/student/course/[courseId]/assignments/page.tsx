'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

// 定义作业主题接口
interface AssignmentTopic {
  id: string;
  title: string;
  content: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  submitted: boolean;
  submitted_time?: string;
  score?: number;
  status?: string;
}

export default function AssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [assignments, setAssignments] = useState<AssignmentTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<AssignmentTopic | null>(null);
  const [assignmentContent, setAssignmentContent] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // 获取课程信息和作业列表
  useEffect(() => {
    const fetchData = async () => {
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

        // 获取作业列表
        const assignmentsResponse = await fetch(`/api/student/courses/${courseId}/assignments`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!assignmentsResponse.ok) {
          throw new Error('获取作业列表失败');
        }

        const assignmentsData = await assignmentsResponse.json();
        setAssignments(assignmentsData.assignments);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, router]);

  // 返回到课程列表
  const handleBack = () => {
    router.push(`/student/course/${courseId}`);
  };

  // 打开作业提交模态框
  const handleOpenSubmitModal = (assignment: AssignmentTopic) => {
    setCurrentAssignment(assignment);
    setAssignmentContent('');
    setShowSubmitModal(true);
  };

  // 关闭作业提交模态框
  const handleCloseSubmitModal = () => {
    setShowSubmitModal(false);
    setCurrentAssignment(null);
  };

  // 提交作业
  const handleSubmitAssignment = async () => {
    if (!currentAssignment || !assignmentContent.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // 从本地存储获取 token
      const accessToken = localStorage.getItem('accessToken');

      if (!accessToken) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/student/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assignment_topic_id: currentAssignment.id,
          content: assignmentContent,
        }),
      });

      if (!response.ok) {
        throw new Error('提交作业失败');
      }

      // 刷新作业列表
      const assignmentsResponse = await fetch(`/api/student/courses/${courseId}/assignments`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!assignmentsResponse.ok) {
        throw new Error('获取作业列表失败');
      }

      const assignmentsData = await assignmentsResponse.json();
      setAssignments(assignmentsData.assignments);

      handleCloseSubmitModal();
    } catch (err) {
      alert(err instanceof Error ? err.message : '提交作业失败');
    } finally {
      setSubmitting(false);
    }
  };

  // 格式化时间
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

  // 检查是否已过期
  const isExpired = (endTime: string) => {
    return new Date() > new Date(endTime);
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
              <h1 className="text-xl font-semibold text-gray-900">课程作业</h1>
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
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
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
                  className="w-full text-left p-3 rounded-md bg-blue-50 text-blue-600 font-medium"
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

            {/* 作业内容 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">作业列表</h3>
              
              {assignments.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  暂无作业
                </div>
              ) : (
                <div className="space-y-6">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="text-lg font-medium text-gray-900">{assignment.title}</h4>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${assignment.submitted ? 'bg-green-100 text-green-800' : isExpired(assignment.end_time) ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {assignment.submitted ? '已提交' : isExpired(assignment.end_time) ? '已过期' : '未提交'}
                        </span>
                      </div>
                      
                      <div className="text-gray-600 mb-3">
                        <p className="mb-2">{assignment.content}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-sm text-gray-500">
                        <div>发布教师: {assignment.teacher_name}</div>
                        <div>发布时间: {formatDate(assignment.created_at)}</div>
                        <div>开始时间: {formatDate(assignment.start_time)}</div>
                        <div>截止时间: {formatDate(assignment.end_time)}</div>
                      </div>
                      
                      {assignment.submitted && (
                        <div className="mb-4 text-sm text-gray-600">
                          <div>提交时间: {formatDate(assignment.submitted_time || '')}</div>
                          {assignment.score !== undefined && (
                            <div>分数: {assignment.score}</div>
                          )}
                        </div>
                      )}
                      
                      {!assignment.submitted && !isExpired(assignment.end_time) && (
                        <button
                          onClick={() => handleOpenSubmitModal(assignment)}
                          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                          提交作业
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* 作业提交模态框 */}
      {showSubmitModal && currentAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">提交作业: {currentAssignment.title}</h3>
                <button
                  onClick={handleCloseSubmitModal}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">作业内容</label>
                <textarea
                  value={assignmentContent}
                  onChange={(e) => setAssignmentContent(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-300 min-h-[200px]"
                  placeholder="请输入作业内容..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseSubmitModal}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none"
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitAssignment}
                  disabled={submitting || !assignmentContent.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none disabled:opacity-50"
                >
                  {submitting ? '提交中...' : '提交'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
