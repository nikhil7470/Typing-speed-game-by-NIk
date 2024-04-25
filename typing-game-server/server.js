const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app); 
const { Server } = require("socket.io");
const io = new Server(server); 
let consoleLogData = '';
let scoreUpdateData = '';
const mongoose = require('mongoose');

// Replace with your actual MongoDB connection string
const connectionString = 'mongodb+srv://myfreefirelive:b0ygr1lpuqXOcu7S@firstgame.ifarrlu.mongodb.net/?retryWrites=true&w=majority&appName=firstGame'; 

mongoose.connect(connectionString, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));


// Basic route 
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/console-log-data', (req, res) => {
  res.send(consoleLogData);
});

// server.js

const scoreSchema = new mongoose.Schema({
    playerName: String,
    score: Number,
    roomName: String,
    timestamp: { type: Date, default: Date.now }
});

const Score = mongoose.model('Score', scoreSchema);



const rooms = {}; 

const MAX_PLAYERS_PER_ROOM = 2; // Adjust this as needed

function findAvailableRoom() {
    for (const roomName in rooms) {
        if (Object.keys(rooms[roomName]).length < MAX_PLAYERS_PER_ROOM) {
            return roomName; // Found a room with space
        }
    }
    return null; // No rooms with space found
}  

function generateRoomName() {
       return Math.random().toString(36).substr(2, 5);
   }

function initializeRoom(roomName) {
    rooms[roomName] = {}; // Initialize empty object to store player scores
}

function addPlayerToRoom(roomName, playerName) {
    rooms[roomName][playerName] = 0; // Initialize player's score
}

function updatePlayerScore(roomName, playerName, newScore) {
    rooms[roomName][playerName] = newScore;
    console.log("Current scores:", rooms);
}

function getAllPlayerScores(roomName) {
    return rooms[roomName]; // Return object with playerName: score pairs
}


// 

io.on('connection', (socket) => {
    socket.on('scoreUpdate', (data) => {
        scoreUpdateData = `Player ${data.playerName} scored ${data.newScore}`;
        io.emit('updateScoreData', scoreUpdateData);
    });
    
    const roomName = null;

    socket.on('joinGame', (data) => {
      let roomName = findAvailableRoom(); // Implement room finding logic
      if (!roomName) {
         let roomName = generateRoomName();
          initializeRoom(roomName);
      }
      socket.join(roomName);
      socket.emit('roomJoined', roomName);
      if (Object.keys(rooms[roomName]).length === 2) { // Room is full
        io.to(roomName).emit('startGame');  // Signal game start to both clients
    }
  });



socket.on('scoreUpdate', (data) => {
  console.log("Score update received:", data);
  consoleLogData = `Player ${data.playerName} scored ${data.newScore}`;
  let roomName = Object.keys(socket.rooms)[1]; // Get the room name of the socket
  if (rooms[roomName]) { // Make sure the room exists
      updatePlayerScore(roomName, data.playerName, data.newScore);

      // Store console log data
      
      // Broadcast updated scores to all players in the room
      console.log("Emitting updateScores to room:", roomName);
      io.emit('updateScoreData', scoreUpdateData);
      io.to(roomName).emit('updateScores', getAllPlayerScores(roomName)); // Adjust this line
  }
});
});


server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
