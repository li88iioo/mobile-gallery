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

// 配置文件上传
const storage = multer.diskStorage({
    destination: async function (req, file, cb) {
        const uploadPath = path.join(__dirname, '..', 'uploads', 'images');
        try {
            await fs.access(uploadPath);
            console.log(`上传目录存在: ${uploadPath}`);
        } catch (error) {
            console.log(`创建上传目录: ${uploadPath}`);
            try {
                await fs.mkdir(uploadPath, { recursive: true });
            } catch (mkdirError) {
                console.error(`创建目录失败: ${mkdirError.message}`);
                return cb(mkdirError);
            }
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // 获取文件扩展名
        const ext = path.extname(file.originalname);
        // 生成文件名：类型-时间戳.扩展名
        const filename = `${req.body.type || 'image'}-${Date.now()}${ext}`;
        console.log(`生成文件名: ${filename}`);
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 // 默认500KB
    },
    fileFilter: function (req, file, cb) {
        // 检查文件类型
        console.log(`上传文件类型: ${file.mimetype}`);
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            console.error(`文件类型不允许: ${file.mimetype}`);
            cb(new Error('只允许上传图片文件！'));
        }
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