const router = require('express').Router();
const AV = require('leanengine');
const requset = require('../utils/requset');
const { ApolloClient } = require('apollo-client');
const { HttpLink } = require('apollo-link-http');
const { InMemoryCache } = require('apollo-cache-inmemory');
const gql = require('graphql-tag');

// DONE: login，支持 Github OAuth
router.post('/', async (req, res) => {
  try {
    // const user = new AV.User();
    const { token, sessionToken } = await login(req);
    const userInfo = await getUserInfo({ token });
    return res.json({ sessionToken, ...userInfo });
  } catch (err) {
    return res.status(403).json(err);
  }
});

// DONE: 获取用户订阅仓库列表
router.get('/repos', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const repos = await getRepos({ userId: user.id });
    return res.json(repos);
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: 添加订阅
router.post('/repos', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const repoObj = await getRepo({ userId: user.id, ...req.body });
    if (repoObj) {
      return res.json(repoObj);
    }
    const newRepoObj = await addRepo({ userId: user.id, ...req.body });
    return res.json(newRepoObj);
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: 删除订阅
router.delete('/repos', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const repoObj = await getRepo({ userId: user.id, ...req.body });
    if (repoObj) {
      await repoObj.destroy();
      return res.json(repoObj);
    } else {
      return res.status(404).json(req);
    }
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: get user issues
router.get('/issues', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    // const repos = await getRepos({ userId: user.id });
    const issues = await getIssues({ userId: user.id, token: user.attributes.authData.github.access_token });
    return res.json(issues);
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: get user repo issues
router.get('/repos/:owner/:repo/issues', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    // const repos = await getRepos({ userId: user.id });
    const issues = await getRepoIssuesList({ userId: user.id, token: user.attributes.authData.github.access_token, ...req.params });
    return res.json(issues);
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: mark issue as read
router.post('/repos/:owner/:repo/issues/:number', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const readIssue = await markAsRead({ userId: user.id, ...req.params });
    return res.json(readIssue);
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: get user favorites
router.get('/favorites', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const repos = await getFavorites({ userId: user.id, ...req.body });
    return res.json(repos);
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: add an issue to favorites
router.post('/favorites', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const favorite = await addFavorites({ userId: user.id, ...req.body });
    return res.json(favorite);
  } catch (err) {
    return res.status(401).json(err);
  }
});

// DONE: remove an issue from favorites
router.delete('/favorites', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const favorite = await getFavorite({ userId: user.id, ...req.body });
    if (favorite) {
      await favorite.destroy();
      return res.json({});
    } else {
      return res.status(404).json(req);
    }
    // return res.json(favorite);
  } catch (err) {
    return res.status(401).json(err);
  }
});

router.get('/watching', async (req, res) => {
  try {
    const user = await getUserByReq(req);
    const repos = await getWatching({ token: user.attributes.authData.github.access_token, ...req.query });
    return res.json(repos);
  } catch (err) {
    return res.status(401).json(err);
  }
});

const getAccessToken = (code) => {
  return requset('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      // 'Content-Type': 'application/json',
    },
    body: `client_id=e3fcd5f1d9cfd0d5aaaa&client_secret=369296e56f582e756cd00e097aef73b92744ddab&code=${code}&state=github`,
  }).then((resp) => {
    if (!resp.access_token) {
      throw resp;
    }
    return resp;
  });
};

const login = async (req) => {
  if (req.body.token) {
    const user = await AV.User.become(req.body.token);
    return {
      token: user.attributes.authData.github.access_token,
      sessionToken: user._sessionToken,
    };
  } else if (req.body.code) {
    const token = await getAccessToken(req.body.code);
    const user = await AV.User.signUpOrlogInWithAuthData({
      uid: 'e3fcd5f1d9cfd0d5aaaa',
      access_token: token.access_token,
    }, 'github');
    return {
      token: token.access_token,
      sessionToken: user._sessionToken,
    };
  } else if (req.body.accessToken) {
    // TODO: 测试分支
    const user = await AV.User.signUpOrlogInWithAuthData({
      uid: 'e3fcd5f1d9cfd0d5aaaa',
      access_token: req.body.accessToken,
    }, 'github');
    return {
      token: user.attributes.authData.github.access_token,
      sessionToken: user._sessionToken,
    };
  } else {
    const errMsg = { error: 'code/sessiontoken not found' };
    throw errMsg;
  }
};

const getUserInfo = ({ token }) => {
  const client = getClient({ token });
  return client.query({
    query: gql`query {
      viewer {
        login
        avatarUrl
        name
        bio
      }
    }`,
  }).then((resp) => {
    if (!resp.data || !resp.data.viewer) {
      throw resp;
    }
    return resp.data.viewer;
  });
};

const getClient = ({ token, type = 'bearer' }) => {
  return new ApolloClient({
    link: new HttpLink({
      uri: 'https://api.github.com/graphql',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `${type} ${token}`,
      },
    }),
    cache: new InMemoryCache(),
  });
};

const getUserByReq = async (req) => {
  if (req.headers.sessiontoken) {
    const user = await AV.User.become(req.headers.sessiontoken);
    return user;
  }
  const errMsg = { error: 'sessiontoken not found' };
  throw errMsg;
};


// TODO: add Owner info to repos
const getRepos = ({ userId }) => {
  // const Repos = AV.Object.extend('Repos');
  const query = new AV.Query('Repos');
  query.equalTo('userId', userId);
  return query.find();
};

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

// TODO: star/watch repo on github
const addRepo = async ({ userId, owner, repo }) => {
  const repoObj = await getRepo({ userId, owner, repo });
  if (repoObj) {
    return repoObj;
  }
  const Repos = AV.Object.extend('Repos');
  const repos = new Repos();
  repos.set('owner', owner);
  repos.set('repo', repo);
  repos.set('userId', userId);
  return repos.save();
};


const getIssues = async ({ userId, token }) => {
  const repos = await getRepos({ userId });
  const client = getClient({ token });
  const list = await Promise.all(repos.map(async (repo) => {
    const { issues, owner } = await getRepoIssues({ client, ...repo.attributes });
    const readIssues = await getReadIssues({ userId });
    const favorites = await getFavorites({ userId });
    return issues.map((issue) => {
      // DONE: read/favorite 状态
      const equalTo = (item) => {
        return (issue.node.number === item.attributes.number &&
          repo.attributes.owner === item.attributes.owner &&
          repo.attributes.repo === item.attributes.repo);
      };
      const read = readIssues.find(equalTo);
      const favorite = favorites.find(equalTo);
      return {
        ...issue.node,
        ...owner,
        owner: repo.attributes.owner,
        repo: repo.attributes.repo,
        read: !!read,
        favorite: !!favorite,
      };
    });
  }));
  return [].concat(...list).sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
};


const getRepoIssuesList = async ({
  userId, token, owner, repo,
}) => {
  // const repos = await getRepos({ userId });
  const client = getClient({ token });
  const info = await getRepoIssues({ client, owner, repo });
  const readIssues = await getReadIssues({ userId });
  const favorites = await getFavorites({ userId });
  return info.issues.map((issue) => {
    // DONE: read/favorite 状态
    const equalTo = (item) => {
      return (issue.node.number === item.attributes.number &&
        owner === item.attributes.owner &&
        repo === item.attributes.repo);
    };
    const read = readIssues.find(equalTo);
    const favorite = favorites.find(equalTo);
    return {
      ...issue.node,
      ...info.owner,
      owner,
      repo,
      read: !!read,
      favorite: !!favorite,
    };
  }).sort((a, b) => {
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
  // return [].concat(...list).sort((a, b) => {
  //   return new Date(b.createdAt) - new Date(a.createdAt);
  // });
};

const getRepoIssues = ({ client, owner, repo }) => {
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
              createdAt
            }
          }
        }
      }
      user(login: "${owner}"){
        avatarUrl
        bio
        name
      }
    }`,
  }).then((resp) => {
    if (!resp.data || !resp.data.repository || !resp.data.user || !resp.data.repository.issues) {
      throw resp;
    }
    return { owner: resp.data.user, issues: resp.data.repository.issues.edges };
  });
};

const getReadIssues = async ({ userId }) => {
  const query = new AV.Query('Read');
  query.equalTo('userId', userId);
  return query.find();
};

const getReadIssue = async ({
  userId, owner, repo, number,
}) => {
  const userIdQuery = new AV.Query('Read');
  userIdQuery.equalTo('userId', userId);
  const ownerQuery = new AV.Query('Read');
  ownerQuery.equalTo('owner', owner);
  const repoQuery = new AV.Query('Read');
  repoQuery.equalTo('repo', repo);
  const numberQuery = new AV.Query('Read');
  numberQuery.equalTo('number', parseInt(number, 10));
  const query = AV.Query.and(userIdQuery, ownerQuery, repoQuery, numberQuery);
  try {
    const data = await query.first();
    return data;
  } catch (errMsg) {
    return null;
  }
};

const markAsRead = async ({
  userId, owner, repo, number,
}) => {
  const readIssue = await getReadIssue({
    userId, owner, repo, number,
  });
  if (readIssue) {
    return readIssue;
  }
  const Read = AV.Object.extend('Read');
  const issue = new Read();
  issue.set('userId', userId);
  issue.set('owner', owner);
  issue.set('repo', repo);
  issue.set('number', parseInt(number, 10));
  return issue.save();
};

const getFavorites = async ({ userId }) => {
  const query = new AV.Query('Favorites');
  query.equalTo('userId', userId);
  return query.find();
};

const getFavorite = async ({
  userId, owner, repo, number,
}) => {
  const userIdQuery = new AV.Query('Favorites');
  userIdQuery.equalTo('userId', userId);
  const ownerQuery = new AV.Query('Favorites');
  ownerQuery.equalTo('owner', owner);
  const repoQuery = new AV.Query('Favorites');
  repoQuery.equalTo('repo', repo);
  const numberQuery = new AV.Query('Favorites');
  numberQuery.equalTo('number', parseInt(number, 10));
  const query = AV.Query.and(userIdQuery, ownerQuery, repoQuery, numberQuery);
  try {
    const data = await query.first();
    return data;
  } catch (errMsg) {
    return null;
  }
};

// TODO: star/watch repo on github
const addFavorites = async ({
  userId, owner, repo, number,
}) => {
  const favoriteIssue = await getFavorite({
    userId, owner, repo, number,
  });
  if (favoriteIssue) {
    return favoriteIssue;
  }
  const Favorites = AV.Object.extend('Favorites');
  const issue = new Favorites();
  issue.set('userId', userId);
  issue.set('owner', owner);
  issue.set('repo', repo);
  issue.set('number', parseInt(number, 10));
  return issue.save();
};

const getWatching = ({ token }) => {
  const client = getClient({ token });
  return getUserWatchingList({ client, list: [] });
};

const getUserWatchingList = async ({ client, list, cursor }) => {
  const result = await queryUserWatching({ client, cursor });
  const watchingList = list.concat(result.list);
  if (watchingList.length < result.totalCount) {
    const all = await getUserWatchingList({ client, list: watchingList, cursor: result[result.length - 1].cursor });
    return all;
  }
  return watchingList;
};

const queryUserWatching = ({ client, cursor }) => {
  return client.query({
    query: gql`query {
      viewer {
        watching (first: 100${cursor ? `, after: "${cursor}"` : ''}){
          totalCount
          edges{
            cursor
            node{
              owner {
                login
                avatarUrl
              }
              name
              issues (states:OPEN){
                totalCount
              }
              stargazers {
                totalCount
              }
              watchers{
                totalCount
              }
            }
          }
        }
      }
    }`,
  }).then((resp) => {
    if (!resp.data || !resp.data.viewer || !resp.data.viewer.watching) {
      throw resp;
    }
    // const watching = resp.data.viewer.watching;
    const { totalCount, edges } = resp.data.viewer.watching;
    return {
      totalCount,
      list: edges.map((it) => {
        return {
          cursor: it.cursor,
          owner: it.node.owner.login,
          avatarUrl: it.node.owner.avatarUrl,
          name: it.node.name,
          issueCount: it.node.issues.totalCount,
          starCount: it.node.stargazers.totalCount,
          watchCount: it.node.watchers.totalCount,
        };
      }),
    };
  });
};

module.exports = router;
