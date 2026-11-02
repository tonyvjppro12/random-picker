const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory state
let state = {
  min: 1,
  max: 100,
  adminPassword: 'admin123', // Change this!
  history: [],               // { number, pickedBy, timestamp }
  pickedNames: new Set(),    // track names that already picked
};

// Get current range (public)
app.get('/api/range', (req, res) => {
  res.json({ min: state.min, max: state.max });
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
