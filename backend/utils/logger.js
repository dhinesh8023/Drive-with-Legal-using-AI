const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logStream = fs.createWriteStream(path.join(logDir, 'system.log'), { flags: 'a' });

const formatMessage = (level, message, meta = {}) => {
  const timestamp = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}\n`;
};

const logger = {
  info: (msg, meta) => {
    const log = formatMessage('INFO', msg, meta);
    console.log(`\x1b[36m[INFO]\x1b[0m ${msg}`);
    logStream.write(log);
  },
  warn: (msg, meta) => {
    const log = formatMessage('WARN', msg, meta);
    console.warn(`\x1b[33m[WARN]\x1b[0m ${msg}`);
    logStream.write(log);
  },
  error: (msg, meta) => {
    const log = formatMessage('ERROR', msg, meta);
    console.error(`\x1b[31m[ERROR]\x1b[0m ${msg}`);
    logStream.write(log);
  },
  audit: (actor, action, details) => {
    const log = formatMessage('AUDIT', `${actor} -> ${action}`, details);
    console.log(`\x1b[32m[AUDIT]\x1b[0m [${actor}] ${action}`);
    logStream.write(log);
  },
};

module.exports = logger;
