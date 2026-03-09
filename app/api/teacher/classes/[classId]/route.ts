// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

/**
 * 处理获取班级详情请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 班级详情响应
 */
export async function GET(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const classId = (await params).classId;

    // 验证 token
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 查询班级详情
    const classes = await sql`
      SELECT 
        c.class_id, 
        c.class_name, 
        c.grade,
        COUNT(sc.student_id) as student_count
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      LEFT JOIN student_class sc ON c.id = sc.class_id
      WHERE t.teacher_id = ${result.decoded.userId} AND c.class_id = ${classId}
      GROUP BY c.class_id, c.class_name, c.grade
    `;

    if (classes.length === 0) {
      return NextResponse.json(
        { error: '班级不存在或您无权访问' },
        { status: 404 }
      );
    }

    // 返回班级详情
    const response = NextResponse.json({
      success: true,
      class: classes[0]
    });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('获取班级详情失败:', error);
    return NextResponse.json(
      { error: '获取班级详情失败，请稍后重试' },
      { status: 500 }
    );
  }
}

/**
 * 处理更新班级信息请求
 * @param request 请求对象
 * @param params 路由参数
 * @returns 更新结果响应
 */
export async function PUT(request: NextRequest, { params }: { params: { classId: string } }) {
  try {
    const classId = (await params).classId;

    // 验证 token
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    // 解析请求体
    const body = await request.json();
    const { class_name, grade } = body;

    if (!class_name || !grade) {
      return NextResponse.json(
        { error: '班级名称和年级不能为空' },
        { status: 400 }
      );
    }

    // 检查教师是否有权限编辑该班级
    const teacherClasses = await sql`
      SELECT c.id
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      WHERE t.teacher_id = ${result.decoded.userId} AND c.class_id = ${classId}
    `;

    if (teacherClasses.length === 0) {
      return NextResponse.json(
        { error: '班级不存在或您无权编辑' },
        { status: 404 }
      );
    }

    // 更新班级信息
    await sql`
      UPDATE classes
      SET class_name = ${class_name}, grade = ${grade}
      WHERE class_id = ${classId}
    `;

    // 查询更新后的班级信息
    const updatedClass = await sql`
      SELECT 
        c.class_id, 
        c.class_name, 
        c.grade,
        COUNT(sc.student_id) as student_count
      FROM classes c
      LEFT JOIN student_class sc ON c.id = sc.class_id
      WHERE c.class_id = ${classId}
      GROUP BY c.class_id, c.class_name, c.grade
    `;

    // 返回更新后的班级信息
    const response = NextResponse.json({
      success: true,
      class: updatedClass[0]
    });

    // 如果有新的 token，添加到响应头
    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('更新班级信息失败:', error);
    return NextResponse.json(
      { error: '更新班级信息失败，请稍后重试' },
      { status: 500 }
    );
  }
}
