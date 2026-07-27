## 第五节：结构体（Struct）

---

### 从 C 的 struct 出发

你在 C 里已经用过 `struct`，它的核心思想是把相关的数据打包成一个有意义的整体。Rust 的 `struct` 继承了这个思想，但在上面叠加了所有权系统、方法定义、以及一套更强大的模式匹配能力。这一节我们先把基础打牢，后续节再逐步展开更高级的特性。

---

### 定义和实例化

Rust 的 struct 语法和 C 非常相似，主要差别是字段名在前、类型在后（和变量声明的顺序一致）：

```rust
// 定义一个描述用户的结构体
struct User {
    username: String,  // 注意：字段之间用逗号，不是分号
    email: String,
    age: u32,
    active: bool,
}

fn main() {
    // 实例化：必须给所有字段赋值
    let user1 = User {
        username: String::from("alice"),
        email: String::from("alice@example.com"),
        age: 30,
        active: true,
    };

    // 用点号访问字段，和 C 完全一样
    println!("用户名：{}", user1.username);
}
```

一个重要的细节：Rust 的 struct 实例**整体是可变的，或者整体是不可变的**——你不能单独把某个字段标记为 `mut`。如果你想修改字段，整个实例必须声明为 `mut`：

```rust
let mut user1 = User {
    username: String::from("alice"),
    email: String::from("alice@example.com"),
    age: 30,
    active: true,
};

user1.age = 31; // OK，因为 user1 是 mut 的
```

---

### 结构体更新语法

这是 Rust 里一个很实用的语法糖，在 C 里没有对应的东西。当你想基于一个已有实例创建新实例，只改动其中几个字段时，可以用 `..` 语法来"继承"剩余字段的值：

```rust
let user2 = User {
    email: String::from("bob@example.com"), // 只改邮箱
    username: String::from("bob"),           // 和用户名
    ..user1  // 其余字段（age, active）从 user1 复制过来
};
```

这里有一个所有权的细节值得停下来想一想：`user1` 的 `age`（`u32`）和 `active`（`bool`）是 `Copy` 类型，复制没问题。但如果 `user1` 有 `String` 字段被"继承"过去了，那这个 `String` 的所有权就转移给了 `user2`，`user1` 中对应的字段就不再有效了。这和我们第三节学的 Move 规则完全一致——struct 没有任何特殊待遇，所有权规则统一适用。

---

### 元组结构体（Tuple Struct）

有时候你想给一个元组起一个有意义的名字，但不需要给每个字段命名。Rust 为此提供了元组结构体：

```rust
struct Color(u8, u8, u8);   // RGB 三个分量
struct Point(f64, f64, f64); // 三维坐标

let black = Color(0, 0, 0);
let origin = Point(0.0, 0.0, 0.0);

// 用点号加索引访问，和元组一样
println!("红色分量：{}", black.0);
```

`Color` 和 `Point` 虽然内部结构一样（都是三个数），但它们是**不同的类型**。编译器不会让你把一个 `Color` 当 `Point` 用，这正是元组结构体相比裸元组的优势——类型系统帮你区分语义。

---

### 方法：把函数绑定到结构体上

C 里的 struct 只能存数据，操作它的函数和它是分离的。Rust 允许你把函数**绑定到 struct 上**，这些函数叫做**方法（method）**。方法的定义放在 `impl` 块里：

```rust
struct Rectangle {
    width: f64,
    height: f64,
}

impl Rectangle {
    // 方法的第一个参数是 &self，代表"这个实例本身"
    // &self 是 self: &Self 的简写，类似 C++ 里的 this 指针，但更明确
    fn area(&self) -> f64 {
        self.width * self.height
    }

    fn perimeter(&self) -> f64 {
        2.0 * (self.width + self.height)
    }

    // 如果方法需要修改实例，用 &mut self
    fn scale(&mut self, factor: f64) {
        self.width *= factor;
        self.height *= factor;
    }

    // 如果方法需要消耗实例本身（拿走所有权），用 self
    // 这种情况比较少见，但有时有用
    fn into_square(self) -> Rectangle {
        let side = self.width.min(self.height);
        Rectangle { width: side, height: side }
    }

fn main() {
    let mut rect = Rectangle { width: 10.0, height: 5.0 };

    // 方法调用用点号，不需要手动传 self
    println!("面积：{}", rect.area());
    println!("周长：{}", rect.perimeter());

    rect.scale(2.0);
    println!("放大后的面积：{}", rect.area()); // 200.0
}
```

`&self`、`&mut self`、`self` 这三种形式对应三种不同的所有权语义，和普通函数参数完全一致。这不是特殊的语法——它只是把此前已经学过的借用规则应用到了方法上。每次看到 `&self`，就知道这个方法只是借用实例来读取，不会修改也不会消耗它；看到 `&mut self`，就知道它会修改实例；看到 `self`，就知道调用之后实例的所有权被移走了，不能再用了。

---

### 关联函数：不带 self 的"静态方法"

`impl` 块里还可以定义**不带 `self` 参数的函数**，叫做**关联函数（associated function）**。它们不依附于某个实例，更像 C++ 里的静态方法。最典型的用法是写构造函数：

```rust
impl Rectangle {
    // 约定俗成，构造函数通常叫 new
    // 注意没有 &self，这不是一个方法，而是一个关联函数
    fn new(width: f64, height: f64) -> Rectangle {
        Rectangle { width, height } // 字段名和变量名相同时可以简写
    }

    // 创建正方形的便捷构造函数
    fn square(size: f64) -> Rectangle {
        Rectangle { width: size, height: size }
    }

fn main() {
    // 关联函数用双冒号 :: 调用，而不是点号
    let rect = Rectangle::new(10.0, 5.0);
    let sq = Rectangle::square(4.0);
}
```

`::` 这个语法你之前已经见过——`String::from("hello")` 就是调用 `String` 的关联函数 `from`。现在你明白它为什么用 `::` 而不是 `.` 了：`from` 不是在某个具体的 `String` 实例上调用的，而是在 `String` 这个**类型**上调用的。

---

### 所有权与结构体的关系

这是一个需要特别关注的话题，因为它会影响你设计 struct 的方式。注意我们在 `User` 里用的是 `String` 而不是 `&str`：

```rust
struct User {
    username: String, // 拥有这个字符串数据
    email: String,    // 拥有这个字符串数据
}
```

这是故意的。`String` 表示 `User` **拥有**自己的字符串数据，`User` 实例的生命周期和它的字符串数据的生命周期绑定在一起——`User` 被 drop 时，这两个 `String` 也自动被 drop，非常干净。

如果你想在 struct 里存引用（`&str`），理论上是可以的，但编译器会要求你明确指定**生命周期参数**，来保证引用的有效期不短于 struct 本身。这就是下下节会介绍的生命周期（Lifetime）话题。在那之前，设计 struct 时优先选择拥有所有权的类型（`String` 而不是 `&str`，`Vec<T>` 而不是 `&[T]`），是一个让初学者少踩坑的好习惯。

---

### 调试输出：`#[derive(Debug)]`

在 C 里，如果你想打印一个 struct 的内容，你得自己写代码逐个字段打印。Rust 有一个非常方便的机制：只要在 struct 上加一行 `#[derive(Debug)]`，就可以用 `{:?}` 或者 `{:#?}` 来打印整个 struct 的内容：

```rust
#[derive(Debug)] // 让编译器自动生成调试打印的代码
struct Rectangle {
    width: f64,
    height: f64,
}

fn main() {
    let rect = Rectangle { width: 10.0, height: 5.0 };

    println!("{:?}", rect);   // Rectangle { width: 10.0, height: 5.0 }
    println!("{:#?}", rect);  // 带缩进的美化输出，适合嵌套结构体
}
```

`#[derive(Debug)]` 是 Rust **派生宏（derive macro）** 的一个例子。它让编译器根据你的 struct 定义自动生成一些标准代码，省去了大量重复劳动。除了 `Debug`，常见的还有 `Clone`（自动生成 `.clone()` 方法）、`PartialEq`（自动生成 `==` 比较）等等，后面的章节里会自然地遇到它们。

---

### 一个综合练习

在进入下一节之前，试着用本节知识写一个小程序：定义一个 `Circle` 结构体，包含 `radius` 字段；为它实现 `new` 关联函数、`area` 方法、`circumference` 方法；再实现一个 `is_larger_than` 方法，接受另一个 `Circle` 的引用，返回 `bool`。思考一下：`is_larger_than` 的两个参数（`self` 和另一个 circle）应该分别用什么形式？

答案是两个都应该用 `&self` 和 `&Circle`——我们只需要读取半径来做比较，没有理由拿走所有权或者修改任何数据。能在动手之前想清楚这一点，说明你对借用规则已经有了不错的直觉。

---

### 本节小结

Rust 的 struct 是你组织数据的基本单元。方法和关联函数通过 `impl` 块附加到 struct 上，`&self`、`&mut self`、`self` 三种形式直接对应此前已经学过的借用与所有权语义，没有任何新的规则需要记忆——这正是 Rust 设计的一致性之美：少数几个核心规则，统一适用于所有场景。

下一节我们来学 **第六节：枚举与模式匹配（Enum & Pattern Matching）**。Rust 的枚举远比 C 的 `enum` 强大——它可以携带数据，配合 `match` 表达式，能以极其优雅的方式处理"这个值可能是几种不同形态之一"的场景。理解了它，你才算真正开始写"有 Rust 味道"的代码。

## 第六节：枚举与模式匹配（Enum & Pattern Matching）

---

### 先从 C 的枚举说起，找到差距

C 的 `enum` 本质上是一组有名字的整数常量，仅此而已：

```c
enum Direction { NORTH, SOUTH, EAST, WEST };
enum Direction d = NORTH;
```

它只能告诉你"是哪一种"，但不能携带额外的数据。如果你想表达"一个网络请求，可能成功并携带响应体，也可能失败并携带错误码"，C 里你得用 struct + enum 拼凑，代码会非常啰嗦，而且类型系统无法保证你在"失败"的情况下不去读"响应体"字段。

Rust 的枚举（`enum`）从根本上解决了这个问题。**Rust 的枚举每个变体（variant）都可以携带不同类型、不同数量的数据**，更像是数学里"和类型（sum type）"的概念——这个值要么是 A（可能附带一些数据），要么是 B（可能附带另一些数据），但绝对不会同时是两者。

---

### 定义枚举：从简单到复杂

先看一个最简单的例子，和 C 的枚举很像：

```rust
enum Direction {
    North,
    South,
    East,
    West,
}

fn main() {
    let d = Direction::North; // 用 :: 来引用枚举变体
}
```

现在来看 Rust 枚举真正强大的地方——让每个变体携带数据：

```rust
enum Message {
    Quit,                        // 没有数据，就像 C 的枚举
    Move { x: i32, y: i32 },    // 携带一个匿名结构体
    Write(String),               // 携带一个 String
    ChangeColor(u8, u8, u8),     // 携带三个 u8（像元组结构体）
}
```

这四个变体完全可以是同一个 `Message` 类型，但它们携带的数据形态各不相同。在内存里，Rust 会为这个枚举分配足够容纳最大变体的空间（类似 C 的 `union`），同时附带一个标签来记录当前是哪个变体。但和 C 的 `union` 不同，你**不可能**在"它是 `Quit`"的时候去读取 `Move` 的 `x`、`y` 字段——Rust 的类型系统从根本上禁止了这种未定义行为。

实例化携带数据的变体，语法很直观：

```rust
let m1 = Message::Quit;
let m2 = Message::Move { x: 10, y: 20 };
let m3 = Message::Write(String::from("hello"));
let m4 = Message::ChangeColor(255, 128, 0);
```

---

### `match`：枚举的灵魂伴侣

光有枚举还不够，你还需要一种方式来"拆开"它，根据是哪个变体来执行不同的逻辑。这就是 `match` 表达式。

你可以把 `match` 理解成 C 的 `switch`，但它远比 `switch` 强大，也更安全。最关键的一点：**`match` 必须穷举所有可能的变体**，如果你漏掉了某个情况，编译器会报错。这意味着当你给枚举加了新的变体，所有使用 `match` 的地方都会因为"没有处理新变体"而报错——这是一种非常宝贵的编译期安全网。

```rust
fn process_message(msg: Message) {
    match msg {
        // 每个分支用 => 分隔模式和要执行的代码
        Message::Quit => {
            println!("退出");
        }
        Message::Move { x, y } => {
            // 这里直接把结构体字段解构出来，可以直接用 x 和 y
            println!("移动到 ({}, {})", x, y);
        }
        Message::Write(text) => {
            // 把 String 从变体里解构出来，绑定到 text
            println!("写入：{}", text);
        }
        Message::ChangeColor(r, g, b) => {
            println!("颜色：rgb({}, {}, {})", r, g, b);
        }
        // 如果你删掉上面任何一个分支，编译器会立刻报错！
    }
```

`match` 里的每个"臂"（arm）都是一个**模式（pattern）**，Rust 会从上到下尝试匹配，找到第一个匹配的臂就执行对应的代码。"模式"这个词很关键——它不只是值的比较，还可以同时**解构**出内部的数据，就像上面的 `{ x, y }` 和 `(text)` 那样。

---

### `match` 是表达式，不是语句

这是 Rust 和 C 的一个重要区别：`match` 是一个**表达式**，它有返回值。每个臂的最后一个值就是这个臂的"返回值"，整个 `match` 表达式的值就是匹配到的那个臂的值：

```rust
let direction = Direction::North;

// match 直接作为值使用
let description = match direction {
    Direction::North => "向北",
    Direction::South => "向南",
    Direction::East  => "向东",
    Direction::West  => "向西",
};

println!("{}", description); // "向北"
```

这让代码比 C 里的"先声明变量，再在 switch 里赋值"的模式简洁得多。

---

### 通配符与 `if` 守卫

有时候你只关心几个特定的情况，其余的统一处理。可以用 `_` 作为通配符，类似 C 的 `default`：

```rust
let number = 7;

match number {
    1 => println!("一"),
    2 | 3 | 5 | 7 => println!("质数"),  // | 表示"或"，同一个臂匹配多个模式
    10..=20 => println!("10 到 20 之间"), // ..= 表示闭区间范围
    _ => println!("其他"),               // _ 匹配所有剩余情况
}
```

你还可以在 `match` 臂上加 `if` 条件，叫做**守卫（guard）**，让模式匹配更精细：

```rust
let pair = (2, -3);

match pair {
    (x, y) if x == y    => println!("两个数相等"),
    (x, y) if x + y > 0 => println!("和为正数"),
    _                    => println!("其他情况"),
}
```

---

### Rust 的两大核心枚举：`Option` 和 `Result`

Rust 标准库里有两个枚举，你在写 Rust 代码时会无处不在地遇到它们。理解它们，是理解 Rust 如何处理错误和空值的关键。

**`Option<T>`：优雅地替代空指针**

C 里表示"这个值可能不存在"的惯用做法是返回 `NULL` 指针或者 `-1` 这样的哨兵值。这类约定完全靠程序员自觉遵守，忘了检查就会出问题。Rust 彻底废除了 `null`，用 `Option<T>` 枚举来表达"可能有值，也可能没有"：

```rust
// Option<T> 的定义大概是这样的（标准库里内置了它）：
// enum Option<T> {
//     Some(T),  // 有值，携带类型为 T 的数据
//     None,     // 没有值
// }

fn find_first_even(numbers: &[i32]) -> Option<i32> {
    for &n in numbers {
        if n % 2 == 0 {
            return Some(n); // 找到了，返回 Some 包裹的值
        }
    None // 没找到，返回 None
}

fn main() {
    let nums = vec![1, 3, 5, 4, 7];

    // 你必须处理 None 的情况，否则编译器会通过各种方式提醒你
    match find_first_even(&nums) {
        Some(n) => println!("找到了第一个偶数：{}", n),
        None    => println!("没有偶数"),
    }
```

`Option<T>` 最重要的意义在于：**你不可能在没有检查的情况下使用一个可能为空的值**。`Some(n)` 里的 `n` 只有通过模式匹配（或者其他 Rust 提供的安全方法）才能取出来。这从语言层面消灭了 C 里最常见的"忘记判空"导致的空指针解引用 bug。

**`Result<T, E>`：强制你处理错误**

C 里处理错误的方式五花八门：返回负数、设置全局 `errno`、返回 `NULL`……调用者很容易忽略错误。Rust 用 `Result<T, E>` 枚举来表达"这个操作可能成功，也可能失败"：

```rust
// Result<T, E> 的定义大概是这样的：
// enum Result<T, E> {
//     Ok(T),  // 成功，携带类型为 T 的结果
//     Err(E), // 失败，携带类型为 E 的错误信息
// }

use std::fs;

fn read_config() -> Result<String, std::io::Error> {
    // fs::read_to_string 本身就返回 Result
    fs::read_to_string("config.txt")
}

fn main() {
    match read_config() {
        Ok(content) => println!("配置内容：{}", content),
        Err(e)      => println!("读取失败：{}", e),
    }
```

和 `Option` 一样，你**必须**处理 `Err` 的情况，否则编译器会发出警告，某些操作甚至直接无法编译。Rust 把错误处理从"程序员的自觉"变成了"编译器的强制要求"，这是 Rust 代码质量普遍较高的重要原因之一。

---

### `if let`：当你只关心一种情况时

有时候用完整的 `match` 来处理所有变体显得过于冗长，如果你只关心一种情况而想忽略其他的，可以用 `if let` 这个语法糖：

```rust
let config = read_config();

// 完整的 match：
match config {
    Ok(content) => println!("内容：{}", content),
    Err(_) => {}  // 忽略错误，但必须写这一行
}

// 等价的 if let，更简洁：
if let Ok(content) = config {
    println!("内容：{}", content);
    // 如果是 Err，什么都不做，直接跳过
}
```

`if let` 的意思是："如果能匹配这个模式，就解构并执行代码块；否则跳过"。它是 `match` 的简写形式，在你只关心一种变体的场景下非常好用。类似地，还有 `while let`，在"只要还能匹配就一直循环"的场景下使用，后续章节遇到时会自然介绍。

---

### 思考题：设计自己的枚举

在继续之前，试着思考这个设计题：假设你在写一个简单的计算器，它接受用户输入，可能是加、减、乘、除四种操作，每种操作携带两个 `f64` 操作数。除法还需要额外处理除数为零的情况。

你会怎么用枚举来建模这个计算器？`calculate` 函数的返回类型应该是什么——是 `f64`，还是 `Option<f64>`，还是 `Result<f64, String>`？想清楚这个问题，你对 Rust 枚举的理解就真正到位了。

---

### 本节小结

Rust 的枚举是一个可以携带数据的"多态容器"，`match` 则是拆开它的钥匙——强制穷举、支持解构、本身是表达式，三个特性合在一起，让处理"多种可能状态"的代码既安全又优雅。`Option` 和 `Result` 是这套思想最重要的应用，它们从语言层面消灭了空指针和被忽略的错误，是 Rust 安全性的重要基石。

下一节我们来学 **第七节：集合类型——Vec、HashMap 与切片**。有了 struct 和 enum 来描述数据的"形状"，你还需要能容纳大量数据的容器。Vec 是 Rust 版的动态数组，HashMap 是键值对存储，而切片（slice）则是 Rust 处理"一段连续数据"的统一方式，也是你会频繁在函数参数里看到的类型。

## 第七节：集合类型——Vec、HashMap 与切片

---

### 为什么需要集合类型？

到目前为止，我们用 struct 来描述单个事物的结构，用 enum 来表达"多种可能的形态"。但真实的程序往往需要处理**数量不定的数据**——比如一个班级里所有学生的成绩，或者一个词典里所有单词的映射关系。这就是集合类型（collection）的用武之地。

Rust 标准库提供了丰富的集合类型，这一节我们聚焦最常用的三个：`Vec<T>`（动态数组）、`HashMap<K, V>`（哈希表）、以及切片（slice）。它们都是堆分配的，受所有权系统管理，用起来既高效又安全。

---

### `Vec<T>`：可增长的动态数组

`Vec<T>` 是 Rust 里用得最多的集合类型，它对应 C 里你手动用 `malloc` + `realloc` 管理的动态数组，或者 C++ 的 `std::vector`。`T` 是元素的类型，比如 `Vec<i32>` 就是一个存 `i32` 的动态数组。

**创建 Vec** 有两种常见方式。一种是用 `Vec::new()` 创建空的，另一种是用 `vec!` 宏直接初始化：

```rust
fn main() {
    // 方式一：创建空 Vec，之后 push 元素
    // 注意：这里必须显式标注类型，因为编译器没有足够信息推断
    let mut v1: Vec<i32> = Vec::new();
    v1.push(1);
    v1.push(2);
    v1.push(3);

    // 方式二：用 vec! 宏直接初始化，编译器可以从初始值推断类型
    let v2 = vec![1, 2, 3, 4, 5];

    println!("v1 的长度：{}", v1.len());
    println!("v2 的第一个元素：{}", v2[0]);
}
```

在内存里，`Vec` 和 `String` 的结构非常相似（`String` 本质上就是 `Vec<u8>`）：栈上存着一个指针、长度和容量，堆上存着实际的元素数据。当元素数量超过容量时，Vec 会自动重新分配更大的堆内存并把数据搬过去。这一切对你透明，不需要手动管理。

**访问元素**有两种方式，它们在处理越界访问时行为完全不同，理解这个差异很重要：

```rust
let v = vec![10, 20, 30];

// 方式一：用索引直接访问，越界时程序 panic（崩溃）
// 适合你"确信"索引一定在范围内的情况
let third = v[2];
println!("{}", third); // 30

// 方式二：用 .get() 方法，返回 Option<&T>，越界时返回 None
// 适合索引可能越界、需要优雅处理的情况
match v.get(10) {
    Some(val) => println!("找到了：{}", val),
    None      => println!("索引越界，安全处理"), // 走这里
}
```

这里你可以看到上一节学的 `Option` 在实际场景中的应用——`.get()` 强迫你承认"索引可能越界"这个事实，而不是让程序悄悄读到错误的内存。

**遍历 Vec** 通常用 `for` 循环。注意这里借用规则的体现：

```rust
let v = vec![1, 2, 3, 4, 5];

// 用不可变引用遍历，不消耗 v 的所有权
for n in &v {
    println!("{}", n); // n 的类型是 &i32
}
// v 在这里仍然有效

// 如果需要修改元素，用可变引用遍历
let mut v2 = vec![1, 2, 3];
for n in &mut v2 {
    *n *= 2; // 解引用后修改
}
println!("{:?}", v2); // [2, 4, 6]

// 如果用 for n in v（不加 &），会消耗 v 的所有权，循环后 v 不再有效
// 这在你"用完就不需要了"的场景下合适
```

---

### 切片（Slice）：对连续数据的"视图"

切片是 Rust 里一个非常重要但初学者容易忽视的概念。**切片不是一个独立的数据结构，而是对某段连续数据的引用**——它不拥有数据，只是"借来看看"。

切片的类型写作 `&[T]`（对 `T` 类型数组的引用），对字符串来说是 `&str`。切片在栈上只存两个东西：一个指向数据开头的指针，和这段数据的长度。这个"胖指针"（fat pointer）的设计让你可以安全地传递"一段数组"，而不需要额外传递长度参数——你在 C 里一定写过无数个 `void process(int* arr, size_t len)` 这样的函数签名，切片把这两个参数合二为一了。

```rust
fn sum(numbers: &[i32]) -> i32 {
    // 这个函数接受"任何 i32 切片"，不关心数据来自 Vec 还是数组
    let mut total = 0;
    for &n in numbers {
        total += n;
    }
    total
}

fn main() {
    let arr = [1, 2, 3, 4, 5];      // 固定大小的数组
    let vec = vec![10, 20, 30];      // Vec

    // 两者都可以作为切片传给同一个函数！
    // &arr 和 &vec 都会自动转换（coerce）成 &[i32]
    println!("{}", sum(&arr));   // 15
    println!("{}", sum(&vec));   // 60

    // 也可以只传一部分：用范围索引来切出子切片
    println!("{}", sum(&arr[1..4])); // 只传 [2, 3, 4]，结果是 9
}
```

你之前一直见到的 `&str` 其实就是字符串切片——它是对某段 UTF-8 字节序列的引用，可以来自字符串字面量（存在程序的静态数据区），也可以来自 `String` 的某个片段。这就是为什么 `&str` 和 `String` 可以"互通"：`&my_string` 会自动转换成 `&str`，因为 `String` 解引用后就是一个 `str` 切片。

---

### `HashMap<K, V>`：键值对存储

`HashMap` 是哈希表，存储键值对，通过键来快速查找对应的值。这对应 C 里你要么手写哈希表，要么引入第三方库才能实现的功能。

`HashMap` 不在 Rust 的预导入（prelude）里，需要手动 `use`：

```rust
use std::collections::HashMap;

fn main() {
    let mut scores: HashMap<String, i32> = HashMap::new();

    // 插入键值对
    scores.insert(String::from("Alice"), 95);
    scores.insert(String::from("Bob"), 82);
    scores.insert(String::from("Carol"), 88);

    // 查找：返回 Option<&V>，因为键可能不存在
    let name = String::from("Alice");
    match scores.get(&name) {
        Some(score) => println!("Alice 的分数：{}", score),
        None        => println!("找不到这个人"),
    }

    // 遍历：顺序是不保证的（哈希表的特性）
    for (name, score) in &scores {
        println!("{}: {}", name, score);
    }
```

**所有权与 HashMap** 的交互值得特别说明。当你把一个 `String` 作为键插入 HashMap，所有权会转移给 HashMap——这和你把值传给函数的行为完全一致：

```rust
let key = String::from("Alice");
let val = 95;

scores.insert(key, val);

// key 的所有权已经转移给 HashMap，不能再用了
// println!("{}", key); // 编译错误！

// val 是 i32，实现了 Copy，所以它被复制进去，原来的 val 仍然有效
println!("{}", val); // OK，输出 95
```

如果你只想让 HashMap 借用而不拥有键，可以插入引用，但那需要确保引用的生命周期比 HashMap 更长——这又回到了借用规则，逻辑是完全一致的。

**几个实用的 HashMap 操作**是你会频繁用到的。比如"只在键不存在时才插入"（避免覆盖已有值）：

```rust
// entry() 返回一个 Entry 枚举，代表"这个键的槽位"
// or_insert() 的意思是：如果这个槽位是空的，就插入这个值
scores.entry(String::from("Dave")).or_insert(70);
scores.entry(String::from("Alice")).or_insert(0); // Alice 已存在，这行什么都不做

// 一个经典用法：统计单词出现次数
let text = "hello world hello rust world hello";
let mut word_count: HashMap<&str, i32> = HashMap::new();

for word in text.split_whitespace() {
    // or_insert 返回对值的可变引用，可以直接修改
    let count = word_count.entry(word).or_insert(0);
    *count += 1;
}

println!("{:?}", word_count);
// 输出类似：{"hello": 3, "world": 2, "rust": 1}
```

这个统计词频的模式非常惯用，值得仔细理解一遍：`entry(word)` 找到或创建这个词的槽位，`or_insert(0)` 如果槽位是空的就初始化为 0 并返回可变引用，`*count += 1` 通过这个可变引用把计数加一。整个过程没有任何重复查找，效率很高。

---

### 三种集合的对比与选择

理解了这三种类型，你在设计数据结构时需要做出选择。`Vec<T>` 适合有序的、按索引访问的数据，插入和删除发生在末尾时性能最好；`HashMap<K, V>` 适合需要通过任意键快速查找的场景，顺序不重要；切片 `&[T]` 则不是一个独立的容器，而是"借用某段已有数据"的方式，适合作为函数参数，让函数同时兼容数组和 Vec。

一个实践中很有用的原则是：**函数参数优先用切片，返回值和存储用 Vec**。比如一个处理数字列表的函数，参数写 `&[i32]` 而不是 `&Vec<i32>`，这样调用者传数组、传 Vec、传 Vec 的一部分都可以，函数更通用。

---

### 一个综合练习

试着用这一节的知识解决这个问题：给定一个整数 Vec，计算它的平均值、中位数（排序后的中间值）和众数（出现次数最多的数）。思考一下：平均值需要什么集合？中位数需要先对 Vec 做什么操作？众数需要用什么集合来辅助统计？

这个练习刚好需要同时用到 Vec 的排序、切片的访问、以及 HashMap 的统计功能，是一个把三者融合在一起的好机会。

---

### 本节小结

`Vec`、切片和 `HashMap` 是你日常写 Rust 时最频繁使用的数据容器。它们都受所有权系统管理，行为和你学过的规则完全一致——没有新的特例需要记忆，这再次体现了 Rust 设计的统一性。切片这个概念尤其值得反复体会，因为它是 Rust 处理"一段数据"的惯用方式，会在你未来读到的几乎所有 Rust 代码里出现。

下一节我们来学 **第八节：错误处理**。此前已经见过 `Result` 和 `Option` 了，但实际使用中有很多技巧和惯用法——比如 `?` 运算符，它能让错误处理代码简洁得像没有错误处理一样，同时又保留了所有的安全性。理解了这个，你才算掌握了 Rust 处理"不完美世界"的哲学。

## 第八节：错误处理

---

### 先建立正确的心态

在 C 里，错误处理是一件"看心情"的事——函数可能返回 `-1`，可能设置全局的 `errno`，可能返回 `NULL`，也可能什么都不说就悄悄出错。调用者完全依赖文档（如果有的话）和自觉（如果够的话）来处理错误。这种松散的约定导致了无数生产环境的 bug：忘记检查返回值、检查了但用错了错误码、或者根本不知道某个函数会失败。

Rust 的立场非常鲜明：**错误是程序逻辑的一部分，不是可以忽略的边角料**。它把错误分成两大类，用完全不同的机制来处理，这两种机制背后有深刻的设计理由。

---

### 两类错误：可恢复的与不可恢复的

第一类是**不可恢复的错误（panic）**。这类错误代表程序进入了一个"不应该发生"的状态，比如数组越界访问、整数除以零、或者手动调用 `panic!` 宏。遇到这类错误，Rust 的处理方式是立刻终止当前线程，打印出错误信息和调用栈，然后退出。这不是 C 里那种"悄悄读到垃圾值"的未定义行为——Rust 宁愿大声崩溃，也不愿意静默地继续运行在一个错误的状态里。

```rust
fn main() {
    let v = vec![1, 2, 3];
    println!("{}", v[10]); // 运行时 panic：index out of bounds
    // 程序在这里终止，打印清晰的错误信息，而不是返回垃圾值
}
```

第二类是**可恢复的错误（Result）**。这类错误是"意料之中的失败"，比如文件不存在、网络超时、用户输入格式不对。这些情况在正常程序里完全可能发生，调用者应该有机会做出合理的响应。这就是你上一节已经初步见到的 `Result<T, E>`。

这两类的分界线其实很直观：如果一个错误意味着"程序的某个前提假设被违反了，继续运行没有意义"，用 panic；如果"这个失败是正常业务流程的一部分，调用者可以处理"，用 Result。

---

### `Result` 的基本用法回顾

先回顾一下 `Result` 的形状，让它在脑子里更清晰：

```rust
// 标准库里 Result 的定义大致如此：
// enum Result<T, E> {
//     Ok(T),   // 成功，携带类型为 T 的结果值
//     Err(E),  // 失败，携带类型为 E 的错误信息
// }

use std::fs;
use std::io;

fn read_username(path: &str) -> Result<String, io::Error> {
    // fs::read_to_string 本身返回 Result<String, io::Error>
    // 我们用 match 来处理两种情况
    match fs::read_to_string(path) {
        Ok(content) => Ok(content.trim().to_string()),
        Err(e) => Err(e), // 把错误"透传"给调用者
    }
```

这段代码是正确的，但你注意到问题了吗？`match fs::read_to_string(path)` 里，成功的时候做了点处理，失败的时候只是原样透传错误。这类"拿到错误就往上传"的模式在实际代码里极其常见，如果每一层都要写这样的 `match`，代码会变得异常啰嗦。这正是 `?` 运算符要解决的问题。

---

### `?` 运算符：错误处理的优雅简写

`?` 是 Rust 里一个非常有用的语法糖，专门用于函数内部的错误传播。它的逻辑是：**如果 Result 是 `Ok(val)`，就把 `val` 取出来继续用；如果是 `Err(e)`，就立刻从当前函数返回 `Err(e)`**。

上面那段代码用 `?` 改写之后变成这样：

```rust
fn read_username(path: &str) -> Result<String, io::Error> {
    // ? 的意思是：如果出错就立刻返回 Err，否则把 Ok 里的值取出来
    let content = fs::read_to_string(path)?;
    Ok(content.trim().to_string())
}
```

两行代码，逻辑完全等价。更妙的是，`?` 可以链式使用——当你有多个可能失败的操作，每一步都加上 `?`，整个函数读起来就像没有错误处理一样流畅，但每一步的错误都被妥善地往上传递了：

```rust
use std::io::{self, Read};
use std::fs::File;

fn read_first_line(path: &str) -> Result<String, io::Error> {
    let mut file = File::open(path)?;       // 打开文件，失败就返回 Err
    let mut content = String::new();
    file.read_to_string(&mut content)?;     // 读取内容，失败就返回 Err
    let first_line = content
        .lines()
        .next()
        .unwrap_or("")
        .to_string();
    Ok(first_line)
}
```

每一个 `?` 背后都隐藏着一个完整的错误检查和提前返回逻辑，但代码读起来就像同步的、线性的流程一样清晰。这正是 Rust 设计哲学的体现：**安全性不应该以牺牲可读性为代价**。

有一个重要的限制：`?` 只能在返回值为 `Result` 或 `Option` 的函数里使用。在 `main` 函数里默认是不能用的——除非你把 `main` 的签名改成 `fn main() -> Result<(), Box<dyn Error>>`，这是 Rust 允许的一种写法，在写小工具或测试代码时很方便。

---

### `unwrap` 和 `expect`：有意识地"不处理"

有时候你在写原型代码或者确实知道某个操作不可能失败，强行写完整的错误处理会分散注意力。这时可以用 `.unwrap()` 或 `.expect()`：

```rust
// unwrap()：如果是 Ok 就取出值，如果是 Err 就 panic
let content = fs::read_to_string("config.txt").unwrap();

// expect()：和 unwrap 一样，但 panic 时会打印你提供的自定义信息
// 调试时比 unwrap 有用得多，因为错误信息更清晰
let content = fs::read_to_string("config.txt")
    .expect("读取 config.txt 失败，请确认文件存在");
```

`unwrap` 和 `expect` 不是"错误处理"——它们是"我知道这里可能出错，但我选择在出错时直接 panic"。在生产代码里应该谨慎使用，但在测试、原型、或者逻辑上真的不可能出错的地方（比如解析一个你自己写死在代码里的字符串），它们是完全合理的工具。`expect` 比 `unwrap` 好一点，因为它强迫你写一句话解释"为什么这里不会出错"——这本身就是一种文档。

---

### 自定义错误类型

随着程序变复杂，你会需要定义自己的错误类型。Rust 里通常用枚举来表达"这个模块可能产生的所有错误类型"：

```rust
// 一个简单的自定义错误枚举
#[derive(Debug)]
enum AppError {
    IoError(io::Error),         // 包裹标准库的 IO 错误
    ParseError(String),         // 解析失败，附带描述
    NotFound(String),           // 资源找不到
}

// 实现 Display trait，让错误信息可以被打印
impl std::fmt::Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            AppError::IoError(e)     => write!(f, "IO 错误：{}", e),
            AppError::ParseError(s)  => write!(f, "解析错误：{}", s),
            AppError::NotFound(name) => write!(f, "找不到：{}", name),
        }

// 实现 From trait，让 io::Error 可以自动转换成 AppError
// 这样在返回 Result<T, AppError> 的函数里，? 运算符就能自动转换错误类型
impl From<io::Error> for AppError {
    fn from(e: io::Error) -> AppError {
        AppError::IoError(e)
    }

fn load_config(path: &str) -> Result<String, AppError> {
    // 因为实现了 From<io::Error>，? 会自动把 io::Error 转换成 AppError
    let content = fs::read_to_string(path)?;
    if content.is_empty() {
        return Err(AppError::ParseError("配置文件为空".to_string()));
    }
    Ok(content)
}
```

这里 `From` trait 和 `?` 运算符的配合非常精妙：`?` 在传播错误时，如果错误类型不匹配，会自动调用 `From::from` 来做转换。这意味着只要你为自己的错误类型实现了 `From<SomeOtherError>`，`?` 就能自动把"别的模块的错误"包裹成"你自己的错误"，不需要手动写任何转换代码。

---

### 错误处理的整体哲学

理解了这些工具，让我们退一步看一下 Rust 的错误处理哲学是什么。C 的错误处理问题根源在于：**错误信息和正常返回值混在一起，通过约定区分，而不是通过类型系统区分**。Rust 把它们彻底分开——`Ok` 里的是正常值，`Err` 里的是错误，类型系统保证你在取出正常值之前必须面对错误的可能性。

这套系统有三个层次的使用方式，分别对应不同的场景。第一层是完整的 `match`，适合你需要针对不同错误类型做不同处理的场景；第二层是 `?` 运算符，适合"我处理不了这个错误，往上传"的场景，也是最常见的；第三层是 `unwrap`/`expect`，适合"这里逻辑上不可能出错"或者"快速原型"的场景，但应该有意识地、有节制地使用。

一个判断"我应该用哪层"的简单心理模型：**问自己"如果这里出错了，调用我的人能做什么"**。如果调用者能做出有意义的响应，就传播错误；如果无论如何都该终止，就 panic；如果你在写测试或原型，就 `expect`。

---

### 思考题

考虑这样一个场景：你在写一个命令行工具，需要读取一个配置文件，解析其中的数字参数，然后进行计算。请思考：读取文件失败、解析数字失败、计算过程中除数为零，这三种错误分别应该用 `Result` 还是 `panic` 来处理？它们各自是"可恢复的"还是"不可恢复的"？

思考这类问题没有唯一答案，但养成"每次出错点都停下来想一想"的习惯，会让你写出更健壮、更易维护的代码。

---

### 本节小结

Rust 的错误处理体系由 `panic`（不可恢复）和 `Result`（可恢复）两根柱子支撑，`?` 运算符是把 `Result` 用得优雅的关键工具，自定义错误枚举加上 `From` trait 是构建大型程序错误体系的标准方式。整套系统的核心思想是：**把错误从"约定"变成"类型"，让编译器帮你检查是否处理了每一种失败可能**。

下一节我们来学 **第九节：泛型与 Trait**。此前已经多次见到 `<T>` 这样的写法了——`Vec<T>`、`Option<T>`、`Result<T, E>`——是时候揭开它的神秘面纱了。泛型让你写出"对任意类型都适用"的代码，而 Trait 则定义了"什么叫做适用"的条件。这两者结合在一起，是 Rust 实现"零成本抽象"的核心机制，也是你迈向真正惯用 Rust 代码的重要一步。
