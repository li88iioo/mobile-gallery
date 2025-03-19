// 管理员凭据配置
const DEFAULT_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

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

// 登录表单处理
document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    
    console.log('尝试登录:', { username }); // 添加日志
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
            credentials: 'include'
        });

        console.log('登录响应状态:', response.status); // 添加日志
        
        const data = await response.json();
        console.log('登录响应数据:', data); // 添加日志
        
        if (response.ok && data.success) {
            console.log('登录成功，准备跳转'); // 添加日志
            window.location.replace('/admin');
        } else {
            console.log('登录失败:', data.error); // 添加日志
            errorMessage.textContent = data.error || '登录失败';
            errorMessage.classList.remove('hidden');
        }
    } catch (error) {
        console.error('登录请求失败:', error);
        errorMessage.textContent = '网络错误，请稍后重试';
        errorMessage.classList.remove('hidden');
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