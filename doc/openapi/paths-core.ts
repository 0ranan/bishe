/**
 * 认证、用户、管理、AI 问答（集中路径）
 *
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [认证]
 *     summary: 学生 / 教师登录
 *     description: 使用学号或工号登录，返回 accessToken 与 refreshToken。后续请求在 Authorization 头携带 `Bearer <accessToken>`。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: 登录成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginSuccess'
 *       400:
 *         description: 参数错误（缺少字段或用户类型无效）
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       401:
 *         description: 账号不存在或密码错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       500:
 *         description: 服务器错误
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *
 * /api/auth/refresh:
 *   post:
 *     tags: [认证]
 *     summary: 刷新 Access Token
 *     description: 使用登录时获得的 refreshToken 换取新的 accessToken。
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshRequest'
 *     responses:
 *       200:
 *         description: 刷新成功
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshSuccess'
 *       400:
 *         description: 缺少 refresh token
 *       401:
 *         description: refresh token 无效
 *
 * /api/user/profile:
 *   get:
 *     tags: [用户]
 *     summary: 获取当前用户资料
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功；若服务端刷新了 token，新 access 仅出现在响应头 `x-access-token`
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProfileSuccess'
 *       401:
 *         description: 未授权或 token 无效
 *       404:
 *         description: 用户记录不存在
 *
 * /api/user/password:
 *   put:
 *     tags: [用户]
 *     summary: 修改密码
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: 修改成功
 *       400:
 *         description: 校验失败或旧密码错误
 *       401:
 *         description: 未授权
 *
 * /api/admin/teachers:
 *   get:
 *     tags: [管理 — 教师]
 *     summary: 教师列表（管理员）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     responses:
 *       200:
 *         description: 成功
 *       403:
 *         description: 非 admin 角色
 *   post:
 *     tags: [管理 — 教师]
 *     summary: 创建教师账号（管理员）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTeacherRequest'
 *     responses:
 *       200:
 *         description: 创建成功
 *       400:
 *         description: 参数缺失或工号已存在
 *       403:
 *         description: 非 admin 角色
 *
 * /api/ai-assistant/query:
 *   post:
 *     tags: [AI 助教 — 问答]
 *     summary: 课程场景 RAG 问答（流式）
 *     description: |
 *       基于课程向量检索与 LLM 流式输出纯文本回答。成功时 Content-Type 为 `text/plain; charset=utf-8`，正文为增量文本流（非 JSON）。
 *       错误时返回 JSON。
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/RefreshTokenHeader'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [query, courseId]
 *             properties:
 *               query:
 *                 type: string
 *                 description: 用户问题
 *               courseId:
 *                 type: string
 *                 description: 课程编号 course_id（业务 ID，非 UUID）
 *     responses:
 *       200:
 *         description: 流式文本（text/plain）
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: 参数缺失或内容审核未通过
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorMessage'
 *       404:
 *         description: 课程不存在
 *       500:
 *         description: 服务异常
 */
export {};
