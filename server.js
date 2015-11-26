var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');
var db = require('./db.js');

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
	function(req, res) {
		var queryParams = req.query;

		var where = {};

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
	function(req, res) {
		var todoId = parseInt(req.params.id, 10);

		db.todo.findById(todoId).then(
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
app.post('/todos', function(req, res) {
	var newTodo = _.pick(req.body, 'description', 'completed'); // getting rid of the unwanted properties a user might pass in
	newTodo.description = newTodo.description.trim();

	console.log(db.todo);

	db.todo.create(newTodo).
	then(function(todo) {
			res.json(todo.toJSON());
		},
		function(e) {
			res.status(400).json(e);
		});

});

// DELETE /todos/:id 
app.delete('/todos/:id',
	function(req, res) {
		var todoId = parseInt(req.params.id, 10);
		var matchedTodo = _.findWhere(todos, {
			id: todoId
		});

		// delete the matchedTodo
		if (matchedTodo) {
			todos = _.without(todos, matchedTodo);
			res.json(matchedTodo);
		} else {
			res.status(404).json({
				"error": "no todo found with that id"
			});
		}

	});

// PUT /todos/:id
app.put('/todos/:id',
	function(req, res) {
		var body = _.pick(req.body, 'description', 'completed'); // getting rid of the unwanted properties a user might pass in
		var validAttributes = {};
		var todoId = parseInt(req.params.id, 10);
		var matchedTodo = _.findWhere(todos, {
			id: todoId
		});


		if (body.hasOwnProperty('completed') && _.isBoolean(body.completed)) {
			validAttributes.completed = body.completed;
		} else if (body.hasOwnProperty('completed')) {
			return res.status(400).send();

		} else {
			// never provided attribute completed, no problem
		}

		if (body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length > 0) {
			validAttributes.description = body.description.trim();
		} else if (body.hasOwnProperty('description')) {
			return res.status(400).send();

		} else {
			// never provided attribute completed, no problem
		}

		// update the matchedTodo
		if (matchedTodo) {
			_.extend(matchedTodo, validAttributes); // copy over properties from validAttributes to matchedTodo
			res.json(matchedTodo);

		} else {
			return res.status(404).json({
				"error": "no todo found with that id"
			});
		}

	});

db.sequelize.sync().then(function() {

	app.listen(PORT, function() {
		console.log('Server started on port ' + PORT);
	});

})