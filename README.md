# Vibe Todo 项目

一个使用 Next.js 15+ 和原生 SQL 构建的 Todo 应用，不依赖任何 ORM。

## 技术栈

- **Framework**: Next.js 15+ (App Router)
- **DB Driver**: `postgres` (轻量、现代的 PG 驱动)
- **Validation**: `zod` (用于验证 API 输入和定义数据类型)
- **UI**: Tailwind CSS + shadcn/ui (预留)
- **API Logic**: 直接在 API Route 中编写 SQL 语句

## 环境要求

- **Node.js**: v18+ 或更高版本
- **Docker**: 用于运行本地 PostgreSQL 数据库
- **npm**: 包管理工具

## 启动步骤

### 1. 克隆项目

```bash
git clone <项目地址>
cd vibe_codeing
```

### 2. 安装依赖

使用淘宝 npm 源加速安装：

```bash
npm install --registry https://registry.npmmirror.com
```

### 3. 配置环境变量

复制 `.env.example` 文件为 `.env`：

```bash
cp .env.example .env
```

默认配置如下：

```
DATABASE_URL=postgres://vibe_user:vibe_password@localhost:5432/vibe_db
```

### 4. 启动 Docker 容器

确保 Docker 已安装并运行，然后启动 PostgreSQL 容器：

```bash
docker-compose up -d
```

**注意**：如果遇到 Docker 镜像拉取缓慢的问题，可以配置 Docker 镜像加速：

1. 登录阿里云容器镜像服务控制台
2. 进入"镜像加速器"页面
3. 复制加速器地址（如 https://xxxx.mirror.aliyuncs.com）
4. 在 Docker Desktop 中配置该地址
5. 重启 Docker 服务

### 5. 初始化数据库

执行 schema.sql 文件创建 todos 表：

```bash
# Windows PowerShell
get-content db/schema.sql | docker exec -i vibe_postgres psql -U vibe_user -d vibe_db

# Linux/macOS
docker exec -i vibe_postgres psql -U vibe_user -d vibe_db < db/schema.sql
```

### 6. 启动开发服务器

```bash
npm run dev
```

开发服务器将运行在 `http://localhost:3000`

## API 接口文档

### Swagger UI 文档

项目集成了 Swagger UI，提供了交互式的 API 文档界面：

- **访问地址**：`http://localhost:3000/api/swagger-ui`
- **功能**：
  - 查看所有 API 接口
  - 测试 API 接口
  - 查看请求和响应格式

### API 端点

- **GET /api/todos** - 获取所有 todo 列表
- **POST /api/todos** - 创建新的 todo

## 测试方法

### 运行 API 测试

#### 使用前端测试页面

启动开发服务器后，访问 `http://localhost:3000` 即可使用前端测试页面，该页面提供了直观的界面来测试 Todo API：

- **创建 Todo**：在表单中输入标题，选择是否完成，然后点击 "创建 Todo" 按钮
- **查看 Todo 列表**：页面会自动加载所有 Todo，并按创建时间倒序排列
- **刷新列表**：点击 "刷新列表" 按钮可以手动刷新 Todo 列表

#### 使用脚本测试

使用 `test-api.js` 脚本测试 API 接口：

```bash
node test-api.js
```

### 运行数据库测试

使用 `test-db.js` 脚本测试数据库操作：

```bash
node test-db.js
```

## 项目结构

```
├── app/
│   └── api/
│       ├── todos/
│       │   └── route.ts     # Todo API 路由
│       ├── swagger/
│       │   └── route.ts     # Swagger 规范生成接口
│       └── swagger-ui/
│           └── route.ts     # Swagger UI 页面
├── db/
│   ├── client.ts            # 数据库客户端封装
│   ├── init.sql             # 数据库初始化脚本
│   └── schema.sql           # 数据库表结构定义
├── lib/
│   └── validators.ts        # Zod Schema 定义
├── tests/
│   └── db.test.ts           # 数据库测试脚本
├── public/
│   └── swagger-ui.html      # Swagger UI 静态页面
├── .env                     # 环境变量配置
├── .env.example             # 环境变量示例
├── docker-compose.yml       # Docker 配置
├── package.json             # 项目依赖和脚本
├── tsconfig.json            # TypeScript 配置
└── next-env.d.ts            # Next.js 类型声明
```

## 常见问题排查

### 1. Docker 容器启动失败

- 检查 Docker 是否已启动
- 检查端口 5432 是否已被占用
- 尝试重新拉取镜像：`docker-compose pull`

### 2. 数据库连接失败

- 检查 Docker 容器是否正在运行：`docker ps`
- 检查环境变量配置是否正确
- 检查数据库初始化是否成功

### 3. API 接口返回 500 错误

- 查看控制台日志，了解具体错误信息
- 检查数据库连接是否正常
- 检查 SQL 语句是否正确

### 4. 依赖安装失败

- 尝试使用淘宝 npm 源：`npm install --registry https://registry.npmmirror.com`
- 检查网络连接是否正常

## 停止服务

### 停止开发服务器

按 `Ctrl+C` 停止开发服务器。

### 停止 Docker 容器

```bash
docker-compose down
```
