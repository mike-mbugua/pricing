// /utils/scrapingStatusStore.js
// A simple in-memory store for scraping status
// In production, you would use a more persistent solution like Redis

const statusStore = new Map();

export function getScrapingStatus(sessionId) {
  return statusStore.get(sessionId) || {};
}

export function updateScrapingProgress(sessionId, progress) {
  const current = statusStore.get(sessionId) || {};
  statusStore.set(sessionId, {
    ...current,
    progress
  });
}

export function updatePriceChanges(sessionId, priceChanges) {
  const current = statusStore.get(sessionId) || {};
  statusStore.set(sessionId, {
    ...current,
    priceChanges
  });
}

export function completeScrapingProcess(sessionId, summary) {
  const current = statusStore.get(sessionId) || {};
  statusStore.set(sessionId, {
    ...current,
    complete: summary
  });
  
  setTimeout(() => {
    statusStore.delete(sessionId);
  }, 30 * 60 * 1000);
}

export function setScrapingError(sessionId, error) {
  const current = statusStore.get(sessionId) || {};
  statusStore.set(sessionId, {
    ...current,
    error
  });
}