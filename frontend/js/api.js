// Shared API + helpers for CPMS
const API = {
  async req(method, url, body=null) {
    const opts = { method, headers:{'Content-Type':'application/json'}, credentials:'include' };
    if (body) opts.body = JSON.stringify(body);
    const res  = await fetch(url, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    return data;
  },
  get:    url      => API.req('GET',    url),
  post:   (url,b)  => API.req('POST',   url, b),
  put:    (url,b)  => API.req('PUT',    url, b),
  delete: url      => API.req('DELETE', url),
};

function toast(msg, type='info') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id='toast-container'; document.body.appendChild(c); }
  const icons = {success:'✅',error:'❌',info:'ℹ️',warning:'⚠️'};
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icons[type]||'ℹ️'}</span><span>${msg}</span>`;
  c.appendChild(t);
  setTimeout(()=>{ t.style.animation='toastSlideOut .3s ease forwards'; setTimeout(()=>t.remove(),300); }, 3500);
}

function openModal(id)  { const m=document.getElementById(id); if(m){m.classList.add('open');    document.body.style.overflow='hidden';} }
function closeModal(id) { const m=document.getElementById(id); if(m){m.classList.remove('open'); document.body.style.overflow='';} }
function fmtLPA(v)  { if(!v&&v!==0)return'—'; return `₹${parseFloat(v).toFixed(2)} LPA`; }
function fmtDate(d) { if(!d)return'—'; return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function confirmAction(msg) { return window.confirm(msg); }

function statusBadge(s) {
  const map={Applied:'badge-blue',Shortlisted:'badge-orange',Selected:'badge-green',Rejected:'badge-red',
             Open:'badge-green',Closed:'badge-gray',Completed:'badge-purple',Cancelled:'badge-red',
             Pending:'badge-orange',Approved:'badge-green'};
  return `<span class="badge ${map[s]||'badge-gray'}">${s}</span>`;
}

async function requireRole(role) {
  try {
    const d = await API.get('/api/auth/me');
    if (!d.loggedIn) { window.location.href=`/${role}/login`; return null; }
    if (d.role !== role) { window.location.href='/'; return null; }
    const el = document.getElementById('user-name');
    if (el) el.textContent = d.name;
    return d;
  } catch { window.location.href='/'; return null; }
}

async function logout() {
  await API.post('/api/auth/logout').catch(()=>{});
  window.location.href='/';
}

function renderNav(role, active) {
  const navs = {
    admin: [
      {href:'/admin/dashboard', icon:'📊', label:'Dashboard', id:'overview'},
      {icon:'👨‍🎓', label:'Students', id:'students'},
      {icon:'📅', label:'Drives', id:'drives'},
      {icon:'🏢', label:'Openings', id:'openings'},
      {icon:'📝', label:'Applications', id:'applications'},
      {icon:'🏆', label:'Results', id:'results'},
    ],
    student: [
      {icon:'🏠', label:'Home', id:'home'},
      {icon:'🔍', label:'Browse Drives', id:'browse'},
      {icon:'📋', label:'My Applications', id:'myapps'},
      {icon:'👤', label:'My Profile', id:'profile'},
    ],
    company: [
      {icon:'🏠', label:'Home', id:'home'},
      {icon:'📅', label:'Post Opening', id:'post'},
      {icon:'📤', label:'My Openings', id:'openings'},
      {icon:'📋', label:'Applications', id:'apps'},
      {icon:'👤', label:'Profile', id:'profile'},
    ]
  };
  const colors = {admin:'var(--accent)',student:'var(--success)',company:'var(--orange)'};
  return navs[role].map(n=>{
    const act = n.id===active ? 'active' : '';
    const fn = n.href ? `href="${n.href}"` : `href="javascript:void(0)" onclick="showTab('${n.id}')"`;
    return `<a ${fn} class="nav-item ${act}"><span class="icon">${n.icon}</span><span>${n.label}</span></a>`;
  }).join('');
}

window.API=API; window.toast=toast; window.openModal=openModal; window.closeModal=closeModal;
window.fmtLPA=fmtLPA; window.fmtDate=fmtDate; window.confirmAction=confirmAction;
window.statusBadge=statusBadge; window.requireRole=requireRole; window.logout=logout;
window.renderNav=renderNav;
