import { useState, useEffect, useCallback, useRef, memo } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";

/* ═══════════════════════════════════════════════
   SUPABASE — REST + STORAGE
═══════════════════════════════════════════════ */
const SB_URL = "https://rtkjrbczkeahhhuocejj.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0a2pyYmN6a2VhaGhodW9jZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDI4MzksImV4cCI6MjA4NzgxODgzOX0.P5v30xR3ojxKQ4suca7cLo-EdeMV1194DHTVevUcvBI";
const BUCKET = "media";

const H_JSON = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };
const H_AUTH = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}` };

async function sbFetch(table, opts = {}) {
  const { method = "GET", query = "", body } = opts;
  const url = `${SB_URL}/rest/v1/${table}${query ? "?" + query : ""}`;
  const r = await fetch(url, { method, headers: H_JSON, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.text(); throw new Error(e); }
  if (method === "DELETE") return true;
  const text = await r.text();
  return text ? JSON.parse(text) : [];
}

async function storageUpload(file) {
  const ext  = file.name.split(".").pop();
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const r = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}/${name}`, {
    method: "POST", headers: { ...H_AUTH, "Content-Type": file.type }, body: file,
  });
  if (!r.ok) { const e = await r.text(); throw new Error(e); }
  return `${SB_URL}/storage/v1/object/public/${BUCKET}/${name}`;
}

async function storageList() {
  const r = await fetch(`${SB_URL}/storage/v1/object/list/${BUCKET}`, {
    method: "POST", headers: { ...H_AUTH, "Content-Type": "application/json" },
    body: JSON.stringify({ limit: 200, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
  });
  if (!r.ok) throw new Error(await r.text());
  const items = await r.json();
  return items.map(f => ({
    name: f.name,
    url: `${SB_URL}/storage/v1/object/public/${BUCKET}/${f.name}`,
    size: f.metadata?.size || 0,
    type: f.metadata?.mimetype || "",
    created: f.created_at,
  }));
}

async function storageDelete(name) {
  const r = await fetch(`${SB_URL}/storage/v1/object/${BUCKET}`, {
    method: "DELETE", headers: { ...H_AUTH, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [name] }),
  });
  if (!r.ok) throw new Error(await r.text());
  return true;
}

/* ═══════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════ */
const ADMIN_PW = "1204admin2026";
const AUTH_KEY = "1204_admin_auth";

function useAuth() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(AUTH_KEY) === "true");
  const login  = pw => { if (pw === ADMIN_PW) { sessionStorage.setItem(AUTH_KEY, "true"); setAuthed(true); return true; } return false; };
  const logout = ()  => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); };
  return { authed, login, logout };
}

/* ═══════════════════════════════════════════════
   TOAST
═══════════════════════════════════════════════ */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:"fixed", bottom:24, right:24, zIndex:300, padding:"12px 20px", borderRadius:10,
      fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:10,
      animation:"fadeUp .25s ease",
      background: type === "success" ? "#166534" : "#7f1d1d",
      color: type === "success" ? "#86efac" : "#fca5a5",
      border: `1px solid ${type === "success" ? "rgba(34,197,94,.3)" : "rgba(239,68,68,.3)"}`,
    }}>
      {type === "success" ? "✓" : "✕"} {msg}
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type = "success") => setToast({ msg, type, key: Date.now() }), []);
  const el   = toast ? <Toast key={toast.key} msg={toast.msg} type={toast.type} onClose={() => setToast(null)} /> : null;
  return { show, el };
}

/* ═══════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════ */
const Styles = memo(() => (
  <style>{`
    *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
    :root{
      --bg:#090909;--s1:#111;--s2:#161616;--s3:#1c1c1c;
      --bd:rgba(255,255,255,0.07);--bd2:rgba(255,255,255,0.13);
      --text:#f0ece6;--dim:rgba(240,236,230,0.5);--muted:rgba(240,236,230,0.28);
      --pink:#ff2d78;--pink-dim:rgba(255,45,120,0.1);--pink-bd:rgba(255,45,120,0.22);
      --green:#22c55e;--yellow:#FFDE21;--blue:#3b82f6;
      --surface:rgba(255,255,255,0.03);--hover:rgba(255,255,255,0.05);
    }
    html,body,#root{height:100%;}
    body{background:var(--bg);color:var(--text);font-family:-apple-system,'SF Pro Text',BlinkMacSystemFont,'Helvetica Neue',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden;}
    a{text-decoration:none;color:inherit;}
    button{cursor:pointer;font-family:inherit;}
    input,textarea,select{font-family:inherit;}
    ::-webkit-scrollbar{width:4px;height:4px;}
    ::-webkit-scrollbar-thumb{background:var(--bd2);border-radius:4px;}

    .btn{display:inline-flex;align-items:center;gap:7px;padding:9px 18px;font-size:13px;font-weight:500;border:none;border-radius:8px;cursor:pointer;letter-spacing:-.01em;}
    .btn-primary{background:var(--pink);color:#fff;}.btn-primary:hover{opacity:.88;}.btn-primary:disabled{opacity:.5;cursor:default;}
    .btn-ghost{background:var(--surface);color:var(--text);border:1px solid var(--bd2);}.btn-ghost:hover{background:var(--hover);}
    .btn-danger{background:rgba(239,68,68,.12);color:#f87171;border:1px solid rgba(239,68,68,.22);}.btn-danger:hover{background:rgba(239,68,68,.22);}
    .btn-sm{padding:6px 13px;font-size:12px;border-radius:6px;}
    .btn-xs{padding:4px 10px;font-size:11px;border-radius:5px;}

    .card{background:var(--s1);border:1px solid var(--bd);border-radius:12px;}
    .input{width:100%;padding:10px 13px;background:var(--s2);border:1px solid var(--bd);border-radius:8px;color:var(--text);font-size:13.5px;outline:none;}
    .input:focus{border-color:var(--pink);}
    .input::placeholder{color:var(--muted);}
    textarea.input{resize:vertical;min-height:90px;line-height:1.7;}
    select.input{appearance:none;}
    .lbl{font-size:10.5px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:var(--muted);}

    .badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:100px;font-size:11px;font-weight:600;}
    .badge-green{background:rgba(34,197,94,.1);color:var(--green);border:1px solid rgba(34,197,94,.22);}
    .badge-pink{background:var(--pink-dim);color:var(--pink);border:1px solid var(--pink-bd);}
    .badge-dim{background:var(--surface);color:var(--dim);border:1px solid var(--bd);}

    .table{width:100%;border-collapse:collapse;}
    .table th{font-size:10.5px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);padding:10px 16px;text-align:left;border-bottom:1px solid var(--bd);white-space:nowrap;}
    .table td{padding:13px 16px;border-bottom:1px solid var(--bd);font-size:13.5px;vertical-align:middle;}
    .table tr:last-child td{border-bottom:none;}
    .table tr:hover td{background:var(--hover);}

    .modal-bg{position:fixed;inset:0;background:rgba(0,0,0,.75);backdrop-filter:blur(6px);z-index:100;display:flex;align-items:center;justify-content:center;padding:20px;}
    .modal{background:var(--s1);border:1px solid var(--bd2);border-radius:16px;width:100%;max-width:700px;max-height:90vh;display:flex;flex-direction:column;}
    .modal-head{padding:22px 26px;border-bottom:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;}
    .modal-body{padding:24px 26px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:18px;}
    .modal-foot{padding:18px 26px;border-top:1px solid var(--bd);display:flex;justify-content:flex-end;gap:10px;flex-shrink:0;}

    .sl{display:flex;align-items:center;gap:10px;padding:8px 11px;border-radius:7px;font-size:13px;font-weight:500;color:var(--dim);margin-bottom:2px;}
    .sl:hover{background:var(--hover);color:var(--text);}
    .sl.active{background:var(--pink-dim);color:var(--pink);}

    .drop-zone{border:2px dashed var(--bd2);border-radius:12px;padding:36px 24px;text-align:center;cursor:pointer;}
    .drop-zone:hover,.drop-zone.drag{border-color:var(--pink);background:var(--pink-dim);}

    .media-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:10px;}
    .media-thumb{border-radius:8px;border:1px solid var(--bd);overflow:hidden;cursor:pointer;position:relative;aspect-ratio:1;background:var(--s2);}
    .media-thumb:hover .ov{opacity:1;}
    .ov{position:absolute;inset:0;background:rgba(0,0,0,.65);display:flex;align-items:center;justify-content:center;gap:6px;opacity:0;transition:opacity .2s;flex-wrap:wrap;padding:8px;}
    .media-thumb img,.media-thumb video{width:100%;height:100%;object-fit:cover;display:block;}

    @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    .fade-up{animation:fadeUp .3s ease both;}
    @keyframes spin{to{transform:rotate(360deg);}}
    .spin{animation:spin .7s linear infinite;display:inline-block;}
  `}</style>
));

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */
function Loader({ label = "Loading…" }) {
  return (
    <div style={{ padding:"72px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"var(--muted)", fontSize:13 }}>
      <span className="spin" style={{ fontSize:18 }}>◌</span> {label}
    </div>
  );
}

function Empty({ icon, label, action }) {
  return (
    <div style={{ padding:"60px 0", textAlign:"center", color:"var(--muted)" }}>
      <div style={{ fontSize:36, marginBottom:12 }}>{icon}</div>
      <p style={{ fontSize:14, marginBottom: action ? 20 : 0 }}>{label}</p>
      {action}
    </div>
  );
}

function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="card fade-up" style={{ maxWidth:360, padding:"32px 28px", textAlign:"center" }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize:36, marginBottom:14 }}>⚠</div>
        <p style={{ fontSize:14.5, fontWeight:600, color:"var(--text)", marginBottom:8 }}>Are you sure?</p>
        <p style={{ fontSize:13, color:"var(--dim)", marginBottom:28 }}>{msg}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}

const fmtSize = b => b > 1e6 ? `${(b/1e6).toFixed(1)}MB` : `${Math.round(b/1e3)}KB`;
const isImage = f => f.type?.startsWith("image/");
const isVideo = f => f.type?.startsWith("video/");
const isGif   = f => f.type === "image/gif" || f.name?.endsWith(".gif");

/* ═══════════════════════════════════════════════
   MEDIA PICKER  (inside forms)
═══════════════════════════════════════════════ */
function MediaPicker({ onSelect, onClose }) {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [drag, setDrag]           = useState(false);
  const inputRef                  = useRef();
  const { show, el: toastEl }     = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setFiles(await storageList()); } catch { show("Could not load media","error"); }
    setLoading(false);
  }, [show]);

  useEffect(() => { load(); }, [load]);

  const upload = useCallback(async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true); setProgress(10);
    try {
      for (let i = 0; i < fileList.length; i++) {
        await storageUpload(fileList[i]);
        setProgress(Math.round(((i+1)/fileList.length)*100));
      }
      show(`${fileList.length} file(s) uploaded`);
      await load();
    } catch(e) { show("Upload failed: "+e.message,"error"); }
    setUploading(false); setProgress(0);
  }, [load, show]);

  const onDrop = e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{ maxWidth:820 }} onClick={e => e.stopPropagation()}>
        {toastEl}
        <div className="modal-head">
          <h2 style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>Media Library</h2>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={() => inputRef.current.click()} className="btn btn-primary btn-sm" disabled={uploading}>
              {uploading ? <><span className="spin">◌</span> {progress}%</> : "↑ Upload"}
            </button>
            <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
          </div>
        </div>
        <div style={{ padding:"16px 26px 0" }}>
          {uploading && (
            <div style={{ height:3, background:"var(--bd)", borderRadius:2, marginBottom:12, overflow:"hidden" }}>
              <div style={{ height:"100%", background:"var(--pink)", width:`${progress}%`, transition:"width .3s" }} />
            </div>
          )}
          <div className={`drop-zone${drag?" drag":""}`} style={{ marginBottom:14, padding:"20px" }}
            onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
            onDrop={onDrop} onClick={()=>inputRef.current.click()}>
            <p style={{ fontSize:13, color:"var(--dim)" }}>Drop files here or <span style={{color:"var(--pink)"}}>click to browse</span></p>
            <p style={{ fontSize:11.5, color:"var(--muted)", marginTop:4 }}>Images · GIFs · Videos</p>
          </div>
          <input ref={inputRef} type="file" multiple accept="image/*,video/*,.gif" style={{display:"none"}} onChange={e=>upload(e.target.files)} />
        </div>
        <div className="modal-body" style={{ padding:"12px 26px 20px" }}>
          {loading ? <Loader label="Loading media…" /> : files.length === 0 ? (
            <Empty icon="🖼" label="No media yet. Upload files above." />
          ) : (
            <div className="media-grid">
              {files.map(f => (
                <div key={f.name} className="media-thumb" title={f.name}>
                  {isVideo(f) ? <video src={f.url} muted /> : isImage(f) ? <img src={f.url} alt="" loading="lazy" /> : <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:28}}>📄</div>}
                  <div className="ov">
                    <button className="btn btn-primary btn-xs" onClick={()=>onSelect(f.url)}>Select</button>
                  </div>
                  <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"3px 7px", background:"rgba(0,0,0,.75)", fontSize:10, color:"rgba(255,255,255,.6)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {fmtSize(f.size)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   IMAGE FIELD
═══════════════════════════════════════════════ */
function ImageField({ label, value, onChange }) {
  const [picker, setPicker] = useState(false);
  return (
    <div>
      <label className="lbl" style={{ display:"block", marginBottom:8 }}>{label}</label>
      <div style={{ display:"flex", gap:8 }}>
        <input className="input" placeholder="Paste URL or pick from library →" value={value||""} onChange={e=>onChange(e.target.value)} style={{flex:1}} />
        <button type="button" onClick={()=>setPicker(true)} className="btn btn-ghost btn-sm" style={{flexShrink:0}}>🖼 Library</button>
      </div>
      {value && (
        <div style={{ marginTop:10, borderRadius:8, overflow:"hidden", border:"1px solid var(--bd)", maxHeight:160, display:"flex", background:"var(--s2)" }}>
          {value.match(/\.(mp4|mov|webm)/i)
            ? <video src={value} controls style={{maxHeight:160,maxWidth:"100%",margin:"auto"}} />
            : <img src={value} alt="" style={{maxHeight:160,maxWidth:"100%",objectFit:"cover",display:"block"}} />}
        </div>
      )}
      {picker && <MediaPicker onSelect={url=>{onChange(url);setPicker(false);}} onClose={()=>setPicker(false)} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════ */
const NAV = [
  { path:"/",          icon:"⬡",  label:"Dashboard"   },
  { path:"/blog",      icon:"✍",  label:"Blog Posts"   },
  { path:"/portfolio", icon:"◈",  label:"Portfolio"    },
  { path:"/media",     icon:"🖼", label:"Media Library" },
];

function Sidebar({ logout }) {
  const { pathname } = useLocation();
  return (
    <aside style={{ width:232, flexShrink:0, background:"var(--s1)", borderRight:"1px solid var(--bd)", display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0 }}>
      <div style={{ padding:"22px 14px 18px", borderBottom:"1px solid var(--bd)" }}>
        <Link to="/" style={{ display:"flex", alignItems:"center", gap:3 }}>
          <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", fontWeight:800, fontSize:20, color:"#fff", letterSpacing:"-.02em" }}>1204</span>
          <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", fontWeight:800, fontSize:20, color:"var(--pink)", letterSpacing:"-.02em" }}>Admin</span>
        </Link>
        <p style={{ fontSize:11, color:"var(--muted)", marginTop:3 }}>Content Management</p>
      </div>
      <nav style={{ padding:"10px 8px", flex:1 }}>
        {NAV.map(n => (
          <Link key={n.path} to={n.path} className={`sl${pathname===n.path?" active":""}`}>
            <span style={{ fontSize:15, width:20 }}>{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding:"10px 8px", borderTop:"1px solid var(--bd)" }}>
        <a href="https://1204studios.com" target="_blank" rel="noreferrer" className="sl"><span>↗</span>View Live Site</a>
        <button onClick={logout} className="sl" style={{ width:"100%", background:"none", border:"none", color:"var(--dim)", textAlign:"left" }}><span>⏻</span>Sign Out</button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════ */
function Login({ login }) {
  const [pw, setPw]         = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setErr("");
    await new Promise(r => setTimeout(r,400));
    if (!login(pw)) setErr("Incorrect password.");
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <Styles />
      <div className="card fade-up" style={{ width:"100%", maxWidth:380, padding:"44px 36px" }}>
        <div style={{ marginBottom:32, textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", gap:3, marginBottom:10 }}>
            <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", fontWeight:800, fontSize:30, color:"#fff", letterSpacing:"-.02em" }}>1204</span>
            <span style={{ fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", fontWeight:800, fontSize:30, color:"var(--pink)", letterSpacing:"-.02em" }}>Admin</span>
          </div>
          <p style={{ fontSize:13.5, color:"var(--dim)" }}>Sign in to manage your content</p>
        </div>
        <label className="lbl" style={{ display:"block", marginBottom:8 }}>Password</label>
        <input type="password" className="input" placeholder="Admin password" value={pw}
          onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus
          style={{ marginBottom: err?6:16 }} />
        {err && <p style={{ fontSize:12, color:"#f87171", marginBottom:14 }}>{err}</p>}
        <button onClick={submit} disabled={loading} className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"12px" }}>
          {loading ? <span className="spin">◌</span> : "Sign In →"}
        </button>
        <p style={{ fontSize:11, color:"var(--muted)", textAlign:"center", marginTop:20 }}>admin.1204studios.com · Restricted Access</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════ */
function Dashboard() {
  const [stats, setStats]   = useState({ blog:0, portfolio:0, media:0, fb:0, fcs:0 });
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      try {
        const [bp, cs, med] = await Promise.all([
          sbFetch("blog_posts",   { query:"select=id,featured" }),
          sbFetch("case_studies", { query:"select=id,featured" }),
          storageList(),
        ]);
        setStats({ blog:bp.length, portfolio:cs.length, media:med.length, fb:bp.filter(b=>b.featured).length, fcs:cs.filter(c=>c.featured).length });
      } catch {}
      setLoading(false);
    }
    load();
  }, []);

  const cards = [
    { label:"Blog Posts",     value:stats.blog,     sub:`${stats.fb} featured`,  icon:"✍",  color:"#ff2d78", to:"/blog"      },
    { label:"Portfolio Items",value:stats.portfolio, sub:`${stats.fcs} featured`, icon:"◈",  color:"#FFDE21", to:"/portfolio" },
    { label:"Media Files",    value:stats.media,     sub:"in Supabase Storage",   icon:"🖼", color:"#3b82f6", to:"/media"     },
  ];

  return (
    <div style={{ padding:"44px 52px" }}>
      <div style={{ marginBottom:40 }}>
        <h1 style={{ fontSize:28, fontWeight:800, color:"var(--text)", letterSpacing:"-.02em", fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", marginBottom:5 }}>Dashboard</h1>
        <p style={{ fontSize:13.5, color:"var(--dim)" }}>Welcome back. Here's your content overview.</p>
      </div>
      {loading ? <Loader /> : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14, marginBottom:40 }}>
          {cards.map(c => (
            <Link key={c.label} to={c.to} className="card" style={{ padding:"26px 22px", display:"block" }}
              onMouseOver={e=>e.currentTarget.style.borderColor="var(--bd2)"}
              onMouseOut={e=>e.currentTarget.style.borderColor="var(--bd)"}>
              <div style={{ width:42, height:42, borderRadius:10, background:`${c.color}18`, border:`1px solid ${c.color}28`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:18 }}>{c.icon}</div>
              <div style={{ fontSize:34, fontWeight:800, color:"var(--text)", fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", letterSpacing:"-.02em", marginBottom:4 }}>{c.value}</div>
              <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:3 }}>{c.label}</div>
              <div style={{ fontSize:12, color:"var(--muted)" }}>{c.sub}</div>
            </Link>
          ))}
        </div>
      )}
      <div className="card" style={{ padding:"22px 26px" }}>
        <p style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:16 }}>Quick Actions</p>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <Link to="/blog?new=1"      className="btn btn-primary btn-sm">+ New Blog Post</Link>
          <Link to="/portfolio?new=1" className="btn btn-primary btn-sm">+ New Case Study</Link>
          <Link to="/media"           className="btn btn-ghost btn-sm">↑ Upload Media</Link>
          <a href="https://1204studios.com" target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">↗ View Live Site</a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   BLOG MANAGER
═══════════════════════════════════════════════ */
const EMPTY_POST = { title:"", tag:"", date:"", read_time:"", summary:"", content:"", cover_image:"", featured:false, display_order:0 };

function BlogManager() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { show, el:toastEl }  = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setPosts(await sbFetch("blog_posts",{query:"select=*&order=display_order.asc,created_at.desc"})); }
    catch { show("Failed to load","error"); }
    setLoading(false);
  }, [show]);

  useEffect(()=>{ load(); },[load]);

  const save = useCallback(async (data) => {
    try {
      if (data.id) { const{id,...r}=data; await sbFetch(`blog_posts?id=eq.${id}`,{method:"PATCH",body:r}); show("Post updated"); }
      else { await sbFetch("blog_posts",{method:"POST",body:data}); show("Post published"); }
      setModal(null); load();
    } catch(e) { show("Save failed: "+e.message,"error"); }
  }, [load, show]);

  const del = useCallback(async (id) => {
    try { await sbFetch(`blog_posts?id=eq.${id}`,{method:"DELETE"}); show("Post deleted"); setConfirm(null); load(); }
    catch { show("Delete failed","error"); }
  }, [load, show]);

  return (
    <div style={{ padding:"44px 52px" }}>
      {toastEl}
      {confirm && <Confirm msg="This will permanently delete this post." onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)} />}
      {modal && <PostModal mode={modal.mode} data={modal.data} onSave={save} onClose={()=>setModal(null)} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:"var(--text)", letterSpacing:"-.02em", fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", marginBottom:5 }}>Blog Posts</h1>
          <p style={{ fontSize:13.5, color:"var(--dim)" }}>{posts.length} post{posts.length!==1?"s":""}</p>
        </div>
        <button onClick={()=>setModal({mode:"new",data:{...EMPTY_POST}})} className="btn btn-primary">+ New Post</button>
      </div>
      <div className="card" style={{ overflow:"hidden" }}>
        {loading ? <Loader /> : posts.length===0 ? (
          <Empty icon="✍" label="No blog posts yet." action={<button onClick={()=>setModal({mode:"new",data:{...EMPTY_POST}})} className="btn btn-primary btn-sm">Write your first post</button>} />
        ) : (
          <table className="table">
            <thead><tr><th>Post</th><th>Tag</th><th>Date</th><th>Featured</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
            <tbody>
              {posts.map(p=>(
                <tr key={p.id}>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                      {p.cover_image && <img src={p.cover_image} alt="" style={{ width:44,height:44,borderRadius:6,objectFit:"cover",border:"1px solid var(--bd)",flexShrink:0 }} />}
                      <div>
                        <div style={{ fontWeight:600, color:"var(--text)", maxWidth:280 }}>{p.title}</div>
                        <div style={{ fontSize:12, color:"var(--muted)", marginTop:2, maxWidth:280, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.summary}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-pink">{p.tag}</span></td>
                  <td style={{ color:"var(--dim)", fontSize:13 }}>{p.date}</td>
                  <td>{p.featured?<span className="badge badge-green">Featured</span>:<span style={{color:"var(--muted)",fontSize:12}}>—</span>}</td>
                  <td>
                    <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                      <button onClick={()=>setModal({mode:"edit",data:{...p}})} className="btn btn-ghost btn-sm">Edit</button>
                      <button onClick={()=>setConfirm(p.id)} className="btn btn-danger btn-sm">Delete</button>
                    </div>
                  </td>
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
  const [form, setForm]     = useState(data);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = async () => {
    if (!form.title?.trim()) return alert("Title is required.");
    setSaving(true); await onSave(form); setSaving(false);
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:720}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head">
          <h2 style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{mode==="new"?"New Blog Post":"Edit Blog Post"}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>
        <div className="modal-body">
          <ImageField label="Cover Image / GIF / Video" value={form.cover_image} onChange={v=>set("cover_image",v)} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Title</label>
              <input className="input" placeholder="Post title" value={form.title||""} onChange={e=>set("title",e.target.value)} />
            </div>
            <div>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Tag</label>
              <input className="input" placeholder="e.g. Marketing" value={form.tag||""} onChange={e=>set("tag",e.target.value)} />
            </div>
            <div>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Date</label>
              <input className="input" placeholder="Mar 12, 2025" value={form.date||""} onChange={e=>set("date",e.target.value)} />
            </div>
            <div>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Read Time</label>
              <input className="input" placeholder="6 min read" value={form.read_time||""} onChange={e=>set("read_time",e.target.value)} />
            </div>
          </div>
          <div>
            <label className="lbl" style={{display:"block",marginBottom:8}}>Summary</label>
            <textarea className="input" placeholder="One-line summary shown on cards" value={form.summary||""} onChange={e=>set("summary",e.target.value)} style={{minHeight:70}} />
          </div>
          <div>
            <label className="lbl" style={{display:"block",marginBottom:8}}>Content</label>
            <div style={{background:"var(--s3)",border:"1px solid var(--bd)",borderRadius:8,padding:"12px 14px",marginBottom:10,fontSize:12,color:"var(--dim)",lineHeight:1.8}}>
              <span style={{color:"var(--pink)",fontWeight:600}}>Formatting guide: </span>
              <span style={{opacity:.8}}>
                <code style={{background:"var(--s2)",padding:"1px 5px",borderRadius:3,fontSize:11}}>## Heading</code>{" · "}
                <code style={{background:"var(--s2)",padding:"1px 5px",borderRadius:3,fontSize:11}}>**bold**</code>{" · "}
                <code style={{background:"var(--s2)",padding:"1px 5px",borderRadius:3,fontSize:11}}>{"> quote"}</code>{" · "}
                <code style={{background:"var(--s2)",padding:"1px 5px",borderRadius:3,fontSize:11}}>---</code>{" divider · "}
                <code style={{background:"var(--s2)",padding:"1px 5px",borderRadius:3,fontSize:11}}>{"![caption](url)"}</code>{" image · "}
                <code style={{background:"var(--s2)",padding:"1px 5px",borderRadius:3,fontSize:11}}>@youtube(VIDEO_ID)</code>{" · "}
                <code style={{background:"var(--s2)",padding:"1px 5px",borderRadius:3,fontSize:11}}>@video(url)</code>
                {" · Use double line break between blocks"}
              </span>
            </div>
            <textarea className="input" placeholder={"Write your post here...\n\nUse double line breaks between paragraphs.\n\n## Add a heading like this\n\n![Image caption](https://your-image-url.jpg)\n\n@youtube(dQw4w9WgXcQ)\n\n> This is a pull quote that stands out"} value={form.content||""} onChange={e=>set("content",e.target.value)} style={{minHeight:300,fontFamily:"monospace",fontSize:13}} />
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="checkbox" id="bp-feat" checked={!!form.featured} onChange={e=>set("featured",e.target.checked)} style={{width:15,height:15,accentColor:"var(--pink)",cursor:"pointer"}} />
            <label htmlFor="bp-feat" style={{fontSize:13.5,color:"var(--text)",cursor:"pointer"}}>Mark as Featured — shows on homepage</label>
          </div>
        </div>
        <div className="modal-foot">
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">
            {saving?<><span className="spin">◌</span> Saving…</>:mode==="new"?"Publish Post":"Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   PORTFOLIO MANAGER
═══════════════════════════════════════════════ */
const EMPTY_CS = { title:"", category:"", year:"", hero_color:"#1a1a2e", cover_image:"", summary:"", challenge:"", approach:"", result:"", tags:"", featured:false, display_order:0 };

function PortfolioManager() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [confirm, setConfirm] = useState(null);
  const { show, el:toastEl }  = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setItems(await sbFetch("case_studies",{query:"select=*&order=display_order.asc"})); }
    catch { show("Failed to load","error"); }
    setLoading(false);
  }, [show]);

  useEffect(()=>{ load(); },[load]);

  const save = useCallback(async (data) => {
    try {
      const payload = {...data, tags: typeof data.tags==="string"?data.tags.split(",").map(t=>t.trim()).filter(Boolean):data.tags||[]};
      if (payload.id) { const{id,...r}=payload; await sbFetch(`case_studies?id=eq.${id}`,{method:"PATCH",body:r}); show("Updated"); }
      else { await sbFetch("case_studies",{method:"POST",body:payload}); show("Created"); }
      setModal(null); load();
    } catch(e) { show("Save failed: "+e.message,"error"); }
  }, [load, show]);

  const del = useCallback(async (id) => {
    try { await sbFetch(`case_studies?id=eq.${id}`,{method:"DELETE"}); show("Deleted"); setConfirm(null); load(); }
    catch { show("Delete failed","error"); }
  }, [load, show]);

  return (
    <div style={{ padding:"44px 52px" }}>
      {toastEl}
      {confirm && <Confirm msg="This will permanently delete this case study." onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)} />}
      {modal && <CSModal mode={modal.mode} data={modal.data} onSave={save} onClose={()=>setModal(null)} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:"var(--text)", letterSpacing:"-.02em", fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", marginBottom:5 }}>Portfolio</h1>
          <p style={{ fontSize:13.5, color:"var(--dim)" }}>{items.length} case stud{items.length!==1?"ies":"y"}</p>
        </div>
        <button onClick={()=>setModal({mode:"new",data:{...EMPTY_CS}})} className="btn btn-primary">+ New Case Study</button>
      </div>
      {loading ? <Loader /> : items.length===0 ? (
        <div className="card"><Empty icon="◈" label="No case studies yet." action={<button onClick={()=>setModal({mode:"new",data:{...EMPTY_CS}})} className="btn btn-primary btn-sm">Add your first</button>} /></div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(290px,1fr))", gap:14 }}>
          {items.map(cs=>(
            <div key={cs.id} className="card" style={{overflow:"hidden"}}>
              {cs.cover_image
                ? <img src={cs.cover_image} alt={cs.title} style={{width:"100%",height:140,objectFit:"cover",display:"block"}} />
                : <div style={{height:6,background:cs.hero_color||"var(--pink)"}} />}
              <div style={{padding:"18px 18px 14px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,gap:8}}>
                  <h3 style={{fontSize:13.5,fontWeight:700,color:"var(--text)",lineHeight:1.4}}>{cs.title}</h3>
                  {cs.featured&&<span className="badge badge-green" style={{flexShrink:0}}>Featured</span>}
                </div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                  <span className="badge badge-pink">{cs.category}</span>
                  <span className="badge badge-dim">{cs.year}</span>
                </div>
                <p style={{fontSize:12.5,color:"var(--muted)",lineHeight:1.6,marginBottom:14,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{cs.summary}</p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setModal({mode:"edit",data:{...cs,tags:Array.isArray(cs.tags)?cs.tags.join(", "):cs.tags||""}})} className="btn btn-ghost btn-sm" style={{flex:1,justifyContent:"center"}}>Edit</button>
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
  const [form, setForm]     = useState(data);
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const submit = async () => {
    if (!form.title?.trim()) return alert("Title is required.");
    setSaving(true); await onSave(form); setSaving(false);
  };
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" style={{maxWidth:740}} onClick={e=>e.stopPropagation()}>
        <div className="modal-head" style={{position:"sticky",top:0,background:"var(--s1)",zIndex:1}}>
          <h2 style={{fontSize:16,fontWeight:700,color:"var(--text)"}}>{mode==="new"?"New Case Study":"Edit Case Study"}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm">✕</button>
        </div>
        <div className="modal-body">
          <ImageField label="Cover Image / Hero Visual" value={form.cover_image} onChange={v=>set("cover_image",v)} />
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
            <div style={{gridColumn:"1/-1"}}>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Project Title</label>
              <input className="input" placeholder="e.g. Greenleaf Environmental Agency" value={form.title||""} onChange={e=>set("title",e.target.value)} />
            </div>
            <div>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Category</label>
              <select className="input" value={form.category||""} onChange={e=>set("category",e.target.value)}>
                <option value="">Select…</option>
                {["Brand Identity","Marketing Campaign","Print Media","Web Design","Other"].map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Year</label>
              <input className="input" placeholder="2024" value={form.year||""} onChange={e=>set("year",e.target.value)} />
            </div>
            <div>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Hero Colour</label>
              <div style={{display:"flex",gap:8}}>
                <input type="color" value={form.hero_color||"#1a1a2e"} onChange={e=>set("hero_color",e.target.value)} style={{width:42,height:42,border:"1px solid var(--bd)",borderRadius:7,background:"none",cursor:"pointer",padding:2}} />
                <input className="input" value={form.hero_color||""} onChange={e=>set("hero_color",e.target.value)} placeholder="#1a1a2e" />
              </div>
            </div>
            <div>
              <label className="lbl" style={{display:"block",marginBottom:8}}>Tags</label>
              <input className="input" placeholder="Branding, NGO, Lagos" value={form.tags||""} onChange={e=>set("tags",e.target.value)} />
            </div>
          </div>
          {[{k:"summary",l:"Summary",p:"One paragraph overview"},{k:"challenge",l:"The Challenge",p:"What problem were you solving?"},{k:"approach",l:"Our Approach",p:"How did you tackle it?"},{k:"result",l:"The Result",p:"What was the outcome?"}].map(f=>(
            <div key={f.k}>
              <label className="lbl" style={{display:"block",marginBottom:8}}>{f.l}</label>
              <textarea className="input" placeholder={f.p} value={form[f.k]||""} onChange={e=>set(f.k,e.target.value)} style={{minHeight:80}} />
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <input type="checkbox" id="cs-feat" checked={!!form.featured} onChange={e=>set("featured",e.target.checked)} style={{width:15,height:15,accentColor:"var(--pink)",cursor:"pointer"}} />
            <label htmlFor="cs-feat" style={{fontSize:13.5,color:"var(--text)",cursor:"pointer"}}>Mark as Featured — shows on homepage</label>
          </div>
        </div>
        <div className="modal-foot" style={{position:"sticky",bottom:0,background:"var(--s1)"}}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button onClick={submit} disabled={saving} className="btn btn-primary">
            {saving?<><span className="spin">◌</span> Saving…</>:mode==="new"?"Save Case Study":"Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MEDIA LIBRARY PAGE
═══════════════════════════════════════════════ */
function MediaLibrary() {
  const [files, setFiles]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress]   = useState(0);
  const [confirm, setConfirm]     = useState(null);
  const [copied, setCopied]       = useState(null);
  const [filter, setFilter]       = useState("all");
  const [drag, setDrag]           = useState(false);
  const inputRef                  = useRef();
  const { show, el:toastEl }      = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { setFiles(await storageList()); } catch { show("Failed to load","error"); }
    setLoading(false);
  }, [show]);

  useEffect(()=>{ load(); },[load]);

  const upload = useCallback(async (fileList) => {
    if (!fileList?.length) return;
    setUploading(true); setProgress(5);
    try {
      for (let i=0;i<fileList.length;i++) {
        await storageUpload(fileList[i]);
        setProgress(Math.round(((i+1)/fileList.length)*100));
      }
      show(`${fileList.length} file(s) uploaded`);
      await load();
    } catch(e) { show("Upload failed: "+e.message,"error"); }
    setUploading(false); setProgress(0);
  }, [load, show]);

  const del = useCallback(async (name) => {
    try { await storageDelete(name); show("Deleted"); setConfirm(null); load(); }
    catch { show("Delete failed","error"); }
  }, [load, show]);

  const copy = url => {
    navigator.clipboard.writeText(url);
    setCopied(url); setTimeout(()=>setCopied(null),2000);
    show("URL copied");
  };

  const onDrop = e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); };

  const filtered = files.filter(f=>{
    if (filter==="images") return isImage(f)&&!isGif(f);
    if (filter==="videos") return isVideo(f);
    if (filter==="gifs")   return isGif(f);
    return true;
  });

  return (
    <div style={{ padding:"44px 52px" }}>
      {toastEl}
      {confirm && <Confirm msg={`Delete this file? This cannot be undone.`} onConfirm={()=>del(confirm)} onCancel={()=>setConfirm(null)} />}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:28, fontWeight:800, color:"var(--text)", letterSpacing:"-.02em", fontFamily:"-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif", marginBottom:5 }}>Media Library</h1>
          <p style={{ fontSize:13.5, color:"var(--dim)" }}>{files.length} file{files.length!==1?"s":""} in Supabase Storage</p>
        </div>
        <button onClick={()=>inputRef.current.click()} disabled={uploading} className="btn btn-primary">
          {uploading?<><span className="spin">◌</span> {progress}%</>:"↑ Upload Files"}
        </button>
      </div>

      <div className={`drop-zone${drag?" drag":""}`} style={{marginBottom:16}}
        onDragOver={e=>{e.preventDefault();setDrag(true);}} onDragLeave={()=>setDrag(false)}
        onDrop={onDrop} onClick={()=>inputRef.current.click()}>
        <div style={{fontSize:28,marginBottom:8}}>☁</div>
        <p style={{fontSize:13.5,color:"var(--dim)"}}>Drag & drop files here, or <span style={{color:"var(--pink)"}}>click to browse</span></p>
        <p style={{fontSize:12,color:"var(--muted)",marginTop:5}}>Images (JPG, PNG, WebP) · GIFs · Videos (MP4, MOV, WebM)</p>
      </div>
      <input ref={inputRef} type="file" multiple accept="image/*,video/*,.gif" style={{display:"none"}} onChange={e=>upload(e.target.files)} />

      {uploading && (
        <div style={{height:3,background:"var(--bd)",borderRadius:2,marginBottom:16,overflow:"hidden"}}>
          <div style={{height:"100%",background:"var(--pink)",width:`${progress}%`,transition:"width .4s"}} />
        </div>
      )}

      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {[["all","All"],["images","Images"],["gifs","GIFs"],["videos","Videos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} className={`btn btn-sm ${filter===v?"btn-primary":"btn-ghost"}`}>{l}</button>
        ))}
      </div>

      {loading ? <Loader label="Loading media…" /> : filtered.length===0 ? (
        <div className="card"><Empty icon="🖼" label={filter==="all"?"No media uploaded yet.":"No "+filter+" found."} /></div>
      ) : (
        <div className="media-grid">
          {filtered.map(f=>(
            <div key={f.name} className="media-thumb" title={f.name}>
              {isVideo(f)?<video src={f.url} muted style={{width:"100%",height:"100%",objectFit:"cover"}} />
              :isImage(f)?<img src={f.url} alt={f.name} loading="lazy" />
              :<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",fontSize:28}}>📄</div>}
              <div className="ov">
                <button onClick={()=>copy(f.url)} className="btn btn-primary btn-xs">{copied===f.url?"✓ Copied":"Copy URL"}</button>
                <button onClick={()=>setConfirm(f.name)} className="btn btn-danger btn-xs">Delete</button>
              </div>
              <div style={{position:"absolute",bottom:0,left:0,right:0,padding:"3px 7px",background:"rgba(0,0,0,.75)",fontSize:10,color:"rgba(255,255,255,.6)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                {fmtSize(f.size)} · {isGif(f)?"GIF":isVideo(f)?"Video":"Image"}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════ */
function AdminLayout({ logout }) {
  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar logout={logout} />
      <main style={{ flex:1, overflow:"auto", background:"var(--bg)" }}>
        <Routes>
          <Route path="/"          element={<Dashboard />} />
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
  const { authed, login, logout } = useAuth();
  return (
    <BrowserRouter>
      <Styles />
      {authed ? <AdminLayout logout={logout} /> : <Login login={login} />}
    </BrowserRouter>
  );
}
