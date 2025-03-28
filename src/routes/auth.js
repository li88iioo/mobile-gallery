const express = require('express');
const router = express.Router();
const { hashPassword, verifyPassword, readConfig, saveConfig, requireLogin } = require('../utils/auth');

// 登录接口
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        const config = await readConfig();
        
        if (!config.isInitialized) {
            req.session.isLoggedIn = true;
            req.session.needPasswordChange = true;
            console.log('首次登录成功');
            return res.json({
                success: true,
                needPasswordChange: true,
                isInitialLogin: true
            });
        }
        
        if (username === config.username && 
            verifyPassword(password, config.salt, config.passwordHash)) {
            req.session.isLoggedIn = true;
            console.log('正常登录成功');
            return res.json({ 
                success: true, 
                needPasswordChange: false
            });
        }
        
        res.status(401).json({ 
            success: false, 
            error: '用户名或密码不正确' 
        });
    } catch (error) {
        console.error('登录出错:', error);
        res.status(500).json({ 
            success: false, 
            error: '登录处理出错'
        });
    }
});

// 修改密码接口
router.post('/change-password', requireLogin, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const config = await readConfig();

    // 验证当前密码
    if (!config.isInitialized) {
        if (currentPassword !== 'admin123') {
            return res.status(401).json({ error: '当前密码错误' });
        }
    } else {
        if (!verifyPassword(currentPassword, config.salt, config.passwordHash)) {
            return res.status(401).json({ error: '当前密码错误' });
        }
    }

    // 更新密码
    const { salt, hash } = hashPassword(newPassword);
    config.salt = salt;
    config.passwordHash = hash;
    config.isInitialized = true;

    await saveConfig(config);
    res.json({ success: true });
});

// 检查密码状态
router.get('/password-status', requireLogin, async (req, res) => {
    const config = await readConfig();
    res.json({ 
        needPasswordChange: !config.isInitialized,
        isInitialized: config.isInitialized 
    });
});

// 登出接口
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: '登出失败' });
        } else {
            res.json({ success: true });
        }
    });
});

// 检查登录状态接口
router.get('/check-auth', (req, res) => {
    res.json({ 
        isLoggedIn: req.session.isLoggedIn || false,
        username: req.session.username
    });
});

// 检查管理员账号是否已配置
router.get('/config/check-admin', async (req, res) => {
    try {
        const config = await readConfig();
        res.json({ 
            configured: !!config.username, 
            username: config.username || null
        });
    } catch (error) {
        console.error('检查管理员配置出错:', error);
        res.status(500).json({ error: '检查配置失败' });
    }
});

// 设置管理员账号
router.post('/config/set-admin', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: '用户名和密码不能为空' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: '密码长度至少6位' });
        }
        
        const config = await readConfig();
        
        // 如果已初始化且用户未登录，只有管理员可以更改设置
        if (config.isInitialized && !req.session.isLoggedIn) {
            return res.status(403).json({ error: '无权限操作' });
        }
        
        // 更新配置
        const { salt, hash } = hashPassword(password);
        await saveConfig({
            ...config,
            username,
            passwordHash: hash,
            salt: salt,
            isInitialized: true
        });
        
        // 设置成功后，自动登录
        req.session.isLoggedIn = true;
        req.session.username = username;
        
        res.json({ success: true });
    } catch (error) {
        console.error('设置管理员账号失败:', error);
        res.status(500).json({ error: '设置管理员账号失败' });
    }
});

// 获取当前用户名
router.get('/get-username', requireLogin, async (req, res) => {
    try {
        const config = await readConfig();
        res.json({ 
            username: config.username || 'admin'
        });
    } catch (error) {
        console.error('获取用户名错误:', error);
        res.status(500).json({ error: '获取用户名失败', username: 'admin' });
    }
});

module.exports = router; 