import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { handleCors, withCors } from '../_shared/cors.ts';
import { FirebaseAuthError, requireFirebaseIdentity } from '../_shared/firebase-auth.ts';
import { createAdminClient } from '../_shared/supabase-admin.ts';

const DOCUMENT_TYPES: Record<string, string> = {
  identity: 'id_card',
  address: 'address',
  business: 'business_license',
  driver_license: 'drivers_license',
  vehicle_registration: 'vehicle_registration',
};
const DOCUMENT_TYPES_REVERSE = Object.fromEntries(
  Object.entries(DOCUMENT_TYPES).map(([appType, databaseType]) => [databaseType, appType]),
);
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

function jsonResponse(body: unknown, status = 200): Response {
  return withCors(new Response(JSON.stringify(body), { status }));
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasValue(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

async function getDocuments(supabase: ReturnType<typeof createAdminClient>, userId: string) {
  const { data: rows, error } = await supabase.from('kyc_documents')
    .select('id, document_type, document_url, back_document_url, document_number_last4, expiry_date, verification_status, verified_at, rejection_reason, created_at')
    .eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;

  return Promise.all((rows || []).map(async (row) => {
    const [front, back] = await Promise.all([
      supabase.storage.from('kyc-documents').createSignedUrl(row.document_url, 3600),
      row.back_document_url
        ? supabase.storage.from('kyc-documents').createSignedUrl(row.back_document_url, 3600)
        : Promise.resolve({ data: null, error: null }),
    ]);
    if (front.error) throw front.error;
    if (!front.data?.signedUrl) throw new Error('Unable to create a private KYC document URL');
    if (back.error) throw back.error;
    const expired = row.expiry_date && new Date(row.expiry_date).getTime() < Date.now();
    return {
      id: row.id,
      type: DOCUMENT_TYPES_REVERSE[row.document_type] || row.document_type,
      documentNumber: row.document_number_last4 ? `****${row.document_number_last4}` : undefined,
      frontImage: front.data?.signedUrl,
      backImage: back.data?.signedUrl || undefined,
      status: expired ? 'expired' : row.verification_status,
      uploadDate: row.created_at,
      verificationDate: row.verified_at || undefined,
      rejectionReason: row.rejection_reason || undefined,
      expiryDate: row.expiry_date || undefined,
    };
  }));
}

serve(async (request) => {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;
  if (!['GET', 'POST', 'PUT'].includes(request.method)) return jsonResponse({ error: 'Method not allowed' }, 405);

  try {
    const identity = await requireFirebaseIdentity(request);
    const supabase = createAdminClient();
    const { data: user, error: userError } = await supabase.from('users')
      .select('id, role, created_at').eq('firebase_uid', identity.uid).maybeSingle();
    if (userError) throw userError;
    if (!user) return jsonResponse({ error: 'User profile not found' }, 404);

    const url = new URL(request.url);
    const segments = url.pathname.split('/').filter(Boolean).slice(3);
    const [resource, child] = segments;
    const body = request.method === 'GET' ? null : await request.json().catch(() => null);
    if (request.method !== 'GET' && !isObject(body)) {
      return jsonResponse({ error: 'A valid JSON object is required' }, 400);
    }

    const { data: profile, error: profileError } = await supabase.from('kyc_profiles')
      .select('personal_info, business_info, driver_info, status, submitted_at, updated_at')
      .eq('user_id', user.id).maybeSingle();
    if (profileError) throw profileError;

    if (resource === 'role-status' && request.method === 'GET') {
      const { data: registrations, error } = await supabase.from('user_role_registrations')
        .select('role, status, rejection_reason, submitted_at, reviewed_at')
        .eq('user_id', user.id);
      if (error) throw error;
      const roleStatus: Record<string, unknown> = {
        consumer: {
          isRegistered: true,
          isVerified: true,
          verificationStatus: 'approved',
        },
      };
      for (const role of ['merchant', 'driver']) {
        const registration = (registrations || []).find((item) => item.role === role);
        const isPrimaryRole = user.role === role;
        const status = isPrimaryRole ? 'approved' : registration?.status || 'pending';
        roleStatus[role] = {
          isRegistered: isPrimaryRole || Boolean(registration),
          isVerified: isPrimaryRole || registration?.status === 'approved',
          verificationStatus: status,
          registeredAt: registration?.submitted_at,
          verifiedAt: isPrimaryRole ? user.created_at : registration?.reviewed_at || undefined,
          rejectionReason: registration?.rejection_reason || undefined,
        };
      }
      return jsonResponse({ roleStatus });
    }

    if (resource === 'register-role' && request.method === 'POST') {
      const role = body.role;
      if (role !== 'merchant' && role !== 'driver') {
        return jsonResponse({ error: 'Role must be merchant or driver' }, 400);
      }
      if (user.role === role) {
        return jsonResponse({
          isRegistered: true,
          isVerified: true,
          verificationStatus: 'approved',
          registeredAt: user.created_at,
          verifiedAt: user.created_at,
        });
      }
      const value = body as Record<string, unknown>;
      if (role === 'merchant' && (!hasValue(value.businessName) || !hasValue(value.businessType) || !hasValue(value.businessAddress))) {
        return jsonResponse({ error: 'Business name, type, and address are required' }, 400);
      }
      if (role === 'driver' && (!hasValue(value.licenseNumber) || !isObject(value.vehicleInfo))) {
        return jsonResponse({ error: 'Driver license and vehicle information are required' }, 400);
      }
      const registrationData = role === 'merchant'
        ? {
          businessName: value.businessName,
          businessType: value.businessType,
          businessAddress: value.businessAddress,
          licenseNumber: value.licenseNumber || null,
        }
        : {
          licenseNumber: value.licenseNumber,
          vehicleInfo: value.vehicleInfo,
        };
      const { data: existing, error: existingError } = await supabase.from('user_role_registrations')
        .select('status').eq('user_id', user.id).eq('role', role).maybeSingle();
      if (existingError) throw existingError;
      if (existing?.status === 'approved' || existing?.status === 'pending') {
        return jsonResponse({ error: 'A registration for this role already exists' }, 409);
      }
      const { data: registration, error } = await supabase.from('user_role_registrations').upsert({
        user_id: user.id,
        role,
        status: 'pending',
        registration_data: registrationData,
        rejection_reason: null,
        submitted_at: new Date().toISOString(),
        reviewed_at: null,
      }, { onConflict: 'user_id,role' }).select('submitted_at').single();
      if (error) throw error;
      return jsonResponse({
        isRegistered: true,
        isVerified: false,
        verificationStatus: 'pending',
        registeredAt: registration.submitted_at,
      }, 201);
    }

    if (resource === 'profile' && request.method === 'GET') {
      const documents = await getDocuments(supabase, user.id);
      return jsonResponse({
        id: user.id,
        userId: user.id,
        verificationLevel: profile?.status === 'verified' ? 'advanced' : documents.length ? 'basic' : 'unverified',
        overallStatus: profile?.status || 'incomplete',
        documents,
        personalInfo: profile?.personal_info || {},
        businessInfo: profile?.business_info || undefined,
        driverInfo: profile?.driver_info || undefined,
        submissionDate: profile?.submitted_at || undefined,
        lastUpdated: profile?.updated_at || new Date().toISOString(),
      });
    }

    if (resource === 'status' && request.method === 'GET') {
      const documents = await getDocuments(supabase, user.id);
      const info = isObject(profile?.personal_info) ? profile.personal_info : {};
      const requiredDocuments = user.role === 'driver'
        ? ['identity', 'address', 'driver_license', 'vehicle_registration']
        : user.role === 'merchant'
          ? ['identity', 'address', 'business']
          : ['identity', 'address'];
      const requiredSteps = ['personal', ...requiredDocuments];
      const completed = [
        hasValue(info.firstName) && hasValue(info.lastName),
        ...requiredDocuments.map((type) => documents.some((document) =>
          document.type === type && ['pending', 'approved'].includes(document.status),
        )),
      ];
      const nextSteps = requiredSteps.filter((_, index) => !completed[index]);
      return jsonResponse({
        status: profile?.status || 'incomplete',
        level: profile?.status === 'verified' ? 'advanced' : documents.length ? 'basic' : 'unverified',
        completionPercentage: Math.round(completed.filter(Boolean).length / completed.length * 100),
        nextSteps,
      });
    }

    if (resource === 'personal-info' && request.method === 'PUT') {
      const value = body as Record<string, unknown>;
      if (!isObject(value.address) || !hasValue(value.firstName) || !hasValue(value.lastName) ||
        !hasValue(value.address.street) || !hasValue(value.address.city) ||
        !hasValue(value.address.state) || !hasValue(value.address.country)) {
        return jsonResponse({ error: 'Personal name and complete address information are required' }, 400);
      }
      const { error } = await supabase.from('kyc_profiles').upsert({
        user_id: user.id,
        personal_info: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      return jsonResponse({ message: 'Personal information updated' });
    }

    if (resource === 'business-info' && request.method === 'PUT') {
      if (user.role !== 'merchant' && user.role !== 'admin') return jsonResponse({ error: 'Merchant account required' }, 403);
      const value = body as Record<string, unknown>;
      if (!hasValue(value.businessName) || !hasValue(value.businessType) ||
        !hasValue(value.registrationNumber) || !hasValue(value.taxId) || !isObject(value.businessAddress)) {
        return jsonResponse({ error: 'Complete business information is required' }, 400);
      }
      const { error } = await supabase.from('kyc_profiles').upsert({
        user_id: user.id,
        business_info: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      return jsonResponse({ message: 'Business information updated' });
    }

    if (resource === 'driver-info' && request.method === 'PUT') {
      if (user.role !== 'driver' && user.role !== 'admin') return jsonResponse({ error: 'Driver account required' }, 403);
      const value = body as Record<string, unknown>;
      if (!hasValue(value.licenseNumber) || !hasValue(value.licenseExpiry) || !isObject(value.vehicleInfo)) {
        return jsonResponse({ error: 'Complete driver and vehicle information is required' }, 400);
      }
      const { error } = await supabase.from('kyc_profiles').upsert({
        user_id: user.id,
        driver_info: value,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      return jsonResponse({ message: 'Driver information updated' });
    }

    if (resource === 'documents' && child === 'discard' && request.method === 'POST') {
      if (!Array.isArray(body.paths) || !body.paths.every((path) =>
        typeof path === 'string' && path.startsWith(`${user.id}/`),
      )) {
        return jsonResponse({ error: 'Only your own upload paths can be discarded' }, 400);
      }
      if (body.paths.length) {
        const { error } = await supabase.storage.from('kyc-documents').remove(body.paths as string[]);
        if (error) throw error;
      }
      return jsonResponse({ message: 'Incomplete document uploads removed' });
    }

    if (resource === 'documents' && child === 'upload-url' && request.method === 'POST') {
      const mimeType = typeof body.mimeType === 'string' ? body.mimeType : '';
      if (!MIME_EXTENSIONS[mimeType]) return jsonResponse({ error: 'Only JPEG, PNG, and PDF documents are supported' }, 400);
      const path = `${user.id}/${crypto.randomUUID()}.${MIME_EXTENSIONS[mimeType]}`;
      const { data, error } = await supabase.storage.from('kyc-documents').createSignedUploadUrl(path);
      if (error) throw error;
      if (!data?.token) throw new Error('Unable to create a signed KYC upload URL');
      return jsonResponse({ path, token: data.token, mimeType });
    }

    if (resource === 'documents' && !child && request.method === 'POST') {
      const documentType = typeof body.type === 'string' ? DOCUMENT_TYPES[body.type] : undefined;
      const frontPath = typeof body.frontPath === 'string' ? body.frontPath : '';
      const backPath = typeof body.backPath === 'string' ? body.backPath : null;
      const isOwnedPath = (path: string) =>
        path.startsWith(`${user.id}/`) && path.split('/').length === 2;
      if (!documentType || !isOwnedPath(frontPath) || (backPath !== null && !isOwnedPath(backPath))) {
        return jsonResponse({ error: 'Valid document type and owned upload paths are required' }, 400);
      }
      if (body.expiryDate !== undefined) {
        if (typeof body.expiryDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(body.expiryDate)) {
          return jsonResponse({ error: 'Expiry date must use YYYY-MM-DD format' }, 400);
        }
        const expiryDate = new Date(`${body.expiryDate}T00:00:00Z`);
        if (Number.isNaN(expiryDate.getTime()) || expiryDate.toISOString().slice(0, 10) !== body.expiryDate) {
          return jsonResponse({ error: 'Expiry date must be a valid calendar date' }, 400);
        }
        if (expiryDate.getTime() < Date.now()) return jsonResponse({ error: 'Document has expired' }, 400);
      }
      for (const path of [frontPath, ...(backPath ? [backPath] : [])]) {
        const fileName = path.split('/')[1];
        const { data: objects, error } = await supabase.storage.from('kyc-documents')
          .list(user.id, { search: fileName });
        if (error) throw error;
        if (!objects?.some((object) => object.name === fileName)) {
          return jsonResponse({ error: 'An uploaded KYC document could not be found' }, 400);
        }
      }
      const { data: frontSignedUrl, error: frontUrlError } = await supabase.storage
        .from('kyc-documents').createSignedUrl(frontPath, 3600);
      if (frontUrlError) throw frontUrlError;
      if (!frontSignedUrl?.signedUrl) throw new Error('Unable to create a private KYC document URL');
      const backSignedUrl = backPath
        ? await supabase.storage.from('kyc-documents').createSignedUrl(backPath, 3600)
        : { data: null, error: null };
      if (backSignedUrl.error) throw backSignedUrl.error;
      if (backPath && !backSignedUrl.data?.signedUrl) throw new Error('Unable to create a private KYC document URL');
      const { data, error } = await supabase.from('kyc_documents').insert({
        user_id: user.id,
        document_type: documentType,
        document_url: frontPath,
        back_document_url: backPath,
        document_number_last4: typeof body.documentNumber === 'string'
          ? body.documentNumber.replace(/\s/g, '').slice(-4)
          : null,
        expiry_date: typeof body.expiryDate === 'string' ? body.expiryDate : null,
        verification_status: 'pending',
      }).select('id, created_at').single();
      if (error) throw error;
      return jsonResponse({
        id: data.id,
        type: body.type,
        documentNumber: typeof body.documentNumber === 'string'
          ? `****${body.documentNumber.replace(/\s/g, '').slice(-4)}`
          : undefined,
        frontImage: frontSignedUrl.signedUrl,
        backImage: backSignedUrl.data?.signedUrl || undefined,
        status: 'pending',
        uploadDate: data.created_at,
        expiryDate: body.expiryDate || undefined,
      }, 201);
    }

    if (resource === 'submit' && request.method === 'POST') {
      const { data: documents, error } = await supabase.from('kyc_documents')
        .select('document_type, verification_status').eq('user_id', user.id);
      if (error) throw error;
      const info = isObject(profile?.personal_info) ? profile.personal_info : {};
      if (!hasValue(info.firstName) || !hasValue(info.lastName)) {
        return jsonResponse({ error: 'Personal information must be completed before submission' }, 422);
      }
      const requiredDocuments = user.role === 'driver'
        ? ['id_card', 'drivers_license', 'vehicle_registration', 'address']
        : user.role === 'merchant'
          ? ['id_card', 'business_license', 'address']
          : ['id_card', 'address'];
      const uploadedTypes = new Set((documents || [])
        .filter((document) => ['pending', 'approved'].includes(document.verification_status))
        .map((document) => document.document_type));
      const missing = requiredDocuments.filter((type) => !uploadedTypes.has(type));
      if (missing.length) return jsonResponse({ error: `Required documents are missing: ${missing.join(', ')}` }, 422);

      const { error: updateError } = await supabase.from('kyc_profiles').upsert({
        user_id: user.id,
        status: 'pending',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
      if (updateError) throw updateError;
      return jsonResponse({ message: 'KYC submitted for verification' });
    }

    return jsonResponse({ error: 'KYC endpoint not found' }, 404);
  } catch (error) {
    console.error('kyc function failed:', error);
    return jsonResponse({
      error: error instanceof Error ? error.message : 'Internal server error',
    }, error instanceof FirebaseAuthError ? error.status : 500);
  }
});
