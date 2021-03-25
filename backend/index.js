const bodyParser = require('body-parser');
const cors = require('cors');
const express = require('express');
const fs = require('fs');
const logger = require('morgan');
const history = require('connect-history-api-fallback');
const { resolve } = require('path');

require('dotenv').config();

if (!fs.existsSync('./logs')) {
  console.log('[+] logs folder created');

  fs.mkdirSync('./logs');
}

const errorLogStream = fs.createWriteStream(`${__dirname}/logs/error.log`, { flags: 'a' });

process.on('uncaughtException', (err) => {
  const date = new Date();

  console.error(`+++++++ ${date} error found, logging event +++++++`);
  console.error(err.stack);

  errorLogStream.write(`${date} \n ${err.stack} \n\n`);
});

const accessLogStream = fs.createWriteStream(`${__dirname}/logs/access.log`, { flags: 'a' });

const app = express();

/**
 * Para servir VUE desde ExpressJS y en caso de que después sea multi pagina.
 */
const publicPath = resolve(__dirname, 'dist/')
const staticConf = { maxAge: '1y', etag: false }

app.use(logger('combined', {
  stream: accessLogStream
}));

app.set('json spaces', 2);
app.use(logger('dev'));

if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'local') {
  app.use(cors());
}

app.use(bodyParser.json({limit: '50mb', extended: true}))
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}))

require('./utils/connection');

//Routes
const order = require('./apis/order');
const webhooks = require('./apis/webhooks');

order(app);
webhooks(app);

app.use(express.static(publicPath, staticConf))
app.use('/', history());


app.all("*", (_req, res) => {
  try {
    res.sendFile(process.cwd() + "/dist/");
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Something went wrong" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server URL: ${process.env.SERVER_URL}`);
  console.log(`Example app listening on port: ${process.env.PORT}`);
});

module.exports = app;
