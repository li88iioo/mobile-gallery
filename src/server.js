const app = require('./app');
const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');

// 环境变量
const port = process.env.PORT || 3888;

// 定义必要的目录和文件
const requiredDirs = ['src/data', 'src/uploads', 'src/uploads/images'];
const requiredFiles = ['src/data/phones.json', 'src/data/config.json'];

/**
 * 安全地检查并创建必要的目录结构
 * @returns {Promise<void>}
 */
async function ensureDirectoriesExist() {
    try {
        for (const dir of requiredDirs) {
            try {
                // 检查目录是否存在且可访问
                await fsPromises.access(dir, fs.constants.F_OK);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // 目录不存在，创建它
                    console.log(`创建目录: ${dir}`);
                    await fsPromises.mkdir(dir, { 
                        recursive: true,
                        // 在类Unix系统上设置权限为755 (所有者读写执行，其他人只读执行)
                        mode: 0o755 
                    });
                } else {
                    // 其他错误 (权限问题等)
                    throw new Error(`无法访问目录 ${dir}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error('创建目录结构失败:', error);
        throw error; // 重新抛出错误以便上层捕获
    }
}

/**
 * 安全地检查并创建必要的文件
 * @returns {Promise<void>}
 */
async function ensureFilesExist() {
    try {
        for (const filePath of requiredFiles) {
            try {
                // 检查文件是否存在且可访问
                await fsPromises.access(filePath, fs.constants.F_OK);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // 文件不存在，创建它
                    console.log(`创建文件: ${filePath}`);
                    const dir = path.dirname(filePath);
                    
                    // 确保父目录存在
                    await fsPromises.mkdir(dir, { 
                        recursive: true,
                        mode: 0o755
                    }).catch(err => {
                        if (err.code !== 'EEXIST') {
                            throw err;
                        }
                    });
                    
                    // 创建空文件（不同类型的文件可能需要不同的初始内容）
                    const initialContent = filePath.endsWith('.json') ? '{}' : '';
                    await fsPromises.writeFile(filePath, initialContent, {
                        mode: 0o644 // 在类Unix系统上设置权限为644 (所有者读写，其他人只读)
                    });
                } else {
                    // 其他错误 (权限问题等)
                    throw new Error(`无法访问文件 ${filePath}: ${error.message}`);
                }
            }
        }
    } catch (error) {
        console.error('创建必要文件失败:', error);
        throw error; // 重新抛出错误以便上层捕获
    }
}

/**
 * 初始化服务器所需的数据和配置
 */
async function initializeServer() {
    console.log('正在初始化服务器...');
    
    try {
        // 1. 确保必要的目录结构存在
        await ensureDirectoriesExist();
        
        // 2. 确保必要的文件存在
        await ensureFilesExist();
        
        // 3. 初始化应用配置
        const { ensureDataDirectory } = require('./utils/data');
        const { ensureConfig } = require('./utils/auth');
        
        await ensureDataDirectory();
        await ensureConfig();
        
        console.log('服务器初始化完成');
        
        // 4. 启动HTTP服务器
        startServer();
    } catch (error) {
        console.error('服务器初始化失败:', error);
        process.exit(1); // 初始化失败时退出进程
    }
}

/**
 * 启动HTTP服务器
 */
function startServer() {
    app.listen(port, () => {
        console.log(`服务器运行在 http://localhost:${port}`);
    });
}

// 开始初始化并启动服务器
initializeServer(); 