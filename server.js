const express = require('express');
const path = require('path');

const  app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server)

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

app.use('/', (req, res) => {
    res.render('index.html');
});

var usernames = {};
var rooms = ['room1','room2','room3'];

io.on('connection', socket => {
    console.log(socket.id);
    
    socket.emit('dispRooms', rooms);
    socket.on('create', function (room) {
        console.log(socket.room)
        socket.join(room);
    });

});

server.listen(process.env.PORT || 3000);