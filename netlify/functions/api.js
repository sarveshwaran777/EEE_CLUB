const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const app = express();
const CLOUD_DB_URL = 'https://jsonblob.com/api/jsonBlob/019f7ad1-4db9-71e3-bf2c-afadd3850dfa';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

async function getCloudPayload() {
  try {
    const res = await fetch(CLOUD_DB_URL, { cache: 'no-cache' });
    if (res.ok) {
      const payload = await res.json();
      if (Array.isArray(payload)) {
        return { data: payload, resetTimestamp: 0 };
      }
      return { data: payload.data || [], resetTimestamp: payload.resetTimestamp || 0 };
    }
  } catch (err) {
    console.error("Cloud DB fetch error:", err);
  }
  return { data: [], resetTimestamp: 0 };
}

async function saveCloudPayload(payload) {
  try {
    const res = await fetch(CLOUD_DB_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.ok;
  } catch (err) {
    console.error("Cloud DB save error:", err);
    return false;
  }
}

function mergeDatabaseRecords(localList, remoteList, resetTimestamp = 0) {
  const map = new Map();
  (localList || []).forEach(r => {
    if (r && r.regId && (r.timestamp || 0) >= resetTimestamp) map.set(r.regId, r);
  });
  (remoteList || []).forEach(r => {
    if (!r || !r.regId || (r.timestamp || 0) < resetTimestamp) return;
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
app.get('/api/health', async (req, res) => {
  const payload = await getCloudPayload();
  res.json({ status: 'ok', provider: 'Netlify Functions', count: payload.data.length, resetTimestamp: payload.resetTimestamp });
});

app.get('/api/results', async (req, res) => {
  const payload = await getCloudPayload();
  let db = payload.data;
  if (payload.resetTimestamp > 0) {
    db = db.filter(r => (r.timestamp || 0) >= payload.resetTimestamp);
  }
  res.json({ data: db, resetTimestamp: payload.resetTimestamp });
});

app.post('/api/results', async (req, res) => {
  const newRecord = req.body;
  if (!newRecord || !newRecord.regId) {
    return res.status(400).json({ error: 'regId is required' });
  }

  const payload = await getCloudPayload();
  const resetTime = payload.resetTimestamp || 0;
  if (resetTime > 0 && (newRecord.timestamp || Date.now()) < resetTime) {
    return res.json({ success: false, message: 'Record created before reset timestamp discarded' });
  }

  let db = payload.data;
  if (resetTime > 0) {
    db = db.filter(r => (r.timestamp || 0) >= resetTime);
  }

  const index = db.findIndex(r => r.regId === newRecord.regId);
  if (index !== -1) {
    db[index] = { ...db[index], ...newRecord, timestamp: Date.now() };
  } else {
    db.push({ ...newRecord, timestamp: Date.now() });
  }

  const success = await saveCloudPayload({ resetTimestamp: resetTime, data: db });
  if (success) {
    res.json({ success: true, count: db.length, resetTimestamp: resetTime, record: newRecord });
  } else {
    res.status(500).json({ error: 'Failed to update database' });
  }
});

app.post('/api/results/sync', async (req, res) => {
  const incomingList = req.body;
  if (!Array.isArray(incomingList)) {
    return res.status(400).json({ error: 'Payload must be an array' });
  }

  const payload = await getCloudPayload();
  const resetTime = payload.resetTimestamp || 0;
  const merged = mergeDatabaseRecords(payload.data, incomingList, resetTime);
  const success = await saveCloudPayload({ resetTimestamp: resetTime, data: merged });

  if (success) {
    res.json({ success: true, count: merged.length, resetTimestamp: resetTime, data: merged });
  } else {
    res.status(500).json({ error: 'Failed to save backend data' });
  }
});

app.delete('/api/results/:regId', async (req, res) => {
  const { regId } = req.params;
  const payload = await getCloudPayload();
  const filtered = payload.data.filter(r => r.regId !== regId);
  const success = await saveCloudPayload({ resetTimestamp: payload.resetTimestamp, data: filtered });

  if (success) {
    res.json({ success: true, count: filtered.length });
  } else {
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

app.post('/api/results/reset', async (req, res) => {
  const now = Date.now();
  const success = await saveCloudPayload({ resetTimestamp: now, data: [] });
  if (success) {
    res.json({ success: true, count: 0, resetTimestamp: now, message: 'Database reset successfully' });
  } else {
    res.status(500).json({ error: 'Failed to reset database' });
  }
});

module.exports.handler = serverless(app);
