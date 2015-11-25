var express = require('express');
var app = express();
var PORT = process.env.PORT || 3000;

var todos = [
	{
		id: 1,
		description: 'Meet mom for lunch',
		completed: false
	},
	{
		id: 2,
		description: 'Go to market',
		completed: false
	},
	{
		id: 3,
		description: 'Jog 10 miles',
		completed: true
	}	
];

app.get('/',
	function(req, res) {
		res.send('Todo API Root');
	});

app.get('/todos',
	function(req, res) {
		res.json(todos);  // will convert todos object into JSON and send
	});

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

app.listen(PORT, function() {
	console.log('Server started on port ' + PORT);
});