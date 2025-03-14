const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
const { chmod } = require('fs').promises;
// 添加dotenv以加载环境变量
require('dotenv').config();

// 导入工具函数
const { ensureConfig } = require('./utils/auth');
const { ensureDataDirectory } = require('./utils/data');
const { handle404, globalErrorHandler } = require('./utils/error-handler');

// 导入路由
const authRoutes = require('./routes/auth');
const phoneRoutes = require('./routes/phones');
const pageRoutes = require('./routes/pages');

const app = express();
const port = process.env.PORT || 3888;

// 中间件配置
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session配置
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    name: 'connect.sid',
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000
    }
}));

// 静态文件服务
app.use('/js', express.static(path.join(__dirname, 'js'), {
    maxAge: `${process.env.STATIC_CACHE_MAX_AGE_JS_CSS || 86400}s`, // 默认缓存1天
    etag: true
}));
app.use('/css', express.static(path.join(__dirname, 'css'), {
    maxAge: `${process.env.STATIC_CACHE_MAX_AGE_JS_CSS || 86400}s`, // 默认缓存1天
    etag: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    maxAge: `${process.env.STATIC_CACHE_MAX_AGE_IMAGES || 604800}s`, // 默认缓存7天
    etag: true
}));
app.use(express.static(path.join(__dirname, 'views')));

// 注册路由
app.use('/', pageRoutes);
app.use('/api', authRoutes);
app.use('/api', phoneRoutes);

// 处理所有未定义的路由 - 放在所有其他路由之后
app.get('*', (req, res) => {
    // 如果是API请求，返回404
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API不存在' });
    }
    // 其他所有请求重定向到首页
    res.redirect('/');
});

// 处理 404 错误
app.use(handle404);

// 处理其他错误
app.use(globalErrorHandler);

// 检查并修复权限的函数
async function checkAndFixPermissions() {
    const dirs = ['data', 'uploads', 'uploads/images'];
    const files = ['data/phones.json', 'data/config.json'];
    
    try {
        // 检查并创建目录
        for (const dir of dirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
            }
            await chmod(dir, 0o777);
        }
        
        // 检查并创建文件
        for (const file of files) {
            try {
                await fs.access(file);
            } catch {
                await fs.writeFile(file, '{}');
            }
            await chmod(file, 0o777);
        }
        
        console.log('权限检查和修复完成');
    } catch (error) {
        console.error('权限检查和修复失败:', error);
    }
}

// 在服务器启动时执行
(async () => {
    try {
        await checkAndFixPermissions();
        await ensureDataDirectory();
        await ensureConfig();
        console.log('数据目录和文件初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
    }
})();

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
});
