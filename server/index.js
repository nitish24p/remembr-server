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

io.on('connection', (socket) => {

  console.log('user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });


  socket.on('error', (error) => {
    console.log(error);
  });

  socket.on('place-bid', (bidData) => {
    socket.broadcast.emit('update-bid', bidData)
  });


  socket.on('update-sold-player', (playerData) => {
    socket.broadcast.emit('update-sold-player-client', playerData)
  })

  socket.on('sell-player', (playerData) => {
    socket.broadcast.emit('sell-player-client', playerData)
  })

  socket.on('mark-player-unsold', (playerData) => {
    socket.broadcast.emit('mark-player-unsold-client', playerData)
  })

});


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