const socket = io('/');
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443' //change to 443 for deploy
});
const videoGrid =  document.getElementById('video-grid');
const vid = document.createElement('video');
let screenShareElement = document.getElementById('screen-share');
vid.muted = true;
let roomID;
var username = localStorage.getItem('username');
if(username===null){
    username = 'Anonymous';
}
console.log('username is:', username);  

let screenStream;
const peers = {};
let myID;
let stream;
var users = [];

let getUserMedia = navigator.mediaDevices.getUserMedia({ //own video
    video: true,
    audio: true
})

const startfunc = async () => {
    stream = await getUserMedia;
    addVideo(vid, stream, myID);
    try{
        stream.getAudioTracks()[0].enabled = false;
        stream.getVideoTracks()[0].enabled = false;
    }catch(err){console.log(err)}
    console.log('Own video visible');
    socket.emit('join-room', ROOM_ID, myID);
    socket.emit('add-User', username, myID);
    
}

socket.on('user-connected', (userID) => {
    console.log('user-connected')
    newUser(userID, stream);
})

peer.on('call', function(call){  //when someone else calls you
    console.log('I have been called');
    let checkForScreen = 0;
    if(peers[call.peer]) checkForScreen = 1;
    console.log('check for screen:',checkForScreen);
    if(checkForScreen===0) peers[call.peer] = call;
    call.answer(stream);
    const video = document.createElement('video');
    call.on('stream', function(remoteStream){
        if(checkForScreen===0) addVideo(video, remoteStream, call.peer);
        else setScreen(screenShareElement, remoteStream, call.peer);
    })
})

// setTimeout(function(){
    startfunc();
// }, 1000); 

peer.on('open', ID => {
    myID = ID; 
})

const newUser = (userID, streams) => {  //to call new user
    console.log(streams);
    console.log('New user', userID);
    const call = peer.call(userID, streams);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
        addVideo(video, userVideoStream, userID);
    })
    call.on('close', () => {
        video.remove();
    })
    peers[userID] = call;
    if(screenShare===1){
        peer.call(userID, screenStream);
    }
}

let screenShare = 0;

const screenShareFunc = async () => {  //screen share function
    screenShare = 1-screenShare;
    if(screenShare===1){
        socket.emit('stopScreenShare')
        socket.emit('presenter', myID);
        console.log('start screen share')
        screenStream = await getScreenMedia();
        screenShareElement.srcObject = screenStream;
        let UserIDList = Object.keys(peers);
        console.log(peers);
        for(let i of UserIDList){
            peer.call(i, screenStream);
            console.log('called ', i);
        }
        socket.emit('screenStart', username);
        screenShareElement.style.display = 'flex';
        document.getElementById('scrButton').style.color = 'red';
        screenShare = 1;
        screenShareElement.addEventListener('loadedmetadata', () => {
            screenShareElement.play();
        }) 
        screenStream.getVideoTracks()[0].onended = () => {
            stopScreenShare();
            console.log('stop screen share');
            screenShareElement.style.display = 'none';
            screenShare = 0;
            socket.emit('stopScreenShare');
            socket.emit('screenStop', username);
            document.getElementById('scrButton').style.color = 'black';
        }
    }
    else{
        socket.emit('stopScreenShare');
        stopScreenShare();
        socket.emit('screenStop', username);
    }
}

async function getScreenMedia(){
    return navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "always"
        },
        audio: false})
}

async function stopScreenShare(){  //reset screen share
    try{
        let tracks = screenShareElement.srcObject.getTracks();
        tracks.forEach(track => track.stop());
    }catch(err){}
    screenShareElement.style.display = 'none';
    
    screenShareElement.srcObject = null;
    screenShare = 0;
    document.getElementById('scrButton').style.color = 'black';
}

socket.on('stopScreen', () => {
    stopScreenShare();
})

const addVideo = (video1, streams, userID) => {  //append video to grid
    console.log('addVideo called');
    video1.srcObject = streams;
    video1.addEventListener('loadedmetadata', () => {
        video1.play();
    }) 
    video1.id = userID;
    video1.class = "normal";
    videoGrid.append(video1);
}

const setScreen = (scrElement, streams, userID) => {  //display screen share
    console.log('setScreen called');
    scrElement.srcObject = streams;
    console.log(streams, 'is the stream for screen share')
    scrElement.style.display = 'flex';
    screenShareElement.addEventListener('loadedmetadata', () => {
        screenShareElement.play();
    }) 
}

//For chatbox input
let msg = $("#chat_box");
$('html').keydown((e) => {
    if(e.which == 13 && msg.val().trim().length !== 0){
        console.log('Message:', msg.val().trim());
        socket.emit('message', msg.val().trim(), username);
        msg.val('');
    }
})

const sendMessage = () => {
    if(msg.val().trim().length !== 0){
        console.log('Message:', msg.val().trim());
        socket.emit('message', msg.val().trim(), username);
        msg.val('');
    }
}

//For username input
// let inp = $("#user_name");
// $('html').keydown((e) => {
//     if(e.which == 13 && inp.val().trim().length !== 0){
//         console.log('Name: ',inp.val().trim());
//         username = inp.val().trim();
//         inp.val('');
//         showMain();
//         sendUsername(username);
//     }
// })

// const enterInput = () => {
//     if(inp.val().trim().length!==0){
//         console.log('Name: ',inp.val().trim());
//         username = inp.val().trim();
//         inp.val('');
//         showMain();
//     }
//     else{
//         console.log('Name: ', username);
//         inp.val('');
//         showMain();
//     }
//     sendUsername(username);
// }

// const setUsername = () => {
//     if(inp.val().trim().length!==0){
//         console.log('Username set: ', inp.val().trim());
//         username = inp.val().trim();
//         inp.val('');
//         document.getElementById('currUser').innerHTML = `<span>Current Username: <b>${username}</b></span>`;
//     }
// }

var start = new Date();

// const sendUsername = (usr) => {
//     var end = new Date();
//     var diff = end - start;
//     console.log(diff);
//     setTimeout(function(){
//         addVideo(vid, vidStream, myID);
//         socket.emit('join-room', ROOM_ID, myID);
//         console.log('sendUsername called', usr);
//         socket.emit('add-User', usr, myID);
//     }, 1500-diff);  
//     sessionStorage.username = 'usr';
// }

socket.on('new-message', (message, user) => {  //listens for new messages and adds them to chat
    var time = getTime();
    $('.messages').append(`<li class = "message"><div class="vs1"></div><b>${user}</b> <div class="time">${time}</div><br/>${message}</li>`)
    scrollBottom();
})

const getTime = () => {  // gets time in 12 hr format
    var today = new Date();
    var time;
    var mins = today.getMinutes();
    var hours = today.getHours();
    if(mins<10 && mins>0){
        mins = "0"+mins;
    }
    else if(mins === 0){
        mins = "00";
    }
    if(hours>12){
        time = (hours-12) + ":" + mins + " PM";
    }
    else if(hours===12){
        time = hours + ":" + mins + " PM";
    }
    else if(hours===0){
        time = "12" + ":" + mins + " AM";
    }
    else{
        time = hours + ":" + mins + " AM";
    }
    return time;
}

socket.on('new-User', list => {  //listens for updated user list
    console.log(list);
    document.querySelector('.users_list').innerHTML = "";
    $('.users_list').append(`<br/>`);
    for(let i of list){
        $('.users_list').append(`<li class = "user"><b>${i}</b><div class="vs1"></div></li>`);
    }
    var usersnum = list.length;
    document.getElementById('chat_header').innerHTML = `<span>Users(${usersnum})</span>`
}) 

socket.on('scrStart', usr => {  //chat for starting screen share
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usr}</b> started presenting<div class="vs2"></div></li>`);
    scrollBottom();
})

socket.on('scrStop', usr => {  // chat for stopping screen share
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usr}</b> stopped presenting<div class="vs2"></div></li>`);
    scrollBottom();
})

socket.on('joined-message', usrnm => {  //user joined message
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usrnm}</b> joined<div class="vs2"></div></li>`);
    scrollBottom();
})

socket.on('user-disconnected', userID => {  //cut call if another user leaves
    if(peers[userID]) peers[userID].close();
    console.log('user disconnected function called', userID);
})

const scrollBottom = () => {  //function to scroll to the bottom in case of overflow
    var sc = $('.chat_window');
    sc.scrollTop(sc.prop("scrollHeight"));
}

const muteFunc = () => { //toggle microphone
    try{
        const enabled = stream.getAudioTracks()[0].enabled;
        if(enabled){
            document.querySelector('.micButton').innerHTML = `<i class="fas fa-microphone-slash"></i>`;
            stream.getAudioTracks()[0].enabled = false;
        } 
        else{
            document.querySelector('.micButton').innerHTML = `<i class="fas fa-microphone"></i>`;
            stream.getAudioTracks()[0].enabled = true;
        }
    }catch(err){}
}

const vidFunc = () => { // toggle video
    try{
        const enabled = stream.getVideoTracks()[0].enabled;
        if(enabled){
            document.querySelector('.vidButton').innerHTML = `<i class="fas fa-video-slash"></i>`;
            stream.getVideoTracks()[0].enabled = false;
        } 
        else{
            document.querySelector('.vidButton').innerHTML = `<i class="fas fa-video"></i>`;
            stream.getVideoTracks()[0].enabled = true;
        }
    }catch(err){}
}

const toggleChat = () => {  // open/close chat window
    var main_right = document.getElementById('main_right');
    var main_chat = document.getElementById('main_chat');
    var main_users = document.getElementById('main_users');
    if(main_chat.style.display === 'none'){
        main_right.style.display = 'flex';
        main_chat.style.display = 'flex';
        main_users.style.display = 'none';
    }
    else{
        main_right.style.display = 'none';
        main_chat.style.display = 'none';
        main_users.style.display = 'none';
    }
}

document.getElementById('main_users').style.display = 'none';

const toggleUsers = () => {  // open/close users window
    console.log('toggleUsers');
    var main_right = document.getElementById('main_right');
    var main_chat = document.getElementById('main_chat');
    var main_users = document.getElementById('main_users');
    if(main_users.style.display === 'none'){
        console.log('style is none')
        main_right.style.display = 'flex';
        main_chat.style.display = 'none';
        main_users.style.display = 'flex';
    }
    else{
        console.log('style is ')
        main_right.style.display = 'none';
        main_users.style.display = 'none';
        main_chat.style.display = 'none';
    }
}

const leaveMeeting = () => { // leave meeting button
    // socket.emit('leave', username);
    console.log(username, 'left meeting');
    window.location.href = `/${ROOM_ID}/leave`;
}

socket.on('leave-user', (usrID, usernm) => {  //left meeting message
    try{
        document.getElementById(usrID).outerHTML = "";
    }catch(err){}
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usernm}</b> left<div class="vs2"></div></li>`);
    scrollBottom();
})