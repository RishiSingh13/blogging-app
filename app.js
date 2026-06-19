const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();
const jwt =require("jsonwebtoken")
const path = require('path');
const bcrypt=require('bcrypt')
const userModel=require("./models/user")
const postModel=require("./models/post")
app.set('view engine', 'ejs')
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())




app.get('/',(req, res) => {
    res.render('index');
})

app.get('/login', (req, res) => {
    res.render('login');
})


app.post('/register', async(req, res) => {
    let {email,password,username,name}=req.body
   let user= await userModel.findOne({email});
   if(user) {
    return res.status(500).send("user already there")
   }
   bcrypt.genSalt(10,(err,salt)=>{
    bcrypt.hash(password,salt,async (err,hash)=>{
      let user= await  userModel.create({
            username,
            name,
            email,
            password:hash
        })
       let token= jwt.sign({email:email,userid:user._id},"shhhhhh")
        res.cookie("token",token)
        res.redirect("/login")
        
    })
   })
})

app.post('/login',async(req, res) => {
    let {email,password}=req.body
   let user= await userModel.findOne({email});
   if(!user) {
    return res.status(500).send("soomthing went wrong")
   }
    bcrypt.compare(password,user.password,(err,result)=>{
        if(result){
             let token= jwt.sign({email:email,userid:user._id},"shhhhhh")
        res.cookie("token",token)
            res.status(200).redirect("/profile")
        } else res.redirect("/")
    })
      
    
        
    })

app.get("/logout",(req,res)=>{
    res.clearCookie("token")
    res.redirect("/login")
}) 


 app.get("/profile",islooogedIn,async(req,res)=>{
let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
let post= await postModel.find()
res.render("profile", { user,post});
 })

 app.get("/like/:id",islooogedIn,async(req,res)=>{
let post = await postModel
    .findOne({ _id : req.params.id })
    .populate("user");
 if(post.likes.indexOf(req.user.userid)===-1){
post.likes.push(req.user.userid)
 }   
else{
    post.likes.splice(post.likes.indexOf(req.user.userid),1)
}

await post.save();
res.redirect("/profile");
 })

 app.get("/edit/:id",islooogedIn,async(req,res)=>{
let post = await postModel
    .findOne({ _id : req.params.id })
    .populate("user");
res.render("edit",{post})
 })


  app.post("/update/:id",islooogedIn,async(req,res)=>{
let post = await postModel
    .findOneAndUpdate({ _id : req.params.id },{content:req.body.content})
    .populate("user");
res.redirect("/profile")
 })     


app.post("/post",islooogedIn,async(req,res)=>{
let user= await userModel.findOne({email:req.user.email})
let post = await postModel.create({
    user:user._id,
    content:req.body.content

})
 
user.posts.push(post._id);
await user.save()
res.redirect("/profile") 
 })

function islooogedIn(req,res,next){
    if(!req.cookies.token){
       return res.redirect("/login")
    } else{
        let data= jwt.verify(req.cookies.token,"shhhhhh")
        req.user=data;
    }
    
        next(); 

}

app.listen(3000)