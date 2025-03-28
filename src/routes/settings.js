const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const { requireLogin } = require('../utils/auth');

// 获取网站设置
router.get('/settings', async (req, res) => {
    try {
        const configPath = path.join(__dirname, '..', 'data', 'config.json');
        let configData = '{}';
        let config = {};
        
        try {
            configData = await fs.readFile(configPath, 'utf8');
            config = JSON.parse(configData);
        } catch (err) {
            console.error('读取配置文件失败:', err);
            // 使用默认值继续
        }
        
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
            favicon: config.siteFavicon || '',
            contact: config.contact || {
                phone: '',
                qq: '',
                wechatQR: ''
            }
        });
    } catch (error) {
        console.error('获取设置失败:', error);
        res.status(500).json({ error: '获取设置失败' });
    }
});

// 合并重复的设置保存逻辑为一个函数
async function saveSettings(title, logo, favicon, contact) {
    const configPath = path.join(__dirname, '..', 'data', 'config.json');
    
    // 确保数据目录存在
    await fs.mkdir(path.dirname(configPath), { recursive: true }).catch(err => {
        console.error('创建数据目录失败:', err);
    });
    
    // 读取现有配置
    let config = {};
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(configData);
    } catch (err) {
        console.error('读取配置文件失败，将创建新配置:', err);
    }
    
    // 只更新提供的值
    if (title !== undefined) config.siteTitle = title;
    if (logo !== undefined) config.siteLogo = logo;
    if (favicon !== undefined) config.siteFavicon = favicon;
    if (contact !== undefined) config.contact = contact;
    
    // 保存配置
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log('配置已更新:', config);
    return config;
}

// 使用统一的设置保存端点
router.post('/settings', requireLogin, async (req, res) => {
    try {
        const { title, logo, favicon, contact } = req.body;
        
        // 保存设置
        await saveSettings(title, logo, favicon, contact);
        
        // 读取配置以确认保存成功
        const config = await readConfig();
        
        res.json({ 
            success: true, 
            message: '设置已保存',
            settings: {
                title: config.siteTitle,
                logo: config.siteLogo,
                favicon: config.siteFavicon,
                contact: config.contact
            }
        });
    } catch (error) {
        console.error('保存设置出错:', error);
        res.status(500).json({ 
            success: false,
            error: '保存设置失败' 
        });
    }
});

// 保存网站标题
router.post('/settings/title', requireLogin, async (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title) {
            return res.status(400).json({ 
                success: false,
                error: '标题不能为空' 
            });
        }
        
        // 保存标题
        await saveSettings(title);
        
        res.json({ 
            success: true, 
            message: '标题保存成功',
            title
        });
    } catch (error) {
        console.error('保存标题失败:', error);
        res.status(500).json({ 
            success: false,
            error: '保存标题失败' 
        });
    }
});

// 保存联系信息
router.post('/settings/contact', requireLogin, async (req, res) => {
    try {
        const { phone, qq, wechatQR } = req.body;
        
        const contact = {
            phone: phone || '',
            qq: qq || '',
            wechatQR: wechatQR || ''
        };
        
        // 保存联系信息
        await saveSettings(undefined, undefined, undefined, contact);
        
        res.json({ 
            success: true, 
            message: '联系信息保存成功',
            contact
        });
    } catch (error) {
        console.error('保存联系信息失败:', error);
        res.status(500).json({ 
            success: false,
            error: '保存联系信息失败' 
        });
    }
});

// 读取配置文件辅助函数
async function readConfig() {
    const configPath = path.join(__dirname, '..', 'data', 'config.json');
    let config = {};
    
    try {
        const configData = await fs.readFile(configPath, 'utf8');
        config = JSON.parse(configData);
    } catch (err) {
        console.error('读取配置文件失败:', err);
    }
    
    return config;
}

// 导出设置保存函数，方便其他路由使用
module.exports = router;
// 单独导出saveSettings函数
module.exports.saveSettings = saveSettings; 