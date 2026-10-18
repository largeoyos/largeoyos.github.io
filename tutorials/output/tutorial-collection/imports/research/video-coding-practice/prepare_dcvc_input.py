"""Prepare a small 8-bit YUV420 sequence and a DCVC-RT test configuration.

Run this on the machine that will execute DCVC: config paths are absolute.
Default video is synthetic, useful only for checking the codec pipeline.
"""
import argparse
import json
from pathlib import Path
import subprocess

import numpy as np


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--video", type=Path, help="Optional real video; requires ffmpeg on PATH")
    parser.add_argument("--out-dir", type=Path, default=Path("prepared"))
    parser.add_argument("--width", type=int, default=640)
    parser.add_argument("--height", type=int, default=360)
    parser.add_argument("--frames", type=int, default=24)
    args = parser.parse_args()
    w, h, frames = args.width, args.height, args.frames
    if min(w, h) < 32 or w % 2 or h % 2 or frames < 2:
        parser.error("width and height must be even and >=32; frames must be >=2")
    root = args.out_dir.resolve()
    folder = root / "sequences"
    folder.mkdir(parents=True, exist_ok=True)
    name = f"demo_{w}x{h}.yuv"
    target = folder / name
    if target.exists():
        parser.error(f"{target} exists; choose a new --out-dir")
    if args.video:
        subprocess.run([
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-n", "-i", str(args.video.resolve()),
            "-vf", f"fps=24,scale={w}:{h}", "-frames:v", str(frames),
            "-pix_fmt", "yuv420p", "-f", "rawvideo", str(target),
        ], check=True)
        source = str(args.video.resolve())
    else:
        yy, xx = np.mgrid[:h, :w]
        background = (40 + 130 * xx / max(1, w - 1) + 20 * np.sin(yy / 12))
        side = min(w, h) // 5
        with target.open("wb") as stream:
            for frame in range(frames):
                y = np.clip(background, 0, 255).astype(np.uint8)
                left = int((w - side) * frame / max(1, frames - 1))
                top = h // 3
                y[top:top + side, left:left + side] = 220
                u = np.full((h // 2, w // 2), 128, dtype=np.uint8)
                v = u.copy()
                u[top // 2:(top + side) // 2, left // 2:(left + side) // 2] = 85
                v[top // 2:(top + side) // 2, left // 2:(left + side) // 2] = 180
                for plane in (y, u, v):
                    stream.write(plane.tobytes())
        source = "synthetic moving square; pipeline check only, not a benchmark"
    expected = w * h * 3 // 2 * frames
    actual = target.stat().st_size
    if actual != expected:
        parser.error(f"Expected {expected} YUV bytes, found {actual}; input may be too short")
    config = {"root_path": str(root), "test_classes": {"demo": {
        "test": 1, "base_path": "sequences", "src_type": "yuv420",
        "sequences": {name: {"width": w, "height": h, "frames": frames, "intra_period": -1}},
    }}}
    path = root / "test_config.json"
    path.write_text(json.dumps(config, indent=2), encoding="utf-8")
    (root / "source.json").write_text(json.dumps({
        "source": source, "format": "8-bit planar YUV420", "fps": 24,
        "width": w, "height": h, "frames": frames, "file_bytes": actual,
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Input: {target} ({actual} bytes)")
    print(f"DCVC-RT config: {path}")
    print(f"Source: {source}")


if __name__ == "__main__":
    main()
