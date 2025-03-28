const fs = require('fs');
const fsPromises = require('fs/promises');
const crypto = require('crypto');
const path = require('path');

// 配置常量
const CONFIG_FILE = 'src/data/config.json';

// 文件锁实现
const configLock = {
    locked: false,
    queue: [],
    
    async acquire() {
        if (this.locked) {
            await new Promise(resolve => this.queue.push(resolve));
        }
        this.locked = true;
    },
    
    release() {
        this.locked = false;
        if (this.queue.length > 0) {
            const next = this.queue.shift();
            next();
        }
    }
};

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
        const data = await fsPromises.readFile(CONFIG_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('读取配置文件失败:', error);
        return null;
    }
}

// 保存配置（带锁机制）
async function saveConfig(config) {
    try {
        // 获取锁
        await configLock.acquire();
        
        // 读取当前配置
        let currentConfig = await readConfig() || {};
        
        // 合并配置，保持密码相关字段不变（如果存在）
        if (currentConfig.isInitialized && !config.passwordHash) {
            config = {
                ...config,
                passwordHash: currentConfig.passwordHash,
                salt: currentConfig.salt,
                isInitialized: currentConfig.isInitialized
            };
        }
        
        // 确保目录存在
        const dir = path.dirname(CONFIG_FILE);
        await fsPromises.mkdir(dir, { recursive: true }).catch(() => {});
        
        // 写入文件
        await fsPromises.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
        return true;
    } catch (error) {
        console.error('保存配置失败:', error);
        return false;
    } finally {
        // 释放锁
        configLock.release();
    }
}

// 确保配置文件存在
async function ensureConfig() {
    try {
        await fsPromises.access(CONFIG_FILE);
    } catch {
        // 配置文件不存在，创建默认配置
        const initialConfig = {
            isInitialized: false,
            passwordHash: null,
            username: 'admin'
        };
        await saveConfig(initialConfig);
    }
}

// 验证中间件
const requireLogin = (req, res, next) => {
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

// 检查密码
async function checkPassword(password) {
    try {
        await fsPromises.access(CONFIG_FILE);
        const config = await readConfig();
        // ... existing code ...
    } catch (error) {
        // ... existing code ...
    }
}

module.exports = {
    hashPassword,
    verifyPassword,
    readConfig,
    saveConfig,
    ensureConfig,
    requireLogin
}; 