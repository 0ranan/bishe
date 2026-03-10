import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { sql } from '@/db/client';

// 学习情况分析API
export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  // 验证token
  const authResult = await withAuth(request, 'student');
  
  // 检查验证结果
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error },
      { status: 401 }
    );
  }
  
  // 提取用户信息
  const { decoded } = authResult;
  const userId = decoded.id;
  const userType = decoded.type;
  
  // 确保是学生
  if (userType !== 'student') {
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

    // 执行查询
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
          WHERE vpd.student_id = ${userId} AND cv.course_id = ${courseId}
          GROUP BY vpd.student_id, cv.course_id
      )
      SELECT 
          ROUND(CAST((swd.watch_seconds::float / vtd.total_seconds) * 100 AS numeric), 2) as video_learning
      FROM student_watch_duration swd
      JOIN video_total_duration vtd ON swd.course_id = vtd.course_id
      WHERE swd.student_id = ${userId} AND swd.course_id = ${courseId}
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
          WHERE rd.student_id = ${userId} AND cr.course_id = ${courseId}
          GROUP BY rd.student_id, cr.course_id
      )
      SELECT 
          ROUND(CAST((sd.download_count::float / tr.total_count) * 100 AS numeric), 2) as material_learning
      FROM student_downloads sd
      JOIN total_resources tr ON sd.course_id = tr.course_id
      WHERE sd.student_id = ${userId} AND sd.course_id = ${courseId}
    `;

    // 3. 获取章节学习次数
    const chapterStudyCountResult = await sql`
      SELECT 
          COUNT(DISTINCT vpd.video_id) as chapter_study_count
      FROM video_play_duration vpd
      JOIN course_videos cv ON vpd.video_id = cv.id
      WHERE vpd.student_id = ${userId} AND cv.course_id = ${courseId}
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
          WHERE tc.student_id = ${userId} AND dt.course_id = ${courseId}
          GROUP BY tc.student_id, dt.course_id
      )
      SELECT 
          ROUND(CAST((sc.comment_count::float / tt.total_count) * 100 AS numeric), 2) as discussion
      FROM student_comments sc
      JOIN total_topics tt ON sc.course_id = tt.course_id
      WHERE sc.student_id = ${userId} AND sc.course_id = ${courseId}
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
          WHERE ar.student_id = ${userId} AND ar.course_id = ${courseId} AND ar.status = '已签到'
          GROUP BY ar.student_id, ar.course_id
      )
      SELECT 
          ROUND(CAST((sa.attendance_count::float / ta.total_count) * 100 AS numeric), 2) as attendance
      FROM student_attendances sa
      JOIN total_attendances ta ON sa.course_id = ta.course_id
      WHERE sa.student_id = ${userId} AND sa.course_id = ${courseId}
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
              COUNT(*) as submitted_count,
              AVG(score) as avg_score
          FROM assignments a
          JOIN assignment_topics at ON a.assignment_topic_id = at.id
          WHERE a.student_id = ${userId} AND at.course_id = ${courseId}
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

    // 预测成绩（这里可以调用gRPC服务，暂时使用简单的逻辑）
    const predictedGrade = predictGrade(totalScore);

    return NextResponse.json({
      success: true,
      data: {
        // 学习行为数据
        learningBehavior: {
          videoLearning,
          materialLearning,
          chapterStudyCount,
          discussion,
          attendance
        },
        // 作业情况
        assignment: assignmentData,
        // 综合得分
        totalScore: Math.round(totalScore),
        // 预测成绩
        predictedGrade,
        // 学习建议
        suggestions
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
