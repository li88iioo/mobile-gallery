const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');
const CleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier');
const logger = require('../../server/utils/logger');

// 混淆配置
const obfuscatorConfig = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.75,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.4,
    debugProtection: true,
    debugProtectionInterval: true,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    rotateStringArray: true,
    selfDefending: true,
    shuffleStringArray: true,
    splitStrings: true,
    stringArray: true,
    stringArrayEncoding: ['base64'],
    stringArrayThreshold: 0.75,
    transformObjectKeys: true,
    unicodeEscapeSequence: false
};

// 处理 JavaScript 文件
async function obfuscateJS(filePath) {
    try {
        const code = fs.readFileSync(filePath, 'utf8');
        const result = JavaScriptObfuscator.obfuscate(code, obfuscatorConfig);
        return result.getObfuscatedCode();
    } catch (error) {
        logger.error(`混淆 JS 文件失败: ${filePath}`, error);
        throw error;
    }
}

// 处理 CSS 文件
async function minifyCSS(filePath) {
    try {
        const css = fs.readFileSync(filePath, 'utf8');
        const result = new CleanCSS({
            level: 2,
            compatibility: '*'
        }).minify(css);
        
        if (result.errors.length > 0) {
            throw new Error(result.errors.join('\n'));
        }
        
        return result.styles;
    } catch (error) {
        logger.error(`压缩 CSS 文件失败: ${filePath}`, error);
        throw error;
    }
}

// 处理 HTML 文件
async function minifyHTML(filePath) {
    try {
        const html = fs.readFileSync(filePath, 'utf8');
        return htmlMinifier.minify(html, {
            collapseWhitespace: true,
            removeComments: true,
            removeAttributeQuotes: true,
            removeEmptyAttributes: true,
            minifyJS: true,
            minifyCSS: true,
            processConditionalComments: true,
            removeRedundantAttributes: true,
            useShortDoctype: true,
            removeEmptyElements: true
        });
    } catch (error) {
        logger.error(`压缩 HTML 文件失败: ${filePath}`, error);
        throw error;
    }
}

// 创建目录
function createDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// 复制文件夹
function copyDirectory(src, dest) {
    createDirectory(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// 部署函数
async function deploy() {
    try {
        const sourceDir = path.join(__dirname, '../..');
        const deployDir = path.join(sourceDir, 'client/dist');
        
        // 清理部署目录
        if (fs.existsSync(deployDir)) {
            fs.rmSync(deployDir, { recursive: true });
        }
        
        // 创建必要的目录
        createDirectory(deployDir);
        createDirectory(path.join(deployDir, 'css'));
        createDirectory(path.join(deployDir, 'js'));
        createDirectory(path.join(deployDir, 'uploads'));
        
        // 处理 JS 文件
        const jsFiles = ['admin.js', 'index.js', 'login.js'];
        for (const file of jsFiles) {
            const sourcePath = path.join(sourceDir, 'client/public/js', file);
            const destPath = path.join(deployDir, 'js', file);
            const obfuscated = await obfuscateJS(sourcePath);
            fs.writeFileSync(destPath, obfuscated);
            logger.info(`JS文件处理完成: ${file}`);
        }
        
        // 处理 CSS 文件
        const cssPath = path.join(sourceDir, 'client/public/css/style.css');
        const cssDestPath = path.join(deployDir, 'css/style.css');
        const minifiedCSS = await minifyCSS(cssPath);
        fs.writeFileSync(cssDestPath, minifiedCSS);
        logger.info('CSS文件处理完成');
        
        // 处理 HTML 文件
        const htmlFiles = ['index', 'admin', 'login'].map(file => `${file}.html`);
        for (const file of htmlFiles) {
            const sourcePath = path.join(sourceDir, 'client/views', file);
            const destPath = path.join(deployDir, file);
            const minified = await minifyHTML(sourcePath);
            fs.writeFileSync(destPath, minified);
            logger.info(`HTML文件处理完成: ${file}`);
        }
        
        // 复制上传目录
        const uploadsDir = path.join(sourceDir, 'client/public/uploads');
        if (fs.existsSync(uploadsDir)) {
            copyDirectory(uploadsDir, path.join(deployDir, 'uploads'));
            logger.info('上传目录复制完成');
        }
        
        logger.info('部署完成！文件已生成在 dist 目录中。');
    } catch (error) {
        logger.error('部署失败:', error);
        process.exit(1);
    }
}

// 执行部署
if (require.main === module) {
    deploy();
}

module.exports = deploy; 