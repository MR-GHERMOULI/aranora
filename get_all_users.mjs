import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (profileError) {
    console.error("Profile Error:", profileError);
    return;
  }
  
  // also get auth users
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  
  const usersToDisplay = profiles.map(profile => {
    const authUser = authUsers?.users?.find(u => u.id === profile.id);
    return {
      ...profile,
      email: authUser?.email || profile.email || profile.company_email,
    };
  });

  console.log(JSON.stringify(usersToDisplay, null, 2));
}

main();
