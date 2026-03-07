import { NextResponse } from 'next/server';
import { createSwaggerSpec } from 'next-swagger-doc';

export async function GET() {
  const spec = createSwaggerSpec({
    apiFolder: 'app/api', // API 路由所在文件夹
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Vibe Todo API',
        version: '1.0.0',
        description: 'Vibe Todo 应用的 API 文档',
      },
      servers: [
        {
          url: 'http://localhost:3000',
          description: '本地开发服务器',
        },
      ],
    },
  });
  return NextResponse.json(spec);
}
