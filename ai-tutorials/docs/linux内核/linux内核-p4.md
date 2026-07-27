## 第六节：虚拟文件系统（VFS）——用C实现面向对象的文件系统抽象

上一节我们看到缺页中断处理程序会查找 `vm_area_struct`，其中有一个字段 `vm_file` 指向一个 `struct file`。这个 `struct file` 就是VFS世界的入口。这一节我们深入VFS，理解Linux是如何用C语言的函数指针表，实现出一套堪比面向对象语言的多态文件系统架构的。

在开始之前，先建立一个直觉：VFS要解决的核心问题是**接口统一**。Linux支持几十种文件系统——ext4、btrfs、xfs、NFS、procfs、tmpfs——它们的内部实现天差地别，有的把数据存在磁盘上，有的在内存里动态生成，有的在网络另一端。但用户程序只需要调用 `open`、`read`、`write`、`close` 这四个操作，不需要知道底层是哪种文件系统。VFS就是那个"翻译层"，它定义了所有文件系统必须实现的接口，然后把用户的系统调用转发给正确的实现。

---

### 6.1 VFS的四个核心对象

VFS用四种数据结构来描述文件系统的各个层次，它们之间的关系是整个VFS的骨架，理解了这四者的关系，VFS的其他部分就都是细节了。

第一个是 `super_block`，它描述一个**已挂载的文件系统实例**。每次你执行 `mount /dev/sda1 /mnt/data`，内核就创建一个 `super_block` 来代表这次挂载。它存储文件系统级别的信息：块大小、文件系统类型、根inode的指针，以及文件系统级别的操作函数表。

第二个是 `inode`，它描述一个**文件或目录的元数据**。这里有一个非常重要的认知需要建立：**inode和文件名是分离的**。inode存储文件的大小、权限、时间戳、数据块的位置，但就是不存储文件名。文件名存储在第三个对象里。

第三个是 `dentry`（directory entry，目录项），它维护**文件名到inode的映射**。`/home/user/notes.txt` 这个路径对应三个dentry：`home`、`user`、`notes.txt`，它们形成一个树形结构，每个dentry都有一个指向父dentry的指针，以及一个指向对应inode的指针。

第四个是 `file`，它代表**一次打开文件的操作**。同一个inode可以被多个进程同时打开，每次打开都创建一个独立的 `file` 对象，记录这次打开的读写位置、打开标志等独有状态。这就是为什么两个进程可以同时读同一个文件，各自的文件指针互不干扰。

---

### 6.2 四个对象的源码定义

让我们看这四个结构体最关键的字段，注意观察它们是怎么相互引用的：

```c
// include/linux/fs.h

// 第一个：super_block，描述一个文件系统实例
struct super_block {
    struct file_system_type *s_type;    // 这是什么类型的文件系统（ext4？btrfs？）
    const struct super_operations *s_op; // 文件系统级操作（创建inode、写超级块等）
    struct dentry        *s_root;        // 这个文件系统的根目录dentry
    unsigned long         s_blocksize;   // 块大小（通常4096字节）
    void                 *s_fs_info;     // 指向具体文件系统的私有数据
                                         // ext4在这里存 ext4_sb_info
                                         // btrfs在这里存 btrfs_fs_info
};

// 第二个：inode，描述一个文件的元数据
struct inode {
    umode_t              i_mode;    // 文件类型（普通文件/目录/符号链接）和权限
    kuid_t               i_uid;    // 所有者用户ID
    kgid_t               i_gid;    // 所有者组ID
    loff_t               i_size;   // 文件大小（字节）
    struct timespec64    i_mtime;  // 最后修改时间
    unsigned long        i_ino;    // inode编号（ls -i 看到的那个数字）
    unsigned int         i_nlink;  // 硬链接数——为0时才真正删除文件

    // 操作函数表：这两个指针是VFS多态的核心
    const struct inode_operations  *i_op;  // 对这个inode的操作（创建子文件、查找等）
    const struct file_operations   *i_fop; // 打开这个文件后的读写操作

    struct super_block   *i_sb;    // 指向所属的super_block
    void                 *i_private; // 具体文件系统的私有数据
                                      // ext4在这里存磁盘上的inode信息
};

// 第三个：dentry，维护文件名和inode的映射
struct dentry {
    struct inode         *d_inode;   // 这个目录项对应的inode
    struct dentry        *d_parent;  // 父目录的dentry
    struct qstr           d_name;    // 文件名（包含名字字符串和其哈希值）
    struct super_block   *d_sb;      // 所属文件系统
    const struct dentry_operations *d_op; // dentry操作（比较文件名、释放等）

    // dentry会被缓存在dcache（目录项缓存）里
    // 路径查找时先查缓存，命中率极高，大大加速了文件访问
    struct hlist_bl_node  d_hash;    // 挂入dcache哈希表的节点
    struct list_head      d_child;   // 挂入父目录子列表的节点
    struct list_head      d_subdirs; // 这个目录下所有子dentry的链表头
};

// 第四个：file，代表一次打开操作
struct file {
    struct path               f_path;  // 包含dentry和挂载点信息
    struct inode             *f_inode; // 对应的inode（为了访问方便，冗余存一份）
    const struct file_operations *f_op; // 读写操作函数表（从inode复制过来）
    loff_t                    f_pos;   // 当前读写位置（每个进程的每次打开独立）
    unsigned int              f_flags; // 打开标志（O_RDONLY、O_NONBLOCK等）
    fmode_t                   f_mode;  // 访问模式
};
```

注意 `inode` 里同时有 `i_op`（`inode_operations`）和 `i_fop`（`file_operations`）两个函数表，它们的分工很清晰。`i_op` 处理的是针对inode本身的操作，比如在目录里创建新文件（`mkdir`、`create`）、查找子目录项（`lookup`）、创建符号链接（`symlink`）——这些操作的对象是inode的元数据，不涉及文件内容的读写。`i_fop` 处理的则是文件被打开之后的操作，也就是对文件内容的读写（`read`、`write`、`mmap`），这些操作需要知道读写位置，因此通过 `file` 对象来调用。

---

### 6.3 函数指针表：C语言的多态实现

VFS的精髓在于 `file_operations` 和 `inode_operations` 这两个结构体。它们本质上是**函数指针表**，每种文件系统向VFS注册自己对这些指针的实现，VFS在运行时通过指针调用正确的函数。这和面向对象语言里的虚函数表（vtable）是完全相同的思想。

```c
// include/linux/fs.h
struct file_operations {
    // 每个字段都是一个函数指针
    // 不同的文件系统会用不同的函数填充这些指针

    ssize_t (*read)  (struct file *, char __user *, size_t, loff_t *);
    ssize_t (*write) (struct file *, const char __user *, size_t, loff_t *);
    int     (*open)  (struct inode *, struct file *);
    int     (*release) (struct inode *, struct file *); // 即close
    int     (*mmap)  (struct file *, struct vm_area_struct *);

    // 现代内核更推荐的异步读写接口
    ssize_t (*read_iter)  (struct kiocb *, struct iov_iter *);
    ssize_t (*write_iter) (struct kiocb *, struct iov_iter *);

    // 目录操作：遍历目录内容
    int     (*iterate_shared) (struct file *, struct dir_context *);

    // ioctl：设备文件的控制命令
    long    (*unlocked_ioctl) (struct file *, unsigned int, unsigned long);

    // ... 还有约30个其他函数指针
};
```

我们来看三种截然不同的文件系统是如何填充这个函数表的，你会清楚地感受到多态的威力：

```c
// fs/ext4/file.c
// ext4：真实的磁盘文件系统
const struct file_operations ext4_file_operations = {
    .read_iter  = ext4_file_read_iter,  // 从磁盘块读取数据
    .write_iter = ext4_file_write_iter, // 写入磁盘块，处理日志
    .mmap       = ext4_file_mmap,       // 建立文件到内存的映射
    .open       = ext4_file_open,       // 打开时检查加密、延迟分配等
    .release    = ext4_release_file,
};

// fs/proc/inode.c
// procfs：/proc 目录，文件内容在内存里动态生成
// 比如 /proc/cpuinfo 的内容是内核实时计算的，磁盘上根本没有这个文件
const struct file_operations proc_file_operations = {
    .read       = seq_read,      // 调用注册的seq_show函数生成内容
    .write      = proc_file_write,
    .open       = proc_file_open,
    .release    = single_release,
};

// net/socket.c
// socket文件：让网络连接也可以用文件描述符操作
// 这就是为什么你可以对socket调用read/write而不只是recv/send
const struct file_operations socket_file_ops = {
    .read_iter  = sock_read_iter,  // 从网络接收缓冲区读数据
    .write_iter = sock_write_iter, // 向网络发送缓冲区写数据
    .poll       = sock_poll,       // 用于select/epoll等I/O多路复用
    .release    = sock_close,      // 关闭socket连接
};
```

你看，从用户程序的视角，对这三种"文件"的操作代码是完全一样的：拿到fd，调用 `read(fd, buf, len)`。但最终执行的函数却完全不同：一个去读磁盘，一个在内存里动态生成内容，一个从网络缓冲区取数据。这就是"一切皆文件"哲学的代码实现。

---

### 6.4 系统调用如何流经VFS：以 `read()` 为例

现在我们把调用链从用户空间一路追到具体文件系统，你会看到VFS是如何在中间起到"路由器"作用的：

```c
// fs/read_write.c

// 系统调用入口：用户程序调用 read(fd, buf, len) 触发这里
SYSCALL_DEFINE3(read, unsigned int, fd, char __user *, buf, size_t, count)
{
    // 第一步：根据文件描述符（整数fd）找到对应的 struct file
    // fd只是进程files_struct数组的下标，真正的信息在 struct file 里
    struct fd f = fdget_pos(fd);
    if (!f.file)
        return -EBADF;

    // 第二步：调用 vfs_read，进入VFS层
    ret = vfs_read(f.file, buf, count, &f.file->f_pos);

    fdput_pos(f);
    return ret;
}

ssize_t vfs_read(struct file *file, char __user *buf,
                 size_t count, loff_t *pos)
{
    // 权限检查：这个文件有没有读权限
    if (!(file->f_mode & FMODE_READ))
        return -EBADF;

    // 第三步：通过函数指针调用具体文件系统的实现
    // 这一行是整个VFS的核心——多态调用
    // file->f_op 指向 ext4_file_operations 或 proc_file_operations 或其他
    // 内核不需要知道是哪种，直接调用函数指针即可
    if (file->f_op->read)
        ret = file->f_op->read(file, buf, count, pos);
    else if (file->f_op->read_iter)
        ret = new_sync_read(file, buf, count, pos);
    else
        ret = -EINVAL;

    return ret;
}
```

这个调用链非常干净：系统调用层只管找到 `struct file`；VFS层只管做权限检查和通过函数指针分发；具体文件系统的代码只管实现自己的读逻辑。三层各司其职，完全解耦。

---

### 6.5 路径查找：从字符串到 `dentry` 的过程

当你调用 `open("/home/user/notes.txt", O_RDONLY)` 时，内核必须把这个路径字符串转化成一个具体的 `inode`。这个过程叫做**路径名查找（pathname lookup）**，实现在 `fs/namei.c` 里，是VFS里逻辑最复杂的部分之一。

查找过程从根目录的dentry开始，逐个分量向下走。对于 `/home/user/notes.txt`，内核先拿到根目录 `/` 的dentry，然后在其中查找 `home`，再从 `home` 的dentry查找 `user`，最后从 `user` 查找 `notes.txt`。每一步查找都调用当前目录inode的 `i_op->lookup()` 函数，这又是一次多态调用——ext4的lookup去磁盘上查目录块，而procfs的lookup可能根据请求的名字动态生成一个inode。

```c
// fs/namei.c（简化版）
// 在父目录 parent 里查找名为 name 的子条目
static struct dentry *lookup_slow(const struct qstr *name,
                                   struct dentry *parent,
                                   unsigned int flags)
{
    struct inode *inode = parent->d_inode;
    struct dentry *dentry;

    // 先在 dcache（目录项缓存）里找，大多数情况能命中
    // 命中则直接返回，不需要调用文件系统的lookup
    dentry = d_lookup(parent, name);
    if (dentry)
        return dentry; // 缓存命中，直接返回

    // 缓存未命中，分配一个新的空dentry
    dentry = d_alloc(parent, name);

    // 调用具体文件系统的 lookup 函数
    // 对于ext4，这会去读磁盘上的目录块
    // 返回后，dentry->d_inode 就被填充好了
    inode->i_op->lookup(inode, dentry, flags);

    // 把新找到的dentry加入dcache，下次查找直接命中
    d_add(dentry, inode);

    return dentry;
}
```

dcache（目录项缓存）是这里最重要的性能优化。文件系统操作里路径查找发生的频率极高，如果每次都要走磁盘，性能会极差。dcache把最近查找过的dentry缓存在内存的哈希表里，大多数情况下路径查找完全不需要访问磁盘。这就是为什么频繁访问同一批文件时，系统会越来越快——dcache在预热。

---

### 6.6 硬链接与符号链接：两种设计的本质区别

理解了inode和dentry的分离，硬链接和符号链接的本质区别就变得一目了然，值得在这里用VFS的视角解释一次。

硬链接的本质是：**多个dentry指向同一个inode**。执行 `ln notes.txt notes_backup.txt` 时，内核只是在当前目录创建了一个新的dentry，让 `notes_backup.txt` 这个名字也指向同一个inode编号。inode里的 `i_nlink` 字段从1变成2。因为两个文件名共享同一个inode，它们看到的是完全相同的文件内容、权限、时间戳。只有当 `i_nlink` 降到0时，inode才被真正删除，文件内容才从磁盘上消失。这也解释了为什么 `rm` 命令的系统调用实际上叫 `unlink`——它只是断开一个文件名和inode的链接，而不一定删除文件。

符号链接的本质是：**一个特殊的文件，内容是目标路径的字符串**。它有自己独立的inode，inode里的 `i_mode` 标记了它是符号链接类型。当内核在路径查找中遇到一个符号链接的dentry时，会读取这个inode的内容（目标路径字符串），然后重新开始查找流程。硬链接不能跨文件系统（因为inode编号只在同一个文件系统里唯一），符号链接可以跨文件系统（因为它存的是路径字符串，路径查找可以跨越挂载点）。

---

### 6.7 `/proc` 和 `/sys`：VFS多态的极致体现

理解了VFS的多态机制之后，`/proc` 和 `/sys` 这两个特殊目录就变得很好理解了，它们是VFS多态能力最精彩的应用。

`/proc/cpuinfo` 这个文件在磁盘上根本不存在。当你 `cat /proc/cpuinfo` 时，内核调用的是procfs注册的 `file_operations`，它的 `read` 实现会遍历系统里每个CPU的数据结构，把CPU型号、频率、缓存大小等信息格式化成文本字符串，直接"凭空生成"文件内容返回给你。文件大小甚至是动态的——因为内核没有办法事先知道格式化出来的字符串有多长，所以 `/proc/cpuinfo` 的大小显示为0，但读出来却有内容。

`/sys` 更进一步。它暴露的是内核对象模型（kobject），每个目录对应一个内核对象（设备、驱动、总线），每个文件对应对象的一个属性。向 `/sys/class/backlight/intel_backlight/brightness` 写入一个数字，内核实际上执行的是调用对应背光驱动的亮度设置函数。这种用文件系统接口来操作内核对象的设计，让用户空间程序不需要任何特殊权限或专用工具，用最普通的 `echo` 命令就能控制硬件。

---

### 本节小结与思考练习

这一节我们看到VFS用四个核心对象（`super_block`、`inode`、`dentry`、`file`）和函数指针表构建了一套完整的文件系统抽象。`inode` 和 `dentry` 的分离让硬链接成为可能；`file_operations` 的多态让"一切皆文件"从哲学变成了代码；dcache让频繁的路径查找在内存里高速完成；procfs和sysfs把这套机制用到了极致，让内核内部状态对用户空间透明可见。

给你留一个思考题：我们说每次 `open()` 都创建一个新的 `struct file` 对象，同一个文件被多个进程打开会有多个 `struct file`，但只有一个 `inode`。那么，如果两个进程同时 `write()` 同一个文件，内核是如何保证数据不互相覆盖的？inode层面有没有锁？锁的粒度是什么？（提示：在 `struct inode` 里找 `i_rwsem` 字段，看看ext4的 `write` 路径在哪里获取这把锁，以及它是读写锁还是互斥锁，为什么做出这个选择。）

---

## 第七节：内核的数据结构——链表、红黑树、哈希表与RCU

前六节我们反复遇到一些数据结构：`task_struct` 用链表串联成进程树，CFS调度器用红黑树组织就绪进程，dcache用哈希表加速路径查找，内存管理用RCU保护共享数据。这些数据结构是内核代码的"语言"——不理解它们，你看内核源码就像看一篇用你不认识的词汇写的文章，能猜出大意，但总是差一口气。

这一节我们系统地学习内核自己实现的这套数据结构库。它和你在算法课上学的版本有一个根本性的差异：**内核的数据结构是为极端性能和多核并发设计的**，每一个设计决策背后都有具体的工程权衡，而不只是算法复杂度的考量。

---

### 7.1 侵入式链表：内核链表设计的根本哲学

大多数教科书上的链表是这样设计的：链表节点包含数据和指针，数据是节点的一部分。

```c
// 教科书式的链表（内核不用这种）
struct process_node {
    struct process_node *next;
    struct process_node *prev;
    int pid;
    char name[64];
    // ... 其他进程数据
};
```

这种设计的问题在于，如果你有一个通用的链表实现，它就只能链接一种特定类型的数据。想同时链接进程和文件，你就得写两套链表代码。

Linux内核的解决方案完全颠倒了这个关系——**不是把数据放进节点，而是把节点嵌入数据**。这种设计叫做**侵入式链表（intrusive linked list）**：

```c
// include/linux/list.h
// 链表节点本身只有两个指针，不包含任何数据
struct list_head {
    struct list_head *next;
    struct list_head *prev;
};

// 使用方式：把 list_head 嵌入到你的数据结构里
struct task_struct {
    // task_struct 里有多个 list_head，
    // 每一个都可以把这个 task 挂入不同的链表
    struct list_head    tasks;      // 挂入全局进程链表
    struct list_head    children;   // 作为链表头，串联子进程
    struct list_head    sibling;    // 挂入父进程的 children 链表
    // ...
};
```

这样设计之后，一套链表操作代码可以链接任意类型的结构体，只要它里面嵌入了 `list_head`。同一个 `task_struct` 同时挂在全局进程链表（通过 `tasks`）和父进程的子进程链表（通过 `sibling`），不需要复制任何数据，也不需要为不同链表写不同的代码。

但这引出了一个关键问题：既然链表节点里只有指针，当你从链表里拿到一个 `list_head *` 指针，怎么找到包含它的那个 `task_struct`？这就是内核里最著名的宏 `container_of` 的用武之地：

```c
// include/linux/kernel.h
// 给定一个成员的指针，找到包含这个成员的结构体的指针
// ptr:    指向成员的指针
// type:   包含成员的结构体类型
// member: 成员在结构体里的名字
#define container_of(ptr, type, member) ({          \
    void *__mptr = (void *)(ptr);                   \
    /* 用 offsetof 计算 member 在 type 里的字节偏移量 */ \
    /* 用成员的地址减去偏移量，就得到结构体的起始地址 */ \
    (type *)(__mptr - offsetof(type, member)); })

// 实际使用：遍历全局进程链表
struct task_struct *task;
// list_for_each_entry 是基于 container_of 实现的遍历宏
list_for_each_entry(task, &init_task.tasks, tasks) {
    // 这里的 task 就是每个进程的 task_struct 指针
    printk("pid=%d name=%s\n", task->pid, task->comm);
}
```

`container_of` 的数学原理很简单：如果你知道一个成员变量相对于结构体起始地址的偏移量（`offsetof` 在编译期计算这个值），那么用成员的运行时地址减去这个偏移量，就得到了结构体的起始地址。这个技巧把"只知道成员地址"变成了"知道整个结构体"，是内核里被使用最频繁的技巧之一，值得你花时间真正理解它。

链表的基本操作实现得非常简洁：

```c
// include/linux/list.h

// 在 head 和 head->next 之间插入新节点 new
// 所有插入操作都基于这一个内部函数
static inline void __list_add(struct list_head *new,
                               struct list_head *prev,
                               struct list_head *next)
{
    next->prev = new;
    new->next = next;
    new->prev = prev;
    prev->next = new;  // 最后一步修改 prev->next，保证链表在修改过程中始终可遍历
}

// 在链表头插入（O(1)，用于实现栈）
static inline void list_add(struct list_head *new, struct list_head *head)
{
    __list_add(new, head, head->next);
}

// 在链表尾插入（O(1)，用于实现队列）
static inline void list_add_tail(struct list_head *new, struct list_head *head)
{
    __list_add(new, head->prev, head);
}
```

你可能注意到 `__list_add` 里四个赋值语句的顺序。最后一步才修改 `prev->next`，这是有意为之的——在并发场景下，如果另一个CPU正在从 `head` 开始遍历链表，在新节点完全插入之前，遍历者看到的仍然是一个合法的（虽然不包含新节点的）链表，而不是一个被破坏的链表。这种"最后才修改入口指针"的模式在内核并发数据结构里非常常见。

---

### 7.2 红黑树：在内核里如何使用

我们在第四节已经理解了CFS使用红黑树的原因。这里我们从使用者的角度来看内核的红黑树API，理解它和链表一样使用侵入式设计：

```c
// include/linux/rbtree.h
struct rb_node {
    unsigned long __rb_parent_color; // 父节点指针和颜色（红/黑）压缩在一起！
    struct rb_node *rb_right;
    struct rb_node *rb_left;
};

// 同样是侵入式设计：把 rb_node 嵌入你的数据结构
struct sched_entity {
    struct rb_node  run_node;   // 挂入CFS红黑树的节点
    u64             vruntime;   // 红黑树的排序键值
    // ...
};
```

`__rb_parent_color` 是一个非常精妙的内存节省技巧。由于内核所有数据结构都按至少4字节对齐，任何指针的最低2位必然是0，可以用来存储其他信息。这里把父节点指针的最低1位用来存储这个节点的颜色（0=黑，1=红）。一个字段存了两份信息，节省了4或8字节——在有几十万个进程时，这个节省是可观的。

向红黑树插入一个节点需要调用者自己完成比较和定位，然后调用内核函数完成结构调整：

```c
// 以CFS调度器为例，向就绪队列的红黑树插入一个进程
// kernel/sched/fair.c
static void __enqueue_entity(struct cfs_rq *cfs_rq, struct sched_entity *se)
{
    struct rb_node **link = &cfs_rq->tasks_timeline.rb_root.rb_node;
    struct rb_node *parent = NULL;
    struct sched_entity *entry;
    bool leftmost = true;

    // 第一步：找到插入位置（标准BST插入）
    while (*link) {
        parent = *link;
        entry = rb_entry(parent, struct sched_entity, run_node);
        // 按 vruntime 排序：vruntime 小的在左边
        if (entity_before(se, entry)) {
            link = &parent->rb_left;
        } else {
            link = &parent->rb_right;
            leftmost = false; // 不是最左节点，更新标记
        }

    // 如果这是最左节点（vruntime最小），更新缓存
    // 这个缓存让"选最小vruntime进程"变成O(1)操作
    if (leftmost)
        cfs_rq->rb_leftmost = &se->run_node;

    // 第二步：插入节点并自动完成红黑树的旋转和重新着色
    rb_link_node(&se->run_node, parent, link);
    rb_insert_color_cached(&se->run_node, &cfs_rq->tasks_timeline, leftmost);
}
```

这段代码揭示了内核红黑树API的设计哲学：**内核只负责维护红黑树的结构性质（颜色、平衡），排序逻辑由调用者实现**。内核不知道也不关心你是按什么键值排序的，它只保证树始终是一棵合法的红黑树。这让同一套红黑树代码可以被CFS（按vruntime排序）、内存管理（按地址排序）、定时器（按超时时间排序）等完全不同的场景共用。

---

### 7.3 哈希表：dcache和PID查找的基础

哈希表在内核里有两个最重要的用途：dcache（目录项缓存）和PID到 `task_struct` 的快速查找。内核的哈希表同样使用侵入式设计，节点类型是 `hlist_node`（单向链接的哈希链表节点，比双向链表节省一个指针，在哈希桶里很常见）：

```c
// include/linux/hashtable.h

// 定义一个有 2^bits 个桶的哈希表
// DEFINE_HASHTABLE(name, bits) 展开后是一个 hlist_head 数组
DEFINE_HASHTABLE(pid_hash, 7); // 128个桶的PID哈希表

// 插入：计算哈希值，找到对应的桶，头插法加入链表
hash_add(pid_hash, &task->pid_link.node, task->pid);

// 查找：O(1)平均复杂度
hash_for_each_possible(pid_hash, task, pid_link.node, target_pid) {
    if (task->pid == target_pid)
        return task; // 找到了
}
```

内核PID哈希表（`pid_hash`）是系统调用 `kill(pid, sig)` 能在O(1)时间找到目标进程的基础。每次创建进程时，`task_struct` 被同时加入全局进程链表（用于遍历所有进程）和PID哈希表（用于按PID快速查找）。两种数据结构各自服务于不同的访问模式，这是一个典型的"用冗余换速度"的设计决策。

---

### 7.4 RCU：为读多写少场景设计的同步机制

前面三种数据结构解决的是"如何组织数据"的问题。现在我们来看内核里最重要的同步机制——**RCU（Read-Copy-Update）**，它解决的是"多个CPU同时访问共享数据时如何保证安全"的问题。

理解RCU之前，先理解它要解决的问题。内核里有很多数据结构被频繁读取但很少修改，比如进程列表、路由表、模块列表。用普通的读写锁（rwlock）保护它们有一个问题：即使是读操作，也需要获取读锁，在读锁的获取和释放上，多个CPU之间需要通过缓存一致性协议同步锁的状态，这在核心数很多时会产生显著的开销。

RCU的核心洞察是：**读者根本不需要加锁，只要我们能保证读者看到的数据始终是完整有效的就够了**。它的实现基于一个关键观察：如果我们不直接修改数据，而是先创建一个副本、修改副本、最后原子地替换指针，那么读者要么看到旧数据，要么看到新数据，但绝不会看到"修改到一半"的数据。

```c
// 读者：完全不加锁，只需要标记自己在"读临界区"内
rcu_read_lock();   // 实际上只是禁止抢占，不涉及任何锁操作
                   // 在不支持抢占的内核配置下甚至是空操作

struct task_struct *t = rcu_dereference(current_task);
// 使用 t... 此时 t 指向的数据保证是完整的

rcu_read_unlock(); // 标记离开读临界区，允许写者知道"这个读者结束了"

// 写者：先复制，修改副本，再替换
struct my_data *old_data = global_ptr;
struct my_data *new_data = kmalloc(sizeof(*new_data), GFP_KERNEL);

// 复制旧数据，修改副本
*new_data = *old_data;
new_data->value = new_value;

// 原子替换指针——读者从这一刻开始看到新数据
rcu_assign_pointer(global_ptr, new_data);

// 等待所有"正在使用旧数据的读者"完成
// 这里不是等所有读者，只等那些在替换指针之前就开始读的读者
synchronize_rcu();

// 现在可以安全释放旧数据
kfree(old_data);
```

理解 `synchronize_rcu()` 的等待逻辑很重要，这里经常有一个误解。它等待的不是"所有读者都结束"，而是**等待每个CPU都至少经历了一次"不在读临界区"的状态**。为什么这个条件就够了？因为 `rcu_read_lock/unlock` 是不可嵌套、不可阻塞的，所以一个读临界区一定会在有限时间内结束。如果某个CPU曾经离开过读临界区，它在替换指针之前开始的那次读一定已经结束了。

这个等待策略让RCU在很多场景下比读写锁快得多——读者完全不需要原子操作，写者虽然要等，但等的时候不阻止任何读者，系统的整体吞吐量更高。

内核里RCU保护的最重要数据结构之一是进程列表。当你调用 `ps` 命令遍历所有进程时，内核会在RCU读临界区里遍历 `task_struct` 的全局链表，期间如果有进程被创建或销毁，写者会等待这次遍历结束后再修改链表，但不需要阻止遍历本身，极大地提高了并发性。

---

### 7.5 等待队列：睡眠和唤醒的实现基础

最后介绍一个经常被忽略但极其重要的数据结构——**等待队列（wait queue）**。它是进程睡眠和唤醒机制的底层实现，也是驱动程序、文件系统、网络栈实现阻塞操作的统一方式。

```c
// include/linux/wait.h

// 等待队列头：通常作为共享资源的一部分存在
// 比如 socket 的接收缓冲区旁边会有一个等待队列头
// "没有数据可读的进程"就睡在这个队列里
struct wait_queue_head {
    spinlock_t          lock;   // 保护队列本身
    struct list_head    head;   // 等待的进程列表
};

// 典型的使用模式：等待某个条件成立
// 这个模式在驱动程序和文件系统代码里随处可见
wait_event_interruptible(wq_head, condition);
// 展开后大致等价于：
//   while (!condition) {
//       把当前进程加入 wq_head
//       把进程状态设为 TASK_INTERRUPTIBLE
//       调用 schedule() 让出CPU
//       从 schedule() 返回后，重新检查 condition
//   }

// 唤醒：当条件满足时，通知等待队列里的进程
// 比如网卡收到数据后，调用这个唤醒等待接收数据的进程
wake_up_interruptible(&wq_head);
// 展开后大致等价于：
//   遍历 wq_head 里的所有等待进程
//   把它们的状态设为 TASK_RUNNING
//   加入调度器的就绪队列
```

等待队列是把调度器（第四节）、中断子系统（中断触发唤醒）和具体子系统（网络、文件系统、驱动）粘合在一起的关键机制。每次你的程序调用 `read()` 等待数据，背后就是进程把自己放入某个等待队列然后调用 `schedule()`；每次数据到达，驱动程序在中断处理程序里调用 `wake_up()`，把你的进程从等待队列移回就绪队列，调度器在下次调度时选中你的进程，`read()` 才最终返回。

---

### 本节小结与一个综合思考

这一节我们认识了内核数据结构库的四根支柱。侵入式链表通过 `list_head` 嵌入和 `container_of` 反推，实现了类型无关的通用链表。红黑树把结构维护和排序逻辑分离，让同一套代码服务于完全不同的排序需求。哈希表用冗余索引把特定查找模式从O(N)降到O(1)。RCU用"复制后替换"的写者策略，让读者完全免锁，在读多写少场景下接近理想的并发性能。等待队列则把这一切粘合起来，让进程能以优雅的方式等待任意条件的成立。

这里有一个值得深入思考的综合问题：我们说RCU适合"读多写少"的场景，而spinlock适合"临界区极短"的场景，mutex适合"临界区可能较长、持有者可能睡眠"的场景。那么对于CFS调度器的就绪队列（红黑树），每次时钟中断都会访问它（读多），但每次进程切换时也要修改它（写不算少），而且修改操作必须在中断上下文里完成（不能睡眠）。你觉得内核应该用哪种同步机制来保护这棵红黑树？为什么？（提示：在 `kernel/sched/sched.h` 里找 `struct rq`，看看 `rq->lock` 是什么类型，然后想想为什么不能用RCU。）

---
