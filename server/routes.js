var helpers = require('./helpers.js');

module.exports = function(app, express, io) {

  // GET to request index.html from root.
  app.get('/', function(req, res) {
    res.sendFile('../../client/index.html');
  });

  // POST to create a new spot from CreateView.
  app.post('/api/create', function(req, res) {
    var spot = req.body;
    helpers.checkToken(JSON.parse(req.headers.token), function (decoded) {
      spot.creatorId = decoded.userId;
      spot.creator = decoded.username;
      helpers.createSpot(spot, function(newSpot) {
        res.send(newSpot);
      }, function(err) {
        res.send(err);
      });
    }, function (message) {
      res.send(404, message);
    });
  });

  // POST to request search results for a specific spot from SearchView.
  app.post('/api/search', function(req, res) {
    var search = req.body.search;
    helpers.search(search, function(results) {
      res.json(results);
    }, function(err) {
      res.send(404);
    });
  });

  // GET to request all spots for either MapView or FeedView.
  app.get('/api/map', function(req, res) {
    var location = req.query.location;
    helpers.getSpots(location, function(results) {
      res.json(results);
    }, function(err) {
      res.send(404);
    });
  });

  // POST to create a new user from SignupView.
  app.post('/api/signup', function(req, res) {
    var user = {
      username: req.body.username.toLowerCase(),
      password: req.body.password,
      email: req.body.email
    };

    helpers.signup(user, function(result) {
      res.json(result);
    }, function(message) {
      res.send(404, message);
    });
  });

  // POST to submit user credentials from LoginView.
  app.post('/api/login', function(req, res) {
    var user = {
      username: req.body.username.toLowerCase(),
      password: req.body.password
    };
    helpers.signin(user, function(result) {
      res.json(result);
    }, function(message) {
      res.send(404, message);
    });
  });

  // GET to retrieve a user's profile by userId.
  app.get('/api/profile/:id', function(req, res) {
    var id = req.params.id;
    if (req.headers.token) {
      helpers.checkToken(JSON.parse(req.headers.token), function (decoded) {
        var currentUserId = decoded.userId.toString();
        helpers.getProfile(id, function(result) {
          res.json({result: result, currentUser: (id === currentUserId)});
        }, function(err) {
          res.send(404);
        });
      }, function (err) {
        if (id) {
          helpers.getProfile(id, function(result) {
            res.json({result: result, currentUser: false});
          }, function(err) {
            res.send(404);
          });
        } else {
          res.send(404, err);
        }
      });
    } else {
      helpers.getProfile(id, function(result) {
        res.json({result: result, currentUser: false});
      }, function(err) {
        res.send(404);
      });
    }
  });

  // PUT to update the user's profile.
  app.put('/api/profile', function (req, res){
    if (req.headers.token) {
      helpers.checkToken(JSON.parse(req.headers.token), function (decoded) {
        var userId = decoded.userId.toString();
        helpers.updateProfile(userId, req.body, function () {
          res.sendStatus(202);
        }, function (err) {
          res.sendStatus(404);
        });
      }, function (err) {
        res.send(404, 'invalid token');
      });
    } else {
      res.send(404, 'user not signed in');
    }
  });

  // GET to retrieve a spot's information by spotId.
  app.get('/api/spot/:id', function(req, res) {
    var id = Number(req.params.id);

    helpers.getSpot(id, function(result) {
      helpers.getProfile(result.creatorId, function(profile) {
        result.img = profile.img;
        res.json(result);
      }, function(error) {
        res.json(result);
      })
    }, function(err) {
      res.send(404, err);
    });
  });

  //GET to retrieve the user's feed data.
  app.get('/api/feed/:id', function(req, res) {
    var id = Number(req.params.id);

    helpers.getFeed(id, function(results) {
      res.json(results);
    }, function(err) {
      res.send(404, err);
    });
  });

  // POST to add another user to your follow list.
  app.post('/api/followUser', function(req, res) {
    var userId = req.body.userId;
    var followUser = req.body.followUser;
    helpers.followUser(userId, followUser, function(data) {
      res.json(data);
    }, function(err) {
      res.send(404, err);
    });
  });

  // POST to save a user's new spot.
  app.post('/api/saveSpot', function(req, res) {
    var userId = req.body.userId;
    var spotId = req.body.spotId;
    helpers.saveSpot(userId, spotId, function(data) {
      res.json(data);
    }, function(err) {
      res.send(404, err);
    });
  });

  // Socket.io logic for MapView (marker updates), SpotView (chat), and FeedView (feed updates).
  io.sockets.on('connection', function(socket) {

    /* Spot socket */

    // Listen for whenever a new spot is created, and
    // broadcast spotAdded event to trigger client-side map refresh.
    socket.on('newSpot', function(newSpot){
      socket.broadcast.emit('spotDrop', newSpot);

      // Update live feed when a user you're subscribed to creates a new spot.
      var followersArray = [];
      var followers = newSpot.followers;
      var newSpotFollowers = [];
      followers.forEach(function(follower) {
        newSpotFollowers.push(follower.userId);
      });

      helpers.getFollowers(newSpot.followers, function(data) {
        data.Items.forEach(function(users) {
          if(!users.lastId) {
            if(newSpotFollowers.indexOf(users.userId) !== -1) {
              followersArray.push(users.socketId);
            }
          }
        });

        followersArray.forEach(function(user) {
          var currSockets = io.sockets.clients();
          var currentUsers = Object.keys(currSockets.connected);
          if(currentUsers.indexOf(user) !== -1) {
            io.sockets.connected[user].emit('updateFeed');
          }
        });
      });
    });

    // Updates the user's socket id everytime they log in, sign up, or refresh page.
    socket.on('updateSocket', function(data) {
      helpers.addSocketId({userid: data, socket_id: socket.id}, function(data) {
        console.log('successfully updated user\'s socket id');
      });
    });

    /* Chat socket events */

    // Listen for whenever a chat message is sent.
    socket.on('messageSend', function(message){
      helpers.postMessageToDatabase(message.spotId, message.username, message.text, message.timeStamp);
      io.emit('newMessage', {username: message.username, text: message.text, spotId: message.spotId, timeStamp: message.timeStamp});
    });

    // Listen for request to populate a spot's chat window, retrieve and return messages.
    socket.on('populateChat', function(id) {
      helpers.getMessagesFromDatabase(id, function(data) {
        io.sockets.connected[socket.id].emit('returnChat', data);
      });
    });
  });
};
