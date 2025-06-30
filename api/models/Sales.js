import { Schema, model } from 'mongoose';

const salesSchema = new Schema({
  product: {
    type: String,
    required: true,
  },
  user: {
    type: String,
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
}, { versionKey: false });

const SalesModel = new model('Sales', salesSchema);

export default SalesModel;