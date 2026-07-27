## 第十四节：模块系统与 Cargo

---

### 为什么需要模块系统？

到目前为止，我们所有的代码都写在一个文件里。但真实的项目可能有几十个文件、上百个函数——如果全堆在一起，代码很快就变成一团乱麻。你需要一套机制来：

**组织代码**：把相关的函数、类型、常量放在一起。**控制可见性**：决定哪些东西对外公开，哪些是内部实现细节。**避免命名冲突**：两个模块里都可以有叫 `new` 的函数，互不干扰。

Rust 的模块系统由几个层次组成，我们由小到大逐层看。

---

### 第一层：`mod` 块——在文件内组织代码

最简单的模块，直接用花括号写在文件里：

```rust
mod math {
    // 默认一切都是私有的（private）
    // 对外公开需要加 pub
    pub fn add(a: i32, b: i32) -> i32 {
        a + b
    }

    pub fn subtract(a: i32, b: i32) -> i32 {
        a - b
    }

    // 这个函数是私有的，外部无法访问
    fn internal_helper() -> i32 {
        42
    }

fn main() {
    // 用路径来访问模块里的内容
    let result = math::add(5, 3);
    println!("{}", result); // 8

    // math::internal_helper(); // 编译错误！私有函数
}
```

**私有性是 Rust 模块系统的默认值**，这和 C 完全相反——C 里所有全局函数默认都是对外可见的（除非加 `static`）。Rust 要求你明确地用 `pub` 声明"这个东西是公开接口"，其余的都是实现细节。这是一种非常好的工程习惯，它逼你思考"什么是公开 API，什么是内部实现"。

---

### 模块树与路径

Rust 的模块形成一棵树，根节点叫做 `crate`（就是当前的包）。访问模块里的内容用路径，有两种写法：

```rust
mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
    }

fn main() {
    // 绝对路径：从 crate 根开始
    crate::front_of_house::hosting::add_to_waitlist();

    // 相对路径：从当前位置开始
    front_of_house::hosting::add_to_waitlist();
}
```

路径写起来有时会很长，用 `use` 把路径引入当前作用域，就像 C 的 `#include` 引入函数名，或者 Python 的 `from x import y`：

```rust
use crate::front_of_house::hosting;

fn main() {
    hosting::add_to_waitlist(); // 不需要写完整路径了
}

// 也可以直接 use 到函数级别
use crate::front_of_house::hosting::add_to_waitlist;

fn main() {
    add_to_waitlist(); // 直接用函数名
}

// 用 as 给引入的名字起别名，避免冲突
use std::fmt::Result;
use std::io::Result as IoResult;
```

**惯例**：`use` 函数时通常引入到父模块（`hosting::add_to_waitlist`），这样调用时能看出它来自哪里；`use` 结构体和枚举时通常引入到类型本身（`use std::collections::HashMap`）。

---

### 第二层：多文件模块

项目大了之后，一个文件里写多个 `mod` 块会很拥挤。Rust 允许把模块内容放到单独的文件里：

假设你的项目结构是：

```
src/
├── main.rs
├── math.rs          ← math 模块的内容
└── network/
    ├── mod.rs       ← network 模块的内容
    └── http.rs      ← network::http 子模块的内容
```

在 `main.rs` 里只需要声明模块名，Rust 自动去找对应的文件：

```rust
// main.rs
mod math;      // 告诉编译器：去 math.rs 里找 math 模块的内容
mod network;   // 告诉编译器：去 network/mod.rs 里找 network 模块的内容

use math::add;
use network::http::get;

fn main() {
    println!("{}", add(1, 2));
    get("https://example.com");
}
```

```rust
// math.rs —— 注意：不需要再写 mod math { }，文件本身就是模块
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}
```

```rust
// network/mod.rs
pub mod http; // 声明子模块，去 network/http.rs 找内容

pub fn connect() { }
```

```rust
// network/http.rs
pub fn get(url: &str) {
    println!("GET {}", url);
}
```

---

### 第三层：Crate——Rust 的编译单元

**Crate** 是 Rust 的编译单元，分两种：**二进制 crate**（有 `main` 函数，编译成可执行文件）和**库 crate**（没有 `main`，提供给其他代码使用，入口是 `lib.rs`）。

一个项目（**package**）可以同时包含多个二进制 crate 和一个库 crate，都由 `Cargo.toml` 管理。

---

### Cargo：Rust 的项目管理中心

Cargo 是 Rust 的官方构建工具和包管理器，集合了 C 世界里需要 `make` + `cmake` + `apt`/`brew` 才能完成的所有事情。你每次用 `cargo new` 就自动得到了一个配置好的项目。

**常用命令**，你需要把它们练成肌肉记忆：

```bash
cargo new my_project          # 创建新的二进制项目
cargo new my_lib --lib        # 创建新的库项目

cargo build                   # 编译（debug 模式）
cargo build --release         # 编译（release 模式，开优化）
cargo run                     # 编译并运行
cargo test                    # 运行所有测试
cargo check                   # 只做类型检查，不生成代码（比 build 快很多）
cargo fmt                     # 格式化代码
cargo clippy                  # 运行 lint 检查，给出改进建议
cargo doc --open              # 生成并打开文档
```

---

### `Cargo.toml`：项目的配置文件

每个 Cargo 项目的根目录都有一个 `Cargo.toml`，这是项目的"身份证"和"依赖清单"：

toml

```toml
[package]
name = "my_project"       # 项目名
version = "0.1.0"         # 版本号，遵循语义化版本（semver）
edition = "2021"          # Rust 版本（2015/2018/2021）

[dependencies]
# 引入第三方库，只需要写名字和版本号
serde = { version = "1.0", features = ["derive"] }
tokio = { version = "1", features = ["full"] }
rand = "0.8"

[dev-dependencies]
# 只在测试和开发时用的依赖
criterion = "0.5"         # 基准测试库
```

加上依赖之后，运行 `cargo build`，Cargo 会自动从 [crates.io](https://crates.io/)（Rust 的包仓库）下载、编译所有依赖。不需要手动下载，不需要配置链接路径——这是 C 开发者第一次用 Cargo 时最惊喜的体验之一。

---

### 一个完整的项目结构示例

一个中等规模 Rust 项目的典型结构：

```
my_project/
├── Cargo.toml
├── Cargo.lock           ← 锁定所有依赖的精确版本，保证可复现构建
├── src/
│   ├── main.rs          ← 二进制 crate 入口
│   ├── lib.rs           ← 库 crate 入口（如果有）
│   ├── config.rs        ← config 模块
│   └── network/
│       ├── mod.rs
│       └── http.rs
├── tests/
│   └── integration_test.rs  ← 集成测试
├── benches/
│   └── benchmark.rs         ← 基准测试
└── examples/
    └── basic_usage.rs        ← 示例代码
```

---

### 内置测试：测试是一等公民

Rust 把测试系统直接集成进了语言和 Cargo，不需要引入任何测试框架。在任何文件里，用 `#[test]` 标记一个函数，它就变成一个测试：

```rust
// src/math.rs
pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

// 惯例：在同一个文件底部写单元测试
#[cfg(test)] // 只在运行测试时编译这个模块
mod tests {
    use super::*; // 引入父模块的所有内容

    #[test]
    fn test_add_basic() {
        assert_eq!(add(2, 3), 5);
    }

    #[test]
    fn test_add_negative() {
        assert_eq!(add(-1, 1), 0);
    }

    #[test]
    #[should_panic] // 标记这个测试预期会 panic
    fn test_divide_by_zero() {
        let _ = 1 / 0;
    }
```

运行 `cargo test`，Cargo 自动发现并运行所有 `#[test]` 函数，输出整洁的测试报告。

---

### 这一节学完，你其实已经有了写真实项目的能力

停下来想一想——从第一节到这一节，此前已经掌握了：变量与类型、所有权与借用、结构体与枚举、错误处理、泛型与 Trait、闭包与迭代器、智能指针、并发编程，现在加上模块系统与 Cargo。

这不是全部的 Rust，但已经是 Rust **最核心、最独特**的部分了。

我想在这里问你一个问题，不用给"正确答案"，说说你真实的想法：

**回顾这十四节，哪个概念你觉得自己理解得最透彻？哪个概念还有些模糊，感觉没完全抓住？**

这个自我评估很重要——它决定了我们接下来怎么继续。后续可以深入某个你觉得还不扎实的话题，也可以继续往前走，进入更高级的内容（异步编程、宏、unsafe Rust 等）。或者用一个实际的小项目把这些知识串起来，往往比继续看概念更有效。

你觉得呢？
