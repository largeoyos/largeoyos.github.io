# Learned Image Compression Study

面向本科科研入门的学习式图像压缩项目，运行于 **Windows 原生 PyTorch CUDA**，不使用 Docker。

第一阶段先建立一个轻量、可训练、能解释的实验闭环：

1. 下载固定图片；
2. 训练一个带因子化高斯先验的卷积编码器；
3. 使用量化近似和率失真损失；
4. 记录 estimated bpp、PSNR、MS-SSIM、耗时和参数量；
5. 保存 checkpoint、重建图和 JSON 结果。

## 重要边界

当前模型是教学用的轻量基线，不是 CompressAI 官方模型：

- 训练时用均匀噪声近似量化，评测时使用 rounding；
- 使用每通道独立高斯分布估计 latent 概率；
- 报告的是由 likelihood 估计的 bpp，尚未接入算术编码，因此不是实际码流大小；
- 用 Kodak 图片训练仅用于验证代码链路，不能作为正式科研结果。

等本地流程稳定后，再使用 DIV2K 训练、Kodak 测试，并把官方 CompressAI 真码流评测放到学校 Linux 服务器完成。

## 当前机器

- GPU：NVIDIA GeForce RTX 3060 Laptop，6GB；
- Python：3.12；
- PyTorch：2.11.0 + CUDA 12.8；
- 默认训练：128×128 patch、batch size 4、轻量通道数。

## 项目结构

```text
learned-image-compression-study/
├── data/kodak/           # 下载的数据，不提交 Git
├── outputs/              # 重建图、指标与训练历史
├── checkpoints/          # 模型 checkpoint
├── src/lic_study/
│   ├── model.py          # 因子化高斯先验编码模型
│   ├── train_toy.py      # 训练入口
│   ├── evaluate_toy.py   # 单图评测入口
│   └── metrics.py        # PSNR 与 estimated bpp
├── tests/
├── install_windows.ps1
└── pyproject.toml
```

## 安装

在 PowerShell 中进入项目目录，运行：

```powershell
.\install_windows.ps1
```

脚本会创建项目内的 `.venv`，从 PyTorch 官方 CUDA 12.8 源安装 GPU 版本，并安装项目依赖。不会修改系统 Python 中已有的 PyTorch。

验证：

```powershell
.\.venv\Scripts\lic-check.exe
```

`CUDA available` 应为 `True`。

## 首次烟雾实验

下载一张 Kodak 图片：

```powershell
.\.venv\Scripts\lic-download-kodak.exe --count 1
```

只训练 20 步，验证端到端流程：

```powershell
.\.venv\Scripts\lic-train-toy.exe `
  --data-dir data/kodak `
  --epochs 1 `
  --steps-per-epoch 20
```

评测并保存重建图：

```powershell
.\.venv\Scripts\lic-eval-toy.exe data/kodak/kodim01.png
```

预期生成：

- `checkpoints/toy_factorized_smoke.pt`
- `outputs/toy_factorized_smoke_history.json`
- `outputs/kodim01_toy_factorized_reconstruction.png`
- `outputs/kodim01_toy_factorized_metrics.json`

20 步只用于检查程序能否运行；量化后的 latent 很可能尚未学出有效结构。若要检查模型是否具备基本学习能力，可运行单图过拟合实验：

```powershell
.\.venv\Scripts\lic-train-toy.exe `
  --data-dir data/kodak `
  --epochs 1 `
  --steps-per-epoch 200 `
  --device cuda `
  --rd-lambda 0.05 `
  --checkpoint checkpoints/toy_factorized_lambda005_200steps.pt `
  --history outputs/toy_factorized_lambda005_200steps_history.json

.\.venv\Scripts\lic-eval-toy.exe data/kodak/kodim01.png `
  --checkpoint checkpoints/toy_factorized_lambda005_200steps.pt `
  --device cuda `
  --rd-lambda 0.05 `
  --output-dir outputs/lambda005_200steps
```

这项实验的训练图和评测图相同，只验证模型与训练代码能否学习，不能用于论文或简历中的泛化性能结论。当前实测结果见 `docs/experiment_log.md`。

## 测试

```powershell
.\.venv\Scripts\python.exe -m pytest
```

## 第一阶段验收

- [x] 原生 CUDA 环境检查通过；
- [x] Kodak 01 下载成功；
- [x] 20 步训练完成并保存 checkpoint；
- [x] 评测生成 estimated bpp、PSNR 与 MS-SSIM；
- [x] 重建图与 JSON 指标落盘；
- [x] 相同命令可以再次复现。

## 科研记录原则

- 不手工改实验结果；
- 始终标明训练集、测试集是否重叠；
- 严格区分“估计码率”和“实际码流码率”；
- 每次实验记录模型、lambda、随机种子、设备和版本；
- 失败实验也记录原因；
- 形成真实结果后，再更新科研申请简历。
