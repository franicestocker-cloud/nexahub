from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# -----------------------------------------------------------------------------
# Setup
# -----------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALG = "HS256"

app = FastAPI(title="NexaHub API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nexahub")


# -----------------------------------------------------------------------------
# Auth helpers
# -----------------------------------------------------------------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def create_access_token(user_id: str, email: str, company_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "company_id": company_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Usuário não encontrado")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")


def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=7 * 24 * 3600,
        path="/",
    )


# -----------------------------------------------------------------------------
# Models
# -----------------------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id() -> str:
    return str(uuid.uuid4())


class SignupReq(BaseModel):
    name: str
    email: EmailStr
    password: str
    company_name: str
    segment: Optional[str] = "Agência"


class LoginReq(BaseModel):
    email: EmailStr
    password: str


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    segment: Optional[str] = None
    logo_url: Optional[str] = None
    primary_color: Optional[str] = None
    plan: Optional[str] = None
    platform_name: Optional[str] = None


class CRMEntry(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    value: Optional[float] = 0
    stage: str = "lead"  # lead, contact, proposal, negotiation, client
    owner_id: Optional[str] = None
    notes: Optional[str] = None
    tags: List[str] = []


class ProjectEntry(BaseModel):
    title: str
    description: Optional[str] = ""
    status: str = "novo"  # novo, em_andamento, producao, aguardando, revisao, concluido
    client_id: Optional[str] = None
    owner_id: Optional[str] = None
    priority: str = "media"  # baixa, media, alta, urgente
    due_date: Optional[str] = None
    tags: List[str] = []
    progress: int = 0


class AgendaEntry(BaseModel):
    title: str
    description: Optional[str] = ""
    start: str
    end: Optional[str] = None
    type: str = "evento"  # evento, reuniao, tarefa, prazo
    related_id: Optional[str] = None
    color: Optional[str] = "#D94A38"


class FinanceEntry(BaseModel):
    description: str
    amount: float
    type: str  # receita, despesa
    category: Optional[str] = "geral"
    status: str = "pendente"  # pendente, pago, vencido
    due_date: Optional[str] = None
    client_id: Optional[str] = None


class ModuleEntry(BaseModel):
    name: str
    icon: Optional[str] = "Cube"
    color: Optional[str] = "#D94A38"
    order: int = 99
    active: bool = True
    fields: List[Dict[str, Any]] = []


class AIChatReq(BaseModel):
    message: str
    session_id: Optional[str] = None


# -----------------------------------------------------------------------------
# Tenant helper
# -----------------------------------------------------------------------------
def tenant_doc(user: dict, extra: dict) -> dict:
    return {
        "id": new_id(),
        "company_id": user["company_id"],
        "created_at": now_iso(),
        "updated_at": now_iso(),
        "created_by": user["id"],
        "updated_by": user["id"],
        **extra,
    }


def tenant_filter(user: dict) -> dict:
    return {"company_id": user["company_id"]}


def strip_id(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc.pop("_id", None)
    return doc


# -----------------------------------------------------------------------------
# AUTH ROUTES
# -----------------------------------------------------------------------------
@api.post("/auth/signup")
async def signup(req: SignupReq, response: Response):
    email = req.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="E-mail já cadastrado")

    company_id = new_id()
    company = {
        "id": company_id,
        "name": req.company_name,
        "segment": req.segment or "Agência",
        "logo_url": None,
        "primary_color": "#D94A38",
        "plan": "trial",
        "platform_name": "NexaHub",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.companies.insert_one(company)

    user_id = new_id()
    user = {
        "id": user_id,
        "company_id": company_id,
        "name": req.name,
        "email": email,
        "password_hash": hash_password(req.password),
        "role": "ceo",
        "avatar": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.users.insert_one(user)

    # seed default modules
    default_modules = [
        ("Dashboard", "Gauge", 1),
        ("CRM", "Funnel", 2),
        ("Projetos", "Kanban", 3),
        ("Agenda", "CalendarBlank", 4),
        ("Financeiro", "CurrencyCircleDollar", 5),
        ("Clientes", "Users", 6),
        ("Equipe", "UsersThree", 7),
        ("Configurações", "Gear", 8),
    ]
    for name, icon, order in default_modules:
        await db.modules.insert_one(
            {
                "id": new_id(),
                "company_id": company_id,
                "name": name,
                "icon": icon,
                "color": "#D94A38",
                "order": order,
                "active": True,
                "fields": [],
                "is_native": True,
                "created_at": now_iso(),
                "updated_at": now_iso(),
                "created_by": user_id,
                "updated_by": user_id,
            }
        )

    token = create_access_token(user_id, email, company_id, "ceo")
    set_auth_cookie(response, token)
    return {
        "user": {k: v for k, v in user.items() if k not in ("password_hash", "_id")},
        "company": strip_id(company),
        "token": token,
    }


@api.post("/auth/login")
async def login(req: LoginReq, response: Response):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    token = create_access_token(user["id"], user["email"], user["company_id"], user["role"])
    set_auth_cookie(response, token)
    user.pop("password_hash", None)
    user.pop("_id", None)
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    return {"user": user, "company": company, "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    return {"user": user, "company": company}


# -----------------------------------------------------------------------------
# COMPANY
# -----------------------------------------------------------------------------
@api.put("/company")
async def update_company(payload: CompanyUpdate, user=Depends(get_current_user)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    await db.companies.update_one({"id": user["company_id"]}, {"$set": update})
    company = await db.companies.find_one({"id": user["company_id"]}, {"_id": 0})
    return company


# -----------------------------------------------------------------------------
# Generic CRUD factory
# -----------------------------------------------------------------------------
def make_crud(prefix: str, collection_name: str, model_cls):
    @api.get(f"/{prefix}")
    async def list_items(user=Depends(get_current_user)):
        items = await db[collection_name].find(tenant_filter(user), {"_id": 0}).sort("created_at", -1).to_list(2000)
        return items

    @api.post(f"/{prefix}")
    async def create_item(payload: model_cls, user=Depends(get_current_user)):
        doc = tenant_doc(user, payload.model_dump())
        await db[collection_name].insert_one(doc)
        doc.pop("_id", None)
        # log timeline
        await db.timeline.insert_one(
            {
                "id": new_id(),
                "company_id": user["company_id"],
                "user_id": user["id"],
                "user_name": user["name"],
                "action": "create",
                "entity": prefix,
                "entity_id": doc["id"],
                "summary": f"{user['name']} criou {prefix} '{payload.model_dump().get('name') or payload.model_dump().get('title') or payload.model_dump().get('description', '')[:30]}'",
                "created_at": now_iso(),
            }
        )
        return doc

    @api.put(f"/{prefix}/{{item_id}}")
    async def update_item(item_id: str, payload: model_cls, user=Depends(get_current_user)):
        update = payload.model_dump()
        update["updated_at"] = now_iso()
        update["updated_by"] = user["id"]
        result = await db[collection_name].update_one(
            {"id": item_id, "company_id": user["company_id"]}, {"$set": update}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Não encontrado")
        doc = await db[collection_name].find_one({"id": item_id}, {"_id": 0})
        await db.timeline.insert_one(
            {
                "id": new_id(),
                "company_id": user["company_id"],
                "user_id": user["id"],
                "user_name": user["name"],
                "action": "update",
                "entity": prefix,
                "entity_id": item_id,
                "summary": f"{user['name']} atualizou {prefix}",
                "created_at": now_iso(),
            }
        )
        return doc

    @api.delete(f"/{prefix}/{{item_id}}")
    async def delete_item(item_id: str, user=Depends(get_current_user)):
        doc = await db[collection_name].find_one({"id": item_id, "company_id": user["company_id"]}, {"_id": 0})
        if not doc:
            raise HTTPException(status_code=404, detail="Não encontrado")
        # move to trash
        await db.trash.insert_one(
            {
                "id": new_id(),
                "company_id": user["company_id"],
                "original_collection": collection_name,
                "original_id": item_id,
                "data": doc,
                "deleted_at": now_iso(),
                "deleted_by": user["id"],
            }
        )
        await db[collection_name].delete_one({"id": item_id})
        return {"ok": True}


make_crud("crm", "crm_entries", CRMEntry)
make_crud("projects", "projects", ProjectEntry)
make_crud("agenda", "agenda", AgendaEntry)
make_crud("finance", "finance", FinanceEntry)


# -----------------------------------------------------------------------------
# MODULES (with native flag handling)
# -----------------------------------------------------------------------------
@api.get("/modules")
async def list_modules(user=Depends(get_current_user)):
    items = await db.modules.find({"company_id": user["company_id"]}, {"_id": 0}).sort("order", 1).to_list(500)
    return items


@api.post("/modules")
async def create_module(payload: ModuleEntry, user=Depends(get_current_user)):
    doc = tenant_doc(user, {**payload.model_dump(), "is_native": False})
    await db.modules.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/modules/{module_id}")
async def update_module(module_id: str, payload: ModuleEntry, user=Depends(get_current_user)):
    update = payload.model_dump()
    update["updated_at"] = now_iso()
    update["updated_by"] = user["id"]
    await db.modules.update_one({"id": module_id, "company_id": user["company_id"]}, {"$set": update})
    doc = await db.modules.find_one({"id": module_id}, {"_id": 0})
    return doc


@api.delete("/modules/{module_id}")
async def delete_module(module_id: str, user=Depends(get_current_user)):
    mod = await db.modules.find_one({"id": module_id, "company_id": user["company_id"]})
    if not mod:
        raise HTTPException(status_code=404, detail="Módulo não encontrado")
    if mod.get("is_native"):
        raise HTTPException(status_code=400, detail="Módulo nativo não pode ser excluído")
    await db.modules.delete_one({"id": module_id})
    return {"ok": True}


# -----------------------------------------------------------------------------
# DASHBOARD STATS
# -----------------------------------------------------------------------------
@api.get("/dashboard/stats")
async def dashboard_stats(user=Depends(get_current_user)):
    cid = user["company_id"]
    today = datetime.now(timezone.utc).date().isoformat()

    crm_total = await db.crm_entries.count_documents({"company_id": cid})
    crm_clients = await db.crm_entries.count_documents({"company_id": cid, "stage": "client"})
    projects_total = await db.projects.count_documents({"company_id": cid})
    projects_active = await db.projects.count_documents(
        {"company_id": cid, "status": {"$nin": ["concluido", "arquivado"]}}
    )
    team = await db.users.count_documents({"company_id": cid})

    finance = await db.finance.find({"company_id": cid}, {"_id": 0}).to_list(2000)
    receita = sum(f["amount"] for f in finance if f["type"] == "receita" and f["status"] == "pago")
    despesa = sum(f["amount"] for f in finance if f["type"] == "despesa" and f["status"] == "pago")
    receita_prevista = sum(
        f["amount"] for f in finance if f["type"] == "receita" and f["status"] == "pendente"
    )

    agenda_today = await db.agenda.find(
        {"company_id": cid, "start": {"$regex": f"^{today}"}}, {"_id": 0}
    ).to_list(50)

    timeline = await db.timeline.find({"company_id": cid}, {"_id": 0}).sort("created_at", -1).to_list(20)

    # CRM funnel
    funnel = {}
    for stage in ["lead", "contact", "proposal", "negotiation", "client"]:
        funnel[stage] = await db.crm_entries.count_documents({"company_id": cid, "stage": stage})

    # Projects by status
    proj_status = {}
    for p in await db.projects.find({"company_id": cid}, {"_id": 0, "status": 1}).to_list(1000):
        s = p.get("status", "novo")
        proj_status[s] = proj_status.get(s, 0) + 1

    return {
        "crm": {"total": crm_total, "clients": crm_clients, "funnel": funnel},
        "projects": {"total": projects_total, "active": projects_active, "by_status": proj_status},
        "team": team,
        "finance": {
            "receita": receita,
            "despesa": despesa,
            "saldo": receita - despesa,
            "receita_prevista": receita_prevista,
        },
        "agenda_today": agenda_today,
        "timeline": timeline,
    }


# -----------------------------------------------------------------------------
# NOTIFICATIONS
# -----------------------------------------------------------------------------
@api.get("/notifications")
async def list_notifications(user=Depends(get_current_user)):
    items = (
        await db.notifications.find(
            {"company_id": user["company_id"], "user_id": user["id"]}, {"_id": 0}
        )
        .sort("created_at", -1)
        .to_list(100)
    )
    return items


@api.post("/notifications/{notif_id}/read")
async def mark_read(notif_id: str, user=Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notif_id, "user_id": user["id"]}, {"$set": {"read": True}}
    )
    return {"ok": True}


# -----------------------------------------------------------------------------
# GLOBAL SEARCH
# -----------------------------------------------------------------------------
@api.get("/search")
async def global_search(q: str, user=Depends(get_current_user)):
    cid = user["company_id"]
    q_lower = q.lower()
    results = []
    for coll, label in [
        ("crm_entries", "CRM"),
        ("projects", "Projeto"),
        ("agenda", "Agenda"),
        ("finance", "Financeiro"),
    ]:
        docs = await db[coll].find({"company_id": cid}, {"_id": 0}).to_list(500)
        for d in docs:
            blob = " ".join(str(v) for v in d.values() if isinstance(v, (str, int, float))).lower()
            if q_lower in blob:
                results.append(
                    {
                        "entity": label,
                        "id": d["id"],
                        "title": d.get("name") or d.get("title") or d.get("description", "")[:60],
                    }
                )
                if len(results) > 30:
                    break
    return results


# -----------------------------------------------------------------------------
# AI ASSISTANT (Gemini 3.1 Pro Preview)
# -----------------------------------------------------------------------------
@api.post("/ai/chat")
async def ai_chat(req: AIChatReq, user=Depends(get_current_user)):
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone

    session_id = req.session_id or f"{user['id']}-default"

    # build context from user data
    cid = user["company_id"]
    company = await db.companies.find_one({"id": cid}, {"_id": 0})
    projects_count = await db.projects.count_documents({"company_id": cid})
    crm_count = await db.crm_entries.count_documents({"company_id": cid})

    system = (
        f"Você é o assistente IA do NexaHub, integrado à empresa '{company.get('name')}' "
        f"(segmento: {company.get('segment')}). "
        f"O usuário é {user.get('name')} (perfil: {user.get('role')}). "
        f"Contexto atual: {projects_count} projetos, {crm_count} contatos no CRM. "
        "Responda em português, de forma clara, executiva e proativa. "
        "Ajude com: criação de tarefas, projetos, pautas, relatórios, resumos, "
        "ideias de gestão e análise de produtividade."
    )

    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=session_id,
        system_message=system,
    ).with_model("gemini", "gemini-3.1-pro-preview")

    async def event_gen():
        try:
            async for ev in chat.stream_message(UserMessage(text=req.message)):
                if isinstance(ev, TextDelta):
                    yield f"data: {ev.content}\n\n"
                elif isinstance(ev, StreamDone):
                    yield "data: [DONE]\n\n"
                    break
        except Exception as e:
            logger.exception("AI chat error")
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@api.post("/ai/chat-sync")
async def ai_chat_sync(req: AIChatReq, user=Depends(get_current_user)):
    """Non-streaming endpoint for simpler clients."""
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    session_id = req.session_id or f"{user['id']}-default"
    cid = user["company_id"]
    company = await db.companies.find_one({"id": cid}, {"_id": 0})

    system = (
        f"Você é o assistente IA do NexaHub para a empresa '{company.get('name')}'. "
        f"Usuário: {user.get('name')} ({user.get('role')}). Responda em português."
    )
    chat = LlmChat(
        api_key=os.environ["EMERGENT_LLM_KEY"],
        session_id=session_id,
        system_message=system,
    ).with_model("gemini", "gemini-3.1-pro-preview")

    try:
        text = await chat.send_message(UserMessage(text=req.message))
        return {"reply": text, "session_id": session_id}
    except Exception as e:
        logger.exception("AI chat sync error")
        raise HTTPException(status_code=500, detail=f"Erro IA: {str(e)}")


# -----------------------------------------------------------------------------
# TIMELINE
# -----------------------------------------------------------------------------
@api.get("/timeline")
async def get_timeline(user=Depends(get_current_user)):
    items = (
        await db.timeline.find({"company_id": user["company_id"]}, {"_id": 0})
        .sort("created_at", -1)
        .to_list(200)
    )
    return items


# -----------------------------------------------------------------------------
# TRASH
# -----------------------------------------------------------------------------
@api.get("/trash")
async def list_trash(user=Depends(get_current_user)):
    items = (
        await db.trash.find({"company_id": user["company_id"]}, {"_id": 0})
        .sort("deleted_at", -1)
        .to_list(500)
    )
    return items


@api.post("/trash/{trash_id}/restore")
async def restore_trash(trash_id: str, user=Depends(get_current_user)):
    item = await db.trash.find_one({"id": trash_id, "company_id": user["company_id"]}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Não encontrado")
    await db[item["original_collection"]].insert_one(item["data"])
    await db.trash.delete_one({"id": trash_id})
    return {"ok": True}


@api.delete("/trash/{trash_id}")
async def permanent_delete(trash_id: str, user=Depends(get_current_user)):
    await db.trash.delete_one({"id": trash_id, "company_id": user["company_id"]})
    return {"ok": True}


# -----------------------------------------------------------------------------
# Health
# -----------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"name": "NexaHub API", "status": "ok"}


# -----------------------------------------------------------------------------
# Startup
# -----------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("company_id")
    await db.companies.create_index("id", unique=True)
    for coll in ["crm_entries", "projects", "agenda", "finance", "modules", "timeline", "notifications", "trash"]:
        await db[coll].create_index("company_id")
        await db[coll].create_index("id")
    logger.info("NexaHub API started")


@app.on_event("shutdown")
async def shutdown():
    client.close()


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
