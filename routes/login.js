const router = require('express').Router();
const requset = require('../utils/requset');


router.post('/', async (req, res) => {
  if (!req.body || !req.body.code || !req.body.state) {
    return res.status(403).json({ message: '请求没有携带 code 或者 state' });
  }
  try {
    // const user = new AV.User();
    const resp = await getAccessToken(req.body.code, req.body.state);
    return res.json(resp);
  } catch (err) {
    return res.status(403).json(err);
  }
});

const getAccessToken = (code, state) => {
  return requset('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      // 'Content-Type': 'application/json',
    },
    body: `client_id=e3fcd5f1d9cfd0d5aaaa&client_secret=369296e56f582e756cd00e097aef73b92744ddab&code=${code}&state=${state}`,
  }).then((resp) => {
    if (!resp.access_token) {
      throw resp;
    }
    return resp;
  });
};

module.exports = router;
