"""Launch the official DCVC-RT tester on ONE allocated GPU.

Requires the official repository, its two pretrained checkpoints, and compiled
extensions. This wrapper does not install or train the model.
"""
import argparse
import json
import os
from pathlib import Path
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dcvc-dir", type=Path, required=True, help="DCVC-family/DCVC-RT directory")
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, default=Path("outputs/dcvc_rt"))
    parser.add_argument("--frames", type=int, default=24)
    parser.add_argument("--rates", type=int, default=2)
    args = parser.parse_args()
    root, config, out = args.dcvc_dir.resolve(), args.config.resolve(), args.out_dir.resolve()
    if args.frames < 2 or not 2 <= args.rates <= 64:
        parser.error("frames must be >=2; rates must be in [2,64]")
    files = [root / "test_video.py", root / "checkpoints/cvpr2025_image.pth.tar",
             root / "checkpoints/cvpr2025_video.pth.tar", config]
    for file in files:
        if not file.is_file():
            parser.error(f"Missing required file: {file}")
    source_config = json.loads(config.read_text(encoding="utf-8"))
    dataset_root = Path(source_config["root_path"])
    if not dataset_root.is_absolute():
        parser.error("Use an absolute root_path in the test config")
    for dataset in source_config["test_classes"].values():
        if not dataset["test"]:
            continue
        if dataset["src_type"] != "yuv420":
            parser.error("This starter wrapper uses 8-bit YUV420 input")
        for name, sequence in dataset["sequences"].items():
            path = dataset_root / dataset["base_path"] / name
            minimum = sequence["width"] * sequence["height"] * 3 // 2 * args.frames
            if not path.is_file() or path.stat().st_size < minimum:
                parser.error(f"Missing or too-short YUV input: {path}")

    import torch
    if not torch.cuda.is_available():
        parser.error("PyTorch cannot access CUDA; use an allocated GPU compute session")
    # The official worker rewrites CUDA_VISIBLE_DEVICES. Preserve the allocated
    # physical ID when a scheduler exposes, for example, physical GPU 3.
    allocated = os.environ.get("CUDA_VISIBLE_DEVICES")
    gpu_ids = []
    if allocated is not None:
        ids = [part.strip() for part in allocated.split(",")]
        if not ids or not all(part.isdigit() for part in ids):
            parser.error("Official DCVC-RT --cuda_idx accepts integer GPU IDs. This allocation "
                         "uses another format; ask the cluster administrator for a compatible "
                         "GPU session/container before running this wrapper.")
        gpu_ids = ["--cuda_idx", ids[0]]
    out.mkdir(parents=True, exist_ok=True)
    command = [sys.executable, "test_video.py", "--model_path_i", str(files[1]),
               "--model_path_p", str(files[2]), "--test_config", str(config),
               "--cuda", "1", "-w", "1", "--rate_num", str(args.rates),
               "--force_frame_num", str(args.frames), "--force_intra_period", "-1",
               "--reset_interval", "64", "--write_stream", "1", "--save_decoded_frame", "1",
               "--force_zero_thres", "0.12", "--check_existing", "0", "--verbose", "1",
               "--verbose_json", "1", "--stream_path", str(out / "streams"),
               "--output_path", str(out / "results.json")] + gpu_ids
    revision = subprocess.run(["git", "rev-parse", "HEAD"], cwd=root,
                              capture_output=True, text=True, check=False)
    (out / "environment.json").write_text(json.dumps({
        "python": sys.version, "pytorch": torch.__version__, "torch_cuda": torch.version.cuda,
        "gpu": torch.cuda.get_device_name(0), "cuda_visible_devices": allocated,
        "repo_commit": revision.stdout.strip() if revision.returncode == 0 else None,
        "command": command, "purpose": "pretrained encode/decode pipeline check, not training",
    }, indent=2), encoding="utf-8")
    print(f"Running DCVC-RT in {root}; outputs: {out}", flush=True)
    subprocess.run(command, cwd=root, check=True)


if __name__ == "__main__":
    main()
