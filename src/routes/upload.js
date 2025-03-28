const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { requireLogin } = require('../utils/auth');

// 导入设置保存函数
const { saveSettings } = require('./settings');

// 配置 multer 存储，优先存储到内存
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 限制5MB
    }
});

// 处理文件上传
router.post('/upload-image', requireLogin, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const originalType = req.body.type || 'image';
        const referer = req.get('referer') || '';
        let actualType = originalType;
        
        // 应用默认设置
        let processedFile = req.file;

        // 检查是否需要优化图像
        if (req.body.applyDefaultSettings === 'true' || req.body.optimize === 'true') {
            // 设置默认优化参数
            if (actualType === 'logo') {
                // Logo最佳尺寸: 200x80, PNG/SVG优先
            } else if (actualType === 'favicon') {
                // Favicon最佳尺寸: 32x32 或 16x16, ICO/PNG优先
            } else if (actualType === 'wechatQR') {
                // 微信二维码最佳尺寸: 300x300, PNG优先
            }
        }

        // 基于实际类型决定文件名和路径
        const ext = path.extname(req.file.originalname);
        let fileUrl = '';

        if (actualType === 'logo') {
            fileUrl = `/uploads/images/site-logo${ext}`;
            
            // 重命名文件为site-logo.xxx
            const originalPath = path.join(__dirname, '..', 'uploads', 'images');
            try {
                // 确保目录存在
                await fs.mkdir(originalPath, { recursive: true });
                
                // 写入文件
                await fs.writeFile(
                    path.join(originalPath, `site-logo${ext}`),
                    req.file.buffer
                );
            } catch (err) {
                console.error('保存文件失败:', err);
                return res.status(500).json({ error: '保存Logo文件失败' });
            }
        } else if (actualType === 'favicon') {
            fileUrl = `/uploads/images/site-favicon${ext}`;
            
            // 重命名文件为site-favicon.xxx
            const originalPath = path.join(__dirname, '..', 'uploads', 'images');
            try {
                // 确保目录存在
                await fs.mkdir(originalPath, { recursive: true });
                
                // 写入文件
                await fs.writeFile(
                    path.join(originalPath, `site-favicon${ext}`),
                    req.file.buffer
                );
            } catch (err) {
                console.error('保存文件失败:', err);
                return res.status(500).json({ error: '保存网站图标文件失败' });
            }
        } else if (actualType === 'wechatQR') {
            // 微信二维码专用处理 - 使用特定文件名
            fileUrl = `/uploads/images/wechat-qrcode${ext}`;
            
            // 重命名文件为wechat-qrcode.xxx
            const originalPath = path.join(__dirname, '..', 'uploads', 'images');
            try {
                // 确保目录存在
                await fs.mkdir(originalPath, { recursive: true });
                
                // 写入文件
                await fs.writeFile(
                    path.join(originalPath, `wechat-qrcode${ext}`),
                    req.file.buffer
                );
            } catch (err) {
                console.error('保存文件失败:', err);
                return res.status(500).json({ error: '保存微信二维码文件失败' });
            }
        } else {
            // 普通图片，使用原始文件名（添加时间戳避免重复）
            const timestamp = Date.now();
            const fileName = `${timestamp}-${req.file.originalname}`;
            fileUrl = `/uploads/images/${fileName}`;
            
            // 保存文件
            const originalPath = path.join(__dirname, '..', 'uploads', 'images');
            try {
                // 确保目录存在
                await fs.mkdir(originalPath, { recursive: true });
                
                // 写入文件
                await fs.writeFile(
                    path.join(originalPath, fileName),
                    req.file.buffer
                );
            } catch (err) {
                console.error('保存文件失败:', err);
                return res.status(500).json({ error: '保存图片文件失败' });
            }
        }

        // 如果是logo或favicon，更新配置
        if (actualType === 'logo' || actualType === 'favicon') {
            try {
                await saveSettings(
                    undefined,  // 保持原有标题
                    actualType === 'logo' ? fileUrl : undefined,  // 如果是logo则更新logo
                    actualType === 'favicon' ? fileUrl : undefined  // 如果是favicon则更新favicon
                );
            } catch (err) {
                console.error(`保存${actualType}配置失败:`, err);
            }
        }

        res.json({
            success: true,
            url: fileUrl,
            message: actualType === 'logo' ? 'Logo上传成功' : 
                    actualType === 'favicon' ? '网站图标上传成功' :
                    actualType === 'wechatQR' ? '微信二维码上传成功' : '图片上传成功',
            originalType,
            actualType
        });
    } catch (error) {
        console.error('处理上传失败:', error);
        res.status(500).json({ error: '上传失败' });
    }
});

// 处理文件删除
router.post('/delete-file', requireLogin, async (req, res) => {
    try {
        const { type, path: filePath } = req.body;
        
        if (!type && !filePath) {
            return res.status(400).json({ error: '缺少文件类型或路径' });
        }
        
        let targetPath;
        
        // 处理Logo、Favicon和微信二维码类型的删除
        if (type === 'logo' || type === 'favicon' || type === 'wechatQR') {
            // 读取配置获取当前路径
            const configPath = path.join(__dirname, '..', 'data', 'config.json');
            let configData;
            
            try {
                configData = await fs.readFile(configPath, 'utf8');
                const config = JSON.parse(configData);
                
                // 获取文件路径
                let fileUrl;
                if (type === 'logo') {
                    fileUrl = config.siteLogo;
                } else if (type === 'favicon') {
                    fileUrl = config.siteFavicon;
                } else if (type === 'wechatQR') {
                    fileUrl = config.contact && config.contact.wechatQR;
                    
                    // 如果配置中没有URL，尝试直接查找文件
                    if (!fileUrl) {
                        const imagesPath = path.join(__dirname, '..', 'uploads', 'images');
                        try {
                            // 确保uploads/images目录存在
                            await fs.mkdir(imagesPath, { recursive: true });
                            
                            // 查找所有可能的微信二维码文件（不同扩展名）
                            const files = await fs.readdir(imagesPath);
                            
                            const wechatQRFiles = files.filter(file => file.startsWith('wechat-qrcode.'));
                            
                            if (wechatQRFiles.length > 0) {
                                // 使用找到的第一个文件
                                fileUrl = `/uploads/images/${wechatQRFiles[0]}`;
                            }
                        } catch (err) {
                            console.error('读取uploads/images目录失败:', err);
                        }
                    }
                }
                
                if (!fileUrl && type === 'wechatQR') {
                    // 对于微信二维码，即使没有找到URL也要清空配置并返回成功
                    // 因为用户可能希望重置微信二维码设置
                    if (config.contact) {
                        const contact = {
                            ...config.contact,
                            wechatQR: ''
                        };
                        await saveSettings(undefined, undefined, undefined, contact);
                    }
                    
                    return res.json({ 
                        success: true, 
                        message: '微信二维码已重置' 
                    });
                } else if (!fileUrl) {
                    return res.status(404).json({ 
                        success: false,
                        error: `${type === 'logo' ? 'Logo' : type === 'favicon' ? '网站图标' : '微信二维码'}未设置` 
                    });
                }
                
                // 构造完整文件路径（从URL转为文件系统路径）
                targetPath = path.join(__dirname, '..', fileUrl.replace(/^\//, ''));
                
                if (type === 'logo' || type === 'favicon') {
                    // 更新配置，移除文件引用
                    await saveSettings(
                        undefined, // 保持标题不变
                        type === 'logo' ? '' : undefined, // 如果删除的是logo则清空logo设置
                        type === 'favicon' ? '' : undefined // 如果删除的是favicon则清空favicon设置
                    );
                } else if (type === 'wechatQR') {
                    // 更新联系信息，移除微信二维码引用
                    if (config.contact) {
                        const contact = {
                            ...config.contact,
                            wechatQR: ''
                        };
                        await saveSettings(undefined, undefined, undefined, contact);
                    }
                }
                
                // 检查文件是否存在
                let fileExists = false;
                try {
                    await fs.access(targetPath);
                    fileExists = true;
                } catch (err) {
                    
                    // 对于微信二维码，尝试查找不同扩展名的文件
                    if (type === 'wechatQR') {
                        const extensions = ['.jpg', '.jpeg', '.png', '.gif'];
                        const baseDir = path.join(__dirname, '..', 'uploads', 'images');
                        let found = false;
                        
                        // 确保目录存在
                        try {
                            await fs.mkdir(baseDir, { recursive: true });
                        } catch (mkdirErr) {
                            console.error('创建目录失败:', mkdirErr);
                        }
                        
                        for (const ext of extensions) {
                            const possiblePath = path.join(baseDir, `wechat-qrcode${ext}`);
                            try {
                                await fs.access(possiblePath);
                                targetPath = possiblePath;
                                fileExists = true;
                                found = true;
                                break;
                            } catch (e) {
                                // 文件不存在，继续尝试
                            }
                        }
                    }
                }
                
                // 删除文件
                if (fileExists) {
                    try {
                        await fs.unlink(targetPath);
                    } catch (err) {
                        console.error('删除文件失败:', err);
                        
                        // 如果是微信二维码，即使删除失败也返回成功（因为配置已更新）
                        if (type === 'wechatQR') {
                            return res.json({ 
                                success: true, 
                                message: `微信二维码配置已更新，但文件删除失败: ${err.message}` 
                            });
                        }
                        // 如果不是微信二维码，则返回错误
                        return res.status(500).json({
                            success: false,
                            error: `文件删除失败: ${err.message}`
                        });
                    }
                } else if (type === 'wechatQR') {
                    // 如果是微信二维码且文件不存在，仍返回成功（因为配置已更新）
                    return res.json({ 
                        success: true, 
                        message: '微信二维码配置已更新，找不到实际文件' 
                    });
                }
                
                return res.json({ 
                    success: true, 
                    message: `${type === 'logo' ? 'Logo' : type === 'favicon' ? '网站图标' : '微信二维码'}已删除` 
                });
            } catch (err) {
                console.error('读取或更新配置失败:', err);
                return res.status(500).json({ 
                    success: false,
                    error: '操作失败' 
                });
            }
        } 
        // 基于路径删除文件
        else if (filePath) {
            // 安全检查：确保路径在uploads目录下
            if (!filePath.startsWith('/uploads/')) {
                return res.status(403).json({ error: '无权删除此文件' });
            }
            
            // 构造完整文件路径
            targetPath = path.join(__dirname, '..', filePath.replace(/^\//, ''));
        }
        
        // 检查文件是否存在
        try {
            await fs.access(targetPath);
        } catch (err) {
            return res.status(404).json({ error: '文件不存在' });
        }
        
        // 删除文件
        try {
            await fs.unlink(targetPath);
            
            res.json({ 
                success: true, 
                message: type ? 
                    `${type === 'logo' ? 'Logo' : type === 'favicon' ? '网站图标' : '微信二维码'}已删除` : 
                    '文件已删除' 
            });
        } catch (err) {
            console.error('删除文件失败:', err);
            res.status(500).json({ error: '删除文件失败' });
        }
    } catch (error) {
        console.error('处理删除请求失败:', error);
        res.status(500).json({ 
            success: false,
            error: '操作失败' 
        });
    }
});

module.exports = router; 