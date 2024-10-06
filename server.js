// server.js
const app = require('./app'); // Import the app from app.js
const http = require('http');
const logger = require('./src/utils/logger');
require('./src/schedulers/cronTasks'); 

let server = http.createServer(app);

const port = process.env.PORT || 3000;

server = app.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

module.exports = server;
