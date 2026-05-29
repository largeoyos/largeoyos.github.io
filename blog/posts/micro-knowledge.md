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

## 2026-05-29

### C++ `string::rfind` 逆向查找

`rfind` 是 `std::string` 的成员函数，功能与 `find` 相反——从字符串的**末尾**开始向前查找子串或字符。

**基本语法：**

```cpp
size_t rfind(const string& str, size_t pos = npos) const;  // 查找子串
size_t rfind(const char* s, size_t pos = npos) const;       // 查找 C 风格字符串
size_t rfind(char c, size_t pos = npos) const;              // 查找单个字符
```

- 返回匹配的第一个字符的**位置索引**（从 0 开始）
- 若未找到，返回 `string::npos`
- `pos`：搜索截至位置，默认为 `npos`（即从末尾往前搜索整个字符串）

**与 `find` 的关键区别：**

| 方法 | 搜索方向 | 适用场景 |
|------|---------|---------|
| `find` | 从左到右 | 查找第一次出现的位置 |
| `rfind` | 从右到左 | 查找最后一次出现的位置 |

**实用示例：**

```cpp
#include <iostream>
#include <string>
using namespace std;

int main() {
    string path = "/home/user/docs/file.txt";

    // 1. 提取文件名（找到最后一个 '/'）
    size_t pos = path.rfind('/');
    if (pos != string::npos) {
        string filename = path.substr(pos + 1);
        cout << "文件名: " << filename << endl;  // 输出: file.txt
    }

    // 2. 提取文件扩展名
    pos = path.rfind('.');
    if (pos != string::npos) {
        string ext = path.substr(pos);
        cout << "扩展名: " << ext << endl;      // 输出: .txt
    }

    // 3. 限制搜索范围：只在前半段查找
    string text = "abaaba";
    pos = text.rfind("ab", 3);   // 在位置 0~3 范围内从右往左找
    cout << "前半段中最后一个 ab 在: " << pos << endl;  // 输出: 3

    // 4. 找不到的情况
    pos = text.rfind("xyz");
    if (pos == string::npos) {
        cout << "未找到子串" << endl;
    }

    return 0;
}
```

**常见用途：**
- 解析文件路径（提取文件名、目录名）
- 获取文件扩展名
- 从 URL 中提取最后一段
- 在长字符串中定位最后一个关键词出现的位置

**注意陷阱：**
- `rfind` 返回的索引仍然是从字符串**开头**数的位置，不是从末尾数的位置
- `rfind` 查找子串时，子串本身的字符顺序不变（仍然是正向匹配），只是搜索方向是从右往左


