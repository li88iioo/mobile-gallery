/**
 * 后台管理系统 JavaScript
 */

// 常用的DOM元素选择器
const DOM = {
    toastContainer: document.getElementById('toastContainer'),
    // 修改密码相关
    changePasswordModal: document.getElementById('changePasswordModal'),
    changePasswordForm: document.getElementById('changePasswordForm'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    // 确认操作模态框
    confirmModal: document.getElementById('confirmModal'),
    confirmModalMessage: document.getElementById('confirmModalMessage'),
    confirmModalConfirmBtn: document.getElementById('confirmModalConfirmBtn'),
    confirmModalCancelBtn: document.getElementById('confirmModalCancelBtn'),
    // 商品模态框相关
    productModal: document.getElementById('productModal'),
    productForm: document.getElementById('productForm'),
    productModalTitle: document.getElementById('productModalTitle'),
    productId: document.getElementById('productId'),
    name: document.getElementById('name'),
    price: document.getElementById('price'),
    storage: document.getElementById('storage'),
    condition: document.getElementById('condition'),
    repair: document.getElementById('repair'),
    productImages: document.getElementById('productImages'),
    imagePreviewContainer: document.getElementById('imagePreviewContainer'),
    imagePreviewsGrid: document.getElementById('imagePreviewsGrid'),
    // 用户名显示
    adminUsername: document.getElementById('adminUsername'),
    // 分页相关
    paginationContainer: document.getElementById('paginationContainer'),
    paginationNumbers: document.getElementById('paginationNumbers'),
    paginationInfo: document.getElementById('paginationInfo'),
    paginationCount: document.getElementById('paginationCount'),
    prevPageBtn: document.getElementById('prevPageBtn'),
    nextPageBtn: document.getElementById('nextPageBtn'),
    addProductModal: document.getElementById('addProductModal'),
    addProductForm: document.getElementById('addProductForm'),
    addProductModalTitle: document.getElementById('addProductModalTitle'),
    addProductId: document.getElementById('addProductId'),
    addProductImages: document.getElementById('addProductImages')
};

// 全局变量存储手机数据
let phones = [];
// 分页相关变量
let currentPage = 1;
let itemsPerPage = 8;
let totalPages = 1;
let filteredPhones = [];

// 工具函数

/**
 * 显示通知消息
 * @param {string} message - 消息内容
 * @param {string} type - 消息类型：success, error, info, warning
 * @param {number} duration - 显示时长(毫秒)
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span>`;
    
    DOM.toastContainer.appendChild(toast);
    
    // 自动移除
    const removeTimeout = setTimeout(() => {
        toast.classList.add('toast-exiting');
        setTimeout(() => {
            if (toast.parentNode) {
            toast.remove();
            }
        }, 300);
    }, duration);
    
    // 鼠标悬停时暂停计时器
    toast.addEventListener('mouseenter', () => {
        clearTimeout(removeTimeout);
    });
    
    // 鼠标离开时重新开始计时器
    toast.addEventListener('mouseleave', () => {
        setTimeout(() => {
            toast.classList.add('toast-exiting');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, 1000);
    });
    
    // 返回toast元素，便于手动控制
    return toast;
}

/**
 * 检查登录状态
 */
function checkLogin() {
    // 发送请求验证登录状态
    fetch('/api/check-auth')
        .then(response => response.json())
        .then(data => {
        if (!data.isLoggedIn) {
                window.location.href = '/login';
            } else {
                // 已登录，获取用户名
                getUsername();
                // 检查密码状态
                checkPasswordStatus();
            }
        })
        .catch(error => {
            console.error('检查登录状态出错:', error);
            showToast('检查登录状态时发生错误', 'error');
        });
}

/**
 * 获取当前用户名
 */
function getUsername() {
    fetch('/api/get-username')
        .then(response => response.json())
        .then(data => {
            if (data.username) {
                DOM.adminUsername.textContent = data.username;
            }
        })
        .catch(error => console.error('获取用户名出错:', error));
}

/**
 * 检查密码状态
 */
function checkPasswordStatus() {
    fetch('/api/password-status')
        .then(response => response.json())
        .then(data => {
        if (data.needPasswordChange) {
                showToast('您的账号正在使用默认密码，请立即修改', 'warning', 5000);
                setTimeout(() => {
                    openChangePasswordModal();
                }, 1000);
            }
        })
        .catch(error => console.error('检查密码状态出错:', error));
}

/**
 * 退出登录
 */
function logout() {
    openConfirmModal('您确定要退出登录吗？', () => {
        fetch('/api/logout', { method: 'POST' })
            .then(response => response.json())
            .then(data => {
            if (data.success) {
                    window.location.href = '/login';
        } else {
                    showToast('退出失败', 'error');
                }
            })
            .catch(error => {
                console.error('退出登录出错:', error);
                showToast('退出登录时发生错误', 'error');
            });
    });
}

// 模态框函数

/**
 * 打开确认操作模态框
 * @param {string} message - 提示消息
 * @param {Function} confirmCallback - 确认回调函数
 */
function openConfirmModal(message, confirmCallback) {
    DOM.confirmModalMessage.textContent = message;
    DOM.confirmModalConfirmBtn.onclick = () => {
        confirmCallback();
        closeConfirmModal();
    };
    DOM.confirmModal.classList.add('active');
}

/**
 * 关闭确认操作模态框
 */
function closeConfirmModal() {
    DOM.confirmModal.classList.remove('active');
}

/**
 * 打开修改密码模态框
 */
function openChangePasswordModal() {
    // 重置表单
    DOM.changePasswordForm.reset();
    DOM.changePasswordModal.classList.add('active');
}

/**
 * 关闭修改密码模态框
 */
function closeChangePasswordModal() {
    DOM.changePasswordModal.classList.remove('active');
}

/**
 * 处理修改密码表单提交
 * @param {Event} e - 事件对象
 */
function handleChangePassword(e) {
            e.preventDefault();
    
    const currentPassword = DOM.currentPassword.value.trim();
    const newPassword = DOM.newPassword.value.trim();
    const confirmPassword = DOM.confirmPassword.value.trim();
    
    // 验证表单
    if (!currentPassword || !newPassword || !confirmPassword) {
        showToast('请填写所有密码字段', 'error');
        return;
    }

            if (newPassword !== confirmPassword) {
        showToast('两次输入的新密码不一致', 'error');
                return;
            }

            if (newPassword.length < 6) {
        showToast('新密码长度不能少于6个字符', 'error');
                return;
            }

    // 发送修改密码请求
    fetch('/api/change-password', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
        body: JSON.stringify({
            currentPassword,
            newPassword
        })
    })
    .then(response => response.json())
        .then(data => {
            if (data.success) {
            showToast('密码修改成功', 'success');
                closeChangePasswordModal();
            } else {
                showToast(data.error || '密码修改失败', 'error');
            }
        })
        .catch(error => {
        console.error('修改密码出错:', error);
        showToast('修改密码时发生错误', 'error');
    });
}

/**
 * 检测是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
function isMobileDevice() {
    return window.innerWidth < 768;
}

/**
 * 打开商品模态框
 * 根据设备类型应用不同的样式
 */
function openAddProductModal() {
    // 重置表单
    resetProductForm();
    DOM.productModalTitle.textContent = '添加商品';
    DOM.productId.value = ''; // 清空ID，表示新增
    
    // 根据设备类型应用不同的样式
    adjustModalForDevice();
    
    // 确保图片URL输入框的事件绑定正确
    if (DOM.productImages) {
        // 添加input事件监听器
        DOM.productImages.removeEventListener('input', previewProductImages);
        DOM.productImages.addEventListener('input', previewProductImages);
        
        // 添加paste事件监听器
        DOM.productImages.removeEventListener('paste', handleImagePaste);
        DOM.productImages.addEventListener('paste', handleImagePaste);
    }
    
    // 显示模态框
    DOM.productModal.classList.add('active');
}

/**
 * 打开编辑商品模态框
 * @param {string} id - 商品ID
 */
function openEditProductModal(id) {
    // 设置为编辑模式
    resetProductForm();
    DOM.productModalTitle.textContent = '编辑商品';
    
    // 先隐藏图片预览区域，避免闪烁
    DOM.imagePreviewContainer.classList.add('hidden');
    
    // 确保图片URL输入框的事件绑定正确
    if (DOM.productImages) {
        DOM.productImages.removeEventListener('input', previewProductImages);
        DOM.productImages.addEventListener('input', previewProductImages);
        DOM.productImages.removeEventListener('paste', handleImagePaste);
        DOM.productImages.addEventListener('paste', handleImagePaste);
    }
    
    // 获取商品详情并填充表单
    const productId = parseInt(id);
    
    // 从加载的商品列表中查找
    fetch('/api/phones')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(phones => {
            // 查找匹配的商品
            const product = phones.find(p => p.id == productId);
            
            if (product) {
                // 填充表单字段
                DOM.productId.value = product.id;
                DOM.name.value = product.name || '';
                DOM.price.value = product.price || '';
                DOM.storage.value = product.storage || '';
                
                // 确保下拉菜单成色正确设置
                setConditionValue(product.condition || '');
                
                DOM.repair.value = product.repair || '';
                
                // 设置商品图片
                if (product.mainImageUrl) {
                    const images = [product.mainImageUrl];
                    if (product.detailImageUrls && Array.isArray(product.detailImageUrls)) {
                        images.push(...product.detailImageUrls);
                    }
                    
                    // 设置图片URLs并手动触发预览
                    DOM.productImages.value = images.filter(url => url).join(',');
                    previewProductImages({ target: DOM.productImages });
                } else {
                    DOM.productImages.value = '';
                    DOM.imagePreviewContainer.classList.add('hidden');
                }
                
                // 根据设备类型应用不同的样式
                adjustModalForDevice();
                
                // 显示模态框
                DOM.productModal.classList.add('active');
    } else {
                showToast('未找到商品信息', 'error');
            }
        })
        .catch(error => {
            console.error('获取商品信息出错:', error);
            showToast('获取商品信息失败', 'error');
        });
}

/**
 * 设置成色下拉菜单的值
 * @param {string} value - 成色值
 */
function setConditionValue(value) {
    // 获取成色下拉框引用
    const conditionSelect = DOM.condition;
    
    if (!conditionSelect) return;
    
    // 检查是否有匹配的选项
    let optionExists = false;
    
    for (let i = 0; i < conditionSelect.options.length; i++) {
        if (conditionSelect.options[i].value === value) {
            conditionSelect.selectedIndex = i;
            optionExists = true;
            break;
        }
    }
    
    // 如果没有匹配的选项且值不为空，添加一个新选项
    if (!optionExists && value) {
        const newOption = document.createElement('option');
        newOption.value = value;
        newOption.text = value;
        conditionSelect.add(newOption);
        
        // 选中新添加的选项
        conditionSelect.value = value;
    }
}

/**
 * 根据设备类型调整模态框样式
 */
function adjustModalForDevice() {
    const modalBody = document.querySelector('.modal-body');
    const modalHeader = document.querySelector('.modal-header');
    const modalFooter = document.querySelector('.modal-footer');
    
    if (isMobileDevice()) {
        // 移动设备设置
        modalHeader.style.position = 'sticky';
        modalHeader.style.top = '0';
        modalBody.style.overflowY = 'auto';
        modalBody.style.webkitOverflowScrolling = 'touch';
        modalFooter.style.position = 'sticky';
        modalFooter.style.bottom = '0';
        } else {
        // PC设备设置
        modalHeader.style.position = 'static';
        modalBody.style.overflowY = 'visible';
        modalFooter.style.position = 'static';
    }
}

/**
 * 关闭商品模态框
 */
function closeProductModal() {
    // 隐藏模态框
    DOM.productModal.classList.remove('active');
    
    // 重置模态框宽度为默认值
    const modalContent = DOM.productModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.width = '';
        modalContent.style.maxWidth = '';
    }
    
    // 仅当图片预览容器存在时隐藏它
    if (DOM.imagePreviewContainer) {
        DOM.imagePreviewContainer.classList.add('hidden');
    }
    
    // 重置图片预览区域
    if (DOM.imagePreviewsGrid) {
        DOM.imagePreviewsGrid.innerHTML = '';
    }
    
    // 重置表单内容
    resetProductForm();
}

/**
 * 重置商品表单
 */
function resetProductForm() {
    DOM.productForm.reset();
    DOM.productId.value = '';
    
    // 隐藏图片预览区域
    DOM.imagePreviewContainer.classList.add('hidden');
    DOM.imagePreviewsGrid.innerHTML = '';
    
    // 重新绑定事件监听器，确保它们在重置后仍然工作
    if (DOM.productImages) {
        // 添加input事件监听器
        DOM.productImages.removeEventListener('input', previewProductImages);
        DOM.productImages.addEventListener('input', previewProductImages);
        
        // 添加paste事件监听器
        DOM.productImages.removeEventListener('paste', handleImagePaste);
        DOM.productImages.addEventListener('paste', handleImagePaste);
    }
}

/**
 * 处理商品表单提交
 * @param {Event} e - 事件对象
 */
function handleProductFormSubmit(e) {
    e.preventDefault();
    
    // 获取图片URLs数组
    const imageUrls = DOM.productImages.value.trim().split(',')
        .map(url => url.trim())
        .filter(url => url !== '');
    
    // 收集表单数据
    const formData = {
        id: DOM.productId.value ? parseInt(DOM.productId.value) : Date.now(),
        name: DOM.name.value.trim(),
        price: parseFloat(DOM.price.value) || 0,
        storage: DOM.storage.value.trim(),
        condition: DOM.condition.value.trim(),
        repair: DOM.repair.value.trim(),
        mainImageUrl: imageUrls.length > 0 ? imageUrls[0] : '',
        detailImageUrls: imageUrls.length > 1 ? imageUrls.slice(1) : [],
        updatedAt: new Date().toISOString(),
        soldOut: false // 新商品默认未售出
    };
    
    // 验证必填字段
    if (!formData.name || !formData.price || !formData.mainImageUrl) {
        showToast('请填写商品名称、价格并上传至少一张图片', 'error');
        return;
    }
    
    // 判断是新增还是编辑
    const isEditing = phones.some(p => parseInt(p.id) === formData.id);
    
    try {
        if (isEditing) {
            // 编辑现有商品
            const index = phones.findIndex(p => parseInt(p.id) === formData.id);
            if (index !== -1) {
                // 保留现有售出状态
                formData.soldOut = phones[index].soldOut || false;
                formData.soldDate = phones[index].soldDate || null;
                
                // 更新数组中的对象
                phones[index] = formData;
                console.log("更新商品:", formData);
            } else {
                throw new Error("找不到要编辑的商品");
            }
        } else {
            // 添加新商品
            phones.push(formData);
            console.log("添加新商品:", formData);
        }
        
        // 保存到文件
        savePhonesToFile().then(success => {
            if (success) {
                showToast(isEditing ? '商品更新成功' : '商品添加成功', 'success');
                closeProductModal();
                
                // 刷新显示
                displayProducts(phones);
                
                // 更新基础统计数据
                const soldCount = phones.filter(p => p.soldOut).length;
                const availableCount = phones.length - soldCount;
                
                updateStats({
                    totalProducts: availableCount,
                    soldProducts: soldCount,
                    todayVisits: document.getElementById('todayVisits').textContent || 0
                });
                
                // 同时刷新侧边栏和月销量等其他统计数据
                loadProductStats();
            }
        });
    } catch (error) {
        console.error('保存商品出错:', error);
        showToast(`保存失败: ${error.message}`, 'error');
    }
}

/**
 * 加载商品列表
 */
function loadProducts() {
    // 显示加载状态
    document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="8" class="text-center py-4">加载中...</td></tr>';
    
    // 发送请求获取商品列表
    fetch('/api/phones')
        .then(response => response.json())
        .then(data => {
            if (data) {
                // 保存到全局变量
                phones = Array.isArray(data) ? data : [];
                
                // 展示商品数据
                displayProducts(phones);
                
                // 计算统计数据
                const soldCount = phones.filter(phone => phone.soldOut === true).length;
                const totalCount = phones.length;
                const availableCount = totalCount - soldCount;
                
                // 更新统计数据
                updateStats({
                    totalProducts: availableCount,
                    soldProducts: soldCount,
                    todayVisits: document.getElementById('todayVisits').textContent || 0
                });
            } else {
                showToast('获取商品列表失败', 'error');
                document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="8" class="text-center py-4">加载失败</td></tr>';
            }
        })
        .catch(error => {
            showToast('获取商品列表时发生错误', 'error');
            document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="8" class="text-center py-4">加载失败</td></tr>';
        });
}

/**
 * 显示商品数据
 * @param {Array} products - 商品数据
 */
function displayProducts(products) {
    const tbody = document.getElementById('productsTableBody');
    
    // 保存过滤后的商品
    filteredPhones = products;
    
    // 计算总页数
    totalPages = Math.ceil(filteredPhones.length / itemsPerPage);
    
    // 确保当前页码在有效范围内
    if (currentPage > totalPages) {
        currentPage = totalPages > 0 ? totalPages : 1;
    }
    
    // 计算当前页要显示的商品
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredPhones.length);
    const currentProducts = filteredPhones.slice(startIndex, endIndex);
    
    // 清空表格内容
    tbody.innerHTML = '';
    
    // 如果没有产品，显示提示信息
    if (currentProducts.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td colspan="7" class="text-center py-6 text-gray-500">
                <i class="fas fa-box-open text-gray-400 text-4xl mb-3"></i>
                <p>没有找到商品</p>
            </td>
        `;
        tbody.appendChild(tr);
        
        // 隐藏分页控件
        DOM.paginationContainer.classList.add('hidden');
        return;
    }
    
    // 显示分页控件
    DOM.paginationContainer.classList.remove('hidden');
    
    // 生成商品列表
    currentProducts.forEach(product => {
        const tr = document.createElement('tr');
        tr.className = 'phone-row';
        tr.onclick = (event) => handleRowClick(event, product.id);
        
        const imageUrl = getProductImageUrl(product);
        
        const isSold = product.soldOut || product.status === 'sold';
        const buttonClass = isSold ? 'btn-sold-active' : 'btn-sold';
        const buttonIcon = isSold ? 'fa-box-open' : 'fa-box';
        const buttonTooltip = isSold ? '标记为在售' : '标记为已售';

        tr.innerHTML = `
            <td class="py-4 px-4">
                <div class="flex items-center">
                    <div class="product-image-container">
                        ${imageUrl ? `<img src="${imageUrl}" alt="${product.name}" class="product-image">` : 
                        `<div class="no-image-placeholder">
                            <i class="fas fa-image"></i>
                        </div>`}
                    </div>
                    <div class="ml-4">
                        <div class="font-medium text-gray-800 mb-1">${product.name}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 px-4 text-center">${product.storage || '-'}</td>
            <td class="py-4 px-4 text-right font-medium ${isSold ? 'text-green-500' : 'text-gray-700'}">${formatPrice(product.price)}</td>
            <td class="py-4 px-4 text-center">${product.condition || '-'}</td>
            <td class="py-4 px-4">
                <span class="truncate" style="max-width: 180px; display: inline-block;">${product.repair || '-'}</span>
            </td>
            <td class="py-4 px-4 text-center">
                ${getStatusBadge(isSold ? 'sold' : 'available')}
            </td>
            <td class="py-4 px-4 md:table-cell">
                <div class="flex justify-end">
                    <button class="action-btn btn-edit" onclick="openEditProductModal('${product.id}'); event.stopPropagation();" title="编辑商品">
                        <i class="fas fa-edit"></i>
                        <span class="action-btn-tooltip">编辑</span>
                    </button>
                    <button class="action-btn ${buttonClass}" 
                        onclick="markAsSold('${product.id}'); event.stopPropagation();" 
                        title="${buttonTooltip}">
                        <i class="fas ${buttonIcon}"></i>
                        <span class="action-btn-tooltip">${buttonTooltip}</span>
                    </button>
                    <button class="action-btn btn-delete" onclick="deleteProduct('${product.id}'); event.stopPropagation();" title="删除商品">
                        <i class="fas fa-trash-alt"></i>
                        <span class="action-btn-tooltip">删除</span>
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
    
    // 更新分页控件
    updatePagination();
}

/**
 * 获取商品图片URL
 * @param {Object} product - 商品对象
 * @returns {string|null} - 返回处理后的图片URL或null
 */
function getProductImageUrl(product) {
    if (!product) return null;
    
    let imageUrl = null;
    
    // 尝试从mainImageUrl获取图片URL
    if (product.mainImageUrl && typeof product.mainImageUrl === 'string' && product.mainImageUrl.trim() !== '') {
        imageUrl = product.mainImageUrl.trim();
    } 
    // 如果mainImageUrl不存在，尝试从images数组获取
    else if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === 'string' && firstImage.trim() !== '') {
            imageUrl = firstImage.trim();
        }
    } 
    // 如果images不存在，尝试从detailImageUrls获取
    else if (product.detailImageUrls && Array.isArray(product.detailImageUrls) && product.detailImageUrls.length > 0) {
        const firstDetailImage = product.detailImageUrls[0];
        if (typeof firstDetailImage === 'string' && firstDetailImage.trim() !== '') {
            imageUrl = firstDetailImage.trim();
        }
    }
    
    // 如果没有找到有效的图片URL，返回null
    if (!imageUrl) return null;
    
    // 确保图片URL是绝对路径或完整URL
    if (!imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
        imageUrl = '/' + imageUrl;
    }
    
    return imageUrl;
}

/**
 * 更新统计数据
 * @param {Object} stats - 统计数据对象
 */
function updateStats(stats) {
    if (stats) {
        // 更新统计卡片
        document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
        document.getElementById('soldProducts').textContent = stats.soldProducts || 0;
        document.getElementById('todayVisits').textContent = stats.todayVisits || 0;
    }
}

/**
 * 删除商品
 * @param {string} id - 商品ID
 */
function deleteProduct(id) {
    if (!id) {
        showToast('无效的商品ID', 'error');
        return;
    }
    
    // 转换为数字ID
    id = parseInt(id);
    
    openConfirmModal('确定要删除这个商品吗？此操作不可恢复。', async () => {
        try {
            // 查找商品索引
            const index = phones.findIndex(p => parseInt(p.id) === id);
            
            if (index === -1) {
                console.error("未找到ID为", id, "的商品");
                showToast('删除商品失败', 'error');
                return;
            }
            
            // 从数组中移除
            phones.splice(index, 1);
            
            // 保存到服务器
            const saveResult = await savePhonesToFile();
            
            if (saveResult) {
                showToast('商品删除成功', 'success');
                
                // 刷新显示
                displayProducts(phones);
                
                // 更新基础统计数据
                const soldCount = phones.filter(p => p.soldOut).length;
                const availableCount = phones.length - soldCount;
                
                updateStats({
                    totalProducts: availableCount,
                    soldProducts: soldCount,
                    todayVisits: document.getElementById('todayVisits').textContent || 0
                });
                
                // 同时刷新侧边栏和月销量等其他统计数据
                loadProductStats();
            }
        } catch (error) {
            console.error('删除商品出错:', error);
            showToast('删除商品失败', 'error');
        }
    });
}

/**
 * 初始化DOM元素引用
 */
function initializeDOMElements() {
    // 更新DOM对象以包含所有必要ID
    DOM.toastContainer = document.getElementById('toastContainer');
    DOM.changePasswordModal = document.getElementById('changePasswordModal');
    DOM.changePasswordForm = document.getElementById('changePasswordForm');
    DOM.currentPassword = document.getElementById('currentPassword');
    DOM.newPassword = document.getElementById('newPassword');
    DOM.confirmPassword = document.getElementById('confirmPassword');
    DOM.confirmModal = document.getElementById('confirmModal');
    DOM.confirmModalMessage = document.getElementById('confirmModalMessage');
    DOM.confirmModalConfirmBtn = document.getElementById('confirmModalConfirmBtn');
    DOM.confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
    DOM.productModal = document.getElementById('productModal');
    DOM.productForm = document.getElementById('productForm');
    DOM.productModalTitle = document.getElementById('productModalTitle');
    DOM.productId = document.getElementById('productId');
    DOM.name = document.getElementById('name');
    DOM.price = document.getElementById('price');
    DOM.storage = document.getElementById('storage');
    DOM.condition = document.getElementById('condition');
    DOM.repair = document.getElementById('repair');
    DOM.productImages = document.getElementById('productImages');
    DOM.imagePreviewContainer = document.getElementById('imagePreviewContainer');
    DOM.imagePreviewsGrid = document.getElementById('imagePreviewsGrid');
    
    // 添加商品模态框
    DOM.addProductModal = document.getElementById('addProductModal');
    DOM.addProductForm = document.getElementById('addProductForm');
    DOM.addProductModalTitle = document.getElementById('addProductModalTitle');
    DOM.addProductId = document.getElementById('addProductId');
    DOM.addProductImages = document.getElementById('addProductImages');
    
    // 分页相关元素
    DOM.paginationContainer = document.getElementById('paginationContainer');
    DOM.paginationNumbers = document.getElementById('paginationNumbers');
    DOM.paginationInfo = document.getElementById('paginationInfo');
    DOM.paginationCount = document.getElementById('paginationCount');
    DOM.prevPageBtn = document.getElementById('prevPageBtn');
    DOM.nextPageBtn = document.getElementById('nextPageBtn');
    
    // 用户名显示
    DOM.adminUsername = document.getElementById('adminUsername');
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
    // 检查登录状态
    checkLogin();
    
    // 加载商品和统计数据
    loadProducts();
    loadStats();
    
    // 初始化DOM元素引用
    initializeDOMElements();
    
    // 设置事件监听器
    if (DOM.changePasswordForm) {
        DOM.changePasswordForm.addEventListener('submit', handleChangePassword);
    }
    
    if (DOM.productForm) {
        DOM.productForm.addEventListener('submit', handleProductFormSubmit);
    }
    
    // 设置添加商品模态框的事件监听器
    if (DOM.addProductForm) {
        DOM.addProductForm.addEventListener('submit', handleProductFormSubmit);
    }
    
    // 图片输入事件
    if (DOM.productImages) {
        DOM.productImages.addEventListener('input', previewProductImages);
        DOM.productImages.addEventListener('paste', handleImagePaste);
    }
    
    if (DOM.addProductImages) {
        DOM.addProductImages.addEventListener('input', previewProductImages);
        DOM.addProductImages.addEventListener('paste', handleImagePaste);
    }
    
    // 为搜索框添加事件监听器
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1; // 搜索时重置到第1页
            debounce(handleSearch, 300)();
        });
        
        // 确保搜索图标不会干扰搜索框使用
        const searchIcon = searchInput.parentElement.querySelector('i');
        if (searchIcon) {
            searchIcon.addEventListener('click', () => {
                searchInput.focus(); // 点击图标时让搜索框获得焦点
            });
        }
    }
    
    // 为排序下拉菜单添加事件监听器
    const sortField = document.getElementById('sortField');
    if (sortField) {
        sortField.addEventListener('change', () => {
            currentPage = 1; // 排序时重置到第1页
            handleSearch();
        });
    }
    
    // 为排序方向按钮添加事件监听器
    const sortDirection = document.getElementById('sortDirection');
    if (sortDirection) {
        sortDirection.addEventListener('click', () => {
            currentPage = 1; // 排序方向改变时重置到第1页
            toggleSortDirection();
        });
    }
    
    // 窗口大小变化时重新调整模态框样式
    window.addEventListener('resize', debounce(function() {
        // 只有当模态框打开时才调整
        if (DOM.productModal && DOM.productModal.classList.contains('active')) {
            adjustModalForDevice();
        }
    }, 200));
    
    // 初始化模态框的点击外部关闭
    initModalOutsideClickHandlers();
    
    // 加载当前网站设置
    loadSiteSettings();
    
    // 确认模态框取消按钮
    if (DOM.confirmModalCancelBtn) {
        DOM.confirmModalCancelBtn.addEventListener('click', closeConfirmModal);
    }
    
    // 分页按钮事件
    if (DOM.prevPageBtn) {
        DOM.prevPageBtn.addEventListener('click', prevPage);
    }
    if (DOM.nextPageBtn) {
        DOM.nextPageBtn.addEventListener('click', nextPage);
    }
}

/**
 * 防抖函数
 * @param {Function} func - 需要防抖的函数
 * @param {number} wait - 等待时间(毫秒)
 * @returns {Function} - 防抖处理后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

/**
 * 切换排序方向并重新排序
 */
function toggleSortDirection() {
    const sortIcon = document.getElementById('sortIcon');
    const isDescending = sortIcon.classList.contains('fa-sort-amount-down');
    
    // 切换图标
    if (isDescending) {
        sortIcon.classList.remove('fa-sort-amount-down');
        sortIcon.classList.add('fa-sort-amount-up');
        } else {
        sortIcon.classList.remove('fa-sort-amount-up');
        sortIcon.classList.add('fa-sort-amount-down');
    }
    
    // 立即触发搜索和排序
    handleSearch();
}

/**
 * 处理搜索和排序
 */
function handleSearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const sortField = document.getElementById('sortField').value;
    const sortIcon = document.getElementById('sortIcon');
    const isDescending = sortIcon.classList.contains('fa-sort-amount-down');
    
    // 复制原始数组以进行排序
    let filteredPhones = [...phones];
    
    // 首先进行搜索过滤
    if (searchTerm) {
        filteredPhones = filteredPhones.filter(phone => {
            return (
                (phone.name && phone.name.toLowerCase().includes(searchTerm)) ||
                (phone.storage && phone.storage.toLowerCase().includes(searchTerm)) ||
                (phone.price && phone.price.toString().includes(searchTerm)) ||
                (phone.condition && phone.condition.toLowerCase().includes(searchTerm)) ||
                (phone.repair && phone.repair.toLowerCase().includes(searchTerm))
            );
        });
    }
    
    // 然后进行排序
    if (sortField) {
        filteredPhones.sort((a, b) => {
            let valueA = a[sortField];
            let valueB = b[sortField];
            
            // 处理特殊字段
            if (sortField === 'price') {
                valueA = parseFloat(valueA) || 0;
                valueB = parseFloat(valueB) || 0;
            } else if (typeof valueA === 'string' && typeof valueB === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            // 处理空值
            if (!valueA && valueA !== 0) return isDescending ? -1 : 1;
            if (!valueB && valueB !== 0) return isDescending ? 1 : -1;
            
            // 根据排序方向返回结果
            if (valueA < valueB) return isDescending ? 1 : -1;
            if (valueA > valueB) return isDescending ? -1 : 1;
            return 0;
        });
    }
    
    // 显示结果
    displayProducts(filteredPhones);
}

// 网站设置相关

/**
 * 打开设置模态框
 */
function openSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.classList.add('active');
    
    // 获取网站设置
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            // 填充表单
            const siteTitle = document.getElementById('siteTitle');
            if (siteTitle) siteTitle.value = data.title || '';
            
            // 更新Logo预览
            updateLogoPreview(data.logo);
            
            // 更新Favicon预览
            updateFaviconPreview(data.favicon);
        })
        .catch(error => {
            console.error('获取网站设置出错:', error);
            // 不显示错误通知，因为可能是首次设置
            // showToast('获取网站设置时发生错误', 'error');
        });
}

/**
 * 打开联系方式编辑模态框
 */
function openContactModal() {
    const contactModal = document.getElementById('contactModal');
    contactModal.classList.add('active');
    
    // 获取网站设置，包括联系方式
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            const contact = data.contact || { phone: '', qq: '', wechatQR: '' };
            
            // 填充表单
            const phoneInput = document.getElementById('contactPhoneInput');
            const qqInput = document.getElementById('contactQQInput');
            
            if (phoneInput) phoneInput.value = contact.phone || '';
            if (qqInput) qqInput.value = contact.qq || '';
            
            // 更新微信二维码预览
            updateWechatQRPreview(contact.wechatQR);
        })
        .catch(error => {
            console.error('获取联系方式设置出错:', error);
            showToast('获取联系方式设置时发生错误', 'error');
        });
}

/**
 * 关闭联系方式编辑模态框
 */
function closeContactModal() {
    const contactModal = document.getElementById('contactModal');
    contactModal.classList.remove('active');
}

/**
 * 更新微信二维码预览
 * @param {string} url - 微信二维码图片URL
 */
function updateWechatQRPreview(url) {
    const wechatPreview = document.getElementById('wechatPreview');
    const wechatPreviewImg = document.getElementById('wechatPreviewImg');
    const wechatEmptyText = document.getElementById('wechatEmptyText');
    const wechatDeleteButton = document.getElementById('wechatDeleteButton');
    
    if (!wechatPreview || !wechatPreviewImg || !wechatEmptyText) return;
    
    // 显示预览容器
    wechatPreview.classList.remove('hidden');
    
    if (url) {
        // 有微信二维码
        wechatPreviewImg.src = url;
        wechatPreviewImg.classList.remove('hidden');
        wechatEmptyText.classList.add('hidden');
        
        // 显示删除按钮
        if (wechatDeleteButton) wechatDeleteButton.style.display = 'flex';
    } else {
        // 无微信二维码
        wechatPreviewImg.classList.add('hidden');
        wechatEmptyText.classList.remove('hidden');
        
        // 隐藏删除按钮
        if (wechatDeleteButton) wechatDeleteButton.style.display = 'none';
    }
}

/**
 * 删除微信二维码
 */
function deleteWechatQRCode() {
    // 先关闭联系方式模态框，避免通知被遮挡
    closeContactModal();
    
    // 确认是否删除
    openConfirmModal('确定要删除微信二维码吗？', () => {
        fetch('/api/delete-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'wechatQR'
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('微信二维码删除成功', 'success');
                updateWechatQRPreview('');
                
                // 更新联系方式中的微信二维码设置
                saveContactInfo('');
                
                // 清空文件选择框
                document.getElementById('wechatQRCode').value = '';
            } else {
                showToast(data.error || '删除失败', 'error');
            }
        })
        .catch(error => {
            console.error('删除微信二维码出错:', error);
            showToast('删除微信二维码时发生错误', 'error');
        });
    });
}

/**
 * 保存联系方式
 * @param {string|null} wechatQRUrl - 微信二维码URL，null表示使用表单中的值
 */
function saveContactInfo(wechatQRUrl = null) {
    const phoneInput = document.getElementById('contactPhoneInput');
    const qqInput = document.getElementById('contactQQInput');
    const wechatPreviewImg = document.getElementById('wechatPreviewImg');
    
    const phone = phoneInput ? phoneInput.value.trim() : '';
    const qq = qqInput ? qqInput.value.trim() : '';
    
    // 确定微信二维码URL
    let wechatQR = '';
    if (wechatQRUrl === null) {
        // 如果没有提供URL，从预览图像获取
        if (wechatPreviewImg && !wechatPreviewImg.classList.contains('hidden')) {
            wechatQR = wechatPreviewImg.src;
            // 如果图片是以数据URL格式开头的预览图，不保存
            if (wechatQR.startsWith('data:')) {
                wechatQR = '';
            }
        }
    } else {
        wechatQR = wechatQRUrl;
    }
    
    // 发送请求保存联系方式
    fetch('/api/settings/contact', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ phone, qq, wechatQR })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('保存联系方式失败');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showToast('联系方式保存成功', 'success');
            closeContactModal();
            
            // 更新侧边栏显示
            updateContactInfo(data.contact);
        } else {
            showToast(data.error || '保存联系方式失败', 'error');
        }
    })
    .catch(error => {
        console.error('保存联系方式出错:', error);
        showToast('保存联系方式时出错', 'error');
    });
}

/**
 * 更新侧边栏联系信息显示
 * @param {Object} contact - 联系信息对象
 */
function updateContactInfo(contact) {
    if (!contact) return;
    
    const phoneElement = document.getElementById('contactPhone');
    const qqElement = document.getElementById('contactQQ');
    const wechatStatus = document.getElementById('wechatStatus');
    
    if (phoneElement) {
        phoneElement.textContent = contact.phone || '未设置';
    }
    
    if (qqElement) {
        qqElement.textContent = contact.qq || '未设置';
    }
    
    if (wechatStatus) {
        wechatStatus.textContent = contact.wechatQR ? '已设置' : '未设置';
        wechatStatus.className = contact.wechatQR ? 'text-sm font-medium text-green-500' : 'text-sm font-medium text-gray-500';
    }
}

/**
 * 关闭设置模态框
 */
function closeSettingsModal() {
    const settingsModal = document.getElementById('settingsModal');
    settingsModal.classList.remove('active');
}

/**
 * 更新Logo预览
 * @param {string} url - Logo URL
 */
function updateLogoPreview(url) {
    const logoPreview = document.getElementById('logoPreview');
    const logoPreviewImg = document.getElementById('logoPreviewImg');
    const logoEmptyText = document.getElementById('logoEmptyText');
    const logoDeleteButton = document.getElementById('logoDeleteButton');
        
        if (url) {
        logoPreviewImg.src = url;
        logoPreviewImg.classList.remove('hidden');
        logoEmptyText.classList.add('hidden');
        logoPreview.classList.remove('hidden');
        logoDeleteButton.style.display = 'flex';
        
        // 更新侧边栏状态显示
        const logoStatusText = document.getElementById('logoStatusText');
        if (logoStatusText) {
            logoStatusText.textContent = '已设置';
            logoStatusText.className = 'text-green-500';
                    }
                } else {
        logoPreviewImg.classList.add('hidden');
        logoEmptyText.classList.remove('hidden');
        logoPreview.classList.remove('hidden');
        logoDeleteButton.style.display = 'none';
        
        // 更新侧边栏状态显示
        const logoStatusText = document.getElementById('logoStatusText');
        if (logoStatusText) {
            logoStatusText.textContent = '未设置';
            logoStatusText.className = 'text-gray-500';
        }
    }
}

/**
 * 更新Favicon预览
 * @param {string} url - Favicon URL
 */
function updateFaviconPreview(url) {
    const faviconPreview = document.getElementById('faviconPreview');
    const faviconPreviewImg = document.getElementById('faviconPreviewImg');
    const faviconEmptyText = document.getElementById('faviconEmptyText');
    const faviconDeleteButton = document.getElementById('faviconDeleteButton');
    
    if (url) {
        faviconPreviewImg.src = url;
        faviconPreviewImg.classList.remove('hidden');
        faviconEmptyText.classList.add('hidden');
        faviconPreview.classList.remove('hidden');
        faviconDeleteButton.style.display = 'flex';
        
        // 更新侧边栏状态显示
        const faviconStatusText = document.getElementById('faviconStatusText');
        if (faviconStatusText) {
            faviconStatusText.textContent = '已设置';
            faviconStatusText.className = 'text-green-500';
                }
            } else {
        faviconPreviewImg.classList.add('hidden');
        faviconEmptyText.classList.remove('hidden');
        faviconPreview.classList.remove('hidden');
        faviconDeleteButton.style.display = 'none';
        
        // 更新侧边栏状态显示
        const faviconStatusText = document.getElementById('faviconStatusText');
        if (faviconStatusText) {
            faviconStatusText.textContent = '未设置';
            faviconStatusText.className = 'text-gray-500';
        }
    }
}

/**
 * 验证并预览文件
 * @param {HTMLInputElement} input - 文件输入框
 * @param {string} previewId - 预览容器ID
 * @param {number} maxSize - 最大文件大小(KB)
 */
function validateAndPreviewFile(input, previewId, maxSize) {
    if (input.files && input.files[0]) {
    const file = input.files[0];
        const fileSize = file.size / 1024; // 转为KB
    
        if (fileSize > maxSize) {
            showToast(`文件过大，请上传小于${maxSize}KB的图片`, 'error');
        input.value = '';
        return;
    }
    
        const reader = new FileReader();
        reader.onload = function(e) {
            if (previewId === 'logoPreview') {
                updateLogoPreview(e.target.result);
                // 立即隐藏文字提示
                document.getElementById('logoEmptyText').style.display = 'none';
            } else if (previewId === 'faviconPreview') {
                updateFaviconPreview(e.target.result);
                // 立即隐藏文字提示
                document.getElementById('faviconEmptyText').style.display = 'none';
            } else if (previewId === 'wechatPreview') {
                // 更新微信二维码预览
                updateWechatQRPreview(e.target.result);
                document.getElementById('wechatEmptyText').style.display = 'none';
            }
    
            // 将文件上传到服务器
            const formData = new FormData();
            formData.append('file', file);
            
            // 根据预览ID确定上传类型
            if (previewId === 'logoPreview') {
                formData.append('type', 'logo');
            } else if (previewId === 'faviconPreview') {
                formData.append('type', 'favicon');
            } else if (previewId === 'wechatPreview') {
                formData.append('type', 'wechatQR');
            }
            
            uploadImage(formData, previewId);
        };
        reader.readAsDataURL(file);
    }
}

/**
 * 上传图片
 * @param {FormData} formData - 表单数据
 * @param {string} previewId - 预览容器ID
 */
function uploadImage(formData, previewId) {
    fetch('/api/upload-image', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // 根据类型显示不同通知
            let type = '图片';
            if (previewId === 'logoPreview') {
                type = 'Logo';
                updateLogoPreview(data.url);
            } else if (previewId === 'faviconPreview') {
                type = '网站图标';
                updateFaviconPreview(data.url);
                
                // 特殊处理favicon
                const favicon = document.getElementById('favicon');
                if (favicon) {
                    favicon.href = data.url;
                }
            } else if (previewId === 'wechatPreview') {
                type = '微信二维码';
                updateWechatQRPreview(data.url);
                
                // 保存到联系信息，但不关闭模态框
                const phoneInput = document.getElementById('contactPhoneInput');
                const qqInput = document.getElementById('contactQQInput');
                
                const phone = phoneInput ? phoneInput.value.trim() : '';
                const qq = qqInput ? qqInput.value.trim() : '';
                const wechatQR = data.url;
                
                // 静默更新联系方式，不触发关闭模态框
                fetch('/api/settings/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ phone, qq, wechatQR })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        // 仅更新侧边栏显示，不关闭模态框
                        updateContactInfo(result.contact);
                    }
                })
                .catch(error => {
                    console.error('保存联系方式出错:', error);
                });
            }
            
            showToast(`${type}上传成功`, 'success');
        } else {
            showToast(data.message || '上传失败', 'error');
        }
    })
    .catch(error => {
        console.error('上传图片出错:', error);
        showToast('上传图片时发生错误', 'error');
    });
}

/**
 * 删除Logo
 */
function deleteLogo() {
    openConfirmModal('确定要删除网站Logo吗？', () => {
        fetch('/api/delete-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'logo'
        })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('网站Logo删除成功', 'success');
                updateLogoPreview(null);
            
                // 清空文件选择框
                document.getElementById('siteLogo').value = '';
            } else {
                showToast(data.message || '删除失败', 'error');
            }
        })
        .catch(error => {
            console.error('删除Logo出错:', error);
            showToast('删除Logo时发生错误', 'error');
        });
    });
}

/**
 * 删除Favicon
 */
function deleteFavicon() {
    openConfirmModal('确定要删除网站图标吗？', () => {
        fetch('/api/delete-file', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'favicon'
        })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('网站图标删除成功', 'success');
                updateFaviconPreview(null);
                
                // 清空文件选择框
                document.getElementById('siteFavicon').value = '';
                
                // 重置favicon
                const favicon = document.getElementById('favicon');
                if (favicon) {
                    favicon.href = '/img/default-favicon.ico';
                }
            } else {
                showToast(data.message || '删除失败', 'error');
            }
        })
        .catch(error => {
            console.error('删除Favicon出错:', error);
            showToast('删除Favicon时发生错误', 'error');
        });
    });
}

/**
 * 保存网站标题
 */
function saveSiteTitle() {
    const title = document.getElementById('siteTitle').value.trim();

    fetch('/api/settings/title', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showToast('网站标题保存成功', 'success');
            document.getElementById('siteTitleDisplay').textContent = title || '二手机展示';
            } else {
            showToast(data.message || '保存失败', 'error');
        }
    })
    .catch(error => {
        console.error('保存设置出错:', error);
        showToast('保存设置时发生错误', 'error');
    });
}

/**
 * 加载网站设置
 */
function loadSiteSettings() {
    // 获取网站设置并更新UI
    fetch('/api/settings')
        .then(response => response.json())
        .then(data => {
            // 更新网站标题显示
            const siteTitleDisplay = document.getElementById('siteTitleDisplay');
            if (siteTitleDisplay) {
                siteTitleDisplay.textContent = data.title || '二手机展示';
            }
            
            // 更新logo状态
            updateLogoStatus(data.logo);
            
            // 更新favicon状态
            updateFaviconStatus(data.favicon);
            
            // 更新设置状态
            updateSettingsStatus(data);
            
            // 更新联系信息
            if (data.contact) {
                updateContactInfo(data.contact);
            }
            
            // 用当前设置更新文档标题
            document.title = '后台管理 - ' + (data.title || '二手机展示');
        })
        .catch(error => {
            console.error('加载设置出错:', error);
        });
}

/**
 * 加载统计数据
 */
function loadStats() {
    // 加载访问统计数据
    fetch('/api/stats/visits')
        .then(response => response.json())
        .then(data => {
            // 更新今日访问卡片
            const todayVisits = document.getElementById('todayVisits');
            if (todayVisits) {
                todayVisits.textContent = data.today.toLocaleString();
            }
            
            // 更新侧边栏数据统计的今日访问
            const dailyVisits = document.getElementById('dailyVisits');
            if (dailyVisits) {
                dailyVisits.textContent = data.today.toLocaleString();
            }
            
            // 更新总访问量
            const totalVisits = document.getElementById('totalVisits');
            if (totalVisits) {
                totalVisits.textContent = data.total.toLocaleString();
            }
            
            // 更新其他统计数据
            loadProductStats();
        })
        .catch(error => {
            console.error('获取访问统计出错:', error);
        });
}

/**
 * 加载商品统计数据
 */
function loadProductStats() {
    fetch('/api/phones?limit=999')
        .then(response => response.json())
        .then(data => {
            let phones = Array.isArray(data) ? data : (data.phones || []);
            
            // 统计在售与已售商品
            const soldCount = phones.filter(phone => phone.soldOut === true).length;
            const totalCount = phones.length;
            const availableCount = totalCount - soldCount;
            
            // 更新在售商品数量
            const totalProducts = document.getElementById('totalProducts');
            if (totalProducts) {
                totalProducts.textContent = availableCount.toLocaleString();
            }
            
            // 更新已售商品数量
            const soldProducts = document.getElementById('soldProducts');
            if (soldProducts) {
                soldProducts.textContent = soldCount.toLocaleString();
            }
            
            // 计算本月销量
            const monthlySales = document.getElementById('monthlySales');
            if (monthlySales) {
                const now = new Date();
                const thisMonth = now.getMonth();
                const thisYear = now.getFullYear();
                
                const monthlySoldCount = phones.filter(phone => {
                    if (!phone.soldOut || !phone.soldDate) return false;
                    const soldDate = new Date(phone.soldDate);
                    return soldDate.getMonth() === thisMonth && 
                           soldDate.getFullYear() === thisYear;
                }).length;
                
                monthlySales.textContent = monthlySoldCount.toLocaleString();
            }
            
            // 计算平均价格
            const averagePrice = document.getElementById('averagePrice');
            if (averagePrice) {
                if (phones.length > 0) {
                    const totalPrice = phones.reduce((sum, phone) => sum + (parseFloat(phone.price) || 0), 0);
                    const avgPrice = totalPrice / phones.length;
                    averagePrice.textContent = '¥' + avgPrice.toFixed(2).toLocaleString();
        } else {
                    averagePrice.textContent = '¥0';
                }
            }
        })
        .catch(error => {
            console.error('获取商品统计出错:', error);
        });
}

/**
 * 初始化模态框外部点击事件
 */
function initModalOutsideClickHandlers() {
    // 获取所有模态框
    const modals = document.querySelectorAll('.modal');
    
    // 为每个模态框添加点击事件
    modals.forEach(modal => {
        modal.addEventListener('click', function(event) {
            // 如果点击的是模态框本身（不是模态框内容区域）
            if (event.target === modal) {
                // 获取模态框ID来确定关闭哪个模态框
                const modalId = modal.id;
                if (modalId === 'settingsModal') {
                    closeSettingsModal();
                } else if (modalId === 'productModal' || modalId === 'addProductModal') {
                    closeProductModal();
                } else if (modalId === 'changePasswordModal') {
                    closeChangePasswordModal();
                } else if (modalId === 'confirmModal') {
                    closeConfirmModal();
                }
            }
        });
    });
}

/**
 * 处理移动设备上表格行点击
 * @param {Event} event - 点击事件
 * @param {string} productId - 商品ID
 */
function handleRowClick(event, productId) {
    // 仅在移动设备上触发
    if (window.innerWidth <= 768) {
        // 防止点击到按钮时的冒泡
        const target = event.target;
        if (target.tagName === 'BUTTON' || 
            target.closest('button') ||
            target.closest('.action-btn') ||
            target.closest('[data-prevent-row-click="true"]') ||
            target.hasAttribute('data-prevent-row-click')) {
        return;
    }
    
        // 阻止默认事件和冒泡
        event.preventDefault();
        event.stopPropagation();
        
        // 打开编辑模态框
        openEditProductModal(productId);
    }
}

/**
 * 保存产品数据到文件
 */
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
        
        return true;
    } catch (error) {
        showToast('保存失败，请重试', 'error');
        return false;
    }
}

/**
 * 标记商品为已售
 * @param {string} id - 商品ID
 */
function markAsSold(id) {
    if (!id) {
        showToast('无效的商品ID', 'error');
        return;
    }
    
    // 转换ID为数字
    id = parseInt(id);
    
    openConfirmModal('确定要将此商品标记为已售吗？', async () => {
        try {
            // 找到商品索引
            const index = phones.findIndex(p => parseInt(p.id) === id);
            
            if (index === -1) {
                showToast('更改商品状态失败', 'error');
                return;
            }
            
            // 切换售卖状态
            phones[index].soldOut = !phones[index].soldOut;
            
            // 如果标记为已售，则添加售出日期
            if (phones[index].soldOut) {
                phones[index].soldDate = new Date().toISOString();
            } else {
                // 如果标记为在售，则移除售出日期
                delete phones[index].soldDate;
            }
            
            // 保存到文件
            const saveResult = await savePhonesToFile();
            
            if (saveResult) {
                // 刷新显示
                displayProducts(phones);
                const isSold = phones[index].soldOut;
                showToast(`商品状态已更改为${isSold ? '已售' : '在售'}`, 'success');
                
                // 更新统计数据
                const soldCount = phones.filter(p => p.soldOut).length;
                const totalCount = phones.length;
                const availableCount = totalCount - soldCount;
                
                // 实时更新顶部统计卡片
                updateStats({
                    totalProducts: availableCount,
                    soldProducts: soldCount,
                    todayVisits: document.getElementById('todayVisits').textContent || 0
                });
                
                // 同时刷新侧边栏和月销量等其他统计数据
                loadProductStats();
            }
        } catch (error) {
            showToast("操作失败，请重试", 'error');
        }
    });
}

/**
 * 预览产品图片
 */
function previewProductImages(event) {
    // 获取图片URL文本
    const urlsText = event.target.value;
    
    // 如果没有URL，隐藏预览区域
    if (!urlsText.trim()) {
        DOM.imagePreviewContainer.classList.add('hidden');
        return;
    }
    
    // 分割并清理URL
    const urls = urlsText.split(',')
        .map(url => url.trim())
        .filter(url => url && (url.startsWith('http') || url.startsWith('/')));
    
    // 如果没有有效URL，隐藏预览区域
    if (urls.length === 0) {
        DOM.imagePreviewContainer.classList.add('hidden');
        return;
    }
    
    // 清空预览区域
    DOM.imagePreviewsGrid.innerHTML = '';
    
    // 根据图片数量调整模态框宽度和网格列数
    const imageCount = urls.length;
    const baseWidth = 600; // 基础宽度
    let additionalWidth = 0;
    
    // 计算额外宽度
    if (imageCount > 4) {
        // 每多4张图片，额外增加200px宽度，最大1000px
        additionalWidth = Math.min(300, Math.floor((imageCount - 1) / 4) * 100);
    }
    
    // 应用到模态框
    const modalContent = DOM.productModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.width = `${baseWidth + additionalWidth}px`;
        modalContent.style.maxWidth = `${baseWidth + additionalWidth}px`;
    }
    
    // 预览各个图片
    urls.forEach(url => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative bg-gray-100 border border-gray-200 rounded-lg overflow-hidden';
        imgContainer.style.aspectRatio = '1 / 1';
        
        const img = document.createElement('img');
        img.className = 'w-full h-full object-cover';
        img.alt = 'Product Image';
        img.src = url;
        
        // 处理图片加载失败
        img.onerror = () => {
            img.src = '/images/no-image.png';
            img.classList.add('object-contain', 'p-2');
        };
        
        // 处理图片加载成功
        img.onload = () => {
            if (img.naturalWidth < img.naturalHeight) {
                img.classList.add('object-contain', 'p-1');
            }
        };
        
        imgContainer.appendChild(img);
        DOM.imagePreviewsGrid.appendChild(imgContainer);
    });
    
    // 根据图片数量调整网格列数
    const columns = Math.min(4, Math.max(2, Math.min(urls.length, 4)));
    DOM.imagePreviewsGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    
    // 显示预览区域
    DOM.imagePreviewContainer.classList.remove('hidden');
}

/**
 * 更新分页控件
 */
function updatePagination() {
    // 更新页码按钮
    updatePageNumbers();
    
    // 更新分页信息
    const startItem = ((currentPage - 1) * itemsPerPage) + 1;
    const endItem = Math.min(currentPage * itemsPerPage, filteredPhones.length);
    const totalItems = filteredPhones.length;
    
    const paginationCount = DOM.paginationCount;
    if (paginationCount) {
        paginationCount.textContent = `显示 ${startItem}-${endItem} 共 ${totalItems} 件商品`;
    }
    
    // 更新前后翻页按钮状态
    if (DOM.prevPageBtn) {
        if (currentPage <= 1) {
            DOM.prevPageBtn.classList.add('disabled');
            DOM.prevPageBtn.setAttribute('tabindex', '-1'); // 防止TAB选中禁用的按钮
        } else {
            DOM.prevPageBtn.classList.remove('disabled');
            DOM.prevPageBtn.removeAttribute('tabindex');
        }
    }
    
    if (DOM.nextPageBtn) {
        if (currentPage >= totalPages) {
            DOM.nextPageBtn.classList.add('disabled');
            DOM.nextPageBtn.setAttribute('tabindex', '-1'); // 防止TAB选中禁用的按钮
        } else {
            DOM.nextPageBtn.classList.remove('disabled');
            DOM.nextPageBtn.removeAttribute('tabindex');
        }
    }
}

/**
 * 更新页码按钮
 */
function updatePageNumbers() {
    const paginationNumbers = DOM.paginationNumbers;
    if (!paginationNumbers) return;
    
    // 清空页码区域
    paginationNumbers.innerHTML = '';
    
    // 创建单个页码显示框
    const pageDisplay = document.createElement('div');
    pageDisplay.className = 'pagination-button active';
    pageDisplay.textContent = currentPage;
    pageDisplay.setAttribute('data-page', currentPage);
    
    // 添加到页码容器
    paginationNumbers.appendChild(pageDisplay);
    
    // 不再显示总页数
}

/**
 * 跳转到指定页
 * @param {number} page - 页码
 */
function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    // 设置新的当前页
    currentPage = page;
    
    // 重新显示当前页数据
    displayProducts(filteredPhones);
    
    // 滚动到表格顶部
    const tableContainer = document.querySelector('.overflow-x-auto');
    if (tableContainer) {
        tableContainer.scrollTop = 0;
    }
}

/**
 * 前一页
 */
function prevPage() {
    if (currentPage > 1) {
        goToPage(currentPage - 1);
    }
}

/**
 * 后一页
 */
function nextPage() {
    if (currentPage < totalPages) {
        goToPage(currentPage + 1);
    }
}

// 初始化函数 - 在页面加载完成后调用
document.addEventListener('DOMContentLoaded', function() {
    // 初始化事件监听器
    setupEventListeners();
    
    // 加载产品统计
    loadProductStats();
});

/**
 * 格式化价格
 * @param {number} price - 价格
 * @returns {string} 格式化后的价格
 */
function formatPrice(price) {
    return (price || 0).toLocaleString('zh-CN', {
        style: 'currency',
        currency: 'CNY',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

/**
 * 获取商品状态标签
 * @param {string} status - 商品状态
 * @returns {string} HTML标签字符串
 */
function getStatusBadge(status) {
    switch(status) {
        case 'sold':
            return '<span class="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">已售</span>';
        case 'reserved':
            return '<span class="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">预定中</span>';
        case 'available':
            return '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">在售</span>';
        default:
            return '<span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">在售</span>';
    }
}

/**
 * 显示产品图片
 * @param {Object} product - 产品对象
 */
function displayProductImages(product) {
    if (!product || !product.images || !Array.isArray(product.images) || product.images.length === 0) {
        return;
    }
    
    const imageUrls = product.images.filter(url => url && (url.startsWith('http') || url.startsWith('/')));
    
    if (imageUrls.length === 0) {
        return;
    }
    
    // 确保预览容器存在
    if (!DOM.imagePreviewContainer || !DOM.imagePreviewsGrid) {
        return;
    }
    
    // 清空预览区域
    DOM.imagePreviewsGrid.innerHTML = '';
    
    // 根据图片数量调整模态框宽度
    const imageCount = imageUrls.length;
    const baseWidth = 600; // 基础宽度
    let additionalWidth = 0;
    
    // 计算额外宽度
    if (imageCount > 4) {
        // 每多4张图片，额外增加100px宽度，最大900px
        additionalWidth = Math.min(300, Math.floor((imageCount - 1) / 4) * 100);
    }
    
    // 应用到模态框
    const modalContent = DOM.productModal.querySelector('.modal-content');
    if (modalContent) {
        modalContent.style.width = `${baseWidth + additionalWidth}px`;
        modalContent.style.maxWidth = `${baseWidth + additionalWidth}px`;
    }
    
    // 预览各个图片
    imageUrls.forEach(url => {
        const imgContainer = document.createElement('div');
        imgContainer.className = 'relative bg-gray-100 border border-gray-200 rounded-lg overflow-hidden';
        imgContainer.style.aspectRatio = '1 / 1';
        
        const img = document.createElement('img');
        img.className = 'w-full h-full object-cover';
        img.alt = 'Product Image';
        img.src = url;
        
        // 处理图片加载失败
        img.onerror = () => {
            img.src = '/images/no-image.png';
            img.classList.add('object-contain', 'p-2');
        };
        
        imgContainer.appendChild(img);
        DOM.imagePreviewsGrid.appendChild(imgContainer);
    });
    
    // 根据图片数量调整网格列数
    const columns = Math.min(4, Math.max(2, Math.min(imageUrls.length, 4)));
    DOM.imagePreviewsGrid.style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
    
    // 显示预览区域
    DOM.imagePreviewContainer.classList.remove('hidden');
}

/**
 * 提交商品表单
 */
function submitProductForm() {
    // 检查表单是否存在
    if (!DOM.productForm) {
        showToast('找不到商品表单', 'error');
        return;
    }
    
    // 触发表单提交事件
    const submitEvent = new Event('submit', { cancelable: true });
    DOM.productForm.dispatchEvent(submitEvent);
}

/**
 * 处理图片粘贴事件
 * @param {Event} e - 粘贴事件
 */
function handleImagePaste(e) {
    setTimeout(() => {
        previewProductImages({ target: DOM.productImages });
    }, 100);
}

/**
 * 更新Logo状态
 * @param {string} logoUrl - Logo的URL
 */
function updateLogoStatus(logoUrl) {
    const logoStatusText = document.getElementById('logoStatusText');
    if (!logoStatusText) return;
    
    if (logoUrl) {
        logoStatusText.textContent = '已设置';
        logoStatusText.className = 'text-green-500';
    } else {
        logoStatusText.textContent = '未设置';
        logoStatusText.className = 'text-gray-500';
    }
}

/**
 * 更新Favicon状态
 * @param {string} faviconUrl - Favicon的URL
 */
function updateFaviconStatus(faviconUrl) {
    const faviconStatusText = document.getElementById('faviconStatusText');
    const favicon = document.getElementById('favicon');
    
    if (faviconUrl && favicon) {
        favicon.href = faviconUrl;
    }
    
    if (!faviconStatusText) return;
    
    if (faviconUrl) {
        faviconStatusText.textContent = '已设置';
        faviconStatusText.className = 'text-green-500';
    } else {
        faviconStatusText.textContent = '未设置';
        faviconStatusText.className = 'text-gray-500';
    }
}

/**
 * 更新设置状态
 * @param {Object} data - 设置数据
 */
function updateSettingsStatus(data) {
    const settingsStatus = document.getElementById('settingsStatus');
    if (!settingsStatus) return;
    
    // 检查所有必要的设置是否都已配置
    const hasTitle = !!data.title;
    const hasLogo = !!data.logo;
    const hasFavicon = !!data.favicon;
    
    if (hasTitle && hasLogo && hasFavicon) {
        settingsStatus.textContent = '已完成';
        settingsStatus.className = 'text-sm font-medium text-green-500 text-right ml-2';
    } else if (!hasTitle && !hasLogo && !hasFavicon) {
        settingsStatus.textContent = '未配置';
        settingsStatus.className = 'text-sm font-medium text-red-500 text-right ml-2';
    } else {
        settingsStatus.textContent = '部分配置';
        settingsStatus.className = 'text-sm font-medium text-yellow-500 text-right ml-2';
    }
}
