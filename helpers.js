// function to make unique short url
const generateRandomString = () => {
  const numsLetters = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += numsLetters.charAt(Math.floor(Math.random() * numsLetters.length));
  }
  return result;
};


//find a user by email
const getUserByEmail = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user];
    }
  }
  return undefined;
};

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

module.exports = { generateRandomString, getUserByEmail, urlsForUser };