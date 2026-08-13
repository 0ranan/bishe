-- 本数据库一律使用UUID作为主键

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 创建表格 ====================

-- 创建学生表
-- 用于存储学生信息
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    student_id VARCHAR(20) NOT NULL UNIQUE, -- 学号
    password VARCHAR(255) NOT NULL, -- 密码
    name VARCHAR(50) NOT NULL, -- 姓名
    grade VARCHAR(20), -- 年级
    major VARCHAR(100), -- 专业
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 创建教师表
-- 用于存储教师信息
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    teacher_id VARCHAR(20) NOT NULL UNIQUE, -- 工号
    password VARCHAR(255) NOT NULL, -- 密码
    name VARCHAR(50) NOT NULL, -- 姓名
    department VARCHAR(100), -- 部门
    title VARCHAR(50), -- 职称
    role VARCHAR(20) DEFAULT 'teacher', -- 角色：teacher(普通教师)或admin(管理员)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 创建班级表
-- 用于存储班级信息
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    class_id VARCHAR(20) NOT NULL UNIQUE, -- 班级编号
    class_name VARCHAR(100) NOT NULL, -- 班级名称
    grade VARCHAR(20), -- 年级
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 创建学生和班级的关联表（多对多关系）
-- 用于存储学生与班级的对应关系
CREATE TABLE IF NOT EXISTS student_class (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    student_id UUID NOT NULL, -- 学生ID
    class_id UUID NOT NULL, -- 班级ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE, -- 外键关联学生表
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE, -- 外键关联班级表
    UNIQUE (student_id, class_id) -- 确保学生和班级的组合唯一
);

-- 创建教师和班级的关联表（多对多关系）
-- 用于存储教师与班级的对应关系
CREATE TABLE IF NOT EXISTS teacher_class (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    teacher_id UUID NOT NULL, -- 教师ID
    class_id UUID NOT NULL, -- 班级ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE, -- 外键关联教师表
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE, -- 外键关联班级表
    UNIQUE (teacher_id, class_id) -- 确保教师和班级的组合唯一
);

-- 创建课程表
-- 用于存储课程信息
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    course_id VARCHAR(20) NOT NULL UNIQUE, -- 课程编号
    course_name VARCHAR(100) NOT NULL, -- 课程名称
    credit FLOAT DEFAULT 3.0, -- 学分
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

-- 创建班级和课程的关联表（多对多关系）
-- 用于存储班级与课程的对应关系
CREATE TABLE IF NOT EXISTS class_course (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    class_id UUID NOT NULL, -- 班级ID
    course_id UUID NOT NULL, -- 课程ID
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE, -- 外键关联班级表
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE, -- 外键关联课程表
    UNIQUE (class_id, course_id) -- 确保班级和课程的组合唯一
);

-- 创建课程视频表
-- 用于存储课程视频信息
CREATE TABLE IF NOT EXISTS course_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    course_id UUID NOT NULL, -- 课程ID
    video_url TEXT NOT NULL, -- 视频URL
    title VARCHAR(100) NOT NULL, -- 视频标题
    duration VARCHAR(20), -- 视频时长
    order_index INTEGER DEFAULT 0, -- 视频顺序
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE -- 外键关联课程表
);

-- 创建视频评价表
-- 用于存储学生对视频的评论和评分
CREATE TABLE IF NOT EXISTS video_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    video_id UUID NOT NULL, -- 视频ID
    student_id UUID NOT NULL, -- 学生ID
    content TEXT NOT NULL, -- 评论内容
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5), -- 评分（1-5分）
    status VARCHAR(20) DEFAULT 'pending', -- 审核状态：pending(待审核), approved(已通过), rejected(已拒绝)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (video_id) REFERENCES course_videos(id) ON DELETE CASCADE, -- 外键关联视频表
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE -- 外键关联学生表
);

-- 创建视频播放时长记录表
-- 用于记录学生观看视频的时长
CREATE TABLE IF NOT EXISTS video_play_duration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    student_id UUID NOT NULL, -- 学生ID
    video_id UUID NOT NULL, -- 视频ID
    duration INT NOT NULL, -- 播放时长（秒）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE, -- 外键关联学生表
    FOREIGN KEY (video_id) REFERENCES course_videos(id) ON DELETE CASCADE -- 外键关联视频表
);

-- 创建课程签到表
-- 用于存储课程签到活动信息
CREATE TABLE IF NOT EXISTS course_attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    course_id UUID NOT NULL, -- 课程ID
    teacher_id UUID NOT NULL, -- 发布教师ID
    title VARCHAR(100) NOT NULL, -- 签到标题
    code VARCHAR(20) NOT NULL, -- 签到码
    start_time TIMESTAMP NOT NULL, -- 签到开始时间
    end_time TIMESTAMP NOT NULL, -- 签到结束时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE, -- 外键关联课程表
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE -- 外键关联教师表
);

-- 创建课程签到记录表
-- 用于存储学生的签到记录
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    attendance_id UUID NOT NULL, -- 签到活动ID
    course_id UUID NOT NULL, -- 课程ID
    student_id UUID NOT NULL, -- 学生ID
    check_in_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 签到时间
    status VARCHAR(20) DEFAULT '已签到', -- 签到状态
    FOREIGN KEY (attendance_id) REFERENCES course_attendance(id) ON DELETE CASCADE, -- 外键关联签到活动表
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE, -- 外键关联课程表
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE, -- 外键关联学生表
    UNIQUE (attendance_id, student_id) -- 确保每个学生在每个签到活动中只签到一次
);

-- 创建课程资源表
-- 用于存储课程相关资源
CREATE TABLE IF NOT EXISTS course_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    course_id UUID NOT NULL, -- 课程ID
    teacher_id UUID NOT NULL, -- 发布教师ID
    resource_url TEXT NOT NULL, -- 资源URL
    title VARCHAR(100) NOT NULL, -- 资源标题
    description TEXT, -- 资源描述
    resource_type VARCHAR(50), -- 资源类型
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE, -- 外键关联课程表
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE -- 外键关联教师表
);

-- 创建课程资源下载记录表
-- 用于记录学生下载资源的情况
CREATE TABLE IF NOT EXISTS resource_downloads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    resource_id UUID NOT NULL, -- 资源ID
    student_id UUID NOT NULL, -- 学生ID
    download_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 下载时间
    FOREIGN KEY (resource_id) REFERENCES course_resources(id) ON DELETE CASCADE, -- 外键关联资源表
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE -- 外键关联学生表
);

-- 创建课程讨论话题表
-- 用于存储课程讨论话题
CREATE TABLE IF NOT EXISTS discussion_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    course_id UUID NOT NULL, -- 课程ID
    teacher_id UUID NOT NULL, -- 发布教师ID
    title VARCHAR(100) NOT NULL, -- 话题标题
    content TEXT NOT NULL, -- 话题内容
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE, -- 外键关联课程表
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE -- 外键关联教师表
);

-- 创建课题话题评论表
-- 用于存储学生对讨论话题的评论
CREATE TABLE IF NOT EXISTS topic_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    topic_id UUID NOT NULL, -- 话题ID
    student_id UUID NOT NULL, -- 学生ID
    content TEXT NOT NULL, -- 评论内容
    status VARCHAR(20) DEFAULT 'pending', -- 审核状态：pending(待审核), approved(已通过), rejected(已拒绝)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 更新时间
    FOREIGN KEY (topic_id) REFERENCES discussion_topics(id) ON DELETE CASCADE, -- 外键关联话题表
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE -- 外键关联学生表
);

-- 创建课程作业主题表
-- 用于存储课程作业主题
CREATE TABLE IF NOT EXISTS assignment_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    course_id UUID NOT NULL, -- 课程ID
    teacher_id UUID NOT NULL, -- 发布教师ID
    title VARCHAR(100) NOT NULL, -- 作业标题
    content TEXT NOT NULL, -- 作业内容
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 开始时间
    end_time TIMESTAMP NOT NULL, -- 结束时间
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE, -- 外键关联课程表
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE -- 外键关联教师表
);

-- 创建课程作业表
-- 用于存储学生提交的作业
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    assignment_topic_id UUID NOT NULL, -- 作业主题ID
    student_id UUID NOT NULL, -- 学生ID
    content TEXT NOT NULL, -- 作业内容
    submit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 提交时间
    score FLOAT, -- 分数
    status VARCHAR(20) DEFAULT '已提交', -- 状态
    FOREIGN KEY (assignment_topic_id) REFERENCES assignment_topics(id) ON DELETE CASCADE, -- 外键关联作业主题表
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE -- 外键关联学生表
);

-- 创建AI助教文件表
-- 用于存储教师上传的教学资源文件
CREATE TABLE IF NOT EXISTS ai_teaching_assistant_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    teacher_id UUID NOT NULL, -- 上传教师ID
    course_id UUID NOT NULL, -- 课程ID
    file_name VARCHAR(255) NOT NULL, -- 文件名
    file_path TEXT NOT NULL, -- 文件存储路径
    file_type VARCHAR(50) NOT NULL, -- 文件类型（pdf、txt、md等）
    file_size BIGINT NOT NULL, -- 文件大小（字节）
    content TEXT, -- 文件内容（用于向量生成）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE, -- 外键关联教师表
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE -- 外键关联课程表
);

-- 创建AI助教向量表
-- 用于存储文件内容的向量表示
CREATE TABLE IF NOT EXISTS ai_teaching_assistant_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    file_id UUID NOT NULL, -- 关联的文件ID
    chunk_id VARCHAR(100) NOT NULL, -- 文本块ID
    content TEXT NOT NULL, -- 文本块内容
    embedding JSONB NOT NULL, -- 向量表示（JSON格式）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
    FOREIGN KEY (file_id) REFERENCES ai_teaching_assistant_files(id) ON DELETE CASCADE -- 外键关联文件表
);
