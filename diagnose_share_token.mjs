import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const envPath = path.resolve(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')

function getEnv(key) {
    const match = envContent.match(new RegExp(`${key}=(.*)`))
    return match ? match[1].trim() : null
}

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL')
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY')

const supabase = createClient(url, key)

async function main() {
    console.log('Testing Supabase API connection...')

    // 1. Fetch a single project to check if we can read share_token
    const { data: projectData, error: readError } = await supabase
        .from('projects')
        .select('id, title, user_id, share_token')
        .limit(1)

    if (readError) {
        console.error('❌ Failed to read project. Error:', JSON.stringify(readError, null, 2))
        // PostgREST Schema Cache issue usually shows up here
        return
    }

    if (!projectData || projectData.length === 0) {
        console.log('No projects found in the database to test with.')
        return
    }

    const testProject = projectData[0]
    console.log(`✅ Read project "${testProject.title}" successfully. Current share_token:`, testProject.share_token)

    // 2. Try to update the share_token
    const newToken = uuidv4()
    console.log(`Attempting to update share_token to: ${newToken}`)

    const { data: updateData, error: updateError } = await supabase
        .from('projects')
        .update({ share_token: newToken })
        .eq('id', testProject.id)
        .select()

    if (updateError) {
        console.error('❌ Failed to update project. Error:', JSON.stringify(updateError, null, 2))
        return
    }

    console.log('✅ Successfully updated project. Result:', updateData[0].share_token)

    // 3. Reset the token
    const { error: resetError } = await supabase
        .from('projects')
        .update({ share_token: testProject.share_token })
        .eq('id', testProject.id)

    if (resetError) {
        console.error('❌ Failed to reset project. Error:', JSON.stringify(resetError, null, 2))
    } else {
        console.log('✅ Reset test project to original state.')
    }
}

main()
