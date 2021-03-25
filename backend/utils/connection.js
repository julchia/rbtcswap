const mongoose = require('mongoose');

require('dotenv').config();

mongoose.connect('mongodb://127.0.0.1/' + process.env.DB_STRING, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex: true
}, function (error) {
  if (error) {
    console.log(`[+] MongoDB ${error}`);
  } else {
    console.log(`[+] Connected to MongoDB: ${process.env.DB_STRING}`);
  }
});
