const express = require('express');
const data = require('../data/dummy');

const router = express.Router();

router.use('/', (req, res) => {
  res.json(data);
});

module.exports = router;
