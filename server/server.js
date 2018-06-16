const express = require('express');
const bodyParser = require('body-parser');
const { ObjectId } = require('mongodb');

const { mongoose } = require('./db/mongoose');
const { Todo } = require('./models/todo');
const { User } = require('./models/user');

const app = express();
const port = process.env.PORT || 3000;

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

app.get('/todos/:id', async (req, res) => {
    let todo;
    const id = req.params.id;

    if(!ObjectId.isValid(id)) {
        return res.status(404).send();
    }

    try {
        todo = await Todo.findById(id);
    } catch (e) {
        res.status(400).send(e);
    }

    if (!todo) {
        res.status(404).send();
    }

    res.send({ todo });
});


app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

module.exports = { app };
