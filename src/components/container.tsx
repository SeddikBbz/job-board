import { cn } from '@/lib/utils'

type Props = React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'header' | 'footer' | 'nav'
}

// Page-level wrapper: always full width, with fluid side padding (the --gutter token in styles.css).
// Don't add a narrow max-w-* here; cap long text blocks with max-w-readable instead.
export function Container({ as: Tag = 'div', className, ...props }: Props) {
  return <Tag data-slot="container" className={cn('w-full px-(--gutter)', className)} {...props} />
}
