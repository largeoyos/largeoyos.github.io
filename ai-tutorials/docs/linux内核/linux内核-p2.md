## 第三节：进程管理——深入 task_struct

上一节我们看到，`rest_init()` 调用 `kernel_thread()` 创建了pid=1和pid=2。这个"创建进程"的动作，在内核里的本质是什么？答案是：**分配并填充一个 `task_struct` 结构体**。理解了 `task_struct`，你就理解了Linux对"进程"这个概念的完整定义。

这一节我们不会试图读完 `task_struct` 的所有字段（它有几百个），而是挑出最关键的几组字段，深入理解它们的设计动机和相互关系。这种"抓主干"的读法，正是阅读内核源码的正确姿势。

---

### 3.1 `task_struct` 是什么，在哪里

`task_struct` 定义在 `include/linux/sched.h`，是内核里最大、最复杂的数据结构之一。在现代内核（6.x）里，它大约有700多行定义。

在开始看字段之前，先建立一个直觉：**`task_struct` 就是内核对一个执行流的完整描述**。它同时描述进程和线程——Linux内核在实现层面不区分这两个概念，统一称为"任务（task）"。两个 `task_struct` 共享同一个 `mm_struct`（地址空间），它们就是线程关系；各自拥有独立的 `mm_struct`，它们就是进程关系。这个设计的优雅之处在于，进程和线程的区别只是"共享程度"的不同，而不是本质上不同的东西。

---

### 3.2 第一组：状态字段

```c
// include/linux/sched.h
struct task_struct {
    // 进程的当前运行状态
    // 用 volatile 修饰，因为它可能被中断处理程序修改
    // 编译器不能把它缓存在寄存器里，每次必须从内存读
    volatile long    state;

    // 退出状态：进程退出时记录原因
    int              exit_state;
};
```

`state` 字段的可能取值，就是我们课程里讲的进程状态机在代码里的体现：

```c
// include/linux/sched.h
#define TASK_RUNNING            0x0000  // 正在CPU上运行，或在就绪队列里等待
#define TASK_INTERRUPTIBLE      0x0001  // 可中断的睡眠（等待事件，可被信号唤醒）
#define TASK_UNINTERRUPTIBLE    0x0002  // 不可中断的睡眠（等待事件，信号也不能打断）
#define TASK_ZOMBIE             0x0020  // 已退出，等待父进程收尸
```

这里有一个非常值得思考的地方：为什么要区分 `TASK_INTERRUPTIBLE` 和 `TASK_UNINTERRUPTIBLE`？

想象一个进程正在等待磁盘I/O完成。如果此时你按下Ctrl+C，内核应该把信号发给这个进程吗？如果进程正在一次不可分割的磁盘写操作中途被打断，数据可能损坏。所以内核提供了 `TASK_UNINTERRUPTIBLE` 状态——处于这个状态的进程，就算收到信号也不会响应，必须等待它等的那件事完成才会醒来。你在 `ps` 命令的输出里偶尔看到状态为 `D` 的进程（D = uninterruptible sleep），就是处于这个状态，通常是在等待一个"卡住"的I/O操作，这也是系统"卡死"时的常见原因。

---

### 3.3 第二组：标识字段

```c
struct task_struct {
    pid_t    pid;   // 进程ID——每个task_struct独有
    pid_t    tgid;  // 线程组ID（Thread Group ID）
};
```

`pid` 和 `tgid` 的关系是理解Linux线程模型的钥匙。当你创建一个进程（fork），新进程的 `pid` 和 `tgid` 相等，都是内核分配的新号码。当这个进程创建线程（pthread_create），每个线程有自己独立的 `pid`（内核视角），但所有线程的 `tgid` 都等于主线程的 `pid`。

这就是为什么在用户空间，`getpid()` 返回的是 `tgid`——对用户来说，同一个进程的所有线程应该有相同的"进程号"。但 `gettid()` 返回的是 `pid`，可以区分线程。你可以在终端里运行 `ps -eLf`，会看到同一个进程的多个线程，它们的PID（内核的pid）各不相同，但TGID相同。

---

### 3.4 第三组：内存管理字段——进程与线程差异的实现核心

```c
struct task_struct {
    struct mm_struct    *mm;        // 进程的用户空间地址空间描述符
    struct mm_struct    *active_mm; // 内核线程使用的mm（借用其他进程的）
};
```

这两个指针是整个进程/线程区分机制最核心的实现。规则非常简单：如果两个 `task_struct` 的 `mm` 指针指向**同一个** `mm_struct`，它们就是同一个进程里的两个线程；如果指向不同的 `mm_struct`，它们就是两个独立的进程。

`active_mm` 则是为内核线程设计的。内核线程（比如kthreadd、kworker这些）不需要用户空间地址，所以它们的 `mm` 是 `NULL`。但CPU的页表寄存器（CR3）总是需要指向某个页表，所以当内核线程运行时，它会"借用"上一个运行的用户进程的 `mm_struct`，存放在 `active_mm` 里。这是一个节省TLB刷新开销的优化——既然内核线程不访问用户空间，保留上一个进程的页表设置完全无害。

---

### 3.5 第四组：调度字段——CFS的操作对象

```c
struct task_struct {
    int                  prio;          // 动态优先级（调度器实际使用）
    int                  static_prio;   // 静态优先级（由nice值决定，用户可设置）
    int                  normal_prio;   // 归一化优先级

    const struct sched_class    *sched_class;  // 使用哪种调度策略
    struct sched_entity          se;           // CFS调度器的调度实体
    struct sched_rt_entity       rt;           // 实时调度器的调度实体
};
```

`sched_class` 是一个函数指针表，指向 `fair_sched_class`（CFS，普通进程）或 `rt_sched_class`（实时进程）或 `idle_sched_class`（idle线程）。这是一个和VFS的 `file_operations` 一样的多态设计——调度器的选进程、入队、出队等操作，通过函数指针表来分发，无需在代码里写大量的 `if/else`。

`sched_entity se` 是CFS调度器操作的具体对象，最重要的字段是 `vruntime`（虚拟运行时间）。每个进程的 `vruntime` 随它在CPU上运行而增长，CFS总是选 `vruntime` 最小的进程运行，这就保证了"公平"——落后最多的进程优先获得CPU。

---

### 3.6 第五组：家族关系字段——进程树的实现

```c
struct task_struct {
    struct task_struct __rcu    *real_parent; // 真正的父进程
    struct task_struct __rcu    *parent;      // 当前父进程（可能被ptrace改变）
    struct list_head             children;    // 子进程链表的头
    struct list_head             sibling;     // 挂入父进程children链表的节点
};
```

这几个字段构成了Linux进程树（process tree）的实现。`children` 是一个链表头，父进程通过它串联所有子进程；`sibling` 是子进程挂入父进程链表的节点。这种用 `list_head` 实现的侵入式链表是Linux内核里随处可见的惯用法，我们在第七节讲内核数据结构时会深入研究它。

`real_parent` 和 `parent` 的区别和 `ptrace`（调试器使用的系统调用）有关。正常情况下两者相同。当你用 `gdb` 调试一个进程时，被调试进程的 `parent` 会被改成 `gdb` 进程的 `task_struct`，但 `real_parent` 仍然指向原来的父进程。

---

### 3.7 第六组：文件系统字段——共享的和独占的

```c
struct task_struct {
    struct fs_struct        *fs;    // 文件系统信息（当前目录、根目录）
    struct files_struct     *files; // 打开的文件描述符表
};
```

这两个字段在 `fork` 和 `clone` 时的行为，解释了进程和线程在文件系统层面的差异。当 `fork` 创建子进程时，子进程会得到 `files` 的一份**副本**，之后父子进程各自管理自己的文件描述符，互不影响。当 `clone` 携带 `CLONE_FILES` 标志（创建线程时）时，新线程和原线程**共享同一个** `files_struct`，一个线程打开的文件，另一个线程立刻就能用同一个fd访问——这正是线程的预期行为。

理解这一点后，你会对下面这个常见问题有更清晰的认识：为什么多线程程序中，一个线程关闭了fd，其他线程立即就访问不到了？因为它们共享的是同一个 `files_struct`，fd关闭是对共享数据的修改，对所有线程立即可见。

---

### 3.8 把所有字段关联起来：`fork` 时发生了什么

现在你认识了这些字段，我们来把它们串联起来，看 `fork` 系统调用的核心逻辑，你会发现每一步都对应着上面某组字段的处理：

```c
// kernel/fork.c
// fork、vfork、clone 最终都调用这个函数
static struct task_struct *copy_process(
    struct pid *pid,
    unsigned long clone_flags, ...)
{
    struct task_struct *p;

    // 第一步：分配新的 task_struct
    // 注意：task_struct 从专用的 slab 缓存分配，速度极快
    p = dup_task_struct(current, node);

    // 第二步：根据 clone_flags 决定如何处理地址空间
    // CLONE_VM 标志：共享 mm_struct（创建线程）
    // 无此标志：复制 mm_struct（创建进程，COW优化）
    retval = copy_mm(clone_flags, p);

    // 第三步：处理文件描述符表
    // CLONE_FILES 标志：共享 files_struct
    // 无此标志：复制一份新的
    retval = copy_files(clone_flags, p);

    // 第四步：设置调度信息
    // 新进程继承父进程的优先级，vruntime做特殊处理
    // （不能从0开始，否则会长期霸占CPU）
    sched_fork(clone_flags, p);

    // 第五步：建立家族关系
    // 设置 p->parent, p->real_parent
    // 把 p 加入父进程的 children 链表
    copy_process_set_tid(p, ...);

    // 第六步：分配新的 PID，设置 p->pid 和 p->tgid
    // 如果是线程（CLONE_THREAD），tgid = 父线程的 tgid
    // 如果是进程，tgid = 新分配的 pid
    ...

    return p;
}
```

你看，`copy_process` 做的事情，就是针对 `task_struct` 里的每一组字段，根据 `clone_flags` 决定是"复制"还是"共享引用"。进程创建是"大量复制，少量共享"；线程创建是"大量共享，少量复制（主要是栈和寄存器状态）"。**同一个函数，不同的标志，产生出进程和线程这两种截然不同的抽象**——这是Linux内核设计中我最欣赏的几个地方之一。

---

### 本节小结与思考练习

这一节我们沿着 `task_struct` 的六组关键字段，建立了内核对"进程"这个抽象的完整认识。状态字段决定进程在调度器眼里是否可运行；`mm` 指针决定进程和线程的本质区别；调度字段是CFS公平性的数据基础；家族字段构成了进程树的骨架；文件字段决定了资源共享的边界。

这里有一个很好的思考练习：当一个进程调用 `fork()` 之后，父进程和子进程都从 `fork()` 返回，它们的 `task_struct` 中的 `state` 字段值是多少？为什么两个进程都能立即运行，而不需要显式地被"唤醒"？（提示：回看 `copy_process` 里的 `sched_fork()` 调用，以及 `TASK_RUNNING` 的含义。）

---

## 第四节：调度器——CFS、vruntime 与上下文切换

上一节我们看到 `task_struct` 里有一个 `sched_entity se` 字段，它是CFS调度器的操作对象，里面存着 `vruntime`。这一节我们把调度器这个主题完整地打开：CFS的设计思想是什么，`vruntime` 怎么计算，红黑树怎么组织就绪进程，以及当调度真正发生时，CPU经历了哪些步骤才从一个进程切换到另一个进程。

理解调度器有一个很好的切入角度：**把它想象成一个需要同时服务很多客人的餐厅**。客人有的点了简单的套餐（I/O密集型进程，吃一点就走），有的点了复杂的大餐（CPU密集型进程，要占用很长时间）。餐厅的目标是让所有客人都觉得被公平对待，而不是谁先来谁就一直占着服务员。CFS（Completely Fair Scheduler，完全公平调度器）就是Linux为这个问题给出的答案。

---

### 4.1 CFS的核心思想：虚拟时钟

CFS的设计目标是模拟一台"理想的多任务处理器"——如果系统里有N个进程，每个进程都应该同时获得 1/N 的CPU时间。当然真实的CPU一次只能运行一个进程，所以CFS用一种叫做**虚拟运行时间（vruntime）**的机制来近似这个理想。

`vruntime` 的核心思想是：**记录每个进程"已经享受了多少CPU时间"，然后总是把CPU给享受最少的那个进程**。如果所有进程权重相同，这就是严格的公平轮转。如果有优先级差异（通过nice值设置），权重高的进程的 `vruntime` 增长得慢一些，这样它在红黑树里的位置就会更靠左，更容易被选中，从而在单位物理时间内获得更多CPU时间。

这个设计的精妙之处在于，它把"优先级"这个离散的概念，转化成了 `vruntime` 增长速率这个连续的概念，用一套统一的机制同时解决了公平性和优先级两个问题。

---

### 4.2 `vruntime` 的计算：权重如何影响增长速率

我们来看具体的计算方式。每次进程在CPU上运行了一段实际时间 `delta_exec`，内核会更新它的 `vruntime`：

```c
// kernel/sched/fair.c
static void update_curr(struct cfs_rq *cfs_rq)
{
    struct sched_entity *curr = cfs_rq->curr;
    u64 now = rq_clock_task(rq_of(cfs_rq));

    // 计算这次调度周期内实际运行的时间
    u64 delta_exec = now - curr->exec_start;

    // 核心公式：vruntime 增量 = 实际时间 × (NICE_0_LOAD / 进程权重)
    // NICE_0_LOAD 是 nice=0 时的标准权重（值为1024）
    // 权重越大（优先级越高），vruntime 增长越慢
    // 权重越小（优先级越低），vruntime 增长越快
    curr->vruntime += calc_delta_fair(delta_exec, curr);

    // 更新 CFS 运行队列的 min_vruntime
    // min_vruntime 是红黑树最左节点的 vruntime，单调递增
    update_min_vruntime(cfs_rq);
}
```

我们来用数字感受一下这个公式的效果。假设系统里有两个进程，A的nice值是0（权重1024），B的nice值是-5（权重3121，优先级更高）。当它们各自在CPU上运行了10ms之后，A的 `vruntime` 增加了 `10ms × (1024/1024) = 10ms`，而B的 `vruntime` 只增加了 `10ms × (1024/3121) ≈ 3.3ms`。结果是B的 `vruntime` 远小于A，下次调度时B更容易被选中——这正是"优先级高的进程获得更多CPU时间"的实现机制。

---

### 4.3 红黑树：就绪队列的数据结构

所有处于 `TASK_RUNNING` 状态（就绪或运行中）的进程，按 `vruntime` 为键值组织在一棵**红黑树**里。这棵树存储在 `struct cfs_rq`（CFS运行队列）中：

```c
// kernel/sched/sched.h
struct cfs_rq {
    // 红黑树的根
    struct rb_root_cached   tasks_timeline;
    // 缓存了最左节点（vruntime最小的进程），避免每次遍历
    // 这是一个重要的性能优化：选进程只需O(1)
    struct sched_entity     *curr;           // 当前正在运行的实体
    u64                     min_vruntime;    // 当前最小的vruntime
};
```

为什么选择红黑树而不是其他数据结构？这个选择背后有清晰的工程权衡。选进程（找最左节点）是调度器最频繁的操作，必须极快，理想情况是O(1)。通过缓存最左节点，红黑树确实做到了O(1)的选进程。进程入队和出队的操作需要维护树的有序性，红黑树保证O(log N)。相比之下，简单的有序链表虽然查找最小值是O(1)，但插入是O(N)，在进程数多时代价太高；堆的插入和删除是O(log N)，但不支持高效的按键值搜索。红黑树是这些约束下最均衡的选择。

---

### 4.4 调度的触发：什么时候会发生进程切换

进程切换不是随时随地发生的，它有明确的触发时机，理解这些时机能帮你看懂内核里很多"为什么要在这里设置调度标志"的代码。

最常见的触发时机是**时钟中断**。内核配置了一个周期性的定时器中断（通常是1ms一次，即HZ=1000），每次中断到来时，内核会检查当前进程是否已经运行了足够长的时间，如果是，就设置一个"需要重新调度"的标志：

```c
// kernel/sched/fair.c
// 时钟中断的处理路径会调用到这里
static void check_preempt_tick(struct cfs_rq *cfs_rq, struct sched_entity *curr)
{
    unsigned long ideal_runtime, delta_exec;

    // 计算当前进程"理想上"应该运行多长时间
    // （根据系统中进程数量和优先级动态计算）
    ideal_runtime = sched_slice(cfs_rq, curr);

    // 当前进程实际运行的时间
    delta_exec = curr->sum_exec_runtime - curr->prev_sum_exec_runtime;

    // 如果超时，设置抢占标志
    // 注意：这里不直接切换，只是设一个标志
    // 真正的切换发生在从中断返回用户空间的路径上
    if (delta_exec > ideal_runtime)
        resched_curr(rq_of(cfs_rq)); // 设置 TIF_NEED_RESCHED 标志
}
```

另一个重要的触发时机是**进程主动睡眠**，比如调用 `read()` 等待I/O，或调用 `mutex_lock()` 等待锁。这时进程把自己的状态从 `TASK_RUNNING` 改为 `TASK_INTERRUPTIBLE`，然后调用 `schedule()` 主动让出CPU。还有就是**高优先级进程被唤醒**时，如果新唤醒进程的 `vruntime` 远小于当前运行进程，内核也会设置抢占标志，在合适的时机切换过去。

---

### 4.5 `schedule()`：调度器的核心函数

无论哪种触发方式，最终都会走到 `schedule()` 函数。这是内核里被调用最频繁的函数之一：

```c
// kernel/sched/core.c
asmlinkage __visible void __sched schedule(void)
{
    struct task_struct *tsk = current; // 当前进程

    // 如果进程持有锁却调用schedule，这是一个bug
    // 内核在调试模式下会在这里检查
    sched_submit_work(tsk);

    do {
        preempt_disable(); // 关闭内核抢占，进入临界区
        __schedule(SM_NONE);
        sched_preempt_enable_no_resched();
    } while (need_resched()); // 如果返回后仍需调度，继续循环
}

// __schedule 是真正的调度逻辑
static void __sched notrace __schedule(unsigned int sched_mode)
{
    struct task_struct *prev, *next;
    struct rq *rq; // 当前CPU的运行队列

    // 第一步：选出下一个要运行的进程
    // pick_next_task 会根据调度类（CFS/RT/idle）选择
    // 对于CFS，就是取红黑树最左边的节点
    next = pick_next_task(rq, prev, &rf);

    // 如果选出的还是当前进程，不需要切换，直接返回
    if (likely(prev != next)) {
        // 第二步：更新统计信息
        rq->nr_switches++;

        // 第三步：执行真正的上下文切换
        // 这是整个调度器里最"魔法"的一步
        // 调用完这行之后，CPU就在运行next进程了
        // prev进程会在它下次被调度时，从这行的"下一行"继续执行
        rq = context_switch(rq, prev, next, &rf);
    }
```

`context_switch()` 这行代码之后的注释值得你仔细思考一下。`prev` 进程调用 `context_switch()`，但从这个函数"返回"的时候，已经是另一个时间点了——可能是几毫秒后，也可能是几秒后，取决于 `prev` 何时再次被调度到。这种"在一个地方消失，在同一个地方重新出现"的感觉，是进程切换最迷人也最难理解的地方。

---

### 4.6 `context_switch()`：上下文切换的三个层次

`context_switch()` 做的事情可以分成三个层次，每个层次负责切换不同类型的"状态"：

```c
// kernel/sched/core.c
static __always_inline struct rq *
context_switch(struct rq *rq, struct task_struct *prev,
               struct task_struct *next, struct rq_flags *rf)
{
    // 第一层：切换内存地址空间
    // 如果是不同进程（mm不同），需要切换页表
    // 这会更新CR3寄存器，导致TLB失效——这是最昂贵的开销
    // 如果是同进程的线程，mm相同，跳过这步，这就是线程切换比进程切换快的原因
    if (!next->mm) {
        // next是内核线程，借用prev的mm
        next->active_mm = prev->active_mm;
    } else {
        // next是用户进程，切换到它的地址空间
        switch_mm_irqs_off(prev->active_mm, next->mm, next);
    }

    // 第二层和第三层都在 switch_to() 宏里完成
    // switch_to 是体系结构相关的，x86的实现在汇编里
    switch_to(prev, next, prev);
    // 注意：执行到这里时，已经是在 next 进程的上下文里了
    // 而且这里的 prev 实际上是 next 上次被切走时保存的"prev"
    // 这里的变量语义发生了"魔法般的"转换

    return finish_task_switch(prev);
}
```

`switch_to()` 宏展开后是x86汇编代码，负责保存当前进程的寄存器状态，并恢复下一个进程的寄存器状态：

```c
// arch/x86/include/asm/switch_to.h
// 简化版，展示核心逻辑
#define switch_to(prev, next, last)                     \
do {                                                    \
    /* 把当前的栈指针(RSP)保存到 prev->thread.sp */      \
    /* 把 next->thread.sp 加载到 RSP */                  \
    /* 从这一刻起，CPU使用的是next进程的内核栈 */          \
    /* 然后通过 ret 指令跳转到 next 进程上次被切走时       \
       保存在栈上的返回地址，继续它的执行 */               \
    asm volatile(                                       \
        "pushq %%rbp\n\t"        /* 保存prev的帧指针 */  \
        "movq %%rsp,%[prev_sp]\n\t" /* 保存prev的栈指针 */\
        "movq %[next_sp],%%rsp\n\t" /* 切换到next的栈 */ \
        "movq $1f,%[prev_ip]\n\t"  /* 保存prev的返回点 */\
        "pushq %[next_ip]\n\t"     /* 压入next的返回点 */\
        "jmp __switch_to\n\t"      /* 跳转完成切换 */    \
        "1:\n\t"                   /* prev下次从这里恢复 */\
        "popq %%rbp\n\t"                                \
        ...                                             \
    );                                                  \
} while (0)
```

这段汇编做的事情用直白的语言描述是：把prev的"断点"（下次恢复执行的地址和栈状态）打包保存起来，然后把next上次被打包保存的"断点"恢复出来，CPU就自然地从next上次停下的地方继续运行了。这就是"上下文"这个词的字面含义——执行的上下文，包括栈、寄存器、程序计数器，完整地被保存和恢复。

---

### 4.7 一次完整调度的全景

把上面所有内容串联起来，一次完整的进程切换是这样发生的。时钟中断触发，`check_preempt_tick()` 发现当前进程A已经运行超时，调用 `resched_curr()` 在A的 `task_struct` 里设置 `TIF_NEED_RESCHED` 标志。中断返回路径上，内核检查到这个标志，调用 `schedule()`。`schedule()` 调用 `pick_next_task()`，从红黑树的最左节点取出 `vruntime` 最小的进程B。`context_switch()` 先切换地址空间（如果A和B是不同进程），再执行 `switch_to()` 切换内核栈和寄存器。CPU从此在B的内核栈上继续执行，B从它上次调用 `schedule()` 的地方恢复——就好像它只是"睡了一觉"，什么都没发生过。

---

### 本节小结与思考练习

CFS用 `vruntime` 把优先级和公平性统一成一个度量，用红黑树高效地找到最需要运行的进程，用 `switch_to()` 的汇编魔法完成实际的切换。整个系统设计得非常精巧：每一个选择——为什么用红黑树、为什么要有 `min_vruntime`、为什么 `context_switch` 之后变量的语义会"移位"——都有清晰的工程动机。

这里有一个值得深入思考的问题：新创建的进程，它的初始 `vruntime` 应该设置为多少？如果设为0，它的 `vruntime` 比所有现有进程都小，会立刻抢占CPU并长期霸占，破坏公平性。如果设为当前的 `min_vruntime`，它获得的机会和已经运行了一段时间的进程一样多，看起来公平，但对于一个全新的进程来说又稍显"慷慨"。Linux内核实际上选择了后者，并加了一点额外的惩罚偏移量。你可以在 `kernel/sched/fair.c` 里找到 `place_entity()` 函数，看看内核是怎么处理这个边界情况的。

---
