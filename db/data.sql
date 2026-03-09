
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

-- ==================== 插入课程签到数据 ====================

-- 为 C语言程序设计 课程添加签到活动
INSERT INTO course_attendance (course_id, teacher_id, title, code, start_time, end_time)
SELECT 
    co.id, 
    t.id, 
    '第一次课堂签到', 
    'C001-001', 
    CURRENT_TIMESTAMP - INTERVAL '7 days', 
    CURRENT_TIMESTAMP - INTERVAL '6 days 23 hours'
FROM courses co, teachers t
WHERE co.course_id = 'C001' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

INSERT INTO course_attendance (course_id, teacher_id, title, code, start_time, end_time)
SELECT 
    co.id, 
    t.id, 
    '第二次课堂签到', 
    'C001-002', 
    CURRENT_TIMESTAMP - INTERVAL '5 days', 
    CURRENT_TIMESTAMP - INTERVAL '4 days 23 hours'
FROM courses co, teachers t
WHERE co.course_id = 'C001' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

-- 为 高等数学 课程添加签到活动
INSERT INTO course_attendance (course_id, teacher_id, title, code, start_time, end_time)
SELECT 
    co.id, 
    t.id, 
    '高等数学第一次签到', 
    'C002-001', 
    CURRENT_TIMESTAMP - INTERVAL '6 days', 
    CURRENT_TIMESTAMP - INTERVAL '5 days 23 hours'
FROM courses co, teachers t
WHERE co.course_id = 'C002' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

-- 为签到活动添加学生签到记录
-- C语言程序设计 第一次签到
INSERT INTO attendance_records (attendance_id, course_id, student_id)
SELECT 
    ca.id, 
    co.id, 
    s.id
FROM course_attendance ca, courses co, students s
WHERE ca.title = '第一次课堂签到' AND co.course_id = 'C001' AND s.student_id IN ('2023001', '2023002', '2023003', '2023004', '2023005', '2023006', '2023007', '2023008', '2023009', '2023010')
ON CONFLICT DO NOTHING;

-- C语言程序设计 第二次签到
INSERT INTO attendance_records (attendance_id, course_id, student_id)
SELECT 
    ca.id, 
    co.id, 
    s.id
FROM course_attendance ca, courses co, students s
WHERE ca.title = '第二次课堂签到' AND co.course_id = 'C001' AND s.student_id IN ('2023001', '2023002', '2023003', '2023004', '2023005', '2023011', '2023012', '2023013', '2023014', '2023015')
ON CONFLICT DO NOTHING;

-- 高等数学 第一次签到
INSERT INTO attendance_records (attendance_id, course_id, student_id)
SELECT 
    ca.id, 
    co.id, 
    s.id
FROM course_attendance ca, courses co, students s
WHERE ca.title = '高等数学第一次签到' AND co.course_id = 'C002' AND s.student_id IN ('2023001', '2023002', '2023003', '2023004', '2023005', '2023006', '2023007', '2023008', '2023009', '2023010', '2023011', '2023012', '2023013', '2023014', '2023015')
ON CONFLICT DO NOTHING;

-- ==================== 插入课程讨论数据 ====================

-- 为 C语言程序设计 课程添加讨论话题
INSERT INTO discussion_topics (course_id, teacher_id, title, content)
SELECT 
    co.id, 
    t.id, 
    'C语言学习方法', 
    '大家分享一下学习C语言的有效方法和技巧，包括如何理解指针、如何调试程序等。'
FROM courses co, teachers t
WHERE co.course_id = 'C001' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

INSERT INTO discussion_topics (course_id, teacher_id, title, content)
SELECT 
    co.id, 
    t.id, 
    '期末考试复习', 
    '期末考试即将来临，大家有什么复习计划？有哪些重点内容需要特别关注？'
FROM courses co, teachers t
WHERE co.course_id = 'C001' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

-- 为 高等数学 课程添加讨论话题
INSERT INTO discussion_topics (course_id, teacher_id, title, content)
SELECT 
    co.id, 
    t.id, 
    '微积分学习心得', 
    '微积分是高等数学的核心内容，大家在学习过程中有什么心得和体会？'
FROM courses co, teachers t
WHERE co.course_id = 'C002' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

-- 为讨论话题添加评论
-- C语言学习方法 评论
INSERT INTO topic_comments (topic_id, student_id, content)
SELECT 
    dt.id, 
    s.id, 
    '我觉得多做练习题是学习C语言的关键，特别是指针部分需要大量实践。'
FROM discussion_topics dt, students s
WHERE dt.title = 'C语言学习方法' AND s.student_id = '2023001'
ON CONFLICT DO NOTHING;

INSERT INTO topic_comments (topic_id, student_id, content)
SELECT 
    dt.id, 
    s.id, 
    '调试工具的使用很重要，学会使用gdb可以帮助我们快速定位问题。'
FROM discussion_topics dt, students s
WHERE dt.title = 'C语言学习方法' AND s.student_id = '2023002'
ON CONFLICT DO NOTHING;

-- 期末考试复习 评论
INSERT INTO topic_comments (topic_id, student_id, content)
SELECT 
    dt.id, 
    s.id, 
    '我认为函数和数组是考试的重点，需要重点复习。'
FROM discussion_topics dt, students s
WHERE dt.title = '期末考试复习' AND s.student_id = '2023003'
ON CONFLICT DO NOTHING;

-- 微积分学习心得 评论
INSERT INTO topic_comments (topic_id, student_id, content)
SELECT 
    dt.id, 
    s.id, 
    '理解概念比死记公式更重要，特别是极限的定义。'
FROM discussion_topics dt, students s
WHERE dt.title = '微积分学习心得' AND s.student_id = '2023004'
ON CONFLICT DO NOTHING;

-- ==================== 插入课程作业数据 ====================

-- 为 C语言程序设计 课程添加作业主题
INSERT INTO assignment_topics (course_id, teacher_id, title, content, end_time)
SELECT 
    co.id, 
    t.id, 
    'C语言基础编程作业', 
    '请编写一个程序，实现以下功能：1. 输入10个整数，存储到数组中；2. 计算数组的平均值；3. 找出数组中的最大值和最小值；4. 按从大到小的顺序排序并输出。', 
    CURRENT_TIMESTAMP + INTERVAL '7 days'
FROM courses co, teachers t
WHERE co.course_id = 'C001' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

INSERT INTO assignment_topics (course_id, teacher_id, title, content, end_time)
SELECT 
    co.id, 
    t.id, 
    '指针与函数作业', 
    '请编写一个程序，使用指针和函数实现以下功能：1. 交换两个变量的值；2. 计算字符串的长度；3. 反转字符串。', 
    CURRENT_TIMESTAMP + INTERVAL '14 days'
FROM courses co, teachers t
WHERE co.course_id = 'C001' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

-- 为 高等数学 课程添加作业主题
INSERT INTO assignment_topics (course_id, teacher_id, title, content, end_time)
SELECT 
    co.id, 
    t.id, 
    '极限与连续作业', 
    '完成课本第1章习题，包括极限的计算、连续性的判断等问题。', 
    CURRENT_TIMESTAMP + INTERVAL '7 days'
FROM courses co, teachers t
WHERE co.course_id = 'C002' AND t.teacher_id = 'T001'
ON CONFLICT DO NOTHING;

-- 为作业主题添加学生提交的作业
-- C语言基础编程作业 提交
INSERT INTO assignments (assignment_topic_id, student_id, content, score, status)
SELECT 
    at.id, 
    s.id, 
    'C语言基础编程作业：实现了输入10个整数，计算平均值，找出最大值和最小值，并按从大到小排序输出的功能。', 
    95.0, 
    '已批改'
FROM assignment_topics at, students s
WHERE at.title = 'C语言基础编程作业' AND s.student_id = '2023001'
ON CONFLICT DO NOTHING;

-- 指针与函数作业 提交
INSERT INTO assignments (assignment_topic_id, student_id, content, status)
SELECT 
    at.id, 
    s.id, 
    '指针与函数作业：实现了交换变量值、计算字符串长度、反转字符串的功能。', 
    '已提交'
FROM assignment_topics at, students s
WHERE at.title = '指针与函数作业' AND s.student_id = '2023001'
ON CONFLICT DO NOTHING;

-- 极限与连续作业 提交
INSERT INTO assignments (assignment_topic_id, student_id, content, status)
SELECT 
    at.id, 
    s.id, 
    '已完成课本第1章习题，包括：1. 极限的计算方法 2. 连续性的判断 3. 无穷小量的性质 4. 两个重要极限的应用', 
    '已提交'
FROM assignment_topics at, students s
WHERE at.title = '极限与连续作业' AND s.student_id = '2023001'
ON CONFLICT DO NOTHING;