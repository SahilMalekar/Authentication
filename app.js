require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs =  require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;
const app = express();

app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
app.set("view engine" , "ejs");

mongoose.connect('mongodb://localhost:27017/userDB', {useNewUrlParser: true, useUnifiedTopology: true});

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    full_name : String,
    address : String,
    city : String,
    mobile_number : String,
    zip : String
});



const User = new mongoose.model("User" , userSchema);

app.get("/" , function(req , res){
    res.render("home");
})
app.get("/login" , function(req , res){
    res.render("login");
})
app.get("/register" , function(req , res){
   
    res.render("register");
})

app.post("/login" , function(req , res){
    const username = req.body.username;
    const password = req.body.password;

    User.findOne({email : username} , function(err , foundUser){
        if(err)
        {
            console.log(err);
        }else{
            bcrypt.compare(password, foundUser.password, function(err, result) {
               if(result === true)
               {
                res.render("secrets");
               }else{
                console.log("password not matched");
               }
            });
        }
    })
})

app.post("/register" , function(req , res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        
        const newUser = new User({
            email : req.body.email,
            password : hash,
            full_name : req.body.full_name,
            address : req.body.address,
            city : req.body.city,
            mobile_number : req.body.mnum,
            zip : req.body.zip
            });
        
            newUser.save(function(err){
                if(err)
                {
                    console.log(err);
                }else{
                    res.render("secrets");
                }
            })
    });
  
});




app.listen(3000 , function(){
    console.log("Server is running at port 3000");
});
