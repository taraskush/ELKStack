const express = require('express');
const fs = require('fs');

const app = express();
const port = 3000;

function log(level, message, extra = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    service: 'test-logger-app',
    ...extra
  };
  console.log(JSON.stringify(logEntry));
}

app.use((req, res, next) => {
  log('info', 'HTTP Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  next();
});

app.use(express.json());

app.get('/', (req, res) => {
  log('info', 'Home page accessed');
  res.json({ message: 'Logger App is running!', timestamp: new Date().toISOString() });
});

app.post('/', (req, res) => {
  fs.writeFileSync('log.txt', JSON.stringify(req.body));
  res.status(200).send('OK');
});


app.post('/log', (req, res) => {
  const { level = 'info', message = 'Test log', extra = {} } = req.body;
  
  log(level, message, extra);
  
  res.json({ 
    success: true, 
    logged: { level, message, extra }
  });
});

app.get('/error', (req, res) => {
  try {
    throw new Error('This is a test error');
  } catch (error) {
    log('error', 'File not found', {
      error: error.message,
      stack: error.stack,
      endpoint: '/error'
    });
    
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Check the logs for details'
    });
  }
});

app.get('/jwt-error', (req, res) => {
  const jwtError = {
    userId: 12345,
    token: 'invalid_token_here',
    reason: 'Token expired',
    timestamp: new Date().toISOString()
  };
  
  console.log(`${new Date().toISOString()} [JWT USER VERIFY ERROR] ${JSON.stringify(jwtError)}`);
  
  res.status(401).json({ error: 'JWT verification failed' });
});

function generateRandomLogs() {
  const levels = ['info', 'debug', 'warn', 'error'];
  const messages = [
    'User logged in successfully',
    'Processing payment',
    'Cache miss occurred',
    'Database query executed',
    'File uploaded',
    'Email sent',
    'Session expired',
    'API rate limit exceeded'
  ];
  
  setInterval(() => {
    const level = levels[Math.floor(Math.random() * levels.length)];
    const message = messages[Math.floor(Math.random() * messages.length)];
    const userId = Math.floor(Math.random() * 1000);
    
    log(level, message, {
      userId: userId,
      sessionId: `sess_${Math.random().toString(36).substring(7)}`,
      duration: Math.floor(Math.random() * 1000),
      automatic: true
    });
  }, 1000);
}

app.listen(port, () => {
  log('info', 'Application started', {
    port: port,
    environment: process.env.NODE_ENV || 'development'
  });
  
  generateRandomLogs();
  
  log('info', 'Random log generation started');
});

process.on('SIGTERM', () => {
  log('info', 'Application shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('info', 'Application interrupted, shutting down');
  process.exit(0);
});