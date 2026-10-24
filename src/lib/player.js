const ID_KEY = 'bg.playerId';
const NAME_KEY = 'bg.playerName';

const sanitize = (value) => String(value || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 64);

// Stable per-tab identity: refreshing keeps the same seat and reconnects to it.
export function getPlayerId() {
  let id = sanitize(sessionStorage.getItem(ID_KEY));
  if (!id) {
    id = sanitize(crypto.randomUUID?.() ?? `p${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`);
    sessionStorage.setItem(ID_KEY, id);
  }
  return id;
}

export function getSavedName() {
  try {
    return localStorage.getItem(NAME_KEY) || '';
  } catch {
    return '';
  }
}

export function saveName(name) {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* private mode */
  }
}
