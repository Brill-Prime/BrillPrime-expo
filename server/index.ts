import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { db } from './db';
import { users, merchants, products, orders, orderItems, notifications, conversations, messages, paymentMethods, addresses, kycDocuments, reviews } from '../shared/schema';
import { eq, and, or, desc } from 'drizzle-orm';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'apikey'],
}));

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'Server is running' });
});

app.post('/api/orders/create', async (c) => {
  try {
    const body = await c.req.json();
    const { userId, items, deliveryAddressId, paymentMethodId, notes, firebaseUid } = body;

    let userRecord = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    
    if (!userRecord || userRecord.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const user = userRecord[0];

    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const productResult = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      
      if (!productResult || productResult.length === 0) {
        return c.json({ success: false, error: `Product ${item.productId} not found` }, 404);
      }

      const product = productResult[0];
      const itemTotal = Number(product.price) * item.quantity;
      subtotal += itemTotal;

      orderItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
        totalPrice: itemTotal.toString(),
        merchantId: product.merchantId,
      });
    }

    const merchantId = orderItemsData[0].merchantId;
    const deliveryFee = 5.00;
    const totalAmount = subtotal + deliveryFee;

    const addressResult = await db.select().from(addresses).where(eq(addresses.id, deliveryAddressId)).limit(1);
    
    if (!addressResult || addressResult.length === 0) {
      return c.json({ success: false, error: 'Address not found' }, 404);
    }

    const address = addressResult[0];

    const newOrder = await db.insert(orders).values({
      userId: user.id,
      merchantId,
      status: 'PENDING',
      totalAmount: totalAmount.toString(),
      subtotal: subtotal.toString(),
      deliveryFee: deliveryFee.toString(),
      deliveryAddress: `${address.addressLine1}, ${address.city}, ${address.state}`,
      paymentMethod: paymentMethodId,
      notes,
    }).returning();

    const order = newOrder[0];

    const orderItemsToInsert = orderItemsData.map(item => ({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity.toString(),
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    await db.insert(orderItems).values(orderItemsToInsert);

    await db.insert(notifications).values({
      userId: merchantId,
      title: 'New Order',
      message: `You have a new order #${order.id.slice(0, 8)}`,
      type: 'order',
      role: 'merchant',
      data: { orderId: order.id },
    });

    return c.json({ success: true, data: order });
  } catch (error) {
    console.error('Error creating order:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.get('/api/users/:firebaseUid', async (c) => {
  try {
    const firebaseUid = c.req.param('firebaseUid');
    const userResult = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    
    if (!userResult || userResult.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({ success: true, data: userResult[0] });
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.post('/api/users', async (c) => {
  try {
    const body = await c.req.json();
    const newUser = await db.insert(users).values(body).returning();
    return c.json({ success: true, data: newUser[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.get('/api/orders/user/:firebaseUid', async (c) => {
  try {
    const firebaseUid = c.req.param('firebaseUid');
    const userResult = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    
    if (!userResult || userResult.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const user = userResult[0];
    const userOrders = await db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt));

    return c.json({ success: true, data: userOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.get('/api/products', async (c) => {
  try {
    const allProducts = await db.select().from(products).where(eq(products.isAvailable, true));
    return c.json({ success: true, data: allProducts });
  } catch (error) {
    console.error('Error fetching products:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

app.get('/api/notifications/user/:firebaseUid', async (c) => {
  try {
    const firebaseUid = c.req.param('firebaseUid');
    const userResult = await db.select().from(users).where(eq(users.firebaseUid, firebaseUid)).limit(1);
    
    if (!userResult || userResult.length === 0) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const user = userResult[0];
    const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, user.id)).orderBy(desc(notifications.createdAt));

    return c.json({ success: true, data: userNotifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }, 500);
  }
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server starting on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
