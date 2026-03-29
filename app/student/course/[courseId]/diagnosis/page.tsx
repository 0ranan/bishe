'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Chart from 'chart.js/auto';
import StudentNavbar from '@/components/student/StudentNavbar';
import StudentSidebar from '@/components/student/StudentSidebar';
import CourseInfo from '@/components/student/CourseInfo';

interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

interface LearningBehavior {
  videoLearning: number;
  materialLearning: number;
  chapterStudyCount: number;
  discussion: number;
  attendance: number;
}

interface Assignment {
  total_assignments: number;
  submitted_assignments: number;
  submission_rate: number;
  avg_score: number;
}

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

  const videoChartRef = useRef<HTMLCanvasElement>(null);
  const materialChartRef = useRef<HTMLCanvasElement>(null);
  const discussionChartRef = useRef<HTMLCanvasElement>(null);
  const attendanceChartRef = useRef<HTMLCanvasElement>(null);
  const totalScoreChartRef = useRef<HTMLCanvasElement>(null);
  const charts = useRef<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
          router.push('/');
          return;
        }

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

  useEffect(() => {
    if (diagnosisData) {
      charts.current.forEach(chart => chart.destroy());
      charts.current = [];

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

    return () => {
      charts.current.forEach(chart => chart.destroy());
    };
  }, [diagnosisData]);

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
      <StudentNavbar title="学情诊断" onBack={handleBack} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <StudentSidebar courseId={courseId} activeMenuItem="diagnosis" />

          <div className="lg:col-span-3">
            {course && <CourseInfo course={course} />}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">学习情况分析</h3>
              
              {diagnosisData ? (
                <>
                  <div className="mb-12">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-6">
                      <h4 className="text-lg font-medium text-gray-800">综合得分</h4>
                      <div className="flex items-center">
                        <span className="text-3xl font-bold text-blue-600 mr-3">{diagnosisData.totalScore}</span>
                        <span className="text-gray-600">/ 100</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center">
                      <div className="w-64 h-64 mb-4 md:mb-0">
                        <canvas ref={totalScoreChartRef}></canvas>
                      </div>
                      <div className="md:ml-8">
                        <div className="mb-4">
                          <div className="text-sm text-gray-500 mb-1">预测成绩等级</div>
                          <div className="text-xl font-semibold text-gray-900">{diagnosisData.predictedGrade}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500 mb-1">学习状态</div>
                          <div className="text-lg font-medium text-green-600">
                            {diagnosisData.totalScore >= 80 ? '优秀' : 
                             diagnosisData.totalScore >= 60 ? '良好' : '需要改进'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-12">
                    <h4 className="text-lg font-medium text-gray-800 mb-6">学习行为指标</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-700">音视频学习完成率</span>
                          <span className="font-medium text-green-600">{diagnosisData.learningBehavior.videoLearning}%</span>
                        </div>
                        <div className="w-full h-48">
                          <canvas ref={videoChartRef}></canvas>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-700">资料自主学习完成率</span>
                          <span className="font-medium text-indigo-600">{diagnosisData.learningBehavior.materialLearning}%</span>
                        </div>
                        <div className="w-full h-48">
                          <canvas ref={materialChartRef}></canvas>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-700">讨论参与度</span>
                          <span className="font-medium text-purple-600">{diagnosisData.learningBehavior.discussion}%</span>
                        </div>
                        <div className="w-full h-48">
                          <canvas ref={discussionChartRef}></canvas>
                        </div>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-700">签到完成率</span>
                          <span className="font-medium text-orange-600">{diagnosisData.learningBehavior.attendance}%</span>
                        </div>
                        <div className="w-full h-48">
                          <canvas ref={attendanceChartRef}></canvas>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">章节学习次数</span>
                        <span className="font-medium text-blue-600">{diagnosisData.learningBehavior.chapterStudyCount}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-12">
                    <h4 className="text-lg font-medium text-gray-800 mb-6">作业情况</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">总作业数</div>
                        <div className="text-2xl font-semibold text-gray-900">{diagnosisData.assignment.total_assignments}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">已提交</div>
                        <div className="text-2xl font-semibold text-gray-900">{diagnosisData.assignment.submitted_assignments}</div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500 mb-1">提交率</div>
                        <div className="text-2xl font-semibold text-gray-900">{diagnosisData.assignment.submission_rate}%</div>
                      </div>
                    </div>
                    <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">平均分数</span>
                        <span className="font-medium text-yellow-600">{diagnosisData.assignment.avg_score}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-medium text-gray-800 mb-4">学习建议</h4>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <ul className="space-y-3">
                        {diagnosisData.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-600 mr-3 mt-1">•</span>
                            <span className="text-gray-700">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
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
