'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';
import MessageToast from '@/components/teacher/MessageToast';

interface Assignment {
  id: string;
  title: string;
  content: string;
  start_time: string;
  end_time: string;
  teacher_id: string;
  teacher_name: string;
  created_at: string;
  submitted_count: number;
  total_count: number;
}

interface StudentSubmission {
  id: string;
  student_id: string;
  student_name: string;
  content: string;
  submit_time: string;
  score?: number;
  status: string;
}

export default function TeacherCourseAssignmentsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    title: '',
    content: '',
    end_time: '',
  });
  const [createError, setCreateError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [submissionLoading, setSubmissionLoading] = useState(false);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {

        const assignmentResponse = await authFetch(`/api/teacher/courses/${courseId}/assignments`);

        if (assignmentResponse.ok) {
          const assignmentData = await assignmentResponse.json();
          setAssignments(assignmentData.assignments);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, router]);

  const handleCreateAssignment = async () => {
    if (!newAssignment.title || !newAssignment.content || !newAssignment.end_time) {
      setCreateError('标题、内容和截止时间不能为空');
      return;
    }

    try {

      const response = await authFetch(`/api/teacher/courses/${courseId}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newAssignment),
      });

      if (response.ok) {
        const data = await response.json();
        setAssignments([data, ...assignments]);
        setShowCreateModal(false);
        setNewAssignment({ title: '', content: '', end_time: '' });
        setCreateError('');
        setMessage('作业发布成功');
        setMessageType('success');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const errorData = await response.json();
        setCreateError(errorData.error || '创建失败');
      }
    } catch {
      setCreateError('创建失败，请稍后重试');
    }
  };

  const handleViewSubmissions = async (assignment: Assignment) => {
    try {
      setSubmissionLoading(true);
      setCurrentAssignment(assignment);

      const response = await authFetch(`/api/teacher/courses/${courseId}/assignments/${assignment.id}/submissions`);

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.submissions);
        setShowSubmissionModal(true);
      } else {
        setMessage('获取提交情况失败');
        setMessageType('error');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch {
      setMessage('获取提交情况失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setSubmissionLoading(false);
    }
  };

  const isAssignmentExpired = (endTime: string) => {
    return new Date() > new Date(endTime);
  };

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
      <MessageToast message={message} type={messageType} />

      {course && <CourseInfo course={course} />}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-900">作业管理</h3>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
          >
            发布作业
          </button>
        </div>

        {assignments.length === 0 ? (
          <div className="text-center py-12 text-gray-500">暂无作业内容</div>
        ) : (
          <div className="space-y-6">
            {assignments.map((assignment) => (
              <div key={assignment.id} className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-medium text-gray-900">{assignment.title}</h4>
                  <div className="flex space-x-2">
                    <span
                      className={`text-sm px-2 py-1 rounded ${
                        isAssignmentExpired(assignment.end_time)
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}
                    >
                      {isAssignmentExpired(assignment.end_time) ? '已截止' : '进行中'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(assignment.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="text-gray-600 mb-3">{assignment.content}</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">开始时间:</span>{' '}
                    {new Date(assignment.start_time).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">截止时间:</span>{' '}
                    {new Date(assignment.end_time).toLocaleString()}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    发布者: {assignment.teacher_name}
                  </span>
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      提交情况: {assignment.submitted_count}/{assignment.total_count}
                    </span>
                    <button
                      onClick={() => handleViewSubmissions(assignment)}
                      className="bg-blue-500 text-white py-1 px-3 rounded-md hover:bg-blue-600 focus:outline-none text-sm"
                    >
                      查看提交
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">发布作业</h3>
              {createError && (
                <div className="bg-red-50 text-red-600 p-2 rounded-md mb-4">
                  {createError}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    标题
                  </label>
                  <input
                    type="text"
                    value={newAssignment.title}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, title: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入作业标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    内容
                  </label>
                  <textarea
                    value={newAssignment.content}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, content: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入作业内容"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    截止时间
                  </label>
                  <input
                    type="datetime-local"
                    value={newAssignment.end_time}
                    onChange={(e) =>
                      setNewAssignment({ ...newAssignment, end_time: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewAssignment({ title: '', content: '', end_time: '' });
                      setCreateError('');
                    }}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleCreateAssignment}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                  >
                    发布
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSubmissionModal && currentAssignment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  作业提交情况: {currentAssignment.title}
                </h3>
                <button
                  onClick={() => setShowSubmissionModal(false)}
                  className="text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  ×
                </button>
              </div>

              {submissionLoading ? (
                <div className="text-center py-8">
                  <div className="text-gray-600">加载中...</div>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500">暂无学生提交</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div
                      key={submission.id}
                      className="border border-gray-200 rounded-md p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {submission.student_name}
                          </h4>
                          <span className="text-sm text-gray-500">
                            学号: {submission.student_id}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span
                            className={`text-sm px-2 py-1 rounded ${
                              submission.status === '已批改'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {submission.status}
                          </span>
                          {submission.score !== undefined && (
                            <span className="text-sm text-gray-500 mt-1">
                              分数: {submission.score}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-600 mb-2">
                        <p className="text-sm">提交内容:</p>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md">
                          {submission.content}
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        提交时间: {new Date(submission.submit_time).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
