import { supabase } from '@/integrations/supabase/client';

export interface DevSeedResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface UserProfile {
  full_name: string;
  role: 'owner' | 'buyer';
}

// Helper types and functions
type EnumFetchResult = string | null;

function sanitizeStrings<T extends Record<string, any>>(obj: T): T {
  const copy = { ...obj };
  for (const k of Object.keys(copy)) {
    if (typeof copy[k] === "string" && copy[k].trim() === "") {
      copy[k] = "(auto)";
    }
  }
  return copy;
}

function mentions(err: any, ...needles: string[]) {
  const m = (err?.message || "").toLowerCase();
  const d = (err?.details || "").toLowerCase();
  return needles.some(n => m.includes(n) || d.includes(n));
}

const isFK = (err: any) => err?.code === "23503"; // foreign key
const isUnique = (err: any) => err?.code === "23505"; // unique

async function whichProfileKey(supabase: any): Promise<"user_id"|"id"> {
  const a = await supabase.from("profiles").select("user_id", { head: true, count: "exact" }).limit(0);
  if (!a.error) return "user_id";
  const b = await supabase.from("profiles").select("id", { head: true, count: "exact" }).limit(0);
  if (!b.error) return "id";
  return "user_id";
}

function normalizeCaseMatch(allowed: string[], candidate?: string | null) {
  if (!candidate) return undefined;
  const hit = allowed.find(a => a.toLowerCase() === candidate.toLowerCase());
  return hit;
}

function getAllowedEnumValue(enumName: string, candidate?: string | null, fallbacks: string[] = []) {
  // Hardcode safe lists for dev
  const MAP: Record<string,string[]> = {
    user_role: ["OWNER","BUYER","AGENT","ADMIN"],
    property_type: ["DETACHED_HOUSE","SEMI_DETACHED_HOUSE","FLAT","MAISONETTE","BUNGALOW","COTTAGE","OTHER"],
    tenure_type: ["FREEHOLD","LEASEHOLD","COMMONHOLD","SHARE_OF_FREEHOLD","OTHER"]
  };
  const list = MAP[enumName] ?? [];
  const norm = normalizeCaseMatch(list, candidate);
  if (norm) return norm;
  return list[0] ?? fallbacks[0];
}

/**
 * Ensure a profile row exists for the user - minimal, schema-aware version
 */
export async function ensureProfile(supabase: any, user: any) {
  console.log("ensureProfile(): start", user?.id);
  const key = await whichProfileKey(supabase);
  const keyEq = key === "user_id" ? { user_id: user.id } : { id: user.id };

  // If a row already exists, return it.
  const existing = await supabase.from("profiles").select("*").match(keyEq).maybeSingle();
  if (existing.data) return existing.data;

  // Minimal insert with just the linking key and a friendly name if column exists.
  const base: any = { ...keyEq };
  // Try full_name if column exists (probe with a 0-row select)
  const probe = await supabase.from("profiles").select("full_name", { head: true, count: "exact" }).limit(0);
  if (!probe.error) base.full_name = "Test User";

  const ins = await supabase.from("profiles").insert(base).select("*").single();
  if (ins.error) {
    console.error("ensureProfile(): insert failed", { error: ins.error, payload: base });
    throw new Error(`profiles insert failed: ${ins.error.message}`);
  }
  return ins.data;
}

/**
 * Probe if the media table has a type column
 */
export async function probeHasTypeColumn(): Promise<boolean> {
  try {
    const { error } = await supabase.from('media').select('type').limit(0);
    return !error;
  } catch (error) {
    console.log('Type column probe failed:', error);
    return false;
  }
}

/**
 * Check if database migrations have been applied
 */
export async function checkDatabaseMigrations(): Promise<DevSeedResult> {
  try {
    console.log('🔍 Checking database migrations...');
    
    // Check if key tables exist
    const tableChecks = [
      { name: 'profiles', query: 'profiles' },
      { name: 'properties', query: 'properties' },
      { name: 'documents', query: 'documents' },
      { name: 'media', query: 'media' },
      { name: 'storage buckets', query: 'storage.buckets' }
    ];

    const results: any = {};
    
    for (const check of tableChecks) {
      try {
        const { data, error } = await supabase
          .from(check.query)
          .select('*')
          .limit(0);

        results[check.name] = {
          exists: !error,
          error: error?.message || null
        };
        
        console.log(`${check.name}: ${error ? '❌' : '✅'} ${error?.message || 'Exists'}`);
      } catch (err: any) {
        results[check.name] = {
          exists: false,
          error: err.message
        };
        console.log(`${check.name}: ❌ Exception: ${err.message}`);
      }
    }

    const existingTables = Object.entries(results)
      .filter(([_, result]: [string, any]) => result.exists)
      .map(([name, _]) => name);

    return {
      success: existingTables.length > 0,
      message: `Migration check complete. Existing tables: ${existingTables.join(', ')}`,
      data: { results, existingTables }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Migration check failed: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Debug function to check what columns exist in properties table
 */
export async function debugPropertiesSchema(): Promise<DevSeedResult> {
  try {
    console.log('🔍 Debugging properties table schema...');
    
    // Test different column combinations to see what works
    const columnTests = [
      { name: 'Basic fields', columns: 'id, address_line_1, city, postcode' },
      { name: 'With property_type', columns: 'id, address_line_1, city, postcode, property_type' },
      { name: 'With tenure', columns: 'id, address_line_1, city, postcode, property_type, tenure' },
      { name: 'With claimed_by', columns: 'id, address_line_1, city, postcode, property_type, claimed_by' },
      { name: 'All core fields', columns: 'id, address_line_1, city, postcode, property_type, tenure, claimed_by' }
    ];

    const results: any = {};
    
    for (const test of columnTests) {
      try {
        const { data, error } = await supabase
          .from('properties')
          .select(test.columns)
          .limit(0);

        results[test.name] = {
          success: !error,
          error: error?.message || null
        };
        
        console.log(`${test.name}: ${error ? '❌' : '✅'} ${error?.message || 'OK'}`);
      } catch (err: any) {
        results[test.name] = {
          success: false,
          error: err.message
        };
        console.log(`${test.name}: ❌ Exception: ${err.message}`);
      }
    }

    const workingColumns = Object.entries(results)
      .filter(([_, result]: [string, any]) => result.success)
      .map(([name, _]) => name);

    return {
      success: workingColumns.length > 0,
      message: `Schema debug complete. Working combinations: ${workingColumns.join(', ')}`,
      data: { results, workingColumns }
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Schema debug failed: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Ensure a user exists and is logged in
 */
export async function ensureUser(
  email: string, 
  password: string, 
  profile: UserProfile
): Promise<DevSeedResult> {
  try {
    console.log(`Ensuring user: ${email}`);
    
    // First try to sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (signInData.user && !signInError) {
      console.log(`User ${email} signed in successfully`);
      
      // Ensure profile exists after login
      await ensureProfile(supabase, { 
        id: signInData.user.id, 
        email: signInData.user.email, 
        user_metadata: signInData.user.user_metadata 
      });
      
      return {
        success: true,
        message: `Signed in as ${email}`,
        data: { user: signInData.user, session: signInData.session }
      };
    }

    // If sign in failed with "Invalid login credentials", try to sign up
    if (signInError?.message?.includes('Invalid login credentials')) {
      console.log(`User ${email} not found, creating new user`);
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: profile.full_name,
            role: profile.role
          }
        }
      });

      if (signUpError) {
        return {
          success: false,
          message: `Failed to create user: ${signUpError.message}`,
          error: signUpError.message
        };
      }

      // After sign up, try to sign in again (works when email confirmation is disabled)
      const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError2 || !signInData2.user) {
        return {
          success: false,
          message: `Failed to sign in after creation: ${signInError2?.message}`,
          error: signInError2?.message
        };
      }

      // Ensure profile exists after sign-up
      await ensureProfile(supabase, { 
        id: signInData2.user.id, 
        email: signInData2.user.email, 
        user_metadata: signInData2.user.user_metadata 
      });

      console.log(`User ${email} created and signed in successfully`);
      
      return {
        success: true,
        message: `Created and signed in as ${email}`,
        data: { user: signInData2.user, session: signInData2.session }
      };
    }

    return {
      success: false,
      message: `Sign in failed: ${signInError?.message}`,
      error: signInError?.message
    };

  } catch (error: any) {
    console.error('ensureUser error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Ensure the current user has a property - robust with profile guarantee
 */
export async function ensureOwnerProperty(supabase: any, user: any) {
  console.log("ensureOwnerProperty(): start");
  await ensureProfile(supabase, user);

  // Do we already have a property?
  const mine = await supabase.from("properties").select("id").eq("owner_id", user.id).limit(1).maybeSingle();
  if (mine.data?.id) {
    console.log("ensureOwnerProperty(): already have property", mine.data.id);
    return mine.data.id;
  }

  const args = {
    p_title: "Dev Property",
    p_address_line_1: "1 Demo Street",
    p_city: "London",
    p_postcode: "EC1A 1AA",
    p_country: "UK"
  };

  // Call RPC for safe insert (it sets safe enum defaults server-side)
  const rpc = await supabase.rpc("dev_create_owner_property", args);
  if (rpc.error) {
    console.error("ensureOwnerProperty(): RPC failed", { error: rpc.error, args });
    // As a fallback, try plain insert with minimal columns (no enums)
    const ins = await supabase.from("properties").insert({
      owner_id: user.id,
      title: args.p_title,
      address_line_1: args.p_address_line_1,
      city: args.p_city,
      postcode: args.p_postcode,
      country: args.p_country
    }).select("id").single();
    if (ins.error) {
      console.error("ensureOwnerProperty(): fallback insert failed", ins.error);
      throw new Error(`property insert failed: ${ins.error.message}`);
    }
    return ins.data.id;
  }

  // If RPC returns data as { dev_create_owner_property: uuid } or as a single scalar, normalize:
  const newId = (rpc.data && (rpc.data.dev_create_owner_property || rpc.data.id || rpc.data)) ?? null;
  if (!newId) {
    console.warn("ensureOwnerProperty(): unexpected RPC return shape", rpc.data);
  }
  return newId;
}

/**
 * Seed a sample photo for a property
 */
export async function seedSamplePhoto(propertyId: string): Promise<DevSeedResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'No authenticated user',
        error: 'Not logged in'
      };
    }

    console.log(`Seeding sample photo for property: ${propertyId}`);

    // Fetch the test photo
    const response = await fetch('/test-files/test-photo.jpg');
    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to fetch test photo',
        error: 'Test photo not found'
      };
    }

    const blob = await response.blob();
    const file = new File([blob], 'test-photo.jpg', { type: 'image/jpeg' });

    // Upload to storage
    const fileName = `${Date.now()}-test-photo.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-photos')
      .upload(`${propertyId}/${fileName}`, file);

    if (uploadError) {
      return {
        success: false,
        message: `Failed to upload photo: ${uploadError.message}`,
        error: uploadError.message
      };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('property-photos')
      .getPublicUrl(uploadData.path);

    // Check if type column exists
    const hasTypeColumn = await probeHasTypeColumn();

    // Insert into media table
    const mediaData: any = {
      property_id: propertyId,
      url: urlData.publicUrl,
      caption: 'Sample photo uploaded via test-login',
      room_type: 'living_room',
      uploaded_by: user.id,
      mime_type: 'image/jpeg'
    };

    if (hasTypeColumn) {
      mediaData.type = 'photo';
    }

    const { data: mediaInsert, error: mediaError } = await supabase
      .from('media')
      .insert(mediaData)
      .select('id')
      .single();

    if (mediaError) {
      return {
        success: false,
        message: `Failed to insert media record: ${mediaError.message}`,
        error: mediaError.message
      };
    }

    console.log(`Seeded sample photo: ${mediaInsert.id}`);
    return {
      success: true,
      message: 'Sample photo seeded successfully',
      data: { mediaId: mediaInsert.id, url: urlData.publicUrl }
    };

  } catch (error: any) {
    console.error('seedSamplePhoto error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * Seed a sample document for a property
 */
export async function seedSampleDocument(propertyId: string): Promise<DevSeedResult> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: 'No authenticated user',
        error: 'Not logged in'
      };
    }

    console.log(`Seeding sample document for property: ${propertyId}`);

    // Fetch the test document
    const response = await fetch('/test-files/test-doc.pdf');
    if (!response.ok) {
      return {
        success: false,
        message: 'Failed to fetch test document',
        error: 'Test document not found'
      };
    }

    const blob = await response.blob();
    const file = new File([blob], 'test-doc.pdf', { type: 'application/pdf' });

    // Upload to storage
    const fileName = `${Date.now()}-test-doc.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('property-documents')
      .upload(`${propertyId}/${fileName}`, file);

    if (uploadError) {
      return {
        success: false,
        message: `Failed to upload document: ${uploadError.message}`,
        error: uploadError.message
      };
    }

    // Insert into documents table with tolerant mapping
    const { data: docInsert, error: docError } = await supabase
      .from('documents')
      .insert({
        property_id: propertyId,
        document_type: 'other',
        file_name: fileName,
        file_url: uploadData.path,
        file_size_bytes: file.size,
        mime_type: 'application/pdf',
        description: 'Sample document uploaded via test-login',
        uploaded_by: user.id
      })
      .select('id')
      .single();

    if (docError) {
      return {
        success: false,
        message: `Failed to insert document record: ${docError.message}`,
        error: docError.message
      };
    }

    console.log(`Seeded sample document: ${docInsert.id}`);
    return {
      success: true,
      message: 'Sample document seeded successfully',
      data: { documentId: docInsert.id }
    };

  } catch (error: any) {
    console.error('seedSampleDocument error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message
    };
  }
}

/**
 * One-click dev setup: ensure owner, property, photo, and document
 */
export async function oneClickDevSetup(): Promise<DevSeedResult> {
  try {
    console.log('Starting one-click dev setup...');
    
    // 1. Ensure owner user
    const userResult = await ensureUser('owner@ppuk.test', 'password123', {
      full_name: 'Test Owner',
      role: 'owner'
    });

    if (!userResult.success) {
      return userResult;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        success: false,
        message: 'No authenticated user after login',
        error: 'Authentication failed'
      };
    }

    // 2. Ensure profile exists
    await ensureProfile(supabase, user);

    // 3. Create property using RPC
    const propertyId = await ensureOwnerProperty(supabase, user);

    // 4. Seed sample photo
    const photoResult = await seedSamplePhoto(propertyId);
    if (!photoResult.success) {
      console.warn('Photo seeding failed:', photoResult.message);
    }

    // 5. Seed sample document
    const docResult = await seedSampleDocument(propertyId);
    if (!docResult.success) {
      console.warn('Document seeding failed:', docResult.message);
    }

    console.log('One-click dev setup completed successfully');
    return {
      success: true,
      message: `Dev setup complete! Property: ${propertyId}`,
      data: {
        propertyId,
        photoId: photoResult.data?.mediaId,
        documentId: docResult.data?.documentId
      }
    };

  } catch (error: any) {
    console.error('oneClickDevSetup error:', error);
    return {
      success: false,
      message: `Unexpected error: ${error.message}`,
      error: error.message
    };
  }
}
