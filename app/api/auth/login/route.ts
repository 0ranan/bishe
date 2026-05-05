// 导入必要的库和工具
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { generateAccessToken, generateRefreshToken, UserType, verifyPassword } from '@/lib/auth';

// 定义登录请求体接口
interface LoginRequest {
  type: UserType;
  id: string;
  password: string;
}

/**
 * 处理登录请求
 * @param request 登录请求
 * @returns 登录响应
 */
export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: LoginRequest = await request.json();
    const { type, id, password } = body;

    // 验证请求参数
    if (!type || !id || !password) {
      return NextResponse.json(
        { error: '缺少必要的登录参数' },
        { status: 400 }
      );
    }

    let user: { id: string; student_id?: string; teacher_id?: string; name: string; password: string; role?: string } | null = null;

    // 根据用户类型查询数据库
    if (type === 'student') {
      // 查询学生信息
      const students = await sql`
        SELECT id, student_id, name, password FROM students
        WHERE student_id = ${id}
      `;

      // 检查学生是否存在
      if (students.length === 0) {
        return NextResponse.json(
          { error: '学生账号不存在' },
          { status: 401 }
        );
      }

      user = students[0];
    } else if (type === 'teacher') {
      // 查询教师信息
      const teachers = await sql`
        SELECT id, teacher_id, name, password, role FROM teachers
        WHERE teacher_id = ${id}
      `;

      // 检查教师是否存在
      if (teachers.length === 0) {
        return NextResponse.json(
          { error: '教师账号不存在' },
          { status: 401 }
        );
      }

      user = teachers[0];
    } else {
      return NextResponse.json(
        { error: '无效的用户类型' },
        { status: 400 }
      );
    }

    // 验证密码（复用工具：verifyPassword）
    let passwordValid = false;
    
    // 判断密码是否为 bcrypt 哈希格式（bcrypt 哈希以 $2b$、$2a$ 或 $2y$ 开头）
    const isBcryptHash = user.password.startsWith('$2b$') || 
                         user.password.startsWith('$2a$') || 
                         user.password.startsWith('$2y$');
    
    if (isBcryptHash) {
      // 使用 bcrypt 验证
      passwordValid = await verifyPassword(password, user.password);
    } else {
      // 明文密码，直接比较（兼容现有数据）
      passwordValid = user.password === password;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { error: '密码错误' },
        { status: 401 }
      );
    }

    // 生成用户信息 payload
    const userPayload = {
      id: user.id,
      userId: type === 'student' ? user.student_id : user.teacher_id,
      name: user.name,
      type,
      role: type === 'teacher' ? user.role : null
    };

    // 生成 Access Token 和 Refresh Token
    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    // 返回登录成功响应
    return NextResponse.json({
      success: true,
      user: {
        id: userPayload.userId,
        name: userPayload.name,
        type: userPayload.type,
        role: userPayload.role
      },
      tokens: {
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    return NextResponse.json(
      { error: '登录失败，请稍后重试' },
      { status: 500 }
    );
  }
}
