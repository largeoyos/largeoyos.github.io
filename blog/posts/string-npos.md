# C++ 中 std::string::npos 详解

`std::string::npos` 是 C++ 标准库中 `std::string` 类的一个静态常量，常用于字符串查找操作的结果判断。

## 定义与值

```cpp
static const size_type npos = -1;
```

- 类型是 `std::string::size_type`（通常是 `size_t`）
- 值为 `size_t(-1)`，即无符号整数的最大值
  - 32 位系统上为 `4294967295`
  - 64 位系统上为 `18446744073709551615`

## 主要用途：查找失败判断

最常见的用法是作为 `find()`、`rfind()`、`find_first_of()` 等查找函数的**返回值**，表示"未找到"：

```cpp
#include <iostream>
#include <string>

int main() {
    std::string s = "hello world";
    
    size_t pos = s.find("xyz");
    
    if (pos == std::string::npos) {
        std::cout << "未找到匹配子串" << std::endl;
    }
    
    return 0;
}
```

## 禁忌：不要用 int 接收返回值

一个常见陷阱是用 `int` 而非 `size_t` 接收 `find()` 的返回值：

```cpp
// 错误示例
int pos = s.find("xyz");     // int 无法表示 npos 的全部值域
if (pos == std::string::npos) // 64 位下可能永远为 false
```

因为 `npos` 在 64 位系统上是 `18446744073709551615`，而 `int` 最大值只有 `2147483647`，转换后会截断，导致永远不等于 `npos`。

**正确做法**：

```cpp
size_t pos = s.find("xyz");  // 使用正确的类型
if (pos == std::string::npos) {
    // 处理未找到
}
```

也可以使用 C++17 的 `auto`：

```cpp
auto pos = s.find("xyz");
if (pos == std::string::npos) { ... }
```

## find / rfind 详解

`find` 和 `rfind` 是最常用的两个字符串查找成员函数，都返回匹配位置或 `npos`。

### find — 从前往后找

```cpp
size_type find(const string& str, size_type pos = 0) const;
size_type find(const char* s, size_type pos = 0) const;
size_type find(const char* s, size_type pos, size_type n) const;  // 查找 s 的前 n 个字符
size_type find(char c, size_type pos = 0) const;
```

第二个参数 `pos` 指定从哪个位置开始搜索：

```cpp
std::string s = "hello world, hello again";

auto p1 = s.find("hello");        // 从 0 开始 → 0
auto p2 = s.find("hello", 1);     // 从下标 1 开始 → 13（第二个 hello）
auto p3 = s.find("world");        // → 6
auto p4 = s.find("xyz");          // → npos
```

### rfind — 从后往前找

```cpp
size_type rfind(const string& str, size_type pos = npos) const;
size_type rfind(const char* s, size_type pos = npos) const;
size_type rfind(const char* s, size_type pos, size_type n) const;
size_type rfind(char c, size_type pos = npos) const;
```

`pos` 默认是 `npos`（从末尾开始找），返回最后一次出现的位置：

```cpp
std::string s = "hello world, hello again";

auto p1 = s.rfind("hello");            // → 13（最后一个 hello）
auto p2 = s.rfind("hello", 12);        // 在下标 12 之前找 → 0
auto p3 = s.rfind("world");            // → 6
auto p4 = s.rfind("xyz");              // → npos
```

### 典型模式：提取文件扩展名

```cpp
std::string filename = "example.tar.gz";
auto dot = filename.rfind('.');
if (dot != std::string::npos) {
    std::string ext = filename.substr(dot);   // ".gz"
}
```

用 `rfind` 而非 `find` 能正确取到最后一个 `.`，避免误取中间的扩展名。

### find_first_of / find_last_of — 查找字符集合

```cpp
std::string s = "hello:world-example";
auto p1 = s.find_first_of(":-");    // → 5（第一个 ':'）
auto p2 = s.find_last_of(":-");     // → 11（最后一个 '-'）
```

## 其他相关用法

### 作为参数表示"直到末尾"

`std::string` 的部分成员函数用 `npos` 表示"剩余全部内容"：

```cpp
std::string s = "hello world";
std::string sub = s.substr(6);          // 从 pos 6 到末尾 → "world"
std::string sub2 = s.substr(6, 5);      // 从 pos 6 取 5 个字符 → "world"
std::string sub3 = s.substr(6, std::string::npos); // 显式表示到末尾 → "world"
```

### erase 配合 npos

```cpp
s.erase(5, std::string::npos); // 删除从 pos 5 到末尾的所有字符
```

## 延伸：vector 也有 npos 吗？

`std::vector` 没有 `npos` 成员，因为 `vector` 没有 `find()` 成员函数（需用 `<algorithm>` 的 `std::find`）。`npos` 是 `std::basic_string` 及其特化（`string`、`wstring`、`u8string` 等）特有的。

## 总结

| 要点 | 说明 |
|------|------|
| 值 | `size_t(-1)`，即无符号整型最大值 |
| 类型 | `std::string::size_type`（通常为 `size_t`） |
| 用途 | 字符串查找失败返回值 |
| `find` | 从前往后找，`pos` 参数指定起始位置 |
| `rfind` | 从后往前找，`pos` 参数指定搜索截止位置 |
| `find_first_of` | 查找字符集合中任一字符首次出现的位置 |
| `find_last_of` | 查找字符集合中任一字符最后出现的位置 |
| 坑 | 不要用 `int` 接收查找结果 |
| 适用 | `std::string` 及所有 `std::basic_string` 特化 |
