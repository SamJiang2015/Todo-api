var bcrypt = require('bcrypt');
var cryptojs = require('crypto-js');
var jwt = require('jsonwebtoken');
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
				},
				findByToken: function(token) {
					return new Promise(function(resolve, reject) {
						try {
							var decodedJWT = jwt.verify(token, 'qwerty098');
							var bytes = cryptojs.AES.decrypt(decodedJWT.token, 'abc123!@#!');
							var tokenData = JSON.parse(bytes.toString(cryptojs.enc.Utf8));

							user.findById(tokenData.id).then(function(user){
								if(user) {
									resolve(user);
								} else {
									reject();
								}
							}, function() {
								reject();
							});
						} catch(e) {
							reject();
						}
					});
				}
			},
			instanceMethods: {
				toPublicJSON: function() {
					var json = this.toJSON();
					return _.pick(json, 'id', 'email', 'createdAt', 'updatedAt');
				},
				generateToken: function(type) {
					//create a new and unique token to be returned to user
					if (!_.isString(type)) {
						return undefined;
					}

					try {
						var stringData = JSON.stringify({
							id: this.get('id'),
							type: type
						});
						var encryptedData = cryptojs.AES.encrypt(stringData, 'abc123!@#!').toString();

						var token = jwt.sign({
							token: encryptedData,
						}, 'qwerty098');

						return token; 
					} catch (e) {
						return undefined;
					}
				}
			}
		}
	);

	return user;
}