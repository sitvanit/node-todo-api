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
                    .set('x-auth', users[0].tokens[0].token)
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

                done();
            });

            it('should not create todo with invalid body data', (done) => {
                request(app)
                    .post('/todos').send({})
                    .set('x-auth', users[0].tokens[0].token)
                    .end((err, res) => {
                        expect(res.statusCode).toBe(400);
                        Todo.find().then(todos => {
                            expect(todos.length).toBe(0);
                        });
                    });
                done();
            });
        });

        describe('GET /todos', () => {
            it('should get all todos', (done) => {
                request(app)
                    .get('/todos')
                    .set('x-auth', users[0].tokens[0].token)
                    .end((err, res) => {
                        expect(res.statusCode).toBe(200);
                        expect(res.body.todos.length).toBe(1);
                    });
                done();
            });
        });

        describe('GET /todos/:id', () => {
            it('should return todo doc', (done) => {
                request(app)
                    .get(`/todos/${todos[0]._id}`)
                    .set('x-auth', users[0].tokens[0].token)
                    .end((err, res) => {
                        expect(res.statusCode).toBe(200);
                        expect(res.body.todo.text).toBe(todos[0].text);
                    });
                done();
            });

            it('should return 404 for non-object ids', (done) => {
                request(app)
                    .get('/todos/123')
                    .set('x-auth', users[0].tokens[0].token)
                    .end((err, res) => {
                        expect(res.statusCode).toBe(404);
                    });
                done();
            });

            it('should return 404 if todo is not found', (done) => {
                request(app)
                    .get(`/todos/${new ObjectId()}`)
                    .set('x-auth', users[0].tokens[0].token)
                    .end((err, res) => {
                        expect(res.statusCode).toBe(404);
                    });
                done();
            });
        });

        describe('DELETE /todos/:id', () => {
            it('should remove a todo', (done) => {
                const id = todos[1]._id;
                request(app)
                    .delete(`/todos/${id}`)
                    .set('x-auth', users[0].tokens[0].token)
                    .end((res, err) => {
                        expect(res.statusCode).toBe(200);
                        expect(res.body.todo._id).toBe(id.toString());

                        Todo.findById(id).then(todo => {
                            expect(todo).toBeFalsy();
                        });
                    });
                done()
            });

            it('should return 404 if objectId is invalid', (done) => {
                request(app)
                    .delete('/todos/123')
                    .set('x-auth', users[0].tokens[0].token)
                    .end((err, res) => {
                        expect(res.statusCode).toBe(404);
                    });
                done();
            });

            it('should return 404 if todo not found', (done) => {
                request(app)
                    .delete(`/todos/${new ObjectId}`)
                    .set('x-auth', users[0].tokens[0].token)
                    .end((err, res) => {
                        expect(res.statusCode).toBe(404);
                    });
                done();
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
            it('should update the todo', (done) => {
                const todo = todos[0];
                const text = "updated todo1";

                request(app)
                    .patch(`/todos/${todo._id}`)
                    .set('x-auth', users[0].tokens[0].token)
                    .send({ text, completed: true })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.todo.text).toBe(text);
                        expect(res.body.todo.completed).toBe(true);
                        expect(res.body.todo.completedAt).toBeTruthy();
                    });
                done();
            });

            it('should clear completedAt when todo is not completed', (done) => {
                const todo = todos[1];
                const text = "updated todo2";

                request(app)
                    .patch(`/todos/${todo._id}`)
                    .set('x-auth', users[1].tokens[0].token)
                    .send({ text, completed: false })
                    .expect(200)
                    .expect((res) => {
                        expect(res.body.todo.text).toBe(text);
                        expect(res.body.todo.completed).toBe(false);
                        expect(res.body.todo.completedAt).toBeFalsy();
                    });
                done();
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
        });

        describe('POST /users/login', () => {
            it('should login user and return auth token', async () => {
                let authHeader;
                const { _id, email, password } = users[1];

                await request(app)
                    .post('/users/login')
                    .send({ email, password })
                    .expect(200)
                    .expect((res) => {
                        authHeader = res.headers['x-auth'];
                        expect(authHeader).toBeTruthy();
                    });

                const user = await User.findById(_id);
                expect(user.tokens[0]).toHaveProperty('access', 'auth');
                expect(user.tokens[0]).toHaveProperty('token', authHeader);
            });

            it('should reject invalid login', async() => {
                const { email } = users[1];
                const password = 'wrongPassword';

                await request(app)
                    .post('/users/login')
                    .send({ email, password })
                    .expect(400)
                    .expect((res) => {
                        expect(res.body).toEqual({});
                        authHeader = res.headers['x-auth'];
                        expect(authHeader).toBeFalsy();
                    });
            });
        });

        describe('DELETE /users/me/token', () => {
            it('should remove auth token on logout', (done) => {
                const { _id, tokens } = users[0];

                request(app)
                    .delete('/users/me/token')
                    .set('x-auth', tokens[0].token)
                    .expect(200)
                    .end((err, res) => {
                        if(err) {
                            return done(err);
                        }

                        user.findById(_id).then((user) => {
                            expect(user.tokens.length).toBe(0);
                        }).catch((e) => done(e));
                    });

                done();
            })
        });
    })
});

