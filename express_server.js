const PORT = 1337;

const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');
const app = express();

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['ahfjs', 'ajsdfha', '1893hg'],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

const { getUserByEmail, userLookup, generateRandomString, urlsForUser  } = require('./helpers.js');
const { urlDatabase, userDatabase } = require('./databases.js');


///////
// Error code messages
//////
const mustLogin = "Must be logged in to manage URLs.";


///////
// Methods
///////

app.get('/', (req, res) => {
  res.redirect("/urls/");
});

app.get("/register", (req, res) => {
  // user_id set to null to make web page header clear
  const templateVars = { user_id: {} };
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
    longURL = urlDatabase[req.params.id]["longURL"];
    return res.redirect(longURL);
  } else {
    console.log(req.params.id);
    return res.status(404).send("Shortened url does not exist.");
  }
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: null };
  if (req.session.userID) {
    templateVars.user_id = req.session.userID["email"];
    res.render("urls_new", templateVars);
  } else {
    return res.redirect("/login");
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
  if (req.session.userID) {
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
          const userCookie = userDatabase[id];
          req.session.userID = userCookie;
          return res.redirect('/urls');
        } else if (!bcrypt.compareSync(password, userDatabase[id].hashedPassword)) {
          return res.status(403).send("Invalid email/password");
        }
      }
    }
    // check for both username and password to prevent brute force hacking
  } else if (!getUserByEmail(email, userDatabase) || !userLookup(password, "hashedPassword", userDatabase)) {
    return res.status(403).send("Invalid email/password");
  }
});

app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
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
  } else {
    res.status(403).send(mustLogin);
  }
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: {} };
  if (req.session.userID) {
    templateVars.user_id = req.session.userID["email"];
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
  if (urlsForUser(req.session.userID["id"], urlDatabase)) {
      if (urlDatabase[req.params.id].userID === req.session.userID["id"]) {
        urlDatabase[req.params.id].longURL = req.body.longURL;
        res.redirect('/urls');
    }
  } else {
    return res.status(400);
  }
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
