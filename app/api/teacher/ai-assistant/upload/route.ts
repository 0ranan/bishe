import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { processFileContent } from '@/lib/vector';

// 处理文件上传
export async function POST(request: NextRequest) {
  try {
    // 验证 token
    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const courseId = formData.get('courseId') as string;

    if (!file || !courseId) {
      return NextResponse.json({ error: '文件和课程ID不能为空' }, { status: 400 });
    }

    // 检查文件类型
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '只支持PDF、TXT、MD文件格式' }, { status: 400 });
    }

    // 读取文件内容
    const buffer = await file.arrayBuffer();
    const bufferArray = new Uint8Array(buffer);

    // 创建存储目录
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'ai-assistant');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // 生成唯一文件名
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);

    // 保存文件
    fs.writeFileSync(filePath, bufferArray);

    // 提取文件内容
    let content = '';
    const fileType = file.type;

    if (fileType === 'application/pdf') {
      const data = await pdfParse(bufferArray);
      content = data.text;
    } else if (fileType === 'text/plain') {
      content = new TextDecoder('utf-8').decode(bufferArray);
    } else if (fileType === 'text/markdown') {
      content = new TextDecoder('utf-8').decode(bufferArray);
    }

    // 查询教师和课程的UUID
    const teachers = await sql`
      SELECT id FROM teachers WHERE teacher_id = ${result.decoded.userId}
    `;
    
    const courses = await sql`
      SELECT id FROM courses WHERE course_id = ${courseId}
    `;
    
    if (teachers.length === 0 || courses.length === 0) {
      return NextResponse.json({ error: '教师或课程不存在' }, { status: 404 });
    }
    
    const teacherUuid = teachers[0].id;
    const courseUuid = courses[0].id;

    // 存储文件信息到数据库
    const dbResult = await sql`
      INSERT INTO ai_teaching_assistant_files (
        teacher_id, 
        course_id, 
        file_name, 
        file_path, 
        file_type, 
        file_size, 
        content
      ) VALUES (
        ${teacherUuid}, 
        ${courseUuid}, 
        ${file.name}, 
        ${`/uploads/ai-assistant/${fileName}`}, 
        ${fileType}, 
        ${file.size}, 
        ${content}
      ) RETURNING id
    `;

    // 处理文件内容，生成向量并存储（向量处理失败不影响文件上传）
    const fileId = dbResult[0].id;
    try {
      await processFileContent(fileId, content, {
        teacherId: teacherUuid,
        courseId: courseUuid,
        fileName: file.name,
        fileType
      });
    } catch (vectorError) {
      console.error('向量处理失败:', vectorError);
    }

    return applyAuthToResponse(
      NextResponse.json({
        success: true,
        fileId,
        message: '文件上传成功'
      }),
      result
    );
  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json({ error: '文件上传失败' }, { status: 500 });
  }
}
