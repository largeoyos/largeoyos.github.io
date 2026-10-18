"""An educational grayscale block-DCT codec, with independent file decoding.

This is NOT a JPEG implementation. The container holds a JSON header and
zlib-compressed quantized coefficients; its actual size includes the header.
"""
from __future__ import annotations

import argparse
import csv
import json
import math
from pathlib import Path
import struct
import zlib

import numpy as np
from PIL import Image

MAGIC = b"DCTLAB1\n"
BLOCK = 8
# A familiar JPEG luminance quantization table; scale is our own control.
BASE_Q = np.array([
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99],
], dtype=np.float64)


def dct_matrix() -> np.ndarray:
    """Orthonormal DCT-II matrix. Forward: C @ X @ C.T."""
    k = np.arange(BLOCK)[:, None]
    n = np.arange(BLOCK)[None, :]
    c = np.sqrt(2 / BLOCK) * np.cos(np.pi * (2 * n + 1) * k / (2 * BLOCK))
    c[0] /= np.sqrt(2)
    return c


def to_blocks(pixels: np.ndarray) -> np.ndarray:
    h, w = pixels.shape
    return pixels.reshape(h // BLOCK, BLOCK, w // BLOCK, BLOCK).transpose(0, 2, 1, 3)


def from_blocks(blocks: np.ndarray) -> np.ndarray:
    rows, cols = blocks.shape[:2]
    return blocks.transpose(0, 2, 1, 3).reshape(rows * BLOCK, cols * BLOCK)


def encode(pixels: np.ndarray, scale: float, path: Path) -> float:
    """Encode uint8 grayscale pixels, returning the zero-coefficient fraction."""
    if pixels.ndim != 2 or pixels.dtype != np.uint8 or pixels.size == 0:
        raise ValueError("Expected a nonempty uint8 grayscale image")
    if not math.isfinite(scale) or not 0 < scale <= 100:
        raise ValueError("scale must be finite and in (0, 100]")
    h, w = pixels.shape
    padded = np.pad(pixels, ((0, (-h) % BLOCK), (0, (-w) % BLOCK)), mode="edge")
    c = dct_matrix()
    coefficients = c @ to_blocks(padded.astype(np.float64) - 128) @ c.T
    q = np.maximum(1, np.rint(BASE_Q * scale)).astype(np.int32)
    quantized = np.rint(coefficients / q).astype("<i2")
    header = json.dumps({
        "width": w, "height": h,
        "padded_width": padded.shape[1], "padded_height": padded.shape[0],
        "block": BLOCK, "channels": 1, "dtype": "<i2",
        "quantization_table": q.tolist(),
    }, separators=(",", ":")).encode("utf-8")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(MAGIC + struct.pack("<I", len(header)) + header
                    + zlib.compress(quantized.tobytes(), level=9))
    return float(np.mean(quantized == 0))


def decode(path: Path) -> np.ndarray:
    """Decode using only the compressed file and this codec implementation."""
    data = path.read_bytes()
    offset = len(MAGIC)
    if not data.startswith(MAGIC) or len(data) < offset + 4:
        raise ValueError("Not a DCTLAB1 file")
    header_size = struct.unpack("<I", data[offset:offset + 4])[0]
    start = offset + 4
    header = json.loads(data[start:start + header_size])
    if header["block"] != BLOCK or header["channels"] != 1 or header["dtype"] != "<i2":
        raise ValueError("Unsupported codec parameters")
    h, w = header["height"], header["width"]
    ph, pw = header["padded_height"], header["padded_width"]
    if min(h, w) <= 0 or ph != h + (-h) % BLOCK or pw != w + (-w) % BLOCK:
        raise ValueError("Invalid image dimensions")
    raw = zlib.decompress(data[start + header_size:])
    if len(raw) != ph * pw * 2:
        raise ValueError("Coefficient payload has the wrong size")
    quantized = np.frombuffer(raw, dtype="<i2").reshape(ph // BLOCK, pw // BLOCK, BLOCK, BLOCK)
    q = np.asarray(header["quantization_table"], dtype=np.float64)
    if q.shape != (BLOCK, BLOCK) or not np.isfinite(q).all() or np.any(q <= 0):
        raise ValueError("Invalid quantization table")
    c = dct_matrix()
    restored = from_blocks(c.T @ (quantized * q) @ c) + 128
    return np.clip(np.rint(restored[:h, :w]), 0, 255).astype(np.uint8)


def psnr(original: np.ndarray, restored: np.ndarray) -> float:
    mse = float(np.mean((original.astype(np.float64) - restored.astype(np.float64)) ** 2))
    return float("inf") if mse == 0 else 10 * math.log10(255 ** 2 / mse)


def synthetic_image() -> np.ndarray:
    """Labeled synthetic input: smooth gradients, fine texture, and sharp edges."""
    y, x = np.mgrid[:360, :512]
    image = 35 + 150 * x / 511 + 20 * np.sin(y / 22)
    texture = (y > 180) & (x > 256)
    image += texture * (30 * np.sin(x * 1.7) * np.cos(y * 1.3))
    image[50:145, 45:195] = 225
    image[((x - 350) ** 2 + (y - 105) ** 2) < 55 ** 2] = 45
    return np.clip(np.rint(image), 0, 255).astype(np.uint8)


def experiment(args: argparse.Namespace) -> None:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    out = args.output_dir
    out.mkdir(parents=True, exist_ok=True)
    if args.image:
        with Image.open(args.image) as image:
            original = np.asarray(image.convert("L"))
        source = str(args.image.resolve())
    else:
        original = synthetic_image()
        source = "synthetic teaching image; not a natural-image benchmark"
    Image.fromarray(original).save(out / "original_gray.png")
    rows, reconstructions = [], []
    for index, scale in enumerate(args.scales):
        stem = f"q{index}_scale_{scale:g}"
        compressed = out / f"{stem}.dct"
        zeros = encode(original, scale, compressed)
        # Importantly, the reconstruction is read from the file, not the latent in RAM.
        restored = decode(compressed)
        Image.fromarray(restored).save(out / f"{stem}_reconstruction.png")
        error = np.abs(original.astype(np.int16) - restored.astype(np.int16))
        Image.fromarray(np.clip(error * 4, 0, 255).astype(np.uint8)).save(out / f"{stem}_error_x4.png")
        byte_count = compressed.stat().st_size
        rows.append({
            "scale": scale, "file_bytes": byte_count,
            "file_bpp": byte_count * 8 / original.size,
            "raw_gray_bytes_over_file_bytes": original.nbytes / byte_count,
            "psnr_db": psnr(original, restored), "zero_coefficient_fraction": zeros,
        })
        reconstructions.append(restored)
    with (out / "metrics.csv").open("w", newline="", encoding="utf-8") as stream:
        writer = csv.DictWriter(stream, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    metadata = {"source": source, "grayscale_shape": list(original.shape),
                "codec": "8x8 orthonormal DCT + scalar quantization + zlib; custom container",
                "rate_definition": "8 * complete .dct file bytes / original grayscale pixel count",
                "numpy_version": np.__version__, "results": rows}
    (out / "metrics.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")

    c = dct_matrix()
    fig, axes = plt.subplots(BLOCK, BLOCK, figsize=(8, 8))
    for u in range(BLOCK):
        for v in range(BLOCK):
            axes[u, v].imshow(np.outer(c[u], c[v]), cmap="gray", vmin=-0.25, vmax=0.25)
            axes[u, v].axis("off")
    fig.suptitle("64 DCT basis patterns: frequency increases down and right")
    fig.tight_layout()
    fig.savefig(out / "dct_basis.png", dpi=140)
    plt.close(fig)

    images = [original] + reconstructions
    columns = min(3, len(images))
    fig, axes = plt.subplots(math.ceil(len(images) / columns), columns,
                             figsize=(columns * 4.4, math.ceil(len(images) / columns) * 3.7), squeeze=False)
    for axis in axes.flat:
        axis.axis("off")
    for i, (axis, pixels) in enumerate(zip(axes.flat, images)):
        axis.imshow(pixels, cmap="gray", vmin=0, vmax=255)
        axis.set_title("Original grayscale" if i == 0 else
                       f"scale={rows[i-1]['scale']:g} | {rows[i-1]['file_bpp']:.2f} bpp\n"
                       f"PSNR={rows[i-1]['psnr_db']:.2f} dB")
    fig.tight_layout()
    fig.savefig(out / "comparison.png", dpi=140)
    plt.close(fig)

    fig, axis = plt.subplots(figsize=(6.3, 4.4))
    ordered = sorted(rows, key=lambda row: row["file_bpp"])
    axis.plot([r["file_bpp"] for r in ordered], [r["psnr_db"] for r in ordered], "o-")
    for r in ordered:
        axis.annotate(f"s={r['scale']:g}", (r["file_bpp"], r["psnr_db"]), xytext=(5, 5), textcoords="offset points")
    axis.set(xlabel="Actual file rate (bits / grayscale pixel)", ylabel="PSNR (dB)", title="DCT teaching codec: rate-distortion trade-off")
    axis.grid(alpha=0.25)
    fig.tight_layout()
    fig.savefig(out / "rd_curve.png", dpi=160)
    plt.close(fig)
    print(f"Source: {source}")
    for row in rows:
        print(f"scale={row['scale']:g}: {row['file_bytes']} bytes, "
              f"{row['file_bpp']:.3f} bpp, {row['psnr_db']:.2f} dB, "
              f"zeros={row['zero_coefficient_fraction']:.1%}")
    print(f"Outputs: {out.resolve()}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    demo = sub.add_parser("demo", help="Encode/decode several quantization scales and plot results")
    demo.add_argument("--image", type=Path, help="Omit to generate a synthetic teaching image")
    demo.add_argument("--output-dir", type=Path, default=Path("outputs/dct"))
    demo.add_argument("--scales", type=float, nargs="+", default=[0.5, 1, 2, 4, 8])
    dec = sub.add_parser("decode", help="Decode a .dct file in a fresh process")
    dec.add_argument("input", type=Path)
    dec.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.command == "demo":
        experiment(args)
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        Image.fromarray(decode(args.input)).save(args.output)
        print(f"Decoded: {args.output.resolve()}")


if __name__ == "__main__":
    main()
