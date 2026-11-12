import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseIdentity } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

function mapMerchant(row: Record<string, any>) {
  return {
    ...row,
    name: row.business_name,
    logoUrl: row.logo_url || undefined,
  };
}

function mapCommodity(row: Record<string, any>) {
  const merchant = Array.isArray(row.merchant) ? row.merchant[0] : row.merchant;
  return {
    ...row,
    merchantId: row.merchant_id,
    image: row.image_url || undefined,
    merchant: merchant ? mapMerchant(merchant) : undefined,
    merchantName: merchant?.business_name || 'Unknown Merchant',
  };
}

async function getMerchantAccess(
  request: Request,
  supabase: ReturnType<typeof createAdminClient>,
  merchantId: string
) {
  const identity = await requireFirebaseIdentity(request);
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('firebase_uid', identity.uid)
    .maybeSingle();
  if (userError) throw userError;
  if (!user) throw new FirebaseAuthError('User profile not found', 404);
  if (user.role === 'admin') return { user, identity };

  const { data: merchant, error: merchantError } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (merchantError) throw merchantError;
  if (!merchant) throw new FirebaseAuthError('Merchant access denied', 403);
  return { user, identity };
}

function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const supabase = createAdminClient();
    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean).slice(3);
    const [resource, id, child] = segments;
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 50)));
    const offset = Math.max(0, Number(url.searchParams.get('offset') || 0));
    const body = ['POST', 'PUT'].includes(request.method)
      ? await request.json().catch(() => null)
      : null;
    if (['POST', 'PUT'].includes(request.method) &&
      (!body || typeof body !== 'object' || Array.isArray(body))) {
      return jsonResponse({ error: 'A valid JSON object is required' }, 400);
    }

    if (resource === 'merchants' && !id && request.method === 'GET') {
      let query = supabase
        .from('merchants')
        .select('id, business_name, business_type, address, city, state, country, operating_hours, rating, total_reviews, is_verified, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse((data || []).map(mapMerchant));
    }

    if (resource === 'merchants' && !id && request.method === 'POST') {
      const identity = await requireFirebaseIdentity(request);
      const { data: user, error: userError } = await supabase.from('users')
        .select('id, role').eq('firebase_uid', identity.uid).maybeSingle();
      if (userError) throw userError;
      if (!user || !['merchant', 'admin'].includes(user.role)) {
        return jsonResponse({ error: 'A merchant account is required' }, 403);
      }
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return jsonResponse({ error: 'Merchant name is required' }, 400);
      const { data, error } = await supabase.from('merchants').insert({
        user_id: user.id,
        business_name: name,
        address: typeof body.address === 'string' ? body.address.trim() : null,
        business_type: typeof body.description === 'string' ? body.description.trim() : null,
      }).select('id, business_name, business_type, address, is_active, created_at, updated_at').single();
      if (error) throw error;
      return jsonResponse(mapMerchant(data), 201);
    }

    if (resource === 'merchants' && id && !child && request.method === 'GET') {
      const { data, error } = await supabase
        .from('merchants')
        .select('id, business_name, business_type, address, city, state, country, operating_hours, rating, total_reviews, is_verified, is_active, created_at, updated_at')
        .eq('id', id)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return data ? jsonResponse(mapMerchant(data)) : jsonResponse({ error: 'Merchant not found' }, 404);
    }

    if (resource === 'merchants' && id && !child && request.method === 'PUT') {
      await getMerchantAccess(request, supabase, id);
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (typeof body.name === 'string') updates.business_name = body.name.trim();
      if (typeof body.address === 'string') updates.address = body.address.trim();
      if (typeof body.description === 'string') updates.business_type = body.description.trim();
      const { data, error } = await supabase.from('merchants').update(updates)
        .eq('id', id).select('id, business_name, business_type, address, is_active, created_at, updated_at').maybeSingle();
      if (error) throw error;
      return data ? jsonResponse(mapMerchant(data)) : jsonResponse({ error: 'Merchant not found' }, 404);
    }

    if (resource === 'merchants' && id && !child && request.method === 'DELETE') {
      await getMerchantAccess(request, supabase, id);
      const { data, error } = await supabase.from('merchants')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id).select('id').maybeSingle();
      if (error) throw error;
      return data ? jsonResponse({ message: 'Merchant deactivated' }) : jsonResponse({ error: 'Merchant not found' }, 404);
    }

    if (resource === 'commodities' && !id && request.method === 'GET') {
      let query = supabase
        .from('products')
        .select('*, merchant:merchants!inner(id, business_name, address)')
        .eq('is_available', true)
        .eq('merchant.is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      const category = url.searchParams.get('category');
      const search = url.searchParams.get('search');
      if (category) query = query.eq('category', category);
      if (search) query = query.ilike('name', `%${search}%`);
      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse((data || []).map(mapCommodity));
    }

    if (resource === 'merchants' && id && child === 'commodities' && request.method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*, merchant:merchants!inner(id, business_name, address)')
        .eq('merchant_id', id)
        .eq('is_available', true)
        .eq('merchant.is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return jsonResponse((data || []).map(mapCommodity));
    }

    if (resource === 'merchants' && id && child === 'commodities' &&
      ['POST', 'PUT', 'DELETE'].includes(request.method)) {
      await getMerchantAccess(request, supabase, id);
      if (request.method === 'DELETE') {
        const commodityId = segments[3];
        if (!commodityId) return jsonResponse({ error: 'Commodity ID is required' }, 400);
        const { data, error } = await supabase.from('products').delete()
          .eq('id', commodityId).eq('merchant_id', id).select('id').maybeSingle();
        if (error) throw error;
        return data ? jsonResponse({ message: 'Commodity deleted' }) : jsonResponse({ error: 'Commodity not found' }, 404);
      }

      const product = body as Record<string, unknown>;
      if (request.method === 'POST') {
        const name = typeof product.name === 'string' ? product.name.trim() : '';
        const price = Number(product.price);
        if (!name || !Number.isFinite(price) || price < 0) {
          return jsonResponse({ error: 'A product name and valid price are required' }, 400);
        }
        const stockQuantity = product.stock_quantity === undefined ? 0 : product.stock_quantity;
        if (typeof stockQuantity !== 'number' || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
          return jsonResponse({ error: 'Stock quantity must be a non-negative integer' }, 400);
        }
        if (product.is_available !== undefined && typeof product.is_available !== 'boolean') {
          return jsonResponse({ error: 'is_available must be a boolean' }, 400);
        }
        const { data, error } = await supabase.from('products').insert({
          merchant_id: id,
          name,
          description: typeof product.description === 'string' ? product.description.trim() : null,
          category: typeof product.category === 'string' ? product.category : null,
          unit: typeof product.unit === 'string' ? product.unit : null,
          price,
          stock_quantity: stockQuantity,
          image_url: typeof product.image_url === 'string' ? product.image_url : null,
          is_available: product.is_available !== false,
        }).select('*, merchant:merchants(id, business_name, address)').single();
        if (error) throw error;
        return jsonResponse(mapCommodity(data), 201);
      }

      const commodityId = segments[3];
      if (!commodityId) return jsonResponse({ error: 'Commodity ID is required' }, 400);
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const field of ['name', 'description', 'category', 'unit', 'image_url', 'is_available']) {
        if (product[field] === undefined) continue;
        if (field === 'is_available' && typeof product[field] !== 'boolean') {
          return jsonResponse({ error: 'is_available must be a boolean' }, 400);
        }
        if (field !== 'is_available' && product[field] !== null && typeof product[field] !== 'string') {
          return jsonResponse({ error: `${field} must be a string` }, 400);
        }
        updates[field] = product[field];
      }
      if (product.price !== undefined) {
        const price = Number(product.price);
        if (!Number.isFinite(price) || price < 0) return jsonResponse({ error: 'A valid price is required' }, 400);
        updates.price = price;
      }
      if (product.stock_quantity !== undefined) {
        if (typeof product.stock_quantity !== 'number' || !Number.isInteger(product.stock_quantity) || product.stock_quantity < 0) {
          return jsonResponse({ error: 'Stock quantity must be a non-negative integer' }, 400);
        }
        updates.stock_quantity = product.stock_quantity;
      }
      const { data, error } = await supabase.from('products').update(updates)
        .eq('id', commodityId).eq('merchant_id', id)
        .select('*, merchant:merchants(id, business_name, address)').maybeSingle();
      if (error) throw error;
      return data ? jsonResponse(mapCommodity(data)) : jsonResponse({ error: 'Commodity not found' }, 404);
    }

    if (resource === 'merchants' && id && child === 'settings') {
      await getMerchantAccess(request, supabase, id);
      const columns = 'id, operating_hours, delivery_radius_km, minimum_order, delivery_fee, is_open, accepts_orders';
      if (request.method === 'GET') {
        const { data, error } = await supabase.from('merchants').select(columns).eq('id', id).maybeSingle();
        if (error) throw error;
        if (!data) return jsonResponse({ error: 'Merchant not found' }, 404);
        return jsonResponse({
          businessHours: data.operating_hours || {},
          deliveryRadius: data.delivery_radius_km,
          minimumOrder: Number(data.minimum_order || 0),
          deliveryFee: Number(data.delivery_fee || 0),
          isOpen: Boolean(data.is_open),
          acceptsOrders: Boolean(data.accepts_orders),
        });
      }
      if (request.method === 'PUT') {
        const settings = body as Record<string, unknown>;
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        const mapping = {
          businessHours: 'operating_hours',
          deliveryRadius: 'delivery_radius_km',
          minimumOrder: 'minimum_order',
          deliveryFee: 'delivery_fee',
          isOpen: 'is_open',
          acceptsOrders: 'accepts_orders',
        } as const;
        for (const [field, column] of Object.entries(mapping)) {
          if (settings[field] === undefined) continue;
          if (['isOpen', 'acceptsOrders'].includes(field)) {
            if (typeof settings[field] !== 'boolean') return jsonResponse({ error: `${field} must be a boolean` }, 400);
          } else if (field === 'businessHours') {
            if (!settings[field] || typeof settings[field] !== 'object' || Array.isArray(settings[field])) {
              return jsonResponse({ error: 'businessHours must be an object' }, 400);
            }
          } else if (!Number.isFinite(Number(settings[field])) || Number(settings[field]) < 0) {
            return jsonResponse({ error: `${field} must be a non-negative number` }, 400);
          }
          updates[column] = settings[field];
        }
        const { data, error } = await supabase.from('merchants').update(updates)
          .eq('id', id).select(columns).maybeSingle();
        if (error) throw error;
        return data ? jsonResponse({
          businessHours: data.operating_hours || {},
          deliveryRadius: data.delivery_radius_km,
          minimumOrder: Number(data.minimum_order || 0),
          deliveryFee: Number(data.delivery_fee || 0),
          isOpen: Boolean(data.is_open),
          acceptsOrders: Boolean(data.accepts_orders),
        }) : jsonResponse({ error: 'Merchant not found' }, 404);
      }
    }

    if (resource === 'merchants' && id && child === 'orders' && !segments[3] && request.method === 'GET') {
      await getMerchantAccess(request, supabase, id);
      let query = supabase.from('orders')
        .select('*, items:order_items(*, product:products(id, name, image_url, unit))')
        .eq('merchant_id', id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
      const status = url.searchParams.get('status');
      if (status) query = query.eq('status', status.toLowerCase() === 'accepted' ? 'CONFIRMED' : status.toUpperCase());
      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((data || []).map((order) => order.user_id).filter(Boolean))];
      const { data: users, error: usersError } = userIds.length
        ? await supabase.from('users').select('id, full_name, phone_number').in('id', userIds)
        : { data: [], error: null };
      if (usersError) throw usersError;
      const usersById = new Map((users || []).map((user) => {
        const [firstName = '', ...lastNames] = (user.full_name || '').split(' ');
        return [user.id, {
          id: user.id,
          first_name: firstName,
          last_name: lastNames.join(' '),
          phone_number: user.phone_number,
        }];
      }));

      return jsonResponse((data || []).map((order) => ({
        ...order,
        status: order.status === 'CONFIRMED' ? 'accepted' : String(order.status).toLowerCase(),
        consumer: usersById.get(order.user_id) || null,
      })));
    }

    if (resource === 'merchants' && id && child === 'orders' && segments[3] && request.method === 'GET') {
      await getMerchantAccess(request, supabase, id);
      const { data: order, error } = await supabase.from('orders')
        .select('*, items:order_items(*, product:products(id, name, image_url, unit))')
        .eq('id', segments[3])
        .eq('merchant_id', id)
        .maybeSingle();
      if (error) throw error;
      if (!order) return jsonResponse({ error: 'Order not found' }, 404);

      const { data: user, error: userError } = await supabase.from('users')
        .select('id, full_name, phone_number')
        .eq('id', order.user_id)
        .maybeSingle();
      if (userError) throw userError;
      const [firstName = '', ...lastNames] = (user?.full_name || '').split(' ');

      return jsonResponse({
        ...order,
        status: order.status === 'CONFIRMED' ? 'accepted' : String(order.status).toLowerCase(),
        consumer: user ? {
          id: user.id,
          first_name: firstName,
          last_name: lastNames.join(' '),
          phone_number: user.phone_number,
        } : null,
      });
    }

    if (resource === 'merchants' && id && child === 'customers' && request.method === 'GET') {
      await getMerchantAccess(request, supabase, id);
      const { data: orders, error: ordersError } = await supabase.from('orders')
        .select('user_id, created_at').eq('merchant_id', id).order('created_at', { ascending: false });
      if (ordersError) throw ordersError;
      const userIds = [...new Set((orders || []).map((order) => order.user_id).filter(Boolean))];
      if (!userIds.length) return jsonResponse([]);
      const { data, error } = await supabase.from('users')
        .select('id, full_name, email, phone_number').in('id', userIds);
      if (error) throw error;
      return jsonResponse((data || []).map((customer) => ({
        ...customer,
        orderCount: (orders || []).filter((order) => order.user_id === customer.id).length,
      })));
    }

    if (resource === 'merchants' && id && child === 'analytics' && request.method === 'GET') {
      await getMerchantAccess(request, supabase, id);
      const { data, error } = await supabase.from('orders')
        .select('id, status, total_amount, created_at').eq('merchant_id', id);
      if (error) throw error;
      const orders = data || [];
      return jsonResponse({
        totalOrders: orders.length,
        totalRevenue: orders.filter((order) => order.status === 'DELIVERED')
          .reduce((sum, order) => sum + Number(order.total_amount || 0), 0),
        pendingOrders: orders.filter((order) => ['PENDING', 'CONFIRMED', 'PREPARING'].includes(order.status)).length,
      });
    }

    if (resource === 'ratings' && id === 'user' && child && request.method === 'GET') {
      if (!isValidUuid(child)) return jsonResponse({ error: 'A valid merchant ID is required' }, 400);
      const { data: reviews, error } = await supabase.from('reviews')
        .select('id, user_id, rating, comment, created_at')
        .eq('merchant_id', child).order('created_at', { ascending: false });
      if (error) throw error;
      const userIds = [...new Set((reviews || []).map((review) => review.user_id))];
      const { data: users, error: usersError } = userIds.length
        ? await supabase.from('users').select('id, full_name').in('id', userIds)
        : { data: [], error: null };
      if (usersError) throw usersError;
      const nameById = new Map((users || []).map((user) => [user.id, user.full_name]));
      return jsonResponse((reviews || []).map((review) => ({
        ...review,
        createdAt: review.created_at,
        user: { fullName: nameById.get(review.user_id) || 'Anonymous' },
      })));
    }

    if (resource === 'ratings' && !id && request.method === 'POST') {
      const identity = await requireFirebaseIdentity(request);
      const { data: user, error: userError } = await supabase.from('users')
        .select('id').eq('firebase_uid', identity.uid).maybeSingle();
      if (userError) throw userError;
      if (!user) return jsonResponse({ error: 'User profile not found' }, 404);
      const review = body as Record<string, unknown>;
      const merchantId = typeof review.merchantId === 'string' ? review.merchantId : '';
      const rating = Number(review.rating);
      if (!isValidUuid(merchantId) || !Number.isInteger(rating) || rating < 1 || rating > 5) {
        return jsonResponse({ error: 'A valid merchant ID and rating from 1 to 5 are required' }, 400);
      }
      const { data: completedOrder, error: orderError } = await supabase.from('orders')
        .select('id').eq('merchant_id', merchantId).eq('user_id', user.id)
        .eq('status', 'DELIVERED').limit(1).maybeSingle();
      if (orderError) throw orderError;
      if (!completedOrder) return jsonResponse({ error: 'A delivered order is required before reviewing this merchant' }, 403);
      const { data, error } = await supabase.from('reviews').insert({
        user_id: user.id,
        merchant_id: merchantId,
        order_id: completedOrder.id,
        rating,
        comment: typeof review.comment === 'string' ? review.comment.trim() : null,
      }).select('id, rating, comment, created_at').single();
      if (error) throw error;
      return jsonResponse(data, 201);
    }

    return jsonResponse({ error: 'Catalog endpoint not found' }, 404);
  } catch (error) {
    console.error('catalog function failed:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, error instanceof FirebaseAuthError ? error.status : 500);
  }
});
