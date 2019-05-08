const validator = require('validator')
const mongoose = require('mongoose') //importing the mongoose
const bcrypt = require('bcryptjs')
const jwt= require('jsonwebtoken')
const Task = require('./task')

//Schema Method
//pass this to models second argument
//Separate Schmea
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required: true,
        trim: true
    },
    password:{
        trim:true,
        required: true,
        type:String,
        minlength:7,
        validate(value){
            if(value.toLowerCase().includes('password')){
                throw new Error('Password cannot contain "password"')
            }
        }
    },
    email:{ 
        type:String,
        unique:true,
        required:true,
        trim: true,
        lowercase: true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid')
            }
        } 
    },
    age:{
        type:Number,
        default: 0,
        validate(value){
            if(value<0){
                throw new Error('Age must be a positive number')
            }
        }
    },
    tokens: [{
        token:{
            type:String,
            required:true
        }
    }],
    profilepic:{
        type:Buffer
    }
},
    {
        timestamps: true
})

userSchema.virtual('tasks',{
    ref:'Task',
    localField:'_id',
    foreignField:'owner'
})

userSchema.methods.toJSON = function(){
    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens

    return userObject
}

userSchema.methods.generateAuthToken= async function(){
    const user = this
    const token= jwt.sign( {_id: user._id.toString()}, process.env.JWT_SECRET)
    
   // saving to the database
    user.tokens= user.tokens.concat({token})
    await user.save()
    
    return token
}


userSchema.statics.findByCredentials = async (email, password) =>{
    const user = await User.findOne({email})

    if(!user){
        throw new Error('Unable to Login')
    }

    const isMatch= await bcrypt.compare(password,user.password)

    if(!isMatch){
        throw new Error('Unable to Login')
    }

    return user
}


// Hash the plain text password before saving
//normal function , not arrow function used
userSchema.pre('save', async function (next) {
    const user =this

    //below will be true when user is first created and also when user is being updated
    if(user.isModified('password')){
        user.password= await bcrypt.hash(user.password,8)
    }

    next()
    // if we never call next it will be hang forever
})

//Delete user Tasks when user is removed    
userSchema.pre('remove', async function(next){
    const user = this
    await Task.deleteMany({ owner: user._id})
    
    next()
})


//Separate Model
const User= mongoose.model('User',userSchema)

module.exports = User