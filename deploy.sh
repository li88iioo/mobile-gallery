#!/bin/bash

# 拉取最新代码
git pull

# 创建必要的目录
mkdir -p data uploads/images

# 设置权限
chmod -R 777 data uploads
touch data/phones.json data/config.json
chmod 777 data/phones.json data/config.json

# 构建和启动容器
docker-compose up -d --build 