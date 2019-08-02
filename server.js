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
let interval;
var usernames = {};
const tableWidth = 500;
const tableHeight = 500;
var diff = 5;
var player1 = {};
var player2 = {};
var rooms = [{name: 'room1', q: 0, max: 2, status: 'waiting...', username: [], gameStatus: 1},
            {name: 'room2', q: 0, max: 2, status: 'waiting...', username: [], gameStatus: 1},
            {name: 'room3', q: 0, max: 4, status: 'waiting...', username: [], gameStatus: 1}];

io.on('connection', socket => {
    console.log(socket.id);
    socket.on('adduser', function(username){
        socket.username = username;
		usernames[username] = username;

        socket.emit('dispRooms', rooms);
	});
    socket.on('switchRoom', function(newroom){
        console.log(newroom)
        var index2 = rooms.findIndex((e) => e.name === newroom);
        if(index2 != -1){
            if(rooms[index2].q==rooms[index2].max){
                //fullgame
            }else{
                var index = rooms.findIndex((e) => e.name === socket.room);
                if (index != -1){
                    rooms[index].q--;
                    socket.leave(socket.room);
                }
                rooms[index2].q++;
                rooms[index2].username.push(socket.username)
                socket.join(newroom);
                socket.room = newroom;
                socket.roomId = index2;
                if(rooms[index2].q==rooms[index2].max){
                    io.in(socket.room).emit('ready', true);
                }
                updateRoom();
                socket.emit('dispRooms', rooms);
                socket.broadcast.emit('dispRooms', rooms);
            }
        }
    });
    /////game
    socket.on('controle', function (ctrl) {
        if(socket.username==player1.name){
            switch(ctrl){
                case 3:
                    if(player1.dir!=2){
                        player1.dir = 3;
                    } //seta pra cima
                    break;
                case 1:
                    if(player1.dir!=0){
                        player1.dir = 1;
                    } //direita
                    break;
                case 2:
                    if(player1.dir!=3){
                        player1.dir = 2;
                    } //baixo
                    break;
                case 0:
                    if(player1.dir!=1){
                        player1.dir = 0;
                    } //esquerda
                    break;
            }
        }else{
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
        }
        io.in(socket.room).emit('table', {player1,player2});
        console.log(ctrl, socket.room,socket.roomId, socket.username)
    });
    socket.on('go', function(){
        var index = rooms.findIndex((e) => e.name === socket.room);     
        start(rooms[index].username[0],rooms[index].username[1]);
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

    function start(name1,name2){
        console.log(name1,name2)
        player1 = {
            position: {
                y: 30,
                x: 10
            },
            dir: 1,
            trail: [],
            name: name1
        }
        player2 = {
            position: {
                y: 130,
                x: tableWidth - 10
            },
            dir: 0,
            trail: [],
            name: name2
        };
        interval = setInterval(movePlayers, 50);
    }
    function endGame(player){
        clearInterval(interval);
        interval = null;
        if(player==3){
            rooms[socket.roomId].gameStatus = 4;
        }else{
            if(player==1)rooms[socket.roomId].gameStatus = 2;
            if(player==2)rooms[socket.roomId].gameStatus = 3;
    
        }
        player1 = {};
        player2 = {};
        io.in(socket.room).emit('table', {status: rooms[socket.roomId].gameStatus});
    }
    function movePlayers(){
        if(player1.dir==1)// 1 = direita
            player1.position.x+=diff;
        if(player2.dir==1)
            player2.position.x+=diff;
        if(player2.dir==0) //0== esquerda
            player2.position.x-=diff;
        if(player1.dir==0)
            player1.position.x-=diff;
        
        if(player1.dir==2) //2 baixo
            player1.position.y+=diff;
        if(player2.dir==2)
            player2.position.y+=diff;
        if(player2.dir==3) //3 cima
            player2.position.y-=diff;
        if(player1.dir==3)
            player1.position.y-=diff;
    
        player1.trail.push({x:player1.position.x,y:player1.position.y})
        player2.trail.push({x:player2.position.x,y:player2.position.y})
        var cont = 0;
        if(player1.position.y > tableHeight || player1.position.y < 0 || player1.position.x > tableWidth || player1.position.x < 0){
            cont=2;
        }
        if(player2.position.y > tableHeight || player2.position.y < 0 || player2.position.x > tableWidth || player2.position.x < 0){
            if(cont == 2)
                cont = 3;
            else
                cont = 1;
        }
        if(cont>0){
            endGame(cont);
        }
        io.in(socket.room).emit('table', {player1,player2, status: rooms[socket.roomId].gameStatus});
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
});


server.listen(process.env.PORT || 3000);