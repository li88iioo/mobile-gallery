const crypto = require('crypto');
const fs = require('fs').promises;

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

// 保存配置
async function saveConfig(config) {
    await fs.writeFile('data/config.json', JSON.stringify(config, null, 2));
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