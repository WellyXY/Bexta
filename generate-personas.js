// Generates 500 diverse personas for Betax report seeding
'use strict';

const FIRST_NAMES = [
  'Alex','Jordan','Taylor','Morgan','Riley','Casey','Avery','Quinn','Blake','Drew',
  'Lena','Sophie','Emma','Mia','Nina','Eva','Sara','Anna','Kate','Lily',
  'James','Oliver','Noah','Liam','Ethan','Lucas','Mason','Logan','Aiden','Carter',
  'Priya','Ananya','Divya','Shreya','Kavya','Nisha','Pooja','Riya','Sneha','Meera',
  'Carlos','Diego','Mateo','Javier','Andrés','Miguel','Luis','Pablo','Ricardo','Alejandro',
  'Wei','Mei','Jing','Fang','Xiu','Ling','Hao','Jun','Tao','Min',
  'Sophie','Camille','Léa','Marie','Claire','Julie','Lucie','Inès','Chloé','Manon',
  'Felix','Klaus','Hans','Luca','Marco','Stefan','Jan','Tobias','Erik','Nils',
  'Aisha','Fatima','Amina','Nadia','Layla','Sara','Yara','Dina','Rania','Hana',
  'Ngozi','Amara','Chioma','Adaeze','Blessing','Chidi','Emeka','Kemi','Tunde','Yemi',
  'Hassan','Ahmed','Omar','Khalid','Tariq','Yusuf','Ibrahim','Samir','Nasser','Faris',
  'Kenji','Yuki','Hana','Sato','Ryo','Emi','Aoi','Nao','Rin','Yui',
  'Thomas','William','Henry','George','Edward','Frederick','Arthur','Charles','Alfred','Harold',
  'Isabella','Valentina','Sofía','Catalina','Mariana','Daniela','Natalia','Camila','Laura','Paula',
  'Rahul','Arjun','Vikram','Rohan','Siddharth','Kiran','Nikhil','Aditya','Gaurav','Pranav',
  'Olga','Natasha','Anna','Elena','Irina','Tatiana','Marina','Vera','Oksana','Yulia',
  'Wu','Liu','Zhang','Li','Chen','Wang','Zhao','Huang','Lin','Yang',
  'Amelia','Charlotte','Poppy','Freya','Imogen','Phoebe','Ellie','Isla','Grace','Ella',
  'Lior','Noa','Tamar','Shira','Yael','Avi','Eitan','Gal','Dan','Ori',
  'Siti','Nur','Aisyah','Farah','Zara','Amir','Rizal','Hafiz','Aziz','Fikri',
];
const LAST_NAMES = [
  'Chen','Patel','Smith','Kim','Garcia','Mueller','Wang','Johnson','Singh','Martinez',
  'Brown','Anderson','Taylor','Thomas','Jackson','White','Harris','Clark','Lewis','Robinson',
  'Walker','Hall','Allen','Young','Hernandez','King','Wright','Lopez','Hill','Scott',
  'Green','Adams','Baker','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips',
  'Campbell','Parker','Evans','Edwards','Collins','Stewart','Morris','Rogers','Reed','Cook',
  'Morgan','Bell','Murphy','Bailey','Rivera','Cooper','Richardson','Cox','Howard','Ward',
  'Torres','Peterson','Gray','Ramirez','James','Watson','Brooks','Kelly','Sanders','Price',
  'Bennett','Wood','Barnes','Ross','Henderson','Coleman','Jenkins','Perry','Powell','Long',
  'Dubois','Laurent','Martin','Bernard','Thomas','Robert','Richard','Petit','Durand','Leroy',
  'Schmidt','Fischer','Weber','Wagner','Becker','Schulz','Hoffmann','Schäfer','Koch','Bauer',
  'Müller','Meier','Lehmann','Keller','Richter','Braun','Zimmermann','Neumann','Schwarz','Weiß',
  'Santos','Oliveira','Ferreira','Alves','Pereira','Lima','Gomes','Costa','Ribeiro','Martins',
  'González','Rodríguez','López','Díaz','Fernández','Sánchez','Pérez','Ramírez','Torres','Flores',
  'Tanaka','Watanabe','Ito','Yamamoto','Nakamura','Kobayashi','Kato','Suzuki','Saito','Yamada',
  'Ali','Hassan','Ibrahim','Ahmed','Mohammed','Abdullah','Rahman','Khan','Hussain','Malik',
  'Okonkwo','Adeyemi','Okafor','Nwosu','Eze','Chukwu','Obi','Nwachukwu','Onyeka','Oluwaseun',
  'Nielsen','Hansen','Andersen','Larsen','Jensen','Pedersen','Christensen','Rasmussen','Sørensen','Eriksson',
  'Johansson','Karlsson','Larsson','Nilsson','Eriksson','Lindström','Persson','Björk','Holm','Svensson',
];

const REGIONS = [
  { country:'US', cities:['San Francisco','New York','Austin','Seattle','Boston','Chicago','Los Angeles','Denver','Atlanta','Miami'], weight:28 },
  { country:'IN', cities:['Bangalore','Mumbai','Delhi','Hyderabad','Pune','Chennai','Kolkata'], weight:14 },
  { country:'DE', cities:['Berlin','Munich','Hamburg','Frankfurt','Cologne','Stuttgart'], weight:7 },
  { country:'UK', cities:['London','Manchester','Edinburgh','Bristol','Birmingham'], weight:7 },
  { country:'SG', cities:['Singapore'], weight:5 },
  { country:'FR', cities:['Paris','Lyon','Marseille','Bordeaux'], weight:5 },
  { country:'BR', cities:['São Paulo','Rio de Janeiro','Curitiba','Brasília'], weight:4 },
  { country:'CA', cities:['Toronto','Vancouver','Montreal','Calgary'], weight:4 },
  { country:'AU', cities:['Sydney','Melbourne','Brisbane','Perth'], weight:4 },
  { country:'NG', cities:['Lagos','Abuja','Port Harcourt','Kano'], weight:3 },
  { country:'MX', cities:['Mexico City','Guadalajara','Monterrey'], weight:3 },
  { country:'JP', cities:['Tokyo','Osaka','Kyoto','Fukuoka'], weight:3 },
  { country:'UAE', cities:['Dubai','Abu Dhabi'], weight:2 },
  { country:'NL', cities:['Amsterdam','Rotterdam','Utrecht'], weight:2 },
  { country:'ES', cities:['Madrid','Barcelona','Valencia'], weight:2 },
  { country:'PL', cities:['Warsaw','Kraków','Wrocław'], weight:1 },
  { country:'KE', cities:['Nairobi','Mombasa'], weight:1 },
  { country:'ZA', cities:['Cape Town','Johannesburg','Durban'], weight:1 },
  { country:'PH', cities:['Manila','Cebu','Davao'], weight:1 },
  { country:'MY', cities:['Kuala Lumpur','Penang'], weight:1 },
  { country:'ID', cities:['Jakarta','Surabaya','Bandung'], weight:1 },
  { country:'IL', cities:['Tel Aviv','Jerusalem','Haifa'], weight:1 },
];

const ROLES = [
  // [role, tech_min, tech_max, weight, conv_boost]
  ['Indie maker / side project builder', 7, 9, 6, 0.3],
  ['SaaS founder', 6, 9, 7, 0.25],
  ['Product manager', 6, 8, 8, 0.2],
  ['Full-stack developer', 7, 10, 5, 0.15],
  ['Frontend developer', 6, 9, 4, 0.15],
  ['UX/UI designer', 5, 8, 6, 0.1],
  ['Marketing manager', 5, 7, 7, 0.1],
  ['Growth hacker', 6, 8, 4, 0.2],
  ['Agency owner', 5, 7, 5, 0.1],
  ['Freelance designer', 4, 7, 5, 0.05],
  ['E-commerce owner', 4, 6, 5, 0.05],
  ['Content creator', 3, 6, 5, 0.05],
  ['Social media manager', 3, 5, 4, 0.05],
  ['Blogger/writer', 2, 5, 3, 0.0],
  ['Small business owner', 2, 5, 5, 0.0],
  ['Startup CEO', 5, 8, 5, 0.2],
  ['Head of Growth', 6, 8, 4, 0.2],
  ['VP Marketing', 5, 7, 3, 0.15],
  ['Consultant', 5, 7, 4, 0.1],
  ['Product designer', 5, 8, 4, 0.1],
  ['Data analyst', 7, 9, 3, 0.1],
  ['Backend developer', 7, 10, 3, 0.1],
  ['Design student', 3, 6, 4, 0.05],
  ['Business student', 3, 5, 3, 0.0],
  ['Professor/teacher', 2, 5, 2, -0.1],
  ['HR manager', 3, 5, 2, -0.05],
  ['Non-technical CEO', 3, 5, 3, 0.05],
  ['Copywriter', 3, 6, 3, 0.0],
  ['Photographer', 2, 5, 2, -0.05],
  ['Local business owner', 1, 4, 3, -0.1],
];

const CHANNELS = [
  ['Product Hunt', 42],
  ['Twitter/X', 12],
  ['LinkedIn', 10],
  ['Instagram', 8],
  ['Friend referral', 7],
  ['Newsletter', 6],
  ['Reddit', 5],
  ['YouTube', 4],
  ['Slack community', 3],
  ['Google search', 3],
];

const USE_CASES = [
  'SaaS landing page', 'SaaS landing page', 'SaaS landing page',
  'Portfolio site', 'Portfolio site',
  'E-commerce product page', 'E-commerce product page',
  'Marketing landing page', 'Marketing landing page',
  'Early-stage startup', 'Early-stage startup',
  'Personal brand site', 'Personal brand site',
  'B2B product demo page',
  'Blog/content site',
  'Newsletter signup page',
  'Local business website',
  'Agency website',
  'Mobile app landing page',
  'Developer tool page',
  'Just exploring',
];

const PRE_EXPECTATIONS = {
  high_tech: [
    'A serious LLM-powered persona simulation tool — let\'s see if it actually holds up.',
    'Expecting something between Hotjar and qualitative research — hoping it\'s actually useful.',
    'Probably another GPT wrapper — but the CLI hint is interesting.',
    'Fast feedback on landing page messaging without another user interview round.',
    'A way to get actionable data before we spend on paid acquisition.',
  ],
  mid_tech: [
    'A tool that shows me why visitors don\'t convert — less work than user interviews.',
    'Something like a smarter heat map that also tells me what people are thinking.',
    'AI-generated user feedback — sounds convenient if it actually works.',
    'Product Hunt usually surfaces interesting tools — curious to see what this does.',
    'Something to help understand our bounce rate without a research agency.',
  ],
  low_tech: [
    'Not sure what to expect — my colleague sent the link.',
    'Thought this might help me understand why people visit my site but don\'t contact me.',
    'Something that tells me if my website is working properly.',
    'My friend said it would help understand why customers don\'t buy.',
    'A website checker — like Google but for user experience.',
  ],
};

const KEY_MOMENTS = [
  '"They left at second 30" — exactly what I\'ve been trying to diagnose.',
  'The $49 vs $3,000+ comparison stopped me mid-scroll.',
  '28 minutes for a full report — that\'s the number that got me.',
  'Persona selector in demo — seeing someone like me in there felt personal.',
  '"GA & Hotjar tells WHERE not WHY" — someone finally articulated my exact frustration.',
  '"Inner monologues" as output — quantitative data never tells me what people were thinking.',
  '"Friends & teammates (too polite)" — I\'ve lived this.',
  'P1/P2 issue prioritization — the format a product team can actually act on.',
  '"Just paste URL" — finally no setup, no tagging, no waiting weeks.',
  'The scale — 5,000 personas in 28 minutes sounds legitimately useful if it works.',
];

const THOUGHT_TEMPLATES = {
  converted: [
    [{type:'norm',quote:'This is exactly the output format I\'d share with my team after a sprint.'},{type:'norm',quote:'The issue prioritization with affected counts is genuinely useful — not just "here are problems".'},{type:'warn',quote:'No pricing page still — need to know what I\'m committing to after the free run.'}],
    [{type:'norm',quote:'The comparison table alone would be enough to get budget approval for this.'},{type:'norm',quote:'"Just paste URL" — zero setup friction is a real product decision I respect.'},{type:'warn',quote:'"47 of 50 spots taken" — signing up immediately before overthinking this.'}],
    [{type:'norm',quote:'If the output matches the demo, this replaces two weeks of user research prep.'},{type:'norm',quote:'The CLI command gets me excited about CI/CD integration — run on every deploy.'},{type:'warn',quote:'No docs yet — assuming they\'re building it, signing up to find out.'}],
    [{type:'norm',quote:'5,000 personas in 28 min — scale that would cost $50K+ to replicate manually.'},{type:'norm',quote:'P1 with client counts in the demo — exactly what I\'d put in an engineering ticket.'},{type:'warn',quote:'Free for first 50 teams — am I one of them? Submitting before the timer runs out.'}],
  ],
  undecided: [
    [{type:'norm',quote:'The headline is accurate — I\'ve spent months staring at bounce rates without a why.'},{type:'warn',quote:'No pricing page — I can\'t put "unknown cost" into a quarterly budget proposal.'},{type:'warn',quote:'Demo uses Lovable.dev — need to know if this works for a B2B SaaS, not just consumer tools.'}],
    [{type:'norm',quote:'Inner monologue output is the differentiator — every other tool gives me click maps.'},{type:'warn',quote:'5,000 personas sounds impressive but I\'d want to audit the methodology first.'},{type:'warn',quote:'Signing up to a waitlist, not a product — I need a timeline before I get more invested.'}],
    [{type:'norm',quote:'The "too polite" framing is perfect — that\'s exactly the feedback problem I have.'},{type:'warn',quote:'No About page, no team info — I don\'t know who\'s building this or if they\'ll ship.'},{type:'warn',quote:'$49 but no definition — per run? per month? per URL? Big difference in ROI calculation.'}],
    [{type:'norm',quote:'The comparison to user interviews is compelling — we spend $3K per study easily.'},{type:'warn',quote:'All demo examples are consumer SaaS — I\'m evaluating a B2B procurement workflow.'},{type:'warn',quote:'"First 50 teams" but no product yet — how long before I can actually use this?'}],
  ],
  dropped: [
    [{type:'warn',quote:'The terminal visual immediately made me think "not for me" — I was right.'},{type:'fail',quote:'No Privacy Policy, no company name — I can\'t run our site through an anonymous service.'},{type:'fail',quote:'Couldn\'t find anything about who built this or why I should trust it with our URL.'}],
    [{type:'norm',quote:'The headline made sense — yes, I want to know why users leave.'},{type:'fail',quote:'No Impressum, no GDPR notice — legally I can\'t use this in a professional context.'},{type:'fail',quote:'Clicked around for 3 minutes and couldn\'t find pricing, docs, or a team page. Leaving.'}],
    [{type:'warn',quote:'5,000 persona agents — I\'m not sure what that means but it sounds technical and expensive.'},{type:'fail',quote:'"Just paste URL" makes it sound simple, then it talks about personas and agents and I\'m lost.'},{type:'fail',quote:'No phone number, no contact, no company name. Not something I can recommend to a client.'}],
    [{type:'norm',quote:'The idea is interesting — AI visitors that tell you what they\'re thinking.'},{type:'warn',quote:'The whole page is persuasion and no proof — no real case studies, no named customers.'},{type:'fail',quote:'Waitlist with no timeline. I\'ll come back when there\'s an actual product to try.'}],
    [{type:'fail',quote:'The CLI terminal hero signals developer tool — I\'m not a developer, I clicked away.'},{type:'fail',quote:'$49 without context about what you get is a hard no from me right now.'},{type:'fail',quote:'I have no website so this product isn\'t for me — should have been clearer upfront.'}],
  ],
};

const BIGGEST_GAPS = {
  converted: [
    'No pricing page — committed anyway but need clarity before the free period ends.',
    'Missing docs — the CLI hint is exciting but I need the API reference.',
    'No SLA or reliability info — this would run on production URLs.',
    '"First 50 teams" scarcity with no timeline — creates urgency but also anxiety.',
  ],
  undecided: [
    'No pricing page — $49 per run vs per month completely changes the ROI math.',
    'Demo only shows consumer SaaS — I need to see B2B or my industry use case.',
    'No methodology transparency — how are 5,000 personas constructed? Who validates them?',
    'Missing Privacy Policy + no company info — moderate trust issue for a professional context.',
    'No agency or white-label plan — tool is built for single teams, not service providers.',
  ],
  dropped: [
    'No Privacy Policy, no Impressum, no GDPR notice — legal showstopper.',
    'No company info, no About page — anonymous service I can\'t vet.',
    'Product is built for SaaS landing pages — my use case (blog/local biz/portfolio) isn\'t addressed.',
    'The terminal UI signals developer tool — not relevant to my context.',
    'Everything is persuasion and no proof — waitlist with no product date.',
  ],
};

// Utility
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function weighted(items) {
  const total = items.reduce((s, [,w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of items) { r -= w; if (r <= 0) return item; }
  return items[0][0];
}

function generatePersona(id) {
  const firstNames = FIRST_NAMES;
  const lastNames = LAST_NAMES;
  const name = rand(firstNames) + ' ' + rand(lastNames);

  const region = weighted(REGIONS.map(r => [r, r.weight]));
  const city = rand(region.cities);
  const location = `${city}, ${region.country}`;

  const age = weighted([
    [randInt(18,24), 12], [randInt(25,30), 22], [randInt(31,36), 22],
    [randInt(37,42), 18], [randInt(43,50), 16], [randInt(51,65), 10],
  ]);

  const roleData = weighted(ROLES.map(r => [r, r[3]]));
  const role = roleData[0];
  const tech = randInt(roleData[1], roleData[2]);
  const convBoost = roleData[4];

  const channel = weighted(CHANNELS);
  const use_case = rand(USE_CASES);

  // Determine outcome based on tech comfort + role + channel
  const baseConvRate = 0.18 + convBoost;
  const baseDropRate = 0.38 - (tech - 5) * 0.03;
  const r = Math.random();
  let outcome;
  if (r < Math.max(0.05, Math.min(0.45, baseConvRate))) outcome = 'converted';
  else if (r < Math.max(0.05, Math.min(0.45, baseConvRate)) + Math.max(0.2, Math.min(0.6, baseDropRate))) outcome = 'dropped';
  else outcome = 'undecided';

  const score = outcome === 'converted' ? randInt(6, 9) :
                outcome === 'dropped'   ? randInt(1, 5) : randInt(4, 7);

  const techLevel = tech >= 7 ? 'high_tech' : tech >= 4 ? 'mid_tech' : 'low_tech';
  const pre_expectation = rand(PRE_EXPECTATIONS[techLevel]);
  const key_moment = rand(KEY_MOMENTS);
  const biggest_gap = rand(BIGGEST_GAPS[outcome]);
  const thoughts = rand(THOUGHT_TEMPLATES[outcome]);

  return { id, name, age, location, role, tech_comfort: tech, channel, use_case, outcome, score, pre_expectation, key_moment, biggest_gap, thoughts };
}

function generate(count = 500) {
  const personas = [];
  for (let i = 1; i <= count; i++) {
    personas.push(generatePersona(i));
  }
  return personas;
}

module.exports = { generate };
