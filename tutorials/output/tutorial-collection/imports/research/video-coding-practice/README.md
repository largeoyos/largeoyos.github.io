# 从 DCT 到深度学习视频编码：实践指南

2026-10-17 更新：DCVC-RT 已在学校 A100 上完成两轮新增实验。最新见 [第二轮：刷新 RD 与跨内容验证](dcvc_rt_study/experiments/round2_20261017/研究报告.md)，自主续研入口见 [研究工作台](dcvc_rt_study/RESEARCH_PLAN.md)，第一轮见 [统一评价与特征刷新报告](dcvc_rt_study/experiments/round1_20261017/研究报告.md)。下文保留早期学习路线与环境准备过程，历史“未执行”状态以各节日期为准。

核查日期：2026-10-08。建议顺序是 **JPEG/DCT → DVC → DCVC → 单卡预训练编解码 → 小规模训练**。第一轮目标：压缩一张图、解释两篇论文的框图、把一段短视频编码成文件并解码回来。

你现有目录已有 `learned-image-compression-study` 的教学模型，以及 `pytorch-learning-plan/content/research/R26.md` 的视频压缩教案。本目录作为新的实践入口，不需要重做之前的图像压缩基础实验。

## 1. 先知道自己在学什么

这里的“编码”指 **把图像/视频表示成更少的比特，并能解码重建**。

| 概念 | 先理解到什么程度 | 一个自检问题 |
| --- | --- | --- |
| 像素、RGB/亮度/色度 | 图片是数值矩阵，不同通道表示不同信息 | 640×360 的 8-bit 灰度图，未经压缩有多少字节？ |
| 空间冗余 | 相邻像素常常相似 | 一块纯色区域需要逐像素重复存储吗？ |
| DCT | 把一个图块写成不同频率余弦图案的加权和 | 左上角 DC 系数代表什么？ |
| 量化 | 系数除以步长并取整，产生不可恢复误差 | 步长增大为什么通常更省比特？ |
| 无损编码/熵编码 | 把常见符号用更紧凑的形式存储 | 量化后大量零值怎么利用？ |
| 时间冗余、参考帧 | 相邻帧重复内容很多，可以复用已解码信息 | 为什么解码器不能用上一帧的原图作为参考？ |
| bpp、PSNR、率失真 | 评价“多大”与“损失多少” | 同样质量下，哪个方法需要更少的比特？ |

先看 Branch Education 官方 B 站视频：[《JPEG 算法原理：jpeg 图片是如何压缩的？》](https://www.bilibili.com/video/BV1TZ4y1S7iG/)。重点看分块、DCT、量化、无损编码四个环节。再在 B 站搜索“DCT 离散余弦变换”“视频编码 帧间预测 运动补偿”，优先选择有图解和参考资料的视频。

观看后手画一张图：

```text
原始像素 → 分块 → DCT → 量化 → 无损编码 → 压缩文件
重建像素 ← 拼块 ← 逆 DCT ← 反量化 ← 无损解码 ← 压缩文件
```

**DCT 本身不减少系数数量，也不必然损失信息。** 8×8 像素变成 8×8 系数；量化造成失真，后续无损编码把符号实际存得更紧凑。完整 JPEG 还包括颜色处理、DC 差分、系数扫描和特定熵编码，本 demo 只保留核心链路。

## 2. 今天就能跑：DCT 小 demo

本机已检查 `python` 可用，并安装了 NumPy、Pillow、Matplotlib。打开 PowerShell：

```powershell
cd E:\Projects\research\video-coding-practice
python dct_demo.py demo --image ..\learned-image-compression-study\data\kodak\kodim01.png
```

在新环境缺少依赖时，先创建独立环境：

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe dct_demo.py demo
```

不指定 `--image` 时，脚本生成明确标记的合成教学图。指定自然图时转成灰度，便于先专注 DCT；输出中的压缩比是原始 **8-bit 灰度像素字节数除以 `.dct` 文件字节数**，不拿彩色原 PNG 的文件大小作比较。

这份实现使用正交归一化 DCT-II。设图块为 X、DCT 矩阵为 C：

```text
去掉偏置：X ← X − 128
正变换：  Y = C X Cᵀ
量化：    Z = round(Y / Q)
反量化：  Y_hat = Z × Q
逆变换：  X_hat = Cᵀ Y_hat C + 128
```

Q 是 8×8 量化表。脚本默认比较 `scale = 0.5, 1, 2, 4, 8`；scale 越大，量化通常越粗。两侧的矩阵乘法分别处理两个空间方向。可对照 [SciPy DCT 文档](https://docs.scipy.org/doc/scipy/reference/generated/scipy.fft.dct.html) 理解 DCT 类型和归一化。

输出在 `outputs/dct/`：

| 文件 | 看什么 |
| --- | --- |
| `comparison.png` | 原图与五档重建；观察纹理消失、边缘和块效应 |
| `dct_basis.png` | 64 个余弦基图案；从左上向右下，频率逐渐升高 |
| `rd_curve.png` | 横轴实际文件 bpp，纵轴 PSNR |
| `metrics.csv` / `metrics.json` | 文件大小、bpp、PSNR、零系数比例、来源 |
| `*.dct` | 真正存盘的自定义压缩文件，包含头部与量化系数 |
| `*_reconstruction.png` | 从 `.dct` 文件解码得到的重建图 |
| `*_error_x4.png` | 绝对像素误差放大四倍，黑色表示无误差 |

`.dct` 是教学格式：JSON 头部 + zlib 压缩的量化系数。它可以独立解码，但不是 JPEG，也不用于声称与 JPEG 的科研性能竞争。PNG 只是重建图的展示格式，**码率按 `.dct` 完整文件大小计算**。

```text
file_bpp = 压缩文件字节数 × 8 / 原始像素数
PSNR = 10 log10(255² / MSE)
```

单独开一个进程解码，不需要原始图片：

```powershell
python dct_demo.py decode outputs\dct\q2_scale_2.dct --output outputs\dct\decoded_in_new_process.png
```

学习时打开 `dct_demo.py`，按 `dct_matrix → encode → decode → experiment` 阅读。让 AI 辅助时可以问：

> 请逐步解释 8×8 DCT 的矩阵乘法；为什么量化表高频位置通常更大？请在一个纯色块和一个棋盘格块上比较系数，并区分变换误差、量化误差和文件大小。

本阶段做三件事：改变 scale；换成纹理复杂/平坦区域多的两张图；写下文件大小与画质怎样变化。不同内容的结果会不同，不能要求每个统计量都严格单调。

## 3. 从图像到视频：读 DVC

论文：[DVC: An End-To-End Deep Video Compression Framework，CVPR 2019](https://openaccess.thecvf.com/content_CVPR_2019/html/Lu_DVC_An_End-To-End_Deep_Video_Compression_Framework_CVPR_2019_paper.html)。[作者代码](https://github.com/GuoLusjtu/DVC)。这里的 DVC 指 Deep Video Compression。

第一遍只读摘要、总体框图、方法中的主要模块、损失函数；先不要逐行啃全部数学推导。把当前原始帧记为 x_t、上一帧重建为 x_hat_(t−1)：

```text
x_t 与 x_hat_(t−1) → 运动估计 → 运动压缩/重建
重建运动 + x_hat_(t−1) → 运动补偿 → 预测帧
x_t − 预测帧 → 残差压缩/重建 → 加回预测帧 → x_hat_t
```

对应传统视频编码的“预测 + 残差”，DVC 把运动估计、运动编码、补偿、残差编码放入可学习流程。编码运动本身也需要比特，不能只计算残差。

理解率失真目标：

```text
L = R_motion + R_residual + λ × D(x_t, x_hat_t)
```

R 是码率项，D 是失真；训练时常由概率估计码率，实际评测则要测量码流。不同论文对失真的缩放可能不同，不直接照搬 λ 数值。

验收：画出框图；指出什么要传到解码器；解释为什么参考是上一帧的 **重建图**；解释第一帧需要帧内编码器。

代码选择要留意：DVC 作者原始仓库明确说明 **没有提供熵编码模块**，保存 `.pkl` 特征并给出估计 bpp；README 同时链接同事的 PyTorch 重实现。可以用于理解结构和训练，不能把其估计 bpp 当成实际文件 bpp。这个限制不代表所有后续 DVC 实现都没有实际编码。[原始仓库说明](https://github.com/GuoLusjtu/DVC#entropy-coding)

## 4. 再读 DCVC：上下文如何帮忙

论文：[Deep Contextual Video Compression，NeurIPS 2021](https://www.microsoft.com/en-us/research/publication/deep-contextual-video-compression/)。[论文 PDF](https://papers.neurips.cc/paper/2021/file/96b250a90d3cf0868c83f8c965142d2a-Paper.pdf)。[官方代码](https://github.com/microsoft/DCVC/tree/main/DCVC-family/DCVC)。

和 DVC 对照读图 1、总体结构图及条件编码相关方法：DVC 先形成像素预测，再压缩残差；DCVC 从已经解码的参考中构建 **特征域上下文**，让上下文帮助编码器、解码器和熵模型。

```text
过去的重建信息 → 特征上下文 c_t
当前帧 + c_t → 条件编码器 → 量化 latent → 条件熵编码 → 码流
码流 + 可在解码端重建的 c_t → 解码 → 当前重建帧
```

熵模型估计符号的概率；如果上下文使概率预测更准确，常见符号可以用更少比特表示。学习时追问：c_t 从哪来？编码端/解码端是否都能得到？网络哪里使用它？任何只在编码端知道的信息都不能悄悄作为解码条件。

| 模型 | 阅读目的 | 第一轮实践用途 |
| --- | --- | --- |
| DVC（2019） | 理解运动、补偿、残差、率失真联合优化 | 读原始框图和损失 |
| DCVC（2021） | 理解特征上下文与条件编码 | 对照原始方法 |
| DCVC-RT（2025） | 了解更实际的时延和实现设计 | 跑预训练真实编解码 |
| DCVC-UF（2026） | 了解当前仓库的分块时序路线 | 以后按其专用文档训练 |

这是学习顺序，不表示这些版本有相同架构。尤其 DCVC-RT 使用隐式时间建模，不能把 DVC 的显式运动管线套在它身上。[DCVC-RT 官方说明](https://github.com/microsoft/DCVC/tree/main/DCVC-family/DCVC-RT)

截至核查日期，仓库根目录是 DCVC-UF，旧模型在 `DCVC-family/`。下面选择 **DCVC-RT**；根目录依赖、UF 权重、RT 测试脚本不能混用。

## 5. GPU 集群：先跑预训练编解码

“端到端”描述模型可联合优化；运行预训练编解码属于推理，不等于已经训练或完整复现论文。首次目标是 **1 段 640×360、24 帧视频，2 个码率点，1 张 GPU**。

### 5.1 先拿到这几项集群信息

向老师/管理员确认：登录方式、计算资源申请方式、GPU 型号/显存、CUDA 模块或容器、数据与输出目录。若是 Slurm，还要知道 partition/account 和作业的 GPU 申请写法。依学校说明申请 GPU 计算节点；模型推理与训练在分配的计算资源中运行。

在分配的 GPU 会话中检查：

```bash
nvidia-smi
python -c 'import torch; print(torch.__version__, torch.version.cuda); print(torch.cuda.is_available()); print(torch.cuda.get_device_name(0) if torch.cuda.is_available() else "No GPU")'
command -v nvcc
command -v cmake
command -v g++
command -v ninja
```

`nvidia-smi` 显示的 CUDA 版本是驱动能力信息，不等于已安装的 CUDA Toolkit 版本。编译自定义 CUDA 扩展需要 `nvcc`，仅安装 PyTorch wheel 不会提供完整 Toolkit。

### 5.2 获取代码并记录版本

在学校允许的个人项目目录执行（以下为 Linux/Bash）：

```bash
git clone https://github.com/microsoft/DCVC.git
cd DCVC
git rev-parse HEAD
cd DCVC-family/DCVC-RT
```

记录输出的 commit。两份模型必须来自本版本 README 的预训练权重下载入口：

```text
DCVC-family/DCVC-RT/checkpoints/cvpr2025_image.pth.tar
DCVC-family/DCVC-RT/checkpoints/cvpr2025_video.pth.tar
```

第一份编码首帧，第二份编码后续帧。[权重入口与官方安装说明](https://github.com/microsoft/DCVC/tree/main/DCVC-family/DCVC-RT#pretrained-models)

### 5.3 独立环境与扩展

官方 RT 测试环境是 Python 3.12、PyTorch 2.6、CUDA 12.6。下面固定对应 PyTorch 包版本；学校提供容器时优先按学校环境规范调整，特别是驱动与 Toolkit。

```bash
conda create -n dcvc-rt-lab python=3.12 -y
conda activate dcvc-rt-lab
python -m pip install torch==2.6.0 torchvision==0.21.0 torchaudio==2.6.0 --index-url https://download.pytorch.org/whl/cu126
python -m pip install -r requirements.txt
python -m pip install setuptools wheel
python -m pip install --no-build-isolation ./src/cpp
python -m pip install --no-build-isolation ./src/layers/extensions/inference
```

最后两步仍在 `DCVC-family/DCVC-RT` 目录执行。官方 CUDA 扩展使用 `-arch=native`，编译这一步也在分配的 GPU 会话中完成。`cmake`、`g++`、`ninja` 和 CUDA Toolkit 可由学校 module/容器提供；缺少时按学校文档加载，不照搬管理员级命令。C++ 扩展支持实际熵编码，CUDA 扩展融合推理操作。若出现官方的 CUDA fallback 提示，速度不再代表优化内核性能。

### 5.4 准备一段很短的视频

把本目录的 Python 脚本复制到集群个人项目目录，在 **集群上** 运行，配置中的绝对路径才会正确。

```bash
cd /你的实际路径/video-coding-practice
python prepare_dcvc_input.py
```

默认生成合成移动方块：`prepared/sequences/demo_640x360.yuv`、`prepared/test_config.json`、来源记录。该视频仅检查程序链路，不能用于论文性能结论。

用真实短视频替换时：

```bash
python prepare_dcvc_input.py --video /你的实际路径/input.mp4 --out-dir prepared_real
```

这一步需要 `ffmpeg`。脚本转换为 24 fps、8-bit YUV420、640×360、24 帧；新目录防止覆盖前一份实验。对于过短视频，脚本会检查帧数据长度并报错。该降采样也需要写入实验记录。[FFmpeg 文档](https://ffmpeg.org/ffmpeg.html)

### 5.5 单卡启动

保持 `dcvc-rt-lab` 环境激活，在本实践目录执行：

```bash
python run_dcvc_rt.py \
  --dcvc-dir /你的实际路径/DCVC/DCVC-family/DCVC-RT \
  --config prepared/test_config.json \
  --out-dir outputs/dcvc_rt_smoke \
  --frames 24 --rates 2
```

启动器调用官方 `test_video.py`，使用 `--cuda 1 -w 1 --write_stream 1 --save_decoded_frame 1`，同时保存环境、commit 和完整命令。对常见整数形式的 `CUDA_VISIBLE_DEVICES` 保留分配到的 GPU 编号；使用 GPU UUID/MIG 等其他形式时需要学校提供兼容会话或按其环境适配官方代码。

如果集群是 Slurm，使用 `cluster_slurm.sbatch` 模板：先修改三处路径、必要的 partition/account、学校要求的环境初始化，再提交：

```bash
sbatch cluster_slurm.sbatch
squeue -u "$USER"
```

模板不会在提交时安装环境或下载权重，这些先准备好。若是网页平台/Jupyter，申请一张 GPU 后在终端运行相同 Python 命令；若是直接 SSH，按学校给出的资源使用规则运行。[Slurm 用户指南](https://slurm.schedmd.com/quickstart.html)

### 5.6 怎样算跑通

检查 `outputs/dcvc_rt_smoke/`：

1. `environment.json` 记录环境和真实代码版本。
2. `results.json` 记录两个码率点的结果。
3. `streams/demo/` 中实际存在非空 `.bin`、对应 `.json` 和解码 `.yuv`。
4. 每个码率点共 24 帧，本配置应为 1 个 I 帧 + 23 个 P 帧。
5. 解码 `.yuv` 文件应为 `640 × 360 × 1.5 × 24 = 8,294,400` 字节。

单序列 JSON 中主要字段：`ave_all_frame_bpp`、`ave_all_frame_psnr`、`ave_all_frame_psnr_y`、`i_frame_num`、`p_frame_num`。其 YUV 综合 PSNR 是官方实现按 Y/U/V PSNR 加权得到的值，别与 RGB PSNR 混比。还可自行测量完整 `.bin` 文件 bpp：

```text
file_bpp = .bin 字节数 × 8 / (宽 × 高 × 总帧数)
```

官方 RT 脚本给解码文件名附加的 `kbps` 数字按固定 30 fps 计算；本例是 24 fps，应根据真实文件字节数和实际播放时长计算码率，不直接使用该文件名标签。

记录的是 YUV420 输入、首帧帧内编码、GOP 设置、24 帧与两个码率点。后续正式比较必须保持相同分辨率、色彩格式、帧数和帧内间隔，并计入完整码流；不要直接拿不同论文图表的数字横比。

官方 RT 测试脚本写入码流后重新读回并解码，适合验证编码/解码链路；它不是通用 `.mp4` 播放器。进一步研究独立部署时，再做单独进程、跨设备码流解码的一致性检查。

有 `ffplay` 时可查看一个解码结果（用实际文件名替换）：

```bash
ffplay -f rawvideo -pixel_format yuv420p -video_size 640x360 -framerate 24 你的解码文件.yuv
```

24 帧只是跑通检查。RT 脚本跳过前 10 帧作为计时预热，这样剩余样本很少；正式速度评测改用更长序列，并区分模型编解码时间与读写、指标计算的总时间。

## 补充：网页 VS Code + Apptainer + A100 80GB

2026-10-15 已读取用户提供的[分享对话](https://chatgpt.com/share/6acfa761-3ae8-83ec-99f6-9a613142f03b)，按其中的实际集群条件调整脚本。对话中用户的 2026-10-14 终端输出记录：Apptainer、账户 `pb25151789`、A100-SXM4-80GB、驱动 580.173.02、Home `/home/scc/pb25151789`。节点 `anode18` 和作业 `95604` 只是当时的分配，后续不固定使用。

对话还说明已有 `~/envs/py311`（PyTorch 2.11.0/cu128），并给出学校公共 Python 3.12 环境 `/public/app/miniconda3/py312_24.4.0-0/envs/py312`。公共路径的存在性由脚本在实际容器内检查；分享记录不能代替当前运行状态验证。对话里的 GGUF/llama.cpp 部署属于另一个实验，不作为 DCVC 的依赖。

| 项目 | 本次配置 |
| --- | --- |
| GPU 会话 | 已分配的 A100 Apptainer 终端，单卡即可 |
| 原有环境 | 保留 `~/envs/py311` |
| 新环境 | `~/envs/dcvc-rt`，克隆公共 `py312` 后独立安装依赖 |
| Python / PyTorch | Python 3.12、torch 2.6.0、torchvision 0.21.0、torchaudio 2.6.0 |
| CUDA | PyTorch cu126 wheel + CUDA Toolkit 12.6.3 |
| 编译器 | Conda 的 GCC/G++ 12，配套 CMake、Ninja、pybind11 |
| 数据与环境位置 | 持久 Home 目录；每次新建容器重新激活该环境 |
| 目标 | 两份扩展成功加载，然后运行 24 帧预训练编解码 |

RT C++ `setup.py` 的 `python_requires=">=3.12"` 是安装限制；本次直接读取官方源文件核实。驱动版本和 Toolkit 版本分别管理：终端显示 CUDA 13.0 不要求安装 CUDA 13；本配置按 RT 的已测试组合使用 CUDA 12.6。GCC 12 在 CUDA 12.6 支持范围内。

### A. 上传与准备

把本目录的 `apptainer/`、`prepare_dcvc_input.py` 和 `run_dcvc_rt.py` 上传到集群持久目录，例如 `~/video-coding-practice/`。也可上传本地生成的 `dcvc-rt-cluster-setup.zip`，在网页 VS Code 中解压到 Home 目录，确认结构如下：

```text
~/video-coding-practice/
├── apptainer/
│   ├── setup_dcvc_rt.sh
│   ├── build_dcvc_rt.sh
│   └── check_environment.py
├── prepare_dcvc_input.py
└── run_dcvc_rt.py
```

在当前 A100 Apptainer 终端执行，先确认当前分配和公共环境可见：

```bash
hostname
printf '%s\n' "${SLURM_JOB_ID:-未设置}"
nvidia-smi
conda --version
test -f /public/app/miniconda3/py312_24.4.0-0/envs/py312/conda-meta/history
cd ~/video-coding-practice
```

共享对话的 `~/r` 是用户自己的终端辅助脚本，本配置不修改它。容器到期后按照学校平台重新申请 A100，再进入新终端。

### B. 安装专用环境

```bash
bash apptainer/setup_dcvc_rt.sh
```

脚本依次执行：检查目标位置 → 克隆公共 Python 3.12 → 安装 CUDA Toolkit 与 C/C++ 编译器 → 安装指定 PyTorch 和项目依赖 → 检查 GPU 运算。只对个人 `dcvc-rt` 环境安装依赖，下载缓存也使用个人目录。

如果环境已经是有效的 `dcvc-rt` Conda 环境，则跳过克隆并补齐依赖；Python 版本不正确时直接停止，不绕过扩展的 Python 限制。公共路径不同，可以传入实际路径：

```bash
bash apptainer/setup_dcvc_rt.sh "$HOME/envs/dcvc-rt" /学校提供的实际路径/py312
```

成功后在**当前终端**再次激活，因为 Bash 脚本内的激活不会自动影响父终端：

```bash
conda activate ~/envs/dcvc-rt
python --version
nvcc --version
python apptainer/check_environment.py --strict
```

`passed` 必须为 `true`。如果没有安装完成，会列出失败项。环境快照保存在 `~/envs/dcvc-rt/dcvc-environment.json`，同时保存 pip 包列表与 Conda explicit 文件，便于追踪当次依赖。

### C. 获取代码并编译扩展

保持已分配的 A100 可见，运行：

```bash
bash apptainer/build_dcvc_rt.sh
```

脚本默认将官方仓库放到 `~/video-code-lab/DCVC`；仓库已存在则使用其当前版本并记录 commit，不自动拉取或覆盖代码。然后在 `DCVC-family/DCVC-RT` 内编译 `MLCodec_extensions_cpp` 和 `inference_extensions_cuda`，逐一验证模块能否加载。

官方 CUDA 扩展含 `-arch=native`，因此必须在可见 GPU 的计算会话编译。本配置面向 A100；如果新作业换到其他架构的 GPU，应重新检查环境组合和编译产物，不直接假定可复用。

成功标志为 `Both DCVC-RT extensions loaded successfully.`，详细环境和代码版本写入 `~/envs/dcvc-rt/dcvc-build-records/`。导入成功只表示扩展加载检查通过，实际编解码还需下一步。

### D. 安装后再跑视频

从 RT README 下载两份对应权重到 `~/video-code-lab/DCVC/DCVC-family/DCVC-RT/checkpoints/`，随后执行：

```bash
conda activate ~/envs/dcvc-rt
cd ~/video-coding-practice
python prepare_dcvc_input.py --out-dir prepared_cluster
python run_dcvc_rt.py \
  --dcvc-dir "$HOME/video-code-lab/DCVC/DCVC-family/DCVC-RT" \
  --config prepared_cluster/test_config.json \
  --out-dir outputs/a100_first_run --frames 24 --rates 2
```

环境安装与 C++/CUDA 扩展编译不需要重新下载对话中的 74 GB 大语言模型，也不需要启动其推理服务。首次编解码的验收标准仍按 5.6 执行。

当前交付状态：脚本和配置已按分享对话调整；远端安装、扩展编译、模型编解码尚未执行。静态语法检查与本地环境检查的结果不等同于远端安装成功。

依据：[RT C++ 扩展要求](https://github.com/microsoft/DCVC/blob/main/DCVC-family/DCVC-RT/src/cpp/setup.py)、[PyTorch 2.6 安装组合](https://pytorch.org/get-started/previous-versions/#v260)、[NVIDIA CUDA 12.6 Conda 安装及 GCC 支持](https://docs.nvidia.com/cuda/archive/12.6.3/cuda-installation-guide-linux/index.html)、[Conda 环境克隆](https://docs.conda.io/projects/conda/en/stable/commands/create.html)。

## 6. 什么时候开始训练

先完成上面的预训练编解码，再走以下路线：

1. 读懂训练 batch 的结构：多帧样本、参考状态、重建、likelihood。
2. 在教学模型或有训练支持的目标模型上，用少量短序列、小 patch、单卡运行几十到几百步，检查 loss、梯度、保存与恢复 checkpoint。
3. 确认是训练链路检查；训练数据和评测数据分开，重叠时只能称过拟合实验。
4. 再依官方 schedule 扩展训练，比较多个 λ/码率点的 RD 曲线。

本指南的 `run_dcvc_rt.py` 只运行预训练模型，不执行训练。当前官方仓库的 [training.md](https://github.com/microsoft/DCVC/blob/main/training.md) 明确针对 **DCVC-UF**，包含数据格式与多阶段训练；若选这条训练路线，需要用根目录的 UF 环境、模型和数据要求。不能把 UF 训练文档当成 RT 训练文档，也不能将“训练 100 步”称为复现完整论文。

## 7. 建议的一周安排

时间是学习安排，可按自己的进度顺延。

| 时间 | 任务 | 留下的材料 |
| --- | --- | --- |
| 第 1 天 | 看 JPEG 图解，跑 DCT | 比较图、CSV、对 DCT/量化的解释 |
| 第 2 天 | 改量化强度，换两种图 | 率失真观察与错误放大图 |
| 第 3 天 | 读 DVC 的框图和损失 | 手绘结构图，列运动/残差比特 |
| 第 4 天 | 读 DCVC，和 DVC 对照 | 一页比较，解释上下文的来源和用途 |
| 第 5 天 | 获取集群说明、申请 GPU、建环境 | GPU/驱动/PyTorch/commit 记录 |
| 第 6 天 | 单卡、短视频、两个码率点 | `.bin`、解码 YUV、结果 JSON、日志 |
| 第 7 天 | 换真实片段、增加码率点并整理 | 一页实验记录和下一步训练计划 |

第一轮汇报可以这样写：输入是什么；算法/版本是什么；用了哪些设置；实际码流多少字节、PSNR 多少；在哪里看到失真；有哪些仍未完成。所有数字从结果文件读取，不预填“论文同等性能”。

## 本地验证

```powershell
python -m unittest -v test_dct
```

覆盖变换正交性、无量化时可逆性、纯色块 DC 系数、图块顺序、非 8 倍数尺寸，以及新进程仅靠 `.dct` 解码。实际自然图 demo 与结果另见 `outputs/dct/`，本次记录见 `experiment_log.md`。集群执行仍需学校环境、两份官方权重和编译扩展；本地 DCT 测试通过不意味着 DCVC 已在集群跑通。
