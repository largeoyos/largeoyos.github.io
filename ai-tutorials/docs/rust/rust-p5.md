## 第十二节：智能指针

---

### 先想一个问题

在开始之前，问你一个问题：到目前为止，我们在栈上存数据，在堆上存数据（通过 `String`、`Vec` 等），但我们从来没有**手动控制**"把某个值放到堆上"。如果我想把一个普通的 `i32` 放到堆上，怎么做？

在 C 里你会写 `int* p = malloc(sizeof(int)); *p = 42;`。Rust 里的答案是 `Box<T>`。

---

### `Box<T>`：最简单的智能指针

`Box<T>` 就是一个指向堆上数据的指针，仅此而已。它没有额外的运行时开销，当 `Box` 离开作用域时，堆上的数据自动释放——这是此前已经熟悉的 RAII 机制。

```rust
fn main() {
    let b = Box::new(5); // 把 i32 值 5 放到堆上
    println!("b = {}", b); // 可以直接用，Rust 自动解引用

    // b 离开作用域，堆上的 5 自动释放
}
```

单纯存一个 `i32` 到堆上没什么实际意义，但 `Box` 有三个真正有用的场景：

**场景一：编译期大小未知的类型**。Rust 要求每个类型在编译期都有确定的大小。但有些类型天然是"递归"的，大小无法确定——比如链表节点：

```rust
// 这段代码无法编译！
// Node 包含 Node，大小无限递归，编译器无法确定
enum List {
    Cons(i32, List),
    Nil,
}

// 用 Box 解决：Box 的大小是固定的（一个指针），堆上的数据大小不影响栈上的布局
enum List {
    Cons(i32, Box<List>), // Box 大小固定，编译器满意了
    Nil,
}

fn main() {
    let list = List::Cons(1,
        Box::new(List::Cons(2,
            Box::new(List::Cons(3,
                Box::new(List::Nil))))));
}
```

**场景二：大数据的所有权转移**。移动大型数据结构时，Rust 需要复制栈上的数据。如果把数据放在 `Box` 里，移动只需要复制一个指针，无论堆上的数据有多大。

**场景三：`Box<dyn Trait>`**。你在上一节已经见过了——用 `Box` 来持有 trait 对象，实现运行时多态。

---

### 所有权规则的"边界情况"

`Box` 很好用，但它只解决了"堆分配"的问题，所有权规则仍然严格适用——一个 `Box` 只有一个所有者。

但现实中有些场景，严格的单一所有权确实不够用：

**场景**：你在构建一个图（graph）数据结构，一个节点可能被多条边引用。谁是这个节点的"唯一所有者"？没有答案——它有多个所有者。

**场景**：你想在程序的多个部分共享一份只读配置数据，但不想复制它。

这时候需要 `Rc<T>`。

---

### `Rc<T>`：引用计数，允许多个所有者

`Rc` 是 Reference Counted（引用计数）的缩写。它通过记录"有多少个所有者指向这块数据"来管理内存——当计数归零时，数据自动释放。这和 C++ 的 `shared_ptr` 是同一个思路。

```rust
use std::rc::Rc;

fn main() {
    let a = Rc::new(String::from("共享数据"));

    // clone() 不是深拷贝！对 Rc 调用 clone 只是增加引用计数
    let b = Rc::clone(&a);
    let c = Rc::clone(&a);

    println!("引用计数：{}", Rc::strong_count(&a)); // 3

    println!("a = {}", a);
    println!("b = {}", b);
    println!("c = {}", c);

    drop(b); // 引用计数减为 2
    println!("drop b 后计数：{}", Rc::strong_count(&a)); // 2

} // a 和 c 离开作用域，计数归零，数据释放
```

`Rc<T>` 有一个重要限制：**只能用于单线程**。引用计数的增减操作不是线程安全的。如果你需要跨线程共享数据，需要用 `Arc<T>`（Atomic Reference Counted）——用原子操作来保证线程安全，其余用法和 `Rc` 完全一样。

另一个限制：`Rc<T>` 只允许**不可变访问**。你可以有多个所有者，但谁也不能修改数据。这来自借用规则的逻辑：如果允许多个所有者同时修改同一份数据，就是数据竞争。

---

### `RefCell<T>`：把借用检查推迟到运行时

到目前为止，借用规则都是在**编译期**执行的。但有时编译器的静态分析过于保守——你知道代码是安全的，但编译器无法证明。

`RefCell<T>` 提供了**内部可变性（interior mutability）**：即使 `RefCell` 本身是不可变的，你也可以通过它修改内部数据。代价是：借用规则的检查推迟到**运行时**，如果违反了（比如同时存在两个可变借用），程序会 panic。

```rust
use std::cell::RefCell;

fn main() {
    // 注意：value 本身不是 mut 的
    let value = RefCell::new(vec![1, 2, 3]);

    // borrow() 返回不可变引用（运行时检查）
    println!("{:?}", value.borrow());

    // borrow_mut() 返回可变引用（运行时检查）
    value.borrow_mut().push(4);

    println!("{:?}", value.borrow()); // [1, 2, 3, 4]

    // 如果同时持有两个可变借用，运行时 panic：
    // let r1 = value.borrow_mut();
    // let r2 = value.borrow_mut(); // panic！
}
```

---

### `Rc<RefCell<T>>`：共享且可变

把 `Rc` 和 `RefCell` 组合起来，就能得到"多个所有者，且可以修改"的效果——这是实现某些数据结构（比如双向链表、图节点）的常用模式：

```rust
use std::rc::Rc;
use std::cell::RefCell;

fn main() {
    let shared = Rc::new(RefCell::new(vec![1, 2, 3]));

    let a = Rc::clone(&shared);
    let b = Rc::clone(&shared);

    // a 和 b 都可以修改同一份数据
    a.borrow_mut().push(4);
    b.borrow_mut().push(5);

    println!("{:?}", shared.borrow()); // [1, 2, 3, 4, 5]
}
```

---

### 四种指针的选择地图

面对这几种智能指针，如何选择？这里有一张简单的决策地图：

```
需要堆分配或 trait 对象？
        │
        ▼
    Box<T>
    单一所有者，编译期借用检查

需要多个所有者？
        │
   单线程？─── 是 ──► Rc<T>
        │
        否
        │
        ▼
      Arc<T>（多线程）

需要内部可变性？
        │
        ▼
  Rc<RefCell<T>>（单线程共享可变）
  Arc<Mutex<T>>（多线程共享可变，下一节讲）
```

一个实践原则：**能用 `Box` 就用 `Box`，能用普通引用就用普通引用**。`Rc`/`RefCell` 是在所有权系统确实无法自然表达的情况下的工具，而不是用来"逃避借用检查器"的后门——滥用 `RefCell` 只是把编译期错误推迟成了运行时 panic，并不更安全。

---

### 思考与检验

在进入下一节之前，我想问你几个问题，试着用自己的话回答：

第一个：`Rc::clone(&a)` 和 `a.clone()` 对一个普通 `String` 调用 `.clone()` ，本质区别是什么？

第二个：假设你在写一个编译器，需要构建一棵**抽象语法树（AST）**，其中某些节点需要引用其他节点（比如变量引用指向变量声明节点）。你会用 `Box`、`Rc`、还是 `Rc<RefCell<T>>`？为什么？

第三个：`RefCell` 把借用检查推迟到运行时，这个设计有什么代价？什么场景下这个代价是值得付出的？

不需要立刻给我答案——这些问题是留给你思考的。如果你想讨论，随时可以问我。

---

### 本节小结

智能指针是所有权系统在"边界情况"下的扩展工具：`Box<T>` 解决堆分配和大小不确定的问题，`Rc<T>` 解决多所有者的问题，`RefCell<T>` 解决内部可变性的问题，`Rc<RefCell<T>>` 把前两者结合。它们的使用频率依次递减——大多数 Rust 代码主要用 `Box` 和普通引用，只在必要时才引入 `Rc` 和 `RefCell`。

下一节我们进入 **第十三节：并发编程**。Rust 被称为"无畏并发（fearless concurrency）"——你将看到所有权系统是如何自然地延伸到多线程场景，让数据竞争在编译期就被消灭，以及 `Arc`、`Mutex` 如何让线程间安全地共享和修改数据。

## 第十三节：并发编程

---

### "无畏并发"是什么意思？

在 C 里写多线程程序，你大概有过这种体验：代码看起来没问题，但偶尔会出现难以复现的 bug，加上 `printf` 调试之后 bug 消失了，去掉又出现——这是数据竞争的经典症状。问题根源在于：**C 的类型系统对线程一无所知**，它不知道哪些数据会被多个线程访问，也无法阻止你不加保护地共享可变状态。

Rust 的做法是：**把线程安全编码进类型系统**。两个关键 Trait——`Send` 和 `Sync`——让编译器能在编译期推断"这个数据可不可以跨线程使用"。数据竞争不是运行时 bug，而是编译错误。

先不急着讲 `Send`/`Sync` 的细节，我们从创建线程开始，让你先感受一下。

---

### 创建线程

```rust
use std::thread;
use std::time::Duration;

fn main() {
    // spawn 创建一个新线程，接受一个闭包作为线程体
    let handle = thread::spawn(|| {
        for i in 1..=5 {
            println!("子线程：{}", i);
            thread::sleep(Duration::from_millis(10));
        }
    });

    for i in 1..=3 {
        println!("主线程：{}", i);
        thread::sleep(Duration::from_millis(10));
    }

    // join() 等待子线程结束，否则主线程退出时子线程会被强制终止
    handle.join().unwrap();
}
```

这里有一个你在上节已经见过的模式——线程闭包通常需要 `move`，把数据的所有权转移进线程：

```rust
fn main() {
    let data = vec![1, 2, 3];

    let handle = thread::spawn(move || {
        // data 的所有权移入了这个线程
        println!("{:?}", data);
    });

    // println!("{:?}", data); // 编译错误：data 已经移走了

    handle.join().unwrap();
}
```

为什么必须 `move`？想一想：如果不用 `move`，闭包只是借用 `data`。但新线程的生命周期可能超过 `data` 的作用域——编译器无法保证借用的有效性，所以直接拒绝。`move` 明确说"我把所有权给你，你负责到底"，问题解决了。

---

### 线程间通信：消息传递

Rust 标准库提供了**通道（channel）**，实现线程间的消息传递。这种模式的哲学来自 Go 语言的名言：_不要通过共享内存来通信，而要通过通信来共享内存_。

```rust
use std::sync::mpsc; // mpsc = multiple producer, single consumer
use std::thread;

fn main() {
    // tx = transmitter（发送端），rx = receiver（接收端）
    let (tx, rx) = mpsc::channel();

    thread::spawn(move || {
        let messages = vec!["hello", "from", "thread"];
        for msg in messages {
            tx.send(msg).unwrap();
            thread::sleep(std::time::Duration::from_millis(50));
        }
        // tx 在这里 drop，通道关闭，rx 的循环会自动结束
    });

    // recv() 会阻塞直到收到消息，通道关闭后返回 Err
    // for 循环利用了这个特性，自动在通道关闭时停止
    for received in rx {
        println!("收到：{}", received);
    }
```

通道天然支持**多个发送端**（`mpsc` 里的 `mp` 就是 multiple producer）：

```rust
let (tx, rx) = mpsc::channel();
let tx2 = tx.clone(); // 克隆发送端，两个线程都能发

thread::spawn(move || { tx.send("来自线程1").unwrap(); });
thread::spawn(move || { tx2.send("来自线程2").unwrap(); });

// 接收两条消息（顺序不确定）
println!("{}", rx.recv().unwrap());
```

---

### 共享状态：`Mutex<T>`

消息传递很优雅，但有些场景确实需要多个线程共享同一块数据——比如一个全局计数器。这时用 `Mutex<T>`（互斥锁）。

`Mutex` 的逻辑和 C 里的 `pthread_mutex_t` 一样，但 Rust 的实现有一个关键不同：**锁和数据绑定在一起**。在 C 里，锁和它保护的数据是分开的两个变量，没有任何东西阻止你在不加锁的情况下访问数据。Rust 的 `Mutex<T>` 把数据藏在锁里面，你**必须**先获取锁才能访问数据，类型系统保证了这一点：

```rust
use std::sync::Mutex;

fn main() {
    let m = Mutex::new(5); // 数据藏在 Mutex 里

    {
        // lock() 阻塞直到获得锁，返回一个 MutexGuard（智能指针）
        let mut num = m.lock().unwrap();
        *num = 6; // 通过 MutexGuard 访问和修改数据
    } // MutexGuard 在这里 drop，锁自动释放——RAII！

    println!("m = {:?}", m);
}
```

注意锁的释放是自动的——`MutexGuard` 离开作用域时自动解锁。你不可能"忘记解锁"，这是 RAII 模式在并发安全上的应用。

---

### `Arc<Mutex<T>>`：多线程共享可变状态的标准模式

单独的 `Mutex` 还不够——如果多个线程都需要访问同一个 `Mutex`，谁拥有它？答案是用上节学的 `Arc`（原子引用计数）来共享所有权：

```rust
use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc 让多个线程共享所有权
    // Mutex 让共享的数据可以安全地被修改
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter); // 克隆 Arc，增加引用计数
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();
            *num += 1;
        });
        handles.push(handle);
    }

    for handle in handles {
        handle.join().unwrap();
    }

    println!("最终计数：{}", *counter.lock().unwrap()); // 10
}
```

`Arc<Mutex<T>>` 是多线程共享可变状态的**标准模式**，就像 `Rc<RefCell<T>>` 是单线程的标准模式一样。把它们对应起来记：

```
单线程共享可变：Rc<RefCell<T>>
多线程共享可变：Arc<Mutex<T>>
```

---

### `Send` 和 `Sync`：线程安全的类型系统基础

现在来看编译器是**怎么知道**哪些数据可以安全地跨线程使用的。

**`Send` Trait**：如果类型 `T` 实现了 `Send`，那么 `T` 的值可以安全地**转移所有权**到另一个线程。绝大多数类型都是 `Send` 的，除了少数例外——比如 `Rc<T>`。为什么 `Rc<T>` 不是 `Send`？因为它的引用计数不是原子操作，在多个线程同时增减计数时会出现数据竞争。`Arc<T>` 用原子操作解决了这个问题，所以是 `Send` 的。

**`Sync` Trait**：如果类型 `T` 实现了 `Sync`，那么 `&T`（对 T 的引用）可以安全地在多个线程间**共享**。简单说就是：可以从多个线程同时读。`Mutex<T>` 是 `Sync` 的——因为它通过锁保证了同一时刻只有一个线程能访问数据。

这两个 Trait 大多数时候是**自动实现**的——如果一个类型的所有字段都是 `Send`，那这个类型也自动是 `Send`。你几乎不需要手动实现它们。它们的意义在于：**当你试图把一个不安全的类型发送到另一个线程时，编译器会直接报错**，而不是让你在运行时踩坑。

---

### 一个常见的死锁场景

掌握工具之后，也要认识它们的局限性。`Mutex` 能防止数据竞争，但防不了**死锁**——两个线程互相等待对方释放锁：

```rust
// 危险代码：展示死锁的逻辑（不要在生产中这么写）
let lock_a = Arc::new(Mutex::new(1));
let lock_b = Arc::new(Mutex::new(2));

let a1 = Arc::clone(&lock_a);
let b1 = Arc::clone(&lock_b);

// 线程1：先锁 A，再锁 B
thread::spawn(move || {
    let _a = a1.lock().unwrap();
    thread::sleep(Duration::from_millis(10)); // 模拟一些工作
    let _b = b1.lock().unwrap(); // 等待线程2释放 B
});

// 线程2：先锁 B，再锁 A
let a2 = Arc::clone(&lock_a);
let b2 = Arc::clone(&lock_b);
thread::spawn(move || {
    let _b = b2.lock().unwrap();
    thread::sleep(Duration::from_millis(10));
    let _a = a2.lock().unwrap(); // 等待线程1释放 A
});

// 两个线程永远互相等待……
```

死锁是 Rust 编译器**无法**帮你检测的问题——它超出了类型系统的能力范围。避免死锁靠的是设计：**始终以相同的顺序获取多个锁**，或者尽量减少同时持有多个锁的情况。

---

### 这一节值得停下来思考的问题

学到这里，可以进一步思考以下问题：

`Mutex` 保证了"同一时刻只有一个线程修改数据"，`channel` 是"把数据的所有权从一个线程转移到另一个线程"。**这两种模式分别适合什么场景？** 如果让你设计一个多线程的网络服务器，处理请求的计数器用哪种？把请求数据交给工作线程处理用哪种？

另一个问题：上一节的 `RefCell` 把借用检查推迟到运行时，`Mutex` 也是运行时的同步机制。**它们有什么本质的相似和不同？**

---

### 本节小结

Rust 的并发安全建立在三个层次上：**`move` 闭包**保证线程拥有自己数据的所有权；**`Send`/`Sync` Trait** 让编译器在类型层面拒绝不安全的跨线程操作；**`Arc<Mutex<T>>`** 提供了多线程共享可变状态的标准工具。死锁是类型系统无法覆盖的盲区，靠设计来避免。

下一节我们学 **第十四节：模块系统与 Cargo**——代码怎么组织成文件、模块、包？第三方库怎么引入和管理？这是你把 Rust 知识真正用于实际项目的最后一块基础拼图。
