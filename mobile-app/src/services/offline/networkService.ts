import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

let online = true;
const listeners = new Set<(isOnline: boolean) => void>();

function computeOnlineStatus(state: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}) {
  return Boolean(state.isConnected && state.isInternetReachable !== false);
}

export async function initNetworkService() {
  const state = await NetInfo.fetch();
  online = computeOnlineStatus(state);
}

export function isOnline() {
  return online;
}

export function subscribeNetwork(cb: (isOnline: boolean) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function startNetworkListener() {
  return NetInfo.addEventListener((state: NetInfoState) => {
    const next = computeOnlineStatus(state);
    if (next !== online) {
      online = next;
      listeners.forEach((fn) => fn(online));
    }
  });
}
