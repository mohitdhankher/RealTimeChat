// routes/user.js
const express = require('express');
const user_route = express();
const bcrypt = require('bcrypt');
//session
const session = require('express-session');
const {SESSION_SECRET} = process.env;
user_route.use(session({secret:SESSION_SECRET}));
//bodyparser
const bodyParser = require('body-parser');
user_route.use(bodyParser.json());
user_route.use(bodyParser.urlencoded({extended:true}));
//cookie parser
const cookieParser = require('cookie-parser');
user_route.use(cookieParser());
//viewengin
user_route.set('view engine', 'ejs');
user_route.set('views', './views');
//multer for Images
user_route.use(express.static('public'));
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination:function(req,file, cb){
        cb(null, path.join(__dirname, '../public/images'));
    },
    filename:function(req, file, cb){
        const name = Date.now()+ '-' +file.originalname;
        cb(null, name);
    }
});
const upload = multer({storage:storage});
//
const userController = require('../controllers/userController');

//Middleware
const auth = require('../middlewares/auth')
// Admin-only route to create a user
user_route.get('/register', auth.isLogout, userController.registerLoad);
user_route.post('/register', upload.single('image'), userController.register);
user_route.get('/', auth.isLogout,  userController.loadLogin);
user_route.post('/login', userController.login);

user_route.get('/logout', auth.isAuthenticated, userController.logout);
user_route.get('/dashboard', auth.isAuthenticated, userController.loadDashboard);

//group creation
user_route.get('/groups', auth.isAuthenticated, userController.loadGroups);
user_route.post('/groups', upload.single('image'), userController.createGroups);
//adding memmber to group
user_route.post('/get-members', auth.isAuthenticated, userController.getMembers);
user_route.post('/add-members', auth.isAuthenticated, userController.addMembers);

//chat-in - groups 
user_route.get('/group-chat', auth.isAuthenticated, userController.groupChats);
user_route.post('/group-chat-save', userController.saveGroupChat);
user_route.post('/load-group-chats', userController.loadGroupChat);
user_route.post('/delete-chat-group', auth.isAuthenticated, userController.deleteChatGroup);
//one to one chat - socket
user_route.post('/save-chat', userController.saveChat);
user_route.post('/delete-chat', userController.deleteChat);

//search group
user_route.post('/search-group', userController.searchGroup);

user_route.get('*', function(req, res){
    res.redirect('/')
});

module.exports = user_route;