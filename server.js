const express = require('express');
const path = require('path');

const  app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});
var interval;
const PlayerArray = [];
var usernames = {};
const tableWidth = 91;
const tableHeight = 71;
var player1 = {};
var player2 = {};
var rooms = [{name: 'room1', q: 0, max: 2, status: 'waiting...'},
            {name: 'room2', q: 0, max: 2, status: 'waiting...'},
            {name: 'room3', q: 0, max: 4, status: 'waiting...'},];

io.on('connection', socket => {
    console.log(socket.id);
    socket.on('adduser', function(username){
        socket.username = username;
		usernames[username] = username;

        socket.emit('dispRooms', rooms);
	});
    socket.on('switchRoom', function(newroom){
        var index2 = rooms.findIndex((e) => e.name === newroom);
        if(rooms[index2].q==rooms[index2].max){
            //fullgame
        }else{
            var index = rooms.findIndex((e) => e.name === socket.room);
            if (index != -1){
                rooms[index].q--;
            }
            socket.leave(socket.room);

            rooms[index2].q++;
            socket.join(newroom);
            socket.room = newroom;
            if(rooms[index2].q==rooms[index2].max){
                io.in(socket.room).emit('ready', true);
            }
            updateRoom();
            socket.emit('dispRooms', rooms);
            socket.broadcast.emit('dispRooms', rooms);
        }
    });
    /////game
    socket.on('controle', function (ctrl) {
        switch(ctrl){
            case 3:
                if(player2.dir!=2){
                    player2.dir = 3;
                } //seta pra cima
                break;
            case 1:
                if(player2.dir!=0){
                    player2.dir = 1;
                } //direita
                break;
            case 2:
                if(player2.dir!=3){
                    player2.dir = 2;
                } //baixo
                break;
            case 0:
                if(player2.dir!=1){
                    player2.dir = 0;
                } //esquerda
                break;
        }
        console.log(ctrl, socket.room)
    });
    socket.on('go', function(){
        start();
        setInterval(function(){
            movePlayers();
            io.in(socket.room).emit('table', PlayerArray);
        }, 500);
    })


    socket.on('disconnect', function(){
		// remove the username from global usernames list
		delete usernames[socket.username];

        var index = rooms.findIndex((e) => e.name === socket.room);
        if (index != -1){
            rooms[index].q--;
        }
        socket.leave(socket.room);
        updateRoom();
        socket.emit('dispRooms', rooms);
		socket.broadcast.emit('dispRooms', rooms);
	});

});
function start(){
    player1 = {
        position: {
            y: 30,
            x: 10
        },
        dir: 1,
    }
    player2 = {
        position: {
            y: 30,
            x: tableWidth - 10
        },
        dir: 0,
    };
    createStructure();
    createPlayers();
}
function createStructure(){
    for(let i=0; i< tableHeight; i++){
        PlayerArray[i] = []
        for(let j =0; j< tableWidth; j++){
            PlayerArray[i][j] = 0;
        }
    }
}
function createPlayers(){
    PlayerArray[player1.position.y][player1.position.x] = 1;
    PlayerArray[player2.position.y][player2.position.x] = 2;
}
function movePlayers(){
    if(player1.dir==1)// 1 = direita
        player1.position.x++;
    if(player2.dir==1)
        player2.position.x++;
    if(player2.dir==0) //0== esquerda
        player2.position.x--;
    if(player1.dir==0)
        player1.position.x--;
    
    if(player1.dir==2) //2 baixo
        player1.position.y++;
    if(player2.dir==2)
        player2.position.y++;
    if(player2.dir==3) //3 cima
        player2.position.y--;
    if(player1.dir==3)
        player1.position.y--;

    var cont = 0;
    if(player1.position.y > tableHeight || player1.position.y < 0 || player1.position.x > tableWidth || player1.position.x < 0 || PlayerArray[player1.position.y][player1.position.x]!=0){
        cont=2;
    }else{
        PlayerArray[player1.position.y][player1.position.x] = 1;
    }
    if(player2.position.y > tableHeight || player2.position.y < 0 || player2.position.x > tableWidth || player2.position.x < 0 || PlayerArray[player2.position.y][player2.position.x]!=0){
        if(cont == 2)
            cont = 3;
        else
            cont = 1;
    }else{
        PlayerArray[player2.position.y][player2.position.x] = 2;
    }
    if(cont>0){
        //endGame(cont);
    }
}
function updateRoom(){
    for(room of rooms){
        if(room.q == room.max){
            room.status = 'ready';
        }else{
            room.status = 'waiting...';  
        }
    }
}

server.listen(process.env.PORT || 3000);