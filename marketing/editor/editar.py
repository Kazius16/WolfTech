"""Editor de videos WolfTech: tomas crudas del celular → video vertical listo para TikTok/Reels.

Uso:
    python editar.py <carpeta>                # usa <carpeta>/guion.json
    python editar.py <carpeta> --revisar      # solo hoja de contacto + transcripción, sin render

La carpeta tiene las tomas (.MOV/.MP4) y un guion.json (ver guion-ejemplo.json).
Salida en <carpeta>/salida/: <nombre>-con-efectos.mp4 y <nombre>-solo-voz.mp4

Pasos:
 1. normalizar: vertical 1080x1920 a 30 fps; si el iPhone grabó en HDR (HLG/PQ) lo pasa a SDR
 2. transcribir: Whisper (faster-whisper) con tiempos por palabra; si no está instalado, detecta pausas con ffmpeg
 3. cortar: quita pausas, acelera un poco (sin cambiar el tono), zoom alternado en cada corte, color de la marca
 4. gráficos: los del guion (título, chips, filas, medidor), subtítulos y cierre con el lobo
 5. sonido: voz normalizada + efectos (sonido.py de ../videos)
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys
import unicodedata
from pathlib import Path

AQUI = Path(__file__).resolve().parent
VIDEOS = AQUI.parent / "videos"
FPS = 30
W, H = 1080, 1920


# ---------------------------------------------------------------- utilidades
def run(cmd, **kw):
    r = subprocess.run(cmd, capture_output=True, text=True, **kw)
    if r.returncode != 0:
        sys.exit(f"Falló: {' '.join(map(str, cmd))[:300]}\n{r.stderr[-1500:]}")
    return r.stdout


def duracion(f):
    return float(run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)]).strip())


def normal(s):
    s = unicodedata.normalize("NFD", s.lower())
    return re.sub(r"[^a-z0-9]", "", "".join(c for c in s if unicodedata.category(c) != "Mn"))


# ---------------------------------------------------------------- 1. normalizar
def es_hdr(f):
    t = run(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=color_transfer", "-of", "csv=p=0", str(f)]).strip()
    return t if t in ("arib-std-b67", "smpte2084") else None


def tiene_zscale():
    return "zscale" in run(["ffmpeg", "-hide_banner", "-filters"])


def normalizar(origen, destino):
    if destino.exists():
        return
    hdr = es_hdr(origen)
    vf = []
    if hdr:
        if tiene_zscale():
            vf.append(f"zscale=tin={hdr}:min=bt2020nc:pin=bt2020:t=linear:npl=203,format=gbrpf32le,zscale=p=bt709,"
                      "tonemap=tonemap=hable:desat=0:peak=4,zscale=t=bt709:m=bt709:r=tv")
        else:
            print(f"  aviso: {origen.name} es HDR y este ffmpeg no tiene zscale; el color puede verse lavado")
    vf.append(f"fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,format=yuv420p")
    run(["ffmpeg", "-v", "error", "-y", "-i", str(origen), "-vf", ",".join(vf), "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "16", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", str(destino)])


# ---------------------------------------------------------------- 2. transcribir
def transcribir(f, cache):
    """Devuelve lista de palabras [{w, a, b}] o None si no hay Whisper."""
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        return None
    global _modelo
    if "_modelo" not in globals():
        print("  cargando Whisper (la primera vez descarga el modelo)…")
        _modelo = WhisperModel(os.environ.get("WHISPER_MODELO", "small"), device="auto", compute_type="auto")
    segs, _ = _modelo.transcribe(str(f), language="es", word_timestamps=True, vad_filter=True)
    palabras = [{"w": w.word.strip(), "a": round(w.start, 3), "b": round(w.end, 3)} for s in segs for w in s.words]
    cache.write_text(json.dumps(palabras, ensure_ascii=False, indent=0), encoding="utf-8")
    return palabras


def tramos_por_pausas(f, umbral_db=-32, minimo=0.25):
    out = subprocess.run(["ffmpeg", "-i", str(f), "-af", f"highpass=f=100,silencedetect=noise={umbral_db}dB:d={minimo}",
                          "-f", "null", "-"], capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", out)]
    fin = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", out)]
    d = duracion(f)
    silencios = list(zip(ini, fin + [d] * (len(ini) - len(fin))))
    tramos, t = [], 0.0
    for a, b in silencios:
        tramos.append((t, a))
        t = b
    tramos.append((t, d))
    # fuera ruidos sueltos (respiración, golpe) de menos de 0.3 s
    return [(a, b) for a, b in tramos if b - a >= 0.3]


def tramos_por_palabras(palabras, pausa=0.35):
    tramos = []
    for p in palabras:
        if tramos and p["a"] - tramos[-1][1] < pausa:
            tramos[-1][1] = p["b"]
        else:
            tramos.append([p["a"], p["b"]])
    return [tuple(t) for t in tramos]


# ---------------------------------------------------------------- 3. cortar
def cortar(clips, cfg, trabajo):
    vel = cfg.get("velocidad", 1.08)
    pad = cfg.get("margen", 0.07)
    zooms = cfg.get("zooms", [1.0, 1.14])
    color = cfg.get("color", "colortemperature=temperature=8000,eq=contrast=1.06:brightness=-0.015:saturation=0.95")
    segs, lista, t, k = [], [], 0.0, 0
    for c in clips:
        d = duracion(c["sdr"])
        desde, hasta = c.get("desde", 0), c.get("hasta", d)
        tramos = [(max(desde, a - pad), min(hasta, b + pad)) for a, b in c["tramos"] if b > desde and a < hasta]
        if c.get("cola"):  # dejar correr el final de la toma (p. ej. paneo al logo)
            tramos.append((tramos[-1][1] if tramos else desde, min(hasta, (tramos[-1][1] if tramos else desde) + c["cola"])))
        for a, b in tramos:
            if b - a < 0.15:
                continue
            z = 1.0 if (c.get("sin_zoom") or b - a < 0.4) else zooms[k % len(zooms)]
            cw, ch = int(W / z) // 2 * 2, int(H / z) // 2 * 2
            cx, cy = (W - cw) // 2, int((H - ch) * 0.42)
            out = trabajo / f"seg{k:03d}.mp4"
            dur = (b - a) / vel
            run(["ffmpeg", "-v", "error", "-y", "-ss", f"{a:.3f}", "-to", f"{b:.3f}", "-i", str(c["sdr"]),
                 "-vf", f"crop={cw}:{ch}:{cx}:{cy},scale={W}:{H},setsar=1,{color},setpts=(PTS-STARTPTS)/{vel}",
                 "-af", f"asetpts=PTS-STARTPTS,atempo={vel},afade=t=in:d=0.02,afade=t=out:st={max(0, dur - 0.03):.3f}:d=0.03",
                 "-c:v", "libx264", "-preset", "veryfast", "-crf", "17", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k",
                 "-ar", "48000", "-ac", "2", str(out)])
            real = duracion(out)
            segs.append({"clip": c["nombre"], "a": a, "b": b, "t0": round(t, 3), "t1": round(t + real, 3)})
            lista.append(f"file '{out.name}'")
            t += real
            k += 1
    (trabajo / "lista.txt").write_text("\n".join(lista))
    run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(trabajo / "lista.txt"), "-c", "copy",
         str(trabajo / "corte.mp4")])
    return segs, t, vel


def mapear(segs, vel, clip, t):
    """Tiempo dentro de una toma → tiempo en el video final."""
    for s in segs:
        if s["clip"] == clip and t < s["b"]:
            return s["t0"] + max(0.0, t - s["a"]) / vel
    ult = [s for s in segs if s["clip"] == clip]
    return ult[-1]["t1"] if ult else 0.0


# ---------------------------------------------------------------- 4. gráficos
def resolver_anclas(guion, clips, segs, vel):
    """Convierte cada 'cuando' del guion en segundos del video final."""
    usadas = {}

    def cuando(c, por_defecto):
        if c is None:
            return por_defecto
        if isinstance(c, (int, float)):
            return float(c)
        if "seccion" in c:
            return inicio_clip[c["seccion"]] + c.get("mas", 0)
        clip = c["clip"]
        if "t" in c:
            return mapear(segs, vel, clip, c["t"]) + c.get("mas", 0)
        if "palabra" in c:
            pal = next(x for x in clips if x["nombre"] == clip).get("palabras")
            if not pal:
                sys.exit(f"El guion usa 'palabra' en {clip} pero no hay transcripción: instala faster-whisper o usa 't'.")
            objetivo = [normal(x) for x in c["palabra"].split()]
            desde = usadas.get(clip, 0)
            for i in range(desde, len(pal) - len(objetivo) + 1):
                if [normal(p["w"]) for p in pal[i:i + len(objetivo)]] == objetivo:
                    usadas[clip] = i + 1
                    return mapear(segs, vel, clip, pal[i]["a"]) + c.get("mas", 0)
            print(f"  aviso: no encontré «{c['palabra']}» en {clip}; uso el inicio de la toma")
            return inicio_clip[clip]
        raise ValueError(c)

    inicio_clip = {}
    for s in segs:
        inicio_clip.setdefault(s["clip"], s["t0"])
    fin_clip = {}
    for s in segs:
        fin_clip[s["clip"]] = s["t1"]

    items = []
    for g in guion.get("graficos", []):
        t0 = cuando(g.get("cuando"), 0.0)
        hasta = g.get("hasta")
        if hasta is None:
            cw = g.get("cuando") if isinstance(g.get("cuando"), dict) else {}
            clip_ref = cw.get("clip") or cw.get("seccion")
            t1 = fin_clip.get(clip_ref, t0 + 3.0) if clip_ref else t0 + 3.0
        else:
            t1 = cuando(hasta, t0 + 3.0)
        it = dict(g)
        it["t0"], it["t1"] = round(t0, 3), round(t1, 3)
        for m in it.get("marcas", []):
            m["t"] = round(cuando(m.get("cuando"), t0), 3)
        items.append(it)
    cambios = sorted({inicio_clip[c["nombre"]] for c in clips if c.get("destello") and c["nombre"] in inicio_clip})
    return items, cambios


def subtitulos(clips, segs, vel, max_palabras=3):
    subs = []
    for c in clips:
        pal = c.get("palabras") or []
        grupo = []
        for p in pal:
            ta, tb = mapear(segs, vel, c["nombre"], p["a"]), mapear(segs, vel, c["nombre"], p["b"])
            if tb <= ta:
                continue
            grupo.append({"w": p["w"], "a": round(ta, 3), "b": round(tb, 3)})
            if len(grupo) >= max_palabras or p["w"].endswith((".", ",", "?", "!")):
                subs.append(grupo)
                grupo = []
        if grupo:
            subs.append(grupo)
    return subs


# ---------------------------------------------------------------- 5. sonido
def efectos(plan, total, destino):
    sys.path.insert(0, str(VIDEOS))
    import numpy as np
    import sonido as S
    from scipy.io import wavfile
    pista = np.zeros(int(total * S.SR) + S.SR)

    def pon(x, t, g=1.0):
        S.poner(pista, x * g, t)

    pon(S.bombo(), 0.0, 0.7)
    pon(S.chasquido(), 0.0, 0.6)
    for t in plan["destellos"]:
        w = S.subida(0.35)
        pon(w, t - len(w) / S.SR, 0.5)
        pon(S.chasquido(), t, 0.5)
    for it in plan["items"]:
        if it["tipo"] in ("chip", "seccion", "fila"):
            pon(S.bombo(0.25), it["t0"], 0.35)
        for m in it.get("marcas", []):
            pon(S.bombo(0.25), m["t"], 0.3)
        if it.get("falla"):
            pon(S.falla(0.3), it["t0"], 0.35)
    fin = plan["fin_video"]
    w = S.subida(0.8)
    pon(w, fin - len(w) / S.SR, 0.7)
    pon(S.boom(), fin, 0.9)
    pon(S.chasquido(), fin, 0.6)
    pista = np.tanh(pista[: int(total * S.SR)] * 0.9)
    pista *= 10 ** (-6 / 20) / max(1e-6, float(np.max(np.abs(pista))))
    wavfile.write(destino, S.SR, (np.stack([pista, pista], 1) * 32767).astype(np.int16))


# ---------------------------------------------------------------- principal
def hoja_contacto(clips, destino):
    tiras = []
    for c in clips:
        d = duracion(c["sdr"])
        img = c["sdr"].with_suffix(".jpg")
        run(["ffmpeg", "-v", "error", "-y", "-i", str(c["sdr"]), "-vf", f"fps=6/{d},scale=-2:320,tile=6x1",
             "-frames:v", "1", str(img)])
        tiras.append(img)
    run(["ffmpeg", "-v", "error", "-y", *sum([["-i", str(t)] for t in tiras], []), "-filter_complex",
         f"vstack=inputs={len(tiras)}" if len(tiras) > 1 else "null", str(destino)])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("carpeta")
    ap.add_argument("--revisar", action="store_true", help="solo normaliza, transcribe y hace la hoja de contacto")
    args = ap.parse_args()
    carpeta = Path(args.carpeta).resolve()
    guion = json.loads((carpeta / "guion.json").read_text(encoding="utf-8")) if (carpeta / "guion.json").exists() else {}
    trabajo = carpeta / "_trabajo"
    salida = carpeta / "salida"
    trabajo.mkdir(exist_ok=True)
    salida.mkdir(exist_ok=True)
    nombre = guion.get("nombre", carpeta.name)

    tomas = guion.get("clips") or [{"archivo": p.name} for p in sorted(carpeta.iterdir())
                                   if p.suffix.lower() in (".mov", ".mp4") and p.parent == carpeta]
    clips = []
    print("1/5 normalizando y transcribiendo…")
    for c in tomas:
        c = dict(c)
        origen = carpeta / c["archivo"]
        c["nombre"] = c.get("nombre", Path(c["archivo"]).stem)
        c["sdr"] = trabajo / f"{c['nombre']}.mp4"
        normalizar(origen, c["sdr"])
        c["palabras"] = transcribir(c["sdr"], trabajo / f"{c['nombre']}.palabras.json")
        if c.get("tramos"):
            c["tramos"] = [tuple(t) for t in c["tramos"]]
        elif c["palabras"]:
            c["tramos"] = tramos_por_palabras(c["palabras"])
        else:
            c["tramos"] = tramos_por_pausas(c["sdr"])
        clips.append(c)
        texto = " ".join(p["w"] for p in c["palabras"]) if c["palabras"] else "(sin Whisper: tramos por pausas)"
        print(f"  {c['nombre']}: {duracion(c['sdr']):.1f} s · tramos {[(round(a, 2), round(b, 2)) for a, b in c['tramos']]}")
        print(f"    {texto}")

    if args.revisar:
        hoja_contacto(clips, salida / "hoja-contacto.jpg")
        print(f"Hoja de contacto: {salida / 'hoja-contacto.jpg'}")
        return

    print("2/5 cortando pausas…")
    segs, fin_video, vel = cortar(clips, guion, trabajo)
    print(f"  duración del corte: {fin_video:.1f} s")

    print("3/5 preparando gráficos…")
    items, destellos = resolver_anclas(guion, clips, segs, vel)
    cierre = guion.get("cierre", {})
    total = fin_video + cierre.get("duracion", 2.8)
    plan = {
        "items": items,
        "destellos": destellos,
        "subs": subtitulos(clips, segs, vel) if guion.get("subtitulos", True) else [],
        "fin_video": fin_video,
        "total": total,
        "cierre": {"frase": cierre.get("frase", "Construye poder."),
                   "linea": cierre.get("linea", "COTIZA POR WHATSAPP · ENVÍOS A TODA COLOMBIA")},
    }
    (trabajo / "plan.json").write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    shutil.copy(VIDEOS / "logo.svg", trabajo / "logo.svg")
    shutil.copy(AQUI / "overlay.html", trabajo / "overlay.html")
    cuadros = trabajo / "ov"
    if cuadros.exists():
        shutil.rmtree(cuadros)
    cuadros.mkdir()
    print("4/5 dibujando los gráficos cuadro por cuadro…")
    run(["node", str(AQUI / "render_overlay.cjs"), str(trabajo), str(cuadros)])

    print("5/5 sonido y video final…")
    efectos(plan, total, str(trabajo / "sfx.wav"))
    fade = total - 0.4
    filtro = (f"[0:v]tpad=stop_mode=add:stop_duration=4:color=black,trim=duration={total:.3f}[v0];"
              f"[v0][1:v]overlay=format=auto,format=yuv420p,split=2[va][vb];"
              f"[0:a]loudnorm=I=-15:TP=-1.5:LRA=11,apad,atrim=duration={total:.3f},afade=t=out:st={fade:.3f}:d=0.4,asplit=2[v1][v2];"
              f"[v1][2:a]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[mix]")
    comun = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", str(FPS), "-c:a", "aac", "-b:a", "192k",
             "-movflags", "+faststart"]
    run(["ffmpeg", "-v", "error", "-y", "-i", str(trabajo / "corte.mp4"), "-framerate", str(FPS),
         "-i", str(cuadros / "%05d.png"), "-i", str(trabajo / "sfx.wav"), "-filter_complex", filtro,
         "-map", "[va]", "-map", "[mix]", *comun, str(salida / f"{nombre}-con-efectos.mp4"),
         "-map", "[vb]", "-map", "[v2]", *comun, str(salida / f"{nombre}-solo-voz.mp4")])
    print(f"Listo: {salida / (nombre + '-con-efectos.mp4')}\n       {salida / (nombre + '-solo-voz.mp4')}")


if __name__ == "__main__":
    main()
