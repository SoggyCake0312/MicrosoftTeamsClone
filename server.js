const express = require('express');
const {v4:uuidv4} = require('uuid');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');
const peerServer = ExpressPeerServer(server, {
  debug: true
});

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use('/peerjs',peerServer);

app.get('/',(req,res) => {
    res.redirect(`/${uuidv4()}`);
})

app.get('/:room',(req,res) => {
    res.render('join', {roomID: req.params.room})
})

app.get('/:room/main',(req,res) => {
    res.render('main', {roomID: req.params.room})
})

app.get('/:room/leave', (req,res) => {
    res.render('leave', {roomID: req.params.room})
})

app.get('/:room/chat', (req,res) => {
    res.render('chat', {roomID: req.params.room})
})


var map = new Map();
var users = [];
var presenterID = {};

io.on('connection', socket => {
    socket.on('join-room', (roomID, userID) => {  //simply joining room
        var currUser;
        var currUserID;
        socket.join(roomID);
        socket.to(roomID).emit('user-connected', userID);    //connect to new user
        console.log('user connected', userID);
        socket.on('getRoomID', () => {
            socket.emit('roomID', roomID);
        })
        socket.on('presenter', usrID => {   //stores id of current presenter
            presenterID[roomID] = usrID;
        })
        socket.on('stopScreenShare', screenID => {  //instructs all to reset screen share
            io.to(roomID).emit('stopScreen');
        })
        socket.on('screenStart', username => {   //message in chat for start screen share
            io.to(roomID).emit('scrStart', username);
        })
        socket.on('screenStop', username => {  //message in chat for stop screen share
            io.to(roomID).emit('scrStop', username);
            presenterID[roomID] = -1;
        })
        socket.on('message', (msg, username) => {   //ordinary message
            io.to(roomID).emit('new-message', msg, username);
        })
        socket.on('add-User', (usr, usrID) => {   //once new user joins, all participants get an updated users list
            if(map.has(roomID) === true){
                users = map.get(roomID);
            }
            else{
                users = [];
            }
            currUser = usr;
            currUserID = usrID;
            users.push(usr);
            users.sort(
                function(a, b) {
                  if (a.toLowerCase() < b.toLowerCase()) return -1;
                  if (a.toLowerCase() > b.toLowerCase()) return 1;
                  return 0;
                }
            );
            map.set(roomID, users);
            io.to(roomID).emit('new-User', users);
            io.to(roomID).emit('joined-message', usr);
            console.log('User joined:', usr)
        })
        socket.on('leave', (username) => {  //when a user leaves
            users = map.get(roomID);
            const index = users.indexOf(username);
            if (index > -1){
                users.splice(index, 1);
            }
            map.set(roomID, users);
            if(presenterID[roomID]){
                if(currUserID===presenterID[roomID]){
                    io.to(roomID).emit('stopScreen');
                    io.to(roomID).emit('scrStop', username);
                }
            }
            io.to(roomID).emit('new-User', users);
            io.to(roomID).emit('leave-user', currUserID, username);
            socket.broadcast.to(roomID).emit('user-disconnected', currUserID)
            console.log('User disconnected');
        })
        socket.on('disconnect', () => {  //leaves by closing tab
            if(currUser){
                console.log(currUser);
                users = map.get(roomID);
                const index = users.indexOf(currUser);
                if (index > -1){
                    users.splice(index, 1);
                }
                map.set(roomID, users);
                if(presenterID[roomID]){
                    if(currUserID===presenterID[roomID]){
                        io.to(roomID).emit('stopScreen');
                        io.to(roomID).emit('scrStop', currUser);
                    }
                }
                io.to(roomID).emit('new-User', users);
                io.to(roomID).emit('leave-user', currUserID, currUser);
                socket.broadcast.to(roomID).emit('user-disconnected', currUserID)
                console.log('User disconnected');
            }
        })
    })
})


server.listen(process.env.PORT||443);