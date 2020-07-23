const express = require('express');
const multer = require('multer');
const index = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const path = require('path');
const { chdir } = require('process');
const fs = require('fs');
const directory = './src/public/uploads'; // Path at which the images are to be stored
const pth = '/uploads';


let nav = [];
const { ensureAuthenticated } = require('../config/auth');
const { ensureAuthenticate } = require('../config/auth');


//User Model
const User = require('../models/user');
const { RSA_PKCS1_OAEP_PADDING } = require('constants');




//Functions related to the Local Directory for storing of the image files


//Set Storage Engine
const storeage = multer.diskStorage({
    destination: (req, file, cb) => {
      const { email } = req.user
      const dir = `${directory}/${email}`;
      fs.exists(dir, exist => {
      if (!exist) {
        return fs.mkdir(dir, error => cb(error, dir))
      }
      return cb(null, dir)
      })
    },
    filename: (req, file, cb) => {
      cb(null, file.fieldname +'-'+ Date.now()+path.extname(file.originalname))
    }
    });

//Initialize Upload Var
const upload = multer({
    storage : storeage,
    limits: {fileSize: 10000000} ,
    fileFilter : function(req , file , cb){
        checkFileType(file , cb);
    }
}
).single('myImage');

//Filter File
function checkFileType(file , cb){
    // Whitelist Filter
    const filetypes = /jpeg|jpg|png|gif/;
    //Ext

    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    //Mime Type
    const mimetype = filetypes.test(file.mimetype);
    
    if(extname && mimetype){
        return cb( null , true);
    }else{
        cb('Error : Images only');
    }

}






// All the Routes

function router(navi , authNav){
    nav = navi

    //Login
    index.route('/login')
    .get((req,res)=>{
        res.render("auth" , {nav});
    })
    .post((req , res , next)=>{
        passport.authenticate('local' , {
            successRedirect : '/users/dashboard',
            failureRedirect : '/users/login',
            failureFlash: true
        })(req, res ,next);

    });
    


//Register
    index.route('/register')
    .get((req,res)=>{
        res.render("auth" , {nav});
    })
    .post((req,res)=>{
        const{ name , email , password , password2} = req.body;
        let errors = [];
        
        //Check For the Errors
        if(!name ||!email||!password||!password2)
        { errors.push({msg : "Please fill in all the fields"});}

        //Password Errors
        if(password !== password2)
        {errors.push({msg : 'Passwords does not match'});}

        if(password.length < 4 )
        {errors.push({msg : 'Password length should not be less than 8'});}

        if(errors.length > 0 )
        {
            res.render('auth' , {
                errors,
                nav,
                name,
                email,
                password,
                password2
            });
        }
        else
        {
            //Validation Passed
            User.findOne({email : email})
            .then(users => {
                //User already Exits
                errors.push({msg : 'Email is already registered '});
                if(users){
                    res.render('auth' , {
                        errors,
                        nav,
                        name,
                        email,
                        password,
                        password2
                    });
                } else {
                    fs.mkdir(`${directory}/${email}`, function(err) {
                        if (err) {
                          console.log(err)
                        } else {
                          console.log("New directory successfully created.")
                        }
                      });
                    const code = `${pth}/${email}`;
                    const newUser = new User({
                        name , email , password, code
                    });

                    //Password Encrypt
                    bcrypt.genSalt(10 , (err , salt) =>{
                        bcrypt.hash(newUser.password , salt , (err,hash) =>{
                            if(err) throw err;
                            //Password Hashed and Saved
                            newUser.password = hash;

                            //Save User in DB
                            newUser.save()
                            .then(users =>{
                                req.flash('success_msg' , 'You are now Registered!! Just LOGIN!!');
                                res.redirect('/users/login');
                            })
                            .catch(err => console.log(err));
                        })
                    });
                }
            });
        }

    });



    //Upload
    index.get('/upload' , ensureAuthenticated , (req , res) =>{
        res.render('upload' , {
            user:req.user,
            nav : authNav
        });
    })
    index.post('/upload' , ensureAuthenticated ,(req , res)=>{
        upload(req , res , (err) => {
            if(err)
            {
                res.render('upload' , {
                    msg : err,
                    nav : authNav
                })
            }
            else{
                
                if(req.file === undefined)
                {
                    res.render('upload' , {
                        msg : 'Error : Please Select a File',
                        nav : authNav
                    });
                }
                else
                {
                    res.render('upload' , {
                        msg : 'File Successfully Uploaded',
                        file : `${req.user.code}/${req.file.filename}`,
                        user : req.user,
                        nav :authNav
                    })
                }
            }
        });
    
    });

    //Dashboard
    index.get('/dashboard',ensureAuthenticated, (req , res ) =>{
        let dirBuf = Buffer.from(`${directory}/${req.user.email}`);
        let pth = `/uploads/${req.user.email}`;
        fs.readdir(dirBuf , (err , files)=>{
            var files = files.reverse();
            if(err)
            {
                res.render('dasboard' , {
                    msg : 'Error : Files errors'
                });
            }
            else
            {
                res.render('dashboard' , {
                    files,
                    path : pth,
                    nav : authNav,
                    email: req.user.email,
                });
            }
        })
    });


    
//Logout
    index.route('/logout')
    .get((req,res)=>{
        req.logOut();
        req.flash('success_msg' , 'You are successfully logged out');
        res.redirect('/users/login');
    });

    return index;
}
module.exports = router;
