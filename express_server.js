// use express
const express = require("express");
const app = express();

//use body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

//use cookie-parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// use ejs
app.set("view engine", "ejs");

const PORT = 8080;

// variables
const urlDatabase = {};
const users = {};

// function to make unique short url
const generateRandomString = () => {
  const numsLetters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += numsLetters.charAt(Math.floor(Math.random() * numsLetters.length));
  }
  return result;
};

//find email in database
const emailExist = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return true;
    }
  }
  return false;
};

//find password in database
const passwordExist = (password, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].password === password) {
      return true;
    }
  }
  return false;
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

// turn url to json format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// main url page
app.get("/urls", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { urls: urlDatabase, user: user };
  res.render("urls_index", templateVars);
});

//creates a new http address
app.post("/urls", (req, res) => {
  // creates the short url random string
  let shortURL = generateRandomString();
  // adds in the written http addresss for longurl
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`urls/${shortURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL];
  res.redirect(longURL);
});

// goes to create new url tab
app.get("/urls/new", (req, res) => {
  const templateVars = { user: req.cookies.user_id };
  res.render("urls_new", templateVars);
});

// generates the new url added
app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL], user: req.cookies.user_id };
  res.render("urls_show", templateVars);
});

// uses button to delete existing url
app.post("/urls/:shortURL/delete", (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});


app.post("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect("/urls");
});

//create register page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_registration', templateVars);
});

// generate a user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    res.status(400).send("Status Code 400: Please add a email and password!");
  } else if (emailExist(email, users)) {
    res.status(400).send("Status Code 400: Account already exist please login!");
  } else {
    const user_id = generateRandomString();
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: req.body.password
    };
    //generate a cookie for the user
    res.cookie('user_id', user_id);
    res.redirect("/urls");
  }
});

//creates login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  res.render('urls_login', templateVars);
});

// logins to exist users
app.post("/login", (req, res) => {
  const email = req.body.email;
  const validUser = emailExist(email, users);
  const password = req.body.password;
  const validPassword = passwordExist(password, users);

  if (!validUser) {
    res.status(403).send("Status Code 403: Email doesn't exist!");
  }
  
  for (let user in users) {
    if (validUser && validPassword) {
      res.cookie("user_id", users[user].id);
    } else {
      res.status(403).send("Status Code 403: Password doesn't match!");
    }
  }
  res.redirect("/urls");
});

// lets you log out and deletes existing cookies
app.post("/logout", (req,res) => {
  res.clearCookie("user_id");
  res.redirect("/urls");
});

// to run port
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});