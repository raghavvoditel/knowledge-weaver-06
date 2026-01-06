import { supabase } from './lib/supabase'

async function testSupabase(): Promise<void> {
  try {
    const { data, error } = await supabase.from('profiles').select('*')

    if (error) {
      console.error('Error querying profiles:', error)
      return
    }

    console.log('Profiles data:', data)
  } catch (err) {
    console.error('Unexpected error while testing Supabase:', err)
  }
}

testSupabase()
