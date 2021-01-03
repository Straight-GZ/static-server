const fs = require("fs");

const usersString = fs.readFileSync("./db/users.json").toString();
const usersArray = JSON.parse(usersString);

const user3 = { id: "3", name: "ght", password: "789" };
usersArray.push(user3);
const string = JSON.stringify(usersArray);
fs.writeFileSync("./db/users.json", string);
