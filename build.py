#!/usr/bin/env python3
"""Gera o app em um único arquivo HTML.

Uso:
  python3 tools/build.py              -> index.html (página completa, abre direto no navegador)
  python3 tools/build.py --artefato   -> dist/irrigamanager-app.html (sem o esqueleto html/head/body,
                                         no formato que a ferramenta de artefatos do Claude publica)
"""
import base64, json, pathlib, sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
src = (RAIZ / "src" / "app.html").read_text(encoding="utf-8")
icones = (RAIZ / "src" / "icones.html").read_text(encoding="utf-8").strip()
mapas = json.loads((RAIZ / "src" / "mapas.json").read_text(encoding="utf-8"))

urls = []
for rel in mapas["imagens"]:
    dados = (RAIZ / rel).read_bytes()
    urls.append("data:image/jpeg;base64," + base64.b64encode(dados).decode("ascii"))
imgs_js = "var IMGS=%s,DIM=%s;" % (json.dumps(urls), json.dumps(mapas["dimensoes"], separators=(",", ":")))

asp = (RAIZ / "dados" / "aspersores.json").read_text(encoding="utf-8").strip().replace("<", "\\u003c")
corpo = src.replace("<!--SYMBOLS-->", icones).replace("/*IMGS*/", imgs_js).replace("/*ASP*/null", asp)

if "--artefato" in sys.argv:
    destino = RAIZ / "dist" / "irrigamanager-app.html"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(corpo, encoding="utf-8")
else:
    corte = corpo.index("</style>") + len("</style>")
    pagina = ('<!doctype html>\n<html lang="pt-BR"><head><meta charset="utf-8">'
              '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
              + corpo[:corte] + "\n</head><body>\n" + corpo[corte:].lstrip() + "\n</body></html>\n")
    destino = RAIZ / "index.html"
    destino.write_text(pagina, encoding="utf-8")

print("gerado:", destino.relative_to(RAIZ), f"({destino.stat().st_size // 1024} KB)")
