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
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  },
};
const users = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "b@b.com",
    password: 'mike'
  },
};

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
      return userDatabase[user].email;
    }
  }
  return undefined;
};

//find password in database
const passwordExist = (email, userDatabase) => {
  for (const user in userDatabase) {
    if (userDatabase[user].email === email) {
      return userDatabase[user].password;
    }
  }
  return undefined;
};

// find the id by email
const idExist = (email, userDatabase) => {
  for (let user in userDatabase) {
    if (email === userDatabase[user].email) {
      return userDatabase[user].id;
    }
  }
  return undefined;
};

// Returns an object of short URLs specific to the passed in userID
const urlsUsers = function(id, urlDatabase) {
  const userUrls = urlDatabase;
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      userUrls[shortURL] = urlDatabase[shortURL];
    }
  }
  return userUrls;
};


app.get("/", (req, res) => {
  res.redirect("/urls");
});

// turn url to json format
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// main url page
app.get("/urls", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { urls: urlsUsers(req.cookies.userID, urlDatabase), user: user };
  res.render("urls_index", templateVars);
});

//creates a new http address
app.post("/urls", (req, res) => {
  const longURL = req.body.longURL;
  const userID = req.cookies.user_id;
  const shortURL = generateRandomString();
  urlDatabase[shortURL] = { longURL, userID };
  res.redirect(`/urls/${shortURL}`);
});

//edit and show tinyurl
app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

// goes to create new url tab
app.get("/urls/new", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { user };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

// generates the new url added
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies["user_id"]];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user };
  res.render("urls_show", templateVars);
});
  

// uses button to delete existing url
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.cookies.user_id];
  
  if (urlDatabase[req.params.shortURL].userID === req.cookies.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    const errorMessage = "Cannot delete URLs they belong to a different user!"
    // res.status(403).send("Status Code 403: Urls belong to different user!");
    res.status(403).render('urls_errors', {user: user, errorMessage});
  }
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies["user_id"]];
  if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
    const longURL = req.body.longURL;
    urlDatabase[req.params.id].longURL = longURL;
    res.redirect("/urls");
  } else {
    // res.status(403).send("Status Code 403: Urls belong to different user!");
    const errorMessage = "Cannot edit URLs they belong to a different user!"
    res.status(403).render('urls_errors', {user: user, errorMessage});
  }
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
    const errorMessage = "Please add a email and password!"
    res.status(403).render('urls_errors', {user: users[req.cookies.user_id], errorMessage});
    // res.status(400).send("Status Code 400: Please add a email and password!");
  } else if (emailExist(email, users)) {
    const errorMessage = "Account already exist please login!"
    res.status(403).render('urls_errors', {user: users[req.cookies.user_id], errorMessage});
    // res.status(400).send("Status Code 400: Account already exist please login!");
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
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const userEmail = emailExist(email, users);
  const userPassword = passwordExist(email, users);
  if (email === userEmail) {
    if (password === userPassword) {
      const userID = idExist(email, users);
      // set cookie with user id
      res.cookie("user_id", userID);
      res.redirect("/urls");
    } else {
      res.status(403).send("Status Code 403: Password doesn't match!");
    }
  } else {
    res.status(403).send("Status Code 403: Email doesn't exist!");
  }
  
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