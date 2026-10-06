/** UI primitives used by DebugFlow. */

/* Utility */
export { cn } from '@/lib/utils'

/* Form */
export { Button, buttonVariants, type ButtonProps } from './Button'
export { Input } from './Input'
export { Textarea } from './Textarea'
export { SearchInput } from './SearchInput'
export { Label } from './Label'

/* Data display */
export { Badge, type BadgeProps } from './Badge'
export { Avatar, AvatarImage, AvatarFallback } from './Avatar'
export { EmptyState } from './EmptyState'

/* Feedback */
export { ToastProvider, useToast } from './Toast'

/* Overlay — `Modal` for simple controlled dialogs; the `Dialog` family for
 * triggers, nesting, and custom composition. */
export {
  Dialog, DialogPortal, DialogOverlay, DialogTrigger, DialogClose,
  DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription,
} from './Dialog'
export { Modal } from './Modal'
export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from './DropdownMenu'
