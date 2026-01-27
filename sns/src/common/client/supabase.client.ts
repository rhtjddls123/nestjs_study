import { createClient } from '@supabase/supabase-js';
import {
  ENV_SUPABASE_SERVICE_ROLE_KEY,
  ENV_SUPABASE_URL_KEY,
} from '../const/env-keys.const';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SupabaseClientProvider {
  client = createClient(
    process.env[ENV_SUPABASE_URL_KEY] || '',
    process.env[ENV_SUPABASE_SERVICE_ROLE_KEY] || '',
  );
}
