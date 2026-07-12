// ======================
// Menu Hamburger
// ======================
const hamburger = document.getElementById("hamburger");
const menu = document.getElementById("menu");

if (hamburger && menu) {
  const setMenuState = (open) => {
    hamburger.classList.toggle("active", open);
    menu.classList.toggle("show", open);
    hamburger.setAttribute("aria-expanded", String(open));
    hamburger.setAttribute("aria-label", open ? "Chiudi il menu" : "Apri il menu");
  };

  hamburger.setAttribute("role", "button");
  hamburger.setAttribute("tabindex", "0");
  hamburger.setAttribute("aria-controls", "menu");
  hamburger.setAttribute("aria-expanded", "false");
  hamburger.setAttribute("aria-label", "Apri il menu");

  hamburger.addEventListener("click", () => {
    setMenuState(!menu.classList.contains("show"));
  });

  hamburger.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    e.preventDefault();
    setMenuState(!menu.classList.contains("show"));
  });

  // (extra non distruttivo) chiudi con ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      setMenuState(false);
    }
  });

  // (extra non distruttivo) click fuori per chiudere
  document.addEventListener("click", (e) => {
    if (!menu.classList.contains("show")) return;
    if (menu.contains(e.target) || hamburger.contains(e.target)) return;
    setMenuState(false);
  });
}

// ======================
// Barra di lettura
// ======================
const progress = document.querySelector(".progress-bar");

function updateProgress() {
  if (!progress) return;

  const el = document.documentElement;
  const max = el.scrollHeight - el.clientHeight;
  const scrollTop = el.scrollTop || document.body.scrollTop || 0;

  // evita NaN/Infinity quando la pagina è troppo corta
  const scrolled = max <= 0 ? 100 : (scrollTop / max) * 100;
  progress.style.width = scrolled + "%";
}

updateProgress();
window.addEventListener("scroll", updateProgress, { passive: true });
window.addEventListener("resize", updateProgress);

// ======================
// CITAZIONE CASUALE CON FADE SOLO DEL TESTO
// ======================
const citazioni = [
  { testo: "Se l'uomo non dice nel suo cuore: 'Dio e io siamo soli al mondo', non avrà mai riposo.", autore: "Abate Alonio" },
  { testo: "Se vuoi vivere, o uomo, secondo la legge di Dio, avrai per protettore l'autore stesso di questa legge.", autore: "Ignoto" },
  { testo: "L'uomo deve respirare incessantemente l'umiltà e il timor di Dio, come il soffio che inala ed espelle dalle narici.", autore: "Abate Pastor" },
  { testo: "Non darti importanza ma legati a colui che si comporta bene.", autore: "Abate Pastor" },
  { testo: "Riposati oggi, domani farai penitenza. — No, oggi farò penitenza e domani sia fatta la volontà di Dio.", autore: "Ignoto" },
  { testo: "Il primo sorso dal bicchiere delle scienze naturali rende atei; ma in fondo al bicchiere ci attende Dio.", autore: "W. K. Heisenberg" },
  { testo: "I cieli narrano la gloria di Dio, l'opera delle sue mani annuncia il firmamento.", autore: "Sal 19 (18)" },
  { testo: "Trovo in me stesso un desiderio che nessuna esperienza al mondo può soddisfare: la spiegazione più probabile è che sono stato fatto per un altro mondo.", autore: "C.S. Lewis" },
  { testo: "Non abbiamo quaggiù una città stabile, ma andiamo in cerca di quella futura.", autore: "Ebrei 13,14" },
  { testo: "Nessuno di voi sia trovato disertore. Il vostro battesimo rimanga come uno scudo, la fede come un elmo, la carità come una lancia, la pazienza come un'armatura.", autore: "Sant'Ignazio di Antiochia" }
];

let indiceCorrente = -1;
const durataVisibile = 10000; // tempo di permanenza
const durataFade = 1000;      // durata dissolvenza

function mostraCitazione() {
  const sezione = document.getElementById("citazione");
  if (!sezione) return;

  let contenuto = sezione.querySelector(".testo-citazione");
  if (!contenuto) {
    contenuto = document.createElement("div");
    contenuto.className = "testo-citazione";
    sezione.appendChild(contenuto);
  }

  // fade out del solo contenuto
  contenuto.classList.add("fade-out");

  setTimeout(() => {
    // nuova citazione diversa dalla precedente
    let nuovo;
    do {
      nuovo = Math.floor(Math.random() * citazioni.length);
    } while (nuovo === indiceCorrente && citazioni.length > 1);
    indiceCorrente = nuovo;

    const citazione = citazioni[indiceCorrente];
    contenuto.innerHTML = `
      <p>“${citazione.testo}”</p>
      <footer>— ${citazione.autore}</footer>
    `;

    // fade in
    contenuto.classList.remove("fade-out");
  }, durataFade);
}

document.addEventListener("DOMContentLoaded", () => {
  const sezione = document.getElementById("citazione");
  if (!sezione) return;

  // Mostra immediatamente una citazione casuale
  const iniziale = Math.floor(Math.random() * citazioni.length);
  indiceCorrente = iniziale;
  const citazione = citazioni[iniziale];

  const contenuto = document.createElement("div");
  contenuto.className = "testo-citazione"; // non ha fade all'inizio
  contenuto.innerHTML = `
    <p>“${citazione.testo}”</p>
    <footer>— ${citazione.autore}</footer>
  `;
  sezione.appendChild(contenuto);

  // Poi attiva il ciclo automatico
  setInterval(mostraCitazione, durataVisibile);
});
