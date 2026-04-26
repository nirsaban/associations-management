// Reusable visual primitives used across the landing mocks.
// These are static visual representations — no interactive logic needed,
// since this is a design deliverable, not the final product.

const { modern: M } = window.T;

// Striped SVG placeholder — used wherever the admin will supply an image.
// Shows an aspect-ratio caption so Claude Code knows what slot it is.
function ImgSlot({ w, h, label, ratio = '16:9', tone = 'warm', round = M.radius?.lg ?? 14, style = {} }) {
  const bg = tone === 'warm' ? '#EDE7DB' : tone === 'dark' ? '#1f1d19' : '#E8E3D9';
  const stripe = tone === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const text = tone === 'dark' ? 'rgba(255,255,255,0.55)' : 'rgba(21,19,15,0.55)';
  return (
    <div style={{
      width: w, height: h, borderRadius: round, background: bg,
      backgroundImage: `repeating-linear-gradient(135deg, ${stripe} 0 1px, transparent 1px 12px)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      color: text, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, letterSpacing: 0.4,
      border: `1px solid ${tone === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(21,19,15,0.06)'}`,
      ...style,
    }}>
      <div style={{ textTransform: 'uppercase', opacity: 0.8 }}>{label || 'image slot'}</div>
      <div style={{ opacity: 0.55, marginTop: 4 }}>{ratio}</div>
    </div>
  );
}

function Btn({ children, variant = 'primary', size = 'md', style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: 8, fontFamily: M.fontBody || 'Inter, sans-serif',
    fontWeight: 500, letterSpacing: -0.1,
    borderRadius: 999, border: '1px solid transparent', cursor: 'pointer',
    transition: 'all 160ms cubic-bezier(.2,.7,.2,1)',
  };
  const sizes = {
    sm: { padding: '8px 16px', fontSize: 13 },
    md: { padding: '12px 22px', fontSize: 14.5 },
    lg: { padding: '16px 30px', fontSize: 16 },
  };
  const variants = {
    primary: {
      background: M.primary, color: '#fff',
      boxShadow: `0 1px 0 rgba(255,255,255,0.15) inset, 0 10px 24px -10px ${M.shadowTint}`,
    },
    secondary: {
      background: M.surface, color: M.text, border: `1px solid ${M.border}`,
    },
    ghost: {
      background: 'transparent', color: M.text,
    },
  };
  return <button style={{ ...base, ...sizes[size], ...variants[variant], ...style }}>{children}</button>;
}

// Thin glyph icons — hand-drawn SVG for small UI glyphs only (arrows, chevrons).
// These are NOT illustrations; they are affordances.
const Icon = {
  arrow: (p = {}) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  chev: (p = {}) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  ),
  star: (filled, p = {}) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" {...p}>
      <path d="M12 3l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 17l-5.6 3.2 1.5-6.3L3 9.6l6.4-.6L12 3z" />
    </svg>
  ),
  play: (p = {}) => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  ),
  plus: (p = {}) => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

// Subtle gradient mesh — used behind hero. Tinted by primary.
function GradientMesh({ primary = M.primary, style = {} }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      ...style,
    }}>
      <div style={{
        position: 'absolute', top: -120, right: -120, width: 520, height: 520,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${primary}28, transparent 60%)`,
        filter: 'blur(10px)',
      }} />
      <div style={{
        position: 'absolute', bottom: -140, left: -80, width: 480, height: 480,
        borderRadius: '50%',
        background: `radial-gradient(circle at 50% 50%, ${M.accent}18, transparent 60%)`,
        filter: 'blur(10px)',
      }} />
    </div>
  );
}

// Section shell — gives consistent padding inside an artboard.
function Shell({ children, pad = '80px 88px', bg = M.bg, style = {} }) {
  return (
    <div style={{
      background: bg, padding: pad, fontFamily: M.fontBody,
      color: M.text, ...style,
    }}>
      {children}
    </div>
  );
}

// Spec note — little caption stuck on an artboard to call out spec decisions.
function Note({ children, style = {} }) {
  return (
    <div style={{
      position: 'absolute', left: 16, bottom: 16, right: 16,
      background: 'rgba(21,19,15,0.82)', color: '#F5F3EE',
      padding: '8px 12px', borderRadius: 8, fontSize: 11,
      fontFamily: 'ui-monospace, Menlo, monospace', lineHeight: 1.45,
      zIndex: 3, ...style,
    }}>{children}</div>
  );
}

Object.assign(window, { ImgSlot, Btn, Icon, GradientMesh, Shell, Note });
