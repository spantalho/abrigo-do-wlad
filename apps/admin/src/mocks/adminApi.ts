import type { DogProps } from "../types/dogs";
import type {
  AdminNotification,
  NotificationExpiration,
  NotificationInput,
} from "../types/notifications";
import type { RecyclePoint } from "../types/recycle";
import type { SystemKey } from "../types/systemKeys";
import {
  dogInputSchema,
  dogUpdateSchema,
  recyclePointInputSchema,
  recyclePointUpdateSchema,
} from "../../shared/entities";

type AdoptionStatus = "pending" | "approved" | "rejected";

interface MockAdoption {
  id: string;
  nome_adotante: string;
  telefone: string;
  animal_especifico: string;
  status: AdoptionStatus;
  submittedAt: string;
  expiresAt: string;
  [key: string]: string;
}

interface MockState {
  dogs: DogProps[];
  recyclePoints: RecyclePoint[];
  adoptions: MockAdoption[];
  notification: AdminNotification | null;
  systemKeys: SystemKey[];
  adoptionsViaSite: number;
  auditLog: Array<Record<string, unknown>>;
  nextDogId: number;
  nextRecycleId: number;
}

const MOCK_AUTHOR = "desenvolvedor@localhost.test";

function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

function hoursFromNow(hours: number): string {
  return new Date(Date.now() + hours * 3_600_000).toISOString();
}

function createInitialState(): MockState {
  return {
    dogs: [
      {
        id: 103,
        nome: "Simba",
        idade: "3 anos",
        cateIdade: "adulto",
        sexo: "Macho",
        temperamento: "Companheiro e brincalhão",
        tags: ["docil", "brincalhao", "sociavel"],
        status: "Vacinado e Castrado",
        fotos: [],
        cor: "caramelo",
        instaLink: "",
        descricaoCompleta: "Gosta de passeios, carinho e companhia.",
      },
      {
        id: 102,
        nome: "Amora",
        idade: "8 meses",
        cateIdade: "filhote",
        sexo: "Fêmea",
        temperamento: "Curiosa e carinhosa",
        tags: ["curioso", "carinhoso", "ativo"],
        status: "Em Protocolo Vacinal",
        fotos: [],
        cor: "pretinho",
        instaLink: "",
        descricaoCompleta: "Está aprendendo a passear na guia.",
      },
      {
        id: 101,
        nome: "Bento",
        idade: "9 anos",
        cateIdade: "idoso",
        sexo: "Macho",
        temperamento: "Calmo e muito afetuoso",
        tags: ["tranquilo", "amavel", "companheiro"],
        status: "Apenas Castrado",
        fotos: [],
        cor: "fiapoManga",
        instaLink: "",
        descricaoCompleta: "Prefere uma rotina tranquila e muitos cochilos.",
      },
    ],
    recyclePoints: [
      {
        id: "eco-meireles",
        zone: "ZONA LESTE",
        neighborhood: "Meireles",
        name: "Mercadinho do Bairro",
        address: "Rua das Flores, 120 — segunda a sábado, 8h às 18h",
        googleMapsUrl: "https://maps.app.goo.gl/GRqPHHcqKZCUxHLN8",
      },
      {
        id: "pet-benfica",
        zone: "CENTRO",
        neighborhood: "Benfica",
        name: "Pet Amigo",
        address: "Avenida da Universidade, 850 — segunda a sexta, 9h às 17h",
        googleMapsUrl: "https://www.google.com/maps/place/Benfica,+Fortaleza+-+CE",
      },
      {
        id: "coleta-messejana",
        zone: "ZONA SUL",
        neighborhood: "Messejana",
        name: "Ponto Solidário",
        address: "Rua Padre Pedro de Alencar, 45 — todos os dias, 8h às 20h",
        googleMapsUrl: "https://maps.google.com/?q=Messejana,+Fortaleza+-+CE",
      },
    ],
    adoptions: [
      {
        id: "adoption-livia",
        nome_adotante: "Lívia Martins",
        telefone: "(85) 99999-1001",
        animal_especifico: "Simba",
        status: "pending",
        submittedAt: hoursFromNow(-6),
        expiresAt: daysFromNow(2),
        idade: "31 anos",
        estado_civil: "Casada",
        profissao: "Professora",
        empresa: "Escola Horizonte",
        endereco: "Fortaleza, CE",
        email: "livia@example.test",
        redes_sociais: "@livia.exemplo",
        qtd_adultos: "2",
        criancas: "Nenhuma",
        renda_mensal: "Acima de 5 salários mínimos",
        acordo: "Sim",
        alergia: "Não",
        motivo: "Companhia e adoção responsável",
        porte: "Médio",
        sexo: "Sem preferência",
        idade_animal: "Adulto",
        personalidade: "Sociável",
        atividade: "Passeios diários",
        responsavel: "A candidata",
        horas_sozinho: "Até 4 horas",
        passeios: "Duas vezes por dia",
        tipo_moradia: "Apartamento telado",
        proprietario_permite: "Sim",
        detalhes_moradia: "Apartamento próprio com telas",
        moradores: "Duas pessoas",
        areas_frequentar: "Todos os cômodos",
        periodos: "Livre acesso",
        dormir: "Dentro de casa",
        acesso: "Toda a residência",
        outros_animais: "Um gato",
        castrados: "Sim",
        ja_teve: "Sim",
        destino_antigos: "Falecimento por idade avançada",
        veterinario: "Clínica próxima da residência",
        racao: "Premium",
        coleira: "Sim",
        ciencia_adaptacao: "Sim",
        tempo_adaptacao: "O tempo necessário",
        adestrador: "Sim, se necessário",
        motivo_nao_adestrar: "Não se aplica",
        carro: "Sim",
        financeiro_vet: "Possui reserva",
        vacinas: "Concorda",
        gasto_mensal: "R$ 500",
        divulgacao: "Sim",
        noticias: "Sim",
        visitas: "Sim",
        fotos_adocao: "Sim",
        contribuicao: "Sim",
        compromisso_vida: "Sim",
        gravidez: "O animal permanece com a família",
        viagem: "Ficará com familiar",
        mudanca_menor: "Será levado junto",
        mudanca_longe: "Será levado junto",
        separacao: "Ficará com a responsável",
        falecimento: "A família assumirá os cuidados",
        perder: "Busca imediata e divulgação",
        doenca: "Atendimento veterinário",
        morder: "Avaliação comportamental",
        destruicao: "Adaptação e enriquecimento ambiental",
        xixi_errado: "Treinamento com reforço positivo",
        enxoval: "Ciente",
        devolucao: "Entrará em contato com o abrigo",
        termo_nao_repassar: "Concorda",
        obs: "Disponível para entrevista aos sábados.",
      },
      {
        id: "adoption-rafael",
        nome_adotante: "Rafael Nogueira",
        telefone: "(85) 98888-2002",
        animal_especifico: "Amora",
        status: "approved",
        submittedAt: daysFromNow(-3),
        expiresAt: daysFromNow(4),
        idade: "27 anos",
        email: "rafael@example.test",
        endereco: "Caucaia, CE",
        tipo_moradia: "Casa com quintal murado",
        motivo: "Aumentar a família",
        obs: "Entrevista inicial concluída.",
      },
      {
        id: "adoption-camila",
        nome_adotante: "Camila Oliveira",
        telefone: "(85) 97777-3003",
        animal_especifico: "Sem preferência",
        status: "rejected",
        submittedAt: daysFromNow(-8),
        expiresAt: daysFromNow(12),
        idade: "22 anos",
        email: "camila@example.test",
        endereco: "Fortaleza, CE",
        tipo_moradia: "Apartamento",
        motivo: "Companhia",
        obs: "Registro simulado para testar o estado reprovado.",
      },
    ],
    notification: {
      message: "Este painel usa somente dados simulados locais.",
      type: "info",
      target: "admin",
      updatedAt: new Date().toISOString(),
      author: MOCK_AUTHOR,
      expiration: "until_deleted",
      expiresAt: null,
    },
    systemKeys: [
      {
        id: "mock-key-v2",
        version: "mock-v2",
        createdAt: daysFromNow(-14),
        author: MOCK_AUTHOR,
        counter: 12,
        active: true,
      },
      {
        id: "mock-key-v1",
        version: "mock-v1",
        createdAt: daysFromNow(-60),
        author: MOCK_AUTHOR,
        counter: 34,
        active: false,
      },
    ],
    adoptionsViaSite: 7,
    auditLog: [],
    nextDogId: 104,
    nextRecycleId: 1,
  };
}

let state = createInitialState();

export function resetMockAdminState(): void {
  state = createInitialState();
}

function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function noContentResponse(): Response {
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}

function adoptionSummary(adoption: MockAdoption) {
  const {
    id,
    nome_adotante,
    telefone,
    animal_especifico,
    status,
    submittedAt,
    expiresAt,
  } = adoption;
  return {
    id,
    nome_adotante,
    telefone,
    animal_especifico,
    status,
    submittedAt,
    expiresAt,
  };
}

function methodNotAllowed(allowed: string[]): Response {
  return new Response(null, { status: 405, headers: { Allow: allowed.join(", ") } });
}

function validationErrorResponse(message: string): Response {
  return jsonResponse({ error: message }, 400);
}

async function readJson<T>(request: Request): Promise<T> {
  try {
    return await request.json() as T;
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function expirationDate(expiration: NotificationExpiration): string | null {
  if (expiration === "until_deleted") return null;
  return hoursFromNow(Number.parseInt(expiration, 10));
}

function recordMutation(request: Request, target: string): void {
  state.auditLog.unshift({
    id: crypto.randomUUID(),
    actor: MOCK_AUTHOR,
    actorRole: "developer",
    method: request.method,
    path: new URL(request.url).pathname,
    target,
    outcome: "success",
    createdAt: new Date().toISOString(),
  });
}

async function handleDogs(request: Request, idSegment?: string): Promise<Response> {
  if (!idSegment) {
    if (request.method === "GET") return jsonResponse(state.dogs);
    if (request.method !== "POST") return methodNotAllowed(["GET", "POST"]);

    const parsedInput = dogInputSchema.safeParse(await readJson<unknown>(request));
    if (!parsedInput.success) {
      return validationErrorResponse(
        parsedInput.error.issues[0]?.message ?? "Dados do cachorro inválidos.",
      );
    }
    const input = parsedInput.data;
    const dog = { ...input, id: state.nextDogId++ };
    state.dogs.push(dog);
    recordMutation(request, `dogs/${dog.id}`);
    return jsonResponse({ id: dog.id }, 201);
  }

  const id = Number(idSegment);
  const index = state.dogs.findIndex((dog) => dog.id === id);
  if (index < 0) return jsonResponse({ error: "Dog not found." }, 404);

  if (request.method === "GET") return jsonResponse(state.dogs[index]);
  if (request.method === "PATCH") {
    const parsedUpdate = dogUpdateSchema.safeParse(await readJson<unknown>(request));
    if (!parsedUpdate.success) {
      return validationErrorResponse(
        parsedUpdate.error.issues[0]?.message ?? "Atualização do cachorro inválida.",
      );
    }
    state.dogs[index] = { ...state.dogs[index], ...parsedUpdate.data, id };
    recordMutation(request, `dogs/${id}`);
    return jsonResponse({ ok: true });
  }
  if (request.method === "DELETE") {
    state.dogs.splice(index, 1);
    if (new URL(request.url).searchParams.get("adoptedViaSite") === "true") {
      state.adoptionsViaSite += 1;
    }
    recordMutation(request, `dogs/${id}`);
    return noContentResponse();
  }
  return methodNotAllowed(["GET", "PATCH", "DELETE"]);
}

async function handleRecyclePoints(request: Request, idSegment?: string): Promise<Response> {
  if (!idSegment) {
    if (request.method === "GET") return jsonResponse(state.recyclePoints);
    if (request.method !== "POST") return methodNotAllowed(["GET", "POST"]);

    const parsedInput = recyclePointInputSchema.safeParse(await readJson<unknown>(request));
    if (!parsedInput.success) {
      return validationErrorResponse(
        parsedInput.error.issues[0]?.message ?? "Dados do ponto de coleta inválidos.",
      );
    }
    const input = parsedInput.data;
    const point = { ...input, id: `mock-recycle-${state.nextRecycleId++}` };
    state.recyclePoints.push(point);
    recordMutation(request, `recycle_points/${point.id}`);
    return jsonResponse({ id: point.id }, 201);
  }

  const id = decodeURIComponent(idSegment);
  const index = state.recyclePoints.findIndex((point) => point.id === id);
  if (index < 0) return jsonResponse({ error: "Recycle point not found." }, 404);

  if (request.method === "GET") return jsonResponse(state.recyclePoints[index]);
  if (request.method === "PATCH") {
    const parsedUpdate = recyclePointUpdateSchema.safeParse(await readJson<unknown>(request));
    if (!parsedUpdate.success) {
      return validationErrorResponse(
        parsedUpdate.error.issues[0]?.message ?? "Atualização do ponto de coleta inválida.",
      );
    }
    state.recyclePoints[index] = { ...state.recyclePoints[index], ...parsedUpdate.data, id };
    recordMutation(request, `recycle_points/${id}`);
    return jsonResponse({ ok: true });
  }
  if (request.method === "DELETE") {
    state.recyclePoints.splice(index, 1);
    recordMutation(request, `recycle_points/${id}`);
    return noContentResponse();
  }
  return methodNotAllowed(["GET", "PATCH", "DELETE"]);
}

async function handleNotification(request: Request): Promise<Response> {
  if (request.method === "GET") return jsonResponse(state.notification);
  if (request.method === "PUT") {
    const input = await readJson<NotificationInput>(request);
    state.notification = {
      ...input,
      target: "admin",
      updatedAt: new Date().toISOString(),
      author: MOCK_AUTHOR,
      expiresAt: expirationDate(input.expiration),
    };
    recordMutation(request, "system/notifications");
    return jsonResponse(state.notification);
  }
  if (request.method === "DELETE") {
    state.notification = null;
    recordMutation(request, "system/notifications");
    return noContentResponse();
  }
  return methodNotAllowed(["GET", "PUT", "DELETE"]);
}

async function handleMedia(request: Request, operation: string): Promise<Response> {
  if (operation === "upload") {
    if (request.method !== "POST") return methodNotAllowed(["POST"]);
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return jsonResponse({ error: "Invalid image file" }, 400);
    return jsonResponse({ url: URL.createObjectURL(file) }, 201);
  }

  if (operation === "delete") {
    if (request.method !== "POST") return methodNotAllowed(["POST"]);
    const { imageUrl } = await readJson<{ imageUrl?: unknown }>(request);
    if (typeof imageUrl === "string" && imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "Not found" }, 404);
}

export async function handleMockAdminRequest(request: Request): Promise<Response> {
  await Promise.resolve();

  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);

  if (url.pathname === "/api/session") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    return jsonResponse({ email: MOCK_AUTHOR, role: "developer" });
  }

  if (url.pathname === "/api/admin/dashboard") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    const now = Date.now();
    const expiringAdoptions = state.adoptions
      .filter((adoption) => {
        const expiry = Date.parse(adoption.expiresAt);
        return expiry >= now && expiry <= now + 5 * 86_400_000;
      })
      .map((adoption) => ({
        id: adoption.id,
        nome: adoption.nome_adotante,
        daysLeft: Math.max(0, Math.ceil((Date.parse(adoption.expiresAt) - now) / 86_400_000)),
      }))
      .sort((left, right) => left.daysLeft - right.daysLeft);

    return jsonResponse({
      metrics: {
        dogs: state.dogs.length,
        recycles: state.recyclePoints.length,
        adoptions: state.adoptions.length,
        adoptionsViaSite: state.adoptionsViaSite,
      },
      expiringAdoptions,
      notification: state.notification,
    });
  }

  if (url.pathname === "/api/admin/adoptions") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    return jsonResponse(state.adoptions.map(adoptionSummary));
  }

  if (segments[2] === "adoptions" && segments.length === 4) {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    const adoption = state.adoptions.find((item) => item.id === segments[3]);
    if (!adoption) return jsonResponse({ error: "Adoption application not found." }, 404);
    return jsonResponse(adoption);
  }

  if (
    segments[2] === "adoptions" &&
    segments[4] === "status" &&
    segments.length === 5
  ) {
    if (request.method !== "PATCH") return methodNotAllowed(["PATCH"]);
    const adoption = state.adoptions.find((item) => item.id === segments[3]);
    if (!adoption) return jsonResponse({ error: "Adoption application not found." }, 404);
    const { status } = await readJson<{ status: AdoptionStatus }>(request);
    adoption.status = status;
    recordMutation(request, `adoption_application/${adoption.id}`);
    return jsonResponse({ ok: true });
  }

  if (segments[2] === "dogs" && segments.length <= 4) {
    return handleDogs(request, segments[3]);
  }

  if (segments[2] === "recycle-points" && segments.length <= 4) {
    return handleRecyclePoints(request, segments[3]);
  }

  if (url.pathname === "/api/admin/notifications") {
    return handleNotification(request);
  }

  if (url.pathname === "/api/admin/system-keys") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    return jsonResponse(state.systemKeys);
  }

  if (url.pathname === "/api/admin/system-keys/rotate") {
    if (request.method !== "POST") return methodNotAllowed(["POST"]);
    state.systemKeys.forEach((key) => { key.active = false; });
    const number = state.systemKeys.length + 1;
    const created: SystemKey = {
      id: `mock-key-v${number}`,
      version: `mock-v${number}`,
      createdAt: new Date().toISOString(),
      author: MOCK_AUTHOR,
      counter: 0,
      active: true,
    };
    state.systemKeys.unshift(created);
    recordMutation(request, "system/keys");
    return jsonResponse({ id: created.id, version: created.version }, 201);
  }

  if (url.pathname === "/api/admin/audit-log") {
    if (request.method !== "GET") return methodNotAllowed(["GET"]);
    return jsonResponse(state.auditLog);
  }

  if (segments[2] === "media" && segments.length === 4) {
    return handleMedia(request, segments[3] ?? "");
  }

  return jsonResponse({ error: "Not found" }, 404);
}
