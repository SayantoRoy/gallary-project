const express = require("express");
const app = require('express')();
const ejsLayout = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');


//Nav Bar
const nav = [{link:'/users/dashboard', title:'Dashboard'},
{link:'/users/upload', title:'Upload'},
{link:'/users/register' , title:'Register'},
{link:'/users/login' , title:'Login'},


] ;

const authNav = [{link:'/users/dashboard', title:'Dashboard'},
{link:'/users/upload', title:'Upload'},
{link:'/users/logout' , title:'Logout'},
] ;



//Passport Config
require('./src/config/strategy')(passport);

//Static 
app.use(express.static('./src/public'));

//PORT
const port = process.env.PORT || 3000;


//MongoDB Config
const db = require('./src/config/keys').MongoURI;

//Connect DB
mongoose.connect(db , {useUnifiedTopology: true , useNewUrlParser: true})
.then(() => { console.log("MongoDB Connect Successful")})
.catch(err => console.log("Error in MongoDb Connect"));


//EJS
app.use(ejsLayout);
app.set('views' , './src/view');
app.set('view engine' , 'ejs');

//BodyParser
app.use(express.urlencoded({extended:false}));

//Express Session Middleware
app.use(session({
    secret: 'lets do it',
    resave: true,
    saveUninitialized: true,
  }));

//Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

//Connect Flash
app.use(flash());

//Global Variables 
app.use((req, res, next)=>{
    res.locals.success_msgs = req.flash('success_msg');
    res.locals.error_msgs = req.flash('error_msg');
    res.locals.error = req.flash('error');

    next();
});

app.use(function(req,res,next){
    res.locals.currentUser=req.user;
    next();
  });



//Routes
const indexRouter = require('./src/routes/indexRoutes.js')(nav , authNav);
const userRouter = require('./src/routes/userRoutes')(nav , authNav);
const { Mongoose } = require('mongoose');
app.use('/', indexRouter);
app.use('/users' , userRouter);


//Port Connection for the sever
app.listen(port , (req,res)=>{
    console.log(`Listening on ${port}`);
})