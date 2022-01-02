const express = require('express');
const dummyData = require('../data/dummy');

const router = express.Router();

router.use('/event/:id', (req, res) => {
  const id = Number(req.params.id);
  const event = dummyData.data.find(event => event.id === id);
  console.dir(event);
  res.json(event);
});

router.use('/', (req, res) => {
  res.json(dummyData);
});

module.exports = router;
