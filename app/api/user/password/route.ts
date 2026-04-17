// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth } from '@/lib/middleware';
import { verifyPassword, hashPassword } from '@/lib/auth';
import { z } from 'zod';

// 定义修改密码请求的验证 schema
const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, '旧密码不能为空'),
  newPassword: z.string().min(6, '新密码至少6位')
});

/**
 * 修改密码
 * @param request 请求
 * @returns 修改密码响应
 */
export async function PUT(request: NextRequest) {
  try {
    // 验证 token（复用工具：withAuth）
    const authResult = await withAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { decoded } = authResult;

    // 解析请求体
    const body = await request.json();

    // 验证请求参数（复用工具：zod）
    const validationResult = changePasswordSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: '参数验证失败', 
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const { oldPassword, newPassword } = validationResult.data;

    let currentPassword: string | null = null;

    // 获取当前用户的密码
    if (decoded.type === 'student') {
      const students = await sql`
        SELECT password FROM students WHERE id = ${decoded.id} LIMIT 1
      `;
      if (students.length === 0) {
        return NextResponse.json(
          { error: '学生信息不存在' },
          { status: 404 }
        );
      }
      currentPassword = students[0].password;
    } else if (decoded.type === 'teacher') {
      const teachers = await sql`
        SELECT password FROM teachers WHERE id = ${decoded.id} LIMIT 1
      `;
      if (teachers.length === 0) {
        return NextResponse.json(
          { error: '教师信息不存在' },
          { status: 404 }
        );
      }
      currentPassword = teachers[0].password;
    } else {
      return NextResponse.json(
        { error: '无效的用户类型' },
        { status: 400 }
      );
    }

    // 验证旧密码（复用工具：verifyPassword）
    let passwordValid = false;
    try {
      passwordValid = await verifyPassword(oldPassword, currentPassword!);
    } catch {
      // 如果 bcrypt 验证失败，尝试直接比较（兼容现有明文密码）
      passwordValid = oldPassword === currentPassword;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: '旧密码错误' },
        { status: 401 }
      );
    }

    // 加密新密码（复用工具：hashPassword）
    const hashedNewPassword = await hashPassword(newPassword);

    // 更新数据库中的密码
    if (decoded.type === 'student') {
      await sql`
        UPDATE students 
        SET password = ${hashedNewPassword}
        WHERE id = ${decoded.id}
      `;
    } else {
      await sql`
        UPDATE teachers 
        SET password = ${hashedNewPassword}
        WHERE id = ${decoded.id}
      `;
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
      ...(authResult.newToken && { newToken: authResult.newToken })
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    return NextResponse.json(
      { error: '修改密码失败，请稍后重试' },
      { status: 500 }
    );
  }
}
