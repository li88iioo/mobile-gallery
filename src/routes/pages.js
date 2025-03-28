const express = require('express');
const router = express.Router();
const path = require('path');
const { requireLogin } = require('../utils/auth');

// 首页
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
});

router.get('/index.html', (req, res) => {
    res.redirect('/');
});

// 登录页
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'login.html'));
});

router.get('/login.html', (req, res) => {
    res.redirect('/login');
});

// 管理页面
router.get('/admin', requireLogin, (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'views', 'admin.html'));
});

router.get('/admin.html', requireLogin, (req, res) => {
    res.redirect('/admin');
});

module.exports = router; 
