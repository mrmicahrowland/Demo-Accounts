import type { Request, Response, NextFunction } from "express";

// Single-instance limiter. Deploy behind a shared edge/Redis limiter when horizontally scaled.
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    if (buckets.size > 10000) {
      for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    }
    const bucket = buckets.get(key);
    const entry = !bucket || bucket.reset <= now ? { count: 0, reset: now + windowMs } : bucket;
    entry.count++;
    buckets.set(key, entry);
    if (entry.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((entry.reset - now) / 1000)));
      res.status(429).json({ error: "Too many requests" });
      return;
    }
    next();
  };
}
