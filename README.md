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

### 2. 部署步骤

1. 克隆仓库
   ```bash
   git clone https://github.com/li88iioo/mobile-gallery.git
   cd mobile-gallery
   ```

2. 创建并编辑环境配置文件
   ```bash
   nano .env
   # 编辑.env文件，设置环境变量
   ```
   
   推荐的环境变量配置：
   ```bash
   # 应用配置
   NODE_ENV=production  # 生产环境
   PORT=3888
   
   # 安全配置 - 建议生成随机密钥
   SESSION_SECRET=your-secret-key-change-me-in-production
   SESSION_MAX_AGE=86400000  # 会话（session）的最大存活时间，单位是毫秒 -24小时
   
   # 缓存配置
   STATIC_CACHE_MAX_AGE_JS_CSS=86400  # JS缓存 1天，单位秒
   STATIC_CACHE_MAX_AGE_IMAGES=86400   # 图片缓存 1小时，单位秒
   
   # 文件上传配置
   MAX_FILE_SIZE=102400  # 100KB，单位字节
   
   # 时区设置
   TZ=Asia/Shanghai
   ```
   
   生成随机会话密钥（推荐）：
   ```bash
   # 生成新的会话密钥并更新配置
   NEW_SECRET=$(openssl rand -base64 32)
   sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$NEW_SECRET|" .env
   
   # 确认配置是否正确
   cat .env
   ```

3. 部署选项一 - 使用部署脚本(推荐)
   ```bash
   # 给部署脚本添加执行权限
   chmod +x deploy.sh
   
   # 运行部署脚本
   ./deploy.sh
   ```

4. 部署选项二 - 手动部署
   ```bash
   # 停止旧容器
   docker-compose down
   
   # 删除旧数据目录（如需重置）
   rm -rf data uploads
   
   # 创建数据目录并设置权限
   mkdir -p data uploads/images
   chmod -R 755 data uploads
   
   # 构建并启动容器
   docker-compose up -d --build
   ```

5. 访问网站
   默认端口为3888，访问 `http://your-server-ip:3888` 即可打开网站。

### 3. 权限说明

本项目在Docker容器内以root用户运行，因此不需要特殊的权限设置。如果您遇到权限问题，请检查以下几点：

1. 确保宿主机上的`data`和`uploads`目录有正确的权限：
   ```bash
   chmod -R 755 data uploads
   ```

2. 如果您是直接在宿主机上运行（非Docker环境），可能需要更宽松的权限：
   ```bash
   chmod -R 777 data uploads  # 非Docker环境下，仅用于测试
   ```

3. 部署脚本会自动处理权限问题，推荐使用部署脚本进行部署。

## 常用操作指南

### 后台访问与初始化

1. 访问后台: `http://your-server-ip:3888/admin`
2. 首次登录:
   - 用户名: admin
   - 密码: admin123
3. 登录后可进行:
   - 添加新机型
   - 编辑现有信息
   - 标记销售状态
   - 修改网站设置（标题、Logo）
   - 修改管理员密码

### 网站设置

管理员可以在后台修改以下网站设置：

1. **网站标题**: 更改显示在浏览器标签和网站头部的名称
2. **网站Logo**: 上传自定义Logo图片（建议尺寸: 200x60px, 限制100KB）
3. **网站图标(Favicon)**: 上传自定义浏览器图标（建议尺寸: 32x32px或16x16px, 限制100KB）

这些设置会保存到服务器的`data/config.json`文件中。

### 添加/编辑产品

在后台添加或编辑产品时：

1. 点击"添加新机型"或产品卡片上的"编辑"按钮
2. 填写表单，包括名称、价格、成色等信息
3. 上传主图和详情图（支持多图）
4. 点击"添加产品"或"更新产品"按钮保存


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

- **智能缓存策略**：
  - JS/CSS 文件缓存1天，提高页面加载速度
  - 图片使用智能缓存，未修改时利用浏览器缓存，修改后自动更新
  - Logo和Favicon缓存7天，但使用ETag机制确保修改后及时更新
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

### Q: 上传Logo或修改网站设置后不显示怎么办？
A: 这可能是由于浏览器缓存导致的，请尝试以下解决方案：

1. **强制刷新浏览器**:
   - Windows: `Ctrl + F5`
   - Mac: `Command + Shift + R`
   
2. **清除浏览器缓存**:
   - 打开浏览器设置 -> 清除浏览数据 -> 选择"缓存的图片和文件"
   
3. **重启容器**:
   ```bash
   docker-compose restart web
   ```

4. **查看日志**:
   ```bash
   docker logs mobile-gallery-web
   ```

### Q: 添加或编辑产品时找不到表单怎么办？
A: 编辑产品时页面会自动滚动到表单区域，如果没有自动滚动，请手动向下滚动页面，或尝试刷新页面再试。

## 页面展示
<img src="https://cloudflare.free-img.ososo.org/file/1741970399052_192.168.88.110_3888_(iPhone SE).png" alt="192.168.88.110_3888_(iPhone SE).png" width=30% />
<img src="https://cloudflare.free-img.ososo.org/file/1741970401546_192.168.88.110_3888_admin(iPhone 14 Pro Max).png" alt="192.168.88.110_3888_admin(iPhone 14 Pro Max).png" width=30% />

## 联系与支持

如遇问题，请通过以下方式获取支持：
- 提交 Issue: [GitHub Issues](https://github.com/li88iioo/mobile-gallery/issues)
