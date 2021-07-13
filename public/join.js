//For username input
var username = localStorage.getItem('username');
if(username===null){
    username = 'Anonymous';
}
document.getElementById('currUser').innerHTML = `<span>Current Username: <b>${username}</b></span>`
let inp = $("#user_name");
$('html').keydown((e) => {
    if(e.which == 13 && inp.val().trim().length !== 0){
        console.log('Name: ',inp.val().trim());
        username = inp.val().trim();
        inp.val('');
        localStorage.setItem('username', username);
        window.location.href = `/${ROOM_ID}/main`;
    }
})

const joinmeet = () => {
    if(inp.val().trim().length!==0){
        console.log('Name: ',inp.val().trim());
        username = inp.val().trim();
        inp.val('');
        localStorage.setItem('username', username);
    }
    else{
        console.log('Name: ', username);
        inp.val('');
    }
    window.location.href = `/${ROOM_ID}/main`;
}

const chat = () => {
    if(inp.val().trim().length!==0){
        console.log('Name: ',inp.val().trim());
        username = inp.val().trim();
        inp.val('');
        localStorage.setItem('username', username);
    }
    else{
        console.log('Name: ', username);
        inp.val('');
    }
    window.location.href = `/${ROOM_ID}/chat`;
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