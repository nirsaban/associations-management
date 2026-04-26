// Token / color / type board artboard.

const { modern: Mb } = window.T;

function TokenBoard() {
  const neutrals = ['#FBFAF7', '#F5F3EE', '#EDE7DB', '#DFD8C7', '#C6BDA8', '#8E8676', '#6B645B', '#3F3B33', '#26231E', '#15130F'];
  const primaries = ['#E6EFEE', '#BFD6D4', '#89B2AE', '#55918C', '#2F5F5C', '#244845', '#163330'];
  const Swatch = ({ hex, label, dark }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ width: 72, height: 56, borderRadius: 8, background: hex, border: '1px solid rgba(0,0,0,.08)' }} />
      <div style={{ fontSize: 10, color: Mb.textMuted, fontFamily: 'ui-monospace, Menlo, monospace' }}>{label}</div>
      <div style={{ fontSize: 10, color: Mb.text, fontFamily: 'ui-monospace, Menlo, monospace' }}>{hex}</div>
    </div>
  );
  const Row = ({ title, children }) => (
    <div style={{ marginBottom: 32 }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: Mb.textMuted, marginBottom: 14 }}>{title}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{children}</div>
    </div>
  );
  return (
    <Shell pad="56px 64px" style={{ height: '100%' }}>
      <div style={{ fontFamily: Mb.fontDisplay, fontSize: 48, lineHeight: 1, marginBottom: 6 }}>Design tokens</div>
      <div style={{ color: Mb.textMuted, marginBottom: 40, maxWidth: 560 }}>
        Foundation for the Amutot landing page system. Every theme exposes the same semantic tokens; admin&rsquo;s primary/accent colors drive the tinted scales via oklch() mixing at build time.
      </div>

      <Row title="Neutral scale (50 → 900)">
        {neutrals.map((h, i) => <Swatch key={h} hex={h} label={`neutral-${[50, 100, 150, 200, 300, 500, 600, 700, 800, 900][i]}`} />)}
      </Row>

      <Row title="Primary scale — derived from admin input">
        {primaries.map((h, i) => <Swatch key={h} hex={h} label={`primary-${[50, 200, 300, 400, 500, 600, 700][i]}`} />)}
      </Row>

      <Row title="Semantic tokens">
        <Swatch hex={Mb.bg} label="bg" />
        <Swatch hex={Mb.surface} label="surface" />
        <Swatch hex={Mb.raised} label="surface-raised" />
        <Swatch hex={Mb.text} label="text" />
        <Swatch hex={Mb.textMuted} label="text-muted" />
        <Swatch hex={Mb.border} label="border" />
        <Swatch hex={Mb.borderStrong} label="border-strong" />
        <Swatch hex={Mb.accent} label="accent" />
      </Row>

      {/* Typography specimen */}
      <div style={{ marginTop: 12, borderTop: `1px solid ${Mb.border}`, paddingTop: 32 }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: Mb.textMuted, marginBottom: 22 }}>Type system</div>

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '18px 24px', alignItems: 'baseline' }}>
          <div style={{ fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace', color: Mb.textMuted }}>display/xl · serif</div>
          <div style={{ fontFamily: Mb.fontDisplay, fontSize: 64, lineHeight: 1.02, letterSpacing: -1.2 }}>A quiet place to give</div>

          <div style={{ fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace', color: Mb.textMuted }}>display/lg · serif</div>
          <div style={{ fontFamily: Mb.fontDisplay, fontSize: 44, lineHeight: 1.05, letterSpacing: -0.6 }}>מקום שקט לתרום ממנו</div>

          <div style={{ fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace', color: Mb.textMuted }}>title/md · sans</div>
          <div style={{ fontFamily: Mb.fontBody, fontSize: 24, lineHeight: 1.25, fontWeight: 500, letterSpacing: -0.3 }}>Section heading, humanist sans</div>

          <div style={{ fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace', color: Mb.textMuted }}>body/lg</div>
          <div style={{ fontFamily: Mb.fontBody, fontSize: 17, lineHeight: 1.55, color: Mb.text, maxWidth: 520 }}>Body copy is set in Inter for Latin and Heebo for Hebrew, matched on x-height. Line-length capped at 62ch on desktop.</div>

          <div style={{ fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace', color: Mb.textMuted }}>body/sm</div>
          <div style={{ fontFamily: Mb.fontBody, fontSize: 14, color: Mb.textMuted }}>Secondary copy, captions, legal footer line.</div>

          <div style={{ fontSize: 10, fontFamily: 'ui-monospace, Menlo, monospace', color: Mb.textMuted }}>label</div>
          <div style={{ fontFamily: Mb.fontBody, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: Mb.textMuted }}>Section eyebrow · 11/1.5 · tracked</div>
        </div>
      </div>

      {/* Spacing + radii + shadow */}
      <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: Mb.textMuted, marginBottom: 14 }}>Spacing · 8pt grid</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            {[4, 8, 12, 16, 24, 32, 48, 64, 96].map(n => (
              <div key={n} style={{ textAlign: 'center' }}>
                <div style={{ width: 20, height: n, background: Mb.primaryTint, border: `1px solid ${Mb.border}`, borderRadius: 3 }} />
                <div style={{ fontSize: 10, color: Mb.textMuted, marginTop: 4, fontFamily: 'ui-monospace, Menlo, monospace' }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: Mb.textMuted, marginBottom: 14 }}>Radii</div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            {[6, 10, 16, 24, 999].map(r => (
              <div key={r} style={{ width: 44, height: 44, background: Mb.surface, border: `1px solid ${Mb.border}`, borderRadius: r }} />
            ))}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: Mb.textMuted, marginBottom: 14 }}>Elevation</div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[0, 1, 2, 3, 4].map(e => (
              <div key={e} style={{
                width: 44, height: 44, background: Mb.surface, borderRadius: 10,
                boxShadow: [
                  'none',
                  '0 1px 2px rgba(21,19,15,0.04), 0 1px 1px rgba(21,19,15,0.03)',
                  '0 4px 10px -2px rgba(21,19,15,0.06), 0 2px 4px rgba(21,19,15,0.04)',
                  '0 12px 28px -8px rgba(21,19,15,0.12), 0 4px 8px rgba(21,19,15,0.04)',
                  `0 20px 50px -12px ${Mb.shadowTint}, 0 4px 10px rgba(21,19,15,0.05)`,
                ][e],
              }} />
            ))}
          </div>
        </div>
      </div>
    </Shell>
  );
}

window.TokenBoard = TokenBoard;
