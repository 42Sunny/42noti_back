const express = require('express');
const loaders = require('./loaders');
const env = require('./config');

async function startServer() {
  const app = express();

  await loaders(app);

  app.listen(env.port, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Server listening on port ${env.port}`);
  });
}

startServer();
