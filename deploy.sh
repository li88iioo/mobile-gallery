#!/bin/bash

# 拉取最新代码
git pull

# 停止并删除现有容器
docker-compose down

# 删除现有的data和uploads目录
rm -rf data uploads

# 创建必要的目录并设置权限
mkdir -p data uploads/images
chmod -R 755 data uploads

# 创建必要的文件并设置权限
touch data/phones.json data/config.json
chmod 644 data/phones.json data/config.json

# 构建和启动容器
docker-compose up -d --build

# 等待容器启动
sleep 5

# 确保容器内的权限正确
docker exec mobile-gallery-web chmod -R 755 /app/data /app/uploads 