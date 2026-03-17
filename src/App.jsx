import { useState, useEffect, useCallback, useMemo, useRef, memo } from "react";
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate, Navigate } from "react-router-dom";

/* ═══════════════════════════════════════════════════════════════
   SUPABASE
═══════════════════════════════════════════════════════════════ */
const SB_URL = "https://rtkjrbczkeahhhuocejj.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0a2pyYmN6a2VhaGhodW9jZWpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNDI4MzksImV4cCI6MjA4NzgxODgzOX0.P5v30xR3ojxKQ4suca7cLo-EdeMV1194DHTVevUcvBI";

const H = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

async function db(table, opts = {}) {
  const { method = "GET", query = "", body } = opts;
  const url = `${SB_URL}/rest/v1/${table}${query ? "?" + query : ""}`;
  const r = await fetch(url, { method, headers: H, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) { const e = await r.text(); throw new Error(e); }
  if (method === "DELETE") return true;
  const t = await r.text(); return t ? JSON.parse(t) : [];
}

/* ═══════════════════════════════════════════════════════════════
   AUTH
═══════════════════════════════════════════════════════════════ */
const AUTH_KEY = "1204inv_auth";
const ADMIN_PW = "1204invoice2026";
function useAuth() {
  const [ok, setOk] = useState(() => sessionStorage.getItem(AUTH_KEY) === "true");
  const login  = pw => { if (pw === ADMIN_PW) { sessionStorage.setItem(AUTH_KEY, "true"); setOk(true); return true; } return false; };
  const logout = ()  => { sessionStorage.removeItem(AUTH_KEY); setOk(false); };
  return { ok, login, logout };
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════════════════════════ */
const SERVICES = ["Brand Design", "Marketing Campaigns", "Print Media", "Design & Web Tutoring"];

const PRESET_ITEMS = [
  { name: "Brand Identity Design",     price: 450000 },
  { name: "Logo Design",               price: 150000 },
  { name: "Marketing Campaign Creative",price: 350000 },
  { name: "Website Design",            price: 600000 },
  { name: "Corporate Brochure",        price: 120000 },
  { name: "Design Tutoring (per hour)",price: 25000  },
  { name: "Creative Consulting",       price: 80000  },
  { name: "Workshop Facilitation",     price: 200000 },
];

const CURRENCIES = ["NGN", "USD", "GBP"];
const CURRENCY_SYMBOLS = { NGN: "₦", USD: "$", GBP: "£" };

const STATUSES = ["Draft","Sent","Deposit Required","Deposit Paid","Partially Paid","Fully Paid","Overdue","Cancelled"];
const STATUS_COLORS = {
  "Draft":            { bg:"rgba(255,255,255,.06)", color:"#aaa",     border:"rgba(255,255,255,.1)"  },
  "Sent":             { bg:"rgba(59,130,246,.12)",  color:"#93c5fd",  border:"rgba(59,130,246,.25)"  },
  "Deposit Required": { bg:"rgba(251,191,36,.12)",  color:"#fbbf24",  border:"rgba(251,191,36,.25)"  },
  "Deposit Paid":     { bg:"rgba(251,191,36,.2)",   color:"#f59e0b",  border:"rgba(251,191,36,.35)"  },
  "Partially Paid":   { bg:"rgba(242,100,25,.12)",  color:"#F26419",  border:"rgba(242,100,25,.3)"   },
  "Fully Paid":       { bg:"rgba(34,197,94,.12)",   color:"#4ade80",  border:"rgba(34,197,94,.25)"   },
  "Overdue":          { bg:"rgba(239,68,68,.12)",   color:"#f87171",  border:"rgba(239,68,68,.25)"   },
  "Cancelled":        { bg:"rgba(255,255,255,.04)", color:"#666",     border:"rgba(255,255,255,.08)" },
};

const DEFAULT_TERMS = `1. PAYMENT TERMS
Payment is due within the number of days stated on the invoice from the date of issue. Invoices not paid within this period will be subject to a late payment fee of 5% per month on the outstanding balance.

2. DEPOSIT REQUIREMENT
For projects valued above ₦200,000 (or currency equivalent), a 50% deposit is required before work commences. Work will not begin until the deposit payment has been confirmed.

3. INTELLECTUAL PROPERTY
All intellectual property, creative work, designs, and deliverables remain the property of 1204Studios until full payment is received. Upon receipt of full payment, all agreed rights transfer to the client as defined in the project brief.

4. REVISIONS
The agreed project fee includes up to three (3) rounds of revisions unless otherwise stated. Additional revision rounds will be billed at the applicable hourly rate.

5. SCOPE OF WORK
This invoice covers only the scope of work described herein. Any additions, changes, or expansions to the project scope will be quoted and invoiced separately.

6. CANCELLATION
Should the client cancel the project after work has commenced, the client remains liable for all work completed to date, plus a 25% cancellation fee on the total project value. The deposit is non-refundable.

7. CONFIDENTIALITY
1204Studios agrees to keep all client information confidential and will not disclose project details to third parties without written consent, except where required by law.

8. DISPUTE RESOLUTION
Any disputes arising from this invoice shall first be subject to mediation. If unresolved, disputes shall be subject to the jurisdiction of the courts of Lagos State, Nigeria.

9. GOVERNING LAW
This agreement is governed by the laws of the Federal Republic of Nigeria.

10. ACCEPTANCE
Receipt of this invoice constitutes acceptance of these terms and conditions.`;

const DEFAULT_FOOTER = "1204Studios · Brand Strategy • Design • Development\n22 Glover Rd, Ikoyi, Lagos, Nigeria\nhello@1204studios.com · www.1204studios.com · +234 903 558 3476";

/* ═══════════════════════════════════════════════════════════════
   SETTINGS STORE (localStorage)
═══════════════════════════════════════════════════════════════ */
const SETTINGS_KEY = "1204inv_settings";
const DEFAULT_SETTINGS = {
  studioName:    "1204Studios",
  studioAddress: "22 Glover Rd, Ikoyi, Lagos, Nigeria",
  studioEmail:   "hello@1204studios.com",
  studioPhone:   "+234 903 558 3476",
  studioWebsite: "www.1204studios.com",
  studioRC:      "RC 234234",
  terms:         DEFAULT_TERMS,
  footer:        DEFAULT_FOOTER,
  invoicePrefix: "1204STUDIOS-INV",
  logoDataUrl:   null,
  watermarkDataUrl: null,
  watermarkOpacity: 0.08,
  accounts:      [
    { id:"acc1", name:"NGN Bank Transfer",  bank:"Guaranty Trust Bank (GTB)", accountName:"1204 Studios Ltd", accountNumber:"0123456789", swift:"GTBINGLA", instructions:"Transfer to the account above. Use invoice number as reference." },
    { id:"acc2", name:"USD Account",        bank:"Guaranty Trust Bank (GTB)", accountName:"1204 Studios Ltd", accountNumber:"0234567890", swift:"GTBINGLA", instructions:"USD wire transfer. Include invoice number in transfer details." },
  ],
};

function loadSettings() {
  try { const s = localStorage.getItem(SETTINGS_KEY); return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS; }
  catch { return DEFAULT_SETTINGS; }
}
function saveSettings(s) { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); }

/* ═══════════════════════════════════════════════════════════════
   LOCAL DATA STORE (invoices, clients, payments in localStorage)
═══════════════════════════════════════════════════════════════ */
const STORE_KEY = "1204inv_data";
function loadStore() {
  try { const s = localStorage.getItem(STORE_KEY); return s ? JSON.parse(s) : { invoices:[], clients:[], payments:[], nextInvoiceNum:1 }; }
  catch { return { invoices:[], clients:[], payments:[], nextInvoiceNum:1 }; }
}
function saveStore(s) { localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

function useStore() {
  const [store, setStore] = useState(() => loadStore());
  const update = useCallback(fn => {
    setStore(prev => { const next = fn(prev); saveStore(next); return next; });
  }, []);
  return { store, update };
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function genInvoiceNum(settings, n) { return `${settings.invoicePrefix}-${new Date().getFullYear()}-${String(n).padStart(3,"0")}`; }

/* ═══════════════════════════════════════════════════════════════
   FORMATTERS
═══════════════════════════════════════════════════════════════ */
function fmt(amount, currency = "NGN") {
  const sym = CURRENCY_SYMBOLS[currency] || "₦";
  return `${sym}${Number(amount || 0).toLocaleString("en-NG", { minimumFractionDigits:2, maximumFractionDigits:2 })}`;
}
function fmtDate(d) { if (!d) return "—"; return new Date(d).toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }); }
function today() { return new Date().toISOString().slice(0,10); }
function addDays(d, n) { const dt = new Date(d); dt.setDate(dt.getDate()+n); return dt.toISOString().slice(0,10); }

function calcInvoice(items, discount=0, tax=0) {
  const subtotal = items.reduce((s,i) => s + (Number(i.qty||1) * Number(i.price||0)), 0);
  const discountAmt = subtotal * (Number(discount)||0) / 100;
  const taxAmt = (subtotal - discountAmt) * (Number(tax)||0) / 100;
  const total = subtotal - discountAmt + taxAmt;
  return { subtotal, discountAmt, taxAmt, total };
}

function paidAmount(invoiceId, payments) {
  return payments.filter(p => p.invoiceId === invoiceId).reduce((s,p) => s + Number(p.amount||0), 0);
}

/* ═══════════════════════════════════════════════════════════════
   PDF GENERATION  (jsPDF + letterhead watermark)
═══════════════════════════════════════════════════════════════ */
async function generatePDF(invoice, payments, settings, password = "") {
  const { jsPDF } = await import("jspdf");
  await import("jspdf-autotable");

  const doc = new jsPDF({ unit:"mm", format:"a4", orientation:"portrait" });
  const W = 210, H = 297;
  const PL = 20, PR = 20, PT = 28, PB = 28;
  const CW = W - PL - PR;

  const { subtotal, discountAmt, taxAmt, total } = calcInvoice(invoice.items, invoice.discount, invoice.tax);
  const paid = paidAmount(invoice.id, payments);
  const balance = total - paid;

  // Brand colors
  const PINK  = [255, 45, 120];
  const DARK  = [15, 15, 20];
  const GRAY  = [120, 120, 130];
  const LGRAY = [240, 238, 235];

  function addWatermarkAndHeader(pageNum) {
    // Watermark (letterhead PNG)
    if (settings.watermarkDataUrl) {
      const opacity = settings.watermarkOpacity || 0.08;
      doc.saveGraphicsState();
      doc.setGState(new doc.GState({ opacity }));
      try { doc.addImage(settings.watermarkDataUrl, "PNG", 0, 0, W, H, undefined, "FAST"); }
      catch {}
      doc.restoreGraphicsState();
    }

    // Top bar
    doc.setFillColor(...PINK);
    doc.rect(0, 0, W, 6, "F");

    // Logo text (top left)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...DARK);
    doc.text("1204", PL, 20);
    doc.setTextColor(...PINK);
    doc.text("Studios", PL + 27, 20);

    // RC number (top right)
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(settings.studioRC || "RC 234234", W - PR, 20, { align:"right" });

    // Bottom bar
    doc.setFillColor(...PINK);
    doc.rect(0, H - 6, W, 6, "F");

    // Footer text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRAY);
    const footerLines = (settings.footer || DEFAULT_FOOTER).split("\n");
    const midY = H - 12;
    footerLines.forEach((line, i) => {
      doc.text(line, W / 2, midY - (footerLines.length - 1 - i) * 4, { align:"center" });
    });

    // Page number
    doc.setFontSize(7);
    doc.text(`Page ${pageNum}`, W - PR, H - 9, { align:"right" });
  }

  /* ─── PAGE 1: INVOICE ─────────────────────────────────────────── */
  addWatermarkAndHeader(1);
  let y = PT + 14;

  // INVOICE title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...DARK);
  doc.text("INVOICE", PL, y);

  // Status badge
  const sc = STATUS_COLORS[invoice.status] || STATUS_COLORS["Draft"];
  doc.setFillColor(50, 50, 60);
  doc.roundedRect(W - PR - 40, y - 10, 40, 13, 2, 2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(200, 200, 210);
  doc.text(invoice.status.toUpperCase(), W - PR - 20, y - 2.5, { align:"center" });

  y += 10;
  doc.setDrawColor(230, 228, 225);
  doc.setLineWidth(0.3);
  doc.line(PL, y, W - PR, y);
  y += 10;

  // Two column header info
  const col2 = W / 2 + 5;

  // Left: Invoice details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("INVOICE NUMBER", PL, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(invoice.number || "—", PL, y + 6);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("ISSUE DATE", PL, y + 16);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(fmtDate(invoice.date), PL, y + 22);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("DUE DATE", PL, y + 32);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(fmtDate(invoice.dueDate), PL, y + 38);

  // Right: FROM + TO
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("FROM", col2, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(settings.studioName || "1204Studios", col2, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text(settings.studioAddress || "", col2, y + 12, { maxWidth: CW/2 - 5 });
  doc.text(settings.studioEmail || "", col2, y + 18);
  doc.text(settings.studioPhone || "", col2, y + 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("BILL TO", col2, y + 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(invoice.clientCompany || invoice.clientName || "—", col2, y + 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  if (invoice.clientCompany && invoice.clientName) doc.text(invoice.clientName, col2, y + 46);
  doc.text(invoice.clientEmail || "", col2, y + 52);
  doc.text(invoice.clientPhone || "", col2, y + 57);
  if (invoice.clientAddress) doc.text(invoice.clientAddress, col2, y + 62, { maxWidth: CW/2 - 5 });

  y += 72;
  doc.setDrawColor(230, 228, 225);
  doc.line(PL, y, W - PR, y);
  y += 10;

  // Project
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("PROJECT", PL, y);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...DARK);
  doc.text(invoice.projectName || "—", PL, y + 6);
  if (invoice.service) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(invoice.service, PL, y + 12);
  }
  if (invoice.description) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...GRAY);
    doc.text(invoice.description, PL, y + 18, { maxWidth: CW });
  }
  y += 30;

  // Line items table
  const tableHead = [["DESCRIPTION", "QTY", "UNIT PRICE", "AMOUNT"]];
  const tableBody = (invoice.items || []).map(item => [
    item.description || "",
    String(item.qty || 1),
    fmt(item.price, invoice.currency),
    fmt((Number(item.qty||1)) * (Number(item.price||0)), invoice.currency),
  ]);

  doc.autoTable({
    startY: y,
    head: tableHead,
    body: tableBody,
    theme: "plain",
    headStyles: {
      fillColor: [15, 15, 20],
      textColor: [160, 160, 170],
      fontStyle: "bold",
      fontSize: 7.5,
      cellPadding: { top:4, bottom:4, left:4, right:4 },
    },
    bodyStyles: {
      textColor: [30, 30, 40],
      fontSize: 9,
      cellPadding: { top:5, bottom:5, left:4, right:4 },
    },
    alternateRowStyles: { fillColor: [248, 246, 243] },
    columnStyles: {
      0: { cellWidth: CW * 0.48 },
      1: { cellWidth: CW * 0.1, halign:"center" },
      2: { cellWidth: CW * 0.21, halign:"right" },
      3: { cellWidth: CW * 0.21, halign:"right", fontStyle:"bold" },
    },
    margin: { left: PL, right: PR },
    tableWidth: CW,
  });

  y = doc.lastAutoTable.finalY + 8;

  // Totals block (right aligned)
  const totalsX = W - PR - 70;
  const totalsW = 70;

  function totalsRow(label, value, bold=false, big=false, color=DARK) {
    if (bold) { doc.setFillColor(...DARK); doc.rect(totalsX - 2, y - 5, totalsW + 4, big?12:9, "F"); }
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold && big ? 11 : 8.5);
    doc.setTextColor(bold ? 255 : color[0], bold ? 255 : color[1], bold ? 255 : color[2]);
    doc.text(label, totalsX + 2, y);
    doc.text(value, totalsX + totalsW - 2, y, { align:"right" });
    y += bold && big ? 11 : 9;
  }

  totalsRow("Subtotal", fmt(subtotal, invoice.currency));
  if (invoice.discount) totalsRow(`Discount (${invoice.discount}%)`, `-${fmt(discountAmt, invoice.currency)}`, false, false, [239,68,68]);
  if (invoice.tax) totalsRow(`Tax (${invoice.tax}%)`, fmt(taxAmt, invoice.currency));
  y += 2;
  totalsRow("TOTAL", fmt(total, invoice.currency), true, true);
  y += 4;
  if (paid > 0) {
    totalsRow("Amount Paid", fmt(paid, invoice.currency), false, false, [34,197,94]);
    y += 2;
    doc.setFillColor(...PINK);
    doc.rect(totalsX - 2, y - 5, totalsW + 4, 12, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255,255,255);
    doc.text("BALANCE DUE", totalsX + 2, y + 1);
    doc.text(fmt(balance, invoice.currency), totalsX + totalsW - 2, y + 1, { align:"right" });
    y += 16;
  }
  y += 6;

  // Payment instructions
  if (invoice.accountId) {
    const account = (settings.accounts || []).find(a => a.id === invoice.accountId);
    if (account) {
      doc.setDrawColor(230, 228, 225);
      doc.line(PL, y, W - PR, y);
      y += 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...GRAY);
      doc.text("PAYMENT DETAILS", PL, y);
      y += 7;
      const payRows = [
        ["Bank", account.bank],
        ["Account Name", account.accountName],
        ["Account Number", account.accountNumber],
        ["SWIFT / Sort Code", account.swift],
      ].filter(r => r[1]);
      payRows.forEach(([k, v]) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...DARK);
        doc.text(k + ":", PL, y);
        doc.setFont("helvetica", "normal");
        doc.text(v, PL + 40, y);
        y += 6;
      });
      if (account.instructions) {
        y += 2;
        doc.setFont("helvetica", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        doc.text(account.instructions, PL, y, { maxWidth: CW });
      }
    }
  }

  /* ─── PAGE 2: TERMS & CONDITIONS ──────────────────────────────── */
  doc.addPage();
  addWatermarkAndHeader(2);
  y = PT + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...DARK);
  doc.text("Terms & Conditions", PL, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...GRAY);
  doc.text("Service Agreement — " + (settings.studioName || "1204Studios"), PL, y + 7);
  y += 15;
  doc.setDrawColor(230, 228, 225);
  doc.line(PL, y, W - PR, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(40, 40, 50);
  const termsLines = doc.splitTextToSize(settings.terms || DEFAULT_TERMS, CW);
  termsLines.forEach(line => {
    if (y > H - 40) { doc.addPage(); addWatermarkAndHeader(doc.internal.getNumberOfPages()); y = PT + 14; }
    const isBold = /^\d+\./.test(line.trim());
    doc.setFont("helvetica", isBold ? "bold" : "normal");
    doc.setFontSize(isBold ? 9 : 8.5);
    doc.setTextColor(isBold ? 15 : 40, isBold ? 15 : 40, isBold ? 20 : 50);
    doc.text(line, PL, y);
    y += isBold ? 7 : 5;
  });

  /* ─── PAGE 3: SIGNATURE ────────────────────────────────────────── */
  doc.addPage();
  addWatermarkAndHeader(doc.internal.getNumberOfPages());
  y = PT + 14;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...DARK);
  doc.text("Authorization & Signature", PL, y);
  y += 10;
  doc.setDrawColor(230, 228, 225);
  doc.line(PL, y, W - PR, y);
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 70);
  doc.text("By signing below, the client acknowledges receipt of this invoice and agrees to the terms and", PL, y);
  doc.text("conditions stated herein, including payment obligations and intellectual property provisions.", PL, y + 6);
  y += 22;

  // Invoice summary box
  doc.setFillColor(...LGRAY);
  doc.roundedRect(PL, y, CW, 28, 3, 3, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text("INVOICE", PL + 8, y + 10);
  doc.text("PROJECT", PL + 60, y + 10);
  doc.text("TOTAL AMOUNT", PL + 120, y + 10);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  doc.text(invoice.number || "—", PL + 8, y + 20);
  doc.text(invoice.projectName || "—", PL + 60, y + 20, { maxWidth: 55 });
  doc.setTextColor(...PINK);
  doc.text(fmt(total, invoice.currency), PL + 120, y + 20);
  y += 40;

  // Signature lines
  const sigY = y + 30;

  // Studio signature
  doc.setDrawColor(...DARK);
  doc.setLineWidth(0.5);
  doc.line(PL, sigY, PL + 75, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("Authorized Signature — " + (settings.studioName || "1204Studios"), PL, sigY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("Name: _______________________", PL, sigY + 13);
  doc.text("Date:  _______________________", PL, sigY + 20);

  // Client signature
  const csx = W - PR - 75;
  doc.line(csx, sigY, csx + 75, sigY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...DARK);
  doc.text("Client Signature", csx, sigY + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text("Name: _______________________", csx, sigY + 13);
  doc.text("Date:  _______________________", csx, sigY + 20);

  // Stamp circle
  doc.setDrawColor(...PINK);
  doc.setLineWidth(0.8);
  doc.circle(W / 2, sigY + 10, 20, "S");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(...PINK);
  doc.text("OFFICIAL STAMP", W/2, sigY + 8, { align:"center" });
  doc.text(settings.studioName || "1204Studios", W/2, sigY + 14, { align:"center" });

  // Legal disclaimer
  y = sigY + 50;
  doc.setDrawColor(230, 228, 225);
  doc.line(PL, y, W - PR, y);
  y += 8;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.setTextColor(...GRAY);
  doc.text("This is an official invoice issued by " + (settings.studioName||"1204Studios") + ". Unauthorized alteration of this document is prohibited.", PL, y, { maxWidth:CW });
  doc.text("Any disputes must be raised within 7 days of receipt. This document may be used as legal evidence of debt.", PL, y+5, { maxWidth:CW });

  // Save
  const filename = `${invoice.number || "INVOICE"}.pdf`;
  if (password) {
    // jsPDF doesn't natively support PDF encryption — we just download normally
    // Password protection requires a server-side process; note this to user
    doc.save(filename);
    return { filename, note: "Note: PDF password protection requires server-side processing. The PDF has been saved without encryption. For password-protected PDFs, use Adobe Acrobat or a similar tool." };
  } else {
    doc.save(filename);
    return { filename };
  }
}

/* ═══════════════════════════════════════════════════════════════
   GLOBAL STYLES
═══════════════════════════════════════════════════════════════ */
const Styles = memo(() => (
  <style>{`
    *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
    :root {
      --bg:#0c0c10; --s1:#111116; --s2:#18181f; --s3:#1e1e27;
      --bd:rgba(255,255,255,0.07); --bd2:rgba(255,255,255,0.12);
      --text:#f0ece6; --dim:rgba(240,236,230,0.6); --muted:rgba(240,236,230,0.35);
      --pink:#ff2d78; --pink-dim:rgba(255,45,120,0.1); --pink-bd:rgba(255,45,120,0.22);
      --orange:#F26419; --green:#22c55e; --blue:#3b82f6; --yellow:#f59e0b;
      --surface:rgba(255,255,255,0.03); --hover:rgba(255,255,255,0.05);
      --sidebar:180px;
    }
    html, body, #root { height:100%; }
    body { background:var(--bg); color:var(--text); font-family:'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; -webkit-font-smoothing:antialiased; overflow-x:hidden; }
    a { text-decoration:none; color:inherit; }
    button { cursor:pointer; font-family:inherit; }
    input, textarea, select { font-family:inherit; }
    ::-webkit-scrollbar { width:4px; height:4px; }
    ::-webkit-scrollbar-thumb { background:var(--bd2); border-radius:4px; }

    .btn { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; font-size:13px; font-weight:600; border:none; border-radius:8px; cursor:pointer; letter-spacing:-.01em; transition:opacity .15s, background .15s; }
    .btn-primary { background:var(--pink); color:#fff; }
    .btn-primary:hover { opacity:.88; }
    .btn-primary:disabled { opacity:.4; cursor:default; }
    .btn-ghost { background:var(--surface); color:var(--text); border:1px solid var(--bd2); }
    .btn-ghost:hover { background:var(--hover); }
    .btn-danger { background:rgba(239,68,68,.1); color:#f87171; border:1px solid rgba(239,68,68,.2); }
    .btn-danger:hover { background:rgba(239,68,68,.18); }
    .btn-sm { padding:6px 14px; font-size:12px; border-radius:6px; }
    .btn-xs { padding:4px 10px; font-size:11px; border-radius:5px; }

    .card { background:var(--s1); border:1px solid var(--bd); border-radius:12px; }
    .inp { width:100%; padding:10px 13px; background:var(--s2); border:1px solid var(--bd); border-radius:8px; color:var(--text); font-size:13.5px; outline:none; transition:border-color .15s; }
    .inp:focus { border-color:var(--pink); }
    .inp::placeholder { color:var(--muted); }
    textarea.inp { resize:vertical; min-height:80px; line-height:1.7; }
    select.inp { appearance:none; cursor:pointer; }
    .lbl { font-size:11px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); display:block; margin-bottom:7px; }

    .badge { display:inline-flex; align-items:center; padding:3px 9px; border-radius:100px; font-size:11px; font-weight:600; }
    .table { width:100%; border-collapse:collapse; }
    .table th { font-size:10.5px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--muted); padding:10px 14px; text-align:left; border-bottom:1px solid var(--bd); white-space:nowrap; }
    .table td { padding:13px 14px; border-bottom:1px solid var(--bd); font-size:13.5px; vertical-align:middle; }
    .table tr:last-child td { border-bottom:none; }
    .table tbody tr:hover td { background:var(--hover); }

    .modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.8); backdrop-filter:blur(8px); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
    .modal { background:var(--s1); border:1px solid var(--bd2); border-radius:16px; width:100%; max-width:680px; max-height:92vh; display:flex; flex-direction:column; }
    .modal-lg { max-width:900px; }
    .modal-head { padding:22px 26px; border-bottom:1px solid var(--bd); display:flex; justify-content:space-between; align-items:center; flex-shrink:0; }
    .modal-body { padding:24px 26px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:18px; }
    .modal-foot { padding:16px 26px; border-top:1px solid var(--bd); display:flex; justify-content:flex-end; gap:10px; flex-shrink:0; }

    .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .grid3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; }

    .sidebar-link { display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:8px; font-size:13px; font-weight:500; color:var(--dim); margin-bottom:2px; transition:background .12s, color .12s; }
    .sidebar-link:hover { background:var(--hover); color:var(--text); }
    .sidebar-link.active { background:var(--pink-dim); color:var(--pink); }
    .sidebar-link .icon { font-size:16px; width:22px; flex-shrink:0; }

    @keyframes fadeUp { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
    .fade-up { animation:fadeUp .3s ease both; }
    @keyframes spin { to{transform:rotate(360deg);} }
    .spin { animation:spin .7s linear infinite; display:inline-block; }

    .section-title { font-size:22px; font-weight:800; color:var(--text); letter-spacing:-.02em; margin-bottom:6px; }
    .section-sub { font-size:13.5px; color:var(--muted); }

    .stat-card { background:var(--s1); border:1px solid var(--bd); border-radius:12px; padding:22px 20px; }
    .stat-value { font-size:28px; font-weight:800; letter-spacing:-.03em; color:var(--text); margin:6px 0 4px; }
    .stat-label { font-size:12px; color:var(--muted); font-weight:500; }

    .divider { border:none; border-top:1px solid var(--bd); margin:0; }
  `}</style>
));

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:400, padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:500, display:"flex", alignItems:"center", gap:10, animation:"fadeUp .25s ease",
      background: type==="success" ? "#14532d" : type==="error" ? "#7f1d1d" : "#1e3a5f",
      color: type==="success" ? "#86efac" : type==="error" ? "#fca5a5" : "#93c5fd",
      border:`1px solid ${type==="success"?"rgba(34,197,94,.3)":type==="error"?"rgba(239,68,68,.3)":"rgba(59,130,246,.3)"}`,
    }}>
      {type==="success"?"✓":type==="error"?"✕":"ℹ"} {msg}
    </div>
  );
}
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((msg, type="success") => setToast({ msg, type, k:Date.now() }), []);
  const el = toast ? <Toast key={toast.k} msg={toast.msg} type={toast.type} onClose={()=>setToast(null)} /> : null;
  return { show, el };
}

function Loader({ label="Loading…" }) {
  return <div style={{ padding:"60px 0", display:"flex", alignItems:"center", justifyContent:"center", gap:10, color:"var(--muted)", fontSize:13 }}><span className="spin" style={{fontSize:18}}>◌</span>{label}</div>;
}

function Empty({ icon, label, action }) {
  return (
    <div style={{ padding:"60px 0", textAlign:"center", color:"var(--muted)" }}>
      <div style={{ fontSize:40, marginBottom:12 }}>{icon}</div>
      <p style={{ fontSize:14, marginBottom:action?20:0 }}>{label}</p>
      {action}
    </div>
  );
}

function Confirm({ msg, onConfirm, onCancel }) {
  return (
    <div className="modal-bg" onClick={onCancel}>
      <div className="card fade-up" style={{ maxWidth:360, padding:"32px 28px", textAlign:"center" }} onClick={e=>e.stopPropagation()}>
        <div style={{ fontSize:36, marginBottom:14 }}>⚠</div>
        <p style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Are you sure?</p>
        <p style={{ fontSize:13, color:"var(--dim)", marginBottom:28 }}>{msg}</p>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onCancel} className="btn btn-ghost">Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS["Draft"];
  return <span className="badge" style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}` }}>{status}</span>;
}

function Field({ label, children, span }) {
  return (
    <div style={{ gridColumn: span ? "1 / -1" : undefined }}>
      {label && <label className="lbl">{label}</label>}
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   LOGIN
═══════════════════════════════════════════════════════════════ */
function Login({ login }) {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true); setErr(""); await new Promise(r=>setTimeout(r,400));
    if (!login(pw)) setErr("Incorrect password.");
    setLoading(false);
  };
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}>
      <Styles />
      <div className="card fade-up" style={{ width:"100%", maxWidth:380, padding:"48px 40px" }}>
        <div style={{ marginBottom:32, textAlign:"center" }}>
          <div style={{ display:"flex", justifyContent:"center", alignItems:"center", gap:3, marginBottom:12 }}>
            <span style={{ fontWeight:800, fontSize:32, color:"#fff", letterSpacing:"-.03em" }}>1204</span>
            <span style={{ fontWeight:800, fontSize:32, color:"var(--pink)", letterSpacing:"-.03em" }}>Studios</span>
          </div>
          <div style={{ fontSize:13, color:"var(--muted)", fontWeight:500 }}>Invoice Management System</div>
        </div>
        <label className="lbl">Access Password</label>
        <input type="password" className="inp" placeholder="Enter password" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>e.key==="Enter"&&submit()} autoFocus style={{ marginBottom: err?6:16 }} />
        {err && <p style={{ fontSize:12, color:"#f87171", marginBottom:14 }}>{err}</p>}
        <button onClick={submit} disabled={loading} className="btn btn-primary" style={{ width:"100%", justifyContent:"center", padding:"13px" }}>
          {loading ? <span className="spin">◌</span> : "Sign In →"}
        </button>
        <p style={{ fontSize:11, color:"var(--muted)", textAlign:"center", marginTop:20 }}>invoices.1204studios.com · Restricted Access</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════ */
const NAV = [
  { path:"/",          icon:"⬡",  label:"Dashboard"     },
  { path:"/create",    icon:"＋",  label:"Create Invoice" },
  { path:"/invoices",  icon:"📄", label:"Invoices"       },
  { path:"/clients",   icon:"👤", label:"Clients"        },
  { path:"/accounts",  icon:"🏦", label:"Accounts"       },
  { path:"/settings",  icon:"⚙",  label:"Settings"       },
];

function Sidebar({ logout }) {
  const { pathname } = useLocation();
  return (
    <aside style={{ width:"var(--sidebar)", flexShrink:0, background:"var(--s1)", borderRight:"1px solid var(--bd)", display:"flex", flexDirection:"column", height:"100vh", position:"sticky", top:0, overflow:"hidden" }}>
      <div style={{ padding:"20px 14px 16px", borderBottom:"1px solid var(--bd)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:3 }}>
          <span style={{ fontWeight:800, fontSize:18, color:"#fff", letterSpacing:"-.02em" }}>1204</span>
          <span style={{ fontWeight:800, fontSize:18, color:"var(--pink)", letterSpacing:"-.02em" }}>Studios</span>
        </div>
        <p style={{ fontSize:10.5, color:"var(--muted)", marginTop:3, fontWeight:500 }}>Invoices</p>
      </div>
      <nav style={{ padding:"8px 6px", flex:1 }}>
        {NAV.map(n => (
          <Link key={n.path} to={n.path} className={`sidebar-link${pathname===n.path||pathname.startsWith(n.path+"/")&&n.path!=="/"?" active":pathname==="/"&&n.path==="/"?" active":""}`}>
            <span className="icon">{n.icon}</span>{n.label}
          </Link>
        ))}
      </nav>
      <div style={{ padding:"8px 6px", borderTop:"1px solid var(--bd)" }}>
        <a href="https://1204studios.com" target="_blank" rel="noreferrer" className="sidebar-link"><span className="icon">↗</span>Main Site</a>
        <button onClick={logout} className="sidebar-link" style={{ width:"100%", background:"none", border:"none", textAlign:"left" }}><span className="icon">⏻</span>Sign Out</button>
      </div>
    </aside>
  );
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════ */
function Dashboard({ store, settings }) {
  const navigate = useNavigate();
  const { invoices, payments } = store;
  const [period, setPeriod] = useState("all");

  const filtered = useMemo(() => {
    if (period === "all") return invoices;
    const now = new Date(); const y = now.getFullYear(); const m = now.getMonth();
    return invoices.filter(inv => {
      const d = new Date(inv.date);
      if (period === "month") return d.getFullYear()===y && d.getMonth()===m;
      if (period === "quarter") return d.getFullYear()===y && Math.floor(d.getMonth()/3)===Math.floor(m/3);
      if (period === "year") return d.getFullYear()===y;
      return true;
    });
  }, [invoices, period]);

  const stats = useMemo(() => {
    const totalExpected = filtered.reduce((s,i) => { const{total}=calcInvoice(i.items,i.discount,i.tax); return s+total; }, 0);
    const totalPaid = filtered.reduce((s,i) => s + paidAmount(i.id, payments), 0);
    const outstanding = filtered.filter(i => !["Fully Paid","Cancelled"].includes(i.status)).length;
    const overdue = filtered.filter(i => i.status==="Overdue").length;
    const deposits = filtered.filter(i => i.status==="Deposit Required").length;
    return { totalExpected, totalPaid, outstanding, overdue, deposits, receivables: totalExpected - totalPaid };
  }, [filtered, payments]);

  // Monthly chart data
  const chartData = useMemo(() => {
    const months = Array.from({length:6}, (_,i) => {
      const d = new Date(); d.setMonth(d.getMonth()-5+i);
      return { month:d.toLocaleDateString("en",{month:"short"}), expected:0, paid:0 };
    });
    filtered.forEach(inv => {
      const d = new Date(inv.date); const now = new Date();
      const diff = (now.getFullYear()-d.getFullYear())*12 + now.getMonth()-d.getMonth();
      if (diff >= 0 && diff < 6) {
        const {total} = calcInvoice(inv.items,inv.discount,inv.tax);
        months[5-diff].expected += total;
        months[5-diff].paid += paidAmount(inv.id, payments);
      }
    });
    return months;
  }, [filtered, payments]);

  // Service breakdown
  const byService = useMemo(() => {
    const map = {};
    filtered.forEach(inv => {
      const s = inv.service || "Other";
      const {total} = calcInvoice(inv.items,inv.discount,inv.tax);
      map[s] = (map[s]||0) + total;
    });
    return Object.entries(map).map(([name,value]) => ({name,value})).sort((a,b)=>b.value-a.value);
  }, [filtered]);

  const recentInvoices = [...invoices].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,5);

  return (
    <div style={{ padding:"40px 48px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-sub">Financial overview for 1204Studios</p>
        </div>
        <div style={{ display:"flex", gap:6 }}>
          {[["all","All Time"],["month","This Month"],["quarter","This Quarter"],["year","This Year"]].map(([v,l])=>(
            <button key={v} onClick={()=>setPeriod(v)} className={`btn btn-sm ${period===v?"btn-primary":"btn-ghost"}`}>{l}</button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, marginBottom:28 }}>
        {[
          { label:"Total Expected",    value:fmt(stats.totalExpected,"NGN"),  icon:"📊", color:"var(--blue)"   },
          { label:"Total Collected",   value:fmt(stats.totalPaid,"NGN"),      icon:"✅", color:"var(--green)"  },
          { label:"Receivables",       value:fmt(stats.receivables,"NGN"),    icon:"⏳", color:"var(--orange)" },
          { label:"Outstanding",       value:stats.outstanding + " invoices", icon:"📋", color:"var(--text)"   },
          { label:"Overdue",           value:stats.overdue + " invoices",     icon:"⚠",  color:"#f87171"       },
          { label:"Deposits Pending",  value:stats.deposits + " invoices",    icon:"💰", color:"var(--yellow)" },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize:20 }}>{s.icon}</div>
            <div className="stat-value" style={{ color:s.color, fontSize:22 }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:16, marginBottom:28 }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding:"24px" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:20 }}>Revenue (Last 6 Months)</p>
          <div style={{ display:"flex", alignItems:"flex-end", gap:6, height:120 }}>
            {chartData.map((d,i) => {
              const maxVal = Math.max(...chartData.map(x=>x.expected)) || 1;
              const expH = (d.expected/maxVal)*110;
              const paidH = (d.paid/maxVal)*110;
              return (
                <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                  <div style={{ width:"100%", display:"flex", gap:2, alignItems:"flex-end", height:110 }}>
                    <div style={{ flex:1, background:"rgba(59,130,246,.25)", height:expH, borderRadius:"3px 3px 0 0", minHeight:2 }} title={`Expected: ${fmt(d.expected,"NGN")}`} />
                    <div style={{ flex:1, background:"var(--green)", height:paidH, borderRadius:"3px 3px 0 0", minHeight:2, opacity:.8 }} title={`Paid: ${fmt(d.paid,"NGN")}`} />
                  </div>
                  <span style={{ fontSize:10, color:"var(--muted)" }}>{d.month}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display:"flex", gap:16, marginTop:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)" }}><div style={{width:10,height:10,background:"rgba(59,130,246,.4)",borderRadius:2}}/> Expected</div>
            <div style={{ display:"flex", alignItems:"center", gap:6, fontSize:11, color:"var(--muted)" }}><div style={{width:10,height:10,background:"var(--green)",borderRadius:2,opacity:.8}}/> Collected</div>
          </div>
        </div>

        {/* By Service */}
        <div className="card" style={{ padding:"24px" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:16 }}>By Service</p>
          {byService.length === 0
            ? <p style={{ fontSize:12, color:"var(--muted)" }}>No data yet</p>
            : byService.map((s,i) => {
              const maxV = byService[0].value || 1;
              const colors = ["var(--pink)","var(--blue)","var(--orange)","var(--green)"];
              return (
                <div key={s.name} style={{ marginBottom:12 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, marginBottom:4 }}>
                    <span style={{ color:"var(--dim)" }}>{s.name}</span>
                    <span style={{ color:"var(--text)", fontWeight:600 }}>{fmt(s.value,"NGN")}</span>
                  </div>
                  <div style={{ height:4, background:"var(--bd)", borderRadius:2, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${(s.value/maxV)*100}%`, background:colors[i%4], borderRadius:2, transition:"width .6s" }} />
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="card" style={{ overflow:"hidden" }}>
        <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--bd)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <p style={{ fontSize:13, fontWeight:700 }}>Recent Invoices</p>
          <Link to="/invoices" className="btn btn-ghost btn-sm">View All</Link>
        </div>
        {recentInvoices.length === 0
          ? <Empty icon="📄" label="No invoices yet." action={<button onClick={()=>navigate("/create")} className="btn btn-primary btn-sm">Create your first</button>} />
          : <table className="table">
              <thead><tr><th>Invoice</th><th>Client</th><th>Project</th><th>Amount</th><th>Status</th><th>Due</th></tr></thead>
              <tbody>
                {recentInvoices.map(inv => {
                  const {total}=calcInvoice(inv.items,inv.discount,inv.tax);
                  return (
                    <tr key={inv.id} style={{ cursor:"pointer" }} onClick={()=>navigate(`/invoices/${inv.id}`)}>
                      <td><span style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:"var(--pink)" }}>{inv.number}</span></td>
                      <td style={{ fontWeight:600 }}>{inv.clientCompany||inv.clientName||"—"}</td>
                      <td style={{ color:"var(--dim)", fontSize:13 }}>{inv.projectName||"—"}</td>
                      <td style={{ fontWeight:700 }}>{fmt(total, inv.currency)}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td style={{ color:"var(--muted)", fontSize:13 }}>{fmtDate(inv.dueDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INVOICE FORM
═══════════════════════════════════════════════════════════════ */
const EMPTY_INVOICE = {
  clientName:"", clientCompany:"", clientEmail:"", clientPhone:"", clientAddress:"",
  projectName:"", service:"", description:"",
  date: today(), dueDate: addDays(today(), 14),
  currency:"NGN", discount:0, tax:0,
  accountId:"", items:[{ id:genId(), description:"", qty:1, price:0 }],
  status:"Draft", notes:"",
};

function InvoiceForm({ store, settings, onSave, editInvoice }) {
  const navigate = useNavigate();
  const { show, el:toastEl } = useToast();
  const [form, setForm] = useState(() => editInvoice ? { ...editInvoice } : { ...EMPTY_INVOICE });
  const [saving, setSaving] = useState(false);
  const [clientSearch, setClientSearch] = useState("");

  const set = (k,v) => setForm(f => ({...f,[k]:v}));

  const { subtotal, discountAmt, taxAmt, total } = useMemo(
    () => calcInvoice(form.items, form.discount, form.tax), [form.items, form.discount, form.tax]
  );

  const addItem = () => setForm(f => ({...f, items:[...f.items, {id:genId(), description:"", qty:1, price:0}]}));
  const removeItem = id => setForm(f => ({...f, items:f.items.filter(i=>i.id!==id)}));
  const updateItem = (id, k, v) => setForm(f => ({...f, items:f.items.map(i=>i.id===id?{...i,[k]:v}:i)}));
  const applyPreset = (id, preset) => { updateItem(id,"description",preset.name); updateItem(id,"price",preset.price); };

  const save = async (status) => {
    if (!form.clientName && !form.clientCompany) { show("Client name is required","error"); return; }
    if (!form.projectName) { show("Project name is required","error"); return; }
    setSaving(true);
    try {
      onSave({ ...form, status: status||form.status });
      show(editInvoice ? "Invoice updated" : "Invoice created");
      navigate("/invoices");
    } catch(e) { show("Error: "+e.message,"error"); }
    setSaving(false);
  };

  const fillClient = (client) => {
    setForm(f => ({...f,
      clientName: client.contactPerson||"",
      clientCompany: client.companyName||"",
      clientEmail: client.email||"",
      clientPhone: client.phone||"",
      clientAddress: client.address||"",
    }));
    setClientSearch("");
  };

  const matchedClients = clientSearch ? store.clients.filter(c =>
    c.companyName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.contactPerson?.toLowerCase().includes(clientSearch.toLowerCase())
  ) : [];

  return (
    <div style={{ padding:"40px 48px", maxWidth:1100 }}>
      {toastEl}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 className="section-title">{editInvoice ? "Edit Invoice" : "Create Invoice"}</h1>
          <p className="section-sub">{editInvoice ? `Editing ${editInvoice.number}` : "New invoice for 1204Studios"}</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={()=>navigate("/invoices")} className="btn btn-ghost">Cancel</button>
          <button onClick={()=>save("Draft")} disabled={saving} className="btn btn-ghost">Save Draft</button>
          <button onClick={()=>save("Sent")} disabled={saving} className="btn btn-primary">
            {saving ? <span className="spin">◌</span> : "Save & Mark Sent →"}
          </button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:20, alignItems:"start" }}>
        {/* Left column */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Client */}
          <div className="card" style={{ padding:"22px" }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:16, color:"var(--text)" }}>Client Information</p>
            <div style={{ marginBottom:12 }}>
              <label className="lbl">Search Existing Client</label>
              <input className="inp" placeholder="Type to search clients…" value={clientSearch} onChange={e=>setClientSearch(e.target.value)} />
              {matchedClients.length > 0 && (
                <div style={{ background:"var(--s2)", border:"1px solid var(--bd2)", borderRadius:8, marginTop:4, overflow:"hidden" }}>
                  {matchedClients.slice(0,4).map(c => (
                    <div key={c.id} onClick={()=>fillClient(c)} style={{ padding:"10px 14px", cursor:"pointer", fontSize:13, borderBottom:"1px solid var(--bd)" }}
                      onMouseOver={e=>e.currentTarget.style.background="var(--hover)"} onMouseOut={e=>e.currentTarget.style.background=""}>
                      <strong>{c.companyName||c.contactPerson}</strong>
                      {c.companyName && c.contactPerson && <span style={{ color:"var(--muted)", marginLeft:8 }}>{c.contactPerson}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="grid2">
              <Field label="Client Name"><input className="inp" placeholder="John Doe" value={form.clientName} onChange={e=>set("clientName",e.target.value)} /></Field>
              <Field label="Company Name"><input className="inp" placeholder="Acme Corp" value={form.clientCompany} onChange={e=>set("clientCompany",e.target.value)} /></Field>
              <Field label="Email"><input className="inp" type="email" placeholder="client@email.com" value={form.clientEmail} onChange={e=>set("clientEmail",e.target.value)} /></Field>
              <Field label="Phone"><input className="inp" placeholder="+234…" value={form.clientPhone} onChange={e=>set("clientPhone",e.target.value)} /></Field>
              <Field label="Address" span><textarea className="inp" placeholder="Client address" value={form.clientAddress} onChange={e=>set("clientAddress",e.target.value)} style={{ minHeight:60 }} /></Field>
            </div>
          </div>

          {/* Project */}
          <div className="card" style={{ padding:"22px" }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:16, color:"var(--text)" }}>Project Details</p>
            <div className="grid2">
              <Field label="Project Name" span><input className="inp" placeholder="Brand Identity for XYZ" value={form.projectName} onChange={e=>set("projectName",e.target.value)} /></Field>
              <Field label="Service Category">
                <select className="inp" value={form.service} onChange={e=>set("service",e.target.value)}>
                  <option value="">Select category…</option>
                  {SERVICES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Currency">
                <select className="inp" value={form.currency} onChange={e=>set("currency",e.target.value)}>
                  {CURRENCIES.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Description" span>
                <textarea className="inp" placeholder="Brief description of scope…" value={form.description} onChange={e=>set("description",e.target.value)} style={{ minHeight:70 }} />
              </Field>
            </div>
          </div>

          {/* Line Items */}
          <div className="card" style={{ padding:"22px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
              <p style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>Line Items</p>
              <button onClick={addItem} className="btn btn-ghost btn-sm">+ Add Item</button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 60px 110px 110px 36px", gap:6, marginBottom:8 }}>
              {["Description","Qty","Unit Price","Amount",""].map(h=><span key={h} className="lbl" style={{ marginBottom:0 }}>{h}</span>)}
            </div>
            {form.items.map((item, idx) => (
              <div key={item.id} style={{ display:"grid", gridTemplateColumns:"1fr 60px 110px 110px 36px", gap:6, marginBottom:8, alignItems:"center" }}>
                <div style={{ position:"relative" }}>
                  <input className="inp" placeholder="Service or deliverable…" value={item.description} onChange={e=>updateItem(item.id,"description",e.target.value)} style={{ paddingRight:88 }} />
                  <select onChange={e=>{if(e.target.value)applyPreset(item.id,PRESET_ITEMS.find(p=>p.name===e.target.value));}}
                    style={{ position:"absolute", right:4, top:"50%", transform:"translateY(-50%)", background:"var(--s3)", border:"1px solid var(--bd)", color:"var(--muted)", borderRadius:5, fontSize:10, padding:"3px 6px", cursor:"pointer" }}>
                    <option value="">Presets</option>
                    {PRESET_ITEMS.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
                  </select>
                </div>
                <input className="inp" type="number" min="1" value={item.qty} onChange={e=>updateItem(item.id,"qty",e.target.value)} style={{ textAlign:"center" }} />
                <input className="inp" type="number" min="0" value={item.price} onChange={e=>updateItem(item.id,"price",e.target.value)} />
                <div style={{ padding:"10px 13px", background:"var(--s3)", border:"1px solid var(--bd)", borderRadius:8, fontSize:13, color:"var(--dim)", fontWeight:600, textAlign:"right" }}>
                  {fmt(Number(item.qty||1)*Number(item.price||0), form.currency)}
                </div>
                <button onClick={()=>removeItem(item.id)} style={{ width:36, height:36, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(239,68,68,.08)", border:"1px solid rgba(239,68,68,.15)", borderRadius:7, cursor:"pointer", color:"#f87171", fontSize:16 }} disabled={form.items.length===1}>✕</button>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: invoice meta + totals */}
        <div style={{ display:"flex", flexDirection:"column", gap:16, position:"sticky", top:20 }}>
          <div className="card" style={{ padding:"20px" }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Invoice Details</p>
            <Field label="Invoice Date"><input className="inp" type="date" value={form.date} onChange={e=>set("date",e.target.value)} /></Field>
            <div style={{ height:10 }} />
            <Field label="Due Date"><input className="inp" type="date" value={form.dueDate} onChange={e=>set("dueDate",e.target.value)} /></Field>
            <div style={{ height:10 }} />
            <Field label="Status">
              <select className="inp" value={form.status} onChange={e=>set("status",e.target.value)}>
                {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
            <div style={{ height:10 }} />
            <Field label="Payment Account">
              <select className="inp" value={form.accountId} onChange={e=>set("accountId",e.target.value)}>
                <option value="">Select account…</option>
                {(settings.accounts||[]).map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </Field>
          </div>

          <div className="card" style={{ padding:"20px" }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Adjustments</p>
            <Field label={`Discount (%)`}><input className="inp" type="number" min="0" max="100" value={form.discount} onChange={e=>set("discount",e.target.value)} /></Field>
            <div style={{ height:10 }} />
            <Field label={`Tax (%)`}><input className="inp" type="number" min="0" max="100" value={form.tax} onChange={e=>set("tax",e.target.value)} /></Field>
          </div>

          {/* Totals */}
          <div className="card" style={{ padding:"20px" }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Summary</p>
            {[
              { l:"Subtotal", v:fmt(subtotal, form.currency) },
              form.discount>0 && { l:`Discount (${form.discount}%)`, v:`-${fmt(discountAmt, form.currency)}`, c:"#f87171" },
              form.tax>0 && { l:`Tax (${form.tax}%)`, v:fmt(taxAmt, form.currency) },
            ].filter(Boolean).map(r => (
              <div key={r.l} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:8 }}>
                <span style={{ color:"var(--muted)" }}>{r.l}</span>
                <span style={{ color:r.c||"var(--text)", fontWeight:500 }}>{r.v}</span>
              </div>
            ))}
            <div style={{ height:1, background:"var(--bd)", margin:"10px 0" }} />
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:18, fontWeight:800, color:"var(--text)" }}>
              <span>Total</span>
              <span style={{ color:"var(--pink)" }}>{fmt(total, form.currency)}</span>
            </div>
          </div>

          <div className="card" style={{ padding:"20px" }}>
            <p style={{ fontSize:13, fontWeight:700, marginBottom:14 }}>Notes</p>
            <textarea className="inp" placeholder="Internal notes (not shown on PDF)…" value={form.notes} onChange={e=>set("notes",e.target.value)} style={{ minHeight:70 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INVOICE LIST
═══════════════════════════════════════════════════════════════ */
function InvoiceList({ store, settings, onDelete, onStatusChange }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");
  const [confirm, setConfirm] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);
  const { show, el:toastEl } = useToast();

  const filtered = useMemo(() => {
    return store.invoices.filter(inv => {
      if (statusFilter !== "All" && inv.status !== statusFilter) return false;
      if (serviceFilter !== "All" && inv.service !== serviceFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (inv.number||"").toLowerCase().includes(s) ||
          (inv.clientName||"").toLowerCase().includes(s) ||
          (inv.clientCompany||"").toLowerCase().includes(s) ||
          (inv.projectName||"").toLowerCase().includes(s);
      }
      return true;
    }).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  }, [store.invoices, statusFilter, serviceFilter, search]);

  const dlPDF = async (inv) => {
    setPdfLoading(inv.id);
    try { await generatePDF(inv, store.payments, settings, ""); show("PDF downloaded"); }
    catch(e) { show("PDF error: "+e.message,"error"); }
    setPdfLoading(null);
  };

  return (
    <div style={{ padding:"40px 48px" }}>
      {toastEl}
      {confirm && <Confirm msg="Delete this invoice permanently?" onConfirm={()=>{onDelete(confirm);setConfirm(null);show("Invoice deleted");}} onCancel={()=>setConfirm(null)} />}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 className="section-title">Invoices</h1>
          <p className="section-sub">{store.invoices.length} total · {store.invoices.filter(i=>i.status==="Fully Paid").length} paid</p>
        </div>
        <button onClick={()=>navigate("/create")} className="btn btn-primary">+ Create Invoice</button>
      </div>

      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        <input className="inp" placeholder="Search invoices…" value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:260, flex:"0 0 auto" }} />
        <select className="inp" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={{ maxWidth:180, flex:"0 0 auto" }}>
          <option value="All">All Statuses</option>
          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <select className="inp" value={serviceFilter} onChange={e=>setServiceFilter(e.target.value)} style={{ maxWidth:200, flex:"0 0 auto" }}>
          <option value="All">All Services</option>
          {SERVICES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        {filtered.length === 0
          ? <Empty icon="📄" label={search||statusFilter!=="All"?"No invoices match your filters.":"No invoices yet."} action={!search&&statusFilter==="All"&&<button onClick={()=>navigate("/create")} className="btn btn-primary btn-sm">Create First Invoice</button>} />
          : <table className="table">
              <thead><tr><th>Invoice #</th><th>Client</th><th>Project</th><th>Service</th><th>Amount</th><th>Paid</th><th>Status</th><th>Due</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
              <tbody>
                {filtered.map(inv => {
                  const {total}=calcInvoice(inv.items,inv.discount,inv.tax);
                  const paid=paidAmount(inv.id,store.payments);
                  return (
                    <tr key={inv.id}>
                      <td onClick={()=>navigate(`/invoices/${inv.id}`)} style={{ cursor:"pointer" }}>
                        <span style={{ fontFamily:"'DM Mono', monospace", fontSize:11.5, color:"var(--pink)", fontWeight:600 }}>{inv.number}</span>
                      </td>
                      <td style={{ fontWeight:600 }}>{inv.clientCompany||inv.clientName||"—"}</td>
                      <td style={{ color:"var(--dim)", fontSize:13 }}>{inv.projectName||"—"}</td>
                      <td><span style={{ fontSize:11, color:"var(--muted)" }}>{inv.service||"—"}</span></td>
                      <td style={{ fontWeight:700 }}>{fmt(total,inv.currency)}</td>
                      <td style={{ color:"var(--green)", fontSize:13 }}>{paid>0?fmt(paid,inv.currency):"—"}</td>
                      <td><StatusBadge status={inv.status} /></td>
                      <td style={{ color:new Date(inv.dueDate)<new Date()&&!["Fully Paid","Cancelled"].includes(inv.status)?"#f87171":"var(--muted)", fontSize:13 }}>{fmtDate(inv.dueDate)}</td>
                      <td>
                        <div style={{ display:"flex", gap:5, justifyContent:"flex-end" }}>
                          <button onClick={()=>navigate(`/invoices/${inv.id}`)} className="btn btn-ghost btn-xs">View</button>
                          <button onClick={()=>dlPDF(inv)} className="btn btn-ghost btn-xs" disabled={pdfLoading===inv.id}>
                            {pdfLoading===inv.id?<span className="spin">◌</span>:"PDF"}
                          </button>
                          {inv.status==="Draft"&&<button onClick={()=>navigate(`/invoices/${inv.id}/edit`)} className="btn btn-ghost btn-xs">Edit</button>}
                          <button onClick={()=>setConfirm(inv.id)} className="btn btn-danger btn-xs">✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INVOICE DETAIL
═══════════════════════════════════════════════════════════════ */
function InvoiceDetail({ store, settings, onStatusChange, onPaymentAdd, update }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const invoice = store.invoices.find(i=>i.id===id);
  const invPayments = store.payments.filter(p=>p.invoiceId===id);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payForm, setPayForm] = useState({ date:today(), amount:"", method:"Bank Transfer", ref:"" });
  const [pdfLoading, setPdfLoading] = useState(false);
  const { show, el:toastEl } = useToast();

  if (!invoice) return <div style={{ padding:"60px 48px" }}><Link to="/invoices" className="btn btn-ghost">← Back</Link><p style={{ marginTop:20, color:"var(--muted)" }}>Invoice not found.</p></div>;

  const { subtotal, discountAmt, taxAmt, total } = calcInvoice(invoice.items, invoice.discount, invoice.tax);
  const paid = paidAmount(id, store.payments);
  const balance = total - paid;

  const account = (settings.accounts||[]).find(a=>a.id===invoice.accountId);

  const addPayment = () => {
    if (!payForm.amount) return;
    onPaymentAdd({ id:genId(), invoiceId:id, ...payForm, amount:Number(payForm.amount), createdAt:new Date().toISOString() });
    const newPaid = paid + Number(payForm.amount);
    const newStatus = newPaid >= total ? "Fully Paid" : newPaid > 0 ? "Partially Paid" : invoice.status;
    if (newStatus !== invoice.status) onStatusChange(id, newStatus);
    setShowPayModal(false);
    setPayForm({ date:today(), amount:"", method:"Bank Transfer", ref:"" });
    show("Payment recorded");
  };

  const dlPDF = async () => {
    setPdfLoading(true);
    try { await generatePDF(invoice, store.payments, settings, ""); show("PDF downloaded"); }
    catch(e) { show("PDF error: "+e.message,"error"); }
    setPdfLoading(false);
  };

  return (
    <div style={{ padding:"40px 48px", maxWidth:1000 }}>
      {toastEl}
      {showPayModal && (
        <div className="modal-bg" onClick={()=>setShowPayModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h3 style={{ fontSize:16, fontWeight:700 }}>Record Payment</h3><button onClick={()=>setShowPayModal(false)} className="btn btn-ghost btn-sm">✕</button></div>
            <div className="modal-body">
              <Field label="Payment Date"><input className="inp" type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))} /></Field>
              <Field label="Amount"><input className="inp" type="number" placeholder={fmt(balance,invoice.currency)} value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:e.target.value}))} /></Field>
              <Field label="Payment Method">
                <select className="inp" value={payForm.method} onChange={e=>setPayForm(f=>({...f,method:e.target.value}))}>
                  {["Bank Transfer","Card","Cash","Cheque","Crypto","Other"].map(m=><option key={m} value={m}>{m}</option>)}
                </select>
              </Field>
              <Field label="Reference / Note"><input className="inp" placeholder="Transaction ref or note…" value={payForm.ref} onChange={e=>setPayForm(f=>({...f,ref:e.target.value}))} /></Field>
            </div>
            <div className="modal-foot">
              <button onClick={()=>setShowPayModal(false)} className="btn btn-ghost">Cancel</button>
              <button onClick={addPayment} className="btn btn-primary">Record Payment</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <button onClick={()=>navigate("/invoices")} className="btn btn-ghost btn-sm">← Back</button>
          <span style={{ fontFamily:"'DM Mono',monospace", fontSize:16, fontWeight:700, color:"var(--pink)" }}>{invoice.number}</span>
          <StatusBadge status={invoice.status} />
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <select className="inp btn-sm" style={{ width:"auto" }} value={invoice.status} onChange={e=>onStatusChange(id,e.target.value)}>
            {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={()=>setShowPayModal(true)} className="btn btn-ghost btn-sm" disabled={invoice.status==="Fully Paid"}>Record Payment</button>
          <button onClick={dlPDF} disabled={pdfLoading} className="btn btn-primary btn-sm">
            {pdfLoading?<span className="spin">◌</span>:"↓ Download PDF"}
          </button>
          {invoice.status==="Draft"&&<button onClick={()=>navigate(`/invoices/${id}/edit`)} className="btn btn-ghost btn-sm">Edit</button>}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:20 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Invoice header info */}
          <div className="card" style={{ padding:"24px" }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:20 }}>
              {[
                {l:"Issue Date",v:fmtDate(invoice.date)},
                {l:"Due Date",v:fmtDate(invoice.dueDate)},
                {l:"Currency",v:invoice.currency},
              ].map(r=>(
                <div key={r.l}>
                  <p style={{ fontSize:10.5, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--muted)", marginBottom:5 }}>{r.l}</p>
                  <p style={{ fontSize:14, fontWeight:600, color:"var(--text)" }}>{r.v}</p>
                </div>
              ))}
            </div>
            <hr className="divider" style={{ margin:"0 0 20px" }} />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:24 }}>
              <div>
                <p style={{ fontSize:10.5, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--muted)", marginBottom:8 }}>Bill To</p>
                <p style={{ fontWeight:700, fontSize:14 }}>{invoice.clientCompany||invoice.clientName||"—"}</p>
                {invoice.clientCompany&&<p style={{ color:"var(--dim)", fontSize:13 }}>{invoice.clientName}</p>}
                <p style={{ color:"var(--muted)", fontSize:13 }}>{invoice.clientEmail}</p>
                <p style={{ color:"var(--muted)", fontSize:13 }}>{invoice.clientPhone}</p>
                {invoice.clientAddress&&<p style={{ color:"var(--muted)", fontSize:13, marginTop:4 }}>{invoice.clientAddress}</p>}
              </div>
              <div>
                <p style={{ fontSize:10.5, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--muted)", marginBottom:8 }}>Project</p>
                <p style={{ fontWeight:700, fontSize:14 }}>{invoice.projectName||"—"}</p>
                <p style={{ color:"var(--muted)", fontSize:13 }}>{invoice.service}</p>
                {invoice.description&&<p style={{ color:"var(--muted)", fontSize:13, marginTop:6, lineHeight:1.6 }}>{invoice.description}</p>}
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="card" style={{ overflow:"hidden" }}>
            <table className="table">
              <thead><tr><th>Description</th><th style={{textAlign:"center"}}>Qty</th><th style={{textAlign:"right"}}>Unit Price</th><th style={{textAlign:"right"}}>Amount</th></tr></thead>
              <tbody>
                {invoice.items.map(item => (
                  <tr key={item.id}>
                    <td>{item.description||"—"}</td>
                    <td style={{ textAlign:"center", color:"var(--muted)" }}>{item.qty}</td>
                    <td style={{ textAlign:"right", color:"var(--dim)" }}>{fmt(item.price,invoice.currency)}</td>
                    <td style={{ textAlign:"right", fontWeight:700 }}>{fmt(Number(item.qty)*Number(item.price),invoice.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding:"16px 20px", background:"var(--s2)", borderTop:"1px solid var(--bd)" }}>
              <div style={{ maxWidth:240, marginLeft:"auto" }}>
                {[
                  {l:"Subtotal",v:fmt(subtotal,invoice.currency)},
                  invoice.discount>0&&{l:`Discount (${invoice.discount}%)`,v:`-${fmt(discountAmt,invoice.currency)}`,c:"#f87171"},
                  invoice.tax>0&&{l:`Tax (${invoice.tax}%)`,v:fmt(taxAmt,invoice.currency)},
                ].filter(Boolean).map(r=>(
                  <div key={r.l} style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:6 }}>
                    <span style={{ color:"var(--muted)" }}>{r.l}</span>
                    <span style={{ color:r.c||"var(--dim)" }}>{r.v}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:16, fontWeight:800, borderTop:"1px solid var(--bd)", paddingTop:10, marginTop:6 }}>
                  <span>Total</span><span style={{ color:"var(--pink)" }}>{fmt(total,invoice.currency)}</span>
                </div>
                {paid>0&&<>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, marginTop:8 }}>
                    <span style={{ color:"var(--muted)" }}>Paid</span><span style={{ color:"var(--green)" }}>{fmt(paid,invoice.currency)}</span>
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:15, fontWeight:800, marginTop:4 }}>
                    <span>Balance</span><span style={{ color:"var(--orange)" }}>{fmt(balance,invoice.currency)}</span>
                  </div>
                </>}
              </div>
            </div>
          </div>

          {/* Payment history */}
          {invPayments.length > 0 && (
            <div className="card" style={{ overflow:"hidden" }}>
              <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--bd)" }}>
                <p style={{ fontSize:13, fontWeight:700 }}>Payment History</p>
              </div>
              <table className="table">
                <thead><tr><th>Date</th><th>Amount</th><th>Method</th><th>Reference</th></tr></thead>
                <tbody>
                  {invPayments.map(p=>(
                    <tr key={p.id}>
                      <td style={{ fontSize:13, color:"var(--muted)" }}>{fmtDate(p.date)}</td>
                      <td style={{ fontWeight:700, color:"var(--green)" }}>{fmt(p.amount,invoice.currency)}</td>
                      <td style={{ fontSize:13, color:"var(--dim)" }}>{p.method}</td>
                      <td style={{ fontSize:13, color:"var(--muted)" }}>{p.ref||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: account + notes */}
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {/* Balance summary */}
          <div className="card" style={{ padding:"20px" }}>
            <p style={{ fontSize:11, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--muted)", marginBottom:12 }}>Balance Due</p>
            <div style={{ fontSize:30, fontWeight:800, color:balance<=0?"var(--green)":"var(--pink)", letterSpacing:"-.03em" }}>{fmt(balance,invoice.currency)}</div>
            {balance<=0&&<p style={{ fontSize:12, color:"var(--green)", marginTop:4 }}>✓ Fully paid</p>}
            {paid>0&&balance>0&&(
              <div style={{ marginTop:12 }}>
                <div style={{ height:4, background:"var(--bd)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${Math.min(100,(paid/total)*100)}%`, background:"var(--green)", borderRadius:2 }} />
                </div>
                <p style={{ fontSize:11, color:"var(--muted)", marginTop:6 }}>{Math.round((paid/total)*100)}% paid</p>
              </div>
            )}
          </div>

          {/* Payment account */}
          {account && (
            <div className="card" style={{ padding:"20px" }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--muted)", marginBottom:12 }}>Payment Account</p>
              <p style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>{account.name}</p>
              {[["Bank",account.bank],["Account",account.accountName],["Number",account.accountNumber],["SWIFT",account.swift]].filter(r=>r[1]).map(r=>(
                <div key={r[0]} style={{ display:"flex", gap:8, fontSize:12.5, marginBottom:6 }}>
                  <span style={{ color:"var(--muted)", width:56, flexShrink:0 }}>{r[0]}</span>
                  <span style={{ color:"var(--dim)", fontFamily:"'DM Mono',monospace", fontSize:12 }}>{r[1]}</span>
                </div>
              ))}
              {account.instructions&&<p style={{ fontSize:12, color:"var(--muted)", marginTop:8, lineHeight:1.6, fontStyle:"italic" }}>{account.instructions}</p>}
            </div>
          )}

          {invoice.notes && (
            <div className="card" style={{ padding:"20px" }}>
              <p style={{ fontSize:11, fontWeight:600, letterSpacing:"1.5px", textTransform:"uppercase", color:"var(--muted)", marginBottom:10 }}>Internal Notes</p>
              <p style={{ fontSize:13, color:"var(--dim)", lineHeight:1.7 }}>{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function useParams() {
  const { pathname } = useLocation();
  const parts = pathname.split("/");
  return { id: parts[2], action: parts[3] };
}

/* ═══════════════════════════════════════════════════════════════
   CLIENTS
═══════════════════════════════════════════════════════════════ */
function ClientsPage({ store, onSave, onDelete }) {
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({ companyName:"", contactPerson:"", email:"", phone:"", address:"" });
  const { show, el:toastEl } = useToast();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = () => {
    if (!form.companyName&&!form.contactPerson) { show("Name required","error"); return; }
    onSave(form.id ? form : { ...form, id:genId(), createdAt:new Date().toISOString() });
    setModal(null); setForm({ companyName:"", contactPerson:"", email:"", phone:"", address:"" });
    show(form.id ? "Client updated" : "Client added");
  };

  return (
    <div style={{ padding:"40px 48px" }}>
      {toastEl}
      {confirm&&<Confirm msg="Delete this client?" onConfirm={()=>{onDelete(confirm);setConfirm(null);show("Client deleted");}} onCancel={()=>setConfirm(null)} />}
      {modal&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h3 style={{fontSize:16,fontWeight:700}}>{form.id?"Edit Client":"New Client"}</h3><button onClick={()=>setModal(null)} className="btn btn-ghost btn-sm">✕</button></div>
            <div className="modal-body">
              <div className="grid2">
                <Field label="Company Name"><input className="inp" value={form.companyName} onChange={e=>set("companyName",e.target.value)} placeholder="Acme Corp" /></Field>
                <Field label="Contact Person"><input className="inp" value={form.contactPerson} onChange={e=>set("contactPerson",e.target.value)} placeholder="John Doe" /></Field>
                <Field label="Email"><input className="inp" type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="contact@company.com" /></Field>
                <Field label="Phone"><input className="inp" value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+234…" /></Field>
                <Field label="Address" span><textarea className="inp" value={form.address} onChange={e=>set("address",e.target.value)} placeholder="Full address" style={{minHeight:70}} /></Field>
              </div>
            </div>
            <div className="modal-foot">
              <button onClick={()=>setModal(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={save} className="btn btn-primary">{form.id?"Save Changes":"Add Client"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 className="section-title">Clients</h1>
          <p className="section-sub">{store.clients.length} clients in database</p>
        </div>
        <button onClick={()=>{setForm({companyName:"",contactPerson:"",email:"",phone:"",address:""});setModal(true);}} className="btn btn-primary">+ Add Client</button>
      </div>

      <div className="card" style={{ overflow:"hidden" }}>
        {store.clients.length===0
          ? <Empty icon="👤" label="No clients yet." action={<button onClick={()=>{setForm({companyName:"",contactPerson:"",email:"",phone:"",address:""});setModal(true);}} className="btn btn-primary btn-sm">Add your first client</button>} />
          : <table className="table">
              <thead><tr><th>Company</th><th>Contact</th><th>Email</th><th>Phone</th><th>Invoices</th><th style={{textAlign:"right"}}>Actions</th></tr></thead>
              <tbody>
                {store.clients.map(c => {
                  const invCount = store.invoices.filter(i=>i.clientCompany===c.companyName||i.clientName===c.contactPerson).length;
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight:700 }}>{c.companyName||"—"}</td>
                      <td style={{ color:"var(--dim)" }}>{c.contactPerson||"—"}</td>
                      <td style={{ color:"var(--muted)", fontSize:13 }}>{c.email||"—"}</td>
                      <td style={{ color:"var(--muted)", fontSize:13 }}>{c.phone||"—"}</td>
                      <td><span style={{ fontSize:12, color:"var(--muted)" }}>{invCount} invoice{invCount!==1?"s":""}</span></td>
                      <td>
                        <div style={{ display:"flex", gap:6, justifyContent:"flex-end" }}>
                          <button onClick={()=>{setForm({...c});setModal(true);}} className="btn btn-ghost btn-xs">Edit</button>
                          <button onClick={()=>navigate(`/create`)} className="btn btn-ghost btn-xs">Invoice</button>
                          <button onClick={()=>setConfirm(c.id)} className="btn btn-danger btn-xs">✕</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ACCOUNTS
═══════════════════════════════════════════════════════════════ */
function AccountsPage({ settings, onSave }) {
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name:"", bank:"", accountName:"", accountNumber:"", swift:"", instructions:"" });
  const { show, el:toastEl } = useToast();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = () => {
    if (!form.name) { show("Account name required","error"); return; }
    const accounts = form.id
      ? settings.accounts.map(a=>a.id===form.id?form:a)
      : [...(settings.accounts||[]), { ...form, id:genId() }];
    onSave({ ...settings, accounts });
    setModal(null);
    show(form.id?"Account updated":"Account added");
  };

  const del = (id) => {
    onSave({ ...settings, accounts:(settings.accounts||[]).filter(a=>a.id!==id) });
    show("Account removed");
  };

  return (
    <div style={{ padding:"40px 48px" }}>
      {toastEl}
      {modal&&(
        <div className="modal-bg" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div className="modal-head"><h3 style={{fontSize:16,fontWeight:700}}>{form.id?"Edit Account":"New Payment Account"}</h3><button onClick={()=>setModal(null)} className="btn btn-ghost btn-sm">✕</button></div>
            <div className="modal-body">
              <Field label="Account Label (e.g. NGN Bank Transfer)"><input className="inp" value={form.name} onChange={e=>set("name",e.target.value)} placeholder="NGN Bank Transfer" /></Field>
              <div className="grid2">
                <Field label="Bank Name"><input className="inp" value={form.bank} onChange={e=>set("bank",e.target.value)} placeholder="GTBank" /></Field>
                <Field label="Account Name"><input className="inp" value={form.accountName} onChange={e=>set("accountName",e.target.value)} placeholder="1204 Studios Ltd" /></Field>
                <Field label="Account Number"><input className="inp" value={form.accountNumber} onChange={e=>set("accountNumber",e.target.value)} placeholder="0123456789" /></Field>
                <Field label="SWIFT / Sort Code"><input className="inp" value={form.swift} onChange={e=>set("swift",e.target.value)} placeholder="GTBINGLA" /></Field>
              </div>
              <Field label="Payment Instructions"><textarea className="inp" value={form.instructions} onChange={e=>set("instructions",e.target.value)} placeholder="Transfer using invoice number as reference…" style={{minHeight:80}} /></Field>
            </div>
            <div className="modal-foot">
              <button onClick={()=>setModal(null)} className="btn btn-ghost">Cancel</button>
              <button onClick={save} className="btn btn-primary">{form.id?"Save Changes":"Add Account"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
        <div>
          <h1 className="section-title">Payment Accounts</h1>
          <p className="section-sub">Bank details that appear on invoices</p>
        </div>
        <button onClick={()=>{setForm({name:"",bank:"",accountName:"",accountNumber:"",swift:"",instructions:""});setModal(true);}} className="btn btn-primary">+ Add Account</button>
      </div>

      {(settings.accounts||[]).length===0
        ? <div className="card"><Empty icon="🏦" label="No accounts saved yet." action={<button onClick={()=>{setForm({name:"",bank:"",accountName:"",accountNumber:"",swift:"",instructions:""});setModal(true);}} className="btn btn-primary btn-sm">Add account</button>} /></div>
        : <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(340px,1fr))", gap:14 }}>
            {(settings.accounts||[]).map(acc=>(
              <div key={acc.id} className="card" style={{ padding:"22px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div>
                    <p style={{ fontWeight:700, fontSize:14, marginBottom:4 }}>{acc.name}</p>
                    <p style={{ fontSize:12, color:"var(--muted)" }}>{acc.bank}</p>
                  </div>
                  <div style={{ display:"flex", gap:6 }}>
                    <button onClick={()=>{setForm({...acc});setModal(true);}} className="btn btn-ghost btn-xs">Edit</button>
                    <button onClick={()=>del(acc.id)} className="btn btn-danger btn-xs">✕</button>
                  </div>
                </div>
                {[["Account Name",acc.accountName],["Account #",acc.accountNumber],["SWIFT",acc.swift]].filter(r=>r[1]).map(r=>(
                  <div key={r[0]} style={{ display:"flex", gap:10, fontSize:12.5, marginBottom:6 }}>
                    <span style={{ color:"var(--muted)", width:80, flexShrink:0 }}>{r[0]}</span>
                    <span style={{ color:"var(--dim)", fontFamily:"'DM Mono',monospace", fontSize:12 }}>{r[1]}</span>
                  </div>
                ))}
                {acc.instructions&&<p style={{ fontSize:12, color:"var(--muted)", marginTop:10, lineHeight:1.6, fontStyle:"italic", borderTop:"1px solid var(--bd)", paddingTop:10 }}>{acc.instructions}</p>}
              </div>
            ))}
          </div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SETTINGS
═══════════════════════════════════════════════════════════════ */
function SettingsPage({ settings, onSave }) {
  const [form, setForm] = useState({ ...settings });
  const { show, el:toastEl } = useToast();
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => set("logoDataUrl", ev.target.result);
    r.readAsDataURL(file);
  };

  const handleWatermarkUpload = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = ev => set("watermarkDataUrl", ev.target.result);
    r.readAsDataURL(file);
  };

  const save = () => { onSave(form); show("Settings saved"); };

  return (
    <div style={{ padding:"40px 48px", maxWidth:800 }}>
      {toastEl}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-sub">Studio information and invoice defaults</p>
        </div>
        <button onClick={save} className="btn btn-primary">Save Settings</button>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {/* Studio info */}
        <div className="card" style={{ padding:"24px" }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:18 }}>Studio Information</p>
          <div className="grid2">
            <Field label="Studio Name"><input className="inp" value={form.studioName} onChange={e=>set("studioName",e.target.value)} /></Field>
            <Field label="RC Number"><input className="inp" value={form.studioRC} onChange={e=>set("studioRC",e.target.value)} /></Field>
            <Field label="Email"><input className="inp" type="email" value={form.studioEmail} onChange={e=>set("studioEmail",e.target.value)} /></Field>
            <Field label="Phone"><input className="inp" value={form.studioPhone} onChange={e=>set("studioPhone",e.target.value)} /></Field>
            <Field label="Website"><input className="inp" value={form.studioWebsite} onChange={e=>set("studioWebsite",e.target.value)} /></Field>
            <Field label="Invoice Prefix"><input className="inp" value={form.invoicePrefix} onChange={e=>set("invoicePrefix",e.target.value)} placeholder="1204STUDIOS-INV" /></Field>
            <Field label="Address" span><textarea className="inp" value={form.studioAddress} onChange={e=>set("studioAddress",e.target.value)} style={{minHeight:70}} /></Field>
          </div>
        </div>

        {/* Watermark */}
        <div className="card" style={{ padding:"24px" }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>PDF Watermark / Letterhead</p>
          <p style={{ fontSize:12, color:"var(--muted)", marginBottom:16 }}>This image appears as a background watermark on every page of the generated PDF. Upload your letterhead PNG.</p>
          <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
            <div>
              <label className="lbl">Upload Watermark Image</label>
              <input type="file" accept="image/*" onChange={handleWatermarkUpload} style={{ color:"var(--dim)", fontSize:13 }} />
            </div>
            {form.watermarkDataUrl && (
              <div style={{ border:"1px solid var(--bd)", borderRadius:8, overflow:"hidden", width:80 }}>
                <img src={form.watermarkDataUrl} alt="watermark preview" style={{ width:"100%", display:"block" }} />
              </div>
            )}
          </div>
          <div style={{ marginTop:16 }}>
            <label className="lbl">Watermark Opacity: {Math.round((form.watermarkOpacity||0.08)*100)}%</label>
            <input type="range" min="1" max="30" value={Math.round((form.watermarkOpacity||0.08)*100)} onChange={e=>set("watermarkOpacity",Number(e.target.value)/100)} style={{ width:"100%", accentColor:"var(--pink)" }} />
          </div>
        </div>

        {/* Footer */}
        <div className="card" style={{ padding:"24px" }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>PDF Footer Text</p>
          <p style={{ fontSize:12, color:"var(--muted)", marginBottom:14 }}>Appears at the bottom of every PDF page. Use line breaks to separate lines.</p>
          <textarea className="inp" value={form.footer} onChange={e=>set("footer",e.target.value)} style={{ minHeight:90, fontFamily:"'DM Mono',monospace", fontSize:12 }} />
        </div>

        {/* Terms */}
        <div className="card" style={{ padding:"24px" }}>
          <p style={{ fontSize:13, fontWeight:700, marginBottom:6 }}>Terms & Conditions Template</p>
          <p style={{ fontSize:12, color:"var(--muted)", marginBottom:14 }}>This text appears on page 2 of every invoice PDF.</p>
          <textarea className="inp" value={form.terms} onChange={e=>set("terms",e.target.value)} style={{ minHeight:320, fontFamily:"'DM Mono',monospace", fontSize:12 }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════════════ */
function AdminLayout({ logout, store, update, settings, setSettings }) {
  const navigate = useNavigate();

  const saveInvoice = useCallback((inv) => {
    update(prev => {
      const exists = prev.invoices.find(i=>i.id===inv.id);
      if (exists) {
        return { ...prev, invoices: prev.invoices.map(i=>i.id===inv.id?{...inv,updatedAt:new Date().toISOString()}:i) };
      }
      const num = genInvoiceNum(settings, prev.nextInvoiceNum);
      return { ...prev, nextInvoiceNum: prev.nextInvoiceNum+1, invoices:[...prev.invoices, { ...inv, id:genId(), number:num, createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() }] };
    });
  }, [update, settings]);

  const deleteInvoice = useCallback((id) => {
    update(prev => ({ ...prev, invoices:prev.invoices.filter(i=>i.id!==id), payments:prev.payments.filter(p=>p.invoiceId!==id) }));
  }, [update]);

  const changeStatus = useCallback((id, status) => {
    update(prev => ({ ...prev, invoices:prev.invoices.map(i=>i.id===id?{...i,status,updatedAt:new Date().toISOString()}:i) }));
  }, [update]);

  const addPayment = useCallback((payment) => {
    update(prev => ({ ...prev, payments:[...prev.payments, payment] }));
  }, [update]);

  const saveClient = useCallback((client) => {
    update(prev => {
      const exists = prev.clients.find(c=>c.id===client.id);
      return { ...prev, clients: exists ? prev.clients.map(c=>c.id===client.id?client:c) : [...prev.clients, client] };
    });
  }, [update]);

  const deleteClient = useCallback((id) => {
    update(prev => ({ ...prev, clients:prev.clients.filter(c=>c.id!==id) }));
  }, [update]);

  const { pathname } = useLocation();
  const { id, action } = useParams();

  const getEditInvoice = () => {
    if (pathname.includes("/edit") && id) return store.invoices.find(i=>i.id===id);
    return null;
  };

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar logout={logout} />
      <main style={{ flex:1, overflow:"auto", background:"var(--bg)" }}>
        <Routes>
          <Route path="/" element={<Dashboard store={store} settings={settings} />} />
          <Route path="/create" element={<InvoiceForm store={store} settings={settings} onSave={saveInvoice} editInvoice={null} />} />
          <Route path="/invoices" element={<InvoiceList store={store} settings={settings} onDelete={deleteInvoice} onStatusChange={changeStatus} />} />
          <Route path="/invoices/:id" element={<InvoiceDetail store={store} settings={settings} onStatusChange={changeStatus} onPaymentAdd={addPayment} update={update} />} />
          <Route path="/invoices/:id/edit" element={<InvoiceForm store={store} settings={settings} onSave={saveInvoice} editInvoice={getEditInvoice()} />} />
          <Route path="/clients" element={<ClientsPage store={store} onSave={saveClient} onDelete={deleteClient} />} />
          <Route path="/accounts" element={<AccountsPage settings={settings} onSave={setSettings} />} />
          <Route path="/settings" element={<SettingsPage settings={settings} onSave={setSettings} />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const { ok, login, logout } = useAuth();
  const { store, update } = useStore();
  const [settings, setSettingsState] = useState(() => loadSettings());

  const setSettings = useCallback((s) => { saveSettings(s); setSettingsState(s); }, []);

  // Auto-load letterhead as watermark on first run
  useEffect(() => {
    if (!settings.watermarkDataUrl) {
      fetch("/letterhead.png")
        .then(r => r.ok ? r.blob() : null)
        .then(blob => {
          if (!blob) return;
          const reader = new FileReader();
          reader.onload = e => setSettings({ ...settings, watermarkDataUrl: e.target.result });
          reader.readAsDataURL(blob);
        })
        .catch(() => {});
    }
  }, []);

  if (!ok) return <><Styles /><Login login={login} /></>;

  return (
    <BrowserRouter>
      <Styles />
      <AdminLayout logout={logout} store={store} update={update} settings={settings} setSettings={setSettings} />
    </BrowserRouter>
  );
}
