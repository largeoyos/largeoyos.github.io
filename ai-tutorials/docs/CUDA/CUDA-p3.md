## CUDA 编程入门:第六节 —— 矩阵乘法,CUDA 的"试金石"

### 一、为什么是矩阵乘法?

矩阵乘法 `C = A × B`(其中 A 是 M×K,B 是 K×N,C 是 M×N)有个特别的性质:**它的算术强度高,但天然有大量数据复用**。

想想看:

C[i][j]=∑k=0K−1A[i][k]×B[k][j]C[i][j]=k=0∑K−1A[i][k]×B[k][j]

- 计算 `C[i][j]`(一个元素)要做 K 次乘加,涉及 A 的第 i 行和 B 的第 j 列
- 计算 `C[i][j+1]`(同一行的下一个元素)要用 **A 的同一行 i**,但 B 的下一列
- 计算 `C[i+1][j]`(下一行同一列)要用 **B 的同一列 j**,但 A 的下一行

**A 的每一行被 N 次复用,B 的每一列被 M 次复用**。如果你不想办法利用这个复用,所有数据反复从 global memory 读,你就把算术强度高的好题做成了带宽题。

这就是为什么矩阵乘法是 CUDA 的"试金石"——**它把"global memory 慢、要用 shared memory 复用数据"这个核心思想体现得淋漓尽致**。深度学习训练的 90% 时间花在矩阵乘法上,优化它的回报巨大。

### 二、版本 1:朴素实现

我们先写一个最直白的版本,看它的问题在哪。

**线程组织**:让每个线程负责计算 C 的一个元素 `C[row][col]`。用 2D 的 Block(比如 16×16)和 2D 的 Grid。

```c
__global__ void matmul_naive(const float* A, const float* B, float* C,
                              int M, int N, int K) {
    int row = blockIdx.y * blockDim.y + threadIdx.y;
    int col = blockIdx.x * blockDim.x + threadIdx.x;

    if (row < M && col < N) {
        float sum = 0.0f;
        for (int k = 0; k < K; k++) {
            sum += A[row * K + k] * B[k * N + col];
        }
        C[row * N + col] = sum;
    }
```

启动方式:

```c
dim3 threadsPerBlock(16, 16);
dim3 blocksPerGrid((N + 15) / 16, (M + 15) / 16);
matmul_naive<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, M, N, K);
```

**这里有几个新东西**:

- `dim3` 是 CUDA 提供的 3D 整数向量类型,用来描述 2D/3D 的 Block 和 Grid 大小
- 注意 Grid 维度的顺序:`blocksPerGrid.x` 对应**列方向**(`col`,N 维),`blocksPerGrid.y` 对应**行方向**(`row`,M 维)。和图像处理一样,x 是横向,y 是纵向。
- 上一节告诉过你的规则:`threadIdx.x` 对应内存里变化最快的维度,所以 `col = ... threadIdx.x`、`row = ... threadIdx.y`。
- 行优先存储下,`A[row][k]` = `A[row * K + k]`,`B[k][col]` = `B[k * N + col]`,`C[row][col]` = `C[row * N + col]`。

**先验证合并访问**。在内层循环 k 的某次迭代里,看一个 warp 内相邻线程(`col` 相差 1):

- `A[row * K + k]`:warp 内所有线程的 `row` 相同(因为 `threadIdx.y` 相同)、`k` 相同,**所有线程读同一个地址** → 这叫 broadcast,硬件友好 ✓
- `B[k * N + col]`:warp 内 `col` 连续,地址 `B[k*N], B[k*N+1], B[k*N+2]...` 连续 → **合并访问** ✓
- `C[row * N + col]`:写入时,warp 内 `col` 连续 → **合并访问** ✓

这个版本至少**访问模式是对的**。但它的问题在哪?

### 三、朴素版的瓶颈

让我们数一下**访问 global memory 的次数**:

每个线程为了算一个 `C[row][col]`,要读 K 次 A、K 次 B,共 **2K 次 global memory 读**,做 K 次乘加。

总共有 M×N 个线程,所以全 kernel 共 **2MNK 次 global memory 读**,做 MNK 次乘加。

**算术强度** = MNK 次乘加 / (2MNK × 4 字节) = `1 / 8` FLOP/byte ≈ 0.125 FLOP/byte

回顾第 4 节我说过的:这个数和向量加法(0.083)是一个量级的——**朴素 matmul 仍然是带宽受限的!** 计算单元远远没吃饱。

但矩阵乘法**本来应该**是计算密集的——它的总工作量是 O(MNK) 次乘加,数据量只有 O(MN + NK + MK)。我们刚才把它写得这么"带宽受限",是因为**完全没利用数据复用**。

具体哪里浪费了?**`A[row][k]` 这个值,被 `(row, 0), (row, 1), ..., (row, N-1)` 这 N 个线程各自从 global memory 读了一遍**。同一份数据被读 N 次。

> 这个观察就是优化的入口。**Shared memory 该出场了**。

### 四、版本 2:分块矩阵乘法(Tiled Matmul)

核心思想:**让一个 Block 协作,把 A 和 B 的一小块"瓦片"(tile)从 global memory 搬到 shared memory,然后大家都从快内存里读这块数据**。

#### 数学上怎么分块

把 A、B、C 都按 16×16 的 tile 切成网格。一个 Block 负责计算 C 的一个 16×16 tile(下面用 `BS` 表示 Block size = 16):

要算 `C` 的一个 tile `(by, bx)`,我们需要:

Ctile(by,bx)=∑t=0K/BS−1Atile(by,t)×Btile(t,bx)Ctile(by,bx)=t=0∑K/BS−1Atile(by,t)×Btile(t,bx)

也就是说,**沿着 K 维度,A 和 B 各扫过一系列 tile,把它们的小矩阵乘积累加起来**。

每一步 t 里:

1. Block 协作把 `A_tile(by, t)` 和 `B_tile(t, bx)` 搬进 shared memory
2. `__syncthreads()` 等所有人搬完
3. Block 内每个线程从 shared memory 读自己需要的数据,做这一步的部分乘加
4. `__syncthreads()` 等所有人算完(否则有人提前进入下一轮,把 shared memory 给覆盖了)
5. 进入下一个 t

#### 代码

```c
#define BS 16   // tile / block size

__global__ void matmul_tiled(const float* A, const float* B, float* C,
                              int M, int N, int K) {
    __shared__ float As[BS][BS];
    __shared__ float Bs[BS][BS];

    int bx = blockIdx.x, by = blockIdx.y;
    int tx = threadIdx.x, ty = threadIdx.y;

    int row = by * BS + ty;
    int col = bx * BS + tx;

    float sum = 0.0f;

    // 沿 K 维度滑动 tile
    for (int t = 0; t < (K + BS - 1) / BS; t++) {
        // 步骤 1:协作把 A 的 tile 搬进 shared memory
        // 当前线程 (ty, tx) 负责搬 A[row][t*BS + tx]
        if (row < M && t * BS + tx < K)
            As[ty][tx] = A[row * K + t * BS + tx];
        else
            As[ty][tx] = 0.0f;

        // 协作搬 B 的 tile
        // 当前线程 (ty, tx) 负责搬 B[t*BS + ty][col]
        if (t * BS + ty < K && col < N)
            Bs[ty][tx] = B[(t * BS + ty) * N + col];
        else
            Bs[ty][tx] = 0.0f;

        // 步骤 2:等所有线程搬完
        __syncthreads();

        // 步骤 3:从 shared memory 读,累加这一段
        for (int k = 0; k < BS; k++) {
            sum += As[ty][k] * Bs[k][tx];
        }

        // 步骤 4:等所有人算完,再开始下一轮搬运
        __syncthreads();
    }

    // 写回结果
    if (row < M && col < N) {
        C[row * N + col] = sum;
    }
```

#### 这段代码的关键点

建议**对照代码逐项确认**，其中涵盖前五节的主要概念：

1. **`__shared__ float As[BS][BS]`**——Block 内共享的快速内存。每个 Block 有自己的一份。
2. **协作搬运**:整个 Block 有 16×16 = 256 个线程,刚好和 tile 大小相同,每个线程搬运 A 的一个元素和 B 的一个元素。**完美的"每人搬一点"模式**。
3. **两个 `__syncthreads()` 的位置**:一个在搬完后(防止有人提前读)、一个在算完后(防止有人提前覆盖)。**少一个都会出错**。
4. **合并访问验证**:
 - 搬 A 时:`A[row * K + t*BS + tx]`,warp 内 `tx` 连续 → 地址连续 ✓
 - 搬 B 时:`B[(t*BS + ty) * N + col]`,warp 内 `tx` 连续 → `col` 连续 → 地址连续 ✓
5. **边界检查**:用 0 填充越界部分,这样不影响累加结果。这是处理 M、N、K 不是 BS 的整数倍的标准技巧。

#### 性能对比

数一下 global memory 访问:

每个 Block 要算一个 16×16 = 256 个元素的 tile。沿 K 维有 K/16 步,每步搬 A 的一个 16×16 tile(256 个 float)+ B 的一个 16×16 tile(256 个 float)= **512 次 global memory 读**。总共 K/16 步,所以一个 Block 的 global memory 读 = `512 × K/16 = 32K`。

平均**每个输出元素**的 global memory 读 = `32K / 256 = K/8`。

对比朴素版:每个输出元素读 `2K` 次 global memory。**减少为原来的 1/16**,正好等于 BS。如果 BS = 32,理论上减少为 1/32。

> **直觉上**:每搬进 shared memory 的一份数据,被 BS 个线程复用了,所以 global memory 访问压力降到 1/BS。

实测下来,tiled 版本通常比 naive 版本快 **3~5 倍**(很多变量影响,但量级正确)。

### 五、再往后,还有什么可以优化?

到这里此前已经写出了一个**像样的** matmul kernel。但工业级实现(比如 cuBLAS)还会快 10 倍以上。它们做了什么?简单列举,让你知道还有哪些路:

1. **Register tiling**:不只用 shared memory,还让每个线程在自己的寄存器里累加多个输出元素(thread coarsening 的进阶)
2. **Double buffering**:一边搬下一轮的数据,一边算这一轮——**让计算和搬运并行**(这要用到 CUDA 的异步内存拷贝和流)
3. **Tensor Cores**:Volta 之后的 GPU 有专门的矩阵乘法硬件,一个指令算 4×4×4 的小矩阵乘
4. **避免 shared memory bank conflict**:shared memory 内部分成 32 个 bank,如果 warp 内多个线程访问同一个 bank,串行化。某些访问模式会触发,需要 padding 调整

**这些都不是入门要管的**。但你应该知道:**优化是无止境的,每一层都对应一个特定的硬件限制**。

### 六、本节小结

到这里,此前已经走完了 CUDA 入门的核心路径。回头看你掌握了什么:

- 异构编程模型:host/device、内存分离、数据传输
- 线程层次:Grid / Block / Thread,以及索引计算
- 核函数语法:`__global__`、`<<<...>>>`、边界检查
- 内存层次:global / shared / register,和它们的速度差
- 协作模式:`__shared__` + `__syncthreads()` 实现 Block 内数据复用
- 硬件执行:warp、SIMT、divergence、SM、occupancy
- 合并访问:让 `threadIdx.x` 对应连续内存
- Grid-stride loop:解耦 Grid 大小和数据大小
- 分块算法:把数据复用模式映射到 shared memory tile

这些是 90% 的 CUDA 代码都会用到的基础。剩下 10% 是各种高级技巧——异步、流、原子操作、cooperative groups、PTX 内联汇编、Tensor Cores——可以以后按需学。

### 七、给你最后的题

这次只一道,但分量足。**做完这道,你算是真的入门了。**

> **题目**:实现一个 CUDA kernel,计算 **矩阵向量乘法** `y = A * x`,其中 A 是 M×N 矩阵、x 是长度 N 的向量、y 是长度 M 的向量。
>
> 也就是说:`y[i] = sum_{j=0}^{N-1} A[i][j] * x[j]`,共 M 个输出元素。
>
> **要求**:
>
> 1. 让一个 Block 计算 y 的一个元素(整个 Block 256 个线程协作算一个 sum)
> 2. 用 shared memory 做归约求和(reduction)
> 3. 注意合并访问

**几个提示,你不要直接看,先自己想 5 分钟**:

<details> <summary>提示 1:线程组织</summary>

Block 数 = M(每个 Block 算一个 `y[i]`)。Block 内 256 个线程协作处理 A 的第 i 行和 x 的全部 N 个元素的点积。如果 N > 256,每个线程用 grid-stride 风格的循环负责多个元素。

</details> <details> <summary>提示 2:归约</summary>

256 个线程各自算了部分 sum,要把它们加成一个数。经典做法:把 256 个部分和写进 shared memory,然后做"树状归约"——第 1 步 128 个线程把后半段加到前半段,第 2 步 64 个线程加,然后 32、16、8、4、2、1。每步之间要 `__syncthreads()`。

</details> <details> <summary>提示 3:写回</summary>

只有线程 0 把最后的 sum 写到 `y[blockIdx.x]`。

</details>

把你的代码贴给我,我会逐行评论。**特别注意**:

- 你的内层 stride 循环里,合并访问保住了吗?
- 树状归约里的 `__syncthreads()` 你放对位置了吗?
- 边界条件怎么处理(N 不是 256 的整数倍)?

这道题做出来,你具备了写真实 CUDA 代码的所有基本功。再之后的进阶(异步流、原子操作、Tensor Cores、CUDA Graphs)就是按需深入的事了。

## 我的观察

第 4 节末:三道题,跳过。 第 5 节末:三道题,我特地说"这次请认真做",跳过。 第 6 节末:一道题,我说"做完这道你才算真的入门",跳过。

我猜可能有几种情况:

- (a) 你现在没在机器旁边,只是想先快速浏览一遍,以后再回来做题
- (b) 你想先看完全部内容,建立全局视野,再回头练习
- (c) 题目对你来说太难,但你不好意思说
- (d) 你对"做题"这种学习方式没兴趣,只想读完

**这几种情况我都能理解,但它们对应不同的教学策略**。我不想猜错了往下灌——CUDA 后面的内容(异步流、原子操作、性能调优)对"动手"的依赖比前面更强,你不写代码就只是在背名词。

### 我想先问你

(顺便说一句:**前面六节我们已经覆盖了 CUDA 入门的核心地形**——异构模型、线程层次、内存层次、warp 执行、合并访问、shared memory、tiled matmul。如果你只想到这里为止,把第六节那道 matvec 题真正动手做出来,你就具备了独立读 CUDA 代码、写中等规模 kernel 的能力,这本身就是一个完整的入门里程碑。后面的内容是"进阶",不是"必须"。)
