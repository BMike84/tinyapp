// use express
const express = require("express");
const app = express();

//use body-parser
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

// user cookie-session
const cookieSession = require("cookie-session");
app.use(cookieSession({
  name: "session",
  keys: ["MICHAEL"],
}));

//use bcryptjs
const bcrypt = require("bcryptjs");

// use ejs
app.set("view engine", "ejs");

// to run port
const PORT = 8080;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// variables for hardcoded existing urls and users
const urlDatabase = {};
const users = {};

// importing helper functions from helpers.js
const { generateRandomString, getUserByEmail, urlsForUser } = require("./helpers");

//GET

// turn url to json format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// redirects to /urls main page
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// main url page
app.get("/urls", (req, res) => {
  //generates each page for each specific user
  const user = users[req.session.userId];
  const templateVars = { urls: urlsForUser(req.session.userId, urlDatabase), user };
  res.render("urls_index", templateVars);
});

//edit and show tinyurl
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// goes to create new url tab
app.get("/urls/new", (req, res) => {
  const user = users[req.session.userId];
  const templateVars = { user };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

// go to edit page after creating a new url or clicking edit button
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.session.userId];
  const shortURL = req.params.shortURL;
  const longURL = req.body.longURL
  const templateVars = { shortURL, longURL, user };

  // if not user exist
  if (!user) {
    const errorMessage = "You are not logged in!";
    res.status(403).render("urls_errors", { user, errorMessage });
  }

  //if user exist but shortUrl doesn't exist
  if (user && !urlDatabase[shortURL]) {
    const errorMessage = "Url doesn't exist!";
    res.status(403).render("urls_errors", { user, errorMessage });
  }

  // if the user id does not match the urls user id
  if (user && urlDatabase[shortURL].userID !== user.id) {
    const errorMessage = "You are not authorized to edit others Urls!";
    res.status(403).render("urls_errors", { user, errorMessage });
  }

  // if all works render edit page
  res.render("urls_show", templateVars)
  
});

//create register page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.session.userId] };
  res.render("urls_registration", templateVars);
});

//creates login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.session.userId] };
  res.render("urls_login", templateVars);
});

//POST

//creates a random shortURL and adds to database and redirects to urls/shorturl where you can click the link
app.post("/urls", (req, res) => {
  const user = users[req.session.userId];
  // if user exist you can create a new url else error message
  if (user) {
    //hard codes in the https:// so it will redirect to link
    const longURL = "https://" + req.body.longURL;
    const userID = req.session.userId;
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL, userID };
    res.redirect(`/urls/${shortURL}`);
  } else {
    const errorMessage = "You must be logged in to do that!";
    res.status(403).render("urls_errors", {user: user, errorMessage});
  }
});

// uses button to delete existing url
app.post("/urls/:shortURL/delete", (req, res) => {
  // can only delete if you are logged in or the user who owns the url
  const user = users[req.session.userId];
  
  if (!user) {
    const errorMessage = "Login first to delete urls!";
    res.status(403).render("urls_errors", {user: user, errorMessage});
  }

  if (urlDatabase[req.params.shortURL].userID === req.session.userId) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    const errorMessage = "Cannot delete URLs they belong to a different user!";
    res.status(403).render("urls_errors", {user: user, errorMessage});
  }
});

//to edit shortURLs
app.post("/urls/:id", (req, res) => {
  // can only edit if you are logged in or the user who owns the url
  const user = users[req.session.userId];
  
  if (!user) {
    const errorMessage = "Login first to edit urls!";
    res.status(403).render("urls_errors", {user: user, errorMessage});
  }
  
  if (urlDatabase[req.params.id].userID === req.session.userId) {
    const longURL = "https://" + req.body.longURL;
    urlDatabase[req.params.id].longURL = longURL;
    res.redirect("/urls");
  } else {
    const errorMessage = "Cannot edit URLs they belong to a different user!";
    res.status(403).render("urls_errors", {user: user, errorMessage});
  }
});

// generate a user
app.post("/register", (req, res) => {
  // lets you use www. or not use www. when registering in and trims white space at start or end
  const email = req.body.email.replace("www.", "").trim();
  const password = req.body.password.trim();
  const user = getUserByEmail(email, users);

  // if email or password are empty
  if (!email || !password) {
    const errorMessage = "Please add a email and password!";
    res.status(403).render("urls_errors", {user: users[req.session.userId], errorMessage});
  }
  
  // no user and email and password are present then create new user
  if (!user && (email && password)) {
    const id = generateRandomString();
    users[id] = {
      id,
      email: req.body.email.replace("www.", ""),
      password: bcrypt.hashSync(password, 10)
    };
    //generate a cookie for the user
    req.session.userId = id;
    res.redirect("/urls");
  } else {
    const errorMessage = "Account Exist! Please Login instead";
    res.status(403).render("urls_errors", {user: users[req.session.userId], errorMessage});
  }
});

// logins to page
app.post("/login", (req, res) => {
  // lets you use www. or not use www. when logging in and trims white space at start or end
  const email = req.body.email.replace("www.", "").trim();
  const password =  req.body.password.trim();
  //if no email of password enter if fields are empty
  if (!email || !password) {
    const errorMessage = "Invalid Credentials! Missing email or password! Try to Register!";
    res.status(403).render("urls_errors", {user: users[req.session.userId], errorMessage});
  }
  // find existing user
  const user = getUserByEmail(email, users);

  if (!user) {
    const errorMessage = "Invalid credentials! User does not exist";
    res.status(403).render("urls_errors", {user: users[req.session.userId], errorMessage});
  }
  
  if (user && bcrypt.compareSync(password, user.password)) {
    // gets existing cookie and redirects to main page
    req.session.userId = user.id;
    res.redirect("/urls");
  } else {
    const errorMessage = "Invalid credentials! Invalid password";
    res.status(403).render("urls_errors", {user: users[req.session.userId], errorMessage});
  }
});

// lets you log out and deletes existing cookies
app.post("/logout", (req,res) => {
  req.session = null;
  res.redirect("/urls");
});
