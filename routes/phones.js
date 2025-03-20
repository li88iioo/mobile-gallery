const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { requireLogin } = require('../utils/auth');
const { readPhones, savePhones, getLastEditTime } = require('../utils/data');

// 获取手机数据
router.get('/phones', async (req, res) => {
    try {
        const data = await readPhones();
        let phones = data.phones || [];
        
        // 确保价格是数字类型
        phones = phones.map(phone => ({
            ...phone,
            price: parseFloat(phone.price) // 确保价格是数字
        }));
        
        // 排序参数
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
        
        // 应用排序
        if (sortBy) {
            phones = phones.sort((a, b) => {
                let valueA = a[sortBy];
                let valueB = b[sortBy];
                
                // 处理数字类型
                if (sortBy === 'price') {
                    valueA = parseFloat(valueA) || 0;
                    valueB = parseFloat(valueB) || 0;
                }
                
                // 处理字符串类型
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortOrder === 'asc' 
                        ? valueA.localeCompare(valueB, 'zh-CN') 
                        : valueB.localeCompare(valueA, 'zh-CN');
                }
                
                // 处理数字和其他类型
                return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
            });
        }
        
        // 分页参数
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        
        const results = {};
        
        // 添加分页元数据
        if (endIndex < phones.length) {
            results.next = {
                page: page + 1,
                limit: limit
            };
        }
        
        if (startIndex > 0) {
            results.previous = {
                page: page - 1,
                limit: limit
            };
        }
        
        results.total = phones.length;
        results.totalPages = Math.ceil(phones.length / limit);
        results.currentPage = page;
        
        // 如果请求中包含分页参数，则返回分页数据
        if (req.query.page || req.query.limit) {
            results.phones = phones.slice(startIndex, endIndex);
            res.json(results);
        } else {
            // 否则返回所有数据（保持向后兼容）
            res.json(phones);
        }
    } catch (error) {
        console.error('读取产品数据失败:', error);
        res.status(500).json({ error: '读取产品数据失败' });
    }
});

// 保存手机数据
router.post('/phones', requireLogin, async (req, res) => {
    try {
        await savePhones(req.body);
        res.json({ success: true });
    } catch (error) {
        console.error('保存产品数据失败:', error);
        res.status(500).json({ error: '保存产品数据失败' });
    }
});

// 获取最后编辑时间
router.get('/last-edit-time', async (req, res) => {
    try {
        const lastEditTime = await getLastEditTime();
        res.json({ lastEditTime });
    } catch (error) {
        console.error('获取最后编辑时间失败:', error);
        res.status(500).json({ error: '获取最后编辑时间失败' });
    }
});

// 获取网站设置
router.get('/settings', async (req, res) => {
    try {
        const configPath = path.join(__dirname, '..', 'data', 'config.json');
        const configData = await fs.readFile(configPath, 'utf8').catch(() => '{}');
        const config = JSON.parse(configData);
        
        // 计算配置数据的ETag
        const etag = require('crypto').createHash('md5').update(configData).digest('hex');
        
        // 检查客户端发送的If-None-Match头部
        if (req.headers['if-none-match'] === etag) {
            return res.status(304).end();
        }
        
        res.setHeader('ETag', etag);
        res.setHeader('Cache-Control', 'must-revalidate');
        
        res.json({
            title: config.siteTitle || '二手机展示',
            logo: config.siteLogo || '',
            favicon: config.siteFavicon || ''
        });
    } catch (error) {
        console.error('获取设置失败:', error);
        res.status(500).json({ error: '获取设置失败' });
    }
});

// 保存网站设置
router.post('/save-settings', requireLogin, async (req, res) => {
    try {
        const { title, logo, favicon } = req.body;
        const configPath = path.join(__dirname, '..', 'data', 'config.json');
        
        // 读取现有配置
        const configData = await fs.readFile(configPath, 'utf8').catch(() => '{}');
        const config = JSON.parse(configData);
        
        // 更新配置
        config.siteTitle = title;
        config.siteLogo = logo || '';
        config.siteFavicon = favicon || '';
        
        // 确保data目录存在
        await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true }).catch(() => {});
        
        // 保存配置
        await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
        
        res.json({ success: true, message: '设置已保存' });
    } catch (error) {
        console.error('保存设置失败:', error);
        res.status(500).json({ error: '保存设置失败' });
    }
});

// 配置文件上传
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'images');
        await fs.mkdir(uploadPath, { recursive: true }).catch(() => {});
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const filename = `${req.body.type || 'image'}-${Date.now()}${ext}`;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 // 默认500KB
    },
    fileFilter: function (req, file, cb) {
        // 只允许上传图片文件
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('只允许上传图片文件'));
        }
        cb(null, true);
    }
});

// 文件上传路由
router.post('/upload-image', requireLogin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            console.error('没有文件被上传');
            return res.status(400).json({ error: '没有文件被上传' });
        }

        console.log(`文件上传成功: ${req.file.filename}`);
        // 返回文件的URL路径
        const fileUrl = `/uploads/images/${req.file.filename}`;
        res.json({ url: fileUrl });

    } catch (error) {
        console.error('文件上传失败:', error);
        res.status(500).json({ error: `文件上传失败: ${error.message}` });
    }
});

module.exports = router; 