const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render/Cloudflare to get real client IP
app.set('trust proxy', true);

app.use(express.json());
// Serve static from both 'public' folder and root
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

// Explicit route for homepage
app.get('/', (req, res) => {
  const publicPath = path.join(__dirname, 'public', 'index.html');
  const rootPath = path.join(__dirname, 'index.html');

  if (fs.existsSync(publicPath)) {
    return res.sendFile(publicPath);
  } else if (fs.existsSync(rootPath)) {
    return res.sendFile(rootPath);
  } else {
    res.status(404).send('<h2>⚠️ Chưa tìm thấy file index.html!</h2><p>Hãy đảm bảo bạn đã tải file <code>index.html</code> lên repository GitHub.</p>');
  }
});

// In-memory state
let state = {
  min: 1,
  max: 100,
  adminPassword: 'admin123', // Change this!
  history: [],               // { number, pickedBy, timestamp }
  pickedNames: new Set(),    // track names that already picked
  pickedNumbers: new Map(),  // number -> playerName (mỗi số chỉ 1 người chọn)
  pickedIps: new Map(),      // ip -> { name, number } (1 IP chỉ 1 lượt)
  limitByIp: true,           // Bật/tắt giới hạn theo IP
  deadline: null,            // ISO string e.g. "2026-11-02T20:30"
  isLocked: false,           // boolean manual lock
  latestAdminSpin: null,     // { id, number, startedAt, durationMs }
};

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

function checkIsExpired() {
  if (state.isLocked) return true;
  if (state.deadline && new Date() > new Date(state.deadline)) return true;
  return false;
}

// Get current range and status (public)
app.get('/api/range', (req, res) => {
  res.json({
    min: state.min,
    max: state.max,
    deadline: state.deadline,
    isLocked: state.isLocked,
    isExpired: checkIsExpired(),
    latestAdminSpin: state.latestAdminSpin,
    takenNumbers: Array.from(state.pickedNumbers.keys()),
    limitByIp: state.limitByIp,
    serverTime: new Date().toISOString()
  });
});

// Admin: toggle IP limit
app.post('/api/admin/ip-limit', (req, res) => {
  const { password, limitByIp } = req.body;
  if (password !== state.adminPassword) {
    return res.status(403).json({ error: 'Sai mật khẩu admin!' });
  }
  state.limitByIp = !!limitByIp;
  res.json({ success: true, limitByIp: state.limitByIp });
});

// Admin: set deadline or lock
app.post('/api/admin/deadline', (req, res) => {
  const { password, deadline, isLocked } = req.body;
  if (password !== state.adminPassword) {
    return res.status(403).json({ error: 'Sai mật khẩu admin!' });
  }
  if (deadline !== undefined) state.deadline = deadline ? new Date(deadline).toISOString() : null;
  if (isLocked !== undefined) state.isLocked = !!isLocked;
  res.json({
    success: true,
    deadline: state.deadline,
    isLocked: state.isLocked,
    isExpired: checkIsExpired()
  });
});

// Admin: update range
app.post('/api/admin/range', (req, res) => {
  const { min, max, password } = req.body;
  if (password !== state.adminPassword) {
    return res.status(403).json({ error: 'Sai mật khẩu admin!' });
  }
  if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
    return res.status(400).json({ error: 'Min phải nhỏ hơn Max!' });
  }
  state.min = min;
  state.max = max;
  state.history = []; // reset history when range changes
  state.pickedNames.clear(); // reset picked names too
  state.pickedNumbers.clear(); // reset taken numbers
  state.pickedIps.clear(); // reset IP records
  res.json({ success: true, min: state.min, max: state.max });
});

// Admin: reset history and picked names
app.post('/api/admin/reset', (req, res) => {
  const { password } = req.body;
  if (password !== state.adminPassword) {
    return res.status(403).json({ error: 'Sai mật khẩu admin!' });
  }
  state.history = [];
  state.pickedNames.clear();
  state.pickedNumbers.clear();
  state.pickedIps.clear();
  state.latestAdminSpin = null;
  res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử! Mọi người có thể chọn lại.' });
});

// Admin: random a number
app.post('/api/admin/random', (req, res) => {
  const { password } = req.body;
  if (password !== state.adminPassword) {
    return res.status(403).json({ error: 'Sai mật khẩu admin!' });
  }
  const num = Math.floor(Math.random() * (state.max - state.min + 1)) + state.min;
  
  // Save latest admin spin with 4s animation duration
  state.latestAdminSpin = {
    id: Date.now(),
    number: num,
    startedAt: Date.now(),
    durationMs: 4000
  };

  state.history.push({ number: num, pickedBy: 'Admin', timestamp: new Date().toISOString() });
  res.json({ number: num, latestAdminSpin: state.latestAdminSpin });
});

// User: pick a specific number
app.post('/api/pick', (req, res) => {
  if (checkIsExpired()) {
    return res.status(400).json({ error: '⛔ Đã hết thời gian chọn số!' });
  }
  const { number, name } = req.body;
  const playerName = (name || '').trim();
  const clientIp = getClientIp(req);

  if (!playerName) {
    return res.status(400).json({ error: 'Vui lòng nhập tên của bạn!' });
  }

  // 1. Kiểm tra giới hạn theo IP
  if (state.limitByIp && state.pickedIps.has(clientIp)) {
    const prev = state.pickedIps.get(clientIp);
    return res.status(400).json({
      error: `Thiết bị / Mạng này đã chọn số rồi! (Tài khoản "${prev.name}" đã chọn số ${prev.number}). Mỗi IP chỉ được chọn 1 lần.`
    });
  }

  // 2. Kiểm tra tên người chơi
  if (state.pickedNames.has(playerName.toLowerCase())) {
    return res.status(400).json({ error: `"${playerName}" đã chọn số rồi! Mỗi người chỉ được chọn 1 lần.` });
  }
  if (typeof number !== 'number' || number < state.min || number > state.max) {
    return res.status(400).json({ error: `Số phải nằm trong khoảng ${state.min} - ${state.max}!` });
  }

  // 3. Kiểm tra xem số đã có người khác chọn trước chưa
  if (state.pickedNumbers.has(number)) {
    const owner = state.pickedNumbers.get(number);
    return res.status(400).json({
      error: `Số ${number} đã được "${owner}" chọn trước rồi! Bạn hãy đổi số khác nhé.`,
      numberTaken: true
    });
  }

  state.pickedNames.add(playerName.toLowerCase());
  state.pickedNumbers.set(number, playerName);
  if (state.limitByIp) {
    state.pickedIps.set(clientIp, { name: playerName, number });
  }
  state.history.push({ number, pickedBy: playerName, timestamp: new Date().toISOString() });
  res.json({ success: true, number, pickedBy: playerName });
});

// User: random a number within range (chỉ random trong các số CHƯA có ai chọn)
app.post('/api/random', (req, res) => {
  if (checkIsExpired()) {
    return res.status(400).json({ error: '⛔ Đã hết thời gian chọn số!' });
  }
  const { name } = req.body;
  const playerName = (name || '').trim();
  const clientIp = getClientIp(req);

  if (!playerName) {
    return res.status(400).json({ error: 'Vui lòng nhập tên của bạn!' });
  }

  // 1. Kiểm tra giới hạn theo IP
  if (state.limitByIp && state.pickedIps.has(clientIp)) {
    const prev = state.pickedIps.get(clientIp);
    return res.status(400).json({
      error: `Thiết bị / Mạng này đã chọn số rồi! (Tài khoản "${prev.name}" đã chọn số ${prev.number}). Mỗi IP chỉ được chọn 1 lần.`
    });
  }

  // 2. Kiểm tra tên
  if (state.pickedNames.has(playerName.toLowerCase())) {
    return res.status(400).json({ error: `"${playerName}" đã chọn số rồi! Mỗi người chỉ được chọn 1 lần.` });
  }

  // Lọc ra danh sách các số chưa bị ai chọn
  const freeNumbers = [];
  for (let i = state.min; i <= state.max; i++) {
    if (!state.pickedNumbers.has(i)) {
      freeNumbers.push(i);
    }
  }

  if (freeNumbers.length === 0) {
    return res.status(400).json({ error: 'Đã hết số trống trong phạm vi này!' });
  }

  const num = freeNumbers[Math.floor(Math.random() * freeNumbers.length)];
  state.pickedNames.add(playerName.toLowerCase());
  state.pickedNumbers.set(num, playerName);
  if (state.limitByIp) {
    state.pickedIps.set(clientIp, { name: playerName, number: num });
  }
  state.history.push({ number: num, pickedBy: playerName, timestamp: new Date().toISOString() });
  res.json({ number: num, pickedBy: playerName });
});

// Get history
app.get('/api/history', (req, res) => {
  res.json(state.history.slice(-50).reverse());
});

app.listen(PORT, () => {
  console.log(`🎲 Random Picker đang chạy tại http://localhost:${PORT}`);
});
