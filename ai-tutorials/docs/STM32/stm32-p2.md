# 第二课：GPIO 输入、按键与中断

上一课你已经让 LED 闪起来了——这意味着你已经能**让 MCU 对外输出**了。这一课我们反过来：**让 MCU 感知外部世界**。这一步走通，你就真正进入"交互式嵌入式"的世界。

在开始之前，先让我猜一下你对按键的直觉，看看准不准。

---

### 先想一个问题

假设你面前有一个按键，一端接 PA0，另一端接 GND（就是我们上一课讲过的"按下变低"接法）。你要写代码：**按键按下，LED 亮；按键松开，LED 灭**。

**请你先别往下看**，花 30 秒想想：你会怎么写这个 `while(1)` 循环里的逻辑？用伪代码或自然语言描述一下。

...

...

我猜你的答案是这样的：

c

```c
while (1) {
    if (读到 PA0 == 0) {           // 按下
        LED 亮;
    } else {                        // 松开
        LED 灭;
    }
}
```

这个思路**完全正确**，这种方式叫做**轮询（Polling）**——CPU 不停地问："按了吗？按了吗？按了吗？"。我们先用这种方式实现一遍，然后你会亲身体验它的问题，再引出**中断**这个更优雅的方案。

---

### 第一部分：轮询方式读按键

#### 硬件接法

F103C8T6 蓝药丸板上**没有板载按键**，你需要自己接一个。最简单的方式：

```
        PA0  ───┐
                 │
                 ├── 轻触按键 ── GND
                 │
       (内部)    │
   上拉电阻 ─── 3.3V    ← 我们用 MCU 内部上拉，不用外接电阻
```

你只需要用两根杜邦线，把一个轻触按键的两个引脚分别连到板子的 **PA0** 和 **GND** 即可。没有按键也没关系，用一根杜邦线，一端固定在 GND，另一端去碰一下 PA0，效果一样。

**为什么用上拉？** 回忆一下上一课题 6 的规律：按键另一端接 GND，就用上拉（默认高，按下变低）。

#### CubeMX 配置

在上一课的工程基础上修改（或者新建一个工程，推荐新建一个叫 `Button_Poll` 的工程，保留 LED 的那个工程不动）：

1. 点击 PA0，选 `GPIO_Input`
2. 在 GPIO 配置页，PA0 这一行：
    - `GPIO Pull-up/Pull-down`：**`Pull-up`**（启用内部上拉电阻）
    - `User Label`：`BUTTON`
3. PC13 保持之前的 LED 配置不变
4. 重新生成代码

现在在 `main.h` 里你会看到：

c

```c
#define BUTTON_Pin GPIO_PIN_0
#define BUTTON_GPIO_Port GPIOA
#define LED_Pin GPIO_PIN_13
#define LED_GPIO_Port GPIOC
```

#### 写代码

在 `main.c` 的 `while(1)` 里：

c

```c
while (1)
{
    if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
        // 按键按下（读到 0）→ 点亮 LED（回忆一下：PC13 是低电平点亮）
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_RESET);
    } else {
        // 按键松开（读到 1）→ 熄灭 LED
        HAL_GPIO_WritePin(LED_GPIO_Port, LED_Pin, GPIO_PIN_SET);
    }
}
```

#### 关键 API 解读

**`HAL_GPIO_ReadPin(GPIOx, Pin)`**：读取引脚当前电平，返回 `GPIO_PIN_SET`（1）或 `GPIO_PIN_RESET`（0）。内部就是读 `GPIOx->IDR` 寄存器的对应位：

c

```c
GPIO_PinState HAL_GPIO_ReadPin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin) {
    if ((GPIOx->IDR & GPIO_Pin) != 0x00u) {
        return GPIO_PIN_SET;
    } else {
        return GPIO_PIN_RESET;
    }
}
```

`IDR` = Input Data Register，输入数据寄存器。它是 `volatile` 的，每次读取都反映**当前这一刻**引脚的真实电平。

**`HAL_GPIO_WritePin(GPIOx, Pin, State)`**：设置引脚输出电平。

编译、烧录，按按键，LED 应该会跟随你的操作亮灭。

---

### 第二部分：你会遇到的两个坑

#### 坑 1：按键抖动（Debounce）

把上面代码改一下，实现**每按一次按键，LED 翻转一次**：

c

```c
while (1)
{
    if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
    }
}
```

烧进去你会发现：**LED 疯狂闪烁**，根本不受控制。

**为什么？** 因为你的 `while(1)` 以几千万次每秒的速度在跑，你按一下按键大概持续 100 毫秒，这期间循环执行了几百万次，`Toggle` 被调用几百万次——LED 就疯狂翻转。

你可能会想到加一个"按下时等待松开"的逻辑：

c

```c
while (1)
{
    if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        // 等待松开，避免一直翻转
        while (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET);
    }
}
```

烧进去，现在好多了——按一下亮，再按一下灭。**但偶尔会发现**：你按一次，LED 却"跳"了好几次，行为不可预测。

这就是**按键抖动**。物理按键按下的瞬间，机械触点不是"啪"一下稳定接触的，而是在几毫秒内**高速震荡**（真的是物理震荡，金属片弹跳）。示波器上看起来像这样：

```
电压
3.3V ────┐    ┌─┐ ┌┐  ┌─┐              ┌──────
         │    │ │ ││  │ │              │
0V       └────┘ └─┘└──┘ └──────────────┘
         ↑                             ↑
       按下瞬间的抖动               松开瞬间的抖动
       （持续 5~20ms）               （也会抖动）
```

你的代码可能把一次按下误判成好几次按下。

**解决方法**：**消抖（Debounce）**。思路很简单——**检测到按下后，等一会儿再确认**，如果这会儿还是按下状态，才认为是真的按下。

c

```c
while (1)
{
    if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
        HAL_Delay(20);   // 等 20ms，让抖动过去
        if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
            // 再确认一次，还是按下的话才认
            HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
            // 等松开
            while (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET);
            HAL_Delay(20);   // 松开后也要消抖
        }
    }
}
```

现在行为应该稳定了：**按一次，LED 翻一次**。

**但是⋯⋯** 这个代码有一个更大的问题，你看出来了吗？想一下再往下看。

#### 坑 2：CPU 被按键"绑架"了

当你按住按键不放时，这一行会发生什么：

c

```c
while (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET);
```

CPU 会**死等**在这里，直到你松开按键。这期间 CPU **什么也做不了**——LED 闪烁（如果还有）会停、串口收数据会丢、其他任何任务都被阻塞。

推广一下——整个 `while(1)` + `HAL_Delay` + 轮询按键的模式，有一个根本性缺陷：

> **CPU 大部分时间在"傻等"，按键没按时它浪费循环周期查询，`HAL_Delay` 里它完全发呆。**

这在只有一个按键、一个 LED 的小程序里没事，但一旦你要同时处理**按键 + LED 闪烁 + 串口通信 + 传感器采集**，轮询就乱成一锅粥了。

**有没有办法让"按键按下"这件事主动来打扰 CPU，而不是 CPU 一直去问？**

有。这就是**中断（Interrupt）**。

---

### 第三部分：中断——嵌入式的灵魂机制

#### 用生活类比

想象你在家写作业。你有两种方式知道快递到了：

**方式 A（轮询）**：每隔 30 秒跑到门口看一眼有没有快递。你大部分时间在跑来跑去浪费精力，而且还可能错过（跑回书桌的时候快递员刚到）。

**方式 B（中断）**：装一个门铃。你专心写作业，门铃一响你立刻放下笔去开门，处理完回来继续写。**门铃就是中断源，你听到门铃后的反应就是中断服务函数（ISR）。**

中断的核心优势：

1. **响应快**：事件发生的那一刻 CPU 立刻处理，没有延迟
2. **CPU 不浪费**：不用反复查询，可以去做别的事
3. **事件驱动**：程序结构更清晰，谁触发谁响应

#### STM32 的中断机制（简化版）

STM32 里有一个叫 **NVIC**（Nested Vectored Interrupt Controller，嵌套向量中断控制器）的硬件模块，它的工作流程是：

```
    外部事件发生
（按键按下 / 定时器溢出 / 串口收到数据 / ...）
         ↓
    硬件检测到
         ↓
  NVIC 告诉 CPU："有中断！"
         ↓
  CPU 保存当前执行的位置（压栈）
         ↓
  CPU 跳转到对应的中断服务函数（ISR）
         ↓
     执行 ISR 里的代码
         ↓
  ISR 执行完，CPU 恢复之前的位置（出栈）
         ↓
      继续原来的工作
```

整个过程对你写的 `main` 函数来说是**透明的**——你甚至感觉不到 CPU 离开过。

#### GPIO 的中断：EXTI（External Interrupt）

STM32 的 GPIO 引脚可以配置成"**当电平变化时触发中断**"，这个机制叫 EXTI（External Interrupt）。

具体来说，你可以配置让某个引脚在以下情况触发中断：

- **上升沿**（Rising Edge）：电平从 0 变到 1 的那一刻
- **下降沿**（Falling Edge）：电平从 1 变到 0 的那一刻
- **双沿**（Both Edges）：两种变化都触发

**对于我们的按键（默认高，按下变低）：按下 = 下降沿，松开 = 上升沿。** 所以通常配置**下降沿触发**。

#### 一个小限制（很重要）

STM32 的 EXTI 有个特殊规则：**相同编号的引脚共享一个中断通道**。

比如：

- PA0、PB0、PC0⋯⋯都共享 EXTI0 中断
- PA1、PB1、PC1⋯⋯都共享 EXTI1 中断
- ⋯⋯

意思是：如果你同时用了 PA0 和 PB0 做外部中断，它们会共用一个中断函数 `EXTI0_IRQHandler`，函数里要判断是哪个引脚触发的。

另外，EXTI5~EXTI9 共享一个中断函数 `EXTI9_5_IRQHandler`，EXTI10~EXTI15 共享 `EXTI15_10_IRQHandler`。这是硬件设计的简化。

---

### 第四部分：用中断重写按键读取

#### CubeMX 配置

在 `Button_Poll` 工程基础上改，或者新建 `Button_Interrupt` 工程：

1. 点击 PA0，这次选 **`GPIO_EXTI0`**（注意是 EXTI，不是 Input）
2. 左侧 `GPIO` 配置页，PA0 这一行：
    - `GPIO mode`：`External Interrupt Mode with Falling edge trigger detection`（下降沿触发）
    - `GPIO Pull-up/Pull-down`：`Pull-up`（内部上拉，没按时默认高）
    - `User Label`：`BUTTON`
3. 左侧 `System Core` → `NVIC`（嵌套向量中断控制器），找到 `EXTI line0 interrupt`，**勾选 Enabled**
4. 重新生成代码

#### 生成的代码结构

CubeMX 会在几个地方帮你写好框架代码。你需要关注：

**① `Core/Src/stm32f1xx_it.c`** —— 中断处理函数在这里：

c

```c
void EXTI0_IRQHandler(void)
{
    HAL_GPIO_EXTI_IRQHandler(BUTTON_Pin);
}
```

这个函数是 NVIC 规定的"入口点"，当 EXTI0 中断发生时，硬件会自动跳转到这里。你**不应该改它**，让它调用 HAL 库的处理函数即可。

**② HAL 库内部的 `HAL_GPIO_EXTI_IRQHandler`**：

c

```c
void HAL_GPIO_EXTI_IRQHandler(uint16_t GPIO_Pin) {
    if (__HAL_GPIO_EXTI_GET_IT(GPIO_Pin) != 0x00u) {
        __HAL_GPIO_EXTI_CLEAR_IT(GPIO_Pin);          // 清中断标志
        HAL_GPIO_EXTI_Callback(GPIO_Pin);            // 调用回调函数
    }
}
```

它做两件事：**清除中断标志位**（不清的话中断会反复触发）、**调用回调函数**。

**③ 回调函数 `HAL_GPIO_EXTI_Callback`** —— 这是你要写代码的地方！

HAL 库里它被声明为 `__weak`（弱符号），意思是"默认有一个空实现，你可以重写它"。在 `main.c` 里加上：

c

```c
/* USER CODE BEGIN 4 */
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if (GPIO_Pin == BUTTON_Pin) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
    }
}
/* USER CODE END 4 */
```

`main` 函数的 `while(1)` 里什么都不用写：

c

```c
while (1)
{
    // 空的！CPU 爱干嘛干嘛，中断来了会自动处理
}
```

编译烧录，按按键——LED 翻转。

#### 哇，这太优雅了⋯⋯对吗？

等等，你按几次之后会发现：**LED 有时候一次按键翻转两次，还是有抖动问题**。

中断并没有解决按键抖动。按下瞬间的机械震荡会产生**多个下降沿**，每个下降沿都触发一次中断。

---

### 第五部分：中断里的消抖与"软件陷阱"

#### 错误示范（你千万别这么写）

很自然你会想：在中断里加个 `HAL_Delay`？

c

```c
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if (GPIO_Pin == BUTTON_Pin) {
        HAL_Delay(20);   // ❌ 灾难！
        if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
            HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        }
    }
}
```

**这是严重错误**。原因是：`HAL_Delay` 依赖 SysTick 中断（每 1ms 一次）来增加 `uwTick`，而你现在正**在另一个中断里**。

**STM32 的中断默认不能嵌套相同或更低优先级的中断**。SysTick 中断的默认优先级比 EXTI 低，所以在 EXTI 中断里 `HAL_Delay` 时，SysTick 不会被响应，`uwTick` 永远不增加，**`HAL_Delay` 死等，永远退不出来，程序卡死**。

这是嵌入式新手最常踩的坑之一。**核心原则**：

> **中断服务函数（ISR）里不要做耗时操作，不要调用 `HAL_Delay`，不要做复杂逻辑。ISR 要尽快完成，快进快出。**

#### 正确做法 1：用 SysTick 时间戳做软件消抖

思路：记录上一次中断的时间戳，如果这次中断距离上次不到 20ms，就当作抖动忽略。

c

```c
/* USER CODE BEGIN 4 */
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    static uint32_t last_tick = 0;   // static，函数退出后值保留
    
    if (GPIO_Pin == BUTTON_Pin) {
        uint32_t now = HAL_GetTick();   // 获取当前毫秒数（不会卡住）
        if (now - last_tick > 20) {     // 距离上次中断超过 20ms，认为是新按键
            HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
            last_tick = now;
        }
        // 否则认为是抖动，忽略
    }
}
/* USER CODE END 4 */
```

**为什么 `HAL_GetTick` 不会卡住而 `HAL_Delay` 会？**

- `HAL_GetTick()` 只是读一下 `uwTick` 变量，立刻返回
- `HAL_Delay(ms)` 要循环等 `uwTick` 增加，而 `uwTick` 靠 SysTick 中断增加——你在中断里它就不增加

#### 正确做法 2：中断里只设标志，主循环里处理

更经典、更"设计模式"的做法：

c

```c
/* 全局变量 */
volatile uint8_t button_pressed_flag = 0;  // 必须 volatile！中断改，主循环读
volatile uint32_t button_press_tick = 0;

/* 中断里，只做最少的事：标记 + 记时间戳 */
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin)
{
    if (GPIO_Pin == BUTTON_Pin) {
        button_pressed_flag = 1;
        button_press_tick = HAL_GetTick();
    }
}

/* main 循环里，处理标志 */
int main(void) {
    // ... 初始化 ...
    
    while (1) {
        if (button_pressed_flag) {
            // 延时消抖（这里可以 HAL_Delay，因为在主循环里）
            if (HAL_GetTick() - button_press_tick > 20) {
                if (HAL_GPIO_ReadPin(BUTTON_GPIO_Port, BUTTON_Pin) == GPIO_PIN_RESET) {
                    HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
                }
                button_pressed_flag = 0;  // 清标志
            }
        }
    }
}
```

这种方式的思想非常重要：

> **中断只做"通知"（设置标志），真正的处理放在主循环（或其他"慢"上下文）。这样中断快进快出，系统响应迅速，而且主循环可以安全地做复杂逻辑。**

这其实就是一种设计模式，叫**事件标志模式**（Event Flag Pattern），后面我们讲设计模式时会回到它。

---

### 停下来，我想问你几个关键问题

在继续往下之前，请确保你理解了以下几点。请真诚地回答（不用打字写答案，但要在脑子里过一遍）：

**问题 1**：为什么 `button_pressed_flag` 必须用 `volatile` 修饰？（回忆上一课的 `volatile` 讲解。）

**问题 2**：轮询方式和中断方式，各有什么优点和缺点？什么时候用哪个？

**问题 3**：为什么 ISR 里不能调用 `HAL_Delay`？根本原因是什么？

**问题 4**（深入一点）：假设你的 ISR 是这样：

c

```c
void HAL_GPIO_EXTI_Callback(uint16_t GPIO_Pin) {
    if (GPIO_Pin == BUTTON_Pin) {
        for (int i = 0; i < 1000000; i++) {
            // 做一些计算
        }
    }
}
```

这个 ISR 没有 `HAL_Delay`，也不会卡死，但它**依然是糟糕的代码**。为什么？

---

### 本课任务

#### 必做

1. **轮询版按键 LED**：按键按下 LED 亮，松开灭（用 `if-else` 直接判断）
2. **轮询 + 消抖 + 翻转**：每按一次按键 LED 翻一次状态
3. **中断版按键 LED 翻转**：用 EXTI + 时间戳消抖实现同样的功能
4. **对比体验**：两种实现方式都跑一遍，感受响应速度和代码结构的差异

#### 挑战题（强烈推荐做）

**挑战 1**：**长按和短按区分**。按一下（<500ms）让 LED 翻转；按住超过 1 秒，让 LED 快闪 5 次。

**提示**：在中断里分别记录"按下时间"和"松开时间"，按下时（下降沿）记一个时间戳，松开时（上升沿）再记一个，算差值就知道按了多久。你需要把 EXTI 触发方式改成**双沿触发**（Rising and Falling），然后在回调里判断当前引脚是高还是低来区分是按下还是松开。

**挑战 2**：**事件标志模式实现**。重构你的代码，让 ISR **只做**设置一个 `volatile` 标志，所有逻辑（消抖、判断、LED 控制）都在 `main` 循环里完成。

---

### 下一课预告

当你完成这些任务，我们会进入：

**第三课：UART 串口通信** —— 让你的板子和电脑对话！你会在电脑的串口终端看到板子打印 `printf("Hello STM32\n")`，也能从电脑发命令控制 LED。这是嵌入式调试最常用的武器，学完你会觉得世界都亮了。

同时在第三课里，我们会继续深化"中断 vs 轮询 vs DMA"的讨论，以及引入第一个**环形缓冲区（Ring Buffer）**的数据结构——这是通信协议的基础设施。

---

完成任务后告诉我：

- 轮询版和中断版都跑通了吗？
- 按键抖动你亲眼观察到了吗？（比如不加消抖时 LED 的"跳动"行为）
- 挑战题的思路是什么？卡在哪一步？

**别跳过动手环节**，这些坑你亲自踩过一次，比看我讲 10 遍都管用。🔥