const express = require('express');
const router = express.Router();
const { hashPassword, verifyPassword, readConfig, saveConfig, requireLogin } = require('../utils/auth');

// 登录接口
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('登录请求:', { username, timestamp: new Date().toISOString() });
    
    const config = await readConfig();
    console.log('配置状态:', { isInitialized: config.isInitialized });

    if (!config.isInitialized) {
        if (username === 'admin' && password === 'admin123') {
            req.session.isLoggedIn = true;
            req.session.needPasswordChange = true;
            console.log('首次登录成功');
            res.json({ success: true, needPasswordChange: true });
            return;
        }
    } else {
        if (username === config.username && 
            verifyPassword(password, config.salt, config.passwordHash)) {
            req.session.isLoggedIn = true;
            console.log('正常登录成功');
            res.json({ success: true, needPasswordChange: false });
            return;
        }
    }
    
    console.log('登录失败');
    res.status(401).json({ error: '用户名或密码错误' });
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
    console.log('检查登录状态:', {
        sessionID: req.sessionID,
        session: req.session,
        isLoggedIn: req.session?.isLoggedIn
    });
    res.json({ isLoggedIn: !!req.session.isLoggedIn });
});

module.exports = router; 