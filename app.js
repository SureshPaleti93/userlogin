const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//POST USER DATA API-1

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const getUserQuery = `
    SELECT username
    FROM user
    WHERE username = '${username}';
  `;
  const dbUser = await db.get(getUserQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      postUserQuery = `
            INSERT INTO user(username, name, password, gender, location)
            VALUES(
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}',
                '${location}'
            );
        `;
      await db.run(postUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
module.exports = app;

//VALIDATE USER API-2

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  getdbUserQuery = `
    SELECT *
    FROM user
    WHERE username = '${username}';
  `;
  const dbUser = await db.get(getdbUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isValidPassword = await bcrypt.compare(password, dbUser.password);
    if (isValidPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});
module.exports = app;

//UPDATE PASSWORD API-3

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const getCurrentPasswd = `
    SELECT *
    FROM user
    WHERE username = '${username}';
  `;
  const dbUser = await db.get(getCurrentPasswd);
  const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password);
  if (isValidPassword === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const updatePasswordQuery = `
            UPDATE user
            SET password = '${hashedPassword}'
            WHERE username = '${username}';
          `;
      await db.run(updatePasswordQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
