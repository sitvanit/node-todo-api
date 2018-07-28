const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

const secret = process.env.JWT_SECRET;

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

    const authTokenIndex = user.tokens.findIndex((token) => token.access === 'auth');

    if (authTokenIndex !== -1) {
        user.tokens.splice(authTokenIndex, 1);
    }

    user.tokens.push({ access, token });

    // till now we updated the user locally, now we'll save the user to the DB
    return user.save().then(() => {
        return token;
    });
};

UserSchema.methods.removeToken = function (token) {
    const user = this;

    if (user.tokens.length > 0) {
        return user.update({
            $pull: {
                tokens: { token }
            }
        })
    }
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

UserSchema.statics.findByCredentials = async function (email, password) {
    const User = this;

    const user = await User.findOne({ email });
    if (!user) {
        return Promise.reject();
    }

    return new Promise((resolve, reject) => {
        bcrypt.compare(password, user.password, (err, res) => {
           res ? resolve(user) : reject();
        })
    });
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
