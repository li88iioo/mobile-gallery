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

// 图片外链保护中间件 - 修改为更模块化的结构
const imageProtectionMiddleware = (() => {
    // 检查请求是否针对图片资源
    const isImageRequest = (path) => {
        return path.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i) && path.startsWith('/uploads/');
    };
    
    // 检查是否是特殊保护的资源
    const isProtectedResource = (path) => {
        return path.includes('site-logo') || 
               path.includes('site-favicon') ||
               path.includes('wechat-qrcode');
    };
    
    // 验证引用来源是否允许
    const isAllowedReferer = (referer, host, allowedHosts) => {
        if (!referer) return false;
        return allowedHosts.some(allowedHost => referer.includes(allowedHost));
    };
    
    // 设置安全响应头
    const setSecurityHeaders = (res, isProtected) => {
        // 基本安全头
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Content-Security-Policy', "img-src 'self'");
        
        // 对特殊保护资源禁用缓存
        if (isProtected) {
            res.setHeader('Cache-Control', 'no-store, max-age=0');
        }
    };
    
    // 返回实际中间件函数
    return (req, res, next) => {
        // 仅处理图片请求
        if (!isImageRequest(req.path)) {
            return next();
        }
        
        // 获取请求信息
        const referer = req.get('referer') || '';
        const host = req.get('host') || '';
        
        // 允许的来源列表
        const allowedHosts = [
            host,
            'localhost',
            '127.0.0.1',
            process.env.ALLOWED_REFERER || ''
        ].filter(Boolean);
        
        const protectedResource = isProtectedResource(req.path);
        const allowedReferer = isAllowedReferer(referer, host, allowedHosts);
        
        // 特殊保护资源的访问检查
        if (protectedResource && (!referer || !allowedReferer)) {
            return res.status(403).send('禁止访问受保护资源');
        }
        
        // 普通图片的外链检查
        if (referer && !allowedReferer) {
            return res.status(403).send('禁止外链引用图片');
        }
        
        // 设置必要的安全头
        setSecurityHeaders(res, protectedResource);
        
        next();
    };
})();

// 使用图片保护中间件
app.use(imageProtectionMiddleware);

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