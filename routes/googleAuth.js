const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const db = require('../database/db');
    const email = profile.emails[0].value;
    const name = profile.displayName;
    
    let result = await db.query(
      'SELECT * FROM clients WHERE email = $1', [email]
    );
    
    let client = result.rows[0];
    
    if (!client) {
      const newClient = await db.query(
        'INSERT INTO clients (email, name, country, plan, minutes_limit) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [email, name, 'IN', 'free', 100]
      );
      client = newClient.rows[0];
    }
    
    return done(null, client);
  } catch (err) {
    return done(err, null);
  }
}));

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: process.env.FRONTEND_URL + '/login' }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.redirect(process.env.FRONTEND_URL + '/auth/callback?token=' + token);
  }
);

module.exports = router;
