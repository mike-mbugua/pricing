// /api/scrape-status.js
import { getScrapingStatus } from '../utils/scrapingStatusStore';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionId } = req.query;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  
  // Get the current status for this session
  const status = getScrapingStatus(sessionId);
  
  return res.status(200).json(status || {});
}