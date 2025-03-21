// 常量定义 - 将常用的选择器提取为常量
const SELECTORS = {
    SIDEBAR: '.col-span-12.lg\\:col-span-2',
    SIDEBAR_TEXT: '.col-span-12.lg\\:col-span-2 .flex.justify-between.items-center span',
    MAIN_CONTENT: '.col-span-12.lg\\:col-span-10',
    PRODUCT_MODAL: '#productModal',
    SETTINGS_MODAL: '#settingsModal'
};

// 检查窗口是否为桌面尺寸
const isDesktopView = () => window.innerWidth >= 1024;

// 防抖函数 - 提高到文件顶部以便全局使用
function debounce(func, wait = 250) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 通知弹窗功能
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
    
    // 准备图标
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<i class="fas fa-check-circle toast-icon"></i>';
            break;
        case 'error':
            icon = '<i class="fas fa-exclamation-circle toast-icon"></i>';
            break;
        case 'warning':
            icon = '<i class="fas fa-exclamation-triangle toast-icon"></i>';
            break;
        case 'info':
        default:
            icon = '<i class="fas fa-info-circle toast-icon"></i>';
            break;
    }
    
    // 构建内容
    let content = `
        ${icon}
        <div class="toast-content">
            ${title ? `<div class="toast-title">${title}</div>` : ''}
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </div>
        <div class="toast-progress">
            <div class="toast-progress-bar"></div>
        </div>
    `;
    
    toast.innerHTML = content;
    
    // 添加到容器
    container.appendChild(toast);
    
    // 触发重绘以应用初始样式
    toast.offsetHeight;
    
    // 显示toast
    toast.classList.add('show');
    
    // 设置进度条动画
    const progressBar = toast.querySelector('.toast-progress-bar');
    progressBar.style.transition = `width ${duration}ms linear`;
    progressBar.style.width = '0%';
    
    // 设置自动关闭
    const timeout = setTimeout(() => {
        toast.classList.remove('show');
        
        // 动画结束后移除元素
        toast.addEventListener('transitionend', () => {
            toast.remove();
        });
    }, duration);
    
    // 点击关闭按钮时清除定时器
    const closeButton = toast.querySelector('.toast-close');
    closeButton.addEventListener('click', () => {
        clearTimeout(timeout);
        toast.classList.remove('show');
    });
    
    return toast;
}

// 立即执行的登录检查
(async function() {
    try {
        const response = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        
        if (!response.ok || !(await response.json()).isLoggedIn) {
            window.location.replace('/login');
        }
    } catch (error) {
        console.error('登录检查失败:', error);
        window.location.replace('/login');
    }
})();

// 检查登录状态
async function checkLogin() {
    try {
        const response = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        
        if (!response.ok) {
            window.location.replace('/login');
            return false;
        }
        
        const data = await response.json();
        if (!data.isLoggedIn) {
            window.location.replace('/login');
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('登录检查失败:', error);
        window.location.replace('/login');
        return false;
    }
}

// 全局变量存储产品数据和筛选条件
let phones = [];
let currentFilters = {
    search: '',
    status: '',
    sortBy: '',
    sortOrder: 'asc',
    page: 1,
    limit: 10
};

// 从文件加载产品数据
async function loadPhonesFromFile() {
    try {
        const response = await fetch('/api/phones', {
            credentials: 'include'
        });
        if (response.ok) {
            phones = await response.json();
        } else {
            console.error('加载产品数据失败');
            phones = [];
        }
    } catch (error) {
        console.error('加载产品数据失败:', error);
        phones = [];
    }
}

// 保存产品数据到文件
async function savePhonesToFile() {
    try {
        const response = await fetch('/api/phones', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(phones)
        });
        
        if (!response.ok) {
            throw new Error('保存失败');
        }
    } catch (error) {
        console.error('保存产品数据失败:', error);
        showToast('保存失败，请重试', 'error');
    }
}

// 检查密码状态
async function checkPasswordStatus() {
    try {
        const response = await fetch('/api/password-status', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.needPasswordChange) {
            showChangePasswordModal();
        }
    } catch (error) {
        console.error('检查密码状态失败:', error);
    }
}

// 显示修改密码模态框
function showChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
}

// 关闭修改密码模态框
function closeChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}

// 修改密码
async function changePassword(currentPassword, newPassword) {
    try {
        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showToast('密码修改成功！', 'success');
                closeChangePasswordModal();
                return true;
            } else {
                showToast(data.error || '密码修改失败', 'error');
                return false;
            }
        } else {
            showToast('修改密码失败，请重试', 'error');
            return false;
        }
    } catch (error) {
        showToast('修改密码失败，请重试', 'error');
        return false;
    }
}

// 打开修改密码模态框
function openChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
    // 清空表单
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
    
    // 设置隐藏的用户名字段（如果有）
    const usernameField = document.getElementById('username');
    if (usernameField) {
        // 通常这里应该设置为当前登录用户名，从服务器获取或本地存储
        // 这里我们使用一个默认值
        usernameField.value = 'admin';
    }
}

// 添加触摸手势支持
let touchStartX = 0;
let touchStartY = 0;
let currentRow = null;
let rowInitialX = 0;
const SWIPE_THRESHOLD = 50; // 滑动阈值

// 初始化触摸事件
function initTouchEvents() {
    const container = document.getElementById('phone-container');
    
    container.addEventListener('touchstart', handleTouchStart, false);
    container.addEventListener('touchmove', handleTouchMove, false);
    container.addEventListener('touchend', handleTouchEnd, false);
}

// 处理触摸开始
function handleTouchStart(event) {
    if (event.target.closest('button')) return; // 如果点击的是按钮，不处理滑动
    
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    
    // 找到当前触摸的行
    currentRow = event.target.closest('tr');
    if (currentRow) {
        // 重置其他行的位置
        const allRows = document.querySelectorAll('tr');
        allRows.forEach(row => {
            if (row !== currentRow) {
                row.style.transform = 'translateX(0)';
                const actions = row.querySelector('.swipe-actions');
                if (actions) actions.remove();
            }
        });
        
        rowInitialX = 0;
        currentRow.style.transform = `translateX(${rowInitialX}px)`;
    }
}

// 处理触摸移动
function handleTouchMove(event) {
    if (!currentRow || event.target.closest('button')) return;
    
    // 检查事件是否可取消，如果不可取消则直接返回
    if (!event.cancelable) return;
    
    event.preventDefault(); // 防止页面滚动
    
    const touch = event.touches[0];
    const currentX = touch.clientX;
    const diffX = rowInitialX - currentX;
    
    // 限制最大滑动距离
    const maxSlideDistance = 100;
    
    if (diffX > 0) {
        // 向左滑动，显示操作按钮
        const translateX = Math.min(diffX, maxSlideDistance);
        currentRow.style.transform = `translateX(-${translateX}px)`;
    } else {
        // 向右滑动，复位
        currentRow.style.transform = 'translateX(0)';
    }
}

// 处理触摸结束
function handleTouchEnd() {
    if (!currentRow) return;
    
    const phoneId = parseInt(currentRow.getAttribute('data-id'));
    
    if (Math.abs(rowInitialX) >= SWIPE_THRESHOLD) {
        if (rowInitialX > 0) {
            // 右滑显示删除确认
            currentRow.style.transform = 'translateX(100px)';
            showActionButtons(currentRow, phoneId, 'delete');
        } else {
            // 左滑显示编辑确认
            currentRow.style.transform = 'translateX(-100px)';
            showActionButtons(currentRow, phoneId, 'edit');
        }
    } else {
        // 滑动距离不够，回到原位
        resetRowPosition(currentRow);
    }
    
    currentRow = null;
}

// 显示操作按钮
function showActionButtons(row, phoneId, action) {
    // 移除已存在的操作按钮
    const existingActions = row.querySelector('.swipe-actions');
    if (existingActions) {
        existingActions.remove();
    }

    // 创建新的操作按钮容器
    const actionsDiv = document.createElement('div');
    actionsDiv.className = `swipe-actions absolute ${action === 'delete' ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 flex items-center z-50`;
    
    if (action === 'delete') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-icon btn-sm btn-danger';
        deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deleteProduct(phoneId);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-icon btn-sm btn-secondary ml-2';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            resetRowPosition(row);
        };
        
        actionsDiv.appendChild(deleteBtn);
        actionsDiv.appendChild(cancelBtn);
    } else {
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-icon btn-sm btn-primary';
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editProduct(phoneId);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-icon btn-sm btn-secondary ml-2';
        cancelBtn.innerHTML = '<i class="fas fa-times"></i>';
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            resetRowPosition(row);
        };
        
        actionsDiv.appendChild(editBtn);
        actionsDiv.appendChild(cancelBtn);
    }
    
    row.appendChild(actionsDiv);
}

// 重置行位置
function resetRowPosition(row) {
    if (!row) return;
    
    // 使用 transform 设置位置
    row.style.transform = 'translateX(0)';
    
    // 移除操作按钮
    const actionsDiv = row.querySelector('.swipe-actions');
    if (actionsDiv) {
        actionsDiv.remove();
    }
}

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', async () => {
    // 检查登录状态
    if (!await checkLogin()) {
        return;
    }
    
    // 已登录后再加载其他内容
    await loadPhonesFromFile();
    loadSettings(); // 加载网站设置
    displayPhones();
    setupEventListeners();
    initPaginationButtons(); // 添加初始化分页按钮
    checkPasswordStatus();
    
    // 调整快捷操作卡片布局
    adjustQuickActionsLayout();
    
    // 调整右侧系统设置区域高度
    adjustSidebarHeight();
    
    // 初始化快捷操作卡片滑动功能
    initQuickActionsSwipe();
    
    // 调整表单响应式样式
    adjustFormResponsiveStyles();
    
    // 初始化触摸事件
    initTouchEvents();
    
    // 更新统计数据
    updateStatistics();
    
    // 调整卡片内文本溢出
    adjustCardTextOverflow();
    
    // 清除所有之前的事件监听器，重新绑定事件
    rebindEventListeners();
});

// 重新绑定所有事件监听器
function rebindEventListeners() {
    // 绑定设置表单提交事件
    const settingsForm = document.getElementById('siteSettingsForm');
    if (settingsForm) {
        // 移除可能的旧事件
        const newSettingsForm = settingsForm.cloneNode(true);
        if (settingsForm.parentNode) {
            settingsForm.parentNode.replaceChild(newSettingsForm, settingsForm);
        }
        
        // 添加新的事件处理
        newSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSettings(e);
        });
    }
    
    // 商品表单重新绑定
    const productForm = document.getElementById('productForm');
    if (productForm) {
        const newProductForm = productForm.cloneNode(true);
        if (productForm.parentNode) {
            productForm.parentNode.replaceChild(newProductForm, productForm);
        }
        
        // 添加图片URL预览功能
        const mainImageInput = newProductForm.querySelector('#mainImageUrl');
        const detailImagesInput = newProductForm.querySelector('#detailImageUrls');
        
        if (mainImageInput) {
            mainImageInput.addEventListener('input', (e) => previewMainImage(e.target.value));
        }
        
        if (detailImagesInput) {
            detailImagesInput.addEventListener('input', (e) => previewDetailImages(e.target.value));
        }
        
        // 添加表单提交事件
        newProductForm.addEventListener('submit', handleFormSubmit);
    }
    
    // 修改密码表单重新绑定
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        const newChangePasswordForm = changePasswordForm.cloneNode(true);
        if (changePasswordForm.parentNode) {
            changePasswordForm.parentNode.replaceChild(newChangePasswordForm, changePasswordForm);
        }
        
        newChangePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                showToast('两次输入的新密码不一致', 'warning');
                return;
            }

            if (newPassword.length < 6) {
                showToast('新密码长度不能小于6位', 'warning');
                return;
            }

            await changePassword(currentPassword, newPassword);
        });
    }
    
    // 搜索输入框重新绑定
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        const newSearchInput = searchInput.cloneNode(true);
        if (searchInput.parentNode) {
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
        }
        
        newSearchInput.addEventListener('input', debounce(function(e) {
            currentFilters.search = e.target.value.trim();
            currentFilters.page = 1; // 重置页码
            displayPhones();
        }, 300));
    }
    
    // 状态筛选重新绑定
    const statusSelect = document.getElementById('statusFilter');
    if (statusSelect) {
        const newStatusSelect = statusSelect.cloneNode(true);
        if (statusSelect.parentNode) {
            statusSelect.parentNode.replaceChild(newStatusSelect, statusSelect);
        }
        
        newStatusSelect.addEventListener('change', function(e) {
            currentFilters.status = e.target.value;
            currentFilters.page = 1; // 重置页码
            displayPhones();
        });
    }
    
    // 排序筛选重新绑定
    const sortSelect = document.getElementById('sortFilter');
    if (sortSelect) {
        const newSortSelect = sortSelect.cloneNode(true);
        if (sortSelect.parentNode) {
            sortSelect.parentNode.replaceChild(newSortSelect, sortSelect);
        }
        
        newSortSelect.addEventListener('change', function(e) {
            const [sortBy, sortOrder] = e.target.value.split('_');
            currentFilters.sortBy = sortBy;
            currentFilters.sortOrder = sortOrder;
            currentFilters.page = 1; // 重置页码
            displayPhones();
        });
    }
    
    // 重新初始化分页按钮
    initPaginationButtons();
}

// 设置事件监听器 - 只处理不直接与表单相关的事件
function setupEventListeners() {
    // 设置模态框按钮事件
    const openSettingsBtn = document.querySelector('[onclick="openSettingsModal()"]');
    if (openSettingsBtn) {
        openSettingsBtn.onclick = openSettingsModal;
    }
    
    const closeSettingsBtn = document.querySelector('[onclick="closeSettingsModal()"]');
    if (closeSettingsBtn) {
        closeSettingsBtn.onclick = closeSettingsModal;
    }
    
    // 商品模态框按钮事件
    const addProductBtn = document.querySelector('[onclick="openAddProductModal()"]');
    if (addProductBtn) {
        addProductBtn.onclick = openAddProductModal;
    }
    
    const closeProductBtn = document.querySelector('[onclick="closeProductModal()"]');
    if (closeProductBtn) {
        closeProductBtn.onclick = closeProductModal;
    }
    
    // 密码修改模态框按钮事件
    const openPasswordBtn = document.querySelector('[onclick="openChangePasswordModal()"]');
    if (openPasswordBtn) {
        openPasswordBtn.onclick = openChangePasswordModal;
    }
    
    const closePasswordBtn = document.querySelector('[onclick="closeChangePasswordModal()"]');
    if (closePasswordBtn) {
        closePasswordBtn.onclick = closeChangePasswordModal;
    }
    
    // 退出登录按钮事件
    const logoutBtn = document.querySelector('[onclick="logout()"]');
    if (logoutBtn) {
        logoutBtn.onclick = logout;
    }
}

// 打开系统设置模态框
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        // 应用flex布局以居中显示
        modal.style.display = 'flex';
        modal.style.alignItems = 'center';
        modal.style.justifyContent = 'center';
        loadSettings();
    } else {
        console.error("找不到设置模态框");
    }
}

// 关闭系统设置模态框
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    if (modal) {
        modal.style.display = 'none';
    } else {
        console.error("找不到设置模态框");
    }
}

// 加载网站设置
async function loadSettings() {
    try {
        // 获取当前用户名并显示
        const username = await getCurrentUsername();
        const usernameElement = document.getElementById('adminUsername');
        if (usernameElement) {
            usernameElement.textContent = username;
            usernameElement.title = username; // 添加标题提示，确保鼠标悬停可显示完整用户名
        }

        const response = await fetch('/api/settings', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const settings = await response.json();
            console.log("成功加载设置:", settings);
            
            // 填充表单
            document.getElementById('siteTitle').value = settings.title || '';
            
            // 显示Logo预览
            if (settings.logo) {
                showPreview('logoPreview', settings.logo);
                document.getElementById('logoPreview').style.display = 'block';
            } else {
                document.getElementById('logoPreview').style.display = 'none';
            }
            
            // 显示Favicon预览
            if (settings.favicon) {
                showPreview('faviconPreview', settings.favicon);
                document.getElementById('faviconPreview').style.display = 'block';
            } else {
                document.getElementById('faviconPreview').style.display = 'none';
            }
            
            // 更新设置显示
            updateSettingsDisplay(settings);
            
            // 更新状态指示
            const logoStatus = document.getElementById('logoStatusText');
            if (logoStatus) {
                if (settings.logo) {
                    logoStatus.textContent = '已设置';
                    logoStatus.className = 'text-green-500';
                } else {
                    logoStatus.textContent = '未设置';
                    logoStatus.className = 'text-gray-500';
                }
            }
            
            const faviconStatus = document.getElementById('faviconStatusText');
            if (faviconStatus) {
                if (settings.favicon) {
                    faviconStatus.textContent = '已设置';
                    faviconStatus.className = 'text-green-500';
                } else {
                    faviconStatus.textContent = '未设置';
                    faviconStatus.className = 'text-gray-500';
                }
            }
            
            const settingsStatus = document.getElementById('settingsStatus');
            if (settingsStatus) {
                if (settings.title || settings.logo || settings.favicon) {
                    settingsStatus.textContent = '已配置';
                    settingsStatus.className = 'text-sm font-medium text-green-500';
                } else {
                    settingsStatus.textContent = '未配置';
                    settingsStatus.className = 'text-sm font-medium text-red-500';
                }
            }
        }
    } catch (error) {
        console.error('加载设置失败:', error);
    }
}

// 保存网站设置
async function saveSettings(event) {
    event.preventDefault();
    
    const form = document.getElementById('siteSettingsForm');
    const settings = {
        title: form.siteTitle.value.trim(),
        logo: document.querySelector('#logoPreview img')?.src || '',
        favicon: document.querySelector('#faviconPreview img')?.src || ''
    };

    try {
        const response = await fetch('/api/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(settings)
        });

        if (response.ok) {
            showToast('设置保存成功！', 'success');
            // 更新本地显示而不是刷新整个页面
            updateSettingsDisplay(settings);
            closeSettingsModal();
        } else {
            showToast('保存设置失败，请重试', 'error');
        }
    } catch (error) {
        console.error('保存设置失败:', error);
        showToast('保存设置失败，请重试', 'error');
    }
}

// 上传图片
async function uploadImage(file, type) {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        
        const response = await fetch('/api/upload-image', {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        
        if (response.ok) {
            const data = await response.json();
            showToast(`${type === 'logo' ? 'Logo' : '网站图标'}上传成功！`, 'success');
            return data.url;
        } else {
            showToast('上传图片失败，请重试', 'error');
            return null;
        }
    } catch (error) {
        console.error('上传图片失败:', error);
        showToast('上传图片失败，请重试', 'error');
        return null;
    }
}

// 验证并预览文件
async function validateAndPreviewFile(input, previewId, maxSizeKB) {
    const file = input.files[0];
    if (!file) return;
    
    // 验证文件大小
    if (file.size > maxSizeKB * 1024) {
        showToast(`文件大小不能超过 ${maxSizeKB}KB`, 'warning');
        input.value = '';
        return;
    }
    
    // 验证文件类型
    if (!file.type.startsWith('image/')) {
        showToast('只能上传图片文件', 'warning');
        input.value = '';
        return;
    }
    
    // 上传文件
    const url = await uploadImage(file, previewId === 'logoPreview' ? 'logo' : 'favicon');
    if (url) {
        showPreview(previewId, url);
        document.getElementById(previewId).style.display = 'block';
    }
}

// 显示预览
function showPreview(previewId, src) {
    const preview = document.getElementById(previewId);
    preview.innerHTML = `<img src="${src}" alt="预览" class="max-h-20">`;
    preview.style.display = 'block';
}

// 删除Logo
async function deleteLogo() {
    if (!confirm('确定要删除当前Logo？删除后将无法恢复。')) {
        return;
    }
    
    try {
        // 清空本地预览
        document.getElementById('siteLogo').value = '';
        document.getElementById('logoPreview').innerHTML = '';
        document.getElementById('logoPreview').style.display = 'none';
        
        // 从服务器删除文件
        const response = await fetch('/api/delete-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ type: 'logo' })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showToast('Logo已成功删除', 'success');
                // 更新设置状态显示
                const logoStatus = document.getElementById('logoStatusText');
                if (logoStatus) {
                    logoStatus.textContent = '未设置';
                    logoStatus.className = 'text-gray-500';
                }
            } else {
                showToast('删除Logo时发生错误，请稍后重试', 'error');
            }
        } else {
            showToast('删除Logo时发生错误，请稍后重试', 'error');
        }
    } catch (error) {
        console.error('删除Logo失败:', error);
        showToast('删除Logo时发生错误，请稍后重试', 'error');
    }
}

// 删除Favicon
async function deleteFavicon() {
    if (!confirm('确定要删除当前网站图标？删除后将无法恢复。')) {
        return;
    }
    
    try {
        // 清空本地预览
        document.getElementById('siteFavicon').value = '';
        document.getElementById('faviconPreview').innerHTML = '';
        document.getElementById('faviconPreview').style.display = 'none';
        
        // 从服务器删除文件
        const response = await fetch('/api/delete-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ type: 'favicon' })
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                showToast('网站图标已成功删除', 'success');
                // 更新设置状态显示
                const faviconStatus = document.getElementById('faviconStatusText');
                if (faviconStatus) {
                    faviconStatus.textContent = '未设置';
                    faviconStatus.className = 'text-gray-500';
                }
            } else {
                showToast('删除网站图标时发生错误，请稍后重试', 'error');
            }
        } else {
            showToast('删除网站图标时发生错误，请稍后重试', 'error');
        }
    } catch (error) {
        console.error('删除Favicon失败:', error);
        showToast('删除网站图标时发生错误，请稍后重试', 'error');
    }
}

// 退出登录
async function logout() {
    if (confirm('确定要退出登录吗？')) {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                window.location.href = '/login';
            } else {
                alert('退出登录失败，请重试');
            }
        } catch (error) {
            console.error('退出登录请求失败:', error);
            alert('网络错误，请稍后重试');
        }
    }
}

// 设置添加产品表单的事件处理
function setupAddPhoneForm() {
    const form = document.getElementById('productForm');
    if (form) {
        console.log("设置添加商品表单");
        
        // 移除所有现有的事件监听器
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // 更改按钮文本
        const submitButton = newForm.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = '添加商品';
        }

        // 清除编辑ID
        newForm.dataset.editId = '';
        
        // 添加新的提交事件监听器
        newForm.addEventListener('submit', handleFormSubmit);
        
        // 添加图片URL预览功能
        const mainImageInput = newForm.querySelector('[name="mainImageUrl"]');
        const detailImagesInput = newForm.querySelector('[name="detailImageUrls"]');
        
        if (mainImageInput) {
            mainImageInput.addEventListener('input', (e) => previewMainImage(e.target.value));
        }
        
        if (detailImagesInput) {
            detailImagesInput.addEventListener('input', (e => previewDetailImages(e.target.value)));
        }

        // 清除预览
        clearPreviews();
    }
}

// 打开添加商品模态框
function openAddProductModal() {
    const form = document.getElementById('productForm');
    if (form) {
        form.reset();
        form.removeAttribute('data-product-id');
        
        clearPreviews();
        
        const submitButton = form.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.textContent = '确认';
        }
        
        const modalTitle = document.getElementById('productModalTitle');
        if (modalTitle) {
            modalTitle.textContent = '添加商品';
        }
    }
    
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'block';
        
        // 添加输入事件监听器
        const mainImageInput = document.getElementById('mainImageUrl');
        const detailImagesInput = document.getElementById('detailImageUrls');
        
        if (mainImageInput) {
            mainImageInput.oninput = (e) => previewMainImage(e.target.value);
        }
        
        if (detailImagesInput) {
            detailImagesInput.oninput = (e) => previewDetailImages(e.target.value);
        }
    }
}

// 关闭商品模态框
function closeProductModal() {
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // 重置表单
    const form = document.getElementById('productForm');
    if (form) {
        form.reset();
        form.removeAttribute('data-product-id');
        clearPreviews();
    }
}

// 删除商品
async function deleteProduct(id) {
    console.log("尝试删除商品，ID:", id);
    if (!confirm('确定要删除这个商品吗？')) return;
    
    const index = phones.findIndex(p => p.id === id);
    if (index !== -1) {
        phones.splice(index, 1);
        console.log("商品已删除");
        await savePhonesToFile();
        displayPhones();
        showToast('商品已成功删除', 'success');
    } else {
        console.error("未找到ID为", id, "的商品");
    }
}

// 处理表单提交
async function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const productId = form.getAttribute('data-product-id');
    
    // 验证表单
    const nameInput = document.getElementById('productName');
    const priceInput = document.getElementById('productPrice');
    const storageInput = document.getElementById('productStorage');
    const conditionInput = document.getElementById('productCondition');
    const mainImageInput = document.getElementById('mainImageUrl');
    
    if (!nameInput.value.trim() || !priceInput.value.trim() || 
        !storageInput.value.trim() || !conditionInput.value.trim()) {
        showToast('请填写所有必填字段！', 'warning');
        return;
    }
    
    // 验证价格
    const price = parseFloat(priceInput.value.trim());
    if (isNaN(price) || price <= 0) {
        showToast('请输入有效的价格！', 'warning');
        return;
    }
    
    // 验证主图URL
    const mainImageUrl = mainImageInput.value.trim();
    if (!isValidImageUrl(mainImageUrl)) {
        showToast('请输入有效的主图片URL！', 'warning', 3000, '格式无效');
        return;
    }
    
    // 处理详情图URL
    const detailImagesInput = document.getElementById('detailImageUrls');
    const detailUrls = detailImagesInput.value.trim().split('\n')
        .map(url => url.trim())
        .filter(url => url && isValidImageUrl(url));
    
    if (productId) {
        // 编辑模式
        console.log("编辑模式，更新商品数据");
        const index = phones.findIndex(p => p.id === parseInt(productId));
        if (index !== -1) {
            phones[index] = {
                ...phones[index],
                name: nameInput.value.trim(),
                price: price,
                storage: storageInput.value.trim(),
                condition: conditionInput.value,
                repair: document.getElementById('productRepair').value.trim(),
                mainImageUrl: mainImageUrl,
                detailImageUrls: detailUrls
            };
            await savePhonesToFile();
            displayPhones();
            closeProductModal();
            showToast('商品更新成功！', 'success');
        }
    } else {
        // 添加模式
        console.log("添加模式，创建新商品");
        const newPhone = {
            id: Date.now(),
            name: nameInput.value.trim(),
            price: price,
            storage: storageInput.value.trim(),
            condition: conditionInput.value,
            repair: document.getElementById('productRepair').value.trim(),
            mainImageUrl: mainImageUrl,
            detailImageUrls: detailUrls,
            soldOut: false
        };

        phones.push(newPhone);
        await savePhonesToFile();
        displayPhones();
        closeProductModal();
        showToast('商品添加成功！', 'success');
    }
}

// 显示商品列表
function displayPhones() {
    const container = document.getElementById('phone-container');
    if (!container) return;

    // 应用筛选和排序
    let filteredPhones = phones.filter(phone => {
        // 搜索筛选
        if (currentFilters.search) {
            const searchTerm = currentFilters.search.toLowerCase();
            const searchFields = [
                phone.name,
                phone.storage,
                phone.condition,
                phone.repair
            ].map(field => (field || '').toLowerCase());
            
            if (!searchFields.some(field => field.includes(searchTerm))) {
                return false;
            }
        }

        // 状态筛选
        if (currentFilters.status) {
            if (currentFilters.status === 'on_sale' && phone.soldOut) return false;
            if (currentFilters.status === 'sold' && !phone.soldOut) return false;
        }

        return true;
    });

    // 应用排序
    if (currentFilters.sortBy) {
        filteredPhones.sort((a, b) => {
            let valueA = a[currentFilters.sortBy];
            let valueB = b[currentFilters.sortBy];

            // 处理价格排序
            if (currentFilters.sortBy === 'price') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            }

            // 处理日期排序
            if (currentFilters.sortBy === 'date') {
                valueA = new Date(valueA).getTime();
                valueB = new Date(valueB).getTime();
            }

            const compareResult = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
            return currentFilters.sortOrder === 'asc' ? compareResult : -compareResult;
        });
    }

    // 更新总数显示
    const totalItems = document.getElementById('totalItems');
    if (totalItems) {
        totalItems.textContent = filteredPhones.length;
    }

    // 分页处理
    const startIndex = (currentFilters.page - 1) * currentFilters.limit;
    const endIndex = startIndex + currentFilters.limit;
    const paginatedPhones = filteredPhones.slice(startIndex, endIndex);

    // 检测是否为移动设备
    const isMobile = window.innerWidth <= 768;
    
    // 渲染列表
    container.innerHTML = paginatedPhones.map(phone => `
        <tr class="hover:bg-gray-50" data-id="${phone.id}">
            <td class="px-4 py-3">
                <div class="flex items-center">
                    <img src="${phone.mainImageUrl || '/images/placeholder.png'}" alt="${phone.name}" class="w-10 h-10 rounded-lg object-cover mr-3">
                    <div>
                        <div class="font-medium text-gray-900 ${isMobile ? 'whitespace-nowrap' : ''}">${phone.name}</div>
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-gray-600 ${isMobile ? 'whitespace-nowrap' : ''}">${phone.storage}</td>
            <td class="px-2 py-3 text-gray-600 ${isMobile ? 'whitespace-nowrap' : ''}">${phone.condition}</td>
            <td class="pl-0 pr-2 py-3 text-gray-900 ${isMobile ? 'whitespace-nowrap' : ''}">￥${phone.price}</td>
            <td class="px-4 py-3 text-gray-600 ${isMobile ? 'whitespace-nowrap' : ''}">${phone.repair || '无'}</td>
            <td class="px-4 py-3">
                <span class="px-2 py-1 text-xs rounded-full ${phone.soldOut ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'} ${isMobile ? 'whitespace-nowrap' : ''}">
                    ${phone.soldOut ? '已售' : '在售'}
                </span>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center space-x-2">
                    <button type="button" onclick="editProduct(${phone.id})" class="btn btn-icon btn-sm btn-primary">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button type="button" onclick="toggleSoldStatus(${phone.id})" class="btn btn-icon btn-sm btn-secondary">
                        <i class="fas ${phone.soldOut ? 'fa-box-open' : 'fa-box'}"></i>
                    </button>
                    <button type="button" onclick="deleteProduct(${phone.id})" class="btn btn-icon btn-sm btn-danger">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // 更新分页控件
    updatePagination(filteredPhones.length);
    
    // 更新统计数据
    updateStatistics();
}

// 更新分页控件
function updatePagination(totalItems) {
    const totalPages = Math.ceil(totalItems / currentFilters.limit);
    const paginationContainer = document.querySelector('.flex.items-center.gap-3');
    if (!paginationContainer) return;

    // 更新页码显示
    const pageSpan = paginationContainer.querySelector('span');
    if (pageSpan) {
        pageSpan.textContent = currentFilters.page;
    }

    // 更新上一页按钮状态
    const prevButton = paginationContainer.querySelector('button:first-child');
    if (prevButton) {
        prevButton.disabled = currentFilters.page === 1;
        if (currentFilters.page === 1) {
            prevButton.classList.add('opacity-50');
            prevButton.classList.add('btn-disabled');
        } else {
            prevButton.classList.remove('opacity-50');
            prevButton.classList.remove('btn-disabled');
        }
        prevButton.onclick = () => {
            if (currentFilters.page > 1) {
                currentFilters.page--;
                displayPhones();
            }
        };
    }

    // 更新下一页按钮状态
    const nextButton = paginationContainer.querySelector('button:last-child');
    if (nextButton) {
        nextButton.disabled = currentFilters.page >= totalPages;
        if (currentFilters.page >= totalPages) {
            nextButton.classList.add('opacity-50');
            nextButton.classList.add('btn-disabled');
        } else {
            nextButton.classList.remove('opacity-50');
            nextButton.classList.remove('btn-disabled');
        }
        nextButton.onclick = () => {
            if (currentFilters.page < totalPages) {
                currentFilters.page++;
                displayPhones();
            }
        };
    }
}

// 初始化分页按钮
function initPaginationButtons() {
    const paginationContainer = document.querySelector('.flex.items-center.gap-3');
    if (!paginationContainer) return;
    
    // 初始化上一页按钮
    const prevButton = paginationContainer.querySelector('button:first-child');
    if (prevButton) {
        prevButton.onclick = () => {
            if (currentFilters.page > 1) {
                currentFilters.page--;
                displayPhones();
            }
        };
    }
    
    // 初始化下一页按钮
    const nextButton = paginationContainer.querySelector('button:last-child');
    if (nextButton) {
        nextButton.onclick = () => {
            const totalPages = Math.ceil(phones.length / currentFilters.limit);
            if (currentFilters.page < totalPages) {
                currentFilters.page++;
                displayPhones();
            }
        };
    }
}

// 页面完全加载后执行的优化
window.onload = function() {
    // 再次调整表单响应式样式，确保所有元素都已加载
    adjustFormResponsiveStyles();
    
    // 确保统计数据正确显示
    updateStatistics();
};

// 调整表单响应式样式
function adjustFormResponsiveStyles() {
    const productModal = document.querySelector(SELECTORS.PRODUCT_MODAL);
    
    if (!productModal) return;
    
    if (window.innerWidth <= 768) {
        // 在移动设备上，调整表单布局和元素大小
        const noWrapElements = productModal.querySelectorAll('.md\\:whitespace-nowrap');
        noWrapElements.forEach(el => {
            el.classList.remove('whitespace-nowrap');
            el.classList.add('whitespace-normal');
        });
    } else {
        // 在桌面设备上，恢复whitespace-nowrap类
        const normalWrapElements = productModal.querySelectorAll('.whitespace-normal');
        normalWrapElements.forEach(el => {
            el.classList.remove('whitespace-normal');
            el.classList.add('md:whitespace-nowrap');
        });
    }
}

// 调整快捷操作卡片布局
function adjustQuickActionsLayout() {
    const container = document.querySelector('.quick-actions-container');
    if (!container) return;
    
    const wrapper = container.querySelector('.quick-actions-wrapper');
    if (!wrapper) return;
    
    const cards = wrapper.querySelectorAll('.quick-action-card');
    if (cards.length === 0) return;
    
    const isMobile = window.innerWidth < 768;
    const isVerySmall = window.innerWidth < 480;
    
    // 移除可能存在的滚动指示器
    const indicator = container.querySelector('.scroll-indicator');
    if (indicator) {
        container.removeChild(indicator);
    }
    
    // 清除之前设置的样式
    wrapper.style.minWidth = '';
    
    // 对每张卡片应用适当的样式
    cards.forEach(card => {
        // 在非常小的屏幕上应用额外的样式优化
        if (isVerySmall) {
            // 找到图标容器和图标
            const iconContainer = card.querySelector('.p-3');
            const icon = card.querySelector('i');
            const title = card.querySelector('h3');
            const value = card.querySelector('p');
            const button = card.querySelector('button');
            
            if (iconContainer) iconContainer.classList.add('compact-padding');
            if (title) title.classList.add('compact-text');
            if (value) value.classList.add('compact-value');
            if (button) button.classList.add('compact-button');
        } else {
            // 移除小屏幕优化
            const iconContainer = card.querySelector('.p-3');
            const icon = card.querySelector('i');
            const title = card.querySelector('h3');
            const value = card.querySelector('p');
            const button = card.querySelector('button');
            
            if (iconContainer) iconContainer.classList.remove('compact-padding');
            if (title) title.classList.remove('compact-text');
            if (value) value.classList.remove('compact-value');
            if (button) button.classList.remove('compact-button');
        }
    });
}

// 为快捷操作卡片添加触摸滑动监听
function initQuickActionsSwipe() {
    // 不再需要滑动功能，因为卡片会自适应屏幕宽度
    // 删除此方法但保留空函数以避免调用错误
    console.log("快捷操作卡片已切换到自适应模式，无需滑动");
}

// 监听窗口大小变化
window.addEventListener('resize', debounce(function() {
    // 如果有正在显示的详情图预览，重新渲染它
    const detailImagesTextarea = document.querySelector('textarea[name="detailImageUrls"]');
    if (detailImagesTextarea && detailImagesTextarea.value) {
        previewDetailImages(detailImagesTextarea.value);
    }
    
    // 调整所有响应式元素
    adjustFormResponsiveStyles();
    adjustQuickActionsLayout();
    adjustSidebarHeight();
}, 250));

// 调整右侧系统设置区域的高度和滚动
function adjustSidebarHeight() {
    const sidebarElement = document.querySelector(SELECTORS.SIDEBAR);
    if (sidebarElement) {
        if (isDesktopView()) {
            // 在大屏幕上设置sticky定位
            sidebarElement.style.position = 'sticky';
            sidebarElement.style.top = '1rem';
            sidebarElement.style.maxHeight = 'calc(100vh - 2rem)';
            sidebarElement.style.overflowY = 'auto';
            sidebarElement.style.display = 'block';
            
            // 同时处理文本溢出
            adjustCardTextOverflow();
        } else {
            // 在小屏幕上重置这些样式
            sidebarElement.style.position = '';
            sidebarElement.style.top = '';
            sidebarElement.style.maxHeight = '';
            sidebarElement.style.overflowY = '';
        }
    }
}

// 调整卡片内部文本溢出处理
function adjustCardTextOverflow() {
    // 获取所有可能需要处理文本溢出的元素
    const textElements = document.querySelectorAll(SELECTORS.SIDEBAR_TEXT);
    
    textElements.forEach(element => {
        // 如果文本被截断，添加完整内容的标题提示
        if (element.offsetWidth < element.scrollWidth) {
            element.title = element.textContent;
        } else {
            element.title = '';
        }
    });
}

// 页面加载和滚动事件统一处理
window.addEventListener('load', adjustSidebarHeight);
window.addEventListener('scroll', debounce(adjustSidebarHeight, 100));

// 添加获取当前用户名的函数
async function getCurrentUsername() {
    try {
        const response = await fetch('/api/get-username', {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.username || 'admin';
        }
        
        return 'admin';
    } catch (error) {
        console.error('获取用户名失败:', error);
        return 'admin';
    }
}

// 更新设置显示
function updateSettingsDisplay(settings) {
    // 更新网站标题显示
    const siteTitleDisplay = document.getElementById('siteTitleDisplay');
    if (siteTitleDisplay) {
        siteTitleDisplay.textContent = settings.title || '二手机展示';
        siteTitleDisplay.title = settings.title || '二手机展示'; // 添加标题提示
    }
    
    // 更新Logo和Favicon状态显示
    const logoStatus = document.getElementById('logoStatusText');
    if (logoStatus) {
        if (settings.logo) {
            logoStatus.textContent = '已设置';
            logoStatus.className = 'text-green-500';
        } else {
            logoStatus.textContent = '未设置';
            logoStatus.className = 'text-gray-500';
        }
    }
    
    const faviconStatus = document.getElementById('faviconStatusText');
    if (faviconStatus) {
        if (settings.favicon) {
            faviconStatus.textContent = '已设置';
            faviconStatus.className = 'text-green-500';
        } else {
            faviconStatus.textContent = '未设置';
            faviconStatus.className = 'text-gray-500';
        }
    }
    
    // 更新总体设置状态
    const settingsStatus = document.getElementById('settingsStatus');
    if (settingsStatus) {
        if (settings.title || settings.logo || settings.favicon) {
            settingsStatus.textContent = '已配置';
            settingsStatus.className = 'text-sm font-medium text-green-500';
        } else {
            settingsStatus.textContent = '未配置';
            settingsStatus.className = 'text-sm font-medium text-red-500';
        }
    }
}

// 切换商品售卖状态
async function toggleSoldStatus(id) {
    console.log("切换商品售卖状态，ID:", id);
    const index = phones.findIndex(p => p.id === id);
    if (index !== -1) {
        phones[index].soldOut = !phones[index].soldOut;
        await savePhonesToFile();
        displayPhones();
        showToast(`商品状态已更改为${phones[index].soldOut ? '已售' : '在售'}`, 'success');
    } else {
        console.error("未找到ID为", id, "的商品");
        showToast('更改商品状态失败', 'error');
    }
}

// 编辑商品
function editProduct(id) {
    console.log("尝试编辑商品，ID:", id);
    const phone = phones.find(p => p.id === id);
    if (!phone) {
        console.error("未找到ID为", id, "的商品");
        return;
    }
    
    const form = document.getElementById('productForm');
    if (!form) return;
    
    // 设置表单为编辑模式
    form.dataset.productId = id;
    
    // 填充表单数据
    document.getElementById('productName').value = phone.name || '';
    document.getElementById('productPrice').value = phone.price || '';
    document.getElementById('productStorage').value = phone.storage || '';
    document.getElementById('productCondition').value = phone.condition || '';
    document.getElementById('productRepair').value = phone.repair || '';
    document.getElementById('mainImageUrl').value = phone.mainImageUrl || '';
    document.getElementById('detailImageUrls').value = phone.detailImageUrls ? phone.detailImageUrls.join('\n') : '';
    
    // 显示预览
    previewMainImage(phone.mainImageUrl);
    previewDetailImages(phone.detailImageUrls ? phone.detailImageUrls.join('\n') : '');
    
    // 修改按钮文本
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.textContent = '保存修改';
    }
    
    // 设置模态框标题
    const modalTitle = document.getElementById('productModalTitle');
    if (modalTitle) {
        modalTitle.textContent = '编辑商品';
    }
    
    // 打开模态框
    const modal = document.getElementById('productModal');
    if (modal) {
        modal.style.display = 'block';
        
        // 添加输入事件监听器
        const mainImageInput = document.getElementById('mainImageUrl');
        const detailImagesInput = document.getElementById('detailImageUrls');
        
        if (mainImageInput) {
            mainImageInput.oninput = (e) => previewMainImage(e.target.value);
        }
        
        if (detailImagesInput) {
            detailImagesInput.oninput = (e) => previewDetailImages(e.target.value);
        }
    }
}

// 预览主图
function previewMainImage(url) {
    const previewContainer = document.getElementById('mainImagePreview');
    if (!previewContainer) return;
    
    if (!url || !url.trim()) {
        previewContainer.style.display = 'none';
        previewContainer.innerHTML = '';
        return;
    }
    
    // 先显示容器
    previewContainer.style.display = 'flex';
    
    // 创建图片元素
    const img = new Image();
    img.alt = '主图预览';
    img.style.maxWidth = '100%';
    img.style.maxHeight = '280px';
    img.style.objectFit = 'contain';
    img.style.borderRadius = '8px';
    
    img.onload = function() {
        // 图片加载成功后更新容器内容
        previewContainer.innerHTML = '';
        previewContainer.appendChild(img);
    };
    
    img.onerror = function() {
        // 图片加载失败
        previewContainer.innerHTML = '<div class="text-red-500">图片加载失败</div>';
    };
    
    img.src = url.trim();
}

// 预览详情图
function previewDetailImages(urls) {
    const previewContainer = document.getElementById('detailImagesPreview');
    if (!previewContainer) return;
    
    if (!urls || !urls.trim()) {
        previewContainer.innerHTML = '';
        return;
    }
    
    const imageUrls = urls.split('\n').filter(url => url.trim());
    if (imageUrls.length === 0) {
        previewContainer.innerHTML = '';
        return;
    }
    
    let html = '<div class="preview-grid">';
    
    imageUrls.forEach(url => {
        if (url.trim()) {
            html += `
                <div class="preview-item">
                    <img src="${url.trim()}" alt="详情图预览">
                </div>
            `;
        }
    });
    
    html += '</div>';
    previewContainer.innerHTML = html;
}

// 清除预览
function clearPreviews() {
    const mainPreview = document.getElementById('mainImagePreview');
    const detailPreview = document.getElementById('detailImagesPreview');
    
    if (mainPreview) {
        mainPreview.style.display = 'none';
        mainPreview.innerHTML = '';
    }
    
    if (detailPreview) {
        detailPreview.innerHTML = '';
    }
}

// 验证图片URL
function isValidImageUrl(url) {
    if (!url) return false;
    // 简单验证URL格式，实际应用中可能需要更复杂的验证
    const pattern = /^(https?:\/\/|\/)[^\s]+\.(jpg|jpeg|png|gif|webp)(\?[^\s]*)?$/i;
    return pattern.test(url);
}

// 更新统计数据
function updateStatistics() {
    // 计算在售商品数量
    const availableCount = phones.filter(phone => !phone.soldOut).length;
    document.getElementById('totalProducts').textContent = availableCount;
    
    // 计算已售商品数量
    const soldCount = phones.filter(phone => phone.soldOut).length;
    document.getElementById('soldProducts').textContent = soldCount;
    
    // 计算平均价格
    let totalPrice = 0;
    let priceCount = 0;
    phones.forEach(phone => {
        const price = parseFloat(phone.price);
        if (!isNaN(price)) {
            totalPrice += price;
            priceCount++;
        }
    });
    const averagePrice = priceCount > 0 ? (totalPrice / priceCount).toFixed(2) : 0;
    document.getElementById('averagePrice').textContent = `￥${averagePrice}`;
    
    // 模拟今日访问量和总访问量
    const visitData = localStorage.getItem('visitData');
    let visits = visitData ? JSON.parse(visitData) : { total: 0, today: 0, date: null };
    
    const today = new Date().toLocaleDateString();
    if (visits.date !== today) {
        visits.today = Math.floor(Math.random() * 10) + 1; // 模拟1-10的随机访问
        visits.date = today;
    }
    visits.total += 1; // 每次加载页面增加总访问量
    
    document.getElementById('todayVisits').textContent = visits.today;
    document.getElementById('totalVisits').textContent = visits.total;
    
    // 模拟本月销量
    const currentMonth = new Date().getMonth();
    const monthlySales = localStorage.getItem('monthlySales');
    let salesData = monthlySales ? JSON.parse(monthlySales) : { month: null, sales: 0 };
    
    if (salesData.month !== currentMonth) {
        salesData.sales = soldCount;
        salesData.month = currentMonth;
    }
    
    document.getElementById('monthlySales').textContent = salesData.sales;
    
    // 保存数据到本地存储
    localStorage.setItem('visitData', JSON.stringify(visits));
    localStorage.setItem('monthlySales', JSON.stringify(salesData));
}

