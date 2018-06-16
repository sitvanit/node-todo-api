const expect = require('expect');
const request = require('supertest');

const { app } = require('../server');
const { Todo } = require('../models/todo');

beforeEach(async () => {
    await Todo.remove({})
});

describe('POST /todos', () => {
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