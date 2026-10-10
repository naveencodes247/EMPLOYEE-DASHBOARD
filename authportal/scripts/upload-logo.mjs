import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = 'https://jfhjlibbdypicynvhfgo.supabase.co';
const supabaseKey = 'sb_publishable_rXZE-M5YsVgzFsJLBH7nug_oDEfdE7w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadLogo() {
  const filePath = path.resolve('public', 'outfyt-logo.jpeg');
  const fileBuffer = fs.readFileSync(filePath);

  const { data, error } = await supabase.storage
    .from('branding')
    .upload('outfyt-logo.jpeg', fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true,
    });

  if (error) {
    console.error('Upload failed:', error);
    process.exit(1);
  }

  const { data: publicUrlData } = supabase.storage
    .from('branding')
    .getPublicUrl('outfyt-logo.jpeg');

  console.log('Upload successful! Public URL:', publicUrlData.publicUrl);
}

uploadLogo();
