import { NextResponse } from 'next/server';
import { createSwaggerSpec } from 'next-swagger-doc';

export async function GET() {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api',
    schemaFolders: ['doc/openapi'],
    definition: {
      openapi: '3.0.0',
      info: {
        title: '学情诊断系统 API',
        version: '1.0.0',
        description:
          '基于 Next.js App Router 的教学与学情相关接口。\n\n' +
          '**认证**：登录后使用 `Authorization: Bearer <accessToken>`。客户端应同时携带请求头 `x-refresh-token`（登录时获得的 refreshToken）；当 access 即将过期或已失效且 refresh 有效时，服务端可在同请求内换发，新 access 仅出现在响应头 `x-access-token`（不再放入响应体）。',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: '本地开发',
        },
      ],
      tags: [
        { name: '文档', description: 'OpenAPI JSON 与 Swagger UI' },
        { name: '认证', description: '登录与令牌刷新' },
        { name: '用户', description: '当前用户资料与密码' },
        { name: '管理 — 教师', description: '管理员维护教师账号（需 teacher 且 role=admin）' },
        { name: 'AI 助教 — 问答', description: '课程 RAG 问答（流式）' },
        { name: 'AI 助教 — 文件', description: '教学材料上传与列表（向量库）' },
        { name: '学生端 — 课程', description: '学生选课与课程信息' },
        { name: '学生端 — 作业', description: '作业查看与提交' },
        { name: '学生端 — 签到', description: '签到记录与提交签到码' },
        { name: '学生端 — 讨论', description: '讨论主题与评论' },
        { name: '学生端 — 资源', description: '课程资源下载列表' },
        { name: '学生端 — 视频', description: '课程视频与评论、播放时长' },
        { name: '学生端 — 学情', description: '个人学情诊断数据' },
        { name: '教师端 — 课程', description: '课程发布与详情' },
        { name: '教师端 — 课程班级', description: '课程与班级的绑定关系' },
        { name: '教师端 — 班级', description: '班级维护与学生名单' },
        { name: '教师端 — 作业', description: '作业主题与批改' },
        { name: '教师端 — 签到', description: '签到活动与结束签到' },
        { name: '教师端 — 讨论', description: '讨论主题管理' },
        { name: '教师端 — 资源', description: '课程资源上传与删除' },
        { name: '教师端 — 视频', description: '课程视频与评论审核' },
        { name: '教师端 — 学情', description: '课程学情统计与分析' },
        { name: '示例', description: '演示用 Todo API（无需登录）' },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: '登录接口返回的 accessToken',
          },
        },
        parameters: {
          CourseIdPath: {
            name: 'courseId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '课程编号 course_id',
          },
          ClassIdPath: {
            name: 'classId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '班级编号 class_id',
          },
          TopicIdPath: {
            name: 'topicId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '讨论主题 id（UUID）',
          },
          VideoIdPath: {
            name: 'videoId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '课程视频记录 id（course_videos.id，UUID）',
          },
          CommentIdPath: {
            name: 'commentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '视频评论 id',
          },
          AssignmentTopicIdPath: {
            name: 'assignmentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '作业主题 id（assignment_topics.id，路径参数名为 assignmentId）',
          },
          AttendanceIdPath: {
            name: 'attendanceId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '签到活动 id',
          },
          ResourceIdPath: {
            name: 'resourceId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '课程资源 id',
          },
          StudentIdPath: {
            name: 'studentId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: '学生学号 student_id',
          },
          RefreshTokenHeader: {
            name: 'x-refresh-token',
            in: 'header',
            required: false,
            schema: { type: 'string' },
            description: '建议携带；access 即将过期或已失效时用于换发新 access token',
          },
        },
        schemas: {
          ErrorMessage: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          LoginRequest: {
            type: 'object',
            required: ['type', 'id', 'password'],
            properties: {
              type: {
                type: 'string',
                enum: ['student', 'teacher'],
                description: '用户类型',
              },
              id: { type: 'string', description: '学号或工号' },
              password: { type: 'string', format: 'password' },
            },
          },
          LoginSuccess: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  type: { type: 'string', enum: ['student', 'teacher'] },
                  role: { type: 'string', nullable: true },
                },
              },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                  refreshToken: { type: 'string' },
                },
              },
            },
          },
          RefreshRequest: {
            type: 'object',
            required: ['refreshToken'],
            properties: {
              refreshToken: { type: 'string' },
            },
          },
          RefreshSuccess: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              tokens: {
                type: 'object',
                properties: {
                  accessToken: { type: 'string' },
                },
              },
            },
          },
          ChangePasswordRequest: {
            type: 'object',
            required: ['oldPassword', 'newPassword'],
            properties: {
              oldPassword: { type: 'string', format: 'password' },
              newPassword: { type: 'string', format: 'password', minLength: 6 },
            },
          },
          CourseSummary: {
            type: 'object',
            properties: {
              course_id: { type: 'string' },
              course_name: { type: 'string' },
              credit: { type: 'number', nullable: true },
            },
          },
          CourseDetailSuccess: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              course: { $ref: '#/components/schemas/CourseSummary' },
            },
          },
          StudentCourseListSuccess: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              courses: {
                type: 'array',
                items: { $ref: '#/components/schemas/CourseSummary' },
              },
            },
          },
          TeacherCourseListSuccess: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              courses: {
                type: 'array',
                items: { $ref: '#/components/schemas/CourseSummary' },
              },
            },
          },
          CreateCourseRequest: {
            type: 'object',
            required: ['course_name', 'credit', 'class_ids'],
            properties: {
              course_name: { type: 'string' },
              credit: { type: 'number' },
              class_ids: {
                type: 'array',
                items: { type: 'string' },
                description: '班级 class_id 列表',
              },
            },
          },
          ProfileSuccess: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              user: { type: 'object', additionalProperties: true },
            },
          },
          CreateTeacherRequest: {
            type: 'object',
            required: ['teacher_id', 'password', 'name'],
            properties: {
              teacher_id: { type: 'string' },
              password: { type: 'string', format: 'password' },
              name: { type: 'string' },
              department: { type: 'string', nullable: true },
              title: { type: 'string', nullable: true },
              role: { type: 'string', example: 'teacher' },
            },
          },
        },
      },
    },
  });
  return NextResponse.json(spec);
}
