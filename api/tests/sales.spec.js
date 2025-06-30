import { expect } from 'chai';
import sinon from 'sinon';
import supertest from 'supertest';
import app from '../main.js';
import SalesModel from '../models/Sales.js';
import UserModel from '../models/Users.js';
import { encryptPassword } from '../helpers/encrypt.js';

const request = supertest(app);

describe('Sales Routes', () => {
  let sandbox;
  let token;

  const fakeSales = [
    {
      product: 'TV',
      user: 'Alice',
      date: '2025-06-28',
      quantity: 2,
      price: 500,
      total: 1000
    },
    {
      product: 'Phone',
      user: 'Bob',
      date: '2025-06-28',
      quantity: 1,
      price: 800,
      total: 800
    }
  ];

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

  it('GET /sales should return filtered sales', async () => {
    sandbox.stub(SalesModel, 'find').resolves(fakeSales);

    const res = await request
      .get('/sales')
      .set('Authorization', token)
      .query({ user: 'Alice' })
      .expect(200);

    expect(res.body).to.be.an('array');
    expect(res.body[0]).to.include({ user: 'Alice' });
  });

  it('GET /sales/stats should return today\'s statistics', async () => {
    const today = new Date().toISOString().split('T')[0];
    const salesToday = [
      { quantity: 1, total: 100 },
      { quantity: 2, total: 200 }
    ];

    sandbox.stub(SalesModel, 'find').resolves(salesToday);

    const res = await request
      .get('/sales/stats')
      .set('Authorization', token)
      .expect(200);

    expect(res.body).to.include({
      totalSales: 2,
      quantitySoldToday: '3.00',
      totalRevenueToday: '300.00'
    });
  });

  it('GET /sales/clients-stats should return aggregated client data', async () => {
    sandbox.stub(SalesModel, 'aggregate')
      .onFirstCall().resolves([{ _id: 'Alice', totalQuantity: 5 }]) // biggestBuyer
      .onSecondCall().resolves([{ _id: 'Bob', totalSpent: 3000 }]) // biggestSpenderMedium
      .onThirdCall().resolves([{ _id: { user: 'Carol', date: '2025-06-27' }, totalSpent: 5000 }]); // biggestSpenderDaySpree

    const res = await request
      .get('/sales/clients-stats')
      .set('Authorization', token)
      .expect(200);

    expect(res.body.biggestBuyer).to.deep.equal({ name: 'Alice', totalQuantity: 5 });
    expect(res.body.biggestSpenderMedium).to.deep.equal({ name: 'Bob', totalSpent: 3000 });
    expect(res.body.biggestSpenderDaySpree).to.deep.equal({
      name: 'Carol',
      date: '2025-06-27',
      totalSpent: 5000
    });
  });

  it('POST /sales should create a single sale', async () => {
    const saleData = {
      product: 'Laptop',
      user: 'Dani',
      date: '2025-06-28',
      quantity: 1,
      price: 1500,
      total: 1500
    };

    sandbox.stub(SalesModel.prototype, 'save').resolves(saleData);

    const res = await request
      .post('/sales')
      .set('Authorization', token)
      .send(saleData)
      .expect(201);

    expect(res.body.message).to.equal('Sale created successfully');
    expect(res.body.sale).to.include({ product: 'Laptop', user: 'Dani' });
  });

  it('POST /sales should return 400 if missing fields', async () => {
    const res = await request
      .post('/sales')
      .set('Authorization', token)
      .send({ product: 'TV' }) // missing required fields
      .expect(400);

    expect(res.body).to.have.property('message', 'All fields are required');
  });

  it('POST /sales with bulk array should insert multiple sales', async () => {
    const bulkData = [
      {
        product: 'Mouse',
        user: 'John',
        date: '2025-06-28',
        quantity: 2,
        price: 50,
        total: 100
      },
      {
        product: 'Keyboard',
        user: 'John',
        date: '2025-06-28',
        quantity: 1,
        price: 100,
        total: 100
      }
    ];

    sandbox.stub(SalesModel, 'insertMany').resolves(bulkData);

    const res = await request
      .post('/sales')
      .set('Authorization', token)
      .send({ bulk: bulkData })
      .expect(201);

    expect(res.body.message).to.equal('Bulk sales created successfully');
    expect(res.body.sales).to.have.lengthOf(2);
  });
});
