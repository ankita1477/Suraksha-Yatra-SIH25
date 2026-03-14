import { api } from '../api';
import { isOnline } from './networkService';
import { readQueuedLocations, removeQueuedLocations } from './offlineLocationQueue';

export async function syncOfflineLocations() {
  if (!isOnline()) {
    return 0;
  }

  const batch = await readQueuedLocations(100);
  if (!batch.length) {
    return 0;
  }

  const syncedIds: number[] = [];

  for (const row of batch) {
    try {
      await api.post('/location', {
        latitude: row.latitude,
        longitude: row.longitude,
        speed: row.speed ?? undefined,
        accuracy: row.accuracy ?? undefined,
        timestamp: row.recordedAt,
      });
      syncedIds.push(row.id);
    } catch {
      break;
    }
  }

  await removeQueuedLocations(syncedIds);
  return syncedIds.length;
}
