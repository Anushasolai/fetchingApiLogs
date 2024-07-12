import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';

interface RateLimiterConfig {
  maxRequests: number; 
  windowMs: number; 
  maxConcurrency: number;
}

const createRateLimiter = (config: RateLimiterConfig) => {
  let tokens = config.maxRequests;
  let lastRefillTimestamp = Date.now();
  let activeRequests = 0; 

  const refillTokens = () => {
    const now = Date.now();
    const elapsed = now - lastRefillTimestamp;
    const tokensToAdd = (elapsed / config.windowMs) * config.maxRequests;
    
    tokens = Math.min(config.maxRequests, tokens + tokensToAdd);
    lastRefillTimestamp = now;
  };

  return {
    tryRemoveToken: (): boolean => {
      refillTokens();

      if (tokens >= 1) {
        tokens -= 1;
        return true;
      } else {
        return false;
      }
    },
    tryIncreaseConcurrency: (): boolean => {
      if (activeRequests < config.maxConcurrency) {
        activeRequests += 1;
        return true;
      } else {
        return false;
      }
    },
    decreaseConcurrency: (): void => {
      activeRequests = Math.max(0, activeRequests - 1);
    }
  };
};

export const rateLimiter = createRateLimiter({ maxRequests: 10, windowMs: 1000, maxConcurrency: 5 }); // Example config: 10 requests per second and 5 concurrent requests

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (rateLimiter.tryRemoveToken()) {
    if (rateLimiter.tryIncreaseConcurrency()) {
      res.on('finish', () => {
        rateLimiter.decreaseConcurrency();
      });
      next();
    } else {
      logger.warn("Concurrency limit exceeded. Skipping request.");
      res.status(503).json({ message: "Server is busy, please try again later." });
    }
  } else {
    logger.warn("Rate limit exceeded. Skipping request.");
    res.status(429).json({ message: "Too many requests, please try again later." });
  }
};
