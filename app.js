require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const bcrypt = require("bcrypt");
// const saltRounds = 5;
// const encrypt = require("mongoose-encryption");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
  secret: "santhoshpaul",
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());



mongoose.connect("mongodb://localhost:27017/userDB");

const schema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  secrets: String
});

schema.plugin(passportLocalMongoose);
schema.plugin(findOrCreate);

// schema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:["password"]});

const User = mongoose.model("user", schema);


passport.use(User.createStrategy());

// used for oauth
passport.serializeUser(function(user, done){
  done(null, user.id);
});

passport.deserializeUser(function(id, done){
  User.findById(id, function(err, user){
    done(err,user);
  });
});

// passport.serializeUser(User.serializeUser());
// passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));




app.get("/", function(req,res){
  res.render("home");
});

app.get('/auth/google',
  passport.authenticate('google', { scope:
      [ 'email', 'profile' ] }
));

app.get( "/auth/google/secrets",
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/secrets", function(req,res){

    User.find({"secrets": {$ne: null}}, function(err, result){
      if (err) {
        console.log(err);
      }else {
        if(result){
          res.render("secrets" , {whisper: result});
        }
      }
    });
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
});

app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  }else {
    res.redirect("/login");
  }
});

app.post("/register", function(req,res){
  // bcrypt.hash(req.body.password, saltRounds, function(err,hash){
  //   const newuser = new User({
  //     email: req.body.username,
  //     password: hash
  //   });
  //   newuser.save(function(err){
  //     if(err){
  //       console.log(err);
  //     }else {
  //       res.render("secrets");
  //     }
  //   });
  // });

  User.register({username: req.body.username},req.body.password,function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req,res){
  // const email = req.body.username;
  // const password = req.body.password;
  // User.findOne({email:email}, function(err,result){
  //   if(err){
  //     console.log(err);
  //   }else {
  //     if (result) {
  //       bcrypt.compare(password,result.password, function(err,response){
  //         if (response === true) {
  //           res.render("secrets");
  //         }
  //       });
  //
  //     }
  //   }
  // });

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user,function(err){
    if (err) {
      console.log(err);
    }else {
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets");
      });
    }
  });
});

app.post("/submit", function(req,res){
  const secret = req.body.secret;
  User.findById(req.user._id, function(err,result){
    if(err){
      console.log(err);
    }else {
      if(result){
        result.secrets = secret;
        result.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});

app.listen(3000, function(){
  console.log("Server is online");
});
