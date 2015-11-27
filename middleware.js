// custom middleware to handle auth token, etc.

var cryptojs = require('crypto-js');

module.exports = function(db) {

	return {
		requireAuthentication: function(req, res, next) {

			var token = req.get('Auth') || '';

			// check if the token is in DB
			db.token.findOne({
				where: {
					tokenHash: cryptojs.MD5(token).toString()
				}
			}).then(function(tokenInstance) {

				if (!tokenInstance) {
					// no token found in DB
					throw new Error();
				}

				req.token = tokenInstance;

				return db.user.findByToken(token);

			}).then(function(user) {
				req.user = user; // store the retrieved user for route handler
				next();
			}).catch(function(e) {
				console.log(e);
				res.status(401).send();
			});
		}
	}
}