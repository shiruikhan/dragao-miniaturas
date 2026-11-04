/*
 * Dados extraídos de "O Dragão da Espiral de Gelo" (D&D 5e, Essentials Kit).
 * Fonte: dragao-espiral-de-gelo-v2.md (transcrição do PDF em português, conferida com o PDF em inglês).
 *
 * Fórmula de quantidade de cada grupo:
 *   q = b + k × (jogadores + (comp ? companheiros : 0))     limitada a "max" quando houver
 * "lvl" substitui k e b conforme o nível do local (Santuário de Savras).
 * xp = XP do bloco de estatísticas (2014). paz:true = encontro sem combate.
 * fixo:true = grupo que não cresce no ajuste 5.5e (chefes, criaturas nomeadas, sentinelas).
 * dica = sugestão de ajuste para 5.5e quando não faz sentido adicionar minis.
 * nivel (do local) = nível para o qual o livro balanceou o local.
 * Encontros com opt:true começam desligados (são eventos condicionais).
 * Encontros com alt:true são alternativos aos demais (ex.: alarme de Axeholm) e não somam com o resto do local.
 */

// Tamanhos: Min = Minúsculo, P = Pequeno, M = Médio, G = Grande, E = Enorme
const MINIS = {
  // Monstros e criaturas
  anacoreta:     { nome: "Anacoreta de Talos (meio-orc)", tam: "M", tipo: "monstro", pag: 51, xp: 700 },
  ankheg:        { nome: "Ankheg", tam: "G", tipo: "monstro", pag: 51, obs: "O PDF PT diz Médio; o original é Grande.", xp: 450 },
  aranha:        { nome: "Aranha Gigante", tam: "G", tipo: "monstro", pag: 52, xp: 200 },
  banshee:       { nome: "Banshee", tam: "M", tipo: "monstro", pag: 52, xp: 1100 },
  caranguejo:    { nome: "Caranguejo Gigante", tam: "M", tipo: "monstro", pag: 53, xp: 25 },
  carnical:      { nome: "Carniçal (anão)", tam: "M", tipo: "monstro", pag: 53, xp: 200 },
  cavalo:        { nome: "Cavalo de Montaria", tam: "G", tipo: "animal", pag: 53, xp: 50 },
  cavalo_esq:    { nome: "Cavalo Esquelético", tam: "G", tipo: "monstro", pag: 53, xp: 50 },
  centauro:      { nome: "Centauro (Xanth)", tam: "G", tipo: "npc", pag: 54, xp: 450, obs: "5.5e: equivalente no MM 2025 é o Centaur Trooper." },
  cryovain:      { nome: "Cryovain, Dragão Branco Jovem", tam: "G", tipo: "monstro", pag: 55, xp: 2300 },
  espreitador:   { nome: "Espreitador Invisível", tam: "M", tipo: "monstro", pag: 55, obs: "Invisível — pode ser um marcador.", xp: 2300 },
  fogo_fatuo:    { nome: "Fogo-Fátuo", tam: "Min", tipo: "monstro", pag: 56, xp: 450 },
  gnomo:         { nome: "Gnomo das Rochas Recluso", tam: "P", tipo: "npc", pag: 57, xp: 50 },
  gorthok:       { nome: "Gorthok, o Javali do Trovão", tam: "E", tipo: "monstro", pag: 57, xp: 2300 },
  gosma:         { nome: "Gosma Ocre", tam: "G", tipo: "monstro", pag: 58, xp: 450 },
  harpia:        { nome: "Harpia", tam: "M", tipo: "monstro", pag: 58, xp: 200 },
  homem_rato:    { nome: "Homem-Rato", tam: "M", tipo: "monstro", pag: 59, xp: 450 },
  javali:        { nome: "Javali", tam: "M", tipo: "animal", pag: 59, xp: 50 },
  manticora:     { nome: "Manticora", tam: "G", tipo: "monstro", pag: 60, xp: 700 },
  mimico:        { nome: "Mímico (barril)", tam: "M", tipo: "monstro", pag: 60, xp: 450 },
  ogro:          { nome: "Ogro", tam: "G", tipo: "monstro", pag: 61, xp: 450 },
  orc:           { nome: "Orc", tam: "M", tipo: "monstro", pag: 61, xp: 100, obs: "5.5e: o Monster Manual 2025 não tem Orc; o equivalente é o Tough (Brutamontes)." },
  ramo_espetos:  { nome: "Ramo de Espetos", tam: "M", tipo: "monstro", pag: 62, xp: 50 },
  ramo_galhos:   { nome: "Ramo de Galhos", tam: "P", tipo: "monstro", pag: 62, xp: 25 },
  ramo_vinhas:   { nome: "Ramo de Vinhas", tam: "M", tipo: "monstro", pag: 62, xp: 100 },
  rato:          { nome: "Rato Gigante", tam: "P", tipo: "monstro", pag: 63, xp: 25 },
  stirge:        { nome: "Stirge", tam: "Min", tipo: "monstro", pag: 63, xp: 25 },
  tubarao:       { nome: "Tubarão-Caçador", tam: "G", tipo: "monstro", pag: 63, xp: 450 },
  vaca:          { nome: "Vaca / Boi", tam: "G", tipo: "animal", pag: 64, xp: 50 },
  verme:         { nome: "Verme da Carniça", tam: "G", tipo: "monstro", pag: 64, xp: 450 },
  veterano:      { nome: "Veterano (Sicário Frio)", tam: "M", tipo: "monstro", pag: 64, xp: 700, obs: "5.5e: equivalente no MM 2025 é o Warrior Veteran." },
  anao:          { nome: "Anão plebeu (garimpeiro/minerador)", tam: "M", tipo: "npc", pag: 61, xp: 10 },

  // NPCs únicos
  falcon:        { nome: "Falcon, o Caçador", tam: "M", tipo: "npc", pag: 56, xp: 1100 },
  donjon:        { nome: "Don-Jon Raskin", tam: "M", tipo: "npc", pag: 54, xp: 100 },
  adabra:        { nome: "Adabra Gwynn", tam: "M", tipo: "npc", pag: 61, xp: 10 },
  tibor:         { nome: "Tibor Wester", tam: "M", tipo: "npc", pag: 61, xp: 10 },
  alfonso:       { nome: "Alfonso \"Fonsão\" Kalazorn", tam: "M", tipo: "npc", pag: 64, xp: 700 },
  corwin:        { nome: "Corwin (cozinheiro)", tam: "M", tipo: "npc" },
  pell:          { nome: "Pell (cavalariço)", tam: "M", tipo: "npc" },
  harbin:        { nome: "Harbin Wester", tam: "M", tipo: "npc" },
  toblen:        { nome: "Toblen Colina Rochosa", tam: "M", tipo: "npc" },
  elmar:         { nome: "Elmar Barthen", tam: "M", tipo: "npc" },
  linene:        { nome: "Linene Vento Cinza", tam: "M", tipo: "npc" },
  halia:         { nome: "Halia Thornton", tam: "M", tipo: "npc" },
  dobin:         { nome: "Dobin Noreth (Sicário Frio)", tam: "M", tipo: "npc", pag: 64, xp: 700 },

  // Companheiros (cartas)
  sk_donnabella: { nome: "Donnabella Fiasco", tam: "M", tipo: "companheiro" },
  sk_nib:        { nome: "Nib Addlespur", tam: "P", tipo: "companheiro" },
  sk_ruby:       { nome: "Ruby Hammerwhacker", tam: "M", tipo: "companheiro" },
  sk_galandro:   { nome: "Galandro Luna", tam: "M", tipo: "companheiro" },
  sk_pete:       { nome: "Pickled Pete", tam: "M", tipo: "companheiro" },
  sk_kwan:       { nome: "Shanjan Kwan", tam: "M", tipo: "companheiro" },
  sk_inverna:    { nome: "Inverna Nightbreeze", tam: "M", tipo: "companheiro" },
  sk_quinn:      { nome: "Quinn Hightopple", tam: "P", tipo: "companheiro" },
  sk_talon:      { nome: "Talon Thornwild", tam: "M", tipo: "companheiro" },
};

const LOCAIS = [
  {
    id: "phandalin", nome: "Phandalin", pag: 8, nivel: 6,
    encontros: [
      { id: "ph_npcs", paz: true, nome: "Moradores", grupos: [
        { m: "harbin", b: 1 }, { m: "toblen", b: 1 }, { m: "elmar", b: 1 },
        { m: "linene", b: 1 }, { m: "halia", b: 1 },
      ], nota: "Irmã Garaele está fora da cidade durante a aventura. Harbin só fala através da porta." },
      { id: "ph_orcs", nome: "Gancho: ataque de orcs à cidade", opt: true, grupos: [{ m: "orc", b: 12 }],
        nota: "Uma dúzia de orcs ataca Phandalin (Encontrando a Fortaleza)." },
      { id: "ph_dobin", paz: true, nome: "Gancho: Sorte de Tymora", opt: true, grupos: [{ m: "dobin", b: 1 }, { m: "cavalo", b: 1 }],
        nota: "Dobin Noreth chega no cavalo Trevo de Quatro Folhas." },
    ],
  },
  {
    id: "escavacao", nome: "Escavação dos Anões", pag: 24, nivel: 1, missao: "inicial",
    encontros: [
      { id: "es_e3", paz: true, nome: "E3. Pátio — Dazlyn e Norbus", grupos: [{ m: "anao", b: 2 }] },
      { id: "es_gosma", dica: "5.5e: a gosma se divide com dano cortante/elétrico; com 6 personagens isso já cria vários alvos. Tenha 2–3 minis extras de gosma (ou marcadores) para as divisões.", nome: "E5/E7. Gosma ocre", grupos: [{ m: "gosma", b: 1, fixo: true }] },
      { id: "es_orcs", nome: "Quando os Orcs Atacam (E1)", grupos: [{ m: "orc", k: 1, comp: true }],
        nota: "Um orc por personagem, incluindo companheiros." },
    ],
  },
  {
    id: "gruta", nome: "Gruta dos Gnomos", pag: 30, nivel: 1, missao: "inicial",
    encontros: [
      { id: "gr_g4", paz: true, nome: "G4. Cozinha", grupos: [{ m: "gnomo", b: 5 }] },
      { id: "gr_g7", paz: true, nome: "G7. Facktoré na besta automática", grupos: [{ m: "gnomo", b: 1 }] },
      { id: "gr_g8", dica: "5.5e: use PV máximo (78) e deixe o mímico agarrar um alvo logo no 1º turno.", nome: "G8. Mímico (8º barril)", grupos: [{ m: "mimico", b: 1, fixo: true }] },
      { id: "gr_g9", paz: true, nome: "G9. Posto de guarda — Ulla e Pog", grupos: [{ m: "gnomo", b: 2 }] },
      { id: "gr_g11", paz: true, nome: "G11. Oficina — Fibblestib e Dabbledob", grupos: [{ m: "gnomo", b: 2 }] },
      { id: "gr_g12", paz: true, nome: "G12. Domicílios (dormindo)", grupos: [{ m: "gnomo", b: 8 }] },
      { id: "gr_g15", paz: true, nome: "G15. Reis Korboz e Gnerkli", grupos: [{ m: "gnomo", b: 2 }] },
    ],
  },
  {
    id: "serra", nome: "Serra da Discórdia", pag: 44, nivel: 2, missao: "inicial",
    encontros: [
      { id: "se_moinho", dica: "5.5e: o livro diz que a manticora pode voltar com o companheiro — com mesa grande, faça o companheiro chegar no 3º turno (imprima uma segunda manticora).", nome: "Moinho atacado", grupos: [{ m: "manticora", b: 1, fixo: true }, { m: "adabra", b: 1 }],
        nota: "A manticora pode voltar depois com um companheiro." },
    ],
  },
  {
    id: "lenhadores", nome: "Acampamento dos Lenhadores", pag: 12, nivel: 3, missao: "subsequente",
    encontros: [
      { id: "le_boi", paz: true, nome: "Preparações — boi da carroça", grupos: [{ m: "vaca", b: 1 }] },
      { id: "le_porco", nome: "Viagem — um \"porco\" diferente (Drethna)", grupos: [{ m: "javali", b: 1, xp: 700, fixo: true }],
        nota: "Anacoreta de Talos em forma de javali. Se mudar de forma, use a mini de anacoreta." },
      { id: "le_l3", nome: "L3. Escritório — ankheg e Tibor", grupos: [{ m: "ankheg", b: 1, fixo: true }, { m: "tibor", b: 1 }] },
      { id: "le_l6", nome: "L6. Acampamento Sul", grupos: [{ m: "ankheg", b: 3 }],
        nota: "Os ankhegs emergem um a um; com 1 jogador, só um por vez." },
    ],
  },
  {
    id: "mina", nome: "Mina de Ouro no Pé da Montanha", pag: 38, nivel: 4, missao: "subsequente",
    encontros: [
      { id: "mi_donjon", paz: true, nome: "Escolta — Don-Jon Raskin", grupos: [{ m: "donjon", b: 1 }] },
      { id: "mi_m1", nome: "M1. Posto de guarda", grupos: [{ m: "homem_rato", b: 2 }], nota: "Mulheres-rato em forma híbrida." },
      { id: "mi_m4", nome: "M4. Covil dos homens-rato", grupos: [
        { m: "rato", b: 4 },
        { m: "homem_rato", b: 2, k: 1 },
      ], nota: "1 homem-rato por membro do grupo contando Don-Jon (sem companheiros) + Zeleen Varnaster." },
      { id: "mi_m11", dica: "5.5e: coloque 2–3 ratos gigantes (de M13) junto com o verme.", nome: "M11. Verme de carniça", grupos: [{ m: "verme", b: 1, fixo: true }] },
      { id: "mi_m13", nome: "M13. Caverna infestada de ratos", grupos: [{ m: "rato", b: 5 }] },
      { id: "mi_m14", paz: true, nome: "M14–M15. Mineradores famintos", grupos: [{ m: "anao", b: 5 }] },
    ],
  },
  {
    id: "rancho", nome: "Rancho Caveira de Manteiga", pag: 40, nivel: 3, missao: "subsequente",
    encontros: [
      { id: "ra_cavalos", paz: true, nome: "Viagem — cavalos em Conyberry", grupos: [{ m: "cavalo", b: 3 }] },
      { id: "ra_petunia", paz: true, nome: "Viagem — Petúnia, a vaca", grupos: [{ m: "vaca", b: 1 }] },
      { id: "ra_casa", nome: "B1–B9. Orcs na casa", grupos: [{ m: "orc", k: 3 }],
        nota: "Três orcs por personagem, sem companheiros. Distribua nas áreas B1–B9." },
      { id: "ra_b10", paz: true, nome: "B10. Alfonso amarrado na adega", grupos: [{ m: "alfonso", b: 1 }] },
    ],
  },
  {
    id: "axeholm", nome: "Axeholm", pag: 14, nivel: 5, missao: "subsequente",
    // "A fortaleza contém três carniçais anões mais três adicionais para cada personagem" (A1)
    teto: [{ m: "carnical", b: 3, k: 3 }],
    encontros: [
      { id: "ax_alarme", nome: "A1/A4. Alarme — todos os carniçais juntos", alt: true,
        grupos: [{ m: "carnical", b: 3, k: 3 }],
        nota: "Se as portas de A1 forem arrombadas, todos os carniçais (3 + 3 por personagem) se reúnem em A4. Substitui os carniçais das salas." },
      { id: "ax_a5", nome: "A5. Salão Oeste", grupos: [{ m: "carnical", k: 1 }] },
      { id: "ax_a9", nome: "A9. Stirge na forja", grupos: [{ m: "stirge", b: 1, fixo: true }] },
      { id: "ax_a14", nome: "A14. Sala do trono", grupos: [{ m: "carnical", b: 1, fixo: true }] },
      { id: "ax_a19", nome: "A19. Lar dos carniçais", grupos: [{ m: "carnical", b: 1, k: 1 }] },
      { id: "ax_a22", nome: "A22. Bastião superior", grupos: [{ m: "aranha", b: 3, k: 1 }] },
      { id: "ax_a24", dica: "5.5e: faça os carniçais de A19 subirem a escada quando a banshee gritar.", nome: "A24. Salão mal-assombrado", grupos: [{ m: "banshee", b: 1, fixo: true }] },
      { id: "ax_a26", nome: "A26. Banheiro dos carniçais", grupos: [{ m: "carnical", b: 2, k: 1 }] },
      { id: "ax_a28", nome: "A28. Stirges na chaminé", grupos: [{ m: "stirge", k: 1, comp: true }] },
    ],
  },
  {
    id: "colina", nome: "Colina do Dragão", pag: 22, nivel: 5, missao: "subsequente",
    encontros: [
      { id: "co_xanth", paz: true, nome: "Viagem — Xanth, o centauro", grupos: [{ m: "centauro", b: 1 }] },
      { id: "co_d2", nome: "D2. Fogos-fátuos", grupos: [{ m: "fogo_fatuo", b: 3 }] },
      { id: "co_d4", nome: "D4. Surpresa esquelética", grupos: [{ m: "cavalo_esq", b: 1, fixo: true }] },
      { id: "co_d8", dica: "5.5e: use PV máximo (160) e deixe os fogos-fátuos de D2 seguirem o grupo até aqui.", nome: "D8. Guardião da Matadora de Dragões", grupos: [{ m: "espreitador", b: 1, fixo: true }] },
    ],
  },
  {
    id: "falcon", nome: "Cabana de Caça de Falcon", pag: 18, nivel: 6, missao: "subsequente",
    encontros: [
      { id: "fa_npcs", paz: true, nome: "Moradores", grupos: [{ m: "falcon", b: 1 }, { m: "corwin", b: 1 }, { m: "pell", b: 1 }, { m: "cavalo", b: 1 }],
        nota: "O cavalo é Baatorius." },
      { id: "fa_contra", nome: "Contra-Ataque! (após a Mansão)", opt: true,
        grupos: [{ m: "gorthok", b: 1, fixo: true }, { m: "orc", b: 20 }],
        nota: "Só importa se o grupo estiver na cabana no dia seguinte ao ataque à Mansão." },
    ],
  },
  {
    id: "mansao", nome: "Mansão do Bosque", pag: 34, nivel: 5, missao: "subsequente",
    encontros: [
      { id: "ma_w1", nome: "W1. Abóboras — javalis", grupos: [{ m: "javali", b: 6 }, { m: "javali", b: 3, xp: 700, fixo: true }],
        nota: "6 javalis reais + 3 anacoretas em forma de javali. Se eles mudarem de forma, use minis de anacoreta." },
      { id: "ma_w5", nome: "W5. Figuras de galhos na lareira", opt: true, grupos: [{ m: "ramo_galhos", k: 1, comp: true }],
        nota: "Só se Drethna escapou na viagem ao Acampamento dos Lenhadores." },
      { id: "ma_w8", nome: "W8. Poço do pátio", grupos: [{ m: "ramo_vinhas", b: 1, k: 1, max: 5 }] },
      { id: "ma_w10", nome: "W10. Laboratório — Grannoc", grupos: [{ m: "anacoreta", b: 1, fixo: true }, { m: "ramo_galhos", k: 3 }] },
      { id: "ma_w14", nome: "W14. Salão superior", grupos: [{ m: "stirge", k: 3, max: 12 }] },
      { id: "ma_w18", nome: "W18. Quarto de hóspedes", grupos: [{ m: "orc", b: 4, k: 1 }] },
      { id: "ma_saida", nome: "Deixando a Mansão", grupos: [{ m: "ramo_espetos", k: 2 }],
        nota: "Os sobreviventes de W1 (javalis e anacoretas) se juntam ao ataque." },
    ],
  },
  {
    id: "circulo", nome: "Círculo do Trovão", pag: 20, nivel: 6,
    encontros: [
      { id: "ci_patrulha", nome: "Viagem — Patrulha de Yargath", grupos: [{ m: "anacoreta", b: 1, fixo: true }, { m: "orc", k: 2, comp: true }] },
      { id: "ci_c1", nome: "C1. Ritual — Flenz e Narux", grupos: [{ m: "anacoreta", b: 2, fixo: true }, { m: "ramo_galhos", k: 2, comp: true }] },
      { id: "ci_gorthok", dica: "5.5e: rode Gorthok no mesmo combate que Flenz, Narux e os ramos (C1), e dê PV máximo (112).", nome: "C1. Gorthok invocado", grupos: [{ m: "gorthok", b: 1, fixo: true }],
        nota: "Se Gorthok ainda não foi derrotado, os anacoretas estão no meio da invocação." },
      { id: "ci_curral", paz: true, nome: "Cavernas — currais de javali", grupos: [{ m: "javali", b: 3 }],
        nota: "Um javali preso em cada caverna (C2–C4)." },
    ],
  },
  {
    id: "torre", nome: "Torre das Tempestades", pag: 45, nivel: 3,
    encontros: [
      { id: "to_praia", paz: true, nome: "Chegada — caranguejo gigante", grupos: [{ m: "caranguejo", b: 1 }] },
      { id: "to_t1", dica: "5.5e: use PV máximo (104). Com mesa grande o Lamento atinge mais gente — é o ponto mais perigoso aqui.", nome: "T1. Caverna assombrada (Miraal)", grupos: [{ m: "banshee", b: 1, fixo: true }] },
      { id: "to_t5", nome: "T2/T5. Harpias", grupos: [{ m: "harpia", k: 1, comp: true, max: 3 }] },
      { id: "to_t7", dica: "5.5e: faça as harpias de T5 virem em socorro de Moesko.", nome: "T7. Moesko, o anacoreta", grupos: [{ m: "anacoreta", b: 1, fixo: true }] },
      { id: "to_naufragios", nome: "T10–T14. Naufrágios", grupos: [{ m: "tubarao", b: 3, fixo: true }],
        nota: "Só o Boca de Faca ataca sem provocação." },
    ],
  },
  {
    id: "savras", nome: "Santuário de Savras", pag: 42, nivel: 4,
    encontros: [
      { id: "sa_s6", nome: "S6. Vigia na torre", grupos: [{ m: "orc", b: 1, fixo: true }] },
      { id: "sa_s2", nome: "S2. Acampamento no pátio", grupos: [
        { m: "orc", lvl: { 1: { k: 2 }, 2: { k: 3 }, 3: { k: 3 }, 4: { k: 4 }, 5: { k: 4 }, 6: { k: 4 } } },
        { m: "ogro", fixo: true, lvl: { 1: { b: 1 }, 2: { b: 2 }, 3: { b: 2 }, 4: { b: 3 }, 5: { b: 3 }, 6: { b: 4 } } },
      ], nota: "Tabela \"Lista de Inimigos\": depende do nível e do número de personagens (sem companheiros). Se o vigia gritar, todos atacam juntos." },
    ],
  },
  {
    id: "fortaleza", nome: "Fortaleza da Espiral de Gelo", pag: 26, nivel: 6,
    encontros: [
      { id: "fo_sicarios", dica: "5.5e: com mesa grande, inclua Dobin Noreth (5º Sicário) se ele ainda estiver vivo.", nome: "H3/H4. Sicários Frios", grupos: [{ m: "veterano", b: 4, fixo: true }],
        nota: "Syleen, Runa, Brakkis e Jabarl." },
      { id: "fo_h2", paz: true, nome: "H2. Estábulos", grupos: [{ m: "cavalo", b: 4 }] },
      { id: "fo_h12", nome: "H12. Câmara de audiência", grupos: [{ m: "stirge", b: 3 }] },
      { id: "fo_h20", dica: "5.5e: use PV máximo (196), dê 1 Resistência Lendária por dia e uma reação de ataque com a cauda. Os Sicários podem chegar no meio da luta para saquear.", nome: "H20. Telhado — Cryovain", grupos: [{ m: "cryovain", b: 1, fixo: true }],
        nota: "Cryovain também pode aparecer em qualquer local (tabela Localização do Dragão). Uma mini basta." },
    ],
  },
  {
    id: "companheiros", nome: "Companheiros (cartas)", pag: 6, nivel: 1, especial: true,
    encontros: [
      { id: "sk1", nome: "Donnabella Fiasco (Conjurador)", opt: true, grupos: [{ m: "sk_donnabella", b: 1 }] },
      { id: "sk2", nome: "Nib Addlespur (Conjurador)", opt: true, grupos: [{ m: "sk_nib", b: 1 }] },
      { id: "sk3", nome: "Ruby Hammerwhacker (Guerreiro)", opt: true, grupos: [{ m: "sk_ruby", b: 1 }] },
      { id: "sk4", nome: "Galandro Luna (Especialista)", opt: true, grupos: [{ m: "sk_galandro", b: 1 }] },
      { id: "sk5", nome: "Pickled Pete (Especialista)", opt: true, grupos: [{ m: "sk_pete", b: 1 }] },
      { id: "sk6", nome: "Shanjan Kwan (Conjurador)", opt: true, grupos: [{ m: "sk_kwan", b: 1 }] },
      { id: "sk7", nome: "Inverna Nightbreeze (Guerreiro)", opt: true, grupos: [{ m: "sk_inverna", b: 1 }] },
      { id: "sk8", nome: "Quinn Hightopple (Guerreiro)", opt: true, grupos: [{ m: "sk_quinn", b: 1 }] },
      { id: "sk9", nome: "Talon Thornwild (Especialista)", opt: true, grupos: [{ m: "sk_talon", b: 1 }] },
    ],
  },
];

/*
 * STLs gratuitos (Thingiverse "t:ID", Printables "p:ID"), levantados em nov/2026.
 * Preferência: sergeantr (modelos feitos a partir das minis do Essentials Kit) e MZ4250
 * (distribuídos de graça sob a Fan Content Policy da Wizards). Confira a licença na página antes de usar.
 * en = nome em inglês, usado no link de busca quando não há indicação.
 */
const STL = {
  anacoreta:    { en: "anchorite of talos", f: [["t:3719295", "Anchorite — sergeantr (Essentials Kit)"], ["t:4226514", "Flenz e Narux — sergeantr"], ["t:4216132", "Yargath — sergeantr"]] },
  ankheg:       { en: "ankheg", f: [["t:4203575", "sergeantr (Essentials Kit)"], ["t:4232956", "MZ4250"]] },
  aranha:       { en: "giant spider", f: [["t:3487091", "Velrock"]] },
  banshee:      { en: "banshee", f: [["t:3726641", "sergeantr (Essentials Kit)"], ["t:1248204", "MZ4250"]] },
  caranguejo:   { en: "giant crab", f: [["t:6284252", "jimjimjimmyjim"]] },
  carnical:     { en: "ghoul", f: [["t:2839914", "Ghoul and Ghast — MZ4250"]] },
  cavalo:       { en: "riding horse", f: [["t:4987622", "Kromlekthemad (com alforjes)"]] },
  cavalo_esq:   { en: "skeleton warhorse", f: [["t:6437850", "dfreas"]] },
  centauro:     { en: "centaur", f: [["t:3776909", "sergeantr (Essentials Kit)"], ["t:1235902", "MZ4250"]] },
  cryovain:     { en: "young white dragon", f: [["t:2830485", "White Dragon — MZ4250"]] },
  espreitador:  { en: "invisible stalker", f: [["t:4826761", "MZ4250"]] },
  fogo_fatuo:   { en: "will-o-wisp", f: [["t:2847670", "MZ4250"]] },
  gnomo:        { en: "rock gnome", f: [["t:4222357", "Rock Gnome Recluse — sergeantr"], ["t:4237912", "Gnome Maiden — sergeantr"], ["t:4226498", "Rei Gnerkli — sergeantr"], ["t:4224476", "Rei Korboz — sergeantr"]] },
  gorthok:      { en: "thunder boar", f: [["t:3837252", "sergeantr (Essentials Kit)"]] },
  gosma:        { en: "ochre jelly", f: [["t:2843596", "Ooze Collection — MZ4250"]] },
  harpia:       { en: "harpy", f: [["t:3792888", "sergeantr (Essentials Kit)"], ["t:2841671", "MZ4250"]] },
  homem_rato:   { en: "wererat", f: [["p:15944", "Lycanthropes — MZ4250"]] },
  javali:       { en: "boar", f: [["t:6150875", "ArmouredUpMinis"]] },
  manticora:    { en: "manticore", f: [["t:1238489", "MZ4250"]] },
  mimico:       { en: "barrel mimic", f: [["t:2843119", "Mimic Collection — MZ4250"]] },
  ogro:         { en: "ogre", f: [["t:3858364", "sergeantr (Essentials Kit)"], ["t:4203584", "Ogres — sergeantr"]] },
  orc:          { en: "orc warrior", f: [["t:3088672", "MZ4250"]] },
  ramo_espetos: { en: "needle blight", f: [["t:3728500", "sergeantr (Essentials Kit)"]] },
  ramo_galhos:  { en: "twig blight", f: [["t:3728580", "sergeantr (Essentials Kit)"], ["t:3780707", "schlossbauer"]] },
  ramo_vinhas:  { en: "vine blight", f: [["t:4918651", "schlossbauer"]] },
  rato:         { en: "giant rat", f: [["t:3484749", "Velrock"]] },
  stirge:       { en: "stirge", f: [["t:2847438", "MZ4250"]] },
  tubarao:      { en: "hunter shark", f: [] },
  vaca:         { en: "cow", f: [["t:2930167", "MZ4250"]] },
  verme:        { en: "carrion crawler", f: [["t:3731718", "sergeantr (Essentials Kit)"]] },
  veterano:     { en: "veteran fighter", f: [["t:4237944", "The Stone Cold Reavers (Sicários Frios) — sergeantr"]] },
  anao:         { en: "dwarf miner", f: [["t:4203607", "Dazlyn e Norbus — sergeantr"], ["t:3006182", "Epic Dwarf — Valandar"]] },
  falcon:       { en: "ranger hunter", f: [["t:3787041", "sergeantr (Essentials Kit)"]] },
  donjon:       { en: "Don-Jon Raskin", f: [["t:3782125", "sergeantr (Essentials Kit)"]] },
  adabra:       { en: "midwife commoner", f: [["t:4203567", "sergeantr (Essentials Kit)"]] },
  alfonso:      { en: "retired sheriff", f: [["t:4203594", "Big Al e Pell — sergeantr"]] },
  pell:         { en: "stable boy", f: [["t:4203594", "Big Al e Pell — sergeantr"]] },
  toblen:       { en: "innkeeper", f: [["t:3777965", "Barkeep — sergeantr"]] },
  dobin:        { en: "veteran fighter", f: [["t:4237944", "Stone Cold Reavers — sergeantr"]] },
  tibor:        { en: "commoner", f: [["t:2812198", "Commoner Collection — MZ4250"]] },
  corwin:       { en: "cook commoner", f: [["t:2812198", "Commoner Collection — MZ4250"]] },
  harbin:       { en: "commoner", f: [["t:2812198", "Commoner Collection — MZ4250"]] },
  elmar:        { en: "merchant", f: [["t:2812198", "Commoner Collection — MZ4250"]] },
  linene:       { en: "merchant", f: [["t:2812198", "Commoner Collection — MZ4250"]] },
  halia:        { en: "noble", f: [["t:2812198", "Commoner Collection — MZ4250"]] },
};
