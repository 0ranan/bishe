-- 本数据库一律使用UUID作为主键

-- 创建 todos 表
CREATE TABLE IF NOT EXISTS todos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建学生表
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    grade VARCHAR(20),
    major VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建教师表
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id VARCHAR(20) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    title VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建班级表
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id VARCHAR(20) NOT NULL UNIQUE,
    class_name VARCHAR(100) NOT NULL,
    grade VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建学生和班级的关联表（多对多关系）
CREATE TABLE IF NOT EXISTS student_class (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL,
    class_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE (student_id, class_id)
);

-- 创建教师和班级的关联表（多对多关系）
CREATE TABLE IF NOT EXISTS teacher_class (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL,
    class_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE (teacher_id, class_id)
);

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

-- 创建课程表
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id VARCHAR(20) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    credit FLOAT DEFAULT 3.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建班级和课程的关联表（多对多关系）
CREATE TABLE IF NOT EXISTS class_course (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL,
    course_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE (class_id, course_id)
);

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

-- 创建课程视频表
CREATE TABLE IF NOT EXISTS course_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL,
    video_url TEXT NOT NULL,
    title VARCHAR(100) NOT NULL,
    duration VARCHAR(20),
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 为 C语言程序设计 课程添加视频
INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'https://example.com/videos/c-language/lesson1.mp4', 
    'C语言入门', 
    '45:30', 
    1
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'https://example.com/videos/c-language/lesson2.mp4', 
    'C语言基本语法', 
    '50:15', 
    2
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'https://example.com/videos/c-language/lesson3.mp4', 
    'C语言函数', 
    '48:20', 
    3
FROM courses co
WHERE co.course_id = 'C001'
ON CONFLICT DO NOTHING;

-- 为 高等数学 课程添加视频
INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'https://example.com/videos/math/lesson1.mp4', 
    '高等数学入门', 
    '55:40', 
    1
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'https://example.com/videos/math/lesson2.mp4', 
    '极限与连续', 
    '52:10', 
    2
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;

INSERT INTO course_videos (course_id, video_url, title, duration, order_index)
SELECT 
    co.id, 
    'https://example.com/videos/math/lesson3.mp4', 
    '导数与微分', 
    '49:30', 
    3
FROM courses co
WHERE co.course_id = 'C002'
ON CONFLICT DO NOTHING;
