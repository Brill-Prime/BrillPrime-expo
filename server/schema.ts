import { pgTable, uuid, text, timestamp, boolean, decimal, integer, jsonb, pgEnum, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const roleEnum = pgEnum('role', ['consumer', 'merchant', 'driver', 'admin']);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']);
export const deliveryTypeEnum = pgEnum('delivery_type', ['yourself', 'someone_else']);
export const notificationTypeEnum = pgEnum('notification_type', ['order', 'promo', 'system', 'delivery', 'payment', 'promotion']);
export const priorityEnum = pgEnum('priority', ['high', 'medium', 'low']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'location']);
export const paymentMethodTypeEnum = pgEnum('payment_method_type', ['card', 'bank', 'wallet']);
export const documentTypeEnum = pgEnum('document_type', ['id_card', 'passport', 'drivers_license', 'business_license', 'tax_id']);
export const verificationStatusEnum = pgEnum('verification_status', ['pending', 'approved', 'rejected']);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  role: roleEnum('role').notNull(),
  phoneNumber: text('phone_number'),
  profileImageUrl: text('profile_image_url'),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  firebaseUidIdx: index('idx_users_firebase_uid').on(table.firebaseUid),
  emailIdx: index('idx_users_email').on(table.email),
}));

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  businessName: text('business_name').notNull(),
  businessType: text('business_type'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  operatingHours: jsonb('operating_hours'),
  rating: decimal('rating', { precision: 2, scale: 1 }).default('0.0'),
  totalReviews: integer('total_reviews').default(0),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_merchants_user_id').on(table.userId),
}));

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  merchantId: uuid('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  category: text('category'),
  unit: text('unit'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  stockQuantity: integer('stock_quantity').default(0),
  imageUrl: text('image_url'),
  isAvailable: boolean('is_available').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  merchantIdIdx: index('idx_products_merchant_id').on(table.merchantId),
}));

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  merchantId: uuid('merchant_id').references(() => merchants.id),
  status: orderStatusEnum('status').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0'),
  deliveryAddress: text('delivery_address').notNull(),
  deliveryType: deliveryTypeEnum('delivery_type'),
  recipientName: text('recipient_name'),
  recipientPhone: text('recipient_phone'),
  paymentMethod: text('payment_method'),
  paymentStatus: text('payment_status').default('pending'),
  notes: text('notes'),
  estimatedDelivery: timestamp('estimated_delivery', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_orders_user_id').on(table.userId),
  merchantIdIdx: index('idx_orders_merchant_id').on(table.merchantId),
  statusIdx: index('idx_orders_status').on(table.status),
}));

export const orderItems = pgTable('order_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id),
  quantity: decimal('quantity', { precision: 10, scale: 2 }).notNull(),
  unitPrice: decimal('unit_price', { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal('total_price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: notificationTypeEnum('type').notNull(),
  role: roleEnum('role'),
  read: boolean('read').default(false),
  priority: priorityEnum('priority').default('medium'),
  data: jsonb('data'),
  action: text('action'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_notifications_user_id').on(table.userId),
  readIdx: index('idx_notifications_read').on(table.read),
}));

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  consumerId: uuid('consumer_id').references(() => users.id),
  merchantId: uuid('merchant_id').references(() => users.id),
  driverId: uuid('driver_id').references(() => users.id),
  lastMessage: text('last_message'),
  lastMessageAt: timestamp('last_message_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'cascade' }),
  senderId: uuid('sender_id').references(() => users.id),
  message: text('message').notNull(),
  messageType: messageTypeEnum('message_type').default('text'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  conversationIdIdx: index('idx_messages_conversation_id').on(table.conversationId),
}));

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: paymentMethodTypeEnum('type').notNull(),
  lastFour: text('last_four'),
  cardBrand: text('card_brand'),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const addresses = pgTable('addresses', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  label: text('label'),
  addressLine1: text('address_line1').notNull(),
  addressLine2: text('address_line2'),
  city: text('city').notNull(),
  state: text('state').notNull(),
  country: text('country').notNull(),
  postalCode: text('postal_code'),
  latitude: decimal('latitude', { precision: 10, scale: 8 }),
  longitude: decimal('longitude', { precision: 11, scale: 8 }),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  documentType: documentTypeEnum('document_type').notNull(),
  documentUrl: text('document_url').notNull(),
  verificationStatus: verificationStatusEnum('verification_status').default('pending'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  merchantId: uuid('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const cartItems = pgTable('cart_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  userProductUnique: unique('cart_items_user_product_unique').on(table.userId, table.productId),
  userIdIdx: index('idx_cart_items_user_id').on(table.userId),
  productIdIdx: index('idx_cart_items_product_id').on(table.productId),
}));

export const driverLocations = pgTable('driver_locations', {
  id: uuid('id').primaryKey().defaultRandom(),
  driverId: uuid('driver_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  latitude: decimal('latitude', { precision: 10, scale: 8 }).notNull(),
  longitude: decimal('longitude', { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal('accuracy', { precision: 10, scale: 2 }),
  timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  driverIdIdx: index('idx_driver_locations_driver_id').on(table.driverId),
  timestampIdx: index('idx_driver_locations_timestamp').on(table.timestamp),
}));

export const usersRelations = relations(users, ({ many }) => ({
  merchants: many(merchants),
  orders: many(orders),
  notifications: many(notifications),
  paymentMethods: many(paymentMethods),
  addresses: many(addresses),
  kycDocuments: many(kycDocuments),
  reviews: many(reviews),
  cartItems: many(cartItems),
}));

export const merchantsRelations = relations(merchants, ({ one, many }) => ({
  user: one(users, {
    fields: [merchants.userId],
    references: [users.id],
  }),
  products: many(products),
  orders: many(orders),
  reviews: many(reviews),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [products.merchantId],
    references: [merchants.id],
  }),
  orderItems: many(orderItems),
  cartItems: many(cartItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  orderItems: many(orderItems),
  conversations: many(conversations),
  reviews: many(reviews),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
