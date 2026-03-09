'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义评价接口
interface Comment {
  id: string;
  student_id: string;
  student_name: string;
  content: string;
  rating: number;
  created_at: string;
}

// 定义视频接口
interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

// 定义用户接口
interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

export default function TeacherVideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const videoId = params.videoId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [video, setVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const videoRef = useRef<HTMLVideoElement>(null);

  // 获取课程信息、视频信息和评价列表
  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        // 从本地存储获取 token
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!accessToken || !userData) {
          // 未登录，重定向到登录页面
          router.push('/');
          return;
        }

        // 解析用户信息
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // 验证用户类型
        if (parsedUser.type !== 'teacher') {
          router.push('/');
          return;
        }

        // 获取课程信息
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

        // 获取视频信息
        const videosResponse = await fetch(`/api/teacher/courses/${courseId}/videos`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!videosResponse.ok) {
          throw new Error('获取课程视频失败');
        }

        const videosData = await videosResponse.json();
        setVideos(videosData.videos);
        const foundVideo = videosData.videos.find((v: Video) => v.id === videoId);
        if (!foundVideo) {
          throw new Error('视频不存在');
        }
        setVideo(foundVideo);

        // 获取视频评价
        const commentsResponse = await fetch(`/api/teacher/courses/${courseId}/videos/${videoId}/comments`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!commentsResponse.ok) {
          throw new Error('获取视频评价失败');
        }

        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取视频详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
  }, [courseId, videoId, router]);

  // 返回到课程详情页面
  const handleBack = () => {
    router.push(`/teacher/course/${courseId}`);
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
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">教师中心</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">欢迎，{user?.name}</span>
              <button
                onClick={() => {
                  localStorage.removeItem('accessToken');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  window.location.href = '/';
                }}
                className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <div className="flex max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 侧边栏 */}
        <div className="w-64 mr-8">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">导航菜单</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push('/teacher')}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  我的课程
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push('/teacher/classes')}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  我的班级
                </button>
              </li>
            </ul>
          </div>

          {/* 课程视频列表 */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">课程视频列表</h3>
            <div className="space-y-2">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() => router.push(`/teacher/course/${courseId}/video/${v.id}`)}
                  className={`w-full text-left p-3 rounded-md flex items-center ${v.id === videoId ? 'bg-blue-50 border-l-4 border-blue-600' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-3">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{v.title}</h4>
                    <div className="text-xs text-gray-500">时长: {v.duration}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 右侧视频播放器和评价 */}
        <div className="flex-1">
          {/* 视频播放器 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">视频播放</h2>
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                ← 返回课程详情
              </button>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{video?.title}</h3>
            <div className="aspect-w-16 aspect-h-9 mb-4">
              <video
                ref={videoRef}
                src={video?.video_url}
                controls
                className="w-full h-full"
                poster="https://via.placeholder.com/1280x720?text=视频封面"
              >
                您的浏览器不支持视频播放
              </video>
            </div>
            <div className="text-gray-600">时长: {video?.duration}</div>
          </div>

          {/* 评价列表 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">视频评价</h3>
            
            {/* 评价列表 */}
            {comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无评价
              </div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">{comment.student_name}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${star <= comment.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="text-gray-700">{comment.content}</div>
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
