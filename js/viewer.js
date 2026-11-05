/*
 * Visualizador de STL local.
 * Os STLs não vão para o git: a página lê direto da pasta stl/ do seu computador
 * (File System Access API — Chrome/Edge). Nada é enviado para a internet.
 * Em navegadores sem essa API, dá para abrir arquivos .stl avulsos.
 */
(() => {
  "use strict";

  const DB = "dragao-miniaturas", STORE = "handles", KEY = "pasta-stl";
  const suportaPasta = "showDirectoryPicker" in window;
  let raiz = null;

  // ---------- IndexedDB (guarda a pasta escolhida entre visitas) ----------
  function idb(modo, fn) {
    return new Promise((ok, erro) => {
      let req;
      try { req = indexedDB.open(DB, 1); } catch (e) { return erro(e); }
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onerror = () => erro(req.error);
      req.onsuccess = () => {
        const tx = req.result.transaction(STORE, modo);
        const r = fn(tx.objectStore(STORE));
        tx.oncomplete = () => ok(r && r.result);
        tx.onerror = () => erro(tx.error);
      };
    });
  }
  const guardar = (h) => idb("readwrite", (s) => s.put(h, KEY)).catch(() => {});
  const recuperar = () => idb("readonly", (s) => s.get(KEY)).catch(() => null);

  async function permissao(h, pedir) {
    const o = { mode: "read" };
    if ((await h.queryPermission(o)) === "granted") return true;
    return pedir && (await h.requestPermission(o)) === "granted";
  }

  // ---------- Pasta ----------
  async function conectar() {
    if (!suportaPasta) throw new Error("Este navegador não permite escolher pastas. Use Chrome ou Edge, ou abra arquivos avulsos.");
    const h = await window.showDirectoryPicker({ id: "stl", mode: "read" });
    raiz = h;
    await guardar(h);
    return h.name;
  }

  // Tenta reaproveitar a pasta da última visita. pedir=true só dentro de um clique.
  async function restaurar(pedir) {
    if (raiz) return raiz.name;
    if (!suportaPasta) return null;
    const h = await recuperar();
    if (!h) return null;
    if (await permissao(h, pedir)) { raiz = h; return h.name; }
    return { pendente: h.name };
  }

  async function subpasta(caminho) {
    let d = raiz;
    for (const parte of caminho.split("/").filter(Boolean)) {
      try { d = await d.getDirectoryHandle(parte); } catch (e) { return null; }
    }
    return d;
  }

  async function listarStl(dir, prefixo = "", prof = 0, out = []) {
    if (!dir || prof > 4) return out;
    for await (const [nome, h] of dir.entries()) {
      if (h.kind === "file" && /\.stl$/i.test(nome)) out.push({ nome: prefixo + nome, h });
      else if (h.kind === "directory") await listarStl(h, prefixo + nome + "/", prof + 1, out);
    }
    return out.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  async function arquivosDe(caminho) {
    if (!raiz) return [];
    return listarStl(await subpasta(caminho));
  }

  // Conta quantos STLs existem em cada pasta de mini
  async function escanear(caminhos) {
    const res = {};
    for (const c of caminhos) res[c] = (await arquivosDe(c)).length;
    return res;
  }

  // ---------- Renderização 3D ----------
  let cena, camera, renderer, controles, malha, anim;

  function iniciar3d(canvas) {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    cena = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 5000);
    cena.add(new THREE.HemisphereLight(0xffffff, 0x445566, 0.9));
    const luz = new THREE.DirectionalLight(0xffffff, 0.8);
    luz.position.set(1, 2, 1.5);
    camera.add(luz);
    cena.add(camera);
    controles = new THREE.OrbitControls(camera, canvas);
    controles.enableDamping = true;
    const loop = () => { anim = requestAnimationFrame(loop); ajustarTamanho(); controles.update(); renderer.render(cena, camera); };
    loop();
  }

  function ajustarTamanho() {
    const c = renderer.domElement;
    const w = c.clientWidth, h = c.clientHeight;
    if (c.width !== Math.round(w * renderer.getPixelRatio()) || c.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h || 1;
      camera.updateProjectionMatrix();
    }
  }

  function mostrarGeometria(buffer) {
    const geo = new THREE.STLLoader().parse(buffer);
    geo.computeVertexNormals();
    geo.center();
    // STLs costumam vir com Z para cima
    geo.rotateX(-Math.PI / 2);
    geo.computeBoundingBox();
    const tam = new THREE.Vector3();
    geo.boundingBox.getSize(tam);
    if (malha) { cena.remove(malha); malha.geometry.dispose(); }
    const cor = getComputedStyle(document.documentElement).getPropertyValue("--resina").trim() || "#8d9aa0";
    malha = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cor, roughness: 0.6, metalness: 0.05 }));
    cena.add(malha);
    const r = Math.max(tam.x, tam.y, tam.z) || 1;
    camera.position.set(r * 1.4, r * 1.0, r * 1.8);
    controles.target.set(0, 0, 0);
    controles.update();
    return tam;
  }

  // ---------- Modal ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  async function abrir(titulo, caminho) {
    fechar();
    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";
    fundo.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-label="${esc(titulo)}">
        <header><h3>${esc(titulo)}</h3><button class="icon fechar" aria-label="Fechar">✕</button></header>
        <div class="modal-corpo">
          <aside class="lista-stl"><p class="muted">Carregando…</p></aside>
          <div class="palco"><canvas></canvas><p class="medidas muted"></p></div>
        </div>
      </div>`;
    document.body.appendChild(fundo);
    fundo.addEventListener("click", (e) => { if (e.target === fundo || e.target.closest(".fechar")) fechar(); });
    document.addEventListener("keydown", tecla);
    iniciar3d(fundo.querySelector("canvas"));

    const lista = fundo.querySelector(".lista-stl");
    const medidas = fundo.querySelector(".medidas");
    const carregar = async (arquivo, botao) => {
      lista.querySelectorAll("button").forEach((b) => b.classList.toggle("ativo", b === botao));
      medidas.textContent = "Carregando…";
      try {
        const buf = await arquivo.arrayBuffer();
        const t = mostrarGeometria(buf);
        medidas.textContent = `${t.x.toFixed(1)} × ${t.z.toFixed(1)} × ${t.y.toFixed(1)} mm (L × P × A). Arraste para girar e role para dar zoom.`;
      } catch (e) {
        medidas.textContent = "Não foi possível ler este arquivo.";
      }
    };

    let arquivos = [];
    if (raiz) {
      try { arquivos = await arquivosDe(caminho); } catch (e) { arquivos = []; }
    }
    const avulso = `<label class="botao secundario">Abrir .stl do computador<input type="file" accept=".stl" multiple hidden></label>`;
    if (!arquivos.length) {
      lista.innerHTML = `<p class="muted">${raiz ? `Nenhum .stl em <code>stl/${esc(caminho)}</code>.` : "Pasta stl/ não conectada."}</p>${avulso}`;
    } else {
      lista.innerHTML = `<p class="kicker">${arquivos.length} arquivo(s) em <code>stl/${esc(caminho)}</code></p>` +
        arquivos.map((a, i) => `<button class="item" data-i="${i}">${esc(a.nome)}</button>`).join("") + avulso;
    }
    lista.addEventListener("click", async (e) => {
      const b = e.target.closest("button.item");
      if (b) carregar(await arquivos[+b.dataset.i].h.getFile(), b);
    });
    lista.addEventListener("change", (e) => {
      const fs = [...(e.target.files || [])];
      if (!fs.length) return;
      arquivos = fs.map((f) => ({ nome: f.name, h: { getFile: async () => f } }));
      lista.querySelectorAll("button.item").forEach((b) => b.remove());
      lista.insertAdjacentHTML("afterbegin", arquivos.map((a, i) => `<button class="item" data-i="${i}">${esc(a.nome)}</button>`).join(""));
      carregar(fs[0], lista.querySelector("button.item"));
    });
    if (arquivos.length) carregar(await arquivos[0].h.getFile(), lista.querySelector("button.item"));
  }

  function tecla(e) { if (e.key === "Escape") fechar(); }

  function fechar() {
    const f = document.querySelector(".modal-fundo");
    if (!f) return;
    cancelAnimationFrame(anim);
    if (malha) { malha.geometry.dispose(); malha = null; }
    if (renderer) { renderer.dispose(); renderer = null; }
    document.removeEventListener("keydown", tecla);
    f.remove();
  }

  window.Visualizador = { suportaPasta, conectar, restaurar, escanear, abrir, conectado: () => !!raiz, nome: () => raiz && raiz.name,
    _usar: (h) => { raiz = h; } }; // _usar: só para testes automatizados
})();
