var socket = io('http://localhost:3000');
const tableWidth = 91;
const tableHeight = 71;
const ColorsPalette = [{"r":7,"g":7,"b":7},{"r":255,"g":7,"b":7},{"r":7,"g":7,"b":255}];
var username;
var gameOver = false;
var whichPlayerLost = 0;

var players = [];
var trail1 =[];
var trail2 =[];
const diff = 5;
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

function setup(){
    socket.on('ready',  function (start){
        $('.login').remove();
        let timerInterval
        Swal.fire({
            title: 'Começando jogo',
            html: 'Jogo começando em <strong></strong> segundos.',
            allowOutsideClick: false,
            timer: 5000,
            onBeforeOpen: () => {
                Swal.showLoading()
                timerInterval = setInterval(() => {
                Swal.getContent().querySelector('strong')
                    .textContent = parseInt(Swal.getTimerLeft()/1000);
                }, 100);
                var canvas = createCanvas(500, 500);
                frameRate(15);
                stroke(255);
                strokeWeight(10);
                canvas.parent('sketch-holder');
                background(0);
            },
            onClose: () => {
                clearInterval(timerInterval)
            }
            }).then(() => {
                socket.emit('go', true);
    
        })
    });


}
function draw(){
    fill(color(50, 50, 255));
    noStroke();
    for (var i = 0; i < trail1.length; i++) {
        rect(trail1[i].x, trail1[i].y, diff, diff);
    }
    fill(color(255, 50, 50));
    for (var i = 0; i < trail2.length; i++) {
        rect(trail2[i].x, trail2[i].y, diff, diff);
    }
}
socket.on('table',  function (tb){
    // draw each segment of trail
    //rect(tb.player1.position.x, tb.player1.position.y, diff, diff);
    console.log(tb)
    if(tb.status == 1){
        var pos1 = {
            x: constrain(tb.player1.position.x, 0, width - diff), 
            y: constrain(tb.player1.position.y, 0, height - diff),
        }
        var pos2 = {
            x: constrain(tb.player2.position.x, 0, width - diff), 
            y: constrain(tb.player2.position.y, 0, height - diff),
        }
        trail1.push(pos1);
        trail2.push(pos2);
    }else{
        if(tb.status==2){
            alert('Jogador 1 ganhou')
        }
        if(tb.status==3){
            alert('Jogador 2 ganhou')
        }
        if(tb.status==4){
            alert('Empate')
        }
    }
});

function switchRoom(room){
    socket.emit('switchRoom', room);
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