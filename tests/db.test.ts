import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql, testConnection } from '../db/client';

describe('数据库测试', () => {
  beforeAll(async () => {
    // 测试数据库连接
    await testConnection();
    
    // 执行 schema.sql 创建表
    const schemaSql = await import('fs/promises');
    const schemaContent = await schemaSql.readFile('./db/schema.sql', 'utf8');
    await sql.unsafe(schemaContent);
  });

  afterAll(async () => {
    // 清理测试数据
    await sql`DELETE FROM todos`;
    // 关闭数据库连接
    await sql.end();
  });

  it('应该能插入一条 todo 数据', async () => {
    // 插入测试数据
    const testTodo = await sql`
      INSERT INTO todos (title, completed) 
      VALUES ('测试 todo', false) 
      RETURNING *
    `;
    
    expect(testTodo).toHaveLength(1);
    expect(testTodo[0].title).toBe('测试 todo');
    expect(testTodo[0].completed).toBe(false);
  });

  it('应该能查询所有 todo 数据', async () => {
    // 先插入一条数据
    await sql`
      INSERT INTO todos (title, completed) 
      VALUES ('查询测试 todo', true) 
      RETURNING *
    `;
    
    // 查询所有数据
    const todos = await sql`SELECT * FROM todos`;
    
    expect(todos).toHaveLength(2); // 包括之前插入的一条
  });
});
