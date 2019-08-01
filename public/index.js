var socket = io('http://localhost:3000');
const tableWidth = 91;
const tableHeight = 71;
const ColorsPalette = [{"r":7,"g":7,"b":7},{"r":255,"g":7,"b":7},{"r":7,"g":7,"b":255}];
var username;

const pr = document.getElementById("root");

socket.on('connect', function(){
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    Swal.fire({
        title: 'Digite seu nome:',
        input: 'text',
        width: 600,
        padding: '3em',
        allowOutsideClick: false,
        backdrop: `
            rgba(0,0,123,0.4)
            url("https://sweetalert2.github.io/images/nyan-cat.gif")
            center left
            no-repeat
        `,
        showCancelButton: false,
        confirmButtonText: 'Entrar',
        preConfirm: (name) => {
            username = name;
            socket.emit('adduser', username);
        }
    })
});


socket.on('dispRooms', function(rooms) {
    $('.sv').remove();
    for(room of rooms){
        $('.servers').append('<div class="sv" onclick=switchRoom("'+room.name+'")>'+
            room.name+'<span class="svStatus">'+room.status+'</span>'+'<span class="spanR">'+room.q+'/'+room.max+'</span></div>')
    }
})
socket.on('ready',  function (start){
    $('.servers').remove();
    let timerInterval
    Swal.fire({
        title: 'Começando jogo',
        html: 'Jogo começando em <strong></strong> segundos.',
        allowOutsideClick: false,
        timer: 10000,
        onBeforeOpen: () => {
            Swal.showLoading()
            timerInterval = setInterval(() => {
            Swal.getContent().querySelector('strong')
                .textContent = parseInt(Swal.getTimerLeft()/1000);
            }, 100)
        },
        onClose: () => {
            clearInterval(timerInterval)
        }
        }).then(() => {
            socket.emit('go', true);

    })
});
socket.on('table',  function (tb){

    render(tb);
});
function switchRoom(room){
    socket.emit('switchRoom', room);
}
function render(PlayerArray){
    let html = '<table cellpadding=0 cellspacing=0>';
    for(let i = 0; i < tableHeight; i++){
        html += '<tr>';
        for(let j = 0; j < tableWidth; j++){
            html += '<td style="background-color:rgb('+ ColorsPalette[PlayerArray[i][j]].r+','+ ColorsPalette[PlayerArray[i][j]].g + ','+ColorsPalette[PlayerArray[i][j]].b+')">';
            html += '</td>';
        }
        html += '</tr>';
    }
    html += '</table>';

    pr.innerHTML = html;
}

function controles(e, event){
    switch(e.keyCode){//pega o movimento
        case 38:
            socket.emit('controle', 3);
            //seta pra cima
            e.preventDefault();
            break;
        case 39:
            socket.emit('controle', 1);
            //direita
            e.preventDefault();
            break;
        case 40:
            socket.emit('controle', 2);
            //baixo
            e.preventDefault();
            break;
        case 37:
            socket.emit('controle', 0);
            //esquerda
            e.preventDefault();
            break;

    }
}
document.onkeydown = controles;