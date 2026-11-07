const $ = (sel, root = document) => root.querySelector(sel);

const SUPPORTED_LANGS = ['en', 'es'];

function tag(text, accent = false) {
  return `<span class="tag${accent ? ' accent' : ''}">${text}</span>`;
}
function tags(arr, accent = false) {
  return `<div class="tags">${arr.map(t => tag(t, accent)).join('')}</div>`;
}
function normalizeTags(value, accent = false) {
  if (Array.isArray(value)) return tags(value, accent);
  if (typeof value === 'string' && value.trim() !== '') return tags([value], accent);
  return '';
}
function projectCard(p) {
  const tagValue = p.tags ?? p.tag;

  // Normaliza a array de {url, label}
  const links = p.links
    ? p.links
    : (p.link ? [{ url: p.link, label: p.linkLabel || 'Repository' }] : []);

  const buttons = links
    .map(l => `<a href="${l.url}" class="btn" target="_blank" rel="noopener noreferrer">${l.label}</a>`)
    .join('');

  return `
    <article class="card project">
      <img alt="" src="${p.image}">
      <div class="card-body">
        ${normalizeTags(tagValue, true)}
        <h3>${p.title}</h3>
        <p>${p.description}</p>
        <div class="btn-row">${buttons}</div>
      </div>
    </article>`;
}
function expCard(e) {
  return `
    <article class="card exp">
      <img alt="" src="${e.image}">
      <div class="card-body">
        <span class="exp-where">${e.company}</span>
        <h3>${e.role}</h3>
        <p>${e.description}</p>
        <div class="exp-foot">
          ${normalizeTags(e.tags)}
          <a href="${e.link}" class="btn">${e.linkLabel || 'More'}</a>
        </div>
      </div>
    </article>`;
}

/** Carga (una sola vez) el script del idioma y resuelve cuando esté listo */
const langCache = {}; // <-- En lugar de Set

function loadLangScript(lang) {
  // Si ya tenemos los datos en caché, los asignamos y terminamos
  if (langCache[lang]) {
    window.SITE_DATA = langCache[lang];
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    delete window.SITE_DATA;
    const s = document.createElement('script');
    s.src = `./data/content.${lang}.js`;
    s.onload = () => {
      // Guardamos los datos en la caché antes de que otro script los sobrescriba
      langCache[lang] = window.SITE_DATA;
      resolve();
    };
    s.onerror = () => reject(new Error(`No se pudo cargar content.${lang}.js`));
    document.body.appendChild(s);
  });
}

async function render(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';

  try {
    await loadLangScript(lang);
  } catch (err) {
    console.error(err);
    return;
  }

  const d = window.SITE_DATA;
  if (!d) {
    console.error('SITE_DATA no encontrado');
    return;
  }

  // ----- UI / Navbar & Headings Translation -----
  if (d.ui) {
    // Navbar
    $('#nav-about').textContent = d.ui.nav.about;
    $('#nav-projects').textContent = d.ui.nav.projects;
    $('#nav-skills').textContent = d.ui.nav.skills;
    $('#nav-credentials').textContent = d.ui.nav.credentials;
    $('#nav-experience').textContent = d.ui.nav.experience;

    // Headings
    $('#ui-about-heading').textContent = d.ui.headings.aboutMe;
    $('#ui-technical-skills').textContent = d.ui.headings.technicalSkills;
    $('#ui-soft-skills').textContent = d.ui.headings.softSkills;
    $('#ui-bg-title').textContent = d.ui.headings.background;
    $('#ui-edu-title').textContent = d.ui.headings.education;
    $('#ui-tech-title').textContent = d.ui.headings.technicalDomain;
    $('#ui-projects-title').textContent = d.ui.headings.allProjects;
    $('#ui-exp-title').textContent = d.ui.headings.selectedExperience;
    $('#ui-exp-sub').textContent = d.ui.headings.experienceSub;
    $('#ui-badges-title').textContent = d.ui.headings.badges;
    $('#ui-apt-title').textContent = d.ui.headings.aptitudes;
    $('#ui-certs-title').textContent = d.ui.headings.certifications;
  }

  // ----- Brand & hero -----
  $('.brand').textContent = d.profile.brand;
  $('.avatar').src = d.profile.avatar;
  $('.profile-name').innerHTML = `${d.profile.name}<br>${d.profile.lastName}`;
  $('.hero-title').textContent = d.profile.title;
  $('.hero-bio').textContent = d.profile.bio;

  $('.btn-group').innerHTML = `
    <a href="${d.profile.links.github}" class="btn"><i class="fa-brands fa-github"></i> GitHub</a>
    <a href="${d.profile.links.credly}" class="btn"><i class="fa-solid fa-medal"></i> Credly</a>
    <a href="${d.profile.links.linkedin}" class="btn"><i class="fa-brands fa-linkedin"></i> LinkedIn</a>
    <a href="${d.profile.links.cv}" class="btn btncv"><b>${d.profile.cvLabel || 'CV ↓'}</b></a>`;

  // ----- Skills intro -----
  $('#skills #skills-sub').textContent = d.skills.intro.subtitle;
  $('#skills #skills-title').textContent = d.skills.intro.title;
  $('#skills #skills-content').textContent = d.skills.intro.text;

  const groups = document.querySelectorAll('#skills .group');
  groups[0].querySelector('.tags').innerHTML = d.skills.technical.map(t => tag(t, true)).join('');
  groups[1].querySelector('.tags').innerHTML = d.skills.soft.map(t => tag(t)).join('');

  // ----- Background -----
  $('#background .scroll').innerHTML = d.background.map(projectCard).join('');

  // ----- Education -----
  $('.timeline').innerHTML = d.education.map(e => `
    <div class="tl-item">
      <span class="tl-date">${e.date}</span>
      <div><h3>${e.title}</h3><p>${e.place}</p></div>
    </div>`).join('');

  // ----- Technical domain -----
  $('#technical-domain .skills-table').innerHTML = d.technicalDomain.map(row => `
    <tr><td>${row.category}</td><td>${tags(row.items)}</td></tr>`).join('');

  // ----- Projects -----
  $('#projects .scroll').innerHTML = d.projects.map(projectCard).join('');

  // ----- Experience -----
  $('#experience .scroll').innerHTML = d.experience.map(expCard).join('');

  // ----- Credentials -----
  $('.credly-link').href = d.credentials.credlyUrl;
  $('.badge-list').innerHTML = d.credentials.badges.map(b => `
    <a href="${b.url}" target="_blank" rel="noopener noreferrer" title="Ver credencial">
      <img alt="Badge" src="${b.img}">
    </a>
  `).join('');
  $('#credentials .list').innerHTML = d.credentials.list.map(i => `<li>${i}</li>`).join('');

  // ----- Certifications -----
  $('#certifications .certs').innerHTML = d.certifications.map(c => `
    <a href="${c.link}">
      <article class="card cert">
        <img alt="" src="${c.image}">
        <div>
          <h3>${c.title}</h3>
          <!-- Aquí generamos la lista -->
          <ul style="margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; color: inherit;">
            ${c.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      </article>
    </a>`).join('');

  // ----- Footer -----
  $('footer nav').innerHTML = d.footer.links.map(l => `<a href="${l.href}">${l.label}</a>`).join('');

  // ----- Switch visual -----
  document.querySelectorAll('.lang span').forEach(el => {
    el.classList.toggle('on', el.textContent.toLowerCase() === lang);
  });

  // ----- Atributo lang del <html> (accesibilidad/SEO) -----
  document.documentElement.lang = lang;

  // ----- Persistencia -----
  try { localStorage.setItem('preferred-lang', lang); } catch (_) { }
}

/* ---------- Wiring del switch ES / EN ---------- */
function initLangSwitch() {
  const spans = document.querySelectorAll('.lang span');
  spans.forEach(span => {
    span.style.cursor = 'pointer';
    span.addEventListener('click', () => {
      const lang = span.textContent.toLowerCase();
      render(lang);
    });
  });
}

/* ---------- Arranque ---------- */
function getInitialLang() {
  try {
    const saved = localStorage.getItem('preferred-lang');
    if (SUPPORTED_LANGS.includes(saved)) return saved;
  } catch (_) { }
  // Fallback: idioma del navegador
  const nav = (navigator.language || 'en').slice(0, 2).toLowerCase();
  return SUPPORTED_LANGS.includes(nav) ? nav : 'en';
}

initLangSwitch();
render(getInitialLang());