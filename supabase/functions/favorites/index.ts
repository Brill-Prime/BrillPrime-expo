import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseUid } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

type FavoriteRow = {
  id: string;
  user_id: string;
  item_id: string;
  item_type: 'merchant' | 'commodity';
  created_at: string;
};

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

async function getFavoriteDisplayData(
  supabase: ReturnType<typeof createAdminClient>,
  favorites: FavoriteRow[]
) {
  const merchantIds = favorites.filter((item) => item.item_type === 'merchant').map((item) => item.item_id);
  const commodityIds = favorites.filter((item) => item.item_type === 'commodity').map((item) => item.item_id);

  const [merchantsResult, commoditiesResult] = await Promise.all([
    merchantIds.length
      ? supabase.from('merchants').select('id, business_name, rating').in('id', merchantIds)
      : Promise.resolve({ data: [], error: null }),
    commodityIds.length
      ? supabase.from('products').select('id, name, price, image_url, merchant:merchants(business_name)').in('id', commodityIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (merchantsResult.error) throw merchantsResult.error;
  if (commoditiesResult.error) throw commoditiesResult.error;

  const merchants = new Map((merchantsResult.data || []).map((item: any) => [item.id, item]));
  const commodities = new Map((commoditiesResult.data || []).map((item: any) => [item.id, item]));

  return favorites.map((favorite) => {
    const item = favorite.item_type === 'merchant'
      ? merchants.get(favorite.item_id)
      : commodities.get(favorite.item_id);
    const productMerchant = item && 'merchant' in item ? item.merchant : null;

    return {
      id: favorite.id,
      userId: favorite.user_id,
      itemId: favorite.item_id,
      itemType: favorite.item_type,
      createdAt: favorite.created_at,
      name: item && 'business_name' in item ? item.business_name : item?.name || 'Unavailable item',
      merchant: item && 'business_name' in item ? item.business_name : productMerchant?.business_name || '',
      imageUrl: item && 'image_url' in item ? item.image_url : undefined,
      price: item && 'price' in item ? Number(item.price) : 0,
      rating: item && 'rating' in item ? Number(item.rating) : 0,
    };
  });
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (!['GET', 'POST', 'DELETE'].includes(request.method)) {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const firebaseUid = await requireFirebaseUid(request);
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .maybeSingle();
    if (userError) throw userError;
    if (!user) return jsonResponse({ error: 'User not found' }, 404);

    if (request.method === 'GET') {
      const { data, error } = await supabase
        .from('favorites')
        .select('id, user_id, item_id, item_type, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return jsonResponse(await getFavoriteDisplayData(supabase, data || []));
    }

    const url = new URL(request.url);
    let itemId = url.searchParams.get('itemId') || '';
    let itemType: 'merchant' | 'commodity' | undefined;

    if (request.method === 'POST') {
      const body = await request.json();
      itemId = typeof body?.itemId === 'string' ? body.itemId : '';
      itemType = body?.itemType;
      if (itemType !== 'merchant' && itemType !== 'commodity') {
        return jsonResponse({ error: 'itemType must be merchant or commodity' }, 400);
      }
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) {
      return jsonResponse({ error: 'A valid itemId is required' }, 400);
    }

    if (request.method === 'DELETE') {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('item_id', itemId);
      if (error) throw error;
      return jsonResponse({ message: 'Favorite removed' });
    }

    const targetTable = itemType === 'merchant' ? 'merchants' : 'products';
    const { data: target, error: targetError } = await supabase
      .from(targetTable)
      .select('id')
      .eq('id', itemId)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return jsonResponse({ error: 'Favorite item not found' }, 404);

    const { data: favorite, error: upsertError } = await supabase
      .from('favorites')
      .upsert(
        { user_id: user.id, item_id: itemId, item_type: itemType },
        { onConflict: 'user_id,item_id,item_type' }
      )
      .select('id, user_id, item_id, item_type, created_at')
      .single();
    if (upsertError) throw upsertError;
    return jsonResponse((await getFavoriteDisplayData(supabase, [favorite]))[0]);
  } catch (error) {
    if (!(error instanceof FirebaseAuthError)) {
      console.error('favorites function failed:', error);
    }
    const status = error instanceof FirebaseAuthError ? error.status : 500;
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, status);
  }
});
