# 第十二课：H723 系统架构深入——时钟树、Cache、MPU

好，我们系统派。这一课我会尽量讲透底层机制，让你理解"**为什么 H723 是这个样子**"。三个核心主题：

1. **时钟树**（550MHz 是怎么来的，为什么这么复杂）
2. **Cache 系统**（怎么工作，怎么控制，怎么避坑）
3. **MPU 内存保护单元**（怎么配置，怎么解决 DMA 问题）

讲完这三块，你再看 H723 就不再是"神秘黑盒"，而是"复杂但有逻辑"的系统。

开始前我先定一个心智模型——

> **F103 的设计哲学是"够用就好"，H723 的设计哲学是"极致性能"。极致性能意味着每个子系统都要独立优化，于是产生了大量的模块化和配置选项。**

记住这句话，遇到任何"为啥这么复杂"的疑问，都可以回到这个根源。

---

### 第一部分：时钟树的层级设计

#### 先回忆 F103 的时钟树

F103 的时钟结构：

```
HSE (8MHz外部晶振)
    ↓
   PLL (×9)
    ↓
SYSCLK = 72 MHz
    ↓
   ┌────────────┐
AHB HCLK     APB1 PCLK1 (36MHz)   APB2 PCLK2 (72MHz)
(72MHz)
```

一个 PLL、一条时钟树主干、几个分频器。**所有外设共用这套时钟**，配置简单。

#### H723 的时钟树有多复杂

我先给你一个全景，然后拆解：

```
                            ┌─ HSE (外部晶振, 如 25MHz)
时钟源 ────────────────────┤
                            ├─ HSI (内部 64MHz RC)
                            ├─ CSI (内部 4MHz RC，低功耗用)
                            └─ LSE/LSI (低速时钟, RTC用)
                                       │
                                       ↓
                            ┌──────────┴──────────┐
                            │                     │
                      ┌─── PLL1 ───┐         ┌─ PLL2 ─┐      ┌─ PLL3 ─┐
                      │            │         │        │      │         │
                      ↓            ↓         ↓        ↓      ↓         ↓
                   SYSCLK       PLL1Q     PLL2P    PLL2Q   PLL3P    PLL3Q
                   (CPU主频)    (USB/...)  (外设)   (DMA)   (LCD)   (UART)
                     │
                     ↓
                    D1CPRE 预分频
                     │
                     ↓
                   CPU = 550MHz
                     │
                     ↓
                    D1CPRE
                     │
                     ├── HPRE → AHB3 (Cortex 的总线, 给 Flash/AXI SRAM)
                     ├──────→ AHB1/2/4 (外设总线)
                     ↓
                   AXI_CLK (最高 275MHz)
                     │
                     ├── D1PPRE → APB3 (最高 137.5MHz)
                     ├── D2PPRE1 → APB1
                     ├── D2PPRE2 → APB2
                     └── D3PPRE → APB4
```

**为什么要这么多 PLL 和分频器？**

先问你一个问题——

**思考题 1**：假设你需要同时做这些事：

- CPU 跑 550MHz（算法处理）
- USB 需要 **精确** 48MHz（规范要求，不能偏差）
- 某个 UART 需要 100MHz（高波特率）
- SDRAM 需要 200MHz
- 一个定时器需要 10MHz 精确分频

如果只有**一个** PLL，能满足所有要求吗？为什么 H723 要三个 PLL？

...

**答案**：一个 PLL 只能产生**一组**频率（通过几个固定分频比输出多个频率）。USB 要 48MHz 时，分频比可能是 550/48 = 11.458...，**根本不是整数**，分频后的频率就偏了。USB 不能偏差——主机会识别失败。

所以 H723 的设计是：

- **PLL1** → 主要给 CPU 和 AXI，追求最高频率
- **PLL2** → 给外设组（QSPI、SDMMC、以太网、DMA等），各自有精确要求
- **PLL3** → 给音频/显示/串口等需要特殊精确频率的

**每个 PLL 独立配置**，各自优化自己的输出频率。这就是"**分布式时钟**"的思想。

#### H723 的电源域

这是一个 F103 完全没有的概念。H723 把内部分成几个**电源域（Power Domain）**：

```
┌────────────────────────────────────────────────┐
│                                                │
│  D1 域（主域）                                 │
│  - Cortex-M7 内核                              │
│  - ITCM / DTCM                                 │
│  - AXI SRAM                                    │
│  - Flash                                       │
│  - 高速外设（SDMMC1、QSPI）                    │
│                                                │
├────────────────────────────────────────────────┤
│  D2 域（外设域）                               │
│  - 大部分通信外设（UART、I2C、SPI、FDCAN等）   │
│  - SRAM1/2/3                                   │
│  - 普通 DMA                                    │
│                                                │
├────────────────────────────────────────────────┤
│  D3 域（低功耗域）                             │
│  - BDMA（Basic DMA）                           │
│  - LPUART                                      │
│  - LPTIM                                       │
│  - SRAM4                                       │
│  - 低功耗 I2C                                  │
│                                                │
└────────────────────────────────────────────────┘
```

**为什么分域？** 因为每个域可以**独立开关电源**。

- 休眠时关掉 D1 域（CPU 不工作），只保留 D3 域（用 BDMA 采数据、LPUART 收命令）
- 唤醒时再开 D1 域

这在物联网/电池供电应用里至关重要，能把功耗从毫安级降到微安级。

#### 这对你写代码的实际影响

**影响 1：外设放在哪个域，决定了怎么用**

- 用 UART4 → 在 D2 域，需要开启 D2 域时钟
- 用 LPUART1 → 在 D3 域，休眠时可用
- 如果你的 DMA 要操作 LPUART，必须用 **BDMA**（D3 域的 DMA），**普通 DMA 够不着 D3 外设**

**影响 2：不同外设的时钟来源不同**

在 CubeMX 里配 H723 时，你会看到"Clock Configuration"标签页巨大复杂——每个外设都能独立选时钟源。**这是强大也是坑**——选错了外设不工作。

**影响 3：高主频带来的新约束**

H723 跑 550MHz 不是随便开的。它取决于**电压范围（VOS, Voltage Scaling）**：

|VOS 级别|电压|最高频率|
|---|---|---|
|VOS0 (最高性能)|~1.35V|550MHz|
|VOS1|~1.2V|400MHz|
|VOS2|~1.1V|300MHz|
|VOS3|~1.0V|200MHz|

**想跑 550MHz，必须先把 VOS 设到 0**。CubeMX 会提醒你，但你要知道为什么。

还有 **Flash 等待状态（Wait States）**——Flash 跑不到 550MHz，CPU 取指令必须等几个周期。550MHz 主频时 Flash Wait States 是 3 或 4。这就是为什么需要 **ICache**——缓存指令，减少等 Flash 的次数。

#### 停一下，检查你的理解

**思考题 2**：如果你在 H723 工程里把 CPU 主频从 550MHz 降到 200MHz（不改其他），会有什么变化？

- Flash 等待状态可以更少吗？
- Cache 的命中率重要性变化吗？
- 功耗降低多少？

先想想再往下。

...

**答案**：

- Flash 等待状态可以降到 0（200MHz Flash 跟得上），**少等就是快**
- Cache 命中与否的性能差异变小（反正 Flash 也快），Cache 的重要性下降
- 功耗大幅降低（CPU 功耗近似和 V2⋅fV2⋅f 成正比，VOS 也能降）

**这说明**：极致性能的代价是功耗和复杂度。**不是所有项目都需要跑满 550MHz**，应该按需选择。

---

### 第二部分：Cache 系统深入

我们在上一课已经建立了 Cache 的基本概念。这一节讲**细节**——怎么配置、怎么控制、实际项目中的常见模式。

#### Cache 的物理结构

H723 的 L1 Cache：

- **ICache**（指令缓存）：16KB，放 CPU 要执行的指令
- **DCache**（数据缓存）：16KB，放 CPU 要读写的数据

**ICache 几乎无副作用**——因为指令一旦加载就不变，不存在一致性问题。开启它对性能提升巨大（能到 2~3 倍），成本几乎为零。**建议永远开启**。

**DCache 是所有一致性问题的来源**——因为数据是动态变化的，而 Cache 和内存可能不同步。

#### Cache 的粒度

Cache 不是一个字节一个字节缓存的，它按**缓存行（Cache Line）** 操作。Cortex-M7 的 L1 Cache Line 是 **32 字节**。

这意味着：

- CPU 读取一个 `uint8_t` 时，实际上从内存加载了 **32 字节** 到 Cache
- Cache 的 Invalidate/Clean 操作也是以 32 字节为最小单位
- 你的 DMA 缓冲区**必须 32 字节对齐**，否则操作会影响相邻数据

#### 四种 Cache 策略

每块内存的 Cache 行为可以配置成四种之一：

|策略|读|写|用途|
|---|---|---|---|
|**Non-Cacheable**|直接打内存|直接打内存|DMA 缓冲区、外设寄存器|
|**Write-Through**|走 Cache|同时写内存和 Cache|平衡性能和一致性|
|**Write-Back**|走 Cache|只写 Cache，延迟写内存|最高性能，但一致性最难管|
|**Write-Back + Write-Allocate**|走 Cache|写时先加载到 Cache 再写|写密集场景|

H723 默认大部分 RAM 是 **Write-Back + Write-Allocate**（最快），这也是一致性 bug 最多的模式。

#### 最容易理解的一致性场景

我带你手工走一遍两种场景：

**场景 A：CPU 写，DMA 读**（如 UART DMA 发送）

c

```c
char msg[] = "Hello";
HAL_UART_Transmit_DMA(&huart1, (uint8_t*)msg, 5);
```

时间轴：

```
T1: CPU 写 msg 到 Cache (Write-Back，不立刻写 SRAM)
    Cache:  msg = "Hello"
    SRAM:   msg = (旧值/未初始化)

T2: HAL_UART_Transmit_DMA 启动 DMA
    DMA 读 SRAM 里的 msg → 拿到旧值 ← BUG！

T3: 某时刻 Cache 行被替换，写回 SRAM（已经来不及了）
```

**修复**：启动 DMA 前，强制把 Cache 里的 msg 写回 SRAM：

c

```c
char msg[] __attribute__((aligned(32))) = "Hello";   // 32字节对齐！
SCB_CleanDCache_by_Addr((uint32_t*)msg, 8);          // 写回SRAM
HAL_UART_Transmit_DMA(&huart1, (uint8_t*)msg, 5);
```

**场景 B：DMA 写，CPU 读**（如 UART DMA 接收、ADC DMA）

c

```c
uint8_t buffer[128];
HAL_UART_Receive_DMA(&huart1, buffer, 100);
HAL_Delay(1000);
printf("%d\n", buffer[0]);   // 可能读到旧值！
```

时间轴：

```
T1: CPU 启动 DMA

T2: 某时刻，CPU 读了一下 buffer[0]（可能因为 printf 的调试等）
    Cache 把 buffer[0] 附近 32 字节从 SRAM 加载到 Cache
    Cache:  buffer[0] = 0 (初始值)

T3: DMA 收到数据，写到 SRAM
    Cache:  buffer[0] = 0   ← 没更新！
    SRAM:   buffer[0] = 'A' (实际数据)

T4: CPU 读 buffer[0]，从 Cache 拿到 0 ← BUG！
```

**修复**：CPU 读之前，把 Cache 对应区域标记为失效，强制从 SRAM 重新读：

c

```c
uint8_t buffer[128] __attribute__((aligned(32)));
HAL_UART_Receive_DMA(&huart1, buffer, 100);
HAL_Delay(1000);
SCB_InvalidateDCache_by_Addr((uint32_t*)buffer, 128);   // 失效Cache
printf("%d\n", buffer[0]);   // 现在是正确的
```

#### Cache 操作的三个函数

c

```c
/* 失效：让 Cache 认为"这块区域的 Cache 副本过时了"，下次读会从 SRAM 取 */
SCB_InvalidateDCache_by_Addr(uint32_t *addr, int32_t size);

/* 清洗：把 Cache 里修改过的内容强制写回 SRAM */
SCB_CleanDCache_by_Addr(uint32_t *addr, int32_t size);

/* 清洗+失效：一次搞定两个（DMA 读写混合场景用） */
SCB_CleanInvalidateDCache_by_Addr(uint32_t *addr, int32_t size);
```

还有全局版本（整个 Cache 一起操作）：`SCB_CleanDCache()`、`SCB_InvalidateDCache()`——慢但简单，调试时可以用。

#### 实战指导：何时用哪个

|操作|时机|用什么|
|---|---|---|
|CPU 写缓冲区 → 启动 DMA 发送|DMA 启动**前**|`CleanDCache`|
|CPU 启动 DMA 接收 → 读缓冲区|CPU 读**前**|`InvalidateDCache`|
|DMA 收发同时进行（全双工）|每次操作后|`CleanInvalidateDCache`|

**记忆口诀**：

- **C** 开头的 Clean = **C**PU 写完要**C**lean 到内存
- **I** 开头的 Invalidate = **I**n（进来的）DMA 数据要 **I**nvalidate Cache

（这个口诀是我瞎编的，但容易记）

#### 简化之路：MPU 配置"不走 Cache"

每次记得调用 Clean/Invalidate 很烦，还容易漏。**更好的做法**：把 DMA 缓冲区放到一块**配置成 Non-Cacheable 的内存**，这样 CPU 和 DMA 都直接打 SRAM，永远一致。

代价：CPU 访问这块区域慢（没 Cache 加速）。但 DMA 缓冲区本来访问频率就不高，损失不大。

这就引出了第三部分——MPU。

#### 停下来思考

**思考题 3**：下面三种数据，你会怎么放？

- 一个 512 字节的 ADC DMA 循环缓冲区，CPU 偶尔读取计算均值
- 一个 4KB 的图像处理中间数组，CPU 高频读写（每像素 100 次）
- 一个 16 字节的中断标志结构体，多个中断 ISR 读写

选项：

- (A) Cacheable + 手动 Clean/Invalidate
- (B) Non-Cacheable 区域
- (C) 放 DTCM（本来就不 Cache）

（先想再往下）

...

**我的建议**：

- **ADC 缓冲区**：(B) Non-Cacheable。CPU 偶尔读，Cache 好处小，图省心。
- **图像处理数组**：(A) Cacheable + 手动管理。因为 CPU 高频访问，Cache 性能提升巨大，值得处理一致性。**但如果 DMA 不涉及这个数组**，直接放 Cacheable 区就行，根本不用管一致性。
- **中断标志**：(C) DTCM。小、高频访问、只 CPU 访问，DTCM 完美。

**核心原则**：**评估"CPU 访问频率 vs DMA 访问频率"来决定**。

---

### 第三部分：MPU（内存保护单元）

#### MPU 是什么

MPU = Memory Protection Unit，是 Cortex-M7 内核里的一个硬件模块。它的功能是：

> **把地址空间划分成若干区域，每个区域赋予不同的属性：访问权限（读/写/执行）、Cache 策略、可共享性。**

在 H723 上，MPU 的**最主要用途不是"保护"，而是配置 Cache 策略**——告诉 Cache"这块区域不要缓存"。

#### 一个最小的 MPU 配置例子

假设你要把 SRAM1（0x30000000 开始，32KB）配置成 Non-Cacheable：

c

```c
void MPU_Config_DMA_Buffer(void)
{
    MPU_Region_InitTypeDef MPU_InitStruct = {0};
    
    /* 先禁用 MPU */
    HAL_MPU_Disable();
    
    /* 配置一个区域 */
    MPU_InitStruct.Enable = MPU_REGION_ENABLE;
    MPU_InitStruct.Number = MPU_REGION_NUMBER0;        // 区域编号 0
    MPU_InitStruct.BaseAddress = 0x30000000;           // SRAM1 起始
    MPU_InitStruct.Size = MPU_REGION_SIZE_32KB;
    MPU_InitStruct.AccessPermission = MPU_REGION_FULL_ACCESS;
    MPU_InitStruct.IsBufferable = MPU_ACCESS_NOT_BUFFERABLE;
    MPU_InitStruct.IsCacheable = MPU_ACCESS_NOT_CACHEABLE;  // ← 关键！
    MPU_InitStruct.IsShareable = MPU_ACCESS_SHAREABLE;
    MPU_InitStruct.SubRegionDisable = 0x00;
    MPU_InitStruct.TypeExtField = MPU_TEX_LEVEL0;
    
    HAL_MPU_ConfigRegion(&MPU_InitStruct);
    
    /* 启用 MPU */
    HAL_MPU_Enable(MPU_PRIVILEGED_DEFAULT);
}
```

这段代码做了什么？**把 SRAM1 标记为"不要缓存"**。之后只要你把 DMA 缓冲区定义在 SRAM1，Cache 就不会碰它，永远一致。

#### 怎么让变量落到 SRAM1？

用链接脚本的段属性 + GCC 属性：

**方法 1**：在链接脚本 `.ld` 文件里定义一个段

ld

```ld
/* 在 .ld 文件中添加 */
MEMORY
{
  ...
  SRAM1 (xrw) : ORIGIN = 0x30000000, LENGTH = 32K
}

SECTIONS
{
  ...
  .sram1_section (NOLOAD) :
  {
    . = ALIGN(4);
    *(.sram1_section)
    . = ALIGN(4);
  } >SRAM1
}
```

**方法 2**：在 C 代码里用属性声明变量

c

```c
uint8_t dma_buffer[1024] __attribute__((section(".sram1_section"), aligned(32)));
```

这样 `dma_buffer` 就落在 SRAM1（Non-Cacheable 区域），DMA 使用无需任何 Clean/Invalidate。

#### MPU 的其他用途

除了控制 Cache，MPU 还能：

**① 保护代码段只读**：把 Flash 区标记为"禁止写入"，即使 bug 代码往 Flash 地址写也会立刻触发异常，避免灾难。

**② 栈溢出检测**：在每个任务栈底部设置一块"只读"区域，任务栈溢出时写入该区域会触发硬件异常，立刻发现 bug。RTOS 高级调试技巧。

**③ 特权/非特权分离**：配置某些区域"只有特权模式能访问"，实现类似操作系统的用户/内核隔离。

初学阶段你只需要理解"**用 MPU 配置 Non-Cacheable 区域解决 DMA 一致性**"这一个核心用法。其他是进阶内容。

#### 停下来检查

**思考题 4**：综合你学的，请说出 H723 上 DMA 缓冲区的"三种合理放法"，各自的优缺点：

1. ...
2. ...
3. ...

...

**答案**：

1. **放在 AXI SRAM（默认 Cacheable）+ 手动 Clean/Invalidate**
    - 优点：CPU 访问快（走 Cache）
    - 缺点：每次 DMA 操作前后要手动管理 Cache，易漏
2. **放在 SRAM1/2/3，用 MPU 标记为 Non-Cacheable**
    - 优点：无需管理 Cache，简单可靠
    - 缺点：CPU 访问慢（直接打 SRAM）
    - 推荐：通用 DMA 缓冲区首选
3. **放在 SRAM4（D3 域，BDMA 专用）**
    - 优点：低功耗场景（休眠时仍工作）
    - 缺点：只有 BDMA 能用，大多数 DMA 访问不到
    - 推荐：电池应用或 LPUART 配合 BDMA

---

### 第四部分：H723 的新外设速览

前三部分讲完了 H723 的"系统骨架"。现在快速过一下它比 F103 多的**新外设**：

#### 1. FDCAN（CAN FD）

**不是普通 CAN**，是升级版：

||普通 CAN (F103)|FDCAN (H723)|
|---|---|---|
|最高速度|1 Mbps|8 Mbps|
|单帧数据|8 字节|64 字节|
|双比特率|否|可以（仲裁段慢，数据段快）|
|消息缓冲|3 邮箱 + 2 FIFO|专用 Message RAM|

FDCAN 兼容普通 CAN——两者可以混在同一总线（只要其他节点也支持 FDCAN 或者协商降速）。

**对你的意义**：我们之前讲的 CAN 知识 95% 还适用。只是 API 变成 `HAL_FDCAN_*`，配置多了几个选项（比如数据段波特率）。

#### 2. 以太网（Ethernet MAC）

H723 自带 **10/100 Mbps 以太网 MAC**。要配一个外部 PHY 芯片（如 LAN8720）和变压器，就能上网。

这打开了新世界：TCP/IP、MQTT、HTTP、Modbus TCP、EtherCAT... 嵌入式连网的一切。

入门难度较高（需要 LwIP 协议栈），建议在打好基础后再学。

#### 3. QSPI / OCTOSPI

**给外部 Flash 用的高速接口**。普通 SPI 一次传 1 bit，QSPI 一次传 4 bit，速度 ×4。OctoSPI 更是 8 bit，配合时钟翻倍能到 400MHz×8 = 3.2Gbps。

典型用法：外挂一个 QSPI NOR Flash 芯片，**内存映射模式**下，这块外部 Flash 就像 H723 内部 Flash 一样直接当程序/数据用。这让你的代码能"无限扩展"到几百 MB。

#### 4. SDMMC（SD 卡接口）

能直接接 SD 卡（不是 SPI 模式的 SD 卡，是真正的 SDIO 接口，速度快得多）。配合 FatFS 文件系统，你的 MCU 能读写 U 盘/SD 卡上的文件。

#### 5. DMA2D（Chrom-ART 图形加速器）

专门给 LCD 屏幕用的 2D 加速硬件。做 GUI（如 TouchGFX、LVGL）时，这玩意能让界面丝滑无比。

#### 6. 更多定时器、更多 UART、更多 SPI...

数量上翻倍，功能也更强。但概念上和 F103 相同，你学过的都能用。

---

### 总结：心智模型升级

学到这里，你对 H723 应该有这样的感觉：

> **H723 不是一块"更快的 F103"，而是一个"嵌入式级的小型电脑"**。它有：
> 
> - 多级内存（像 PC 的 L1/L2 Cache + RAM）
> - 多总线并行（像 PC 的 PCIe/DMI）
> - 电源管理（像手机的各种功耗状态）
> - 内存保护（像 PC 的虚拟内存保护）
> - 高速 I/O（以太网、高速 SPI、LCD 加速）

**F103 时代的思维方式：单线程 + 平坦内存 + 简单时钟 + 轮询/中断驱动**

**H723 时代的思维方式：多任务并行 + 分层内存 + 分布式时钟 + 事件/DMA 驱动**

你学过的所有知识（GPIO、I2C、SPI、状态机、观察者模式、RTOS、流水线）在 H723 上**全部适用**。H723 没有推翻什么，只是**加入了新的维度**。

---

### 停下来综合检测

给你几个综合题，检验这一课的理解：

**综合题 1**：你在 H723 上用 FreeRTOS，有一个任务要做大量 `float` 数组计算（比如 FFT），你会：

- 把数组放在哪块内存？
- 开不开 DCache？
- 这个任务的栈放哪？

**综合题 2**：你同时要用 ADC DMA 以 1MSPS 采集信号存到环形缓冲区，CPU 在另一个任务里做滤波算法。为了避免 Cache 一致性 bug，你有几种方案？各自的性能影响？

**综合题 3**：H723 跑 550MHz，Flash 最多只能 200MHz 访问。如果你的代码**完全不开 ICache**，性能损失会有多大？是可以接受（比如 10%），还是灾难性（比如 80%）？为什么？

**综合题 4**（开放）：基于你现在对 H723 的理解，如果让你在 H723 上跑一个**音频处理**项目（采样 → FFT → 滤波 → 输出），你会怎么规划内存、DMA、任务？画一个草图（或文字描述）就行。

---

### 下一步

回答上面的综合题（至少 1、2、3，第 4 题选答），我根据你的回答判断你是否真的消化了。

之后我们可以：

- **继续讲 H723 的具体新外设**（FDCAN、以太网、QSPI 选一个深入）
- **开始 H723 版的综合项目**（你之前计划的那个，用 H723 做主板或从板）
- **讲 STM32 的启动流程和链接脚本**（这是前面一直没展开的底层知识，有了它你对整个系统的掌握会完整）

选哪个？或者你有别的想法？

我留一个小彩蛋——**你现在掌握的知识，已经能胜任绝大多数商业嵌入式项目**。H723 这种级别的芯片，很多工程师用三四年才摸清。你走到这一步的意义不是"学到了一个具体芯片"，而是**建立了一套能迁移到任何 Cortex-M 芯片的系统性思维**。将来你拿起 STM32U5、NXP i.MX RT、Renesas RA8——看过的时候会觉得"哦，还是那些老东西"。💪