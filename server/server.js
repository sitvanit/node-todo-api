const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');
const _ = require('lodash');

require('../config/config');
const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');
const { authenticate } = require('./middleware/authenticate');

const app = express();
const port = process.env.PORT;

// middleware
app.use(bodyParser.json()); // make it possible to access req.body

/** create todos **/
app.post('/todos', authenticate, (req, res) => {
    const todo = new Todo({
        text: req.body.text,
        _creator: req.user._id
    });

    todo.save().then((doc) => {
        res.send(doc); // the default status code is 200
    }, (e) => {
        res.status(400).send(e);
    })
});

/** get all todos **/
app.get('/todos', authenticate, async (req, res) => {
    let todos;

    try {
        todos = await Todo.find({ _creator: req.user._id });
    } catch (e) {
        res.status(400).send(e);
    }
    // send response
    res.send({ todos });
});

/** get todos by id **/
app.get('/todos/:id', authenticate, async (req, res) => {
    let todo;
    const id = req.params.id;
    // validate id
    if(!ObjectId.isValid(id)) {
        return res.status(404).send();
    }
    // try to find
    try {
        todo = await Todo.findOne({ _id: id, _creator: req.user._id });
    } catch (e) {
        res.status(400).send(e);
    }
    // if found nothing
    if (!todo) {
        res.status(404).send();
    }
    // send response
    res.send({ todo });
});

/** delete todos by id **/
app.delete('/todos/:id', authenticate, async (req, res) => {
    let todo;
    const id = req.params.id;
    // validate id
    if(!ObjectId.isValid(id)) {
        return res.status(404).send();
    }
    // try to remove
    try {
        todo = await Todo.findOneAndRemove({ _id: id, _creator: req.user._id });
    } catch (e) {
        res.status(400).send(e);
    }
    // if nothing to remove
    if (!todo) {
        res.status(404).send();
    }
    // send response
    res.send({ todo });
});

/** delete all todos **/
app.delete('/todos', async (req, res) => {
    let result;
    // try to remove
    try {
         result = await Todo.remove({});
    } catch (e) {
         return res.status(400).send();
    }
    // send response
    res.send(result);
});

/** update todos **/
app.patch('/todos/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    const body = _.pick(req.body, ['text', 'completed']);
    // validate id
    if(!ObjectId.isValid(id)) {
        return res.status(404).send();
    }
    // if completed, set completed at.
    if(_.isBoolean(body.completed) && body.completed) {
        body.completedAt = new Date().getTime();
    } else {
        body.completed = false;
        body.completedAt = null;
    }
    // try to update
    try {
        todo = await Todo.findOneAndUpdate({ _id: id, _creator: req.user._id }, { $set: body }, { new: true }) // the new will return the new object. the default is the old one.
    } catch (e) {
        return res.status(400).send();
    }
    // if nothing to remove
    if (!todo) {
        res.status(404).send();
    }
    // send response
    res.send({ todo });
});

/** create user **/
app.post('/users', async (req, res) => {
    let token;
    const body = _.pick(req.body, ['email', 'password']);
    const user = new User(body);

    try {
        await user.save();
        token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);
    } catch (e) {
        res.status(400).send(e)
    }
});

/** authenticate **/
app.get('/users/me', authenticate, async (req, res) => {
    res.send(req.user);
});

/** login user - standard express route when we don't use the authenticate middleware (because we don't have the token) **/
app.post('/users/login', async (req, res) => {
    let user, token;
    const body = _.pick(req.body, ['email', 'password']);

    try {
        user = await User.findByCredentials(body.email, body.password);
        token = await user.generateAuthToken();
        res.header('x-auth', token).send(user);
    } catch (e) {
        res.status(400).send();
    }
});

/** logout user **/
app.delete('/users/me/token', authenticate, async (req, res) => {
    try {
        await req.user.removeToken(req.token);
        res.status(200).send();
    } catch (e) {
        res.status(400).send();
    }

});

app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

module.exports = { app };
