# H723 新外设深入：第一弹 —— FDCAN

好，我们一个一个讲。从 **FDCAN** 开始——因为你已经学过普通 CAN，迁移成本最低，能让你快速体验 H723 的外设差异。

但我不直接罗列 FDCAN 的 API。我想先问你几个问题，根据你的回答决定讲多深。

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

### 假设你已经想过了，我来讲关键答案

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

完整步骤（假设你已经设置好时钟）：

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

**下一讲外设选择**（你选）：

- **A. SDMMC + FatFS**：让 H723 读写 SD 卡上的文件，这是数据记录器、音频播放器的基础
- **B. QSPI**：外挂 Flash 变成"无限存储"，和 H723 的内存映射结合很酷
- **C. DMA2D + LCD**：图形加速，为以后接 TFT 屏+LVGL 做准备
- **D. 以太网 + LwIP**：连网，打开物联网的大门（复杂度高）
- **E. 定时器高级功能**：输入捕获、编码器接口、同步定时器，做精确测量和电机控制

我建议按 **A → B** 的顺序（SDMMC 相对独立好学，QSPI 和存储话题相关），但你来定。你也可以回到综合项目——把 H723 当从板跑之前设计的架构。

你选哪个？🚀