import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const currentTeacher = await sql`
      SELECT role FROM teachers WHERE teacher_id = ${result.decoded.userId}
    `;

    if (currentTeacher.length === 0 || currentTeacher[0].role !== 'admin') {
      return NextResponse.json(
        { error: '您没有权限执行此操作' },
        { status: 403 }
      );
    }

    const teachers = await sql`
      SELECT id, teacher_id, name, department, title, role, created_at
      FROM teachers
      ORDER BY created_at DESC
    `;

    const response = NextResponse.json({
      success: true,
      teachers
    });

    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('获取教师列表失败:', error);
    return NextResponse.json(
      { error: '获取教师列表失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const currentTeacher = await sql`
      SELECT role FROM teachers WHERE teacher_id = ${result.decoded.userId}
    `;

    if (currentTeacher.length === 0 || currentTeacher[0].role !== 'admin') {
      return NextResponse.json(
        { error: '您没有权限执行此操作' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { teacher_id, password, name, department, title, role } = body;

    if (!teacher_id || !password || !name) {
      return NextResponse.json(
        { error: '缺少必要的参数' },
        { status: 400 }
      );
    }

    const existingTeacher = await sql`
      SELECT id FROM teachers WHERE teacher_id = ${teacher_id}
    `;

    if (existingTeacher.length > 0) {
      return NextResponse.json(
        { error: '教师工号已存在' },
        { status: 400 }
      );
    }

    const newTeachers = await sql`
      INSERT INTO teachers (teacher_id, password, name, department, title, role)
      VALUES (${teacher_id}, ${password}, ${name}, ${department || null}, ${title || null}, ${role || 'teacher'})
      RETURNING id, teacher_id, name, department, title, role, created_at
    `;

    const response = NextResponse.json({
      success: true,
      teacher: newTeachers[0]
    });

    if (result.newToken) {
      response.headers.set('x-access-token', result.newToken);
    }

    return response;
  } catch (error) {
    console.error('创建教师失败:', error);
    return NextResponse.json(
      { error: '创建教师失败，请稍后重试' },
      { status: 500 }
    );
  }
}
