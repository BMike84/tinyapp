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

//test function after lecture
const findUserByemail = (email) => {
  for (const userID in users) {
    const user = users[userID];
    if (user.email === email) {
      return user;
    }
  }
  return null;
}

// Returns an object of short URLs specific to the passed in userID
const urlsForUser = function(id, urlDatabase) {
  const userUrls = {};
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
  // test for users to see everything and see if items can delete or edit without permission
  //  const templateVars = { urls: urlDatabase, user: user };
  const templateVars = { urls: urlsForUser(req.cookies.user_id, urlDatabase), user: user };
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
  const user = users[req.cookies.user_id];
  const templateVars = { user };
  if (user) {
    res.render("urls_new", templateVars);
  } else {
    res.render("urls_login", templateVars);
  }
});

// generates the new url added
app.get("/urls/:shortURL", (req, res) => {
  const user = users[req.cookies.user_id];
  const templateVars = { shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL, user };
  res.render("urls_show", templateVars);
});
  

// uses button to delete existing url
app.post("/urls/:shortURL/delete", (req, res) => {
  const user = users[req.cookies.user_id];
  console.log('userID',req.cookies.user_id)
  console.log('userID BY url',urlDatabase[req.params.shortURL].userID)
  
  if (urlDatabase[req.params.shortURL].userID === req.cookies.user_id) {
    delete urlDatabase[req.params.shortURL];
    res.redirect("/urls");
  } else {
    const errorMessage = "Cannot delete URLs they belong to a different user!"
    res.status(403).render('urls_errors', {user: user, errorMessage});
  }
});

app.post("/urls/:id", (req, res) => {
  const user = users[req.cookies.user_id];
  if (urlDatabase[req.params.id].userID === req.cookies.user_id) {
    const longURL = req.body.longURL;
    urlDatabase[req.params.id].longURL = longURL;
    res.redirect("/urls");
  } else {
    const errorMessage = "Cannot edit URLs they belong to a different user!"
    res.status(403).render('urls_errors', {user: user, errorMessage});
  }
});

//create register page
app.get("/register", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('urls_registration', templateVars);
});

// generate a user
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || ! password) {
    const errorMessage = "Please add a email and password!"
    res.status(403).render('urls_errors', {user: users[req.cookies.user_id], errorMessage});
  }
  const user = findUserByemail(email);

  if (user) {
    const errorMessage = "Account already exist please login!"
    res.status(403).render('urls_errors', {user: users[req.cookies.user_id], errorMessage});
  }
 
  const user_id = generateRandomString();
    users[user_id] = {
      id: user_id,
      email: req.body.email,
      password: req.body.password
    };
    //generate a cookie for the user
    res.cookie('user_id', user_id);
    res.redirect("/urls");
});

//creates login page
app.get("/login", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id] };
  res.render('urls_login', templateVars);
});

app.post("/login", (req, res) => {
  const email = req.body.email.trim();
  const password = req.body.password.trim();

  if (!email || !password) {
    const errorMessage = "Invalid Credentials! Missing email or password! Try to Register!"
    res.status(403).render('urls_errors', {user: users[req.cookies.user_id], errorMessage});
  }

  const user = findUserByemail(email);

  if (!user) {
  const errorMessage = "Invalid credentials! User does not exist";
  res.status(403).render('urls_errors', {user: users[req.cookies.user_id], errorMessage});
  }
  
  if (user.password !== password) {
  const errorMessage = "Invalid credentials! Invalid password";
  res.status(403).render('urls_errors', {user: users[req.cookies.user_id], errorMessage});
  }

  res.cookie("user_id", user.id);
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