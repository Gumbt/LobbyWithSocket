var socket = io('http://localhost:3000');

socket.emit('create', 'room1');

socket.on('dispRooms', function(rooms) {
    for(room of rooms){
        $('.servers').append('<div class="sv">'+room+'</div>')
    }
})