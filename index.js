const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();
const session = require("express-session"); // Add this line
const passport = require("passport");
const OAuth2Strategy = require("passport-google-oauth2").Strategy;
const userRoutes = require("./routes/User");
const database = require("./config/database");
const userdb = require("./models/User");

const clientid =
  "286297522947-jipnb0j254nh1qrl9p3bamnjo1d5q6o8.apps.googleusercontent.com";
const clientsecret = "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";
const URL = process.env.URL;

dotenv.config();
const PORT = process.env.PORT || 4000;
//database connect
database.connect();
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: "GET,POST,PUT,DELETE",
    credentials: true,
  })
);

app.use(
  session({
    secret: "your-secret-key", // Set a secure and secret key
    resave: false,
    saveUninitialized: false,
  })
);

// setuppassport
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new OAuth2Strategy(
    {
      clientID: clientid,
      clientSecret: clientsecret,
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await userdb.findOne({ googleId: profile.id });

        if (!user) {
          user = new userdb({
            googleId: profile.id,
            firstName: profile.displayName,
            lastName: profile.displayName,
            email: profile.emails[0].value,
            password: "defaultPassword", // Provide a default password or handle this case differently
          });

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// initial google ouath login
app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: URL + "/",
    failureRedirect: URL + "/login",
  })
);
app.get("/login/success", (req, res) => {
  res.status(200).json({ user: req.user });
});

app.use("/api/v1/auth", userRoutes);
app.get("/", (req, res) => {
  return res.json({
    success: true,
    message: "Your server is up and running !!....",
  });
});

app.listen(PORT, () => {
  console.log(`App is running at ${PORT}`);
});
