# 构建阶段
FROM node:16-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json（如果存在）
COPY package*.json ./

# 安装依赖
RUN npm install --only=production

# 最终阶段
FROM node:16-alpine

# 安装dos2unix工具
RUN apk add --no-cache dos2unix

# 设置工作目录
WORKDIR /app

# 从构建阶段复制node_modules
COPY --from=builder /app/node_modules ./node_modules

# 复制应用代码
COPY . .

# 修复文件编码和行尾符问题
RUN dos2unix server.js && \
    dos2unix utils/*.js && \
    dos2unix routes/*.js

# 创建数据和上传目录并设置正确的权限
RUN mkdir -p data uploads/images && \
    chmod -R 755 data uploads && \
    chown -R root:root /app

# 暴露端口
EXPOSE 3888

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --spider -q http://localhost:3888/ || exit 1

# 启动应用
CMD ["node", "server.js"]