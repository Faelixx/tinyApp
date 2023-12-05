const bcrypt = require('bcryptjs');

const urlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "abc"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "def"
  }
};

const userDatabase = {
  abc: {
    id: "abc",
    email: "a@a.com",
    password: "123",
    hashedPassword: bcrypt.hashSync("123", 10)
  },
  def: {
    id: "def",
    email: "b@b.com",
    password: "456",
    hashedPassword: bcrypt.hashSync("456", 10)
  },
};

module.exports =  { userDatabase, urlDatabase } ;