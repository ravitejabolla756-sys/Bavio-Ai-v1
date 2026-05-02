const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const jwt = require('jsonwebtoken');
const { randomUUID } = require('crypto');
const router = express.Router();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const db = require('../database/db');
    const email = profile.emails[0].value;
    
    console.log('Google OAuth: Processing user', email);
    
    let result = await db.query(
      'SELECT * FROM clients WHERE email = $1', [email]
    );
    
    let client = result.rows[0];
    
    if (!client) {
      console.log('Google OAuth: Creating new client for', email);
      const apiKey = randomUUID().replace(/-/g, '');
      const newClient = await db.query(
        `INSERT INTO clients (email, api_key, subscription_plan, status, country, plan, minutes_limit)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [email, apiKey, 'free', 'active', 'IN', 'free', 100]
      );
      client = newClient.rows[0];
      console.log('Google OAuth: Created new client', client.id);
    } else {
      console.log('Google OAuth: Existing client found', client.id);
    }
    
    return done(null, client);
  } catch (err) {
    console.error('Google OAuth error:', err);
    return done(err, null);
  }
}));

router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: process.env.FRONTEND_URL + '/login?error=oauth_failed' }),
  (req, res) => {
    try {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      console.log('Google OAuth: Success, redirecting with token for user', req.user.email);
      res.redirect(process.env.FRONTEND_URL + '/auth/callback?token=' + token);
    } catch (err) {
      console.error('Google OAuth callback error:', err);
      res.redirect(process.env.FRONTEND_URL + '/login?error=oauth_failed');
    }
  }
);

module.exports = router;
