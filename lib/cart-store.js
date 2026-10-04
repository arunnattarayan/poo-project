'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * Global cart state, persisted to localStorage.
 * `skipHydration` avoids SSR/client mismatches — <CartHydrator/> rehydrates on mount.
 */
export const useCart = create(
  persist(
    (set, get) => ({
      items: [], // [{ id, title, price, image_url, quantity }]
      isOpen: false,
      step: 'cart', // 'cart' | 'checkout'

      open: (step = 'cart') => set({ isOpen: true, step }),
      close: () => set({ isOpen: false, step: 'cart' }),
      setStep: (step) => set({ step }),

      add: (product, quantity = 1) =>
        set((state) => {
          const existing = state.items.find((i) => i.id === product.id)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === product.id ? { ...i, quantity: Math.min(i.quantity + quantity, 50) } : i
              ),
            }
          }
          const { id, title, price, image_url } = product
          return { items: [...state.items, { id, title, price: Number(price), image_url, quantity }] }
        }),

      buyNow: (product, quantity = 1) => {
        get().add(product, quantity)
        set({ isOpen: true, step: 'checkout' })
      },

      setQuantity: (id, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.id !== id)
              : state.items.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, 50) } : i)),
        })),

      remove: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),

      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    {
      name: 'nanjai-cart',
      skipHydration: true,
      partialize: (state) => ({ items: state.items }),
    }
  )
)
