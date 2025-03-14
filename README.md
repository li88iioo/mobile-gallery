# Mobile Gallery - 二手机展示平台

> ~~专业的~~二手手机展示解决方案，让卖家轻松展示（偷懒bushi），让买家一目了然。
    
## 项目简介

Mobile Gallery 是一个专为二手手机交易设计的展示平台，通过简洁直观的界面展示在售机型的详细信息，让买家无需反复询问即可了解手机的详细情况，提高交易效率。使用 Express.js 构建的现代化 Web 应用，支持响应式设计，适配各种设备。

## 功能特点

### 核心功能
- 🔍 **详细展示**：成色、配置、维修记录一目了然
- 📱 **多图展示**：支持多角度实拍图片展示，支持全屏查看
- 💰 **价格筛选**：快速筛选不同价位机型
- 🔄 **排序功能**：按价格、名称、成色等多种方式排序
- 📄 **分页功能**：大量数据高效加载
- ⚡ **实时更新**：及时反映手机销售状态
- 🛠️ **简单管理**：便捷的后台管理系统

### 客户端功能
- 浏览所有在售二手机，支持分页加载
- 查看手机详细信息（价格、成色、存储容量等）
- 查看多角度实拍图片，支持图片轮播和全屏查看
- 价格区间筛选（1000元以下/以上）
- 多种排序方式（价格、名称、成色）
- 实时更新手机状态（在售/已售）

### 管理端功能
- 安全的管理员登录系统，支持密码加密存储
- 添加/编辑/删除手机信息
- 上传多张实拍图片
- 标记手机销售状态
- 修改网站标题和Logo
- 查看最后更新时间

## 目录结构

```
.
├── data/               # 数据存储
├── uploads/            # 上传的图片
│   └── images/         # 手机图片
├── views/              # HTML模板
├── js/                 # 前端JavaScript文件
├── css/                # 样式文件
├── routes/             # 路由模块
│   ├── auth.js         # 认证相关路由
│   ├── pages.js        # 页面路由
│   └── phones.js       # 手机数据相关路由
├── utils/              # 工具函数
│   ├── auth.js         # 认证相关工具
│   ├── data.js         # 数据处理工具
│   └── error-handler.js # 错误处理工具
├── server.js           # 主服务器文件
├── Dockerfile          # Docker构建文件
├── docker-compose.yml  # Docker编排配置
├── package.json        # 项目依赖
└── .env                # 环境配置文件
```

## Docker 部署指南

### 1. 环境准备
- Docker 版本 >= 20.10
- Docker Compose 版本 >= 2.0
- 服务器配置：
  - 内存 >= 1GB
  - 硬盘空间 >= 1GB
  - 支持 Linux/Mac/Windows

### 2. 部署步骤

1. 克隆项目：
```bash
git clone [项目地址]
cd mobile-gallery
```

2. 环境配置：
```bash
# 生成新的会话密钥并更新配置
NEW_SECRET=$(openssl rand -base64 32)
sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$NEW_SECRET|" .env

# 确认配置是否正确
cat .env
```

3. 启动服务：
```bash
# 首次启动或重新构建
docker-compose up -d --build

# 后续启动
docker-compose up -d
```

### 3. 环境变量配置

在 `.env` 文件中配置：
```bash
# 应用配置
NODE_ENV=production  # 生产环境
PORT=3888

# 安全配置
SESSION_SECRET=your-secret-key-change-me-in-production
SESSION_MAX_AGE=86400000  # 24小时，单位毫秒

# 缓存配置
STATIC_CACHE_MAX_AGE_JS_CSS=86400  # 1天，单位秒
STATIC_CACHE_MAX_AGE_IMAGES=604800  # 7天，单位秒

# 文件上传配置
MAX_FILE_SIZE=102400  # 100KB，单位字节

# 时区设置
TZ=Asia/Shanghai
```

### 4. 容器管理

#### 基本操作
```bash
# 查看容器状态
docker ps | grep mobile-gallery-web

# 查看容器日志
docker logs mobile-gallery-web

# 重启服务
docker-compose restart

# 停止并删除容器
docker-compose down

# 完全重建
docker-compose down && docker-compose up -d --build
```

#### 容器配置
- 容器名称：mobile-gallery-web
- 端口映射：3888:3888
- 数据卷挂载：
  ```
  ./uploads -> /app/uploads  # 图片存储
  ./data -> /app/data        # 数据存储
  ```

#### 资源限制
- CPU: 最大50%使用率
- 内存: 最大512MB
- 日志: 最大10MB，保留3个文件

### 5. 访问应用
- 展示页面: `http://[你的域名或IP]:3888`
- 管理后台: `http://[你的域名或IP]:3888/login`

## 使用说明

### 客户浏览
1. 直接访问网站首页即可查看所有在售机型
2. 使用排序功能按价格、名称或成色排序
3. 使用价格筛选按钮筛选不同价位的机型
4. 点击任意手机可查看详细信息和实拍图
5. 在详情页可查看多角度图片，支持全屏查看

### 管理员操作
1. 连续点击网站标题5次进入管理登录页
2. 首次登录:
   - 用户名: admin
   - 密码: admin123
3. 登录后可进行:
   - 添加新机型
   - 编辑现有信息
   - 标记销售状态
   - 修改网站设置（标题、Logo）
   - 修改管理员密码

## 安全与维护

### 数据安全
- 定期备份 `data` 和 `uploads` 目录
- 确保 `.env` 文件不被提交到版本控制系统
- SESSION_SECRET 定期更换
- 首次登录后立即修改默认密码
- 所有密码使用 PBKDF2 算法加盐哈希存储

### 运维建议
- 监控容器资源使用情况
- 定期检查和更新依赖包
- 查看日志是否有异常
- 生产环境部署前检查所有安全配置
- 使用 HTTPS 保护传输数据（需额外配置）

## 性能优化

- **静态资源缓存**：JS/CSS 文件缓存1天，图片缓存7天
- **分页加载**：大量数据分页显示，减少初始加载时间
- **图片优化**：限制上传图片大小，减少带宽占用
- **Docker 多阶段构建**：减小镜像体积，提高启动速度
- **错误处理**：全局错误处理机制，提高系统稳定性

## 常见问题

### Q: 如何修改默认端口？
A: 在 `.env` 文件中修改 `PORT` 值，同时更新 `docker-compose.yml` 中的端口映射。

### Q: 如何增加上传图片的大小限制？
A: 在 `.env` 文件中修改 `MAX_FILE_SIZE` 值（单位为字节）。

### Q: 忘记管理员密码怎么办？
A: 删除 `data/config.json` 文件，系统将重置为初始状态，使用默认账号密码登录。

### Q: 如何备份数据？
A: 备份 `data` 和 `uploads` 目录即可保存所有数据和图片。

### Q: 上传Logo或Favicon失败怎么办？
A: 这通常是由于权限问题导致的。请尝试以下解决方案：

1. **手动设置权限**：
   ```bash
   # Linux/Mac
   chmod -R 777 uploads/images
   
   # Windows (在Docker容器中执行)
   docker compose exec web chmod -R 777 /app/uploads
   ```

2. **重建容器**：
   ```bash
   docker compose down
   docker compose up -d --build
   ```

3. **权限说明**：
   - 0447: 所有者无权限，组和其他人有读权限，所有人有执行权限（推荐）
   - 0777: 所有用户都有读、写、执行权限（不推荐，除非其他方法不起作用）

### 页面展示
！
<img src="https://cloudflare.free-img.ososo.org/file/1741970399052_192.168.88.110_3888_(iPhone SE).png" alt="192.168.88.110_3888_(iPhone SE).png" width=30% />
<img src="https://cloudflare.free-img.ososo.org/file/1741970401546_192.168.88.110_3888_admin(iPhone 14 Pro Max).png" alt="192.168.88.110_3888_admin(iPhone 14 Pro Max).png" width=30% />
