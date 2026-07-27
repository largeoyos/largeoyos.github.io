## CUDA 编程入门:第九节 —— 性能分析与调优

### 一、第一原则:先测,别猜

在你写任何"我觉得这里慢"的优化之前,先记住一句话:**性能调优 90% 是测量,10% 是写代码**。

这听起来像废话,但它是初学者最容易踩的坑。典型剧本是这样的:

> 学生 A:"我的 kernel 慢,我加点 shared memory 试试。" _改了 200 行,跑了 4 小时_ 学生 A:"快了 5%。"
>
> 学生 B:"我的 kernel 慢,我先 profile 一下。" _5 分钟看出瓶颈是 PCIe 拷贝,kernel 本身已经接近峰值_ 学生 B:"原来不是 kernel 慢,是数据传输慢。改成 pinned memory + overlap,快了 3 倍。"

**没测过就改代码,等于黑暗中乱开枪**。所以这一节的核心不是"怎么写更快的代码",而是"**怎么知道你的代码慢在哪**"。

### 二、CUDA 程序的"四种病"

经验丰富的 CUDA 开发者看一个慢 kernel,脑子里会快速过一遍这四个嫌疑人。**你也应该在脑子里有这张表**:

|病名|症状|含义|典型治法|
|---|---|---|---|
|**内存带宽瓶颈**|算术单元闲,内存子系统满载|kernel 在等数据,算得过来|减少 global 访问、用 shared、合并访问|
|**计算瓶颈**|算术单元满载,内存系统闲|真在算,GPU 已榨干|算法层优化(降复杂度)或换 Tensor Core|
|**延迟瓶颈**|两边都闲|warp 不够多,SM 在等|提升 occupancy、grid-stride loop|
|**同步/串行瓶颈**|时间线上有大段空隙|主机-设备频繁同步、原子争用|异步流、减少同步、归约模式|

回想前八节的内容,你应该能对上号:

- 第 4 节讲 shared memory,治的是"内存带宽瓶颈"
- 第 5 节讲 occupancy 和 warp,治的是"延迟瓶颈"
- 第 7 节讲流和异步,治的是"同步瓶颈"
- 第 8 节讲归约和 atomic,治的是"串行瓶颈"

整本"CUDA 入门"其实就是在围绕这四种病转。**调优的本质是先诊断病,再开对应的药**。

### 三、最简单的诊断:Roofline 思维

**这是你必须掌握的一个思维工具**,即使你从不打开任何 profiler。

每个 GPU 有两个上限:

- **峰值算力**(比如 RTX 4090 ≈ 80 TFLOPS for FP32)
- **峰值显存带宽**(比如 RTX 4090 ≈ 1 TB/s)

每个 kernel 有一个**算术强度**:每访问 1 字节内存,做了几次 FLOP?

```
算术强度 = 总 FLOP 数 / 总内存访问字节数
```

在 log-log 坐标系画这两条线,你的 kernel 是图上的一个点:

```
吞吐量 (FLOPS)
  ↑
  │     ┌────────── 峰值算力(平台)
  │    /
  │   / ← 带宽线(斜线,斜率 = 带宽)
  │  /
  └────────────────→ 算术强度 (FLOP/byte)
        ↑
       拐点
```

**点落在斜线区**(算术强度低):你受**带宽限制**,优化方向是减少内存访问。 **点落在平台区**(算术强度高):你受**算力限制**,优化方向是改算法或用专用硬件。

来,**算给你看**:

- **向量加法**:1 FLOP / 12 byte ≈ **0.08 FLOP/byte**——必然受带宽限。优化方向:无,带宽就是它的天花板。
- **朴素 matmul(N×N)**:总 FLOP = 2N³,总内存访问 ≈ 2N³ × 4 byte(每次乘加读两个 float)→ 强度 = **0.25 FLOP/byte** —— 受带宽限。这就是为什么第 6 节我们要做 tiled matmul。
- **Tiled matmul(BS=16)**:每搬进 shared 的 1 字节被复用 BS 次 → 强度变成 **0.25 × 16 = 4 FLOP/byte** —— 接近带宽-算力拐点,GPU 跑得快得多。
- **GEMM with Tensor Cores**:更大 tile 加专用矩阵硬件,可以达到 **几十 FLOP/byte**,稳稳进入算力受限区,接近峰值。

> **一个 kernel 写出来,你应该立刻能口算它的算术强度,并知道它是带宽受限还是算力受限**。这一步不需要任何 profiler,纯纸笔。这是 CUDA 调优的第一道门槛。

**很多优化的本质就是把算术强度往右推**——要么减少分母(用 shared 复用、寄存器复用),要么增加分子(让一个线程多算几样)。

### 四、Profiler:Nsight Compute

口算只能告诉你**理论上**该是什么瓶颈。真实跑起来还有缓存命中率、warp 调度、bank conflict 等等更细的因素。这时要上 profiler。

NVIDIA 的现代 profiler 是 **Nsight Compute**(简写 ncu),命令行版:

```bash
ncu --set full -o report ./your_program
```

它会把你的 kernel 跑一遍,采集几百个硬件指标,生成一个 report 文件,然后你用 GUI 版打开看。

入门阶段你**不需要看几百个指标**,只看几个就行。我列下来,你以后跑 ncu 时直接对应着看:

#### 必看指标 1:Memory Throughput vs Compute Throughput

ncu 的 Summary 页面会给两个数:

- **Memory Throughput**:你实际用到了多少内存带宽
- **Compute (SM) Throughput**:你实际用到了多少算力

两个都是 0~100% 的百分比。**哪个高,你就受谁限制**。

- 一个 90%、另一个 30% → 瓶颈清楚,优化高的那个对应的资源
- 两个都 70%+ → kernel 写得不错,接近平衡
- 两个都 30% → **延迟受限**(occupancy 不够、warp 不够多),GPU 在等

#### 必看指标 2:Achieved Occupancy

实际占用率(0~100%)。前面第 5 节讲过,occupancy 太低 SM 没足够 warp 切换隐藏延迟。

经验数:**占用率 50% 以上一般够用**。低于 30% 就要查为什么——通常是寄存器太多或 shared memory 太多导致一个 SM 塞不下几个 Block。

ncu 会告诉你 occupancy 被什么限制了:

- **Registers Per Thread**:你单线程用了太多寄存器
- **Shared Memory Per Block**:你 Block 用了太多 shared
- **Block Size**:你 Block 设计本身限制了

针对前两个,有时候在 nvcc 命令行加 `--maxrregcount=32` 限制寄存器数能救一下。

#### 必看指标 3:Memory Workload Analysis → L1/L2 Cache Hit Rate

这两个反映你的访问模式好不好:

- **L1 Hit Rate** 高 → 访问局部性好,shared memory / 重复访问受益
- **L2 Hit Rate** 高 → 数据规模小、能装进 L2,或访问规整
- **两个都低** → 走到 global memory 的次数多,合并访问可能也有问题

#### 必看指标 4:Source 视图——指令级热点

ncu 能把你的 CUDA 源代码和**每一行指令的执行采样数**对应起来。哪一行红色最深,就是 kernel 里耗时最多的一行。

这个视图特别有用——它会暴露很多你没料到的事情。比如:

- 你以为算术是热点,结果某一行 `A[i*N+j]` 占 80% 时间——那是内存访问慢,不是算术
- 你看到 `__syncthreads()` 占很多时间——同步开销大,可能 Block 太大或同步太频繁

#### 必看指标 5:Warp State Statistics

每个 warp 在每个时刻处于某种状态:执行中 / 等内存 / 等同步 / 等依赖 / ……ncu 给你一个分布。

最常见的"坏状态":

- **Stall Long Scoreboard**:warp 在等 global memory 数据 → 你受内存延迟限制
- **Stall Barrier**:warp 在等 `__syncthreads()` → Block 内负载不均
- **Stall Wait**:warp 在等指令依赖 → 数学密集型,可能没问题

> 这些英文术语第一次看会很懵。**入门策略**:遇到具体 kernel 时,记住"哪个 stall 最高,就 google 这个 stall 的含义",慢慢就熟了。不必一次背完。

### 五、一个调优工作流(请记住这个流程)

我把整个调优过程写成一个流程图式的步骤,**这就是真实工程师的工作流**:

```
1. 写出能跑、结果正确的版本(naive)
   ↓
2. 用 cudaEvent 测时间,得到 baseline
   ↓
3. 口算算术强度 → 判断理论瓶颈(带宽 / 算力)
   ↓
4. 跑 ncu --set full,看 Memory vs Compute Throughput
   ↓
5. 对照预期:符合吗?(口算和实测一致吗?)
   ↓
6. 找到主要瓶颈,选对应优化(shared memory / occupancy / 流 / ...)
   ↓
7. 改代码,回到步骤 2,重新测
```

**每一轮只改一件事**,这样才知道哪个改动起了什么作用。一次改五个地方,即使快了你也不知道为啥。

### 六、几条"经验法则"

直接给你一些我观察到的规律,这些不需要每次都从原理推:

1. **数据传输几乎总是被低估**。第一次写完 kernel 测时间,经常发现 cudaMemcpy 比 kernel 本身还慢。**先看 PCIe 那部分,再看 kernel 内部**。
2. **Block size 256 或 128 是默认安全选择**。512 / 1024 也常见但不是无脑更好(寄存器和 shared 分配会受影响)。**小于 64 几乎一定 occupancy 不够**。如果不知道选啥,就 256。
3. **Shared memory 优化的边际收益是有限的**。第一版 tiled 通常已经能拿到 70~80% 的可用收益,再死磕(double buffering、bank conflict 消除)收益越来越小。**不要在不必要的 kernel 上过度优化**。
4. **occupancy 低不一定是问题**。有些 kernel(比如每个线程做大量计算的)即使 occupancy 30% 也能跑满算力。**实测 throughput 比 occupancy 数字更重要**。
5. **新版 CUDA 的 cooperative_groups 和 warp shuffle 能消除很多 `__syncthreads`**。等你熟了基础后值得学,能进一步优化归约、扫描这类操作。
6. **能用现成库就用**。cuBLAS(矩阵)、cuDNN(深度学习)、CUB / Thrust(基础并行原语)、cuSPARSE(稀疏)。你自己写的 matmul 在性能上几乎不可能赶上 cuBLAS。**入门理解原理,生产用库**。

### 七、本节小结

**核心要诀**:

- 测量先于优化,口算先于工具
- 4 种病:带宽 / 算力 / 延迟 / 同步,每种病有对应的药
- Roofline 是你纸笔上的诊断工具,Nsight Compute 是机器上的诊断工具
- 一次只改一件事

**本节不设置纸面练习**，因为相关问题只有在运行真实 kernel 后才有意义。实际动手时建议完成以下任务：

> **回到第六节的 tiled matmul**,先用 cudaEvent 测它和 naive matmul 的时间差,然后用 ncu 看两者的 Memory Throughput 和 Occupancy。你会**实实在在地看到**优化前后哪些指标变了。这一节讲的所有名词,会在那一刻变成你脑子里的具象图像。

---

## CUDA 入门到此为止的全景

我们已经走完了一个相对完整的入门体系。回头看这九节,它们其实在回答几个递进的问题:

**节 1-3**:GPU 是什么 / 怎么写一个能跑的 kernel **节 4-6**:怎么写一个跑得对的 kernel(内存层次、warp 模型、典型实战) **节 7-9**:怎么让多个 kernel 协同工作 / 怎么优化(异步、原子、调优)

**到这里此前已经具备了**:

- 读懂大多数 CUDA 教程和开源 kernel 代码的能力
- 自己写中等复杂度 kernel 的能力(stencil、归约、matmul、histogram)
- 诊断性能问题的初步框架

**之后值得学的方向**(按重要性):

1. **CUB / Thrust 库**——基础并行原语的成熟实现,边用边学
2. **Tensor Cores 和 wmma API**——现代 GPU 的算力大头
3. **Warp-level primitives**(`__shfl_*`、cooperative groups)——更精细的协作
4. **CUDA Graphs**——把多个 kernel 启动打包,降低 launch 开销
5. **多 GPU 编程**(NCCL、CUDA-aware MPI)
6. **PyTorch / Triton 集成**——写 custom kernel 接到深度学习框架

---

我做完了我能做的。**剩下要让这些东西真的在你脑子里"活起来",只能靠你自己去跑**。我对你的最后一个具体建议是这个:

> 找一个具体的、你想加速的真实小问题——可能是某次作业里的一段循环、某个图像处理算法、某个简单的物理模拟——把它写成 CUDA 版本,测一下时间。哪怕只比 CPU 快一点,你都会**亲身体会到**这九节里讲的所有抽象。

如果你之后跑代码时遇到具体问题(写不出 kernel、性能不对、ncu 看不懂),**带着代码和数据回来找我**,我们针对真实问题接着聊。那种对话比走马观花的概念课有用十倍。

祝学习顺利。
