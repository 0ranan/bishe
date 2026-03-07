'use client';

import React, { useState, useEffect } from 'react';

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState('');
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取所有 todos
  const fetchTodos = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) {
        throw new Error('获取 todo 失败');
      }
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取 todo 失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建新 todo
  const createTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('请输入标题');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, completed }),
      });

      if (!response.ok) {
        throw new Error('创建 todo 失败');
      }

      const newTodo = await response.json();
      setTodos([newTodo, ...todos]);
      setTitle('');
      setCompleted(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建 todo 失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始加载 todos
  useEffect(() => {
    fetchTodos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6 text-gray-800">Todo API 测试页面</h1>

        {/* 错误信息 */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* 创建 todo 表单 */}
        <form onSubmit={createTodo} className="mb-8">
          <div className="flex flex-col space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                标题
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="输入 todo 标题"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="completed"
                checked={completed}
                onChange={(e) => setCompleted(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="completed" className="text-sm font-medium text-gray-700">
                已完成
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-400"
            >
              {loading ? '创建中...' : '创建 Todo'}
            </button>
          </div>
        </form>

        {/* Todo 列表 */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-gray-700">Todo 列表</h2>
          {loading && todos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">加载中...</div>
          ) : todos.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无 todo</div>
          ) : (
            <ul className="space-y-3">
              {todos.map((todo) => (
                <li key={todo.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      readOnly
                      className="mr-3"
                    />
                    <div>
                      <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                        {todo.title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        创建时间: {new Date(todo.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500">ID: {todo.id.slice(0, 8)}...</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 刷新按钮 */}
        <div className="mt-6 text-center">
          <button
            onClick={fetchTodos}
            disabled={loading}
            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50 disabled:bg-gray-100"
          >
            {loading ? '刷新中...' : '刷新列表'}
          </button>
        </div>
      </div>

      {/* API 文档链接 */}
      <div className="mt-8 text-center text-sm text-gray-600">
        <p>API 文档: <a href="#" className="text-blue-600 hover:underline">查看完整 API 文档</a></p>
      </div>
    </div>
  );
}
