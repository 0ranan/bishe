// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';

/**
 * 处理获取教师课程请求
 * @param request 请求对象
 * @returns 课程列表响应
 */
export async function GET(request: NextRequest) {
  try {
    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 查询教师教授的课程
    const courses = await sql`
      SELECT DISTINCT co.course_id, co.course_name, co.credit
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      JOIN courses co ON cc.course_id = co.id
      WHERE t.teacher_id = ${result.decoded.userId}
      ORDER BY co.course_name
    `;

    // 返回课程列表
    const response = NextResponse.json({
      success: true,
      courses
    });

    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('获取课程失败:', error);
    return NextResponse.json(
      { error: '获取课程失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 处理创建新课程请求
 * @param request 请求对象
 * @returns 创建结果响应
 */
export async function POST(request: NextRequest) {
  try {
    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 解析请求体
    const body = await request.json();
    const { course_name, credit, class_ids } = body;

    if (!course_name || !credit) {
      return NextResponse.json(
        { error: '课程名称和学分不能为空' },
        { status: 400 }
      );
    }

    if (!class_ids || class_ids.length === 0) {
      return NextResponse.json(
        { error: '请至少选择一个班级' },
        { status: 400 }
      );
    }

    // 生成课程ID
    const courseId = `CO${Date.now()}`;

    // 使用正确的事务处理方式
    const newCourse = await sql.begin(async () => {
      // 创建新课程
      const course = await sql`
        INSERT INTO courses (course_id, course_name, credit)
        VALUES (${courseId}, ${course_name}, ${credit})
        RETURNING id, course_id, course_name, credit
      `;

      if (course.length === 0) {
        throw new Error('创建课程失败');
      }

      const courseIdValue = course[0].id;

      // 获取教师的所有班级
      const teacherClasses = await sql`
        SELECT c.id, c.class_id
        FROM teachers t
        JOIN teacher_class tc ON t.id = tc.teacher_id
        JOIN classes c ON tc.class_id = c.id
        WHERE t.teacher_id = ${result.decoded.userId}
      `;

      // 过滤出用户选择的班级
      const selectedClassIds = teacherClasses
        .filter((cls: { id: string; class_id: string }) => class_ids.includes(cls.class_id))
        .map((cls: { id: string; class_id: string }) => cls.id);

      if (selectedClassIds.length === 0) {
        throw new Error('未找到有效的班级');
      }

      // 将新课程关联到选择的班级
      for (const classId of selectedClassIds) {
        await sql`
          INSERT INTO class_course (class_id, course_id)
          VALUES (${classId}, ${courseIdValue})
        `;
      }

      return course[0];
    });

    // 返回成功响应
    const response = NextResponse.json({
      success: true,
      message: '课程发布成功',
      course: newCourse
    });

    // 如果有新的 token，添加到响应头
    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('发布课程失败:', error);
    return NextResponse.json(
      { error: '发布课程失败，请稍后重试' },
      { status: 500 }
    );
  }
}
