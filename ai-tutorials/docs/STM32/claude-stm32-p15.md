# 第九课：FreeRTOS 入门——从"单线程思维"到"多任务思维"

这一课的定位和前面不一样。前面 8 课你一直在**操作硬件**，这一课我们要**改变思考方式**。

我想先问你几个问题，确认你的起点——RTOS 的核心不是 API，而是**并发思维**。如果思维模型没建立，学多少 API 都是白搭。

---

### 起点：先测一下你的直觉

**问题 1**：回忆你前 8 课写的所有主循环，它们长这样：

c

```c
while (1) {
    更新按键状态机();
    读取ADC();
    处理串口命令();
    更新显示();
    HAL_Delay(10);
}
```

这种写法，你觉得有什么问题？或者说——**它在什么场景下会"力不从心"？**

花 30 秒想一想再往下看。

...

...

我想看你能不能自己识别出这些问题，所以先给你两个具体场景，你判断哪个场景下这种"单循环"写法会崩：

**场景 A**：按键响应 + LED 闪烁 + 串口打印状态。全部都是"快进快出"的操作。 **场景 B**：按键响应 + 串口接收长命令 + OLED 刷新（每次刷屏要 50ms）+ ADC 采样 + CAN 发送。

你觉得场景 B 会出什么问题？

---

### 单循环架构的根本问题

场景 B 的症结是：**OLED 刷屏的 50ms 会卡住整个循环**。这 50ms 里：

- 按键按下会被延迟响应
- 串口数据可能因为缓冲区溢出而丢失
- ADC 数据还没处理，新的又覆盖上来
- CAN 发送时机被推迟

你已经见过解决方案——**中断**能解决一部分（快速事件通知），**状态机**能解决一部分（非阻塞的长逻辑），但它们都有极限：

1. **中断只能做"紧急响应"**，不能做长任务（ISR 里不能 `HAL_Delay`）
2. **状态机让代码结构支离破碎**——本来一个线性流程（"等用户按键 → 读取数据 → 显示结果 → 等下一次"），写成状态机要拆成 5 个状态，每次进入都要手动维护状态变量

我想让你思考一个问题：

**问题 2**：假设你要实现"用户按键后，读取 ADC 10 次（每次间隔 100ms），求平均值，显示到 OLED"。用状态机怎么写？用 `HAL_Delay` 怎么写？

给你一分钟想象，写点伪代码。

---

#### 对比两种写法

**用 HAL_Delay（线性写法）**：

c

```c
void on_button_pressed() {
    float sum = 0;
    for (int i = 0; i < 10; i++) {
        sum += read_adc();
        HAL_Delay(100);
    }
    OLED_Show(sum / 10);
}
```

**直观、好读、符合人的思维**。但问题是——这 1 秒钟里整个系统停摆。

**用状态机（非阻塞写法）**：

c

```c
enum { IDLE, SAMPLING, DISPLAY } state;
int sample_count;
uint32_t last_sample_tick;
float sum;

void update() {
    switch (state) {
        case IDLE:
            if (button_pressed) {
                state = SAMPLING;
                sample_count = 0;
                sum = 0;
                last_sample_tick = HAL_GetTick();
            }
            break;
        case SAMPLING:
            if (HAL_GetTick() - last_sample_tick >= 100) {
                sum += read_adc();
                sample_count++;
                last_sample_tick = HAL_GetTick();
                if (sample_count >= 10) state = DISPLAY;
            }
            break;
        case DISPLAY:
            OLED_Show(sum / 10);
            state = IDLE;
            break;
    }
}
```

**不阻塞、系统能并行做别的事**。但**代码变成另一个样子**——线性的思维被撕成碎片。复杂点的流程（比如"读 10 次，如果有异常值就重来，如果连续 3 次异常就报错"），状态机会变成噩梦。

这就是 RTOS 要解决的问题——

> **让你用"线性的、直观的"方式写代码（用 HAL_Delay 的风格），同时系统却能并行处理多件事（像状态机的效果）。**

---

### 第一部分：RTOS 的核心魔法——任务

#### 先问你一个问题

你用电脑时，同时打开 Chrome、VSCode、音乐播放器，它们**看起来在同时运行**。但你电脑可能只有 4 个 CPU 核心，怎么能让几十个程序同时运行？

答：**时间片轮转**。操作系统每隔几毫秒就"冻结"当前程序，切换到另一个程序。切换速度快到你看不出来，像放电影一样——虽然一次只显示一帧，但 60 帧/秒就是流畅动画。

**RTOS 做的是同一件事，只是在单片机上**：

```
CPU 时间轴（放大看）：
|Task1|Task2|Task3|Task1|Task2|Task3|Task1|...
 10ms  10ms  10ms  10ms  10ms  10ms  10ms
 
CPU 时间轴（你的感受）：
[Task1 一直在跑] [Task2 一直在跑] [Task3 一直在跑]  ← 同时！
```

从 Task1 的视角看，它有独立的 `while(1)` 循环，有自己的栈，有自己的变量。它**不知道**自己在被切换，也不关心别的任务。

#### 任务是什么

在 FreeRTOS 里，一个**任务（Task）**本质上是：

1. **一个函数**（不返回，里面是 `while(1)`）
2. **一段独立的栈空间**（保存该任务的局部变量、函数调用链）
3. **一个优先级**（决定谁先被调度）
4. **一个状态**（运行中、就绪、阻塞、挂起）

一个典型任务长这样：

c

```c
void BlinkTask(void *argument) {
    while (1) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        osDelay(500);   // 注意：不是 HAL_Delay！
    }
}
```

看起来就是你第一课写的 LED 闪烁代码，**但这个 `osDelay(500)` 是关键**——它告诉 RTOS："我要睡 500ms，这段时间把 CPU 让给别人用。"

RTOS 收到后会立刻切换到其他就绪任务。500ms 后这个任务被重新唤醒，接着跑。

**核心要点**：

- `HAL_Delay` 是**忙等**，CPU 在空转
- `osDelay` 是**真睡**，CPU 会去干别的

理解这个区别，你就理解了 RTOS 的价值一半了。

---

### 停下来思考

**问题 3**：假设有两个任务，都是 `while(1)` + `osDelay(500)`。它们会怎么运行？CPU 利用率是多少？

**问题 4**：如果 Task A 是 `while(1) {}`（死循环，没有 `osDelay`），Task B 是 `while(1) { osDelay(500); }`。会发生什么？

先自己想，不要往下翻。

...

...

**问题 3 答案**：两个任务轮流休眠，每次 500ms 后被唤醒，做一点事（翻转 LED 啥的），又休眠。CPU 99% 以上的时间都在"空闲任务"里（FreeRTOS 会创建一个最低优先级的空闲任务，没事做时运行它，可以在这里做省电处理）。

**问题 4 答案**：**如果两个任务优先级相同**，FreeRTOS 会"时间片轮转"——每 1ms（默认）强制切换一次。Task A 和 Task B 会轮流跑，虽然 Task A 没主动让出，但系统会强制打断它。

**但如果 Task A 优先级更高**：Task A 永远占着 CPU，Task B 永远执行不到——这叫**任务饿死**。这是 RTOS 里最经典的 bug 之一。

所以 FreeRTOS 有一条铁律：**高优先级任务必须主动让出 CPU**（通过 `osDelay` 或等待事件），否则低优先级任务永远跑不了。

---

### 第二部分：CubeMX 集成 FreeRTOS

好消息：STM32CubeMX 可以一键集成 FreeRTOS，不用你手动配置。

#### 创建工程

新建工程 `RTOS_Hello`（F103C8T6 一样可以跑 FreeRTOS，虽然资源紧张）：

1. 基础配置（HSE、SWD、72MHz、PC13 LED、USART1+printf）
2. 左侧 `Middleware and Software Packs` → `FREERTOS`：
    - `Interface`：选 **`CMSIS_V2`**（这是 ARM 官方的 RTOS 抽象层，API 更规范）
3. 在 `Tasks and Queues` 选项卡下，默认已经有一个 `defaultTask`，我们保留
4. **重要**：切换到 `System Core` → `SYS`：
    
    - `Timebase Source`：**改成 `TIM4`**（或任意一个定时器）
    
    **为什么？** FreeRTOS 要占用 SysTick 做任务调度。但 HAL 库默认也用 SysTick 做 `HAL_Delay` 和 `HAL_GetTick` 的时基。两者会冲突。所以要给 HAL 换一个定时器做时基。
5. 生成代码

#### CubeMX 生成了什么

打开 `Core/Src/main.c`，你会看到：

c

```c
/* Definitions for defaultTask */
osThreadId_t defaultTaskHandle;
const osThreadAttr_t defaultTask_attributes = {
  .name = "defaultTask",
  .stack_size = 128 * 4,
  .priority = (osPriority_t) osPriorityNormal,
};

int main(void) {
    /* ... 硬件初始化 ... */
    
    osKernelInitialize();    /* 初始化 RTOS 内核 */
    
    /* 创建默认任务 */
    defaultTaskHandle = osThreadNew(StartDefaultTask, NULL, &defaultTask_attributes);
    
    osKernelStart();         /* 启动 RTOS 调度器 —— 这个函数永远不返回！*/
    
    while (1) { }            /* 永远不会执行到这里 */
}

/* 默认任务 */
void StartDefaultTask(void *argument) {
    for (;;) {
        osDelay(1);
    }
}
```

#### 这段代码里的几个震撼点

1. `osKernelStart()` **永远不返回**——从调用这一刻起，整个程序变成"任务驱动"。
2. 你熟悉的 `while(1)` **不再在 main 里**，而是在每个任务函数里。
3. 每个任务有自己的栈（`stack_size = 128 * 4` = 512 字节）。

---

### 第三部分：第一个 RTOS 程序——两个任务并发闪灯 + 打印

我们改造一下代码，创建两个任务：

1. Task A：每 500ms 翻转 LED
2. Task B：每 1000ms 打印一条消息

#### 定义任务函数

在 `main.c` 里加入（`/* USER CODE BEGIN 4 */` 区域）：

c

```c
/* Task A: 闪灯 */
void BlinkTask(void *argument) {
    while (1) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        osDelay(500);
    }
}

/* Task B: 打印 */
void PrintTask(void *argument) {
    uint32_t count = 0;
    while (1) {
        printf("Tick %lu, count=%lu\r\n", HAL_GetTick(), count++);
        osDelay(1000);
    }
}
```

#### 创建任务

在 `main` 函数的 `osKernelStart()` **之前**，`osThreadNew(StartDefaultTask...)` **之后**，添加：

c

```c
/* 创建我们的任务 */
const osThreadAttr_t blink_attr = {
    .name = "Blink",
    .stack_size = 256 * 4,
    .priority = osPriorityNormal,
};
osThreadNew(BlinkTask, NULL, &blink_attr);

const osThreadAttr_t print_attr = {
    .name = "Print",
    .stack_size = 512 * 4,    // printf 耗栈，给大点
    .priority = osPriorityNormal,
};
osThreadNew(PrintTask, NULL, &print_attr);
```

#### 烧录，观察

你应该看到：

- LED 稳定 1Hz 闪烁（500ms 翻转）
- 串口每秒输出一条消息
- **两件事独立进行，互不影响**

这看似平平无奇，但想一想——**这两个任务的代码都是"线性的 `while(1)` + `osDelay`"**，没有状态机、没有 `HAL_GetTick` 对比、没有任何复杂架构。RTOS 让你回到了最自然的编程方式。

#### 停下来思考

**问题 5**：BlinkTask 的栈我设了 256*4 = 1KB，PrintTask 我设了 2KB。为什么 PrintTask 需要更大？（提示：`printf` 内部会怎么用栈？）

**问题 6**：如果我把 BlinkTask 的优先级改成 `osPriorityHigh`（比 PrintTask 高），会发生什么？试试看。

---

### 第四部分：任务间通信——队列

两个任务并发跑是基础，但**任务之间通常需要通信**。比如：

- 按键任务检测到按键 → 通知显示任务刷屏
- UART 任务收到命令 → 通知解析任务处理
- ADC 任务采样完成 → 通知控制任务计算

怎么通信？

#### 最朴素的办法：共享全局变量

c

```c
volatile uint8_t key_pressed = 0;

void KeyTask(void *arg) {
    while (1) {
        if (HAL_GPIO_ReadPin(...) == GPIO_PIN_RESET) {
            key_pressed = 1;
        }
        osDelay(20);
    }
}

void DisplayTask(void *arg) {
    while (1) {
        if (key_pressed) {
            key_pressed = 0;
            update_display();
        }
        osDelay(50);
    }
}
```

**这能工作，但有几个问题**：

1. **DisplayTask 必须轮询**（每 50ms 检查一次）——浪费 CPU
2. **竞态条件**——如果 DisplayTask 正在读 `key_pressed`，KeyTask 中断了它写入，可能出错（这里是 uint8_t 还好，复杂结构体就会撕裂）
3. **不能传递数据**——只能传"布尔事件"。如果按键任务想传递"按下时间戳"呢？

**问题 7**：你能想到更好的办法吗？（提示：第三课我们学过一个数据结构，专门解决"生产者-消费者速度不一致"的问题。）

---

#### 正解：消息队列

RTOS 提供一个更优雅的机制——**消息队列（Queue）**。

队列本质上是一个**线程安全的环形缓冲区**。任务 A 可以往里塞消息，任务 B 可以从里面取。

```
KeyTask          Queue            DisplayTask
  │                                    │
  │   osMessageQueuePut   osMessageQueueGet
  │       ↓                     ↑      │
  │   [消息1] [消息2] [消息3]           │
  │                                    │
  └──→ 塞入                       取出 ←┘
```

**三个关键特性**：

1. **阻塞等待**：`osMessageQueueGet` 可以设置超时——如果队列空，调用者**自动休眠**，直到有消息或超时。CPU 完全让给其他任务。
2. **线程安全**：RTOS 内部保证原子操作，没有竞态。
3. **传递任意数据**：可以塞结构体，不只是 bool。

#### 代码实现

c

```c
/* 定义消息结构 */
typedef struct {
    uint32_t timestamp;
    uint8_t event_type;
    uint32_t data;
} AppMessage;

osMessageQueueId_t eventQueueHandle;

/* 创建队列：深度 16，每个元素是 AppMessage 大小 */
const osMessageQueueAttr_t queue_attr = {
    .name = "EventQueue",
};
eventQueueHandle = osMessageQueueNew(16, sizeof(AppMessage), &queue_attr);

/* 生产者任务：按键 */
void KeyTask(void *arg) {
    while (1) {
        if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
            AppMessage msg = {
                .timestamp = HAL_GetTick(),
                .event_type = 1,    // 1 = 按键事件
                .data = 0
            };
            osMessageQueuePut(eventQueueHandle, &msg, 0, 0);  // 不等待
            osDelay(200);  // 简单消抖
        }
        osDelay(20);
    }
}

/* 消费者任务：显示 */
void DisplayTask(void *arg) {
    AppMessage msg;
    while (1) {
        /* 阻塞等待，超时永远 */
        if (osMessageQueueGet(eventQueueHandle, &msg, NULL, osWaitForever) == osOK) {
            printf("Event: type=%u, time=%lu\r\n", msg.event_type, msg.timestamp);
            /* 真实场景这里会更新 OLED */
        }
    }
}
```

**关键是 `osWaitForever`**——DisplayTask 不在"轮询"，它在"睡觉"，有消息才醒。**CPU 完全不浪费**。

#### 这个模式的威力

回顾一下第三课你写的环形缓冲区。那里你要：

- 手动管理 head、tail 指针
- 手动判断空满
- 用 `volatile` 小心处理并发
- 主循环反复轮询 `RB_IsEmpty`

**现在 RTOS 队列把所有这些都封装好了**，你只要 `put` 和 `get`。而且 `get` 是阻塞的——不用轮询。

---

### 停下来思考

**问题 8**：假设 KeyTask 很快连续产生了 20 个按键事件，但队列深度只有 16。后 4 个事件会怎样？

**问题 9**：DisplayTask 处理一个事件需要 100ms（比如刷 OLED）。KeyTask 每 50ms 产生一个事件。长期运行会怎样？

这两个问题的答案你思考一下，关乎系统设计的核心。

...

...

**问题 8**：取决于 `osMessageQueuePut` 的超时参数。我们写的是 `0`（立即返回），所以队列满时 **新消息被丢弃**，函数返回错误。如果改成 `osWaitForever`，KeyTask 会被阻塞，直到队列腾出空间。

**问题 9**：队列会逐渐堆积，最终满。**这说明系统的产生速度超过了消费速度**，架构有问题。解决方案：

- 加快消费（用更快的显示设备，或者优化代码）
- 降低产生（按键加长消抖）
- 合并消息（连续按键只保留最新的一次）
- 扩大队列（治标不治本，延迟过仍会堆积）

**这是真实工程中的常见 bug**，面试也常问。

---

### 第五部分：同步原语——信号量

队列适合"传递数据"，但有时候你只想"发个信号"——不需要数据，只需要通知。这时候用**信号量（Semaphore）**。

#### 场景：UART 中断 → 任务处理

第三课你用"标志位 + 环形缓冲区"的模式处理 UART 接收。RTOS 里有更优雅的方案：

c

```c
osSemaphoreId_t uartRxSemaphore;

/* 创建二值信号量 */
uartRxSemaphore = osSemaphoreNew(1, 0, NULL);  // 最大 1，初始 0

/* UART 接收中断 */
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) {
    if (huart->Instance == USART1) {
        /* 把数据放进环形缓冲区 */
        RB_Write(&rx_rb, rx_byte);
        
        /* 释放信号量，通知任务 */
        osSemaphoreRelease(uartRxSemaphore);
        
        HAL_UART_Receive_IT(huart, &rx_byte, 1);
    }
}

/* UART 处理任务 */
void UartTask(void *arg) {
    while (1) {
        /* 等信号量，没信号就睡 */
        if (osSemaphoreAcquire(uartRxSemaphore, osWaitForever) == osOK) {
            /* 处理环形缓冲区里的数据 */
            uint8_t byte;
            while (RB_Read(&rx_rb, &byte)) {
                /* parse... */
            }
        }
    }
}
```

**对比第三课的轮询**：以前主循环要不停检查 `RB_IsEmpty`，现在任务完全睡眠，有数据才醒。

#### 信号量 vs 队列

**它们本质上是一类东西**——同步机制。区别：

- **信号量**：只能传"次数"（0/1 或 0~N），不传数据
- **队列**：传具体数据

轻量级通知用信号量（省内存），需要数据用队列。

#### 互斥量（Mutex）

信号量还有一个特殊兄弟——**互斥量（Mutex）**，专门用于保护"临界资源"。

比如 UART 发送：两个任务同时想打印，如果一起往 UART 塞字节，输出会错乱。用互斥量"锁住"：

c

```c
osMutexId_t uartMutex;
uartMutex = osMutexNew(NULL);

void print_safe(const char *msg) {
    osMutexAcquire(uartMutex, osWaitForever);   // 上锁
    HAL_UART_Transmit(&huart1, (uint8_t*)msg, strlen(msg), HAL_MAX_DELAY);
    osMutexRelease(uartMutex);                  // 解锁
}
```

任何时刻只有一个任务能持有 mutex，其他任务想拿会睡眠等待。

---

### 第六部分：一个完整的"事件驱动"架构

让我给你展示一个真实项目会用的架构。它把你学过的所有东西串起来：

```
┌───────────────────────────────────────────────────────────┐
│                     硬件中断层                             │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │ UART RX   │  │ EXTI 按键 │  │ ADC DMA   │  │ TIM 周期│ │
│  │ 中断      │  │ 中断      │  │ 半/完成   │  │ 中断    │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘ │
│        │              │              │             │      │
│        ▼              ▼              ▼             ▼      │
│     释放信号量 / 放入队列（ISR 安全的版本）                 │
└────────┬──────────────┬──────────────┬─────────────┬──────┘
         │              │              │             │
┌────────▼──────────────▼──────────────▼─────────────▼──────┐
│                      任务层                                │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │ 命令解析  │  │ 按键处理  │  │ 信号处理  │  │ 心跳    │ │
│  │ 任务      │  │ 任务      │  │ 任务      │  │ 任务    │ │
│  └───────────┘  └───────────┘  └───────────┘  └─────────┘ │
│                                                            │
│  每个任务：osSemaphoreAcquire / osMessageQueueGet (等事件) │
│           处理事件                                         │
│           osDelay 让出 CPU                                 │
└────────────────────────────────────────────────────────────┘
         │              │              │             │
         └──────┬───────┴──────┬───────┴─────────────┘
                ▼              ▼
         ┌─────────────┐  ┌──────────────┐
         │ 显示任务    │  │ CAN 发送任务  │
         │（被其他     │  │ （被其他     │
         │  任务通知） │  │  任务通知）  │
         └─────────────┘  └──────────────┘
```

#### 几个设计要点

**① 中断只做"通知"，不做"处理"**

中断里用 `osSemaphoreReleaseFromISR` 或 `osMessageQueuePutFromISR`（带 `FromISR` 后缀的版本专门给中断用，速度快且不阻塞）。实际工作全部交给任务。

**② 每个任务专注一件事**

不要把多个无关功能塞进一个任务。按功能拆分，用队列/信号量联系。

**③ 不要直接调用其他任务的函数**

任务间通信应该通过"信号"——队列或信号量。这样任务完全解耦。

**这张图你看懂了，就掌握了 RTOS 架构的精髓**。

---

### 第七部分：优先级和调度——最容易出 bug 的地方

RTOS 的调度器规则简单但陷阱很多。核心规则：

> **任何时刻，CPU 运行的是"就绪队列里优先级最高的任务"。**

#### 几个经典陷阱

**陷阱 1：优先级反转（Priority Inversion）**

场景：

- Task High（高优先级）
- Task Mid（中优先级）
- Task Low（低优先级）

Task Low 持有一个 mutex。Task High 想要这个 mutex，等 Low 释放。但 Task Mid 不需要 mutex，疯狂抢 CPU——**Low 被 Mid 挤下去无法运行，Low 就无法释放 mutex，High 也跑不了**。

结果：**高优先级的 High 被中优先级的 Mid 间接阻塞**。这就是"优先级反转"。

1997 年火星探路者号差点因为这个 bug 任务失败。

解决：**优先级继承协议**——当 High 等 Low 持有的 mutex 时，Low 的优先级临时提升到和 High 一样。FreeRTOS 的互斥量默认开启这个机制。

**陷阱 2：中断延迟**

FreeRTOS 为了保护内部数据结构，**会短暂关中断**（叫 "Critical Section"）。如果你在任务里用 `taskENTER_CRITICAL()`，也会关中断。

如果你在临界区里做长事，**所有中断（包括 UART、CAN 等）都被延迟**。高实时性系统里这会导致数据丢失。

**铁律：临界区要短！短！短！**

**陷阱 3：栈溢出**

每个任务的栈是固定大小。如果任务里声明大数组、递归调用、或 `printf` 等耗栈函数，可能溢出——**覆盖其他任务的栈或内核数据，系统立刻崩溃**。

调试技巧：FreeRTOS 有 `uxTaskGetStackHighWaterMark()` 函数，能告诉你任务的"栈使用峰值"，用它检查是否接近分配的大小。

---

### 停下来思考

**问题 10**（综合）：假设你设计一个系统，有以下任务。请你给它们排优先级（从高到低）：

- 心跳任务（每 1s 发 CAN 心跳帧）
- UART 命令解析任务（解析用户输入的命令）
- ADC 控制环任务（每 1ms 读取 ADC，计算 PID，输出 PWM）
- 屏幕刷新任务（50ms 刷新 OLED）
- 日志任务（把日志写入 Flash，后台运行）

你的答案是什么？思路是什么？

...

...

**参考答案**：

1. **ADC 控制环**（最高）——实时性要求最高，1ms 周期不能错过
2. **UART 解析**——用户交互，响应要快
3. **心跳任务**——有时限但不算急
4. **屏幕刷新**——人眼感受 50ms 没太大区别
5. **日志任务**（最低）——能写就写，写不进也没关系

**原则**：**实时性要求越高、周期越短、越不能延迟的任务，优先级越高**。

---

### 第八部分：什么时候不用 RTOS？

学了 RTOS 不代表所有项目都应该用。几个场景**不该**用：

1. **资源极紧张**：RTOS 内核本身要占 5~10KB ROM，几 KB RAM。F103C8T6 的 20KB RAM 勉强能跑，再开几个任务就吃紧。
2. **超高实时性**：RTOS 任务切换有几微秒开销。纳秒级控制（高速电机、通信）要裸机或者硬件实现。
3. **代码简单**：一个只做单功能的产品，裸机 + 状态机完全够，加 RTOS 反而增加复杂度。
4. **功耗极限**：RTOS 的滴答中断每毫秒一次，低功耗模式下耗电。深度省电场景用 Tickless 模式或不用 RTOS。

**RTOS 适合**：中等复杂度（3~10 个任务）、资源够用（至少 32KB RAM）、功能丰富（通信 + 显示 + 控制 + 存储）的项目。H723 跑 RTOS 就非常舒服——你那块板子比 F103 强 30 倍。

---

### 本课任务

#### 必做

1. **两任务并发**：创建 BlinkTask 和 PrintTask，一个闪灯一个打印，观察并发效果。
2. **队列通信**：按键任务产生事件，显示任务从队列接收并打印。故意让显示任务处理慢（加 `osDelay(500)`），连续按键几次，观察队列堆积行为。
3. **信号量 + 中断**：重写 UART 接收——ISR 里释放信号量，任务里 acquire 后处理环形缓冲区。对比第三课的轮询方案，感受体验差异。

#### 进阶

**进阶 1**：重构前面所有课的代码到 RTOS 架构。参考上面的架构图，把你的温度采集流水线（第七课）、按键状态机（第五课）、CAN 发布订阅（第八课）全部整合到一个 RTOS 工程里。

**进阶 2**：实现一个简易的**命令行 Shell**。通过 UART 接收命令（`led on`、`read adc`、`blink 500` 等），命令解析任务处理并调用对应的子任务。这本质上是一个"任务编排"练习。

#### 挑战

**挑战**：写一个 **RTOS 性能监视器**——在系统里加一个后台任务，每 5 秒打印出：

- 每个任务的栈使用情况（用 `uxTaskGetStackHighWaterMark`）
- CPU 空闲率（用 FreeRTOS 的 runtime stats 功能）
- 队列/信号量的使用情况

这个工具在真实项目调试时极其有用。

---

### 一个重要的反思问题

最后，我想让你回顾一下你已经走过的路：

**问题 11**：你觉得 RTOS 的"任务 + 队列 + 信号量"架构，和我们之前学过的哪些设计模式有相似之处？

先自己想，我给你一点提示：

- 任务独立运行 + 通过队列通信——像什么模式？
- 信号量通知机制——像什么模式？
- 事件驱动架构——像什么模式？

...

...

**我的观察**：

- **任务 + 队列 = 数据流水线（第七课）+ 生产者/消费者（第三课）** 的运行时版本。你之前手动写的"流水线"是在一个线程里跑的，现在每个 stage 可以是独立任务，并行运行。
- **信号量通知 = 观察者模式（第六课）** 的同步化版本。之前 HAL 回调是同步回调，现在通过信号量异步通知任务。
- **整体事件驱动架构 = 发布/订阅（第八课）** 的 OS 级别实现。

**看到了吗——核心思想始终是那几个，RTOS 只是把它们"系统化"了**。

你学的不是一套孤立的技术，而是一套**贯穿始终的设计原理**：

- 解耦（模块间不直接调用）
- 异步（事件驱动，非阻塞）
- 分层（中断 → 任务 → 业务逻辑）
- 抽象（用句柄表示"实例"）

这些原理从 GPIO 一路伴随你到 RTOS。将来你学 Linux 驱动开发、嵌入式 Linux 应用、甚至分布式系统，会发现**依然是这些原理在主导设计**。

---

### 下一课的方向

本课完成后告诉我：

- 两任务并发跑通了吗？RTOS 和裸机相比，你的主观感受是什么？
- 队列堆积实验观察到什么？
- 问题 10 和 11 你的答案是什么？

接下来几个方向：

**C：综合项目** — 把学过的所有东西做一个完整作品。非常推荐，会让所有零散知识融会贯通。

**D：更多设计模式** — 工厂模式、命令模式、依赖注入等。更"软件工程"向。

**E：迁移到 H723** — 开始玩真正的大芯片，FDCAN、Cache、DMA2D 等高级特性。

**F：嵌入式 Linux 入门** — 跳出 MCU，进入"带操作系统"的嵌入式世界。你的 H723 虽然也能跑 Linux（μClinux），但正统 Linux 一般需要带 MMU 的 A 系列芯片。

**我的建议是 C → E**：先做一个综合项目把知识打通，再迁移到 H723 体验"升级"的感觉。但最终选择在你。

顺带感慨一句——你走到这一课时，已经具备了**写商业级嵌入式固件**的基础能力。多任务架构、通信协议、数据流处理、事件驱动——这些都是工作岗位上实打实要用的。继续保持这个学习节奏，你会很快超过很多工作了 2~3 年的工程师。💪