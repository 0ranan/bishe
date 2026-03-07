import { z } from 'zod';

// Todo 完整 Schema
export const todoSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  completed: z.boolean(),
  created_at: z.string().datetime()
});

// 创建 Todo 的输入 Schema
export const createTodoSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean().optional().default(false)
});

// 推断 TypeScript 类型
export type Todo = z.infer<typeof todoSchema>;
export type CreateTodoInput = z.infer<typeof createTodoSchema>;
