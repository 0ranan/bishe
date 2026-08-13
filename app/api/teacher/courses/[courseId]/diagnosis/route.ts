import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
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
  const authResult = await withAuth(request, 'teacher');
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { decoded, newToken } = authResult;
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

    if (newToken) {
      response.headers.set('x-access-token', newToken);
    }

    return response;
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
