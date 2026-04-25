# 第七课：ADC、DMA 与数据流设计模式

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