'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface AuthUser {
  id: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  isLoading: boolean
  signOut: () => void
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  signOut: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

function mapUser(supabaseUser: User): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email ?? '',
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapUser(session.user))
      }
      setIsLoading(false)
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(mapUser(session.user))
        } else {
          setUser(null)
        }
        setIsLoading(false)
      },
    )

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  return (
    <AuthContext value={{ user, isLoading, signOut }}>
      {children}
    </AuthContext>
  )
}
