const buckets = new Map();


const MAX_TOKENS = 100;
const REFILL_RATE = 1
const REFILL_INTERVAL = 900;

function rateLimiter(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  if (!buckets.has(ip)) {
    buckets.set(ip, {
      tokens: MAX_TOKENS,
      lastRefill: now,
    });
  }

  const bucket = buckets.get(ip);

  
  const timePassed = now - bucket.lastRefill;
  const tokensToAdd = Math.floor(timePassed / REFILL_INTERVAL);
  if (tokensToAdd > 0) {
    bucket.tokens = Math.min(bucket.tokens + tokensToAdd, MAX_TOKENS);
    bucket.lastRefill = now;
  }

  
  if (bucket.tokens > 0) {
    bucket.tokens -= 1;
    next(); 
  } else {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }
}
module.exports = rateLimiter;
