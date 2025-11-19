const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
// const User = require("./model/User");
const User=require("./Model/User")
require("dotenv").config();

const router = express.Router();

// GOOGLE OAUTH STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        user = await User.create({
          googleId: profile.id,
          name: profile.displayName,
          email: profile.emails[0].value,
          picture: profile.photos[0].value,
        });
      }
      done(null, user);
    }
  )
);

// START LOGIN
// START GOOGLE LOGIN (this is the correct version)
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent"
  })
);

// CALLBACK
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),

  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

  res.cookie("token", token, {
  httpOnly: true,
  secure: true,      // required for https
  sameSite: "none",  // required for cross-domain cookie
});


    res.redirect(process.env.FRONTEND_URL);
  }
);

// LOGOUT
router.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logged out" });
});

module.exports = router;
