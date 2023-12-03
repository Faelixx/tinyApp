const express = require("express");
const { url } = require("inspector");
// const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 1337;

app.use (cookieSession ({
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
}

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
      result = true
      return result;
    };

  }
};


///////
// POST actions
///////

app.post('/urls/:id/delete', (req, res) => {
  if (req.session.userID) {
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        const deletedItem = req.params.id;
        delete urlDatabase[deletedItem];
        res.redirect('/urls');
      } 
    } res.status(400).send("Invalid command (Cannot delete URLS you did not create)");
  } res.status(403).send(mustLogin)
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
    res.status(403).send('please provide an email AND paswword.')
  }
  
  if (userLookup(req.body.email, "email")) {
    res.status(403).send('Email address has already been registered.');
  } else {
    userDatabase[newUserId] = newUser;
    req.session.userID = newUser;
    res.redirect('/urls');
  }
});

app.post('/urls/:id', (req, res) => {
  if (urlsForUser(req.session.userID["id"])) {
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        urlDatabase[id].longURL = req.body.longURL;
      }
    }
  }
  res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  req.session.userID = null;
  res.redirect('/login');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  if (userLookup(email, "email")) {
    for (let id in userDatabase) {
      if (userDatabase[id].email === email) {
        if (bcrypt.compareSync(password, userDatabase[id].hashedPassword)) {
          const userCookie = userLookup(email, "email");
          req.session.userID = userCookie;
          res.redirect('/urls');
        } else if (!bcrypt.compareSync(password, userDatabase[id].hashedPassword)) {
          res.status(403).send("Invalid email/password");
        }
      }
    }
  }
  else if(!userLookup(email, "email") || !userLookup(password, "hashedPassword")) {
    res.status(403).send("Invalid email/password");
  }
});

app.post("/urls", (req, res) => {
  if (req.session.userID && urlsForUser(req.session.userID["id"])) {
    const newUrl = generateRandomString();
    urlDatabase[newUrl] = {
      userID: req.session.userID["id"]
    };
    urlDatabase[newUrl].longURL = req.body.longURL;
    res.redirect(`/urls/${newUrl}`); 
  } 
  if (!req.session.userID) {
    res.status(403).send(mustLogin);
    }
});


///////
// GET actions
///////

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/login', (req, res) => {
  const templateVars = {  user_id: null };
  if(req.session.userID) {
    res.redirect("/urls");
  };
  res.render("urls_login", templateVars)
});


app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: {}, user_id: null }
  if (req.session.userID) {
    templateVars.user_id = req.session.userID["email"];
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        templateVars.longURL[id] = urlDatabase[id];
        if (!templateVars.longURL) {
          res.status(404).send("Short URL does not exist.");
        }
        res.render("urls_show", templateVars);
      }
    } res.status(400).send("Cannot edit urls you did not create or that do not exist.")
  } res.status(403).send(mustLogin);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.session.userID["email"] };
  if(!req.session.userID) {
    res.redirect("/login");
  };
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  let longURL;
    if (urlDatabase[req.params.id]) {
      longURL = urlDatabase[req.params.id];
      res.redirect(longURL);
    } else {
      res.status(404).send("Shortened url does not exist.");
    }
});

app.get("/urls", (req, res) => {
  const templateVars = {  urls: {} , user_id: null };
  if(req.session.userID) {
    templateVars.user_id = req.session.userID["email"];
    for (let id in urlDatabase) {
      if (urlDatabase[id].userID === req.session.userID["id"]) {
        templateVars.urls[id] = urlDatabase[id];
      }
    }
    res.render("urls_index", templateVars);
  }
  if(!req.session.userID) {
    res.status(403).send(mustLogin);
  }
});

app.get("/register", (req, res) => {
  const templateVars = {user_id: null}
  if(req.session.userID) {
    res.redirect("/urls");
  };
  res.render("urls_register", templateVars);
});

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b> World</b></body></html>\n')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});