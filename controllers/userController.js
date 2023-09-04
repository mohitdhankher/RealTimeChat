const User = require('../models/userModel');
const Chat = require('../models/chatModel');
const Group = require('../models/groupModel');
const Member = require('../models/memberModel');
const GroupChat = require("../models/groupChatModel");
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const registerLoad = async(req, res)=>{

    try{
        // const passwordHash = await bcrypt.hash(req.body.password, 10);
        // new UserActivation({
        //     name: req.body.name,
        //     email: req.body.email,
        //     image: 'images/'+req.file.filename,
        //     password: passwordHash
        // });

        // await userModel.save();
        
         res.render('register')
    }catch(error){
          console.log("Hi"+ error.message)
    }
}


const register = async(req, res)=>{
    console.log('register', req.body)
    try{
        const passwordHash = await bcrypt.hash(req.body.password, 10);
        let user;
        if (req.file) {
            user = new User({
                name: req.body.name,
                email: req.body.email,
                image: 'images/' + req.file.filename,
                password: passwordHash
            });
        }
        else {
            user = new User({
                name: req.body.name,
                email: req.body.email,
                password: passwordHash
            });
        }
        await user.save();
         res.render('register', {message:'your registration success!'})
    }catch(error){
          console.log(error.message)
    }
}

const loadLogin = async(req, res)=>{
  
    try{
         res.render('login')
    }catch(error){
          console.log("Hi"+ error.message)
    }
}

const login = async(req, res)=>{
    // req.body.email = 'praveenkumar9@deloitte.com';
    // req.body.password = '12345'
    const { email, password } = req.body;
     console.log('Email', email , JSON.stringify(req.body))
    try {
        const user = await User.findOne({ email }); // Find user by username
        console.log('User', user)
        if (!user) {
            return res.render('login', {message:' User not found'})
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            // Passwords match, consider user authenticated
            // You can set a session or create a JWT token here
            req.session.user = user;
            res.cookie('user', JSON.stringify(user));
            return res.redirect('/dashboard');
            // res.status(200).json({ message: 'Redirecting to the home page.'})
        } else {
            return res.render('login', {message:' Incorrect pass or mail'})   
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const logout = async(req, res)=>{

    try{
         res.clearCookie('user');
         req.session.destroy();
         res.redirect('/')
    }catch(error){
          console.log("Hi"+ error.message)
    }
}

const loadDashboard = async(req, res)=>{

    try{
         const users = await User.find({_id:{$nin:[req.session.user._id]}});
         res.render('dashboard', {user: req.session.user, users:users})
    }catch(error){
          console.log("Hi"+ error.message)
    }
}

const saveChat = async(req, res)=>{
    try{
       
        const chat = new Chat({
            sender_id: req.body.sender_id,
            receiver_id: req.body.receiver_id,
            message: req.body.message,
        });
        var newChat = await chat.save();
        res.status(200).send( {success:true,  msg:'chat inserted!', data:newChat})
    }catch(error){
          console.log("H   i"+ error.message)
          res.status(400).send({success:false, msg: error.message })
    }
}

const deleteChat = async(req, res)=>{
    try{
        await Chat.deleteOne({_id: req.body.id})
        console.log('id deleted', req.body.id);
        res.status(200).send( {success:true})
    }catch(error){
          console.log("H   i"+ error.message)
          res.status(400).send({success:false, msg: error.message })
    }
}

const loadGroups = async(req, res)=>{
    try {
        const groups = await Group.find({ creater_id: req.session.user._id });
        console.log('groupss load -----', groups, req.session.user._id);
        res.render('group', { groups: groups })
    } catch (error) {
        console.log(error.message);
    }
}

const createGroups = async(req, res)=>{
    
    try{
        const group = new Group({
            creater_id: req.session.user._id,
            name: req.body.name,
            image: 'images/'+req.file.filename,
            limit: req.body.limit,
            
        });
        console.log('groupss', group)
        await group.save();

        const groups = await Group.find({creater_id: req.session.user._id});
        console.log('groupss', groups);
         res.render('group', {message: req.body.name+'group created successfully!', groups:groups})
    }catch(error){
          console.log(error.message)
    }
}

const getMembers = async(req, res)=>{
    
    try{
        var users = await User.aggregate([
            {
                 $lookup:{
                    from:'members',
                    localField:"_id",
                    foreignField:"user_id",
                    pipeline:[
                        {
                            $match:{
                                $expr:{
                                    $and:[
                                        {$eq:['$group_id', new mongoose.Types.ObjectId(req.body.group_id)]}
                                    ]
                                }
                             }
                        }
                    ],
                    as:'member'
                 }
            },
            {
                 $match:{
                    "_id":{
                        $nin:[new mongoose.Types.ObjectId(req.session.user._id)]
                    }
                 }
            }
        ])

         res.status(200).send( {success: true, data:users})
    }catch(error){
          console.log(error.message)
    }
}

const addMembers = async(req, res)=>{
    
    try{
        if (!req.body.members) {
            res.status(200).send({ success: false, msg: ' pls select atleast one Member' })
        } else if (req.body.members.length > parseInt(req.body.limit)) {
            res.status(200).send({ success: false, msg: 'you cant select more than ' + req.body.limit + ' member' });
        } else {
            await Member.deleteMany({group_id:req.body.group_id});
            var data=[]
            const members = req.body.members;
            for(let i=0; i<members.length; i++){
                data.push({
                    group_id: req.body.group_id,
                    user_id: members[i]
                });
            }
            await Member.insertMany(data);
            
            res.status(200).send({ success: true, msg: 'Member added succesfully' })
        }
    }catch(error){
          console.log(error.message)
    }
}

const deleteChatGroup = async(req, res)=>{
    try{
        await Group.deleteOne({_id: req.body.id})
        await Member.deleteMany({group_id: req.body.id})
        console.log('id deleted', req.body.id);
        res.status(200).send( {success:true, msg : 'Chat group deleted succesfully'})
    }catch(error){
          console.log("H   i"+ error.message)
          res.status(400).send({success:false, msg: error.message })
    }
}

const groupChats = async(req, res)=>{
    try{
        const myGroups = await Group.find({creater_id: req.session.user._id})
        const joinedGroups = await Member.find({user_id: req.session.user._id}).populate('group_id')
        // console.log('id deleted', req.body.id);
        res.render( 'chat-groups', {myGroups:myGroups, joinedGroups : joinedGroups})
    }catch(error){
          console.log("groups chat "+ error.message)
      
    }
}

const saveGroupChat = async(req, res)=>{
    try{
        const chat = new GroupChat({
            sender_id: req.body.sender_id,
            group_id: req.body.group_id,
            message: req.body.message,
        });
        var newChat = await chat.save();
        res.status(200).send( {success:true, chat:newChat})
    }catch(error){
          console.log("groups chat "+ error.message)
      
    }
}

const loadGroupChat = async(req, res)=>{
    try{
        const groupchats = await GroupChat.find({group_id: req.body.group_id})

        res.send( {success:true, chats:groupchats})
    }catch(error){
          console.log("groups chat "+ error.message)
          res.send( {success:false, msg: error.message})
    }
}

const searchGroup = async(req, res)=>{
    try{
        var search = req.body.search;
        const searchgroup = await Group.find({"name":{$regex: ".*"+search+ ".*", $options:'i'}});
        console.log("search---",searchgroup)
        res.send({success:true, groups: searchgroup })
    }catch(error){
         
          res.status(400).send({success:false, msg: error.message })
    }
}
module.exports = {
    registerLoad,
    register,
    loadLogin,
    login,
    logout,
    loadDashboard,
    saveChat,
    deleteChat,
    loadGroups,
    createGroups,
    getMembers,
    addMembers,
    deleteChatGroup,
    groupChats,
    saveGroupChat,
    loadGroupChat,
    searchGroup
}