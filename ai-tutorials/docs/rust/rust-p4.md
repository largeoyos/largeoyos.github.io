## 第九节：泛型与 Trait

---

### 从重复代码说起

假设你需要写一个函数，找出整数列表里的最大值，然后又需要一个找出浮点数列表里最大值的函数。在 C 里你有两个选择：复制粘贴代码改一下类型，或者用 `void*` 指针加上函数指针来模拟泛型——前者导致代码重复，后者丢失类型安全。

Rust 的解决方案是**泛型（Generics）**：写一次代码，让它对多种类型都适用，同时保留完整的类型检查。

---

### 泛型函数

用 `<T>` 来声明一个类型参数，`T` 只是一个占位符名字，你可以叫它任何名字，但惯例上用大写字母：

```rust
// 找出切片中的最大值
// T 是类型参数，表示"某种类型"
fn largest<T>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { // 问题：编译器怎么知道 T 支持 > 比较？
            largest = item;
        }
    largest
}
```

这段代码**无法编译**，编译器会报错说：不知道 `T` 是否支持 `>` 运算符。这个报错正是 Rust 类型系统诚实的体现——你说这个函数对"任意类型 T"都适用，但不是所有类型都能比较大小（比如你自己定义的某个 struct，默认就不支持 `>`）。

要解决这个问题，你需要**约束 T**：告诉编译器"T 必须是支持比较的类型"。这就是 Trait 的用武之地。

---

### Trait：定义共同行为

**Trait** 是 Rust 里定义"某种能力"的机制，类似其他语言里的接口（interface）。一个 Trait 描述了"实现这个 Trait 的类型必须能做什么"。

先看一个自定义 Trait 的例子，建立直觉：

```rust
// 定义一个 Trait：能够描述自己
trait Describable {
    // 方法签名：实现这个 Trait 的类型必须提供这个方法
    fn describe(&self) -> String;

    // Trait 里也可以提供默认实现
    // 实现者可以选择覆盖，也可以直接用默认的
    fn short_description(&self) -> String {
        format!("简短描述：{}", &self.describe()[..20.min(self.describe().len())])
    }

struct Circle {
    radius: f64,
}

struct Rectangle {
    width: f64,
    height: f64,
}

// 为 Circle 实现 Describable
impl Describable for Circle {
    fn describe(&self) -> String {
        format!("圆，半径为 {}", self.radius)
    }

// 为 Rectangle 实现 Describable
impl Describable for Rectangle {
    fn describe(&self) -> String {
        format!("矩形，{}x{}", self.width, self.height)
    }
    // short_description 没有覆盖，用默认实现
}

fn main() {
    let c = Circle { radius: 3.0 };
    let r = Rectangle { width: 4.0, height: 5.0 };

    println!("{}", c.describe());
    println!("{}", r.describe());
}
```

Trait 和 C++ 的虚函数表（vtable）有些相似，但 Rust 更明确地区分了"编译期静态分发"和"运行期动态分发"两种使用方式，下面会看到这个区别。

---

### Trait Bound：约束泛型类型

有了 Trait 的概念，我们可以回头修复之前的 `largest` 函数。`PartialOrd` 是标准库里表示"可以比较大小"的 Trait，`Copy` 是表示"可以按位复制"的 Trait：

```rust
// T: PartialOrd 是 Trait Bound，意思是"T 必须实现 PartialOrd"
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { // 现在编译器知道 T 支持 >，可以编译了
            largest = item;
        }
    largest
}

fn main() {
    let numbers = vec![34, 50, 25, 100, 65];
    println!("最大值：{}", largest(&numbers));

    let chars = vec!['y', 'm', 'a', 'q'];
    println!("最大字符：{}", largest(&chars));
}
```

Trait Bound 的语法还有另一种更清晰的写法，叫做 `where` 子句，当约束比较复杂时可读性更好：

```rust
// 两种写法等价，where 子句在约束复杂时更清晰
fn largest<T>(list: &[T]) -> &T
where
    T: PartialOrd,
{
    // ...
}

// 多个 Trait Bound 用 + 连接
fn print_and_compare<T>(a: T, b: T)
where
    T: PartialOrd + std::fmt::Display,
{
    if a > b {
        println!("{} 更大", a);
    } else {
        println!("{} 更大", b);
    }
```

---

### 泛型结构体和泛型枚举

泛型不只用于函数，struct 和 enum 也可以是泛型的。事实上此前已经用了很多泛型类型——`Vec<T>`、`Option<T>`、`Result<T, E>` 都是泛型枚举或结构体。来看一个自定义泛型 struct：

```rust
// 一个可以存储任意类型的点
struct Point<T> {
    x: T,
    y: T,
}

// impl 块也需要声明类型参数
impl<T> Point<T> {
    fn new(x: T, y: T) -> Self {
        Point { x, y }
    }

    fn x(&self) -> &T {
        &self.x
    }

// 可以为特定类型的 Point 单独实现方法
// 这个方法只对 Point<f64> 有效，Point<i32> 没有这个方法
impl Point<f64> {
    fn distance_from_origin(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

fn main() {
    let int_point = Point::new(5, 10);
    let float_point = Point::new(3.0, 4.0);

    println!("x = {}", int_point.x());
    println!("距原点：{}", float_point.distance_from_origin()); // 5.0
    // int_point.distance_from_origin(); // 编译错误！i32 版本没有这个方法
}
```

---

### 零成本抽象：单态化

这里值得停下来解释一个重要概念，因为它解释了为什么 Rust 的泛型"免费"——不像某些语言的泛型有运行时开销。

Rust 的泛型通过**单态化（monomorphization）**实现。编译器在编译时会查看你实际用了哪些具体类型，然后为每种类型生成一份具体的代码。比如你用了 `largest(&numbers)`（`i32`）和 `largest(&chars)`（`char`），编译器实际上生成了两个函数：`largest_i32` 和 `largest_char`。最终的机器码里没有任何泛型，就像你手写了两个具体类型的函数一样高效。

这就是"零成本抽象"的含义：**你用泛型写代码的便利，不会带来任何运行时性能损失**。代价只是编译时间稍长（因为要生成更多代码），以及编译出的二进制文件稍大。

---

### 动态分发：`dyn Trait`

单态化是"静态分发"——在编译期就确定了调用哪个具体实现。但有时候你需要在**运行时**才能确定类型，比如你想把不同类型的图形存到同一个 Vec 里：

```rust
trait Shape {
    fn area(&self) -> f64;
}

struct Circle { radius: f64 }
struct Rectangle { width: f64, height: f64 }

impl Shape for Circle {
    fn area(&self) -> f64 { std::f64::consts::PI * self.radius * self.radius }
}

impl Shape for Rectangle {
    fn area(&self) -> f64 { self.width * self.height }
}

fn main() {
    // Box<dyn Shape> 是一个"trait 对象"
    // dyn 表示动态分发，Box 是堆分配的智能指针（下一节会详细讲）
    // 这个 Vec 可以存放任何实现了 Shape 的类型
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 3.0 }),
        Box::new(Rectangle { width: 4.0, height: 5.0 }),
        Box::new(Circle { radius: 1.0 }),
    ];

    let total_area: f64 = shapes.iter().map(|s| s.area()).sum();
    println!("总面积：{:.2}", total_area);
}
```

`Box<dyn Shape>` 是一个 **trait 对象**，在内存里它是一个"胖指针"：一个指向数据的指针，加上一个指向该类型方法表（vtable）的指针。通过 vtable，Rust 在运行时查找并调用正确的方法实现。这和 C++ 的虚函数机制非常类似，确实有一点运行时开销（一次指针间接寻址），但换来了运行时的灵活性。

**静态分发（泛型）vs 动态分发（dyn Trait）的选择原则**：如果在编译期就知道所有可能的类型，用泛型，性能更好；如果需要在运行时处理不同类型的混合集合，或者为了减小编译产物大小，用 trait 对象。

---

### 标准库里的重要 Trait

熟悉标准库里常用的 Trait，能让你读懂大量 Rust 代码。几个最值得了解的：

`Display` 和 `Debug` 控制类型如何被打印。`Display` 是面向用户的输出（`{}`），`Debug` 是面向开发者的调试输出（`{:?}`）。`Clone` 允许显式深拷贝（`.clone()`）。`Copy` 标记类型可以隐式按位复制（实现了 Copy 的类型赋值时不发生 Move）。`Iterator` 是迭代器协议的核心，实现它就能使用所有的迭代器适配器（`map`、`filter`、`collect` 等）。`From` 和 `Into` 定义类型转换，上一节我们已经看到 `From` 和 `?` 运算符配合的威力。

这些 Trait 构成了 Rust 生态的"通用语言"——第三方库的类型也实现这些 Trait，让它们能无缝融入标准的 Rust 代码模式中。

---

### 一个把所有东西串起来的例子

```rust
use std::fmt::Display;

// 泛型结构体，T 必须实现 Display 和 PartialOrd
struct Pair<T> {
    first: T,
    second: T,
}

impl<T: Display + PartialOrd> Pair<T> {
    fn new(first: T, second: T) -> Self {
        Pair { first, second }
    }

    // 打印出较大的那个
    fn print_larger(&self) {
        if self.first >= self.second {
            println!("较大值是：{}", self.first);
        } else {
            println!("较大值是：{}", self.second);
        }

fn main() {
    let pair = Pair::new(5, 10);
    pair.print_larger(); // 较大值是：10

    let pair2 = Pair::new("apple", "banana");
    pair2.print_larger(); // 较大值是：banana
}
```

这个例子展示了泛型、Trait Bound、`impl` 块这三者协同工作的完整形态：`Pair<T>` 对任意满足约束的类型都有效，约束（`Display + PartialOrd`）精确地表达了"这个方法需要 T 能做什么"，编译器在使用时验证约束是否满足。

---

### 本节小结

泛型让你用一份代码服务多种类型，Trait 定义了类型必须具备的能力，Trait Bound 把两者连接起来，告诉编译器"泛型类型需要满足什么条件"。静态分发（单态化）带来零成本抽象，动态分发（`dyn Trait`）带来运行时灵活性，两者各有适用场景。

这是 Rust 里最接近"面向对象编程"思想的部分，但 Rust 选择了 Trait 而不是继承——组合优于继承，能力约束优于类型层级，这让代码更灵活、更易于理解。

下一节我们来学 **第十节：生命周期（Lifetime）**。这是 Rust 里最后一个让初学者感到陌生的核心概念，也是编译器能保证"不存在悬空引用"这一承诺背后真正的机制。理解了生命周期，你对 Rust 的所有权体系就有了完整的认识，之后学习任何 Rust 特性都会更加游刃有余。

## 第十节：生命周期（Lifetime）

---

### 为什么需要生命周期？

我们在第四节学了引用和借用，知道编译器能保证引用永远有效——你不可能拿到一个悬空引用。但编译器是怎么做到这一点的？它怎么知道一个引用"活得够不够长"？

答案就是**生命周期（Lifetime）**。生命周期是编译器追踪"每个引用在哪个范围内有效"的机制。大多数时候这个追踪是自动的、隐式的，你根本感觉不到它的存在。但在某些情况下，编译器的信息不够，需要你显式地告诉它引用之间的关系——这就是生命周期标注（lifetime annotation）出现的原因。

---

### 先建立直觉：编译器在追踪什么

来看一个简单的例子，感受编译器是如何推断引用有效性的：

```rust
fn main() {
    let r;                    // ── r 的生命周期开始

    {
        let x = 5;            // ── x 的生命周期开始
        r = &x;               //    r 指向 x
    }                         // ── x 的生命周期结束，x 被 drop

    println!("{}", r);        // 错误！r 指向的 x 已经不存在了
}                             // ── r 的生命周期结束
```

编译器报错：`x does not live long enough`。它发现 `r` 的生命周期比 `x` 更长——`r` 想在 `x` 已经消失之后继续使用，这是矛盾的，直接拒绝编译。

这个检查背后有一个核心原则：**引用的生命周期不能超过它所指向的数据的生命周期**。编译器里负责执行这条原则的组件叫做**借用检查器（borrow checker）**。

---

### 什么时候需要显式标注？

大多数时候借用检查器能自动推断，不需要你写任何生命周期标注。但有一种情况它无法自动推断：**当函数接受多个引用参数，并返回一个引用时，编译器不知道返回的引用来自哪个参数**。

来看一个经典例子——返回两个字符串切片中较长的那个：

```rust
// 这段代码无法编译
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
```

编译器报错，要求你加上生命周期标注。为什么？因为编译器看到函数返回了一个 `&str`，但它不知道这个 `&str` 是来自 `x` 还是来自 `y`——这在编译期确实无法确定，因为返回哪个取决于运行时的长度比较结果。

如果编译器不知道返回的引用来自哪里，它就无法验证"返回值的生命周期是否合法"——调用者拿到返回值之后，会用多久？那个被返回的引用指向的数据，还会存在那么久吗？这些问题编译器都无法回答，所以它要求你给出答案。

---

### 生命周期标注语法

生命周期参数以 `'` 开头，后面跟一个小写字母或单词，惯例上用 `'a`、`'b`。标注放在 `&` 后面：

```rust
&i32        // 普通引用
&'a i32     // 有生命周期 'a 的引用
&'a mut i32 // 有生命周期 'a 的可变引用
```

给 `longest` 加上生命周期标注：

```rust
// 'a 是一个生命周期参数，在函数名后的 <'a> 里声明
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}
```

这个标注的含义是：**返回的引用的生命周期，和 `x`、`y` 中较短的那个一样长**。更准确地说，`'a` 代表 `x` 和 `y` 的生命周期的**交集**——它们都有效的那段时间。返回的引用在这段时间内保证有效。

注意：生命周期标注**不改变任何引用实际存活多久**——引用的实际生命周期由代码结构决定，不会因为你写了标注而改变。标注只是告诉编译器"这几个引用的生命周期之间有这样的关系"，让编译器能做后续的验证。

---

### 生命周期标注在调用处如何生效

来看生命周期标注在实际调用时如何被验证：

```rust
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let string1 = String::from("long string");
    let result;

    {
        let string2 = String::from("xyz");
        // 'a 被具体化为 string1 和 string2 生命周期的交集
        // 也就是 string2 的生命周期（较短的那个）
        result = longest(string1.as_str(), string2.as_str());
        println!("{}", result); // OK：在 string2 还活着的时候使用
    }
    // string2 在这里已经 drop 了
    // println!("{}", result); // 编译错误！result 的有效期不超过 string2
}
```

编译器把 `'a` 对应到 `string1` 和 `string2` 中较短的那个（`string2`），然后验证返回值 `result` 是否在 `string2` 的生命周期内使用。如果你在 `string2` 作用域结束后使用 `result`，编译器立刻报错。

---

### 结构体里的生命周期

当结构体包含引用字段时，你必须给每个引用字段标注生命周期，告诉编译器"这个结构体实例的存活时间不能超过它所引用的数据"：

```rust
// ImportantExcerpt 存储了一个对字符串的引用
// 'a 标注保证：这个结构体的实例，不能比它引用的字符串活得更长
struct ImportantExcerpt<'a> {
    part: &'a str,
}

impl<'a> ImportantExcerpt<'a> {
    fn announce(&self, announcement: &str) -> &str {
        println!("注意：{}", announcement);
        self.part // 返回 self.part，生命周期从 self 继承
    }

fn main() {
    let novel = String::from("从前有座山。山上有座庙。");
    let first_sentence;

    {
        let i = novel
            .split('。')
            .next()
            .expect("找不到句号");
        // ImportantExcerpt 引用了 novel 里的数据
        first_sentence = ImportantExcerpt { part: i };
    }
    // novel 在整个 main 里有效，所以 first_sentence 使用是安全的
    println!("{}", first_sentence.part);
}
```

---

### 生命周期省略规则

你可能注意到，我们之前写过很多接受引用参数的函数，比如：

```rust
fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &byte) in bytes.iter().enumerate() {
        if byte == b' ' {
            return &s[..i];
        }
    &s[..]
}
```

这个函数也接受引用、也返回引用，但我们没有写生命周期标注，它却能编译。为什么？

因为 Rust 有一套**生命周期省略规则（lifetime elision rules）**，对常见的模式自动推断生命周期，让你不必每次都手动标注。规则有三条，编译器按顺序尝试应用：

第一条：**每个引用参数都有自己独立的生命周期**。`fn foo(x: &str, y: &str)` 等价于 `fn foo<'a, 'b>(x: &'a str, y: &'b str)`。

第二条：**如果只有一个引用参数，那么返回值的生命周期和这个参数相同**。`fn foo(x: &str) -> &str` 等价于 `fn foo<'a>(x: &'a str) -> &'a str`。这正是 `first_word` 能省略标注的原因——只有一个引用参数，返回值的生命周期自然跟它一样。

第三条：**如果有多个引用参数，但其中一个是 `&self` 或 `&mut self`，那么返回值的生命周期和 `self` 相同**。这覆盖了方法通常返回 `self` 里的数据的常见情况。

这三条规则覆盖了绝大多数情况，只有在规则无法自动推断时（比如 `longest` 那样有多个引用参数且不是方法），才需要手动标注。

---

### `'static` 生命周期

有一个特殊的生命周期值得单独提一下：`'static`，表示"在程序的整个运行期间都有效"。字符串字面量的类型就是 `&'static str`——它们被编译进二进制文件的只读数据段，程序运行期间一直存在：

```rust
let s: &'static str = "我永远有效"; // 字符串字面量
```

你有时会在编译错误信息里看到编译器建议你"加上 `'static` 约束"。**不要无脑地照做**——`'static` 是一个很强的要求，意思是"这个引用必须活到程序结束"，通常不是你真正想要的。更好的做法是思考为什么编译器认为生命周期不够长，从根本上修复问题。

---

### 生命周期、泛型、Trait Bound 的综合使用

这三者可以出现在同一个函数签名里，这是 Rust 里相对复杂的函数签名，但每一部分你现在都能读懂了：

```rust
use std::fmt::Display;

// 'a 是生命周期参数
// T 是类型参数，有 Display + PartialOrd 两个 Trait Bound
fn longest_with_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    announcement: T,
) -> &'a str
where
    T: Display,
{
    println!("公告：{}", announcement);
    if x.len() > y.len() { x } else { y }
}
```

看到这样的函数签名不要慌，拆开读：`'a` 说明了引用参数和返回值的生命周期关系，`T: Display` 说明了 `announcement` 必须能被打印，函数体的逻辑和没有这些标注时完全一样。

---

### 生命周期的心理模型

学到这里，你可能感觉生命周期是一个需要死记硬背的复杂系统。其实不是——它有一个非常直观的心理模型：

**生命周期标注是一种"契约"**。`fn longest<'a>(x: &'a str, y: &'a str) -> &'a str` 这个签名是在向编译器和调用者做一个承诺：_我保证，只要 x 和 y 都还有效，我的返回值就有效_。编译器负责验证函数体是否兑现了这个承诺，调用者负责在使用返回值时遵守这个契约。

你不需要记住"'a 代表什么时间段"，只需要思考**引用之间的依赖关系**：这个返回的引用，依赖于哪个参数的数据？把这个依赖关系用生命周期标注表达出来，编译器就能做剩下的验证工作。

---

### 本节小结

生命周期是借用检查器的"语言"——编译器用它来追踪引用的有效范围，保证不存在悬空引用。大多数时候省略规则会自动处理，只有在"多个引用参数且有引用返回值"的情况下才需要手动标注。生命周期标注不改变代码的运行行为，只是把引用之间的依赖关系明确地告诉编译器。

至此，Rust 最核心的三个独特概念——**所有权、借用、生命周期**——已经全部学完了。它们共同构成了 Rust 内存安全保证的基础，理解了它们，你对 Rust 的认知就从"这个语言有很多奇怪的限制"转变为"这些限制是一套自洽的逻辑系统，每一条都有其深刻的理由"。

接下来的内容会更加实用，也会更有趣。下一节我们学 **第十一节：闭包与迭代器**——Rust 里最能体现"零成本抽象"之美的两个特性。闭包让你可以把"行为"像数据一样传递，迭代器让你用声明式的方式处理数据流，两者结合在一起写出的代码，既比手写循环更简洁，编译出来又和手写循环一样高效。

## 第十一节：闭包与迭代器

---

### 闭包：把"行为"当作值来传递

你在 C 里用过函数指针吗？比如 `qsort` 的比较函数：

```c
int compare(const void* a, const void* b) {
    return *(int*)a - *(int*)b;
}
qsort(arr, n, sizeof(int), compare);
```

闭包解决的是同一个问题——把"行为"传给别人——但它能做到函数指针做不到的事：**捕获周围环境里的变量**。

先看语法，和普通函数对比：

```rust
// 普通函数
fn add_two(x: i32) -> i32 {
    x + 2
}

// 等价的闭包：用 |参数| 表达式 的语法
let add_two = |x| x + 2;

// 调用方式完全一样
println!("{}", add_two(5)); // 7
```

闭包的类型大多数时候可以省略，编译器根据上下文推断。如果需要显式写出来：

```rust
let add_two = |x: i32| -> i32 { x + 2 };
```

---

### 闭包最关键的能力：捕获环境

函数指针做不到的事，闭包可以做——直接使用周围作用域里的变量：

```rust
fn main() {
    let threshold = 10; // 外部变量

    // 闭包"捕获"了 threshold，不需要通过参数传入
    let is_large = |x| x > threshold;

    println!("{}", is_large(5));  // false
    println!("{}", is_large(15)); // true

    // 用函数指针就做不到这一点——函数没法直接引用外部的局部变量
}
```

捕获变量的方式有三种，对应此前已经熟悉的所有权概念：

**不可变借用**（最常见）：闭包只读取外部变量，自动以 `&T` 的方式捕获。

**可变借用**：闭包需要修改外部变量，以 `&mut T` 的方式捕获。

**获取所有权**：用 `move` 关键字，把外部变量的所有权移入闭包，常用于多线程场景。

```rust
fn main() {
    let mut count = 0;

    // 可变借用捕获：闭包修改 count
    let mut increment = || {
        count += 1;
        println!("count = {}", count);
    };

    increment(); // count = 1
    increment(); // count = 2
    // 注意：increment 存活期间，不能再用其他方式访问 count
    // 因为它持有 count 的可变引用
    drop(increment); // 显式 drop 掉闭包，释放借用

    println!("最终 count = {}", count); // 现在可以再访问 count 了
}
```

```rust
use std::thread;

fn main() {
    let message = String::from("hello from thread");

    // move 把 message 的所有权移入闭包
    // 因为新线程的生命周期可能超过当前作用域，必须拥有所有权
    let handle = thread::spawn(move || {
        println!("{}", message);
    });

    // println!("{}", message); // 编译错误！所有权已经移入线程
    handle.join().unwrap();
}
```

---

### 闭包作为函数参数：Fn、FnMut、FnOnce

当你把闭包传给函数时，参数类型怎么写？Rust 用三个 Trait 来描述闭包的"调用方式"：

`Fn`：可以不可变地调用任意多次（只读捕获）。`FnMut`：可以可变地调用任意多次（可变捕获）。`FnOnce`：只能调用一次（消耗了捕获的变量）。

三者是包含关系：`Fn` 最严格（也最通用），`FnOnce` 最宽松。如果你不确定用哪个，先试 `Fn`，编译器会告诉你是否需要放宽。

```rust
// 接受任何"把 i32 变成 i32"的闭包
fn apply_twice<F: Fn(i32) -> i32>(f: F, x: i32) -> i32 {
    f(f(x))
}

fn main() {
    let double = |x| x * 2;
    let add_three = |x| x + 3;

    println!("{}", apply_twice(double, 5));    // 20：5 -> 10 -> 20
    println!("{}", apply_twice(add_three, 5)); // 11：5 -> 8 -> 11
}
```

---

### 迭代器：声明式地处理数据流

现在进入本节的第二个主角。先问你一个问题：下面两种写法，你觉得哪种更清晰？

```rust
// 命令式：告诉计算机"怎么做"
let numbers = vec![1, 2, 3, 4, 5, 6];
let mut result = Vec::new();
for &n in &numbers {
    if n % 2 == 0 {
        result.push(n * n);
    }

// 声明式：告诉计算机"要什么"
let result: Vec<i32> = numbers.iter()
    .filter(|&&n| n % 2 == 0)
    .map(|&n| n * n)
    .collect();
```

两段代码做的事完全一样：筛选出偶数，然后求平方。第二种写法更短，意图更直白——而且**编译出来的机器码和第一种一样快**。这就是零成本抽象。

迭代器的核心是 `Iterator` Trait，它只要求实现一个方法：

```rust
trait Iterator {
    type Item;                          // 关联类型：每次迭代产出的值的类型
    fn next(&mut self) -> Option<Self::Item>; // 每次调用返回下一个值，没有了就返回 None
}
```

`for` 循环本质上就是反复调用 `next()`，直到得到 `None`。你手写的 `for n in &vec` 和迭代器链在底层是同一回事。

---

### 最常用的迭代器适配器

**`map`**：对每个元素做变换，返回新迭代器。

**`filter`**：保留满足条件的元素，返回新迭代器。

**`enumerate`**：附加索引，每个元素变成 `(index, value)` 对。

**`zip`**：把两个迭代器逐元素配对。

**`flat_map`**：每个元素产生一个迭代器，然后把所有迭代器展平。

**`take` / `skip`**：取前 n 个 / 跳过前 n 个。

这些方法都是**懒惰的（lazy）**——调用它们不会立刻执行任何计算，只是构建了一个"计算描述"。只有当你调用**消费适配器**时，整条链才真正运行：

```rust
let v = vec![1, 2, 3, 4, 5];

// 这里什么都没有发生，只是构建了计划
let chain = v.iter().map(|x| x * 2).filter(|x| x > &4);

// collect() 是消费适配器，触发整条链的执行
let result: Vec<i32> = chain.collect();
println!("{:?}", result); // [6, 8, 10]
```

其他常用的消费适配器：

```rust
let v = vec![1, 2, 3, 4, 5];

// sum：求和
let total: i32 = v.iter().sum();

// count：计数
let count = v.iter().filter(|&&x| x > 2).count(); // 3

// any / all：存在性和全称判断
let has_even = v.iter().any(|&x| x % 2 == 0);  // true
let all_pos  = v.iter().all(|&x| x > 0);        // true

// find：找第一个满足条件的元素，返回 Option
let first_even = v.iter().find(|&&x| x % 2 == 0); // Some(2)

// fold：通用的"积累"操作，相当于其他语言的 reduce
let product = v.iter().fold(1, |acc, &x| acc * x); // 1*1*2*3*4*5 = 120
```

---

### 一个综合例子：闭包 + 迭代器

来看一个稍微复杂的例子，感受闭包和迭代器协同工作的优雅：

```rust
fn main() {
    let words = vec!["hello", "world", "rust", "is", "great", "and", "fast"];

    // 找出长度大于 3 的单词，转成大写，按字母排序，取前 3 个
    let mut result: Vec<String> = words.iter()
        .filter(|w| w.len() > 3)       // 筛选：长度 > 3
        .map(|w| w.to_uppercase())     // 变换：转大写
        .collect();                    // 先收集，因为排序需要可变访问

    result.sort();                     // 排序

    let top3: Vec<&String> = result.iter().take(3).collect();

    println!("{:?}", top3); // ["FAST", "GREAT", "HELLO"]
}
```

注意这里有一个小细节：为什么不能直接在迭代器链末尾加 `.sort()`？因为 `sort` 需要随机访问整个集合（它需要知道全部元素才能排序），而迭代器是懒惰的流式处理，不支持随机访问。所以需要先 `collect()` 成 `Vec`，再排序。这是使用迭代器时需要建立的直觉：**流式操作和整体操作不能混用**。

---

### 自己实现一个迭代器

理解了 `Iterator` Trait 之后，你可以给自己的类型实现迭代器。这能让你的类型融入 Rust 整个迭代器生态，自动获得所有适配器方法：

```rust
struct Counter {
    count: u32,
    max: u32,
}

impl Counter {
    fn new(max: u32) -> Counter {
        Counter { count: 0, max }
    }

impl Iterator for Counter {
    type Item = u32;

    fn next(&mut self) -> Option<u32> {
        if self.count < self.max {
            self.count += 1;
            Some(self.count)
        } else {
            None
        }

fn main() {
    let counter = Counter::new(5);

    // 实现了 Iterator，所有适配器方法都自动可用！
    let sum: u32 = counter
        .zip(Counter::new(5).skip(1)) // 把两个计数器配对，跳过第一个
        .map(|(a, b)| a * b)          // 逐对相乘
        .filter(|x| x % 3 == 0)       // 筛选 3 的倍数
        .sum();

    println!("{}", sum); // 试着自己推导一下这个值是多少
}
```

只需要实现一个 `next` 方法，你的类型就自动获得了几十个迭代器方法。这是 Trait 系统强大能力的典型展示。

---

### 思考题

最后留一个思考题，试着不运行代码先推导答案：

```rust
let v = vec![1, 2, 3];
let v2: Vec<_> = v.iter().map(|x| x * 2).collect();
println!("{:?}", v); // v 还能用吗？
```

`v` 在 `collect()` 之后还能使用吗？想一想：`.iter()` 产生的是什么——是对 `v` 的借用，还是消耗了 `v` 的所有权？如果换成 `.into_iter()` 呢？

---

### 本节小结

闭包是"带着捕获变量的函数"，迭代器是"懒惰的数据流处理管道"。两者结合，让你用声明式、组合式的方式写出既简洁又高效的数据处理代码。记住最重要的两点：迭代器是懒惰的，必须有消费适配器才会执行；闭包捕获变量的方式遵循此前已经熟悉的借用规则，没有任何特例。

下一节我们学 **第十二节：智能指针**。你一直看到 `Box<T>` 出现在 `Box<dyn Trait>` 里，但还没有深入了解它。Rust 里的智能指针——`Box`、`Rc`、`Arc`、`RefCell`——是在所有权规则的"边界情况"下工作的工具，理解了它们，你才能处理那些单纯靠所有权规则无法优雅表达的数据结构，比如树、图、或者需要共享状态的并发程序。
