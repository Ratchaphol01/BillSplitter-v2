const express = require('express');
const router = express.Router();

// Currency exchange rates API
router.get('/currency/rates', async (req, res) => {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
    if (!response.ok) {
      throw new Error('Failed to fetch from external API');
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

module.exports = router;