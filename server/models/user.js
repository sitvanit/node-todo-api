const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const secret = 'abc123';

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
            required: true,
            minlength: 1,
            trim: true,
            unique: true,
            validate: {
            validator: validator.isEmail,
                message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
            required: true,
            minlength: 6
    },
    tokens:[{
        access: {
            type: String,
            required: true
        },
        token: {
            type: String,
            required: true
        }
    }]
});

UserSchema.methods.toJSON = function () {
    const user = this;
    const userObject = user.toObject();

    return _.pick(userObject, ['_id', 'email']);
};

UserSchema.methods.generateAuthToken = async function () {
    const user = this;
    const access = 'auth';
    const token = jwt.sign({ _id: user._id.toHexString(), access }, secret).toString();

    user.tokens.push({ access, token });

    // till now we updated the user locally, now we'll save the user to the DB
    await user.save();

    return token;
};

UserSchema.statics.findByToken = function (token) {
    let decoded;
    const User = this;

    try {
        decoded = jwt.verify(token, secret);
    } catch (e) {
        return Promise.reject();
    }

    return User.findOne({
        '_id': decoded._id,
        'tokens.token': token,
        'tokens.access': 'auth'
    })
};

UserSchema.pre('save', function (next) {
    const user = this;

    if (user.isModified('password')) {
        bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(user.password, salt, (err, hash) => {
                user.password = hash;
                next();
            })
        });
    } else {
        next();
    }

});

const User = mongoose.model('User', UserSchema);

module.exports = { User };
