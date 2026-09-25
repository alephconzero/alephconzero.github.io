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
  // ---------- Come nasce una Bibbia? ----------
  "sincretico": "Che fonde insieme elementi di culture o religioni diverse in un unico sistema. Nel mondo antico era frequente: si adottavano gli dèi dei popoli vicini e li si affiancava ai propri.",
  "pantheon": "L'insieme di tutti gli dèi venerati da un popolo o da una religione politeista. Dal greco, «di tutti gli dèi».",
  "letteralismo": "Modo di leggere un testo, in particolare la Bibbia, prendendo ogni affermazione alla lettera, come una descrizione storica o scientifica esatta, senza considerare il genere letterario, la cultura e l'intenzione di chi scrive.",
  "intellighenzia": "La parte colta di una società: intellettuali, studiosi, scrittori e professionisti che orientano la cultura e l'opinione pubblica. La parola viene dal russo.",
  "canonici": "Detto dei libri che la Chiesa riconosce ufficialmente come ispirati e quindi parte della Bibbia. L'elenco di questi libri si chiama canone.",
  "agiografi": "In questo contesto, gli autori dei libri sacri. Il termine è più noto con un altro significato, chi scrive le vite dei santi, ma nel linguaggio teologico indica gli scrittori biblici.",
  "Magistero": "L'insegnamento ufficiale della Chiesa cattolica, esercitato dal Papa e dai vescovi (con concili, encicliche e altri documenti). Si distingue dalle opinioni dei singoli teologi.",
  "Dei Verbum": "Costituzione dogmatica sulla Rivelazione divina, uno dei documenti principali del Concilio Vaticano II. Fu promulgata nel 1965.",
  "incarnazione": "Nella fede cristiana, il fatto che Dio, in Gesù, si è fatto uomo assumendo un corpo umano.",
  "ispirazione": "Nella dottrina cattolica, l'azione con cui Dio assiste gli autori dei libri biblici. Restano veri autori, con la loro cultura, il loro stile e le loro capacità, ma ciò che scrivono trasmette ciò che Dio ha voluto. Non significa dettatura.",
  "rivelazione": "Il farsi conoscere di Dio agli esseri umani: attraverso la creazione, la storia del popolo d'Israele, le Scritture e, per i cristiani in modo pieno, Gesù Cristo.",

  // ---------- Fede e scienza fanno a cazzotti? ----------
  "positivismo scientifico": "Corrente filosofica nata nell'Ottocento (il suo fondatore è Auguste Comte) secondo cui l'unica conoscenza valida è quella ottenuta con l'osservazione dei fatti e il metodo scientifico.",
  "rivoluzione copernicana": "Il passaggio, nel Cinquecento, dall'idea che la Terra fosse ferma al centro dell'universo a quella che la Terra e i pianeti girino attorno al Sole (Niccolò Copernico, 1543). È una delle svolte all'origine della scienza moderna.",
  "linguaggio mitico": "«Mito» non vuol dire «falso». Indica un racconto simbolico con cui un popolo esprime il senso ultimo delle cose (da dove veniamo, perché esiste il male, chi è Dio) usando immagini e non descrizioni scientifiche.",
  "magisteri non sovrapponibili": "Idea del biologo Stephen Jay Gould (in inglese <em>non-overlapping magisteria</em>): scienza e religione si occupano di ambiti diversi, i fatti da una parte e i valori e il senso dall'altra, e quindi non possono entrare in conflitto. Qui «magistero» è usato nel senso generico di «ambito di autorità».",
  "biblistica": "La disciplina che studia la Bibbia con metodi scientifici: testi, lingue originali, storia della composizione e interpretazione.",
  "Dei Filius": "Costituzione dogmatica del Concilio Vaticano I (1870) sulla fede cattolica e sul rapporto tra fede e ragione.",
  "Fides et ratio": "Enciclica di Giovanni Paolo II (1998) dedicata al rapporto tra fede e ragione.",

  // ---------- Droghe matematiche: la crisi del 2008 ----------
  "insolvente": "Chi non riesce più a pagare i propri debiti alla scadenza. L'insolvenza è questa condizione.",
  "derivati creditizi": "Strumenti finanziari il cui valore dipende da altri crediti, come mutui e prestiti. Servono a trasferire ad altri il rischio che un debito non venga restituito.",
  "copula gaussiana": "Strumento matematico che descrive come più eventi (qui, il fallimento di diversi debitori) dipendono l'uno dall'altro, usando come base la distribuzione gaussiana. Fu usato per stimare il rischio dei CDO.",
  "code": "Le due estremità del grafico di una distribuzione, lontane dal valore più frequente. Corrispondono agli eventi rari ed estremi: più la coda è «spessa», più questi eventi sono probabili.",
  "power law": "Distribuzione di probabilità (in italiano «legge di potenza») in cui gli eventi estremi sono molto meno rari che in una gaussiana, perché le sue code calano lentamente. La si osserva, per esempio, nell'energia dei terremoti e nella distribuzione della ricchezza.",
  "indipendenti": "Due eventi sono indipendenti quando il verificarsi dell'uno non cambia la probabilità dell'altro. Due lanci di moneta lo sono. Il fallimento di un debitore e quello di chi vive del suo lavoro, no.",
  "deregolamentazione": "Riduzione o eliminazione delle regole con cui lo Stato controlla un settore. In finanza, le regole su cosa le banche possono fare.",
  "pil": "Prodotto interno lordo: il valore di tutti i beni e servizi prodotti in un paese in un anno. Misura la dimensione della sua economia.",

  // ---------- Dubbi, conti e cavalli ----------
  "variabile casuale": "Una grandezza il cui valore dipende dal caso: per esempio il numero uscito da un dado o quanti soldati muoiono in un anno per un calcio di cavallo. La distribuzione di probabilità dice quanto è probabile ciascun valore.",
  "empiricamente": "Basandosi sull'osservazione e sui dati reali, e non solo sul ragionamento teorico.",
  "fluttuazioni statistiche": "Le variazioni casuali attorno al valore medio: da un anno all'altro il numero di eventi cambia senza che ci sia una causa particolare. Il problema è capire quando una variazione è ancora normale e quando è troppo grande per essere solo caso.",
  "guerra franco-prussiana": "Guerra combattuta nel 1870-71 tra la Francia di Napoleone III e la Prussia, alleata agli altri stati tedeschi. Finì con la vittoria prussiana e portò alla nascita dell'Impero tedesco.",
  "poissoniana": "Nome informale, usato in questo articolo, per la distribuzione di Poisson, dal matematico francese Siméon Denis Poisson (1781-1840).",
  "retrocarica": "Detto di un'arma da fuoco che si carica da dietro e non dalla bocca della canna, molto più rapida da ricaricare dei vecchi fucili.",
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
 
