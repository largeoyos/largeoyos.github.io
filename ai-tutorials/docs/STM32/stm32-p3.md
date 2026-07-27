## 第六课：定时器、PWM 与观察者模式

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

#### 此前已经用了很久的模式

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
## 第七课：ADC、DMA 与数据流设计模式

### 开场思考

你目前的 MCU 只会做一件事：**处理数字信号**。GPIO 读到的是 0 或 1，UART 收发的是字节（0~255），I2C/SPI 收发的也是字节。

但现实世界不是数字的：

- 电位器旋到一半，输出 1.65V（不是 0 也不是 3.3V）
- 光敏电阻在亮处 1kΩ，暗处 100kΩ，分压后电压从 0.3V 到 3V 渐变
- 温度传感器 LM35 输出 0~1V 正比于温度
- 麦克风输出 20Hz~20kHz 的连续波形

**问题 1**：如果你只有"读 0 或 1"的 GPIO，能测出电位器当前的位置吗？

答案当然是不能——GPIO 只能告诉你"是否超过 1.7V 的阈值"，不能告诉你"具体是多少伏"。

**问题 2**：假设你需要采集一个 1kHz 的音频信号，CPU 每 0.5ms 就要读一次数据并存起来（采样率 2kHz），同时还要处理 UART、按键、显示——CPU 忙得过来吗？

这两个问题引出了今天的两个主角：**ADC** 解决"怎么读模拟信号"的问题，**DMA** 解决"怎么不让 CPU 累死"的问题。

---

### 第一部分：ADC 的本质

#### ADC 做什么

**ADC** = **A**nalog-to-**D**igital **C**onverter，模数转换器。

一句话：**它把一个电压值，转换成一个数字**。

```
输入：0V ─────────────────── 3.3V  (连续的模拟电压)
              ↓
         ADC 转换
              ↓
输出：  0  ──────────────── 4095  (离散的数字)
```

F103 的 ADC 是 **12 位**的：

- 输入电压 0V → 输出数字 0
- 输入电压 3.3V（参考电压）→ 输出数字 4095（即 2^12 - 1）
- 中间线性对应：输出数字 = 输入电压 / 3.3V × 4095

反过来算：

实际电压=ADC读数4095×3.3V实际电压=4095ADC读数​×3.3V

#### 两个关键参数

**① 分辨率（Resolution）**

12 位意味着把 0~3.3V 分成 **4096 个档位**，每档约 **0.806 mV**。这是你能分辨的最小电压变化。

如果分辨率不够，你想测一个 100mV 以内的缓慢变化就会看不清楚。这种情况要么选更高分辨率的 ADC（16 位、24 位），要么用放大电路把信号先放大。

**② 采样率（Sampling Rate）**

ADC 每秒能做多少次转换。F103 的 ADC 最高 **1 MSPS**（Mega Samples Per Second，每秒一百万次）。

根据**奈奎斯特采样定理**：要准确重建一个频率为 f 的信号，采样率至少要 2f。所以 1MSPS 的 ADC 理论上能采集最高 500kHz 的信号。

#### ADC 的物理原理（简单说）

F103 用的是**逐次逼近型 ADC**（SAR ADC）。原理类似"二分查找"：

1. 先假设电压在中点（1.65V），输出 `1`
2. 实际和 1.65V 比较，如果实际大于 1.65V，第一位是 1；否则是 0
3. 然后在剩下的区间继续二分...
4. 12 位需要 12 次比较

这就像猜数字游戏：猜 1~100 之间的数，"大了""小了"地二分，7 次必中。

**为什么每次采样需要一点时间**：硬件比较需要稳定的输入电压，所以每次转换前要先"采样并保持"（Sample & Hold）。F103 上一次完整转换大约 1~15 微秒，由你配置。

---

### 第二部分：第一个 ADC 实验——读电位器

#### 硬件准备

接一个 **10kΩ 电位器**（淘宝 1 块钱一个）：

```
3.3V ─┬─ 电位器 ─── GND
      │     │
      │  中间抽头
      │     │
      └─────┴──── PA0 (ADC 通道 0)
```

电位器是一个"可变分压器"，中间抽头的电压在 0V~3.3V 之间随旋钮位置变化。

**没有电位器也行**——用两根杜邦线，一根接 3.3V 一根接 GND，用它们的金属端轮流碰 PA0，你会看到读数在最大最小之间跳变。甚至可以用手指捏住一根接 PA0 的裸线，感受"人体天线"造成的读数波动（这其实是个不错的物理实验）。

#### F103 的 ADC 资源

F103C8T6 有 2 个 ADC（ADC1、ADC2），每个 ADC 有 **10 个外部输入通道**：

|通道|引脚|
|---|---|
|CH0|PA0|
|CH1|PA1|
|CH2|PA2|
|CH3|PA3|
|CH4|PA4|
|CH5|PA5|
|CH6|PA6|
|CH7|PA7|
|CH8|PB0|
|CH9|PB1|

一个 ADC 在任意时刻**只能转换一个通道**，但可以快速"轮询"多个通道。

#### CubeMX 配置

新建工程 `ADC_Pot`：

1. 基础配置（HSE、SWD、72MHz、PC13 LED、USART1+printf）
2. 左侧 `Analog` → `ADC1`：
    - `IN0`：勾选 **`ADC1 Channel 0`**（启用 PA0 通道）
3. 展开 `Parameter Settings`：
    - `Continuous Conversion Mode`：`Disabled`（每次手动触发转换）
    - `Discontinuous Conversion Mode`：`Disabled`
    - `External Trigger Conversion Source`：`Regular Conversion launched by software`（软件触发）
    - `Rank 1 → Channel`：`Channel 0`
    - `Sampling Time`：`55.5 Cycles`（采样时间，下面详述）
4. 确认 PA0 变成了 `ADC1_IN0`
5. 生成代码

#### 关于"采样时间"

采样时间是 ADC 在开始转换前，让内部采样电容充电的时间。太短会采不准，太长浪费时间。

F103 总转换时间 = 采样时间 + 12.5 个 ADC 时钟周期。

在大多数应用下，`55.5 Cycles` 是个不错的默认值——既准确又不慢。如果你测量高阻抗信号（比如 MΩ 级别的），需要选更长的采样时间让电容充分充电。

#### 最简单的 ADC 读取

c

```c
uint32_t ReadADC(void)
{
    HAL_ADC_Start(&hadc1);                       // 启动一次转换
    HAL_ADC_PollForConversion(&hadc1, 100);      // 等待转换完成（最多100ms）
    uint32_t value = HAL_ADC_GetValue(&hadc1);   // 读结果
    HAL_ADC_Stop(&hadc1);                        // 停止
    return value;
}

int main(void)
{
    /* ... 初始化 ... */

    while (1) {
        uint32_t raw = ReadADC();
        float voltage = (float)raw * 3.3f / 4095.0f;
        printf("ADC: %4lu  Voltage: %.3fV\r\n", raw, voltage);
        HAL_Delay(200);
    }
}
```

烧录，旋转电位器，串口终端应该看到读数和电压在 0~3.3V 之间变化。

#### 这段代码的两个问题

##### 问题 1：轮询阻塞

`HAL_ADC_PollForConversion` 是**阻塞的**——CPU 傻等 ADC 转换完成。对 55.5 个周期 + 12.5 周期 @ 14MHz ≈ 4.9μs 来说不算长，但如果你要连续采样 1000 个点，就是 5ms 的纯 CPU 等待时间。

##### 问题 2：我们只采了一个通道

如果你要同时采集电位器、温度、光敏电阻、电池电压……每次都要切换通道、启动、等待、读取——代码变成循环嵌套的噩梦。

这两个问题有一个漂亮的解法，就是今天的重头戏——**DMA**。

---

### 第三部分：DMA——嵌入式里的"自动搬运工"

#### 先看一个类比

想象你是一个秘书，早上收到 100 封邮件需要处理。你有两个选择：

**方案 A**：每一封邮件，你亲自走到打印机旁边，按打印键，把纸拿起来，放到文件夹里。重复 100 次。

**方案 B**：你对打印机说"把这 100 封邮件全部打印，按顺序放进这个文件夹"，然后你去处理别的事。打印机搞定后通知你："都打好了。"

**方案 B 就是 DMA 的思想**。

#### DMA 是什么

**DMA** = **D**irect **M**emory **A**ccess，直接内存访问。

它是 STM32 芯片里独立于 CPU 的一个硬件模块，专门干一件事——**在两个地方之间搬运数据**。这两个地方可以是：

- 外设寄存器 ↔ 内存（比如 ADC 结果 → RAM 缓冲区）
- 内存 ↔ 外设寄存器（比如 RAM 缓冲区 → UART 发送寄存器）
- 内存 ↔ 内存（比如 memcpy）

**关键点**：**DMA 搬运数据时 CPU 完全不参与**。CPU 可以同时做别的事，搬运完成后 DMA 通过中断通知 CPU。

#### DMA 的"配置菜单"

告诉 DMA 干活之前，你要填几张表：

1. **源地址**：从哪搬（比如 ADC 的数据寄存器地址 `&ADC1->DR`）
2. **目标地址**：搬到哪（比如你的 RAM 数组 `adc_buffer`）
3. **数据宽度**：一次搬 8/16/32 位
4. **搬运数量**：一共搬多少次
5. **方向**：外设→内存，还是内存→外设，还是内存→内存
6. **源地址是否递增**：源是外设寄存器就不增（每次都从同一个地方读），源是内存就递增
7. **目标地址是否递增**：同上
8. **循环模式**：搬完一轮要不要自动重来

配好之后按"启动"，DMA 就自己干活去了。

#### 最经典的组合：ADC + DMA

现在我们用 DMA 实现一个梦幻组合——**ADC 连续采样，结果自动存到数组里，CPU 完全不用管**。

**思路**：

1. 把 ADC 设为"连续转换模式"（转完一个自动开始下一个）
2. 每次转换完成，ADC 把结果放到 `ADC1->DR` 寄存器
3. DMA 被设成"检测到 ADC 完成事件，自动把 `ADC1->DR` 的值搬到 `adc_buffer[i]`，然后 i++"
4. 搬到 `adc_buffer` 末尾后，DMA **自动绕回开头**（循环模式）
5. 主循环想用数据时，直接访问 `adc_buffer` 即可——数据永远是最新的

**CPU 在这整个过程中完全没参与转换和搬运**。

---

### 第四部分：多通道 ADC + DMA 实战

我们来做一个更复杂的例子——**同时采集 3 个通道**（PA0 电位器、PA1 光敏、PA4 温度，没有的通道用杜邦线短接 3.3V 模拟一下）。

#### CubeMX 配置

新建工程 `ADC_DMA_Multi`：

1. 基础配置（同上）
2. `Analog` → `ADC1`：
    - 勾选 **`IN0`**、**`IN1`**、**`IN4`**（三个通道）
3. `Parameter Settings`：
    - **`Scan Conversion Mode`**：**`Enabled`**（扫描模式——一次转换多个通道）
    - **`Continuous Conversion Mode`**：**`Enabled`**（连续转换——转完自动重启）
    - `Discontinuous Conversion Mode`：`Disabled`
    - `Number Of Conversion`：**`3`**（总共 3 个通道）
    - 展开后配置每一个 Rank：
        - `Rank 1 Channel`：`Channel 0`
        - `Rank 2 Channel`：`Channel 1`
        - `Rank 3 Channel`：`Channel 4`
        - 每个的 `Sampling Time`：`55.5 Cycles`
4. 切换到 **`DMA Settings`** 选项卡：
    - 点击 `Add`
    - `DMA Request`：`ADC1`
    - `Channel`：`DMA1 Channel 1`（F103 固定分配）
    - `Direction`：`Peripheral To Memory`
    - `Mode`：**`Circular`**（循环模式——转完绕回开头）
    - `Peripheral`：`Data Width` = `Half Word`（16 位），`Increment Address` = **不勾**（外设地址不变）
    - `Memory`：`Data Width` = `Half Word`（16 位），`Increment Address` = **勾选**（内存地址递增）
5. `NVIC Settings`：勾选 `DMA1 Channel1 global interrupt`（可选，我们演示循环模式不需要严格依赖中断）
6. 生成代码

#### 理解这些配置

让我把最关键的几个配置用图解释清楚：

**扫描模式（Scan Mode）**：ADC 自动按顺序采样 Rank 1 → Rank 2 → Rank 3，像一个吸尘器依次扫过 3 个地方。

**连续模式（Continuous Mode）**：扫完一轮立即重新开始，永不停歇。

**循环模式（Circular DMA）**：

```
adc_buffer[0]  adc_buffer[1]  adc_buffer[2]
  (CH0)           (CH1)          (CH4)
    ↑              ↑              ↑
  DMA ──────────→ DMA ──────→ DMA ──────┐
    ↑                                    │
    └──────────────绕回──────────────────┘
```

DMA 填满 3 个元素后自动回到起点，覆盖写入新数据。**`adc_buffer` 里永远保存着三个通道的最新值**。

**半字（Half Word, 16位）**：ADC 结果是 12 位，用 16 位容器刚好装下。

**外设地址不变**：`ADC1->DR` 的地址是固定的，DMA 每次都从同一个地址读。

**内存地址递增**：`adc_buffer[0]` → `adc_buffer[1]` → `adc_buffer[2]`，DMA 写一次地址+2（因为 16 位）。

#### 代码

c

```c
#define ADC_CH_COUNT 3
volatile uint16_t adc_buffer[ADC_CH_COUNT];   // DMA 的目标缓冲区

int main(void)
{
    /* ... 初始化 ... */

    /* 启动 ADC + DMA，数据会自动流进 adc_buffer */
    HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_buffer, ADC_CH_COUNT);

    while (1) {
        float v0 = adc_buffer[0] * 3.3f / 4095.0f;
        float v1 = adc_buffer[1] * 3.3f / 4095.0f;
        float v4 = adc_buffer[2] * 3.3f / 4095.0f;

        printf("CH0=%.3fV  CH1=%.3fV  CH4=%.3fV\r\n", v0, v1, v4);
        HAL_Delay(200);
    }
}
```

就这样。CPU 唯一的工作是打印——ADC 采样、DMA 搬运、数据更新全部自动进行。旋转电位器，你会看到读数实时变化，完全不卡。

#### 注意 `adc_buffer` 必须是 `volatile`

为什么？因为 DMA 是**硬件**在背后偷偷修改 `adc_buffer` 里的值。从 CPU 的角度看，没人在代码里改它，但实际上它在变——这完美符合 `volatile` 的使用场景。

这和你第一课学的 `volatile` 用于寄存器的理由一样——**底层值会被你看不见的力量修改**。

#### 停下来思考

**思考 17**：你觉得用 DMA 的 ADC 和不用 DMA 的 ADC，CPU 负载差多少？如果采样率是 100kHz，差异有多大？

（答：100kHz 意味着每 10μs 采一次。不用 DMA 每次采样 CPU 都要去读一下，每秒 10 万次中断 + 读取，CPU 基本忙不过来。用 DMA 后 CPU 几乎 0 负载，想做什么都行。）

**思考 18**：`HAL_ADC_Start_DMA` 启动之后永远不停止，CPU 怎么确保读到的是"完整的一轮"数据？（比如采样途中，DMA 可能正在写 adc_buffer[1]，CPU 同时读，会不会读到新旧混合的数据？）

（答：对于这种"原子 16 位读取"，单个通道的值不会撕裂，但**不同通道之间**可能不是同一轮采集的。如果对"快照一致性"要求严格，可以用"半传输中断 + 传输完成中断"做双缓冲，或者禁用 DMA 再读。）

---

### 第五部分：UART + DMA——把"发送 printf"也解放

ADC + DMA 是输入方向。现在看一个输出方向的经典组合——**UART 用 DMA 发送**。

#### 为什么要这么做

回顾你之前的 `printf`：

c

```c
int _write(int file, char *ptr, int len) {
    HAL_UART_Transmit(&huart1, (uint8_t*)ptr, len, HAL_MAX_DELAY);
    return len;
}
```

`HAL_UART_Transmit` 是**阻塞**的。`printf("Hello World\r\n")` 长度 14，在 115200 波特率下耗时 14 × 87μs ≈ 1.2ms。**这 1.2ms 里 CPU 完全傻等**。

在追求性能的实时系统里，1.2ms 是个巨大的数字——可能比你的主循环周期还长。

#### 用 DMA 发送的效果

改用 DMA 之后：

1. CPU 告诉 DMA："把 `ptr` 地址开始的 14 字节搬到 `USART1->DR` 寄存器"
2. CPU **立即返回**，继续做别的
3. DMA 在后台一个字节一个字节地把数据塞给 UART
4. UART 按波特率慢慢发出去
5. 全部发完后 DMA 触发"传输完成"中断

**`printf` 从阻塞 1.2ms 变成阻塞几微秒**。

#### CubeMX 配置

在之前的 UART 工程基础上：

1. `USART1` → `DMA Settings`：
    - `Add` → 选 `USART1_TX`
    - `Channel`：`DMA1 Channel 4`（F103 固定分配）
    - `Direction`：`Memory To Peripheral`
    - `Mode`：`Normal`（不要循环，每次发送是一次性的）
    - `Peripheral`：`Byte`，**不递增**
    - `Memory`：`Byte`，**递增**
2. `NVIC Settings`：勾选 `USART1 global interrupt`（发送完成回调需要）

#### 代码

c

```c
int _write(int file, char *ptr, int len)
{
    /* 等上一次 DMA 传输完成 */
    while (HAL_UART_GetState(&huart1) != HAL_UART_STATE_READY);

    HAL_UART_Transmit_DMA(&huart1, (uint8_t*)ptr, len);
    return len;
}
```

等等——这不还是在等吗？

确实，为了保证 `printf` 调用不丢数据，我们必须等上一次传完再发下一次。但**等待的时间是紧挨着下一次 `printf` 的间隙**，如果两次 `printf` 中间 CPU 做了很多事，实际基本不用等。

#### 更好的方案：发送环形缓冲区

终极异步 `printf`：

c

```c
RingBuffer tx_rb;

int _write(int file, char *ptr, int len) {
    for (int i = 0; i < len; i++) {
        while (!RB_Write(&tx_rb, ptr[i])) {
            /* 缓冲区满了，等一下 */
        }
    }
    /* 启动 DMA 搬运环形缓冲区的连续块到 UART */
    TryStartDMA();
    return len;
}
```

`printf` 只是往环形缓冲区塞字节，立即返回。一个后台任务（或 DMA 完成中断）负责把缓冲区里的数据搬给 UART 发送。这是高性能日志系统的经典架构。

实现起来细节较多（环形缓冲区的"最大连续块"计算、DMA 完成后的续发逻辑），这里先不展开，作为挑战题留给你。

---

### 第六部分：数据流水线（Pipeline）设计模式

现在进入这一课的软件部分。

#### 问题场景

假设你在做一个**温度监测系统**：

1. ADC 采集热敏电阻的电压
2. 根据查表算出摄氏温度
3. 去除异常值（比如突变超过 10°C 认为是噪声）
4. 做一个滑动平均滤波
5. 显示到 OLED
6. 如果超过阈值，报警

直观的写法是一串函数调用：

c

```c
void main_loop() {
    uint16_t raw = read_adc();
    float temp = voltage_to_temp(raw * 3.3f / 4095.0f);
    float valid = reject_outliers(temp);
    float smoothed = moving_average(valid);
    update_display(smoothed);
    check_alarm(smoothed);
}
```

这种写法可以工作，但存在以下问题：

- **模块紧耦合**：`main_loop` 知道所有细节，想插一个"记录到 Flash"的步骤要改主函数
- **不能灵活组合**：如果另一个系统要用同样的数据，但不需要显示和报警，代码要复制改
- **测试困难**：每个步骤不独立，无法单独测试

#### 流水线模式的思想

把数据处理想象成**工厂的流水线**：每个工位（Stage）只做一件事，数据从一个工位流到下一个，最终变成成品。

```
原始ADC ── [电压转换] ── [异常剔除] ── [滤波] ── [显示]
                                              └── [报警]
                                              └── [记录]
```

每个 Stage 是**独立的**：输入什么、输出什么、内部怎么处理。整条流水线是**可组合的**：想加一个 Stage 就插进去，想去掉一个 Stage 就拿掉。

#### 代码实现

先定义流水线的基本结构：

c

```c
/* 流水线数据项（样本）*/
typedef struct {
    uint16_t raw_adc;       // 原始 ADC 值
    float    voltage;       // 电压
    float    temperature;   // 温度
    uint8_t  valid;         // 是否有效
    uint32_t timestamp;     // 采集时间戳
} TempSample;

/* 一个 Stage 就是一个处理函数 */
typedef void (*StageFn)(TempSample *sample, void *context);

typedef struct {
    StageFn fn;
    void   *context;
    const char *name;   // 调试用
} PipelineStage;

#define MAX_STAGES 16

typedef struct {
    PipelineStage stages[MAX_STAGES];
    uint8_t       count;
} Pipeline;

/* 添加 stage */
void Pipeline_AddStage(Pipeline *pl, StageFn fn, void *ctx, const char *name) {
    if (pl->count < MAX_STAGES) {
        pl->stages[pl->count].fn = fn;
        pl->stages[pl->count].context = ctx;
        pl->stages[pl->count].name = name;
        pl->count++;
    }
}

/* 运行流水线：让 sample 依次经过所有 stage */
void Pipeline_Run(Pipeline *pl, TempSample *sample) {
    for (uint8_t i = 0; i < pl->count; i++) {
        pl->stages[i].fn(sample, pl->stages[i].context);
        if (!sample->valid) break;   // 无效样本提前退出
    }
}
```

#### 实现各个 Stage

c

```c
/* Stage 1：ADC 读取 */
void stage_read_adc(TempSample *s, void *ctx) {
    s->raw_adc = adc_buffer[0];       // 从 DMA 缓冲区拿
    s->timestamp = HAL_GetTick();
    s->valid = 1;
}

/* Stage 2：电压换算 */
void stage_calc_voltage(TempSample *s, void *ctx) {
    s->voltage = s->raw_adc * 3.3f / 4095.0f;
}

/* Stage 3：电压→温度 */
void stage_voltage_to_temp(TempSample *s, void *ctx) {
    /* 假设 LM35: 10mV / °C */
    s->temperature = s->voltage * 100.0f;
}

/* Stage 4：异常值剔除（带状态，用 context 存上次值）*/
typedef struct {
    float last_temp;
    uint8_t initialized;
} OutlierCtx;

void stage_reject_outlier(TempSample *s, void *ctx) {
    OutlierCtx *oc = (OutlierCtx*)ctx;
    if (!oc->initialized) {
        oc->last_temp = s->temperature;
        oc->initialized = 1;
        return;
    }
    if (fabsf(s->temperature - oc->last_temp) > 10.0f) {
        s->valid = 0;  // 标记无效
    } else {
        oc->last_temp = s->temperature;
    }
}

/* Stage 5：滑动平均 */
#define MA_SIZE 16
typedef struct {
    float buf[MA_SIZE];
    uint8_t idx;
    uint8_t count;
} MACtx;

void stage_moving_avg(TempSample *s, void *ctx) {
    MACtx *ma = (MACtx*)ctx;
    ma->buf[ma->idx] = s->temperature;
    ma->idx = (ma->idx + 1) % MA_SIZE;
    if (ma->count < MA_SIZE) ma->count++;

    float sum = 0;
    for (uint8_t i = 0; i < ma->count; i++) sum += ma->buf[i];
    s->temperature = sum / ma->count;
}

/* Stage 6：打印 */
void stage_print(TempSample *s, void *ctx) {
    printf("T=%.2f°C (raw=%u)\r\n", s->temperature, s->raw_adc);
}

/* Stage 7：报警 */
void stage_alarm(TempSample *s, void *ctx) {
    float threshold = *(float*)ctx;
    if (s->temperature > threshold) {
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET); // 点灯报警
    } else {
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET);
    }
}
```

#### 组装和使用

c

```c
int main(void)
{
    /* ... 初始化 ... */
    HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_buffer, 3);

    Pipeline pl = {0};
    OutlierCtx outlier_ctx = {0};
    MACtx ma_ctx = {0};
    float alarm_threshold = 50.0f;

    Pipeline_AddStage(&pl, stage_read_adc,          NULL,            "read");
    Pipeline_AddStage(&pl, stage_calc_voltage,      NULL,            "voltage");
    Pipeline_AddStage(&pl, stage_voltage_to_temp,   NULL,            "temp");
    Pipeline_AddStage(&pl, stage_reject_outlier,    &outlier_ctx,    "outlier");
    Pipeline_AddStage(&pl, stage_moving_avg,        &ma_ctx,         "smooth");
    Pipeline_AddStage(&pl, stage_print,             NULL,            "print");
    Pipeline_AddStage(&pl, stage_alarm,             &alarm_threshold,"alarm");

    while (1) {
        TempSample sample = {0};
        Pipeline_Run(&pl, &sample);
        HAL_Delay(100);
    }
}
```

#### 这样设计的价值

**① 每个 Stage 独立**：想测试 `stage_moving_avg`？给它一个假数据直接调用，不用启动整个系统。

**② 灵活重组**：想去掉报警？删一行 `AddStage`。想加"记录到 Flash"？加一个 `stage_log_to_flash` 并插入。

**③ 不同场景复用**：

- 调试版流水线：读取 → 转换 → 打印（不要滤波和报警，方便看原始数据）
- 发布版流水线：完整 7 个 stage
- 测试版流水线：从文件读测试数据 → 滤波 → 输出（用于离线验证滤波算法）

所有 Stage 代码完全不变，只改 `AddStage` 的组合。

**④ 每个 Stage 只读写 `sample`**：模块间完全通过数据传递通信，不互相调用，耦合度极低。

#### 这个模式在哪里见过？

你每天都在用：

- **Unix 管道**：`cat file.txt | grep error | sort | uniq`——每个命令是一个 Stage
- **编译器**：词法分析 → 语法分析 → 语义分析 → 优化 → 代码生成
- **图形处理**：OpenGL/Vulkan 的渲染管线
- **网络协议栈**：物理层 → 数据链路层 → 网络层 → 传输层 → 应用层
- **FastAPI/Express 中间件**：每个 middleware 是一个 Stage

**嵌入式系统里，数据采集和信号处理天然是流水线结构**。学会这个思维，你的代码立刻上一个层次。

---

### 停下来思考

**思考 19**：流水线模式和观察者模式有什么区别？它们分别适合什么场景？

（提示：流水线是"数据依次流过各阶段"，各阶段**有顺序**且会**修改数据**；观察者是"一个事件通知多个订阅者"，订阅者**平行**响应且**不依赖彼此**。）

**思考 20**：在上面的流水线里，`stage_reject_outlier` 需要记住"上次的值"，所以用了 `OutlierCtx` 结构体存状态。这其实又是**句柄模式**的应用——每个 Stage 有自己的上下文。想想看，如果你想同时有两条流水线处理两个不同的温度传感器，这个设计能支持吗？为什么？

（答：能支持。给每条流水线各一个 `OutlierCtx` 和 `MACtx` 实例，互不干扰。这就是句柄模式的威力——实例化多份就能复用同一段代码。）

**思考 21**（架构题）：假设在上面的系统里，ADC 采样率提高到 10kHz（每 100μs 一次），同时你又要显示、通信、控制电机。流水线每次都完整跑一遍可能跑不及。你会怎么设计？

（提示：分层处理——高速部分在中断/DMA 里做（采样+基本滤波），降采样后送给低速流水线（显示+通信+报警）。这叫"**多速率处理**"，是信号处理中的常见技术。）

---

### 本课任务

#### 必做

1. **单通道 ADC 轮询**：读电位器，计算电压，串口打印
2. **多通道 ADC + DMA**：3 个通道同时采集，DMA 循环模式，主循环直接读缓冲区
3. **UART + DMA 发送**：重定向 `printf` 用 DMA，对比发送大量数据时的响应速度

#### 进阶

**进阶 1**：实现一个完整的**温度监测流水线**，包括你上面看到的 7 个 Stage。可以用读电位器模拟"温度"——电位器旋到中间就是常温，旋到两端就是高温/低温。

**进阶 2**：在流水线上加一个 **FFT 分析 Stage**。简单做法：采集 256 个 ADC 点，做 FFT（用 ARM CMSIS-DSP 库），找出主频。这能让你的 MCU "听"到输入信号是什么频率。

#### 挑战

**挑战 1**：异步 printf。用环形缓冲区 + UART DMA，让 `printf` 完全非阻塞。`printf` 只是把字符塞进环形缓冲区，后台任务持续启动 DMA 发送。测试：连续调用 10 次 `printf`，总耗时应该只有几十微秒（而不是阻塞的几毫秒）。

**挑战 2**：音频采样分析仪。用 ADC + DMA 以 10kHz 采样一个麦克风模块（或者电位器手动晃动），屏幕实时显示波形（需要 OLED 或者 ASCII 艺术显示在串口）。这是一个麻雀虽小五脏俱全的数据采集系统。

---

### 思考总结：你现在拥有的"内功"

至此已经掌握的核心能力包括：

**硬件外设**

- GPIO（输入/输出/上下拉/推挽/开漏）
- 外部中断（EXTI）
- UART（轮询/中断/DMA）
- I2C（主机模式/扫描/EEPROM）
- SPI（全双工/W25Q Flash）
- 定时器（基本计数/PWM）
- ADC（单通道/多通道/DMA）
- DMA（外设-内存/内存-外设）

**软件思想**

- 位运算和寄存器操作
- `volatile` 和编译器优化
- 中断驱动编程
- 环形缓冲区
- 句柄模式（Handle Pattern）
- 状态机（Finite State Machine）
- 观察者模式（Observer Pattern）
- 数据流水线（Pipeline）

**这些足够你独立完成绝大多数中等复杂度的嵌入式项目**。

---

### 下一课预告

到这里我们完成了"**单片机核心外设 + 基础软件架构**"的学习。接下来我们有几个可能的方向：

**方向 A：CAN 总线**（你一开始提到的通信协议，在汽车、工业控制里极其常用） **方向 B：RTOS 基础**（FreeRTOS，任务调度、信号量、消息队列） **方向 C：一个完整的综合项目**（把已学的全部用上，比如一个"智能环境监测站"） **方向 D：继续讲设计模式**（命令模式、工厂模式、依赖注入，结合嵌入式场景） **方向 E：迁移到 H723**（体验真正"大芯片"的威力，FDCAN、DMA 2D、Cache 等）

完成本课任务后应验证：

- ADC + DMA 搞定了吗？你看到采样数据"自动更新"是什么感觉？
- 流水线模式你觉得怎么样？能想到自己项目里哪里能用吗？
- 思考 17~21 你是怎么答的？
- 你想下一课走哪个方向？

**你现在已经从"看代码能看懂"迈入"能独立架构"的阶段了**。这一步跨过，你就是一个真正的嵌入式工程师，而不只是一个"会用 HAL 库的学生"。💪

## 第八课：CAN 总线

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

实际配置时，CubeMX 会提供参数计算器，无需手算。理解该公式有助于判断通信失败的原因，其中常见问题是两端波特率不一致。

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

至此已经学习 I2C、SPI、CAN 三种总线，三者对比如下：

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

至此已经学习 **GPIO / EXTI / UART / I2C / SPI / Timer / PWM / ADC / DMA / CAN** 这 10 个核心外设，以及 **句柄模式 / 状态机 / 观察者模式 / 流水线** 这 4 种核心设计思想。

这是嵌入式开发的一套**完整武器**。

后续可选择以下方向：

**方向 B：RTOS（FreeRTOS）** — 从"单线程 + 中断"升级到"多任务并发"。这是商业项目的必备技能。

**方向 C：综合项目** — 把已学的全部用起来，做一个完整的小项目（比如"智能家居中控"、"数据记录仪"）。在项目里你会真正体会各种设计模式的价值。

**方向 D：更多设计模式** — 命令模式、工厂模式、依赖注入、单例模式，结合嵌入式场景深入讲。

**方向 E：迁移到 H723** — 开始玩你那块"怪兽级"芯片，体验 FDCAN、DMA 2D、Cache、双核（H723 单核但很多思想通用）。

完成任务后应验证：

- 两块板子能 CAN 通信吗？遇到什么问题？
- 思考 1~7 你的答案是什么？特别是思考 6 和 7，它们考察设计直觉。
- 下一步你想走哪个方向？

**顺带一个深层思考题——你发现没有，每门新的通信协议（UART/I2C/SPI/CAN），我们都会用到句柄模式、状态机和观察者模式？** 这不是巧合。你现在应该能感受到，**设计模式是工具，不是知识点——它们在解决真实工程问题时反复出现，因为问题的本质是相同的**。

这种"**举一反三**"的能力，才是嵌入式工程师最核心的竞争力。👏
