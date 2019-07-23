const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { mongoose } = require('./db/mongoose');
const { List, Task, User } = require('./db/models');

const jwt = require('jsonwebtoken');
/* ROUTE HANDLERS */
/* LIST ROUTES */

//load middleware
app.use(bodyParser.json());

let authenticate = (req, res, next) => {
	let token = req.header('x-access-token');

	// verify the JWT
	jwt.verify(token, User.getJWTSecret(), (err, decoded) => {
		if (err) {
			// there was an error
			// jwt is invalid - * DO NOT AUTHENTICATE *
			res.status(401).send(err);
		} else {
			// jwt is valid
			req.user_id = decoded._id;
			next();
		}
	});
};

// Verify Refresh Token Middleware
let verifySession = (req, res, next) => {

	let refreshToken = req.header('x-refresh-token');
	let _id = req.header('_id');

	User.findByIdAndToken(_id, refreshToken)
		.then(user => {
			if (!user) {

				return Promise.reject({
					error: 'User not found. Make sure that the refresh token and user id are correct',
				});
			}

			req.user_id = user._id;
			req.userObject = user;
			req.refreshToken = refreshToken;

			let isSessionValid = false;

			user.sessions.forEach(session => {
				if (session.token === refreshToken) {

					if (User.hasRefreshTokenExpired(session.expiresAt) === false) {

						isSessionValid = true;
					}
				}
			});

			if (isSessionValid) {

				next();
			} else {

				return Promise.reject({
					error: 'Refresh token has expired or the session is invalid',
				});
			}
		})
		.catch(e => {
			res.status(401).send(e);
		});
};

//CORS Header middleware
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, POST, HEAD, OPTIONS, PUT, PATCH, DELETE');
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept, x-access-token, x-refresh-token, _id'
	);

	res.header('Access-Control-Expose-Headers', 'x-access-token, x-refresh-token');

	next();
});


//GET /lists
//Purpose: Get all List
app.get('/lists', authenticate, (req, res) => {

	List.find({
		_userId: req.user_id,
	})
		.then(lists => {
			res.send(lists);
		})
		.catch(e => {
			res.send(e);
		});
});

//POST /lists
//Purpose: Create a new list
app.post('/lists', authenticate, (req, res) => {

	let title = req.body.title;

	let newList = new List({
		title,
		_userId: req.user_id,
	});
	newList.save().then(listDoc => {

		res.send(listDoc);
	});
});

//PATCH /lists/:id
//Purpose: Update/edit a list

app.patch('/lists/:id', authenticate, (req, res) => {

	List.findOneAndUpdate(
		{ _id: req.params.id, _userId: req.user_id },
		{
			$set: req.body,
		}
	).then(() => {
		res.send({ message: 'updated successfully' });
	});
});

//DELETE /lists/:id
//Purpose: Delete a list

app.delete('/lists/:id', authenticate, (req, res) => {
	
	List.findOneAndRemove({
		_id: req.params.id,
		_userId: req.user_id,
	}).then(removedListDoc => {
		res.send(removedListDoc);

		deleteTasksFromList(removedListDoc._id);
	});
});

//GET /lists/:listId/tasks
//Purpose: Get all task in a specific list
app.get('/lists/:listId/tasks', authenticate, (req, res) => {
	
	Task.find({
		_listId: req.params.listId,
	}).then(tasks => {
		res.send(tasks);
	});
});

//POST /lists/:listId/tasks
//Purpose: Get all task in a specific list
app.post('/lists/:listId/tasks', authenticate, (req, res) => {

	List.findOne({
		_id: req.params.listId,
		_userId: req.user_id,
	})
		.then(list => {
			if (list) {

				return true;
			}

			return false;
		})
		.then(canCreateTask => {
			if (canCreateTask) {
				let newTask = new Task({
					title: req.body.title,
					_listId: req.params.listId,
				});
				newTask.save().then(newTaskDoc => {
					res.send(newTaskDoc);
				});
			} else {
				res.sendStatus(404);
			}
		});
});

//PATCH /lists/:listId/tasks/:id
//Purpose: find and update a task
app.patch('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {

	List.findOne({
		_id: req.params.listId,
		_userId: req.user_id,
	})
		.then(list => {
			if (list) {

				return true;
			}

			return false;
		})
		.then(canUpdateTasks => {
			if (canUpdateTasks) {

				Task.findOneAndUpdate(
					{
						_id: req.params.taskId,
						_listId: req.params.listId,
					},
					{
						$set: req.body,
					}
				).then(() => {
					res.send({ message: 'Updated successfully.' });
				});
			} else {
				res.sendStatus(404);
			}
		});
});

//DELETE /lists/:listId/tasks/:taskId
//Purpose: find and delete a task
app.delete('/lists/:listId/tasks/:taskId', authenticate, (req, res) => {
	List.findOne({
		_id: req.params.listId,
		_userId: req.user_id,
	})
		.then(list => {
			if (list) {

				return true;
			}

			return false;
		})
		.then(canDeleteTasks => {
			if (canDeleteTasks) {
				Task.findOneAndRemove({
					_id: req.params.taskId,
					_listId: req.params.listId,
				}).then(removedTaskDoc => {
					res.send(removedTaskDoc);
				});
			} else {
				res.sendStatus(404);
			}
		});
});


//GET /lists/:listId/tasks/:taskId
//Purpose: find one task (not needed)
app.get('/lists/:listId/tasks/:taskId', (req, res) => {
	Task.findOne({ _id: req.params.taskId, _listId: req.params.listId }).then(task => res.send(task));
});
app.listen(3000, () => {
	console.log('Server is listening on port 3000');
});


// User Routes


//  POST /users
// Purpose: Sign up
 
app.post('/users', (req, res) => {
    // User sign up

    let body = req.body;
    let newUser = new User(body);

    newUser.save().then(() => {
        return newUser.createSession();
    }).then((refreshToken) => {
        // Session created successfully - refreshToken returned.
        // now we geneate an access auth token for the user

        return newUser.generateAccessAuthToken().then((accessToken) => {
            // access auth token generated successfully, now we return an object containing the auth tokens
            return { accessToken, refreshToken }
        });
    }).then((authTokens) => {
        // Now we construct and send the response to the user with their auth tokens in the header and the user object in the body
        res
            .header('x-refresh-token', authTokens.refreshToken)
            .header('x-access-token', authTokens.accessToken)
            .send(newUser);
    }).catch((e) => {
        res.status(400).send(e);
    })
})


// POST /users/login
//Purpose: user login
app.post('/users/login', (req, res) => {
	let email = req.body.email;
	let password = req.body.password;

	User.findByCredentials(email, password)
		.then(user => {
			return user
				.createSession()
				.then(refreshToken => {
					return user.generateAccessAuthToken().then(accessToken => {
				
						return { accessToken, refreshToken };
					});
				})
				.then(authTokens => {

					res.header('x-refresh-token', authTokens.refreshToken)
						.header('x-access-token', authTokens.accessToken)
						.send(user);
				});
		})
		.catch(e => {
			res.status(400).send(e);
		});
});


// GET /users/me/access-token
// Purpose: generates and returns an access token
// for post man testing purposes
app.get('/users/me/access-token', verifySession, (req, res) => {
  
    req.userObject.generateAccessAuthToken().then((accessToken) => {
        res.header('x-access-token', accessToken).send({ accessToken });
    }).catch((e) => {
        res.status(400).send(e);
    });
})



//helper methods

let deleteTasksFromList = _listId => {
	Task.deleteMany({
		_listId,
	}).then(() => {
		console.log('Tasks from ' + _listId + ' were deleted!');
	});
};
