import * as FileSystem from 'expo-file-system/legacy';

const TILE_ROOT = `${FileSystem.documentDirectory}offline_tiles`;

function lon2tile(lon: number, zoom: number) {
  return Math.floor(((lon + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  return Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * Math.pow(2, zoom)
  );
}

export async function cacheTouristAreaTiles(
  bounds: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  },
  zooms = [13, 14, 15]
) {
  await FileSystem.makeDirectoryAsync(TILE_ROOT, { intermediates: true });

  for (const zoom of zooms) {
    const xMin = lon2tile(bounds.minLon, zoom);
    const xMax = lon2tile(bounds.maxLon, zoom);
    const yMin = lat2tile(bounds.maxLat, zoom);
    const yMax = lat2tile(bounds.minLat, zoom);

    for (let x = xMin; x <= xMax; x += 1) {
      for (let y = yMin; y <= yMax; y += 1) {
        const tileDir = `${TILE_ROOT}/${zoom}/${x}`;
        const tilePath = `${tileDir}/${y}.png`;
        const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;

        await FileSystem.makeDirectoryAsync(tileDir, { intermediates: true });
        await FileSystem.downloadAsync(tileUrl, tilePath);
      }
    }
  }
}

export function getOfflineTilePathTemplate() {
  return `${TILE_ROOT}/{z}/{x}/{y}.png`;
}
