const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const { Todo } = require('../../models/todo');
const { User } = require('../../models/user');

const userOneId = new ObjectId();
const userTwoId = new ObjectId();
const access = 'auth';
const secret = process.env.JWT_SECRET;

const users = [{
    _id: userOneId,
    email: 'sitvanitm@gmail.com',
    password: 'userOnePass',
    tokens: [{
        access,
        token: jwt.sign({ _id: userOneId, access }, secret).toString()
    }]
}, {
    _id: userTwoId,
    email: 'sitvanitm@hotmail.com',
    password: 'userTwoPass',
    tokens: [{
        access,
        token: jwt.sign({ _id: userTwoId, access }, secret).toString()
    }]
}];

const todos = [{
    _id: new ObjectId(),
    text: 'First test todo',
    _creator: userOneId
}, {
    _id: new ObjectId(),
    text: 'Second test todo',
    completed: true,
    completedAt: 333,
    _creator: userTwoId
}];

const populateTodos =  async () => {
    await Todo.remove({});
    await Todo.insertMany(todos);
};

const populateUsers = async () => {
    await User.remove({});

    const userOne = new User(users[0]).save();
    const userTwo = new User(users[1]).save();

    await Promise.all([userOne, userTwo]);
};

module.exports = { todos, populateTodos, users, populateUsers };