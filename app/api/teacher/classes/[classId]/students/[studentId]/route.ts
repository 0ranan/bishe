// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { verifyAccessToken, extractTokenFromHeader } from '@/lib/auth';

/**
 * 处理从班级删除学生请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 删除结果响应
 */
export async function DELETE(request: NextRequest, { params }: { params: { classId: string, studentId: string } }) {
  try {
    const classId = (await params).classId;
    const studentId = (await params).studentId;

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

    // 检查教师是否有权限管理该班级
    const teacherClasses = await sql`
      SELECT c.id
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      WHERE t.teacher_id = ${user.userId} AND c.class_id = ${classId}
    `;

    if (teacherClasses.length === 0) {
      return NextResponse.json(
        { error: '班级不存在或您无权管理' },
        { status: 404 }
      );
    }

    const classRecord = teacherClasses[0];

    // 检查学生是否在该班级
    const existingStudent = await sql`
      SELECT sc.*
      FROM student_class sc
      JOIN students s ON sc.student_id = s.id
      WHERE sc.class_id = ${classRecord.id} AND s.student_id = ${studentId}
    `;

    if (existingStudent.length === 0) {
      return NextResponse.json(
        { error: '学生不在该班级中' },
        { status: 404 }
      );
    }

    // 从班级中删除学生
    await sql`
      DELETE FROM student_class
      WHERE class_id = ${classRecord.id} AND student_id = (SELECT id FROM students WHERE student_id = ${studentId})
    `;

    // 返回成功响应
    return NextResponse.json({
      success: true,
      message: '学生删除成功'
    });
  } catch (error) {
    console.error('删除学生失败:', error);
    return NextResponse.json(
      { error: '删除学生失败，请稍后重试' },
      { status: 500 }
    );
  }
}
