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
  password: String
});

schema.plugin(passportLocalMongoose);

// schema.plugin(encrypt,{secret: process.env.SECRET,encryptedFields:["password"]});

const User = mongoose.model("user", schema);


passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", function(req,res){
  res.render("home");
});

app.get("/login", function(req,res){
  res.render("login");
});

app.get("/register", function(req,res){
  res.render("register");
});

app.get("/secrets", function(req,res){
  if(req.isAuthenticated()){
    res.render("secrets");
  }else {
    res.redirect("/login");
  }
});

app.get("/logout",function(req,res){
  req.logout();
  res.redirect("/");
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

app.listen(3000, function(){
  console.log("Server is online");
});
