// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * 处理获取教师课程请求
 * @param request 请求对象
 * @returns 课程列表响应
 */
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取 token
    const authorization = request.headers.get('authorization');
    const token = extractTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: '缺少访问令牌' },
        { status: 401 }
      );
    }

    // 验证 token
    const user = verifyAccessToken(token);
    if (!user || user.type !== 'teacher') {
      return NextResponse.json(
        { error: '无效的访问令牌' },
        { status: 401 }
      );
    }

    // 查询教师教授的课程
    const courses = await sql`
      SELECT DISTINCT co.course_id, co.course_name, co.credit
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      JOIN courses co ON cc.course_id = co.id
      WHERE t.teacher_id = ${user.userId}
      ORDER BY co.course_name
    `;

    // 返回课程列表
    return NextResponse.json({
      success: true,
      courses
    });
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
    // 从请求头获取 token
    const authorization = request.headers.get('authorization');
    const token = extractTokenFromHeader(authorization);

    if (!token) {
      return NextResponse.json(
        { error: '缺少访问令牌' },
        { status: 401 }
      );
    }

    // 验证 token
    const user = verifyAccessToken(token);
    if (!user || user.type !== 'teacher') {
      return NextResponse.json(
        { error: '无效的访问令牌' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body = await request.json();
    const { course_name, credit } = body;

    if (!course_name || !credit) {
      return NextResponse.json(
        { error: '课程名称和学分不能为空' },
        { status: 400 }
      );
    }

    // 生成课程ID
    const courseId = `CO${Date.now()}`;

    // 使用正确的事务处理方式
    const newCourse = await sql.begin(async (sql) => {
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
        SELECT c.id
        FROM teachers t
        JOIN teacher_class tc ON t.id = tc.teacher_id
        JOIN classes c ON tc.class_id = c.id
        WHERE t.teacher_id = ${user.userId}
      `;

      // 将新课程关联到教师的所有班级
      for (const cls of teacherClasses) {
        await sql`
          INSERT INTO class_course (class_id, course_id)
          VALUES (${cls.id}, ${courseIdValue})
        `;
      }

      return course[0];
    });

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '课程发布成功',
      course: newCourse
    });
  } catch (error) {
    console.error('发布课程失败:', error);
    return NextResponse.json(
      { error: '发布课程失败，请稍后重试' },
      { status: 500 }
    );
  }
}
