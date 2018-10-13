/* eslint-disable no-console */

/**
 * Module dependencies.
 */
const app = require('./app');
const debug = require('debug')('remembr');

const http = require('http');
const SocketIO = require('socket.io');


/**
 * Get port from environment and store in Express.
 */

const port = normalizePort(process.env.PORT || 3000);
app.set('port', port);

/**
 * Create HTTP server.
 */

const server = http.createServer(app);
let io = new SocketIO(server);

var firstClient = '';

var playersInRooms = {};

io.on('connection', (socket) => {
  console.log("got a new connection");
  console.log(socket.id);

  socket.on('disconnect', (reason) => {
    console.log('disconnect reason: ', reason);
  });

  socket.on('room', (room) => {
    console.log(process.common.getJSONObject(room));
    if (!room.roomId || !room.alias) {
      console.log('missing info');
      socket.disconnect(true);
      return;
    }
    var roomId = room.roomId;
    //  todo validate the room
    console.log(`client wants to join room ${roomId}`);

    io.in(roomId).clients((err, clients) => {

      if (err) {
        console.log('error in getting clients: ', err);
        socket.disconnect(true);
        return;
      }

      if (clients.length >= maxPlayers) {
        console.log(`max players allowed is ${maxPlayers}`);
        socket.disconnect(true);
        return;
      }

      socket.join(roomId, () => {
        console.log(`client added to room ${roomId}, socket id is ${socket.id}`);
        console.log('socket client id: ', socket.client.id);

        //  if it's the first guy
        if (clients.length == 0) {
          firstClient = socket.client.id;
        }

        playersInRooms[roomId] = playersInRooms[roomId] || {};
        playersInRooms[roomId].players = playersInRooms[roomId].players || [];
        playersInRooms[roomId].players.push(room.alias);

        console.log(`players in room ${roomId}: ${playersInRooms[roomId].players}`);
  
        //  if all guys are in the room
        if (clients.length == maxPlayers - 1) {
          playersInRooms[roomId]['bookie'] = firstClient;
          console.log(`max players joined: ${JSON.stringify(playersInRooms[roomId])}`);
          io.sockets.in(roomId).emit('joint', playersInRooms[roomId]);
        }

      });
    });
  });

  socket.on('message', messageHandler);
});

var maxPlayers = 2;

var messageHandler = function (message) {
  console.log(`message from socket ${message}`);
};



var getClientsInRoom = function (roomId, callback) {
  io.in(roomId).clients(callback);
};

var maxPlayers = 2;  //  todo put this number in config

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, function () {
  console.log('Express server listening on port ' + server.address().port);
});
server.on('error', onError);
server.on('listening', onListening);


/*
* Normalize a port into a number, string, or false.
*/
/* istanbul ignore next */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

/* istanbul ignore next */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ?
    'Pipe ' + port :
    'Port ' + port;

  // handle specific listen errors with friendly messages
  /* istanbul ignore next */
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

/* istanbul ignore next */
function onListening() {
  const addr = server.address();
  /* istanbul ignore next */
  const bind = typeof addr === 'string' ?
    'pipe ' + addr :
    'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = { server, io };