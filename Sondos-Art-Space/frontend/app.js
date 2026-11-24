// =============================================
// app.js — Sondos Art Space v2
// Dark Mode · Bilingual (EN/AR) · API
// =============================================

const API_BASE = 'http://localhost:8080/Sondos-Art-Space/backend/api';

let currentLang  = localStorage.getItem('lang')  || 'en';
let currentTheme = localStorage.getItem('theme') || 'light';
let allPortfolio = [];
let currentPortfolioFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(currentTheme, false);
  applyLang(currentLang, false);
  initLoader();
  initNavScroll();
  initNavLinks();
  initContactForm();
  loadAll();
});

function initLoader() {
  setTimeout(() => {
    document.getElementById('loader').classList.add('gone');
    document.body.style.overflow = 'auto';
  }, 2000);

  document.body.style.overflow = 'hidden';
}

function initNavScroll() {
  const nav = document.getElementById('navbar');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
  });
}

function initNavLinks() {
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => {
      document.getElementById('nav-links').classList.remove('open');
      document.getElementById('burger').classList.remove('open');
    });
  });
}

function toggleMenu() {
  document.getElementById('nav-links').classList.toggle('open');
  document.getElementById('burger').classList.toggle('open');
}

function smoothTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function toggleTheme() {
  applyTheme(currentTheme === 'light' ? 'dark' : 'light');
}

function applyTheme(theme, save = true) {
  currentTheme = theme;
  document.documentElement.setAttribute('data-theme', theme);

  if (save) {
    localStorage.setItem('theme', theme);
  }
}

function toggleLang() {
  applyLang(currentLang === 'en' ? 'ar' : 'en');
}

function applyLang(lang, save = true) {
  currentLang = lang;

  const html = document.documentElement;

  html.setAttribute('data-lang', lang);
  html.setAttribute('lang', lang);
  html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

  if (save) {
    localStorage.setItem('lang', lang);
  }

  translateAll();
  updatePlaceholders();
}

function translateAll() {
  document.querySelectorAll('[data-en]').forEach(el => {
    const txt = el.getAttribute(`data-${currentLang}`);

    if (txt) {
      el.textContent = txt;
    }
  });

  document.querySelectorAll('select option[data-en]').forEach(opt => {
    const txt = opt.getAttribute(`data-${currentLang}`);

    if (txt) {
      opt.textContent = txt;
    }
  });

  if (allPortfolio.length) {
    const filtered = currentPortfolioFilter === 'all'
      ? allPortfolio
      : allPortfolio.filter(p => p.category === currentPortfolioFilter);

    renderPortfolio(filtered);
  }
}

function updatePlaceholders() {
  document.querySelectorAll('[data-placeholder-en]').forEach(el => {
    el.placeholder = el.getAttribute(`data-placeholder-${currentLang}`) || '';
  });
}

async function apiFetch(endpoint) {
  try {
    const res = await fetch(`${API_BASE}/${endpoint}`);
    const json = await res.json();

    return json.success ? json.data : null;
  } catch {
    return null;
  }
}

async function loadAll() {
  await Promise.all([
    loadStats(),
    loadServices(),
    loadPortfolio(),
    loadSettings()
  ]);
}

async function loadStats() {
  const data = await apiFetch('stats');
  const container = document.getElementById('stats-inner');

  const fallback = [
    { value: '6+',   label_en: 'Years of Experience', label_ar: 'سنوات الخبرة' },
    { value: '30+',  label_en: 'Projects Delivered',  label_ar: 'مشروع منجز' },
    { value: '100%', label_en: 'Client Satisfaction', label_ar: 'رضا العملاء' },
    { value: '20+',  label_en: 'Happy Clients',       label_ar: 'عميل سعيد' }
  ];

  const items = data || fallback;

  container.innerHTML = items.map(s => `
    <div class="stat-item">
      <span class="stat-num">${s.value}</span>
      <div class="stat-label" data-en="${s.label_en || s.label}" data-ar="${s.label_ar || s.label}">
        ${currentLang === 'ar' && s.label_ar ? s.label_ar : (s.label_en || s.label)}
      </div>
    </div>
  `).join('');
}

const SERVICE_ICONS = {
  logo:      { en: 'Logo Design',         ar: 'تصميم لوجو' },
  identity:  { en: 'Visual Identity',     ar: 'هوية بصرية' },
  packaging: { en: 'Product Packaging',   ar: 'تغليف منتجات' },
  strategy:  { en: 'Brand Strategy',      ar: 'استراتيجية العلامة' },
  social:    { en: 'Social Media Design', ar: 'تصميم سوشال ميديا' },
  drawing:   { en: 'Digital Drawing',     ar: 'رسم ديجيتال' }
};

const SERVICE_DESCS_AR = [
  'لوجوهات مميزة تعكس جوهر علامتك التجارية وتترك انطباعًا لا يُنسى.',
  'أنظمة هوية بصرية كاملة — ألوان وخطوط وإرشادات لتناسق تام.',
  'تصميم تغليف يبرز على الرفوف ويحكي قصة منتجك بأسلوب فريد.',
  'توجيه إبداعي واستراتيجي لبناء علامات تجارية تلامس الوجدان.',
  'تصاميم سوشال ميديا احترافية تجذب الجمهور وتعزز حضورك الرقمي.',
  'رسوم ديجيتال إبداعية بأسلوب فريد يعكس هويتك البصرية.'
];

async function loadServices() {
  const data = await apiFetch('services');
  const grid = document.getElementById('services-grid');

  const fallback = [
    { title: 'Logo Design',         description: 'Distinctive logos that capture your brand\'s essence.', icon: 'logo' },
    { title: 'Visual Identity',     description: 'Complete brand systems with colors, type, and guidelines.', icon: 'identity' },
    { title: 'Product Packaging',   description: 'Packaging design that stands out and tells your story.', icon: 'packaging' },
    { title: 'Brand Strategy',      description: 'Creative direction to build brands that truly resonate.', icon: 'strategy' },
    { title: 'Social Media Design', description: 'Professional designs that grow your digital presence.', icon: 'social' },
    { title: 'Digital Drawing',     description: 'Creative digital drawing with a unique style.', icon: 'drawing' }
  ];

  const items = data || fallback;

  grid.innerHTML = items.map((s, i) => {
    const ar = SERVICE_ICONS[s.icon] || {};

    return `
      <div class="service-card reveal">
        <div class="svc-num">0${i + 1}</div>
        <div class="svc-title" data-en="${s.title}" data-ar="${ar.ar || s.title}">
          ${currentLang === 'ar' && ar.ar ? ar.ar : s.title}
        </div>
        <p class="svc-desc" data-en="${s.description}" data-ar="${SERVICE_DESCS_AR[i] || s.description}">
          ${currentLang === 'ar' ? (SERVICE_DESCS_AR[i] || s.description) : s.description}
        </p>
      </div>
    `;
  }).join('');

  initReveal();
}

const P_CLASSES = ['pc-1', 'pc-2', 'pc-3', 'pc-4'];

async function loadPortfolio() {
  const data = await apiFetch('portfolio');
  const filterBar = document.getElementById('portfolio-filters');

  const fallback = [
    { title: 'Brand Identity',      title_ar: 'هوية بصرية',       category: 'Brand Identity',      client_name: 'Client A', year: 2024 },
    { title: 'Product Packaging',   title_ar: 'تغليف منتج',       category: 'Packaging',           client_name: 'Client B', year: 2024 },
    { title: 'Logo Design',         title_ar: 'تصميم لوجو',       category: 'Logo Design',         client_name: 'Client C', year: 2025 },
    { title: 'Visual System',       title_ar: 'نظام بصري',        category: 'Visual System',       client_name: 'Client D', year: 2025 },
    { title: 'Social Media Design', title_ar: 'حملة سوشال ميديا', category: 'Social Media Design', client_name: 'Client E', year: 2025 },
    { title: 'Digital Drawing',     title_ar: 'رسم ديجيتال',      category: 'Digital Drawing',     client_name: 'Client F', year: 2025 }
  ];

  allPortfolio = data || fallback;

  const cats = ['All', ...new Set(allPortfolio.map(p => p.category).filter(Boolean))];

  filterBar.innerHTML = cats.map((c, i) => `
    <button class="filter-btn ${i === 0 ? 'active' : ''}"
      data-cat="${c === 'All' ? 'all' : c}"
      data-en="${c}"
      data-ar="${translateCat(c)}"
      onclick="filterPortfolio('${c === 'All' ? 'all' : c}', this)">
      ${currentLang === 'ar' ? translateCat(c) : c}
    </button>
  `).join('');

  renderPortfolio(allPortfolio);
}

function translateCat(cat) {
  const map = {
    All: 'الكل',
    'Brand Identity': 'هوية بصرية',
    Packaging: 'تغليف',
    'Logo Design': 'لوجو',
    'Visual System': 'نظام بصري',
    'Social Media Design': 'سوشال ميديا',
    'Digital Drawing': 'رسم ديجيتال'
  };

  return map[cat] || cat;
}

function renderPortfolio(items) {
  const grid = document.getElementById('portfolio-grid');

  grid.innerHTML = items.map((p, i) => {
    const title   = currentLang === 'ar' && p.title_ar ? p.title_ar : p.title;
    const catAr   = translateCat(p.category || 'Design');
    const cat     = currentLang === 'ar' ? catAr : (p.category || 'Design');
    const meta    = [p.client_name, p.year].filter(Boolean).join(' · ');
    const descRaw = p.description || '';
    const desc    = descRaw.length > 90 ? descRaw.substring(0, 90) + '...' : descRaw;

    return `
    <div class="portfolio-card ${P_CLASSES[i % P_CLASSES.length]} reveal">

      <!-- المحتوى الأساسي (يختفي عند hover) -->
      <div class="p-content">
        <div class="p-cat">${cat}</div>
        <div class="p-title">${title}</div>
        ${meta ? `<div class="p-meta">${meta}</div>` : ''}
      </div>

      <!-- تفاصيل الـ Hover -->
      <div class="p-hover-detail">
        <div class="ph-cat">${cat}</div>
        <div class="ph-title">${title}</div>
        ${meta ? `<div class="ph-meta">${meta}</div>` : ''}
        ${desc ? `<div class="ph-meta" style="font-size:11px;line-height:1.6;max-width:220px;">${desc}</div>` : ''}
        <div class="ph-arrow">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"/>
            <polyline points="12 5 19 12 12 19"/>
          </svg>
        </div>
      </div>

    </div>`;
  }).join('');

  initReveal();
}

function filterPortfolio(cat, btn) {
  currentPortfolioFilter = cat;

  document.querySelectorAll('.filter-btn').forEach(b => {
    b.classList.remove('active');
  });

  btn.classList.add('active');

  const filtered = cat === 'all'
    ? allPortfolio
    : allPortfolio.filter(p => p.category === cat);

  renderPortfolio(filtered);
}

async function loadSettings() {
  const data = await apiFetch('settings');

  if (!data) return;

  if (data.about_text) {
    const el = document.getElementById('about-body');

    if (el) {
      el.textContent = data.about_text;
    }
  }

  const social = [
    {
      key: 'instagram',
      label_en: 'Instagram',
      label_ar: 'إنستغرام',
      url: v => `https://instagram.com/${v.replace('@', '')}`
    },
    {
      key: 'twitter',
      label_en: 'X (Twitter)',
      label_ar: 'إكس تويتر',
      url: v => `https://twitter.com/${v.replace('@', '')}`
    },
    {
      key: 'linkedin',
      label_en: 'LinkedIn',
      label_ar: 'لينكدإن',
      url: v => `https://linkedin.com/in/${v}`
    },
    {
      key: 'behance',
      label_en: 'Behance',
      label_ar: 'بيهانس',
      url: v => `https://behance.net/${v}`
    }
  ];

  const socEl = document.getElementById('about-socials');
  const conEl = document.getElementById('contact-links');

  let sHTML = '';
  let cHTML = '';

  social.forEach(s => {
    if (!data[s.key]) return;

    const url = s.url(data[s.key]);
    const label = currentLang === 'ar' ? s.label_ar : s.label_en;

    sHTML += `
      <a class="social-link" href="${url}" target="_blank" data-en="${s.label_en}" data-ar="${s.label_ar}">
        <span class="social-dot"></span>${label}
      </a>
    `;

    cHTML += `
      <a class="contact-link" href="${url}" target="_blank"
         data-en="${s.label_en}: ${data[s.key]}"
         data-ar="${s.label_ar}: ${data[s.key]}">
        <span class="social-dot"></span>${label}: ${data[s.key]}
      </a>
    `;
  });

  if (socEl) socEl.innerHTML = sHTML;
  if (conEl) conEl.innerHTML = cHTML;
}

function initContactForm() {
  const form = document.getElementById('contact-form');

  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = document.getElementById('submit-btn');
    const feedback = document.getElementById('form-feedback');
    const isAr = currentLang === 'ar';

    const payload = {
      name: document.getElementById('f-name').value.trim(),
      email: document.getElementById('f-email').value.trim(),
      phone: document.getElementById('f-phone').value.trim(),
      message: document.getElementById('f-message').value.trim(),
      service_interest: document.getElementById('f-service').value
    };

    if (!payload.name || !payload.email || !payload.message) {
      feedback.textContent = isAr
        ? 'يرجى تعبئة جميع الحقول المطلوبة.'
        : 'Please fill in all required fields.';

      feedback.className = 'error';
      return;
    }

    btn.disabled = true;
    btn.textContent = isAr ? 'جاري الإرسال...' : 'Sending...';
    feedback.className = '';
    feedback.textContent = '';
    feedback.removeAttribute('style'); // نحذف الـ inline style عشان CSS الكلاسات تشتغل

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();

      if (json.success) {
        feedback.textContent = isAr
          ? '✓ تم إرسال رسالتك! سأتواصل معك قريبًا.'
          : '✓ Message sent! I’ll get back to you soon.';

        feedback.className = 'success';
        this.reset();
      } else {
        feedback.textContent = json.message || (isAr ? 'حدث خطأ ما.' : 'Something went wrong.');
        feedback.className = 'error';
      }
    } catch {
      feedback.textContent = isAr
        ? 'خطأ في الشبكة، حاول مرة أخرى.'
        : 'Network error. Please try again.';

      feedback.className = 'error';
    } finally {
      btn.disabled = false;
      btn.textContent = isAr ? 'إرسال الرسالة' : 'Send Message';
    }
  });
}

function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(32px)';
    el.style.transition = `opacity .6s ${i * 0.1}s ease, transform .6s ${i * 0.1}s ease`;

    obs.observe(el);
  });
}