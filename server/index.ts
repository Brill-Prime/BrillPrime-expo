import express from 'express';
import cors from 'cors';
import { db } from './db';
import { users, merchants, products, orders, orderItems, cartItems, notifications, addresses, paymentMethods } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import { authenticateUser, optionalAuth, AuthenticatedRequest } from './middleware/auth';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

app.get('/api/merchants/nearby', optionalAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 10;

    const nearbyMerchants = await db
      .select()
      .from(merchants)
      .where(eq(merchants.isActive, true));

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const filtered = nearbyMerchants
      .filter((merchant) => {
        if (!merchant.latitude || !merchant.longitude) return false;
        const distance = calculateDistance(
          lat,
          lng,
          parseFloat(merchant.latitude),
          parseFloat(merchant.longitude)
        );
        return distance <= radius;
      })
      .map((merchant) => ({
        ...merchant,
        distance: calculateDistance(
          lat,
          lng,
          parseFloat(merchant.latitude || '0'),
          parseFloat(merchant.longitude || '0')
        ),
      }))
      .sort((a, b) => a.distance - b.distance);

    res.json({ data: filtered, success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message, success: false });
  }
});

app.get('/api/cart', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const cartItemsData = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        updatedAt: cartItems.updatedAt,
        product: {
          id: products.id,
          name: products.name,
          price: products.price,
          imageUrl: products.imageUrl,
          merchantId: products.merchantId,
        },
        merchant: {
          id: merchants.id,
          businessName: merchants.businessName,
        },
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .leftJoin(merchants, eq(products.merchantId, merchants.id))
      .where(eq(cartItems.userId, req.userId!))
      .orderBy(sql`${cartItems.createdAt} DESC`);

    res.json({ data: cartItemsData, success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message, success: false });
  }
});

app.post('/api/cart/add', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { productId, quantity } = req.body;

    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, req.userId!), eq(cartItems.productId, productId)))
      .limit(1);

    let result;
    if (existing.length) {
      result = await db
        .update(cartItems)
        .set({ quantity: existing[0].quantity + quantity })
        .where(eq(cartItems.id, existing[0].id))
        .returning();
    } else {
      result = await db
        .insert(cartItems)
        .values({
          userId: req.userId!,
          productId,
          quantity,
        })
        .returning();
    }

    res.json({ data: result[0], success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message, success: false });
  }
});

app.put('/api/cart/:itemId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const result = await db
      .update(cartItems)
      .set({ quantity })
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, req.userId!)))
      .returning();

    res.json({ data: result[0], success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message, success: false });
  }
});

app.delete('/api/cart/:itemId', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { itemId } = req.params;

    await db
      .delete(cartItems)
      .where(and(eq(cartItems.id, itemId), eq(cartItems.userId, req.userId!)));

    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error: any) {
    res.status(400).json({ error: error.message, success: false });
  }
});

app.post('/api/orders/create', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { items, deliveryAddressId, paymentMethodId, notes } = req.body;

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId))
        .limit(1);

      if (!product.length) {
        return res.status(404).json({ error: `Product ${item.productId} not found`, success: false });
      }

      const itemTotal = parseFloat(product[0].price) * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity.toString(),
        unitPrice: product[0].price,
        totalPrice: itemTotal.toString(),
        merchantId: product[0].merchantId,
      });
    }

    const merchantId = orderItemsData[0].merchantId;
    const deliveryFee = 5.0;
    const totalAmount = subtotal + deliveryFee;

    const address = await db
      .select()
      .from(addresses)
      .where(eq(addresses.id, deliveryAddressId))
      .limit(1);

    const order = await db
      .insert(orders)
      .values({
        userId: req.userId!,
        merchantId,
        status: 'PENDING',
        totalAmount: totalAmount.toString(),
        subtotal: subtotal.toString(),
        deliveryFee: deliveryFee.toString(),
        deliveryAddress: address.length
          ? `${address[0].addressLine1}, ${address[0].city}, ${address[0].state}`
          : 'N/A',
        paymentMethod: paymentMethodId,
        notes,
      })
      .returning();

    const orderItemsWithOrderId = orderItemsData.map((item) => ({
      orderId: order[0].id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    await db.insert(orderItems).values(orderItemsWithOrderId);

    const merchant = await db
      .select()
      .from(merchants)
      .where(eq(merchants.id, merchantId!))
      .limit(1);

    if (merchant.length && merchant[0].userId) {
      await db.insert(notifications).values({
        userId: merchant[0].userId,
        title: 'New Order',
        message: `You have a new order #${order[0].id.slice(0, 8)}`,
        type: 'order',
        role: 'merchant',
        data: { order_id: order[0].id },
      });
    }

    res.json({ data: order[0], success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message, success: false });
  }
});

app.post('/api/payment/process', authenticateUser, async (req: AuthenticatedRequest, res) => {
  try {
    const { orderId, amount, paymentMethod } = req.body;

    const paymentSuccessful = true;

    if (paymentSuccessful) {
      await db
        .update(orders)
        .set({ paymentStatus: 'paid' })
        .where(eq(orders.id, orderId));

      res.json({
        data: {
          transactionId: `txn_${Date.now()}`,
          status: 'completed',
        },
        success: true,
      });
    } else {
      throw new Error('Payment failed');
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message, success: false });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
