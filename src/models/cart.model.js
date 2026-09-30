import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    selectedAttributes: {
      type: Map,
      of: String,
      default: {}
    }
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    shippingFee: {
      type: Number,
      default: 0,
      min: 0
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Method to recalculate subtotal, tax (8%), shipping ($10 or free over $100), and total
cartSchema.methods.calculateTotals = function () {
  const subtotal = this.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  
  // Tax rate (8%)
  const tax = Math.round(roundedSubtotal * 0.08 * 100) / 100;
  
  // Shipping: free over $100, otherwise $10 if items exist
  const shippingFee = roundedSubtotal === 0 ? 0 : roundedSubtotal >= 100 ? 0 : 10;
  
  const totalPrice = Math.round((roundedSubtotal + tax + shippingFee) * 100) / 100;

  this.subtotal = roundedSubtotal;
  this.tax = tax;
  this.shippingFee = shippingFee;
  this.totalPrice = totalPrice;

  return this;
};

export const Cart = mongoose.model('Cart', cartSchema);
