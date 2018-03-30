const router = require('express').Router();
const AV = require('leanengine');
const requset = require('../utils/requset');
const { ApolloClient } = require('apollo-client');
const { HttpLink } = require('apollo-link-http');
const { InMemoryCache } = require('apollo-cache-inmemory');
const gql = require('graphql-tag');

// const Todo = AV.Object.extend('Todo');

const getAccessToken = (code) => {
  return requset('https://github.com/login/oauth/access_token', {
    method: "POST",
    headers: {
      'Accept': 'application/json',
      // 'Content-Type': 'application/json',
    },
    body: `client_id=e3fcd5f1d9cfd0d5aaaa&client_secret=369296e56f582e756cd00e097aef73b92744ddab&code=${code}&state=github`,
  }).then((resp) => {
    if (!resp.access_token) {
      const error = new Error('');
      // error.response = resp;
      Object.assign(error, resp);
      throw error;
    }
  });
};

const getClient = ({ token, type = 'bearer' }) => {
  return new ApolloClient({
    link: new HttpLink({
      uri: 'https://api.github.com/graphql',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `${type} ${token}`
      },
    }),
    cache: new InMemoryCache(),
  });

};

const getUserInfo = ({ token, type }) => {
  const client = getClient({ token, type });
  return client.query({
    query: gql`query {
      viewer {
        login
        id
        avatarUrl
      }
    }`,
  }).then((resp) => {
    if (!resp.data || !resp.data.viewer) {
      const error = new Error('');
      // error.response = resp;
      Object.assign(error, resp);
      throw error;
    }
    return resp.data.viewer;
  });
};


// const getUserInfo = async () => {
//   return query('https://api.github.com/graphql', {
//     method: 'post',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(graphQLParams),
//   }).then(response => response.json());
// };

const getRepos = async ({ userId }) => {
  // const Repos = AV.Object.extend('Repos');
  const query = new AV.Query('Repos');
  query.equalTo('userId', userId);
  return query.find();
};

const getUserInfoByLogin = ({ client, login }) => {
  return client.query({
    query: gql`query {
      user(login: "${login}"){
        avatarUrl
        bio
        name
        login
      }
    }`,
  }).then((resp) => {
    if (!resp.data || !resp.data.user) {
      const error = new Error('');
      // error.response = resp;
      Object.assign(error, resp);
      throw error;
    }
    return resp.data.user;
  });
};

const getRepositoryIssues = ({ client, owner, repo }) => {
  return client.query({
    query: gql`query {
      repository(owner: "${owner}", name: "${repo}") {
        issues(first : 100, states:OPEN){
          totalCount
          edges{
            node{
              title
              body
              number
            }
          }
        }
      }
    }`,
  }).then((resp) => {
    if (!resp.data || !resp.data.repository || !resp.data.repository.issues) {
      const error = new Error('');
      // error.response = resp;
      Object.assign(error, resp);
      throw error;
    }
    return resp.data.repository.issues.edges;
  });
};

const getIssues = async ({ repos, token }) => {
  const client = getClient({ token });
  // const list = repos.map(async (repo) => {
  //   // const userInfo = await getUserInfoByLogin({ client, login: repo.attributes.owner });
  //   const issues = await getRepositoryIssues({ client, ...repo.attributes });
  //   return issues;
  // });
  // debugger;
  // return [].concat(...list);
  const list = [];
  for (const repo of repos) {
    // const userInfo = await getUserInfoByLogin({ client, login: repo.attributes.owner });
    const issues = await getRepositoryIssues({ client, ...repo.attributes });
    list.push(...issues);
  }
  return list;
};

router.post('/', async (req, res, next) => {
  try {
    // const user = new AV.User();
    if (req.body.sessionToken) {
      debugger;
    } else {
      if (req.body.code) {
        const token = await getAccessToken(req.body.code);
        // const info = await getUserInfo({ type: token.token_type, token: token.access_token });
        const user = await AV.User.signUpOrlogInWithAuthData({
          uid: 'e3fcd5f1d9cfd0d5aaaa',
          access_token: token.access_token
        }, 'github');
      } else if (req.body.token) {
        const info = await getUserInfo({ type: req.body.type, token: req.body.token });
        const user = await AV.User.signUpOrlogInWithAuthData({
          uid: 'e3fcd5f1d9cfd0d5aaaa',
          access_token: req.body.token
        }, 'github');
        // const Repos = AV.Object.extend('Repos');
        // const query = new AV.Query(Repos);
        // query.equalTo('userId', user.id);
        const repos = await getRepos({ userId: user.id });
        const issues = await getIssues({ repos, token: req.body.token });
        return res.json({
          username: user.attributes.username,
          sessionToken: user._sessionToken,
          id: user.id,
          repos,
          issues,
        });
      }
    }
  } catch (err) {
    debugger;
    return res.json(err);
  }
  return res.json(req);
});

const getRepo = async ({ userId, owner, repo }) => {
  const userIdQuery = new AV.Query('Repos');
  userIdQuery.equalTo('userId', userId);
  const ownerQuery = new AV.Query('Repos');
  ownerQuery.equalTo('owner', owner);
  const repoQuery = new AV.Query('Repos');
  repoQuery.equalTo('repo', repo);
  const query = AV.Query.and(userIdQuery, ownerQuery, repoQuery);
  try {
    const data = await query.first();
    return data;
  } catch (errMsg) {
    return null;
  }
};

const addRepo = async ({ userId, owner, repo }) => {
  const Repos = AV.Object.extend('Repos');
  var repos = new Repos();
  repos.set('owner', owner);
  repos.set('repo', repo);
  repos.set('userId', userId);
  return await repos.save();
};

router.post('/repos', async (req, res, next) => {
  try {
    if (!req.headers.sessiontoken) {
      debugger;
      const error = new Error('');
      Object.assign(error, req);
      throw error;
    }
    const user = await AV.User.become(req.headers.sessiontoken);
    const repoObj = await getRepo({ userId: user.id, ...req.body });
    if (repoObj) {
      return res.json(repoObj);
    }
    const newRepoObj = await addRepo({ userId: user.id, ...req.body });
    return res.json(newRepoObj);
  } catch (err) {
    debugger;
    return res.json(err);
  }
  return res.json(req);
});


module.exports = router;
