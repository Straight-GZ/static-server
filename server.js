var http = require("http");
var fs = require("fs");
var url = require("url");
var port = process.argv[2];

if (!port) {
  console.log("请指定端口号好不啦？\nnode server.js 8888 这样不会吗？");
  process.exit(1);
}

var server = http.createServer(function (request, response) {
  var parsedUrl = url.parse(request.url, true);
  var pathWithQuery = request.url;
  var queryString = "";
  if (pathWithQuery.indexOf("?") >= 0) {
    queryString = pathWithQuery.substring(pathWithQuery.indexOf("?"));
  }
  var path = parsedUrl.pathname;
  var query = parsedUrl.query;
  var method = request.method;
  const session = JSON.parse(fs.readFileSync("./session.json").toString());
  console.log("有个傻子发请求过来啦！路径（带查询参数）为：" + pathWithQuery);
  if (path === "/sign_in" && method === "POST") {
    const array = [];
    const users = JSON.parse(fs.readFileSync("./db/users.json").toString());
    response.setHeader("Content-Type", "text/html,charset=UTF-8");
    request.on("data", (chunk) => {
      array.push(chunk);
    });
    request.on("end", () => {
      const string = Buffer.concat(array).toString();
      const obj = JSON.parse(string);
      const user = users.find(
        (user) => user.name === obj.name && user.password === obj.password
      );
      if (user === undefined) {
        response.statusCode = 400;
        response.setHeader("Content-Type", "text/json;charset=utf-8");
        response.end();
      } else {
        response.statusCode = 200;
        const random = Math.random();
        session[random] = { user_id: user.id };
        fs.writeFileSync("./session.json", JSON.stringify(session));
        response.setHeader("Set-Cookie", `session_id=${random};HttpOnly`);
        response.end();
      }
    });
  } else if (path === "/home.html") {
    const cookie = request.headers["cookie"];
    let sessionId;

    try {
      sessionId = cookie
        .split(";")
        .filter((s) => s.indexOf("session_id=") >= 0)[0]
        .split("=")[1];
      console.log(sessionId);
    } catch (error) {}
    if (sessionId && session[sessionId]) {
      const userId = session[sessionId].user_id;
      console.log(userId);
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      const users = JSON.parse(fs.readFileSync("./db/users.json").toString());
      const user = users.find((user) => user.id === userId);
      let string;
      if (user) {
        string = homeHtml
          .replace("{{loginStatus}}", "已登录")
          .replace("{{userName}}", user.name);
      } else {
        string = homeHtml
          .replace("{{loginStatus}}", "未登录")
          .replace("{{userName}}", "");
      }
      response.write(string);
      response.end();
    } else {
      const homeHtml = fs.readFileSync("./public/home.html").toString();
      const string = homeHtml
        .replace("{{loginStatus}}", "未登录")
        .replace("{{userName}}", "");
      response.write(string);
    }
  } else if (path === "/register" && method === "POST") {
    const array = [];
    const users = JSON.parse(fs.readFileSync("./db/users.json").toString());
    response.setHeader("Content-Type", "text/html,charset=UTF-8");
    request.on("data", (chunk) => {
      array.push(chunk);
    });
    request.on("end", () => {
      const obj = JSON.parse(Buffer.concat(array).toString());
      const lastUser = users[users.length - 1];
      const newUser = {
        id: lastUser ? lastUser.id + 1 : 1,
        name: obj.name,
        password: obj.password,
      };
      users.push(newUser);
      fs.writeFileSync("./db/users.json", JSON.stringify(users));
    });
    response.end();
  } else {
    response.statusCode = 200;
    const filePath = path === "/" ? "/index.html" : path;
    const index = filePath.indexOf(".");
    let suffix = filePath.substring(index);

    const fileTypes = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "text/javascript",
      ".jpg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    };
    response.setHeader(
      "Content-Type",
      `${fileTypes[suffix] || "text/html"};charset=utf-8`
    );
    let content;
    try {
      content = fs.readFileSync(`./public${filePath}`);
    } catch (error) {
      content = "没有此文件";
      response.statusCode = 404;
    }
    response.write(content);
    response.end();
  }
});

server.listen(port);
console.log(
  "监听 " +
    port +
    " 成功\n请用在空中转体720度然后用电饭煲打开 http://localhost:" +
    port
);
