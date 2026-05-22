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
        budgetTotal: "Componentă a programului FEE",
        budgetPerProject: "Până la 20.000 EUR",
        eligibility: [
            "OSC-uri locale și regionale înregistrate în RM",
            "Minim 3 ani de experiență de implementare",
            "Proiecte de 18–24 luni (start iulie 2026)",
            "Focus pe dezvoltarea organizațională și reziliență"
        ],
        description: "Grant Competition de la Centrul CONTACT pentru consolidarea capacităților OSC. Implementat de Fundația Est-Europeană cu suport Sida/UE (după închiderea oficiului USAID Moldova).",
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
        budgetTotal: "Fond rotativ Sida + UE + ATIC (după închiderea oficiului USAID Moldova)",
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
    },

    // ============ OIM / IOM Moldova ============
    {
        id: "iom-csos-rolling-2026",
        title: "OIM Moldova – Granturi pentru OSC (migrație, anti-trafic, reforme MAI, integrare UE)",
        funderId: "iom",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apeluri publicate periodic pe moldova.iom.int/grants (ciclu multiplu/an)",
        audiences: ["ONG", "APL", "Public"],
        topics: ["Diaspora", "Refugiați", "Integrare europeană", "Drepturile omului", "Gen"],
        type: "Grant",
        budgetTotal: "Variabil per apel",
        budgetPerProject: "5.000 – 300.000 USD",
        eligibility: [
            "ONG-uri locale și internaționale înregistrate în Moldova",
            "APL pentru servicii pentru migranți reveniți / refugiați",
            "Diaspora pentru proiecte comunitare",
            "Recipienți pentru sub-grants pe componente specifice (anti-trafic, integrare UE, reforme MAI)",
            "Aplicare prin portalul UN Partner Portal sau direct la moldova.iom.int/grants"
        ],
        description: "OIM/IOM Moldova publică multiple apeluri pe an: reintegrarea migranților reveniți, răspuns refugiați Ucraina, anti-trafic de persoane, sprijin reforme MAI, diaspora engagement. Apelurile pentru 2026: CGA-MD10-2025-001 (jan), CEI-MD10-2025-005 (mar) — închise; așteptăm runde noi.",
        url: "https://moldova.iom.int/grants",
        verified: "2026-05-22",
        verifiedSource: "moldova.iom.int (apeluri recurente verificate)"
    },

    // ============ GIZ Moldova ============
    {
        id: "giz-eu4business-2026",
        title: "GIZ Moldova – Cofinanțare prin EU4Business (Innovative SMEs) și SBC",
        funderId: "giz",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apeluri implementate prin ODA, EU4Business — verifică oda.md și eu4business.md",
        audiences: ["IMM", "APL", "Public"],
        topics: ["Antreprenoriat", "Eficiență energetică", "Dezvoltare regională", "Educație", "Digitalizare"],
        type: "Cofinantare",
        budgetTotal: "Componente multiple BMZ + UE",
        budgetPerProject: "Variabil per program",
        eligibility: [
            "IMM-uri prin programele EU4Business (acces via ODA: CREȘTEM IMM, Eficiență Energetică)",
            "APL implicate în MSPL – Modernizarea Serviciilor Publice Locale (apă, deșeuri, eficiență energetică)",
            "Instituții publice și școli profesionale (VET in Moldova)",
            "Proiecte sub umbrela FACE (Facilitating EU Accession through Coordination and Engagement)"
        ],
        description: "Agenția germană GIZ implementează în Moldova programe ample finanțate de BMZ și UE: EU4Business: Innovative SMEs (cofinanțare prin ODA), Strong Enterprises & Communities (SBC), MSPL pentru APL, VET in Moldova, FACE pentru aderarea la UE. Aplicările concrete trec prin parteneri implementatori (ODA, ADR-uri, instituții publice).",
        url: "https://www.giz.de/en/worldwide/304.html",
        verified: "2026-05-22",
        verifiedSource: "giz.de + eu4business.md (programe în implementare 2026)"
    },

    // ============ Ambasada Norvegiei ============
    {
        id: "norway-small-project-2026",
        title: "Ambasada Norvegiei – Small Project Funding + Nansen Programme",
        funderId: "norway",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apeluri deschise prin ambasadă pe parcursul anului — contactați ambasada",
        audiences: ["ONG", "Public", "APL"],
        topics: ["Democrație", "Mass-media", "Drepturile omului", "Integrare europeană", "Energie", "Educație"],
        type: "Grant",
        budgetTotal: "NOK 350 milioane pentru Moldova în 2026",
        budgetPerProject: "Small grants: 10.000 – 200.000 NOK; programe mari prin parteneri",
        eligibility: [
            "ONG-uri locale active în democrație, mass-media, integrare europeană",
            "Organizații care combat dezinformarea",
            "Inițiative pentru consolidarea societății civile",
            "Proiecte pentru securitate energetică și bună guvernare",
            "Aplicare directă la ambasadă (din toamna 2026 – ambasadă completă cu rezident)"
        ],
        description: "Norvegia a alocat NOK 350 milioane (~30 mil EUR) pentru Moldova în 2026 prin Programul Nansen extins. Focus: stabilitate, democrație, integrare UE, combaterea dezinformării, securitate energetică, mass-media independentă. Ambasada Norvegiei la Chișinău operează din 2024 și devine ambasadă completă în toamna 2026.",
        url: "https://www.norway.no/en/moldova/",
        verified: "2026-05-22",
        verifiedSource: "regjeringen.no + norway.no/moldova (anunț alocare 2026)"
    },

    // ============ CFLI – Canada ============
    {
        id: "canada-cfli-2027",
        title: "Canada Fund for Local Initiatives (CFLI) – Apel 2027 așteptat",
        funderId: "canada",
        opensOn: "2027-02-01",
        deadline: "2027-04-15",
        deadlineType: "expected",
        deadlineNote: "Apelul 2026 (deadline 17 aprilie) s-a închis. Următorul apel 2027 așteptat: ianuarie-aprilie 2027.",
        audiences: ["ONG", "Public"],
        topics: ["Democrație", "Drepturile omului", "Gen", "Coeziune socială"],
        type: "Grant",
        budgetTotal: "CAD ~600.000 alocare anuală pentru Moldova",
        budgetPerProject: "CAD 30.000 – 60.000 (până la 100.000 excepțional)",
        eligibility: [
            "ONG-uri locale și internaționale care lucrează în Moldova",
            "Instituții academice non-profit",
            "Autorități locale (pentru proiecte specifice)",
            "Trei priorități tematice: Democratic Governance & Human Rights, Peace & Security, Inclusive Growth",
            "Cross-cutting: egalitatea de gen și împuternicirea femeilor",
            "Aplicații în engleză sau franceză",
            "Proiecte preferate în afara Chișinăului sau pe ambele maluri ale Nistrului"
        ],
        description: "Canada Fund for Local Initiatives — program anual al Global Affairs Canada. Proiecte mici-scale, high-impact. Apelul 2026 a fost CAD 30.000–60.000 cu deadline 17 aprilie 2026 (CLOSED). Următorul ciclu: început 2027. Contact: cflimoldova@gmail.com.",
        url: "https://www.international.gc.ca/world-monde/funding-financement/cfli-fcil/moldova.aspx",
        verified: "2026-05-22",
        verifiedSource: "international.gc.ca (anunț anual recurent)"
    },

    // ============ INTERREG Black Sea Basin ============
    {
        id: "interreg-bsb-2026",
        title: "INTERREG NEXT Bazinul Mării Negre (BSB) – Apel 2",
        funderId: "interreg-bsb",
        opensOn: "2026-03-01",
        deadline: "2026-09-30",
        deadlineType: "expected",
        deadlineNote: "Programul 2021–2027. Apelul 2 așteptat în 2026 — verifică blacksea-cbc.net",
        audiences: ["APL", "Public", "ONG", "IMM"],
        topics: ["Mediu", "Dezvoltare regională", "Climă", "Antreprenoriat", "Apă & Sanitație"],
        type: "Cofinantare",
        budgetTotal: "~239 mil EUR pentru 2021–2027",
        budgetPerProject: "200.000 – 1.500.000 EUR",
        eligibility: [
            "Moldova e țară parteneră în BSB 2021–2027",
            "APL, instituții publice, ONG-uri, IMM-uri, universități din Moldova",
            "Parteneriate cu țări din bazinul Mării Negre (Bulgaria, România, Grecia, Turcia, Ucraina, Georgia, Armenia)",
            "Minim 2 țări partenere obligatoriu",
            "Cofinanțare 8% pentru beneficiari din Moldova"
        ],
        description: "Cooperare transfrontalieră în bazinul Mării Negre — comerț, antreprenoriat, mediu, biodiversitate, gestionarea deșeurilor marine, turism. Moldova este țară parteneră eligibilă (nu doar partener tehnic).",
        url: "https://blacksea-cbc.net",
        verified: "2026-05-22",
        verifiedSource: "blacksea-cbc.net (program activ)"
    },

    // ============ Horizon Europe ============
    {
        id: "horizon-europe-2026",
        title: "Horizon Europe – Cercetare & Inovare (Moldova țară asociată)",
        funderId: "horizon",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apeluri publicate continuu pe EU Funding & Tenders Portal — calendar 2026 disponibil",
        audiences: ["Public", "ONG", "IMM"],
        topics: ["Cercetare", "Inovare", "Digitalizare", "Climă", "Sănătate", "Energie"],
        type: "Grant",
        budgetTotal: "95.5 mld EUR (programul total 2021–2027)",
        budgetPerProject: "150.000 – 10.000.000 EUR per proiect",
        eligibility: [
            "Moldova e țară asociată din 2022 — entitățile aplică în aceleași condiții ca statele membre UE",
            "Universități, institute publice și private de cercetare",
            "IMM-uri inovative (cluster EIC Accelerator)",
            "ONG-uri în consorții (anumite pilare)",
            "Cercetători individuali — Marie Skłodowska-Curie Actions",
            "Înregistrare PIC obligatorie pe portal"
        ],
        description: "Cel mai mare program de cercetare al UE. Moldova are acces complet ca țară asociată. 3 pilari: Excellent Science (ERC, MSCA), Global Challenges (clustere tematice), Innovative Europe (EIC, EIT). Punct contact național: ANCD.",
        url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/home",
        verified: "2026-05-22",
        verifiedSource: "ancd.gov.md + EU Funding & Tenders Portal"
    },

    // ============ Erasmus+ ============
    {
        id: "erasmus-plus-2026",
        title: "Erasmus+ – Educație, formare, tineret, sport",
        funderId: "erasmus",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apeluri anuale cu termene multiple (CBHE, Youth, Jean Monnet, KA1/KA2) — vezi erasmusplus.md",
        audiences: ["Public", "ONG", "APL"],
        topics: ["Educație", "Tineret", "Cercetare", "Cultură"],
        type: "Grant",
        budgetTotal: "26.2 mld EUR (programul total 2021–2027)",
        budgetPerProject: "30.000 – 1.000.000 EUR per proiect",
        eligibility: [
            "Moldova e țară parteneră în Erasmus+",
            "Universități și școli (CBHE, KA1 mobilități, KA2 parteneriate)",
            "Organizații de tineret și ONG-uri educaționale",
            "Instituții de formare profesională (VET)",
            "Autorități publice cu competențe în educație",
            "Voluntariat ESC (European Solidarity Corps)"
        ],
        description: "Programul UE pentru educație, formare, tineret și sport. Moldova participă activ: Capacity Building in Higher Education (CBHE), Youth in Action, Jean Monnet, parteneriate strategice. Punct contact național: erasmusplus.md.",
        url: "https://erasmusplus.md",
        verified: "2026-05-22",
        verifiedSource: "erasmusplus.md (NEO Moldova activ)"
    },

    // ============ Creative Europe ============
    {
        id: "creative-europe-2026",
        title: "Creative Europe – Cultură & Audiovizual (Moldova țară participantă)",
        funderId: "creative",
        opensOn: "2026-01-01",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Apeluri pe CULTURE, MEDIA și CROSS-SECTORAL pe parcursul anului — verifică EU Funding & Tenders",
        audiences: ["ONG", "IMM", "Public"],
        topics: ["Cultură", "Patrimoniu", "Mass-media"],
        type: "Grant",
        budgetTotal: "2.44 mld EUR (program total 2021–2027)",
        budgetPerProject: "60.000 – 2.000.000 EUR per proiect",
        eligibility: [
            "Moldova e țară participantă din 2022",
            "Operatori culturali (ONG, SRL din sector cultural, instituții publice)",
            "Edituri pentru traduceri literare",
            "Producători de film, festivaluri, distribuitori",
            "Consortii cu minim 3 țări participante (pentru Cooperation Projects)"
        ],
        description: "Programul UE pentru sectoarele culturale și creative. 3 componente: Culture (cooperation, networks, platforms), MEDIA (audiovizual, festivaluri, training), Cross-sectoral (innovation, media literacy).",
        url: "https://culture.ec.europa.eu/creative-europe",
        verified: "2026-05-22",
        verifiedSource: "Creative Europe Desk Moldova"
    },

    // ============ Primării municipale ============
    {
        id: "primaria-chisinau-buget-civil-2027",
        title: "Buget Civil Chișinău – Ediția 2027 (apel așteptat ianuarie–februarie 2027)",
        funderId: "primaria-chisinau",
        opensOn: "2027-01-01",
        deadline: "2027-02-28",
        deadlineType: "expected",
        deadlineNote: "Apel anual recurent. Ediția 2026 s-a închis 28 februarie 2026. Următorul apel: ianuarie–februarie 2027.",
        audiences: ["ONG", "Public", "IMM"],
        topics: ["Cultură", "Educație", "Eficiență energetică", "Infrastructură", "Coeziune socială", "Tineret"],
        type: "Grant",
        budgetTotal: "Buget anual municipal Chișinău",
        budgetPerProject: "Proiecte mici: până la 100.000 MDL · Proiecte mari: până la 300.000 MDL",
        eligibility: [
            "Cetățeni rezidenți în Chișinău (peste 18 ani)",
            "Persoane juridice (ONG-uri, asociații, întreprinderi) cu sediul în Chișinău",
            "Cofinanțare: 1% pentru persoane fizice, 20% pentru persoane juridice",
            "100 semnături minim pentru proiecte mici, 200 pentru proiecte mari",
            "Domenii: amenajare spații publice, mobilitate urbană, infrastructură culturală/socială, tehnologii inovative, eficiență energetică, educație, cultură, artă, sport"
        ],
        description: "Mecanism de buget participativ al Primăriei Chișinău: cetățenii propun proiecte → comunitatea votează → primăria implementează. Din 2021, peste 50 proiecte realizate. Email aplicare: bugetcivil@pmc.md.",
        url: "https://www.chisinau.md/ro/buget-civil-chisinau-20860.html",
        verified: "2026-05-22",
        verifiedSource: "chisinau.md (program anual recurent)"
    },
    {
        id: "balti-capitala-tineretului-2026",
        title: "Bălți – Capitala Tineretului 2026 (Programul Granturi pentru Tineri)",
        funderId: "primaria-balti",
        opensOn: "2026-05-18",
        deadline: "2026-12-31",
        deadlineType: "rolling",
        deadlineNote: "Înregistrare program: 14 mai 2026 (închis). Granturile concrete se finanțează pe parcursul anului — verifică balti.md / tineret.gov.md",
        audiences: ["ONG"],
        topics: ["Tineret", "Educație", "Cultură", "Coeziune socială", "Dezvoltare regională"],
        type: "Grant",
        budgetTotal: "4.000.000 MDL pentru programul anual",
        budgetPerProject: "Variabil (minim 10 inițiative locale finanțate)",
        eligibility: [
            "Tineri (18–35 ani) din mun. Bălți și nordul țării (11 raioane)",
            "ONG-uri de tineret și grupuri de inițiativă",
            "60 participanți formați în redactarea proiectelor",
            "Minim 10 inițiative locale finanțate și implementate",
            "Program în parteneriat cu Agenția Națională pentru Tineret + MEC"
        ],
        description: "Bălți a fost desemnat Capitala Tineretului Moldovei pentru 2026. 4 milioane MDL alocate pentru sprijinirea inițiativelor de tineret prin instruire + granturi + evenimente. Implementator local: DITS Bălți + Agenția Națională pentru Tineret.",
        url: "https://balti.md",
        verified: "2026-05-22",
        verifiedSource: "tineret.gov.md + balti.md (program 2026 activ)"
    },

    // ============ US Embassy – Democracy Commission ============
    {
        id: "us-embassy-democracy-2026",
        title: "Ambasada SUA – Democracy Commission Small Grants (anual recurent)",
        funderId: "usembassy",
        opensOn: "2026-09-01",
        deadline: "2026-11-30",
        deadlineType: "expected",
        deadlineNote: "Apel anual recurent — așteptat toamnă 2026, verifică md.usembassy.gov",
        audiences: ["ONG"],
        topics: ["Democrație", "Drepturile omului", "Tineret", "Gen", "Mass-media"],
        type: "Grant",
        budgetTotal: "Variabil anual",
        budgetPerProject: "10.000 – 50.000 USD",
        eligibility: [
            "ONG-uri și organizații non-profit înregistrate în Moldova (inclusiv think-tanks)",
            "Trei priorități anuale: drepturi muncă/protecția copilului, participare politică echitabilă, drepturile LGBTQI+",
            "Statement of Interest la primul pas, apoi propunere completă",
            "Aplicare prin grants.gov + email direct la ambasadă"
        ],
        description: "U.S. Embassy Chișinău operează Democracy Commission Small Grants Program — un mecanism flexibil pentru proiecte durabile care dezvoltă societatea civilă. Implementat în trecut cu deadline-uri martie-mai. Continuat în 2026.",
        url: "https://md.usembassy.gov/democracy-commission-small-grants-program/",
        verified: "2026-05-22",
        verifiedSource: "md.usembassy.gov (program continuat anual)"
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
        originLabel: "Re-granting · Sida / UE",
        description: "Implementator-cheie de re-granting în Moldova (Media Enabling Democracy, EU4Civil Society, continuă programele anterior co-finanțate de USAID în Moldova).",
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
        originLabel: "Sida + UE + ATIC",
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
    },
    iom: {
        id: "iom",
        name: "OIM / IOM Moldova",
        short: "OIM",
        logoColor: "blue",
        origin: "ONU",
        originLabel: "ONU · Migrație",
        description: "Organizația Internațională pentru Migrație. Apeluri multiple/an pentru ONG-uri și APL: anti-trafic, integrare migranți reveniți, răspuns refugiați, reforme MAI, integrare UE.",
        website: "https://moldova.iom.int/grants"
    },
    giz: {
        id: "giz",
        name: "GIZ Moldova",
        short: "GIZ",
        logoColor: "red",
        origin: "Bilateral",
        originLabel: "Bilateral · Germania (BMZ)",
        description: "Agenția germană de dezvoltare. Implementează în Moldova EU4Business, MSPL, VET, FACE — finanțare BMZ + UE. Aplicarea trece prin parteneri implementatori (ODA, ADR-uri).",
        website: "https://www.giz.de/en/worldwide/304.html"
    },
    norway: {
        id: "norway",
        name: "Ambasada Norvegiei la Chișinău",
        short: "NOR",
        logoColor: "red",
        origin: "Bilateral",
        originLabel: "Bilateral · Norvegia",
        description: "Ambasada Norvegiei (devine ambasadă completă în toamna 2026). NOK 350 mil pentru Moldova în 2026 prin Nansen Programme: democrație, mass-media, securitate energetică, anti-dezinformare.",
        website: "https://www.norway.no/en/moldova/"
    },
    canada: {
        id: "canada",
        name: "Ambasada Canadei – CFLI",
        short: "CAN",
        logoColor: "red",
        origin: "Bilateral",
        originLabel: "Bilateral · Canada (Global Affairs)",
        description: "Canada Fund for Local Initiatives. Apel anual prin Global Affairs Canada — proiecte mici-scale pentru ONG-uri pe democrație, pace/securitate, creștere incluzivă + gender integrat.",
        website: "https://www.international.gc.ca/world-monde/funding-financement/cfli-fcil/moldova.aspx"
    },
    usembassy: {
        id: "usembassy",
        name: "Ambasada SUA la Chișinău",
        short: "USA",
        logoColor: "navy",
        origin: "Bilateral",
        originLabel: "Bilateral · SUA (Ambasadă)",
        description: "Embassy Chișinău operează Democracy Commission Small Grants Program — granturi mici pentru ONG-uri pe democrație, drepturile omului, mass-media. Apel anual recurent.",
        website: "https://md.usembassy.gov/education-culture/local-programs/grants/"
    },
    "interreg-bsb": {
        id: "interreg-bsb",
        name: "INTERREG NEXT Bazinul Mării Negre",
        short: "BSB",
        logoColor: "blue",
        origin: "UE",
        originLabel: "UE · Cooperare BSB",
        description: "Program de cooperare transfrontalieră în bazinul Mării Negre 2021–2027. Moldova e țară parteneră.",
        website: "https://blacksea-cbc.net"
    },
    horizon: {
        id: "horizon",
        name: "Horizon Europe",
        short: "HEU",
        logoColor: "blue",
        origin: "UE",
        originLabel: "UE · Cercetare & Inovare",
        description: "Cel mai mare program de cercetare al UE (95.5 mld €). Moldova e țară asociată din 2022.",
        website: "https://ec.europa.eu/info/funding-tenders/"
    },
    erasmus: {
        id: "erasmus",
        name: "Erasmus+",
        short: "E+",
        logoColor: "blue",
        origin: "UE",
        originLabel: "UE · Educație & Tineret",
        description: "Programul UE pentru educație, formare, tineret și sport. Moldova țară parteneră.",
        website: "https://erasmusplus.md"
    },
    creative: {
        id: "creative",
        name: "Creative Europe",
        short: "CE",
        logoColor: "blue",
        origin: "UE",
        originLabel: "UE · Cultură & Audiovizual",
        description: "Program UE pentru sectoarele culturale și creative. Moldova țară participantă din 2022.",
        website: "https://culture.ec.europa.eu/creative-europe"
    },
    "primaria-chisinau": {
        id: "primaria-chisinau",
        name: "Primăria Municipiului Chișinău",
        short: "PMC",
        logoColor: "navy",
        origin: "National",
        originLabel: "Municipal · APL Chișinău",
        description: "Mecanism de buget participativ + finanțare proiecte comunitare prin Direcția Relații Publice. Apeluri anuale recurente.",
        website: "https://www.chisinau.md/ro/buget-civil-chisinau-20860.html"
    },
    "primaria-balti": {
        id: "primaria-balti",
        name: "Primăria Municipiului Bălți",
        short: "PMB",
        logoColor: "red",
        origin: "National",
        originLabel: "Municipal · APL Bălți",
        description: "Capitala Tineretului 2026. 4 mil MDL alocate pentru sprijinirea inițiativelor de tineret prin DITS Bălți + Agenția Națională pentru Tineret.",
        website: "https://balti.md"
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
