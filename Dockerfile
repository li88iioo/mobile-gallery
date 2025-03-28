FROM node:16-alpine

WORKDIR /app

# 复制所有文件 (包括已经构建好的CSS/JS文件)
COPY . .

# 只安装生产依赖
RUN npm ci --only=production

# 创建必要的目录并设置权限
RUN mkdir -p src/data src/uploads/images && \
    chmod -R 755 src/data src/uploads src/public

# 暴露端口
EXPOSE 3888

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3888/ || exit 1

# 启动应用
CMD ["npm", "start"] 