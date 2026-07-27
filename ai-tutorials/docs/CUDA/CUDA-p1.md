## CUDA 编程入门:第一节 —— 为什么需要 GPU 编程?

在写第一行 CUDA 代码之前,我想先和你一起把"为什么"想清楚。这一节没有代码,只有概念,但它会决定你后面学得是否扎实。

### 一、先从一个问题开始

假设我有两个长度为 1 亿的浮点数组 `A` 和 `B`,我想计算 `C[i] = A[i] + B[i]`。

如果用 CPU(比如你电脑里的 Intel/AMD 处理器),你大概会写:

```c
for (int i = 0; i < N; i++) {
    C[i] = A[i] + B[i];
}
```

**先停下来思考一下**:这个循环的本质是什么?这 1 亿次加法之间,有任何依赖关系吗?第 5 个加法需要等第 4 个加法的结果吗?

——显然不需要。每个 `C[i]` 的计算是**完全独立**的。

这就引出 CUDA 存在的根本理由:**当一个问题可以被拆成大量彼此独立的小任务时,我们没必要让一颗 CPU 核心一个一个串行地做,而应该让成千上万个简单的核心同时做。**

### 二、CPU 和 GPU 的设计哲学差异

这是入门最关键的一张"心智图":

| |CPU|GPU|
|---|---|---|
|核心数量|几个~几十个|几千~上万个|
|单核性能|极强(乱序执行、分支预测、大缓存)|较弱(简单、精简)|
|设计目标|低延迟:让**一个**任务尽快完成|高吞吐:让**一大堆**任务总时间最短|
|适合场景|复杂逻辑、串行任务、分支多|数据并行、计算密集、规整|

一个常用的比喻:CPU 是几个博士生,每个都能独立解决复杂问题;GPU 是一万个小学生,每人只会做加减乘除,但同时做。让一万个小学生去证明黎曼猜想是不行的,但让他们同时算一万道加法题,博士生绝对赢不了。

**问你一个问题**:基于这个比喻,以下任务你觉得分别适合 CPU 还是 GPU?

1. 编译一个 C++ 项目
2. 训练一个神经网络
3. 操作系统调度
4. 给一张 4K 图片每个像素加亮度
5. 解析一个复杂的 JSON 配置文件

(你可以心里答一下,大致的判断标准就是:**任务能不能拆成大量同质、独立的小工作**。)

### 三、CUDA 是什么?

CUDA 是 NVIDIA 推出的一套让你**用 C/C++ 写程序、然后把其中一部分扔到 GPU 上跑**的编程模型和工具链。它包括:

- **语言扩展**:在 C++ 基础上加了几个关键字(比如 `__global__`、`__device__`)和语法(`<<<...>>>` 启动核函数)
- **运行时 API**:`cudaMalloc`、`cudaMemcpy` 这类函数,让你管理 GPU 内存和数据传输
- **编译器 nvcc**:把你写的混合代码拆成 CPU 部分(交给普通 C++ 编译器)和 GPU 部分(编译成 GPU 指令)

写 CUDA 程序时你要时刻记住一个事实:**CPU 和 GPU 是两台独立的"计算机",有各自独立的内存**。CPU 不能直接读 GPU 的显存,GPU 也不能直接读主机内存(早期严格如此,新架构有统一内存机制,但本质模型不变)。所以一个典型的 CUDA 程序流程是:

1. 在 CPU(称为 **host**)上准备数据
2. 把数据从主机内存**拷贝**到 GPU 显存(称为 **device**)
3. 让 GPU **启动大量线程**并行计算
4. 把结果从 GPU 显存拷回主机内存
5. CPU 后续处理或输出

这个"主机—设备"模型贯穿你之后写的每一个 CUDA 程序。

### 四、本节小结与给你的思考题

**核心要点**:

- GPU 不是"更快的 CPU",而是"为大规模数据并行设计的另一种处理器"
- CUDA 是异构编程:CPU 负责调度和复杂逻辑,GPU 负责吞吐量计算
- Host 和 Device 内存是分离的,数据需要显式传输

**思考题**(下一节开始前你心里有答案就行):

1. 如果一个任务每一步都依赖上一步的结果(比如递推数列 `a[i] = f(a[i-1])`),它适合放到 GPU 上做吗?为什么?
2. 你觉得"启动一万个线程同时算"这件事本身有没有开销?如果数组只有 100 个元素,你还会用 GPU 吗?

---

下一节我会讲 **CUDA 的线程组织模型(Grid / Block / Thread)** —— 这是你写第一个核函数前必须理解的概念,也是大多数人最初容易绕晕的地方。

## CUDA 编程入门:第二节 —— 线程组织模型

上一节最后两个思考题,我希望你心里已经有答案了。如果还没,先停一下,认真想想——尤其是第二个问题,它直接关系到这一节末尾你要面对的一个反直觉现象。

这一节我们要把 CUDA 最核心的抽象搞清楚:**当你说"GPU 启动一万个线程"时,这一万个线程到底是怎么组织的?**

### 一、从一个朴素的问题开始

回到上一节的数组加法。假设我现在给你 GPU,告诉你"你可以同时启动很多线程",你会怎么设计?

最朴素的想法是:**让第 i 个线程负责计算 C[i]**。

```
线程 0  →  C[0] = A[0] + B[0]
线程 1  →  C[1] = A[1] + B[1]
线程 2  →  C[2] = A[2] + B[2]
...
线程 N-1 → C[N-1] = A[N-1] + B[N-1]
```

听起来很合理对吧?但这里有个关键问题需要你想一想:

> **如果 N = 1 亿,你真的要启动 1 亿个"平铺"的线程吗?GPU 硬件怎么管理这 1 亿个线程?它们之间需要任何协作吗?**

如果你启动 1 亿个完全平等、互不相关的线程,硬件调度会非常痛苦。而且实际计算中,**邻近的线程往往需要协作**(比如它们要读相邻的内存、共享一些中间结果)。所以 NVIDIA 的设计者做了一个非常聪明的决定:**把线程分层组织**。

### 二、三层结构:Thread / Block / Grid

CUDA 的线程组织是这样的:

```
Grid(网格)
├── Block 0(线程块)
│   ├── Thread 0
│   ├── Thread 1
│   ├── ...
│   └── Thread 255
├── Block 1
│   ├── Thread 0
│   ├── Thread 1
│   ├── ...
│   └── Thread 255
├── Block 2
│   ...
└── Block N
```

- **Thread(线程)**:最小执行单位,真正干活的那个
- **Block(线程块)**:一组线程的集合,通常 128~1024 个线程一组
- **Grid(网格)**:一次核函数启动产生的所有 Block 的集合

举个例子:如果你要处理 1 亿个元素,你可能这样安排:

- 每个 Block 装 256 个线程
- 总共需要 `1亿 / 256 ≈ 390625` 个 Block
- 这 390625 个 Block 组成一个 Grid

**为什么要分两层(Block + Grid)而不是一层平铺?** 这是个好问题,我先给你三个关键答案,你不用全部消化,但要记住:

1. **同一个 Block 内的线程可以协作**:它们能共享一块快速内存(shared memory),还能互相同步。Block 之间则不能。
2. **Block 是硬件调度的基本单位**:GPU 把 Block 分配给它的"流式多处理器(SM)"去执行,Block 内部线程一起被处理。
3. **可扩展性**:小 GPU 一次跑几个 Block,大 GPU 一次跑几十个 Block,代码不用改。Grid 的总数无论多少都能跑。

### 三、线程怎么知道"自己是谁"?

这是写核函数时你**每一行都要用到**的概念。每个线程在运行时,可以通过几个**内置变量**知道自己的身份:

|变量|含义|
|---|---|
|`threadIdx.x`|我在自己 Block 里的编号|
|`blockIdx.x`|我所在的 Block 在 Grid 里的编号|
|`blockDim.x`|我所在的 Block 有多少个线程|
|`gridDim.x`|Grid 里有多少个 Block|

(`.x` 是因为 Block 和 Grid 都可以是 1D / 2D / 3D 的,我们先只看 1D。)

那么,**全局编号**怎么算?来,你来推一下:

> 假设 `blockDim.x = 256`,我是 `blockIdx.x = 3`、`threadIdx.x = 17` 的线程,我在所有线程中是第几个?

…………

答案是:`3 * 256 + 17 = 785`。所以通用公式是:

```c
int i = blockIdx.x * blockDim.x + threadIdx.x;
```

**这一行你这辈子在 CUDA 代码里会写几千次。** 它就是每个线程"找到自己该处理哪个数据"的钥匙。

### 四、用一张图把它装进脑子里

想象一栋酒店:

- **Grid** = 整栋酒店
- **Block** = 一层楼(每层有相同数量的房间)
- **Thread** = 房间
- `blockIdx.x` = 你在第几层
- `threadIdx.x` = 你在这一层的第几号房间
- `blockDim.x` = 每层有多少房间
- 全局房间号 = 楼层号 × 每层房间数 + 房间号

如果有人问"全酒店第 785 号客人住哪",你立刻就知道是 3 楼 17 号房。CUDA 线程也是这样定位自己的。

### 五、一个反直觉的事实

现在回到上一节我让你思考的"如果数组只有 100 个元素,你还会用 GPU 吗?"——

答案是**通常不会**。原因之一就藏在线程组织模型里:**启动一个核函数本身有开销**(把参数传给 GPU、调度 Block、初始化线程),典型在几微秒到几十微秒。如果你的计算量本身只要 1 微秒,那你 99% 的时间都花在"启动"上,完全得不偿失。

**GPU 加速的前提是问题足够大,大到能"摊薄"启动开销和数据传输开销。** 这是初学者最常踩的坑——以为用了 CUDA 就一定快,结果发现比 CPU 还慢。

### 六、检验一下你的理解

在进入下一节(写第一个核函数)之前,我想确认你真的吃透了这一节。请你试着回答(口头答即可,不用打字):

1. 如果我启动了 `<<<10, 256>>>`(意思是 10 个 Block、每个 Block 256 个线程),总共有多少个线程?其中 `blockIdx.x = 5, threadIdx.x = 100` 这个线程,它的全局编号是多少?
2. 如果我要处理一个长度 N = 1000 的数组,每个 Block 用 256 个线程,我应该启动多少个 Block?会不会有"多出来"的线程?这些多出来的线程怎么办?(这个问题特别重要,下一节写代码会直接用到。)
3. 用你自己的话解释:为什么 CUDA 不让你直接启动一个"平的"线程数组,而要分成 Block 和 Grid 两层?

---

把第 2 题想清楚特别关键——它会直接出现在下一节的代码里,我会让你先自己写一版,我们再对照。

## 第三节 —— 你的第一个核函数

上一节我留了三道题。这一节我**不打算直接给你答案**,而是让你边看边自己验证。如果哪一题你心里还没底,等下读到对应位置请停下来想清楚再往下走。

### 一、先看一段完整的代码

我们来实现上一节就在讨论的向量加法 `C = A + B`。先把全貌放在你面前,你大概看一眼,**不用每一行都懂**,我们后面拆解:

```c
#include <stdio.h>
#include <cuda_runtime.h>

// ① 核函数:这是 GPU 上跑的代码
__global__ void vectorAdd(const float* A, const float* B, float* C, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        C[i] = A[i] + B[i];
    }

int main() {
    int N = 1 << 20;              // 2^20 = 约 100 万个元素
    size_t size = N * sizeof(float);

    // ② 在 host(CPU)端分配内存并初始化
    float *h_A = (float*)malloc(size);
    float *h_B = (float*)malloc(size);
    float *h_C = (float*)malloc(size);
    for (int i = 0; i < N; i++) {
        h_A[i] = 1.0f;
        h_B[i] = 2.0f;
    }

    // ③ 在 device(GPU)端分配内存
    float *d_A, *d_B, *d_C;
    cudaMalloc(&d_A, size);
    cudaMalloc(&d_B, size);
    cudaMalloc(&d_C, size);

    // ④ 把数据从 host 拷贝到 device
    cudaMemcpy(d_A, h_A, size, cudaMemcpyHostToDevice);
    cudaMemcpy(d_B, h_B, size, cudaMemcpyHostToDevice);

    // ⑤ 启动核函数
    int threadsPerBlock = 256;
    int blocksPerGrid = (N + threadsPerBlock - 1) / threadsPerBlock;
    vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, N);

    // ⑥ 把结果从 device 拷贝回 host
    cudaMemcpy(h_C, d_C, size, cudaMemcpyDeviceToHost);

    // ⑦ 验证结果
    for (int i = 0; i < 5; i++) printf("%.1f ", h_C[i]);
    printf("\n");

    // ⑧ 释放内存
    cudaFree(d_A); cudaFree(d_B); cudaFree(d_C);
    free(h_A); free(h_B); free(h_C);
    return 0;
}
```

我们一段一段拆。

### 二、核函数:`__global__` 是什么意思?

```c
__global__ void vectorAdd(const float* A, const float* B, float* C, int N) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        C[i] = A[i] + B[i];
    }
```

`__global__` 是 CUDA 加的关键字,意思是"**这个函数从 CPU 调用,但在 GPU 上执行**"。这种函数有个专门的名字:**核函数(kernel)**。它有几个硬性规定:

- 返回值必须是 `void`(它不能 return 任何东西给 CPU,结果通过指针写回显存)
- 它会被**同时**很多个线程执行——**注意,你写的是单个线程的代码,但实际上有几十万个线程在同时跑这同一段代码**

这是 CUDA 编程心智模型最关键的一跳。你写:

```c
C[i] = A[i] + B[i];
```

但每个线程的 `i` 不一样!上一节那行公式 `i = blockIdx.x * blockDim.x + threadIdx.x` 就是这里在用。线程 0 看到的 `i` 是 0,线程 1 看到的 `i` 是 1……每个线程把自己负责的那一格算掉。这就是 SIMT(Single Instruction, Multiple Threads)。

**那个 `if (i < N)` 是干嘛的?**——回到上一节我让你思考的第 2 题:N=1000、每 Block 256 线程,你需要多少 Block?

`ceil(1000/256) = 4` 个 Block,总共 `4 × 256 = 1024` 个线程。也就是说会**多出来 24 个线程**,它们的 `i` 会是 1000~1023,**越界了**。如果不加这个 if,这 24 个线程就会去读写 `A[1000]`、`B[1000]`、`C[1000]`……这些不属于你的内存,行为未定义,典型的灾难场景。

所以 `if (i < N)` 这一句叫**边界检查**,几乎每个 CUDA 核函数都会有它。把这个习惯刻进肌肉记忆。

### 三、Host 内存和 Device 内存:`h_` 与 `d_`

```c
float *h_A = (float*)malloc(size);   // host 端
float *d_A; cudaMalloc(&d_A, size);  // device 端
```

CUDA 程序员有个约定俗成的命名习惯:**`h_` 前缀表示 host(CPU)指针,`d_` 前缀表示 device(GPU)指针**。这不是语法要求,是写给人看的——因为编译器不会拦你,**你完全可以"不小心"把 device 指针当 host 指针用,程序就会崩溃**。

来,我考你一个理解题(认真想):

> 如果我写 `printf("%.1f", d_A[0]);`,会发生什么?

…………

崩溃,或者打印垃圾值。因为 `d_A` 指向的是显存地址,CPU 直接解引用它等于读了一块根本不属于自己的内存。**Host 不能直接访问 device 内存,反之亦然**——这是上一节就强调过的"两台计算机"模型在代码里的体现。

`cudaMalloc` 和 `malloc` 形式上很像,但有个小区别你看出来了吗?

```c
float* h_A = (float*)malloc(size);    // 返回值是分配的指针
cudaMalloc(&d_A, size);               // 通过参数传出指针,返回值是错误码
```

`cudaMalloc` 第一个参数要传**指针的指针**(`&d_A`),它通过这个参数把分配到的显存地址写出来。返回值留给了错误码。CUDA 几乎所有运行时 API 都是这个风格。

### 四、数据传输:`cudaMemcpy`

```c
cudaMemcpy(d_A, h_A, size, cudaMemcpyHostToDevice);
```

参数顺序:**目的地、源、字节数、方向**。和标准 C 的 `memcpy` 顺序一样(dst, src),容易记。最后一个参数告诉运行时这次拷贝的方向:

- `cudaMemcpyHostToDevice` —— CPU → GPU
- `cudaMemcpyDeviceToHost` —— GPU → CPU
- `cudaMemcpyDeviceToDevice` —— GPU 内部
- `cudaMemcpyHostToHost` —— 很少用

**这里有个性能上的关键事实你要记住**:host 和 device 之间的数据传输走 PCIe 总线,**很慢**(典型 ~16 GB/s),而 GPU 内部显存带宽可以到 ~1 TB/s。所以 CUDA 程序的一条铁律是:**数据一旦上了 GPU,尽量在 GPU 上多算几步再拷回来**。频繁来回拷贝是初学者另一个常见的性能陷阱。

### 五、启动核函数:`<<<...>>>` 是什么?

```c
vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, N);
```

`<<<...>>>` 是 CUDA 在 C++ 上加的语法(标准 C++ 里没有),叫**执行配置**。两个参数:

- 第一个:Grid 里有多少个 Block
- 第二个:每个 Block 里有多少个线程

那么——

```c
int blocksPerGrid = (N + threadsPerBlock - 1) / threadsPerBlock;
```

这一行的意思是什么?为什么不直接写 `N / threadsPerBlock`?

…………

这是**向上取整**的整数算法。`N / 256` 是向下取整,如果 N=1000、threadsPerBlock=256,直接除得 3,只能覆盖 768 个元素,剩下 232 个无人处理。`(N + 255) / 256` 得 4,正好覆盖。代价就是上一节说的"多出来 24 个线程",所以核函数里要有 `if (i < N)`。

> 这两个东西必须配套出现:**向上取整算 Block 数 + 边界检查**。

### 六、一个被故意省略的细节:错误检查

上面所有 `cudaMalloc` 和 `cudaMemcpy` 都返回 `cudaError_t`,我故意没检查,因为入门时先把主线弄清楚。**但实际工程里你必须检查**,典型的写法是包一个宏:

```c
#define CUDA_CHECK(call) do {                                      \
    cudaError_t err = call;                                        \
    if (err != cudaSuccess) {                                      \
        fprintf(stderr, "CUDA error at %s:%d: %s\n",               \
                __FILE__, __LINE__, cudaGetErrorString(err));      \
        exit(1);                                                   \
    }                                                              \
} while(0)

CUDA_CHECK(cudaMalloc(&d_A, size));
```

还有一件事**特别坑**:核函数启动 `<<<...>>>` 不返回错误码——它是**异步**的,CPU 调完立刻往下走,GPU 在后台跑。如果核函数里炸了,你这里看不到。要捕获它,通常这样:

```c
vectorAdd<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, N);
CUDA_CHECK(cudaGetLastError());      // 检查启动配置错误
CUDA_CHECK(cudaDeviceSynchronize()); // 等 GPU 跑完,捕获运行时错误
```

`cudaDeviceSynchronize()` 这个函数你后面会经常见——它让 CPU **阻塞等待 GPU 把活干完**。我们下一节讲"异步"时会专门说。

### 七、编译和运行

CUDA 文件后缀是 `.cu`,用 `nvcc` 编译:

```bash
nvcc vector_add.cu -o vector_add
./vector_add
```

应该输出 `3.0 3.0 3.0 3.0 3.0`(因为 1.0 + 2.0 = 3.0)。

> **如果你手边有装 CUDA 的机器(实验室或自己电脑有 NVIDIA 卡),强烈建议你现在就把这段代码跑一遍**。看着它真的输出对了,比读十遍解释都管用。如果暂时没机器,Google Colab 免费提供 GPU,选 Runtime → GPU,把代码用 `%%writefile vector_add.cu` 写到文件再 `!nvcc vector_add.cu -o va && ./va` 就行。

### 八、给你留一道动手题

一道题,做了再继续。

> **题目**:把上面的代码改成"向量按元素相乘并加常数",即 `C[i] = A[i] * B[i] + alpha`,其中 `alpha` 是一个 `float`,从 `main` 传进核函数。

练习中**只需**修改核函数签名、核函数体和启动语句，其他部分保持不变。无需实际运行，可以在纸上完成，然后思考以下两个问题：

1. `alpha` 在核函数签名里是什么类型?为什么不需要 `cudaMalloc` 给它分配显存?(提示:它是值还是地址?)
2. 启动语法 `<<<blocksPerGrid, threadsPerBlock>>>` 这一行会变化吗?为什么?

把你的答案(或者你写的核函数代码)发给我,我们对一下。下一节我会带你进 **GPU 内存层次**——这是性能优化的起点,也是你从"能跑"到"跑得快"的分水岭。

### 你应该写出来的版本

核函数签名和体:

```c
__global__ void vectorMulAdd(const float* A, const float* B, float* C, int N, float alpha) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < N) {
        C[i] = A[i] * B[i] + alpha;
    }
```

启动那一行:

```c
vectorMulAdd<<<blocksPerGrid, threadsPerBlock>>>(d_A, d_B, d_C, N, 1.5f);
```

### 两个问题的答案

**问题 1**:`alpha` 是 `float` 类型(传值),不需要 `cudaMalloc`。

这背后的道理值得想透——**核函数的参数传递机制和普通 C++ 函数本质相同,但有一层硬件层面的细节**:启动核函数时,CUDA 运行时会把所有参数打包,通过一个特殊的"常量内存"区域传给 GPU 上的每个线程。**值类型(`int`、`float`)直接被复制过去,每个线程都拿到一份**。所以 `alpha` 不需要分配显存,它就在那儿了。

而 `A`、`B`、`C` 是**指针**——指针本身也是一个值(64 位的地址数字),它本身也被复制到 GPU。但**指针指向的内容**必须事先在显存里,否则 GPU 拿着这个地址去访问会崩。所以 `d_A` 这种指针本身不需要 `cudaMalloc`(它就是个 64 位整数),但它**指向的那块内存**需要 `cudaMalloc`。

这是个很多初学者糊涂的地方,你想清楚了吗?——**指针 ≠ 指针指向的内存**。`cudaMalloc` 分配的是后者。

**问题 2**:启动语法 `<<<blocksPerGrid, threadsPerBlock>>>` 完全不变。

因为执行配置只决定"开多少线程",和核函数的具体参数无关。你加再多参数(只要不爆栈),Grid/Block 配置都不受影响。

---

基础打牢了,我们进入下一节——**这一节会改变你看 CUDA 代码的方式**。
