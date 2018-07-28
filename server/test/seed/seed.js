const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

const { Todo } = require('../../models/todo');
const { User } = require('../../models/user');

const userOneId = new ObjectId();
const userTwoId = new ObjectId();
const access = 'auth';
const secret = 'abc123';

const users = [{
    _id: userOneId,
    email: 'sitvanitm@gmail.com',
    password: 'userOnePass',
    tokens: [{
        access,
        token: jwt.sign({ userOneId, access }, secret).toString()
    }]
}, {
    _id: userTwoId,
    email: 'sitvanitm@hotmail.com',
    password: 'userTwoPass',
    tokens: [{
        access,
        token: jwt.sign({ userTwoId, access }, secret).toString()
    }]
}];

const todos = [{
    _id: new ObjectId(),
    text: 'First test todo'
}, {
    _id: new ObjectId(),
    text: 'Second test todo',
    completed: true,
    completedAt: 333
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