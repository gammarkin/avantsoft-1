import { expect } from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import app from '../main.js';
import UserModel from '../models/Users.js';
import { encryptPassword } from '../helpers/encrypt.js';

const request = supertest(app);

describe('User Routes', () => {
  let sandbox;
  let token;

  beforeEach(async () => {
    sandbox = sinon.createSandbox();

    const user = new UserModel({
      email: 'test@example.com',
      password: await encryptPassword('password123'),
      name: 'Test User',
    });

    await user.save();

    const res = await request
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    token = res.body.token;
  });

  afterEach(async () => {
    await UserModel.deleteMany({});
    sandbox.restore();
  });

  it('GET /users should return all users', async () => {
    sandbox.stub(UserModel, 'find').resolves([
      { name: 'Test User', email: 'test@example.com' }
    ]);

    const res = await request
      .get('/users')
      .set('Authorization', token)
      .expect(200);

    expect(res.body).to.be.an('array');
    expect(res.body[0]).to.have.property('name', 'Test User');
  });

  it('POST /users should create a new user', async () => {
    const res = await request
      .post('/users/register')
      .set('Authorization', token)
      .send({
        name: 'New User',
        email: 'new@example.com',
        password: '123456'
      })
      .expect(201);

    expect(res.body).to.have.property('message', 'User created successfully');

    const created = await UserModel.findOne({ email: 'new@example.com' });
    expect(created).to.exist;
  });

  it('POST /users/login should return a token', async () => {
    const res = await request
      .post('/users/login')
      .set('Authorization', token)
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200);

    expect(res.body).to.have.property('token');
    expect(res.body).to.have.property('message', 'Login successful');
  });

  it('POST /users/logout should destroy the session', async () => {
    const res = await request
      .post('/users/logout')
      .set('Authorization', token)
      .expect(200);

    expect(res.body).to.have.property('message', 'Session destroyed');
  });

  it('PUT /users should update user data', async () => {
    const res = await request
      .put('/users')
      .set('Authorization', token)
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Updated Name',
        newEmail: 'updated@example.com'
      })
      .expect(200);

    expect(res.body).to.have.property('message', 'User updated successfully');
    expect(res.body.newUser).to.have.property('email', 'updated@example.com');
  });

  it('DELETE /users/:email should delete the user', async () => {
    const res = await request
      .delete('/users/test@example.com')
      .set('Authorization', token)
      .expect(200);

    expect(res.body).to.have.property('message', 'User deleted successfully');

    const check = await UserModel.findOne({ email: 'test@example.com' });
    expect(check).to.be.null;
  });
});
