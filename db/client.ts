import postgres from 'postgres';

// 从环境变量获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL 环境变量未设置');
}

// 初始化数据库连接
const sql = postgres(DATABASE_URL, {
  ssl: false, // 本地开发环境不需要 SSL
  max: 10, // 最大连接数
  idle_timeout: 60, // 空闲连接超时时间（秒）
  types: {
    // 保持日期类型为 Date 对象，避免时区转换问题
    date: (value) => value || null,
    timestamp: (value) => value || null,
    timestamptz: (value) => value || null
  }
});

// 测试数据库连接
async function testConnection() {
  try {
    await sql`SELECT 1`;
    console.log('数据库连接成功');
  } catch (error) {
    console.error('数据库连接失败:', error);
    throw error;
  }
}

// 导出 sql 对象
export { sql, testConnection };
