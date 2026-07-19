const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static frontend assets
app.use(express.static(__dirname));

// Helper to read database safely
function readDB() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2), 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading database.json:", err);
    return [];
  }
}

// Helper to write database safely
function writeDB(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Error writing database.json:", err);
    return false;
  }
}

// REST API Endpoints

// 1. Health Check
app.get('/api/health', (req, res) => {
  const db = readDB();
  res.json({ status: 'ok', count: db.length, timestamp: new Date().toISOString() });
});

// 2. Get All Submissions (Organiser & Student Sync)
app.get('/api/results', (req, res) => {
  const db = readDB();
  res.json(db);
});

// 3. Submit or Update a Candidate Result
app.post('/api/results', (req, res) => {
  const newRecord = req.body;
  if (!newRecord || !newRecord.regId) {
    return res.status(400).json({ error: 'Invalid record: regId is required' });
  }

  const db = readDB();
  const index = db.findIndex(r => r.regId === newRecord.regId);

  if (index !== -1) {
    // Update existing student record
    db[index] = { ...db[index], ...newRecord, timestamp: Date.now() };
  } else {
    // Add new student record
    db.push({ ...newRecord, timestamp: Date.now() });
  }

  if (writeDB(db)) {
    res.json({ success: true, count: db.length, record: newRecord });
  } else {
    res.status(500).json({ error: 'Failed to write to database' });
  }
});

// 4. Batch Sync / Bulk Merge
app.post('/api/results/sync', (req, res) => {
  const incomingList = req.body;
  if (!Array.isArray(incomingList)) {
    return res.status(400).json({ error: 'Payload must be an array of candidate records' });
  }

  const db = readDB();
  const map = new Map();

  db.forEach(r => { if (r && r.regId) map.set(r.regId, r); });
  incomingList.forEach(r => {
    if (!r || !r.regId) return;
    const existing = map.get(r.regId);
    if (!existing) {
      map.set(r.regId, r);
    } else {
      if (r.status === 'Completed' && existing.status !== 'Completed') {
        map.set(r.regId, r);
      } else if (r.status === existing.status && (r.timestamp || 0) >= (existing.timestamp || 0)) {
        map.set(r.regId, r);
      }
    }
  });

  const merged = Array.from(map.values());
  if (writeDB(merged)) {
    res.json({ success: true, count: merged.length, data: merged });
  } else {
    res.status(500).json({ error: 'Failed to save merged database' });
  }
});

// 5. Delete Candidate Submission (Organiser action)
app.delete('/api/results/:regId', (req, res) => {
  const { regId } = req.params;
  let db = readDB();
  const initialLength = db.length;
  db = db.filter(r => r.regId !== regId);

  if (writeDB(db)) {
    res.json({ success: true, deleted: initialLength - db.length, count: db.length });
  } else {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// 6. Reset Database (Organiser action)
app.post('/api/results/reset', (req, res) => {
  if (writeDB([])) {
    res.json({ success: true, count: 0, message: 'Database reset successfully' });
  } else {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

// Catch-all route to serve index.html for single-page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`⚡ EEE Assessment Portal Express Backend Server`);
  console.log(`🌐 Server running at: http://localhost:${PORT}`);
  console.log(`📁 Database storage file: ${DB_FILE}`);
  console.log(`===================================================`);
});
