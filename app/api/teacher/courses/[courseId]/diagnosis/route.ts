import { NextRequest, NextResponse } from 'next/server';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import {
  assertTeacherOwnsCourse,
  CourseAccessError,
} from '@/lib/course-access';
import {
  getTeacherCourseDiagnosis,
  PredictionServiceError,
} from '@/lib/diagnosis';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  const authResult = withAuth(request, 'teacher');
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { decoded } = authResult;
  const courseCode = (await params).courseId;

  try {
    const courseUuid = await assertTeacherOwnsCourse(
      decoded.userId,
      courseCode
    );
    const { students, courseOverview } =
      await getTeacherCourseDiagnosis(courseUuid);

    const response = NextResponse.json({
      success: true,
      data: {
        students,
        courseOverview,
      },
    });

    return applyAuthToResponse(response, authResult);
  } catch (error) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof PredictionServiceError) {
      return NextResponse.json(
        { error: error.message },
        { status: 503 }
      );
    }
    console.error('获取学情数据失败:', error);
    return NextResponse.json(
      { error: '获取学情数据失败' },
      { status: 500 }
    );
  }
}
