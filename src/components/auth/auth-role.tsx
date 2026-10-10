'use client'

import { createContext, useContext, useState } from 'react'

export type AuthRole = 'candidate' | 'employer'

type RoleState = { role: AuthRole; setRole: (role: AuthRole) => void }

const RoleContext = createContext<RoleState>({ role: 'candidate', setRole: () => {} })

// Shares the role picked in the sign-up form with the brand panel next to it
export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<AuthRole>('candidate')
  return <RoleContext.Provider value={{ role, setRole }}>{children}</RoleContext.Provider>
}

export const useAuthRole = () => useContext(RoleContext)
