const express = require('express');
const { generate: generatePersonas } = require('./generate-personas');
const path = require('path');
const { Pool } = require('pg');

const REPORT_SEED = {
  meta: { url: 'https://bexta-production.up.railway.app/', run_date: '2026-03-24', total_personas: 25, model: 'claude-sonnet-4-6' },
  summary: { converted: 5, dropped: 10, undecided: 10, conversion_rate: 20, avg_score: 5.1, total_personas: 25 },
  stage_dropoff: [
    { stage: 'Hero',         section: 's1', entered: 25, dropped: 2, drop_pct: 8,  main_reason: 'CLI terminal hero signals developer-only tool; non-tech users bounce immediately' },
    { stage: 'Comparison',   section: 's2', entered: 23, dropped: 1, drop_pct: 4,  main_reason: 'Impressive stats but users without SaaS context lose orientation' },
    { stage: 'Why',          section: 's3', entered: 22, dropped: 2, drop_pct: 9,  main_reason: 'No trust signals; EU and enterprise users notice missing Privacy Policy' },
    { stage: 'How it works', section: 's4', entered: 20, dropped: 2, drop_pct: 10, main_reason: '"5,000 agents" and "persona profiles" alienate low-tech comfort users' },
    { stage: 'Demo report',  section: 's6', entered: 18, dropped: 3, drop_pct: 17, main_reason: 'B2C SaaS-only demo; B2B, portfolio, and local biz users cannot project their use case' },
    { stage: 'CTA',          section: 's8', entered: 15, dropped: 0, drop_pct: 0,  main_reason: '5 converted; 10 undecided blocked by missing pricing clarity and GDPR concerns' },
  ],
  top_issues: [
    { priority: 'P1', title: 'Missing GDPR / Privacy Policy / Impressum', affected: 8, segments: ['German users', 'Enterprise buyers', 'EU professionals'], description: 'All German personas and enterprise buyers dropped immediately. No Privacy Policy, no GDPR statement, no Impressum (legally required in Germany). Biggest single drop driver.' },
    { priority: 'P1', title: 'Non-technical users alienated by CLI terminal hero', affected: 6, segments: ['Low tech comfort (1-4)', 'Non-SaaS use cases', 'Instagram/Friend discovery'], description: 'The terminal on the right of the hero signals "developer tool" to users who have never written code. Teachers, local business owners, bloggers, and creators bounce within 30 seconds.' },
    { priority: 'P1', title: 'Pricing is vague — $49 with no definition', affected: 9, segments: ['SaaS founders', 'Agency owners', 'Product managers'], description: '"Starts at $49" with no pricing page. No clarity on per-run vs per-month, no team plan, no enterprise option. Technically-minded users are stuck at undecided.' },
    { priority: 'P2', title: 'All demo examples are B2C SaaS — no B2B, portfolio, or e-commerce', affected: 7, segments: ['B2B PMs', 'E-commerce owners', 'Consultants', 'Designers'], description: 'The Lovable.dev demo shows a consumer app. Users with non-SaaS use cases (portfolio, local biz, B2B) cannot project their situation onto the demo.' },
    { priority: 'P2', title: 'CTA says "Test my product free" but leads to a waitlist', affected: 6, segments: ['High intent visitors', 'Mobile users', 'Instagram/PH discovery'], description: 'Users who are ready to try land on a waitlist with no timeline. Gap between "Test my product free" promise and "we\'ll be in touch" creates distrust.' },
    { priority: 'P3', title: 'No About page, company info, or contact', affected: 5, segments: ['Consultants', 'Agencies', 'Non-technical CEOs'], description: 'Footer only says "© 2026 Betax". No team, no company name, no contact email. Moderate trust concern for non-EU users who still want to know who they\'re dealing with.' },
  ],
  personas: [
    { id:1,  name:'Alex Chen',       age:31, location:'San Francisco, US', role:'Indie maker',          tech:8, channel:'Product Hunt',   use_case:'SaaS landing page',        outcome:'undecided', score:7, pre_expectation:'Probably another AI user testing tool — let\'s see if this one is actually different.',                        key_moment:'$49 vs $3,000+ comparison made me stop scrolling.',                                                              biggest_gap:'No pricing page — I don\'t know if $49 is per run, per month, or what.',                          thoughts:[{type:'norm',quote:'The comparison table is genuinely well-targeted — 28 min vs 2-4 weeks.'},{type:'warn',quote:'5,000 agents in 28 min sounds impressive but also sounds like demo-only magic.'},{type:'fail',quote:'No pricing page, no terms — polished MVP with no back-office yet.'}] },
    { id:2,  name:'Priya Patel',      age:26, location:'Bangalore, IN',     role:'Design student',       tech:4, channel:'Product Hunt',   use_case:'Portfolio site',           outcome:'undecided', score:5, pre_expectation:'Thought this would be a website grader or design tips tool.',                                              key_moment:'Persona selector in the demo — seeing Mei, Tyler, Ana made it feel real.',                            biggest_gap:'Product talks about "conversion rate" — I\'m not sure how that applies to freelance inquiries.',   thoughts:[{type:'norm',quote:'Oh, fake users who visit your site and tell you what they think — cute idea.'},{type:'warn',quote:'The CLI thing is a bit scary, am I supposed to run that myself?'},{type:'warn',quote:'It says free for first 50 teams but I\'m not a team, just one person with a portfolio.'}] },
    { id:3,  name:'Carlos Martinez',  age:42, location:'Mexico City, MX',   role:'Small business owner', tech:3, channel:'Friend',          use_case:'Local business website',   outcome:'dropped',   score:3, pre_expectation:'My friend said it would help me figure out why people visit my website but don\'t call.',             key_moment:'Headline landed — "they left at second 30" is exactly how I feel.',                                    biggest_gap:'Don\'t know what "5,000 persona agents" means. Product doesn\'t speak my language.',                thoughts:[{type:'norm',quote:'Someone visiting my site and not calling — yes, that\'s my exact problem.'},{type:'warn',quote:'5,000 persona agents... is this robots pretending to be people?'},{type:'fail',quote:'$49 but I don\'t know for what. And no phone number on this page.'}] },
    { id:4,  name:'Sophie Mueller',   age:29, location:'Berlin, DE',         role:'UX designer',          tech:7, channel:'LinkedIn',        use_case:'Design agency website',    outcome:'dropped',   score:5, pre_expectation:'A polished AI UX research tool I could pitch to clients.',                                             key_moment:'"Every way you test today is broken" — provocative and accurate.',                                     biggest_gap:'Zero Privacy Policy or GDPR. I cannot recommend this professionally.',                              thoughts:[{type:'norm',quote:'The comparison to recruiting real users is well-targeted — I\'ve sat in 3-week research sprints that cost €8K.'},{type:'warn',quote:'"Trained on 500+ B2C products" — what does that actually mean methodologically?'},{type:'fail',quote:'No Privacy Policy, no Impressum — immediate professional red flag.'}] },
    { id:5,  name:'Jordan Williams',  age:24, location:'Austin TX, US',      role:'Side project builder', tech:8, channel:'Product Hunt',   use_case:'Early-stage startup',      outcome:'converted', score:8, pre_expectation:'A fast way to sanity-check my landing page messaging without user interviews.',                         key_moment:'Step 02: "5,000 diverse persona agents trained on 500+ B2C products" — scale is exciting.',           biggest_gap:'No pricing page. Need to know if $49 per run or per month before getting hooked.',                 thoughts:[{type:'norm',quote:'betax run --url yourapp.com --agents 5000 — I\'m already imagining running this tonight.'},{type:'norm',quote:'P1 issues with client counts — exactly the output I\'d actually use.'},{type:'warn',quote:'"Free for first 50 teams" and 47 already there — am I getting access today?'}] },
    { id:6,  name:'Fatima Ibrahim',   age:35, location:'Lagos, NG',           role:'Blogger/writer',       tech:3, channel:'Instagram',       use_case:'Blog/content site',        outcome:'dropped',   score:4, pre_expectation:'A tool to help me understand why readers aren\'t clicking or subscribing.',                          key_moment:'"Friends & teammates (too polite)" — resonated immediately.',                                          biggest_gap:'Product is for websites selling something. I have a blog building an audience.',                    thoughts:[{type:'norm',quote:'"Friends being too polite" — my whole family says my blog is amazing and I still have 200 subscribers.'},{type:'warn',quote:'They keep saying "conversion rate" — is subscribing a conversion?'},{type:'fail',quote:'The black terminal screen is intimidating. It looks like something a programmer uses.'}] },
    { id:7,  name:'Thomas Brown',     age:54, location:'London, UK',          role:'VP Operations',        tech:4, channel:'Newsletter',      use_case:'Internal tool adoption',   outcome:'dropped',   score:2, pre_expectation:'Enterprise-grade tool to understand why staff aren\'t using our internal portal.',              key_moment:'Stats (100K+ sessions, 24 countries) felt credible — then I couldn\'t find any company info.',        biggest_gap:'No About page, no team, no privacy policy. Cannot authorise through procurement.',                 thoughts:[{type:'norm',quote:'We have an internal portal with 40% weekly active users and nobody can tell me why — I\'m listening.'},{type:'warn',quote:'$49 for something this powerful seems suspiciously cheap.'},{type:'fail',quote:'No Privacy Policy, no company name, no contact email — won\'t share a work URL with an anonymous service.'}] },
    { id:8,  name:'Mei Wang',         age:22, location:'Singapore',           role:'Student',              tech:5, channel:'Product Hunt',   use_case:'Student project site',     outcome:'undecided', score:5, pre_expectation:'Just curious — Product Hunt usually has interesting beta tools.',                                 key_moment:'Seeing "Mei, 21, SG" in the demo persona selector — weirdly personal.',                               biggest_gap:'$49 and "first 50 teams" — I\'m a student, not a team, with no budget.',                           thoughts:[{type:'norm',quote:'Wait there\'s literally a Mei from Singapore in the demo — kind of wild.'},{type:'warn',quote:'Will 5,000 AI personas crash my site? Will the school server detect bot traffic?'},{type:'warn',quote:'47 of 50 spots taken — is there even a spot left for me?'}] },
    { id:9,  name:'Lucas Santos',     age:33, location:'São Paulo, BR',       role:'E-commerce owner',     tech:5, channel:'Reddit',          use_case:'E-commerce product page',  outcome:'undecided', score:6, pre_expectation:'Tool that shows where users drop off and why — I need to know why people leave before paying.',    key_moment:'"Just paste URL" vs "Recruit/interview" — this is the level of effort I can actually do.',            biggest_gap:'Demo shows a software product (Lovable.dev). I sell physical products — does this translate?',    thoughts:[{type:'norm',quote:'The headline is painfully accurate — I have no idea what happens between add-to-cart and payment.'},{type:'warn',quote:'The demo is all about a software product — does this work on a Shopify store?'},{type:'warn',quote:'47/50 spots and no pricing for after the free period — what am I committing to?'}] },
    { id:10, name:'Emma Schmidt',     age:27, location:'Munich, DE',          role:'Marketing manager',    tech:6, channel:'Product Hunt',   use_case:'Marketing landing page',   outcome:'dropped',   score:5, pre_expectation:'Something actionable about why paid traffic isn\'t converting — faster than another analytics dashboard.', key_moment:'28 minutes for a full report — the number that made her stop scrolling.',                           biggest_gap:'No GDPR documentation. Running a company landing page through an unvetted AI needs legal clearance.', thoughts:[{type:'norm',quote:'28 minutes — fastest turnaround I\'ve seen on anything resembling user research.'},{type:'warn',quote:'Is the AI actually browsing the live page or just analysing HTML? That matters.'},{type:'fail',quote:'No GDPR notice — can\'t run a company landing page through this without legal sign-off.'}] },
    { id:11, name:'Arjun Singh',      age:28, location:'Hyderabad, IN',       role:'Full-stack developer', tech:9, channel:'Twitter/X',      use_case:'Developer tool page',      outcome:'undecided', score:6, pre_expectation:'Either genuine LLM persona simulation at scale, or a fancy GPT-4 wrapper with slick marketing.',       key_moment:'CLI command `betax run --url yourapp.com --agents 5000` in the hero — implies an actual CLI tool.',  biggest_gap:'No technical docs, no API reference. Zero explanation of how persona agents actually work.',        thoughts:[{type:'warn',quote:'Where\'s the docs? What\'s the output format? Is there a JSON report I can pipe somewhere?'},{type:'warn',quote:'"Trained on 500+ B2C products" — are these running actual browser sessions or GPT generating imaginary journeys?'},{type:'fail',quote:'No pricing, no docs, no API — this is clearly pre-launch waitlist bait.'}] },
    { id:12, name:'Camille Dubois',   age:31, location:'Paris, FR',           role:'Freelance designer',   tech:5, channel:'Instagram',       use_case:'Portfolio site',           outcome:'undecided', score:5, pre_expectation:'A tool to understand why potential clients visit my portfolio and don\'t reach out.',             key_moment:'Léa, 24, FR in the demo personas — weirdly personal and relevant.',                                   biggest_gap:'No Privacy Policy. AI "browsing" her portfolio and collecting data feels invasive without explanation.', thoughts:[{type:'norm',quote:'Fake users who visit your site and tell you what they think — kind of love that idea.'},{type:'warn',quote:'The black terminal screen is off-putting — the hero looks developer-y for "just paste URL".'},{type:'warn',quote:'"47 of 50 spots taken" — am I even going to get access or just giving them my email?'}] },
    { id:13, name:'Oliver Johnson',   age:45, location:'New York, US',        role:'CEO (non-technical)',  tech:4, channel:'Friend',          use_case:'SaaS landing page',        outcome:'dropped',   score:4, pre_expectation:'A service where someone actually looks at our site and gives advice.',                          key_moment:'"$3,000+ → $49" — immediately interesting, but also suspicious.',                                    biggest_gap:'No company info, no named customer testimonials. Not enough for a business decision.',               thoughts:[{type:'norm',quote:'If this gives me real insight into why people aren\'t signing up, $49 is nothing.'},{type:'warn',quote:'Notion, Stripe, Figma logos — are those actual customers or just examples?'},{type:'fail',quote:'I can\'t find who runs this company. Not putting our URL into a random black-box AI.'}] },
    { id:14, name:'Aisha Hassan',     age:23, location:'Nairobi, KE',         role:'Social media manager', tech:5, channel:'Instagram',       use_case:'Personal brand site',      outcome:'converted', score:7, pre_expectation:'A tool to understand if visitors to my personal brand site actually get what I do.',             key_moment:'"Friends & teammates (too polite)" — because followers always drop fire emojis but no one books.',   biggest_gap:'Product seems optimised for product landing pages — unsure how it handles a personal brand site.',  thoughts:[{type:'norm',quote:'The "too polite" part literally describes every time I post my website in my creator group chat.'},{type:'warn',quote:'5,000 personas sounds like a lot just for my personal site — is this overkill?'},{type:'warn',quote:'Only 3 spots left and "no credit card required" — signing up before I finish reading.'}] },
    { id:15, name:'Felix Wagner',     age:38, location:'Hamburg, DE',         role:'SaaS founder',         tech:8, channel:'Product Hunt',   use_case:'SaaS landing page',        outcome:'dropped',   score:5, pre_expectation:'Testing if AI personas can actually replace qualitative research or if this is hype.',          key_moment:'P1 issues with client counts in the demo — "52 clients" — closer to real research than expected.',   biggest_gap:'No Impressum, no Privacy Policy, no GDPR. Cannot use or recommend professionally in Germany.',      thoughts:[{type:'norm',quote:'P1 prioritization with client counts — something a junior PM would hand me after a research sprint.'},{type:'warn',quote:'Was Lovable.dev chosen because the result looks impressive? I\'d want to test against something I know.'},{type:'fail',quote:'No Impressum, no GDPR — a product promising to understand user behavior with zero data transparency.'}] },
    { id:16, name:'Taylor Davis',     age:26, location:'Seattle, US',         role:'Product manager',      tech:7, channel:'Product Hunt',   use_case:'B2B product demo page',    outcome:'undecided', score:6, pre_expectation:'Qualitative signal on our demo page without another round of customer interviews.',            key_moment:'"Inner monologues" as output — Hotjar tells me people click pricing and leave but not what they were thinking.', biggest_gap:'Demo personas are all consumer-facing. Need AI that simulates a 45yo IT director evaluating procurement software.', thoughts:[{type:'norm',quote:'"Inner monologues" is the thing that got me — quantitative data never tells me what people were actually thinking.'},{type:'warn',quote:'All personas look very consumer — can it simulate a B2B enterprise buyer evaluating software?'},{type:'warn',quote:'No pricing page — can\'t put "starts at $49" into a budget proposal.'}] },
    { id:17, name:'Ngozi Chidi',      age:29, location:'Abuja, NG',           role:'Content creator',      tech:4, channel:'YouTube',         use_case:'Newsletter signup page',   outcome:'converted', score:6, pre_expectation:'Tool that shows why people visit my newsletter page but don\'t subscribe.',                   key_moment:'"Friends & teammates (too polite)" — the most relatable pain point on the page.',                     biggest_gap:'Demo shows software product. Can\'t visualise what a report about a newsletter page would look like.', thoughts:[{type:'norm',quote:'Under 2% of people who visit my page subscribe and I have no idea why — very interested.'},{type:'warn',quote:'The demo is for something called Lovable.dev — what\'s that? Can\'t tell if my newsletter would get the same report.'},{type:'warn',quote:'"Just paste URL" sounds easy but then there\'s talk about agents and personas.'}] },
    { id:18, name:'Lena Fischer',     age:34, location:'Frankfurt, DE',       role:'Head of Growth',       tech:7, channel:'Slack',           use_case:'Marketing landing page',   outcome:'dropped',   score:4, pre_expectation:'Evaluating this methodically against our Hotjar and Mixpanel setup.',                        key_moment:'"GA & Hotjar tells WHERE not WHY" — framing she\'s been trying to articulate to her team for six months.', biggest_gap:'No Privacy Policy, no DPA, no GDPR. Cannot pilot this internally without legal sign-off.',         thoughts:[{type:'norm',quote:'"Where not why" for Hotjar — someone finally built the product that fills that gap, assuming it works.'},{type:'warn',quote:'100K sessions, 5,000 persona profiles — I want to know the methodology behind these.'},{type:'fail',quote:'No Privacy Policy, no DPA — can\'t run company data through this without compliance sign-off.'}] },
    { id:19, name:'Wei Zhang',        age:25, location:'Singapore',           role:'Frontend developer',   tech:8, channel:'Product Hunt',   use_case:'Side project',             outcome:'converted', score:6, pre_expectation:'Thinking about user testing on my side project without doing actual interviews.',          key_moment:'CLI command — started thinking about integrating with CI/CD and running on every deploy.',            biggest_gap:'No docs, no GitHub, no technical architecture. Can\'t evaluate if the implementation is solid.',   thoughts:[{type:'norm',quote:'If this is a real CLI I want to know what the --agents flag does and what the output format is.'},{type:'warn',quote:'"Trained on 500+ B2C products" — fine-tuned models or just system prompts with product descriptions?'},{type:'warn',quote:'No docs, no GitHub, no API reference — either not really a CLI or they just haven\'t built docs yet.'}] },
    { id:20, name:'Maria Garcia',     age:47, location:'Madrid, ES',          role:'Teacher',              tech:2, channel:'Friend',          use_case:'Just exploring',           outcome:'dropped',   score:1, pre_expectation:'My friend sent me this link and said it was interesting — just taking a look.',              key_moment:'The black terminal screen — looked like something from a hacker movie.',                              biggest_gap:'Everything. The product is built for people who have websites and understand jargon.',              thoughts:[{type:'warn',quote:'"Users left your site" makes sense, but then it talks about 5,000 agents — is agent a person or a computer?'},{type:'fail',quote:'That black screen with green text — is that something I\'m supposed to type? It\'s not for someone like me.'},{type:'fail',quote:'I don\'t have a website so none of this applies to me.'}] },
    { id:21, name:'Hassan Ali',       age:32, location:'Dubai, UAE',          role:'Consultant',           tech:6, channel:'LinkedIn',        use_case:'Personal brand site',      outcome:'undecided', score:5, pre_expectation:'Understanding why visitors to my consulting site aren\'t booking discovery calls.',         key_moment:'"18/100 conversion rate" in the demo — first concrete number that made the output feel real.',        biggest_gap:'Personas in demo are young and consumer-facing. I need ones that behave like senior executives.',   thoughts:[{type:'norm',quote:'The promise of understanding why visitors don\'t convert is exactly what I need.'},{type:'warn',quote:'Demo personas look quite young — I need ones that act like senior consultants or executives.'},{type:'warn',quote:'No pricing details and no information about who\'s behind this.'}] },
    { id:22, name:'Riley Anderson',   age:21, location:'Boston, US',          role:'Design student',       tech:5, channel:'Product Hunt',   use_case:'Portfolio site',           outcome:'converted', score:7, pre_expectation:'Product Hunt usually has cool beta tools — hoping for insight into why my portfolio gets views but no messages.', key_moment:'Persona selector in demo — different people react differently to the same page.',                     biggest_gap:'"First 50 teams" and scarcity counter — worried she\'s already too late.',                          thoughts:[{type:'norm',quote:'Basically showing how different types of people experience your site — like what we learn in UX class but automated.'},{type:'norm',quote:'"Inner monologue" — I never know if someone looks at my portfolio and thinks "too junior" or "what even is this".'},{type:'warn',quote:'47 of 50 spots taken — should I sign up right now before I finish reading?'}] },
    { id:23, name:'Rahul Kumar',      age:36, location:'Mumbai, IN',          role:'Product lead',         tech:8, channel:'Product Hunt',   use_case:'SaaS landing page',        outcome:'undecided', score:6, pre_expectation:'Evaluating if this is production-ready or just a demo wrapper.',                             key_moment:'P1/P2 prioritization with client counts — format a product team can actually act on.',                biggest_gap:'No process transparency. How are 5,000 personas constructed? How does agent behavior map to real users?', thoughts:[{type:'norm',quote:'P1/P2 output with issue severity and affected client counts — how I\'d want research packaged for an engineering sprint.'},{type:'warn',quote:'"500+ B2C products training data" — is my product category represented? FinTech SaaS ≠ consumer app.'},{type:'warn',quote:'No pricing page, no methodology doc, no team info — evaluating a product that might pivot before I finish onboarding.'}] },
    { id:24, name:'Léa Moreau',       age:24, location:'Lyon, FR',            role:'Copywriter',           tech:4, channel:'Instagram',       use_case:'Personal brand site',      outcome:'dropped',   score:4, pre_expectation:'Testing if my own copywriting on my site actually works on people, or if I\'m writing for myself.',  key_moment:'Headline — "They left at second 30" — evaluated the copy craft and found it sharp.',                  biggest_gap:'The page is doing heavy lifting to mask missing substance. She sees the gap between persuasion and proof.', thoughts:[{type:'norm',quote:'"They left at second 30" — whoever wrote this understands copy, which makes me trust the product more.'},{type:'warn',quote:'Notion and Stripe logos — if those are actual clients that should be stated clearly.'},{type:'fail',quote:'"47 teams on waitlist" and "no credit card required" — well-written but all persuasion and no proof.'}] },
    { id:25, name:'Blake Thompson',   age:39, location:'Chicago, US',         role:'Agency owner',         tech:6, channel:'Twitter/X',      use_case:'Marketing landing page',   outcome:'undecided', score:6, pre_expectation:'Something I can offer to clients as a fast research deliverable, or another AI toy.',          key_moment:'"$3,000+ → $49" — opportunity to increase margin or threat to my own pricing.',                      biggest_gap:'No white-label, no agency pricing, no bulk run pricing.',                                           thoughts:[{type:'norm',quote:'$49 for something that takes $3K to replicate — if quality is close I could massively increase my margin.'},{type:'warn',quote:'Logo ticker shows Notion and Stripe — are those actual customers or inspiration? Need real case studies.'},{type:'fail',quote:'No agency plan, no white-label, no volume pricing — model breaks down completely for 10 clients at once.'}] },
  ]
};

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function initDB() {
  if (!process.env.DATABASE_URL) {
    console.log('[DB] No DATABASE_URL — using memory fallback');
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS waitlist (
      id         SERIAL PRIMARY KEY,
      url        TEXT NOT NULL,
      email      TEXT,
      ip         TEXT,
      user_agent TEXT,
      referrer   TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id           SERIAL PRIMARY KEY,
      url          TEXT NOT NULL,
      run_date     DATE,
      model        TEXT,
      summary      JSONB,
      stage_dropoff JSONB,
      top_issues   JSONB,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS report_personas (
      id        SERIAL PRIMARY KEY,
      report_id INT REFERENCES reports(id) ON DELETE CASCADE,
      data      JSONB NOT NULL
    )
  `);

  // Seed report data once
  const { rows: existing } = await pool.query('SELECT id FROM reports LIMIT 1');
  if (existing.length === 0) {
    // Generate 500 diverse personas
    const personas500 = generatePersonas(500);
    const converted = personas500.filter(p => p.outcome === 'converted').length;
    const dropped   = personas500.filter(p => p.outcome === 'dropped').length;
    const undecided = personas500.filter(p => p.outcome === 'undecided').length;
    const avgScore  = Math.round(personas500.reduce((s,p) => s + p.score, 0) / personas500.length * 10) / 10;
    const convRate  = Math.round(converted / 500 * 100);
    const summary500 = { total_personas: 500, converted, dropped, undecided, conversion_rate: convRate, avg_score: avgScore };

    const { rows: [rep] } = await pool.query(
      `INSERT INTO reports (url, run_date, model, summary, stage_dropoff, top_issues)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      [REPORT_SEED.meta.url, REPORT_SEED.meta.run_date, REPORT_SEED.meta.model,
       JSON.stringify(summary500), JSON.stringify(REPORT_SEED.stage_dropoff), JSON.stringify(REPORT_SEED.top_issues)]
    );
    // Insert all 500 personas in batches
    const batchSize = 50;
    for (let i = 0; i < personas500.length; i += batchSize) {
      const batch = personas500.slice(i, i + batchSize);
      const vals = batch.map((p, j) => `($1, ${j+2})`).join(',');
      await pool.query(`INSERT INTO report_personas (report_id, data) VALUES ${vals}`, [rep.id, ...batch.map(p => JSON.stringify(p))]);
    }
    console.log(`[DB] Seeded report with ${personas500.length} personas`);
  }

  // Add email column if not exists (migration)
  await pool.query(`ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS email TEXT`).catch(() => {});
  console.log('[DB] tables ready');
}

const memoryList = [];

async function sendWelcomeEmail(email, url) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !email) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'Racoonn <admin@racoonn.me>',
        to: email,
        subject: "You're on the Racoonn waitlist 🦝",
        html: `<!DOCTYPE html><html><body style="margin:0;padding:40px 20px;font-family:-apple-system,sans-serif;background:#faf9f7;color:#1a1714">
          <div style="max-width:480px;margin:0 auto;background:#fff;border-radius:16px;padding:40px;box-shadow:0 2px 16px rgba(0,0,0,.06)">
            <div style="font-size:48px;text-align:center;margin-bottom:24px">🦝</div>
            <h1 style="font-size:24px;font-weight:900;margin:0 0 8px;color:#0f0d0b">You're on the list.</h1>
            <p style="font-size:15px;color:#6b6560;line-height:1.6;margin:0 0 24px">We received your submission for <strong style="color:#0f0d0b">${url}</strong>. We'll run 5,000 AI persona agents on it and send you the full report when it's ready.</p>
            <div style="background:#faf9f7;border-radius:10px;padding:16px 20px;margin-bottom:24px">
              <div style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9a9490;margin-bottom:8px">What happens next</div>
              <div style="font-size:14px;color:#4a4540;line-height:1.7">1. We'll notify you when we're ready to run your report<br/>2. You'll get a full breakdown of where users drop off and why<br/>3. Prioritized issues with affected visitor counts</div>
            </div>
            <p style="font-size:13px;color:#9a9490;margin:0">Built with 🦝 by the Racoonn team · <a href="https://racoonn.me" style="color:#ef6820;text-decoration:none">racoonn.me</a></p>
          </div>
        </body></html>`
      }),
    });
    console.log('[email] Welcome sent to', email);
  } catch(err) {
    console.error('[email] Failed:', err.message);
  }
}
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'betax-admin-2026';

function requireAdmin(req, res, next) {
  if (req.query.token !== ADMIN_TOKEN) {
    return res.status(401).send('Unauthorized');
  }
  next();
}

// ── Admin routes (before static) ──────────────────────────
app.use(express.json());

app.get('/admin', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/api/admin/waitlist', requireAdmin, async (req, res) => {
  if (process.env.DATABASE_URL) {
    const { rows } = await pool.query('SELECT * FROM waitlist ORDER BY created_at DESC');
    return res.json({ entries: rows, count: rows.length });
  }
  res.json({ entries: memoryList.slice().reverse(), count: memoryList.length });
});

app.get('/api/admin/reports', requireAdmin, async (req, res) => {
  if (process.env.DATABASE_URL) {
    const { rows } = await pool.query('SELECT id, url, run_date, model, summary, created_at FROM reports ORDER BY created_at DESC');
    return res.json(rows);
  }
  res.json([{ id:1, url: REPORT_SEED.meta.url, run_date: REPORT_SEED.meta.run_date, model: REPORT_SEED.meta.model, summary: REPORT_SEED.summary, created_at: REPORT_SEED.meta.run_date }]);
});

app.get('/api/admin/reports/:id', requireAdmin, async (req, res) => {
  if (process.env.DATABASE_URL) {
    const { rows: [report] } = await pool.query('SELECT * FROM reports WHERE id=$1', [req.params.id]);
    if (!report) return res.status(404).json({ error: 'Not found' });
    const { rows: pRows } = await pool.query('SELECT data FROM report_personas WHERE report_id=$1 ORDER BY id', [req.params.id]);
    return res.json({ ...report, personas: pRows.map(r => r.data) });
  }
  if (req.params.id === '1') {
    return res.json({
      id: 1, url: REPORT_SEED.meta.url, run_date: REPORT_SEED.meta.run_date, model: REPORT_SEED.meta.model,
      summary: REPORT_SEED.summary, stage_dropoff: REPORT_SEED.stage_dropoff, top_issues: REPORT_SEED.top_issues,
      personas: REPORT_SEED.personas
    });
  }
  res.status(404).json({ error: 'Not found' });
});


// ── PH Audit Report (fresh run 2026-03-25) ───────────────────────────────
const FRESH_PH_REPORT = {
  "meta": {
    "url": "https://racoonn.me/",
    "run_date": "2026-03-25",
    "total_personas": 20,
    "model": "claude-sonnet-4-6",
    "label": "Product Hunt Audience Audit — Fresh Run"
  },
  "summary": {
    "converted": 7,
    "dropped": 4,
    "undecided": 9,
    "conversion_rate": 35,
    "avg_score": 6.1
  },
  "top_issues": [
    {
      "priority": "P1",
      "title": "No pricing page — $49 still unexplained",
      "affected": 11,
      "segments": [
        "SaaS founders",
        "Product managers",
        "Agency owners",
        "Senior devs"
      ],
      "description": "\"Starts at $49\" appears in the comparison table but there is no pricing page. Users cannot tell if this is per-run, per-month, per-seat, or introductory. High-intent users get stuck at undecided."
    },
    {
      "priority": "P1",
      "title": "No Privacy Policy or GDPR documentation",
      "affected": 7,
      "segments": [
        "EU professionals",
        "Enterprise buyers",
        "Head of Growth",
        "Compliance-aware PMs"
      ],
      "description": "Zero legal documentation on the page or footer. European users and anyone working at a company with a legal/compliance team cannot share a company URL without a Privacy Policy and DPA."
    },
    {
      "priority": "P2",
      "title": "Footer still says \"Betax\" — brand inconsistency",
      "affected": 8,
      "segments": [
        "Detail-oriented users",
        "Developers",
        "Skeptics"
      ],
      "description": "The page header and hero say \"Racoonn\" but the footer copyright reads \"© 2026 Betax\". Breaks trust for skeptical users who notice the mismatch and wonder if it's unfinished or a rebranded pivot."
    },
    {
      "priority": "P2",
      "title": "How It Works improved but Step 04 feed needs \"your site\" framing",
      "affected": 6,
      "segments": [
        "Non-SaaS use cases",
        "E-commerce owners",
        "Portfolio sites",
        "Newsletter owners"
      ],
      "description": "The live agent feed (Mei → Pricing ✗) uses a generic SaaS product journey. Non-SaaS users can't project their own site into the visual. Needs \"your URL here\" framing or multi-category examples."
    },
    {
      "priority": "P2",
      "title": "CLI terminal in hero still signals \"developer-only\"",
      "affected": 5,
      "segments": [
        "Non-technical founders",
        "Designers",
        "Marketers",
        "Content creators"
      ],
      "description": "\"racoonn run --url yourapp.com --agents 5000\" next to \"Just paste a URL\" creates a contradiction. Non-technical users assume they need to run something in a terminal."
    },
    {
      "priority": "P3",
      "title": "No social proof beyond logo ticker",
      "affected": 5,
      "segments": [
        "Agency owners",
        "Senior PMs",
        "Skeptical founders"
      ],
      "description": "Notion/Stripe/Figma logos appear without context — are these customers or inspiration? No named testimonials, no case study, no quote from a real user. High-intent buyers want proof."
    }
  ],
  "personas": [
    {
      "id": 1,
      "name": "Alex Chen",
      "age": 32,
      "location": "San Francisco, US",
      "role": "Indie maker",
      "tech": 8,
      "channel": "Product Hunt",
      "use_case": "SaaS landing page",
      "outcome": "undecided",
      "score": 7,
      "pre_expectation": "Seen this category before — curious if Racoonn is actually differentiated.",
      "key_moment": "The 5-step How It Works panel finally explains the process — persona grid + intent table is the most transparent I've seen in this space.",
      "biggest_gap": "Still no pricing page. I need per-run vs subscription clarity before I can estimate ROI.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "\"They left at second 30\" — whoever wrote this knows indie hacker pain."
        },
        {
          "type": "norm",
          "quote": "Step 03 intent table (Skeptic / Comparing / Ready to buy / Browsing) — this is how I think about my own users."
        },
        {
          "type": "warn",
          "quote": "Footer says Betax. Is this a rebranded product? What happened to Betax?"
        }
      ]
    },
    {
      "id": 2,
      "name": "Priya Sharma",
      "age": 27,
      "location": "Bangalore, IN",
      "role": "Product designer",
      "tech": 6,
      "channel": "Product Hunt",
      "use_case": "Design portfolio",
      "outcome": "converted",
      "score": 8,
      "pre_expectation": "Looking for a way to get feedback on my portfolio without paying for user research.",
      "key_moment": "Persona grid in Step 02 — seeing diverse avatars with roles made it feel real, not like a GPT gimmick.",
      "biggest_gap": "The activity feed shows a SaaS product flow. Does it work the same for a portfolio with no pricing?",
      "thoughts": [
        {
          "type": "norm",
          "quote": "Step 02 persona grid with Mobile-first / Enterprise / SMB owner tags — actually shows diversity."
        },
        {
          "type": "norm",
          "quote": "Step 05 with specific fixes (\"Add a free trial line, reduces drop-off 34%\") — this is actionable, not fluffy."
        },
        {
          "type": "warn",
          "quote": "No Privacy Policy — if personas \"browse\" my portfolio, what data is collected?"
        }
      ]
    },
    {
      "id": 3,
      "name": "Jordan Williams",
      "age": 24,
      "location": "Austin TX, US",
      "role": "Side project builder",
      "tech": 8,
      "channel": "Product Hunt",
      "use_case": "Early-stage startup",
      "outcome": "converted",
      "score": 8,
      "pre_expectation": "Need to sanity-check my landing page before I pay for ads.",
      "key_moment": "\"Test my product free · First 50 teams free\" — that's my entry point, signed up.",
      "biggest_gap": "Still no pricing after the free period. Budgeting is hard without that.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The comparison table 28 min vs 2-4 weeks — I've done user interviews. This is the right framing."
        },
        {
          "type": "norm",
          "quote": "How It Works has actual detail now. The intent table showing \"40% skeptics, 25% comparing\" is believable."
        },
        {
          "type": "warn",
          "quote": "CLI in hero still makes it look like a dev tool. Took me a minute to realize it's just a URL input."
        }
      ]
    },
    {
      "id": 4,
      "name": "Sophie Mueller",
      "age": 29,
      "location": "Berlin, DE",
      "role": "UX researcher",
      "tech": 7,
      "channel": "Product Hunt",
      "use_case": "Client research tool",
      "outcome": "dropped",
      "score": 4,
      "pre_expectation": "A legitimate AI research tool I could pitch to clients as a faster alternative.",
      "key_moment": "Footer says \"© 2026 Betax\" — same moment I notice there's no Privacy Policy.",
      "biggest_gap": "Zero legal documentation. I'd recommend this to a client and they'd ask for a DPA on day one.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The How It Works section is actually impressive — shows process transparency I haven't seen in this space."
        },
        {
          "type": "warn",
          "quote": "\"Racoonn\" in header, \"Betax\" in footer — brand inconsistency kills credibility for professional use."
        },
        {
          "type": "fail",
          "quote": "No Privacy Policy, no GDPR. Can't recommend to any EU client without legal clearance."
        }
      ]
    },
    {
      "id": 5,
      "name": "Wei Zhang",
      "age": 25,
      "location": "Singapore",
      "role": "Frontend developer",
      "tech": 9,
      "channel": "Product Hunt",
      "use_case": "Side project",
      "outcome": "converted",
      "score": 7,
      "pre_expectation": "Is this real LLM persona simulation or a GPT wrapper with nice CSS?",
      "key_moment": "Intent table (Skeptic via Twitter ad / Comparing via G2 / Ready to buy via Google) — methodology feels thought through.",
      "biggest_gap": "Still no GitHub, no docs. I can't evaluate the actual technical implementation.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The intent distribution (40% skeptics, 25% comparing) matches actual funnel research. This isn't made up."
        },
        {
          "type": "norm",
          "quote": "\"First 50 teams free\" — I'm signing up to test before evaluating further."
        },
        {
          "type": "warn",
          "quote": "\"Betax\" in footer. Git blame energy — was this shipped from a template?"
        }
      ]
    },
    {
      "id": 6,
      "name": "Emma Schmidt",
      "age": 27,
      "location": "Munich, DE",
      "role": "Marketing manager",
      "tech": 6,
      "channel": "Product Hunt",
      "use_case": "Marketing landing page",
      "outcome": "dropped",
      "score": 5,
      "pre_expectation": "Fast alternative to another Hotjar + survey cycle.",
      "key_moment": "\"Where not Why\" framing — yes, that's exactly what I've been pitching to my team.",
      "biggest_gap": "No GDPR documentation. I need a Privacy Policy and DPA before running a company URL through this.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The comparison table is perfect — I've used the exact words \"Hotjar tells me WHERE but not WHY\" in presentations."
        },
        {
          "type": "warn",
          "quote": "How It Works is detailed but a lot of steps. My boss will ask \"so do I need to understand all this or just paste a URL?\""
        },
        {
          "type": "fail",
          "quote": "No Privacy Policy visible anywhere. GDPR compliance isn't optional in Germany."
        }
      ]
    },
    {
      "id": 7,
      "name": "Arjun Singh",
      "age": 28,
      "location": "Hyderabad, IN",
      "role": "Full-stack developer",
      "tech": 9,
      "channel": "Twitter/X",
      "use_case": "Developer tool page",
      "outcome": "undecided",
      "score": 6,
      "pre_expectation": "Either a real system with actual browser sessions, or prompt-engineered personas pretending to browse.",
      "key_moment": "Step 03 intent table — shows methodology. Step 04 feed shows Mei → Pricing ✗ with a quote. More transparent than expected.",
      "biggest_gap": "No docs, no API, no GitHub link. Still can't verify if \"5,000 agents\" means actual headless browser sessions.",
      "thoughts": [
        {
          "type": "warn",
          "quote": "\"Trained on 500+ B2C products\" — fine-tuned model or system prompt? Makes a difference to output reliability."
        },
        {
          "type": "warn",
          "quote": "Footer says Betax. Repo name? Old domain? Should be easy to fix if this is production-ready."
        },
        {
          "type": "warn",
          "quote": "No technical documentation — I'd want a sample JSON output before I trust 5,000 persona sessions."
        }
      ]
    },
    {
      "id": 8,
      "name": "Camille Dubois",
      "age": 31,
      "location": "Paris, FR",
      "role": "Freelance UX designer",
      "tech": 5,
      "channel": "Product Hunt",
      "use_case": "Portfolio site",
      "outcome": "undecided",
      "score": 6,
      "pre_expectation": "Tool to understand why potential clients visit my portfolio but don't reach out.",
      "key_moment": "The persona grid in Step 02 — seeing diverse faces + labels (Mobile-first, Enterprise) made it feel tangible.",
      "biggest_gap": "No Privacy Policy. AI agents browsing client portfolios I might test feels like a data question.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "Step 05 showing \"Fix: Add free trial line\" — this is the level of specificity I need, not \"improve UX\"."
        },
        {
          "type": "warn",
          "quote": "The live feed shows a SaaS product (Hero → Pricing → Converted). My portfolio has no pricing page — will the report make sense?"
        },
        {
          "type": "warn",
          "quote": "\"Betax\" footer + no Privacy Policy — two red flags for a French user."
        }
      ]
    },
    {
      "id": 9,
      "name": "Taylor Davis",
      "age": 26,
      "location": "Seattle, US",
      "role": "Product manager",
      "tech": 7,
      "channel": "Product Hunt",
      "use_case": "B2B product demo page",
      "outcome": "undecided",
      "score": 7,
      "pre_expectation": "Qualitative signal on why our demo page isn't converting trials.",
      "key_moment": "Step 03 intent table with \"Skeptic / Comparing / Ready to buy\" split — that's exactly how I segment my pipeline.",
      "biggest_gap": "All examples are B2C SaaS. My product is B2B mid-market — the agent profiles all look like consumers.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The 5-step process is finally transparent. I can explain this to my eng lead without hand-waving."
        },
        {
          "type": "norm",
          "quote": "\"Inner monologue\" style quotes from personas — this is what Hotjar can't give me."
        },
        {
          "type": "warn",
          "quote": "Still no pricing page — can't submit this to finance without a proper number."
        }
      ]
    },
    {
      "id": 10,
      "name": "Felix Wagner",
      "age": 38,
      "location": "Hamburg, DE",
      "role": "SaaS founder",
      "tech": 8,
      "channel": "Product Hunt",
      "use_case": "SaaS landing page",
      "outcome": "dropped",
      "score": 4,
      "pre_expectation": "Testing if AI personas can actually replace qual research or if this is hype.",
      "key_moment": "Step 05 has specific fix recommendations with impact estimates (\"reduces Skeptic drop-off by ~34%\") — that's a confident claim.",
      "biggest_gap": "No Impressum. No GDPR. No Privacy Policy. Legally unusable in Germany.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The How It Works section is the best I've seen in this category — process is actually transparent."
        },
        {
          "type": "warn",
          "quote": "\"Betax\" in footer while calling themselves Racoonn — this is either sloppy or a very recent rebrand."
        },
        {
          "type": "fail",
          "quote": "No Impressum, no GDPR. German law. Not negotiable. Dropped."
        }
      ]
    },
    {
      "id": 11,
      "name": "Riley Anderson",
      "age": 21,
      "location": "Boston, US",
      "role": "Design student",
      "tech": 5,
      "channel": "Product Hunt",
      "use_case": "Student portfolio",
      "outcome": "converted",
      "score": 8,
      "pre_expectation": "Product Hunt usually has cool beta tools — hoping to understand why my portfolio gets views but no messages.",
      "key_moment": "\"First 50 teams free. No credit card required.\" — converted immediately, will evaluate after.",
      "biggest_gap": "I'm not a \"team\" — slightly worried the product is built for companies, not solo students.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The persona grid showing Mei (21, SG, Mobile-first) felt weirdly personal — I'm almost that."
        },
        {
          "type": "norm",
          "quote": "Step 04 live feed with quotes from each agent — actually shows what they're thinking, not just where they clicked."
        },
        {
          "type": "warn",
          "quote": "47 of 50 spots — is that still accurate? Signed up anyway."
        }
      ]
    },
    {
      "id": 12,
      "name": "Rahul Kumar",
      "age": 36,
      "location": "Mumbai, IN",
      "role": "Product lead",
      "tech": 8,
      "channel": "Product Hunt",
      "use_case": "SaaS landing page",
      "outcome": "undecided",
      "score": 7,
      "pre_expectation": "Evaluating this against qual research tools we've tried.",
      "key_moment": "The intent table with source context (Twitter ad / G2 review / Google search) — this matches how we think about traffic segmentation.",
      "biggest_gap": "No methodology doc. How do 5,000 persona agents actually navigate a page? Real browser? Simulated?",
      "thoughts": [
        {
          "type": "norm",
          "quote": "P1/P2 output format with affected persona counts — matches exactly how I'd present findings to engineering."
        },
        {
          "type": "warn",
          "quote": "\"Betax\" footer — recent pivot? I'd want to know the history before committing company data."
        },
        {
          "type": "warn",
          "quote": "No pricing page makes ROI calculation impossible for a purchase decision."
        }
      ]
    },
    {
      "id": 13,
      "name": "Aisha Hassan",
      "age": 23,
      "location": "Nairobi, KE",
      "role": "Social media manager",
      "tech": 5,
      "channel": "Product Hunt",
      "use_case": "Personal brand site",
      "outcome": "converted",
      "score": 7,
      "pre_expectation": "Something to tell me why people visit my brand page but don't DM or book.",
      "key_moment": "\"Friends & teammates (too polite)\" — my entire creator group chat drop fire emojis on everything I post.",
      "biggest_gap": "Feed shows SaaS checkout flows. My site has a contact form. Will the report apply?",
      "thoughts": [
        {
          "type": "norm",
          "quote": "\"Too polite to tell you your product is confusing\" — this is every feedback session I've ever had."
        },
        {
          "type": "norm",
          "quote": "The persona grid feels real — actual diversity in age, location, role."
        },
        {
          "type": "warn",
          "quote": "\"First 50 teams free\" — I'm one person, not a team. Does this still count?"
        }
      ]
    },
    {
      "id": 14,
      "name": "Marcus Lee",
      "age": 34,
      "location": "New York, US",
      "role": "Growth lead",
      "tech": 7,
      "channel": "Product Hunt",
      "use_case": "SaaS onboarding flow",
      "outcome": "undecided",
      "score": 6,
      "pre_expectation": "A faster way to identify onboarding drop-off without setting up another funnel analysis.",
      "key_moment": "The stage drop-off concept (Hero → Features → Pricing → Signup) maps exactly to our funnel.",
      "biggest_gap": "No integration with our analytics stack. Does this replace or complement GA4?",
      "thoughts": [
        {
          "type": "norm",
          "quote": "\"28 min to full report\" — our current user research cycle is 3 weeks. Huge if real."
        },
        {
          "type": "warn",
          "quote": "Would need to see an actual report output for our URL before committing — demo shows someone else's product."
        },
        {
          "type": "warn",
          "quote": "No pricing after the free tier — budgeting is impossible without knowing ongoing cost."
        }
      ]
    },
    {
      "id": 15,
      "name": "Lena Fischer",
      "age": 34,
      "location": "Frankfurt, DE",
      "role": "Head of Growth",
      "tech": 7,
      "channel": "Slack",
      "use_case": "Marketing landing page",
      "outcome": "dropped",
      "score": 4,
      "pre_expectation": "Evaluating against our Mixpanel + Hotjar stack methodically.",
      "key_moment": "\"GA & Hotjar tells WHERE not WHY\" — that's been my exact pitch to leadership for six months.",
      "biggest_gap": "No Privacy Policy, no DPA. Cannot run company data through an unvetted service.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "\"Where not Why\" framing — someone finally built the product that fills that gap. If it works."
        },
        {
          "type": "warn",
          "quote": "Five steps is a lot of process to explain to a busy CMO. Needs a one-sentence version."
        },
        {
          "type": "fail",
          "quote": "No Privacy Policy, no DPA, no company info. Our legal team would block this in 5 minutes."
        }
      ]
    },
    {
      "id": 16,
      "name": "Dylan Park",
      "age": 29,
      "location": "Seoul, KR",
      "role": "Indie hacker",
      "tech": 8,
      "channel": "Product Hunt",
      "use_case": "Newsletter landing page",
      "outcome": "converted",
      "score": 7,
      "pre_expectation": "Always hunting for async research tools — user interviews are my least favorite part of building.",
      "key_moment": "Intent table with entry source (Twitter ad / G2 / Product Hunt) — this is how real traffic behaves.",
      "biggest_gap": "No team plan — building with a co-founder, do we share one account or pay double?",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The live feed with quotes is the killer feature — \"No free trial visible. Too risky.\" is more useful than a heatmap."
        },
        {
          "type": "norm",
          "quote": "\"First 50 teams free\" — signed up. Will verify if the report is as specific as the example."
        },
        {
          "type": "warn",
          "quote": "\"Betax\" footer is a tiny detail but indie hackers notice everything — fix it."
        }
      ]
    },
    {
      "id": 17,
      "name": "Nina Rossi",
      "age": 31,
      "location": "Milan, IT",
      "role": "Startup founder",
      "tech": 6,
      "channel": "LinkedIn",
      "use_case": "B2B SaaS landing page",
      "outcome": "undecided",
      "score": 6,
      "pre_expectation": "Looking for something actionable to improve our trial-to-paid conversion.",
      "key_moment": "Step 05 fix cards — \"Add industry tabs to demo section, increases relevance for 40% of traffic\" — specific and credible.",
      "biggest_gap": "Our product is B2B enterprise. Persona examples all feel consumer-oriented.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "The process transparency in How It Works is reassuring — I can see the methodology, not just results."
        },
        {
          "type": "warn",
          "quote": "\"$49\" appears once but there's no pricing page. What happens after first 50 teams?"
        },
        {
          "type": "warn",
          "quote": "No Privacy Policy for an Italian company is a GDPR concern we can't ignore."
        }
      ]
    },
    {
      "id": 18,
      "name": "James Okafor",
      "age": 27,
      "location": "Lagos, NG",
      "role": "Frontend dev / builder",
      "tech": 8,
      "channel": "Twitter/X",
      "use_case": "SaaS side project",
      "outcome": "converted",
      "score": 7,
      "pre_expectation": "Skeptical but open — Product Hunt usually surfaces real tools, not just landing pages.",
      "key_moment": "The intent table with 40/25/20/15 distribution of skeptics/comparing/buying/browsing — the math is realistic.",
      "biggest_gap": "No API or CLI documentation. \"racoonn run --url\" in the hero implies CLI exists — where are the docs?",
      "thoughts": [
        {
          "type": "norm",
          "quote": "Hero claim + live feed example + step-by-step process — finally a tool that shows its work."
        },
        {
          "type": "norm",
          "quote": "\"First 50 teams free, no credit card\" — low friction, signing up to test."
        },
        {
          "type": "warn",
          "quote": "Footer says Betax. This is the kind of detail that makes me wonder what else is half-finished."
        }
      ]
    },
    {
      "id": 19,
      "name": "Chloe Martin",
      "age": 26,
      "location": "Toronto, CA",
      "role": "Brand designer",
      "tech": 5,
      "channel": "Product Hunt",
      "use_case": "Design studio site",
      "outcome": "undecided",
      "score": 6,
      "pre_expectation": "A way to get honest feedback on my studio's site from people who don't know me.",
      "key_moment": "Persona grid — visual, diverse, shows labels. Finally makes \"5,000 AI personas\" feel real.",
      "biggest_gap": "My clients are enterprises. The example personas look like startup founders and students.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "\"Friends & teammates too polite to help\" — my whole network tells me my site is great."
        },
        {
          "type": "warn",
          "quote": "Activity feed shows Hero → Pricing ✗ flow. My studio site has no Pricing page — it's inquiry-based."
        },
        {
          "type": "warn",
          "quote": "No Privacy Policy on a site that AI-browses other websites — need that for Canadian privacy law too."
        }
      ]
    },
    {
      "id": 20,
      "name": "Blake Thompson",
      "age": 39,
      "location": "Chicago, US",
      "role": "Agency owner",
      "tech": 6,
      "channel": "Twitter/X",
      "use_case": "Marketing landing page",
      "outcome": "undecided",
      "score": 6,
      "pre_expectation": "Evaluating whether I can resell this or white-label it for clients.",
      "key_moment": "\"$3,000+ → $49\" comparison — my clients pay me $3K+ for user research. This changes my margin conversation.",
      "biggest_gap": "No agency plan, no white-label, no bulk pricing. One seat doesn't scale to 10 clients.",
      "thoughts": [
        {
          "type": "norm",
          "quote": "If the output quality is close to real user research, my margin just got massive. Big if."
        },
        {
          "type": "warn",
          "quote": "\"Betax\" in footer — if I'm reselling this I need to know the company is stable and not pivoting."
        },
        {
          "type": "warn",
          "quote": "No agency pricing model visible. I'd need volume pricing before pitching to clients."
        }
      ]
    }
  ]
};

app.get('/api/admin/ph-report', requireAdmin, (req, res) => {
  res.json(FRESH_PH_REPORT);
});

// ── Static + API ───────────────────────────────────────────
app.use(express.static(path.join(__dirname)));

app.post('/api/waitlist', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string' || url.trim().length < 3) {
    return res.status(400).json({ error: 'Invalid URL' });
  }
  const { email } = req.body;
  const entry = {
    url: url.trim(),
    email: (email || '').trim(),
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    user_agent: req.headers['user-agent'] || '',
    referrer: req.headers.referer || '',
    created_at: new Date().toISOString(),
  };
  if (process.env.DATABASE_URL) {
    await pool.query(
      'INSERT INTO waitlist (url, email, ip, user_agent, referrer) VALUES ($1,$2,$3,$4,$5)',
      [entry.url, entry.email, entry.ip, entry.user_agent, entry.referrer]
    );
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM waitlist');
    sendWelcomeEmail(entry.email, entry.url); // async, don't await
    return res.json({ ok: true, count: parseInt(count) });
  }
  memoryList.push(entry);
  sendWelcomeEmail(entry.email, entry.url); // async, don't await
  return res.json({ ok: true, count: memoryList.length });
});

app.get('/api/waitlist/count', async (req, res) => {
  if (process.env.DATABASE_URL) {
    const { rows: [{ count }] } = await pool.query('SELECT COUNT(*) FROM waitlist');
    return res.json({ count: parseInt(count) });
  }
  res.json({ count: memoryList.length });
});

app.get('/about', (req, res) => res.sendFile(path.join(__dirname, 'about.html')));
app.get('/pricing', (req, res) => res.sendFile(path.join(__dirname, 'pricing.html')));
app.get('/impressum', (req, res) => res.sendFile(path.join(__dirname, 'impressum.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'privacy.html')));
app.get('/terms', (req, res) => res.sendFile(path.join(__dirname, 'terms.html')));
app.get('/blog', (req, res) => res.sendFile(path.join(__dirname, 'blog', 'index.html')));
app.get('/blog/:slug', (req, res) => { const f = path.join(__dirname, 'blog', req.params.slug + '.html'); res.sendFile(f); });


app.use(express.static(__dirname, {
  maxAge: '7d',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.png') || filePath.endsWith('.jpg'))
      res.setHeader('Cache-Control', 'public, max-age=604800');
    if (filePath.endsWith('.xml') || filePath.endsWith('.txt'))
      res.setHeader('Cache-Control', 'public, max-age=3600');
  },
}));

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

initDB()
  .then(() => app.listen(PORT, () => console.log(`Betax running on port ${PORT}`)))
  .catch(err => {
    console.error('[DB] init failed:', err.message);
    app.listen(PORT, () => console.log(`Betax running on port ${PORT} (no DB)`));
  });
