"""Efectos de sonido sintetizados para los videos de WolfTech (sin muestras externas, sin derechos).

Uso:  python3 sonido.py 03-tres-errores          → 03-tres-errores.wav
Lee <nombre>.cortes.json (lo escribe render.cjs) con la lista de momentos:
  golpe  bombo seco en cada corte de texto
  corte  subida (whoosh) + golpe + chasquido al cambiar de escena
  falla  glitch digital cuando aparece la pieza equivocada
  bien   campanita de confirmación cuando se corrige
  boom   subida larga + boom grave cuando aparece el lobo
Además pone un tic suave en cada golpe del tempo (130 BPM) para marcar el ritmo.
Después:  ffmpeg -i video.mp4 -i video.wav -c:v copy -c:a aac -b:a 192k -shortest video-sonido.mp4
"""
import json
import sys

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

SR = 48000
BPM = 130
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(dur, ataque=0.002, caida=0.2):
    t = t_(dur)
    return np.minimum(1, t / ataque) * np.exp(-t / caida)


def filtro(x, tipo, f):
    return sosfilt(butter(4, f, btype=tipo, fs=SR, output="sos"), x)


def bombo(dur=0.35):
    t = t_(dur)
    f = 45 + 110 * np.exp(-t / 0.04)
    fase = 2 * np.pi * np.cumsum(f) / SR
    click = filtro(rng.standard_normal(len(t)), "highpass", 2500) * np.exp(-t / 0.004) * 0.5
    return np.tanh(1.6 * np.sin(fase) * env(dur, 0.001, 0.12)) + click


def subida(dur=0.4):
    t = t_(dur)
    ruido = rng.standard_normal(len(t))
    out = np.zeros_like(ruido)
    # barrido de un pasabanda por bloques
    bloques = 16
    for i in range(bloques):
        a, b = i * len(t) // bloques, (i + 1) * len(t) // bloques
        fc = 400 * (12 ** (i / bloques))
        out[a:b] = filtro(ruido, "bandpass", [fc * 0.7, min(fc * 1.4, 20000)])[a:b]
    return out * (t / dur) ** 2 * 0.6


def chasquido():
    t = t_(0.08)
    return filtro(rng.standard_normal(len(t)), "highpass", 4000) * np.exp(-t / 0.012) * 0.7


def falla(dur=0.42):
    t = t_(dur)
    out = np.zeros(len(t))
    pos = 0
    while pos < len(t):
        largo = int(SR * rng.uniform(0.015, 0.05))
        f = rng.choice([180, 360, 720, 1440, 95])
        seg = np.sign(np.sin(2 * np.pi * f * t_(largo / SR)))
        seg = np.round(seg * rng.uniform(0.3, 1) * 4) / 4  # "bitcrush"
        if rng.random() < 0.3:
            seg = seg * 0  # cortes de silencio
        fin = min(len(out), pos + len(seg))
        out[pos:fin] = seg[: fin - pos]
        pos += len(seg)
    return filtro(out, "lowpass", 6000) * np.exp(-t / 0.3) * 0.45


def bien():
    t = t_(0.6)
    tono = np.sin(2 * np.pi * 1318.5 * t) + 0.7 * np.sin(2 * np.pi * 1975.5 * t) * (t > 0.07)
    return tono * env(0.6, 0.003, 0.16) * 0.28


def boom(dur=2.4):
    t = t_(dur)
    f = 30 + 40 * np.exp(-t / 0.25)
    fase = 2 * np.pi * np.cumsum(f) / SR
    sub = np.tanh(2 * np.sin(fase)) * env(dur, 0.002, 0.7)
    cola = filtro(rng.standard_normal(len(t)), "lowpass", 900) * env(dur, 0.01, 0.5) * 0.35
    return sub + cola


def tic():
    t = t_(0.05)
    return filtro(rng.standard_normal(len(t)), "highpass", 7000) * np.exp(-t / 0.008) * 0.12


def poner(pista, x, seg):
    i = int(seg * SR)
    if i < 0:
        x, i = x[-i:], 0
    fin = min(len(pista), i + len(x))
    pista[i:fin] += x[: fin - i]


def main(nombre):
    datos = json.load(open(f"{nombre}.cortes.json"))
    pista = np.zeros(int(datos["duracion"] * SR) + SR)
    beat = 60 / BPM
    # tic del tempo, alineado al primer golpe
    t0 = datos["cortes"][0][1] if datos["cortes"] else 0
    k = 0
    while t0 + k * beat < datos["duracion"] - 3.2:
        poner(pista, tic(), t0 + k * beat)
        k += 1
    for tipo, s in datos["cortes"]:
        if tipo == "golpe":
            poner(pista, bombo() * 0.8, s)
        elif tipo == "corte":
            sub = subida(0.4)
            poner(pista, sub, s - len(sub) / SR)
            poner(pista, bombo(), s)
            poner(pista, chasquido(), s)
        elif tipo == "falla":
            poner(pista, falla(), s)
            poner(pista, bombo() * 0.6, s)
        elif tipo == "bien":
            poner(pista, bien(), s)
        elif tipo == "boom":
            sub = subida(0.9) * 1.2
            poner(pista, sub, s - len(sub) / SR)
            poner(pista, boom(), s)
            poner(pista, chasquido(), s)
    pista = pista[: int(datos["duracion"] * SR)]
    # fundido final y normalización a -1 dBFS
    n = int(0.35 * SR)
    pista[-n:] *= np.linspace(1, 0, n)
    pista = np.tanh(pista * 0.9)
    pista *= 10 ** (-1 / 20) / np.max(np.abs(pista))
    estereo = np.stack([pista, pista], axis=1)
    wavfile.write(f"{nombre}.wav", SR, (estereo * 32767).astype(np.int16))
    print("listo:", f"{nombre}.wav")


if __name__ == "__main__":
    main(sys.argv[1].replace(".html", ""))
