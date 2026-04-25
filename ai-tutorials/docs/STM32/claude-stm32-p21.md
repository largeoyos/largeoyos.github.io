# H723 新外设深入：第三弹 —— QSPI 与内存映射模式

好，讲 QSPI。这一课我准备换个方式——我想让你**先基于已学知识推导**，而不是我直接告诉你答案。因为 QSPI 本质上是你已经学过的 SPI 的"升级版"，你应该能自己推导出很多东西。

---

### 先让你自己推理

你已经深入学过 SPI（第五课的 W25Q Flash），也学过 SDMMC（上一课）。现在看到"QSPI"这个名字，我想先让你思考几个问题：

**问题 1**：从名字猜——**Q**SPI 的 **Q** 代表什么？（提示：回忆一下 SPI 有几根数据线？如果你要"升级"SPI，最自然的方向是什么？）

**问题 2**：SPI 一次传 1 bit（MISO 或 MOSI 各一根线）。如果让你设计 QSPI，你会怎么改？

- (a) 提高时钟频率（比如从 50MHz 升到 200MHz）
- (b) 增加数据线数量
- (c) 两者都做
- (d) 完全改变协议

**问题 3**：你在第五课学 SPI Flash 时，读 1 字节大致要多久？让我们简单估算：W25Q64 @ 50MHz SPI，读 1 字节需要"1 命令字节 + 3 地址字节 + 1 数据字节" = 5 × 8 bit = 40 bit，约 0.8μs。

如果 QSPI 把数据线扩到 4 条，速度会变快多少？1/4 的时间？还是有别的复杂因素？

先自己想，不用查资料。

---

### 假设你已经推理完了

我来补答案：

**问题 1 答案**：**Q = Quad**（四）。**QSPI = Quad SPI = 4 根数据线的 SPI**。

**问题 2 答案**：**(c) 两者都做**。QSPI 不只增加了数据线，也把时钟频率推到 100~200MHz。

**问题 3 答案**：**不是简单的 1/4 时间**。我们来仔细想想。

QSPI 读 1 字节的过程，**命令段和地址段可以走 1 线、2 线或 4 线**，数据段同样。最常见的配置：

- 命令：1 字节，1 线传输（兼容 SPI 传统命令集）
- 地址：3 字节，4 线传输（"Quad"版本）
- **Dummy 周期**：通常 8 个 clock（Flash 内部准备数据的时间）
- 数据：N 字节，4 线传输

读 1 字节耗时：

- 命令：8 clock
- 地址：3 × 8 / 4 = 6 clock
- Dummy：8 clock
- 数据：2 clock
- 共：24 clock @ 100MHz = 0.24μs

相比 SPI 的 0.8μs，**确实快 3~4 倍**。但如果你读 1000 字节：

- SPI：40 + 1000 × 8 = 8040 clock @ 50MHz = 161μs
- QSPI：24 + 1000 × 2 = 2024 clock @ 100MHz = 20μs

**快 8 倍**！因为 QSPI 的固定开销（命令+地址+dummy）不变，但数据量越大，单位字节的开销越小。

---

### 现在引出今天的核心——QSPI 不只是"更快的 SPI"

如果 QSPI 只是"速度快一点"，它就不值得单独讲一课。它真正的革命性特性是——

**内存映射模式（Memory-Mapped Mode）**

让我先让你思考，再揭晓这有多酷。

**问题 4**：你的 H723 内部 Flash 是 1MB。你写的代码编译后放在 Flash 里，CPU 通过类似 `0x08000000 + offset` 的地址直接取指令执行。你**不需要"先读 Flash 再执行"**——CPU 直接从 Flash 取指。

现在假设你外挂一个 QSPI Flash（比如 W25Q256，32MB）。**问题**：你能像使用内部 Flash 一样，让 CPU 直接从外部 QSPI Flash 取指执行代码吗？

如果能，意味着什么？如果不能，又为什么？

先自己想 30 秒。

...

---

### 答案：能！这就是内存映射模式

H723 的 QSPI 有个杀手级特性——**内存映射模式**。配置好后，外部 QSPI Flash **被映射到 CPU 地址空间的 0x90000000**，CPU 访问这个地址就像访问内部 Flash 一样**完全透明**。

c

```c
/* 配置 QSPI 为内存映射模式后 */
uint32_t *external_flash = (uint32_t*)0x90000000;
uint32_t data = *external_flash;    // ← CPU 自动通过 QSPI 硬件去读外部 Flash！
                                    //   完全像访问普通内存一样
```

**CPU 根本不知道这个地址在外部**——它像读内部 Flash 一样发地址，H723 内部的 QSPI 控制器拦截这个访问，自动生成 QSPI 命令，读 Flash，把数据返回给 CPU。

**这意味着你可以**：

1. **把代码存在外部 Flash 执行**：内部 1MB 不够用？32MB 的 QSPI Flash 直接作为代码空间用。
2. **把大量静态数据（图片、字体、音频）放在外部 Flash，直接读**：不用手动 `HAL_QSPI_Read()`，用指针访问即可。
3. **超出芯片限制的应用**：嵌入式图形界面（LVGL）需要大量字库和图片资源，QSPI 内存映射是标配。

#### 对比：传统 SPI Flash vs 内存映射 QSPI

**传统 SPI Flash（你在第五课学的方式）**：

c

```c
uint8_t buffer[64];
W25Q_ReadData(&flash, 0x1000, buffer, 64);   // 显式调用驱动
use_data(buffer);
```

- 需要手动调用读函数
- 数据先进 RAM 缓冲区才能用
- 想随机访问不同地址，要多次调用

**内存映射 QSPI**：

c

```c
uint8_t *data = (uint8_t*)(0x90001000);   // 对应外部 Flash 的 0x1000
use_data(data);                            // 直接用！硬件后台读取
```

- 不用调用任何函数
- 像访问内部 RAM 一样
- 可以直接 `data[i]` 随机访问

**但是有代价**——速度还是比内部 Flash 慢（毕竟要经过 QSPI 协议），而且是"只读"的（写必须切回间接模式）。

---

### 停下来思考

**思考题 A**：基于你对内存映射的理解，想想下面的代码在不同场景下的性能差异。

假设 `big_font_data` 是一个 1MB 的字库数组。

c

```c
const uint8_t big_font_data[1024 * 1024] = { ... };

int main() {
    uint32_t sum = 0;
    for (int i = 0; i < 1024 * 1024; i++) {
        sum += big_font_data[i];
    }
}
```

**场景 1**：`big_font_data` 放内部 Flash，CPU 开 ICache/DCache **场景 2**：`big_font_data` 放外部 QSPI Flash（内存映射模式），开 Cache **场景 3**：同场景 2，但关闭 Cache

你估计各场景耗时如何排序？差距多大量级？

...

**我的估计**：

- 场景 1：最快（Cache 命中+内部 Flash）
- 场景 2：中等（Cache 命中时等同场景1，未命中时慢 10~50 倍）
- 场景 3：最慢（每次访问都走 QSPI 协议）

**关键洞察**：**Cache 对 QSPI 内存映射的性能至关重要**。Cache 命中时相当于直接从 SRAM 读，几乎和内部 Flash 一样快。Cache 未命中时要走 QSPI 协议（慢几十倍）。

所以**外部 QSPI Flash + Cache 启用 ≈ 内部 Flash 的用户体验**，但容量大几十倍。这就是现代嵌入式产品（高端 MCU 跑 GUI、小型嵌入式 Linux）的标配方案。

---

### 第一部分：QSPI 的三种工作模式

H723 的 QSPI 控制器有三种工作模式，对应不同场景：

#### 模式 1：间接模式（Indirect Mode）

和你学的 SPI 一样的用法——调用函数读写。

c

```c
HAL_QSPI_Command(&hqspi, &cmd, HAL_QSPI_TIMEOUT_DEFAULT_VALUE);
HAL_QSPI_Receive(&hqspi, buffer, HAL_QSPI_TIMEOUT_DEFAULT_VALUE);
```

**用途**：写入数据（内存映射模式只能读）、擦除扇区、执行 Flash 特殊命令（读ID、查询状态）。

#### 模式 2：内存映射模式（Memory-Mapped Mode）

上面已经讲过——配置一次，之后像普通内存一样用。

c

```c
/* 配置后 */
uint8_t *p = (uint8_t*)0x90000000;
uint8_t value = p[12345];    // 读外部 Flash 的 0x3039 地址
```

**用途**：只读场景——代码执行、静态数据读取、GUI 资源。

#### 模式 3：状态轮询模式（Status Polling Mode）

专门用来**等 Flash 内部操作完成**。比如你发了"擦除扇区"命令，Flash 需要 100ms+ 完成。期间 CPU 要反复读 Flash 的状态寄存器判断是否完成。

QSPI 可以**自动轮询**——配置好之后，QSPI 硬件自己反复读状态寄存器，等到某个条件满足时触发中断通知 CPU。CPU 在这期间做别的事。

c

```c
/* 配置自动轮询，等 BUSY bit 变 0 */
HAL_QSPI_AutoPolling(&hqspi, &cmd, &polling_config, timeout);
/* 期间 CPU 可以做别的事，硬件自动轮询 */
```

**用途**：擦除/写入完成检测，彻底解放 CPU。

这三种模式是 H723 QSPI 的核心——**间接模式写，内存映射模式读，自动轮询模式等**。

---

### 第二部分：硬件选型和接线

#### 选什么 Flash？

H723 支持的 QSPI Flash 有很多。常见的选择：

|型号|容量|电压|最高速度|价格|
|---|---|---|---|---|
|W25Q64JV|8MB|3.3V|133MHz|~5元|
|W25Q128JV|16MB|3.3V|133MHz|~8元|
|**W25Q256JV**|**32MB**|**3.3V**|**133MHz**|~15元|
|MX25L51245G|64MB|3.3V|104MHz|~30元|

**推荐 W25Q64 或 W25Q128**——足够大，便宜，最主流。实际上这是你第五课用过的 W25Q 系列的 Quad 接口版本！**同一个芯片，既支持 SPI 也支持 QSPI**——看你用几根数据线。

#### H723 QSPI 引脚分配

典型引脚（H723VGT6）：

```
功能          引脚
────          ────
QSPI_CLK      PB2
QSPI_BK1_NCS  PB6 (片选)
QSPI_BK1_IO0  PD11 (D0, 兼容 MOSI)
QSPI_BK1_IO1  PD12 (D1, 兼容 MISO)
QSPI_BK1_IO2  PE2  (D2)
QSPI_BK1_IO3  PD13 (D3)
```

不同芯片封装引脚不同，CubeMX 会给你选。

#### 接线示意

```
STM32H723             W25Q128JV
─────────             ─────────
PB6 (NCS)  ─────── CS#
PB2 (CLK)  ─────── CLK
PD11 (IO0) ─────── DI/IO0
PD12 (IO1) ─────── DO/IO1
PE2  (IO2) ─────── WP#/IO2
PD13 (IO3) ─────── HOLD#/IO3
3.3V       ─────── VCC
GND        ─────── GND
```

**注意**：

- WP#（写保护）和 HOLD# 在 Quad 模式下变成 IO2 和 IO3
- Flash 模块**必须上拉 IO2 和 IO3**（防止进入 QPI 模式前误触发）
- 淘宝有现成的 QSPI Flash 模块，带好上拉电阻

---

### 第三部分：CubeMX 配置

#### Step 1：启用 QSPI

1. 左侧 `Connectivity` → `QUADSPI`
2. **Mode**：
    - `Bank 1` 启用
    - `Data Lines`：**`Quad`**（4 线）
3. **Parameter Settings**：
    - `Clock Prescaler`：`2`（开始保守，HCLK3 / 3 = QSPI 时钟）
    - `FIFO Threshold`：`4`
    - `Sample Shifting`：`No shift`（高速时可能需要 `Half cycle shift`）
    - `Flash Size`：`22`（意为 2^(22+1) = 8MB 地址空间，W25Q64 是 8MB）
    - `Chip Select High Time`：`1 cycle`
    - `Clock Mode`：`Mode 0`

#### Step 2：时钟配置

在 Clock Configuration：

- `QUADSPI` 时钟源可选 `AHB3`（和 HCLK3 同频）或 `PLL1Q/PLL2R`
- 简单起见，用 AHB3，比如 275MHz / 3 = 91MHz QSPI 时钟

#### Step 3：生成代码，CubeMX 会生成

c

```c
QSPI_HandleTypeDef hqspi;

void MX_QUADSPI_Init(void)
{
    hqspi.Instance = QUADSPI;
    hqspi.Init.ClockPrescaler = 2;
    hqspi.Init.FifoThreshold = 4;
    hqspi.Init.SampleShifting = QSPI_SAMPLE_SHIFTING_NONE;
    hqspi.Init.FlashSize = 22;
    hqspi.Init.ChipSelectHighTime = QSPI_CS_HIGH_TIME_1_CYCLE;
    hqspi.Init.ClockMode = QSPI_CLOCK_MODE_0;
    HAL_QSPI_Init(&hqspi);
}
```

---

### 第四部分：写 QSPI Flash 驱动

你在第五课写过 W25Q 的 SPI 驱动。现在我们写 QSPI 版本，**核心思路完全一样**，只是用不同 API。

#### 读 ID 验证连接

c

```c
#define W25Q_CMD_READ_ID          0x9F
#define W25Q_CMD_WRITE_ENABLE     0x06
#define W25Q_CMD_READ_STATUS_1    0x05
#define W25Q_CMD_SECTOR_ERASE     0x20
#define W25Q_CMD_QUAD_PAGE_PROG   0x32  // 用 Quad 模式写
#define W25Q_CMD_FAST_READ_QUAD   0x6B  // 用 Quad 模式读

HAL_StatusTypeDef W25Q_ReadID(uint32_t *id)
{
    QSPI_CommandTypeDef cmd = {0};
    uint8_t data[3];
    
    cmd.InstructionMode = QSPI_INSTRUCTION_1_LINE;    // 命令用 1 线
    cmd.Instruction = W25Q_CMD_READ_ID;
    cmd.AddressMode = QSPI_ADDRESS_NONE;              // 无地址
    cmd.AlternateByteMode = QSPI_ALTERNATE_BYTES_NONE;
    cmd.DataMode = QSPI_DATA_1_LINE;                  // 数据用 1 线（读 ID 是传统命令）
    cmd.NbData = 3;                                   // 读 3 字节
    cmd.DummyCycles = 0;
    cmd.DdrMode = QSPI_DDR_MODE_DISABLE;
    cmd.DdrHoldHalfCycle = QSPI_DDR_HHC_ANALOG_DELAY;
    cmd.SIOOMode = QSPI_SIOO_INST_EVERY_CMD;
    
    if (HAL_QSPI_Command(&hqspi, &cmd, HAL_QSPI_TIMEOUT_DEFAULT_VALUE) != HAL_OK)
        return HAL_ERROR;
    
    if (HAL_QSPI_Receive(&hqspi, data, HAL_QSPI_TIMEOUT_DEFAULT_VALUE) != HAL_OK)
        return HAL_ERROR;
    
    *id = (data[0] << 16) | (data[1] << 8) | data[2];
    return HAL_OK;
}

/* 使用 */
uint32_t id;
W25Q_ReadID(&id);
printf("Flash ID: 0x%06lX\r\n", id);
/* W25Q64: 0xEF4017, W25Q128: 0xEF4018, W25Q256: 0xEF4019 */
```

#### 停下来对比一下

和你第五课写的 SPI 版本对比：

c

```c
/* SPI 版本（第五课）*/
_cs_low(f);
_spi_xfer(f, 0x9F);              // 发命令
id |= _spi_xfer(f, 0xFF) << 16;  // 逐字节接收
id |= _spi_xfer(f, 0xFF) << 8;
id |= _spi_xfer(f, 0xFF);
_cs_high(f);

/* QSPI 版本（当前）*/
cmd.Instruction = 0x9F;
cmd.DataMode = QSPI_DATA_1_LINE;
cmd.NbData = 3;
HAL_QSPI_Command(&hqspi, &cmd, ...);
HAL_QSPI_Receive(&hqspi, data, ...);
```

**差异**：SPI 是"一位一位、一字节一字节"构造协议，QSPI 是"声明整体结构让硬件去做"。QSPI 把协议各段（命令/地址/dummy/数据）**抽象成一个 `QSPI_CommandTypeDef` 结构体**，你填字段硬件执行。

**思考题 B**：为什么 QSPI 要这样设计 API？如果让 QSPI 像 SPI 一样用"字节流 API"，行不行？

...

**原因**：QSPI 的各段可以**以不同线宽**传输（命令 1 线、地址 4 线、数据 4 线），硬件需要知道整个命令的结构才能正确切换线宽。用"字节流"模式无法表达"这 3 字节是 4 线传输"这种语义。

这是一个典型的**协议层抽象**——API 的设计体现了协议的特性。

#### 用 Quad 模式高速读

启用 Quad 模式的 Fast Read 命令（`0x6B`）：

c

```c
HAL_StatusTypeDef W25Q_QuadRead(uint32_t addr, uint8_t *buf, uint32_t len)
{
    QSPI_CommandTypeDef cmd = {0};
    
    cmd.InstructionMode = QSPI_INSTRUCTION_1_LINE;    // 命令仍 1 线（兼容）
    cmd.Instruction = W25Q_CMD_FAST_READ_QUAD;
    cmd.AddressMode = QSPI_ADDRESS_1_LINE;            // 地址 1 线（传统 Fast Read Quad Output）
    cmd.AddressSize = QSPI_ADDRESS_24_BITS;
    cmd.Address = addr;
    cmd.DataMode = QSPI_DATA_4_LINES;                 // ← 数据用 4 线！
    cmd.NbData = len;
    cmd.DummyCycles = 8;                              // W25Q 需要 8 个 dummy clock
    cmd.DdrMode = QSPI_DDR_MODE_DISABLE;
    cmd.DdrHoldHalfCycle = QSPI_DDR_HHC_ANALOG_DELAY;
    cmd.SIOOMode = QSPI_SIOO_INST_EVERY_CMD;
    
    if (HAL_QSPI_Command(&hqspi, &cmd, HAL_QSPI_TIMEOUT_DEFAULT_VALUE) != HAL_OK)
        return HAL_ERROR;
    
    return HAL_QSPI_Receive(&hqspi, buf, HAL_QSPI_TIMEOUT_DEFAULT_VALUE);
}
```

**注意"Dummy Cycles"**——这是 Flash 内部准备数据的时间。W25Q 系列在 Quad Read 模式下需要 8 个 clock。查 Flash 数据手册！写错了读不到数据。

---

### 第五部分：内存映射模式——今天的高潮

#### 配置内存映射

c

```c
HAL_StatusTypeDef W25Q_EnableMemoryMapped(void)
{
    QSPI_CommandTypeDef cmd = {0};
    QSPI_MemoryMappedTypeDef cfg = {0};
    
    /* 描述"读取命令"的结构 */
    cmd.InstructionMode = QSPI_INSTRUCTION_1_LINE;
    cmd.Instruction = W25Q_CMD_FAST_READ_QUAD;
    cmd.AddressMode = QSPI_ADDRESS_1_LINE;
    cmd.AddressSize = QSPI_ADDRESS_24_BITS;
    cmd.DataMode = QSPI_DATA_4_LINES;
    cmd.DummyCycles = 8;
    cmd.DdrMode = QSPI_DDR_MODE_DISABLE;
    cmd.DdrHoldHalfCycle = QSPI_DDR_HHC_ANALOG_DELAY;
    cmd.SIOOMode = QSPI_SIOO_INST_EVERY_CMD;
    
    /* 映射配置 */
    cfg.TimeOutActivation = QSPI_TIMEOUT_COUNTER_DISABLE;  // 禁用超时（总保持映射）
    cfg.TimeOutPeriod = 0;
    
    return HAL_QSPI_MemoryMapped(&hqspi, &cmd, &cfg);
}
```

调用它之后——**就这一次**——外部 Flash 就映射到 `0x90000000` 了。

#### 使用：像内部 Flash 一样

c

```c
int main(void)
{
    /* ... 初始化 ... */
    W25Q_EnableMemoryMapped();
    
    /* 直接用指针访问外部 Flash！*/
    uint8_t *ext_flash = (uint8_t*)0x90000000;
    
    printf("Byte at offset 0x100: 0x%02X\r\n", ext_flash[0x100]);
    printf("Bytes: ");
    for (int i = 0; i < 16; i++) {
        printf("%02X ", ext_flash[i]);
    }
    printf("\r\n");
    
    /* 甚至可以把外部 Flash 的数据当结构体 */
    typedef struct { uint32_t magic; char name[64]; } Header;
    Header *hdr = (Header*)0x90000000;
    printf("Magic: 0x%08X, Name: %s\r\n", hdr->magic, hdr->name);
    
    while (1) { /* ... */ }
}
```

**这一切 CPU 完全不知道是外部 Flash**。它看到的就是普通内存访问，背后 QSPI 硬件自动生成 Fast Read Quad 命令。

#### 写的情况

**内存映射模式只能读**。如果你想写外部 Flash：

c

```c
HAL_QSPI_Abort(&hqspi);              // 退出内存映射
W25Q_WriteEnable();
W25Q_QuadPageProgram(addr, data, len);  // 用间接模式写
W25Q_WaitBusy();
W25Q_EnableMemoryMapped();           // 重新进入内存映射
```

写操作必须退出映射模式——因为 Flash 协议上"写"和"读"是完全不同的命令序列。

#### 停下来思考

**思考题 C**：基于前面讨论的"Cache 对内存映射性能至关重要"，想想下面的代码：

c

```c
/* 场景 1：关闭 DCache */
uint32_t sum = 0;
uint8_t *ext = (uint8_t*)0x90000000;
for (int i = 0; i < 1000; i++) {
    sum += ext[i];   // 每次都走 QSPI 读
}

/* 场景 2：开启 DCache */
/* 同样代码 */
```

分析：场景 1 每次读都走 QSPI，场景 2 呢？

...

**答案**：场景 2 会怎样？

- 第一次 `ext[0]` 被访问时，Cache 未命中，走 QSPI 读一个 Cache Line（32 字节）到 Cache
- `ext[1]..ext[31]` 被访问时，Cache 命中，**不走 QSPI**
- 到 `ext[32]`，又未命中，再读 32 字节
- ...

所以 1000 次访问只引发了 ~32 次 QSPI 实际读取。**Cache 把连续访问的开销分摊了**。

这和 DDR SDRAM 的内存访问原理一样——空间局部性是性能优化的核心。

---

### 第六部分：把代码放到外部 Flash 执行（XIP）

**XIP** = eXecute In Place，原地执行。意思是 CPU 直接从外部 Flash 取指，不需要把代码先拷贝到 RAM。

这是 H723 的高级特性。要实现它，你需要：

#### 1. 修改链接脚本

在 `.ld` 文件里加一个内存区域：

ld

```ld
MEMORY
{
  /* 内部 */
  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 1024K
  DTCMRAM (xrw) : ORIGIN = 0x20000000, LENGTH = 128K
  /* ... */
  
  /* 外部 QSPI Flash */
  QSPI (rx) : ORIGIN = 0x90000000, LENGTH = 8M
}

SECTIONS
{
  /* 正常的 .text 段放内部 Flash */
  .text : { ... } >FLASH
  
  /* 把"次要代码"放外部 Flash */
  .external_code :
  {
    *(.external_code)
    *(.external_code.*)
  } >QSPI
}
```

#### 2. 在代码里指定哪些函数放外部 Flash

c

```c
__attribute__((section(".external_code")))
void big_ui_function(void) {
    /* 一个很大的 UI 处理函数 */
    /* ... */
}

int main(void) {
    W25Q_EnableMemoryMapped();
    big_ui_function();   // 会自动从 0x90000000 区域取指执行！
}
```

#### 3. 把编译后的代码预先烧到外部 Flash

这需要一个"两段启动"流程：

- **启动代码（内部 Flash）**：初始化时钟、QSPI，进入内存映射模式
- **应用代码（外部 Flash）**：大部分应用在这里
- 烧录时：先烧内部 Flash 的启动代码，再用启动代码把应用写到外部 Flash（或用 ST-Link 的外部 Loader 直接烧）

实际工程里很少用纯 XIP，更多是 **"内部 Flash 存代码 + 外部 Flash 存数据资源"** 的混合模式。

---

### 停下来做几道综合题

**综合题 1**：假设你在做一个 GUI 产品（用 LVGL 跑在 H723 上），需要：

- 代码 800KB
- 字体和图标资源 5MB
- 音频文件 2MB
- 运行时堆 + 栈 100KB

H723 内部 Flash 1MB，内部 RAM 564KB。你会怎么规划？

...

**参考方案**：

- 代码放内部 Flash（1MB 够）
- 字体、图标、音频放外部 QSPI Flash + 内存映射（直接访问）
- 堆栈放 DTCM（最快）
- LVGL 的帧缓冲（Frame Buffer）放 AXI SRAM + Non-Cacheable MPU 区（DMA2D 会用）

**综合题 2**：为什么 QSPI 不能替代 SDMMC？它们各自的最佳场景是什么？

...

**参考答案**：

||QSPI Flash|SD 卡|
|---|---|---|
|容量|几 MB ~ 几百 MB|几 GB ~ 几百 GB|
|速度|非常快（内存映射）|较快（DMA 批量）|
|可更换性|焊死在 PCB|用户可插拔|
|价格/GB|贵|便宜|
|写次数寿命|10万~100万次|几千次（消费级）|
|文件系统|需要自己管理|天然 FAT32|

**QSPI 适合**：产品固件、字库、固定资源（代码+数据） **SD 卡适合**：用户数据、日志、大容量存储、可换介质

---

### 本课任务

#### 必做

1. **硬件准备**：买一个 QSPI Flash 模块（W25Q128JV 推荐）
2. **ID 验证**：读出 Flash ID，确认硬件通信正常
3. **Quad 读写**：用间接模式写入一段数据，再读回验证
4. **内存映射实验**：进入内存映射模式，用普通指针读出数据，和间接模式读出的数据对比

#### 进阶

**进阶 1**：**速度对比**。用 DWT 周期计数器测量以下操作耗时：

- 普通 SPI 模式读 1KB（你第五课的代码）
- QSPI 间接模式 Quad 读 1KB
- QSPI 内存映射 + DCache 命中读 1KB

应该看到 10+ 倍的性能差异。

**进阶 2**：**把一张图片存进外部 Flash，代码中显示**。用脚本把 `image.bin` 烧到 QSPI Flash 的某个地址（0x1000 开始），代码里 `uint8_t *img = (uint8_t*)(0x90001000)`，直接传给显示函数。

#### 挑战

**挑战**：**实现外部 Flash 上的 FatFS**。回忆上一课讲的文件系统分层——FatFS 核心不关心存储介质，你只需要把 `disk_read/disk_write` 绑定到 QSPI 操作，就能在外部 Flash 上建一个文件系统。

c

```c
/* 改 user_diskio.c */
DRESULT USER_read(BYTE pdrv, BYTE *buff, DWORD sector, UINT count) {
    return W25Q_QuadRead(sector * 512, buff, count * 512) == HAL_OK 
           ? RES_OK : RES_ERROR;
}

DRESULT USER_write(BYTE pdrv, const BYTE *buff, DWORD sector, UINT count) {
    /* 注意：Flash 写之前必须先擦除所在扇区！*/
    /* 这个比 SD 卡复杂，因为 Flash 有"只能 1→0"的特性 */
}
```

**Flash 写入的复杂性**是这个挑战的核心——你得实现"擦除+写入"的组合逻辑。完成后你真正理解了"为什么 Flash 比 SD 卡复杂"。

---

### 停下来互动

**反馈 1**：QSPI 相比 SPI 最大的改变是什么？你能用自己的话说清"内存映射模式"吗？

**反馈 2**：思考题 A、B、C 你怎么答的？特别是 A——理解了它就理解了"Cache 为什么对 QSPI 至关重要"。

**反馈 3**：综合题 1、2 你的方案？"QSPI 不能替代 SD 卡"这个理解对你未来选型很重要。

---

### 下一讲选择

到此为止，我们已经走过了 **FDCAN、SDMMC+FatFS、QSPI**。剩下的外设主要方向：

- **C. DMA2D + LCD**：H723 的图形加速器，为 LVGL/TouchGFX 做准备。这是做"带屏幕产品"的必修课。
- **E. 定时器高级功能**：输入捕获（测频率/脉宽）、编码器接口（读旋转编码器）、同步定时器（多个定时器联动做三相 PWM）、死区时间生成。这块是**电机控制**的核心。
- **F. ADC 高级功能**：H723 的 ADC 是 16 位 SAR，速度超过 3MSPS，支持差分输入、温度传感器、VBat 监控。比 F103 强太多。
- **G. USB**：H723 的 USB 可以做 CDC 虚拟串口、HID 键盘鼠标、Mass Storage U 盘、DFU 升级。
- **连网方向**：以太网 + LwIP（复杂度最高）

我推荐你可以选 **C（DMA2D+LCD）** 或 **E（定时器高级）**。它们走两个不同的应用方向：

- C 偏向"人机界面"产品（家电、仪器、消费电子）
- E 偏向"控制"产品（电机、机器人、工业控制）

你对哪个方向更感兴趣？或者你有其他想学的？🚀