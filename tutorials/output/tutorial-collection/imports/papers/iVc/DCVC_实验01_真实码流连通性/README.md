# DCVC 实验 01：真实码流连通性

日期：2026-10-23。此目录是独立实验副本，原有精读源码和讲解文件不被修改。

## 已执行

1. 核对并复制官方固定提交 `cbdae87a5445114cdc7f48816da63ea80bdeac40` 的 31 个文件。
2. 用本机 MinGW-w64 g++ 15.2.0、Python 3.12.10 和已安装 PyTorch 所附 pybind11 头文件，编译原始 `ops.cpp`、`rans_interface.cpp/.hpp`，生成两个实际可导入的扩展。算法源文件没有改动；绑定头文件采用现代版本，属于兼容构建，不是原论文历史环境复现。
3. 调用实际 C++ 扩展验证 4106 个整数的整流解码、分组持续解码、缓冲编码，以及与 Python 参考实现的字节一致性。
4. 在 CPU 上运行固定随机初始化的官方 P 帧网络，完成两个 64×64 连续 P 帧的真实四路字节编码、文件封装、读回和解码参考递推。

## 本实验边界

- 没有加载训练权重。随机种子是 20261023；不报告论文 PSNR、BD-Rate 或速度。
- 首个 RGB 参考由双方预共享，没有编码 I 帧；不能将此结果称为完整 I+P 视频测试。
- 显式将两个空间自回归层的权重乘以其 A 型掩码，满足真实路径直接读取权重的因果前提；原始算法源文件未修改。
- 以编码器内部重建值经 clamp 后与实际解码值比较；两个潜变量分支也逐元素比较。
- 当前结果只支持本机兼容构建和测试向量，不证明跨平台、跨版本或所有 checkpoint 的逐字节兼容性。

## 重跑

在 PowerShell 中运行：

```powershell
& 'D:\soft\py12\python.exe' 'E:\Projects\papers\iVc\DCVC_实验01_真实码流连通性\build_extensions.py'
& 'D:\soft\py12\python.exe' 'E:\Projects\papers\iVc\DCVC_实验01_真实码流连通性\test_cpp.py'
& 'D:\soft\py12\python.exe' 'E:\Projects\papers\iVc\DCVC_实验01_真实码流连通性\test_p_frames.py'
```

编译脚本会创建同级临时英文目录 `dcvc-smoke-build-20261023`，避开 MinGW 对中文链接输出路径的兼容问题；完成后可仅保留本实验目录里的扩展和日志。

## 结果文件

- `build/结果.json`：环境、算法源码哈希核对、扩展文件及哈希。
- `C++验证结果.json`：真正执行 C++ 扩展的整数与字节验证结果。
- `P帧验证结果.json`：两帧的四路长度、文件头开销、潜变量/重建一致性、forward 差异。
- `actual_rans.bin`、`p_frame_1.bin`、`p_frame_2.bin`：本轮实际产生的字节文件。
- `shared_reference.png`、`input_*.png`、`decoded_*.png`：辅助查看用图片；内部参考使用浮点解码结果，不重新读取保存后的 PNG。

下一步是取得匹配的官方 I/P 权重并准备短 GOP 输入，再进行完整序列测试。当前原始 `test_video.py` 还依赖本环境未安装的 `pytorch-msssim`；本次专门的 P 帧烟雾测试不调用该指标。
