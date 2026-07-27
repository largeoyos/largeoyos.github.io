## 第八节：中断子系统——从硬件信号到进程唤醒的完整链路

前几节我们多次提到中断，但每次都是"点到为止"。第四节说时钟中断触发调度，第五节说缺页是一种异常，第六节说网卡收到数据会通过中断唤醒进程。这一节我们把中断这个主题完整地打开，从硬件发出信号的那一刻，一直追踪到进程被唤醒重新运行，把整条链路串联起来。

理解中断有一个很好的思维模型：**把内核想象成一个随时待命的服务员，大多数时间它都在安静地服务某个进程（执行用户程序），但任何时候硬件都可以拍桌子喊"我有事"，服务员必须立刻放下手头的事情，先处理紧急请求，再回来继续原来的工作**。中断正是硬件"拍桌子"的机制，而内核的中断子系统就是这个"响应紧急请求"的完整流程。

---

### 8.1 三种"中断"的本质区分

在内核代码里，"中断"这个词被用来描述三种不同但相关的概念，搞清楚它们的区别是读懂相关代码的前提。

第一种是**硬件中断（Hardware Interrupt）**，由外部设备主动发出，与CPU当前执行的指令完全无关，随时可能发生。网卡收到数据包、键盘按键、磁盘I/O完成、定时器超时，都会通过这种方式通知CPU。它是真正意义上的"异步"——你永远不知道它什么时候来。

第二种是**异常（Exception）**，由CPU在执行指令时检测到错误条件而触发，是同步的——它一定发生在某条具体指令的执行过程中。第五节讲的缺页中断是异常，除零错误是异常，执行了非法指令也是异常。异常的处理程序通常需要修复错误（比如缺页处理程序分配物理页），或者向进程发送信号（比如除零触发SIGFPE）。

第三种是**软件中断（Software Interrupt）**，也叫陷阱（Trap），是程序主动执行一条特殊指令触发的，用于实现系统调用。在x86-64上，这条指令是`syscall`。它看起来像中断，但实际上是进程主动发起的、有明确意图的内核请求，不是"意外"发生的事件。

这三种情况在x86架构里统一通过**中断描述符表（IDT，Interrupt Descriptor Table）**来处理。IDT是一个有256个条目的数组，每个条目对应一个中断或异常号，存储着处理该中断的函数入口地址。内核启动时填充IDT，然后用`lidt`指令把IDT的地址告诉CPU，之后每当中断发生，CPU硬件自动查表找到处理函数跳转过去。

---

### 8.2 IDT的初始化：内核与硬件的握手

IDT的初始化是内核启动时最早完成的事情之一，因为没有IDT，内核连缺页中断都处理不了，后续任何初始化都无法进行：

```c
// arch/x86/kernel/idt.c

// IDT 条目的结构：每个条目64位，存储处理函数的地址和各种属性
struct gate_desc {
    u16 offset_low;    // 处理函数地址的低16位
    u16 segment;       // 代码段选择子（固定为内核代码段）
    u16 bits;          // 类型、特权级等属性
    u16 offset_middle; // 处理函数地址的中16位
    u32 offset_high;   // 处理函数地址的高32位
    u32 reserved;      // 保留
};

// 填充IDT的过程：把每个中断号和处理函数关联起来
void __init idt_setup_traps(void)
{
    // 0号：除零异常 → divide_error 处理函数
    // 14号：缺页异常 → page_fault 处理函数（第五节提到的）
    // 128号（0x80）：系统调用 → 历史遗留，现代用 syscall 指令
    // ...
    idt_setup_from_table(idt_table, def_idts, ARRAY_SIZE(def_idts), true);
}
```

IDT初始化完成后，内核和CPU之间就建立了一份"合同"：无论何时发生什么中断，CPU都会来IDT这里查表，找到内核注册的处理函数，跳转过去执行。这份合同是整个操作系统"响应事件"能力的物理基础。

---

### 8.3 中断发生的瞬间：CPU自动做了什么

当一个硬件中断发生时，CPU硬件（不是内核代码）会自动完成一系列动作，然后才跳转到内核的处理函数。理解这个自动过程，是理解为什么中断处理程序能"安全地打断"正在运行的进程的关键。

CPU在跳转到中断处理函数之前，会把当前执行状态压入**内核栈**：当前的栈指针（RSP）、程序计数器（RIP，即被打断时正在执行的指令地址）、标志寄存器（RFLAGS）以及代码段（CS）。这些信息足以在中断处理完成后精确恢复被打断的执行状态，就好像什么都没发生过一样。

如果中断发生时CPU正在执行用户空间代码（ring 3），CPU还会额外做一件事：**切换栈**。用户程序的栈在用户空间，内核不能信任它（用户程序可能故意设置一个非法的栈指针）。CPU通过读取TSS（任务状态段）里预先设置好的内核栈地址，切换到内核栈，然后把上面那些寄存器值压入内核栈。这就是"用户态到内核态切换"的硬件机制——不是内核代码主动发起的，而是CPU硬件在中断发生时自动完成的。

这个过程之后，CPU的 `CS:RIP` 被更新为IDT里对应条目的处理函数地址，中断处理正式开始。

---

### 8.4 上半部：中断处理程序必须快到什么程度

中断处理程序运行在一种特殊的执行环境里，这个环境有严格的约束，理解这些约束能帮你看懂很多内核代码里的注释和检查。

在中断上下文里，处理程序不能睡眠。这个约束的根本原因是：中断处理程序没有自己的 `task_struct`，它是借用被打断的进程的内核栈来运行的。如果中断处理程序调用 `schedule()` 让出CPU，调度器会保存并切换当前进程的状态，但中断处理程序的执行状态没有任何地方保存，下次这个进程被调度回来时，中断处理程序就永远丢失了。所以内核在 `schedule()` 里有一个检查，如果发现当前在中断上下文里调用了 `schedule()`，会直接触发 BUG。

除了不能睡眠，中断处理程序还必须尽可能短暂。这是因为在处理某个中断期间，同级或更低优先级的中断是被屏蔽的。如果网卡中断处理程序花了10毫秒，这10毫秒里新到来的网络数据包可能因为中断被屏蔽而丢失。

这两个约束共同导出了Linux中断处理的核心设计原则：**把中断处理分成两半**。上半部（top half）在中断上下文里执行，只做最紧急的事；下半部（bottom half）推迟到稍后在更宽松的环境里执行，完成真正耗时的工作。

以网卡驱动为例，上半部只做三件事：读走硬件寄存器里的中断原因（告诉网卡"我知道了，你可以继续"），把接收到的数据包从网卡的DMA缓冲区移到内核的SKB（socket buffer）结构里，然后调度下半部处理。整个过程控制在几微秒以内：

```c
// drivers/net/ethernet/intel/e1000/e1000_main.c（简化）
// 这是网卡的中断处理程序，在中断上下文里执行
static irqreturn_t e1000_intr(int irq, void *data)
{
    struct e1000_adapter *adapter = data;

    // 读取中断状态寄存器，应答中断（必须做，否则网卡会持续发中断）
    u32 icr = er32(ICR);
    if (!icr)
        return IRQ_NONE; // 不是我的中断，告诉内核继续问下一个驱动

    // 把耗时的数据处理推给下半部（NAPI机制）
    // napi_schedule 只是设置一个标志并触发软中断，本身极快
    if (likely(napi_schedule_prep(&adapter->napi)))
        __napi_schedule(&adapter->napi);

    return IRQ_HANDLED; // 告诉内核这个中断已处理
}
```

你看，上半部的代码几乎没有真正的工作，只是"接收通知"然后"转交任务"。真正的数据处理在下半部里。

---

### 8.5 下半部的三种机制：软中断、tasklet与workqueue

Linux提供了三种下半部机制，它们各有适用场景，理解它们的区别能帮你在读驱动代码时立刻判断"这段代码运行在什么环境里"。

**软中断（softirq）**是最底层、最快速的下半部机制。内核预定义了少量固定的软中断类型，每种类型有一个全局的处理函数。软中断在中断返回路径上、或者在专门的 `ksoftirqd` 内核线程里执行，仍然运行在中断上下文（不能睡眠），但相比硬件中断，它允许其他硬件中断打断自己，响应性更好：

```c
// include/linux/interrupt.h
// 内核预定义的软中断类型，数字越小优先级越高
enum {
    HI_SOFTIRQ = 0,      // 高优先级tasklet
    TIMER_SOFTIRQ,       // 定时器处理
    NET_TX_SOFTIRQ,      // 网络发送
    NET_RX_SOFTIRQ,      // 网络接收（NAPI就用这个）
    BLOCK_SOFTIRQ,       // 块设备I/O完成
    IRQ_POLL_SOFTIRQ,    // I/O轮询
    TASKLET_SOFTIRQ,     // 普通优先级tasklet
    SCHED_SOFTIRQ,       // 调度器（负载均衡）
    NR_SOFTIRQS          // 总数
};
```

注意软中断类型是全局固定的，你写驱动程序时不能创建新的软中断类型。这是故意的设计——软中断代码在所有CPU上并发运行（同一种软中断可以在不同CPU上同时执行），开发者必须自己处理并发安全，这对普通驱动开发者要求太高了。

**tasklet**正是为了解决这个问题而设计的。它基于软中断实现，但保证同一个tasklet在任意时刻只在一个CPU上运行，大大简化了并发处理。驱动程序通常用tasklet来处理中断的下半部：

```c
// 定义和使用tasklet的典型模式
// 第一步：声明一个tasklet，关联处理函数
DECLARE_TASKLET(my_tasklet, my_tasklet_handler, (unsigned long)dev);

// 第二步：处理函数（运行在软中断上下文，不能睡眠）
static void my_tasklet_handler(unsigned long data)
{
    struct my_device *dev = (struct my_device *)data;
    // 处理设备数据，但不能睡眠、不能阻塞
    process_received_data(dev);
}

// 第三步：在中断上半部里调度tasklet
static irqreturn_t my_interrupt_handler(int irq, void *data)
{
    // 做完最紧急的事情后...
    tasklet_schedule(&my_tasklet); // 调度tasklet，稍后执行
    return IRQ_HANDLED;
}
```

**workqueue**是三种机制中最灵活的，也是最常用的。它的关键区别在于：workqueue里的工作函数运行在**内核线程**的上下文里，而不是中断上下文，因此**可以睡眠、可以阻塞、可以使用mutex**。这让它能处理任意复杂的任务：

```c
// workqueue 的典型使用模式
// 第一步：定义一个work_struct，关联处理函数
static DECLARE_WORK(my_work, my_work_handler);

// 第二步：处理函数（运行在内核线程里，可以睡眠！）
static void my_work_handler(struct work_struct *work)
{
    // 可以做任何事：分配内存、等待锁、读写文件
    mutex_lock(&some_mutex);
    do_something_that_might_sleep();
    mutex_unlock(&some_mutex);
}

// 第三步：在中断上半部里提交work
static irqreturn_t my_interrupt_handler(int irq, void *data)
{
    schedule_work(&my_work); // 把work提交给内核线程
    return IRQ_HANDLED;
}
```

三种机制的选择逻辑很清晰：如果你是网络或块设备这类需要极致性能的核心子系统，用软中断。如果你是普通驱动，需要中断上下文但不需要睡眠，用tasklet。如果你的处理逻辑复杂、可能需要睡眠，用workqueue。在现代内核代码里，workqueue是最常见的选择，因为它最灵活，出错的可能性最小。

---

### 8.6 定时器：时间驱动的中断

在所有硬件中断里，定时器中断（timer interrupt）是最特殊也最重要的一个，它是整个内核时间感知能力的基础。内核配置定时器硬件（在x86上通常是APIC定时器）以固定频率产生中断，这个频率由编译时配置的 `HZ` 常量决定（通常是250或1000，即每秒250或1000次）。

每次定时器中断到来，内核做三件核心的事情：更新系统时间（`jiffies` 计数器加一，`jiffies` 就是系统启动以来的定时器中断次数），检查是否有超时的定时器需要触发，以及调用调度器的 `scheduler_tick()` 检查当前进程是否需要被抢占：

```c
// kernel/time/timer.c
// 定时器中断的核心处理函数
void update_process_times(int user_tick)
{
    struct task_struct *p = current;

    // 更新当前进程消耗的CPU时间统计
    account_process_tick(p, user_tick);

    // 触发所有已到期的定时器（比如 sleep(1) 到期后的唤醒）
    run_local_timers();

    // 通知调度器：时钟滴答发生了
    // 调度器在这里检查当前进程是否运行超时，决定是否设置抢占标志
    scheduler_tick();
}
```

`scheduler_tick()` 里发生的事情我们在第四节已经详细讨论过了——它调用 `check_preempt_tick()`，如果当前进程运行时间超过了它的理想时间片，就设置 `TIF_NEED_RESCHED` 标志，等中断返回时触发调度。这就是时钟中断和调度器之间的接口。

---

### 8.7 从中断到进程唤醒：把所有东西串联起来

现在我们来走一遍完整的链路，把这一节的所有内容和前几节的知识串联成一个完整的故事。场景是：你的程序调用 `read()` 等待网络数据，数据到来后程序被唤醒。

你的程序调用 `recv(sockfd, buf, len, 0)`，内核的系统调用处理程序把进程的状态从 `TASK_RUNNING` 改为 `TASK_INTERRUPTIBLE`，把当前进程加入socket的等待队列，然后调用 `schedule()` 主动让出CPU。调度器选择另一个进程运行，你的程序停在了 `schedule()` 内部（第四节讲过，`context_switch` 执行后就"消失"在那一刻了）。

网卡收到数据包，通过DMA把数据写入内存缓冲区，然后向CPU发出硬件中断信号。CPU完成当前指令，把当前状态压栈，查IDT找到网卡中断处理程序的地址，跳转过去。网卡的上半部处理程序执行：读走中断状态寄存器应答中断，调用 `napi_schedule()` 触发 `NET_RX_SOFTIRQ` 软中断，立刻返回。CPU恢复被打断的进程继续执行（中断的"透明性"就体现在这里）。

在中断返回路径上或者 `ksoftirqd` 线程里，`NET_RX_SOFTIRQ` 被执行，调用网卡驱动注册的NAPI poll函数。poll函数从DMA缓冲区取出数据包，构建 `sk_buff`（socket buffer，内核表示网络包的数据结构），调用 `netif_receive_skb()` 把数据包送入网络协议栈。协议栈依次处理以太网头、IP头、TCP头，把payload数据放入socket的接收缓冲区，然后调用 `sk->sk_data_ready(sk)`，这最终调用 `wake_up_interruptible()` 遍历socket的等待队列，找到你的进程，把它的状态改回 `TASK_RUNNING`，加入调度器的就绪队列。

调度器在某个时刻选中你的进程，从 `schedule()` 返回，回到 `recv()` 系统调用的等待循环里，检查接收缓冲区，发现数据已经有了，把数据从内核缓冲区拷贝到你的用户空间 `buf`，系统调用返回，你的程序继续执行。

这条链路——硬件中断、上半部、软中断、协议栈、等待队列、调度器——就是Linux异步I/O处理的完整实现。每一个我们在前几节学到的机制，都在这里找到了自己的位置。

---

### 本节小结与思考练习

这一节我们从IDT的初始化开始，看到了中断发生时CPU硬件自动完成的状态保存，理解了上半部必须快速的原因，认识了三种下半部机制各自的适用场景，最后把一次完整的网络数据接收过程串联成了一条从硬件到用户程序的完整链路。

留给你一个思考练习：我们说软中断可以在所有CPU上并发运行（同一种软中断可以同时在多个CPU上执行），而tasklet保证同一时刻只在一个CPU上运行。那么，如果系统有8个网卡，每个网卡同时收到数据，`NET_RX_SOFTIRQ` 会在几个CPU上并发执行？多个CPU同时处理 `NET_RX_SOFTIRQ` 时，它们共同访问的数据结构（比如路由表、socket的接收缓冲区）是如何保护并发安全的？（提示：路由表的保护是RCU，socket接收缓冲区的保护是什么类型的锁？在 `net/core/sock.c` 里搜索 `sk_receive_queue`，看看它旁边有什么锁。）

---

## 第九节：网络子系统——socket、sk_buff与TCP/IP协议栈的内核实现

上一节末尾我们看到了一条数据接收的链路，数据包从网卡经过软中断进入协议栈，最终唤醒等待的进程。这一节我们把那条链路里的"网络协议栈"部分完整展开。Linux的网络子系统是内核里代码量最大、设计最精密的子系统之一，光是TCP的实现就超过一万行代码。我们不会试图覆盖所有细节，而是沿着一个数据包从网卡到用户程序的旅程，把最核心的数据结构和设计决策一一揭开。

在开始之前，先建立一个整体的层次感。Linux网络栈严格遵循OSI分层模型，但实现时把多层合并成了几个清晰的处理阶段：网卡驱动层负责和硬件交互，把比特流变成内核能处理的数据结构；网络层（IP）负责路由和分片；传输层（TCP/UDP）负责端到端的可靠传输；socket层是应用程序和内核协议栈之间的接口。每一层之间的数据传递，都通过同一个核心数据结构 `sk_buff` 来完成。

---

### 9.1 `sk_buff`：贯穿整个网络栈的核心数据结构

理解Linux网络栈，必须先理解 `sk_buff`（socket buffer）。它是内核用来表示一个网络数据包的数据结构，从数据包被网卡驱动创建的那一刻，到它被应用程序读走的最后一刻，整个旅程都由同一个 `sk_buff` 承载。理解它的设计，你就理解了为什么网络协议栈可以在不同层次之间高效传递数据包而不需要频繁复制内存。

```c
// include/linux/skbuff.h
struct sk_buff {
    // ===== 链表管理 =====
    // sk_buff 通常被组织在链表或队列里
    // 比如 socket 的接收队列就是一个 sk_buff 的链表
    struct sk_buff      *next;
    struct sk_buff      *prev;

    // ===== 数据包内容的核心指针 =====
    // 这四个指针描述了数据包内容在内存中的位置
    // 它们是理解 sk_buff 设计精髓的关键
    unsigned char       *head;  // 分配的内存缓冲区的起始地址（永不移动）
    unsigned char       *data;  // 当前有效数据的起始地址（随协议处理而移动）
    unsigned char       *tail;  // 当前有效数据的结束地址
    unsigned char       *end;   // 分配的内存缓冲区的结束地址（永不移动）

    // ===== 长度信息 =====
    unsigned int        len;    // 数据包的总长度（包括分片）
    unsigned int        data_len;// 在分片中的数据长度

    // ===== 协议信息 =====
    __be16              protocol;  // 上层协议类型（IPv4？IPv6？ARP？）
    __u8                ip_summed; // 校验和的处理方式

    // ===== 指向关联的 socket =====
    struct sock         *sk;    // 这个数据包属于哪个 socket
                                 // 接收方向：填充后指向目标socket
                                 // 发送方向：创建时就知道源socket

    // ===== 各层协议头的指针 =====
    // 这些是 union，同一块内存被不同层次用不同类型解读
    union {
        struct iphdr    *iph;   // IP 头（网络层视角）
        struct ipv6hdr  *ipv6h;
    };
    union {
        struct tcphdr   *th;    // TCP 头（传输层视角）
        struct udphdr   *uh;
    };
```

`sk_buff` 设计里最精妙的是那四个指针：`head`、`data`、`tail`、`end`。理解它们需要想象一个场景：当应用程序发送数据时，数据从用户空间进入内核，内核需要为这个数据包添加TCP头、IP头、以太网头。朴素的做法是每添加一层头部就分配新内存并复制一次，这对于每秒处理百万数据包的高速网络来说开销太大了。

Linux的解法是：在分配 `sk_buff` 时，在数据的**前面**预留足够的空间（叫做headroom），在数据的**后面**预留足够的空间（叫做tailroom）。添加协议头时，只需要把 `data` 指针往前移动，把头部内容写入新的空间，完全不需要复制数据本身。这个操作叫做 `skb_push()`：

```c
// include/linux/skbuff.h

// 在数据包前面添加 len 字节（用于添加协议头）
// 注意：只移动 data 指针，不复制任何数据
static inline unsigned char *skb_push(struct sk_buff *skb, unsigned int len)
{
    skb->data -= len;   // data 指针前移
    skb->len  += len;   // 总长度增加
    // 如果 data 跑到 head 之前了，说明预留空间不够，这是个 bug
    if (unlikely(skb->data < skb->head))
        skb_under_panic(skb, len, __builtin_return_address(0));
    return skb->data;
}

// 反向操作：去掉数据包前面的 len 字节（用于剥离已处理的协议头）
// 接收方向时，每一层处理完自己的头部后调用这个
static inline unsigned char *skb_pull(struct sk_buff *skb, unsigned int len)
{
    skb->len -= len;
    return skb->data += len;  // data 指针后移，跳过已处理的头部
}
```

现在你可以想象数据包从应用程序到网卡的发送过程：应用程序的数据在 `data` 和 `tail` 之间。TCP层调用 `skb_push()` 前移 `data`，写入TCP头。IP层再次 `skb_push()`，写入IP头。以太网驱动再次 `skb_push()`，写入以太网帧头。整个过程中，应用程序的数据内容**一次都没有被复制**，只是在同一块内存里前后移动了几个指针。反方向接收时，每一层调用 `skb_pull()` 后移 `data`，"跳过"已经处理完的头部，把剩余内容交给上层。这个零复制设计对网络性能的贡献是巨大的。

---

### 9.2 socket层：应用程序和内核的接口

应用程序通过 `socket()` 系统调用创建一个socket，通过 `connect()`、`send()`、`recv()` 等操作使用它。从内核的视角，一个socket由两个紧密配合的数据结构表示：面向用户空间的 `struct socket`，和面向协议栈的 `struct sock`。

这个两层设计不是偶然的。`struct socket` 是VFS的一部分——回忆第六节讲的"一切皆文件"，socket在内核里也是一个文件，有自己的 `file_operations`，可以用文件描述符操作。`struct sock` 则是协议相关的状态机，存储TCP连接的序列号、窗口大小、重传计时器等具体协议状态：

```c
// include/linux/net.h
// 面向 VFS 的 socket 表示
struct socket {
    socket_state        state;      // socket 的连接状态（未连接、连接中、已连接等）
    short               type;       // SOCK_STREAM（TCP）？SOCK_DGRAM（UDP）？
    const struct proto_ops *ops;    // socket 级别的操作函数表（多态！）
                                    // TCP 的 ops 和 UDP 的 ops 不同
    struct file         *file;      // 对应的 VFS file 对象
    struct sock         *sk;        // 指向协议层的 sock 结构
};

// include/net/sock.h
// 面向协议栈的 sock 表示（这是所有协议共享的基础部分）
struct sock {
    // ===== 接收和发送缓冲区 =====
    // 这两个队列是进程阻塞等待和被唤醒机制的核心
    struct sk_buff_head sk_receive_queue;   // 已接收、等待应用程序读取的数据包队列
    struct sk_buff_head sk_write_queue;     // 待发送的数据包队列

    // ===== 等待队列 =====
    // 应用程序在 recv() 里等待时，就挂在这个队列上
    // 第七节讲过等待队列的机制，这里是它在网络子系统里的应用
    wait_queue_head_t   sk_wq;  // 实际上是一个指针，这里简化了

    // ===== 回调函数 =====
    // 当接收队列有新数据时，协议栈调用这个回调
    // 它的实现就是 wake_up_interruptible()，唤醒等待的进程
    void (*sk_data_ready)(struct sock *sk);

    // ===== 协议状态 =====
    unsigned char       sk_state;   // TCP 状态机的当前状态
                                     // TCP_ESTABLISHED、TCP_CLOSE_WAIT 等
    int                 sk_rcvbuf;  // 接收缓冲区的最大大小（字节）
    int                 sk_sndbuf;  // 发送缓冲区的最大大小

    // ===== 私有协议数据 =====
    // TCP 的具体状态（序列号、窗口等）在 tcp_sock 里
    // tcp_sock 的第一个字段就是 struct sock，通过强制类型转换访问
};

// net/ipv4/tcp.h（tcp_sock 继承自 sock 的设计）
struct tcp_sock {
    struct sock         sk;     // 必须是第一个字段！
                                 // 这样 (struct sock *) 和 (struct tcp_sock *) 可以互相转换
    // TCP 特有的字段
    u32                 snd_nxt;    // 下一个要发送的序列号
    u32                 rcv_nxt;    // 期望收到的下一个序列号
    u32                 snd_una;    // 最早未被确认的序列号
    u32                 rcv_wnd;    // 接收窗口大小
    u32                 snd_cwnd;   // 拥塞窗口大小（拥塞控制的核心变量）
    // ... 还有大量字段
};
```

`tcp_sock` 的第一个字段是 `struct sock sk` 这个设计值得你仔细品味。这是C语言里模拟继承的经典手法：因为结构体的第一个字段和结构体本身有相同的起始地址，所以一个 `struct tcp_sock *` 可以被安全地转换成 `struct sock *`，反过来也可以。协议栈的通用代码只操作 `struct sock`，TCP特有的代码把指针转回 `struct tcp_sock *` 来访问TCP字段。你在内核里会大量看到 `tcp_sk(sk)` 这样的宏，它的实现就是 `(struct tcp_sock *)(sk)`。

---

### 9.3 数据包的接收路径：从网卡到应用程序

现在我们完整走一遍数据包的接收路径。这条路径在第八节里我们已经见过它的骨架，这里我们补充网络协议栈内部的细节。

网卡通过DMA把数据写入内存，触发中断，驱动的上半部调度 `NET_RX_SOFTIRQ`。软中断触发网卡驱动注册的NAPI poll函数。poll函数从DMA环形缓冲区里取出原始数据，用它构建一个 `sk_buff`，设置好 `data`、`tail`、`len` 等字段，然后调用 `netif_receive_skb()`，数据包正式进入协议栈：

```c
// net/core/dev.c
// 数据包从驱动进入协议栈的入口
int netif_receive_skb(struct sk_buff *skb)
{
    // 把时间戳打在数据包上（用于 SO_TIMESTAMP socket 选项）
    net_timestamp_check(netdev_tstamp_prequeue, skb);

    // 如果开启了 RPS（接收包转向），可能把包发给另一个 CPU 处理
    // 这是多核网络处理的负载均衡机制
    return netif_receive_skb_internal(skb);
}

// 根据以太网帧里的 EtherType 字段，分发给上层协议处理
// IPv4 的 EtherType 是 0x0800，IPv6 是 0x86DD
static int __netif_receive_skb_core(struct sk_buff *skb, bool pfmemalloc, ...)
{
    // 查找注册了这个协议类型的处理程序
    // deliver_skb 最终调用 ip_rcv()（对于 IPv4）
    list_for_each_entry_rcu(ptype, &ptype_base[ntohs(type) & PTYPE_HASH_MASK], list) {
        if (ptype->type == type) {
            deliver_skb(skb, ptype, orig_dev); // 分发给 IP 层
        }
```

IP层的 `ip_rcv()` 接手数据包，完成IP层的工作：验证IP头的校验和，检查目标IP是否是本机（如果不是，走路由转发逻辑），处理IP分片（如果数据包是分片的，等待所有分片到齐后重组），然后根据IP头里的协议字段（TCP=6，UDP=17）分发给传输层：

```c
// net/ipv4/ip_input.c（简化）
int ip_rcv(struct sk_buff *skb, struct net_device *dev, ...)
{
    struct iphdr *iph = ip_hdr(skb); // 读取IP头（data指针当前指向IP头）

    // 校验IP头的校验和
    if (ip_fast_csum((u8 *)iph, iph->ihl))
        goto csum_error;

    // 剥离IP头：调用 skb_pull 让 data 指针跳过IP头
    // 上层协议看到的 data 就直接是 TCP/UDP 头了
    skb_pull(skb, iph->ihl * 4);

    // 根据协议号分发给上层
    // inet_protos[IPPROTO_TCP] 指向 tcp_v4_rcv
    // inet_protos[IPPROTO_UDP] 指向 udp_rcv
    ret = INDIRECT_CALL_2(ipprot->handler,
                          tcp_v4_rcv, udp_rcv, skb);
    return ret;
}
```

TCP层的 `tcp_v4_rcv()` 是整个接收路径中最复杂的部分。它需要找到这个数据包属于哪个TCP连接（通过四元组：源IP、源端口、目标IP、目标端口在哈希表里查找对应的 `sock`），然后根据TCP状态机的当前状态决定怎么处理这个包：

```c
// net/ipv4/tcp_ipv4.c（大幅简化）
int tcp_v4_rcv(struct sk_buff *skb)
{
    struct tcphdr *th = tcp_hdr(skb); // 读取TCP头

    // 通过四元组查找对应的 sock
    // __inet_lookup 在哈希表里搜索，O(1) 平均复杂度
    sk = __inet_lookup_skb(&tcp_hashinfo, skb,
                            th->source, th->dest, sdif);
    if (!sk)
        goto no_tcp_socket; // 没有进程在监听这个端口，发送 RST

    // 把数据包交给 TCP 状态机处理
    // tcp_v4_do_rcv 根据 sk->sk_state（ESTABLISHED？SYN_RECV？等）
    // 决定处理逻辑
    tcp_v4_do_rcv(sk, skb);
}

// 对于已建立连接的数据包（最常见的情况）
int tcp_rcv_established(struct sock *sk, struct sk_buff *skb)
{
    // 快速路径：如果是有序的数据包（最常见情况），直接入队
    // 这个 if 判断是TCP接收的"快速路径优化"

    // 把数据放入 socket 的接收队列
    skb_queue_tail(&sk->sk_receive_queue, skb);

    // 发送 ACK（确认收到数据）
    __tcp_ack_snd_check(sk, 1);

    // 唤醒等待数据的进程！
    // 这就是第八节末尾链路里"唤醒进程"那一步的具体实现
    sk->sk_data_ready(sk); // 调用 sock_def_readable，内部调用 wake_up_interruptible
}
```

被唤醒的进程从 `schedule()` 返回，重新进入 `recv()` 的等待循环，发现接收队列里有数据了，调用 `tcp_recvmsg()` 把数据从 `sk_receive_queue` 里的 `sk_buff` 复制到用户空间的缓冲区，系统调用返回，应用程序拿到数据。

---

### 9.4 TCP拥塞控制：内核里的算法插件化

TCP拥塞控制是网络子系统里一个绝佳的"算法插件化"设计案例，值得单独讲一讲。TCP有多种拥塞控制算法：Cubic（Linux默认）、BBR（Google开发，现在也内置）、Reno、Vegas……不同的网络环境下，不同的算法有不同的表现。

内核把拥塞控制算法设计成可插拔的模块，通过一个函数指针表来实现，和VFS的 `file_operations` 思路完全一样：

```c
// include/net/tcp.h
struct tcp_congestion_ops {
    // 算法的名字（用于 sysctl 配置）
    char            name[TCP_CA_NAME_MAX];

    // 各种事件的回调函数
    // 新的ACK到来时调用——这是更新拥塞窗口的主要时机
    void (*cong_avoid)(struct sock *sk, u32 ack, u32 acked);

    // 检测到丢包时调用——需要降低发送速率
    u32  (*ssthresh)(struct sock *sk);

    // 离开拥塞恢复状态时调用
    void (*cong_control)(struct sock *sk, const struct rate_sample *rs);

    // 初始化和清理
    void (*init)(struct sock *sk);
    void (*release)(struct sock *sk);
};

// net/ipv4/tcp_cubic.c
// Cubic 算法的注册
static struct tcp_congestion_ops cubictcp __read_mostly = {
    .init           = bictcp_init,
    .ssthresh       = bictcp_recalc_ssthresh,
    .cong_avoid     = bictcp_cong_avoid,    // Cubic 的核心增长函数
    .cong_control   = cubictcp_cong_control,
    .owner          = THIS_MODULE,
    .name           = "cubic",
};
```

这个设计让你可以在运行中的系统上切换拥塞控制算法，甚至加载自己实现的算法作为内核模块，而不需要重新编译内核。在服务器上，运维人员可以对不同的 socket 连接使用不同的拥塞算法——视频流服务可能更适合BBR，而大批量数据传输可能更适合Cubic。

---

### 9.5 epoll：高并发网络编程的内核支撑

理解了socket和数据接收路径之后，我们来看一个应用层经常用到、但内核实现经常被忽视的机制——`epoll`。它是nginx、Redis、Node.js这类高并发服务器的基础，理解它的内核实现能帮你真正明白"为什么epoll比select快"这个问题。

`select` 和 `poll` 的问题在于：每次调用都需要把所有监听的文件描述符从用户空间拷贝到内核，内核遍历所有fd检查哪个有事件，把结果拷贝回用户空间。如果监听的fd有10000个，每次调用的开销就是O(10000)，无论有多少fd真正有事件。

`epoll` 的设计完全不同。它在内核里为每个 `epoll` 实例维护一个红黑树（存储所有被监听的fd）和一个链表（存储已经就绪的fd）。当某个 fd 有事件发生时（比如socket收到数据），内核直接把这个fd加入就绪链表——这个操作发生在数据到来的那一刻，是事件驱动的，而不是轮询的。`epoll_wait()` 只需要检查就绪链表，如果不空就直接返回，如果空就睡眠等待：

```c
// fs/eventpoll.c（简化）

// epoll_ctl(epfd, EPOLL_CTL_ADD, fd, event) 的内核处理
// 把一个 fd 加入 epoll 的监听红黑树
static int ep_insert(struct eventpoll *ep, const struct epoll_event *event,
                     struct file *tfile, int fd, int full_check)
{
    struct epitem *epi; // 红黑树节点，代表一个被监听的 fd

    // 分配 epitem，加入红黑树
    epi = kmem_cache_alloc(epi_cache, GFP_KERNEL);
    ep_rbtree_insert(ep, epi);

    // 关键步骤：向这个 fd 的等待队列注册一个回调函数
    // 当这个 fd 有事件时（比如 socket 收到数据调用 sk_data_ready）
    // 这个回调会被调用，把 epi 加入就绪链表并唤醒 epoll_wait
    init_waitqueue_func_entry(&epi->wait, ep_poll_callback);
    add_wait_queue(sk_sleep(tfile->private_data), &epi->wait);
}

// 当监听的 fd 有事件时，这个回调被调用
// （比如 socket 收到数据时，tcp_rcv_established 调用 sk_data_ready
//   sk_data_ready 遍历等待队列，调用这个回调）
static int ep_poll_callback(wait_queue_entry_t *wait, unsigned mode, int sync, void *key)
{
    struct epitem *epi = container_of(wait, struct epitem, wait);
    struct eventpoll *ep = epi->ep;

    // 把就绪的 epi 加入就绪链表
    list_add_tail(&epi->rdllink, &ep->rdllist);

    // 唤醒正在 epoll_wait 里睡眠的进程
    if (waitqueue_active(&ep->wq))
        wake_up_locked(&ep->wq);

    return 1;
}
```

这个设计的精妙之处在于：`epoll` 不需要轮询，它把"检测事件"的工作完全委托给了各个fd自己的事件通知机制。当数据到来时，协议栈调用 `sk_data_ready`，`sk_data_ready` 遍历socket的等待队列，发现里面有 `epoll` 注册的回调，就调用 `ep_poll_callback`，后者把这个fd放入就绪链表。`epoll_wait` 只需要从就绪链表取结果，复杂度是O(就绪的fd数)，而不是O(总fd数)。这就是为什么用了epoll之后，高并发服务器监听一万个连接和监听一千个连接的开销几乎没有差别——它只处理真正有事情发生的连接。

---

### 本节小结与思考练习

这一节我们沿着数据包的接收路径，把网络子系统的核心机制串联了起来。`sk_buff` 的四指针设计实现了协议头的零复制处理；`struct socket` 和 `struct sock` 的两层设计把VFS接口和协议实现干净地分离；TCP状态机在 `tcp_v4_rcv` 里处理数据包并更新状态；拥塞控制算法通过函数指针表实现了算法的可插拔；epoll通过事件回调而非轮询实现了高效的I/O多路复用。

这里有一个值得深入思考的问题把本节和前几节联系起来：我们说 `epoll` 的就绪链表里存储的是已经有事件的fd，`epoll_wait` 从这个链表取结果。但如果两个线程同时调用同一个 `epoll` 实例的 `epoll_wait`，并且同时有一个fd就绪，这两个线程会都收到这个事件（"惊群"），还是只有一个线程收到？内核是如何处理这个竞争的？（提示：在 `fs/eventpoll.c` 里搜索 `EPOLLEXCLUSIVE` 标志和 `ep_poll_callback` 里的唤醒逻辑，你会发现内核在这个问题上经历了一次重要的设计演进。）

---
