-- 启用 uuid-ossp 扩展用于生成 UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 设置默认时区
SET timezone = 'Asia/Shanghai';

-- 确保数据库使用UTF-8字符集
ALTER DATABASE vibe_db SET client_encoding = 'UTF8';
