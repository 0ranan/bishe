'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

interface Video {
  id: string;
  title: string;
  video_url: string;
  duration: string;
  order_index: number;
}

interface VideoListProps {
  videos: Video[];
  courseId: string;
}

export default function VideoList({ videos, courseId }: VideoListProps) {
  const router = useRouter();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">课程视频</h3>
      
      {videos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          暂无视频
        </div>
      ) : (
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="flex items-center p-4 border border-gray-200 rounded-md hover:bg-gray-50">
              <div className="flex-shrink-0 w-16 h-10 bg-gray-200 rounded flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-grow">
                <h4 className="font-medium text-gray-900">{video.title}</h4>
                <div className="text-sm text-gray-500">时长: {video.duration}</div>
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={() => router.push(`/student/course/${courseId}/video/${video.id}`)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  观看视频
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
