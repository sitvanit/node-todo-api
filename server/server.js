const express = require('express');
const bodyParser = require('body-parser');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();

// middleware
app.use(bodyParser.json()); // make it possible to access req.body

app.post('/todos', (req, res) => {
    const todo = new Todo({
        text: req.body.text
    });

    todo.save().then((doc) => {
        res.send(doc); // the default status code is 200
    }, (e) => {
        res.status(400).send(e);
    })
});

app.get('/todos', async (req, res) => {
    let todos;

    try {
        todos = await Todo.find();
    } catch (e) {
        res.status(400).send(e);
    }

    res.send({ todos });
});

app.listen(3000, () => {
    console.log('Started on port 3000');
});

module.exports = { app };
