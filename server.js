var express = require('express');
var bodyParser = require('body-parser');
var _ = require('underscore');

var app = express();
var PORT = process.env.PORT || 3000;

var todos = [];
var todoNextId = 1;  // temp way to have a unique ID

app.use(bodyParser.json()) // whenever a JSON request comes in, bodyParser middleware will parse it.

app.get('/',
	function(req, res) {
		res.send('Todo API Root');
	});

// GET /todos;  or /todos?completed=true&q=house
app.get('/todos',
	function(req, res) {
		var queryParams = req.query;
		var filteredTodos = todos;

		if (queryParams.hasOwnProperty('completed') && queryParams.completed ==='true') {
			filteredTodos = _.where(filteredTodos, {completed: true});
		} else if (queryParams.hasOwnProperty('completed') && queryParams.completed ==='false') {
			filteredTodos = _.where(filteredTodos, {completed: false});
		} else if (queryParams.hasOwnProperty('completed')) {
			//unrecognized completed value
			res.status(400).send();
		}

		if (queryParams.hasOwnProperty('q') && queryParams.q.length>0) {
			filteredTodos = _.filter(filteredTodos, function(todo) {
				return todo.description.toLowerCase().indexOf(queryParams.q.toLowerCase()) > -1;
			})
		}

		res.json(filteredTodos); 
	});

// GET /todos/:id
app.get('/todos/:id', 
	function(req, res) {
		var todoId = parseInt(req.params.id, 10); 
		var matchedTodo = _.findWhere(todos, {id: todoId});

		if (matchedTodo) {
			res.json(matchedTodo);
		} else {
			res.status(404).send();
		}
	});

// POST /todos
app.post('/todos', function(req, res) {
	var newTodo = _.pick(req.body, 'description', 'completed');  // getting rid of the unwanted properties a user might pass in
	newTodo.description = newTodo.description.trim();

	if (_.isBoolean(newTodo.completed) && _.isString(newTodo.description) && newTodo.description.length > 0) {

		newTodo.id = todoNextId++;
		todos.push(newTodo);

		// send back the new todo in JSON form
		res.json(newTodo);		
	} else {
		res.status(404).send();
	} 

});

// DELETE /todos/:id 
app.delete('/todos/:id', 
	function(req, res) {
		var todoId = parseInt(req.params.id, 10); 
		var matchedTodo = _.findWhere(todos, {id: todoId});

		// delete the matchedTodo
		if (matchedTodo) {
			todos = _.without(todos, matchedTodo);
			res.json(matchedTodo);
		} else {
			res.status(404).json({"error": "no todo found with that id"});
		}		

	});

// PUT /todos/:id
app.put('/todos/:id', 
	function(req, res) {
		var body = _.pick(req.body, 'description', 'completed');  // getting rid of the unwanted properties a user might pass in
		var validAttributes = {};
		var todoId = parseInt(req.params.id, 10); 
		var matchedTodo = _.findWhere(todos, {id: todoId});


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
			_.extend(matchedTodo, validAttributes);  // copy over properties from validAttributes to matchedTodo
			res.json(matchedTodo);

		} else {
			return res.status(404).json({"error": "no todo found with that id"});
		}		

	});


app.listen(PORT, function() {
	console.log('Server started on port ' + PORT);
});