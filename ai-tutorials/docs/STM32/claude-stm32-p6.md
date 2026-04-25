# 🔧 实战环节：点亮第一个 LED

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