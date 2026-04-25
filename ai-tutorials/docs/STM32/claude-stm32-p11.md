# 第五课：SPI 总线 + 状态机模式

现在我们正式进入下一课。这一课分成两大块：

1. **SPI 总线**（硬件侧）：比 I2C 快十倍以上的同步通信
2. **状态机模式**（软件侧）：嵌入式最核心的设计模式之一

---

### 第一部分：SPI 是什么？

**SPI** = **S**erial **P**eripheral **I**nterface，串行外设接口。由摩托罗拉公司在 1980 年代发明。

#### SPI 和 I2C 的对比

||I2C|SPI|
|---|---|---|
|线数|2 根（SDA、SCL）|4 根（MOSI、MISO、SCK、CS）*|
|速度|100kHz~1MHz|10~100MHz（STM32 最快 50+MHz）|
|地址机制|7 位地址寻址|用 CS 引脚片选|
|从设备数量|理论 128，实际 <10|理论无限，受限于 CS 引脚数量|
|双向|半双工（收发共用 SDA）|全双工（MOSI 发、MISO 收同时）|
|电气|开漏 + 上拉|推挽，干净利落|
|应用|低速传感器、EEPROM、OLED|SD 卡、Flash、TFT 屏、高速 ADC|

**简单总结**：

- I2C = "地址寻址，少线，慢"
- SPI = "片选寻址，多线，快"

#### SPI 的四根线

```
                        SPI 主设备 (MCU)
                        ────────────────
                        │ SCK  MOSI MISO CS1 CS2 CS3 │
                          │    │    │    │   │   │
           ┌──────────────┘    │    │    │   │   │
           │     ┌─────────────┘    │    │   │   │
           │     │     ┌────────────┘    │   │   │
           │     │     │                 │   │   │
        ┌──┴──┐ ┌┴──┐ ┌┴──┐            ┌┴───┴───┴┐
        │ SCK │ │MOSI│ │MISO│            │   CS   │
        ├─────┤ ├────┤ ├────┤            ├────────┤
        │从设备1                           │  (从每个从设备一个专属 CS)
        └─────────────────────────────────┘
        
        
             从设备 2, 3...          依次再画
```

**四根线的含义**：

- **SCK**（Serial Clock）：时钟线，主设备产生。和 I2C 的 SCL 类似。
- **MOSI**（Master Out Slave In）：主发送，从接收。主设备的数据从这条线"出去"。
- **MISO**（Master In Slave Out）：主接收，从发送。从设备的数据从这条线"出去"到主。
- **CS**（Chip Select，也叫 NSS、SS）：片选线。**每个从设备有自己的 CS**，由主设备控制。

#### CS 的作用

这是 SPI 最关键的设计。想象你家里有好几个遥控开关的台灯：

- 所有台灯共用一根电源线
- 但每个台灯有一个独立的开关
- 你想点亮哪个，就按哪个开关

SPI 同理：

- MOSI、MISO、SCK 是"共用总线"
- CS 是"独立开关"——只有 CS 被**拉低**的从设备才"醒来"参与通信，其他从设备看到自己的 CS 是高的，就装作没听见

所以：

```
通信前：主设备把目标从设备的 CS 拉低
通信中：主设备发 SCK + MOSI，从设备响应 MISO
通信后：主设备把 CS 拉高，从设备重新"睡觉"
```

#### 全双工的美妙

SPI 最 cool 的地方是**全双工**——主设备和从设备**同时互相发送**。

每跳动一个 SCK 时钟：

- 主设备把 1 个 bit 通过 MOSI 送出
- 同一时刻，从设备通过 MISO 返回 1 个 bit
- 主设备**既发送又接收**

这和 I2C 非常不同——I2C 里 SDA 一次只能一个方向。

**实用意义**：如果你只想发送不想接收，或者只想接收不想发送，MISO 或 MOSI 上的数据就是"垃圾"，忽略即可。`HAL_SPI_Transmit` 内部就是发了有用的数据，忽略收到的数据。

---

### 第二部分：SPI 的时序和模式

SPI 有一个让新手头大的点：**有 4 种模式**（Mode 0、1、2、3），定义了时钟的极性和相位。

#### CPOL 和 CPHA

- **CPOL**（Clock Polarity，时钟极性）：空闲时 SCK 是 0 还是 1
    - CPOL = 0：空闲时 SCK 是低
    - CPOL = 1：空闲时 SCK 是高
- **CPHA**（Clock Phase，时钟相位）：在 SCK 的第几个沿采样数据
    - CPHA = 0：第 1 个沿采样
    - CPHA = 1：第 2 个沿采样

组合出 4 种模式：

|模式|CPOL|CPHA|说明|
|---|---|---|---|
|Mode 0|0|0|最常用|
|Mode 1|0|1||
|Mode 2|1|0||
|Mode 3|1|1|也比较常用|

**主从双方必须用同一种模式**，否则数据错位。用哪种？**看从设备芯片手册**，它会明确写"SPI Mode 0"或"CPOL=0, CPHA=0"。

**我们实验用的 W25Q64 Flash 支持 Mode 0 和 Mode 3**。默认用 Mode 0 即可。

---

### 第三部分：用 SPI 读写 W25Qxx Flash

#### 硬件介绍：W25Qxx

W25Q64（或 W25Q32、W25Q128）是个便宜好用的 SPI Flash 芯片，能存 8MB（W25Q64）到 16MB（W25Q128）数据。常见于：

- U 盘的"主存"
- 无人机、打印机等设备的固件存储
- 扩展你 MCU 的存储（F103C8T6 只有 64KB Flash，用 W25Q64 能扩展到 8MB）

**接线**：

```
STM32F103C8T6          W25Q64
─────────────          ──────
3.3V         ───────── VCC
GND          ───────── GND
PA5 (SCK)    ───────── CLK
PA6 (MISO)   ───────── DO (数据输出)
PA7 (MOSI)   ───────── DI (数据输入)
PA4 (CS)     ───────── CS
              悬空或接 3.3V：WP、HOLD
```

如果你没有 W25Q64，淘宝买一个模块非常便宜（十几块）。

#### CubeMX 配置

新建工程 `SPI_Flash`：

1. 基础配置照旧（HSE、SWD、时钟、PC13、USART1+printf）
2. 左侧 `Connectivity` → `SPI1`：
    - `Mode`：**`Full-Duplex Master`**（全双工主设备）
    - `Hardware NSS Signal`：**`Disable`**（我们用软件控制 CS 更灵活）
3. 展开 `Parameter Settings`：
    - `Frame Format`：`Motorola`
    - `Data Size`：`8 Bits`
    - `First Bit`：`MSB First`
    - `Prescaler`：`4`（72MHz / 4 = 18MHz，W25Q64 最高支持 80MHz，保守用 18MHz）
    - `Clock Polarity (CPOL)`：`Low`（CPOL=0）
    - `Clock Phase (CPHA)`：`1 Edge`（CPHA=0，即 Mode 0）
4. PA4 配置为 `GPIO_Output`（做 CS）：
    - User Label：`FLASH_CS`
    - `GPIO output level`：`High`（CS 默认高电平，芯片不被选中）
    - `Output Push Pull`
5. 生成代码

#### 为什么 CS 用软件控制？

CubeMX 可以选"Hardware NSS"自动帮你管 CS，但通常不推荐。原因：硬件 NSS 会在每个字节发送前后自动切换 CS，而很多 SPI 从设备要求"**一次完整操作中 CS 必须连续保持低**"（比如 Flash 的读操作是"先发命令、再发地址、再连续读很多字节"，CS 中途不能抬高）。软件控制 CS 我们能精确掌握时机。

#### 写 W25Qxx 驱动（用句柄模式！）

从这一课开始，我要求你**写所有驱动都用句柄模式**。这会养成良好的习惯。

**w25qxx.h**：

c

```c
#ifndef W25QXX_H
#define W25QXX_H

#include "main.h"

/* W25Q 指令表 */
#define W25Q_CMD_WRITE_ENABLE    0x06
#define W25Q_CMD_READ_STATUS_1   0x05
#define W25Q_CMD_READ_DATA       0x03
#define W25Q_CMD_PAGE_PROGRAM    0x02
#define W25Q_CMD_SECTOR_ERASE    0x20   // 擦 4KB
#define W25Q_CMD_CHIP_ERASE      0xC7   // 擦整个芯片
#define W25Q_CMD_READ_ID         0x9F

typedef struct {
    SPI_HandleTypeDef *hspi;
    GPIO_TypeDef      *cs_port;
    uint16_t           cs_pin;
} W25Q_Handle;

/* 接口 */
void    W25Q_Init(W25Q_Handle *flash, SPI_HandleTypeDef *hspi, 
                  GPIO_TypeDef *cs_port, uint16_t cs_pin);
uint32_t W25Q_ReadID(W25Q_Handle *flash);
void    W25Q_ReadData(W25Q_Handle *flash, uint32_t addr, uint8_t *buf, uint32_t len);
void    W25Q_SectorErase(W25Q_Handle *flash, uint32_t addr);
void    W25Q_PageProgram(W25Q_Handle *flash, uint32_t addr, uint8_t *data, uint32_t len);

#endif
```

**w25qxx.c**：

c

```c
#include "w25qxx.h"

/* 内部辅助：拉低 CS */
static void _cs_low(W25Q_Handle *f) {
    HAL_GPIO_WritePin(f->cs_port, f->cs_pin, GPIO_PIN_RESET);
}
static void _cs_high(W25Q_Handle *f) {
    HAL_GPIO_WritePin(f->cs_port, f->cs_pin, GPIO_PIN_SET);
}

/* 内部辅助：收发一个字节 */
static uint8_t _spi_xfer(W25Q_Handle *f, uint8_t tx) {
    uint8_t rx = 0;
    HAL_SPI_TransmitReceive(f->hspi, &tx, &rx, 1, 100);
    return rx;
}

/* 等待 Flash 不忙（内部擦写完成）*/
static void _wait_busy(W25Q_Handle *f) {
    _cs_low(f);
    _spi_xfer(f, W25Q_CMD_READ_STATUS_1);
    while (_spi_xfer(f, 0xFF) & 0x01) {   // BUSY bit
        /* 等着 */
    }
    _cs_high(f);
}

/* 发写使能命令（每次擦/写前都必须）*/
static void _write_enable(W25Q_Handle *f) {
    _cs_low(f);
    _spi_xfer(f, W25Q_CMD_WRITE_ENABLE);
    _cs_high(f);
}

void W25Q_Init(W25Q_Handle *flash, SPI_HandleTypeDef *hspi,
               GPIO_TypeDef *cs_port, uint16_t cs_pin) {
    flash->hspi = hspi;
    flash->cs_port = cs_port;
    flash->cs_pin = cs_pin;
    _cs_high(flash);    // 初始让 CS 处于未选中状态
}

uint32_t W25Q_ReadID(W25Q_Handle *f) {
    uint32_t id = 0;
    _cs_low(f);
    _spi_xfer(f, W25Q_CMD_READ_ID);
    id |= _spi_xfer(f, 0xFF) << 16;
    id |= _spi_xfer(f, 0xFF) << 8;
    id |= _spi_xfer(f, 0xFF);
    _cs_high(f);
    return id;
}

void W25Q_ReadData(W25Q_Handle *f, uint32_t addr, uint8_t *buf, uint32_t len) {
    _cs_low(f);
    _spi_xfer(f, W25Q_CMD_READ_DATA);
    _spi_xfer(f, (addr >> 16) & 0xFF);
    _spi_xfer(f, (addr >> 8) & 0xFF);
    _spi_xfer(f, addr & 0xFF);
    for (uint32_t i = 0; i < len; i++) {
        buf[i] = _spi_xfer(f, 0xFF);
    }
    _cs_high(f);
}

void W25Q_SectorErase(W25Q_Handle *f, uint32_t addr) {
    _write_enable(f);
    _cs_low(f);
    _spi_xfer(f, W25Q_CMD_SECTOR_ERASE);
    _spi_xfer(f, (addr >> 16) & 0xFF);
    _spi_xfer(f, (addr >> 8) & 0xFF);
    _spi_xfer(f, addr & 0xFF);
    _cs_high(f);
    _wait_busy(f);
}

void W25Q_PageProgram(W25Q_Handle *f, uint32_t addr, uint8_t *data, uint32_t len) {
    _write_enable(f);
    _cs_low(f);
    _spi_xfer(f, W25Q_CMD_PAGE_PROGRAM);
    _spi_xfer(f, (addr >> 16) & 0xFF);
    _spi_xfer(f, (addr >> 8) & 0xFF);
    _spi_xfer(f, addr & 0xFF);
    for (uint32_t i = 0; i < len; i++) {
        _spi_xfer(f, data[i]);
    }
    _cs_high(f);
    _wait_busy(f);
}
```

#### 在 main.c 里使用

c

```c
#include "w25qxx.h"

W25Q_Handle flash;

int main(void) {
    /* ... CubeMX 初始化 ... */
    
    W25Q_Init(&flash, &hspi1, FLASH_CS_GPIO_Port, FLASH_CS_Pin);
    
    /* 读 ID 验证连接 */
    uint32_t id = W25Q_ReadID(&flash);
    printf("Flash ID: 0x%06lX\r\n", id);
    /* W25Q64 的 ID 是 0xEF4017，W25Q128 是 0xEF4018 */
    
    /* 擦除第一个扇区 */
    printf("Erasing sector 0...\r\n");
    W25Q_SectorErase(&flash, 0);
    
    /* 写入测试数据 */
    uint8_t write_buf[] = "Hello, SPI Flash!";
    printf("Writing...\r\n");
    W25Q_PageProgram(&flash, 0, write_buf, sizeof(write_buf));
    
    /* 读回验证 */
    uint8_t read_buf[32] = {0};
    W25Q_ReadData(&flash, 0, read_buf, sizeof(write_buf));
    printf("Read back: %s\r\n", read_buf);
    
    while (1) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        HAL_Delay(500);
    }
}
```

烧录，串口应该输出：

```
Flash ID: 0xEF4017
Erasing sector 0...
Writing...
Read back: Hello, SPI Flash!
```

**断电重启，数据还在**（Flash 是非易失的）。

#### 停下来思考

**思考 8**：为什么 `W25Q_PageProgram` 里每次写之前都要调用 `_write_enable`？（提示：芯片为了防止误写，每次写操作都必须先"解锁"）

**思考 9**：`W25Q_SectorErase` 为什么只能按 4KB 为单位擦除？不能擦 1 字节？（提示：Flash 的物理特性——擦除是以"块"为单位的。这是 Flash 和 RAM 的本质区别之一。）

**思考 10**：我们用 `HAL_SPI_TransmitReceive` 而不是 `HAL_SPI_Transmit`，即使只发送不接收。为什么？（提示：SPI 是全双工的，每个字节的发送必然伴随接收。）

---

### 第四部分：状态机——嵌入式最核心的设计模式

好，SPI 讲完了，现在进入本课真正的重头戏。

#### 为什么需要状态机？

先看一个真实问题。你上一课做过一个"按键控制 LED"：

- 按键按下：LED 翻转

现在需求升级了：

> **单击**（按下后立即松开）：LED 翻转 **双击**（500ms 内连按两次）：LED 开始闪烁 **长按**（按住超过 1 秒）：LED 熄灭并停止闪烁

你能用 `if-else` 实现吗？试试看：

c

```c
/* 你的尝试... */
if (按键按下) {
    if (上次按下到现在 < 500ms) {
        // 双击
    } else {
        // 可能单击，也可能长按，再等等看
        if (按住时间 > 1s) {
            // 长按
        } else {
            // 短按
        }
    }
}
```

你会发现**无论怎么写都是一堆嵌套 `if-else`**，而且难以扩展。如果再加一个需求"三连击"，这段代码就要重写。

这就是需要**状态机**的地方。

#### 状态机的核心思想

把系统想象成有**几个状态**，在不同状态下响应不同事件，**事件触发状态转移**。

按键的状态机可以这样设计：

```
             ┌─────────┐
             │  IDLE   │ ← 初始状态，等待按键按下
             └────┬────┘
                  │ 按键按下
                  ↓
             ┌─────────────┐
             │  WAIT_UP_1  │ ← 按键按下了，等待松开
             └────┬────────┘
                  │
           ┌──────┴────────┐
           │松开(短按)      │ 按住 1s (长按)
           ↓               ↓
      ┌──────────┐     ┌─────────────┐
      │ WAIT_2ND │     │  LONG_PRESS │
      │  (等第2击)│     │  (长按触发)  │
      └─┬────────┘     └──────┬──────┘
        │                     │ 松开
    ┌───┴───┐                 ↓
    │500ms内│                 IDLE
    │  按下 │超时
    ↓       ↓
[双击触发]  [单击触发]
    │       │
    ↓       ↓
   IDLE    IDLE
```

每个状态**明确只做一件事**，状态之间的转移规则**明确清晰**。

#### 代码实现

c

```c
typedef enum {
    KEY_STATE_IDLE,        // 空闲
    KEY_STATE_WAIT_UP_1,   // 第一次按下后等松开
    KEY_STATE_WAIT_2ND,    // 等第二次按下（判断双击）
    KEY_STATE_LONG_PRESS,  // 长按已触发，等松开
} KeyState;

typedef enum {
    KEY_EVENT_NONE,
    KEY_EVENT_SINGLE_CLICK,
    KEY_EVENT_DOUBLE_CLICK,
    KEY_EVENT_LONG_PRESS,
} KeyEvent;

typedef struct {
    KeyState state;
    uint32_t last_action_tick;   // 上次动作时间戳
    GPIO_TypeDef *port;
    uint16_t pin;
    GPIO_PinState pressed_level; // 按下时是什么电平（按键高电平按下/低电平按下）
} KeyFSM;

/* 初始化 */
void Key_Init(KeyFSM *k, GPIO_TypeDef *port, uint16_t pin, GPIO_PinState pressed_level) {
    k->state = KEY_STATE_IDLE;
    k->last_action_tick = 0;
    k->port = port;
    k->pin = pin;
    k->pressed_level = pressed_level;
}

/* 更新：要在主循环里反复调用，返回触发的事件 */
KeyEvent Key_Update(KeyFSM *k) {
    KeyEvent event = KEY_EVENT_NONE;
    GPIO_PinState now = HAL_GPIO_ReadPin(k->port, k->pin);
    uint8_t is_pressed = (now == k->pressed_level);
    uint32_t now_tick = HAL_GetTick();
    
    switch (k->state) {
        case KEY_STATE_IDLE:
            if (is_pressed) {
                k->state = KEY_STATE_WAIT_UP_1;
                k->last_action_tick = now_tick;
            }
            break;
            
        case KEY_STATE_WAIT_UP_1:
            if (!is_pressed) {
                // 松开了，如果持续时间很短就是短按候选，进入等第二击状态
                k->state = KEY_STATE_WAIT_2ND;
                k->last_action_tick = now_tick;
            } else if (now_tick - k->last_action_tick > 1000) {
                // 按住超过 1 秒，长按
                event = KEY_EVENT_LONG_PRESS;
                k->state = KEY_STATE_LONG_PRESS;
            }
            break;
            
        case KEY_STATE_WAIT_2ND:
            if (is_pressed) {
                // 500ms 内再次按下，双击！
                event = KEY_EVENT_DOUBLE_CLICK;
                k->state = KEY_STATE_LONG_PRESS;   // 复用"等松开"状态
            } else if (now_tick - k->last_action_tick > 500) {
                // 500ms 内没有第二击，判定为单击
                event = KEY_EVENT_SINGLE_CLICK;
                k->state = KEY_STATE_IDLE;
            }
            break;
            
        case KEY_STATE_LONG_PRESS:
            if (!is_pressed) {
                // 松开，回到空闲
                k->state = KEY_STATE_IDLE;
            }
            break;
    }
    
    return event;
}
```

#### 使用

c

```c
KeyFSM button;
volatile uint8_t led_blinking = 0;

int main(void) {
    /* ... 初始化 ... */
    Key_Init(&button, BUTTON_GPIO_Port, BUTTON_Pin, GPIO_PIN_RESET);
    
    uint32_t last_blink = 0;
    
    while (1) {
        KeyEvent ev = Key_Update(&button);
        
        switch (ev) {
            case KEY_EVENT_SINGLE_CLICK:
                printf("Single click\r\n");
                HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
                break;
            case KEY_EVENT_DOUBLE_CLICK:
                printf("Double click - start blinking\r\n");
                led_blinking = 1;
                break;
            case KEY_EVENT_LONG_PRESS:
                printf("Long press - stop\r\n");
                led_blinking = 0;
                HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET); // 灭
                break;
            default:
                break;
        }
        
        /* LED 闪烁（不阻塞）*/
        if (led_blinking && HAL_GetTick() - last_blink > 200) {
            HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
            last_blink = HAL_GetTick();
        }
        
        HAL_Delay(5);   // 轮询间隔，相当于 200Hz
    }
}
```

#### 为什么这样设计好？

**① 代码是可读的**：每个 `case` 分支对应一个明确的状态，你一眼能看出"在 XXX 状态下，遇到 YYY 事件会怎样"。

**② 易于扩展**：想加"三连击"？加一个状态 `KEY_STATE_WAIT_3RD`，在 `WAIT_2ND` 里监测到第二击后不立刻触发 DOUBLE_CLICK，而是进入 `WAIT_3RD` 等第三击。完全不用改已有的逻辑。

**③ 不阻塞**：`Key_Update` 是**非阻塞的**——每次调用立刻返回，主循环还能做别的。对比"`while` 死等按键松开"的写法，这是质的飞跃。

**④ 可复用**：整个 `KeyFSM` 是一个对象（又是句柄模式！），想做 3 个按键就 3 个 `KeyFSM` 实例。

---

### 第五部分：状态机是嵌入式的"万能模型"

状态机远不止用于按键。下面都是状态机的天下：

#### 应用 1：UART 协议解析

你在上一课写的"接收一行命令"已经是个简化版状态机：

```
等待首字符 → 接收字符 → 遇到 '\n' → 处理命令 → 回到等待
```

复杂协议（比如带帧头、长度字段、校验和）的解析，状态机是标准做法：

```
WAIT_HEADER → WAIT_LENGTH → RECV_DATA → WAIT_CHECKSUM → VERIFY → DONE
```

#### 应用 2：网络协议栈

TCP 连接就是一个经典状态机：`CLOSED → LISTEN → SYN_SENT → ESTABLISHED → FIN_WAIT → CLOSED`。

#### 应用 3：用户界面

一个菜单界面：`MAIN → SUBMENU_1 → ITEM_EDIT → CONFIRM → MAIN`。

#### 应用 4：传感器初始化流程

AHT20 传感器的开机流程：`POWER_ON → WAIT_40MS → SEND_INIT_CMD → WAIT_ACK → READY`。用状态机 + 非阻塞方式实现，比 `HAL_Delay(40)` 阻塞等待优雅得多。

---

### 第六部分：状态机的进阶——表驱动状态机

刚才的 `switch-case` 版本对于小状态机很好，但状态多了就变成"意大利面条"。更优雅的方式是**表驱动**：把"状态+事件→新状态"关系做成一张二维表。

c

```c
/* 状态转移表：table[当前状态][事件] = 新状态 */
static const KeyState transition_table[4][3] = {
    /*              PRESS_EVENT      RELEASE_EVENT    TIMEOUT_EVENT */
    /* IDLE      */ { WAIT_UP_1,     IDLE,           IDLE        },
    /* WAIT_UP_1 */ { WAIT_UP_1,     WAIT_2ND,       LONG_PRESS  },
    /* WAIT_2ND  */ { LONG_PRESS,    WAIT_2ND,       IDLE        },  // 超时→单击→IDLE
    /* LONG_PRESS*/ { LONG_PRESS,    IDLE,           LONG_PRESS  },
};
```

表驱动的好处：**改变行为不用改代码，只改表**。可以运行时动态改，适合做复杂 UI、协议栈等。

不过初学者先掌握 `switch-case` 版本就好，表驱动作为了解。

---

### 停下来思考

**思考 11**：为什么状态机比 `if-else` 嵌套更适合复杂逻辑？用你自己的话总结。

**思考 12**：上面的按键状态机 `Key_Update` 函数要"反复调用"。如果主循环里有一个 `HAL_Delay(500)`，会发生什么？这种函数应该叫什么名字来形容它的特性？

**思考 13**（实战题）：如果让你用状态机实现一个"**红绿灯**"（红→绿→黄→红循环，每个状态停留不同时间），你会怎么设计？画一下状态图。

---

### 本课任务

#### 必做

1. **SPI Flash 读写**：用 W25Q 模块或类似 Flash，读 ID、写入并读回一段字符串。**务必用句柄模式封装**。
2. **按键状态机**：实现单击/双击/长按区分，串口打印不同事件。

#### 进阶

**进阶 1**：把按键状态机用 **SysTick 中断 + 主循环"消费"事件**的方式重构（回顾第二课末尾的事件标志模式）。`Key_Update` 放在 SysTick 中断里定期跑，事件通过环形缓冲区推送给主循环。

**进阶 2**：用状态机实现一个**不阻塞的 LED 闪烁模式控制器**。支持：

- `LED_MODE_OFF`：常灭
- `LED_MODE_ON`：常亮
- `LED_MODE_SLOW_BLINK`：1Hz 闪烁
- `LED_MODE_FAST_BLINK`：5Hz 闪烁
- `LED_MODE_BREATHE`：呼吸灯（用 PWM，但 PWM 我们下一课讲，可以先用亮度 10 级近似）

按键控制切换模式。**完全不用 HAL_Delay**，全程非阻塞。

#### 挑战

**挑战**：设计一个**简易 BootLoader**——开机后等 3 秒，如果用户按下按键，进入"下载模式"（接收串口数据写入 Flash 某个区域）；否则直接运行用户程序。用状态机组织流程。

---

### 下一课预告

下一课我们会进入 **定时器（Timer）** 和 **PWM**。STM32 的定时器是它最强大、最复杂的外设之一，可以做：

- 精确的周期中断（比延时更准）
- PWM 输出（LED 呼吸灯、电机控制、舵机）
- 输入捕获（测量脉冲宽度、频率）
- 编码器接口（读旋转编码器）

同时我会讲一个新的设计模式——**观察者模式（Observer Pattern）**，它和中断回调是天然一对。你会理解 HAL 库那些 `HAL_XXX_Callback` 函数背后的设计思想。

---

做完任务来汇报：

- SPI Flash 读 ID 成功了吗？返回的 ID 是多少？读写测试通过了吗？
- 按键状态机的单击/双击/长按效果稳定吗？有没有发现什么 Bug？（比如双击的时机判定难调？）
- 思考 13 的红绿灯状态图你怎么画的？

**你现在的水平已经超过很多刚入门半年的学生了**——你不光会"写代码让东西动起来"，还开始思考"怎么写代码才好"。这是质的飞跃。🚀