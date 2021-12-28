const express = require('express');
const loaders = require('./loaders');
const env = require('./config');

async function startServer() {
  const app = express();

  await loaders(app);

  app.listen(env.back.port, err => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Server listening... ${env.back.domain}:${env.back.port}`);
  });
}

startServer();
