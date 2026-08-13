'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Chart from 'chart.js/auto';
import { useCourse } from '@/lib/course-context';
import CourseInfo from '@/components/course/CourseInfo';
import CourseContentSkeleton from '@/components/course/CourseContentSkeleton';

// 讨论数据
interface Discussion {
  totalTopics: number;
  totalComments: number;
  activeStudents: number;
}

// 课堂活动数据
interface ClassroomActivity {
  attendance: number;
  participation: number;
  topStudents: {
    name: string;
    score: number;
    rank: number;
  }[];
}

// 视频学习数据
interface VideoLearning {
  totalVideos: number;
  viewedVideos: number;
  completionRate: number;
}

// 作业数据
interface AssignmentOverview {
  totalAssignments: number;
  submittedAssignments: number;
  completionRate: number;
  avgScore: number;
}

// 课程整体学情数据
interface CourseOverview {
  discussion: Discussion;
  classroomActivity: ClassroomActivity;
  video: VideoLearning;
  assignment: AssignmentOverview;
  avgTotalScore: number;
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

interface Student {
  id: string;
  name: string;
  student_id: string;
  diagnosis: DiagnosisData | null;
  error?: string;
}

// 仪表盘卡片组件
const StatCard = ({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 ${className}`}>
    <h4 className="text-lg font-semibold text-gray-800 mb-4">{title}</h4>
    {children}
  </div>
);

// 环形图组件
const DonutChart = ({ 
  percentage, 
  color, 
  size = 120,
  label
}: { 
  percentage: number; 
  color: string; 
  size?: number;
  label?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
      
      chartRef.current = new Chart(canvasRef.current, {
        type: 'doughnut',
        data: {
          labels: ['已完成', '未完成'],
          datasets: [{
            data: [percentage, 100 - percentage],
            backgroundColor: [color, '#e5e7eb'],
            borderWidth: 0,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { enabled: false },
          },
          cutout: '75%',
        }
      });
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [percentage, color]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <canvas ref={canvasRef}></canvas>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{percentage}%</span>
        {label && <span className="text-xs text-gray-500">{label}</span>}
      </div>
    </div>
  );
};

// 排行榜组件
const Leaderboard = ({ students }: { students: { name: string; score: number; rank: number }[] }) => (
  <div className="flex items-end justify-center space-x-4 h-32">
    {students.map((student, index) => {
      const heights = ['h-16', 'h-24', 'h-20'];
      const colors = ['bg-gray-300', 'bg-yellow-400', 'bg-orange-400'];
      const positions = [2, 1, 3];
      
      return (
        <div key={index} className="flex flex-col items-center">
          <div className={`w-12 ${heights[index]} ${colors[index]} rounded-t-lg flex items-center justify-center relative`}>
            <span className="text-white font-bold text-lg">{positions[index]}</span>
            {positions[index] === 1 && (
              <div className="absolute -top-3 text-yellow-500 text-xl">👑</div>
            )}
          </div>
          <div className="mt-2 text-center">
            <div className="text-xs text-gray-600 truncate w-16">{student.name}</div>
            <div className="text-xs font-medium text-gray-800">{student.score}分</div>
          </div>
        </div>
      );
    })}
  </div>
);

export default function TeacherCourseDiagnosisPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;
  const { course, loading: courseLoading, error: courseError } = useCourse();

  const [students, setStudents] = useState<Student[]>([]);
  const [courseOverview, setCourseOverview] = useState<CourseOverview | null>(null);
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'students'>('overview');

  const videoChartRef = useRef<HTMLCanvasElement>(null);
  const materialChartRef = useRef<HTMLCanvasElement>(null);
  const discussionChartRef = useRef<HTMLCanvasElement>(null);
  const attendanceChartRef = useRef<HTMLCanvasElement>(null);
  const totalScoreChartRef = useRef<HTMLCanvasElement>(null);
  const charts = useRef<Chart[]>([]);

  useEffect(() => {
    const fetchModuleData = async () => {
      try {

        const diagnosisResponse = await authFetch(`/api/teacher/courses/${courseId}/diagnosis`);

        if (!diagnosisResponse.ok) {
          throw new Error('获取学情数据失败');
        }

        const diagnosisData = await diagnosisResponse.json();
        setStudents(diagnosisData.data.students);
        setCourseOverview(diagnosisData.data.courseOverview);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取数据失败');
      } finally {
        setModuleLoading(false);
      }
    };

    fetchModuleData();
  }, [courseId, router]);

  useEffect(() => {
    if (expandedStudent) {
      charts.current.forEach(chart => chart.destroy());
      charts.current = [];

      const student = students.find(s => s.id === expandedStudent);
      if (student && student.diagnosis) {
        const diagnosisData = student.diagnosis;

        if (totalScoreChartRef.current) {
          const totalScoreChart = new Chart(totalScoreChartRef.current, {
            type: 'doughnut',
            data: {
              labels: ['已完成', '未完成'],
              datasets: [{
                data: [diagnosisData.totalScore, 100 - diagnosisData.totalScore],
                backgroundColor: ['#3b82f6', '#e5e7eb'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
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
                backgroundColor: ['#10b981', '#e5e7eb'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
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
                backgroundColor: ['#6366f1', '#e5e7eb'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
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
                backgroundColor: ['#8b5cf6', '#e5e7eb'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
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
                backgroundColor: ['#f97316', '#e5e7eb'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              cutout: '70%'
            }
          });
          charts.current.push(attendanceChart);
        }
      }
    }

    return () => {
      charts.current.forEach(chart => chart.destroy());
    };
  }, [expandedStudent, students]);

  const toggleStudentExpansion = (studentId: string) => {
    setExpandedStudent(expandedStudent === studentId ? null : studentId);
  };

  if (courseLoading || moduleLoading) {
    return <CourseContentSkeleton />;
  }

  if (courseError || error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-600">{courseError || error}</div>
      </div>
    );
  }

  return (
    <>
      {course && <CourseInfo course={course} />}

      {/* 标签切换 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            课程整体学情
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
              activeTab === 'students'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            学生个体学情
          </button>
        </div>
      </div>

      {activeTab === 'overview' && courseOverview && (
        <div className="space-y-6">
          {/* 平均综合得分 */}
          <StatCard title="平均综合得分">
            <div className="flex items-center justify-center">
              <DonutChart 
                percentage={courseOverview.avgTotalScore} 
                color="#3b82f6"
                size={180}
                label="班级平均"
              />
              <div className="ml-8 space-y-4">
                <div>
                  <div className="text-sm text-gray-500">平均得分</div>
                  <div className="text-4xl font-bold text-blue-600">{courseOverview.avgTotalScore}</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                    <span className="text-gray-600">
                      {courseOverview.avgTotalScore >= 90 ? '优秀' : 
                       courseOverview.avgTotalScore >= 80 ? '良好' : 
                       courseOverview.avgTotalScore >= 70 ? '中等' : 
                       courseOverview.avgTotalScore >= 60 ? '合格' : '需要改进'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </StatCard>

          {/* 第一行：视频学习和作业情况 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 视频学习 */}
            <StatCard title="视频学习">
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">总视频数</div>
                    <div className="text-3xl font-bold text-gray-800">{courseOverview.video.totalVideos}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">已观看</div>
                    <div className="text-3xl font-bold text-green-500">{courseOverview.video.viewedVideos}</div>
                  </div>
                </div>
                <DonutChart 
                  percentage={courseOverview.video.completionRate} 
                  color="#10b981"
                  size={140}
                />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">完成率</span>
                    <span className="font-medium text-green-600">{courseOverview.video.completionRate}%</span>
                  </div>
                </div>
              </div>
            </StatCard>

            {/* 作业情况 */}
            <StatCard title="作业情况">
              <div className="flex items-center justify-between">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-gray-500">总作业数</div>
                    <div className="text-3xl font-bold text-gray-800">{courseOverview.assignment.totalAssignments}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">平均分</div>
                    <div className="text-3xl font-bold text-yellow-500">{courseOverview.assignment.avgScore}</div>
                  </div>
                </div>
                <DonutChart 
                  percentage={courseOverview.assignment.completionRate} 
                  color="#f59e0b"
                  size={140}
                />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">提交率</span>
                    <span className="font-medium text-yellow-600">{courseOverview.assignment.completionRate}%</span>
                  </div>
                </div>
              </div>
            </StatCard>
          </div>

          {/* 第二行：讨论和课堂活动 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 讨论 */}
            <StatCard title="讨论">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{courseOverview.discussion.totalTopics}</div>
                  <div className="text-sm text-gray-600 mt-1">讨论主题</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{courseOverview.discussion.totalComments}</div>
                  <div className="text-sm text-gray-600 mt-1">总评论数</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{courseOverview.discussion.activeStudents}</div>
                  <div className="text-sm text-gray-600 mt-1">活跃学生</div>
                </div>
              </div>
            </StatCard>

            {/* 课堂活动 */}
            <StatCard title="课堂活动">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-8 mb-4">
                    <DonutChart 
                      percentage={courseOverview.classroomActivity.attendance} 
                      color="#3b82f6"
                      size={100}
                      label="签到"
                    />
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                        <span className="text-gray-600">签到: {courseOverview.classroomActivity.attendance}%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                        <span className="text-gray-600">参与: {courseOverview.classroomActivity.participation}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                {courseOverview.classroomActivity.topStudents.length > 0 && (
                  <div className="border-l pl-6">
                    <div className="text-sm text-gray-500 mb-2 text-center">活跃排行榜</div>
                    <Leaderboard students={courseOverview.classroomActivity.topStudents} />
                  </div>
                )}
              </div>
            </StatCard>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
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
                  
                  {expandedStudent === student.id && student.diagnosis && (
                    <div className="p-4 border-t border-gray-200">
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

                      <div className="mb-8">
                        <h4 className="text-lg font-medium text-gray-800 mb-4">学习行为指标</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-700">音视频学习完成率</span>
                              <span className="font-medium text-green-600">{student.diagnosis.learningBehavior.videoLearning}%</span>
                            </div>
                            <div className="w-full h-32">
                              <canvas ref={videoChartRef}></canvas>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-700">资料自主学习完成率</span>
                              <span className="font-medium text-indigo-600">{student.diagnosis.learningBehavior.materialLearning}%</span>
                            </div>
                            <div className="w-full h-32">
                              <canvas ref={materialChartRef}></canvas>
                            </div>
                          </div>

                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-gray-700">讨论参与度</span>
                              <span className="font-medium text-purple-600">{student.diagnosis.learningBehavior.discussion}%</span>
                            </div>
                            <div className="w-full h-32">
                              <canvas ref={discussionChartRef}></canvas>
                            </div>
                          </div>

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

                        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">章节学习次数</span>
                            <span className="font-medium text-blue-600">{student.diagnosis.learningBehavior.chapterStudyCount}</span>
                          </div>
                        </div>
                      </div>

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
      )}

      <button
        onClick={() => router.push(`/teacher/course/${courseId}/diagnosis/bigscreen`)}
        className="fixed bottom-8 right-8 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-slate-800 to-cyan-600 hover:from-slate-700 hover:to-cyan-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
        style={{ boxShadow: '0 4px 20px rgba(6, 182, 212, 0.3)' }}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
        <span className="font-medium">学情诊断大屏</span>
      </button>
    </>
  );
}
