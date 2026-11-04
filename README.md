# Controle de Miniaturas — O Dragão da Espiral de Gelo

Página estática para organizar a impressão 3D das miniaturas da aventura *O Dragão da Espiral de Gelo* (D&D 5e, Essentials Kit).

## O que faz

- Agrupa monstros, NPCs, animais e companheiros **por local** da aventura.
- Ajusta as quantidades ao **número de jogadores**, **companheiros** e **nível do grupo**, seguindo as fórmulas do livro (ex.: "três orcs por personagem, sem incluir companheiros").
- Registra quantas minis você **já imprimiu** e mostra o que falta.
- Monta um **plano de impressão incremental**: as minis voltam para a caixa entre um local e outro, então só a diferença é impressa. Se a fazenda pede 5 orcs e a mina pede 10, o plano imprime 5 antes da fazenda e mais 5 antes da mina.
- Permite reordenar os locais conforme a sua campanha, marcar locais concluídos, ligar e desligar encontros opcionais e criar minis e encontros próprios.
- Salva tudo no navegador (localStorage), com exportação e importação em JSON.

## Modos de contagem dentro de um local

- **Local inteiro**: soma todos os encontros ativos do local. Mais seguro.
- **Maior encontro**: usa só o maior encontro de cada criatura. Mais econômico.

## Balanceamento para 5.5e (regras 2024)

A aventura é de 5e (2014), mas os blocos de estatísticas funcionam nas regras de 2024. A página tem três níveis de ajuste:

- **Livro 5e**: quantidades exatas do livro.
- **5.5e — mesa grande** (padrão): o livro assume 4 personagens; grupos de tamanho fixo crescem na proporção jogadores ÷ 4. Chefes e criaturas nomeadas não mudam e recebem dicas (PV máximo, juntar encontros etc.).
- **5.5e — reforçado**: além disso, +50% nos grupos não nomeados, para grupos que estão atropelando as lutas.

A aba **Balanceamento** mostra a dificuldade de cada combate pelo orçamento de XP do Livro do Mestre 2024, no nível em que o livro balanceou cada local (editável).

## STLs

A aba **Inventário** traz indicações de STL gratuitos para cada mini (Thingiverse e Printables), com preferência pelos modelos do *sergeantr*, feitos a partir das minis do Essentials Kit, e pelos do *MZ4250*, e um link de busca de reserva. Confira a licença de cada modelo.

Os arquivos ficam **fora do git** (ver `.gitignore`), na pasta `stl/` do projeto, com uma subpasta por mini usando o mesmo identificador do `js/data.js` (ex.: `stl/ankheg/`, `stl/carnical/`); NPCs únicos ficam em `stl/npcs/` e companheiros em `stl/companheiros/`. A aba Inventário mostra a pasta de cada mini.

### Ver os STLs em 3D

Na aba **Inventário**, o botão **Conectar pasta stl/** pede acesso à pasta `stl` do projeto (Chrome ou Edge). A página lista os arquivos de cada mini, marca os baixados automaticamente e o botão **3D** abre o modelo com medidas em mm. Tudo roda no navegador: os arquivos não são enviados para lugar nenhum, então funciona igual no GitHub Pages. Em outros navegadores, o botão 3D permite abrir arquivos `.stl` avulsos.

O visualizador usa [three.js](https://threejs.org) r128 (licença MIT), incluído em `js/vendor/`.

## Publicar no GitHub Pages

Settings → Pages → *Deploy from a branch* → branch `main`, pasta `/ (root)`.

## Dados

Os encontros estão em [`js/data.js`](js/data.js), extraídos da transcrição em Markdown do livro em português, conferida com o original em inglês.

Ferramenta de fã, sem afiliação com a Wizards of the Coast.
