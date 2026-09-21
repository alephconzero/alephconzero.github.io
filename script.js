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
  { testo: "Caro signore, benché a lungo alienato, l'uommo non è perduto né del tutto cambiato.", autore: "J.R.R. Tolkien" },
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

// ======================
// GLOSSARIO: tendine sui termini difficili
// ======================
// COME SI USA
//  1) Nel testo (in qualsiasi articolo):
//       <span class="termine">sincretico</span>
//  2) Qui sotto aggiungi la definizione, con la stessa parola in minuscolo.
//     La definizione si scrive una volta sola e vale per tutte le pagine.
//
// CASI PARTICOLARI
//  - Nel testo la parola compare in un'altra forma (es. "sincretica", "sincretismo"):
//      <span class="termine" data-termine="sincretico">sincretica</span>
//  - Definizione valida solo in quel punto, senza passare da qui:
//      <span class="termine" data-def="Testo della definizione">parola</span>
//  - Le definizioni possono contenere HTML semplice: <em>, <strong>, <a href="...">.
//  - Se un termine non ha definizione resta testo normale, e la console del browser
//    (F12) segnala quale voce manca.
const GLOSSARIO = {
  "sincretico": "Che fonde insieme elementi di culture o religioni diverse in un unico sistema. Nel mondo antico era frequente: si adottavano gli dèi dei popoli vicini e li si affiancava ai propri.",
  // "pantheon": "La definizione va qui.",
};
 
document.addEventListener("DOMContentLoaded", () => {
  const termini = Array.from(document.querySelectorAll(".termine"));
  if (!termini.length) return;
 
  // Un'unica tendina condivisa da tutti i termini della pagina
  const tendina = document.createElement("div");
  tendina.id = "tendina-glossario";
  tendina.className = "tendina";
  tendina.setAttribute("role", "note");
  tendina.setAttribute("aria-live", "polite");
  tendina.setAttribute("aria-hidden", "true");
  tendina.innerHTML =
    '<button type="button" class="tendina-chiudi" tabindex="-1" aria-label="Chiudi la definizione">&times;</button>' +
    '<strong class="tendina-titolo"></strong>' +
    '<div class="tendina-testo"></div>';
  document.body.appendChild(tendina);
 
  const titolo = tendina.querySelector(".tendina-titolo");
  const testo = tendina.querySelector(".tendina-testo");
  const definizioni = new Map();
  let attivo = null;
 
  const chiaveDi = (el) =>
    (el.dataset.termine || el.textContent).trim().toLowerCase().replace(/\s+/g, " ");
 
  function posiziona(el) {
    const margine = 12;
    const distanza = 10;
    const vw = document.documentElement.clientWidth;
    const larghezza = Math.min(340, vw - margine * 2);
    tendina.style.width = larghezza + "px";
    const altezza = tendina.offsetHeight;
 
    // se la parola va a capo, usa la prima e l'ultima riga
    const righe = el.getClientRects();
    const prima = righe[0];
    const ultima = righe[righe.length - 1];
    const centro = (ultima.left + ultima.right) / 2;
 
    const sinistra = Math.max(margine, Math.min(centro - larghezza / 2, vw - larghezza - margine));
 
    const spazioSotto = window.innerHeight - ultima.bottom;
    const spazioSopra = prima.top;
    const sotto = spazioSotto >= altezza + distanza + margine || spazioSotto >= spazioSopra;
    const alto = sotto ? ultima.bottom + distanza : prima.top - altezza - distanza;
 
    // la tendina e' dentro <body> (position: relative): si parte dall'origine del body
    const corpo = document.body.getBoundingClientRect();
    tendina.style.left = sinistra - corpo.left + "px";
    tendina.style.top = alto - corpo.top + "px";
    tendina.dataset.pos = sotto ? "sotto" : "sopra";
    tendina.style.setProperty(
      "--freccia-x",
      Math.max(22, Math.min(centro - sinistra - 4, larghezza - 22)) + "px"
    );
  }
 
  function apri(el) {
    if (attivo && attivo !== el) attivo.setAttribute("aria-expanded", "false");
    attivo = el;
    titolo.textContent = el.textContent.trim();
    testo.innerHTML = definizioni.get(el);
    posiziona(el);
    tendina.classList.add("aperta");
    tendina.setAttribute("aria-hidden", "false");
    el.setAttribute("aria-expanded", "true");
  }
 
  function chiudi(riportaFocus) {
    if (!attivo) return;
    const el = attivo;
    attivo = null;
    el.setAttribute("aria-expanded", "false");
    tendina.classList.remove("aperta");
    tendina.setAttribute("aria-hidden", "true");
    if (riportaFocus) el.focus();
  }
 
  function alterna(el) {
    if (attivo === el) chiudi(false);
    else apri(el);
  }
 
  termini.forEach((el) => {
    const definizione = el.dataset.def || GLOSSARIO[chiaveDi(el)];
    if (!definizione) {
      console.warn('Glossario: manca la definizione di "' + chiaveDi(el) + '"');
      return;
    }
    definizioni.set(el, definizione);
 
    el.setAttribute("role", "button");
    el.setAttribute("tabindex", "0");
    el.setAttribute("aria-expanded", "false");
    el.setAttribute("aria-controls", "tendina-glossario");
 
    el.addEventListener("click", () => alterna(el));
    el.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      e.preventDefault();
      alterna(el);
    });
  });
 
  tendina.querySelector(".tendina-chiudi").addEventListener("click", () => chiudi(false));
 
  // click fuori per chiudere
  document.addEventListener("click", (e) => {
    if (!attivo) return;
    if (tendina.contains(e.target) || attivo.contains(e.target)) return;
    chiudi(false);
  });
 
  // ESC per chiudere (il focus torna sulla parola)
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") chiudi(true);
  });
 
  // se la finestra cambia dimensione il testo va a capo altrove: riposiziona
  window.addEventListener("resize", () => {
    if (attivo) posiziona(attivo);
  });
});
 
