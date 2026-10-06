/**
 * Navigation Config
 *
 * Keep the app shell intentionally small and product-specific.
 */

export interface NavItem {
  path: string
  label: string
}

export const nav: NavItem[] = [
  { path: '/home', label: 'Dashboard' },
  { path: '/debugs', label: 'Sessions' },
]
