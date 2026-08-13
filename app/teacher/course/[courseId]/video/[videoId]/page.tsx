'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCourse } from '@/lib/course-context';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';
import AIAssistantFloat from '@/components/AIAssistantFloat';

interface Comment {
  id: string;
  student_id: string;
  student_name: string;
  content: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

export default function TeacherVideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const videoId = params.videoId as string;
  const { loading: courseLoading, error: courseError } = useCourse();

  const [video, setVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingCommentId, setUpdatingCommentId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {

        const videosResponse = await authFetch(`/api/teacher/courses/${courseId}/videos`);

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

        const commentsResponse = await authFetch(`/api/teacher/courses/${courseId}/videos/${videoId}/comments`);

        if (!commentsResponse.ok) {
          throw new Error('获取视频评价失败');
        }

        const commentsData = await commentsResponse.json();
        setComments(commentsData.comments);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取视频详情失败');
      } finally {
        setModuleLoading(false);
      }
    };

    fetchVideoDetails();
  }, [courseId, videoId, router]);

  const handleBack = () => {
    router.push(`/teacher/course/${courseId}`);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '待审核';
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      default:
        return status;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleUpdateStatus = async (
    commentId: string,
    newStatus: 'pending' | 'approved' | 'rejected'
  ) => {
    try {
      setUpdatingCommentId(commentId);

      const response = await authFetch(
        `/api/teacher/courses/${courseId}/videos/${videoId}/comments/${commentId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('更新状态失败');
      }

      setComments(
        comments.map((comment) =>
          comment.id === commentId ? { ...comment, status: newStatus } : comment
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '更新状态失败');
    } finally {
      setUpdatingCommentId(null);
    }
  };

  const filteredComments =
    filterStatus === 'all'
      ? comments
      : comments.filter((comment) => comment.status === filterStatus);

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
      <AIAssistantFloat courseId={courseId} />

      <div className="flex">
        <div className="w-64 mr-8 flex-shrink-0">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 sticky top-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">课程视频列表</h3>
            <div className="space-y-2">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() =>
                    router.push(`/teacher/course/${courseId}/video/${v.id}`)
                  }
                  className={`w-full text-left p-3 rounded-md flex items-center ${
                    v.id === videoId
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded flex items-center justify-center mr-3">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {v.title}
                    </h4>
                    <div className="text-xs text-gray-500">时长: {v.duration}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
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

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">视频评价</h3>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">筛选状态：</span>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filterStatus === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  全部
                </button>
                <button
                  onClick={() => setFilterStatus('pending')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filterStatus === 'pending'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                  }`}
                >
                  待审核
                </button>
                <button
                  onClick={() => setFilterStatus('approved')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filterStatus === 'approved'
                      ? 'bg-green-600 text-white'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  }`}
                >
                  已通过
                </button>
                <button
                  onClick={() => setFilterStatus('rejected')}
                  className={`px-3 py-1 text-sm rounded-md ${
                    filterStatus === 'rejected'
                      ? 'bg-red-600 text-white'
                      : 'bg-red-100 text-red-800 hover:bg-red-200'
                  }`}
                >
                  已拒绝
                </button>
              </div>
            </div>

            {filteredComments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                {filterStatus === 'all' ? '暂无评价' : '暂无此状态的评价'}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredComments.map((comment) => (
                  <div key={comment.id} className="p-4 border border-gray-200 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">
                        {comment.student_name}
                      </div>
                      <div className="flex items-center space-x-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(
                            comment.status
                          )}`}
                        >
                          {getStatusLabel(comment.status)}
                        </span>
                        <div className="text-sm text-gray-500">
                          {new Date(comment.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= comment.rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="text-gray-700 mb-4">{comment.content}</div>

                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">修改状态：</span>
                      <button
                        onClick={() => handleUpdateStatus(comment.id, 'pending')}
                        disabled={
                          updatingCommentId === comment.id ||
                          comment.status === 'pending'
                        }
                        className="px-3 py-1 text-sm rounded-md bg-yellow-100 text-yellow-800 hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        待审核
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(comment.id, 'approved')}
                        disabled={
                          updatingCommentId === comment.id ||
                          comment.status === 'approved'
                        }
                        className="px-3 py-1 text-sm rounded-md bg-green-100 text-green-800 hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        通过
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(comment.id, 'rejected')}
                        disabled={
                          updatingCommentId === comment.id ||
                          comment.status === 'rejected'
                        }
                        className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-800 hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        拒绝
                      </button>
                      {updatingCommentId === comment.id && (
                        <span className="text-sm text-gray-500">更新中...</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
