import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // test as anon
const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const dummyContent = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // Fake PNG header
  const fileName = `test-${Date.now()}.png`;

  console.log("Attempting upload...");
  const { data, error } = await supabase.storage
    .from('branding')
    .upload(fileName, dummyContent, { contentType: 'image/png' });

  if (error) {
    console.error("Upload error details:", error);
  } else {
    console.log("Upload success:", data);
  }
}

testUpload();
