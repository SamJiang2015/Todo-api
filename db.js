// load modules into sequelize and return the db connection to server.js

var Sequelize = require('sequelize');
var env = process.env.NODE_ENV || 'development'; // Heroku sets this env varisable to 'production'
var sequelize;

if (env === 'production') {
	// we are running on Heroku
	sequelize = new Sequelize(
		process.env.DATABASE_URL, // this is set by Heroku, where the db is installed when we install the Heroku addon
		{
			dialect: 'postgres'
		}
	);
} else {
	sequelize = new Sequelize(undefined, undefined, undefined, {
		'dialect': 'sqlite',
		'storage': __dirname + '/data/dev-todo-api.sqlite'
	})
}

// so that we can export multiple things
var db = {};

db.todo = sequelize.import(__dirname + '/models/todo.js');
db.user = sequelize.import(__dirname + '/models/user.js');
db.token = sequelize.import(__dirname + '/models/token.js');

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// setting up association between todos and user
db.todo.belongsTo(db.user);
db.user.hasMany(db.todo);

module.exports = db;