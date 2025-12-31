# Supabase Client Usage

This directory contains the Supabase client configuration for both browser and server-side usage.

## Browser Client (Client Components)

Use `createClient()` from `@/lib/supabase/client` in Client Components:

```tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const supabase = createClient()
  const [data, setData] = useState(null)

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase
        .from('your_table')
        .select('*')
      
      if (error) console.error('Error:', error)
      else setData(data)
    }
    
    fetchData()
  }, [])

  return <div>{/* Your component */}</div>
}
```

## Server Client (Server Components)

Use `createClient()` from `@/lib/supabase/server` in Server Components:

```tsx
import { createClient } from '@/lib/supabase/server'

export default async function ServerComponent() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('your_table')
    .select('*')

  return <div>{/* Your component */}</div>
}
```

## Authentication

For authentication examples, check the Supabase documentation:
https://supabase.com/docs/guides/auth


