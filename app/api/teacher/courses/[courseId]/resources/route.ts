import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { withAuth, applyAuthToResponse } from '@/lib/middleware';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const UPLOADS_DIR = join(process.cwd(), 'nginx', 'uploads');
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-zip',
  'application/rar',
  'application/x-rar',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
  'application/x-gzip'
];
const MIME_TYPE_MAP: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/msword': 'DOC',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
  'application/vnd.ms-excel': 'XLS',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'XLSX',
  'application/vnd.ms-powerpoint': 'PPT',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PPTX',
  'text/plain': 'TXT',
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/gif': 'GIF',
  'application/zip': 'ZIP',
  'application/x-zip-compressed': 'ZIP',
  'application/x-zip': 'ZIP',
  'application/rar': 'RAR',
  'application/x-rar': 'RAR',
  'application/x-rar-compressed': 'RAR',
  'application/x-7z-compressed': '7Z',
  'application/x-tar': 'TAR',
  'application/gzip': 'GZ',
  'application/x-gzip': 'GZ'
};
const MAX_FILE_SIZE = 10 * 1024 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'jpg', 'jpeg', 'png', 'gif', 'zip', 'rar', '7z', 'tar', 'gz'];
const EXTENSION_TYPE_MAP: Record<string, string> = {
  'pdf': 'PDF',
  'doc': 'DOC',
  'docx': 'DOCX',
  'xls': 'XLS',
  'xlsx': 'XLSX',
  'ppt': 'PPT',
  'pptx': 'PPTX',
  'txt': 'TXT',
  'jpg': 'JPEG',
  'jpeg': 'JPEG',
  'png': 'PNG',
  'gif': 'GIF',
  'zip': 'ZIP',
  'rar': 'RAR',
  '7z': '7Z',
  'tar': 'TAR',
  'gz': 'GZ'
};

export async function GET(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = (await params).courseId;

    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const resources = await sql`
      SELECT cr.id, cr.title, cr.resource_url, cr.description, cr.resource_type, cr.created_at, t.name as teacher_name
      FROM teachers t
      JOIN teacher_class tc ON t.id = tc.teacher_id
      JOIN classes c ON tc.class_id = c.id
      JOIN class_course cc ON c.id = cc.class_id
      JOIN courses co ON cc.course_id = co.id
      JOIN course_resources cr ON co.id = cr.course_id
      WHERE t.teacher_id = ${result.decoded.userId} AND co.course_id = ${courseId}
      ORDER BY cr.created_at DESC
    `;

    const response = NextResponse.json({
      success: true,
      resources
    });

    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('获取课程资源失败:', error);
    return NextResponse.json(
      { error: '获取课程资源失败，请稍后重试' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = (await params).courseId;

    const result = withAuth(request, 'teacher');
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const resource_type = formData.get('resource_type') as string;

    if (!file || !title) {
      return NextResponse.json(
        { error: '文件和标题不能为空' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小不能超过50MB' },
        { status: 400 }
      );
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || '';
    const isAllowedByMime = ALLOWED_FILE_TYPES.includes(file.type);
    const isAllowedByExt = ALLOWED_EXTENSIONS.includes(fileExt);

    if (!isAllowedByMime && !isAllowedByExt) {
      return NextResponse.json(
        { error: '不支持的文件类型' },
        { status: 400 }
      );
    }

    if (!existsSync(UPLOADS_DIR)) {
      await mkdir(UPLOADS_DIR, { recursive: true });
    }

    const courseUploadDir = join(UPLOADS_DIR, courseId);
    if (!existsSync(courseUploadDir)) {
      await mkdir(courseUploadDir, { recursive: true });
    }

    const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = join(courseUploadDir, uniqueFileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    const teacherResult = await sql`
      SELECT id FROM teachers WHERE teacher_id = ${result.decoded.userId}
    `;

    if (teacherResult.length === 0) {
      return NextResponse.json(
        { error: '教师信息不存在' },
        { status: 404 }
      );
    }

    const teacherId = teacherResult[0].id;

    const courseResult = await sql`
      SELECT id FROM courses WHERE course_id = ${courseId}
    `;

    if (courseResult.length === 0) {
      return NextResponse.json(
        { error: '课程不存在' },
        { status: 404 }
      );
    }

    const courseDbId = courseResult[0].id;

    const resourceUrl = `http://localhost:8080/uploads/${courseId}/${uniqueFileName}`;

    const finalResourceType = resource_type || MIME_TYPE_MAP[file.type] || EXTENSION_TYPE_MAP[fileExt] || file.type.substring(0, 50);

    const newResource = await sql`
      INSERT INTO course_resources (course_id, teacher_id, title, resource_url, description, resource_type)
      VALUES (${courseDbId}, ${teacherId}, ${title}, ${resourceUrl}, ${description || null}, ${finalResourceType})
      RETURNING id, title, resource_url, description, resource_type, created_at
    `;

    const response = NextResponse.json({
      success: true,
      resource: newResource[0]
    });

    return applyAuthToResponse(response, result);
  } catch (error) {
    console.error('创建课程资源失败:', error);
    return NextResponse.json(
      { error: '创建课程资源失败，请稍后重试' },
      { status: 500 }
    );
  }
}
