import { createBrowserClient } from '@supabase/ssr'
const client1 = createBrowserClient('http://127.0.0.1:54321', 'anon-key')
const client2 = createBrowserClient('http://127.0.0.1:54321', 'anon-key')
console.log(client1 === client2)
