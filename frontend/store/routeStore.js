/**
 * routeStore.js — Simple module-level singleton for the last searched route.
 *
 * Why not React Context or AsyncStorage?
 * - Context would require wrapping the root; overkill for one value.
 * - AsyncStorage is async; reading it in render is messy.
 * - A plain JS object is synchronous, always available, and survives navigation.
 *
 * Cleared when the user presses "I'm Safe" (back to home).
 */

const _store = {
  destLat:     null,
  destLng:     null,
  destName:    null,
  timeMins:    null,    // integer minutes
  routeCoords: null,   // [[lat, lng], ...] — the actual ORS road-following polyline
};

/** Called in index.jsx after a successful route build. */
export function setRouteStore(data) {
  _store.destLat     = data.destLat     ?? null;
  _store.destLng     = data.destLng     ?? null;
  _store.destName    = data.destName    ?? null;
  _store.timeMins    = data.timeMins    ?? null;
  _store.routeCoords = data.routeCoords ?? null;
}

/** Called in sos.jsx to get current destination + route. */
export function getRouteStore() {
  return { ..._store };
}

/** Called when journey ends (I'm Safe). */
export function clearRouteStore() {
  _store.destLat     = null;
  _store.destLng     = null;
  _store.destName    = null;
  _store.timeMins    = null;
  _store.routeCoords = null;
}
