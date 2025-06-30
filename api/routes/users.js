import { Router } from 'express';
import session from 'express-session';
import jwt from 'jsonwebtoken';

import { encryptPassword, comparePassword } from '../helpers/encrypt.js';

import UserModel from '../models/Users.js';

const router = Router();
const SECRET_KEY = process.env.SECRET_KEY || 'awpsecretkey';

router.use(session({
  secret: process.env.SECRET_SESSION || 'luma',
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    secure: true, // Set to false if not using HTTPS
    maxAge: 1000 * 60 * 60 // 1 hour
  }
}));

router.get('/', async (req, res) => {
  const { name, email } = req.query;

  if (name || email) {
    const query = {};
    if (name) query.name = new RegExp(name, 'i');
    if (email) query.email = new RegExp(email, 'i');

    const users = await UserModel.find(query);

    return res.status(200).json(users);
  }

  const users = await UserModel.find();

  res.status(200).json(users);
});

router.get('/session', (req, res) => {
  if (req.session.user) {
    res.send({ session: req.session.user });
  } else {
    res.status(401).send({ message: 'No active session' });
  }
});

router.post('/register', async (req, res) => {
  const { name, email, password, dateOfBirth } = req.body;

  const hashedPassword = await encryptPassword(password);

  const user = new UserModel({
    name,
    email,
    password: hashedPassword,
    dateOfBirth,
  });

  user.save();

  res.status(201).json({ message: 'User created successfully', token: jwt.sign({ id: name, email: user.email }, SECRET_KEY, { expiresIn: '1d' }) });
})

router.get('/confirm', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_KEY || 'awpsecretkey');
    const user = await UserModel.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isConfirmed = true;
    await user.save();

    res.status(200).json({ message: 'User confirmed successfully', user: { ...user._doc, password: '' } });
  } catch (error) {
    res.status(400).json({ message: 'Invalid token' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const SECRET_KEY = process.env.SECRET_KEY || 'awpsecretkey';
  const hasEmail = await UserModel.exists({ email });

  if (!hasEmail) {
    return res.status(404).json({ message: 'User not found' });
  }

  const user = await UserModel.findOne({ email });
  const token = jwt.sign({ id: user._id, email: user.email }, SECRET_KEY, { expiresIn: '1d' });

  const passwordMatch = await comparePassword(password, user.password);

  if (!passwordMatch) {

    return res.status(401).json({ message: 'Invalid password', password, userPassword: user.password });
  }

  req.session.user = { email };
  res.status(200).json({ message: 'Login successful', token });
})

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send({ message: 'Error destroying session' });
    }
    res.send({ message: 'Session destroyed' });
  });
});

router.delete('/:email', async (req, res) => {
  const { email } = req.params;

  const user = await UserModel.deleteOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ message: 'User deleted successfully' });
});

router.put('/', async (req, res) => {
  const { name, password, email, newEmail } = req.body;

  const user = await UserModel.findOne({ email });

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  const passwordMatch = await comparePassword(password, user.password);

  if (!passwordMatch) {
    return res.status(401).json({ message: 'Invalid password' });
  }

  const updateData = { name, email: newEmail || email };
  if (password) {
    updateData.password = await encryptPassword(password);
  }

  const newUser = await UserModel.findOneAndUpdate({ email }, updateData, { new: true });

  if (!newUser) {
    return res.status(404).json({ message: 'User not found' });
  }

  res.status(200).json({ message: 'User updated successfully', newUser });
});

export default router;