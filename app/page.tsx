'use client';

import React, { useState, useEffect } from 'react';
import svgCaptcha from 'svg-captcha-browser';

export default function Home() {
  const [isStudent, setIsStudent] = useState(true);
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [captchaSvg, setCaptchaSvg] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 加载字体并生成验证码
  useEffect(() => {
    const loadFontAndGenerateCaptcha = async () => {
      try {
        // 加载字体
        await svgCaptcha.loadFont('/fonts/Comismsh.ttf');
        // 生成验证码
        generateCaptcha();
      } catch (e) {
        console.error('加载字体出错:', e);
        // 即使字体加载失败，也生成验证码（使用默认字体）
        generateCaptcha();
      }
    };

    loadFontAndGenerateCaptcha();
  }, []);

  // 生成新的验证码
  const generateCaptcha = () => {
    try {
      const newCaptcha = svgCaptcha.create({
        size: 4,
        ignoreChars: '0o1i',
        noise: 1,
        color: true,
        background: '#f5f5f5'
      });
      setCaptchaSvg(newCaptcha.data);
      setCaptchaText(newCaptcha.text);
      setCaptchaInput('');
    } catch (e) {
      console.error('生成验证码出错:', e);
      // 生成一个简单的验证码文本
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
      let text = '';
      for (let i = 0; i < 4; i++) {
        text += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setCaptchaText(text);
      setCaptchaInput('');
      // 创建一个简单的 SVG 验证码
      const svg = `<svg width="100" height="40" xmlns="http://www.w3.org/2000/svg">
        <rect width="100" height="40" fill="#f5f5f5"/>
        <text x="10" y="25" font-family="Arial" font-size="20" fill="#333">${text}</text>
        <line x1="0" y1="${Math.random() * 40}" x2="100" y2="${Math.random() * 40}" stroke="#ccc" stroke-width="1"/>
      </svg>`;
      setCaptchaSvg(svg);
    }
  };

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
    
    if (!captchaInput.trim()) {
      setError('请输入验证码');
      return;
    }
    
    if (captchaInput.toLowerCase() !== captchaText.toLowerCase()) {
      setError('验证码错误');
      generateCaptcha();
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
        window.location.href = '/teacher';
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
            <div>
              <label htmlFor="captcha" className="block text-sm font-medium text-gray-700 mb-1">
                验证码
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  id="captcha"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入验证码"
                />
                <div className="flex items-center">
                  <div
                    dangerouslySetInnerHTML={{ __html: captchaSvg }}
                    className="cursor-pointer"
                    onClick={generateCaptcha}
                    title="点击刷新验证码"
                  />
                </div>
              </div>
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
