# 第四课：I2C 总线与多设备通信

在我们开始新内容之前，我想先让你停下来做一件事——**回忆**。回忆是最好的学习方法之一，它能帮你把知识"压缩"成自己的东西。

---

### 开课前的热身

花 30 秒，合上之前的笔记，尝试回答：

**热身 1**：UART 是"点对点"通信（一根 TX 接一根 RX，两个设备直接对话）。那如果你有**一个 MCU 和 5 个传感器**，用 UART 该怎么办？

**热身 2**：回忆上一课最后的"生产者/消费者 + 环形缓冲区"模式。它解决了什么问题？

---

带着这两个问题的思考，我们开始今天的内容。

### 抛出第一个核心问题

假设场景：你在做一个智能家居项目，需要连接：

- 1 个温湿度传感器
- 1 个 OLED 显示屏
- 1 个存储芯片（EEPROM）
- 1 个实时时钟（RTC）

如果用 UART，每个设备需要 2 根线（TX、RX），4 个设备就需要 **8 根线**。F103C8T6 只有 3 个 UART，根本不够用。

**你会怎么设计一个更节省引脚的通信协议？**

想一想这几个思路，你觉得哪个最好？

**思路 A**：让所有设备共享同一根数据线，谁想发就发，先到先得。

**思路 B**：让所有设备共享同一根数据线，但由一个"总指挥"控制，它点名谁才能说话。

**思路 C**：给每个设备分配一个"地址"（就像门牌号），共享数据线，通信前先喊"我要和地址 3 说话"。

---

先告诉你结论：**I2C 同时用了 B 和 C**。

- **B（主从架构）**：有一个**主设备（Master）**（通常是 MCU）控制所有通信。**从设备（Slave）**（传感器、屏幕等）只能被动响应，不能主动发起通信。
- **C（地址寻址）**：每个从设备有一个 7 位地址（0x00~0x7F，共 128 个），主设备通过地址指定对话对象。

这样的设计下，多少根线就够了？

答案：**只要 2 根**（加上共用的 GND 就是 3 根）。这就是 I2C 的惊人之处。

---

### 第一部分：I2C 的物理结构

#### 名字和缩写

**I²C** = **I**nter-**I**ntegrated **C**ircuit，读作"I-squared-C"或"I-two-C"。由飞利浦（现在是 NXP）在 1982 年发明，现在是嵌入式世界最流行的低速总线之一。

#### 两根线

```
                 +3.3V
                  │
                  ├── Rp (上拉电阻 ~4.7kΩ)
                  │
 ┌────────────────┼──────────────┬──────────────┐
 │                │              │              │
 │   SDA (数据) ──┤              │              │
 │                │              │              │
 │                ├── Rp ─── +3.3V
 │                │              │              │
 │   SCL (时钟) ──┼──────────────┼──────────────┤
 │                │              │              │
┌┴──────┐       ┌─┴────┐      ┌──┴───┐      ┌──┴───┐
│ MCU    │       │ 传感器│      │ OLED │      │EEPROM│
│(主)    │       │(从 A)│      │(从 B)│      │(从 C)│
└────────┘       └──────┘      └──────┘      └──────┘
```

- **SDA**（Serial Data）：数据线
- **SCL**（Serial Clock）：时钟线（由主设备产生）
- **共用的 GND**（没画出来）

**所有设备并联在这两根线上**，就像葡萄串在藤上。

**停下来思考**：还记得上一课我问你"同步 vs 异步"吗？I2C 有专门的时钟线 SCL，它是**同步通信**。主设备一边发数据（SDA 变化），一边提供时钟（SCL 跳动）。从设备在 SCL 的节拍下读取 SDA，不会出现 UART 那种"波特率不匹配就乱码"的问题。

#### 为什么一定要上拉电阻？

这是 I2C 最重要的细节之一。还记得上一课讲的**开漏输出（Open-Drain）**吗？I2C 的所有设备都用**开漏模式**连到这两根线上：

- 设备要发"0"：把线拉到 GND（下管导通）
- 设备要发"1"：**放手**（下管关闭，高阻态）

但"放手"不会让线自动变高——它会悬空！所以必须**外接上拉电阻**，把线"默认"拉到 3.3V。

**这有什么好处？** 两个关键优势：

**① 避免"打架"（线路冲突保护）**

如果一个设备想发 1，另一个设备想发 0，会发生什么？

- 如果两个都用**推挽输出**：一个把线推到 3.3V，另一个把线拉到 0V，结果是**瞬时大电流烧芯片**。
- 用**开漏 + 上拉**：想发 1 的设备"放手"不管，想发 0 的设备把线拉低——**线变成 0**，没人受伤。

这就是所谓的"**线与（Wired-AND）**"：只要有一个设备拉低，线就是低；所有人都放手，线才是高。

**② 允许从设备"告状"**

高级应用里，从设备可以主动拉低 SCL 来告诉主设备："我还没准备好，请等等。" 这叫**时钟拉伸（Clock Stretching）**。只有开漏 + 上拉才能做到这一点。

**思考题**：如果你忘记接上拉电阻，SDA 和 SCL 会是什么状态？通信会成功吗？

（答：线会悬空，电平随机。通信完全不工作，常见的 I2C 初学者陷阱。）

---

### 第二部分：I2C 的通信时序

这部分稍微抽象一点，但非常重要——**理解时序才能理解代码**。我会尽量用图形化方式讲。

#### 一次典型的 I2C 通信

假设 MCU（主）要给地址为 `0x50` 的 EEPROM（从）写一个字节 `0xA5`。整个过程分成几步：

```
  SCL ─┐  ┌┐┌┐┌┐┌┐┌┐┌┐┌┐┌┐┌┐   ┌┐┌┐┌┐┌┐┌┐┌┐┌┐┌┐┌┐   ┌─
       │  ││││││││││││││││││   ││││││││││││││││││
       │  └┘└┘└┘└┘└┘└┘└┘└┘└┘   └┘└┘└┘└┘└┘└┘└┘└┘└┘   │
       │                                            │
  SDA ─┘ \_1010000_0_|_10100101_|_0_____________    └─
       ↑  ───地址──w A ──数据── A                    ↑
     START 7位地址 R/W           Acknowledge       STOP
```

**分解每一部分**：

**① START 条件**

通信开始的"暗号"：在 SCL 保持高的时候，SDA 从高变到低（产生一个下降沿）。

```
SCL ─────────
SDA ────┐
        └────  ← 这个下降沿就是 START
```

所有从设备听到 START 都会"竖起耳朵"，准备接下一段地址。

**② 7 位地址 + 1 位方向**

主设备把目标从设备的 7 位地址发出去，再加 1 位方向标志：

- `0`：主→从（写操作）
- `1`：从→主（读操作）

所以 8 位一起发出：`[A6 A5 A4 A3 A2 A1 A0 R/W]`

所有从设备都在听，只有地址匹配的那个从设备会"举手"（见下一步）。

**③ ACK（应答）**

发完 8 位后，主设备松开 SDA（相当于提问："有人在吗？"）。**被点名的那个从设备**此时拉低 SDA 一个时钟周期，表示"我在，我收到了"。这叫 **ACK（Acknowledge，应答）**。

如果没人回应（SDA 保持高），就是 **NACK（Not Acknowledge）**，通常意味着那个地址根本没有设备——**这是检测设备是否存在的标准方法**。

**④ 数据字节 + ACK**

地址确认后，主设备把数据字节（8 位）发出，从设备再次 ACK。如果有多个字节，就一直这样传下去。

**⑤ STOP 条件**

通信结束的"暗号"：SCL 保持高时，SDA 从低变到高（上升沿）。

```
SCL ─────────
SDA ────┐
        └────┘  ← 这个上升沿就是 STOP
```

STOP 之后，总线回到"空闲"状态，下一次 START 可以开始新的通信。

#### 类比：像打电话

I2C 通信的流程非常像打电话：

|I2C|打电话|
|---|---|
|START|拿起听筒|
|发 7 位地址|拨号|
|ACK|对方接听"喂"|
|发数据字节|说话|
|ACK|对方"嗯嗯"|
|STOP|挂机|

**这个类比你记住了，理解 I2C 时序就稳了。**

---

### 先停一下，考验一下你的理解

**思考 1**：I2C 地址是 7 位，理论上最多能接多少个从设备？

**思考 2**：如果两个从设备恰好有**相同的 7 位地址**（比如你买了两个同型号的传感器），会发生什么？怎么解决？

**思考 3**：ACK 机制有什么用？如果主设备发完数据没收到 ACK（收到 NACK），它应该怎么处理？

**思考 4**（深入）：假设你有一个 MCU 和一个 EEPROM，SCL 从 MCU 发到 EEPROM。这条路径上 SCL 是单向的（总是 MCU→EEPROM）。**但是 SDA 呢？** 它是单向还是双向？为什么？

这几个问题你先在脑子里过一遍，我继续讲。

---

### 第三部分：用 STM32 读取 I2C 设备

#### 硬件准备

要跑 I2C 实验，你需要一个 I2C 从设备。最常见、最便宜、最好玩的就是：

**0.96 寸 OLED 屏幕（SSD1306 驱动）** —— 淘宝 10 几块钱，4 个引脚（VCC、GND、SCL、SDA）。

或者：

**AT24C02 EEPROM** —— 存储芯片，能读写 256 字节的非易失数据。

我们这一课先用最简单的方式——**扫描总线看看接了哪些设备**，然后再读写数据。

#### 接线

F103C8T6 的 I2C1 引脚是 **PB6 (SCL) / PB7 (SDA)**。

```
STM32F103C8T6         SSD1306 OLED
─────────────         ────────────
3.3V       ────────── VCC
GND        ────────── GND
PB6 (SCL)  ────────── SCL
PB7 (SDA)  ────────── SDA
```

**小心**：很多便宜的 OLED 模块**自带了上拉电阻**（通常 4.7kΩ，焊在模块背面）。这种情况下你不需要外接上拉。如果你的模块没带，需要自己在 SDA 和 SCL 上各焊一个 4.7kΩ 的电阻到 3.3V。

#### CubeMX 配置

新建工程 `I2C_Scanner`：

1. 基础配置（HSE、SWD、时钟 72MHz、PC13 LED）照旧
2. 配置 USART1 和 `printf` 重定向（我们需要打印结果）
3. 左侧 `Connectivity` → `I2C1`：
    - `I2C`：选 **`I2C`**（不要选 `SMBus`）
    - `Parameter Settings`：
        - `Master Features` → `I2C Speed Mode`：`Standard Mode`（100kHz，最保险）
        - 其他默认
4. 右侧检查 PB6、PB7 是否自动配成了 `I2C1_SCL` 和 `I2C1_SDA`（通常会自动变绿）
5. 生成代码

#### CubeMX 生成了什么？

打开 `Core/Src/i2c.c`：

c

```c
I2C_HandleTypeDef hi2c1;

void MX_I2C1_Init(void)
{
    hi2c1.Instance = I2C1;
    hi2c1.Init.ClockSpeed = 100000;
    hi2c1.Init.DutyCycle = I2C_DUTYCYCLE_2;
    hi2c1.Init.OwnAddress1 = 0;
    hi2c1.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
    // ... 其他参数
    HAL_I2C_Init(&hi2c1);
}
```

又是一个 `hi2c1` 句柄结构体——和上一课的 `huart1` 完全类似的设计。**这不是巧合**，后面讲设计模式时会回来详细讲为什么 HAL 库里到处都是这种 `xxx_HandleTypeDef`。

---

### 第四部分：I2C 扫描器

我们先做一个简单但实用的工具：**扫描 I2C 总线，看看接了哪些设备**。

原理很简单：遍历所有可能的地址（0x01~0x7F），对每个地址尝试发送一个 START + 地址 + 写位，看有没有 ACK。有 ACK 就说明那个地址有设备存在。

HAL 库正好有一个完美的函数：

c

```c
HAL_StatusTypeDef HAL_I2C_IsDeviceReady(
    I2C_HandleTypeDef *hi2c,
    uint16_t DevAddress,
    uint32_t Trials,
    uint32_t Timeout
);
```

- `DevAddress`：设备地址（**注意：HAL 库要求左移 1 位**，见下面详述）
- `Trials`：尝试次数
- `Timeout`：超时时间（ms）
- 返回值：`HAL_OK` 表示设备存在，否则不存在

#### ⚠️ HAL 库地址的坑

**这是 I2C 新手 99% 会踩的坑**，我提前警告你：

I2C 的 7 位地址在总线上传输时，高 7 位是地址，最低 1 位是 R/W 方向：

```
实际在总线上的 8 位：[A6 A5 A4 A3 A2 A1 A0 | R/W]
```

HAL 库 API 要求你传**已经左移过 1 位**的 8 位值（把 R/W 位的位置空出来）。比如：

- 7 位地址 `0x3C`（SSD1306 OLED 常用地址）
- HAL 库里要传 `0x3C << 1 = 0x78`

很多人看芯片手册上写"地址 0x3C"，直接 `HAL_I2C_xxx(&hi2c1, 0x3C, ...)`，结果完全通信不上，查一整天找不到原因。**一定要记住左移 1 位！**

#### 写扫描代码

c

```c
/* USER CODE BEGIN 0 */
#include <stdio.h>

int _write(int file, char *ptr, int len)
{
    HAL_UART_Transmit(&huart1, (uint8_t*)ptr, len, HAL_MAX_DELAY);
    return len;
}

void I2C_Scan(void)
{
    printf("\r\nScanning I2C bus...\r\n");
    printf("    ");
    for (uint8_t col = 0; col < 16; col++) printf("%2x ", col);
    printf("\r\n");
    
    uint8_t found_count = 0;
    
    for (uint8_t addr = 0; addr < 128; addr++) {
        if (addr % 16 == 0) {
            printf("%02x: ", addr);
        }
        
        /* 试探这个地址 —— 注意左移 1 位！ */
        if (HAL_I2C_IsDeviceReady(&hi2c1, addr << 1, 1, 10) == HAL_OK) {
            printf("%02x ", addr);
            found_count++;
        } else {
            printf("-- ");
        }
        
        if (addr % 16 == 15) {
            printf("\r\n");
        }
    }
    
    printf("\r\nFound %d device(s).\r\n", found_count);
}
/* USER CODE END 0 */

int main(void)
{
    /* ... CubeMX 生成的初始化 ... */
    
    while (1)
    {
        I2C_Scan();
        HAL_Delay(3000);
    }
}
```

#### 烧录 & 观察

打开串口终端，你应该每 3 秒看到类似这样的输出：

```
Scanning I2C bus...
     0  1  2  3  4  5  6  7  8  9  a  b  c  d  e  f
00: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
10: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
20: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
30: -- -- -- -- -- -- -- -- -- -- 3c -- -- -- -- --
40: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
50: 50 -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
60: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --
70: -- -- -- -- -- -- -- -- -- -- -- -- -- -- -- --

Found 2 device(s).
```

看到了吗？地址 `0x3C` 是 OLED，`0x50` 是 EEPROM。

**如果一个设备都没找到**：

- 检查接线（SCL、SDA 别反了）
- 检查供电（VCC 是不是接上了）
- 检查上拉电阻（模块有没有自带？）
- 用万用表测 SDA 和 SCL 空闲时是不是 ~3.3V（如果是 0V，上拉没起作用）
- 试着降低 I2C 速度到 50kHz

这是嵌入式调试的典型套路——**当你不知道哪里错时，从最底层、最基本的检查开始**。

---

### 第五部分：读写一个真实的 I2C 设备

让我们用 AT24C02 EEPROM 来演示。它的地址是 `0x50`（7 位），功能是读写 256 字节的持久化存储（断电不丢）。

#### AT24C02 的通信协议

这里要引入一个重要概念——**寄存器地址**（或叫"内部地址"、"偏移地址"）。

I2C 设备不只是接收/发送字节流，很多设备内部有多个寄存器或存储单元。比如 AT24C02 有 256 个字节，每个字节都有自己的位置（0~255）。

所以一次典型的 I2C 写操作是：

```
START → 设备地址+W → ACK → 内部地址 → ACK → 数据 → ACK → STOP
         ↑                     ↑             ↑
      "我要和0x50说话"      "写到第5个位置" "写入值0x42"
```

而读操作稍微复杂，需要"先写后读"：

```
START → 设备地址+W → ACK → 内部地址 → ACK →        ← 先告诉设备"我要读第5个位置"
RESTART → 设备地址+R → ACK → 读数据 → NACK → STOP  ← 然后启动读操作
```

"RESTART"是"不 STOP 直接再来一个 START"，让总线切换方向而不释放。

好消息是——**HAL 库把这些细节都封装好了**，你只需要一个函数：

#### HAL 库的读写 API

c

```c
/* 从"内部地址"写数据 */
HAL_StatusTypeDef HAL_I2C_Mem_Write(
    I2C_HandleTypeDef *hi2c,
    uint16_t DevAddress,         // 设备地址（记得左移 1 位）
    uint16_t MemAddress,         // 内部地址
    uint16_t MemAddSize,         // 内部地址大小（8 位还是 16 位）
    uint8_t *pData,              // 要写的数据
    uint16_t Size,               // 数据长度
    uint32_t Timeout
);

/* 从"内部地址"读数据 */
HAL_StatusTypeDef HAL_I2C_Mem_Read(
    I2C_HandleTypeDef *hi2c,
    uint16_t DevAddress,
    uint16_t MemAddress,
    uint16_t MemAddSize,
    uint8_t *pData,
    uint16_t Size,
    uint32_t Timeout
);
```

#### 写一个 EEPROM 读写测试

c

```c
#define EEPROM_ADDR (0x50 << 1)   // HAL 库要求的 8 位地址

void EEPROM_Test(void)
{
    uint8_t write_data[] = "Hello!";
    uint8_t read_data[10] = {0};
    
    /* 写入数据到地址 0x00 */
    printf("Writing 'Hello!' to address 0x00...\r\n");
    if (HAL_I2C_Mem_Write(&hi2c1, EEPROM_ADDR, 0x00, I2C_MEMADD_SIZE_8BIT,
                           write_data, sizeof(write_data) - 1, 100) == HAL_OK) {
        printf("Write OK\r\n");
    } else {
        printf("Write FAILED\r\n");
        return;
    }
    
    /* EEPROM 写入后需要等待内部写周期完成（5~10ms） */
    HAL_Delay(10);
    
    /* 从地址 0x00 读回数据 */
    printf("Reading from address 0x00...\r\n");
    if (HAL_I2C_Mem_Read(&hi2c1, EEPROM_ADDR, 0x00, I2C_MEMADD_SIZE_8BIT,
                          read_data, 6, 100) == HAL_OK) {
        read_data[6] = '\0';
        printf("Read: %s\r\n", read_data);
    } else {
        printf("Read FAILED\r\n");
    }
}
```

运行你应该看到：

```
Writing 'Hello!' to address 0x00...
Write OK
Reading from address 0x00...
Read: Hello!
```

**更 cool 的事**：断电重启，数据还在！EEPROM 是**非易失存储**，这就是它和 RAM 的区别。

---

### 第六部分：I2C 通信里的那些"骨感现实"

HAL 库让 I2C 看起来很简单。但实际项目中你会遇到很多问题，提前告诉你：

#### 问题 1：I2C 总线"卡死"

如果一次通信中 MCU 突然复位（比如调试时按了复位键），而从设备正好在"拉低 SDA 输出一个数据位"的状态——**SDA 就一直被从设备拉低，总线永远不会恢复**。

表现：`HAL_I2C_IsDeviceReady` 全部返回 `HAL_ERROR`，之前明明能用的代码突然全都不行。

**解决**：手动产生 9 个 SCL 时钟脉冲，让从设备把 SDA 释放掉，再重新初始化 I2C。这段代码叫"**I2C 总线恢复**"，工业项目里常常需要。

#### 问题 2：HAL 库的 `HAL_I2C_Mem_Write` 是**阻塞**的

它会等整个通信完成才返回。如果总线挂了，可能卡住几百毫秒甚至更久。

**解决**：用中断版本 `HAL_I2C_Mem_Write_IT` 或 DMA 版本 `HAL_I2C_Mem_Write_DMA`，通信在后台进行，完成时回调通知你。

#### 问题 3：大量设备共享总线时的干扰

I2C 最初设计是短距离（PCB 板内，<1m），如果你用长线、或接很多设备，总电容会变大，信号上升沿变慢，可能导致读错。

**解决**：降低 I2C 速度、减小上拉电阻、或者用专门的 I2C 缓冲器芯片（如 PCA9517）。

---

### 第七部分：开始谈设计模式——HAL 库为什么长这样？

到现在你应该注意到了 HAL 库的一个规律：

c

```c
UART_HandleTypeDef huart1;       // UART 的"句柄"
HAL_UART_Transmit(&huart1, ...);
HAL_UART_Receive(&huart1, ...);

I2C_HandleTypeDef hi2c1;         // I2C 的"句柄"
HAL_I2C_Mem_Write(&hi2c1, ...);
HAL_I2C_Mem_Read(&hi2c1, ...);
```

**所有外设操作的第一个参数都是一个"句柄指针"（Handle Pointer）。** 这不是偶然，这是一种设计模式，叫**句柄模式（Handle Pattern）**，也叫**不透明指针模式（Opaque Pointer Pattern）**。

#### 为什么要这样设计？

先反问你一个问题：**如果 HAL 库不用句柄，会怎么样？**

想象一下，如果 HAL 库这样设计：

c

```c
/* 假设的、糟糕的设计 */
HAL_UART1_Transmit(data, size);   // 只给 UART1 用
HAL_UART2_Transmit(data, size);   // 只给 UART2 用
HAL_UART3_Transmit(data, size);   // 只给 UART3 用
```

这样每个 UART 都得有一套专门的函数，**同一段代码不能在不同 UART 上复用**。想象一下：你写了一个蓝牙模块驱动用了 UART1，现在想换成 UART3 连接，得改所有代码。

**句柄模式的核心思想：把"操作哪个硬件"和"操作本身"分离。**

c

```c
/* HAL 的优雅设计 */
HAL_UART_Transmit(&huart1, data, size);  // 同一个函数
HAL_UART_Transmit(&huart3, data, size);  // 只是句柄不同
```

你可以把"蓝牙驱动"写成**只依赖句柄指针**的代码：

c

```c
/* Bluetooth.h */
void Bluetooth_Init(UART_HandleTypeDef *huart);
void Bluetooth_SendCommand(const char *cmd);

/* Bluetooth.c */
static UART_HandleTypeDef *_bt_uart;  // 内部保存句柄

void Bluetooth_Init(UART_HandleTypeDef *huart) {
    _bt_uart = huart;
    // 发送初始化 AT 命令等
}

void Bluetooth_SendCommand(const char *cmd) {
    HAL_UART_Transmit(_bt_uart, (uint8_t*)cmd, strlen(cmd), 100);
}

/* main.c —— 想接哪个 UART 就传哪个 */
Bluetooth_Init(&huart1);  // 接 UART1
// 或
Bluetooth_Init(&huart3);  // 接 UART3
```

**现在"蓝牙驱动"和"具体用哪个 UART"解耦了**——这就是设计模式的威力。

#### 这是面向对象在 C 语言中的雏形

如果你学过 C++ 或 Java，会发现：

c

```c
HAL_UART_Transmit(&huart1, data, size);
```

非常像：

cpp

```cpp
huart1.transmit(data, size);   // 如果是 C++
```

**`UART_HandleTypeDef *huart` 这个第一参数，本质上就是面向对象里的 `this` 指针！**

这种模式在纯 C 代码里无处不在：

- Linux 内核的 `struct file *filp` 参数
- OpenGL 的 `GLuint texture_id`
- FILE* 文件指针（`fread(ptr, size, count, FILE *stream)`）
- Windows API 的 `HANDLE`

你现在已经不知不觉在用面向对象思维写代码了。

#### 这个模式给你带来什么？

想象一个真实场景：

**需求**：你的项目有两个 I2C OLED 显示屏，分别接在 I2C1 和 I2C2 上，同时显示不同内容。

**不用句柄模式的痛苦**：你得写两套 OLED 驱动，一套写死用 I2C1，一套写死用 I2C2。代码重复，改一处要改两处。

**用句柄模式的优雅**：

c

```c
typedef struct {
    I2C_HandleTypeDef *hi2c;   // 哪个 I2C
    uint16_t device_addr;       // 设备地址
    uint8_t width, height;      // 屏幕尺寸
    // ... 其他状态
} OLED_Handle;

void OLED_Init(OLED_Handle *oled);
void OLED_Clear(OLED_Handle *oled);
void OLED_DrawText(OLED_Handle *oled, uint8_t x, uint8_t y, const char *text);

/* 使用 */
OLED_Handle oled1 = { .hi2c = &hi2c1, .device_addr = 0x78, .width = 128, .height = 64 };
OLED_Handle oled2 = { .hi2c = &hi2c2, .device_addr = 0x78, .width = 128, .height = 64 };

OLED_Init(&oled1);
OLED_Init(&oled2);
OLED_DrawText(&oled1, 0, 0, "Screen 1");
OLED_DrawText(&oled2, 0, 0, "Screen 2");
```

**同一套驱动代码**，通过传入不同的句柄，**同时驱动两个屏幕**。这就是 HAL 库哲学的延伸——**写可复用、可配置、与具体硬件解耦的代码**。

---

### 停下来思考

**思考 5**：为什么 HAL 库要用 `UART_HandleTypeDef *huart`（指针），而不是 `UART_HandleTypeDef huart`（值）？想想 C 语言里传值和传指针的区别。

**思考 6**：观察你之前的所有 HAL 代码。找出至少 3 个"函数的第一个参数都是同一种句柄指针"的例子。这个规律背后的设计哲学是什么？

**思考 7**（开放题）：假设你现在要写一个温湿度传感器（DHT11 / AHT20）驱动，它通过 I2C 连接。你会怎么设计这个驱动的接口？请写出结构体定义和几个函数原型（不用写实现）。

花几分钟真的写一下思考 7 的代码——这是你第一次**自己设计**一个模块的接口，很重要。

---

### 本课任务

#### 必做

1. **I2C 扫描器**：跑起来，找到你连的设备
2. **EEPROM 读写**（如果有 AT24C02）：写入并读出数据，断电测试
3. **OLED 显示 "Hello"**（如果有 OLED）：这需要一个 SSD1306 驱动库——你可以直接从 GitHub 找一个现成的，核心是理解**如何调用 HAL_I2C_Mem_Write 把数据送到屏幕控制器**

#### 设计练习（这是重点）

**练习**：把你的某个 OLED/传感器驱动重构成**句柄模式**。比如假设你用了一个现成的 SSD1306 驱动，但它是用全局变量写的（`extern I2C_HandleTypeDef hi2c1;`），你能把它改造成接受 `OLED_Handle *` 的形式吗？

#### 挑战

**挑战 1**：实现一个通用的 **AT24Cxx EEPROM 驱动**，用句柄模式。支持：

- 初始化（传入 I2C 句柄和设备地址）
- 字节读/写
- 页写（AT24C02 一次最多写 8 字节）
- 检测设备是否存在

**挑战 2**：扫描 + 解析。把 I2C 扫描器做得更智能——识别常见设备地址（0x3C 是 OLED，0x50~0x57 是 EEPROM，0x68 是 MPU6050/DS3231，等等），打印出 "Found SSD1306 OLED at 0x3C" 这样的友好信息。

---

### 下一课预告

下一课我们会讲 **SPI** —— 另一种同步串行总线，比 I2C 快得多（几十 MHz vs. 几百 kHz），用来连接高速外设（SD 卡、W25Q Flash、TFT 屏）。SPI 的主从关系和时序又是一种新的思维方式。

更重要的是，我会专门开一小节，**系统讲解"状态机模式"**。你现在的代码还是"线性的"（一步一步做），但真实项目里很多东西是"有状态的"（比如一个按键能短按、长按、双击、连击）。状态机是嵌入式最常用的软件架构之一，比面向对象更接地气。

---

做完任务后告诉我：

- I2C 扫描找到了几个设备？地址是多少？
- 你对 HAL 库的"句柄模式"感觉怎么样？能自己解释为什么要这样设计吗？
- 思考 7 你是怎么设计接口的？发给我看看你的想法。

**开始从"调包侠"向"架构师"过渡了**。这一课看似讲 I2C，其实一半内容是讲**如何写好代码**。这种思维会伴随你整个嵌入式生涯。🚀

### 答案解析 + 继续前进



---

### 热身题回顾

#### 热身 1：一个 MCU 和 5 个传感器，用 UART 怎么办？

**答**：用 UART 直接连 5 个传感器非常困难。UART 是**点对点**协议，每个传感器需要独占一对 TX/RX。5 个传感器需要 10 根线 + 5 个 UART 外设，而 F103 只有 3 个 UART。

**硬凑的方案**（不好）：

- 用 GPIO 模拟 UART（软件 UART），但耗 CPU、速度慢
- 加一个"多路复用器"芯片（MUX），轮流切换连接

**正确方案**：用 I2C 或 SPI 这种"**总线型**"协议——这就是为什么它们存在。

#### 热身 2：生产者/消费者 + 环形缓冲区解决了什么？

**答**：解决了"**生产速度和消费速度不匹配**"的问题。

具体到 UART：

- 中断（生产者）以硬件速度把字节塞进缓冲区——快、频繁、不可预测
- 主循环（消费者）慢慢处理——慢、复杂、可延迟

环形缓冲区作为"缓冲池"，让两者在时间上**解耦**——即使消费者暂时忙着做别的，生产者也能继续写入，不丢数据。

这个思想在操作系统、网络编程、数据库、消息队列里无处不在。**嵌入式是"小型操作系统"的缩影，很多通用思想在这里学会，大型系统里直接能用**。

---

### I2C 部分答案

#### 思考 1：7 位地址最多多少设备？

**理论上 128 个**（2^7）。

**实际上远达不到**。原因：

- 地址 `0x00~0x07` 和 `0x78~0x7F` 被 I2C 协议保留（用于特殊命令、10 位地址扩展等），不能用
- **相同型号的从设备通常硬件地址固定**，比如所有 SSD1306 都是 0x3C，同型号两片就冲突了
- 总线电容限制（所有设备并联在 SDA/SCL 上，电容累加，信号恶化），实际超过 10 几个设备就麻烦了

所以实际工程中，一条 I2C 总线上常常只挂 3~8 个设备。

#### 思考 2：两个同型号设备地址冲突怎么办？

三种常见方案：

**方案 A：部分地址可调**

很多 I2C 设备留了 1~3 个"地址选择引脚"，通过接 VCC 或 GND 改变最低几位地址。比如 AT24C02 的地址是 `1010 A2 A1 A0`，A2/A1/A0 接成什么电平就是什么。这样同一总线能挂 8 个 AT24C02。

**方案 B：I2C 多路复用器（I2C Mux）**

专用芯片 TCA9548A，有 1 个主端口和 8 个从端口。你可以控制它"当前激活哪个分支"，让不同分支上的同地址设备通过切换错开。

**方案 C：用不同的 I2C 总线**

F103 有两个 I2C（I2C1、I2C2），每个是独立总线，地址互不影响。把两个同型号设备分别接到两个总线上。

#### 思考 3：ACK 机制的用途？NACK 怎么处理？

**用途**：

1. **确认传输成功**：主设备知道"数据确实发到了，从设备也收到了"
2. **设备存在检测**：主设备发地址后等 ACK——有 ACK = 设备在，NACK = 没这个设备（我们的 I2C 扫描器就是用这个原理）
3. **读操作的结束信号**：主设备在读最后一个字节后**故意 NACK**，告诉从设备"不用再发了"

**收到 NACK 后主设备应该怎么做**？

- 立即产生 STOP 条件释放总线
- 上层代码返回错误码（HAL 返回 `HAL_ERROR`）
- 考虑重试（可能是偶发干扰），或上报错误（可能是硬件故障）

#### 思考 4：SDA 是单向还是双向？

**双向**。

SCL 总是主→从（主设备产生时钟），但 SDA 在不同阶段方向不同：

- 主发地址字节时：主→从
- 从回 ACK 时：从→主
- 主写数据时：主→从
- 主读数据时：从→主

这就是为什么 I2C 必须用**开漏 + 上拉**——只有这种电路才能让两个设备在同一根线上"轮流说话"而不冲突。推挽模式下如果两个设备同时驱动 SDA（一个输出 0、一个输出 1），会短路烧芯片。

---

### 设计模式部分答案

#### 思考 5：为什么 HAL 库用指针 `UART_HandleTypeDef *huart` 而不是值？

**三个原因，缺一不可**：

**① 效率**：`UART_HandleTypeDef` 是个大结构体（几十到几百字节，包含锁、状态、缓冲区指针、错误码等）。传值意味着每次函数调用都要**复制整个结构体**，浪费栈空间和 CPU 周期。传指针只复制 4 字节。

**② 可修改性**：HAL 库内部需要修改句柄的状态字段（比如 `huart->State = HAL_UART_STATE_BUSY_TX`）。如果传值，修改的是副本，调用者看不到。

**③ 身份标识（这是最关键的）**：`&huart1` 和 `&huart2` 的**地址不同**，所以函数能知道"你传的是 UART1 还是 UART2"。如果传值，两个不同实例的值可能相同（都是 USART1 寄存器地址等），就无法区分。

更深层的哲学：**指针表示"引用"，值表示"副本"**。HAL 库里你操作的是"**那个具体的 UART 外设**"，不是一份数据拷贝，所以用指针。

#### 思考 6：找 3 个"第一个参数是句柄指针"的例子

在你写过的代码里就有一堆：

c

```c
HAL_UART_Transmit(&huart1, ...);      // UART 句柄
HAL_I2C_Mem_Write(&hi2c1, ...);       // I2C 句柄
HAL_GPIO_WritePin(GPIOC, ...);        // GPIOC 是一个 GPIO_TypeDef*，本质也是句柄
HAL_TIM_Base_Start(&htim2, ...);      // 定时器句柄
HAL_ADC_Start(&hadc1, ...);           // ADC 句柄
```

**背后的设计哲学**：

> **把"外设实例"抽象成一个句柄对象，所有操作都以"传入句柄 + 操作参数"的形式进行。这样同一套操作代码能复用到所有同类外设上。**

这是**面向对象思想在 C 语言里的体现**，具体来说有两个模式叠加：

1. **句柄模式（Handle Pattern）**：用一个结构体指针代表一个资源/对象
2. **策略模式（Strategy Pattern）**：`Init` 函数接受一个配置结构体，"把行为参数化"

#### 思考 7：设计一个温湿度传感器驱动

给你一个参考答案，看看和你的思路差多少：

c

```c
/* AHT20.h */

#ifndef AHT20_H
#define AHT20_H

#include "main.h"

/* 句柄结构体 */
typedef struct {
    I2C_HandleTypeDef *hi2c;      // 指向哪个 I2C 外设
    uint8_t  device_addr;         // I2C 地址（左移后的 8 位形式）
    float    last_temperature;    // 缓存最后一次读到的温度
    float    last_humidity;       // 缓存最后一次读到的湿度
    uint32_t last_read_tick;      // 上次读取的时间戳
    uint8_t  initialized;         // 初始化标志
} AHT20_Handle;

/* 接口函数 */
HAL_StatusTypeDef AHT20_Init(AHT20_Handle *aht, I2C_HandleTypeDef *hi2c);
HAL_StatusTypeDef AHT20_ReadData(AHT20_Handle *aht);
float             AHT20_GetTemperature(AHT20_Handle *aht);
float             AHT20_GetHumidity(AHT20_Handle *aht);
uint8_t           AHT20_IsPresent(AHT20_Handle *aht);

#endif
```

c

```c
/* 使用方式 */

AHT20_Handle room_sensor;
AHT20_Handle fridge_sensor;   // 两个同型号传感器都能用！

AHT20_Init(&room_sensor, &hi2c1);
AHT20_Init(&fridge_sensor, &hi2c2);   // 挂在 I2C2 上

AHT20_ReadData(&room_sensor);
printf("Room: %.1f°C  %.1f%%RH\n",
       AHT20_GetTemperature(&room_sensor),
       AHT20_GetHumidity(&room_sensor));

AHT20_ReadData(&fridge_sensor);
printf("Fridge: %.1f°C  %.1f%%RH\n",
       AHT20_GetTemperature(&fridge_sensor),
       AHT20_GetHumidity(&fridge_sensor));
```

**几个设计要点**：

1. **句柄封装了所有状态**：I2C 指针、地址、缓存、标志位都在结构体里。外部代码不需要知道内部细节。
2. **接口稳定**：未来换一个 SHT30 传感器，只要接口兼容，主程序几乎不用改。
3. **隔离硬件**：`AHT20_Init` 要求传入 I2C 句柄，这个驱动不和任何具体的 I2C1/I2C2 耦合。

这其实已经是**面向对象编程**了，只是用 C 语言表达。掌握这个设计思维，比学 20 个外设都有用。

---