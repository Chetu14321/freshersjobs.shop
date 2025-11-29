const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./Model/User");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = express.Router();
router.use(cookieParser());

/* ---------------- ENV ---------------- */
const isProd = process.env.NODE_ENV === "production";

const FRONTEND_URL = isProd
  ? process.env.FRONTEND_URL       // https://freshersjobs.shop
  : "http://localhost:3000";

/* ---------------- GOOGLE STRATEGY ---------------- */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails[0].value,
            picture: profile.photos[0].value,
          });
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

/* ---------------- LOGIN ---------------- */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/* ---------------- CALLBACK (FINAL FIX APPLIED) ---------------- */
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        picture: req.user.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    // Manual HTML redirect (fixes cookie loss!)
    return res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="0; URL='${FRONTEND_URL}/profile'" />
        </head>
        <body>Redirecting...</body>
      </html>
    `);
  }
);

/* ---------------- AUTH USER ---------------- */
router.get("/me", async (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ authenticated: false });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-googleId");

    return res.json({ authenticated: true, user });
  } catch {
    return res.status(401).json({ authenticated: false });
  }
});

/* ---------------- LOGOUT ---------------- */
router.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    path: "/",
  });

  res.json({ message: "Logged out" });
});

module.exports = router;
