'use client';

import React, { useState } from 'react';

export default function Home() {
  const [isStudent, setIsStudent] = useState(true);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!id.trim()) {
      setError(isStudent ? '请输入学号' : '请输入工号');
      return;
    }
    
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setLoading(true);
    try {
      // 发送登录请求
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: isStudent ? 'student' : 'teacher',
          id,
          password
        }),
      });

      // 解析响应
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '登录失败');
      }

      // 存储 token 到本地存储
      localStorage.setItem('accessToken', data.tokens.accessToken);
      localStorage.setItem('refreshToken', data.tokens.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 登录成功
      setLoading(false);
      alert('登录成功！');
      // 根据用户类型重定向
      if (data.user.type === 'student') {
        window.location.href = '/student';
      } else if (data.user.type === 'teacher') {
        // 教师页面可以后续实现
        window.location.href = '/';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">登录系统</h1>

        {/* 身份切换按钮 */}
        <div className="flex mb-8 border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsStudent(true)}
            className={`flex-1 py-2 ${isStudent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} focus:outline-none`}
          >
            学生登录
          </button>
          <button
            onClick={() => setIsStudent(false)}
            className={`flex-1 py-2 ${!isStudent ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'} focus:outline-none`}
          >
            教师登录
          </button>
        </div>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 登录表单 */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
                {isStudent ? '学号' : '工号'}
              </label>
              <input
                type="text"
                id="id"
                value={id}
                onChange={(e) => setId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={isStudent ? '请输入学号' : '请输入工号'}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入密码"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
