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

// 全局变量存储产品数据
let phones = [];

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
        alert('保存失败，请重试');
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
            alert('密码修改成功！');
            closeChangePasswordModal();
        } else {
            const data = await response.json();
            alert(data.error || '密码修改失败');
        }
    } catch (error) {
        console.error('修改密码失败:', error);
        alert('修改密码失败，请重试');
    }
}

// 打开修改密码模态框
function openChangePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'block';
    // 清空表单
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
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
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    
    // 如果垂直滑动大于水平滑动，则不处理
    if (Math.abs(deltaY) > Math.abs(deltaX)) return;
    
    // 防止页面滚动
    event.preventDefault();
    
    // 限制滑动距离
    const maxSlide = 100;
    rowInitialX = Math.max(-maxSlide, Math.min(maxSlide, deltaX));
    
    // 使用 transform 而不是 left 属性
    currentRow.style.transform = `translateX(${rowInitialX}px)`;
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
        deleteBtn.className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded shadow-lg';
        deleteBtn.textContent = '删除';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            deletePhone(phoneId);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow-lg ml-2';
        cancelBtn.textContent = '取消';
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            resetRowPosition(row);
        };
        
        actionsDiv.appendChild(deleteBtn);
        actionsDiv.appendChild(cancelBtn);
    } else {
        const editBtn = document.createElement('button');
        editBtn.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded shadow-lg';
        editBtn.textContent = '编辑';
        editBtn.onclick = (e) => {
            e.stopPropagation();
            editPhone(phoneId);
        };
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded shadow-lg ml-2';
        cancelBtn.textContent = '取消';
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
    loadSiteSettings();
    displayPhones();
    setupEventListeners();
    checkPasswordStatus();
});

// 设置事件监听器
function setupEventListeners() {
    console.log('设置事件监听器');
    
    // 网站设置表单提交
    const siteSettingsForm = document.getElementById('siteSettingsForm');
    if (siteSettingsForm) {
        siteSettingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSiteSettings();
        });
    }

    // 添加手机表单提交
    setupAddPhoneForm();

    // 修改密码表单提交
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmPassword = document.getElementById('confirmPassword').value;

            if (newPassword !== confirmPassword) {
                alert('两次输入的新密码不一致');
                return;
            }

            if (newPassword.length < 6) {
                alert('新密码长度不能小于6位');
                return;
            }

            await changePassword(currentPassword, newPassword);
        });
    }
    
    console.log('事件监听器设置完成');
}

// 加载网站设置
async function loadSiteSettings() {
    try {
        // 从服务器获取设置
        const response = await fetch('/api/settings', {
            method: 'GET',
            credentials: 'include'
        });
        
        if (!response.ok) {
            throw new Error('加载设置失败');
        }
        
        const settings = await response.json();
        
        // 缓存到localStorage
        localStorage.setItem('siteSettings', JSON.stringify(settings));
        
        // 设置默认值
        const defaultSettings = {
            title: '二手机展示'
        };

        // 合并默认值和保存的设置
        const finalSettings = { ...defaultSettings, ...settings };
        
        // 更新标题
        document.getElementById('siteTitle').value = finalSettings.title;
        document.title = finalSettings.title;
        
        // 更新Logo - 只在有自定义logo时显示
        if (settings.logo) {
            showPreview('logoPreview', settings.logo);
            const logoImg = document.getElementById('siteLogo');
            if (logoImg) {
                logoImg.classList.remove('hidden');
                logoImg.src = settings.logo;
            }
        }
        
        // 更新Favicon - 只在有自定义favicon时显示
        if (settings.favicon) {
            showPreview('faviconPreview', settings.favicon);
            const favicon = document.getElementById('favicon');
            if (favicon) {
                favicon.href = settings.favicon;
            }
        }
    } catch (error) {
        console.error('加载设置失败:', error);
        
        // 加载失败时尝试从localStorage读取
        const cachedSettings = JSON.parse(localStorage.getItem('siteSettings')) || {};
        
        // 设置默认值
        const defaultSettings = {
            title: '二手机展示'
        };

        // 合并默认值和缓存的设置
        const finalSettings = { ...defaultSettings, ...cachedSettings };
        
        // 更新标题
        document.getElementById('siteTitle').value = finalSettings.title;
        document.title = finalSettings.title;
        
        // 更新Logo和Favicon（使用缓存值）
        if (cachedSettings.logo) {
            showPreview('logoPreview', cachedSettings.logo);
        }
        
        if (cachedSettings.favicon) {
            showPreview('faviconPreview', cachedSettings.favicon);
        }
    }
}

// 保存网站设置
async function saveSiteSettings() {
    const settings = {
        title: document.getElementById('siteTitle').value
    };

    // 只在有预览图片时保存logo和favicon
    const logoImg = document.querySelector('#logoPreview img');
    const faviconImg = document.querySelector('#faviconPreview img');
    
    if (logoImg && !logoImg.parentElement.classList.contains('hidden')) {
        settings.logo = logoImg.src;
    }
    
    if (faviconImg && !faviconImg.parentElement.classList.contains('hidden')) {
        settings.favicon = faviconImg.src;
    }
    
    try {
        // 保存到服务器
        const response = await fetch('/api/save-settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(settings),
            credentials: 'include'
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`保存失败: ${errorData.error || response.statusText}`);
        }
        
        // 同时保存到localStorage作为缓存
        localStorage.setItem('siteSettings', JSON.stringify(settings));
        alert('设置已保存');
    } catch (error) {
        console.error('保存设置失败:', error);
        alert(`保存设置失败: ${error.message}`);
    }
}

// 文件验证和预览
async function validateAndPreviewFile(input, previewId, maxSizeKB) {
    const file = input.files[0];
    if (file) {
        console.log(`准备上传文件: ${file.name}, 大小: ${file.size / 1024}KB, 类型: ${file.type}`);
        
        if (file.size > maxSizeKB * 1024) {
            alert(`文件大小超过${maxSizeKB}KB限制`);
            input.value = '';
            return;
        }

        // 创建 FormData 对象
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', input.id === 'siteLogo' ? 'logo' : 'favicon');

        try {
            console.log(`开始上传文件: ${input.id === 'siteLogo' ? 'logo' : 'favicon'}`);
            
            // 上传文件
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData,
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`上传失败: ${errorData.error || response.statusText}`);
            }

            const data = await response.json();
            const imageUrl = data.url; // 获取保存的图片URL
            console.log(`文件上传成功，URL: ${imageUrl}`);

            // 显示预览
            showPreview(previewId, imageUrl);
            
            // 获取当前的网站设置
            const settings = JSON.parse(localStorage.getItem('siteSettings')) || {};
            
            // 更新设置
            if (input.id === 'siteLogo') {
                settings.logo = imageUrl;
                console.log('Logo URL已保存到设置:', imageUrl);
            } else {
                settings.favicon = imageUrl;
                console.log('Favicon URL已保存到设置:', imageUrl);
            }
            
            // 保存到localStorage作为缓存
            localStorage.setItem('siteSettings', JSON.stringify(settings));
            
            // 保存到服务器
            await fetch('/api/save-settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: settings.title || document.getElementById('siteTitle').value,
                    logo: settings.logo,
                    favicon: settings.favicon
                }),
                credentials: 'include'
            });
            
            console.log('设置已保存到服务器');
            
            // 立即应用设置
            if (input.id === 'siteLogo') {
                const logoElement = document.getElementById('siteLogo');
                if (logoElement) {
                    logoElement.src = imageUrl;
                    logoElement.classList.remove('hidden');
                }
            } else {
                const favicon = document.getElementById('favicon');
                if (favicon) {
                    favicon.href = imageUrl;
                }
            }

        } catch (error) {
            console.error('上传文件失败:', error);
            alert(`上传文件失败: ${error.message}`);
            input.value = '';
        }
    }
}

// 显示预览
function showPreview(previewId, src) {
    const preview = document.getElementById(previewId);
    if (!preview) {
        console.error(`预览容器不存在: ${previewId}`);
        return;
    }
    
    preview.classList.remove('hidden');
    const img = preview.querySelector('img');
    if (img) {
        img.src = src;
        img.onload = () => console.log(`图片加载成功: ${src}`);
        img.onerror = () => console.error(`图片加载失败: ${src}`);
    } else {
        console.error(`预览容器中没有img元素: ${previewId}`);
    }
}

// 删除Logo
function deleteLogo() {
    document.getElementById('siteLogo').value = '';
    document.getElementById('logoPreview').classList.add('hidden');
}

// 删除Favicon
function deleteFavicon() {
    document.getElementById('siteFavicon').value = '';
    document.getElementById('faviconPreview').classList.add('hidden');
}

// 添加手机
async function addPhone() {
    const form = document.getElementById('addPhoneForm');
    
    // 验证必填字段
    if (!form.name.value || !form.price.value || !form.storage.value || 
        !form.condition.value || !form.mainImageUrl.value) {
        alert('请填写所有必填字段！');
        return;
    }

    // 验证价格
    const price = parseFloat(form.price.value);
    if (isNaN(price) || price <= 0) {
        alert('请输入有效的价格！');
        return;
    }

    // 验证图片URL
    if (!isValidImageUrl(form.mainImageUrl.value)) {
        alert('请输入有效的主图片URL！');
        return;
    }

    const detailUrls = form.detailImageUrls.value
        .split(',')
        .map(url => url.trim())
        .filter(url => url && isValidImageUrl(url));

    const newPhone = {
        id: Date.now(),
        name: form.name.value.trim(),
        price: price,
        storage: form.storage.value.trim(),
        condition: form.condition.value.trim(),
        repair: form.repair.value.trim(),
        mainImageUrl: form.mainImageUrl.value.trim(),
        detailImageUrls: detailUrls,
        soldOut: false
    };

    phones.push(newPhone);
    await savePhonesToFile();
    displayPhones();
    
    // 确保在重置表单前手动调用预览函数来清除预览
    form.mainImageUrl.value = '';
    form.detailImageUrls.value = '';
    
    // 手动调用预览函数，确保预览区域正确隐藏
    previewMainImage('');
    previewDetailImages('');
    
    // 重置表单
    form.reset();
    
    alert('产品添加成功！');
}

// 验证图片URL
function isValidImageUrl(url) {
    return url && url.trim().length > 0 && (
        url.startsWith('http://') || 
        url.startsWith('https://') || 
        url.startsWith('data:image/')
    );
}

// 清除预览
function clearPreviews() {
    // 手动调用预览函数，确保预览区域正确隐藏
    previewMainImage('');
    previewDetailImages('');
    
    // 以下代码保留作为备份方案
    // 清除主图预览
    const mainPreview = document.getElementById('mainImagePreview');
    if (mainPreview) {
        mainPreview.classList.add('hidden');
        const img = mainPreview.querySelector('img');
        if (img) {
            img.src = '';
        }
    }
    
    // 清除详情图预览
    const detailPreview = document.getElementById('detailImagesPreview');
    if (detailPreview) {
        detailPreview.innerHTML = '';
    }
}

// 显示手机列表
function displayPhones() {
    const container = document.getElementById('phone-container');
    container.innerHTML = phones.map(phone => `
        <tr class="hover:bg-gray-50 ${phone.soldOut ? 'opacity-50' : ''} relative transform transition-transform duration-200" data-id="${phone.id}">
            <td class="px-4 py-3">${phone.name}</td>
            <td class="px-4 py-3">${phone.storage}</td>
            <td class="px-4 py-3">${phone.condition}</td>
            <td class="px-4 py-3 price-column">¥${phone.price}</td>
            <td class="px-4 py-3">
                <div class="repair-record" title="${phone.repair || '无'}">${phone.repair || '无'}</div>
            </td>
            <td class="px-4 py-3">
                <span class="status-tag ${phone.soldOut ? 'sold' : 'available'}">
                    ${phone.soldOut ? '已售' : '在售'}
                </span>
            </td>
            <td class="px-4 py-3 md:block hidden">
                <div class="table-actions">
                    <button onclick="editPhone(${phone.id})" class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deletePhone(${phone.id})" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="toggleSoldStatus(${phone.id})" 
                            class="status-btn ${phone.soldOut ? 'bg-green-500' : 'bg-yellow-500'} text-white px-3 py-1 rounded">
                        ${phone.soldOut ? '取消已售' : '标记已售'}
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // 初始化触摸事件
    initTouchEvents();
}

// 切换已售状态
async function toggleSoldStatus(id) {
    console.log('切换产品状态，ID:', id, '类型:', typeof id);
    
    // 由于传入的ID可能是字符串，尝试多种方式查找索引
    let index = phones.findIndex(p => p.id === id);
    
    // 如果找不到，尝试数字比较
    if (index === -1 && !isNaN(id)) {
        const numericId = parseInt(id);
        index = phones.findIndex(p => p.id === numericId);
    }
    
    // 如果还找不到，尝试字符串比较
    if (index === -1) {
        const stringId = String(id);
        index = phones.findIndex(p => String(p.id) === stringId);
    }
    
    if (index === -1) {
        alert(`找不到ID为 ${id} 的产品数据`);
        return;
    }
    
    phones[index].soldOut = !phones[index].soldOut;
    await savePhonesToFile();
    displayPhones();
}

// 编辑手机
function editPhone(id) {
    const phone = phones.find(p => p.id === id);
    if (!phone) return;

    const form = document.getElementById('addPhoneForm');
    form.name.value = phone.name;
    form.price.value = phone.price;
    form.storage.value = phone.storage;
    form.condition.value = phone.condition;
    form.repair.value = phone.repair;
    form.mainImageUrl.value = phone.mainImageUrl;
    form.detailImageUrls.value = phone.detailImageUrls.join(', ');

    // 预览图片
    previewMainImage(phone.mainImageUrl);
    previewDetailImages(phone.detailImageUrls.join(', '));

    // 更新提交按钮文本
    form.querySelector('button[type="submit"]').textContent = '更新产品';
    
    // 移除所有现有的提交事件处理程序
    const formClone = form.cloneNode(true);
    form.parentNode.replaceChild(formClone, form);
    
    // 使用新的表单引用
    const newForm = document.getElementById('addPhoneForm');
    
    // 创建新的更新处理函数
    const updateHandler = async (e) => {
        e.preventDefault();
        await updatePhone(id);
    };
    
    // 保存当前的更新处理函数引用
    newForm.currentUpdateHandler = updateHandler;
    newForm.addEventListener('submit', updateHandler);
}

// 更新手机
async function updatePhone(id) {
    const form = document.getElementById('addPhoneForm');
    const index = phones.findIndex(p => p.id === id);
    
    if (index === -1) return;

    // 验证必填字段
    if (!form.name.value || !form.price.value || !form.storage.value || 
        !form.condition.value || !form.mainImageUrl.value) {
        alert('请填写所有必填字段！');
        return;
    }

    // 验证价格
    const price = parseFloat(form.price.value);
    if (isNaN(price) || price <= 0) {
        alert('请输入有效的价格！');
        return;
    }

    // 验证图片URL
    if (!isValidImageUrl(form.mainImageUrl.value)) {
        alert('请输入有效的主图片URL！');
        return;
    }

    const detailUrls = form.detailImageUrls.value
        .split(',')
        .map(url => url.trim())
        .filter(url => url && isValidImageUrl(url));

    phones[index] = {
        id,
        name: form.name.value.trim(),
        price: price,
        storage: form.storage.value.trim(),
        condition: form.condition.value.trim(),
        repair: form.repair.value.trim(),
        mainImageUrl: form.mainImageUrl.value.trim(),
        detailImageUrls: detailUrls,
        soldOut: phones[index].soldOut
    };

    await savePhonesToFile();
    displayPhones();
    
    // 确保在重置表单前清空图片URL并手动调用预览函数
    form.mainImageUrl.value = '';
    form.detailImageUrls.value = '';
    
    // 手动调用预览函数，确保预览区域正确隐藏
    previewMainImage('');
    previewDetailImages('');
    
    // 重置表单
    form.reset();
    
    // 更新按钮文本
    form.querySelector('button[type="submit"]').textContent = '添加产品';
    
    // 重新设置表单，确保事件监听器正确
    setupAddPhoneForm();
    
    alert('产品更新成功！');
}

// 删除手机
async function deletePhone(id) {
    console.log('删除产品，ID:', id, '类型:', typeof id);
    
    if (!confirm('确定要删除这个产品吗？')) return;
    
    // 由于传入的ID可能是字符串，尝试多种方式过滤
    // 先获取产品数组的副本
    const newPhones = [];
    let found = false;
    
    // 遍历每个产品，将不匹配ID的产品保留
    for (const phone of phones) {
        // 检查ID是否匹配（尝试所有可能的比较方式）
        const idMatches = 
            phone.id === id || 
            (!isNaN(id) && phone.id === parseInt(id)) || 
            (String(phone.id) === String(id));
            
        if (idMatches) {
            found = true; // 标记找到了要删除的产品
        } else {
            newPhones.push(phone); // 保留不匹配的产品
        }
    }
    
    if (!found) {
        alert(`找不到ID为 ${id} 的产品数据`);
        return;
    }
    
    phones = newPhones;
    
    await savePhonesToFile();
    displayPhones();
    alert('产品已成功删除');
}

// 预览主图
function previewMainImage(url) {
    if (!url) {
        document.getElementById('mainImagePreview').classList.add('hidden');
        return;
    }
    
    const preview = document.getElementById('mainImagePreview');
    preview.className = 'preview-container p-2 border rounded shadow-sm mt-2 mb-2';
    
    const img = preview.querySelector('img') || document.createElement('img');
    img.onload = () => {
        preview.classList.remove('hidden');
        if (!preview.contains(img)) {
            preview.appendChild(img);
        }
    };
    img.onerror = () => {
        preview.classList.add('hidden');
        // 只有在URL不为空时才显示错误提示
        if (url && url.trim() !== '') {
            alert('图片加载失败，请检查URL是否正确');
        }
    };
    img.src = url;
    img.alt = '预览图片';
    img.className = 'max-w-full h-48 object-contain rounded mx-auto';
}

// 预览详情图
function previewDetailImages(urls) {
    const preview = document.getElementById('detailImagesPreview');
    if (!urls || urls.trim() === '') {
        preview.innerHTML = '';
        return;
    }

    const urlArray = urls.split(',')
        .map(url => url.trim())
        .filter(url => url && url.length > 0);
    
    if (urlArray.length === 0) {
        preview.innerHTML = '';
        return;
    }
    
    preview.innerHTML = urlArray.map(url => `
        <div class="preview-item relative p-2 border rounded shadow-sm">
            <img src="${url}" 
                 alt="详情图" 
                 class="w-full h-32 object-contain rounded"
                 onerror="this.parentElement.remove()"
                 onload="this.parentElement.style.display='block'">
        </div>
    `).join('');
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
    const addPhoneForm = document.getElementById('addPhoneForm');
    if (addPhoneForm) {
        // 移除所有现有的事件监听器
        const formClone = addPhoneForm.cloneNode(true);
        addPhoneForm.parentNode.replaceChild(formClone, addPhoneForm);
        
        // 获取新的表单引用
        const newForm = document.getElementById('addPhoneForm');
        
        // 添加新的提交事件处理程序
        newForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addPhone();
        });
        
        console.log('重新设置了产品表单提交处理函数');
    } else {
        console.error('找不到产品表单元素');
    }
}