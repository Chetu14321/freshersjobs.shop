const express = require("express");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const User = require("./Model/User");
const cookieParser = require("cookie-parser");
require("dotenv").config();

const router = express.Router();

router.use(cookieParser());

/* -----------------------------
   DYNAMIC FRONTEND URL
--------------------------------*/
const FRONTEND_URL =
  process.env.FRONTEND_URL ||
  (process.env.NODE_ENV === "production"
    ? "https://freshersjobs.shop"
    : "http://localhost:3000");

const isProd = process.env.NODE_ENV === "production";

/* -----------------------------
   GOOGLE STRATEGY
--------------------------------*/
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

/* -----------------------------
   AUTH ROUTES
--------------------------------*/
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "consent",
  })
);

/* -----------------------------
   CALLBACK ROUTE
--------------------------------*/
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

    /* -----------------------------
       SET COOKIE → FIXED VERSION
    --------------------------------*/
    res.cookie("token", token, {
      httpOnly: true,
      secure: isProd,                // https only in production
      sameSite: isProd ? "none" : "lax",
      domain: isProd ? "freshersjobs-shop.onrender.com" : "localhost",
      path: "/",
    });

    return res.redirect(`${FRONTEND_URL}/profile`);
  }
);

/* -----------------------------
   GET LOGGED-IN USER
--------------------------------*/
router.get("/me", async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) return res.status(401).json({
      authenticated: false,
      message: "Not logged in"
    });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-googleId");

    if (!user)
      return res.status(401).json({
        authenticated: false,
        message: "User not found"
      });

    res.json({
      authenticated: true,
      user
    });
  } catch {
    res.status(401).json({
      authenticated: false,
      message: "Invalid token"
    });
  }
});

/* -----------------------------
   LOGOUT
--------------------------------*/
router.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    domain: isProd ? "freshersjobs-shop.onrender.com" : "localhost",
    path: "/",
  });

  res.json({ message: "Logged out" });
});

module.exports = router;
