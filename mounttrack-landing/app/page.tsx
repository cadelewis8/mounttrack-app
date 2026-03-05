export default function Home() {
  return (
    <main style={{ fontFamily: "'Georgia', serif", background: "#0d1117", color: "#e6edf3", minHeight: "100vh" }}>
      
      {/* NAV */}
      <nav style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 48px", borderBottom: "1px solid #21262d" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "24px" }}>🦌</span>
          <span style={{ fontSize: "20px", fontWeight: "bold", letterSpacing: "1px", color: "#e6edf3" }}>MountTrack</span>
        </div>
        <div style={{ display: "flex", gap: "32px", alignItems: "center", fontFamily: "sans-serif", fontSize: "14px" }}>
          <a href="#features" style={{ color: "#8b949e", textDecoration: "none" }}>Features</a>
          <a href="#pricing" style={{ color: "#8b949e", textDecoration: "none" }}>Pricing</a>
          <a href="#contact" style={{ color: "#8b949e", textDecoration: "none" }}>Contact</a>
          <a href="#" style={{ background: "#c9a84c", color: "#0d1117", padding: "8px 20px", borderRadius: "6px", textDecoration: "none", fontWeight: "bold" }}>Get Started</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ textAlign: "center", padding: "100px 48px 80px", maxWidth: "800px", margin: "0 auto" }}>
        <div style={{ display: "inline-block", background: "#21262d", border: "1px solid #30363d", borderRadius: "20px", padding: "6px 16px", fontSize: "13px", fontFamily: "sans-serif", color: "#c9a84c", marginBottom: "24px" }}>
          Built for taxidermy professionals
        </div>
        <h1 style={{ fontSize: "56px", lineHeight: "1.1", marginBottom: "24px", fontWeight: "normal" }}>
          Stop losing customers to <em style={{ color: "#c9a84c" }}>silence.</em>
        </h1>
        <p style={{ fontSize: "20px", color: "#8b949e", lineHeight: "1.6", fontFamily: "sans-serif", marginBottom: "40px" }}>
          MountTrack keeps your customers informed at every stage of their mount — automatically. No more phone tag. No more sticky notes. Just a professional shop that people trust and refer.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a href="#" style={{ background: "#c9a84c", color: "#0d1117", padding: "14px 32px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontFamily: "sans-serif", fontSize: "16px" }}>Start Free Trial</a>
          <a href="#features" style={{ background: "transparent", color: "#e6edf3", padding: "14px 32px", borderRadius: "8px", textDecoration: "none", fontFamily: "sans-serif", fontSize: "16px", border: "1px solid #30363d" }}>See How It Works</a>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section style={{ textAlign: "center", padding: "20px 48px 60px" }}>
        <p style={{ color: "#8b949e", fontFamily: "sans-serif", fontSize: "13px", marginBottom: "24px", letterSpacing: "1px", textTransform: "uppercase" }}>Trusted by taxidermy shops across the country</p>
        <div style={{ display: "flex", justifyContent: "center", gap: "48px", flexWrap: "wrap", color: "#30363d", fontFamily: "sans-serif", fontSize: "18px", fontWeight: "bold", letterSpacing: "2px" }}>
          <span>DEER · FISH · TURKEY · BEAR · EXOTIC</span>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding: "80px 48px", maxWidth: "1100px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: "36px", fontWeight: "normal", marginBottom: "16px" }}>Everything your shop needs</h2>
        <p style={{ textAlign: "center", color: "#8b949e", fontFamily: "sans-serif", marginBottom: "64px", fontSize: "16px" }}>Built by people who understand how a taxidermy shop actually operates.</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          {[
            { icon: "📋", title: "Job Intake in Seconds", desc: "Log a new animal in under 60 seconds. Customer info, animal type, mount style, deposit, photos — all in one place. Auto-assigns a job number so nothing gets mixed up." },
            { icon: "📊", title: "Visual Job Board", desc: "See every active mount on a Kanban board organized by stage. Drag jobs forward as you work. Rush flags and overdue alerts make sure nothing falls through the cracks." },
            { icon: "📱", title: "Customer Portal", desc: "Every customer gets a personal tracking link via text and email. They see their mount's progress on a clean visual timeline — no login required, works perfectly on any phone." },
            { icon: "💬", title: "Automatic Notifications", desc: "Every stage change fires a branded text and email to your customer. Your shop name, your logo — not MountTrack. It looks like you built it yourself." },
            { icon: "💳", title: "Payments Built In", desc: "Customers pay their balance online before pickup. Stripe handles everything securely. You see deposits, balances, and outstanding totals at a glance." },
            { icon: "📈", title: "Business Reports", desc: "Revenue by month, jobs by animal type, turnaround times, referral sources. Know your numbers without digging through notebooks or spreadsheets." },
          ].map((f, i) => (
            <div key={i} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "28px" }}>
              <div style={{ fontSize: "32px", marginBottom: "16px" }}>{f.icon}</div>
              <h3 style={{ fontSize: "18px", marginBottom: "12px", fontWeight: "normal" }}>{f.title}</h3>
              <p style={{ color: "#8b949e", fontFamily: "sans-serif", fontSize: "14px", lineHeight: "1.7" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: "80px 48px", background: "#161b22", borderTop: "1px solid #21262d", borderBottom: "1px solid #21262d" }}>
        <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "36px", fontWeight: "normal", marginBottom: "16px" }}>How it works</h2>
          <p style={{ color: "#8b949e", fontFamily: "sans-serif", marginBottom: "56px" }}>Simple enough for a one-person shop. Powerful enough for high-volume operations.</p>
        </div>
        <div style={{ maxWidth: "900px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0" }}>
          {[
            { step: "01", title: "Animal comes in", desc: "Log the job in 60 seconds. Customer gets an instant text with their tracking link." },
            { step: "02", title: "You get to work", desc: "Move jobs through your stages as you complete each step. Takes one click." },
            { step: "03", title: "Customer stays informed", desc: "They get automatic updates at every stage. Zero calls asking 'is it done yet?'" },
            { step: "04", title: "Ready for pickup", desc: "Customer gets the pickup notification and pays online. You both show up ready." },
          ].map((s, i) => (
            <div key={i} style={{ padding: "32px 24px", borderRight: i < 3 ? "1px solid #21262d" : "none", textAlign: "center" }}>
              <div style={{ fontSize: "40px", color: "#21262d", fontWeight: "bold", fontFamily: "monospace", marginBottom: "16px" }}>{s.step}</div>
              <h3 style={{ fontSize: "16px", marginBottom: "12px" }}>{s.title}</h3>
              <p style={{ color: "#8b949e", fontFamily: "sans-serif", fontSize: "14px", lineHeight: "1.6" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" style={{ padding: "80px 48px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
        <h2 style={{ fontSize: "36px", fontWeight: "normal", marginBottom: "16px" }}>Simple pricing</h2>
        <p style={{ color: "#8b949e", fontFamily: "sans-serif", marginBottom: "48px" }}>One plan. Everything included. No surprises.</p>
        <div style={{ background: "#161b22", border: "1px solid #c9a84c", borderRadius: "16px", padding: "48px" }}>
          <div style={{ fontSize: "14px", fontFamily: "sans-serif", color: "#c9a84c", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "16px" }}>Professional</div>
          <div style={{ fontSize: "56px", marginBottom: "8px" }}>$49<span style={{ fontSize: "20px", color: "#8b949e", fontFamily: "sans-serif" }}>/mo</span></div>
          <p style={{ color: "#8b949e", fontFamily: "sans-serif", marginBottom: "32px", fontSize: "14px" }}>30-day free trial · No credit card required</p>
          <div style={{ textAlign: "left", marginBottom: "36px" }}>
            {["Unlimited active jobs", "Unlimited customers", "Automatic SMS & email notifications", "Customer tracking portal", "Stripe payment processing", "Business reports & analytics", "Waitlist management", "Priority support"].map((item, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #21262d", fontFamily: "sans-serif", fontSize: "14px" }}>
                <span style={{ color: "#c9a84c" }}>✓</span> {item}
              </div>
            ))}
          </div>
          <a href="#" style={{ display: "block", background: "#c9a84c", color: "#0d1117", padding: "14px", borderRadius: "8px", textDecoration: "none", fontWeight: "bold", fontFamily: "sans-serif" }}>Start Free Trial</a>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" style={{ padding: "60px 48px", background: "#161b22", borderTop: "1px solid #21262d", textAlign: "center" }}>
        <h2 style={{ fontSize: "28px", fontWeight: "normal", marginBottom: "16px" }}>Questions? We're real people.</h2>
        <p style={{ color: "#8b949e", fontFamily: "sans-serif", marginBottom: "24px" }}>Reach out any time — we'll get back to you same day.</p>
        <a href="mailto:hello@mounttrack.com" style={{ color: "#c9a84c", fontFamily: "sans-serif", fontSize: "18px" }}>hello@mounttrack.com</a>
        <p style={{ color: "#8b949e", fontFamily: "sans-serif", fontSize: "13px", marginTop: "16px" }}>Clinton, SC · United States</p>
      </section>

      {/* FOOTER */}
      <footer style={{ padding: "32px 48px", borderTop: "1px solid #21262d", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>🦌</span>
          <span style={{ fontFamily: "sans-serif", fontSize: "14px", color: "#8b949e" }}>MountTrack · Job tracking for taxidermy professionals</span>
        </div>
        <div style={{ fontFamily: "sans-serif", fontSize: "13px", color: "#8b949e", display: "flex", gap: "24px" }}>
          <a href="#" style={{ color: "#8b949e", textDecoration: "none" }}>Privacy Policy</a>
          <a href="#" style={{ color: "#8b949e", textDecoration: "none" }}>Terms of Service</a>
        </div>
      </footer>

    </main>
  );
}

