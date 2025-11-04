import { pgTable, uuid, text, boolean, timestamp, decimal, integer, jsonb, check } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firebaseUid: text('firebase_uid').notNull().unique(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  role: text('role').notNull(),
  phoneNumber: text('phone_number'),
  profileImageUrl: text('profile_image_url'),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  roleCheck: check('role_check', sql`${table.role} IN ('consumer', 'merchant', 'driver', 'admin')`)
}));

export const merchants = pgTable('merchants', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  businessName: text('business_name').notNull(),
  businessType: text('business_type'),
  location: text('location'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  country: text('country'),
  operatingHours: jsonb('operating_hours'),
  rating: decimal('rating', { precision: 2, scale: 1 }).default('0.0'),
  totalReviews: integer('total_reviews').default(0),
  isVerified: boolean('is_verified').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

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
});

export const orders = pgTable('orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  merchantId: uuid('merchant_id').references(() => merchants.id),
  status: text('status').notNull(),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }).notNull(),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }).notNull(),
  deliveryFee: decimal('delivery_fee', { precision: 10, scale: 2 }).default('0'),
  deliveryAddress: text('delivery_address').notNull(),
  deliveryType: text('delivery_type'),
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
  statusCheck: check('status_check', sql`${table.status} IN ('PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')`),
  deliveryTypeCheck: check('delivery_type_check', sql`${table.deliveryType} IN ('yourself', 'someone_else')`)
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
  type: text('type').notNull(),
  role: text('role'),
  read: boolean('read').default(false),
  priority: text('priority').default('medium'),
  data: jsonb('data'),
  action: text('action'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  typeCheck: check('type_check', sql`${table.type} IN ('order', 'promo', 'system', 'delivery', 'payment', 'promotion')`),
  roleCheck: check('role_check', sql`${table.role} IN ('consumer', 'merchant', 'driver', 'admin')`),
  priorityCheck: check('priority_check', sql`${table.priority} IN ('high', 'medium', 'low')`)
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
  messageType: text('message_type').default('text'),
  read: boolean('read').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  messageTypeCheck: check('message_type_check', sql`${table.messageType} IN ('text', 'image', 'location')`)
}));

export const paymentMethods = pgTable('payment_methods', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  lastFour: text('last_four'),
  cardBrand: text('card_brand'),
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  isDefault: boolean('is_default').default(false),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  typeCheck: check('type_check', sql`${table.type} IN ('card', 'bank', 'wallet')`)
}));

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
  location: text('location'),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const kycDocuments = pgTable('kyc_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  documentType: text('document_type').notNull(),
  documentUrl: text('document_url').notNull(),
  verificationStatus: text('verification_status').default('pending'),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  verifiedBy: uuid('verified_by').references(() => users.id),
  rejectionReason: text('rejection_reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  documentTypeCheck: check('document_type_check', sql`${table.documentType} IN ('id_card', 'passport', 'drivers_license', 'business_license', 'tax_id')`),
  verificationStatusCheck: check('verification_status_check', sql`${table.verificationStatus} IN ('pending', 'approved', 'rejected')`)
}));

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }),
  merchantId: uuid('merchant_id').references(() => merchants.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  ratingCheck: check('rating_check', sql`${table.rating} >= 1 AND ${table.rating} <= 5`)
}));
