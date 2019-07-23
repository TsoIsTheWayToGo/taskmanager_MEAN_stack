const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
		minlength: 1,
		trim: true,
		unique: true,
	},
	password: {
		type: String,
		required: true,
		minlength: 6,
	},
	sessions: [
		{
			token: {
				type: String,
				required: true,
			},
			expiresAt: {
				type: Number,
				required: true,
			},
		},
	],
});

UserSchema.methods.toJSON = function() {
	const user = this;
	const userObject = user.toObject();

	
	return _.omit(userObject, ['password', 'sessions']);
};
