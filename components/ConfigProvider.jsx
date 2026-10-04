'use client'
import { createContext, useContext } from 'react'
import { DEFAULT_CONFIG } from '@/lib/utils'

const ConfigContext = createContext(DEFAULT_CONFIG)

/** Makes server-loaded `store_config` values available to client components. */
export default function ConfigProvider({ config, children }) {
  return <ConfigContext.Provider value={config}>{children}</ConfigContext.Provider>
}

export const useStoreConfig = () => useContext(ConfigContext)
