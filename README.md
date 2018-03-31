![issue-reader-leancloud](./images/logo128x128.png)

# issue-reader-leancloud
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)]
<!-- [![Build Status](https://img.shields.io/travis/npm/npm/latest.svg?style=flat-square)](https://travis-ci.org/npm/npm)
[![npm](https://img.shields.io/npm/v/npm.svg?style=flat-square)](https://www.npmjs.com/package/npm)  -->

> https://issuereader.leanapp.cn

Github Issue Blog Reader backend, Based On [LeanCloud](https://leancloud.cn).

## Getting started

```
git clone https://github.com/IssueReader/issue-reader-leancloud.git
cd issue-reader-leancloud
yarn install
yarn start
```

接下来，使用 POSTMAN 等 RESTful API 测试工具像 `http://localhost:3000` 发送请求。

## Developing

### Built With

* lean: lean cloud [命令行工具](https://leancloud.cn/docs/leanengine_cli.html)


### Prerequisites
<!-- What is needed to set up the dev environment. For instance, global dependencies or any other tools. include download links. -->
1. 注册 leancloud 账号，创建应用

2. 安装 lean cloud [命令行工具](https://leancloud.cn/docs/leanengine_cli.html)

3. [创建 Github OAuth App](https://developer.github.com/apps/building-oauth-apps/creating-an-oauth-app/)，确认要选中

<!-- ### Setting up Dev

Here's a brief intro about what a developer must do in order to start developing
the project further:

```shell
git clone https://github.com/your/your-project.git
cd your-project/
packagemanager install
```

And state what happens step-by-step. If there is any virtual environment, local server or database feeder needed, explain here. -->

<!-- ### Building

If your project needs some additional steps for the developer to build the
project after some code changes, state them here. for example:

```shell
./configure
make
make install
```

Here again you should state what actually happens when the code above gets
executed.

### Deploying / Publishing
give instructions on how to build and release a new version
In case there's some step you have to take that publishes this project to a
server, this is the right time to state it.

```shell
packagemanager deploy your-project -s server.com -u username -p password
```

And again you'd need to tell what the previous code actually does.

## Versioning

We can maybe use [SemVer](http://semver.org/) for versioning. For the versions available, see the [link to tags on this repository](/tags). -->


<!-- ## Configuration

Here you should write what are all of the configurations a user can enter when
using the project. -->

<!-- ## Tests

Describe and show how to run the tests with code examples.
Explain what these tests test and why.

```shell
Give an example
``` -->

<!-- ## Style guide

Explain your code style and show how to check it. -->

<!-- ## Api Reference -->
<!-- If the api is external, link to api documentation. If not describe your api including authentication methods as well as explaining all the endpoints with their required parameters. -->

## Database

<!-- Explaining what database (and version) has been used. Provide download links.
Documents your database design and schemas, relations etc... -->
[LeanStorage](https://leancloud.cn/docs/leanstorage_guide-js.html)

## Contributing

我们非常欢迎你的贡献，你可以通过以下方式和我们一起共建 😃：
* 通过 Issue 报告 bug 或进行咨询。
* 提交 Pull Request 。

## Licensing

issue-reader-leancloud is [MIT licensed](./LICENSE).

<!--
## Github Oauth
https://github.com/login/oauth/authorize?client_id=e3fcd5f1d9cfd0d5aaaa&redirect_uri=https%3A%2F%2Fissuereader.leanapp.cn&scope=repo&state=github
-->
