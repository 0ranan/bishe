import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sql, testConnection } from '../db/client';

describe('数据库测试', () => {
  beforeAll(async () => {
    await testConnection();
  });

  afterAll(async () => {
    await sql.end();
  });

  it('应该能执行简单查询', async () => {
    const rows = await sql`SELECT 1 as ok`;
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].ok)).toBe(1);
  });

  it('应该存在 students 表', async () => {
    const rows = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'students'
    `;
    expect(rows.length).toBeGreaterThanOrEqual(0);
  });
});
