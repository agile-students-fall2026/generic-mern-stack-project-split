// Phone-width page column with the top header every screen shares.
// left and right are header actions, usually a Link or a text button.
// nav is the event tab bar (BottomNav) on screens that have one.
function Layout({ title, subtitle, left, right, nav, children }) {
  return (
    <div className="mx-auto flex min-h-svh max-w-md flex-col bg-white sm:border-x sm:border-line">
      <header className="sticky top-0 z-10 grid h-[55px] grid-cols-[80px_minmax(0,1fr)_80px] items-center gap-2 border-b border-line bg-white px-4">
        <div className="justify-self-start">{left}</div>
        <div className="min-w-0 text-center">
          <p className="truncate text-title font-semibold">{title}</p>
          {subtitle && (
            <p className="truncate text-xs text-muted">{subtitle}</p>
          )}
        </div>
        <div className="justify-self-end">{right}</div>
      </header>
      <main className={`flex-1 px-4 pt-5 ${nav ? 'pb-20' : 'pb-8'}`}>
        {children}
      </main>
      {nav}
    </div>
  )
}

export default Layout
