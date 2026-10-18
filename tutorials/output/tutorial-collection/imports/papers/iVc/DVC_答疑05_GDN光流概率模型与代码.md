# DVC｜GDN、光流、概率模型及代码

> 用户问题：GDN、光流网络、概率模型的内部推导，以及代码实现 这些展开讲
>
> 来源：本聊天 `01a13ae4-6cb2-7f23-b09c-942490bf8387`，公开回复记录第 463 行，2026-10-15 16:48:14 +08:00。
>
> 可核实定位：补充推导；后续PyTorch源码；本地独立教学实现。

### 原进度消息中的实质性补充（记录第 346 行）

<!-- source-body:C346:begin -->
发现了一个需要先说明的区别：作者原始仓库公开的是测试代码，明确未提供熵编码模块，特征以 `.pkl` 保存并报告估计码率。我会结合它链接的 PyTorch 实现讲解，并补一份可运行的教学代码，区分“估计比特数”和“真正生成压缩码流”。

<!-- source-body:C346:end -->

### 原进度消息中的实质性补充（记录第 399 行）

<!-- source-body:C399:begin -->
代码里有几处与论文图示不同：这份后续 PyTorch 实现用四层金字塔估计光流，残差概率采用 Laplace 分布；运动压缩使用 LeakyReLU，运动补偿网络接收变形图与参考图。它还显式统计旁信息 \(z\) 的码率。接下来的推导会标明这些区别，避免把论文和重实现混在一起。

<!-- source-body:C399:end -->

### 原进度消息中的实质性补充（记录第 422 行）

<!-- source-body:C422:begin -->
教学代码已跑通，并通过了 GDN 解析梯度、半像素采样、CDF 单调性与归一化、各模块反向传播，以及编码端和独立重建端一致性的检查。它使用合成图像验证数学和数据流；没有训练权重，码率是概率估计值，不代表论文的压缩性能。

<!-- source-body:C422:end -->

<!-- source-body:R07:begin -->
可以。这次深入到**公式为什么这样写、梯度怎样传播，以及源码中对应哪几行操作**。

我已经准备并运行了[完整教学代码](DVC_讲解资源/code/dvc_internals.py)。它包含 GDN、金字塔光流、可学习概率模型、超先验和率失真训练。代码使用较小通道数和随机初始化，方便学习；尚未训练成具有实用压缩效果的模型。

先说明依据：下面对照的是[作者原仓库链接的 PyTorch 重实现](https://github.com/ZhihaoHu/PyTorchVideoCompression)。它与论文图示存在部分结构差异，我会逐处注明。

---

1. **GDN：用特征的“局部能量”调节特征幅度。**

   假设卷积层在某个空间位置输出 \(C\) 个特征：

   \[
   \mathbf{x}=[x_1,x_2,\ldots,x_C]
   \]

   GDN 对第 \(i\) 个通道进行变换：

   \[
   \boxed{
   y_i=
   \frac{x_i}
   {\sqrt{\beta_i+\sum_j\gamma_{ij}x_j^2}}
   }
   \]

   其中，\(\beta_i>0\)，\(\gamma_{ij}\geq0\)，它们都是可学习参数。求和发生在**同一空间位置的不同通道之间**。[GDN 原始压缩论文，公式（3）](https://arxiv.org/html/1611.01704v3)

   为什么分母要看其他通道？

   卷积后的特征可能共同受到某种因素影响。例如，局部对比度变强时，多个通道的响应幅度会同时增大。这意味着它们之间仍有统计依赖，分别编码会损失效率。

   用一个简化模型说明：

   \[
   x_i=s\,a_i,\qquad s>0
   \]

   \(s\) 表示共同的幅度因素。暂时忽略较小的 \(\beta_i\)，则：

   \[
   y_i\approx
   \frac{sa_i}{\sqrt{\sum_j\gamma_{ij}s^2a_j^2}}
   =
   \frac{a_i}{\sqrt{\sum_j\gamma_{ij}a_j^2}}
   \]

   共同幅度 \(s\) 被抵消了。这解释了除法归一化为什么能够削弱一部分依赖。实际网络保留 \(\beta_i\)，并通过率失真训练决定合适的变换强度；它不保证所有特征完全独立。

   与 BatchNorm 相比，理解上的重要区别是：**GDN 使用当前位置的特征和共享的可学习参数，不依赖当前批次统计量。**

   再看梯度。令：

   \[
   s_i=\beta_i+\sum_j\gamma_{ij}x_j^2,
   \qquad y_i=x_i s_i^{-1/2}
   \]

   根据乘法和链式法则：

   \[
   \boxed{
   \frac{\partial y_i}{\partial x_k}
   =
   \frac{\delta_{ik}}{\sqrt{s_i}}
   -
   \frac{x_i\gamma_{ik}x_k}{s_i^{3/2}}
   }
   \]

   \(\delta_{ik}\) 在 \(i=k\) 时为 1，否则为 0。

   第一项来自分子 \(x_i\)，第二项来自分母。第二项也说明：**改变一个通道，会通过归一化影响其他通道。**

   教学代码中的核心操作只有几行：

   ```python
   beta = F.softplus(self.beta_raw) + 1e-6
   gamma = F.softplus(self.gamma_raw)[:, :, None, None]

   norm = F.conv2d(x.square(), gamma, bias=beta).sqrt()
   output = x / norm
   ```

   这里的 \(1\times1\) 卷积实现了：

   \[
   \beta_i+\sum_j\gamma_{ij}x_j^2
   \]

   `softplus` 保证参数为正。它定义为：

   \[
   \operatorname{softplus}(a)=\log(1+e^a)
   \]

   原重实现采用的是“平方重参数化＋LowerBound”，与教学版的正值参数化不同。[原 GDN 实现](DVC_讲解资源/code/reference/subnet/GDN.py#L63)

   `LowerBound` 的反向传播也有设计：参数低于下界时，如果梯度会推动它回到允许区域，仍然放行。因为更新为 \(p\leftarrow p-\eta g\)，当 \(g<0\) 时参数会增大。

   解码器中的 IGDN 则使用乘法：

   \[
   \hat x_i=
   y_i\sqrt{\hat\beta_i+\sum_j\hat\gamma_{ij}y_j^2}
   \]

   **IGDN 是学习得到的近似逆变换，不是把 GDN 的同一组参数拿来就能精确求逆。** 编码、解码两侧有各自的参数，并共同接受最终重建损失的训练。

2. **光流网络：先在小图上处理大运动，再逐层修正。**

   先明确光流是什么。它给每个位置一个二维位移：

   \[
   v(x,y)=(u(x,y),v(x,y))
   \]

   在教学代码里，我们把它定义为：**当前输出位置应该到参考图像的哪个位置取样**。

   光流估计的一个基础出发点是亮度恒定假设：

   \[
   I(x,y,t)\approx I(x+u,y+v,t+1)
   \]

   对右侧作一阶展开：

   \[
   I(x+u,y+v,t+1)
   \approx I(x,y,t)+I_xu+I_yv+I_t
   \]

   得到：

   \[
   I_xu+I_yv+I_t\approx0
   \]

   这是一个约束，却有 \(u,v\) 两个未知数，因此单个像素的信息通常不够。网络需要观察邻域、纹理和上下文来估计运动。

   SPyNet 的结构进一步解决了“大运动难估计”的问题：原图中移动 32 个像素，在缩小至 \(1/8\) 的图像中只移动约 4 个像素。

   它从粗到细进行计算。在第 \(k\) 层，先把上一层光流放大：

   \[
   \tilde V_k=2\,\operatorname{Upsample}(V_{k-1})
   \]

   再变形参考图像：

   \[
   W_k=w(I_k^{\mathrm{ref}},\tilde V_k)
   \]

   网络只估计剩余的光流修正量：

   \[
   \Delta V_k=
   G_k\!\left(
   \operatorname{concat}
   [I_k^{\mathrm{cur}},W_k,\tilde V_k]
   \right)
   \]

   最后：

   \[
   \boxed{V_k=\tilde V_k+\Delta V_k}
   \]

   **每一层学习的是修正量。** 金字塔处理大尺度位移，网络负责改善当前估计。[SPyNet 原论文，第 3 节](https://arxiv.org/html/1611.00850v2)

   上采样之后为什么还要乘 2？因为光流的单位也是像素。粗图上移动 2 个像素，对应尺寸加倍的细图上移动 4 个像素。

   每层修正网络的输入有：

   \[
   3\text{ 通道当前图}
   +3\text{ 通道变形参考图}
   +2\text{ 通道已有光流}
   =8\text{ 通道}
   \]

   对照的源码使用五层 \(7\times7\) 卷积，通道依次为：

   \[
   8\rightarrow32\rightarrow64\rightarrow32\rightarrow16\rightarrow2
   \]

   最后一层不加 ReLU，以便输出正、负方向的位移。**原 SPyNet 论文使用五级金字塔，这份 DVC 重实现使用四级。** [对应光流源码](DVC_讲解资源/code/reference/subnet/endecoder.py#L313)

   其中还藏着一个重要问题：`warp` 为什么能够传梯度给光流？

   因为它使用双线性插值。若采样位置落在四个像素之间，水平、竖直小数部分分别为 \(\alpha,\rho\)，则：

   \[
   \begin{aligned}
   w={}&(1-\alpha)(1-\rho)I_{00}
   +\alpha(1-\rho)I_{10}\\
   &+(1-\alpha)\rho I_{01}
   +\alpha\rho I_{11}
   \end{aligned}
   \]

   在一个插值单元内部，对水平位移求导：

   \[
   \frac{\partial w}{\partial u}
   =(1-\rho)(I_{10}-I_{00})
   +\rho(I_{11}-I_{01})
   \]

   因此，图像误差可以通过采样坐标传回光流网络。对一片完全均匀的区域，这个梯度可能很小，也呼应了“局部外观不足以唯一确定运动”。

   教学代码使用 `grid_sample`，并显式设置坐标转换与 `align_corners=True` 一致。还要注意符号：正的水平位移表示**向参考图像右侧取样**，不能直接解释成物体向右运动。

   原 SPyNet 训练会使用真实光流的端点误差：

   \[
   \operatorname{EPE}
   =\frac1{HW}\sum_{x,y}\|V(x,y)-V^*(x,y)\|_2
   \]

   DVC 在此基础上继续优化的是视频压缩目标。因此，预训练光流和为压缩而调整后的光流，优化目的有所不同。

3. **概率模型：学习符号概率，再把概率转成编码成本。**

   先分清三个对象：

   - 编码器产生连续特征 \(y\)。
   - 量化得到整数符号 \(\hat y=\operatorname{round}(y)\)。
   - 概率模型估计这些整数符号出现的概率。

   假设符号的真实分布是 \(q\)，我们使用的编码分布是 \(p\)。理想平均码长为：

   \[
   \mathbb E_{s\sim q}[-\log_2p(s)]
   \]

   将它展开：

   \[
   \boxed{
   \mathbb E_q[-\log_2p]
   =
   H(q)+D_{\mathrm{KL}}(q\|p)
   }
   \]

   右侧第一项是数据本身的熵，第二项是概率模型不匹配带来的额外成本。这解释了为什么改善概率模型能够降低码率。[超先验论文对编码成本的定义](https://arxiv.org/html/1802.01436v2)

   接下来最容易犯的错误是：**把连续概率密度值直接当成整数符号的概率。**

   如果量化结果是整数 \(k\)，说明量化前的值落在：

   \[
   [k-\tfrac12,\ k+\tfrac12)
   \]

   因此，若连续密度为 \(f\)，正确概率为：

   \[
   p(\hat y=k)
   =\int_{k-1/2}^{k+1/2}f(t)\,dt
   \]

   引入累积分布函数 \(F\)，就变成：

   \[
   \boxed{
   p(\hat y=k)
   =F(k+\tfrac12)-F(k-\tfrac12)
   }
   \]

   对照源码，你会反复看到：

   ```python
   probability = cdf(symbols + 0.5) - cdf(symbols - 0.5)
   bits = -torch.log2(probability.clamp_min(1e-9)).sum()
   ```

   前一行求区间概率，后一行估计编码成本。

   那么，CDF 本身怎么学习？

   这份重实现中的 `BitEstimator` 为每个通道学习一条单调 CDF，在不同空间位置共用参数。其内部层可以写成：

   \[
   u=h x+b,\qquad h=\operatorname{softplus}(h_{\rm raw})>0
   \]

   \[
   g(u)=u+a\tanh(u),
   \qquad a=\tanh(a_{\rm raw})\in(-1,1)
   \]

   最后一层通过 sigmoid，把输出限制到 \(0\) 与 \(1\) 之间。[概率估计器源码](DVC_讲解资源/code/reference/subnet/bitEstimator.py#L6)

   为什么这个结构是单调的？因为：

   \[
   g'(u)=1+a\bigl(1-\tanh^2u\bigr)>0
   \]

   正斜率仿射变换、上述单调函数和 sigmoid 连续复合，仍然单调。这样就能把网络输出解释为 CDF，并用两端之差获得非负概率。

   残差潜变量还使用了**尺度超先验**。原因是，不同区域的特征幅度不同：平滑区域可能集中在零附近，复杂区域的分布可能更宽。使用一条固定分布难以同时适配。

   实现过程为：

   \[
   z=h_a(|y|),\qquad
   \hat z=Q(z),\qquad
   b=h_s(\hat z)>0
   \]

   其中 \(\hat z\) 是要传输的旁信息，\(b\) 是为每个残差潜变量预测的分布尺度。

   ```mermaid
   flowchart LR
       A["残差潜变量 y"] --> B["超编码器"]
       B --> C["量化旁信息 ẑ"]
       C --> D["超解码器"]
       D --> E["分布尺度 b"]
       A --> F["量化符号 ŷ"]
       E --> G["条件概率与熵编码"]
       F --> G
   ```

   解码端必须先恢复 \(\hat z\)，才能得到相同的分布参数，再正确熵解码 \(\hat y\)。**旁信息必须付出比特成本。**

   Ballé 2018 的尺度超先验使用零均值 Gaussian 描述条件分布；这份后续 PyTorch 实现实际调用的是 **Laplace 分布**。虽然源码把变量命名为 `gaussian`、`sigma`，仍应以创建的分布对象为准。[实际概率计算](DVC_讲解资源/code/reference/net.py#L121)

   Laplace 分布的密度为：

   \[
   f(t\mid b)=\frac1{2b}e^{-|t|/b}
   \]

   积分得到 CDF：

   \[
   F(t\mid b)=
   \begin{cases}
   \frac12e^{t/b}, & t<0\\
   1-\frac12e^{-t/b}, & t\geq0
   \end{cases}
   \]

   因而：

   \[
   p(\hat y_i=k\mid\hat z)
   =F(k+\tfrac12\mid b_i)-F(k-\tfrac12\mid b_i)
   \]

   这里 \(b_i\) 是 Laplace 的尺度，标准差为 \(\sqrt2b_i\)，不能直接套用 Gaussian 的标准差含义。

   于是实现中的完整码率分成三项：

   \[
   \boxed{
   R=R_m+R_z+R_y
   }
   \]

   \[
   R_m=-\sum_i\log_2p_m(\hat m_i)
   \]

   \[
   R_z=-\sum_j\log_2p_z(\hat z_j)
   \]

   \[
   R_y=-\sum_i\log_2p_y(\hat y_i\mid\hat z)
   \]

   运动潜变量和超潜变量使用可学习 CDF；残差潜变量使用尺度条件分布。**只统计 \(R_y\) 而漏掉 \(R_z\)，会低估码率。**

   训练时为什么它们能产生梯度？取任意一个连续训练符号 \(s\)：

   \[
   R(s)=-\log_2p(s)
   \]

   \[
   \frac{\partial R}{\partial s}
   =-\frac{p'(s)}{p(s)\ln2}
   \]

   编码器因此会收到“怎样改变特征才能降低编码成本”的信号；概率模型同时学习怎样更准确地拟合这些特征。

4. **把代码连起来：一次前向计算同时产生重建误差和三种码率。**

   [教学代码中的 `MiniDVC`](DVC_讲解资源/code/dvc_internals.py#L288) 把上述模块连接起来。主要数据流可以压缩成下面这些操作：

   ```python
   # 运动分支
   flow = model.flow(current, reference)
   m_hat = quantize(model.motion_encoder(flow), model.training)
   prediction, warped = model.predict(reference, m_hat)

   # 残差与超先验
   y = model.residual_encoder(current - prediction)
   z_hat = quantize(model.hyper_encoder(y.abs()), model.training)
   scale = F.softplus(model.hyper_decoder(z_hat)) + 1e-4
   y_hat = quantize(y, model.training)

   # 重建
   reconstruction = prediction + model.residual_decoder(y_hat)

   # 三种编码成本
   R_m = estimated_bits(model.motion_cdf.likelihood(m_hat))
   R_z = estimated_bits(model.hyper_cdf.likelihood(z_hat))
   R_y = estimated_bits(laplace_mass(y_hat, scale))
   ```

   假设图像尺寸为 `[B, 3, H, W]`，则：

   \[
   \operatorname{bpp}
   =\frac{R_m+R_z+R_y}{BHW}
   \]

   **分母使用原图的像素数量，不是潜变量数量，也不再乘 RGB 的通道数 3。**

   在 RGB 像素归一化到 \([0,1]\) 的情况下，教学训练目标为：

   ```python
   loss = 256 * F.mse_loss(reconstruction, current) + bpp
   optimizer.zero_grad()
   loss.backward()
   optimizer.step()
   ```

   `backward()` 会沿着两类路径传播：

   - 重建误差通过残差解码、运动补偿和可微采样，影响前面的网络。
   - 编码成本通过概率模型和连续潜变量，影响特征表示及分布参数。

   训练阶段，三个量化位置都使用：

   \[
   \tilde s=s+\eta,\qquad
   \eta\sim\mathcal U(-0.5,0.5)
   \]

   推理阶段则使用取整。实际代码为：

   ```python
   def quantize(x, training):
       if training:
           return x + torch.empty_like(x).uniform_(-0.5, 0.5)
       return x.round()
   ```

   另外，源码还包含几处值得对照阅读的实现选择：

   | 项目 | 对照代码中的做法 |
   |---|---|
   | 运动压缩 | 八层卷积与 LeakyReLU；论文图 3 使用 GDN 结构 |
   | 运动补偿 | 输入变形图和参考图，输出修正量，再加回变形图 |
   | 残差变换 | 使用 GDN/IGDN |
   | 早期训练 | 前 50 万步增加变形误差和预测误差辅助项，之后移除 |
   | 参考图训练方式 | 此数据加载器直接读取参考图，不能当作论文在线缓存策略的完整复现 |

   其中，辅助训练目标对应：

   \[
   L=
   \lambda\left[
   D_{\rm recon}
   +w(D_{\rm warp}+D_{\rm prediction})
   \right]+R
   \]

   早期 \(w=0.1\)，后期为 0。[训练脚本](DVC_讲解资源/code/reference/main.py#L168)

   我写的教学版使用纯率失真目标，没有加入这段辅助训练日程，也采用较小通道数与不同的正值参数化，因此不能直接加载原仓库权重。

   还有一个实现边界要明确：**计算 `-log2(probability)` 只是估计码率。** 真正生成压缩文件，还需要熵编码器用相同的离散概率表编码符号，解码端再用同样的表恢复符号。

   作者原始 TensorFlow 仓库明确未公开熵编码模块；后续 PyTorch 重实现包含 `torchac` 的实际比特分支，但默认 `calrealbits=False`。[原仓库说明](https://github.com/GuoLusjtu/DVC#entropy-coding)

在你当前环境中，可以直接运行：

```powershell
& "D:\soft\py12\python.exe" "E:\Projects\research\paper-reading\dvc-internals\dvc_internals.py" --check --steps 3
```

我已验证解析 GDN 梯度、半像素采样及其梯度、CDF 单调性和归一化、Laplace 区间概率、各模块反向传播，以及从相同解码潜变量重建出相同图像。[验证记录](DVC_讲解资源/code/verification.json)

读代码时按 `GDN → warp → PyramidFlow → FactorizedCDF → MiniDVC.forward` 的顺序走，最后追踪 `loss.backward()`：这样能把每一个公式与实际张量操作对应起来。

<!-- export-addition:R07-portable:begin -->
【整理时补充运行路径】上方保留当时机器上的原始命令。随本汇编复制的教学代码位于 `DVC_讲解资源/code/dvc_internals.py`。在汇编所在目录中，用装有 PyTorch 的 Python 运行：

```powershell
python .\DVC_讲解资源\code\dvc_internals.py --check --steps 3
```

这只是路径适配；沿用原验证记录，不宣称本次重新训练。
<!-- export-addition:R07-portable:end -->
<!-- source-body:R07:end -->
