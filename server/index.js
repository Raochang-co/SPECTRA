// server/index.js - Backend with Socket.io
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Game state management
const games = new Map();

class GameSession {
  constructor(slotNumber) {
    this.slotNumber = slotNumber;
    this.players = new Map();
    this.leftPopulation = 0;
    this.rightPopulation = 0;
    this.leftBets = 0;
    this.rightBets = 0;
    this.gameActive = false;
    this.timer = null;
    this.startTime = null;
    this.adminOverride = null;
    this.currentLeftX = [1, 1, 1];
    this.currentRightX = [1, 1, 1];
    this.graphInterval = null;
  }

  startGame() {
    if (this.gameActive) return;
    this.gameActive = true;
    this.startTime = Date.now();
    this.adminOverride = null;
    this.startGraphFluctuation();
    
    // 2 minute timer
    this.timer = setTimeout(() => {
      this.endGame();
    }, 120000);
  }

  startGraphFluctuation() {
    this.graphInterval = setInterval(() => {
      if (!this.gameActive) return;
      
      // Fluctuate bars with weighted probabilities
      const updateBar = (currentX) => {
        const change = (Math.random() - 0.5) * 1.5;
        let newX = currentX + change;
        // 95% chance for 2x-5x, 4% for 7x, <1% for 9x-10x
        if (Math.random() < 0.95) {
          newX = Math.min(Math.max(newX, 2), 5);
        } else if (Math.random() < 0.99) {
          newX = Math.min(Math.max(newX, 6), 7);
        } else {
          newX = Math.min(Math.max(newX, 8), 10);
        }
        return Math.round(newX * 10) / 10;
      };

      this.currentLeftX = this.currentLeftX.map(updateBar);
      this.currentRightX = this.currentRightX.map(updateBar);
      
      this.broadcastGraphUpdate();
    }, 3000);
  }

  broadcastGraphUpdate() {
    io.to(this.slotNumber).emit('graphUpdate', {
      left: this.currentLeftX,
      right: this.currentRightX
    });
  }

  endGame() {
    this.gameActive = false;
    clearInterval(this.graphInterval);
    
    let leftTotal = this.currentLeftX.reduce((a, b) => a + b, 0);
    let rightTotal = this.currentRightX.reduce((a, b) => a + b, 0);
    let winner = leftTotal > rightTotal ? 'left' : 'right';
    
    // Admin override takes precedence
    if (this.adminOverride) {
      winner = this.adminOverride;
    } else {
      // Population-based logic: less populated side wins
      const leftPop = this.leftPopulation;
      const rightPop = this.rightPopulation;
      if (leftPop !== rightPop) {
        winner = leftPop < rightPop ? 'left' : 'right';
      }
    }
    
    // Calculate payouts
    const winnings = new Map();
    const thirdBarMultiplier = winner === 'left' ? this.currentLeftX[2] : this.currentRightX[2];
    
    for (const [playerId, player] of this.players) {
      const side = player.betSide;
      const betAmount = player.betAmount;
      
      if (side === winner) {
        const winAmount = betAmount * thirdBarMultiplier;
        const netAmount = winAmount;
        winnings.set(playerId, netAmount);
        player.wallet += netAmount;
      }
    }
    
    // Broadcast result
    io.to(this.slotNumber).emit('gameResult', {
      winner,
      leftTotal,
      rightTotal,
      thirdBarMultiplier,
      leftX: this.currentLeftX,
      rightX: this.currentRightX,
      winnings: Array.from(winnings.entries())
    });
    
    // Reset after 5 seconds
    setTimeout(() => {
      this.resetGame();
    }, 5000);
  }

  resetGame() {
    this.currentLeftX = [1, 1, 1];
    this.currentRightX = [1, 1, 1];
    this.leftBets = 0;
    this.rightBets = 0;
    this.adminOverride = null;
    this.broadcastGraphUpdate();
    io.to(this.slotNumber).emit('gameReset');
  }

  placeBet(playerId, side, amount) {
    if (!this.gameActive) return { success: false, message: 'Game not active' };
    
    let player = this.players.get(playerId);
    if (!player) {
      player = { wallet: 1000, betSide: null, betAmount: 0 };
      this.players.set(playerId, player);
    }
    
    if (player.wallet < amount) return { success: false, message: 'Insufficient balance' };
    
    // Refund previous bet if exists
    if (player.betSide) {
      if (player.betSide === 'left') this.leftBets -= player.betAmount;
      else this.rightBets -= player.betAmount;
      player.wallet += player.betAmount;
    }
    
    player.wallet -= amount;
    player.betSide = side;
    player.betAmount = amount;
    
    if (side === 'left') this.leftBets += amount;
    else this.rightBets += amount;
    
    this.updatePopulations();
    
    return { success: true, wallet: player.wallet };
  }

  updatePopulations() {
    this.leftPopulation = Math.floor(this.leftBets / 10) + Math.floor(Math.random() * 5);
    this.rightPopulation = Math.floor(this.rightBets / 10) + Math.floor(Math.random() * 5);
    
    io.to(this.slotNumber).emit('populationUpdate', {
      left: this.leftPopulation,
      right: this.rightPopulation
    });
  }

  freeBet(playerId, side) {
    if (!this.gameActive) return { success: false, message: 'Game not active' };
    // 95% chance of winning for free bet
    const willWin = Math.random() < 0.95;
    return { success: true, willWin };
  }

  adminSetWinner(winner) {
    this.adminOverride = winner;
    io.to(this.slotNumber).emit('adminOverride', { winner });
  }
}

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinGame', ({ slotNumber, playerId, playerName }) => {
    socket.join(slotNumber);
    
    if (!games.has(slotNumber)) {
      games.set(slotNumber, new GameSession(slotNumber));
    }
    
    const game = games.get(slotNumber);
    
    socket.emit('gameState', {
      gameActive: game.gameActive,
      leftX: game.currentLeftX,
      rightX: game.currentRightX,
      leftPopulation: game.leftPopulation,
      rightPopulation: game.rightPopulation
    });
    
    socket.emit('walletUpdate', { balance: 1000 });
  });
  
  socket.on('startGame', ({ slotNumber }) => {
    const game = games.get(slotNumber);
    if (game && !game.gameActive) {
      game.startGame();
      io.to(slotNumber).emit('gameStarted', { startTime: game.startTime });
    }
  });
  
  socket.on('placeBet', ({ slotNumber, playerId, side, amount }) => {
    const game = games.get(slotNumber);
    if (game) {
      const result = game.placeBet(playerId, side, amount);
      socket.emit('betResult', result);
      io.to(slotNumber).emit('populationUpdate', {
        left: game.leftPopulation,
        right: game.rightPopulation
      });
    }
  });
  
  socket.on('freeBet', ({ slotNumber, playerId, side }) => {
    const game = games.get(slotNumber);
    if (game) {
      const result = game.freeBet(playerId, side);
      socket.emit('freeBetResult', result);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Admin authentication
const ADMIN_CREDENTIALS = {
  username: 'ADMIN00345xc',
  password: 'GSJAOOQGQYQO6278292'
};

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    res.json({ success: true, token: 'admin-token-' + Date.now() });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

app.post('/api/admin/set-winner', (req, res) => {
  const { token, slotNumber, winner } = req.body;
  if (!token || !token.startsWith('admin-token-')) {
    return res.json({ success: false, message: 'Unauthorized' });
  }
  
  const game = games.get(slotNumber);
  if (game) {
    game.adminSetWinner(winner);
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Game not found' });
  }
});

app.get('/api/admin/slot-status/:slotNumber', (req, res) => {
  const game = games.get(req.params.slotNumber);
  if (game) {
    res.json({
      exists: true,
      gameActive: game.gameActive,
      leftPopulation: game.leftPopulation,
      rightPopulation: game.rightPopulation,
      leftBets: game.leftBets,
      rightBets: game.rightBets,
      leftX: game.currentLeftX,
      rightX: game.currentRightX
    });
  } else {
    res.json({ exists: false });
  }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});