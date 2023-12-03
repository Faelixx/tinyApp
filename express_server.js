const express = require("express");


const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 1337;

app.use(cookieSession({
  name: 'session',
  keys: ['ahfjs', 'ajsdfha', '1893hg'],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

///////
// Error code messages
//////
const mustLogin = "Must be logged in to manage URLs.";

///////
// Databases
///////

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

///////
// Functions
///////
const userLookup = function(userRef, userItem) {
  let result;
  for (let user in userDatabase) {
    if (userDatabase[user][userItem] === userRef) {
      result = userDatabase[user];
      return result;
    }
  }
};

const getUserByEmail = function(email, database) {
  let result;
  for (let user in database) {
    if (database[user]["email"] === email) {
      result = database[user];
      return result;
    }
  }
};

const generateRandomString = function() {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < 7) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

const urlsForUser = function(id) {
  let result = false;
  for (let urlId in urlDatabase) {
    if (id === urlDatabase[urlId].userID) {
      result = true;
      return result;
    }

  }
};


///////
// Methods
///////

app.get('/', (req, res) => {
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  const templateVars = { user_id: null };
  if (req.session.userID) {
    return res.redirect("/urls");
  }
  res.render("urls_register", templateVars);
});

app.get('/login', (req, res) => {
  const templateVars = { user_id: null };
  if (req.session.userID) {
    return res.redirect("/urls");
  }
  res.render("urls_login", templateVars);
});

app.post("/register", (req, res) => {
  const newUserId = generateRandomString();
  const newUser = {
    id: newUserId,
    email: req.body.email,
    password: req.body.password,
    hashedPassword: bcrypt.hashSync(req.body.password, 10)
  };
  if (req.body.email === "" || req.body.password === "") {
    return res.status(403).send('please provide an email AND paswword.');
  }
  if (getUserByEmail(req.body.email, userDatabase)) {
    return res.status(403).send('Email address has already been registered.');
  } else {
    userDatabase[newUserId] = newUser;
    req.session.userID = newUser;
    return res.redirect('/urls');
  }
});

app.get("/u/:id", (req, res) => {
  let longURL;
  if (urlDatabase[req.params.id]) {
    longURL = urlDatabase[req.params.id];
    return res.redirect(longURL);
  } else {
    return res.status(404).send("Shortened url does not exist.");
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.session.userID["email"] };
  if (req.session.userID) {
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/login");
  }
});

app.post('/urls/:id/delete', (req, res) => {
  if (req.session.userID) {
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        const deletedItem = req.params.id;
        delete urlDatabase[deletedItem];
        return res.redirect('/urls');
      }
    } return res.status(400).send("Invalid command (Cannot delete URLS you did not create)");
  } return res.status(403).send(mustLogin);
});

app.post("/urls", (req, res) => {
  if (req.session.userID && urlsForUser(req.session.userID["id"])) {
    const newUrl = generateRandomString();
    urlDatabase[newUrl] = {
      longURL: req.body.longURL,
      userID: req.session.userID["id"]
    };
    return res.redirect(`/urls/${newUrl}`);
  } else {
    res.status(403).send(mustLogin);
  }
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (getUserByEmail(email, userDatabase)) {
    for (let id in userDatabase) {
      if (userDatabase[id].email === email) {
        if (bcrypt.compareSync(password, userDatabase[id].hashedPassword)) {
          const userCookie = getUserByEmail(email, userDatabase);
          req.session.userID = userCookie;
          return res.redirect('/urls');
        } else if (!bcrypt.compareSync(password, userDatabase[id].hashedPassword)) {
          return res.status(403).send("Invalid email/password");
        }
      }
    }

  } else if (!getUserByEmail(email, userDatabase) || !userLookup(password, "hashedPassword")) {
    return res.status(403).send("Invalid email/password");
  }
});

app.post('/logout', (req, res) => {
  req.session.userID = null;
  return res.redirect('/login');
});

app.get("/urls", (req, res) => {
  const templateVars = { urls: {}, user_id: null };
  if (req.session.userID) {
    templateVars.user_id = req.session.userID["email"];
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        templateVars.urls[id] = urlDatabase[id];
      }
    }
    res.render("urls_index", templateVars);
  }
  if (!req.session.userID) {
    return res.status(403).send(mustLogin);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: {}, user_id: req.session.userID["email"] };
  if (req.session.userID) {
    let foundURL = false;
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        templateVars.longURL[id] = urlDatabase[id];
        foundURL = true;
      }
    }
    if (!foundURL) {
      return res.status(404).send("Cannot edit urls you did not create or that do not exist.");
    }
    res.render("urls_show", templateVars);
  } else {
    res.status(403).send(mustLogin);
  }
});

app.post('/urls/:id', (req, res) => {
  if (urlsForUser(req.session.userID["id"])) {
    let foundURL = false;
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        urlDatabase[id].longURL = req.body.longURL;
        foundURL = true;
      }
    }
    if (!foundURL) {
      return res.status(404);
    }
    res.redirect('/urls');
  } else {
    return res.status(400);
  }
});



app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});