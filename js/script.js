const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
const on = (el, ev, fn, opt) => el && el.addEventListener(ev, fn, opt);

function debounce(fn, wait = 300) {
  let t; 
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
}


function initMobileMenu() {
  const nav = $('.nav');
  const brand = $('.brand');
  if (!nav || !brand) return;

  if (!nav.id) nav.id = 'site-nav';

  let btnHamburguesa = $('.btn-hamburguesa');
  if (!btnHamburguesa) {
    btnHamburguesa = document.createElement('button');
    btnHamburguesa.className = 'btn-hamburguesa';
    btnHamburguesa.setAttribute('aria-label', 'Abrir menú de navegación');
    btnHamburguesa.setAttribute('aria-expanded', 'false');
    btnHamburguesa.setAttribute('aria-controls', nav.id);
    btnHamburguesa.innerHTML = '<span></span><span></span><span></span>';
    brand.parentNode.insertBefore(btnHamburguesa, brand.nextSibling);
  }

  let lastFocus = null;

  const open = () => {
    lastFocus = document.activeElement;
    nav.classList.add('nav-active');
    btnHamburguesa.classList.add('active');
    document.body.classList.add('menu-abierto');
    btnHamburguesa.setAttribute('aria-expanded', 'true');
    btnHamburguesa.setAttribute('aria-label', 'Cerrar menú de navegación');
    const firstLink = nav.querySelector('a');
    firstLink && firstLink.focus();
  };

  const close = () => {
    nav.classList.remove('nav-active');
    btnHamburguesa.classList.remove('active');
    document.body.classList.remove('menu-abierto');
    btnHamburguesa.setAttribute('aria-expanded', 'false');
    btnHamburguesa.setAttribute('aria-label', 'Abrir menú de navegación');
    lastFocus && lastFocus.focus();
  };

  const toggle = () => nav.classList.contains('nav-active') ? close() : open();

  on(btnHamburguesa, 'click', toggle);

  $$('.nav a', nav).forEach(a => on(a, 'click', close));
  on(document, 'click', (e) => {
    if (!nav.contains(e.target) && !btnHamburguesa.contains(e.target) && nav.classList.contains('nav-active')) close();
  });
  on(document, 'keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('nav-active')) close(); });

  on(document, 'keydown', (e) => {
    if (!nav.classList.contains('nav-active') || e.key !== 'Tab') return;
    const focusables = $$('a[href], button, [tabindex]:not([tabindex="-1"])', nav)
      .filter(el => !el.hasAttribute('disabled'));
    if (!focusables.length) return;
    const first = focusables[0], last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });

  const mq = window.matchMedia('(min-width: 769px)');
  mq.addEventListener?.('change', (e) => { if (e.matches) close(); });
}

function initSubscribeForm() {
  const form = document.querySelector('.subscribe-form');
  const msg  = document.getElementById('subs-msg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = 'Enviando...';

    const emailInput = form.querySelector('input[name="email"]');
    const emailValue = emailInput?.value?.trim();
    if (!emailValue) {
      msg && (msg.textContent = 'Ingresá un email válido.');
      emailInput && emailInput.focus();
      return;
    }

    try {
      const r = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      const text = await r.text();
      console.log('[Formspree]', r.status, text);
      if (!r.ok) throw new Error('Formspree ' + r.status + ' -> ' + text);
    } catch (err) {
      console.error('ERROR Formspree:', err);
      msg && (msg.textContent = 'No pudimos enviar tu suscripción. Verificá tu conexión e intentá otra vez.');
      return; 
    }

    try {
      if (window.emailjs && typeof emailjs.send === 'function') {
        const SERVICE_ID  = 'service_c4jrp86';   
        const TEMPLATE_ID = 'template_ukx7hf9';  
        const res = await emailjs.send(SERVICE_ID, TEMPLATE_ID, {
          email: emailValue 
        });
        console.log('[EmailJS] OK', res);
      } else {
        console.warn('[EmailJS] no cargado o sin send(); se omite auto-reply.');
      }
    } catch (err) {
      console.warn('[EmailJS] fallo auto-reply:', err); 
    }

    form.reset();
    msg && (msg.textContent = '¡Listo! Tu suscripción fue enviada. Revisá tu correo.');
  });
}


function initResumenCompra() {
  const checkboxes = $$('input[type="checkbox"][data-precio]');
  const resumen = $('.resumen-compra');
  if (!checkboxes.length || !resumen) return;

  const render = () => {
    let total = 0; const items = [];
    checkboxes.forEach(cb => {
      if (cb.checked) {
        const nombre = cb.dataset.nombre || cb.value || 'Producto';
        const precio = parseInt(cb.dataset.precio || '0', 10) || 0;
        items.push({ nombre, precio }); total += precio;
      }
    });

    if (!items.length) { resumen.innerHTML = '<p>No hay productos seleccionados.</p>'; return; }

    resumen.innerHTML = `
      <h3>Resumen de tu compra</h3>
      <ul>${items.map(i => `<li>${i.nombre} — $${i.precio.toLocaleString('es-AR')}</li>`).join('')}</ul>
      <p class="total"><strong>Total: $${total.toLocaleString('es-AR')}</strong></p>
    `;
  };

  checkboxes.forEach(cb => on(cb, 'change', render));
  render();
}

function initScrollToTop() {
  const scrollBtn = document.querySelector('.scroll-to-top');
  if (!scrollBtn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      scrollBtn.classList.add('visible');
    } else {
      scrollBtn.classList.remove('visible');
    }
  });

  scrollBtn.addEventListener('click', () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });
}

document.addEventListener('DOMContentLoaded', initScrollToTop);

function initCarrusel() {
  const carrusel = $('.carrusel');
  if (!carrusel) return;
  const slides = $$('.carrusel-item', carrusel);
  if (!slides.length) return; 

  let i = 0, timer;
  const show = (idx) => {
    slides.forEach(s => s.classList.remove('active'));
    i = (idx + slides.length) % slides.length;
    slides[i].classList.add('active');
  };
  const next = () => show(i + 1);
  const prev = () => show(i - 1);
  const play = () => (timer = setInterval(next, 5000));
  const stop = () => clearInterval(timer);

  on(carrusel, 'mouseenter', stop);
  on(carrusel, 'mouseleave', play);
  on(document, 'keydown', (e) => {
    if (!carrusel.matches(':hover')) return;
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  let x0 = null;
  on(carrusel, 'touchstart', (e) => x0 = e.changedTouches[0].clientX);
  on(carrusel, 'touchend', (e) => {
    if (x0 == null) return;
    const dx = x0 - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 50) dx > 0 ? next() : prev();
    x0 = null;
  });

  play();
}


function initFormValidation() {
  const form = $('.formulario-compra');
  if (!form) return;

  on(form, 'submit', (e) => {
    const email = form.querySelector('input[name="email"]');
    const tel   = form.querySelector('input[name="telefono"]');
    const pago  = form.querySelector('select[name="pago"]');
    let ok = true;

    if (email && !/^\S+@\S+\.\S+$/.test(email.value)) { ok = false; email.focus(); alert('Ingresá un email válido.'); }
    else if (tel && !/^[0-9+\s-]{6,}$/.test(tel.value)) { ok = false; tel.focus(); alert('Ingresá un teléfono válido.'); }
    else if (pago && !pago.value) { ok = false; pago.focus(); alert('Elegí un método de pago.'); }

    if (!ok) e.preventDefault();
  });
}

function initBackToTop() {
  if ($('#btn-top')) return;
  const btn = document.createElement('button');
  btn.id = 'btn-top';
  btn.textContent = '↑';
  Object.assign(btn.style, {
    position: 'fixed', right: '16px', bottom: '16px', padding: '10px 12px',
    borderRadius: '10px', border: '1px solid #24314d', background: '#0f1528',
    color: '#e6e9f0', cursor: 'pointer', display: 'none', zIndex: 999
  });
  document.body.appendChild(btn);

  on(window, 'scroll', () => { btn.style.display = window.scrollY > 400 ? 'block' : 'none'; });
  on(btn, 'click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}


function initAnalytics() {
  $$('.btn-comprar, .cta-button').forEach(btn => {
    on(btn, 'click', () => {
      const n = parseInt(localStorage.getItem('clicksComprar') || '0', 10) + 1;
      localStorage.setItem('clicksComprar', String(n));
      console.log(`Botón "Comprar" clickeado ${n} veces`);
    });
  });
}


document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initSubscribeForm();
  initResumenCompra();
  initFormValidation();
  initCatalogoToolbar();
  initCarrusel();
  initBackToTop();
  initAnalytics();
});

function initToasts() {
  
  const show = (text) => {
    if (!window.Toastify) return;
    Toastify({
      text,
      duration: 3000,
      gravity: "top",
      position: "right",
      close: true,
      stopOnFocus: true
    }).showToast();
  };

  document.querySelectorAll('.btn-accent, .btn-comprar').forEach(btn => {
    btn.addEventListener('click', () => {
      const href = (btn.getAttribute('href') || '').toLowerCase();
      if (href.includes('comprar')) {
        show('Vamos a completar tu compra ✅');
      } else {
        show('Producto agregado al carrito 🛒');
      }
    });
  });

  const form = document.querySelector('.formulario-compra');
  if (form) {
    form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) return; 
      show('Datos enviados. Te contactaremos 👌');
    }, true);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initToasts();
});
