## 第五节：内存管理——从虚拟地址到物理地址的完整链路

上一节我们看到，`context_switch()` 在切换进程时会更新CR3寄存器，这一步切换了页表，让CPU"看到"新进程的地址空间。但我们没有深入回答：页表到底是什么？一个虚拟地址是怎么一步步变成物理地址的？当这个转换失败时（缺页中断）内核又做了什么？这一节我们把内存管理这个主题完整地打开。

内存管理是内核里最难理解的子系统之一，原因不是代码复杂，而是它同时涉及软件（内核数据结构）和硬件（MMU、TLB、DRAM）两个层面，两者必须紧密配合才能工作。学习时最好的策略是先建立硬件层面的"地址翻译"模型，再来看内核的软件数据结构如何与之对应。

---

### 5.1 为什么需要虚拟地址：三个根本原因

在看实现之前，先确保我们对"为什么要有虚拟内存"有直觉。

第一个原因是**隔离**。如果所有进程直接用物理地址，进程A可以随意读写进程B的数据，操作系统无法保证安全。虚拟地址空间让每个进程都以为自己独占了全部内存，实际上每个进程只能访问内核为它建立了映射的那些物理页。

第二个原因是**超额使用（overcommit）**。64位系统的虚拟地址空间是128TB，物理内存可能只有16GB。内核允许进程申请比物理内存更多的虚拟空间，因为申请的内存不一定会被全部使用。只有当进程真正访问某个页时，内核才分配对应的物理页。这就是"懒分配"策略，极大提高了内存利用率。

第三个原因是**连续性的幻觉**。物理内存可能由于长期分配释放变得碎片化，找一块大的连续物理内存很难。但通过页表，内核可以把若干个不连续的物理页，映射成进程眼里一块连续的虚拟地址空间。进程不需要知道底层的物理布局。

---

### 5.2 硬件基础：四级页表与地址翻译

x86-64架构使用四级页表结构。一个64位虚拟地址（实际只用了48位）被拆分成五个部分，每个部分是一个索引：

```
虚拟地址的48位分解（从高到低）：
┌─────────┬─────────┬─────────┬─────────┬────────────────┐
│  9位    │  9位    │  9位    │  9位    │    12位        │
│ PGD索引 │ PUD索引 │ PMD索引 │ PTE索引 │  页内偏移量    │
└─────────┴─────────┴─────────┴─────────┴────────────────┘
  (L4)      (L3)      (L2)      (L1)      (offset)
```

翻译过程是一个四级查表的过程，硬件MMU自动完成：从CR3寄存器拿到PGD（页全局目录）的物理地址，用虚拟地址的最高9位作为索引，查到PUD的地址；再用下一个9位查PUD，得到PMD的地址；继续查PMD得到PTE（页表项）的地址；最后从PTE里取出物理页帧号，加上12位页内偏移量，得到最终的物理地址。

这四级查表每次都是一次内存访问，总共四次，开销很大。这就是TLB（Translation Lookaside Buffer）存在的原因——它是CPU内部的一个小型高速缓存，存储最近使用过的虚拟到物理地址映射。大多数内存访问都能在TLB里命中，根本不需要走四级页表。但当进程切换时，新进程的映射和旧进程完全不同，TLB里缓存的内容都失效了，这就是第四节提到的"TLB失效"开销的根源。

---

### 5.3 内核的页表数据结构

内核用C语言的类型系统来表达这四级页表。每一级的表项都有对应的类型：

```c
// arch/x86/include/asm/pgtable_types.h

// 每一级页表项的类型定义
// 虽然本质都是64位整数，但用不同类型可以让编译器帮助检查"用错了哪级"
typedef struct { pgdval_t pgd; } pgd_t;  // 第四级（顶级）页表项
typedef struct { pudval_t pud; } pud_t;  // 第三级
typedef struct { pmdval_t pmd; } pmd_t;  // 第二级
typedef struct { pteval_t pte; } pte_t;  // 第一级（底级）页表项

// 每个页表项里存的不只是下一级页表的物理地址，
// 低12位是标志位，记录这个映射的各种属性：
#define _PAGE_PRESENT   (1 << 0)  // 这个映射是否有效（物理页是否在内存中）
#define _PAGE_RW        (1 << 1)  // 是否可写（写保护的基础）
#define _PAGE_USER      (1 << 2)  // 用户空间是否可访问（内核页不设此位）
#define _PAGE_DIRTY     (1 << 6)  // 页是否被修改过（用于写时复制判断）
#define _PAGE_ACCESSED  (1 << 5)  // 页是否被访问过（用于页面置换算法）
```

`_PAGE_PRESENT` 这个标志位是整个缺页中断机制的核心开关。当MMU翻译一个虚拟地址时，如果遇到某一级页表项的Present位是0，它不会继续往下查，而是立刻触发一个**缺页异常（Page Fault）**，把控制权交给内核的缺页处理程序。内核正是利用这个硬件机制来实现懒分配、写时复制、页面换出等一系列"魔法"。

---

### 5.4 缺页中断：内核最重要的异常处理程序

缺页中断是整个内存管理子系统的核心枢纽，几乎所有高级内存特性都通过它来实现。它的处理函数在x86上定义在 `arch/x86/mm/fault.c`：

```c
// arch/x86/mm/fault.c
// 这是x86缺页异常的入口，由IDT（中断描述符表）直接调用
DEFINE_IDTENTRY_RAW_ERRORCODE(exc_page_fault)
{
    // CR2寄存器由硬件自动存入触发缺页的虚拟地址
    unsigned long address = read_cr2();

    // 进入真正的处理逻辑
    handle_page_fault(regs, error_code, address);
}

// 分析缺页原因，分发到不同的处理路径
static void handle_page_fault(struct pt_regs *regs,
                               unsigned long error_code,
                               unsigned long address)
{
    // 判断缺页发生在用户空间还是内核空间
    if (error_code & X86_PF_USER)
        // 用户空间缺页：可能是正常的懒分配，也可能是越界访问
        do_user_addr_fault(regs, error_code, address);
    else
        // 内核空间缺页：通常是严重bug，触发oops或panic
        do_kern_addr_fault(regs, error_code, address);
}
```

`do_user_addr_fault()` 是最复杂也最有意思的部分。它要回答一个问题：**这次缺页是"合法的但物理页还没准备好"，还是"进程访问了不该访问的地址"？**

```c
// mm/fault.c（体系结构无关的部分）
static void do_user_addr_fault(struct pt_regs *regs,
                                unsigned long error_code,
                                unsigned long address)
{
    struct vm_area_struct *vma;
    struct mm_struct *mm = current->mm;

    // 第一步：在进程的VMA链表里查找这个地址属于哪个区域
    // 如果找不到对应的VMA，说明进程访问了未映射的地址
    // 这就是SIGSEGV（段错误）的来源
    vma = find_vma(mm, address);
    if (unlikely(!vma || address < vma->vm_start)) {
        // 没有对应的VMA，向进程发送SIGSEGV
        bad_area(regs, error_code, address);
        return;
    }

    // 第二步：找到了VMA，说明这个地址是合法的
    // 进入缺页处理的核心：handle_mm_fault
    fault = handle_mm_fault(vma, address, flags, regs);

    // 根据返回值处理结果
    // VM_FAULT_OOM：内存不足，杀死进程
    // VM_FAULT_SIGBUS：总线错误
    // VM_FAULT_SIGKILL：进程应当被杀死
    if (fault & VM_FAULT_OOM) {
        pagefault_out_of_memory();
        return;
    }
```

`handle_mm_fault()` 根据VMA的类型和当前页表状态，分发到不同的处理逻辑。其中最重要的两种情况值得我们深入看一下。

**情况一：懒分配（匿名页）**。进程调用 `malloc()` 申请了内存，但内核并不立即分配物理页，只是创建了一段VMA记录"这个虚拟地址范围是有效的"。当进程第一次访问这块内存时，缺页中断触发，内核这才真正分配一个物理页，把它填充为零，并在页表里建立映射，然后让进程重新执行刚才失败的那条指令——这次就成功了，进程完全不知道中间发生了什么。

**情况二：写时复制（COW）**。`fork()` 之后，父子进程共享所有物理页，但页表里把这些页都标记为只读（`_PAGE_RW` 位为0）。当任何一方尝试写某个页时，MMU发现这个页是只读的，触发缺页中断。内核检查到这是一个COW页（通过 `_PAGE_DIRTY` 等标志判断），于是分配一个新的物理页，把原来那个页的内容复制过来，更新写入方的页表指向新页，然后允许写入继续。原来的物理页仍然属于另一方，不受影响。

```c
// mm/memory.c
// COW的核心处理逻辑
static vm_fault_t do_cow_fault(struct vm_fault *vmf)
{
    // 分配一个新的物理页
    vmf->cow_page = alloc_page_vma(GFP_HIGHUSER_MOVABLE, vma, vmf->address);

    // 把原来共享页的内容复制到新页
    copy_user_highpage(vmf->cow_page, vmf->page, vmf->address, vma);

    // 更新页表：让这个进程的虚拟地址指向新页，并标记为可写
    maybe_mkwrite(mk_pte(vmf->cow_page, vma->vm_page_prot), vma);

    return 0; // 处理成功，CPU会重新执行触发缺页的指令
}
```

---

### 5.5 物理内存的分配：伙伴系统的实现细节

当缺页处理程序需要一个新的物理页时，它调用 `alloc_page()` 从伙伴系统申请。伙伴系统管理的基本单位是**页帧（page frame）**，每个物理页对应一个 `struct page` 结构体，所有的 `struct page` 组成一个巨大的数组（`mem_map`），物理页帧号（PFN）就是这个数组的下标。

伙伴系统的设计思想是把所有空闲物理页按 2n（n=0,1,...,10）的大小分成11个链表。分配一个页时从 order=0 的链表取；分配8个连续页时从 order=3 的链表取。如果对应链表为空，就从更高order的链表里取一块，一分为二，一半用于分配，另一半放入低一级的链表。释放时做反向操作，如果释放的页和相邻的"伙伴"都空闲，就合并成更大的块放入高一级链表：

```c
// mm/page_alloc.c
// 伙伴系统的合并逻辑，每次释放都尝试向上合并
static inline void __free_one_page(struct page *page,
                unsigned long pfn, struct zone *zone,
                unsigned int order, int migratetype)
{
    unsigned long buddy_pfn;
    struct page *buddy;

    // 不断尝试与伙伴合并，直到无法合并为止
    while (order < MAX_ORDER - 1) {
        // 伙伴的页帧号：通过异或当前order对应的位来找到
        // 这是伙伴系统命名的来源：两个"互为伙伴"的块PFN只差一个bit
        buddy_pfn = __find_buddy_pfn(pfn, order);
        buddy = page + (buddy_pfn - pfn);

        // 检查伙伴是否也是空闲的，且在同一个zone里
        if (!page_is_buddy(page, buddy, order))
            goto done_merging;

        // 把伙伴从它所在的链表摘除
        del_page_from_free_list(buddy, zone, order);

        // 合并：取两者中PFN较小的作为合并后的块的起点
        combined_pfn = buddy_pfn & pfn;
        page = page + (combined_pfn - pfn);
        pfn = combined_pfn;
        order++; // 提升一级继续尝试合并
    }

done_merging:
    // 把最终合并的块加入对应order的空闲链表
    add_to_free_list(page, zone, order, migratetype);
}
```

`__find_buddy_pfn()` 里的异或操作是整个伙伴系统最精妙的细节。对于order=0的一对伙伴，它们的PFN只差最低位（一个是偶数，一个是奇数）；对于order=1，它们相差2；对于order=n，相差 2n。用 `pfn ^ (1 << order)` 就能直接计算出伙伴的PFN，不需要任何搜索。这个位运算技巧让伙伴系统的合并操作非常高效。

---

### 5.6 slab分配器：内核对象的高效小内存分配

伙伴系统每次最少分配一个页（4096字节）。但内核内部大量的数据结构都远比一个页小，比如 `task_struct`（约9KB，稍大于一页），`inode`（约600字节），`dentry`（约200字节）。如果每次都从伙伴系统申请，既浪费内存，又因为频繁的物理页分配/回收产生大量开销。

slab分配器（现代内核默认用slub实现）的思想是：**为每种常用对象预先从伙伴系统申请若干物理页，切成等大的格子，反复重复利用**。当某个对象类型被释放时，它占用的格子不还给伙伴系统，而是留在slab里等待下次分配同类对象，避免了反复的物理页申请/归还：

```c
// mm/slub.c
// 创建一个专用的slab缓存——每种常用类型都有自己的缓存
// 比如内核启动时会为 task_struct 创建这样一个缓存
struct kmem_cache *task_struct_cachep =
    kmem_cache_create(
        "task_struct",          // 名字（在 /proc/slabinfo 里可以看到）
        sizeof(struct task_struct), // 每个对象的大小
        ARCH_MIN_TASKALIGN,     // 对齐要求
        SLAB_PANIC,             // 创建失败则panic（这个缓存不可缺少）
        NULL                    // 构造函数（这里不需要）
    );

// 从缓存分配一个对象——这是 fork() 里分配新 task_struct 的方式
struct task_struct *p =
    kmem_cache_alloc(task_struct_cachep, GFP_KERNEL);

// 使用完毕后归还给缓存（不是还给伙伴系统）
kmem_cache_free(task_struct_cachep, p);
```

slub还有一个重要的性能优化值得理解：每个CPU维护一个**本地空闲对象队列**（per-CPU freelist）。同一个CPU上的分配和释放，直接操作本地队列，完全不需要锁。只有当本地队列耗尽或溢出时，才去访问全局的slab链表（这时需要加锁）。这种设计利用了CPU局部性，把锁的竞争降到最低，是高并发场景下性能优秀的关键。

---

### 5.7 把所有层次串联起来：一次 `malloc` 的完整旅程

最后我们把这一节的所有内容用一个具体场景串联起来。当你的程序调用 `malloc(100)` 然后访问返回的指针时，内核经历了什么？

首先，`malloc` 是glibc的库函数，它内部会管理一个用户空间的内存池。如果池里有空间，直接返回，内核根本不知道。当池不够时，glibc调用 `brk()` 或 `mmap()` 系统调用向内核申请更多虚拟地址空间。内核在进程的 `mm_struct` 里创建一个新的VMA，记录这段虚拟地址是有效的，然后立刻返回——**此时没有分配任何物理页**，这就是懒分配。

然后，你的程序第一次写这块内存。CPU用虚拟地址去查页表，发现对应的页表项Present位为0（因为内核根本没建立映射），触发缺页中断。内核的 `do_user_addr_fault()` 被调用，找到对应的VMA（确认地址合法），调用 `handle_mm_fault()`。内核向slub申请一个 `struct page` 对应的物理页（slub可能需要向伙伴系统申请新的页），把这个物理页清零（安全考虑，不能让你看到别人用过的数据），在页表里建立虚拟地址到这个物理页的映射，设置Present位为1。缺页处理程序返回，CPU重新执行那条写指令，这次成功了。整个过程对你的程序完全透明，就好像内存一直都在那里一样。

---

### 本节小结与思考练习

这一节我们走完了从虚拟地址到物理地址的完整链路：四级页表是硬件和软件的契约，缺页中断是实现懒分配和写时复制的关键枢纽，伙伴系统管理物理页的分配合并，slab分配器在上面构建了高效的小对象池。这四个层次环环相扣，共同支撑起Linux内存管理的整个大厦。

留给你一个思考练习：我们说fork之后父子进程共享物理页，通过COW在写入时才复制。那么如果子进程调用 `exec()` 加载一个新程序，这些共享的COW页会怎么处理？`exec()` 会直接丢弃整个地址空间并重新建立映射，那父进程之前共享给子进程的那些页，引用计数会怎么变化，物理页何时才会真正被释放？（提示：每个 `struct page` 里有一个 `_refcount` 字段，追踪它的变化路径，你会看到内核引用计数设计的精髓。）

---
