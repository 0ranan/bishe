const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// 从环境变量获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://vibe_user:vibe_password@localhost:5432/vibe_db';

// 初始化数据库连接
const sql = postgres(DATABASE_URL, {
  ssl: false,
  max: 10,
  idle_timeout: 60
});

// 读取 SQL 文件
const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
const dataPath = path.join(__dirname, '..', 'db', 'data.sql');
const schemaSql = fs.readFileSync(schemaPath, 'utf8');
const dataSql = fs.readFileSync(dataPath, 'utf8');

// 执行 SQL 语句
async function executeSQL() {
  try {
    console.log('正在执行数据库 schema...');
    
    // 执行 schema.sql
    await executeSqlFile(schemaSql, 'schema');
    
    console.log('\n正在执行数据库数据...');
    
    // 执行 data.sql
    await executeSqlFile(dataSql, 'data');
    
    console.log('\n数据库初始化完成！');
    
    // 验证表是否创建成功
    await verifyTables();
    
  } catch (error) {
    console.error('执行 SQL 时出错:', error);
  } finally {
    // 关闭数据库连接
    await sql.end();
  }
}

// 执行 SQL 文件
async function executeSqlFile(sqlContent, fileType) {
  // 分割 SQL 语句
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);
  
  // 执行每个语句
  for (const statement of statements) {
    await sql.unsafe(statement);
    console.log(`执行成功 (${fileType}): ${statement.substring(0, 50)}...`);
  }
  
  console.log(`\n${fileType}.sql 执行完成！`);
}

// 验证表是否创建成功
async function verifyTables() {
  try {
    console.log('\n验证表结构...');
    
    // 检查所有表是否存在
    const tables = ['students', 'teachers', 'classes', 'student_class', 'teacher_class', 'courses', 'class_course', 'course_videos', 'video_comments', 'video_play_duration', 'course_attendance', 'attendance_records', 'course_resources', 'resource_downloads', 'discussion_topics', 'topic_comments', 'assignment_topics', 'assignments'];
    
    for (const table of tables) {
      const result = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${table}
        )
      `;
      
      const exists = result[0].exists;
      console.log(`${table} 表: ${exists ? '✓ 存在' : '✗ 不存在'}`);
    }
    
    console.log('\n表结构验证完成！');
    
  } catch (error) {
    console.error('验证表结构时出错:', error);
  }
}

// 运行脚本
executeSQL();
