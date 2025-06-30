import { Router } from 'express';

import SalesModel from '../models/Sales.js';

const router = Router();

router.get('/', async (req, res) => {
  const { product, user, date, quantity, price, total } = req.query;

  const filter = {};
  if (product) filter.product = product;
  if (user) filter.user = user;
  if (date) filter.date = date;
  if (quantity) filter.quantity = quantity;
  if (price) filter.price = price;
  if (total) filter.total = total;

  const sales = await SalesModel.find(filter);

  res.send(sales);
});

router.get('/stats', async (req, res) => {
  const today = new Date();

  const salesMadeToday = await SalesModel.find({
    date: today.toISOString().split('T')[0]
  });

  const quantitySoldToday = salesMadeToday.reduce((total, sale) => total + sale.quantity, 0).toFixed(2);
  const totalRevenueToday = salesMadeToday.reduce((total, sale) => total + sale.total, 0).toFixed(2);

  res.send({
    totalSales: salesMadeToday.length,
    quantitySoldToday,
    totalRevenueToday,
  });
})

router.get('/clients-stats/', async (req, res) => {
  const biggestBuyer = await SalesModel.aggregate([
    {
      $group: {
        _id: '$user',
        totalQuantity: { $sum: '$quantity' }
      }
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: 5 }
  ]);

  const biggestSpenderMedium = await SalesModel.aggregate([
    {
      $group: {
        _id: '$user',
        totalSpent: { $sum: '$total' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 }
  ]);

  // grab all sales and return the user with the highest total spent on a single day

  const biggestSpenderDaySpree = await SalesModel.aggregate([
    {
      $group: {
        _id: { user: '$user', date: '$date' },
        totalSpent: { $sum: '$total' }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 5 }
  ]);

  const response = {
    biggestBuyer: biggestBuyer.map(buyer => ({
      name: buyer._id,
      totalQuantity: buyer.totalQuantity,
    })),
    biggestSpenderDaySpree: biggestSpenderDaySpree.map(spender => ({
      name: spender._id.user,
      date: spender._id.date,
      totalSpent: spender.totalSpent
    })),
    biggestSpenderMedium: biggestSpenderMedium.map(spender => ({
      name: spender._id,
      totalSpent: spender.totalSpent
    })),
  };

  res.send(response);
})

router.post('/', async (req, res) => {
  const { bulk, ...restSale } = req.body;

  if (bulk && Array.isArray(bulk)) {
    const sales = bulk.map(item => ({
      product: item.product || product,
      user: item.user || user,
      date: item.date || date,
      quantity: item.quantity || quantity,
      total: item.total || (item.quantity * item.price),
      price: item.price || 0
    }));

    await SalesModel.insertMany(sales);

    return res.status(201).send({ message: 'Bulk sales created successfully', sales });
  }

  const requiredFields = ['product', 'user', 'date', 'quantity', 'price', 'total', 'quantity'];

  if (!requiredFields.every(field => restSale[field])) {
    return res.status(400).send({ message: 'All fields are required' });
  }

  const { product, user, date, quantity, price, total } = restSale;

  const sale = new SalesModel({
    product,
    user,
    date,
    quantity,
    price,
    total: total || quantity * price,
  });

  await sale.save();

  res.status(201).send({ message: 'Sale created successfully', sale });
});

export default router;