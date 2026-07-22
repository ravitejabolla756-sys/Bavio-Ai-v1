const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

router.get('/supported-countries', (req, res) => {
    try {
        const countriesPath = path.join(__dirname, '..', 'config', 'supported-countries.json');
        const fileContent = fs.readFileSync(countriesPath, 'utf8');
        const countries = JSON.parse(fileContent);
        
        // Filter: only return enabled countries
        const enabledCountries = countries.filter(c => c.enabled === true);
        
        res.status(200).json(enabledCountries);
    } catch (err) {
        console.error('[TELEPHONY] Error loading supported countries:', err.message);
        res.status(500).json({ error: 'Failed to load supported countries' });
    }
});

module.exports = router;
