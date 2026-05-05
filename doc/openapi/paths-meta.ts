/**
 * OpenAPI 文档入口与示例接口
 *
 * @swagger
 * /api/swagger:
 *   get:
 *     tags: [文档]
 *     summary: OpenAPI 3 规范 JSON
 *     description: 返回本系统的 Swagger / OpenAPI 文档（JSON）。
 *     responses:
 *       200:
 *         description: OpenAPI 文档
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *
 * /api/swagger-ui:
 *   get:
 *     tags: [文档]
 *     summary: Swagger UI 页面
 *     description: 浏览器可读文档界面（HTML）。
 *     responses:
 *       200:
 *         description: HTML 页面
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *
 * /api/todos:
 *   get:
 *     tags: [示例]
 *     summary: 获取 Todo 列表
 *     description: 演示用，无需登录。
 *     responses:
 *       200:
 *         description: 成功
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       500:
 *         description: 服务器错误
 *   post:
 *     tags: [示例]
 *     summary: 创建 Todo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               completed:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: 已创建
 *       500:
 *         description: 服务器错误
 */
export {};
