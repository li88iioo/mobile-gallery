const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

// 确保data目录和文件存在
async function ensureDataDirectory() {
    try {
        // 检查data目录
        try {
            await fsPromises.access('src/data');
        } catch {
            await fsPromises.mkdir('src/data', { recursive: true });
        }
        
        // 检查手机数据文件
        try {
            await fsPromises.access('src/data/phones.json');
        } catch {
            // 如果文件不存在，创建默认的数据
            const initialData = {
                phones: []
            };
            await fsPromises.writeFile('src/data/phones.json', JSON.stringify(initialData, null, 2));
        }
    } catch (error) {
        console.error('数据目录准备失败:', error);
        throw error;
    }
}

// 优化的数据缓存实现
const DataCache = {
    phones: null,
    lastRead: 0,
    TTL: 30000,

    async get() {
        const now = Date.now();
        if (this.phones && (now - this.lastRead) < this.TTL) {
            return this.phones;
        }
        
        try {
            const data = await fsPromises.readFile('src/data/phones.json', 'utf8')
                .then(JSON.parse)
                .catch(() => ({ phones: [], lastEditTime: new Date().toISOString() }));
                
            this.phones = data;
            this.lastRead = now;
            return data;
        } catch (error) {
            console.error('缓存读取失败:', error);
            return { phones: [], lastEditTime: new Date().toISOString() };
        }
    },

    invalidate() {
        this.phones = null;
        this.lastRead = 0;
    }
};

async function readPhones() {
    try {
        const data = await DataCache.get();
        
        // 确保返回的数据包含phones数组
        if (!data || !data.phones) {
            return { phones: [], lastEditTime: new Date().toISOString() };
        }
        
        if (!Array.isArray(data.phones)) {
            // 尝试处理常见的嵌套情况
            if (data.phones.phones && Array.isArray(data.phones.phones)) {
                return {
                    phones: data.phones.phones,
                    lastEditTime: data.lastEditTime || new Date().toISOString()
                };
            } else {
                // 其他情况返回空数组
                return { phones: [], lastEditTime: data.lastEditTime || new Date().toISOString() };
            }
        }
        
        return data;
    } catch (error) {
        console.error('读取数据失败:', error);
        return { phones: [], lastEditTime: new Date().toISOString() };
    }
}

async function savePhones(phones) {
    try {
        // 统一数据保存逻辑
        const dataToSave = {
            phones: Array.isArray(phones) ? phones : (phones && phones.phones ? phones.phones : []),
            lastEditTime: new Date().toISOString()
        };
        
        await fsPromises.writeFile('src/data/phones.json', JSON.stringify(dataToSave, null, 2));
        DataCache.invalidate();
        return true;
    } catch (error) {
        console.error('保存数据失败:', error);
        return false;
    }
}

// 获取最后编辑时间
async function getLastEditTime() {
    try {
        const data = await readPhones();
        return data.lastEditTime || null;
    } catch (error) {
        console.error('获取最后编辑时间失败:', error);
        return null;
    }
}

module.exports = {
    ensureDataDirectory,
    readPhones,
    savePhones,
    getLastEditTime
}; 
