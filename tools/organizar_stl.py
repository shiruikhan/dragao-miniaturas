#!/usr/bin/env python3
"""
Organiza os .zip baixados do Thingiverse/Printables nas pastas stl/<mini>/<id>/.

Uso (na raiz do projeto):  python tools/organizar_stl.py
- Lê os zips de stl/_baixados/ (nome no padrão do Thingiverse: "<título> - <ID>.zip",
  ou "<título> - <ID> - part 1 of 4.zip" quando o modelo é grande e vem em partes).
- Descobre a mini pelo ID usando o mapa STL de js/data.js.
- Extrai em stl/<pasta da mini>/<ID>/ e grava CREDITOS.txt com autor, link e licença.
- Modelos usados por várias minis (ex.: Commoner Collection) são extraídos na primeira;
  as demais recebem um VER-<ID>.txt apontando para lá.
- Não apaga nada: o zip continua em stl/_baixados/ (pode apagar depois).
"""
import re
import sys
import zipfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
STL = RAIZ / "stl"
BAIXADOS = STL / "_baixados"
NPCS = {"falcon", "donjon", "adabra", "alfonso", "pell", "toblen", "dobin", "tibor",
        "corwin", "harbin", "elmar", "linene", "halia"}


def pasta(mini):
    if mini.startswith("sk_"):
        return STL / "companheiros" / mini
    if mini in NPCS:
        return STL / "npcs" / mini
    return STL / mini


def mapa_stl():
    """{id: [(mini, rotulo, site)]} a partir do bloco STL de js/data.js."""
    texto = (RAIZ / "js" / "data.js").read_text(encoding="utf-8")
    bloco = texto[texto.index("const STL = {"):]
    mapa = {}
    for linha in bloco.splitlines():
        m = re.match(r"\s*(\w+):\s*\{", linha)
        if not m:
            continue
        mini = m.group(1)
        for site, ident, rotulo in re.findall(r'\["([tp]):(\d+)",\s*"([^"]*)"\]', linha):
            mapa.setdefault(ident, []).append((mini, rotulo, site))
    return mapa


def url(site, ident):
    return f"https://www.printables.com/model/{ident}" if site == "p" else f"https://www.thingiverse.com/thing:{ident}"


def licenca(z):
    for nome in z.namelist():
        if nome.upper().endswith("LICENSE.TXT"):
            return z.read(nome).decode("utf-8", "replace").strip()
    return "(veja a página do modelo)"


def main():
    if not BAIXADOS.is_dir():
        print(f"Pasta {BAIXADOS} não existe.")
        return 1
    mapa = mapa_stl()
    feitos, sem_mapa = 0, []
    for arq in sorted(BAIXADOS.glob("*.zip")):
        m = re.search(r" - (\d{4,})(?: - part \d+ of \d+)?\.zip$", arq.name)
        ident = m.group(1) if m else None
        if not ident or ident not in mapa:
            sem_mapa.append(arq.name)
            continue
        destinos = mapa[ident]
        mini, rotulo, site = destinos[0]
        alvo = pasta(mini) / ident
        registro = alvo / ".extraidos.txt"
        ja = registro.read_text(encoding="utf-8").splitlines() if registro.exists() else []
        if arq.name in ja or (not ja and any(alvo.glob("**/*.stl")) and " - part " not in arq.name):
            print(f"= {arq.name}: já extraído em {alvo.relative_to(RAIZ)}")
        else:
            alvo.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(arq) as z:
                z.extractall(alvo)
                lic = licenca(z)
            if not (alvo / "CREDITOS.txt").exists() or lic != "(veja a página do modelo)":
                (alvo / "CREDITOS.txt").write_text(
                    f"{rotulo}\n{url(site, ident)}\n\nLicença:\n{lic}\n", encoding="utf-8")
            with registro.open("a", encoding="utf-8") as f:
                f.write(arq.name + "\n")
            n = len(list(alvo.glob("**/*.stl")))
            print(f"+ {arq.name} -> {alvo.relative_to(RAIZ)} ({n} STL)")
            feitos += 1
        for outro, _, _ in destinos[1:]:
            p = pasta(outro)
            p.mkdir(parents=True, exist_ok=True)
            (p / f"VER-{ident}.txt").write_text(
                f"Os arquivos deste modelo estão em {alvo.relative_to(RAIZ).as_posix()}\n", encoding="utf-8")
    print(f"\n{feitos} modelo(s) extraído(s).")
    if sem_mapa:
        print("Sem correspondência no js/data.js (organize à mão):")
        for n in sem_mapa:
            print("  -", n)
    return 0


if __name__ == "__main__":
    sys.exit(main())
