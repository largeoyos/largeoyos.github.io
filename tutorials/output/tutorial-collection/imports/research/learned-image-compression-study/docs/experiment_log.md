# 实验记录

## 2026-08-29：本地端到端烟雾实验

### 目的

确认 Windows 原生 CUDA 环境、数据读取、模型前向传播、率失真训练、checkpoint 保存、量化评测和结果导出能够形成完整闭环。以下实验均使用同一张 Kodak 图像训练和评测，不衡量泛化能力。

### 环境

- GPU：NVIDIA GeForce RTX 3060 Laptop，6GB
- Python：3.12.10
- PyTorch：2.11.0+cu128
- 模型：FactorizedPriorCodec，727,075 个参数
- 图像：Kodak `kodim01.png`，768×512
- 随机种子：42

### 实验 A：20 步链路检查

- `rd_lambda`：0.01
- estimated bpp：0.4881
- PSNR：14.5355 dB
- MS-SSIM：0.2125
- GPU 推理时间：0.1589 秒
- 观察：量化重建几乎为纯灰图，只能证明执行链路可用。

### 实验 B：200 步单图过拟合检查

- `rd_lambda`：0.05
- estimated bpp：0.5384
- PSNR：17.9473 dB
- MS-SSIM：0.4366
- GPU 推理时间：0.1782 秒
- 观察：房屋轮廓、窗户和屋顶结构已可辨认，但细节明显模糊。

相对实验 A，PSNR 提升 3.4118 dB，MS-SSIM 提升 0.2241，说明模型和训练损失能够学习图像结构。estimated bpp 同时上升，符合更偏重失真项时用更多表示容量换取重建质量的预期。

### 结论与边界

本次只完成了工程和可学习性验证。estimated bpp 来自因子化高斯 likelihood，没有产生可解码的实际压缩码流；训练集与评测集重叠，因此这些数值不得作为正式科研对比结果。

下一阶段应使用独立训练集与测试集：以 DIV2K 训练、Kodak 测试，固定多个 `rd_lambda`，再加入真实熵编码或 CompressAI 基线，绘制可复现的率失真曲线。
