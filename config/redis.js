const { createClient } = require("redis");

const redisClient = createClient({
  url: process.env.REDIS_URL,

  socket: {
    tls: true,          // ✅ REQUIRED for Upstash
    rejectUnauthorized: false,
  },
});

redisClient.on("error", (err) => {
  console.log("❌ Redis Error:", err.message);
});

redisClient.on("connect", () => {
  console.log("🔌 Redis Connecting...");
});

redisClient.on("ready", () => {
  console.log("✅ Redis Connected");
});

redisClient.connect().catch(console.error);

module.exports = { redisClient };
