// Modern theme — top half of sections: nav, hero, video, about, activities.

const { modern: Mt } = window.T;

// Minimal top nav used in hero artboards to establish page chrome.
function TopNav({ rtl = false, org = 'Shorashim', compact = false }) {
  const rowStyle = {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    direction: rtl ? 'rtl' : 'ltr',
    padding: compact ? '14px 20px' : '22px 48px',
    fontFamily: Mt.fontBody, fontSize: 14,
  };
  const links = rtl ? ['אודות', 'פעילויות', 'גלריה', 'צרו קשר'] : ['About', 'Activities', 'Gallery', 'Contact'];
  return (
    <div style={rowStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 22, height: 22, borderRadius: 6, background: Mt.primary }} />
        <div style={{ fontFamily: Mt.fontDisplay, fontSize: 19, lineHeight: 1 }}>{org}</div>
      </div>
      {!compact && (
        <div style={{ display: 'flex', gap: 28, color: Mt.textMuted }}>
          {links.map(l => <span key={l}>{l}</span>)}
        </div>
      )}
      <Btn size="sm">{rtl ? 'תרמו כעת' : 'Donate'}</Btn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 1. HERO  — desktop (primary / modern)
// ─────────────────────────────────────────────────────────────
function HeroDesktop({ rtl = false, longHeadline = false }) {
  const headline = rtl
    ? (longHeadline
        ? 'בונים קהילה, צעד אחר צעד, שכונה אחר שכונה, עיר אחר עיר'
        : 'בונים קהילה יחד')
    : (longHeadline
        ? 'Building community, one neighborhood, one family, one shared evening at a time'
        : 'A quieter kind of giving');
  const sub = rtl
    ? 'תכניות חינוך, חונכות נוער והתנדבות למען הקהילה המקומית כבר שלושה עשורים.'
    : 'Mentorship, after-school programs, and food security for families in our community — funded by neighbors, for neighbors.';
  return (
    <div style={{ position: 'relative', height: '100%', background: Mt.bg, direction: rtl ? 'rtl' : 'ltr', overflow: 'hidden' }}>
      <GradientMesh />
      <TopNav rtl={rtl} />
      <div style={{ padding: rtl ? '40px 48px 0 48px' : '40px 48px 0 48px', position: 'relative' }}>
        <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mt.textMuted, marginBottom: 24 }}>
          {rtl ? 'עמותה רשומה · מס’ 58-000-000' : 'Registered non-profit · est. 1994'}
        </div>
        <h1 style={{
          fontFamily: Mt.fontDisplay, fontWeight: 400,
          fontSize: longHeadline ? 76 : 96, lineHeight: 0.98,
          letterSpacing: -1.6, margin: 0, maxWidth: 960,
          color: Mt.text, textWrap: 'balance',
        }}>{headline}</h1>
        <p style={{
          marginTop: 28, maxWidth: 560, fontSize: 18, lineHeight: 1.55,
          color: Mt.textMuted,
        }}>{sub}</p>
        <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
          <Btn size="lg">{rtl ? 'תרמו לקהילה' : 'Donate now'} {Icon.arrow()}</Btn>
          <Btn size="lg" variant="ghost">{rtl ? 'צפו בסיפור שלנו' : 'Watch our story'}</Btn>
        </div>
      </div>
      {/* full-bleed image band below hero */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 48px 32px' }}>
        <ImgSlot w="100%" h={240} label="hero visual · 21:9 or full-bleed" ratio="21:9" />
      </div>
    </div>
  );
}

// 1b. HERO — mobile
function HeroMobile({ rtl = false }) {
  return (
    <div style={{ position: 'relative', height: '100%', background: Mt.bg, direction: rtl ? 'rtl' : 'ltr', overflow: 'hidden' }}>
      <GradientMesh />
      <TopNav rtl={rtl} compact />
      <div style={{ padding: '16px 22px' }}>
        <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: Mt.textMuted, marginBottom: 14 }}>
          {rtl ? 'עמותה רשומה' : 'Registered non-profit'}
        </div>
        <h1 style={{
          fontFamily: Mt.fontDisplay, fontWeight: 400,
          fontSize: 46, lineHeight: 1, letterSpacing: -0.8,
          margin: 0, textWrap: 'balance',
        }}>{rtl ? 'בונים קהילה יחד' : 'A quieter kind of giving'}</h1>
        <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.5, color: Mt.textMuted }}>
          {rtl ? 'חונכות, חינוך והתנדבות למען הקהילה שלנו.' : 'Mentorship, programs, and food security for families in our community.'}
        </p>
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn size="lg" style={{ width: '100%' }}>{rtl ? 'תרמו לקהילה' : 'Donate now'} {Icon.arrow()}</Btn>
          <Btn size="md" variant="ghost">{rtl ? 'צפו בסיפור שלנו' : 'Watch our story'}</Btn>
        </div>
        <div style={{ marginTop: 22 }}>
          <ImgSlot w="100%" h={180} label="hero image" ratio="4:3" />
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 2. VIDEO section
// ─────────────────────────────────────────────────────────────
function VideoSection({ orient = '16:9' }) {
  const sizes = { '16:9': [720, 405], '9:16': [280, 498], '1:1': [460, 460] };
  const [w, h] = sizes[orient];
  return (
    <Shell>
      <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mt.textMuted, marginBottom: 14 }}>Our story</div>
      <h2 style={{ fontFamily: Mt.fontDisplay, fontSize: 56, lineHeight: 1.02, letterSpacing: -1, margin: 0, maxWidth: 700, fontWeight: 400 }}>
        The work, in the words of the families who lived it.
      </h2>
      <p style={{ marginTop: 18, color: Mt.textMuted, maxWidth: 560, fontSize: 16, lineHeight: 1.55 }}>
        A short film on our mentorship program, produced for the community with families who chose to share their journey.
      </p>

      <div style={{ marginTop: 40, display: 'flex', justifyContent: 'center' }}>
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', boxShadow: `0 30px 80px -20px ${Mt.shadowTint}` }}>
          <ImgSlot w={w} h={h} label={`video · ${orient}`} ratio={orient} round={16} />
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,255,255,0.92)', color: Mt.text,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
            }}>{Icon.play({ width: 26, height: 26 })}</div>
          </div>
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 3. ABOUT section — two-column
// ─────────────────────────────────────────────────────────────
function AboutSection() {
  return (
    <Shell>
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 80, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mt.textMuted, marginBottom: 14 }}>About us</div>
          <h2 style={{ fontFamily: Mt.fontDisplay, fontSize: 56, lineHeight: 1.02, letterSpacing: -1, margin: 0, fontWeight: 400, textWrap: 'balance' }}>
            Started at a kitchen table in 1994. Still run like one.
          </h2>
          <div style={{ marginTop: 32, display: 'grid', gap: 16, color: Mt.text, fontSize: 16.5, lineHeight: 1.65, maxWidth: 520 }}>
            <p style={{ margin: 0 }}>We began with four families, one shared meal a week, and a belief that neighbors know best what neighbors need.</p>
            <p style={{ margin: 0 }}>Three decades later we run after-school mentorship, a weekly food program, and a summer youth camp — but the shape of the work hasn&rsquo;t changed much. It&rsquo;s still about showing up, in the same rooms, with the same care.</p>
          </div>
          <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
            <Btn variant="secondary">Our history {Icon.arrow()}</Btn>
          </div>
        </div>
        <div>
          <ImgSlot w="100%" h={420} label="about image · 4:5 portrait" ratio="4:5" round={18} />
        </div>
      </div>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────
// 4. ACTIVITIES — card + grid at 3/6/12
// ─────────────────────────────────────────────────────────────
const activityCopy = [
  ['Youth mentorship', 'One-on-one pairings between high-schoolers and university volunteers, weekly for a full academic year.'],
  ['After-school program', 'A safe, warm room from 14:00 to 18:00 with tutoring, homework help, and a hot meal.'],
  ['Weekly food basket', 'Fresh produce and staples delivered to 140 families every Thursday, no paperwork, no questions.'],
  ['Summer camp', 'Ten days of hiking, music, and friendship for kids whose families can&rsquo;t otherwise send them.'],
  ['Community kitchen', 'Volunteers, students, and grandmothers cooking together for neighbors who need a meal.'],
  ['Holiday outreach', 'Gift and grocery drives before each major holiday, run entirely by our teen volunteer council.'],
  ['Adult education', 'Free Hebrew, English, and digital-literacy classes three evenings a week.'],
  ['Senior companionship', 'Weekly home visits to isolated seniors in our neighborhood.'],
  ['Emergency fund', 'Rapid, discreet grants to families facing a crisis — rent, medicine, an unexpected loss.'],
  ['Library corner', 'A small, borrowable library of Hebrew, Arabic, and English children&rsquo;s books.'],
  ['Volunteer training', 'Monthly orientation and supervision for new community volunteers.'],
  ['Advocacy & voice', 'Helping families navigate municipal services and rights they already have.'],
];

function ActivityCard({ title, body, index }) {
  return (
    <div style={{
      background: Mt.surface, border: `1px solid ${Mt.border}`, borderRadius: 18,
      padding: 22, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 280,
    }}>
      <ImgSlot w="100%" h={120} label={`activity ${index + 1}`} ratio="4:3" round={12} />
      <div>
        <div style={{ fontFamily: Mt.fontBody, fontSize: 18, lineHeight: 1.25, fontWeight: 500, letterSpacing: -0.3 }}>{title}</div>
        <div style={{ marginTop: 8, color: Mt.textMuted, fontSize: 14, lineHeight: 1.55 }} dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </div>
  );
}

function ActivitiesSection({ count = 6 }) {
  const items = activityCopy.slice(0, count);
  const cols = count <= 3 ? 3 : count <= 6 ? 3 : 4;
  return (
    <Shell bg={Mt.raised}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 40 }}>
        <div>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.8, color: Mt.textMuted, marginBottom: 14 }}>What we do</div>
          <h2 style={{ fontFamily: Mt.fontDisplay, fontSize: 56, lineHeight: 1.02, letterSpacing: -1, margin: 0, fontWeight: 400, maxWidth: 560 }}>
            {count} programs, running every week of the year.
          </h2>
        </div>
        <Btn variant="secondary">See all {Icon.arrow()}</Btn>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 20 }}>
        {items.map((it, i) => <ActivityCard key={i} title={it[0]} body={it[1]} index={i} />)}
      </div>
    </Shell>
  );
}

// Activities mobile — 1 column, stacked
function ActivitiesMobile() {
  const items = activityCopy.slice(0, 4);
  return (
    <Shell bg={Mt.raised} pad="40px 22px">
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.5, color: Mt.textMuted, marginBottom: 10 }}>What we do</div>
      <h2 style={{ fontFamily: Mt.fontDisplay, fontSize: 34, lineHeight: 1.02, letterSpacing: -0.6, margin: 0, fontWeight: 400 }}>4 programs every week.</h2>
      <div style={{ marginTop: 22, display: 'grid', gap: 14 }}>
        {items.map((it, i) => <ActivityCard key={i} title={it[0]} body={it[1]} index={i} />)}
      </div>
    </Shell>
  );
}

Object.assign(window, { HeroDesktop, HeroMobile, VideoSection, AboutSection, ActivitiesSection, ActivitiesMobile, TopNav });
