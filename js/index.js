        // 缓存机制
        let phonesCache = null;
        let lastEditTimeCache = null;
        let lastFetchTime = 0;
        const CACHE_DURATION = 5000; // 5秒缓存
        
        // 分页状态
        let currentPage = 1;
        let totalPages = 1;
        let itemsPerPage = 9;
        // 排序状态
        let currentSortBy = 'price';
        let currentSortOrder = 'asc';
        let currentPriceFilter = 0; // 0表示全部显示，1000表示1000元以下，1001表示1000元以上

        // 从服务器获取产品数据
        async function getPhones(page = 1, limit = 10, sortBy = '', sortOrder = 'asc') {
            const now = Date.now();
            const cacheKey = `phones_${page}_${limit}_${sortBy}_${sortOrder}`;
            
            if (phonesCache && phonesCache[cacheKey] && (now - lastFetchTime < CACHE_DURATION)) {
                return phonesCache[cacheKey];
            }

            try {
                let url = `/api/phones`;
                
                // 只有当page和limit都不为null时才添加分页参数
                if (page !== null && limit !== null) {
                    url += `?page=${page}&limit=${limit}`;
                    
                    if (sortBy) {
                        url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
                    }
                } else if (sortBy) {
                    url += `?sortBy=${sortBy}&sortOrder=${sortOrder}`;
                }
                
                const response = await fetch(url);
                if (response.ok) {
                    const data = await response.json();
                    if (!phonesCache) phonesCache = {};
                    phonesCache[cacheKey] = data;
                    lastFetchTime = now;
                    
                    // 更新分页状态
                    currentPage = data.currentPage || 1;
                    totalPages = data.totalPages || 1;
                    
                    return data;
                } else {
                    console.error('获取产品数据失败');
                    return phonesCache?.[cacheKey] || { phones: [], total: 0, totalPages: 1, currentPage: 1 };
                }
            } catch (error) {
                console.error('获取产品数据失败:', error);
                return phonesCache?.[cacheKey] || { phones: [], total: 0, totalPages: 1, currentPage: 1 };
            }
        }

        // 渲染产品列表
        async function renderPhones(page = 1, sortBy = currentSortBy, sortOrder = currentSortOrder) {
            // 更新排序状态
            currentSortBy = sortBy;
            currentSortOrder = sortOrder;
            
            const container = document.getElementById('phone-container');
            const paginationContainer = document.getElementById('pagination-container');
            
            // 获取所有手机数据，不使用分页参数
            const data = await getPhones(null, null, sortBy, sortOrder);
            let phones = data.phones || data; // 兼容旧版API返回格式
            
            console.log("筛选前的手机数量:", phones.length);
            console.log("当前价格筛选值:", currentPriceFilter);
            
            // 确保所有价格都是数字
            phones = phones.map(phone => ({
                ...phone,
                price: typeof phone.price === 'string' ? parseFloat(phone.price) : phone.price
            }));
            
            // 应用价格筛选
            if (currentPriceFilter === 1000) {
                phones = phones.filter(phone => phone.price < 1000);
                console.log("筛选后的手机数量 (1000元以下):", phones.length);
            } else if (currentPriceFilter > 1000) {
                phones = phones.filter(phone => phone.price >= 1000);
                console.log("筛选后的手机数量 (1000元以上):", phones.length);
            }
            
            // 更新排序按钮状态
            updateSortButtons();
            
            // 渲染手机列表
            container.innerHTML = phones.map(phone => `
                <div class="phone-card bg-white rounded-lg shadow-md overflow-hidden ${phone.soldOut ? 'sold-out' : ''}" 
                     data-price="${phone.price}" 
                     data-name="${phone.name}">
                    <img src="${phone.mainImageUrl}" alt="${phone.name}" class="w-full object-contain h-auto ${phone.soldOut ? '' : 'cursor-pointer'}"
                         onclick="${phone.soldOut ? '' : `showDetails(${JSON.stringify(phone).replace(/"/g, '&quot;')})`}">
                    <div class="p-4">
                        <h2 class="text-xl font-semibold mb-2">${phone.name}</h2>
                        <p class="text-gray-600 mb-2">存储: ${phone.storage}</p>
                        <p class="text-gray-600 mb-2">成色: ${phone.condition}</p>
                        <p class="text-gray-600 mb-2">维修记录: ${phone.repair || '无'}</p>
                        <div class="mt-4 flex justify-between items-center">
                            <span class="text-xl font-bold text-green-500">￥${phone.price}</span>
                            <button class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" 
                                    onclick="${phone.soldOut ? '' : `showDetails(${JSON.stringify(phone).replace(/"/g, '&quot;')})`}"
                                    ${phone.soldOut ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                                查看详情
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // 渲染分页控件
            if (data.totalPages && data.totalPages > 1) {
                let paginationHTML = '<div class="pagination flex justify-center mt-6">';
                
                // 上一页按钮
                paginationHTML += `
                    <button class="pagination-btn mx-1 px-3 py-1 rounded ${currentPage === 1 ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}" 
                            ${currentPage === 1 ? 'disabled' : `onclick="renderPhones(${currentPage - 1})"`}>
                        上一页
                    </button>
                `;
                
                // 页码按钮
                for (let i = 1; i <= data.totalPages; i++) {
                    if (
                        i === 1 || 
                        i === data.totalPages || 
                        (i >= currentPage - 1 && i <= currentPage + 1)
                    ) {
                        paginationHTML += `
                            <button class="pagination-btn mx-1 px-3 py-1 rounded ${i === currentPage ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white hover:bg-blue-700'}" 
                                    onclick="renderPhones(${i})">
                                ${i}
                            </button>
                        `;
                    } else if (
                        (i === currentPage - 2 && currentPage > 3) || 
                        (i === currentPage + 2 && currentPage < data.totalPages - 2)
                    ) {
                        paginationHTML += '<span class="mx-1">...</span>';
                    }
                }
                
                // 下一页按钮
                paginationHTML += `
                    <button class="pagination-btn mx-1 px-3 py-1 rounded ${currentPage === data.totalPages ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-700'}" 
                            ${currentPage === data.totalPages ? 'disabled' : `onclick="renderPhones(${currentPage + 1})"`}>
                        下一页
                    </button>
                `;
                
                paginationHTML += '</div>';
                paginationContainer.innerHTML = paginationHTML;
            } else {
                paginationContainer.innerHTML = '';
            }
        }

        // 更新排序按钮状态
        function updateSortButtons() {
            const sortButtons = document.querySelectorAll('.sort-btn');
            sortButtons.forEach(btn => {
                const sortField = btn.getAttribute('data-sort');
                
                // 移除所有按钮的active类和排序方向属性
                btn.classList.remove('active');
                btn.removeAttribute('data-order');
                
                // 为当前排序字段的按钮添加active类和排序方向属性
                if (sortField === currentSortBy) {
                    btn.classList.add('active');
                    btn.setAttribute('data-order', currentSortOrder);
                }
            });
        }

        // 排序处理函数
        function handleSort(sortBy) {
            // 如果点击当前排序字段，则切换排序顺序
            const newSortOrder = (sortBy === currentSortBy && currentSortOrder === 'asc') ? 'desc' : 'asc';
            renderPhones(1, sortBy, newSortOrder);
        }

        // 价格筛选
        async function filterPrice(price, event) {
            console.log(`执行价格筛选: ${price}`);
            // 保存当前筛选价格到全局变量
            currentPriceFilter = price;
            
            const buttons = document.querySelectorAll('.filter-btn');
            
            // 更新按钮样式
            buttons.forEach(btn => btn.classList.remove('active'));
            if (event && event.target) {
                event.target.classList.add('active');
            }

            // 使用当前的排序方式重新渲染
            renderPhones(1, currentSortBy, currentSortOrder);
        }

        const ModalManager = {
            show: (modalId) => {
                document.getElementById(modalId).style.display = 'block';
            },
            
            hide: (modalId) => {
                document.getElementById(modalId).style.display = 'none';
            },
            
            init: () => {
                // 点击模态框外部关闭
                window.onclick = (event) => {
                    if (event.target.classList.contains('modal')) {
                        event.target.style.display = 'none';
                    }
                };
            }
        };

        // 打开详情模态框
        function showDetails(phone) {
            const modal = document.getElementById('phoneModal');
            const title = document.getElementById('modalTitle');
            const content = document.getElementById('modalContent');

            title.textContent = phone.name;
            content.innerHTML = `
                <div class="grid grid-cols-1 gap-6 text-center">
                    <div class="bg-gray-50 p-6 rounded-lg">
                        <h3 class="text-xl font-semibold mb-4 text-blue-600">基本信息</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-center">
                                <span class="text-gray-500">存储：</span>
                                <span class="ml-2 font-medium">${phone.storage}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-500">成色：</span>
                                <span class="ml-2 font-medium">${phone.condition}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-500">价格：</span>
                                <span class="ml-2 font-medium text-red-500">￥${phone.price}</span>
                            </div>
                            <div class="flex items-center">
                                <span class="text-gray-500">状态：</span>
                                <span class="ml-2 font-medium ${phone.soldOut ? 'text-red-500' : 'text-green-500'}">
                                    ${phone.soldOut ? '已售' : '在售'}
                                </span>
                            </div>
                        </div>
                        <div class="mt-4 text-left">
                            <span class="text-gray-500">维修记录：</span>
                            <span class="ml-2">${phone.repair || '无'}</span>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-6 rounded-lg space-y-4 text-center">
                        <h3 class="text-xl font-semibold text-blue-600">图片展示</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            ${[phone.mainImageUrl, ...phone.detailImageUrls].map((url, index) => `
                                <div class="cursor-pointer" onclick="showFullImage(${index})">
                                    <img src="${url}" alt="${phone.name}" class="rounded-lg hover:opacity-90 transition-opacity">
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
            
            window.currentPhone = phone;
            modal.style.display = 'block';
        }

        // 显示全屏图片
        function showFullImage(index) {
            const phone = window.currentPhone;
            const allImages = [phone.mainImageUrl, ...phone.detailImageUrls];
            const totalImages = allImages.length;

            // 移除可能存在的旧模态框
            const oldModal = document.querySelector('.image-viewer');
            if (oldModal) {
                oldModal.remove();
            }

            const fullImageModal = document.createElement('div');
            fullImageModal.className = 'modal image-viewer';
            fullImageModal.style.display = 'block';
            
            fullImageModal.innerHTML = `
                <div class="modal-content bg-black bg-opacity-90 p-0 relative flex items-center justify-center min-h-screen w-full">
                    <span class="close-button text-white z-50" onclick="closeImageViewer()">&times;</span>
                    
                    <button class="nav-btn left-4 ${index === 0 ? 'hidden' : ''}" onclick="prevImage(${index})">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                        </svg>
                    </button>
                    
                    <div class="image-container cursor-zoom-in" onclick="toggleImageZoom(event)">
                        <img src="${allImages[index]}" class="max-h-screen w-auto object-contain transition-transform duration-300" 
                             style="max-width: 98vw; transform-origin: center;">
                    </div>
                    
                    <button class="nav-btn right-4 ${index === totalImages - 1 ? 'hidden' : ''}" onclick="nextImage(${index})">
                        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                    </button>

                    <div class="image-counter">
                        ${index + 1} / ${totalImages}
                    </div>
                </div>
            `;
            
            document.body.appendChild(fullImageModal);

            // 使用单个事件处理器
            const handleKeyDown = function(event) {
                if (event.key === 'ArrowLeft' && index > 0) {
                    prevImage(index);
                } else if (event.key === 'ArrowRight' && index < totalImages - 1) {
                    nextImage(index);
                } else if (event.key === 'Escape') {
                    closeImageViewer();
                }
            };

            // 点击外部关闭
            fullImageModal.addEventListener('click', function(event) {
                if (event.target === fullImageModal) {
                    closeImageViewer();
                }
            });

            // 添加键盘事件监听
            document.addEventListener('keydown', handleKeyDown);

            // 保存事件处理器引用以便后续移除
            fullImageModal.handleKeyDown = handleKeyDown;
        }

        // 切换图片缩放
        function toggleImageZoom(event) {
            const img = event.target.closest('.image-container').querySelector('img');
            const container = event.target.closest('.image-container');
            
            if (img.style.transform === 'scale(2)') {
                img.style.transform = 'scale(1)';
                container.classList.remove('cursor-zoom-out');
                container.classList.add('cursor-zoom-in');
            } else {
                img.style.transform = 'scale(2)';
                container.classList.remove('cursor-zoom-in');
                container.classList.add('cursor-zoom-out');
            }
        }

        // 上一张图片
        function prevImage(currentIndex) {
            if (currentIndex > 0) {
                showFullImage(currentIndex - 1);
            }
        }

        // 下一张图片
        function nextImage(currentIndex) {
            const phone = window.currentPhone;
            const totalImages = phone.detailImageUrls.length + 1;
            if (currentIndex < totalImages - 1) {
                showFullImage(currentIndex + 1);
            }
        }

        // 关闭图片查看器
        function closeImageViewer() {
            const modal = document.querySelector('.image-viewer');
            if (modal) {
                // 移除键盘事件监听
                document.removeEventListener('keydown', modal.handleKeyDown);
                modal.remove();
            }
        }

        // 关闭详情模态框
        function closeModal() {
            ModalManager.hide('phoneModal');
        }

        // 获取最后编辑时间
        async function getLastEditTime() {
            try {
                const response = await fetch('/api/last-edit-time');
                if (response.ok) {
                    const data = await response.json();
                    return data.lastEditTime;
                }
                return null;
            } catch (error) {
                console.error('获取最后编辑时间失败:', error);
                return null;
            }
        }

        // 更新最后编辑时间显示
        async function updateLastEditTime() {
            const lastEditTime = await getLastEditTime();
            if (lastEditTime && lastEditTime !== lastEditTimeCache) {
                lastEditTimeCache = lastEditTime;
                const element = document.getElementById('lastEditTime');
                if (element) {
                    const date = new Date(lastEditTime);
                    element.textContent = date.toLocaleString('zh-CN');
                }
                // 如果时间有更新，则刷新数据
                await renderPhones();
            }
        }

        // 开始更新检查器
        function startUpdateChecker() {
            // 每30秒检查一次更新
            setInterval(updateLastEditTime, 30000);
        }

        // 页面加载完成后执行
        document.addEventListener('DOMContentLoaded', function() {
            // 初始化标题点击事件
            initializeTitleClick();
            
            // 加载网站设置 - 使用异步加载
            loadSiteSettings().then(() => {
                // 加载数据
                loadData();
                
                // 启动更新检查器
                startUpdateChecker();
            });
        });

        // 将标题点击逻辑抽离为单独的函数
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

        // 加载网站设置
        async function loadSiteSettings() {
            try {
                // 从服务器获取设置，浏览器会自动处理ETag和304响应
                const response = await fetch('/api/settings');
                
                // 如果服务器返回304，fetch API会抛出错误，我们捕获并使用本地缓存
                if (!response.ok && response.status !== 304) {
                    throw new Error('无法从服务器获取设置');
                }
                
                // 只有在有新数据时才解析JSON
                if (response.status !== 304) {
                    const settings = await response.json();
                    console.log('从服务器获取的设置:', settings);
                    
                    // 缓存到localStorage
                    localStorage.setItem('siteSettings', JSON.stringify(settings));
                    
                    // 应用设置到UI
                    applySettings(settings);
                } else {
                    console.log('使用缓存的设置');
                    // 304情况，使用本地缓存
                    const settings = JSON.parse(localStorage.getItem('siteSettings')) || {};
                    
                    // 应用设置到UI
                    applySettings(settings);
                }
            } catch (error) {
                console.error('加载网站设置失败:', error);
                // 出错时尝试从本地缓存加载
                const settings = JSON.parse(localStorage.getItem('siteSettings')) || {};
                
                // 应用设置到UI
                applySettings(settings);
            }
        }

        // 将设置应用到UI的辅助函数
        function applySettings(settings) {
            // 更新标题
            if (settings.title) {
                document.title = settings.title;
                const titleSpan = document.querySelector('h1 span');
                if (titleSpan) {
                    titleSpan.textContent = settings.title;
                }
            }
            
            // 更新Logo
            if (settings.logo) {
                const logoElement = document.getElementById('siteLogo');
                if (logoElement) {
                    logoElement.src = settings.logo;
                    logoElement.classList.remove('hidden');
                }
            }
            
            // 更新Favicon
            if (settings.favicon) {
                const favicon = document.getElementById('favicon');
                if (favicon) {
                    favicon.href = settings.favicon;
                }
            }
        }

        // 加载数据
        function loadData() {
            // 渲染手机列表
            renderPhones();
            
            // 更新最后编辑时间
            updateLastEditTime();
        }

        // 显示手机列表
        function displayPhones(phones) {
            const container = document.getElementById('phone-container');
            container.innerHTML = phones.map(phone => `
                <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <img src="${phone.mainImageUrl}" alt="${phone.name}" class="w-full h-48 object-cover cursor-pointer"
                         onclick="showDetails(${JSON.stringify(phone).replace(/"/g, '&quot;')})">
                    <div class="p-4">
                        <h3 class="text-xl font-semibold mb-2">${phone.name}</h3>
                        <p class="text-gray-600">存储: ${phone.storage}</p>
                        <p class="text-gray-600">成色: ${phone.condition}</p>
                        <p class="text-red-500 font-bold mt-2">¥${phone.price}</p>
                    </div>
                </div>
            `).join('');
        }

        // 点击空白处关闭模态框
        window.onclick = function(event) {
            const modal = document.getElementById('phoneModal');
            if (event.target === modal) {
                closeModal();
            }
        };

        // 加载Logo和背景
        async function loadLogoAndBackground() {
            try {
                // 从服务器获取设置，浏览器会自动处理ETag和304响应
                const response = await fetch('/api/settings');
                
                // 如果服务器返回304，fetch API会抛出错误，我们捕获并使用本地缓存
                if (!response.ok && response.status !== 304) {
                    throw new Error('无法从服务器获取设置');
                }
                
                // 只有在有新数据时才解析JSON
                if (response.status !== 304) {
                    const settings = await response.json();
                    console.log('从服务器获取的设置:', settings);
                    
                    // 缓存到localStorage
                    localStorage.setItem('siteSettings', JSON.stringify(settings));
                    
                    // 应用设置到UI
                    applySettings(settings);
                } else {
                    console.log('使用缓存的设置');
                    // 304情况，使用本地缓存
                    const settings = JSON.parse(localStorage.getItem('siteSettings')) || {};
                    
                    // 应用设置到UI
                    applySettings(settings);
                }
            } catch (error) {
                console.error('加载网站设置失败:', error);
                // 出错时尝试从本地缓存加载
                const settings = JSON.parse(localStorage.getItem('siteSettings')) || {};
                
                // 应用设置到UI
                applySettings(settings);
            }
        }
