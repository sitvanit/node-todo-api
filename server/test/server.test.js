const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');

describe('POST /todos', () => {
    beforeEach(async () => {
        await Todo.remove({});
    });

    it('should create a new todo - promises', (done) => {
        const text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({ text })
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch(e => done(e))
            })
    });

    it('should create a new todo - async await', async () => {
        const text = 'Test todo text';

        const res = await request(app).post('/todos').send({ text });
        expect(res.statusCode).toBe(200);
        expect(res.body.text).toBe(text);

        const todos = await Todo.find();
        expect(todos.length).toBe(1);
        expect(todos[0].text).toBe(text);
    });

    it('should not create todo with invalid body data', async () => {
        const res = await request(app).post('/todos').send({});
        expect(res.statusCode).toBe(400);

        const todos = await Todo.find();
        expect(todos.length).toBe(0);
    });
});

describe('GET /todos', () => {
    let todos;

    beforeEach(async () => {
        todos = [{
            text: 'First test todo'
        }, {
            text: 'Second test todo'
        }];

        await Todo.remove({});
        await Todo.insertMany(todos);
    });

    it('should get all todos', async () => {
        const res = await request(app).get('/todos');
        expect(res.statusCode).toBe(200);
        expect(res.body.todos.length).toBe(2);
    });
});

describe('GET /todos/:id', () => {
    let todos;

    beforeEach(async () => {
        todos = [{
            _id: new ObjectId(),
            text: 'First test todo'
        }, {
            _id: new ObjectId(),
            text: 'Second test todo'
        }];

        await Todo.remove({});
        await Todo.insertMany(todos);
    });

    it('should return todo doc', async () => {
        const res = await request(app).get(`/todos/${todos[0]._id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.todo.text).toBe(todos[0].text);
    });

    it('should return 404 for non-object ids', async () => {
        const res = await request(app).get('/todos/123');
        expect(res.statusCode).toBe(404);
    });

    it('should return 404 if todo is not found', async () => {
        const res = await request(app).get(`/todos/${new ObjectId()}`);
        expect(res.statusCode).toBe(404);
    });
});

describe('DELETE /todos/:id', () => {
    let todos;

    beforeEach(async () => {
        todos = [{
            _id: new ObjectId(),
            text: 'First test todo'
        }, {
            _id: new ObjectId(),
            text: 'Second test todo'
        }];

        await Todo.remove({});
        await Todo.insertMany(todos);
    });

    it('should remove a todo', async () => {
        const id = todos[1]._id;
        const res = await request(app).delete(`/todos/${id}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.todo._id).toBe(id.toString());

        const todo = await Todo.findById(id);
        expect(todo).toBeFalsy();
    });

    it('should return 404 if objectId is invalid', async () => {
        const res = await request(app).delete('/todos/123');
        expect(res.statusCode).toBe(404);
    });

    it('should return 404 if todo not found', async () => {
        const res = await request(app).delete(`/todos/${new ObjectId}`);
        expect(res.statusCode).toBe(404);
    });
});

describe('DELETE /todos', () => {
    let todos;

    beforeEach(async () => {
        todos = [{
            _id: new ObjectId(),
            text: 'First test todo'
        }, {
            _id: new ObjectId(),
            text: 'Second test todo'
        }];

        await Todo.remove({});
        await Todo.insertMany(todos);
    });

    it('should remove all', async () => {
         const res = await request(app).delete('/todos');
         expect(res.statusCode).toBe(200);
         expect(res.body.ok).toBe(1);
    });
});