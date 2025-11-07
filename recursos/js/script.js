/* script.js - Vanilla JS para Biblioteca El Quijote de Krypton
   - Inserta datos de ejemplo, maneja catálogo, búsqueda, filtros, modal, localStorage
*/

/* ------------------------
   Datos de ejemplo (libros)
   ------------------------ */
const BOOKS = [
  {
    id:1,
    title:"Don Quijote de la Mancha",
    author:"Miguel de Cervantes",
    year:1605,
    genre:"Novela clásica",
    isbn:"ISBN-0001-Q",
    description:"Clásico de la literatura española: aventuras, humor y reflexión sobre la locura y la lectura.",
    avail:"Disponible",
    cover:"recursos/img/portada-placeholder.png"
  },
  {
    id:2,
    title:"1984",
    author:"George Orwell",
    year:1949,
    genre:"Distopía",
    isbn:"ISBN-0002-1984",
    description:"Una sociedad vigilada y controlada por el Gran Hermano. Reflexión sobre poder y libertad.",
    avail:"Prestado",
    cover:"recursos/img/portada-placeholder.png"
  },
  {
    id:3,
    title:"Cien años de soledad",
    author:"Gabriel García Márquez",
    year:1967,
    genre:"Realismo mágico",
    isbn:"ISBN-0003-CIEN",
    description:"La saga de la familia Buendía en Macondo: historia, mito y realismo mágico.",
    avail:"Disponible",
    cover:"recursos/img/portada-placeholder.png"
  },
  {
    id:4,
    title:"El Principito",
    author:"Antoine de Saint-Exupéry",
    year:1943,
    genre:"Fábula",
    isbn:"ISBN-0004-PRIN",
    description:"Un relato poético y filosófico sobre la mirada de la infancia, la amistad y la responsabilidad.",
    avail:"Disponible",
    cover:"recursos/img/portada-placeholder.png"
  },
  {
    id:5,
    title:"Rayuela",
    author:"Julio Cortázar",
    year:1963,
    genre:"Novela experimental",
    isbn:"ISBN-0005-RAY",
    description:"Una obra innovadora que explora la narrativa en juegos y saltos entre capítulos.",
    avail:"Prestado",
    cover:"recursos/img/portada-placeholder.png"
  },
  // Agrega más libros inventados si quieres...
];

/* ------------------------
   Utilidades comunes
   ------------------------ */
const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

/* ------------------------
   Modo oscuro (persistente)
   ------------------------ */
(function themeInit(){
  const root = document.documentElement;
  const saved = localStorage.getItem('dq_theme');
  if(saved === 'dark') root.setAttribute('data-theme','dark');
  document.addEventListener('click', e => {
    if(e.target.matches('#btnDarkMode')){
      const current = document.documentElement.getAttribute('data-theme');
      if(current === 'dark'){
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('dq_theme','light');
      } else {
        document.documentElement.setAttribute('data-theme','dark');
        localStorage.setItem('dq_theme','dark');
      }
    }
  });
})();

/* ------------------------
   Menú hamburguesa
   ------------------------ */
(function menuInit(){
  const btn = $('#btnMenu');
  const nav = $('#navList');
  if(!btn || !nav) return;
  btn.addEventListener('click', () => {
    nav.style.display = nav.style.display === 'flex' ? 'none' : 'flex';
  });
  // cerrar al hacer click en enlace (móvil)
  nav.addEventListener('click', (e) => {
    if(e.target.tagName === 'A') nav.style.display = 'none';
  });
})();

/* ------------------------
   Renderiza tarjetas (usado en index y catálogo)
   ------------------------ */
function renderCards(targetEl, books){
  if(!targetEl) return;
  targetEl.innerHTML = '';
  books.forEach(book => {
    const card = document.createElement('article');
    card.className = 'book-card';
    card.innerHTML = `
      <div class="book-thumb">
        <img src="${book.cover}" alt="Portada de ${escapeHtml(book.title)}" onerror="this.src='recursos/img/portada-placeholder.png'"/>
      </div>
      <div class="book-body">
        <h4 class="book-title">${escapeHtml(book.title)}</h4>
        <div class="book-meta">${escapeHtml(book.author)} · ${book.year} · <span class="badge">${escapeHtml(book.avail)}</span></div>
        <p class="small muted">${escapeHtml(book.genre)}</p>
        <div class="book-actions">
          <button data-id="${book.id}" class="btn-small btn-outline show-detail">Ver</button>
          <button data-id="${book.id}" class="btn-small add-list">Añadir a mi lista</button>
        </div>
      </div>
    `;
    targetEl.appendChild(card);
  });

  // listeners
  $$('.show-detail', targetEl).forEach(btn =>{
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.dataset.id);
      openDetailModal(id);
    });
  });
  $$('.add-list', targetEl).forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.currentTarget.dataset.id);
      addToReadingList(id);
    });
  });
}

/* ------------------------
   Buscar y filtrar
   ------------------------ */
function initCatalogPage(){
  const container = $('#catalogGrid');
  const qInput = $('#catalogSearch');
  const genreSel = $('#filterGenre');
  const availSel = $('#filterAvail');

  // poblar filtros de géneros dinámicamente
  const genres = Array.from(new Set(BOOKS.map(b => b.genre)));
  genres.forEach(g => {
    const opt = document.createElement('option'); opt.value = g; opt.textContent = g;
    genreSel.appendChild(opt);
  });

  function applyFilters(){
    const q = qInput.value.trim().toLowerCase();
    const genre = genreSel.value;
    const avail = availSel.value;
    let result = BOOKS.filter(b => {
      const text = `${b.title} ${b.author} ${b.genre}`.toLowerCase();
      return (!q || text.includes(q)) &&
             (!genre || b.genre === genre) &&
             (!avail || b.avail === avail);
    });
    renderCards(container, result);
  }

  if(qInput) qInput.addEventListener('input', applyFilters);
  [genreSel, availSel].forEach(s => s.addEventListener('change', applyFilters));

  // mostrar todos inicialmente
  renderCards(container, BOOKS);
}

/* ------------------------
   Detalle de libro (página detalle_libro.html)
   ------------------------ */
function initDetailPage(){
  // lee id de query param
  const params = new URLSearchParams(location.search);
  const id = Number(params.get('id'));
  const book = BOOKS.find(b => b.id === id);
  const root = $('#detailRoot');
  if(!root) return;
  if(!book){
    root.innerHTML = `<div class="card"><h3>Libro no encontrado</h3><p>El libro solicitado no existe.</p></div>`;
    return;
  }
  root.innerHTML = `
    <div class="card detail-card">
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <div style="min-width:180px"><img src="${book.cover}" alt="Portada ${escapeHtml(book.title)}" style="width:180px;height:260px;object-fit:cover;border-radius:8px"></div>
        <div style="flex:1">
          <h2>${escapeHtml(book.title)}</h2>
          <p class="muted">${escapeHtml(book.author)} · ${book.year}</p>
          <p><strong>Género:</strong> ${escapeHtml(book.genre)}</p>
          <p><strong>ISBN:</strong> ${escapeHtml(book.isbn)}</p>
          <p>${escapeHtml(book.description)}</p>
          <p><span class="badge">${escapeHtml(book.avail)}</span></p>
          <div style="margin-top:0.75rem;display:flex;gap:0.5rem">
            <button class="btn" id="requestLoan">Solicitar préstamo</button>
            <button class="btn ghost" id="addToListDetail">Añadir a lista</button>
          </div>
        </div>
      </div>
    </div>
  `;

  $('#requestLoan')?.addEventListener('click', ()=> {
    // redirige al formulario de préstamo con query
    location.href = `../forms/solicitar_prestamo_libro.html?book=${encodeURIComponent(book.title)}&id=${book.id}`;
  });
  $('#addToListDetail')?.addEventListener('click', ()=> addToReadingList(book.id));
}

/* ------------------------
   Modal de detalle (para catálogo e index)
   ------------------------ */
function openDetailModal(id){
  const book = BOOKS.find(b => b.id === id);
  if(!book) return;
  const root = document.getElementById('modalRoot');
  if(!root) return;

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true">
      <button class="icon-btn" id="closeModal" style="float:right">✖</button>
      <div style="display:flex;gap:1rem;flex-wrap:wrap">
        <div style="min-width:180px"><img src="${book.cover}" alt="Portada ${escapeHtml(book.title)}" style="width:180px;height:260px;object-fit:cover;border-radius:8px"></div>
        <div style="flex:1">
          <h3>${escapeHtml(book.title)}</h3>
          <p class="muted">${escapeHtml(book.author)} · ${book.year}</p>
          <p><strong>Género:</strong> ${escapeHtml(book.genre)}</p>
          <p>${escapeHtml(book.description)}</p>
          <div style="margin-top:0.75rem;display:flex;gap:0.5rem">
            <button class="btn" id="modalRequest">Solicitar préstamo</button>
            <button class="btn ghost" id="modalAdd">Añadir a mi lista</button>
            <a class="link" href="pages/detalle_libro.html?id=${book.id}">Abrir página</a>
          </div>
        </div>
      </div>
    </div>
  `;
  root.appendChild(backdrop);

  backdrop.addEventListener('click', e => {
    if(e.target === backdrop || e.target.id === 'closeModal') backdrop.remove();
  });

  backdrop.querySelector('#modalRequest').addEventListener('click', ()=> {
    location.href = `forms/solicitar_prestamo_libro.html?book=${encodeURIComponent(book.title)}&id=${book.id}`;
  });
  backdrop.querySelector('#modalAdd').addEventListener('click', ()=> addToReadingList(book.id));
}

/* ------------------------
   Reading list en localStorage
   ------------------------ */
function getReadingList(){ 
  try { return JSON.parse(localStorage.getItem('dq_readlist')||'[]'); } catch { return [] }
}
function setReadingList(list){ localStorage.setItem('dq_readlist', JSON.stringify(list)); updateReadingListBadge(); }
function addToReadingList(id){
  const list = getReadingList();
  if(list.includes(id)){
    alert('El libro ya está en tu lista de lectura.');
    return;
  }
  list.push(id);
  setReadingList(list);
  alert('Añadido a tu lista de lectura.');
}
function removeFromReadingList(id){
  const list = getReadingList().filter(x=>x!==id);
  setReadingList(list);
}
function renderReadingList(targetEl){
  if(!targetEl) return;
  const list = getReadingList();
  if(list.length === 0){ targetEl.innerHTML = '<p class="muted">Tu lista está vacía.</p>'; return; }
  targetEl.innerHTML = '';
  list.forEach(id => {
    const book = BOOKS.find(b=>b.id===id);
    if(!book) return;
    const el = document.createElement('div');
    el.className = 'card';
    el.style.marginBottom = '0.6rem';
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:0.6rem">
        <img src="${book.cover}" alt="${escapeHtml(book.title)}" style="width:48px;height:72px;object-fit:cover;border-radius:6px">
        <div style="flex:1">
          <strong>${escapeHtml(book.title)}</strong><br>
          <span class="muted small">${escapeHtml(book.author)}</span>
        </div>
        <button data-id="${book.id}" class="btn-small btn-outline remove-list">Quitar</button>
      </div>
    `;
    targetEl.appendChild(el);
  });
  $$('.remove-list', targetEl).forEach(b => b.addEventListener('click', e => {
    removeFromReadingList(Number(e.currentTarget.dataset.id));
    renderReadingList(targetEl);
  }));
}
function updateReadingListBadge(){
  const badge = document.querySelector('.reading-badge');
  if(!badge) return;
  badge.textContent = getReadingList().length;
}

/* ------------------------
   Página index: inyectar destacados
   ------------------------ */
(function initIndexHighlights(){
  const el = document.getElementById('indexHighlights');
  if(!el) return;
  // tomar primeros 4 libros como destacados
  renderCards(el, BOOKS.slice(0,4));
})();

/* ------------------------
   Escape HTML para seguridad
   ------------------------ */
function escapeHtml(str){
  if(!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s]);
}

/* ------------------------
   Init general: detectar páginas
   ------------------------ */
document.addEventListener('DOMContentLoaded', ()=>{
  updateReadingListBadge();
  // si existe un contenedor de catálogo
  if(document.getElementById('catalogGrid')) initCatalogPage();
  if(document.getElementById('detailRoot')) initDetailPage();
  // si hay contenedor para lectura
  const rl = document.getElementById('readingListRoot');
  if(rl) renderReadingList(rl);

  // formulario de contacto (validación básica)
  const contactForm = document.querySelector('form[data-form="contact"]');
  if(contactForm){
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = contactForm.querySelector('[name="nombre"]').value.trim();
      const email = contactForm.querySelector('[name="correo"]').value.trim();
      const msg = contactForm.querySelector('[name="mensaje"]').value.trim();
      if(!name || !email || !msg){ alert('Por favor completa todos los campos.'); return; }
      alert('Mensaje enviado. Gracias por contactarnos, ' + name + '!');
      contactForm.reset();
    });
  }

  // Form solicitud de préstamo (prellenar si hay query param)
  const loanForm = document.querySelector('form[data-form="loan"]');
  if(loanForm){
    const params = new URLSearchParams(location.search);
    if(params.get('book')) loanForm.querySelector('[name="libro"]').value = params.get('book');
    loanForm.addEventListener('submit', e => {
      e.preventDefault();
      const user = loanForm.querySelector('[name="usuario"]').value.trim();
      const libro = loanForm.querySelector('[name="libro"]').value.trim();
      if(!user || !libro){ alert('Por favor completa usuario y libro.'); return; }
      alert(`Solicitud enviada para ${libro}. Nos comunicaremos con ${user}.`);
      loanForm.reset();
    });
  }
});
