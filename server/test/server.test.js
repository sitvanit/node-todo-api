const expect = require('expect');
const request = require('supertest');
const { ObjectId } = require('mongodb');

const { app } = require('../server');
const { Todo } = require('../models/todo');
const { User } = require('../models/user');
const { todos, populateTodos, users, populateUsers } = require('./seed/seed');

describe('todo-api', () => {
    describe('todos', () => {
        beforeEach(populateTodos);

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
            it('should get all todos', async () => {
                const res = await request(app).get('/todos');
                expect(res.statusCode).toBe(200);
                expect(res.body.todos.length).toBe(2);
            });
        });

        describe('GET /todos/:id', () => {
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
            it('should remove all', async () => {
                const res = await request(app).delete('/todos');
                expect(res.statusCode).toBe(200);
                expect(res.body.ok).toBe(1);
            });
        });

        describe('PATCH /todos/:id', () => {
            it('should update the todo', async () => {
                const todo = todos[0];
                const text = "updated todo1";
                const res = await request(app).patch(`/todos/${todo._id}`).send({ text, completed: true });
                expect(res.statusCode).toBe(200);
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(true);
                expect(res.body.todo.completedAt).toBeTruthy();
            });

            it('should clear completedAt when todo is not completed', async () => {
                const todo = todos[1];
                const text = "updated todo2";
                const res = await request(app).patch(`/todos/${todo._id}`).send({ text, completed: false });
                expect(res.statusCode).toBe(200);
                expect(res.body.todo.text).toBe(text);
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toBeFalsy();
            });
        });
    });

    describe('users', () => {
        beforeEach(populateUsers);

        describe('GET /users/me', () => {
            it('should return user if authenticated', async () => {
                request(app)
                    .get('users/me')
                    .set('x-auth', users[0].tokens[0].token)
                    .expect(200)
                    .expect((res) => {
                        expect(res.body._id).toBe(users[0]._id.toHexString());
                        expect(res.body.email).toBe(users[0].email);
                    })
            });

            it('should return 401 if not authenticated', async () => {
                request(app)
                    .get('users/me')
                    .expect(401)
                    .expect((res) => {
                        expect(res.body).toEqual({});
                    })
            });
        });

        describe('POST /users', () => {
            beforeEach(async () => {
                await User.remove({});
            });

            it('should create a user', async () => {
                const email = 'example@example.com';
                const password = '123mnb!';

                await request(app)
                    .post('/users')
                    .send({ email, password })
                    .expect(200)
                    .expect((res) => {
                        expect(res.headers['x-auth']).toBeTruthy();
                        expect(res.body._id).toBeTruthy();
                        expect(res.body.email).toBe(email);
                    });

                const user = await User.findOne({ email });
                expect(user).toBeTruthy();
                expect(user.password).not.toBe(password);
            });

            it('should return validation errors if request invalid', async () => {
                const email = '1';
                const password = '2';

                request(app)
                    .post('/users')
                    .send({ email, password })
                    .expect(400)
                    .expect((res) => {
                        expect(res.body).toEqual({});
                    })
            });

            it('should not create a user if email is already in use', async () => {
                const email = users[0].email;
                const password = 'abc123!';

                request(app)
                    .post('/users')
                    .send({ email, password })
                    .expect(400)
                    .expect((res) => {
                        expect(res.body).toEqual({});
                    })
            });
        })
    })
});

