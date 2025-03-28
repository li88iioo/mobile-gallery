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
const { incrementVisits, getVisitStats } = require('./utils/visitCounter');

// 导入路由
const authRoutes = require('./routes/auth');
const phoneRoutes = require('./routes/phones');
const settingsRoutes = require('./routes/settings');
const uploadRoutes = require('./routes/upload');
const pageRoutes = require('./routes/pages');

const app = express();

// 中间件配置
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 获取真实IP地址的中间件
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || 
               req.connection.remoteAddress || 
               req.socket.remoteAddress;
    req.realIp = ip.split(',')[0].trim();
    next();
});

// 访问量统计中间件
app.use((req, res, next) => {
    // 只统计首页访问
    if (req.path === '/' || req.path === '/index.html') {
        incrementVisits(req.realIp);
    }
    next();
});

// 图片外链保护中间件
app.use((req, res, next) => {
    // 检查是否是图片请求
    if (req.path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) && req.path.startsWith('/uploads/')) {
        // 获取referer头
        const referer = req.get('referer') || '';
        const host = req.get('host') || '';
        
        // 允许的来源列表
        const allowedHosts = [
            host,
            'localhost',
            '127.0.0.1',
            process.env.ALLOWED_REFERER || ''
        ].filter(Boolean);
        
        // 检查是否是特殊保护的资源（logo, favicon, 微信二维码）
        const isProtectedResource = 
            req.path.includes('site-logo') || 
            req.path.includes('site-favicon') ||
            req.path.includes('wechat-qrcode');
        
        // 确定是否允许访问
        const isAllowedReferer = allowedHosts.some(allowedHost => 
            referer.includes(allowedHost)
        );
        
        // 特殊保护资源只能从站内访问，且必须有referer
        if (isProtectedResource && (!referer || !isAllowedReferer)) {
            return res.status(403).send('禁止访问受保护资源');
        }
        
        // 普通图片可以没有referer直接访问，但不能从外部网站引用
        if (referer && !isAllowedReferer) {
            return res.status(403).send('禁止外链引用图片');
        }
        
        // 为响应添加额外保护头
        res.setHeader('X-Frame-Options', 'DENY'); // 禁止在frame中加载
        res.setHeader('Content-Security-Policy', "img-src 'self'"); // 只允许从本站加载
        
        // 添加"Cache-Control: no-store"以防止缓存
        if (isProtectedResource) {
            res.setHeader('Cache-Control', 'no-store, max-age=0');
        }
    }
    
    next();
});

// 添加访问量统计API路由
app.get('/api/stats/visits', (req, res) => {
    const stats = getVisitStats();
    res.json(stats);
});

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

// 优化静态文件配置
const cacheSettings = {
    jsCSS: {
        maxAge: parseInt(process.env.STATIC_CACHE_MAX_AGE_JS_CSS) || 86400,
        cacheControl: 'public, max-age=86400, immutable'
    },
    images: {
        maxAge: parseInt(process.env.STATIC_CACHE_MAX_AGE_IMAGES) || 3600,
        cacheControl: 'public, max-age=3600, must-revalidate',
        longLived: 'public, max-age=604800, must-revalidate'
    }
};

// 设置静态文件缓存头
const setStaticHeaders = (contentType) => (res, path) => {
    // 长期缓存的特殊文件
    if (contentType === 'images' && (path.includes('logo') || path.includes('favicon'))) {
        res.setHeader('Cache-Control', cacheSettings.images.longLived);
    } else {
        res.setHeader('Cache-Control', cacheSettings[contentType].cacheControl);
    }
    
    if (contentType === 'images') {
        res.setHeader('Vary', 'Accept-Encoding');
    }
};

// 配置静态目录
const staticPaths = [
    { path: '/js', dir: 'public/js', type: 'jsCSS' },
    { path: '/css', dir: 'public/css', type: 'jsCSS' },
    { path: '/uploads', dir: 'uploads', type: 'images' }
];

// 注册所有静态路径
staticPaths.forEach(({ path: urlPath, dir, type }) => {
    app.use(urlPath, express.static(path.join(__dirname, dir), {
        maxAge: `${cacheSettings[type].maxAge}s`,
        setHeaders: setStaticHeaders(type)
    }));
});

// 注册路由
app.use('/', pageRoutes);
app.use('/api', authRoutes);
app.use('/api', phoneRoutes);
app.use('/api', settingsRoutes);
app.use('/api', uploadRoutes);
// 兼容旧版前端请求，将非API路径的delete-file重定向到API路径
app.post('/delete-file', (req, res) => {
    res.redirect(307, '/api/delete-file');
});

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

module.exports = app; 