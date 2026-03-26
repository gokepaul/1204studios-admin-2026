import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { BrowserRouter, Routes, Route, Link, NavLink, useNavigate, useParams, useLocation } from "react-router-dom";

/* ═══════════════════════════════════════════════
   ROUTE HELPERS
═══════════════════════════════════════════════ */
const PAGE_TO_PATH = {
  "Home":           "/",
  "Portfolio":      "/portfolio",
  "Blog":           "/blog",
  "Branding":       "/services/branding",
  "Marketing":      "/services/marketing",
  "Print":          "/services/print",
  "Tutoring":       "/services/tutoring",
  "About":          "/about",
  "Contact":        "/contact",
  "Privacy Policy": "/privacy",
  "Terms of Use":   "/terms",
  "Book a Call":    "/book-call",
};

/* ═══════════════════════════════════════════════
   SEO
═══════════════════════════════════════════════ */
const SITE_NAME = "1204Studios";
const SITE_URL  = "https://1204studios.com";

const SEO_MAP = {
  "/":                   { title:"1204Studios — Creative & Marketing Studio Lagos", description:"1204Studios is a Lagos-based creative studio specialising in brand identity, marketing campaigns, print media, and design education. Built for brands that move differently." },
  "/about":              { title:"About Us — 1204Studios", description:"A technology-led, detail-obsessed creative studio in Lagos. We integrate AI into our workflows and deliver with hands-on craft and signature excellence." },
  "/contact":            { title:"Contact Us — Start a Project with 1204Studios", description:"Ready to work with 1204Studios? Send us your brief. We work with startups, growing businesses, and institutions across Lagos and Nigeria." },
  "/portfolio":          { title:"Our Work — Portfolio — 1204Studios", description:"Browse case studies from 1204Studios. Brand identities, marketing campaigns, print projects, and more." },
  "/blog":               { title:"Blog — Thinking on Brand, Design & Marketing — 1204Studios", description:"Articles, opinions, and frameworks on branding, marketing, design, and creative business from the team at 1204Studios in Lagos." },
  "/services/branding":  { title:"Brand Identity & Design Services — 1204Studios", description:"Professional brand identity design in Lagos. Logo systems, visual language, brand guidelines, and application design." },
  "/services/marketing": { title:"Marketing & Campaign Services — 1204Studios", description:"Strategic marketing campaigns for Nigerian businesses. Campaign planning, digital media buying, social creative, and performance reporting." },
  "/services/print":     { title:"Print Media & Production — 1204Studios", description:"Professional print design and production management in Lagos. Corporate materials, packaging, annual reports, and point-of-sale." },
  "/services/tutoring":  { title:"Design & Web Tutoring — 1204Studios", description:"Structured design education in Lagos. Graphic design, motion, web, and creative thinking courses." },
  "/privacy":            { title:"Privacy Policy — 1204Studios", description:"How 1204Studios collects, uses, and protects your personal data." },
  "/book-call":          { title:"Book a Call — 1204Studios", description:"Schedule a free 30-minute Google Meet call with the 1204Studios team. Tell us about your project and let's see how we can help." },
  "/terms":              { title:"Terms of Use — 1204Studios", description:"Terms and conditions for using the 1204Studios website." },
};

function useSEO(overrides = {}) {
  const { pathname } = useLocation();
  const base        = SEO_MAP[pathname] || SEO_MAP["/"];
  const title       = overrides.title       || base.title;
  const description = overrides.description || base.description;
  const canonical   = SITE_URL + pathname;

  useEffect(() => {
    document.title = title;
    const setMeta = (sel, attr, val, content) => {
      let el = document.querySelector(sel);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, val); document.head.appendChild(el); }
      el.content = content;
    };
    const setLink = (rel, href) => {
      let el = document.querySelector(`link[rel="${rel}"]`);
      if (!el) { el = document.createElement("link"); el.rel = rel; document.head.appendChild(el); }
      el.href = href;
    };
    setMeta('meta[name="description"]',         "name",     "description",          description);
    setMeta('meta[name="robots"]',               "name",     "robots",               "index, follow");
    setMeta('meta[property="og:title"]',         "property", "og:title",             title);
    setMeta('meta[property="og:description"]',   "property", "og:description",       description);
    setMeta('meta[property="og:url"]',           "property", "og:url",               canonical);
    setMeta('meta[property="og:type"]',          "property", "og:type",              "website");
    setMeta('meta[property="og:site_name"]',     "property", "og:site_name",         SITE_NAME);
    setMeta('meta[property="og:image"]',         "property", "og:image",             SITE_URL + "/og-image.png");
    setMeta('meta[name="twitter:card"]',         "name",     "twitter:card",         "summary_large_image");
    setMeta('meta[name="twitter:title"]',        "name",     "twitter:title",        title);
    setMeta('meta[name="twitter:description"]',  "name",     "twitter:description",  description);
    setMeta('meta[name="twitter:image"]',        "name",     "twitter:image",        SITE_URL + "/og-image.png");
    setLink("canonical", canonical);
  }, [title, description, canonical]);
}

function SEO({ title, description }) {
  useSEO({ title, description });
  return null;
}

function JsonLD({ data }) {
  useEffect(() => {
    const id = "jsonld-" + (data["@type"] || "schema").toLowerCase().replace(/\s/g, "-");
    let el = document.getElementById(id);
    if (!el) { el = document.createElement("script"); el.id = id; el.type = "application/ld+json"; document.head.appendChild(el); }
    el.textContent = JSON.stringify(data);
    return () => { const s = document.getElementById(id); if (s) s.remove(); };
  }, [data]);
  return null;
}

function useGo() {
  const navigate = useNavigate();
  return useCallback((page) => {
    navigate(PAGE_TO_PATH[page] || "/");
    window.scrollTo(0, 0);
  }, [navigate]);
}

/* Section reveal on scroll */
function useSectionReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add("visible"); obs.unobserve(el); }
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ═══════════════════════════════════════════════
   SUPABASE
═══════════════════════════════════════════════ */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://rtkjrbczkeahhhuocejj.supabase.co";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0a2pyYmN6a2VhaGhodW9jZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDI4MzksImV4cCI6MjA4NzgxODgzOX0.P5v30xR3ojxKQ4suca7cLo-EdeMV1194DHTVevUcvBI";

async function sbGet(table, query = "") {
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: { "apikey": SUPABASE_KEY, "Authorization": `Bearer ${SUPABASE_KEY}` },
    });
    if (!r.ok) return null;
    return r.json();
  } catch(e) { return null; }
}

/* ═══════════════════════════════════════════════
   DEFAULTS
═══════════════════════════════════════════════ */
const DEFAULT_BRANDS = [
  { id:"b1", name:"Amazon" }, { id:"b2", name:"MTN" },
  { id:"b3", name:"Bolt" },   { id:"b4", name:"Netflix" },
  { id:"b5", name:"Dangote" },{ id:"b6", name:"GTBank" },
  { id:"b7", name:"Airtel" }, { id:"b8", name:"Flutterwave" },
];
const DEFAULT_HERO = {
  headline: "Built for brands that move differently.",
  subtext: "A Lagos-based creative and marketing studio. We design brands, build campaigns, produce print, and train the next wave of creative talent.",
  cta1: "Start a Project", cta2: "See Our Work",
};
const DEFAULT_BRAND_BAR = {
  heading: "The brands who taught us greatness",
  sub: "Big brands who accidentally trained their future competition",
};
const DEFAULT_METRICS = [
  { id:"m1", service:"Brand Design",  accent:"#ff2d78", headline:"Real businesses. Real communities. Real change.",                body:"Every brand we build puts a local business in a position to compete — on the national stage, against global players, for the customers they deserve.",                                        stats:[{value:"200+",label:"Local Businesses Elevated"},{value:"₦4.2B+",label:"Client Revenue Influenced"},{value:"40+",label:"Industries Reached"},{value:"6",label:"NGOs Rebranded Pro Bono"}] },
  { id:"m2", service:"Marketing",     accent:"#FFDE21", headline:"Visibility that opens doors for Nigerian businesses.",            body:"Our campaigns don't just drive clicks — they put local founders in front of customers, investors, and opportunities that change the trajectory of their businesses.",           stats:[{value:"50M+",label:"Nigerians Reached"},{value:"47K",label:"App Downloads in 30 Days"},{value:"₦2B+",label:"Media Investment Guided"},{value:"12",label:"Startups Taken to Market"}] },
  { id:"m3", service:"Print Media",   accent:"#00c8e0", headline:"Putting Nigerian brands on shelves that used to ignore them.",   body:"Professional print and packaging has always been the barrier between local products and retail shelves. We've removed that barrier for hundreds of Nigerian makers.",              stats:[{value:"500+",label:"Print Jobs Executed"},{value:"18%",label:"Client Cost Savings"},{value:"12",label:"SKUs Launched Into Retail"},{value:"3",label:"Award Commendations"}] },
  { id:"m4", service:"Tutoring",      accent:"#a855f7", headline:"Training the next generation of African creatives.",             body:"Every student we train is one more young Nigerian who can earn independently, build locally, and compete globally — without leaving home to do it.",                              stats:[{value:"300+",label:"Young Creatives Trained"},{value:"92%",label:"Graduates Now Employed"},{value:"15+",label:"Partner Schools & Orgs"},{value:"₦0",label:"Cost to Scholarship Students"}] },
];
const DEFAULT_CASE_STUDIES = [
  { id:"cs1", title:"Greenleaf Environmental Agency", category:"Brand Identity",    year:"2024", hero:"#1b3a2a", summary:"A full brand system for a Lagos-based environmental NGO — from strategy to final rollout.",       challenge:"Greenleaf had strong credibility but no visual identity that matched it.", approach:"We started with positioning — defining what made Greenleaf different from every other NGO.", result:"New brand system deployed across all touchpoints within 6 weeks. First funder meeting secured within 2 months.", tags:["Branding","NGO"],       featured:true },
  { id:"cs2", title:"NexaPay Fintech Launch",         category:"Marketing Campaign",year:"2024", hero:"#0c1f4a", summary:"Go-to-market campaign for a Lagos fintech startup entering a crowded market.",                    challenge:"NexaPay needed to launch with noise in a market with three established players.", approach:"We focused the campaign on one differentiator: speed.", result:"2M+ organic impressions in week one. 47,000 app downloads in first month.", tags:["Marketing","Fintech"],  featured:true },
  { id:"cs3", title:"LCCI Corporate Suite",           category:"Print Media",       year:"2023", hero:"#2a1a0a", summary:"Complete corporate print collateral for the Lagos Chamber of Commerce.",                          challenge:"Existing materials were inconsistent across departments.", approach:"We audited every piece of collateral then built a modular print system.", result:"Annual report won a design commendation. Print costs reduced 18%.", tags:["Print","Corporate"],    featured:true },
  { id:"cs4", title:"Eko Hotels Brand Refresh",       category:"Brand Identity",    year:"2023", hero:"#1a1a1a", summary:"Visual language update for one of Lagos's most recognised heritage hotel brands.",                challenge:"Modernisation without destroying 40 years of brand equity.", approach:"We mapped brand history and built a refresh around core equity assets.", result:"Social engagement up 34%. Guest brand scores rose from 6.8 to 8.2 out of 10.", tags:["Branding","Hospitality"],featured:true },
  { id:"cs5", title:"Farmfresh Packaging System",     category:"Print Media",       year:"2023", hero:"#1a3a1b", summary:"Packaging design across 12 SKUs for a D2C food brand entering retail.",                          challenge:"Moving from market stalls to retail shelves.", approach:"Bold colour coding and a mark that works at any size.", result:"Stocked in 4 major Lagos supermarket chains within 3 months.", tags:["Print","Packaging"],    featured:false },
  { id:"cs6", title:"MamaDelight Consumer Brand",     category:"Brand Identity",    year:"2024", hero:"#3a2a0c", summary:"Full brand identity for a Lagos FMCG startup.",                                                  challenge:"Premium and warm at the same time.", approach:"Built around intentional warmth — bold yet human.", result:"Sell-through exceeded projections by 40%.", tags:["Branding","FMCG"],      featured:false },
];
const DEFAULT_BLOG_POSTS = [
  { id:"bp1", title:"The Future of Brand Messaging in 2025",         tag:"Marketing",   date:"Mar 12, 2025", readTime:"6 min read", summary:"Attention is scarcer than ever. The brands winning aren't the ones with the biggest budgets — they're the ones with the clearest point of view.",          content:"Brand messaging has always been about clarity. But in 2025, clarity has taken on a new dimension.\n\nSpecificity over scale. A message built for a specific person in a specific situation outperforms a broad message every time.\n\nVoice consistency matters more than channel strategy. Brands that sound the same on a billboard as they do in a DM build more trust than brands that shift register for every platform.", featured:true },
  { id:"bp2", title:"How AI is Reshaping Brand Accessibility",        tag:"Technology",  date:"Feb 28, 2025", readTime:"5 min read", summary:"AI isn't replacing brand designers. It's removing the excuse that good branding was ever too expensive.",                                                   content:"The democratisation of design tools has been happening for 20 years. What AI has done is accelerate it.\n\nBut tools don't make brands. Thinking makes brands. And that's where small businesses still struggle — not with execution, but with strategy.", featured:true },
  { id:"bp3", title:"Why Visual Consistency Builds Brand Trust Faster",tag:"Design",    date:"Feb 10, 2025", readTime:"4 min read", summary:"Before you spend on advertising, make sure every touchpoint says the same thing.",                                                                        content:"We had a client who'd spent ₦2M on a campaign that underperformed. When we audited their brand, we found 6 different logo versions in active use.\n\nVisual consistency is not a cosmetic issue. It's a trust issue.", featured:true },
  { id:"bp4", title:"Branding on a Budget: What to Prioritise First", tag:"Branding",   date:"Jan 22, 2025", readTime:"7 min read", summary:"You don't need a ₦2M brand identity to start. Here's the order we'd recommend.",                                                                       content:"Not every business can spend ₦800K on a full brand identity. That's fine.\n\nHere's the order we'd prioritise if budget is tight: A clear scalable mark. One or two brand colours. A consistent typeface. A tone of voice document.", featured:true },
  { id:"bp5", title:"The Brief is the Brief",                         tag:"Process",    date:"Jan 5, 2025",  readTime:"5 min read", summary:"The best designers are also the best listeners.",                                                                                                        content:"Bad briefs produce bad work. What's less obvious is that bad briefs are usually the designer's fault.\n\n'We want a new logo' is not a brief. 'We need an identity that positions us as the premium option' — that's a brief.", featured:false },
  { id:"bp6", title:"Print Is Not Dead. Bad Print Is Dead.",          tag:"Print",      date:"Dec 15, 2024", readTime:"4 min read", summary:"Every time someone tells us print is dying, we're in the middle of a great print project.",                                                               content:"The narrative that print is irrelevant is spread by people who've only ever seen bad print.\n\nA well-designed brochure placed in the right hands is one of the most effective sales tools that exists.", featured:false },
];

/* ═══════════════════════════════════════════════
   DATA HOOK  — polls Supabase, falls back to defaults
   · Only polls when the tab is visible
   · 30s interval (was 10s)
═══════════════════════════════════════════════ */
function useData() {
  const [ready,       setReady]       = useState(false);
  const [brands,      setBrands]      = useState(DEFAULT_BRANDS);
  const [hero,        setHero]        = useState(DEFAULT_HERO);
  const [brandBar,    setBrandBar]    = useState(DEFAULT_BRAND_BAR);
  const [metrics,     setMetrics]     = useState(DEFAULT_METRICS);
  const [caseStudies, setCaseStudies] = useState(DEFAULT_CASE_STUDIES);
  const [blogPosts,   setBlogPosts]   = useState(DEFAULT_BLOG_POSTS);

  useEffect(() => {
    async function poll(isFirst) {
      try {
        const [cfg, br, cs, bp] = await Promise.all([
          sbGet("site_config",  "select=key,value"),
          sbGet("brands",       "select=*&order=display_order.asc"),
          sbGet("case_studies", "select=*&order=display_order.asc&published=eq.true"),
          sbGet("blog_posts",   "select=*&order=display_order.asc&published=eq.true"),
        ]);
        if (Array.isArray(cfg)) cfg.forEach(r => {
          if (r.key === "hero")      setHero(r.value);
          if (r.key === "brand_bar") setBrandBar(r.value);
          if (r.key === "metrics")   setMetrics(r.value);
        });
        if (Array.isArray(br)) setBrands(br.length ? br.map(b => ({ id:b.id, name:b.name, logoUrl:b.logo_url })) : DEFAULT_BRANDS);
        if (Array.isArray(cs)) setCaseStudies(cs.length ? cs.map(c => ({ id:c.id, slug:c.slug||c.id, title:c.title, category:c.category, year:c.year, hero:c.hero_color, summary:c.excerpt||c.summary, challenge:c.challenge, approach:c.approach, result:c.results||c.result, tags:c.tags ? (typeof c.tags==="string"?c.tags.split(",").map(t=>t.trim()):c.tags) : [], featured:c.featured, coverImage:c.cover_image })) : DEFAULT_CASE_STUDIES);
        if (Array.isArray(bp)) setBlogPosts(bp.length ? bp.map(b => ({ id:b.id, slug:b.slug||b.id, title:b.title, tag:b.category||b.tag, date:b.date||new Date(b.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}), readTime:b.read_time||"5 min read", summary:b.excerpt||b.summary, content:b.content, featured:b.featured, coverImage:b.cover_image })) : DEFAULT_BLOG_POSTS);
      } catch(e) { console.error("Supabase fetch error:", e); }
      if (isFirst) setReady(true);
    }
    poll(true);
    const iv = setInterval(() => { if (document.visibilityState === "visible") poll(false); }, 60000);
    return () => clearInterval(iv);
  }, []);

  return { ready, brands, hero, brandBar, metrics, caseStudies, blogPosts };
}

/* ═══════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════ */
const Styles = memo(function Styles() {
  return (
    <style>{`
      *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}

      :root{
        --bg:#0a0a0a;--s1:#111111;--s2:#161616;--s3:#1e1e1e;
        --bd:rgba(255,255,255,0.07);--bd2:rgba(255,255,255,0.12);
        --text:#f0ece6;--text-dim:rgba(240,236,230,0.72);--text-muted:rgba(240,236,230,0.48);
        --surface:rgba(255,255,255,0.03);--surface-hover:rgba(255,255,255,0.055);
        --nav-blur:rgba(10,10,10,0.88);
        --pink:#ff2d78;--yellow:#FFDE21;--cyan:#00c8e0;--purple:#a855f7;
        --always-white:#fff;--always-dark:#0a0a0a;
      }
      [data-theme="light"]{
        --bg:#f7f4f0;--s1:#eeebe6;--s2:#e5e1db;--s3:#dbd7d1;
        --bd:rgba(0,0,0,0.08);--bd2:rgba(0,0,0,0.14);
        --text:#111111;--text-dim:rgba(17,17,17,0.68);--text-muted:rgba(17,17,17,0.50);
        --surface:rgba(0,0,0,0.03);--surface-hover:rgba(0,0,0,0.055);
        --nav-blur:rgba(247,244,240,0.92);
        --pink:#d41e52;--yellow:#5C5C5C;--cyan:#007f8f;--purple:#7c2fc4;
      }

      html{scroll-behavior:smooth;background:var(--bg);}
      body{background:var(--bg);color:var(--text);font-family:-apple-system,'SF Pro Text','SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif;overflow-x:hidden;min-width:320px;-webkit-font-smoothing:antialiased;}
      *{transition:background-color .15s ease,border-color .15s ease,color .15s ease;}
      button,a,input,textarea,select{transition:background-color .15s ease,border-color .15s ease,color .15s ease,opacity .15s ease,transform .15s ease,filter .15s ease;}
      a{text-decoration:none;color:inherit;}
      button{cursor:pointer;font-family:-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif;}

      .dn{font-family:-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif;font-weight:800;letter-spacing:-.03em;line-height:.92;}
      .label{font-size:11px;font-weight:600;letter-spacing:3px;text-transform:uppercase;color:var(--text-muted);}
      .wrap{max-width:1280px;margin:0 auto;padding:0 48px;}
      .wrap-sm{max-width:860px;margin:0 auto;padding:0 48px;}

      .pill{display:inline-flex;align-items:center;padding:5px 14px;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;border-radius:100px;}
      .pill-pink{background:rgba(255,45,120,.12);color:var(--pink);border:1px solid rgba(255,45,120,.25);}
      .pill-yellow{background:rgba(255,222,33,.12);color:var(--yellow);border:1px solid rgba(255,222,33,.3);}
      .pill-cyan{background:rgba(0,200,224,.1);color:var(--cyan);border:1px solid rgba(0,200,224,.25);}
      .pill-white{background:var(--surface);color:var(--text-dim);border:1px solid var(--bd2);}

      .btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;font-size:14px;font-weight:500;border:none;cursor:pointer;transition:opacity .15s,transform .15s,filter .15s;letter-spacing:-.01em;border-radius:100px;font-family:-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif;will-change:transform;}
      .btn-primary{background:var(--text);color:var(--bg);}
      .btn-primary:hover{opacity:.85;transform:translateY(-1px);}
      .btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--bd2);}
      .btn-ghost:hover{background:var(--surface-hover);}
      .btn-pink{background:var(--pink);color:#fff!important;}
      .btn-pink:hover{filter:brightness(1.1);transform:translateY(-1px);}
      .btn-sm{padding:10px 20px;font-size:13px;}

      .glass{background:var(--surface);border:1px solid var(--bd);contain:layout style;}
      .glass:hover{background:var(--surface-hover);border-color:var(--bd2);}

      .theme-btn{display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:100px;border:1px solid var(--bd2);background:var(--surface);color:var(--text-dim);font-size:14px;cursor:pointer;flex-shrink:0;}
      .theme-btn:hover{background:var(--surface-hover);color:var(--text);}

      /* Navbar logo - always shows full color */
      .nav-logo-link{display:flex;align-items:center;}

      /* Brand marquee logos - greyscale on scroll, color on hover */
      .brand-marquee-item{transition:filter .4s cubic-bezier(.4,0,.2,1),opacity .4s;}
      .brand-marquee-item img{filter:grayscale(1);opacity:.35;transition:filter .4s cubic-bezier(.4,0,.2,1),opacity .4s;}
      .brand-marquee-item span{transition:color .4s,opacity .4s;}
      .brand-marquee-item:hover img{filter:grayscale(0)!important;opacity:1!important;}
      .brand-marquee-item:hover span{color:var(--text)!important;opacity:1!important;}

      /* Blog card thumbnails */
      .blog-thumb{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s cubic-bezier(.4,0,.2,1);}
      .blog-thumb-wrap:hover .blog-thumb{transform:scale(1.06);}

      @keyframes marquee{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
      @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
      .fu{animation:fadeUp .65s cubic-bezier(.22,1,.36,1) both;}
      .d1{animation-delay:.08s;}.d2{animation-delay:.18s;}.d3{animation-delay:.28s;}.d4{animation-delay:.4s;}
      @keyframes pulseH{0%,100%{opacity:.25;}50%{opacity:1;}}

      /* Section reveal on scroll */
      .section-reveal{opacity:0;transform:translateY(32px);transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1);}
      .section-reveal.visible{opacity:1;transform:translateY(0);}

      /* Elevated glass cards */
      .glass{transition:background-color .2s,border-color .2s,transform .3s,box-shadow .3s;}
      .glass:hover{transform:translateY(-3px);box-shadow:0 8px 32px rgba(0,0,0,.12);}

      /* Smoother button hovers */
      .btn{transition:opacity .2s,transform .2s,filter .2s,box-shadow .2s;}
      .btn-primary:hover{opacity:.9;transform:translateY(-2px);box-shadow:0 4px 20px rgba(0,0,0,.15);}
      .btn-pink:hover{filter:brightness(1.08);transform:translateY(-2px);box-shadow:0 4px 20px rgba(255,45,120,.25);}

      .faq-item{border-bottom:1px solid var(--bd);}
      .faq-item:first-child{border-top:1px solid var(--bd);}
      .faq-btn{width:100%;display:flex;align-items:center;justify-content:space-between;padding:22px 0;background:none;border:none;cursor:pointer;text-align:left;gap:16px;}
      .faq-q{font-size:16px;font-weight:600;color:var(--text);line-height:1.4;font-family:-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif;}
      .faq-chevron{flex-shrink:0;width:24px;height:24px;border-radius:50%;border:1px solid var(--bd2);display:flex;align-items:center;justify-content:center;color:var(--text-dim);font-size:11px;transition:transform .3s;}
      .faq-body{font-size:14.5px;color:var(--text-dim);line-height:1.85;padding-bottom:22px;max-width:680px;}

      @media(max-width:860px){
        .wrap,.wrap-sm{padding:0 18px!important;}
        .hide-mob{display:none!important;}
        .mob-col{flex-direction:column!important;}
        .mob-grid1{grid-template-columns:1fr!important;}
        .mob-full{width:100%!important;}
        .mob-center{text-align:center!important;align-items:center!important;}
        .mob-stack{flex-direction:column!important;align-items:stretch!important;}
        .prob-row{grid-template-columns:40px 1fr 40px!important;gap:16px!important;}
        .prob-fix-col{display:none!important;}
        .prob-acc-inner{padding-left:0!important;}
        .proc-sticky{position:static!important;}
        .mob-hamburger{display:flex!important;}
      }
    `}</style>
  );
});

/* ═══════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════ */
const NAV_LINKS = [
  { label:"Branding",  path:"/services/branding" },
  { label:"Marketing", path:"/services/marketing" },
  { label:"Print",     path:"/services/print" },
  { label:"Tutoring",  path:"/services/tutoring" },
  { label:"Portfolio", path:"/portfolio" },
  { label:"Blog",      path:"/blog" },
  { label:"About",     path:"/about" },
];

const NAV_PILL = memo(function NavPill({ navLinkStyle }) {
  return (
    <div className="hide-mob" style={{ display:"flex", gap:2, alignItems:"center", background:"var(--surface)", border:"1px solid var(--bd)", borderRadius:100, padding:"4px 5px" }}>
      {NAV_LINKS.map(l => (
        <NavLink key={l.path} to={l.path} style={navLinkStyle}>{l.label}</NavLink>
      ))}
    </div>
  );
});

function Navbar({ theme, toggleTheme }) {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const close = useCallback(() => { setOpen(false); window.scrollTo(0, 0); }, []);

  const navLinkStyle = useCallback(({ isActive }) => ({
    background: isActive ? "var(--surface-hover)" : "none",
    border: "none", color: isActive ? "var(--text)" : "var(--text-dim)",
    padding: "7px 15px", fontSize: 13, fontWeight: 500, borderRadius: 100,
    cursor: "pointer", textDecoration: "none", display: "inline-block",
    fontFamily: "-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif",
  }), []);

  return (
    <nav style={{
      position:"fixed", top:0, left:0, right:0, zIndex:500,
      background: scrolled ? "var(--nav-blur)" : "transparent",
      borderBottom: scrolled ? "1px solid var(--bd)" : "1px solid transparent",
      backdropFilter: scrolled ? "blur(20px) saturate(1.6)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.6)" : "none",
      transition: "background .35s, border-color .35s",
    }}>
      <div className="wrap" style={{ height:66, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <Link to="/" onClick={close} className="nav-logo-link">
          <img
            src={theme === "dark" ? "/logo-white.svg" : "/logo-black.svg"}
            alt="1204Studios"
            style={{ height:28, width:"auto", display:"block" }}
          />
        </Link>
        <div className="hide-mob" style={{ display:"flex", gap:2, alignItems:"center", background:"var(--surface)", border:"1px solid var(--bd)", borderRadius:100, padding:"5px 6px" }}>
          {NAV_LINKS.map(l => (
            <NavLink key={l.path} to={l.path} onClick={close} style={navLinkStyle}>{l.label}</NavLink>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <button onClick={toggleTheme} className="theme-btn hide-mob" title="Toggle theme">
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <Link to="/book-call" onClick={close} className="btn btn-ghost btn-sm hide-mob" style={{marginRight:6}}>Book a Call</Link><Link to="/contact" onClick={close} className="btn btn-primary btn-sm hide-mob">Start a Project →</Link>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background:"var(--surface)", border:"1px solid var(--bd)", borderRadius:8, padding:"10px 12px", display:"none", flexDirection:"column", gap:4.5 }}
            className="mob-hamburger">
            <span style={{ display:"block", width:18, height:1.5, background:"var(--text)" }}/>
            <span style={{ display:"block", width:14, height:1.5, background:"var(--text)" }}/>
            <span style={{ display:"block", width:18, height:1.5, background:"var(--text)" }}/>
          </button>
        </div>
      </div>
      {open && (
        <div style={{ background:"var(--nav-blur)", backdropFilter:"blur(20px)", WebkitBackdropFilter:"blur(20px)", borderTop:"1px solid var(--bd)", padding:"20px 18px 28px", display:"flex", flexDirection:"column", gap:2 }}>
          {[{ label:"Home", path:"/" }, ...NAV_LINKS, { label:"Book a Call", path:"/book-call" }, { label:"Contact", path:"/contact" }].map(l => (
            <NavLink key={l.path} to={l.path} onClick={close} style={({ isActive }) => ({
              background:"none", border:"none", color: isActive ? "var(--text)" : "var(--text-dim)",
              fontSize:18, fontWeight:600, padding:"12px 4px", textAlign:"left",
              fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif",
              borderBottom:"1px solid var(--bd)", cursor:"pointer", textDecoration:"none", display:"block",
            })}>{l.label}</NavLink>
          ))}
          <button onClick={toggleTheme} style={{ background:"none", border:"none", color:"var(--text-dim)", fontSize:14, fontWeight:500, padding:"14px 4px", textAlign:"left", cursor:"pointer" }}>
            {theme === "dark" ? "☀  Switch to Light Mode" : "☾  Switch to Dark Mode"}
          </button>
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════
   HERO SECTION
═══════════════════════════════════════════════ */
function HeroSection({ hero }) {
  const go    = useGo();
  const words = useMemo(() => hero.headline.trim().split(" "), [hero.headline]);
  return (
    <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", justifyContent:"center", paddingTop:66, position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:"var(--bg)", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", opacity:.03, pointerEvents:"none", willChange:"auto" }}/>
        <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", filter:"blur(130px)", top:"50%", left:"38%", transform:"translate(-50%,-50%)", background:"var(--pink)", opacity:.07, pointerEvents:"none" }}/>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(var(--bd) 1px,transparent 1px),linear-gradient(90deg,var(--bd) 1px,transparent 1px)", backgroundSize:"52px 52px", opacity:.4, pointerEvents:"none" }}/>
      </div>
      <div className="wrap" style={{ position:"relative", zIndex:1, padding:"80px 48px 100px" }}>
        <div style={{ marginBottom:24 }}>
          <span className="pill pill-pink fu">Creative &amp; Marketing Studio · Lagos</span>
        </div>
        <h1 className="dn fu" style={{ fontSize:"clamp(40px,7.5vw,108px)", color:"var(--text)", maxWidth:"100%", marginBottom:36, overflowWrap:"break-word" }}>
          {words.map((w, i) => (
            <span key={i} style={{ display:"inline-block", marginRight:"0.25em", color:i === words.length - 1 ? "var(--pink)" : "var(--text)" }}>{w}</span>
          ))}
        </h1>
        <p style={{ fontSize:"clamp(14px,1.5vw,19px)", color:"var(--text-dim)", maxWidth:"min(520px,100%)", lineHeight:1.75, marginBottom:44 }} className="fu d2">
          {hero.subtext}
        </p>
        <div style={{ display:"flex", gap:12, flexWrap:"wrap" }} className="fu d3">
          <button onClick={() => go("Contact")} className="btn btn-primary">{hero.cta1}</button>
          <Link to="/book-call" className="btn btn-ghost">Book a Call →</Link>
          <button onClick={() => go("Portfolio")} className="btn btn-ghost">{hero.cta2}</button>
        </div>
        <div style={{ marginTop:72, display:"flex", alignItems:"center", gap:12 }} className="fu d4">
          <div style={{ width:1, height:52, background:"linear-gradient(to bottom,var(--pink),transparent)", animation:"pulseH 2s ease infinite" }}/>
          <span style={{ fontSize:11, color:"var(--text-muted)", letterSpacing:2, textTransform:"uppercase" }}>Scroll to explore</span>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   PROBLEM STATEMENTS
═══════════════════════════════════════════════ */
const PROBLEMS = [
  { num:"01", accent:"#ff2d78", page:"Marketing", label:"Marketing",      problem:"Most marketing in Nigeria is done without research.",              detail:"Budgets are spent on vibes, not strategy. Campaigns launch without a clear audience, a defined message, or any way to measure success. The spend happens. The results don't.",                                       fix:"We build campaigns backwards — from the audience in, not the brief out. Every naira traced to a reason." },
  { num:"02", accent:"#FFDE21", page:"Branding",  label:"Brand Design",   problem:"Designs are made without understanding the problem.",              detail:"Most Nigerian businesses get logos, not brands. A designer picks a font, ships something that looks fine but means nothing — and falls apart the moment it's applied anywhere real.",                              fix:"We start with positioning, not pixels. The visual system comes last — after we understand who you are, who you're for, and what you're trying to say." },
  { num:"03", accent:"#00c8e0", page:"Print",     label:"Print Media",    problem:"Print is produced without attention to detail.",                   detail:"Blurry logos. Wrong colour profiles. Fonts that pixelate at scale. Nigerian businesses are losing deals because their print looks cheap — even when their product isn't.",                                      fix:"We treat print with digital-grade rigour. Correct colour modes, proper bleed, production-ready files, and vendor management from spec to delivery." },
  { num:"04", accent:"#a855f7", page:"Tutoring",  label:"Next Generation",problem:"Everyone is working. Nobody is building a pipeline.",              detail:"Design studios are packed with talent — but most of it was self-taught with no structure and no mentorship. When those people leave, the knowledge leaves with them.",                                          fix:"We run structured programmes that produce job-ready creatives — people who understand the thinking behind great work, not just the tools." },
];

function ProblemStatements() {
  const go = useGo();
  const [openIdx, setOpenIdx] = useState(null);
  const toggle = useCallback(i => setOpenIdx(prev => prev === i ? null : i), []);
  const revealRef = useSectionReveal();

  return (
    <section ref={revealRef} className="section-reveal" style={{ background:"var(--s1)", borderTop:"1px solid var(--bd)", padding:"100px 0", contentVisibility:"auto", containIntrinsicSize:"0 600px" }}>
      <div className="wrap">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:64, alignItems:"end", marginBottom:64 }} className="mob-grid1">
          <div>
            <span className="label">Why We Exist</span>
            <h2 className="dn" style={{ fontSize:"clamp(36px,5vw,72px)", color:"var(--text)", marginTop:12, lineHeight:.9 }}>
              Broken in<br /><span style={{ color:"var(--pink)" }}>four ways.</span>
            </h2>
          </div>
          <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.85, paddingBottom:4 }}>
            The creative industry in Nigeria has the same problems everywhere you look. We built 1204Studios to fix them — one client, one student, one campaign at a time.
          </p>
        </div>
        <div>
          {PROBLEMS.map((p, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} style={{ borderTop:"1px solid var(--bd)", ...(i === PROBLEMS.length - 1 && { borderBottom:"1px solid var(--bd)" }) }}>
                <div onClick={() => toggle(i)} style={{ display:"grid", gridTemplateColumns:"52px 1fr 1fr 40px", gap:32, alignItems:"center", padding:"32px 0", cursor:"pointer" }} className="prob-row">
                  <span className="dn" style={{ fontSize:40, color:p.accent, opacity:.3, lineHeight:1 }}>{p.num}</span>
                  <div>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:p.accent, display:"block", marginBottom:8 }}>{p.label}</span>
                    <h3 style={{ fontWeight:700, fontSize:"clamp(15px,1.6vw,20px)", color:"var(--text)", lineHeight:1.2, fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif" }}>{p.problem}</h3>
                  </div>
                  <div className="prob-fix-col" style={{ paddingLeft:24, borderLeft:"1px solid var(--bd)" }}>
                    <span style={{ fontSize:10, fontWeight:700, letterSpacing:2.5, textTransform:"uppercase", color:"var(--text-muted)", display:"block", marginBottom:8 }}>How We Fix It</span>
                    <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.8 }}>{p.fix}</p>
                  </div>
                  <div onClick={e => { e.stopPropagation(); go(p.page); }}
                    style={{ width:36, height:36, borderRadius:"50%", border:`1px solid ${p.accent}40`, display:"flex", alignItems:"center", justifyContent:"center", color:p.accent, fontSize:13, transition:"transform .3s", transform:isOpen ? "rotate(90deg)" : "none", flexShrink:0, cursor:"pointer" }}>→</div>
                </div>
                <div style={{ overflow:"hidden", maxHeight:isOpen ? "400px" : "0", transition:"max-height .4s cubic-bezier(.4,0,.2,1)" }}>
                  <div style={{ padding:"0 0 28px 0", paddingLeft:"calc(52px + 32px)" }} className="prob-acc-inner">
                    <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.85, marginBottom:16 }}>{p.detail}</p>
                    <div style={{ background:`${p.accent}10`, border:`1px solid ${p.accent}25`, borderRadius:6, padding:"16px 18px", marginBottom:16 }}>
                      <span style={{ fontSize:10, fontWeight:700, letterSpacing:2, textTransform:"uppercase", color:p.accent, display:"block", marginBottom:6 }}>How We Fix It</span>
                      <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.8 }}>{p.fix}</p>
                    </div>
                    <button onClick={() => go(p.page)} className="btn btn-ghost btn-sm" style={{ fontSize:12 }}>Explore {p.label} →</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <style>{`@media(min-width:861px){.prob-fix-col{display:block!important;}.prob-accordion{display:none!important;}}`}</style>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   BRAND BAR
═══════════════════════════════════════════════ */
const BrandBar = memo(function BrandBar({ brands, brandBar }) {
  const doubled = useMemo(() => [...brands, ...brands], [brands]);
  return (
    <section style={{ background:"var(--s1)", borderTop:"1px solid var(--bd)", borderBottom:"1px solid var(--bd)", padding:"60px 0" }}>
      <div className="wrap" style={{ marginBottom:32 }}>
        <p style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:700, fontSize:"clamp(18px,2.5vw,28px)", color:"var(--text-dim)", letterSpacing:"-.02em" }}>
          {brandBar.heading}
        </p>
        <p style={{ fontSize:13.5, color:"var(--text-muted)", marginTop:6, fontStyle:"italic" }}>{brandBar.sub}</p>
      </div>
      <div className="brand-marquee-track" style={{ overflow:"hidden", maskImage:"linear-gradient(to right,transparent,black 8%,black 92%,transparent)", WebkitMaskImage:"linear-gradient(to right,transparent,black 8%,black 92%,transparent)", contain:"layout" }}>
        <div className="brand-marquee-inner" style={{ display:"flex", width:"max-content", animation:"marquee 40s linear infinite", willChange:"transform" }}>
          {doubled.map((b, i) => (
            <div key={i} className="brand-marquee-item" style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"0 40px", borderRight:"1px solid var(--bd)", width:150, height:52, flexShrink:0, cursor:"default" }}>
              {b.logoUrl
                ? <img src={b.logoUrl} alt={b.name} loading="lazy" width="100" height="36" style={{ maxHeight:36, maxWidth:100, objectFit:"contain" }}/>
                : <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:700, fontSize:16, color:"var(--text-muted)", letterSpacing:"-.01em", whiteSpace:"nowrap" }}>{b.name}</span>}
            </div>
          ))}
        </div>
      </div>
      <style>{`.brand-marquee-track:hover .brand-marquee-inner{animation-play-state:paused;}`}</style>
    </section>
  );
});

/* ═══════════════════════════════════════════════
   METRICS CAROUSEL
═══════════════════════════════════════════════ */
function MetricsCarousel({ metrics }) {
  const [active, setActive] = useState(0);
  const timer = useRef(null);

  const start = useCallback(() => {
    clearInterval(timer.current);
    timer.current = setInterval(() => setActive(a => (a + 1) % metrics.length), 4500);
  }, [metrics.length]);

  useEffect(() => { start(); return () => clearInterval(timer.current); }, [start]);

  const goTo = useCallback(i => { setActive(i); start(); }, [start]);
  const m = metrics[active];
  if (!m) return null;

  return (
    <section style={{ background:"var(--bg)", borderTop:"1px solid var(--bd)", padding:"120px 0", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", inset:0, background:`radial-gradient(ellipse 60% 60% at 70% 50%, ${m.accent}0e 0%, transparent 70%)`, transition:"background .8s", pointerEvents:"none" }}/>
      <div className="wrap" style={{ position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:64, gap:24, flexWrap:"wrap" }}>
          <div>
            <span className="label" style={{ color:"var(--text-muted)" }}>Our Impact</span>
            <h2 className="dn" style={{ fontSize:"clamp(40px,6vw,72px)", color:"var(--text)", marginTop:12 }}>Work that<br />moves Nigeria.</h2>
          </div>
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            {metrics.map((item, i) => (
              <button key={item.id} onClick={() => goTo(i)} style={{
                padding:"8px 18px", fontSize:12.5, fontWeight:600, fontFamily:"-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif",
                border:`1px solid ${i === active ? item.accent + "60" : "var(--bd)"}`,
                borderRadius:100, background:i === active ? `${item.accent}15` : "var(--surface)",
                color:i === active ? item.accent : "var(--text-dim)", cursor:"pointer", transition:"all .25s",
              }}>{item.service}</button>
            ))}
          </div>
        </div>
        <div key={active} style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:56, alignItems:"center", animation:"fadeUp .5s ease" }} className="mob-grid1">
          <div>
            <div style={{ width:40, height:3, background:m.accent, marginBottom:28 }}/>
            <h3 className="dn" style={{ fontSize:"clamp(28px,4vw,52px)", color:"var(--text)", lineHeight:.95, marginBottom:20 }}>{m.headline}</h3>
            <p style={{ fontSize:15.5, color:"var(--text-dim)", lineHeight:1.8, maxWidth:400, marginBottom:36 }}>{m.body}</p>
            <div style={{ display:"flex", gap:10, alignItems:"center" }}>
              {metrics.map((_, i) => (
                <button key={i} onClick={() => goTo(i)} style={{ width:i === active ? 28 : 7, height:7, background:i === active ? m.accent : "var(--bd2)", border:"none", cursor:"pointer", transition:"all .4s", borderRadius:4, padding:0 }}/>
              ))}
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:3 }}>
            {m.stats.map((s, i) => (
              <div key={i} className="glass" style={{ padding:"28px 24px", position:"relative" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:2, background:i === 0 ? m.accent : "transparent" }}/>
                <div className="dn" style={{ fontSize:"clamp(30px,4vw,48px)", color:m.accent, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontSize:12.5, color:"var(--text-dim)", marginTop:8 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════
   CASE STUDY CARD
═══════════════════════════════════════════════ */
const CSCard = memo(function CSCard({ cs, onClick }) {
  return (
    <div onClick={onClick} style={{ background:cs.hero || "var(--s2)", border:"1px solid var(--bd)", cursor:"pointer", transition:"transform .3s, border-color .3s, box-shadow .3s", position:"relative", overflow:"hidden", minHeight:240, borderRadius:2 }}
      onMouseOver={e => { e.currentTarget.style.borderColor = "rgba(255,45,120,.3)"; e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,.2)"; }}
      onMouseOut={e => { e.currentTarget.style.borderColor = "var(--bd)"; e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "none"; }}>
      {cs.coverImage && (
        <div style={{ height:220, overflow:"hidden", position:"relative" }}>
          <img src={cs.coverImage} alt={cs.title} loading="lazy"
            style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"transform .5s cubic-bezier(.4,0,.2,1)" }}
            onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"} />
          <div style={{ position:"absolute", inset:0, background:`linear-gradient(to bottom, transparent 30%, ${cs.hero || "var(--s2)"} 100%)`, pointerEvents:"none" }}/>
        </div>
      )}
      <div style={{ padding:36, position:"relative" }}>
        <span className="pill pill-pink" style={{ marginBottom:16, display:"inline-block" }}>{cs.category}</span>
        <h3 style={{ fontWeight:700, fontSize:"clamp(17px,2vw,22px)", color:"#fff", marginBottom:10, lineHeight:1.2 }}>{cs.title}</h3>
        <p style={{ fontSize:13.5, color:"rgba(255,255,255,0.7)", lineHeight:1.7, maxWidth:400 }}>{cs.summary}</p>
        <div style={{ marginTop:24, fontSize:13, color:"var(--pink)", fontWeight:600 }}>Read Case Study →</div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════
   FAQ
═══════════════════════════════════════════════ */
const FAQS = [
  { q:"How much does a branding project cost?",   a:"Brand identity projects start from ₦800,000 for a focused startup engagement and go up to ₦2,500,000+ for comprehensive systems with full brand guidelines, application design, and rollout support. We quote after a discovery call — complexity and scope determine the number." },
  { q:"How long does a typical project take?",    a:"A focused brand identity takes 4–6 weeks from brief to delivery. Marketing campaigns are typically 2–4 weeks to strategy and launch. Print projects depend on volume but are usually 1–3 weeks. Tutoring cohorts run in structured 4–12 week programmes." },
  { q:"Do you work with early-stage startups?",   a:"Yes. Some of our best work has been with founders before they had revenue. If you have a clear problem you're solving and a point of view, we can build a brand that opens doors. Budget doesn't have to be large — it has to be purposeful." },
  { q:"What information do you need to start?",   a:"A brief — even a rough one. Tell us what you're building, who it's for, what you want the brand or campaign to achieve, and what your budget range is. That's enough to have a useful first conversation. We send a structured brief template after initial contact." },
  { q:"Do you work with clients outside Lagos?",  a:"Yes. We've worked with clients across Nigeria and internationally. Most of our process works remotely — video calls, shared docs, and structured review sessions. Physical presence is only needed for print production oversight, which we manage on your behalf." },
  { q:"Can I hire 1204Studios on a retainer?",    a:"Yes. Retainer arrangements work well for growing businesses that need ongoing brand, marketing, or design support. We offer monthly retainers that cover a defined set of deliverables and a direct line to our team. Speak to us about what that looks like for your situation." },
];

const FAQ = memo(function FAQ() {
  const [open, setOpen] = useState(null);
  const toggle = useCallback(i => setOpen(prev => prev === i ? null : i), []);
  return (
    <section style={{ background:"var(--bg)", borderTop:"1px solid var(--bd)", padding:"100px 0" }}>
      <div className="wrap">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:80, alignItems:"start" }} className="mob-grid1">
          <div style={{ position:"sticky", top:120 }} className="proc-sticky">
            <span className="label">FAQ</span>
            <h2 className="dn" style={{ fontSize:"clamp(36px,5vw,64px)", color:"var(--text)", marginTop:12, lineHeight:.92 }}>
              Questions<br />we get a<br /><span style={{ color:"var(--pink)" }}>lot.</span>
            </h2>
            <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.85, marginTop:20, maxWidth:280 }}>
              Can't find what you need?{" "}
              <a href="mailto:hello@1204studios.com" style={{ color:"var(--pink)", borderBottom:"1px solid var(--pink)", paddingBottom:1 }}>hello@1204studios.com</a>
            </p>
          </div>
          <div>
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={i} className="faq-item">
                  <button className="faq-btn" onClick={() => toggle(i)}>
                    <span className="faq-q">{f.q}</span>
                    <span className="faq-chevron" style={{ transform:isOpen ? "rotate(135deg)" : "none" }}>+</span>
                  </button>
                  <div style={{ overflow:"hidden", maxHeight:isOpen ? "320px" : "0", transition:"max-height .38s cubic-bezier(.4,0,.2,1)" }}>
                    <p className="faq-body">{f.a}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
});

/* ═══════════════════════════════════════════════
   PAGE HERO TEMPLATE
═══════════════════════════════════════════════ */
/* ── SafeTitle: replaces dangerouslySetInnerHTML ──────────────
   Parses only <br/> and <span style="color:X"> from page hero
   title strings. All other content renders as plain text.
   XSS-safe: no raw HTML ever reaches the DOM.
────────────────────────────────────────────────────────────── */
function SafeTitle({ html, className, style }) {
  const SAFE_COLOR = /^[a-zA-Z0-9#(),.\s_%-]+$/;
  const tokens = String(html).split(/(<br\s*\/?>|<span[^>]*>[^<]*<\/span>)/gi);
  const parts  = tokens.map((tok, i) => {
    if (/^<br\s*\/?>$/i.test(tok)) return <br key={i} />;
    const m = tok.match(/^<span\s+style="color:([^"]+)">([^<]*)<\/span>$/i);
    if (m && SAFE_COLOR.test(m[1])) return <span key={i} style={{ color: m[1] }}>{m[2]}</span>;
    return tok ? <span key={i}>{tok}</span> : null;
  });
  return <h1 className={className} style={style}>{parts}</h1>;
}

const PageHero = memo(function PageHero({ label, title, accent = "#ff2d78", sub, children }) {
  return (
    <section style={{ background:"var(--bg)", paddingTop:140, paddingBottom:80, borderBottom:"1px solid var(--bd)", position:"relative", overflow:"hidden" }}>
      <div style={{ position:"absolute", width:600, height:600, borderRadius:"50%", filter:"blur(120px)", background:`${accent}0c`, top:"50%", right:0, transform:"translateY(-50%)", pointerEvents:"none" }}/>
      <div className="wrap" style={{ position:"relative", zIndex:1 }}>
        <span className="pill pill-white" style={{ marginBottom:20, display:"inline-block" }}>{label}</span>
        <SafeTitle html={title} className="dn" style={{ fontSize:"clamp(56px,9vw,120px)", color:"var(--text)", marginBottom:28 }} />
        {sub && <p style={{ fontSize:"clamp(16px,1.6vw,20px)", color:"var(--text-dim)", maxWidth:560, lineHeight:1.8 }}>{sub}</p>}
        {children}
      </div>
    </section>
  );
});

/* ═══════════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════════ */
const PROCESS_STEPS = [
  { n:"01", t:"Understand the Goal",  d:"We listen before we move. Every engagement starts with understanding your business, audience, and what success actually looks like." },
  { n:"02", t:"Define the Strategy",  d:"We translate your goals into a structured approach — informed by data, shaped by experience, built for your context." },
  { n:"03", t:"Design and Produce",   d:"Execution with intention. Every asset, pixel, and word is considered and deliberate." },
  { n:"04", t:"Launch and Refine",    d:"We ship, measure, and improve. Strategy without execution is theory. Execution without learning is waste." },
];

function Home({ brands, hero, brandBar, metrics, caseStudies, blogPosts }) {
  const go       = useGo();
  const navigate = useNavigate();

  const featuredCS = useMemo(() => caseStudies.filter(c => c.featured).slice(0, 4), [caseStudies]);
  const featuredBP = useMemo(() => blogPosts.filter(b => b.featured).slice(0, 4),   [blogPosts]);

  const orgSchema = useMemo(() => ({
    "@context":"https://schema.org", "@type":"Organization", "name":"1204Studios",
    "url":"https://1204studios.com", "logo":"https://1204studios.com/favicon.svg",
    "description":"A Lagos-based creative and marketing studio.",
    "address":{ "@type":"PostalAddress", "streetAddress":"22 Glover Road", "addressLocality":"Ikoyi, Lagos", "addressCountry":"NG" },
    "telephone":"+2349035583476",
    "contactPoint":{ "@type":"ContactPoint", "email":"hello@1204studios.com", "telephone":"+2349035583476", "contactType":"customer service" },
    "sameAs":["https://instagram.com/1204studios","https://twitter.com/1204studios","https://linkedin.com/company/1204studios"],
  }), []);

  const webSchema = useMemo(() => ({
    "@context":"https://schema.org", "@type":"WebSite", "name":"1204Studios", "url":"https://1204studios.com",
    "potentialAction":{ "@type":"SearchAction", "target":"https://1204studios.com/portfolio?q={search_term_string}", "query-input":"required name=search_term_string" },
  }), []);

  return (
    <div>
      <SEO />
      <JsonLD data={orgSchema} />
      <JsonLD data={webSchema} />
      <HeroSection hero={hero} />
      <ProblemStatements />
      <BrandBar brands={brands} brandBar={brandBar} />
      <MetricsCarousel metrics={metrics} />

      {/* Featured Case Studies */}
      {featuredCS.length > 0 && (
        <section style={{ background:"var(--s1)", borderTop:"1px solid var(--bd)", padding:"120px 0" }}>
          <div className="wrap">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:56, flexWrap:"wrap", gap:20 }}>
              <div>
                <span className="label" style={{ color:"var(--text-muted)" }}>Selected Work</span>
                <h2 className="dn" style={{ fontSize:"clamp(40px,6vw,72px)", color:"var(--text)", marginTop:10 }}>Featured<br />Case Studies</h2>
              </div>
              <button onClick={() => go("Portfolio")} className="btn btn-ghost">All Work →</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:featuredCS.length >= 3 ? "1fr 1fr" : "1fr", gap:3 }} className="mob-grid1">
              {featuredCS.map(cs => <CSCard key={cs.id} cs={cs} onClick={() => { navigate("/portfolio/" + cs.id); window.scrollTo(0, 0); }} />)}
            </div>
          </div>
        </section>
      )}

      {/* Process */}
      <section style={{ background:"var(--bg)", borderTop:"1px solid var(--bd)", padding:"120px 0" }}>
        <div className="wrap">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:80, alignItems:"start" }} className="mob-grid1">
            <div className="proc-sticky" style={{ position:"sticky", top:100 }}>
              <span className="label" style={{ color:"var(--text-muted)" }}>How We Work</span>
              <h2 className="dn" style={{ fontSize:"clamp(40px,5vw,68px)", color:"var(--text)", marginTop:10 }}>Our<br />Process</h2>
              <div style={{ width:40, height:3, background:"var(--pink)", margin:"24px 0" }}/>
              <p style={{ fontSize:15, color:"var(--text-dim)", lineHeight:1.8 }}>Structured from the start. Great work doesn't happen by accident.</p>
            </div>
            <div>
              {PROCESS_STEPS.map((p, i) => (
                <div key={i} style={{ display:"grid", gridTemplateColumns:"64px 1fr", gap:24, alignItems:"start", padding:"32px 0", borderBottom:"1px solid var(--bd)" }}>
                  <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:800, fontSize:48, color:"var(--pink)", lineHeight:1, opacity:.6 }}>{p.n}</span>
                  <div>
                    <h3 style={{ fontWeight:700, fontSize:18, marginBottom:10, color:"var(--text)" }}>{p.t}</h3>
                    <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.8 }}>{p.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blog */}
      {featuredBP.length > 0 && (
        <section style={{ background:"var(--s1)", borderTop:"1px solid var(--bd)", padding:"120px 0" }}>
          <div className="wrap">
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:56, flexWrap:"wrap", gap:20 }}>
              <div>
                <span className="label" style={{ color:"var(--text-muted)" }}>Latest Thinking</span>
                <h2 className="dn" style={{ fontSize:"clamp(40px,6vw,72px)", color:"var(--text)", marginTop:10 }}>From<br />the Blog</h2>
              </div>
              <button onClick={() => go("Blog")} className="btn btn-ghost">All Posts →</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))", gap:3 }}>
              {featuredBP.map(post => {
                const tagColors = { Marketing:"#ff2d78", Technology:"#00c8e0", Design:"#a855f7", Branding:"#ff2d78", Process:"#FFDE21", Print:"#00c8e0" };
                const accent = tagColors[post.tag] || "#ff2d78";
                return (
                <div key={post.id} className="glass blog-thumb-wrap" style={{ cursor:"pointer", transition:"transform .3s, background .2s", overflow:"hidden" }}
                  onClick={() => { navigate("/blog/" + post.id); window.scrollTo(0, 0); }}
                  onMouseOver={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                  onMouseOut={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.transform = ""; }}>
                  {post.coverImage ? (
                    <div style={{ height:160, overflow:"hidden", position:"relative" }}>
                      <img src={post.coverImage} alt={post.title} loading="lazy" className="blog-thumb" />
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, var(--s1) 100%)", pointerEvents:"none" }}/>
                    </div>
                  ) : (
                    <div style={{ height:120, overflow:"hidden", position:"relative", background:`linear-gradient(135deg, ${accent}18 0%, ${accent}08 50%, var(--s1) 100%)` }}>
                      <div style={{ position:"absolute", width:120, height:120, borderRadius:"50%", background:`${accent}10`, top:-30, right:-20 }}/>
                      <div style={{ position:"absolute", width:60, height:60, borderRadius:"50%", background:`${accent}08`, bottom:10, left:20 }}/>
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:40, background:"linear-gradient(to bottom, transparent, var(--s1))" }}/>
                    </div>
                  )}
                  <div style={{ padding:"20px 24px 28px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                      <span className="pill pill-pink" style={{ fontSize:10 }}>{post.tag}</span>
                      <span style={{ fontSize:11.5, color:"var(--text-muted)" }}>{post.readTime}</span>
                    </div>
                    <h3 style={{ fontWeight:700, fontSize:16, lineHeight:1.35, marginBottom:12, color:"var(--text)" }}>{post.title}</h3>
                    <p style={{ fontSize:13, color:"var(--text-dim)", lineHeight:1.7 }}>{post.summary}</p>
                    <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:20, paddingTop:16, borderTop:"1px solid var(--bd)" }}>{post.date}</p>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Who We Are */}
      <section style={{ background:"var(--bg)", borderTop:"1px solid var(--bd)", padding:"120px 0" }}>
        <div className="wrap">
          <div style={{ marginBottom:64 }}>
            <span className="label" style={{ color:"var(--text-muted)" }}>Who We Are</span>
            <h2 className="dn" style={{ fontSize:"clamp(40px,5vw,68px)", color:"var(--text)", marginTop:10, maxWidth:700 }}>Technology-led.<br />Hands-on.<br /><span style={{ color:"var(--pink)" }}>Uncompromising.</span></h2>
            <div style={{ width:40, height:3, background:"var(--pink)", margin:"24px 0" }}/>
            <p style={{ fontSize:17, color:"var(--text-dim)", lineHeight:1.85, maxWidth:620, marginBottom:12 }}>
              We integrate AI and modern technology into every layer of how we work. It makes us faster, sharper, and more precise than studios twice our size. But speed without substance is noise.
            </p>
            <p style={{ fontSize:17, color:"var(--text-dim)", lineHeight:1.85, maxWidth:620, marginBottom:32 }}>
              That is why we still put our hands in the mud. Every pixel is placed with intention, every strategy is stress-tested by people who care, and every deliverable carries our signature attention to detail. The technology makes it efficient. The hands make it excellent.
            </p>
            <button onClick={() => go("About")} className="btn btn-ghost">More About Us →</button>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:3 }} className="mob-grid1">
            {[
              {
                num:"01", accent:"var(--pink)", title:"Technology & AI",
                desc:"We use AI-assisted research, automated workflows, and intelligent design tooling to compress timelines without compressing quality. What takes others weeks, we deliver in days.",
                detail:"Automated brand audits, AI-powered content analysis, intelligent colour systems, and data-led campaign strategy are built into our process from day one."
              },
              {
                num:"02", accent:"var(--cyan)", title:"Process & Precision",
                desc:"Technology means nothing without structure. Every project follows a deliberate process: research, strategy, execution, review. No shortcuts, no handwaving, no assumptions.",
                detail:"Structured briefs, milestone reviews, version-controlled deliverables, and transparent timelines. You always know where your project is and why."
              },
              {
                num:"03", accent:"var(--purple)", title:"Craft & Excellence",
                desc:"Automation handles the repetition. Humans handle the judgment. Every kerning pair, every colour value, every layout decision is made by someone who refuses to settle.",
                detail:"Our final output is never a first draft with filters on top. It is refined, reconsidered, and pressure-tested until it meets a standard most clients notice but cannot articulate."
              },
            ].map((item, i) => (
              <div key={i} className="glass" style={{ padding:"40px 32px", position:"relative", overflow:"hidden" }}>
                <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:item.accent }}/>
                <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:800, fontSize:52, color:`${item.accent}15`, lineHeight:1, display:"block", marginBottom:16 }}>{item.num}</span>
                <h3 style={{ fontWeight:700, fontSize:20, color:"var(--text)", marginBottom:12 }}>{item.title}</h3>
                <p style={{ fontSize:15, color:"var(--text-dim)", lineHeight:1.8, marginBottom:16 }}>{item.desc}</p>
                <div style={{ borderTop:"1px solid var(--bd)", paddingTop:16 }}>
                  <p style={{ fontSize:13, color:"var(--text-muted)", lineHeight:1.75 }}>{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FAQ />

      {/* CTA */}
      <section style={{ background:"var(--pink)", padding:"100px 0", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n2'%3E%3CfeTurbulence baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n2)'/%3E%3C/svg%3E\")", opacity:.04, pointerEvents:"none" }}/>
        <div className="wrap" style={{ textAlign:"center", position:"relative", zIndex:1 }}>
          <h2 className="dn" style={{ fontSize:"clamp(36px,8vw,100px)", color:"#fff", maxWidth:"100%", overflowWrap:"break-word" }}>Ready to move<br />differently?</h2>
          <p style={{ fontSize:"clamp(15px,1.6vw,18px)", color:"rgba(255,255,255,.85)", maxWidth:"min(460px,90%)", margin:"24px auto 44px", lineHeight:1.75 }}>Tell us about your project. We'll tell you exactly how we'd approach it.</p>
          <div style={{ display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap" }}>
            <button onClick={() => go("Contact")} className="btn" style={{ background:"var(--always-white)", color:"var(--pink)", padding:"16px 44px", fontSize:15 }}>Start a Project</button>
            <Link to="/book-call" className="btn" style={{ background:"transparent", color:"var(--always-white)", border:"2px solid rgba(255,255,255,.3)", padding:"16px 44px", fontSize:15 }}>Book a Call →</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PORTFOLIO
═══════════════════════════════════════════════ */
function Portfolio({ caseStudies }) {
  const navigate = useNavigate();
  useSEO();
  const [filter, setFilter] = useState("All");
  const cats     = useMemo(() => ["All", ...Array.from(new Set(caseStudies.map(c => c.category)))], [caseStudies]);
  const filtered = useMemo(() => filter === "All" ? caseStudies : caseStudies.filter(c => c.category === filter), [caseStudies, filter]);
  return (
    <div>
      <PageHero label="Our Work" title={`Selected<br/><span style="color:var(--pink)">Portfolio</span>`} sub="Real projects. Real problems. Real results." />
      <section style={{ background:"var(--bg)", padding:"80px 0" }}>
        <div className="wrap">
          <div style={{ display:"flex", gap:6, marginBottom:48, flexWrap:"wrap" }}>
            {cats.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{ padding:"8px 20px", border:"1px solid var(--bd)", borderRadius:100, background:filter === c ? "#fff" : "transparent", color:filter === c ? "#0a0a0a" : "var(--text-dim)", fontSize:13, fontWeight:500, fontFamily:"-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif", cursor:"pointer", transition:"all .2s" }}>{c}</button>
            ))}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:3 }}>
            {filtered.map(cs => <CSCard key={cs.id} cs={cs} onClick={() => { navigate("/portfolio/" + cs.id); window.scrollTo(0, 0); }} />)}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CASE STUDY DETAIL
═══════════════════════════════════════════════ */
function CaseStudyDetail({ id, caseStudies }) {
  const go = useGo();
  const cs = useMemo(() => caseStudies.find(c => c.id === id), [caseStudies, id]);
  useSEO(cs ? { title: cs.title + " — Case Study — 1204Studios", description: cs.summary } : {});
  if (!cs) return <div style={{ padding:"200px 40px", textAlign:"center" }}><Link to="/portfolio" className="btn btn-ghost">← Back</Link></div>;
  return (
    <div>
      <section style={{ background:cs.hero || "var(--bg)", paddingTop:140, paddingBottom:80, position:"relative" }}>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom,transparent 40%,var(--bg))" }}/>
        <div className="wrap" style={{ position:"relative", zIndex:1 }}>
          <button onClick={() => go("Portfolio")} className="btn btn-ghost btn-sm" style={{ marginBottom:28 }}>← Back to Work</button>
          <span className="pill pill-pink" style={{ marginBottom:20, display:"inline-block" }}>{cs.category}</span>
          <h1 className="dn" style={{ fontSize:"clamp(44px,7vw,88px)", color:"#fff" }}>{cs.title}</h1>
          <div style={{ display:"flex", gap:20, marginTop:24, flexWrap:"wrap" }}>
            {cs.tags?.map(t => <span key={t} className="pill pill-white">{t}</span>)}
            <span className="pill pill-white">{cs.year}</span>
          </div>
        </div>
      </section>
      <section style={{ background:"var(--bg)", padding:"80px 0" }}>
        <div className="wrap wrap-sm">
          <p style={{ fontSize:20, color:"var(--text-dim)", lineHeight:1.85, marginBottom:64 }}>{cs.summary}</p>
          {[{ l:"The Challenge", t:cs.challenge }, { l:"Our Approach", t:cs.approach }, { l:"The Result", t:cs.result }].map((s, i) => (
            <div key={i} style={{ marginBottom:52, paddingBottom:52, borderBottom:"1px solid var(--bd)" }}>
              <h3 style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:700, fontSize:13, letterSpacing:3, textTransform:"uppercase", color:"var(--text-muted)", marginBottom:20 }}>{s.l}</h3>
              <p style={{ fontSize:17, color:"var(--text-dim)", lineHeight:1.9 }}>{s.t}</p>
            </div>
          ))}
          <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
            <button onClick={() => go("Contact")} className="btn btn-primary">Start a Similar Project →</button>
            <button onClick={() => go("Portfolio")} className="btn btn-ghost">All Case Studies</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BLOG
═══════════════════════════════════════════════ */
function Blog({ blogPosts }) {
  const navigate = useNavigate();
  useSEO();
  const [filter, setFilter] = useState("All");
  const tags     = useMemo(() => ["All", ...Array.from(new Set(blogPosts.map(b => b.tag)))], [blogPosts]);
  const filtered = useMemo(() => filter === "All" ? blogPosts : blogPosts.filter(b => b.tag === filter), [blogPosts, filter]);
  return (
    <div>
      <PageHero label="Writing" title={`From<br/><span style="color:var(--pink)">the Blog</span>`} sub="Thinking on brand, marketing, design, and business from the studio." />
      <section style={{ background:"var(--bg)", padding:"80px 0" }}>
        <div className="wrap">
          <div style={{ display:"flex", gap:6, marginBottom:48, flexWrap:"wrap" }}>
            {tags.map(t => <button key={t} onClick={() => setFilter(t)} style={{ padding:"8px 18px", border:"1px solid var(--bd)", borderRadius:100, background:filter === t ? "#fff" : "transparent", color:filter === t ? "#0a0a0a" : "var(--text-dim)", fontSize:13, fontFamily:"-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif", cursor:"pointer", transition:"all .2s" }}>{t}</button>)}
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:3 }}>
            {filtered.map(post => {
              const tagColors = { Marketing:"#ff2d78", Technology:"#00c8e0", Design:"#a855f7", Branding:"#ff2d78", Process:"#FFDE21", Print:"#00c8e0" };
              const accent = tagColors[post.tag] || "#ff2d78";
              return (
              <div key={post.id} className="glass blog-thumb-wrap" style={{ cursor:"pointer", transition:"transform .3s, background .2s", overflow:"hidden" }}
                onClick={() => { navigate("/blog/" + post.id); window.scrollTo(0, 0); }}
                onMouseOver={e => { e.currentTarget.style.background = "var(--surface-hover)"; e.currentTarget.style.transform = "translateY(-3px)"; }}
                onMouseOut={e => { e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.transform = ""; }}>
                {post.coverImage
                  ? <div style={{ height:180, overflow:"hidden", position:"relative" }}>
                      <img src={post.coverImage} alt={post.title} loading="lazy" className="blog-thumb" />
                      <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 40%, var(--bg) 100%)", pointerEvents:"none" }}/>
                    </div>
                  : <div style={{ height:120, overflow:"hidden", position:"relative", background:`linear-gradient(135deg, ${accent}18 0%, ${accent}08 50%, var(--bg) 100%)` }}>
                      <div style={{ position:"absolute", width:120, height:120, borderRadius:"50%", background:`${accent}10`, top:-30, right:-20 }}/>
                      <div style={{ position:"absolute", width:60, height:60, borderRadius:"50%", background:`${accent}08`, bottom:10, left:20 }}/>
                      <div style={{ position:"absolute", bottom:0, left:0, right:0, height:40, background:"linear-gradient(to bottom, transparent, var(--bg))" }}/>
                    </div>
                }
                <div style={{ padding:"20px 24px 28px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                    <span className="pill pill-pink" style={{ fontSize:10 }}>{post.tag}</span>
                    <span style={{ fontSize:11.5, color:"var(--text-muted)" }}>{post.readTime}</span>
                  </div>
                  <h3 style={{ fontWeight:700, fontSize:17, lineHeight:1.3, marginBottom:12, color:"var(--text)" }}>{post.title}</h3>
                  <p style={{ fontSize:13.5, color:"var(--text-dim)", lineHeight:1.7 }}>{post.summary}</p>
                  <p style={{ fontSize:12, color:"var(--text-muted)", marginTop:20, paddingTop:16, borderTop:"1px solid var(--bd)" }}>{post.date}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BLOG POST DETAIL
═══════════════════════════════════════════════ */
function BlogPostDetail({ id, blogPosts }) {
  const go   = useGo();
  const post = useMemo(() => blogPosts.find(p => p.id === id), [blogPosts, id]);
  useSEO(post ? { title: post.title + " — 1204Studios Blog", description: post.summary } : {});
  if (!post) return <div style={{ padding:"200px 40px", textAlign:"center" }}><Link to="/blog" className="btn btn-ghost">← Back</Link></div>;
  return (
    <div>
      <section style={{ background:"var(--bg)", paddingTop:140, paddingBottom:80, borderBottom:"1px solid var(--bd)" }}>
        <div className="wrap wrap-sm">
          <button onClick={() => go("Blog")} className="btn btn-ghost btn-sm" style={{ marginBottom:28 }}>← Back to Blog</button>
          <span className="pill pill-pink" style={{ marginBottom:20, display:"inline-block" }}>{post.tag}</span>
          <h1 className="dn" style={{ fontSize:"clamp(40px,7vw,84px)", color:"var(--text)", lineHeight:.92 }}>{post.title}</h1>
          <div style={{ display:"flex", gap:20, marginTop:28, paddingTop:24, borderTop:"1px solid var(--bd)", flexWrap:"wrap" }}>
            <span style={{ fontSize:13, color:"var(--text-muted)" }}>{post.date}</span>
            <span style={{ fontSize:13, color:"var(--text-muted)" }}>{post.readTime}</span>
            <span style={{ fontSize:13, color:"var(--text-muted)" }}>1204Studios</span>
          </div>
        </div>
      </section>
      <section style={{ background:"var(--bg)", padding:"80px 0" }}>
        <div className="wrap wrap-sm">
          <p style={{ fontSize:20, color:"var(--text-dim)", lineHeight:1.85, marginBottom:48 }}>{post.summary}</p>
          <RichContent text={post.content} />
          <div style={{ marginTop:64, paddingTop:48, borderTop:"1px solid var(--bd)", display:"flex", gap:12, flexWrap:"wrap" }}>
            <button onClick={() => go("Contact")} className="btn btn-primary">Work With Us →</button>
            <button onClick={() => go("Blog")} className="btn btn-ghost">More Articles</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   RICH CONTENT RENDERER
   Supports:
   ## Heading
   ![alt](url)         → image
   @video(url)         → video player
   @youtube(VIDEO_ID)  → YouTube embed
   @youtube(full-url)  → YouTube embed (auto-extracts ID)
   **bold text**       → bold
   > blockquote        → pull quote
   --- or ___          → divider
   plain text          → paragraph
═══════════════════════════════════════════════ */
function RichContent({ text }) {
  if (!text) return null;

  function getYouTubeId(str) {
    // Handle full URLs
    const urlMatch = str.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    if (urlMatch) return urlMatch[1];
    // Handle bare ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(str.trim())) return str.trim();
    return str.trim();
  }

  function renderInline(str) {
    // Handle **bold**
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={i} style={{ color:"var(--text)", fontWeight:700 }}>{p.slice(2,-2)}</strong>
        : p
    );
  }

  const blocks = text.split(/\n\n+/).filter(b => b.trim());

  return (
    <div style={{ fontSize:17, lineHeight:1.95, color:"var(--text-dim)" }}>
      {blocks.map((block, i) => {
        const b = block.trim();

        // ## Heading
        if (b.startsWith("## ")) {
          return <h2 key={i} style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:800, fontSize:"clamp(22px,3vw,30px)", color:"var(--text)", marginBottom:16, marginTop:48, letterSpacing:"-.02em" }}>{b.slice(3)}</h2>;
        }

        // ### Sub-heading
        if (b.startsWith("### ")) {
          return <h3 key={i} style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:700, fontSize:20, color:"var(--text)", marginBottom:12, marginTop:36 }}>{b.slice(4)}</h3>;
        }

        // > Blockquote
        if (b.startsWith("> ")) {
          return (
            <blockquote key={i} style={{ borderLeft:"3px solid var(--pink)", paddingLeft:24, marginBottom:28, marginTop:8 }}>
              <p style={{ fontSize:20, fontStyle:"italic", color:"var(--text)", lineHeight:1.7 }}>{renderInline(b.slice(2))}</p>
            </blockquote>
          );
        }

        // --- or ___ divider
        if (b === "---" || b === "___") {
          return <hr key={i} style={{ border:"none", borderTop:"1px solid var(--bd)", margin:"40px 0" }} />;
        }

        // ![alt](url) image
        const imgMatch = b.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
        if (imgMatch) {
          return (
            <div key={i} style={{ marginBottom:32, marginTop:8, borderRadius:12, overflow:"hidden", border:"1px solid var(--bd)" }}>
              <img src={imgMatch[2]} alt={imgMatch[1]} style={{ width:"100%", display:"block", maxHeight:520, objectFit:"cover" }} />
              {imgMatch[1] && <p style={{ fontSize:12.5, color:"var(--muted)", padding:"10px 14px", background:"var(--surface)", textAlign:"center" }}>{imgMatch[1]}</p>}
            </div>
          );
        }

        // @video(url)
        const vidMatch = b.match(/^@video\(([^)]+)\)$/);
        if (vidMatch) {
          return (
            <div key={i} style={{ marginBottom:32, borderRadius:12, overflow:"hidden", border:"1px solid var(--bd)" }}>
              <video src={vidMatch[1]} controls style={{ width:"100%", display:"block", maxHeight:480, background:"#000" }} />
            </div>
          );
        }

        // @youtube(ID or URL)
        const ytMatch = b.match(/^@youtube\(([^)]+)\)$/);
        if (ytMatch) {
          const ytId = getYouTubeId(ytMatch[1]);
          return (
            <div key={i} style={{ marginBottom:32, borderRadius:12, overflow:"hidden", border:"1px solid var(--bd)", position:"relative", paddingTop:"56.25%" }}>
              <iframe
                src={`https://www.youtube.com/embed/${ytId}`}
                style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none" }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Embedded video"
              />
            </div>
          );
        }

        // Plain paragraph
        return <p key={i} style={{ marginBottom:28 }}>{renderInline(b)}</p>;
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SERVICE PAGE
═══════════════════════════════════════════════ */
function ServicePage({ title, accentWord, accent, label, sub, deliverables, audiences, pricingRange, pricingSub, sections }) {
  const go = useGo();
  useSEO();
  const schema = useMemo(() => ({
    "@context":"https://schema.org", "@type":"Service",
    "name": title + " " + accentWord,
    "provider":{ "@type":"Organization", "name":"1204Studios", "url":"https://1204studios.com" },
    "areaServed":{ "@type":"Place", "name":"Lagos, Nigeria" },
    "description": sub || ("Professional " + label + " services from 1204Studios in Lagos, Nigeria."),
    "offers":{ "@type":"Offer", "priceCurrency":"NGN", "priceRange": pricingRange || "" },
  }), [title, accentWord, label, sub, pricingRange]);

  return (
    <div>
      <JsonLD data={schema} />
      <PageHero label={`Service · ${label}`} title={`${title}<br/><span style="color:${accent}">${accentWord}</span>`} accent={accent} sub={sub} />
      <section style={{ background:"var(--bg)", padding:"100px 0", borderBottom:"1px solid var(--bd)" }}>
        <div className="wrap">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start" }} className="mob-grid1">
            <div>
              <span className="label" style={{ color:"var(--text-muted)" }}>What We Deliver</span>
              <h2 className="dn" style={{ fontSize:"clamp(36px,4vw,58px)", color:"var(--text)", marginTop:12, marginBottom:36 }}>Everything<br />you need.</h2>
              {deliverables.map((d, i) => (
                <div key={i} style={{ display:"flex", gap:16, padding:"16px 0", borderBottom:"1px solid var(--bd)", alignItems:"center" }}>
                  <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:800, fontSize:13, color:accent, minWidth:28, opacity:.7 }}>0{i + 1}</span>
                  <span style={{ fontSize:15, fontWeight:500, color:"var(--text)" }}>{d}</span>
                </div>
              ))}
            </div>
            <div>
              <span className="label" style={{ color:"var(--text-muted)" }}>Who This Is For</span>
              <h2 className="dn" style={{ fontSize:"clamp(36px,4vw,58px)", color:"var(--text)", marginTop:12, marginBottom:36 }}>Built for<br />where you are.</h2>
              {audiences.map((a, i) => (
                <div key={i} className="glass" style={{ padding:28, marginBottom:3 }}>
                  <h3 style={{ fontWeight:700, fontSize:17, color:"var(--text)", marginBottom:8 }}>{a.l}</h3>
                  <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.7 }}>{a.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      {sections && (
        <section style={{ background:"var(--s1)", padding:"100px 0", borderBottom:"1px solid var(--bd)" }}>
          <div className="wrap">
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:3 }} className="mob-grid1">
              {sections.map((s, i) => (
                <div key={i} className="glass" style={{ padding:48 }}>
                  <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:800, fontSize:48, color:`${accent}18`, lineHeight:1, display:"block", marginBottom:16 }}>0{i + 1}</span>
                  <h3 style={{ fontWeight:700, fontSize:20, color:"var(--text)", marginBottom:12 }}>{s.t}</h3>
                  <p style={{ fontSize:14.5, color:"var(--text-dim)", lineHeight:1.8 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
      <section style={{ background:"var(--bg)", padding:"80px 0" }}>
        <div className="wrap wrap-sm">
          <div className="glass" style={{ padding:48 }}>
            <span className="label" style={{ color:"var(--text-muted)" }}>Investment</span>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:24, marginTop:20 }}>
              <div>
                <div style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:800, fontSize:"clamp(36px,5vw,64px)", color:accent, lineHeight:1 }}>{pricingRange}</div>
                <p style={{ fontSize:14, color:"var(--text-dim)", marginTop:8 }}>{pricingSub}</p>
              </div>
              <button onClick={() => go("Contact")} className="btn btn-primary">Request a Quote →</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Branding() {
  return <ServicePage title="Branding &" accentWord="Identity" accent="var(--pink)" label="Branding"
    sub="A brand is a system of decisions — how you look, how you sound, how you show up. We design identities built to last."
    deliverables={["Logo systems & mark variations","Visual language & colour systems","Brand guidelines documentation","Typography systems","Application design (stationery, digital, signage)","Iconography & illustration direction"]}
    audiences={[{l:"Startups",d:"You need an identity that matches your ambition from day one."},{l:"Growing Companies",d:"You've outgrown your old look and need a brand that reflects where you're actually going."},{l:"Institutions",d:"Schools, NGOs, and public-sector bodies that need identity systems built to last."}]}
    pricingRange="₦800,000 – ₦2,500,000" pricingSub="Quoted after discovery. Complexity determines scope." />;
}
function Marketing() {
  return <ServicePage title="Marketing &" accentWord="Campaigns" accent="var(--yellow)" label="Marketing"
    sub="Strategy before spend. We design campaigns with clear logic — who, what, where, why — then execute with the same rigour."
    deliverables={["Campaign strategy & planning","Creative concept development","Digital media buying & management","Social media creative","Performance reporting & optimisation","Campaign copy & messaging"]}
    audiences={[{l:"Funded Startups",d:"You have budget and you need to make noise — fast."},{l:"Growing SMEs",d:"You need a strategic partner to run campaigns while you run the business."},{l:"Established Brands",d:"You need a fresh creative perspective on a proven product."}]}
    sections={[{t:"Campaign Strategy",d:"Research-backed frameworks built around your audience, objectives, and budget."},{t:"Creative Development",d:"Concepts, copy, design, and production that cuts through."},{t:"Digital Marketing & Media Buying",d:"Paid social, search, and display — planned, bought, and managed."},{t:"Performance Optimisation",d:"Campaigns don't end at launch. We monitor, test, and improve."}]}
    pricingRange="₦600,000 – ₦2,000,000" pricingSub="Media spend always separate from our fees." />;
}
function Print() {
  return <ServicePage title="Print" accentWord="Media" accent="var(--cyan)" label="Print"
    sub="Print is not dead. Poorly considered print is dead. We design materials intentional about every dimension."
    deliverables={["Corporate materials & stationery","Annual reports & brochures","Product packaging design","Marketing collateral","Point-of-sale materials","Production management & vendor relations"]}
    audiences={[{l:"Corporates",d:"You need materials that match the credibility your business has built."},{l:"Product Brands",d:"Your packaging is your first salesperson. Make it work."},{l:"NGOs & Institutions",d:"Reports and materials that win trust before they're read."}]}
    pricingRange="₦250,000 – ₦800,000" pricingSub="Print production costs quoted separately." />;
}
function Tutoring() {
  return <ServicePage title="Design &" accentWord="Web Tutoring" accent="var(--purple)" label="Tutoring"
    sub="Structured. Practical. Future-ready. We teach design and coding the way we wished it had been taught to us."
    deliverables={["Graphic Design fundamentals","Motion design & After Effects","Web design & HTML/CSS","Creative thinking & problem framing","Real-world briefs & mentorship","Job-readiness & portfolio building"]}
    audiences={[{l:"Beginners",d:"No experience required. Just curiosity and commitment."},{l:"Career Changers",d:"Structured courses built to get you job-ready, not just informed."},{l:"Institutions & Schools",d:"We partner with schools to bring structured creative education in-house."}]}
    sections={[{t:"Graphic Design",d:"Fundamentals of visual communication. Typography, layout, colour theory, and industry tools."},{t:"Motion Basics",d:"Introduction to motion design and After Effects fundamentals."},{t:"Web Design & Dev",d:"HTML, CSS, and design-to-code — from mockup to live page."},{t:"Creative Thinking",d:"Problem framing, ideation, and creative confidence."}]}
    pricingRange="₦80,000 – ₦400,000" pricingSub="Course fees vary by duration and format." />;
}

/* ═══════════════════════════════════════════════
   ABOUT
═══════════════════════════════════════════════ */
function About() {
  const go = useGo();
  useSEO();
  const schema = useMemo(() => ({
    "@context":"https://schema.org", "@type":"AboutPage",
    "name":"About 1204Studios", "url":"https://1204studios.com/about",
    "description":"Meet the team behind 1204Studios.",
    "publisher":{ "@type":"Organization", "name":"1204Studios" },
  }), []);
  return (
    <div>
      <JsonLD data={schema} />
      <PageHero label="About" title={`Technology-led.<br/>Detail <span style="color:var(--pink)">obsessed.</span>`} sub="We built 1204Studios around a belief that the best creative work happens when modern technology meets uncompromising craft." />
      <section style={{ background:"var(--bg)", padding:"100px 0", borderBottom:"1px solid var(--bd)" }}>
        <div className="wrap">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"start" }} className="mob-grid1">
            <div>
              <span className="label" style={{ color:"var(--text-muted)" }}>Our Approach</span>
              <h2 className="dn" style={{ fontSize:"clamp(36px,5vw,58px)", color:"var(--text)", marginTop:10, marginBottom:24 }}>How we<br />work.</h2>
              <p style={{ fontSize:17, color:"var(--text-dim)", lineHeight:1.9, marginBottom:20 }}>
                We are not a traditional agency. We integrate AI and technology into our research, strategy, and production workflows. It makes us fast. It makes us precise. It means your project benefits from tools that most studios have not adopted yet.
              </p>
              <p style={{ fontSize:17, color:"var(--text-dim)", lineHeight:1.9, marginBottom:20 }}>
                But we never let automation replace judgment. Every deliverable is shaped, reviewed, and refined by people who refuse to ship anything that does not carry our signature level of care. The technology compresses the timeline. The craft elevates the output.
              </p>
              <p style={{ fontSize:17, color:"var(--text-dim)", lineHeight:1.9 }}>
                That combination is why clients who work with us once tend to come back.
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
              {[
                { accent:"var(--pink)", title:"AI-Powered Research & Strategy", desc:"Automated brand audits, competitive analysis, and audience intelligence. We use AI to surface insights faster so we can spend more time acting on them." },
                { accent:"var(--cyan)", title:"Intelligent Design Systems", desc:"Colour harmonics, type pairing algorithms, and layout optimisation help us build visual systems that are mathematically coherent and emotionally resonant." },
                { accent:"var(--purple)", title:"Hands-On Craft", desc:"No AI-generated final output. Every logo, every layout, every campaign asset is made by hand, reviewed obsessively, and delivered with intention." },
                { accent:"var(--yellow)", title:"Seamless Client Experience", desc:"Automated project tracking, milestone notifications, and structured review sessions. You always know where your project stands without chasing us." },
              ].map((item, i) => (
                <div key={i} className="glass" style={{ padding:"28px 28px", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, width:3, height:"100%", background:item.accent }}/>
                  <h4 style={{ fontWeight:700, fontSize:16, color:"var(--text)", marginBottom:8, paddingLeft:8 }}>{item.title}</h4>
                  <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.75, paddingLeft:8 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
      <section style={{ background:"var(--s1)", padding:"100px 0", borderBottom:"1px solid var(--bd)" }}>
        <div className="wrap">
          <span className="label" style={{ color:"var(--text-muted)" }}>What We Stand For</span>
          <h2 className="dn" style={{ fontSize:"clamp(36px,5vw,64px)", color:"var(--text)", marginTop:10, marginBottom:48 }}>Core Values</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:3 }}>
            {[["Intentional","Every decision has a reason. We don't do default."],["Structured","Good creative work has a logic underneath it."],["Direct","We say what we mean and mean what we say."],["Capable","We only offer what we can actually deliver."],["Curious","We're still learning. That's how it stays interesting."]].map(([t, d], i) => (
              <div key={i} className="glass" style={{ padding:"32px 28px" }}>
                <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", fontWeight:800, fontSize:44, color:"rgba(255,45,120,.15)", lineHeight:1, display:"block", marginBottom:14 }}>0{i + 1}</span>
                <h3 style={{ fontWeight:700, fontSize:18, color:"var(--text)", marginBottom:8 }}>{t}</h3>
                <p style={{ fontSize:14, color:"var(--text-dim)", lineHeight:1.7 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section style={{ background:"var(--bg)", padding:"100px 0" }}>
        <div className="wrap wrap-sm" style={{ textAlign:"center" }}>
          <h2 className="dn" style={{ fontSize:"clamp(40px,6vw,80px)", color:"var(--text)", marginBottom:24 }}>Want to work<br />with us?</h2>
          <p style={{ fontSize:17, color:"var(--text-dim)", marginBottom:44, lineHeight:1.75 }}>We take on a small number of clients each quarter to make sure every project gets full attention.</p>
          <button onClick={() => go("Contact")} className="btn btn-primary" style={{ fontSize:16, padding:"16px 44px" }}>Start a Conversation →</button>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CONTACT
═══════════════════════════════════════════════ */
function Contact() {
  useSEO();
  // Book a Call CTA is wired via /book-call route
  const schema = useMemo(() => ({
    "@context":"https://schema.org", "@type":"ContactPage",
    "name":"Contact 1204Studios", "url":"https://1204studios.com/contact",
    "description":"Get in touch with 1204Studios to start a project.",
    "mainEntity":{ "@type":"Organization", "name":"1204Studios", "email":"hello@1204studios.com", "telephone":"+2349035583476", "address":{ "@type":"PostalAddress", "streetAddress":"22 Glover Road", "addressLocality":"Ikoyi, Lagos", "addressCountry":"NG" } },
  }), []);

  const [form,     setForm]     = useState({ name:"", email:"", company:"", service:"", message:"", link:"" });
  const [sent,     setSent]     = useState(false);
  const [sending,  setSending]  = useState(false);
  const [sendErr,  setSendErr]  = useState("");
  const [files,    setFiles]    = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const inputStyle = { width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid var(--bd)", color:"var(--text)", padding:"12px 14px", fontSize:14, outline:"none", transition:"border-color .2s", borderRadius:6, fontFamily:"-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif" };
  const labelStyle = { fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--text-muted)", display:"block", marginBottom:8 };

  const handleSubmit = async () => {
    // — Validate —
    const cleanName    = sanitize(form.name, 100);
    const cleanEmail   = sanitize(form.email, 200);
    const cleanCompany = sanitize(form.company, 150);
    const cleanService = sanitize(form.service, 100);
    const cleanMessage = sanitize(form.message, 3000);
    const cleanLink    = sanitize(form.link, 500);

    if (!cleanName)                  return setSendErr("Please enter your name.");
    if (!validEmail(cleanEmail))     return setSendErr("Please enter a valid email address.");
    if (!cleanMessage)               return setSendErr("Please describe your project.");
    if (cleanMessage.length < 10)    return setSendErr("Please tell us a bit more about your project.");
    if (!validUrl(cleanLink))        return setSendErr("Reference link must be a valid http/https URL.");
    if (!canSubmit())                return setSendErr("Please wait 60 seconds before submitting again.");

    setSending(true); setSendErr("");

    try {
      const body = new FormData();
      body.append("name",     cleanName);
      body.append("email",    cleanEmail);
      body.append("company",  cleanCompany);
      body.append("service",  cleanService);
      body.append("message",  cleanMessage);
      body.append("link",     cleanLink);
      body.append("_subject", "New brief from " + cleanName + " — 1204Studios");
      body.append("_replyto", cleanEmail);
      files.forEach(f => {
        if (f.size <= 20 * 1024 * 1024 && (ALLOWED_FILE_TYPES.has(f.type) || ALLOWED_EXTS.test(f.name))) {
          body.append("attachment", f);
        }
      });
      const res = await fetch("https://formspree.io/f/xojkewgr", { method:"POST", body, headers:{ Accept:"application/json" } });
      setSending(false);
      if (res.ok) {
        setSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setSendErr(data.error || "Something went wrong. Please email hello@1204studios.com directly.");
      }
    } catch(e) {
      setSending(false);
      setSendErr("Could not connect. Please email hello@1204studios.com directly.");
    }
  };

  const addFiles = useCallback(incoming => {
    const valid = Array.from(incoming).filter(f =>
      f.size <= 20 * 1024 * 1024 &&
      (ALLOWED_FILE_TYPES.has(f.type) || ALLOWED_EXTS.test(f.name))
    );
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name));
      return [...prev, ...valid.filter(f => !names.has(f.name))].slice(0, 5);
    });
  }, []);

  return (
    <div>
      <JsonLD data={schema} />
      <PageHero label="Get In Touch" title={`Let's<br/><span style="color:var(--pink)">Talk.</span>`} sub="Tell us what you're working on. We'll tell you if we're the right fit." />
      <section style={{ background:"var(--bg)", padding:"100px 0" }}>
        <div className="wrap">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1.4fr", gap:80, alignItems:"start" }} className="mob-grid1">
            <div>
              <span className="label" style={{ color:"var(--text-muted)" }}>Contact Details</span>
              <h2 className="dn" style={{ fontSize:"clamp(36px,4vw,56px)", color:"var(--text)", marginTop:10, marginBottom:36 }}>Find Us</h2>
              {[
                { l:"Email",         v:"hello@1204studios.com",              i:"✉", href:"mailto:hello@1204studios.com" },
                { l:"Phone",         v:"+234 903 558 3476",                  i:"☎", href:"tel:+2349035583476" },
                { l:"Address",       v:"22 Glover Rd, Ikoyi, Lagos",         i:"◎", href:"https://maps.google.com/?q=22+Glover+Road+Ikoyi+Lagos+Nigeria" },
                { l:"Working Hours", v:"Mon–Fri, 9am–6pm WAT",               i:"◷", href:null },
              ].map((item, i) => (
                <div key={i} style={{ display:"flex", gap:18, marginBottom:28, alignItems:"center" }}>
                  <div style={{ width:44, height:44, background:"rgba(255,45,120,.1)", border:"1px solid rgba(255,45,120,.2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--pink)", fontSize:16, flexShrink:0 }}>{item.i}</div>
                  <div>
                    <p style={{ fontSize:11, letterSpacing:2, textTransform:"uppercase", color:"var(--text-muted)", marginBottom:4 }}>{item.l}</p>
                    {item.href
                      ? <a href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                          style={{ fontWeight:600, fontSize:15, color:"var(--text)", textDecoration:"none", borderBottom:"1px solid rgba(255,45,120,.3)", paddingBottom:1, transition:"color .15s, border-color .15s" }}
                          onMouseOver={e=>{e.currentTarget.style.color="var(--pink)";e.currentTarget.style.borderColor="var(--pink)";}}
                          onMouseOut={e=>{e.currentTarget.style.color="var(--text)";e.currentTarget.style.borderColor="rgba(255,45,120,.3)";}}>
                          {item.v}
                        </a>
                      : <p style={{ fontWeight:600, fontSize:15, color:"var(--text)", margin:0 }}>{item.v}</p>
                    }
                  </div>
                </div>
              ))}
              <div style={{ background:"rgba(255,45,120,.06)", border:"1px solid rgba(255,45,120,.2)", borderRadius:12, padding:"24px 20px", marginTop:12 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:6 }}>Prefer to talk first?</div>
                <p style={{ fontSize:13, color:"var(--text-dim)", lineHeight:1.7, marginBottom:16 }}>Book a free 30-minute Google Meet call and let's discuss your project live.</p>
                <Link to="/book-call" className="btn btn-pink btn-sm" style={{ display:"inline-flex" }}>Book a Call →</Link>
              </div>
            </div>
            <div>
              {sent ? (
                <div className="glass" style={{ padding:56, textAlign:"center" }}>
                  <div style={{ fontSize:48, color:"var(--pink)", marginBottom:16 }}>✓</div>
                  <h3 style={{ fontWeight:800, fontSize:24, color:"var(--text)", marginBottom:12 }}>Message Sent</h3>
                  <p style={{ color:"var(--text-dim)", fontSize:15, lineHeight:1.7 }}>We'll review your brief and get back to you within one business day.</p>
                </div>
              ) : (
                <div className="glass" style={{ padding:"40px 36px" }}>
                  <h3 style={{ fontWeight:700, fontSize:22, color:"var(--text)", marginBottom:32 }}>Send a Brief</h3>
                  <div style={{ display:"flex", flexDirection:"column", gap:22 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }} className="mob-grid1">
                      {[{ k:"name", l:"Full Name", p:"Your name" }, { k:"email", l:"Email", p:"hello@company.com" }].map(f => (
                        <div key={f.k}>
                          <label style={labelStyle}>{f.l}</label>
                          <input value={form[f.k]} onChange={e => setForm({ ...form, [f.k]: e.target.value })} placeholder={f.p}
                            style={inputStyle} onFocus={e => e.target.style.borderColor = "var(--pink)"} onBlur={e => e.target.style.borderColor = "var(--bd)"} />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label style={labelStyle}>Service Needed</label>
                      <div style={{ position:"relative" }}>
                        <select value={form.service} onChange={e => setForm({ ...form, service: e.target.value })}
                          style={{ ...inputStyle, paddingRight:42, appearance:"none", WebkitAppearance:"none", cursor:"pointer" }}
                          onFocus={e => e.target.style.borderColor = "var(--pink)"} onBlur={e => e.target.style.borderColor = "var(--bd)"}>
                          <option value="">Select a service</option>
                          {["Brand Design & Identity","Marketing & Campaigns","Print Media","Design & Web Tutoring","General Enquiry"].map(s => <option key={s}>{s}</option>)}
                        </select>
                        <span style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", color:"var(--text-dim)", fontSize:11, pointerEvents:"none" }}>▼</span>
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Your Brief</label>
                      <textarea value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} rows={4}
                        placeholder="Tell us about your project — scope, timeline, and budget."
                        style={{ ...inputStyle, resize:"vertical" }}
                        onFocus={e => e.target.style.borderColor = "var(--pink)"} onBlur={e => e.target.style.borderColor = "var(--bd)"} />
                    </div>
                    <div>
                      <label style={labelStyle}>Reference Link (optional)</label>
                      <div style={{ position:"relative" }}>
                        <span style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)", color:"var(--text-muted)", fontSize:14, pointerEvents:"none" }}>🔗</span>
                        <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })}
                          placeholder="https://reference.com or Figma/Drive link"
                          style={{ ...inputStyle, paddingLeft:38 }}
                          onFocus={e => e.target.style.borderColor = "var(--pink)"} onBlur={e => e.target.style.borderColor = "var(--bd)"} />
                      </div>
                    </div>
                    <div>
                      <label style={labelStyle}>Attachments (optional · max 5 files · 20MB each)</label>
                      <div onClick={() => fileRef.current.click()}
                        onDrop={e => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        style={{ border:`1.5px dashed ${dragOver ? "var(--pink)" : "rgba(255,255,255,.12)"}`, borderRadius:6, padding:"20px 16px", cursor:"pointer", background:dragOver ? "rgba(255,45,120,.05)" : "rgba(255,255,255,.02)", transition:"all .2s", textAlign:"center" }}>
                        <div style={{ fontSize:22, marginBottom:6, opacity:.5 }}>📎</div>
                        <p style={{ fontSize:13, color:"var(--text-dim)" }}>Drop files here or <span style={{ color:"var(--pink)" }}>click to browse</span></p>
                        <p style={{ fontSize:11, color:"var(--text-muted)", marginTop:4 }}>PDF, JPG, PNG, ZIP, Figma exports</p>
                        <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.zip,.fig,.svg" style={{ display:"none" }} onChange={e => addFiles(e.target.files)} />
                      </div>
                      {files.length > 0 && (
                        <div style={{ marginTop:10, display:"flex", flexDirection:"column", gap:6 }}>
                          {files.map((f, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,.04)", border:"1px solid var(--bd)", borderRadius:6, padding:"8px 14px" }}>
                              <span style={{ fontSize:13, color:"rgba(255,255,255,.7)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"80%" }}>📄 {f.name}</span>
                              <button onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background:"none", border:"none", color:"var(--text-muted)", fontSize:16, cursor:"pointer", flexShrink:0 }}>✕</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {sendErr && <p style={{ color:"var(--pink)", fontSize:13, textAlign:"center" }}>{sendErr}</p>}
                    <button onClick={handleSubmit} disabled={sending || !form.name || !form.email || !form.message}
                      className="btn btn-primary"
                      style={{ justifyContent:"center", padding:16, fontSize:15, borderRadius:8, width:"100%", opacity:(sending || !form.name || !form.email || !form.message) ? 0.55 : 1, cursor:sending ? "wait" : "pointer" }}>
                      {sending ? "Sending…" : "Send Brief →"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Input sanitizers & validators ─────────────────────────── */
const sanitize   = (s, max = 500)  => String(s || "").trim().slice(0, max);
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const validUrl   = (u) => { if (!u) return true; try { const p = new URL(u); return ["http:","https:"].includes(p.protocol); } catch { return false; } };
const ALLOWED_FILE_TYPES = new Set(["application/pdf","image/jpeg","image/png","image/svg+xml","application/zip"]);
const ALLOWED_EXTS = /\.(pdf|jpg|jpeg|png|svg|zip|fig)$/i;

/* ── Submission rate limiter (client-side, 60s cooldown) ────── */
let lastSubmitTime = 0;
function canSubmit() {
  const now = Date.now();
  if (now - lastSubmitTime < 60000) return false;
  lastSubmitTime = now;
  return true;
}
/* Newsletter uses a dedicated Formspree endpoint
   — go to formspree.io, create a second form, set delivery to hello@1204studios.com
   — paste that form ID below as NEWSLETTER_FORM_ID */
const NEWSLETTER_FORM_ID = "xojkewgr"; // ← replace with your newsletter form ID

function NewsletterSignup() {
  const [email,  setEmail]  = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | done | error

  const submit = useCallback(async () => {
    const clean = sanitize(email, 200);
    if (!validEmail(clean)) return;
    setStatus("sending");
    try {
      const body = new FormData();
      body.append("email",   clean);
      body.append("source",  "footer");
      body.append("_subject", "New newsletter subscriber — 1204Studios");
      const res = await fetch(
        "https://formspree.io/f/" + NEWSLETTER_FORM_ID,
        { method:"POST", body, headers:{ Accept:"application/json" } }
      );
      if (res.ok) { setStatus("done"); setEmail(""); }
      else setStatus("error");
    } catch(e) { setStatus("error"); }
  }, [email]);

  if (status === "done") return <p style={{ fontSize:13, color:"var(--pink)", padding:"11px 0" }}>You're on the list ✓</p>;

  return (
    <div>
      <div style={{ display:"flex", gap:8 }}>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          onKeyDown={e => e.key === "Enter" && submit()}
          placeholder="Your email"
          type="email"
          style={{ flex:1, background:"rgba(128,128,128,.08)", border:"1px solid rgba(255,255,255,.12)", color:"#fff", padding:"10px 14px", fontSize:13, outline:"none", borderRadius:8, fontFamily:"-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif" }}
        />
        <button onClick={submit} disabled={status === "sending"} className="btn btn-pink btn-sm" style={{ borderRadius:8, padding:"10px 18px" }}>
          {status === "sending" ? "…" : "→"}
        </button>
      </div>
      {status === "error" && <p style={{ fontSize:12, color:"var(--pink)", marginTop:6 }}>Couldn't connect. Email hello@1204studios.com</p>}
    </div>
  );
}
/* ═══════════════════════════════════════════════
   FOOTER
═══════════════════════════════════════════════ */
const FOOTER_COLS = [
  { title:"Company",  links:["About","Portfolio","Blog","Book a Call","Contact"] },
  { title:"Services", links:["Branding","Marketing","Print","Tutoring"] },
  { title:"Legal",    links:["Privacy Policy","Terms of Use"] },
];

const Footer = memo(function Footer() {
  return (
    <footer style={{ background:"#0e0e0e", borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:80, paddingBottom:40 }}>
      <div className="wrap">
        <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr 1fr", gap:48, paddingBottom:56, borderBottom:"1px solid rgba(255,255,255,.08)" }} className="mob-grid1">
          <div>
            <Link to="/" className="nav-logo-link" style={{ marginBottom:18 }}>
              <img
                src="/logo-white.svg"
                alt="1204Studios"
                style={{ height:24, width:"auto", display:"block" }}
              />
            </Link>
            <p style={{ fontSize:14, color:"rgba(255,255,255,0.6)", lineHeight:1.8, maxWidth:260, marginBottom:12 }}>A creative and marketing studio in Lagos, Nigeria. Built for brands that move differently.</p>
            <div style={{ marginBottom:28 }}>
              <a href="tel:+2349035583476" style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.55)", textDecoration:"none", marginBottom:6, transition:"color .15s" }}
                onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.55)"}>
                ☎ +234 903 558 3476
              </a>
              <a href="https://maps.google.com/?q=22+Glover+Road+Ikoyi+Lagos+Nigeria" target="_blank" rel="noopener noreferrer"
                style={{ display:"block", fontSize:13, color:"rgba(255,255,255,0.55)", textDecoration:"none", transition:"color .15s" }}
                onMouseOver={e=>e.currentTarget.style.color="#fff"} onMouseOut={e=>e.currentTarget.style.color="rgba(255,255,255,0.55)"}>
                ◎ 22 Glover Rd, Ikoyi, Lagos
              </a>
            </div>
            <NewsletterSignup />
          </div>
          {FOOTER_COLS.map((col, i) => (
            <div key={i}>
              <h4 style={{ fontSize:11, letterSpacing:2.5, textTransform:"uppercase", color:"rgba(255,255,255,0.50)", marginBottom:20, fontWeight:600 }}>{col.title}</h4>
              {col.links.map(l => (
                <Link key={l} to={PAGE_TO_PATH[l] || "/"} style={{ display:"block", color:"rgba(255,255,255,0.6)", fontSize:14, marginBottom:12, fontFamily:"-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif", textDecoration:"none", transition:"color .15s" }}
                  onMouseOver={e => e.currentTarget.style.color = "#fff"}
                  onMouseOut={e => e.currentTarget.style.color = "rgba(255,255,255,0.6)"}>{l}</Link>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", paddingTop:24, flexWrap:"wrap", gap:16 }}>
          <p style={{ fontSize:13, color:"rgba(255,255,255,0.45)" }}>© 2026 1204Studios. All rights reserved.</p>
          <div style={{ display:"flex", gap:16 }}>
            {["Instagram","Twitter","LinkedIn","Behance"].map(s => (
              <button key={s} style={{ background:"none", border:"none", color:"rgba(255,255,255,0.5)", fontSize:13, cursor:"pointer", fontFamily:"-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif", transition:"color .15s" }}
                onMouseOver={e => e.target.style.color = "#fff"}
                onMouseOut={e => e.target.style.color = "rgba(255,255,255,0.5)"}>{s}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
});

/* ═══════════════════════════════════════════════
   PRIVACY + TERMS
═══════════════════════════════════════════════ */
function PrivacyPolicy() {
  const go = useGo();
  useSEO();
  const sections = [
    { t:"Information We Collect",   b:"When you contact us through our website, we collect the information you provide — including your name, email address, company name, project brief, and any files or links you share. We also collect basic usage data such as browser type and pages visited." },
    { t:"How We Use Your Information", b:"We use your information solely to respond to your enquiry, understand your project needs, and communicate with you about potential or ongoing work. We do not sell, rent, or share your personal information with third parties for marketing purposes." },
    { t:"Data Storage and Security", b:"Your information is stored securely using Supabase, a cloud database provider. We take reasonable precautions to protect your data from unauthorised access, loss, or disclosure." },
    { t:"Cookies",                   b:"Our website uses minimal cookies necessary for basic functionality. We do not use tracking cookies or third-party advertising cookies." },
    { t:"Third-Party Services",      b:"Our website uses Supabase for data storage and Vercel for hosting. We do not use Google Analytics or Facebook Pixel or any other behavioural tracking services." },
    { t:"Your Rights",               b:"You have the right to request access to, correction of, or deletion of your personal data. To exercise any of these rights, contact us at hello@1204studios.com." },
    { t:"Contact",                   b:"For any privacy-related questions, please email hello@1204studios.com. We aim to respond within 5 business days." },
  ];
  return (
    <div>
      <PageHero label="Legal" title={`Privacy<br/><span style="color:var(--pink)">Policy</span>`} sub="Last updated: January 2025. This policy explains how 1204Studios collects, uses, and protects your personal information." />
      <section style={{ background:"var(--bg)", padding:"80px 0" }}>
        <div className="wrap wrap-sm">
          <div className="glass" style={{ padding:"48px 44px", marginBottom:32 }}>
            <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.9 }}>1204Studios is a creative and marketing studio based in Lagos, Nigeria. We are committed to protecting your privacy. This policy applies to all information collected through our website at 1204studios.com.</p>
          </div>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom:40, paddingBottom:40, borderBottom:"1px solid var(--bd)" }}>
              <h2 style={{ fontWeight:700, fontSize:20, color:"var(--text)", marginBottom:16 }}>{String(i + 1).padStart(2, "0")}. {s.t}</h2>
              <p style={{ fontSize:15.5, color:"var(--text-dim)", lineHeight:1.9 }}>{s.b}</p>
            </div>
          ))}
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <button onClick={() => go("Contact")} className="btn btn-ghost btn-sm">Contact Us</button>
            <button onClick={() => go("Terms of Use")} className="btn btn-ghost btn-sm">Terms of Use →</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TermsOfUse() {
  const go = useGo();
  useSEO();
  const sections = [
    { t:"Acceptance of Terms",      b:"By accessing and using 1204Studios.com, you accept and agree to be bound by these Terms of Use." },
    { t:"Use of This Website",      b:"This website is provided to facilitate enquiries about our creative services. You agree not to use this site for any unlawful purpose, to transmit harmful content, or to interfere with the website's operation." },
    { t:"Intellectual Property",    b:"All content on this website — including text, design, graphics, logos, and case study materials — is the property of 1204Studios or our clients and is protected by applicable copyright laws." },
    { t:"Case Studies and Portfolio",b:"Work displayed in our portfolio represents projects completed for clients with their permission. The ideas and creative approaches shown remain the intellectual property of 1204Studios." },
    { t:"Submissions and Enquiries",b:"When you submit a brief, you grant us permission to use the information solely to respond to your enquiry and assess potential collaboration." },
    { t:"Disclaimers",              b:"Results mentioned in case studies reflect specific client outcomes and are not a guarantee of similar results for your project." },
    { t:"Links to Third-Party Sites",b:"Our site may contain links to external websites provided for convenience only. We accept no responsibility for their content." },
    { t:"Changes to These Terms",   b:"We reserve the right to update these terms at any time. Continued use of the website after changes are posted constitutes your acceptance." },
    { t:"Governing Law",            b:"These terms are governed by the laws of the Federal Republic of Nigeria." },
    { t:"Contact",                  b:"For questions about these terms, please contact us at hello@1204studios.com." },
  ];
  return (
    <div>
      <PageHero label="Legal" title={`Terms<br/><span style="color:var(--yellow)">of Use</span>`} accent="#ffe600" sub="Last updated: January 2025. Please read these terms carefully before using our website." />
      <section style={{ background:"var(--bg)", padding:"80px 0" }}>
        <div className="wrap wrap-sm">
          <div className="glass" style={{ padding:"48px 44px", marginBottom:32 }}>
            <p style={{ fontSize:16, color:"var(--text-dim)", lineHeight:1.9 }}>These Terms of Use govern your use of the 1204Studios website. By using this site, you agree to these terms, which should be read alongside our Privacy Policy.</p>
          </div>
          {sections.map((s, i) => (
            <div key={i} style={{ marginBottom:40, paddingBottom:40, borderBottom:"1px solid var(--bd)" }}>
              <h2 style={{ fontWeight:700, fontSize:20, color:"var(--text)", marginBottom:16 }}>{String(i + 1).padStart(2, "0")}. {s.t}</h2>
              <p style={{ fontSize:15.5, color:"var(--text-dim)", lineHeight:1.9 }}>{s.b}</p>
            </div>
          ))}
          <div style={{ display:"flex", gap:12, marginTop:16 }}>
            <button onClick={() => go("Contact")} className="btn btn-ghost btn-sm">Contact Us</button>
            <button onClick={() => go("Privacy Policy")} className="btn btn-ghost btn-sm">Privacy Policy →</button>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   ROUTE WRAPPERS
═══════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════
   BOOK A CALL
═══════════════════════════════════════════════ */
function BookCall() {
  useSEO();
  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", paddingTop:80 }}>
      <div className="wrap-sm" style={{ padding:"80px 48px 120px" }}>

        {/* Header */}
        <div style={{ marginBottom:16 }}>
          <span className="pill pill-pink fu">1204Studios Discovery Call</span>
        </div>
        <h1 className="dn fu d1" style={{ fontSize:"clamp(36px,6vw,80px)", color:"var(--text)", lineHeight:.95, marginBottom:20 }}>
          Pick a time that<br /><span style={{ color:"var(--pink)" }}>works for you.</span>
        </h1>
        <p style={{ fontSize:"clamp(15px,1.5vw,18px)", color:"var(--text-dim)", maxWidth:560, lineHeight:1.75, marginBottom:56 }} className="fu d2">
          You'll be meeting with two members of our team on a 30-minute video call. The meeting runs on Google Meet and will be added to your Google Calendar automatically.
        </p>

        {/* What to expect */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:3, marginBottom:56 }} className="mob-grid1">
          {[
            { icon:"◷", title:"30 Minutes", body:"A focused, no-fluff conversation about your project, timeline, and brief." },
            { icon:"📹", title:"Google Meet", body:"A meeting link and calendar invite are sent to your email the moment you book." },
            { icon:"✓", title:"No Commitment", body:"Ask questions, share context, and see if we're the right fit for your project." },
          ].map((item, i) => (
            <div key={i} className="glass" style={{ padding:"28px 24px", borderRadius:12 }}>
              <div style={{ fontSize:22, marginBottom:12, color:"var(--pink)" }}>{item.icon}</div>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:8 }}>{item.title}</div>
              <div style={{ fontSize:13.5, color:"var(--text-dim)", lineHeight:1.7 }}>{item.body}</div>
            </div>
          ))}
        </div>

        {/* Calendar booking CTA */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--bd)", borderRadius:16, overflow:"hidden", marginBottom:48 }}>
          <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--bd)", display:"flex", alignItems:"center", gap:12 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background:"var(--pink)" }}/>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text-dim)", letterSpacing:.5 }}>GOOGLE CALENDAR BOOKING</span>
          </div>
          <div style={{ padding:"64px 48px", display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center", gap:32 }}>
            <div style={{ width:80, height:80, borderRadius:20, background:"rgba(255,45,120,.1)", border:"1px solid rgba(255,45,120,.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:36 }}>📅</div>
            <div>
              <h3 style={{ fontSize:"clamp(22px,3vw,34px)", fontWeight:800, color:"var(--text)", marginBottom:12, fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif", letterSpacing:"-.02em" }}>
                1204Studios Discovery Call
              </h3>
              <p style={{ fontSize:15, color:"var(--text-dim)", lineHeight:1.75, maxWidth:460, margin:"0 auto" }}>
                After you choose a time, you'll receive a calendar invite by email. The invite includes the Google Meet link, and both team members will be added to the call. Use the message field to share what you'd like to discuss — it helps us prepare.
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12, width:"100%" }}>
              <a
                href="https://calendar.app.google/inUFUHz1SP42UzbZ9"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-pink"
                style={{ fontSize:16, padding:"16px 48px", display:"inline-flex", alignItems:"center", gap:10 }}
              >
                <span>📅</span> Open Booking Calendar →
              </a>
              <span style={{ fontSize:12, color:"var(--text-muted)" }}>Opens in Google Calendar · Free · No commitment</span>
            </div>
            <div style={{ display:"flex", gap:32, flexWrap:"wrap", justifyContent:"center", paddingTop:16, borderTop:"1px solid var(--bd)", width:"100%" }}>
              {[["◷","30 minutes"],["📹","Google Meet included"],["✉","Instant confirmation email"],["✓","Free cancellation"]].map(([icon, label]) => (
                <div key={label} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:"var(--text-dim)" }}>
                  <span style={{ color:"var(--pink)" }}>{icon}</span>{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fallback */}
        <div style={{ background:"var(--surface)", border:"1px solid var(--bd)", borderRadius:12, padding:"24px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
          <div>
            <div style={{ fontSize:14, fontWeight:600, color:"var(--text)", marginBottom:4 }}>Prefer to reach us directly?</div>
            <div style={{ fontSize:13, color:"var(--text-dim)" }}>Send us an email and we'll reply within one business day.</div>
          </div>
          <a href="mailto:hello@1204studios.com" className="btn btn-ghost btn-sm">hello@1204studios.com</a>
        </div>

      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}
function CaseStudyDetailRoute({ caseStudies }) {
  const { id } = useParams();
  return <CaseStudyDetail id={id} caseStudies={caseStudies} />;
}
function BlogPostDetailRoute({ blogPosts }) {
  const { id } = useParams();
  return <BlogPostDetail id={id} blogPosts={blogPosts} />;
}

/* ═══════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════ */
function AppInner() {
  const [theme, setTheme] = useState("dark");
  const data = useData();

  const toggleTheme = useCallback(() => setTheme(t => t === "dark" ? "light" : "dark"), []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
  }, [theme]);

  if (!data.ready) {
    return (
      <>
        <Styles />
        <div style={{
          minHeight:"100vh", background:"#0a0a0a", display:"flex",
          alignItems:"center", justifyContent:"center", flexDirection:"column", gap:20,
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:4 }}>
            <img src="/logo-white.svg" alt="1204Studios" style={{ height:32, width:"auto" }} />
          </div>
          <div style={{ width:32, height:2, background:"rgba(255,255,255,.1)", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", background:"#ff2d78", animation:"sbLoad 1.2s ease infinite", borderRadius:2 }} />
          </div>
          <style>{`@keyframes sbLoad{0%{width:0;margin-left:0}50%{width:100%;margin-left:0}100%{width:0;margin-left:100%}}`}</style>
        </div>
      </>
    );
  }

  return (
    <>
      <Styles />
      <ScrollToTop />
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main>
        <Routes>
          <Route path="/"                   element={<Home {...data} />} />
          <Route path="/portfolio"          element={<Portfolio caseStudies={data.caseStudies} />} />
          <Route path="/portfolio/:id"      element={<CaseStudyDetailRoute caseStudies={data.caseStudies} />} />
          <Route path="/blog"               element={<Blog blogPosts={data.blogPosts} />} />
          <Route path="/blog/:id"           element={<BlogPostDetailRoute blogPosts={data.blogPosts} />} />
          <Route path="/services/branding"  element={<Branding />} />
          <Route path="/services/marketing" element={<Marketing />} />
          <Route path="/services/print"     element={<Print />} />
          <Route path="/services/tutoring"  element={<Tutoring />} />
          <Route path="/about"              element={<About />} />
          <Route path="/contact"            element={<Contact />} />
          <Route path="/privacy"            element={<PrivacyPolicy />} />
          <Route path="/terms"              element={<TermsOfUse />} />
          <Route path="/book-call"           element={<BookCall />} />
          <Route path="*"                   element={<Home {...data} />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}
