## cpp

从c为起点，系统讲讲cpp新特性
![Pasted image 20260723204900](assets/images/Pasted%20image%2020260723204900.png)

下面系统过一遍各版本的核心新特性，按"从 C 出发，逐步走向现代 C++"的逻辑展开。

---

## 从 C 到 C++：面向对象的诞生（C++98/03）

C 语言提供了过程式编程、结构体和手动内存管理。C++ 在此基础上引入了：

**类与面向对象**：封装、继承、多态，`virtual` 虚函数实现运行时分派。

**模板（Templates）**：泛型编程的基石，`std::vector<T>`、`std::sort` 等 STL 组件都依赖它。

**STL**：`vector`、`map`、`list` 等容器，配合迭代器和算法（`sort`、`find`）构成完整标准库。

**异常处理**：`try / catch / throw`，替代 C 的错误码风格。

**命名空间**：`namespace std` 避免全局命名冲突。

---

## C++11：现代 C++ 真正的起点

这是最重要的一个版本，几乎重塑了写 C++ 的方式。

### `auto` 与类型推导

```cpp
auto x = 42;          // int
auto v = std::vector<int>{1, 2, 3};
```

### Lambda 表达式

```cpp
auto square = [](int x) { return x * x; };
std::sort(v.begin(), v.end(), [](int a, int b){ return a > b; });
```

捕获列表 `[=]`（值捕获）、`[&]`（引用捕获）让 lambda 非常灵活。

### 移动语义（Move Semantics）& 右值引用

C++ 最深刻的优化机制之一。`std::move` 把"拷贝"变成"转移所有权"，避免不必要的深拷贝：

```cpp
std::vector<int> a = {1,2,3};
std::vector<int> b = std::move(a); // a 被掏空，零拷贝
```

### 智能指针

彻底取代裸指针 `new/delete`：

- `std::unique_ptr`：独占所有权，自动释放
- `std::shared_ptr`：共享所有权，引用计数
- `std::weak_ptr`：弱引用，防止循环依赖

### 并发支持

`<thread>`、`<mutex>`、`<atomic>`、`<future>` 正式进入标准库，C++ 终于原生支持多线程。

### 其他重要特性

- `nullptr` 取代 `NULL`
- `constexpr`：编译期常量求值
- 范围 for 循环：`for (auto& x : v)`
- `std::initializer_list`：`{1, 2, 3}` 初始化语法
- 变参模板（Variadic Templates）

---

## C++14：对 11 的精炼

- **泛型 lambda**：`[](auto x){ return x * 2; }` 参数可用 `auto`
- **`std::make_unique`**：填补了 C++11 的遗漏
- **返回类型推导**：函数可直接写 `auto f() { return 42; }`
- **变量模板**：`template<typename T> constexpr T pi = 3.14159...`

---

## C++17：实用性大提升

### 结构化绑定（Structured Bindings）

```cpp
auto [key, val] = *map.begin(); // 直接解包 pair
```

### `if` / `switch` 初始化语句

```cpp
if (auto it = m.find(key); it != m.end()) { ... }
```

### `std::optional`、`std::variant`、`std::any`

更安全地表达"可能没有值"、"多种类型之一"：

```cpp
std::optional<int> parse(std::string s); // 可能返回空
```

### `if constexpr`

编译期分支，大幅简化模板元编程：

```cpp
if constexpr (std::is_integral_v<T>) { ... }
```

### `std::filesystem`

跨平台文件系统操作终于进入标准库。

### 折叠表达式（Fold Expressions）

简化变参模板展开：`(args + ...)` 等。

---

## C++20：史上最大版本之一

四大核心特性重塑了语言面貌：

### Concepts（概念）

对模板参数加约束，错误信息从"天书"变成人话：

```cpp
template<std::integral T>
T add(T a, T b) { return a + b; }
```

### Ranges（范围库）

用管道风格组合算法，告别迭代器对：

```cpp
auto result = v | std::views::filter([](int x){ return x > 0; })
                | std::views::transform([](int x){ return x * 2; });
```

### 协程（Coroutines）

`co_await`、`co_yield`、`co_return`，异步/生成器代码变得优雅。框架层（如网络库）的基础。

### 模块（Modules）

```cpp
import std.core; // 替代 #include，更快编译，无宏污染
```

### 其他

- `std::span`：非拥有的连续序列视图
- 三路比较运算符 `<=>` (spaceship operator)
- `std::format`：类型安全的字符串格式化
- `std::jthread`：可自动 join 的线程

---

## C++23：锦上添花

- **`std::print` / `std::println`**：终于有了像样的打印函数
- **`std::expected<T, E>`**：错误处理的现代方式，替代异常或 `optional`
- **`import std`**：一句话导入整个标准库
- **`std::mdspan`**：多维数组视图
- **Deducing `this`**：显式 `self` 参数，解锁 CRTP 的简化写法

---

## 学习建议

|阶段|重点|
|---|---|
|打基础|C++11/14：auto、lambda、智能指针、移动语义|
|提升|C++17：optional、structured bindings、if constexpr|
|进阶|C++20：Concepts、Ranges、协程|
|跟踪前沿|C++23：expected、print、modules|

## C 语言基础 → C++98/03：面向对象的诞生

先看 C 的典型写法，再对比 C++ 如何改进它，感受每个特性解决的真实问题。

---

### 1. 类与封装（Class & Encapsulation）

**C 的做法**：数据和操作函数分离，调用者可以随意修改内部字段。

```c
// C 风格
typedef struct {
    char name[32];
    int  age;
} Person;

void person_greet(Person* p) {
    printf("Hi, I'm %s\n", p->name);
}

// 调用者可以直接乱改：p.age = -999; 没有任何保护
```

**C++ 的改进**：把数据和方法封装在一起，用访问控制保护内部状态。

```cpp
class Person {
private:               // 外部无法直接访问
    std::string name;
    int age;

public:
    // 构造函数：对象创建时自动调用
    Person(std::string n, int a) : name(n), age(a) {}

    void greet() const {
        std::cout << "Hi, I'm " << name << ", age " << age << "\n";
    }

    // getter：受控地暴露数据
    int getAge() const { return age; }
};

// 使用
Person p("Alice", 30);
p.greet();          // Hi, I'm Alice, age 30
// p.age = -999;   // 编译错误！私有成员无法访问
```

---

### 2. 继承与多态（Inheritance & Polymorphism）

**问题**：如何统一处理不同种类的对象？

```cpp
class Animal {
public:
    std::string name;
    Animal(std::string n) : name(n) {}

    // virtual 关键字：允许子类覆盖，实现运行时多态
    virtual void speak() const {
        std::cout << name << " makes a sound\n";
    }

    virtual ~Animal() {}   // 析构函数也应是虚函数
};

class Dog : public Animal {
public:
    Dog(std::string n) : Animal(n) {}

    void speak() const override {   // override 明确表示覆盖父类
        std::cout << name << " says: Woof!\n";
    }

class Cat : public Animal {
public:
    Cat(std::string n) : Animal(n) {}
    void speak() const override {
        std::cout << name << " says: Meow!\n";
    }

// 关键：用基类指针统一操作不同子类
void makeSpeak(Animal* a) { a->speak(); }

Dog d("Rex");
Cat c("Whiskers");
makeSpeak(&d);   // Rex says: Woof!
makeSpeak(&c);   // Whiskers says: Meow!
```

**应用场景**：游戏中的 `GameObject` 基类，UI 框架的 `Widget` 基类，插件系统的接口类。

---

### 3. 模板（Templates）：泛型编程

**问题**：C 中要为每种类型写一份相同逻辑的函数（`max_int`、`max_float`……）。

```cpp
// 一份代码，适用所有类型
template<typename T>
T myMax(T a, T b) {
    return a > b ? a : b;
}

myMax(3, 5);         // → 5（int）
myMax(3.14, 2.71);   // → 3.14（double）
myMax('a', 'z');     // → 'z'（char）
```

**类模板**：容器的基础。

```cpp
template<typename T>
class Stack {
private:
    std::vector<T> data;
public:
    void push(T val) { data.push_back(val); }
    T pop() {
        T top = data.back();
        data.pop_back();
        return top;
    }
    bool empty() const { return data.empty(); }
};

Stack<int>         si;   // 整数栈
Stack<std::string> ss;   // 字符串栈
si.push(42);
ss.push("hello");
```

**应用场景**：这正是 `std::vector<T>`、`std::map<K,V>` 的实现原理。

---

### 4. STL：标准模板库

C++ 98 带来了一整套即用的容器与算法，告别手写链表和排序。

```cpp
#include <vector>
#include <map>
#include <algorithm>

// --- 容器 ---
std::vector<int> scores = {85, 92, 78, 95, 60};

// 排序
std::sort(scores.begin(), scores.end());
// scores: 60 78 85 92 95

// 查找
auto it = std::find(scores.begin(), scores.end(), 92);
if (it != scores.end())
    std::cout << "找到了: " << *it << "\n";

// map：键值对，自动按 key 排序
std::map<std::string, int> wordCount;
wordCount["apple"]++;
wordCount["banana"] += 3;
for (auto& pair : wordCount)
    std::cout << pair.first << ": " << pair.second << "\n";
```

---

### 5. 异常处理（Exception Handling）

**C 的做法**：返回错误码，调用者必须每次手动检查，极易遗忘。

```c
// C 风格：繁琐且容易遗漏
int divide(int a, int b, int* result) {
    if (b == 0) return -1;   // 错误码
    *result = a / b;
    return 0;
}
```

**C++ 的改进**：异常在调用栈上自动传播，强迫调用者处理错误。

```cpp
double divide(double a, double b) {
    if (b == 0)
        throw std::invalid_argument("除数不能为零");
    return a / b;
}

try {
    double r = divide(10, 0);
    std::cout << r << "\n";
} catch (const std::invalid_argument& e) {
    std::cerr << "错误: " << e.what() << "\n";
} catch (...) {
    std::cerr << "未知错误\n";
}
```

**应用场景**：文件读取失败、网络连接中断、格式解析错误等需要"中断正常流程"的场合。

---

### 6. 命名空间（Namespace）

**问题**：大型项目多个库都定义了同名函数，产生冲突。

```cpp
namespace Graphics {
    void draw() { std::cout << "绘制图形\n"; }
}

namespace Audio {
    void draw() { std::cout << "绘制波形\n"; }   // 同名！
}

Graphics::draw();   // 明确调用哪个
Audio::draw();

// 或者局部 using
{
    using namespace Graphics;
    draw();   // 在这个作用域内默认用 Graphics
}
```

---

### 小结对比

|特性|解决的 C 痛点|
|---|---|
|类与封装|数据与逻辑分离、无保护|
|继承与多态|无法统一处理不同类型对象|
|模板|为每种类型重复写相同逻辑|
|STL|手写容器与算法、重复造轮子|
|异常|错误码容易被忽略、传播困难|
|命名空间|全局命名冲突|

---

下一部分是 **C++11 — 现代 C++ 真正的起点**，会覆盖 `auto`、lambda、移动语义、智能指针、多线程等核心改变，每一个都有详细例子。说"继续"即可！
