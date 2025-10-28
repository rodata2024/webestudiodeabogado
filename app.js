// ========== Utilidades ==========
const $ = (id) => document.getElementById(id);
const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
const ua = navigator.userAgent || '';

const isMobile = () => /Android|iPhone|iPad|iPod/i.test(ua);
const encode = encodeURIComponent;

// ========== Elementos ==========
const burger  = $('burger');
const nav     = $('nav') || $('nav'); // por si cambia el id
const menu    = $('menu');

const btnSend = $('enviarGmail');
const msgEl   = $('formMsg');

const fNombre  = $('nombre');
const fCorreo  = $('correo');
const fTel     = $('telefono');
const fAsunto  = $('asunto');
const fMensaje = $('mensaje');

// ========== NAV responsive (offcanvas) ==========
if (burger && nav && menu) {
  const toggleNav = () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  };

  // Reaccionar al primer contacto inmediatamente
  on(burger, 'pointerdown', (e) => { e.preventDefault(); toggleNav(); }, { passive: true });

  // Cerrar al elegir opción
  menu.querySelectorAll('a').forEach(a =>
    on(a, 'click', () => nav.classList.remove('open'))
  );
}

// ========== Validación dinámica ==========
const requiredFields = [fNombre, fCorreo, fAsunto, fMensaje];

function isEmail(v) {
  // Suficiente para validación rápida en UI (no reemplaza validación de backend)
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

function setHint(text, color = '#6b7280') {
  if (!msgEl) return;
  msgEl.textContent = text || '';
  msgEl.style.color = color;
}

function firstInvalid() {
  for (const el of requiredFields) {
    const v = (el.value || '').trim();
    if (!v) return el;
    if (el === fCorreo && !isEmail(v)) return el;
  }
  return null;
}

function updateButtonState() {
  const invalid = firstInvalid();
  if (invalid) {
    btnSend?.setAttribute('disabled', 'true');
    setHint('Completa nombre, correo válido, asunto y mensaje.');
  } else {
    btnSend?.removeAttribute('disabled');
    setHint('Listo para enviar.');
  }
}

// Pintado instantáneo de errores por campo
requiredFields.forEach(el => {
  on(el, 'input', () => {
    // feedback por campo
    const v = el.value.trim();
    if (!v) {
      el.style.outline = '2px solid #ef4444';
    } else if (el === fCorreo && !isEmail(v)) {
      el.style.outline = '2px solid #f59e0b';
    } else {
      el.style.outline = '';
    }
    updateButtonState();
  });
});

// Estado inicial
updateButtonState();

// ========== Composición de correo ==========
const TO_EMAIL = 'rmesahuancah@unmsm.edu.pe';

function buildSubjectBody() {
  const nombre  = (fNombre.value || '').trim();
  const correo  = (fCorreo.value || '').trim();
  const tel     = (fTel.value || '').trim();
  const asunto  = (fAsunto.value || '').trim();
  const mensaje = (fMensaje.value || '').trim();

  const subject = `[Web] ${asunto} – ${nombre}`;
  const body =
`Hola Del Rio Abogados,

Mi nombre: ${nombre}
Correo: ${correo}
Teléfono: ${tel || '—'}

Mensaje:
${mensaje}

— Enviado desde delrioabogados.pe`;

  return { subject, body };
}

function openDesktopGmailPopup(to, subject, body) {
  const url = `https://mail.google.com/mail/?view=cm&fs=1&to=${encode(to)}&su=${encode(subject)}&body=${encode(body)}`;

  // Ventana centrada (rápida)
  const w = Math.min(980, (screen.availWidth || 1200) - 80);
  const h = Math.min(760, (screen.availHeight || 900) - 120);
  const left = ((screen.availWidth || window.innerWidth) - w) / 2;
  const top  = ((screen.availHeight || window.innerHeight) - h) / 2;

  const feat = `popup=yes,toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=${w},height=${h},top=${Math.max(0,top)},left=${Math.max(0,left)}`;
  const win = window.open(url, 'gmailComposeWin', feat);

  // Respaldo si el popup fue bloqueado
  if (!win || win.closed || typeof win.closed === 'undefined') {
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setHint('Si no ves la ventana, revisa el bloqueador de ventanas emergentes.', '#b45309');
  } else {
    win.focus();
  }
}

// ========== UX de botón: respuesta inmediata (pointer) ==========
function pressVisual(el) {
  if (!el) return;
  el.style.transform = 'translateY(0.5px) scale(0.995)';
  el.style.filter = 'brightness(0.98)';
  setTimeout(() => {
    el.style.transform = '';
    el.style.filter = '';
  }, 120);
}

// ========== Envío ==========
function sendNow() {
  const invalid = firstInvalid();
  if (invalid) {
    invalid.focus({ preventScroll: false });
    invalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setHint('Completa los campos requeridos (correo válido).', '#b91c1c');
    return;
  }

  const { subject, body } = buildSubjectBody();

  if (isMobile()) {
    // App nativa: reacción inmediata
    const url = `mailto:${TO_EMAIL}?subject=${encode(subject)}&body=${encode(body)}`;
    location.href = url;
    setHint('Abriendo tu app de correo…');
  } else {
    // Desktop: Gmail en popup
    openDesktopGmailPopup(TO_EMAIL, subject, body);
    setHint('Abriendo Gmail…');
  }
}

// Click / Toque inmediato
on(btnSend, 'pointerdown', (e) => {
  e.preventDefault();              // evita demoras del click sintetizado
  pressVisual(btnSend);            // feedback instantáneo
  requestAnimationFrame(sendNow);  // dispara en el siguiente frame
}, { passive: true });

// Accesos rápidos: Ctrl/⌘ + Enter
document.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key === 'Enter') {
    e.preventDefault();
    pressVisual(btnSend);
    sendNow();
  }
});

// También permitir Enter en el campo Asunto (sin modificar textarea)
on(fAsunto, 'keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    pressVisual(btnSend);
    sendNow();
  }
});

// Mejora: si el usuario pega texto en Mensaje, habilitar de inmediato
on(fMensaje, 'paste', () => setTimeout(updateButtonState, 0));
