// 管理员凭据配置
const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// 初始化密码显示/隐藏功能
function initPasswordToggle() {
    // 密码显示/隐藏切换
    const togglePasswordBtn = document.getElementById('togglePassword');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('password');
            const eyeIcon = this.querySelector('i');
            
            // 切换密码字段类型
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                passwordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }
    
    // 确认密码显示/隐藏切换
    const toggleConfirmPasswordBtn = document.getElementById('toggleConfirmPassword');
    if (toggleConfirmPasswordBtn) {
        toggleConfirmPasswordBtn.addEventListener('click', function() {
            const confirmPasswordInput = document.getElementById('confirmPassword');
            const eyeIcon = this.querySelector('i');
            
            // 切换密码字段类型
            if (confirmPasswordInput.type === 'password') {
                confirmPasswordInput.type = 'text';
                eyeIcon.classList.remove('fa-eye');
                eyeIcon.classList.add('fa-eye-slash');
            } else {
                confirmPasswordInput.type = 'password';
                eyeIcon.classList.remove('fa-eye-slash');
                eyeIcon.classList.add('fa-eye');
            }
        });
    }
    
    // 如果存在确认密码字段但没有切换按钮，添加切换功能
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput && !document.getElementById('toggleConfirmPassword')) {
        // 检查是否已经有父容器
        let inputParent = confirmPasswordInput.parentElement;
        if (!inputParent.classList.contains('relative')) {
            // 创建相对定位的容器
            const container = document.createElement('div');
            container.className = 'relative';
            
            // 替换原输入框
            confirmPasswordInput.parentNode.insertBefore(container, confirmPasswordInput);
            container.appendChild(confirmPasswordInput);
            inputParent = container;
        }
        
        // 检查是否已经有按钮
        if (!inputParent.querySelector('.password-toggle')) {
            // 创建并添加密码切换按钮
            const toggleBtn = document.createElement('button');
            toggleBtn.type = 'button';
            toggleBtn.className = 'password-toggle';
            toggleBtn.id = 'toggleConfirmPassword';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i>';
            inputParent.appendChild(toggleBtn);
            
            // 添加切换功能
            toggleBtn.addEventListener('click', function() {
                const eyeIcon = this.querySelector('i');
                
                if (confirmPasswordInput.type === 'password') {
                    confirmPasswordInput.type = 'text';
                    eyeIcon.classList.remove('fa-eye');
                    eyeIcon.classList.add('fa-eye-slash');
                } else {
                    confirmPasswordInput.type = 'password';
                    eyeIcon.classList.remove('fa-eye-slash');
                    eyeIcon.classList.add('fa-eye');
                }
            });
        }
    }
}

// 检查是否首次登录
function isFirstLogin() {
    return !localStorage.getItem('passwordChanged');
}

// 显示密码修改表单
function showChangePasswordForm() {
    const loginForm = document.getElementById('loginForm');
    loginForm.innerHTML = `
        <div>
            <label class="block text-gray-700 mb-2">新密码</label>
            <input type="password" id="newPassword" class="w-full p-2 border rounded" required>
        </div>
        <div>
            <label class="block text-gray-700 mb-2">确认新密码</label>
            <input type="password" id="confirmPassword" class="w-full p-2 border rounded" required>
        </div>
        <div id="errorMessage" class="text-red-500 text-center hidden"></div>
        <button type="submit" class="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4">
            修改密码
        </button>
    `;

    loginForm.onsubmit = function(e) {
        e.preventDefault();
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        const errorMessage = document.getElementById('errorMessage');

        if (newPassword !== confirmPassword) {
            errorMessage.textContent = '两次输入的密码不一致';
            errorMessage.classList.remove('hidden');
            return;
        }

        if (newPassword.length < 6) {
            errorMessage.textContent = '密码长度至少6位';
            errorMessage.classList.remove('hidden');
            return;
        }

        // 保存新密码
        localStorage.setItem('adminPassword', btoa(newPassword)); // 简单加密
        localStorage.setItem('passwordChanged', 'true');
        
        // 登录成功
        sessionStorage.setItem('isLoggedIn', 'true');
        window.location.href = '/admin';
    };
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

// 加载网站设置
async function loadSiteSettings() {
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const settings = await response.json();
            
            // 设置网站标题
            if (settings.title) {
                document.title = `登录 - ${settings.title}`;
            }
            
            // 设置网站图标
            if (settings.favicon) {
                const faviconElement = document.getElementById('favicon');
                if (faviconElement) {
                    faviconElement.href = settings.favicon;
                }
            }
        }
    } catch (error) {
        console.error('加载网站设置失败:', error);
    }
}

// 更新登录处理逻辑，使用Toast通知
document.addEventListener('DOMContentLoaded', async () => {
    try {
        // 检查管理员是否已配置
        const configResponse = await fetch('/api/config/check-admin');
        const configData = await configResponse.json();
        
        if (!configData.configured) {
            // 设置初始密码模式 - 更新表单以包含确认密码字段
            const loginForm = document.getElementById('loginForm');
            const pageTitle = document.querySelector('h1');
            if (pageTitle) {
                pageTitle.textContent = '创建管理员账号';
            }
            
            loginForm.innerHTML = `
                <div class="text-center mb-4 text-blue-600">
                    <p>首次访问系统，请创建管理员账号</p>
                </div>
                <div>
                    <label for="username" class="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                    <input type="text" id="username" name="username" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500" value="admin">
                </div>
                <div>
                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">密码</label>
                    <div class="relative">
                        <input type="password" id="password" name="password" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                        <button type="button" id="togglePassword" class="password-toggle">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div>
                    <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                    <div class="relative">
                        <input type="password" id="confirmPassword" name="confirmPassword" class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500">
                        <button type="button" id="toggleConfirmPassword" class="password-toggle">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div id="errorMessage" class="text-red-500 text-center hidden"></div>
                <div>
                    <button type="submit" class="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200">创建账号</button>
                </div>
                <div class="text-center text-sm text-gray-500 mt-2">
                    <p>创建后将自动登录到管理后台</p>
                </div>
            `;
            
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const confirmPasswordInput = document.getElementById('confirmPassword');
            
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const newPassword = passwordInput.value;
                const confirmPassword = confirmPasswordInput.value;
                
                if (confirmPassword !== newPassword) {
                    showToast('两次输入的密码不一致', 'error');
                    return;
                }
                
                if (newPassword.length < 6) {
                    showToast('密码长度至少6位', 'warning');
                    return;
                }
                
                try {
                    const response = await fetch('/api/config/set-admin', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: usernameInput.value,
                            password: newPassword
                        })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        showToast('管理员账号创建成功！', 'success');
                        setTimeout(() => {
                            window.location.href = '/admin';
                        }, 1500);
                    } else {
                        showToast(data.error || '创建账号失败', 'error');
                    }
                } catch (error) {
                    console.error('创建账号错误:', error);
                    showToast('网络错误，请稍后重试', 'error');
                }
            });
            
            // 初始化密码显示/隐藏功能
            setTimeout(() => initPasswordToggle(), 100);
        } else {
            // 正常登录模式
            const loginForm = document.getElementById('loginForm');
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            
            loginForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                try {
                    const response = await fetch('/api/login', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            username: usernameInput.value,
                            password: passwordInput.value
                        })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        showToast('登录成功！', 'success');
                        setTimeout(() => {
                            window.location.href = '/admin';
                        }, 1000);
                    } else {
                        showToast(data.error || '登录失败', 'error');
                    }
                } catch (error) {
                    console.error('登录错误:', error);
                    showToast('网络错误，请稍后重试', 'error');
                }
            });
        }
    } catch (error) {
        console.error('初始化登录页面错误:', error);
        showToast('加载页面失败，请刷新重试', 'error');
    }
});

// 页面加载时检查登录状态
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/check-auth', {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.isLoggedIn) {
            // 如果已登录，直接跳转到管理页面
            window.location.href = '/admin';
        }
    } catch (error) {
        console.error('检查登录状态失败:', error);
    }
});

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 加载网站设置
    loadSiteSettings();
    
    // 绑定登录表单事件
    document.getElementById('loginForm').addEventListener('submit', function(e) {
        // existing login form code...
    });
    
    // 初始化密码显示/隐藏功能
    initPasswordToggle();
});