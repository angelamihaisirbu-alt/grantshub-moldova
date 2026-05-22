// GrantsHub Moldova – Apeluri DESCHISE (verificate la 22 mai 2026)
// Structură: CALLS (apel concret cu deadline) + FUNDERS (info finanțator)
//
// Status logic (calculat în app.js):
//   - open: deadline > 14 zile sau rolling
//   - closing-soon: deadline ≤ 14 zile
//   - upcoming: opensOn > azi
//   - closed: deadline < azi (ascuns din listă)

const CALLS = [
    // ============ ODA – Apeluri 2026 (lansate aprilie 2026, rolling până la epuizare) ============
    {
        id: "oda-crestem-imm-2026",
        title: "CREȘTEM IMM 2026 – Modernizare tehnologică, digitalizare, tranziție ecologică",
        funderId: "oda",
        opensOn: "2026-04-08",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Rolling — până la epuizarea celor 100 aplicații disponibile",
        audiences: ["IMM"],
        topics: ["Antreprenoriat", "Digitalizare", "Eficiență energetică", "Mediu"],
        type: "Cofinantare",
        budgetTotal: "300 mil MDL (instrument total ODA)",
        budgetPerProject: "Variabil per submăsură (până la ~1.500.000 MDL)",
        eligibility: [
            "IMM înregistrate în Moldova conform Legii 179/2016",
            "100 aplicații disponibile, repartizate astfel:",
            "• 35 – modernizare tehnologică și eficiență energetică",
            "• 40 – transformare digitală",
            "• 25 – tranziție ecologică",
            "Cofinanțare obligatorie din partea aplicantului"
        ],
        description: "Principalul instrument de cofinanțare al ODA pentru 2026. Lansat 8 aprilie cu sprijinul UE (Reform Agenda), Băncii Mondiale (SBC), GIZ și Elveției.",
        url: "https://oda.md/ro/crestem-imm",
        verified: "2026-05-22",
        verifiedSource: "oda.md comunicat oficial 2026"
    },
    {
        id: "oda-femei-afaceri-2026",
        title: "Femei în Afaceri 2026 – Măsura 1",
        funderId: "oda",
        opensOn: "2026-04-08",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Rolling — 50 aplicații disponibile",
        audiences: ["IMM"],
        topics: ["Antreprenoriat", "Gen"],
        type: "Grant",
        budgetTotal: "Componentă a celor 300 mil MDL ODA",
        budgetPerProject: "Până la 165.000 MDL grant",
        eligibility: [
            "Femei antreprenoare cu IMM înregistrat în RM",
            "Sau care intenționează să lanseze o afacere (Măsura 1 – startup)",
            "Vârsta peste 18 ani",
            "50 aplicații disponibile în 2026"
        ],
        description: "Granturi nerambursabile pentru afaceri conduse de femei: startup, scalare, achiziție echipamente. Una dintre cele mai populare scheme ODA.",
        url: "https://oda.md/ro/programe/femei-in-afaceri",
        verified: "2026-05-22",
        verifiedSource: "oda.md comunicat oficial 2026"
    },
    {
        id: "oda-start-tineri-2026",
        title: "START pentru Tineri 2026",
        funderId: "oda",
        opensOn: "2026-04-20",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Rolling din 20 aprilie 2026",
        audiences: ["IMM"],
        topics: ["Antreprenoriat", "Tineret"],
        type: "Grant",
        budgetTotal: "Componentă a celor 300 mil MDL ODA",
        budgetPerProject: "Variabil",
        eligibility: [
            "Antreprenori cu vârsta între 18–35 ani",
            "IMM nou înființat (sub 24 luni) sau persoană fizică",
            "Instruire antreprenorială obligatorie ca parte a programului"
        ],
        description: "Suport pentru tineri antreprenori: instruire + grant pentru lansarea afacerii. Apel anual recurent.",
        url: "https://oda.md/ro/programe/start-pentru-tineri",
        verified: "2026-05-22",
        verifiedSource: "oda.md comunicat oficial 2026"
    },
    {
        id: "oda-pare-2026",
        title: "PARE 1+1 – Inițiative antreprenoriale ale migranților 2026",
        funderId: "oda",
        opensOn: "2026-04-20",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Rolling — disponibil pentru anumit număr de aplicații",
        audiences: ["IMM"],
        topics: ["Antreprenoriat", "Diaspora"],
        type: "Cofinantare",
        budgetTotal: "Componentă a celor 300 mil MDL ODA",
        budgetPerProject: "Până la 250.000 MDL grant + match 1:1",
        eligibility: [
            "Cetățeni RM cu experiență de muncă în străinătate (remitențe)",
            "Sau membri ai familiei beneficiari de remitențe",
            "Investiție în Moldova: fiecare 1 leu propriu este dublat cu 1 leu grant"
        ],
        description: "Programul flagship de diasporă al ODA. Bani din străinătate dublati cu grant ODA pentru afaceri lansate în Moldova.",
        url: "https://oda.md/ro/programe/pare",
        verified: "2026-05-22",
        verifiedSource: "oda.md comunicat oficial 2026"
    },
    {
        id: "oda-producatori-mici-2026",
        title: "Producători Mici 2026",
        funderId: "oda",
        opensOn: "2026-04-08",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Rolling — 35 aplicații disponibile",
        audiences: ["IMM"],
        topics: ["Antreprenoriat", "Agricultură"],
        type: "Cofinantare",
        budgetTotal: "Componentă a celor 300 mil MDL ODA",
        budgetPerProject: "Variabil",
        eligibility: [
            "Microîntreprinderi și producători mici",
            "Activitate de producție de bunuri",
            "35 aplicații disponibile în 2026"
        ],
        description: "Sprijin pentru producători mici de bunuri – echipamente, materii prime, dezvoltare capacitate de producție.",
        url: "https://oda.md/ro/programe",
        verified: "2026-05-22",
        verifiedSource: "oda.md comunicat oficial 2026"
    },
    {
        id: "oda-digital-startups-2026",
        title: "Inovații Digitale și Tech Startups 2026",
        funderId: "oda",
        opensOn: "2026-04-08",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Rolling — 70 aplicații disponibile",
        audiences: ["IMM"],
        topics: ["Antreprenoriat", "Digitalizare", "Tineret"],
        type: "Grant",
        budgetTotal: "Componentă a celor 300 mil MDL ODA",
        budgetPerProject: "Variabil",
        eligibility: [
            "Startup-uri tech și companii cu produse/servicii digitale",
            "Companii care dezvoltă soluții inovative (software, IoT, AI etc.)",
            "70 aplicații disponibile"
        ],
        description: "Susținere pentru startup-uri tech și soluții digitale inovative. Implementat cu suportul UE și GIZ.",
        url: "https://oda.md/ro/programe",
        verified: "2026-05-22",
        verifiedSource: "oda.md comunicat oficial 2026"
    },

    // ============ AIPA – Subvenții 2026 ============
    {
        id: "aipa-aggri-2026",
        title: "Proiectul AGGRI – Apel granturi sector agricol",
        funderId: "aipa",
        opensOn: "2026-04-15",
        deadline: "2026-05-29",
        deadlineType: "fixed",
        deadlineNote: "Termen final: 29 mai 2026, ora 17:00",
        audiences: ["IMM"],
        topics: ["Agricultură", "Dezvoltare rurală"],
        type: "Grant",
        budgetTotal: "Variabil",
        budgetPerProject: "Variabil per propunere",
        eligibility: [
            "Producători agricoli înregistrați în Moldova",
            "Cooperative agricole și grupuri de producători",
            "Procesatori produse agricole",
            "Condiții specifice publicate în ghidul AGGRI"
        ],
        description: "Apel pentru proiectul AGGRI (Agricultural Growth and Resilience). Ultimul reminder publicat de AIPA — termen 29 mai 2026.",
        url: "https://aipa.gov.md/aipa-reaminteste-despre-desfasurarea-apelului-in-cadrul-proiectului-aggri-pana-pe-29-mai-2026/",
        verified: "2026-05-22",
        verifiedSource: "aipa.gov.md comunicat 2026-05-15"
    },
    {
        id: "aipa-grupuri-producatori-2026",
        title: "Sprijin financiar pentru grupuri de producători agricoli",
        funderId: "aipa",
        opensOn: "2026-05-18",
        deadline: "2026-06-15",
        deadlineType: "fixed",
        deadlineNote: "Aplicare: 18 mai – 15 iunie 2026",
        audiences: ["IMM"],
        topics: ["Agricultură", "Dezvoltare rurală"],
        type: "Subventie",
        budgetTotal: "FNDAMR 2026",
        budgetPerProject: "Variabil – calculat pe valoarea producției comercializate",
        eligibility: [
            "Grupuri de producători agricoli recunoscute conform legislației",
            "Care au comercializat producție în perioada de referință",
            "Sprijin financiar calculat pe valoarea producției comercializate"
        ],
        description: "Subvenționare pentru valoarea producției comercializate de grupurile de producători. Apel anual recurent în mai-iunie.",
        url: "https://aipa.gov.md/comunicat-informativ-privind-acordarea-sprijinului-financiar-pentru-valoarea-productiei-comercializate-de-catre-grupul-de-producatori/",
        verified: "2026-05-22",
        verifiedSource: "aipa.gov.md comunicat 2026"
    },

    // ============ UNDP / GEF Small Grants ============
    {
        id: "gef-small-grants-2026",
        title: "GEF Small Grants Programme – Mediu și climă",
        funderId: "undp",
        opensOn: "2026-04-15",
        deadline: "2026-06-19",
        deadlineType: "fixed",
        deadlineNote: "Termen final: 19 iunie 2026, ora 16:30",
        audiences: ["ONG"],
        topics: ["Mediu", "Climă", "Apă & Sanitație"],
        type: "Grant",
        budgetTotal: "Programul global GEF",
        budgetPerProject: "Până la $75.000 (standard) / $150.000 (strategic)",
        eligibility: [
            "Organizații neguvernamentale înregistrate în Moldova",
            "Activitate dovedită în domeniile: biodiversitate, climă, gestionare deșeuri, ape internaționale, terenuri",
            "Cofinanțare obligatorie de minim 50%",
            "Durata proiectului: maxim 18 luni"
        ],
        description: "Programul de granturi mici al Facilității Globale pentru Mediu, implementat prin UNDP. Susține inițiative comunitare pe schimbări climatice, biodiversitate, gestionarea deșeurilor.",
        url: "https://www.undp.org/moldova/press-releases/grants-us150000-environmental-and-climate-projects-offered-small-grants-programme-global-environment-facility",
        verified: "2026-05-22",
        verifiedSource: "undp.org/moldova press release"
    },
    {
        id: "undp-climate-gender-2026",
        title: "Climate and Gender Practitioners' Community – Aplicații deschise",
        funderId: "undp",
        opensOn: "2026-05-01",
        deadline: "2026-05-29",
        deadlineType: "fixed",
        deadlineNote: "Termen final: 29 mai 2026, ora 23:59",
        audiences: ["ONG", "Public"],
        topics: ["Climă", "Gen", "Mediu"],
        type: "AT",
        budgetTotal: "Inițiativă UNDP cu Sweden și Norway",
        budgetPerProject: "Nu este grant direct — membership + AT + networking",
        eligibility: [
            "Practicieni din ONG-uri, instituții publice, mediu academic",
            "Experiență la intersecția climă-gen",
            "Disponibilitate de a participa la rețea regională"
        ],
        description: "Prima comunitate de practicieni climă-gen din Moldova. Acces la formare, mentoring, sub-granturi viitoare prin rețea.",
        url: "https://www.undp.org/moldova/press-releases/first-climate-and-gender-practitioners-community-launched-republic-moldova-support-sweden-norway-and-undp",
        verified: "2026-05-22",
        verifiedSource: "undp.org/moldova press release"
    },

    // ============ Societate civilă – CONTACT, FEE etc. ============
    {
        id: "contact-osc-2026",
        title: "CONTACT – Granturi pentru OSC locale și regionale",
        funderId: "fee",
        opensOn: "2026-04-15",
        deadline: "2026-05-26",
        deadlineType: "fixed",
        deadlineNote: "Termen final: 26 mai 2026 (info session: 12 mai)",
        audiences: ["ONG"],
        topics: ["Democrație", "Dezvoltare regională", "Coeziune socială"],
        type: "Grant",
        budgetTotal: "Componentă a programului FEE/USAID",
        budgetPerProject: "Până la 20.000 EUR",
        eligibility: [
            "OSC-uri locale și regionale înregistrate în RM",
            "Minim 3 ani de experiență de implementare",
            "Proiecte de 18–24 luni (start iulie 2026)",
            "Focus pe dezvoltarea organizațională și reziliență"
        ],
        description: "Grant Competition de la Centrul CONTACT pentru consolidarea capacităților OSC. Implementat în cadrul Comunitatea Mea (USAID/FEE).",
        url: "https://civic.md/anunturi/granturi/88490-apel-de-propuneri-pentru-organizatiile-societatii-civile-din-republica-moldova-2026.html",
        verified: "2026-05-22",
        verifiedSource: "civic.md anunț 2026"
    },

    // ============ Apeluri rolling / recurente verificate ============
    {
        id: "ned-rolling-2026",
        title: "NED – Granturi anuale pentru ONG-uri democratice",
        funderId: "ned",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apel deschis permanent (cicluri trimestriale)",
        audiences: ["ONG"],
        topics: ["Democrație", "Drepturile omului", "Mass-media", "Justiție"],
        type: "Grant",
        budgetTotal: "Bugetul anual NED",
        budgetPerProject: "10.000 – 75.000 USD (mediană ~50k)",
        eligibility: [
            "ONG-uri locale înregistrate în Moldova",
            "Mass-media independentă",
            "Aplicare directă online — nu necesită partener din SUA",
            "Evaluare în cicluri trimestriale (martie, iunie, septembrie, decembrie)"
        ],
        description: "National Endowment for Democracy — finanțator american bipartizan. Apel deschis pe tot parcursul anului cu evaluări trimestriale.",
        url: "https://www.ned.org/apply-for-grant",
        verified: "2026-05-22",
        verifiedSource: "ned.org"
    },
    {
        id: "visegrad-rolling-2026",
        title: "Visegrad Fund – Granturi standard și mici",
        funderId: "visegrad",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Două termene anuale: 1 iunie 2026 și 1 octombrie 2026",
        audiences: ["ONG", "Public", "APL"],
        topics: ["Cultură", "Educație", "Tineret", "Democrație", "Mediu"],
        type: "Grant",
        budgetTotal: "Bugetul anual al fondului V4",
        budgetPerProject: "6.000 – 25.000+ EUR (Small/Standard); Visegrad+ mai mari",
        eligibility: [
            "Parteneriate cu minim 3 țări V4 (CZ, SK, PL, HU) + Moldova",
            "Aplicant principal poate fi din Moldova",
            "ONG-uri, instituții publice, universități, școli",
            "Aplicare online prin my.visegradfund.org"
        ],
        description: "Fondul Internațional Vișegrad. Termen apropiat: 1 iunie 2026 pentru următoarea sesiune.",
        url: "https://www.visegradfund.org/apply/grants/",
        verified: "2026-05-22",
        verifiedSource: "visegradfund.org"
    },
    {
        id: "bst-rolling-2026",
        title: "Black Sea Trust – Granturi cooperare regională",
        funderId: "bst",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apel deschis permanent (procesare în cicluri)",
        audiences: ["ONG"],
        topics: ["Democrație", "Dezvoltare regională", "Mass-media", "Tineret"],
        type: "Grant",
        budgetTotal: "Bugetul anual BST",
        budgetPerProject: "5.000 – 50.000 USD",
        eligibility: [
            "ONG-uri din regiunea extinsă a Mării Negre (inclusiv Moldova)",
            "Proiecte cu componentă transfrontalieră / regională",
            "Focus pe cooperare societate civilă, dialog politic, jurnalism"
        ],
        description: "Black Sea Trust (German Marshall Fund). Apel deschis permanent — aplicații evaluate în lotul lunar următor.",
        url: "https://www.gmfus.org/black-sea-trust",
        verified: "2026-05-22",
        verifiedSource: "gmfus.org/black-sea-trust"
    },

    // ============ Apeluri așteptate (calendar publicat) ============
    {
        id: "aipa-fndamr-toamna-2026",
        title: "AIPA – FNDAMR Subvenții post-investiționale (toamnă 2026)",
        funderId: "aipa",
        opensOn: "2026-08-01",
        deadline: "2026-10-31",
        deadlineType: "expected",
        deadlineNote: "Apel anual recurent — așteptat august–octombrie 2026",
        audiences: ["IMM", "APL"],
        topics: ["Agricultură", "Dezvoltare rurală"],
        type: "Subventie",
        budgetTotal: "FNDAMR – buget anual",
        budgetPerProject: "Compensare 30–50% din investiția eligibilă",
        eligibility: [
            "Producători agricoli (PF, GȚ, SRL, cooperative)",
            "Procesatori produse agricole",
            "Investiție eligibilă realizată anterior depunerii cererii",
            "Categorii: mașini agricole, irigare, plantații, sere, ferme zootehnice"
        ],
        description: "Apel anual recurent AIPA pentru subvenții post-investiționale. Datele exacte se publică în Monitorul Oficial cu 20+ zile înainte de deschidere.",
        url: "https://aipa.gov.md",
        verified: "2026-05-22",
        verifiedSource: "AIPA — apel anual recurent (Regulament FNDAMR)"
    },

    // ============ EU / Cooperare transfrontalieră ============
    {
        id: "interreg-romd-2026",
        title: "INTERREG NEXT Romania – Republica Moldova – Apel 2026",
        funderId: "interreg",
        opensOn: "2026-04-01",
        deadline: "2026-07-31",
        deadlineType: "expected",
        deadlineNote: "Apel 2 așteptat să se închidă în iulie 2026 — verifică ro-md.net",
        audiences: ["APL", "Public", "ONG"],
        topics: ["Dezvoltare regională", "Mediu", "Sănătate", "Cultură", "Apă & Sanitație"],
        type: "Cofinantare",
        budgetTotal: "85 mil EUR pentru perioada 2021–2027",
        budgetPerProject: "100.000 – 5.000.000 EUR",
        eligibility: [
            "APL și instituții publice din zona eligibilă (raioane RM frontaliere + județe RO frontaliere)",
            "ONG-uri din zona programului",
            "Parteneriate obligatorii RO + MD (minim un partener din fiecare țară)",
            "Universități și centre de cercetare"
        ],
        description: "Program de cooperare transfrontalieră UE pentru RO-MD. Confirmă termenul exact pe portalul oficial.",
        url: "https://ro-md.net",
        verified: "2026-05-22",
        verifiedSource: "ro-md.net — apel 2 verificat pe site"
    },

    // ============ Cultura ============
    {
        id: "mc-cultura-2026-2",
        title: "MC – Programul de finanțare proiecte culturale (apel toamnă 2026)",
        funderId: "mc",
        opensOn: "2026-09-01",
        deadline: "2026-10-31",
        deadlineType: "expected",
        deadlineNote: "Apel anual recurent — verifică mc.gov.md pentru data exactă",
        audiences: ["ONG", "Public", "APL", "IMM"],
        topics: ["Cultură", "Patrimoniu", "Educație"],
        type: "Grant",
        budgetTotal: "Buget anual Ministerul Culturii",
        budgetPerProject: "50.000 – 3.000.000 MDL",
        eligibility: [
            "Operatori culturali (ONG, SRL, instituții publice de cultură)",
            "Uniuni de creație",
            "Producători de film (linia CNC)",
            "Proiecte în domeniile: arte vizuale, scenice, muzică, edituri, festivaluri"
        ],
        description: "Concurs anual al Ministerului Culturii pentru proiecte culturale. Datele exacte se publică pe mc.gov.md la lansarea apelului.",
        url: "https://mc.gov.md",
        verified: "2026-05-22",
        verifiedSource: "Apel anual recurent MC"
    },

    // ============ Tekwill / Tech ============
    {
        id: "tekwill-fund-2026",
        title: "Tekwill Innovation Fund – Startup tech grants",
        funderId: "tekwill",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apeluri în cohort-uri — verifică tekwill.md pentru următoarea cohortă",
        audiences: ["IMM"],
        topics: ["Antreprenoriat", "Digitalizare", "Tineret", "Inovare"],
        type: "Grant",
        budgetTotal: "Fond rotativ USAID/Sida + ATIC",
        budgetPerProject: "5.000 – 100.000 USD",
        eligibility: [
            "Startup-uri tech înregistrate în Moldova",
            "Produs/serviciu cu componentă tehnologică",
            "Echipă activă (minim 2 fondatori)",
            "Idee validată / MVP existent"
        ],
        description: "Programul de finanțare pentru startup-uri tech. Implementat prin Tekwill Innovation Hub și ATIC.",
        url: "https://tekwill.md",
        verified: "2026-05-22",
        verifiedSource: "tekwill.md"
    },

    // ============ Eficienta energetica ============
    {
        id: "aee-cladiri-publice-2026",
        title: "AEE – Eficiență energetică clădiri publice (apel toamnă 2026)",
        funderId: "aee",
        opensOn: "2026-09-01",
        deadline: "2026-11-30",
        deadlineType: "expected",
        deadlineNote: "Apel anual recurent — verifică aee.gov.md",
        audiences: ["APL", "Public"],
        topics: ["Energie", "Eficiență energetică", "Climă"],
        type: "Cofinantare",
        budgetTotal: "Buget anual FEE",
        budgetPerProject: "200.000 – 15.000.000 MDL",
        eligibility: [
            "Autorități publice locale (primării, consilii raionale)",
            "Instituții publice: școli, grădinițe, centre culturale",
            "Cofinanțare obligatorie din partea APL",
            "Studiu de fezabilitate energetic anexat"
        ],
        description: "Programul anual al Agenției pentru Eficiență Energetică pentru izolarea termică a clădirilor publice și iluminat LED. Date exacte: aee.gov.md.",
        url: "https://aee.gov.md",
        verified: "2026-05-22",
        verifiedSource: "Apel anual recurent AEE"
    }
];

// ============ FUNDERS – Catalog finanțatori activi ============
const FUNDERS = {
    oda: {
        id: "oda",
        name: "ODA – Organizația pentru Dezvoltarea Antreprenoriatului",
        short: "ODA",
        logoColor: "green",
        origin: "National",
        originLabel: "Național · Min. Dezvoltării Economice",
        description: "Principala agenție guvernamentală pentru sprijinul IMM-urilor. În 2026: 300 milioane MDL pentru 420 aplicații pe diverse instrumente.",
        website: "https://oda.md"
    },
    aipa: {
        id: "aipa",
        name: "AIPA – Agenția de Intervenție și Plăți pentru Agricultură",
        short: "AIPA",
        logoColor: "green",
        origin: "National",
        originLabel: "Național · Subvenții agricole",
        description: "Implementează FNDAMR. Subvenții pentru fermieri, procesatori, cooperative; dezvoltare rurală LEADER.",
        website: "https://aipa.gov.md"
    },
    aee: {
        id: "aee",
        name: "Agenția pentru Eficiență Energetică",
        short: "AEE",
        logoColor: "yellow",
        origin: "National",
        originLabel: "Național · Min. Energiei",
        description: "Administrează Fondul pentru Eficiență Energetică. Suport pentru clădiri publice, iluminat LED, surse regenerabile.",
        website: "https://aee.gov.md"
    },
    mc: {
        id: "mc",
        name: "Ministerul Culturii al RM",
        short: "MC",
        logoColor: "red",
        origin: "National",
        originLabel: "Național · Min. Culturii",
        description: "Concurs anual de finanțare proiecte culturale (arte, festivaluri, edituri, patrimoniu, cinematografie prin CNC).",
        website: "https://mc.gov.md"
    },
    fee: {
        id: "fee",
        name: "Fundația Est-Europeană / CONTACT",
        short: "FEE",
        logoColor: "blue",
        origin: "Fundatie",
        originLabel: "Re-granting · USAID/Sida/EU",
        description: "Implementator-cheie de re-granting în Moldova (USAID Comunitatea Mea, Media Enabling Democracy, EU4Civil Society).",
        website: "https://eef.md"
    },
    undp: {
        id: "undp",
        name: "UNDP Moldova",
        short: "UNDP",
        logoColor: "blue",
        origin: "ONU",
        originLabel: "ONU · Dezvoltare",
        description: "Programul ONU pentru Dezvoltare. Implementează GEF Small Grants și alte programe pe guvernare, climă, gen, dezvoltare locală.",
        website: "https://www.undp.org/moldova"
    },
    ned: {
        id: "ned",
        name: "National Endowment for Democracy",
        short: "NED",
        logoColor: "navy",
        origin: "Fundatie",
        originLabel: "Fundație · SUA",
        description: "Fundație americană bipartizan. Granturi pentru democrație, drepturile omului, libertatea presei. Apel deschis cu cicluri trimestriale.",
        website: "https://www.ned.org"
    },
    visegrad: {
        id: "visegrad",
        name: "Visegrad Fund",
        short: "V4",
        logoColor: "blue",
        origin: "Fundatie",
        originLabel: "Fundație · Grup Vișegrad",
        description: "Fondul Internațional Vișegrad (CZ, SK, PL, HU). Granturi pentru cooperare V4 + Moldova.",
        website: "https://www.visegradfund.org"
    },
    bst: {
        id: "bst",
        name: "Black Sea Trust for Regional Cooperation",
        short: "BST",
        logoColor: "blue",
        origin: "Fundatie",
        originLabel: "Fundație · German Marshall Fund",
        description: "Granturi pentru cooperare regională în bazinul Mării Negre.",
        website: "https://www.gmfus.org/black-sea-trust"
    },
    interreg: {
        id: "interreg",
        name: "INTERREG NEXT România – Republica Moldova",
        short: "RO-MD",
        logoColor: "blue",
        origin: "UE",
        originLabel: "UE · Cooperare transfrontalieră",
        description: "Program de cooperare transfrontalieră RO–MD 2021-2027 (~85 mil €).",
        website: "https://ro-md.net"
    },
    tekwill: {
        id: "tekwill",
        name: "Tekwill (Innovation Hub)",
        short: "TKW",
        logoColor: "blue",
        origin: "Bilateral",
        originLabel: "USAID/Sida + ATIC",
        description: "Hub de inovare ICT din Chișinău. Granturi pentru startup-uri tech.",
        website: "https://tekwill.md"
    },
    eu: {
        id: "eu",
        name: "EU Delegation Moldova",
        short: "EU",
        logoColor: "blue",
        origin: "UE",
        originLabel: "UE · Delegația UE",
        description: "Apeluri ample pentru societatea civilă, reforme, drepturile omului — și sub-granturi prin parteneri implementatori.",
        website: "https://www.eeas.europa.eu/delegations/moldova"
    }
};

// ============ Topics ============
const TOPICS = {
    "Antreprenoriat": "💼",
    "Agricultură": "🌾",
    "Dezvoltare rurală": "🏡",
    "Mediu": "🌳",
    "Climă": "🌍",
    "Energie": "⚡",
    "Eficiență energetică": "🔋",
    "Educație": "🎓",
    "Cercetare": "🔬",
    "Inovare": "💡",
    "Digitalizare": "💻",
    "Cultură": "🎭",
    "Patrimoniu": "🏛️",
    "Sănătate": "🏥",
    "Democrație": "🗳️",
    "Drepturile omului": "⚖️",
    "Justiție": "⚖️",
    "Mass-media": "📰",
    "Tineret": "👥",
    "Gen": "♀",
    "Integrare europeană": "🇪🇺",
    "Dezvoltare regională": "🗺️",
    "Infrastructură": "🏗️",
    "Coeziune socială": "🤝",
    "Combaterea corupției": "🔍",
    "Diaspora": "✈️",
    "Refugiați": "🆘",
    "Apă & Sanitație": "💧",
    "Guvernare": "🏛️"
};

// Export pentru localStorage admin override
window.GRANTSHUB_DATA = { CALLS, FUNDERS, TOPICS };
