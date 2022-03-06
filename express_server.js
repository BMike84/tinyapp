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

const emailExist = (email, userDatabase) => {
  for (const user in userDatabase) {
    if ( userDatabase[user].email === email) {
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
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render('urls_registration', templateVars);
});

// generate a user 
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if(!email || !password) {
    res.status(400).send("Status Code 400: Please add a email and password!");
  } else if (emailExist(email, users)) {
    res.status(400).send("Status Code 400: Please login account already exist!");
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
  const templateVars = { user: users[req.cookies["user_id"]] }
  res.render('urls_login', templateVars);
});

// creates the login from form and creates a cookie
app.post("/login", (req, res) => {
  const email = req.body.email;
  const user = emailExist(email, users);
  if (!user) {
    res.status(400).send("Status Code 400: Email doesn't exist");
  } else {
    for (let user in users) {
      if (email === users[user].email) {
        res.cookie("user_id", users[user].id);
        break;
      }
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