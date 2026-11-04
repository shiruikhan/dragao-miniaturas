/* Controle de Miniaturas — O Dragão da Espiral de Gelo */
(() => {
  "use strict";

  const STORAGE_KEY = "dragao-miniaturas:v1";
  const TAMANHOS = {
    Min: { nome: "Minúsculo", base: "25 mm" },
    P: { nome: "Pequeno", base: "25 mm" },
    M: { nome: "Médio", base: "25 mm" },
    G: { nome: "Grande", base: "50 mm" },
    E: { nome: "Enorme", base: "75 mm" },
  };
  const TIPOS = {
    monstro: "Monstros",
    animal: "Animais",
    npc: "NPCs",
    companheiro: "Companheiros",
    custom: "Personalizadas",
  };

  // DMG 2024 — XP Budget per Character (Baixa, Moderada, Alta)
  const ORCAMENTO = {
    1: [50, 75, 100], 2: [100, 150, 200], 3: [150, 225, 400], 4: [250, 375, 500], 5: [500, 750, 1100],
    6: [600, 1000, 1400], 7: [750, 1300, 1700], 8: [1000, 1700, 2100], 9: [1300, 2000, 2600], 10: [1600, 2300, 3100],
  };
  const DIF = ["Abaixo de Baixa", "Baixa", "Moderada", "Alta", "Acima de Alta"];

  const estadoPadrao = () => ({
    jog: 6,
    comp: 0,
    regras: "55",
    nivelLocal: {},
    modo: "local",
    tipos: { monstro: true, animal: true, npc: true, companheiro: true, custom: true },
    impressas: {},
    stlOk: {},
    status: {},
    ordem: LOCAIS.map((l) => l.id),
    enc: {},
    customMinis: {},
    customEnc: [],
    aberto: {},
  });

  let S = carregar();

  function carregar() {
    const base = estadoPadrao();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return base;
      return normalizar(JSON.parse(raw));
    } catch (e) {
      return base;
    }
  }

  function normalizar(obj) {
    const base = estadoPadrao();
    const s = Object.assign(base, obj || {});
    s.tipos = Object.assign(estadoPadrao().tipos, s.tipos || {});
    // garante que todos os locais existam na ordem
    const ids = LOCAIS.map((l) => l.id);
    s.ordem = (s.ordem || []).filter((id) => ids.includes(id));
    ids.forEach((id) => { if (!s.ordem.includes(id)) s.ordem.push(id); });
    return s;
  }

  function salvar() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); } catch (e) { /* sem armazenamento */ }
  }

  // ---------- Dados ----------
  const mini = (id) => MINIS[id] || S.customMinis[id] || { nome: id, tam: "M", tipo: "custom" };
  const local = (id) => LOCAIS.find((l) => l.id === id);
  const encontrosDe = (loc) => loc.encontros.concat(S.customEnc.filter((e) => e.loc === loc.id));
  const encLigado = (e) => (e.id in S.enc ? S.enc[e.id] : !e.opt);
  const tipoVisivel = (mid) => S.tipos[mini(mid).tipo] !== false;

  const nivelDe = (loc) => S.nivelLocal[loc.id] || loc.nivel || 1;

  function qtd(g, nivel) {
    let b = g.b || 0, k = g.k || 0;
    if (g.lvl) {
      const n = Math.min(6, Math.max(1, nivel || 1));
      const r = g.lvl[n] || {};
      b = r.b || 0; k = r.k || 0;
    }
    const pessoas = S.jog + (g.comp ? S.comp : 0);
    let q = b + k * pessoas;
    if (g.max) q = Math.min(q, g.max);
    return Math.max(0, Math.round(q));
  }

  const xpGrupo = (g) => (g.xp != null ? g.xp : (["monstro", "animal", "custom"].includes(mini(g.m).tipo) ? mini(g.m).xp || 0 : 0));
  const pessoasMesa = () => S.jog + S.comp;

  function orcamento(nivel) {
    const o = ORCAMENTO[Math.min(10, Math.max(1, nivel))];
    return o.map((v) => v * pessoasMesa());
  }
  function dificuldade(xp, nivel) {
    const [b, m, a] = orcamento(nivel);
    if (xp < b) return 0;
    if (xp < m) return 1;
    if (xp < a) return 2;
    if (xp <= a * 1.25) return 3;
    return 4;
  }

  // Composição de um encontro: quantidades do livro + ajuste 5.5e
  // Base do livro: mesa de 4 personagens. Grupos de tamanho fixo (sem "por personagem") crescem
  // na proporção jogadores/4; chefes e criaturas nomeadas (fixo) não mudam. "Reforçado" multiplica por 1,5 os grupos não nomeados.
  function fatorGrupo(g, combate) {
    if (S.regras === "5e" || !combate || g.fixo) return 1;
    if (!["monstro", "animal"].includes(mini(g.m).tipo)) return 1;
    let f = 1;
    const porPersonagem = g.k || (g.lvl && Object.values(g.lvl).some((r) => r.k));
    if (!porPersonagem && S.jog > 4) f *= S.jog / 4;
    if (S.regras === "55f") f *= 1.5;
    return f;
  }

  function composicao(e, loc) {
    const nivel = nivelDe(loc);
    const base = {}, total = {}, extra = {};
    let xp = 0, xpLivro = 0;
    const combate = !e.paz && e.grupos.some((g) => xpGrupo(g) > 0);
    e.grupos.forEach((g) => {
      const q = qtd(g, nivel);
      const qf = Math.round(q * fatorGrupo(g, combate));
      base[g.m] = (base[g.m] || 0) + q;
      total[g.m] = (total[g.m] || 0) + qf;
      xpLivro += q * xpGrupo(g);
      xp += qf * xpGrupo(g);
    });
    for (const m in total) if (total[m] > (base[m] || 0)) extra[m] = total[m] - base[m];
    return { base, extra, total, xp, xpLivro, combate, nivel,
      difLivro: combate ? dificuldade(xpLivro, nivel) : null,
      dif: combate ? dificuldade(xp, nivel) : null };
  }

  function contagemEncontro(e, loc) {
    const t = composicao(e, loc).total, m = {};
    for (const k in t) if (tipoVisivel(k)) m[k] = t[k];
    return m;
  }

  // Quantas minis de cada tipo o local exige ao mesmo tempo
  function necessidadeLocal(loc) {
    const encs = encontrosDe(loc).filter(encLigado);
    const need = {};
    if (S.modo === "encontro") {
      encs.forEach((e) => {
        const c = contagemEncontro(e, loc);
        for (const k in c) need[k] = Math.max(need[k] || 0, c[k]);
      });
    } else {
      encs.filter((e) => !e.alt).forEach((e) => {
        const c = contagemEncontro(e, loc);
        for (const k in c) need[k] = (need[k] || 0) + c[k];
      });
      encs.filter((e) => e.alt).forEach((e) => {
        const c = contagemEncontro(e, loc);
        for (const k in c) need[k] = Math.max(need[k] || 0, c[k]);
      });
    }
    // Teto do local: o livro às vezes diz o total máximo de uma criatura no local inteiro
    (loc.teto || []).forEach((g) => { if (need[g.m]) need[g.m] = Math.min(need[g.m], Math.round(qtd(g, nivelDe(loc)) * (S.regras === "55f" ? 1.5 : 1))); });
    for (const k in need) if (!need[k]) delete need[k];
    return need;
  }

  // Plano incremental: percorre os locais pendentes na ordem e imprime só o que faltar
  function plano() {
    const tem = Object.assign({}, S.impressas);
    const etapas = [];
    S.ordem.forEach((id) => {
      const loc = local(id);
      const st = S.status[id] || "pendente";
      const need = necessidadeLocal(loc);
      const imprimir = {};
      if (st !== "concluido") {
        for (const m in need) {
          const falta = need[m] - (tem[m] || 0);
          if (falta > 0) { imprimir[m] = falta; tem[m] = need[m]; }
        }
      }
      etapas.push({ loc, st, need, imprimir });
    });
    return etapas;
  }

  function maximoCampanha(soPendentes) {
    const max = {};
    LOCAIS.forEach((loc) => {
      if (soPendentes && S.status[loc.id] === "concluido") return;
      const need = necessidadeLocal(loc);
      for (const m in need) max[m] = Math.max(max[m] || 0, need[m]);
    });
    return max;
  }

  const somaValores = (o) => Object.values(o).reduce((a, b) => a + b, 0);
  const ordenarMinis = (ids) => ids.sort((a, b) => mini(a).nome.localeCompare(mini(b).nome, "pt-BR"));

  // ---------- Utilitários de DOM ----------
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const tamBadge = (t) => `<span class="tam tam-${t}" title="${TAMANHOS[t]?.nome || t} — base ${TAMANHOS[t]?.base || "?"}">${TAMANHOS[t]?.nome || t}</span>`;
  const statusLabel = { pendente: "Pendente", atual: "Em andamento", concluido: "Concluído" };

  // ---------- Renderização ----------
  function render() {
    renderControles();
    renderResumo();
    const aba = S.aba || "locais";
    document.querySelectorAll(".abas button").forEach((b) => b.classList.toggle("ativo", b.dataset.aba === aba));
    document.querySelectorAll(".painel").forEach((p) => (p.hidden = p.id !== "painel-" + aba));
    if (aba === "locais") renderLocais();
    if (aba === "plano") renderPlano();
    if (aba === "inventario") renderInventario();
    if (aba === "dados") renderDados();
    if (aba === "balanco") renderBalanco();
    salvar();
  }

  function renderControles() {
    $("#jog").value = S.jog;
    $("#comp").value = S.comp;
    $("#regras").value = S.regras;

    document.querySelectorAll("input[name=modo]").forEach((r) => (r.checked = r.value === S.modo));
    const box = $("#tipos");
    box.innerHTML = Object.keys(TIPOS).map((t) =>
      `<label class="chip"><input type="checkbox" data-tipo="${t}" ${S.tipos[t] !== false ? "checked" : ""}> ${TIPOS[t]}</label>`
    ).join("");
  }

  function renderResumo() {
    const etapas = plano();
    const prox = etapas.find((e) => e.st === "atual") || etapas.find((e) => e.st === "pendente");
    const maxPend = maximoCampanha(true);
    let faltaTotal = 0;
    for (const m in maxPend) faltaTotal += Math.max(0, maxPend[m] - (S.impressas[m] || 0));
    const impressasTotal = somaValores(S.impressas);
    let proxHtml = "<p class='muted'>Todos os locais concluídos.</p>";
    if (prox) {
      const itens = ordenarMinis(Object.keys(prox.imprimir));
      proxHtml = `<p class="kicker">Próximo local: <strong>${esc(prox.loc.nome)}</strong></p>` + (itens.length
        ? `<ul class="lista-curta">${itens.map((m) => `<li><b>${prox.imprimir[m]}×</b> ${esc(mini(m).nome)} ${tamBadge(mini(m).tam)}</li>`).join("")}</ul>`
        : `<p class="ok">Nada a imprimir — você já tem tudo para este local.</p>`);
    }
    $("#resumo").innerHTML = `
      <div class="stat"><span class="num">${faltaTotal}</span><span class="lbl">minis faltando para o resto da campanha</span></div>
      <div class="stat"><span class="num">${impressasTotal}</span><span class="lbl">minis já impressas</span></div>
      <div class="prox">${proxHtml}</div>`;
  }

  function linhaNecessidade(m, n, imprimir) {
    const tem = S.impressas[m] || 0;
    const falta = Math.max(0, n - tem);
    return `<tr class="${falta ? "falta" : "ok-row"}">
      <td>${esc(mini(m).nome)}</td>
      <td>${tamBadge(mini(m).tam)}</td>
      <td class="n">${n}</td>
      <td class="n"><input type="number" min="0" class="inv" data-mini="${m}" value="${tem}" aria-label="Impressas de ${esc(mini(m).nome)}"></td>
      <td class="n">${falta ? `<b>${falta}</b>` : "✓"}</td>
      <td class="n">${imprimir ? `<b>${imprimir}</b>` : "—"}</td>
    </tr>`;
  }

  function renderLocais() {
    const etapas = plano();
    const el = $("#painel-locais");
    el.innerHTML = etapas.map((et, idx) => {
      const { loc, st, need } = et;
      const ids = ordenarMinis(Object.keys(need));
      const aberto = S.aberto[loc.id];
      const encs = encontrosDe(loc);
      const totalPrecisa = somaValores(need);
      const totalImprimir = somaValores(et.imprimir);
      return `<section class="local st-${st}" data-loc="${loc.id}">
        <header class="local-head">
          <div class="ordem-btns">
            <button class="icon" data-acao="subir" ${idx === 0 ? "disabled" : ""} aria-label="Subir">▲</button>
            <button class="icon" data-acao="descer" ${idx === etapas.length - 1 ? "disabled" : ""} aria-label="Descer">▼</button>
          </div>
          <div class="titulo">
            <h2>${idx + 1}. ${esc(loc.nome)}</h2>
            <p class="muted">Livro p. ${loc.pag}${loc.missao ? ` · missão ${loc.missao}` : ""} · ${totalPrecisa} minis no local${st !== "concluido" && totalImprimir ? ` · <b class="destaque">imprimir ${totalImprimir}</b>` : ""}</p>
          </div>
          <label class="nivel-local" title="Nível do grupo ao chegar aqui (padrão: nível para o qual o livro balanceou o local)">Nível
            <input type="number" min="1" max="10" data-nivel="${loc.id}" value="${nivelDe(loc)}"></label>
          <select class="status" data-acao="status" aria-label="Status do local">
            ${["pendente", "atual", "concluido"].map((s) => `<option value="${s}" ${s === st ? "selected" : ""}>${statusLabel[s]}</option>`).join("")}
          </select>
        </header>
        ${ids.length ? `<div class="tabela-wrap"><table>
          <thead><tr><th>Miniatura</th><th>Tamanho</th><th class="n">Precisa</th><th class="n">Impressas</th><th class="n">Faltam</th><th class="n" title="Considerando os locais anteriores no plano">Imprimir agora</th></tr></thead>
          <tbody>${ids.map((m) => linhaNecessidade(m, need[m], st === "concluido" ? 0 : et.imprimir[m])).join("")}</tbody>
        </table></div>` : `<p class="muted pad">Nenhuma miniatura com os filtros atuais.</p>`}
        <details ${aberto ? "open" : ""} data-acao="toggle">
          <summary>Encontros (${encs.filter(encLigado).length}/${encs.length} ativos)</summary>
          <ul class="encontros">
            ${encs.map((e) => {
              const comp = composicao(e, loc);
              const c = comp.base;
              let desc = Object.keys(c).filter((m) => c[m]).map((m) => `${c[m]}× ${esc(mini(m).nome)}`).join(", ") || "—";
              const ex = Object.keys(comp.extra);
              if (ex.length) desc += ` <span class="reforco">+ ${ex.map((m) => `${comp.extra[m]}× ${esc(mini(m).nome)}`).join(", ")} (5.5e)</span>`;
              if (comp.combate) desc += ` <span class="dif dif-${comp.dif}">${DIF[comp.dif]}</span>` +
                (S.regras !== "5e" && comp.difLivro !== comp.dif ? ` <span class="muted">(livro: ${DIF[comp.difLivro]})</span>` : "") +
                ` <span class="muted">· ${comp.xp.toLocaleString("pt-BR")} XP</span>` +
                (S.regras !== "5e" && e.dica ? `<div class="enc-nota aviso-txt">${esc(e.dica)}</div>` : "");
              return `<li class="${encLigado(e) ? "" : "off"}">
                <label><input type="checkbox" data-enc="${e.id}" ${encLigado(e) ? "checked" : ""}>
                <span class="enc-nome">${esc(e.nome)}</span>${e.alt ? ' <span class="tag">alternativo</span>' : ""}${e.opt ? ' <span class="tag">opcional</span>' : ""}${e.custom ? ' <span class="tag">seu</span>' : ""}</label>
                <div class="enc-desc">${desc}</div>
                ${e.nota ? `<div class="enc-nota">${esc(e.nota)}</div>` : ""}
                ${e.custom ? `<button class="link" data-del-enc="${e.id}">remover</button>` : ""}
              </li>`;
            }).join("")}
          </ul>
          ${formEncontro(loc.id)}
        </details>
      </section>`;
    }).join("");
  }

  function opcoesMinis() {
    const ids = ordenarMinis(Object.keys(MINIS).concat(Object.keys(S.customMinis)));
    return ids.map((m) => `<option value="${m}">${esc(mini(m).nome)}</option>`).join("");
  }

  function formEncontro(locId) {
    return `<form class="add-enc" data-loc="${locId}">
      <p class="kicker">Adicionar encontro próprio</p>
      <div class="linha">
        <input name="nome" placeholder="Nome (ex.: Robin na mina)" required>
        <select name="mini">${opcoesMinis()}</select>
        <label>fixo <input name="b" type="number" min="0" value="1"></label>
        <label>por jogador <input name="k" type="number" min="0" step="0.5" value="0"></label>
        <label>XP cada <input name="xp" type="number" min="0" value="0"></label>
        <label class="chk"><input name="comp" type="checkbox"> conta companheiros</label>
        <button type="submit">Adicionar</button>
      </div>
    </form>`;
  }

  function renderPlano() {
    const etapas = plano();
    let acumulado = {};
    const blocos = etapas.map((et, idx) => {
      if (et.st === "concluido") {
        return `<li class="etapa concl"><span class="passo">${idx + 1}</span><div><h3>${esc(et.loc.nome)}</h3><p class="muted">Concluído — ignorado no plano.</p></div></li>`;
      }
      const ids = ordenarMinis(Object.keys(et.imprimir));
      for (const m of ids) acumulado[m] = (acumulado[m] || 0) + et.imprimir[m];
      return `<li class="etapa"><span class="passo">${idx + 1}</span><div>
        <h3>${esc(et.loc.nome)} ${et.st === "atual" ? '<span class="tag">em andamento</span>' : ""}</h3>
        ${ids.length
          ? `<ul class="lista-curta">${ids.map((m) => `<li><b>${et.imprimir[m]}×</b> ${esc(mini(m).nome)} ${tamBadge(mini(m).tam)} <span class="muted">(fica com ${et.need[m]})</span></li>`).join("")}</ul>`
          : `<p class="ok">Nada novo — reaproveita o que já foi impresso.</p>`}
      </div></li>`;
    });
    const tot = ordenarMinis(Object.keys(acumulado));
    $("#painel-plano").innerHTML = `
      <p class="intro">Ordem dos locais igual à aba <b>Por local</b> (use ▲▼ para mudar). Cada etapa mostra só o que <b>falta</b> imprimir além do que você já tem e do que foi impresso nas etapas anteriores.</p>
      <ol class="plano">${blocos.join("")}</ol>
      <h3>Total ainda a imprimir</h3>
      ${tot.length ? `<div class="tabela-wrap"><table><thead><tr><th>Miniatura</th><th>Tamanho</th><th class="n">Quantidade</th></tr></thead><tbody>
        ${tot.map((m) => `<tr><td>${esc(mini(m).nome)}</td><td>${tamBadge(mini(m).tam)}</td><td class="n"><b>${acumulado[m]}</b></td></tr>`).join("")}
        <tr class="total"><td colspan="2">Total</td><td class="n">${somaValores(acumulado)}</td></tr></tbody></table></div>`
        : `<p class="ok">Você já tem todas as miniaturas necessárias.</p>`}
      <button onclick="window.print()" class="secundario">Imprimir esta lista</button>`;
  }

  // Links de STL: indicações do data.js + busca no Thingiverse como reserva
  function urlStl(ref) {
    const [site, id] = ref.split(":");
    return site === "p" ? `https://www.printables.com/model/${id}` : `https://www.thingiverse.com/thing:${id}`;
  }
  function linksStl(m) {
    const info = (typeof STL !== "undefined" && STL[m]) || {};
    const fontes = (info.f || []).map(([ref, nome]) =>
      `<a href="${urlStl(ref)}" target="_blank" rel="noopener">${esc(nome)}</a>`);
    const termo = info.en || mini(m).nome;
    fontes.push(`<a class="busca" href="https://www.thingiverse.com/search?q=${encodeURIComponent(termo + " miniature")}&type=things" target="_blank" rel="noopener">buscar</a>`);
    return fontes.join(" · ");
  }

  const NPCS_UNICOS = ["falcon", "donjon", "adabra", "alfonso", "pell", "toblen", "dobin", "tibor", "corwin", "harbin", "elmar", "linene", "halia"];
  const pastaStl = (m) => (mini(m).tipo === "companheiro" ? `companheiros/${m}` : NPCS_UNICOS.includes(m) ? `npcs/${m}` : m);

  function renderInventario() {
    const maxTot = maximoCampanha(false);
    const maxPend = maximoCampanha(true);
    const ids = ordenarMinis(Array.from(new Set(Object.keys(maxTot).concat(Object.keys(S.impressas).filter((m) => S.impressas[m])))));
    const porTipo = {};
    ids.forEach((m) => { (porTipo[mini(m).tipo] = porTipo[mini(m).tipo] || []).push(m); });
    $("#painel-inventario").innerHTML = `
      <p class="intro"><b>Pico</b> = maior quantidade exigida ao mesmo tempo em um único local. É o máximo que você precisa ter impresso, mesmo que a criatura apareça em vários locais.</p>
      <p class="intro"><b>STL</b>: indicações gratuitas (Thingiverse/Printables), com preferência pelos modelos do sergeantr feitos a partir das minis do Essentials Kit e pelos do MZ4250. Confira a licença na página antes de baixar. Salve na pasta <code>stl/&lt;nome-da-mini&gt;</code> do projeto (fica fora do git).</p>
      ${Object.keys(TIPOS).filter((t) => porTipo[t]).map((t) => `
        <h3>${TIPOS[t]}</h3>
        <div class="tabela-wrap"><table>
          <thead><tr><th>Miniatura</th><th>Tamanho</th><th>Onde aparece</th><th class="n">Pico (campanha)</th><th class="n">Pico (pendentes)</th><th class="n">Impressas</th><th class="n">Faltam</th><th>STL (gratuito)</th><th class="n" title="Marque quando o STL já estiver baixado na sua pasta">Baixado</th></tr></thead>
          <tbody>${porTipo[t].map((m) => {
            const tem = S.impressas[m] || 0;
            const falta = Math.max(0, (maxPend[m] || 0) - tem);
            const onde = LOCAIS.filter((l) => necessidadeLocal(l)[m]).map((l) => `${l.nome} (${necessidadeLocal(l)[m]})`).join(", ");
            return `<tr class="${falta ? "falta" : "ok-row"}"><td>${esc(mini(m).nome)}<div class="pasta"><code>stl/${pastaStl(m)}</code></div>${mini(m).obs ? `<div class="enc-nota">${esc(mini(m).obs)}</div>` : ""}</td><td>${tamBadge(mini(m).tam)}</td>
              <td class="onde">${esc(onde) || "—"}</td><td class="n">${maxTot[m] || 0}</td><td class="n">${maxPend[m] || 0}</td>
              <td class="n"><input type="number" min="0" class="inv" data-mini="${m}" value="${tem}"></td>
              <td class="n">${falta ? `<b>${falta}</b>` : "✓"}</td>
              <td class="stl">${linksStl(m)}</td>
              <td class="n"><input type="checkbox" class="stl-ok" data-mini="${m}" ${S.stlOk[m] ? "checked" : ""} aria-label="STL de ${esc(mini(m).nome)} baixado"></td></tr>`;
          }).join("")}</tbody></table></div>`).join("")}`;
  }

  function renderBalanco() {
    const linhas = [];
    S.ordem.forEach((id) => {
      const loc = local(id);
      encontrosDe(loc).forEach((e) => {
        const c = composicao(e, loc);
        if (!c.combate) return;
        linhas.push({ loc, e, c, on: encLigado(e) });
      });
    });
    const n = pessoasMesa();
    $("#painel-balanco").innerHTML = `
      <p class="intro">Dificuldade de cada combate pelas regras de encontro do <b>Livro do Mestre 2024</b>: soma do XP dos inimigos comparada ao orçamento por personagem × <b>${n}</b> (jogadores + companheiros), no nível indicado para cada local. Em 2024 não existe mais multiplicador por quantidade de monstros.</p>
      <p class="intro">Ajuste atual: <b>${ {"5e": "livro 5e, sem ajuste", "55": "5.5e — mesa grande", "55f": "5.5e — reforçado"}[S.regras] }</b>. Os reforços entram nas contagens de impressão.</p>
      <p class="intro">Use os rótulos como termômetro, não como meta: o Livro do Mestre 2024 mede um combate isolado, e esta aventura desgasta o grupo com várias salas seguidas no mesmo dia. Uma sala "Baixa" em Axeholm é normal; o perigo está na soma.</p>
      <div class="tabela-wrap"><table class="balanco">
        <thead><tr><th>Local</th><th>Encontro</th><th class="n">Nível</th><th class="n">XP livro</th><th>Livro</th><th>Reforço 5.5e</th><th class="n">XP final</th><th>Final</th></tr></thead>
        <tbody>${linhas.map(({ loc, e, c, on }) => `<tr class="${on ? "" : "off"}">
          <td>${esc(loc.nome)}</td><td>${esc(e.nome)}${on ? "" : " <span class='tag'>desligado</span>"}</td><td class="n">${c.nivel}</td>
          <td class="n">${c.xpLivro.toLocaleString("pt-BR")}</td><td><span class="dif dif-${c.difLivro}">${DIF[c.difLivro]}</span></td>
          <td>${Object.keys(c.extra).map((m) => `+${c.extra[m]} ${esc(mini(m).nome)}`).join(", ") || "—"}${S.regras !== "5e" && e.dica ? `<div class="enc-nota aviso-txt">${esc(e.dica)}</div>` : ""}</td>
          <td class="n">${c.xp.toLocaleString("pt-BR")}</td><td><span class="dif dif-${c.dif}">${DIF[c.dif]}</span></td></tr>`).join("")}</tbody>
      </table></div>
      <h3>Ressalvas para jogar em 5.5e (regras 2024)</h3>
      <ul class="explica">
        <li><b>A aventura é compatível.</b> As regras de 2024 usam os mesmos blocos de estatísticas de 2014; não é preciso converter nada para jogar. O ajuste aqui é de dificuldade, não de regras.</li>
        <li><b>Mesa grande.</b> O livro foi feito para 1 a 5 jogadores. Os encontros com fórmula "por personagem" já crescem com a mesa, mas os encontros com quantidade fixa (manticora, banshee, gosma, verme, mímico, espreitador, Cryovain) ficam fáceis com 6 personagens.</li>
        <li><b>Como o ajuste funciona.</b> O livro assume uma mesa típica de 4 personagens. Grupos com fórmula "por personagem" já crescem sozinhos. Grupos de tamanho fixo (ex.: 3 fogos-fátuos, 5 ratos gigantes) são multiplicados por jogadores ÷ 4. Chefes e criaturas nomeadas não são multiplicados; para eles há dicas específicas.</li>
        <li><b>Personagens 2024 são mais fortes</b> no começo do jogo (maestria em armas, talentos de origem, truques mais fortes, Inspiração Heroica). Se o grupo estiver atropelando as lutas, use <b>5.5e — reforçado</b> (+50% nos grupos não nomeados).</li>
        <li><b>Chefes sozinhos sofrem com a economia de ações</b>: 6 personagens agem 6 vezes contra 1. Para Cryovain, Gorthok, a banshee e o espreitador invisível, use PV máximo (Cryovain: 196) e dê uma reação ou ação extra por rodada, ou junte o chefe a outro encontro (ex.: Flenz e Narux junto com Gorthok).</li>
        <li><b>Monster Manual 2025</b>: o Orc não existe mais como monstro (o equivalente é o <i>Tough</i>), o Veterano virou <i>Warrior Veteran</i> e o Centauro virou <i>Centaur Trooper</i>. Os demais foram revisados, em geral com mais dano. Usar os blocos do livro da aventura funciona; trocar pelos de 2025 deixa as lutas um pouco mais duras.</li>
        <li><b>Descansos curtos 2024</b> são mais curtos e há mais cura disponível: lugares com várias salas (Axeholm, Mansão, Mina) ficam mais fáceis de atravessar. Prefira o modo "Local inteiro" para as impressões: monstros vizinhos tendem a se juntar.</li>
        <li><b>Progressão</b>: o ritmo de nível do livro não depende do número de jogadores. Ajuste o nível de cada local no cabeçalho dele se o seu grupo estiver acima ou abaixo do previsto.</li>
      </ul>`;
  }

  function renderDados() {
    const custom = Object.keys(S.customMinis);
    $("#painel-dados").innerHTML = `
      <h3>Minis personalizadas</h3>
      <p class="intro">Para criaturas e NPCs da sua mesa que não estão no livro (ex.: Robin, familiares). Depois adicione um encontro próprio no local desejado.</p>
      <form id="add-mini" class="linha">
        <input name="nome" placeholder="Nome da mini" required>
        <select name="tam">${Object.keys(TAMANHOS).map((t) => `<option value="${t}" ${t === "M" ? "selected" : ""}>${TAMANHOS[t].nome}</option>`).join("")}</select>
        <button type="submit">Criar mini</button>
      </form>
      ${custom.length ? `<ul class="lista-curta">${custom.map((id) => `<li>${esc(mini(id).nome)} ${tamBadge(mini(id).tam)} <button class="link" data-del-mini="${id}">remover</button></li>`).join("")}</ul>` : ""}
      <h3>Backup</h3>
      <p class="intro">Os dados ficam salvos neste navegador. Exporte para guardar ou levar para outro computador.</p>
      <div class="linha">
        <button id="exportar">Exportar JSON</button>
        <label class="botao secundario">Importar JSON <input type="file" id="importar" accept="application/json" hidden></label>
        <button id="resetar" class="perigo">Restaurar padrão</button>
      </div>
      <h3>Como as quantidades são calculadas</h3>
      <ul class="explica">
        <li>Cada encontro segue a fórmula do livro, por exemplo "três orcs por personagem, sem incluir companheiros". O campo <b>Companheiros</b> só entra nos encontros que o livro manda contar.</li>
        <li><b>Modo "local inteiro"</b>: soma todos os encontros ativos do local, como se todos pudessem estar na mesa juntos. Mais seguro.</li>
        <li><b>Modo "maior encontro"</b>: considera só o maior encontro de cada criatura no local. Mais econômico, se você limpa a mesa entre as salas.</li>
        <li>Encontros <b>alternativos</b> (ex.: o alarme de Axeholm que junta todos os carniçais) substituem os das salas em vez de somar.</li>
        <li>Entre locais diferentes nada se soma: as minis do rancho voltam para a caixa e servem na mina. Por isso o plano imprime só a diferença.</li>
        <li>Locais marcados como <b>Concluído</b> saem do cálculo do que falta.</li>
      </ul>`;
  }

  // ---------- Eventos ----------
  function bind() {
    $("#jog").addEventListener("input", (e) => { S.jog = Math.max(1, +e.target.value || 1); render(); });
    $("#comp").addEventListener("input", (e) => { S.comp = Math.max(0, +e.target.value || 0); render(); });
    $("#regras").addEventListener("change", (e) => { S.regras = e.target.value; render(); });

    document.querySelectorAll("input[name=modo]").forEach((r) => r.addEventListener("change", (e) => { S.modo = e.target.value; render(); }));
    $("#tipos").addEventListener("change", (e) => { const t = e.target.dataset.tipo; if (t) { S.tipos[t] = e.target.checked; render(); } });
    document.querySelectorAll(".abas button").forEach((b) => b.addEventListener("click", () => { S.aba = b.dataset.aba; render(); }));

    document.body.addEventListener("change", (e) => {
      const t = e.target;
      if (t.classList.contains("stl-ok")) {
        S.stlOk[t.dataset.mini] = t.checked; salvar(); return;
      }
      if (t.classList.contains("inv")) {
        S.impressas[t.dataset.mini] = Math.max(0, +t.value || 0);
        render();
      } else if (t.dataset.nivel) {
        S.nivelLocal[t.dataset.nivel] = Math.min(10, Math.max(1, +t.value || 1)); render();
      } else if (t.dataset.enc) {
        S.enc[t.dataset.enc] = t.checked; render();
      } else if (t.dataset.acao === "status") {
        S.status[t.closest(".local").dataset.loc] = t.value; render();
      } else if (t.id === "importar" && t.files[0]) {
        t.files[0].text().then((txt) => { S = normalizar(JSON.parse(txt)); render(); }).catch(() => alertar("Arquivo inválido."));
      }
    });

    document.body.addEventListener("toggle", (e) => {
      if (e.target.dataset && e.target.dataset.acao === "toggle") {
        S.aberto[e.target.closest(".local").dataset.loc] = e.target.open; salvar();
      }
    }, true);

    document.body.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      const sec = t.closest(".local");
      if (t.dataset.acao === "subir" || t.dataset.acao === "descer") {
        const id = sec.dataset.loc, i = S.ordem.indexOf(id), j = t.dataset.acao === "subir" ? i - 1 : i + 1;
        if (j >= 0 && j < S.ordem.length) { [S.ordem[i], S.ordem[j]] = [S.ordem[j], S.ordem[i]]; render(); }
      } else if (t.dataset.delEnc) {
        S.customEnc = S.customEnc.filter((x) => x.id !== t.dataset.delEnc); render();
      } else if (t.dataset.delMini) {
        delete S.customMinis[t.dataset.delMini];
        S.customEnc.forEach((x) => (x.grupos = x.grupos.filter((g) => g.m !== t.dataset.delMini)));
        S.customEnc = S.customEnc.filter((x) => x.grupos.length);
        render();
      } else if (t.id === "exportar") {
        const blob = new Blob([JSON.stringify(S, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "miniaturas-espiral-de-gelo.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      } else if (t.id === "resetar") {
        if (t.dataset.confirmar) { S = estadoPadrao(); S.aba = "dados"; render(); }
        else { t.dataset.confirmar = "1"; t.textContent = "Clique de novo para confirmar"; }
      }
    });

    document.body.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const d = new FormData(f);
      if (f.id === "add-mini") {
        const id = "c_" + Date.now().toString(36);
        S.customMinis[id] = { nome: d.get("nome").trim(), tam: d.get("tam"), tipo: "custom" };
        render();
      } else if (f.classList.contains("add-enc")) {
        S.customEnc.push({
          id: "ce_" + Date.now().toString(36), loc: f.dataset.loc, custom: true,
          nome: d.get("nome").trim(),
          grupos: [Object.assign({ m: d.get("mini"), b: +d.get("b") || 0, k: +d.get("k") || 0, comp: !!d.get("comp") }, +d.get("xp") ? { xp: +d.get("xp") } : {})],
        });
        S.aberto[f.dataset.loc] = true;
        render();
      }
    });
  }

  function alertar(msg) {
    const el = $("#aviso");
    el.textContent = msg; el.hidden = false;
    setTimeout(() => (el.hidden = true), 4000);
  }

  // Exposto para testes
  window.__miniaturas = { qtd, necessidadeLocal, plano, maximoCampanha, get estado() { return S; }, set estado(v) { S = normalizar(v); render(); } };

  bind();
  render();
})();
