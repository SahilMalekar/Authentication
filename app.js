require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs =  require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');



const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine" , "ejs");

app.use(session({
    secret: 'little bit secret.',
    resave: false,
    saveUninitialized: true
  }));

  app.use(passport.initialize());
  app.use(passport.session());

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useCreateIndex', true);
const userSchema = new mongoose.Schema({
    username : String,
    password : String,
    full_name :String,
    address : String,
    city :String,
    mnum :String,
    zip : String,
    googleId : String,
    googleUserName :String,
    userPicture :String,
    secret : String  
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User" , userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user.id);
  });
  
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo'
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id , googleUserName : profile.displayName , userPicture : profile._json.picture }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/" , function(req , res){
    res.render("home");
})

app.get("/auth/google",
  passport.authenticate('google', { scope: ["profile"] }));
 

  app.get("/auth/google/secrets", 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
 
app.get("/login" , function(req , res){
    res.render("login");
})
app.get("/register" , function(req , res){
   
    res.render("register");
})

app.get("/secrets" , function(req , res){
  User.find({"secret" : {$ne : null}} , function(err , foundUsers){
      if(err)
      {
          console.log(err);
      }else{
          if(foundUsers)
          {
              res.render("secrets" , {usersWithSecret : foundUsers});
          }
      }
  })
})

app.get("/submit" , function(req ,res){
    if(req.isAuthenticated())
    {
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})

app.post("/submit" , function(req , res){
    const submittedSecret = req.body.secret;
    User.findById(req.user._id , function(err , foundUser){
        if(err)
        {
            res.redirect("/login");
        }else{
            if(foundUser)
            {
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                })
            }
        }
    })
})


app.get("/logout" , function(req , res){
    req.logOut();
    res.redirect("/");
})

app.post("/login" , function(req , res){

    const user = new User({
        username : req.body.username,
        password : req.body.password
    })
    // req.logIn(user , function(err){
    //     if(err)
    //     {   
    //        return res.redirect("/login");
    //     }else{
    //         passport.authenticate("local") (req , res , function(){
    //           return  res.redirect("/secrets")
    //         });
    //     }
    // });

    passport.authenticate('local' ,function(err, user, info) {
        if (err) { return (err); }
        if (!user) {  return res.redirect('/login')  }
        req.logIn(user, function(err) {
          if (err) { return (err); }
          return res.redirect('/secrets');
        });
      })(req, res);


     
})

app.post("/register" , function(req , res){

    User.register({username : req.body.username ,
                   full_name : req.body.full_name ,
                   address : req.body.address ,
                   city : req.body.city ,
                   mnum : req.body.mnum , 
                   zip : req.body.zip } , 
                   req.body.password , function(err , user){
        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req , res , function(){
                res.redirect("/secrets");
            });
        }
    });
  
});




app.listen(3000 , function(){
    console.log("Server is running at port 3000");
});
