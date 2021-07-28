require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs =  require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");



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
    zip : String  
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User" , userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/" , function(req , res){
    res.render("home");
})
app.get("/login" , function(req , res){
    res.render("login");
})
app.get("/register" , function(req , res){
   
    res.render("register");
})

app.get("/secrets" , function(req , res){
    if(req.isAuthenticated())
    {
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
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
