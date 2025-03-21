const fs = require('fs').promises;
const path = require('path');

// 确保data目录和文件存在
async function ensureDataDirectory() {
    try {
        // 确保data目录存在
        try {
            await fs.access('data');
        } catch {
            await fs.mkdir('data');
            console.log('创建data目录成功');
        }

        // 确保phones.json文件存在
        try {
            await fs.access('data/phones.json');
        } catch {
            const initialData = {
                phones: [],
                lastEditTime: new Date().toISOString()
            };
            await fs.writeFile('data/phones.json', JSON.stringify(initialData, null, 2));
            console.log('创建phones.json文件成功');
        }
    } catch (error) {
        console.error('初始化数据目录或文件失败:', error);
    }
}

// 读取手机数据(优化：添加缓存机制)
let phonesCache = null;
let phonesLastRead = 0;
const CACHE_TTL = 30000; // 缓存有效期30秒

/**
 * 读取手机数据，带缓存优化
 */
async function readPhones() {
    const currentTime = Date.now();
    
    // 如果缓存存在且未过期，直接返回缓存
    if (phonesCache && (currentTime - phonesLastRead < CACHE_TTL)) {
        return phonesCache;
    }
    
    try {
        await ensureDataDirectory();
        const filePath = path.join(__dirname, '../data/phones.json');
        
        try {
            const data = await fs.readFile(filePath, 'utf8');
            phonesCache = JSON.parse(data);
            phonesLastRead = currentTime;
            return phonesCache;
        } catch (error) {
            if (error.code === 'ENOENT') {
                // 文件不存在，创建一个空数据
                const emptyData = { phones: [], lastEditTime: new Date().toISOString() };
                await savePhones(emptyData);
                phonesCache = emptyData;
                phonesLastRead = currentTime;
                return emptyData;
            }
            throw error;
        }
    } catch (error) {
        console.error('读取手机数据失败:', error);
        throw new Error('无法读取手机数据');
    }
}

// 保存手机数据
async function savePhones(phones) {
    try {
        // 确保目录和文件存在
        await ensureDataDirectory();

        const dataToSave = {
            phones: phones,
            lastEditTime: new Date().toISOString()
        };
        await fs.writeFile('data/phones.json', JSON.stringify(dataToSave, null, 2));
        console.log('保存数据成功');
    } catch (error) {
        console.error('保存数据失败:', error);
        throw error;
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