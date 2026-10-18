# DCVC 精读第 1 轮 标题摘要与引言

本轮范围为 NeurIPS 2021 正式版第 1 页：标题、作者与机构、摘要、引言第 1 至第 2 自然段。要掌握的核心是预测编码与条件编码的区别，以及引言中熵不等式的成立原因和解释边界。

用户指定的 [bib 文件](deep-contextual-video-compression.bib) 提供了摘要全文，以下按其内容呈现与翻译。其余正文从 [正式版 PDF](Li_Deep_Contextual_Video_Compression_NeurIPS_2021_paper.pdf) 获取，采用短摘录、逐段释义与讲解；释义不标为全文翻译。论文来源为 [NeurIPS 官方页面](https://proceedings.neurips.cc/paper/2021/hash/96b250a90d3cf0868c83f8c965142d2a-Abstract.html)。

## 标题与作者

**英文标题：** Deep Contextual Video Compression。

**中文译名：** 深度上下文视频压缩。

**作者与机构：** Jiahao Li、Bin Li、Yan Lu，Microsoft Research Asia。论文发表于 NeurIPS 2021。

这里的 context 指压缩当前帧时可以利用的辅助信息。它与自然语言中的上下文不是同一个任务概念。作者关注的是：已解码的参考信息能否以更适合压缩的形式帮助表示和重建当前帧。标题中的 contextual 提示了方法的重点。

## Abstract

**阅读位置：** 正式版第 1 页摘要，1 个自然段。

**英文原文，来自用户提供的 bib**

> Most of the existing neural video compression methods adopt the predictive coding framework, which first generates the predicted frame and then encodes its residue with the current frame. However, as for compression ratio, predictive coding is only a sub-optimal solution as it uses simple subtraction operation to remove the redundancy across frames. In this paper, we propose a deep contextual video compression framework to enable a paradigm shift from predictive coding to conditional coding. In particular, we try to answer the following questions: how to define, use, and learn condition under a deep video compression framework. To tap the potential of conditional coding, we propose using feature domain context as condition. This enables us to leverage the high dimension context to carry rich information to both the encoder and the decoder, which helps reconstruct the high-frequency contents for higher video quality. Our framework is also extensible, in which the condition can be flexibly designed. Experiments show that our method can significantly outperform the previous state-of-the-art (SOTA) deep video compression methods. When compared with x265 using veryslow preset, we can achieve 26.0% bitrate saving for 1080P standard test videos.

**中文翻译**

现有的大多数神经视频压缩方法采用预测编码框架：先生成预测帧，再编码当前帧与预测帧之间的残差。然而，从压缩率来看，预测编码只是次优方案，因为它仅通过简单的减法操作消除帧间冗余。本文提出深度上下文视频压缩框架，以实现从预测编码到条件编码的范式转变。具体而言，我们试图回答以下问题：在深度视频压缩框架中，如何定义条件、使用条件以及学习条件？为挖掘条件编码的潜力，我们提出将特征域上下文作为条件。这样可以利用高维上下文向编码器和解码器传递丰富的信息，帮助重建高频内容，从而获得更高的视频质量。我们的框架还具有可扩展性，能够灵活设计条件。实验表明，该方法能够显著优于此前最先进的深度视频压缩方法。对于 1080P 标准测试视频，相比采用 veryslow 预设的 x265，我们可以节省 26.0% 的码率。

**深入讲解**

摘要的逻辑是：许多已有方法编码残差，作者希望把参考信息更直接地作为条件输入，让网络学习怎样利用它。这一设计涉及三个不同的问题：条件应当包含什么信息；哪些模块使用条件；条件如何学得。它们是后续精读方法部分的主线。

特征域（feature domain）可以先理解为网络提取的多通道表示。与一张 RGB 预测图相比，它有机会携带多种有助于重建的线索。高频内容是空间变化较快的内容，例如边缘和纹理。此处“帮助重建高频内容”仍属于作者主张，具体证据要在方法与实验中检查。

26.0% 是摘要报告的特定测试条件下的码率节省。它不能直接解释为所有视频文件都缩小 26%，也不能据此推断编码速度。对应的质量指标、编码设置和统计方式将在实验部分核对。

## Section 1 Introduction 第 1 段

**阅读位置：** 正式版第 1 页，首段背景介绍。

**英文短摘录**

> “merely replaced by neural networks”

**摘录翻译：** “仅仅被神经网络替代。”

**段落释义**

作者把传统视频编码和许多当时的神经方法归纳为先预测、再编码残差的框架：虽然实现模块发生变化，处理当前帧的基本方式仍然延续。

**深入讲解，以下为补充示意**

令 x_t 为当前帧，x_tilde_t 为预测帧，残差为：

\[
r_t=x_t-\tilde x_t.
\]

解码器得到重建残差 r_hat_t 后，将其与同一个预测帧相加：

\[
\hat x_t=\tilde x_t+\hat r_t.
\]

例如某个像素的预测值为 100、真实值为 103，残差就是 3。参考信息已经解释了大量内容，只需编码剩余差异，这是预测编码有效的直觉。

这里还隐含着一个必须满足的实现条件：编码端和解码端应能生成相同的预测信息。因此后续会持续检查参考帧是否为重建帧、运动等信息如何传输，以及双方怎样同步生成上下文。

作者这一段要指出的是，替换模块与改变框架是不同层次的设计。用神经网络实现预测或残差编码，并不自动扩大条件信息参与编码与重建的方式。

## Section 1 Introduction 第 2 段

**阅读位置：** 正式版第 1 页，引言第 2 自然段。

**英文短摘录**

> “Encoding residue is a simple yet efficient manner”

**摘录翻译：** “编码残差是一种简单而有效的方式。”

**段落释义**

作者承认帧间相关性使残差编码有效，但提出条件编码具有进一步利用相关性的空间，并以熵不等式支撑这一动机。段末转向使用可学习自编码器探索视频相关性。原文引用 [12] 支撑熵比较，引用 [13, 14] 联系已有图像压缩工作。

**原文公式，无独立编号**

\[
H(x_t-\tilde x_t)\ge H(x_t\mid\tilde x_t).
\]

H 是香农熵。左边衡量不再以预测帧为条件时残差的不确定性；右边衡量已知预测帧之后当前帧还剩多少不确定性。这里的比较不是说减法会破坏信息。

## 熵不等式的补充推导

以下推导和数值例子是教学补充，不是论文原文或作者实验。

令 X 表示当前信号，P 表示预测信息，R=X-P。先考虑离散随机变量、有限熵，以及给定 P 后 X 与 R 一一对应的情形；不在减法后进行截断等不可逆操作。

**第 1 步，定义熵和条件熵。**

\[
H(R)=-\sum_r p(r)\log_2 p(r),
\qquad
H(R\mid P)=\sum_p p(p)H(R\mid P=p).
\]

熵描述平均不确定性。在理想无损源编码的意义下，它决定可以逼近的平均码长；使用 log2 时单位为 bit。条件熵则先对每一个已知条件计算不确定性，再取平均。

**第 2 步，利用给定 P 后的可逆性。**

当 P=p 已知时，R=X-p，反过来 X=R+p，因此：

\[
p(R=r\mid P=p)=p(X=r+p\mid P=p).
\]

这只是把可能取值重新编号，概率列表不变，所以：

\[
H(R\mid P=p)=H(X\mid P=p).
\]

对 p 取平均，得到：

\[
H(R\mid P)=H(X\mid P).
\]

**第 3 步，比较有条件和无条件的熵。**

互信息满足：

\[
I(R;P)=H(R)-H(R\mid P)\ge0.
\]

于是：

\[
\boxed{H(X-P)=H(X\mid P)+I(X-P;P)\ge H(X\mid P).}
\]

差值恰好是残差与预测信息之间仍存在的互信息。若 R 与 P 独立，互信息为零，等号成立；若残差分布随预测信息变化而变化，就可能存在严格差距。

### 数值例子

假设下列三种情况构成全部概率分布：

| 预测值 P | 当前值 X | 残差 R | 联合概率 |
| --- | --- | --- | --- |
| 50 | 50 | 0 | 1/2 |
| 100 | 99 | -1 | 1/4 |
| 100 | 101 | 1 | 1/4 |

如果不利用 P，残差的概率分布为 0 占 1/2，-1 和 1 各占 1/4，因而：

\[
H(R)=-\frac12\log_2\frac12
-2\cdot\frac14\log_2\frac14=1.5\ \text{bit}.
\]

如果利用 P：当 P=50 时，残差确定为 0，条件熵为 0；当 P=100 时，残差是等概率的 -1 或 1，条件熵为 1。因此：

\[
H(R\mid P)=\frac12\cdot0+\frac12\cdot1=0.5\ \text{bit}.
\]

所以 H(X given P)=0.5 bit。这里节省的理论空间来自对残差分布的条件区分；并非把残差数值进一步变小。这个例子比较的是平均熵，不意味着每个像素可以单独使用半个二进制位。

### 解释边界

**第一，减法本身不会丢失信息。** 给定 P 时，X 与 R 可互相恢复。如果一个残差编码器充分使用同一条件 P，理想情况下也能达到 H(R given P)=H(X given P)。该公式比较 H(R) 与 H(X given P)，不能据此认定所有残差架构都存在不可消除的劣势。

**第二，理论熵差不等于实际有损码率差。** 视频压缩还涉及学习变换、量化、重建失真、模型近似和辅助信息开销。具体架构能否在同等质量下减少总码率，要由实验验证。

**第三，作者的框架归纳需要限定范围。** 传统视频编码也使用上下文，例如 H.264/AVC 和 H.265/HEVC 中的 CABAC 使用上下文模型组织概率估计，参见 [Fraunhofer HHI 的 CABAC 技术说明](https://www.hhi.fraunhofer.de/en/departments/vca/research-groups/video-coding-technologies/research-topics/past-research-topics/context-based-adaptive-binary-arithmetic-coding-cabac.html)。应把这段引言理解为为更充分的条件建模提出动机，避免将其简化表述推广为所有传统或残差编码器都仅利用单个预测像素。

## 前置知识与本轮思考

本轮应能解释熵、条件熵和互信息，并能独立复现上述推导。可补充阅读 [MIT 6.441 讲义](https://www.ocw.mit.edu/courses/6-441-information-theory-spring-2016/pages/lecture-notes/)第 1 章与第 2 章；第 7 章包含编码端与解码端侧信息相关问题，留待需要时展开。

建议检查三个问题：为什么给定预测信息之后残差与原信号具有相同的条件熵？何时本文不等式取等号？若预测信息在解码端不可获得，为什么不能直接使用上面的条件编码比较？

## 阅读进度

- 已完成：标题、作者与机构、摘要、引言第 1 至 2 段；原文的无编号熵不等式及补充推导。
- 当前停止位置：正式版第 1 页末。
- 下一轮：正式版第 2 页顶部 Figure 1 与图注，然后引言第 3 段，以 “When we design” 开头；解释条件的定义、使用位置和学习方式。
- 连续进度与待验证问题：[DCVC 阅读记录](DCVC_阅读记录.md)。
