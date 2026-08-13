# AGENTS.md

面向 AI 编程代理的仓库操作说明。路径级细则见 `.cursor/rules/`（壳层、ML 禁降级、env 同步）。

## 项目

基于机器学习的学情诊断系统：Next.js 15（App Router）+ PostgreSQL + Python gRPC 预测 + Qdrant（AI 助教向量检索）+ Nginx（静态上传）。

## 目录地图

| 路径 | 职责 |
|------|------|
| `app/` | 页面与 API Routes（`admin` / `teacher` / `student` / `api`） |
| `components/` | UI：`course` 共用，`teacher` / `student` 角色组件 |
| `lib/` | 鉴权、课程访问、诊断、gRPC 客户端、向量、校验 |
| `python/` | 学情预测 gRPC 服务与模型（`grpc_server.py`、`models/`） |
| `db/` | `schema.sql` / `data.sql` / `init.sql` |
| `nginx/` | 上传静态资源服务 |
| `doc/` | OpenAPI 与流程文档 |
| `tests/` | Vitest 测试 |
| `script/` | DB/数据检查脚本 |

## 常用命令

```bash
cp .env.example .env          # 本地配置（勿提交真实密钥）
npm install
docker compose up -d --build  # 依赖服务：见下方「用 Docker 测试」
npm run dev                   # Next 默认 :3000，连本机映射端口
npm run lint
npm run test                  # Vitest 单测；集成/冒烟优先走 Docker
npm run build
```

API 文档（开发）：`/api/swagger-ui`。

Python gRPC 代码生成（改 proto 后）：见 `python/README.md` / `python/generate_grpc_code.py`。

## 用 Docker 测试（优先）

验证依赖服务与学情诊断链路时，**优先用 Compose 起真实依赖**，不要用规则/假预测代替 gRPC。Next 一般在宿主机 `npm run dev`，通过 `.env` 连容器映射端口。

| 服务 | 容器 | 宿主机端口 | 用途 |
|------|------|------------|------|
| postgres | `vibe_postgres` | `5432` | `DATABASE_URL` |
| python | `vibe_python` | `50051` | `GRPC_STUDENT_ANALYSIS_URL` |
| qdrant | `vibe_qdrant` | `6333` | `QDRANT_URL` |
| nginx | `vibe_nginx` | `8081` | 上传静态资源（8080 占用时用 8081） |

### 启动与健康检查

```bash
docker compose up -d --build
docker compose ps                    # 四服务应为 Up
docker compose logs -f python        # gRPC 启动异常时看这里
```

库表/种子（按需，容器已有 `db/init.sql` 时可能已初始化）：

```bash
# 宿主机对映射的 postgres
node script/test-db-schema.js
# 或：docker exec -i vibe_postgres psql -U vibe_user -d vibe_db < db/schema.sql
#     docker exec -i vibe_postgres psql -U vibe_user -d vibe_db < db/data.sql
```

### 冒烟建议

1. `.env` 含 `DATABASE_URL`、`GRPC_STUDENT_ANALYSIS_URL=127.0.0.1:50051`、`QDRANT_URL=http://localhost:6333`
2. `npm run dev` 后登录（如教师 `T001` / 学生 `2023001` / 管理员 `ADMIN001`，密码见数据种子或 README）
3. 打开某课学情诊断：python 正常时应 **200** 且为模型结果
4. 验证禁降级：`docker compose stop python` → 诊断接口须 **503**（不得假成功）；再 `docker compose start python` 恢复 **200**
5. 可选：容器内/宿主机跑 `python/test/grpc_client.py` 直连 `localhost:50051`

涉及诊断、gRPC、DB、向量检索的改动，交接前应写明是否完成上述 Docker 冒烟；未能启动 Compose 时须标明未验证项。
## 角色与入口

- 登录页 `/`：学生 → `/student`；教师 → `/teacher`；`role === 'admin'` 的教师 → `/admin/teachers`
- 管理员须在 `TeacherGlobalNav` 可见「教师管理」；`/admin/teachers` 与 `/api/admin/*` 仍须校验 admin
- 会话：`localStorage` + JWT；前端登出用 `lib/auth-client` 的 `logout()`

## 架构硬约束

1. **禁止模型降级**：成绩/学情预测唯一路径为 gRPC（`lib/grpc-prediction.ts` → Python）。失败返回明确错误（如 503），禁止规则引擎、阈值、启发式或静默假预测凑成功。本地 mock 须显式 flag 且不得进默认生产路径。
2. **课程壳**：课程信息只经 `CourseProvider` / `useCourse()` 拉一次；模块页用 `CourseContentSkeleton`，勿空白「加载中...」；勿双层顶栏/侧栏。大屏 `diagnosis/bigscreen` 全屏。
3. **课程共用组件**：`components/course/CourseInfo.tsx`，勿再拆师生两份。
4. **环境变量**：改 env / Compose / 代码中的 `${ENV}` 时，同一变更同步 `.env.example`；示例中禁止真实密钥。
5. **API**：Route Handler 内 SQL + zod 校验；课程归属用 `lib/course-access.ts`。

## 禁区

- 勿提交 `.env`、真实 API Key、JWT 密钥
- 勿手改 `python/grpc_gen/`（由 proto 生成）；改契约先改 `python/proto/`
- 勿随意删改 `python/models/*.pkl` 除非明确要换模型
- 勿对 `main`/`master` 强推；未要求勿 commit / push

## 完成标准

- 改动范围贴合需求，无无关重构
- 能跑则跑：`npm run lint` / `npm run test`；**依赖服务与诊断相关改动优先按「用 Docker 测试」做冒烟**
- 诊断相关须确认：gRPC 可用为真实预测；停 python 为 503，而非假预测
- 交接说明：改了什么、Docker/命令如何验证、未跑的检查与残留风险
