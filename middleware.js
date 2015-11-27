// custom middleware to handle auth token, etc.
module.exports = function (db) {

	return {
		requireAuthentication: function(req, res, next) {

			var token = req.get('Auth'); 

			db.user.findByToken(token).then(function (user) {
				req.user = user;  // store the retrieved user for route handler
				next();
			}, function () {
				// error while decoding the auth header
				res.status(401).send();
			});
		}
	}
}