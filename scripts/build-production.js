/**
 * 生产环境构建脚本
 * 创建一个完整的生产环境构建，包括压缩所有JS和CSS文件
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');
const glob = require('glob');
const postcss = require('postcss');
const cssnano = require('cssnano');
const { execSync } = require('child_process');

// 配置参数
const ROOT_DIR = path.join(__dirname, '..');
const PRODUCTION_DIR = path.join(ROOT_DIR, '../mobile-gallery-production');
const EXCLUDE_DIRS = [
  'node_modules', 
  'scripts',
  '.git'
];
const EXCLUDE_FILES = [
  '.gitignore',
  'nodemon.json',
  'tailwind.config.js'
];

// 确保目标目录存在
function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

// 压缩JavaScript文件
async function minifyJsFile(filePath, outputPath) {
  console.log(`压缩JS文件: ${filePath}`);
  
  try {
    const code = fs.readFileSync(filePath, 'utf8');
    
    // 使用terser压缩代码
    const result = await minify(code, {
      compress: {
        dead_code: true,
        drop_console: false, // 保留控制台日志用于调试
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        reserved: ['require', 'exports', 'module', '__dirname', '__filename']
      },
      format: {
        comments: false,
        max_line_len: 500
      }
    });
    
    // 确保输出目录存在
    ensureDirectoryExistence(outputPath);
    
    // 写入压缩后的文件
    fs.writeFileSync(outputPath, result.code);
    console.log(`  ✅ 已保存到: ${outputPath}`);
  } catch (error) {
    console.error(`  ❌ 压缩失败: ${filePath}`, error);
  }
}

// 压缩CSS文件
async function minifyCssFile(filePath, outputPath) {
  console.log(`压缩CSS文件: ${filePath}`);
  
  try {
    const css = fs.readFileSync(filePath, 'utf8');
    
    // 使用postcss和cssnano压缩CSS
    const result = await postcss([cssnano({
      preset: 'default',
    })]).process(css, { from: filePath, to: outputPath });
    
    // 确保输出目录存在
    ensureDirectoryExistence(outputPath);
    
    // 写入压缩后的文件
    fs.writeFileSync(outputPath, result.css);
    console.log(`  ✅ 已保存到: ${outputPath}`);
  } catch (error) {
    console.error(`  ❌ 压缩失败: ${filePath}`, error);
  }
}

// 复制文件
function copyFile(src, dest) {
  console.log(`复制文件: ${src}`);
  ensureDirectoryExistence(dest);
  fs.copyFileSync(src, dest);
  console.log(`  ✅ 已复制到: ${dest}`);
}

// 递归复制目录
function processDirectory(srcDir, destDir) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);
    
    // 跳过排除的目录
    if (entry.isDirectory() && EXCLUDE_DIRS.includes(entry.name)) {
      console.log(`  ⏭️ 跳过目录: ${entry.name}`);
      continue;
    }
    
    // 跳过排除的文件
    if (!entry.isDirectory() && EXCLUDE_FILES.includes(entry.name)) {
      console.log(`  ⏭️ 跳过文件: ${entry.name}`);
      continue;
    }
    
    // 跳过已经压缩的文件
    if (!entry.isDirectory() && 
        (entry.name.endsWith('.min.js') || 
         entry.name.endsWith('.min.css'))) {
      console.log(`  ⏭️ 跳过已压缩文件: ${entry.name}`);
      continue;
    }
    
    if (entry.isDirectory()) {
      processDirectory(srcPath, destPath);
    } else {
      // 根据文件类型处理
      if (entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
        minifyJsFile(srcPath, destPath);
      } else if (entry.name.endsWith('.css') && !entry.name.endsWith('.min.css')) {
        minifyCssFile(srcPath, destPath);
      } else {
        copyFile(srcPath, destPath);
      }
    }
  }
}

// 主函数
async function main() {
  console.log('开始创建生产环境构建...');
  
  // 清理生产目录
  if (fs.existsSync(PRODUCTION_DIR)) {
    fs.rmSync(PRODUCTION_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PRODUCTION_DIR, { recursive: true });
  
  // 处理整个项目目录
  processDirectory(ROOT_DIR, PRODUCTION_DIR);
  
  // 不再自动安装依赖，改为提示用户
  console.log('\n生产环境构建完成!');
  console.log(`生产环境代码位于: ${PRODUCTION_DIR}`);
  console.log('\n请在生产环境目录中手动安装依赖:');
  console.log(`cd ${PRODUCTION_DIR}`);
  console.log('npm install --production');
  console.log('\n然后可以启动应用:');
  console.log('npm start');
}

// 运行主函数
main().catch(error => {
  console.error('构建过程中出错:', error);
  process.exit(1);
}); 