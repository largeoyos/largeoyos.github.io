## C++11：现代 C++ 真正的起点

C++11 是 C++ 历史上改动最大的版本，几乎每个特性都在解决一个真实的痛点。逐一过一遍。

---

### 1. `auto` 与类型推导

**问题**：类型名越来越长，写起来痛苦且容易出错。

```cpp
// C++98 时代的噩梦
std::map<std::string, std::vector<int>>::iterator it = m.begin();

// C++11：让编译器推导类型
auto it = m.begin();   // 完全等价，简洁清晰
```

**更多场景**：

```cpp
auto x = 42;           // int
auto pi = 3.14;        // double
auto name = "Alice";   // const char*
auto flag = true;      // bool

// 搭配范围 for 循环（也是 C++11 新增）
std::vector<std::string> words = {"hello", "world", "cpp"};
for (auto& w : words) {          // auto& 避免拷贝
    std::cout << w << "\n";
}
```

> `auto` 不是"弱类型"——类型在编译期完全确定，只是不用手写出来。

---

### 2. Lambda 表达式

**问题**：C++98 中给算法传"行为"，必须专门定义一个函数或仿函数类，代码分散难以阅读。

```cpp
// C++98：为了一个简单比较，要跑到别处定义
struct DescendingCmp {
    bool operator()(int a, int b) { return a > b; }
};
std::sort(v.begin(), v.end(), DescendingCmp());

// C++11：就地定义，逻辑一目了然
std::sort(v.begin(), v.end(), [](int a, int b) {
    return a > b;
});
```

**Lambda 语法解析**：

```cpp
// [捕获列表](参数列表) -> 返回类型 { 函数体 }

int threshold = 60;

// 捕获外部变量（值捕获）
auto pass = [threshold](int score) {
    return score >= threshold;
};

// 捕获外部变量（引用捕获，可修改外部变量）
int count = 0;
auto countPass = [threshold, &count](int score) {
    if (score >= threshold) count++;
};

std::vector<int> scores = {55, 72, 90, 48, 83};
std::for_each(scores.begin(), scores.end(), countPass);
std::cout << "及格人数: " << count << "\n";  // 3

// [=] 捕获所有外部变量（值）
// [&] 捕获所有外部变量（引用）
```

**实际应用**：回调函数、事件处理、异步任务。

```cpp
// 按钮点击回调（模拟 GUI 框架）
button.onClick([&]() {
    label.setText("已点击");
    logEvent("button_click");
});
```

---

### 3. 移动语义（Move Semantics）& 右值引用

这是 C++11 **最深刻**的特性，理解它需要先理解"拷贝的代价"。

**问题**：函数返回一个大容器时，C++98 会触发完整的深拷贝。

```cpp
// C++98：这行代码会把整个 vector 复制一遍！
std::vector<int> createBigVector() {
    std::vector<int> v(1000000, 0);
    return v;   // 拷贝 100 万个元素
}
```

**右值引用 `&&`**：

```cpp
// 左值：有名字、有地址、可以取地址
int x = 42;       // x 是左值
int& lref = x;    // 左值引用

// 右值：临时对象、即将消亡、没有名字
int&& rref = 42;              // 右值引用
int&& rref2 = x + 1;         // x+1 是右值
```

**移动构造函数**：不复制数据，直接"偷"走资源。

```cpp
class MyString {
    char* data;
    size_t size;
public:
    // 普通拷贝构造：深拷贝，O(n)
    MyString(const MyString& other) {
        size = other.size;
        data = new char[size];
        memcpy(data, other.data, size);   // 完整复制
        std::cout << "拷贝构造\n";
    }

    // 移动构造：转移指针，O(1)
    MyString(MyString&& other) noexcept {
        data = other.data;    // 直接抢过来指针
        size = other.size;
        other.data = nullptr; // 原来的清空，防止析构时重复释放
        other.size = 0;
        std::cout << "移动构造\n";
    }

    ~MyString() { delete[] data; }
};
```

**`std::move`**：把左值强制转换为右值，触发移动。

```cpp
MyString a("hello");
MyString b = a;             // 调用拷贝构造（a 仍然有效）
MyString c = std::move(a);  // 调用移动构造（a 之后不能再用！）

// 实际场景：往容器里放大对象
std::vector<MyString> vec;
MyString s("world");
vec.push_back(std::move(s));  // 移动进去，不拷贝
```

**函数返回值优化**：现代编译器 + 移动语义，大对象返回几乎零开销。

```cpp
std::vector<int> createBigVector() {
    std::vector<int> v(1000000, 0);
    return v;   // C++11 起：触发移动，而非拷贝
}
```

---

### 4. 智能指针

**问题**：C++ 手动 `new / delete` 极易内存泄漏，尤其在有异常或提前返回时。

```cpp
// C++98：危险！如果中间抛出异常，delete 永远不会执行
void riskyFunc() {
    int* p = new int[1000];
    doSomething();   // 如果这里抛异常 →
    delete[] p;      // 这行永远不会执行 → 内存泄漏
}
```

#### `unique_ptr`：独占所有权

```cpp
#include <memory>

// 创建：推荐用 make_unique（C++14，但思路从 11 开始）
auto p = std::make_unique<int>(42);
std::cout << *p << "\n";   // 42

// 离开作用域自动释放，无需 delete
{
    auto arr = std::make_unique<int[]>(100);
    arr[0] = 1;
}   // ← 这里自动 delete[]

// unique_ptr 不能复制，只能移动（体现"独占"）
auto p2 = std::move(p);  // 所有权转移，p 变为 nullptr
```

**实际应用**：工厂函数、类成员管理。

```cpp
class Engine { /* ... */ };

class Car {
    std::unique_ptr<Engine> engine;  // 明确表达：Car 拥有并负责 Engine
public:
    Car() : engine(std::make_unique<Engine>()) {}
    // 析构时 engine 自动释放，无需手写析构函数
};
```

#### `shared_ptr`：共享所有权

```cpp
// 多个指针共享同一个对象，引用计数归零时释放
auto sp1 = std::make_shared<std::string>("shared");
auto sp2 = sp1;   // 引用计数 → 2

std::cout << sp1.use_count() << "\n";   // 2

{
    auto sp3 = sp1;   // 引用计数 → 3
}   // sp3 离开作用域，计数 → 2，对象未释放

// sp1、sp2 都离开作用域后，计数归零，才真正释放
```

#### `weak_ptr`：打破循环引用

```cpp
// 循环引用导致内存永远不释放
struct Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev;   // 用 weak_ptr 打破循环
};

auto n1 = std::make_shared<Node>();
auto n2 = std::make_shared<Node>();
n1->next = n2;
n2->prev = n1;   // weak_ptr 不增加引用计数
// n1、n2 正常释放
```

---

### 5. `nullptr`

```cpp
// C++98 的坑：NULL 本质是整数 0，会引起重载歧义
void func(int x)  { std::cout << "int\n"; }
void func(int* p) { std::cout << "pointer\n"; }

func(NULL);     // 调用 func(int)！因为 NULL == 0
func(nullptr);  // 调用 func(int*)，语义正确
```

---

### 6. `constexpr`：编译期计算

**问题**：C++98 中复杂的常量只能靠宏或运行期计算。

```cpp
// C++98：只能用宏，不安全
#define SQUARE(x) ((x) * (x))

// C++11：真正的编译期函数
constexpr int square(int x) { return x * x; }

constexpr int val = square(10);   // 编译期直接得到 100
int arr[square(5)];               // 数组大小必须是编译期常量，合法！

// 实际应用：查找表、哈希值等在编译期预计算
constexpr int fibonacci(int n) {
    return n <= 1 ? n : fibonacci(n-1) + fibonacci(n-2);
}
constexpr int fib10 = fibonacci(10);   // 编译期得到 55
```

---

### 7. 多线程支持

C++11 之前，多线程依赖平台 API（pthreads / WinAPI），代码不可移植。

```cpp
#include <thread>
#include <mutex>
#include <future>

// --- 基本线程 ---
void worker(int id) {
    std::cout << "线程 " << id << " 运行中\n";
}

std::thread t1(worker, 1);
std::thread t2(worker, 2);
t1.join();   // 等待线程结束
t2.join();

// --- mutex 防止数据竞争 ---
std::mutex mtx;
int counter = 0;

auto increment = [&]() {
    for (int i = 0; i < 1000; i++) {
        std::lock_guard<std::mutex> lock(mtx);  // 自动加锁/解锁
        counter++;
    }

std::thread ta(increment);
std::thread tb(increment);
ta.join(); tb.join();
std::cout << counter << "\n";   // 保证是 2000

// --- future / promise：获取线程返回值 ---
auto asyncCalc = [](int n) -> int {
    return n * n;   // 模拟耗时计算
};

std::future<int> result = std::async(std::launch::async, asyncCalc, 10);
std::cout << "结果: " << result.get() << "\n";   // 100（会等待完成）
```

---

### 8. 其他重要特性速览

```cpp
// --- 初始化列表 ---
std::vector<int> v = {1, 2, 3, 4, 5};
std::map<std::string, int> m = {{"a", 1}, {"b", 2}};

// --- 委托构造函数 ---
class Rect {
    int w, h;
public:
    Rect(int w, int h) : w(w), h(h) {}
    Rect(int side) : Rect(side, side) {}  // 委托给上面的构造函数
};

// --- override 与 final ---
class Base {
    virtual void foo() {}
    virtual void bar() {}
};
class Derived : public Base {
    void foo() override {}   // 编译器检查：确实覆盖了父类方法
    // void bar() overide {}  // 拼写错误 → 编译报错，C++98 会静默失败
};

// --- static_assert：编译期断言 ---
static_assert(sizeof(int) == 4, "需要 32 位 int");
static_assert(std::is_integral<int>::value, "必须是整数类型");
```

---

### C++11 特性全景---
![Pasted image 20260723205050](assets/images/Pasted%20image%2020260723205050.png)

### 本节小结

|特性|解决的痛点|一句话记忆|
|---|---|---|
|`auto`|类型名过长|让编译器帮你写类型|
|Lambda|行为难以就地表达|就地定义匿名函数|
|移动语义|大对象拷贝开销|转移所有权而非复制|
|智能指针|手动 new/delete 泄漏|离开作用域自动释放|
|`nullptr`|NULL 引起重载歧义|类型安全的空指针|
|`constexpr`|运行期才能计算的常量|把计算提前到编译期|
|多线程|依赖平台 API 不可移植|标准库原生支持并发|

---

下一部分是 **C++14**，它是对 C++11 的精炼与完善，特别是泛型 Lambda 和 `make_unique`。说"继续"即可！

## C++14：精炼与完善

C++14 不是大版本，但修复了 C++11 几个明显的遗漏，让代码写起来更流畅。每一个特性都是"本来就该有"的感觉。

---

### 1. 泛型 Lambda（Generic Lambda）

**C++11 的限制**：Lambda 的参数类型必须写死。

```cpp
// C++11：为 int 写一个，为 double 又要写一个
auto addInt    = [](int a, int b)    { return a + b; };
auto addDouble = [](double a, double b) { return a + b; };
```

**C++14**：参数可以用 `auto`，Lambda 自动变成模板。

```cpp
// 一个 lambda，适用所有支持 + 的类型
auto add = [](auto a, auto b) { return a + b; };

add(1, 2);          // → 3        (int)
add(1.5, 2.3);      // → 3.8     (double)
add(std::string("hello"), " world");  // → "hello world"
```

**实际应用**：通用比较器、通用打印器。

```cpp
// 通用排序器：可以排任何有 < 的类型
auto descend = [](auto a, auto b) { return a > b; };

std::vector<int>    nums = {3, 1, 4, 1, 5};
std::vector<double> vals = {3.14, 2.71, 1.41};

std::sort(nums.begin(), nums.end(), descend);
std::sort(vals.begin(), vals.end(), descend);

// 通用打印：配合范围 for
auto print = [](auto& container) {
    for (auto& x : container)
        std::cout << x << " ";
    std::cout << "\n";
};

print(nums);   // 5 4 3 1 1
print(vals);   // 3.14 2.71 1.41
```

---

### 2. `std::make_unique`：填补 C++11 的遗漏

C++11 有 `make_shared` 却忘了 `make_unique`，C++14 补上了。

**为什么要用 `make_unique` 而不是 `new`？**

```cpp
// 危险：如果 bar() 先于 foo() 抛出异常，内存泄漏！
// 因为 C++ 不保证函数参数的求值顺序
func(std::unique_ptr<Foo>(new Foo()), bar());

// 安全：make_unique 是原子操作，不会泄漏
func(std::make_unique<Foo>(), bar());
```

**日常用法**：

```cpp
// C++11 的写法（有隐患）
std::unique_ptr<int> p1(new int(42));

// C++14 的正确写法
auto p2 = std::make_unique<int>(42);
auto p3 = std::make_unique<std::string>("hello");
auto p4 = std::make_unique<int[]>(10);   // 数组

// 工厂函数：返回 unique_ptr 明确传递所有权
class Animal { public: virtual void speak() = 0; virtual ~Animal(){} };
class Dog : public Animal { public: void speak() override { std::cout << "Woof\n"; } };
class Cat : public Animal { public: void speak() override { std::cout << "Meow\n"; } };

std::unique_ptr<Animal> createAnimal(std::string type) {
    if (type == "dog") return std::make_unique<Dog>();
    if (type == "cat") return std::make_unique<Cat>();
    return nullptr;
}

auto animal = createAnimal("dog");
animal->speak();   // Woof
```

---

### 3. 函数返回类型推导

**C++11**：Lambda 可以推导返回类型，但普通函数不行。**C++14** 补上了。

```cpp
// C++11：必须手写返回类型
auto square(int x) -> int { return x * x; }

// C++14：直接推导，-> int 可省略
auto square(int x) { return x * x; }   // 推导为 int

// 更复杂的情况
auto makeGreeting(std::string name) {
    return "Hello, " + name + "!";   // 推导为 std::string
}

// 递归函数需要至少一个非递归的 return 让编译器先推导出类型
auto fibonacci(int n) -> int {   // 递归时仍建议显式写返回类型
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}
```

**配合模板使用时最有价值**：

```cpp
// 返回类型取决于模板参数，手写很麻烦，推导很优雅
template<typename Container>
auto firstElement(Container& c) {
    return c.front();   // 自动推导为容器的元素类型
}

std::vector<int>    vi = {1, 2, 3};
std::vector<double> vd = {1.1, 2.2};

auto a = firstElement(vi);  // int
auto b = firstElement(vd);  // double
```

---

### 4. 变量模板（Variable Templates）

C++11 有函数模板、类模板，C++14 补上了变量模板——让常量也可以泛型化。

```cpp
// 以前：为每种类型手写一个常量
const double pi_double = 3.14159265358979;
const float  pi_float  = 3.14159f;

// C++14：一个模板搞定
template<typename T>
constexpr T pi = T(3.14159265358979323846);

double area = pi<double> * r * r;
float  approx = pi<float> * r * r;

// 标准库里大量使用：
// std::is_integral_v<T> 就是变量模板（C++17 正式引入，14 可手写）
template<typename T>
constexpr bool isIntegral = std::is_integral<T>::value;

static_assert(isIntegral<int>,    "int 是整数类型");
static_assert(!isIntegral<float>, "float 不是整数类型");
```

**实际应用**：物理单位常量库。

```cpp
template<typename T> constexpr T gravity    = T(9.80665);   // m/s²
template<typename T> constexpr T lightSpeed = T(299792458); // m/s
template<typename T> constexpr T planck     = T(6.626e-34); // J·s

double force = 70.0 * gravity<double>;   // 人体重力：70kg * g
```

---

### 5. Lambda 捕获表达式（Capture Initializers）

C++11 的 Lambda 只能捕获已有的变量，**C++14** 允许在捕获列表里创建新变量，包括移动捕获。

```cpp
// 移动捕获：把 unique_ptr 移进 lambda（C++11 做不到！）
auto ptr = std::make_unique<int>(42);

// C++11：unique_ptr 不能复制，无法捕获 → 编译错误
// auto f = [ptr]() { return *ptr; };  // ❌

// C++14：用初始化捕获，移动进去
auto f = [p = std::move(ptr)]() {
    return *p;
};
std::cout << f() << "\n";   // 42
// ptr 已经是 nullptr，所有权在 lambda 里

// 捕获时重命名 + 计算
int x = 10;
auto g = [y = x * 2]() { return y; };   // y = 20，不影响外部 x
std::cout << g() << "\n";   // 20

// 实际场景：异步任务携带数据
auto sendData = [data = std::move(bigBuffer), id = sessionId]() {
    network.send(id, data);
};
threadPool.submit(std::move(sendData));
```

---

### 6. `[[deprecated]]` 属性

给过时的 API 打标记，调用时编译器发出警告，但不报错，给迁移留时间。

```cpp
[[deprecated("请使用 newCalculate() 替代")]]
int oldCalculate(int x) { return x * 2; }

int newCalculate(int x, int factor = 2) { return x * factor; }

int r = oldCalculate(5);
// 编译警告：'oldCalculate' is deprecated: 请使用 newCalculate() 替代
```

**实际应用**：大型项目 API 迭代时，给调用者一个过渡期，而不是直接删掉函数破坏兼容性。

---

### 7. 二进制字面量 & 数字分隔符

```cpp
// 二进制字面量（调试位运算时极其清晰）
int mask  = 0b1111'0000;   // 240
int flags = 0b0000'1010;   // 10

// 数字分隔符：单引号 ' 作为视觉分隔，不影响值
long long billion  = 1'000'000'000;
double   pi        = 3.141'592'653'589;
int      hexColor  = 0xFF'AA'BB;

// 对比：哪个更容易数清楚有几位？
long long a = 1000000000;    // 10亿？100亿？
long long b = 1'000'000'000; // 一眼看出：10亿
```

---

### C++14 全貌速览---
![Pasted image 20260723205011](assets/images/Pasted%20image%2020260723205011.png)

### 本节小结

|特性|一句话记忆|
|---|---|
|泛型 Lambda|参数写 `auto`，lambda 自动泛型化|
|`make_unique`|创建 `unique_ptr` 的安全方式|
|返回类型推导|普通函数也能省略返回类型|
|变量模板|常量也能像函数一样泛型化|
|捕获初始化|Lambda 捕获时可移动、可计算|
|`[[deprecated]]`|标记过时 API，给调用者警告|
|数字分隔符|`1'000'000` 增强可读性|

C++14 的核心精神是：**C++11 的思想是对的，但有些地方没做完，14 补上了**。写起来更顺手，没有大的思维跳跃。

---

下一部分是 **C++17**，引入了结构化绑定、`std::optional`、`if constexpr`、`std::variant` 等实用特性，是生产代码里用得最多的版本之一。说"继续"即可！
