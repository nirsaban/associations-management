// Modern theme — bottom half of sections: gallery, reviews, stats, cta_payment, join_us, faq, footer.

const { modern: Mb } = window.T;

// ─────────────────────────────────────────────────────────────
// 5. GALLERY — masonry preview
// ─────────────────────────────────────────────────────────────
function GallerySection({ count = 12 }) {
  // Masonry-ish staggered heights
  const heights = [220, 300, 180, 260, 240, 320, 200, 280, 220, 260, 300, 190, 240, 280, 220, 260, 320, 200, 260, 240, 300, 220, 280, 200, 260, 240, 300, 220, 260, 280];
  const cols = 4;
  const items = heights.slice(0, count);
  const columns = Array.from({ length: cols }, () => []);
  items.forEach((h, i) => columns[i % cols].push({ h, i }));
  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mb.textMuted, marginBottom: 14 }}>In the room</div>
          <h2 style={{ fontFamily: Mb.fontDisplay, fontSize: 56, lineHeight: 1.02, letterSpacing: -1, margin: 0, fontWeight: 400 }}>
            Moments, kept by the people in them.
          </h2>
        </div>
        <div style={{ fontSize: 13, color: Mb.textMuted }}>{count} photos · tap to enlarge</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
        {columns.map((col, ci) => (
          <div key={ci} style={{ display: 'grid', gap: 12 }}>
            {col.map(({ h, i }) => <ImgSlot key={i} w="100%" h={h} label={`photo ${i + 1}`} ratio="" round={10} />)}
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 6. REVIEWS
// ─────────────────────────────────────────────────────────────
const reviewCopy = [
  ['Ronit L.', 5, 'My son has been in the after-school program for two years. The tutors know him by name, know the subjects he struggles with, and know the kind of jokes he likes. That is what changes things.'],
  ['David K.', 5, 'I donate here because I can walk in, see the work, and leave with my hands full of vegetables for someone down the street.'],
  ['Miriam A.', 5, 'The summer camp was the first time my daughter went anywhere alone. She came back taller.'],
  ['Yossi T.', 4, 'A small team that does more than big ones I&rsquo;ve worked with.'],
];

function ReviewCard({ name, rating, body }) {
  return (
    <div style={{
      background: Mb.surface, border: `1px solid ${Mb.border}`,
      borderRadius: 18, padding: 26, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 220,
    }}>
      <div style={{ display: 'flex', gap: 2, color: Mb.primary }}>
        {[0, 1, 2, 3, 4].map(i => <span key={i}>{Icon.star(i < rating)}</span>)}
      </div>
      <p style={{ margin: 0, fontFamily: Mb.fontDisplay, fontSize: 22, lineHeight: 1.3, color: Mb.text, letterSpacing: -0.3 }} dangerouslySetInnerHTML={{ __html: `&ldquo;${body}&rdquo;` }} />
      <div style={{ marginTop: 'auto', fontSize: 13, color: Mb.textMuted }}>— {name}</div>
    </div>
  );
}

function ReviewsSection({ state = 'populated' }) {
  return (
    <Shell bg={Mb.raised}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mb.textMuted, marginBottom: 14 }}>In their words</div>
      <h2 style={{ fontFamily: Mb.fontDisplay, fontSize: 56, lineHeight: 1.02, letterSpacing: -1, margin: 0, fontWeight: 400, maxWidth: 680, marginBottom: 40 }}>
        The community, on the community.
      </h2>
      {state === 'empty' && (
        <div style={{
          padding: 60, background: Mb.surface, border: `1px dashed ${Mb.borderStrong}`, borderRadius: 18,
          textAlign: 'center', color: Mb.textMuted, fontSize: 15,
        }}>
          Be the first to leave a note. Approved reviews appear here.
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
            <Btn>Leave a review {Icon.arrow()}</Btn>
          </div>
        </div>
      )}
      {state === 'populated' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {reviewCopy.slice(0, 3).map((r, i) => <ReviewCard key={i} name={r[0]} rating={r[1]} body={r[2]} />)}
          </div>
          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <Btn variant="secondary">Leave your own review {Icon.plus()}</Btn>
          </div>
        </>
      )}
      {state === 'form' && (
        <div style={{ background: Mb.surface, border: `1px solid ${Mb.border}`, borderRadius: 18, padding: 32, maxWidth: 620 }}>
          <div style={{ fontFamily: Mb.fontDisplay, fontSize: 26, marginBottom: 18 }}>Leave a review</div>
          <div style={{ display: 'grid', gap: 14 }}>
            <Input label="Your name" placeholder="" />
            <div>
              <Label>Rating</Label>
              <div style={{ display: 'flex', gap: 4, color: Mb.primary, marginTop: 6 }}>
                {[0, 1, 2, 3, 4].map(i => <span key={i}>{Icon.star(i < 4, { width: 24, height: 24 })}</span>)}
              </div>
            </div>
            <Textarea label="Your review" rows={4} />
            <div style={{ marginTop: 6 }}><Btn>Submit for review</Btn></div>
            <div style={{ fontSize: 12, color: Mb.textMuted }}>Reviews appear after the organization approves them.</div>
          </div>
        </div>
      )}
    </Shell>
  );
}

// shared tiny form primitives
function Label({ children }) { return <div style={{ fontSize: 12, color: Mb.textMuted, textTransform: 'uppercase', letterSpacing: 1.3 }}>{children}</div>; }
function Input({ label, placeholder, value }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{
        marginTop: 6, background: Mb.bg, border: `1px solid ${Mb.border}`,
        borderRadius: 10, padding: '12px 14px', fontSize: 15, color: Mb.text, minHeight: 22,
      }}>{value || <span style={{ color: Mb.textMuted }}>{placeholder}</span>}</div>
    </div>
  );
}
function Textarea({ label, rows = 3 }) {
  return (
    <div>
      <Label>{label}</Label>
      <div style={{
        marginTop: 6, background: Mb.bg, border: `1px solid ${Mb.border}`,
        borderRadius: 10, padding: '12px 14px', fontSize: 15, color: Mb.textMuted,
        minHeight: rows * 22,
      }}>…</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 7. STATS
// ─────────────────────────────────────────────────────────────
function StatsSection() {
  const stats = [
    ['140', 'families served each week'],
    ['32', 'years in the neighborhood'],
    ['68%', 'of funding from local donors'],
    ['1,240', 'volunteer hours last year'],
  ];
  return (
    <Shell bg={Mb.text} style={{ color: '#F5F3EE' }}>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: 'rgba(245,243,238,0.55)', marginBottom: 24 }}>By the numbers</div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 40 }}>
        {stats.map(([n, l], i) => (
          <div key={i} style={{ borderTop: '1px solid rgba(245,243,238,0.15)', paddingTop: 22 }}>
            <div style={{ fontFamily: Mb.fontDisplay, fontSize: 84, lineHeight: 1, letterSpacing: -2, fontWeight: 400 }}>{n}</div>
            <div style={{ marginTop: 10, color: 'rgba(245,243,238,0.65)', fontSize: 15, maxWidth: 200, lineHeight: 1.5 }}>{l}</div>
          </div>
        ))}
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 8. CTA PAYMENT — the conversion engine
// ─────────────────────────────────────────────────────────────
function CtaPayment({ rtl = false, mobile = false }) {
  const head = rtl ? 'כל תרומה — ישירות לקהילה.' : 'Every shekel, straight to the work.';
  const sub = rtl
    ? 'תרומתכם עוברת דרך מערכת הסליקה המאובטחת של גידקום. עד 12 תשלומים ללא ריבית.'
    : 'Processed through our secure payment partner. Split into up to 12 monthly payments, no interest.';
  const amounts = ['₪100', '₪250', '₪500', '₪1,000', 'Other'];
  return (
    <Shell bg={Mb.primaryTint} pad={mobile ? '48px 22px' : '88px'}>
      <div style={{ direction: rtl ? 'rtl' : 'ltr', maxWidth: 960, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mb.primary, marginBottom: 18 }}>
          {rtl ? 'תרמו עכשיו' : 'Give now'}
        </div>
        <h2 style={{
          fontFamily: Mb.fontDisplay, fontSize: mobile ? 42 : 72, lineHeight: 1.02, letterSpacing: -1.2,
          margin: 0, fontWeight: 400, color: Mb.text, textWrap: 'balance',
        }}>{head}</h2>
        <p style={{ marginTop: 20, color: Mb.textMuted, fontSize: mobile ? 15 : 18, lineHeight: 1.55, maxWidth: 560, margin: '20px auto 0' }}>
          {sub}
        </p>

        {/* Amount chips */}
        <div style={{
          marginTop: 32, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10,
        }}>
          {amounts.map((a, i) => (
            <div key={a} style={{
              padding: '12px 22px', borderRadius: 999,
              background: i === 2 ? Mb.primary : Mb.surface,
              color: i === 2 ? '#fff' : Mb.text,
              border: `1px solid ${i === 2 ? Mb.primary : Mb.border}`,
              fontSize: 15, fontWeight: 500,
              boxShadow: i === 2 ? `0 10px 24px -10px ${Mb.shadowTint}` : 'none',
            }}>{a}</div>
          ))}
        </div>

        <div style={{ marginTop: 28, display: 'flex', flexDirection: mobile ? 'column' : 'row', gap: 12, justifyContent: 'center' }}>
          <Btn size="lg" style={mobile ? { width: '100%' } : {}}>
            {rtl ? 'תרמו ₪500' : 'Donate ₪500'} {Icon.arrow()}
          </Btn>
        </div>

        <div style={{ marginTop: 22, display: 'flex', gap: 18, justifyContent: 'center', color: Mb.textMuted, fontSize: 12, flexWrap: 'wrap' }}>
          <span>🔒 {rtl ? 'סליקה מאובטחת' : 'Secure checkout'}</span>
          <span>·</span>
          <span>{rtl ? 'עד 12 תשלומים' : 'Up to 12 installments'}</span>
          <span>·</span>
          <span>{rtl ? 'קבלה לפי סעיף 46' : 'Tax-receipt (§46) issued'}</span>
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 9. JOIN US — lead form
// ─────────────────────────────────────────────────────────────
function JoinUsSection({ state = 'default' }) {
  return (
    <Shell>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mb.textMuted, marginBottom: 14 }}>Join us</div>
          <h2 style={{ fontFamily: Mb.fontDisplay, fontSize: 56, lineHeight: 1.02, letterSpacing: -1, margin: 0, fontWeight: 400 }}>
            A seat at the table is always open.
          </h2>
          <p style={{ marginTop: 22, color: Mb.textMuted, fontSize: 16.5, lineHeight: 1.6, maxWidth: 480 }}>
            Volunteers, neighbors, students, grandmothers &mdash; if you&rsquo;d like to help, leave us a note and we&rsquo;ll be in touch within the week.
          </p>
        </div>
        <div style={{
          background: Mb.surface, border: `1px solid ${Mb.border}`, borderRadius: 20, padding: 32,
        }}>
          {state === 'success' ? (
            <div style={{ padding: '40px 16px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: Mb.primary, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
              </div>
              <div style={{ fontFamily: Mb.fontDisplay, fontSize: 28, marginBottom: 8 }}>Got it. Thank you.</div>
              <div style={{ color: Mb.textMuted, fontSize: 15 }}>We&rsquo;ll reach out to you within a few days.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              <Input label="Name" placeholder="Your name" />
              <Input label="Email" placeholder="you@example.com" />
              <Input label="Phone (optional)" placeholder="+972 …" />
              <Textarea label="A note (optional)" rows={3} />
              <div style={{ marginTop: 8 }}><Btn size="lg">Send {Icon.arrow()}</Btn></div>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 10. FAQ
// ─────────────────────────────────────────────────────────────
function FaqSection({ mode = 'collapsed' }) {
  const items = [
    ['Is my donation tax-deductible?', 'Yes. We are a registered §46 non-profit; a tax receipt is issued automatically after each donation.'],
    ['Can I donate anonymously?', 'Yes. Anonymous donations are welcome and are listed on our annual report without a name attached.'],
    ['How do you use the money?', 'Roughly 82% goes directly to programs; the remainder covers rent, utilities, and a part-time coordinator.'],
    ['How do I volunteer?', 'Use the form above or write to us. We run a short orientation at the start of every month.'],
    ['Do you accept in-kind donations?', 'We accept food, books, and seasonal clothing. Please message us before dropping items off.'],
  ];
  return (
    <Shell bg={Mb.raised}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 80 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mb.textMuted, marginBottom: 14 }}>Questions</div>
          <h2 style={{ fontFamily: Mb.fontDisplay, fontSize: 48, lineHeight: 1.02, letterSpacing: -0.8, margin: 0, fontWeight: 400 }}>
            The ones we&rsquo;re asked most.
          </h2>
        </div>
        <div style={{ display: 'grid', gap: 0, borderTop: `1px solid ${Mb.border}` }}>
          {items.map((it, i) => {
            const open = (mode === 'one-open' && i === 1) || mode === 'all-open';
            return (
              <div key={i} style={{ borderBottom: `1px solid ${Mb.border}`, padding: '22px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24 }}>
                  <div style={{ fontFamily: Mb.fontBody, fontSize: 19, fontWeight: 500, letterSpacing: -0.2 }}>{it[0]}</div>
                  <div style={{ color: Mb.textMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 280ms' }}>{Icon.chev()}</div>
                </div>
                {open && (
                  <div style={{ marginTop: 14, color: Mb.textMuted, fontSize: 15.5, lineHeight: 1.65, maxWidth: 620 }}>{it[1]}</div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 11. FOOTER
// ─────────────────────────────────────────────────────────────
function FooterSection() {
  return (
    <Shell bg={Mb.text} pad="60px 88px 32px" style={{ color: '#F5F3EE' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: Mb.primaryTint }} />
            <div style={{ fontFamily: Mb.fontDisplay, fontSize: 22 }}>Shorashim</div>
          </div>
          <div style={{ color: 'rgba(245,243,238,0.6)', fontSize: 14, lineHeight: 1.6, maxWidth: 360 }}>
            A community non-profit serving the families of our neighborhood since 1994.
          </div>
        </div>
        {[
          ['Visit', ['12 HaZayit St., Haifa', 'Sun–Thu, 9:00–17:00']],
          ['Contact', ['hello@shorashim.org', '+972 4 000 0000']],
          ['Follow', ['Instagram', 'Facebook', 'YouTube']],
        ].map(([t, list]) => (
          <div key={t}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, color: 'rgba(245,243,238,0.45)', marginBottom: 16 }}>{t}</div>
            <div style={{ display: 'grid', gap: 10, color: 'rgba(245,243,238,0.8)', fontSize: 14 }}>
              {list.map(x => <div key={x}>{x}</div>)}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 56, paddingTop: 22, borderTop: '1px solid rgba(245,243,238,0.12)', display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(245,243,238,0.55)' }}>
        <div>© 2026 עמותת שורשים לקהילה (ע.ר.) · Reg. No. 58-000-000-0 · Authorized under §46</div>
        <div>Built with Amutot</div>
      </div>
    </Shell>
  );
}

Object.assign(window, { GallerySection, ReviewsSection, StatsSection, CtaPayment, JoinUsSection, FaqSection, FooterSection });
