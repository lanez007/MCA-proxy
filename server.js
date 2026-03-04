
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>RCN Lead Gen</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&family=IBM+Plex+Sans:wght@400;600&display=swap" rel="stylesheet"></noscript>
<style>

:root {
  --bg: #07070f;
  --bg2: #0c0c1e;
  --border: #1a1a35;
  --accent: #6699ff;
  --green: #00ff88;
  --text: #d8daf0;
  --muted: #4a4a7a;
  --mono: 'IBM Plex Mono', monospace;
  --display: -apple-system, 'Segoe UI', sans-serif;
  --body: 'IBM Plex Sans', sans-serif;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { background: var(--bg); color: var(--text); font-family: var(--body); overflow-x: hidden; }

/* ANIMATIONS */
@keyframes pulse  { 0%,100%{opacity:1}  50%{opacity:0.3} }
@keyframes spin   { to{transform:rotate(360deg)} }
@keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }

.fade-up { animation: fadeUp 0.8s ease forwards; opacity: 0; }
.delay-1 { animation-delay: 0.1s; }
.delay-2 { animation-delay: 0.2s; }
.delay-3 { animation-delay: 0.3s; }
.delay-4 { animation-delay: 0.4s; }
.delay-5 { animation-delay: 0.5s; }

/* noise overlay removed for performance */

/* NAV */
nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 20px 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(7,7,15,0.85);
  border-bottom: 1px solid rgba(26,26,53,0.5);
}
.nav-logo {
  font-family: var(--mono);
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.2em;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
}
.nav-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 10px var(--green);
  animation: pulse 2s infinite;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 40px;
}
.nav-links a {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.12em;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s;
}
.nav-links a:hover { color: var(--text); }
.nav-cta {
  padding: 10px 24px;
  background: var(--accent);
  color: #fff;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.nav-cta:hover { background: #88aaff; transform: translateY(-1px); }

/* HERO */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 120px 60px 80px;
  position: relative;
  overflow: hidden;
}
.hero-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(102,153,255,0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102,153,255,0.03) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent);
}
.hero-glow {
  position: absolute;
  width: 400px;
  height: 400px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(102,153,255,0.06) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  background: rgba(102,153,255,0.08);
  border: 1px solid rgba(102,153,255,0.2);
  border-radius: 100px;
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--accent);
  margin-bottom: 32px;
}
.hero-title {
  font-family: var(--display);
  font-size: clamp(52px, 8vw, 96px);
  font-weight: 800;
  line-height: 0.95;
  letter-spacing: -0.02em;
  color: #fff;
  margin-bottom: 8px;
}
.hero-title span {
  background: linear-gradient(135deg, #6699ff, #00ff88);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-family: var(--mono);
  font-size: 13px;
  letter-spacing: 0.2em;
  color: var(--muted);
  margin-bottom: 32px;
  text-transform: uppercase;
}
.hero-desc {
  font-size: 18px;
  color: #8888aa;
  line-height: 1.7;
  max-width: 560px;
  margin: 0 auto 48px;
  font-weight: 300;
}
.hero-desc strong { color: var(--text); font-weight: 600; }
.hero-btns {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 80px;
}
.btn-primary {
  padding: 16px 40px;
  background: linear-gradient(135deg, #1a44ff, #0022cc);
  color: #fff;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-primary:hover { transform: translateY(-2px); background: linear-gradient(135deg, #2255ff, #1133dd); }
.btn-secondary {
  padding: 16px 40px;
  background: transparent;
  color: var(--text);
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
}
.btn-secondary:hover { border-color: var(--accent); color: var(--accent); transform: translateY(-2px); }

/* STATS BAR */
.stats-bar {
  display: flex;
  gap: 60px;
  justify-content: center;
  padding: 32px 60px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: rgba(12,12,30,0.5);
}
.stat { text-align: center; }
.stat-num {
  font-family: var(--display);
  font-size: 36px;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  margin-bottom: 6px;
}
.stat-num span { color: var(--accent); }
.stat-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

/* FEATURES */
.section {
  padding: 100px 60px;
  max-width: 1200px;
  margin: 0 auto;
}
.section-label {
  font-family: var(--mono);
  font-size: 10px;
  letter-spacing: 0.2em;
  color: var(--accent);
  margin-bottom: 16px;
}
.section-title {
  font-family: var(--display);
  font-size: clamp(32px, 4vw, 52px);
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
  margin-bottom: 20px;
}
.section-desc {
  font-size: 16px;
  color: #6666aa;
  line-height: 1.7;
  max-width: 560px;
  font-weight: 300;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 60px;
}
.feature-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 32px;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.feature-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--accent), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.feature-card:hover { border-color: rgba(102,153,255,0.3); transform: translateY(-4px); }
.feature-card:hover::before { opacity: 1; }
.feature-icon {
  font-size: 28px;
  margin-bottom: 20px;
  display: block;
}
.feature-title {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #fff;
  margin-bottom: 12px;
}
.feature-desc {
  font-size: 13px;
  color: #5555aa;
  line-height: 1.7;
}

/* HOW IT WORKS */
.how-section {
  padding: 100px 60px;
  background: var(--bg2);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}
.how-inner {
  max-width: 1200px;
  margin: 0 auto;
}
.steps {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 40px;
  margin-top: 60px;
  position: relative;
}
.steps::before {
  content: '';
  position: absolute;
  top: 28px;
  left: 10%;
  right: 10%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), var(--border), transparent);
}
.step { text-align: center; position: relative; }
.step-num {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--bg);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--mono);
  font-size: 16px;
  font-weight: 700;
  color: var(--accent);
  margin: 0 auto 20px;
  position: relative;
  z-index: 1;
}
.step-title {
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #fff;
  margin-bottom: 10px;
}
.step-desc {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.6;
}

/* PRICING */
.pricing-section {
  padding: 100px 60px;
  max-width: 1200px;
  margin: 0 auto;
}
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  margin-top: 60px;
  align-items: stretch;
}
.pricing-card {
  background: var(--bg2);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 40px 32px;
  position: relative;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}
.pricing-card:hover { transform: translateY(-4px); }
.pricing-card.featured {
  border-color: rgba(102,153,255,0.4);
  background: linear-gradient(180deg, rgba(102,153,255,0.06) 0%, var(--bg2) 100%);
}
.pricing-card.featured::before {
  content: 'MOST POPULAR';
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--accent);
  color: #fff;
  font-family: var(--mono);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.14em;
  padding: 4px 16px;
  border-radius: 100px;
  white-space: nowrap;
}
.pricing-tier {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.2em;
  color: var(--muted);
  margin-bottom: 16px;
}
.pricing-price {
  font-family: var(--mono);
  font-size: 48px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  margin-bottom: 4px;
}
.pricing-price sup {
  font-size: 20px;
  vertical-align: top;
  margin-top: 8px;
  display: inline-block;
  color: #8888aa;
  font-family: var(--mono);
}
.pricing-period {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--muted);
  margin-bottom: 32px;
}
.pricing-searches {
  display: inline-block;
  padding: 6px 14px;
  background: rgba(0,255,136,0.08);
  border: 1px solid rgba(0,255,136,0.2);
  border-radius: 6px;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 700;
  color: var(--green);
  margin-bottom: 32px;
}
.pricing-features {
  list-style: none;
  margin-bottom: 40px;
  flex: 1;
}
.pricing-features li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 13px;
  color: #7777aa;
  padding: 8px 0;
  border-bottom: 1px solid rgba(26,26,53,0.5);
  line-height: 1.5;
}
.pricing-features li:last-child { border-bottom: none; }
.pricing-features li::before {
  content: '✓';
  color: var(--green);
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}
.pricing-btn {
  display: block;
  width: 100%;
  padding: 14px;
  text-align: center;
  font-family: var(--mono);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.1em;
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  transition: all 0.2s;
  border: none;
}
.pricing-btn.primary {
  background: var(--accent);
  color: #fff;
}
.pricing-btn.primary:hover { background: #88aaff; transform: translateY(-1px); }
.pricing-btn.secondary {
  background: var(--accent);
  color: #fff;
  border: none;
}
.pricing-btn.secondary:hover { background: #88aaff; transform: translateY(-1px); }
.pricing-btn.gold {
  background: var(--accent);
  color: #fff;
}
.pricing-btn.gold:hover { background: #88aaff; transform: translateY(-1px); }

/* TESTIMONIAL / TRUST */
.trust-section {
  padding: 80px 60px;
  background: var(--bg2);
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  text-align: center;
}
.trust-inner { max-width: 800px; margin: 0 auto; }
.trust-quote {
  font-family: var(--display);
  font-size: clamp(22px, 3vw, 32px);
  font-weight: 700;
  color: #fff;
  line-height: 1.4;
  margin-bottom: 24px;
}
.trust-quote span { color: var(--accent); }
.trust-sub {
  font-family: var(--mono);
  font-size: 11px;
  letter-spacing: 0.14em;
  color: var(--muted);
}

/* FAQ */
.faq-section {
  padding: 100px 60px;
  max-width: 800px;
  margin: 0 auto;
}
.faq-item {
  border-bottom: 1px solid var(--border);
  padding: 24px 0;
}
.faq-q {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.06em;
  margin-bottom: 12px;
  cursor: pointer;
}
.faq-a {
  font-size: 13px;
  color: #6666aa;
  line-height: 1.7;
}

/* FOOTER */
footer {
  padding: 40px 60px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.footer-logo {
  font-family: var(--mono);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: var(--muted);
}
.footer-text {
  font-family: var(--mono);
  font-size: 10px;
  color: #2a2a4a;
  letter-spacing: 0.1em;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  nav { padding: 16px 24px; }
  .nav-links { display: none; }
  .hero { padding: 100px 24px 60px; }
  .section, .pricing-section, .faq-section { padding: 60px 24px; }
  .features-grid { grid-template-columns: 1fr; }
  .steps { grid-template-columns: repeat(2, 1fr); }
  .steps::before { display: none; }
  .pricing-grid { grid-template-columns: 1fr; }
  .stats-bar { gap: 30px; flex-wrap: wrap; padding: 24px; }
  .how-section { padding: 60px 24px; }
  footer { flex-direction: column; gap: 12px; text-align: center; padding: 30px 24px; }
}

/* APP STYLES */
body { color: #d8daf0; font-family: 'IBM Plex Mono', monospace; min-height: 100vh; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.2} }
input, select { background: #0c0c1e; border: 1px solid #1a1a35; color: #d8daf0; border-radius: 6px; padding: 8px 12px; font-family: 'IBM Plex Mono', monospace; font-size: 12px; outline: none; width: 100%; }
input:focus, select:focus { border-color: #2a2a6a; }
button { cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-weight: 700; border: none; border-radius: 6px; }
a { text-decoration: none; }
::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:#07070f} ::-webkit-scrollbar-thumb{background:#1a1a35;border-radius:2px}
.tab { background: none; border: none; color: #3a3a6a; font-family: 'IBM Plex Mono', monospace; font-size: 12px; padding: 12px 20px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; letter-spacing: 0.08em; }
.tab.on { color: #6699ff; border-bottom-color: #6699ff; }
.tab:hover:not(.on) { color: #9999bb; }
.ind-row { display: flex; align-items: center; gap: 8px; padding: 5px 6px; cursor: pointer; border-radius: 4px; transition: background 0.15s; }
.ind-row:hover { background: #0c0c1e; }
.tag { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 10px; font-weight: 700; }
.lead-card { background: #0c0c1c; border: 1px solid #181830; border-radius: 10px; margin-bottom: 10px; overflow: hidden; transition: border-color 0.2s; }
.lead-card.expanded { border-color: #2a2a5a; }
.link-btn { display: block; padding: 7px 10px; border-radius: 5px; font-size: 10px; font-family: 'IBM Plex Mono', monospace; font-weight: 700; text-align: center; }
.spinner { width: 13px; height: 13px; border: 2px solid #2a2a5a; border-top-color: #6699ff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }
.big-spinner { width: 48px; height: 48px; border: 3px solid #1a1a35; border-top-color: #3366ff; border-radius: 50%; animation: spin 0.9s linear infinite; margin: 0 auto 20px; }

#landing-page { display: block; }
#app-page { display: none; }
</style>
</head>
<body>
<div id="landing-page">


<!-- NAV -->
<nav>
  <div class="nav-logo">
    <div class="nav-dot"></div>
    RCN LEAD GEN
  </div>
  <div class="nav-links">
    <a href="#features">Features</a>
    <a href="#how">How It Works</a>
    <a href="#pricing">Pricing</a>
    <a href="#faq">FAQ</a>
  </div>
  <a href="javascript:void(0)" onclick="showApp()" class="nav-cta">LOGIN →</a>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-grid"></div>
  <div class="hero-glow"></div>

  <div class="fade-up" style="position:relative;z-index:1;max-width:640px;margin:0 auto 28px;padding:0 24px;text-align:center">
    <div style="font-size:17px;line-height:1.85;color:#e8f2ff;font-style:italic;letter-spacing:0.03em">"People often avoid making decisions out of fear of making a mistake. Actually the failure to make decisions is one of life's biggest mistakes."</div>
    <div style="font-size:12px;color:#aac4e0;letter-spacing:0.14em;margin-top:12px">— RABBI NOAH WEINBERG</div>
  </div>

  <div class="hero-badge fade-up" style="position:relative;z-index:1">
    <span style="width:6px;height:6px;border-radius:50%;background:#00ff88;display:inline-block;box-shadow:0 0 8px #00ff88;animation:pulse 2s infinite"></span>
    POWERED BY RCN GROUP · ALL 50 STATES
  </div>

  <h1 class="hero-title fade-up delay-1" style="position:relative;z-index:1">
    FIND YOUR<br><span>NEXT DEAL</span><br>IN SECONDS
  </h1>

  <p class="hero-sub fade-up delay-2" style="position:relative;z-index:1">RCN Lead Gen by RCN Group</p>

  <p class="hero-desc fade-up delay-3" style="position:relative;z-index:1">
    Real-time business intelligence for MCA professionals. Find <strong>verified businesses</strong> with phone numbers, addresses, and owner lookup tools — all in one platform.
  </p>

  <div class="hero-btns fade-up delay-4" style="position:relative;z-index:1">
    <a href="#pricing" class="btn-primary">START FINDING LEADS →</a>
    <a href="#how" class="btn-secondary">SEE HOW IT WORKS</a>
  </div>
</section>

<!-- STATS -->
<div class="stats-bar">
  <div class="stat fade-up delay-1">
    <div class="stat-num">50<span>+</span></div>
    <div class="stat-label">STATES COVERED</div>
  </div>
  <div class="stat fade-up delay-2">
    <div class="stat-num">29<span>+</span></div>
    <div class="stat-label">INDUSTRY VERTICALS</div>
  </div>
  <div class="stat fade-up delay-3">
    <div class="stat-num"><span>$</span>50K+</div>
    <div class="stat-label">MIN MONTHLY REVENUE</div>
  </div>
  <div class="stat fade-up delay-4">
    <div class="stat-num">5<span>s</span></div>
    <div class="stat-label">AVG SEARCH TIME</div>
  </div>
</div>

<!-- FEATURES -->
<section class="section" id="features">
  <div class="section-label">FEATURES</div>
  <h2 class="section-title">Everything you need<br>to close more deals</h2>
  <p class="section-desc">Built specifically for MCA brokers who need real, verified businesses — not recycled lead lists.</p>

  <div class="features-grid">
    <div class="feature-card fade-up delay-1">
      <span class="feature-icon">🔍</span>
      <div class="feature-title">PROPRIETARY BUSINESS DATA</div>
      <div class="feature-desc">Every search pulls live data from our proprietary business intelligence databases. Real businesses, real addresses, real phone numbers — verified and updated continuously.</div>
    </div>
    <div class="feature-card fade-up delay-2">
      <span class="feature-icon">📞</span>
      <div class="feature-title">OWNER PHONE LOOKUP</div>
      <div class="feature-desc">Direct links to TruePeopleSearch, FastPeopleSearch, and Whitepages — find the owner's personal number in seconds.</div>
    </div>
    <div class="feature-card fade-up delay-3">
      <span class="feature-icon">🏛️</span>
      <div class="feature-title">ALL 50 STATE REGISTRIES</div>
      <div class="feature-desc">One-click access to every state's business registry. Verify ownership, find registered agents, check business status.</div>
    </div>
    <div class="feature-card fade-up delay-1">
      <span class="feature-icon">⚖️</span>
      <div class="feature-title">MCA LAWSUIT CHECKER</div>
      <div class="feature-desc">Instant links to CourtListener and PACER. Know before you call if a business has existing MCA debt or judgments.</div>
    </div>
    <div class="feature-card fade-up delay-2">
      <span class="feature-icon">🎯</span>
      <div class="feature-title">29 INDUSTRY VERTICALS</div>
      <div class="feature-desc">Trades, healthcare, food & franchise, auto, legal, manufacturing, funeral services, and many more — target the exact business types most likely to need working capital.</div>
    </div>
    <div class="feature-card fade-up delay-3">
      <span class="feature-icon">📥</span>
      <div class="feature-title">CSV EXPORT</div>
      <div class="feature-desc">Export all your saved leads with one click. Full data including all lookup URLs ready to drop into your CRM.</div>
    </div>
  </div>
</section>

<!-- HOW IT WORKS -->
<section class="how-section" id="how">
  <div class="how-inner">
    <div class="section-label">HOW IT WORKS</div>
    <h2 class="section-title">From zero to qualified lead<br>in under 60 seconds</h2>

    <div class="steps">
      <div class="step fade-up delay-1">
        <div class="step-num">01</div>
        <div class="step-title">SELECT TARGET</div>
        <div class="step-desc">Choose your state, city, and the industries you want to target.</div>
      </div>
      <div class="step fade-up delay-2">
        <div class="step-num">02</div>
        <div class="step-title">INSTANT SEARCH</div>
        <div class="step-desc">Our proprietary databases return real verified businesses in seconds.</div>
      </div>
      <div class="step fade-up delay-3">
        <div class="step-num">03</div>
        <div class="step-title">ENRICH DATA</div>
        <div class="step-desc">Hit 🔍 on any lead to instantly verify phone, website, and address.</div>
      </div>
      <div class="step fade-up delay-4">
        <div class="step-num">04</div>
        <div class="step-title">CLOSE DEALS</div>
        <div class="step-desc">Call the owner directly. You have everything you need to pitch.</div>
      </div>
    </div>
  </div>
</section>

<!-- PRICING -->
<section class="pricing-section" id="pricing">
  <div class="section-label">PRICING</div>
  <h2 class="section-title">Simple, transparent pricing</h2>
  <p class="section-desc">No hidden fees. Cancel anytime. Start finding leads today.</p>

  <div class="pricing-grid" style="grid-template-columns:1fr;max-width:520px;margin:40px auto 0">

    <!-- UNLIMITED -->
    <div class="pricing-card featured fade-up delay-1">
      <div class="pricing-tier">UNLIMITED</div>
      <div class="pricing-price"><sup>$</sup>2,299</div>
      <div class="pricing-period">per month</div>
      <div class="pricing-searches">UNLIMITED SEARCHES</div>
      <ul class="pricing-features">
        <li>Unlimited searches / month</li>
        <li>Real phone numbers & addresses</li>
        <li>All 50 state registries</li>
        <li>Owner personal phone lookup</li>
        <li>MCA lawsuit checker</li>
                <li>CSV export</li>
        <li>Dedicated account manager</li>
                <li>Priority access to all new beta features at launch</li>
        <li>Price locked — rate never increases</li>
      </ul>
      <a href="javascript:void(0)" onclick="showApp()" class="pricing-btn gold" id="unlimited-btn">GET STARTED →</a>
    </div>

  </div>
</section>

<!-- FAQ -->
<section class="faq-section" id="faq">
  <div class="section-label">FAQ</div>
  <h2 class="section-title" style="margin-bottom:40px">Common questions</h2>

  <div class="faq-item">
    <div class="faq-q">Where does the data come from?</div>
    <div class="faq-a">We source data from multiple real-time business intelligence platforms. Every result is a verified, active business with accurate contact information — not a recycled list.</div>
  </div>

  <div class="faq-item">
    <div class="faq-q">Can I cancel anytime?</div>
    <div class="faq-a">Yes. Cancel anytime from your account settings. No long-term contracts, no cancellation fees.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">What industries does it cover?</div>
    <div class="faq-a">Trades (roofing, HVAC, electrical, restoration), Food & Franchise (restaurants, catering, ghost kitchens, franchises), Healthcare (dental, med spas, urgent care, physical therapy, behavioral health), and many, many more.</div>
  </div>
  <div class="faq-item">
    <div class="faq-q">Is this only for MCA brokers?</div>
    <div class="faq-a">Built for MCA brokers but useful for anyone prospecting small to mid-size businesses — insurance, equipment leasing, staffing, and more.</div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-logo">RCN LEAD GEN · RCN GROUP</div>
  <div style="display:flex;gap:28px;align-items:center">
    <a href="/tos" style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#2a2a4a;letter-spacing:0.1em;text-decoration:none" onmouseover="this.style.color='#4488ff'" onmouseout="this.style.color='#2a2a4a'">TERMS OF SERVICE</a>
    <a href="/privacy" style="font-family:'IBM Plex Mono',monospace;font-size:10px;color:#2a2a4a;letter-spacing:0.1em;text-decoration:none" onmouseover="this.style.color='#4488ff'" onmouseout="this.style.color='#2a2a4a'">PRIVACY POLICY</a>
    <div class="footer-text">© 2026 RCN GROUP. ALL RIGHTS RESERVED.</div>
  </div>
</footer>

<script>
// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// Intersection observer for fade-up animations
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.animationPlayState = 'running';
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-up').forEach(el => {
  el.style.animationPlayState = 'paused';
  observer.observe(el);
});
</script>


</div>
<div id="app-page">
<div id="app"></div>
</div>
<script>
function showApp() {
  document.getElementById('landing-page').style.display = 'none';
  document.getElementById('app-page').style.display = 'block';
  window.scrollTo(0,0);
}
document.addEventListener('click', function(e) {
  const a = e.target.closest('a');
  if (a && (a.href.includes('/app') || a.href.includes('#app') || a.classList.contains('nav-cta') || a.classList.contains('pricing-btn'))) {
    e.preventDefault();
    showApp();
  }
});

const PROXY_URL = "https://mca-proxy-production.up.railway.app";

// Multiple search terms per industry — more variations = different Google result sets = more unique leads
const SEARCH_TERMS = {
  // ── TRADES & CONSTRUCTION ────────────────────────────────────────
  "Commercial Roofing":              ["roofing contractor", "commercial roofing", "roofing company"],
  "HVAC / Plumbing":                 ["HVAC contractor", "plumbing contractor", "AC repair company"],
  "Electrical Contractors":          ["electrical contractor", "electrician company", "commercial electrician"],
  "Restoration & Remediation":       ["water damage restoration", "mold remediation company", "fire restoration contractor"],
  "Construction & Demolition":       ["general contractor", "construction company", "demolition contractor"],
  "Landscaping & Tree Service":      ["landscaping company", "lawn care service", "tree service company"],
  "Home Services":                   ["home remodeling contractor", "painting contractor", "handyman service"],
  // ── FOOD & FRANCHISE ─────────────────────────────────────────────
  "Restaurant Groups (2+ locations)":["restaurant group", "multi-location restaurant", "food service company"],
  "High-volume Catering":            ["catering company", "corporate catering", "event catering service"],
  "Ghost Kitchen Operators":         ["ghost kitchen", "virtual kitchen", "cloud kitchen"],
  "Multi-unit Franchise":            ["franchise business", "multi-unit franchise", "franchise operator"],
  // ── HEALTHCARE ───────────────────────────────────────────────────
  "Dental Practice":                 ["dental office", "dental practice", "dentist clinic"],
  "Med Spa":                         ["med spa", "medical spa", "aesthetic clinic"],
  "Urgent Care Clinic":              ["urgent care clinic", "walk in clinic", "immediate care center"],
  "Physical Therapy":                ["physical therapy clinic", "physical therapist", "sports rehabilitation"],
  "Behavioral Health":               ["behavioral health clinic", "mental health practice", "counseling center"],
  "Veterinary":                      ["veterinary clinic", "animal hospital", "veterinarian office"],
  "Gyms & Fitness":                  ["gym fitness center", "personal training studio", "crossfit gym"],
  // ── AUTO & TRANSPORT ─────────────────────────────────────────────
  "Auto Repair & Dealerships":       ["auto repair shop", "car dealership", "auto body shop"],
  "Trucking & Logistics":            ["trucking company", "freight company", "logistics company"],
  // ── BEAUTY & PERSONAL CARE ───────────────────────────────────────
  "Beauty & Salons":                 ["hair salon", "nail salon", "barbershop"],
  "Cleaning & Janitorial":           ["commercial cleaning company", "janitorial service", "office cleaning service"],
  // ── PROFESSIONAL SERVICES ────────────────────────────────────────
  "Legal / Law Firms":               ["law firm", "personal injury attorney", "business attorney"],
  "Real Estate & Property Mgmt":     ["real estate company", "property management company", "real estate investor"],
  "IT & Tech Services":              ["IT services company", "managed IT services", "tech support company"],
  "Security Services":               ["security company", "private security firm", "security guard company"],
  "Manufacturing & Fabrication":     ["manufacturing company", "metal fabrication shop", "custom fabrication"],
  "Funeral Services":                ["funeral home", "funeral services", "mortuary"],
  // ── CHILDCARE & EDUCATION ────────────────────────────────────────
  "Childcare & Education":           ["daycare center", "private school", "tutoring center"],
  // ── RETAIL ───────────────────────────────────────────────────────
  "Retail & E-commerce":             ["retail store", "boutique store", "specialty retail shop"],
};

const STATE_REGISTRY = {
  AL:{name:"Alabama",url:"https://sos.alabama.gov/government-records/business-entity-records"},
  AK:{name:"Alaska",url:"https://myalaska.state.ak.us/business/soskb/CSearch.asp"},
  AZ:{name:"Arizona",url:"https://ecorp.azcc.gov/BusinessSearch/BusinessSearch"},
  AR:{name:"Arkansas",url:"https://www.sos.arkansas.gov/corps/search_all.php"},
  CA:{name:"California",url:"https://bizfileonline.sos.ca.gov/search/business"},
  CO:{name:"Colorado",url:"https://www.sos.state.co.us/biz/BusinessEntityCriteriaExt.do"},
  CT:{name:"Connecticut",url:"https://service.ct.gov/business/s/onlinebusinesssearch"},
  DE:{name:"Delaware",url:"https://icis.corp.delaware.gov/Ecorp/EntitySearch/NameSearch.aspx"},
  FL:{name:"Florida",url:"https://search.sunbiz.org/Inquiry/CorporationSearch/ByName"},
  GA:{name:"Georgia",url:"https://ecorp.sos.ga.gov/BusinessSearch"},
  HI:{name:"Hawaii",url:"https://hbe.ehawaii.gov/documents/search.html"},
  ID:{name:"Idaho",url:"https://sosbiz.idaho.gov/search/business"},
  IL:{name:"Illinois",url:"https://www.ilsos.gov/corporatellc/"},
  IN:{name:"Indiana",url:"https://bsd.sos.in.gov/publicbusinesssearch"},
  IA:{name:"Iowa",url:"https://sos.iowa.gov/search/business/search.aspx"},
  KS:{name:"Kansas",url:"https://www.sos.ks.gov/business/business.aspx"},
  KY:{name:"Kentucky",url:"https://web.sos.ky.gov/ftsearch/"},
  LA:{name:"Louisiana",url:"https://coraweb.sos.la.gov/commercialsearch/commercialsearch.aspx"},
  ME:{name:"Maine",url:"https://icrs.informe.org/nei-sos-icrs/ICRS?MainPage=x"},
  MD:{name:"Maryland",url:"https://egov.maryland.gov/BusinessExpress/EntitySearch"},
  MA:{name:"Massachusetts",url:"https://corp.sec.state.ma.us/CorpWeb/CorpSearch/CorpSearch.aspx"},
  MI:{name:"Michigan",url:"https://cofs.lara.state.mi.us/SearchApi/Search/Search"},
  MN:{name:"Minnesota",url:"https://mblsportal.sos.state.mn.us/Business/Search"},
  MS:{name:"Mississippi",url:"https://corp.sos.ms.gov/corp/portal/c/page/corpBusinessIdSearch/portal.aspx"},
  MO:{name:"Missouri",url:"https://www.sos.mo.gov/business/corporations/soskb/csearch.asp"},
  MT:{name:"Montana",url:"https://biz.sosmt.gov/search/business"},
  NE:{name:"Nebraska",url:"https://www.nebraska.gov/sos/corp/corpsearch.cgi"},
  NV:{name:"Nevada",url:"https://esos.nv.gov/EntitySearch/OnlineEntitySearch"},
  NH:{name:"New Hampshire",url:"https://quickstart.sos.nh.gov/online/BusinessInquire"},
  NJ:{name:"New Jersey",url:"https://www.njportal.com/DOR/businessrecords/"},
  NM:{name:"New Mexico",url:"https://portal.sos.state.nm.us/BFS/online/CorporationBusinessSearch"},
  NY:{name:"New York",url:"https://apps.dos.ny.gov/publicInquiry/"},
  NC:{name:"North Carolina",url:"https://www.sosnc.gov/online_services/search/by_title/_Business_Registration"},
  ND:{name:"North Dakota",url:"https://firststop.sos.nd.gov/search/business"},
  OH:{name:"Ohio",url:"https://businesssearch.ohiosos.gov/"},
  OK:{name:"Oklahoma",url:"https://www.sos.ok.gov/corp/corpsearch.aspx"},
  OR:{name:"Oregon",url:"https://sos.oregon.gov/business/pages/find.aspx"},
  PA:{name:"Pennsylvania",url:"https://www.corporations.pa.gov/search/corpsearch"},
  RI:{name:"Rhode Island",url:"https://business.sos.ri.gov/CorpWeb/CorpSearch/CorpSearch.aspx"},
  SC:{name:"South Carolina",url:"https://businessfilings.sc.gov/BusinessFiling/Entity/Search"},
  SD:{name:"South Dakota",url:"https://sosenterprise.sd.gov/BusinessServices/Business/FilingSearch.aspx"},
  TN:{name:"Tennessee",url:"https://tnbear.tn.gov/Ecommerce/FilingSearch.aspx"},
  TX:{name:"Texas",url:"https://www.sos.state.tx.us/corp/sosda/index.shtml"},
  UT:{name:"Utah",url:"https://secure.utah.gov/bes/index.html"},
  VT:{name:"Vermont",url:"https://bizfilings.vermont.gov/online/DatabrokerInquire/Search"},
  VA:{name:"Virginia",url:"https://cis.scc.virginia.gov/"},
  WA:{name:"Washington",url:"https://ccfs.sos.wa.gov/#/"},
  WV:{name:"West Virginia",url:"https://apps.wv.gov/sos/businessentitysearch/"},
  WI:{name:"Wisconsin",url:"https://www.wdfi.org/apps/CorpSearch/Search.aspx"},
  WY:{name:"Wyoming",url:"https://wyobiz.wyo.gov/Business/FilingSearch.aspx"},
};

const INDUSTRY_GROUPS = {
  "🏗️ Trades & Construction": ["Commercial Roofing","HVAC / Plumbing","Electrical Contractors","Restoration & Remediation","Construction & Demolition","Landscaping & Tree Service","Home Services"],
  "🍽️ Food & Franchise":      ["Restaurant Groups (2+ locations)","High-volume Catering","Ghost Kitchen Operators","Multi-unit Franchise"],
  "🏥 Healthcare":             ["Dental Practice","Med Spa","Urgent Care Clinic","Physical Therapy","Behavioral Health","Veterinary","Gyms & Fitness"],
  "🚗 Auto & Transport":       ["Auto Repair & Dealerships","Trucking & Logistics"],
  "💅 Beauty & Services":      ["Beauty & Salons","Cleaning & Janitorial"],
  "💼 Professional":           ["Legal / Law Firms","Real Estate & Property Mgmt","IT & Tech Services","Security Services","Manufacturing & Fabrication","Funeral Services"],
  "📚 Other":                  ["Childcare & Education","Retail & E-commerce"],
};

const ALL_INDUSTRIES = Object.values(INDUSTRY_GROUPS).flat();


// For major metros, auto-expand search to nearby areas to get far more unique businesses
const NEARBY_AREAS = {
  "miami":       ["Miami Beach", "Coral Gables", "Hialeah", "Doral", "Kendall", "Brickell", "Aventura", "Hollywood FL"],
  "orlando":     ["Kissimmee", "Sanford", "Altamonte Springs", "Winter Park", "Lake Mary", "Maitland", "Oviedo"],
  "tampa":       ["St Petersburg", "Clearwater", "Brandon", "Lakeland", "Sarasota", "Wesley Chapel"],
  "jacksonville":["Orange Park", "Fleming Island", "Ponte Vedra", "Fernandina Beach", "St Augustine"],
  "new york":    ["Brooklyn", "Queens", "Bronx", "Staten Island", "Newark NJ", "Yonkers", "Long Island"],
  "manhattan":   ["Brooklyn", "Queens", "Bronx", "Jersey City", "Hoboken", "Long Island City"],
  "brooklyn":    ["Queens", "Bronx", "Newark", "Jersey City", "Hoboken"],
  "los angeles": ["Burbank", "Glendale", "Pasadena", "Long Beach", "Torrance", "El Monte", "Inglewood", "Santa Monica"],
  "chicago":     ["Naperville", "Schaumburg", "Aurora", "Evanston", "Oak Park", "Joliet", "Cicero"],
  "houston":     ["Sugar Land", "Pearland", "Katy", "The Woodlands", "Pasadena TX", "Baytown", "League City"],
  "dallas":      ["Fort Worth", "Plano", "Arlington", "Irving", "Garland", "Mesquite", "Frisco", "McKinney"],
  "atlanta":     ["Marietta", "Sandy Springs", "Roswell", "Alpharetta", "Decatur", "Smyrna", "Kennesaw"],
  "phoenix":     ["Scottsdale", "Tempe", "Mesa", "Chandler", "Gilbert", "Glendale AZ", "Peoria AZ"],
  "san antonio": ["New Braunfels", "Schertz", "Converse", "Universal City", "Leon Valley"],
  "denver":      ["Aurora CO", "Lakewood", "Thornton", "Arvada", "Westminster CO", "Centennial CO"],
  "charlotte":   ["Concord NC", "Gastonia", "Rock Hill", "Huntersville", "Matthews NC"],
  "las vegas":   ["Henderson NV", "North Las Vegas", "Summerlin", "Spring Valley NV", "Paradise NV"],
};

function getNearbyAreas(city) {
  const key = (city || '').toLowerCase().trim();
  return NEARBY_AREAS[key] || [];
}

const FUNDER_APPETITE = {
  "Commercial Roofing":              { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "High revenue, reliable contracts" },
  "HVAC / Plumbing":                 { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "Essential service, consistent cash flow" },
  "Electrical Contractors":          { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "Strong margins, steady project volume" },
  "Restoration & Remediation":       { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "Insurance-backed, predictable revenue" },
  "Dental Practice":                 { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "Recurring patient base, high revenue" },
  "Med Spa":                         { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "Cash-pay business, high ticket" },
  "Urgent Care Clinic":              { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "High volume, insurance + cash pay" },
  "Physical Therapy":                { label: "🟢 Easy to Fund",      color: "#00cc66", bg: "#041a0e", border: "#083020", tip: "Insurance backed, steady patient flow" },
  "Behavioral Health":               { label: "🟡 Selective Funders", color: "#ffcc44", bg: "#1a1400", border: "#2a2000", tip: "Insurance delays can hurt cash flow" },
  "Restaurant Groups (2+ locations)":{ label: "🟡 Selective Funders", color: "#ffcc44", bg: "#1a1400", border: "#2a2000", tip: "High revenue but tight margins" },
  "High-volume Catering":            { label: "🟡 Selective Funders", color: "#ffcc44", bg: "#1a1400", border: "#2a2000", tip: "Seasonal and event-dependent" },
  "Ghost Kitchen Operators":         { label: "🟡 Selective Funders", color: "#ffcc44", bg: "#1a1400", border: "#2a2000", tip: "Newer model, some funders hesitant" },
  "Multi-unit Franchise":            { label: "🟡 Selective Funders", color: "#ffcc44", bg: "#1a1400", border: "#2a2000", tip: "Depends on brand and unit count" },
};

function getFunderAppetite(industry) {
  return FUNDER_APPETITE[industry] || { label: "⚪ Unknown", color: "#5a5a8a", bg: "#0a0a14", border: "#1a1a2a", tip: "No funder data for this industry" };
}

const IND_COLORS = {
  "Commercial Roofing":         {bg:"#0f1a0a",color:"#66cc44",border:"#1a3a0a"},
  "HVAC / Plumbing":            {bg:"#0a0f1a",color:"#4488ff",border:"#0a1a3a"},
  "Electrical Contractors":     {bg:"#1a1a0a",color:"#ffcc00",border:"#2a2a0a"},
  "Restoration & Remediation":  {bg:"#1a0a0a",color:"#ff6644",border:"#2a0a0a"},
  "Restaurant Groups (2+ locations)":{bg:"#1a0a14",color:"#ff66aa",border:"#2a0a1e"},
  "High-volume Catering":       {bg:"#1a0a14",color:"#ff88bb",border:"#2a0a1e"},
  "Ghost Kitchen Operators":    {bg:"#1a0a14",color:"#ff44cc",border:"#2a0a1e"},
  "Multi-unit Franchise":       {bg:"#1a0f0a",color:"#ffaa44",border:"#2a1a0a"},
  "Dental Practice":            {bg:"#0a1a1a",color:"#00cccc",border:"#0a2a2a"},
  "Med Spa":                    {bg:"#0a1a1a",color:"#00ffcc",border:"#0a2a2a"},
  "Urgent Care Clinic":         {bg:"#0a1a1a",color:"#44ccff",border:"#0a2a2a"},
  "Physical Therapy":           {bg:"#0a1a1a",color:"#88ddff",border:"#0a2a2a"},
  "Behavioral Health":          {bg:"#0a1a1a",color:"#aabbff",border:"#0a2a2a"},
};

// AUTH
let authToken = localStorage.getItem('rcn_token') || null;


let currentUser = null;

async function apiAuth(endpoint, body) {
  const res = await fetch(PROXY_URL + endpoint, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body),
  });
  return res.json();
}

async function loadUser() {
  if (!authToken) return false;
  try {
    const res = await fetch(PROXY_URL + '/auth/me', {
      headers: {'Authorization': 'Bearer ' + authToken}
    });
    if (!res.ok) { authToken = null; localStorage.removeItem('rcn_token'); return false; }
    const data = await res.json();
    currentUser = data.user;
    return true;
  } catch(e) { return false; }
}

function logout() {
  authToken = null;
  currentUser = null;
  localStorage.removeItem('rcn_token');
  setState({authView: 'login', authError: '', authLoading: false});
}

// APP STATE
let state = {
  // Auth
  authView: authToken ? 'app' : 'login', // show app immediately if token exists, verify in background
  authError: '',
  authLoading: false,
  // App
  leads: [],
  savedLeads: JSON.parse(localStorage.getItem('savedLeads') || '[]'),
  loading: false,
  loadingMsg: '',
  progress: 0,
  errorMsg: '',
  selectedState: 'FL',
  selectedCity: '',
  selectedIndustries: [],
  maxLeads: 10,
  sbaOnly: false,
  sbaReady: false,
  sbaWarming: false,
  sbaCount: 0,
  sbaError: null,
  activeTab: 'generate',
  searchQuery: '',
  enriching: null,
  expandedLead: null,
  searchHistory: JSON.parse(localStorage.getItem('searchHistory') || '[]'),
  historyNote: {},
  historyExpanded: null,
  leadNotes: JSON.parse(localStorage.getItem('leadNotes') || '{}'),
  profileEditing: null,
  profileMsg: '',
};


// Robust state extraction — handles Google "FL 33101, USA", HERE "Florida 33101, United States"
const CLIENT_US_STATE_CODES = new Set(['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO',
  'MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']);
const CLIENT_US_STATE_NAMES = {
  'alabama':'AL','alaska':'AK','arizona':'AZ','arkansas':'AR','california':'CA',
  'colorado':'CO','connecticut':'CT','delaware':'DE','florida':'FL','georgia':'GA',
  'hawaii':'HI','idaho':'ID','illinois':'IL','indiana':'IN','iowa':'IA',
  'kansas':'KS','kentucky':'KY','louisiana':'LA','maine':'ME','maryland':'MD',
  'massachusetts':'MA','michigan':'MI','minnesota':'MN','mississippi':'MS',
  'missouri':'MO','montana':'MT','nebraska':'NE','nevada':'NV','new hampshire':'NH',
  'new jersey':'NJ','new mexico':'NM','new york':'NY','north carolina':'NC',
  'north dakota':'ND','ohio':'OH','oklahoma':'OK','oregon':'OR','pennsylvania':'PA',
  'rhode island':'RI','south carolina':'SC','south dakota':'SD','tennessee':'TN',
  'texas':'TX','utah':'UT','vermont':'VT','virginia':'VA','washington':'WA',
  'west virginia':'WV','wisconsin':'WI','wyoming':'WY','district of columbia':'DC'
};
function extractStateFromAddr(address) {
  if (!address) return '';
  const parts = address.split(',').map(p => p.trim());
  for (const part of parts) {
    const code = part.split(/\s+/)[0].toUpperCase();
    if (CLIENT_US_STATE_CODES.has(code)) return code;
  }
  const lower = address.toLowerCase();
  const sortedCNames = Object.entries(CLIENT_US_STATE_NAMES).sort((a,b) => b[0].length - a[0].length);
  for (const [name, code] of sortedCNames) {
    const re = new RegExp('\\b' + name + '\\b');
    if (re.test(lower)) return code;
  }
  return '';
}

// Warm SBA data as soon as possible — polls until ready
async function warmSBA() {
  if (state.sbaReady) return;
  setState({sbaWarming: true, sbaError: null});
  // Poll up to 8 minutes (80 × 6s) — Railway cold start + 200MB CSV download can take 4-5 min
  for (let attempt = 0; attempt < 80; attempt++) {
    try {
      const res = await fetch(`${PROXY_URL}/warmup`);
      const data = await res.json();
      if (data.sba_ready) {
        setState({sbaReady: true, sbaWarming: false, sbaCount: data.sba_count || 0, sbaError: null});
        return;
      }
      // Show error in header if server reported one
      if (data.sba_error && !data.sba_loading) {
        setState({sbaWarming: false, sbaError: data.sba_error});
        // Still retry — server will retry on its own, we just keep polling
        setTimeout(() => { state.sbaError = null; warmSBA(); }, 90000); // retry in 90s
        return;
      }
    } catch(_) {}
    await new Promise(r => setTimeout(r, 6000));
  }
  setState({sbaWarming: false}); // gave up after 8 min
}

// Check auth on load
// Verify token in background — don't block initial render
if (authToken) {
  warmSBA(); // start SBA warm immediately
  loadUser().then(ok => {
    if (!ok) setState({authView: 'login'}); // kick out if token expired
  });
}

// ─── XSS PROTECTION ─────────────────────────────────────────────
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ─── LEAD SCORING ────────────────────────────────────────────────
function scoreLead(lead) {
  let score = 0;

  // Contact info — most important for MCA outreach
  if (lead.phone)    score += 25;
  if (lead.website)  score += 15;
  if (lead.email)    score += 20;

  // Business age — older = more stable, better MCA candidate
  if (lead.businessAge >= 10)       score += 10;
  else if (lead.businessAge >= 5)   score += 7;
  else if (lead.businessAge >= 2)   score += 3;
  else if (lead.businessAge === 0)  score -= 5; // brand new, risky

  // Business health signals
  if (lead.reviewCount >= 50)       score += 10;
  else if (lead.reviewCount >= 20)  score += 6;
  else if (lead.reviewCount >= 5)   score += 3;

  if (lead.rating >= 4.0)           score += 5;
  else if (lead.rating >= 3.0)      score += 2;

  if (lead.hasHours)                score += 5; // confirmed open/operating

  // SBA loan = revenue confirmed, but also has debt
  if (lead.sbaFound) {
    score += 5;
    if (lead.loanAmount >= 100000)  score += 5;
  }

  // Stacking risk — penalize
  if (lead.stackingRisk === 'high')   score -= 20;
  if (lead.stackingRisk === 'medium') score -= 10;

  return Math.min(100, Math.max(0, score));
}

function scoreColor(score) {
  if (score >= 75) return { color: '#00cc66', bg: '#041a0e', border: '#083020', label: 'HOT' };
  if (score >= 50) return { color: '#ffaa00', bg: '#1a1000', border: '#2a1800', label: 'WARM' };
  if (score >= 25) return { color: '#4488ff', bg: '#060f28', border: '#0f1e44', label: 'COLD' };
  return { color: '#555577', bg: '#0a0a14', border: '#14142a', label: 'WEAK' };
}

// ─── STACKING DETECTOR ───────────────────────────────────────────
async function checkStacking(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;
  setState({ leads: state.leads.map(l => l.id === leadId ? {...l, stackingChecking: true} : l) });
  try {
    const res = await fetch(`${PROXY_URL}/proxy-stacking?name=${encodeURIComponent(lead.businessName)}`, {
      headers: { 'Authorization': 'Bearer ' + authToken }
    });
    if (!res.ok) throw new Error('check failed');
    const data = await res.json();
    const count = data.count || 0;
    const risk = count >= 3 ? 'high' : count >= 1 ? 'medium' : 'none';
    const updated = { ...lead, stackingChecking: false, stackingRisk: risk, stackingCount: count };
    updated.score = scoreLead(updated);
    setState({ leads: state.leads.map(l => l.id === leadId ? updated : l) });
  } catch(e) {
    setState({ leads: state.leads.map(l => l.id === leadId ? {...l, stackingChecking: false, stackingRisk: 'unknown'} : l) });
  }
}

function buildRegistryUrl(st, encodedName) {
  const n = encodedName;
  const urls = {
    FL: `https://search.sunbiz.org/Inquiry/CorporationSearch/SearchResults?inquirytype=EntityName&searchTerm=${n}`,
    NY: `https://apps.dos.ny.gov/publicInquiry/#search?searchTerm=${n}&entity=DOS`,
    CA: `https://bizfileonline.sos.ca.gov/search/business?query=${n}`,
    TX: `https://mycpa.cpa.state.tx.us/coa/Index.html#search/${n}`,
    GA: `https://ecorp.sos.ga.gov/BusinessSearch/BusinessInformation?nameContains=${n}`,
    NJ: `https://www.njportal.com/DOR/BusinessNameSearch/api/businessnames/search/beginswith?keywords=${n}`,
    IL: `https://apps.ilsos.gov/businessentitysearch/businessentitysearchresults.do?business_name=${n}&search_type=E`,
    OH: `https://businesssearch.ohiosos.gov/?=businessDetails&busName=${n}`,
    AZ: `https://ecorp.azcc.gov/BusinessSearch/Business?query=${n}`,
    CO: `https://www.sos.state.co.us/biz/BusinessEntityCriteriaExt.do?nameTyp=ENT&entName=${n}`,
    MD: `https://egov.maryland.gov/BusinessExpress/EntitySearch/Search?searchTerm=${n}`,
    MN: `https://mblsportal.sos.state.mn.us/Business/Search?BusinessName=${n}`,
    PA: `https://www.corporations.pa.gov/search/corpsearch?q=${n}`,
    WA: `https://ccfs.sos.wa.gov/#/BusinessSearch?keyword=${n}`,
    NC: `https://www.sosnc.gov/online_services/search/by_title/_Business_Registration_results?q=${n}`,
    VA: `https://cis.scc.virginia.gov/EntitySearch/Index?searchTerm=${n}`,
    TN: `https://tnbear.tn.gov/Ecommerce/FilingSearch.aspx?name=${n}`,
    MI: `https://cofs.lara.state.mi.us/SearchApi/Search/Search?searchTerm=${n}&entityType=ALL`,
    IN: `https://bsd.sos.in.gov/publicbusinesssearch?SearchTerm=${n}`,
    MO: `https://www.sos.mo.gov/BusinessEntity/soskb/CSearch.asp?SearchFor=${n}`,
  };
  return urls[st] || null;
}

function buildLinks(name, city, st) {
  const b = encodeURIComponent(name);
  const c = encodeURIComponent(city);
  const full = encodeURIComponent(`${name} ${city} ${st}`);
  const stl = (st||'').toLowerCase();
  return {
    stateRegistry: buildRegistryUrl(st, b) || `https://www.google.com/search?q=${b}+${st}+secretary+state+business+search`,
    openCorporates: `https://opencorporates.com/companies?q=${b}&jurisdiction_code=us_${stl}&type=companies`,
    ownerGoogle: `https://www.google.com/search?q="${b}"+"${c}"+"owner"+OR+"president"+OR+"principal"`,
    truePeople: `https://www.truepeoplesearch.com/results?phoneno=PHONE_PLACEHOLDER`,
    fastPeople: `https://www.fastpeoplesearch.com/name/_${st}`,
    whitepages: `https://www.whitepages.com/business`,
    googleLawsuit: `https://www.google.com/search?q=${encodeURIComponent(name+' '+city+' merchant cash advance lawsuit OR default OR judgment')}`,
    courtListener: `https://www.courtlistener.com/?q=${encodeURIComponent('"'+name+'"')}&type=r&order_by=score+desc`,
    pacer: `https://pcl.uscourts.gov/pcl/pages/search/findParty.jsf`,
  };
}

async function fetchLeads() {
  if (state.selectedIndustries.length === 0) { setState({errorMsg: 'Select at least one industry.'}); return; }
  setState({loading: true, leads: [], errorMsg: '', progress: 10, loadingMsg: '🔍 Searching our databases...'});

  const city = state.selectedCity.trim();
  const st = state.selectedState;
  const STATE_FULL_NAMES = {
    AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
    CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
    HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
    KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
    MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
    MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
    NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
    OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
    SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
    VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',DC:'Washington DC'
  };
  const stateName = STATE_FULL_NAMES[st] || st;
  const location = city ? `${city}, ${stateName}` : (st === 'All States' ? 'United States' : stateName);

  try {
    // Each industry runs all its search term variants + nearby suburbs in parallel
    const perTerm = 40; // fewer concurrent searches, so each fetches more
    // Single location per search — HERE returns up to 100 results per call, no need to spam suburbs
    const searches = state.selectedIndustries.flatMap(ind => {
      const termList = SEARCH_TERMS[ind] || [ind];
      return termList.map(term => {
        const url = `${PROXY_URL}/search?type=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&limit=${perTerm}`;
        return fetch(url, {headers: {'Authorization': 'Bearer ' + authToken}})
          .then(r => r.json())
          .then(d => {
            if (d.error) throw new Error(d.error);
            return (d.results || []).map(b => ({...b, industry: ind}));
          })
          .catch(e => {
            const msg = e.message || '';
            if (msg.includes('API key') || msg.includes('quota') || msg.includes('not configured')) {
              setState({errorMsg: '⚠️ Server error: ' + msg});
            }
            console.warn('[SEARCH] failed:', term, msg);
            return [];
          });
      });
    });

    setState({progress: 50});
    const allResults = await Promise.all(searches);
    setState({progress: 80, loadingMsg: '⚙️ Building profiles...'});

    const seenIds = new Set();
    const seenNames = new Set();
    const flat = allResults.flat().filter(b => {
      const idKey = b.placeId || '';
      const nameKey = (b.businessName || '').toLowerCase().replace(/[^a-z0-9]/g,'').substring(0,25);
      if (!nameKey) return false;
      if (idKey && seenIds.has(idKey)) return false;
      if (seenNames.has(nameKey)) return false;
      if (idKey) seenIds.add(idKey);
      seenNames.add(nameKey);
      return true;
    }).slice(0, state.sbaOnly ? state.maxLeads * 4 : state.maxLeads);

    // SBA-only mode: auto-check all leads and keep only ones with SBA records
    if (state.sbaOnly) {
      setState({loadingMsg: '📊 Checking SBA loan records...'});
      let sbaDataReady = true;
      await Promise.all(flat.map(async lead => {
        try {
          const leadState = extractStateFromAddr(lead.address || '') || '';
          const params = new URLSearchParams({name: lead.businessName, state: leadState});
          for (let attempt = 0; attempt < 6; attempt++) {
            const res = await fetch(`${PROXY_URL}/sba-lookup?${params}`, {headers: {'Authorization': 'Bearer ' + authToken}});
            const data = await res.json();
            if (data.status === 'loading' || data.status === 'unavailable') {
              if (attempt < 5) { await new Promise(r => setTimeout(r, 5000)); continue; }
              sbaDataReady = false; // still loading after all attempts
              break;
            }
            if (data.found) {
              lead.sbaFound = true; lead.loanAmount = data.loanAmount;
              lead.approvalDate = data.approvalDate; lead.lender = data.lender;
              lead.jobsSupported = data.jobsSupported;
              lead.estimatedMonthlyRevenue = '$' + (data.estMonthlyRevenue||0).toLocaleString();
            } else { lead.sbaFound = false; }
            break;
          }
        } catch(_) {}
      }));

      // If SBA database wasn't ready yet, show all leads with a notice instead of empty screen
      if (!sbaDataReady) {
        setState({errorMsg: '⏳ SBA database is still loading on the server (takes ~2 min on cold start). Your leads are shown below — click the 📊 SBA button on each lead once ready.', loading: false,
          leads: flat.slice(0, state.maxLeads).map((b, i) => {
            const addrParts = (b.address || '').split(',');
            const bCity = addrParts[1]?.trim() || city || '';
            const bState = extractStateFromAddr(b.address || '') || st;
            const links = buildLinks(b.businessName, bCity, bState);
            if (b.phone) links.truePeople = `https://www.truepeoplesearch.com/results?phoneno=${b.phone.replace(/\D/g,'')}`;
      if (b.officerName) links.truePeopleName = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(b.officerName)}&citystatezip=${encodeURIComponent(bState)}`;
            const lead = {...b, id: `lead-${i}-${Date.now()}`, city: bCity, state: bState,
              estimatedMonthlyRevenue: b.estimatedMonthlyRevenue || null, loanAmount: b.loanAmount || null, approvalDate: b.approvalDate || null, jobsSupported: b.jobsSupported || null,
              bizType: null, dataSource: 'RCN Database', verified: true, enriched: false,
              reviewCount: b.reviewCount || 0, businessStatus: null, hasHours: null, score: null,
              stackingRisk: null, businessAge: b.businessAge || null, incorporationDate: b.incorporationDate || null, officerName: b.officerName || null,
              companyStatus: b.companyStatus || null, source: b.source || 'google', ...links};
            lead.score = scoreLead(lead);
            return lead;
          })
        });
        return;
      }

      const sbaFiltered = flat.filter(l => l.sbaFound === true).slice(0, state.maxLeads);
      if (sbaFiltered.length === 0) {
        setState({errorMsg: '⚪ No SBA loan records matched these businesses. Try different industries or a larger city — not all businesses have SBA loans on record.', loading: false});
        return;
      }
      flat.length = 0; flat.push(...sbaFiltered);
    }

    if (flat.length === 0) {
      const loc = state.selectedCity ? `${state.selectedCity}, ${state.selectedState}` : stateName;
      setState({errorMsg: \`⚠️ No businesses found for "\${loc}". Try: selecting at least one industry, checking the city spelling, or searching a larger nearby city.\`, loading: false});
      return;
    }

    const enriched = flat.map((b, i) => {
      const addrParts = (b.address || '').split(',');
      const bCity = addrParts[1]?.trim() || city || '';
      const bState = extractStateFromAddr(b.address || '') || st;
      const links = buildLinks(b.businessName, bCity, bState);
      // Fix truePeople to use phone
      if (b.phone) links.truePeople = `https://www.truepeoplesearch.com/results?phoneno=${b.phone.replace(/\D/g,'')}`;
      if (b.officerName) links.truePeopleName = `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(b.officerName)}&citystatezip=${encodeURIComponent(bState)}`;
      const lead = {
        ...b,
        id: `lead-${i}-${Date.now()}`,
        city: bCity,
        state: bState,
        estimatedMonthlyRevenue: b.estimatedMonthlyRevenue || null,
        loanAmount: b.loanAmount || null,
        approvalDate: b.approvalDate || null,
        jobsSupported: b.jobsSupported || null,
        bizType: null,
        dataSource: 'RCN Database',
        verified: true,
        enriched: false, // user must click enrich to get full details
        reviewCount: b.reviewCount || 0,
        businessStatus: null,
        hasHours: null,
        score: null,
        stackingRisk: null,
        businessAge: b.businessAge || null,
        incorporationDate: b.incorporationDate || null,
        officerName: b.officerName || null,
        companyStatus: b.companyStatus || null,
        source: b.source || 'google',
        ...links,
      };
      lead.score = scoreLead(lead);
      return lead;
    });

    const historyEntry = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      state: state.selectedState,
      city: state.selectedCity || 'Statewide',
      industries: [...state.selectedIndustries],
      maxLeads: state.maxLeads,
      resultsCount: enriched.length,
      note: '',
    };
    const updatedHistory = [historyEntry, ...state.searchHistory].slice(0, 100);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
    setState({leads: enriched, progress: 100, loadingMsg: `✅ Found ${enriched.length} real businesses!`, loading: false, searchHistory: updatedHistory});
  } catch(err) {
    setState({errorMsg: `Error: ${err.message}`, loading: false});
  }
}

async function enrichWithGoogle(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead || !lead.placeId) { console.warn('No placeId for lead', leadId); return; }
  setState({enriching: leadId});

  try {
    const params = new URLSearchParams({
      placeId: lead.placeId,
      website: lead.website || '',
      name: lead.businessName || '',
      state: lead.state || '',
      officerName: lead.officerName || '',
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // email(8s) + SOS(5s) + buffer
    const res = await fetch(`${PROXY_URL}/enrich?${params}`, {
      headers: {'Authorization': 'Bearer ' + authToken},
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Server error ${res.status}`);
    const data = await res.json();

    if (data.error) throw new Error(data.error);

    const phone = data.phone || lead.phone;
    const updatedLinks = buildLinks(lead.businessName, lead.city, lead.state);
    if (phone) updatedLinks.truePeople = `https://www.truepeoplesearch.com/results?phoneno=${phone.replace(/\D/g,'')}`;

    const enrichedLead = {
      ...lead, ...updatedLinks,
      phone,
      website: data.website || lead.website,
      address: data.address || lead.address,
      email: data.email || lead.email || null,
      emailSource: data.emailSource || lead.emailSource || null,
      ownerEmail: data.ownerEmail || lead.ownerEmail || null,
      ownerPhone: data.ownerPhone || lead.ownerPhone || null,
      linkedIn: data.linkedIn || lead.linkedIn || null,
      sosUrl: data.sosUrl || lead.sosUrl || null,
      reviewCount: data.reviewCount || lead.reviewCount || 0,
      businessStatus: data.businessStatus || null,
      hasHours: data.hasHours || false,
      businessAge: data.businessAge || lead.businessAge || null,
      incorporationDate: data.incorporationDate || lead.incorporationDate || null,
      officerName: data.officerName || lead.officerName || null,
      companyStatus: data.companyStatus || lead.companyStatus || null,
      enriched: true,
    };
    enrichedLead.score = scoreLead(enrichedLead);
    // Count what actually changed so we can show user
    const gains = [];
    if (data.phone && !lead.phone) gains.push('📞 phone');
    if (data.website && !lead.website) gains.push('🌐 website');
    if (data.ownerPhone) gains.push('📱 owner cell');
    if (data.ownerEmail) gains.push('✉️ owner email');
    else if (data.email && !lead.email) gains.push('✉️ email');
    if (data.officerName && !lead.officerName) gains.push('👤 owner name');
    if (data.linkedIn && !lead.linkedIn) gains.push('💼 LinkedIn');
    if (data.incorporationDate && !lead.incorporationDate) gains.push('📅 age');
    enrichedLead.enrichGains = gains.length > 0 ? gains.join(' · ') : 'ℹ️ No new data found';
    setState({ leads: state.leads.map(l => l.id === leadId ? enrichedLead : l), enriching: null });
    if (gains.length > 0) {
      showToast(`✓ Enriched: ${gains.join(' · ')}`, '#00cc66');
    } else {
      showToast(`ℹ️ ${enrichedLead.businessName?.split(' ').slice(0,3).join(' ')}: data already complete or not found`, '#4488ff', 3000);
    }
  } catch(e) {
    console.error('Enrich error:', e);
    setState({
      leads: state.leads.map(l => l.id === leadId ? {...l, enriched: true, enrichError: e.message} : l),
      enriching: null
    });
    showToast(`✗ Enrich failed: ${e.message}`, '#ff4466');
  }
}

async function enrichAll() {
  for (const lead of state.leads.filter(l => !l.enriched)) {
    await enrichWithGoogle(lead.id);
    await new Promise(r => setTimeout(r, 500));
  }
}

function saveLead(lead) {
  if (state.savedLeads.find(l => l.id === lead.id)) return;
  const updated = [...state.savedLeads, {...lead, savedAt: new Date().toISOString()}];
  localStorage.setItem('savedLeads', JSON.stringify(updated));
  setState({savedLeads: updated});
}

function removeSaved(id) {
  const updated = state.savedLeads.filter(l => l.id !== id);
  localStorage.setItem('savedLeads', JSON.stringify(updated));
  setState({savedLeads: updated});
}

function exportCSV() {
  const hdr = "Business Name,Industry,Address,City,State,Phone,Website,Officer Name,Owner Cell,Owner Email,Work Email,LinkedIn,Score,Business Age,Corp Status,Incorporation Date,SBA Est Monthly Rev,SBA Loan Amount,Loan Approval Date,Jobs Reported,Biz Type,TruePeopleSearch,Lawsuit Search,CourtListener";
  const rows = state.savedLeads.map(l => [
    `"${l.businessName}"`,`"${l.industry}"`,`"${l.address||''}"`,
    `"${l.city||''}"`,l.state||'',
    `"${l.phone||''}"`,`"${l.website||''}"`,
    `"${l.officerName||''}"`,`"${l.ownerPhone||''}"`,`"${l.ownerEmail||''}"`,`"${l.email||''}"`,`"${l.linkedIn||''}"`,
    l.score !== null ? l.score : '',
    l.businessAge !== null ? l.businessAge+' yr' : '',
    `"${l.companyStatus||''}"`,`"${l.incorporationDate||''}"`,
    `"${l.estimatedMonthlyRevenue||''}"`,
    `"${l.loanAmount ? '$'+l.loanAmount.toLocaleString() : ''}"`,
    `"${l.approvalDate||''}"`,l.jobsSupported||'',`"${l.bizType||''}"`,
    `"${l.truePeople||''}"`,
    `"${l.googleLawsuit||''}"`,`"${l.courtListener||''}"`
  ].join(','));
  const blob = new Blob([[hdr,...rows].join('\n')], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `mca-leads-${state.selectedState}-${Date.now()}.csv`;
  a.click();
}


async function checkSBA(leadId, retryCount = 0) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;
  setState({leads: state.leads.map(l => l.id === leadId ? {...l, sbaChecking: true} : l)});
  try {
    const params = new URLSearchParams({name: lead.businessName, state: lead.state || ''});
    const res = await fetch(`${PROXY_URL}/sba-lookup?${params}`, {headers: {'Authorization': 'Bearer ' + authToken}});
    const data = await res.json();
    // Retry on loading (202) OR unavailable (503) — SBA CSV just needs time to download
    if (data.status === 'loading' || data.status === 'unavailable') {
      if (retryCount < 10) {
        setState({leads: state.leads.map(l => l.id === leadId ? {...l, sbaChecking: true, sbaStatus: 'loading'} : l)});
        const delay = Math.min(4000 + retryCount * 3000, 20000); // 4s, 7s, 10s... up to 20s
        setTimeout(() => checkSBA(leadId, retryCount + 1), delay);
      } else {
        setState({leads: state.leads.map(l => l.id === leadId ? {...l, sbaChecking: false, sbaStatus: 'unavailable'} : l)});
      }
      return;
    }
    if (data.found) {
      setState({leads: state.leads.map(l => l.id === leadId ? {
        ...l,
        sbaChecking: false,
        sbaStatus: null,
        sbaFound: true,
        sbaData: data,
        estimatedMonthlyRevenue: '$' + (data.estMonthlyRevenue||0).toLocaleString(),
        loanAmount: data.loanAmount,
        approvalDate: data.approvalDate,
        lender: data.lender,
        jobsSupported: data.jobsSupported,
      } : l)});
    } else {
      setState({leads: state.leads.map(l => l.id === leadId ? {...l, sbaChecking: false, sbaStatus: null, sbaFound: false} : l)});
    }
  } catch(e) {
    console.error('checkSBA error:', e.message);
    setState({leads: state.leads.map(l => l.id === leadId ? {
      ...l, sbaChecking: false, sbaStatus: 'error', sbaFound: false
    } : l)});
  }
}
function setState(updates) {
  Object.assign(state, updates);
  render();
}

function showToast(msg, color = '#00cc66', duration = 4000) {
  const id = 'toast-' + Date.now();
  const el = document.createElement('div');
  el.id = id;
  el.textContent = msg;
  el.style.cssText = `position:fixed;bottom:24px;right:24px;background:#0a0a1a;color:${color};border:1px solid ${color}33;border-radius:8px;padding:12px 18px;font-family:'IBM Plex Mono',monospace;font-size:12px;z-index:9999;max-width:320px;box-shadow:0 4px 20px rgba(0,0,0,0.5);opacity:0;transition:opacity 0.2s`;
  document.body.appendChild(el);
  setTimeout(() => el.style.opacity = '1', 10);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, duration);
}

function ic(ind) { return IND_COLORS[ind] || {bg:'#0a0a1a',color:'#8888cc',border:'#1a1a3a'}; }

function renderLeadCard(lead, isSaved) {
  const expanded = state.expandedLead === lead.id;
  const c = ic(lead.industry);
  const phone = lead.phone || '';
  const truePeopleHref = phone ? `https://www.truepeoplesearch.com/results?phoneno=${phone.replace(/\D/g,'')}` : lead.truePeople;

  return `
  <div class="lead-card ${expanded ? 'expanded' : ''}" id="card-${lead.id}">
    <div style="padding:14px 16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
        <div style="flex:1">
          <div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:6px;font-family:'IBM Plex Sans',sans-serif">
            ${escHtml(lead.businessName)}
          </div>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <span class="tag" style="background:${c.bg};color:${c.color};border:1px solid ${c.border}">${escHtml(lead.industry)}</span>
            ${(() => { const ap = getFunderAppetite(lead.industry); return `<span class="tag" style="background:${ap.bg};color:${ap.color};border:1px solid ${ap.border};font-weight:700" title="${ap.tip}">${ap.label}</span>`; })()}
            ${lead.estimatedMonthlyRevenue ? `<span class="tag" style="background:#0a1a0a;color:#00cc44;border:1px solid #0a2a0a">~${lead.estimatedMonthlyRevenue}/mo (SBA est.)</span>` : ''}
            ${lead.sbaFound ? `<span class="tag" style="background:#0a0a20;color:#5577ff;border:1px solid #0a0a38">✅ SBA $${(lead.loanAmount||0).toLocaleString()}</span>` : ''}
            ${lead.sbaFound === false ? `<span class="tag" style="background:#0f0f0f;color:#3a3a5a;border:1px solid #1a1a2a">⚪ No SBA record</span>` : ''}
            ${lead.sbaChecking || lead.sbaStatus === 'loading' ? `<span class="tag" style="background:#0a0a1a;color:#4488ff;border:1px solid #1a1a3a">⏳ SBA loading...</span>` : ''}
            ${lead.sbaStatus === 'unavailable' ? `<span class="tag" style="background:#0f0a0a;color:#aa4444;border:1px solid #2a1010">⚠️ SBA unavailable</span>` : ''}
            ${lead.businessAge !== null ? `<span class="tag" style="background:#0a0a1a;color:#8899cc;border:1px solid #1a1a3a">${lead.businessAge >= 10 ? '🏛️' : lead.businessAge >= 5 ? '🏢' : '🆕'} ${lead.businessAge}yr</span>` : ''}
            ${esc(lead.officerName) ? `<span class="tag" style="background:#0d0a1a;color:#aa88ff;border:1px solid #2a1a4a">👤 ${escHtml(lead.officerName.split(' ').slice(0,3).join(' '))}</span>` : ''}
            ${lead.stackingRisk === 'high' ? `<span class="tag" style="background:#1a0408;color:#ff3355;border:1px solid #3a0818;font-weight:700">⚠️ HIGH STACK RISK</span>` : ''}
            ${lead.stackingRisk === 'medium' ? `<span class="tag" style="background:#1a0e00;color:#ff8833;border:1px solid #2a1800;font-weight:700">⚠️ STACK RISK</span>` : ''}
            ${lead.stackingRisk === 'none' ? `<span class="tag" style="background:#041a0e;color:#00cc66;border:1px solid #083020">✓ CLEAN</span>` : ''}
            ${lead.verified ? `<span class="tag" style="background:#081808;color:#33aa33;border:1px solid #0a2a0a">✓ REAL BIZ</span>` : ''}
            ${lead.enriched ? `<span class="tag" style="background:#180f00;color:#ff9933;border:1px solid #2a1800" title="${lead.enrichGains||''}">✓ ENRICHED${lead.enrichGains && lead.enrichGains !== 'ℹ️ No new data found' ? ' +' + (lead.enrichGains.match(/·/g)||[]).length + 1 + '' : ''}</span>` : ''}
            ${(state.leadNotes[lead.id] || lead.note) ? `<span class="tag" style="background:#1a1000;color:#cc8833;border:1px solid #2a1a00">📝 NOTE</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:6px;margin-left:12px;flex-shrink:0">
          ${!isSaved ? `<button onclick="enrichWithGoogle('${lead.id}')" title="${lead.enriched ? (lead.enrichGains||'Re-enrich') : 'Enrich: find phone, email, website'}" style="padding:6px 10px;background:${lead.enrichError ? '#1a0808' : lead.enriched ? '#0a1a0a' : '#0a1525'};color:${lead.enrichError ? '#ff4466' : lead.enriched ? '#33aa33' : '#4488ff'};border:1px solid ${lead.enrichError ? '#3a1020' : lead.enriched ? '#0a2a0a' : '#1a2a4a'};border-radius:6px;font-size:13px">${state.enriching === lead.id ? '<span class="spinner"></span>' : lead.enrichError ? '✗' : lead.enriched ? '✓' : '🔍'}</button>` : ''}
          ${!isSaved ? (() => {
            const ph = (lead.phone||'').replace(/\D/g,'');
            const tpPhone = ph ? `https://www.truepeoplesearch.com/results?phoneno=${ph}` : null;
            const tpName = lead.officerName ? `https://www.truepeoplesearch.com/results?name=${encodeURIComponent(lead.officerName)}&citystatezip=${encodeURIComponent(lead.state||'')}` : null;
            const href = tpPhone || tpName || null;
            const tip = tpPhone ? 'Reverse lookup business phone — may be owner cell' : tpName ? `Search owner by name: ${esc(lead.officerName)}` : 'Enrich first to get phone or officer name';
            if (!href) return `<button onclick="enrichWithGoogle('${lead.id}')" title="${tip}" style="padding:6px 10px;background:#0a0f1a;color:#4a5a7a;border:1px solid #1a1a2a;border-radius:6px;font-size:13px">👤</button>`;
            return `<a href="${href}" target="_blank" title="${tip}" style="padding:6px 10px;background:#0a1020;color:#4488ff;border:1px solid #1a2a4a;border-radius:6px;font-size:13px;text-decoration:none;display:inline-flex;align-items:center">👤</a>`;
          })() : ''}
          ${!isSaved && lead.sbaFound === undefined ? `<button onclick="${state.sbaReady ? "checkSBA('" + lead.id + "')" : ''}" title="${state.sbaReady ? 'Check SBA loan history' : 'SBA database loading — please wait...'}" style="padding:6px 10px;background:${state.sbaReady ? '#0a0a25' : '#0a0a18'};color:${state.sbaReady ? '#8866ff' : '#4a4a7a'};border:1px solid ${state.sbaReady ? '#1a1a4a' : '#141428'};border-radius:6px;font-size:11px;font-family:'IBM Plex Mono',monospace;font-weight:700;cursor:${state.sbaReady ? 'pointer' : 'not-allowed'}">${lead.sbaChecking ? '<span class="spinner"></span>' : state.sbaReady ? '📊 SBA' : '⏳ SBA'}</button>` : ''}
          ${!isSaved && (lead.stackingRisk === null || lead.stackingRisk === undefined || lead.stackingChecking) ? `<button onclick="checkStacking('${lead.id}')" title="Check MCA stacking risk" style="padding:6px 10px;background:#1a0408;color:#ff5577;border:1px solid #2a0818;border-radius:6px;font-size:11px;font-family:'IBM Plex Mono',monospace;font-weight:700">${lead.stackingChecking ? '<span class="spinner"></span>' : '⚠️'}</button>` : ''}
          ${!isSaved ? `<button onclick="saveLead(state.leads.find(l=>l.id==='${lead.id}'))" style="padding:6px 12px;background:#0a1a0a;color:#00cc44;border:1px solid #0a2a0a;border-radius:6px;font-size:11px">SAVE</button>` : ''}
          ${isSaved ? `<button onclick="removeSaved('${lead.id}')" style="padding:5px 10px;background:#1a0a0a;color:#ff5555;border:1px solid #2a0a0a;border-radius:6px;font-size:11px">✕</button>` : ''}
          <button onclick="toggleExpand('${lead.id}')" style="padding:6px 10px;background:#0f0f20;color:#7788aa;border:1px solid #1a1a35;border-radius:6px;font-size:12px">${expanded ? '▲' : '▼'}</button>
        </div>
      </div>
      ${(lead.ownerPhone || lead.ownerEmail || lead.officerName) ? `
      <div style="background:#080818;border:1px solid #1a0f30;border-radius:8px;padding:10px 14px;margin-bottom:8px;display:flex;flex-wrap:wrap;gap:10px;align-items:center">
        <span style="font-family:'IBM Plex Mono',monospace;font-size:9px;letter-spacing:0.12em;color:#6644aa;font-weight:700">👤 OWNER</span>
        ${esc(lead.officerName) ? '<span style="font-size:12px;color:#cc99ff;font-weight:600">' + escHtml(lead.officerName) + '</span>' : ''}
        ${lead.ownerPhone ? '<a href="tel:' + lead.ownerPhone.replace(/\D/g,'') + '" style="font-size:12px;color:#00e87a;font-weight:700;text-decoration:none;background:#041a0e;border:1px solid #00441a;border-radius:5px;padding:3px 9px">📱 ' + escHtml(lead.ownerPhone) + '</a>' : ''}
        ${lead.ownerEmail ? '<a href="mailto:' + lead.ownerEmail + '" style="font-size:11px;color:#66ccff;text-decoration:none;background:#060f20;border:1px solid #0f2060;border-radius:5px;padding:3px 9px">✉️ ' + escHtml(lead.ownerEmail) + '</a>' : ''}
        ${lead.linkedIn ? '<a href="' + lead.linkedIn + '" target="_blank" style="font-size:11px;color:#fff;text-decoration:none;background:#0a3060;border:1px solid #1060aa;border-radius:5px;padding:3px 9px;font-weight:700">in LinkedIn</a>' : ''}
        ${!lead.ownerPhone && !lead.ownerEmail ? '<span style="font-size:10px;color:#3a3a6a;font-style:italic">Click 🔍 Enrich to look up owner contact</span>' : ''}
      </div>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px 16px;font-size:11px">
        <div style="grid-column:1/-1"><span style="color:#3a3a6a">📍 </span><span style="color:#8888bb">${escHtml(lead.address || `${lead.city}, ${lead.state}`)}</span></div>
        ${esc(lead.phone) ? `<div><span style="color:#3a3a6a">📞 </span><span style="color:#aabbff;font-weight:600">${escHtml(lead.phone)}</span></div>` : ''}
        ${esc(lead.website) ? `<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap"><span style="color:#3a3a6a">🌐 </span><a href="${safeUrl(lead.website)}" target="_blank" style="color:#4488ff">${escHtml((lead.website||'').replace(/^https?:\/\/(www\.)?/,'').split('/')[0])}</a></div>` : ''}
        ${lead.email && lead.email !== lead.ownerEmail ? `<div><span style="color:#3a3a6a">✉️ </span><a href="mailto:${lead.email}" style="color:#44aaff">${escHtml(lead.email)}</a><span style="color:#2a2a4a;font-size:9px"> ${lead.emailSource === 'hunter' ? '(hunter)' : lead.emailSource === 'html-scrape' ? '(scraped)' : ''}</span></div>` : ''}
        ${lead.jobsSupported > 0 ? `<div><span style="color:#3a3a6a">👥 </span><span style="color:#6a6a9a">~${lead.jobsSupported} employees</span></div>` : ''}
        ${lead.bizType ? `<div><span style="color:#3a3a6a">🏢 </span><span style="color:#6a6a9a">${lead.bizType}</span></div>` : ''}
      </div>
    </div>
    ${expanded ? `
    <div style="border-top:1px solid #181830;background:#080812;padding:14px 16px">
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px">
        <div style="background:#0a0a1e;border:1px solid #181835;border-radius:8px;padding:12px">
          <div style="font-size:9px;color:#3a3a6a;letter-spacing:0.12em;margin-bottom:8px;font-weight:700">📊 BUSINESS INTEL</div>
          <div style="font-size:11px;color:#6a6a9a;line-height:2">
            ${lead.estimatedMonthlyRevenue ? `<div><span style="color:#4a4a7a">Est. Monthly Rev: </span><span style="color:#00cc44;font-weight:700">${lead.estimatedMonthlyRevenue}</span><span style="color:#3a3a5a;font-size:9px"> (from SBA loan)</span></div>` : ''}
            ${lead.sbaFound ? `
              <div><span style="color:#4a4a7a">SBA Loan: </span><span style="color:#5577ff;font-weight:700">$${(lead.loanAmount||0).toLocaleString()}</span></div>
              <div><span style="color:#4a4a7a">Approval Date: </span>${lead.approvalDate}</div>
              <div><span style="color:#4a4a7a">Lender: </span>${lead.lender||''}</div>
              <div><span style="color:#4a4a7a">Jobs Reported: </span>${lead.jobsSupported}</div>
            ` : lead.sbaFound === false ? `<div style="color:#3a3a5a">⚪ No SBA loan record found</div>` : `<div style="color:#4a4a6a">📊 Click SBA button to check loan history</div>`}
            ${lead.email ? `<div><span style="color:#4a4a7a">Email: </span><a href="mailto:${lead.email}" style="color:#44aaff">${lead.email}</a></div>` : `<div style="color:#3a3a5a;font-size:10px">📧 Click 🔍 Enrich to find email</div>`}
            ${lead.businessStatus ? `<div><span style="color:#4a4a7a">Status: </span><span style="color:${lead.businessStatus==='OPERATIONAL'?'#00cc66':'#ff4466'}">${lead.businessStatus}</span></div>` : ''}
            ${lead.stackingRisk ? `<div><span style="color:#4a4a7a">Stacking: </span><span style="color:${lead.stackingRisk==='none'?'#00cc66':lead.stackingRisk==='medium'?'#ff8833':'#ff3355'};font-weight:700">${lead.stackingRisk==='none'?'✅ Clean — no MCA cases found':lead.stackingRisk==='medium'?'⚠️ Moderate — '+lead.stackingCount+' MCA case(s) on record':'🚨 High Risk — '+lead.stackingCount+' cases — Do not submit'}</span></div>` : ''}
            ${esc(lead.officerName) ? `<div><span style="color:#4a4a7a">Officer: </span><span style="color:#aa88ff;font-weight:600">${escHtml(lead.officerName)}</span></div>` : ''}
            ${lead.incorporationDate ? `<div><span style="color:#4a4a7a">Incorporated: </span><span style="color:#8899cc">${lead.incorporationDate}${lead.businessAge ? ' ('+lead.businessAge+' years ago)' : ''}</span></div>` : ''}
            ${lead.companyStatus ? `<div><span style="color:#4a4a7a">Corp Status: </span><span style="color:${lead.companyStatus.toLowerCase().includes('active')?'#00cc66':'#ff4466'}">${escHtml(lead.companyStatus)}</span></div>` : ''}
          </div>
        </div>
        <div style="background:#080f08;border:1px solid #0a2a0a;border-radius:8px;padding:12px">
          <div style="font-size:9px;color:#1a4a1a;letter-spacing:0.12em;margin-bottom:8px;font-weight:700">👤 OWNER CONTACT</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${esc(lead.officerName) ? `<div style="font-size:12px;color:#cc99ff;font-weight:700;padding:4px 0">👤 ${escHtml(lead.officerName)}</div>` : ''}
            ${lead.ownerPhone ? `<a href="tel:${lead.ownerPhone.replace(/\D/g,'')}" class="link-btn" style="background:#041a0e;color:#00e87a;border:1px solid #00441a;font-weight:700">📱 ${escHtml(lead.ownerPhone)} <span style="font-size:9px;opacity:0.6">(verified cell)</span></a>` : ''}
            ${lead.ownerEmail ? `<a href="mailto:${lead.ownerEmail}" class="link-btn" style="background:#060f20;color:#66ccff;border:1px solid #0f2060">✉️ ${escHtml(lead.ownerEmail)} <span style="font-size:9px;opacity:0.6">(personal)</span></a>` : ''}
            ${lead.linkedIn ? `<a href="${safeUrl(lead.linkedIn)}" target="_blank" class="link-btn" style="background:#050f1a;color:#fff;border:1px solid #1060aa;font-weight:700">in LinkedIn Profile</a>` : (lead.officerName ? `<a href="https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(lead.officerName+' '+(lead.businessName||''))}" target="_blank" class="link-btn" style="background:#050f1a;color:#5599cc;border:1px solid #0a3060">in Search LinkedIn</a>` : '')}
            <a href="${lead.stateRegistry}" target="_blank" class="link-btn" style="background:#0f1f0f;color:#44cc44;border:1px solid #1a3a1a">🏛️ ${STATE_REGISTRY[lead.state]?.name || lead.state} Registry</a>
            ${!lead.ownerPhone && !lead.ownerEmail ? `<span style="color:#3a3a5a;font-size:10px;padding:4px 0;display:block">Click 🔍 Enrich to look up owner cell + email via PDL + Hunter.io</span>` : ''}
          </div>
        </div>
        <div style="background:#0a0a1e;border:1px solid #0a0a3a;border-radius:8px;padding:12px">
          <div style="font-size:9px;color:#2a2a6a;letter-spacing:0.12em;margin-bottom:8px;font-weight:700">📱 PEOPLE SEARCH</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${phone ? `<a href="https://www.truepeoplesearch.com/results?phoneno=${phone.replace(/\D/g,'')}" target="_blank" class="link-btn" style="background:#0f0f1f;color:#5588ff;border:1px solid #1a1a3a" title="Reverse lookup — may find owner cell">📞 Reverse Phone</a>` : ''}
            ${esc(lead.officerName) ? `<a href="https://www.truepeoplesearch.com/results?name=${encodeURIComponent(lead.officerName)}&citystatezip=${encodeURIComponent(lead.state||'')}" target="_blank" class="link-btn" style="background:#0f0f1f;color:#7799ff;border:1px solid #1a1a3a">👤 ${escHtml(lead.officerName)}</a>` : `<span style="color:#3a3a5a;font-size:10px;padding:4px 0;display:block">Enrich to get officer name</span>`}
            <a href="${lead.fastPeople}" target="_blank" class="link-btn" style="background:#0f0f1f;color:#7799ff;border:1px solid #1a1a3a">🔍 FastPeopleSearch</a>
            <a href="${lead.whitepages}" target="_blank" class="link-btn" style="background:#0f0f1f;color:#99aaff;border:1px solid #1a1a3a">📖 Whitepages</a>
          </div>
        </div>
      </div>
      <div style="background:#060a14;border:1px solid #0a1a30;border-radius:8px;padding:12px;margin-bottom:10px">
        <div style="font-size:9px;color:#1a3a6a;letter-spacing:0.12em;margin-bottom:10px;font-weight:700">🎯 DEAL INTELLIGENCE</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
          <div style="background:#0a0a1e;border:1px solid #1a1a3a;border-radius:6px;padding:10px">
            <div style="font-size:9px;color:#3a3a6a;letter-spacing:0.1em;margin-bottom:6px;font-weight:700">💰 EST. MONTHLY REVENUE</div>
            ${lead.estimatedMonthlyRevenue ? `<div style="color:#00cc66;font-weight:700;font-size:13px">${lead.estimatedMonthlyRevenue}/mo</div><div style="color:#3a3a5a;font-size:9px;margin-top:3px">from SBA loan data</div>` : `<div style="color:#3a3a5a;font-size:11px">Click 📊 SBA to estimate</div>`}
          </div>
          <div style="background:#0a0a1e;border:1px solid #1a1a3a;border-radius:6px;padding:10px">
            <div style="font-size:9px;color:#3a3a6a;letter-spacing:0.1em;margin-bottom:6px;font-weight:700">⚠️ STACKING RISK</div>
            ${lead.stackingRisk === 'none' ? `<div style="color:#00cc66;font-weight:700;font-size:12px">✅ Clean</div><div style="color:#3a3a5a;font-size:9px;margin-top:3px">No MCA cases found</div>` : lead.stackingRisk === 'medium' ? `<div style="color:#ffcc44;font-weight:700;font-size:12px">⚠️ Moderate</div><div style="color:#4a4a2a;font-size:9px;margin-top:3px">${lead.stackingCount} case(s) on record</div>` : lead.stackingRisk === 'high' ? `<div style="color:#ff3355;font-weight:700;font-size:12px">🚨 Do Not Submit</div><div style="color:#4a1a1a;font-size:9px;margin-top:3px">${lead.stackingCount} MCA cases</div>` : `<div style="color:#3a3a5a;font-size:11px">Click ⚠️ to check</div>`}
          </div>
          <div style="border:1px solid ${getFunderAppetite(lead.industry).border};border-radius:6px;padding:10px;background:${getFunderAppetite(lead.industry).bg}">
            <div style="font-size:9px;color:#3a3a6a;letter-spacing:0.1em;margin-bottom:6px;font-weight:700">🏦 FUNDER APPETITE</div>
            <div style="color:${getFunderAppetite(lead.industry).color};font-weight:700;font-size:12px">${getFunderAppetite(lead.industry).label}</div>
            <div style="color:#4a4a5a;font-size:9px;margin-top:3px">${getFunderAppetite(lead.industry).tip}</div>
          </div>
        </div>
      </div>
      <div style="background:#0f0808;border:1px solid #2a0a0a;border-radius:8px;padding:12px">
        <div style="font-size:9px;color:#4a1a1a;letter-spacing:0.12em;margin-bottom:8px;font-weight:700">⚖️ MCA LAWSUIT LOOKUP</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <a href="${lead.googleLawsuit}" target="_blank" style="padding:7px 14px;background:#1a0800;color:#ff7733;border:1px solid #2a1000;border-radius:5px;font-size:10px;font-family:'IBM Plex Mono',monospace;font-weight:700">🔍 Google Lawsuit</a>
          <a href="${lead.courtListener}" target="_blank" style="padding:7px 14px;background:#0a0820;color:#7788ff;border:1px solid #1a1a40;border-radius:5px;font-size:10px;font-family:'IBM Plex Mono',monospace;font-weight:700">⚖️ CourtListener</a>
          <a href="${lead.pacer}" target="_blank" style="padding:7px 14px;background:#080f08;color:#44cc66;border:1px solid #0a2a0a;border-radius:5px;font-size:10px;font-family:'IBM Plex Mono',monospace;font-weight:700">🏛️ PACER Federal</a>
        </div>
      </div>
      <div style="background:#0d0d0a;border:1px solid #2a2210;border-radius:8px;padding:12px;margin-top:10px">
        <div style="font-size:9px;color:#4a3a1a;letter-spacing:0.12em;margin-bottom:8px;font-weight:700">📝 CALL LOG / NOTES</div>
        <textarea
          placeholder="Add notes — who you spoke with, what was discussed, follow-up date..."
          onchange="saveLeadNote('${lead.id}', this.value)"
          style="width:100%;background:#0a0a08;border:1px solid #2a2210;border-radius:6px;padding:10px;color:#ccbb88;font-family:'IBM Plex Mono',monospace;font-size:11px;resize:vertical;min-height:72px;outline:none;box-sizing:border-box"
        >${escHtml(state.leadNotes[lead.id] || lead.note || '')}</textarea>
      </div>
    </div>` : ''}
  </div>`;
}

function toggleExpand(id) {
  setState({expandedLead: state.expandedLead === id ? null : id});
}

function escHtml(str) {
  return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
// Only allow http/https URLs in href attributes — blocks javascript: and data: XSS
function safeUrl(url) {
  if (!url) return '#';
  const s = String(url).trim();
  if (s.startsWith('http://') || s.startsWith('https://')) return s;
  if (s.startsWith('//')) return 'https:' + s;
  return '#'; // reject javascript:, data:, vbscript:, etc.
}

function renderAuth() {
  const isLogin = state.authView === 'login';
  if (state.authView === 'loading') {
    document.getElementById('app').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#07070f">
      <div style="text-align:center">
        <div class="big-spinner"></div>
        <div style="font-size:12px;color:#3a3a6a;letter-spacing:0.1em">LOADING RCN LEAD GEN...</div>
      </div>
    </div>`;
    return;
  }

  document.getElementById('app').innerHTML = `
  <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#07070f;padding:20px">
    <div style="width:100%;max-width:420px">
      <!-- Logo -->
      <div style="text-align:center;margin-bottom:40px">
        <div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:8px">
          <div style="width:8px;height:8px;border-radius:50%;background:#00ff88;box-shadow:0 0 12px #00ff88;animation:pulse 2s infinite"></div>
          <span style="font-size:20px;font-weight:700;letter-spacing:0.2em;color:#fff">RCN LEAD GEN</span>
        </div>
        <div style="font-size:10px;color:#3a3a6a;letter-spacing:0.14em">REAL-TIME BUSINESS INTELLIGENCE</div>
      </div>

      <!-- Card -->
      <div style="background:#0c0c1e;border:1px solid #1a1a35;border-radius:12px;padding:36px">
        <div style="font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;letter-spacing:0.08em">
          ${isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
        </div>
        <div style="font-size:11px;color:#4a4a7a;margin-bottom:28px">
          ${isLogin ? 'Enter your credentials to access the platform' : 'Start finding leads today'}
        </div>

        ${state.authError ? `<div style="padding:10px 14px;background:#1a0808;border:1px solid #3a0808;border-radius:6px;font-size:11px;color:#ff6666;margin-bottom:16px">${state.authError}</div>` : ''}

        <label style="display:block;font-size:10px;color:#6a6a9a;margin-bottom:6px;letter-spacing:0.1em">EMAIL</label>
        <input type="email" id="auth-email" placeholder="you@example.com" style="margin-bottom:16px" />

        <label style="display:block;font-size:10px;color:#6a6a9a;margin-bottom:6px;letter-spacing:0.1em">PASSWORD</label>
        <input type="password" id="auth-password" placeholder="••••••••" style="margin-bottom:24px" />

        <button onclick="handleAuth()" style="width:100%;padding:14px;background:linear-gradient(135deg,#1a44ff,#0022cc);color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:700;letter-spacing:0.1em;font-family:'IBM Plex Mono',monospace;cursor:pointer" ${state.authLoading ? 'disabled' : ''}>
          ${state.authLoading ? '<span class="spinner"></span> PLEASE WAIT...' : (isLogin ? 'SIGN IN →' : 'CREATE ACCOUNT →')}
        </button>

        <div style="text-align:center;margin-top:20px;font-size:11px;color:#3a3a6a">
          ${isLogin ? "Don't have an account?" : "Already have an account?"}
          <span onclick="setState({authView:'${isLogin ? 'signup' : 'login'}',authError:''})" style="color:#6699ff;cursor:pointer;margin-left:6px">
            ${isLogin ? 'Sign up' : 'Sign in'}
          </span>
        </div>
      </div>

      <div style="text-align:center;margin-top:24px;font-size:10px;color:#2a2a4a;letter-spacing:0.1em">
        RCN GROUP © 2026 · ALL RIGHTS RESERVED
      </div>
    </div>
  </div>`;

  // Enter key support
  setTimeout(() => {
    const pw = document.getElementById('auth-password');
    if (pw) pw.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
    const em = document.getElementById('auth-email');
    if (em) em.addEventListener('keydown', e => { if (e.key === 'Enter') handleAuth(); });
  }, 50);
}

async function handleAuth() {
  const email = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  if (!email || !password) { setState({authError: 'Please enter your email and password'}); return; }
  setState({authLoading: true, authError: ''});

  const endpoint = state.authView === 'login' ? '/auth/login' : '/auth/register';
  const data = await apiAuth(endpoint, {email, password});

  if (data.error) {
    setState({authLoading: false, authError: data.error});
    return;
  }

  authToken = data.token;
  currentUser = data.user;
  localStorage.setItem('rcn_token', authToken);
  setState({authView: 'app', authLoading: false, authError: ''});
  warmSBA(); // start warming SBA data immediately on login
}

function render() {
  if (state.authView !== 'app') { renderAuth(); return; }
  const filtered = state.leads.filter(l =>
    !state.searchQuery ||
    (l.businessName||'').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    (l.industry||'').toLowerCase().includes(state.searchQuery.toLowerCase()) ||
    (l.city||'').toLowerCase().includes(state.searchQuery.toLowerCase())
  );

  document.getElementById('app').innerHTML = `
  <!-- HEADER -->
  <div style="background:linear-gradient(180deg,#0c0c20 0%,#07070f 100%);border-bottom:1px solid #1a1a32;padding:18px 28px;display:flex;align-items:center;justify-content:space-between">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:3px">
        <div style="width:8px;height:8px;border-radius:50%;background:#00ff88;box-shadow:0 0 12px #00ff88;animation:pulse 2s infinite"></div>
        <span style="font-size:17px;font-weight:700;letter-spacing:0.2em;color:#fff;cursor:pointer" onclick="window.location.reload()" title="Refresh">RCN LEAD GEN</span>
        <span class="tag" style="background:#0a2a0a;color:#00cc44;border:1px solid #00441a;font-size:9px">POWERED BY RCN GROUP</span>
        ${state.sbaReady ? `<span class="tag" style="background:#041a0e;color:#00cc66;border:1px solid #083020;font-size:9px" title="${(state.sbaCount||0).toLocaleString()} loans indexed">✅ SBA READY${state.sbaCount ? ' · ' + Math.round(state.sbaCount/1000) + 'k records' : ''}</span>` : state.sbaError ? '<span class="tag" style="background:#1a0808;color:#ff4466;border:1px solid #3a0818;font-size:9px" title="' + (state.sbaError||'').substring(0,80) + '">⚠️ SBA ERROR</span>' : '<span class="tag" style="background:#0a0a1a;color:#4466aa;border:1px solid #1a1a3a;font-size:9px">⏳ SBA LOADING...</span>'}
      </div>
      <div style="font-size:10px;color:#3a3a6a;letter-spacing:0.1em;padding-left:18px">REAL-TIME BUSINESS INTELLIGENCE FOR MCA PROFESSIONALS</div>
    </div>
    <div style="display:flex;gap:24px;align-items:center">
      <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:#6699ff">${state.leads.length}</div><div style="font-size:9px;color:#3a3a6a;letter-spacing:0.1em">FOUND</div></div>
      <div style="text-align:center"><div style="font-size:22px;font-weight:700;color:#6699ff">${state.savedLeads.length}</div><div style="font-size:9px;color:#3a3a6a;letter-spacing:0.1em">SAVED</div></div>
      ${currentUser ? `
      <div style="border-left:1px solid #1a1a35;padding-left:24px;text-align:right">
        <div style="font-size:10px;color:#fff;font-weight:700;margin-bottom:3px">${(currentUser.name || currentUser.email).toUpperCase()}</div>
        <div style="font-size:9px;color:#3a3a6a">${currentUser.plan.toUpperCase()} · ${currentUser.searches_remaining === null ? '∞' : currentUser.searches_remaining} LEFT</div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:3px">
          <span style="font-size:9px;color:#6655bb;cursor:pointer" onclick="setState({activeTab:'profile'});loadProfile()">PROFILE</span>
          <span style="font-size:9px;color:#3366ff;cursor:pointer" onclick="logout()">SIGN OUT</span>
        </div>
      </div>` : ''}
    </div>
  </div>

  <!-- TABS -->
  <div style="border-bottom:1px solid #1a1a32;padding:0 28px;display:flex">
    <button class="tab ${state.activeTab==='generate'?'on':''}" onclick="setState({activeTab:'generate'})">⚡ FIND LEADS</button>
    <button class="tab ${state.activeTab==='saved'?'on':''}" onclick="setState({activeTab:'saved'})">💾 SAVED (${state.savedLeads.length})</button>
    <button class="tab ${state.activeTab==='history'?'on':''}" onclick="setState({activeTab:'history'})">🕐 HISTORY (${state.searchHistory.length})</button>
    <button class="tab ${state.activeTab==='profile'?'on':''}" onclick="setState({activeTab:'profile'});loadProfile()">👤 PROFILE</button>
    ${currentUser?.is_admin ? `<a href="/admin.html" style="margin-left:auto;padding:6px 14px;background:#1a0a2a;color:#aa66ff;border:1px solid #2a1a4a;border-radius:6px;font-size:10px;font-family:'IBM Plex Mono',monospace;font-weight:700;text-decoration:none;display:flex;align-items:center">🔐 ADMIN</a>` : ''}
  </div>

  <div style="padding:22px 28px;max-width:1400px;margin:0 auto">
    ${renderTabContent(filtered)}
  </div>`;
}

function renderTabContent(filtered) {
  if (state.activeTab === 'generate') { return `

    <div style="display:grid;grid-template-columns:270px 1fr;gap:20px">

      <!-- LEFT CONFIG -->
      <div style="display:flex;flex-direction:column;gap:14px">
        <div style="background:#0c0c1e;border:1px solid #1a1a35;border-radius:8px;padding:18px">
          <div style="font-size:10px;color:#3a3a6a;letter-spacing:0.14em;margin-bottom:14px">⚙️ SEARCH CONFIG</div>

          <label style="display:block;font-size:10px;color:#6a6a9a;margin-bottom:5px">STATE</label>
          <select onchange="setState({selectedState:this.value})" style="margin-bottom:10px">
            <option value="All States" ${state.selectedState==='All States'?'selected':''}>All States</option>
            ${Object.keys(STATE_REGISTRY).map(s => `<option value="${s}" ${state.selectedState===s?'selected':''}>${s}</option>`).join('')}
          </select>

          <label style="display:block;font-size:10px;color:#6a6a9a;margin-bottom:5px">CITY</label>
          <input placeholder="e.g. Miami, Atlanta..." value="${escHtml(state.selectedCity)}" oninput="state.selectedCity=this.value" style="margin-bottom:14px" />

          <label style="display:block;font-size:10px;color:#6a6a9a;margin-bottom:5px">LEADS TO FIND</label>
          <select onchange="state.maxLeads=Number(this.value)" style="margin-bottom:18px">
            ${[10,25,35,50,75,100].map(n => `<option value="${n}" ${state.maxLeads===n?'selected':''}>${n} leads</option>`).join('')}
          </select>

          <div onclick="setState({sbaOnly:!state.sbaOnly})" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;background:${state.sbaOnly?'#08082a':'#0a0a14'};border:1px solid ${state.sbaOnly?'#2244aa':'#1a1a2a'};border-radius:6px;margin-bottom:14px;user-select:none">
            <div style="width:28px;height:16px;border-radius:8px;background:${state.sbaOnly?'#2244ff':'#1a1a2a'};border:1px solid ${state.sbaOnly?'#4466ff':'#2a2a4a'};position:relative;flex-shrink:0">
              <div style="width:12px;height:12px;border-radius:50%;background:#fff;position:absolute;top:1px;left:${state.sbaOnly?'13px':'1px'};transition:left 0.15s"></div>
            </div>
            <span style="font-size:10px;color:${state.sbaOnly?'#6688ff':'#5a5a8a'};letter-spacing:0.08em;font-weight:700">SBA LOANS ONLY</span>
            ${state.sbaOnly ? '<span style="font-size:9px;color:#4466cc;margin-left:auto">📊 VERIFIED REVENUE</span>' : ''}
          </div>

          <button onclick="fetchLeads()" ${state.loading?'disabled':''} style="width:100%;padding:14px;font-size:13px;border-radius:6px;${state.loading?'background:#0c0c20;color:#2a2a5a;border:1px solid #1a1a38;cursor:not-allowed':'background:linear-gradient(135deg,#1a44ff,#0022cc);color:#fff;border:none'};font-family:'IBM Plex Mono',monospace;font-weight:700;letter-spacing:0.12em">
            ${state.loading ? '<span class="spinner"></span> SEARCHING...' : '⚡ FIND REAL LEADS'}
          </button>

          ${state.loading ? `
          <div style="margin-top:12px">
            <div style="font-size:10px;color:#4a4a7a;margin-bottom:6px">${state.loadingMsg}</div>
            <div style="height:3px;background:#1a1a35;border-radius:2px;overflow:hidden">
              <div style="height:100%;background:linear-gradient(90deg,#3366ff,#00ff88);width:${state.progress}%;transition:width 0.4s;border-radius:2px"></div>
            </div>
          </div>` : ''}

          ${!state.loading && state.loadingMsg && state.leads.length > 0 ? `<div style="margin-top:10px;font-size:10px;color:#00aa33">${state.loadingMsg}</div>` : ''}
          ${state.errorMsg ? `<div style="margin-top:10px;padding:10px;background:#1a0808;border:1px solid #3a0808;border-radius:6px;font-size:11px;color:#ff6666;line-height:1.5">${state.errorMsg}</div>` : ''}

          ${!state.loading && state.leads.length > 0 ? `
          <button onclick="enrichAll()" style="width:100%;padding:10px;font-size:11px;border-radius:6px;background:#0a1525;color:#4488ff;border:1px solid #1a2a4a;font-family:'IBM Plex Mono',monospace;font-weight:700;margin-top:10px">
            🔍 ENRICH ALL (Phone + Email)
          </button>` : ''}
        </div>

        <!-- INDUSTRIES -->
        <div style="background:#0c0c1e;border:1px solid #1a1a35;border-radius:8px;padding:18px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
            <div style="font-size:10px;color:#3a3a6a;letter-spacing:0.14em">🎯 INDUSTRIES</div>
            <div style="display:flex;gap:10px">
              <span style="font-size:10px;color:#3366ff;cursor:pointer" onclick="setState({selectedIndustries:[...ALL_INDUSTRIES]})">ALL</span>
              <span style="font-size:10px;color:#4a4a6a;cursor:pointer" onclick="setState({selectedIndustries:[]})">NONE</span>
            </div>
          </div>
          ${Object.entries(INDUSTRY_GROUPS).map(([group, inds]) => `
          <div style="margin-bottom:10px">
            <div style="font-size:10px;color:#4a4a7a;margin-bottom:4px;padding-left:4px">${group}</div>
            ${inds.map(ind => {
              const sel = state.selectedIndustries.includes(ind);
              const c = ic(ind);
              return `<div class="ind-row" onclick="toggleIndustry('${escHtml(ind)}')">
                <div style="width:13px;height:13px;border-radius:3px;border:2px solid ${sel?c.color:'#2a2a4a'};background:${sel?c.color:'transparent'};display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.15s">
                  ${sel ? '<span style="color:#000;font-size:9px;font-weight:700;line-height:1">✓</span>' : ''}
                </div>
                <span style="font-size:11px;color:${sel?c.color:'#4a4a6a'};transition:color 0.15s">${escHtml(ind)}</span>
              </div>`;
            }).join('')}
          </div>`).join('')}
        </div>

        <div style="background:#080f08;border:1px solid #0a2a0a;border-radius:8px;padding:14px;font-size:10px;color:#3a6a3a;line-height:1.9">
          <div style="color:#00bb33;font-weight:700;margin-bottom:6px">🤖 HOW IT WORKS</div>
          <div>1. Search our vast databases</div>
          <div>2. Returns real businesses instantly</div>
          <div>3. Phone + website powered by RCN</div>
          <div>4. 🔍 Enrich verifies with AI</div>
          <div>5. Lookup links for owner + lawsuits</div>
        </div>
      </div>

      <!-- RIGHT RESULTS -->
      <div>
        ${state.leads.length > 0 ? `
        <div style="display:flex;gap:10px;margin-bottom:14px;align-items:center">
          <input placeholder="🔍 Filter by name, city, industry..." value="${escHtml(state.searchQuery)}" oninput="setState({searchQuery:this.value})" style="flex:1" />
          <span style="font-size:11px;color:#4a4a7a;white-space:nowrap">${filtered.length} results</span>
          <button onclick="filtered.forEach(l=>saveLead(l))" style="padding:8px 14px;background:#0a1525;color:#4488ff;border:1px solid #1a2a4a;border-radius:6px;font-size:11px;font-family:'IBM Plex Mono',monospace;font-weight:700">SAVE ALL</button>
        </div>` : ''}

        ${!state.loading && state.leads.length === 0 && !state.errorMsg ? `
        <div style="text-align:center;padding:80px 40px;color:#1a1a3a;border:1px dashed #1a1a32;border-radius:12px">
          <div style="font-size:52px;margin-bottom:16px">🔍</div>
          <div style="font-size:14px;letter-spacing:0.12em;color:#2a2a5a">RCN POWERED LEAD SEARCH</div>
          <div style="font-size:11px;margin-top:10px;color:#1a1a3a;line-height:2.2">
            Real businesses · Real data
          </div>
        </div>` : ''}

        ${state.loading ? `
        <div style="text-align:center;padding:80px;color:#2a2a5a">
          <div class="big-spinner"></div>
          <div style="font-size:12px;letter-spacing:0.1em;margin-bottom:16px">${state.loadingMsg}</div>
          <div style="height:3px;background:#1a1a35;border-radius:2px;max-width:300px;margin:0 auto">
            <div style="height:100%;background:linear-gradient(90deg,#3366ff,#00ff88);width:${state.progress}%;transition:width 0.4s;border-radius:2px"></div>
          </div>
        </div>` : ''}

        ${filtered.map(lead => renderLeadCard(lead, false)).join('')}
      </div>
    </div>`; }
  if (state.activeTab === 'saved') { return `
    <div>
      <div style="display:flex;justify-content:space-between;margin-bottom:20px;align-items:center">
        <span style="font-size:12px;color:#4a4a7a">${state.savedLeads.length} saved leads</span>
        ${state.savedLeads.length > 0 ? `<button onclick="exportCSV()" style="padding:9px 20px;background:linear-gradient(135deg,#1a33aa,#001faa);color:#fff;border:none;border-radius:6px;font-size:12px;font-family:'IBM Plex Mono',monospace;font-weight:700">📥 EXPORT CSV</button>` : ''}
      </div>
      ${state.savedLeads.length === 0 ? `
      <div style="text-align:center;padding:80px;color:#1a1a3a;border:1px dashed #1a1a32;border-radius:12px">
        <div style="font-size:40px;margin-bottom:12px">💾</div>
        <div style="font-size:12px;letter-spacing:0.12em;color:#2a2a4a">NO SAVED LEADS YET</div>
      </div>` : ''}
      ${state.savedLeads.map(lead => renderLeadCard(lead, true)).join('')}
    </div>`; }
  if (state.activeTab === 'profile') { return renderProfile(); }
  return `
    <div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <span style="font-size:12px;color:#4a4a7a">${state.searchHistory.length} past searches</span>
        ${state.searchHistory.length > 0 ? `<button onclick="clearHistory()" style="padding:6px 14px;background:#1a0a0a;color:#ff4466;border:1px solid #3a1020;border-radius:6px;font-size:10px;font-family:'IBM Plex Mono',monospace">🗑 CLEAR HISTORY</button>` : ''}
      </div>
      ${state.searchHistory.length === 0 ? `
      <div style="text-align:center;padding:80px;color:#1a1a3a;border:1px dashed #1a1a32;border-radius:12px">
        <div style="font-size:40px;margin-bottom:12px">🕐</div>
        <div style="font-size:12px;letter-spacing:0.12em;color:#2a2a4a">NO SEARCH HISTORY YET</div>
        <div style="font-size:10px;color:#1a1a3a;margin-top:8px">Every search you run will be logged here</div>
      </div>` : ''}
      ${state.searchHistory.map(entry => {
        const d = new Date(entry.timestamp);
        const dateStr = d.toLocaleDateString('en-US', {month:'short',day:'numeric',year:'numeric'});
        const timeStr = d.toLocaleTimeString('en-US', {hour:'numeric',minute:'2-digit'});
        const isExpanded = state.historyExpanded === entry.id;
        const note = state.historyNote[entry.id] ?? entry.note ?? '';
        return `<div style="background:#0c0c1c;border:1px solid #1a1a32;border-radius:10px;margin-bottom:10px;overflow:hidden">
          <div style="padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer" onclick="setState({historyExpanded: state.historyExpanded==='${entry.id}' ? null : '${entry.id}'})">
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px;flex-wrap:wrap">
                <span style="font-size:12px;font-weight:700;color:#aabbff">${entry.city}, ${entry.state}</span>
                <span style="font-size:9px;color:#3a3a6a;background:#0a0a1a;padding:2px 8px;border-radius:3px;border:1px solid #1a1a2a">${entry.resultsCount} leads found</span>
                ${entry.note ? `<span style="font-size:9px;color:#cc8833;background:#1a1000;padding:2px 8px;border-radius:3px;border:1px solid #2a1a00">📝 NOTE</span>` : ''}
              </div>
              <div style="font-size:10px;color:#4a4a7a">${dateStr} at ${timeStr} &middot; ${entry.maxLeads} leads requested &middot; ${entry.industries.slice(0,3).join(', ')}${entry.industries.length > 3 ? ' +' + (entry.industries.length - 3) + ' more' : ''}</div>
            </div>
            <button onclick="event.stopPropagation();rerunSearch('${entry.id}')" style="padding:6px 12px;background:#0a1525;color:#4488ff;border:1px solid #1a2a4a;border-radius:6px;font-size:10px;font-family:'IBM Plex Mono',monospace;font-weight:700;white-space:nowrap;flex-shrink:0">▶ RE-RUN</button>
            <span style="color:#3a3a6a;font-size:12px;flex-shrink:0">${isExpanded ? '▲' : '▼'}</span>
          </div>
          ${isExpanded ? `
          <div style="border-top:1px solid #1a1a32;padding:14px 16px;background:#080812">
            <div style="font-size:9px;color:#3a3a6a;letter-spacing:0.12em;margin-bottom:8px;font-weight:700">📝 CALL LOG / NOTES</div>
            <textarea
              placeholder="Add notes — who you called, results, follow-ups, anything..."
              onchange="saveHistoryNote('${entry.id}', this.value)"
              style="width:100%;background:#0a0a1e;border:1px solid #1a1a35;border-radius:6px;padding:10px;color:#aabbff;font-family:'IBM Plex Mono',monospace;font-size:11px;resize:vertical;min-height:80px;outline:none;box-sizing:border-box"
            >${escHtml(note)}</textarea>
            <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap;font-size:10px;color:#3a3a6a">
              <div><span style="color:#4a4a7a">State: </span>${entry.state}</div>
              <div><span style="color:#4a4a7a">City: </span>${entry.city}</div>
              <div><span style="color:#4a4a7a">Leads requested: </span>${entry.maxLeads}</div>
              <div><span style="color:#4a4a7a">Results: </span>${entry.resultsCount}</div>
            </div>
            <div style="margin-top:6px;font-size:10px;color:#3a3a6a"><span style="color:#4a4a7a">Industries: </span>${entry.industries.join(', ')}</div>
          </div>` : ''}
        </div>`;
      }).join('')}
    </div>`; }

function renderProfile() {
  const u = currentUser || {};
  const planPrices = { pro: 499, agency: 899, unlimited: 2299 };
  const planPrice = planPrices[u.plan] || 0;
  const stripeNet = (planPrice * 0.971 - 0.30).toFixed(2);
  const planStart = u.plan_start_date ? new Date(u.plan_start_date) : null;
  const nextBill = planStart ? (() => {
    const d = new Date(); d.setDate(planStart.getDate());
    if (d <= new Date()) d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'});
  })() : 'Unknown';
  const memberSince = u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', {month:'long', year:'numeric'}) : 'Unknown';
  const refLink = u.referral_code ? `${window.location.origin}/?ref=${u.referral_code}` : '';

  if (state.profileEditing === 'name') return renderProfileEdit('name');
  if (state.profileEditing === 'email') return renderProfileEdit('email');
  if (state.profileEditing === 'password') return renderProfileEdit('password');

  return `<div style="max-width:720px;margin:0 auto">

    ${state.profileMsg ? `<div style="padding:10px 16px;border-radius:6px;margin-bottom:16px;font-size:11px;font-weight:700;letter-spacing:0.08em;background:${state.profileMsg.startsWith('✓') ? '#0a2a0a' : '#2a0a0a'};color:${state.profileMsg.startsWith('✓') ? '#00cc66' : '#ff4466'};border:1px solid ${state.profileMsg.startsWith('✓') ? '#0a4a0a' : '#4a0a0a'}">${state.profileMsg}</div>` : ''}

    <!-- Account Info -->
    <div style="background:#0c0c1c;border:1px solid #1a1a32;border-radius:10px;margin-bottom:12px">
      <div style="padding:16px 20px;border-bottom:1px solid #1a1a32;display:flex;justify-content:space-between;align-items:center">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.18em;color:#4a4a7a">👤 ACCOUNT INFORMATION</span>
        <span style="font-size:9px;color:#3a3a6a">Member since ${memberSince}</span>
      </div>
      <div style="padding:4px 0">
        <div style="padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #0f0f22">
          <div><div style="font-size:9px;color:#4a4a7a;margin-bottom:3px">DISPLAY NAME</div><div style="font-size:13px;color:#aabbff">${escHtml(u.name || '—')}</div></div>
          <button onclick="setState({profileEditing:'name',profileMsg:''})" style="padding:5px 12px;background:#0a1525;color:#4488ff;border:1px solid #1a2a4a;border-radius:5px;font-size:10px;font-family:'IBM Plex Mono',monospace">EDIT</button>
        </div>
        <div style="padding:12px 20px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #0f0f22">
          <div><div style="font-size:9px;color:#4a4a7a;margin-bottom:3px">EMAIL ADDRESS</div><div style="font-size:13px;color:#aabbff">${escHtml(u.email || '—')}</div></div>
          <button onclick="setState({profileEditing:'email',profileMsg:''})" style="padding:5px 12px;background:#0a1525;color:#4488ff;border:1px solid #1a2a4a;border-radius:5px;font-size:10px;font-family:'IBM Plex Mono',monospace">EDIT</button>
        </div>
        <div style="padding:12px 20px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:9px;color:#4a4a7a;margin-bottom:3px">PASSWORD</div><div style="font-size:13px;color:#aabbff">••••••••</div></div>
          <button onclick="setState({profileEditing:'password',profileMsg:''})" style="padding:5px 12px;background:#0a1525;color:#4488ff;border:1px solid #1a2a4a;border-radius:5px;font-size:10px;font-family:'IBM Plex Mono',monospace">CHANGE</button>
        </div>
      </div>
    </div>

    <!-- Billing Info -->
    <div style="background:#0c0c1c;border:1px solid #1a1a32;border-radius:10px;margin-bottom:12px">
      <div style="padding:16px 20px;border-bottom:1px solid #1a1a32">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.18em;color:#4a4a7a">💳 BILLING & PLAN</span>
      </div>
      <div style="padding:4px 0">
        <div style="padding:12px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #0f0f22">
          <div style="font-size:9px;color:#4a4a7a">CURRENT PLAN</div>
          <div style="font-size:12px;font-weight:700;color:${u.plan==='unlimited'?'#aa66ff':u.plan==='agency'?'#4488ff':'#00cc66'};letter-spacing:0.1em">${u.plan ? u.plan.toUpperCase() : '—'}</div>
        </div>
        <div style="padding:12px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #0f0f22">
          <div style="font-size:9px;color:#4a4a7a">MONTHLY RATE</div>
          <div style="font-size:12px;color:#aabbff">$${planPrice}/mo</div>
        </div>
        <div style="padding:12px 20px;display:flex;justify-content:space-between;border-bottom:1px solid #0f0f22">
          <div style="font-size:9px;color:#4a4a7a">NEXT BILLING DATE</div>
          <div style="font-size:12px;color:#aabbff">${nextBill}</div>
        </div>
        <div style="padding:12px 20px;display:flex;justify-content:space-between">
          <div style="font-size:9px;color:#4a4a7a">SEARCHES THIS MONTH</div>
          <div style="font-size:12px;color:#aabbff">${u.searches_used || 0} / ${u.limit === null ? '∞' : u.limit}</div>
        </div>
      </div>
    </div>

    <!-- Referral -->
    <div style="background:#0c0c1c;border:1px solid #1a1a32;border-radius:10px;margin-bottom:12px">
      <div style="padding:16px 20px;border-bottom:1px solid #1a1a32">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.18em;color:#4a4a7a">🔗 REFERRAL PROGRAM</span>
      </div>
      <div style="padding:16px 20px">
        <div style="font-size:10px;color:#5a5a8a;margin-bottom:12px">Share your unique referral link. Rewards are determined by RCN Group and applied to qualifying referrals.</div>
        <div style="font-size:9px;color:#4a4a7a;margin-bottom:6px">YOUR REFERRAL CODE</div>
        <div style="display:flex;gap:8px;align-items:center;margin-bottom:16px">
          <div style="flex:1;background:#080812;border:1px solid #1a1a35;border-radius:6px;padding:10px 14px;font-size:14px;font-weight:700;letter-spacing:0.2em;color:#aa66ff">${u.referral_code || '—'}</div>
          <button onclick="copyReferralCode()" style="padding:10px 16px;background:#150a30;color:#aa66ff;border:1px solid #2a1a50;border-radius:6px;font-size:10px;font-family:'IBM Plex Mono',monospace;font-weight:700">COPY CODE</button>
        </div>
        <div style="font-size:9px;color:#4a4a7a;margin-bottom:6px">SHAREABLE LINK</div>
        <div style="display:flex;gap:8px;align-items:center">
          <div style="flex:1;background:#080812;border:1px solid #1a1a35;border-radius:6px;padding:10px 14px;font-size:10px;color:#5588cc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${refLink}</div>
          <button onclick="copyReferralLink()" style="padding:10px 16px;background:#0a1525;color:#4488ff;border:1px solid #1a2a4a;border-radius:6px;font-size:10px;font-family:'IBM Plex Mono',monospace;font-weight:700">COPY LINK</button>
        </div>
        ${u.referral_count > 0 ? `<div style="margin-top:14px;padding:10px 14px;background:#0a1525;border:1px solid #1a2a4a;border-radius:6px;font-size:11px;color:#4488ff">✓ You have referred <strong>${u.referral_count}</strong> user${u.referral_count !== 1 ? 's' : ''}</div>` : ''}
      </div>
    </div>

    <!-- Danger zone -->
    <div style="background:#0c0a0a;border:1px solid #2a1a1a;border-radius:10px">
      <div style="padding:16px 20px;border-bottom:1px solid #2a1a1a">
        <span style="font-size:9px;font-weight:700;letter-spacing:0.18em;color:#5a2a2a">⚠️ ACCOUNT</span>
      </div>
      <div style="padding:16px 20px;display:flex;justify-content:space-between;align-items:center">
        <div>
          <div style="font-size:12px;color:#cc8888;margin-bottom:3px">Sign out of your account</div>
          <div style="font-size:10px;color:#4a3a3a">You will need to log back in to access your leads</div>
        </div>
        <button onclick="logout()" style="padding:8px 18px;background:#1a0a0a;color:#ff4466;border:1px solid #3a1020;border-radius:6px;font-size:11px;font-family:'IBM Plex Mono',monospace;font-weight:700">SIGN OUT</button>
      </div>
      <div style="padding:0 20px 16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #1a0a0a">
        <div>
          <div style="font-size:12px;color:#cc8888;margin-bottom:3px">Need help or want to cancel?</div>
          <div style="font-size:10px;color:#4a3a3a">Contact us and we'll sort it out</div>
        </div>
        <a href="mailto:support@thercngroup.com" style="padding:8px 18px;background:#1a0a0a;color:#ff8866;border:1px solid #3a2010;border-radius:6px;font-size:11px;font-family:'IBM Plex Mono',monospace;font-weight:700;text-decoration:none">CONTACT SUPPORT</a>
      </div>
    </div>
  </div>`;
}

function renderProfileEdit(field) {
  const labels = { name: 'DISPLAY NAME', email: 'EMAIL ADDRESS', password: 'CHANGE PASSWORD' };
  return `<div style="max-width:480px;margin:0 auto">
    <div style="background:#0c0c1c;border:1px solid #1a1a32;border-radius:10px;padding:24px">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.18em;color:#4a4a7a;margin-bottom:20px">✏️ EDIT ${labels[field]}</div>
      ${field === 'name' ? `
        <label style="font-size:9px;color:#4a4a7a;display:block;margin-bottom:6px">NEW NAME</label>
        <input id="edit-name" type="text" value="${escHtml(currentUser?.name||'')}" placeholder="Your name" style="width:100%;background:#080812;border:1px solid #1a1a35;border-radius:6px;padding:10px 14px;color:#aabbff;font-family:'IBM Plex Mono',monospace;font-size:13px;outline:none;margin-bottom:16px">
      ` : field === 'email' ? `
        <label style="font-size:9px;color:#4a4a7a;display:block;margin-bottom:6px">NEW EMAIL ADDRESS</label>
        <input id="edit-email" type="email" value="${escHtml(currentUser?.email||'')}" placeholder="email@example.com" style="width:100%;background:#080812;border:1px solid #1a1a35;border-radius:6px;padding:10px 14px;color:#aabbff;font-family:'IBM Plex Mono',monospace;font-size:13px;outline:none;margin-bottom:16px">
      ` : `
        <label style="font-size:9px;color:#4a4a7a;display:block;margin-bottom:6px">CURRENT PASSWORD</label>
        <input id="edit-current-pw" type="password" placeholder="Your current password" style="width:100%;background:#080812;border:1px solid #1a1a35;border-radius:6px;padding:10px 14px;color:#aabbff;font-family:'IBM Plex Mono',monospace;font-size:13px;outline:none;margin-bottom:12px">
        <label style="font-size:9px;color:#4a4a7a;display:block;margin-bottom:6px">NEW PASSWORD</label>
        <input id="edit-new-pw" type="password" placeholder="Min 8 characters" style="width:100%;background:#080812;border:1px solid #1a1a35;border-radius:6px;padding:10px 14px;color:#aabbff;font-family:'IBM Plex Mono',monospace;font-size:13px;outline:none;margin-bottom:16px">
      `}
      <div style="display:flex;gap:10px">
        <button onclick="saveProfileEdit('${field}')" style="flex:1;padding:10px;background:linear-gradient(135deg,#1a33aa,#0a2288);color:#fff;border:none;border-radius:6px;font-size:12px;font-family:'IBM Plex Mono',monospace;font-weight:700">SAVE CHANGES</button>
        <button onclick="setState({profileEditing:null,profileMsg:''})" style="padding:10px 16px;background:#0a0a1a;color:#4a4a7a;border:1px solid #1a1a32;border-radius:6px;font-size:12px;font-family:'IBM Plex Mono',monospace">CANCEL</button>
      </div>
    </div>
  </div>`;
}

async function loadProfile() {
  try {
    const res = await fetch(PROXY_URL + '/auth/me', { headers: { 'Authorization': 'Bearer ' + authToken } });
    const data = await res.json();
    if (data.user) { currentUser = data.user; render(); }
  } catch(e) {}
}

async function saveProfileEdit(field) {
  const body = {};
  if (field === 'name') {
    body.name = document.getElementById('edit-name')?.value || '';
  } else if (field === 'email') {
    body.email = document.getElementById('edit-email')?.value || '';
  } else {
    body.currentPassword = document.getElementById('edit-current-pw')?.value || '';
    body.newPassword = document.getElementById('edit-new-pw')?.value || '';
  }
  try {
    const res = await fetch(PROXY_URL + '/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + authToken },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.error) { setState({profileMsg: '✗ ' + data.error}); return; }
    currentUser = data.user;
    setState({profileEditing: null, profileMsg: '✓ ' + (field === 'password' ? 'Password changed successfully' : 'Profile updated successfully')});
  } catch(e) { setState({profileMsg: '✗ Network error, please try again'}); }
}

function copyReferralCode() {
  if (!currentUser?.referral_code) return;
  navigator.clipboard.writeText(currentUser.referral_code).then(() => setState({profileMsg: '✓ Referral code copied!'}));
}

function copyReferralLink() {
  if (!currentUser?.referral_code) return;
  const link = window.location.origin + '/?ref=' + currentUser.referral_code;
  navigator.clipboard.writeText(link).then(() => setState({profileMsg: '✓ Referral link copied!'}));
}

function toggleIndustry(ind) {
  const inds = state.selectedIndustries;
  setState({selectedIndustries: inds.includes(ind) ? inds.filter(i=>i!==ind) : [...inds, ind]});
}

function saveLeadNote(leadId, noteText) {
  const updatedNotes = {...state.leadNotes, [leadId]: noteText};
  localStorage.setItem('leadNotes', JSON.stringify(updatedNotes));
  // Update in active leads and saved leads so badge reflects immediately
  const updateLead = l => l.id === leadId ? {...l, note: noteText} : l;
  const updatedLeads = state.leads.map(updateLead);
  const updatedSaved = state.savedLeads.map(updateLead);
  localStorage.setItem('savedLeads', JSON.stringify(updatedSaved));
  setState({leadNotes: updatedNotes, leads: updatedLeads, savedLeads: updatedSaved});
}

function saveHistoryNote(entryId, noteText) {
  // Save note to in-memory state
  const updatedNote = {...state.historyNote, [entryId]: noteText};
  // Also persist to the history entry in localStorage
  const updatedHistory = state.searchHistory.map(e =>
    e.id === entryId ? {...e, note: noteText} : e
  );
  localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  setState({historyNote: updatedNote, searchHistory: updatedHistory});
}

function clearHistory() {
  if (!confirm('Clear all search history? This cannot be undone.')) return;
  localStorage.setItem('searchHistory', '[]');
  setState({searchHistory: [], historyNote: {}, historyExpanded: null});
}

function rerunSearch(entryId) {
  const entry = state.searchHistory.find(e => e.id === entryId);
  if (!entry) return;
  setState({
    activeTab: 'generate',
    selectedState: entry.state,
    selectedCity: entry.city === 'Statewide' ? '' : entry.city,
    selectedIndustries: entry.industries,
    maxLeads: entry.maxLeads,
  });
  // Small delay so state renders first, then auto-run
  setTimeout(() => fetchLeads(), 100);
}

// Initial render
render();

</script>
</body>
</html>
