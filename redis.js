const Redis = require("ioredis");

if (!process.env.REDIS_HOST || !process.env.REDIS_PORT || !process.env.REDIS_PASSWORD) {
  console.error("❌ Redis ENV variables missing");
}

const redis = new Redis(
  `rediss://:${process.env.REDIS_PASSWORD}@${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
  {
    tls: {
      servername: process.env.REDIS_HOST, // 🔥 REQUIRED
    },
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
  }
);

redis.on("connect", () => {
  console.log("✅ Redis connected (TLS via rediss)");
});

redis.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
});

module.exports = redis;
