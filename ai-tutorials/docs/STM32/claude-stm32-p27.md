# 好，HID 键盘鼠标方向 + 先破除黑盒

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