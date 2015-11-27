var bcrypt = require('bcrypt');
var _ = require('underscore');

module.exports = function(sequelize, DataTypes) {

	var user = sequelize.define(
		'user', {
			email: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
				validate: {
					isEmail: true
				}
			},

			salt: {
				type: DataTypes.STRING
			},

			password_hash: {
				type: DataTypes.STRING
			},

			password: {
				type: DataTypes.VIRTUAL, // means this property does not get stored, but remains accessible
				allowNull: false,
				validate: {
					len: [7, 100]
				},
				set: function(value) {
					var salt = bcrypt.genSaltSync(10);
					var hashedPassword = bcrypt.hashSync(value, salt);

					this.setDataValue('password', value);
					this.setDataValue('salt', salt);
					this.setDataValue('password_hash', hashedPassword);
				}
			}
		}, {
			hook: {
				beforeValidate: function(user, options) {
					// convert email to lower case, otherwise we 
					// end up having multiple users with same email (different cases)
					if (typeof user.email === 'string') {
						user.email = user.email.toLowerCase();
					}
				}

			},
			classMethods: {
				authenticate: function(body) {
					return new Promise(function(resolve, reject) {

						if (typeof body.email !== 'string' || typeof body.password !== 'string') {
							return reject();
						};

						// retrieve the user with the passed-in email and do password check here
						user.findOne({
							where: {
								email: body.email
							}
						}).then(function(user) {
							if (!user || !bcrypt.compareSync(body.password, user.get('password_hash'))) {
								// user does not exist or password is wrong
								return reject();
							}

							// now user is authenticated
							return resolve(user);

						}, function(e) {
							return reject();
						});
					});
				}
			},
			instanceMethods: {
				toPublicJSON: function() {
					var json = this.toJSON();
					return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
				}
			}
		}
	);

	return user;
}