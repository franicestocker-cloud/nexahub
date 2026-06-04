const SUPABASE_URL = "https://ahfuhqpnnzsupmvsqfjq.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_s2n_2nEk-iLde8dwp4si1w_5SDtuh-8";
const STATE_TABLE = "nexahub_state";

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer:"return=representation",,
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    console.error("Erro Supabase:", await response.text());
    throw new Error("Erro ao conectar com Supabase");
  }

  return response;
}

async function carregarBanco() {
  const response = await supabaseRequest(`${STATE_TABLE}?id=eq.main&select=data`);
  const rows = await response.json();

  if (rows.length) return rows[0].data;

  await supabaseRequest(STATE_TABLE, {
    method: "POST",
    body: JSON.stringify({ id: "main", data: seed })
  });

  return seed;
}

async function salvarBanco() {
  await supabaseRequest(`${STATE_TABLE}?id=eq.main`, {
    method: "PATCH",
    body: JSON.stringify({
      data: db,
      updated_at: new Date().toISOString()
    })
  });
}
const seed = {
  currentClient: "Dra. Ana",
  clients: [
    {id:1,name:"Dra. Ana", specialty:"Dermatologia", atendimento:"Juliana", redator:"Pedro", designer:"Marina", editor:"Caio"},
    {id:2,name:"Dr. João", specialty:"Otorrino", atendimento:"Juliana", redator:"Pedro", designer:"Bruna", editor:"Caio"},
    {id:3,name:"Dra. Cláudia", specialty:"Vascular", atendimento:"Renata", redator:"Lívia", designer:"Marina", editor:"Rafael"},
    {id:4,name:"Dra. Maria", specialty:"Pediatria", atendimento:"Renata", redator:"Lívia", designer:"Bruna", editor:"Rafael"}
  ],
  slots: [
    {id:1,date:"2026-06-10",time:"09:00",type:"Gravação",place:"Clínica",status:"Livre"},
    {id:2,date:"2026-06-12",time:"14:00",type:"Reunião",place:"Online",status:"Livre"},
    {id:3,date:"2026-07-08",time:"09:00",type:"Gravação",place:"Estúdio",status:"Livre"},
    {id:4,date:"2026-07-22",time:"15:00",type:"Reunião",place:"Online",status:"Livre"},
    {id:5,date:"2026-08-12",time:"10:00",type:"Gravação",place:"Clínica",status:"Livre"}
  ],
  bookings: [
    {id:1,client:"Dra. Ana",date:"2026-06-05",time:"10:00",type:"Gravação",place:"Clínica"},
    {id:2,client:"Dr. João",date:"2026-06-18",time:"14:00",type:"Reunião",place:"Online"}
  ],
  docs: [
    {id:1,client:"Dra. Ana",month:"Junho",title:"Pauta 01 - Botox preventivo",status:"Em redação",owner:"Pedro",body:"Tema: Botox preventivo\nObjetivo: atrair pacientes que querem prevenção\nGancho: Você acha que Botox é só para rugas?\nRoteiro:\nLegenda:\nCTA:"},
    {id:2,client:"Dra. Ana",month:"Julho",title:"Pauta 02 - Melasma",status:"Aguardando revisão",owner:"Pedro",body:"Tema: Melasma\nObjetivo: educar sobre tratamento contínuo\nGancho:\nRoteiro:\nLegenda:\nCTA:"},
    {id:3,client:"Dr. João",month:"Junho",title:"Pauta 01 - Respiração nasal",status:"Planejamento",owner:"Pedro",body:"Tema: Respiração nasal\nObjetivo:\nGancho:\nRoteiro:\nLegenda:\nCTA:"}
  ],
  arts: [
    {id:1,client:"Dra. Ana",title:"Carrossel Botox Junho",status:"Solicitado",designer:"Marina",comments:[]},
    {id:2,client:"Dra. Ana",title:"Story Agenda Aberta",status:"Aguardando Aprovação",designer:"Marina",comments:["Cliente: trocar a foto principal."]},
    {id:3,client:"Dr. João",title:"Arte Reels Respiração",status:"Aprovado",designer:"Bruna",comments:["Aprovado pelo cliente."]},
    {id:4,client:"Dra. Cláudia",title:"Post Varizes",status:"Em Produção",designer:"Marina",comments:[]}
  ],
  videos: [
    {id:1,client:"Dra. Ana",title:"Brutos Junho - Clínica",status:"Brutos",editor:"Caio"},
    {id:2,client:"Dra. Ana",title:"Reels Botox 01",status:"Em edição",editor:"Caio"},
    {id:3,client:"Dr. João",title:"Reels Respiração",status:"Finalizado",editor:"Caio"},
    {id:4,client:"Dra. Cláudia",title:"Brutos Julho",status:"Brutos",editor:"Rafael"}
  ],
  notifications: [
    {id:1,to:"atendimento",text:"Dra. Ana comentou uma arte: trocar a foto principal.",read:false},
    {id:2,to:"design",text:"Story Agenda Aberta recebeu pedido de ajuste.",read:false},
    {id:3,to:"ceo",text:"Existem 2 aprovações pendentes de clientes.",read:false}
  ]
};

let db = JSON.parse(JSON.stringify(seed));
let role = localStorage.getItem("medflow-role") || "ceo";
let page = "dashboard";
let selectedDoc = db.docs[0]?.id || null;

const roleSelect = document.getElementById("roleSelect");
const menu = document.getElementById("menu");
const content = document.getElementById("content");
const pageTitle = document.getElementById("pageTitle");
const pageSubtitle = document.getElementById("pageSubtitle");

roleSelect.value = role;
roleSelect.addEventListener("change", e => {
  role = e.target.value;
  localStorage.setItem("medflow-role", role);
  page = role === "cliente" ? "portal" : "dashboard";
  render();
});

document.getElementById("resetBtn").onclick = () => {
  localStorage.removeItem("medflow-db");
  db = JSON.parse(JSON.stringify(seed));
  save();
  render();
};

document.getElementById("notifyBtn").onclick = () => {
  document.getElementById("notifyPanel").classList.toggle("hidden");
};

function save(){ salvarBanco(); }
function currentClient(){ return db.currentClient || db.clients[0].name; }
function setClient(name){ db.currentClient = name; save(); render(); }

function visibleClients(){
  if(role === "ceo") return db.clients;
  if(role === "cliente") return db.clients.filter(c=>c.name===currentClient());
  if(role === "atendimento") return db.clients.filter(c=>c.atendimento==="Juliana");
  if(role === "redator" || role === "conteudo") return db.clients.filter(c=>c.redator==="Pedro");
  if(role === "design") return db.clients.filter(c=>c.designer==="Marina");
  if(role === "editor") return db.clients.filter(c=>c.editor==="Caio");
  return db.clients;
}

function visibleClientNames(){ return visibleClients().map(c=>c.name); }
function allowed(item){ return visibleClientNames().includes(item.client); }

function menuItems(){
  if(role === "cliente") return [
    ["portal","Portal do Cliente"],
    ["agenda","Agendar"],
    ["aprovacoes","Aprovações"]
  ];
  return [
    ["dashboard","Dashboard"],
    ["clientes","Clientes"],
    ["agenda","Agenda"],
    ["docs","Pautas / Docs"],
    ["artes","Artes Kanban"],
    ["videos","Vídeos / Brutos"],
    ["notificacoes","Notificações"]
  ];
}

function renderMenu(){
  menu.innerHTML = "";
  menuItems().forEach(([id,label])=>{
    const b = document.createElement("button");
    b.textContent = label;
    b.className = page === id ? "active" : "";
    b.onclick = ()=>{page=id;render();};
    menu.appendChild(b);
  });
}

function renderNotifications(){
  const items = db.notifications.filter(n => n.to === role || role === "ceo");
  document.getElementById("notifyCount").textContent = items.filter(n=>!n.read).length;
  const panel = document.getElementById("notifyPanel");
  panel.innerHTML = items.length ? items.map(n=>`<div class="notify-item">${n.text}</div>`).join("") : "<div class='notify-item'>Sem notificações.</div>";
}

function renderClientTabs(){
  return `<div class="client-tabs">${visibleClients().map(c=>`<button class="${currentClient()===c.name?'active':''}" onclick="setClient('${c.name}')">${c.name}</button>`).join("")}</div>`;
}

function statusBadge(s){
  let cls = "";
  if(["Aprovado","Finalizado","Publicado"].includes(s)) cls="green";
  if(["Aguardando Aprovação","Aguardando revisão","Em edição","Em redação"].includes(s)) cls="yellow";
  if(["Atrasado","Ajuste solicitado"].includes(s)) cls="red";
  return `<span class="badge ${cls}">${s}</span>`;
}

function dashboard(){
  const names = visibleClientNames();
  const docs = db.docs.filter(allowed);
  const arts = db.arts.filter(allowed);
  const videos = db.videos.filter(allowed);
  const bookings = db.bookings.filter(b=>names.includes(b.client));
  pageTitle.textContent = "Dashboard";
  pageSubtitle.textContent = "Visão geral por perfil e carteira de clientes";
  content.innerHTML = `
    <div class="grid">
      <div class="card metric"><h3>Clientes visíveis</h3><strong>${names.length}</strong></div>
      <div class="card metric"><h3>Pautas / Docs</h3><strong>${docs.length}</strong></div>
      <div class="card metric"><h3>Artes</h3><strong>${arts.length}</strong></div>
      <div class="card metric"><h3>Vídeos</h3><strong>${videos.length}</strong></div>
    </div>
    <div class="two">
      <div class="card">
        <h3>Próximos agendamentos</h3>
        ${table(bookings, ["client","date","time","type","place"], ["Cliente","Data","Hora","Tipo","Local"])}
      </div>
      <div class="card">
        <h3>Fluxo da operação</h3>
        <p class="small">Cliente agenda → Atendimento recebe → Conteúdo planeja → Redator escreve → Design cria → Editor edita → Cliente aprova.</p>
        <hr/>
        <p><b>Permissão atual:</b> ${role}</p>
        <p class="small">Troque o perfil no menu lateral para testar os acessos.</p>
      </div>
    </div>
  `;
}

function table(rows, keys, labels){
  if(!rows.length) return "<p class='small'>Nenhum registro encontrado.</p>";
  return `<table class="table"><thead><tr>${labels.map(l=>`<th>${l}</th>`).join("")}</tr></thead><tbody>
    ${rows.map(r=>`<tr>${keys.map(k=>`<td>${r[k]||""}</td>`).join("")}</tr>`).join("")}
  </tbody></table>`;
}

function clientes(){
  pageTitle.textContent = "Clientes";
  pageSubtitle.textContent = "Cada setor enxerga apenas os clientes atribuídos";
  content.innerHTML = `
    <div class="card">
      <div class="actions"><button class="btn" onclick="openClientModal()">+ Novo cliente</button></div><br/>
      ${table(visibleClients(), ["name","specialty","atendimento","redator","designer","editor"], ["Cliente","Especialidade","Atendimento","Redator","Designer","Editor"])}
    </div>
  `;
}

function agenda(){
  pageTitle.textContent = role === "cliente" ? "Agendar gravação ou reunião" : "Agenda";
  pageSubtitle.textContent = role === "cliente" ? "Escolha apenas datas liberadas pela agência" : "Visualização interna estilo Google Agenda";
  const names = visibleClientNames();
  if(role === "cliente"){
    content.innerHTML = `<div class="card"><h3>Datas disponíveis</h3>
      <p class="small">A cliente só visualiza horários liberados. Ao marcar, todos os setores responsáveis são notificados.</p>
      ${db.slots.filter(s=>s.status==="Livre").map(s=>`
        <div class="card" style="margin-bottom:10px">
          <b>${s.date} às ${s.time}</b><br/>
          <span class="small">${s.type} - ${s.place}</span><br/><br/>
          <button class="btn" onclick="bookSlot(${s.id})">Marcar horário</button>
        </div>
      `).join("")}
    </div>`;
    return;
  }
  const bookings = db.bookings.filter(b=>names.includes(b.client));
  const days = [];
  for(let i=1;i<=30;i++) days.push(String(i).padStart(2,"0"));
  content.innerHTML = `<div class="card">
    <div class="actions"><button class="btn" onclick="openBookingModal()">+ Novo agendamento interno</button></div><br/>
    <div class="calendar">
      ${days.map(d=>{
        const date = `2026-06-${d}`;
        const evs = bookings.filter(b=>b.date===date);
        return `<div class="day"><b>${d}/06</b>${evs.map(e=>`<div class="event ${e.type==='Reunião'?'meet':''}">${e.time} ${e.client}<br>${e.type}</div>`).join("")}</div>`
      }).join("")}
    </div>
  </div>`;
}

function bookSlot(id){
  const slot = db.slots.find(s=>s.id===id);
  const client = currentClient();
  db.bookings.push({id:Date.now(),client,date:slot.date,time:slot.time,type:slot.type,place:slot.place});
  slot.status = "Ocupado";
  db.notifications.push({id:Date.now()+1,to:"atendimento",text:`${client} marcou ${slot.type} para ${slot.date} às ${slot.time}.`,read:false});
  db.notifications.push({id:Date.now()+2,to:"conteudo",text:`${client} tem novo agendamento. Planejar pautas do mês.`,read:false});
  db.notifications.push({id:Date.now()+3,to:"ceo",text:`Novo agendamento: ${client}, ${slot.date} às ${slot.time}.`,read:false});
  save(); render();
}

function docs(){
  pageTitle.textContent = "Pautas / Docs";
  pageSubtitle.textContent = "Rede de conteúdo cria o direcionamento e redator escreve roteiro e legenda";
  const docs = db.docs.filter(allowed);
  if(!docs.find(d=>d.id===selectedDoc)) selectedDoc = docs[0]?.id;
  const doc = docs.find(d=>d.id===selectedDoc);
  content.innerHTML = `
    ${renderClientTabs()}
    <div class="actions"><button class="btn" onclick="newDoc()">+ Nova pauta</button></div><br/>
    <div class="doc-editor">
      <div class="doc-list">
        ${docs.map(d=>`<button class="${d.id===selectedDoc?'active':''}" onclick="selectedDoc=${d.id};render()"><b>${d.title}</b><br><span class="small">${d.client} • ${d.month} • ${d.status}</span></button>`).join("")}
      </div>
      <div class="card">
        ${doc ? `
          <label>Título</label><input value="${escapeHtml(doc.title)}" onchange="updateDoc(${doc.id},'title',this.value)"/><br/><br/>
          <label>Status</label><input value="${escapeHtml(doc.status)}" onchange="updateDoc(${doc.id},'status',this.value)"/><br/><br/>
          <label>Conteúdo</label><textarea onchange="updateDoc(${doc.id},'body',this.value)">${escapeHtml(doc.body)}</textarea><br/><br/>
          <button class="btn" onclick="notifyDoc(${doc.id})">Notificar responsável</button>
        ` : "<p>Nenhuma pauta encontrada.</p>"}
      </div>
    </div>
  `;
}

function updateDoc(id,key,val){
  const d=db.docs.find(x=>x.id===id); d[key]=val; save();
}
function notifyDoc(id){
  const d=db.docs.find(x=>x.id===id);
  db.notifications.push({id:Date.now(),to:"redator",text:`Nova atualização na pauta ${d.title} de ${d.client}.`,read:false});
  db.notifications.push({id:Date.now()+1,to:"atendimento",text:`Pauta atualizada para ${d.client}: ${d.title}.`,read:false});
  save(); renderNotifications(); alert("Notificação enviada.");
}
function newDoc(){
  const client=currentClient();
  const id=Date.now();
  db.docs.push({id,client,month:"Novo mês",title:"Nova pauta",status:"Planejamento",owner:"",body:"Tema:\nObjetivo:\nGancho:\nRoteiro:\nLegenda:\nCTA:"});
  selectedDoc=id; save(); render();
}

function artes(){
  pageTitle.textContent = "Artes Kanban";
  pageSubtitle.textContent = "Somente a parte de artes funciona estilo Trello, com aprovação e comentários";
  const cols = ["Solicitado","Em Produção","Revisão Interna","Aguardando Aprovação","Ajustes Solicitados","Aprovado"];
  const arts = db.arts.filter(allowed).filter(a => role==="cliente" ? a.client===currentClient() : true);
  content.innerHTML = `
    ${role!=="cliente" ? renderClientTabs() : ""}
    <div class="actions"><button class="btn" onclick="newArt()">+ Nova arte</button></div><br/>
    <div class="kanban">
      ${cols.map(col=>`
        <div class="column">
          <h3>${col}</h3>
          ${arts.filter(a=>a.status===col).map(a=>artCard(a)).join("")}
        </div>
      `).join("")}
    </div>
  `;
}

function artCard(a){
  const controls = role==="cliente"
    ? `<button class="btn light" onclick="commentArt(${a.id})">Comentar</button><button class="btn" onclick="approveArt(${a.id})">Aprovar</button>`
    : `<select onchange="moveArt(${a.id},this.value)">
         ${["Solicitado","Em Produção","Revisão Interna","Aguardando Aprovação","Ajustes Solicitados","Aprovado"].map(s=>`<option ${a.status===s?'selected':''}>${s}</option>`).join("")}
       </select>
       <br/><br/><button class="btn light" onclick="downloadMock('${a.title}')">Baixar arte</button>`;
  return `<div class="art-card">
    <div class="art-thumb">Preview da arte</div>
    <b>${a.title}</b><br/>
    <span class="small">${a.client} • ${a.designer}</span><br/><br/>
    ${controls}
    <div class="small" style="margin-top:10px">${a.comments.map(c=>`💬 ${c}`).join("<br>")}</div>
  </div>`;
}
function moveArt(id,status){
  const a=db.arts.find(x=>x.id===id); a.status=status;
  if(status==="Aguardando Aprovação") db.notifications.push({id:Date.now(),to:"cliente",text:`Nova arte aguardando aprovação: ${a.title}.`,read:false});
  save(); render();
}
function approveArt(id){
  const a=db.arts.find(x=>x.id===id); a.status="Aprovado"; a.comments.push("Cliente aprovou a arte.");
  db.notifications.push({id:Date.now(),to:"design",text:`${a.client} aprovou a arte ${a.title}.`,read:false});
  db.notifications.push({id:Date.now()+1,to:"atendimento",text:`${a.client} aprovou a arte ${a.title}.`,read:false});
  save(); render();
}
function commentArt(id){
  const msg=prompt("Digite o comentário ou ajuste:");
  if(!msg) return;
  const a=db.arts.find(x=>x.id===id); a.status="Ajustes Solicitados"; a.comments.push(`Cliente: ${msg}`);
  db.notifications.push({id:Date.now(),to:"design",text:`${a.client} comentou a arte ${a.title}: ${msg}`,read:false});
  db.notifications.push({id:Date.now()+1,to:"atendimento",text:`${a.client} solicitou ajuste em ${a.title}.`,read:false});
  save(); render();
}
function newArt(){
  db.arts.push({id:Date.now(),client:currentClient(),title:"Nova arte",status:"Solicitado",designer:"",comments:[]});
  save(); render();
}
function downloadMock(title){ alert(`Simulação: baixar arquivo da arte "${title}". Na versão real, aqui baixa PNG/PDF/Canva.`); }

function videos(){
  pageTitle.textContent = "Vídeos / Brutos";
  pageSubtitle.textContent = "Área estilo Drive para brutos, edições e vídeos finalizados";
  const vids = db.videos.filter(allowed).filter(v => role==="cliente" ? v.client===currentClient() : true);
  content.innerHTML = `
    ${role!=="cliente" ? renderClientTabs() : ""}
    <div class="actions"><button class="btn" onclick="newVideo()">+ Adicionar vídeo/bruto</button></div><br/>
    <div class="video-grid">
      ${vids.map(v=>`
        <div class="video-card">
          <div class="video-preview">▶ ${v.status}</div>
          <b>${v.title}</b><br/>
          <span class="small">${v.client} • Editor: ${v.editor}</span><br/><br/>
          ${statusBadge(v.status)}<br/><br/>
          <div class="actions">
            <button class="btn light" onclick="downloadMock('${v.title}')">Baixar</button>
            <button class="btn light" onclick="commentVideo(${v.id})">Comentar</button>
            <button class="btn" onclick="approveVideo(${v.id})">Aprovar</button>
          </div>
        </div>`).join("")}
    </div>
  `;
}
function newVideo(){
  db.videos.push({id:Date.now(),client:currentClient(),title:"Novo vídeo/bruto",status:"Brutos",editor:""});
  db.notifications.push({id:Date.now()+1,to:"editor",text:`Novos brutos adicionados para ${currentClient()}.`,read:false});
  save(); render();
}
function commentVideo(id){
  const v=db.videos.find(x=>x.id===id);
  const msg=prompt("Comentário ou ajuste do vídeo:");
  if(!msg) return;
  db.notifications.push({id:Date.now(),to:"editor",text:`Comentário em ${v.title}: ${msg}`,read:false});
  db.notifications.push({id:Date.now()+1,to:"atendimento",text:`Comentário em vídeo de ${v.client}.`,read:false});
  save(); renderNotifications(); alert("Comentário registrado e notificado.");
}
function approveVideo(id){
  const v=db.videos.find(x=>x.id===id); v.status="Finalizado";
  db.notifications.push({id:Date.now(),to:"editor",text:`${v.client} aprovou o vídeo ${v.title}.`,read:false});
  db.notifications.push({id:Date.now()+1,to:"atendimento",text:`${v.client} aprovou o vídeo ${v.title}.`,read:false});
  save(); render();
}

function aprovacoes(){
  pageTitle.textContent = "Aprovações";
  pageSubtitle.textContent = "Cliente aprova ou comenta artes e vídeos sem usar WhatsApp";
  content.innerHTML = `<div class="two"><div>${artesReturn()}</div><div>${videosReturn()}</div></div>`;
}
function artesReturn(){
  const arts=db.arts.filter(a=>a.client===currentClient() && ["Aguardando Aprovação","Ajustes Solicitados"].includes(a.status));
  return `<div class="card"><h3>Artes pendentes</h3>${arts.map(artCard).join("") || "<p class='small'>Nenhuma arte pendente.</p>"}</div>`;
}
function videosReturn(){
  const vids=db.videos.filter(v=>v.client===currentClient() && v.status!=="Finalizado");
  return `<div class="card"><h3>Vídeos pendentes</h3>${vids.map(v=>`<div class="video-card"><div class="video-preview">▶</div><b>${v.title}</b><br><br><button class="btn light" onclick="commentVideo(${v.id})">Comentar</button> <button class="btn" onclick="approveVideo(${v.id})">Aprovar</button></div>`).join("") || "<p class='small'>Nenhum vídeo pendente.</p>"}</div>`;
}

function portal(){
  pageTitle.textContent = "Portal do Cliente";
  pageSubtitle.textContent = "A cliente acessa somente agenda e aprovações";
  content.innerHTML = `
    <div class="grid">
      <div class="card metric"><h3>Datas disponíveis</h3><strong>${db.slots.filter(s=>s.status==="Livre").length}</strong></div>
      <div class="card metric"><h3>Artes pendentes</h3><strong>${db.arts.filter(a=>a.client===currentClient() && a.status==="Aguardando Aprovação").length}</strong></div>
      <div class="card metric"><h3>Vídeos pendentes</h3><strong>${db.videos.filter(v=>v.client===currentClient() && v.status!=="Finalizado").length}</strong></div>
      <div class="card metric"><h3>Agendamentos</h3><strong>${db.bookings.filter(b=>b.client===currentClient()).length}</strong></div>
    </div>
    <div class="two">
      <div class="card"><h3>Marcar data</h3><p>Escolha gravação ou reunião nos horários liberados pela agência.</p><button class="btn" onclick="page='agenda';render()">Agendar agora</button></div>
      <div class="card"><h3>Aprovações</h3><p>Comente, solicite ajuste ou aprove artes e vídeos.</p><button class="btn" onclick="page='aprovacoes';render()">Ver aprovações</button></div>
    </div>
  `;
}

function notificacoes(){
  pageTitle.textContent = "Notificações";
  pageSubtitle.textContent = "Registro das movimentações entre setores";
  const items=db.notifications.filter(n=>role==="ceo" || n.to===role);
  content.innerHTML = `<div class="card">${items.map(n=>`<div class="notify-item">${n.text}</div>`).join("") || "Sem notificações."}</div>`;
}

function openClientModal(){
  modal(`<h3>Novo cliente</h3>
    <div class="form-grid">
      <div><label>Nome</label><input id="m_name"/></div>
      <div><label>Especialidade</label><input id="m_specialty"/></div>
      <div><label>Atendimento</label><input id="m_atendimento" value="Juliana"/></div>
      <div><label>Redator</label><input id="m_redator" value="Pedro"/></div>
      <div><label>Designer</label><input id="m_designer" value="Marina"/></div>
      <div><label>Editor</label><input id="m_editor" value="Caio"/></div>
    </div><br/>
    <button class="btn" onclick="saveClientModal()">Salvar cliente</button>`);
}
function saveClientModal(){
  db.clients.push({
    id:Date.now(), name:val("m_name"), specialty:val("m_specialty"),
    atendimento:val("m_atendimento"), redator:val("m_redator"), designer:val("m_designer"), editor:val("m_editor")
  });
  closeModal(); save(); render();
}
function openBookingModal(){
  modal(`<h3>Novo agendamento interno</h3>
    <div class="form-grid">
      <div><label>Cliente</label><select id="b_client">${visibleClients().map(c=>`<option>${c.name}</option>`).join("")}</select></div>
      <div><label>Tipo</label><select id="b_type"><option>Gravação</option><option>Reunião</option></select></div>
      <div><label>Data</label><input id="b_date" type="date"/></div>
      <div><label>Hora</label><input id="b_time" type="time"/></div>
      <div class="full"><label>Local</label><input id="b_place" value="Online"/></div>
    </div><br/>
    <button class="btn" onclick="saveBookingModal()">Salvar</button>`);
}
function saveBookingModal(){
  db.bookings.push({id:Date.now(),client:val("b_client"),date:val("b_date"),time:val("b_time"),type:val("b_type"),place:val("b_place")});
  closeModal(); save(); render();
}
function modal(html){
  const div=document.createElement("div");
  div.className="modal-backdrop";
  div.id="modalBackdrop";
  div.innerHTML=`<div class="modal">${html}<br/><br/><button class="btn light" onclick="closeModal()">Fechar</button></div>`;
  document.body.appendChild(div);
}
function closeModal(){ document.getElementById("modalBackdrop")?.remove(); }
function val(id){ return document.getElementById(id).value; }
function escapeHtml(str){ return String(str).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;"); }

function render(){
  renderMenu();
  renderNotifications();

  if(role==="cliente" && !["portal","agenda","aprovacoes"].includes(page))
    page="portal";

  const map={
    dashboard,
    clientes,
    agenda,
    docs,
    artes,
    videos,
    notificacoes,
    portal,
    aprovacoes
  };

  (map[page]||dashboard)();
}

async function init(){
  db = await carregarBanco();
  selectedDoc = db.docs[0]?.id || null;
  render();
}

init();
