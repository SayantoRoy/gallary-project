const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// User Model

const User = require('../models/user');

module.exports = function(passport) {
    passport.use(
        new LocalStrategy({ usernameField: 'email'} , (email , password ,done) =>{
            //Match User
            User.findOne({email : email })
            .then(user =>{
                if(!user){
                    return done(null , false , {message : "Email Is not Registered"});
                }

                // Match Password
                bcrypt.compare(password, user.password , (err , isMatch) =>{
                    if(err) {throw err;}

                    if (isMatch){
                        return done(null , user);
                    }
                    else
                    {
                        return done(null , false , {message : "Passsword incorrect"});
                    }
                });
            })
            .catch(err => console.log(err));
        })
    );

    //Serialize and Deserialize
    passport.serializeUser((user, done)=> {
        done(null, user.id);
      });
    
      passport.deserializeUser((id, done) => {
        User.findById(id, function(err, user) {
          done(err, user);
        });
      });
    };