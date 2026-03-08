const postgres = require('postgres');

// 从环境变量获取数据库连接字符串
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://vibe_user:vibe_password@localhost:5432/vibe_db';

// 初始化数据库连接
const sql = postgres(DATABASE_URL, {
  ssl: false,
  max: 10,
  idle_timeout: 60
});

// 检查课程视频数据
async function checkCourseVideos() {
  try {
    console.log('检查课程视频数据...');
    console.log('====================================');
    
    // 检查课程视频表是否存在
    const videoTableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'course_videos'
      )
    `;
    console.log(`课程视频表: ${videoTableExists[0].exists ? '✓ 存在' : '✗ 不存在'}`);
    
    // 检查课程视频数据
    if (videoTableExists[0].exists) {
      const videos = await sql`
        SELECT co.course_id, co.course_name, cv.title, cv.video_url, cv.duration, cv.order_index
        FROM courses co
        JOIN course_videos cv ON co.id = cv.course_id
        ORDER BY co.course_id, cv.order_index
      `;
      
      console.log(`\n课程视频数量: ${videos.length}`);
      
      // 按课程分组显示视频
      const coursesWithVideos = {};
      videos.forEach(video => {
        const courseKey = `${video.course_id} - ${video.course_name}`;
        if (!coursesWithVideos[courseKey]) {
          coursesWithVideos[courseKey] = [];
        }
        coursesWithVideos[courseKey].push({
          title: video.title,
          video_url: video.video_url,
          duration: video.duration,
          order_index: video.order_index
        });
      });
      
      // 显示每个课程的视频
      Object.entries(coursesWithVideos).forEach(([course, courseVideos]) => {
        console.log(`\n课程: ${course}`);
        courseVideos.forEach((video, index) => {
          console.log(`  视频 ${index + 1}: ${video.title} (时长: ${video.duration}, 顺序: ${video.order_index})`);
          console.log(`    URL: ${video.video_url}`);
        });
      });
    }
    
    console.log('\n====================================');
    if (videoTableExists[0].exists) {
      console.log('✓ 课程视频表创建成功！');
    } else {
      console.log('✗ 课程视频表创建失败，请检查');
    }
    
  } catch (error) {
    console.error('✗ 检查课程视频数据失败:', error);
  } finally {
    // 关闭数据库连接
    await sql.end();
    console.log('\n数据库连接已关闭');
  }
}

// 运行检查脚本
checkCourseVideos();
