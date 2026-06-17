const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const STORAGE_KEY = "nexus-redacao-app-v2";
const SESSION_KEY = "nexus-redacao-session-v1";
const TOKEN_KEY = "nexus_token";
const USER_KEY = "nexus_user";
const RECOVERY_KEY = "nexus-redacao-recovery-drafts-v1";
const APP_VERSION = "real-data-v1";

let licenseStatus = null;
let licenseStatusLoading = false;

const ROLE_PERMISSIONS = {
  admin: { create: ["*"], edit: ["*"], delete: ["*"], backup: true },
  editor: { create: ["*"], edit: ["*"], delete: ["*"], backup: true },
  reporter: { create: ["reports", "medias", "contacts", "stories"], edit: ["reports", "medias", "contacts", "stories"], delete: [], backup: false },
  writer: { create: ["proposals", "assignments", "rounds", "contacts"], edit: ["proposals", "assignments", "rounds", "contacts"], delete: [], backup: false }
};

const icons = {
  dashboard: "fa-solid fa-chart-line",
  notifications: "fa-regular fa-bell",
  shortcuts: "fa-regular fa-keyboard",
  settings: "fa-solid fa-gear",
  users: "fa-solid fa-user-shield",
  agency: "fa-solid fa-satellite-dish",
  rounds: "fa-solid fa-phone",
  proposals: "fa-regular fa-lightbulb",
  posts: "fa-solid fa-bullhorn",
  contacts: "fa-regular fa-address-book",
  registries: "fa-solid fa-id-card-clip",
  assignments: "fa-regular fa-clipboard",
  production: "fa-solid fa-route",
  reports: "fa-solid fa-video",
  rundowns: "fa-solid fa-table-list",
  archive: "fa-solid fa-box-archive",
  search: "fa-solid fa-magnifying-glass",
  calendar: "fa-regular fa-calendar-days",
  medias: "fa-regular fa-circle-play",
  teams: "fa-solid fa-users",
  branches: "fa-solid fa-network-wired",
  charts: "fa-solid fa-chart-simple",
  general_reports: "fa-regular fa-file-lines",
  trash: "fa-regular fa-trash-can"
};

const menu = [
  item("dashboard", "Painel"),
  item("agency", "Agência"),
  item("rounds", "Rondas"),
  item("proposals", "Sugestões de Pauta"),
  item("posts", "Publicações"),
  item("contacts", "Agenda"),
  item("registries", "Cadastros"),
  item("users", "Usuários"),
  item("assignments", "Pautas"),
  item("production", "Mapa de Produções"),
  item("reports", "Reportagens"),
  item("rundowns", "Espelhos"),
  item("archive", "Arquivo", [
    item("assignments_archive", "Pautas"),
    item("production_archive", "Produções"),
    item("reportages_archive", "Reportagens"),
    item("stories_archive", "Laudas")
  ]),
  item("search", "Busca Geral"),
  item("calendar", "Calendário"),
  item("medias", "Centro de Mídias"),
  item("teams", "Escala de Equipes"),
  item("branches", "Praças", [
    item("branches_proposals", "Sugestões de Pauta"),
    item("branches_assignments", "Pautas"),
    item("branches_news_reports", "Reportagens"),
    item("branches_stories", "Laudas"),
    item("branches_rundowns", "Espelhos")
  ]),
  item("charts", "Gráficos Gerenciais"),
  item("general_reports", "Relatórios"),
  item("trash", "Lixeira")
];

const modules = {
  agency: {
    title: "Agência",
    collection: "agency",
    type: "agency",
    columns: [["updatedAt", "Última alteração"], ["title", "Retranca"], ["kind", "Tipo"], ["urgency", "Urgência"], ["source", "Fonte"], ["status", "Status"]],
    fields: [
      field("title", "Retranca", "text", true),
      field("kind", "Tipo", "select", true, ["Texto", "Foto", "Vídeo", "Áudio", "Nota"]),
      field("urgency", "Urgência", "select", true, ["Normal", "Alta", "Plantão"]),
      field("source", "Fonte"),
      field("content", "Conteúdo", "textarea"),
      field("status", "Status", "select", true, ["Nova", "Em apuração", "Publicada", "Arquivada"])
    ]
  },
  rounds: {
    title: "Rondas",
    collection: "rounds",
    type: "round",
    columns: [["time", "Hora"], ["title", "Retranca"], ["institution", "Instituição"], ["contact", "Contato"], ["user", "Usuário"]],
    fields: [
      field("time", "Hora", "time", true),
      field("title", "Retranca", "text", true),
      field("institution", "Instituição"),
      field("contact", "Contato"),
      field("phone", "Telefone"),
      field("notes", "Observações", "textarea")
    ]
  },
  proposals: {
    title: "Sugestões de Pauta",
    collection: "proposals",
    type: "proposal",
    columns: [["updatedAt", "Última alteração"], ["title", "Retranca"], ["program", "Programas"], ["source", "Fonte"], ["user", "Usuário"], ["status", "Status"]],
    fields: [
      field("title", "Retranca", "text", true),
      field("program", "Programa", "select", true, programs),
      field("source", "Fonte"),
      field("user", "Usuário", "select", true, people),
      field("content", "Conteúdo", "textarea"),
      field("status", "Status", "select", true, ["Nova", "Aprovada", "Em produção", "Recusada"])
    ]
  },
  posts: {
    title: "Publicações",
    collection: "posts",
    type: "post",
    columns: [["date", "Data"], ["title", "Título"], ["channel", "Canal"], ["author", "Autor"], ["status", "Status"]],
    fields: [
      field("date", "Data", "date", true),
      field("title", "Título", "text", true),
      field("channel", "Canal", "select", true, ["Site", "Instagram", "YouTube", "X", "Facebook"]),
      field("author", "Autor", "select", true, people),
      field("content", "Texto", "textarea"),
      field("status", "Status", "select", true, ["Rascunho", "Agendada", "Publicada"])
    ]
  },
  contacts: {
    title: "Agenda",
    collection: "contacts",
    type: "contact",
    columns: [["name", "Nome"], ["profession", "Profissão"], ["company", "Empresa"], ["phone", "Telefone"], ["email", "E-mail"]],
    fields: [
      field("name", "Nome", "text", true),
      field("profession", "Profissão"),
      field("company", "Empresa"),
      field("phone", "Telefone"),
      field("email", "E-mail"),
      field("notes", "Observações", "textarea")
    ]
  },
  assignments: {
    title: "Pautas",
    collection: "assignments",
    type: "assignment",
    columns: [["date", "Data"], ["time", "Hora"], ["title", "Retranca"], ["program", "Programa"], ["writers", "Pauteiros"], ["reporters", "Repórteres"], ["camera", "Câmera"], ["editors", "Editores"], ["lockStatus", "Edição"], ["status", "Status"]],
    fields: [
      field("date", "Data", "date", true),
      field("time", "Hora", "time", true),
      field("title", "Retranca", "text", true),
      field("program", "Programa", "select", true, programs),
      field("writer", "Pauteiro", "select", true, people),
      field("reporter", "Repórter", "select", true, people),
      field("location", "Local"),
      field("content", "Conteúdo", "textarea"),
      field("status", "Status", "select", true, ["Produzindo", "Pronta", "Concluída", "Cancelada"])
    ]
  },
  production: {
    title: "Mapa de Produções",
    collection: "production",
    type: "production",
    columns: [["date", "Data"], ["time", "Hora"], ["title", "Retranca"], ["kind", "Tipo"], ["location", "Local"], ["team", "Equipe"], ["vehicle", "Veículo"], ["status", "Status"]],
    fields: [
      field("date", "Data", "date", true),
      field("time", "Hora", "time", true),
      field("title", "Retranca", "text", true),
      field("kind", "Tipo", "select", true, storyTypes()),
      field("location", "Local"),
      field("team", "Equipe"),
      field("producers", "Produtores"),
      field("editors", "Editores"),
      field("resources", "Recursos"),
      field("vehicle", "Veículo"),
      field("status", "Status", "select", true, ["Planejada", "Em campo", "Finalizada"])
    ]
  },
  reports: {
    title: "Reportagens",
    collection: "reports",
    type: "report",
    columns: [["date", "Data"], ["title", "Retranca"], ["reporter", "Repórter"], ["program", "Programa"], ["contentStatus", "Conteúdo"]],
    fields: [
      field("date", "Data", "date", true),
      field("title", "Retranca", "text", true),
      field("reporter", "Repórter", "select", true, people),
      field("program", "Programa", "select", true, programs),
      field("content", "Conteúdo", "textarea"),
      field("contentStatus", "Conteúdo", "select", true, ["Com conteúdo", "Sem conteúdo"])
    ]
  },
  medias: {
    title: "Centro de Mídias",
    collection: "medias",
    type: "media",
    columns: [["date", "Data"], ["title", "Arquivo"], ["story", "Retranca"], ["kind", "Tipo"], ["duration", "Duração"], ["status", "Status"]],
    fields: [
      field("date", "Data", "date", true),
      field("title", "Arquivo", "text", true),
      field("story", "Retranca"),
      field("kind", "Tipo", "select", true, ["Vídeo", "Áudio", "Imagem", "Documento"]),
      field("duration", "Duração"),
      field("status", "Status", "select", true, ["Pendente", "Pronto", "Arquivado"])
    ]
  },
  teams: {
    title: "Escala de Equipes",
    collection: "teams",
    type: "team",
    columns: [["date", "Data"], ["time", "Hora"], ["name", "Nome"], ["members", "Membros"], ["branch", "Praça"]],
    fields: [
      field("date", "Data", "date", true),
      field("time", "Hora", "time", true),
      field("name", "Nome", "text", true),
      field("members", "Membros"),
      field("branch", "Praça", "select", true, branches),
      field("notes", "Observações", "textarea")
    ]
  },
  general_reports: {
    title: "Relatórios",
    collection: "incidents",
    type: "incident",
    columns: [["date", "Data"], ["title", "Retranca"], ["origin", "Origem"], ["event", "Evento"], ["program", "Programas"], ["updatedBy", "Última alteração"]],
    fields: [
      field("date", "Data", "date", true),
      field("title", "Retranca", "text", true),
      field("origin", "Origem", "select", true, ["Pautas", "Reportagens", "Laudas", "Espelhos"]),
      field("event", "Evento"),
      field("program", "Programa", "select", true, programs),
      field("updatedBy", "Usuário", "select", true, people),
      field("content", "Conteúdo", "textarea")
    ]
  }
};

function item(id, label, children = null) {
  return { id, label, icon: icons[id] || "fa-regular fa-circle", children };
}
function field(name, label, type = "text", required = false, options = []) {
  return { name, label, type, required, options };
}
const DEFAULT_PROGRAMS = [{ name: "ALÔ PARAÍBA", start: "11:30:00", duration: "02:00:00", breaks: "00:04:30" }];
const DEFAULT_PEOPLE = ["Redação"];
const DEFAULT_BRANCHES = ["João Pessoa"];

function registryValues(key, fallback) {
  if (typeof state === "undefined") return fallback;
  ensureSettings();
  const values = state.settings?.[key] || [];
  return values.length ? values : fallback;
}
function programs() {
  return registryValues("programs", DEFAULT_PROGRAMS).map(program => program.name);
}
function people() {
  return registryValues("reporters", DEFAULT_PEOPLE);
}
function storyTypes() {
  return ["ESCALADA", "VT", "ESTU", "STD", "SNR", "NC", "VIVO", "NT", "PASS", "MERC", "COLU", "MEET"];
}
function branches() {
  return registryValues("branches", DEFAULT_BRANCHES);
}

function seedState() {
  const today = "2026-05-27";
  return {
    active: "rundowns",
    tabs: ["rundowns"],
    selected: {},
    filters: {},
    ui: { density: "comfortable", theme: "modern" },
    notifications: [],
    date: today,
    program: "ALÔ PARAÍBA",
    branch: "João Pessoa",
    viewMode: "list",
    currentStoryId: "story-9",
    trash: [],
    agency: [
      rec("agency", { updatedAt: "27/05/2026 12:20", title: "COLETIVA SAÚDE", kind: "Texto", urgency: "Alta", source: "Assessoria", user: "Redação", content: "Secretaria apresenta balanço de arboviroses.", status: "Nova" }),
      rec("agency", { updatedAt: "27/05/2026 11:35", title: "TRÂNSITO CENTRO", kind: "Vídeo", urgency: "Normal", source: "STTRANS", user: "Redação", content: "Mudança no fluxo da avenida principal.", status: "Em apuração" })
    ],
    rounds: [
      rec("round", { date: today, time: "08:20", title: "Coletiva vacinação", institution: "Secretaria de Saúde", contact: "Assessoria", phone: "(83) 99999-0101", user: "Redação", notes: "Confirmar sonora com coordenação." }),
      rec("round", { date: today, time: "10:15", title: "Trânsito centro", institution: "STTRANS", contact: "Plantão", phone: "(83) 99999-0102", user: "Redação", notes: "Pedir imagens do monitoramento." })
    ],
    proposals: [
      rec("proposal", { updatedAt: "27/05/2026 12:20", title: "COLETIVA SAÚDE", program: "ALÔ PARAÍBA", source: "Assessoria", user: "Redação", content: "Alerta para casos prováveis de arboviroses.", status: "Nova" }),
      rec("proposal", { updatedAt: "27/05/2026 11:45", title: "TRÂNSITO CENTRO", program: "PARAÍBA DO POVO", source: "Ronda", user: "Redação", content: "Interdição altera circulação no Centro.", status: "Aprovada" })
    ],
    posts: [
      rec("post", { date: today, title: "Operação Fumulato prende suspeitos", channel: "Site", author: "Redação", content: "Texto web da reportagem.", status: "Rascunho" })
    ],
    contacts: [
      rec("contact", { name: "ADEMIR FERNANDES", profession: "DELEGADO", company: "Polícia Civil", phone: "(83) 99999-2222", email: "ademir@exemplo.com", notes: "Fonte de segurança pública." }),
      rec("contact", { name: "ADHAILTON LACET", profession: "JUIZ DA INFÂNCIA E JUVENTUDE", company: "TJ", phone: "(83) 99999-3333", email: "", notes: "" }),
      rec("contact", { name: "ANA CLAUDIA RODRIGUES", profession: "PRÓ-REITORA", company: "UFPB", phone: "(83) 99999-4444", email: "ana@ufpb.br", notes: "" })
    ],
    assignments: [
      rec("assignment", { date: "2026-05-26", time: "08:00", title: "STD ACIDENTE BR", program: "ALÔ PARAÍBA", writer: "Carolina Felix", reporter: "Diego Magão", location: "BR-230", content: "Acidente com motociclista.", status: "Produzindo" }),
      rec("assignment", { date: "2026-05-26", time: "09:00", title: "STD RECURSOS FERNANDO CUNHA LIMA", program: "ALÔ PARAÍBA", writer: "Jose Gabriel", reporter: "Diego Magão", location: "João Pessoa", content: "Prestação de contas.", status: "Concluída" }),
      rec("assignment", { date: "2026-05-26", time: "12:20", title: "VIVO INSCRIÇÕES MESÁRIOS VOLUNTÁRIOS", program: "ALÔ PARAÍBA", writer: "Jose Gabriel", reporter: "Weslly Martins", location: "TRE", content: "Inscrições abertas.", status: "Pronta" })
    ],
    production: [
      rec("production", { date: today, time: "09:00", title: "STD ACIDENTE BR 230", kind: "STD", location: "BR-230", team: "Equipe Manhã", producers: "Carolina", editors: "Mariana", resources: "Câmera", vehicle: "Carro 01", status: "Em campo" }),
      rec("production", { date: today, time: "13:00", title: "VIVO PRISÃO IRMÃ DULCE", kind: "VIVO", location: "João Pessoa", team: "Equipe Tarde", producers: "Katharina", editors: "Janaína", resources: "LiveU", vehicle: "Carro 02", status: "Planejada" })
    ],
    reports: [
      rec("report", { date: today, title: "VIVO APELO", reporter: "Diego Magão", program: "ACORDA POVO", content: "Família pede ajuda.", contentStatus: "Com conteúdo" }),
      rec("report", { date: today, title: "STD OPERAÇÃO FAMULATO", reporter: "Diego Magão", program: "Gaveta Geral", content: "Operação cumpriu mandados.", contentStatus: "Com conteúdo" }),
      rec("report", { date: "2026-05-26", title: "STD ACIDENTE BR 230", reporter: "Diego Magão", program: "Gaveta Geral", content: "Motociclista morreu após colisão.", contentStatus: "Com conteúdo" })
    ],
    medias: [
      rec("media", { date: today, title: "STD OPERAÇÃO FAMULATO.mp4", story: "OPERAÇÃO FAMULATO", kind: "Vídeo", duration: "01:29", status: "Pronto" }),
      rec("media", { date: today, title: "AP ILUSTRA ACIDENTE BR 230.mp4", story: "ACIDENTE BR 230", kind: "Vídeo", duration: "00:48", status: "Pronto" }),
      rec("media", { date: "2026-05-26", title: "ROMARIA DAS CRIANÇAS.mp4", story: "ROMARIA", kind: "Vídeo", duration: "04:33", status: "Pendente" })
    ],
    teams: [
      rec("team", { date: today, time: "07:00", name: "Equipe Manhã", members: "Diego Magão, Carolina Felix, Jose Gabriel", branch: "João Pessoa", notes: "Viatura 01" }),
      rec("team", { date: today, time: "13:00", name: "Equipe Tarde", members: "Natan Peres, Weslly Martins, Katharina", branch: "João Pessoa", notes: "Viatura 02" })
    ],
    incidents: [
      rec("incident", { date: "2026-05-25", title: "STD ACIDENTES AUTOMOBILÍSTICOS", origin: "Pautas", event: "Incidentes > Pautas Caídas", program: "PARAÍBA DO POVO", updatedBy: "Katharina", content: "Pauta caiu por falta de imagem." }),
      rec("incident", { date: "2026-05-22", title: "ROMARIA DAS CRIANÇAS", origin: "Pautas", event: "Incidentes > Pautas Caídas", program: "PARAÍBA DO POVO", updatedBy: "Andre Pereira", content: "Material reagendado." })
    ],
    events: [
      rec("event", { date: today, title: "Roteiro ALÔ PARAÍBA", kind: "Roteiro", color: "#8e44ad" }),
      rec("event", { date: today, title: "Equipe Manhã", kind: "Tarefa", color: "#1c92ea" }),
      rec("event", { date: "2026-05-29", title: "Publicação especial", kind: "Publicação", color: "#2d934f" })
    ],
    rundowns: {
      "2026-05-27|ALÔ PARAÍBA": {
        date: today,
        program: "ALÔ PARAÍBA",
        start: "11:30:00",
        end: "13:30:00",
        blocks: [
          block("Bloco 1", [
            rundownRow("VT", "LIBERDADE JOÃO LIMA", "Diego Magão", "00:00", "00:31", "00:31"),
            rundownRow("MEET", "ADVOGADA RAPHAELA BRILHANTE", "Pollyana Sorrentino", "00:02", "02:30", "02:32"),
            rundownRow("STD", "DENÚNCIA GAECO PADRE ZÉ", "Natan Peres", "00:31", "00:00", "00:31"),
            rundownRow("SNR", "PRF APREENSÃO CRACK", "Pollyana Sorrentino", "00:30", "00:47", "01:17"),
            rundownRow("MERC", "ARMAZÉM PARAÍBA", "Leila Bezerra", "00:32", "00:00", "00:32", "red")
          ]),
          block("Bloco 2", [
            rundownRow("ESTU", "INTERAÇÃO YOUTUBE", "Pollyana Sorrentino", "00:02", "02:00", "02:02"),
            rundownRow("STD", "OPERAÇÃO FAMULATO", "Diego Magão", "00:15", "01:29", "01:44", "green", "story-9"),
            rundownRow("NC", "ASSALTO GEISEL", "Natan Peres", "00:32", "00:00", "00:32"),
            rundownRow("SNR", "ENVENENAMENTO TEIXEIRA", "Natan Peres", "00:16", "02:44", "03:00")
          ]),
          block("Stand By", [
            rundownRow("VIVO", "IDOSOS MORTOS SAPÉ", "Natan Peres", "00:33", "04:00", "04:33"),
            rundownRow("NT", "APROVAÇÃO PISO PROFESSOR", "Leila Bezerra", "00:27", "02:52", "03:19")
          ], true)
        ]
      }
    },
    stories: [
      rec("story", {
        id: "story-9",
        number: 9,
        type: "STD",
        title: "OPERAÇÃO FAMULATO",
        reporter: "Diego Magão",
        editor: "Janaína Pereira",
        program: "ALÔ PARAÍBA",
        date: today,
        head: "Michel Andrade",
        headTime: "00:15",
        vtTime: "01:29",
        total: "01:44",
        body: "-// QUARTA-FEIRA COMEÇOU COM OPERAÇÃO./\n- OPERAÇÃO FAMULATO RESULTOU NO CUMPRIMENTO DE 11 MANDADOS JUDICIAIS DE BUSCA E APREENSÃO, QUEBRA DE SIGILO TELEFÔNICO E APLICAÇÃO DE MEDIDAS ALTERNATIVAS À PRISÃO.//\n[ENTRA STANDUP]",
        info: "DIEGO MAGÃO\nJOÃO PESSOA\n\nGC: OPERAÇÃO FAMULATO\nPOLÍCIA CIVIL APURA DESVIO DE VALORES EM POSTO DE COMBUSTÍVEIS",
        medias: ["STD OPERAÇÃO FAMULATO.mp4", "AP STD OPERAÇÃO FAMULATO.mp4"],
        status: "Aprovada"
      })
    ]
  };
}

function emptyState() {
  const today = new Date().toISOString().slice(0, 10);
  return {
    appVersion: APP_VERSION,
    active: "dashboard",
    tabs: ["dashboard"],
    navOpen: {},
    selected: {},
    filters: {},
    settings: {
      programs: [...DEFAULT_PROGRAMS],
      reporters: [...DEFAULT_PEOPLE],
      branches: [...DEFAULT_BRANCHES],
      printLogo: ""
    },
    date: today,
    program: "ALÔ PARAÍBA",
    branch: "João Pessoa",
    viewMode: "list",
    currentStoryId: null,
    trash: [],
    agency: [],
    rounds: [],
    proposals: [],
    posts: [],
    contacts: [],
    assignments: [],
    production: [],
    reports: [],
    medias: [],
    teams: [],
    incidents: [],
    events: [],
    stories: [],
    rundowns: {}
  };
}

function ensureSettings(target = state) {
  target.settings ||= {};
  target.settings.programs = cleanProgramRegistry(target.settings.programs);
  target.settings.reporters = cleanRegistry(target.settings.reporters, DEFAULT_PEOPLE);
  target.settings.branches = cleanRegistry(target.settings.branches, DEFAULT_BRANCHES);
  target.settings.printLogo = typeof target.settings.printLogo === "string" ? target.settings.printLogo : "";
  if (!target.program || !target.settings.programs.some(program => program.name === target.program)) target.program = target.settings.programs[0].name;
  if (!target.branch || !target.settings.branches.includes(target.branch)) target.branch = target.settings.branches[0];
}

function printLogoSrc() {
  ensureSettings();
  return state.settings.printLogo || "./logo.png";
}

function cleanProgramRegistry(values) {
  const source = Array.isArray(values) ? values : [];
  const byName = new Map();
  source.forEach(item => {
    const rawName = typeof item === "string" ? item : item?.name;
    const name = String(rawName || "").trim();
    if (!name) return;
    const rawDuration = typeof item === "object" ? item.duration : "";
    const rawStart = typeof item === "object" ? item.start : "";
    const rawBreaks = typeof item === "object" ? item.breaks : "";
    byName.set(name.toLowerCase(), {
      name,
      start: normalizeDuration(rawStart || "11:30:00"),
      duration: normalizeDuration(rawDuration || "02:00:00"),
      breaks: normalizeDuration(rawBreaks || "00:04:30")
    });
  });
  const cleaned = Array.from(byName.values());
  return cleaned.length ? cleaned : [...DEFAULT_PROGRAMS];
}

function cleanRegistry(values, fallback) {
  const source = Array.isArray(values) ? values : [];
  const cleaned = [...new Set(source.map(value => String(value || "").trim()).filter(Boolean))];
  return cleaned.length ? cleaned : [...fallback];
}

function programConfig(name = state.program) {
  ensureSettings();
  return state.settings.programs.find(program => program.name === name) || state.settings.programs[0];
}

function normalizeState(nextState) {
  const normalized = nextState || emptyState();
  normalized.ui ||= { density: "comfortable", theme: "modern" };
  normalized.navOpen ||= {};
  normalized.notifications ||= [];
  normalized.rundowns ||= {};
  normalized.stories ||= [];
  ensureSettings(normalized);
  return normalized;
}

function rec(type, data) {
  const clean = { ...data };
  delete clean.id;
  return {
    id: data.id || `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    createdAt: clean.createdAt || nowText(),
    updatedAt: clean.updatedAt || nowText(),
    ...clean
  };
}
function block(title, rows, standby = false) {
  return { id: rec("block", {}).id, title, standby, rows };
}
function rundownRow(type, title, reporter, head, vt, total, tone = "green", storyId = null) {
  return { id: rec("rundown-row", {}).id, storyId, type, title, reporter, editor: people()[0], head, vt, total, tone: "pending", ok: false, approved: false };
}

let state = loadState();
let modalHandler = null;
let modalCloseHandler = null;

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(stored?.appVersion === APP_VERSION ? stored : emptyState());
  } catch {
    return normalizeState(emptyState());
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  syncStateToServer();
}
function resetStartupNavigation() {
  state.active = "dashboard";
  state.tabs = ["dashboard"];
  state.selected ||= {};
  state.currentStoryId = null;
}
async function hydrateStateFromServer() {
  try {
    if (!isLogged()) return;
    const response = await fetch("/api/state", { headers: authHeaders() });
    if (!response.ok) return;
    const payload = await response.json();
    if (payload.state?.appVersion === APP_VERSION) {
      state = normalizeState(payload.state);
      resetStartupNavigation();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } else {
      state = normalizeState(emptyState());
      resetStartupNavigation();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      await syncStateToServer();
    }
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
async function syncStateToServer() {
  try {
    await fetch("/api/state", {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify({ state })
    });
  } catch {
    // O app continua funcionando localmente se o servidor cair.
  }
}
function authHeaders() {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}
function isLogged() {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}
function currentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY)) || null;
  } catch {
    return null;
  }
}
function can(action, collection) {
  const user = currentUser();
  const permissions = ROLE_PERMISSIONS[user?.role] || {};
  const allowed = permissions[action] || [];
  return allowed.includes("*") || allowed.includes(collection);
}
function setActive(view, options = {}) {
  if (view === "rundowns" && options.resetRundown) {
    state.date = toIsoDate(new Date());
    state.program = programs()[0] || state.program;
    state.selected.rundownRow = null;
    state.currentStoryId = null;
    state.rundownBrowse = false;
  }
  state.active = view;
  if (!state.tabs.includes(view)) state.tabs.push(view);
  saveState();
  render();
}

function render() {
  if (!licenseStatus || licenseStatusLoading) {
    renderLicenseGate();
    return;
  }
  if (licenseStatus.configured && !licenseStatus.activated) {
    renderLicenseGate();
    return;
  }
  if (!isLogged()) {
    renderLogin();
    return;
  }
  document.body.classList.remove("login-mode");
  document.body.classList.toggle("density-compact", state.ui?.density === "compact");
  renderUserBadge();
  renderNav();
  renderTabs();
  if (state.active.startsWith("story:")) {
    renderStoryEditor(state.active.replace("story:", ""));
    return;
  }
  if (state.active.startsWith("branch:")) {
    renderBranchModule(state.active.replace("branch:", ""));
    return;
  }
  if (state.active.endsWith("_archive") || state.active === "archive") {
    renderArchive();
    return;
  }
  const renderer = {
    dashboard: renderDashboard,
    notifications: renderNotifications,
    shortcuts: renderShortcuts,
    settings: renderSettings,
    registries: renderRegistries,
    rundowns: renderRundowns,
    search: renderSearch,
    calendar: renderCalendar,
    users: renderUsers,
    charts: renderCharts,
    trash: renderTrash,
    branches: () => renderBranchModule("branches_proposals")
  }[state.active];
  if (renderer) renderer();
  else renderCrudModule(modules[state.active] || modules.agency);
  scheduleRecoveryPrompt();
}

async function loadLicenseStatus() {
  if (licenseStatusLoading) return;
  licenseStatusLoading = true;
  try {
    const response = await fetch("/api/license/status");
    licenseStatus = await response.json();
  } catch {
    licenseStatus = { configured: true, activated: false, error: "Nao foi possivel consultar a licenca." };
  } finally {
    licenseStatusLoading = false;
  }
}

function renderLicenseGate() {
  document.body.classList.add("login-mode");
  $("#nav").innerHTML = "";
  $("#tabs").innerHTML = "";

  if (!licenseStatus && !licenseStatusLoading) {
    loadLicenseStatus().then(render);
  }

  const loading = !licenseStatus || licenseStatusLoading;
  const error = licenseStatus?.error ? `<div class="license-alert">${licenseStatus.error}</div>` : "";

  $("#view").innerHTML = `
    <section class="license-screen">
      <div class="license-hero">
        <img class="login-logo" src="./logo.png" alt="Nexus" />
        <span class="license-badge">Nexus Redação 1.0</span>
        <h1>Ative sua licença</h1>
        <p>Digite a chave fornecida para liberar este computador. A ativação fica vinculada à máquina e pode ser gerenciada pelo painel online.</p>
      </div>
      <form id="licenseForm" class="license-panel">
        <h2>${loading ? "Verificando licença..." : "Licença do aplicativo"}</h2>
        ${error}
        <input name="licenseKey" placeholder="NEXUS-XXXXX-XXXXX-XXXXX-XXXXX" ${loading ? "disabled" : "required"}>
        <button class="button primary" type="submit" ${loading ? "disabled" : ""}>Ativar agora</button>
        <button class="button ghost" type="button" id="retryLicense">Verificar novamente</button>
        <div class="login-help">
          <strong>Sem chave?</strong>
          <span>Solicite uma licença ao administrador do Nexus Redação.</span>
        </div>
      </form>
    </section>
  `;

  $("#retryLicense")?.addEventListener("click", async () => {
    licenseStatus = null;
    await loadLicenseStatus();
    render();
  });

  $("#licenseForm")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    await activateLicense(values.licenseKey);
  });
}

async function activateLicense(licenseKey) {
  try {
    const response = await fetch("/api/license/activate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey })
    });
    const data = await response.json();
    if (!response.ok || !data.ok) {
      showToast(data.error || "Licenca invalida", "error");
      return;
    }
    licenseStatus = { configured: true, activated: true, license: data.license };
    showToast("Licenca ativada com sucesso", "success");
    render();
  } catch {
    showToast("Erro ao ativar licenca", "error");
  }
}

function renderLogin() {
  document.body.classList.add("login-mode");
  $("#nav").innerHTML = "";
  $("#tabs").innerHTML = "";
  $("#view").innerHTML = `
    <section class="login-screen">
      <div class="login-hero">
        <img class="login-logo" src="./logo.png" alt="Nexus" />
        <p>Controle pautas, laudas, espelhos, equipes, arquivos e produção em uma redação integrada.</p>
      </div>
      <form id="loginForm" class="login-panel">
        <h1>Entre com sua conta</h1>
        <input name="email" type="email" placeholder="E-mail" required>
        <input name="password" type="password" placeholder="Senha" required>
        <label class="check-line"><input type="checkbox" checked> Lembrar e-mail</label>
        <button class="button primary" type="submit">Entrar</button>
        <div class="login-help">
          <strong>Primeiro acesso</strong>
          <span>Entre com o administrador inicial e cadastre os usuários da redação.</span>
        </div>
      </form>
    </section>
  `;
  $("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (await login(values.email, values.password)) render();
  });
}

async function login(email, password) {
  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!data.success) {
      showToast(data.error || "Credenciais invalidas", "error");
      return false;
    }
    localStorage.setItem(TOKEN_KEY, data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    localStorage.setItem(SESSION_KEY, "on");
    await hydrateStateFromServer();
    showToast(`Bem-vindo, ${data.user.name}`, "success");
    return true;
  } catch {
    showToast("Erro de conexao com o servidor", "error");
    return false;
  }
}

function renderUserBadge() {
  const user = currentUser();
  const node = $(".user");
  if (node && user) node.textContent = `${user.name} (${user.role})`;
}

function renderNav() {
  state.navOpen ||= {};
  openActiveParentMenu();
  $("#nav").innerHTML = menu.map(node => navItem(node)).join("");
  $$(".nav-button").forEach(button => button.addEventListener("click", () => {
    const view = button.dataset.view;
    const group = button.dataset.group;
    if (group) {
      state.navOpen[group] = !state.navOpen[group];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderNav();
      return;
    }
    if (view.startsWith("branches_")) setActive(`branch:${view}`);
    else setActive(view, { resetRundown: view === "rundowns" });
  }));
}
function navItem(node, sub = false) {
  const hasChildren = Boolean(node.children?.length);
  const open = Boolean(state.navOpen?.[node.id]);
  const childActive = hasChildren && node.children.some(child => state.active === child.id || state.active === `branch:${child.id}`);
  const active = state.active === node.id || state.active === `branch:${node.id}` || childActive ? "active" : "";
  return `
    <button class="nav-button ${active} ${sub ? "nav-sub" : ""}" data-view="${node.id}" ${hasChildren ? `data-group="${node.id}"` : ""}>
      <span class="nav-icon"><i class="${node.icon}"></i></span><span class="nav-label">${node.label}</span>${hasChildren ? `<span class="nav-chevron ${open ? "open" : ""}"><i class="fa-solid fa-chevron-right"></i></span>` : ""}
    </button>
    ${hasChildren ? `<div class="nav-children ${open ? "open" : ""}">${node.children.map(child => navItem(child, true)).join("")}</div>` : ""}
  `;
}
function openActiveParentMenu() {
  for (const node of menu) {
    if (!node.children?.length) continue;
    const childActive = node.children.some(child => state.active === child.id || state.active === `branch:${child.id}`);
    if (childActive) state.navOpen[node.id] = true;
  }
}
function renderTabs() {
  const labels = Object.fromEntries(flatMenu(menu).map(node => [node.id, node.label]));
  $("#tabs").innerHTML = state.tabs.map(id => {
    const label = id.startsWith("story:") ? `${getStory(id.replace("story:", ""))?.number || ""} - Lauda` :
      id.startsWith("branch:") ? `Praças: ${labels[id.replace("branch:", "")]}` : labels[id] || id;
    return `<button class="tab ${state.active === id ? "active" : ""}" data-view="${id}"><span>${label}</span><span class="tab-close" data-close="${id}" title="Fechar guia"><i class="fa-solid fa-xmark"></i></span></button>`;
  }).join("");
  $$(".tab").forEach(tab => tab.addEventListener("click", () => setActive(tab.dataset.view)));
  $$(".tab-close").forEach(close => close.addEventListener("click", (event) => {
    event.stopPropagation();
    closeTab(close.dataset.close);
  }));
}
function closeTab(id) {
  if (state.tabs.length <= 1) {
    state.active = "dashboard";
    state.tabs = ["dashboard"];
    saveState();
    render();
    return;
  }
  const index = state.tabs.indexOf(id);
  state.tabs = state.tabs.filter(tab => tab !== id);
  if (state.active === id) state.active = state.tabs[Math.max(0, index - 1)] || state.tabs[0] || "dashboard";
  if (!state.tabs.length) state.tabs = [state.active];
  saveState();
  render();
}
function flatMenu(items) {
  return items.flatMap(node => [node, ...(node.children ? flatMenu(node.children) : [])]);
}

function renderDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const todayAssignments = state.assignments.filter(item => item.date === today);
  const todayProduction = state.production.filter(item => item.date === today);
  const todayEvents = state.events.filter(item => item.date === today);
  const openRundowns = Object.values(state.rundowns || {});
  const cards = [
    ["Pautas hoje", todayAssignments.length, "assignments", "fa-regular fa-clipboard", "#2563eb"],
    ["Reportagens", state.reports.length, "reports", "fa-solid fa-video", "#0f9f6e"],
    ["Laudas", state.stories.length, "rundowns", "fa-solid fa-table-list", "#d97706"],
    ["Mídias", state.medias.length, "medias", "fa-regular fa-circle-play", "#7c3aed"],
    ["Produções", todayProduction.length, "production", "fa-solid fa-route", "#0891b2"],
    ["Contatos", state.contacts.length, "contacts", "fa-regular fa-address-book", "#db2777"]
  ];

  $("#view").innerHTML = `
    ${renderPageHeader("Painel da Redação", "Visão geral operacional do dia, com atalhos para começar rápido.", [
      ["Nova pauta", "dashNewAssignment", "primary"],
      ["Novo espelho", "dashNewRundown", ""],
      ["Nova lauda", "dashNewStory", ""]
    ])}
    <section class="dashboard-grid">
      ${cards.map(([label, value, view, icon, color]) => `
        <button class="stat-card" data-view="${view}">
          <span class="stat-icon" style="background:${color}"><i class="${icon}"></i></span>
          <span><strong>${value}</strong><small>${label}</small></span>
        </button>
      `).join("")}
    </section>
    <section class="workbench">
      <div class="work-panel wide-panel">
        <div class="panel-head"><h2>Fila de hoje</h2><button class="button" data-jump="assignments">Ver pautas</button></div>
        ${todayAssignments.length ? compactRows(todayAssignments, ["time", "title", "reporter", "status"]) : emptyMini("Nenhuma pauta para hoje", "Cadastre a primeira pauta para alimentar produção, reportagem e espelho.")}
      </div>
      <div class="work-panel">
        <div class="panel-head"><h2>Agenda</h2><button class="button" data-jump="calendar">Calendário</button></div>
        ${todayEvents.length ? todayEvents.map(event => `<div class="mini-item"><span class="event-dot" style="background:${event.color || "#2563eb"}"></span><strong>${event.title}</strong><small>${event.kind || "Evento"}</small></div>`).join("") : emptyMini("Sem eventos hoje", "Adicione compromissos, roteiros e tarefas.")}
      </div>
      <div class="work-panel">
        <div class="panel-head"><h2>Espelhos</h2><button class="button" data-jump="rundowns">Abrir</button></div>
        ${openRundowns.length ? openRundowns.slice(0, 4).map(r => `<div class="mini-item"><strong>${formatDate(r.date)} · ${r.program}</strong><small>${r.blocks.length} blocos</small></div>`).join("") : emptyMini("Nenhum espelho criado", "Crie um espelho para organizar blocos e laudas.")}
      </div>
      <div class="work-panel wide-panel">
        <div class="panel-head"><h2>Produção em campo</h2><button class="button" data-jump="production">Mapa</button></div>
        ${todayProduction.length ? compactRows(todayProduction, ["time", "title", "team", "status"]) : emptyMini("Nenhuma produção em campo", "Use o mapa para planejar equipes, veículos e recursos.")}
      </div>
    </section>
  `;

  $$(".stat-card").forEach(card => card.addEventListener("click", () => setActive(card.dataset.view)));
  $$("[data-jump]").forEach(button => button.addEventListener("click", () => setActive(button.dataset.jump)));
  $("#dashNewAssignment").addEventListener("click", () => openForm(modules.assignments));
  $("#dashNewRundown").addEventListener("click", () => setActive("rundowns"));
  $("#dashNewStory").addEventListener("click", () => {
    setActive("rundowns");
  });
}

function renderPageHeader(title, subtitle, actions = []) {
  return `
    <header class="page-header">
      <div>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </div>
      <div class="page-actions">
        ${actions.map(([label, id, tone]) => `<button id="${id}" class="button ${tone || ""}">${label}</button>`).join("")}
      </div>
    </header>
  `;
}

function pageSubtitle(collection) {
  const subtitles = {
    agency: "Entrada de conteúdos, materiais e informações externas para apuração.",
    rounds: "Controle de ligações, contatos institucionais e retornos de ronda.",
    proposals: "Sugestões recebidas, aprovadas e encaminhadas para produção.",
    posts: "Planejamento e acompanhamento de publicações digitais.",
    contacts: "Base de fontes, autoridades, assessorias e contatos recorrentes.",
    assignments: "Pautas do dia com pauteiros, repórteres, horários e status.",
    production: "Mapa operacional de equipes, locais, recursos e veículos.",
    reports: "Reportagens cadastradas e seus conteúdos vinculados.",
    medias: "Arquivos de vídeo, áudio, imagem e documentos da redação.",
    teams: "Escalas por data, praça e composição de equipe.",
    incidents: "Relatórios gerenciais e incidentes operacionais."
  };
  return subtitles[collection] || "Gerencie os registros deste módulo.";
}

function emptyStateHtml(config, archiveMode = false) {
  const title = archiveMode ? "Nada na lixeira" : `Nenhum registro em ${config.title}`;
  const text = archiveMode ? "Itens excluídos aparecerão aqui para restauração." : "Use o botão Nova para cadastrar o primeiro item deste módulo.";
  return `<div class="empty rich-empty"><strong>${title}</strong><span>${text}</span></div>`;
}

function emptyMini(title, text) {
  return `<div class="mini-empty"><strong>${title}</strong><span>${text}</span></div>`;
}

function compactRows(rows, keys) {
  return `
    <div class="compact-list">
      ${rows.slice(0, 6).map(row => `
        <div class="compact-row">
          ${keys.map((key, index) => `<span class="${index === 1 ? "main" : ""}">${formatCell(row[key], key)}</span>`).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function renderNotifications() {
  const notes = notificationItems();
  $("#view").innerHTML = `
    ${renderPageHeader("Notificacoes", "Alertas operacionais gerados pelo proprio painel.", [
      ["Marcar tudo como visto", "clearNotifications", "primary"],
      ["Voltar ao painel", "backDashboard", ""]
    ])}
    <section class="settings-grid registry-page">
      <div class="work-panel wide-panel">
        <div class="panel-head"><h2>Fila de alertas</h2><span class="status busy">${notes.length} aviso(s)</span></div>
        ${notes.length ? notes.map(note => `
          <div class="notice-item ${note.type}">
            <strong>${note.title}</strong>
            <span>${note.text}</span>
          </div>
        `).join("") : emptyMini("Tudo em ordem", "Nenhum alerta operacional no momento.")}
      </div>
      <div class="work-panel">
        <div class="panel-head"><h2>Resumo</h2></div>
        <div class="mini-item"><span class="event-dot"></span><strong>${state.assignments.length} pautas</strong><small>Total cadastrado</small></div>
        <div class="mini-item"><span class="event-dot"></span><strong>${state.stories.length} laudas</strong><small>Total cadastrado</small></div>
        <div class="mini-item"><span class="event-dot"></span><strong>${Object.keys(state.rundowns || {}).length} espelhos</strong><small>Total cadastrado</small></div>
      </div>
    </section>
  `;
  $("#clearNotifications").addEventListener("click", () => showToast("Alertas revisados", "success"));
  $("#backDashboard").addEventListener("click", () => setActive("dashboard"));
}

function notificationItems() {
  const today = new Date().toISOString().slice(0, 10);
  const notes = [];
  if (!Object.keys(state.rundowns || {}).length) notes.push({ type: "warning", title: "Nenhum espelho criado", text: "Crie um espelho para organizar o programa do dia." });
  if (!state.assignments.some(item => item.date === today)) notes.push({ type: "info", title: "Sem pautas para hoje", text: "A fila de pautas de hoje esta vazia." });
  if (state.medias.some(item => item.status === "Pendente")) notes.push({ type: "warning", title: "Midias pendentes", text: "Existem arquivos aguardando finalizacao no centro de midias." });
  if (!state.contacts.length) notes.push({ type: "info", title: "Agenda vazia", text: "Cadastre fontes e contatos para acelerar a apuracao." });
  return notes;
}

function renderShortcuts() {
  $("#view").innerHTML = `
    ${renderPageHeader("Atalhos", "Comandos rapidos para operar o painel com menos cliques.", [
      ["Voltar ao painel", "shortcutsBack", "primary"]
    ])}
    <section class="shortcut-grid">
      ${[
        ["Ctrl + N", "Novo registro no modulo atual"],
        ["Ctrl + S", "Salvar estado atual"],
        ["Duplo clique na linha", "Editar registro"],
        ["Clique na linha", "Selecionar registro"],
        ["Botao Backup", "Criar copia do banco"],
        ["Menu Arquivo", "Abrir lixeira por tipo de conteudo"]
      ].map(([key, text]) => `<div class="shortcut-card"><kbd>${key}</kbd><span>${text}</span></div>`).join("")}
    </section>
  `;
  $("#shortcutsBack").addEventListener("click", () => setActive("dashboard"));
}

function renderRegistries() {
  ensureSettings();
  $("#view").innerHTML = `
    ${renderPageHeader("Cadastros", "Defina os programas, repórteres, editores e praças usados no espelho e nos formulários.", [
      ["Abrir espelho", "registriesRundown", "primary"],
      ["Backup agora", "registriesBackup", ""]
    ])}
    <section class="settings-grid">
      ${registryPanel("programs", "Programas exibidos", "Ex.: ALÔ PARAÍBA")}
      ${registryPanel("reporters", "Repórteres e editores", "Ex.: Mariana Rodrigues")}
      ${registryPanel("branches", "Praças", "Ex.: João Pessoa")}
    </section>
  `;
  bindRegistry("programs");
  bindRegistry("reporters");
  bindRegistry("branches");
  $("#registriesRundown").addEventListener("click", () => setActive("rundowns"));
  $("#registriesBackup").addEventListener("click", createBackup);
}

function renderSettings() {
  const user = currentUser();
  ensureSettings();
  $("#view").innerHTML = `
    ${renderPageHeader("Configuracoes", "Preferencias do painel, banco local e backups.", [
      ["Salvar ajustes", "saveSettings", "primary"],
      ["Backup agora", "settingsBackup", ""],
      ["Limpar estado", "settingsReset", "danger"]
    ])}
    <section class="settings-grid">
      <div class="work-panel">
        <div class="panel-head"><h2>Usuario</h2></div>
        <div class="profile-box">
          <div class="avatar">${(user?.name || "N").slice(0, 1)}</div>
          <strong>${user?.name || "Usuario"}</strong>
          <span>${user?.email || ""}</span>
          <span class="status done">${user?.role || "perfil"}</span>
        </div>
      </div>
      <div class="work-panel">
        <div class="panel-head"><h2>Aparencia</h2></div>
        <label class="form-field"><span>Densidade</span><select id="densitySelect"><option value="comfortable">Confortavel</option><option value="compact">Compacta</option></select></label>
        <label class="check-line"><input id="collapseOnStart" type="checkbox"> Iniciar com menu recolhido</label>
      </div>
      <div class="work-panel print-logo-panel">
        <div class="panel-head">
          <div>
            <h2>Logo dos impressos</h2>
            <p>Escolha a marca exibida em pauta, lauda e espelho.</p>
          </div>
        </div>
        <div class="print-logo-preview">
          <img id="printLogoPreview" src="${escapeAttr(printLogoSrc())}" alt="Logo de impressao">
        </div>
        <div class="print-logo-actions">
          <label class="button primary file-button">
            <i class="fa-solid fa-image"></i>
            Escolher logo
            <input id="printLogoInput" type="file" accept="image/*">
          </label>
          <button id="resetPrintLogo" class="button" type="button"><i class="fa-solid fa-rotate-left"></i> Usar padrao</button>
        </div>
      </div>
      ${registryPanel("programs", "Programas exibidos", "Ex.: ALÔ PARAÍBA")}
      ${registryPanel("reporters", "Repórteres e editores", "Ex.: Mariana Rodrigues")}
      ${registryPanel("branches", "Praças", "Ex.: João Pessoa")}
      <div class="work-panel wide-panel">
        <div class="panel-head"><h2>Banco e backups</h2><button id="refreshBackups" class="button">Atualizar</button></div>
        <div id="backupList">${emptyMini("Carregando backups", "Buscando copias disponiveis.")}</div>
      </div>
    </section>
  `;
  $("#densitySelect").value = state.ui?.density || "comfortable";
  $("#collapseOnStart").checked = localStorage.getItem("sidebar_collapsed") === "true";
  $("#saveSettings").addEventListener("click", () => {
    state.ui = { ...(state.ui || {}), density: $("#densitySelect").value };
    document.body.classList.toggle("density-compact", state.ui.density === "compact");
    localStorage.setItem("sidebar_collapsed", $("#collapseOnStart").checked ? "true" : "false");
    saveState();
    showToast("Configuracoes salvas", "success");
  });
  $("#settingsBackup").addEventListener("click", createBackup);
  $("#settingsReset").addEventListener("click", () => openModal("Limpar estado", "Deseja apagar o estado operacional salvo?", () => {
    state = emptyState();
    saveState();
    fetch("/api/state", { method: "DELETE", headers: authHeaders() }).catch(() => {});
    render();
    return true;
  }));
  $("#refreshBackups").addEventListener("click", loadBackups);
  bindPrintLogoSettings();
  bindRegistry("programs");
  bindRegistry("reporters");
  bindRegistry("branches");
  loadBackups();
}

async function renderUsers() {
  if (currentUser()?.role !== "admin") {
    $("#view").innerHTML = `
      ${renderPageHeader("Usuários", "Somente administradores podem gerenciar acessos.", [])}
      <div class="empty rich-empty"><strong>Acesso restrito</strong><span>Entre com um usuário administrador para cadastrar a equipe.</span></div>
    `;
    return;
  }
  $("#view").innerHTML = `
    ${renderPageHeader("Usuários", "Cadastre os acessos reais da redação e defina permissões por perfil.", [
      ["Novo usuário", "newUserTop", "primary"]
    ])}
    <div class="toolbar">
      <input id="userSearch" class="grow" placeholder="Buscar usuário, e-mail ou perfil">
      <button id="reloadUsers" class="button"><i class="fa-solid fa-rotate"></i> Atualizar</button>
      <button id="newUser" class="button primary"><i class="fa-solid fa-user-plus"></i> Novo</button>
    </div>
    <div id="usersList">${emptyMini("Carregando usuários", "Buscando usuários cadastrados.")}</div>
  `;
  $("#newUserTop").addEventListener("click", () => openUserForm());
  $("#newUser").addEventListener("click", () => openUserForm());
  $("#reloadUsers").addEventListener("click", loadUsers);
  $("#userSearch").addEventListener("input", () => renderUsersTable(state.userRows || []));
  await loadUsers();
}

async function loadUsers() {
  try {
    const response = await fetch("/api/users", { headers: authHeaders() });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "Erro ao carregar usuarios");
    state.userRows = data.users || [];
    renderUsersTable(state.userRows);
  } catch (error) {
    $("#usersList").innerHTML = emptyMini("Usuários indisponíveis", error.message || "Nao foi possivel carregar usuarios.");
  }
}

function renderUsersTable(rows) {
  const query = ($("#userSearch")?.value || "").toLowerCase();
  const filtered = rows.filter(user => [user.name, user.email, user.role].filter(Boolean).join(" ").toLowerCase().includes(query));
  $("#usersList").innerHTML = `
    <table class="grid-table user-table">
      <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th></th></tr></thead>
      <tbody>
        ${filtered.map(user => `
          <tr>
            <td><strong>${escapeHtml(user.name)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="role-pill">${userRoleLabel(user.role)}</span></td>
            <td><span class="status ${user.active ? "done" : "busy"}">${user.active ? "Ativo" : "Inativo"}</span></td>
            <td>${user.last_login ? new Date(user.last_login).toLocaleString("pt-BR") : "-"}</td>
            <td class="row-actions">
              <button class="icon-button edit-user" data-id="${user.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="icon-button delete-user" data-id="${user.id}" title="Desativar"><i class="fa-regular fa-trash-can"></i></button>
            </td>
          </tr>
        `).join("") || `<tr><td colspan="6">${emptyStateHtml({ title: "Usuários" })}</td></tr>`}
      </tbody>
    </table>
  `;
  $$(".edit-user").forEach(button => button.addEventListener("click", () => {
    const user = (state.userRows || []).find(item => String(item.id) === String(button.dataset.id));
    if (user) openUserForm(user);
  }));
  $$(".delete-user").forEach(button => button.addEventListener("click", () => deactivateUser(button.dataset.id)));
}

function userRoleLabel(role) {
  return ({ admin: "Administrador", editor: "Editor", reporter: "Repórter", writer: "Pauteiro" })[role] || role;
}

function openUserForm(user = null) {
  openModal(user ? "Editar usuário" : "Novo usuário", `
    <form id="userForm" class="form-grid">
      ${renderField(field("name", "Nome", "text", true), user?.name || "")}
      ${renderField(field("email", "E-mail", "email", true), user?.email || "")}
      ${renderField(field("password", user ? "Nova senha (opcional)" : "Senha", "password", !user), "")}
      ${renderField(field("role", "Perfil", "select", true, ["admin", "editor", "reporter", "writer"]), user?.role || "reporter")}
      <label class="check-line"><input name="active" type="checkbox" ${user?.active === 0 ? "" : "checked"}> Usuário ativo</label>
    </form>
  `, async () => {
    const form = $("#userForm");
    if (!form.reportValidity()) return false;
    const values = Object.fromEntries(new FormData(form).entries());
    values.active = Boolean(form.querySelector("[name='active']").checked);
    const response = await fetch(user ? `/api/users/${user.id}` : "/api/users", {
      method: user ? "PUT" : "POST",
      headers: authHeaders(),
      body: JSON.stringify(values)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      showToast(data.error || "Nao foi possivel salvar usuario", "error");
      return false;
    }
    showToast(user ? "Usuário atualizado" : "Usuário criado", "success");
    await loadUsers();
    return true;
  }, "Salvar");
}

function deactivateUser(id) {
  openModal("Desativar usuário", "Deseja desativar este acesso?", async () => {
    const response = await fetch(`/api/users/${id}`, { method: "DELETE", headers: authHeaders() });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.success === false) {
      showToast(data.error || "Nao foi possivel desativar usuario", "error");
      return false;
    }
    showToast("Usuário desativado", "success");
    await loadUsers();
    return true;
  }, "Desativar");
}

function registryPanel(key, title, placeholder) {
  const values = state.settings?.[key] || [];
  if (key === "programs") return `
    <div class="work-panel registry-panel">
      <div class="panel-head"><h2>${title}</h2><span class="muted">${values.length}</span></div>
      <div class="registry-list">
        ${values.map((program, index) => `
          <div class="registry-row program-row">
            <strong>${escapeHtml(program.name)}</strong>
            <input class="program-start" data-index="${index}" value="${escapeAttr(program.start || "11:30:00")}" title="Início do programa">
            <input class="program-duration" data-index="${index}" value="${escapeAttr(program.duration || "02:00:00")}" title="Duração do programa">
            <input class="program-breaks" data-index="${index}" value="${escapeAttr(program.breaks || "00:04:30")}" title="Tempo de breaks">
            <button class="icon-button registry-remove" data-key="${key}" data-index="${index}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join("")}
      </div>
      <div class="registry-add program-add">
        <input id="${key}Input" placeholder="${placeholder}">
        <input id="${key}Start" placeholder="Início: 11:30:00" value="11:30:00">
        <input id="${key}Duration" placeholder="Duração: 02:00:00" value="02:00:00">
        <input id="${key}Breaks" placeholder="Breaks: 00:04:30" value="00:04:30">
        <button id="${key}Add" class="button primary" type="button">Adicionar</button>
      </div>
    </div>
  `;
  return `
    <div class="work-panel registry-panel">
      <div class="panel-head"><h2>${title}</h2><span class="muted">${values.length}</span></div>
      <div class="registry-list">
        ${values.map((value, index) => `
          <div class="registry-row">
            <strong>${escapeHtml(value)}</strong>
            <button class="icon-button registry-remove" data-key="${key}" data-index="${index}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join("")}
      </div>
      <div class="registry-add">
        <input id="${key}Input" placeholder="${placeholder}">
        <button id="${key}Add" class="button primary" type="button">Adicionar</button>
      </div>
    </div>
  `;
}

function registryPanel(key, title, placeholder) {
  const values = state.settings?.[key] || [];
  if (key === "programs") return `
    <div class="work-panel registry-panel">
      <div class="panel-head">
        <div>
          <h2>${title}</h2>
          <p>Cadastre os jornais/programas exibidos no espelho e seus tempos padr&atilde;o.</p>
        </div>
        <span class="count-badge">${values.length}</span>
      </div>
      <div class="registry-table program-registry">
        <div class="registry-table-head">
          <span>#</span><span>Programa</span><span>In&iacute;cio</span><span>Dura&ccedil;&atilde;o</span><span>Break</span><span></span>
        </div>
        ${values.map((program, index) => `
          <div class="registry-table-row program-row">
            <span class="row-index">${String(index + 1).padStart(2, "0")}</span>
            <strong>${escapeHtml(program.name)}</strong>
            <label><span>In&iacute;cio</span><input class="program-start" data-index="${index}" value="${escapeAttr(program.start || "11:30:00")}" title="In&iacute;cio do programa"></label>
            <label><span>Dura&ccedil;&atilde;o</span><input class="program-duration" data-index="${index}" value="${escapeAttr(program.duration || "02:00:00")}" title="Dura&ccedil;&atilde;o do programa"></label>
            <label><span>Break</span><input class="program-breaks" data-index="${index}" value="${escapeAttr(program.breaks || "00:04:30")}" title="Tempo de breaks"></label>
            <button class="icon-button registry-remove" data-key="${key}" data-index="${index}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join("") || `<div class="registry-empty">Nenhum programa cadastrado.</div>`}
      </div>
      <div class="registry-add-card program-add">
        <label><span>Novo programa</span><input id="${key}Input" placeholder="${placeholder}"></label>
        <label><span>In&iacute;cio</span><input id="${key}Start" placeholder="11:30:00" value="11:30:00"></label>
        <label><span>Dura&ccedil;&atilde;o</span><input id="${key}Duration" placeholder="02:00:00" value="02:00:00"></label>
        <label><span>Break</span><input id="${key}Breaks" placeholder="00:04:30" value="00:04:30"></label>
        <button id="${key}Add" class="button primary" type="button">Adicionar</button>
      </div>
    </div>
  `;
  return `
    <div class="work-panel registry-panel">
      <div class="panel-head">
        <div>
          <h2>${title}</h2>
          <p>${key === "reporters" ? "Cadastre nomes usados como rep&oacute;rteres, editores e equipe." : "Cadastre as pra&ccedil;as/cidades usadas nos espelhos e filtros."}</p>
        </div>
        <span class="count-badge">${values.length}</span>
      </div>
      <div class="registry-list clean-list">
        ${values.map((value, index) => `
          <div class="registry-row">
            <span class="row-index">${String(index + 1).padStart(2, "0")}</span>
            <strong>${escapeHtml(value)}</strong>
            <button class="icon-button registry-remove" data-key="${key}" data-index="${index}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join("") || `<div class="registry-empty">Nenhum cadastro encontrado.</div>`}
      </div>
      <div class="registry-add-card">
        <label><span>Novo cadastro</span><input id="${key}Input" placeholder="${placeholder}"></label>
        <button id="${key}Add" class="button primary" type="button">Adicionar</button>
      </div>
    </div>
  `;
}

function registryPanel(key, title, placeholder) {
  const values = state.settings?.[key] || [];
  if (key === "programs") return `
    <div class="work-panel registry-panel registry-programs-panel">
      <div class="panel-head registry-panel-head">
        <h2>${title}</h2>
        <span class="count-badge">${values.length}</span>
      </div>
      <div class="registry-table program-registry">
        <div class="registry-table-head">
          <span>Programa</span><span>In&iacute;cio</span><span>Dura&ccedil;&atilde;o</span><span>Break</span><span></span>
        </div>
        ${values.map((program, index) => `
          <div class="registry-table-row program-row">
            <strong><span class="row-index">${String(index + 1).padStart(2, "0")}</span>${escapeHtml(program.name)}</strong>
            <label><span>In&iacute;cio</span><input class="program-start" data-index="${index}" value="${escapeAttr(program.start || "11:30:00")}"></label>
            <label><span>Dura&ccedil;&atilde;o</span><input class="program-duration" data-index="${index}" value="${escapeAttr(program.duration || "02:00:00")}"></label>
            <label><span>Break</span><input class="program-breaks" data-index="${index}" value="${escapeAttr(program.breaks || "00:04:30")}"></label>
            <button class="icon-button registry-remove" data-key="${key}" data-index="${index}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join("") || `<div class="registry-empty">Nenhum programa cadastrado.</div>`}
      </div>
      <div class="registry-add-card program-add">
        <input id="${key}Input" placeholder="Nome do programa">
        <input id="${key}Start" placeholder="In&iacute;cio" value="11:30:00">
        <input id="${key}Duration" placeholder="Dura&ccedil;&atilde;o" value="02:00:00">
        <input id="${key}Breaks" placeholder="Break" value="00:04:30">
        <button id="${key}Add" class="button primary" type="button">Adicionar</button>
      </div>
    </div>
  `;
  return `
    <div class="work-panel registry-panel">
      <div class="panel-head registry-panel-head">
        <h2>${title}</h2>
        <span class="count-badge">${values.length}</span>
      </div>
      <div class="registry-list clean-list">
        ${values.map((value, index) => `
          <div class="registry-row">
            <span class="row-index">${String(index + 1).padStart(2, "0")}</span>
            <strong>${escapeHtml(value)}</strong>
            <button class="icon-button registry-remove" data-key="${key}" data-index="${index}" title="Remover"><i class="fa-solid fa-xmark"></i></button>
          </div>
        `).join("") || `<div class="registry-empty">Nenhum cadastro encontrado.</div>`}
      </div>
      <div class="registry-add-card">
        <input id="${key}Input" placeholder="${key === "branches" ? "Nome da pra&ccedil;a" : "Nome do profissional"}">
        <button id="${key}Add" class="button primary" type="button">Adicionar</button>
      </div>
    </div>
  `;
}

function bindPrintLogoSettings() {
  const input = $("#printLogoInput");
  const reset = $("#resetPrintLogo");
  input?.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Selecione uma imagem valida", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxWidth = 900;
        const maxHeight = 500;
        const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        ensureSettings();
        state.settings.printLogo = canvas.toDataURL("image/png");
        $("#printLogoPreview")?.setAttribute("src", state.settings.printLogo);
        saveState();
        syncStateToServer().catch(() => {});
        showToast("Logo de impressao atualizada", "success");
      };
      image.onerror = () => showToast("Nao foi possivel carregar a imagem", "error");
      image.src = String(reader.result || "");
    };
    reader.onerror = () => showToast("Nao foi possivel ler o arquivo", "error");
    reader.readAsDataURL(file);
  });
  reset?.addEventListener("click", () => {
    ensureSettings();
    state.settings.printLogo = "";
    $("#printLogoPreview")?.setAttribute("src", "./logo.png");
    saveState();
    syncStateToServer().catch(() => {});
    showToast("Logo padrao restaurada", "success");
  });
}

function bindRegistry(key) {
  $$(".registry-remove").filter(button => button.dataset.key === key).forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      state.settings[key].splice(index, 1);
      ensureSettings();
      saveState();
      renderRegistryHost();
      showToast("Cadastro removido", "success");
    });
  });
  $(`#${key}Add`)?.addEventListener("click", () => addRegistryItem(key));
  $(`#${key}Input`)?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      addRegistryItem(key);
    }
  });
  if (key === "programs") {
    $$(".program-start, .program-duration, .program-breaks").forEach(input => input.addEventListener("change", () => {
      const index = Number(input.dataset.index);
      if (!state.settings.programs[index]) return;
      if (input.classList.contains("program-start")) state.settings.programs[index].start = normalizeDuration(input.value);
      if (input.classList.contains("program-duration")) state.settings.programs[index].duration = normalizeDuration(input.value);
      if (input.classList.contains("program-breaks")) state.settings.programs[index].breaks = normalizeDuration(input.value);
      saveState();
      renderRegistryHost();
      showToast("Horários do programa atualizados", "success");
    }));
  }
}

function addRegistryItem(key) {
  const input = $(`#${key}Input`);
  const value = input?.value.trim();
  if (!value) {
    showToast("Informe um nome para cadastrar", "warning");
    return;
  }
  ensureSettings();
  const exists = key === "programs"
    ? state.settings.programs.some(item => item.name.toLowerCase() === value.toLowerCase())
    : state.settings[key].some(item => item.toLowerCase() === value.toLowerCase());
  if (exists) {
    showToast("Este cadastro ja existe", "info");
    return;
  }
  if (key === "programs") state.settings.programs.push({
    name: value,
    start: normalizeDuration($(`#${key}Start`)?.value || "11:30:00"),
    duration: normalizeDuration($(`#${key}Duration`)?.value || "02:00:00"),
    breaks: normalizeDuration($(`#${key}Breaks`)?.value || "00:04:30")
  });
  else state.settings[key].push(value);
  if (key === "programs" && !state.program) state.program = value;
  if (key === "branches" && !state.branch) state.branch = value;
  saveState();
  renderRegistryHost();
  showToast("Cadastro adicionado", "success");
}

function renderRegistryHost() {
  if (state.active === "registries") renderRegistries();
  else renderSettings();
}

async function loadBackups() {
  const target = $("#backupList");
  if (!target) return;
  try {
    const response = await fetch("/api/backup", { headers: authHeaders() });
    const data = await response.json();
    const backups = data.backups || [];
    target.innerHTML = backups.length ? backups.map(item => `
      <div class="backup-row">
        <strong>${item.filename}</strong>
        <span>${new Date(item.created).toLocaleString("pt-BR")} · ${Math.round(item.size / 1024)} KB</span>
      </div>
    `).join("") : emptyMini("Nenhum backup", "Crie o primeiro backup manual pelo botao acima.");
  } catch {
    target.innerHTML = emptyMini("Backup indisponivel", "Entre como editor ou admin para listar backups.");
  }
}

function renderCrudModule(config, overrideRows = null, archiveMode = false) {
  const rows = overrideRows || state[config.collection] || [];
  const filtered = applyFilter(rows, config);
  const canCreate = can("create", config.collection);
  $("#view").innerHTML = `
    ${renderPageHeader(config.title, pageSubtitle(config.collection), [
      [archiveMode ? "Restaurar" : "Novo", "newItemTop", "primary"],
      ["Exportar", "exportItemTop", ""],
      ["Imprimir", "printItemTop", ""]
    ])}
    ${renderModuleToolbar(config, archiveMode)}
    ${renderDataTable(config, filtered, archiveMode)}
  `;
  bindCrud(config, filtered, archiveMode);
  $("#newItemTop")?.toggleAttribute("disabled", archiveMode || !canCreate);
  $("#newItemTop")?.addEventListener("click", () => openForm(config));
  $("#exportItemTop")?.addEventListener("click", () => exportCsv(config.collection, filtered));
  $("#printItemTop")?.addEventListener("click", () => printModule(config, filtered));
}
function renderModuleToolbar(config, archiveMode = false) {
  const f = state.filters[config.collection] || {};
  const canCreate = can("create", config.collection);
  const canEdit = can("edit", config.collection);
  const canDelete = can("delete", config.collection);
  return `
    <div class="toolbar">
      <input id="dateStart" type="date" value="${f.dateStart || ""}">
      <input id="dateEnd" type="date" value="${f.dateEnd || ""}">
      <select id="statusFilter"><option value="">Todos</option>${statusOptions(config).map(s => `<option ${f.status === s ? "selected" : ""}>${s}</option>`).join("")}</select>
      <input id="textFilter" class="grow" placeholder="Filtrar por retranca ou conteúdo" value="${escapeAttr(f.text || "")}">
      <button id="runFilter" class="button">⌕</button>
      <button id="clearFilter" class="button">Limpar</button>
      <span class="spacer"></span>
      ${archiveMode ? `<button id="restoreItem" class="button primary" ${canEdit ? "" : "disabled"}>Restaurar</button>` : `<button id="newItem" class="button primary" ${canCreate ? "" : "disabled"}>Nova</button>`}
      <button id="editItem" class="button" ${canEdit ? "" : "disabled"}>Editar</button>
      <button id="duplicateItem" class="button" ${canCreate ? "" : "disabled"}>Duplicar</button>
      <button id="deleteItem" class="button danger" ${canDelete ? "" : "disabled"}>${archiveMode ? "Excluir definitivo" : "Excluir"}</button>
      <button id="exportItem" class="button">Exportar</button>
      <button id="printItem" class="button">Imprimir</button>
    </div>
  `;
}
function renderDataTable(config, rows, archiveMode = false) {
  return `
    <table class="grid-table">
      <thead>
        <tr><th class="tiny-col"><input id="selectAll" type="checkbox"></th>${config.columns.map(([, label]) => `<th>${label}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows.map(row => `
          <tr class="${selectedId(config) === row.id ? "selected" : ""}" data-id="${row.id}">
            <td><input class="row-select" type="checkbox" ${selectedId(config) === row.id ? "checked" : ""}></td>
            ${config.columns.map(([key]) => `<td>${formatCell(row[key], key)}</td>`).join("")}
          </tr>
        `).join("") || `<tr><td colspan="${config.columns.length + 1}">${emptyStateHtml(config, archiveMode)}</td></tr>`}
      </tbody>
    </table>
  `;
}
function bindCrud(config, rows, archiveMode = false) {
  $("#selectAll")?.addEventListener("change", (event) => {
    if (event.target.checked && rows[0]) {
      state.selected[config.collection] = rows[0].id;
      saveState();
      renderCrudModule(config, rows, archiveMode);
    }
  });
  $$("#view tbody tr[data-id]").forEach(row => {
    row.addEventListener("click", () => {
      state.selected[config.collection] = row.dataset.id;
      saveState();
      renderCrudModule(config, rows, archiveMode);
    });
    row.addEventListener("dblclick", () => openForm(config, findById(config.collection, row.dataset.id)));
  });
  $("#runFilter")?.addEventListener("click", () => {
    state.filters[config.collection] = { text: $("#textFilter").value, dateStart: $("#dateStart").value, dateEnd: $("#dateEnd").value, status: $("#statusFilter").value };
    saveState();
    renderCrudModule(config, null, archiveMode);
  });
  $("#clearFilter")?.addEventListener("click", () => {
    state.filters[config.collection] = {};
    saveState();
    renderCrudModule(config, null, archiveMode);
  });
  $("#newItem")?.addEventListener("click", () => openForm(config));
  $("#editItem")?.addEventListener("click", () => {
    const row = selectedRecord(config);
    if (row) openForm(config, row);
    else showToast("Selecione um registro para editar", "info");
  });
  $("#duplicateItem")?.addEventListener("click", () => duplicateRecord(config));
  $("#deleteItem")?.addEventListener("click", () => deleteSelected(config, archiveMode));
  $("#restoreItem")?.addEventListener("click", () => restoreSelected(config));
  $("#exportItem")?.addEventListener("click", () => exportCsv(config.collection, rows));
  $("#printItem")?.addEventListener("click", () => printModule(config, rows));
}

function printModule(config, rows = []) {
  if (config.collection === "assignments") {
    const selected = selectedRecord(config) || rows[0];
    if (!selected) {
      showToast("Selecione uma pauta para imprimir", "info");
      return;
    }
    printAssignment(selected);
    return;
  }
  window.print();
}

function applyFilter(rows, config) {
  const f = state.filters[config.collection] || {};
  return rows.filter(row => {
    const text = [row.title, row.name, row.content, row.proposal, row.forwarding, row.information, row.source, row.reporter, row.reporters, row.writer, row.writers, row.program].filter(Boolean).join(" ").toLowerCase();
    const okText = !f.text || text.includes(f.text.toLowerCase());
    const okStatus = !f.status || row.status === f.status || row.contentStatus === f.status;
    const date = row.date || toIsoDate(row.updatedAt);
    const okStart = !f.dateStart || !date || date >= f.dateStart;
    const okEnd = !f.dateEnd || !date || date <= f.dateEnd;
    return okText && okStatus && okStart && okEnd;
  });
}
function statusOptions(config) {
  return [...new Set((state[config.collection] || []).map(row => row.status || row.contentStatus).filter(Boolean))];
}

function openForm(config, row = null) {
  if (config.collection === "assignments") {
    openAssignmentForm(row);
    return;
  }
  const action = row ? "edit" : "create";
  if (!can(action, config.collection)) {
    showToast("Seu perfil nao tem permissao para esta acao", "warning");
    return;
  }
  const data = row || {};
  openModal(row ? `Editar ${config.title}` : `Nova ${config.title}`, `
    <form id="recordForm" class="form-grid">
      ${config.fields.map(f => renderField(f, data[f.name])).join("")}
    </form>
  `, () => {
    const form = $("#recordForm");
    if (!form.reportValidity()) return false;
    const values = Object.fromEntries(new FormData(form).entries());
    if (row) Object.assign(row, values, { updatedAt: nowText() });
    else (state[config.collection] ||= []).unshift(rec(config.type, values));
    saveState();
    render();
    return true;
  }, "Salvar");
}

function openAssignmentForm(row = null) {
  const action = row ? "edit" : "create";
  if (!can(action, "assignments")) {
    showToast("Seu perfil nao tem permissao para esta acao", "warning");
    return;
  }
  const user = currentUser();
  if (row?.lockedBy && row.lockedBy !== user?.email) {
    showToast(`Pauta bloqueada por ${row.lockedByName || row.lockedBy}`, "warning");
    return;
  }
  if (row) {
    row.lockedBy = user?.email || "usuario";
    row.lockedByName = user?.name || "Usuario";
    row.lockStatus = `Bloqueado: ${row.lockedByName}`;
    saveState();
    render();
  }
  const data = normalizeAssignment(row || {});
  openModal(row ? `Editar Pauta: ${data.title || "Sem retranca"}` : "Nova Pauta", `
    <form id="assignmentForm" class="assignment-form">
      <section class="assignment-section">
        <h3>Dados da pauta</h3>
        <div class="form-grid">
          ${assignmentInput("title", "Retranca", data.title, "text", true)}
          ${assignmentInput("date", "Data", data.date || state.date, "date", true)}
          ${assignmentSelect("programMode", "Exibição", data.programMode || "Programa específico", ["Programa específico", "Todos"])}
          ${assignmentSelect("program", "Programa", data.program || state.program, programs())}
          ${assignmentInput("writers", "Pauteiros", data.writers || data.writer || "", "text", true, "Nomes separados por virgula")}
          ${assignmentInput("reporters", "Repórteres", data.reporters || data.reporter || "", "text", true, "Nomes separados por virgula")}
          ${assignmentInput("camera", "Câmera", data.camera || "")}
          ${assignmentInput("editors", "Editores", data.editors || "")}
          ${assignmentSelect("status", "Status", data.status || "Produção", ["Produção", "Pronta", "Cancelada", "Bloqueada"])}
          ${assignmentInput("time", "Hora principal", data.time || "", "time")}
          ${assignmentTextarea("proposal", "Proposta", data.proposal || data.content || "")}
          ${assignmentTextarea("forwarding", "Encaminhamento", data.forwarding || "")}
          ${assignmentTextarea("information", "Informações", data.information || "")}
        </div>
      </section>
      <section class="assignment-section">
        <div class="section-title">
          <h3>Roteiros e entrevistados</h3>
          <button id="addAssignmentRoute" class="button" type="button">Adicionar roteiro</button>
        </div>
        <div id="assignmentRoutes" class="route-list"></div>
      </section>
    </form>
  `, () => saveAssignmentForm(row), "Salvar pauta");
  modalCloseHandler = () => {
    if (row) releaseAssignmentLock(row, false);
  };
  assignmentRoutesDraft = (data.routes || []).map(route => ({ ...route }));
  renderAssignmentRoutes();
  $("#addAssignmentRoute").addEventListener("click", addAssignmentRoute);
}

let assignmentRoutesDraft = [];

function normalizeAssignment(data) {
  return {
    date: state.date,
    program: state.program,
    programMode: "Programa específico",
    status: "Produção",
    routes: [],
    ...data
  };
}

function assignmentInput(name, label, value = "", type = "text", required = false, placeholder = "") {
  return `<label class="form-field"><span>${label}</span><input name="${name}" type="${type}" value="${escapeAttr(value || "")}" placeholder="${escapeAttr(placeholder)}" ${required ? "required" : ""}></label>`;
}

function assignmentTextarea(name, label, value = "") {
  return `<label class="form-field wide"><span>${label}</span><textarea name="${name}">${escapeHtml(value || "")}</textarea></label>`;
}

function assignmentSelect(name, label, value, options) {
  return `<label class="form-field"><span>${label}</span><select name="${name}">${options.map(option => `<option ${option === value ? "selected" : ""}>${option}</option>`).join("")}</select></label>`;
}

function renderAssignmentRoutes() {
  const target = $("#assignmentRoutes");
  if (!target) return;
  target.innerHTML = assignmentRoutesDraft.length ? assignmentRoutesDraft.map((route, index) => `
    <div class="route-card" data-index="${index}">
      <div class="route-head">
        <strong>Roteiro ${index + 1}</strong>
        <button class="icon-button remove-route" data-index="${index}" type="button" title="Remover"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="form-grid">
        ${routeInput(index, "time", "Hora da pauta", route.time || "", "time")}
        ${routeInput(index, "interviewee", "Entrevistado", route.interviewee || "")}
        ${routeInput(index, "phone", "Telefone", route.phone || "")}
        ${routeInput(index, "address", "Endereço", route.address || "")}
        ${routeTextarea(index, "notes", "Observações", route.notes || "")}
      </div>
    </div>
  `).join("") : emptyMini("Nenhum roteiro", "Adicione horários, entrevistados, endereço e telefone.");
  $$(".route-card input, .route-card textarea").forEach(input => input.addEventListener("input", syncAssignmentRouteInput));
  $$(".remove-route").forEach(button => button.addEventListener("click", () => {
    assignmentRoutesDraft.splice(Number(button.dataset.index), 1);
    renderAssignmentRoutes();
  }));
}

function routeInput(index, name, label, value = "", type = "text") {
  return `<label class="form-field"><span>${label}</span><input data-route="${index}" data-field="${name}" type="${type}" value="${escapeAttr(value)}"></label>`;
}

function routeTextarea(index, name, label, value = "") {
  return `<label class="form-field wide"><span>${label}</span><textarea data-route="${index}" data-field="${name}">${escapeHtml(value)}</textarea></label>`;
}

function syncAssignmentRouteInput(event) {
  const index = Number(event.target.dataset.route);
  const fieldName = event.target.dataset.field;
  assignmentRoutesDraft[index][fieldName] = event.target.value;
}

function addAssignmentRoute() {
  assignmentRoutesDraft.push({ id: rec("route", {}).id, time: "", interviewee: "", phone: "", address: "", notes: "" });
  renderAssignmentRoutes();
}

function saveAssignmentForm(row) {
  const form = $("#assignmentForm");
  if (!form.reportValidity()) return false;
  const values = Object.fromEntries(new FormData(form).entries());
  const record = {
    ...values,
    writer: values.writers,
    reporter: values.reporters,
    content: values.proposal,
    routes: assignmentRoutesDraft.filter(route => route.time || route.interviewee || route.phone || route.address || route.notes),
    lockedBy: null,
    lockedByName: null,
    lockStatus: "Livre",
    updatedAt: nowText()
  };
  if (row) Object.assign(row, record);
  else {
    const created = rec("assignment", record);
    state.assignments.unshift(created);
    state.selected.assignments = created.id;
  }
  saveAssignmentRouteContacts(record.routes);
  saveState();
  modalCloseHandler = null;
  render();
  return true;
}

function saveAssignmentRouteContacts(routes) {
  routes.filter(route => route.phone && route.interviewee).forEach(route => {
    const exists = state.contacts.some(contact => contact.phone === route.phone || contact.name?.toLowerCase() === route.interviewee.toLowerCase());
    if (exists) return;
    if (confirm(`Deseja deixar o telefone de ${route.interviewee} salvo na Agenda?`)) {
      state.contacts.unshift(rec("contact", {
        name: route.interviewee,
        profession: "",
        company: "",
        phone: route.phone,
        email: "",
        notes: [route.address, route.notes].filter(Boolean).join("\n")
      }));
    }
  });
}

function releaseAssignmentLock(row, shouldRender = true) {
  if (!row) return;
  row.lockedBy = null;
  row.lockedByName = null;
  row.lockStatus = "Livre";
  saveState();
  if (shouldRender) render();
}

function printAssignment(assignment) {
  const routes = assignment.routes || [];
  const doc = `
    <section class="print-assignment-doc">
      <table class="assignment-head">
        <tr>
          <td class="logo-cell" rowspan="4"><img src="./logo.png" alt="Nexus"></td>
          <th colspan="2">MODELO DE PAUTA</th>
        </tr>
        <tr>
          <td><strong>REPÓRTER:</strong> ${escapeHtml(assignment.reporters || assignment.reporter || "")}</td>
          <td><strong>DATA DE GRAVAÇÃO:</strong> ${formatDate(assignment.date)}</td>
        </tr>
        <tr>
          <td class="blue-row" colspan="2"><strong>RETRANCA:</strong> ${escapeHtml(assignment.title || "")}</td>
        </tr>
        <tr>
          <td><strong>PRODUTOR(A):</strong> ${escapeHtml(assignment.writers || assignment.writer || "")}</td>
          <td><strong>CINEGRAFISTA:</strong> ${escapeHtml(assignment.camera || "")}</td>
        </tr>
      </table>
      <div class="assignment-box">
        <h2>ELEMENTOS IMPORTANTES</h2>
        ${assignmentPrintBlock("RESUMO DO TEMA DA PAUTA", assignment.proposal || assignment.content)}
        ${assignmentPrintBlock("ENCAMINHAMENTO", assignment.forwarding)}
        ${assignmentPrintBlock("HÁ DADOS IMPORTANTES PARA A MATÉRIA?", assignment.information)}
        <h3>ENTREVISTADOS:</h3>
        ${routes.length ? routes.map(route => `
          <div class="assignment-route-print">
            <strong>${escapeHtml(route.time || "")} ${escapeHtml(route.interviewee || "")}</strong>
            <p>${escapeHtml(route.address || "")}</p>
            <p>${route.phone ? `<strong>Telefone:</strong> ${escapeHtml(route.phone)}` : ""}</p>
            <p>${nl(route.notes || "")}</p>
          </div>
        `).join("") : `<p>Sem entrevistados cadastrados.</p>`}
        ${assignmentPrintBlock("OBSERVAÇÕES", assignment.observations || "")}
      </div>
    </section>
  `;
  const previous = $("#printAssignmentHost");
  previous?.remove();
  const host = document.createElement("div");
  host.id = "printAssignmentHost";
  host.innerHTML = doc;
  document.body.appendChild(host);
  window.print();
  setTimeout(() => host.remove(), 500);
}

function assignmentPrintBlock(title, value = "") {
  return `
    <h3>${title}:</h3>
    <p>${nl(value || " ")}</p>
  `;
}

function printAssignment(assignment) {
  const routes = assignment.routes || [];
  const doc = `
    <section class="print-assignment-doc">
      <table class="assignment-head">
        <tr>
          <td class="logo-cell" rowspan="4"><img src="./logo.png" alt="Nexus"></td>
          <th colspan="2">MODELO DE PAUTA</th>
        </tr>
        <tr>
          <td><strong>REPÓRTER:</strong> ${escapeHtml(assignment.reporters || assignment.reporter || "")}</td>
          <td><strong>DATA DE GRAVAÇÃO:</strong> ${formatDate(assignment.date)}</td>
        </tr>
        <tr>
          <td class="blue-row" colspan="2"><strong>RETRANCA:</strong> ${escapeHtml(assignment.title || "")}</td>
        </tr>
        <tr>
          <td><strong>PRODUTOR(A):</strong> ${escapeHtml(assignment.writers || assignment.writer || "")}</td>
          <td><strong>CINEGRAFISTA:</strong> ${escapeHtml(assignment.camera || "")}</td>
        </tr>
      </table>

      <div class="assignment-box">
        <h2>ELEMENTOS IMPORTANTES</h2>
        ${assignmentPrintBlock("RESUMO DO TEMA DA PAUTA", assignment.proposal || assignment.content)}
        ${assignmentPrintBlock("ENCAMINHAMENTO", assignment.forwarding)}
        ${assignmentPrintBlock("HÁ DADOS IMPORTANTES PARA A MATÉRIA?", assignment.information)}

        <h3>ENTREVISTADOS:</h3>
        ${routes.length ? routes.map(route => `
          <div class="assignment-route-print">
            <p><strong>HORÁRIO:</strong> ${escapeHtml(route.time || "")}</p>
            <p><strong>ENTREVISTADO:</strong> ${escapeHtml(route.interviewee || "")}</p>
            <p><strong>TELEFONE:</strong> ${escapeHtml(route.phone || "")}</p>
            <p><strong>ENDEREÇO:</strong> ${escapeHtml(route.address || "")}</p>
            <p><strong>OBSERVAÇÕES:</strong> ${nl(route.notes || "")}</p>
          </div>
        `).join("") : `<p>&nbsp;</p>`}
        ${assignmentPrintBlock("OBSERVAÇÕES", assignment.observations || "")}
      </div>
    </section>
  `;
  const previous = $("#printAssignmentHost");
  previous?.remove();
  const host = document.createElement("div");
  host.id = "printAssignmentHost";
  host.innerHTML = doc;
  document.body.appendChild(host);
  window.print();
  setTimeout(() => host.remove(), 500);
}

function renderField(f, value = "") {
  const required = f.required ? "required" : "";
  if (f.type === "textarea") {
    return `<label class="form-field wide"><span>${f.label}</span><textarea name="${f.name}" ${required}>${escapeHtml(value || "")}</textarea></label>`;
  }
  if (f.type === "select") {
    const options = typeof f.options === "function" ? f.options() : (f.options || []);
    return `<label class="form-field"><span>${f.label}</span><select name="${f.name}" ${required}>${options.map(opt => `<option ${value === opt ? "selected" : ""}>${opt}</option>`).join("")}</select></label>`;
  }
  return `<label class="form-field"><span>${f.label}</span><input name="${f.name}" type="${f.type}" value="${escapeAttr(value || "")}" ${required}></label>`;
}
function duplicateRecord(config) {
  if (!can("create", config.collection)) {
    showToast("Seu perfil nao pode duplicar neste modulo", "warning");
    return;
  }
  const row = selectedRecord(config);
  if (!row) {
    showToast("Selecione um registro para duplicar", "info");
    return;
  }
  if (!row) return;
  const copy = rec(config.type, { ...row, id: undefined, title: row.title ? `${row.title} (cópia)` : row.name ? `${row.name} (cópia)` : undefined });
  state[config.collection].unshift(copy);
  state.selected[config.collection] = copy.id;
  saveState();
  render();
}
function deleteSelected(config, permanent = false) {
  if (!can("delete", config.collection)) {
    showToast("Seu perfil nao pode excluir registros", "warning");
    return;
  }
  const row = selectedRecord(config);
  if (!row) {
    showToast("Selecione um registro para excluir", "info");
    return;
  }
  if (!row) return;
  openModal("Confirmação", `Deseja ${permanent ? "excluir definitivamente" : "enviar para a lixeira"} este item?`, () => {
    state[config.collection] = (state[config.collection] || []).filter(item => item.id !== row.id);
    if (!permanent) state.trash.unshift(rec("trash", { originalCollection: config.collection, originalType: config.type, deletedAt: nowText(), payload: row, title: row.title || row.name || "Item sem título" }));
    state.selected[config.collection] = null;
    saveState();
    render();
    return true;
  });
}
function restoreSelected(config) {
  const trashRow = selectedRecord(config);
  if (!trashRow) return;
  const target = trashRow.originalCollection;
  state[target] ||= [];
  state[target].unshift(trashRow.payload);
  state.trash = state.trash.filter(item => item.id !== trashRow.id);
  saveState();
  render();
}
function selectedId(config) {
  return state.selected[config.collection];
}
function selectedRecord(config) {
  return findById(config.collection, selectedId(config));
}
function findById(collection, id) {
  return (state[collection] || []).find(row => row.id === id);
}

function renderRundowns() {
  const key = rundownKey();
  if (state.rundownBrowse === false) {
    $("#view").innerHTML = `
      ${renderPageHeader("Espelhos", "Selecione a data e o programa para carregar um espelho.", [])}
      <div class="toolbar">${rundownControls()}<span class="spacer"></span>${recoveryMenuHtml()}</div>
      <div class="empty rich-empty rundown-empty">
        <strong>Carregue um espelho para começar</strong>
        <span>Escolha a data e o programa e clique em Carregar.</span>
      </div>
    `;
    bindRundownControls();
    bindRecoveryControls();
    return;
  }
  if (!state.rundowns[key]) {
    $("#view").innerHTML = `
      ${renderPageHeader("Espelhos", "Monte o roteiro do programa em blocos, laudas e tempos.", [
        ["Criar espelho", "createRundownTop", "primary"]
      ])}
      <div class="toolbar">${rundownControls()}<span class="spacer"></span>${recoveryMenuHtml()}<button id="createRundown" class="button primary">Criar espelho</button></div>
      <div class="empty rich-empty rundown-empty">
        <strong>Não existe espelho para esta data e programa</strong>
        <span>Crie o espelho para começar a adicionar blocos, laudas, VTs, notas e stand by.</span>
      </div>
    `;
    bindRundownControls();
    bindRecoveryControls();
    $("#createRundown").addEventListener("click", createRundown);
    $("#createRundownTop").addEventListener("click", createRundown);
    return;
  }
  const rundown = state.rundowns[key];
  const rows = rundown.blocks.flatMap(b => b.rows);
  normalizeRundownTiming(rundown);
  const timing = rundownTiming(rundown);
  $("#view").innerHTML = `
    ${renderPageHeader("Espelhos", `${formatDate(rundown.date)} · ${rundown.program}`, [
      ["Nova lauda", "addStoryTop", "primary"],
      ["Novo bloco", "addBlockTop", ""],
      ["Stand By", "addStandbyTop", ""],
      ["Imprimir", "printRundownTop", ""],
      ["Espelho Completo", "printFullRundownTop", ""]
    ])}
    <div class="toolbar">
      ${rundownControls()}
      <span class="spacer"></span>
      ${recoveryMenuHtml()}
      <button id="addBlock" class="button">+ Bloco</button>
      <button id="addStandby" class="button">Stand By</button>
      <button id="editRundownTime" class="button">Horários</button>
      <button id="renumber" class="button">Ordenar</button>
      <button id="approveStory" class="button">Aprovar</button>
      <button id="printRundown" class="button">Imprimir</button>
      <button id="printFullRundown" class="button">Espelho Completo</button>
      <button id="exportRundown" class="button">Exportar</button>
    </div>
    <div class="metrics">
      ${metric("Início", rundown.start)}
      ${metric("Término", rundown.end)}
      ${metric("Duração", timing.duration)}
      ${metric("Breaks", timing.breaks)}
      ${metric("Produção", timing.production)}
      ${metric("Total", timing.total)}
      ${metric("Sobra", timing.balance, timing.balanceSeconds >= 0 ? "positive" : "negative")}
      ${metric("Laudas", rows.length)}
    </div>
    ${rundown.blocks.map((blockData, index) => renderRundownBlock(blockData, index)).join("")}
    ${renderPrintableRundown(rundown)}
    ${renderStoryPreview()}
  `;
  bindRundownControls();
  bindRecoveryControls();
  $$("#view .story-row").forEach(row => {
    row.addEventListener("click", () => selectRundownRow(row.dataset.id));
    row.addEventListener("dblclick", () => openRundownRowForEdit(row.dataset.id));
    row.addEventListener("contextmenu", event => {
      event.preventDefault();
      selectRundownRow(row.dataset.id, false);
      openRundownRowMenu(row.dataset.id, event.clientX, event.clientY);
    });
  });
  $$("#view .inline-rundown-edit").forEach(cell => cell.addEventListener("click", event => {
    event.stopPropagation();
    startInlineRundownEdit(cell);
  }));
  bindRundownDragAndDrop();
  $$("#view .edit-story").forEach(button => button.addEventListener("click", (event) => {
    event.stopPropagation();
    const storyId = button.dataset.story;
    openStoryTab(storyId);
  }));
  $$("#view .delete-rundown-row").forEach(button => button.addEventListener("click", (event) => {
    event.stopPropagation();
    deleteRundownRow(button.dataset.row);
  }));
  $$("#view .story-ok-toggle").forEach(input => input.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleStoryOk(input.dataset.row, input.checked);
  }));
  $$(".add-lauda").forEach(button => button.addEventListener("click", () => addRundownRow(Number(button.dataset.block))));
  $("#addBlock").addEventListener("click", addRundownBlock);
  $("#addBlockTop").addEventListener("click", addRundownBlock);
  $("#addStandby").addEventListener("click", addStandbyBlock);
  $("#addStandbyTop").addEventListener("click", addStandbyBlock);
  $("#editRundownTime").addEventListener("click", editRundownTime);
  $("#addStoryTop").addEventListener("click", () => addRundownRow(0));
  $("#renumber").addEventListener("click", () => openModal("Confirmação", "Você realmente deseja renumerar TODAS as laudas?", () => { renumberRundown(); return true; }));
  $("#approveStory").addEventListener("click", approveCurrentStory);
  $("#printRundown").addEventListener("click", () => window.print());
  $("#printRundownTop").addEventListener("click", () => window.print());
  $("#printFullRundown").addEventListener("click", printFullRundownStories);
  $("#printFullRundownTop").addEventListener("click", printFullRundownStories);
  $("#exportRundown").addEventListener("click", () => exportCsv("espelho", rows));
  $$("#view .block-break-input").forEach(input => input.addEventListener("blur", () => updateBlockBreak(Number(input.dataset.block), input.value)));
  $("#openStory")?.addEventListener("click", () => openStoryTab(state.currentStoryId));
  $("#closePreview")?.addEventListener("click", closePreview);
  $("#copyStory")?.addEventListener("click", copyStoryText);
  $("#printStoryPreview")?.addEventListener("click", () => {
    const storyData = getStory(state.currentStoryId);
    if (storyData) printStory(storyData);
  });
}
function rundownControls() {
  return `
    <input id="rundownDate" type="date" value="${state.date}">
    <select id="rundownProgram">${programs().map(p => `<option ${p === state.program ? "selected" : ""}>${p}</option>`).join("")}</select>
    <button id="loadRundown" class="button">Carregar</button>
  `;
}
function bindRundownControls() {
  $("#rundownDate").addEventListener("change", (event) => { state.date = event.target.value; saveState(); });
  $("#rundownProgram").addEventListener("change", (event) => { state.program = event.target.value; saveState(); });
  $("#loadRundown").addEventListener("click", () => {
    state.rundownBrowse = true;
    saveState();
    renderRundowns();
  });
}
function rundownKey() {
  return `${state.date}|${state.program}`;
}
function createRundown() {
  if (state.date < toIsoDate(new Date())) {
    openModal("Espelho bloqueado", "Esse espelho não existe e não pode ser criado.", () => true, "OK");
    return;
  }
  const program = programConfig();
  const start = program.start || "11:30:00";
  state.rundowns[rundownKey()] = {
    date: state.date,
    program: state.program,
    start,
    end: addTime(start, program.duration),
    duration: program.duration,
    breaks: program.breaks || "00:04:30",
    presenter: "",
    textEditor: "",
    city: state.branch || "",
    materialType: "LINK VIVO",
    blocks: [
      { ...block("Bloco 1", []), breakTime: program.breaks || "00:04:30" },
      { ...block("Stand By", [], true), breakTime: "00:00" }
    ]
  };
  state.rundownBrowse = true;
  saveState();
  renderRundowns();
}

function normalizeRundownTiming(rundown) {
  const program = programConfig(rundown.program);
  rundown.start ||= program.start || "11:30:00";
  rundown.duration ||= program.duration || diffText(rundown.start, rundown.end || addTime(rundown.start, "02:00:00"));
  rundown.end ||= addTime(rundown.start, rundown.duration);
  rundown.breaks ||= program.breaks || "00:04:30";
  (rundown.blocks || []).forEach(blockData => {
    if (blockData.breakTime === undefined && blockData.breaks !== undefined) blockData.breakTime = blockData.breaks;
  });
}

function rundownTiming(rundown) {
  normalizeRundownTiming(rundown);
  const productionSeconds = (rundown.blocks || [])
    .filter(blockData => !blockData.standby && !/stand\s*by/i.test(blockData.title || ""))
    .flatMap(blockData => blockData.rows || [])
    .reduce((total, row) => total + timeToSeconds(row.total), 0);
  const breakSeconds = rundownBreakSeconds(rundown);
  const durationSeconds = timeToSeconds(diffText(rundown.start, rundown.end));
  const totalSeconds = productionSeconds + breakSeconds;
  const balanceSeconds = durationSeconds - totalSeconds;
  return {
    duration: secondsToTime(durationSeconds),
    breaks: secondsToTime(breakSeconds),
    production: secondsToTime(productionSeconds),
    total: secondsToTime(totalSeconds),
    balance: `${balanceSeconds < 0 ? "-" : ""}${secondsToTime(Math.abs(balanceSeconds))}`,
    balanceSeconds
  };
}

function rundownBreakSeconds(rundown) {
  const blocks = rundown?.blocks || [];
  const hasBlockBreaks = blocks.some(blockData => blockData.breakTime !== undefined);
  if (!hasBlockBreaks) return timeToSeconds(rundown?.breaks || "00:00");
  return blocks
    .filter(blockData => !blockData.standby && !/stand\s*by/i.test(blockData.title || ""))
    .reduce((total, blockData) => total + timeToSeconds(blockData.breakTime || "00:00"), 0);
}

function syncRundownBreaks(rundown = state.rundowns[rundownKey()]) {
  if (!rundown) return;
  rundown.breaks = secondsToTime(rundownBreakSeconds(rundown));
}

function editRundownTime() {
  const rundown = state.rundowns[rundownKey()];
  normalizeRundownTiming(rundown);
  openModal("Horários do espelho", `
    <form id="rundownTimeForm" class="form-grid">
      ${renderField(field("start", "Início"), rundown.start)}
      ${renderField(field("end", "Término"), rundown.end)}
      ${renderField(field("breaks", "Tempo de breaks"), rundown.breaks)}
      ${renderField(field("presenter", "Apresentador(es)"), rundown.presenter || "")}
      ${renderField(field("textEditor", "Editor de texto"), rundown.textEditor || "")}
      ${renderField(field("city", "Cidade/Praça"), rundown.city || state.branch || "")}
      ${renderField(field("materialType", "Tipo de material"), rundown.materialType || "LINK VIVO")}
    </form>
  `, () => {
    const form = $("#rundownTimeForm");
    if (!form.reportValidity()) return false;
    const values = Object.fromEntries(new FormData(form).entries());
    rundown.start = normalizeDuration(values.start);
    rundown.end = normalizeDuration(values.end);
    rundown.duration = diffText(rundown.start, rundown.end);
    rundown.breaks = normalizeDuration(values.breaks);
    rundown.presenter = values.presenter || "";
    rundown.textEditor = values.textEditor || "";
    rundown.city = values.city || "";
    rundown.materialType = values.materialType || "";
    saveState();
    renderRundowns();
    return true;
  }, "Salvar");
}
function renderRundownBlock(blockData, blockIndex) {
  const blockBreak = displayDuration(blockData.breakTime || "00:00");
  return `
    <div class="block-title ${blockData.standby ? "standby" : ""}">
      <span>${blockData.title} (${sumTime(blockData.rows.map(row => row.total))})</span>
      <span><button class="button add-lauda" data-block="${blockIndex}">+ Lauda</button></span>
    </div>
    <table class="grid-table rundown-grid">
      <thead>
        <tr>
          <th class="row-handle"></th><th class="page-col">Pág.</th><th class="type-col">Tipo</th><th>Retranca</th>
          <th>Última alteração</th><th>Repórter</th><th>Editor</th><th class="time-col">Cab.</th><th class="time-col">VT</th><th class="time-col">Total</th><th class="tiny-col">✓</th><th class="tiny-col"></th><th class="tiny-col"></th>
        </tr>
      </thead>
      <tbody class="rundown-drop-zone" data-block="${blockIndex}">
        ${blockData.rows.map((row, index) => {
          const storyData = row.storyId ? getStory(row.storyId) : null;
          const stateClass = storyRowState(row, storyData);
          const title = storyData?.lockedByName ? `Em edição por ${storyData.lockedByName}` : "";
          return `
          <tr class="story-row ${stateClass} ${state.selected.rundownRow === row.id ? "selected" : ""}" data-id="${row.id}" data-block="${blockIndex}" draggable="true" title="${escapeAttr(title)}">
            <td class="row-handle">⋮⋮</td>
            <td class="inline-rundown-edit" data-row="${row.id}" data-field="page" title="Clique para editar">${String(row.page || index + 1).padStart(2, "0")}</td>
            <td class="inline-rundown-edit type-inline-cell" data-row="${row.id}" data-field="type" title="Clique para alterar o tipo"><span class="tag ${row.type}">${row.type}</span></td>
            <td class="inline-rundown-edit" data-row="${row.id}" data-field="title" title="Clique para editar">${escapeHtml(row.title)}</td>
            <td>${row.editor}</td>
            <td>${row.reporter}</td>
            <td>${row.editor}</td>
            <td>${row.head}</td>
            <td>${row.vt}</td>
            <td>${row.total}</td>
            <td class="tiny-col"><input class="story-ok-toggle" data-row="${row.id}" type="checkbox" ${row.ok ? "checked" : ""}></td>
            <td class="tiny-col"><button class="icon-button edit-story" data-story="${row.storyId || ""}" title="Editar"><i class="fa-solid fa-pen"></i></button></td>
            <td class="tiny-col"><button class="icon-button delete-rundown-row" data-row="${row.id}" title="Excluir"><i class="fa-regular fa-trash-can"></i></button></td>
          </tr>
        `;
        }).join("")}
      </tbody>
      <tfoot>
        <tr class="block-break-row">
          <td colspan="7"><strong>BREAK ${blockIndex + 1}</strong></td>
          <td colspan="3"><input class="block-break-input" data-block="${blockIndex}" value="${escapeAttr(blockBreak)}" title="Tempo do break deste bloco"></td>
          <td colspan="3">${blockData.standby ? "Stand By" : "Editável"}</td>
        </tr>
      </tfoot>
    </table>
  `;
}

function bindRundownDragAndDrop() {
  let dragged = null;
  $$("#view .story-row").forEach(row => {
    row.draggable = true;
    row.querySelector(".row-handle")?.setAttribute("title", "Arrastar para organizar");
    const handle = row.querySelector(".row-handle");
    if (handle) handle.innerHTML = `<i class="fa-solid fa-grip-vertical"></i><span class="row-move-buttons"><button class="row-move" data-row="${row.dataset.id}" data-dir="up" title="Subir" type="button"><i class="fa-solid fa-chevron-up"></i></button><button class="row-move" data-row="${row.dataset.id}" data-dir="down" title="Descer" type="button"><i class="fa-solid fa-chevron-down"></i></button></span>`;
    row.addEventListener("dragstart", event => {
      if (event.target.closest("button, input, select, textarea, a")) {
        event.preventDefault();
        return;
      }
      dragged = { rowId: row.dataset.id, blockIndex: Number(row.dataset.block) };
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", JSON.stringify(dragged));
      event.dataTransfer.setDragImage(row, 20, 14);
      row.classList.add("dragging");
    });
    row.addEventListener("dragend", () => {
      row.classList.remove("dragging");
      $$("#view .drag-over, #view .drop-zone-over").forEach(item => item.classList.remove("drag-over", "drop-zone-over"));
      dragged = null;
    });
    row.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      row.classList.add("drag-over");
    });
    row.addEventListener("dragleave", () => row.classList.remove("drag-over"));
    row.addEventListener("drop", event => {
      event.preventDefault();
      event.stopPropagation();
      row.classList.remove("drag-over");
      const payload = readDraggedRundownRow(event, dragged);
      if (!payload || payload.rowId === row.dataset.id) return;
      moveRundownRow(payload.rowId, payload.blockIndex, Number(row.dataset.block), row.dataset.id);
    });
  });

  $$("#view .row-move").forEach(button => {
    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      moveRundownRowStep(button.dataset.row, button.dataset.dir);
    });
  });

  $$("#view .rundown-drop-zone").forEach(zone => {
    zone.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      zone.classList.add("drop-zone-over");
    });
    zone.addEventListener("dragleave", event => {
      if (!zone.contains(event.relatedTarget)) zone.classList.remove("drop-zone-over");
    });
    zone.addEventListener("drop", event => {
      if (event.target.closest(".story-row")) return;
      event.preventDefault();
      zone.classList.remove("drop-zone-over");
      const payload = readDraggedRundownRow(event, dragged);
      if (!payload) return;
      moveRundownRow(payload.rowId, payload.blockIndex, Number(zone.dataset.block), null);
    });
  });
}

function readDraggedRundownRow(event, fallback) {
  try {
    const raw = event.dataTransfer.getData("text/plain");
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function moveRundownRow(rowId, sourceBlockIndex, targetBlockIndex, targetRowId = null) {
  const rundown = state.rundowns[rundownKey()];
  const sourceBlock = rundown?.blocks?.[sourceBlockIndex];
  const targetBlock = rundown?.blocks?.[targetBlockIndex];
  if (!sourceBlock || !targetBlock) return;
  const sourceIndex = sourceBlock.rows.findIndex(row => row.id === rowId);
  if (sourceIndex < 0) return;
  const [row] = sourceBlock.rows.splice(sourceIndex, 1);
  let targetIndex = targetRowId ? targetBlock.rows.findIndex(item => item.id === targetRowId) : targetBlock.rows.length;
  if (targetIndex < 0) targetIndex = targetBlock.rows.length;
  targetBlock.rows.splice(targetIndex, 0, row);
  state.selected.rundownRow = rowId;
  saveState();
  syncStateToServer().catch(() => {});
  renderRundowns();
  showToast("Ordem do espelho atualizada", "success");
}

function moveRundownRowStep(rowId, direction) {
  const rundown = state.rundowns[rundownKey()];
  const blockIndex = rundown?.blocks?.findIndex(blockData => blockData.rows.some(row => row.id === rowId));
  if (blockIndex < 0) return;
  const rows = rundown.blocks[blockIndex].rows;
  const index = rows.findIndex(row => row.id === rowId);
  if (index < 0) return;
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) return;
  const [row] = rows.splice(index, 1);
  rows.splice(targetIndex, 0, row);
  state.selected.rundownRow = rowId;
  saveState();
  syncStateToServer().catch(() => {});
  renderRundowns();
  showToast("Ordem do espelho atualizada", "success");
}

function storyRowState(row, storyData = null) {
  if (storyData?.lockedBy) return "editing";
  if (row.approved || storyData?.status === "Aprovada" || storyData?.status === "Finalizada") return "approved";
  if (row.ok) return "ok";
  return "pending";
}

function renderPrintableRundown(rundown) {
  let page = 0;
  let elapsed = 0;
  const rows = [];
  rundown.blocks.forEach((blockData, blockIndex) => {
    rows.push({ marker: true, title: blockData.title.toUpperCase(), page: blockIndex ? "" : "" });
    blockData.rows.forEach(row => {
      page += 1;
      elapsed += timeToSeconds(row.total);
      rows.push({
        page: String(page).padStart(2, "0"),
        notes: row.type === "STD" ? "NOTA" : row.type,
        title: row.title,
        loc: row.reporter || "",
        head: row.head || "00:00",
        vt: row.vt || "00:00",
        mat: row.mediaCode || "",
        modi: row.editor || "",
        apv: row.ok ? "OK" : "",
        time: secondsToTime(elapsed).slice(3),
        ok: row.ok ? "OK" : "",
        edit: initials(row.editor)
      });
    });
  });
  return `
    <section class="print-rundown">
      <header>
        <h1>${escapeHtml(rundown.program)}</h1>
        <strong>${formatDate(rundown.date)}</strong>
        <span>Duração: ${escapeHtml(rundown.duration || diffText(rundown.start, rundown.end))}</span>
      </header>
      <table>
        <thead>
          <tr><th>PAG</th><th>NOTAS</th><th>RETRANCA</th><th>LOC</th><th>CAB</th><th>VT</th><th>MAT</th><th>MODI</th><th>APV</th><th>TEMPO</th><th>OK</th><th>EDIT</th></tr>
        </thead>
        <tbody>
          ${rows.map(row => row.marker ? `
            <tr class="print-marker"><td></td><td></td><td>*** ${escapeHtml(row.title)} ***</td><td></td><td>0:00</td><td>0:00</td><td></td><td></td><td></td><td>${row.time || ""}</td><td></td><td></td></tr>
          ` : `
            <tr class="${storyRowState(row, row.storyId ? getStory(row.storyId) : null)}">
              <td>${row.page}</td>
              <td>${escapeHtml(row.notes)}</td>
              <td>${escapeHtml(row.title)}</td>
              <td>${escapeHtml(row.loc)}</td>
              <td>${escapeHtml(row.head)}</td>
              <td>${escapeHtml(row.vt)}</td>
              <td>${escapeHtml(row.mat)}</td>
              <td>${escapeHtml(row.modi)}</td>
              <td>${escapeHtml(row.apv)}</td>
              <td>${escapeHtml(row.time)}</td>
              <td>${escapeHtml(row.ok)}</td>
              <td>${escapeHtml(row.edit)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </section>
  `;
}
function renderPrintableRundown(rundown) {
  normalizeRundownTiming(rundown);
  const city = rundown.city || state.branch || "";
  const textEditor = rundown.textEditor || getRundownRows().find(row => row.editor)?.editor || "";
  const timing = rundownTiming(rundown);
  const mainRows = [];
  const gavetaRows = [];
  let index = 0;

  const toPrintRow = row => {
    index += 1;
    const storyData = row.storyId ? getStory(row.storyId) : null;
    const status = row.approved || storyData?.status === "Aprovada" || storyData?.status === "Finalizada"
      ? "OK / APROVADO"
      : row.ok
        ? "OK / PENDENTE"
        : "PENDENTE";
    return {
      qtd: String(index).padStart(2, "0"),
      type: row.type || "",
      title: row.title || "",
      city,
      time: row.total || secondsToTime(timeToSeconds(row.head) + timeToSeconds(row.vt) + timeToSeconds(row.off)),
      status
    };
  };

  (rundown.blocks || []).forEach((blockData, blockIndex) => {
    const isGaveta = blockData.standby || /stand|gaveta/i.test(blockData.title || "");
    const target = isGaveta ? gavetaRows : mainRows;
    if (!isGaveta && blockIndex > 0) {
      target.push({ marker: true, title: `${blockIndex + 1}º BLOCO` });
    }
    (blockData.rows || []).forEach(row => target.push(toPrintRow(row)));
  });

  const renderRows = rows => rows.map(row => row.marker ? `
    <tr class="rundown-block-row">
      <td></td><td></td><td>${escapeHtml(row.title)}</td><td></td><td></td><td></td>
    </tr>
  ` : `
    <tr>
      <td>${escapeHtml(row.qtd)}</td>
      <td>${escapeHtml(row.type)}</td>
      <td>${escapeHtml(row.title)}</td>
      <td>${escapeHtml(row.city)}</td>
      <td>${escapeHtml(row.time)}</td>
      <td>${escapeHtml(row.status)}</td>
    </tr>
  `).join("");

  const emptyRows = count => Array.from({ length: count }, () => `
    <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>
  `).join("");

  return `
    <section class="print-rundown">
      <div class="rundown-print-title">
        <img src="./logo.png" alt="Nexus">
        <div>
          <h1>ESPELHO DE TV</h1>
        <p>DEPARTAMENTO DE JORNALISMO E EDITORAÇÃO</p>
        </div>
      </div>

      <table class="rundown-print-meta">
        <tbody>
          <tr>
            <td><strong>NOME DO TELEJORNAL</strong><br>${escapeHtml(rundown.program || "")}</td>
            <td><strong>DATA</strong><br>${escapeHtml(formatDate(rundown.date))}</td>
            <td><strong>APRESENTADOR</strong><br>${escapeHtml(rundown.presenter || "")}</td>
          </tr>
          <tr>
            <td><strong>EDITOR DE TEXTO</strong><br>${escapeHtml(textEditor)}</td>
            <td><strong>CIDADE</strong><br>${escapeHtml(city)}</td>
            <td><strong>TIPO DE MATERIAL</strong><br>${escapeHtml(rundown.materialType || "LINK VIVO")}</td>
          </tr>
        </tbody>
      </table>

      <table class="rundown-print-table">
        <thead>
          <tr><th>QTD</th><th>TIPO</th><th>DESCRIÇÃO</th><th>MUNICÍPIO</th><th>TEMPO</th><th>STATUS</th></tr>
        </thead>
        <tbody>
          ${renderRows(mainRows)}
          ${mainRows.length < 18 ? emptyRows(18 - mainRows.length) : ""}
        </tbody>
      </table>

      <div class="rundown-print-section">GAVETA</div>
      <table class="rundown-print-table">
        <thead>
          <tr><th>QTD</th><th>TIPO</th><th>DESCRIÇÃO</th><th>MUNICÍPIO</th><th>TEMPO</th><th>STATUS</th></tr>
        </thead>
        <tbody>
          ${renderRows(gavetaRows)}
          ${gavetaRows.length < 3 ? emptyRows(3 - gavetaRows.length) : ""}
        </tbody>
      </table>

      <div class="rundown-print-total">
        <span>TEMPO TELEJORNAL: <strong>${escapeHtml(timing.duration)}</strong></span>
        <span>INÍCIO: <strong>${escapeHtml(rundown.start)}</strong></span>
        <span>TÉRMINO: <strong>${escapeHtml(rundown.end)}</strong></span>
        <span>BREAKS: <strong>${escapeHtml(timing.breaks)}</strong></span>
        <span>PRODUÇÃO: <strong>${escapeHtml(timing.production)}</strong></span>
        <span>SOBRA: <strong>${escapeHtml(timing.balance)}</strong></span>
      </div>
    </section>
  `;
}

function renderPrintableRundown(rundown) {
  normalizeRundownTiming(rundown);
  const city = rundown.city || state.branch || "";
  const textEditor = rundown.textEditor || getRundownRows().find(row => row.editor)?.editor || "";
  const timing = rundownTiming(rundown);
  const mainRows = [];
  const gavetaRows = [];
  let index = 0;

  const toPrintRow = row => {
    index += 1;
    const storyData = row.storyId ? getStory(row.storyId) : null;
    const status = row.approved || storyData?.status === "Aprovada" || storyData?.status === "Finalizada"
      ? "OK / APROVADO"
      : row.ok
        ? "OK / PENDENTE"
        : "PENDENTE";
    return {
      qtd: String(index).padStart(2, "0"),
      type: row.type || "",
      title: row.title || "",
      city,
      time: row.total || secondsToTime(timeToSeconds(row.head) + timeToSeconds(row.vt) + timeToSeconds(row.off)),
      status
    };
  };

  (rundown.blocks || []).forEach((blockData, blockIndex) => {
    const isGaveta = blockData.standby || /stand|gaveta/i.test(blockData.title || "");
    const target = isGaveta ? gavetaRows : mainRows;
    if (!isGaveta && blockIndex > 0) target.push({ marker: true, title: `${blockIndex + 1}&ordm; BLOCO` });
    (blockData.rows || []).forEach(row => target.push(toPrintRow(row)));
  });

  const renderRows = rows => rows.map(row => row.marker ? `
    <tr class="rundown-block-row">
      <td></td><td></td><td>${row.title}</td><td></td><td></td><td></td>
    </tr>
  ` : `
    <tr>
      <td>${escapeHtml(row.qtd)}</td>
      <td>${escapeHtml(row.type)}</td>
      <td>${escapeHtml(row.title)}</td>
      <td>${escapeHtml(row.city)}</td>
      <td>${escapeHtml(row.time)}</td>
      <td>${escapeHtml(row.status)}</td>
    </tr>
  `).join("");

  const emptyRows = count => Array.from({ length: count }, () => `
    <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td></tr>
  `).join("");

  return `
    <section class="print-rundown">
      <div class="rundown-print-title">
        <img src="./logo.png" alt="Nexus">
        <div>
          <h1>ESPELHO DE TV</h1>
          <p>DEPARTAMENTO DE JORNALISMO E EDITORA&Ccedil;&Atilde;O</p>
        </div>
      </div>

      <table class="rundown-print-meta">
        <tbody>
          <tr>
            <td><strong>NOME DO TELEJORNAL</strong><br>${escapeHtml(rundown.program || "")}</td>
            <td><strong>DATA</strong><br>${escapeHtml(formatDate(rundown.date))}</td>
            <td><strong>APRESENTADOR</strong><br>${escapeHtml(rundown.presenter || "")}</td>
          </tr>
          <tr>
            <td><strong>EDITOR DE TEXTO</strong><br>${escapeHtml(textEditor)}</td>
            <td><strong>CIDADE</strong><br>${escapeHtml(city)}</td>
            <td><strong>TIPO DE MATERIAL</strong><br>${escapeHtml(rundown.materialType || "LINK VIVO")}</td>
          </tr>
        </tbody>
      </table>

      <table class="rundown-print-table">
        <thead>
          <tr><th>QTD</th><th>TIPO</th><th>DESCRI&Ccedil;&Atilde;O</th><th>MUNIC&Iacute;PIO</th><th>TEMPO</th><th>STATUS</th></tr>
        </thead>
        <tbody>
          ${renderRows(mainRows)}
          ${mainRows.length < 18 ? emptyRows(18 - mainRows.length) : ""}
        </tbody>
      </table>

      <div class="rundown-print-section">GAVETA</div>
      <table class="rundown-print-table">
        <thead>
          <tr><th>QTD</th><th>TIPO</th><th>DESCRI&Ccedil;&Atilde;O</th><th>MUNIC&Iacute;PIO</th><th>TEMPO</th><th>STATUS</th></tr>
        </thead>
        <tbody>
          ${renderRows(gavetaRows)}
          ${gavetaRows.length < 3 ? emptyRows(3 - gavetaRows.length) : ""}
        </tbody>
      </table>

      <div class="rundown-print-total">
        <span>TEMPO TELEJORNAL: <strong>${escapeHtml(timing.duration)}</strong></span>
        <span>IN&Iacute;CIO: <strong>${escapeHtml(rundown.start)}</strong></span>
        <span>T&Eacute;RMINO: <strong>${escapeHtml(rundown.end)}</strong></span>
        <span>BREAKS: <strong>${escapeHtml(timing.breaks)}</strong></span>
        <span>PRODU&Ccedil;&Atilde;O: <strong>${escapeHtml(timing.production)}</strong></span>
        <span>SOBRA: <strong>${escapeHtml(timing.balance)}</strong></span>
      </div>
    </section>
  `;
}

function selectRundownRow(rowId, shouldRender = true) {
  const row = getRundownRows().find(item => item.id === rowId);
  state.selected.rundownRow = rowId;
  if (row?.storyId) state.currentStoryId = row.storyId;
  saveState();
  if (shouldRender) renderRundowns();
}

function openRundownRowForEdit(rowId) {
  const row = getRundownRows().find(item => item.id === rowId);
  if (!row) return;
  if (!row.storyId) {
    const storyData = rec("story", {
      number: row.page || getRundownRows().findIndex(item => item.id === row.id) + 1,
      type: row.type,
      title: row.title,
      reporter: row.reporter,
      editor: row.editor,
      program: state.program,
      date: state.date,
      head: row.reporter,
      headTime: row.head,
      vtTime: row.vt,
      total: row.total,
      body: `[${(row.reporter || "REDAÇÃO").toUpperCase()}]\n\nDigite a cabeça aqui.`,
      info: `GC: ${row.title}`,
      medias: [],
      status: "Rascunho"
    });
    state.stories.unshift(storyData);
    row.storyId = storyData.id;
    saveState();
  }
  openStoryTab(row.storyId);
}

function startInlineRundownEdit(cell) {
  if (cell.querySelector("input, select")) return;
  const row = getRundownRows().find(item => item.id === cell.dataset.row);
  if (!row) return;
  const fieldName = cell.dataset.field;
  if (fieldName === "type") {
    cell.innerHTML = `
      <select class="inline-cell-input inline-cell-select">
        ${storyTypes().map(type => `<option value="${escapeAttr(type)}" ${type === row.type ? "selected" : ""}>${escapeHtml(type)}</option>`).join("")}
      </select>
    `;
    const select = cell.querySelector("select");
    select.focus();
    let committed = false;
    const commitType = () => {
      if (committed) return;
      committed = true;
      row.type = select.value;
      const storyData = row.storyId ? getStory(row.storyId) : null;
      if (storyData) storyData.type = row.type;
      saveState();
      renderRundowns();
      showToast("Tipo da lauda atualizado", "success");
    };
    select.addEventListener("change", commitType);
    select.addEventListener("blur", commitType, { once: true });
    select.addEventListener("keydown", event => {
      if (event.key === "Escape") renderRundowns();
      if (event.key === "Enter") commitType();
    });
    return;
  }
  const oldValue = fieldName === "page" ? String(row.page || cell.textContent.trim()) : String(row.title || "");
  cell.innerHTML = `<input class="inline-cell-input" value="${escapeAttr(oldValue)}">`;
  const input = cell.querySelector("input");
  input.focus();
  input.select();
  const commit = () => {
    const value = input.value.trim();
    if (!value) {
      renderRundowns();
      return;
    }
    const storyData = row.storyId ? getStory(row.storyId) : null;
    if (fieldName === "page") {
      row.page = value.padStart(2, "0");
      if (storyData) storyData.number = Number(value) || value;
    } else {
      row.title = value.toUpperCase();
      if (storyData) {
        storyData.title = row.title;
        storyData.info ||= `GC: ${row.title}`;
      }
    }
    saveState();
    renderRundowns();
    showToast("Lauda atualizada", "success");
  };
  input.addEventListener("keydown", event => {
    if (event.key === "Enter") commit();
    if (event.key === "Escape") renderRundowns();
  });
  input.addEventListener("blur", commit, { once: true });
}

function openRundownRowMenu(rowId) {
  const row = getRundownRows().find(item => item.id === rowId);
  if (!row) return;
  const rundown = state.rundowns[rundownKey()];
  const blockOptions = (rundown.blocks || []).map((blockData, index) => `<option value="${index}">${escapeHtml(blockData.title || `Bloco ${index + 1}`)}</option>`).join("");
  openModal("Opcoes da lauda", `
    <div class="context-actions">
      <p><strong>${escapeHtml(row.title)}</strong></p>
      <button class="button primary" id="ctxEditStory">Editar lauda</button>
      <button class="button" id="ctxDuplicateStory">Copiar lauda neste espelho</button>
      <button class="button" id="ctxCopyStory">Copiar para outro espelho</button>
      <label class="form-field"><span>Mover para</span><select id="ctxMoveTarget">${blockOptions}</select></label>
      <button class="button" id="ctxMoveStory">Mover</button>
      <button class="button" id="ctxSendStandby">Enviar para Stand By</button>
      <button class="button danger" id="ctxDeleteStory">Excluir do espelho</button>
    </div>
  `, () => true, "Fechar");
  $("#ctxEditStory")?.addEventListener("click", () => { closeModal(); openRundownRowForEdit(rowId); });
  $("#ctxDuplicateStory")?.addEventListener("click", () => { duplicateRundownRow(rowId); closeModal(); });
  $("#ctxCopyStory")?.addEventListener("click", () => { closeModal(); openCopyRundownModal(rowId); });
  $("#ctxMoveStory")?.addEventListener("click", () => {
    const target = Number($("#ctxMoveTarget").value);
    closeModal();
    moveRundownRowToBlock(rowId, target);
  });
  $("#ctxSendStandby")?.addEventListener("click", () => {
    closeModal();
    sendRundownRowToStandby(rowId);
  });
  $("#ctxDeleteStory")?.addEventListener("click", () => { closeModal(); deleteRundownRow(rowId); });
  return;
  const targets = Object.values(state.rundowns || {}).filter(rundown => `${rundown.date}|${rundown.program}` !== rundownKey());
  if (!targets.length) {
    showToast("Nao existe outro espelho para copiar esta lauda", "warning");
    return;
  }
  openModal("Opções da lauda", `
    <div class="form-grid">
      <p><strong>${escapeHtml(row.title)}</strong></p>
      <label class="form-field"><span>Copiar para</span>
        <select id="copyRundownTarget">
          ${targets.map(rundown => `<option value="${escapeAttr(`${rundown.date}|${rundown.program}`)}">${escapeHtml(formatDate(rundown.date))} - ${escapeHtml(rundown.program)}</option>`).join("")}
        </select>
      </label>
    </div>
  `, () => {
    copyRundownRowToTarget(rowId, $("#copyRundownTarget").value);
    return true;
  }, "Copiar");
}

function openCopyRundownModal(rowId) {
  const row = getRundownRows().find(item => item.id === rowId);
  if (!row) return;
  const targets = Object.values(state.rundowns || {}).filter(rundown => `${rundown.date}|${rundown.program}` !== rundownKey());
  if (!targets.length) {
    showToast("Nao existe outro espelho para copiar esta lauda", "warning");
    return;
  }
  openModal("Copiar para outro espelho", `
    <div class="form-grid">
      <p><strong>${escapeHtml(row.title)}</strong></p>
      <label class="form-field"><span>Copiar para</span>
        <select id="copyRundownTarget">
          ${targets.map(rundown => `<option value="${escapeAttr(`${rundown.date}|${rundown.program}`)}">${escapeHtml(formatDate(rundown.date))} - ${escapeHtml(rundown.program)}</option>`).join("")}
        </select>
      </label>
    </div>
  `, () => {
    copyRundownRowToTarget(rowId, $("#copyRundownTarget").value);
    return true;
  }, "Copiar");
}

function findRundownRowLocation(rowId, rundown = state.rundowns[rundownKey()]) {
  if (!rundown) return null;
  for (let blockIndex = 0; blockIndex < (rundown.blocks || []).length; blockIndex += 1) {
    const rowIndex = rundown.blocks[blockIndex].rows.findIndex(row => row.id === rowId);
    if (rowIndex >= 0) return { rundown, blockIndex, rowIndex, row: rundown.blocks[blockIndex].rows[rowIndex] };
  }
  return null;
}

function duplicateRundownRow(rowId) {
  const location = findRundownRowLocation(rowId);
  if (!location) return;
  let copiedStoryId = null;
  if (location.row.storyId) {
    const sourceStory = getStory(location.row.storyId);
    if (sourceStory) {
      const copy = rec("story", { ...JSON.parse(JSON.stringify(sourceStory)), id: undefined, number: getRundownRows().length + 1 });
      state.stories.unshift(copy);
      copiedStoryId = copy.id;
    }
  }
  location.rundown.blocks[location.blockIndex].rows.splice(location.rowIndex + 1, 0, {
    ...JSON.parse(JSON.stringify(location.row)),
    id: rec("rundown-row", {}).id,
    storyId: copiedStoryId
  });
  saveState();
  renderRundowns();
  showToast("Lauda copiada no espelho", "success");
}

function moveRundownRowToBlock(rowId, targetBlockIndex) {
  const location = findRundownRowLocation(rowId);
  if (!location || !location.rundown.blocks[targetBlockIndex]) return;
  moveRundownRow(rowId, location.blockIndex, targetBlockIndex, null);
}

function sendRundownRowToStandby(rowId) {
  const rundown = state.rundowns[rundownKey()];
  const standby = ensureStandbyBlock(rundown);
  const targetIndex = rundown.blocks.findIndex(blockData => blockData.id === standby.id);
  moveRundownRowToBlock(rowId, targetIndex);
}

function copyRundownRowToTarget(rowId, targetKey) {
  const sourceRow = getRundownRows().find(item => item.id === rowId);
  const target = state.rundowns[targetKey];
  if (!sourceRow || !target) return;
  let copiedStoryId = null;
  if (sourceRow.storyId) {
    const sourceStory = getStory(sourceRow.storyId);
    if (sourceStory) {
      const copy = rec("story", {
        ...JSON.parse(JSON.stringify(sourceStory)),
        id: undefined,
        title: sourceStory.title,
        program: target.program,
        date: target.date
      });
      state.stories.unshift(copy);
      copiedStoryId = copy.id;
    }
  }
  target.blocks ||= [block("Bloco 1", [])];
  target.blocks[0].rows.push({
    ...JSON.parse(JSON.stringify(sourceRow)),
    id: rec("rundown-row", {}).id,
    storyId: copiedStoryId,
    page: undefined
  });
  saveState();
  showToast("Lauda copiada para outro espelho", "success");
}
function addRundownBlock() {
  const rundown = state.rundowns[rundownKey()];
  const regularCount = (rundown.blocks || []).filter(item => !item.standby).length + 1;
  const newBlock = { ...block(`Bloco ${regularCount}`, []), breakTime: "00:00" };
  const standbyIndex = (rundown.blocks || []).findIndex(item => item.standby || /stand\s*by/i.test(item.title || ""));
  if (standbyIndex >= 0) rundown.blocks.splice(standbyIndex, 0, newBlock);
  else rundown.blocks.push(newBlock);
  saveState();
  renderRundowns();
}

function addStandbyBlock() {
  const rundown = state.rundowns[rundownKey()];
  const existing = (rundown.blocks || []).find(item => item.standby || /stand\s*by/i.test(item.title || ""));
  if (existing) {
    showToast("Stand By ja existe neste espelho", "info");
    return;
  }
  rundown.blocks.push({ ...block("Stand By", [], true), breakTime: "00:00" });
  saveState();
  renderRundowns();
}

function ensureStandbyBlock(rundown = state.rundowns[rundownKey()]) {
  if (!rundown) return null;
  let standby = (rundown.blocks || []).find(item => item.standby || /stand\s*by/i.test(item.title || ""));
  if (!standby) {
    standby = { ...block("Stand By", [], true), breakTime: "00:00" };
    rundown.blocks.push(standby);
  }
  return standby;
}

function updateBlockBreak(blockIndex, value) {
  const rundown = state.rundowns[rundownKey()];
  const blockData = rundown?.blocks?.[blockIndex];
  if (!blockData) return;
  blockData.breakTime = displayDuration(value || "00:00");
  syncRundownBreaks(rundown);
  saveState();
  renderRundowns();
  showToast("Tempo de break atualizado", "success");
}

function addRundownRow(blockIndex) {
  const rundown = state.rundowns[rundownKey()];
  if (!rundown?.blocks?.[blockIndex]) blockIndex = 0;
  openModal("Nova lauda", `
    <form id="quickStoryForm" class="form-grid">
      ${renderField(field("type", "Tipo", "select", true, storyTypes()), "STD")}
      ${renderField(field("title", "Retranca", "text", true), "")}
      ${renderField(field("reporter", "Repórter", "select", true, people()), people()[0])}
      ${renderField(field("head", "Cabeça"), "00:00")}
      ${renderField(field("vt", "VT"), "00:00")}
      ${renderField(field("off", "Off"), "00:00")}
    </form>
  `, () => {
    const form = $("#quickStoryForm");
    if (!form.reportValidity()) return false;
    const values = Object.fromEntries(new FormData(form).entries());
    const total = displayDuration(secondsToTime(timeToSeconds(values.head) + timeToSeconds(values.vt) + timeToSeconds(values.off)));
    const storyData = rec("story", { ...values, total, number: getRundownRows().length + 1, date: state.date, program: state.program, editor: people()[0], head: values.reporter, headTime: values.head, vtTime: values.vt, offTime: values.off, body: `[${values.reporter.toUpperCase()}]\n\nDigite a cabeça aqui.`, info: `GC: ${values.title}`, medias: [], status: "Rascunho" });
    state.stories.unshift(storyData);
    state.rundowns[rundownKey()].blocks[blockIndex].rows.push(rundownRow(values.type, values.title, values.reporter, values.head, values.vt, total, "green", storyData.id));
    state.currentStoryId = storyData.id;
    saveState();
    setTimeout(() => openStoryTab(storyData.id), 0);
    return true;
  }, "Criar");
}
function deleteRundownRow(rowId) {
  openModal("Excluir lauda", "Deseja remover a lauda deste espelho?", () => {
    const rundown = state.rundowns[rundownKey()];
    rundown.blocks.forEach(blockData => blockData.rows = blockData.rows.filter(row => row.id !== rowId));
    saveState();
    renderRundowns();
    return true;
  });
}
function renumberRundown() {
  getRundownRows().forEach((row, index) => {
    const storyData = row.storyId ? getStory(row.storyId) : null;
    if (storyData) storyData.number = index + 1;
  });
  saveState();
  renderRundowns();
}
function approveCurrentStory() {
  const storyData = getStory(state.currentStoryId);
  if (storyData) storyData.status = "Aprovada";
  const row = getRundownRows().find(item => item.storyId === state.currentStoryId);
  if (row) {
    row.ok = true;
    row.approved = true;
  }
  saveState();
  renderRundowns();
}

function toggleStoryOk(rowId, checked) {
  const row = getRundownRows().find(item => item.id === rowId);
  if (!row) return;
  row.ok = checked;
  if (!checked) row.approved = false;
  const storyData = row.storyId ? getStory(row.storyId) : null;
  if (storyData && !checked && storyData.status === "Aprovada") storyData.status = "Rascunho";
  saveState();
  renderRundowns();
}
function getRundownRows() {
  return (state.rundowns[rundownKey()]?.blocks || []).flatMap(blockData => blockData.rows);
}

function renderStoryPreview() {
  const storyData = getStory(state.currentStoryId);
  if (!storyData) return "";
  return `
    <aside class="side-preview">
      <div class="toolbar">
        <h2>${String(storyData.number || "").padStart(2, "0")}. ${storyData.type} ${storyData.title}</h2>
        <span class="spacer"></span>
        <button id="copyStory" class="icon-button" title="Copiar texto"><i class="fa-regular fa-copy"></i></button>
        <button id="printStoryPreview" class="button">Imprimir</button>
        <button id="openStory" class="button">Editar</button>
        <button id="closePreview" class="button primary">Fechar</button>
      </div>
      <p><strong>Data:</strong> ${formatDate(storyData.date)} <span class="right"><strong>Programa:</strong> ${storyData.program}</span></p>
      <p><strong>Repórter:</strong> ${storyData.reporter} <span class="right"><strong>Total:</strong> ${storyData.total}</span></p>
      <div class="preview-section"><h3>[CABEÇA] <span class="right">${storyData.headTime}</span></h3><strong>[${storyData.head}]</strong><p>${storyMarkup(storyData.body)}</p></div>
      <div class="preview-section">${(storyData.medias || []).map(media => `<p>▻ ${media}</p>`).join("")}</div>
      <div class="preview-section"><h3>[RODA VT] <span class="right">${storyData.vtTime}</span></h3></div>
      <div class="preview-section"><h3>Informações</h3><p>${storyMarkup(storyData.info)}</p></div>
    </aside>
  `;
}

function closePreview() {
  state.currentStoryId = null;
  saveState();
  renderRundowns();
}

function copyStoryText() {
  const storyData = getStory(state.currentStoryId);
  if (!storyData) return;
  const text = [
    `${String(storyData.number || "").padStart(2, "0")}. ${storyData.type} ${storyData.title}`,
    `Data: ${formatDate(storyData.date)} | Programa: ${storyData.program}`,
    `Reporter: ${storyData.reporter} | Total: ${storyData.total}`,
    "",
    "[CABECA]",
    storyData.body || "",
    "",
    "[RODA VT]",
    storyData.vtText || "",
    "",
    "[INFORMACOES]",
    storyData.info || "",
    "",
    "[NOTA PE]",
    storyData.foot || ""
  ].join("\n");
  const task = navigator.clipboard?.writeText(text);
  if (!task) {
    showToast("Copia indisponivel neste navegador", "warning");
    return;
  }
  task.then(
    () => showToast("Lauda copiada", "success"),
    () => showToast("Nao foi possivel copiar", "warning")
  );
}

function recoveryDrafts() {
  try {
    const drafts = JSON.parse(localStorage.getItem(RECOVERY_KEY) || "[]");
    return Array.isArray(drafts) ? drafts : [];
  } catch {
    return [];
  }
}

function writeRecoveryDrafts(drafts) {
  const cleaned = (drafts || []).filter(Boolean);
  if (!cleaned.length) localStorage.removeItem(RECOVERY_KEY);
  else localStorage.setItem(RECOVERY_KEY, JSON.stringify(cleaned));
}

function saveStoryRecoveryDraft(storyData) {
  if (!storyData || state.readOnlyStories?.[storyData.id]) return;
  const data = collectStoryFromEditor(storyData);
  const drafts = recoveryDrafts().filter(item => item.storyId !== storyData.id);
  drafts.unshift({
    id: `draft-${storyData.id || Date.now()}`,
    storyId: storyData.id,
    title: data.title || "Lauda sem retranca",
    type: data.type || "STD",
    program: data.program || state.program,
    date: data.date || state.date,
    updatedAt: new Date().toISOString(),
    data
  });
  writeRecoveryDrafts(drafts.slice(0, 20));
}

function clearStoryRecoveryDraft(storyId) {
  if (!storyId) return;
  writeRecoveryDrafts(recoveryDrafts().filter(item => item.storyId !== storyId));
}

function recoveryMenuHtml() {
  const count = recoveryDrafts().length;
  return `
    <div class="recovery-menu">
      <button id="recoveryAlert" class="button recovery-alert ${count ? "active" : ""}" title="Recuperação de dados">
        <i class="fa-solid fa-triangle-exclamation"></i>${count ? `<span>${count}</span>` : ""}
      </button>
      <button id="rundownMore" class="button">Mais... <i class="fa-solid fa-chevron-down"></i></button>
      <div id="rundownMoreMenu" class="more-menu" hidden>
        <button data-action="recovery">Dados auxiliares <i class="fa-solid fa-chevron-right"></i></button>
        <button data-action="templates">Modelos de Espelho</button>
        <button data-action="settings">Configurações</button>
        <button data-action="shortcuts">Atalhos do Espelho</button>
      </div>
    </div>
  `;
}

function bindRecoveryControls() {
  $("#recoveryAlert")?.addEventListener("click", showRecoveryDialog);
  $("#rundownMore")?.addEventListener("click", (event) => {
    event.stopPropagation();
    const menu = $("#rundownMoreMenu");
    if (menu) menu.hidden = !menu.hidden;
  });
  $$("#rundownMoreMenu [data-action]").forEach(button => button.addEventListener("click", () => {
    const action = button.dataset.action;
    $("#rundownMoreMenu").hidden = true;
    if (action === "recovery") showRecoveryDialog();
    if (action === "settings") setActive("settings");
    if (action === "shortcuts") setActive("shortcuts");
    if (action === "templates") showToast("Modelos de espelho serão cadastrados em breve", "info");
  }));
  document.addEventListener("click", closeOpenMoreMenus, { once: true });
}

function closeOpenMoreMenus() {
  $$(".more-menu").forEach(menu => menu.hidden = true);
}

function scheduleRecoveryPrompt() {
  if (sessionStorage.getItem("nexus-recovery-prompted")) return;
  if (!recoveryDrafts().length) return;
  sessionStorage.setItem("nexus-recovery-prompted", "1");
  setTimeout(showRecoveryDialog, 250);
}

function showRecoveryDialog() {
  const drafts = recoveryDrafts();
  if (!drafts.length) {
    showToast("Nenhum dado auxiliar encontrado", "info");
    return;
  }
  openModal("Recuperação de Dados", `
    <div class="recovery-dialog">
      <p>Um ou mais documentos não salvos foram encontrados no seu computador.</p>
      <p>Após abrir, verifique se os dados devem ser salvos ou descartados.</p>
      <div class="recovery-list">
        ${drafts.map(draft => `
          <div class="recovery-row">
            <div>
              <strong>${escapeHtml(draft.title || "Lauda sem retranca")} (${escapeHtml(draft.type || "")})</strong>
              <span>${draftAgeText(draft.updatedAt)} · ${escapeHtml(formatDate(draft.date || ""))} ${escapeHtml(draft.program || "")}</span>
            </div>
            <button class="link-button recovery-edit" data-id="${escapeAttr(draft.id)}">Editar</button>
            <button class="link-button recovery-discard" data-id="${escapeAttr(draft.id)}">Descartar</button>
          </div>
        `).join("")}
      </div>
    </div>
  `, () => {
    writeRecoveryDrafts([]);
    render();
    return true;
  }, "Descartar Tudo");
  $("#modalCancel").textContent = "Fechar";
  $$(".recovery-edit").forEach(button => button.addEventListener("click", () => restoreRecoveryDraft(button.dataset.id)));
  $$(".recovery-discard").forEach(button => button.addEventListener("click", () => discardRecoveryDraft(button.dataset.id)));
}

function restoreRecoveryDraft(id) {
  const draft = recoveryDrafts().find(item => item.id === id);
  if (!draft?.data) return;
  let storyData = draft.storyId ? getStory(draft.storyId) : null;
  if (!storyData) {
    storyData = rec("story", { ...draft.data, id: draft.storyId || undefined });
    state.stories.unshift(storyData);
  } else {
    Object.assign(storyData, draft.data);
  }
  closeModal();
  clearStoryRecoveryDraft(storyData.id);
  saveState();
  openStoryTab(storyData.id);
  showToast("Rascunho recuperado", "success");
}

function discardRecoveryDraft(id) {
  writeRecoveryDrafts(recoveryDrafts().filter(item => item.id !== id));
  closeModal();
  showRecoveryDialog();
}

function draftAgeText(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recente";
  const diff = Math.max(0, Date.now() - date.getTime());
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return `há ${days} dia${days > 1 ? "s" : ""}`;
}

function openStoryTab(storyId) {
  if (!storyId) {
    const row = getRundownRows().find(item => item.id === state.selected.rundownRow);
    if (!row) return;
    const storyData = rec("story", { number: state.stories.length + 1, type: row.type, title: row.title, reporter: row.reporter, editor: row.editor, program: state.program, date: state.date, head: row.reporter, headTime: row.head, vtTime: row.vt, total: row.total, body: `[${row.reporter.toUpperCase()}]\n\nDigite aqui.`, info: `GC: ${row.title}`, medias: [], status: "Rascunho" });
    state.stories.unshift(storyData);
    row.storyId = storyData.id;
    storyId = storyData.id;
  }
  const storyData = getStory(storyId);
  const user = currentUser();
  if (storyData?.lockedBy && storyData.lockedBy !== user?.email) {
    openModal("Lauda em edição", `Esta lauda está em edição por <strong>${escapeHtml(storyData.lockedByName || storyData.lockedBy)}</strong>.<br><br>Caso queira continuar, os dados não serão salvos.`, () => {
      openStoryTabForEdit(storyId, true);
      return true;
    }, "Sim");
    $("#modalCancel").textContent = "Não";
    return;
  }
  if (storyData) {
    storyData.lockedBy = user?.email || "usuario";
    storyData.lockedByName = user?.name || "Usuario";
  }
  openStoryTabForEdit(storyId, false);
}

function openStoryTabForEdit(storyId, readOnly = false) {
  state.currentStoryId = storyId;
  state.readOnlyStories ||= {};
  if (readOnly) state.readOnlyStories[storyId] = true;
  else delete state.readOnlyStories[storyId];
  const tabId = `story:${storyId}`;
  if (!state.tabs.includes(tabId)) state.tabs.push(tabId);
  state.active = tabId;
  saveState();
  render();
}
function renderStoryEditor(storyId) {
  const storyData = getStory(storyId);
  if (!storyData) {
    $("#view").innerHTML = `<div class="empty">Lauda não encontrada</div>`;
    return;
  }
  const readOnly = Boolean(state.readOnlyStories?.[storyId]);
  const disabled = readOnly ? "disabled" : "";
  $("#view").innerHTML = `
    ${readOnly ? `<div class="notice-item warning"><strong>Lauda em modo somente leitura</strong><span>Esta lauda esta em edicao por ${escapeHtml(storyData.lockedByName || storyData.lockedBy || "outro usuario")}. Os dados nao serao salvos.</span></div>` : ""}
    <div class="script-head">
      <select id="storyType" ${disabled}>${storyTypes().map(type => `<option ${type === storyData.type ? "selected" : ""}>${type}</option>`).join("")}</select>
      <input id="storyTitle" value="${escapeAttr(storyData.title)}" ${disabled}>
      <select id="storyEditor" ${disabled}>${people().map(person => `<option ${person === storyData.editor ? "selected" : ""}>${person}</option>`).join("")}</select>
      <select id="storyReporter" ${disabled}>${people().map(person => `<option ${person === storyData.reporter ? "selected" : ""}>${person}</option>`).join("")}</select>
      <button id="printStory" class="button">Imprimir</button>
      <button id="backRundown" class="button">Fechar</button>
      <button id="saveStory" class="button primary" ${readOnly ? "disabled" : ""}>Salvar</button>
    </div>
    <div class="story-meta-grid">
      <label class="form-field"><span>Cabeça/Locutor</span><input id="storyHead" value="${escapeAttr(storyData.head || storyData.reporter || "")}" ${disabled}></label>
      <label class="form-field"><span>Tempo cabeça</span><input id="storyHeadTime" value="${escapeAttr(storyData.headTime || "00:00")}" ${disabled}></label>
      <label class="form-field"><span>Tempo VT/Sonora</span><input id="storyVtTime" value="${escapeAttr(storyData.vtTime || "00:00")}" ${disabled}></label>
      <label class="form-field"><span>Off</span><input id="storyOffTime" value="${escapeAttr(storyData.offTime || "00:00")}" ${disabled}></label>
      <label class="form-field"><span>Total</span><input id="storyTotal" value="${escapeAttr(storyData.total || "00:00")}" readonly></label>
      <label class="form-field"><span>Status</span><select id="storyStatus" ${disabled}>${["Rascunho", "Aprovada", "Finalizada"].map(status => `<option ${status === storyData.status ? "selected" : ""}>${status}</option>`).join("")}</select></label>
    </div>
    <div class="metrics">
      ${metric("Previsto", calculatedStoryTotal(storyData), "", "metricPreview")}
      ${metric("Cabeça", storyData.headTime || "00:00", "", "metricHead")}
      ${metric("VT", storyData.vtTime || "00:00", "", "metricVt")}
      ${metric("Off", storyData.offTime || "00:00", "", "metricOff")}
      ${metric("Total", calculatedStoryTotal(storyData), "", "metricTotal")}
    </div>
    <div class="split">
      <section class="pane">
        <div class="media-list">
          ${(storyData.medias || []).map(media => {
            const mediaData = mediaByTitle(media);
            return `<div class="media-item"><span><i class="fa-solid fa-video"></i></span><strong>${escapeHtml(media)}</strong><span>${escapeHtml(mediaData?.duration || "00:00")} · ${escapeHtml(mediaData?.status || "Pronto")}</span></div>`;
          }).join("")}
          <button id="attachMedia" class="button">Adicionar Vídeo</button>
        </div>
        <h3>[INFORMAÇÕES]</h3>
        <textarea id="storyInfo" class="script-body" ${disabled}>${escapeHtml(storyData.info || "")}</textarea>
      </section>
      <section class="pane segments">
        <div class="segment"><h4>[CABEÇA]</h4><textarea id="storyBody" ${disabled}>${escapeHtml(storyData.body || "")}</textarea></div>
        <div class="segment"><h4>[RODA VT ${storyData.vtTime}]</h4><textarea id="storyVt" placeholder="[DEIXA] Digite aqui..." ${disabled}>${escapeHtml(storyData.vtText || "")}</textarea></div>
        <div class="segment"><h4>Nota pé</h4><textarea id="storyFoot" placeholder="Adicionar nota pé" ${disabled}>${escapeHtml(storyData.foot || "")}</textarea></div>
      </section>
    </div>
  `;
  $("#saveStory")?.addEventListener("click", () => saveStory(storyData));
  $("#backRundown").addEventListener("click", () => closeStoryEditor(storyData));
  $("#attachMedia")?.addEventListener("click", () => attachMedia(storyData));
  $("#printStory")?.addEventListener("click", () => printStory(collectStoryFromEditor(storyData)));
  if (!readOnly) {
    bindStoryTimeCalculator();
    bindStoryRecoveryDraft(storyData);
  }
  updateStoryTimeTotals();
}

function collectStoryFromEditor(storyData) {
  updateStoryTimeTotals();
  if (!$("#storyTitle")) return storyData;
  return {
    ...storyData,
    type: $("#storyType")?.value || storyData.type,
    title: $("#storyTitle")?.value?.trim() || storyData.title,
    editor: $("#storyEditor")?.value || storyData.editor,
    reporter: $("#storyReporter")?.value || storyData.reporter,
    head: $("#storyHead")?.value?.trim() || storyData.head,
    headTime: $("#storyHeadTime")?.value?.trim() || storyData.headTime || "00:00",
    vtTime: $("#storyVtTime")?.value?.trim() || storyData.vtTime || "00:00",
    offTime: $("#storyOffTime")?.value?.trim() || storyData.offTime || "00:00",
    total: $("#storyTotal")?.value?.trim() || storyData.total || "00:00",
    status: $("#storyStatus")?.value || storyData.status,
    info: $("#storyInfo")?.value || storyData.info || "",
    body: $("#storyBody")?.value || storyData.body || "",
    vtText: $("#storyVt")?.value || storyData.vtText || "",
    foot: $("#storyFoot")?.value || storyData.foot || "",
    medias: storyData.medias || []
  };
}

function printStory(storyData) {
  const isEscalada = /ESCALADA/i.test(`${storyData.type || ""} ${storyData.title || ""}`);
  const doc = `
    <section class="print-story-doc">
      <header class="print-story-header">
        <img src="./logo.png" alt="Nexus">
        <div>
          <h1>ESPELHO DO JORNAL</h1>
          <p>${isEscalada ? "ESCALADA" : "LAUDA"} - ${escapeHtml(storyData.program || state.program || "")}</p>
        </div>
      </header>

      <table class="print-story-meta">
        <tbody>
          <tr>
            <td><strong>RETRANCA</strong><br>${escapeHtml(storyData.title || "")}</td>
            <td><strong>TIPO</strong><br>${escapeHtml(storyData.type || "")}</td>
            <td><strong>DATA</strong><br>${escapeHtml(formatDate(storyData.date || state.date))}</td>
            <td><strong>PÁG.</strong><br>${String(storyData.number || "").padStart(2, "0")}</td>
          </tr>
          <tr>
            <td><strong>REPÓRTER</strong><br>${escapeHtml(storyData.reporter || "")}</td>
            <td><strong>EDITOR</strong><br>${escapeHtml(storyData.editor || "")}</td>
            <td><strong>CABEÇA</strong><br>${escapeHtml(storyData.headTime || "00:00")}</td>
            <td><strong>TOTAL</strong><br>${escapeHtml(storyData.total || calculatedStoryTotal(storyData))}</td>
          </tr>
        </tbody>
      </table>

      <div class="print-story-section">
        <h2>[INFORMAÇÕES]</h2>
        <p>${storyMarkup(storyData.info || " ")}</p>
      </div>

      <div class="print-story-section">
        <h2>[CABEÇA] <span>${escapeHtml(storyData.headTime || "00:00")}</span></h2>
        <strong>[${escapeHtml(storyData.head || storyData.reporter || "REDAÇÃO")}]</strong>
        <p>${storyMarkup(storyData.body || " ")}</p>
      </div>

      <div class="print-story-section">
        <h2>[RODA VT] <span>${escapeHtml(storyData.vtTime || "00:00")}</span></h2>
        ${(storyData.medias || []).map(media => `<p class="print-story-media"><strong>VT:</strong> ${escapeHtml(media)}</p>`).join("")}
        <p>${storyMarkup(storyData.vtText || " ")}</p>
      </div>

      <div class="print-story-section">
        <h2>[NOTA PÉ]</h2>
        <p>${storyMarkup(storyData.foot || " ")}</p>
      </div>
    </section>
  `;
  const previous = $("#printStoryHost");
  previous?.remove();
  const host = document.createElement("div");
  host.id = "printStoryHost";
  host.innerHTML = doc;
  document.body.appendChild(host);
  window.print();
  setTimeout(() => host.remove(), 500);
}

function saveStory(storyData) {
  updateStoryTimeTotals();
  Object.assign(storyData, {
    type: $("#storyType").value,
    title: $("#storyTitle").value.trim() || "Sem retranca",
    editor: $("#storyEditor").value,
    reporter: $("#storyReporter").value,
    head: $("#storyHead").value.trim(),
    headTime: $("#storyHeadTime").value.trim() || "00:00",
    vtTime: $("#storyVtTime").value.trim() || "00:00",
    offTime: $("#storyOffTime").value.trim() || "00:00",
    total: $("#storyTotal").value.trim() || "00:00",
    status: $("#storyStatus").value,
    info: $("#storyInfo").value,
    body: $("#storyBody").value,
    vtText: $("#storyVt").value,
    foot: $("#storyFoot").value,
    lockedBy: null,
    lockedByName: null,
    updatedAt: nowText()
  });
  getRundownRows().forEach(row => {
    if (row.storyId === storyData.id) Object.assign(row, { type: storyData.type, title: storyData.title, reporter: storyData.reporter, editor: storyData.editor, head: storyData.headTime, vt: storyData.vtTime, total: storyData.total, ok: storyData.status !== "Rascunho", approved: ["Aprovada", "Finalizada"].includes(storyData.status) });
  });
  delete state.readOnlyStories?.[storyData.id];
  clearStoryRecoveryDraft(storyData.id);
  saveState();
  setActive("rundowns");
}

function closeStoryEditor(storyData) {
  const readOnly = Boolean(state.readOnlyStories?.[storyData.id]);
  if (!readOnly) {
    storyData.lockedBy = null;
    storyData.lockedByName = null;
  }
  delete state.readOnlyStories?.[storyData.id];
  clearStoryRecoveryDraft(storyData.id);
  saveState();
  setActive("rundowns");
}

function bindStoryRecoveryDraft(storyData) {
  const fields = ["storyType", "storyTitle", "storyEditor", "storyReporter", "storyHead", "storyHeadTime", "storyVtTime", "storyOffTime", "storyStatus", "storyInfo", "storyBody", "storyVt", "storyFoot"];
  let timer = null;
  const queue = () => {
    clearTimeout(timer);
    timer = setTimeout(() => saveStoryRecoveryDraft(storyData), 250);
  };
  fields.forEach(id => {
    const node = $(`#${id}`);
    node?.addEventListener("input", queue);
    node?.addEventListener("change", queue);
  });
}

function bindStoryTimeCalculator() {
  ["storyHeadTime", "storyVtTime", "storyOffTime"].forEach(id => {
    $(`#${id}`)?.addEventListener("input", updateStoryTimeTotals);
    $(`#${id}`)?.addEventListener("blur", event => {
      event.target.value = displayDuration(event.target.value);
      updateStoryTimeTotals();
    });
  });
}

function updateStoryTimeTotals() {
  const head = displayDuration($("#storyHeadTime")?.value || "00:00");
  const vt = displayDuration($("#storyVtTime")?.value || "00:00");
  const off = displayDuration($("#storyOffTime")?.value || "00:00");
  const total = displayDuration(secondsToTime(timeToSeconds(head) + timeToSeconds(vt) + timeToSeconds(off)));
  if ($("#storyTotal")) $("#storyTotal").value = total;
  if ($("#metricPreview")) $("#metricPreview").textContent = total;
  if ($("#metricHead")) $("#metricHead").textContent = head;
  if ($("#metricVt")) $("#metricVt").textContent = vt;
  if ($("#metricOff")) $("#metricOff").textContent = off;
  if ($("#metricTotal")) $("#metricTotal").textContent = total;
}

function attachMedia(storyData) {
  const today = state.date || toIsoDate(new Date());
  openModal("Centro de Midias", `
    <div class="media-picker">
      <div class="filters compact">
        <label class="form-field"><span>Data inicial</span><input id="mediaPickStart" type="date" value="${escapeAttr(today)}"></label>
        <label class="form-field"><span>Data final</span><input id="mediaPickEnd" type="date" value="${escapeAttr(today)}"></label>
        <label class="form-field grow"><span>Nome</span><input id="mediaPickText" placeholder="Buscar por retranca ou arquivo"></label>
        <button id="mediaPickSearch" class="button primary" type="button">Buscar</button>
      </div>
      <div id="mediaPickRows" class="media-picker-list"></div>
    </div>
  `, () => {
    const selected = $("#mediaPickRows input[name='mediaPick']:checked")?.value;
    const mediaData = mediaByTitle(selected);
    if (!selected || !mediaData) {
      showToast("Selecione uma midia", "warning");
      return false;
    }
    storyData.medias ||= [];
    if (!storyData.medias.includes(selected)) storyData.medias.push(selected);
    storyData.vtTime = displayDuration(mediaData.duration || storyData.vtTime || "00:00");
    storyData.total = calculatedStoryTotal(storyData);
    saveState();
    renderStoryEditor(storyData.id);
    showToast("Midia adicionada na lauda", "success");
    return true;
  }, "Selecionar");
  const refresh = () => {
    $("#mediaPickRows").innerHTML = renderMediaPickerRows(filteredMediaForPicker());
    $$("#mediaPickRows tbody tr").forEach(row => row.addEventListener("click", () => {
      const input = row.querySelector("input[name='mediaPick']");
      if (input) input.checked = true;
    }));
  };
  $("#mediaPickSearch")?.addEventListener("click", refresh);
  refresh();
  return;
  openModal("Adicionar mídia", `
    <form id="mediaAttachForm" class="form-grid">
      ${renderField(field("media", "Arquivo", "select", true, state.medias.map(m => m.title)), state.medias[0]?.title || "")}
    </form>
  `, () => {
    const media = new FormData($("#mediaAttachForm")).get("media");
    storyData.medias ||= [];
    if (media && !storyData.medias.includes(media)) storyData.medias.push(media);
    saveState();
    renderStoryEditor(storyData.id);
    return true;
  }, "Adicionar");
}

function mediaByTitle(title) {
  return (state.medias || []).find(media => media.title === title);
}

function filteredMediaForPicker() {
  const start = $("#mediaPickStart")?.value || "";
  const end = $("#mediaPickEnd")?.value || "";
  const text = ($("#mediaPickText")?.value || "").toLowerCase();
  return (state.medias || []).filter(media => {
    const date = media.date || "";
    const haystack = [media.title, media.story, media.kind, media.status].filter(Boolean).join(" ").toLowerCase();
    return (!start || !date || date >= start) && (!end || !date || date <= end) && (!text || haystack.includes(text));
  });
}

function renderMediaPickerRows(rows) {
  if (!rows.length) return `<div class="empty compact">Nao ha midias para o filtro informado.</div>`;
  return `
    <table class="grid-table media-picker-table">
      <thead><tr><th></th><th>Retranca</th><th>Duração</th><th>Data</th><th>Tipo</th><th>Status</th></tr></thead>
      <tbody>
        ${rows.map((media, index) => `
          <tr>
            <td><input name="mediaPick" type="radio" value="${escapeAttr(media.title)}" ${index === 0 ? "checked" : ""}></td>
            <td>${escapeHtml(media.title)}</td>
            <td>${escapeHtml(media.duration || "00:00")}</td>
            <td>${formatDate(media.date || "")}</td>
            <td>${escapeHtml(media.kind || "Video")}</td>
            <td>${escapeHtml(media.status || "Pronto")}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function getStory(id) {
  return state.stories.find(story => story.id === id);
}

function renderSearch() {
  const query = state.filters.search?.text || "";
  const all = searchRows(query);
  $("#view").innerHTML = `
    <div class="split">
      <section class="pane">
        <div class="field"><label>Busca geral</label><input id="globalSearch" value="${escapeAttr(query)}" placeholder="Retranca, conteúdo, programa, fonte"></div>
        <div class="toolbar"><button id="searchNow" class="button primary">Buscar</button><button id="clearSearch" class="button">Limpar</button></div>
      </section>
      <section class="pane">${tableFromRows([["Origem", "Data", "Retranca", "Conteúdo"], ...all.map(row => [row.origin, formatDate(row.date || ""), row.title || row.name || row.file || "", row.content || row.status || ""])])}</section>
    </div>
  `;
  $("#searchNow").addEventListener("click", () => {
    state.filters.search = { text: $("#globalSearch").value };
    saveState();
    renderSearch();
  });
  $("#clearSearch").addEventListener("click", () => {
    state.filters.search = {};
    saveState();
    renderSearch();
  });
}
function searchRows(query) {
  const collections = Object.entries(modules).map(([, config]) => [config.title, config.collection]);
  return collections.flatMap(([origin, collection]) => (state[collection] || []).map(row => ({ ...row, origin })))
    .filter(row => !query || JSON.stringify(row).toLowerCase().includes(query.toLowerCase()));
}

function renderCalendar() {
  const monthDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const blanks = Array.from({ length: 5 }, (_, i) => i + 26);
  $("#view").innerHTML = `
    <div class="toolbar">
      <button class="button">‹</button><strong>maio 2026</strong><button class="button">›</button>
      <button class="button">Hoje</button><span class="spacer"></span>
      <button id="newEvent" class="button primary">Adicionar...</button><button class="button" onclick="window.print()">Imprimir</button>
    </div>
    <div class="calendar">
      ${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => `<div class="day head"><strong>${d}</strong></div>`).join("")}
      ${blanks.map(d => `<div class="day muted"><strong>${d}</strong></div>`).join("")}
      ${monthDays.map(day => {
        const iso = `2026-05-${String(day).padStart(2, "0")}`;
        return `<div class="day ${day === 27 ? "today" : ""}"><strong>${String(day).padStart(2, "0")}</strong>${state.events.filter(e => e.date === iso).map(e => `<div class="event" style="border-color:${e.color}">${e.title}</div>`).join("")}</div>`;
      }).join("")}
    </div>
  `;
  $("#newEvent").addEventListener("click", () => openForm({
    title: "Calendário",
    collection: "events",
    type: "event",
    fields: [field("date", "Data", "date", true), field("title", "Título", "text", true), field("kind", "Tipo"), field("color", "Cor")]
  }));
}

function renderCharts() {
  const data = [
    ["Pautas", state.assignments.length, "#3fa8f4"],
    ["Reportagens", state.reports.length, "#63c94f"],
    ["Laudas", state.stories.length, "#ffc947"],
    ["Mídias", state.medias.length, "#ff4f5e"],
    ["Contatos", state.contacts.length, "#8f55d9"]
  ];
  const max = Math.max(...data.map(item => item[1]), 1);
  $("#view").innerHTML = `
    <div class="filters compact">
      <div class="field"><label>Data inicial</label><input type="date" value="2026-04-27"></div>
      <div class="field"><label>Data final</label><input type="date" value="2026-05-27"></div>
      <div class="field"><label>Origem</label><select><option>Todos</option></select></div>
      <button class="button primary">Buscar</button><button id="exportCharts" class="button">Exportar</button>
    </div>
    <div class="chart-wrap">${data.map(item => `<div class="bar" style="height:${Math.max(28, item[1] / max * 430)}px;background:${item[2]}">${item[1]}<span>${item[0]}</span></div>`).join("")}</div>
  `;
  $("#exportCharts").addEventListener("click", () => exportCsv("graficos", data.map(([label, value]) => ({ label, value }))));
}

function renderArchive() {
  const archiveMap = {
    archive: { title: "Arquivo", collections: null },
    assignments_archive: { title: "Arquivo: Pautas", collections: ["assignments"] },
    production_archive: { title: "Arquivo: Produções", collections: ["production"] },
    reportages_archive: { title: "Arquivo: Reportagens", collections: ["reports"] },
    stories_archive: { title: "Arquivo: Laudas", collections: ["stories"] },
    trash: { title: "Lixeira", collections: null }
  };
  const page = archiveMap[state.active] || archiveMap.archive;
  const rows = page.collections ? state.trash.filter(item => page.collections.includes(item.originalCollection)) : state.trash;
  const archiveConfig = {
    title: page.title,
    collection: "trash",
    type: "trash",
    columns: [["deletedAt", "Data"], ["originalCollection", "Origem"], ["title", "Retranca"], ["originalType", "Tipo"]],
    fields: []
  };
  renderCrudModule(archiveConfig, rows, true);
}
function renderTrash() {
  renderArchive();
}
function renderBranchModule(id) {
  const title = flatMenu(menu).find(node => node.id === id)?.label || "Praças";
  const map = {
    branches_proposals: modules.proposals,
    branches_assignments: modules.assignments,
    branches_news_reports: modules.reports,
    branches_stories: { title: "Laudas", collection: "stories", type: "story", columns: [["date", "Data"], ["type", "Tipo"], ["title", "Retranca"], ["reporter", "Repórter"], ["status", "Status"]], fields: [] },
    branches_rundowns: { title: "Espelhos", collection: "branchRundowns", type: "rundown", columns: [["date", "Data"], ["program", "Programa"], ["blocks", "Blocos"], ["stories", "Laudas"]], fields: [] }
  };
  const config = map[id] || modules.proposals;
  const rows = id === "branches_rundowns" ? branchRundownRows() : (state[config.collection] || []);
  $("#view").innerHTML = `
    ${renderPageHeader(`Praças: ${title}`, `Visualização da praça ${state.branch}.`, [
      ["Novo", "branchNew", "primary"],
      ["Exportar", "branchExport", ""],
      ["Imprimir", "branchPrint", ""]
    ])}
    <div class="toolbar"><label>Praça:</label><select id="branchSelect">${branches().map(b => `<option ${state.branch === b ? "selected" : ""}>${b}</option>`).join("")}</select></div>
    ${renderDataTable(config, rows)}
  `;
  $("#branchSelect").addEventListener("change", (event) => { state.branch = event.target.value; saveState(); renderBranchModule(id); });
  $("#branchNew").addEventListener("click", () => ["branches_rundowns", "branches_stories"].includes(id) ? setActive("rundowns") : openForm(config));
  $("#branchExport").addEventListener("click", () => exportCsv(`pracas-${id}`, rows));
  $("#branchPrint").addEventListener("click", () => window.print());
  $$("#view tbody tr[data-id]").forEach(row => {
    row.addEventListener("click", () => {
      state.selected[config.collection] = row.dataset.id;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      renderBranchModule(id);
    });
    row.addEventListener("dblclick", () => {
      const record = findById(config.collection, row.dataset.id);
      if (record && config.fields?.length) openForm(config, record);
    });
  });
}

function branchRundownRows() {
  return Object.values(state.rundowns || {}).map(rundown => ({
    id: `${rundown.date}-${rundown.program}`,
    date: rundown.date,
    program: rundown.program,
    blocks: rundown.blocks.length,
    stories: rundown.blocks.flatMap(blockData => blockData.rows).length
  }));
}

function metric(label, value, className = "", id = "") {
  return `<div class="metric"><span>${label}</span><strong ${id ? `id="${id}"` : ""} class="${className}">${value}</strong></div>`;
}
function tableFromRows(rows) {
  return `<table class="grid-table"><thead><tr>${rows[0].map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(row => `<tr>${row.map(cell => `<td>${formatCell(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}
function openModal(title, body, onConfirm, confirmText = "Sim") {
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = body;
  $("#modalConfirm").textContent = confirmText;
  $("#modalCancel").textContent = "Não";
  $("#modal").hidden = false;
  modalHandler = onConfirm;
  modalCloseHandler = null;
}
function closeModal() {
  if (modalCloseHandler) modalCloseHandler();
  $("#modal").hidden = true;
  modalHandler = null;
  modalCloseHandler = null;
}
function exportCsv(name, rows) {
  const arr = rows || [];
  if (!arr.length) {
    showToast("Nenhum dado para exportar", "warning");
    return;
  }
  const keys = Array.isArray(arr[0]) ? arr[0].map((_, i) => String(i)) : Object.keys(arr[0]).filter(k => typeof arr[0][k] !== "object");
  const csv = [keys.join(";"), ...arr.map(row => keys.map(k => csvCell(Array.isArray(row) ? row[Number(k)] : row[k])).join(";"))].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`Exportado: ${arr.length} registro(s)`, "success");
}
function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}
function formatCell(value, key = "") {
  if (key === "lockStatus") return `<span class="status ${value && value !== "Livre" ? "warning" : "done"}">${escapeHtml(value || "Livre")}</span>`;
  if (value == null) return "";
  if (key === "date") return formatDate(value);
  if (key === "status" || key === "contentStatus") return `<span class="status ${statusClass(value)}">${value}</span>`;
  return escapeHtml(value);
}
function statusClass(value) {
  if (["Concluída", "Publicada", "Aprovada", "Pronto", "Finalizada", "Com conteúdo", "Pronta"].includes(value)) return "done";
  if (["Produzindo", "Produção", "Em produção", "Em apuração", "Em campo", "Nova"].includes(value)) return "busy";
  if (["Bloqueada", "Bloqueado"].includes(value)) return "warning";
  return "ready";
}
function sumTime(times) {
  const seconds = times.reduce((acc, time) => {
    const parts = String(time || "00:00").split(":").map(Number);
    const m = parts.length === 3 ? parts[1] : parts[0];
    const s = parts.length === 3 ? parts[2] : parts[1];
    return acc + (m * 60) + s;
  }, 0);
  return `00:${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}
function diffText(start, end) {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
}
function normalizeDuration(value) {
  const parts = String(value || "").split(":").map(part => Number(part) || 0);
  if (parts.length === 2) return `00:${String(parts[0]).padStart(2, "0")}:${String(parts[1]).padStart(2, "0")}`;
  if (parts.length >= 3) return `${String(parts[0]).padStart(2, "0")}:${String(parts[1]).padStart(2, "0")}:${String(parts[2]).padStart(2, "0")}`;
  return "02:00:00";
}
function displayDuration(value) {
  const full = normalizeDuration(value);
  return full.startsWith("00:") ? full.slice(3) : full;
}
function timeToSeconds(value) {
  const parts = normalizeDuration(value).split(":").map(Number);
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}
function secondsToTime(totalSeconds) {
  const safe = Math.max(0, totalSeconds);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
function addTime(start, duration) {
  return secondsToTime(timeToSeconds(start) + timeToSeconds(duration));
}
function calculatedStoryTotal(storyData) {
  return displayDuration(secondsToTime(
    timeToSeconds(storyData.headTime || "00:00") +
    timeToSeconds(storyData.vtTime || "00:00") +
    timeToSeconds(storyData.offTime || "00:00")
  ));
}
function nowText() {
  return new Date().toLocaleString("pt-BR", { hour12: false });
}
function formatDate(date) {
  if (!date || !String(date).includes("-")) return date || "";
  const [y, m, d] = String(date).split("-");
  return `${d}/${m}/${y}`;
}
function toIsoDate(text) {
  if (text instanceof Date && !Number.isNaN(text.getTime())) {
    const year = text.getFullYear();
    const month = String(text.getMonth() + 1).padStart(2, "0");
    const day = String(text.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(text || ""))) return String(text);
  const match = String(text || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}
function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[char]));
}
function escapeAttr(value) {
  return escapeHtml(value).replaceAll("\n", " ");
}
function nl(value) {
  return escapeHtml(value || "").replaceAll("\n", "<br>");
}
function storyMarkup(value) {
  return nl(value || "").replace(/\[(TEASER|ILUSTRA|RODA VT|ENTRA SONORA|ENTRA STANDUP|NOTA PÉ|INFORMAÇÕES)\]/gi, match => `<span class="snews-blue">${match.toUpperCase()}</span>`);
}
function initials(value) {
  return String(value || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0])
    .join("")
    .toUpperCase();
}

function showToast(message, type = "info") {
  let toast = $("#toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    document.body.appendChild(toast);
  }
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

async function createBackup() {
  if (!ROLE_PERMISSIONS[currentUser()?.role]?.backup) {
    showToast("Apenas editor pode criar backup", "warning");
    return;
  }
  try {
    const response = await fetch("/api/backup", { method: "POST", headers: authHeaders() });
    const data = await response.json();
    showToast(data.filename ? `Backup criado: ${data.filename}` : "Nada para salvar em backup", "success");
  } catch {
    showToast("Erro ao criar backup", "error");
  }
}

function activeModuleConfig() {
  if (modules[state.active]) return modules[state.active];
  if (state.active === "calendar") {
    return {
      title: "Calendario",
      collection: "events",
      type: "event",
      fields: [field("date", "Data", "date", true), field("title", "Titulo", "text", true), field("kind", "Tipo"), field("color", "Cor")]
    };
  }
  return null;
}

function setupGlobalShortcuts() {
  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (event.ctrlKey && key === "n") {
      event.preventDefault();
      const config = activeModuleConfig();
      if (config) openForm(config);
      else showToast("Abra um modulo de cadastro para criar um registro", "info");
    }
    if (event.ctrlKey && key === "s") {
      event.preventDefault();
      saveState();
      showToast("Dados salvos", "success");
    }
  });
}

function setupSidebarMemory() {
  if (localStorage.getItem("sidebar_collapsed") === "true") document.body.classList.add("collapsed");
  $("#toggleSidebar").addEventListener("click", () => {
    document.body.classList.toggle("collapsed");
    localStorage.setItem("sidebar_collapsed", document.body.classList.contains("collapsed"));
  });
}

function setupAutosave() {
  setInterval(() => {
    if (isLogged()) syncStateToServer();
  }, 30000);
}

function snewsPrintFooter(page = "01 de 01") {
  return `
    <footer class="snews-print-footer">
      <span>Data de Impressão: ${escapeHtml(nowText())}</span>
      <span>Copyright © Nexus Reda&ccedil;&atilde;o.</span>
      <span>Página&nbsp;&nbsp;${escapeHtml(page)}</span>
    </footer>
  `;
}

function snewsLogoBlock() {
  return `<div class="snews-logo-block"><img src="./logo.png" alt="Nexus"><strong>João Pessoa</strong></div>`;
}

function printAssignment(assignment) {
  const routes = assignment.routes || [];
  const firstRoute = routes[0] || {};
  const doc = `
    <section class="print-assignment-doc snews-print snews-assignment-print">
      <div class="snews-assignment-layout">
        ${snewsLogoBlock()}
        <table class="snews-meta-table snews-assignment-meta">
          <tbody>
            <tr>
              <td><strong>Data:</strong><br>${escapeHtml(formatDate(assignment.date))}</td>
              <td><strong>Retranca:</strong><br>${escapeHtml(assignment.title || "")}</td>
              <td><strong>Programas:</strong><br>${escapeHtml(assignment.program || assignment.programs || "")}</td>
            </tr>
            <tr>
              <td><strong>Pauteiros:</strong><br>${escapeHtml(assignment.writers || assignment.writer || "")}</td>
              <td colspan="2"><strong>Repórteres:</strong><br>${escapeHtml(assignment.reporters || assignment.reporter || "")}</td>
            </tr>
            <tr>
              <td colspan="3"><strong>Imagens:</strong><br>${escapeHtml(assignment.camera || assignment.images || "")}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="snews-assignment-body">
        <aside class="snews-route-box">
          <p>-----------------------------------</p>
          <p><strong>Roteiro 01 (${escapeHtml(formatDate(assignment.date))} ${escapeHtml(firstRoute.time || assignment.time || "")})</strong></p>
          <p>-----------------------------------</p>
          <p><strong>Entrevistado:</strong> ${escapeHtml(firstRoute.interviewee || "")}</p>
          <p><strong>Endereço:</strong> ${escapeHtml(firstRoute.address || assignment.location || "")}</p>
          <p><strong>Observações:</strong> ${escapeHtml(firstRoute.notes || "")}</p>
          ${routes.slice(1).map((route, index) => `
            <p class="snews-route-spacer"><strong>Roteiro ${String(index + 2).padStart(2, "0")} (${escapeHtml(route.time || "")})</strong></p>
            <p><strong>Entrevistado:</strong> ${escapeHtml(route.interviewee || "")}</p>
            <p><strong>Endereço:</strong> ${escapeHtml(route.address || "")}</p>
            <p><strong>Observações:</strong> ${escapeHtml(route.notes || "")}</p>
          `).join("")}
        </aside>
        <main class="snews-assignment-text">
          <h2>[Proposta]</h2>
          <p>${nl(assignment.proposal || assignment.content || " ")}</p>
          <h2>[Encaminhamento]</h2>
          <p>${nl(assignment.forwarding || " ")}</p>
          <h2>[Informações]</h2>
          <p>${nl(assignment.information || " ")}</p>
        </main>
      </div>
      ${snewsPrintFooter()}
    </section>
  `;
  const previous = $("#printAssignmentHost");
  previous?.remove();
  const host = document.createElement("div");
  host.id = "printAssignmentHost";
  host.innerHTML = doc;
  document.body.appendChild(host);
  window.print();
  setTimeout(() => host.remove(), 500);
}

function printStory(storyData) {
  const doc = `
    <section class="print-story-doc snews-print snews-story-print">
      <div class="snews-story-head">
        ${snewsLogoBlock()}
        <table class="snews-meta-table snews-story-meta">
          <tbody>
            <tr>
              <td><strong>Programa:</strong><br>${escapeHtml(storyData.program || state.program || "")}</td>
              <td><strong>Data:</strong><br>${escapeHtml(formatDate(storyData.date || state.date))}</td>
              <td><strong>Início:</strong><br>${escapeHtml(state.rundowns?.[rundownKey()]?.start || "")}</td>
              <td><strong>Término:</strong><br>${escapeHtml(state.rundowns?.[rundownKey()]?.end || "")}</td>
              <td class="snews-page-number" rowspan="3">${String(storyData.number || "").padStart(2, "0")}</td>
            </tr>
            <tr>
              <td><strong>Tipo:</strong><br>${escapeHtml(storyData.type || "")}</td>
              <td><strong>Retranca:</strong><br>${escapeHtml(storyData.title || "")}</td>
              <td><strong>Mídia</strong><br>${escapeHtml((storyData.medias || [])[0] ? "00:00" : "00:00")}</td>
              <td><strong>Cabeça:</strong><br>${escapeHtml(storyData.headTime || "00:00")}</td>
            </tr>
            <tr>
              <td><strong>Repórter:</strong><br>${escapeHtml(storyData.reporter || "")}</td>
              <td><strong>Editor:</strong><br>${escapeHtml(storyData.editor || "")}</td>
              <td><strong>Total:</strong><br>${escapeHtml(storyData.total || calculatedStoryTotal(storyData))}</td>
              <td colspan="2"><strong>Bloco</strong><br>Bloco 01</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="snews-story-body">
        <div class="snews-story-left"></div>
        <main class="snews-story-text">
          <h2>[${escapeHtml(storyData.head || storyData.reporter || "REDAÇÃO")}]</h2>
          <p>${storyMarkup(storyData.body || " ")}</p>
          ${(storyData.medias || []).map(media => `<p class="snews-blue">[ILUSTRA]</p><p>${escapeHtml(media)}</p>`).join("")}
          <p class="snews-blue">[RODA VT]</p>
          <p>${storyMarkup(storyData.vtText || " ")}</p>
          <p class="snews-blue">[INFORMAÇÕES]</p>
          <p>${storyMarkup(storyData.info || " ")}</p>
          ${storyData.foot ? `<p class="snews-blue">[NOTA PÉ]</p><p>${storyMarkup(storyData.foot)}</p>` : ""}
        </main>
      </div>
      ${snewsPrintFooter(`01 de ${String(Math.max(1, state.stories.length)).padStart(2, "0")}`)}
    </section>
  `;
  const previous = $("#printStoryHost");
  previous?.remove();
  const host = document.createElement("div");
  host.id = "printStoryHost";
  host.innerHTML = doc;
  document.body.appendChild(host);
  window.print();
  setTimeout(() => host.remove(), 500);
}

function printableStoryFromRundownRow(row, index) {
  const storyData = row.storyId ? getStory(row.storyId) : null;
  return {
    number: index + 1,
    type: storyData?.type || row.type || "",
    title: storyData?.title || row.title || "",
    reporter: storyData?.reporter || row.reporter || "",
    editor: storyData?.editor || row.editor || "",
    program: storyData?.program || state.program || "",
    date: storyData?.date || state.date || "",
    head: storyData?.head || storyData?.reporter || row.reporter || "REDAÇÃO",
    headTime: storyData?.headTime || row.head || "00:00",
    vtTime: storyData?.vtTime || row.vt || "00:00",
    total: storyData?.total || row.total || "00:00",
    body: storyData?.body || `[${(row.reporter || "REDAÇÃO").toUpperCase()}]\n\n${row.title || ""}`,
    vtText: storyData?.vtText || "",
    info: storyData?.info || `GC: ${row.title || ""}`,
    foot: storyData?.foot || "",
    medias: storyData?.medias || []
  };
}

function snewsStoryPrintSection(storyData, pageText) {
  return `
    <section class="print-story-doc snews-print snews-story-print">
      <div class="snews-story-head">
        ${snewsLogoBlock()}
        <table class="snews-meta-table snews-story-meta">
          <tbody>
            <tr>
              <td><strong>Programa:</strong><br>${escapeHtml(storyData.program || state.program || "")}</td>
              <td><strong>Data:</strong><br>${escapeHtml(formatDate(storyData.date || state.date))}</td>
              <td><strong>Início:</strong><br>${escapeHtml(state.rundowns?.[rundownKey()]?.start || "")}</td>
              <td><strong>Término:</strong><br>${escapeHtml(state.rundowns?.[rundownKey()]?.end || "")}</td>
              <td class="snews-page-number" rowspan="3">${String(storyData.number || "").padStart(2, "0")}</td>
            </tr>
            <tr>
              <td><strong>Tipo:</strong><br>${escapeHtml(storyData.type || "")}</td>
              <td><strong>Retranca:</strong><br>${escapeHtml(storyData.title || "")}</td>
              <td><strong>Mídia</strong><br>00:00</td>
              <td><strong>Cabeça:</strong><br>${escapeHtml(storyData.headTime || "00:00")}</td>
            </tr>
            <tr>
              <td><strong>Repórter:</strong><br>${escapeHtml(storyData.reporter || "")}</td>
              <td><strong>Editor:</strong><br>${escapeHtml(storyData.editor || "")}</td>
              <td><strong>Total:</strong><br>${escapeHtml(storyData.total || calculatedStoryTotal(storyData))}</td>
              <td><strong>Bloco</strong><br>Bloco 01</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="snews-story-body">
        <div class="snews-story-left"></div>
        <main class="snews-story-text">
          <h2>[${escapeHtml(storyData.head || storyData.reporter || "REDAÇÃO")}]</h2>
          <p>${storyMarkup(storyData.body || " ")}</p>
          ${(storyData.medias || []).map(media => `<p class="snews-blue">[ILUSTRA]</p><p>${escapeHtml(media)}</p>`).join("")}
          <p class="snews-blue">[RODA VT]</p>
          <p>${storyMarkup(storyData.vtText || " ")}</p>
          <p class="snews-blue">[INFORMAÇÕES]</p>
          <p>${storyMarkup(storyData.info || " ")}</p>
          ${storyData.foot ? `<p class="snews-blue">[NOTA PÉ]</p><p>${storyMarkup(storyData.foot)}</p>` : ""}
        </main>
      </div>
      ${snewsPrintFooter(pageText)}
    </section>
  `;
}

function printFullRundownStories() {
  const rundown = state.rundowns[rundownKey()];
  const rows = (rundown?.blocks || []).flatMap(blockData => blockData.rows || []);
  if (!rows.length) {
    showToast("Este espelho ainda nao tem laudas para imprimir", "warning");
    return;
  }
  const totalPages = rows.length;
  const doc = rows.map((row, index) => {
    const pageText = `${String(index + 1).padStart(2, "0")} de ${String(totalPages).padStart(2, "0")}`;
    return snewsStoryPrintSection(printableStoryFromRundownRow(row, index), pageText);
  }).join("");
  const previous = $("#printFullRundownHost");
  previous?.remove();
  const host = document.createElement("div");
  host.id = "printFullRundownHost";
  host.innerHTML = doc;
  document.body.appendChild(host);
  window.print();
  setTimeout(() => host.remove(), 500);
}

function renderPrintableRundown(rundown) {
  normalizeRundownTiming(rundown);
  const timing = rundownTiming(rundown);
  const city = rundown.city || state.branch || "";
  const rowsFor = rows => rows.map(row => {
    const storyData = row.storyId ? getStory(row.storyId) : null;
    return `
      <tr>
        <td>${escapeHtml(String(row.page || "").padStart(2, "0"))}</td>
        <td>${escapeHtml(row.type || "")}</td>
        <td>${escapeHtml(row.title || "")}</td>
        <td>${escapeHtml(row.editor || storyData?.editor || "")}</td>
        <td>${escapeHtml(row.reporter || storyData?.reporter || "")}</td>
        <td>${escapeHtml(row.head || storyData?.headTime || "00:00")}</td>
        <td>${escapeHtml(row.vt || storyData?.vtTime || "00:00")}</td>
        <td>${escapeHtml(row.total || storyData?.total || "00:00")}</td>
        <td>${row.ok || row.approved ? "X" : ""}</td>
        <td>${row.approved || storyData?.status === "Aprovada" || storyData?.status === "Finalizada" ? "X" : ""}</td>
      </tr>
    `;
  }).join("");

  const blockSections = (rundown.blocks || []).map((blockData, blockIndex) => {
    const rows = (blockData.rows || []).map((row, index) => ({ ...row, page: row.page || index + 1 }));
    const blockTotal = sumTime(rows.map(row => row.total || "00:00"));
    const isStandby = blockData.standby || /stand/i.test(blockData.title || "");
    return `
      <section class="snews-rundown-block ${isStandby ? "standby" : ""}">
        <div class="snews-block-title">
          <strong>${escapeHtml(isStandby ? "Stand By" : blockData.title || `Bloco ${blockIndex + 1}`)}</strong>
          <span>Break: ${escapeHtml(displayDuration(blockData.breakTime || "00:00"))}</span>
        </div>
        <table class="snews-rundown-table">
          <thead><tr><th>Pág</th><th>Tipo</th><th>Retranca</th><th>Editor</th><th>Repórter</th><th>Cab.</th><th>VT</th><th>Total</th><th>OK</th><th>Apr</th></tr></thead>
          <tbody>${rowsFor(rows)}</tbody>
          <tfoot><tr><td colspan="7">Total do Bloco:</td><td>${escapeHtml(blockTotal)}</td><td colspan="2"></td></tr></tfoot>
        </table>
      </section>
    `;
  }).join("");

  return `
    <section class="print-rundown snews-print snews-rundown-print">
      <div class="snews-rundown-head">
        ${snewsLogoBlock()}
        <table class="snews-meta-table snews-rundown-meta">
          <tbody>
            <tr>
              <td><strong>Data:</strong><br>${escapeHtml(formatDate(rundown.date))}</td>
              <td><strong>Programa:</strong><br>${escapeHtml(rundown.program || "")}</td>
            </tr>
            <tr>
              <td><strong>Início:</strong><br>${escapeHtml(rundown.start)}</td>
              <td><strong>Fim:</strong><br>${escapeHtml(rundown.end)}</td>
              <td><strong>Comerciais:</strong><br>00:00:00</td>
              <td><strong>Duração:</strong><br>${escapeHtml(timing.duration)}</td>
              <td><strong>Total:</strong><br>${escapeHtml(timing.total)}</td>
              <td><strong>Sobra:</strong><br>${escapeHtml(timing.balance)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      ${blockSections}
      <div class="snews-rundown-grand-total">
        <strong>Total do Espelho:</strong><span></span><span>${escapeHtml(timing.production)}</span><span>${escapeHtml(timing.total)}</span>
      </div>
      ${snewsPrintFooter()}
    </section>
  `;
}

function snewsLogoBlock() {
  return `<div class="snews-logo-block"><img src="${escapeAttr(printLogoSrc())}" alt="Logo de impressao"><strong>${escapeHtml(state.branch || "Joao Pessoa")}</strong></div>`;
}

$("#modalClose").addEventListener("click", closeModal);
$("#modalCancel").addEventListener("click", closeModal);
$("#modalConfirm").addEventListener("click", async () => {
  $("#modalConfirm").disabled = true;
  try {
    const result = modalHandler ? await modalHandler() : true;
    if (result !== false) closeModal();
  } finally {
    $("#modalConfirm").disabled = false;
  }
});
$("#logoutButton").addEventListener("click", () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  render();
});
$("#backupBtn")?.addEventListener("click", createBackup);
$("#notificationsBtn")?.addEventListener("click", () => setActive("notifications"));
$("#shortcutsBtn")?.addEventListener("click", () => setActive("shortcuts"));
$("#homeBtn")?.addEventListener("click", () => setActive("dashboard"));
$("#settingsBtn")?.addEventListener("click", () => setActive("settings"));
setupSidebarMemory();
setupGlobalShortcuts();
setupAutosave();

setInterval(() => {
  $("#clock").textContent = new Date().toLocaleTimeString("pt-BR", { hour12: false });
}, 1000);

hydrateStateFromServer().then(render);
