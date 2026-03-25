const { PORT } = require("./src/server/constants");
const { createApp } = require("./src/server/app");
const { ensureUploadDirs } = require("./src/server/image-service");

async function start() {
  await ensureUploadDirs();
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
