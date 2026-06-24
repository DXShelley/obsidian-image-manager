import { siteConfig } from './config/site';

function App(): JSX.Element {
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

        <nav className="topnav" aria-label="站点导航">
          <a href="#features">核心能力</a>
          <a href="#workflow">工作流</a>
          <a href="#status">功能状态</a>
          <a href="#install">开始使用</a>
        </nav>
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

            <ul className="stats" aria-label="发布亮点">
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
              <span className="panel-tag">Current Note</span>
              <h2>从粘贴到发布，图片路径和文件名都保持可控。</h2>
              <p>受管目录、批量处理、恢复事务与阅读画廊共同构成完整链路。</p>
              <div className="command-strip">
                <span>Paste Import</span>
                <span>Auto Convert</span>
                <span>Managed Folder Sync</span>
                <span>Undo / Redo</span>
              </div>
            </article>

            <article className="visual-panel visual-panel-secondary">
              <div className="visual-kicker">
                <span>Feature Rail</span>
                <span>Implemented</span>
              </div>
              <ul className="rail-list">
                <li>当前图片 / 当前笔记 / 当前文件夹画廊</li>
                <li>拖拽裁剪与框选去水印</li>
                <li>批量压缩、转换、链接重写</li>
                <li>孤立图片清理与安全迁移</li>
              </ul>
            </article>
          </div>
        </section>

        <section className="section" id="features">
          <div className="section-heading reveal">
            <p className="eyebrow">Core Features</p>
            <h2>围绕真实 Obsidian 图片流转场景设计，而不是堆零散命令。</h2>
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
        </section>

        <section className="section workflow-section" id="workflow">
          <div className="section-heading reveal">
            <p className="eyebrow">Workflow</p>
            <h2>把过去容易散落在插件、手工和记忆里的动作，收拢成一条清晰流水线。</h2>
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
            <p className="eyebrow">Feature Status</p>
            <h2>已上线和规划中统一展示，主页口径直接对齐仓库状态。</h2>
          </div>

          <div className="status-grid">
            {siteConfig.status.map((item, index) => (
              <article className={`status-card reveal reveal-delay-${(index % 4) + 1}`} key={item.title}>
                <div className="status-top">
                  <h3>{item.title}</h3>
                  <span className={`status-badge status-${item.status}`}>
                    {item.status === 'implemented' ? '已上线' : '规划中'}
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
              <p className="eyebrow">Ship It</p>
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
      </main>
    </div>
  );
}

export default App;
