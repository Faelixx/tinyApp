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



app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get("/urls", (req, res) => {
  const templateVars = {  urls: urlDatabase , user_id: null};
  if(req.cookies["user_id"]) {
    templateVars.user_id = req.cookies["user_id"]["email"];
  };

  res.render("urls_index", templateVars);
});

app.get("/register", (req, res) => {
  const templateVars = {user_id: null}
  if (req.cookies["user_id"]) {
    templateVars.user_id = req.cookies["user_id"]["email"];
  }
  res.render("urls_register", templateVars);
});

app.post("/register", (req, res) => {
  const newUserId = generateRandomString();
  const newUser = {
    username: newUserId,
    email: req.body.email,
    password: req.body.password
  };
  userDatabase[newUserId] = newUser;
  const userCookie = newUser;
  res.cookie('user_id', userCookie);
  res.redirect('/urls');
});

app.post("/urls", (req, res) => {
  const newUrl = generateRandomString();
  urlDatabase[newUrl] = req.body.longURL;
  res.redirect(`/urls/${newUrl}`); 
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
  for (let user in userDatabase) {
    if (user === req.body.user_id[0]) {
      const userCookie = userDatabase[user]
      res.cookie("user_id", userCookie);
      }
    } 
    res.redirect('/urls');
});

app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls');
});

app.get("/urls/new", (req, res) => {
  const templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase, username: req.cookies["username"] }
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
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