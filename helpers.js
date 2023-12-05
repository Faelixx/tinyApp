const getUserByEmail = function(email, database) {
  let result;
  for (let user in database) {
    if (database[user]["email"] === email) {
      result = database[user]["id"];
      return result;
    }
  }
};

const userLookup = function(userRef, userItem, database) {
  let result;
  for (let user in database) {
    if (database[user][userItem] === userRef) {
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
  while (counter < 6) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};

const urlsForUser = function(id, database) {
  let result = false;
  for (let urlId in database) {
    if (id === database[urlId].userID) {
      result = true;
      return result;
    }

  }
  return result;
};


module.exports =  { getUserByEmail, userLookup, generateRandomString, urlsForUser } ;