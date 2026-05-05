/**
 * 教师端 API
 *
 * @swagger
 * /api/teacher/ai-assistant/files:
 *   get:
 *     tags: [AI 助教 — 文件]
 *     summary: 某课程已上传的 AI 助教文件列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: courseId
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *         description: 课程编号 course_id
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 缺少 courseId
 *
 * /api/teacher/ai-assistant/upload:
 *   post:
 *     tags: [AI 助教 — 文件]
 *     summary: 上传 PDF/TXT/MD 并入向量库
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, courseId]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               courseId:
 *                 type: string
 *                 description: 课程编号 course_id
 *     responses:
 *       200:
 *         description: 上传处理成功
 *       400:
 *         description: 类型不支持或缺少参数
 *
 * /api/teacher/classes:
 *   get:
 *     tags: [教师端 — 班级]
 *     summary: 教师班级列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 classes:
 *                   type: array
 *                   items:
 *                     type: object
 *
 * /api/teacher/classes/{classId}:
 *   get:
 *     tags: [教师端 — 班级]
 *     summary: 班级详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 班级不存在或无权访问
 *   put:
 *     tags: [教师端 — 班级]
 *     summary: 更新班级信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [class_name, grade]
 *             properties:
 *               class_name:
 *                 type: string
 *               grade:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 参数缺失
 *
 * /api/teacher/classes/{classId}/students:
 *   get:
 *     tags: [教师端 — 班级]
 *     summary: 班级学生列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *   post:
 *     tags: [教师端 — 班级]
 *     summary: 向班级添加学生（可自动创建学生账号）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [student_id]
 *             properties:
 *               student_id:
 *                 type: string
 *               name:
 *                 type: string
 *               password:
 *                 type: string
 *               grade:
 *                 type: string
 *               major:
 *                 type: string
 *     responses:
 *       200:
 *         description: 添加成功
 *       400:
 *         description: 已在班级中等
 *   delete:
 *     tags: [教师端 — 班级]
 *     summary: 从班级移除学生（遗留路由）
 *     description: |
 *       与 `DELETE /api/teacher/classes/{classId}/students/{studentId}` 类似。
 *       若在当前路径调用时服务端无法解析学生标识，请改用带 `studentId`（学号）的路径。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 可能成功（视运行时路由参数是否完整）
 *       404:
 *         description: 班级或学生不在班级中
 *
 * /api/teacher/classes/{classId}/students/batch:
 *   post:
 *     tags: [教师端 — 班级]
 *     summary: 批量导入学生到班级
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [students]
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     student_id:
 *                       type: string
 *                     studentId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     password:
 *                       type: string
 *                     grade:
 *                       type: string
 *                     major:
 *                       type: string
 *     responses:
 *       200:
 *         description: 成功，返回 imported / existed 计数
 *
 * /api/teacher/classes/{classId}/students/{studentId}:
 *   delete:
 *     tags: [教师端 — 班级]
 *     summary: 从班级移除学生（学号为路径中的 studentId）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/StudentIdPath'
 *     responses:
 *       200:
 *         description: 移除成功
 *       404:
 *         description: 班级或学生关系不存在
 *
 * /api/teacher/courses:
 *   get:
 *     tags: [教师端 — 课程]
 *     summary: 教师课程列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeacherCourseListSuccess'
 *   post:
 *     tags: [教师端 — 课程]
 *     summary: 发布新课程并绑定班级
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseRequest'
 *     responses:
 *       200:
 *         description: 发布成功
 *       400:
 *         description: 参数不完整
 *
 * /api/teacher/courses/{courseId}:
 *   get:
 *     tags: [教师端 — 课程]
 *     summary: 教师课程详情
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseDetailSuccess'
 *       404:
 *         description: 课程不存在或无权访问
 *
 * /api/teacher/courses/{courseId}/assignments:
 *   get:
 *     tags: [教师端 — 作业]
 *     summary: 课程作业主题列表（含提交统计）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 assignments:
 *                   type: array
 *                   items:
 *                     type: object
 *   post:
 *     tags: [教师端 — 作业]
 *     summary: 创建作业主题
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content, end_time]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               end_time:
 *                 type: string
 *                 description: 截止时间（ISO 8601 字符串）
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 缺少参数
 *
 * /api/teacher/courses/{courseId}/assignments/{assignmentId}/submissions:
 *   get:
 *     tags: [教师端 — 作业]
 *     summary: 某作业主题下学生提交列表
 *     description: path 中的 assignmentId 为作业主题（assignment_topics）的 id。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/AssignmentTopicIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 submissions:
 *                   type: array
 *                   items:
 *                     type: object
 *   put:
 *     tags: [教师端 — 作业]
 *     summary: 批改提交（打分）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/AssignmentTopicIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [submissionId, score]
 *             properties:
 *               submissionId:
 *                 type: string
 *               score:
 *                 type: number
 *               status:
 *                 type: string
 *                 description: 默认 “已批改”
 *     responses:
 *       200:
 *         description: 批改成功
 *       400:
 *         description: 缺少参数
 *
 * /api/teacher/courses/{courseId}/attendances:
 *   get:
 *     tags: [教师端 — 签到]
 *     summary: 课程签到活动列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 attendances:
 *                   type: array
 *                   items:
 *                     type: object
 *   post:
 *     tags: [教师端 — 签到]
 *     summary: 创建签到活动
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, duration]
 *             properties:
 *               title:
 *                 type: string
 *               duration:
 *                 type: number
 *                 description: 持续时长（实现依业务，单位见服务端）
 *     responses:
 *       201:
 *         description: 已创建
 *       400:
 *         description: 缺少参数
 *
 * /api/teacher/courses/{courseId}/attendances/{attendanceId}/end:
 *   put:
 *     tags: [教师端 — 签到]
 *     summary: 结束某次签到
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/AttendanceIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *       500:
 *         description: 结束失败
 *
 * /api/teacher/courses/{courseId}/classes:
 *   get:
 *     tags: [教师端 — 课程班级]
 *     summary: 教师各班级与当前课程的绑定情况
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 classes:
 *                   type: array
 *                   items:
 *                     type: object
 *
 * /api/teacher/courses/{courseId}/classes/{classId}:
 *   post:
 *     tags: [教师端 — 课程班级]
 *     summary: 将班级绑定到课程
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 绑定成功
 *       400:
 *         description: 已绑定
 *       404:
 *         description: 课程或班级不存在
 *   delete:
 *     tags: [教师端 — 课程班级]
 *     summary: 解除班级与课程的绑定
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/ClassIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 解绑成功
 *
 * /api/teacher/courses/{courseId}/diagnosis:
 *   get:
 *     tags: [教师端 — 学情]
 *     summary: 课程学情分析（教师视角）
 *     description: 返回班级/学生学习诊断数据（JSON 结构以实际响应为准）。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       403:
 *         description: 非教师
 *
 * /api/teacher/courses/{courseId}/discussions:
 *   get:
 *     tags: [教师端 — 讨论]
 *     summary: 课程讨论主题列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 discussions:
 *                   type: array
 *                   items:
 *                     type: object
 *   post:
 *     tags: [教师端 — 讨论]
 *     summary: 创建讨论主题
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 创建成功
 *
 * /api/teacher/courses/{courseId}/resources:
 *   get:
 *     tags: [教师端 — 资源]
 *     summary: 课程资源列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 resources:
 *                   type: array
 *                   items:
 *                     type: object
 *   post:
 *     tags: [教师端 — 资源]
 *     summary: 上传课程资源文件
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file, title]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               resource_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: 上传成功
 *       400:
 *         description: 缺少文件或标题
 *
 * /api/teacher/courses/{courseId}/resources/{resourceId}:
 *   delete:
 *     tags: [教师端 — 资源]
 *     summary: 删除课程资源
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/ResourceIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 删除成功
 *       404:
 *         description: 资源不存在
 *
 * /api/teacher/courses/{courseId}/videos:
 *   get:
 *     tags: [教师端 — 视频]
 *     summary: 课程视频列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 videos:
 *                   type: array
 *                   items:
 *                     type: object
 *
 * /api/teacher/courses/{courseId}/videos/{videoId}/comments:
 *   get:
 *     tags: [教师端 — 视频]
 *     summary: 视频评论列表（含待审核）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/VideoIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     type: object
 *
 * /api/teacher/courses/{courseId}/videos/{videoId}/comments/{commentId}:
 *   put:
 *     tags: [教师端 — 视频]
 *     summary: 审核/更新视频评论状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/VideoIdPath'
 *       - $ref: '#/components/parameters/CommentIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: 更新成功
 *       400:
 *         description: 无效状态
 *       404:
 *         description: 评论不存在
 */
export {};
