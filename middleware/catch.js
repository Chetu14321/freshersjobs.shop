const { redisClient } = require("../config/redis");

const cache = (prefix, ttl = 300) => {
  return async (req, res, next) => {
    const key = `${prefix}:${req.originalUrl}`;

    try {
      const cached = await redisClient.get(key);

      if (cached) {
        console.log("⚡ Cache HIT:", key);
        return res.json(JSON.parse(cached));
      }

      // override res.json
      const originalJson = res.json.bind(res);
      res.json = async (body) => {
        await redisClient.setEx(key, ttl, JSON.stringify(body));
        console.log("💾 Cache SET:", key);
        return originalJson(body);
      };

      next();
    } catch (err) {
      console.log("Cache Error:", err.message);
      next();
    }
  };
};

module.exports = cache;
