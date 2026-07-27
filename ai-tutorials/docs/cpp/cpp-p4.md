## C++20：史上最大版本之一

C++20 的四大特性彻底改变了 C++ 的写法。每一个都值得单独讲透。

---

### 1. Concepts（概念）：给模板加约束

**问题**：C++17 的模板报错信息是噩梦——类型不满足要求时，错误信息可能有几十行，完全看不出哪里错了。

```cpp
// C++17：传错类型，报错信息是天书
template<typename T>
T sum(std::vector<T>& v) {
    return std::accumulate(v.begin(), v.end(), T{});
}

std::vector<std::string> vs = {"a", "b"};
// sum(vs) → 几十行模板实例化错误，根本不知道哪里错
```

**Concepts 定义约束**：

```cpp
#include <concepts>

// 使用标准库预定义 concept
template<std::integral T>          // T 必须是整数类型
T factorial(T n) {
    return n <= 1 ? 1 : n * factorial(n - 1);
}

template<std::floating_point T>    // T 必须是浮点类型
T circle_area(T r) {
    return std::numbers::pi_v<T> * r * r;
}

factorial(5);     // ✓ int 满足 integral
factorial(3.14);  // ✗ 编译错误：double 不满足 integral
                  // 报错信息：直接说"不满足 std::integral"，清晰！
```

**自定义 Concept**：

```cpp
// 定义一个 concept：要求类型支持 < 和 ==
template<typename T>
concept Comparable = requires(T a, T b) {
    { a < b } -> std::convertible_to<bool>;
    { a == b } -> std::convertible_to<bool>;
};

// 定义一个 concept：要求容器有 begin/end/size
template<typename C>
concept Container = requires(C c) {
    c.begin();
    c.end();
    c.size();
    typename C::value_type;   // 必须有 value_type 类型
};

// 使用自定义 concept
template<Container C>
void printContainer(const C& c) {
    for (auto& x : c) std::cout << x << " ";
    std::cout << "\n";
}

// 组合 concept
template<typename T>
concept Sortable = Container<T> && Comparable<typename T::value_type>;

template<Sortable C>
void mySort(C& c) {
    std::sort(c.begin(), c.end());
}
```

**四种等价写法**（从最简到最细）：

```cpp
// 写法1：concept 直接替换 typename（最简洁）
template<std::integral T>
T add(T a, T b) { return a + b; }

// 写法2：requires 子句
template<typename T> requires std::integral<T>
T add(T a, T b) { return a + b; }

// 写法3：缩写函数模板（最简洁，适合简单情况）
auto add(std::integral auto a, std::integral auto b) { return a + b; }

// 写法4：requires 表达式（最灵活，可组合复杂约束）
template<typename T>
    requires requires(T a, T b) { a + b; }
T add(T a, T b) { return a + b; }
```

---

### 2. Ranges（范围库）：管道式算法

**问题**：C++17 的算法要传迭代器对，冗长且无法组合。

```cpp
// C++17：找出偶数，乘以 2，取前 5 个
// 中间结果要存临时容器，写起来很啰嗦
std::vector<int> v = {1,2,3,4,5,6,7,8,9,10};
std::vector<int> evens, doubled, result;

std::copy_if(v.begin(), v.end(), std::back_inserter(evens),
    [](int x){ return x % 2 == 0; });
std::transform(evens.begin(), evens.end(), std::back_inserter(doubled),
    [](int x){ return x * 2; });
result.assign(doubled.begin(),
    doubled.begin() + std::min(5, (int)doubled.size()));
```

**C++20 Ranges：管道符 `|` 链式组合，惰性求值**：

```cpp
#include <ranges>

std::vector<int> v = {1,2,3,4,5,6,7,8,9,10};

// 一行，惰性求值，无临时容器
auto result = v
    | std::views::filter([](int x){ return x % 2 == 0; })
    | std::views::transform([](int x){ return x * 2; })
    | std::views::take(5);

for (int x : result)
    std::cout << x << " ";   // 4 8 12 16 20
```

**常用 Views**：

```cpp
std::vector<int> v = {3,1,4,1,5,9,2,6,5,3};

// 反转
for (int x : v | std::views::reverse)
    std::cout << x << " ";   // 3 5 6 2 9 5 1 4 1 3

// 跳过前3个，取4个
for (int x : v | std::views::drop(3) | std::views::take(4))
    std::cout << x << " ";   // 1 5 9 2

// 生成无限序列（惰性，不会真的生成无限个）
auto squares = std::views::iota(1)                    // 1,2,3,4,...（无限）
             | std::views::transform([](int x){ return x*x; })
             | std::views::take(5);
for (int x : squares)
    std::cout << x << " ";   // 1 4 9 16 25

// 枚举（带下标）
std::vector<std::string> words = {"apple","banana","cherry"};
for (auto [i, w] : std::views::enumerate(words))   // C++23，但思路一致
    std::cout << i << ":" << w << " ";

// zip：同时遍历两个容器
std::vector<int>    ids   = {1, 2, 3};
std::vector<string> names = {"Alice","Bob","Charlie"};
for (auto [id, name] : std::views::zip(ids, names))
    std::cout << id << "-" << name << "\n";
```

**直接用范围版本的算法**（不用传迭代器）：

```cpp
std::vector<int> v = {3,1,4,1,5,9};

// C++17
std::sort(v.begin(), v.end());

// C++20：直接传容器
std::ranges::sort(v);
auto it = std::ranges::find(v, 5);
bool has9 = std::ranges::contains(v, 9);
```

---

### 3. 协程（Coroutines）：异步代码写成同步风格

协程是"可以暂停和恢复的函数"。三个关键字：`co_await`、`co_yield`、`co_return`。

**概念理解**：

```
普通函数：调用 → 执行 → 返回（一次性）

协程：    调用 → 执行一部分 → 暂停（挂起）→ 恢复 → 继续执行 → 返回
                              ↑
                         调用者可以在这里做其他事
```

**`co_yield`：生成器（Generator）**

```cpp
#include <coroutine>

// 简化版 Generator（实际项目可用库封装好的）
template<typename T>
struct Generator {
    struct promise_type {
        T current;
        auto get_return_object() { return Generator{this}; }
        auto initial_suspend() { return std::suspend_always{}; }
        auto final_suspend() noexcept { return std::suspend_always{}; }
        auto yield_value(T v) {
            current = v;
            return std::suspend_always{};
        }
        void return_void() {}
        void unhandled_exception() { std::terminate(); }
    };

    using Handle = std::coroutine_handle<promise_type>;
    Handle handle;
    Generator(promise_type* p) : handle(Handle::from_promise(*p)) {}
    ~Generator() { if (handle) handle.destroy(); }

    bool next() { handle.resume(); return !handle.done(); }
    T    value(){ return handle.promise().current; }
};

// 用 co_yield 写无限序列生成器
Generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;          // 暂停，把 a 的值交给调用者
        auto tmp = a + b;
        a = b;
        b = tmp;
    }

// 使用：像迭代器一样按需取值
auto fib = fibonacci();
for (int i = 0; i < 8; i++) {
    fib.next();
    std::cout << fib.value() << " ";   // 0 1 1 2 3 5 8 13
}
```

**`co_await`：异步等待（核心用法）**

```cpp
// 伪代码风格演示思路（实际需要配合 io 框架如 asio）

// 没有协程：回调地狱
void fetchData(std::string url, Callback cb) {
    httpGet(url, [cb](Response r1) {
        parseJson(r1.body, [cb](Json j) {
            dbQuery(j["id"], [cb](DbResult result) {
                cb(result);   // 逻辑被切成三段，难以阅读
            });
}

// 有了协程：写成同步风格，实际是异步执行
Task<DbResult> fetchData(std::string url) {
    Response r1 = co_await httpGet(url);       // 暂停，等网络
    Json     j  = co_await parseJson(r1.body); // 暂停，等解析
    DbResult r  = co_await dbQuery(j["id"]);   // 暂停，等数据库
    co_return r;                               // 返回结果
}
// 线程从不阻塞，等待期间可以处理其他请求
```

**`co_yield` 实际应用——惰性范围**：

```cpp
// 按需生成，不预先计算全部
Generator<int> range(int start, int end, int step = 1) {
    for (int i = start; i < end; i += step)
        co_yield i;
}

Generator<int> filter(Generator<int> src, auto pred) {
    while (src.next())
        if (pred(src.value()))
            co_yield src.value();
}

// 只计算实际用到的值
auto evens = filter(range(0, 1000000), [](int x){ return x % 2 == 0; });
for (int i = 0; i < 5 && evens.next(); i++)
    std::cout << evens.value() << " ";   // 0 2 4 6 8
```

---

### 4. 模块（Modules）：告别 `#include`

**`#include` 的历史问题**：

```cpp
// 头文件被反复复制粘贴到每个 .cpp，大项目编译极慢
// 宏会污染整个翻译单元，顺序敏感
// 重复包含保护（#pragma once）只是补丁

// 典型痛点
#include <windows.h>   // 引入了几千个宏，其中有 min、max
                       // 导致 std::min 被破坏！
```

**C++20 模块**：

```cpp
// === math.cppm（模块定义文件）===
export module math;    // 声明这是 math 模块

// 不导出的内容：调用者完全看不到，不会污染
static double internalHelper(double x) { return x * x; }

// export：明确控制对外接口
export double square(double x) { return internalHelper(x); }
export double cube(double x)   { return x * x * x; }

export template<typename T>
T clamp(T val, T lo, T hi) {
    return std::max(lo, std::min(val, hi));
}
```

```cpp
// === main.cpp（使用模块）===
import math;           // 不是文本替换，是真正的模块导入
import std;            // C++23：一句话导入整个标准库

int main() {
    std::cout << square(3.0) << "\n";    // 9
    std::cout << cube(2.0)   << "\n";    // 8
    std::cout << clamp(15, 0, 10) << "\n"; // 10
}
```

**模块 vs `#include` 对比**：

||`#include`|模块|
|---|---|---|
|编译方式|文本替换，每次重新解析|预编译，只解析一次|
|编译速度|慢（大项目尤其明显）|快（可快几倍到几十倍）|
|宏隔离|无，宏穿透所有边界|完全隔离|
|符号控制|头文件所有内容都暴露|`export` 精确控制|
|顺序依赖|强（include 顺序影响结果）|无|

---

### 5. 其他重要 C++20 特性

#### `std::span`：非拥有的连续内存视图

```cpp
// 问题：同一段逻辑要为不同类型写多个重载
void process(std::vector<int>& v);
void process(int* arr, size_t len);
void process(std::array<int,10>& arr);

// C++20：span 统一接受任何连续内存
void process(std::span<int> data) {
    for (int& x : data) x *= 2;
    std::cout << "处理了 " << data.size() << " 个元素\n";
}

std::vector<int>   v   = {1,2,3,4,5};
int                arr[] = {1,2,3};
std::array<int,4>  a   = {1,2,3,4};

process(v);    // ✓ vector
process(arr);  // ✓ 原生数组
process(a);    // ✓ std::array

// 子视图：零拷贝切片
std::span<int> middle = std::span(v).subspan(1, 3);  // {2,4,6}（已翻倍）
```

#### 三路比较运算符 `<=>` (Spaceship)

```cpp
// C++17：为一个类实现完整比较，要写 6 个运算符
struct Point {
    int x, y;
    bool operator<(const Point& o)  const { return x<o.x || (x==o.x && y<o.y); }
    bool operator>(const Point& o)  const { return o < *this; }
    bool operator<=(const Point& o) const { return !(o < *this); }
    bool operator>=(const Point& o) const { return !(*this < o); }
    bool operator==(const Point& o) const { return x==o.x && y==o.y; }
    bool operator!=(const Point& o) const { return !(*this == o); }
};

// C++20：一个 <=> 自动生成全部 6 个
struct Point {
    int x, y;
    auto operator<=>(const Point&) const = default;  // 一行搞定！
};

Point a{1,2}, b{1,3};
std::cout << (a < b)  << "\n";   // 1
std::cout << (a == b) << "\n";   // 0
std::cout << (a >= b) << "\n";   // 0
```

#### `std::format`：类型安全的格式化

```cpp
#include <format>

// C 的 printf：无类型检查，格式符写错是未定义行为
printf("Hello %s, you are %d years old\n", name.c_str(), age);

// C++20：类型安全，像 Python 的 f-string
std::string msg = std::format("Hello {}, you are {} years old", name, age);
std::string pi  = std::format("π ≈ {:.4f}", 3.14159265);   // π ≈ 3.1416
std::string hex = std::format("0x{:08X}", 255);             // 0x000000FF
std::string tbl = std::format("{:<10} {:>8}", "name", "score"); // 左右对齐

// 直接打印（C++23 进一步简化为 std::print）
std::cout << std::format("{} + {} = {}\n", 1, 2, 3);
```

#### `std::jthread`：可自动 join 的线程

```cpp
// C++11 std::thread：忘记 join/detach → 程序崩溃
{
    std::thread t([]{ doWork(); });
    // 如果这里抛了异常，t 的析构函数会调用 std::terminate！
}

// C++20 std::jthread：析构时自动 join，还支持协作式取消
{
    std::jthread t([](std::stop_token st) {
        while (!st.stop_requested()) {  // 检查是否被请求停止
            doWork();
        }
    });
    // 超出作用域时：自动请求停止 + 自动 join
}
```

---
![Pasted image 20260723205154](assets/images/Pasted%20image%2020260723205154.png)
### 本节小结

|特性|解决的痛点|一句话记忆|
|---|---|---|
|Concepts|模板错误信息是天书|给模板参数加类型约束，报错清晰|
|Ranges|算法要传迭代器对，无法组合|管道 `\|` 链式组合，惰性求值|
|协程|异步代码是回调地狱|可暂停恢复的函数，异步写成同步|
|模块|`#include` 慢且宏污染|预编译、隔离、快|
|`std::span`|不同容器需要多个重载|统一接受任何连续内存|
|`<=>`|比较运算符要写 6 个|一个运算符生成全部比较|
|`std::format`|`printf` 不安全|类型安全的格式化字符串|
|`jthread`|忘记 join 会崩溃|析构自动 join，支持取消|

C++20 的核心精神：**大幅提升抽象能力（Concepts + Ranges），解决异步复杂度（协程），修复工程基础设施（模块）**。这是 C++ 真正进入"现代语言"行列的版本。

---

最后一部分是 **C++23**，会覆盖 `std::expected`、`std::print`、`import std`、`std::mdspan` 等收尾特性。说"继续"即可！

## C++23：现代 C++ 的收尾与打磨

C++23 没有 C++11/20 那样的革命性变化，定位是"把 C++20 没做完的补完，把日常开发还缺的补齐"。每个特性都直接提升开发体验。

---

### 1. `std::expected`：现代错误处理

这是 C++23 最重要的特性。它提供了一种介于"返回值"和"异常"之间的错误处理方式。

**三种错误处理方式的对比**：

```cpp
// 方式1：返回错误码（C 风格）
// 问题：错误容易被忽略，正常值和错误混在一起
int divide(int a, int b) {
    if (b == 0) return -1;   // -1 是错误还是正常结果？
    return a / b;
}

// 方式2：异常
// 问题：性能开销，异常路径不在函数签名里，调用者不知道会抛
int divide(int a, int b) {
    if (b == 0) throw std::runtime_error("除数为零");
    return a / b;
}

// 方式3：std::expected（C++23）
// 成功时携带值，失败时携带错误，两者都在类型里明确表达
#include <expected>

enum class MathError { DivideByZero, Overflow };

std::expected<int, MathError> divide(int a, int b) {
    if (b == 0) return std::unexpected(MathError::DivideByZero);
    return a / b;   // 成功：直接返回值
}
```

**使用方式**：

```cpp
auto result = divide(10, 2);

// 方式1：检查后取值
if (result) {
    std::cout << "结果: " << *result << "\n";   // 5
} else {
    std::cout << "错误\n";
}

// 方式2：value_or 提供默认值
int val = divide(10, 0).value_or(0);   // 0

// 方式3：and_then 链式操作（类似 Promise 链）
auto final = divide(100, 5)
    .and_then([](int v) -> std::expected<int, MathError> {
        return divide(v, 2);        // 继续除
    })
    .and_then([](int v) -> std::expected<int, MathError> {
        return v * 3;               // 乘以 3
    });

if (final) std::cout << *final << "\n";   // (100/5/2)*3 = 30
```

**实际应用：文件解析**：

```cpp
enum class ParseError {
    FileNotFound,
    InvalidFormat,
    OutOfRange
};

std::expected<Config, ParseError> parseConfig(std::string path) {
    if (!fs::exists(path))
        return std::unexpected(ParseError::FileNotFound);

    std::ifstream f(path);
    Config cfg;
    if (!parse(f, cfg))
        return std::unexpected(ParseError::InvalidFormat);

    return cfg;   // 成功
}

// 调用链：每一步都可能失败，错误自动传播
auto result = parseConfig("app.json")
    .and_then(validateConfig)      // Config → expected<Config, ParseError>
    .and_then(applyConfig)         // 应用配置
    .or_else([](ParseError e) {    // 统一处理错误
        logError(e);
        return std::expected<void, ParseError>{};
    });
```

**与 `std::optional` 的区别**：

```cpp
// optional：只知道"有"或"没有"，不知道为什么没有
std::optional<int> result = divide(10, 0);   // nullopt，但不知道原因

// expected：知道"有"或"为什么没有"
std::expected<int, MathError> result = divide(10, 0);
// result.error() == MathError::DivideByZero
```

---

### 2. `std::print` / `std::println`：终于有了好用的打印

C++ 一直缺少一个"简单好用又类型安全"的打印函数。`printf` 不安全，`cout` 冗长，`std::format` 还要包一层 `cout`。

```cpp
#include <print>

// C++23 之前：三种都有缺陷
printf("Hello %s, age %d\n", name.c_str(), age);  // 不安全
std::cout << "Hello " << name << ", age " << age << "\n";  // 冗长
std::cout << std::format("Hello {}, age {}\n", name, age); // 啰嗦

// C++23：简洁、安全、高效
std::print("Hello {}, age {}\n", name, age);   // 有换行符
std::println("Hello {}, age {}", name, age);   // 自动加换行

// 格式化语法与 std::format 完全一致
std::println("π ≈ {:.4f}", 3.14159265);        // π ≈ 3.1416
std::println("{:>10} | {:<10}", "name", "score");  // 右对齐 | 左对齐
std::println("十六进制: {:08X}", 255);           // 十六进制: 000000FF

// 输出到任意流
std::println(std::cerr, "错误: {}", errMsg);   // 输出到 stderr
std::println(logFile, "[{}] {}", timestamp, msg); // 输出到文件
```

**性能**：`std::print` 直接写入底层缓冲区，不经过 `std::ostream` 的同步机制，比 `cout` 更快。

---

### 3. `import std`：一句话导入整个标准库

```cpp
// C++20 之前：每用一个标准库组件就要一个 include
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <memory>
#include <format>
#include <ranges>
// ... 经常忘一个，然后报错

// C++23：一句话搞定
import std;

// 现在所有标准库都可用
int main() {
    std::vector<int> v = {3, 1, 4, 1, 5, 9};
    std::ranges::sort(v);
    std::println("{}", v | std::views::take(3));
}
```

**编译速度**：`import std` 是预编译模块，比几十个 `#include` 快得多。在大型项目中，这一行能节省大量编译时间。

---

### 4. `std::mdspan`：多维数组视图

`std::span` 是一维的，`mdspan` 把它推广到多维，是科学计算、图像处理的利器。

```cpp
#include <mdspan>

// 一块连续内存，用 mdspan 赋予它"形状"
std::vector<int> data(12);   // 12 个元素的平坦内存

// 解读为 3×4 的矩阵（零开销，不拷贝）
auto mat = std::mdspan(data.data(), 3, 4);

// 像二维数组一样访问
mat[1, 2] = 42;   // 第1行第2列
std::cout << mat[1, 2] << "\n";   // 42

// 矩阵遍历
for (int i = 0; i < mat.extent(0); i++) {      // 行数
    for (int j = 0; j < mat.extent(1); j++) {  // 列数
        mat[i, j] = i * 4 + j;
    }

// 解读为 2×2×3 的三维张量（同一块内存！）
auto tensor = std::mdspan(data.data(), 2, 2, 3);
tensor[1, 0, 2] = 99;

// 实际应用：图像处理（高×宽×通道）
std::vector<uint8_t> pixels(1920 * 1080 * 3);
auto img = std::mdspan(pixels.data(), 1080, 1920, 3);

// 访问像素 (y=100, x=200) 的 R 通道
img[100, 200, 0] = 255;
```

---

### 5. Deducing `this`：显式 self 参数

长期以来 C++ 的成员函数隐式接收 `this`，导致一些模式（如 CRTP）需要很多样板代码。C++23 允许显式写出 `this`。

```cpp
// 问题：const 和非 const 版本要写两遍
class MyString {
    std::string data;
public:
    // C++20：两个几乎一样的函数
    std::string& value()       { return data; }
    const std::string& value() const { return data; }
};

// C++23：一个模板函数搞定
class MyString {
    std::string data;
public:
    auto& value(this auto& self) {   // self 推导为 MyString& 或 const MyString&
        return self.data;
    }

MyString s;
s.value() = "hello";          // 非 const 版本

const MyString cs;
auto& v = cs.value();         // const 版本，自动推导
```

**简化 CRTP（奇异递归模板模式）**：

```cpp
// C++20 CRTP：要传模板参数，样板代码多
template<typename Derived>
class Base {
public:
    void interface() {
        static_cast<Derived*>(this)->implementation();
    }

class Child : public Base<Child> {
public:
    void implementation() { std::cout << "Child impl\n"; }
};

// C++23：deducing this 直接替代 CRTP
class Base {
public:
    void interface(this auto& self) {
        self.implementation();   // 直接调用，编译期确定类型
    }

class Child : public Base {
public:
    void implementation() { std::cout << "Child impl\n"; }
};

Child c;
c.interface();   // Child impl
```

**链式调用 Builder 模式（最常见应用）**：

```cpp
// C++20：子类调用父类方法时，返回类型是父类，链式调用断掉
class QueryBuilder {
protected:
    std::string query;
public:
    QueryBuilder& where(std::string cond) {
        query += " WHERE " + cond;
        return *this;   // 返回 QueryBuilder&，不是子类类型
    }

class SqlBuilder : public QueryBuilder {
public:
    SqlBuilder& limit(int n) {
        query += " LIMIT " + std::to_string(n);
        return *this;
    }

SqlBuilder sb;
// sb.where("age > 18").limit(10);  // ❌ where() 返回 QueryBuilder&，没有 limit()

// C++23：deducing this 完美解决
class QueryBuilder {
protected:
    std::string query;
public:
    auto& where(this auto& self, std::string cond) {
        self.query += " WHERE " + cond;
        return self;   // 返回实际类型（子类）
    }

class SqlBuilder : public QueryBuilder {
public:
    auto& limit(this auto& self, int n) {
        self.query += " LIMIT " + std::to_string(n);
        return self;
    }

SqlBuilder sb;
sb.where("age > 18").limit(10);   // ✓ 完美链式调用
```

---

### 6. 其他实用特性

```cpp
// --- std::flat_map / std::flat_set ---
// 比 map/set 缓存友好，小数据集性能更好
// 底层是排序后的 vector，而不是红黑树
#include <flat_map>
std::flat_map<std::string, int> fm;
fm["alice"] = 95;
fm["bob"]   = 87;
// 遍历时内存连续，比 std::map 快 2-5 倍（数据量小时）

// --- std::generator（协程生成器标准化）---
// C++20 的协程只有底层机制，生成器需要自己实现
// C++23 直接提供 std::generator
#include <generator>

std::generator<int> fibonacci() {
    int a = 0, b = 1;
    while (true) {
        co_yield a;
        auto tmp = a + b; a = b; b = tmp;
    }

// 直接配合 ranges 使用
for (int x : fibonacci() | std::views::take(8))
    std::print("{} ", x);   // 0 1 1 2 3 5 8 13

// --- 多维下标运算符 operator[] ---
// C++23 允许 operator[] 接受多个参数
class Matrix {
    std::vector<double> data;
    int rows, cols;
public:
    Matrix(int r, int c) : rows(r), cols(c), data(r * c) {}

    double& operator[](int r, int c) {        // 多参数 []
        return data[r * cols + c];
    }

Matrix m(3, 4);
m[1, 2] = 3.14;   // 而不是 m[1][2]（两次解引用）

// --- ranges 新增视图 ---
std::vector<int> v = {1, 2, 3, 4, 5, 6};

// zip_transform：同时变换多个范围
auto sums = std::views::zip_transform(
    std::plus{}, v, std::views::iota(10)
);
// {1+10, 2+11, 3+12, ...} = {11, 13, 15, 17, 19, 21}

// chunk：分组
for (auto chunk : v | std::views::chunk(2))
    std::println("{}", chunk);   // {1,2} {3,4} {5,6}

// slide：滑动窗口
for (auto window : v | std::views::slide(3))
    std::println("{}", window);  // {1,2,3} {2,3,4} {3,4,5} {4,5,6}
```

---

### 整体演化全景回顾---
![Pasted image 20260723205218](assets/images/Pasted%20image%2020260723205218.png)
### C++23 本节小结

|特性|解决的痛点|一句话记忆|
|---|---|---|
|`std::expected`|错误处理要么忽略要么异常|把错误编码进类型，强迫处理|
|`std::print`|cout 冗长，printf 不安全|简洁、安全、快速的打印|
|`import std`|一堆 include 慢且易漏|一行导入整个标准库|
|`std::mdspan`|多维数组操作繁琐|零开销多维视图|
|Deducing `this`|const/非const 重复，CRTP 复杂|显式 self，自动推导调用类型|
|`std::generator`|协程生成器要自己实现|标准化的生成器类型|
|`std::flat_map`|`map` 缓存不友好|连续内存的有序映射，更快|

---

### 全系列总结：现代 C++ 的核心思想演进

|版本|核心思想|一句话|
|---|---|---|
|C|接近硬件，手动控制|你说了算，但你负全责|
|C++98|面向对象 + 泛型|抽象不损性能|
|C++11|现代化基础设施|安全、表达力、零开销|
|C++14|精炼 11|把该有的补完|
|C++17|实用标准化|好模式内置进语言|
|C++20|大规模重构表达力|约束清晰，组合优雅|
|C++23|打磨与收尾|日常开发体验到位|

---

整个系列到这里就讲完了。从 C 的裸指针，到 C++23 的 `std::expected` 链式错误处理，C++ 一直在做同一件事：**在不损失性能的前提下，让代码越来越安全、越来越能表达意图**。
