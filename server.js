require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generalLimiter, apiLimiter } = require('./middleware/rateLimit');

const app = express();
const PORT = process.env.PORT || 3000;

// ------- Global Middleware -------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(generalLimiter);

// ------- API Routes -------
const clientsRoutes = require('./routes/clients');
const assistantsRoutes = require('./routes/assistants');
const numbersRoutes = require('./routes/numbers');
const callsRoutes = require('./routes/calls');
const usageRoutes = require('./routes/usage');
const telephonyRoutes = require('./routes/telephony');

app.use('/clients', clientsRoutes);
app.use('/assistants', apiLimiter, assistantsRoutes);
app.use('/numbers', apiLimiter, numbersRoutes);
app.use('/calls', apiLimiter, callsRoutes);
app.use('/usage', apiLimiter, usageRoutes);
app.use('/telephony', telephonyRoutes);

// ------- Health Check -------
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'Bavio AI Backend', version: '2.0.0' });
});

// ------- Start Server -------
app.listen(PORT, () => {
    console.log(`Bavio AI Backend running on port ${PORT}`);
});

module.exports = app;
