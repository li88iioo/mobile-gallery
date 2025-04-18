# 二手机展示平台

一个专为二手手机展示设计的响应式网站平台，让卖家轻松展示（偷懒bushi），让买家一目了然。
前端采用原生JavaScript和Tailwind CSS，后端基于Node.js和Express。

![入门级](https://img.shields.io/badge/难度-入门级-brightgreen)
![Node.js 16+](https://img.shields.io/badge/Node.js-16%2B-brightgreen)
![响应式](https://img.shields.io/badge/设计-响应式-blue)
![中文](https://img.shields.io/badge/语言-中文-red)

## 功能特点

- 🖥️ **响应式设计**：完美适配手机、平板和桌面设备
- 📱 **手机展示**：美观的卡片式手机展示界面
- 🔍 **详情查看**：支持点击查看手机详细信息和图片
- 🔒 **管理后台**：安全的管理界面，支持添加、编辑和删除手机
- 📊 **访问统计**：记录并展示网站访问量
- 🌙 **定制设置**：自定义网站标题、Logo和图标
- 🔄 **便捷管理**：直观的上传和管理功能
- 📱 **图片优化**：内置商品图片缓存和懒加载功能

## 部署指南

### 系统要求

- Node.js 16.0 或更高版本
- NPM 7.0 或更高版本
- 支持静态文件的Web服务器（如果使用反向代理）
- Docker 20.10.0+ 和 Docker Compose v2+（如果使用Docker部署）

### 部署步骤

#### 方式一：开发环境直接运行

适合开发和测试使用，操作简单便捷。

1. **获取项目代码**
```bash
# 克隆仓库
git clone https://github.com/li88iioo/mobile-gallery.git

# 进入项目目录
cd mobile-gallery
```

2. **安装依赖**
```bash
# 安装项目依赖
npm install
```

3. **配置环境变量**
```bash
# 编辑环境变量
nano .env  # 或使用任何文本编辑器
```

4. **启动应用**
```bash
# 开发模式（带热重载）
npm run dev

# 或者生产模式（不带热重载）
npm start
```

访问：`http://localhost:3888` 或您配置的端口

#### 方式二：构建生产环境版本

适合正式部署到生产服务器，代码经过压缩优化，性能更佳。

1. **获取并准备项目代码**
```bash
# 克隆仓库
git clone https://github.com/li88iioo/mobile-gallery.git

# 进入项目目录
cd mobile-gallery

# 安装开发依赖（用于构建）
npm install
```

2. **构建生产环境版本**
```bash
# 运行生产环境构建脚本
npm run build:production
```

此命令将：
- 创建一个新的生产环境目录（`../mobile-gallery-production`）
- 复制所有必要的文件到生产目录
- 压缩所有JS和CSS文件以提高性能
- 排除不需要的开发文件（如测试文件、构建脚本等）

3. **进入生产目录并安装依赖**
```bash
# 进入生产目录
cd ../mobile-gallery-production

# 仅安装生产环境所需依赖
npm install --production
```

4. **配置环境变量**
```bash
# 编辑环境变量（生产目录中已包含.env文件）
nano .env
```

5. **启动生产应用**
```bash
# 启动应用
npm start
```

访问：`http://localhost:3888` 或您配置的端口

### 环境变量配置

无论采用哪种部署方式，都需要正确配置环境变量：

```
# 应用配置
NODE_ENV=production  # 生产环境模式
PORT=3888            # 应用监听端口

# 安全配置 - 重要：生产环境务必修改SESSION_SECRET
SESSION_SECRET=your-secret-key-change-me-in-production
SESSION_MAX_AGE=86400000  # 会话有效期，24小时

# 缓存配置
STATIC_CACHE_MAX_AGE_JS_CSS=86400  # JS和CSS文件缓存时间，1天
STATIC_CACHE_MAX_AGE_IMAGES=604800  # 图片文件缓存时间，7天

# 文件上传配置
MAX_FILE_SIZE=5242880  # 最大文件上传大小，5MB

# 时区设置
TZ=Asia/Shanghai  # 服务器时区
```

**安全提示**：强烈建议为SESSION_SECRET生成随机密钥：

```bash
# 生成新的会话密钥并更新配置
NEW_SECRET=$(openssl rand -base64 32)
sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=$NEW_SECRET|" .env
```

### Docker Compose部署（可选）

如果您希望使用Docker来简化部署流程，请按照以下步骤操作：

```bash
# 克隆仓库
git clone https://github.com/li88iioo/mobile-gallery.git

# 进入项目目录
cd mobile-gallery
# 配置环境变量
nano .env

# 构建并启动容器
docker-compose up -d
```
或使用生产版本

## 首次访问设置

1. 访问网站首页：`http://您的服务器IP:3888` 或 `https://您的域名`
2. 访问管理页面：`http://您的服务器IP:3888/admin` 或 `https://您的域名/admin`
3. 首次访问管理页面时，系统会引导您设置管理员账号和密码

#### 5. 备份数据

Docker数据持久化存储在：
- `./src/data`：配置和产品数据 
- `./src/uploads`：上传的图片文件

定期备份这两个目录，即可保证数据安全。

### 首次访问设置

1. 访问网站首页：`http://您的服务器IP:3888` 或 `https://您的域名`
2. 访问管理页面：`http://您的服务器IP:3888/admin` 或 `https://您的域名/admin`
3. 首次访问管理页面时，系统会引导您设置管理员账号和密码

## 使用指南

### 商品管理

1. 登录管理后台
2. 点击"添加商品"按钮，填写商品信息
3. 上传商品图片（支持多张图片，第一张为主图）
4. 修改商品：在商品列表中点击对应商品
5. 删除商品：在商品编辑页中点击"删除"按钮

### 网站设置

在管理后台中：

1. 点击侧边栏的"网站设置"选项
2. 可自定义网站标题、Logo和网站图标
3. 保存设置后即时生效

## 目录结构说明

项目采用了MVC架构模式，目录结构如下：

```
mobile-gallery/
├── src/                # 源代码
│   ├── data/           # 数据存储目录
│   │   └── config.json # 配置文件
│   ├── public/         # 静态资源
│   │   ├── css/        # CSS文件
│   │   │   ├── index.css        # 主要样式文件
│   │   │   ├── input.css        # Tailwind入口文件
│   │   │   └── tailwind.css     # 编译后的Tailwind CSS
│   │   └── js/         # JavaScript文件
│   │       ├── index.js         # 首页脚本
│   │       ├── index.min.js     # 压缩后的首页脚本
│   │       ├── admin.js         # 管理界面脚本
│   │       ├── admin.min.js     # 压缩后的管理界面脚本
│   │       ├── login.js         # 登录页脚本
│   │       └── login.min.js     # 压缩后的登录页脚本
│   ├── routes/         # 路由处理
│   │   ├── auth.js     # 认证相关路由
│   │   ├── phones.js   # 手机数据相关路由
│   │   ├── settings.js # 网站设置相关路由
│   │   ├── upload.js   # 文件上传相关路由
│   │   └── pages.js    # 页面渲染路由
│   ├── uploads/        # 文件上传目录
│   │   └── images/     # 上传的图片存储位置
│   ├── utils/          # 工具函数
│   │   ├── auth.js     # 认证相关工具
│   │   ├── data.js     # 数据处理工具
│   │   ├── error-handler.js  # 错误处理工具
│   │   └── visitCounter.js   # 访问统计工具
│   ├── views/          # 前端HTML模板
│   ├── app.js          # Express应用配置
│   └── server.js       # 服务器入口文件
├── scripts/  
│   ├── build-production.js          #用于创建生产环境的构建脚本
│   ├── postcss.config.js          #用于开发过程中的CSS压缩配置
├── package.json        # 项目依赖和配置
├── package-lock.json   # 依赖版本锁定
├── .env                # 环境变量
├── .gitignore          # Git忽略文件
├── Dockerfile          # Docker构建文件
├── docker-compose.yml  # Docker Compose配置
└── tailwind.config.js  # Tailwind CSS配置
```

## API接口文档

系统提供了完整的RESTful API，主要接口包括：

### 认证接口

- `POST /api/login`: 登录
- `POST /api/change-password`: 修改密码
- `GET /api/password-status`: 检查密码状态
- `POST /api/logout`: 登出
- `GET /api/check-auth`: 检查登录状态

### 产品管理接口

- `GET /api/phones`: 获取手机数据，支持分页和排序
- `POST /api/phone`: 添加手机
- `PUT /api/phone/:id`: 更新手机信息
- `DELETE /api/phone/:id`: 删除手机
- `GET /api/last-edit-time`: 获取最后编辑时间

### 设置接口

- `GET /api/settings`: 获取网站设置
- `POST /api/settings`: 保存网站设置
- `POST /api/settings/title`: 保存网站标题

### 文件管理接口

- `POST /api/upload-image`: 上传图片
- `POST /api/delete-file`: 删除文件

### 统计接口

- `GET /api/stats/visits`: 获取访问统计

## 常见问题解答

**Q: 如何备份数据？**

A: 所有数据存储在`src/data`目录下的JSON文件中，定期备份该目录即可。使用Docker部署时，这些目录已通过卷(volumes)映射到宿主机。

**Q: 如何更改端口号？**

A: 修改`.env`文件中的`PORT`值，然后重启应用。如果使用Docker部署，docker-compose.yml已配置为自动使用.env中的端口值。

**Q: 如何重置管理员密码？**

A: 编辑`src/data/config.json`文件，删除`adminPassword`字段，然后重启应用。系统会提示您重新设置密码。


