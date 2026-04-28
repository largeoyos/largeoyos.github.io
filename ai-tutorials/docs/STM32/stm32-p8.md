# 第八课：CAN 总线

好，我们进入 CAN。这一课和前面的外设有点不一样——**CAN 不是给 MCU 用的"接个传感器"协议，它是给整个系统用的"工业级通信总线"**。所以理解它之前，我想先让你建立一个对"**为什么 CAN 会存在**"的直觉。

---

### 开场：一场思想实验

想象你是 1980 年代的博世（Bosch）工程师，被丢进奔驰的办公室，任务是设计一辆新车的电子系统。这辆车里需要**互相通信**的模块有：

- 发动机控制单元（ECU）
- 防抱死刹车系统（ABS）
- 安全气囊控制器
- 仪表盘
- 空调系统
- 车门控制器（4 个，每门一个）
- 后视镜调节
- 座椅加热
- 灯光控制
- ……（实际 40+ 个模块）

这些模块要交换信息，比如：

- ABS 要实时告诉发动机"我正在制动，请降低扭矩"
- 发动机要告诉仪表盘"当前转速 3500 RPM"
- 安全气囊要监听所有碰撞传感器
- 仪表盘要显示所有的故障信息

**你会用什么通信方式？**

先别看我的分析，自己想 30 秒。结合你学过的 UART、I2C、SPI，你会怎么选？

---

#### 让我们逐个否决

**UART？** 点对点。40 个模块两两通信需要 40×39/2 = 780 对线。不可行。

**I2C？** 有地址机制还不错。但：

- 主从架构——谁是主？如果 ABS 和发动机都想主动发消息，轮谁发？
- 100kHz 太慢——车速数据 1000 次/秒都不够
- 短距离——汽车一头到另一头几米远，I2C 信号衰减得很厉害
- 抗干扰弱——汽车里全是电机、点火线圈、高压电，电磁噪声极强

**SPI？** CS 线多到爆炸，而且每个从设备都要连到同一个主——变成星形拓扑，根本没法在整车分布。

#### 需求列表

从这个分析里，我们能提炼出**汽车级通信的真实需求**：

1. **多设备共享一根线**（节省线束，汽车整车的电线重量惊人）
2. **没有"主"的概念**，任何节点都能主动发消息
3. **消息有优先级**——紧急消息（刹车、安全气囊）必须先发
4. **极强的抗干扰能力**——发动机点火时的电磁噪声堪比核弹
5. **错误检测 + 自动重发**——丢一帧可能就是事故
6. **实时性**——必须在毫秒级保证关键消息送达
7. **冗长距离**——整车几十米

CAN 就是为了解决这套需求，由博世公司在 1986 年发明的。直到今天，几乎所有汽车都在用 CAN（现在逐渐向 CAN FD 和以太网过渡，但 CAN 依然是主流）。

**除了汽车**，工业控制、医疗设备、船舶、甚至咖啡机里都有 CAN 的身影。

---

### 第一部分：CAN 的核心思想——"广播 + 仲裁"

在讲具体协议之前，我想让你思考三个问题。这三个问题的答案就是 CAN 的核心设计。

#### 思考 A：如果没有"主"，多个节点同时想发消息，怎么办？

想象一群人开会，没有主持人，大家都想发言。可能的解决方案：

- **方案 1**：大家一起喊——变成噪音，没人能听清
- **方案 2**：每个人分配一个时间段（TDMA 时分复用）——但紧急消息必须等到自己的时间段才能发
- **方案 3**：想发言的人举手，根据某种规则决定谁先说——接近真实的解法

**CAN 用的是方案 3 的变种**：每条消息自带一个**优先级**（ID 越小优先级越高），如果两个节点同时想发，**优先级高的获胜，优先级低的自动退让**。这个机制叫**仲裁（Arbitration）**。

#### 思考 B：仲裁过程中，怎么避免冲突把信号烧掉？

还记得 I2C 的上拉 + 开漏吗？同样的问题——如果两个设备同时用推挽驱动同一根线，一个输出高一个输出低，大电流会烧芯片。

CAN 用了一个叫**"显性/隐性"**的概念：

- **显性位（Dominant）**：逻辑 0，主动驱动总线
- **隐性位（Recessive）**：逻辑 1，不驱动总线（让它"默认"是 1）

规则是：**只要有一个节点发显性（0），整条总线就是显性（0）**。换句话说，**0 赢 1 输**。

想一想，这个规则为什么天然就能做仲裁？

...

...

因为当所有节点同时开始发送，大家都在同时发 ID 的高位。**如果两个节点发的位不同（一个 0 一个 1），发 1 的节点会发现"咦，总线上是 0，我的 1 被覆盖了"——它立即停止发送，自动让位给发 0 的节点**。

```
时间 →
节点A 想发 ID = 0x123 (二进制 00100100011):   0 0 1 0 0 1 0 0 0 1 1
节点B 想发 ID = 0x100 (二进制 00100000000):   0 0 1 0 0 0 0 0 0 0 0
                                              ↑ ↑ ↑ ↑ ↑ ↑
                                              一样 一样 ... 这里B发0,A发1
                                                             A输了,停发
总线实际:                                      0 0 1 0 0 0 ...  ← B的消息
```

B 的 ID 是 0x100，比 A 的 0x123 小，所以 B 赢——**ID 越小，优先级越高**。这正好对应"低数字 = 紧急"（刹车系统、安全气囊通常 ID 很小）。

#### 思考 C：长距离 + 强电磁干扰，怎么保证信号不被破坏？

这是 CAN 最漂亮的硬件设计——**差分信号**。

普通信号：一根线，电压对 GND。干扰叠加到信号上，接收端无法分辨"这是原始信号还是噪声"。

```
原始: ──┐    ┌───┐
        └────┘   └────
        
带干扰: ~┐~~~~┌~~~┐~
         └~~~~┘~~~└~~
         ← 形状还在但模糊了
```

**差分信号**：两根线（CAN_H 和 CAN_L），信号是两根线的**电压差**。发"0"时 CAN_H 高、CAN_L 低（差 ~2V）；发"1"时 CAN_H = CAN_L（差 0V）。

```
CAN_H: ──┐      ┌───
          │  隐  │
          └──────┘
CAN_L: ──┐      ┌───
          │  显  │
          └──────┘
差  值:     2V─→0V─→2V  ← 干净的数字波形
```

**关键洞察**：外部电磁干扰会同时影响两根线（共模干扰），**但它们的差值几乎不变**。接收端看的是差值，完美抵消了干扰。

这就是为什么 CAN 能在几十米长的汽车里、旁边就是点火线圈、电机的环境下稳定工作。

---

让我停下来问你几个问题，确保你跟上了：

**思考 1**：如果 CAN 总线上有 3 个节点同时想发 ID 分别是 0x123、0x100、0x200 的消息，谁会先成功发送？后面两个怎么办？

**思考 2**：你觉得 CAN 的两根线（CAN_H/CAN_L）能用开漏 + 上拉实现吗？为什么差分信号的电气结构更好？（提示：开漏是一根线对 GND，差分是两根线互相参考。）

**思考 3**：假设某个节点坏了，一直把总线拉到显性（0）。会发生什么？CAN 协议里有什么机制避免这种"故障节点"瘫痪整个网络？

先自己想一想，然后我继续讲。

---

### 第二部分：CAN 的物理层——你需要的硬件

这里有一个**关键要点**：**STM32 内部只有 CAN 控制器，没有 CAN 收发器（Transceiver）**。

```
        你的 STM32              收发器芯片        CAN 总线
        ──────────────          ──────────       ─────────
        CAN 控制器 (内部)  ──→ TJA1050    ──→   CAN_H ─┬─────→
         │   │                   │   │            CAN_L ─┴─────→
        CAN_TX CAN_RX           CAN_H CAN_L
        (PA12) (PA11)
```

**收发器芯片**的作用：

- 把 MCU 的 3.3V TTL 信号（CAN_TX/CAN_RX）转换成 CAN 总线的差分信号（CAN_H/CAN_L）
- 反向转换（收到差分信号，转成 TTL 给 MCU）
- 提供电气保护

**常用收发器**：TJA1050、SN65HVD230、MCP2551。淘宝一搜"CAN 模块"就能买到，几块钱一个。

#### 终端电阻

CAN 总线两端**必须各接一个 120Ω 电阻**（Termination Resistor）在 CAN_H 和 CAN_L 之间。

为什么？电磁波在传输线里跑到末端会反射，反射波和原始波叠加会导致信号畸变。120Ω 电阻吸收反射能量。这叫"阻抗匹配"。

很多 CAN 模块自带一个可切换的 120Ω 电阻（通过跳线选择），你只需要确保**总线上恰好有两个 120Ω**（一般在总线两端）。

#### 一个最简单的 CAN 实验台

**用两块 F103 + 两个 CAN 模块**（这是最便宜、最直观的方案）：

```
STM32 #1              CAN 模块 #1          CAN 模块 #2          STM32 #2
──────                ──────────          ──────────          ──────
PA12 (CAN_TX) ─────── TXD         CAN_H ───────── CAN_H         TXD ──── PA12
PA11 (CAN_RX) ─────── RXD         CAN_L ───────── CAN_L         RXD ──── PA11
3.3V ──────────────── VCC                                        VCC ──── 3.3V
GND ───────────────── GND ─────── GND ─────────── GND ─────────── GND ──── GND
                                  
                                  ↑                    ↑
                              120Ω电阻            120Ω电阻
                             （模块自带）         （模块自带）
```

两个 STM32 通过 CAN 总线通信，你可以让一块发数据，另一块接收。

---

### 第三部分：CAN 帧的结构

一次 CAN 通信传输一个"帧（Frame）"。最常用的是**标准数据帧**，结构大概是：

```
SOF | ID (11位) | RTR | IDE | r0 | DLC (4位) | 数据 (0~8 字节) | CRC | ACK | EOF
 ↑      ↑        ↑     ↑    ↑     ↑               ↑            ↑    ↑     ↑
起始  报文ID   远程  扩展  保留  数据长度         数据          CRC 应答  帧尾
      (优先级) 帧标志                                          校验
```

**作为应用程序员，你主要关心三个东西**：

1. **ID**（11 位，0x000 ~ 0x7FF）——消息的"身份证号"，同时决定优先级
2. **DLC**（Data Length Code，0 ~ 8）——这帧数据有多少字节
3. **数据**（0 ~ 8 字节）——实际内容

其他字段（CRC、ACK、EOF 等）**全部由硬件自动处理**，你不用管。

#### CAN 帧的一个重要特点

**CAN 的"消息"是很小的——最多 8 字节数据**。这听起来很少，但汽车里其实够用：

- "发动机转速：3500 RPM"：4 字节就够
- "车速：65 km/h"：2 字节
- "刹车踏板压下 30%"：1 字节
- "4 个车轮轮速"：8 字节刚好

CAN 的设计哲学是**"小而密"**——把大数据拆成很多小消息，每个都能独立路由、独立优先级。这和 UDP 网络包很像。

如果你非要传大数据（比如固件升级，几百 KB），协议上层（如 ISO-TP、CANopen SDO）会帮你把数据拆成一堆 8 字节的帧。

#### 扩展帧

11 位 ID 只能有 2048 个不同消息。汽车复杂了不够用，于是 CAN 2.0B 扩展了到 **29 位 ID**（5 亿多个 ID），叫"扩展帧"。我们先用标准帧。

---

### 第四部分：STM32 的 CAN 外设——bxCAN

F103C8T6 有一个 CAN 外设叫 **bxCAN**（basic extended CAN）。

它有几个关键概念你必须知道：

#### 1. 三个发送邮箱（Transmit Mailboxes）

bxCAN 有 3 个独立的"邮箱"。你把要发的帧写到任一空闲邮箱里，硬件会自动把它发到总线上。

为什么是 3 个？因为 CAN 支持**同时想发多条消息**——你可以一次填 3 个邮箱，硬件会按 ID 优先级自动排序发送。

#### 2. 两个 FIFO 接收队列

接收端有 2 个 FIFO（先进先出队列），每个能缓存 3 帧。硬件收到帧后自动放入 FIFO，等你的代码去读。

#### 3. 过滤器（Filter Bank）

**这个概念超级重要**。

想象 CAN 总线是一条广播电台——所有节点都能听到所有消息。但你的节点通常只关心少数几条消息。如果每条消息都给你的 MCU 中断一次，CPU 会被淹死。

**过滤器的作用**：在硬件层面过滤掉你不关心的消息。只有匹配过滤器的消息才进 FIFO 通知 CPU。

F103 有 **14 组过滤器**，每组可以配置成：

- **标识符列表模式（Identifier List Mode）**：精确匹配某几个 ID
- **标识符屏蔽模式（Mask Mode）**：匹配"这些位必须是 X，那些位随便"

我们先用最宽松的配置——**全部接收**，后面需要精细化再学过滤器。

---

### 第五部分：F103 CAN 的时序配置

CAN 的波特率需要你算，这是一个小坑，但算通了你会理解很多。

#### 波特率公式

CAN 的每一位时间（Bit Time）被分成几段：

```
1 bit time
├─────────────────────────────────────────┤
│ SYNC │   PROP + TS1   │       TS2      │
├──────┼────────────────┼─────────────────┤
  1 tq       x tq            y tq
```

- `tq`（time quantum，时间量子）：最小时间单位
- `SYNC`：固定 1 tq，用于同步
- `TS1`（时间段 1）：可配置（1~16 tq）
- `TS2`（时间段 2）：可配置（1~8 tq）
- 采样点在 TS1 结束时

**公式**：

波特率=APB1时钟(PSC+1)×(1+TS1+TS2)波特率=(PSC+1)×(1+TS1+TS2)APB1时钟​

F103 的 CAN 挂在 APB1 上，时钟是 **36 MHz**。

#### 一个具体例子：500 kbps（汽车常用）

我们想要 500 kbps：

500000=36000000(PSC+1)×(1+TS1+TS2)500000=(PSC+1)×(1+TS1+TS2)36000000​(PSC+1)×(1+TS1+TS2)=72(PSC+1)×(1+TS1+TS2)=72

一种拆法：PSC + 1 = 4，TS1 + TS2 + 1 = 18，比如 TS1 = 13，TS2 = 4。

**采样点位置** = (1 + TS1) / (1 + TS1 + TS2) = 14/18 ≈ 77.8%

汽车 CAN 的推荐采样点在 75%~87.5%，77.8% 正合适。

实际配置时，CubeMX 会有一个计算器帮你选参数，不用硬算。但理解这个公式后你能判断"为什么通信不通"——通常就是两边波特率不一致。

---

### 第六部分：CubeMX 配置 CAN

**注意：F103C8T6 的 CAN 和 USB 共用引脚资源**。如果你之前工程开了 USB，CAN 会冲突。我们的工程暂时不用 USB。

新建工程 `CAN_Test`：

1. 基础配置（HSE、SWD、72MHz、PC13 LED、USART1+printf）
2. 左侧 `Connectivity` → `CAN`：
    - `Activated`：勾选
3. 展开 `Parameter Settings`：
    - `Prescaler (for Time Quantum)`：**`4`**（对应 PSC = 3，但 CubeMX 写的是 PSC+1）
    - `Time Quanta in Bit Segment 1`：**`13 Times`**
    - `Time Quanta in Bit Segment 2`：**`4 Times`**
    - `ReSynchronization Jump Width`：`1 Time`
    - `Operating Mode`：`Normal`
    - `Automatic Bus-Off Management`：`Enable`
    - `Automatic Wake-Up Mode`：`Enable`
    - `Automatic Retransmission`：`Enable`
    - `Receive Fifo Locked Mode`：`Disable`
    - `Transmit Fifo Priority`：`Disable`
    - 下方 Bit Timings Parameters 会显示：**`500000 bits/s`** ✓
4. `NVIC Settings`：勾选 `CAN1 RX0 interrupt`（CAN 接收 FIFO0 中断）
5. 确认 PA11 和 PA12 变绿（分别是 `CAN_RX` 和 `CAN_TX`）
6. 生成代码

---

### 第七部分：写 CAN 通信代码

#### 初始化：配置过滤器 + 启动

c

```c
#include <string.h>

void CAN_Init_User(void)
{
    CAN_FilterTypeDef filter;
    
    /* 配置过滤器：全部接收（不过滤）*/
    filter.FilterBank = 0;                        // 用第 0 组过滤器
    filter.FilterMode = CAN_FILTERMODE_IDMASK;    // 屏蔽模式
    filter.FilterScale = CAN_FILTERSCALE_32BIT;   // 32 位宽
    filter.FilterIdHigh = 0x0000;                 // ID 不限制
    filter.FilterIdLow = 0x0000;
    filter.FilterMaskIdHigh = 0x0000;             // 掩码全 0 = 所有位都不比较 = 全接收
    filter.FilterMaskIdLow = 0x0000;
    filter.FilterFIFOAssignment = CAN_FILTER_FIFO0; // 用 FIFO 0
    filter.FilterActivation = ENABLE;
    filter.SlaveStartFilterBank = 14;
    
    HAL_CAN_ConfigFilter(&hcan, &filter);
    
    /* 启动 CAN */
    HAL_CAN_Start(&hcan);
    
    /* 激活 RX0 中断通知 */
    HAL_CAN_ActivateNotification(&hcan, CAN_IT_RX_FIFO0_MSG_PENDING);
}
```

#### 发送一帧

c

```c
HAL_StatusTypeDef CAN_Send(uint32_t id, uint8_t *data, uint8_t len)
{
    CAN_TxHeaderTypeDef tx_header;
    uint32_t tx_mailbox;
    
    tx_header.StdId = id;              // 标准 ID
    tx_header.ExtId = 0;
    tx_header.IDE = CAN_ID_STD;        // 标准帧
    tx_header.RTR = CAN_RTR_DATA;      // 数据帧（不是远程帧）
    tx_header.DLC = len;
    tx_header.TransmitGlobalTime = DISABLE;
    
    return HAL_CAN_AddTxMessage(&hcan, &tx_header, data, &tx_mailbox);
}
```

#### 接收回调

c

```c
/* 这是 HAL 库的 __weak 函数，我们重写 —— 又见观察者模式！*/
void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan)
{
    CAN_RxHeaderTypeDef rx_header;
    uint8_t rx_data[8];
    
    if (HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &rx_header, rx_data) == HAL_OK) {
        printf("RX ID=0x%03lX DLC=%lu Data=", rx_header.StdId, rx_header.DLC);
        for (uint8_t i = 0; i < rx_header.DLC; i++) {
            printf("%02X ", rx_data[i]);
        }
        printf("\r\n");
    }
}
```

#### 主循环

c

```c
int main(void)
{
    /* ... CubeMX 初始化 ... */
    CAN_Init_User();
    
    uint32_t counter = 0;
    
    while (1) {
        uint8_t data[4];
        data[0] = (counter >> 24) & 0xFF;
        data[1] = (counter >> 16) & 0xFF;
        data[2] = (counter >> 8) & 0xFF;
        data[3] = counter & 0xFF;
        
        if (CAN_Send(0x123, data, 4) == HAL_OK) {
            printf("TX ID=0x123 Count=%lu\r\n", counter);
        } else {
            printf("TX FAILED\r\n");
        }
        
        counter++;
        HAL_Delay(500);
    }
}
```

#### 烧录到两块板子验证

**两块板子用同一份代码**都可以跑——它们会互相发送，互相接收。效果：

```
板子 A 串口：
TX ID=0x123 Count=0
RX ID=0x123 DLC=4 Data=00 00 00 01     ← 来自板子 B
TX ID=0x123 Count=1
RX ID=0x123 DLC=4 Data=00 00 00 02     ← 来自板子 B
...

板子 B 串口：
TX ID=0x123 Count=0
RX ID=0x123 DLC=4 Data=00 00 00 01     ← 来自板子 A
TX ID=0x123 Count=1
RX ID=0x123 DLC=4 Data=00 00 00 02     ← 来自板子 A
...
```

**如果你只有一块板子**，可以用两个 USB-CAN 分析仪替代，或者先把板子一端接收发器做自环测试（CAN 支持回环模式）。

---

### 第八部分：过滤器的精细化

上面我们用了"全部接收"的过滤器。真实项目里你通常只想收特定 ID。

#### 列表模式：精确匹配

比如只想接收 ID = 0x100、0x200、0x300 的消息：

c

```c
filter.FilterMode = CAN_FILTERMODE_IDLIST;
filter.FilterScale = CAN_FILTERSCALE_16BIT;
filter.FilterIdHigh = 0x100 << 5;       // 标准 ID 需要左移 5 位
filter.FilterIdLow  = 0x200 << 5;
filter.FilterMaskIdHigh = 0x300 << 5;
filter.FilterMaskIdLow  = 0x000 << 5;   // 第 4 个位置留空
```

（为什么左移 5 位？因为寄存器布局里标准 ID 占高 11 位，下面还有 RTR/IDE 等位。）

#### 掩码模式：范围匹配

比如只想接收 ID 高 4 位是 `0x1XX` 的所有消息（即 0x100~0x1FF）：

c

```c
filter.FilterMode = CAN_FILTERMODE_IDMASK;
filter.FilterIdHigh = 0x100 << 5;
filter.FilterMaskIdHigh = 0x700 << 5;   // 高 4 位必须匹配（0x100 的 0b001），低 8 位随意
```

**掩码的含义**：对应位为 1 的位置必须匹配 ID，为 0 的位置随便。

掩码模式是汽车 CAN 协议栈里最常用的——通常把 ID 前几位作为"模块类型"，后几位作为"子消息",过滤器只关心前几位。

---

### 停下来思考

**思考 4**：CAN 的 ID 同时是"身份"和"优先级"。想象在一个汽车系统里，下面这些消息你会给它们分别分配什么范围的 ID？

- 刹车踏板状态
- 车窗升降
- 娱乐系统（收音机音量）
- ABS 状态

（提示：越紧急的越小 ID。）

**思考 5**：为什么 bxCAN 要有 3 个发送邮箱？想一个场景——如果 MCU 要同时发 3 条不同优先级的消息，只有 1 个邮箱会怎样？

**思考 6**（硬件题）：假设你有 10 个节点挂在同一条 CAN 总线上。终端电阻（120Ω）应该接几个？接在哪里？如果多接了一个会怎样？如果少接一个会怎样？

**思考 7**（协议题）：汽车场景——仪表盘想知道当前车速。有两种设计：

- **方案 A**：仪表盘主动发一个"请求车速"帧，发动机收到后回复
- **方案 B**：发动机每 100ms 自动广播一次车速帧，仪表盘（以及其他所有想知道的节点）被动接收

你觉得哪个方案更好？为什么？（这涉及 CAN 的一个核心设计哲学。）

---

### 第九部分：CAN 的应用层协议

CAN 的基础协议（CAN 2.0）只规定"怎么把 8 字节帧发出去"，**不规定消息的含义**。实际项目里需要应用层协议来定义"ID 0x123 的第 1 字节代表什么"。

几个常见的应用层协议：

**CANopen**：工业自动化最流行。定义了节点状态机（NMT）、过程数据对象（PDO，实时数据）、服务数据对象（SDO，配置数据）、对象字典（OD）等。

**J1939**：商用车（卡车、重型设备）的标准。用 29 位扩展 ID，定义了 PGN（参数组号）、SPN（可疑参数号）。

**OBD-II**：轿车的故障诊断协议。你车上那个 OBD 接口就是通过 CAN 跑的。

**UDS（ISO 14229）**：汽车诊断和刷写的标准协议，基于 ISO-TP。

作为入门，我们不需要实现这些协议栈——先搞清楚原始 CAN 帧的收发就够了。想做汽车方向的话，以后会深入 CANopen 或 UDS。

---

### 第十部分：深入一个设计——发布/订阅 CAN 数据总线

这里我带你看一个真实项目中的软件架构——**把 CAN 抽象成"发布/订阅系统"**。

#### 问题

假设你的项目有很多消息：

- 仪表要订阅车速、转速、油量
- 空调控制器要订阅车速、环境温度
- 诊断模块要订阅所有故障消息

如果每个模块都直接在 `HAL_CAN_RxFifo0MsgPendingCallback` 里加 `if-else` 判断，代码会变成这样：

c

```c
void HAL_CAN_RxFifo0MsgPendingCallback(...) {
    // 解析 ID
    switch (id) {
        case 0x100: /* 车速，通知仪表 */ Meter_OnSpeed(data); 
                    /* 通知空调 */ AC_OnSpeed(data); break;
        case 0x101: /* 转速，通知仪表 */ Meter_OnRPM(data); break;
        case 0x200: /* 温度，通知空调 */ AC_OnTemp(data); break;
        // ... 几百个 case
    }
}
```

这是**灾难性耦合**——CAN 接收函数知道所有模块。加一个新模块要改这个函数。

#### 发布/订阅架构

c

```c
typedef void (*CANMessageHandler)(uint32_t id, uint8_t *data, uint8_t len);

typedef struct {
    uint32_t id;           // 订阅哪个 ID
    uint32_t mask;         // 掩码（0 = 精确匹配，其他 = 范围匹配）
    CANMessageHandler fn;  // 回调
} CANSubscription;

#define MAX_CAN_SUBS 32
static CANSubscription subs[MAX_CAN_SUBS];
static uint8_t sub_count = 0;

void CAN_Subscribe(uint32_t id, uint32_t mask, CANMessageHandler fn) {
    if (sub_count < MAX_CAN_SUBS) {
        subs[sub_count].id = id;
        subs[sub_count].mask = mask;
        subs[sub_count].fn = fn;
        sub_count++;
    }
}

void HAL_CAN_RxFifo0MsgPendingCallback(CAN_HandleTypeDef *hcan) {
    CAN_RxHeaderTypeDef rx_header;
    uint8_t rx_data[8];
    
    if (HAL_CAN_GetRxMessage(hcan, CAN_RX_FIFO0, &rx_header, rx_data) != HAL_OK) return;
    
    /* 遍历订阅者，谁关心就通知谁 */
    for (uint8_t i = 0; i < sub_count; i++) {
        if ((rx_header.StdId & subs[i].mask) == (subs[i].id & subs[i].mask)) {
            subs[i].fn(rx_header.StdId, rx_data, rx_header.DLC);
        }
    }
}
```

#### 使用

c

```c
/* 仪表模块 */
void Meter_OnSpeed(uint32_t id, uint8_t *data, uint8_t len) {
    uint16_t speed = (data[0] << 8) | data[1];
    /* 更新仪表显示 */
}
void Meter_OnRPM(uint32_t id, uint8_t *data, uint8_t len) { /* ... */ }

/* 空调模块 */
void AC_OnSpeed(uint32_t id, uint8_t *data, uint8_t len) { /* ... */ }
void AC_OnTemp(uint32_t id, uint8_t *data, uint8_t len) { /* ... */ }

/* 初始化时各模块自己订阅 */
int main(void) {
    CAN_Init_User();
    
    /* 仪表订阅车速和转速 */
    CAN_Subscribe(0x100, 0x7FF, Meter_OnSpeed);   // 精确匹配
    CAN_Subscribe(0x101, 0x7FF, Meter_OnRPM);
    
    /* 空调订阅车速和温度 */
    CAN_Subscribe(0x100, 0x7FF, AC_OnSpeed);
    CAN_Subscribe(0x200, 0x7FF, AC_OnTemp);
    
    /* 诊断订阅所有 0x7XX 范围 */
    CAN_Subscribe(0x700, 0x700, Diag_OnFaultMsg);
    
    while (1) { /* ... */ }
}
```

**现在你看到什么了吗？** CAN 接收回调完全不知道具体业务，只负责"分发"。每个模块自己声明"我关心什么"，完全解耦。

这就是第六课讲过的**观察者模式在 CAN 上的再次应用**——同样的思想，不同的场景。

---

### 对比总结：你学过的三种总线

到现在你已经完整走过 I2C、SPI、CAN 三种总线，对比一下：

|特性|I2C|SPI|CAN|
|---|---|---|---|
|拓扑|多从一主|多从一主（CS 片选）|多主（无中心）|
|寻址|从设备地址|片选线|消息 ID|
|线数|2|3+（每从一个 CS）|2（差分）|
|速度|100k ~ 1M|10M ~ 100M|10k ~ 1M|
|距离|短（PCB）|短（PCB）|长（几十米）|
|抗干扰|一般|一般|极强（差分）|
|冲突处理|不会（主控）|不会（CS）|仲裁（ID 优先级）|
|典型应用|传感器、EEPROM|高速存储、屏幕|汽车、工业|

**设计哲学**：

- I2C = "**低速广播**" — 省线，允许小延迟
- SPI = "**高速点对点**" — 要性能，接受多线
- CAN = "**分布式实时**" — 多主协作，必须可靠

看懂这三者的差异，你对"通信协议设计"就有了全局直觉。

---

### 本课任务

#### 必做

1. **两板互发**：用两块 F103 + CAN 模块，互相发送计数器，串口打印收到的值。
2. **过滤器实验**：板 A 发 ID = 0x100, 0x200, 0x300 的三种消息，板 B 用过滤器只接收 0x200。

#### 进阶

**进阶 1**：仲裁实验。让板 A 每 100ms 发 ID=0x100 的消息，板 B 每 100ms 发 ID=0x200 的消息。**故意让时钟接近同步**（两块板子几乎同时上电），用示波器或逻辑分析仪看 CAN_H/CAN_L，观察仲裁过程。（没示波器也可以只通过"发送失败/成功的计数"间接观察。）

**进阶 2**：实现 CAN 的**发布/订阅架构**。写一个"传感器节点"（定时发温度、湿度、光强消息）和一个"显示节点"（订阅所有传感器消息并打印）。

#### 挑战

**挑战**：实现一个简易 **CANopen 风格的心跳机制**。每个节点（给自己分配一个 Node ID，如 0x01、0x02）：

- 每 1000ms 发送一个心跳帧（ID = 0x700 + Node ID，1 字节数据表示状态）
- 监听所有心跳帧，维护一张"活跃节点表"
- 如果某个节点超过 3 秒没发心跳，标记为"离线"并通过串口报告

这是工业协议栈的雏形，完成后你对"通信协议如何组织网络"会有深刻理解。

---

### 停下来：我想听你的反馈

你已经学完了 **GPIO / EXTI / UART / I2C / SPI / Timer / PWM / ADC / DMA / CAN** 这 10 个核心外设，以及 **句柄模式 / 状态机 / 观察者模式 / 流水线** 这 4 种核心设计思想。

这是嵌入式开发的一套**完整武器**。

接下来的几个方向，任你选：

**方向 B：RTOS（FreeRTOS）** — 从"单线程 + 中断"升级到"多任务并发"。这是商业项目的必备技能。

**方向 C：综合项目** — 把已学的全部用起来，做一个完整的小项目（比如"智能家居中控"、"数据记录仪"）。在项目里你会真正体会各种设计模式的价值。

**方向 D：更多设计模式** — 命令模式、工厂模式、依赖注入、单例模式，结合嵌入式场景深入讲。

**方向 E：迁移到 H723** — 开始玩你那块"怪兽级"芯片，体验 FDCAN、DMA 2D、Cache、双核（H723 单核但很多思想通用）。

做完任务后告诉我：

- 两块板子能 CAN 通信吗？遇到什么问题？
- 思考 1~7 你的答案是什么？特别是思考 6 和 7，它们考察设计直觉。
- 下一步你想走哪个方向？

**顺带一个深层思考题——你发现没有，每门新的通信协议（UART/I2C/SPI/CAN），我们都会用到句柄模式、状态机和观察者模式？** 这不是巧合。你现在应该能感受到，**设计模式是工具，不是知识点——它们在解决真实工程问题时反复出现，因为问题的本质是相同的**。

这种"**举一反三**"的能力，才是嵌入式工程师最核心的竞争力。👏