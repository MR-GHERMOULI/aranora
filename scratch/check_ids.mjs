import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: projects } = await supabase.from('projects').select('id, title').limit(1);
    const { data: users } = await supabase.from('profiles').select('id').limit(1);
    console.log("PROJECT:", projects?.[0]);
    console.log("USER:", users?.[0]);
}
run();
