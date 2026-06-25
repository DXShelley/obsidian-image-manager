import { useEffect, useState } from 'react';
import { getSiteConfig, type SiteLocale } from './config/site';

function App(): JSX.Element {
  const [locale, setLocale] = useState<SiteLocale>('zh-CN');
  const siteConfig = getSiteConfig(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = siteConfig.meta.title;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.setAttribute('content', siteConfig.meta.description);
    }
  }, [locale, siteConfig.meta.description, siteConfig.meta.title]);

  useEffect(() => {
    const targetId = window.location.hash.slice(1);
    if (!targetId) {
      return undefined;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [locale]);

  return (
    <div className="page-shell">
      <div className="ambient ambient-left" aria-hidden="true" />
      <div className="ambient ambient-right" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="#hero">
          <span className="brand-mark">IM</span>
          <span>
            <strong>{siteConfig.name}</strong>
            <small>{siteConfig.version}</small>
          </span>
        </a>

        <div className="topbar-actions">
          <nav className="topnav" aria-label={siteConfig.nav.ariaLabel}>
            {siteConfig.nav.items.map((item) => (
              <a href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="locale-switch" aria-label={siteConfig.languageSwitch.label}>
            {(['zh-CN', 'en'] as const).map((item) => (
              <button
                type="button"
                key={item}
                className={`locale-switch__button ${locale === item ? 'is-active' : ''}`}
                onClick={() => {
                  setLocale(item);
                }}
              >
                {siteConfig.languageSwitch.options[item]}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main>
        <section className="hero section" id="hero">
          <div className="hero-copy reveal">
            <p className="eyebrow">{siteConfig.hero.badge}</p>
            <h1>{siteConfig.hero.title}</h1>
            <p className="hero-text">{siteConfig.hero.subtitle}</p>
            <div className="cta-row">
              <a className="button button-primary" href={siteConfig.hero.primaryCta.href}>
                {siteConfig.hero.primaryCta.label}
              </a>
              <a className="button button-secondary" href={siteConfig.hero.secondaryCta.href}>
                {siteConfig.hero.secondaryCta.label}
              </a>
            </div>

            <ul className="stats" aria-label={siteConfig.sections.status.eyebrow}>
              {siteConfig.stats.map((item) => (
                <li key={item.label}>
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="hero-visual reveal reveal-delay-2" aria-hidden="true">
            <div className="ghost-version">{siteConfig.version}</div>
            <article className="visual-panel visual-panel-primary">
              <span className="panel-tag">{siteConfig.hero.panelTag}</span>
              <h2>{siteConfig.hero.panelTitle}</h2>
              <p>{siteConfig.hero.panelBody}</p>
              <div className="command-strip">
                {siteConfig.hero.commandStrip.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </article>

            <article className="visual-panel visual-panel-secondary">
              <div className="visual-kicker">
                <span>{siteConfig.hero.railLabel}</span>
                <span>{siteConfig.hero.railState}</span>
              </div>
              <ul className="rail-list">
                {siteConfig.hero.railItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section className="section" id="features">
          <div className="section-heading reveal">
            <p className="eyebrow">{siteConfig.sections.features.eyebrow}</p>
            <h2>{siteConfig.sections.features.title}</h2>
          </div>

          <div className="feature-grid">
            {siteConfig.pillars.map((item, index) => (
              <article
                className={`feature-card reveal reveal-delay-${(index % 4) + 1}`}
                key={item.title}
              >
                <p className="feature-meta">{item.meta}</p>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>

          <div className="detail-grid">
            {siteConfig.detailCards.map((item, index) => (
              <article className={`detail-card reveal reveal-delay-${(index % 3) + 1}`} key={item.title}>
                <p className="eyebrow eyebrow-compact">{item.eyebrow}</p>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>

          <article className="philosophy-card reveal reveal-delay-2">
            <div className="section-heading section-heading-compact">
              <p className="eyebrow eyebrow-compact">{siteConfig.sections.philosophy.eyebrow}</p>
              <h3>{siteConfig.sections.philosophy.title}</h3>
            </div>
            <blockquote>{siteConfig.philosophy.quote}</blockquote>
            <p>{siteConfig.philosophy.body}</p>
            <div className="philosophy-points">
              {siteConfig.philosophy.points.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </article>
        </section>

        <section className="section workflow-section" id="workflow">
          <div className="section-heading reveal">
            <p className="eyebrow">{siteConfig.sections.workflow.eyebrow}</p>
            <h2>{siteConfig.sections.workflow.title}</h2>
          </div>

          <div className="workflow-grid">
            {siteConfig.workflow.map((item, index) => (
              <article className={`workflow-step reveal reveal-delay-${(index % 4) + 1}`} key={item.step}>
                <span className="step-index">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section status-section" id="status">
          <div className="section-heading reveal">
            <p className="eyebrow">{siteConfig.sections.status.eyebrow}</p>
            <h2>{siteConfig.sections.status.title}</h2>
          </div>

          <div className="status-grid">
            {siteConfig.status.map((item, index) => (
              <article className={`status-card reveal reveal-delay-${(index % 4) + 1}`} key={item.title}>
                <div className="status-top">
                  <h3>{item.title}</h3>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status === 'implemented'
                      ? siteConfig.statusLabels.implemented
                      : siteConfig.statusLabels.planned}
                  </span>
                </div>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section install-section" id="install">
          <div className="install-panel reveal">
            <div className="install-copy">
              <p className="eyebrow">{siteConfig.sections.install.eyebrow}</p>
              <h2>{siteConfig.install.title}</h2>
              <p>{siteConfig.install.note}</p>
            </div>

            <div className="terminal-card" role="presentation">
              <div className="terminal-top">
                <span />
                <span />
                <span />
              </div>
              <pre>
                <code>{siteConfig.install.snippet.join('\n')}</code>
              </pre>
            </div>
          </div>
        </section>

        <section className="section support-section" id="support">
          <div className="support-panel reveal">
            <div className="support-copy">
              <p className="eyebrow">{siteConfig.sections.support.eyebrow}</p>
              <h2>{siteConfig.support.title}</h2>
              <p>{siteConfig.support.body}</p>
            </div>

            <div className="support-grid" aria-label={siteConfig.sections.support.eyebrow}>
              {siteConfig.support.methods.map((item, index) => (
                <article className={`support-card reveal reveal-delay-${(index % 3) + 1}`} key={item.title}>
                  <div className="support-image-frame">
                    <img src={item.image} alt={item.alt} loading="lazy" />
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
