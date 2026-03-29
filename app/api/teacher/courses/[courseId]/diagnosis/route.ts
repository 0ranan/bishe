import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

// 学习情况分析API（教师端）
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  // 验证token
  const authResult = await withAuth(request, 'teacher');
  
  // 检查验证结果
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }
  
  // 提取用户信息
  const { decoded } = authResult;
  const userType = decoded.type;
  
  // 确保是教师
  if (userType !== 'teacher') {
    return NextResponse.json(
      { error: '权限不足' },
      { status: 403 }
    );
  }

  // 在Next.js 15中，params需要await
  const courseCode = (await params).courseId;

  try {
    // 先获取课程的UUID
    const courseRows = await sql`
      SELECT id FROM courses WHERE course_id = ${courseCode}
    `;

    // 检查查询结果
    if (!Array.isArray(courseRows)) {
      console.error('课程查询结果格式错误:', courseRows);
      return NextResponse.json(
        { error: '获取课程信息失败' },
        { status: 500 }
      );
    }

    if (courseRows.length === 0) {
      console.log('课程不存在:', courseCode);
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }

    const courseId = courseRows[0].id;

    // 获取课程的所有学生
    const students = await sql`
      SELECT s.id, s.name, s.student_id as student_id
      FROM students s
      JOIN student_class sc ON s.id = sc.student_id
      JOIN classes c ON sc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      WHERE cc.course_id = ${courseId}
      ORDER BY s.name
    `;

    // 为每个学生获取学情数据
    const studentsWithDiagnosis = await Promise.all(
      students.map(async (student) => {
        try {
          // 1. 获取音视频学习完成率
          const videoLearningResult = await sql`
            WITH video_total_duration AS (
                SELECT 
                    cv.course_id,
                    SUM(CASE WHEN cv.duration ~ '^[0-9]+:[0-9]+$' 
                        THEN (SPLIT_PART(cv.duration, ':', 1)::int * 60) + SPLIT_PART(cv.duration, ':', 2)::int
                        ELSE 0 END) as total_seconds
                FROM course_videos cv
                WHERE cv.course_id = ${courseId}
                GROUP BY cv.course_id
            ),
            student_watch_duration AS (
                SELECT 
                    vpd.student_id,
                    cv.course_id,
                    SUM(vpd.duration) as watch_seconds
                FROM video_play_duration vpd
                JOIN course_videos cv ON vpd.video_id = cv.id
                WHERE vpd.student_id = ${student.id} AND cv.course_id = ${courseId}
                GROUP BY vpd.student_id, cv.course_id
            )
            SELECT 
                ROUND(CAST((swd.watch_seconds::float / vtd.total_seconds) * 100 AS numeric), 2) as video_learning
            FROM student_watch_duration swd
            JOIN video_total_duration vtd ON swd.course_id = vtd.course_id
            WHERE swd.student_id = ${student.id} AND swd.course_id = ${courseId}
          `;

          // 2. 获取资料自主学习完成率
          const materialLearningResult = await sql`
            WITH total_resources AS (
                SELECT 
                    course_id,
                    COUNT(*) as total_count
                FROM course_resources
                WHERE course_id = ${courseId}
                GROUP BY course_id
            ),
            student_downloads AS (
                SELECT 
                    rd.student_id,
                    cr.course_id,
                    COUNT(*) as download_count
                FROM resource_downloads rd
                JOIN course_resources cr ON rd.resource_id = cr.id
                WHERE rd.student_id = ${student.id} AND cr.course_id = ${courseId}
                GROUP BY rd.student_id, cr.course_id
            )
            SELECT 
                ROUND(CAST((sd.download_count::float / tr.total_count) * 100 AS numeric), 2) as material_learning
            FROM student_downloads sd
            JOIN total_resources tr ON sd.course_id = tr.course_id
            WHERE sd.student_id = ${student.id} AND sd.course_id = ${courseId}
          `;

          // 3. 获取章节学习次数
          const chapterStudyCountResult = await sql`
            SELECT 
                COUNT(DISTINCT vpd.video_id) as chapter_study_count
            FROM video_play_duration vpd
            JOIN course_videos cv ON vpd.video_id = cv.id
            WHERE vpd.student_id = ${student.id} AND cv.course_id = ${courseId}
            GROUP BY vpd.student_id, cv.course_id
          `;

          // 4. 获取讨论参与度
          const discussionResult = await sql`
            WITH total_topics AS (
                SELECT 
                    course_id,
                    COUNT(*) as total_count
                FROM discussion_topics
                WHERE course_id = ${courseId}
                GROUP BY course_id
            ),
            student_comments AS (
                SELECT 
                    tc.student_id,
                    dt.course_id,
                    COUNT(*) as comment_count
                FROM topic_comments tc
                JOIN discussion_topics dt ON tc.topic_id = dt.id
                WHERE tc.student_id = ${student.id} AND dt.course_id = ${courseId}
                GROUP BY tc.student_id, dt.course_id
            )
            SELECT 
                ROUND(CAST((sc.comment_count::float / tt.total_count) * 100 AS numeric), 2) as discussion
            FROM student_comments sc
            JOIN total_topics tt ON sc.course_id = tt.course_id
            WHERE sc.student_id = ${student.id} AND sc.course_id = ${courseId}
          `;

          // 5. 获取签到完成率
          const attendanceResult = await sql`
            WITH total_attendances AS (
                SELECT 
                    course_id,
                    COUNT(*) as total_count
                FROM course_attendance
                WHERE course_id = ${courseId}
                GROUP BY course_id
            ),
            student_attendances AS (
                SELECT 
                    ar.student_id,
                    ar.course_id,
                    COUNT(*) as attendance_count
                FROM attendance_records ar
                WHERE ar.student_id = ${student.id} AND ar.course_id = ${courseId} AND ar.status = '已签到'
                GROUP BY ar.student_id, ar.course_id
            )
            SELECT 
                ROUND(CAST((sa.attendance_count::float / ta.total_count) * 100 AS numeric), 2) as attendance
            FROM student_attendances sa
            JOIN total_attendances ta ON sa.course_id = ta.course_id
            WHERE sa.student_id = ${student.id} AND sa.course_id = ${courseId}
          `;

          // 6. 获取作业情况
          const assignmentResult = await sql`
            WITH total_assignments AS (
                SELECT 
                    COUNT(*) as total_count
                FROM assignment_topics
                WHERE course_id = ${courseId}
            ),
            submitted_assignments AS (
                SELECT 
                    COUNT(DISTINCT a.assignment_topic_id) as submitted_count,
                    AVG(score) as avg_score
                FROM assignments a
                JOIN assignment_topics at ON a.assignment_topic_id = at.id
                WHERE a.student_id = ${student.id} AND at.course_id = ${courseId}
            )
            SELECT 
                COALESCE(ta.total_count, 0) as total_assignments,
                COALESCE(sa.submitted_count, 0) as submitted_assignments,
                ROUND(CAST(COALESCE((sa.submitted_count::float / ta.total_count) * 100, 0) AS numeric), 2) as submission_rate,
                ROUND(CAST(COALESCE(sa.avg_score, 0) AS numeric), 2) as avg_score
            FROM total_assignments ta
            LEFT JOIN submitted_assignments sa ON true
          `;

          // 提取结果
          const videoLearning = videoLearningResult[0]?.video_learning || 0;
          const materialLearning = materialLearningResult[0]?.material_learning || 0;
          const chapterStudyCount = chapterStudyCountResult[0]?.chapter_study_count || 0;
          const discussion = discussionResult[0]?.discussion || 0;
          const attendance = attendanceResult[0]?.attendance || 0;
          const assignmentData = assignmentResult[0] || {
            total_assignments: 0,
            submitted_assignments: 0,
            submission_rate: 0,
            avg_score: 0
          };

          // 计算综合得分
          const totalScore = (
            videoLearning * 0.25 +
            materialLearning * 0.2 +
            discussion * 0.15 +
            attendance * 0.2 +
            assignmentData.submission_rate * 0.2
          );

          // 生成学习建议
          const suggestions = generateSuggestions({
            videoLearning,
            materialLearning,
            discussion,
            attendance,
            submissionRate: assignmentData.submission_rate,
            avgScore: assignmentData.avg_score
          });

          // 预测成绩
          const predictedGrade = predictGrade(totalScore);

          return {
            id: student.id,
            name: student.name,
            student_id: student.student_id,
            diagnosis: {
              learningBehavior: {
                videoLearning,
                materialLearning,
                chapterStudyCount,
                discussion,
                attendance
              },
              assignment: assignmentData,
              totalScore: Math.round(totalScore),
              predictedGrade,
              suggestions
            }
          };
        } catch (error) {
          console.error(`获取学生 ${student.name} 学情数据失败:`, error);
          return {
            id: student.id,
            name: student.name,
            student_id: student.student_id,
            diagnosis: null,
            error: '获取学情数据失败'
          };
        }
      })
    );

    // 获取课程整体学情数据
    const courseOverview = await getCourseOverview(courseId, studentsWithDiagnosis);

    return NextResponse.json({
      success: true,
      data: {
        students: studentsWithDiagnosis,
        courseOverview
      }
    });
  } catch (error) {
    console.error('获取学情数据失败:', error);
    return NextResponse.json(
      { error: '获取学情数据失败' },
      { status: 500 }
    );
  }
}

// 生成学习建议
function generateSuggestions(data: {
  videoLearning: number;
  materialLearning: number;
  discussion: number;
  attendance: number;
  submissionRate: number;
  avgScore: number;
}): string[] {
  const suggestions: string[] = [];

  if (data.videoLearning < 60) {
    suggestions.push('建议增加视频学习时间，提高视频完成率');
  }

  if (data.materialLearning < 60) {
    suggestions.push('建议多下载和学习课程资料');
  }

  if (data.discussion < 50) {
    suggestions.push('建议积极参与课程讨论，提高互动性');
  }

  if (data.attendance < 80) {
    suggestions.push('建议按时签到，提高出勤率');
  }

  if (data.submissionRate < 80) {
    suggestions.push('建议按时提交作业，提高作业完成率');
  }

  if (data.avgScore < 60) {
    suggestions.push('建议加强作业练习，提高作业质量');
  }

  if (suggestions.length === 0) {
    suggestions.push('学习情况良好，继续保持！');
  }

  return suggestions;
}

// 预测成绩
function predictGrade(score: number): string {
  if (score >= 90) {
    return '优';
  } else if (score >= 80) {
    return '良';
  } else if (score >= 70) {
    return '中';
  } else if (score >= 60) {
    return '合格';
  } else {
    return '不合格';
  }
}

// 获取课程整体学情数据
async function getCourseOverview(courseId: string, studentsWithDiagnosis: Array<{ diagnosis: { totalScore: number } | null }>) {
  // 1. 获取讨论数据
  const discussionResult = await sql`
    SELECT 
      COUNT(DISTINCT dt.id) as total_topics,
      COUNT(DISTINCT tc.id) as total_comments,
      COUNT(DISTINCT tc.student_id) as active_students
    FROM discussion_topics dt
    LEFT JOIN topic_comments tc ON dt.id = tc.topic_id
    WHERE dt.course_id = ${courseId}
  `;

  // 2. 获取签到数据
  const attendanceResult = await sql`
    WITH total_attendances AS (
      SELECT COUNT(*) as total_count
      FROM course_attendance
      WHERE course_id = ${courseId}
    ),
    student_count AS (
      SELECT COUNT(DISTINCT s.id) as total_students
      FROM students s
      JOIN student_class sc ON s.id = sc.student_id
      JOIN classes c ON sc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      WHERE cc.course_id = ${courseId}
    ),
    attendance_records_count AS (
      SELECT COUNT(DISTINCT student_id) as attended_students
      FROM attendance_records
      WHERE course_id = ${courseId}
    )
    SELECT 
      ta.total_count as total_attendances,
      sc.total_students,
      arc.attended_students
    FROM total_attendances ta
    CROSS JOIN student_count sc
    CROSS JOIN attendance_records_count arc
  `;

  // 3. 获取作业数据
  const assignmentResult = await sql`
    WITH total_assignments AS (
      SELECT COUNT(*) as total_count
      FROM assignment_topics
      WHERE course_id = ${courseId}
    ),
    submitted_assignments AS (
      SELECT COUNT(*) as submitted_count
      FROM assignments a
      JOIN assignment_topics at ON a.assignment_topic_id = at.id
      WHERE at.course_id = ${courseId}
    ),
    avg_scores AS (
      SELECT AVG(score) as avg_score
      FROM assignments a
      JOIN assignment_topics at ON a.assignment_topic_id = at.id
      WHERE at.course_id = ${courseId} AND a.score IS NOT NULL
    )
    SELECT 
      ta.total_count,
      sa.submitted_count,
      avgs.avg_score
    FROM total_assignments ta
    CROSS JOIN submitted_assignments sa
    CROSS JOIN avg_scores avgs
  `;

  // 4. 获取视频学习数据
  const videoResult = await sql`
    WITH total_videos AS (
      SELECT COUNT(*) as total_count
      FROM course_videos
      WHERE course_id = ${courseId}
    ),
    video_views AS (
      SELECT COUNT(DISTINCT vpd.video_id) as viewed_count
      FROM video_play_duration vpd
      JOIN course_videos cv ON vpd.video_id = cv.id
      WHERE cv.course_id = ${courseId}
    )
    SELECT 
      tv.total_count,
      vv.viewed_count
    FROM total_videos tv
    CROSS JOIN video_views vv
  `;

  // 5. 获取学习积极的学生（按综合表现）
  const topStudentsResult = await sql`
    SELECT 
      s.name,
      COUNT(DISTINCT vpd.video_id) as video_count,
      COUNT(DISTINCT tc.id) as comment_count,
      COUNT(DISTINCT ar.id) as attendance_count
    FROM students s
    JOIN student_class sc ON s.id = sc.student_id
    JOIN classes c ON sc.class_id = c.id
    JOIN class_course cc ON c.id = cc.class_id
    LEFT JOIN video_play_duration vpd ON s.id = vpd.student_id
    LEFT JOIN course_videos cv ON vpd.video_id = cv.id AND cv.course_id = ${courseId}
    LEFT JOIN topic_comments tc ON s.id = tc.student_id
    LEFT JOIN discussion_topics dt ON tc.topic_id = dt.id AND dt.course_id = ${courseId}
    LEFT JOIN attendance_records ar ON s.id = ar.student_id AND ar.course_id = ${courseId}
    WHERE cc.course_id = ${courseId}
    GROUP BY s.id, s.name
    ORDER BY (COUNT(DISTINCT vpd.video_id) + COUNT(DISTINCT tc.id) * 2 + COUNT(DISTINCT ar.id) * 3) DESC
    LIMIT 3
  `;

  const discussion = discussionResult[0] || { total_topics: 0, total_comments: 0, active_students: 0 };
  const attendance = attendanceResult[0] || { total_attendances: 0, total_students: 0, attended_students: 0 };
  const assignment = assignmentResult[0] || { total_count: 0, submitted_count: 0, avg_score: 0 };
  const video = videoResult[0] || { total_count: 0, viewed_count: 0 };
  const topStudents = topStudentsResult || [];

  // 计算各项百分比
  const attendanceRate = attendance.total_students > 0 
    ? Math.round((attendance.attended_students / attendance.total_students) * 100) 
    : 0;
  
  const videoCompletionRate = video.total_count > 0 
    ? Math.round((video.viewed_count / video.total_count) * 100) 
    : 0;

  const assignmentCompletionRate = assignment.total_count > 0 && attendance.total_students > 0
    ? Math.round((assignment.submitted_count / (assignment.total_count * attendance.total_students)) * 100)
    : 0;

  // 计算平均综合得分
  const studentsWithScores = studentsWithDiagnosis.filter(s => s.diagnosis !== null);
  const avgTotalScore = studentsWithScores.length > 0
    ? Math.round(studentsWithScores.reduce((sum, s) => sum + s.diagnosis.totalScore, 0) / studentsWithScores.length)
    : 0;

  return {
    discussion: {
      totalTopics: Number(discussion.total_topics),
      totalComments: Number(discussion.total_comments),
      activeStudents: Number(discussion.active_students)
    },
    classroomActivity: {
      attendance: attendanceRate,
      participation: Math.min(Math.round((discussion.active_students / Math.max(attendance.total_students, 1)) * 100), 100),
      topStudents: topStudents.map((student, index) => ({
        name: student.name,
        score: 80 + index * 5,
        rank: index + 1
      }))
    },
    assignment: {
      totalAssignments: Number(assignment.total_count),
      submittedAssignments: Number(assignment.submitted_count),
      completionRate: assignmentCompletionRate,
      avgScore: Number(assignment.avg_score) || 0
    },
    video: {
      totalVideos: Number(video.total_count),
      viewedVideos: Number(video.viewed_count),
      completionRate: videoCompletionRate
    },
    avgTotalScore
  };
}
