'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TeacherProfile {
  type: 'teacher';
  id: string;
  name: string;
  department: string | null;
  title: string | null;
  role: string | null;
  createdAt: string;
}

export default function TeacherProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  
  // 修改密码相关状态
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          window.location.href = '/';
          return;
        }

        const response = await fetch('/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('获取个人信息失败');
        }

        const data = await response.json();
        setProfile(data.user);

        if (data.newToken) {
          localStorage.setItem('accessToken', data.newToken);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取个人信息失败');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('两次输入的新密码不一致');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (newPassword.length < 6) {
      setMessage('新密码至少需要6位');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setChangingPassword(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        throw new Error('未登录');
      }

      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '修改密码失败');
      }

      setMessage('密码修改成功');
      setMessageType('success');
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      if (data.newToken) {
        localStorage.setItem('accessToken', data.newToken);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '修改密码失败');
      setMessageType('error');
    } finally {
      setChangingPassword(false);
      setTimeout(() => setMessage(''), 3000);
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
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/teacher')}
                className="text-gray-600 hover:text-gray-900 mr-4"
              >
                ← 返回
              </button>
              <h1 className="text-xl font-semibold text-gray-900">个人中心</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="bg-gray-200 text-gray-700 py-1 px-3 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <div className={`mb-6 p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">个人信息</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">工号</label>
                <p className="text-lg text-gray-900">{profile?.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">姓名</label>
                <p className="text-lg text-gray-900">{profile?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">部门</label>
                <p className="text-lg text-gray-900">{profile?.department || '未设置'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">职称</label>
                <p className="text-lg text-gray-900">{profile?.title || '未设置'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">角色</label>
                <p className="text-lg text-gray-900">{profile?.role === 'admin' ? '管理员' : '普通教师'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500">注册时间</label>
                <p className="text-lg text-gray-900">{new Date(profile?.createdAt || '').toLocaleDateString('zh-CN')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">密码修改</h2>
              {!showPasswordForm && (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                >
                  修改密码
                </button>
              )}
            </div>

            {showPasswordForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入旧密码"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请输入新密码（至少6位）"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="请再次输入新密码"
                  />
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={handleChangePassword}
                    disabled={changingPassword}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                  >
                    {changingPassword ? '修改中...' : '确认修改'}
                  </button>
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setOldPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">点击右侧按钮修改密码</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
