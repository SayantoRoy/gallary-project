const express = require('express');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const path = require('path');
const { chdir } = require('process');
const fs = require('fs');
const directory = './src/public'; // Path at which the images are to be stored
const pth = '/uploads';



const index = express.Router();
const { ensureAuthenticated } = require('../config/auth');
const { ensureAuthenticate } = require('../config/auth');
let nav = [];
function router(navi , authNav){
    nav = navi
    //Welcome
    index.route('/')
    .get((req,res)=>{
        res.render('welcome' , { nav });
    })

    //Image View Route
    index
    .get('/image-view/:id', ensureAuthenticated ,(req, res) =>{
        let {id} = req.params;
        let path = `${req.user.code}/${id}`;
        let share = `localhost:3000/guest-view/${req.user.email}/${id}`
        res.render('imageView' , { nav: authNav , path , id , share});
    });


    //Image Delete 
    index.get('/delete/:id' ,ensureAuthenticated, (req,res)=>{
        const {id} = req.params;
        let path = `${directory}/${req.user.code}/${id}`;
        fs.unlinkSync(path);
        res.redirect('/users/dashboard');
    
       
    });

    //Image Guest View of Image
    index.get('/guest-view/:id/:id1' , (req,res)=>{
        const {id} = req.params;
        const {id1} = req.params;
        let path = `/uploads/${id}/${id1}`;

        fs.access(`${directory}/${path}`, (err) => {
            if (err) {
                res.render('guestimageview' , { nav: nav , 
                    msg : "File does not exist ! File has been either deleted or reuploaded" ,
                    path});
            } else {
                res.render('guestimageview' , { nav: nav , path , user : id , resource : id1});
            }
        });
    });
    

    //Gallary View for Guest
    index.get('/guest-gallary-view/:id', (req , res ) =>{
        let {id} = req.params;
        let dirBuf = Buffer.from(`${directory}/uploads/${id}`);
        let pth = `/uploads/${id}`;
        fs.readdir(dirBuf , (err , files)=>{
            files = files.reverse();
            if(err)
            {
                res.render('guestdashboard' , {
                    msg : 'Error : Files errors',
                    nav,
                    
                });
            }
            else
            {
                res.render('guestdashboard' , {
                    files,
                    path : pth,
                    nav : nav,
                    id
                });
            }
        })
    });

    //route to download a file
    index.get('/download/:id/:id1',(req, res) => {
    var {id} = req.params;
    var {id1} = req.params;
    var fileLocation = `./src/public/${pth}/${id}/${id1}`;
    console.log(fileLocation);
    res.download(fileLocation, id1);
    });

    return index;
}
module.exports = router;
