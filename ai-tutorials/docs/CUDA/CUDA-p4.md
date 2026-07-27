## CUDA 编程入门:第七节 —— 异步执行与 CUDA 流

### 一、先揭开一个你可能没意识到的事实

回想第三节那个向量加法,你大概会以为它的执行流程是:

```
CPU 执行 cudaMemcpy(H→D)  ──> 等 GPU 拷完
       ↓
CPU 启动 kernel            ──> 等 GPU 算完
       ↓
CPU 执行 cudaMemcpy(D→H)  ──> 等 GPU 拷完
       ↓
程序结束
```

**实际上不是这样**。真实情况是:

```
CPU 执行 cudaMemcpy(H→D)        ── 这个是阻塞的,CPU 真的等
       ↓
CPU 调用 kernel<<<...>>>        ── CPU 立刻往下走!GPU 在后台跑
       ↓
CPU 调用 cudaMemcpy(D→H)        ── 这个又阻塞,等 GPU 把前面的活都干完
       ↓
程序结束
```

**核函数启动是异步的**——CPU 把"启动 kernel"这件事告诉 GPU 之后,**不等 GPU 跑完就返回**,接着执行下一行。这就是为什么我在第三节说要用 `cudaDeviceSynchronize()` 来"等 GPU 跑完才能捕获错误"。

来个小思考——**为什么这个异步设计是对的?**

…………

因为如果同步,CPU 会大量时间在等 GPU,什么也干不了。异步让 CPU 和 GPU **并行**:CPU 可以一边准备下一批数据/做日志/和用户交互,GPU 一边算。这是性能优化的第一个杠杆。

### 二、异步带来的新问题

异步是好事,但带来一个新约束:**GPU 上的操作彼此之间是有顺序的吗?**

举个具体场景。假设你这样写:

```c
cudaMemcpy(d_A, h_A, size, cudaMemcpyHostToDevice);   // 步骤 1
kernel1<<<...>>>(d_A, d_B);                            // 步骤 2  依赖 d_A
kernel2<<<...>>>(d_B, d_C);                            // 步骤 3  依赖 d_B
cudaMemcpy(h_C, d_C, size, cudaMemcpyDeviceToHost);    // 步骤 4  依赖 d_C
```

直觉上,这四步是串行的——后一步依赖前一步的结果。如果 GPU 真的"异步乱跑",会不会步骤 2 在步骤 1 拷完之前就开始算,读到垃圾数据?

**不会**。CUDA 保证:**默认情况下,所有 GPU 操作按你提交的顺序串行执行**。这个"顺序串行"的载体叫**默认流(default stream)**。

> 一个 **stream(流)** 就是一个"GPU 操作队列",里面的操作严格按提交顺序执行。**默认流是一个隐式存在的、所有 CUDA 调用默认进去的队列**。

到这里你还没看到"流"有什么用——因为默认流就是个队列,你之前一直在用它,只是没察觉。**关键来了**:你可以**创建多个流**,**不同流之间是并行的**。

### 三、多流:并行做多件事

为什么需要多流?来,先看这个场景:

你要处理 4 个独立的批次数据,每个批次都要"H→D 拷贝 + kernel + D→H 拷贝"。串行写法:

```
批次1:H→D ─ kernel ─ D→H
                              批次2:H→D ─ kernel ─ D→H
                                                            批次3:...
                                                                          批次4:...
```

总耗时 = 4 × (拷贝 + 计算 + 拷贝)。

但仔细想——**拷贝是走 PCIe 的、计算是 GPU 算的,这两件事用的硬件不同**。能不能让批次 2 的 H→D 拷贝和批次 1 的 kernel 计算**同时进行**?

```
批次1:H→D ─ kernel ─ D→H
批次2:      H→D ─── kernel ─── D→H
批次3:               H→D ─── kernel ─── D→H
批次4:                        H→D ─── kernel ─── D→H
```

总耗时几乎降到原来的 1/3 ~ 1/2。这种"拷贝和计算并行"的优化叫 **overlap**,是 CUDA 性能优化的另一个大杠杆。

实现方式就是把不同批次放进**不同的流**:

```c
// 创建 4 个流
cudaStream_t streams[4];
for (int i = 0; i < 4; i++) cudaStreamCreate(&streams[i]);

// 在每个流里独立地提交"拷贝 + 计算 + 拷贝"
for (int i = 0; i < 4; i++) {
    cudaMemcpyAsync(d_A[i], h_A[i], size, cudaMemcpyHostToDevice, streams[i]);
    kernel<<<grid, block, 0, streams[i]>>>(d_A[i], d_C[i]);
    cudaMemcpyAsync(h_C[i], d_C[i], size, cudaMemcpyDeviceToHost, streams[i]);
}

// 等所有流跑完
for (int i = 0; i < 4; i++) cudaStreamSynchronize(streams[i]);

// 销毁流
for (int i = 0; i < 4; i++) cudaStreamDestroy(streams[i]);
```

注意三个新东西:

**1. `cudaMemcpyAsync`**:`cudaMemcpy` 的异步版本,**不阻塞 CPU**,只是把"拷贝"塞进流里。

**2. `kernel<<<grid, block, 0, streams[i]>>>`**:核函数启动配置其实有 4 个参数——`grid, block, sharedMemBytes, stream`。前面我们一直用前两个,第 3 个(动态共享内存)和第 4 个(流)默认都是 0,意思是"不用动态 shared,放进默认流"。这里我们指定流。

**3. 锁页内存(pinned memory)**:有个**坑**——`cudaMemcpyAsync` 要想真正异步,host 端的内存**必须是锁页内存**,而不是普通的 `malloc`。否则 CUDA 会偷偷退化为同步。锁页内存用 `cudaMallocHost(&h_A, size)` 分配,用 `cudaFreeHost(h_A)` 释放。

> 这点初学者经常栽——写了 `cudaMemcpyAsync` 觉得"我都异步了为什么没快",结果发现 host buffer 是 `malloc` 出来的。**Async 三件套**:`cudaMallocHost` + `cudaMemcpyAsync` + `cudaStream_t`,一个不能少。

### 四、流之间和流内部的同步规则

这部分必须想清楚,否则写出的并发代码会有微妙 bug。**三条规则**:

1. **同一个流内**:所有操作严格按提交顺序串行。
2. **不同流之间**:操作是并发的,**没有任何顺序保证**。
3. **默认流是特殊的**:在它里面的操作,会**和所有其他流的操作互相阻塞**(默认流是"全局屏障")。所以**如果你用了多流,就别再往默认流里塞东西**,否则并发就破了。

来,**检验一下你的理解**——下面这段代码,kernel1 和 kernel2 会并行吗?

```c
cudaStream_t s1, s2;
cudaStreamCreate(&s1); cudaStreamCreate(&s2);

kernel1<<<grid, block, 0, s1>>>(...);
kernel2<<<grid, block>>>(...);             // 注意:这一行没指定流!
kernel3<<<grid, block, 0, s2>>>(...);
```

…………

**不会**。`kernel2` 进了默认流,默认流和所有其他流互斥同步,所以执行顺序变成 `kernel1 → kernel2 → kernel3`,完全串行。这就是上面"用多流就别碰默认流"的具体体现。

(其实新版 CUDA 有 per-thread default stream 等机制可以缓解这点,但**入门阶段把"默认流是全局屏障"当成铁律就好**。)

### 五、Event:更精细的同步

有时候你需要的同步不是"等整个流跑完",而是"等流里某个特定时刻"。这时用 **event(事件)**。

典型用途有两个:

**(a) 测时间**。这是入门阶段最常用的:

```c
cudaEvent_t start, stop;
cudaEventCreate(&start); cudaEventCreate(&stop);

cudaEventRecord(start);                    // 记录开始时刻
kernel<<<grid, block>>>(...);
cudaEventRecord(stop);                     // 记录结束时刻
cudaEventSynchronize(stop);                // 等结束事件真的发生

float ms;
cudaEventElapsedTime(&ms, start, stop);    // 算两个事件之间的时间
printf("kernel took %.3f ms\n", ms);

cudaEventDestroy(start); cudaEventDestroy(stop);
```

> **为什么不用 CPU 端的 `clock()` 或者 `chrono`?**——因为 GPU 异步,CPU 时间测的是"我发命令花了多久",不是 GPU 真正跑的时间。CUDA event 是 GPU 端打的时间戳,精确。

**(b) 跨流同步**。让流 B 等流 A 跑到某一步:

```c
cudaEventRecord(evt, streamA);       // 在 streamA 的某点埋一个事件
cudaStreamWaitEvent(streamB, evt);   // streamB 之后的操作必须等这个事件
```

这比 `cudaStreamSynchronize` 细得多——后者会让 CPU 阻塞等流跑完,前者只让 GPU 内部一个流等另一个流,**CPU 完全不停**。

### 六、本节小结:三个层级的并行

到这里你应该能看出,CUDA 的并行是**多层叠加**的:

|层级|并行单位|机制|
|---|---|---|
|最细|warp 内 32 个线程|SIMT 锁步|
|中|Block 内的多个 warp|SM 上 warp 调度器切换|
|大|多个 Block|Grid 内并发,塞满 SM|
|最大|CPU 和 GPU、不同流|异步执行、多流并发|

前六节我们打的是中间三层(同一个 kernel 内部)。这一节是**最外层**——多个 kernel/拷贝之间的并行。

### 七、一道题(动手或心算都行)

你不一定要写代码,但**一定要在脑子里走一遍**。

> **场景**:你要处理 1 GB 的输入数据,做一个 kernel 处理后输出 1 GB 结果。GPU 显存够装。
>
> 假设:H→D 拷贝耗时 100 ms,kernel 计算 100 ms,D→H 拷贝 100 ms。
>
> **问**: (a) 如果你用单流串行做,总耗时是多少? (b) 如果你把数据切成 4 块,用 4 个流做,**理论上**总耗时大约是多少? (c) 为什么是"理论上"?实际上能不能达到这个时间?瓶颈在哪?

(a) 简单:300 ms。

(b) 想想第三节那张 overlap 的图。当所有流都跑起来后,流水线里**同时**进行的最多有 3 件事:某流的 H→D、另一流的 kernel、又一流的 D→H。如果三种操作完美 overlap,**总时间约等于"最长的单一阶段总时间"** ——4 个块,每个块 H→D 100/4 = 25 ms,D→H 25 ms,kernel 25 ms。流水满载后约等于 4 × 25 = 100 ms,加上启动和收尾的 50 ms,大约 **150 ms**。

(c) 关键观察:**PCIe 总线只有一条**。H→D 和 D→H 共用同一条物理链路(早期 GPU)或者两条独立链路(现代专业卡有双向 DMA)。如果是单链路卡,H→D 和 D→H **不能真正并行**,只能 H→D 和 kernel 并行 / kernel 和 D→H 并行。这种时候理论极限是 200 ms 左右,不是 150 ms。

> 所以"实际能不能达到理论值"取决于硬件 DMA 引擎的数量。这是用 nvprof / Nsight 这类工具实测时常常困扰人的地方——**为什么 overlap 没拉满?** 答案常常是 PCIe 单向。

你可以选择:

**选项 A**:跳过这道题,我直接讲下一节(原子操作与归约)。

**选项 B**:你把(a)(b)(c)的回答(哪怕是"和你给的解释一致")发给我,确认理解,然后下一节。

**选项 C**:你想到这一节有任何不清楚的(比如"event 和 stream 的关系到底是什么"、"per-thread default stream 是什么"),问我,我们先把它聊透。

如果只是看,我就把后面的内容写得更"读得下去"一些(更多类比、更少代码细节);如果你会跑,我就继续保留代码的具体性。

## CUDA 编程入门:第八节 —— 原子操作与归约

### 一、先抛一个让你必栽的问题

此前已经熟悉了"每个线程算自己的一格,互不干扰"的模式(向量加法、matmul 都是)。但有些问题不是这样——多个线程要往**同一个**位置写。

最简单的例子:**对一个数组求和**。

```c
// 我想算 sum = A[0] + A[1] + ... + A[N-1]
// 朴素想法:每个线程把自己负责的元素加到一个全局变量上
__global__ void sum_naive(const float* A, float* result, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        *result += A[i];     // ← 这一行
    }
```

CPU 端调用:

```c
float h_result = 0.0f;
float* d_result;
cudaMalloc(&d_result, sizeof(float));
cudaMemcpy(d_result, &h_result, sizeof(float), cudaMemcpyHostToDevice);

sum_naive<<<grid, block>>>(d_A, d_result, N);

cudaMemcpy(&h_result, d_result, sizeof(float), cudaMemcpyDeviceToHost);
printf("sum = %f\n", h_result);
```

**先别往下读**。我来问你:

> 假设 N = 1024,A 全是 1.0,**期望**结果是 1024。你觉得实际跑出来是多少?会等于 1024 吗?如果不等,大概会是什么数量级?

…………

实际跑出来,你大概率会得到一个**远小于 1024、且每次运行都不一样**的数。可能是 47.0,可能是 89.0,可能是 132.0……

**这个 bug 叫什么?为什么会发生?**——回想一下你学过的多线程编程或操作系统课。

…………

**Race condition(竞态条件)**。`*result += A[i]` 这一行不是原子的,它实际是三步:

1. 读 `*result` 到寄存器
2. 加上 `A[i]`
3. 写回 `*result`

线程 0 读到 0,准备写 1。线程 1 也同时读到 0(因为线程 0 还没写完),也准备写 1。两个人都写 1,**结果丢了一次加法**。GPU 上一次有几千个线程同时这样干,**绝大多数加法都丢了**。

> 这是初学者第一次碰到 GPU 并发的"反 race"考验。CPU 多线程里你可能用过 `std::mutex`、`std::atomic`,但 GPU 上**几千个线程**同时争抢一个内存位置,加锁是不现实的。CUDA 的解决方案是**硬件原子操作**。

### 二、原子操作:`atomicAdd`

CUDA 提供了一组 `atomic*` 函数,把"读-改-写"打包成不可分割的操作。最常用的是 `atomicAdd`:

```c
__global__ void sum_atomic(const float* A, float* result, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        atomicAdd(result, A[i]);     // 硬件保证原子
    }
```

跑出来,得到 1024。**正确**。

但是——**性能怎么样?** 来想一下:

> 几千个线程,每一个都要往同一个 `*result` 加。原子操作硬件是怎么实现的?它能让线程 A 的"读-改-写"和线程 B 的"读-改-写"**同时**进行吗?

…………

**不能**。原子操作的本质是**串行化对同一地址的访问**。硬件会把所有冲突的请求排队,一个一个处理。N 个线程要往同一处加,实际就被退化成了 **N 步串行**。

实测下来,`sum_atomic` 比 `sum_naive` 慢得不明显(因为 naive 在错误地"快"),但比一个写得好的归约 kernel **慢几十倍**。原子操作正确,但**对热点位置的高争用是性能杀手**。

> 这是个**重要的 mental model**:`atomicAdd` 不是"魔法的并发加法",它是"硬件帮你串行化的加法"。**用得越集中越慢**。

### 三、什么时候 atomicAdd 是好选择?

不是说原子操作没用。它的杀手锏在**写入分散的场合**:

**典型例子:直方图(histogram)**。给一张图,统计每个像素值(0~255)出现多少次。

```c
__global__ void histogram(const unsigned char* img, int* hist, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        atomicAdd(&hist[img[i]], 1);   // 加到 hist[0..255] 中的某一格
    }
```

这里有 256 个不同的目标位置,几千个线程的写入分散到 256 处,**平均每处只有几十个线程争抢**,争用大大降低,原子操作的开销可以接受。

但如果你的图像几乎全是同一个颜色(比如全是 0),所有线程都往 `hist[0]` 加——**热点退化**,性能跌回串行级。这种 case 工业代码会做"先在 shared memory 里建局部直方图,再合并"——稍后讲归约时你会看到同样的思想。

### 四、那求和应该怎么写?——归约(Reduction)

求和、求最大、求最小这一类"把一堆数变成一个数"的操作,CUDA 里叫 **reduction**。它是 CUDA 教材的"经典案例",因为它**没有数据并行的天然结构**(输出只有一个),需要你**自己设计**并行模式。

#### 核心思想:树状归约

考虑 8 个数求和。串行做要 7 步。但你可以这样:

```
轮 1:[a0+a1, a2+a3, a4+a5, a6+a7]    4 个加法,可并行
轮 2:[(a0+a1)+(a2+a3), (a4+a5)+(a6+a7)]    2 个加法,可并行
轮 3:[((a0+a1)+(a2+a3))+((a4+a5)+(a6+a7))]    1 个加法
```

总步数:log₂(8) = 3。**N 个数求和的并行步数从 N 降到 log N**。这就是 GPU 上典型的"并行换深度"。

#### Block 内的 shared memory 归约

我们让一个 Block 内 256 个线程合作,把 256 个数归约成 1 个。这个模式你在第六节末的 matvec 题里已经见过提示。完整代码:

```c
__global__ void block_reduce_sum(const float* A, float* partial, int N) {
    __shared__ float sdata[256];

    int tid = threadIdx.x;
    int i = blockIdx.x * blockDim.x + tid;

    // 步骤 1:每个线程把自己的元素载入 shared memory(越界填 0)
    sdata[tid] = (i < N) ? A[i] : 0.0f;
    __syncthreads();

    // 步骤 2:树状归约,每轮活跃线程数减半
    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) {
            sdata[tid] += sdata[tid + stride];
        }
        __syncthreads();
    }

    // 步骤 3:线程 0 把这个 Block 的归约结果写到 partial[blockIdx.x]
    if (tid == 0) {
        partial[blockIdx.x] = sdata[0];
    }
```

**这段代码值得你逐行盯一下**。你看,每一轮 stride 减半,前半段的线程把后半段加过来。轮次 = log₂(256) = 8 步,每步之间一个 `__syncthreads()`。

**几个你应该自己确认的点**:

1. **`stride > 0` 这个条件什么时候终止?**——当 stride = 1 时,线程 0 把 sdata[1] 加到 sdata[0],然后 stride 变成 0,循环结束。这时 sdata[0] 就是整个 Block 的和。
2. **`__syncthreads()` 为什么放在 if 外面?**——回想第 5 节铁律:**`__syncthreads` 不能放在分支里**(否则部分线程到不了,死锁)。这里 if 里的代码不调用 sync,sync 在 if 后面所有线程都会执行的位置。✓
3. **每轮活跃线程减半,但所有 256 线程都在跑**。不活跃的线程在 if 里被禁用,但仍要参与 `__syncthreads`(否则同步会死)。**所以"活跃线程数减半"意味着算力浪费,但同步的代价不变**——这个 kernel 还有进一步优化的空间(展开最后几轮、用 warp shuffle 替代 sync 等),但入门到这里够了。

#### 整个数组怎么归约?

`block_reduce_sum` 把每个 Block 的 256 个数归约成 1 个,写到 `partial[blockIdx.x]`。如果原数组有 100 万个元素,你启动了 ~4000 个 Block,得到一个长度 4000 的 `partial` 数组。

然后呢?**两个常见做法**:

**做法 A:再启动一次 kernel 归约 partial**(可能多级,直到剩 1 个)。Pure GPU,但要写循环。

**做法 B:把 partial 拷回 CPU,CPU 上做最后一步加和**。混合,但 CPU 加 4000 个数也就一瞬间,简单。

工业代码通常用做法 A 或者用 cuBLAS / Thrust / CUB 这些库现成的 reduce 实现(它们高度优化,你别自己造轮子)。入门理解到上面这个 block_reduce_sum 的写法就够了。

### 五、原子 + 归约:折中方案

回到原子操作。其实有一个**很常用的混合写法**:

```c
__global__ void reduce_atomic_final(const float* A, float* result, int N) {
    __shared__ float sdata[256];
    int tid = threadIdx.x;
    int i = blockIdx.x * blockDim.x + tid;

    sdata[tid] = (i < N) ? A[i] : 0.0f;
    __syncthreads();

    // Block 内树状归约
    for (int stride = blockDim.x / 2; stride > 0; stride >>= 1) {
        if (tid < stride) sdata[tid] += sdata[tid + stride];
        __syncthreads();
    }

    // 线程 0 用 atomicAdd 把本 Block 的和加到全局结果
    if (tid == 0) {
        atomicAdd(result, sdata[0]);
    }
```

**这个写法的逻辑**:Block 内做高效的树状归约(几乎没有原子开销),只在最后让每个 Block 的线程 0 用 atomicAdd 合并到全局。

**争用从"几千个线程抢一个地址"降到了"几千个 Block 各抢一次"**,争用低 256 倍。这个版本性能很接近纯归约版,代码却简单一些(不用两级 kernel),是工程里的常见折中。

> **这个思想——"局部用快机制,跨局部才用昂贵的同步"——在 CUDA 里反复出现**。直方图也可以这么写:每个 Block 在 shared memory 里维护局部直方图,最后用 atomicAdd 合并。

### 六、原子操作的"小字"

几个写代码时会撞到的细节:

1. **`atomicAdd` 对 float 的支持需要计算能力 ≥ 2.x,对 double 需要 ≥ 6.0**。现在的卡都满足,但跑老卡时要查一下。
2. **`atomicCAS`(compare-and-swap)是万能基础**。CUDA 没提供 `atomicMin` for float?可以用 `atomicCAS` 在循环里手写一个。这个技巧深度学习框架里很常见。
3. **Shared memory 上也有原子操作**——`atomicAdd(&sdata[k], 1)`。比 global atomic 快一个数量级。直方图优化的关键就在这里:先在 shared 里 atomic,再合并到 global。
4. **原子操作在不同 Block 间没有内存顺序保证**——它保证"读改写"原子,但不保证"原子操作之前的其他写也对其他 Block 可见"。需要更强的可见性时要用 `__threadfence()`,这是一个进阶话题,入门不必管。

### 七、本节小结

|模式|写法|何时用|
|---|---|---|
|直接 `+=`|`*result += x`|**永远不要**,race condition|
|全局 atomic|`atomicAdd(result, x)`|写入分散(直方图、稀疏更新)|
|纯归约|shared memory 树状归约|求和/最值,极致性能|
|归约 + atomic|Block 内归约,Block 间 atomic|工程实用,代码量适中|

**核心心智模型**:

- GPU 没有便宜的"全局共享变量"。任何"多线程写同一处"都意味着串行化或额外同步。
- 把工作**分层**:先在 warp / Block 这种"近场"用快速机制(shared、warp shuffle、shared atomic),再在 Block 之间用慢但少的同步(global atomic 或 kernel 重启)。

### 八、给你两道题

第一道写代码,第二道想清楚。**你说会跑代码,所以这次第一道我就期待你真的跑了**。

**1. 动手题(强烈建议跑)**

实现"求数组最大值"。

```c
__global__ void block_reduce_max(const float* A, float* partial, int N) {
    // 你来填
}
```

**关键问题**:

- (a) `sdata[tid] = (i < N) ? A[i] : ???`,越界时填什么?(提示:它不能影响最大值的计算。)
- (b) 树状归约的核心一步从 `sdata[tid] += sdata[tid + stride]` 变成什么?
- (c) 如果你想用"归约 + atomic"的混合写法,需要 `atomicMax` for float。CUDA 直接提供了吗?如果没有怎么办?(提示:CUDA 提供 `atomicMax` 对 int,但 float 需要用 atomicCAS 自己写,或者用一个**位级技巧**——float 的 IEEE 754 编码,正数比较大小和它的 int 重解释比较大小是一致的,所以可以转 int 比较。这是个真实工程里的技巧,你可以查一下 `__float_as_int`。)

**2. 思考题**

下面这段是 (a) 一个 block_reduce 直接的 bug 版本:

```c
for (int stride = 1; stride < blockDim.x; stride *= 2) {
    if (tid % (2 * stride) == 0) {
        sdata[tid] += sdata[tid + stride];
    }
    __syncthreads();
}
```

它**算出来结果是对的**,但和我前面给的"stride 从大到小、`tid < stride`"版本相比,**性能差很多**。为什么?

(提示:回到第五节,想 warp divergence 和合并访问。在循环的早期几轮,**哪些线程在干活**?它们在 warp 内的分布是怎样的?)

…………

这个问题的答案是 CUDA 优化里非常经典的故事——"reverse loop"vs"forward loop",NVIDIA 的归约优化教程里专门讲过。如果你能想出来,此前已经摸到了 CUDA 性能调优的门。

把你两道题的答案发给我(代码 + 思考),我们对完之后,**下一节我们讲一个比较综合的话题:实战中的性能分析与调优**——用 Nsight Compute 看你的 kernel 到底卡在哪、怎么读那些指标、怎么定位"应该优化什么"。这是把前面所有概念**串起来用**的一节,也是一个真实 CUDA 程序员的日常。

## 一个诚实的提醒

后面的内容(性能分析、Nsight、调优)有个特点:**它们是"诊断 + 修方案"的学问,前提是你手上有一个真实在跑的、可以测量的 kernel**。我可以继续讲概念——讲 Nsight Compute 怎么看 occupancy、怎么读 memory throughput、warp stall 是什么意思——但如果你没有任何自己写的 kernel 在机器上跑过,这些指标对你就只是名词。你能记住,但用不出来。

这和前七节不太一样。前七节的概念(线程层次、内存层次、warp、归约)即使纯读也能建立心智模型。**性能调优不行,它必须经过"我跑了 → 慢 → 我看指标 → 我猜原因 → 我改 → 再跑"的反馈环**。

### 我观察到的可能情况

我猜你可能在以下三种状态之一:

**(a) 你在课间/通勤/睡前快速浏览,没法跑代码**。这完全合理,但那我们换一种讲法更值得——别讲调优(它需要实操),改讲一些**更适合"读"的进阶主题**。

**(b) 你打算之后集中找时间动手,现在先把概念过一遍**。OK,那我可以继续讲,但我会**减少代码细节**,多讲"思想脉络",等你之后回来动手时这些会变成"哦原来如此"。

**(c) 你其实有些题卡住了,但不想暴露**。

### 给你的选择

在你回复之前,我不会假设默认走某一条——因为不同选择对应的内容差异很大,我不想猜错了浪费你时间。

- **第一层(脑子层)**:CUDA 性能问题的几种"病",每种病的症状、原因、治法。这部分纯读就能建立诊断框架。
- **第二层(工具层)**:Nsight Compute 大概长什么样、什么指标对应什么病。这部分我会给你**截图式描述**,等你以后跑时能对得上。
