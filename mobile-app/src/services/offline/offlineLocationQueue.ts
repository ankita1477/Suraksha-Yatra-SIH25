import * as SQLite from 'expo-sqlite';

export interface QueuedLocation {
  id: number;
  latitude: number;
  longitude: number;
  speed: number | null;
  accuracy: number | null;
  recordedAt: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('offline_safety.db');
  }
  return dbPromise;
}

export async function initOfflineDb() {
  const db = await getDb();
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS offline_locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      speed REAL,
      accuracy REAL,
      recordedAt TEXT NOT NULL
    );
  `);
}

export async function enqueueLocation(payload: {
  latitude: number;
  longitude: number;
  speed?: number;
  accuracy?: number;
}) {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO offline_locations (latitude, longitude, speed, accuracy, recordedAt)
     VALUES (?, ?, ?, ?, ?)`,
    payload.latitude,
    payload.longitude,
    payload.speed ?? null,
    payload.accuracy ?? null,
    new Date().toISOString()
  );
}

export async function readQueuedLocations(limit = 100): Promise<QueuedLocation[]> {
  const db = await getDb();
  return db.getAllAsync<QueuedLocation>(
    `SELECT * FROM offline_locations ORDER BY id ASC LIMIT ?`,
    limit
  );
}

export async function removeQueuedLocations(ids: number[]) {
  if (!ids.length) {
    return;
  }

  const db = await getDb();
  const placeholders = ids.map(() => '?').join(', ');
  await db.runAsync(`DELETE FROM offline_locations WHERE id IN (${placeholders})`, ...ids);
}
