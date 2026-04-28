# 细小知识记录

这里用于记录平时遇到的一些细微但很有用的编程知识点。后续会按照日期不断追加内容。

## 2026-04-28

### C++ 输入流与格式输出小技巧

**1. `cin >> noskipws` 的使用与回车符处理**

- `noskipws` 是一个流操纵符，用于告诉 `cin` **不要跳过空白符**（例如空格、换行）。如果不使用它，`cin` 默认会忽略掉空白字符。
- `cin.ignore(1000, '\n')`：可以忽略输入缓冲区中的字符，直到遇到换行符 `\n` 或达到指定数量（如1000），常用于将前文残留的回车符丢弃掉。
- 注意：切换为 `noskipws` 之后，在后续不需要提取空白符的地方，**记得使用 `skipws` 切换回来**。

示例代码：
```cpp
for(int i = 1; i <= n; i++){
    cin >> noskipws >> T[i].value;
    cin >> skipws >> T[i].weight;
    cin.ignore(1000, '\n');
}
```

**2. 左对齐输出格式化**

- 使用 `std::left` 配合 `std::setw(5)` 可以很方便地实现输出内容左侧对齐并且占用固定字符宽度：
```cpp
cout << left << setw(5) << value;
```

**3. Windows 下 C++ 控制台输出汉字乱码解决**

当使用 C++ 在 Windows 控制台打印中文字符时，容易出现乱码。可以引入 `<windows.h>`，并将控制台输入输出的编码页设定为 UTF-8（65001）：
```cpp
#include <iostream>
#include <windows.h>

int main() {
    // 设置控制台输出和输入为 UTF-8 (65001)
    SetConsoleOutputCP(65001);
    SetConsoleCP(65001);

    // 你的逻辑...
    std::cout << "按先序输入..." << std::endl;
    return 0;
}
```

### `#pragma` 预处理指令常用场景

`#pragma` 是 C/C++ 中一个非常特殊的预处理指令，它的核心作用是：向编译器发送特定的指令。
由于不同的编译器（如 GCC, Clang, MSVC）功能不同，`#pragma` 的具体参数往往是不可移植的。如果编译器不认识某个 `#pragma`，它会直接忽略掉，而不会报错。

以下是开发中最常用的几种用法：

**1. 防止头文件重复包含：`#pragma once`**
这是目前最常见的用法，几乎所有现代编译器都支持。它的作用等同于传统的 `ifndef/define/endif` 保护。

```cpp
#pragma once  // 只要在头文件顶部加这一行，编译器就保证该文件只被编译一次

// 相比老式的做法：
// #ifndef BITREE_H
// #define BITREE_H
// ... 代码 ...
// #endif
```
优点：写法简洁，避免了宏定义重名冲突，编译效率略高。

**2. 内存对齐控制：`#pragma pack`**
在嵌入式开发或网络协议开发中，我们需要精确控制结构体（struct）在内存中的对齐方式，以节省空间或匹配硬件格式。

```cpp
#pragma pack(push, 1) // 保存当前对齐状态，并设置对齐字节为 1（紧凑排列）
struct MyStruct {
    char a;    // 1 byte
    int b;     // 4 bytes
};
#pragma pack(pop)     // 还原之前的对齐状态
```
如果不加 `pragma`，`MyStruct` 可能占用 8 字节（由于 4 字节对齐）；加上 `pragma pack(1)` 后，它只占用 5 字节。


