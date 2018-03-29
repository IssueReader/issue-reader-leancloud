const express = require('express');
const AV = require('leanengine');
// const path = require('path');


AV.init({
  appId: process.env.LEANCLOUD_APP_ID || 'S72d1QKkFJrwUy8PckKUHSMR-gzGzoHsz',
  appKey: process.env.LEANCLOUD_APP_KEY || '0zVHtF3LAAflsAVTw9mRW6zd',
  masterKey: process.env.LEANCLOUD_APP_MASTER_KEY || '9TeCbLpULsqeJMYmwBPiOd0d'
});


const app = express();
app.use(AV.express());

app.get('/', function(req, res) {
  res.json({
    time: new Date()
  });
});

app.listen(process.env.LEANCLOUD_APP_PORT || 3000);
