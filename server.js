const express = require('express');
const AV = require('leanengine');
// const path = require('path');
const bodyParser = require('body-parser');
// const multer = require('multer');


AV.init({
  appId: process.env.LEANCLOUD_APP_ID || 'S72d1QKkFJrwUy8PckKUHSMR-gzGzoHsz',
  appKey: process.env.LEANCLOUD_APP_KEY || '0zVHtF3LAAflsAVTw9mRW6zd',
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY || '9TeCbLpULsqeJMYmwBPiOd0d',
});


const app = express();
app.use(AV.express());
// app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
// app.use(multer()); // for parsing multipart/form-data

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// 可以将一类的路由单独保存在一个文件中
app.use('/user', require('./routes/user'));

app.get('/', (req, res) => {
  res.json({
    time: new Date(),
  });
});

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
