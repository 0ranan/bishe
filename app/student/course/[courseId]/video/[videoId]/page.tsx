'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AIAssistantFloat from '@/components/AIAssistantFloat';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';

interface Comment {
  id: string;
  student_id: string;
  student_name: string;
  content: string;
  rating: number;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

export default function VideoPlayerPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const videoId = params.videoId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [video, setVideo] = useState<Video | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newComment, setNewComment] = useState('');
  const [rating, setRating] = useState(5);
  const [submittingComment, setSubmittingComment] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const startTimeRef = useRef<number>(Date.now());
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const recordPlayDuration = useCallback(async () => {
    try {
      const currentTime = Date.now();
      const duration = Math.floor((currentTime - startTimeRef.current) / 1000);

      if (duration > 0) {
        await authFetch(
          `/api/student/courses/${courseId}/videos/${videoId}/play-duration`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ duration }),
          }
        );

        startTimeRef.current = currentTime;
      }
    } catch (err) {
      console.error('记录播放时长失败:', err);
    }
  }, [courseId, videoId]);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {

        const videosResponse = await authFetch(`/api/student/courses/${courseId}/videos`);

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

        const commentsResponse = await authFetch(`/api/student/courses/${courseId}/videos/${videoId}/comments`);

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

  useEffect(() => {
    if (videoRef.current) {
      const videoElement = videoRef.current;

      const handlePlay = () => {
        startTimeRef.current = Date.now();
        durationIntervalRef.current = setInterval(() => {
          recordPlayDuration();
        }, 30000);
      };

      const handlePause = () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        recordPlayDuration();
      };

      const handleEnded = () => {
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        recordPlayDuration();
      };

      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('pause', handlePause);
      videoElement.addEventListener('ended', handleEnded);

      return () => {
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('pause', handlePause);
        videoElement.removeEventListener('ended', handleEnded);
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
        recordPlayDuration();
      };
    }
  }, [courseId, videoId, recordPlayDuration]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);

      const response = await authFetch(
        `/api/student/courses/${courseId}/videos/${videoId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: newComment, rating }),
        }
      );

      if (!response.ok) {
        throw new Error('提交评价失败');
      }

      const newCommentData = await response.json();
      setComments([newCommentData.comment, ...comments]);
      setNewComment('');
      setRating(5);
    } catch (err) {
      alert(err instanceof Error ? err.message : '提交评价失败');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (courseLoading || loading) {
    return <CourseContentSkeleton />;
  }

  if (courseError || error) {
    return <div className="text-red-600">{courseError || error}</div>;
  }

  return (
    <>
      <AIAssistantFloat courseId={courseId} />

      {course && <CourseInfo course={course} />}

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-72 shrink-0 min-w-0">
          <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 sticky top-4 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">课程视频列表</h3>
            <div className="space-y-2.5">
              {videos.map((v) => (
                <button
                  key={v.id}
                  onClick={() =>
                    router.push(`/student/course/${courseId}/video/${v.id}`)
                  }
                  className={`w-full min-w-0 text-left px-3.5 py-3.5 rounded-md flex items-center gap-3 ${
                    v.id === videoId
                      ? 'bg-blue-50 border-l-4 border-blue-600'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
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
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-gray-900 text-sm truncate" title={v.title}>
                      {v.title}
                    </h4>
                    <div className="text-xs text-gray-500 mt-0.5">时长: {v.duration}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{video?.title}</h2>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">视频评价</h3>

            <div className="mb-8">
              <h4 className="font-medium text-gray-700 mb-2">发表评价</h4>
              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    评分
                  </label>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className={`text-2xl ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    评价内容
                  </label>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入您的评价..."
                  />
                </div>
                <button
                  type="submit"
                  disabled={submittingComment}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                >
                  {submittingComment ? '提交中...' : '提交评价'}
                </button>
              </form>
            </div>

            {comments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">暂无评价</div>
            ) : (
              <div className="space-y-6">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 border border-gray-200 rounded-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-gray-900">
                        {comment.student_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-lg ${
                            star <= comment.rating
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
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
    </>
  );
}
