const path = require('path');
const fs = require('fs');
const fsPromises = require('fs/promises');

// 访问量数据文件路径
const VISIT_DATA_FILE = path.join(__dirname, '../../src/data/visitStats.json');
const MIN_VISIT_INTERVAL = 30000; // 30秒，防止频繁访问计数

// 用于存储访问量统计的数据
let visitStats = {
    totalVisits: 0,
    todayVisits: 0,
    lastResetDate: new Date().toDateString(),
    ipVisits: {},
    ipLastVisitTime: {}
};

// 初始化统计数据
(async function initVisitStats() {
    try {
        // 确保目录存在
        const dataDir = path.dirname(VISIT_DATA_FILE);
        if (!fs.existsSync(dataDir)) {
            await fsPromises.mkdir(dataDir, { recursive: true });
        }
        
        if (fs.existsSync(VISIT_DATA_FILE)) {
            try {
                const data = await fsPromises.readFile(VISIT_DATA_FILE, 'utf8');
                visitStats = JSON.parse(data);
                
                // 确保必要字段存在
                visitStats.ipLastVisitTime = visitStats.ipLastVisitTime || {};
                visitStats.ipVisits = visitStats.ipVisits || {};
                visitStats.totalVisits = visitStats.totalVisits || 0;
                visitStats.todayVisits = visitStats.todayVisits || 0;
                visitStats.lastResetDate = visitStats.lastResetDate || new Date().toDateString();
            } catch (error) {
                console.error('Error reading visit stats:', error);
                await saveStats();
            }
        } else {
            await saveStats();
        }
        
        // 检查是否需要重置每日统计
        await checkAndResetDaily();
    } catch (error) {
        console.error('初始化访问统计失败:', error);
    }
})().catch(console.error);

// 检查并重置每日访问量
async function checkAndResetDaily() {
    const today = new Date().toDateString();
    if (visitStats.lastResetDate !== today) {
        visitStats.todayVisits = 0;
        visitStats.lastResetDate = today;
        visitStats.ipVisits = {};
        visitStats.ipLastVisitTime = {};
        await saveStats();
    }
}

// 保存统计数据
async function saveStats() {
    try {
        await fsPromises.writeFile(VISIT_DATA_FILE, JSON.stringify(visitStats, null, 2));
    } catch (error) {
        console.error('Error saving visit stats:', error);
    }
}

// 增加访问计数
function incrementVisits(ip) {
    if (!ip) return;
    
    const now = Date.now();
    const lastVisitTime = visitStats.ipLastVisitTime[ip] || 0;
    const timeDiff = now - lastVisitTime;
    
    // 如果该IP在设定间隔内已经被记录过，则不增加计数
    if (lastVisitTime && timeDiff < MIN_VISIT_INTERVAL) {
        return;
    }
    
    // 更新最后访问时间
    visitStats.ipLastVisitTime[ip] = now;
    
    // 增加总访问次数
    visitStats.totalVisits++;
    
    // 增加今日访问次数
    visitStats.todayVisits++;
    
    // 记录IP地址访问
    visitStats.ipVisits[ip] = (visitStats.ipVisits[ip] || 0) + 1;
    
    // 保存统计
    saveStats().catch(console.error);
}

// 获取访问统计数据
function getVisitStats() {
    return {
        total: visitStats.totalVisits,
        today: visitStats.todayVisits,
        unique: Object.keys(visitStats.ipVisits).length,
        // 向后兼容字段
        totalVisits: visitStats.totalVisits,
        todayVisits: visitStats.todayVisits
    };
}

module.exports = {
    incrementVisits,
    getVisitStats
}; 
