'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';
import MessageToast from '@/components/teacher/MessageToast';

interface FileItem {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

export default function TeacherAIAssistantPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [files, setFiles] = useState<FileItem[]>([]);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [error, setError] = useState('');

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [uploading, setUploading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testQuery, setTestQuery] = useState('');
  const [testAnswer, setTestAnswer] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {

        const filesResponse = await authFetch(`/api/teacher/ai-assistant/files?courseId=${courseId}`);

        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          setFiles(filesData.files || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, router]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setMessage('请选择要上传的文件');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('courseId', courseId);

      const response = await authFetch('/api/teacher/ai-assistant/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('文件上传失败');
      }

      await response.json();
      setMessage('文件上传成功');
      setMessageType('success');

      const filesResponse = await authFetch(`/api/teacher/ai-assistant/files?courseId=${courseId}`);

      if (filesResponse.ok) {
        const filesData = await filesResponse.json();
        setFiles(filesData.files || []);
      }

      setSelectedFile(null);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '文件上传失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setUploading(false);
    }
  };

  const handleTestQuery = async () => {
    if (!testQuery.trim()) {
      setMessage('请输入测试问题');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setTesting(true);
      setTestAnswer('');

      const response = await authFetch('/api/ai-assistant/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: testQuery, courseId }),
      });

      if (!response.ok) {
        throw new Error('AI助手查询失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let answer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        answer += decoder.decode(value, { stream: true });
        setTestAnswer(answer);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'AI助手查询失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setTesting(false);
    }
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

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">AI助教管理</h3>

        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-700 mb-3">上传教学资源</h4>
          <div className="flex items-center space-x-4">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileChange}
              className="flex-1"
            />
            <button
              onClick={handleFileUpload}
              disabled={uploading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
            >
              {uploading ? '上传中...' : '上传文件'}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">支持PDF、TXT、MD文件格式</p>
        </div>

        <div className="mb-8">
          <h4 className="text-md font-medium text-gray-700 mb-3">已上传的资源</h4>
          {files.length === 0 ? (
            <div className="text-gray-500">暂无上传的资源</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      文件名
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      大小
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      上传时间
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {files.map((file) => (
                    <tr key={file.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {file.file_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {file.file_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(file.file_size / 1024)} KB
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(file.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">测试AI助教</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">问题</label>
              <textarea
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="请输入测试问题..."
              />
            </div>
            <div>
              <button
                onClick={handleTestQuery}
                disabled={testing}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:bg-green-300"
              >
                {testing ? '查询中...' : '测试AI回答'}
              </button>
            </div>
            {testAnswer && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI回答
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {testAnswer}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
