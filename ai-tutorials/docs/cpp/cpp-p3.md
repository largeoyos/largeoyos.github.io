## C++17：实用性大提升

C++17 的定位是"把常见的好模式直接内置进语言"。每个特性都能在日常代码里高频用到。

---

### 1. 结构化绑定（Structured Bindings）

**问题**：解包 `pair`、`tuple`、结构体时，代码非常啰嗦。

```cpp
// C++14：解包 pair 要手动取 .first / .second
std::map<std::string, int> scores = {{"Alice", 95}, {"Bob", 87}};
for (auto& kv : scores) {
    std::cout << kv.first << ": " << kv.second << "\n";
}

// C++17：直接解包，命名有意义的变量
for (auto& [name, score] : scores) {
    std::cout << name << ": " << score << "\n";
}
```

**解包各种类型**：

```cpp
// --- pair ---
auto [min, max] = std::minmax({3, 1, 4, 1, 5, 9});
std::cout << min << " " << max << "\n";   // 1 9

// --- tuple ---
auto getData() -> std::tuple<int, std::string, double> {
    return {42, "hello", 3.14};
}
auto [id, name, score] = getData();

// --- 结构体（无需任何修改！）---
struct Point { int x, y, z; };
Point p{1, 2, 3};
auto [x, y, z] = p;
std::cout << x << " " << y << " " << z << "\n";   // 1 2 3

// --- 配合 insert 判断是否插入成功 ---
std::set<int> s;
auto [iter, inserted] = s.insert(42);
if (inserted)
    std::cout << "插入成功: " << *iter << "\n";
```

---

### 2. `if` / `switch` 初始化语句

**问题**：`if` 里用到的临时变量会"逃逸"到外部作用域，污染命名空间。

```cpp
// C++14：it 在 if 结束后仍然存在，作用域泄漏
auto it = m.find("key");
if (it != m.end()) {
    use(it->second);
}
// it 在这里还能访问，但已经没有意义了

// C++17：it 的作用域严格限制在 if 块内
if (auto it = m.find("key"); it != m.end()) {
    use(it->second);
}
// it 在这里不存在了，干净！
```

**更多场景**：

```cpp
// 配合互斥锁：锁的作用域精确控制
if (std::lock_guard lock(mtx); !queue.empty()) {
    process(queue.front());
    queue.pop();
}

// switch 初始化
switch (auto ch = getNextChar(); ch) {
    case 'a': handleA(); break;
    case 'b': handleB(); break;
    default:  handleOther(ch);
}

// 实际应用：正则匹配
std::string text = "price: 42.5 USD";
std::regex  pattern(R"(\d+\.?\d*)");
if (std::smatch m; std::regex_search(text, m, pattern)) {
    std::cout << "找到数字: " << m[0] << "\n";   // 42.5
}
```

---

### 3. `std::optional`：优雅表达"可能没有值"

**问题**：函数可能返回"没有结果"，C++14 常用的做法都有缺陷。

```cpp
// 方案1：返回 -1 表示失败 → 魔法数字，容易被误用
int findIndex(std::vector<int>& v, int val);

// 方案2：传出参数 → 接口丑陋
bool findIndex(std::vector<int>& v, int val, int& outIdx);

// 方案3：抛异常 → "没找到"不是异常，语义不对

// C++17：optional 干净地表达"可能没有"
std::optional<int> findIndex(std::vector<int>& v, int val) {
    for (int i = 0; i < v.size(); i++)
        if (v[i] == val) return i;       // 有值：直接返回
    return std::nullopt;                  // 无值
}

std::vector<int> v = {10, 20, 30, 40};

if (auto idx = findIndex(v, 30)) {
    std::cout << "找到，下标: " << *idx << "\n";   // 2
} else {
    std::cout << "未找到\n";
}

// value_or：提供默认值
int idx = findIndex(v, 99).value_or(-1);   // -1
```

**链式使用**（常见于配置读取）：

```cpp
struct Config {
    std::optional<std::string> host;
    std::optional<int>         port;
    std::optional<int>         timeout;
};

Config cfg = loadConfig("app.json");

// value_or 提供默认值，一行搞定
std::string host    = cfg.host.value_or("localhost");
int         port    = cfg.port.value_or(8080);
int         timeout = cfg.timeout.value_or(30);
```

---

### 4. `std::variant`：类型安全的联合体

**问题**：C 的 `union` 不知道当前存的是哪种类型，使用错误类型是未定义行为。

```cpp
// C 的 union：危险
union Data { int i; double d; char* s; };
Data d; d.i = 42;
std::cout << d.d;   // 未定义行为！

// C++17 variant：永远知道自己存的是什么类型
std::variant<int, double, std::string> val;

val = 42;
std::cout << std::get<int>(val) << "\n";       // 42

val = 3.14;
std::cout << std::get<double>(val) << "\n";    // 3.14

val = std::string("hello");
std::cout << std::get<std::string>(val) << "\n"; // hello

// std::get 错误类型 → 抛 std::bad_variant_access 异常，而非未定义行为
try {
    std::get<int>(val);   // 当前存的是 string，抛异常
} catch (std::bad_variant_access&) {
    std::cout << "类型错误\n";
}
```

**`std::visit`：统一处理所有类型**：

```cpp
// 用 overloaded 技巧（C++17 惯用法）
template<class... Ts>
struct overloaded : Ts... { using Ts::operator()...; };
template<class... Ts>
overloaded(Ts...) -> overloaded<Ts...>;   // 推导指引

std::variant<int, double, std::string> val = 3.14;

std::visit(overloaded{
    [](int i)         { std::cout << "int: "    << i << "\n"; },
    [](double d)      { std::cout << "double: " << d << "\n"; },
    [](std::string& s){ std::cout << "string: " << s << "\n"; }
}, val);
// 输出：double: 3.14

// 实际应用：AST 节点、JSON 值、消息类型
using JsonValue = std::variant
    std::nullptr_t,
    bool,
    int,
    double,
    std::string
>;
```

---

### 5. `if constexpr`：编译期分支

**问题**：模板元编程中，根据类型选择不同实现，C++14 要用繁琐的 SFINAE 或模板特化。

```cpp
// C++14：需要写两个重载 + enable_if，非常繁琐
template<typename T>
typename std::enable_if<std::is_integral<T>::value, void>::type
printType(T val) { std::cout << "整数: " << val; }

template<typename T>
typename std::enable_if<!std::is_integral<T>::value, void>::type
printType(T val) { std::cout << "非整数: " << val; }

// C++17：一个函数，if constexpr 编译期选分支
template<typename T>
void printType(T val) {
    if constexpr (std::is_integral_v<T>) {
        std::cout << "整数: " << val << "，二进制位数: " << sizeof(T)*8 << "\n";
    } else if constexpr (std::is_floating_point_v<T>) {
        std::cout << std::fixed << "浮点数: " << val << "\n";
    } else {
        std::cout << "其他类型: " << val << "\n";
    }

printType(42);        // 整数: 42，二进制位数: 32
printType(3.14);      // 浮点数: 3.140000
printType("hello");   // 其他类型: hello
```

**关键理解**：`if constexpr` 的未选中分支**根本不编译**，所以里面可以写对当前类型不合法的代码。

```cpp
template<typename T>
void process(T val) {
    if constexpr (std::is_pointer_v<T>) {
        std::cout << "指针，解引用: " << *val << "\n";
        // 如果 T 不是指针，*val 不合法
        // 但 if constexpr 保证这行在 T 非指针时根本不存在
    } else {
        std::cout << "值: " << val << "\n";
    }
```

---

### 6. `std::filesystem`：跨平台文件操作

```cpp
#include <filesystem>
namespace fs = std::filesystem;

// 路径操作
fs::path p = "/home/user/documents/report.pdf";
std::cout << p.filename()  << "\n";   // report.pdf
std::cout << p.stem()      << "\n";   // report
std::cout << p.extension() << "\n";   // .pdf
std::cout << p.parent_path()<< "\n";  // /home/user/documents

// 文件/目录操作
fs::create_directories("output/logs/2024");   // 递归创建目录
fs::copy("source.txt", "backup.txt");
fs::remove("temp.txt");
fs::rename("old.txt", "new.txt");

// 遍历目录
for (auto& entry : fs::recursive_directory_iterator("./src")) {
    if (entry.path().extension() == ".cpp") {
        std::cout << entry.path() << "\n";
    }

// 文件信息
fs::path f = "data.bin";
std::cout << fs::file_size(f) << " bytes\n";
std::cout << fs::exists(f)    << "\n";   // 0 或 1
```

---

### 7. 折叠表达式（Fold Expressions）

C++17 大幅简化了变参模板的展开。

```cpp
// C++14：递归展开，要写终止条件，复杂
template<typename T>
T sum(T val) { return val; }

template<typename T, typename... Rest>
T sum(T first, Rest... rest) { return first + sum(rest...); }

// C++17：一行折叠表达式
template<typename... Args>
auto sum(Args... args) { return (args + ...); }   // 左折叠

sum(1, 2, 3, 4, 5);           // 15
sum(1.1, 2.2, 3.3);           // 6.6
sum(std::string("a"), "b", "c"); // "abc"

// 其他折叠用法
template<typename... Args>
void printAll(Args... args) {
    ((std::cout << args << " "), ...);   // 逗号折叠，依次打印
    std::cout << "\n";
}
printAll(1, "hello", 3.14, true);   // 1 hello 3.14 1

// 逻辑折叠
template<typename... Args>
bool allPositive(Args... args) { return ((args > 0) && ...); }

allPositive(1, 2, 3);    // true
allPositive(1, -2, 3);   // false
```

---

### 8. 其他实用特性速览

```cpp
// --- std::any：存任意类型 ---
std::any val = 42;
val = std::string("hello");
val = 3.14;

std::cout << std::any_cast<double>(val) << "\n";   // 3.14
// std::any_cast<int>(val);   // 错误类型 → 抛异常

// --- 类模板参数推导（CTAD）---
// C++14：必须写模板参数
std::pair<int, std::string> p1(42, "hello");
std::vector<int> v1{1, 2, 3};

// C++17：编译器自动推导
std::pair p2(42, "hello");         // 推导为 pair<int, const char*>
std::vector v2{1, 2, 3};          // 推导为 vector<int>
std::lock_guard lock(mtx);        // 推导为 lock_guard<std::mutex>

// --- 内联变量（inline variable）---
// 头文件里定义变量不再需要在某个 .cpp 中单独定义一次
struct Config {
    inline static int maxConnections = 100;  // 直接在类里定义
    inline static std::string version = "1.0";
};

// --- std::string_view：零拷贝字符串视图 ---
void printLength(std::string_view sv) {   // 不拷贝，不分配内存
    std::cout << sv.size() << "\n";
}
printLength("hello");               // const char* 无需转换
printLength(std::string("world"));  // std::string 无需转换
```

---
![Pasted image 20260723205129](assets/images/Pasted%20image%2020260723205129.png)
### 本节小结

|特性|解决的痛点|一句话记忆|
|---|---|---|
|结构化绑定|解包 pair/tuple 很啰嗦|`auto [k, v]` 直接命名|
|if 初始化|临时变量污染外部作用域|变量生命周期精确到 if 块|
|`std::optional`|返回"无值"缺乏统一表达|比返回 -1 或抛异常都干净|
|`std::variant`|`union` 不知道当前类型|类型安全的多类型容器|
|`if constexpr`|模板分支需要复杂 SFINAE|编译期 if，未选中分支不编译|
|`std::filesystem`|文件操作依赖平台 API|跨平台文件系统标准接口|
|折叠表达式|变参模板展开要写递归|`(args + ...)` 一行搞定|

C++17 的核心精神：**把社区里验证过的好模式（optional、variant、filesystem）直接标准化，不用再引入第三方库**。

---

下一部分是 **C++20**，史上最大版本之一：Concepts、Ranges、协程、模块四大核心，每一个都是语言级别的突破。说"继续"即可！
