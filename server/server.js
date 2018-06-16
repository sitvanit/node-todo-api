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

/** post **/
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

/** find all **/
app.get('/todos', async (req, res) => {
    let todos;
    // try to find
    try {
        todos = await Todo.find();
    } catch (e) {
        res.status(400).send(e);
    }
    // send response
    res.send({ todos });
});

/** find by id **/
app.get('/todos/:id', async (req, res) => {
    let todo;
    const id = req.params.id;
    // validate id
    if(!ObjectId.isValid(id)) {
        return res.status(404).send();
    }
    // try to find
    try {
        todo = await Todo.findById(id);
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

/** delete by id **/
app.delete('/todos/:id', async (req, res) => {
    let todo;
    const id = req.params.id;
    // validate id
    if(!ObjectId.isValid(id)) {
        return res.status(404).send();
    }
    // try to remove
    try {
        todo = await Todo.findByIdAndRemove(id);
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

     try {
         result = await Todo.remove({});
    } catch (e) {
         return res.status(400).send();
     }

     res.send(result);
});


app.listen(port, () => {
    console.log(`Started up at port ${port}`);
});

module.exports = { app };
