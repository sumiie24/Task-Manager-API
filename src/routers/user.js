const express = require('express')
const User= require('../models/user')
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const { sendWelcomeEmail,sendCancelEmail } = require('../emails/account') 
const router  = new express.Router()

//1 ROUTES writing in the database
router.post('/users', async (req, res)=>{
    const user = new User(req.body)
    try{
        await user.save()

        sendWelcomeEmail( user.email, user.name)

        const token = await user.generateAuthToken()
        res.status(201).send({user,token})
    }
    catch(e){
        res.status(400).send(e)
    }
}) 

//login routing
router.post('/users/login', async (req,res) =>{ 

    try{
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({user,token})
    }
    catch(e){
        res.status(400).send()
    }
})

//logout routing a user BY AUTHHHHHHHHHHHHHH
router.post('/users/logout', auth, async (req,res)=>{
    try{
        req.user.tokens=req.user.tokens.filter( (token) =>{
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    }
    catch(e){
        res.status(500).send()
    }
})


//logging out all user all session BY AUTHHHHHHHHHHHHHH
router.post('/users/logoutAll', auth , async (req,res)=>{
    try{
        req.user.tokens=[]
        await req.user.save()
        res.send()
    }
    catch(e){
        res.status(500).send()
    }
})


// 2 ROUTES fetching all data from the database BY AUTHHHHHHHHHHHHHH
router.get( '/users/me', auth, async (req,res)=>{
    res.send(req.user)
})


//4 ROUTES updating resource for users BY AUTHHHHHHHHHHHHHH
router.patch('/users/me', auth, async (req,res)=>{
    
    const updates= Object.keys(req.body)
    const allowedUpdates= ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update)=> allowedUpdates.includes(update))
   
    if(!isValidOperation){
        return res.status(400).send({error:'Invalid updates'})
    } 

    try{
        updates.forEach(( update) => req.user[update]  = req.body[update])
        await req.user.save()
        res.send(req.user)
    } 
    catch(e){ 
        res.status(400).send(e)
    }
})

//5 ROUTES deleting the user by ID BY AUTHHHHHHHHHHHHHH
router.delete('/users/me', auth, async (req,res)=>{

    try{

       await req.user.remove()
       sendCancelEmail( req.user.email, req.user.name)
       res.send(req.user)
    }
    catch(e){
        res.status(500).send(e)  
    }
})


const upload = multer({
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb){
        if(!file.originalname.match(/\.(jpeg|jpg|png)$/)){
            return cb(new Error('Please upload a image!'))
        }

        cb(undefined,true)
    }
}) 

// ALL CRUD OPERATIONS ON PROFILE PIC
//upload profile pic CREATE PIC & UPDATE PIC
router.post('/users/me/profilepic', auth, upload.single('profilepic'), async (req, res)=>{
    const buffer = await sharp(req.file.buffer).resize({width:250, height:250}).png().toBuffer()
    req.user.profilepic=buffer

    await req.user.save()
    res.send()

}, (error, req, res, next) =>{
    res.status(400).send({ error: error.message})
})

//delete profile pics DELETE PIC
router.delete('/users/me/profilepic', auth, async (req, res)=>{
    req.user.profilepic = undefined
    await req.user.save()
    res.send()
})

// fetch profile pic READ PIC
router.get('/users/:id/profilepic', async (req,res)=>{
    try{
        const user = await User.findById(req.params.id)
        
        if(!user || !user.profilepic){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')
        res.send(user.profilepic)
    }    
    catch(e){
        res.status(404).send()
    }
})


module.exports=router
