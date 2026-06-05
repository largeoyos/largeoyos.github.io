# C++ 中 std::min_element / std::max_element 用法详解

`std::min_element` 和 `std::max_element` 是 `<algorithm>` 头文件中用于在容器中查找最小/最大元素的函数模板。

## 函数签名

```cpp
template<class ForwardIt>
ForwardIt min_element(ForwardIt first, ForwardIt last);

template<class ForwardIt, class Compare>
ForwardIt min_element(ForwardIt first, ForwardIt last, Compare comp);

template<class ForwardIt>
ForwardIt max_element(ForwardIt first, ForwardIt last);

template<class ForwardIt, class Compare>
ForwardIt max_element(ForwardIt first, ForwardIt last, Compare comp);
```

- 返回指向最小/最大元素的**迭代器**
- 区间为 `[first, last)`，即左闭右开
- 如果区间为空，返回 `last`
- 如果多个元素并列，返回**第一个**遇到的最值

## min_element — 找最小值

```cpp
#include <iostream>
#include <vector>
#include <algorithm>

int main() {
    std::vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};
    
    auto it = std::min_element(v.begin(), v.end());
    if (it != v.end()) {
        std::cout << "最小值: " << *it << std::endl;     // 1
        std::cout << "位置: " << (it - v.begin()) << std::endl; // 1（第一个 1）
    }
    
    return 0;
}
```

## max_element — 找最大值

```cpp
auto it = std::max_element(v.begin(), v.end());
if (it != v.end()) {
    std::cout << "最大值: " << *it << std::endl;         // 9
    std::cout << "位置: " << (it - v.begin()) << std::endl; // 5
}
```

## 同时找最小和最大：minmax_element（C++11）

用 `minmax_element` 一次遍历同时找到最小和最大，效率比分别调用两次更高：

```cpp
#include <algorithm>

std::vector<int> v = {3, 1, 4, 1, 5, 9, 2, 6};
auto [min_it, max_it] = std::minmax_element(v.begin(), v.end());

std::cout << "最小值: " << *min_it << std::endl;   // 1
std::cout << "最大值: " << *max_it << std::endl;   // 9
```

C++17 结构化绑定让写法更简洁。返回 `std::pair`，`.first` 是最小迭代器，`.second` 是最大迭代器。

## 自定义比较器

通过第三个参数传入自定义比较函数，实现按特定规则查找：

```cpp
// 按绝对值找最小
std::vector<int> v = {-5, 2, -3, 8, -1};
auto it = std::min_element(v.begin(), v.end(),
    [](int a, int b) { return std::abs(a) < std::abs(b); });
// *it == -1

// 按字符串长度找最长
std::vector<std::string> words = {"apple", "banana", "cherry", "date"};
auto longest = std::max_element(words.begin(), words.end(),
    [](const std::string& a, const std::string& b) {
        return a.size() < b.size();
    });
// *longest == "banana"
```

**注意**：比较器应实现**严格弱序**（strict weak ordering），即 `comp(a, b)` 返回 `true` 表示 "a 排在 b 前面"（a 比 b 更小）。

## 普通数组也可以用

迭代器接口使它们兼容 C 风格数组：

```cpp
int arr[] = {3, 1, 4, 1, 5, 9, 2, 6};
size_t n = sizeof(arr) / sizeof(arr[0]);

auto min_it = std::min_element(arr, arr + n);
auto max_it = std::max_element(arr, arr + n);

std::cout << "最小值: " << *min_it << std::endl;
std::cout << "最大值: " << *max_it << std::endl;
```

## min / max / minmax — 比较两个值

`std::min` 和 `std::max` 用于**两个值之间**的比较，与 `min_element`/`max_element`（**区间**内查找）不同：

```cpp
int a = 5, b = 3;
int smaller = std::min(a, b);   // 3
int larger  = std::max(a, b);   // 5

// 带比较器的版本
int abs_min = std::min(-5, 3, [](int x, int y) {
    return std::abs(x) < std::abs(y);
});  // 3

// C++11: minmax 返回 pair
auto [lo, hi] = std::minmax(a, b);  // lo=3, hi=5
```

## min_element vs min：区别对照

| 函数 | 作用 | 参数 | 返回值 |
|------|------|------|--------|
| `std::min(a, b)` | 两个值取较小 | 两个值 | 较小值的**引用** |
| `std::min_element(first, last)` | 区间内找最小 | 迭代器范围 | 指向最小值的**迭代器** |

## 常见陷阱

### 区间为空

```cpp
std::vector<int> empty;
auto it = std::min_element(empty.begin(), empty.end());
if (it == empty.end()) {
    // 必须检查，否则解引用空迭代器是未定义行为
}
```

### 误用 end() 而非 begin()

```cpp
auto it = std::min_element(v.end(), v.begin());  // 错误！first > last，未定义行为
```

### 比较器不满足严格弱序

```cpp
// 错误：缺了相等情况的处理
std::min_element(v.begin(), v.end(), [](int a, int b) { return a <= b; });
// 正确
std::min_element(v.begin(), v.end(), [](int a, int b) { return a < b; });
```

## XX 总结

| 函数 | 用途 | 头文件 |
|------|------|--------|
| `min_element` | 区间内找最小值 | `<algorithm>` |
| `max_element` | 区间内找最大值 | `<algorithm>` |
| `minmax_element` | 区间内同时找最小和最大 | `<algorithm>` |
| `min` | 两个值取较小 | `<algorithm>` |
| `max` | 两个值取较大 | `<algorithm>` |
| `minmax` | 两个值同时取较小和较大 | `<algorithm>` |

记住：`min_element` / `max_element` 返回**迭代器**（需要解引用），`min` / `max` 返回**引用**（直接使用）。区间为空时必须检查返回值是否等于 `last`。
