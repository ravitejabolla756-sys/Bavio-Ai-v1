const express = require('express');
const router = express.Router();

router.get('/rates', (req, res) => {
  return res.status(200).json({
    starter: { price: 1499, minutes: 200, calls: 30 },
    growth: { price: 2999, minutes: 500, calls: 75 },
    scale: { price: 5999, minutes: 1500, calls: 225 }
  });
});

module.exports = router;
