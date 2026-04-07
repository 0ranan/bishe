'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import StudentNavbar from '@/components/student/StudentNavbar';
import StudentSidebar from '@/components/student/StudentSidebar';
import CourseInfo from '@/components/student/CourseInfo';

interface Message {
  id: string;
  content: string;
  type: 'user' | 'ai';
  timestamp: Date;
}

interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

export default function StudentAIAssistantPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isTyping, setIsTyping] = useState(false);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取课程详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router]);

  const handleBack = () => {
    router.push('/student');
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // 添加用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // 添加空的AI消息用于流式更新
    const aiMessageId = (Date.now() + 1).toString();
    const initialAiMessage: Message = {
      id: aiMessageId,
      content: '',
      type: 'ai',
      timestamp: new Date(),
    };

    setMessages(prevMessages => [...prevMessages, initialAiMessage]);

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await fetch('/api/ai-assistant/query', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: inputMessage, courseId }),
      });

      if (!response.ok) {
        throw new Error('AI助手查询失败');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法读取响应流');
      }

      const decoder = new TextDecoder();
      let aiContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        aiContent += decoder.decode(value, { stream: true });
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: aiContent } 
              : msg
          )
        );
      }
    } catch {
      // 添加错误消息
      setMessages(prevMessages => 
        prevMessages.map(msg => 
          msg.id === aiMessageId 
            ? { ...msg, content: '抱歉，我无法回答这个问题，请稍后再试。' } 
            : msg
        )
      );
    } finally {
      setIsTyping(false);
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
      <StudentNavbar title="AI助教" onBack={handleBack} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <StudentSidebar courseId={courseId} activeMenuItem="ai-assistant" />

          <div className="lg:col-span-3">
            {course && <CourseInfo course={course} />}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI助教</h3>
              
              <div className="h-96 overflow-y-auto mb-4 border border-gray-200 rounded-md p-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">
                    你好！我是本课程的AI助教，有什么问题可以问我。
                  </div>
                ) : (
                  messages.map((message) => (
                    <div 
                      key={message.id} 
                      className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
                    >
                      <div className={`inline-block max-w-[80%] p-3 rounded-lg ${message.type === 'user' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                        {message.content}
                      </div>
                      <div className={`text-xs text-gray-500 mt-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                        {message.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="text-left mb-4">
                    <div className="inline-block max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="请输入你的问题..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isTyping}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
