const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// 用于文件锁的变量
let configLock = false;
let configQueue = [];

// 密码加密函数
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return { salt, hash };
}

// 验证密码
function verifyPassword(password, salt, storedHash) {
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    return hash === storedHash;
}

// 读取配置
async function readConfig() {
    try {
        const data = await fs.readFile('data/config.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return {
            isInitialized: false,
            passwordHash: null,
            username: 'admin'
        };
    }
}

// 保存配置（带锁机制）
async function saveConfig(config) {
    // 如果文件正在被写入，将当前操作加入队列
    if (configLock) {
        await new Promise(resolve => configQueue.push(resolve));
    }
    
    try {
        configLock = true;
        
        // 读取当前配置
        let currentConfig = await readConfig();
        
        // 合并配置，保持密码相关字段不变（如果存在）
        if (currentConfig.isInitialized && !config.passwordHash) {
            config = {
                ...config,
                passwordHash: currentConfig.passwordHash,
                salt: currentConfig.salt,
                isInitialized: currentConfig.isInitialized
            };
        }
        
        // 写入文件
        await fs.writeFile('data/config.json', JSON.stringify(config, null, 2));
        
        // 确保文件写入成功
        await fs.access('data/config.json');
    } finally {
        configLock = false;
        // 处理队列中的下一个操作
        if (configQueue.length > 0) {
            const next = configQueue.shift();
            next();
        }
    }
}

// 确保配置文件存在
async function ensureConfig() {
    try {
        await fs.access('data/config.json');
    } catch {
        const initialConfig = {
            isInitialized: false,
            passwordHash: null,
            username: 'admin'
        };
        await saveConfig(initialConfig);
        console.log('创建配置文件成功');
    }
}

// 验证中间件
const requireLogin = (req, res, next) => {
    console.log('验证登录状态:', {
        sessionID: req.sessionID,
        session: req.session,
        isLoggedIn: req.session?.isLoggedIn,
        path: req.path,
        method: req.method
    });

    if (req.session && req.session.isLoggedIn) {
        next();
    } else {
        // 如果是API请求，返回401
        if (req.path.startsWith('/api/')) {
            res.status(401).json({ error: '未登录' });
        } else {
            // 非API请求，直接重定向到登录页
            res.redirect('/login');
        }
    }
};

module.exports = {
    hashPassword,
    verifyPassword,
    readConfig,
    saveConfig,
    ensureConfig,
    requireLogin
}; 