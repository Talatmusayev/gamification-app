import { LiquidDewLogo } from './LiquidDewLogo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer-inner">
          <a className="footer-brand" href="#top">
            <LiquidDewLogo size={26} />
            <span>Dew &amp; Bloom</span>
          </a>

          <div className="footer-links">
            <a href="/privacy.html">Privacy Policy</a>
            <a href="/app-ads.txt">app-ads.txt</a>
          </div>

          <p className="footer-copy">&copy; 2026 Dew &amp; Bloom. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
