# 构建阶段
FROM node:16-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖，因为需要用来构建）
RUN npm ci

# 复制所有源代码
COPY . .

# 构建前端资源（CSS和JS压缩）
RUN npm run build

# 运行阶段 - 使用更轻量的镜像
FROM node:16-alpine

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 从构建阶段复制构建后的资源和源代码
COPY --from=builder /app/src ./src

# 创建数据和上传目录并设置权限
RUN mkdir -p src/data src/uploads/images && \
    chmod -R 755 src/data src/uploads

# 暴露端口
EXPOSE 3888

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3888/ || exit 1

# 启动应用
CMD ["node", "src/server.js"] 