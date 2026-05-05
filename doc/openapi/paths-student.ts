/**
 * 学生端 API
 *
 * @swagger
 * /api/student/courses:
 *   get:
 *     tags: [学生端 — 课程]
 *     summary: 学生课程列表
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
 *               $ref: '#/components/schemas/StudentCourseListSuccess'
 *       401:
 *         description: 未授权或非学生
 *
 * /api/student/courses/{courseId}:
 *   get:
 *     tags: [学生端 — 课程]
 *     summary: 学生课程详情
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
 * /api/student/courses/{courseId}/assignments:
 *   get:
 *     tags: [学生端 — 作业]
 *     summary: 课程作业列表（含提交状态）
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
 *       404:
 *         description: 课程不存在
 *   post:
 *     tags: [学生端 — 作业]
 *     summary: 提交作业
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
 *             required: [assignment_topic_id, content]
 *             properties:
 *               assignment_topic_id:
 *                 type: string
 *                 description: 作业主题 id（UUID）
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 提交成功
 *       400:
 *         description: 缺少参数
 *       404:
 *         description: 课程或作业不存在
 *
 * /api/student/courses/{courseId}/attendances:
 *   get:
 *     tags: [学生端 — 签到]
 *     summary: 课程签到记录列表
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
 *       404:
 *         description: 课程不存在
 *   post:
 *     tags: [学生端 — 签到]
 *     summary: 学生签到（提交签到码）
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
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 description: 签到码
 *     responses:
 *       200:
 *         description: 签到成功
 *       400:
 *         description: 缺少签到码或签到无效
 *
 * /api/student/courses/{courseId}/diagnosis:
 *   get:
 *     tags: [学生端 — 学情]
 *     summary: 学生学习情况分析
 *     description: 返回学情诊断相关统计数据（JSON 结构以实际响应为准）。
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
 *       401:
 *         description: 未授权
 *       403:
 *         description: 非学生
 *
 * /api/student/courses/{courseId}/discussions:
 *   get:
 *     tags: [学生端 — 讨论]
 *     summary: 课程讨论主题列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *       404:
 *         description: 课程不存在
 *
 * /api/student/courses/{courseId}/discussions/{topicId}/comments:
 *   get:
 *     tags: [学生端 — 讨论]
 *     summary: 某讨论主题下的评论列表（仅已通过审核）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/TopicIdPath'
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
 *   post:
 *     tags: [学生端 — 讨论]
 *     summary: 发表评论（含内容审核）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/TopicIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 发表成功
 *       400:
 *         description: 内容为空或未通过审核
 *
 * /api/student/courses/{courseId}/resources:
 *   get:
 *     tags: [学生端 — 资源]
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
 *
 * /api/student/courses/{courseId}/videos:
 *   get:
 *     tags: [学生端 — 视频]
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
 * /api/student/courses/{courseId}/videos/{videoId}/comments:
 *   get:
 *     tags: [学生端 — 视频]
 *     summary: 视频评论列表（仅已通过审核）
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
 *   post:
 *     tags: [学生端 — 视频]
 *     summary: 发表视频评论
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/VideoIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content, rating]
 *             properties:
 *               content:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: 成功
 *       400:
 *         description: 参数错误或审核未通过
 *
 * /api/student/courses/{courseId}/videos/{videoId}/play-duration:
 *   post:
 *     tags: [学生端 — 视频]
 *     summary: 上报视频播放时长
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/CourseIdPath'
 *       - $ref: '#/components/parameters/VideoIdPath'
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [duration]
 *             properties:
 *               duration:
 *                 type: number
 *                 description: 播放时长（秒，须大于 0）
 *     responses:
 *       200:
 *         description: 记录成功
 *       400:
 *         description: 时长无效
 */
export {};
