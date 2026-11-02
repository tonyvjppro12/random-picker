const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

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
  deadline: null,            // ISO string e.g. "2026-11-02T20:30"
  isLocked: false,           // boolean manual lock
};

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
    serverTime: new Date().toISOString()
  });
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
  res.json({ success: true, message: 'Đã xóa toàn bộ lịch sử! Mọi người có thể chọn lại.' });
});

// Admin: random a number
app.post('/api/admin/random', (req, res) => {
  const { password } = req.body;
  if (password !== state.adminPassword) {
    return res.status(403).json({ error: 'Sai mật khẩu admin!' });
  }
  const num = Math.floor(Math.random() * (state.max - state.min + 1)) + state.min;
  state.history.push({ number: num, pickedBy: 'Admin', timestamp: new Date().toISOString() });
  res.json({ number: num });
});

// User: pick a specific number
app.post('/api/pick', (req, res) => {
  if (checkIsExpired()) {
    return res.status(400).json({ error: '⛔ Đã hết thời gian chọn số!' });
  }
  const { number, name } = req.body;
  const playerName = (name || '').trim();
  if (!playerName) {
    return res.status(400).json({ error: 'Vui lòng nhập tên của bạn!' });
  }
  if (state.pickedNames.has(playerName.toLowerCase())) {
    return res.status(400).json({ error: `"${playerName}" đã chọn rồi! Mỗi người chỉ được chọn 1 lần.` });
  }
  if (typeof number !== 'number' || number < state.min || number > state.max) {
    return res.status(400).json({ error: `Số phải nằm trong khoảng ${state.min} - ${state.max}!` });
  }
  state.pickedNames.add(playerName.toLowerCase());
  state.history.push({ number, pickedBy: playerName, timestamp: new Date().toISOString() });
  res.json({ success: true, number, pickedBy: playerName });
});

// User: random a number within range
app.post('/api/random', (req, res) => {
  if (checkIsExpired()) {
    return res.status(400).json({ error: '⛔ Đã hết thời gian chọn số!' });
  }
  const { name } = req.body;
  const playerName = (name || '').trim();
  if (!playerName) {
    return res.status(400).json({ error: 'Vui lòng nhập tên của bạn!' });
  }
  if (state.pickedNames.has(playerName.toLowerCase())) {
    return res.status(400).json({ error: `"${playerName}" đã chọn rồi! Mỗi người chỉ được chọn 1 lần.` });
  }
  const num = Math.floor(Math.random() * (state.max - state.min + 1)) + state.min;
  state.pickedNames.add(playerName.toLowerCase());
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
