import { useRef, useState } from 'react';
import { ArrowRight, MailCheck } from 'lucide-react';

const MAILTO_ENDPOINT = 'mailto:earlyaccess@dewy.app.example';

export function EarlyAccessSection({ selectedPlan }: { selectedPlan: string }) {
  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [platform, setPlatform] = useState<'ios' | 'android'>('ios');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [draftUrl, setDraftUrl] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!valid) {
      setEmailError('Write an email address with an @ symbol.');
      setDraftUrl(null);
      setStatusMessage('Check the email address field below before opening your mail draft.');
      emailRef.current?.focus();
      return;
    }

    setEmailError(null);
    const platformLabel =
      platform === 'ios' ? 'iPhone (iOS TestFlight)' : 'Android (Google Play preview)';
    const subject = encodeURIComponent(`Dewy Early Access Request (${platformLabel})`);
    const body = encodeURIComponent(
      `Platform: ${platformLabel}\nReply address: ${trimmed}\nPlan interest: ${selectedPlan}\n`
    );
    const mailtoHref = `${MAILTO_ENDPOINT}?subject=${subject}&body=${body}`;
    setDraftUrl(mailtoHref);
    setStatusMessage(
      `Mail draft prepared for ${platformLabel}. Send the message in your mail app to request an invite.`
    );

    window.location.href = mailtoHref;
  };

  return (
    <section id="early-access" className="section section-soft" aria-labelledby="early-access-heading">
      <div className="wrap">
        <div className="waitlist-shell">
          <div className="waitlist-intro">
            <span className="section-eyebrow">iOS TestFlight &amp; Android preview</span>
            <h2 id="early-access-heading" className="section-title">
              Request early access to Dewy.
            </h2>
            <p className="section-lead">
              We open new TestFlight and Google Play preview seats every Friday. Pick your
              device to prepare an invite request with your email app.
            </p>
            <p className="waitlist-meta">
              Selected interest: <strong>{selectedPlan}</strong> &middot; Free to start, no card
              needed
            </p>
          </div>

          <form
            className="waitlist-form"
            action={MAILTO_ENDPOINT}
            method="post"
            encType="text/plain"
            noValidate
            onSubmit={handleSubmit}
          >
            <div className="waitlist-fields">
              <div className="field-group">
                <label className="field-label" htmlFor="waitlist-email">
                  Email address
                </label>
                <input
                  ref={emailRef}
                  id="waitlist-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@domain.com"
                  value={email}
                  aria-invalid={emailError ? 'true' : 'false'}
                  aria-describedby={emailError ? 'waitlist-email-error' : undefined}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`field-input ${emailError ? 'is-invalid' : ''}`}
                />
                {emailError && (
                  <p id="waitlist-email-error" className="field-error">
                    {emailError}
                  </p>
                )}
              </div>

              <div className="field-group">
                <label className="field-label" htmlFor="waitlist-platform">
                  Device platform
                </label>
                <select
                  id="waitlist-platform"
                  name="platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as 'ios' | 'android')}
                  className="field-input field-select"
                >
                  <option value="ios">iPhone (iOS TestFlight)</option>
                  <option value="android">Android (Google Play preview)</option>
                </select>
              </div>
            </div>

            <div className="waitlist-submit-row">
              <button type="submit" className="btn-primary waitlist-submit">
                <span>Request early access</span>
                <ArrowRight size={17} strokeWidth={1.8} aria-hidden="true" />
              </button>

              {draftUrl && (
                <a className="btn-outline waitlist-fallback-link" href={draftUrl}>
                  <MailCheck size={16} strokeWidth={1.75} aria-hidden="true" />
                  <span>Open mail app</span>
                </a>
              )}
            </div>

            <p className="form-status" role="status" aria-live="polite">
              {statusMessage || 'No spam, no ad tracking. Only a release note when your invite opens.'}
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
