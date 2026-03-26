import { useState, useEffect, useCallback, useRef, memo, useMemo } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";

/* ═══════════════════════════════════════════════
   SUPABASE CLIENT
═══════════════════════════════════════════════ */
const LOGO_WHITE = "/logo-white.svg";
// Inline SVG fallback for when the file doesn't load
function Logo({ height = 26, style = {} }) {
  return (
    <img
      src={LOGO_WHITE}
      alt="1204Studios"
      style={{ height, width: "auto", display: "block", ...style }}
      onError={e => {
        // If SVG file fails to load, replace with text fallback
        e.target.style.display = "none";
        const span = document.createElement("span");
        span.innerHTML = '<span style="font-family:var(--display);font-weight:800;font-size:' + (height * 0.7) + 'px;color:#fff;letter-spacing:-.02em">1204</span><span style="font-family:var(--display);font-weight:800;font-size:' + (height * 0.7) + 'px;color:#ff2d78;letter-spacing:-.02em">Studios</span>';
        span.style.display = "flex";
        span.style.alignItems = "center";
        e.target.parentNode.insertBefore(span, e.target);
      }}
    />
  );
}
const SB_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

// Single Supabase client instance — handles auth session automatically
const supabase = createClient(SB_URL, SB_KEY);

// sbFetch uses the authenticated user's JWT so RLS policies apply correctly
async function sbFetch(table, opts = {}) {
  const { method = "GET", query = "", body } = opts;
  // Get current session token — falls back to anon key if not signed in
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token || SB_KEY;
  const headers = {
    "apikey": SB_KEY,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  const url = `${SB_URL}/rest/v1/${table}${query ? "?" + query : ""}`;
  const r = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.text(); throw new Error(e); }
  if (method === "DELETE") return true;
  const text = await r.text();
  return text ? JSON.parse(text) : [];
}

/* ═══════════════════════════════════════════════
   AUTH — Supabase email + password
═══════════════════════════════════════════════ */
function useAuth() {
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authErr, setAuthErr] = useState("");

  // On mount — restore existing session if still valid
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthed(!!session);
      setLoading(false);
    });
    // Listen for auth state changes (sign in, sign out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthed(!!session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthErr("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setAuthErr(error.message); return false; }
    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  return { authed, loading, login, logout, authErr };
}

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s-]/g,"").replace(/\s+/g,"-").replace(/-+/g,"-").slice(0,80);
}
function fmtDate(ts) {
  if (!ts) return "";
  return new Date(ts).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"});
}
// Convert comma-separated tags string to Postgres array format
function tagsToArray(tags) {
  if (!tags) return null;
  if (Array.isArray(tags)) return tags.map(t => t.trim()).filter(Boolean);
  return String(tags).split(",").map(t => t.trim()).filter(Boolean);
}
const SCORE_COLOR = s => s >= 70 ? "#22c55e" : s >= 40 ? "#eab308" : "#ef4444";
const STATUS_COLORS = {
  new:"#3b82f6", contacted:"#a855f7", qualified:"#22c55e",
  proposal_sent:"#eab308", won:"#22c55e", lost:"#ef4444",
};

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:"fixed",bottom:24,right:24,zIndex:300,padding:"12px 20px",borderRadius:10,
      fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:10,animation:"fadeUp .25s ease",
      background:"var(--s2)",color:type==="success"?"var(--green)":"#ef4444",
      border:`1px solid ${type==="success"?"rgba(34,197,94,.3)":"rgba(239,68,68,.3)"}`,
    }}>{type==="success"?"✓":"✕"} {msg}</div>
  );
}
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type="success") => setToast({msg,type,key:Date.now()}),[]);
  const el = toast ? <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} /> : null;
  return { show, el };
}

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const Styles = memo(() => (
  <style>{`
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
    :root{
      --bg:#080808;--s1:#0f0f0f;--s2:#161616;--s3:#1d1d1d;
      --bd:rgba(255,255,255,0.06);--bd2:rgba(255,255,255,0.11);--bd3:rgba(255,255,255,0.18);
      --text:#f0ece6;--dim:rgba(240,236,230,0.55);--muted:rgba(240,236,230,0.28);
      --pink:#ff2d78;--pink-dim:rgba(255,45,120,0.08);--pink-bd:rgba(255,45,120,0.2);
      --green:#22c55e;--yellow:#eab308;--blue:#3b82f6;--cyan:#00d4e8;--orange:#F26419;--purple:#a855f7;
      --surface:rgba(255,255,255,0.03);--hover:rgba(255,255,255,0.04);
      --font:-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif;
      --display:-apple-system,'SF Pro Display',BlinkMacSystemFont,'Helvetica Neue',sans-serif;
    }
    html,body,#root{height:100%;}
    body{background:var(--bg);color:var(--text);font-family:var(--font);-webkit-font-smoothing:antialiased;overflow-x:hidden;}
    a{text-decoration:none;color:inherit;}button{cursor:pointer;font-family:inherit;}
    input,textarea,select{font-family:inherit;}
    ::-webkit-scrollbar{width:3px;height:3px;}::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:3px;}
    .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;font-size:13px;font-weight:600;border:none;border-radius:8px;cursor:pointer;letter-spacing:-.01em;transition:all .15s;white-space:nowrap;}
    .btn-primary{background:var(--pink);color:#fff;border:1px solid var(--pink);}.btn-primary:hover{opacity:.88;}.btn-primary:disabled{opacity:.5;cursor:default;}
    .btn-ghost{background:rgba(255,255,255,.05);color:var(--dim);border:1px solid var(--bd2);}.btn-ghost:hover{background:rgba(255,255,255,.08);color:var(--text);}
    .btn-danger{background:rgba(239,68,68,.1);color:#ef4444;border:1px solid rgba(239,68,68,.2);}.btn-danger:hover{background:rgba(239,68,68,.18);}
    .btn-success{background:rgba(34,197,94,.1);color:var(--green);border:1px solid rgba(34,197,94,.25);}
    .btn-sm{padding:6px 13px;font-size:12px;border-radius:6px;}.btn-xs{padding:3px 9px;font-size:11px;border-radius:5px;}
    .card{background:var(--s1);border:1px solid var(--bd);border-radius:12px;}
    .input{width:100%;padding:10px 13px;background:var(--s2);border:1px solid var(--bd2);border-radius:8px;color:var(--text);font-size:13.5px;outline:none;transition:border-color .15s;}
    .input:focus{border-color:var(--pink);}.input::placeholder{color:var(--muted);}
    textarea.input{resize:vertical;min-height:90px;line-height:1.7;}
    select.input{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;padding-right:32px;}
    .lbl{font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);}
    .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:10.5px;font-weight:700;white-space:nowrap;}
    .badge-green{background:rgba(34,197,94,.1);color:var(--green);border:1px solid rgba(34,197,94,.25);}
    .badge-pink{background:rgba(255,45,120,.1);color:var(--pink);border:1px solid rgba(255,45,120,.25);}
    .badge-blue{background:rgba(59,130,246,.1);color:var(--blue);border:1px solid rgba(59,130,246,.25);}
    .badge-dim{background:rgba(255,255,255,.06);color:var(--dim);border:1px solid var(--bd2);}
    .table{width:100%;border-collapse:collapse;}
    .table th{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);padding:10px 16px;text-align:left;border-bottom:1px solid var(--bd);white-space:nowrap;}
    .table td{padding:13px 16px;border-bottom:1px solid var(--bd);font-size:13.5px;vertical-align:middle;}
    .table tr:last-child td{border-bottom:none;}.table tr:hover td{background:var(--hover);}
    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.8);backdrop-filter:blur(8px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
    .modal{background:var(--s1);border:1px solid var(--bd2);border-radius:16px;width:100%;max-width:700px;max-height:90vh;display:flex;flex-direction:column;}
    .modal-head{padding:22px 26px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
    .modal-body{padding:24px 26px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:18px;}
    .modal-foot{padding:18px 26px;border-top:1px solid var(--bd);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;}
    .sl{display:flex;align-items:center;gap:9px;padding:7px 10px;border-radius:7px;font-size:13px;font-weight:500;color:var(--dim);margin-bottom:1px;transition:all .15s;user-select:none;}
    .sl:hover{background:rgba(255,255,255,.04);color:var(--text);}.sl.active{background:rgba(255,45,120,.1);color:var(--pink);}
    .pipeline-col{flex:1;min-width:180px;background:var(--s1);border:1px solid var(--bd);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:8px;}
    .lead-card{background:var(--s2);border:1px solid var(--bd2);border-radius:8px;padding:12px 14px;cursor:pointer;transition:border-color .15s;}
    .lead-card:hover{border-color:var(--bd3);}
    .score-bar{height:4px;border-radius:2px;background:var(--bd2);overflow:hidden;margin-top:6px;}
    .score-fill{height:100%;border-radius:2px;transition:width .3s;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    .fade-up{animation:fadeUp .3s ease both;}
    @keyframes spin{to{transform:rotate(360deg);}}.spin{animation:spin .7s linear infinite;display:inline-block;}
  `}</style>
));

/* ═══════════════════════════════════════════════
   SHARED COMPONENTS
═══════════════════════════════════════════════ */
function Loader({ label="Loading…" }) {
  return <div style={{padding:"72px 0",display:"flex",alignItems:"center",justifyContent:"center",gap:10,color:"var(--muted)",fontSize:13}}><span className="spin" style={{fontSize:18}}>◌</span> {label}</div>;
}
function Empty({ icon, label, action }) {
  return <div style={{padding:"60px 0",textAlign:"center",color:"var(--muted)"}}><div style={{fontSize:36,marginBottom:12}}>{icon}</div><p style={{fontSize:14,marginBottom:action?20:0}}>{label}</p>{action}</div>;
}
function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="card fade-up" style={{maxWidth:360,padding:"32px 28px",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:36,marginBottom:14}}>⚠</div>
        <p style={{fontSize:14.5,fontWeight:600,color:"var(--text)",marginBottom:8}}>Are you sure?</p>
        <p style={{fontSize:13,color:"var(--dim)",marginBottom:28}}>{msg}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}
function ImageField({ label, value, onChange }) {
  return (
    <div>
      <label className="lbl" style={{display:"block",marginBottom:8}}>{label}</label>
      <input className="input" placeholder="Paste image URL…" value={value||""} onChange={e=>onChange(e.target.value)} />
      {value && (
        <div style={{marginTop:10,borderRadius:8,overflow:"hidden",border:"1px solid var(--bd)",maxHeight:160,display:"flex",background:"var(--s2)"}}>
          {value.match(/\.(mp4|mov|webm)/i) ? <video src={value} controls style={{maxHeight:160,maxWidth:"100%",margin:"auto"}} /> : <img src={value} alt="" style={{maxHeight:160,maxWidth:"100%",objectFit:"cover",display:"block"}} />}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
const NAV = [
  { path:"/",           label:"Dashboard",     icon:"▣" },
  { path:"/leads",      label:"Lead Pipeline", icon:"◎" },
  { path:"/clients",    label:"Clients",       icon:"◈" },
  { path:"/blog",       label:"Blog Posts",    icon:"✍" },
  { path:"/portfolio",  label:"Portfolio",     icon:"◆" },
  { path:"/media",      label:"Media",         icon:"🖼" },
];

function Sidebar({ logout }) {
  const { pathname } = useLocation();
  return (
    <aside style={{width:220,flexShrink:0,background:"var(--s1)",borderRight:"1px solid var(--bd)",display:"flex",flexDirection:"column",height:"100vh",overflow:"hidden"}}>
      <div style={{padding:"16px 16px 12px",borderBottom:"1px solid var(--bd)"}}>
        <Link to="/"><Logo height={26} /></Link>
        <p style={{fontSize:10,color:"var(--muted)",marginTop:3,letterSpacing:"1px",textTransform:"uppercase",fontWeight:700}}>Admin</p>
      </div>
      <nav style={{padding:"8px",flex:1,overflowY:"auto"}}>
        <div style={{fontSize:"9.5px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted)",padding:"12px 12px 6px"}}>CRM</div>
        {NAV.slice(0,3).map(n=>(
          <Link key={n.path} to={n.path} className={`sl${pathname===n.path?" active":""}`}>
            <span style={{fontSize:14}}>{n.icon}</span>{n.label}
          </Link>
        ))}
        <div style={{fontSize:"9.5px",fontWeight:700,letterSpacing:"2px",textTransform:"uppercase",color:"var(--muted)",padding:"16px 12px 6px"}}>Content</div>
        {NAV.slice(3).map(n=>(
          <Link key={n.path} to={n.path} className={`sl${pathname===n.path?" active":""}`}>
            <span style={{fontSize:14}}>{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
      <div style={{padding:"12px 8px",borderTop:"1px solid var(--bd)"}}>
        <a href="https://1204studios.com" target="_blank" rel="noreferrer" className="sl">↗ Live Site</a>
        <button onClick={logout} className="sl" style={{width:"100%",background:"none",border:"none",color:"var(--dim)",textAlign:"left"}}>→ Sign Out</button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════ */
function Login({ login, authErr }) {
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim()) { setErr("Email is required."); return; }
    if (!pw.trim())    { setErr("Password is required."); return; }
    setLoading(true); setErr("");
    const ok = await login(email.trim(), pw);
    if (!ok) setErr(authErr || "Incorrect email or password.");
    setLoading(false);
  };

  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)"}}>
      <Styles />
      <div className="card fade-up" style={{width:"100%",maxWidth:380,padding:"44px 36px"}}>
        <div style={{marginBottom:32,textAlign:"center"}}>
          <Logo height={30} style={{margin:"0 auto 12px"}} />
          <p style={{fontSize:13.5,color:"var(--dim)"}}>Sign in to CMS & CRM</p>
        </div>
        <label className="lbl" style={{display:"block",marginBottom:8}}>Email</label>
        <input
          type="email" className="input" placeholder="admin@1204studios.com"
          value={email} onChange={e=>setEmail(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&submit()}
          autoFocus style={{marginBottom:16}}
        />
        <label className="lbl" style={{display:"block",marginBottom:8}}>Password</label>
        <div style={{position:"relative",marginBottom:err?6:20}}>
          <input
            type={showPw?"text":"password"} className="input" placeholder="Your password"
            value={pw} onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&submit()}
            style={{paddingRight:42}}
          />
          <button
            type="button"
            onClick={()=>setShowPw(v=>!v)}
            style={{position:"absolute",right:1,top:1,bottom:1,width:38,display:"flex",alignItems:"center",justifyContent:"center",background:"none",border:"none",cursor:"pointer",color:"var(--muted)",fontSize:16,borderRadius:"0 7px 7px 0",transition:"color .15s"}}
            onMouseOver={e=>e.currentTarget.style.color="var(--text)"}
            onMouseOut={e=>e.currentTarget.style.color="var(--muted)"}
            title={showPw?"Hide password":"Show password"}
          >
            {showPw ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            )}
          </button>
        </div>
        {err && <p style={{fontSize:12,color:"#f87171",marginBottom:14}}>{err}</p>}
        <button onClick={submit} disabled={loading} className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:"12px"}}>
          {loading ? <span className="spin">◌</span> : "Sign In →"}
        </button>
        <p style={{fontSize:11,color:"var(--muted)",textAlign:"center",marginTop:20}}>admin.1204studios.com · Restricted Access</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
function Dashboard() {
  const [stats, setStats] = useState({blog:0,portfolio:0,leads:0,clients:0,newLeads:0,hotLeads:0});
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [bp, cs, ld, cl] = await Promise.all([
          sbFetch("blog_posts",   { query:"select=id,featured" }),
          sbFetch("case_studies", { query:"select=id,featured" }),
          sbFetch("leads",        { query:"select=*&order=created_at.desc&limit=10" }),
          sbFetch("clients",      { query:"select=id,status" }),
        ]);
        const leadsArr = Array.isArray(ld) ? ld : [];
        setLeads(leadsArr.slice(0,5));
        setStats({
          blog: Array.isArray(bp)?bp.length:0,
          portfolio: Array.isArray(cs)?cs.length:0,
          leads: leadsArr.length,
          clients: Array.isArray(cl)?cl.length:0,
          newLeads: leadsArr.filter(l=>l.status==="new").length,
          hotLeads: leadsArr.filter(l=>l.score>=70).length,
        });
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div style={{padding:"24px 32px 48px"}}>
      <div style={{marginBottom:32}}><h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-.02em",fontFamily:"var(--display)",marginBottom:5}}>Dashboard</h1><p style={{fontSize:13.5,color:"var(--dim)"}}>CRM and content overview.</p></div>
      {loading ? <Loader /> : (
        <>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:32}}>
            {[
              {label:"Total Leads",value:stats.leads,sub:`${stats.newLeads} new · ${stats.hotLeads} hot`,icon:"◎",color:"var(--blue)",to:"/leads"},
              {label:"Active Clients",value:stats.clients,sub:"total clients",icon:"◈",color:"var(--green)",to:"/clients"},
              {label:"Blog Posts",value:stats.blog,sub:"published",icon:"✍",color:"var(--pink)",to:"/blog"},
              {label:"Case Studies",value:stats.portfolio,sub:"in portfolio",icon:"◆",color:"var(--yellow)",to:"/portfolio"},
            ].map(c=>(
              <Link key={c.label} to={c.to} className="card" style={{padding:"22px 20px",display:"block"}}>
                <div style={{fontSize:18,marginBottom:14,color:c.color}}>{c.icon}</div>
                <div style={{fontSize:30,fontWeight:700,color:"var(--text)",fontFamily:"var(--display)",letterSpacing:"-.02em",marginBottom:3}}>{c.value}</div>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:2}}>{c.label}</div>
                <div style={{fontSize:12,color:"var(--muted)"}}>{c.sub}</div>
              </Link>
            ))}
          </div>
          <div className="card" style={{padding:"20px 24px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <p style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>Recent Leads</p>
              <Link to="/leads" className="btn btn-ghost btn-sm">View All →</Link>
            </div>
            {leads.map(l=>(
              <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid var(--bd)"}}>
                <div><div style={{fontSize:13.5,fontWeight:600,color:"var(--text)"}}>{l.name}</div><div style={{fontSize:12,color:"var(--muted)"}}>{l.company||l.email||""}</div></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <span style={{fontSize:11,fontWeight:700,color:SCORE_COLOR(l.score||0)}}>{l.score||0}pts</span>
                  <span className="badge" style={{background:`${STATUS_COLORS[l.status]||"#888"}18`,color:STATUS_COLORS[l.status]||"#888",border:`1px solid ${STATUS_COLORS[l.status]||"#888"}30`}}>{(l.status||"").replace("_"," ")}</span>
                </div>
              </div>
            ))}
            {leads.length===0 && <p style={{fontSize:13,color:"var(--muted)",padding:"20px 0",textAlign:"center"}}>No leads yet. They appear here when the website contact form is submitted.</p>}
          </div>
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   LEAD PIPELINE
═══════════════════════════════════════════════ */
const PIPELINE_STAGES = [
  {key:"new",label:"New",color:"#3b82f6"},
  {key:"contacted",label:"Contacted",color:"#a855f7"},
  {key:"qualified",label:"Qualified",color:"#f59e0b"},
  {key:"proposal_sent",label:"Proposal Sent",color:"#f97316"},
  {key:"won",label:"Won",color:"#22c55e"},
  {key:"lost",label:"Lost",color:"#ef4444"},
];

function LeadPipeline() {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { show, el:toastEl }  = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setLeads(await sbFetch("leads", { query:"select=*&order=created_at.desc" })); }
    catch { show("Failed to load leads","error"); }
    setLoading(false);
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const byStage = useMemo(() => {
    const m = {}; PIPELINE_STAGES.forEach(s=>{m[s.key]=[];}); 
    leads.forEach(l=>{ if(m[l.status]) m[l.status].push(l); }); return m;
  }, [leads]);

  const save = async (data) => {
    try {
      const {id,...payload} = data;
      if (id) await sbFetch(`leads?id=eq.${id}`, {method:"PATCH", body:payload});
      else await sbFetch("leads", {method:"POST", body:{...payload,score:payload.score||0,status:"new",created_at:new Date().toISOString()}});
      show("Saved"); setModal(null); load();
    } catch(e){ show("Failed: "+e.message,"error"); }
  };

  const del = async (id) => {
    try { await sbFetch(`leads?id=eq.${id}`, {method:"DELETE"}); show("Deleted"); setConfirm(null); load(); }
    catch { show("Failed","error"); }
  };

  const handleStatusChange = async (id, status) => {
    try { await sbFetch(`leads?id=eq.${id}`, {method:"PATCH", body:{status}}); show("Updated"); load(); }
    catch { show("Failed","error"); }
  };

  const handleConvert = async (lead) => {
    try {
      await sbFetch("clients", {method:"POST", body:{id:lead.id,name:lead.name,company:lead.company,email:lead.email,phone:lead.phone,status:"active",created_at:new Date().toISOString()}});
      await sbFetch(`leads?id=eq.${lead.id}`, {method:"PATCH", body:{status:"won"}});
      show("Converted to client"); load();
    } catch(e){ show("Failed","error"); }
  };

  if (loading) return <div style={{padding:"24px 32px"}}><Loader /></div>;

  return (
    <div style={{padding:"24px 32px 48px"}}>
      {toastEl}
      {confirm && <Confirm msg="Delete this lead?" onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)} />}
      {modal && <LeadModal lead={modal} onClose={()=>setModal(null)} onSave={save} />}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:24}}>
        <div><h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-.02em",fontFamily:"var(--display)",marginBottom:5}}>Lead Pipeline</h1>
          <p style={{fontSize:13.5,color:"var(--dim)"}}>{leads.length} leads · {leads.filter(l=>l.score>=70).length} hot</p></div>
        <button onClick={()=>setModal({name:"",email:"",phone:"",company:"",source:"direct",service_interest:"",message:"",budget:"",score:0,status:"new"})} className="btn btn-primary">+ Add Lead</button>
      </div>
      <div style={{display:"flex",gap:12,overflowX:"auto",paddingBottom:8}}>
        {PIPELINE_STAGES.map(stage=>(
          <div key={stage.key} className="pipeline-col">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:11,fontWeight:700,letterSpacing:"1.5px",textTransform:"uppercase",color:stage.color}}>{stage.label}</span>
              <span style={{fontSize:12,color:"var(--muted)",fontWeight:600}}>{byStage[stage.key]?.length||0}</span>
            </div>
            {byStage[stage.key]?.map(lead=>(
              <div key={lead.id} className="lead-card" onClick={()=>setModal({...lead})}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)",marginBottom:2}}>{lead.name}</div>
                {lead.company && <div style={{fontSize:12,color:"var(--muted)",marginBottom:4}}>{lead.company}</div>}
                {lead.service_interest && <span className="badge badge-dim" style={{marginBottom:6,fontSize:10}}>{lead.service_interest}</span>}
                <div className="score-bar"><div className="score-fill" style={{width:`${lead.score||0}%`,background:SCORE_COLOR(lead.score||0)}} /></div>
                <div style={{fontSize:10,color:SCORE_COLOR(lead.score||0),marginTop:3,fontWeight:700}}>{lead.score||0}% match</div>
                <div style={{display:"flex",gap:4,marginTop:8,flexWrap:"wrap"}} onClick={e=>e.stopPropagation()}>
                  {stage.key!=="won"&&stage.key!=="lost"&&(
                    <select value={lead.status} onChange={e=>handleStatusChange(lead.id,e.target.value)} className="input" style={{fontSize:11,padding:"3px 8px",height:26,flex:1}}>
                      {PIPELINE_STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
                    </select>
                  )}
                  {stage.key==="qualified"&&<button onClick={()=>handleConvert(lead)} className="btn btn-success btn-xs" style={{flex:1}}>Convert</button>}
                  <button onClick={()=>setConfirm(lead.id)} className="btn btn-danger btn-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function LeadModal({ lead, onClose, onSave }) {
  const [form, setForm] = useState(lead); const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = async () => { setSaving(true); await onSave(form); setSaving(false); };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><h2 style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{lead.id?"Edit Lead":"New Lead"}</h2><button onClick={onClose} className="btn btn-ghost btn-sm">✕</button></div>
        <div className="modal-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            {[["name","Name"],["email","Email"],["phone","Phone"],["company","Company"]].map(([k,l])=>(
              <div key={k}><label className="lbl" style={{display:"block",marginBottom:6}}>{l}</label><input className="input" value={form[k]||""} onChange={e=>set(k,e.target.value)} /></div>
            ))}
            <div><label className="lbl" style={{display:"block",marginBottom:6}}>Source</label>
              <select className="input" value={form.source||"direct"} onChange={e=>set("source",e.target.value)}>
                {["website","referral","linkedin","instagram","direct","email","event"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:6}}>Service Interest</label>
              <select className="input" value={form.service_interest||""} onChange={e=>set("service_interest",e.target.value)}>
                <option value="">Select…</option>
                {["Brand Design","Marketing","Print Media","Web / Digital","Tutoring","Strategy"].map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:6}}>Budget</label>
              <select className="input" value={form.budget||""} onChange={e=>set("budget",e.target.value)}>
                <option value="">Select…</option>
                {["₦100k–₦300k","₦300k–₦700k","₦700k–₦1.5M","₦1.5M+"].map(b=><option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:6}}>Status</label>
              <select className="input" value={form.status||"new"} onChange={e=>set("status",e.target.value)}>
                {PIPELINE_STAGES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:6}}>Score (0-100)</label>
              <input type="number" className="input" min="0" max="100" value={form.score||0} onChange={e=>set("score",+e.target.value)} />
            </div>
          </div>
          <div><label className="lbl" style={{display:"block",marginBottom:6}}>Notes</label>
            <textarea className="input" value={form.notes||form.message||""} onChange={e=>set("notes",e.target.value)} style={{minHeight:80}} />
          </div>
        </div>
        <div className="modal-foot">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">{saving?<><span className="spin">◌</span> Saving…</>:"Save Lead"}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   CLIENTS
═══════════════════════════════════════════════ */
function ClientsPage() {
  const [clients, setClients] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); const [confirm, setConfirm] = useState(null);
  const { show, el:toastEl } = useToast();
  const EMPTY = {name:"",company:"",email:"",phone:"",address:"",notes:"",status:"active"};

  const load = useCallback(async () => {
    setLoading(true);
    try { setClients(await sbFetch("clients", {query:"select=*&order=created_at.desc"})); }
    catch { show("Failed to load","error"); }
    setLoading(false);
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const save = async (data) => {
    try {
      const {id,...payload} = data;
      if (id) await sbFetch(`clients?id=eq.${id}`, {method:"PATCH", body:payload});
      else await sbFetch("clients", {method:"POST", body:{...payload,id:crypto.randomUUID(),created_at:new Date().toISOString()}});
      show("Saved"); setModal(null); load();
    } catch(e){ show("Failed","error"); }
  };

  const del = async (id) => {
    try { await sbFetch(`clients?id=eq.${id}`, {method:"DELETE"}); show("Deleted"); setConfirm(null); load(); }
    catch { show("Failed","error"); }
  };

  return (
    <div style={{padding:"24px 32px 48px"}}>
      {toastEl}
      {confirm && <Confirm msg="Delete this client?" onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)} />}
      {modal && (
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h2 style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{modal.id?"Edit Client":"New Client"}</h2><button onClick={()=>setModal(null)} className="btn btn-ghost btn-sm">✕</button></div>
            <div className="modal-body">
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                {[["name","Name"],["company","Company"],["email","Email"],["phone","Phone"]].map(([k,l])=>(
                  <div key={k}><label className="lbl" style={{display:"block",marginBottom:6}}>{l}</label><input className="input" value={modal[k]||""} onChange={e=>setModal(m=>({...m,[k]:e.target.value}))} /></div>
                ))}
                <div style={{gridColumn:"1/-1"}}><label className="lbl" style={{display:"block",marginBottom:6}}>Address</label><input className="input" value={modal.address||""} onChange={e=>setModal(m=>({...m,address:e.target.value}))} /></div>
                <div><label className="lbl" style={{display:"block",marginBottom:6}}>Status</label>
                  <select className="input" value={modal.status||"active"} onChange={e=>setModal(m=>({...m,status:e.target.value}))}>
                    {["active","inactive","prospect"].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{gridColumn:"1/-1"}}><label className="lbl" style={{display:"block",marginBottom:6}}>Notes</label><textarea className="input" value={modal.notes||""} onChange={e=>setModal(m=>({...m,notes:e.target.value}))} style={{minHeight:70}} /></div>
              </div>
            </div>
            <div className="modal-foot">
              <button onClick={()=>setModal(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={()=>save(modal)} className="btn btn-primary">Save Client</button>
            </div>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
        <div><h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-.02em",fontFamily:"var(--display)",marginBottom:5}}>Clients</h1><p style={{fontSize:13.5,color:"var(--dim)"}}>{clients.length} client{clients.length!==1?"s":""}</p></div>
        <button onClick={()=>setModal({...EMPTY})} className="btn btn-primary">+ New Client</button>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        {loading ? <Loader /> : clients.length===0 ? <Empty icon="◈" label="No clients yet." /> : (
          <table className="table">
            <thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Status</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
            <tbody>
              {clients.map(c=>(
                <tr key={c.id}>
                  <td style={{fontWeight:600}}>{c.name}</td>
                  <td style={{color:"var(--dim)"}}>{c.company||"—"}</td>
                  <td style={{color:"var(--dim)",fontSize:13}}>{c.email||"—"}</td>
                  <td><span className={`badge ${c.status==="active"?"badge-green":"badge-dim"}`}>{c.status}</span></td>
                  <td><div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button onClick={()=>setModal({...c})} className="btn btn-ghost btn-sm">Edit</button>
                    <button onClick={()=>setConfirm(c.id)} className="btn btn-danger btn-sm">Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BLOG MANAGER
═══════════════════════════════════════════════ */
function BlogManager() {
  const [posts, setPosts] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); const [confirm, setConfirm] = useState(null);
  const { show, el:toastEl } = useToast();
  const EMPTY = {title:"",slug:"",content:"",excerpt:"",cover_image:"",featured:false,display_order:0,category:"",tags:"",author:"",read_time:"5 min read",published:true};

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts(await sbFetch("blog_posts",{query:"select=*&order=created_at.desc"})); }
    catch { show("Failed to load","error"); }
    setLoading(false);
  }, [show]);

  useEffect(()=>{load();},[load]);

  const save = async (data) => {
    try {
      const {id, _slugEdited, ...raw} = data;
      const slug = (raw.slug||slugify(raw.title)).toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
      const cleaned = {};
      if (raw.title != null) cleaned.title = raw.title;
      cleaned.slug = slug;
      if (raw.category != null) cleaned.category = raw.category;
      if (raw.author != null) cleaned.author = raw.author;
      if (raw.cover_image != null) cleaned.cover_image = raw.cover_image;
      if (raw.excerpt != null) cleaned.excerpt = raw.excerpt;
      if (raw.content != null) cleaned.content = raw.content;
      if (raw.read_time != null) cleaned.read_time = raw.read_time;
      cleaned.featured = !!raw.featured;
      cleaned.published = raw.published !== false;
      cleaned.display_order = raw.display_order || 0;
      cleaned.tags = tagsToArray(raw.tags);

      if (id) await sbFetch(`blog_posts?id=eq.${id}`,{method:"PATCH",body:cleaned});
      else await sbFetch("blog_posts",{method:"POST",body:{...cleaned,id:crypto.randomUUID(),created_at:new Date().toISOString()}});
      show("Saved"); setModal(null); load();
    } catch(e){ show("Failed: "+e.message,"error"); }
  };

  const del = async (id) => {
    try { await sbFetch(`blog_posts?id=eq.${id}`,{method:"DELETE"}); show("Deleted"); setConfirm(null); load(); }
    catch { show("Failed","error"); }
  };

  return (
    <div style={{padding:"24px 32px 48px"}}>
      {toastEl}
      {confirm && <Confirm msg="Delete this post permanently?" onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)} />}
      {modal && <PostModal mode={modal.id?"edit":"new"} data={modal} onSave={save} onClose={()=>setModal(null)} />}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
        <div><h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-.02em",fontFamily:"var(--display)",marginBottom:5}}>Blog Posts</h1><p style={{fontSize:13.5,color:"var(--dim)"}}>{posts.length} post{posts.length!==1?"s":""}</p></div>
        <button onClick={()=>setModal({...EMPTY})} className="btn btn-primary">+ New Post</button>
      </div>
      <div className="card" style={{overflow:"hidden"}}>
        {loading ? <Loader /> : posts.length===0 ? <Empty icon="✍" label="No blog posts yet." action={<button onClick={()=>setModal({...EMPTY})} className="btn btn-primary btn-sm">Write your first post</button>} /> : (
          <table className="table">
            <thead><tr><th>Post</th><th>Category</th><th>Featured</th><th>Published</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
            <tbody>
              {posts.map(p=>(
                <tr key={p.id}>
                  <td><div style={{display:"flex",alignItems:"center",gap:12}}>
                    {p.cover_image&&<img src={p.cover_image} alt="" style={{width:44,height:44,borderRadius:6,objectFit:"cover",border:"1px solid var(--bd)",flexShrink:0}} />}
                    <div><div style={{fontWeight:600,color:"var(--text)",maxWidth:280}}>{p.title}</div><div style={{fontSize:12,color:"var(--muted)",marginTop:2,maxWidth:280,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.excerpt}</div></div>
                  </div></td>
                  <td>{p.category?<span className="badge badge-pink">{p.category}</span>:<span style={{color:"var(--muted)"}}>—</span>}</td>
                  <td>{p.featured?<span className="badge badge-green">Featured</span>:<span style={{color:"var(--muted)",fontSize:12}}>—</span>}</td>
                  <td>{p.published?<span className="badge badge-blue">Published</span>:<span className="badge badge-dim">Draft</span>}</td>
                  <td><div style={{display:"flex",gap:6,justifyContent:"flex-end"}}>
                    <button onClick={()=>setModal({...p,tags:Array.isArray(p.tags)?p.tags.join(", "):p.tags||""})} className="btn btn-ghost btn-sm">Edit</button>
                    <button onClick={()=>setConfirm(p.id)} className="btn btn-danger btn-sm">Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PostModal({ mode, data, onSave, onClose }) {
  const [form, setForm] = useState(data); const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>{ const u={...f,[k]:v}; if(k==="title"&&!f._slugEdited)u.slug=slugify(v); if(k==="slug")u._slugEdited=true; return u; });
  const submit = async () => { if(!form.title?.trim()){alert("Title required");return;} setSaving(true); await onSave(form); setSaving(false); };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:720}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head"><h2 style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{mode==="new"?"New Blog Post":"Edit Blog Post"}</h2><button onClick={onClose} className="btn btn-ghost btn-sm">✕</button></div>
        <div className="modal-body">
          <ImageField label="Cover Image" value={form.cover_image} onChange={v=>set("cover_image",v)} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><label className="lbl" style={{display:"block",marginBottom:8}}>Title</label><input className="input" value={form.title||""} onChange={e=>set("title",e.target.value)} maxLength={120} /></div>
            <div style={{gridColumn:"1/-1"}}><label className="lbl" style={{display:"block",marginBottom:8}}>Slug</label>
              <div style={{display:"flex",alignItems:"center",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                <span style={{padding:"10px 12px",fontSize:13,color:"var(--muted)",borderRight:"1px solid var(--bd)",whiteSpace:"nowrap"}}>1204studios.com/blog/</span>
                <input className="input" value={form.slug||""} onChange={e=>set("slug",e.target.value)} style={{border:"none",borderRadius:0,background:"transparent",fontFamily:"monospace"}} />
              </div>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Category</label><input className="input" value={form.category||""} onChange={e=>set("category",e.target.value)} /></div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Author</label><input className="input" value={form.author||""} onChange={e=>set("author",e.target.value)} /></div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Read Time</label><input className="input" value={form.read_time||""} onChange={e=>set("read_time",e.target.value)} placeholder="5 min read" /></div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Display Order</label><input type="number" className="input" value={form.display_order||0} onChange={e=>set("display_order",+e.target.value)} /></div>
          </div>
          <div><label className="lbl" style={{display:"block",marginBottom:8}}>Excerpt</label><textarea className="input" value={form.excerpt||""} onChange={e=>set("excerpt",e.target.value)} style={{minHeight:70}} /></div>
          <div><label className="lbl" style={{display:"block",marginBottom:8}}>Content</label><textarea className="input" value={form.content||""} onChange={e=>set("content",e.target.value)} style={{minHeight:280,fontFamily:"monospace",fontSize:13}} /></div>
          <div style={{display:"flex",gap:20}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13.5,color:"var(--text)"}}><input type="checkbox" checked={!!form.featured} onChange={e=>set("featured",e.target.checked)} style={{width:15,height:15,accentColor:"var(--pink)"}} />Featured</label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13.5,color:"var(--text)"}}><input type="checkbox" checked={!!form.published} onChange={e=>set("published",e.target.checked)} style={{width:15,height:15,accentColor:"var(--pink)"}} />Published</label>
          </div>
        </div>
        <div className="modal-foot"><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={submit} disabled={saving} className="btn btn-primary">{saving?<><span className="spin">◌</span> Saving…</>:mode==="new"?"Publish":"Save Changes"}</button></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PORTFOLIO MANAGER
═══════════════════════════════════════════════ */
function PortfolioManager() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); const [confirm, setConfirm] = useState(null);
  const { show, el:toastEl } = useToast();
  const EMPTY = {title:"",slug:"",client:"",category:"",tags:"",cover_image:"",hero_color:"#1a1a1a",year:new Date().getFullYear().toString(),content:"",excerpt:"",challenge:"",approach:"",results:"",featured:false,display_order:0,testimonial:"",published:true};

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await sbFetch("case_studies",{query:"select=*&order=display_order.asc"})); }
    catch { show("Failed to load","error"); }
    setLoading(false);
  }, [show]);

  useEffect(()=>{load();},[load]);

  const save = async (data) => {
    try {
      const {id, _slugEdited, ...raw} = data;
      // Only send columns that exist in case_studies table
      const slug = (raw.slug||slugify(raw.title)).toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");
      const cleaned = {};
      // Core fields (always exist)
      if (raw.title != null) cleaned.title = raw.title;
      cleaned.slug = slug;
      if (raw.client != null) cleaned.client = raw.client;
      if (raw.category != null) cleaned.category = raw.category;
      if (raw.cover_image != null) cleaned.cover_image = raw.cover_image;
      if (raw.excerpt != null) cleaned.excerpt = raw.excerpt;
      if (raw.content != null) cleaned.content = raw.content;
      if (raw.results != null) cleaned.results = raw.results;
      if (raw.testimonial != null) cleaned.testimonial = raw.testimonial;
      cleaned.featured = !!raw.featured;
      cleaned.published = raw.published !== false;
      cleaned.display_order = raw.display_order || 0;
      // Tags: convert string to array for Postgres text[] column
      cleaned.tags = tagsToArray(raw.tags);
      // New fields (safe: Supabase ignores unknown columns on PATCH)
      if (raw.hero_color != null) cleaned.hero_color = raw.hero_color;
      if (raw.year != null) cleaned.year = raw.year;
      if (raw.challenge != null) cleaned.challenge = raw.challenge;
      if (raw.approach != null) cleaned.approach = raw.approach;

      if (id) await sbFetch(`case_studies?id=eq.${id}`,{method:"PATCH",body:cleaned});
      else await sbFetch("case_studies",{method:"POST",body:{...cleaned,id:crypto.randomUUID(),created_at:new Date().toISOString()}});
      show("Saved"); setModal(null); load();
    } catch(e){ show("Failed: "+e.message,"error"); }
  };

  const del = async (id) => {
    try { await sbFetch(`case_studies?id=eq.${id}`,{method:"DELETE"}); show("Deleted"); setConfirm(null); load(); }
    catch { show("Failed","error"); }
  };

  return (
    <div style={{padding:"24px 32px 48px"}}>
      {toastEl}
      {confirm && <Confirm msg="Delete this case study?" onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)} />}
      {modal && <CSModal mode={modal.id?"edit":"new"} data={modal} onSave={save} onClose={()=>setModal(null)} />}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:28}}>
        <div><h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-.02em",fontFamily:"var(--display)",marginBottom:5}}>Portfolio</h1><p style={{fontSize:13.5,color:"var(--dim)"}}>{items.length} case stud{items.length!==1?"ies":"y"}</p></div>
        <button onClick={()=>setModal({...EMPTY})} className="btn btn-primary">+ New Case Study</button>
      </div>
      {loading ? <Loader /> : items.length===0 ? <div className="card"><Empty icon="◆" label="No case studies yet." /></div> : (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))",gap:14}}>
          {items.map(cs=>(
            <div key={cs.id} className="card" style={{overflow:"hidden"}}>
              {cs.cover_image?<img src={cs.cover_image} alt={cs.title} style={{width:"100%",height:140,objectFit:"cover",display:"block"}} />:<div style={{height:6,background:"var(--pink)"}} />}
              <div style={{padding:"18px 18px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8}}>
                  <h3 style={{fontSize:13.5,fontWeight:700,color:"var(--text)",lineHeight:1.4}}>{cs.title}</h3>
                  {cs.featured&&<span className="badge badge-green" style={{flexShrink:0}}>Featured</span>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  {cs.category&&<span className="badge badge-pink">{cs.category}</span>}
                  {!cs.published&&<span className="badge badge-dim">Draft</span>}
                </div>
                <p style={{fontSize:12.5,color:"var(--muted)",lineHeight:1.6,marginBottom:14,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{cs.excerpt}</p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setModal({...cs,tags:typeof cs.tags==="string"?cs.tags:cs.tags?.join(", ")||""})} className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:"center"}}>Edit</button>
                  <button onClick={()=>setConfirm(cs.id)} className="btn btn-danger btn-sm">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CSModal({ mode, data, onSave, onClose }) {
  const [form, setForm] = useState(data); const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>{ const u={...f,[k]:v}; if(k==="title"&&!f._slugEdited)u.slug=slugify(v); if(k==="slug")u._slugEdited=true; return u; });
  const submit = async () => { if(!form.title?.trim()){alert("Title required");return;} setSaving(true); await onSave(form); setSaving(false); };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:740}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head" style={{position:"sticky",top:0,background:"var(--s1)",zIndex:1}}><h2 style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{mode==="new"?"New Case Study":"Edit Case Study"}</h2><button onClick={onClose} className="btn btn-ghost btn-sm">✕</button></div>
        <div className="modal-body">
          <ImageField label="Cover Image" value={form.cover_image} onChange={v=>set("cover_image",v)} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}><label className="lbl" style={{display:"block",marginBottom:8}}>Title</label><input className="input" value={form.title||""} onChange={e=>set("title",e.target.value)} maxLength={120} /></div>
            <div style={{gridColumn:"1/-1"}}><label className="lbl" style={{display:"block",marginBottom:8}}>Slug</label>
              <div style={{display:"flex",alignItems:"center",background:"var(--s2)",border:"1px solid var(--bd)",borderRadius:8,overflow:"hidden"}}>
                <span style={{padding:"10px 12px",fontSize:13,color:"var(--muted)",borderRight:"1px solid var(--bd)",whiteSpace:"nowrap"}}>1204studios.com/portfolio/</span>
                <input className="input" value={form.slug||""} onChange={e=>set("slug",e.target.value)} style={{border:"none",borderRadius:0,background:"transparent",fontFamily:"monospace"}} />
              </div>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Client</label><input className="input" value={form.client||""} onChange={e=>set("client",e.target.value)} /></div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Category</label>
              <select className="input" value={form.category||""} onChange={e=>set("category",e.target.value)}>
                <option value="">Select…</option>
                {["Brand Identity","Marketing Campaign","Print Media","Web Design","Strategy","Other"].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Year</label><input className="input" value={form.year||""} onChange={e=>set("year",e.target.value)} placeholder="2025" /></div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Hero Colour</label>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <input type="color" value={form.hero_color||"#1a1a1a"} onChange={e=>set("hero_color",e.target.value)} style={{width:36,height:36,border:"1px solid var(--bd2)",borderRadius:6,background:"var(--s2)",cursor:"pointer",padding:2}} />
                <input className="input" value={form.hero_color||"#1a1a1a"} onChange={e=>set("hero_color",e.target.value)} placeholder="#1a1a1a" style={{fontFamily:"monospace"}} />
              </div>
            </div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Tags</label><input className="input" value={form.tags||""} onChange={e=>set("tags",e.target.value)} placeholder="Branding, NGO, Lagos" /></div>
            <div><label className="lbl" style={{display:"block",marginBottom:8}}>Display Order</label><input type="number" className="input" value={form.display_order||0} onChange={e=>set("display_order",+e.target.value)} /></div>
          </div>
          {[{k:"excerpt",l:"Excerpt",p:"One paragraph summary"},{k:"challenge",l:"The Challenge",p:"What problem did the client have?"},{k:"approach",l:"Our Approach",p:"How did you solve it?"},{k:"results",l:"The Result",p:"What was the outcome?"},{k:"content",l:"Full Content",p:"Full write-up (optional)"},{k:"testimonial",l:"Testimonial",p:"Client quote"}].map(f=>(
            <div key={f.k}><label className="lbl" style={{display:"block",marginBottom:8}}>{f.l}</label><textarea className="input" placeholder={f.p} value={form[f.k]||""} onChange={e=>set(f.k,e.target.value)} style={{minHeight:70}} /></div>
          ))}
          <div style={{display:"flex",gap:20}}>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13.5,color:"var(--text)"}}><input type="checkbox" checked={!!form.featured} onChange={e=>set("featured",e.target.checked)} style={{width:15,height:15,accentColor:"var(--pink)"}} />Featured</label>
            <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13.5,color:"var(--text)"}}><input type="checkbox" checked={!!form.published} onChange={e=>set("published",e.target.checked)} style={{width:15,height:15,accentColor:"var(--pink)"}} />Published</label>
          </div>
        </div>
        <div className="modal-foot" style={{position:"sticky",bottom:0,background:"var(--s1)"}}><button onClick={onClose} className="btn btn-ghost">Cancel</button><button onClick={submit} disabled={saving} className="btn btn-primary">{saving?<><span className="spin">◌</span> Saving…</>:mode==="new"?"Save Case Study":"Save Changes"}</button></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MEDIA LIBRARY
═══════════════════════════════════════════════ */
function MediaLibrary() {
  return (
    <div style={{padding:"24px 32px 48px"}}>
      <h1 style={{fontSize:22,fontWeight:700,color:"var(--text)",letterSpacing:"-.02em",fontFamily:"var(--display)",marginBottom:8}}>Media Library</h1>
      <p style={{fontSize:13.5,color:"var(--dim)",marginBottom:28}}>Paste image URLs directly into blog posts and case studies.</p>
      <div className="card" style={{padding:"32px",textAlign:"center"}}>
        <div style={{fontSize:36,marginBottom:16}}>🖼</div>
        <p style={{fontSize:14,fontWeight:600,color:"var(--text)",marginBottom:8}}>Use hosted image URLs</p>
        <p style={{fontSize:13,color:"var(--dim)",maxWidth:480,margin:"0 auto 24px"}}>Upload to any image host and paste the URL into cover image fields.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <a href="https://cloudinary.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">Cloudinary (free)</a>
          <a href="https://imgbb.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">ImgBB (free)</a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════ */
function AdminLayout({ logout }) {
  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden"}}>
      <Sidebar logout={logout} />
      <main style={{flex:1,overflowY:"auto",overflowX:"hidden",background:"var(--bg)"}}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
          <Route path="/leads"     element={<LeadPipeline />} />
          <Route path="/clients"   element={<ClientsPage />} />
          <Route path="/blog"      element={<BlogManager />} />
          <Route path="/portfolio" element={<PortfolioManager />} />
          <Route path="/media"     element={<MediaLibrary />} />
          <Route path="*"          element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { authed, loading, login, logout, authErr } = useAuth();
  if (loading) {
    return (
      <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"#080808"}}>
        <Styles />
        <span style={{fontSize:13,color:"rgba(240,236,230,0.3)"}}>Loading…</span>
      </div>
    );
  }
  return (
    <BrowserRouter>
      <Styles />
      {authed ? <AdminLayout logout={logout} /> : <Login login={login} authErr={authErr} />}
    </BrowserRouter>
  );
}
