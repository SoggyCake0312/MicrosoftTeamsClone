const socket = io('/');
var peer = new Peer(undefined, {
    path: '/peerjs',
    host: '/',
    port: '443' //change to 443 for deploy
});

let myID;
var users = [];
var username = localStorage.getItem('username');
if(username===null){
    username = 'Anonymous';
}
username = username+'*';
console.log('username is: ', username);
console.log(ROOM_ID, ' : roomID')
socket.emit('join-room', ROOM_ID, myID);

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


var start = new Date();

socket.on('new-message', (message, user) => {
    var time = getTime();
    $('.messages').append(`<li class = "message"><div class="vs1"></div><b>${user}</b> <div class="time">${time}</div><br/>${message}</li>`)
    scrollBottom();
})

const getTime = () => {
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

socket.on('new-User', list => {
    var usersnum = list.length;
    if(usersnum===1)
        document.getElementById('chat_header').innerHTML = `<span>Chat(${usersnum} participant)</span>`
    else
        document.getElementById('chat_header').innerHTML = `<span>Chat(${usersnum} participants)</span>`
}) 

socket.on('scrStart', usr => {
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usr}</b> started presenting<div class="vs2"></div></li>`);
    scrollBottom();
})

socket.on('scrStop', usr => {
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usr}</b> stopped presenting<div class="vs2"></div></li>`);
    scrollBottom();
})

socket.on('joined-message', usrnm => {
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usrnm}</b> joined<div class="vs2"></div></li>`);
    scrollBottom();
})

const scrollBottom = () => {
    var sc = $('.chat_window');
    sc.scrollTop(sc.prop("scrollHeight"));
}

const toggleChat = () => {
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

const toggleUsers = () => {
    var main_right = document.getElementById('main_right');
    var main_chat = document.getElementById('main_chat');
    var main_users = document.getElementById('main_users');
    if(main_users.style.display === 'none'){
        main_right.style.display = 'flex';
        main_chat.style.display = 'none';
        main_users.style.display = 'flex';
    }
    else{
        main_right.style.display = 'none';
        main_users.style.display = 'none';
        main_chat.style.display = 'none';
    }
}

socket.on('leave-user', (usrID, usernm) => {
    try{
        document.getElementById(usrID).outerHTML = "";
    }catch(err){}
    $('.messages').append(`<li class = "joinedmessage"><div class="vs1"></div><b>${usernm}</b> left<div class="vs2"></div></li>`);
    scrollBottom();
})

const rejoin = () => {
    window.location.href = `/${ROOM_ID}`;
}

const copyURL = () => {
    var input = document.createElement('textarea');
    input.innerHTML = window.location.origin+"/"+ROOM_ID;
    document.body.appendChild(input);
    input.select();
    var result = document.execCommand('copy');
    document.body.removeChild(input);
    alert('Link has been copied to clipboard. Share it with others to join the same meet!')
    return result;
}