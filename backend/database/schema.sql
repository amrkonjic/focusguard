CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'waiting'
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  ended_at DATETIME,
  completed INTEGER DEFAULT 0,
  FOREIGN KEY (room_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS break_requests (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME,
  approved INTEGER,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);