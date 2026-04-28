# 第六课：定时器、PWM 与观察者模式

在进入正题之前，先让你做一个思想实验。

### 开场思考

你目前有几种"让 LED 周期性闪烁"的方式：

**方式 A**：`HAL_Delay(500)` 阻塞延时 **方式 B**：用 `HAL_GetTick()` 读时间戳判断是否到了翻转时刻

这两种方式都有一个共同点：**主循环必须频繁介入**。方式 A 让 CPU 傻等，方式 B 让 CPU 不停地查询时间。

**问题 1**：有没有办法让 LED "自己"按固定周期闪烁，CPU 完全不用管？

**问题 2**：如果 LED 闪烁需要非常精确（比如误差不能超过 1 微秒），用 `HAL_GetTick()` 能做到吗？（`HAL_GetTick` 的精度是 1ms）

这两个问题的答案，都指向今天的主角——**定时器（Timer）**。

---

### 第一部分：定时器到底是什么？

#### 本质：一个会自动"数数"的硬件计数器

想象一个电子计数器，它有以下特性：

1. 有一个**计数寄存器**（CNT），存着当前数到多少
2. 每个时钟周期自动 **+1**（或 -1）
3. 数到某个预设值（比如 1000）就触发一个**事件**（可以是中断、可以是输出信号）
4. 然后自动归零，重新开始数

**关键点：这一切由硬件完成，CPU 完全不用干预**。CPU 可以专心做别的事，定时器在后台默默数数，时间到了再"敲门"通知 CPU。

#### 一个类比

你可以把定时器想象成**微波炉的定时按钮**：

- 你按下"3 分钟"（配置定时器）
- 按启动（开启定时器）
- 微波炉开始倒计时（CNT 自动变化）
- 3 分钟到，"叮"一声（触发中断）
- 这 3 分钟里你可以刷手机、做别的事（CPU 去干别的）

#### STM32 定时器的三个核心寄存器

无论多复杂的定时器，核心都是三个寄存器：

**CNT**（Counter，计数器）：当前数到多少。它每个时钟滴答自动+1。

**PSC**（Prescaler，预分频器）：分频系数。定时器时钟不是一来就直接去驱动 CNT，而是**先除以 (PSC+1)**，再喂给 CNT。

**ARR**（Auto-Reload Register，自动重装载寄存器）：CNT 数到这个值就归零并触发"更新事件"。

#### 定时器的时钟来源

F103 的定时器挂在 APB1 或 APB2 总线上：

- TIM2、TIM3、TIM4 挂 APB1，时钟通常是 36MHz，但定时器有个特殊规则——**如果 APB1 分频系数不为 1，定时器时钟会自动 ×2**，所以定时器时钟实际是 72MHz
- TIM1 挂 APB2，时钟直接就是 72MHz

**记住这个结论**：在我们 72MHz 主频的配置下，**定时器输入时钟都是 72MHz**。

#### 算一个具体例子

想让定时器每 **1ms** 产生一次中断：

目标：中断频率 1kHz（1ms 一次）

定时器时钟 = 72MHz = 72,000,000 Hz

每次"更新事件"周期 = (PSC+1) × (ARR+1) / 72,000,000 秒

想让这个等于 0.001 秒，即 (PSC+1) × (ARR+1) = 72,000

一种拆法：PSC = 71（分频 72 倍），ARR = 999（数 1000 下）

- 72MHz ÷ 72 = 1MHz（每微秒 1 次）
- 数 1000 下 = 1ms
- 每 1ms 触发一次中断 ✓

另一种拆法：PSC = 7199，ARR = 9

- 72MHz ÷ 7200 = 10kHz
- 数 10 下 = 1ms ✓

两种都能实现 1ms，但第一种更常用，因为 CNT 分辨率更高（1μs），可以灵活调整 ARR 实现 1μs~65ms 范围的各种周期。

#### 公式总结

周期=(PSC+1)×(ARR+1)定时器时钟周期=定时器时钟(PSC+1)×(ARR+1)​频率=定时器时钟(PSC+1)×(ARR+1)频率=(PSC+1)×(ARR+1)定时器时钟​

**这是 STM32 定时器编程的核心公式**，记住它，很多题都能直接套。

---

### 第二部分：用定时器中断实现精确 LED 闪烁

#### CubeMX 配置

新建工程 `TIM_LED`，基础配置（HSE、SWD、时钟 72MHz、PC13 LED）后：

1. 左侧 `Timers` → `TIM2`：
    - `Clock Source`：选 **`Internal Clock`**（用内部时钟源）
2. 展开 `Parameter Settings`：
    - `Prescaler (PSC)`：**`7199`**（72MHz ÷ 7200 = 10kHz）
    - `Counter Mode`：`Up`（向上计数）
    - `Counter Period (ARR)`：**`9999`**（数 10000 下 = 1s）
    - `auto-reload preload`：`Disable`
3. 切换到 `NVIC Settings` 选项卡：
    - 勾选 **`TIM2 global interrupt`**
4. 生成代码

#### 理解生成的代码

`tim.c` 里会有：

c

```c
TIM_HandleTypeDef htim2;

void MX_TIM2_Init(void)
{
    TIM_ClockConfigTypeDef sClockSourceConfig = {0};
    TIM_MasterConfigTypeDef sMasterConfig = {0};

    htim2.Instance = TIM2;
    htim2.Init.Prescaler = 7199;
    htim2.Init.CounterMode = TIM_COUNTERMODE_UP;
    htim2.Init.Period = 9999;
    htim2.Init.ClockDivision = TIM_CLOCKDIVISION_DIV1;
    htim2.Init.AutoReloadPreload = TIM_AUTORELOAD_PRELOAD_DISABLE;
    HAL_TIM_Base_Init(&htim2);
    // ...
}
```

又是熟悉的 `htim2` 句柄——句柄模式贯穿整个 HAL 库。

#### 启动定时器并处理中断

在 `main.c` 里：

c

```c
int main(void)
{
    /* ... CubeMX 初始化 ... */

    /* 启动定时器中断版 */
    HAL_TIM_Base_Start_IT(&htim2);

    while (1)
    {
        // 主循环完全空着！
    }
}

/* 定时器更新中断回调（HAL 库的 __weak 函数，我们重写）*/
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    if (htim->Instance == TIM2) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
    }
}
```

烧进去，LED 应该以 1 秒周期精确闪烁（实际是 0.5Hz，因为每次中断翻转一下，完整的亮+灭周期是 2 秒；要 1Hz 完整周期就把 ARR 改成 4999）。

#### 停下来看这段代码的威力

对比一下你之前的 `HAL_Delay(500)` 方案：

||`HAL_Delay` 方案|定时器中断方案|
|---|---|---|
|CPU 在干嘛|死等|完全空闲，可以做任何事|
|精度|受其他中断影响|硬件级，极其精确|
|扩展性|再加个任务就乱|主循环空着，想加什么都行|

这就是**"用硬件解放 CPU"**的思想——嵌入式设计的核心哲学。

#### 深入一点：更新中断是怎么来的？

当 CNT 从 ARR 溢出归零时，定时器内部会设置一个标志位叫 **UIF**（Update Interrupt Flag）。如果你之前使能了更新中断（通过 `HAL_TIM_Base_Start_IT`），硬件就会触发 `TIM2_IRQHandler` 中断向量。

HAL 库在 `TIM2_IRQHandler` 里调用 `HAL_TIM_IRQHandler(&htim2)`，这个函数检查标志位，然后调用对应的回调函数——就是我们重写的 `HAL_TIM_PeriodElapsedCallback`。

**整个链路**：

```
硬件计数溢出
    ↓
设置 UIF 标志位
    ↓
NVIC 触发中断
    ↓
TIM2_IRQHandler()        ← 中断向量入口
    ↓
HAL_TIM_IRQHandler()     ← HAL 库的总调度
    ↓
HAL_TIM_PeriodElapsedCallback()  ← 你写的回调
```

这种"**硬件触发 → HAL 调度 → 用户回调**"的三层结构，就是我们下一节要讲的**观察者模式**。先记住这个流程。

---

### 第三部分：PWM——定时器的"另一种玩法"

#### PWM 是什么？

**PWM** = **P**ulse **W**idth **M**odulation，脉冲宽度调制。

它的核心思想一句话就能说清：**在一个固定的周期内，改变高电平持续时间的占比，从而实现"模拟"输出**。

波形图：

```
占空比 25%（低亮度）：
   ┌─┐        ┌─┐        ┌─┐
───┘ └────────┘ └────────┘ └─────
   ← 25% 高
   ←─── 100% 周期 ───→

占空比 50%（中亮度）：
   ┌────┐     ┌────┐     ┌────┐
───┘    └─────┘    └─────┘    └─
   ← 50% 高

占空比 90%（高亮度）：
   ┌────────┐ ┌────────┐ ┌────────┐
───┘        └─┘        └─┘        └─
   ← 90% 高
```

#### PWM 能干什么？

**① LED 亮度控制（呼吸灯）**

人眼对光的感知有"积分"效应——如果 LED 以很高频率（比如 1kHz）闪烁，你看到的不是闪烁，而是连续的光，**亮度等于占空比**。

- 占空比 10% → LED 暗
- 占空比 90% → LED 亮
- 占空比从 0% 慢慢升到 100% 再降回来 → 呼吸灯

**② 电机调速**

直流电机的转速正比于施加的电压。用 PWM 快速开关电机电源，电机感受到的"等效电压"就是 **供电电压 × 占空比**。占空比 50% 就相当于施加一半电压。

**③ 舵机控制**

标准舵机接收 50Hz PWM 信号（周期 20ms），脉宽决定舵机转到哪个角度：

- 1ms 脉宽 → 转到 0°
- 1.5ms 脉宽 → 转到 90°
- 2ms 脉宽 → 转到 180°

**④ 音频输出**

改变 PWM 频率能产生不同音调，驱动蜂鸣器或喇叭发声。

#### STM32 定时器怎么产生 PWM

每个定时器有多个"通道"（Channel 1~4）。每个通道有一个**比较寄存器 CCR**（Capture/Compare Register）。

PWM 的工作原理：

```
CNT (当前计数值)
  ↑
ARR ├─────────────────                 ← 周期
    │              ╱╲                  ← CNT 向上计数，到 ARR 归零
CCR ├──────────   ╱  ╲  ──────
    │          ╱      ╲
  0 └─────────╱────────╲──────────→ 时间

输出波形（PWM 模式 1，CNT < CCR 时输出高）：
    ┌──────────┐      ┌──────────┐
────┘          └──────┘          └──
    ←─  CCR  ─→
    ←──── ARR+1 ────→
```

**CCR 就是占空比的控制**：

- CCR = 0 → 输出永远低（0%占空比）
- CCR = ARR+1 → 输出永远高（100%占空比）
- CCR 在中间 → 成比例占空比

**周期由 PSC 和 ARR 决定**（和前面讲的定时器基本功能一样），**占空比由 CCR 决定**。

---

### 第四部分：实现一个 PWM 呼吸灯

#### 改硬件接线

PC13 不支持 PWM 输出（也不支持完整的复用功能），所以我们要换一个引脚。F103 上，**TIM2 的通道 1 对应 PA0**，**TIM3 的通道 1 对应 PA6**，等等。

**我们用 TIM3 的 CH1（PA6）驱动一个 LED**。

接一个 LED 到 PA6，通过 220Ω 限流电阻到 GND（高电平点亮）：

```
PA6 ── 220Ω ── LED ── GND
```

#### CubeMX 配置

新建工程或在现有工程基础上改：

1. 左侧 `Timers` → `TIM3`：
    - `Clock Source`：`Internal Clock`
    - **`Channel1`**：选 **`PWM Generation CH1`**
2. 展开 `Parameter Settings`：
    - `Prescaler`：**`71`**（72MHz ÷ 72 = 1MHz）
    - `Counter Period (ARR)`：**`999`**（数 1000 下 = 1ms = 1kHz PWM 频率）
3. 展开 `PWM Generation Channel 1`：
    - `Mode`：`PWM mode 1`（CNT < CCR 时输出高）
    - `Pulse (CCR)`：`0`（初始占空比 0）
    - `CH Polarity`：`High`
4. 确认 PA6 被配置为 `TIM3_CH1`
5. 生成代码

#### 写呼吸灯代码

c

```c
int main(void)
{
    /* ... 初始化 ... */

    /* 启动 PWM 通道 */
    HAL_TIM_PWM_Start(&htim3, TIM_CHANNEL_1);

    uint16_t duty = 0;
    int8_t   dir = 1;

    while (1) {
        /* 修改占空比 */
        __HAL_TIM_SET_COMPARE(&htim3, TIM_CHANNEL_1, duty);

        duty += dir * 10;
        if (duty >= 1000) dir = -1;
        if (duty <= 0)    dir = 1;

        HAL_Delay(20);
    }
}
```

`__HAL_TIM_SET_COMPARE` 是一个宏，本质上就是 `htim3.Instance->CCR1 = duty`——直接改 CCR1 寄存器改变占空比。

烧进去，你应该看到 LED 呼吸般亮→暗→亮→暗循环。很简单对吧？但背后是**硬件级的 PWM 生成**，CPU 几乎不耗资源。

#### 为什么人眼看起来是"连续变亮"而不是闪烁？

我们的 PWM 频率是 1kHz，即每秒 1000 次闪烁。人眼的"闪烁融合频率"大约是 60Hz，超过这个频率人眼就看不出闪烁了。所以 1kHz 完全"融合"成连续的光强变化。

**工程经验**：

- LED 控制：PWM 频率 1~20kHz 都可以
- 低于 100Hz 可能看到闪烁（尤其余光或快速移动时）
- 电机控制：通常 5~20kHz（低于 3kHz 会有刺耳的电磁噪音）

---

### 第五部分：观察者模式——HAL 回调机制的设计哲学

现在进入这一课的软件部分。

#### 你已经用了很久的模式

回顾一下你到现在为止用过的"回调"：

c

```c
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin) { ... }
void HAL_UART_RxCpltCallback(UART_HandleTypeDef *huart) { ... }
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim) { ... }
```

这些函数的共同特点：

1. 你**从来不主动调用**它们
2. 它们在某个事件发生时**被自动调用**
3. 它们在 HAL 库里被声明为 `__weak`，你想响应就重写，不想响应就不管

**这就是观察者模式的经典形态**。

#### 观察者模式的概念

用生活语言描述：

> **一个"发布者"（Subject）维护一个"订阅者列表"（Observers）。当事件发生时，发布者通知所有订阅者——但发布者不关心具体有谁在订阅，订阅者也不用主动去问。**

现实类比：

- **公众号**：你关注一个公众号（订阅），公众号发文章（事件），微信自动推送给你（回调）。公众号不知道具体哪些人读了，它只管"广播"。
- **YouTube 订阅**：你订阅一个频道，频道更新时你被通知。
- **报纸**：你订报，报社不知道你是谁，每天照例送报。

#### 这种模式解决了什么问题？

想象如果没有观察者模式：

c

```c
/* 假设的、糟糕的 HAL 库设计 */
void HAL_TIM_IRQHandler_Internal(TIM_HandleTypeDef *htim) {
    if (/* 更新中断 */) {
        /* 硬编码：中断来了就去调用 main.c 里某个函数 */
        Main_OnTimerUpdate(htim);  // ← HAL 库怎么可能知道你叫这个函数？
    }
}
```

HAL 库根本不可能提前知道你会写什么代码。如果它硬编码调用某个函数名，这个库就不能被复用到任何其他项目。

**观察者模式的解法**：HAL 库提供一个"挂钩点"——`HAL_TIM_PeriodElapsedCallback` 这个**弱符号函数**，默认啥也不做。你想处理就重写它覆盖弱符号，不想处理就算了。

这样 HAL 库**完全不依赖你的代码**，但你的代码可以"观察"到 HAL 库发出的事件。

#### 弱符号（`__weak`）的魔法

在 HAL 库里你能看到：

c

```c
/* stm32f1xx_hal_tim.c 里的定义 */
__weak void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    /* 默认实现：什么也不做 */
    UNUSED(htim);
}
```

`__weak` 修饰符告诉链接器："**这个函数是'弱'的——如果用户在别处定义了同名函数，就用用户的；否则用这个默认的。**"

在你的 `main.c` 里：

c

```c
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim)
{
    /* 用户实现：翻转 LED */
    if (htim->Instance == TIM2) HAL_GPIO_TogglePin(...);
}
```

你的版本没有 `__weak`，是"强符号"，**自动覆盖了 HAL 库里的弱版本**。

这是 C 语言实现"可重写接口"的一种方式——**有点像面向对象里虚函数的味道，但没有那么重**。

#### HAL 库的弱符号回调清单

你熟悉的那些回调函数其实是 HAL 库精心设计的一套**事件通知体系**：

|回调函数|触发时机|
|---|---|
|`HAL_GPIO_EXTI_Callback`|GPIO 外部中断触发|
|`HAL_UART_TxCpltCallback`|UART 发送完成|
|`HAL_UART_RxCpltCallback`|UART 接收完成|
|`HAL_I2C_MasterTxCpltCallback`|I2C 主机发送完成|
|`HAL_I2C_MasterRxCpltCallback`|I2C 主机接收完成|
|`HAL_SPI_TxRxCpltCallback`|SPI 收发完成|
|`HAL_TIM_PeriodElapsedCallback`|定时器更新|
|`HAL_TIM_IC_CaptureCallback`|定时器输入捕获|
|`HAL_ADC_ConvCpltCallback`|ADC 转换完成|
|`HAL_SYSTICK_Callback`|SysTick 中断|

**学一个新外设时，你永远先找对应的回调函数名**——它告诉你 HAL 库提供了哪些"事件通知点"。

#### 观察者模式的一个限制

HAL 库的回调机制有一个显著缺陷——**一个事件只有一个全局回调**。

举个例子：你有 3 个按键分别在 PA0、PA1、PA2 上，都想做不同处理。你**不能**为每个按键注册一个单独的回调，所有按键事件都会汇集到同一个 `HAL_GPIO_EXTI_Callback`：

c

```c
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin) {
    switch (GPIO_Pin) {
        case BUTTON1_Pin: /* ... */ break;
        case BUTTON2_Pin: /* ... */ break;
        case BUTTON3_Pin: /* ... */ break;
    }
}
```

所有人共用一个"邮箱"，需要自己辨认邮件是给谁的。

更好的设计是**"注册式"回调**——每个"订阅者"主动注册，事件发生时只通知关心的那个。我们来实现一个。

---

### 第六部分：自己实现一个"完整"的观察者模式

现在给你示范一下真正的观察者模式怎么写。目标：**让多个模块可以订阅"定时器更新"事件**。

#### 数据结构

c

```c
#define MAX_OBSERVERS 8

/* 回调函数类型 */
typedef void (*TimerCallback)(void *context);

/* 单个订阅记录 */
typedef struct {
    TimerCallback fn;      // 回调函数
    void         *context; // 用户数据（传递给回调）
    uint8_t       active;  // 是否激活
} Subscription;

/* 发布者 */
typedef struct {
    Subscription subs[MAX_OBSERVERS];
} TimerEvent;

/* 全局事件中心 */
TimerEvent tim_update_event;
```

#### 订阅 / 取消 / 发布

c

```c
/* 订阅：返回订阅 ID，-1 表示失败 */
int TimerEvent_Subscribe(TimerEvent *ev, TimerCallback fn, void *context) {
    for (int i = 0; i < MAX_OBSERVERS; i++) {
        if (!ev->subs[i].active) {
            ev->subs[i].fn = fn;
            ev->subs[i].context = context;
            ev->subs[i].active = 1;
            return i;
        }
    }
    return -1;  // 没位置了
}

/* 取消订阅 */
void TimerEvent_Unsubscribe(TimerEvent *ev, int id) {
    if (id >= 0 && id < MAX_OBSERVERS) {
        ev->subs[id].active = 0;
    }
}

/* 发布事件：通知所有订阅者 */
void TimerEvent_Publish(TimerEvent *ev) {
    for (int i = 0; i < MAX_OBSERVERS; i++) {
        if (ev->subs[i].active && ev->subs[i].fn) {
            ev->subs[i].fn(ev->subs[i].context);
        }
    }
}
```

#### 集成到 HAL 回调

c

```c
void HAL_TIM_PeriodElapsedCallback(TIM_HandleTypeDef *htim) {
    if (htim->Instance == TIM2) {
        TimerEvent_Publish(&tim_update_event);
    }
}
```

#### 使用：多个订阅者

c

```c
/* 订阅者 1：LED 模块 */
void led_on_tick(void *ctx) {
    GPIO_TypeDef *port = ((struct { GPIO_TypeDef *p; uint16_t pin; } *)ctx)->p;
    uint16_t pin = ((struct { GPIO_TypeDef *p; uint16_t pin; } *)ctx)->pin;
    HAL_GPIO_TogglePin(port, pin);
}

/* 订阅者 2：计数器模块 */
void counter_on_tick(void *ctx) {
    uint32_t *counter = (uint32_t *)ctx;
    (*counter)++;
}

/* 订阅者 3：按键扫描 */
void keyscan_on_tick(void *ctx) {
    KeyFSM *key = (KeyFSM *)ctx;
    Key_Update(key);   // 每次 tick 都更新一次按键状态机
}

/* main.c */
uint32_t system_tick_counter = 0;
KeyFSM my_button;

int main(void) {
    /* ... */
    
    TimerEvent_Subscribe(&tim_update_event, counter_on_tick, &system_tick_counter);
    TimerEvent_Subscribe(&tim_update_event, keyscan_on_tick, &my_button);
    
    HAL_TIM_Base_Start_IT(&htim2);
    
    while (1) {
        printf("Uptime: %lu ticks\r\n", system_tick_counter);
        HAL_Delay(1000);
    }
}
```

现在 LED、计数器、按键状态机**都订阅了同一个定时器事件**，定时器触发一次，三个回调全都被调用。**完全解耦**——LED 模块不知道计数器和按键的存在，反之亦然。

#### 这个模式的威力

你可以随时加新订阅者，完全不改已有代码。比如加一个"通信心跳"：

c

```c
void comm_heartbeat(void *ctx) {
    /* 每次 tick 送一个心跳包 */
}
TimerEvent_Subscribe(&tim_update_event, comm_heartbeat, NULL);
```

老的 LED、计数器、按键代码一行都不用改，新功能无缝加入。**这就是好架构带来的"可扩展性"**。

#### 什么时候用这种高级观察者？

**不是所有项目都需要**。判断标准：

- **简单项目（1~2 个响应者）**：直接用 HAL 的弱回调就够了
- **中等项目（3~5 个响应者）**：弱回调里 `switch` 分发即可
- **大项目 / 中间件 / SDK（未知数量的响应者）**：实现完整的订阅机制

核心思想：**耦合度随功能数增加呈平方增长**。两个模块互调还能管，十个模块互调就是灾难。观察者模式把"多对多"关系变成"一对多 + 多对一"，耦合度线性增长。

---

### 停下来思考

**思考 14**：`HAL_TIM_PeriodElapsedCallback` 第一个参数是 `TIM_HandleTypeDef *htim`。如果你项目里用了 TIM2 和 TIM3 两个定时器，都开了更新中断，HAL 库会生成两个回调函数吗？还是一个？你的代码里怎么区分是哪个定时器触发的？

**思考 15**：`__weak` 是一种链接器技术，它和 C++ 的虚函数都是"可重写"机制，你觉得它们的本质区别是什么？（提示：`__weak` 是**编译/链接期**决定的，虚函数是**运行期**决定的。）

**思考 16**（设计题）：假设你要写一个 **OLED 菜单系统**，菜单项需要响应按键。你会选下面哪种设计？为什么？

- **方案 A**：菜单模块直接在代码里检查 `Key_Update()` 返回值
- **方案 B**：菜单模块订阅一个"按键事件"，事件发布者在其他地方
- **方案 C**：按键模块直接调用菜单模块的函数

---

### 本课任务

#### 必做

1. **定时器中断 LED 闪烁**：用 TIM2 中断实现精确的 1Hz 闪烁，不用 HAL_Delay
2. **PWM 呼吸灯**：用 TIM3 CH1 实现呼吸效果，尝试改变呼吸速度
3. **多路 PWM**：同时用 TIM3 的 CH1、CH2（PA7）各接一个 LED，做不同相位的呼吸效果（一个变亮时另一个变暗）

#### 进阶

**进阶 1**：PWM + 状态机结合。用按键切换 LED 模式：

- 模式 A：常灭
- 模式 B：50% 常亮
- 模式 C：慢呼吸（5 秒一个周期）
- 模式 D：快闪烁（4Hz）

所有模式都通过调整 CCR 实现，不用 HAL_Delay。

**进阶 2**：用 SysTick 或 TIM2 中断 + 观察者模式，实现一个简易的**任务调度器**：

c

```c
scheduler_add_task(blink_led,       1000);  // 每 1000ms 执行一次
scheduler_add_task(update_display,   100);  // 每 100ms 执行一次
scheduler_add_task(read_sensor,      500);  // 每 500ms 执行一次
```

这个调度器本质上就是在观察者基础上加了"按不同周期触发不同订阅者"的机制。这几乎是一个最简版的 RTOS 雏形。

#### 挑战

**挑战**：用 PWM 驱动一个 **SG90 舵机**（如果你有的话），让舵机在 0°~180° 之间来回摆动。需要理解：

- 舵机要 50Hz PWM（周期 20ms），所以 PSC 和 ARR 要重新算
- 1.5ms 高电平 = 中点（90°），对应占空比 = 1.5/20 = 7.5%
- 摆动过程用状态机实现

---

### 下一课预告

下一课我们会讲 **ADC（模数转换）** —— 让 MCU 读取**模拟量**（电位器、温度、光强、电池电压等）。这是连接"数字世界"和"物理世界"的关键桥梁。

同时会讲 **DMA（直接内存访问）** —— 一种让数据在外设和内存之间"无需 CPU 介入就自动搬运"的高级机制。ADC + DMA 是采集传感器数据的黄金组合，你会看到 STM32 的真正威力。

软件模式方面，会讲 **职责链模式（Chain of Responsibility）** 和 **数据流水线（Pipeline）**——这两个模式在信号处理中非常常见。

---

做完任务来汇报：

- 定时器中断 LED 闪烁稳定吗？精度和 `HAL_Delay` 方案有差别吗？
- 呼吸灯效果怎么样？你调了哪些参数？
- 思考 14~16 你怎么想的？特别是 16 这个设计题。

你现在已经掌握了**GPIO + 中断 + UART + I2C + SPI + 定时器 + PWM + 句柄模式 + 状态机 + 观察者模式**。这套组合能做 80% 的嵌入式项目。再学完 ADC 和 DMA，你就真正"全副武装"了。🚀