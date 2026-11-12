import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseIdentity } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

function addressResponse(row: Record<string, any>) {
  const coordinates = row.location?.coordinates;
  return {
    id: row.id,
    label: row.label || '',
    street: row.address_line1,
    city: row.city,
    state: row.state,
    country: row.country,
    postalCode: row.postal_code || '',
    ...(Array.isArray(coordinates) ? { longitude: coordinates[0], latitude: coordinates[1] } : {}),
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function paymentMethodResponse(row: Record<string, any>) {
  const type = row.type === 'bank' ? 'BANK_TRANSFER' : 'CARD';
  return {
    id: row.id,
    type,
    accountNumber: row.last_four ? `****${row.last_four}` : undefined,
    bankCode: undefined,
    accountName: row.bank_name || undefined,
    last4: row.last_four || undefined,
    brand: row.card_brand || undefined,
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await request.json();
    return body && typeof body === 'object' && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!['GET', 'POST', 'PUT', 'DELETE'].includes(request.method)) {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const identity = await requireFirebaseIdentity(request);
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email')
      .eq('firebase_uid', identity.uid)
      .maybeSingle();
    if (userError) throw userError;
    if (!user) return jsonResponse({ error: 'User profile not found' }, 404);

    const segments = new URL(request.url).pathname.split('/').filter(Boolean).slice(3);
    const [resource, id, child] = segments;
    const body = request.method === 'GET' || request.method === 'DELETE'
      ? null
      : await readJson(request);
    if (request.method !== 'GET' && request.method !== 'DELETE' && !body) {
      return jsonResponse({ error: 'A valid JSON object is required' }, 400);
    }

    if (resource === 'addresses') {
      if (request.method === 'GET' && !id) {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
        if (error) throw error;
        return jsonResponse((data || []).map(addressResponse));
      }

      if (request.method === 'POST' && !id) {
        const address = body!;
        if (typeof address.street !== 'string' || !address.street.trim() ||
          typeof address.city !== 'string' || !address.city.trim() ||
          typeof address.state !== 'string' || !address.state.trim() ||
          typeof address.country !== 'string' || !address.country.trim()) {
          return jsonResponse({ error: 'Street, city, state, and country are required' }, 400);
        }
        const isDefault = address.isDefault === true;
        if (isDefault) {
          const { error } = await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
          if (error) throw error;
        }
        const { data, error } = await supabase
          .from('addresses')
          .insert({
            user_id: user.id,
            label: typeof address.label === 'string' ? address.label.trim() : null,
            address_line1: address.street.trim(),
            city: address.city.trim(),
            state: address.state.trim(),
            country: address.country.trim(),
            postal_code: typeof address.postalCode === 'string' ? address.postalCode.trim() : null,
            is_default: isDefault,
          })
          .select('*')
          .single();
        if (error) throw error;
        return jsonResponse(addressResponse(data), 201);
      }

      if (id && request.method === 'PUT') {
        const address = body!;
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        const fields: Record<string, string> = {
          label: 'label',
          street: 'address_line1',
          city: 'city',
          state: 'state',
          country: 'country',
          postalCode: 'postal_code',
        };
        for (const [field, column] of Object.entries(fields)) {
          if (address[field] !== undefined) {
            if (typeof address[field] !== 'string') return jsonResponse({ error: `${field} must be a string` }, 400);
            updates[column] = (address[field] as string).trim();
          }
        }
        if (address.isDefault === true) {
          const { error } = await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id);
          if (error) throw error;
          updates.is_default = true;
        } else if (address.isDefault === false) {
          updates.is_default = false;
        }
        const { data, error } = await supabase.from('addresses')
          .update(updates).eq('id', id).eq('user_id', user.id).select('*').maybeSingle();
        if (error) throw error;
        return data ? jsonResponse(addressResponse(data)) : jsonResponse({ error: 'Address not found' }, 404);
      }

      if (id && request.method === 'DELETE') {
        const { data, error } = await supabase.from('addresses')
          .delete().eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
        if (error) throw error;
        return data ? jsonResponse({ message: 'Address deleted' }) : jsonResponse({ error: 'Address not found' }, 404);
      }
    }

    if (resource === 'payment-methods') {
      if (request.method === 'GET' && !id) {
        const { data, error } = await supabase.from('payment_methods')
          .select('id, type, last_four, card_brand, bank_name, is_default, created_at, updated_at')
          .eq('user_id', user.id).eq('is_active', true)
          .order('is_default', { ascending: false }).order('created_at', { ascending: false });
        if (error) throw error;
        return jsonResponse((data || []).map(paymentMethodResponse));
      }

      if (request.method === 'POST' && !id) {
        const method = body!;
        const type = method.type === 'BANK_TRANSFER' ? 'bank' : method.type === 'CARD' ? 'card' : null;
        if (!type) return jsonResponse({ error: 'Payment method type must be CARD or BANK_TRANSFER' }, 400);
        if (type === 'card') {
          return jsonResponse({ error: 'Card details must be tokenized by a configured payment provider before saving' }, 422);
        }
        const accountNumber = typeof method.accountNumber === 'string' ? method.accountNumber.replace(/\s/g, '') : '';
        if (!/^\d{6,20}$/.test(accountNumber)) return jsonResponse({ error: 'A valid bank account number is required' }, 400);
        const isDefault = method.isDefault === true;
        if (isDefault) {
          const { error } = await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id);
          if (error) throw error;
        }
        const { data, error } = await supabase.from('payment_methods')
          .insert({
            user_id: user.id,
            type,
            account_number: accountNumber,
            last_four: accountNumber.slice(-4),
            bank_name: typeof method.accountName === 'string' ? method.accountName.trim() : null,
            is_default: isDefault,
          })
          .select('id, type, last_four, card_brand, bank_name, is_default, created_at, updated_at')
          .single();
        if (error) throw error;
        return jsonResponse(paymentMethodResponse(data), 201);
      }

      if (id && request.method === 'PUT') {
        const method = body!;
        const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (method.isDefault === true) {
          const { error } = await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', user.id);
          if (error) throw error;
          updates.is_default = true;
        }
        if (method.accountNumber !== undefined) {
          if (typeof method.accountNumber !== 'string') return jsonResponse({ error: 'Account number must be a string' }, 400);
          const accountNumber = method.accountNumber.replace(/\s/g, '');
          if (!/^\d{6,20}$/.test(accountNumber)) return jsonResponse({ error: 'A valid bank account number is required' }, 400);
          updates.account_number = accountNumber;
          updates.last_four = accountNumber.slice(-4);
        }
        if (method.accountName !== undefined) {
          if (typeof method.accountName !== 'string') return jsonResponse({ error: 'Account name must be a string' }, 400);
          updates.bank_name = method.accountName.trim();
        }
        const { data, error } = await supabase.from('payment_methods')
          .update(updates).eq('id', id).eq('user_id', user.id).eq('is_active', true)
          .select('id, type, last_four, card_brand, bank_name, is_default, created_at, updated_at').maybeSingle();
        if (error) throw error;
        return data ? jsonResponse(paymentMethodResponse(data)) : jsonResponse({ error: 'Payment method not found' }, 404);
      }

      if (id && request.method === 'DELETE') {
        const { data, error } = await supabase.from('payment_methods')
          .update({ is_active: false, is_default: false, updated_at: new Date().toISOString() })
          .eq('id', id).eq('user_id', user.id).eq('is_active', true).select('id').maybeSingle();
        if (error) throw error;
        return data ? jsonResponse({ message: 'Payment method deleted' }) : jsonResponse({ error: 'Payment method not found' }, 404);
      }
    }

    if (resource === 'settings') {
      if (request.method === 'GET') {
        const { data, error } = await supabase.from('account_settings')
          .select('notifications, location_services, email_updates').eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        return jsonResponse({
          notifications: data?.notifications ?? true,
          locationServices: data?.location_services ?? true,
          emailUpdates: data?.email_updates ?? false,
        });
      }
      if (request.method === 'PUT') {
        const updates: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
        for (const [field, column] of Object.entries({
          notifications: 'notifications',
          locationServices: 'location_services',
          emailUpdates: 'email_updates',
        })) {
          if (body![field] !== undefined) {
            if (typeof body![field] !== 'boolean') return jsonResponse({ error: `${field} must be a boolean` }, 400);
            updates[column] = body![field];
          }
        }
        const { error } = await supabase.from('account_settings').upsert(updates, { onConflict: 'user_id' });
        if (error) throw error;
        return jsonResponse({ message: 'Settings updated' });
      }
    }

    if (resource === 'notifications' && id === 'preferences') {
      if (request.method === 'GET') {
        const { data, error } = await supabase.from('notification_preferences')
          .select('preferences').eq('user_id', user.id).maybeSingle();
        if (error) throw error;
        return jsonResponse(data?.preferences || {});
      }
      if (request.method === 'PUT') {
        const { error } = await supabase.from('notification_preferences').upsert({
          user_id: user.id,
          preferences: body,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
        if (error) throw error;
        return jsonResponse(body);
      }
    }

    if (resource === 'notifications' && request.method === 'GET') {
      const role = new URL(request.url).searchParams.get('role');
      const readFilter = new URL(request.url).searchParams.get('read');
      const url = new URL(request.url);
      if (id === 'unread-count') {
        let query = supabase.from('notifications').select('id', { count: 'exact', head: true })
          .eq('user_id', user.id).eq('read', false);
        if (role) query = query.eq('role', role);
        const { count, error } = await query;
        if (error) throw error;
        return jsonResponse({ count: count || 0 });
      }

      const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
      const offset = Math.max(0, Number.parseInt(url.searchParams.get('offset') || String((page - 1) * limit), 10) || 0);
      let query = supabase.from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
      if (role) query = query.eq('role', role);
      if (readFilter === 'true' || readFilter === 'false') query = query.eq('read', readFilter === 'true');
      const fromDate = url.searchParams.get('fromDate');
      const toDate = url.searchParams.get('toDate');
      if (fromDate) query = query.gte('created_at', fromDate);
      if (toDate) query = query.lte('created_at', toDate);
      const { data, error } = await query;
      if (error) throw error;
      return jsonResponse(data || []);
    }

    if (resource === 'notifications' && request.method === 'POST' && id === 'read-all') {
      let query = supabase.from('notifications').update({ read: true })
        .eq('user_id', user.id).eq('read', false);
      if (typeof body!.role === 'string') query = query.eq('role', body!.role);
      const { error } = await query;
      if (error) throw error;
      return jsonResponse({ message: 'All notifications marked as read' });
    }

    if (resource === 'notifications' && child === 'read' && request.method === 'POST' && id) {
      const { data, error } = await supabase.from('notifications').update({ read: true })
        .eq('id', id).eq('user_id', user.id).select('id').maybeSingle();
      if (error) throw error;
      return data ? jsonResponse({ message: 'Notification marked as read' })
        : jsonResponse({ error: 'Notification not found' }, 404);
    }

    if (resource === 'privacy-settings') {
      const { data: current, error: currentError } = await supabase.from('user_privacy_settings')
        .select('data_collection, analytics, marketing_emails, location_tracking, profile_visibility, activity_status, order_history, share_with_partners, allow_notifications')
        .eq('user_id', user.id).maybeSingle();
      if (currentError) throw currentError;
      if (request.method === 'GET') {
        return jsonResponse({
          dataCollection: current?.data_collection ?? true,
          analytics: current?.analytics ?? true,
          marketingEmails: current?.marketing_emails ?? false,
          shareLocation: current?.location_tracking ?? true,
          showOnlineStatus: current?.activity_status ?? true,
          profileVisibility: current?.profile_visibility ?? true,
          orderHistory: current?.order_history ?? true,
          shareWithPartners: current?.share_with_partners ?? false,
          allowNotifications: current?.allow_notifications ?? true,
        });
      }
      if (request.method === 'PUT') {
        const fields = {
          dataCollection: 'data_collection',
          analytics: 'analytics',
          marketingEmails: 'marketing_emails',
          shareLocation: 'location_tracking',
          showOnlineStatus: 'activity_status',
          profileVisibility: 'profile_visibility',
          orderHistory: 'order_history',
          shareWithPartners: 'share_with_partners',
          allowNotifications: 'allow_notifications',
        } as const;
        const updates: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
        for (const [field, column] of Object.entries(fields)) {
          if (body![field] !== undefined) {
            if (typeof body![field] !== 'boolean') return jsonResponse({ error: `${field} must be a boolean` }, 400);
            updates[column] = body![field];
          }
        }
        const { error } = await supabase.from('user_privacy_settings').upsert(updates, { onConflict: 'user_id' });
        if (error) throw error;
        return jsonResponse({
          message: 'Privacy settings updated',
          dataCollection: updates.data_collection ?? current?.data_collection ?? true,
          analytics: updates.analytics ?? current?.analytics ?? true,
          marketingEmails: updates.marketing_emails ?? current?.marketing_emails ?? false,
          shareLocation: updates.location_tracking ?? current?.location_tracking ?? true,
          showOnlineStatus: updates.activity_status ?? current?.activity_status ?? true,
          profileVisibility: updates.profile_visibility ?? current?.profile_visibility ?? true,
          orderHistory: updates.order_history ?? current?.order_history ?? true,
          shareWithPartners: updates.share_with_partners ?? current?.share_with_partners ?? false,
          allowNotifications: updates.allow_notifications ?? current?.allow_notifications ?? true,
        });
      }
    }

    if (resource === 'user' && id === 'account' && request.method === 'DELETE') {
      const { data: existing, error: lookupError } = await supabase.from('data_deletion_requests')
        .select('id').eq('user_id', user.id).in('status', ['pending', 'processing']).maybeSingle();
      if (lookupError) throw lookupError;
      if (existing) return jsonResponse({ message: 'An account deletion request is already pending' });
      const { error } = await supabase.from('data_deletion_requests').insert({
        user_id: user.id,
        email: user.email || identity.email || '',
      });
      if (error) throw error;
      return jsonResponse({ message: 'Account deletion request submitted' }, 202);
    }

    return jsonResponse({ error: 'Account endpoint not found' }, 404);
  } catch (error) {
    if (!(error instanceof FirebaseAuthError)) console.error('account function failed:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, error instanceof FirebaseAuthError ? error.status : 500);
  }
});
