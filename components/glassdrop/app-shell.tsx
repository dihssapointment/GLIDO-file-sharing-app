import { Header } from './header'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-white/[0.07] blur-[120px]" />
        <div className="absolute -bottom-48 -left-24 h-[28rem] w-[28rem] rounded-full bg-zinc-400/[0.06] blur-[120px]" />
        <div className="absolute -right-24 top-1/3 h-[24rem] w-[24rem] rounded-full bg-zinc-200/[0.04] blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          }}
        />
      </div>

      <Header />
      <main className="mx-auto flex w-full max-w-xl flex-col px-4 pb-[max(2.5rem,env(safe-area-inset-bottom))] pt-4 sm:pt-10">
        {children}
      </main>
      <footer className="mx-auto max-w-xl px-4 pb-8 text-center text-xs text-muted-foreground">
        Every session self-destructs after 2 minutes. Nothing is kept.
      </footer>
    </div>
  )
}
