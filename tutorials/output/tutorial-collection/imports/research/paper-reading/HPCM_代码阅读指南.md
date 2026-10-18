# HPCM 代码阅读指南

官方仓库：https://github.com/lyq133/LIC-HPCM

本地位置：`E:\Projects\research\LIC-HPCM`

本次检查版本：`c271cfe2412071e7cacf4186825f1bbff4434664`。已拉取源码并静态检查，尚未安装依赖、下载权重或运行官方模型。以下行号对应此版本。

## 先看哪个模型

先看 `src/models/HPCM_Base.py`。其中有分层编码和 CrossAttentionCell，可以对应论文中的两项主要设计。

`HPCM_Base_PhiContext.py` 是另一个上下文变体：其 forward_hpcm 直接将熵参数网络输出赋给 context_next，没有 Base 中的交叉注意力更新。README 也专门提到这个版本及 issue #3。阅读时不要把两个实现混起来。

`HPCM_Large.py` 和 `HPCM_1B.py` 暂时跳过；后者属于仓库增加的后续扩展工作。

## 第一遍：从输入到输出

打开 `src/models/HPCM_Base.py:199`，看 `HPCM.forward`：

1. `y = self.g_a(x)`：把图像转换为潜变量。
2. `z = self.h_a(y)`：从潜变量提取超先验侧信息。
3. 得到量化的 `z_hat`，并计算其 likelihood。
4. `params = self.h_s(z_hat)`：生成后续概率估计所需的参数信息。
5. `forward_hpcm(y, params, ...)`：分层处理潜变量，得到重建潜变量及概率分布尺度。
6. `x_hat = self.g_s(y_hat)`：重建图像。
7. 返回重建图和 y、z 的 likelihood，供损失计算。

第一次不用逐层研究卷积，只要分清 x、y、z、y_hat、x_hat 分别是什么。

## 第二遍：对应论文图2的分层编码

打开 `src/models/HPCM_Base.py:236`，看 `forward_hpcm`。

- `get_s1_s2_with_mask`：按 mask 选择元素并重新排列成较小尺度。实现位于 `src/models/base.py:334`，不是插值缩图。
- S1：`for i in range(2)`，新增两个编码步骤。第一步只使用超先验提供的信息。
- `recon_for_s2_s3`：把较小尺度的值填回较大尺度对应位置，见 `base.py:344`。
- S2：mask 列表使用 `[1:]`，新增三个步骤。
- S3：mask 列表使用 `[2:]`，新增六个步骤。

代码注释中的 4-step、8-step 容易误导：较大尺度中有一部分已经由较小尺度编码，所以新增步骤总数为 2 + 3 + 6 = 11。

重点跟踪 `y_hat_so_far`：它汇总当前已经重建的潜变量，后续步骤依赖这些已知值估计概率。这就是我们讨论的解码先后约束。

## 第三遍：对应图3和图4的渐进融合

打开 `src/models/HPCM_Base.py:136`，看 `CrossAttentionCell.forward`。

- `x_t` 提供 Q，`h_prev` 提供 K、V。
- `q @ k` 计算匹配分数；softmax 得到权重；权重与 V 相乘完成信息汇总。
- 输出加上当前状态经过卷积的结果，形成新的上下文。
- 代码先使用 `rearrange` 分窗口处理注意力，不是直接对整个潜变量网格做全局注意力。

回到 `forward_hpcm`，寻找：

```python
params = torch.cat((context_next, y_hat_so_far), dim=1)
context = y_spatial_prior_s1(...)
context_next = self.attn_s1(context, context_next)
scales, means = context.chunk(2, 1)
```

其中 `context` 是本步熵参数网络的输出，`context_next` 保存融合后的上下文。S2、S3有相同形式的更新。跨尺度则通过位置回填、超先验补充和 `context_net` 连接。

## 最后再看训练和真实编码

`train.py:36` 的 `RateDistortionLoss`：对 y 和 z 的 likelihood 计算负对数，得到估计 bpp；再加上 lambda × 255² × MSE。

`test.py:82` 的 `test`：加载权重并更新概率表，调用 compress 与 decompress。这里的 bpp 使用返回字节串长度计算，不是训练时的 likelihood 估计。默认测试流程把图像补齐到256的倍数，再裁回原尺寸。

`src/entropy_models/entropy_models.py:40` 的 `GGM`：概率估计与编码概率表相关实现。第一遍可以先跳过内部 CDF 和底层 rANS 代码。

## 当前机器的运行注意点

仓库 README 标明 Python 3.8、PyTorch 1.12，并附带 Linux / CPython 3.8 的 `.so` 熵编码扩展。当前 Windows 教学环境是另一套版本，不代表官方代码已可运行。

具体检查到：

- `entropy_models.py:7` 在导入时就需要 `_CXX` 扩展，不能仅凭“不生成码流”便认定可以绕过所有原生依赖。
- `HPCM_Base.py` 构造参数时指定 `device='cuda'`，`test.py` 也明确使用 CUDA。
- requirements.txt 包含多个深度学习框架和许多旧版依赖；正式配置环境前应梳理实际依赖，不宜直接装入现有教学环境。

## 今天的阅读目标

只看 `HPCM.forward` 与 `RateDistortionLoss`，能回答：图像从哪里进入、潜变量如何产生、重建图如何生成、压缩码率如何参与训练。下一次再看分层 mask 和交叉注意力。无需一次读完整个仓库。
