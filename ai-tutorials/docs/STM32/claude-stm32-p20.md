# H723 新外设深入：第二弹 —— SDMMC + FatFS

好，讲 SDMMC。不过在我开始之前，我想先搞清楚你的起点——SD 卡这个话题跨度很大，从"怎么把一个字节写到 SD 卡"到"怎么在 SD 卡上读写文件"是两个完全不同的层次。

---

### 先聊聊你对"SD 卡"的印象

花 30 秒想想，回答：

**问题 1**：你手机里的 SD 卡、相机里的 SD 卡、电脑的 SD 读卡器——它们本质上是什么？是一块"存储芯片"？还是"带控制器的小电脑"？

**问题 2**：你知道 SD 卡和 U 盘、硬盘、W25Q Flash（你第五课学的 SPI Flash）——它们底层存储介质是不是一样的？

**问题 3**：当你在电脑上"把文件复制到 U 盘"，这个"文件"概念是谁在维护？U 盘自己知道"文件"是什么吗？还是操作系统知道？

这三个问题的答案，决定了今天这节课的正确切入点。

---

### 先别急着答，我给你一些铺垫

因为 SDMMC 和 FatFS 的学习，涉及**两个独立的层次**，你必须先分清：

```
┌─────────────────────────────────────┐
│  你的应用代码                       │
│  fopen("log.txt")                   │
│  fwrite(data, ...)                  │
│  fclose()                           │
└─────────────────────────────────────┘
              ↓ 调用
┌─────────────────────────────────────┐
│  FatFS 文件系统层                    │← 这是"软件"层，和 SD 卡无关
│  管理：目录树、文件分配表、簇、扇区  │
└─────────────────────────────────────┘
              ↓ 要求读写某个扇区
┌─────────────────────────────────────┐
│  SDMMC 驱动层                        │← 这是"硬件"层
│  管理：初始化 SD 卡、发送命令、读写扇区
└─────────────────────────────────────┘
              ↓ 电气信号
┌─────────────────────────────────────┐
│  SD 卡硬件                          │
└─────────────────────────────────────┘
```

**关键洞察**：**SD 卡不知道什么是"文件"**。它只知道"扇区"（512 字节一块）。你对 SD 卡说"读第 12345 号扇区"，它给你 512 字节；你说"写第 12345 号扇区的这 512 字节"，它就写。

那"文件""目录""文件名"从哪来？**完全是上层软件（FAT、NTFS、ext4 等文件系统）虚构出来的概念**。

---

### 所以我用两个问题带你理解层次

**问题 A（底层）**：一块全新的 SD 卡，没格式化过。你往扇区 5 写了 "Hello World"，然后把卡拔下来插到另一台电脑。电脑能找到这个 "Hello World" 吗？是作为"文件"吗？

...

答：**电脑找不到任何"文件"**（电脑会说"需要格式化"）。但如果你写一个直接读扇区的工具（类似 WinHex），**能在扇区 5 看到那段数据**。这证明了——"文件"是虚构的概念。

**问题 B（层次转换）**：假设你在 FatFS 里执行 `fwrite("Hello World", ..., file)`，FatFS 最终会对 SDMMC 驱动发出什么指令？

...

答：FatFS 会：

1. 算出这个文件当前写到哪个**簇**（cluster，通常 8 个扇区）
2. 找到这个簇对应的**扇区号**
3. 调用 SDMMC 的 `disk_write(扇区号, 缓冲区, 扇区数)`
4. 如果写完当前簇，还要更新 **FAT 表**（文件分配表，记录"这个文件下一簇在哪"）
5. 更新**目录项**（文件大小、修改时间）

一个简单的 `fwrite` 可能对应 2~5 次底层扇区读写。**FatFS 帮你做了所有这些翻译**。

---

### 现在先回答你最初的问题

**问题 1 答案**：**SD 卡是一台小电脑**。它里面有一块 NAND Flash 存储介质 + 一个**控制器芯片（微控制器）**。这个控制器负责：

- 磨损均衡（让每个 Flash 块均匀磨损，延长寿命）
- 错误纠正（Flash 老化会出错，控制器自动修复）
- 坏块管理
- 和主机通信

你的 MCU 不是直接操作 Flash，而是**通过 SD 协议和这个控制器对话**。

**问题 2 答案**：

- SD 卡：NAND Flash + 控制器
- U 盘：NAND Flash + USB 控制器
- SSD：NAND Flash + 高级控制器
- **W25Q 是 NOR Flash**（和 NAND 不同，NOR 能直接读随机地址但密度低）
- 机械硬盘：磁性介质

SD 卡和 U 盘的**存储介质一样**，只是**接口协议不同**。

**问题 3 答案**：**操作系统（或 MCU 上的 FatFS）**维护"文件"概念。SD 卡自己完全不知道。

---

### 第一部分：SD 卡的接口协议

SD 卡有两种通信接口：

**接口 A：SPI 模式**

- 用 4 根线（MOSI、MISO、SCK、CS）
- 速度慢（最多几十 Mbps）
- 接线简单，任何 MCU 的 SPI 都能用
- F103 用 SD 卡就是走这条路

**接口 B：SDIO / SDMMC 模式**（H723 用这个）

- 用 6 根线（CMD、CLK、D0、D1、D2、D3 —— 4 线宽数据总线）
- 速度快（最高 50MHz × 4bit = 200Mbps）
- 需要 MCU 专门的 SDMMC 外设
- **商业产品基本都用这个**

H723 有**两个 SDMMC 外设**（SDMMC1、SDMMC2），专门为 SD 卡/eMMC 设计。速度比 SPI 快 10 倍以上。

#### 物理接线

SD 卡（标准尺寸）9 个引脚，Micro SD 卡 8 个引脚。典型接线（Micro SD）：

```
STM32H723          Micro SD 卡
──────────         ───────────
PC8  (SDMMC1_D0)  ── DAT0
PC9  (SDMMC1_D1)  ── DAT1
PC10 (SDMMC1_D2)  ── DAT2
PC11 (SDMMC1_D3)  ── DAT3 (也是 CD/CS)
PC12 (SDMMC1_CK)  ── CLK
PD2  (SDMMC1_CMD) ── CMD
3.3V              ── VDD
GND               ── VSS1, VSS2

每根数据线和CMD线都要 10kΩ~50kΩ 上拉到 3.3V
(有的 SD 卡座自带上拉，看模块)
```

**淘宝搜 "Micro SD 卡模块" 或 "SD 卡座模块"** 就能买到接线好的，5~10 块钱。

---

### 第二部分：SD 卡协议的关键概念

#### 卡的类型和容量

- **SD（SDSC）**：≤ 2GB，按字节寻址
- **SDHC**：2GB~32GB，按扇区（512B）寻址 ← 最常见
- **SDXC**：32GB~2TB，按扇区寻址

**重要**：现在买到的基本都是 SDHC 或 SDXC，按扇区寻址。地址 0 是第 0 扇区的 0 字节，地址 1 是第 1 扇区的 0 字节（注意不是第 1 字节）。

#### 扇区大小

**标准：512 字节**。不管 SD 卡多大，每个扇区都是 512 字节。这是文件系统设计的基础。

**为什么是 512 字节？** 历史原因——起源于软盘、硬盘时代。现代存储其实可以用更大扇区，但为了兼容性，SD 卡对外还是暴露 512 字节扇区。

#### 命令系统

SD 卡用"命令 + 响应"方式通信，不是字节流。主机发命令（比如 CMD17 = 读单个扇区），卡返回响应 + 数据。主要命令：

- `CMD0`：复位
- `CMD8`：问 SD 卡版本
- `CMD17`：读单扇区
- `CMD24`：写单扇区
- `CMD18`：读多扇区
- `CMD25`：写多扇区
- `ACMD41`：初始化

**好消息是**：HAL 库把这些全封装了。你只需要调用 `HAL_SD_ReadBlocks()` 和 `HAL_SD_WriteBlocks()`。但你要知道这些命令存在，调试时才看得懂。

#### 一次读扇区的流程（帮你建立物理直觉）

用 SDIO 模式读扇区 1000 的过程：

```
1. MCU 通过 CMD 线发 CMD17，参数 = 1000 × 512 = 512000
   （扇区号 × 扇区大小，虽然 SDHC 直接用扇区号，但历史遗留）
2. SD 卡收到命令，开始在内部 Flash 里找扇区 1000
3. 大约 1~2ms 后，SD 卡通过 D0~D3 四条线同时传输数据
4. 512 字节数据通过 4 bit 并行传输，占用约 200 时钟周期
5. 同时有 CRC 校验，硬件自动检查
6. DMA 把数据搬到你的缓冲区
7. 完成中断触发，你的回调函数处理
```

**关键理解**：SDIO 比 SPI 快的主要原因——4 bit 并行而不是 1 bit 串行，加上 50MHz 更高频率。

---

### 停下来思考

**思考题 C**：假设你要以最高速度连续写 100MB 数据到 SD 卡。下面哪个策略最优？为什么？

- (A) 每收到 1 字节就调用 `HAL_SD_WriteBlocks(buffer, 1字节)`
- (B) 累积到 512 字节（一个扇区）后，调用 `HAL_SD_WriteBlocks(buffer, 1扇区)`
- (C) 累积到 4096 字节（8 个扇区 = 1 簇）后，一次写 8 扇区
- (D) 累积到 64KB 或更大，一次写几百扇区

先自己想，再看答案。

...

**答案：(D)**。

原因：SD 卡每次写操作都有**固定开销**（命令、内部 Flash 编程延迟、更新磨损均衡表），一次写 512 字节 vs 一次写 64KB，单位数据的开销差几十倍。

**典型性能数据**：

- 单扇区写：~2MB/s
- 批量写（64KB）：~20MB/s
- 批量写（1MB）：~50MB/s

这就是为什么数据记录器设计里有**"先写到 RAM 缓冲区，攒够再刷到 SD"**的模式。

---

### 第三部分：FatFS 文件系统

到这里你应该能理解——**SDMMC 只负责扇区读写**，"文件"这个概念需要上面加一层**文件系统**。

FatFS 是一个免费、开源的嵌入式文件系统库，实现 FAT12/FAT16/FAT32/exFAT 协议。它是**纯 C 库**，不依赖任何 OS，几十 KB 的代码。

#### FatFS 提供什么

类似 stdio 的 API：

c

```c
FATFS fs;
FIL file;

f_mount(&fs, "", 0);
f_open(&file, "hello.txt", FA_WRITE | FA_CREATE_ALWAYS);
f_write(&file, "Hello World", 11, &bw);
f_close(&file);
f_mount(NULL, "", 0);
```

熟悉吧？就是 `fopen/fwrite/fclose` 的嵌入式版本。

#### FatFS 需要你提供的"底层接口"

FatFS 是**硬件无关**的——它不知道你用 SD 卡、U 盘、NAND Flash 还是 SPI Flash。为了让它工作，你需要实现一组叫 **Disk I/O** 的底层接口：

c

```c
/* FatFS 要求你实现这些函数 */
DSTATUS disk_initialize(BYTE pdrv);
DSTATUS disk_status(BYTE pdrv);
DRESULT disk_read(BYTE pdrv, BYTE* buff, DWORD sector, UINT count);
DRESULT disk_write(BYTE pdrv, const BYTE* buff, DWORD sector, UINT count);
DRESULT disk_ioctl(BYTE pdrv, BYTE cmd, void* buff);
```

**FatFS 说"我要第 1000 扇区"，你的 `disk_read` 就调用 `HAL_SD_ReadBlocks()` 从 SD 卡读**。

好消息：**CubeMX 会自动帮你生成这些接口的实现**。你生成 FatFS 中间件时，它会把 SDMMC 的 HAL 调用绑进来。你不用写一行底层代码。

#### FatFS 的分层架构

```
┌─────────────────────────────────────┐
│ 你的应用代码                         │
│ f_open, f_read, f_write, ...        │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ FatFS 核心（ff.c）                   │
│ 理解 FAT32 格式、管理目录和文件      │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ Disk I/O 层（diskio.c）              │
│ 你实现的 disk_read / disk_write      │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ SDMMC HAL（HAL_SD_ReadBlocks等）    │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ 物理 SD 卡                          │
└─────────────────────────────────────┘
```

这又是**分层设计**的经典应用——每层只关心上下两层的接口，中间层可以替换。

#### 停下来思考

**思考题 D**：假设你想把 FatFS 从 SD 卡改用到"外挂的 QSPI Flash"（下一课的主题）。需要改哪些层？

...

**答案**：**只改 Disk I/O 层**。把 `disk_read` 改成调用 QSPI 驱动而不是 SDMMC 驱动。FatFS 核心完全不用动，你的应用代码（`f_open` 等）也完全不用动。

**这就是好架构的威力**——我们一直在讲"抽象层"的价值，这里是一个完美的案例。

---

### 第四部分：CubeMX 配置完整流程

#### Step 1：启用 SDMMC1

1. 左侧 `Connectivity` → `SDMMC1`
2. `Mode`：选 **`SD 4 bits Wide bus`**（4 线模式，最快）
3. `Parameter Settings`：
    - `SDMMC Clock Transceiver`：`Disable`（我们不用特殊收发器）
    - `Clock Power Save`：`Disable`（先不省电，简单）
    - `Hardware Flow Control`：`Enable`（推荐开，防数据丢失）
    - `SDMMC Clock Divider`：`2`（就是分频，先保守，工作后再调优）
4. DMA 配置（重要！H723 的 SDMMC 通常用内部 IDMA，CubeMX 默认会配好）

#### Step 2：配置时钟

在 Clock Configuration 选项卡：

- 找到 `SDMMC Clock Mux`
- 源选 `PLL1Q` 或 `PLL2R`（看你系统怎么配）
- SDMMC 时钟最好是 48MHz 左右（除以分频后得到卡时钟 24MHz，符合 SD 规范的高速模式）

#### Step 3：启用 FatFS

1. 左侧 `Middleware and Software Packs` → `FATFS`
2. `Mode`：勾选 **`SD Card`**
3. `Platform Settings` 里把 FatFS 绑定到 SDMMC1：
    - 不用改，它会自动检测
4. `Configuration` → `Set Defines`：
    - `USE_LFN`（长文件名）：选 `Enabled with dynamic working buffer on the HEAP` 或 `Enabled with static working buffer`
    - `MAX_SS`（最大扇区大小）：512
    - `FS_READONLY`：Disabled（要写入）
    - 其他默认

#### Step 4：增加堆和栈大小

FatFS 需要较多栈和堆（特别是长文件名支持）。在 `Project Manager` → `Linker Settings`：

- `Minimum Heap Size`：`0x1000`（4KB）
- `Minimum Stack Size`：`0x2000`（8KB）

#### Step 5：生成代码

---

### 第五部分：写第一个 SD 卡程序

#### 最简单的"Hello SD 卡"

c

```c
#include "fatfs.h"   // CubeMX 生成的 FatFS 集成
#include <string.h>

int main(void)
{
    /* ... CubeMX 初始化 ... */
    MX_FATFS_Init();
    
    FATFS fs;
    FIL fp;
    FRESULT res;
    UINT bw;   // bytes written
    
    /* 挂载文件系统 */
    res = f_mount(&fs, "", 1);   // 1 = 立即挂载
    if (res != FR_OK) {
        printf("Mount failed: %d\r\n", res);
        Error_Handler();
    }
    printf("SD card mounted\r\n");
    
    /* 打开（或创建）文件 */
    res = f_open(&fp, "hello.txt", FA_WRITE | FA_CREATE_ALWAYS);
    if (res != FR_OK) {
        printf("Open failed: %d\r\n", res);
        goto fail;
    }
    
    /* 写入 */
    const char *msg = "Hello from STM32H723!\r\n";
    res = f_write(&fp, msg, strlen(msg), &bw);
    printf("Wrote %u bytes\r\n", bw);
    
    /* 关闭（这步会把缓冲区数据刷到卡上）*/
    f_close(&fp);
    
    /* 重新打开读出来验证 */
    char read_buf[64] = {0};
    UINT br;
    res = f_open(&fp, "hello.txt", FA_READ);
    f_read(&fp, read_buf, sizeof(read_buf) - 1, &br);
    f_close(&fp);
    printf("Read back: %s\r\n", read_buf);
    
fail:
    f_mount(NULL, "", 0);   /* 卸载 */
    
    while (1) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        HAL_Delay(500);
    }
}
```

#### 烧录前的检查

1. **SD 卡必须预先格式化为 FAT32**（电脑上用 SD Formatter 或右键格式化）
2. **SD 卡容量别太大**，32GB 以内最稳（更大的容量需要 exFAT，配置复杂点）
3. **接线检查三次**，SD 卡对接线很敏感
4. **上拉电阻**：如果你的 SD 卡模块没带上拉，每根 DAT 线和 CMD 线都要 10k~50k 上拉到 3.3V

#### 成功的话，串口应该输出

```
SD card mounted
Wrote 23 bytes
Read back: Hello from STM32H723!
```

然后把 SD 卡拔下来插到电脑上，**应该能看到 hello.txt 文件**，内容和打印的一样。**这就是嵌入式和桌面系统的互通**。

---

### 第六部分：Cache 一致性陷阱（重要！）

回忆上一课讲的 Cache 问题。**SD 卡操作是 DMA 驱动的**——HAL_SD_WriteBlocks 底层通过 DMA 把缓冲区数据搬到 SDMMC 外设。

这意味着：

c

```c
uint8_t buffer[512];
strcpy((char*)buffer, "Hello");

HAL_SD_WriteBlocks_DMA(&hsd1, buffer, 100, 1);  // DMA 写扇区 100
```

**CPU 写了 buffer（进 Cache，没进 SRAM）→ DMA 读 SRAM（拿旧值）→ 写到 SD 卡的是错的 → 文件内容损坏**

FatFS 内部会遇到这个坑。**解决方案**：

#### 方案 A：在 FatFS 的 `disk_read/disk_write` 里加 Cache 操作

打开 CubeMX 生成的 `user_diskio.c` 或 `sd_diskio.c`，你会看到类似这样的代码：

c

```c
DRESULT SD_read(BYTE lun, BYTE *buff, DWORD sector, UINT count)
{
    /* ... 调用 HAL_SD_ReadBlocks_DMA ... */
}
```

在 DMA 读完后，**对 buff 做 Invalidate**：

c

```c
SCB_InvalidateDCache_by_Addr((uint32_t*)buff, count * 512);
```

在 DMA 写之前，**对 buff 做 Clean**：

c

```c
SCB_CleanDCache_by_Addr((uint32_t*)buff, count * 512);
```

#### 方案 B（推荐）：把 FatFS 的缓冲区放到 Non-Cacheable 内存

用 MPU 把一块 SRAM（比如 SRAM1）标记为 Non-Cacheable，让 FatFS 的所有中间缓冲区落在这里。这样 Cache 问题永远不会出现。

#### 方案 C：完全关闭 DCache（最省事但性能损失）

在 `main.c` 里 **不调用** `SCB_EnableDCache()`，保持 DCache 关闭。代码简单但 CPU 性能会下降 30~50%。

---

### 本课任务

#### 必做

1. **"Hello SD"**：按上面流程创建、写入、读取一个文件，卡上取出在电脑确认内容。
2. **目录遍历**：写一个函数 `list_dir("/")`，列出 SD 卡根目录所有文件和大小。用 `f_opendir` / `f_readdir` 实现。

#### 进阶

**进阶 1**：**数据记录器**。ADC 采集电位器，每 100ms 把 `(时间戳, 电压)` 写入一行到 `log.csv`。运行 10 分钟后拔卡到电脑，用 Excel 打开能看到曲线。

这个是 SD 卡最经典的应用场景——**长期数据采集**。

**进阶 2**：**Cache 一致性实验**。故意不做 Cache 处理，看能不能稳定写入。（测试环境：AXI SRAM + DCache 开启）。观察错误现象——可能是文件内容错乱、FAT 损坏、或完全不可读。这是**亲身体验 Cache 一致性 bug** 的好机会。然后加上 Clean/Invalidate，验证修复。

#### 挑战

**挑战 1**：**断电安全写入**。设计一个日志系统，即使在写入过程中突然断电，文件系统也不会损坏。提示：

- FatFS 有 `f_sync()` 函数，强制刷盘
- 合理设计写入频率（每条日志都 sync 太慢，完全不 sync 又危险）
- 可以用**双文件**策略：写日志 A 到崩溃阈值，切换到日志 B

这是工业数据记录器的核心设计问题，面试常问。

**挑战 2**：**速度基准测试**。写一个程序，测量你的 SD 卡：

- 单扇区连续写的速度（bytes/s）
- 64KB 批量写的速度
- 1MB 批量写的速度

你会看到 10 倍以上的差异，亲身理解"为什么要批量写"。

---

### 停下来互动

本课任务量比较大，我想听听你的反馈：

**反馈 1**：你能清晰说出 **SDMMC 驱动层** 和 **FatFS 文件系统层** 的职责划分吗？如果能，就掌握了今天最重要的概念。

**反馈 2**：思考题 C、D 你的答案是什么？特别是 D——它展示了"抽象层"的威力。

**反馈 3**：你打算先做"Hello SD"还是直接挑战数据记录器？

**反馈 4**：Cache 一致性问题在 SD 卡场景下如何理解？能自己用一句话说明为什么 SD 写入需要 Clean？

---

### 下一课预告

做完 SD 卡相关实验后，下次可以选：

- **B. QSPI**：外挂 Flash，和 SD 卡对比"两种外部存储"的设计哲学。也能引出"内存映射模式"这个很酷的特性——让外部 Flash 像内部 Flash 一样被 CPU 直接执行代码。
- **C. DMA2D + LCD**：图形化 + 性能加速。如果你对 GUI 感兴趣可以选这个。
- **E. 定时器高级功能**：输入捕获、编码器、同步——做精确测量和电机。

或者换一个方向：

- 回到**综合项目**，用 SD 卡做数据记录器，结合前面学的 ADC + RTOS + 按键菜单

我的建议是先把 SD 卡跑通再选下一步。如果 SD 卡遇到问题（新手 80% 会卡在硬件接线或 Cache 问题上），我们可以花时间调试——**调试过程本身就是最好的学习**。

等你的反馈。🚀