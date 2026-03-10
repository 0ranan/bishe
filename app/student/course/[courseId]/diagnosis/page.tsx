'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// 定义课程接口
interface Course {
  course_id: string;
  course_name: string;
  credit: number;
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

export default function DiagnosisPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 获取课程信息和诊断数据
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 从本地存储获取 token
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          // 未登录，重定向到登录页面
          router.push('/');
          return;
        }

        // 获取课程信息
        const courseResponse = await fetch(`/api/student/courses/${courseId}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!courseResponse.ok) {
          throw new Error('获取课程信息失败');
        }

        const courseData = await courseResponse.json();
        setCourse(courseData.course);

        // 获取诊断数据
        const diagnosisResponse = await fetch(`/api/student/courses/${courseId}/diagnosis`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        });

        if (!diagnosisResponse.ok) {
          throw new Error('获取诊断数据失败');
        }

        const diagnosisResult = await diagnosisResponse.json();
        setDiagnosisData(diagnosisResult.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, router]);

  // 返回到课程列表
  const handleBack = () => {
    router.push(`/student/course/${courseId}`);
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
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                ← 返回课程详情
              </button>
              <h1 className="text-xl font-semibold text-gray-900">学情诊断</h1>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">课程功能</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => router.push(`/student/course/${courseId}`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  代办界面
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/attendance`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  课程签到
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/chapters`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  课程章节
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/discussion`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  课程讨论
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/diagnosis`)}
                  className="w-full text-left p-3 rounded-md bg-blue-50 text-blue-600 font-medium"
                >
                  学情诊断
                </button>
                <button 
                  onClick={() => router.push(`/student/course/${courseId}/assignments`)}
                  className="w-full text-left p-3 rounded-md hover:bg-gray-100 text-gray-700"
                >
                  课程作业
                </button>
              </div>
            </div>
          </div>

          {/* 右侧内容 */}
          <div className="lg:col-span-3">
            {/* 课程信息 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{course?.course_name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="text-gray-600">课程ID: {course?.course_id}</div>
                <div className="text-gray-600">学分: {course?.credit}</div>
              </div>
            </div>

            {/* 诊断内容 */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">学习情况分析</h3>
              
              {diagnosisData ? (
                <>
                  {/* 综合得分 */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-medium text-gray-700">综合得分</h4>
                      <span className="text-2xl font-bold text-blue-600">{diagnosisData.totalScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${Math.min(diagnosisData.totalScore, 100)}%` }}
                      ></div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      预测成绩等级: <span className="font-medium">{diagnosisData.predictedGrade}</span>
                    </div>
                  </div>

                  {/* 学习行为指标 */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-700 mb-4">学习行为指标</h4>
                    <div className="space-y-4">
                      {/* 音视频学习完成率 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">音视频学习完成率</span>
                          <span className="font-medium">{diagnosisData.learningBehavior.videoLearning}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(diagnosisData.learningBehavior.videoLearning, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 资料自主学习完成率 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">资料自主学习完成率</span>
                          <span className="font-medium">{diagnosisData.learningBehavior.materialLearning}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(diagnosisData.learningBehavior.materialLearning, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 章节学习次数 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">章节学习次数</span>
                          <span className="font-medium">{diagnosisData.learningBehavior.chapterStudyCount}</span>
                        </div>
                      </div>

                      {/* 讨论参与度 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">讨论参与度</span>
                          <span className="font-medium">{diagnosisData.learningBehavior.discussion}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(diagnosisData.learningBehavior.discussion, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 签到完成率 */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">签到完成率</span>
                          <span className="font-medium">{diagnosisData.learningBehavior.attendance}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(diagnosisData.learningBehavior.attendance, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 作业情况 */}
                  <div className="mb-8">
                    <h4 className="text-lg font-medium text-gray-700 mb-4">作业情况</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">总作业数</div>
                        <div className="text-xl font-semibold">{diagnosisData.assignment.total_assignments}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">已提交</div>
                        <div className="text-xl font-semibold">{diagnosisData.assignment.submitted_assignments}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">提交率</div>
                        <div className="text-xl font-semibold">{diagnosisData.assignment.submission_rate}%</div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-gray-600">平均分数</span>
                        <span className="font-medium">{diagnosisData.assignment.avg_score}</span>
                      </div>
                    </div>
                  </div>

                  {/* 学习建议 */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-700 mb-4">学习建议</h4>
                    <ul className="space-y-2">
                      {diagnosisData.suggestions.map((suggestion, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          <span className="text-gray-700">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  暂无学情数据
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
