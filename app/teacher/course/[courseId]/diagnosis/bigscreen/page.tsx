'use client';

import { authFetch } from '@/lib/auth-client';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Chart from 'chart.js/auto';

interface Course {
  course_id: string;
  course_name: string;
  credit: number;
}

interface Discussion {
  totalTopics: number;
  totalComments: number;
  activeStudents: number;
}

interface ClassroomActivity {
  attendance: number;
  participation: number;
  topStudents: { name: string; score: number; rank: number }[];
}

interface VideoLearning {
  totalVideos: number;
  viewedVideos: number;
  completionRate: number;
}

interface AssignmentOverview {
  totalAssignments: number;
  submittedAssignments: number;
  completionRate: number;
  avgScore: number;
}

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

type CriticalAlert = { id: string; text: string };

const PANEL =
  'rounded-lg border border-cyan-500/25 bg-[#0a1929]/90 backdrop-blur-sm shadow-[0_0_40px_rgba(34,211,238,0.08)]';
const LABEL = 'text-[11px] uppercase tracking-[0.2em] text-cyan-400/80';
const VALUE = 'text-cyan-50 font-semibold tabular-nums';

function panelTitle(text: string) {
  return (
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-500/20">
      <span className="h-px w-6 bg-gradient-to-r from-cyan-400 to-transparent" />
      <h3 className="text-sm font-medium tracking-wide text-cyan-100/95">{text}</h3>
    </div>
  );
}

function formatClock(d: Date) {
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export default function DiagnosisBigscreenPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [courseOverview, setCourseOverview] = useState<CourseOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => new Date());

  const avgChartRef = useRef<HTMLCanvasElement>(null);
  const distChartRef = useRef<HTMLCanvasElement>(null);
  const behaviorChartRef = useRef<HTMLCanvasElement>(null);
  const chartsRef = useRef<Chart[]>([]);

  const loadData = useCallback(async () => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/');
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.type !== 'teacher') {
      router.push('/');
      return;
    }

    const courseRes = await authFetch(`/api/teacher/courses/${courseId}`);
    if (!courseRes.ok) throw new Error('获取课程信息失败');
    const courseJson = await courseRes.json();
    setCourse(courseJson.course);

    const diagRes = await authFetch(`/api/teacher/courses/${courseId}/diagnosis`);
    if (!diagRes.ok) throw new Error('获取学情数据失败');
    const diagJson = await diagRes.json();
    setStudents(diagJson.data.students);
    setCourseOverview(diagJson.data.courseOverview);
  }, [courseId, router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await loadData();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadData]);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      loadData().catch(() => {});
    }, 45000);
    return () => clearInterval(id);
  }, [loadData]);

  const derived = useMemo(() => {
    const withDiag = students.filter((s): s is Student & { diagnosis: DiagnosisData } => !!s.diagnosis);
    const n = withDiag.length;
    const mean = (pick: (d: DiagnosisData) => number) =>
      n === 0 ? 0 : Math.round(withDiag.reduce((a, s) => a + pick(s.diagnosis), 0) / n);

    const buckets = [0, 0, 0, 0, 0];
    const labels = ['<60', '60–69', '70–79', '80–89', '90–100'];
    for (const s of withDiag) {
      const sc = s.diagnosis.totalScore;
      if (sc < 60) buckets[0]++;
      else if (sc < 70) buckets[1]++;
      else if (sc < 80) buckets[2]++;
      else if (sc < 90) buckets[3]++;
      else buckets[4]++;
    }

    return {
      avgVideo: mean((d) => d.learningBehavior.videoLearning),
      avgMaterial: mean((d) => d.learningBehavior.materialLearning),
      avgDiscussion: mean((d) => d.learningBehavior.discussion),
      avgAttendance: mean((d) => d.learningBehavior.attendance),
      avgSubmission: mean((d) => d.assignment.submission_rate),
      buckets,
      bucketLabels: labels,
      withDiag,
    };
  }, [students]);

  const criticalAlerts = useMemo((): CriticalAlert[] => {
    const list: CriticalAlert[] = [];
    if (!courseOverview) return list;

    if (courseOverview.avgTotalScore < 60) {
      list.push({
        id: 'class-score',
        text: `班级平均综合得分低于合格线（当前 ${courseOverview.avgTotalScore}）`,
      });
    }
    if (courseOverview.classroomActivity.attendance < 50) {
      list.push({
        id: 'attendance',
        text: `班级签到覆盖率过低（${courseOverview.classroomActivity.attendance}%）`,
      });
    }
    if (courseOverview.video.completionRate < 35 && courseOverview.video.totalVideos > 0) {
      list.push({
        id: 'video',
        text: `章节视频学习覆盖严重不足（完成率 ${courseOverview.video.completionRate}%）`,
      });
    }
    if (courseOverview.assignment.completionRate < 35 && courseOverview.assignment.totalAssignments > 0) {
      list.push({
        id: 'assignment',
        text: `作业提交覆盖严重不足（提交率 ${courseOverview.assignment.completionRate}%）`,
      });
    }

    for (const s of students) {
      if (!s.diagnosis) continue;
      if (s.diagnosis.predictedGrade === '不合格' || s.diagnosis.totalScore < 60) {
        list.push({
          id: `stu-${s.id}`,
          text: `【高危个体】${s.name} 综合得分 ${s.diagnosis.totalScore}（预测 ${s.diagnosis.predictedGrade}）`,
        });
      }
    }

    return list;
  }, [courseOverview, students]);

  const topByScore = useMemo(() => {
    return [...students]
      .filter((s) => s.diagnosis)
      .sort((a, b) => (b.diagnosis!.totalScore || 0) - (a.diagnosis!.totalScore || 0))
      .slice(0, 8);
  }, [students]);

  useEffect(() => {
    chartsRef.current.forEach((c) => c.destroy());
    chartsRef.current = [];

    const chartFont = { family: 'ui-sans-serif, system-ui, sans-serif' };
    const gridColor = 'rgba(34, 211, 238, 0.12)';
    const tickColor = 'rgba(224, 242, 254, 0.65)';

    if (courseOverview && avgChartRef.current) {
      const avg = courseOverview.avgTotalScore;
      const c = new Chart(avgChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['已达', '未达'],
          datasets: [
            {
              data: [avg, Math.max(0, 100 - avg)],
              backgroundColor: ['rgba(34, 211, 238, 0.85)', 'rgba(15, 52, 96, 0.9)'],
              borderWidth: 0,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { color: tickColor, font: chartFont, boxWidth: 10 },
            },
            tooltip: {
              callbacks: {
                label: (ctx) => `${ctx.label}: ${ctx.raw}%`,
              },
            },
          },
          cutout: '72%',
        },
      });
      chartsRef.current.push(c);
    }

    if (distChartRef.current && derived.withDiag.length > 0) {
      const c = new Chart(distChartRef.current, {
        type: 'bar',
        data: {
          labels: derived.bucketLabels,
          datasets: [
            {
              label: '人数',
              data: derived.buckets,
              backgroundColor: [
                'rgba(56, 189, 248, 0.35)',
                'rgba(34, 211, 238, 0.45)',
                'rgba(6, 182, 212, 0.55)',
                'rgba(103, 232, 249, 0.5)',
                'rgba(165, 243, 252, 0.55)',
              ],
              borderColor: 'rgba(34, 211, 238, 0.5)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              ticks: { color: tickColor, font: chartFont },
              grid: { color: gridColor },
            },
            y: {
              beginAtZero: true,
              ticks: { color: tickColor, font: chartFont, stepSize: 1 },
              grid: { color: gridColor },
            },
          },
        },
      });
      chartsRef.current.push(c);
    }

    if (behaviorChartRef.current && derived.withDiag.length > 0) {
      const c = new Chart(behaviorChartRef.current, {
        type: 'bar',
        data: {
          labels: ['视频', '资料', '讨论', '签到', '作业提交'],
          datasets: [
            {
              label: '班级均值 %',
              data: [
                derived.avgVideo,
                derived.avgMaterial,
                derived.avgDiscussion,
                derived.avgAttendance,
                derived.avgSubmission,
              ],
              backgroundColor: 'rgba(6, 182, 212, 0.45)',
              borderColor: 'rgba(34, 211, 238, 0.8)',
              borderWidth: 1,
            },
          ],
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              max: 100,
              ticks: { color: tickColor, font: chartFont },
              grid: { color: gridColor },
            },
            y: {
              ticks: { color: tickColor, font: chartFont },
              grid: { display: false },
            },
          },
        },
      });
      chartsRef.current.push(c);
    }

    return () => {
      chartsRef.current.forEach((ch) => ch.destroy());
      chartsRef.current = [];
    };
  }, [courseOverview, derived]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#030712] text-cyan-200/90">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full border-2 border-cyan-400/30 border-t-cyan-400 animate-spin" />
          <span className="text-sm tracking-widest">学情数据载入中</span>
        </div>
      </div>
    );
  }

  if (error || !courseOverview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#030712] px-6">
        <p className="text-cyan-100/90">{error || '暂无学情数据'}</p>
        <button
          type="button"
          onClick={() => router.push(`/teacher/course/${courseId}/diagnosis`)}
          className="rounded border border-cyan-500/40 px-4 py-2 text-sm text-cyan-200 hover:bg-cyan-500/10"
        >
          返回学情诊断
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen text-cyan-50 overflow-auto"
      style={{
        background:
          'radial-gradient(ellipse 120% 80% at 50% -20%, rgba(8, 145, 178, 0.22), transparent 55%), linear-gradient(180deg, #030b1a 0%, #061426 40%, #051018 100%)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] bg-[linear-gradient(rgba(34,211,238,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.35)_1px,transparent_1px)] bg-[size:48px_48px]" />

      <div className="relative z-10 mx-auto max-w-[1920px] px-6 py-5 min-h-screen flex flex-col gap-4">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 pb-4">
          <div>
            <p className={LABEL}>Learning intelligence · Big screen</p>
            <h1 className="mt-1 text-2xl md:text-3xl font-light tracking-tight text-cyan-50">
              <span className="font-semibold text-cyan-200">{course?.course_name ?? '课程'}</span>
              <span className="mx-3 text-cyan-600/80">·</span>
              <span className="text-cyan-100/90">学情诊断大屏</span>
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className={LABEL}>Server time</p>
              <p className={`${VALUE} text-lg`}>{formatClock(now)}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/teacher/course/${courseId}/diagnosis`)}
              className="pointer-events-auto rounded-md border border-cyan-400/35 bg-cyan-950/40 px-4 py-2 text-sm text-cyan-100 hover:border-cyan-300/60 hover:bg-cyan-900/30 transition-colors"
            >
              退出大屏
            </button>
          </div>
        </header>

        {/* KPI strip */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {[
            { k: '平均综合得分', v: `${courseOverview.avgTotalScore}`, sub: '权重合成' },
            { k: '视频完成率', v: `${courseOverview.video.completionRate}%`, sub: `${courseOverview.video.viewedVideos}/${courseOverview.video.totalVideos}` },
            { k: '作业提交率', v: `${courseOverview.assignment.completionRate}%`, sub: `均分 ${courseOverview.assignment.avgScore}` },
            { k: '签到覆盖', v: `${courseOverview.classroomActivity.attendance}%`, sub: '班级维度' },
            { k: '讨论活跃', v: `${courseOverview.discussion.activeStudents}`, sub: `主题 ${courseOverview.discussion.totalTopics}` },
            { k: '在册诊断', v: `${students.filter((s) => s.diagnosis).length}/${students.length}`, sub: '有效个体' },
          ].map((item) => (
            <div key={item.k} className={`${PANEL} px-4 py-3`}>
              <p className={LABEL}>{item.k}</p>
              <p className={`mt-1 text-2xl ${VALUE}`}>{item.v}</p>
              <p className="mt-0.5 text-xs text-cyan-300/50 tabular-nums">{item.sub}</p>
            </div>
          ))}
        </section>

        <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-4 min-h-0">
          {/* Left: charts */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            <div className={`${PANEL} p-4 flex-1 min-h-[240px]`}>
              {panelTitle('班级平均综合得分')}
              <div className="h-[220px] flex items-center justify-center">
                <div className="w-full max-w-[280px] h-full relative">
                  <canvas ref={avgChartRef} />
                </div>
                <div className="hidden sm:flex flex-col gap-2 text-sm text-cyan-200/80 ml-4">
                  <p>
                    当前均值{' '}
                    <span className="text-cyan-300 font-semibold tabular-nums">{courseOverview.avgTotalScore}</span>
                  </p>
                  <p className="text-cyan-400/60 text-xs leading-relaxed">
                    数据与「课程整体学情」同源：音视频、资料、讨论、签到与作业按诊断 API 权重合成。
                  </p>
                </div>
              </div>
            </div>

            <div className={`${PANEL} p-4 flex-1 min-h-[260px]`}>
              {panelTitle('综合得分分布')}
              <div className="h-[240px]">
                {derived.withDiag.length === 0 ? (
                  <p className="text-cyan-400/50 text-sm py-8 text-center">暂无学生诊断数据</p>
                ) : (
                  <canvas ref={distChartRef} />
                )}
              </div>
            </div>
          </div>

          {/* Center: behavior + leaderboard */}
          <div className="xl:col-span-4 flex flex-col gap-4">
            <div className={`${PANEL} p-4 flex-1 min-h-[280px]`}>
              {panelTitle('学习行为 · 班级均值')}
              <div className="h-[260px]">
                {derived.withDiag.length === 0 ? (
                  <p className="text-cyan-400/50 text-sm py-8 text-center">暂无个体行为样本</p>
                ) : (
                  <canvas ref={behaviorChartRef} />
                )}
              </div>
            </div>

            <div className={`${PANEL} p-4 flex-1 min-h-[240px]`}>
              {panelTitle('综合得分 · Top 榜')}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-cyan-500/90 text-xs uppercase tracking-wider">
                      <th className="pb-2 font-medium">#</th>
                      <th className="pb-2 font-medium">姓名</th>
                      <th className="pb-2 font-medium">得分</th>
                      <th className="pb-2 font-medium">预测</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topByScore.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-cyan-500/50">
                          暂无排名数据
                        </td>
                      </tr>
                    ) : (
                      topByScore.map((s, i) => (
                        <tr key={s.id} className="border-t border-cyan-500/10 text-cyan-100/90">
                          <td className="py-2 tabular-nums text-cyan-400">{i + 1}</td>
                          <td className="py-2">{s.name}</td>
                          <td className="py-2 tabular-nums text-cyan-200">{s.diagnosis!.totalScore}</td>
                          <td className="py-2 text-cyan-300/90">{s.diagnosis!.predictedGrade}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: critical alerts + activity */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            <div
              className={`${PANEL} p-4 flex-1 border-red-500/20`}
              style={{
                boxShadow:
                  criticalAlerts.length > 0
                    ? '0 0 32px rgba(239, 68, 68, 0.12), inset 0 0 0 1px rgba(239, 68, 68, 0.15)'
                    : undefined,
              }}
            >
              {panelTitle('高危告警')}
              {criticalAlerts.length === 0 ? (
                <p className="text-cyan-400/55 text-sm py-6 leading-relaxed">
                  当前未触发高危规则：班级核心指标与个体综合得分均在监控阈值之上。
                </p>
              ) : (
                <ul className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                  {criticalAlerts.map((a) => (
                    <li
                      key={a.id}
                      className="rounded-md border border-red-500/35 bg-red-950/25 px-3 py-2 text-sm text-red-200/95 leading-snug"
                    >
                      {a.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${PANEL} p-4`}>
              {panelTitle('课堂参与 · 活跃榜')}
              <ul className="space-y-2">
                {courseOverview.classroomActivity.topStudents.length === 0 ? (
                  <li className="text-cyan-500/50 text-sm py-2">暂无排行数据</li>
                ) : (
                  courseOverview.classroomActivity.topStudents.map((t) => (
                    <li
                      key={t.rank}
                      className="flex items-center justify-between rounded border border-cyan-500/15 bg-cyan-950/20 px-3 py-2 text-sm"
                    >
                      <span className="text-cyan-200/90">
                        <span className="text-cyan-500 tabular-nums mr-2">{t.rank}</span>
                        {t.name}
                      </span>
                      <span className="text-cyan-400/80 tabular-nums">{t.score}</span>
                    </li>
                  ))
                )}
              </ul>
              <p className="mt-3 text-[11px] text-cyan-500/45 leading-relaxed">
                排行逻辑与学情诊断页「课堂活动」一致，由视频、讨论与签到等行为加权。
              </p>
            </div>
          </div>
        </div>

        <footer className="border-t border-cyan-500/15 pt-3 flex flex-wrap justify-between gap-2 text-[11px] text-cyan-600/70">
          <span>数据源：GET /api/teacher/courses/[courseId]/diagnosis · 约 45s 自动刷新</span>
          <span>配色说明：深蓝 / 青色系为默认视图；红色仅用于高危告警条目</span>
        </footer>
      </div>
    </div>
  );
}
