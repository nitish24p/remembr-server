/* eslint-disable no-console */

/**
 * Module dependencies.
 */
const app = require('./app');
const debug = require('debug')('remembr');

const http = require('http');
const SocketIO = require('socket.io');
const Game = require('./game');
const Logger = require('./logger');

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

const gameRooms = {};

io.on('connection', (socket) => {
  Logger.log("got a new connection");
  Logger.log(socket.id);

  socket.on('disconnect', (reason) => {
    Logger.log('disconnect reason: ', reason);
  });

  socket.on('disconnecting', (blah) => {
    Logger.log(socket.client.id);
    Logger.log("DISCONNECT YO")
    // Logger.log(socket.client.sockets[socket.client.id].rooms);
    let roomId
    Object.keys(socket.client.sockets[socket.client.id].rooms).forEach(room => {
      if (room !== socket.client.id) {
        roomId = room
      }
    });

    if (gameRooms[roomId]) {
      gameRooms[roomId].players = gameRooms[roomId].players.filter(player => {
        return player.id !== socket.client.id
      });
    }

    const rooms = Object.keys(socket.rooms);
    socket.to(roomId).emit('user left', socket.client.id + ' left');
    
  })

  socket.on('room', (room) => {
    Logger.log("CONNNECTING YO")
    Logger.log(process.common.getJSONObject(room));
    if (!room.roomId || !room.alias) {
      Logger.log('missing info');
      socket.disconnect(true);
      return;
    }
    const roomId = room.roomId;
    //  todo validate the room
    Logger.log(`client wants to join room ${roomId}`);

    io.in(roomId).clients((err, clients) => {
      const playerToJoin = {};

      if (err) {
        Logger.log('error in getting clients: ', err);
        socket.disconnect(true);
        return;
      }

      if (clients.length >= maxPlayers) {
        Logger.log(`max players allowed is ${maxPlayers}`);
        socket.disconnect(true);
        // emmit a message cant join
        return;
      }

      socket.join(roomId, () => {
        playerToJoin.id = socket.client.id;
        playerToJoin.score = 0;
        //  if it's the first guy
        if (clients.length === 0 || (clients.length === 1 && gameRooms[roomId].players.some(client => !client.isOwner))) {
          playerToJoin.isOwner = true; 
        }

        gameRooms[roomId] = gameRooms[roomId] || {};
        gameRooms[roomId].players = gameRooms[roomId].players || [];
        gameRooms[roomId].players.push(playerToJoin);

        //  if all guys are in the room
        if (clients.length == maxPlayers - 1) {
          //gameRooms[roomId]['bookie'] = firstClient;
          io.sockets.in(roomId).emit('joint', gameRooms[roomId]);
        }

      });
    });
  });

  socket.on('start', (data) => {
    const startingLevel = 1
    const { roomId } = data;
    gameRooms[roomId].level = startingLevel;
    gameRooms[roomId].board = Game.createNewBoard(startingLevel);
    gameRooms[roomId].gameStarted = true;
    
    io.sockets.in(roomId).emit('game started', gameRooms[roomId]);
    Logger.log("STARTING", gameRooms[roomId]);
  });

  socket.on('match', (data) => {
    const { roomId, clickedCards, level } = data;
    let tempCard = null;
    let isMatched = false;
    const clientId = socket.client.id;
    const game = gameRooms[roomId];
    const opponent = gameRooms[roomId].players.find(player => player.id !== clientId);
    if (level !== gameRooms[roomId].level) {
      return;
    }
    clickedCards.forEach(card => {
      card.hide = true;
      if (!tempCard) {
        tempCard = card;
      }
      
      else if ((gameRooms[roomId].board[tempCard.rowIndex][tempCard.columnIndex].value === 
        gameRooms[roomId].board[card.rowIndex][card.columnIndex].value
      ) && (!gameRooms[roomId].board[card.rowIndex][card.columnIndex].isMatched && 
        !gameRooms[roomId].board[tempCard.rowIndex][tempCard.columnIndex].isMatched)) {
        gameRooms[roomId].board[card.rowIndex][card.columnIndex].isMatched = true;
        gameRooms[roomId].board[card.rowIndex][card.columnIndex].isOpen = true;
        gameRooms[roomId].board[tempCard.rowIndex][tempCard.columnIndex].isMatched = true;
        gameRooms[roomId].board[tempCard.rowIndex][tempCard.columnIndex].isOpen = true;
        gameRooms[roomId].players.forEach(player => {
          if (player.id === clientId) {
            player.score += (10 * gameRooms[roomId].level)
          }
        })
        isMatched = true;
      }
      
      
    })
    if (isMatched) {
      io.to(opponent.id).emit('update', { cards: clickedCards });
      io.sockets.in(roomId).emit('score updated', {players: gameRooms[roomId].players});
    }
    
  })

  socket.on('level up', (data) => {
    const { roomId } = data;
    const isLevelOver = gameRooms[roomId].board.every(cardRow => cardRow.every(card => card.isMatched));
    if (isLevelOver) {
      Logger.log('level up', 'current lievel', gameRooms[roomId].level);
      const currentLevel = gameRooms[roomId].level;
      gameRooms[roomId].level = currentLevel + 1;
      setTimeout(() => {
        gameRooms[roomId].board = Game.createNewBoard(currentLevel + 1);
        io.sockets.in(roomId).emit('level updated', gameRooms[roomId]);
      }, 500);
    }
    
  })

  socket.on('game over', (data) => {
    const { roomId } = data;
    setTimeout(() => {
      io.sockets.in(roomId).emit('game completed', gameRooms[roomId]);
    }, 500);

  })


});

const maxPlayers = 2;


const getClientsInRoom = function (roomId, callback) {
  io.in(roomId).clients(callback);
};


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