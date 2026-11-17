const app = require('./app');
const config = require('./config');
const { getClient } = require('./cache/redis');

getClient();

app.listen(config.port, () => {
  console.log(`Sweety API listening on http://localhost:${config.port}`);
});
