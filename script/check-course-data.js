const postgres = require('postgres');

// 从环境变量获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://vibe_user:vibe_password@localhost:5432/vibe_db';

// 初始化数据库连接
const sql = postgres(DATABASE_URL, {
  ssl: false,
  max: 10,
  idle_timeout: 60
});

// 检查课程数据
async function checkCourseData() {
  try {
    console.log('检查课程数据...');
    console.log('====================================');
    
    // 检查课程表是否存在
    const courseTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'courses'
      )
    `;
    console.log(`课程表: ${courseTableExists[0].exists ? '✓ 存在' : '✗ 不存在'}`);
    
    // 检查班级-课程关联表是否存在
    const classCourseTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'class_course'
      )
    `;
    console.log(`班级-课程关联表: ${classCourseTableExists[0].exists ? '✓ 存在' : '✗ 不存在'}`);
    
    // 检查课程数据
    if (courseTableExists[0].exists) {
      const courses = await sql`
        SELECT course_id, course_name, credit FROM courses
      `;
      console.log(`\n课程数量: ${courses.length}`);
      courses.forEach(course => {
        console.log(`  课程ID: ${course.course_id}, 课程名称: ${course.course_name}, 学分: ${course.credit}`);
      });
    }
    
    // 检查班级-课程关联数据
    if (classCourseTableExists[0].exists) {
      const classCourses = await sql`
        SELECT c.class_id, c.class_name, co.course_id, co.course_name
        FROM classes c
        JOIN class_course cc ON c.id = cc.class_id
        JOIN courses co ON cc.course_id = co.id
      `;
      console.log(`\n班级-课程关联数量: ${classCourses.length}`);
      classCourses.forEach(assoc => {
        console.log(`  班级: ${assoc.class_name} (班级ID: ${assoc.class_id}) -> 课程: ${assoc.course_name} (课程ID: ${assoc.course_id})`);
      });
    }
    
    console.log('\n====================================');
    if (courseTableExists[0].exists && classCourseTableExists[0].exists) {
      console.log('✓ 课程表和关联表创建成功！');
    } else {
      console.log('✗ 课程表或关联表创建失败，请检查');
    }
    
  } catch (error) {
    console.error('✗ 检查课程数据失败:', error);
  } finally {
    // 关闭数据库连接
    await sql.end();
    console.log('\n数据库连接已关闭');
  }
}

// 运行检查脚本
checkCourseData();
