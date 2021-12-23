const https = require('https');
const fs = require('fs');
const express = require('express');
const loaders = require('./loaders');
const env = require('./config');

const options = {
  key: fs.readFileSync('/Users/SR/localhost-key.pem'),
  cert: fs.readFileSync('/Users/SR/localhost.pem'),
};

async function startServer() {
  const app = express();

  await loaders(app);

  https.createServer(options, app).listen(env.back.port, err => {
    if (err) {
      console.error(err);
      return;
    }
    console.log(`Server listening... ${env.back.domain}:${env.back.port}`);
  });
}

startServer();

