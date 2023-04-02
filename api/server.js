const cors = require('cors');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const timeout = require('connect-timeout');

const { GET_MODELS, MODELS_RETURNED, CREATE_APP, APP_CREATED, ERROR } = require('./constants');

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept'],
  credentials: true
};

const Hub = require('./hub');
const PORT = process.env.PORT || 5000;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: corsOptions
});

const hub = new Hub(io);

app
  .use(cors(corsOptions))
  .use(express.json())
  .use(express.urlencoded({ extended: true }))
  .use(timeout('120s'))
  .use((request, response, next) => {
    if (request.method === 'OPTIONS') {
      response.sendStatus(200);
    }
    else {
      next();
    }
  });

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on(GET_MODELS, ({ requestId }) => {
    hub.getModels(requestId);
  });

  socket.on(MODELS_RETURNED, ({ requestId, httpStatusCode, data }) => {
    console.log(MODELS_RETURNED, requestId, httpStatusCode, data);
  });

  socket.on(CREATE_APP, ({ requestId, model, prompt }) => {
    hub.createApp(requestId, model, prompt);
  })

  socket.on(APP_CREATED, ({ requestId, httpStatusCode, data }) => {
    console.log(APP_CREATED, requestId, httpStatusCode, data);
  });

  socket.on(ERROR, ({ requestId, httpStatusCode, data }) => {
    console.error(ERROR, requestId, httpStatusCode, data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => console.log(`Listening on ${PORT}`))