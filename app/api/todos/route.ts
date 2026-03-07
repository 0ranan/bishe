/**
 * @swagger
 * /api/todos:
 *   get:
 *     description: 获取所有 todo 列表
 *     responses:
 *       200:
 *         description: 成功获取 todo 列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
                    type: string
 *                   title:
 *                     type: string
 *                   completed:
 *                     type: boolean
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *   post:
 *     description: 创建新的 todo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 成功创建 todo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
                     type: string
 *                 title:
 *                   type: string
 *                 completed:
 *                   type: boolean
 *                 created_at:
 *                   type: string
 *                   format: date-time
 */

import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/db/client';
import { createTodoSchema, todoSchema } from '@/lib/validators';

export async function GET() {
  try {
    // 执行 SQL 查询，获取所有 todos 并按创建时间倒序排列
    const todos = await sql`SELECT * FROM todos ORDER BY created_at DESC`;
    
    // 手动转换日期类型为字符串
    const formattedTodos = todos.map((todo: any) => ({
      ...todo,
      created_at: todo.created_at.toISOString()
    }));
    
    // 验证并返回数据
    const validatedTodos = todoSchema.array().parse(formattedTodos);
    return NextResponse.json(validatedTodos);
  } catch (error) {
    console.error('获取 todos 失败:', error);
    return NextResponse.json({ error: '获取 todos 失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body = await request.json();
    
    // 验证数据
    const validatedData = createTodoSchema.parse(body);
    const { title, completed } = validatedData;
    
    // 执行 SQL 插入操作，返回新创建的 todo
    const newTodo = await sql`
      INSERT INTO todos (title, completed) 
      VALUES (${title}, ${completed}) 
      RETURNING *
    `;
    
    // 手动转换日期类型为字符串
    const formattedTodo = {
      ...newTodo[0],
      created_at: newTodo[0].created_at.toISOString()
    };
    
    // 验证并返回数据
    const validatedTodo = todoSchema.parse(formattedTodo);
    return NextResponse.json(validatedTodo, { status: 201 });
  } catch (error) {
    console.error('创建 todo 失败:', error);
    return NextResponse.json({ error: '创建 todo 失败' }, { status: 500 });
  }
}
