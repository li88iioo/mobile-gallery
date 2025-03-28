/**
 * 二手机展示平台 - 前端脚本
 * 优化版 - 现代化、响应式、高性能
 */

// ===== 全局变量与状态 =====

        // 缓存机制
let phonesCache = {};
        let lastFetchTime = 0;
const CACHE_DURATION = 5000; // 缓存有效期5秒
        
        // 分页状态
        let currentPage = 1;
let itemsPerPage = 12; // 每页显示12个产品
        let totalPages = 1;

// 筛选与排序状态
        let currentSortBy = 'price';
        let currentSortOrder = 'asc';
let currentSearchQuery = '';

// 全局DOM元素引用
const DOM = {
    phoneContainer: document.getElementById('phone-container'),
    paginationContainer: document.getElementById('pagination-container'),
    searchInput: document.getElementById('searchInput'),
    lastEditTime: document.getElementById('lastEditTime'),
    noResultsMessage: document.getElementById('noResultsMessage'),
    totalVisits: document.getElementById('totalVisits'),
    currentYear: document.getElementById('currentYear'),
    
    // 模态框相关
    phoneModal: document.getElementById('phoneModal'),
    modalTitle: document.getElementById('modalTitle'),
    modalContent: document.getElementById('modalContent'),
    
    // 灯箱相关
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxPrev: document.getElementById('lightboxPrev'),
    lightboxNext: document.getElementById('lightboxNext'),
    lightboxCounter: document.getElementById('lightboxCounter'),
    
    // 联系信息相关
    contactFloatBtn: document.getElementById('contactFloatBtn'),
    contactPanel: document.getElementById('contactPanel'),
    closeContactPanel: document.getElementById('closeContactPanel'),
    contactPhoneContainer: document.getElementById('contactPhoneContainer'),
    contactQQContainer: document.getElementById('contactQQContainer'),
    wechatQRContainer: document.getElementById('wechatQRContainer'),
    noContactInfo: document.getElementById('noContactInfo')
};

// 图片缓存管理
const ImageCache = {
    _cache: new Map(),
    _preloadQueue: [],
    _isPreloading: false,
    
    // 添加图片到缓存
    add(url, img) {
        if (!url || !img) return;
        this._cache.set(url, img);
    },
    
    // 从缓存获取图片
    get(url) {
        return this._cache.get(url);
    },
    
    // 检查图片是否在缓存中
    has(url) {
        return this._cache.has(url);
    },
    
    // 预加载图片
    preload(url) {
        if (!url || this.has(url)) return Promise.resolve();
        
        // 添加到预加载队列
        return new Promise((resolve) => {
            this._preloadQueue.push({url, resolve});
            this._processQueue();
        });
    },
    
    // 批量预加载图片
    preloadBatch(urls) {
        if (!urls || !urls.length) return;
        
        // 过滤已缓存的图片
        const toPreload = urls.filter(url => url && !this.has(url));
        
        // 添加到预加载队列
        toPreload.forEach(url => {
            this._preloadQueue.push({url, resolve: () => {}});
        });
        
        this._processQueue();
    },
    
    // 处理预加载队列
    _processQueue() {
        if (this._isPreloading || this._preloadQueue.length === 0) return;
        
        this._isPreloading = true;
        const {url, resolve} = this._preloadQueue.shift();
        
        const img = new Image();
        img.onload = () => {
            this.add(url, img);
            resolve();
            this._isPreloading = false;
            this._processQueue();
        };
        img.onerror = () => {
            resolve();
            this._isPreloading = false;
            this._processQueue();
        };
        
        // 添加时间戳或缓存破坏参数以防止浏览器缓存，仅针对无缓存控制的URL
        if (url.startsWith('http') && !url.includes('cache=')) {
            img.src = url + (url.includes('?') ? '&' : '?') + 'cache=1';
        } else {
            img.src = url;
        }
    }
};

// ===== 数据获取函数 =====

/**
 * 从服务器获取手机数据
 * @param {number|null} page - 页码，如果为null则获取全部数据
 * @param {number|null} limit - 每页数量，如果为null则获取全部数据
 * @param {string} sortBy - 排序字段 
 * @param {string} sortOrder - 排序方向 'asc'或'desc'
 * @param {string} searchQuery - 搜索关键词
 * @returns {Promise<Object>} 手机数据和元数据
 */
async function getPhones(page = 1, limit = itemsPerPage, sortBy = currentSortBy, sortOrder = currentSortOrder, searchQuery = currentSearchQuery) {
            const now = Date.now();
    const cacheKey = `phones_${page}_${limit}_${sortBy}_${sortOrder}_${searchQuery}`;
            
    // 如果缓存有效，直接返回缓存数据
    if (phonesCache[cacheKey] && (now - lastFetchTime < CACHE_DURATION)) {
                return phonesCache[cacheKey];
            }

            try {
        // 构建API请求URL
                let url = `/api/phones`;
        const params = [];
                
        // 添加分页参数
                if (page !== null && limit !== null) {
            params.push(`page=${page}`);
            params.push(`limit=${limit}`);
        }
        
        // 添加排序参数
        if (sortBy) {
            params.push(`sortBy=${sortBy}`);
            params.push(`sortOrder=${sortOrder}`);
        }
        
        // 拼接URL
        if (params.length > 0) {
            url += `?${params.join('&')}`;
        }
        
        // 发送请求
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        // 解析响应数据
        const data = await response.json();
        
        // 更新缓存
        phonesCache[cacheKey] = data;
        lastFetchTime = now;
        
        // 更新分页状态
        if (data.totalPages) {
            currentPage = data.currentPage || 1;
            totalPages = data.totalPages || 1;
        }
        
        return data;
    } catch (error) {
        console.error('获取产品数据失败:', error);
        // 出错时返回空数据或缓存
        return phonesCache[cacheKey] || { 
            phones: [], 
            total: 0, 
            totalPages: 1, 
            currentPage: 1 
        };
    }
}

/**
 * 获取最后编辑时间
 * @returns {Promise<string|null>} 最后编辑时间
 */
async function getLastEditTime() {
    try {
        const response = await fetch('/api/last-edit-time');
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        const data = await response.json();
        return data.timestamp || data.lastEditTime || null;
    } catch (error) {
        console.error('获取最后编辑时间失败:', error);
        return null;
    }
}

/**
 * 获取网站访问统计
 * @returns {Promise<Object>} 访问统计数据
 */
async function getVisitStats() {
    try {
        const response = await fetch('/api/stats/visits');
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('获取访问统计失败:', error);
        return { totalVisits: 0, todayVisits: 0 };
    }
}

/**
 * 加载网站设置
 * @returns {Promise<Object>} 网站设置
 */
async function loadSiteSettings() {
    try {
        const response = await fetch('/api/settings', {
            credentials: 'include',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok && response.status !== 304) {
            throw new Error('无法从服务器获取设置');
        }
        
        let settings;
        if (response.status !== 304) {
            settings = await response.json();
            localStorage.setItem('siteSettings', JSON.stringify(settings));
        } else {
            // 从localStorage获取数据时需要检查是否有效
            const storedSettings = localStorage.getItem('siteSettings');
            settings = storedSettings ? JSON.parse(storedSettings) : {};
        }
        
        // 确保settings属性有默认值
        return {
            title: settings.title || '二手机展示',
            logo: settings.logo || '',
            favicon: settings.favicon || '',
            contact: settings.contact || {
                phone: '',
                qq: '',
                wechatQR: ''
            }
        };
    } catch (error) {
        console.error('加载网站设置失败:', error);
        // 返回默认值
        return {
            title: '二手机展示',
            logo: '',
            favicon: '',
            contact: {
                phone: '',
                qq: '',
                wechatQR: ''
            }
        };
    }
}

// ===== UI渲染函数 =====

/**
 * 渲染手机列表
 * @param {number} page - 页码
 * @param {string} sortBy - 排序字段
 * @param {string} sortOrder - 排序方向
 * @param {string} searchQuery - 搜索关键词
 */
async function renderPhones(page = 1, sortBy = currentSortBy, sortOrder = currentSortOrder, searchQuery = currentSearchQuery) {
    // 更新状态
    currentPage = page;
    currentSortBy = sortBy;
    currentSortOrder = sortOrder;
    currentSearchQuery = searchQuery;
    
    // 显示加载状态
    showSkeletonLoading();
    
    // 获取数据
    const data = await getPhones(page, itemsPerPage, sortBy, sortOrder);
    let phones = Array.isArray(data) ? data : (data.phones || []);
    
    // 确保数据格式正确
    phones = phones.map(phone => ({
        ...phone,
        price: typeof phone.price === 'string' ? parseFloat(phone.price) : (phone.price || 0),
        mainImageUrl: phone.mainImageUrl || (phone.images && phone.images.length > 0 ? phone.images[0] : ''),
        detailImageUrls: phone.detailImageUrls || phone.images || []
    }));
    
    // 应用搜索过滤
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        phones = phones.filter(phone => 
            (phone.name && phone.name.toLowerCase().includes(query)) ||
            (phone.brand && phone.brand.toLowerCase().includes(query)) ||
            (phone.model && phone.model.toLowerCase().includes(query))
        );
    }
    
    // 更新排序按钮状态
    updateSortButtons();
    
    // 处理无结果情况
    if (phones.length === 0) {
        DOM.phoneContainer.innerHTML = '';
        DOM.noResultsMessage.classList.remove('hidden');
        DOM.paginationContainer.classList.add('hidden');
        return;
    } else {
        DOM.noResultsMessage.classList.add('hidden');
        DOM.paginationContainer.classList.remove('hidden');
    }
    
    // 收集所有图片URL用于预加载
    const allImageUrls = phones.map(phone => phone.mainImageUrl).filter(Boolean);
    
    // 渲染商品卡片
    DOM.phoneContainer.innerHTML = phones.map((phone, index) => `
        <div class="product-card ${phone.soldOut ? 'sold-out' : ''}" data-id="${phone.id}">
            ${phone.soldOut ? '<div class="sold-badge">已售</div>' : ''}
            <div class="product-image-container" style="--card-bg-image: url('${phone.mainImageUrl || ''}');">
                <img src="${index < 6 ? (phone.mainImageUrl || '') : 'data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1 1\'%3E%3C/svg%3E'}" 
                     data-src="${phone.mainImageUrl || ''}" 
                     alt="${phone.name || '手机图片'}" 
                     class="product-image ${index >= 6 ? 'lazy-image' : ''}"
                     loading="${index < 6 ? 'eager' : 'lazy'}"
                     onclick="${phone.soldOut ? '' : `showDetails(${JSON.stringify(phone).replace(/"/g, '&quot;')})`}">
            </div>
            <div class="product-content">
                <div class="product-title-wrapper">
                    <h3 class="product-title">${phone.name || `${phone.brand || ''} ${phone.model || ''}`}</h3>
                </div>
                <div class="product-specs">
                    ${phone.condition ? `
                    <div class="product-spec">
                        <span class="spec-label">成色</span>
                        <span class="spec-value">${phone.condition}</span>
                    </div>` : `
                    <div class="product-spec">
                        <span class="spec-label">成色</span>
                        <span class="spec-value">--</span>
                    </div>`}
                    ${phone.storage ? `
                    <div class="product-spec">
                        <span class="spec-label storage-spec-label">存储</span>
                        <span class="spec-value">${phone.storage}</span>
                    </div>` : `
                    <div class="product-spec">
                        <span class="spec-label storage-spec-label">存储</span>
                        <span class="spec-value">--</span>
                    </div>`}
                </div>
                <div class="product-price">${phone.price.toLocaleString('zh-CN')}</div>
                <div class="product-action">
                    <button class="view-details-btn" onclick="showDetails(${JSON.stringify(phone).replace(/"/g, '&quot;')})"
                            ${phone.soldOut ? 'disabled' : ''}>
                        <i class="fas fa-search"></i> 查看详情
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    // 实现图片懒加载
    initLazyLoading();
    
    // 预加载图片以提高用户体验
    ImageCache.preloadBatch(allImageUrls);
    
    // 渲染分页控件
    renderPagination(data.totalPages || Math.ceil(phones.length / itemsPerPage), page);
}

/**
 * 显示骨架屏加载效果
 */
function showSkeletonLoading() {
    DOM.phoneContainer.innerHTML = Array(6).fill(`
        <div class="product-card-skeleton">
            <div class="skeleton-image"></div>
            <div class="skeleton-content">
                <div class="skeleton-title"></div>
                <div class="skeleton-specs">
                    <div class="skeleton-spec"></div>
                    <div class="skeleton-spec"></div>
                </div>
                <div class="skeleton-price"></div>
                <div class="skeleton-button"></div>
            </div>
        </div>
    `).join('');
}

/**
 * 渲染分页控件
 * @param {number} totalPages - 总页数
 * @param {number} currentPage - 当前页码
 */
function renderPagination(totalPages, currentPage) {
    if (!totalPages || totalPages <= 1) {
        DOM.paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination">';
    
    // 上一页按钮
    if (currentPage > 1) {
        html += `<button class="pagination-btn" onclick="renderPhones(${currentPage - 1})">上一页</button>`;
    } else {
        html += `<button class="pagination-btn disabled">上一页</button>`;
    }
    
    // 页码按钮
    const maxButtons = 5; // 最多显示的页码按钮数
    const halfButtons = Math.floor(maxButtons / 2);
    
    let startPage = Math.max(1, currentPage - halfButtons);
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // 第一页
    if (startPage > 1) {
        html += `
            <button class="pagination-btn" onclick="renderPhones(1)">1</button>
        `;
        
        if (startPage > 2) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
    }
    
    // 页码范围
    for (let i = startPage; i <= endPage; i++) {
        if (i === currentPage) {
            html += `<button class="pagination-btn active">${i}</button>`;
        } else {
            html += `<button class="pagination-btn" onclick="renderPhones(${i})">${i}</button>`;
        }
    }
    
    // 最后一页
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += '<span class="pagination-ellipsis">...</span>';
        }
        
        html += `
            <button class="pagination-btn" onclick="renderPhones(${totalPages})">${totalPages}</button>
        `;
    }
    
    // 下一页按钮
    if (currentPage < totalPages) {
        html += `<button class="pagination-btn" onclick="renderPhones(${currentPage + 1})">下一页</button>`;
    } else {
        html += `<button class="pagination-btn disabled">下一页</button>`;
    }
    
    html += '</div>';
    
    DOM.paginationContainer.innerHTML = html;
}

/**
 * 更新排序按钮状态
 */
function updateSortButtons() {
    const sortButtons = document.querySelectorAll('.sort-btn');
    
    sortButtons.forEach(btn => {
        // 重置所有按钮状态
        btn.classList.remove('active');
        const sortField = btn.getAttribute('data-sort');
        
        // 设置当前排序按钮的状态
        if (sortField === currentSortBy) {
            btn.classList.add('active');
            btn.setAttribute('data-order', currentSortOrder);
        }
    });
}

/**
 * 更新访问统计
 */
async function updateVisitStats() {
    const stats = await getVisitStats();
    if (DOM.totalVisits) {
        DOM.totalVisits.textContent = stats.totalVisits || '--';
    }
}

/**
 * 更新最后编辑时间显示
 */
async function updateLastEditTime() {
    const lastEditTime = await getLastEditTime();
    if (lastEditTime && DOM.lastEditTime) {
        const date = new Date(lastEditTime);
        DOM.lastEditTime.textContent = date.toLocaleString('zh-CN');
    }
}

/**
 * 应用网站设置到UI
 * @param {Object} settings - 网站设置
 */
function applySettings(settings) {
    if (!settings) return;
    
    // 更新标题
    if (settings.title) {
        document.title = settings.title;
        const titleElement = document.querySelector('.site-title');
        if (titleElement) {
            titleElement.textContent = settings.title;
        }
    }
    
    // 更新Logo
    if (settings.logo) {
        const logoElement = document.getElementById('siteLogo');
        if (logoElement) {
            logoElement.src = settings.logo || '';
            logoElement.classList.remove('hidden');
        }
    }
    
    // 更新Favicon
    if (settings.favicon) {
        let faviconLink = document.querySelector('link[rel="icon"]');
        if (!faviconLink) {
            faviconLink = document.createElement('link');
            faviconLink.rel = 'icon';
            document.head.appendChild(faviconLink);
        }
        faviconLink.href = settings.favicon || '';
    }
}

// ===== 事件处理函数 =====

/**
 * 处理排序按钮点击
 * @param {string} sortBy - 排序字段
 */
function handleSort(sortBy) {
    // 切换排序方向
    const newSortOrder = (sortBy === currentSortBy && currentSortOrder === 'asc') ? 'desc' : 'asc';
    
    // 重新渲染列表
    renderPhones(1, sortBy, newSortOrder, currentSearchQuery);
}

/**
 * 处理搜索输入
 * @param {string} query - 搜索关键词
 */
function handleSearch(query) {
    // 使用防抖，避免频繁请求
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
        renderPhones(1, currentSortBy, currentSortOrder, query);
    }, 300);
}

/**
 * 显示产品详情
 * @param {Object} phone - 产品数据
 */
function showDetails(phone) {
    // 检查产品数据
    if (!phone) return;
    
    // 设置模态框标题
    DOM.modalTitle.textContent = phone.name || `${phone.brand || ''} ${phone.model || ''}`;
    
    // 准备图片数据并确保图片URL有效
    const mainImage = phone.mainImageUrl || '';
    const detailImages = (phone.detailImageUrls || []).filter(url => url && url !== phone.mainImageUrl) || [];
    const images = [
        mainImage, 
        ...detailImages
    ].filter(url => url && url.trim() !== '');
    
    // 渲染详情内容
    DOM.modalContent.innerHTML = `
        <div class="product-gallery">
            <div class="gallery-main">
                <img src="${images.length > 0 ? images[0] : ''}" alt="${phone.name || ''}" class="gallery-main-image" onclick="openLightbox(0)">
            </div>
            ${images.length > 1 ? `
            <div class="gallery-thumbs">
                ${images.map((url, idx) => `
                    <div class="gallery-thumb ${idx === 0 ? 'active' : ''}" onclick="switchMainImage(${idx})">
                        <img src="${url || ''}" alt="缩略图 ${idx + 1}">
                    </div>
                `).join('')}
            </div>` : ''}
        </div>
        <div class="product-info">
            <div class="product-price-detail">¥${phone.price?.toLocaleString('zh-CN') || '价格未知'}</div>
            
            <div class="product-status ${phone.soldOut ? 'sold' : 'available'}">
                ${phone.soldOut ? '已售出' : '在售'}
                </div>
            
            <div class="product-details-list">
                ${phone.brand ? `
                <div class="detail-item">
                    <div class="detail-label">品牌</div>
                    <div class="detail-value">${phone.brand}</div>
                </div>` : ''}
                
                ${phone.model ? `
                <div class="detail-item">
                    <div class="detail-label">型号</div>
                    <div class="detail-value">${phone.model}</div>
                </div>` : ''}
                
                ${phone.storage ? `
                <div class="detail-item">
                    <div class="detail-label storage-capacity-label">存储容量</div>
                    <div class="detail-value">${phone.storage}</div>
                </div>` : ''}
                
                ${phone.condition ? `
                <div class="detail-item">
                    <div class="detail-label">成色</div>
                    <div class="detail-value">${phone.condition}</div>
                </div>` : ''}
                
                ${phone.repair ? `
                <div class="detail-item">
                    <div class="detail-label">维修记录</div>
                    <div class="detail-value">${phone.repair}</div>
                </div>` : ''}
                
                ${phone.description ? `
                <div class="detail-item description-item">
                    <div class="detail-label">描述</div>
                    <div class="detail-value">${phone.description}</div>
                </div>` : ''}
            </div>
        </div>
    `;
    
    // 保存当前产品数据和图片列表到全局变量
    window.currentPhone = phone;
    window.currentImages = images;
    
    // 显示模态框
    DOM.phoneModal.classList.add('active');
    
    // 禁止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 切换主图片
 * @param {number} index - 图片索引
 */
function switchMainImage(index) {
    if (!window.currentImages || !window.currentImages.length || !window.currentImages[index]) return;
    
    // 更新主图
    const mainImage = document.querySelector('.gallery-main-image');
    if (mainImage) {
        mainImage.src = window.currentImages[index] || '';
        mainImage.setAttribute('onclick', `openLightbox(${index})`);
    }
    
    // 更新缩略图状态
    const thumbs = document.querySelectorAll('.gallery-thumb');
    thumbs.forEach((thumb, idx) => {
        if (idx === index) {
            thumb.classList.add('active');
        } else {
            thumb.classList.remove('active');
        }
    });
}

/**
 * 打开灯箱查看大图
 * @param {number} index - 图片索引
 */
function openLightbox(index) {
    if (!window.currentImages || !window.currentImages.length || !window.currentImages[index]) return;
    
    // 设置灯箱图片
    DOM.lightboxImg.src = window.currentImages[index] || '';
    DOM.lightboxImg.alt = window.currentPhone?.name || '手机图片';
    
    // 更新计数器
    DOM.lightboxCounter.textContent = `${index + 1} / ${window.currentImages.length}`;
    
    // 设置导航按钮状态
    DOM.lightboxPrev.style.display = index > 0 ? 'flex' : 'none';
    DOM.lightboxNext.style.display = index < window.currentImages.length - 1 ? 'flex' : 'none';
    
    // 保存当前索引
    window.currentImageIndex = index;
    
    // 显示灯箱
    DOM.lightbox.classList.add('active');
    
    // 绑定键盘事件
    document.addEventListener('keydown', handleLightboxKeydown);
    
    // 绑定导航按钮事件
    DOM.lightboxPrev.onclick = () => navigateLightbox('prev');
    DOM.lightboxNext.onclick = () => navigateLightbox('next');
}

/**
 * 导航灯箱图片
 * @param {string} direction - 导航方向 'prev' 或 'next'
 */
function navigateLightbox(direction) {
    const index = window.currentImageIndex;
    if (index === undefined || !window.currentImages || !window.currentImages.length) return;
    
    let newIndex;
    if (direction === 'prev' && index > 0) {
        newIndex = index - 1;
    } else if (direction === 'next' && index < window.currentImages.length - 1) {
        newIndex = index + 1;
                } else {
        return;
    }
    
    // 更新图片
    DOM.lightboxImg.src = window.currentImages[newIndex] || '';
    
    // 更新计数器
    DOM.lightboxCounter.textContent = `${newIndex + 1} / ${window.currentImages.length}`;
    
    // 更新导航按钮状态
    DOM.lightboxPrev.style.display = newIndex > 0 ? 'flex' : 'none';
    DOM.lightboxNext.style.display = newIndex < window.currentImages.length - 1 ? 'flex' : 'none';
    
    // 更新当前索引
    window.currentImageIndex = newIndex;
}

/**
 * 处理灯箱键盘事件
 * @param {KeyboardEvent} event - 键盘事件对象
 */
function handleLightboxKeydown(event) {
    switch (event.key) {
        case 'ArrowLeft':
            navigateLightbox('prev');
            break;
        case 'ArrowRight':
            navigateLightbox('next');
            break;
        case 'Escape':
            closeLightbox();
            break;
    }
}

/**
 * 关闭灯箱
 */
function closeLightbox() {
    DOM.lightbox.classList.remove('active');
    
    // 移除键盘事件监听
    document.removeEventListener('keydown', handleLightboxKeydown);
}

/**
 * 关闭详情模态框
 */
function closeModal() {
    DOM.phoneModal.classList.remove('active');
    
    // 恢复背景滚动
    document.body.style.overflow = '';
    
    // 清除当前产品数据
    window.currentPhone = null;
    window.currentImages = null;
}

/**
 * 初始化标题点击事件（用于快速访问管理页面）
 */
function initializeTitleClick() {
    let titleClickCount = 0;
    let lastClickTime = 0;
    
    document.getElementById('titleClick').addEventListener('click', () => {
        const currentTime = new Date().getTime();
        if (currentTime - lastClickTime > 3000) {
            titleClickCount = 0;
        }
        
        titleClickCount++;
        lastClickTime = currentTime;
        
        if (titleClickCount === 5) {
            window.location.href = '/login';
        }
    });
}

/**
 * 初始化滚动事件（实现标题栏动态效果）
 */
function initializeScrollEvents() {
    window.addEventListener('scroll', () => {
        const header = document.querySelector('.site-header');
        if (!header) return;
        
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });
        }

        /**
         * 显示通知消息
         * @param {string} message - 消息内容
         * @param {string} type - 消息类型: 'success', 'error', 'info', 'warning'
         * @param {number} duration - 显示持续时间(毫秒)
         * @param {string} title - 可选的标题
         */
        function showToast(message, type = 'info', duration = 3000, title = '') {
            const container = document.getElementById('toastContainer');
            if (!container) return;

            // 创建toast元素
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
    // 添加图标
    let iconClass;
            switch (type) {
        case 'success': iconClass = 'fa-check-circle'; break;
        case 'error': iconClass = 'fa-exclamation-circle'; break;
        case 'warning': iconClass = 'fa-exclamation-triangle'; break;
        default: iconClass = 'fa-info-circle'; break;
            }
            
            // 构建内容
    toast.innerHTML = `
        <div class="toast-icon"><i class="fas ${iconClass}"></i></div>
                <div class="toast-content">
                    ${title ? `<div class="toast-title">${title}</div>` : ''}
                    <div class="toast-message">${message}</div>
                </div>
        <button class="toast-close" aria-label="关闭">
                    <i class="fas fa-times"></i>
        </button>
        <div class="toast-progress"></div>
    `;
            
            // 添加到容器
            container.appendChild(toast);
            
    // 添加进度条动画
    const progress = toast.querySelector('.toast-progress');
    progress.style.animationDuration = `${duration}ms`;
    
    // 显示效果
    setTimeout(() => toast.classList.add('show'), 10);
            
            // 设置自动关闭
            const timeout = setTimeout(() => {
        closeToast(toast);
            }, duration);
            
    // 点击关闭按钮
    toast.querySelector('.toast-close').addEventListener('click', () => {
                clearTimeout(timeout);
        closeToast(toast);
    });
    
    // 悬停暂停自动关闭
    toast.addEventListener('mouseenter', () => clearTimeout(timeout));
    toast.addEventListener('mouseleave', () => {
        const newTimeout = setTimeout(() => closeToast(toast), 1000);
        toast._closeTimeout = newTimeout;
            });
            
            return toast;
        }

/**
 * 关闭通知消息
 * @param {HTMLElement} toast - Toast元素
 */
function closeToast(toast) {
    toast.classList.remove('show');
    toast.addEventListener('transitionend', () => toast.remove());
}

/**
 * 更新页脚的年份显示
 */
function updateFooterYear() {
    if (DOM.currentYear) {
        const currentYear = new Date().getFullYear();
        const displayedYear = DOM.currentYear.textContent;
        if (displayedYear !== currentYear.toString()) {
            DOM.currentYear.textContent = currentYear;
        }
    }
}

/**
 * 初始化图片懒加载
 */
function initLazyLoading() {
    // 使用Intersection Observer API实现懒加载
    if ('IntersectionObserver' in window) {
        const lazyImageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const lazyImage = entry.target;
                    const src = lazyImage.dataset.src;
                    
                    if (src) {
                        // 尝试从缓存获取图片
                        if (ImageCache.has(src)) {
                            lazyImage.src = src;
                        } else {
                            lazyImage.src = src;
                            
                            // 图片加载完成后添加到缓存
                            lazyImage.onload = () => {
                                const img = new Image();
                                img.src = src;
                                ImageCache.add(src, img);
                            };
                        }
                        
                        lazyImage.classList.remove('lazy-image');
                        lazyImage.removeAttribute('data-src');
                        observer.unobserve(lazyImage);
                    }
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        // 观察所有懒加载图片
        const lazyImages = document.querySelectorAll('.lazy-image');
        lazyImages.forEach(lazyImage => {
            lazyImageObserver.observe(lazyImage);
        });
    } else {
        // 对于不支持IntersectionObserver的浏览器，立即加载所有图片
        const lazyImages = document.querySelectorAll('.lazy-image');
        lazyImages.forEach(lazyImage => {
            const src = lazyImage.dataset.src;
            if (src) {
                lazyImage.src = src;
                lazyImage.classList.remove('lazy-image');
                lazyImage.removeAttribute('data-src');
            }
        });
    }
    
    // 无论如何，在首屏直接加载前6张图片
    const firstImages = document.querySelectorAll('.product-card:nth-child(-n+6) .lazy-image');
    firstImages.forEach(img => {
        const src = img.dataset.src;
        if (src) {
            img.src = src;
            img.classList.remove('lazy-image');
            img.removeAttribute('data-src');
        }
    });
}

/**
 * 禁止图像复制和下载
 */
function preventImageCopyDownload() {
    // 阻止整个文档的右键菜单
    document.addEventListener('contextmenu', function(e) {
        // 检查目标元素是否是需要保护的图像
        const target = e.target;
        if (target.tagName === 'IMG' && 
            (target.id === 'wechatQRDisplay' || 
             target.classList.contains('site-logo') ||
             target.classList.contains('site-favicon') ||
             target.classList.contains('no-copy-image'))) {
            e.preventDefault();
            return false;
        }
    });

    // 阻止拖拽
    document.addEventListener('dragstart', function(e) {
        const target = e.target;
        if (target.tagName === 'IMG' && 
            (target.id === 'wechatQRDisplay' || 
             target.classList.contains('site-logo') ||
             target.classList.contains('site-favicon') ||
             target.classList.contains('no-copy-image'))) {
            e.preventDefault();
            return false;
        }
    });

    // 阻止复制
    document.addEventListener('copy', function(e) {
        // 获取当前选择的元素
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            // 检查容器或其父节点是否包含受保护的图像
            let current = container;
            while (current && current !== document) {
                if (current.tagName === 'IMG' && 
                    (current.id === 'wechatQRDisplay' || 
                     current.classList.contains('site-logo') ||
                     current.classList.contains('site-favicon') ||
                     current.classList.contains('no-copy-image'))) {
                    e.preventDefault();
                    return false;
                }
                current = current.parentNode;
            }
        }
    });
}

// ===== 初始化 =====

// 页面加载完成后执行初始化
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 设置当前年份
        updateFooterYear();
        
        // 初始化标题点击事件
        initializeTitleClick();
        
        // 初始化滚动事件
        initializeScrollEvents();
        
        // 加载网站设置
        const settings = await loadSiteSettings();
        applySettings(settings);
        
        // 加载手机数据
        await renderPhones();
        
        // 更新最后编辑时间
        await updateLastEditTime();
        
        // 更新访问统计
        await updateVisitStats();
        
        // 设置模态框外部点击关闭
        DOM.phoneModal.addEventListener('click', (event) => {
            if (event.target === DOM.phoneModal) {
                closeModal();
            }
        });
        
        // 设置灯箱外部点击关闭
        DOM.lightbox.addEventListener('click', (event) => {
            if (event.target === DOM.lightbox) {
                closeLightbox();
            }
        });
        
        // 添加加载更多事件处理 - 用于懒加载图片
        window.addEventListener('scroll', handleScrollForLazyLoading);
        
        // 开始自动更新检查
        setInterval(updateLastEditTime, 30000); // 每30秒检查一次更新
        
        // 每小时检查一次年份变更（尤其是在跨年夜）
        setInterval(updateFooterYear, 3600000); // 每小时检查一次年份
        
        // 初始化各组件
        initLazyLoading();
        initializeContactButton();
        preventImageCopyDownload(); // 添加防复制和下载保护
        
    } catch (error) {
        console.error('初始化失败:', error);
        showToast('加载页面时出现错误，请刷新页面重试', 'error');
    }
});

/**
 * 处理滚动事件，触发懒加载
 */
function handleScrollForLazyLoading() {
    if (!('IntersectionObserver' in window)) {
        // 只对不支持IntersectionObserver的浏览器处理滚动事件
        const lazyImages = document.querySelectorAll('.lazy-image');
        if (lazyImages.length === 0) {
            window.removeEventListener('scroll', handleScrollForLazyLoading);
            return;
        }
        
        lazyImages.forEach(lazyImage => {
            const rect = lazyImage.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const src = lazyImage.dataset.src;
                if (src) {
                    lazyImage.src = src;
                    lazyImage.classList.remove('lazy-image');
                    lazyImage.removeAttribute('data-src');
                }
            }
        });
    }
}

/**
 * 初始化联系悬浮按钮
 */
function initializeContactButton() {
    if (!DOM.contactFloatBtn || !DOM.contactPanel) return;
    
    // 加载联系信息
    loadContactInfo();
    
    // 点击联系按钮显示联系面板
    DOM.contactFloatBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // 添加active类以显示面板
        DOM.contactPanel.classList.add('active');
        DOM.contactPanel.style.opacity = '1';
        DOM.contactPanel.style.transform = 'scale(1)';
    });
    
    // 点击关闭按钮关闭联系面板
    if (DOM.closeContactPanel) {
        DOM.closeContactPanel.addEventListener('click', function(e) {
            e.stopPropagation();
            closeContactPanel();
        });
    }
    
    // 点击面板外部关闭面板
    document.addEventListener('click', function(event) {
        if (DOM.contactPanel.classList.contains('active') && 
            !DOM.contactPanel.contains(event.target) && 
            event.target !== DOM.contactFloatBtn) {
            closeContactPanel();
        }
    });
}

/**
 * 关闭联系信息面板
 */
function closeContactPanel() {
    if (!DOM.contactPanel) return;
    
    DOM.contactPanel.classList.remove('active');
    DOM.contactPanel.style.opacity = '0';
    DOM.contactPanel.style.transform = 'scale(0)';
}

/**
 * 加载联系信息
 */
function loadContactInfo() {
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            const contact = data.contact || {};
            
            // 更新联系信息面板
            updateContactPanel(contact);
        })
        .catch(error => {
            console.error('加载联系信息出错:', error);
            // 出错时也隐藏联系按钮
            if (DOM.contactFloatBtn) {
                DOM.contactFloatBtn.style.display = 'none';
            }
        });
}

/**
 * 更新联系信息面板
 * @param {Object} contact - 联系信息对象
 */
function updateContactPanel(contact) {
    if (!contact) return;
    
    let hasContact = false;
    
    // 更新电话
    if (contact.phone && DOM.contactPhoneContainer) {
        const phoneDisplay = DOM.contactPhoneContainer.querySelector('#contactPhoneDisplay');
        if (phoneDisplay) phoneDisplay.textContent = contact.phone;
        DOM.contactPhoneContainer.classList.remove('hidden');
        hasContact = true;
    } else if (DOM.contactPhoneContainer) {
        DOM.contactPhoneContainer.classList.add('hidden');
    }
    
    // 更新QQ
    if (contact.qq && DOM.contactQQContainer) {
        const qqDisplay = DOM.contactQQContainer.querySelector('#contactQQDisplay');
        if (qqDisplay) qqDisplay.textContent = contact.qq;
        DOM.contactQQContainer.classList.remove('hidden');
        hasContact = true;
    } else if (DOM.contactQQContainer) {
        DOM.contactQQContainer.classList.add('hidden');
    }
    
    // 更新微信二维码
    if (contact.wechatQR && DOM.wechatQRContainer) {
        const wechatDisplay = DOM.wechatQRContainer.querySelector('#wechatQRDisplay');
        if (wechatDisplay) {
            wechatDisplay.src = contact.wechatQR || '';  // 确保不为undefined
            DOM.wechatQRContainer.classList.remove('hidden');
            hasContact = true;
        }
    } else if (DOM.wechatQRContainer) {
        DOM.wechatQRContainer.classList.add('hidden');
    }
    
    // 显示或隐藏"暂无联系方式"提示
    if (DOM.noContactInfo) {
        if (hasContact) {
            DOM.noContactInfo.classList.add('hidden');
        } else {
            DOM.noContactInfo.classList.remove('hidden');
        }
    }
    
    // 根据是否有联系方式显示或隐藏联系按钮
    if (DOM.contactFloatBtn) {
        if (hasContact) {
            DOM.contactFloatBtn.style.display = 'flex';
        } else {
            DOM.contactFloatBtn.style.display = 'none';
        }
    }
}
