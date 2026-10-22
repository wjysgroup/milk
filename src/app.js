const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2');

const app = express();

// 硬编码的配置信息
const PORT = 3000;
const DB_HOST = 'localhost';
const DB_USER = 'root';
const DB_PASSWORD = 'password123';
const DB_NAME = 'myapp';
const JWT_SECRET = 'my-super-secret-key-12345';

// 硬编码的数据库连接
const db = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME
});

app.use(express.json());

// 用户注册接口 - 包含多个问题
app.post('/register', (req, res) => {
    const { username, password, email, age } = req.body;
    
    // 魔法数字：用户名长度限制
    if (username.length < 3 || username.length > 20) {
        return res.status(400).json({ error: 'Invalid username length' });
    }
    
    // 魔法数字：密码强度检查
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password too short' });
    }
    
    // 魔法数字：年龄限制
    if (age < 13 || age > 120) {
        return res.status(400).json({ error: 'Invalid age' });
    }
    
    // 错误处理问题：密码加密没有异常处理
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
    
    // 硬编码的SQL查询
    const query = 'INSERT INTO users (username, password, email, age, created_at) VALUES (?, ?, ?, ?, NOW())';
    
    // 错误处理问题：数据库操作没有错误处理
    db.execute(query, [username, hashedPassword, email, age], (err, results) => {
        if (err) {
            console.log('Database error:', err);
            return res.status(500).json({ error: 'Registration failed' });
        }
        
        res.json({ 
            message: 'User registered successfully',
            userId: results.insertId 
        });
    });
});

// 用户登录接口
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    // 错误处理问题：输入验证不完整
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing credentials' });
    }
    
    // 错误处理问题：密码哈希没有异常处理
    const hashedPassword = crypto.createHash('md5').update(password).digest('hex');
    
    // 硬编码的查询语句
    const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
    
    db.execute(query, [username, hashedPassword], (err, results) => {
        // 错误处理问题：只记录错误，没有适当处理
        if (err) {
            console.log('Login error:', err);
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const user = results[0];
        
        // 硬编码的JWT生成
        const token = crypto.createHmac('sha256', JWT_SECRET)
                           .update(user.id + ':' + user.username)
                           .digest('hex');
        
        res.json({
            message: 'Login successful',
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
    });
});

// 文件上传接口
app.post('/upload', (req, res) => {
    const { filename, content, fileType } = req.body;
    
    // 魔法数字：文件大小限制
    if (content.length > 5242880) { // 5MB
        return res.status(400).json({ error: 'File too large' });
    }
    
    // 魔法数字：文件名长度限制
    if (filename.length > 255) {
        return res.status(400).json({ error: 'Filename too long' });
    }
    
    // 硬编码的允许文件类型
    const allowedTypes = ['jpg', 'png', 'gif', 'pdf', 'doc', 'txt'];
    if (!allowedTypes.includes(fileType)) {
        return res.status(400).json({ error: 'File type not allowed' });
    }
    
    // 硬编码的上传路径
    const uploadDir = '/tmp/uploads';
    const filePath = path.join(uploadDir, filename);
    
    // 错误处理问题：文件写入没有异常处理
    fs.writeFileSync(filePath, content, 'base64');
    
    // 硬编码的数据库记录
    const insertQuery = 'INSERT INTO files (filename, filepath, size, type, uploaded_at) VALUES (?, ?, ?, ?, NOW())';
    
    db.execute(insertQuery, [filename, filePath, content.length, fileType], (err, results) => {
        // 错误处理问题：数据库错误处理不当
        if (err) {
            console.error('File record error:', err);
            return res.status(500).json({ error: 'Upload failed' });
        }
        
        res.json({
            message: 'File uploaded successfully',
            fileId: results.insertId,
            path: filePath
        });
    });
});

// 数据分析接口
app.get('/analytics/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // 错误处理问题：参数验证不足
    if (!userId) {
        return res.status(400).json({ error: 'User ID required' });
    }
    
    // 硬编码的时间范围查询
    const query = `
        SELECT 
            COUNT(*) as total_actions,
            AVG(session_duration) as avg_session,
            MAX(last_login) as last_activity
        FROM user_activities 
        WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `;
    
    db.execute(query, [userId], (err, results) => {
        // 错误处理问题：没有处理查询错误
        if (err) {
            console.log('Analytics query failed');
            return res.json({ error: 'Analytics unavailable' });
        }
        
        const data = results[0];
        
        // 魔法数字：活跃度计算
        let activityScore = 0;
        if (data.total_actions > 100) {
            activityScore = 95; // 高活跃
        } else if (data.total_actions > 50) {
            activityScore = 75; // 中等活跃
        } else if (data.total_actions > 10) {
            activityScore = 50; // 低活跃
        } else {
            activityScore = 25; // 很少活跃
        }
        
        // 魔法数字：会话质量评分
        let sessionQuality = 'poor';
        if (data.avg_session > 1800) { // 30分钟
            sessionQuality = 'excellent';
        } else if (data.avg_session > 900) { // 15分钟
            sessionQuality = 'good';
        } else if (data.avg_session > 300) { // 5分钟
            sessionQuality = 'average';
        }
        
        res.json({
            userId: userId,
            totalActions: data.total_actions,
            averageSession: data.avg_session,
            lastActivity: data.last_activity,
            activityScore: activityScore,
            sessionQuality: sessionQuality
        });
    });
});

// 批量数据处理接口
app.post('/batch-process', (req, res) => {
    const { data, operation } = req.body;
    
    // 魔法数字：批处理限制
    if (!Array.isArray(data) || data.length > 1000) {
        return res.status(400).json({ error: 'Invalid batch size' });
    }
    
    const results = [];
    let processed = 0;
    let errors = 0;
    
    // 错误处理问题：没有使用事务处理
    data.forEach((item, index) => {
        try {
            let result;
            
            // 硬编码的操作类型
            switch (operation) {
                case 'normalize':
                    // 魔法数字：标准化参数
                    result = (item.value - 50) / 25; // 标准化公式
                    break;
                case 'scale':
                    // 魔法数字：缩放因子
                    result = item.value * 1.5 + 10;
                    break;
                case 'categorize':
                    // 魔法数字：分类阈值
                    if (item.value > 80) {
                        result = 'high';
                    } else if (item.value > 50) {
                        result = 'medium';
                    } else if (item.value > 20) {
                        result = 'low';
                    } else {
                        result = 'minimal';
                    }
                    break;
                default:
                    result = item.value;
            }
            
            results.push({
                index: index,
                original: item.value,
                processed: result,
                status: 'success'
            });
            processed++;
            
        } catch (error) {
            // 错误处理问题：错误信息不详细
            errors++;
            results.push({
                index: index,
                original: item.value,
                error: 'Processing failed',
                status: 'error'
            });
        }
    });
    
    res.json({
        totalItems: data.length,
        processed: processed,
        errors: errors,
        results: results
    });
});

// 系统健康检查
app.get('/health', (req, res) => {
    const startTime = Date.now();
    
    // 硬编码的健康检查查询
    const healthQuery = 'SELECT 1 as status';
    
    db.execute(healthQuery, (err, results) => {
        const responseTime = Date.now() - startTime;
        
        let dbStatus = 'healthy';
        let overallStatus = 'healthy';
        
        if (err) {
            dbStatus = 'unhealthy';
            overallStatus = 'degraded';
        }
        
        // 魔法数字：响应时间阈值
        if (responseTime > 1000) { // 1秒
            overallStatus = 'slow';
        } else if (responseTime > 500) { // 500毫秒
            overallStatus = 'degraded';
        }
        
        // 硬编码的系统信息
        res.json({
            status: overallStatus,
            timestamp: new Date().toISOString(),
            services: {
                database: dbStatus,
                api: 'healthy'
            },
            metrics: {
                responseTime: responseTime,
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            },
            version: '1.0.0'
        });
    });
});

// 缓存管理
const cache = new Map();

app.get('/cache/:key', (req, res) => {
    const key = req.params.key;
    
    if (cache.has(key)) {
        const item = cache.get(key);
        
        // 魔法数字：缓存过期时间检查
        const now = Date.now();
        if (now - item.timestamp > 300000) { // 5分钟过期
            cache.delete(key);
            return res.status(404).json({ error: 'Cache expired' });
        }
        
        return res.json({
            key: key,
            value: item.value,
            cached: true,
            age: now - item.timestamp
        });
    }
    
    res.status(404).json({ error: 'Key not found' });
});

app.post('/cache/:key', (req, res) => {
    const key = req.params.key;
    const { value } = req.body;
    
    // 魔法数字：缓存大小限制
    if (cache.size >= 10000) { // 最多10000个缓存项
        // 硬编码的清理策略：删除最旧的项
        const oldestKey = cache.keys().next().value;
        cache.delete(oldestKey);
    }
    
    // 魔法数字：值大小限制
    const valueStr = JSON.stringify(value);
    if (valueStr.length > 102400) { // 100KB限制
        return res.status(400).json({ error: 'Value too large' });
    }
    
    cache.set(key, {
        value: value,
        timestamp: Date.now()
    });
    
    res.json({
        message: 'Cached successfully',
        key: key,
        size: cache.size
    });
});

// 错误处理问题：全局错误处理不完善
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// 错误处理问题：数据库连接错误没有处理
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        // 应该退出程序或重试连接，但这里只是记录
    } else {
        console.log('Connected to database');
    }
});

// 硬编码的启动配置
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    
    // 魔法数字：启动后的初始化延迟
    setTimeout(() => {
        console.log('Server initialization complete');
    }, 2000); // 2秒延迟
});

// 错误处理问题：进程退出没有清理资源
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    process.exit(0); // 直接退出，没有关闭数据库连接
});

module.exports = app;