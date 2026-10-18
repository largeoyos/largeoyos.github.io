# 本机运行指南

## Windows 基础课

已检查的解释器为 `E:\Projects\research\learned-image-compression-study\.venv\Scripts\python.exe`，PyTorch 2.11.0+cu128，CUDA 可用，显卡 RTX 3060 Laptop 6GB。此环境不含 torchvision 或 matplotlib。本课程离线示例使用 torch、numpy、Pillow 和标准库，绘图生成 SVG，不要求额外安装这两项。

下载练习包后解压，保留目录结构。以下 PowerShell 命令在课程根目录执行：

```powershell
cd E:\Projects\research\pytorch-learning-plan
& ..\learned-image-compression-study\.venv\Scripts\python.exe python\answers\L01.py
```

练习版在 `python\exercises`，答案在 `python\answers`。两者使用共享工具 `python\course_lab.py`，应下载整个练习包。练习中的 TODO 会主动报错，防止未填写就误认为完成。小数据由代码生成，标注为教学合成数据。输出位于 `python\outputs`，重复执行会覆盖该课同名输出；正式比较应先复制到带日期的实验目录。

`course_lab.py` 中包括训练循环、图像转换和指标函数。课程页的“相关工具实现”会显示本课用到的关键函数；不要只运行入口而跳过它们。

## WSL 现状与进入方式

2026-09-23 已核实：发行版 `MyMigratedUbuntu` 使用 WSL2，Python 3.12.3；课程独立环境已装入 torch 2.11.0+cpu 和 CompressAI 1.2.8。WSL 提示 Windows localhost 代理未镜像，但安装与编解码已经成功。

PowerShell 中检查、进入：

```powershell
wsl --status
wsl --list --verbose
wsl -d MyMigratedUbuntu
```

仅当另一台机器未安装 WSL 时，参照微软文档，在管理员 PowerShell 运行 `wsl --install -d Ubuntu`，按提示重启并创建 Linux 用户。不要为了本课重复安装已有发行版。

## 独立 Linux 环境

下面的命令在 Ubuntu shell 执行，不在 PowerShell 执行：

```bash
cd /mnt/e/Projects/research/pytorch-learning-plan
bash python/setup_linux.sh
.venv-linux/bin/python python/answers/L19.py
```

脚本仅在课程目录创建 `.venv-linux`，锁定 torch 2.11.0、torchvision 0.26.0、CompressAI 1.2.8，以 CPU 推理为基础。`downloads/linux-environment-lock.txt` 在安装成功后记录实际依赖。若 venv 提示缺少 ensurepip，需要先由你在 Ubuntu 配置 python3-venv；不要向系统 Python 使用 sudo pip。网络、证书或软件源报错应保留完整日志，不以跳过 TLS 校验解决。

实际验证范围以网页实验区“验证记录”为准。Linux 脚本不自动安装系统组件。

## 第一次真实编解码

先下载 Kodak 01～05，并在 WSL 中指定课程已核验的权重缓存。新机器若没有权重，可以运行 Windows Python 的 `python/download_codec_weights.py`（在线下载约 100 MB），下载器校验官方文件名包含的 SHA256 前缀。

```bash
export TORCH_HOME=/mnt/e/Projects/research/pytorch-learning-plan/python/weights
.venv-linux/bin/python python/answers/L20.py --image python/test-images/kodim01.png
.venv-linux/bin/python python/answers/L21.py --bitstream python/outputs/L20.lic
```

若权重缓存为空，CompressAI 会从官方地址下载公开预训练权重。脚本会生成真实 `.lic` 教学容器并从落盘字节解码；原图尺寸、码流分支、潜变量形状、模型与质量档位都写入头部。解码双方默认共享同一模型权重。重建图片只用于显示，PNG 文件大小不用于计算压缩率。

## 五张固定图片与基准实验

使用下载工具获取 Kodak 01～05；这组图只用于评测，不用于本课程正式训练。工具会检查图片尺寸并生成 SHA256 清单；下载失败不会伪造替代数据。

```bash
.venv-linux/bin/python python/download_test_images.py
.venv-linux/bin/python python/answers/L22.py --images python/test-images
.venv-linux/bin/python python/answers/L23.py --results python/outputs/benchmark.csv
.venv-linux/bin/python python/answers/L24.py --results python/outputs/benchmark.csv
# 第九周：增加超先验，再做同口径比较
.venv-linux/bin/python python/answers/L27.py --images python/test-images
```

JPEG 固定 subsampling=0；档位 20/50/85。学习式模型档位 1/3/5，输入 RGB 范围 0～1，右侧与底部零填充到 64 倍数，解码后裁剪；以原始像素数为 bpp 分母。汇总取逐图 bpp 和逐图 PSNR 的算术平均。主比较使用完整文件 bpp，另外保留 payload、estimated bpp 和 side_bytes。

`benchmark_partial.csv` 保存已完成项，完整结束才写 `benchmark.csv`。失败时保留异常，不把部分数据当完整比较。报告要说明小样本局限、padding 策略以及模型共享约定。编码计时不包含文件写入、初始化、权重下载和估计率前向；单次计时仅是运行记录，严谨效率比较用 L33 的重复测量方式。

## 本地教学项目与 HPCM

L16 默认读取相邻的 `learned-image-compression-study`；下载包放到其他目录时传入 `--project`。L30 同样可用 `--hpcm` 指定 HPCM 源码位置。它们只做静态定位，不安装或运行原论文仓库。

查看已有教学模型的率失真训练：

```powershell
cd E:\Projects\research\learned-image-compression-study
.\.venv\Scripts\lic-train-toy.exe --help
.\.venv\Scripts\lic-eval-toy.exe --help
```

先读 README 与 `docs/experiment_log.md`，再按实际参数执行。当前教学模型未接熵编码，其 bpp 是估计值。已有 Kodak 单图训练结果只作调试，不能并入新的独立测试报告。

## 遇到问题时

1. 环境：打印 sys.executable、torch.__version__ 和 device，确认不是混用解释器。
2. 数据：打印 shape、dtype、min/max，确认 NCHW 与 0～1。
3. 梯度：检查 requires_grad、有限梯度和更新前后的参数差。
4. 指标：检查原始 H/W、所有码流分支、像素范围和完整文件口径。
5. Linux 阻塞：保留命令及报错，在课程中标记“环境阻塞”；其他课程仍可继续。

来源：PyTorch 官方文档、CompressAI 官方发布与安装说明、Microsoft WSL 安装文档。命令和版本需结合验证记录使用。
