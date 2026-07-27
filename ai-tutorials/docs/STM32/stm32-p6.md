## H723 新外设深入：第一弹 —— FDCAN

下面逐项讲解，先从 **FDCAN** 开始。它与普通 CAN 的知识衔接紧密，适合用于理解 H723 的外设差异。

在罗列 FDCAN API 前，先通过以下问题检查基础，再选择相应的学习深度。

---

### 先问你几个问题

**问题 1**（回忆）：你还记得普通 CAN 有哪些"痛点"或"局限"吗？比如当初设计它是为了 1980 年代的汽车，放到现在还能满足需求吗？

具体一点，你能答出以下任意两个就行：

- 普通 CAN 单帧最多传多少字节数据？这个限制够用吗？
- 普通 CAN 最高多少 Mbps？现代汽车动辄几十上百个 ECU，带宽够吗？
- 如果一辆车要传"摄像头图像"或"ADAS 雷达点云"，用普通 CAN 可行吗？

**问题 2**（推理）：FDCAN 里的 "FD" 是什么意思？你能猜到吗？

（提示：FDCAN = CAN FD，标准名是 "CAN with Flexible Data-Rate"。从名字你能推断它改进了什么吗？）

**问题 3**（关于你的芯片）：你那块 H723VGT6 上的 CAN 收发器模块（TJA1050）如果你之前买的是给 F103 用的，你觉得能直接接在 H723 的 FDCAN 上用吗？还是需要升级收发器？

先花 1 分钟想这三个问题，然后我们往下走。

---

### 假设此前已经想过了，我来讲关键答案

#### 普通 CAN 的三大痛点（回顾）

1. **数据段太短**：最多 8 字节。传一个车轮速度没问题，传一个摄像头帧（几十 KB）完全不够。
2. **速度太慢**：最高 1 Mbps。50 个 ECU 同时跑，平均每个 20kbps，窄得像 2G 网络。
3. **开销比例高**：一个 CAN 帧除了 8 字节数据，还有 ID、CRC、ACK 等，总共约 110 bit。8 字节数据的"有效载荷比例"只有 58%。

#### CAN FD 做了什么

**1. 数据段扩展到 64 字节**（8 倍）

一帧能装更多数据，同样的信息量所需帧数减少，总线占用率下降。

**2. 数据段可以用更高速率**

这是最精髓的设计——**CAN FD 在一帧里用两种速率**：

```
|── 仲裁段（慢，如 500kbps）──|── 数据段（快，如 5Mbps）──|── 仲裁段（慢）──|
  ID + 控制位                    真正的数据                    CRC + ACK
```

**为什么要快慢结合？**

因为仲裁段需要"线与"机制（多个节点同时发、靠延迟让 ID 高位先到的赢），这个过程物理上要求**信号有足够时间稳定**，所以不能太快。

但数据段时，已经确定只有一个节点在发（仲裁赢了），**不用再同步了**，可以开足马力。于是 CAN FD 在数据段切换到更高波特率。

典型配置：**仲裁 500kbps / 数据 2Mbps 或 5Mbps**。

**3. CRC 升级**：更长的校验码，能检测更多种错误

#### H723 的 FDCAN 硬件特色

除了支持 CAN FD 协议，H723 的 FDCAN 外设本身也比 F103 的 bxCAN 更强：

||F103 bxCAN|H723 FDCAN|
|---|---|---|
|发送邮箱|3 个固定|灵活配置（用专用 RAM）|
|接收 FIFO|2 个 × 3 帧|2 个 × 最多 64 帧|
|过滤器|14 组|最多 128 个标准 + 64 个扩展|
|消息存储|外设内部寄存器|**专用的 Message RAM**|
|时间戳|可选|硬件自带|
|传输控制|简单|支持 Trigger Memory（定时触发发送）|

**最大的改变是 Message RAM**——FDCAN 不再把消息存在芯片外设的寄存器里，而是存在一块专用 RAM 里（H723 上有 **4KB FDCAN Message RAM**）。你需要自己分配这块 RAM 给"发送缓冲区"、"接收 FIFO"、"过滤器表"等，粒度更细。

这个设计的好处是**高度可定制**——你可以把 Message RAM 全部用于接收 FIFO（如果你主要是接收节点），或者主要用于发送（如果你是高速发送节点）。坏处是配置更复杂。

#### 硬件层面的兼容性

**答你问题 3**：TJA1050 能否继续用？

理论上**可以兼容**——TJA1050 只管"3.3V 数字信号 ↔ 差分信号"的转换，不关心速率。但 TJA1050 的手册上标称最高 **1 Mbps**，用在 CAN FD 高速数据段（2Mbps+）会**信号畸变**。

**推荐**：升级到 **TJA1044**、**TJA1051**、**MCP2562FD** 这些支持 CAN FD 速率的收发器。几块钱的事。

如果你只用 500kbps 的经典 CAN 速率（FDCAN 可以降级到 Classic CAN 兼容模式），TJA1050 够用。

---

### 停下来检查理解

**思考题 A**：假设你设计一个系统，主控 H723 + 5 个传感器节点（F103 + bxCAN）。H723 能用 FDCAN 和这些 bxCAN 节点通信吗？需要什么条件？

...

**答案**：能。前提是 **H723 配置成 "Classic CAN" 模式**（FDCAN 向下兼容）。但你会失去 FDCAN 的优势（最大 8 字节数据、最大 1Mbps）。

**如果将来把传感器升级为 H7 系列**，你能把系统升级到纯 FDCAN 模式——在**同一条 CAN 总线上**，只要所有节点都支持 FDCAN，就能享受 64 字节帧和高速数据段。**不用重新布线**，这是 FDCAN 最大的商业卖点。

---

### 实战：H723 上配置 FDCAN

现在我带你走配置流程。我会故意停在关键点让你思考。

#### Step 1：时钟源选择

**思考题 B**：FDCAN 的时钟源选什么？H723 上有多个选项：

- HSE（外部晶振）
- PLL1Q
- PLL2Q

你会选哪个？思考依据是什么？

（提示：CAN 的波特率是怎么生成的？要和其他节点精确同步，时钟源需要什么特性？）

...

**答案**：**选 PLL1Q 或 HSE**。

关键是**时钟要稳定、精确**。CAN 总线上多节点同步，要求各自时钟偏差不能太大（通常 ±0.5%）。

- HSE 是晶振（如 25MHz），精度很高（几十 ppm）——**好选择**
- PLL1Q 是 PLL 产生的，可以配成很高频率，精度取决于源 HSE——**也行**
- 不要选 HSI（内部 RC 振荡器），精度只有 ±1%，上 CAN 总线会出错

在 CubeMX 里会看到 "FDCAN Kernel Clock Source"，选 PLL1Q，然后设置 PLL1Q 的频率（比如 80MHz）。

#### Step 2：波特率配置

CAN FD 有**两段波特率**：

- **Nominal Bit Rate**（仲裁段）：标准 CAN 那段，传 ID
- **Data Bit Rate**（数据段）：CAN FD 专有，传数据

配置时要分别设置两段的 Prescaler / TSEG1 / TSEG2。

公式（和普通 CAN 一样）：

波特率=时钟源(Prescaler)×(1+TSEG1+TSEG2)波特率=(Prescaler)×(1+TSEG1+TSEG2)时钟源​

举例：时钟源 80MHz，想要仲裁段 500kbps，数据段 2Mbps

**仲裁段**：

500000=80000000Prescaler×(1+TSEG1+TSEG2)500000=Prescaler×(1+TSEG1+TSEG2)80000000​Prescaler×(1+TSEG1+TSEG2)=160Prescaler×(1+TSEG1+TSEG2)=160

一种拆法：Prescaler = 8，TSEG1 = 15，TSEG2 = 4 → 8 × 20 = 160 ✓

**数据段**：

2000000=80000000Prescaler×(1+TSEG1+TSEG2)2000000=Prescaler×(1+TSEG1+TSEG2)80000000​Prescaler×(1+TSEG1+TSEG2)=40Prescaler×(1+TSEG1+TSEG2)=40

一种拆法：Prescaler = 2，TSEG1 = 15，TSEG2 = 4 → 2 × 20 = 40 ✓

**采样点要一致**：仲裁段采样点 = (1+15)/20 = 80%，数据段也要 80%，匹配。

CubeMX 里有个计算器辅助，不用你硬算。但**理解原理后你能判断"为什么通信不上"**——通常就是两段波特率配错了。

#### Step 3：Message RAM 分配

这是 FDCAN 最特色也最容易出错的部分。

H723 的 FDCAN 共享一块 **4KB Message RAM**（地址 0x4000AC00）。这块 RAM 要分给：

- 标准 ID 过滤器表
- 扩展 ID 过滤器表
- 接收 FIFO0
- 接收 FIFO1
- 接收专用缓冲区
- 发送事件 FIFO
- 发送缓冲区

**默认 CubeMX 会帮你分配合理**，但你知道存在这个概念很重要。

举例：CubeMX 的默认配置可能是

```
标准过滤器：28 × 4字节    = 112 字节
扩展过滤器：8 × 8字节     = 64 字节
接收FIFO0:  3 × 72字节    = 216 字节（72 = 消息头 8 + 数据 64）
接收FIFO1:  3 × 72字节    = 216 字节
发送缓冲区：3 × 72字节    = 216 字节
...
```

注意 **72 字节**这个数字——这是 CAN FD 每个消息的最大存储需求（8 字节头 + 64 字节数据）。如果你只用经典 CAN（8 字节数据），也会占 72 字节（浪费，但简化了设计）。

#### Step 4：CubeMX 配置流程

完整步骤（假设时钟已经配置）：

1. 左侧 `Connectivity` → `FDCAN1`
2. `Activated` 勾选
3. **Mode** 选 `FD mode with BitRate Switching` （用 FD 模式 + 切换数据段速率）
    - 其他可选值：
        - `Classic mode`：兼容普通 CAN
        - `FD mode without BitRate Switching`：用 64 字节数据但不提速
        - `FD mode with BitRate Switching`：全功能 ← 选这个
4. **Parameter Settings**：
    - `Nominal Prescaler`: 8
    - `Nominal Time Seg1`: 15
    - `Nominal Time Seg2`: 4
    - `Data Prescaler`: 2
    - `Data Time Seg1`: 15
    - `Data Time Seg2`: 4
5. **Advanced Parameters**（保持默认即可）：
    - 自动重传、总线关闭恢复、过滤器模式等
6. **NVIC Settings**：勾选 `FDCAN1 interrupt 0`

#### Step 5：代码

初始化过滤器 + 启动：

c

```c
void FDCAN_Init_User(void)
{
    FDCAN_FilterTypeDef filter;

    /* 配置过滤器：接收所有标准ID */
    filter.IdType = FDCAN_STANDARD_ID;
    filter.FilterIndex = 0;
    filter.FilterType = FDCAN_FILTER_MASK;
    filter.FilterConfig = FDCAN_FILTER_TO_RXFIFO0;  // 匹配的进 FIFO0
    filter.FilterID1 = 0x000;     // ID
    filter.FilterID2 = 0x000;     // 掩码 0 = 全接收

    HAL_FDCAN_ConfigFilter(&hfdcan1, &filter);

    /* 配置全局过滤器：不匹配的也接收（可选）*/
    HAL_FDCAN_ConfigGlobalFilter(&hfdcan1,
        FDCAN_REJECT,       // 标准ID 拒绝（只收过滤器匹配的）
        FDCAN_REJECT,       // 扩展ID 拒绝
        FDCAN_REJECT_REMOTE_STD,
        FDCAN_REJECT_REMOTE_EXT);

    /* 启动 FDCAN */
    HAL_FDCAN_Start(&hfdcan1);

    /* 激活 FIFO0 接收通知 */
    HAL_FDCAN_ActivateNotification(&hfdcan1, FDCAN_IT_RX_FIFO0_NEW_MESSAGE, 0);
}
```

发送一帧：

c

```c
HAL_StatusTypeDef FDCAN_Send(uint32_t id, uint8_t *data, uint8_t len, uint8_t use_fd)
{
    FDCAN_TxHeaderTypeDef tx_header;

    tx_header.Identifier = id;
    tx_header.IdType = FDCAN_STANDARD_ID;
    tx_header.TxFrameType = FDCAN_DATA_FRAME;
    tx_header.DataLength = len_to_dlc(len);     // 见下
    tx_header.ErrorStateIndicator = FDCAN_ESI_ACTIVE;
    tx_header.BitRateSwitch = use_fd ? FDCAN_BRS_ON : FDCAN_BRS_OFF;
    tx_header.FDFormat = use_fd ? FDCAN_FD_CAN : FDCAN_CLASSIC_CAN;
    tx_header.TxEventFifoControl = FDCAN_NO_TX_EVENTS;
    tx_header.MessageMarker = 0;

    return HAL_FDCAN_AddMessageToTxFifoQ(&hfdcan1, &tx_header, data);
}
```

**注意 `DataLength`**——FDCAN 的数据长度编码不是直接写字节数，而是一个枚举：

c

```c
uint32_t len_to_dlc(uint8_t len) {
    if (len <= 8)  return FDCAN_DLC_BYTES_0 + len;  // 0~8 直接对应
    if (len <= 12) return FDCAN_DLC_BYTES_12;       // 12
    if (len <= 16) return FDCAN_DLC_BYTES_16;       // 16
    if (len <= 20) return FDCAN_DLC_BYTES_20;
    if (len <= 24) return FDCAN_DLC_BYTES_24;
    if (len <= 32) return FDCAN_DLC_BYTES_32;
    if (len <= 48) return FDCAN_DLC_BYTES_48;
    return FDCAN_DLC_BYTES_64;                      // 最大 64
}
```

为什么不能任意字节数？**CAN FD 协议规定数据长度是 0~8, 12, 16, 20, 24, 32, 48, 64**。不是连续的，是这几档。省 bit 表达长度。

接收回调：

c

```c
void HAL_FDCAN_RxFifo0Callback(FDCAN_HandleTypeDef *hfdcan, uint32_t RxFifo0ITs)
{
    if ((RxFifo0ITs & FDCAN_IT_RX_FIFO0_NEW_MESSAGE) != 0) {
        FDCAN_RxHeaderTypeDef rx_header;
        uint8_t rx_data[64];    // 注意：最多 64 字节！

        if (HAL_FDCAN_GetRxMessage(hfdcan, FDCAN_RX_FIFO0, &rx_header, rx_data) == HAL_OK) {
            uint8_t len = dlc_to_len(rx_header.DataLength);
            printf("RX ID=0x%03lX len=%u\r\n", rx_header.Identifier, len);
            /* 处理 rx_data */
        }
    }
}
```

---

### 停下来实战检查

**思考题 C**：如果你把上面这段 FDCAN 代码和第八课的 bxCAN 代码对比，会发现 API 风格**高度相似**。这说明什么？

...

**答案**：HAL 库的设计哲学一脉相承——**句柄模式 + 观察者回调**。你在 F103 上学过的 CAN 通信框架（订阅/发布、消息解析、状态机）**几乎可以不改地迁移到 H723 上**。

这就是我一直强调的：**HAL 库的抽象让你能跨芯片复用代码**。你当初学句柄模式时可能觉得"这有啥，传个结构体指针而已"，现在应该能体会它的价值——**你在 F103 上写的 CAN 订阅者架构，改几个 HAL API 名字就能在 H723 上跑**。

**思考题 D**：假设你要在 H723 上传一个 64 字节的"图像描述结构体"：

c

```c
typedef struct {
    uint32_t timestamp;
    uint16_t width;
    uint16_t height;
    uint8_t  format;
    /* ... 一共 64 字节 */
} ImageDescriptor;

ImageDescriptor desc;
```

用普通 CAN 要多少帧？用 CAN FD 要多少帧？传输时间分别多少？（假设普通 CAN 500kbps，FDCAN 仲裁段 500kbps，数据段 2Mbps）

...

**简化计算**：

**普通 CAN**：

- 每帧 8 字节数据，需要 8 帧
- 每帧约 110 bit 开销 + 64 bit 数据 = 174 bit
- 8 帧 × 174 bit = 1392 bit
- @ 500kbps = 2.78 ms

**CAN FD**：

- 1 帧就够
- 大约开销 40 bit (仲裁段) + 64 字节数据 × 8 / 2Mbps × 500kbps = ...
- 简化算：一帧总共约 250 μs

**结论**：**快十倍以上**，而且只需一帧，**原子性**保证（不会有"半个结构体"的情况）。

---

### 一个容易被忽略的细节：FDCAN 的时间同步

FDCAN 硬件自动给每帧加**时间戳**（16 位，通常配成 1μs 分辨率）。这意味着：

- 接收到的每一帧都知道"什么时候到的"
- 可以做**时间同步协议**（TSN，时间敏感网络）
- 给"精确控制"应用带来巨大便利

F103 的 bxCAN 要自己用定时器打时间戳，H723 的 FDCAN 硬件自动做。

**应用例子**：电机控制环。多个电机通过 FDCAN 同步，主控节点发"同步帧"，每个从节点根据帧的时间戳对齐本地时钟。这是工业机器人、无人机编队的核心技术。

---

### 对比总结

再看一遍 F103 bxCAN vs H723 FDCAN，你现在应该能一眼看出差异的本质：

||F103 bxCAN|H723 FDCAN|
|---|---|---|
|协议|经典 CAN（1991）|CAN + CAN FD（2015）|
|数据帧|8 字节|8 或 64 字节|
|速率|1 Mbps|1 Mbps（仲裁）+ 8 Mbps（数据）|
|消息存储|寄存器|Message RAM|
|API 思想|句柄模式 + 回调|句柄模式 + 回调（**相同**）|
|代码复用性|—|**F103 的代码可迁移**|

**最重要的结论**：**协议升级了，但软件架构思想没变**。你在 F103 上构建的"订阅/发布 CAN"、"消息 ID 规划"、"过滤器掩码设计"——全部适用于 FDCAN。

---

### 本课任务

#### 必做

1. **CubeMX 配置一个 FDCAN 工程**：仲裁 500kbps + 数据 2Mbps。把 Message RAM 分配看一遍，心中有数。
2. **实现 FDCAN 自环测试**：H723 的 FDCAN 支持 "External Loopback" 模式——不用外接收发器，内部自己回环。可以先用这个测试发送/接收逻辑，再接收发器做真实通信。
3. **发送 64 字节帧**：构造一个包含完整传感器数据结构的 64 字节消息，发送并打印接收结果。感受 CAN FD 的"一帧装一切"的爽快。

#### 进阶

**进阶 1**：如果你也用 F103 + bxCAN 做一块"从板"，让 H723（FDCAN）和 F103（bxCAN）**互通**。H723 配成 Classic 模式，波特率和 F103 一致。测试能否双向通信。这个实验能让你深刻理解"向下兼容"。

**进阶 2**：把你在第八课实现的"CAN 订阅/发布架构"**迁移**到 H723 的 FDCAN 上。只改 HAL API 名字，业务逻辑一行不动。**如果迁移顺利，说明你当初的架构设计是好的**。

#### 挑战

**挑战**：利用 FDCAN 的硬件时间戳，实现一个"事件记录器"——每收到一帧就记录 `(timestamp, id, data)` 到 Message RAM（或 AXI SRAM），串口导出时能看出各节点发送帧的精确时序。这是汽车 CAN 分析仪的基本功能。

---

### 停下来互动

做完任务或者有疑问，回复我这些：

**反馈 1**：你把 Message RAM 的概念理解了吗？能说出它和 F103 bxCAN 的"消息邮箱"的本质区别吗？

**反馈 2**：思考题 A、C、D 你的答案是什么？（特别是 D 的计算，能让你对带宽有直观感受）

**反馈 3**：你用 H723 做"从板"、F103 做"主板"的双板架构，是不是觉得它们的 CAN 部分代码**几乎一模一样**？如果是，这验证了"好的抽象能跨硬件复用"。

---

**后续外设学习选项**：

- **A. SDMMC + FatFS**：让 H723 读写 SD 卡上的文件，这是数据记录器、音频播放器的基础
- **B. QSPI**：外挂 Flash 变成"无限存储"，和 H723 的内存映射结合很酷
- **C. DMA2D + LCD**：图形加速，为以后接 TFT 屏+LVGL 做准备
- **D. 以太网 + LwIP**：连网，打开物联网的大门（复杂度高）
- **E. 定时器高级功能**：输入捕获、编码器接口、同步定时器，做精确测量和电机控制

我建议按 **A → B** 的顺序（SDMMC 相对独立好学，QSPI 和存储话题相关），但你来定。你也可以回到综合项目——把 H723 当从板跑之前设计的架构。

## H723 新外设深入：第二弹 —— SDMMC + FatFS

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
## H723 新外设深入：第三弹 —— QSPI 与内存映射模式

本课讲解 QSPI，并采用**基于已有知识推导**的方式。QSPI 本质上是 SPI 的扩展，可以从已掌握的 SPI 机制推导出许多特性。

---

### 先让你自己推理

在已经学习 SPI（第五课的 W25Q Flash）和 SDMMC 后，可先围绕 QSPI 思考以下问题：

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

### 假设此前已经推理完了

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

不同芯片封装的引脚不同，CubeMX 会提供可选引脚。

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

## H723 新外设深入：第四弹 —— DMA2D 与 LCD 图形系统

好，讲图形。不过在开始之前，我想先搞清楚一件事——**图形系统是 H723 最复杂的子系统之一**，涉及硬件外设、显示接口、图形库、内存规划多层知识。我不想直接扔一堆 API 给你，那样你会晕。

让我先建立一个合适的切入点。

---

### 先搞清楚你的位置

图形系统的学习路径大致是这样的一棵树：

```
                 LCD 图形系统
                      │
     ┌────────────────┼────────────────┐
     │                │                │
  显示接口          图形算法         应用层
     │                │                │
  ┌──┼──┐          ┌──┼──┐          ┌──┼──┐
  SPI FMC LTDC  软件 DMA2D GPU    LVGL TouchGFX 自绘
                              (H723有)
```

**每一层都是独立的知识块**。你可以：

- 走底层路径：裸机画像素 → 自己写画线算法 → 最后拼一个简陋 UI
- 走应用层路径：直接用 LVGL，底层细节不管
- 走中间路径：理解 DMA2D 如何加速图形操作

### 好，你想"看看嵌入式 GUI 是怎么回事"

你这个出发点很好——不是为了做产品，是为了**理解原理**。所以我不会一上来就让你装 LVGL、配置一堆 API。我想带你从底层思考：

> **一块 LCD 屏幕到底是怎么被"点亮"的？为什么要有 DMA2D 这种东西？LVGL 这类图形库到底在底下做什么？**

理解了这些，你再用任何图形库都会游刃有余——因为你知道"下面在发生什么"。

你说你手边有"LCD 接口"的屏——我理解是 RGB 接口的大屏（LTDC 驱动），对吗？不过先别急，第一步我们**完全不碰具体硬件**，先在脑子里建立图形系统的模型。

---

### 第一个问题：屏幕是什么？

我想用一个思想实验开头。假设你面前有一块最简单的 LCD 屏，分辨率 480×272（典型嵌入式屏尺寸）。

**问题 1**：这块屏上一共有多少个可以独立控制颜色的"点"？

算一下——480 × 272 = **130,560 个点**。每个点叫一个**像素（Pixel）**。

**问题 2**：假设每个像素可以显示 65536 种颜色（RGB565 格式，16 位）。那整块屏"当前显示什么"这个信息，需要多少字节的存储？

算一下——130560 × 2 字节 = **261120 字节 ≈ 255 KB**。

这个数字很重要。我希望你停下来想一想：

> **这 255KB 存在哪里？**

它不可能存在屏幕里——LCD 屏幕本身只是一个"显示装置"，没有存储能力（便宜的屏至少是这样）。那就只能存在 **MCU 这一侧**。

这块 255KB 的内存，就叫 **帧缓冲区（Framebuffer）**——**屏幕上每一个像素的颜色，都有一个字节（或两个字节）对应存放在这块内存里**。

```
帧缓冲区（在 MCU 的 RAM 里）           LCD 屏幕
──────────────────────────────         ─────────────
                                        480 × 272 像素
 uint16_t fb[272][480];                 每个像素显示一种颜色

 fb[0][0]   fb[0][1]   fb[0][2]  ...    (0,0)  (1,0)  (2,0)  ...
 fb[1][0]   fb[1][1]   fb[1][2]  ...    (0,1)  (1,1)  (2,1)  ...
   ...                                     ...
 fb[271][479]                           (479, 271)

         ↑                                     ↑
         └─────────  传输  ──────────────────┘
```

**你改一下 `fb[y][x]` 的值，屏幕上那个像素就变色**。就这么简单。

**问题 3**：现在关键问题——**帧缓冲区的内容怎么"跑到"屏幕上？**

这是最根本的问题。你来猜猜——你觉得数据是怎么从 MCU 的 RAM 传到 LCD 屏幕上的？

（提示：想想你见过的"数据搬运"机制——UART、SPI、I2C、DMA... 哪个能胜任？）

---

### 两种主流方案

LCD 和 MCU 之间的"数据传输方式"，主要分两大阵营：

#### 方案 A：屏自带控制器（带显存屏）

屏幕模组里集成了一个小芯片（叫 **显示驱动 IC**，比如 ST7789、ILI9341、SSD1351 等），这个芯片**自己带显存**。

```
MCU                       屏模组
───────────               ────────────────
SPI ───────→  控制器芯片 ──→  LCD 面板
              (自带 GRAM)
```

你通过 SPI/并行接口**发命令**给控制器："在 (10,20) 位置写颜色 0xF800"。控制器收到后自己去刷屏。

**特点**：

- **屏的每个像素更新后能自己保持**（有显存）
- MCU 不用持续发送画面，只发"改变的部分"
- 接口简单（SPI 几根线），但速度受限（SPI 顶天 50MHz）
- **适合小屏**（2 寸以内），大屏刷新太慢

#### 方案 B：RGB 接口屏（无显存屏）

屏幕只是一块"哑屏"——它没有存储能力。你必须**持续不断地**通过专用接口"扫描"整块屏。

```
MCU                       屏模组（纯面板）
─────────                 ──────────────
LTDC ─────→  RGB 并行信号 ──→  液晶像素
(60Hz 持续刷新)
```

MCU 里的 **LTDC（LCD-TFT Display Controller）** 外设每秒产生 60 次（或 30 次）完整画面，通过 16~24 根数据线 + 同步信号（HSYNC、VSYNC、PCLK、DE）**持续扫描**输出。

**特点**：

- 屏没有显存，MCU 必须持续供画（一秒 60 次）
- 接口线多（RGB565 需要 16 根数据线 + 4 根同步线）
- 速度快（能刷 1024×600 大屏）
- **MCU 必须有 LTDC 外设**（F103 没有，H723 有）

---

### 停下来让你思考

**问题 4**：你觉得这两种方案分别适合什么场景？为什么 H723 会专门有 **LTDC 外设**？F103 却没有？

...

**我的答案**：

- **方案 A（SPI 小屏）**：智能手表、小型仪器、仅显示数字/文字的设备——**屏小、更新不频繁**
- **方案 B（LTDC 大屏）**：家电面板、工业仪表、汽车仪表盘——**屏大、动画丰富、响应要求高**

**为什么 F103 不需要 LTDC**？因为 F103 只有 20KB RAM——**连 240×320 的帧缓冲都装不下**（240×320×2 = 150KB）。它只能驱动 SPI 小屏，而且必须通过命令方式操作对方的 GRAM，自己不维护帧缓冲。

**H723 有 564KB RAM**——才装得下 480×272 的帧缓冲（+ 留足余量给双缓冲、图形处理）。于是才需要 LTDC 这种"大屏外设"。

**结论**：**RAM 容量决定图形能力上限**。这是一个关键洞察。

---

### 第二部分：画一个像素，背后发生什么？

你说你手边有 LTDC 接口的屏。那我们就以 LTDC 方案为例。

假设你完成了 LTDC 的配置（CubeMX 会帮你做），屏幕此刻正在以 60Hz 频率不断扫描你的帧缓冲区。

你现在想做一件事——**把 (100, 50) 这个点变成红色**。

在你的代码里，就这一行：

c

```c
uint16_t *fb = (uint16_t*)0x24000000;   // 帧缓冲区在 AXI SRAM 里
fb[50 * 480 + 100] = 0xF800;            // RGB565 红色
```

**就这一行**。LTDC 硬件会在下一个扫描周期（1/60 秒内）把这个改变反映到屏幕上。你什么都不用做——**一次赋值，屏幕自动变**。

这就是 LTDC 的魔力：**它把"显示"这件事变成了"内存操作"**。整个 GUI 的底层哲学就是——

> **所有的"画图"都只是"修改帧缓冲区的内存"。你怎么画三角形？你改对应像素的颜色。你怎么画文字？你按字模改对应像素的颜色。LTDC 硬件自动把结果扫描到屏上。**

#### 停下来思考

**问题 5**：既然"修改内存 = 修改像素"，那画一条从 (0,0) 到 (100,100) 的直线，你会怎么做？写个伪代码。

...

你可能会写：

c

```c
for (int i = 0; i <= 100; i++) {
    fb[i * 480 + i] = 0xFFFF;   // 白色
}
```

对，就是这么直接。画线、画圆、画矩形，底层都是"**在帧缓冲区里按数学公式改像素**"。图形学算法（Bresenham 直线算法、中点圆算法等）讲的就是"怎么高效地决定改哪些像素"。

**GUI 看起来高大上，本质就是"改内存"**。

---

### 第三部分：DMA2D——为什么需要"图形加速"

现在来看为什么需要 DMA2D。

#### 场景：填充一个矩形

想象你要画一个 300×200 的矩形，全部填成蓝色。用 CPU 怎么做？

c

```c
for (int y = 0; y < 200; y++) {
    for (int x = 0; x < 300; x++) {
        fb[y * 480 + x] = 0x001F;   // 蓝色
    }
}
```

这要执行 **60000 次** 内存写入。CPU 一条赋值指令 + 地址计算，大约 5 个周期。60000 × 5 / 550,000,000 = **0.54 毫秒**。

看起来还行？现在想一下——如果你用 LVGL，每次刷新可能涉及 20 个这样的矩形填充、5 张图片拷贝、100 个文字绘制。**CPU 被图形操作占满了**。你的其他任务（通信、传感器、控制）怎么办？

更糟的是——图形操作**从 AXI SRAM 读数据、写 AXI SRAM**。CPU 做这事时占用总线，如果此时 DMA 也想用总线，就要抢。

#### DMA2D 的思想

**DMA2D = 二维 DMA（2D Memory Access）**。它是一个**专门处理图形数据搬运的 DMA**。

**普通 DMA**：一维数据搬运（从地址 A 到地址 B，连续 N 字节） **DMA2D**：**二维矩形**数据搬运（从矩形区域 A 到矩形区域 B）

它能做几件 CPU 做起来费力的事：

**① 矩形填充**（Register to Memory）

告诉 DMA2D："把这个区域 300×200 都填成 0x001F。" 它自己去写 60000 个像素，**CPU 完全不用管**。

**② 矩形拷贝**（Memory to Memory）

"把帧缓冲 A 的 (100,50)~(250,150) 这块，拷贝到帧缓冲 B 的 (0,0) 位置。" 这是"图层贴图"的核心。

**③ 颜色格式转换**（Memory to Memory with PFC）

"源是 RGB888 格式，目标是 RGB565。拷贝时自动转换。" 比如你的 PNG 图片是 32 位 RGBA，屏幕是 16 位 RGB565——DMA2D 一条命令搞定。

**④ α 混合**（Memory to Memory with Blending）

"把图层 A（半透明）叠加到图层 B 上。" 这是 GUI 里所有半透明效果的核心。

#### 为什么 DMA2D 比 CPU 快？

有几个关键原因：

**原因 1**：DMA2D 有专用硬件流水线，每个时钟周期处理一个像素，CPU 需要多个周期 **原因 2**：DMA2D 直接访问 AXI 总线，不经过 CPU，不占用指令执行周期 **原因 3**：颜色转换、α 混合这些操作，DMA2D 有**硬件电路**，CPU 要软件计算（每像素几十个周期） **原因 4**：**CPU 可以同时做别的事**——把图形搬运交给 DMA2D 后，CPU 可以继续处理按键、通信、动画逻辑

**典型加速倍数**：

|操作|CPU|DMA2D|加速|
|---|---|---|---|
|矩形填充 300×200|~0.5ms|~0.1ms|5x|
|RGB888 → RGB565 转换 100×100|~2ms|~0.05ms|40x|
|α 混合 2 张图 200×200|~10ms|~0.2ms|50x|

**对 GUI 流畅度的影响**：60fps 需要每帧 16.7ms 内完成所有绘制。用 CPU 可能一帧要 30ms（卡成 33fps），用 DMA2D 可能 5ms（流畅 60fps）。

---

### 停下来让你体会

**问题 6**：H723 有 DMA2D 这个"图形加速器"，F103 没有。你觉得这决定了它们能跑什么样的 GUI？

...

**简单说**：F103 能跑"**静态界面**"——打开就是那个样子，偶尔更新几个数字。H723 能跑"**动态界面**"——滑动列表、淡入淡出、流畅动画、半透明浮窗。

**这就是 DMA2D 的价值**——它不是"让 GUI 能跑"，而是"让 GUI **流畅**"。

---

### 第四部分：整个图形系统怎么协作

现在让我把所有东西串起来，给你一个**全景图**。

```
┌─────────────────────────────────────────────┐
│  你的应用代码                                │
│  lv_btn_create(), lv_label_set_text(), ...  │  ← LVGL API
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  LVGL 图形库（软件）                         │
│  - 维护 UI 对象树（按钮、标签、列表等）      │
│  - 响应事件（触摸、按键）                    │
│  - 决定"哪些像素需要重绘"                    │
└─────────────────────┬───────────────────────┘
                      │
                      ▼ 它最终只做一件事：
         ┌────────────────────────┐
         │ 把像素画到 Framebuffer │
         └────────┬───────────────┘
                  │
           ┌──────┴──────┐
           ▼             ▼
       软件绘制      DMA2D 加速
       (CPU 画)      (硬件画)
           │             │
           └──────┬──────┘
                  ▼
        ┌────────────────┐
        │  Framebuffer   │   ← AXI SRAM 或 SDRAM 里的一大块内存
        │  (130KB~1MB)   │
        └────────┬───────┘
                 │
                 ▼ LTDC 硬件自动扫描
        ┌────────────────┐
        │     LTDC       │   ← 每秒 60 次扫描 Framebuffer
        └────────┬───────┘
                 │ RGB 信号（24根线）
                 ▼
        ┌────────────────┐
        │   LCD 屏幕     │
        └────────────────┘
```

**关键概念**：**整个系统是"分层驱动"的**：

- **LVGL**：高级 API 层（用对象化概念描述界面）
- **Framebuffer**：核心抽象（一块代表屏幕的内存）
- **DMA2D**：加速器（快速修改 Framebuffer）
- **LTDC**：显示控制器（把 Framebuffer 变成屏幕信号）
- **LCD**：物理屏幕

**LVGL 不知道 LTDC 存在，LTDC 不知道 LVGL 存在**——它们通过 Framebuffer 这个共同的"协议"连接。

这是嵌入式系统里最漂亮的分层设计之一。**Framebuffer 是图形世界的"以太"**。

---

### 停下来验证理解

**问题 7**：基于这个分层，回答几个问题：

1. 如果我把 LTDC 换成一个 SPI 屏（走方案 A），**LVGL 代码要改吗**？
2. 如果我把 LVGL 换成 TouchGFX（另一个图形库），**LTDC 配置要改吗**？
3. 如果我完全不用 DMA2D，LVGL 能跑吗？会怎样？

...

**答案**：

1. LVGL 代码**不用改**。只需要改底层的"flush 函数"（告诉 LVGL"请把这块像素显示出去"）。SPI 屏的 flush 通过 SPI 命令发送，LTDC 屏的 flush 其实只是"切换 Framebuffer 指针"。
2. LTDC 配置**完全不变**。它只看 Framebuffer。
3. LVGL 能跑，**但慢**——所有图形操作由 CPU 完成。小界面没问题，复杂动画会明显卡。

**这就是"好架构的威力"**——每一层都能独立替换，不影响其他层。

---

### 双缓冲：为什么图形系统常常需要两块 Framebuffer

再给你一个重要概念。

想象现在屏幕正在显示一个界面。你的代码开始画下一帧——

c

```c
// 开始画新帧
fb[100] = red;       // 这时屏幕扫描到这里，显示出"错乱"的帧
fb[101] = red;
// ... 画了一半 ...
fb[50000] = blue;
// ... 继续画 ...
```

**问题**：LTDC 是**持续扫描**的——它不管你画没画完，该扫到的像素就扫出去。所以用户看到的画面是"**半新半旧**"，这叫**撕裂（Tearing）**或**闪烁（Flicker）**。

**解决方案：双缓冲（Double Buffering）**

用两块 Framebuffer：

- **前缓冲（Front Buffer）**：当前 LTDC 正在扫描的那块
- **后缓冲（Back Buffer）**：你正在画的那块

```
时间 T1：
 LTDC 扫描 → FB1 (完整的上一帧)
 你的代码写 → FB2 (正在画新帧)

时间 T2（你画完了）：
 切换指针：LTDC 现在扫 FB2
 你的代码接下来写 → FB1 (画下下帧)
```

**切换必须在"帧同步"时机**（LTDC 每帧扫描结束的瞬间），这样用户永远看到的是"完整的一帧"。LTDC 有个中断 `HAL_LTDC_LineEventCallback` 就是为这个设计的。

**代价**：内存占用翻倍。480×272 单 Framebuffer 255KB，双缓冲 510KB。H723 的 564KB RAM 只能勉强装下。

**思考题**：为什么你那块 H723VGT6 可能不够用双缓冲？如果屏幕更大（比如 800×480），该怎么办？

（提示：H723 的 AXI SRAM 只有 320KB；AXI SRAM 外还有些小块 SRAM；如果还不够——外挂 **SDRAM**，H723 有 FMC 外设可以接 32MB SDRAM）

---

### 第五部分：像素格式——你必须懂的底层

之前我一直说"像素"但没细讲格式。嵌入式常用的几种：

|格式|位数|每像素字节|说明|
|---|---|---|---|
|**RGB565**|16|2|R:5 G:6 B:5。最常用，省内存，色彩够|
|**RGB888**|24|3|R:8 G:8 B:8。完整色彩，不对齐|
|**ARGB8888**|32|4|加了 8 位 α 通道（透明度），最完整|
|**L8**|8|1|灰度图，或索引调色板|
|**A8**|8|1|只有 α 通道（用于字体的抗锯齿）|

**RGB565 是嵌入式主流**——内存省一半（对 H723 RAM 紧张很重要），色彩对 GUI 够用。

**一个 RGB565 像素的位布局**：

```
  bit 15  ............  bit 0
  ┌────────┬───────────┬────────┐
  │ R R R R R │ G G G G G G │ B B B B B │
  └──────────┴─────────────┴───────────┘
    5 位红     6 位绿         5 位蓝
```

**为什么绿色 6 位，红蓝只有 5 位**？因为人眼对绿色最敏感——多给绿色一位分辨率，视觉上更自然。

**几个常用颜色的 RGB565 值**，记一下：

c

```c
#define COLOR_BLACK   0x0000
#define COLOR_WHITE   0xFFFF
#define COLOR_RED     0xF800
#define COLOR_GREEN   0x07E0
#define COLOR_BLUE    0x001F
#define COLOR_YELLOW  0xFFE0   // 红 + 绿
#define COLOR_CYAN    0x07FF   // 绿 + 蓝
```

**手动构造 RGB565**：

c

```c
uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
    return ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
}
```

---

### 停下来做一个心智测试

先不看答案，通过以下快速测试检查理解程度：

**快问 1**：`uint16_t fb[480 * 272]` 和 `uint16_t fb[272][480]` 在内存布局上一样吗？

**快问 2**：像素 (x=100, y=50) 在 `fb[]` 里的下标是多少？（屏宽 480）

**快问 3**：你想"清屏为白色"，最快的方法是？

- (a) 两个 for 循环写 `fb[y*480+x] = 0xFFFF`
- (b) `memset(fb, 0xFF, 480*272*2)`
- (c) 用 DMA2D 的 Register-to-Memory 模式填充

**快问 4**：`memset(fb, 0xFF, ...)` 清屏成白色，但如果你想清成**红色（0xF800）**，能用 `memset` 吗？

**快问 5**：画一条水平线（y=100 行，x 从 0 到 479 全红），用 CPU 还是 DMA2D？为什么？

...

答案：

1. **一样**——二维数组在内存里就是线性铺开的，只是 `[y][x]` 是语法糖
2. **50 × 480 + 100 = 24100**
3. (c) 最快，(b) 次之，(a) 最慢
4. **不能**——memset 是按字节填充，`0xFF` 的字节填下来得到 `0xFFFF`（白色）。红色 `0xF800` 是两字节 `0xF8, 0x00` 交替，memset 做不到。这就是为什么需要 **DMA2D 的矩形填充**——它能按"像素"而不是"字节"填充。
5. **用 DMA2D**。虽然 480 个像素 CPU 也快，但这行涉及到"按 Framebuffer 行宽跨步"等概念，DMA2D 本来就是为这个而生。

**答对 4 题以上，说明已经具备基本的图形系统思维**。

---

### 本课任务

因为你只是想"看看嵌入式 GUI 是怎么回事"，我不会让你做很多硬件实验。**重点是理解框架**。

#### 必做（全部不用硬件，纯思考）

1. **自己画出**上面那张"应用代码 → LVGL → Framebuffer → LTDC → LCD"分层图。**不看我的**，用你自己的话标注每一层的职责。
2. **回答**：一个 800×480 的屏，用 RGB565 格式，双缓冲需要多少内存？H723 的 564KB 够吗？如果不够怎么办？
3. **算一下**：假设 LTDC 扫描频率 60Hz，每像素 2 字节，分辨率 480×272。LTDC 每秒要从内存读出多少字节？总线带宽够吗？（AXI 总线 275MHz × 32bit = 1.1GB/s）

#### 进阶（需要硬件，如果你想动手）

**进阶 1**：**"手动画屏"（不用任何图形库）**。把 LTDC 配起来，手动 `memset` 整块帧缓冲清屏，然后用 for 循环画几条线、一个矩形、一段文字（需要字模数据）。这会让你**真正理解"GUI 就是改内存"**。

**进阶 2**：**对比 CPU vs DMA2D**。同样是填充一个 200×200 的矩形，分别用 CPU（两层 for 循环）和 DMA2D（一行 API），用 DWT 周期计数器测耗时。你会看到 5~10 倍的差距。

**进阶 3**：**跑通 LVGL 的 Hello World**。STM32CubeIDE 有 TouchGFX Designer 的集成，或者可以直接用 LVGL v9。显示一个按钮 + 文字，点击改变颜色。**这是商业产品的起点**。

#### 挑战（如果你想更深）

**挑战**：写一个"极简的自制图形库"——包含 `draw_pixel`、`draw_line`、`draw_rect`、`fill_rect`、`draw_char`（字模）几个函数，不依赖 LVGL。用它画一个简陋的数据监控界面（数值 + 进度条）。

完成这个你就理解了"图形库的本质"——所有高级图形库（LVGL、TouchGFX、Qt）都是在这几个基础函数上叠加的抽象。

---

### 关键回顾

你应该带走的核心概念（不需要记 API，记这些）：

1. **屏幕 = 二维像素阵列**。像素有颜色格式（RGB565 等）。
2. **Framebuffer = 屏幕在内存里的映射**。改 Framebuffer = 改屏幕。
3. **LTDC = 硬件自动扫描 Framebuffer 到屏**。你只管改 Framebuffer，扫描是自动的。
4. **DMA2D = 图形专用 DMA**。矩形填充、拷贝、颜色转换、α 混合，硬件加速。
5. **图形库（LVGL）= 上层抽象**。所有"按钮"、"列表"最终都是改 Framebuffer。
6. **双缓冲解决撕裂**。内存翻倍，但画面完整。

**理解这六点，你就理解了嵌入式 GUI 的全部本质**。剩下的 API、配置、细节——用到再查就好。

---

### 一个延伸的反思

从 QSPI（外部代码/数据存储）→ LCD 图形系统，你能看到 H723 相比 F103 的**根本差异**了吗？

F103 时代：MCU 是"**单一控制器**"——读传感器、算算法、开关 IO H723 时代：MCU 是"**微型计算机**"——带显示、带存储、带通信、带加速器

H723 这种级别的芯片，**跑 LVGL 的界面 + SD 卡数据记录 + CAN 通信 + FreeRTOS** 是商业家电/工业仪器的主流配置。你现在的知识面已经覆盖了这整个栈。

---

### 下一步

本课后你可以选：

- **E. 定时器高级功能**（输入捕获、编码器、同步）——电机控制方向
- **F. ADC 高级功能**（16 位、差分、超高速采样）——信号处理方向
- **G. USB**（CDC、HID、MSC）——和电脑的丰富交互
- **继续 LCD**：如果你想更深入图形（LVGL 项目、字体系统、触摸），也可以继续

或者换个方向：

- 回到**综合项目**——H723 做主控 + 小 LCD 显示数据 + CAN 收 F103 的传感器数据，一个完整产品雏形

后续可根据需要选择其中一个方向继续学习。
