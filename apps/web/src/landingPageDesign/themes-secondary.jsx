// Secondary-theme hero concept boards (warm, minimal, bold).
// Each shows palette + one hero-only mock.

const { warm: W, minimal: Mi, bold: B } = window.T;

function ThemePalette({ theme, swatches, dark }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
      {swatches.map(([hex, label]) => (
        <div key={label}>
          <div style={{ width: 50, height: 40, borderRadius: 6, background: hex, border: '1px solid rgba(0,0,0,0.08)' }} />
          <div style={{ fontSize: 9, fontFamily: 'ui-monospace, Menlo, monospace', color: dark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', marginTop: 4 }}>{label}</div>
        </div>
      ))}
    </div>
  );
}

function WarmHero() {
  return (
    <div style={{ background: W.bg, height: '100%', fontFamily: 'ui-serif, Georgia, serif', color: W.text, padding: '40px 48px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40, fontFamily: 'Inter, sans-serif', fontSize: 14 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 26, height: 26, borderRadius: 13, background: W.primary }} />
          <div style={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: 20 }}>Nofech</div>
        </div>
        <div style={{ padding: '10px 20px', background: W.primary, color: '#FFF8EE', borderRadius: 999, fontSize: 13 }}>Donate</div>
      </div>
      <ThemePalette theme="warm" swatches={[['#F7F1E8', 'bg'], ['#9A3B1D', 'primary'], ['#D7A046', 'accent'], ['#2B1F14', 'text']]} />
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.8, color: W.textMuted, marginBottom: 16 }}>Warm · earthy, human, inviting</div>
      <h1 style={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: 76, fontWeight: 500, lineHeight: 1, letterSpacing: -1.5, margin: 0, fontStyle: 'italic', maxWidth: 680 }}>
        Warmth, passed along.
      </h1>
      <p style={{ fontFamily: 'Inter, sans-serif', marginTop: 22, maxWidth: 480, color: W.textMuted, fontSize: 17, lineHeight: 1.55 }}>
        Three decades of serving families in our neighborhood, one shared meal at a time.
      </p>
      <div style={{ marginTop: 32, display: 'flex', gap: 12, fontFamily: 'Inter, sans-serif', fontSize: 15 }}>
        <div style={{ padding: '14px 26px', borderRadius: 14, background: W.primary, color: '#FFF8EE' }}>Donate now →</div>
        <div style={{ padding: '14px 26px', borderRadius: 14, border: `1px solid ${W.border}`, color: W.text, background: W.surface }}>Our story</div>
      </div>
      <div style={{ position: 'absolute', right: -60, bottom: -60, width: 360, height: 360, borderRadius: '50%', background: W.accent, opacity: 0.25, filter: 'blur(40px)' }} />
    </div>
  );
}

function MinimalHero() {
  return (
    <div style={{ background: Mi.bg, height: '100%', fontFamily: 'Inter, sans-serif', color: Mi.text, padding: '40px 56px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 56, fontSize: 13 }}>
        <div style={{ fontWeight: 600, letterSpacing: -0.2 }}>MERHAV&nbsp;&nbsp;/&nbsp;&nbsp;מרחב</div>
        <div style={{ textDecoration: 'underline' }}>Donate</div>
      </div>
      <ThemePalette theme="minimal" swatches={[['#FAFAFA', 'bg'], ['#FFFFFF', 'surface'], ['#0A0A0A', 'text'], ['#757575', 'muted']]} />
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.8, color: Mi.textMuted, marginBottom: 20 }}>Minimal · editorial, highbrow, quiet</div>
      <div style={{ borderTop: `1px solid ${Mi.border}`, paddingTop: 40 }}>
        <h1 style={{ fontFamily: 'ui-serif, Georgia, serif', fontSize: 88, fontWeight: 300, lineHeight: 0.98, letterSpacing: -2, margin: 0, maxWidth: 720 }}>
          A quiet kind of giving.
        </h1>
        <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, borderTop: `1px solid ${Mi.border}`, paddingTop: 24 }}>
          <p style={{ margin: 0, color: Mi.textMuted, fontSize: 15, lineHeight: 1.6 }}>An organization for the cultural life of the neighborhood. Founded 1994.</p>
          <div style={{ fontSize: 13, textAlign: 'right' }}>
            <div style={{ fontWeight: 500 }}>Donate →</div>
            <div style={{ marginTop: 6, color: Mi.textMuted }}>About</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoldHero() {
  return (
    <div style={{ background: B.bg, height: '100%', fontFamily: 'Inter, sans-serif', color: B.text, padding: '32px 40px', overflow: 'hidden', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, fontSize: 13 }}>
        <div style={{ fontWeight: 700, letterSpacing: -0.3, fontSize: 18 }}>KOL·קול</div>
        <div style={{ padding: '10px 18px', background: B.primary, color: B.bg, borderRadius: 999, fontWeight: 600 }}>Donate</div>
      </div>
      <ThemePalette theme="bold" dark swatches={[['#0E0E10', 'bg'], ['#17171A', 'surface'], ['#E8FF5A', 'primary'], ['#FF4D1F', 'accent']]} />
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.8, color: B.textMuted, marginBottom: 12 }}>Bold · activist, campaigning, confident</div>
      <h1 style={{
        fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 108, lineHeight: 0.88, letterSpacing: -3.5,
        margin: 0, maxWidth: 820,
      }}>
        Louder, <span style={{ color: B.primary, fontStyle: 'italic', fontWeight: 500 }}>together</span>.
      </h1>
      <p style={{ marginTop: 22, maxWidth: 480, color: B.textMuted, fontSize: 16, lineHeight: 1.5 }}>
        Ten years of community organizing. Zero corporate donors. Every voice counts &mdash; and every shekel is one more.
      </p>
      <div style={{ marginTop: 28, display: 'flex', gap: 10, fontSize: 15, fontWeight: 600 }}>
        <div style={{ padding: '16px 28px', background: B.primary, color: B.bg, borderRadius: 8 }}>Join the fight →</div>
        <div style={{ padding: '16px 28px', background: B.surface, color: B.text, borderRadius: 8, border: `1px solid ${B.border}` }}>Watch · 2 min</div>
      </div>
      <div style={{ position: 'absolute', right: 24, bottom: 24, padding: '10px 16px', background: B.accent, color: B.text, borderRadius: 6, fontSize: 12, fontWeight: 700, transform: 'rotate(-4deg)', letterSpacing: 0.6 }}>
        NOW
      </div>
    </div>
  );
}

Object.assign(window, { WarmHero, MinimalHero, BoldHero });
