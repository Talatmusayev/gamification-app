import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { LiquidDewLogo } from './LiquidDewLogo';

const NAV_LINKS = [
  { label: 'Ritual', href: '#ritual' },
  { label: 'Sanctuary', href: '#sanctuary' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Privacy', href: '/privacy.html' },
];

export function LiquidGlassNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="nav-shell">
      <div className="wrap">
        <nav className="nav-bar liquid-glass" aria-label="Primary navigation">
          <a className="nav-brand" href="#top" aria-label="Dewy home">
            <LiquidDewLogo size={30} />
            <span>Dewy</span>
          </a>

          <ul className="nav-links">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a href={link.href}>{link.label}</a>
              </li>
            ))}
          </ul>

          <div className="nav-actions">
            <a className="btn-primary" href="#download">
              Get the app
            </a>
            <button
              type="button"
              className="nav-mobile-toggle"
              aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {menuOpen && (
          <div className="nav-mobile-drawer liquid-glass" role="menu">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                role="menuitem"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <a
              className="btn-primary"
              href="#download"
              style={{ marginTop: 6 }}
              onClick={() => setMenuOpen(false)}
            >
              Get the app
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
