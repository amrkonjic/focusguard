require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const roomRoutes = require('./routes/rooms');
const sessionRoutes = require('./routes/sessions');
const { handleConnection } = require('./websocket/wsHandler');

// kreiraj express aplikaciju tj. HTTP server i na taj server zakaci websocket server
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
 
app.use(cors());
app.use(express.json());

// registriraj dvije grupe ruta na aplikaciju
app.use('/api/rooms', roomRoutes);
app.use('/api/sessions', sessionRoutes);

// endpoint samo za dijagnostiku - za brzu provjeru je li server ziv
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

wss.on('connection', handleConnection);

// pokreni server na portu
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});