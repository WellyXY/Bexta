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
        from: 'Racoonn <hello@racoonn.me>',
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


// ── PH Audit Report ───────────────────────────────────────────────────────
const PH_IDS = new Set([1,2,4,5,8,9,10,11,12,14,15,16,17,18,19,21,22,23,24,25]);
app.get('/api/admin/ph-report', requireAdmin, (req, res) => {
  const personas = REPORT_SEED.personas.filter(p => PH_IDS.has(p.id));
  const converted  = personas.filter(p => p.outcome === 'converted').length;
  const dropped    = personas.filter(p => p.outcome === 'dropped').length;
  const undecided  = personas.filter(p => p.outcome === 'undecided').length;
  const avg_score  = Math.round(personas.reduce((s,p) => s + p.score, 0) / personas.length * 10) / 10;
  res.json({
    meta: { label: 'Product Hunt Audience Audit', run_date: REPORT_SEED.meta.run_date, total: personas.length },
    summary: { converted, dropped, undecided, avg_score, conversion_rate: Math.round(converted/personas.length*100) },
    top_issues: REPORT_SEED.top_issues,
    personas,
  });
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
