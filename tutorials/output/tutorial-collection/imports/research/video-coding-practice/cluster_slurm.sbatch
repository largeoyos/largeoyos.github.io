#!/bin/bash
# TEMPLATE: add your school's partition/account directives if required.
#SBATCH --job-name=dcvc-smoke
#SBATCH --gres=gpu:1
#SBATCH --cpus-per-task=4
#SBATCH --mem=16G
#SBATCH --time=00:30:00
#SBATCH --output=dcvc-%j.log

set -euo pipefail

# Replace these paths BEFORE submitting; initialize conda as your school requires.
lab_dir="/REPLACE_WITH_YOUR_PATH/video-coding-practice"
dcvc_rt_dir="/REPLACE_WITH_YOUR_PATH/DCVC/DCVC-family/DCVC-RT"
conda_init="/REPLACE_WITH_YOUR_PATH/miniconda3/etc/profile.d/conda.sh"

test -d "$lab_dir"
test -d "$dcvc_rt_dir"
test -f "$conda_init"
source "$conda_init"
conda activate dcvc-rt-lab
cd "$lab_dir"

# Prepare input once before submitting: python prepare_dcvc_input.py
python run_dcvc_rt.py --dcvc-dir "$dcvc_rt_dir" \
    --config "$lab_dir/prepared/test_config.json" \
    --out-dir "$lab_dir/outputs/slurm-${SLURM_JOB_ID}" --frames 24 --rates 2
