const fs = require('fs').promises;

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

// 读取手机数据
async function readPhones() {
    try {
        const data = await fs.readFile('data/phones.json', 'utf8');
        const parsed = JSON.parse(data);
        return parsed || { phones: [], lastEditTime: new Date().toISOString() };
    } catch (error) {
        console.error('读取产品数据失败:', error);
        return { phones: [], lastEditTime: new Date().toISOString() };
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