import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

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
    console.log('Testing connection to Supabase...')
    const { data, error } = await supabase
        .from('projects')
        .select('share_token')
        .limit(1)

    if (error) {
        console.error('Error querying share_token:', error)
    } else {
        console.log('Success! share_token column exists. Data:', data)
    }
}

main()
