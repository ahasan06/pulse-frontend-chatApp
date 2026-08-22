import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

type AuroraBackgroundProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
  showRadialGradient?: boolean
}

export function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}: AuroraBackgroundProps) {
  return (
    <div
      className={cn('transition-bg relative w-full bg-mz-page text-inherit', className)}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        style={
          {
            '--aurora':
              'repeating-linear-gradient(100deg,#5E56B8_10%,#7F77DD_15%,#6B63C4_20%,#A8A3E8_25%,#5E56B8_30%)',
            '--dark-gradient':
              'repeating-linear-gradient(100deg,#0a0a12_0%,#0a0a12_7%,transparent_10%,transparent_12%,#0a0a12_16%)',
            '--white-gradient':
              'repeating-linear-gradient(100deg,#fff_0%,#fff_7%,transparent_10%,transparent_12%,#fff_16%)',
            '--blue-300': '#8755E0',
            '--blue-400': '#7F77DD',
            '--blue-500': '#5E56B8',
            '--indigo-300': '#c4b5fd',
            '--violet-200': '#7c22e6',
            '--black': '#0a0a12',
            '--white': '#fff',
            '--transparent': 'transparent',
          } as CSSProperties
        }
      >
        <div
          className={cn(
            `after:animate-aurora pointer-events-none absolute -inset-[10px] [background-image:var(--dark-gradient),var(--aurora)] [background-size:300%,_200%] [background-position:50%_50%,50%_50%] opacity-45 blur-[10px] will-change-transform [--aurora:repeating-linear-gradient(100deg,var(--blue-500)_10%,var(--indigo-300)_15%,var(--blue-300)_20%,var(--violet-200)_25%,var(--blue-400)_30%)] [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)] after:absolute after:inset-0 after:mix-blend-difference after:content-[""] after:[background-image:var(--dark-gradient),var(--aurora)] after:[background-size:200%,_100%] after:[background-attachment:fixed]`,
            showRadialGradient &&
              '[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]',
          )}
        />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}
