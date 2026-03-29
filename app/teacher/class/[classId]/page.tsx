'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义学生接口
interface Student {
  student_id: string;
  name: string;
  grade: string;
  major: string;
}

// 定义班级接口
interface Class {
  class_id: string;
  class_name: string;
  grade: string;
  student_count: number;
}

// 定义用户接口
interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

export default function TeacherClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [cls, setCls] = useState<Class | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // 编辑班级信息相关状态
  const [isEditing, setIsEditing] = useState(false);
  const [editClassName, setEditClassName] = useState('');
  const [editGrade, setEditGrade] = useState('');
  
  // 添加学生相关状态
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  
  // 批量导入学生相关状态
  const [showBatchImport, setShowBatchImport] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<Record<string, string>[]>([]);
  const [importing, setImporting] = useState(false);
  
  // 消息提示状态
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // 检查用户登录状态并获取班级详情
  useEffect(() => {
    const checkLoginAndGetClassDetails = async () => {
      try {
        // 从本地存储获取 token
        const accessToken = localStorage.getItem('accessToken');
        const userData = localStorage.getItem('user');

        if (!accessToken || !userData) {
          // 未登录，重定向到登录页面
          window.location.href = '/';
          return;
        }

        // 解析用户信息
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // 验证用户类型
        if (parsedUser.type !== 'teacher') {
          window.location.href = '/';
          return;
        }

        // 获取班级详情
        const classResponse = await fetch(`/api/teacher/classes/${classId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!classResponse.ok) {
          throw new Error('获取班级信息失败');
        }

        const classData = await classResponse.json();
        setCls(classData.class);
        // 初始化编辑表单数据
        setEditClassName(classData.class.class_name);
        setEditGrade(classData.class.grade);

        // 获取班级学生列表
        const studentsResponse = await fetch(`/api/teacher/classes/${classId}/students`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!studentsResponse.ok) {
          throw new Error('获取学生列表失败');
        }

        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取班级详情失败');
        // 登录过期或出错，重定向到登录页面
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    checkLoginAndGetClassDetails();
  }, [classId, router]);

  // 返回到班级列表
  const handleBack = () => {
    router.push('/teacher/classes');
  };

  // 处理编辑班级信息
  const handleEditClass = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await fetch(`/api/teacher/classes/${classId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_name: editClassName,
          grade: editGrade,
        }),
      });

      if (!response.ok) {
        throw new Error('更新班级信息失败');
      }

      const updatedClass = await response.json();
      setCls(updatedClass.class);
      setIsEditing(false);
      setMessage('班级信息更新成功');
      setMessageType('success');
      // 3秒后清除消息
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '更新班级信息失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 处理添加学生
  const handleAddStudent = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken || !newStudentId) return;

      const response = await fetch(`/api/teacher/classes/${classId}/students`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: newStudentId,
        }),
      });

      if (!response.ok) {
        throw new Error('添加学生失败');
      }

      // 重新获取学生列表
      const studentsResponse = await fetch(`/api/teacher/classes/${classId}/students`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const studentsData = await studentsResponse.json();
      setStudents(studentsData.students);
      
      // 重新获取班级信息以更新学生人数
      const classResponse = await fetch(`/api/teacher/classes/${classId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const classData = await classResponse.json();
      setCls(classData.class);

      setNewStudentId('');
      setShowAddStudent(false);
      setMessage('学生添加成功');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '添加学生失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 处理删除学生
  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm('确定要删除这个学生吗？')) return;

    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await fetch(`/api/teacher/classes/${classId}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('删除学生失败');
      }

      // 重新获取学生列表
      const studentsResponse = await fetch(`/api/teacher/classes/${classId}/students`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const studentsData = await studentsResponse.json();
      setStudents(studentsData.students);
      
      // 重新获取班级信息以更新学生人数
      const classResponse = await fetch(`/api/teacher/classes/${classId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const classData = await classResponse.json();
      setCls(classData.class);

      setMessage('学生删除成功');
      setMessageType('success');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '删除学生失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // 解析CSV文件
  const parseCSV = (content: string): Record<string, string>[] => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const data: Record<string, string>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      data.push(row);
    }
    
    return data;
  };

  // 处理文件选择
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setCsvFile(file);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsedData = parseCSV(content);
      setPreviewData(parsedData);
    };
    reader.readAsText(file);
  };

  // 处理批量导入
  const handleBatchImport = async () => {
    if (previewData.length === 0) return;
    
    setImporting(true);
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) return;

      const response = await fetch(`/api/teacher/classes/${classId}/students/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          students: previewData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '批量导入失败');
      }

      const result = await response.json();
      
      // 重新获取学生列表
      const studentsResponse = await fetch(`/api/teacher/classes/${classId}/students`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const studentsData = await studentsResponse.json();
      setStudents(studentsData.students);
      
      // 重新获取班级信息以更新学生人数
      const classResponse = await fetch(`/api/teacher/classes/${classId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const classData = await classResponse.json();
      setCls(classData.class);

      setShowBatchImport(false);
      setCsvFile(null);
      setPreviewData([]);
      setMessage(`批量导入成功！成功导入 ${result.imported} 个学生${result.existed > 0 ? `，${result.existed} 个学生已存在` : ''}`);
      setMessageType('success');
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '批量导入失败');
      setMessageType('error');
      setTimeout(() => setMessage(''), 5000);
    } finally {
      setImporting(false);
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
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
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
                  className="w-full text-left py-2 px-3 rounded-md bg-blue-50 text-blue-600 font-medium"
                >
                  我的班级
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1">
          {/* 消息提示 */}
          {message && (
            <div className={`mb-6 p-4 rounded-md ${messageType === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {message}
            </div>
          )}

          {/* 班级信息 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">班级详情</h2>
              <div className="flex space-x-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleEditClass}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditClassName(cls?.class_name || '');
                        setEditGrade(cls?.grade || '');
                      }}
                      className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
                    >
                      取消
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                    >
                      编辑班级信息
                    </button>
                    <button
                      onClick={handleBack}
                      className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
                    >
                      ← 返回班级列表
                    </button>
                  </>
                )}
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班级ID</label>
                  <input
                    type="text"
                    value={cls?.class_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">班级名称</label>
                  <input
                    type="text"
                    value={editClassName}
                    onChange={(e) => setEditClassName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">年级</label>
                  <input
                    type="text"
                    value={editGrade}
                    onChange={(e) => setEditGrade(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学生人数</label>
                  <input
                    type="text"
                    value={cls?.student_count}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-gray-600">班级ID: {cls?.class_id}</div>
                <div className="text-gray-600">班级名称: {cls?.class_name}</div>
                <div className="text-gray-600">年级: {cls?.grade}</div>
                <div className="text-gray-600">学生人数: {cls?.student_count}</div>
              </div>
            )}
          </div>

          {/* 学生列表 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">学生列表</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowBatchImport(!showBatchImport)}
                  className="bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none"
                >
                  {showBatchImport ? '取消批量导入' : '批量导入学生'}
                </button>
                <button
                  onClick={() => setShowAddStudent(!showAddStudent)}
                  className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none"
                >
                  {showAddStudent ? '取消添加' : '添加学生'}
                </button>
              </div>
            </div>

            {/* 批量导入学生表单 */}
            {showBatchImport && (
              <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h4 className="text-lg font-medium text-gray-900 mb-3">批量导入学生</h4>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      CSV格式要求：表头为 student_id, name, password, grade, major（其中 password 可选，默认使用学号作为密码）
                      <a
                        href="/students_example.csv"
                        download
                        className="text-blue-600 hover:text-blue-800 ml-2"
                      >
                        下载示例文件
                      </a>
                    </p>
                    <label className="block text-sm font-medium text-gray-700 mb-1">选择CSV文件</label>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  {csvFile && (
                    <p className="text-sm text-gray-600">
                      已选择文件：{csvFile.name}
                    </p>
                  )}
                  {previewData.length > 0 && (
                    <div>
                      <h5 className="text-md font-medium text-gray-900 mb-2">数据预览</h5>
                      <div className="overflow-x-auto max-h-60 overflow-y-auto border border-gray-300 rounded-md">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              {Object.keys(previewData[0]).map((header) => (
                                <th key={header} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                  {header}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {previewData.slice(0, 5).map((row, index) => (
                              <tr key={index}>
                                {Object.entries(row).map(([header, value], idx) => (
                                  <td 
                                    key={idx} 
                                    className={`px-4 py-2 text-sm ${header.toLowerCase() === 'password' && !value ? 'text-yellow-600 italic' : 'text-gray-900'}`}
                                  >
                                    {header.toLowerCase() === 'password' && !value ? '使用学号' : value}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {previewData.length > 5 && (
                        <p className="text-sm text-gray-500 mt-1">
                          显示前 5 条，共 {previewData.length} 条记录
                        </p>
                      )}
                    </div>
                  )}
                  {previewData.length > 0 && (
                    <button
                      onClick={handleBatchImport}
                      disabled={importing}
                      className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none disabled:opacity-50"
                    >
                      {importing ? '导入中...' : '确认导入'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 添加学生表单 */}
            {showAddStudent && (
              <div className="mb-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                <h4 className="text-lg font-medium text-gray-900 mb-3">添加学生</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">学号</label>
                    <input
                      type="text"
                      value={newStudentId}
                      onChange={(e) => setNewStudentId(e.target.value)}
                      placeholder="请输入学生学号"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={handleAddStudent}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none"
                  >
                    添加学生
                  </button>
                </div>
              </div>
            )}

            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无学生
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        学号
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        姓名
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        年级
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        专业
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.student_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.student_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.grade}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.major}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleDeleteStudent(student.student_id)}
                            className="text-red-600 hover:text-red-800 focus:outline-none"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
