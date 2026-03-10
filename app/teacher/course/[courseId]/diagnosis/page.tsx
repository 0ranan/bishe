'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Chart from 'chart.js/auto';

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

// 定义用户接口
interface User {
  id: string;
  name: string;
  type: 'student' | 'teacher';
}

// 定义学习行为数据接口
interface LearningBehavior {
  videoLearning: number;
  materialLearning: number;
  chapterStudyCount: number;
  discussion: number;
  attendance: number;
}

// 定义作业情况接口
interface Assignment {
  total_assignments: number;
  submitted_assignments: number;
  submission_rate: number;
  avg_score: number;
}

// 定义诊断数据接口
interface DiagnosisData {
  learningBehavior: LearningBehavior;
  assignment: Assignment;
  totalScore: number;
  predictedGrade: string;
  suggestions: string[];
}

// 定义学生接口
interface Student {
  id: string;
  name: string;
  student_id: string;
  diagnosis: DiagnosisData | null;
  error?: string;
}

export default function TeacherCourseDiagnosisPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [user, setUser] = useState<User | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 图表引用
  const videoChartRef = useRef<HTMLCanvasElement>(null);
  const materialChartRef = useRef<HTMLCanvasElement>(null);
  const discussionChartRef = useRef<HTMLCanvasElement>(null);
  const attendanceChartRef = useRef<HTMLCanvasElement>(null);
  const totalScoreChartRef = useRef<HTMLCanvasElement>(null);
  const charts = useRef<any[]>([]);

  // 获取课程信息和学生学情数据
  useEffect(() => {
    const fetchCourseDetails = async () => {
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

        // 获取学生学情数据
        const diagnosisResponse = await fetch(`/api/teacher/courses/${courseId}/diagnosis`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!diagnosisResponse.ok) {
          throw new Error('获取学情数据失败');
        }

        const diagnosisData = await diagnosisResponse.json();
        setStudents(diagnosisData.data.students);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, router]);

  // 初始化图表
  useEffect(() => {
    if (expandedStudent) {
      // 清理之前的图表
      charts.current.forEach(chart => chart.destroy());
      charts.current = [];

      const student = students.find(s => s.id === expandedStudent);
      if (student && student.diagnosis) {
        const diagnosisData = student.diagnosis;

        // 综合得分饼状图
        if (totalScoreChartRef.current) {
          const totalScoreChart = new Chart(totalScoreChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['已完成', '未完成'],
              datasets: [{
                data: [diagnosisData.totalScore, 100 - diagnosisData.totalScore],
                backgroundColor: [
                  '#3b82f6',
                  '#e5e7eb'
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  enabled: true
                }
              },
              cutout: '70%'
            }
          });
          charts.current.push(totalScoreChart);
        }

        // 音视频学习完成率饼状图
        if (videoChartRef.current) {
          const videoChart = new Chart(videoChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['已完成', '未完成'],
              datasets: [{
                data: [diagnosisData.learningBehavior.videoLearning, 100 - diagnosisData.learningBehavior.videoLearning],
                backgroundColor: [
                  '#10b981',
                  '#e5e7eb'
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              cutout: '70%'
            }
          });
          charts.current.push(videoChart);
        }

        // 资料自主学习完成率饼状图
        if (materialChartRef.current) {
          const materialChart = new Chart(materialChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['已完成', '未完成'],
              datasets: [{
                data: [diagnosisData.learningBehavior.materialLearning, 100 - diagnosisData.learningBehavior.materialLearning],
                backgroundColor: [
                  '#6366f1',
                  '#e5e7eb'
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              cutout: '70%'
            }
          });
          charts.current.push(materialChart);
        }

        // 讨论参与度饼状图
        if (discussionChartRef.current) {
          const discussionChart = new Chart(discussionChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['已参与', '未参与'],
              datasets: [{
                data: [diagnosisData.learningBehavior.discussion, 100 - diagnosisData.learningBehavior.discussion],
                backgroundColor: [
                  '#8b5cf6',
                  '#e5e7eb'
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              cutout: '70%'
            }
          });
          charts.current.push(discussionChart);
        }

        // 签到完成率饼状图
        if (attendanceChartRef.current) {
          const attendanceChart = new Chart(attendanceChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['已签到', '未签到'],
              datasets: [{
                data: [diagnosisData.learningBehavior.attendance, 100 - diagnosisData.learningBehavior.attendance],
                backgroundColor: [
                  '#f97316',
                  '#e5e7eb'
                ],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              cutout: '70%'
            }
          });
          charts.current.push(attendanceChart);
        }
      }
    }

    // 清理函数
    return () => {
      charts.current.forEach(chart => chart.destroy());
    };
  }, [expandedStudent, students]);

  // 返回到课程列表
  const handleBack = () => {
    router.push('/teacher');
  };

  // 切换学生展开状态
  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
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
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">课程管理</h3>
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/attendance`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  课程签到
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/chapters`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  课程章节
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/discussion`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  课程讨论
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/diagnosis`)}
                  className="w-full text-left py-2 px-3 rounded-md bg-blue-50 text-blue-600 font-medium"
                >
                  学情诊断
                </button>
              </li>
              <li>
                <button
                  onClick={() => router.push(`/teacher/course/${courseId}/assignments`)}
                  className="w-full text-left py-2 px-3 rounded-md hover:bg-gray-100"
                >
                  课程作业
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1">
          {/* 课程信息 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">学情诊断</h2>
              <button
                onClick={handleBack}
                className="bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none"
              >
                ← 返回课程列表
              </button>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">{course?.course_name}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-gray-600">课程ID: {course?.course_id}</div>
              <div className="text-gray-600">学分: {course?.credit}</div>
            </div>
          </div>

          {/* 学生学情列表 */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">学生学情分析</h3>
            
            {students.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                暂无学生数据
              </div>
            ) : (
              <div className="space-y-4">
                {students.map((student) => (
                  <div key={student.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* 学生概览 */}
                    <button
                      onClick={() => toggleStudentExpansion(student.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">{student.name.charAt(0)}</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{student.name}</h4>
                          <p className="text-sm text-gray-500">学号: {student.student_id}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {student.diagnosis ? (
                          <div className="text-right">
                            <div className="text-sm text-gray-500">综合得分</div>
                            <div className="font-semibold text-gray-900">{student.diagnosis.totalScore}</div>
                          </div>
                        ) : (
                          <div className="text-sm text-red-500">{student.error || '数据获取失败'}</div>
                        )}
                        <div className="text-gray-400">
                          {expandedStudent === student.id ? '▼' : '▶'}
                        </div>
                      </div>
                    </button>
                    
                    {/* 学生详情 */}
                    {expandedStudent === student.id && student.diagnosis && (
                      <div className="p-4 border-t border-gray-200">
                        {/* 综合得分 */}
                        <div className="mb-8">
                          <h4 className="text-lg font-medium text-gray-800 mb-4">综合得分</h4>
                          <div className="flex flex-col md:flex-row items-center justify-center">
                            <div className="w-48 h-48 mb-4 md:mb-0">
                              <canvas ref={totalScoreChartRef}></canvas>
                            </div>
                            <div className="md:ml-8">
                              <div className="mb-2">
                                <div className="text-sm text-gray-500">预测成绩等级</div>
                                <div className="text-lg font-semibold text-gray-900">{student.diagnosis.predictedGrade}</div>
                              </div>
                              <div>
                                <div className="text-sm text-gray-500">学习状态</div>
                                <div className="text-md font-medium text-green-600">
                                  {student.diagnosis.totalScore >= 80 ? '优秀' : 
                                   student.diagnosis.totalScore >= 60 ? '良好' : '需要改进'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 学习行为指标 */}
                        <div className="mb-8">
                          <h4 className="text-lg font-medium text-gray-800 mb-4">学习行为指标</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* 音视频学习完成率 */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700">音视频学习完成率</span>
                                <span className="font-medium text-green-600">{student.diagnosis.learningBehavior.videoLearning}%</span>
                              </div>
                              <div className="w-full h-32">
                                <canvas ref={videoChartRef}></canvas>
                              </div>
                            </div>

                            {/* 资料自主学习完成率 */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700">资料自主学习完成率</span>
                                <span className="font-medium text-indigo-600">{student.diagnosis.learningBehavior.materialLearning}%</span>
                              </div>
                              <div className="w-full h-32">
                                <canvas ref={materialChartRef}></canvas>
                              </div>
                            </div>

                            {/* 讨论参与度 */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700">讨论参与度</span>
                                <span className="font-medium text-purple-600">{student.diagnosis.learningBehavior.discussion}%</span>
                              </div>
                              <div className="w-full h-32">
                                <canvas ref={discussionChartRef}></canvas>
                              </div>
                            </div>

                            {/* 签到完成率 */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-gray-700">签到完成率</span>
                                <span className="font-medium text-orange-600">{student.diagnosis.learningBehavior.attendance}%</span>
                              </div>
                              <div className="w-full h-32">
                                <canvas ref={attendanceChartRef}></canvas>
                              </div>
                            </div>
                          </div>

                          {/* 章节学习次数 */}
                          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">章节学习次数</span>
                              <span className="font-medium text-blue-600">{student.diagnosis.learningBehavior.chapterStudyCount}</span>
                            </div>
                          </div>
                        </div>

                        {/* 作业情况 */}
                        <div className="mb-8">
                          <h4 className="text-lg font-medium text-gray-800 mb-4">作业情况</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="text-sm text-gray-500 mb-1">总作业数</div>
                              <div className="text-xl font-semibold text-gray-900">{student.diagnosis.assignment.total_assignments}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="text-sm text-gray-500 mb-1">已提交</div>
                              <div className="text-xl font-semibold text-gray-900">{student.diagnosis.assignment.submitted_assignments}</div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                              <div className="text-sm text-gray-500 mb-1">提交率</div>
                              <div className="text-xl font-semibold text-gray-900">{student.diagnosis.assignment.submission_rate}%</div>
                            </div>
                          </div>
                          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">平均分数</span>
                              <span className="font-medium text-yellow-600">{student.diagnosis.assignment.avg_score}</span>
                            </div>
                          </div>
                        </div>

                        {/* 学习建议 */}
                        <div>
                          <h4 className="text-lg font-medium text-gray-800 mb-4">学习建议</h4>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <ul className="space-y-2">
                              {student.diagnosis.suggestions.map((suggestion, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="text-blue-600 mr-2 mt-1">•</span>
                                  <span className="text-gray-700">{suggestion}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
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
