import { sql } from '@/db/client';
import {
  predictGradeByFeatures,
  predictGradesByFeaturesBatch,
  type GradePrediction,
  type LearningFeatures,
} from '@/lib/grpc-prediction';

export { PredictionServiceError } from '@/lib/grpc-prediction';
export { CourseAccessError } from '@/lib/course-access';

export type AssignmentStats = {
  total_assignments: number;
  submitted_assignments: number;
  submission_rate: number;
  avg_score: number;
};

export type StudentDiagnosisData = {
  learningBehavior: LearningFeatures & { chapterStudyCount: number };
  assignment: AssignmentStats;
  totalScore: number;
  predictedGrade: string;
  confidence: number;
  modelVersion?: string;
  suggestions: string[];
};

export type TeacherStudentDiagnosis = {
  id: string;
  name: string;
  student_id: string;
  diagnosis: StudentDiagnosisData;
};

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function computeTotalScore(
  features: LearningFeatures,
  submissionRate: number
): number {
  return (
    toNumber(features.videoLearning) * 0.25 +
    toNumber(features.materialLearning) * 0.2 +
    toNumber(features.discussion) * 0.15 +
    toNumber(features.attendance) * 0.2 +
    toNumber(submissionRate) * 0.2
  );
}

export function generateSuggestions(data: {
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

function buildDiagnosisFromParts(
  features: LearningFeatures & { chapterStudyCount: number },
  assignment: AssignmentStats,
  prediction: GradePrediction
): StudentDiagnosisData {
  const totalScore = computeTotalScore(features, assignment.submission_rate);
  return {
    learningBehavior: {
      videoLearning: toNumber(features.videoLearning),
      materialLearning: toNumber(features.materialLearning),
      chapterStudyCount: toNumber(features.chapterStudyCount),
      discussion: toNumber(features.discussion),
      attendance: toNumber(features.attendance),
    },
    assignment: {
      total_assignments: toNumber(assignment.total_assignments),
      submitted_assignments: toNumber(assignment.submitted_assignments),
      submission_rate: toNumber(assignment.submission_rate),
      avg_score: toNumber(assignment.avg_score),
    },
    totalScore: Math.round(totalScore),
    predictedGrade: prediction.grade,
    confidence: prediction.confidence,
    modelVersion: prediction.modelVersion,
    suggestions: generateSuggestions({
      videoLearning: toNumber(features.videoLearning),
      materialLearning: toNumber(features.materialLearning),
      discussion: toNumber(features.discussion),
      attendance: toNumber(features.attendance),
      submissionRate: toNumber(assignment.submission_rate),
      avgScore: toNumber(assignment.avg_score),
    }),
  };
}

/**
 * 聚合单个学生在某课程下的学情特征（不含模型预测）。
 */
export async function collectStudentFeatures(
  courseUuid: string,
  studentUuid: string
): Promise<{
  features: LearningFeatures & { chapterStudyCount: number };
  assignment: AssignmentStats;
}> {
  const [
    videoLearningResult,
    materialLearningResult,
    chapterStudyCountResult,
    discussionResult,
    attendanceResult,
    assignmentResult,
  ] = await Promise.all([
    sql`
      WITH video_total_duration AS (
          SELECT
              cv.course_id,
              SUM(CASE WHEN cv.duration ~ '^[0-9]+:[0-9]+$'
                  THEN (SPLIT_PART(cv.duration, ':', 1)::int * 60) + SPLIT_PART(cv.duration, ':', 2)::int
                  ELSE 0 END) as total_seconds
          FROM course_videos cv
          WHERE cv.course_id = ${courseUuid}
          GROUP BY cv.course_id
      ),
      student_watch_duration AS (
          SELECT
              vpd.student_id,
              cv.course_id,
              SUM(vpd.duration) as watch_seconds
          FROM video_play_duration vpd
          JOIN course_videos cv ON vpd.video_id = cv.id
          WHERE vpd.student_id = ${studentUuid} AND cv.course_id = ${courseUuid}
          GROUP BY vpd.student_id, cv.course_id
      )
      SELECT
          ROUND(CAST((swd.watch_seconds::float / NULLIF(vtd.total_seconds, 0)) * 100 AS numeric), 2) as video_learning
      FROM student_watch_duration swd
      JOIN video_total_duration vtd ON swd.course_id = vtd.course_id
      WHERE swd.student_id = ${studentUuid} AND swd.course_id = ${courseUuid}
    `,
    sql`
      WITH total_resources AS (
          SELECT course_id, COUNT(*) as total_count
          FROM course_resources
          WHERE course_id = ${courseUuid}
          GROUP BY course_id
      ),
      student_downloads AS (
          SELECT rd.student_id, cr.course_id, COUNT(*) as download_count
          FROM resource_downloads rd
          JOIN course_resources cr ON rd.resource_id = cr.id
          WHERE rd.student_id = ${studentUuid} AND cr.course_id = ${courseUuid}
          GROUP BY rd.student_id, cr.course_id
      )
      SELECT
          ROUND(CAST((sd.download_count::float / NULLIF(tr.total_count, 0)) * 100 AS numeric), 2) as material_learning
      FROM student_downloads sd
      JOIN total_resources tr ON sd.course_id = tr.course_id
      WHERE sd.student_id = ${studentUuid} AND sd.course_id = ${courseUuid}
    `,
    sql`
      SELECT COUNT(DISTINCT vpd.video_id) as chapter_study_count
      FROM video_play_duration vpd
      JOIN course_videos cv ON vpd.video_id = cv.id
      WHERE vpd.student_id = ${studentUuid} AND cv.course_id = ${courseUuid}
    `,
    sql`
      WITH total_topics AS (
          SELECT course_id, COUNT(*) as total_count
          FROM discussion_topics
          WHERE course_id = ${courseUuid}
          GROUP BY course_id
      ),
      student_comments AS (
          SELECT tc.student_id, dt.course_id, COUNT(*) as comment_count
          FROM topic_comments tc
          JOIN discussion_topics dt ON tc.topic_id = dt.id
          WHERE tc.student_id = ${studentUuid} AND dt.course_id = ${courseUuid}
          GROUP BY tc.student_id, dt.course_id
      )
      SELECT
          ROUND(CAST((sc.comment_count::float / NULLIF(tt.total_count, 0)) * 100 AS numeric), 2) as discussion
      FROM student_comments sc
      JOIN total_topics tt ON sc.course_id = tt.course_id
      WHERE sc.student_id = ${studentUuid} AND sc.course_id = ${courseUuid}
    `,
    sql`
      WITH total_attendances AS (
          SELECT course_id, COUNT(*) as total_count
          FROM course_attendance
          WHERE course_id = ${courseUuid}
          GROUP BY course_id
      ),
      student_attendances AS (
          SELECT ar.student_id, ar.course_id, COUNT(*) as attendance_count
          FROM attendance_records ar
          WHERE ar.student_id = ${studentUuid} AND ar.course_id = ${courseUuid} AND ar.status = '已签到'
          GROUP BY ar.student_id, ar.course_id
      )
      SELECT
          ROUND(CAST((sa.attendance_count::float / NULLIF(ta.total_count, 0)) * 100 AS numeric), 2) as attendance
      FROM student_attendances sa
      JOIN total_attendances ta ON sa.course_id = ta.course_id
      WHERE sa.student_id = ${studentUuid} AND sa.course_id = ${courseUuid}
    `,
    sql`
      WITH total_assignments AS (
          SELECT COUNT(*) as total_count
          FROM assignment_topics
          WHERE course_id = ${courseUuid}
      ),
      submitted_assignments AS (
          SELECT
              COUNT(DISTINCT a.assignment_topic_id) as submitted_count,
              AVG(score) as avg_score
          FROM assignments a
          JOIN assignment_topics at ON a.assignment_topic_id = at.id
          WHERE a.student_id = ${studentUuid} AND at.course_id = ${courseUuid}
      )
      SELECT
          COALESCE(ta.total_count, 0) as total_assignments,
          COALESCE(sa.submitted_count, 0) as submitted_assignments,
          ROUND(CAST(COALESCE((sa.submitted_count::float / NULLIF(ta.total_count, 0)) * 100, 0) AS numeric), 2) as submission_rate,
          ROUND(CAST(COALESCE(sa.avg_score, 0) AS numeric), 2) as avg_score
      FROM total_assignments ta
      LEFT JOIN submitted_assignments sa ON true
    `,
  ]);

  const features = {
    videoLearning: toNumber(videoLearningResult[0]?.video_learning),
    materialLearning: toNumber(materialLearningResult[0]?.material_learning),
    chapterStudyCount: toNumber(chapterStudyCountResult[0]?.chapter_study_count),
    discussion: toNumber(discussionResult[0]?.discussion),
    attendance: toNumber(attendanceResult[0]?.attendance),
  };

  const assignmentRow = assignmentResult[0] || {};
  const assignment: AssignmentStats = {
    total_assignments: toNumber(assignmentRow.total_assignments),
    submitted_assignments: toNumber(assignmentRow.submitted_assignments),
    submission_rate: toNumber(assignmentRow.submission_rate),
    avg_score: toNumber(assignmentRow.avg_score),
  };

  return { features, assignment };
}

/**
 * 学生端学情诊断：聚合特征后必须调用 gRPC 模型预测。
 */
export async function getStudentDiagnosis(
  courseUuid: string,
  studentUuid: string
): Promise<StudentDiagnosisData> {
  const { features, assignment } = await collectStudentFeatures(
    courseUuid,
    studentUuid
  );
  const prediction = await predictGradeByFeatures(features);
  return buildDiagnosisFromParts(features, assignment, prediction);
}

type BatchRow = {
  id: string;
  name: string;
  student_id: string;
  video_learning: number;
  material_learning: number;
  chapter_study_count: number;
  discussion: number;
  attendance: number;
  total_assignments: number;
  submitted_assignments: number;
  submission_rate: number;
  avg_score: number;
};

/**
 * 一次批查询拉取课程内全部学生的学情特征，再批量 gRPC 预测。
 * 任一次预测失败则抛出 PredictionServiceError。
 */
export async function getTeacherCourseDiagnosis(courseUuid: string): Promise<{
  students: TeacherStudentDiagnosis[];
  courseOverview: Awaited<ReturnType<typeof getCourseOverview>>;
}> {
  const rows = (await sql`
    WITH course_students AS (
      SELECT DISTINCT s.id, s.name, s.student_id
      FROM students s
      JOIN student_class sc ON s.id = sc.student_id
      JOIN classes c ON sc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      WHERE cc.course_id = ${courseUuid}
    ),
    video_total AS (
      SELECT
        SUM(CASE WHEN cv.duration ~ '^[0-9]+:[0-9]+$'
          THEN (SPLIT_PART(cv.duration, ':', 1)::int * 60) + SPLIT_PART(cv.duration, ':', 2)::int
          ELSE 0 END) as total_seconds
      FROM course_videos cv
      WHERE cv.course_id = ${courseUuid}
    ),
    student_watch AS (
      SELECT vpd.student_id, SUM(vpd.duration) as watch_seconds
      FROM video_play_duration vpd
      JOIN course_videos cv ON vpd.video_id = cv.id
      WHERE cv.course_id = ${courseUuid}
      GROUP BY vpd.student_id
    ),
    resource_total AS (
      SELECT COUNT(*)::float as total_count
      FROM course_resources
      WHERE course_id = ${courseUuid}
    ),
    student_downloads AS (
      SELECT rd.student_id, COUNT(*)::float as download_count
      FROM resource_downloads rd
      JOIN course_resources cr ON rd.resource_id = cr.id
      WHERE cr.course_id = ${courseUuid}
      GROUP BY rd.student_id
    ),
    chapter_counts AS (
      SELECT vpd.student_id, COUNT(DISTINCT vpd.video_id) as chapter_study_count
      FROM video_play_duration vpd
      JOIN course_videos cv ON vpd.video_id = cv.id
      WHERE cv.course_id = ${courseUuid}
      GROUP BY vpd.student_id
    ),
    topic_total AS (
      SELECT COUNT(*)::float as total_count
      FROM discussion_topics
      WHERE course_id = ${courseUuid}
    ),
    student_comments AS (
      SELECT tc.student_id, COUNT(*)::float as comment_count
      FROM topic_comments tc
      JOIN discussion_topics dt ON tc.topic_id = dt.id
      WHERE dt.course_id = ${courseUuid}
      GROUP BY tc.student_id
    ),
    attendance_total AS (
      SELECT COUNT(*)::float as total_count
      FROM course_attendance
      WHERE course_id = ${courseUuid}
    ),
    student_attendance AS (
      SELECT ar.student_id, COUNT(*)::float as attendance_count
      FROM attendance_records ar
      WHERE ar.course_id = ${courseUuid} AND ar.status = '已签到'
      GROUP BY ar.student_id
    ),
    assignment_total AS (
      SELECT COUNT(*)::float as total_count
      FROM assignment_topics
      WHERE course_id = ${courseUuid}
    ),
    student_assignments AS (
      SELECT
        a.student_id,
        COUNT(DISTINCT a.assignment_topic_id)::float as submitted_count,
        AVG(a.score) as avg_score
      FROM assignments a
      JOIN assignment_topics at ON a.assignment_topic_id = at.id
      WHERE at.course_id = ${courseUuid}
      GROUP BY a.student_id
    )
    SELECT
      cs.id,
      cs.name,
      cs.student_id,
      ROUND(CAST(COALESCE((sw.watch_seconds::float / NULLIF(vt.total_seconds, 0)) * 100, 0) AS numeric), 2) as video_learning,
      ROUND(CAST(COALESCE((sd.download_count / NULLIF(rt.total_count, 0)) * 100, 0) AS numeric), 2) as material_learning,
      COALESCE(cc.chapter_study_count, 0) as chapter_study_count,
      ROUND(CAST(COALESCE((sc.comment_count / NULLIF(tt.total_count, 0)) * 100, 0) AS numeric), 2) as discussion,
      ROUND(CAST(COALESCE((sa.attendance_count / NULLIF(atotal.total_count, 0)) * 100, 0) AS numeric), 2) as attendance,
      COALESCE(asgt.total_count, 0) as total_assignments,
      COALESCE(sass.submitted_count, 0) as submitted_assignments,
      ROUND(CAST(COALESCE((sass.submitted_count / NULLIF(asgt.total_count, 0)) * 100, 0) AS numeric), 2) as submission_rate,
      ROUND(CAST(COALESCE(sass.avg_score, 0) AS numeric), 2) as avg_score
    FROM course_students cs
    CROSS JOIN video_total vt
    CROSS JOIN resource_total rt
    CROSS JOIN topic_total tt
    CROSS JOIN attendance_total atotal
    CROSS JOIN assignment_total asgt
    LEFT JOIN student_watch sw ON cs.id = sw.student_id
    LEFT JOIN student_downloads sd ON cs.id = sd.student_id
    LEFT JOIN chapter_counts cc ON cs.id = cc.student_id
    LEFT JOIN student_comments sc ON cs.id = sc.student_id
    LEFT JOIN student_attendance sa ON cs.id = sa.student_id
    LEFT JOIN student_assignments sass ON cs.id = sass.student_id
    ORDER BY cs.name
  `) as BatchRow[];

  const featuresList: LearningFeatures[] = rows.map((row) => ({
    videoLearning: toNumber(row.video_learning),
    materialLearning: toNumber(row.material_learning),
    chapterStudyCount: toNumber(row.chapter_study_count),
    discussion: toNumber(row.discussion),
    attendance: toNumber(row.attendance),
  }));

  const predictions =
    featuresList.length === 0
      ? []
      : await predictGradesByFeaturesBatch(featuresList);

  const students: TeacherStudentDiagnosis[] = rows.map((row, i) => {
    const features = {
      ...featuresList[i],
      chapterStudyCount: featuresList[i].chapterStudyCount,
    };
    const assignment: AssignmentStats = {
      total_assignments: toNumber(row.total_assignments),
      submitted_assignments: toNumber(row.submitted_assignments),
      submission_rate: toNumber(row.submission_rate),
      avg_score: toNumber(row.avg_score),
    };
    return {
      id: row.id,
      name: row.name,
      student_id: row.student_id,
      diagnosis: buildDiagnosisFromParts(features, assignment, predictions[i]),
    };
  });

  const courseOverview = await getCourseOverview(courseUuid, students);
  return { students, courseOverview };
}

export async function getCourseOverview(
  courseId: string,
  studentsWithDiagnosis: Array<{ diagnosis: { totalScore: number } | null }>
) {
  const [
    discussionResult,
    attendanceResult,
    assignmentResult,
    videoResult,
    topStudentsResult,
  ] = await Promise.all([
    sql`
      SELECT
        COUNT(DISTINCT dt.id) as total_topics,
        COUNT(DISTINCT tc.id) as total_comments,
        COUNT(DISTINCT tc.student_id) as active_students
      FROM discussion_topics dt
      LEFT JOIN topic_comments tc ON dt.id = tc.topic_id
      WHERE dt.course_id = ${courseId}
    `,
    sql`
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
    `,
    sql`
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
    `,
    sql`
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
      SELECT tv.total_count, vv.viewed_count
      FROM total_videos tv
      CROSS JOIN video_views vv
    `,
    sql`
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
    `,
  ]);

  const discussion = discussionResult[0] || {
    total_topics: 0,
    total_comments: 0,
    active_students: 0,
  };
  const attendance = attendanceResult[0] || {
    total_attendances: 0,
    total_students: 0,
    attended_students: 0,
  };
  const assignment = assignmentResult[0] || {
    total_count: 0,
    submitted_count: 0,
    avg_score: 0,
  };
  const video = videoResult[0] || { total_count: 0, viewed_count: 0 };
  const topStudents = topStudentsResult || [];

  const attendanceRate =
    attendance.total_students > 0
      ? Math.round(
          (attendance.attended_students / attendance.total_students) * 100
        )
      : 0;

  const videoCompletionRate =
    video.total_count > 0
      ? Math.round((video.viewed_count / video.total_count) * 100)
      : 0;

  const assignmentCompletionRate =
    assignment.total_count > 0 && attendance.total_students > 0
      ? Math.round(
          (assignment.submitted_count /
            (assignment.total_count * attendance.total_students)) *
            100
        )
      : 0;

  const studentsWithScores = studentsWithDiagnosis.filter(
    (s) => s.diagnosis !== null
  );
  const avgTotalScore =
    studentsWithScores.length > 0
      ? Math.round(
          studentsWithScores.reduce(
            (sum, s) => sum + (s.diagnosis?.totalScore ?? 0),
            0
          ) / studentsWithScores.length
        )
      : 0;

  return {
    discussion: {
      totalTopics: Number(discussion.total_topics),
      totalComments: Number(discussion.total_comments),
      activeStudents: Number(discussion.active_students),
    },
    classroomActivity: {
      attendance: attendanceRate,
      participation: Math.min(
        Math.round(
          (discussion.active_students /
            Math.max(attendance.total_students, 1)) *
            100
        ),
        100
      ),
      topStudents: topStudents.map((student, index) => ({
        name: student.name,
        score: 80 + index * 5,
        rank: index + 1,
      })),
    },
    assignment: {
      totalAssignments: Number(assignment.total_count),
      submittedAssignments: Number(assignment.submitted_count),
      completionRate: assignmentCompletionRate,
      avgScore: Number(assignment.avg_score) || 0,
    },
    video: {
      totalVideos: Number(video.total_count),
      viewedVideos: Number(video.viewed_count),
      completionRate: videoCompletionRate,
    },
    avgTotalScore,
  };
}
