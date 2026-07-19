const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();

const CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019f7ad1-4db9-71e3-bf2c-afadd3850dfa';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Helper to fetch cloud database
async function getCloudDB() {
  try {
    const res = await fetch(CLOUD_DB_URL, { cache: 'no-cache' });
    if (res.ok) {
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  } catch (err) {
    console.error("Cloud DB fetch error:", err);
  }
  return [];
}

// Helper to save cloud database
async function saveCloudDB(data) {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.error("Cloud DB save error:", err);
    return false;
  }
}

// Helper to merge records
function mergeDatabaseRecords(localList, remoteList) {
  const map = new Map();
  (localList || []).forEach(r => { if (r && r.regId) map.set(r.regId, r); });
  (remoteList || []).forEach(r => {
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
  return Array.from(map.values());
}

// Routes

// 1. Health check
app.get('/api/health', async (req, res) => {
  const db = await getCloudDB();
  res.json({ status: 'ok', provider: 'Netlify Functions Backend', count: db.length, timestamp: new Date().toISOString() });
});

// 2. Get All Submissions
app.get('/api/results', async (req, res) => {
  const db = await getCloudDB();
  res.json(db);
});

// 3. Post Single Submission
app.post('/api/results', async (req, res) => {
  const newRecord = req.body;
  if (!newRecord || !newRecord.regId) {
    return res.status(400).json({ error: 'regId is required' });
  }

  const db = await getCloudDB();
  const index = db.findIndex(r => r.regId === newRecord.regId);
  if (index !== -1) {
    db[index] = { ...db[index], ...newRecord, timestamp: Date.now() };
  } else {
    db.push({ ...newRecord, timestamp: Date.now() });
  }

  const success = await saveCloudDB(db);
  if (success) {
    res.json({ success: true, count: db.length, record: newRecord });
  } else {
    res.status(500).json({ error: 'Failed to update backend database' });
  }
});

// 4. Batch Sync / Merge
app.post('/api/results/sync', async (req, res) => {
  const incomingList = req.body;
  if (!Array.isArray(incomingList)) {
    return res.status(400).json({ error: 'Payload must be an array' });
  }

  const db = await getCloudDB();
  const merged = mergeDatabaseRecords(db, incomingList);
  const success = await saveCloudDB(merged);

  if (success) {
    res.json({ success: true, count: merged.length, data: merged });
  } else {
    res.status(500).json({ error: 'Failed to save backend data' });
  }
});

// 5. Delete Submission
app.delete('/api/results/:regId', async (req, res) => {
  const { regId } = req.params;
  const db = await getCloudDB();
  const filtered = db.filter(r => r.regId !== regId);
  const success = await saveCloudDB(filtered);

  if (success) {
    res.json({ success: true, count: filtered.length });
  } else {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// 6. Reset Database
app.post('/api/results/reset', async (req, res) => {
  const success = await saveCloudDB([]);
  if (success) {
    res.json({ success: true, count: 0, message: 'Database reset successfully' });
  } else {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports.handler = serverless(app);
