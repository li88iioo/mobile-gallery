const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs'); // 添加同步fs模块
const { requireLogin } = require('../utils/auth');
const { readPhones, savePhones, getLastEditTime } = require('../utils/data');

// 获取手机数据
router.get('/phones', async (req, res) => {
    try {
        const data = await readPhones();
        let phones = Array.isArray(data.phones) ? data.phones : [];
        
        // 确保价格是数字类型
        phones = phones.map(phone => ({
            ...phone,
            price: parseFloat(phone.price) || 0 // 确保价格是数字且无效值转为0
        }));
        
        // 排序处理
        const sortBy = req.query.sortBy;
        const sortOrder = req.query.sortOrder === 'desc' ? 'desc' : 'asc';
        
        if (sortBy) {
            phones.sort((a, b) => {
                let valueA = a[sortBy];
                let valueB = b[sortBy];
                
                // 数值型字段的处理
                if (sortBy === 'price') {
                    valueA = parseFloat(valueA) || 0;
                    valueB = parseFloat(valueB) || 0;
                }
                
                // 字符串比较
                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    return sortOrder === 'asc' 
                        ? valueA.localeCompare(valueB, 'zh-CN') 
                        : valueB.localeCompare(valueA, 'zh-CN');
                }
                
                // 数字比较
                return sortOrder === 'asc' ? valueA - valueB : valueB - valueA;
            });
        }
        
        // 分页处理
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = phones.length;
        const totalPages = Math.ceil(total / limit);
        
        // 返回结果构造
        if (req.query.page || req.query.limit) {
            // 分页响应
            const results = {
                phones: phones.slice(startIndex, endIndex),
                total,
                totalPages,
                currentPage: page
            };
            
            // 添加分页元数据
            if (endIndex < total) {
                results.next = { page: page + 1, limit };
            }
            
            if (startIndex > 0) {
                results.previous = { page: page - 1, limit };
            }
            
            res.json(results);
        } else {
            // 不分页，返回所有数据
            res.json(phones);
        }
    } catch (error) {
        console.error('读取产品数据失败:', error);
        res.status(500).json({ error: '读取产品数据失败' });
    }
});

// 添加手机API端点 - 与前端请求匹配
router.post('/phone', requireLogin, async (req, res) => {
    try {
        // 读取现有手机数据
        const data = await readPhones();
        let phones = Array.isArray(data.phones) ? data.phones : [];
        
        // 创建新商品对象
        const newPhone = {
            id: Date.now(),  // 使用时间戳作为ID
            brand: req.body.brand || req.body.name || '',
            model: req.body.model || req.body.name || '',
            price: parseFloat(req.body.price) || 0,
            images: req.body.images || [],
            description: req.body.description || '',
            features: req.body.features || [],
            specifications: req.body.specifications || {},
            stock: parseInt(req.body.stock) || 0,
            createdAt: new Date().toISOString()
        };
        
        // 添加到手机列表
        phones.push(newPhone);
        
        // 保存更新后的数据
        await savePhones({ phones });
        
        res.json({ 
            success: true, 
            message: '添加成功', 
            phone: newPhone 
        });
    } catch (error) {
        console.error('添加商品失败:', error);
        res.status(500).json({ error: '添加商品失败' });
    }
});

// 更新手机信息
router.put('/phone/:id', requireLogin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的ID' });
        }
        
        // 读取现有手机数据
        const data = await readPhones();
        let phones = Array.isArray(data.phones) ? data.phones : [];
        
        // 查找要更新的手机
        const phoneIndex = phones.findIndex(phone => parseInt(phone.id) === id);
        
        if (phoneIndex === -1) {
            return res.status(404).json({ error: '未找到指定产品' });
        }
        
        // 获取当前手机信息
        const existingPhone = phones[phoneIndex];
        
        // 创建更新后的对象，保留未更新的字段
        const updatedPhone = {
            ...existingPhone,
            brand: req.body.brand || existingPhone.brand,
            model: req.body.model || existingPhone.model,
            price: parseFloat(req.body.price) || existingPhone.price,
            images: req.body.images || existingPhone.images,
            description: req.body.description !== undefined ? req.body.description : existingPhone.description,
            features: req.body.features || existingPhone.features,
            specifications: req.body.specifications || existingPhone.specifications,
            stock: parseInt(req.body.stock) !== undefined ? parseInt(req.body.stock) : existingPhone.stock,
            updatedAt: new Date().toISOString()
        };
        
        // 更新数组中的对象
        phones[phoneIndex] = updatedPhone;
        
        // 保存更新后的数据
        await savePhones({ phones });
        
        res.json({ 
            success: true, 
            message: '更新成功', 
            phone: updatedPhone 
        });
    } catch (error) {
        console.error('更新商品失败:', error);
        res.status(500).json({ error: '更新商品失败' });
    }
});

// 删除手机
router.delete('/phone/:id', requireLogin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        
        if (isNaN(id)) {
            return res.status(400).json({ error: '无效的ID' });
        }
        
        // 读取现有手机数据
        const data = await readPhones();
        let phones = Array.isArray(data.phones) ? data.phones : [];
        
        // 查找要删除的手机索引
        const phoneIndex = phones.findIndex(phone => parseInt(phone.id) === id);
        
        if (phoneIndex === -1) {
            return res.status(404).json({ error: '未找到指定产品' });
        }
        
        // 删除关联的图片文件
        const phone = phones[phoneIndex];
        if (phone.images && Array.isArray(phone.images)) {
            for (const imageUrl of phone.images) {
                // 只处理本地存储的图片
                if (imageUrl && imageUrl.startsWith('/uploads/')) {
                    const imagePath = path.join(__dirname, '..', imageUrl.substring(1));
                    try {
                        if (fs.existsSync(imagePath)) {
                            await fs.unlink(imagePath);
                        }
                    } catch (err) {
                        console.error('删除图片文件失败:', err);
                    }
                }
            }
        }
        
        // 从数组中删除手机数据
        phones.splice(phoneIndex, 1);
        
        // 保存更新后的数据
        await savePhones({ phones });
        
        res.json({ 
            success: true, 
            message: '删除成功' 
        });
    } catch (error) {
        console.error('删除商品失败:', error);
        res.status(500).json({ error: '删除商品失败' });
    }
});

// 批量导入手机数据
router.post('/phones', requireLogin, async (req, res) => {
    try {
        // 如果是直接传入phones数组，使用批量导入接口
        if (Array.isArray(req.body.phones)) {
            await savePhones(req.body);
            return res.json({ success: true });
        }
        
        // 如果是直接传入整个数据对象，直接保存
        if (typeof req.body === 'object' && req.body !== null) {
            await savePhones(req.body);
            return res.json({ success: true });
        }
        
        res.status(400).json({ error: '无效的数据格式' });
    } catch (error) {
        console.error('保存产品数据失败:', error);
        res.status(500).json({ error: '保存产品数据失败' });
    }
});

// 获取最后编辑时间
router.get('/last-edit-time', async (req, res) => {
    try {
        const timestamp = await getLastEditTime();
        res.json({ timestamp });
    } catch (error) {
        console.error('获取最后编辑时间失败:', error);
        res.status(500).json({ error: '获取最后编辑时间失败' });
    }
});

module.exports = router; 



