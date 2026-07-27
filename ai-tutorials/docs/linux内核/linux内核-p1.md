## Linux 内核教程

以之前的对话为基础，向我详细讲解剖析linux内核源代码

Relevant chats

我找到了你之前的学习记录。我们已经系统地讲完了操作系统原理的全部章节，并且在最后已经开始深入Linux内核的具体实现——讲到了 `task_struct`、`fork`/`clone` 的实现、CFS调度器等内容。

现在让我在那个基础上，更系统、更深入地带你**剖析Linux内核源代码**，把每一个核心子系统的数据结构和代码逻辑串联起来。

现在我们在此前已经掌握的 `task_struct`、`fork`/`clone`、CFS调度器基础上，做一次更系统深入的源代码剖析。我会带你逐步深入内核的核心数据结构和代码逻辑，让理论和实现真正融合起来。

---

## Linux内核源代码深度剖析

我们先用一张图来建立整体认知框架——内核各子系统之间的关系。

---

可以点击图中的任意子系统进一步深入。下面我们按照从核心到外围的顺序，逐一剖析。

---

### 一、进程管理：`task_struct` 的精髓与调度器源码

我们之前已经看过 `task_struct` 的基本结构。现在来深挖那些最重要的字段，并理解它们在源码中如何"活"起来。

#### 1.1 `task_struct` 中的调度核心：`sched_entity`

`task_struct` 里有一个至关重要的嵌套结构 `struct sched_entity se`，它是CFS调度器的"操作对象"。每个任务的虚拟运行时间（`vruntime`）就存在里面：

```c
// include/linux/sched.h
struct sched_entity {
    struct load_weight  load;        // 任务权重（由nice值换算而来）
    struct rb_node      run_node;    // 插入到红黑树的节点！
    u64                 vruntime;    // 虚拟运行时间——CFS调度的核心指标
    u64                 sum_exec_runtime; // 累计实际运行时间
    // ...
};
```

这里最关键的是 `rb_node run_node`。CFS调度器用一棵**红黑树**来组织所有就绪进程，`vruntime` 最小的进程节点在树的最左侧，调度器每次选中它运行。这就是CFS"完全公平"的实现本质——`vruntime` 落后最多的进程优先获得CPU。

#### 1.2 调度器选进程的源码路径

当内核需要选下一个运行的进程时，调用链是这样的：

```c
// kernel/sched/core.c
// 调度的总入口
void schedule(void) {
    struct task_struct *next, *prev;
    // 选出下一个要运行的任务
    next = pick_next_task(rq, prev, &rf);
    // 如果换了进程，执行上下文切换
    if (likely(prev != next))
        context_switch(rq, prev, next, &rf);
}

// kernel/sched/fair.c
// CFS的选择逻辑：找红黑树最左节点
static struct task_struct *pick_next_task_fair(struct rq *rq, ...) {
    struct sched_entity *se;
    // 取红黑树最左边的节点，即vruntime最小的进程
    se = pick_next_entity(cfs_rq, NULL);
    // 更新它的统计信息并返回
    return task_of(se);
}
```

你看，从原理到代码，CFS的核心就是这一句：**从红黑树取最左节点**。

#### 1.3 上下文切换的汇编层面

`context_switch` 最终会调用到体系结构相关的代码：

```c
// arch/x86/kernel/process_64.c
__visible __notrace_funcgraph struct task_struct *
__switch_to(struct task_struct *prev_p, struct task_struct *next_p) {
    // 1. 保存prev的FPU/SSE寄存器状态
    save_fpregs_to_fpstate(&prev->thread.fpu);

    // 2. 切换内核栈（通过TSS中的rsp0字段）
    update_task_stack(next_p);

    // 3. 切换TLS（线程本地存储段寄存器）
    load_TLS(next, cpu);

    // 4. 最关键：切换CR3寄存器（如果是不同进程）
    //    这一步会使TLB失效！
    switch_mm_irqs_off(prev->active_mm, next->mm, next_p);

    return prev_p;
}
```

这段代码直接对应我们课程里讲的"上下文切换开销"的来源：保存寄存器、切换页表（CR3）、TLB失效。

---

### 二、内存管理：从 `mm_struct` 到物理页的完整链路

内存管理子系统是内核里最复杂的部分之一。我们从数据结构到分配器，逐层往下走。

#### 2.1 地址空间的完整描述：`mm_struct` 和 `vm_area_struct`

每个进程的虚拟地址空间由 `mm_struct` 描述，而地址空间内的每一个连续"区域"（代码段、堆、栈、mmap的文件等）由 `vm_area_struct`（VMA）描述：

```c
// include/linux/mm_types.h
struct mm_struct {
    // 所有VMA组成一个红黑树和链表（双索引，各有用途）
    struct maple_tree   mm_mt;         // 内核6.x用maple tree替代了rb_tree

    unsigned long mmap_base;  // mmap区域的起始地址
    unsigned long start_code, end_code; // 代码段范围
    unsigned long start_data, end_data; // 数据段范围
    unsigned long start_brk,  brk;     // 堆的起始和当前末尾
    unsigned long start_stack;          // 栈的起始

    pgd_t *pgd;  // 页全局目录——页表的根！

    atomic_t mm_users;  // 共享此mm的用户数（同进程的线程）
    atomic_t mm_count;  // mm_struct本身的引用计数
};

// 每一个连续虚拟内存区域
struct vm_area_struct {
    unsigned long vm_start, vm_end; // 这个VMA的地址范围
    struct vm_area_struct *vm_next; // 链表串联所有VMA
    pgprot_t      vm_page_prot;     // 访问权限（读/写/执行）

    // 最关键的字段！定义了这片区域的操作
    const struct vm_operations_struct *vm_ops;
    // 如果是文件映射，指向对应文件
    struct file *vm_file;
    // ...
};
```

这里你要注意 `mm_users` 和 `mm_count` 的区别。`mm_users` 统计有多少线程在**使用**这个地址空间（`task_struct.mm` 指向它）；`mm_count` 是 `mm_struct` 本身的引用计数，防止过早释放。当同一进程的最后一个线程结束时，`mm_users` 归零，内核才开始真正释放这个地址空间。

#### 2.2 物理内存分配：伙伴系统源码

内核分配物理页用的是**伙伴系统（Buddy System）**，源码在 `mm/page_alloc.c`。每次分配 2n 个连续物理页：

```c
// mm/page_alloc.c
// 核心分配函数，order表示分配2^order个页
struct page *__alloc_pages(gfp_t gfp, unsigned int order, int preferred_nid, ...) {
    // 第一次尝试：从per-CPU缓存快速路径分配
    page = get_page_from_freelist(gfp, order, alloc_flags, &ac);
    if (likely(page))
        goto out;
    // 慢路径：内存不足时触发kswapd回收
    page = __alloc_pages_slowpath(gfp, order, &ac);
out:
    return page;
}

// 伙伴系统的核心：释放一个页时，尝试与其"伙伴"合并
static void __free_one_page(struct page *page, unsigned long pfn,
                            struct zone *zone, unsigned int order, ...) {
    while (order < MAX_ORDER - 1) {
        // 找到伙伴的物理页帧号
        unsigned long buddy_pfn = __find_buddy_pfn(pfn, order);
        struct page *buddy = page + (buddy_pfn - pfn);

        // 如果伙伴也是空闲的，合并为更大的块
        if (!page_is_buddy(page, buddy, order))
            goto done_merging;

        // 把伙伴从当前order的空闲链表里摘除
        del_page_from_free_list(buddy, zone, order);
        // 合并后提升到更高的order继续尝试合并
        order++;
    }
    // 把合并后的大块加入对应order的空闲链表
    add_to_free_list(page, zone, order, migratetype);
}
```

伙伴系统解决了**外部碎片**问题，但每次最少分配一个页（4KB），对于内核内部小对象的分配太浪费了。这就引出了下面的slab分配器。

#### 2.3 小对象分配：slab/slub分配器

内核对象（`task_struct`、`mm_struct`、`inode`等）都很小，用slab分配器从已分配的页中细分：

```c
// mm/slub.c（现代内核默认用slub）
// 创建一个slab缓存（比如为task_struct专门创建一个）
struct kmem_cache *task_struct_cachep =
    kmem_cache_create("task_struct",
                      sizeof(struct task_struct),
                      ARCH_MIN_TASKALIGN, // 对齐要求
                      SLAB_PANIC|SLAB_NOTRACK, // 标志
                      NULL);

// 从缓存分配一个对象
void *kmem_cache_alloc(struct kmem_cache *s, gfp_t gfpflags) {
    // 先从per-CPU的本地缓冲区取，不需要锁！
    void *object = slab_alloc(s, gfpflags, _RET_IP_);
    return object;
}
```

这里有一个设计精华值得你思考：slab分配器维护了一个**per-CPU的空闲对象链表**，同一个CPU分配和释放对象时完全不需要加锁，只有当本地缓冲区满/空时才去访问全局的slab池。这是一个典型的用"空间换时间、用局部性换并发性能"的设计。

---

### 三、VFS：让一切皆文件成为可能的核心机制

VFS的设计是Linux最优雅的架构之一。它定义了一套通用的文件操作接口，让ext4、NFS、procfs等所有文件系统都能"插"进来。

#### 3.1 四个核心对象

VFS由四个核心数据结构组成，它们的关系如下：

```c
// include/linux/fs.h

// 1. superblock：描述一个已挂载的文件系统实例
struct super_block {
    struct file_system_type *s_type; // 这是什么类型的文件系统
    const struct super_operations *s_op; // 文件系统级别的操作函数表
    unsigned long s_blocksize;       // 块大小
    // ...
};

// 2. inode：描述一个文件/目录的元数据（与文件名无关！）
struct inode {
    umode_t         i_mode;    // 文件类型和权限
    kuid_t          i_uid;     // 所有者
    loff_t          i_size;    // 文件大小
    struct timespec64 i_mtime; // 修改时间

    // 文件操作函数表——这是多态的关键！
    const struct inode_operations  *i_op;
    const struct file_operations   *i_fop;

    // 指向具体文件系统的私有数据
    // ext4的inode和btrfs的inode各自在这里存自己的数据
    void *i_private;
};

// 3. dentry：目录项，维护文件名和inode的映射
struct dentry {
    struct inode    *d_inode;     // 对应的inode
    struct dentry   *d_parent;    // 父目录的dentry
    struct qstr      d_name;      // 文件名（注意inode本身不存文件名）
    const struct dentry_operations *d_op;
    // dentry缓存（dcache）极大加速了路径查找
};

// 4. file：进程打开文件时创建，代表一次"打开"操作
struct file {
    struct path      f_path;    // 包含dentry和mount信息
    const struct file_operations *f_op; // 具体的读写操作
    loff_t           f_pos;    // 当前读写位置（每个进程独立）
    // ...
};
```

注意 `inode` 和 `dentry` 的分离设计——**文件名存在dentry里，文件内容的元数据存在inode里**。这就是为什么硬链接（hard link）能存在：多个dentry可以指向同一个inode，用 `i_nlink` 字段计数。

#### 3.2 `file_operations`：多态的实现

当你调用 `read(fd, buf, len)` 系统调用时，内核的路径是这样的：

```c
// fs/read_write.c
ssize_t ksys_read(unsigned int fd, char __user *buf, size_t count) {
    // 1. 根据fd找到struct file
    struct fd f = fdget_pos(fd);

    // 2. 调用file->f_op->read_iter（多态！）
    //    ext4文件调到ext4的实现
    //    socket文件调到网络栈的实现
    //    /proc/xxx调到对应proc的实现
    ret = vfs_read(f.file, buf, count, &f.file->f_pos);

    fdput_pos(f);
    return ret;
}

// 这就是为什么"一切皆文件"能成立的原因：
// 无论底层是什么，上层代码只看 file_operations 接口
struct file_operations ext4_file_operations = {
    .read_iter  = ext4_file_read_iter,   // ext4的读实现
    .write_iter = ext4_file_write_iter,  // ext4的写实现
    .mmap       = ext4_file_mmap,         // 内存映射
    .open       = ext4_file_open,
    // ...
};
```

这是一个教科书级别的面向对象设计——用C语言里的函数指针表实现了多态。每种文件系统、每种设备文件，都向VFS注册自己的 `file_operations`，而所有上层代码（包括用户程序的系统调用）都只通过统一接口访问。

---

### 四、中断子系统：从硬件信号到进程唤醒的全链路

中断是操作系统和硬件协作的核心机制，也是理解内核"被动响应"模式的关键。

#### 4.1 中断的两个半部：上半部与下半部

Linux处理中断的一个核心设计思想是**将中断处理拆分为两半**，以避免在中断上下文中执行耗时操作：

```c
// 上半部（hardirq）：在中断上下文执行，必须极快
// 只做最紧急的事：读走硬件数据、应答中断、唤醒下半部
static irqreturn_t e1000_intr(int irq, void *data) {
    struct e1000_adapter *adapter = data;
    // 读取网卡状态寄存器，应答中断
    icr = er32(ICR);
    // 把耗时的协议栈处理丢给软中断（下半部）
    napi_schedule(&adapter->napi);
    return IRQ_HANDLED;
}

// 下半部（softirq/NAPI）：在普通进程上下文执行，可以睡眠
// 完成真正的数据处理工作
static int e1000_clean(struct napi_struct *napi, int budget) {
    // 从DMA缓冲区读取数据包
    // 调用网络协议栈处理数据包
    // 可能最终唤醒等待数据的进程
    netif_receive_skb(skb);
}
```

Linux的下半部机制有三种，它们的使用场景各不相同。`softirq` 是最底层的、固定数量的软中断类型（网络收发、定时器、块设备等），运行在中断上下文，不能睡眠，执行优先级最高。`tasklet` 基于softirq实现，但每个tasklet同一时刻只能在一个CPU上运行，驱动程序常用它。`workqueue` 的工作函数在内核线程中执行，可以睡眠，是最灵活的选择。

#### 4.2 网卡收包如何最终唤醒等待进程

这个链路把中断、内存管理、进程调度串联在一起，是理解内核协作的绝佳案例：

```c
// 1. 网卡收到数据 → 触发硬件中断
//    e1000_intr()被调用 → 调度NAPI软中断

// 2. 软中断处理 → 数据包进入协议栈
//    netif_receive_skb() → ip_rcv() → tcp_rcv()

// 3. TCP层发现数据到达，把数据放入socket接收缓冲区
//    然后唤醒等待的进程
void tcp_data_ready(struct sock *sk) {
    // 找到等待这个socket的进程，唤醒它
    sk->sk_data_ready(sk);
    // 这最终调用 wake_up_interruptible()
    // 把阻塞在recv()上的进程从等待队列移到就绪队列
}

// 4. 被唤醒的进程重新进入就绪队列
//    CFS调度器在下次调度时选中它
//    进程从 recv() 系统调用返回，拿到数据
```

这个全链路——从物理信号到进程被唤醒——正是我们在课程里讲的"I/O完成，进程从阻塞态到就绪态"的具体实现。

---

### 五、内核同步：如何在多核上保证安全

内核代码运行在多个CPU上，必须保证对共享数据的访问是安全的。内核提供了一套完整的同步原语。

#### 5.1 从spinlock到mutex的选择逻辑

```c
// 自旋锁：适用于临界区极短、不能睡眠的场景（如中断处理器内）
spinlock_t lock;
spin_lock(&lock);   // 获取不到就忙等（spin）
// 极短的临界区
spin_unlock(&lock);

// 互斥量：适用于临界区可能较长、持有者可能睡眠的场景
struct mutex mtx;
mutex_lock(&mtx);   // 获取不到则进程睡眠
// 可以睡眠的临界区
mutex_unlock(&mtx);

// RCU（读-复制-更新）：读多写少场景的革命性方案
// 读者完全不加锁！
rcu_read_lock();
p = rcu_dereference(global_ptr); // 安全读取指针
// 使用 p...
rcu_read_unlock();

// 写者：先复制，修改副本，再原子替换指针
new_p = kmalloc(...);
*new_p = *old_p;
// 修改 new_p
rcu_assign_pointer(global_ptr, new_p); // 原子替换
// 等待所有旧读者退出后，释放 old_p
synchronize_rcu();
kfree(old_p);
```

RCU是Linux内核里最精妙的同步机制。它的核心洞察是：**读者不需要知道写者的存在，只要保证读者看到的指针始终指向一个完整有效的数据结构就够了**。在读者众多而写者极少的场景（如路由表、进程列表的遍历），RCU比传统锁快得多。

---

### 六、如何真正读内核源代码

理论和架构之后，你一定想知道怎么实际上手。

最好的方式是在本地构建一个可调试的内核环境。你可以用 `git clone https://github.com/torvalds/linux.git` 拿到完整源码，然后用 `make menuconfig` 配置内核，用 QEMU 启动，用 GDB 远程调试——这样你可以在 `schedule()`、`do_page_fault()`、`tcp_rcv()` 等关键函数上设断点，亲眼看到数据结构里的值在变化。

阅读源码时，推荐遵循这样的路径：先从一个**系统调用入口**开始（比如 `write`），在 `fs/read_write.c` 里找到 `ksys_write()`，然后顺着函数调用链往下追，每遇到一个数据结构就去 `include/linux/` 里找它的定义读一遍字段注释。这样"以调用链为线索、以数据结构为节点"的读法，比逐文件阅读要高效得多。

推荐的参考书是《深入理解Linux内核》（第三版，基于2.6内核）和《Linux内核设计与实现》（Robert Love著）。前者适合作为字典查阅细节，后者适合作为教材系统学习。网站 `https://elixir.bootlin.com/linux/latest/source` 提供了带交叉引用的在线源码浏览，查找某个函数或结构体在哪里定义、在哪里被调用非常方便。

---

你现在已经有了从原理到源码的完整地图。有哪个子系统想再深挖？

---

## Linux内核源代码剖析系列

### 第一节：内核是什么，源码怎么组织

在读任何一行内核代码之前，你需要先建立两个认知：**内核在计算机里处于什么位置**，以及**源码树长什么样子**。没有这两个基础，打开内核源码只会看到一片茫然的文件列表。

---

#### 1.1 内核在系统中的位置

一台运行中的Linux机器，从硬件到你的应用程序，可以分成清晰的几层。最底层是物理硬件——CPU、内存条、硬盘、网卡。往上一层是**内核**，它直接和硬件打交道，是唯一有权访问所有硬件资源的软件。再往上是**用户空间**，你写的程序、bash shell、浏览器，全部运行在这里。

内核和用户空间之间有一道严格的权限边界。用户程序无法直接操作硬件，也无法直接访问内核的内存，必须通过**系统调用（syscall）**这扇门来请求内核服务。比如你写 `open("file.txt", O_RDONLY)`，这不是直接打开文件——它触发了一次从用户态到内核态的切换，内核完成实际的文件操作后，再把控制权和结果还给你的程序。

这个边界在x86-64 CPU上通过特权级（ring 0内核态 vs ring 3用户态）来强制执行。内核运行在ring 0，拥有所有特权指令；用户程序运行在ring 3，越界访问会被CPU直接拦截，产生一个异常，由内核处理（通常是向进程发送SIGSEGV，也就是"段错误"的来源）。

---

#### 1.2 内核源码树的顶层结构

Linux内核的官方代码仓库在 `https://github.com/torvalds/linux`，目前（6.x版本）源码超过3000万行。但它的顶层目录结构非常清晰，每个目录都有明确的职责：

```
linux/
├── arch/          # 体系结构相关代码
│   ├── x86/       # x86/x86-64（你的PC和服务器）
│   ├── arm64/     # ARM 64位（手机、树莓派、苹果M系列）
│   └── riscv/     # RISC-V（新兴开源指令集）
│
├── kernel/        # 核心子系统
│   ├── sched/     # 进程调度器（CFS等）
│   ├── locking/   # 锁机制（spinlock、mutex、rwlock）
│   └── irq/       # 中断管理
│
├── mm/            # 内存管理（Memory Management）
│   ├── page_alloc.c   # 伙伴系统——物理页分配
│   ├── slub.c         # slab/slub分配器——小对象分配
│   └── mmap.c         # 虚拟内存映射
│
├── fs/            # 文件系统
│   ├── ext4/      # ext4文件系统实现
│   ├── proc/      # /proc虚拟文件系统
│   └── vfs_*.c    # VFS通用层
│
├── net/           # 网络协议栈
│   ├── ipv4/      # TCP/IP
│   └── core/      # 通用网络层（socket等）
│
├── drivers/       # 设备驱动程序（占内核代码约70%！）
│   ├── net/       # 网卡驱动
│   ├── block/     # 块设备驱动
│   └── gpu/       # 显卡驱动
│
├── include/       # 头文件（数据结构定义大多在这里）
│   └── linux/     # 核心头文件
│       ├── sched.h    # task_struct定义
│       ├── mm_types.h # mm_struct、page等定义
│       └── fs.h       # inode、file、super_block定义
│
├── init/          # 内核启动入口
│   └── main.c     # start_kernel()——内核的main函数
│
└── Documentation/ # 内核文档
```

有几个目录值得你特别记住。`include/linux/` 是数据结构的家——几乎所有重要的结构体都在这里定义，读代码遇到不认识的类型，第一反应就是来这里找。`arch/x86/` 包含了所有和x86硬件强相关的代码——中断向量表的初始化、上下文切换的汇编实现、页表操作——这些是"内核和硬件握手"的地方。`init/main.c` 里的 `start_kernel()` 是内核启动后执行的第一个C函数，相当于内核的 `main()`，是理解内核初始化顺序的入口。

---

#### 1.3 内核代码的两个"世界"

读内核源码时，有一个区分非常重要——**体系结构无关代码**和**体系结构相关代码**。

体系结构无关代码（在 `kernel/`、`mm/`、`fs/`、`net/` 等目录）是内核的"通用逻辑"，理论上在x86、ARM、RISC-V上行为一致，它们调用抽象接口，不直接操作硬件。体系结构相关代码（在 `arch/x86/`、`arch/arm64/` 等目录）是"适配层"，实现那些抽象接口，直接写CPU寄存器、操作MMU、处理中断向量表。

这个分层让内核可以相对容易地被移植到新硬件——你只需要实现 `arch/` 下的适配层，上层逻辑不需要动。

---

#### 1.4 读内核源码的第一个工具：在线交叉引用

在本地 `grep` 三千万行代码是痛苦的。推荐你现在就打开这个网站：

**[https://elixir.bootlin.com/linux/latest/source](https://elixir.bootlin.com/linux/latest/source)**

它提供了完整的内核源码浏览，最重要的是支持**交叉引用**——点击任意函数名或结构体名，可以立刻看到它在哪里定义、在哪些文件里被使用。这会是你读内核源码最常用的工具。

---

#### 本节小结

内核是用户程序和硬件之间唯一的中间层，通过特权级机制强制隔离。内核源码树按子系统划分目录，`include/linux/` 存放数据结构定义，`arch/` 存放硬件适配代码，`init/main.c` 是启动入口。读源码时，体系结构无关代码和体系结构相关代码的区分始终是一条重要的参考线。

---

## 第二节：内核启动流程——从 start_kernel() 到第一个用户进程

上一节我们建立了内核在系统中的位置感，也认识了源码树的结构。这一节我们来看内核是怎么"活起来"的——从通电到第一个用户进程诞生，这个过程里内核做了哪些事，代码路径是怎么走的。

理解启动流程有一个特别的价值：它是内核所有子系统**初始化顺序**的集中体现。你会看到内存管理比进程调度更早初始化，进程调度比文件系统更早初始化——这个顺序背后有严格的依赖逻辑。看懂了启动流程，就等于看懂了各子系统之间"谁依赖谁"的骨架。

---

### 2.1 在 `start_kernel()` 之前：引导加载器和解压

先花一点时间讲 `start_kernel()` 之前发生的事，因为很多人对这段过程有误解。

当你按下电源键，CPU从一个固定的物理地址开始执行BIOS/UEFI的代码。BIOS做完硬件自检后，把控制权交给**引导加载器**（通常是GRUB）。GRUB把压缩的内核镜像（`vmlinuz`）从磁盘加载到内存，然后调用内核的解压代码。

这个解压过程本身就是一段汇编程序，定义在 `arch/x86/boot/compressed/head_64.S`。它把压缩的内核原地解压，然后跳转到解压后内核的入口点 `startup_64`（在 `arch/x86/kernel/head_64.S`）。

这段汇编代码做的事情是：设置最初的页表（此时内存管理还没有初始化，但CPU已经需要虚拟地址了），切换到64位长模式，设置好内核栈指针，最后才跳转到第一个C函数。这个第一个C函数，就是 `start_kernel()`。

---

### 2.2 `start_kernel()`：内核的 `main` 函数

`start_kernel()` 定义在 `init/main.c`，是内核所有子系统初始化的总指挥。它本身是一个大约200行的函数，顺序调用各个子系统的初始化函数。我们来看它的骨架，理解每一步"为什么要在这个位置做"：

```c
// init/main.c
asmlinkage __visible void __init start_kernel(void)
{
    char *command_line;

    // ① 最早期的初始化：设置CPU、关中断
    // 此时内存管理、调度器都还不存在，能做的事极少
    set_task_stack_end_magic(&init_task); // 设置初始进程(pid=0)的栈哨兵
    smp_setup_processor_id();            // 识别当前是哪个CPU

    // ② 打印内核版本信息（就是你dmesg里看到的第一行）
    pr_notice("%s", linux_banner);

    // ③ 体系结构相关的早期初始化
    // 在x86上，这里会解析BIOS传来的内存布局信息（e820表）
    setup_arch(&command_line);

    // ④ 内存管理的第一阶段初始化
    // 此时真正的伙伴系统还没建立，用的是早期的"memblock"分配器
    mm_init();

    // ⑤ 调度器初始化
    // 注意：必须在内存可用之后才能初始化调度器
    // 因为调度器需要分配就绪队列等数据结构
    sched_init();

    // ⑥ 开中断！
    // 在这之前，所有代码都在关中断的环境下运行
    // 开中断意味着硬件可以打断内核执行了
    local_irq_enable();

    // ⑦ 其余子系统的初始化
    idr_init_cache();       // ID分配器
    rcu_init();             // RCU（读-复制-更新同步机制）
    init_IRQ();             // 中断控制器初始化
    tick_init();            // 时钟中断
    timekeeping_init();     // 内核时间管理
    time_init();            // 体系结构相关的时间初始化

    // ⑧ 文件系统、块设备等高层初始化（推迟到内核线程里做）
    // start_kernel()快结束时，会创建第一个内核线程来完成剩余工作
    arch_call_rest_init();  // 最终调用 rest_init()
}
```

请你特别注意这个初始化顺序背后的逻辑：内存管理（`mm_init()`）必须在调度器（`sched_init()`）之前，因为调度器需要分配内存来创建运行队列；中断（`local_irq_enable()`）必须在基本的内存和调度框架就绪之后才能打开，否则中断来了内核没有能力处理它。**每一步初始化都是在为下一步创造前提条件**，这是一条严格的依赖链。

---

### 2.3 早期内存分配：`memblock` 分配器

这里有一个很有意思的"鸡与蛋"问题值得你思考一下：内核在初始化伙伴系统（真正的内存分配器）之前，就需要分配内存——比如调度器要分配运行队列，中断子系统要分配描述符表。这怎么办？

Linux的解决方案是一个**两阶段内存分配**的设计。在伙伴系统就绪之前，用一个极其简单的分配器 `memblock` 来管理物理内存：

```c
// mm/memblock.c
// memblock的设计极其简单：
// 它维护两个数组——"可用内存区域"和"已保留区域"
// 分配内存就是从可用区域切一块，标记为已保留

// 早期分配内存的方式（在伙伴系统就绪前）
void * __init memblock_alloc(phys_addr_t size, phys_addr_t align)
{
    // 从记录的可用物理内存区域中，找到一块合适大小的
    // 标记为已使用，返回其虚拟地址
    // 这个函数没有free——早期分配的内存不会被释放
    return memblock_alloc_internal(size, align, 0, MEMBLOCK_ALLOC_ACCESSIBLE, 0);
}
```

`memblock` 设计得故意很简单——它只支持分配，不支持释放，因为内核启动阶段分配的核心数据结构是永久占用的。等伙伴系统初始化完成，`memblock` 会把所有未使用的内存"移交"给伙伴系统管理，它自己就退出历史舞台了。这是一个非常务实的设计：用一个简陋但够用的临时方案，解决初始化阶段的特殊需求。

---

### 2.4 `rest_init()`：第一个内核线程的诞生

`start_kernel()` 的最后，调用 `arch_call_rest_init()`，它最终调用 `rest_init()`。这是整个启动流程中最重要的一个时刻：

```c
// init/main.c
static noinline void __ref rest_init(void)
{
    struct task_struct *tsk;
    int pid;

    // 创建 pid=1 的内核线程，运行 kernel_init 函数
    // 这个线程最终会变成 init 进程（systemd/SysV init）
    pid = kernel_thread(kernel_init, NULL, CLONE_FS);

    // 创建 pid=2 的内核线程：kthreadd
    // 它是所有内核线程的"父亲"，负责创建其他内核线程
    pid = kernel_thread(kthreadd, NULL, CLONE_FS | CLONE_FILES);

    // rest_init() 本身运行在 pid=0 的上下文（idle进程）
    // 它接下来会变成每个CPU的idle线程
    // 当没有任何进程需要运行时，CPU就执行idle线程（本质上是HLT指令）
    cpu_startup_entry(CPUHP_ONLINE);
    // 执行到这里的代码永远不会返回
}
```

执行完这几行代码后，系统里已经有了三个"进程"：pid=0（idle线程，每个CPU一个），pid=1（即将成为init进程），pid=2（kthreadd，内核线程守护进程）。这是Linux进程家族树的起点。

---

### 2.5 `kernel_init()`：从内核线程到第一个用户进程

pid=1的内核线程运行 `kernel_init()` 函数。它负责完成剩余的初始化工作，最重要的是挂载根文件系统，然后完成一个质的跨越——**从内核线程变成用户空间进程**：

```c
// init/main.c
static int __ref kernel_init(void *unused)
{
    // 完成各种设备和驱动的初始化
    // 这里会触发大量驱动程序的probe，你在dmesg里看到的驱动加载信息大多来自这里
    kernel_init_freeable();

    // 尝试执行用户空间的init程序
    // 内核会依次尝试这几个路径，找到第一个能执行的
    if (ramdisk_execute_command) {
        ret = run_init_process(ramdisk_execute_command);
    }

    // 如果ramdisk里没有，就找硬盘上的
    if (!try_to_run_init_process("/sbin/init") ||
        !try_to_run_init_process("/etc/init")  ||
        !try_to_run_init_process("/bin/init")  ||
        !try_to_run_init_process("/bin/sh"))
        return 0;

    // 如果一个都找不到，内核panic
    panic("No working init found. "
          "Try passing init= option to kernel.");
}
```

`run_init_process()` 内部调用的是 `execve()` 系统调用——它把当前进程的地址空间**替换**为 `/sbin/init`（现代系统通常是 `systemd`）的地址空间。执行完 `execve()` 之后，这个进程就不再运行任何内核代码，而是完全在用户空间运行了。pid=1从此成为所有用户进程的祖先。

这个 `execve` 的瞬间是一条重要的分界线：内核侧的启动工作结束，用户空间的初始化（systemd启动各种服务）开始。

---

### 2.6 用一张时间线来整理全貌

把上面的过程串成一条时间线，会看得更清楚：

**通电** → BIOS/UEFI自检 → GRUB加载内核镜像 → 解压缩 → 汇编入口 `startup_64` → 第一个C函数 `start_kernel()` → 依次初始化：早期内存（memblock）→ 调度器 → 中断 → 时钟 → 伙伴系统/slab → `rest_init()` → 创建pid=1和pid=2 → pid=0变成idle线程 → pid=1执行 `kernel_init()` → 挂载根文件系统 → `execve("/sbin/init")` → **systemd接管，用户空间启动**

---

### 本节小结与一个思考题

这一节我们看到了内核启动的完整脉络：汇编入口设置基础环境，`start_kernel()` 按依赖顺序初始化所有子系统，`rest_init()` 创建pid=1和pid=2，最后 `execve` 把内核线程变成第一个用户进程。

留给你一个思考题：为什么pid=0（idle线程）不是通过 `fork` 或 `kernel_thread` 创建的，而是"天然存在"的？它的 `task_struct` 是怎么来的？

（提示：在源码里搜索 `init_task`，你会在 `init/init_task.c` 里找到答案——它是一个编译期静态初始化的全局变量，不需要动态分配。）

---
