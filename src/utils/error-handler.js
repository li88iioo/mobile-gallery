/**
 * 自定义错误类
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true; // 标记为可操作的错误
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 处理404错误
 */
const handle404 = (req, res, next) => {
    console.log(`404 - Not Found: ${req.method} ${req.url}`);
    if (req.accepts('json')) {
        res.status(404).json({ 
            error: `Not Found: ${req.method} ${req.url}`,
            errorCode: 'RESOURCE_NOT_FOUND'
        });
    } else {
        res.status(404).send(`Not Found: ${req.method} ${req.url}`);
    }
};

/**
 * 全局错误处理中间件
 */
const globalErrorHandler = (err, req, res, next) => {
    // 默认错误状态和消息
    let statusCode = err.statusCode || 500;
    let errorMessage = err.message || 'Internal Server Error';
    let errorCode = err.errorCode || 'INTERNAL_ERROR';
    
    // 合并错误信息
    const errorDetails = {
        message: errorMessage,
        code: errorCode,
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
    };
    
    // 记录错误 - 只在生产环境记录简化版本，开发环境记录完整堆栈
    console.error(`[ERROR] ${errorDetails.method} ${errorDetails.path} - ${statusCode}:`, 
        process.env.NODE_ENV === 'development' 
            ? { ...errorDetails, stack: err.stack } 
            : errorDetails
    );
    
    // 开发环境下返回更多错误信息
    if (process.env.NODE_ENV === 'development') {
        return res.status(statusCode).json({
            error: errorMessage,
            errorCode,
            stack: err.stack,
            details: errorDetails
        });
    }
    
    // 生产环境只返回有限信息
    res.status(statusCode).json({
        error: errorMessage,
        errorCode
    });
};

/**
 * 异步函数错误捕获包装器
 */
const catchAsync = (fn) => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};

module.exports = {
    AppError,
    handle404,
    globalErrorHandler,
    catchAsync
}; 