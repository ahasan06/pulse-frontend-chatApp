import { cn } from '../../lib/cn'

type GridDotBackgroundProps = {
  className?: string
  gridClassName?: string
  dotsClassName?: string
  showGrid?: boolean
  showDots?: boolean
  mask?: 'center' | 'top' | 'bottom' | 'full'
}

const MASKS = {
  center:
    '[mask-image:radial-gradient(ellipse_at_center,black_18%,transparent_72%)]',
  top: '[mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black_15%,transparent_70%)]',
  bottom:
    '[mask-image:radial-gradient(ellipse_80%_60%_at_50%_100%,black_15%,transparent_70%)]',
  full: '[mask-image:linear-gradient(to_bottom,black,black_85%,transparent)]',
} as const

export function GridDotBackground({
  className,
  gridClassName,
  dotsClassName,
  showGrid = true,
  showDots = true,
  mask = 'center',
}: GridDotBackgroundProps) {
  const maskClass = MASKS[mask]

  return (
    <div className={cn('absolute inset-0', className)}>
      {showGrid && (
        <div
          className={cn(
            'absolute inset-0 bg-[linear-gradient(to_right,rgba(159,4,249,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(159,4,249,0.1)_1px,transparent_1px)] bg-[size:3.5rem_3.5rem]',
            maskClass,
            gridClassName,
          )}
        />
      )}
      {showDots && (
        <div
          className={cn(
            'absolute inset-0 [background-image:radial-gradient(rgba(159,4,249,0.28)_1px,transparent_1px)] [background-size:18px_18px]',
            maskClass,
            dotsClassName,
          )}
        />
      )}
    </div>
  )
}
