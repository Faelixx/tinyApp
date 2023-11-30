const express = require("express");
const { url } = require("inspector");
const app = express();
const PORT = 1337;
const cookieParser = require('cookie-parser') 

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const userDatabase = {
  abc: {
    id: "abc",
    email: "a@a.com",
    password: "123",
  },
  def: {
    id: "def",
    email: "b@b.com",
    password: "456",
  },
};

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

// TODO create function for new user and user search
app.post("/register", (req, res) => {
  const newUserId = generateRandomString();
  const newUser = {
    id: newUserId,
    email: req.body.email,
    password: req.body.password
  };
  if (req.body.email === "" || req.body.password === "") {
    res.status(403).send('please provide an email AND paswword.')
  }
  
  if (userLookup(req.body.email, "email")) {
    res.status(403).send('Email address has already been registered.');
  } else {
    userDatabase[newUserId] = newUser;
    const userCookie = newUser;
    res.cookie('user_id', userCookie);
    res.redirect('/urls');
  }
});

app.post("/urls", (req, res) => {
  if (req.cookies["user_id"]) {
    const newUrl = generateRandomString();
    urlDatabase[newUrl] = req.body.longURL;
    res.redirect(`/urls/${newUrl}`); 
  } 
  if (!req.cookies["user_id"]) {
    res.status(403).send("Must be logged in to create URLs.");
    }
});

app.post('/urls/:id/delete', (req, res) => {
  const deletedItem = req.params.id;
  delete urlDatabase[deletedItem];
  res.redirect('/urls');
});

app.post('/urls/:id', (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
    if (userLookup(email, "email") && userLookup(password, "password")) {
      const userCookie = userLookup(email, "email");
      res.cookie("user_id", userCookie);
      res.redirect('/urls');
    }
    else if(!userLookup(email, "email") || !userLookup(password, "password")) {
      res.status(403).send("Invalid email/password");
    }
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/login');
});

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get('/login', (req, res) => {
  const templateVars = {  urls: urlDatabase , user_id: null};
  if(req.cookies["user_id"]) {
    res.redirect("/urls");
  };
  res.render("urls_login", templateVars)
});

app.get("/urls", (req, res) => {
  const templateVars = {  urls: urlDatabase , user_id: null};
  if(req.cookies["user_id"]) {
    templateVars.user_id = req.cookies["user_id"]["email"];
  }
  if(!req.cookies["user_id"]) {
    res.status(403).send("Please sign in to shorten urls.");
  };

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {user_id: null}
  if(req.cookies["user_id"]) {
    res.redirect("/urls");
  };
  res.render("urls_register", templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = { user_id: req.cookies["user_id"] };
  if(!req.cookies["user_id"]) {
    res.redirect("/login");
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(403).send("Must be logged in to create URLs.");
    }
  if (req.cookies["user_id"]) {
    const templateVars = { id: req.params.id, longURL: urlDatabase, user_id: req.cookies["user_id"] }
    res.render("urls_show", templateVars);
  }
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

app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
});

app.get('/hello', (req, res) => {
  res.send('<html><body>Hello <b> World</b></body></html>\n')
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
