const app = require('./app');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

// 环境变量
const port = process.env.PORT || 3888;

// 检查并修复权限的函数
async function checkAndFixPermissions() {
    const dirs = ['src/data', 'src/uploads', 'src/uploads/images'];
    const files = ['src/data/phones.json', 'src/data/config.json'];
    
    try {
        // 检查并创建目录
        for (const dir of dirs) {
            try {
                await fsPromises.access(dir);
            } catch {
                await fsPromises.mkdir(dir, { recursive: true });
            }
        }
        
        // 检查并创建文件
        for (const file of files) {
            try {
                await fsPromises.access(file);
            } catch {
                const dir = path.dirname(file);
                await fsPromises.mkdir(dir, { recursive: true }).catch(error => 
                    console.error(`创建目录失败: ${dir}`, error)
                );
                await fsPromises.writeFile(file, '{}');
            }
        }
    } catch (error) {
        console.error('权限检查和修复失败:', error);
    }
}

// 在服务器启动时执行
(async () => {
    try {
        await checkAndFixPermissions();
        const { ensureDataDirectory } = require('./utils/data');
        const { ensureConfig } = require('./utils/auth');
        await ensureDataDirectory();
        await ensureConfig();
        console.log('数据目录和文件初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
    }
})();

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 