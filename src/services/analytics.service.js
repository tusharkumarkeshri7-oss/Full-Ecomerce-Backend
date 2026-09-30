import { Order } from '../models/order.model.js';
import { User } from '../models/user.model.js';
import { Product } from '../models/product.model.js';
import { ORDER_STATUS } from '../constants/orderStatus.js';
import { ROLES } from '../constants/roles.js';

export class AnalyticsService {
  /**
   * Get store overview metrics for admin dashboard
   */
  static async getDashboardMetrics() {
    // 1. Revenue & Order Counts
    const revenueStats = await Order.aggregate([
      {
        $match: {
          orderStatus: { $in: [ORDER_STATUS.PAID, ORDER_STATUS.PROCESSING, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalPaidOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$totalPrice' }
        }
      }
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const totalPaidOrders = revenueStats[0]?.totalPaidOrders || 0;
    const avgOrderValue = Math.round((revenueStats[0]?.averageOrderValue || 0) * 100) / 100;

    // 2. Orders by Status
    const ordersByStatus = await Order.aggregate([
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    // 3. Total customers
    const totalCustomers = await User.countDocuments({ role: ROLES.CUSTOMER });

    // 4. Low stock products alert (stock <= 5)
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .select('name sku stock price')
      .limit(10);

    // 5. Top 5 selling products by unit sales in orders
    const topSellingProducts = await Order.aggregate([
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.name' },
          sku: { $first: '$items.sku' },
          totalUnitsSold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      { $sort: { totalUnitsSold: -1 } },
      { $limit: 5 }
    ]);

    // 6. Recent 5 orders
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(5)
      .populate('user', 'name email');

    return {
      financials: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalPaidOrders,
        avgOrderValue
      },
      customers: {
        totalRegistered: totalCustomers
      },
      ordersByStatus: ordersByStatus.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      inventoryAlerts: {
        lowStockCount: lowStockProducts.length,
        items: lowStockProducts
      },
      topSellingProducts,
      recentOrders
    };
  }
}
