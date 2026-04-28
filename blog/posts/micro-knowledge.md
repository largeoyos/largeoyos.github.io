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


