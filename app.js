require('dotenv').config();
const User = require('./models/userModel');
const Chat = require('./models/chatModel');
//database // express
const db = require('./connection');
const app = require('express')();
// app.set('view engine', 'ejs');
// app.set('views', './views');

//routes
const userRoute = require('./routes/userRoute');
app.use('/', userRoute);

const http = require('http').Server(app);

//socket 
const io = require('socket.io')(http);
var usp = io.of('/user-namespace');

usp.on('connection', async function(socket){
    console.log('User Socket connected');
    var userId = socket.handshake.auth.token;
    //boradcast user
    socket.broadcast.emit('getOnlineUser', {user_id:userId});
    await User.findByIdAndUpdate({_id:userId}, {$set:{is_online:'1'}})
    socket.on('disconnect',async function(){
        console.log('User Socket disconnected');
        var userId = socket.handshake.auth.token
        await User.findByIdAndUpdate({_id:userId}, {$set:{is_online:'0'}}) 
        
        socket.broadcast.emit('getOfflineUser', {user_id:userId});
    })

    //chat 
    socket.on('newChat', function(data){
        socket.broadcast.emit('loadNewChat', data);
    })

    //load exiting chat
    socket.on('loadOldChats', async function(data){
       var chats = await Chat.find({$or:[
            {
                sender_id : data.sender_id, receiver_id: data.receiver_id
            },
            {
                sender_id : data.receiver_id, receiver_id: data.sender_id
            }
        ]})

        socket.emit('loadChats', {chats:chats});
    });

      //delete exiting chat
      socket.on('chatDeleted', async function(id){
         socket.broadcast.emit('deleteChatMessage', id);
     });

     socket.on('newGroupChat',  function(data){
        socket.broadcast.emit('loadNewGroupChat', data);
    });
})




db.once('open', () => {
    http.listen(3000, function(){
        console.log(`API server running on port ${3000}!`);
    })
  });