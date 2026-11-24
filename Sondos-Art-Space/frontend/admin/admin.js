// =============================================
// admin.js — Sondos Admin Panel
// =============================================

const API = 'http://localhost:8080/Sondos-Art-Space/backend/api';
let allMessages  = [];
let allPortfolio = [];
let theme = localStorage.getItem('admin-theme') || 'light';

// ── Auth Guard ────────────────────────────────
(function(){
  if(!localStorage.getItem('admin-token')){
    window.location.href = 'login.html';
  }
  const user = JSON.parse(localStorage.getItem('admin-user') || '{}');
  if(user.username) document.getElementById('admin-name').textContent = user.username;
})();

// ── Theme ─────────────────────────────────────
document.documentElement.setAttribute('data-theme', theme);
function toggleTheme(){
  theme = theme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('admin-theme', theme);
}

// ── Sidebar ───────────────────────────────────
function toggleSidebar(){
  document.getElementById('sidebar').classList.toggle('open');
}
function logout(){
  if(confirm('هل تريد تسجيل الخروج؟')){
    localStorage.removeItem('admin-token');
    localStorage.removeItem('admin-user');
    window.location.href = 'login.html';
  }
}

// ── Page Navigation ───────────────────────────
const PAGE_TITLES = {
  overview:'نظرة عامة', portfolio:'الأعمال',
  services:'الخدمات', messages:'الرسائل', settings:'الإعدادات'
};
function showPage(name, el){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('page-'+name).classList.add('active');
  if(el) el.classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[name] || name;
  if(name==='messages') loadMessages();
  if(name==='portfolio') loadPortfolio();
  if(name==='services')  loadServices();
  if(name==='settings')  loadSettings();
}

// ── API Helper ────────────────────────────────
async function apiFetch(endpoint, opts={}){
  try{
    const token = localStorage.getItem('admin-token') || '';
    const res = await fetch(`${API}/${endpoint}`, {
      ...opts,
      headers:{
        'Content-Type':'application/json',
        'Authorization': `Bearer ${token}`,
        ...(opts.headers||{})
      }
    });
    return await res.json();
  } catch { return null; }
}



// ── Init / Overview ───────────────────────────
window.addEventListener('DOMContentLoaded', ()=>{
  loadOverview();
  loadPortfolio();
});

async function loadOverview(){
  // Portfolio count
  const pData = await apiFetch('portfolio');
  const pCount = pData?.data?.length ?? demoPortfolio().length;
  document.getElementById('stat-portfolio').textContent = pCount;
  document.getElementById('badge-portfolio').textContent = pCount;

  // Messages count
  const mData = await apiFetch('messages');
  const messages = mData?.data ?? demoMessages();
  const unread = messages.filter(m=>!m.is_read||m.is_read==='0'||m.is_read===0).length;
  document.getElementById('stat-messages').textContent = unread;
  if(unread > 0){
    document.getElementById('badge-messages').textContent = unread;
    document.getElementById('badge-messages').classList.add('pink');
  }

  // Services count
  const sData = await apiFetch('services');
  document.getElementById('stat-services').textContent = sData?.data?.length ?? 4;

  // Recent
  renderRecentMessages(messages.slice(0,4));
  renderRecentPortfolio((pData?.data ?? demoPortfolio()).slice(0,4));
}

// ── Messages ──────────────────────────────────
async function loadMessages(){
  const data = await apiFetch('messages');
  allMessages = data?.data ?? demoMessages();
  renderMessages(allMessages);
}

function renderMessages(list){
  const el = document.getElementById('messages-table');
  if(!list.length){ el.innerHTML='<div style="padding:24px;text-align:center;color:var(--hint);">لا توجد رسائل</div>'; return; }
  el.innerHTML = `
    <div class="table-row table-head message-row">
      <span>المرسل</span><span>الموضوع</span><span>الخدمة</span><span>التاريخ</span><span>إجراء</span>
    </div>` +
    list.map(m=>`
    <div class="table-row message-row">
      <div>
        <div style="font-weight:700;font-size:13px;">${m.name}</div>
        <div style="font-size:11px;color:var(--hint);">${m.email}</div>
      </div>
      <div style="color:var(--sec);font-size:13px;">${m.subject||'—'}</div>
      <div>${m.service_interest ? `<span class="badge badge-active">${m.service_interest}</span>` : '—'}</div>
      <div style="font-size:12px;color:var(--hint);">${formatDate(m.created_at)}</div>
      <div class="row-actions">
        <span class="badge ${(m.is_read==1||m.is_read===true)?'badge-read':'badge-new'}">${(m.is_read==1)?'مقروءة':'جديد'}</span>
        <button class="icon-btn" onclick="viewMessage(${m.id})" title="عرض">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button class="icon-btn del" onclick="deleteMessage(${m.id})" title="حذف">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>`).join('');
}

function renderRecentMessages(list){
  const el = document.getElementById('recent-messages');
  el.innerHTML = list.map(m=>`
    <div class="table-row" style="grid-template-columns:1fr 120px 90px 80px;">
      <div><div style="font-weight:700;font-size:13px;">${m.name}</div>
        <div style="font-size:11px;color:var(--hint);">${m.email}</div></div>
      <div style="font-size:12px;color:var(--sec);">${m.service_interest||'—'}</div>
      <div><span class="badge ${m.is_read==1?'badge-read':'badge-new'}">${m.is_read==1?'مقروءة':'جديد'}</span></div>
      <div style="font-size:11px;color:var(--hint);">${formatDate(m.created_at)}</div>
    </div>`).join('') || '<div style="padding:20px;text-align:center;color:var(--hint)">لا توجد رسائل</div>';
}

function filterMessages(type, btn){
  document.querySelectorAll('.ftab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const filtered = type==='unread' ? allMessages.filter(m=>!m.is_read||m.is_read==0) : allMessages;
  renderMessages(filtered);
}

async function viewMessage(id){
  const m = allMessages.find(x=>x.id==id) || demoMessages().find(x=>x.id==id);
  if(!m) return;
  document.getElementById('message-detail-content').innerHTML = `
    <div class="msg-detail">
      <div class="msg-field"><label>الاسم</label><p>${m.name}</p></div>
      <div class="msg-field"><label>البريد</label><p>${m.email}</p></div>
      ${m.phone ? `<div class="msg-field"><label>الهاتف</label><p>${m.phone}</p></div>` : ''}
      ${m.service_interest ? `<div class="msg-field"><label>الخدمة</label><p>${m.service_interest}</p></div>` : ''}
      <div class="msg-field"><label>الرسالة</label><p class="msg-body">${m.message||'—'}</p></div>
      <div class="msg-field"><label>التاريخ</label><p>${formatDate(m.created_at)}</p></div>
    </div>`;
  openModal('message-detail');
  if(!m.is_read || m.is_read==0){
    await apiFetch(`messages/${id}`, {method:'PUT'});
    const idx = allMessages.findIndex(x=>x.id==id);
    if(idx !== -1) allMessages[idx].is_read = 1;
    renderMessages(allMessages);
    const unread = allMessages.filter(m=>!m.is_read||m.is_read==0).length;
    const badge = document.getElementById('badge-messages');
    badge.textContent = unread;
    if(unread > 0){ badge.classList.add('pink'); } else { badge.classList.remove('pink'); }
    document.getElementById('stat-messages').textContent = unread;
  }
}

async function deleteMessage(id){
  if(!confirm('هل تريد حذف هذه الرسالة؟')) return;
  await apiFetch(`messages/${id}`, {method:'DELETE'});
  allMessages = allMessages.filter(m=>m.id!=id);
  renderMessages(allMessages);
  const unread = allMessages.filter(m=>!m.is_read||m.is_read==0).length;
  document.getElementById('badge-messages').textContent = unread;
  document.getElementById('stat-messages').textContent = unread;
}

// ── Portfolio ─────────────────────────────────
async function loadPortfolio(){
  const data = await apiFetch('portfolio');
  allPortfolio = data?.data ?? demoPortfolio();
  renderPortfolio(allPortfolio);
}

function renderPortfolio(list){
  const el = document.getElementById('portfolio-table');
  if(!list||!list.length){ el.innerHTML='<div style="padding:24px;text-align:center;color:var(--hint);">لا توجد أعمال</div>'; return; }
  el.innerHTML = `
    <div class="table-row table-head portfolio-row">
      <span>العنوان</span><span>الكاتيقوري</span><span>السنة</span><span>مميّز</span><span>إجراء</span>
    </div>` +
    list.map(p=>`
    <div class="table-row portfolio-row">
      <div style="display:flex;align-items:center;gap:10px;">
        ${p.image
          ? `<img src="${p.image}" alt="" style="width:42px;height:42px;object-fit:cover;border-radius:7px;border:1px solid var(--border);flex-shrink:0;"/>`
          : `<div style="width:42px;height:42px;border-radius:7px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--hint)" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>`
        }
        <div style="font-weight:700;font-size:13px;">${p.title}</div>
      </div>
      <div><span class="badge badge-active">${p.category||'—'}</span></div>
      <div style="font-size:13px;color:var(--sec);">${p.year||'—'}</div>
      <div>${p.is_featured==1?'<span class="badge badge-feat">مميّز</span>':'—'}</div>
      <div class="row-actions">
        <button class="icon-btn del" onclick="deletePortfolioItem(${p.id})" title="حذف">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
        </button>
      </div>
    </div>`).join('');
}

function renderRecentPortfolio(list){
  const el = document.getElementById('recent-portfolio');
  el.innerHTML = list.map(p=>`
    <div class="table-row" style="grid-template-columns:1fr 140px 80px;">
      <div style="font-weight:700;font-size:13px;">${p.title}</div>
      <div><span class="badge badge-active">${p.category||'—'}</span></div>
      <div style="font-size:12px;color:var(--hint);">${p.year||''}</div>
    </div>`).join('');
}

function searchPortfolio(q){
  const filtered = allPortfolio.filter(p=>
    p.title.toLowerCase().includes(q.toLowerCase()) ||
    (p.category||'').toLowerCase().includes(q.toLowerCase())
  );
  renderPortfolio(filtered);
}

async function deletePortfolioItem(id){
  if(!confirm('هل تريد حذف هذا العمل؟')) return;
  await apiFetch(`portfolio/${id}`, {method:'DELETE'});
  allPortfolio = allPortfolio.filter(p=>p.id!=id);
  renderPortfolio(allPortfolio);
  document.getElementById('stat-portfolio').textContent = allPortfolio.length;
}

// Add portfolio form
document.getElementById('add-portfolio-form').addEventListener('submit', async function(e){
  e.preventDefault();
  const fb = document.getElementById('portfolio-form-feedback');
  fb.className='feedback-msg'; fb.textContent='';

  const body = {
    title:       document.getElementById('p-title').value.trim(),
    title_ar:    document.getElementById('p-title-ar').value.trim(),
    category:    document.getElementById('p-cat').value,
    client_name: document.getElementById('p-client').value.trim(),
    year:        document.getElementById('p-year').value,
    is_featured: document.getElementById('p-featured').value,
    description: document.getElementById('p-desc').value.trim(),
    images:      pendingImages.map(i => i.src),   // ← مصفوفة الصور
  };
  if(!body.title){ fb.textContent='العنوان مطلوب'; fb.className='feedback-msg error'; return; }

  fb.textContent='⏳ جاري الحفظ...'; fb.className='feedback-msg';
  const res = await apiFetch('portfolio', {method:'POST', body:JSON.stringify(body)});
  if(res?.success){
    fb.textContent='تم إضافة العمل بنجاح ✓'; fb.className='feedback-msg success';
    this.reset();
    clearImages();
    await loadPortfolio();
    setTimeout(()=>closeModal('add-portfolio'),1200);
  } else {
    fb.textContent = res?.message||'حدث خطأ — تأكد من تشغيل الباك-إند وإعداد الداتا بيز'; fb.className='feedback-msg error';
  }
});

// ── Image Preview (متعدد) ────────────────────
let pendingImages = []; // { src, label }

function previewImage(input) {
    const files = Array.from(input.files);
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = e => addImagePreview(e.target.result, file.name);
        reader.readAsDataURL(file);
    });
    input.value = ''; // reset لرفع نفس الملف مرة ثانية
}
function previewUrl(url) {
    if (!url.trim()) return;
    addImagePreview(url.trim(), url.trim().split('/').pop() || 'صورة');
    document.getElementById('p-image-url').value = '';
}
function addImagePreview(src, label) {
    pendingImages.push({ src, label });
    renderImagePreviews();
}
function removeImage(idx) {
    pendingImages.splice(idx, 1);
    renderImagePreviews();
}
function renderImagePreviews() {
    const container = document.getElementById('p-images-preview');
    if (!pendingImages.length) {
        container.innerHTML = '';
        return;
    }
    container.innerHTML = pendingImages.map((img, i) => `
      <div style="position:relative;display:inline-block;margin:4px;">
        <img src="${img.src}" alt="" style="width:100px;height:100px;object-fit:cover;
          border-radius:8px;border:1px solid var(--border);display:block;"/>
        ${i === 0 ? '<div style="position:absolute;bottom:4px;right:4px;background:var(--pink);color:#fff;font-size:9px;padding:1px 5px;border-radius:4px;font-weight:700;">غلاف</div>' : ''}
        <button type="button" onclick="removeImage(${i})" style="
          position:absolute;top:-6px;left:-6px;width:20px;height:20px;
          border-radius:50%;background:var(--red);color:#fff;border:none;
          cursor:pointer;font-size:11px;line-height:1;font-weight:700;">✕</button>
      </div>`).join('');
}
function clearImages() {
    pendingImages = [];
    renderImagePreviews();
}


async function loadServices(){
  const data = await apiFetch('services');
  const list = data?.data ?? demoServices();
  const el = document.getElementById('services-table');
  el.innerHTML = `
    <div class="table-row table-head service-row">
      <span>#</span><span>الخدمة</span><span>الوصف</span><span>الحالة</span>
    </div>` +
    list.map((s,i)=>`
    <div class="table-row service-row">
      <div style="font-weight:900;color:var(--pink);font-size:16px;">0${i+1}</div>
      <div style="font-weight:700;font-size:14px;">${s.title}</div>
      <div style="font-size:13px;color:var(--sec);">${s.description||''}</div>
      <div><span class="badge badge-active">نشطة</span></div>
    </div>`).join('');
}

// ── Settings ──────────────────────────────────
async function loadSettings(){
  const data = await apiFetch('settings');
  const s = data?.data || {};
  const set = (id, key) => { const el=document.getElementById(id); if(el&&s[key]) el.value=s[key]; };
  set('s-owner','owner_name'); set('s-email','email');
  set('s-instagram','instagram'); set('s-twitter','twitter');
  set('s-linkedin','linkedin'); set('s-behance','behance');
  set('s-about','about_text');
}

document.getElementById('settings-form').addEventListener('submit', async function(e){
  e.preventDefault();
  const fb = document.getElementById('settings-feedback');
  // Demo: just show success
  fb.textContent='تم حفظ الإعدادات بنجاح ✓'; fb.className='feedback-msg success';
  setTimeout(()=>{ fb.className='feedback-msg'; }, 3000);
});

document.getElementById('password-form').addEventListener('submit', async function(e){
  e.preventDefault();
  const fb = document.getElementById('password-feedback');
  const np = document.getElementById('p-new').value;
  const cp = document.getElementById('p-confirm').value;
  if(np !== cp){ fb.textContent='كلمتا المرور غير متطابقتين'; fb.className='feedback-msg error'; return; }
  if(np.length < 6){ fb.textContent='كلمة المرور يجب أن تكون 6 أحرف على الأقل'; fb.className='feedback-msg error'; return; }
  fb.textContent='تم تغيير كلمة المرور بنجاح ✓'; fb.className='feedback-msg success';
  this.reset();
  setTimeout(()=>{ fb.className='feedback-msg'; }, 3000);
});

// ── Modals ────────────────────────────────────
function openModal(name){ document.getElementById('modal-'+name).classList.add('open'); }
function closeModal(name){ document.getElementById('modal-'+name).classList.remove('open'); }
function closeModalOut(e){ if(e.target.classList.contains('modal-overlay')) e.target.classList.remove('open'); }

// ── Utils ─────────────────────────────────────
function formatDate(d){
  if(!d) return '—';
  try{ return new Date(d).toLocaleDateString('ar-EG',{year:'numeric',month:'short',day:'numeric'}); }
  catch{ return d; }
}

// ── Demo Data (fallback when no backend) ──────
function demoMessages(){
  return [
    {id:1,name:'أحمد محمد',email:'ahmed@example.com',subject:'طلب تصميم لوجو',service_interest:'Logo Design',message:'أريد تصميم لوجو لمشروعي الجديد في مجال التقنية',is_read:0,created_at:'2025-04-01'},
    {id:2,name:'Sara Ali',email:'sara@example.com',subject:'هوية بصرية',service_interest:'Visual Identity',message:'I need a complete brand identity for my bakery.',is_read:0,created_at:'2025-04-02'},
    {id:3,name:'محمود عبدالله',email:'mahmoud@example.com',subject:'استفسار',service_interest:'',message:'أرجو إخباري بالأسعار والمدة الزمنية',is_read:1,created_at:'2025-03-28'},
    {id:4,name:'Lina Hassan',email:'lina@example.com',subject:'Packaging Design',service_interest:'Product Packaging',message:'Looking for product packaging for a cosmetics line.',is_read:1,created_at:'2025-03-20'},
  ];
}
function demoPortfolio(){
  return [
    {id:1,title:'Brand Identity — TechStart',title_ar:'هوية بصرية — تك ستارت',category:'Brand Identity',client_name:'TechStart',year:2024,is_featured:1},
    {id:2,title:'Logo Design — Bloom Bakery',title_ar:'لوجو — بلوم بيكري',category:'Logo Design',client_name:'Bloom Bakery',year:2024,is_featured:1},
    {id:3,title:'Packaging — Glow Cosmetics',title_ar:'تغليف — جلو كوزمتكس',category:'Packaging',client_name:'Glow Co.',year:2025,is_featured:0},
    {id:4,title:'Visual System — Mova Agency',title_ar:'نظام بصري — موڤا',category:'Visual System',client_name:'Mova',year:2025,is_featured:1},
  ];
}
function demoServices(){
  return [
    {title:'Logo Design',description:'Distinctive logos that capture your brand\'s essence.'},
    {title:'Visual Identity',description:'Complete brand systems — colors, typography, guidelines.'},
    {title:'Product Packaging',description:'Packaging design that stands out on shelves.'},
    {title:'Brand Strategy',description:'Creative direction to build brands that resonate.'},
  ];
}