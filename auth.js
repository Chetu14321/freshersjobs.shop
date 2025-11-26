const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./Model/User");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = express.Router();

// Middleware
router.use(cookieParser());

// Auto-detect frontend URL
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://freshersjobs.shop"
    : "http://localhost:3000");

// GOOGLE STRATEGY
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
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
      return done(null, user);
    }
  )
);

// LOGIN
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    accessType: "offline",
    prompt: "consent",
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
        picture: req.user.picture,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // only https in production
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      path: "/",
    });

    return res.redirect(`${FRONTEND_URL}/profile`);
  }
);

// 🟢 GET LOGGED-IN USER
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({ message: "Not logged in" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-googleId");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ user });
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
});

// LOGOUT
router.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  res.json({ message: "Logged out" });
});

module.exports = router;
