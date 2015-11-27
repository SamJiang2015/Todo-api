var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');
var middleware = require('./middleware.js')(db);

var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1; // temp way to have a unique ID

app.use(bodyParser.json()) // whenever a JSON request comes in, bodyParser middleware will parse it.

app.get('/',
	function(req, res) {
		res.send('Todo API Root');
	});

// GET /todos;  or /todos?completed=true&q=house
app.get('/todos',
	middleware.requireAuthentication, // hook up the middleware
	function(req, res) {
		var queryParams = req.query;
		var where = {
			userId: req.user.get('id')
		};

		if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'true') {
			where.completed = true;
		} else if (queryParams.hasOwnProperty('completed') && queryParams.completed === 'false') {
			where.completed = false;
		};

		if (queryParams.hasOwnProperty('q') && queryParams.q.length > 0) {
			where.description = {
				$like: '%' + queryParams.q + '%'
			};
		}

		db.todo.findAll({
			where: where
		}).then(
			function(todos) {
				if (todos) {
					res.json(todos);
				} else {
					res.status(404).send();
				}
			},
			function(e) {
				res.status(500).json(e);
			});

	});

// GET /todos/:id
app.get('/todos/:id',
	middleware.requireAuthentication, // hook up the middleware
	function(req, res) {
		var where = {
			id: parseInt(req.params.id, 10),
			userId: req.user.get('id')
		};

		db.todo.findOne({
			where: where
		}).then(
			function(todo) {
				if (todo) {
					res.json(todo);
				} else {
					res.status(404).send();
				}
			},
			function(e) {
				res.status(500).json(e);
			}
		);
	});

// POST /todos
app.post('/todos',
	middleware.requireAuthentication, // hook up the middleware
	function(req, res) {
		var newTodo = _.pick(req.body, 'description', 'completed'); // getting rid of the unwanted properties a user might pass in
		newTodo.description = newTodo.description.trim();

		db.todo.create(newTodo).
		then(function(todo) {
				req.user.addTodo(todo)
					.then(function() {
						// we do this because the todo has changed now that we added association with the user
						// reload will return a new todo with the association info
						return todo.reload();
					}).then(function(todo) {
						res.json(todo.toJSON());
					}).catch(function(e) {
						res.status(500).send();
					});

			},
			function(e) {
				res.status(400).json(e);
			});

	});

// DELETE /todos/:id 
app.delete('/todos/:id',
	middleware.requireAuthentication, // hook up the middleware
	function(req, res) {
		var where = {
			id: parseInt(req.params.id, 10),
			userId: req.user.get('id')
		};

		db.todo.destroy({
			where: where,
			limit: 1
		}).then(
			function(rowsDeleted) {
				if (rowsDeleted > 0) {
					res.status(204).send(); //204 signals oepration succeeded and no data is sent back
				} else {
					res.status(404).json({
						"error": "no todo found with that id"
					});
				}
			},
			function(e) {
				res.satus(500).json(e);
			}
		)
	});

// PUT /todos/:id
app.put('/todos/:id',
	middleware.requireAuthentication, // hook up the middleware
	function(req, res) {
		var body = _.pick(req.body, 'description', 'completed'); // getting rid of the unwanted properties a user might pass in
		var attributes = {};
		var where = {
			id: parseInt(req.params.id, 10),
			userId: req.user.get('id')
		};

		// build up the object containing valid attributes passed in by user
		if (body.hasOwnProperty('completed')) {
			attributes.completed = body.completed;
		}

		if (body.hasOwnProperty('description')) {
			attributes.description = body.description.trim();
		}

		// retrieve the model with the input id
		db.todo.findOne({
			where: where
		}).then(function(todo) {
				if (todo && todo.userId === req.user.id) {
					todo.update(attributes).then(function(todo) {
							res.json(todo.toJSON());
						},
						function(e) {
							res.status(400).json(e);
						}
					);
				} else {
					res.status(404).send();
				}
			},
			function(e) {
				res.status(500).json(e)
			});
	});

// add a user -- POST //users
app.post('/users',
	function(req, res) {

		var newUser = _.pick(req.body, 'email', 'password'); // getting rid of the unwanted properties a user might pass in

		db.user.create(newUser).
		then(function(user) {
				res.json(user.toPublicJSON());
			},
			function(e) {
				res.status(400).json(e);
			});
	});

// POST /users/login 
app.post('/users/login',
	function(req, res) {
		var body = _.pick(req.body, 'email', 'password');
		var userInstance; // to save the user returned from authenticate call so that it can be used in chained then();

		// we will create a class method for authentication to keep the 
		// path handler concise
		db.user.authenticate(body)
			.then(function(user) {
				var token = user.generateToken('authentication');
				userInstance = user;

				return db.token.create({
					token: token
				});
			})
			.then(function(tokenInstance) {
				res.header('Auth', tokenInstance.get('token')).json(userInstance.toPublicJSON());
			})
			.catch(function(e) {
				res.status(401).send();
			});
	});

// DELETE /users/login
app.delete('/users/login',
	middleware.requireAuthentication,
	function(req, res) {

		//delete the token instance
		req.token.destroy().then(function(){
			res.status(204).send();
		}, function() {
			res.status(500).send();
		});
	});


db.sequelize.sync({
	force: true
}).then(function() {

	app.listen(PORT, function() {
		console.log('Server started on port ' + PORT);
	});

})