## 第一课：单片机到底是什么
### 完美，硬件和环境都就绪了
你的情况其实非常理想：**C 语言过关 + 硬件零基础 + 两块好板子**。C 语言扎实意味着我们不用在语法上打转，可以直接深入到嵌入式的核心——**软件如何控制硬件**。硬件零基础也不是问题，嵌入式很多硬件概念可以"边做边学"。

先说你的两块板子：

- **STM32F103C8T6**（著名的"蓝药丸"）：Cortex-M3 内核，72MHz，64KB Flash，20KB RAM。经典入门款，资料最多，外设简单。
- **STM32H723VGT6**：Cortex-M7 内核，550MHz，1MB Flash，564KB RAM。这是个"怪兽级"芯片，性能碾压 F103 几十倍，外设也复杂得多（比如有专门的 FDCAN、SDMMC、以太网等）。

**我的建议：从 F103C8T6 开始。** 理由是 H723 太强大了，外设多、时钟树复杂、中断向量也多，初学容易被细节淹没。F103 足够简单，学透之后再迁移到 H723，你会发现 HAL 库的威力——**同一套代码逻辑，换个芯片几乎不用改**。这也是我们后面会重点讲的"可移植性"思想。

---

### 在真正写代码之前，我想先问你几个问题

嵌入式和纯软件最大的区别是：**你的代码最终要让电子在铜线里流动，让某个引脚变高变低**。所以哪怕你 C 语言再熟，也必须先建立一个"心智模型"——微控制器到底是个什么东西？

来，我们做个思想实验。假设你现在拿着 F103C8T6，板子上有一个 LED 灯。你想让它亮。

**问题 1：** 在你目前的理解里，"让 LED 亮"这件事，软件需要做什么？硬件上又发生了什么？你可以用最朴素的语言描述，不用担心说错——我想知道你现在的直觉。

**问题 2：** 你听说过"寄存器（Register）"这个词吗？如果听过，你觉得它和你熟悉的 C 语言里的"变量"有什么区别？

---

先别急着回答得多完美，就说你真实的想法。这两个问题的答案决定了我们接下来从哪里切入——是先补"单片机是什么"的底层原理，还是可以直接跳到 HAL 库的使用。

那我们正式开始。我不会直接给你贴代码，而是用"提问引导 + 讲解"的方式，让你真正理解**为什么**，而不只是**怎么做**。

---

### 第一课：单片机到底是什么？

在我回答你之前，我想先抛出那两个思想实验的问题，你试着回答看看。不过在你回答前，我先给你一点"脚手架"，让你的思考有个方向。

#### 关于"点亮 LED"这件事

想象你家里的台灯。它为什么会亮？很简单：**有电流通过灯泡的灯丝**。电流从哪来？墙上的插座，一端是火线（高电压），一端是零线（低电压），电压差推动电流流动。中间有个开关控制通断。

现在把场景缩小一万倍：

- 灯泡 → 一个 LED（发光二极管）
- 墙上的插座 → 单片机的供电（通常是 3.3V 和 GND）
- 开关 → **单片机的一个引脚（Pin）**

单片机引脚的神奇之处在于：**它可以在软件的控制下，主动输出 3.3V 或 0V**。

所以"让 LED 亮"这件事的本质是：

> 软件告诉某个引脚"输出高电平"，这个引脚的物理电压就变成 3.3V，LED 两端有了电压差，电流流过，LED 发光。

这里有个关键洞察——**你写的 C 代码，最终是在操控物理世界的电压**。这和你以前写 `printf("hello")` 完全不同，那时候你只是在操作内存里的字符。

#### 关于"寄存器"

你熟悉 C 语言的变量，比如：

c

```c
int x = 5;
```

这个 `x` 是什么？它是**内存里的一块空间**，你可以往里写值，也可以读出来。它是"软件的"东西，断电就没了。

那**寄存器**是什么？

寄存器也是一块"空间"，也能读写。但它的特殊之处在于：**它和硬件电路是物理连接的**。

打个比方：

- 普通变量 `int x` 是你写在便利贴上的备忘录，只有你自己看。
- 寄存器像是**电梯里的按钮面板**——你按下"5楼"按钮（往寄存器写 5），电梯（硬件电路）就真的开始动了。

具体到"点亮 LED"：STM32 里有一个寄存器叫 `GPIOC->ODR`（Output Data Register，输出数据寄存器）。这个寄存器的每一位（bit）都**物理连接**到一个引脚。你往某一位写 1，对应引脚就输出 3.3V；写 0，就输出 0V。

c

```c
GPIOC->ODR |= (1 << 13);  // 第13位写1 → PC13引脚输出高电平
```

这一行代码，让 PC13 引脚的电压**真的变了**。

---

### 现在轮到你思考了

我先停在这里，给你几个问题检验一下理解：

**问题 A**：如果我说"寄存器就是一个特殊地址上的 `volatile uint32_t` 变量"，你能理解这句话吗？特别是 `volatile` 在这里为什么重要？（提示：想想编译器优化，想想"这个值会被硬件自己改变"这件事。）

**问题 B**：F103C8T6 是 32 位单片机，意味着大多数寄存器是 32 位的（`uint32_t`）。一个 GPIO 端口（比如 GPIOC）有 16 个引脚。你觉得 `ODR` 寄存器的 32 位里，哪些位对应哪些引脚？多出来的位干嘛用？

**问题 C**（硬件直觉题）：LED 有"正极"和"负极"（阳极和阴极），电流必须从正极流向负极才能发光。假设你的 LED 一端接 PC13，另一端接 GND（地，0V）：

- 如果 PC13 输出 3.3V，LED 亮还是灭？
- 如果 PC13 输出 0V，LED 亮还是灭？
- 反过来，如果 LED 一端接 3.3V，另一端接 PC13，那又如何？

（**提示：F103C8T6 蓝药丸板子上的板载 LED 就是第二种接法，这叫"低电平点亮"，是个常见的小陷阱**。）

---

你先思考并回答这三个问题，哪怕不确定也没关系，说出你的猜测和理由就行。

根据你的回答，我会判断下一步：

- 如果三个都能答对 → 我们直接进入 CubeMX 配置第一个工程，**今天就让 LED 闪起来**。
- 如果 B、C 有困难 → 我们补一下"GPIO 的电气特性"和"位运算在寄存器中的应用"。
- 如果 A 就卡住了 → 我们从更底层的"内存映射 IO"讲起。

别紧张，这是探路，不是考试。😊

这三个概念（volatile、GPIO 电气特性、位运算）是嵌入式最核心的"基本功"，后面所有外设驱动都建立在它们之上。我们一个一个来，每讲完一个我会让你停下来思考。

---

### 基础 1：位运算在寄存器中的应用

这个最简单，也最先用到，我们从这里开始。

#### 为什么寄存器要"按位"操作？

先回忆一下我刚才说的：`GPIOC->ODR` 是一个 32 位寄存器，它的每一位（bit）对应一个物理引脚。

假设现在 `ODR` 的值是 `0b0000_0000_0000_0000_0010_0000_0000_0000`（第 13 位是 1，其他都是 0），意味着 PC13 输出高电平，其他引脚都是低电平。

现在我想**只让 PC0 变高，不影响其他引脚**。你能直接写 `GPIOC->ODR = 1` 吗？

**不行！** 因为 `= 1` 会把整个 32 位都覆盖成 `0b0000...0001`，PC13 就被你"误伤"改成 0 了。

所以我们需要**只改某一位，保留其他位**。这就是位运算的用武之地。

#### 四个核心操作

我用最简单的方式表示，假设我们操作一个 8 位的数（原理一样）：

**① 置 1（set bit）：用 `|=`（或赋值）**

c

```c
// 想把第 2 位置 1，保留其他位
uint8_t x = 0b10100101;
x |= (1 << 2);        // (1 << 2) = 0b00000100，叫做"掩码 mask"
// 结果：x = 0b10100101 | 0b00000100 = 0b10100101
//                                     ^这位原来就是1，或上1还是1
```

再换个例子更清楚：

c

```c
uint8_t x = 0b10100001;
x |= (1 << 2);        // x = 0b10100001 | 0b00000100 = 0b10100101
//                                       ^这位变1了，其他位不变
```

**原理**：`0 | 任何` = 任何（不变），`1 | 任何` = `1`（强制变 1）。所以掩码为 1 的位被强制置 1，掩码为 0 的位保持原样。

**② 清 0（clear bit）：用 `&= ~`**

c

```c
uint8_t x = 0b10100101;
x &= ~(1 << 2);       // ~(1 << 2) = ~0b00000100 = 0b11111011
// 结果：x = 0b10100101 & 0b11111011 = 0b10100001
//                                     ^这位被清0了
```

**原理**：`1 & 任何` = 任何（不变），`0 & 任何` = `0`（强制变 0）。把想清零的位做成 0，其他位做成 1，再 `&`。

**③ 取反（toggle bit）：用 `^=`**

c

```c
uint8_t x = 0b10100101;
x ^= (1 << 2);        // 第 2 位取反：1→0 或 0→1，其他位不变
```

**原理**：`0 ^ 任何` = 任何（不变），`1 ^ 任何` = `!任何`（取反）。这个常用于 LED 闪烁——不用关心当前是亮还是灭，`^=` 一下就切换了。

**④ 读取某一位（read bit）：用 `&` + 判断**

c

```c
uint8_t x = 0b10100101;
if (x & (1 << 2)) {   // 第 2 位是 1 → 整个表达式非 0 → 为真
    // 这一位是 1
}
```

#### 停下来，你来做几道题

别跳过，这些你必须形成肌肉记忆：

**题 1**：写一行代码，把 `GPIOC->ODR` 的第 13 位置 1（PC13 输出高），不影响其他位。

**题 2**：写一行代码，把 `GPIOC->ODR` 的第 13 位清 0（PC13 输出低）。

**题 3**：写一行代码，让 PC13 翻转（亮灭切换）。

**题 4**（稍难）：假设你想**同时**把第 13 位和第 14 位都置 1，一行代码怎么写？

**题 5**（理解题）：为什么下面这行代码是**错误**的？

c

```c
GPIOC->ODR = (1 << 13);   // 想让 PC13 置 1
```

先自己答，然后给我看你的答案。

---

### 基础 2：GPIO 的电气特性

这块是"硬件常识"，讲完你会明白很多代码里的"为什么"。

#### GPIO 是什么？

**GPIO = General Purpose Input/Output**，通用输入输出。简单说，就是一个"**软件可控的引脚**"，既能当**开关**（输出 3.3V 或 0V），也能当**探测器**（检测外部电压是高还是低）。

一个 GPIO 引脚内部不是一根光秃秃的铜线，它长这样（简化版）：

```
                    Vdd (3.3V)
                     │
                     ├── P-MOS (上管) ───┐
     输出控制 ──────┤                   │
                     ├── N-MOS (下管) ───┤── 引脚 ── 外部世界
                     │                   │
                    GND                  │
                                         │
     输入读取 ────── 施密特触发器 ───────┘
```

别被电路图吓到，你只需要知道：

- **输出模式**：内部有两个"电子开关"（P-MOS 和 N-MOS），软件控制它们。上管导通就把引脚拉到 3.3V（输出高），下管导通就把引脚拉到 0V（输出低）。
- **输入模式**：引脚电压经过一个判决电路（施密特触发器），高于某个阈值（~1.7V）判为 1，低于某个阈值判为 0，结果送到寄存器 `IDR` 里给你读。

#### 几种关键的 GPIO 模式（这些名词你一定会在 CubeMX 里看到）

**① 推挽输出（Push-Pull）**

上管和下管都能用。输出高就是"主动推"到 3.3V，输出低就是"主动拉"到 0V。**驱动能力强**，适合驱动 LED、逻辑信号线。

**② 开漏输出（Open-Drain）**

**上管被废掉了**，只保留下管。输出低时下管导通，引脚变 0V；但"输出高"时下管关闭——此时引脚**既不是 3.3V 也不是 0V，是"悬空"的**（叫高阻态 High-Z）。

你可能会问：那怎么输出高电平？答案是**外接一个上拉电阻到 3.3V**。没有下管拉低时，引脚被电阻"拉"到 3.3V。

这有什么用？两个主要场景：

- **电平转换**：比如你的 MCU 是 3.3V 的，但要和 5V 器件通信，用开漏 + 5V 上拉电阻，就能输出 5V 高电平。
- **多设备共享一根线**（I2C 就是这样用的，后面讲）——多个设备都接这根线，任何一个拉低都能成功；没人拉低时电阻把线"默认"拉高。

**③ 输入浮空（Floating Input）**

引脚内部什么都不接，完全看外部电压。问题：如果外部也没东西接（比如按键没按下），引脚就"飘着"，电压是随机的，读出来可能忽高忽低。

**④ 输入上拉（Pull-Up）**

引脚内部通过一个电阻（约 40kΩ）连到 3.3V。没外部信号时，引脚默认是高电平。

**⑤ 输入下拉（Pull-Down）**

类似，内部电阻连到 GND，默认低电平。

#### 一个你必须理解的场景：按键

最常见的按键接法：

```
3.3V ── 按键 ── 引脚 ── (MCU)
```

问题：按键**没按下**时，引脚接什么？答案是"什么都没接"——引脚悬空，电压随机。这时候读取是不可靠的。

解决方案：把这个引脚设为**输入下拉**。没按下时内部下拉电阻把引脚拉到 0V（读到 0）；按下时 3.3V 直接接到引脚（读到 1）。

或者反过来：

```
GND ── 按键 ── 引脚 ── (MCU 设为输入上拉)
```

按键没按 → 电阻拉高，读到 1；按键按下 → 直接接 GND，读到 0。**这种接法更常见**，因为 GND 在 PCB 上到处都有，布线方便。

#### 回到你之前的 PC13 LED 问题

F103C8T6 蓝药丸板子上的 LED 接法是：

```
3.3V ── 电阻 ── LED ── PC13
```

LED 阳极接 3.3V（通过限流电阻），阴极接 PC13。所以：

- PC13 输出 **3.3V** → LED 两端压差为 0，**不亮**
- PC13 输出 **0V** → LED 两端有 3.3V 压差，电流从 3.3V 流过电阻、LED，进入 PC13（此时 PC13 作为"电流吸收口"），**亮**

这叫"**低电平点亮**"或"**灌电流驱动**"。很多板子这么设计，因为 GPIO 引脚"吸电流"（Sink）的能力通常比"输出电流"（Source）强。

#### 停一下，你来回答

**题 6**：如果一个按键一端接 3.3V，另一端接 PA0，你应该把 PA0 配置成什么模式？（浮空输入/上拉输入/下拉输入？）为什么？

**题 7**：你想用 PA5 驱动一个 LED。LED 正极接 PA5，负极通过限流电阻接 GND。要让 LED 亮，PA5 应该输出高还是低？PA5 应该配成推挽还是开漏？

**题 8**（概念题）：为什么"输入浮空"模式在实际工程中很少单独使用？

---

### 基础 3：`volatile` 关键字

这个讲清楚了，你对"编译器 vs 硬件"的理解会上一个台阶。

#### 编译器的"优化"会搞事

C 编译器很聪明，它会优化你的代码。看这段：

c

```c
int flag = 0;

while (flag == 0) {
    // 空循环，等待 flag 变成非 0
}

printf("flag 变了！\n");
```

编译器一看：`flag` 是局部变量，在 `while` 循环里又没人改它，那 `flag == 0` 永远成立啊！于是它优化成：

c

```c
while (1) { }   // 死循环，根本不检查 flag 了
printf("flag 变了！\n");   // 永远执行不到
```

这在普通程序里没问题——你自己都不改，`flag` 当然不会变。

但在嵌入式里，**变量可能被硬件或中断偷偷改掉**！比如：

c

```c
uint32_t button_pressed = 0;

// 中断处理函数（当按键按下时被硬件自动调用）
void EXTI0_IRQHandler(void) {
    button_pressed = 1;   // 中断里改了 button_pressed
}

int main(void) {
    while (button_pressed == 0) {
        // 等待按键按下
    }
    printf("按键按下了！\n");
}
```

编译器在编译 `main` 时根本不知道中断的存在，它看到 `while` 里没人改 `button_pressed`，就优化成死循环。**你的程序永远卡在那里**，哪怕你按烂了按键。

#### `volatile` 的作用

加上 `volatile`，就是告诉编译器：**"这个变量随时可能被你看不见的力量改变，每次用它都必须老老实实从内存里重读，不许优化！"**

c

```c
volatile uint32_t button_pressed = 0;
```

现在编译器每次循环都会真的去读 `button_pressed` 的最新值，中断改了就能看到了。

#### 这和寄存器有什么关系？

寄存器就是"**被硬件自己改变**"的极致例子。比如：

- 你读 `GPIOA->IDR`，返回的是当前引脚的实时电压状态。这个值是**硬件电路实时更新**的，完全不受 CPU 控制。
- 你写 `USART1->DR = 'A'`，硬件会把 'A' 发送出去，然后**硬件自己**把 `DR` 里对应的"发送完成"标志位改了。

所以 STM32 的 HAL 库里，每个寄存器定义都是这样的：

c

```c
typedef struct {
    volatile uint32_t MODER;    // 模式寄存器
    volatile uint32_t OTYPER;   // 输出类型寄存器
    volatile uint32_t IDR;      // 输入数据寄存器
    volatile uint32_t ODR;      // 输出数据寄存器
    // ...
} GPIO_TypeDef;
```

每一个成员都是 `volatile`。这保证了你每次 `GPIOC->IDR` 读取的都是**当前这一刻**引脚的真实状态，而不是编译器缓存的旧值。

#### 回到我之前说的那句话

> "寄存器就是一个特殊地址上的 `volatile uint32_t` 变量"

现在你应该能理解了：

- **特殊地址**：这个地址不是普通 RAM，而是**映射到硬件外设**的地址（叫内存映射 IO，Memory-Mapped I/O）。比如 `GPIOC->ODR` 的地址是 `0x40011014`，CPU 访问这个地址时，芯片内部会把请求路由到 GPIO 硬件电路而不是 RAM。
- **`volatile`**：告诉编译器这个值会被硬件改，每次访问都要重新读/写，不许优化掉。
- **`uint32_t`**：32 位宽，和 STM32 的总线宽度匹配，一次读写一整个寄存器最快。

#### 验证理解

**题 9**：下面两段代码功能看起来一样，但实际行为可能不同。为什么？哪一段是正确的？

c

```c
// 代码 A
uint32_t status = USART1->SR;
while ((status & 0x80) == 0) { }   // 等待某个标志位变 1

// 代码 B
while ((USART1->SR & 0x80) == 0) { }
```

**题 10**：如果我这样定义：

c

```c
uint32_t *p = (uint32_t *)0x40011014;   // 直接指向 GPIOC->ODR 的地址
*p |= (1 << 13);
```

这段代码理论上能点亮/熄灭 PC13 吗？这样写有什么潜在问题？（提示：想想 `volatile`。）

---

### 总结一下今天的知识点

我把最关键的三句话给你：

1. **位运算是操作寄存器的基本语言**——`|=` 置 1、`&= ~` 清 0、`^=` 翻转、`&` 读取。
2. **GPIO 有很多电气模式**，推挽/开漏/上拉/下拉/浮空，每种适合不同场景；硬件的接法决定了你软件要输出高还是输出低。
3. **`volatile` 是嵌入式的灵魂关键字**，它告诉编译器"这个值会被硬件改，别给我优化"，所有寄存器都是 `volatile` 的。

---

现在把那 10 道题做一做，回复给我你的答案（不用全对，尽力就行，错的地方正是我们要讨论的）。你答完之后，我们就可以真刀真枪地：**用 CubeMX 生成第一个工程，在 CLion 里编译，烧录到板子，让 PC13 的 LED 闪烁**——而且你会理解每一行代码背后的硬件含义。

慢慢来，嵌入式不怕慢，怕不扎实。💪
### 答案解析 + 继续前进:


---

### 位运算题解答

#### 题 1：把 `GPIOC->ODR` 第 13 位置 1

c

```c
GPIOC->ODR |= (1 << 13);
```

**拆解**：`(1 << 13)` 生成 `0x00002000`（二进制第 13 位是 1，其他是 0）。`|=` 保证只有这一位被强制变 1，其他位不变。

#### 题 2：把 `GPIOC->ODR` 第 13 位清 0

c

```c
GPIOC->ODR &= ~(1 << 13);
```

**拆解**：`(1 << 13)` 是 `0x00002000`，取反 `~` 变成 `0xFFFFDFFF`（只有第 13 位是 0，其他全是 1）。`&=` 保证第 13 位被清 0，其他位不变。

#### 题 3：翻转 PC13

c

```c
GPIOC->ODR ^= (1 << 13);
```

**拆解**：异或的特性——和 1 异或就翻转，和 0 异或不变。这就是 LED 闪烁的一行核心代码。

#### 题 4：同时把第 13 和 14 位置 1

c

```c
GPIOC->ODR |= (1 << 13) | (1 << 14);
```

**拆解**：`(1 << 13) | (1 << 14)` = `0x00006000`（第 13、14 位都是 1）。一次写操作同时影响两位。

**小知识**：STM32 的头文件里定义了方便的宏，比如 `GPIO_PIN_13` 本质上就是 `(1 << 13)`。你以后会看到这种写法：

c

```c
GPIOC->ODR |= GPIO_PIN_13 | GPIO_PIN_14;
```

#### 题 5：为什么 `GPIOC->ODR = (1 << 13);` 是错的？

因为 `=` 是**整体赋值**，会把 32 位寄存器**全部**覆盖成 `0x00002000`。结果是：PC13 变 1，**其他所有引脚都被强制变 0**。

如果你板子上有多个 LED 在 GPIOC 的不同引脚上，这一行会把它们全部熄灭。所以**寄存器操作几乎永远用 `|=` / `&= ~` / `^=`，极少用单纯的 `=`**。

唯一用 `=` 的合理场景：你确定要把整个寄存器**一次性初始化**成某个值，比如上电时配置模式寄存器。

---

### GPIO 电气特性题解答

#### 题 6：按键接 3.3V 和 PA0，PA0 配什么模式？

**答案：输入下拉（Pull-Down）**。

**推理**：

- 按键**按下**时，PA0 直接接到 3.3V → 读到高电平（1）
- 按键**没按**时，PA0 和外部断开 → 必须有东西把它"拽"到一个确定电平，否则就悬空了
- 既然按下时是高电平，那没按时我们希望是低电平（才能区分），所以需要**下拉到 GND**

如果你答的是"上拉"，想想会发生什么：按下时 PA0 接 3.3V（读 1），没按时上拉电阻把 PA0 拉到 3.3V（也读 1）——**两种状态都读到 1，区分不出按下与否**！

**核心规律**：按键的上拉/下拉选择，要和按键的"另一端接什么"**反着来**：

- 按键另一端接 GND → 用上拉（默认高，按下变低）
- 按键另一端接 3.3V → 用下拉（默认低，按下变高）

#### 题 7：PA5 驱动 LED，正极接 PA5，负极通过电阻接 GND

**答案：PA5 输出高电平，配成推挽输出。**

**推理**：

- LED 要亮，电流必须从正极流向负极。这里正极是 PA5，负极是 GND。所以 PA5 必须输出 3.3V，GND 是 0V，电流从 PA5 流出、经过 LED、经过电阻、到 GND。
- 这叫"**高电平点亮**"或"**拉电流驱动**"（PA5 主动"推"电流出去）。
- 推挽模式才能主动输出 3.3V；开漏模式输出高时是悬空的，不能驱动 LED。

**对比**：F103C8T6 板载 LED 是"低电平点亮"（灌电流），这个是"高电平点亮"（拉电流）。两种接法都很常见，**取决于硬件怎么画的**。所以看到一个 LED，先搞清楚它的接法，再决定输出什么。

#### 题 8：为什么"输入浮空"很少单独使用？

因为**浮空引脚的电压是不确定的**。它既不接电源也不接地，像一根没插电的电线头，外界的电磁干扰（甚至你的手靠近它）都能让它的电压乱跳，读出来是随机 0 或 1。

**浮空模式有用的场景**：引脚本身接了一个**外部有确定电平的信号**（比如外部已经有上拉电阻，或者接到另一个芯片的输出）。这时候再用内部上拉/下拉反而多余，甚至会干扰外部信号。

---

### `volatile` 题解答

#### 题 9：代码 A vs 代码 B

**代码 A 是错的，代码 B 是对的。**

c

```c
// 代码 A（错）
uint32_t status = USART1->SR;   // 读一次寄存器，存到普通变量 status
while ((status & 0x80) == 0) { } // 循环里一直检查 status，但 status 再也不更新了！
```

问题在于：`status` 是个普通 `uint32_t` 变量，被赋值**一次**之后就不变了。循环里检查的是这个"快照"，而不是寄存器当前值。**这会导致死循环。**

c

```c
// 代码 B（对）
while ((USART1->SR & 0x80) == 0) { }   // 每次循环都真的去读寄存器
```

因为 `USART1->SR` 是 `volatile`，每次循环都会重新从硬件读取最新值，一旦硬件把第 7 位置 1，循环就退出。

**嵌入式常见 Bug**：新手经常把寄存器值"暂存"到普通变量，然后循环检查普通变量——**这是典型的死循环来源**。要么直接读寄存器，要么把暂存变量也声明为 `volatile`。

#### 题 10：直接用指针操作寄存器

c

```c
uint32_t *p = (uint32_t *)0x40011014;   // 没加 volatile！
*p |= (1 << 13);
```

**理论上能工作**（地址是对的），但**有潜在风险**：

指针 `p` 指向的类型是普通 `uint32_t`，不是 `volatile`。编译器不知道 `*p` 代表硬件寄存器，可能会做危险的优化。比如：

c

```c
*p |= (1 << 13);
*p |= (1 << 14);
```

编译器可能合并成一次读取、两次修改、一次写入（为了优化），中间丢失了硬件对寄存器的改变。

**正确写法**：

c

```c
volatile uint32_t *p = (volatile uint32_t *)0x40011014;
*p |= (1 << 13);
```

这就是为什么 STM32 的头文件里，**所有寄存器成员都用 `volatile` 修饰**。你用 `GPIOC->ODR` 是安全的，因为头文件已经帮你标好了。

---

### 你现在应该掌握的心智模型

看一张简化的 STM32 内存结构图：

```
地址空间（32位，共 4GB）
┌──────────────────────────────┐ 0xFFFFFFFF
│                              │
│     ......                   │
│                              │
├──────────────────────────────┤ 0x40000000
│                              │
│   外设寄存器区               │
│   （每个地址对应硬件电路）   │
│   GPIOA 在 0x40010800        │
│   GPIOC 在 0x40011000        │
│   USART1 在 0x40013800       │
│                              │
├──────────────────────────────┤ 0x20000000
│   SRAM（普通变量、栈）       │
│   你的 int x, char buf[] 在这│
├──────────────────────────────┤ 0x08000000
│   Flash（程序代码、常量）    │
│   你的代码、字符串常量在这   │
└──────────────────────────────┘ 0x00000000
```

**核心理解**：

- 你的普通变量（`int x`）在 SRAM（`0x2000_0000` 开始）
- 你的代码在 Flash（`0x0800_0000` 开始）
- 寄存器在外设区（`0x4000_0000` 开始）——访问这些地址时，CPU 不是在操作内存，而是在和硬件电路对话
- `volatile` 专门用来标记"外设区"的访问，告诉编译器别优化

---

### 🔧 实战环节：点亮第一个 LED

理论讲完了，我们立刻写代码。你会看到两种方式：**寄存器直接操作**（理解原理）和 **HAL 库**（实际开发用）。两种都要会，因为：

- **HAL 库**是你的日常工具，写得快、可移植
- **寄存器操作**是你的底牌，出 Bug 时能往下挖、能看懂别人的裸机代码

### 第一步：用 STM32CubeMX 生成工程

打开 CubeMX，按下面流程操作：

#### 1. 新建工程

- `File` → `New Project`
- 在 `Part Number` 搜索框输入 `STM32F103C8`
- 选中 `STM32F103C8Tx`（TX 封装是 LQFP48，蓝药丸就是这个），双击进入

#### 2. 配置时钟源（RCC）

左侧 `Pinout & Configuration` → `System Core` → `RCC`：

- `High Speed Clock (HSE)`：选 **`Crystal/Ceramic Resonator`**（蓝药丸板子上焊了 8MHz 晶振）
- `Low Speed Clock (LSE)`：选 `Disable`（我们暂时不用 RTC）

> **为什么这一步重要？** STM32 默认用内部 8MHz RC 振荡器（HSI），精度差。蓝药丸板子焊了外部 8MHz 晶振（HSE），我们选 Crystal 模式才能用它。后面配时钟树会基于这个。

#### 3. 配置调试接口（SYS）

`System Core` → `SYS`：

- `Debug`：选 **`Serial Wire`**（就是 SWD，ST-Link V2 用的调试接口）

> **为什么？** STM32 默认 PA13/PA14 可以是普通 GPIO，也可以是 SWD 调试引脚。如果不选 SWD，CubeMX 会把它们配成 GPIO，**烧录一次之后，ST-Link 就再也连不上你的板子了**（新手必踩坑）。

#### 4. 配置 PC13 为输出

在右侧芯片图上找到 PC13 引脚（在芯片的第 2 脚），**左键点击它**，选择 `GPIO_Output`。

然后左侧 `System Core` → `GPIO`，点击 PC13 这一行：

- `GPIO output level`：`Low`（初始低电平，LED 亮）
- `GPIO mode`：`Output Push Pull`（推挽输出）
- `GPIO Pull-up/Pull-down`：`No pull-up and no pull-down`
- `Maximum output speed`：`Low`（LED 闪烁频率很低，不需要高速）
- `User Label`：填 `LED`（给这个引脚起个别名，代码里就能用 `LED_Pin`、`LED_GPIO_Port` 引用）

#### 5. 配置时钟树（Clock Configuration）

顶部切换到 `Clock Configuration` 标签页：

- `Input frequency` 改成 `8`（MHz，外部晶振）
- `PLL Source Mux` 选 `HSE`
- `PLLMul` 选 `x9`
- `System Clock Mux` 选 `PLLCLK`
- 这样 `HCLK` 应该显示 `72 MHz`（8 × 9 = 72，F103 的最大频率）

> **这一步在做什么？** 把 8MHz 晶振信号送进 PLL（锁相环）倍频到 72MHz，作为整个系统的主频。时钟树是 STM32 非常重要的一块，暂时照做就行，后面会专门讲。

#### 6. 项目设置

顶部切换到 `Project Manager` 标签页：

**Project**：

- `Project Name`：`LED_Blink`
- `Project Location`：选一个**路径不含中文、不含空格**的目录
- `Toolchain / IDE`：选 **`CMake`**（这是 CLion 能识别的）
- `Minimum Heap Size`：`0x200`
- `Minimum Stack Size`：`0x400`

**Code Generator**：

- 勾选 **`Copy only the necessary library files`**（只复制用到的文件，工程干净）
- 勾选 **`Generate peripheral initialization as a pair of '.c/.h' files per peripheral`**（每个外设单独一对 .c/.h 文件，结构清晰）

#### 7. 生成代码

右上角点 `GENERATE CODE`。

生成完成后，在你选的目录下会有这些文件：

```
LED_Blink/
├── CMakeLists.txt           ← CMake 构建文件（CLion 用）
├── Core/
│   ├── Inc/                 ← 头文件
│   │   ├── main.h
│   │   ├── gpio.h
│   │   ├── stm32f1xx_hal_conf.h
│   │   └── ...
│   └── Src/                 ← 源文件（你主要在这里写代码）
│       ├── main.c           ← 主函数入口
│       ├── gpio.c           ← GPIO 初始化
│       ├── stm32f1xx_it.c   ← 中断处理函数
│       └── ...
├── Drivers/                 ← HAL 库和 CMSIS（只读，别改）
│   ├── CMSIS/
│   └── STM32F1xx_HAL_Driver/
├── startup_stm32f103xb.s    ← 启动文件（汇编）
└── STM32F103C8TX_FLASH.ld   ← 链接脚本
```

---

### 第二步：用 CLion 打开工程

- `File` → `Open` → 选中 `CMakeLists.txt` 所在目录
- CLion 会自动识别为 CMake 工程，让你选 `Open as Project`
- 右下角可能提示配置 Toolchain，选你之前配好的 ARM 交叉编译器

---

### 第三步：写点灯代码

打开 `Core/Src/main.c`，找到 `while (1)` 循环（在 `main` 函数里），在里面加代码：

c

```c
  /* USER CODE BEGIN WHILE */
  while (1)
  {
    HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);   // 翻转 LED 状态
    HAL_Delay(500);                               // 延时 500ms
    /* USER CODE END WHILE */

    /* USER CODE BEGIN 3 */
  }
  /* USER CODE END 3 */
```

> ⚠️ **非常重要**：你写的代码必须放在 `/* USER CODE BEGIN */` 和 `/* USER CODE END */` 之间。CubeMX 重新生成代码时只保留这些区域内的内容，区域外的代码会被覆盖掉。

---

### 第四步：理解这三行代码

#### `HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);`

这是 HAL 库的翻转函数。让我们看它的内部实现（在 `stm32f1xx_hal_gpio.c` 里）：

c

```c
void HAL_GPIO_TogglePin(GPIO_TypeDef *GPIOx, uint16_t GPIO_Pin)
{
    uint32_t odr;
    
    /* 读取当前 ODR */
    odr = GPIOx->ODR;
    
    /* 用 BSRR 寄存器做原子翻转 */
    GPIOx->BSRR = ((odr & GPIO_Pin) << 16U) | (~odr & GPIO_Pin);
}
```

看到了吗？**HAL 函数最终还是在操作寄存器**。`BSRR` 是"位设置/复位寄存器"，专门用来原子性地改某些位，避免"读-改-写"过程被中断打断。

不理解 `BSRR` 没关系，你只要记住：**HAL 是对寄存器操作的封装**，它让你不用记每个寄存器的名字和位定义，但它做的事情和你手写寄存器是一样的。

#### `HAL_Delay(500);`

HAL 库提供的毫秒级延时。内部原理：

- STM32 有个系统滴答定时器 SysTick，每 1ms 触发一次中断
- 中断里给一个全局变量 `uwTick` 加 1
- `HAL_Delay(ms)` 就是记下当前 `uwTick`，然后循环等到 `uwTick` 增加了 `ms` 为止

关键是那个全局变量：

c

```c
__IO uint32_t uwTick;   // __IO 就是 volatile，你看到了吧！
```

因为 `uwTick` 在中断里被修改，主循环里读取，**必须 `volatile`**——这就是我们刚讲的 `volatile` 的实际应用。

#### `LED_GPIO_Port` 和 `LED_Pin`

这两个宏定义在 `main.h` 里（因为你在 CubeMX 里填了 User Label 为 `LED`）：

c

```c
#define LED_Pin GPIO_PIN_13
#define LED_GPIO_Port GPIOC
```

`GPIO_PIN_13` 就是 `(1 << 13)`（你应该能秒懂了）。`GPIOC` 是一个结构体指针，指向 GPIOC 外设的寄存器基地址 `0x40011000`。

---

### 第五步：编译、烧录、看效果

#### 编译

在 CLion 右上角选择 `LED_Blink` 这个 target，点锤子图标编译。没报错的话会生成 `.elf` 文件。

#### 烧录

用 ST-Link V2 的 4 根线连接板子和电脑：

```
ST-Link V2        STM32F103C8T6
─────────        ───────────────
SWDIO    ←→      SWDIO (PA13)
SWCLK    ←→      SWCLK (PA14)
GND      ←→      GND
3.3V     ←→      3.3V
```

把 ST-Link V2 插到电脑 USB，然后在 CLion 中配置烧录：

- `Run` → `Edit Configurations` → `+` → `Embedded GDB Server`
- Target：选你的 elf 文件
- GDB Server：`OpenOCD`
- Board config file：`target/stm32f1x.cfg`
- Download executable：`Always`

点击"Run"按钮，代码会被烧录进 Flash，板子自动复位开始运行。

**你应该看到：板载 LED 每秒闪烁一次（500ms 亮、500ms 灭）。** 🎉

---

### 第六步：用寄存器方式再写一遍

为了让你真正理解 HAL 库背后的东西，我们把同一个功能用**裸寄存器**写一遍。替换 `while (1)` 里的代码为：

c

```c
  while (1)
  {
    GPIOC->ODR ^= (1 << 13);     // PC13 翻转（等价于 TogglePin）
    HAL_Delay(500);
  }
```

编译、烧录，效果完全一样。

**但是这里有个坑**：如果我连 `HAL_Delay` 也不用，完全裸写：

c

```c
  while (1)
  {
    GPIOC->ODR ^= (1 << 13);
    for (volatile int i = 0; i < 1000000; i++);   // 粗糙的延时
  }
```

**注意 `volatile int i`**——如果不加 `volatile`，编译器会看到这个循环啥事也没干（没用 i 的值），直接优化掉整个循环！加上 `volatile` 后，编译器老老实实执行 100 万次自增。

**这就是你今天学的 `volatile` 在实战中活生生的例子。**

---

### 现在你的任务

1. **按上面流程把 LED 点起来**——先让它闪烁。
2. **修改闪烁频率**——试试 100ms、1000ms、50ms。
3. **观察不同写法**——HAL 版和寄存器版切换着烧录几次，感受它们行为一样。
4. **做一个小挑战**：让 LED **快闪 3 次，停 1 秒，再快闪 3 次**，循环往复。

做完之后告诉我：

- 烧录成功了吗？有没有遇到报错？
- 你对哪一步还有疑问？
- 第 4 题你打算怎么写？（思路说一下就行）

等你反馈后，我们下一课就进入 **GPIO 输入 + 按键 + 消抖**，然后是 **中断**（你会真正理解为什么 `volatile` 是嵌入式的灵魂）。

加油，你已经踩在门槛上了，推开它就是另一个世界。🚪✨
## 第二课：GPIO 输入、按键与中断

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

这写法没错，但有几个问题：

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

让我们盘点你已经掌握的核心能力：

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

完成本课的任务后告诉我：

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

## 第九课：FreeRTOS 入门——从"单线程思维"到"多任务思维"

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

## 项目启动：双板 CAN 智能环境监测系统

棒，选择做完整版+双板 CAN 通信。这是个非常有挑战但含金量极高的项目。

但是——**我必须先踩个刹车**。你说"手边只有 OLED"，这意味着你**现在就只能做 OLED 相关的部分**。其他外设（电位器、按键、CAN 模块）得先确认采购情况。

先帮你盘点一下：

---

### 硬件采购清单

这个项目最少需要这些（淘宝一两天到货，总价 30 元内）：

|器件|数量|用途|价格|
|---|---|---|---|
|10kΩ 电位器（带旋钮）|2|模拟"温度"、"光强"|1元 × 2|
|轻触按键（带帽）|6|菜单操作（上/下/确认/返回）|1元/几个|
|TJA1050 CAN 模块|2|CAN 收发器|4元 × 2|
|AT24C02 EEPROM|2|配置存储（没有也可用板载 Flash）|2元 × 2|
|面包板|1|临时搭电路|5元|
|杜邦线若干|-|接线|5元|

**暂时可以不买的**：AT24C02（可以用 STM32 内部 Flash 模拟）

**我的建议**：暂停项目硬件，先下单。在等货的这 2~3 天，我们做**两件重要的事**：

1. **系统设计**（最关键！你现在就能做，不需要硬件）
2. **实现可以跑起来的第一部分**（OLED 显示框架，你手上有 OLED）

这符合真实工程的做法——**先设计，再采购，最后实现**。

---

### 第一部分：需求分析（你来答）

在画任何架构图之前，我要你先回答"这个东西要做什么"。这步看似简单，但很多项目死在这里。

#### 问题 1：这个"智能环境监测系统"的核心功能是什么？

我给你一个开放问题——**假设有人问你"你做了个啥？"，你会怎么用 3 句话描述？**

别写代码级别的答案（"我用了 ADC 采集..."），用**用户视角**描述。比如（不一定准确，做参考）：

> "这是一个分布式环境监测系统。**主板**通过传感器采集环境数据（温度、光强），本地显示并通过 CAN 上报。**从板**接收 CAN 数据并显示，同时可以通过按键向主板发送控制命令。"

**你描述一下你的项目是什么**。自己想——这个过程会让你意识到需求不够明确的地方。

先写一段 2~4 句的产品描述给我看，然后我们根据你的描述再往下走。

---

### 第二部分：我先给一个参考架构让你参考

你写描述的同时，我给你一个**参考方案**作为起点。你可以修改、否决、加功能——这就是设计过程。

#### 整体架构（参考版）

```
┌─────────────────────────────────────────────────┐
│  主板 (F103C8T6 - 采集节点)                     │
│                                                 │
│   PA0 ──── 电位器1 (模拟温度)                   │
│   PA1 ──── 电位器2 (模拟光强)     ADC+DMA       │
│                                                 │
│   PB6/PB7  ─── OLED (I2C)      [显示本地数据]   │
│                                                 │
│   PA11/PA12 ── CAN收发器 ────┐                  │
│                              │                  │
└──────────────────────────────┼──────────────────┘
                               │ CAN 总线 500kbps
┌──────────────────────────────┼──────────────────┐
│  从板 (H723VGT6 - 控制节点)   │                  │
│                              │                  │
│   PD0/PD1 ── CAN收发器 ──────┘                  │
│                                                 │
│   PBx ───── OLED (I2C)      [显示远程数据+菜单] │
│                                                 │
│   PCx ───── 4个按键 (上下确认返回)              │
│                                                 │
└─────────────────────────────────────────────────┘
```

#### 功能分配（参考版）

**主板（采集节点）职责**：

1. 每 100ms 采集两个 ADC 通道
2. 做滑动平均滤波
3. OLED 显示本地数据
4. 每 500ms 通过 CAN 发送数据帧
5. 监听 CAN 控制命令（来自从板）
6. 从 EEPROM 读取配置（采样间隔、告警阈值）

**从板（控制节点）职责**：

1. 接收 CAN 数据帧，更新本地缓存
2. OLED 显示远程数据
3. 按键驱动菜单系统（查看数据、调整阈值、设置参数）
4. 阈值超限时本地报警（蜂鸣器/LED）
5. 通过 CAN 发送控制命令（如"请求立即采样"、"修改阈值"）
6. EEPROM 保存菜单中修改的配置

#### 软件架构（参考版）

两块板子都用 FreeRTOS，典型任务划分：

**主板**：

- `SensorTask`：ADC 采样 + 滤波
- `DisplayTask`：OLED 刷新
- `CanTxTask`：定期上报
- `CanRxTask`：处理控制命令
- `ConfigTask`：EEPROM 读写

**从板**：

- `UiTask`：按键扫描 + 菜单状态机
- `DisplayTask`：OLED 刷新
- `CanRxTask`：接收数据 + 告警判断
- `CanTxTask`：发送控制命令
- `ConfigTask`：EEPROM 读写

任务间通信用消息队列。我们后面会详细设计。

---

### 第三部分：你现在要做的事

#### 作业 1：需求描述（30 分钟）

用 2~4 句话描述这个项目。**可以直接抄我上面的，也可以改**。重点是——**你要知道自己在做什么**。

#### 作业 2：CAN 消息设计（最重要的设计工作）

这是整个项目的**核心接口**。一旦确定，两板代码都依赖它。**接口设计错了，后面怎么改都别扭**。

我给你个表格模板，你来填：

|消息 ID|方向|周期|内容|字节分配|
|---|---|---|---|---|
|0x100|主→从|500ms|传感器数据|B0-B1: 温度ADC(小端), B2-B3: 光强ADC, B4: 状态, B5-B7: 保留|
|0x101|主→从|事件|告警|B0: 告警类型(1=高温 2=高光), B1: 当前值高字节, B2: 低字节|
|0x200|从→主|事件|控制命令|B0: 命令(1=立即采样 2=设置阈值), B1-B2: 参数|
|0x700|双向|1000ms|心跳|B0: 节点ID, B1: 状态, B2-B3: 运行时间秒数|

**你的任务**：

1. 看这个表格，你觉得哪里合理？哪里不合理？
2. 温度值用"ADC 原始值（0~4095）"还是"摄氏度 × 10"？这个决定在哪里做物理量换算。
3. 告警消息是"事件触发"——触发条件是什么？只在越界瞬间发一次，还是持续发？
4. 我故意没加"从→主"的配置读取命令。你觉得需要吗？（比如从板启动时要问主板"当前阈值是多少"）

**别怕改我的设计**。好的工程师不会盲目接受给定方案，会质疑、会改进。把你的版本写出来发给我。

#### 作业 3：OLED 驱动（你手头就能做）

等硬件到货之前，你可以先把 OLED 跑起来。

**不要从零写 SSD1306 驱动**——这不是项目的重点。网上有成熟的开源驱动，直接用。

推荐：GitHub 搜 `stm32-ssd1306`（afiskon 的版本比较好），下载后按作者说明集成。

**你的工作**：

1. 把它集成到一个 F103 工程，让它能显示"Hello"
2. **然后用句柄模式包装它**——把原驱动里"写死 hi2c1"改成"接受一个 OLED_Handle*"，支持多个 OLED 实例

这一步的练习价值：**你会遇到真实的"重构第三方代码"场景**。原驱动可能用了全局变量、硬编码的 I2C 句柄。你要读懂它，然后在不破坏功能的前提下把接口改漂亮。

---

### 先停在这里，你的回应决定下一步

请按顺序做这三件事：

1. 下单硬件（电位器、按键、CAN 模块、面包板、杜邦线）
2. 写你的项目描述（2~4 句）
3. 修改/质疑/认可我的 CAN 消息表

做完回复我，我会根据你的回答推进——可能是：

- 你的需求描述揭示了我没考虑到的功能 → 我们调整架构
- 你的 CAN 表有问题 → 我们讨论为什么
- 你的 CAN 表很好 → 我们进入任务划分细化

**不要一口气把整个项目的代码框架都发给我然后等我点评**。做项目不是答题，是**反复对话和修正**的过程。每次做一步，拿来讨论，再往前走。

---

### 一个重要的心态调整

你前九课一直在"看我讲"，现在角色反过来了。你会不习惯——可能会想"你直接给我答案不行吗"。

**不行**。因为真实工作里没人给你答案。你给我看设计方案、我指出问题、你修改、我再审核——**这才是你最终要面对的工作方式**。

我的价值不是替你写代码，而是**帮你发现你没想到的东西**。

你的第一步已经做得很好——"两板都用 + CAN 通信 + 完整版"的选择很有野心。继续保持这个状态，我们一起把它做出来。🚀

等你的三个回应。慢慢来，尤其第 2 点（需求描述）和第 3 点（CAN 表），花点时间想。

## 第十一课：迁移到 STM32H723——"大芯片"是另一个世界

好，切换到 H723。不过在我讲任何具体内容之前，我想先问你几个问题——**因为 H723 和 F103 的差异不是"更快一点、更多外设"这么简单，它是一种架构上的代际跃迁**。我想知道你目前的预期，然后针对性讲。

---

### 先问你几个问题

花几分钟，根据你目前的理解回答（不用查资料，就按你的印象答）：

**问题 1**：F103 主频 72MHz，H723 主频 550MHz，大约 **7.6 倍**。你觉得把一个 F103 的 LED 闪烁工程移植到 H723 上，代码基本不用改就能跑起来吗？如果能跑，它会跑得快 7.6 倍吗？

**问题 2**：你的 F103C8T6 有 20KB RAM。H723VGT6 有 564KB RAM。但这 564KB 并**不是一块连续的 RAM**，而是**分成好几块**（DTCM、ITCM、AXI SRAM、SRAM1~4、Backup SRAM 等）。你能猜猜为什么要这么分吗？直接做成一整块不是更简单吗？

**问题 3**：H723 有一个叫 **Cache**（缓存）的东西，F103 没有。你以前听说过 CPU Cache 吗？你觉得它在嵌入式里会带来什么好处？会带来什么新问题？

**问题 4**：你在 F103 上学的 **DMA**，H723 上还叫 DMA，但有了新东西：**MDMA**（Master DMA）、**BDMA**（Basic DMA），DMA 本身也分成 **DMA1/DMA2**，每个有 8 个 stream，每个 stream 连上不同的 **DMAMUX**（DMA 请求多路复用器）。你觉得为什么一个芯片要有这么多种 DMA？

---

先自己回答这几个问题（心里答一下就行），然后我根据你的回答判断讲解深度。

---

### 在你回答之前，我给你一个"全景式"的对比

这样你心里有个框架。之后我们按你感兴趣的顺序深入：

#### F103 的内核和 H723 的内核

**F103**：Cortex-M3 内核，2004 年发布的设计。

- 单周期访问所有 Flash 和 RAM（因为总线上就它一个家伙，没人和它抢）
- 没有 Cache（不需要）
- 没有 FPU（不支持硬件浮点）
- 没有 MPU（内存保护，可选，F103 没）
- 中断响应 12 周期
- 简单、可预测、适合小型实时控制

**H723**：Cortex-M7 内核，2014 年发布，性能堪比入门级 A 系列。

- 支持 **双发射超标量**（一个周期能执行 2 条指令）
- 有 **L1 指令缓存（ICache）+ L1 数据缓存（DCache）**，各 16KB
- 有 **硬件双精度 FPU**（能做 `double` 浮点，不只是 `float`）
- 有 **MPU**（内存保护单元）
- 有 **分支预测器**（预测 if 走哪边）
- 有 **多总线并行**（AXI 总线 + AHB 总线同时跑）
- 中断响应 12 周期（没变，保持实时性）

**一句话总结**：**M3 是一把锋利的小刀，M7 是一台工业级机床**。它们目标不同——M3 追求简单可预测，M7 追求极致性能。

#### 一个必须先理解的核心事实

你马上会遇到的 H723 的"复杂性"，**大部分不是 H723 故意复杂，而是"高性能"本身的必然代价**。

比如：

- 想让 CPU 跑 550MHz？→ Flash 跟不上，必须加**等待状态（Wait States）**，必须加 **Cache** 弥补
- 想让 CPU 和 DMA 同时访问内存？→ 必须分**多块内存**，各走各的总线，否则抢不过来
- 想让 Cache 提高性能？→ 必须解决"**Cache 和 DMA 数据不一致**"的问题
- 想让内存保护起来？→ 必须有 **MPU** 和属性配置

**F103 没这些问题，是因为它慢——慢得所有人都能排队轮流使用单一的总线和内存**。

H723 的每一个"额外概念"，都对应一个"被解决了的性能瓶颈"。理解了这个因果关系，H723 就不再吓人了。

---

### 我想先带你理解的三个核心新概念

H723 的新东西很多，但只要抓住下面 **三个** 核心概念，其他都是衍生品。

#### 核心概念 1：多总线 + 多内存区域

F103 的内存模型是"单车道高速公路"：

```
┌──────┐
│ CPU  │
└──┬───┘
   │
   ├──── Flash (0x0800_0000, 64KB)
   ├──── SRAM  (0x2000_0000, 20KB)
   └──── 外设  (0x4000_0000)
```

所有访问走同一条总线。CPU 和 DMA 抢道时，硬件仲裁轮流让。

H723 的内存模型是"立体交通枢纽"：

```
              ┌─────────┐
              │  CPU    │
              └─┬───┬───┘
                │   │
        ┌───────┘   └──────┐
        │                  │
    AXI 总线            AHB 总线
        │                  │
   ┌────┼────┐        ┌────┼────┐
   │    │    │        │    │    │
 AXI-  ITCM DTCM    Flash AHB  APB
 SRAM                      外设 外设
 512KB  64KB 128KB
```

**多种 RAM 特点**：

|RAM 类型|地址|大小|特点|典型用途|
|---|---|---|---|---|
|**ITCM**|0x0000_0000|64KB|紧耦合指令内存，零等待，只 CPU 能用|关键中断代码|
|**DTCM**|0x2000_0000|128KB|紧耦合数据内存，零等待，只 CPU 能用|实时任务的栈和关键数据|
|**AXI SRAM**|0x2400_0000|320KB|通过 AXI 总线访问，CPU 和 DMA 都能用|大块缓冲区、堆|
|**SRAM1/2**|0x3000_0000|32KB|AHB 总线，给 DMA 用|DMA 缓冲|
|**SRAM4**|0x3800_0000|16KB|给低功耗域用|睡眠状态保留数据|
|**Backup SRAM**|0x3880_0000|4KB|电池供电保留|断电保留关键变量|

**为什么分这么多？**

想一个具体场景：CPU 在高速运行一个算法（访问数据 10 亿次/秒），同时 DMA 正在把 ADC 数据以 2MSPS 速率搬到缓冲区。

- 如果都用一块 RAM → 两者抢道，谁也跑不快
- 如果 CPU 用 DTCM（私有），DMA 用 AXI SRAM → **完全不冲突**，都能满速

**这就是 H723 分这么多 RAM 的根本原因——让不同的"主人"（CPU、DMA、以太网、LCD 控制器）各走各的路**。

在我告诉你具体怎么用之前，让我先确认一下你理解了概念。

---

**思考题 A**：假设你在 H723 上写一个项目：

- 一个 FreeRTOS 任务高频访问一个算法数据结构
- 一个 DMA 持续把 ADC 数据搬到缓冲区
- 一个 UART 中断时不时把收到的字节放到一个环形缓冲区

如果你要分配这 3 块内存，你会把它们分别放到哪种 RAM 里？为什么？

（先别往下看，自己思考。）

...

参考答案：

- **算法数据结构** → **DTCM**（只 CPU 访问，要最快）
- **ADC DMA 缓冲区** → **AXI SRAM** 或 **SRAM1**（DMA 能访问，DTCM 不行！）
- **UART 环形缓冲区** → **AXI SRAM**（CPU 和中断上下文都访问，DTCM 也可以，但如果量大就 AXI）

**关键陷阱：DMA 不能访问 DTCM 和 ITCM**！这是因为 DTCM/ITCM 是 CPU 的"私人车道"，连在 CPU 核心里，DMA 总线摸不着。

新手在 H723 上最常见的 bug 之一：**把 DMA 缓冲区放在默认的 DTCM 里**（因为链接脚本默认 RAM 是 DTCM），结果 DMA 什么都搬不动，调试半天不知道为啥。

#### 核心概念 2：Cache（缓存）

Cache 的原理简单一句话：**在 CPU 和主内存之间放一块又小又快的镜像内存**。

```
F103 时代（无 Cache）：
CPU ←→ SRAM      （CPU 直接访问内存，每次 1 周期）

H723 时代（有 Cache）：
CPU ←→ Cache (16KB, 1周期) ←→ SRAM (7~10 周期)
           ↑
        命中率高的话，CPU 几乎都在和 Cache 打交道
```

为什么需要 Cache？**因为 H723 的 CPU 跑 550MHz，而外部 Flash 和 SRAM 跟不上这个速度**。访问一次 Flash 要等好几个周期，如果每条指令都这么等，CPU 就废了。

Cache 的哲学是"**局部性原理**"：

- **时间局部性**：刚用过的数据，马上可能再用（比如 for 循环变量）
- **空间局部性**：用了某个地址，附近地址也可能用（比如遍历数组）

Cache 就是把最近访问的"区域"缓存下来。命中率（Hit Rate）通常能到 95% 以上——意味着 95% 的访问都是 1 周期完成，性能几乎翻倍。

**但是**——Cache 带来了一个让嵌入式工程师抓狂的新问题：**Cache 一致性（Cache Coherency）**。

#### Cache 一致性 Bug（必读）

想象这个场景：

```
步骤 1：CPU 把变量 x 从 SRAM 加载到 Cache
       Cache: x = 5
       SRAM:  x = 5

步骤 2：DMA 从外设把新值 x = 99 直接写到 SRAM
       Cache: x = 5        ← Cache 还不知道！
       SRAM:  x = 99

步骤 3：CPU 读 x，从 Cache 拿到 5 ← BUG！应该是 99
```

这就是 Cache 不一致。**Cache 的更新是 CPU 的事，DMA 不通知 Cache**。所以 Cache 里的"副本"和实际 SRAM 的内容对不上。

反过来也有问题：

```
步骤 1：CPU 写 x = 5，Cache 里更新了，但还没写回 SRAM
       Cache: x = 5
       SRAM:  x = 旧值

步骤 2：DMA 把 x 送到外设——读的是 SRAM 里的旧值 ← BUG！
```

这是真实项目中的"**灵异 Bug**"——代码看起来完全正确，数据却对不上。新手调试一整天都查不出原因。

#### 解决方案（你至少要知道）

两个核心操作：

**① Invalidate（让 Cache 失效）**：在"DMA 写完内存后，CPU 要读"的时机，先把 Cache 的对应区域标记为"作废"，这样 CPU 下次读就会去 SRAM 取最新值。

c

```c
SCB_InvalidateDCache_by_Addr((uint32_t*)buffer, size);
/* 然后 CPU 读 buffer，拿到的是 DMA 刚写入的新值 */
```

**② Clean（把 Cache 强制写回内存）**：在"CPU 写完、DMA 要读"的时机，把 Cache 里的新值强制刷到 SRAM。

c

```c
/* CPU 准备好数据 */
memcpy(buffer, data, size);
/* 写回 SRAM，否则 DMA 读到旧值 */
SCB_CleanDCache_by_Addr((uint32_t*)buffer, size);
/* 启动 DMA */
HAL_UART_Transmit_DMA(&huart1, buffer, size);
```

**③ 更省事的方案：MPU 标记"Non-Cacheable"**：把 DMA 缓冲区所在的内存区域配置成"不走 Cache"。每次 CPU 访问都直接打到 SRAM，DMA 直接访问 SRAM——永远一致，但 CPU 访问慢一些。适合不频繁访问的缓冲区。

#### 先停下来

我知道这信息量已经很大了。我想确认你跟上了。

**自测**：

**问题 B**：下面的代码在 H723 上有可能出 bug 吗？如果有，在哪一步？

c

```c
uint8_t rx_buffer[128];   // 假设在 AXI SRAM 里（开了 Cache）

int main() {
    HAL_UART_Receive_DMA(&huart1, rx_buffer, 100);
    HAL_Delay(1000);   // 等 DMA 搞定
    printf("First byte: %d\n", rx_buffer[0]);
    return 0;
}
```

**问题 C**：如果我把 `rx_buffer` 放到 **SRAM4**（低功耗域，默认不被 CPU 缓存），上面代码会有问题吗？

先自己想答案。

---

#### 核心概念 3：链接脚本和启动

到 H723 这个级别，你**不能**像 F103 那样"让工具自动生成，我不管细节"。因为：

- 你的代码在 Flash 还是 ITCM？（影响速度）
- 你的栈在 DTCM 还是 AXI SRAM？（影响实时性）
- 你的 DMA 缓冲区在哪？（影响是否工作）
- 你的 .bss 段在哪？（影响启动时间）

所有这些都由**链接脚本（`.ld` 文件）**决定。

CubeMX 默认生成的 H723 链接脚本把所有东西放 DTCM（好处：快）。但这意味着 **DMA 默认不能用**，这是新手的第一个巨坑。

我暂时不深入讲链接脚本——先建立概念：**H723 上你必须关心"数据放在哪块内存"**。我们会在实际做项目时遇到这个问题，那时候针对性解决。

---

### 第一次动手实验：让 H723 的 LED 闪起来

为了让你有体感，我们做个最简单的实验——**H723 上的 LED 闪烁**。但我要你在做的过程中**故意踩几个坑**，让你真正理解差异。

#### H723VGT6 LQFP100 的典型接线

你那块板子我不知道具体型号（有好多种 H723 核心板），**但最常见的接法**：

- LED 通常接在 PE3 或 PA5（看原理图）
- 按键通常接在 PC13（按下为高）或 PB3

**先确认**：你的 H723 板子上的 LED 和按键接在哪个引脚？去看一下原理图或者板子丝印。告诉我一下。

#### 在你确认引脚之前，可以先做的准备工作

1. **安装 H723 的 HAL 库包**：CLion + CubeMX 生成 H723 工程时会提示下载 `STM32Cube FW_H7`，装上。
2. **准备 ST-Link**：你的 ST-Link V2 能调 H723，但**固件要升级到最新版**。CubeProgrammer 里可以升级。
3. **3.3V 供电确认**：H723 对电源敏感度比 F103 高，插上 ST-Link 的 3.3V 有时候带不动整个 H723 系统（尤其启用了很多外设），**可能需要外部供电**。

---

### 停下来互动

这一课的开头我扔给你很多概念。我不想让你"听完了就完了"——那等于没学。我想让你**现在就反馈**。

请回答下面几个问题（你的回答决定下一步的节奏）：

**反馈 1**：我讲的"多种 RAM"、"Cache 一致性"、"多 DMA"这三块，**哪一块你觉得最反直觉/最难理解**？我们下一步重点展开它。

**反馈 2**：**思考题 A、B、C** 你的答案是什么？（特别是 B，这个题理解了你就真的懂 Cache 了）

**反馈 3**：你那块 H723VGT6 板子的 LED 和按键是哪个引脚？（查一下原理图或者板子丝印）

**反馈 4**：你希望下一步的节奏是：

- (a) **先移植一个最简单的工程**（LED 闪烁），在移植过程中遇到问题再学（实战派）
- (b) **先把时钟树、MPU、Cache 这些概念系统讲一遍**，然后再写代码（系统派）
- (c) **直接用 H723 开始我们之前计划的那个综合项目**（让 H723 当"从板"，跑 CAN + OLED + 按键菜单 + RTOS）

---

我给你一个诚实的建议：**(a) 通常最有效**。你已经有很扎实的 F103 基础，直接在 H723 上做，**遇到问题 → 理解原因 → 解决**——这种"被问题拖着前进"的方式会让你记忆最深刻。

系统讲一遍理论（选 b）会让你觉得"懂了"，但不动手很快会忘。

不过最终看你倾向。等你的回复。🚀

## 第十二课：H723 系统架构深入——时钟树、Cache、MPU

好，我们系统派。这一课我会尽量讲透底层机制，让你理解"**为什么 H723 是这个样子**"。三个核心主题：

1. **时钟树**（550MHz 是怎么来的，为什么这么复杂）
2. **Cache 系统**（怎么工作，怎么控制，怎么避坑）
3. **MPU 内存保护单元**（怎么配置，怎么解决 DMA 问题）

讲完这三块，你再看 H723 就不再是"神秘黑盒"，而是"复杂但有逻辑"的系统。

开始前我先定一个心智模型——

> **F103 的设计哲学是"够用就好"，H723 的设计哲学是"极致性能"。极致性能意味着每个子系统都要独立优化，于是产生了大量的模块化和配置选项。**

记住这句话，遇到任何"为啥这么复杂"的疑问，都可以回到这个根源。

---

### 第一部分：时钟树的层级设计

#### 先回忆 F103 的时钟树

F103 的时钟结构：

```
HSE (8MHz外部晶振)
    ↓
   PLL (×9)
    ↓
SYSCLK = 72 MHz
    ↓
   ┌────────────┐
AHB HCLK     APB1 PCLK1 (36MHz)   APB2 PCLK2 (72MHz)
(72MHz)
```

一个 PLL、一条时钟树主干、几个分频器。**所有外设共用这套时钟**，配置简单。

#### H723 的时钟树有多复杂

我先给你一个全景，然后拆解：

```
                            ┌─ HSE (外部晶振, 如 25MHz)
时钟源 ────────────────────┤
                            ├─ HSI (内部 64MHz RC)
                            ├─ CSI (内部 4MHz RC，低功耗用)
                            └─ LSE/LSI (低速时钟, RTC用)
                                       │
                                       ↓
                            ┌──────────┴──────────┐
                            │                     │
                      ┌─── PLL1 ───┐         ┌─ PLL2 ─┐      ┌─ PLL3 ─┐
                      │            │         │        │      │         │
                      ↓            ↓         ↓        ↓      ↓         ↓
                   SYSCLK       PLL1Q     PLL2P    PLL2Q   PLL3P    PLL3Q
                   (CPU主频)    (USB/...)  (外设)   (DMA)   (LCD)   (UART)
                     │
                     ↓
                    D1CPRE 预分频
                     │
                     ↓
                   CPU = 550MHz
                     │
                     ↓
                    D1CPRE
                     │
                     ├── HPRE → AHB3 (Cortex 的总线, 给 Flash/AXI SRAM)
                     ├──────→ AHB1/2/4 (外设总线)
                     ↓
                   AXI_CLK (最高 275MHz)
                     │
                     ├── D1PPRE → APB3 (最高 137.5MHz)
                     ├── D2PPRE1 → APB1
                     ├── D2PPRE2 → APB2
                     └── D3PPRE → APB4
```

**为什么要这么多 PLL 和分频器？**

先问你一个问题——

**思考题 1**：假设你需要同时做这些事：

- CPU 跑 550MHz（算法处理）
- USB 需要 **精确** 48MHz（规范要求，不能偏差）
- 某个 UART 需要 100MHz（高波特率）
- SDRAM 需要 200MHz
- 一个定时器需要 10MHz 精确分频

如果只有**一个** PLL，能满足所有要求吗？为什么 H723 要三个 PLL？

...

**答案**：一个 PLL 只能产生**一组**频率（通过几个固定分频比输出多个频率）。USB 要 48MHz 时，分频比可能是 550/48 = 11.458...，**根本不是整数**，分频后的频率就偏了。USB 不能偏差——主机会识别失败。

所以 H723 的设计是：

- **PLL1** → 主要给 CPU 和 AXI，追求最高频率
- **PLL2** → 给外设组（QSPI、SDMMC、以太网、DMA等），各自有精确要求
- **PLL3** → 给音频/显示/串口等需要特殊精确频率的

**每个 PLL 独立配置**，各自优化自己的输出频率。这就是"**分布式时钟**"的思想。

#### H723 的电源域

这是一个 F103 完全没有的概念。H723 把内部分成几个**电源域（Power Domain）**：

```
┌────────────────────────────────────────────────┐
│                                                │
│  D1 域（主域）                                 │
│  - Cortex-M7 内核                              │
│  - ITCM / DTCM                                 │
│  - AXI SRAM                                    │
│  - Flash                                       │
│  - 高速外设（SDMMC1、QSPI）                    │
│                                                │
├────────────────────────────────────────────────┤
│  D2 域（外设域）                               │
│  - 大部分通信外设（UART、I2C、SPI、FDCAN等）   │
│  - SRAM1/2/3                                   │
│  - 普通 DMA                                    │
│                                                │
├────────────────────────────────────────────────┤
│  D3 域（低功耗域）                             │
│  - BDMA（Basic DMA）                           │
│  - LPUART                                      │
│  - LPTIM                                       │
│  - SRAM4                                       │
│  - 低功耗 I2C                                  │
│                                                │
└────────────────────────────────────────────────┘
```

**为什么分域？** 因为每个域可以**独立开关电源**。

- 休眠时关掉 D1 域（CPU 不工作），只保留 D3 域（用 BDMA 采数据、LPUART 收命令）
- 唤醒时再开 D1 域

这在物联网/电池供电应用里至关重要，能把功耗从毫安级降到微安级。

#### 这对你写代码的实际影响

**影响 1：外设放在哪个域，决定了怎么用**

- 用 UART4 → 在 D2 域，需要开启 D2 域时钟
- 用 LPUART1 → 在 D3 域，休眠时可用
- 如果你的 DMA 要操作 LPUART，必须用 **BDMA**（D3 域的 DMA），**普通 DMA 够不着 D3 外设**

**影响 2：不同外设的时钟来源不同**

在 CubeMX 里配 H723 时，你会看到"Clock Configuration"标签页巨大复杂——每个外设都能独立选时钟源。**这是强大也是坑**——选错了外设不工作。

**影响 3：高主频带来的新约束**

H723 跑 550MHz 不是随便开的。它取决于**电压范围（VOS, Voltage Scaling）**：

|VOS 级别|电压|最高频率|
|---|---|---|
|VOS0 (最高性能)|~1.35V|550MHz|
|VOS1|~1.2V|400MHz|
|VOS2|~1.1V|300MHz|
|VOS3|~1.0V|200MHz|

**想跑 550MHz，必须先把 VOS 设到 0**。CubeMX 会提醒你，但你要知道为什么。

还有 **Flash 等待状态（Wait States）**——Flash 跑不到 550MHz，CPU 取指令必须等几个周期。550MHz 主频时 Flash Wait States 是 3 或 4。这就是为什么需要 **ICache**——缓存指令，减少等 Flash 的次数。

#### 停一下，检查你的理解

**思考题 2**：如果你在 H723 工程里把 CPU 主频从 550MHz 降到 200MHz（不改其他），会有什么变化？

- Flash 等待状态可以更少吗？
- Cache 的命中率重要性变化吗？
- 功耗降低多少？

先想想再往下。

...

**答案**：

- Flash 等待状态可以降到 0（200MHz Flash 跟得上），**少等就是快**
- Cache 命中与否的性能差异变小（反正 Flash 也快），Cache 的重要性下降
- 功耗大幅降低（CPU 功耗近似和 V2⋅fV2⋅f 成正比，VOS 也能降）

**这说明**：极致性能的代价是功耗和复杂度。**不是所有项目都需要跑满 550MHz**，应该按需选择。

---

### 第二部分：Cache 系统深入

我们在上一课已经建立了 Cache 的基本概念。这一节讲**细节**——怎么配置、怎么控制、实际项目中的常见模式。

#### Cache 的物理结构

H723 的 L1 Cache：

- **ICache**（指令缓存）：16KB，放 CPU 要执行的指令
- **DCache**（数据缓存）：16KB，放 CPU 要读写的数据

**ICache 几乎无副作用**——因为指令一旦加载就不变，不存在一致性问题。开启它对性能提升巨大（能到 2~3 倍），成本几乎为零。**建议永远开启**。

**DCache 是所有一致性问题的来源**——因为数据是动态变化的，而 Cache 和内存可能不同步。

#### Cache 的粒度

Cache 不是一个字节一个字节缓存的，它按**缓存行（Cache Line）** 操作。Cortex-M7 的 L1 Cache Line 是 **32 字节**。

这意味着：

- CPU 读取一个 `uint8_t` 时，实际上从内存加载了 **32 字节** 到 Cache
- Cache 的 Invalidate/Clean 操作也是以 32 字节为最小单位
- 你的 DMA 缓冲区**必须 32 字节对齐**，否则操作会影响相邻数据

#### 四种 Cache 策略

每块内存的 Cache 行为可以配置成四种之一：

|策略|读|写|用途|
|---|---|---|---|
|**Non-Cacheable**|直接打内存|直接打内存|DMA 缓冲区、外设寄存器|
|**Write-Through**|走 Cache|同时写内存和 Cache|平衡性能和一致性|
|**Write-Back**|走 Cache|只写 Cache，延迟写内存|最高性能，但一致性最难管|
|**Write-Back + Write-Allocate**|走 Cache|写时先加载到 Cache 再写|写密集场景|

H723 默认大部分 RAM 是 **Write-Back + Write-Allocate**（最快），这也是一致性 bug 最多的模式。

#### 最容易理解的一致性场景

我带你手工走一遍两种场景：

**场景 A：CPU 写，DMA 读**（如 UART DMA 发送）

c

```c
char msg[] = "Hello";
HAL_UART_Transmit_DMA(&huart1, (uint8_t*)msg, 5);
```

时间轴：

```
T1: CPU 写 msg 到 Cache (Write-Back，不立刻写 SRAM)
    Cache:  msg = "Hello"
    SRAM:   msg = (旧值/未初始化)

T2: HAL_UART_Transmit_DMA 启动 DMA
    DMA 读 SRAM 里的 msg → 拿到旧值 ← BUG！

T3: 某时刻 Cache 行被替换，写回 SRAM（已经来不及了）
```

**修复**：启动 DMA 前，强制把 Cache 里的 msg 写回 SRAM：

c

```c
char msg[] __attribute__((aligned(32))) = "Hello";   // 32字节对齐！
SCB_CleanDCache_by_Addr((uint32_t*)msg, 8);          // 写回SRAM
HAL_UART_Transmit_DMA(&huart1, (uint8_t*)msg, 5);
```

**场景 B：DMA 写，CPU 读**（如 UART DMA 接收、ADC DMA）

c

```c
uint8_t buffer[128];
HAL_UART_Receive_DMA(&huart1, buffer, 100);
HAL_Delay(1000);
printf("%d\n", buffer[0]);   // 可能读到旧值！
```

时间轴：

```
T1: CPU 启动 DMA

T2: 某时刻，CPU 读了一下 buffer[0]（可能因为 printf 的调试等）
    Cache 把 buffer[0] 附近 32 字节从 SRAM 加载到 Cache
    Cache:  buffer[0] = 0 (初始值)

T3: DMA 收到数据，写到 SRAM
    Cache:  buffer[0] = 0   ← 没更新！
    SRAM:   buffer[0] = 'A' (实际数据)

T4: CPU 读 buffer[0]，从 Cache 拿到 0 ← BUG！
```

**修复**：CPU 读之前，把 Cache 对应区域标记为失效，强制从 SRAM 重新读：

c

```c
uint8_t buffer[128] __attribute__((aligned(32)));
HAL_UART_Receive_DMA(&huart1, buffer, 100);
HAL_Delay(1000);
SCB_InvalidateDCache_by_Addr((uint32_t*)buffer, 128);   // 失效Cache
printf("%d\n", buffer[0]);   // 现在是正确的
```

#### Cache 操作的三个函数

c

```c
/* 失效：让 Cache 认为"这块区域的 Cache 副本过时了"，下次读会从 SRAM 取 */
SCB_InvalidateDCache_by_Addr(uint32_t *addr, int32_t size);

/* 清洗：把 Cache 里修改过的内容强制写回 SRAM */
SCB_CleanDCache_by_Addr(uint32_t *addr, int32_t size);

/* 清洗+失效：一次搞定两个（DMA 读写混合场景用） */
SCB_CleanInvalidateDCache_by_Addr(uint32_t *addr, int32_t size);
```

还有全局版本（整个 Cache 一起操作）：`SCB_CleanDCache()`、`SCB_InvalidateDCache()`——慢但简单，调试时可以用。

#### 实战指导：何时用哪个

|操作|时机|用什么|
|---|---|---|
|CPU 写缓冲区 → 启动 DMA 发送|DMA 启动**前**|`CleanDCache`|
|CPU 启动 DMA 接收 → 读缓冲区|CPU 读**前**|`InvalidateDCache`|
|DMA 收发同时进行（全双工）|每次操作后|`CleanInvalidateDCache`|

**记忆口诀**：

- **C** 开头的 Clean = **C**PU 写完要**C**lean 到内存
- **I** 开头的 Invalidate = **I**n（进来的）DMA 数据要 **I**nvalidate Cache

（这个口诀是我瞎编的，但容易记）

#### 简化之路：MPU 配置"不走 Cache"

每次记得调用 Clean/Invalidate 很烦，还容易漏。**更好的做法**：把 DMA 缓冲区放到一块**配置成 Non-Cacheable 的内存**，这样 CPU 和 DMA 都直接打 SRAM，永远一致。

代价：CPU 访问这块区域慢（没 Cache 加速）。但 DMA 缓冲区本来访问频率就不高，损失不大。

这就引出了第三部分——MPU。

#### 停下来思考

**思考题 3**：下面三种数据，你会怎么放？

- 一个 512 字节的 ADC DMA 循环缓冲区，CPU 偶尔读取计算均值
- 一个 4KB 的图像处理中间数组，CPU 高频读写（每像素 100 次）
- 一个 16 字节的中断标志结构体，多个中断 ISR 读写

选项：

- (A) Cacheable + 手动 Clean/Invalidate
- (B) Non-Cacheable 区域
- (C) 放 DTCM（本来就不 Cache）

（先想再往下）

...

**我的建议**：

- **ADC 缓冲区**：(B) Non-Cacheable。CPU 偶尔读，Cache 好处小，图省心。
- **图像处理数组**：(A) Cacheable + 手动管理。因为 CPU 高频访问，Cache 性能提升巨大，值得处理一致性。**但如果 DMA 不涉及这个数组**，直接放 Cacheable 区就行，根本不用管一致性。
- **中断标志**：(C) DTCM。小、高频访问、只 CPU 访问，DTCM 完美。

**核心原则**：**评估"CPU 访问频率 vs DMA 访问频率"来决定**。

---

### 第三部分：MPU（内存保护单元）

#### MPU 是什么

MPU = Memory Protection Unit，是 Cortex-M7 内核里的一个硬件模块。它的功能是：

> **把地址空间划分成若干区域，每个区域赋予不同的属性：访问权限（读/写/执行）、Cache 策略、可共享性。**

在 H723 上，MPU 的**最主要用途不是"保护"，而是配置 Cache 策略**——告诉 Cache"这块区域不要缓存"。

#### 一个最小的 MPU 配置例子

假设你要把 SRAM1（0x30000000 开始，32KB）配置成 Non-Cacheable：

c

```c
void MPU_Config_DMA_Buffer(void)
{
    MPU_Region_InitTypeDef MPU_InitStruct = {0};
    
    /* 先禁用 MPU */
    HAL_MPU_Disable();
    
    /* 配置一个区域 */
    MPU_InitStruct.Enable = MPU_REGION_ENABLE;
    MPU_InitStruct.Number = MPU_REGION_NUMBER0;        // 区域编号 0
    MPU_InitStruct.BaseAddress = 0x30000000;           // SRAM1 起始
    MPU_InitStruct.Size = MPU_REGION_SIZE_32KB;
    MPU_InitStruct.AccessPermission = MPU_REGION_FULL_ACCESS;
    MPU_InitStruct.IsBufferable = MPU_ACCESS_NOT_BUFFERABLE;
    MPU_InitStruct.IsCacheable = MPU_ACCESS_NOT_CACHEABLE;  // ← 关键！
    MPU_InitStruct.IsShareable = MPU_ACCESS_SHAREABLE;
    MPU_InitStruct.SubRegionDisable = 0x00;
    MPU_InitStruct.TypeExtField = MPU_TEX_LEVEL0;
    
    HAL_MPU_ConfigRegion(&MPU_InitStruct);
    
    /* 启用 MPU */
    HAL_MPU_Enable(MPU_PRIVILEGED_DEFAULT);
}
```

这段代码做了什么？**把 SRAM1 标记为"不要缓存"**。之后只要你把 DMA 缓冲区定义在 SRAM1，Cache 就不会碰它，永远一致。

#### 怎么让变量落到 SRAM1？

用链接脚本的段属性 + GCC 属性：

**方法 1**：在链接脚本 `.ld` 文件里定义一个段

ld

```ld
/* 在 .ld 文件中添加 */
MEMORY
{
  ...
  SRAM1 (xrw) : ORIGIN = 0x30000000, LENGTH = 32K
}

SECTIONS
{
  ...
  .sram1_section (NOLOAD) :
  {
    . = ALIGN(4);
    *(.sram1_section)
    . = ALIGN(4);
  } >SRAM1
}
```

**方法 2**：在 C 代码里用属性声明变量

c

```c
uint8_t dma_buffer[1024] __attribute__((section(".sram1_section"), aligned(32)));
```

这样 `dma_buffer` 就落在 SRAM1（Non-Cacheable 区域），DMA 使用无需任何 Clean/Invalidate。

#### MPU 的其他用途

除了控制 Cache，MPU 还能：

**① 保护代码段只读**：把 Flash 区标记为"禁止写入"，即使 bug 代码往 Flash 地址写也会立刻触发异常，避免灾难。

**② 栈溢出检测**：在每个任务栈底部设置一块"只读"区域，任务栈溢出时写入该区域会触发硬件异常，立刻发现 bug。RTOS 高级调试技巧。

**③ 特权/非特权分离**：配置某些区域"只有特权模式能访问"，实现类似操作系统的用户/内核隔离。

初学阶段你只需要理解"**用 MPU 配置 Non-Cacheable 区域解决 DMA 一致性**"这一个核心用法。其他是进阶内容。

#### 停下来检查

**思考题 4**：综合你学的，请说出 H723 上 DMA 缓冲区的"三种合理放法"，各自的优缺点：

1. ...
2. ...
3. ...

...

**答案**：

1. **放在 AXI SRAM（默认 Cacheable）+ 手动 Clean/Invalidate**
    - 优点：CPU 访问快（走 Cache）
    - 缺点：每次 DMA 操作前后要手动管理 Cache，易漏
2. **放在 SRAM1/2/3，用 MPU 标记为 Non-Cacheable**
    - 优点：无需管理 Cache，简单可靠
    - 缺点：CPU 访问慢（直接打 SRAM）
    - 推荐：通用 DMA 缓冲区首选
3. **放在 SRAM4（D3 域，BDMA 专用）**
    - 优点：低功耗场景（休眠时仍工作）
    - 缺点：只有 BDMA 能用，大多数 DMA 访问不到
    - 推荐：电池应用或 LPUART 配合 BDMA

---

### 第四部分：H723 的新外设速览

前三部分讲完了 H723 的"系统骨架"。现在快速过一下它比 F103 多的**新外设**：

#### 1. FDCAN（CAN FD）

**不是普通 CAN**，是升级版：

||普通 CAN (F103)|FDCAN (H723)|
|---|---|---|
|最高速度|1 Mbps|8 Mbps|
|单帧数据|8 字节|64 字节|
|双比特率|否|可以（仲裁段慢，数据段快）|
|消息缓冲|3 邮箱 + 2 FIFO|专用 Message RAM|

FDCAN 兼容普通 CAN——两者可以混在同一总线（只要其他节点也支持 FDCAN 或者协商降速）。

**对你的意义**：我们之前讲的 CAN 知识 95% 还适用。只是 API 变成 `HAL_FDCAN_*`，配置多了几个选项（比如数据段波特率）。

#### 2. 以太网（Ethernet MAC）

H723 自带 **10/100 Mbps 以太网 MAC**。要配一个外部 PHY 芯片（如 LAN8720）和变压器，就能上网。

这打开了新世界：TCP/IP、MQTT、HTTP、Modbus TCP、EtherCAT... 嵌入式连网的一切。

入门难度较高（需要 LwIP 协议栈），建议在打好基础后再学。

#### 3. QSPI / OCTOSPI

**给外部 Flash 用的高速接口**。普通 SPI 一次传 1 bit，QSPI 一次传 4 bit，速度 ×4。OctoSPI 更是 8 bit，配合时钟翻倍能到 400MHz×8 = 3.2Gbps。

典型用法：外挂一个 QSPI NOR Flash 芯片，**内存映射模式**下，这块外部 Flash 就像 H723 内部 Flash 一样直接当程序/数据用。这让你的代码能"无限扩展"到几百 MB。

#### 4. SDMMC（SD 卡接口）

能直接接 SD 卡（不是 SPI 模式的 SD 卡，是真正的 SDIO 接口，速度快得多）。配合 FatFS 文件系统，你的 MCU 能读写 U 盘/SD 卡上的文件。

#### 5. DMA2D（Chrom-ART 图形加速器）

专门给 LCD 屏幕用的 2D 加速硬件。做 GUI（如 TouchGFX、LVGL）时，这玩意能让界面丝滑无比。

#### 6. 更多定时器、更多 UART、更多 SPI...

数量上翻倍，功能也更强。但概念上和 F103 相同，你学过的都能用。

---

### 总结：心智模型升级

学到这里，你对 H723 应该有这样的感觉：

> **H723 不是一块"更快的 F103"，而是一个"嵌入式级的小型电脑"**。它有：
> 
> - 多级内存（像 PC 的 L1/L2 Cache + RAM）
> - 多总线并行（像 PC 的 PCIe/DMI）
> - 电源管理（像手机的各种功耗状态）
> - 内存保护（像 PC 的虚拟内存保护）
> - 高速 I/O（以太网、高速 SPI、LCD 加速）

**F103 时代的思维方式：单线程 + 平坦内存 + 简单时钟 + 轮询/中断驱动**

**H723 时代的思维方式：多任务并行 + 分层内存 + 分布式时钟 + 事件/DMA 驱动**

你学过的所有知识（GPIO、I2C、SPI、状态机、观察者模式、RTOS、流水线）在 H723 上**全部适用**。H723 没有推翻什么，只是**加入了新的维度**。

---

### 停下来综合检测

给你几个综合题，检验这一课的理解：

**综合题 1**：你在 H723 上用 FreeRTOS，有一个任务要做大量 `float` 数组计算（比如 FFT），你会：

- 把数组放在哪块内存？
- 开不开 DCache？
- 这个任务的栈放哪？

**综合题 2**：你同时要用 ADC DMA 以 1MSPS 采集信号存到环形缓冲区，CPU 在另一个任务里做滤波算法。为了避免 Cache 一致性 bug，你有几种方案？各自的性能影响？

**综合题 3**：H723 跑 550MHz，Flash 最多只能 200MHz 访问。如果你的代码**完全不开 ICache**，性能损失会有多大？是可以接受（比如 10%），还是灾难性（比如 80%）？为什么？

**综合题 4**（开放）：基于你现在对 H723 的理解，如果让你在 H723 上跑一个**音频处理**项目（采样 → FFT → 滤波 → 输出），你会怎么规划内存、DMA、任务？画一个草图（或文字描述）就行。

---

### 下一步

回答上面的综合题（至少 1、2、3，第 4 题选答），我根据你的回答判断你是否真的消化了。

之后我们可以：

- **继续讲 H723 的具体新外设**（FDCAN、以太网、QSPI 选一个深入）
- **开始 H723 版的综合项目**（你之前计划的那个，用 H723 做主板或从板）
- **讲 STM32 的启动流程和链接脚本**（这是前面一直没展开的底层知识，有了它你对整个系统的掌握会完整）

选哪个？或者你有别的想法？

我留一个小彩蛋——**你现在掌握的知识，已经能胜任绝大多数商业嵌入式项目**。H723 这种级别的芯片，很多工程师用三四年才摸清。你走到这一步的意义不是"学到了一个具体芯片"，而是**建立了一套能迁移到任何 Cortex-M 芯片的系统性思维**。将来你拿起 STM32U5、NXP i.MX RT、Renesas RA8——看过的时候会觉得"哦，还是那些老东西"。💪

## H723 新外设深入：第一弹 —— FDCAN

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
## H723 新外设深入：第二弹 —— SDMMC + FatFS

好，讲 SDMMC。不过在我开始之前，我想先搞清楚你的起点——SD 卡这个话题跨度很大，从"怎么把一个字节写到 SD 卡"到"怎么在 SD 卡上读写文件"是两个完全不同的层次。

---

### 先聊聊你对"SD 卡"的印象

花 30 秒想想，回答：

**问题 1**：你手机里的 SD 卡、相机里的 SD 卡、电脑的 SD 读卡器——它们本质上是什么？是一块"存储芯片"？还是"带控制器的小电脑"？

**问题 2**：你知道 SD 卡和 U 盘、硬盘、W25Q Flash（你第五课学的 SPI Flash）——它们底层存储介质是不是一样的？

**问题 3**：当你在电脑上"把文件复制到 U 盘"，这个"文件"概念是谁在维护？U 盘自己知道"文件"是什么吗？还是操作系统知道？

这三个问题的答案，决定了今天这节课的正确切入点。

---

### 先别急着答，我给你一些铺垫

因为 SDMMC 和 FatFS 的学习，涉及**两个独立的层次**，你必须先分清：

```
┌─────────────────────────────────────┐
│  你的应用代码                       │
│  fopen("log.txt")                   │
│  fwrite(data, ...)                  │
│  fclose()                           │
└─────────────────────────────────────┘
              ↓ 调用
┌─────────────────────────────────────┐
│  FatFS 文件系统层                    │← 这是"软件"层，和 SD 卡无关
│  管理：目录树、文件分配表、簇、扇区  │
└─────────────────────────────────────┘
              ↓ 要求读写某个扇区
┌─────────────────────────────────────┐
│  SDMMC 驱动层                        │← 这是"硬件"层
│  管理：初始化 SD 卡、发送命令、读写扇区
└─────────────────────────────────────┘
              ↓ 电气信号
┌─────────────────────────────────────┐
│  SD 卡硬件                          │
└─────────────────────────────────────┘
```

**关键洞察**：**SD 卡不知道什么是"文件"**。它只知道"扇区"（512 字节一块）。你对 SD 卡说"读第 12345 号扇区"，它给你 512 字节；你说"写第 12345 号扇区的这 512 字节"，它就写。

那"文件""目录""文件名"从哪来？**完全是上层软件（FAT、NTFS、ext4 等文件系统）虚构出来的概念**。

---

### 所以我用两个问题带你理解层次

**问题 A（底层）**：一块全新的 SD 卡，没格式化过。你往扇区 5 写了 "Hello World"，然后把卡拔下来插到另一台电脑。电脑能找到这个 "Hello World" 吗？是作为"文件"吗？

...

答：**电脑找不到任何"文件"**（电脑会说"需要格式化"）。但如果你写一个直接读扇区的工具（类似 WinHex），**能在扇区 5 看到那段数据**。这证明了——"文件"是虚构的概念。

**问题 B（层次转换）**：假设你在 FatFS 里执行 `fwrite("Hello World", ..., file)`，FatFS 最终会对 SDMMC 驱动发出什么指令？

...

答：FatFS 会：

1. 算出这个文件当前写到哪个**簇**（cluster，通常 8 个扇区）
2. 找到这个簇对应的**扇区号**
3. 调用 SDMMC 的 `disk_write(扇区号, 缓冲区, 扇区数)`
4. 如果写完当前簇，还要更新 **FAT 表**（文件分配表，记录"这个文件下一簇在哪"）
5. 更新**目录项**（文件大小、修改时间）

一个简单的 `fwrite` 可能对应 2~5 次底层扇区读写。**FatFS 帮你做了所有这些翻译**。

---

### 现在先回答你最初的问题

**问题 1 答案**：**SD 卡是一台小电脑**。它里面有一块 NAND Flash 存储介质 + 一个**控制器芯片（微控制器）**。这个控制器负责：

- 磨损均衡（让每个 Flash 块均匀磨损，延长寿命）
- 错误纠正（Flash 老化会出错，控制器自动修复）
- 坏块管理
- 和主机通信

你的 MCU 不是直接操作 Flash，而是**通过 SD 协议和这个控制器对话**。

**问题 2 答案**：

- SD 卡：NAND Flash + 控制器
- U 盘：NAND Flash + USB 控制器
- SSD：NAND Flash + 高级控制器
- **W25Q 是 NOR Flash**（和 NAND 不同，NOR 能直接读随机地址但密度低）
- 机械硬盘：磁性介质

SD 卡和 U 盘的**存储介质一样**，只是**接口协议不同**。

**问题 3 答案**：**操作系统（或 MCU 上的 FatFS）**维护"文件"概念。SD 卡自己完全不知道。

---

### 第一部分：SD 卡的接口协议

SD 卡有两种通信接口：

**接口 A：SPI 模式**

- 用 4 根线（MOSI、MISO、SCK、CS）
- 速度慢（最多几十 Mbps）
- 接线简单，任何 MCU 的 SPI 都能用
- F103 用 SD 卡就是走这条路

**接口 B：SDIO / SDMMC 模式**（H723 用这个）

- 用 6 根线（CMD、CLK、D0、D1、D2、D3 —— 4 线宽数据总线）
- 速度快（最高 50MHz × 4bit = 200Mbps）
- 需要 MCU 专门的 SDMMC 外设
- **商业产品基本都用这个**

H723 有**两个 SDMMC 外设**（SDMMC1、SDMMC2），专门为 SD 卡/eMMC 设计。速度比 SPI 快 10 倍以上。

#### 物理接线

SD 卡（标准尺寸）9 个引脚，Micro SD 卡 8 个引脚。典型接线（Micro SD）：

```
STM32H723          Micro SD 卡
──────────         ───────────
PC8  (SDMMC1_D0)  ── DAT0
PC9  (SDMMC1_D1)  ── DAT1
PC10 (SDMMC1_D2)  ── DAT2
PC11 (SDMMC1_D3)  ── DAT3 (也是 CD/CS)
PC12 (SDMMC1_CK)  ── CLK
PD2  (SDMMC1_CMD) ── CMD
3.3V              ── VDD
GND               ── VSS1, VSS2

每根数据线和CMD线都要 10kΩ~50kΩ 上拉到 3.3V
(有的 SD 卡座自带上拉，看模块)
```

**淘宝搜 "Micro SD 卡模块" 或 "SD 卡座模块"** 就能买到接线好的，5~10 块钱。

---

### 第二部分：SD 卡协议的关键概念

#### 卡的类型和容量

- **SD（SDSC）**：≤ 2GB，按字节寻址
- **SDHC**：2GB~32GB，按扇区（512B）寻址 ← 最常见
- **SDXC**：32GB~2TB，按扇区寻址

**重要**：现在买到的基本都是 SDHC 或 SDXC，按扇区寻址。地址 0 是第 0 扇区的 0 字节，地址 1 是第 1 扇区的 0 字节（注意不是第 1 字节）。

#### 扇区大小

**标准：512 字节**。不管 SD 卡多大，每个扇区都是 512 字节。这是文件系统设计的基础。

**为什么是 512 字节？** 历史原因——起源于软盘、硬盘时代。现代存储其实可以用更大扇区，但为了兼容性，SD 卡对外还是暴露 512 字节扇区。

#### 命令系统

SD 卡用"命令 + 响应"方式通信，不是字节流。主机发命令（比如 CMD17 = 读单个扇区），卡返回响应 + 数据。主要命令：

- `CMD0`：复位
- `CMD8`：问 SD 卡版本
- `CMD17`：读单扇区
- `CMD24`：写单扇区
- `CMD18`：读多扇区
- `CMD25`：写多扇区
- `ACMD41`：初始化

**好消息是**：HAL 库把这些全封装了。你只需要调用 `HAL_SD_ReadBlocks()` 和 `HAL_SD_WriteBlocks()`。但你要知道这些命令存在，调试时才看得懂。

#### 一次读扇区的流程（帮你建立物理直觉）

用 SDIO 模式读扇区 1000 的过程：

```
1. MCU 通过 CMD 线发 CMD17，参数 = 1000 × 512 = 512000
   （扇区号 × 扇区大小，虽然 SDHC 直接用扇区号，但历史遗留）
2. SD 卡收到命令，开始在内部 Flash 里找扇区 1000
3. 大约 1~2ms 后，SD 卡通过 D0~D3 四条线同时传输数据
4. 512 字节数据通过 4 bit 并行传输，占用约 200 时钟周期
5. 同时有 CRC 校验，硬件自动检查
6. DMA 把数据搬到你的缓冲区
7. 完成中断触发，你的回调函数处理
```

**关键理解**：SDIO 比 SPI 快的主要原因——4 bit 并行而不是 1 bit 串行，加上 50MHz 更高频率。

---

### 停下来思考

**思考题 C**：假设你要以最高速度连续写 100MB 数据到 SD 卡。下面哪个策略最优？为什么？

- (A) 每收到 1 字节就调用 `HAL_SD_WriteBlocks(buffer, 1字节)`
- (B) 累积到 512 字节（一个扇区）后，调用 `HAL_SD_WriteBlocks(buffer, 1扇区)`
- (C) 累积到 4096 字节（8 个扇区 = 1 簇）后，一次写 8 扇区
- (D) 累积到 64KB 或更大，一次写几百扇区

先自己想，再看答案。

...

**答案：(D)**。

原因：SD 卡每次写操作都有**固定开销**（命令、内部 Flash 编程延迟、更新磨损均衡表），一次写 512 字节 vs 一次写 64KB，单位数据的开销差几十倍。

**典型性能数据**：

- 单扇区写：~2MB/s
- 批量写（64KB）：~20MB/s
- 批量写（1MB）：~50MB/s

这就是为什么数据记录器设计里有**"先写到 RAM 缓冲区，攒够再刷到 SD"**的模式。

---

### 第三部分：FatFS 文件系统

到这里你应该能理解——**SDMMC 只负责扇区读写**，"文件"这个概念需要上面加一层**文件系统**。

FatFS 是一个免费、开源的嵌入式文件系统库，实现 FAT12/FAT16/FAT32/exFAT 协议。它是**纯 C 库**，不依赖任何 OS，几十 KB 的代码。

#### FatFS 提供什么

类似 stdio 的 API：

c

```c
FATFS fs;
FIL file;

f_mount(&fs, "", 0);
f_open(&file, "hello.txt", FA_WRITE | FA_CREATE_ALWAYS);
f_write(&file, "Hello World", 11, &bw);
f_close(&file);
f_mount(NULL, "", 0);
```

熟悉吧？就是 `fopen/fwrite/fclose` 的嵌入式版本。

#### FatFS 需要你提供的"底层接口"

FatFS 是**硬件无关**的——它不知道你用 SD 卡、U 盘、NAND Flash 还是 SPI Flash。为了让它工作，你需要实现一组叫 **Disk I/O** 的底层接口：

c

```c
/* FatFS 要求你实现这些函数 */
DSTATUS disk_initialize(BYTE pdrv);
DSTATUS disk_status(BYTE pdrv);
DRESULT disk_read(BYTE pdrv, BYTE* buff, DWORD sector, UINT count);
DRESULT disk_write(BYTE pdrv, const BYTE* buff, DWORD sector, UINT count);
DRESULT disk_ioctl(BYTE pdrv, BYTE cmd, void* buff);
```

**FatFS 说"我要第 1000 扇区"，你的 `disk_read` 就调用 `HAL_SD_ReadBlocks()` 从 SD 卡读**。

好消息：**CubeMX 会自动帮你生成这些接口的实现**。你生成 FatFS 中间件时，它会把 SDMMC 的 HAL 调用绑进来。你不用写一行底层代码。

#### FatFS 的分层架构

```
┌─────────────────────────────────────┐
│ 你的应用代码                         │
│ f_open, f_read, f_write, ...        │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ FatFS 核心（ff.c）                   │
│ 理解 FAT32 格式、管理目录和文件      │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ Disk I/O 层（diskio.c）              │
│ 你实现的 disk_read / disk_write      │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ SDMMC HAL（HAL_SD_ReadBlocks等）    │
└─────────────┬───────────────────────┘
              │
┌─────────────▼───────────────────────┐
│ 物理 SD 卡                          │
└─────────────────────────────────────┘
```

这又是**分层设计**的经典应用——每层只关心上下两层的接口，中间层可以替换。

#### 停下来思考

**思考题 D**：假设你想把 FatFS 从 SD 卡改用到"外挂的 QSPI Flash"（下一课的主题）。需要改哪些层？

...

**答案**：**只改 Disk I/O 层**。把 `disk_read` 改成调用 QSPI 驱动而不是 SDMMC 驱动。FatFS 核心完全不用动，你的应用代码（`f_open` 等）也完全不用动。

**这就是好架构的威力**——我们一直在讲"抽象层"的价值，这里是一个完美的案例。

---

### 第四部分：CubeMX 配置完整流程

#### Step 1：启用 SDMMC1

1. 左侧 `Connectivity` → `SDMMC1`
2. `Mode`：选 **`SD 4 bits Wide bus`**（4 线模式，最快）
3. `Parameter Settings`：
    - `SDMMC Clock Transceiver`：`Disable`（我们不用特殊收发器）
    - `Clock Power Save`：`Disable`（先不省电，简单）
    - `Hardware Flow Control`：`Enable`（推荐开，防数据丢失）
    - `SDMMC Clock Divider`：`2`（就是分频，先保守，工作后再调优）
4. DMA 配置（重要！H723 的 SDMMC 通常用内部 IDMA，CubeMX 默认会配好）

#### Step 2：配置时钟

在 Clock Configuration 选项卡：

- 找到 `SDMMC Clock Mux`
- 源选 `PLL1Q` 或 `PLL2R`（看你系统怎么配）
- SDMMC 时钟最好是 48MHz 左右（除以分频后得到卡时钟 24MHz，符合 SD 规范的高速模式）

#### Step 3：启用 FatFS

1. 左侧 `Middleware and Software Packs` → `FATFS`
2. `Mode`：勾选 **`SD Card`**
3. `Platform Settings` 里把 FatFS 绑定到 SDMMC1：
    - 不用改，它会自动检测
4. `Configuration` → `Set Defines`：
    - `USE_LFN`（长文件名）：选 `Enabled with dynamic working buffer on the HEAP` 或 `Enabled with static working buffer`
    - `MAX_SS`（最大扇区大小）：512
    - `FS_READONLY`：Disabled（要写入）
    - 其他默认

#### Step 4：增加堆和栈大小

FatFS 需要较多栈和堆（特别是长文件名支持）。在 `Project Manager` → `Linker Settings`：

- `Minimum Heap Size`：`0x1000`（4KB）
- `Minimum Stack Size`：`0x2000`（8KB）

#### Step 5：生成代码

---

### 第五部分：写第一个 SD 卡程序

#### 最简单的"Hello SD 卡"

c

```c
#include "fatfs.h"   // CubeMX 生成的 FatFS 集成
#include <string.h>

int main(void)
{
    /* ... CubeMX 初始化 ... */
    MX_FATFS_Init();
    
    FATFS fs;
    FIL fp;
    FRESULT res;
    UINT bw;   // bytes written
    
    /* 挂载文件系统 */
    res = f_mount(&fs, "", 1);   // 1 = 立即挂载
    if (res != FR_OK) {
        printf("Mount failed: %d\r\n", res);
        Error_Handler();
    }
    printf("SD card mounted\r\n");
    
    /* 打开（或创建）文件 */
    res = f_open(&fp, "hello.txt", FA_WRITE | FA_CREATE_ALWAYS);
    if (res != FR_OK) {
        printf("Open failed: %d\r\n", res);
        goto fail;
    }
    
    /* 写入 */
    const char *msg = "Hello from STM32H723!\r\n";
    res = f_write(&fp, msg, strlen(msg), &bw);
    printf("Wrote %u bytes\r\n", bw);
    
    /* 关闭（这步会把缓冲区数据刷到卡上）*/
    f_close(&fp);
    
    /* 重新打开读出来验证 */
    char read_buf[64] = {0};
    UINT br;
    res = f_open(&fp, "hello.txt", FA_READ);
    f_read(&fp, read_buf, sizeof(read_buf) - 1, &br);
    f_close(&fp);
    printf("Read back: %s\r\n", read_buf);
    
fail:
    f_mount(NULL, "", 0);   /* 卸载 */
    
    while (1) {
        HAL_GPIO_TogglePin(LED_GPIO_Port, LED_Pin);
        HAL_Delay(500);
    }
}
```

#### 烧录前的检查

1. **SD 卡必须预先格式化为 FAT32**（电脑上用 SD Formatter 或右键格式化）
2. **SD 卡容量别太大**，32GB 以内最稳（更大的容量需要 exFAT，配置复杂点）
3. **接线检查三次**，SD 卡对接线很敏感
4. **上拉电阻**：如果你的 SD 卡模块没带上拉，每根 DAT 线和 CMD 线都要 10k~50k 上拉到 3.3V

#### 成功的话，串口应该输出

```
SD card mounted
Wrote 23 bytes
Read back: Hello from STM32H723!
```

然后把 SD 卡拔下来插到电脑上，**应该能看到 hello.txt 文件**，内容和打印的一样。**这就是嵌入式和桌面系统的互通**。

---

### 第六部分：Cache 一致性陷阱（重要！）

回忆上一课讲的 Cache 问题。**SD 卡操作是 DMA 驱动的**——HAL_SD_WriteBlocks 底层通过 DMA 把缓冲区数据搬到 SDMMC 外设。

这意味着：

c

```c
uint8_t buffer[512];
strcpy((char*)buffer, "Hello");

HAL_SD_WriteBlocks_DMA(&hsd1, buffer, 100, 1);  // DMA 写扇区 100
```

**CPU 写了 buffer（进 Cache，没进 SRAM）→ DMA 读 SRAM（拿旧值）→ 写到 SD 卡的是错的 → 文件内容损坏**

FatFS 内部会遇到这个坑。**解决方案**：

#### 方案 A：在 FatFS 的 `disk_read/disk_write` 里加 Cache 操作

打开 CubeMX 生成的 `user_diskio.c` 或 `sd_diskio.c`，你会看到类似这样的代码：

c

```c
DRESULT SD_read(BYTE lun, BYTE *buff, DWORD sector, UINT count)
{
    /* ... 调用 HAL_SD_ReadBlocks_DMA ... */
}
```

在 DMA 读完后，**对 buff 做 Invalidate**：

c

```c
SCB_InvalidateDCache_by_Addr((uint32_t*)buff, count * 512);
```

在 DMA 写之前，**对 buff 做 Clean**：

c

```c
SCB_CleanDCache_by_Addr((uint32_t*)buff, count * 512);
```

#### 方案 B（推荐）：把 FatFS 的缓冲区放到 Non-Cacheable 内存

用 MPU 把一块 SRAM（比如 SRAM1）标记为 Non-Cacheable，让 FatFS 的所有中间缓冲区落在这里。这样 Cache 问题永远不会出现。

#### 方案 C：完全关闭 DCache（最省事但性能损失）

在 `main.c` 里 **不调用** `SCB_EnableDCache()`，保持 DCache 关闭。代码简单但 CPU 性能会下降 30~50%。

---

### 本课任务

#### 必做

1. **"Hello SD"**：按上面流程创建、写入、读取一个文件，卡上取出在电脑确认内容。
2. **目录遍历**：写一个函数 `list_dir("/")`，列出 SD 卡根目录所有文件和大小。用 `f_opendir` / `f_readdir` 实现。

#### 进阶

**进阶 1**：**数据记录器**。ADC 采集电位器，每 100ms 把 `(时间戳, 电压)` 写入一行到 `log.csv`。运行 10 分钟后拔卡到电脑，用 Excel 打开能看到曲线。

这个是 SD 卡最经典的应用场景——**长期数据采集**。

**进阶 2**：**Cache 一致性实验**。故意不做 Cache 处理，看能不能稳定写入。（测试环境：AXI SRAM + DCache 开启）。观察错误现象——可能是文件内容错乱、FAT 损坏、或完全不可读。这是**亲身体验 Cache 一致性 bug** 的好机会。然后加上 Clean/Invalidate，验证修复。

#### 挑战

**挑战 1**：**断电安全写入**。设计一个日志系统，即使在写入过程中突然断电，文件系统也不会损坏。提示：

- FatFS 有 `f_sync()` 函数，强制刷盘
- 合理设计写入频率（每条日志都 sync 太慢，完全不 sync 又危险）
- 可以用**双文件**策略：写日志 A 到崩溃阈值，切换到日志 B

这是工业数据记录器的核心设计问题，面试常问。

**挑战 2**：**速度基准测试**。写一个程序，测量你的 SD 卡：

- 单扇区连续写的速度（bytes/s）
- 64KB 批量写的速度
- 1MB 批量写的速度

你会看到 10 倍以上的差异，亲身理解"为什么要批量写"。

---

### 停下来互动

本课任务量比较大，我想听听你的反馈：

**反馈 1**：你能清晰说出 **SDMMC 驱动层** 和 **FatFS 文件系统层** 的职责划分吗？如果能，就掌握了今天最重要的概念。

**反馈 2**：思考题 C、D 你的答案是什么？特别是 D——它展示了"抽象层"的威力。

**反馈 3**：你打算先做"Hello SD"还是直接挑战数据记录器？

**反馈 4**：Cache 一致性问题在 SD 卡场景下如何理解？能自己用一句话说明为什么 SD 写入需要 Clean？

---

### 下一课预告

做完 SD 卡相关实验后，下次可以选：

- **B. QSPI**：外挂 Flash，和 SD 卡对比"两种外部存储"的设计哲学。也能引出"内存映射模式"这个很酷的特性——让外部 Flash 像内部 Flash 一样被 CPU 直接执行代码。
- **C. DMA2D + LCD**：图形化 + 性能加速。如果你对 GUI 感兴趣可以选这个。
- **E. 定时器高级功能**：输入捕获、编码器、同步——做精确测量和电机。

或者换一个方向：

- 回到**综合项目**，用 SD 卡做数据记录器，结合前面学的 ADC + RTOS + 按键菜单

我的建议是先把 SD 卡跑通再选下一步。如果 SD 卡遇到问题（新手 80% 会卡在硬件接线或 Cache 问题上），我们可以花时间调试——**调试过程本身就是最好的学习**。

等你的反馈。🚀
## H723 新外设深入：第三弹 —— QSPI 与内存映射模式

好，讲 QSPI。这一课我准备换个方式——我想让你**先基于已学知识推导**，而不是我直接告诉你答案。因为 QSPI 本质上是你已经学过的 SPI 的"升级版"，你应该能自己推导出很多东西。

---

### 先让你自己推理

你已经深入学过 SPI（第五课的 W25Q Flash），也学过 SDMMC（上一课）。现在看到"QSPI"这个名字，我想先让你思考几个问题：

**问题 1**：从名字猜——**Q**SPI 的 **Q** 代表什么？（提示：回忆一下 SPI 有几根数据线？如果你要"升级"SPI，最自然的方向是什么？）

**问题 2**：SPI 一次传 1 bit（MISO 或 MOSI 各一根线）。如果让你设计 QSPI，你会怎么改？

- (a) 提高时钟频率（比如从 50MHz 升到 200MHz）
- (b) 增加数据线数量
- (c) 两者都做
- (d) 完全改变协议

**问题 3**：你在第五课学 SPI Flash 时，读 1 字节大致要多久？让我们简单估算：W25Q64 @ 50MHz SPI，读 1 字节需要"1 命令字节 + 3 地址字节 + 1 数据字节" = 5 × 8 bit = 40 bit，约 0.8μs。

如果 QSPI 把数据线扩到 4 条，速度会变快多少？1/4 的时间？还是有别的复杂因素？

先自己想，不用查资料。

---

### 假设你已经推理完了

我来补答案：

**问题 1 答案**：**Q = Quad**（四）。**QSPI = Quad SPI = 4 根数据线的 SPI**。

**问题 2 答案**：**(c) 两者都做**。QSPI 不只增加了数据线，也把时钟频率推到 100~200MHz。

**问题 3 答案**：**不是简单的 1/4 时间**。我们来仔细想想。

QSPI 读 1 字节的过程，**命令段和地址段可以走 1 线、2 线或 4 线**，数据段同样。最常见的配置：

- 命令：1 字节，1 线传输（兼容 SPI 传统命令集）
- 地址：3 字节，4 线传输（"Quad"版本）
- **Dummy 周期**：通常 8 个 clock（Flash 内部准备数据的时间）
- 数据：N 字节，4 线传输

读 1 字节耗时：

- 命令：8 clock
- 地址：3 × 8 / 4 = 6 clock
- Dummy：8 clock
- 数据：2 clock
- 共：24 clock @ 100MHz = 0.24μs

相比 SPI 的 0.8μs，**确实快 3~4 倍**。但如果你读 1000 字节：

- SPI：40 + 1000 × 8 = 8040 clock @ 50MHz = 161μs
- QSPI：24 + 1000 × 2 = 2024 clock @ 100MHz = 20μs

**快 8 倍**！因为 QSPI 的固定开销（命令+地址+dummy）不变，但数据量越大，单位字节的开销越小。

---

### 现在引出今天的核心——QSPI 不只是"更快的 SPI"

如果 QSPI 只是"速度快一点"，它就不值得单独讲一课。它真正的革命性特性是——

**内存映射模式（Memory-Mapped Mode）**

让我先让你思考，再揭晓这有多酷。

**问题 4**：你的 H723 内部 Flash 是 1MB。你写的代码编译后放在 Flash 里，CPU 通过类似 `0x08000000 + offset` 的地址直接取指令执行。你**不需要"先读 Flash 再执行"**——CPU 直接从 Flash 取指。

现在假设你外挂一个 QSPI Flash（比如 W25Q256，32MB）。**问题**：你能像使用内部 Flash 一样，让 CPU 直接从外部 QSPI Flash 取指执行代码吗？

如果能，意味着什么？如果不能，又为什么？

先自己想 30 秒。

...

---

### 答案：能！这就是内存映射模式

H723 的 QSPI 有个杀手级特性——**内存映射模式**。配置好后，外部 QSPI Flash **被映射到 CPU 地址空间的 0x90000000**，CPU 访问这个地址就像访问内部 Flash 一样**完全透明**。

c

```c
/* 配置 QSPI 为内存映射模式后 */
uint32_t *external_flash = (uint32_t*)0x90000000;
uint32_t data = *external_flash;    // ← CPU 自动通过 QSPI 硬件去读外部 Flash！
                                    //   完全像访问普通内存一样
```

**CPU 根本不知道这个地址在外部**——它像读内部 Flash 一样发地址，H723 内部的 QSPI 控制器拦截这个访问，自动生成 QSPI 命令，读 Flash，把数据返回给 CPU。

**这意味着你可以**：

1. **把代码存在外部 Flash 执行**：内部 1MB 不够用？32MB 的 QSPI Flash 直接作为代码空间用。
2. **把大量静态数据（图片、字体、音频）放在外部 Flash，直接读**：不用手动 `HAL_QSPI_Read()`，用指针访问即可。
3. **超出芯片限制的应用**：嵌入式图形界面（LVGL）需要大量字库和图片资源，QSPI 内存映射是标配。

#### 对比：传统 SPI Flash vs 内存映射 QSPI

**传统 SPI Flash（你在第五课学的方式）**：

c

```c
uint8_t buffer[64];
W25Q_ReadData(&flash, 0x1000, buffer, 64);   // 显式调用驱动
use_data(buffer);
```

- 需要手动调用读函数
- 数据先进 RAM 缓冲区才能用
- 想随机访问不同地址，要多次调用

**内存映射 QSPI**：

c

```c
uint8_t *data = (uint8_t*)(0x90001000);   // 对应外部 Flash 的 0x1000
use_data(data);                            // 直接用！硬件后台读取
```

- 不用调用任何函数
- 像访问内部 RAM 一样
- 可以直接 `data[i]` 随机访问

**但是有代价**——速度还是比内部 Flash 慢（毕竟要经过 QSPI 协议），而且是"只读"的（写必须切回间接模式）。

---

### 停下来思考

**思考题 A**：基于你对内存映射的理解，想想下面的代码在不同场景下的性能差异。

假设 `big_font_data` 是一个 1MB 的字库数组。

c

```c
const uint8_t big_font_data[1024 * 1024] = { ... };

int main() {
    uint32_t sum = 0;
    for (int i = 0; i < 1024 * 1024; i++) {
        sum += big_font_data[i];
    }
}
```

**场景 1**：`big_font_data` 放内部 Flash，CPU 开 ICache/DCache **场景 2**：`big_font_data` 放外部 QSPI Flash（内存映射模式），开 Cache **场景 3**：同场景 2，但关闭 Cache

你估计各场景耗时如何排序？差距多大量级？

...

**我的估计**：

- 场景 1：最快（Cache 命中+内部 Flash）
- 场景 2：中等（Cache 命中时等同场景1，未命中时慢 10~50 倍）
- 场景 3：最慢（每次访问都走 QSPI 协议）

**关键洞察**：**Cache 对 QSPI 内存映射的性能至关重要**。Cache 命中时相当于直接从 SRAM 读，几乎和内部 Flash 一样快。Cache 未命中时要走 QSPI 协议（慢几十倍）。

所以**外部 QSPI Flash + Cache 启用 ≈ 内部 Flash 的用户体验**，但容量大几十倍。这就是现代嵌入式产品（高端 MCU 跑 GUI、小型嵌入式 Linux）的标配方案。

---

### 第一部分：QSPI 的三种工作模式

H723 的 QSPI 控制器有三种工作模式，对应不同场景：

#### 模式 1：间接模式（Indirect Mode）

和你学的 SPI 一样的用法——调用函数读写。

c

```c
HAL_QSPI_Command(&hqspi, &cmd, HAL_QSPI_TIMEOUT_DEFAULT_VALUE);
HAL_QSPI_Receive(&hqspi, buffer, HAL_QSPI_TIMEOUT_DEFAULT_VALUE);
```

**用途**：写入数据（内存映射模式只能读）、擦除扇区、执行 Flash 特殊命令（读ID、查询状态）。

#### 模式 2：内存映射模式（Memory-Mapped Mode）

上面已经讲过——配置一次，之后像普通内存一样用。

c

```c
/* 配置后 */
uint8_t *p = (uint8_t*)0x90000000;
uint8_t value = p[12345];    // 读外部 Flash 的 0x3039 地址
```

**用途**：只读场景——代码执行、静态数据读取、GUI 资源。

#### 模式 3：状态轮询模式（Status Polling Mode）

专门用来**等 Flash 内部操作完成**。比如你发了"擦除扇区"命令，Flash 需要 100ms+ 完成。期间 CPU 要反复读 Flash 的状态寄存器判断是否完成。

QSPI 可以**自动轮询**——配置好之后，QSPI 硬件自己反复读状态寄存器，等到某个条件满足时触发中断通知 CPU。CPU 在这期间做别的事。

c

```c
/* 配置自动轮询，等 BUSY bit 变 0 */
HAL_QSPI_AutoPolling(&hqspi, &cmd, &polling_config, timeout);
/* 期间 CPU 可以做别的事，硬件自动轮询 */
```

**用途**：擦除/写入完成检测，彻底解放 CPU。

这三种模式是 H723 QSPI 的核心——**间接模式写，内存映射模式读，自动轮询模式等**。

---

### 第二部分：硬件选型和接线

#### 选什么 Flash？

H723 支持的 QSPI Flash 有很多。常见的选择：

|型号|容量|电压|最高速度|价格|
|---|---|---|---|---|
|W25Q64JV|8MB|3.3V|133MHz|~5元|
|W25Q128JV|16MB|3.3V|133MHz|~8元|
|**W25Q256JV**|**32MB**|**3.3V**|**133MHz**|~15元|
|MX25L51245G|64MB|3.3V|104MHz|~30元|

**推荐 W25Q64 或 W25Q128**——足够大，便宜，最主流。实际上这是你第五课用过的 W25Q 系列的 Quad 接口版本！**同一个芯片，既支持 SPI 也支持 QSPI**——看你用几根数据线。

#### H723 QSPI 引脚分配

典型引脚（H723VGT6）：

```
功能          引脚
────          ────
QSPI_CLK      PB2
QSPI_BK1_NCS  PB6 (片选)
QSPI_BK1_IO0  PD11 (D0, 兼容 MOSI)
QSPI_BK1_IO1  PD12 (D1, 兼容 MISO)
QSPI_BK1_IO2  PE2  (D2)
QSPI_BK1_IO3  PD13 (D3)
```

不同芯片封装引脚不同，CubeMX 会给你选。

#### 接线示意

```
STM32H723             W25Q128JV
─────────             ─────────
PB6 (NCS)  ─────── CS#
PB2 (CLK)  ─────── CLK
PD11 (IO0) ─────── DI/IO0
PD12 (IO1) ─────── DO/IO1
PE2  (IO2) ─────── WP#/IO2
PD13 (IO3) ─────── HOLD#/IO3
3.3V       ─────── VCC
GND        ─────── GND
```

**注意**：

- WP#（写保护）和 HOLD# 在 Quad 模式下变成 IO2 和 IO3
- Flash 模块**必须上拉 IO2 和 IO3**（防止进入 QPI 模式前误触发）
- 淘宝有现成的 QSPI Flash 模块，带好上拉电阻

---

### 第三部分：CubeMX 配置

#### Step 1：启用 QSPI

1. 左侧 `Connectivity` → `QUADSPI`
2. **Mode**：
    - `Bank 1` 启用
    - `Data Lines`：**`Quad`**（4 线）
3. **Parameter Settings**：
    - `Clock Prescaler`：`2`（开始保守，HCLK3 / 3 = QSPI 时钟）
    - `FIFO Threshold`：`4`
    - `Sample Shifting`：`No shift`（高速时可能需要 `Half cycle shift`）
    - `Flash Size`：`22`（意为 2^(22+1) = 8MB 地址空间，W25Q64 是 8MB）
    - `Chip Select High Time`：`1 cycle`
    - `Clock Mode`：`Mode 0`

#### Step 2：时钟配置

在 Clock Configuration：

- `QUADSPI` 时钟源可选 `AHB3`（和 HCLK3 同频）或 `PLL1Q/PLL2R`
- 简单起见，用 AHB3，比如 275MHz / 3 = 91MHz QSPI 时钟

#### Step 3：生成代码，CubeMX 会生成

c

```c
QSPI_HandleTypeDef hqspi;

void MX_QUADSPI_Init(void)
{
    hqspi.Instance = QUADSPI;
    hqspi.Init.ClockPrescaler = 2;
    hqspi.Init.FifoThreshold = 4;
    hqspi.Init.SampleShifting = QSPI_SAMPLE_SHIFTING_NONE;
    hqspi.Init.FlashSize = 22;
    hqspi.Init.ChipSelectHighTime = QSPI_CS_HIGH_TIME_1_CYCLE;
    hqspi.Init.ClockMode = QSPI_CLOCK_MODE_0;
    HAL_QSPI_Init(&hqspi);
}
```

---

### 第四部分：写 QSPI Flash 驱动

你在第五课写过 W25Q 的 SPI 驱动。现在我们写 QSPI 版本，**核心思路完全一样**，只是用不同 API。

#### 读 ID 验证连接

c

```c
#define W25Q_CMD_READ_ID          0x9F
#define W25Q_CMD_WRITE_ENABLE     0x06
#define W25Q_CMD_READ_STATUS_1    0x05
#define W25Q_CMD_SECTOR_ERASE     0x20
#define W25Q_CMD_QUAD_PAGE_PROG   0x32  // 用 Quad 模式写
#define W25Q_CMD_FAST_READ_QUAD   0x6B  // 用 Quad 模式读

HAL_StatusTypeDef W25Q_ReadID(uint32_t *id)
{
    QSPI_CommandTypeDef cmd = {0};
    uint8_t data[3];
    
    cmd.InstructionMode = QSPI_INSTRUCTION_1_LINE;    // 命令用 1 线
    cmd.Instruction = W25Q_CMD_READ_ID;
    cmd.AddressMode = QSPI_ADDRESS_NONE;              // 无地址
    cmd.AlternateByteMode = QSPI_ALTERNATE_BYTES_NONE;
    cmd.DataMode = QSPI_DATA_1_LINE;                  // 数据用 1 线（读 ID 是传统命令）
    cmd.NbData = 3;                                   // 读 3 字节
    cmd.DummyCycles = 0;
    cmd.DdrMode = QSPI_DDR_MODE_DISABLE;
    cmd.DdrHoldHalfCycle = QSPI_DDR_HHC_ANALOG_DELAY;
    cmd.SIOOMode = QSPI_SIOO_INST_EVERY_CMD;
    
    if (HAL_QSPI_Command(&hqspi, &cmd, HAL_QSPI_TIMEOUT_DEFAULT_VALUE) != HAL_OK)
        return HAL_ERROR;
    
    if (HAL_QSPI_Receive(&hqspi, data, HAL_QSPI_TIMEOUT_DEFAULT_VALUE) != HAL_OK)
        return HAL_ERROR;
    
    *id = (data[0] << 16) | (data[1] << 8) | data[2];
    return HAL_OK;
}

/* 使用 */
uint32_t id;
W25Q_ReadID(&id);
printf("Flash ID: 0x%06lX\r\n", id);
/* W25Q64: 0xEF4017, W25Q128: 0xEF4018, W25Q256: 0xEF4019 */
```

#### 停下来对比一下

和你第五课写的 SPI 版本对比：

c

```c
/* SPI 版本（第五课）*/
_cs_low(f);
_spi_xfer(f, 0x9F);              // 发命令
id |= _spi_xfer(f, 0xFF) << 16;  // 逐字节接收
id |= _spi_xfer(f, 0xFF) << 8;
id |= _spi_xfer(f, 0xFF);
_cs_high(f);

/* QSPI 版本（当前）*/
cmd.Instruction = 0x9F;
cmd.DataMode = QSPI_DATA_1_LINE;
cmd.NbData = 3;
HAL_QSPI_Command(&hqspi, &cmd, ...);
HAL_QSPI_Receive(&hqspi, data, ...);
```

**差异**：SPI 是"一位一位、一字节一字节"构造协议，QSPI 是"声明整体结构让硬件去做"。QSPI 把协议各段（命令/地址/dummy/数据）**抽象成一个 `QSPI_CommandTypeDef` 结构体**，你填字段硬件执行。

**思考题 B**：为什么 QSPI 要这样设计 API？如果让 QSPI 像 SPI 一样用"字节流 API"，行不行？

...

**原因**：QSPI 的各段可以**以不同线宽**传输（命令 1 线、地址 4 线、数据 4 线），硬件需要知道整个命令的结构才能正确切换线宽。用"字节流"模式无法表达"这 3 字节是 4 线传输"这种语义。

这是一个典型的**协议层抽象**——API 的设计体现了协议的特性。

#### 用 Quad 模式高速读

启用 Quad 模式的 Fast Read 命令（`0x6B`）：

c

```c
HAL_StatusTypeDef W25Q_QuadRead(uint32_t addr, uint8_t *buf, uint32_t len)
{
    QSPI_CommandTypeDef cmd = {0};
    
    cmd.InstructionMode = QSPI_INSTRUCTION_1_LINE;    // 命令仍 1 线（兼容）
    cmd.Instruction = W25Q_CMD_FAST_READ_QUAD;
    cmd.AddressMode = QSPI_ADDRESS_1_LINE;            // 地址 1 线（传统 Fast Read Quad Output）
    cmd.AddressSize = QSPI_ADDRESS_24_BITS;
    cmd.Address = addr;
    cmd.DataMode = QSPI_DATA_4_LINES;                 // ← 数据用 4 线！
    cmd.NbData = len;
    cmd.DummyCycles = 8;                              // W25Q 需要 8 个 dummy clock
    cmd.DdrMode = QSPI_DDR_MODE_DISABLE;
    cmd.DdrHoldHalfCycle = QSPI_DDR_HHC_ANALOG_DELAY;
    cmd.SIOOMode = QSPI_SIOO_INST_EVERY_CMD;
    
    if (HAL_QSPI_Command(&hqspi, &cmd, HAL_QSPI_TIMEOUT_DEFAULT_VALUE) != HAL_OK)
        return HAL_ERROR;
    
    return HAL_QSPI_Receive(&hqspi, buf, HAL_QSPI_TIMEOUT_DEFAULT_VALUE);
}
```

**注意"Dummy Cycles"**——这是 Flash 内部准备数据的时间。W25Q 系列在 Quad Read 模式下需要 8 个 clock。查 Flash 数据手册！写错了读不到数据。

---

### 第五部分：内存映射模式——今天的高潮

#### 配置内存映射

c

```c
HAL_StatusTypeDef W25Q_EnableMemoryMapped(void)
{
    QSPI_CommandTypeDef cmd = {0};
    QSPI_MemoryMappedTypeDef cfg = {0};
    
    /* 描述"读取命令"的结构 */
    cmd.InstructionMode = QSPI_INSTRUCTION_1_LINE;
    cmd.Instruction = W25Q_CMD_FAST_READ_QUAD;
    cmd.AddressMode = QSPI_ADDRESS_1_LINE;
    cmd.AddressSize = QSPI_ADDRESS_24_BITS;
    cmd.DataMode = QSPI_DATA_4_LINES;
    cmd.DummyCycles = 8;
    cmd.DdrMode = QSPI_DDR_MODE_DISABLE;
    cmd.DdrHoldHalfCycle = QSPI_DDR_HHC_ANALOG_DELAY;
    cmd.SIOOMode = QSPI_SIOO_INST_EVERY_CMD;
    
    /* 映射配置 */
    cfg.TimeOutActivation = QSPI_TIMEOUT_COUNTER_DISABLE;  // 禁用超时（总保持映射）
    cfg.TimeOutPeriod = 0;
    
    return HAL_QSPI_MemoryMapped(&hqspi, &cmd, &cfg);
}
```

调用它之后——**就这一次**——外部 Flash 就映射到 `0x90000000` 了。

#### 使用：像内部 Flash 一样

c

```c
int main(void)
{
    /* ... 初始化 ... */
    W25Q_EnableMemoryMapped();
    
    /* 直接用指针访问外部 Flash！*/
    uint8_t *ext_flash = (uint8_t*)0x90000000;
    
    printf("Byte at offset 0x100: 0x%02X\r\n", ext_flash[0x100]);
    printf("Bytes: ");
    for (int i = 0; i < 16; i++) {
        printf("%02X ", ext_flash[i]);
    }
    printf("\r\n");
    
    /* 甚至可以把外部 Flash 的数据当结构体 */
    typedef struct { uint32_t magic; char name[64]; } Header;
    Header *hdr = (Header*)0x90000000;
    printf("Magic: 0x%08X, Name: %s\r\n", hdr->magic, hdr->name);
    
    while (1) { /* ... */ }
}
```

**这一切 CPU 完全不知道是外部 Flash**。它看到的就是普通内存访问，背后 QSPI 硬件自动生成 Fast Read Quad 命令。

#### 写的情况

**内存映射模式只能读**。如果你想写外部 Flash：

c

```c
HAL_QSPI_Abort(&hqspi);              // 退出内存映射
W25Q_WriteEnable();
W25Q_QuadPageProgram(addr, data, len);  // 用间接模式写
W25Q_WaitBusy();
W25Q_EnableMemoryMapped();           // 重新进入内存映射
```

写操作必须退出映射模式——因为 Flash 协议上"写"和"读"是完全不同的命令序列。

#### 停下来思考

**思考题 C**：基于前面讨论的"Cache 对内存映射性能至关重要"，想想下面的代码：

c

```c
/* 场景 1：关闭 DCache */
uint32_t sum = 0;
uint8_t *ext = (uint8_t*)0x90000000;
for (int i = 0; i < 1000; i++) {
    sum += ext[i];   // 每次都走 QSPI 读
}

/* 场景 2：开启 DCache */
/* 同样代码 */
```

分析：场景 1 每次读都走 QSPI，场景 2 呢？

...

**答案**：场景 2 会怎样？

- 第一次 `ext[0]` 被访问时，Cache 未命中，走 QSPI 读一个 Cache Line（32 字节）到 Cache
- `ext[1]..ext[31]` 被访问时，Cache 命中，**不走 QSPI**
- 到 `ext[32]`，又未命中，再读 32 字节
- ...

所以 1000 次访问只引发了 ~32 次 QSPI 实际读取。**Cache 把连续访问的开销分摊了**。

这和 DDR SDRAM 的内存访问原理一样——空间局部性是性能优化的核心。

---

### 第六部分：把代码放到外部 Flash 执行（XIP）

**XIP** = eXecute In Place，原地执行。意思是 CPU 直接从外部 Flash 取指，不需要把代码先拷贝到 RAM。

这是 H723 的高级特性。要实现它，你需要：

#### 1. 修改链接脚本

在 `.ld` 文件里加一个内存区域：

ld

```ld
MEMORY
{
  /* 内部 */
  FLASH (rx) : ORIGIN = 0x08000000, LENGTH = 1024K
  DTCMRAM (xrw) : ORIGIN = 0x20000000, LENGTH = 128K
  /* ... */
  
  /* 外部 QSPI Flash */
  QSPI (rx) : ORIGIN = 0x90000000, LENGTH = 8M
}

SECTIONS
{
  /* 正常的 .text 段放内部 Flash */
  .text : { ... } >FLASH
  
  /* 把"次要代码"放外部 Flash */
  .external_code :
  {
    *(.external_code)
    *(.external_code.*)
  } >QSPI
}
```

#### 2. 在代码里指定哪些函数放外部 Flash

c

```c
__attribute__((section(".external_code")))
void big_ui_function(void) {
    /* 一个很大的 UI 处理函数 */
    /* ... */
}

int main(void) {
    W25Q_EnableMemoryMapped();
    big_ui_function();   // 会自动从 0x90000000 区域取指执行！
}
```

#### 3. 把编译后的代码预先烧到外部 Flash

这需要一个"两段启动"流程：

- **启动代码（内部 Flash）**：初始化时钟、QSPI，进入内存映射模式
- **应用代码（外部 Flash）**：大部分应用在这里
- 烧录时：先烧内部 Flash 的启动代码，再用启动代码把应用写到外部 Flash（或用 ST-Link 的外部 Loader 直接烧）

实际工程里很少用纯 XIP，更多是 **"内部 Flash 存代码 + 外部 Flash 存数据资源"** 的混合模式。

---

### 停下来做几道综合题

**综合题 1**：假设你在做一个 GUI 产品（用 LVGL 跑在 H723 上），需要：

- 代码 800KB
- 字体和图标资源 5MB
- 音频文件 2MB
- 运行时堆 + 栈 100KB

H723 内部 Flash 1MB，内部 RAM 564KB。你会怎么规划？

...

**参考方案**：

- 代码放内部 Flash（1MB 够）
- 字体、图标、音频放外部 QSPI Flash + 内存映射（直接访问）
- 堆栈放 DTCM（最快）
- LVGL 的帧缓冲（Frame Buffer）放 AXI SRAM + Non-Cacheable MPU 区（DMA2D 会用）

**综合题 2**：为什么 QSPI 不能替代 SDMMC？它们各自的最佳场景是什么？

...

**参考答案**：

||QSPI Flash|SD 卡|
|---|---|---|
|容量|几 MB ~ 几百 MB|几 GB ~ 几百 GB|
|速度|非常快（内存映射）|较快（DMA 批量）|
|可更换性|焊死在 PCB|用户可插拔|
|价格/GB|贵|便宜|
|写次数寿命|10万~100万次|几千次（消费级）|
|文件系统|需要自己管理|天然 FAT32|

**QSPI 适合**：产品固件、字库、固定资源（代码+数据） **SD 卡适合**：用户数据、日志、大容量存储、可换介质

---

### 本课任务

#### 必做

1. **硬件准备**：买一个 QSPI Flash 模块（W25Q128JV 推荐）
2. **ID 验证**：读出 Flash ID，确认硬件通信正常
3. **Quad 读写**：用间接模式写入一段数据，再读回验证
4. **内存映射实验**：进入内存映射模式，用普通指针读出数据，和间接模式读出的数据对比

#### 进阶

**进阶 1**：**速度对比**。用 DWT 周期计数器测量以下操作耗时：

- 普通 SPI 模式读 1KB（你第五课的代码）
- QSPI 间接模式 Quad 读 1KB
- QSPI 内存映射 + DCache 命中读 1KB

应该看到 10+ 倍的性能差异。

**进阶 2**：**把一张图片存进外部 Flash，代码中显示**。用脚本把 `image.bin` 烧到 QSPI Flash 的某个地址（0x1000 开始），代码里 `uint8_t *img = (uint8_t*)(0x90001000)`，直接传给显示函数。

#### 挑战

**挑战**：**实现外部 Flash 上的 FatFS**。回忆上一课讲的文件系统分层——FatFS 核心不关心存储介质，你只需要把 `disk_read/disk_write` 绑定到 QSPI 操作，就能在外部 Flash 上建一个文件系统。

c

```c
/* 改 user_diskio.c */
DRESULT USER_read(BYTE pdrv, BYTE *buff, DWORD sector, UINT count) {
    return W25Q_QuadRead(sector * 512, buff, count * 512) == HAL_OK 
           ? RES_OK : RES_ERROR;
}

DRESULT USER_write(BYTE pdrv, const BYTE *buff, DWORD sector, UINT count) {
    /* 注意：Flash 写之前必须先擦除所在扇区！*/
    /* 这个比 SD 卡复杂，因为 Flash 有"只能 1→0"的特性 */
}
```

**Flash 写入的复杂性**是这个挑战的核心——你得实现"擦除+写入"的组合逻辑。完成后你真正理解了"为什么 Flash 比 SD 卡复杂"。

---

### 停下来互动

**反馈 1**：QSPI 相比 SPI 最大的改变是什么？你能用自己的话说清"内存映射模式"吗？

**反馈 2**：思考题 A、B、C 你怎么答的？特别是 A——理解了它就理解了"Cache 为什么对 QSPI 至关重要"。

**反馈 3**：综合题 1、2 你的方案？"QSPI 不能替代 SD 卡"这个理解对你未来选型很重要。

---

### 下一讲选择

到此为止，我们已经走过了 **FDCAN、SDMMC+FatFS、QSPI**。剩下的外设主要方向：

- **C. DMA2D + LCD**：H723 的图形加速器，为 LVGL/TouchGFX 做准备。这是做"带屏幕产品"的必修课。
- **E. 定时器高级功能**：输入捕获（测频率/脉宽）、编码器接口（读旋转编码器）、同步定时器（多个定时器联动做三相 PWM）、死区时间生成。这块是**电机控制**的核心。
- **F. ADC 高级功能**：H723 的 ADC 是 16 位 SAR，速度超过 3MSPS，支持差分输入、温度传感器、VBat 监控。比 F103 强太多。
- **G. USB**：H723 的 USB 可以做 CDC 虚拟串口、HID 键盘鼠标、Mass Storage U 盘、DFU 升级。
- **连网方向**：以太网 + LwIP（复杂度最高）

我推荐你可以选 **C（DMA2D+LCD）** 或 **E（定时器高级）**。它们走两个不同的应用方向：

- C 偏向"人机界面"产品（家电、仪器、消费电子）
- E 偏向"控制"产品（电机、机器人、工业控制）

你对哪个方向更感兴趣？或者你有其他想学的？🚀

## H723 新外设深入：第四弹 —— DMA2D 与 LCD 图形系统

好，讲图形。不过在开始之前，我想先搞清楚一件事——**图形系统是 H723 最复杂的子系统之一**，涉及硬件外设、显示接口、图形库、内存规划多层知识。我不想直接扔一堆 API 给你，那样你会晕。

让我先建立一个合适的切入点。

---

### 先搞清楚你的位置

图形系统的学习路径大致是这样的一棵树：

```
                 LCD 图形系统
                      │
     ┌────────────────┼────────────────┐
     │                │                │
  显示接口          图形算法         应用层
     │                │                │
  ┌──┼──┐          ┌──┼──┐          ┌──┼──┐
  SPI FMC LTDC  软件 DMA2D GPU    LVGL TouchGFX 自绘
                              (H723有)
```

**每一层都是独立的知识块**。你可以：

- 走底层路径：裸机画像素 → 自己写画线算法 → 最后拼一个简陋 UI
- 走应用层路径：直接用 LVGL，底层细节不管
- 走中间路径：理解 DMA2D 如何加速图形操作


### 好，你想"看看嵌入式 GUI 是怎么回事"

你这个出发点很好——不是为了做产品，是为了**理解原理**。所以我不会一上来就让你装 LVGL、配置一堆 API。我想带你从底层思考：

> **一块 LCD 屏幕到底是怎么被"点亮"的？为什么要有 DMA2D 这种东西？LVGL 这类图形库到底在底下做什么？**

理解了这些，你再用任何图形库都会游刃有余——因为你知道"下面在发生什么"。

你说你手边有"LCD 接口"的屏——我理解是 RGB 接口的大屏（LTDC 驱动），对吗？不过先别急，第一步我们**完全不碰具体硬件**，先在脑子里建立图形系统的模型。

---

### 第一个问题：屏幕是什么？

我想用一个思想实验开头。假设你面前有一块最简单的 LCD 屏，分辨率 480×272（典型嵌入式屏尺寸）。

**问题 1**：这块屏上一共有多少个可以独立控制颜色的"点"？

算一下——480 × 272 = **130,560 个点**。每个点叫一个**像素（Pixel）**。

**问题 2**：假设每个像素可以显示 65536 种颜色（RGB565 格式，16 位）。那整块屏"当前显示什么"这个信息，需要多少字节的存储？

算一下——130560 × 2 字节 = **261120 字节 ≈ 255 KB**。

这个数字很重要。我希望你停下来想一想：

> **这 255KB 存在哪里？**

它不可能存在屏幕里——LCD 屏幕本身只是一个"显示装置"，没有存储能力（便宜的屏至少是这样）。那就只能存在 **MCU 这一侧**。

这块 255KB 的内存，就叫 **帧缓冲区（Framebuffer）**——**屏幕上每一个像素的颜色，都有一个字节（或两个字节）对应存放在这块内存里**。

```
帧缓冲区（在 MCU 的 RAM 里）           LCD 屏幕
──────────────────────────────         ─────────────
                                        480 × 272 像素
 uint16_t fb[272][480];                 每个像素显示一种颜色
 
 fb[0][0]   fb[0][1]   fb[0][2]  ...    (0,0)  (1,0)  (2,0)  ...
 fb[1][0]   fb[1][1]   fb[1][2]  ...    (0,1)  (1,1)  (2,1)  ...
   ...                                     ...
 fb[271][479]                           (479, 271)
 
         ↑                                     ↑
         └─────────  传输  ──────────────────┘
```

**你改一下 `fb[y][x]` 的值，屏幕上那个像素就变色**。就这么简单。

**问题 3**：现在关键问题——**帧缓冲区的内容怎么"跑到"屏幕上？**

这是最根本的问题。你来猜猜——你觉得数据是怎么从 MCU 的 RAM 传到 LCD 屏幕上的？

（提示：想想你见过的"数据搬运"机制——UART、SPI、I2C、DMA... 哪个能胜任？）

---

### 两种主流方案

LCD 和 MCU 之间的"数据传输方式"，主要分两大阵营：

#### 方案 A：屏自带控制器（带显存屏）

屏幕模组里集成了一个小芯片（叫 **显示驱动 IC**，比如 ST7789、ILI9341、SSD1351 等），这个芯片**自己带显存**。

```
MCU                       屏模组
───────────               ────────────────
SPI ───────→  控制器芯片 ──→  LCD 面板
              (自带 GRAM)
```

你通过 SPI/并行接口**发命令**给控制器："在 (10,20) 位置写颜色 0xF800"。控制器收到后自己去刷屏。

**特点**：

- **屏的每个像素更新后能自己保持**（有显存）
- MCU 不用持续发送画面，只发"改变的部分"
- 接口简单（SPI 几根线），但速度受限（SPI 顶天 50MHz）
- **适合小屏**（2 寸以内），大屏刷新太慢

#### 方案 B：RGB 接口屏（无显存屏）

屏幕只是一块"哑屏"——它没有存储能力。你必须**持续不断地**通过专用接口"扫描"整块屏。

```
MCU                       屏模组（纯面板）
─────────                 ──────────────
LTDC ─────→  RGB 并行信号 ──→  液晶像素
(60Hz 持续刷新)
```

MCU 里的 **LTDC（LCD-TFT Display Controller）** 外设每秒产生 60 次（或 30 次）完整画面，通过 16~24 根数据线 + 同步信号（HSYNC、VSYNC、PCLK、DE）**持续扫描**输出。

**特点**：

- 屏没有显存，MCU 必须持续供画（一秒 60 次）
- 接口线多（RGB565 需要 16 根数据线 + 4 根同步线）
- 速度快（能刷 1024×600 大屏）
- **MCU 必须有 LTDC 外设**（F103 没有，H723 有）

---

### 停下来让你思考

**问题 4**：你觉得这两种方案分别适合什么场景？为什么 H723 会专门有 **LTDC 外设**？F103 却没有？

...

**我的答案**：

- **方案 A（SPI 小屏）**：智能手表、小型仪器、仅显示数字/文字的设备——**屏小、更新不频繁**
- **方案 B（LTDC 大屏）**：家电面板、工业仪表、汽车仪表盘——**屏大、动画丰富、响应要求高**

**为什么 F103 不需要 LTDC**？因为 F103 只有 20KB RAM——**连 240×320 的帧缓冲都装不下**（240×320×2 = 150KB）。它只能驱动 SPI 小屏，而且必须通过命令方式操作对方的 GRAM，自己不维护帧缓冲。

**H723 有 564KB RAM**——才装得下 480×272 的帧缓冲（+ 留足余量给双缓冲、图形处理）。于是才需要 LTDC 这种"大屏外设"。

**结论**：**RAM 容量决定图形能力上限**。这是一个关键洞察。

---

### 第二部分：画一个像素，背后发生什么？

你说你手边有 LTDC 接口的屏。那我们就以 LTDC 方案为例。

假设你完成了 LTDC 的配置（CubeMX 会帮你做），屏幕此刻正在以 60Hz 频率不断扫描你的帧缓冲区。

你现在想做一件事——**把 (100, 50) 这个点变成红色**。

在你的代码里，就这一行：

c

```c
uint16_t *fb = (uint16_t*)0x24000000;   // 帧缓冲区在 AXI SRAM 里
fb[50 * 480 + 100] = 0xF800;            // RGB565 红色
```

**就这一行**。LTDC 硬件会在下一个扫描周期（1/60 秒内）把这个改变反映到屏幕上。你什么都不用做——**一次赋值，屏幕自动变**。

这就是 LTDC 的魔力：**它把"显示"这件事变成了"内存操作"**。整个 GUI 的底层哲学就是——

> **所有的"画图"都只是"修改帧缓冲区的内存"。你怎么画三角形？你改对应像素的颜色。你怎么画文字？你按字模改对应像素的颜色。LTDC 硬件自动把结果扫描到屏上。**

#### 停下来思考

**问题 5**：既然"修改内存 = 修改像素"，那画一条从 (0,0) 到 (100,100) 的直线，你会怎么做？写个伪代码。

...

你可能会写：

c

```c
for (int i = 0; i <= 100; i++) {
    fb[i * 480 + i] = 0xFFFF;   // 白色
}
```

对，就是这么直接。画线、画圆、画矩形，底层都是"**在帧缓冲区里按数学公式改像素**"。图形学算法（Bresenham 直线算法、中点圆算法等）讲的就是"怎么高效地决定改哪些像素"。

**GUI 看起来高大上，本质就是"改内存"**。

---

### 第三部分：DMA2D——为什么需要"图形加速"

现在来看为什么需要 DMA2D。

#### 场景：填充一个矩形

想象你要画一个 300×200 的矩形，全部填成蓝色。用 CPU 怎么做？

c

```c
for (int y = 0; y < 200; y++) {
    for (int x = 0; x < 300; x++) {
        fb[y * 480 + x] = 0x001F;   // 蓝色
    }
}
```

这要执行 **60000 次** 内存写入。CPU 一条赋值指令 + 地址计算，大约 5 个周期。60000 × 5 / 550,000,000 = **0.54 毫秒**。

看起来还行？现在想一下——如果你用 LVGL，每次刷新可能涉及 20 个这样的矩形填充、5 张图片拷贝、100 个文字绘制。**CPU 被图形操作占满了**。你的其他任务（通信、传感器、控制）怎么办？

更糟的是——图形操作**从 AXI SRAM 读数据、写 AXI SRAM**。CPU 做这事时占用总线，如果此时 DMA 也想用总线，就要抢。

#### DMA2D 的思想

**DMA2D = 二维 DMA（2D Memory Access）**。它是一个**专门处理图形数据搬运的 DMA**。

**普通 DMA**：一维数据搬运（从地址 A 到地址 B，连续 N 字节） **DMA2D**：**二维矩形**数据搬运（从矩形区域 A 到矩形区域 B）

它能做几件 CPU 做起来费力的事：

**① 矩形填充**（Register to Memory）

告诉 DMA2D："把这个区域 300×200 都填成 0x001F。" 它自己去写 60000 个像素，**CPU 完全不用管**。

**② 矩形拷贝**（Memory to Memory）

"把帧缓冲 A 的 (100,50)~(250,150) 这块，拷贝到帧缓冲 B 的 (0,0) 位置。" 这是"图层贴图"的核心。

**③ 颜色格式转换**（Memory to Memory with PFC）

"源是 RGB888 格式，目标是 RGB565。拷贝时自动转换。" 比如你的 PNG 图片是 32 位 RGBA，屏幕是 16 位 RGB565——DMA2D 一条命令搞定。

**④ α 混合**（Memory to Memory with Blending）

"把图层 A（半透明）叠加到图层 B 上。" 这是 GUI 里所有半透明效果的核心。

#### 为什么 DMA2D 比 CPU 快？

有几个关键原因：

**原因 1**：DMA2D 有专用硬件流水线，每个时钟周期处理一个像素，CPU 需要多个周期 **原因 2**：DMA2D 直接访问 AXI 总线，不经过 CPU，不占用指令执行周期 **原因 3**：颜色转换、α 混合这些操作，DMA2D 有**硬件电路**，CPU 要软件计算（每像素几十个周期） **原因 4**：**CPU 可以同时做别的事**——把图形搬运交给 DMA2D 后，CPU 可以继续处理按键、通信、动画逻辑

**典型加速倍数**：

|操作|CPU|DMA2D|加速|
|---|---|---|---|
|矩形填充 300×200|~0.5ms|~0.1ms|5x|
|RGB888 → RGB565 转换 100×100|~2ms|~0.05ms|40x|
|α 混合 2 张图 200×200|~10ms|~0.2ms|50x|

**对 GUI 流畅度的影响**：60fps 需要每帧 16.7ms 内完成所有绘制。用 CPU 可能一帧要 30ms（卡成 33fps），用 DMA2D 可能 5ms（流畅 60fps）。

---

### 停下来让你体会

**问题 6**：H723 有 DMA2D 这个"图形加速器"，F103 没有。你觉得这决定了它们能跑什么样的 GUI？

...

**简单说**：F103 能跑"**静态界面**"——打开就是那个样子，偶尔更新几个数字。H723 能跑"**动态界面**"——滑动列表、淡入淡出、流畅动画、半透明浮窗。

**这就是 DMA2D 的价值**——它不是"让 GUI 能跑"，而是"让 GUI **流畅**"。

---

### 第四部分：整个图形系统怎么协作

现在让我把所有东西串起来，给你一个**全景图**。

```
┌─────────────────────────────────────────────┐
│  你的应用代码                                │
│  lv_btn_create(), lv_label_set_text(), ...  │  ← LVGL API
└─────────────────────┬───────────────────────┘
                      │
┌─────────────────────▼───────────────────────┐
│  LVGL 图形库（软件）                         │
│  - 维护 UI 对象树（按钮、标签、列表等）      │
│  - 响应事件（触摸、按键）                    │
│  - 决定"哪些像素需要重绘"                    │
└─────────────────────┬───────────────────────┘
                      │
                      ▼ 它最终只做一件事：
         ┌────────────────────────┐
         │ 把像素画到 Framebuffer │
         └────────┬───────────────┘
                  │
           ┌──────┴──────┐
           ▼             ▼
       软件绘制      DMA2D 加速
       (CPU 画)      (硬件画)
           │             │
           └──────┬──────┘
                  ▼
        ┌────────────────┐
        │  Framebuffer   │   ← AXI SRAM 或 SDRAM 里的一大块内存
        │  (130KB~1MB)   │
        └────────┬───────┘
                 │
                 ▼ LTDC 硬件自动扫描
        ┌────────────────┐
        │     LTDC       │   ← 每秒 60 次扫描 Framebuffer
        └────────┬───────┘
                 │ RGB 信号（24根线）
                 ▼
        ┌────────────────┐
        │   LCD 屏幕     │
        └────────────────┘
```

**关键概念**：**整个系统是"分层驱动"的**：

- **LVGL**：高级 API 层（用对象化概念描述界面）
- **Framebuffer**：核心抽象（一块代表屏幕的内存）
- **DMA2D**：加速器（快速修改 Framebuffer）
- **LTDC**：显示控制器（把 Framebuffer 变成屏幕信号）
- **LCD**：物理屏幕

**LVGL 不知道 LTDC 存在，LTDC 不知道 LVGL 存在**——它们通过 Framebuffer 这个共同的"协议"连接。

这是嵌入式系统里最漂亮的分层设计之一。**Framebuffer 是图形世界的"以太"**。

---

### 停下来验证理解

**问题 7**：基于这个分层，回答几个问题：

1. 如果我把 LTDC 换成一个 SPI 屏（走方案 A），**LVGL 代码要改吗**？
2. 如果我把 LVGL 换成 TouchGFX（另一个图形库），**LTDC 配置要改吗**？
3. 如果我完全不用 DMA2D，LVGL 能跑吗？会怎样？

...

**答案**：

1. LVGL 代码**不用改**。只需要改底层的"flush 函数"（告诉 LVGL"请把这块像素显示出去"）。SPI 屏的 flush 通过 SPI 命令发送，LTDC 屏的 flush 其实只是"切换 Framebuffer 指针"。
2. LTDC 配置**完全不变**。它只看 Framebuffer。
3. LVGL 能跑，**但慢**——所有图形操作由 CPU 完成。小界面没问题，复杂动画会明显卡。

**这就是"好架构的威力"**——每一层都能独立替换，不影响其他层。

---

### 双缓冲：为什么图形系统常常需要两块 Framebuffer

再给你一个重要概念。

想象现在屏幕正在显示一个界面。你的代码开始画下一帧——

c

```c
// 开始画新帧
fb[100] = red;       // 这时屏幕扫描到这里，显示出"错乱"的帧
fb[101] = red;
// ... 画了一半 ...
fb[50000] = blue;
// ... 继续画 ...
```

**问题**：LTDC 是**持续扫描**的——它不管你画没画完，该扫到的像素就扫出去。所以用户看到的画面是"**半新半旧**"，这叫**撕裂（Tearing）**或**闪烁（Flicker）**。

**解决方案：双缓冲（Double Buffering）**

用两块 Framebuffer：

- **前缓冲（Front Buffer）**：当前 LTDC 正在扫描的那块
- **后缓冲（Back Buffer）**：你正在画的那块

```
时间 T1：
 LTDC 扫描 → FB1 (完整的上一帧)
 你的代码写 → FB2 (正在画新帧)

时间 T2（你画完了）：
 切换指针：LTDC 现在扫 FB2
 你的代码接下来写 → FB1 (画下下帧)
```

**切换必须在"帧同步"时机**（LTDC 每帧扫描结束的瞬间），这样用户永远看到的是"完整的一帧"。LTDC 有个中断 `HAL_LTDC_LineEventCallback` 就是为这个设计的。

**代价**：内存占用翻倍。480×272 单 Framebuffer 255KB，双缓冲 510KB。H723 的 564KB RAM 只能勉强装下。

**思考题**：为什么你那块 H723VGT6 可能不够用双缓冲？如果屏幕更大（比如 800×480），该怎么办？

（提示：H723 的 AXI SRAM 只有 320KB；AXI SRAM 外还有些小块 SRAM；如果还不够——外挂 **SDRAM**，H723 有 FMC 外设可以接 32MB SDRAM）

---

### 第五部分：像素格式——你必须懂的底层

之前我一直说"像素"但没细讲格式。嵌入式常用的几种：

|格式|位数|每像素字节|说明|
|---|---|---|---|
|**RGB565**|16|2|R:5 G:6 B:5。最常用，省内存，色彩够|
|**RGB888**|24|3|R:8 G:8 B:8。完整色彩，不对齐|
|**ARGB8888**|32|4|加了 8 位 α 通道（透明度），最完整|
|**L8**|8|1|灰度图，或索引调色板|
|**A8**|8|1|只有 α 通道（用于字体的抗锯齿）|

**RGB565 是嵌入式主流**——内存省一半（对 H723 RAM 紧张很重要），色彩对 GUI 够用。

**一个 RGB565 像素的位布局**：

```
  bit 15  ............  bit 0
  ┌────────┬───────────┬────────┐
  │ R R R R R │ G G G G G G │ B B B B B │
  └──────────┴─────────────┴───────────┘
    5 位红     6 位绿         5 位蓝
```

**为什么绿色 6 位，红蓝只有 5 位**？因为人眼对绿色最敏感——多给绿色一位分辨率，视觉上更自然。

**几个常用颜色的 RGB565 值**，记一下：

c

```c
#define COLOR_BLACK   0x0000
#define COLOR_WHITE   0xFFFF
#define COLOR_RED     0xF800
#define COLOR_GREEN   0x07E0
#define COLOR_BLUE    0x001F
#define COLOR_YELLOW  0xFFE0   // 红 + 绿
#define COLOR_CYAN    0x07FF   // 绿 + 蓝
```

**手动构造 RGB565**：

c

```c
uint16_t rgb565(uint8_t r, uint8_t g, uint8_t b) {
    return ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
}
```

---

### 停下来做一个心智测试

先不看答案，我们来玩个快速测试——这些问题答得出说明你真的理解了：

**快问 1**：`uint16_t fb[480 * 272]` 和 `uint16_t fb[272][480]` 在内存布局上一样吗？

**快问 2**：像素 (x=100, y=50) 在 `fb[]` 里的下标是多少？（屏宽 480）

**快问 3**：你想"清屏为白色"，最快的方法是？

- (a) 两个 for 循环写 `fb[y*480+x] = 0xFFFF`
- (b) `memset(fb, 0xFF, 480*272*2)`
- (c) 用 DMA2D 的 Register-to-Memory 模式填充

**快问 4**：`memset(fb, 0xFF, ...)` 清屏成白色，但如果你想清成**红色（0xF800）**，能用 `memset` 吗？

**快问 5**：画一条水平线（y=100 行，x 从 0 到 479 全红），用 CPU 还是 DMA2D？为什么？

...

答案：

1. **一样**——二维数组在内存里就是线性铺开的，只是 `[y][x]` 是语法糖
2. **50 × 480 + 100 = 24100**
3. (c) 最快，(b) 次之，(a) 最慢
4. **不能**——memset 是按字节填充，`0xFF` 的字节填下来得到 `0xFFFF`（白色）。红色 `0xF800` 是两字节 `0xF8, 0x00` 交替，memset 做不到。这就是为什么需要 **DMA2D 的矩形填充**——它能按"像素"而不是"字节"填充。
5. **用 DMA2D**。虽然 480 个像素 CPU 也快，但这行涉及到"按 Framebuffer 行宽跨步"等概念，DMA2D 本来就是为这个而生。

**如果你答对 4 题以上，你已经有"图形系统思维"了**。

---

### 本课任务

因为你只是想"看看嵌入式 GUI 是怎么回事"，我不会让你做很多硬件实验。**重点是理解框架**。

#### 必做（全部不用硬件，纯思考）

1. **自己画出**上面那张"应用代码 → LVGL → Framebuffer → LTDC → LCD"分层图。**不看我的**，用你自己的话标注每一层的职责。
2. **回答**：一个 800×480 的屏，用 RGB565 格式，双缓冲需要多少内存？H723 的 564KB 够吗？如果不够怎么办？
3. **算一下**：假设 LTDC 扫描频率 60Hz，每像素 2 字节，分辨率 480×272。LTDC 每秒要从内存读出多少字节？总线带宽够吗？（AXI 总线 275MHz × 32bit = 1.1GB/s）

#### 进阶（需要硬件，如果你想动手）

**进阶 1**：**"手动画屏"（不用任何图形库）**。把 LTDC 配起来，手动 `memset` 整块帧缓冲清屏，然后用 for 循环画几条线、一个矩形、一段文字（需要字模数据）。这会让你**真正理解"GUI 就是改内存"**。

**进阶 2**：**对比 CPU vs DMA2D**。同样是填充一个 200×200 的矩形，分别用 CPU（两层 for 循环）和 DMA2D（一行 API），用 DWT 周期计数器测耗时。你会看到 5~10 倍的差距。

**进阶 3**：**跑通 LVGL 的 Hello World**。STM32CubeIDE 有 TouchGFX Designer 的集成，或者可以直接用 LVGL v9。显示一个按钮 + 文字，点击改变颜色。**这是商业产品的起点**。

#### 挑战（如果你想更深）

**挑战**：写一个"极简的自制图形库"——包含 `draw_pixel`、`draw_line`、`draw_rect`、`fill_rect`、`draw_char`（字模）几个函数，不依赖 LVGL。用它画一个简陋的数据监控界面（数值 + 进度条）。

完成这个你就理解了"图形库的本质"——所有高级图形库（LVGL、TouchGFX、Qt）都是在这几个基础函数上叠加的抽象。

---

### 关键回顾

你应该带走的核心概念（不需要记 API，记这些）：

1. **屏幕 = 二维像素阵列**。像素有颜色格式（RGB565 等）。
2. **Framebuffer = 屏幕在内存里的映射**。改 Framebuffer = 改屏幕。
3. **LTDC = 硬件自动扫描 Framebuffer 到屏**。你只管改 Framebuffer，扫描是自动的。
4. **DMA2D = 图形专用 DMA**。矩形填充、拷贝、颜色转换、α 混合，硬件加速。
5. **图形库（LVGL）= 上层抽象**。所有"按钮"、"列表"最终都是改 Framebuffer。
6. **双缓冲解决撕裂**。内存翻倍，但画面完整。

**理解这六点，你就理解了嵌入式 GUI 的全部本质**。剩下的 API、配置、细节——用到再查就好。

---

### 一个延伸的反思

从 QSPI（外部代码/数据存储）→ LCD 图形系统，你能看到 H723 相比 F103 的**根本差异**了吗？

F103 时代：MCU 是"**单一控制器**"——读传感器、算算法、开关 IO H723 时代：MCU 是"**微型计算机**"——带显示、带存储、带通信、带加速器

H723 这种级别的芯片，**跑 LVGL 的界面 + SD 卡数据记录 + CAN 通信 + FreeRTOS** 是商业家电/工业仪器的主流配置。你现在的知识面已经覆盖了这整个栈。

---

### 下一步

本课后你可以选：

- **E. 定时器高级功能**（输入捕获、编码器、同步）——电机控制方向
- **F. ADC 高级功能**（16 位、差分、超高速采样）——信号处理方向
- **G. USB**（CDC、HID、MSC）——和电脑的丰富交互
- **继续 LCD**：如果你想更深入图形（LVGL 项目、字体系统、触摸），也可以继续

或者换个方向：

- 回到**综合项目**——H723 做主控 + 小 LCD 显示数据 + CAN 收 F103 的传感器数据，一个完整产品雏形

你最想学哪个？或者告诉我你觉得最有趣的方向？🚀
## 第十五课：定时器深入——四个维度的高级玩法

好，你要全部讲，我就按"**由浅到深、由测量到控制**"的顺序讲。这一课会很长，但信息密度高——**这是 STM32 定时器真正的"完整图景"**。

---

### 先建立一个心智模型

在讲任何具体功能之前，我想让你先看这张图：

```
             一个"计数器"
            ┌─────────┐
            │  CNT    │ ← 核心：一个 16/32 位寄存器，自动 +1
            └────┬────┘
                 │
     ┌───────────┼───────────┐
     │           │           │
   "它数到了"  "它在数"   "它被谁驱动"
     ↓           ↓           ↓
   输出事件     状态同步    输入时钟
   (PWM输出)   (触发其他)  (内部/外部/级联)
     ↓           ↓           ↓
   ┌───────────────────────────┐
   │   再叠加四个方向的玩法     │
   │                           │
   │   1. 测量外部信号          │ ← 输入捕获
   │   2. 读旋转                │ ← 编码器接口
   │   3. 控制电机              │ ← 高级定时器+死区
   │   4. 多个定时器联动        │ ← 主从模式
   └───────────────────────────┘
```

定时器的所有高级功能，本质上都是在"**计数器**"这个核心基础上加各种"**输入机制**"和"**输出机制**"。

你第六课学过：

- **基本定时器**：只有计数器+溢出中断（定时、周期任务）
- **通用定时器**：加了**输出比较**（产生 PWM）

今天要加：

- **输入捕获**：反过来——让外部信号触发"记下当前 CNT 值"
- **编码器模式**：特殊的输入——两个信号共同决定计数方向
- **高级定时器**：带死区、刹车、互补输出（专为电机控制）
- **主从模式**：让一个定时器控制另一个的启动/计数

---

### 第一部分：输入捕获（Input Capture）

#### 想一个问题

假设我给你一个方波信号（比如 1kHz 的脉冲，从某个传感器来），你要用 MCU 测它的**精确频率**。你会怎么做？

用你已学的知识，你可能想：

**方案 A**：GPIO + EXTI 中断 + HAL_GetTick

c

```c
void HAL_GPIO_EXTI_Callback(uint16_t pin) {
    uint32_t now = HAL_GetTick();
    uint32_t period = now - last_tick;
    frequency = 1000 / period;  // Hz
    last_tick = now;
}
```

**这能工作**，但问题是——HAL_GetTick 精度是 **1ms**。你要测 1kHz（周期 1ms）的信号，误差和周期一样大，根本测不准。

更糟的是——中断响应有延迟（进中断、保存寄存器、执行回调），每次延迟几微秒不等，所以测到的"周期"是抖动的。

#### 输入捕获的思想

**输入捕获**彻底绕开了 CPU 介入的过程。它的工作方式是：

> **硬件监视某个引脚。当引脚发生指定的边沿变化时，硬件瞬间把当前 CNT 的值"拍照"存到一个专用寄存器（CCR）里。CPU 之后读 CCR 就知道"那一刻计数器是多少"。**

这个"拍照"的响应时间是 **0 个 CPU 周期**——纯硬件。延迟只受定时器时钟周期限制。

#### 测频率的典型设置

假设你想测一个 1kHz~100kHz 的信号：

1. 配置定时器 TIM2，时钟源 72MHz
2. **不分频**（PSC=0，CNT 每 1/72MHz ≈ 13.9ns 加一次）
3. **ARR 设最大值**（16 位定时器就是 65535）
4. 选一个通道（比如 CH1，对应 PA0 引脚）为"输入捕获"模式
5. 配置"上升沿触发捕获"
6. 开启捕获中断

工作流程：

```
PA0 信号：  ──┐    ┌──┐    ┌──┐    ┌──
              │    │  │    │  │    │
              └────┘  └────┘  └────┘
              ↑       ↑       ↑
              捕获 T1  捕获 T2  捕获 T3
              CCR=100  CCR=1500 CCR=2900
                       T2-T1=1400 T3-T2=1400  ← 恒定
              
信号周期 = 1400 × 13.9ns = 19.4μs  →  频率 ≈ 51.5kHz
```

#### 代码示例

c

```c
uint32_t cap_val[2];    // 保存连续两次捕获值
uint8_t  cap_idx = 0;
float    frequency = 0;

void HAL_TIM_IC_CaptureCallback(TIM_HandleTypeDef *htim)
{
    if (htim->Instance == TIM2 && htim->Channel == HAL_TIM_ACTIVE_CHANNEL_1) {
        cap_val[cap_idx] = HAL_TIM_ReadCapturedValue(htim, TIM_CHANNEL_1);
        
        if (cap_idx == 1) {
            uint32_t diff;
            if (cap_val[1] >= cap_val[0]) {
                diff = cap_val[1] - cap_val[0];
            } else {
                diff = (0xFFFF - cap_val[0]) + cap_val[1] + 1;  // 处理溢出
            }
            
            float period_s = diff / 72000000.0f;
            frequency = 1.0f / period_s;
            cap_idx = 0;
        } else {
            cap_idx = 1;
        }
    }
}

int main(void)
{
    HAL_TIM_IC_Start_IT(&htim2, TIM_CHANNEL_1);
    while (1) {
        printf("Frequency: %.2f Hz\r\n", frequency);
        HAL_Delay(500);
    }
}
```

#### 测 PWM 占空比

更进阶的玩法——**同时测量周期和高电平宽度**（从而得出占空比）：

**关键技巧**：**一个输入信号可以同时触发两个通道的捕获**——一个捕获上升沿，一个捕获下降沿。

```
PA0: ──┐              ┌──┐              ┌──
       │              │  │              │
       └──────────────┘  └──────────────┘
       ↑              ↑  ↑              ↑
       CH2下降  CH1上升  CH2下降   CH1上升
       
       CH1.CCR: 记录所有上升沿的时间 → 测周期
       CH2.CCR: 记录所有下降沿的时间 → 测高电平宽度
       
       占空比 = (CH2下降 - CH1上升) / (下次CH1上升 - 这次CH1上升)
```

CubeMX 里这叫 "**PWM Input Mode**"——勾选后会自动配好两个通道。

#### 停下来思考

**思考题 1**：如果你要测的信号非常慢（比如 1Hz），72MHz 的时钟 + 16 位 CNT 会溢出多少次？（16 位最大 65535）

...

答：1Hz 周期是 1 秒，72M × 1 = 72,000,000 个 tick，65535 装不下，会溢出 1098 次。

**解决方案**：

- 加 PSC 预分频（如 PSC=7199 → 10kHz 计数频率）
- 或者使用 32 位定时器（TIM2、TIM5 是 32 位）
- 或者在溢出中断里计数溢出次数，手动累加

**思考题 2**：输入捕获 vs EXTI + HAL_GetTick，精度差多少倍？

...

答：

- EXTI + HAL_GetTick：精度 1ms，响应延迟 ~几微秒（抖动）
- 输入捕获：精度 1/定时器时钟 ≈ 13.9ns（定时器时钟 72MHz 时），**零抖动**

**精度差距约 10⁵ 倍**。这就是硬件外设的威力。

---

### 第二部分：编码器接口模式

这是定时器一个**极其精妙**的特殊模式——专门为旋转编码器设计。

#### 什么是旋转编码器

**EC11 编码器**（你问题里提到的那种）长什么样？它是一个带旋钮的元件，有两个信号输出（A、B），旋转时输出**两个 90° 相位差的方波**：

```
顺时针旋转：
A: ────┐    ┌────┐    ┌────
       └────┘    └────┘

B:   ────┐    ┌────┐    ┌──   ← 比 A 慢 90°
         └────┘    └────┘

逆时针旋转：
A: ────┐    ┌────┐    ┌────
       └────┘    └────┘

B: ──┐    ┌────┐    ┌────     ← 比 A 快 90°
     └────┘    └────┘
```

**关键观察**：A 和 B 信号的**相位关系**决定了旋转方向：

- A 上升沿时，B 如果是 **低** → 顺时针
- A 上升沿时，B 如果是 **高** → 逆时针

#### 用 CPU 软件解码的痛苦

假设你用 EXTI + 程序判断：

c

```c
void HAL_GPIO_EXTI_Callback(uint16_t pin) {
    if (pin == A_Pin) {
        uint8_t B = HAL_GPIO_ReadPin(B_GPIO_Port, B_Pin);
        if (B == 0) counter++;  // 顺时针
        else        counter--;  // 逆时针
    }
}
```

**问题**：

1. 用户转得快时（每秒几百次），中断风暴让 CPU 喘不过气
2. 抖动（机械触点）让计数错乱——EC11 转一格可能触发 3~5 次中断
3. 只用了 A 的边沿，没利用 B，**分辨率损失**

#### 编码器接口模式的魔法

STM32 定时器有一个**硬件编码器接口**模式。配置后：

- 两个输入（A、B）分别接定时器的 CH1、CH2
- **硬件自动解码 AB 信号**
- 顺时针转：CNT 自动 +1；逆时针转：CNT 自动 -1
- 你只需要读 `TIM->CNT` 就知道当前位置
- **CPU 完全不介入**——不需要中断、不需要任何软件

c

```c
// 初始化
HAL_TIM_Encoder_Start(&htim3, TIM_CHANNEL_ALL);

// 主循环直接读 CNT
while (1) {
    int16_t position = (int16_t)TIM3->CNT;   // 有符号，可以显示"负值"
    printf("Position: %d\r\n", position);
    HAL_Delay(100);
}
```

**就这么简单**。编码器接口模式是"硬件完全解放 CPU"的最佳范例。

#### 四倍频采样（X4 模式）

更精妙的——编码器模式可以配置成 **X4（四倍频）** 模式，同时捕获 A 和 B 的**上升沿 + 下降沿**（一个周期 4 个边沿），分辨率 ×4。

```
                       X4 模式，每个边沿都计数
A: ────┐    ┌────┐    ┌────
       ↓    ↑    ↓    ↑     ← 每个沿计1
B:   ────┐    ┌────┐    ┌──
         ↓    ↑    ↓    ↑   ← 每个沿计1
```

一个编码器的旋转"格数"（通常 20~24 格/圈），在 X4 模式下变成 80~96 脉冲/圈——分辨率大幅提升。

CubeMX 里选 "Encoder Mode → TI1 and TI2"（双通道模式）就是 X4。

#### 停下来思考

**思考题 3**：如果你同时有 2 个编码器（比如左右两个旋钮），你需要两个定时器还是一个？

...

答：**两个**。因为一个定时器的 CNT 只有一个，只能跟踪一个旋转源。通常用 TIM3、TIM4 这两个通用定时器分别处理。

**思考题 4**：机械编码器的触点抖动问题，编码器接口模式能解决吗？还需要软件消抖吗？

...

答：**部分能**。定时器有**数字滤波器**设置（Input Filter），选一个适当的值（如 `TIM_ICFILTER_FDIV32_N8`，意思是"用 72MHz/32 采样，连续 8 次一致才算数"），能消除大部分抖动。不够可以再加软件消抖——在主循环里读 CNT，和上次比较，一次只接受 ±4（一格的增量）。

---

### 第三部分：高级定时器与电机控制

F103 有两个"高级定时器"——**TIM1** 和 **TIM8**。H723 更多。它们除了通用定时器的所有功能，还额外支持：

- **互补输出**（Complementary Output）：CH1 和 CH1N 输出相反电平
- **死区时间**（Dead Time）：两个互补信号切换时，插入一小段"都是低电平"的间隙
- **刹车输入**（Break Input）：紧急情况下硬件立刻关断所有输出
- **三相对称 PWM**：3 对互补输出，天然适合三相电机

为什么需要这些？全都是**为了控制电机**。

#### 简单的直流电机控制

先说简单的——**有刷直流电机**的控制：

电机两端接 H 桥驱动电路（比如 L298、DRV8833），H 桥有四个开关（两上两下）：

```
    +V
     │
   ┌─┴─┐
   │ S1│    S3
   └─┬─┘    │
     │      ┌─┴─┐
     ├──🔹── │  │
     │ 电机 │ S4│
     │      └─┬─┘
   ┌─┴─┐      │
   │ S2│      │
   └─┬─┘      │
     │        │
    GND      GND
```

- 电机正转：S1 + S4 开，S2 + S3 关
- 电机反转：S2 + S3 开，S1 + S4 关
- 电机刹车：S2 + S4 全开（两端都接地）
- 调速：S1 or S4 用 PWM 调占空比

#### 为什么需要"死区"

想象正转切换到反转——S1、S4 原本开着，要关掉；S2、S3 原本关着，要开起来。

**如果瞬间切换**，会发生什么？开关的物理延迟不一样，可能有一瞬间 **S1 和 S2 同时开着**（这叫"直通"），从 +V 直接通过 S1、S2 连到 GND，**短路大电流，炸管子**。

解决方案：**先关所有开关，等一小段"死区时间"，再开对方**。这个死区通常 100ns ~ 几 μs，保证慢的开关彻底关断后才开对方。

高级定时器的**硬件死区生成器**就是为了自动做这件事——你设置死区时间（DTG 寄存器），TIM1 自动在互补 PWM 切换时插入死区。无需软件介入。

#### 互补 PWM 的本质

```
CH1 (正常输出):    ──┐   ┌──┐   ┌──
                     │   │  │   │
                     └───┘  └───┘

CH1N (互补输出):   ──┐      ┌───┐
                     │      │   │  ← 和 CH1 相反
                     └──────┘   └──

有死区的互补：
CH1:               ──┐   ┌──┐   ┌──
                     │   │  │   │
                     └───┘  └───┘
CH1N:              ────┐      ┌───  ← 切换时都低电平一小段
                       │      │
                       └──────┘
                      ↑        ↑
                   死区时间   死区时间
```

这种 CH1 + CH1N + 死区的组合，**刚好是 H 桥半边的驱动信号**。CH1 驱动 S1，CH1N 驱动 S2——两者互补保证不冲突，死区保证不直通。

完整的 H 桥电机控制用到 CH1/CH1N + CH2/CH2N 两对。

#### 三相无刷电机（BLDC）与 FOC

**无刷直流电机**（BLDC，比如你的无人机电机）需要**三相交流信号**驱动，通常用 SVPWM 或 FOC 算法。

三相需要 **3 对互补 PWM + 死区**——TIM1 恰好有 CH1/CH1N + CH2/CH2N + CH3/CH3N，正好 3 对。这是 TIM1 被称为"高级定时器"的核心原因：**它天生为三相电机而生**。

FOC（Field-Oriented Control，磁场定向控制）是无刷电机的先进控制算法，需要：

- 3 对互补 PWM（TIM1）
- 编码器反馈（TIM2 或 TIM3）
- 电流采样 ADC（触发同步到 PWM 上升沿）
- 高速计算（FPU）

这是一个复杂话题，但**所有硬件基础 STM32 都有**。实际项目里用 ST 官方的 MotorControl Workbench 生成 FOC 代码，调调参数就能跑。

#### 代码配置（互补 PWM + 死区）

CubeMX 配置要点：

```
TIM1
├── Mode: PWM Generation
│   ├── Channel 1: PWM Generation CH1 CH1N
│   ├── Channel 2: PWM Generation CH2 CH2N
│   └── Channel 3: PWM Generation CH3 CH3N
├── Parameter Settings:
│   ├── Prescaler: 0
│   ├── Counter Mode: Center Aligned 1  ← 中心对齐，三相推荐
│   ├── Period: 7199 (72MHz / 7200 / 2 = 5kHz PWM)
│   └── ...
├── Break And Dead Time:
│   ├── Dead Time: 50 (约 700ns)
│   ├── Break Input: Enable (可选，紧急停机)
│   └── Automatic Output: Enable
```

使用：

c

```c
HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_1);
HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_1);   // ← 互补输出单独启动！
HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_2);
HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_2);
HAL_TIM_PWM_Start(&htim1, TIM_CHANNEL_3);
HAL_TIMEx_PWMN_Start(&htim1, TIM_CHANNEL_3);
```

#### 停下来思考

**思考题 5**：为什么高级定时器特别适合中心对齐模式（Center Aligned）而不是边沿对齐？

...

答：中心对齐模式下，**多个通道的 PWM 在波形的"中心"对齐**，而不是"起始"。这对三相电机很重要——三相同步切换时的电流噪声更小、谐波更少、电机效率更高。同时，中心对齐刚好给了"每个 PWM 周期中点"一个稳定的时机，适合触发 ADC 采样电机电流。

**思考题 6**：H 桥短路保护除了死区时间，还能用什么硬件机制？

...

答：**刹车输入（Break Input）**。你可以把一个故障信号（比如电流过流保护芯片的输出）接到定时器的 BRK 引脚。一旦信号触发，**硬件瞬间把所有 PWM 输出关闭**（或进入特定的安全状态），完全不需要软件介入。从触发到关闭的延迟是**纳秒级**的——足以救命。

---

### 第四部分：定时器级联与同步

最后讲一个容易被忽视但在高级应用里极其重要的特性——**多个定时器之间可以联动**。

#### 为什么需要联动

假设你要做一个：

- **TIM1** 生成 20kHz PWM 控制电机
- **TIM8** 每个 PWM 周期中点触发 ADC 采样电机电流
- **TIM2** 用编码器模式读取转速
- **TIM3** 每 1ms 触发一次控制循环（读 ADC、读编码器、算 PID、更新 PWM）

这些定时器之间需要**精确同步**：

- TIM8 的触发时机必须恰好是 TIM1 的 PWM 中点
- 控制循环周期（TIM3）必须是 PWM 周期的整数倍

如果用软件同步，误差和抖动都无法接受。定时器的**主从模式**就是为此存在。

#### 主从模式

每个定时器都能成为"主"（Master）或"从"（Slave）：

- **主模式**：定时器内部的某个事件（更新、比较匹配等）输出到 **TRGO**（Trigger Output）线
- **从模式**：定时器监视 **TRGI**（Trigger Input）线，收到触发后执行指定动作

STM32 内部有一个"**触发矩阵**"——TIM1 的 TRGO 可以连到 TIM2/3/4/5/8 的 TRGI，不需要布线。

#### 触发关系的几种常见用法

**用法 1：级联定时器（拓展计数宽度）**

两个 16 位定时器级联成 32 位：

- TIM2（主）：正常计数，溢出时向 TRGO 输出脉冲
- TIM3（从）：TRGI = TIM2 的 TRGO，计数模式 = "外部时钟模式"，每个 TRGI 脉冲让 TIM3 +1

效果：TIM2 每溢出一次，TIM3 +1。**两者合起来就是 32 位计数器**，能表达超长时间。

**用法 2：同步启动**

你有 3 个定时器，想让它们"精确同时启动"：

- TIM1 主模式，输出"启动"TRGO
- TIM2、TIM3 从模式，TRGI = TIM1 的 TRGO，Slave Mode = "Trigger Mode"（收到触发就启动）

现在你只要 `HAL_TIM_Base_Start(&htim1)`，TIM1 启动的瞬间 TIM2、TIM3 也同时启动，**零延迟、零抖动**。

**用法 3：ADC 同步采样**

我前面举的例子——PWM 中点触发 ADC：

- TIM1（主）：输出比较模式，设置一个特殊比较值为"PWM 周期中点"，这一刻 TRGO 输出脉冲
- ADC：External Trigger Source = "TIM1_TRGO"

这样 PWM 每次到中点，ADC 自动采样一次电流。**纯硬件触发，不需要 CPU**。

CubeMX 里配好主从关系后，HAL 会自动生成代码。

#### 深入一个例子：电机控制环的硬件调度

一个完整的电机控制框架可能是这样的**纯硬件调度**：

```
TIM1 (PWM, 20kHz, 中心对齐)
  ├─ CH1, CH1N  → U 相半桥
  ├─ CH2, CH2N  → V 相半桥  
  ├─ CH3, CH3N  → W 相半桥
  └─ TRGO → ADC Trigger  (每 PWM 周期中点触发一次 ADC)

ADC (三通道并行转换电机三相电流)
  └─ 转换完成中断 → FOC 算法计算新的 PWM 占空比

TIM3 (编码器接口)
  └─ 主循环直接读 CNT 得到转速和位置

TIM6 (1ms 周期, 外部控制循环)
  └─ 中断 → 读设定转速 → PID → 更新 FOC 的目标
```

**这里的关键**：PWM 生成、ADC 触发、电流采样全部是**硬件协同**完成，20kHz 控制频率下 CPU 只需要做 FOC 计算（~20μs），不需要任何定时触发逻辑。

这就是 STM32 为什么能做高性能电机控制——**不是因为 CPU 快，而是因为外设协同设计优秀**。F103 上都能跑得挺好，H723 更是轻松。

---

### 停下来：本课的心智收获

定时器的四大高级玩法：

**1. 输入捕获**：硬件自动"拍照" CNT，测量信号周期、脉宽、频率

- 精度：定时器时钟周期级（纳秒级）
- CPU 介入：只在捕获中断里读 CCR

**2. 编码器接口**：硬件自动解码两相 AB 信号，CNT 随旋转增减

- CPU 完全不介入，主循环读 CNT 即可
- 适合旋钮、轮式编码器、伺服反馈

**3. 高级定时器 + 互补 PWM + 死区**：电机控制专属

- 硬件互补输出，自动插入死区
- 刹车输入提供硬件故障保护
- 三相对称 PWM 天然支持 BLDC/FOC

**4. 主从同步**：多个定时器精确协同

- 级联拓宽计数位宽
- 同步启动消除延迟
- 触发 ADC 实现硬件调度

**贯穿始终的一条原则**：**STM32 定时器的设计哲学是"用硬件解放 CPU"**。所有这些功能都是在说"这件事让硬件去做，CPU 去做更重要的事"。

---

### 给你的综合思考题

**综合题 A**：你有一个任务——测量一个风扇的转速。风扇上有一个霍尔传感器，每转一圈输出一个脉冲。风扇转速范围 100~5000 RPM。你会：

- 用哪种定时器模式？
- 怎么处理高/低速的精度平衡？
- 需要几个定时器？

...

思路：

- 霍尔只输出单脉冲，**不是两相编码器**——用不了编码器接口
- 用**输入捕获**测脉冲间隔，然后算频率→转速
- 100 RPM = 1.67 Hz（600ms 一个脉冲），5000 RPM = 83 Hz（12ms 一个）
- 用 32 位定时器（TIM2 或 TIM5），PSC 取合适值让 CCR 能精确分辨低频
- 或者**双模式**：低速时用输入捕获（精度高），高速时转为"固定时间窗口计脉冲"（即使抖动也平均掉）

**综合题 B**：做一个台灯控制，用 EC11 编码器调亮度，按下编码器开关切换颜色模式。你会：

- 编码器怎么配？
- 按键怎么消抖？
- 亮度控制 PWM 怎么配？

...

思路：

- TIM3 配置为**编码器模式**（CH1=A, CH2=B），主循环读 TIM3->CNT，差值×增量控制亮度
- EC11 机械抖动——用定时器的**输入滤波器**，或者额外加"只接受 ±4 增量"的软件规则
- 按键用 EXTI 中断 + 软件时间戳消抖（回顾第二课）
- 亮度用**另一个定时器**（TIM4）的 PWM 输出，占空比 = 亮度百分比

---

### 本课任务

#### 必做（如果有硬件）

1. **测方波频率**：用一个函数发生器或者另一个 STM32 产生已知频率方波，用输入捕获测量。对比你计算的和实际的，感受精度。
2. **编码器读数**：买一个 EC11 编码器（3 块钱），接到 TIM3 的 CH1、CH2，主循环打印 CNT 变化。转动编码器，观察计数。

#### 进阶

**进阶 1**：**PWM Input 模式**。用一个通道测周期，另一个通道测高电平宽度，同时输出实际的占空比数值。测一个你已知占空比的 PWM 源（比如另一个 STM32 的 PWM 输出）。

**进阶 2**：**有刷电机闭环控制**。用 TIM1 互补 PWM + 死区驱动 H 桥，用 TIM3 编码器反馈，用 TIM6 产生 1ms 控制中断，里面跑 PID 算法。实现"输入目标转速，电机稳定跟随"。这是一个**经典的闭环控制练习**。

#### 挑战

**挑战**：**三相 PWM 生成器**。用 TIM1 的 CH1/1N、CH2/2N、CH3/3N 生成 3 相 SPWM（正弦 PWM），相位差 120°。不实际驱动电机——用示波器（或逻辑分析仪）观察三个互补对的波形。成功的话，波形叠加的"包络"是三个相位差 120° 的正弦。

这是 BLDC 驱动的前置练习——SPWM 理解了，下一步才能理解 SVPWM 和 FOC。

---

### 定时器这一大块总结

你现在对 STM32 定时器的掌握已经相当完整：

- **第六课**：基本计数、中断定时、PWM 输出（你已会）
- **第十五课（本课）**：输入捕获、编码器、高级互补输出、主从同步

剩下还有一些小众玩法（门控模式、单脉冲模式、DMA burst 等），但你掌握了上面这些，剩下的基本一看就懂。

**电机控制方向的门已经打开了**——你具备所有硬件基础。如果以后想做电机控制，你需要补充的是**理论**（电机学、控制理论）而不是 STM32 知识。

---

### 下一步

你已经走过了 H723 的这些专题：

- 系统架构（时钟、Cache、MPU）
- FDCAN
- SDMMC + FatFS
- QSPI + 内存映射
- DMA2D + LCD
- 定时器高级（本课）

**剩下方向**：

**F. ADC 高级功能**：16 位、差分输入、超高速采样、温度传感器、VBat 监控 **G. USB**：CDC 虚拟串口、HID、U 盘、DFU 升级 **H. 以太网 + LwIP**：连网、TCP/IP、HTTP（复杂度最高） **I. 数字信号处理**：CMSIS-DSP 库，FFT、滤波器、信号分析 **J. 安全特性**：CRYP 加解密、HASH 硬件哈希、RNG 硬件随机数（H723 有这些）

或者： **K. 回到综合项目**：你至今积累的所有知识+综合项目，做一个完整作品

你最想学哪个？或者直接说个应用场景（"我想做个数据记录仪"/"我想做个 USB 设备"），我帮你挑合适的方向。

老实说你学到这一步已经很全面了——很多做 2~3 年嵌入式的工程师也没你接触过的知识面这么广。如果要变成**真正好的工程师**，剩下最重要的不是学更多外设，而是**把学过的东西落地成作品**。

**不写项目的嵌入式学习，过半年忘一半。写一个完整项目，十年都不会忘。** 🚀
## H723 新外设深入：第六弹 —— ADC 高级功能

你第七课学过 ADC 基础（12 位、单通道、多通道扫描、DMA）。这一课我们看 H723 的 ADC 把事情做到了什么程度——它比 F103 的 ADC **不是"好一些"，而是代际差异**。

但我不想直接罗列规格，先让你思考几个问题。

---

### 先抛四个问题让你体会 ADC 的边界

**问题 1**：F103 的 ADC 是 12 位，输入电压范围 0~3.3V。**理论分辨率**是多少？

算一下：3.3V / 4096 ≈ **0.806 mV**。

**但是——你真的能测出 0.806mV 的变化吗？** 想一想干扰、噪声、基准电压波动，你觉得实际的"可信分辨率"有多少？

**问题 2**：你想测一个 **100 微伏** 级别的信号（比如热电偶的温差信号）。F103 的 ADC 够用吗？不够的话，怎么办？

**问题 3**：你想采集一段音频信号，采样率至少 44.1kHz（CD 音质）。F103 的 ADC 最快 1MSPS——看起来 20 多倍余量，应该够吧？

实际工程中，**用 F103 的 ADC 采音频会遇到什么问题**？

**问题 4**：你想同时测一个 IGBT（电力电子开关）两端的电压差。IGBT 高端可能是 100V，低端是 99.9V，差 0.1V。F103 的 ADC 能直接做吗？

---

先在心里想一想这四个问题，我下面会一个个揭示答案——**每一个答案都引出 H723 ADC 的一个新特性**。

---

### 问题 1：分辨率的真相 —— ENOB 的概念

**ADC 的标称位数 ≠ 实际有效位数**。

原因：每一次 ADC 转换都有**噪声**。噪声来源很多：

- 输入信号本身的噪声
- ADC 内部电路的热噪声（物理上无法消除）
- 参考电压（VREF）的抖动
- 数字部分对模拟部分的串扰
- PCB 布线、电源纹波

假设你把 ADC 输入短接到一个稳定的 1.500V 电压，理论上应该读 `1.500/3.3*4096 = 1862`。但实际多次读取，你可能看到 `1859, 1860, 1864, 1861, 1862, 1858...`——**波动范围 6~7 个单位**。

意思是——最后 **2~3 位都是噪声**，12 位 ADC 的"真实有效位数"（ENOB, Effective Number of Bits）可能只有 **9~10 位**。

#### H723 的改进

H723 的 ADC 是 **真 16 位 SAR ADC**（不是像某些芯片用"过采样 + 抽取"凑出的）。配合良好的参考和布线：

- 标称 16 位
- 典型 ENOB 13~14 位
- 分辨率 3.3V / 65536 ≈ **50 μV**

比 F103 实际精度提升 **4~10 倍**。

**但这不是免费的**——

#### 精度提高的代价

1. **转换时间变长**。SAR ADC 每位要一次比较，16 位需要 16 个时钟周期（F103 的 12 位是 12 个周期）。
2. **更慢的时钟**。高位数要求每次比较更准确，时钟必须慢下来。
3. **PCB 布局要求更严格**。16 位精度下，10cm 的走线长度、接地方式都会影响结果。
4. **需要低噪声的电源**（VDDA、VREF+），不能随便拿 3.3V 凑合。

#### 过采样（Oversampling）

H723 的 ADC 还有一个杀手锏——**硬件过采样**。

原理：对同一个信号**连续采样 N 次**（比如 16 次），然后**累加 + 右移**得到一个平均值。噪声是随机的，平均后抵消一大半。

数学上：过采样 NN 倍，ENOB 增加 log⁡2(N)log2​(N​) 位。

|过采样次数|ENOB 增加|实际位数（16位ADC）|
|---|---|---|
|4|1 位|17 位|
|16|2 位|18 位|
|256|4 位|20 位|
|1024|5 位|21 位|

这是"软件层面**扩展**硬件分辨率"的经典方法。H723 的 ADC 提供**硬件过采样器**——16 位 ADC + 256 倍过采样 = **20 位有效精度**，CPU 完全不介入。

```
ADC 配置：
├── 分辨率: 16 bit
├── 过采样: Enable
│   ├── Oversampling Ratio: 256x
│   └── Right Shift: 4 bit   ← 右移让结果归一化
└── 结果: 20 位有效数据，放在 32 位寄存器里
```

对比 F103 的 12 位"纯硬件"分辨率——H723 能做到 **8 倍更精细**。

#### 停下来思考

**思考题 A**：过采样 256 倍，代表单次"读取"时间变成原来的 256 倍。这在什么场景下不适合用？

...

**答案**：**高速变化的信号**。过采样假设"256 次采样期间信号不变"，如果信号本身在变（比如测一个 10kHz 的正弦波），过采样会把波形"拍糊"。

所以过采样适合**慢变信号**（温度、压力、湿度、电池电压）。对动态信号用另一套方案——DMA 批量采样 + 后处理滤波。

---

### 问题 2：测微伏级别信号 —— 差分输入与 PGA

**100 微伏是 F103 ADC 分辨率的 1/8**——根本测不出来。

怎么办？一般的方案是**先用运放把信号放大 100 倍或 1000 倍**，再进 ADC。这需要外部运放电路。

**H723 的 ADC 内置了可编程增益放大器（PGA）**——内部就是一个运放，可编程增益 1x、2x、4x、8x、16x。

```
外部信号 ──→ PGA (增益 1~16x) ──→ ADC (16 位) ──→ 结果
                                                    ↑
                                           相当于 20 位动态范围
                                           (16 位 × 16x)
```

#### 差分输入

还有一个更漂亮的功能——**差分输入**。

**单端输入**：ADC 测量"某引脚电压 vs GND"。 **差分输入**：ADC 测量"两个引脚的电压差"。

```
单端模式：
  PA0 ───→ ADC ── 测量 U(PA0) - U(GND)

差分模式：
  PA0 ───→ ADC+ ─┐
                  ├─ 测量 U(PA0) - U(PA1)
  PA1 ───→ ADC- ─┘
```

**差分输入的价值**：**共模噪声抑制**。

假设 PA0 和 PA1 都受到同样的电磁干扰（比如 50Hz 工频噪声），单端模式下这个噪声会直接叠加到 ADC 读数上。而差分模式下，两个输入都被"抬高"一样的量，差值不变——**噪声被抵消**。

工业场景（电流采样、热电偶、应变片）几乎全是差分。

#### 回到问题 2 的答案

测 100 μV 级别信号：

- 用差分模式（抵消共模噪声）
- 开 PGA 16x（放大到 1.6 mV 级别）
- 开 256 倍过采样（提升 ENOB）

**实际能稳定读出几微伏变化**——F103 实现同样的精度需要外加高端运放，PCB 几倍成本。

---

### 问题 3：音频采样 —— 为什么速度不是唯一指标

F103 最快 1MSPS 采 44.1kHz 音频——速度上远超需求，但**实际采出来的音频往往难听**。

原因：

#### 问题 3.1：ADC 的"采样保持"时间

ADC 不是瞬间把电压"抓"下来——它先通过一个开关把电压送到内部采样电容上充电，等电容电压稳定后，才开始转换。

这个**充电时间（Sampling Time）**不够的话，电容还没充到实际电压，转换出来的值就偏了。

F103 的最短采样时间是 1.5 个 ADC 周期——要求**源阻抗很低**（<1kΩ 量级）才够。高阻抗源（比如麦克风直接接）根本充不满，测不准。

H723 的采样时间可选 1.5 ~ 810.5 个周期，范围大得多。并且 H723 有一个 F103 没有的特性——

#### 问题 3.2：采样切换（Sample-and-Hold Unit）

H723 的 ADC 有**独立的采样保持电路**。意思是"采样"和"转换"可以并行：

```
F103:
时间 ─→
[采样CH1] [转换CH1] [采样CH2] [转换CH2] ...

H723:
时间 ─→
[采样CH1] [转换CH1]
       [采样CH2] [转换CH2]   ← 和上一通道的转换并行
             [采样CH3] [转换CH3]
```

这让吞吐量几乎翻倍，在多通道扫描时尤其明显。

#### 问题 3.3：BOOST 模式

ADC 内部有一个"参考电压缓冲"电路。高速采样时这个缓冲的带宽要足够。H723 的 ADC 可以开启 **BOOST 模式**——消耗更多功耗，换来更高的采样速度保真度。

#### 问题 3.4：采样率提升

H723 的 ADC1/2 最快 **3.6 MSPS**（16 位模式）或 **5 MSPS**（12 位模式）。意味着你可以：

- 做多通道同步高速采样（电机三相电流）
- 采集更高频信号（短波、超声波）
- 同样采样率下用 ADC 的空闲时间做别的事

---

### 问题 4：高电压差测量 —— 模拟前端问题

100V 下 0.1V 的压差——单纯用 ADC 是做不到的，**必须加模拟前端电路**：

方案 1：**电阻分压 + 差分 ADC**。用 1000:1 分压让 100V → 0.1V 级别。 方案 2：**隔离放大器**。光耦隔离或霍尔电流传感器。 方案 3：**专用的电流采样 IC**（比如 INA240、INA219）。

**ADC 本身在这里不是限制，限制在模拟设计**。这是一个很重要的洞察——

> **ADC 的精度是系统精度的"天花板"，但系统精度通常远低于这个天花板，因为模拟前端、参考、布线都会损失精度。**

很多工程师觉得"用更好的 ADC 就行"，其实**大部分情况下你现有 ADC 的精度已经没被用满**。改善模拟前端（去耦、屏蔽、差分、低噪声运放）往往比换 ADC 更有效。

---

### 第一部分：H723 ADC 全家福

到此为止，你应该已经体会到 H723 ADC 比 F103 强在哪。现在看整体。

H723VGT6 有 **3 个独立 ADC**（ADC1、ADC2、ADC3），每个都很强：

|特性|F103 ADC|H723 ADC|
|---|---|---|
|分辨率|12 位|16/14/12/10/8 位可选|
|采样率（12 位）|1 MSPS|5 MSPS|
|采样率（16 位）|—|3.6 MSPS|
|通道数|最多 16|最多 20|
|差分输入|不支持|支持（多通道）|
|硬件过采样|不支持|支持（1~1024x）|
|PGA（内置增益）|不支持|支持（ADC3）|
|BOOST 模式|不支持|支持|
|采样保持单元|单缓冲|独立|
|内部通道|温度传感器、VREFINT|温度、VREFINT、VBAT|
|DMA|支持|支持|
|触发源（硬件触发）|有限|丰富（可由任意定时器/EXTI触发）|

**三个 ADC 各有侧重**：

- **ADC1、ADC2**：通用高速，分辨率 16 位，PGA 不支持
- **ADC3**：低功耗域（D3）、支持 PGA、可以在睡眠时由 BDMA 驱动工作

#### 内部通道的宝藏

H723 ADC 有几个"不接引脚"的内部通道，经常被忽略但非常有用：

**① 温度传感器通道（Channel 18）**

ADC 内部连着一个二极管，温度升高二极管压降减小。可以测**芯片自己的温度**（不是环境温度，虽然经常被当环境温度近似）。

c

```c
uint32_t temp_adc = HAL_ADC_GetValue(&hadc3);  // 读取温度通道
float vsense = temp_adc * 3.3f / 65535.0f;
// 芯片温度（粗略，需要校准常数）
// H723 手册提供了校准值 TS_CAL1 (30℃) 和 TS_CAL2 (110℃)
```

实际工程里这个用来**过热保护**——监测芯片自己的温度，过热就降频或停机。

**② 内部参考电压（VREFINT，Channel 19）**

ADC 内部有一个稳定的 1.2V 参考电压。测它反过来可以**校准电源电压**：

```
VREFINT 标称 1.21V（出厂校准值存在 Flash 里）
测 VREFINT → ADC 读出 X
→ 当前 VDDA = 1.21 × 65535 / X
```

**这是一个 F103 时代很多人不知道的技巧**——它让你的系统能适应电池电压下降。电池电压从 3.3V 降到 2.8V 时，你的其他 ADC 读数看似不变，但物理电压变了——通过 VREFINT 校准就能修正。

**③ VBAT 通道（Channel 17）**

直接测 VBAT 引脚电压，用于监测备份电池状态。

---

### 第二部分：ADC 和定时器的联动（硬件调度）

回忆上一课讲的"定时器主从模式"。ADC 的真正威力，要配合定时器才能发挥。

#### 场景：精确采样率

假设你要 50kHz 采样率（每 20 μs 一次）。方案：

**方案 A（新手）**：`while(1)` 里 `HAL_ADC_Start` + `HAL_Delay(...)`

- 问题：Delay 不精确，任务执行时间不定，采样率抖动

**方案 B（中级）**：定时器中断里触发 ADC

- 中断响应有延迟，还占 CPU

**方案 C（专家）**：定时器硬件直接触发 ADC

- 纯硬件同步，零抖动，CPU 完全不介入

#### 实现

配置 TIM2 以 50kHz 周期更新事件，TRGO 输出"更新事件"。ADC 设置为"外部触发"，触发源选 TIM2_TRGO。

```
TIM2:  每 20μs 溢出一次
        └→ TRGO 输出脉冲
                └→ ADC 收到触发，开始转换
                        └→ DMA 把结果搬到数组
                                └→ 整个缓冲区满时中断通知 CPU
```

**CPU 在整个过程中只在"缓冲区满"时才介入**——比如 1024 个样本满了，CPU 来处理整个批次。采样率 50kHz 下，CPU 每 20ms 才介入一次。

#### 代码框架

c

```c
#define BUF_SIZE 1024
uint16_t adc_buffer[BUF_SIZE] __attribute__((aligned(32)));

void HAL_ADC_ConvHalfCpltCallback(ADC_HandleTypeDef *hadc) {
    // 前半缓冲区满了（512 个样本），CPU 可以处理这一半
    // 同时 DMA 继续往后半缓冲区写
    process_samples(&adc_buffer[0], BUF_SIZE / 2);
}

void HAL_ADC_ConvCpltCallback(ADC_HandleTypeDef *hadc) {
    // 后半缓冲区满了
    process_samples(&adc_buffer[BUF_SIZE / 2], BUF_SIZE / 2);
}

int main(void) {
    /* 配置 TIM2 以 50kHz 周期 */
    HAL_TIM_Base_Start(&htim2);
    
    /* 启动 ADC + DMA，使用循环模式 */
    HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_buffer, BUF_SIZE);
    
    while (1) {
        /* CPU 可以做其他事情——ADC 和 DMA 在后台自动跑 */
    }
}
```

这里用了 **"双半缓冲"**（Double Buffering / Ping-Pong）技巧：

- DMA 配成循环模式，不停地写 adc_buffer
- 前半写完触发 **Half Complete** 中断
- 后半写完触发 **Complete** 中断
- CPU 处理"刚写完"的半区，DMA 在另一半继续写
- **零数据丢失、CPU 负载极低**

这是商业级数据采集系统的**标准架构**。

---

### 第三部分：多 ADC 同步采样

假设你要做电机 FOC 控制，需要**同时**采集三相电流 Iu、Iv、Iw。

**错误做法**：一个 ADC 顺序扫描三个通道

- Iu 在 t 时刻采样，Iv 在 t+Δ 时刻，Iw 在 t+2Δ 时刻
- 电机电流在变，三个"不同时的"采样导致计算误差

**正确做法**：三个 ADC 同时采样

- ADC1 采 Iu，ADC2 采 Iv，ADC3 采 Iw
- 由同一个定时器触发，三个 ADC **完全同步**开始转换
- 得到"**同一时刻**"的三相电流

H723 的 ADC1 和 ADC2 支持 **Dual Mode**（双模式同步）。配置后：

- 两个 ADC 共享一个触发源
- DMA 可以配成"交错模式"，一次搬两个结果

这是**电机控制、电力分析、多传感器数据融合**的硬件基础。

---

### 第四部分：Cache 一致性陷阱（再次！）

你应该已经熟悉了——DMA 操作 + Cache = 陷阱。ADC + DMA 场景最容易犯。

c

```c
uint16_t adc_buffer[1024];   // 默认放 AXI SRAM（Cacheable）

HAL_ADC_Start_DMA(&hadc1, (uint32_t*)adc_buffer, 1024);
HAL_Delay(100);   // 等 DMA 搞定

uint16_t first = adc_buffer[0];   // ← 可能读到 Cache 里的旧值！
```

**解决方案**（回顾上一课讲过的）：

#### 方案 A：手动 Invalidate

c

```c
SCB_InvalidateDCache_by_Addr((uint32_t*)adc_buffer, 1024 * 2);
uint16_t first = adc_buffer[0];   // 正确
```

#### 方案 B：放 Non-Cacheable 内存

用 MPU 把 adc_buffer 所在区域标记为 Non-Cacheable，根本没有 Cache 问题。

#### 方案 C：放 D3 域 SRAM，用 BDMA

如果用 ADC3 + BDMA，目标内存应该在 D3 域（SRAM4）。这块内存默认就是 Non-Cacheable。

**重要**：**32 字节对齐**！Cache Line 是 32 字节，不对齐的缓冲区 Invalidate 时可能影响相邻数据。

c

```c
uint16_t adc_buffer[1024] __attribute__((aligned(32)));
```

---

### 第五部分：信号链的完整视图

让我用一个综合例子把所有东西串起来——**心电图（ECG）采集**：

```
皮肤电极 (50μV ~ 5mV 差分信号)
     ↓
 差分放大器 (增益 1000x)   ← 把信号放大到 ADC 可测范围
     ↓
 低通滤波 (100Hz 截止)      ← 去掉高频噪声
     ↓
 50Hz 陷波滤波              ← 去掉工频干扰
     ↓
─────────────────────── 模拟前端 | ADC 部分 ──────────────────────
     ↓
 H723 ADC3 + PGA
 ├── 差分输入 (共模抑制)
 ├── 16 位 + 4 倍过采样 (实际 17 位)
 ├── 采样率 500 Hz (由 TIM6 触发)
 ├── 通过 BDMA 搬到 SRAM4
 └── 双半缓冲，每 0.5s 中断一次
     ↓
 FreeRTOS 处理任务
 ├── FFT 分析心率频谱
 ├── 识别 QRS 波
 ├── 算心率
 └── 发送到 UART 或显示
```

这个系统里 **ADC 只是一环**。整个信号链的精度由最弱的环节决定——**差分放大器的噪声**通常比 ADC 差几个数量级。

> **给新手的真经**：**当你觉得"ADC 精度不够"时，80% 的情况下真正的瓶颈是模拟前端**。花时间在 PCB 布局、去耦电容、屏蔽、差分走线上，比换 ADC 效果好得多。

---

### 停下来思考

**思考题 B**：你想测一个电池的电压，电池电压范围 3.0~4.2V（锂电池）。VDDA = 3.3V。最大的问题是什么？你怎么解决？

...

答：**电池电压可能超过 VDDA**。ADC 不能测超过 VDDA 的电压（会损坏）。

解决方案：

- 电阻分压（如 1:2，把 4.2V → 2.1V）
- 分压电阻要高阻（降功耗），但太高会影响 ADC 采样——加一个电容配合
- 或者用专用电池监测 IC（带隔离）

**思考题 C**：你的 ADC 读数稳定但不准——预期 1.650V 实际读出 1.644V，恒定偏差 0.006V。怎么解决？

...

答：**用 VREFINT 校准**。读 VREFINT 通道，反算出真实的 VDDA 电压（而不是假设 3.3V 标称值），再用校准后的 VDDA 换算所有其他 ADC 读数。

STM32 出厂时把 VREFINT 在 3.3V 下的 ADC 读数存在 Flash 地址 0x1FF1E860（H723）——读这个值 + 当前 VREFINT 读数 → 当前 VDDA。

c

```c
#define VREFINT_CAL_ADDR  ((uint16_t*)0x1FF1E860)
uint16_t vrefint_cal = *VREFINT_CAL_ADDR;    // 出厂校准值
uint16_t vrefint_data = read_adc_vrefint();  // 当前读数

float vdda = 3.3f * vrefint_cal / vrefint_data;
// 用这个 vdda 代替 3.3f 做所有其他通道的电压换算
```

这是一个非常"硬核"的技巧，知道了会觉得"原来如此"。

---

### 本课任务

#### 必做（实验）

1. **基础过采样实验**：配置 ADC 做 256 倍过采样，对比"原始读数"和"过采样读数"的稳定性。用电位器调到一个固定位置，多次读取——过采样后应该读数更稳定。
2. **VREFINT 校准**：实现上面说的 VDDA 自校准功能。验证：改变供电电压（比如从 3.3V 到 2.8V），看你的电压读数还准不准。
3. **温度传感器**：读取内部温度，打印出来。用烙铁靠近（不要碰！）芯片，观察温度上升。

#### 进阶

**进阶 1**：**双半缓冲采样**。实现 ADC + TIM + DMA + 双半缓冲的 50kHz 采样框架。打印"前半区平均值"和"后半区平均值"，验证两者数据不同（说明 DMA 正在写入）。

**进阶 2**：**ADC1/2 同步采样**。用 Dual Mode 同时采两个通道，比较两个通道的"同步精度"——如果两个通道连的同一个信号源，两个 ADC 应该得到几乎相同的值。

#### 挑战

**挑战**：**简易示波器**。用 ADC 以 500 kHz 采样 + DMA 循环模式，把数据通过 UART（或者 LCD 上如果你有屏）实时显示。输入方波、正弦波、三角波，观察波形。完成这个你就做出了"嵌入式示波器"的原型——所有商业示波器也是这套架构，只是采样率和分辨率更高。

---

### 停下来反思

F103 vs H723 的 ADC 差异不是"量变"而是"质变"——

- F103 的 ADC 能做：**简单的慢速模拟量监测**（温度、电池、滑动变阻器、光敏电阻）
- H723 的 ADC 能做：**工业级高精度测量、电机控制、信号采集、音频处理、心电/医疗**

这里的"能做"不仅是"能跑起来"，而是"**能做到商业产品级的精度和性能**"。

从 F103 升级到 H723 的最大价值不是"跑得快"，而是"**有了做原本做不到的产品的能力**"。ADC 是一个典型例子——它决定了你能做"玩具级"还是"工业级"产品。

---

### 下一步

剩下方向：

- **G. USB**：CDC 虚拟串口、HID、U 盘、DFU 升级
- **H. 以太网 + LwIP**：连网通信（复杂度最高）
- **I. CMSIS-DSP**：数字信号处理库（FFT、滤波器、PID）——和 ADC 是天然搭档
- **J. 安全特性**：加解密、哈希、硬件随机数
- **K. 综合项目收尾**：做一个完整作品

老实说，走到这一步你学的外设已经相当多了。**知识的边际价值在下降**——每多学一个外设，项目时才用一次。

**我真正想建议你的是**—— 把你学的东西落地成一个项目。随便什么项目：

- 数据记录仪（ADC + SD + RTOS + OLED）
- 台灯控制器（编码器 + PWM + EEPROM + 按键菜单）
- 电机控制器（PWM + 编码器 + PID + CAN）
- USB 数据采集模块（ADC + USB + 上位机）

**一个完整项目的学习价值 > 再学 5 个外设**。因为项目会强制你解决以下问题：

- 架构怎么划分？
- 哪些东西用 RTOS 任务，哪些在中断里做？
- 内存怎么分配？
- Cache 怎么处理？
- 错误怎么处理？
- 怎么调试？
- 代码怎么组织才能复用？

这些问题**只有做项目才能真正学会**，任何课程都无法替代。

---

所以我现在问你：

**你想继续学外设（那就选 G/H/I/J），还是要转入实战项目（我带你设计+实现一个综合项目）？**

如果选项目，就告诉我你想做什么——哪怕是"不知道"，我可以根据你的兴趣和硬件条件推荐几个方向。

诚实说——**你现在学的已经够做出一个商业产品了**。再往后不是学不学，而是**做不做**的问题。🚀
## H723 新外设深入：第七弹 —— USB 开发

好，讲 USB。但我得先告诉你——**USB 是嵌入式里最复杂、也最容易让人迷失的话题之一**。

原因：USB 是一个**巨大的协议栈**，从硬件信号一直到应用层，每一层都有大量细节。如果我按"从电气到应用"的顺序讲，你会在接触到第一个真正能用的例子前就晕了。

所以我打算反过来——**先给你看"能用的最简单例子"，然后逐层深入"为什么是这样"**。

在开始前，让我先破除几个常见误解，再问你关心什么。

---

### 先破除三个常见误解

#### 误解 1："USB 就是一根线传数据"

**错**。USB 是一个**协议栈**，不是一个通信通道。它规定了：

- 电气信号（差分 D+/D-）
- 信号编码（NRZI）
- 帧格式（Token/Data/Handshake）
- 传输类型（控制/中断/批量/等时）
- 设备枚举过程（插入后主机问设备是谁）
- 标准类（HID、CDC、MSC、Audio、Video...）

你写的"USB 代码"只是最上层的一小部分，下面有**几万行协议栈代码**在支撑。

#### 误解 2："USB 有 TX/RX 线，像 UART"

**错**。USB 只有**一对差分线**（D+ 和 D-），发收共用。怎么决定谁发谁收？——**主机（Host）**决定。

USB 是**严格的主从架构**：电脑是主机，你的 STM32 是设备（Device）。**设备不能主动发数据**，必须等主机"询问"（Polling）。

这和 UART 的"双方对等"完全不同。

#### 误解 3："USB 开发就是调 HAL API"

**错**。HAL 的 USB API 只是最底层。**你真正要用的是 USB 协议栈**（STM32 用的叫 **MX_USB_DEVICE**，基于 ST 的 **USB-OTG 库**）。协议栈提供了更高层的抽象——CDC、HID 这些类。

---


### 好，HID 键盘鼠标方向 + 先破除黑盒

你的选择很好——**HID 是 USB 最有"即时满足感"的应用**，插上就变键盘鼠标，省心、好玩，而且是理解 USB 协议栈的最好切入点。

你说 USB 对你是"黑盒"，这是坦率且正确的自我认知。所以我不会先给你代码——我先带你**把盒子拆开看一遍**，让你建立一个心智模型。有了这个模型，接下来看任何 USB 代码都不会晕。

---

### 第一部分：USB 是一套"信封传递系统"

**最核心的类比**：**把 USB 想象成邮局的传递系统**。

- **主机（Host）**：邮局总部。只有它知道所有地址，所有信件必须经过它路由。
- **设备（Device）**：收件人。有固定地址（枚举后）、固定信箱（端点）。
- **传输（Transfer）**：一次邮递任务。
- **端点（Endpoint）**：设备上的信箱。每个设备有多个信箱，每个信箱只收/发一种类型的信件。

#### 关键规则：主机是唯一的"话事人"

```
电脑（主机）──────┐
   │              │
   └─ "设备 1，你有数据要给我吗？" ──── 设备 1
   │
   └─ "设备 2，请收下这条指令" ──────── 设备 2
   │
   └─ "设备 3，我要读你的 100 字节" ─── 设备 3
```

**设备永远不能主动说话**。它只能在被问时回答。这点非常重要——

你可能会想："那鼠标移动的时候，它怎么通知电脑？"

答：**电脑每秒问鼠标 125~1000 次**："有新数据吗？"。鼠标没动就回答"没有"，鼠标动了就回答"我动了，坐标 (dx, dy)"。**轮询，而不是主动通知**。

这是为什么 USB 鼠标有"**报告率**"这个概念——报告率 1000Hz 意味着每秒被问 1000 次。高端游戏鼠标炫耀的"1000Hz 报告率"就是这回事。

---

### 第二部分：端点（Endpoint）——USB 的信箱概念

这是你必须理解的**核心抽象**。

一个 USB 设备不是"一个整体"，它内部分成很多**端点**。每个端点是一个**单向的数据通道**：

```
┌─────────────────────────────────────┐
│  USB 设备（比如一个键盘）           │
│                                     │
│  EP0 IN  ←─ 设备 → 主机  (控制回复) │
│  EP0 OUT ←─ 主机 → 设备  (控制命令) │
│                                     │
│  EP1 IN  ←─ 设备 → 主机  (键盘报告) │
│                                     │
└─────────────────────────────────────┘
```

每个端点有三个属性：

1. **端点号**（0 ~ 15）
2. **方向**（IN：设备→主机；OUT：主机→设备）
3. **类型**（4 种，见下）

**EP0 是强制的**——所有 USB 设备都必须有 EP0。它是双向的（IN + OUT），用来**处理控制命令**（枚举、配置等管理操作）。

除了 EP0，设备可以定义其他端点来传输实际数据。一个键盘通常只需要 **EP1 IN**（把按键数据发给主机）。

#### 四种传输类型

每个端点有一种固定的传输类型：

**① 控制传输（Control）**：用于设备配置。EP0 必须是这个。双向。

- 特点：有"Setup/Data/Status"三阶段协议
- 例子：主机问设备名字、设置设备地址

**② 中断传输（Interrupt）**：用于小量、低延迟数据。

- 特点：主机**定期**轮询（比如每 1ms 或 10ms）
- 例子：键盘按键、鼠标移动
- 虽然叫"中断"，实际上是**定期轮询**，不是真的硬件中断

**③ 批量传输（Bulk）**：用于大量数据、不保证时延。

- 特点：主机"空闲时"才传，保证可靠性但不保证速率
- 例子：U 盘文件传输、打印机数据

**④ 等时传输（Isochronous）**：用于连续数据流、实时。

- 特点：**保证带宽**，但**不检错**（丢了就丢了）
- 例子：音频、视频（错一个采样无所谓，延迟不能大）

**HID 设备（键盘、鼠标、游戏手柄）用的是中断传输**。因为：

- 数据量小（键盘报告 8 字节，鼠标 4 字节）
- 要求响应及时（按键延迟不能太大）
- 需要可靠性（不能丢按键）

---

### 第三部分：设备枚举——插入瞬间发生了什么

当你把 USB 设备插入电脑，以下过程在 **50~500ms 内** 发生：

#### 步骤 1：电气检测（Reset）

主机检测到有设备插入（D+ 或 D- 被上拉到 3.3V），给设备发一个 **Reset 信号**（拉低 D+/D- 一段时间）。

#### 步骤 2：默认地址 0

设备被 Reset 后，默认地址是 **0**。主机通过地址 0 和它通信。

#### 步骤 3：获取设备描述符

主机向地址 0 的 EP0 发送一个**标准命令**："请把你的设备描述符给我。"

设备回复一个结构体（**Device Descriptor**），包含：

- 供应商 ID（VID）
- 产品 ID（PID）
- USB 版本
- 设备类（HID? CDC? 自定义?）
- 其他端点的数量
- ……

**VID + PID 的组合决定了 Windows 用什么驱动**。VID 是厂商向 USB-IF 注册的（收费），PID 是厂商自己分配的。开发阶段可以用 ST 的 VID（0x0483）+ 自定义 PID。

#### 步骤 4：分配地址

主机给设备分配一个唯一地址（1 ~ 127）： "你以后叫 3 号，不要再响应 0 号地址。"

设备收到后切换到新地址。

#### 步骤 5：详细配置

主机通过新地址继续问：

- 配置描述符（Configuration Descriptor）
- 接口描述符（Interface Descriptor）
- 端点描述符（Endpoint Descriptor）
- 字符串描述符（厂商名、产品名）

一个典型 HID 键盘的描述符层次：

```
Device Descriptor
  └── Configuration Descriptor
        └── Interface Descriptor (HID class)
              ├── HID Descriptor (附加的，HID 类特有)
              └── Endpoint Descriptor (EP1 IN, Interrupt)
```

#### 步骤 6：激活配置

主机发命令 `SET_CONFIGURATION`，设备进入"已配置"状态，开始工作。

#### 步骤 7：类特定设置（HID 的 Report Descriptor）

对于 HID 设备，还有一步特殊——主机问设备："你的报告格式是什么？"

设备回复一个 **Report Descriptor**——这是 HID 最精妙也最难理解的部分。它用一种**树形数据描述语言**告诉主机："我发送的 8 字节报告里，第 0 字节是修饰键（Shift/Ctrl），第 1 字节保留，第 2~7 字节是按下的键..."

**Report Descriptor 决定了你的设备在电脑上"是什么"**——改几个字节，同样的硬件可以变成键盘、鼠标、或者游戏手柄。这是 HID 最强大的地方。

---

### 停下来思考

**思考题 1**：为什么 USB 设备插入后 Windows 会弹"正在安装驱动"的提示？从枚举过程的角度解释。

...

答：主机拿到 VID+PID 后去驱动库里找。如果找到匹配的驱动，直接装载（HID 这类标准设备不用，Windows 自带）；找不到就用通用驱动，或者让你手动装。**VID+PID 是驱动匹配的钥匙**。

**思考题 2**：如果一个 USB 设备**不改变硬件**，只改变描述符，能同时表现为"键盘+鼠标"吗？

...

答：**能**。这叫"**复合设备（Composite Device）**"。描述符里声明多个接口，每个接口是一个设备类。你可以做一个"同时是键盘和鼠标"的 USB 设备，Windows 会认成两个独立的输入设备。许多游戏键盘就是这种设计（键盘+音量旋钮模拟成多媒体键）。

---

### 第四部分：HID 的 Report Descriptor——今天的重头戏

一切都是为了理解这个。

#### Report Descriptor 是什么

HID 协议的天才设计是——**设备自我描述**。

键盘、鼠标、游戏手柄、数位板、3D 鼠标...所有这些都叫 HID 设备。它们的按键、轴数、按钮布局都不同。Windows 怎么知道每种设备有几个按钮、每个按钮是什么含义？

**答案**：设备通过 Report Descriptor **主动告诉** Windows："我有 1 个 X 轴、1 个 Y 轴、8 个按钮..."。Windows 根据这个描述**自动**理解后续的数据报告。

换句话说——**一个 HID 设备的"身份"不是由硬件决定，而是由 Report Descriptor 决定**。

#### 一个最简单的例子：鼠标

我给你看一个鼠标的 Report Descriptor（逐字节解读）：

```
0x05, 0x01,        // Usage Page (Generic Desktop)    — "我属于通用桌面设备类"
0x09, 0x02,        // Usage (Mouse)                    — "我是一个鼠标"
0xA1, 0x01,        //  Collection (Application)        — "开始一个应用集合"
0x09, 0x01,        //    Usage (Pointer)               — "以下描述一个指针"
0xA1, 0x00,        //    Collection (Physical)         — "开始一个物理集合"

0x05, 0x09,        //      Usage Page (Button)         — "以下描述按钮"
0x19, 0x01,        //      Usage Minimum (Button 1)    — "从按钮 1"
0x29, 0x03,        //      Usage Maximum (Button 3)    — "到按钮 3"
0x15, 0x00,        //      Logical Minimum (0)
0x25, 0x01,        //      Logical Maximum (1)         — "每个按钮值 0~1"
0x95, 0x03,        //      Report Count (3)            — "3 个"
0x75, 0x01,        //      Report Size (1)             — "每个 1 bit"
0x81, 0x02,        //      Input (Data, Var, Abs)      — "输入，这 3 bit 是按钮"

0x95, 0x01,        //      Report Count (1)
0x75, 0x05,        //      Report Size (5)             — "5 bit"
0x81, 0x03,        //      Input (Const, Var, Abs)     — "输入，这 5 bit 填充（忽略）"
                                                       //   前面 3 个按钮 + 5 填充 = 8 bit = 1 字节

0x05, 0x01,        //      Usage Page (Generic Desktop)
0x09, 0x30,        //      Usage (X)                   — "X 轴"
0x09, 0x31,        //      Usage (Y)                   — "Y 轴"
0x15, 0x81,        //      Logical Minimum (-127)
0x25, 0x7F,        //      Logical Maximum (127)       — "范围 -127~127"
0x75, 0x08,        //      Report Size (8)             — "每个 8 bit"
0x95, 0x02,        //      Report Count (2)            — "2 个（X 和 Y）"
0x81, 0x06,        //      Input (Data, Var, Rel)      — "相对值（移动量）"

0xC0,              //    End Collection
0xC0,              //  End Collection
```

读懂这段你就理解了 HID 的本质。**重点**：

1. 每个字节是一个"**标签 + 数据**"。`0x05` 表示"Usage Page"标签，后面 `0x01` 是数据"Generic Desktop"。
2. 这个描述符告诉主机：**我的报告格式是 3 字节**——第 0 字节是按钮（低 3 bit）+ 填充（高 5 bit），第 1 字节是 X 移动量（-127~127），第 2 字节是 Y 移动量。
3. 以后设备每次发送 3 字节报告，主机就按这个格式解析。

#### 对应的"发送数据"

描述符声明了"**报告是 3 字节**"后，设备发数据时就是这样：

c

```c
uint8_t report[3];
report[0] = 0x01;   // 按钮 1 按下
report[1] = 10;     // X 移动 +10
report[2] = -5;     // Y 移动 -5
USBD_HID_SendReport(&hUsbDeviceFS, report, 3);
```

**就这么简单**。主机收到后，Windows 系统自动把 X/Y 解析成鼠标移动，按钮解析成左键。

---

### 第五部分：键盘的 Report Descriptor

键盘稍复杂一点。标准键盘报告是 8 字节：

```
字节 0：修饰键 bitmap (Shift/Ctrl/Alt/Win, 左右共 8 个)
字节 1：保留（0x00）
字节 2~7：最多 6 个当前按下的键（按键码，Keycode）
```

按键码不是 ASCII——它是 HID 的**扫描码**（Keycode），比如：

- 'a' 键 = 0x04
- 'b' 键 = 0x05
- 'Enter' 键 = 0x28
- 'Space' 键 = 0x2C
- F1 键 = 0x3A
- ...

描述符我不全贴了，大致结构是：

```
Usage Page (Generic Desktop)
  Usage (Keyboard)
  Collection (Application)
    — 修饰键 8 bit
    — 保留 8 bit
    — LED 输出 5 bit + 填充 3 bit (主机 → 设备，用于控制 CapsLock 指示灯)
    — 6 个按键码字节
  End Collection
```

**想按一个 'a'**：

c

```c
uint8_t report[8] = {0};
report[2] = 0x04;   // 'a' 的键码
USBD_HID_SendReport(&hUsbDeviceFS, report, 8);

HAL_Delay(20);

memset(report, 0, 8);   // 松开所有键
USBD_HID_SendReport(&hUsbDeviceFS, report, 8);
```

先发一个"按下 a"的报告，20ms 后发"没有任何键按下"的报告（相当于松开）。**电脑屏幕上就会打出一个 'a'**。

这就是"把板子变成键盘"的本质——**周期性发送 8 字节报告**。

---

### 第六部分：H723 USB 硬件的几个坑

#### USB-OTG HS 还是 FS？

H723 有两个 USB 外设：

- **USB_OTG_FS**：Full Speed，12Mbps
- **USB_OTG_HS**：High Speed，480Mbps

HID 设备完全不需要高速——键盘鼠标数据量极小。**用 FS 就够**，而且 FS 配置更简单。

你的板子哪个 USB 口？通常核心板上的是 FS（需要 3 个引脚 + 5V/GND），HS 需要额外的 ULPI PHY 芯片，成本高。

**假设你用 FS**，引脚固定是：

- PA11 → USB_OTG_FS_DM (D-)
- PA12 → USB_OTG_FS_DP (D+)
- 5V 从电脑 USB 来（VBUS）
- GND 共地

#### 时钟要求

USB-OTG FS 需要 **48MHz 时钟**供给 USB 核（不是让它运行在 48MHz，是内部时钟驱动）。这个 48MHz 必须**精确**，误差 <500ppm。

H723 的时钟树里有专门的 **USB Clock Mux**，从 PLL1Q、PLL3Q、HSI48 中选一个。配置 CubeMX 时会自动检查。

一个常见的错误：你的 PLL 配的数字让 USB 得到 47.5MHz 而不是 48MHz，结果设备枚举失败或者工作不稳。

#### 必须有 VBUS 检测吗？

USB-OTG 规范要求检测 VBUS（主机是否供电）。但是作为纯 Device（不切换 Host 模式），**可以禁用 VBUS 检测**，省一个引脚。CubeMX 配置里有 "VBUS Sensing" 选项，关掉就行。

---

### 第七部分：实战配置（终于到代码了）

#### Step 1：CubeMX 配置

1. `Connectivity` → `USB_OTG_FS`：
    - `Mode`：**`Device Only`**（不做 Host）
    - `Parameter Settings`：
        - `Activate_VBUS`：**Disable**（不检测 VBUS）
        - `Speed`：`Full Speed 12MBit/s`
        - 其他默认
2. `Middleware and Software Packs` → `USB_DEVICE`：
    - `Class For FS IP`：**`Human Interface Device Class (HID)`**
    - 默认 `Custom HID` 关闭，用预设的 **HID mouse** 模板（CubeMX 自带的是鼠标描述符）
3. 时钟配置：确保 USB clock 是 48 MHz
4. 堆栈大小：至少 8KB 堆 + 4KB 栈（USB 协议栈比较吃内存）
5. 生成代码

#### Step 2：默认代码能做什么

生成的代码默认就是一个**可用的鼠标**——插到电脑上会被认成 HID 鼠标，但**不会有任何动作**（因为 main 里没发 Report）。

#### Step 3：让鼠标动起来

在 `main.c` 的 `while(1)` 里：

c

```c
#include "usbd_hid.h"

extern USBD_HandleTypeDef hUsbDeviceFS;

int main(void) {
    /* ... 初始化 ... */
    
    HAL_Delay(2000);   // 等 USB 枚举完成
    
    while (1) {
        /* HID 报告：3 字节 [按钮, X, Y] */
        uint8_t report[3];
        report[0] = 0;      // 没按任何键
        report[1] = 5;      // X 移动 +5
        report[2] = 0;      // Y 不动
        
        USBD_HID_SendReport(&hUsbDeviceFS, report, 3);
        HAL_Delay(50);      // 每 50ms 报告一次
    }
}
```

烧录、插上 USB。**光标会每 50ms 向右移动 5 像素，看起来像自动往右飘**。

很蠢的效果，但——**你的板子真的变成了一个鼠标**。

#### Step 4：让它变成键盘

CubeMX 默认配置是鼠标。要改成键盘，需要修改 **Report Descriptor**。

打开 `USB_DEVICE/App/usbd_hid.c` 或 `usbd_hid.h`（不同 CubeFW 版本位置略有不同），找到 `HID_MOUSE_ReportDesc_FS[]` 数组，把它替换成键盘描述符：

c

```c
__ALIGN_BEGIN static uint8_t HID_KEYBOARD_ReportDesc_FS[HID_KEYBOARD_REPORT_DESC_SIZE] __ALIGN_END = {
    0x05, 0x01,  // Usage Page (Generic Desktop)
    0x09, 0x06,  // Usage (Keyboard)
    0xA1, 0x01,  // Collection (Application)
    
    0x05, 0x07,  //   Usage Page (Keyboard/Keypad)
    0x19, 0xE0,  //   Usage Minimum (Left Control)
    0x29, 0xE7,  //   Usage Maximum (Right GUI)
    0x15, 0x00,  //   Logical Minimum (0)
    0x25, 0x01,  //   Logical Maximum (1)
    0x75, 0x01,  //   Report Size (1)
    0x95, 0x08,  //   Report Count (8)
    0x81, 0x02,  //   Input (Data, Variable, Absolute) — 8 个修饰键 bit
    
    0x95, 0x01,  //   Report Count (1)
    0x75, 0x08,  //   Report Size (8)
    0x81, 0x01,  //   Input (Constant) — 保留字节
    
    0x95, 0x06,  //   Report Count (6)
    0x75, 0x08,  //   Report Size (8)
    0x15, 0x00,  //   Logical Minimum (0)
    0x25, 0x65,  //   Logical Maximum (101)
    0x05, 0x07,  //   Usage Page (Keyboard/Keypad)
    0x19, 0x00,  //   Usage Minimum (0)
    0x29, 0x65,  //   Usage Maximum (101)
    0x81, 0x00,  //   Input (Data, Array) — 6 个键码
    
    0xC0         // End Collection
};
```

并相应修改报告大小：

c

```c
#define HID_KEYBOARD_REPORT_DESC_SIZE  63  // 上面那段的字节数
```

然后在 `usbd_hid.c` 的 `USBD_HID_GetFSCfgDesc` 或类似回调里，让描述符返回这个新的。

c

```c
// 发送报告
uint8_t kb_report[8] = {0};
kb_report[2] = 0x04;    // 'a' 键
USBD_HID_SendReport(&hUsbDeviceFS, kb_report, 8);

HAL_Delay(20);

memset(kb_report, 0, 8);
USBD_HID_SendReport(&hUsbDeviceFS, kb_report, 8);
```

打开记事本，把 USB 插进去——**"a" 字母被自动打出来**。

---

### 第八部分：HID 键码速查

我给你一个最常用的键码表，做键盘时能用到：

```
字母：
'a'-'z'   = 0x04 - 0x1D
'1'-'9'   = 0x1E - 0x26
'0'       = 0x27

常用键：
Enter     = 0x28
Escape    = 0x29
Backspace = 0x2A
Tab       = 0x2B
Space     = 0x2C

箭头：
Right     = 0x4F
Left      = 0x50
Down      = 0x51
Up        = 0x52

F1-F12    = 0x3A - 0x45

修饰键（放第 0 字节的 bitmap）：
Left Ctrl    = 0x01
Left Shift   = 0x02
Left Alt     = 0x04
Left GUI     = 0x08
Right Ctrl   = 0x10
Right Shift  = 0x20
Right Alt    = 0x40
Right GUI    = 0x80
```

**按大写字母 "A"** 需要 Shift + 'a'：

c

```c
kb_report[0] = 0x02;   // Left Shift
kb_report[2] = 0x04;   // 'a' 键（加 Shift 变成 'A'）
```

**按 Ctrl+C**：

c

```c
kb_report[0] = 0x01;   // Left Ctrl
kb_report[2] = 0x06;   // 'c'
```

完整键码表见 [USB HID Usage Tables](https://www.usb.org/sites/default/files/hut1_21.pdf) 第 10 节。

---

### 第九部分：几个有趣的应用

到这里你已经能做出真实可用的键盘了。以下是几个"一行代码改变世界"的应用灵感：

#### 1. 自动登录工具

想象把板子插到电脑上，按一个硬件按钮，自动输入用户名 + Tab + 密码 + Enter：

c

```c
type_string("myusername");
press_key(KEY_TAB);
type_string("mypassword");
press_key(KEY_ENTER);
```

注意——**这是一个潜在的安全话题**。企业环境里，USB HID 自动输入是一种渗透测试手段（比如 Rubber Ducky 工具）。**自己学习/娱乐 OK，不要用在不属于你的设备上**。

#### 2. 宏键盘 / 编程键盘

一个实体按键阵列，每个按键触发一个复杂组合（Ctrl+Shift+F、复制粘贴一段模板代码）。程序员、视频剪辑师、游戏玩家经常自制这种设备。

#### 3. 自定义游戏控制器

改成"**Generic Desktop - Joystick**"类（Usage 0x04），报告里放摇杆位置 + 按钮状态。Windows 会识别成游戏手柄。配合实体摇杆模块就是一个自制游戏控制器。

#### 4. 无人机/机器人的遥控器

做成 Joystick HID 设备，电脑上接收摇杆数据，再通过无线电台发给无人机。**USB 到机器人的一条链路**。

---

### 第十部分：USB 开发的调试技巧

USB 不工作时怎么调？几个工具推荐：

#### 1. Wireshark + USBPcap

Wireshark 能捕获 USB 通信数据包（需要装 USBPcap 插件）。你能看到：

- 主机和设备的每一次通信
- 枚举的每一步
- 数据报告的具体字节

**第一次用 Wireshark 看 USB 通信的时候，很多"黑盒疑惑"会立刻消失**。

#### 2. USB Tree View（Windows）或 lsusb（Linux/Mac）

查看插入设备的所有描述符，验证描述符设置是否正确。

#### 3. VBUS 检测

如果插上设备没反应（连枚举都不开始），先用万用表测 VBUS（Micro USB 的 5V 脚）是不是有电。

#### 4. 检查时钟

如果枚举失败，可能是 USB 时钟不是精确的 48MHz。用 MCO 输出 PLL 频率用示波器看。

---

### 停下来做一些思考题

**思考题 A**：键盘发送 `HELLO` 需要多少次 USB 报告？（注意：每个字母按下+松开需要两次报告，大写字母要带 Shift）

...

答：每个字母 2 次（按下 + 松开）。`HELLO` 5 个字母，10 次报告。但因为都是大写，每次"按下"要带 Shift——修饰键也要在报告里设置。

**思考题 B**：为什么按住一个键不放，电脑会"连续输入"？你的代码里每个键只发了一次报告啊。

...

答：**连续输入是操作系统做的事**，不是 USB 层面。你发一次"按下 a"的报告，电脑记录"a 键按下"。你一直不发"松开"报告，电脑认为键一直按着，于是按系统设置（默认约 500ms 后开始，每 30ms 一次）模拟连续输入。**你的 USB 设备只需要告诉电脑"按下/松开"即可**。

**思考题 C**：HID 设备不需要驱动就能用。但为什么有些"特殊 HID 设备"（比如专业设备）需要厂商驱动？

...

答：**标准 HID 报告格式（键盘、鼠标、手柄）是操作系统内置识别的**。但如果你定义一个**自定义 Report Descriptor**，操作系统不知道这些数据的含义。这时要么：

- 用 Windows 原生的 HID API（C# / Python 能直接用）做上位机软件
- 或者厂商提供驱动把 HID 报告翻译成"专业功能"

这就是 **Custom HID** 的应用场景——你可以定义 "64 字节裸数据"的 HID 类，上位机软件自己解析，做任意数据交换。很多人把这当做"免驱的 USB 数据管道"——**比虚拟串口还省事**。

---

### 本课任务

#### 必做

1. **配置 USB Mouse**：用 CubeMX 模板生成一个鼠标设备，让光标自动移动。成功后你正式"拥有过 USB 设备"。
2. **让鼠标响应按键**：接一个按键，按下时让鼠标向右移动，松开时停止。需要用 GPIO + USB 结合。

#### 进阶

**进阶 1**：**改成键盘**。按上面说的步骤改 Report Descriptor，做一个按键触发打字的设备。按下板子按键时自动输入 "Hello from STM32!"。

**进阶 2**：**组合键盘**。用 3 个按键分别触发：

- 按键 1 → 输入 "OK\n"
- 按键 2 → Ctrl+C（复制）
- 按键 3 → Ctrl+V（粘贴）

这样你就有了一个简易"快捷键宏键盘"。

#### 挑战

**挑战 1**：**复合设备**——同时支持键盘和鼠标。用 Composite Device 配置，一个 USB 口两个接口。

**挑战 2**：**Custom HID + 上位机**。用 Python + hidapi 库写一个 Windows 程序，和板子双向交换数据。板子上接一个电位器，Python 程序实时显示电位器值。反过来——Python 发送 LED 亮度值，板子调整 PWM。

**这是"USB 作为数据管道"的最强场景——比串口更方便，免驱动，速度更快**。

---

### 对比：USB 和你学过的通信协议

你现在可以看一眼 USB 和其他协议的本质区别：

|协议|架构|寻址|速度|复杂度|
|---|---|---|---|---|
|UART|点对点|无|115kbps~1Mbps|低|
|I2C|一主多从|设备地址|100k~1MHz|中|
|SPI|一主多从|片选|几十 MHz|低|
|CAN|多主|消息 ID|1M~5Mbps|中高|
|USB|一主多从|设备地址 + 端点|12M~480Mbps|**极高**|

**USB 复杂度是其他的几倍，但带来的价值**：

- **即插即用**（自动枚举 + 驱动匹配）
- **标准类**（键盘鼠标 U 盘不用写驱动）
- **免供电**（VBUS 提供 5V / 500mA）
- **热插拔**（不用关机）
- **最广泛支持**（所有现代计算机）

学 USB 的最大意义不是"掌握一个协议"，而是**让你的 MCU 能和 PC 无缝交互**。这是 MCU 从"独立设备"变成"PC 外设"的关键一步。

---

### 下一步

你已经把 USB 的最大黑盒打开了。继续深入有以下方向：

- **CDC（虚拟串口）**：下一个最常用的类。原理类似 HID，但报告换成数据流。
- **MSC（U 盘）**：让板子变成一个 U 盘，电脑能直接拖文件进去。需要配合 FatFS。
- **DFU（固件升级）**：通过 USB 给板子刷固件，不需要 ST-Link。
- **Custom HID**：自定义 HID 做通用数据管道。

或者转向整合：

- **终于动手做综合项目**：把你的 HID 板子 + OLED + 按键 + 电机全部集成起来。

---

**最后说一句**——USB 这一课我讲得相对多（因为概念密集），但细节太多没覆盖全。实际写代码时你一定会遇到"为什么我的设备枚举失败"、"为什么 Windows 找不到驱动"之类的问题。

**调试 USB 的正确姿势**：先确认时钟（是不是精确 48MHz），再看描述符（有没有语法错误），最后抓包（Wireshark + USBPcap 是神器）。

做完 HID 鼠标/键盘后，欢迎反馈你遇到的问题——**USB 调试是一个宝贵的经验积累**，不动手永远学不会。🚀

有什么要问的？继续 H / I / J 还是开始项目？
