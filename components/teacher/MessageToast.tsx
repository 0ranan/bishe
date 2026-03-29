'use client';

import React from 'react';

interface MessageToastProps {
  message: string;
  type: 'success' | 'error';
}

export default function MessageToast({ message, type }: MessageToastProps) {
  if (!message) return null;

  return (
    <div className={`mb-6 p-4 rounded-md ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
      {message}
    </div>
  );
}
