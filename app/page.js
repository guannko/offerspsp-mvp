import './globals.css'

export default function Home() {
  return (
    <>
      <nav>
        <div className="container">
          <a href="/" className="nav-brand">OffersPSP</a>
          <div>
            <button className="btn-secondary" style={{marginRight: '1rem'}}>Sign In</button>
            <button>Get Started</button>
          </div>
        </div>
      </nav>

      <main className="container">
        <section className="hero fade-in">
          <h1>OffersPSP</h1>
          <p>Professional B2B platform connecting online casinos with payment solution providers</p>
          <div style={{display: 'flex', gap: '1rem', justifyContent: 'center'}}>
            <button>Submit Application</button>
            <button className="btn-secondary">Browse PSP Offers</button>
          </div>
        </section>

        <div className="features">
          <div className="feature fade-in">
            <div className="feature-icon">🎰</div>
            <h3>For Casinos</h3>
            <p>Find qualified PSP providers for your gaming platform with verified integrations and competitive rates.</p>
            <div className="badge">50+ PSPs Available</div>
          </div>

          <div className="feature fade-in">
            <div className="feature-icon">💳</div>
            <h3>For PSPs</h3>
            <p>Connect with verified online casino operators looking for reliable payment processing solutions.</p>
            <div className="badge">100+ Active Casinos</div>
          </div>

          <div className="feature fade-in">
            <div className="feature-icon">🤝</div>
            <h3>Secure Deals</h3>
            <p>Professional mediation and deal facilitation with transparent terms and automated matching.</p>
            <div className="badge">€10M+ Monthly Volume</div>
          </div>
        </div>

        <section className="card" style={{marginTop: '3rem'}}>
          <h2>Why Choose OffersPSP?</h2>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginTop: '2rem'}}>
            <div>
              <h3>✅ Verified Partners</h3>
              <p>All casinos and PSPs undergo thorough verification process</p>
            </div>
            <div>
              <h3>⚡ Real-time Matching</h3>
              <p>AI-powered system matches your requirements instantly</p>
            </div>
            <div>
              <h3>📊 Analytics Dashboard</h3>
              <p>Track performance, conversion rates, and revenue in real-time</p>
            </div>
            <div>
              <h3>🔒 Secure & Compliant</h3>
              <p>Full compliance with gambling regulations and data protection</p>
            </div>
          </div>
        </section>

        <section style={{textAlign: 'center', marginTop: '4rem', padding: '3rem', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(16, 185, 129, 0.1) 100%)', borderRadius: '12px'}}>
          <h2>Ready to Scale Your Business?</h2>
          <p style={{fontSize: '1.25rem', marginBottom: '2rem'}}>Join hundreds of casinos and PSPs already using OffersPSP</p>
          <button style={{fontSize: '1.25rem', padding: '1rem 3rem'}}>
            Start Free Trial →
          </button>
        </section>
      </main>
    </>
  );
}