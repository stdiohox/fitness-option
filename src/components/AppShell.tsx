import { NavLink, Outlet } from "react-router";
import { GYM } from "../data/facts";
import { TimeMachine } from "./TimeMachine";
import { Wordmark } from "./Wordmark";

export interface NavItem {
  to: string;
  label: string;
}

export function AppShell({ nav }: { nav: NavItem[] }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>
      <aside className="border-b border-line bg-card lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between gap-4 px-5 py-4 lg:flex-col lg:items-start lg:py-6">
          <div>
            <Wordmark />
            <p className="mt-1 text-xs text-muted">Owner console · {GYM.area.split(",")[0]}</p>
          </div>
        </div>
        <nav aria-label="Owner console" className="overflow-x-auto px-3 pt-1 pb-3 lg:pb-0">
          <ul className="flex gap-1 lg:flex-col">
            {nav.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `block whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-brand-blue text-white" : "text-ink-2 hover:bg-paper hover:text-ink"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0">
        {/* Sticky only where there is room; on phones it would cover half the screen at zoom. */}
        <header className="z-20 border-b border-line bg-paper/90 px-4 py-3 backdrop-blur sm:sticky sm:top-0 sm:px-8">
          <TimeMachine />
        </header>
        <main id="main" tabIndex={-1} className="px-4 py-6 outline-none sm:px-8 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
