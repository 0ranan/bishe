/**
 * OpenAPI 文档入口
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
 */
export {};
