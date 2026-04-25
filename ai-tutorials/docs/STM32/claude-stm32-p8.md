# 第三课：UART 串口通信

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