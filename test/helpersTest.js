const { assert } = require('chai');

const { getUserByEmail, userLookup, generateRandomString, urlsForUser } = require('../helpers.js');

const testUsers = {
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

const testUrlDatabase = {
  "b2xVn2": {
    longURL: "http://www.lighthouselabs.ca",
    userID: "abc"
  },
  "9sm5xK": {
    longURL: "http://www.google.com",
    userID: "def"
  }
};

describe('getUserByEmail', function() {
  it('should return a user with valid email', function() {
    const user = getUserByEmail("a@a.com", testUsers)
    const expectedUserID = "abc";
    assert.equal(user, expectedUserID);
  });
});

describe('getUserByEmail', function() {
  it('should return undefined if email is not found in database', function() {
    const user = getUserByEmail("d@d.com", testUsers)
    const expectedUserID = undefined;
    assert.equal(user, expectedUserID);
  });
});

describe('userLookup', function() {
  it('should return a user object, first passed argument is a value that should be in the user object second argument is the key of the user object last argument is the database',
    function() {
    const user = userLookup("a@a.com", "email", testUsers);
    const expectedUserID = testUsers.abc;
    assert.equal(user, expectedUserID);
  });
});

describe('generateRandomString', function() {
  it('should generate random string with 6 characters', function() {
    const randomStringLength = generateRandomString().length;
    const expectedLength = 6;
    assert.equal(randomStringLength, expectedLength);
  });
});

describe('urlsForUser', function() {
  it('should return true if user has URLs stored in database', function() {
    const urlsForUserBool = urlsForUser(testUsers.abc.id, testUrlDatabase) 
    const expectedBool = true;
    assert.equal(urlsForUserBool, expectedBool);
  });
});