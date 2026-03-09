-- 本数据库一律使用UUID作为主键

-- 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== 创建表格 ====================

-- 创建 todos 表
-- 用于存储待办事项
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- 主键ID
    title TEXT NOT NULL, -- 待办事项标题
    completed BOOLEAN DEFAULT false, -- 是否完成
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- 创建时间
);

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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- 创建时间
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

-- ==================== 插入数据 ====================

-- 插入初始班级信息
INSERT INTO classes (class_id, class_name, grade)
VALUES ('C2023001', '计算机学院2023级混合班', '2023级')
ON CONFLICT (class_id) DO NOTHING;

-- 插入初始教师信息
INSERT INTO teachers (teacher_id, password, name, department, title)
VALUES ('T001', 'teacher123', '王老师', '计算机学院', '教授')
ON CONFLICT (teacher_id) DO NOTHING;

-- 插入初始学生信息（30条）
INSERT INTO students (student_id, password, name, grade, major)
VALUES 
-- 学生1: 学号, 密码, 姓名, 年级, 专业
('2023001', 'student123', '张三', '2023级', '计算机科学与技术'),
-- 学生2: 学号, 密码, 姓名, 年级, 专业
('2023002', 'student123', '李四', '2023级', '计算机科学与技术'),
-- 学生3: 学号, 密码, 姓名, 年级, 专业
('2023003', 'student123', '王五', '2023级', '计算机科学与技术'),
-- 学生4: 学号, 密码, 姓名, 年级, 专业
('2023004', 'student123', '赵六', '2023级', '计算机科学与技术'),
-- 学生5: 学号, 密码, 姓名, 年级, 专业
('2023005', 'student123', '钱七', '2023级', '计算机科学与技术'),
-- 学生6: 学号, 密码, 姓名, 年级, 专业
('2023006', 'student123', '孙八', '2023级', '软件工程'),
-- 学生7: 学号, 密码, 姓名, 年级, 专业
('2023007', 'student123', '周九', '2023级', '软件工程'),
-- 学生8: 学号, 密码, 姓名, 年级, 专业
('2023008', 'student123', '吴十', '2023级', '软件工程'),
-- 学生9: 学号, 密码, 姓名, 年级, 专业
('2023009', 'student123', '郑一', '2023级', '软件工程'),
-- 学生10: 学号, 密码, 姓名, 年级, 专业
('2023010', 'student123', '王二', '2023级', '软件工程'),
-- 学生11: 学号, 密码, 姓名, 年级, 专业
('2023011', 'student123', '陈三', '2023级', '人工智能'),
-- 学生12: 学号, 密码, 姓名, 年级, 专业
('2023012', 'student123', '林四', '2023级', '人工智能'),
-- 学生13: 学号, 密码, 姓名, 年级, 专业
('2023013', 'student123', '黄五', '2023级', '人工智能'),
-- 学生14: 学号, 密码, 姓名, 年级, 专业
('2023014', 'student123', '杨六', '2023级', '人工智能'),
-- 学生15: 学号, 密码, 姓名, 年级, 专业
('2023015', 'student123', '马七', '2023级', '人工智能'),
-- 学生16: 学号, 密码, 姓名, 年级, 专业
('2023016', 'student123', '朱八', '2023级', '数据科学与大数据技术'),
-- 学生17: 学号, 密码, 姓名, 年级, 专业
('2023017', 'student123', '秦九', '2023级', '数据科学与大数据技术'),
-- 学生18: 学号, 密码, 姓名, 年级, 专业
('2023018', 'student123', '尤十', '2023级', '数据科学与大数据技术'),
-- 学生19: 学号, 密码, 姓名, 年级, 专业
('2023019', 'student123', '许一', '2023级', '数据科学与大数据技术'),
-- 学生20: 学号, 密码, 姓名, 年级, 专业
('2023020', 'student123', '何二', '2023级', '数据科学与大数据技术'),
-- 学生21: 学号, 密码, 姓名, 年级, 专业
('2023021', 'student123', '吕三', '2023级', '网络工程'),
-- 学生22: 学号, 密码, 姓名, 年级, 专业
('2023022', 'student123', '施四', '2023级', '网络工程'),
-- 学生23: 学号, 密码, 姓名, 年级, 专业
('2023023', 'student123', '张五', '2023级', '网络工程'),
-- 学生24: 学号, 密码, 姓名, 年级, 专业
('2023024', 'student123', '孔六', '2023级', '网络工程'),
-- 学生25: 学号, 密码, 姓名, 年级, 专业
('2023025', 'student123', '曹七', '2023级', '网络工程'),
-- 学生26: 学号, 密码, 姓名, 年级, 专业
('2023026', 'student123', '严八', '2023级', '物联网工程'),
-- 学生27: 学号, 密码, 姓名, 年级, 专业
('2023027', 'student123', '华九', '2023级', '物联网工程'),
-- 学生28: 学号, 密码, 姓名, 年级, 专业
('2023028', 'student123', '金十', '2023级', '物联网工程'),
-- 学生29: 学号, 密码, 姓名, 年级, 专业
('2023029', 'student123', '魏一', '2023级', '物联网工程'),
-- 学生30: 学号, 密码, 姓名, 年级, 专业
('2023030', 'student123', '陶二', '2023级', '物联网工程')
ON CONFLICT (student_id) DO NOTHING;

-- 插入教师与班级的关联
INSERT INTO teacher_class (teacher_id, class_id)
SELECT t.id, c.id
FROM teachers t, classes c
WHERE t.teacher_id = 'T001' AND c.class_id = 'C2023001'
ON CONFLICT (teacher_id, class_id) DO NOTHING;

-- 插入学生与班级的关联
INSERT INTO student_class (student_id, class_id)
SELECT s.id, c.id
FROM students s, classes c
WHERE c.class_id = 'C2023001'
ON CONFLICT (student_id, class_id) DO NOTHING;

-- 插入初始课程信息
INSERT INTO courses (course_id, course_name, credit)
VALUES 
('C001', 'C语言程序设计', 4.0),
('C002', '高等数学', 5.0)
ON CONFLICT (course_id) DO NOTHING;

-- 插入班级与课程的关联
INSERT INTO class_course (class_id, course_id)
SELECT c.id, co.id
FROM classes c, courses co
WHERE c.class_id = 'C2023001'
ON CONFLICT (class_id, course_id) DO NOTHING;

-- 为 C语言程序设计 课程添加视频
INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/1-第一节：C语言期末速成介绍-4K 超高清-AVC.mp4', 
    'C语言期末速成介绍', 
    '15:00', 
    1
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/2-第二节：C语言基础知识-4K 超高清-AVC.mp4', 
    'C语言基础知识', 
    '20:00', 
    2
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/3-第三节：输出函数printf-4K 超高清-AVC.mp4', 
    '输出函数printf', 
    '18:00', 
    3
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/4-第四节：输入函数scanf-4K 超高清-AVC.mp4', 
    '输入函数scanf', 
    '16:00', 
    4
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/5-第五节：算数运算符和表达式-4K 超高清-AVC.mp4', 
    '算数运算符和表达式', 
    '14:00', 
    5
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/6-第六节：关系运算符和逻辑运算符-4K 超高清-AVC.mp4', 
    '关系运算符和逻辑运算符', 
    '16:00', 
    6
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/7-第七节：分支结构-4K 超高清-AVC.mp4', 
    '分支结构', 
    '18:00', 
    7
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/8-第八节：循环结构-4K 超高清-AVC.mp4', 
    '循环结构', 
    '20:00', 
    8
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/9-第九节：数组-4K 超高清-AVC.mp4', 
    '数组', 
    '19:00', 
    9
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/c语言期末速成3小时/10-第十节：函数-4K 超高清-AVC.mp4', 
    '函数', 
    '22:00', 
    10
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

-- 为 高等数学 课程添加视频
INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/1-第一讲：极限与连续（一）-720P 准高清-AVC.mp4', 
    '极限与连续（一）', 
    '25:00', 
    1
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/2-第二讲：极限与连续（二）-720P 准高清-AVC.mp4', 
    '极限与连续（二）', 
    '22:00', 
    2
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/3-提醒：配套电子讲义、章节测试题获取方法-720P 准高清-AVC.mp4', 
    '配套电子讲义、章节测试题获取方法', 
    '5:00', 
    3
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/4-第三讲：导数与微分-720P 准高清-AVC.mp4', 
    '导数与微分', 
    '28:00', 
    4
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/5-第四讲：微分中值定理及导数的应用（一）-720P 准高清-AVC.mp4', 
    '微分中值定理及导数的应用（一）', 
    '30:00', 
    5
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/6-第五讲：微分中值定理及导数的应用（二）-720P 准高清-AVC.mp4', 
    '微分中值定理及导数的应用（二）', 
    '26:00', 
    6
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/7-第六讲：不定积分（一）-720P 准高清-AVC.mp4', 
    '不定积分（一）', 
    '25:00', 
    7
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/8-第六讲：不定积分（二）-720P 准高清-AVC.mp4', 
    '不定积分（二）', 
    '24:00', 
    8
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/9-第七讲：定积分及其应用（一）-720P 准高清-AVC.mp4', 
    '定积分及其应用（一）', 
    '27:00', 
    9
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/10-第七讲：定积分及其应用（二）-720P 准高清-AVC.mp4', 
    '定积分及其应用（二）', 
    '26:00', 
    10
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/11-第八讲：微分方程（有的学校期末不考这一章）-720P 准高清-AVC.mp4', 
    '微分方程', 
    '28:00', 
    11
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'http://localhost:8080/video/《高等数学(上)》6小时速成课/《高等数学(上)》6小时速成课  框框老师（突击课，适合高等数学(微积分)期末考试、期中考试、补考、重修、专升本，考试不挂科）/12-课程的最后-720P 准高清-AVC.mp4', 
    '课程的最后', 
    '3:00', 
    12
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;