var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;  // temp way to have a unique ID

app.use(bodyParser.json()); // whenever a JSON request comes in, bodyParser middleware will parse it.

app.get('/',
	function(req, res) {
		res.send('Todo API Root');
	});

// GET /todos
app.get('/todos',
	function(req, res) {
		res.json(todos);  // will convert todos object into JSON and send
	});

// GET /todos/:id
app.get('/todos/:id', 
	function(req, res) {
		var todoId = parseInt(req.params.id, 10); 
		var matchedTodo;

		todos.forEach(function(todo) {
			if (todo.id === todoId) {
				matchedTodo = todo;
			}
		})

		if (matchedTodo) {
			res.json(matchedTodo);
		} else {
			res.status(404).send();
		}
	});

// POST /todos
app.post('/todos', function(req, res) {
	var newTodo = req.body;

	newTodo.id = todoNextId++;

	todos.push(newTodo);

	res.json(newTodo);
});


app.listen(PORT, function() {
	console.log('Server started on port ' + PORT);
});