import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const TEST_USER_ID = "020884cb-aa68-472a-aef5-38cdf90ccfe9";
const TEST_PROJECT_ID = "9fc33454-d036-4112-a896-e327ec774b62";
const TEST_EMAIL = "collab_test_" + Date.now() + "@aranora.com";

async function run() {
    console.log("--- START VERIFICATION V3 ---");

    // 1. Ensure CRM entry
    const { data: crm, error: crmErr } = await supabase.from("collaborators_crm").insert({
        user_id: TEST_USER_ID,
        full_name: "Directory Name Test",
        email: TEST_EMAIL
    }).select().single();
    if(crmErr) console.error("CRM Insert Error:", crmErr.message);
    else console.log("1. CRM entry created:", crm.id);

    // 2. Simulate addCollaborator
    async function simulateAdd(email) {
        const { data: existing, error: findErr } = await supabase.from('project_collaborators')
            .select('*')
            .eq('project_id', TEST_PROJECT_ID)
            .eq('collaborator_email', email)
            .maybeSingle();
        
        if (findErr) console.error("Find Error:", findErr);
        if (existing) return { type: 'duplicate', data: existing };

        const { data: inserted, error: insErr } = await supabase.from('project_collaborators').insert({
            project_id: TEST_PROJECT_ID,
            collaborator_email: email,
            status: 'invited'
        }).select().single();
        
        if (insErr) console.error("Insert Error:", insErr.message);
        return { type: 'new', data: inserted, error: insErr };
    }

    const res1 = await simulateAdd(TEST_EMAIL);
    console.log("First add result:", res1.type);

    const res2 = await simulateAdd(TEST_EMAIL);
    console.log("Second add result (should be duplicate):", res2.type);

    // 3. Verify enriched fetch (matches logic in collaborator-actions.ts)
    const { data: colls } = await supabase.from('project_collaborators').select('*').eq('project_id', TEST_PROJECT_ID).eq('collaborator_email', TEST_EMAIL);
    const emails = colls?.map(c => c.collaborator_email) || [];
    const { data: crmEntries } = await supabase.from('collaborators_crm').select('full_name, email').eq('user_id', TEST_USER_ID).in('email', emails);

    const target = colls?.find(c => c.collaborator_email === TEST_EMAIL);
    const enriched = {
        ...target,
        crm_entry: crmEntries?.find(entry => entry.email === target?.collaborator_email)
    };

    console.log("Enriched CRM Name:", enriched.crm_entry?.full_name);
    if (enriched.crm_entry?.full_name === "Directory Name Test" && res2.type === 'duplicate') {
       console.log("SUCCESS: Logic verified.");
    } else {
       console.log("FAILURE: Verification failed.");
    }

    console.log("--- VERIFICATION END ---");
}

run();
