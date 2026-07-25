const STORAGE_KEY = "jecKronaPerformanceV1";

const defaultWeights = {
  Ala:       {goal:5, assist:3, shotOn:0.7, shotOff:-0.5, tacklePoss:1.0, tackleNoPoss:0.5, turnover:-1, badPass:-0.8, counter:0.8, foulCommitted:-0.4, foulSuffered:0.3, created:1.4, blocked:0.6},
  Fixo:      {goal:4, assist:2.5, shotOn:0.5, shotOff:-0.4, tacklePoss:1.4, tackleNoPoss:0.9, turnover:-1.1, badPass:-0.9, counter:0.5, foulCommitted:-0.5, foulSuffered:0.2, created:0.8, blocked:1.4},
  Pivô:      {goal:5.5, assist:3, shotOn:0.9, shotOff:-0.6, tacklePoss:0.6, tackleNoPoss:0.3, turnover:-1, badPass:-0.7, counter:0.4, foulCommitted:-0.4, foulSuffered:0.5, created:1.2, blocked:0.5},
  Universal: {goal:4.8, assist:2.8, shotOn:0.7, shotOff:-0.5, tacklePoss:1.1, tackleNoPoss:0.7, turnover:-1, badPass:-0.8, counter:0.7, foulCommitted:-0.4, foulSuffered:0.3, created:1.0, blocked:1.0},
  Goleiro:   {save:0.45, difficultSave:0.85, goalAgainst:-0.8, correctExit:0.5, wrongExit:-0.8, correctDistribution:0.25, wrongDistribution:-0.4, assist:2.5, decisiveError:-1.8, created:0.5, blocked:1.6}
};

let state = loadState();
let pendingInstallPrompt = null;
let deleteAction = null;


function migratePeriods(){
  state.matches=(state.matches||[]).map(m=>({overtimeEnabled:false,...m}));
  state.events=(state.events||[]).map(e=>({period:"1T",...e}));
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
}

function ensureProfessionalRoster(){
  const officialRoster = [{"id": "ogol_vinicius_ferreira", "name": "Vinicius Ferreira", "category": "Adulto", "position": "Goleiro", "number": 0}, {"id": "ogol_matheus_assuncao_1", "name": "Matheus Assunção", "category": "Adulto", "position": "Goleiro", "number": 1}, {"id": "ogol_kleyton_santos_16", "name": "Kleyton Santos", "category": "Adulto", "position": "Goleiro", "number": 16}, {"id": "ogol_davi_23", "name": "Davi", "category": "Adulto", "position": "Goleiro", "number": 23}, {"id": "ogol_henrique_viana_11", "name": "Henrique Viana", "category": "Adulto", "position": "Fixo", "number": 11}, {"id": "ogol_guilherme_pinheiro_14", "name": "Guilherme Pinheiro", "category": "Adulto", "position": "Fixo", "number": 14}, {"id": "ogol_fernando_drasler_17", "name": "Fernando Drasler", "category": "Adulto", "position": "Fixo", "number": 17}, {"id": "ogol_alves_5", "name": "Alves", "category": "Adulto", "position": "Ala", "number": 5}, {"id": "ogol_guilherme_jacinto_6", "name": "Guilherme Jacinto", "category": "Adulto", "position": "Ala", "number": 6}, {"id": "ogol_luisinho_7", "name": "Luisinho", "category": "Adulto", "position": "Ala", "number": 7}, {"id": "ogol_kevin_farias_8", "name": "Kevin Farias", "category": "Adulto", "position": "Ala", "number": 8}, {"id": "ogol_robinho_10", "name": "Robinho", "category": "Adulto", "position": "Ala", "number": 10}, {"id": "ogol_braian_13", "name": "Braian", "category": "Adulto", "position": "Ala", "number": 13}, {"id": "ogol_rafael_henmi_18", "name": "Rafael Henmi", "category": "Adulto", "position": "Ala", "number": 18}, {"id": "ogol_pedro_rei_19", "name": "Pedro Rei", "category": "Adulto", "position": "Ala", "number": 19}, {"id": "ogol_xuxa_20", "name": "Xuxa", "category": "Adulto", "position": "Ala", "number": 20}, {"id": "ogol_ze_33", "name": "Zé", "category": "Adulto", "position": "Ala", "number": 33}, {"id": "ogol_leo_cunha_33", "name": "Léo Cunha", "category": "Adulto", "position": "Ala", "number": 33}, {"id": "ogol_ryan_44", "name": "Ryan", "category": "Adulto", "position": "Ala", "number": 44}, {"id": "ogol_dieguinho_71", "name": "Dieguinho", "category": "Adulto", "position": "Ala", "number": 71}, {"id": "ogol_jacare_25", "name": "Jacaré", "category": "Adulto", "position": "Pivô", "number": 25}, {"id": "ogol_elano_44", "name": "Elano", "category": "Adulto", "position": "Pivô", "number": 44}, {"id": "ogol_guilherme_de_nez_99", "name": "Guilherme de Nez", "category": "Adulto", "position": "Pivô", "number": 99}, {"id": "ogol_felipe_rufino_9", "name": "Felipe Rufino", "category": "Adulto", "position": "Pivô", "number": 9}, {"id": "ogol_caio_26", "name": "Caio", "category": "Adulto", "position": "Pivô", "number": 26}];
  const officialIds = new Set(officialRoster.map(p=>p.id));
  const referencedIds = new Set([
    ...Object.values(state.stats||{}).flat().map(s=>s.playerId),
    ...(state.events||[]).map(e=>e.playerId)
  ]);

  // Mantém atletas antigos apenas quando já possuem estatísticas ou ações registradas.
  const historicalPlayers = (state.players||[]).filter(p=>!officialIds.has(p.id) && referencedIds.has(p.id))
    .map(p=>({...p,historical:true}));

  state.players = [...officialRoster, ...historicalPlayers];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}


const defaultOfficialCalendar = [{"id": "official_2026_07_25_umuarama", "date": "2026-07-25", "time": "19:30", "opponent": "Umuarama", "competition": "LNF", "venue": "Casa", "homeTeam": "JEC/Krona", "awayTeam": "Umuarama", "location": "Centreventos Cau Hansen"}, {"id": "official_2026_07_29_cascavel", "date": "2026-07-29", "time": "19:15", "opponent": "Cascavel", "competition": "LNF", "venue": "Fora", "homeTeam": "Cascavel", "awayTeam": "JEC/Krona", "location": "Cascavel/PR"}, {"id": "official_2026_08_02_sao_caetano", "date": "2026-08-02", "time": "11:00", "opponent": "São Caetano", "competition": "Copa LNF", "venue": "Fora", "homeTeam": "São Caetano", "awayTeam": "JEC/Krona", "location": "São Caetano do Sul/SP"}, {"id": "official_2026_08_08_minas", "date": "2026-08-08", "time": "19:00", "opponent": "Minas", "competition": "LNF", "venue": "Fora", "homeTeam": "Minas", "awayTeam": "JEC/Krona", "location": "Belo Horizonte/MG"}, {"id": "official_2026_08_11_traipu", "date": "2026-08-11", "time": "20:00", "opponent": "Traipu/AL", "competition": "Copa do Brasil", "venue": "Casa", "homeTeam": "JEC/Krona", "awayTeam": "Traipu/AL", "location": "Centreventos Cau Hansen"}];

function freshState(){
  return {calendarSync:{feedUrl:"",intervalHours:6,lastSync:null,lastResult:""},officialCalendar:structuredClone(defaultOfficialCalendar),events:[],players:[{"id": "ogol_vinicius_ferreira", "name": "Vinicius Ferreira", "category": "Adulto", "position": "Goleiro", "number": 0}, {"id": "ogol_matheus_assuncao_1", "name": "Matheus Assunção", "category": "Adulto", "position": "Goleiro", "number": 1}, {"id": "ogol_kleyton_santos_16", "name": "Kleyton Santos", "category": "Adulto", "position": "Goleiro", "number": 16}, {"id": "ogol_davi_23", "name": "Davi", "category": "Adulto", "position": "Goleiro", "number": 23}, {"id": "ogol_henrique_viana_11", "name": "Henrique Viana", "category": "Adulto", "position": "Fixo", "number": 11}, {"id": "ogol_guilherme_pinheiro_14", "name": "Guilherme Pinheiro", "category": "Adulto", "position": "Fixo", "number": 14}, {"id": "ogol_fernando_drasler_17", "name": "Fernando Drasler", "category": "Adulto", "position": "Fixo", "number": 17}, {"id": "ogol_alves_5", "name": "Alves", "category": "Adulto", "position": "Ala", "number": 5}, {"id": "ogol_guilherme_jacinto_6", "name": "Guilherme Jacinto", "category": "Adulto", "position": "Ala", "number": 6}, {"id": "ogol_luisinho_7", "name": "Luisinho", "category": "Adulto", "position": "Ala", "number": 7}, {"id": "ogol_kevin_farias_8", "name": "Kevin Farias", "category": "Adulto", "position": "Ala", "number": 8}, {"id": "ogol_robinho_10", "name": "Robinho", "category": "Adulto", "position": "Ala", "number": 10}, {"id": "ogol_braian_13", "name": "Braian", "category": "Adulto", "position": "Ala", "number": 13}, {"id": "ogol_rafael_henmi_18", "name": "Rafael Henmi", "category": "Adulto", "position": "Ala", "number": 18}, {"id": "ogol_pedro_rei_19", "name": "Pedro Rei", "category": "Adulto", "position": "Ala", "number": 19}, {"id": "ogol_xuxa_20", "name": "Xuxa", "category": "Adulto", "position": "Ala", "number": 20}, {"id": "ogol_ze_33", "name": "Zé", "category": "Adulto", "position": "Ala", "number": 33}, {"id": "ogol_leo_cunha_33", "name": "Léo Cunha", "category": "Adulto", "position": "Ala", "number": 33}, {"id": "ogol_ryan_44", "name": "Ryan", "category": "Adulto", "position": "Ala", "number": 44}, {"id": "ogol_dieguinho_71", "name": "Dieguinho", "category": "Adulto", "position": "Ala", "number": 71}, {"id": "ogol_jacare_25", "name": "Jacaré", "category": "Adulto", "position": "Pivô", "number": 25}, {"id": "ogol_elano_44", "name": "Elano", "category": "Adulto", "position": "Pivô", "number": 44}, {"id": "ogol_guilherme_de_nez_99", "name": "Guilherme de Nez", "category": "Adulto", "position": "Pivô", "number": 99}, {"id": "ogol_felipe_rufino_9", "name": "Felipe Rufino", "category": "Adulto", "position": "Pivô", "number": 9}, {"id": "ogol_caio_26", "name": "Caio", "category": "Adulto", "position": "Pivô", "number": 26}],matches:[],stats:{},weights:structuredClone(defaultWeights)};
}
function loadState(){
  try{
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed ? {...freshState(), ...parsed, calendarSync:{feedUrl:"",intervalHours:6,lastSync:null,lastResult:"",...(parsed.calendarSync||{})}, officialCalendar:parsed.officialCalendar||structuredClone(defaultOfficialCalendar), events:parsed.events||[], weights:{...structuredClone(defaultWeights), ...(parsed.weights||{})}} : freshState();
  }catch{return freshState();}
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); renderAll(); }
function uid(prefix){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`; }
function fmt(n,d=2){ return Number(n||0).toLocaleString("pt-BR",{minimumFractionDigits:d,maximumFractionDigits:d}); }
function toast(msg){const el=document.querySelector("#toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2200);}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[c]));}

document.querySelectorAll(".tab").forEach(btn=>btn.addEventListener("click",()=>{
  document.querySelectorAll(".tab,.view").forEach(el=>el.classList.remove("active"));
  btn.classList.add("active");
  document.querySelector(`#${btn.dataset.view}`).classList.add("active");
}));

document.querySelector("#newPlayerBtn").onclick=()=>toggleForm("playerForm",true);
document.querySelector("#cancelPlayerBtn").onclick=()=>resetPlayerForm();
document.querySelector("#newMatchBtn").onclick=()=>toggleForm("matchForm",true);
document.querySelector("#cancelMatchBtn").onclick=()=>resetMatchForm();

function toggleForm(id,show){ document.querySelector(`#${id}`).classList.toggle("hidden",!show); }

document.querySelector("#playerForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=document.querySelector("#playerId").value;
  const player={id:id||uid("p"),name:document.querySelector("#playerName").value.trim(),
    category:document.querySelector("#playerCategory").value,position:document.querySelector("#playerPosition").value,
    number:Number(document.querySelector("#playerNumber").value||0)};
  if(!player.name)return;
  const idx=state.players.findIndex(p=>p.id===id);
  idx>=0?state.players[idx]=player:state.players.push(player);
  resetPlayerForm();saveState();toast("Atleta salvo.");
});
function resetPlayerForm(){
  document.querySelector("#playerForm").reset();document.querySelector("#playerId").value="";
  toggleForm("playerForm",false);
}
function editPlayer(id){
  const p=state.players.find(x=>x.id===id);if(!p)return;
  document.querySelector("#playerId").value=p.id;document.querySelector("#playerName").value=p.name;
  document.querySelector("#playerCategory").value=p.category;document.querySelector("#playerPosition").value=p.position;
  document.querySelector("#playerNumber").value=p.number;toggleForm("playerForm",true);
}
function removePlayer(id){
  confirmDelete("Excluir este atleta e todas as estatísticas dele?",()=>{
    state.players=state.players.filter(p=>p.id!==id);
    Object.values(state.stats).forEach(list=>{const i=list.findIndex(s=>s.playerId===id);if(i>=0)list.splice(i,1);});
    saveState();
  });
}

document.querySelector("#matchForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=document.querySelector("#matchId").value;
  const match={id:id||uid("m"),date:document.querySelector("#matchDate").value,
    opponent:document.querySelector("#matchOpponent").value.trim(),
    competition:document.querySelector("#matchCompetition").value.trim(),
    round:document.querySelector("#matchRound").value.trim(),
    goalsFor:Number(document.querySelector("#matchGoalsFor").value||0),
    goalsAgainst:Number(document.querySelector("#matchGoalsAgainst").value||0)};
  const idx=state.matches.findIndex(m=>m.id===id);idx>=0?state.matches[idx]=match:state.matches.push(match);
  resetMatchForm();saveState();toast("Partida salva.");
});
function resetMatchForm(){document.querySelector("#matchForm").reset();document.querySelector("#matchId").value="";toggleForm("matchForm",false);}
function editMatch(id){
  const m=state.matches.find(x=>x.id===id);if(!m)return;
  ["Date","Opponent","Competition","Round","GoalsFor","GoalsAgainst"].forEach(k=>{
    document.querySelector(`#match${k}`).value=m[k.charAt(0).toLowerCase()+k.slice(1)]??"";
  });
  document.querySelector("#matchId").value=m.id;toggleForm("matchForm",true);
}
function removeMatch(id){
  confirmDelete("Excluir esta partida e suas estatísticas?",()=>{state.matches=state.matches.filter(m=>m.id!==id);delete state.stats[id];saveState();});
}
function confirmDelete(text,fn){deleteAction=fn;document.querySelector("#confirmText").textContent=text;document.querySelector("#confirmDialog").showModal();}
document.querySelector("#confirmDialog").addEventListener("close",e=>{if(e.target.returnValue==="confirm"&&deleteAction)deleteAction();deleteAction=null;});

function lineFields(){
  return [
    ["minutes","Min"],["shotOn","Chute gol"],["shotOff","Chute fora"],["tacklePoss","Desarme c/ posse"],
    ["tackleNoPoss","Desarme s/ posse"],["turnover","Perda posse"],["badPass","Passe errado"],
    ["counter","Contra-ataque"],["goal","Gols"],["assist","Assist."],["foulCommitted","Faltas com."],
    ["foulSuffered","Faltas sofr."],["created","Chances criadas"],["blocked","Chances bloqueadas"]
  ];
}
function keeperFields(){
  return [
    ["minutes","Min"],["save","Defesas"],["difficultSave","Defesas difíceis"],["goalAgainst","Gols sofridos"],
    ["correctExit","Saídas certas"],["wrongExit","Saídas erradas"],["correctDistribution","Reposições certas"],
    ["wrongDistribution","Reposições erradas"],["assist","Assist."],["decisiveError","Erros decisivos"],
    ["created","Chances criadas"],["blocked","Chances bloqueadas"]
  ];
}
function getStat(matchId,playerId){
  return (state.stats[matchId]||[]).find(s=>s.playerId===playerId)||{playerId};
}
function calcRating(player,stat){
  const w=state.weights[player.position]||{};
  let raw=0;
  Object.entries(w).forEach(([key,weight])=>raw+=(Number(stat[key])||0)*Number(weight||0));
  const minutes=Math.max(1,Number(stat.minutes)||1);
  const normalized=raw*(40/Math.min(40,minutes));
  return Math.max(0,Math.min(10,6+normalized/5));
}
function renderStatsTables(){
  const matchId=document.querySelector("#statsMatchSelect").value;
  renderStatTable("#lineStatsTable",state.players.filter(p=>p.position!=="Goleiro"),lineFields(),matchId);
  renderStatTable("#keeperStatsTable",state.players.filter(p=>p.position==="Goleiro"),keeperFields(),matchId);
}
function renderStatTable(selector,players,fields,matchId){
  const table=document.querySelector(selector);
  if(!matchId){table.innerHTML="<tbody><tr><td>Cadastre e selecione uma partida.</td></tr></tbody>";return;}
  const head=`<thead><tr><th>Atleta</th><th>Posição</th>${fields.map(f=>`<th>${f[1]}</th>`).join("")}<th>Rating</th></tr></thead>`;
  const rows=players.map(p=>{
    const s=getStat(matchId,p.id),rating=calcRating(p,s);
    return `<tr data-player="${p.id}">
      <td>${esc(p.name)}</td><td>${esc(p.position)}</td>
      ${fields.map(([key])=>`<td><input type="number" min="0" step="1" data-field="${key}" value="${Number(s[key]||0)}"></td>`).join("")}
      <td class="rating-cell ${rating>=7?"rating-good":rating>=5.5?"rating-mid":"rating-low"}">${fmt(rating)}</td>
    </tr>`;
  }).join("");
  table.innerHTML=head+`<tbody>${rows||'<tr><td colspan="20">Nenhum atleta nesta categoria.</td></tr>'}</tbody>`;
  table.querySelectorAll("input").forEach(inp=>inp.addEventListener("input",()=>{
    const row=inp.closest("tr"),p=state.players.find(x=>x.id===row.dataset.player);
    const temp={...getStat(matchId,p.id)};row.querySelectorAll("input").forEach(i=>temp[i.dataset.field]=Number(i.value||0));
    const rating=calcRating(p,temp),cell=row.querySelector(".rating-cell");cell.textContent=fmt(rating);
    cell.className=`rating-cell ${rating>=7?"rating-good":rating>=5.5?"rating-mid":"rating-low"}`;
  }));
}
document.querySelector("#statsMatchSelect").addEventListener("change",renderStatsTables);
document.querySelector("#saveStatsBtn").onclick=()=>{
  const matchId=document.querySelector("#statsMatchSelect").value;if(!matchId)return toast("Selecione uma partida.");
  const entries=[];
  document.querySelectorAll("#lineStatsTable tbody tr[data-player],#keeperStatsTable tbody tr[data-player]").forEach(row=>{
    const s={playerId:row.dataset.player};row.querySelectorAll("input").forEach(i=>s[i.dataset.field]=Number(i.value||0));entries.push(s);
  });
  state.stats[matchId]=entries;saveState();toast("Estatísticas salvas.");
};

function aggregatePlayer(player){
  const entries=Object.values(state.stats).flat().filter(s=>s.playerId===player.id);
  const total={matches:entries.length,minutes:0,goal:0,assist:0,created:0,blocked:0,ratings:[]};
  entries.forEach(s=>{
    total.minutes+=Number(s.minutes||0);total.goal+=Number(s.goal||0);total.assist+=Number(s.assist||0);
    total.created+=Number(s.created||0);total.blocked+=Number(s.blocked||0);total.ratings.push(calcRating(player,s));
  });
  total.average=total.ratings.length?total.ratings.reduce((a,b)=>a+b,0)/total.ratings.length:0;
  return total;
}
function renderPlayers(){
  const wrap=document.querySelector("#playersByPosition");const positions=["Goleiro","Fixo","Ala","Pivô","Universal"];
  wrap.innerHTML=positions.map(pos=>{
    const list=state.players.filter(p=>p.position===pos);
    return `<section class="position-section"><h3 class="position-title">${pos}<span class="position-pill">${list.length}</span></h3>
      <div class="player-grid">${list.map(p=>`<article class="player-card"><div><strong>#${p.number||"-"} ${esc(p.name)}</strong>
      <small>${esc(p.category)} • ${esc(p.position)}${p.historical?" • Histórico":""}</small></div><div class="icon-actions">
      <button class="icon-btn" onclick="editPlayer('${p.id}')">Editar</button>
      <button class="icon-btn" onclick="removePlayer('${p.id}')">Excluir</button></div></article>`).join("")||'<div class="empty-state">Nenhum atleta.</div>'}</div></section>`;
  }).join("");
}
function renderMatches(){
  const sorted=[...state.matches].sort((a,b)=>b.date.localeCompare(a.date));
  document.querySelector("#matchesList").innerHTML=sorted.map(m=>`<article class="match-card"><div>
    <strong>${new Date(m.date+"T12:00:00").toLocaleDateString("pt-BR")} — JEC x ${esc(m.opponent)}</strong>
    <p>${esc(m.competition||"Sem competição")} ${m.round?"• "+esc(m.round):""}</p></div>
    <div><div class="score">${m.goalsFor} x ${m.goalsAgainst}</div><div class="icon-actions">
    <button class="icon-btn" onclick="editMatch('${m.id}')">Editar</button><button class="icon-btn" onclick="removeMatch('${m.id}')">Excluir</button>
    </div></div></article>`).join("")||'<div class="empty-state">Nenhuma partida cadastrada.</div>';
}
function renderMatchSelect(){
  const select=document.querySelector("#statsMatchSelect"),current=select.value;
  select.innerHTML='<option value="">Selecione...</option>'+[...state.matches].sort((a,b)=>b.date.localeCompare(a.date)).map(m=>`<option value="${m.id}">${new Date(m.date+"T12:00:00").toLocaleDateString("pt-BR")} — ${esc(m.opponent)} (${m.goalsFor} x ${m.goalsAgainst})</option>`).join("");
  if(state.matches.some(m=>m.id===current))select.value=current;
  renderStatsTables();
}
function renderDashboard(){
  const aggs=state.players.map(p=>({player:p,...aggregatePlayer(p)}));
  const rated=aggs.filter(x=>x.matches>0);
  document.querySelector("#kpiPlayers").textContent=state.players.length;
  document.querySelector("#kpiMatches").textContent=state.matches.length;
  document.querySelector("#kpiGoals").textContent=Object.values(state.stats).flat().reduce((s,x)=>s+Number(x.goal||0),0);
  document.querySelector("#kpiAverage").textContent=fmt(rated.length?rated.reduce((s,x)=>s+x.average,0)/rated.length:0);
  const mvp=[...rated].sort((a,b)=>b.average-a.average)[0];
  document.querySelector("#seasonMvp").innerHTML=mvp?`<strong>${esc(mvp.player.name)}</strong><p>${esc(mvp.player.position)} • média ${fmt(mvp.average)} • ${mvp.matches} jogo(s)</p>`:'<div class="empty-state">Cadastre estatísticas.</div>';
  const last=[...state.matches].sort((a,b)=>b.date.localeCompare(a.date))[0];
  document.querySelector("#lastMatch").innerHTML=last?`<strong>JEC ${last.goalsFor} x ${last.goalsAgainst} ${esc(last.opponent)}</strong><p>${new Date(last.date+"T12:00:00").toLocaleDateString("pt-BR")}</p>`:'<div class="empty-state">Nenhuma partida cadastrada.</div>';
  const positions=["Goleiro","Fixo","Ala","Pivô","Universal"];
  document.querySelector("#bestByPosition").innerHTML=positions.map(pos=>{
    const best=[...rated].filter(x=>x.player.position===pos).sort((a,b)=>b.average-a.average)[0];
    return `<div class="ranking-card"><strong>${pos}</strong><span>${best?esc(best.player.name):"Sem dados"}</span><span>${best?"Nota "+fmt(best.average):""}</span></div>`;
  }).join("");
}
function renderRankings(){
  const positions=["Goleiro","Fixo","Ala","Pivô","Universal"];
  document.querySelector("#rankingsContainer").innerHTML=positions.map(pos=>{
    const rows=state.players.filter(p=>p.position===pos).map(p=>({p,...aggregatePlayer(p)})).filter(x=>x.matches>0).sort((a,b)=>b.average-a.average);
    return `<article class="card rank-table"><h3>${pos}</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>Atleta</th><th>Jogos</th><th>Minutos</th><th>Rating</th><th>Gols</th><th>Assist.</th><th>Chances criadas</th><th>Chances bloqueadas</th></tr></thead>
    <tbody>${rows.map((x,i)=>`<tr><td>${i+1}</td><td>${esc(x.p.name)}</td><td>${x.matches}</td><td>${x.minutes}</td><td>${fmt(x.average)}</td><td>${x.goal}</td><td>${x.assist}</td><td>${x.created}</td><td>${x.blocked}</td></tr>`).join("")||'<tr><td colspan="9">Sem estatísticas.</td></tr>'}</tbody></table></div></article>`;
  }).join("");
}
function renderWeights(){
  const metrics=[["goal","Gol"],["assist","Assistência"],["shotOn","Chute no gol"],["shotOff","Chute fora"],["tacklePoss","Desarme c/ posse"],["tackleNoPoss","Desarme s/ posse"],["turnover","Perda de posse"],["badPass","Passe errado"],["counter","Contra-ataque"],["foulCommitted","Falta cometida"],["foulSuffered","Falta sofrida"],["created","Chances criadas"],["blocked","Chances bloqueadas"],["save","Defesa"],["difficultSave","Defesa difícil"],["goalAgainst","Gol sofrido"],["correctExit","Saída certa"],["wrongExit","Saída errada"],["correctDistribution","Reposição certa"],["wrongDistribution","Reposição errada"],["decisiveError","Erro decisivo"]];
  const positions=["Ala","Fixo","Pivô","Universal","Goleiro"];
  document.querySelector("#weightsTable").innerHTML=`<thead><tr><th>Métrica</th>${positions.map(p=>`<th>${p}</th>`).join("")}</tr></thead><tbody>${metrics.map(([key,label])=>`<tr><td>${label}</td>${positions.map(p=>`<td><input type="number" step="0.1" data-pos="${p}" data-key="${key}" value="${state.weights[p]?.[key]??0}"></td>`).join("")}</tr>`).join("")}</tbody>`;
}
document.querySelector("#saveWeightsBtn").onclick=()=>{
  document.querySelectorAll("#weightsTable input").forEach(i=>{state.weights[i.dataset.pos][i.dataset.key]=Number(i.value||0);});
  saveState();toast("Pesos salvos.");
};
document.querySelector("#resetWeightsBtn").onclick=()=>{state.weights=structuredClone(defaultWeights);saveState();toast("Pesos restaurados.");};
document.querySelector("#exportBtn").onclick=()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");
  a.href=URL.createObjectURL(blob);a.download="jec-krona-backup.json";a.click();URL.revokeObjectURL(a.href);
};
document.querySelector("#importInput").addEventListener("change",async e=>{
  try{const data=JSON.parse(await e.target.files[0].text());state={...freshState(),...data};saveState();toast("Dados importados.");}
  catch{toast("Arquivo inválido.");}
});




let calendarSyncTimer = null;

function normalizeRemoteGame(game){
  const date=String(game.date||"").slice(0,10);
  const time=String(game.time||"").slice(0,5);
  const opponent=String(game.opponent||"").trim();
  const competition=String(game.competition||"").trim()||"Não informada";
  const venue=game.venue==="Casa"?"Casa":"Fora";
  const id=String(game.id||`official_${date}_${opponent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_")}`);
  return {
    id,date,time,opponent,competition,venue,
    homeTeam:String(game.homeTeam|| (venue==="Casa"?"JEC/Krona":opponent)),
    awayTeam:String(game.awayTeam|| (venue==="Casa"?opponent:"JEC/Krona")),
    location:String(game.location|| (venue==="Casa"?"Centreventos Cau Hansen":"Local a confirmar"))
  };
}
function setCalendarSyncStatus(text,type=""){
  const el=document.querySelector("#calendarSyncStatus");
  if(!el)return;
  el.textContent=text;
  el.className=`sync-status ${type}`.trim();
}
function mergeOfficialCalendar(remoteGames){
  const normalized=remoteGames.map(normalizeRemoteGame).filter(g=>g.date&&g.opponent);
  if(!normalized.length)throw new Error("Nenhuma partida válida recebida.");
  state.officialCalendar=normalized;

  // Atualiza partidas já adicionadas quando data, horário ou local mudar.
  state.matches.forEach(match=>{
    if(!match.officialGameId)return;
    const updated=normalized.find(g=>g.id===match.officialGameId);
    if(updated){
      match.date=updated.date;
      match.opponent=updated.opponent;
      match.competition=updated.competition;
      match.scheduledTime=updated.time;
      match.location=updated.location;
      match.venue=updated.venue;
    }
  });
}
async function syncOfficialCalendar({silent=false}={}){
  const url=String(state.calendarSync?.feedUrl||"").trim();
  if(!url){
    if(!silent)setCalendarSyncStatus("Configure a URL do serviço em Pesos/Configurações.","error");
    return false;
  }
  if(!navigator.onLine){
    if(!silent)setCalendarSyncStatus("Sem internet. Mantendo o último calendário.","error");
    return false;
  }
  try{
    setCalendarSyncStatus("Atualizando calendário…","syncing");
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),12000);
    const response=await fetch(url,{headers:{"Accept":"application/json"},cache:"no-store",signal:controller.signal});
    clearTimeout(timeout);
    if(!response.ok)throw new Error(`Erro HTTP ${response.status}`);
    const payload=await response.json();
    const games=Array.isArray(payload)?payload:payload.games;
    if(!Array.isArray(games))throw new Error("Formato de calendário inválido.");
    mergeOfficialCalendar(games);
    state.calendarSync.lastSync=new Date().toISOString();
    state.calendarSync.lastResult=`${games.length} jogo(s) atualizado(s)`;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    renderAll();
    setCalendarSyncStatus(`Atualizado agora • ${games.length} jogo(s)`,"ok");
    if(!silent)toast("Calendário atualizado.");
    return true;
  }catch(err){
    console.error("Falha na sincronização do calendário",err);
    setCalendarSyncStatus("Não foi possível atualizar. Exibindo dados salvos.","error");
    if(!silent)toast("Falha ao atualizar o calendário.");
    return false;
  }
}
function shouldAutoSync(){
  const last=state.calendarSync?.lastSync;
  if(!last)return true;
  const hours=Math.max(1,Number(state.calendarSync.intervalHours||6));
  return Date.now()-new Date(last).getTime()>=hours*60*60*1000;
}
function scheduleCalendarSync(){
  if(calendarSyncTimer)clearInterval(calendarSyncTimer);
  const hours=Math.max(1,Number(state.calendarSync.intervalHours||6));
  calendarSyncTimer=setInterval(()=>syncOfficialCalendar({silent:true}),hours*60*60*1000);
}
function renderCalendarSyncSettings(){
  const url=document.querySelector("#calendarFeedUrl");
  const interval=document.querySelector("#calendarSyncInterval");
  if(url)url.value=state.calendarSync?.feedUrl||"";
  if(interval)interval.value=String(state.calendarSync?.intervalHours||6);
  if(state.calendarSync?.lastSync){
    const when=new Date(state.calendarSync.lastSync).toLocaleString("pt-BR");
    setCalendarSyncStatus(`Última atualização: ${when}`,"ok");
  }else{
    setCalendarSyncStatus(state.calendarSync?.feedUrl?"Ainda não sincronizado":"Configure o serviço de atualização.","");
  }
}

function ensureOfficialCalendar(){
  if(!Array.isArray(state.officialCalendar) || !state.officialCalendar.length){
    state.officialCalendar = structuredClone(defaultOfficialCalendar);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
}
function calendarDateParts(dateString){
  const d=new Date(dateString+"T12:00:00");
  return {
    day:String(d.getDate()).padStart(2,"0"),
    month:d.toLocaleDateString("pt-BR",{month:"short"}).replace(".",""),
    monthLong:d.toLocaleDateString("pt-BR",{month:"long",year:"numeric"}),
    weekday:d.toLocaleDateString("pt-BR",{weekday:"long"})
  };
}
function isOfficialGameAdded(game){
  return state.matches.some(m=>m.officialGameId===game.id);
}
function addOfficialGameToMatches(gameId){
  const game=state.officialCalendar.find(g=>g.id===gameId);
  if(!game)return;
  if(isOfficialGameAdded(game))return toast("Este jogo já está nas partidas.");
  state.matches.push({
    id:uid("m"),officialGameId:game.id,date:game.date,opponent:game.opponent,
    competition:game.competition,round:"",goalsFor:0,goalsAgainst:0,
    scheduledTime:game.time,location:game.location,venue:game.venue,status:"Agendado"
  });
  saveState();toast("Jogo adicionado às partidas.");
}
function renderOfficialCalendar(){
  const container=document.querySelector("#officialCalendarList");
  if(!container)return;
  const comp=document.querySelector("#calendarCompetitionFilter")?.value||"";
  const venue=document.querySelector("#calendarVenueFilter")?.value||"";
  let games=[...(state.officialCalendar||[])].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
  if(comp)games=games.filter(g=>g.competition===comp);
  if(venue)games=games.filter(g=>g.venue===venue);

  const all=state.officialCalendar||[];
  document.querySelector("#calendarUpcomingCount").textContent=all.length;
  document.querySelector("#calendarHomeCount").textContent=all.filter(g=>g.venue==="Casa").length;
  document.querySelector("#calendarAwayCount").textContent=all.filter(g=>g.venue==="Fora").length;
  document.querySelector("#calendarCompetitionCount").textContent=new Set(all.map(g=>g.competition)).size;

  let lastMonth="";
  container.innerHTML=games.map(game=>{
    const parts=calendarDateParts(game.date),added=isOfficialGameAdded(game);
    const monthHeader=parts.monthLong!==lastMonth?`<h3 class="calendar-month">${parts.monthLong}</h3>`:"";
    lastMonth=parts.monthLong;
    return `${monthHeader}<article class="calendar-game ${added?"added":""}">
      <div class="calendar-date"><strong>${parts.day}</strong><span>${parts.month}</span></div>
      <div class="calendar-game-main">
        <h3>${esc(game.homeTeam)} x ${esc(game.awayTeam)}</h3>
        <p>${parts.weekday}, ${game.time} • ${esc(game.location)}</p>
        <div class="calendar-badges">
          <span class="calendar-badge competition">${esc(game.competition)}</span>
          <span class="calendar-badge ${game.venue==="Casa"?"home":"away"}">${game.venue}</span>
          ${added?'<span class="calendar-badge home">Adicionado</span>':""}
        </div>
      </div>
      <div class="calendar-actions">
        <button class="btn ${added?"btn-secondary":"btn-primary"} add-official-game" data-game-id="${game.id}" ${added?"disabled":""}>${added?"Já adicionado":"Adicionar às partidas"}</button>
      </div>
    </article>`;
  }).join("")||'<div class="empty-state">Nenhum jogo encontrado com estes filtros.</div>';
  container.querySelectorAll(".add-official-game").forEach(btn=>btn.addEventListener("click",()=>addOfficialGameToMatches(btn.dataset.gameId)));
}
function populateCalendarFilters(){
  const select=document.querySelector("#calendarCompetitionFilter");
  if(!select)return;
  const current=select.value;
  const comps=[...new Set((state.officialCalendar||[]).map(g=>g.competition))].sort();
  select.innerHTML='<option value="">Todas</option>'+comps.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join("");
  if(comps.includes(current))select.value=current;
}
function initializeCalendar(){
  const comp=document.querySelector("#calendarCompetitionFilter");
  const venue=document.querySelector("#calendarVenueFilter");
  if(comp)comp.addEventListener("change",renderOfficialCalendar);
  if(venue)venue.addEventListener("change",renderOfficialCalendar);
  const sync=document.querySelector("#syncOfficialCalendarBtn");
  if(sync)sync.addEventListener("click",()=>syncOfficialCalendar());
  const saveSync=document.querySelector("#saveCalendarSyncBtn");
  if(saveSync)saveSync.addEventListener("click",()=>{
    state.calendarSync.feedUrl=document.querySelector("#calendarFeedUrl").value.trim().replace(/\/$/,"");
    state.calendarSync.intervalHours=Number(document.querySelector("#calendarSyncInterval").value||6);
    state.calendarSync.lastSync=null;
    localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
    scheduleCalendarSync();
    renderCalendarSyncSettings();
    toast("Sincronização salva.");
    syncOfficialCalendar({silent:true});
  });
  window.addEventListener("online",()=>syncOfficialCalendar({silent:true}));
  document.addEventListener("visibilitychange",()=>{
    if(document.visibilityState==="visible"&&shouldAutoSync())syncOfficialCalendar({silent:true});
  });
}


const quickActionKeys={
  "1":"Passe certo","2":"Passe errado","3":"Finalização no gol","4":"Finalização para fora",
  "5":"Desarme","6":"Perda de posse","7":"Chance criada","8":"Gol","9":"Bola parada"
};

function renderQuickPlayers(){const grid=document.querySelector("#quickPlayerGrid"),select=document.querySelector("#mapPlayerSelect");if(!grid||!select)return;const match=currentMapMatch(),term=(document.querySelector("#quickPlayerSearch")?.value||"").trim().toLowerCase(),selected=select.value;let players=[];if(match&&(match.relatedPlayerIds||[]).length)players=(match.relatedPlayerIds||[]).map(id=>state.players.find(p=>p.id===id)).filter(Boolean);players=players.filter(p=>!term||p.name.toLowerCase().includes(term)||String(p.number||"").includes(term));const onCourtSet=new Set(match?.onCourtPlayerIds||[]),onCourt=players.filter(p=>onCourtSet.has(p.id)).sort((a,b)=>Number(a.number||999)-Number(b.number||999)),bench=players.filter(p=>!onCourtSet.has(p.id)).sort((a,b)=>Number(a.number||999)-Number(b.number||999));if(!match){grid.innerHTML='<div class="empty-state">Selecione uma partida.</div>';select.innerHTML='<option value="">Selecione...</option>';updateQuickEntryStatus();return;}if((match.relatedPlayerIds||[]).length!==16){grid.innerHTML='<div class="empty-state">Relacione os 16 jogadores desta partida.</div>';select.innerHTML='<option value="">Selecione...</option>';updateQuickEntryStatus();return;}select.innerHTML='<option value="">Selecione...</option>'+players.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join("");if(players.some(p=>p.id===selected))select.value=selected;const button=p=>`<button type="button" class="quick-player ${p.id===select.value?"active":""} ${onCourtSet.has(p.id)?"on-court":"bench"}" data-player-id="${p.id}"><span class="quick-player-number">${p.number||"-"}</span><span class="quick-player-text"><strong>${esc(p.name)}</strong><small>${esc(p.position)}</small></span></button>`;grid.innerHTML=`<div class="quick-player-section-label">Em quadra (${onCourt.length})</div>${onCourt.map(button).join("")}<div class="quick-player-section-label">Banco (${bench.length})</div>${bench.map(button).join("")}`;grid.querySelectorAll(".quick-player").forEach(btn=>btn.addEventListener("click",()=>{select.value=btn.dataset.playerId;select.dispatchEvent(new Event("change"));renderQuickPlayers();}));}
function setQuickAction(action){
  const select=document.querySelector("#mapActionSelect");
  if(!select)return;
  select.value=action;
  select.dispatchEvent(new Event("change"));
  renderQuickActionState();
}
function renderQuickActionState(){
  const action=document.querySelector("#mapActionSelect")?.value||"";
  document.querySelectorAll(".quick-action").forEach(btn=>btn.classList.toggle("active",btn.dataset.action===action));
  updateQuickEntryStatus();
}
function setQuickPeriod(period){
  const select=document.querySelector("#mapPeriodSelect");
  if(!select)return;
  const option=[...select.options].find(o=>o.value===period);
  if(option?.disabled)return toast("Ative a prorrogação para usar este período.");
  select.value=period;
  select.dispatchEvent(new Event("change"));
  renderQuickPeriodState();
}
function renderQuickPeriodState(){
  const value=document.querySelector("#mapPeriodSelect")?.value||"1T";
  document.querySelectorAll(".period-quick").forEach(btn=>{
    const isOvertime=btn.dataset.quickPeriod==="P1"||btn.dataset.quickPeriod==="P2";
    btn.disabled=isOvertime&&!isOvertimeEnabled();
    btn.classList.toggle("active",btn.dataset.quickPeriod===value);
  });
}
function updateQuickEntryStatus(){
  const playerId=document.querySelector("#mapPlayerSelect")?.value||"";
  const player=state.players.find(p=>p.id===playerId);
  const action=document.querySelector("#mapActionSelect")?.value||"";
  const playerText=player?`#${player.number||"-"} ${player.name}`:"Nenhum jogador";
  const actionText=action||"Nenhuma ação";
  const p=document.querySelector("#quickSelectedPlayer");
  const a=document.querySelector("#quickSelectedAction");
  if(p)p.textContent=playerText;
  if(a)a.textContent=actionText;
  const mobilePlayer=document.querySelector("#mobilePlayerBtn strong");
  const mobileAction=document.querySelector("#mobileActionBtn strong");
  if(mobilePlayer)mobilePlayer.textContent=player?player.name:"Nenhum";
  if(mobileAction)mobileAction.textContent=action||"Nenhuma";
  document.querySelector("#futsalCourt")?.classList.toggle("ready-to-mark",Boolean(player&&action&&document.querySelector("#mapMatchSelect")?.value));
}
function clearQuickSelection(){
  const player=document.querySelector("#mapPlayerSelect");
  const action=document.querySelector("#mapActionSelect");
  if(player)player.value="";
  if(action)action.value="";
  renderQuickPlayers();
  renderQuickActionState();
  updateMapInstruction();
}
function initializeQuickEntry(){
  document.querySelector("#quickPlayerSearch")?.addEventListener("input",renderQuickPlayers);
  document.querySelectorAll(".quick-action").forEach(btn=>btn.addEventListener("click",()=>setQuickAction(btn.dataset.action)));
  document.querySelectorAll(".period-quick").forEach(btn=>btn.addEventListener("click",()=>setQuickPeriod(btn.dataset.quickPeriod)));
  document.querySelector("#clearQuickSelectionBtn")?.addEventListener("click",clearQuickSelection);
  document.querySelector("#mobileUndoBtn")?.addEventListener("click",()=>document.querySelector("#undoActionBtn")?.click());
  document.querySelector("#mobilePlayerBtn")?.addEventListener("click",()=>document.querySelector("#quickPlayerSearch")?.focus());
  document.querySelector("#mobileActionBtn")?.addEventListener("click",()=>document.querySelector(".quick-action")?.scrollIntoView({behavior:"smooth",block:"center"}));
  document.addEventListener("keydown",ev=>{
    if(ev.target.matches("input,select,textarea")||ev.ctrlKey||ev.metaKey||ev.altKey)return;
    const action=quickActionKeys[ev.key];
    if(action){
      ev.preventDefault();
      setQuickAction(action);
    }
    if(ev.key==="Escape")clearQuickSelection();
  });
}

\nlet lineupEditingMatchId=null;let tempSelectedPlayers=new Set();let tempStarters=new Set();\nfunction ensureMatchLineups(){state.matches=(state.matches||[]).map(m=>({relatedPlayerIds:[],onCourtPlayerIds:[],substitutions:[],...m}));localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}\nfunction currentMapMatch(){const id=document.querySelector("#mapMatchSelect")?.value||"";return state.matches.find(m=>m.id===id);}\nfunction openLineupManager(matchId){const match=state.matches.find(m=>m.id===matchId)||state.matches[0];if(!match)return toast("Cadastre ou selecione uma partida.");lineupEditingMatchId=match.id;tempSelectedPlayers=new Set(match.relatedPlayerIds||[]);tempStarters=new Set(match.onCourtPlayerIds||[]);renderLineupDialog();document.querySelector("#lineupDialog").showModal();}\nfunction renderLineupDialog(){const list=document.querySelector("#lineupPlayerList");if(!list)return;const players=[...state.players].filter(p=>!p.historical).sort((a,b)=>a.position.localeCompare(b.position)||Number(a.number||999)-Number(b.number||999)||a.name.localeCompare(b.name));list.innerHTML=players.map(p=>{const selected=tempSelectedPlayers.has(p.id),starter=tempStarters.has(p.id);return `<div class="lineup-player-item ${selected?"selected":""}"><input class="lineup-select" type="checkbox" data-player-id="${p.id}" ${selected?"checked":""}/><div class="player-meta"><strong>#${p.number||"-"} ${esc(p.name)}</strong><small>${esc(p.position)}</small></div><label class="starter-toggle">Titular <input class="lineup-starter" type="checkbox" data-player-id="${p.id}" ${starter?"checked":""} ${selected?"":"disabled"}/></label></div>`}).join("");document.querySelector("#lineupSelectedCount").textContent=tempSelectedPlayers.size;document.querySelector("#lineupStarterCount").textContent=tempStarters.size;list.querySelectorAll(".lineup-select").forEach(input=>input.addEventListener("change",()=>{const id=input.dataset.playerId;if(input.checked){if(tempSelectedPlayers.size>=16){input.checked=false;return toast("O limite é de 16 jogadores.");}tempSelectedPlayers.add(id);}else{tempSelectedPlayers.delete(id);tempStarters.delete(id);}renderLineupDialog();}));list.querySelectorAll(".lineup-starter").forEach(input=>input.addEventListener("change",()=>{const id=input.dataset.playerId;if(input.checked){if(tempStarters.size>=5){input.checked=false;return toast("O limite é de 5 titulares.");}tempStarters.add(id);}else tempStarters.delete(id);renderLineupDialog();}));}\nfunction saveLineup(){if(tempSelectedPlayers.size!==16)return toast("Selecione exatamente 16 jogadores.");if(tempStarters.size!==5)return toast("Selecione exatamente 5 titulares.");const match=state.matches.find(m=>m.id===lineupEditingMatchId);if(!match)return;match.relatedPlayerIds=[...tempSelectedPlayers];match.onCourtPlayerIds=[...tempStarters];match.substitutions=match.substitutions||[];localStorage.setItem(STORAGE_KEY,JSON.stringify(state));document.querySelector("#lineupDialog").close();renderAll();toast("Relação da partida salva.");}\nfunction renderMatchLineupSummary(){const el=document.querySelector("#matchLineupSummary");if(!el)return;const match=currentMapMatch()||state.matches[0];if(!match){el.innerHTML='<div class="empty-state">Cadastre uma partida para relacionar jogadores.</div>';return;}const related=(match.relatedPlayerIds||[]).map(id=>state.players.find(p=>p.id===id)).filter(Boolean),onCourt=new Set(match.onCourtPlayerIds||[]),starters=related.filter(p=>onCourt.has(p.id)),bench=related.filter(p=>!onCourt.has(p.id));el.innerHTML=`<div class="lineup-summary-group"><h4>Em quadra (${starters.length})</h4><div class="lineup-chip-list">${starters.map(p=>`<span class="lineup-chip on-court">#${p.number||"-"} ${esc(p.name)}</span>`).join("")||"<span>Não definido</span>"}</div></div><div class="lineup-summary-group"><h4>Banco (${bench.length})</h4><div class="lineup-chip-list">${bench.map(p=>`<span class="lineup-chip">#${p.number||"-"} ${esc(p.name)}</span>`).join("")||"<span>Não definido</span>"}</div></div>`;}\nfunction openSubstitutionDialog(){const match=currentMapMatch();if(!match)return toast("Selecione uma partida.");if((match.relatedPlayerIds||[]).length!==16)return toast("Relacione os 16 jogadores antes.");const outSel=document.querySelector("#subOutPlayer"),inSel=document.querySelector("#subInPlayer"),onCourt=(match.onCourtPlayerIds||[]).map(id=>state.players.find(p=>p.id===id)).filter(Boolean),bench=(match.relatedPlayerIds||[]).filter(id=>!(match.onCourtPlayerIds||[]).includes(id)).map(id=>state.players.find(p=>p.id===id)).filter(Boolean);outSel.innerHTML=onCourt.map(p=>`<option value="${p.id}">#${p.number||"-"} ${esc(p.name)}</option>`).join("");inSel.innerHTML=bench.map(p=>`<option value="${p.id}">#${p.number||"-"} ${esc(p.name)}</option>`).join("");document.querySelector("#substitutionDialog").showModal();}\nfunction confirmSubstitution(){const match=currentMapMatch();if(!match)return;const outId=document.querySelector("#subOutPlayer").value,inId=document.querySelector("#subInPlayer").value;if(!outId||!inId)return toast("Escolha quem sai e quem entra.");match.onCourtPlayerIds=(match.onCourtPlayerIds||[]).filter(id=>id!==outId);match.onCourtPlayerIds.push(inId);match.substitutions=match.substitutions||[];match.substitutions.push({id:uid("sub"),outPlayerId:outId,inPlayerId:inId,period:document.querySelector("#mapPeriodSelect")?.value||"1T",timeLabel:getMatchClockLabel(),createdAt:new Date().toISOString()});localStorage.setItem(STORAGE_KEY,JSON.stringify(state));document.querySelector("#substitutionDialog").close();renderAll();toast("Substituição registrada.");}\nfunction initializeLineups(){document.querySelector("#openLineupManagerBtn")?.addEventListener("click",()=>openLineupManager(document.querySelector("#mapMatchSelect")?.value||state.matches[0]?.id));document.querySelector("#cancelLineupBtn")?.addEventListener("click",()=>document.querySelector("#lineupDialog").close());document.querySelector("#saveLineupBtn")?.addEventListener("click",saveLineup);document.querySelector("#substitutionBtn")?.addEventListener("click",openSubstitutionDialog);document.querySelector("#cancelSubstitutionBtn")?.addEventListener("click",()=>document.querySelector("#substitutionDialog").close());document.querySelector("#confirmSubstitutionBtn")?.addEventListener("click",confirmSubstitution);}\n
let activePeriodFilter = "1T";
let editingActionId = null;
let movingActionId = null;
let pendingMapPoint = null;
let pendingSetPieceType = "";
let pendingSetPieceResult = "";
const activeMapFilters = {
  zone:new Set(["finalizacao","construcao","pressao","morta"]),
  corridor:new Set(["lateral","central"])
};


const periodLabels = {
  "1T":"1º tempo",
  "2T":"2º tempo",
  "P1":"1º tempo da prorrogação",
  "P2":"2º tempo da prorrogação"
};
function selectedMapMatch(){
  const id=document.querySelector("#mapMatchSelect")?.value||"";
  return state.matches.find(m=>m.id===id);
}
function isOvertimeEnabled(){
  return Boolean(selectedMapMatch()?.overtimeEnabled);
}
function getVisiblePeriodEvents(events){
  if(activePeriodFilter==="TOTAL")return events;
  return events.filter(e=>(e.period||"1T")===activePeriodFilter);
}
function actionCounts(events){
  return events.reduce((acc,e)=>{
    acc[e.action]=(acc[e.action]||0)+1;
    return acc;
  },{});
}
function renderPeriodSummary(){
  const matchId=document.querySelector("#mapMatchSelect")?.value||"";
  const allEvents=(state.events||[]).filter(e=>!matchId||e.matchId===matchId);
  const grid=document.querySelector("#periodTotalsGrid");
  if(!grid)return;

  const overtime=isOvertimeEnabled();
  document.querySelectorAll(".overtime-period").forEach(btn=>btn.classList.toggle("is-disabled",!overtime));
  const toggle=document.querySelector("#enableOvertimeToggle");
  if(toggle)toggle.checked=overtime;

  if(!overtime && (activePeriodFilter==="P1"||activePeriodFilter==="P2")){
    activePeriodFilter="1T";
  }

  document.querySelectorAll(".period-tab").forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.periodFilter===activePeriodFilter);
  });

  const periods=[
    ["1T","1º tempo"],
    ["2T","2º tempo"],
    ...(overtime?[["P1","Prorrogação 1"],["P2","Prorrogação 2"]]:[]),
    ["TOTAL","Total"]
  ];

  grid.innerHTML=periods.map(([key,label])=>{
    const events=key==="TOTAL"?allEvents:allEvents.filter(e=>(e.period||"1T")===key);
    const counts=actionCounts(events);
    const topActions=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,3);
    return `<div class="period-total-box ${key===activePeriodFilter?"highlight":""}">
      <span>${label}</span>
      <strong>${events.length}</strong>
      <span>${events.length===1?"ação":"ações"}</span>
      <div class="period-action-list">
        ${topActions.map(([name,count])=>`<div class="period-action-item"><span>${esc(name)}</span><b>${count}</b></div>`).join("")||'<small>Sem registros</small>'}
      </div>
    </div>`;
  }).join("");
}


function findEventById(id){
  return (state.events||[]).find(e=>e.id===id);
}
function populateEditPlayerSelect(){
  const select=document.querySelector("#editActionPlayer");
  if(!select)return;
  select.innerHTML=[...state.players]
    .sort((a,b)=>a.position.localeCompare(b.position)||a.name.localeCompare(b.name))
    .map(p=>`<option value="${p.id}">#${p.number||"-"} ${esc(p.name)} — ${esc(p.position)}</option>`)
    .join("");
}
function updateEditSetPieceVisibility(){
  const isSetPiece=document.querySelector("#editActionType")?.value==="Bola parada";
  document.querySelector("#editSetPieceTypeWrap")?.classList.toggle("hidden",!isSetPiece);
  document.querySelector("#editSetPieceResultWrap")?.classList.toggle("hidden",!isSetPiece);
}
function openEditActionDialog(eventId){
  const event=findEventById(eventId);
  if(!event)return;
  editingActionId=eventId;
  populateEditPlayerSelect();

  document.querySelector("#editActionId").value=event.id;
  document.querySelector("#editActionPlayer").value=event.playerId;
  document.querySelector("#editActionPeriod").value=event.period||"1T";
  document.querySelector("#editActionType").value=event.action;
  document.querySelector("#editActionTime").value=event.timeLabel||"";
  document.querySelector("#editSetPieceType").value=event.setPieceType||"";
  document.querySelector("#editSetPieceResult").value=event.result||"";
  document.querySelector("#editLocationText").textContent=`${event.zoneLabel} • ${event.corridorLabel}`;
  updateEditSetPieceVisibility();

  const periodSelect=document.querySelector("#editActionPeriod");
  [...periodSelect.options].forEach(opt=>{
    if(opt.value==="P1"||opt.value==="P2")opt.disabled=!isOvertimeEnabled();
  });

  document.querySelector("#editActionDialog").showModal();
}
function saveEditedAction(){
  const event=findEventById(editingActionId);
  if(!event)return;

  const playerId=document.querySelector("#editActionPlayer").value;
  const player=state.players.find(p=>p.id===playerId);
  const action=document.querySelector("#editActionType").value;
  const period=document.querySelector("#editActionPeriod").value;

  event.playerId=playerId;
  event.playerName=player?.name||event.playerName;
  event.action=action;
  event.period=period;
  event.timeLabel=document.querySelector("#editActionTime").value.trim()||event.timeLabel;

  if(action==="Bola parada"){
    event.setPieceType=document.querySelector("#editSetPieceType").value;
    event.result=document.querySelector("#editSetPieceResult").value;
  }else{
    delete event.setPieceType;
    delete event.result;
  }

  event.updatedAt=new Date().toISOString();
  event.editHistory=event.editHistory||[];
  event.editHistory.push({
    editedAt:event.updatedAt,
    action:event.action,
    playerId:event.playerId,
    period:event.period
  });

  saveState();
  document.querySelector("#editActionDialog").close();
  editingActionId=null;
  toast("Ação corrigida.");
}
function deleteActionById(eventId){
  const event=findEventById(eventId);
  if(!event)return;
  state.events=state.events.filter(e=>e.id!==eventId);
  saveState();
  toast("Ação excluída.");
}
function duplicateActionById(eventId){
  const event=findEventById(eventId);
  if(!event)return;
  const copy={
    ...structuredClone(event),
    id:uid("e"),
    createdAt:new Date().toISOString(),
    updatedAt:null,
    editHistory:[]
  };
  state.events.push(copy);
  saveState();
  toast("Ação duplicada.");
}
function startMoveAction(eventId){
  const event=findEventById(eventId);
  if(!event)return;
  movingActionId=eventId;
  document.querySelector("#editActionDialog").close();
  document.querySelector("#moveModeBanner")?.classList.add("active");
  document.querySelector("#mapInstruction").textContent="Toque na nova posição da ação.";
  document.querySelectorAll(".action-row").forEach(row=>row.classList.toggle("is-selected",row.dataset.eventId===eventId));
}
function cancelMoveAction(){
  movingActionId=null;
  document.querySelector("#moveModeBanner")?.classList.remove("active");
  document.querySelectorAll(".action-row").forEach(row=>row.classList.remove("is-selected"));
  updateMapInstruction();
}
function moveActionToPoint(point){
  const event=findEventById(movingActionId);
  if(!event)return;
  const zone=mapZone(point.x,point.y);
  const corridor=mapCorridor(point.y);
  const zoneLabels={finalizacao:"Zona de finalização",construcao:"Zona de construção",pressao:"Zona de pressão",morta:"Zona morta"};
  const corridorLabels={lateral:"Corredor lateral",central:"Corredor central"};
  event.x=point.x;
  event.y=point.y;
  event.zone=zone;
  event.corridor=corridor;
  event.zoneLabel=zoneLabels[zone];
  event.corridorLabel=corridorLabels[corridor];
  event.updatedAt=new Date().toISOString();
  event.editHistory=event.editHistory||[];
  event.editHistory.push({editedAt:event.updatedAt,moved:true,x:event.x,y:event.y});
  saveState();
  cancelMoveAction();
  toast("Localização corrigida.");
}
function initializeEditActions(){
  document.querySelector("#editActionType")?.addEventListener("change",updateEditSetPieceVisibility);
  document.querySelector("#cancelEditActionBtn")?.addEventListener("click",()=>{
    document.querySelector("#editActionDialog").close();
    editingActionId=null;
  });
  document.querySelector("#saveEditedActionBtn")?.addEventListener("click",saveEditedAction);
  document.querySelector("#deleteEditedActionBtn")?.addEventListener("click",()=>{
    if(!editingActionId)return;
    deleteActionById(editingActionId);
    document.querySelector("#editActionDialog").close();
    editingActionId=null;
  });
  document.querySelector("#duplicateEditedActionBtn")?.addEventListener("click",()=>{
    if(!editingActionId)return;
    duplicateActionById(editingActionId);
    document.querySelector("#editActionDialog").close();
    editingActionId=null;
  });
  document.querySelector("#moveActionLocationBtn")?.addEventListener("click",()=>{
    if(editingActionId)startMoveAction(editingActionId);
  });
  document.querySelector("#cancelMoveActionBtn")?.addEventListener("click",cancelMoveAction);
}

function mapZone(x,y){
  if((x<=10||x>=90) && (y<=22||y>=78)) return "morta";
  if(x<25) return "finalizacao";
  if(x>75) return "pressao";
  return "construcao";
}
function mapCorridor(y){ return (y<25||y>75) ? "lateral" : "central"; }
function actionSymbol(action){
  const symbols={"Gol":"G","Assistência":"A","Finalização no gol":"F","Finalização para fora":"X","Chance criada":"C",
    "Chance bloqueada":"B","Desarme":"D","Perda de posse":"P","Passe certo":"✓","Passe errado":"×",
    "Defesa":"🧤","Reposição certa":"R","Bola parada":"BP"};
  return symbols[action]||"•";
}
function populateMapSelectors(){
  const matchSel=document.querySelector("#mapMatchSelect");
  const playerSel=document.querySelector("#mapPlayerSelect");
  if(!matchSel||!playerSel)return;
  const oldMatch=matchSel.value,oldPlayer=playerSel.value;
  matchSel.innerHTML='<option value="">Selecione...</option>'+[...state.matches].sort((a,b)=>b.date.localeCompare(a.date)).map(m=>
    `<option value="${m.id}">${new Date(m.date+"T12:00:00").toLocaleDateString("pt-BR")} — ${esc(m.opponent)}</option>`).join("");
  playerSel.innerHTML='<option value="">Selecione...</option>'+[...state.players].sort((a,b)=>a.position.localeCompare(b.position)||a.name.localeCompare(b.name)).map(p=>
    `<option value="${p.id}">#${p.number||"-"} ${esc(p.name)} — ${esc(p.position)}</option>`).join("");
  if(state.matches.some(m=>m.id===oldMatch))matchSel.value=oldMatch;
  if(state.players.some(p=>p.id===oldPlayer))playerSel.value=oldPlayer;
  renderQuickPlayers();
  updateQuickEntryStatus();
}
function renderActionMap(){
  const matchId=document.querySelector("#mapMatchSelect")?.value||"";
  const markers=document.querySelector("#actionMarkers");
  const timeline=document.querySelector("#actionTimeline");
  if(!markers||!timeline)return;
  const allEvents=(state.events||[]).filter(e=>!matchId||e.matchId===matchId);
  const events=getVisiblePeriodEvents(allEvents);
  markers.innerHTML=events.map(e=>{
    const visible=activeMapFilters.zone.has(e.zone)&&activeMapFilters.corridor.has(e.corridor);
    return `<span class="action-marker ${visible?"":"hidden-by-filter"}" style="left:${e.x}%;top:${e.y}%" title="${esc(e.action)} — ${esc(e.playerName)}">${actionSymbol(e.action)}</span>`;
  }).join("");
  document.querySelector("#mappedActionCount").textContent=`${events.length} ${events.length===1?"ação":"ações"} • ${activePeriodFilter==="TOTAL"?"Total":periodLabels[activePeriodFilter]}`;
  timeline.innerHTML=[...events].reverse().slice(0,30).map(e=>`<div class="action-row" data-event-id="${e.id}">
    <strong>${esc(e.timeLabel||"--:--")}</strong>
    <div><strong>${esc(e.action)}${e.setPieceType?` — ${esc(e.setPieceType)}`:""}<span class="action-period-badge">${esc(periodLabels[e.period||"1T"])}</span></strong><small>${esc(e.playerName)} • ${esc(e.zoneLabel)} • ${esc(e.corridorLabel)}${e.result?` • ${esc(e.result)}`:""}</small></div>
    <button class="icon-btn edit-map-event" data-event-id="${e.id}">Editar</button>
  </div>`).join("")||'<div class="empty-state">Nenhuma ação registrada nesta partida.</div>';
  renderPeriodSummary();
  timeline.querySelectorAll(".edit-map-event").forEach(btn=>btn.addEventListener("click",ev=>{
    ev.stopPropagation();
    openEditActionDialog(btn.dataset.eventId);
  }));
  timeline.querySelectorAll(".action-row").forEach(row=>row.addEventListener("click",()=>{
    openEditActionDialog(row.dataset.eventId);
  }));
}
function updateMapInstruction(){
  renderQuickPeriodState();
  updateQuickEntryStatus();
  const match=document.querySelector("#mapMatchSelect")?.value;
  const periodSelect=document.querySelector("#mapPeriodSelect");
  if(periodSelect){
    [...periodSelect.options].forEach(opt=>{
      if(opt.value==="P1"||opt.value==="P2")opt.disabled=!isOvertimeEnabled();
    });
    if(!isOvertimeEnabled()&&(periodSelect.value==="P1"||periodSelect.value==="P2"))periodSelect.value="1T";
  }
  const player=document.querySelector("#mapPlayerSelect")?.value;
  const action=document.querySelector("#mapActionSelect")?.value;
  const el=document.querySelector("#mapInstruction");if(!el)return;
  el.textContent=!match?"Selecione uma partida.":!player?"Selecione um jogador.":!action?"Selecione uma ação.":"Toque no local da quadra.";
}
function getMatchClockLabel(){
  return new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit",second:"2-digit"});
}
function storeMapEvent(point,extra={}){
  const matchId=document.querySelector("#mapMatchSelect").value;
  const playerId=document.querySelector("#mapPlayerSelect").value;
  const action=document.querySelector("#mapActionSelect").value;
  const period=document.querySelector("#mapPeriodSelect")?.value||"1T";
  const player=state.players.find(p=>p.id===playerId);
  const zone=mapZone(point.x,point.y),corridor=mapCorridor(point.y);
  const zoneLabels={finalizacao:"Zona de finalização",construcao:"Zona de construção",pressao:"Zona de pressão",morta:"Zona morta"};
  const corridorLabels={lateral:"Corredor lateral",central:"Corredor central"};
  state.events=state.events||[];
  state.events.push({
    id:uid("e"),matchId,playerId,playerName:player?.name||"",action,x:point.x,y:point.y,
    zone,corridor,zoneLabel:zoneLabels[zone],corridorLabel:corridorLabels[corridor],
    period,timeLabel:getMatchClockLabel(),createdAt:new Date().toISOString(),...extra
  });
  saveState();
  const actionSelect=document.querySelector("#mapActionSelect");
  if(actionSelect)actionSelect.value="";
  renderQuickActionState();
  toast("Ação registrada.");
}
function initializeActionMap(){
  const court=document.querySelector("#futsalCourt");if(!court)return;
  ["mapMatchSelect","mapPlayerSelect","mapActionSelect","mapPeriodSelect"].forEach(id=>document.querySelector(`#${id}`).addEventListener("change",()=>{updateMapInstruction();renderActionMap();renderQuickPlayers();renderMatchLineupSummary();}));
  document.querySelectorAll(".period-tab").forEach(btn=>btn.addEventListener("click",()=>{
    const requested=btn.dataset.periodFilter;
    if((requested==="P1"||requested==="P2")&&!isOvertimeEnabled())return toast("Ative a prorrogação para usar estes períodos.");
    activePeriodFilter=requested;
    renderActionMap();
  }));
  const overtimeToggle=document.querySelector("#enableOvertimeToggle");
  if(overtimeToggle)overtimeToggle.addEventListener("change",()=>{
    const match=selectedMapMatch();
    if(!match){
      overtimeToggle.checked=false;
      return toast("Selecione uma partida.");
    }
    match.overtimeEnabled=overtimeToggle.checked;
    if(!match.overtimeEnabled&&(activePeriodFilter==="P1"||activePeriodFilter==="P2"))activePeriodFilter="1T";
    saveState();
    renderActionMap();
  });
  document.querySelectorAll(".legend-option").forEach(btn=>btn.addEventListener("click",()=>{
    const group=btn.dataset.filterGroup,key=btn.dataset.filter,set=activeMapFilters[group];
    set.has(key)?set.delete(key):set.add(key);btn.classList.toggle("active",set.has(key));
    document.querySelectorAll(`[data-${group}="${key}"]`).forEach(el=>el.classList.toggle(group==="zone"?"zone-hidden":"corridor-hidden",!set.has(key)));
    renderActionMap();
  }));
  court.addEventListener("click",ev=>{
    const rect=court.getBoundingClientRect();
    const point={x:Math.max(0,Math.min(100,(ev.clientX-rect.left)/rect.width*100)),y:Math.max(0,Math.min(100,(ev.clientY-rect.top)/rect.height*100))};
    if(movingActionId){
      moveActionToPoint(point);
      return;
    }
    const matchId=document.querySelector("#mapMatchSelect").value;
    const playerId=document.querySelector("#mapPlayerSelect").value;
    const action=document.querySelector("#mapActionSelect").value;
    if(!matchId||!playerId||!action)return toast("Selecione partida, jogador e ação.");const selectedMatch=state.matches.find(m=>m.id===matchId);if(!(selectedMatch?.relatedPlayerIds||[]).includes(playerId))return toast("Este jogador não está relacionado para a partida.");
    if(action==="Bola parada"){
      pendingMapPoint=point;pendingSetPieceType="";pendingSetPieceResult="";
      document.querySelectorAll("#setPieceDialog button[data-setpiece],#setPieceDialog button[data-result]").forEach(b=>b.classList.remove("selected"));
      document.querySelector("#setPieceDialog").showModal();
    }else storeMapEvent(point);
  });
  document.querySelectorAll("#setPieceTypes button").forEach(btn=>btn.addEventListener("click",()=>{
    pendingSetPieceType=btn.dataset.setpiece;
    document.querySelectorAll("#setPieceTypes button").forEach(b=>b.classList.toggle("selected",b===btn));
  }));
  document.querySelectorAll("#setPieceResults button").forEach(btn=>btn.addEventListener("click",()=>{
    pendingSetPieceResult=btn.dataset.result;
    document.querySelectorAll("#setPieceResults button").forEach(b=>b.classList.toggle("selected",b===btn));
  }));
  document.querySelector("#cancelSetPieceBtn").addEventListener("click",()=>document.querySelector("#setPieceDialog").close());
  document.querySelector("#confirmSetPieceBtn").addEventListener("click",()=>{
    if(!pendingSetPieceType||!pendingSetPieceResult)return toast("Escolha o tipo e o resultado.");
    storeMapEvent(pendingMapPoint,{setPieceType:pendingSetPieceType,result:pendingSetPieceResult});
    document.querySelector("#setPieceDialog").close();
  });
  document.querySelector("#undoActionBtn").addEventListener("click",()=>{
    const matchId=document.querySelector("#mapMatchSelect").value;
    const indexes=state.events.map((e,i)=>({e,i})).filter(x=>!matchId||x.e.matchId===matchId);
    if(!indexes.length)return toast("Nenhuma ação para desfazer.");
    state.events.splice(indexes[indexes.length-1].i,1);saveState();toast("Última ação removida.");
  });
  updateMapInstruction();
}

function renderAll(){renderMatchLineupSummary();renderQuickPlayers();renderQuickActionState();renderQuickPeriodState();renderPlayers();renderMatches();renderMatchSelect();populateCalendarFilters();renderOfficialCalendar();renderCalendarSyncSettings();populateMapSelectors();renderActionMap();renderPeriodSummary();renderDashboard();renderRankings();renderWeights();}

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();pendingInstallPrompt=e;document.querySelector("#installBtn").hidden=false;});
document.querySelector("#installBtn").onclick=async()=>{if(!pendingInstallPrompt)return;pendingInstallPrompt.prompt();await pendingInstallPrompt.userChoice;pendingInstallPrompt=null;document.querySelector("#installBtn").hidden=true;};
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js"));
migratePeriods();
ensureMatchLineups();
ensureProfessionalRoster();
ensureOfficialCalendar();
initializeCalendar();
scheduleCalendarSync();
initializeActionMap();
initializeEditActions();
initializeQuickEntry();
initializeLineups();
renderAll();
if(shouldAutoSync())syncOfficialCalendar({silent:true});
