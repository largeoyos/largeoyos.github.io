## 第三课：UART 串口通信

上一课你学会了让 MCU "感知外部世界"（读按键），也理解了中断这个核心机制。这一课我们要解决一个更核心的问题：**让 MCU 和其他设备（尤其是电脑）对话**。

在我开始讲之前，我想先让你思考一下。

---

### 开场思考

想象你现在要从零设计一个协议，让你的 STM32 板子把一个字母 `'A'`（ASCII 码 65，二进制 `01000001`）发送给电脑。你只能用一根电线（加一根共用的 GND）。

**问题 1**：你会怎么"编码"这 8 个 bit？也就是说，你会怎么让电线上的电压变化来表示这 8 位数据？

先想一想。我猜你会说："高电平代表 1，低电平代表 0，按顺序发 8 次。" 对吗？比如：

```
时间 →
电压
3.3V     ┌┐        ┌┐
         ││        ││
0V    ───┘└────────┘└──
         0 1 0 0 0 0 0 1
```

（这里我画的是高位在前，`01000001`）

这个想法基本正确，但有个**致命问题**。

**问题 2**：接收端（电脑）怎么知道"什么时候开始读第一个 bit"？每个 bit 持续多久？如果发送端和接收端的"步调"对不上，会怎么样？

...

是的——**如果没有"时间基准"，接收端根本没法正确解析。** 比如你发送端每个 bit 持续 1ms，接收端却按 2ms 读，那它读到的数据全是错的。

解决这个问题有两大流派：

#### 流派 A：加一根"时钟线"（同步通信）

再加一根线，专门用来告诉对方"现在这个瞬间请读一个 bit"。典型代表：**SPI**、**I2C**。

```
数据线   ──┐ ┌─┐    ┌─┐ ┌──
          └─┘ └────┘ └─┘
时钟线   ┐ ┌┐ ┌┐ ┌┐ ┌┐ ┌
          └┘└┘└┘└┘└┘└┘└  ← 每个上升沿，接收端读一次数据
```

**好处**：不用预先约定速度，时钟线怎么快数据线就怎么快。 **坏处**：多一根线。

#### 流派 B：不加时钟线，但双方提前约定"波特率"（异步通信）

双方事先约定好"每秒传 9600 个 bit"（波特率 9600），每个 bit 持续约 104 微秒。发送时加一些"起始标记"帮助接收端对齐。典型代表：**UART**。

**好处**：只要两根线（发 + 收）甚至一根线就行。 **坏处**：双方必须波特率一致，否则乱码。

---

**UART 选择的是流派 B**。接下来我们就专门讲它。

---

### 第一部分：UART 是什么？

**UART** = **U**niversal **A**synchronous **R**eceiver/**T**ransmitter，通用异步收发器。

它是最古老、最简单、最常用的串行通信协议之一。你电脑的 USB 转串口线、Arduino 的串口监视器、模块化通信（蓝牙模块 HC-05、GPS 模块、ESP8266 等）底层都是 UART。

#### 接线

UART 通信只需要 3 根线：

```
  STM32                     电脑 (USB-TTL 转换器)
  ─────                     ────────────────────
  TX (发送) ───────────→  RX (接收)
  RX (接收) ←───────────  TX (发送)
  GND       ───────────    GND
```

**关键点**：**TX 接对方的 RX，RX 接对方的 TX**，就像两个人对话，你的"嘴"对着对方的"耳朵"。新手经常接反（TX 接 TX）然后发现不通信，别犯这个错。

GND 必须共地，因为"3.3V 高电平"是相对于 GND 的。如果两边的 GND 不是同一个参考点，电压就无从谈起。

#### 数据帧格式

UART 发一个字节（比如 'A' = 0x41 = `01000001`）时，实际在线上的波形是这样的：

```
空闲   起始    D0 D1 D2 D3 D4 D5 D6 D7    停止    空闲
 1      0     1  0  0  0  0  0  1  0      1      1
         ↑                                  ↑
      下降沿                           回到高电平
      标志开始                         标志结束

波形：
───┐      ┌───┐           ┌──────────────────
   │      │   │           │
   └──────┘   └───────────┘
  起始    数据位           停止
```

**拆解几个要素**：

1. **空闲状态**：线上保持高电平（逻辑 1）。这就像电话没人说话时的静音。
2. **起始位**：先来一个低电平（0），持续 1 个 bit 时间。这个**下降沿**告诉接收端"数据来了，准备接收"。
3. **数据位**：通常 8 个（有时 7 或 9）。**低位先发**（LSB first），这是 UART 的约定。
4. **可选的校验位**：用来检测错误（我们通常不用，配置为 None）。
5. **停止位**：回到高电平，持续 1 个（或 2 个）bit 时间，表示这帧结束，给接收端喘息的时间。

#### 波特率（Baud Rate）

**波特率 = 每秒传输的 bit 数**（严格说不完全等价，但 UART 里就这样理解）。

常见波特率：9600、19200、38400、57600、115200、921600。

**115200** 是目前最常用的"快速档"，每个 bit 持续约 8.68 微秒。一个完整帧（起始 1 + 数据 8 + 停止 1 = 10 bit）约 86.8 微秒，理论上每秒能传 11520 字节。

**双方必须波特率一致**，否则乱码。如果你用 115200 发，对方用 9600 读，数据完全对不上。

---

### 第二部分：STM32 上的 UART 硬件

F103C8T6 有 3 个 UART 外设：

- **USART1**：PA9 (TX) / PA10 (RX)
- **USART2**：PA2 (TX) / PA3 (RX)
- **USART3**：PB10 (TX) / PB11 (RX)

（`USART` 比 `UART` 多一个 `S`，代表同步，STM32 的 USART 可以配成同步模式——但我们暂不使用这功能，当普通 UART 用即可。）

**我们用 USART1，PA9 做 TX，PA10 做 RX。**

#### 你需要的硬件

一个 **USB 转 TTL 模块**（也叫"USB 串口线"，淘宝几块钱一个，常见芯片是 CH340、CP2102、FT232）。它一端插电脑 USB，另一端有 4 个引脚：VCC、GND、TX、RX。

接线：

```
USB-TTL 模块              STM32F103C8T6
────────────              ─────────────
TX      ───────────→     PA10 (RX)
RX      ←───────────     PA9  (TX)
GND     ───────────      GND
VCC (3.3V)    不接       ← 板子自己供电，别接
```

⚠️ **特别注意**：如果你的 USB-TTL 模块上有电压切换跳线，一定选 **3.3V**，不要 5V！F103 的引脚接 5V 会烧芯片。

电脑上需要一个**串口终端软件**来收发数据：

- **Windows**：推荐 MobaXterm、PuTTY、SSCOM、XCOM
- **macOS / Linux**：`screen`、`minicom`、`CoolTerm`
- **VSCode 插件**：Serial Monitor

---

### 第三部分：用 HAL 库发送第一条消息

#### CubeMX 配置

新建工程 `UART_Hello`，按上一课的基础设置（HSE 外部晶振、SWD 调试、时钟树 72MHz）完成后，增加：

1. 左侧 `Connectivity` → `USART1`：
    - `Mode`：选 **`Asynchronous`**（异步模式，就是普通 UART）
    - 展开 `Parameter Settings`：
        - `Baud Rate`：**115200**
        - `Word Length`：`8 Bits (including Parity)`
        - `Parity`：`None`
        - `Stop Bits`：`1`
        - `Data Direction`：`Receive and Transmit`
    - PA9、PA10 会自动变绿，表示被 USART1 占用
2. PC13 保持 GPIO 输出（LED），方便调试
3. 生成代码

#### 生成的代码里多了什么？

打开 `Core/Src/usart.c`，你会看到：

c

```c
UART_HandleTypeDef huart1;

void MX_USART1_UART_Init(void)
{
    huart1.Instance = USART1;
    huart1.Init.BaudRate = 115200;
    huart1.Init.WordLength = UART_WORDLENGTH_8B;
    huart1.Init.StopBits = UART_STOPBITS_1;
    huart1.Init.Parity = UART_PARITY_NONE;
    huart1.Init.Mode = UART_MODE_TX_RX;
    huart1.Init.HwFlowCtl = UART_HWCONTROL_NONE;
    huart1.Init.OverSampling = UART_OVERSAMPLING_16;
    if (HAL_UART_Init(&huart1) != HAL_OK) {
        Error_Handler();
    }
}
```

关键是这个 `huart1`——它是一个 `UART_HandleTypeDef` 结构体变量，**是你和 UART1 交互的"句柄"**。后面所有 UART 操作都需要传入它的地址 `&huart1`。

#### 发送一串字符

在 `main.c` 的 `while(1)` 里：

c

```c
while (1)
{
    char msg[] = "Hello STM32!\r\n";
    HAL_UART_Transmit(&huart1, (uint8_t*)msg, sizeof(msg) - 1, HAL_MAX_DELAY);
    HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
    HAL_Delay(1000);
}
```

#### 解读 `HAL_UART_Transmit`

c

```c
HAL_StatusTypeDef HAL_UART_Transmit(
    UART_HandleTypeDef *huart,  // 哪个 UART 句柄
    uint8_t *pData,              // 要发送的数据起始地址
    uint16_t Size,               // 要发送多少字节
    uint32_t Timeout             // 超时时间（毫秒）
);
```

几个细节：

- **`(uint8_t*)msg`**：`msg` 是 `char` 数组，需要强转成 `uint8_t*`。因为 HAL 把数据看成"字节流"，不管是字母、数字还是二进制数据都是字节。
- **`sizeof(msg) - 1`**：字符串末尾自动有个 `'\0'`（空字符），我们不想发它，所以减 1。
- **`HAL_MAX_DELAY`**：表示"永远等待直到发送完"（通常就 1ms 内的事）。
- **`"\r\n"`**：换行。Windows 串口工具通常需要 `\r\n`（回车+换行）才能正确换行，单独 `\n` 可能整行挤在一起。

#### 烧录 & 观察

1. 烧进板子
2. 电脑打开串口终端，选对端口（USB-TTL 对应的 COMx），波特率设 115200
3. 你应该每秒看到一行 `Hello STM32!`

**恭喜，你的板子第一次和电脑说话了！** 🎉

---

### 第四部分：让 `printf` 工作（超实用）

直接用 `HAL_UART_Transmit` 发字符串很死板——不能格式化、不能直接发数字。如果能用 `printf("x = %d\n", x)` 那就太爽了。

#### `printf` 的原理

C 标准库的 `printf` 最终调用一个叫 `fputc`（或 `_write`）的底层函数输出字符。在 PC 上，`fputc` 默认把字符送到"标准输出"（屏幕）。在 STM32 上没有屏幕，所以 `fputc` 默认不做任何事。

**我们可以重写 `fputc`，让它把字符发到 UART。** 这叫**重定向（Redirect）**。

在 `main.c` 里加（放在文件开头的 `#include` 之后）：

c

```c
/* USER CODE BEGIN Includes */
#include <stdio.h>
/* USER CODE END Includes */

/* USER CODE BEGIN 0 */
int fputc(int ch, FILE *f)
{
    HAL_UART_Transmit(&huart1, (uint8_t*)&ch, 1, HAL_MAX_DELAY);
    return ch;
}
/* USER CODE END 0 */
```

#### CLion 工程还需要改一下

纯粹的 ARM GCC 不链接浮点 `printf` 的支持，需要在 `CMakeLists.txt` 里加几行。找到链接选项部分，添加：

cmake

```cmake
target_link_options(${PROJECT_NAME}.elf PRIVATE
    -Wl,--print-memory-usage
    -Wl,-Map=${PROJECT_BINARY_DIR}/${PROJECT_NAME}.map
    -u _printf_float         # ← 加这行，支持 %f 浮点打印
)
```

另外 `syscalls.c` 文件（CubeMX 生成的）里可能已经有一些桩函数，需要注意不要重定义。如果编译报 `multiple definition of fputc`，你可以把我们的 `fputc` 改成 `_write` 函数：

c

```c
int _write(int file, char *ptr, int len)
{
    HAL_UART_Transmit(&huart1, (uint8_t*)ptr, len, HAL_MAX_DELAY);
    return len;
}
```

然后 `main.c` 里随便用：

c

```c
int count = 0;
while (1)
{
    printf("Count = %d, Tick = %lu ms\r\n", count, HAL_GetTick());
    count++;
    HAL_Delay(1000);
}
```

烧录，串口终端应该每秒收到类似：

```
Count = 0, Tick = 1000 ms
Count = 1, Tick = 2001 ms
Count = 2, Tick = 3002 ms
...
```

**这是嵌入式调试的核心武器**。有了 printf，你就能观察任何变量、任何状态，快速定位问题。

---

### 第五部分：接收数据——从 MCU "听"电脑说话

发送比较简单，接收才是复杂性所在。原因：**你不知道什么时候会有数据来、一次来多少**。

和按键一样，接收数据有三种思路：

1. **轮询接收**：主循环里一直问"有数据没？有数据没？"
2. **中断接收**：数据一到，硬件触发中断，你在中断里处理
3. **DMA 接收**：硬件直接把数据搬到内存，CPU 完全不用管

我们从简单到复杂逐个来。

#### 思路 1：阻塞接收（最简单但最笨）

c

```c
uint8_t rx_byte;
while (1)
{
    HAL_UART_Receive(&huart1, &rx_byte, 1, HAL_MAX_DELAY);
    // 代码会卡在这行，直到收到 1 个字节

    // 收到后处理
    if (rx_byte == '1') {
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET);  // 点亮
        printf("LED ON\r\n");
    } else if (rx_byte == '0') {
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET);    // 熄灭
        printf("LED OFF\r\n");
    }
}
```

效果：串口终端发 `1`，LED 亮；发 `0`，LED 灭。

**问题**：CPU 完全被 `HAL_UART_Receive` 占用，没数据时什么也干不了。这就像你在上一课体验过的 `while (按键没松开);` 的问题。

#### 思路 2：中断接收（推荐）

HAL 库提供了非阻塞版本 `HAL_UART_Receive_IT`（IT = Interrupt）。调用它不会等待，而是告诉硬件："有数据来时，请中断我。"

##### CubeMX 增加配置

在 `USART1` 的 `NVIC Settings` 选项卡，勾选 **`USART1 global interrupt`**。重新生成代码。

##### 代码结构

c

```c
/* 全局缓冲区 */
uint8_t rx_byte;

int main(void)
{
    /* ... 初始化 ... */

    /* 启动一次接收，告诉硬件"收到1字节后触发中断" */
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

    while (1) {
        // CPU 可以做别的事，这里什么都不做
    }
}

/* 接收完成回调函数 —— HAL 库要你重写这个 __weak 函数 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1) {
        /* 处理收到的字节 */
        if (rx_byte == '1') {
            HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET);
            printf("LED ON\r\n");
        } else if (rx_byte == '0') {
            HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET);
            printf("LED OFF\r\n");
        }

        /* ⚠️ 关键：再启动一次接收，否则下次就收不到了！ */
        HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
    }
}
```

⚠️ **最容易犯的错**：忘了在回调末尾**再次调用 `HAL_UART_Receive_IT`**。HAL 库的中断接收是"**一次性**"的——收够了你指定的字节数，就停止了。你必须在回调里"续上"下一次接收。

这种"收到 → 处理 → 再启动" 的模式在 HAL 库里很常见，要形成肌肉记忆。

---

### 第六部分：一个新问题——变长数据怎么收？

上面的例子每次只收 1 字节。但实际通信中，你常常要收**不定长的一行数据**。比如电脑发 `LED_ON\r\n`、`LED_OFF\r\n`、`GET_TEMP\r\n`，长度各不相同，以 `\r\n` 结尾。

**问题**：你不能让 `HAL_UART_Receive_IT(&huart1, buf, 8)` 因为你不知道要收 8 还是 6 还是 20。

#### 解决思路：逐字节接收 + 组装缓冲区

每次接收 **1 字节**，在回调里把字节放进一个缓冲区，直到遇到 `\n` 就认为一行结束，开始处理。

c

```c
#define RX_BUF_SIZE 64

uint8_t rx_byte;                 // 每次收一个字节
uint8_t rx_buffer[RX_BUF_SIZE];  // 组装缓冲区
uint16_t rx_index = 0;
volatile uint8_t line_ready = 0; // 标志：一行数据已就绪

void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1) {
        if (rx_byte == '\n') {
            /* 收到换行，一行结束 */
            rx_buffer[rx_index] = '\0';  // 字符串终止符，方便 strcmp
            line_ready = 1;
            rx_index = 0;
        } else if (rx_byte != '\r') {    // 忽略 \r
            if (rx_index < RX_BUF_SIZE - 1) {
                rx_buffer[rx_index++] = rx_byte;
            } else {
                rx_index = 0;  // 溢出保护，丢弃
            }
        }

        /* 启动下一次接收 */
        HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
    }
}

/* 主循环：检查标志并处理 */
int main(void)
{
    /* ... 初始化 ... */
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

    while (1) {
        if (line_ready) {
            line_ready = 0;
            printf("Got command: %s\r\n", rx_buffer);

            if (strcmp((char*)rx_buffer, "LED_ON") == 0) {
                HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET);
            } else if (strcmp((char*)rx_buffer, "LED_OFF") == 0) {
                HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET);
            } else {
                printf("Unknown command\r\n");
            }
        }
    }
}
```

别忘了 `#include <string.h>` 来用 `strcmp`。

注意 `line_ready` 必须是 `volatile`——**中断里改，主循环里读**，这是你上一课就学过的规则。

**运行效果**：串口发 `LED_ON↵`，LED 亮；发 `LED_OFF↵`，LED 灭；发别的内容，返回 `Unknown command`。

---

### 第七部分：设计模式初探——生产者/消费者

我们不知不觉用了一个重要的设计模式，叫**生产者/消费者模式（Producer-Consumer Pattern）**：

- **生产者**：UART 中断（不断地把字节"生产"到 `rx_buffer`）
- **消费者**：`main` 循环（检查 `line_ready`，把组装好的字符串"消费"掉）
- **共享缓冲区**：`rx_buffer`
- **同步标志**：`line_ready`

这种模式解耦了"数据到达"和"数据处理"两件事：

> 中断快进快出，主循环慢慢处理复杂逻辑。

它是嵌入式通信处理的基本骨架，UART、SPI、I2C 甚至以太网都能套用这个框架。

**但我们的实现有一个严重缺陷**——来，我想让你思考一下：

**问题 3**：假设电脑连续发来两行命令，中间间隔很短：

```
LED_ON\n
LED_OFF\n
```

主循环处理第一行需要一点时间（比如打印 `printf`），这期间第二行数据已经来了，中断把它写进 `rx_buffer`。**会发生什么？**

想一想再继续往下看。

---

...

...

对——**第二行数据会覆盖第一行**！因为只有一个 `rx_buffer`，生产者（中断）和消费者（主循环）共享它。如果消费慢，生产快，就会丢数据。

这就引出了一个至关重要的数据结构：**环形缓冲区（Ring Buffer / Circular Buffer）**。

---

### 第八部分：环形缓冲区

#### 思想

普通缓冲区是线性的：

```
[  H  E  L  L  O  _  _  _  _  _ ]
  ↑               ↑
 head            tail
```

写满了就无处可写。

**环形缓冲区把数组看成一个"环"**：

```
        [0]
      /     \
   [9]       [1]
    |         |
   [8]       [2]
    |         |
   [7]       [3]
      \     /
        [...]
```

用两个指针：`head`（写入位置）和 `tail`（读取位置）。写入时 `head` 向前走，读取时 `tail` 向前走，走到末尾自动回到开头。

**空的条件**：`head == tail` **满的条件**：`(head + 1) % size == tail`（留一个格子区分空和满）

#### 实现

c

```c
#define RB_SIZE 128

typedef struct {
    uint8_t buffer[RB_SIZE];
    volatile uint16_t head;
    volatile uint16_t tail;
} RingBuffer;

RingBuffer rx_rb;

/* 写入一个字节（生产者调用，通常在中断里） */
uint8_t RB_Write(RingBuffer *rb, uint8_t data) {
    uint16_t next = (rb->head + 1) % RB_SIZE;
    if (next == rb->tail) {
        return 0;  // 满了
    }
    rb->buffer[rb->head] = data;
    rb->head = next;
    return 1;
}

/* 读出一个字节（消费者调用，通常在主循环） */
uint8_t RB_Read(RingBuffer *rb, uint8_t *data) {
    if (rb->head == rb->tail) {
        return 0;  // 空
    }
    *data = rb->buffer[rb->tail];
    rb->tail = (rb->tail + 1) % RB_SIZE;
    return 1;
}

/* 判断是否空 */
uint8_t RB_IsEmpty(RingBuffer *rb) {
    return rb->head == rb->tail;
}
```

#### 使用

c

```c
/* 中断里：把数据塞进环形缓冲区，非常快 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart)
{
    if (huart->Instance == USART1) {
        RB_Write(&rx_rb, rx_byte);
        HAL_UART_Receive_IT(&huart1, &rx_byte, 1);
    }
}

/* 主循环：慢慢从环形缓冲区取数据组装处理 */
int main(void) {
    /* ... 初始化 ... */
    HAL_UART_Receive_IT(&huart1, &rx_byte, 1);

    static uint8_t line_buf[64];
    static uint16_t line_idx = 0;

    while (1) {
        uint8_t byte;
        while (RB_Read(&rx_rb, &byte)) {   // 尽量把 RB 里的字节都取出来
            if (byte == '\n') {
                line_buf[line_idx] = '\0';
                /* 处理命令 */
                if (strcmp((char*)line_buf, "LED_ON") == 0) {
                    HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET);
                }
                /* ... */
                line_idx = 0;
            } else if (byte != '\r') {
                if (line_idx < sizeof(line_buf) - 1) {
                    line_buf[line_idx++] = byte;
                }
            }
        }
    }
}
```

**关键优势**：

- 中断**极快**（只是塞一个字节进环形缓冲区）
- 即使主循环慢，数据也不丢失（只要环形缓冲区没满）
- 解耦彻底：中断完全不管怎么解析命令，主循环完全不管怎么收字节

这个 `RingBuffer` 你以后会在各种地方看到——**所有严肃的嵌入式通信代码都用它**。

---

### 停下来，来做几道思考题

在进入下一课之前，回答下面这些问题（可以不用完整写出，自己心里过一遍）：

**问题 4**：如果我的环形缓冲区 `RB_SIZE = 128`，而电脑一秒钟发来 10KB 数据（115200 波特率大概 11KB/s），会发生什么？我该怎么办？

**问题 5**：环形缓冲区中 `head` 和 `tail` 为什么要声明为 `volatile`？

**问题 6**（深入）：`RB_Write` 和 `RB_Read` 可能同时执行（一个在中断里，一个在主循环里）。这样会不会出问题？为什么？（提示：分析 head 和 tail 的所有权。）

**问题 7**（实战）：如果让你同时收 USART1 和 USART2 的数据，你会给每个 UART 一个环形缓冲区，还是共用一个？为什么？

---

### 本课任务

#### 必做

1. **点灯打印版**：让板子每秒通过串口打印 `Count = N, Tick = xxx ms`，同时闪烁 LED。
2. **命令控制版（中断接收）**：电脑发 `LED_ON\n` 点灯，`LED_OFF\n` 灭灯，其他命令返回错误。
3. **环形缓冲区版**：把命令控制版重构成环形缓冲区 + 主循环解析的模式。

#### 挑战

**挑战 1**：实现一个简易命令解析器。支持命令：

- `LED ON` / `LED OFF` / `LED TOGGLE`
- `BLINK 500`（让 LED 以 500ms 周期闪烁，数字可变）
- `STOP`（停止闪烁）
- `HELP`（列出所有命令）

**挑战 2**（难）：写一个 `printf` 的"异步版本"——`printf` 不再直接调用 `HAL_UART_Transmit`，而是把字符放进一个**发送环形缓冲区**；真正的发送在中断里逐字节进行。这样 `printf` 会立刻返回，不会阻塞 CPU。这是高性能日志系统的基础。

---

### 下一课预告

下一课我们会学 **I2C 总线**。你会看到一种完全不同的通信模式：**多个设备共享一根线**。它能帮你连接各种传感器（温湿度 MPU6050、OLED 屏幕 SSD1306、EEPROM⋯⋯）。

更重要的是，我们会开始谈到第一个经典的设计模式——**HAL 库本身就是一种设计模式的体现**，叫"**策略模式 + 句柄模式**"的组合，这将是你理解"为什么要把函数参数设计成传一个结构体指针"的关键。

---

做完任务来汇报：

- `printf` 重定向成功了吗？串口终端看到输出了吗？
- 环形缓冲区版本的命令控制是否稳定工作？
- 问题 4 到 7 你是怎么想的？特别是 6、7，它们涉及并发和架构的关键理解。

加油！你现在已经有了"**软件 + 硬件 + 通信**"的完整技能三件套了。🚀
## 第四课：I2C 总线与多设备通信

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

完成任务后应验证：

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

## 第五课：SPI 总线 + 状态机模式

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
