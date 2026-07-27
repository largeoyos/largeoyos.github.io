## 数据结构复习:顺序表

我们来补完**顺序表**——线性表的顺序存储结构。顺序表虽然看起来简单,但它是**一切动态数组的原型**(`std::vector` 的底层就是动态顺序表),也是**考研线性表章节的半壁江山**。

本章我会覆盖**静态顺序表**和**动态顺序表**两种形式,这也是考研教材(严蔚敏、王道)的标准分法。

### 一、顺序表的两种形式

**静态顺序表**:用**定长数组**存储,容量在编译期确定,简单直接但容量固定。适合元素数量有明确上限的场景。

**动态顺序表**:用**堆上动态分配的数组**存储,容量可以在运行时扩展(容量满了就 new 一块更大的,把旧数据搬过去)。`std::vector` 就是这种结构。

**两者共同的特点**:元素在内存中**连续存放**,支持 **O(1) 的随机访问**(通过下标),但插入/删除平均需要 O(n)(要搬移元素)。

---

### 二、顺序表与链表的本质对比

在讲代码之前,先从宏观把两者对比清楚(这段你要记熟,考研简答题常考):

**存储**:顺序表连续;链表离散(通过指针串联)。

**访问**:顺序表 O(1) 随机访问;链表 O(n) 顺序访问。

**插入删除**:顺序表 O(n)(要搬移后续元素);链表 O(1)(只改指针),但找到"那个位置"链表要 O(n)、顺序表要 O(1)——**所以实际操作的总代价往往差不多**。

**空间**:顺序表无指针开销但可能预留空位;链表每个节点有指针开销但不浪费。

**扩容**:静态顺序表无法扩;动态顺序表扩容要 O(n) 的一次大搬迁;链表天然无容量限制。

---

### 三、项目文件组织

```
DataStructure/
└── SeqList/
    ├── SeqList.h        // 静态顺序表
    ├── SeqList.cpp
    ├── DySeqList.h      // 动态顺序表
    ├── DySeqList.cpp
    └── main.cpp
```

我们把静态和动态分成两个文件,命名上用 `SqList`(静态)和 `DySqList`(动态)区分,**像之前栈的 SqStack/LkStack 一样**,让两种共存不冲突。

---

### 四、静态顺序表(SeqList.h)

cpp

```cpp
#pragma once

#define MAXSIZE 100
typedef int ElemType;

typedef struct {
    ElemType data[MAXSIZE];    // 定长数组存元素
    int length;                // 当前元素个数(注意:不是下标,是 count)
} SqList;

// ========== 基本操作 ==========
bool InitList(SqList &L);
bool ListEmpty(SqList L);
int  ListLength(SqList L);

// ========== 增删查改 ==========
bool ListInsert(SqList &L, int i, ElemType e);    // 在第 i 位插入(i 从 1 起)
bool ListDelete(SqList &L, int i, ElemType &e);   // 删除第 i 位
int  LocateElem(SqList L, ElemType e);            // 按值查找,返回位序(1 起)
bool GetElem(SqList L, int i, ElemType &e);       // 按位查找
bool ListUpdate(SqList &L, int i, ElemType e);    // 修改第 i 位

// ========== 打印 ==========
void PrintList(SqList L);
```

**两个关于"位序"的约定你必须记住**:

第一,`length` 表示**元素个数**,合法下标范围是 `data[0..length-1]`。

第二,外部接口用**位序**(从 1 开始)表达位置,内部实现时转成下标(位序 i 对应下标 i-1)。这是严蔚敏教材的标准约定,**考研大题按这个套路写不会错**。

---

### 五、SeqList.cpp 核心实现

#### 5.1 初始化与基础判断

cpp

```cpp
#include "SeqList.h"
#include <iostream>
using namespace std;

bool InitList(SqList &L) {
    L.length = 0;              // 清零即可,data 不用初始化
    return true;
}

bool ListEmpty(SqList L) {
    return L.length == 0;
}

int ListLength(SqList L) {
    return L.length;
}
```

#### 5.2 插入(重点,考察点多)

在位序 `i` 插入新元素 `e`,规则:

合法 i 的范围是 `1 ≤ i ≤ length + 1`(注意可以等于 length+1,表示插入到末尾);表不能满;**从后往前**把 i 位置起的元素依次后移一格,空出位置给 e。

cpp

```cpp
bool ListInsert(SqList &L, int i, ElemType e) {
    if (i < 1 || i > L.length + 1) return false;    // 位置非法
    if (L.length >= MAXSIZE) return false;           // 表满

    // 从后往前搬移:原 data[length-1] 到 data[length],…… data[i-1] 到 data[i]
    for (int j = L.length; j >= i; j--) {
        L.data[j] = L.data[j - 1];
    }
    L.data[i - 1] = e;          // 位序 i 对应下标 i-1
    L.length++;
    return true;
}
```

**为什么必须从后往前搬?** 因为如果从前往后,例如要把 `data[i-1]` 到 `data[length-1]` 全体后移,你会在 `data[i-1] = data[i-2]` 的时候还没问题,但接着 `data[i] = data[i-1]` 时 `data[i-1]` 已经是覆盖后的值了,造成数据错乱。**后移搬移必须反向进行**,这是考研常考的细节。

**时间复杂度分析**:

最好 O(1)(插入到末尾,不用搬移)。最坏 O(n)(插入到开头,搬移 n 个)。平均 O(n),具体是 n/2。

#### 5.3 删除

删除位序 `i` 的元素,用 `&e` 带回被删的值:

cpp

```cpp
bool ListDelete(SqList &L, int i, ElemType &e) {
    if (i < 1 || i > L.length) return false;

    e = L.data[i - 1];          // 先保存要删的值

    // 从前往后搬移:data[i] 到 data[i-1]、data[i+1] 到 data[i]、……
    for (int j = i; j < L.length; j++) {
        L.data[j - 1] = L.data[j];
    }
    L.length--;
    return true;
}
```

**删除是从前往后搬**,和插入相反。原因对称:如果从后往前删,`data[length-1] = data[length]` 直接越界了(data[length] 是"length位置",但那位置的值是未定义的)。

#### 5.4 查找(按值 & 按位)

cpp

```cpp
int LocateElem(SqList L, ElemType e) {
    for (int i = 0; i < L.length; i++) {
        if (L.data[i] == e) return i + 1;   // 返回位序(1 起)
    }
    return 0;                               // 0 表示未找到
}

bool GetElem(SqList L, int i, ElemType &e) {
    if (i < 1 || i > L.length) return false;
    e = L.data[i - 1];
    return true;
}
```

**按位查找是 O(1)**——这是顺序表相对于链表的最大优势。**按值查找是 O(n)**——必须遍历。

#### 5.5 修改与打印

cpp

```cpp
bool ListUpdate(SqList &L, int i, ElemType e) {
    if (i < 1 || i > L.length) return false;
    L.data[i - 1] = e;
    return true;
}

void PrintList(SqList L) {
    for (int i = 0; i < L.length; i++) {
        cout << L.data[i] << " ";
    }
    cout << endl;
}
```

---

### 六、动态顺序表(DySeqList.h)

静态顺序表的缺点很明显:容量写死,不够用时无法扩展。**动态顺序表**用堆内存 + 动态扩容解决这个问题。

cpp

```cpp
#pragma once

#define INIT_SIZE 10        // 初始容量
#define GROW_STEP 10        // 每次扩容增量(或用倍增策略)
typedef int ElemType;

typedef struct {
    ElemType *data;         // 指向堆上分配的数组
    int length;             // 当前元素个数
    int capacity;           // 当前容量(最多能放多少)
} DySqList;

// ========== 基本操作 ==========
bool InitList(DySqList &L);
void DestroyList(DySqList &L);    // 动态版本必须有销毁!
bool ListEmpty(DySqList L);
int  ListLength(DySqList L);

// ========== 增删查改 ==========
bool ListInsert(DySqList &L, int i, ElemType e);
bool ListDelete(DySqList &L, int i, ElemType &e);
int  LocateElem(DySqList L, ElemType e);
bool GetElem(DySqList L, int i, ElemType &e);

// ========== 扩容(辅助函数)==========
bool IncreaseCapacity(DySqList &L, int delta);

void PrintList(DySqList L);
```

**与静态版的关键差异**:

第一,`data` 是**指针**而不是定长数组,指向堆上的动态内存。

第二,多了 `capacity` 字段跟踪当前数组容量。

第三,**必须有 `DestroyList`**——堆上的内存需要手动释放,否则内存泄漏。这是和静态版最大的区别。

---

### 七、DySeqList.cpp 实现

#### 7.1 初始化与销毁

cpp

```cpp
#include "DySeqList.h"
#include <iostream>
using namespace std;

bool InitList(DySqList &L) {
    L.data = new ElemType[INIT_SIZE];    // 分配初始空间
    if (L.data == nullptr) return false;
    L.length = 0;
    L.capacity = INIT_SIZE;
    return true;
}

void DestroyList(DySqList &L) {
    delete[] L.data;                     // 释放堆内存(必须用 delete[])
    L.data = nullptr;
    L.length = 0;
    L.capacity = 0;
}
```

**注意 `delete[]` 而不是 `delete`**——数组必须配 `new[]` 和 `delete[]`,单个对象用 `new` 和 `delete`。这是 C++ 内存管理的基本常识,写错会有未定义行为。

#### 7.2 扩容函数(核心)

这是动态顺序表的灵魂:容量不够时**分配一块更大的内存,把旧数据搬过去,释放旧内存**。

cpp

```cpp
bool IncreaseCapacity(DySqList &L, int delta) {
    int newCap = L.capacity + delta;
    ElemType *newData = new ElemType[newCap];
    if (newData == nullptr) return false;

    // 搬移旧数据
    for (int i = 0; i < L.length; i++) {
        newData[i] = L.data[i];
    }

    delete[] L.data;                     // 释放旧内存
    L.data = newData;                    // 指向新内存
    L.capacity = newCap;
    return true;
}
```

**关于扩容策略**:我们这里用了"**每次加固定量**"(比如每次 +10)。实际工程中更常见的是"**倍增策略**"(每次容量 × 2),`std::vector` 就是这么做的。倍增策略能保证 **n 次插入的均摊时间复杂度是 O(n)**,即每次插入均摊 O(1)——这是非常重要的性能保证。

**固定增量 vs 倍增的区别**:固定增量下 n 次插入的总搬迁次数是 O(n²/k),均摊每次 O(n/k);倍增下总搬迁是 O(n),均摊每次 O(1)。**考研偶尔考均摊分析,记住 vector 是倍增策略**。

#### 7.3 插入(带自动扩容)

cpp

```cpp
bool ListInsert(DySqList &L, int i, ElemType e) {
    if (i < 1 || i > L.length + 1) return false;

    // 容量满则自动扩容
    if (L.length >= L.capacity) {
        if (!IncreaseCapacity(L, GROW_STEP)) return false;
    }

    for (int j = L.length; j >= i; j--) {
        L.data[j] = L.data[j - 1];
    }
    L.data[i - 1] = e;
    L.length++;
    return true;
}
```

**和静态版的唯一差异**:多了"满则扩容"的逻辑。其他搬移、赋值过程完全相同。**这就是数据结构抽象的威力**——接口一致,实现细节隐藏。

#### 7.4 其他操作

删除、查找、修改、打印与静态版几乎完全相同,只是类型从 `SqList` 换成 `DySqList`:

cpp

```cpp
bool ListDelete(DySqList &L, int i, ElemType &e) {
    if (i < 1 || i > L.length) return false;
    e = L.data[i - 1];
    for (int j = i; j < L.length; j++) {
        L.data[j - 1] = L.data[j];
    }
    L.length--;
    return true;
}

int LocateElem(DySqList L, ElemType e) {
    for (int i = 0; i < L.length; i++) {
        if (L.data[i] == e) return i + 1;
    }
    return 0;
}

bool GetElem(DySqList L, int i, ElemType &e) {
    if (i < 1 || i > L.length) return false;
    e = L.data[i - 1];
    return true;
}

bool ListEmpty(DySqList L) { return L.length == 0; }
int  ListLength(DySqList L) { return L.length; }

void PrintList(DySqList L) {
    cout << "[len=" << L.length << "/cap=" << L.capacity << "] ";
    for (int i = 0; i < L.length; i++) {
        cout << L.data[i] << " ";
    }
    cout << endl;
}
```

我在 `PrintList` 里额外打印了 length 和 capacity,方便观察扩容过程。

---

### 八、测试代码(main.cpp)

cpp

```cpp
#include "SeqList.h"
#include "DySeqList.h"
#include <iostream>
using namespace std;

int main() {
    // ========== 测试静态顺序表 ==========
    cout << "===== 静态顺序表 =====" << endl;
    SqList L;
    InitList(L);

    for (int i = 1; i <= 5; i++) ListInsert(L, i, i * 10);
    cout << "依次尾插 10 20 30 40 50: ";
    PrintList(L);                                  // 10 20 30 40 50

    ListInsert(L, 1, 5);                           // 在开头插入 5
    cout << "开头插入 5: ";
    PrintList(L);                                  // 5 10 20 30 40 50

    ListInsert(L, 4, 25);                          // 中间插入
    cout << "第 4 位插入 25: ";
    PrintList(L);                                  // 5 10 20 25 30 40 50

    int e;
    ListDelete(L, 1, e);
    cout << "删除第 1 位(值 " << e << "): ";
    PrintList(L);                                  // 10 20 25 30 40 50

    cout << "查找 25 的位序: " << LocateElem(L, 25) << endl;   // 3

    // ========== 测试动态顺序表 ==========
    cout << "\n===== 动态顺序表 =====" << endl;
    DySqList DL;
    InitList(DL);

    // 连续插入 15 个,观察 capacity 从 10 扩到 20
    for (int i = 1; i <= 15; i++) {
        ListInsert(DL, i, i);
        if (i == 10 || i == 11 || i == 15) {
            cout << "插入 " << i << " 个后: ";
            PrintList(DL);
        }
    }

    DestroyList(DL);                                // 必须销毁!
    return 0;
}
```

预期输出:

```
===== 静态顺序表 =====
依次尾插 10 20 30 40 50: 10 20 30 40 50
开头插入 5: 5 10 20 30 40 50
第 4 位插入 25: 5 10 20 25 30 40 50
删除第 1 位(值 5): 10 20 25 30 40 50
查找 25 的位序: 3

===== 动态顺序表 =====
插入 10 个后: [len=10/cap=10] 1 2 3 4 5 6 7 8 9 10
插入 11 个后: [len=11/cap=20] 1 2 3 4 5 6 7 8 9 10 11
插入 15 个后: [len=15/cap=20] 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15
```

**观察点**:插入第 11 个元素时触发扩容,cap 从 10 变成 20。这正是动态顺序表相对静态表的优势。

---

### 九、高频经典算法题(必会)

下面几个是**顺序表相关的经典考研题**,我给出思路,你可以自己写代码。每题都**配合顺序表的特性**来设计,这是这一节最值得训练的能力。

#### 9.1 删除所有值为 x 的元素(要求 O(n) 时间、O(1) 空间)

**朴素思路**:每找到一个 x 就调用 ListDelete 删除——但这是 O(n²),因为每次删除都搬移。

**最优思路**(**双指针扫描**):用指针 k 记录"保留元素"的写入位置,遍历原数组,非 x 的元素写到 k 位置并 k++。

cpp

```cpp
void DelAllX(SqList &L, ElemType x) {
    int k = 0;
    for (int i = 0; i < L.length; i++) {
        if (L.data[i] != x) {
            L.data[k++] = L.data[i];
        }
    }
    L.length = k;
}
```

这是**王道经典题**,**O(n) 时间、O(1) 空间**,一遍扫描完成。双指针思想在顺序表题中反复出现。

#### 9.2 有序表合并(两个升序表合成一个升序表)

cpp

```cpp
bool Merge(SqList A, SqList B, SqList &C) {
    if (A.length + B.length > MAXSIZE) return false;
    int i = 0, j = 0, k = 0;
    while (i < A.length && j < B.length) {
        if (A.data[i] <= B.data[j]) C.data[k++] = A.data[i++];
        else C.data[k++] = B.data[j++];
    }
    while (i < A.length) C.data[k++] = A.data[i++];
    while (j < B.length) C.data[k++] = B.data[j++];
    C.length = k;
    return true;
}
```

这是**归并排序的核心子过程**,必须熟练。

#### 9.3 原地逆置顺序表

cpp

```cpp
void Reverse(SqList &L) {
    for (int i = 0, j = L.length - 1; i < j; i++, j--) {
        ElemType t = L.data[i];
        L.data[i] = L.data[j];
        L.data[j] = t;
    }
}
```

**首尾双指针对向扫描**,O(n) 时间 O(1) 空间。

#### 9.4 删除有序表中重复元素(保留一个)

cpp

```cpp
void DelDup(SqList &L) {
    if (L.length == 0) return;
    int k = 0;
    for (int i = 1; i < L.length; i++) {
        if (L.data[i] != L.data[k]) {
            L.data[++k] = L.data[i];
        }
    }
    L.length = k + 1;
}
```

又是**双指针**,k 指向"最后一个保留的不重复元素",i 向前扫描。

---

### 十、考研高频考点总结

**考点一**:顺序表插入/删除的时间复杂度。插入:最好 O(1),最坏 O(n),平均 n/2。删除同理。

**考点二**:顺序表和链表的适用场景对比——高频随机访问用顺序表,高频插入删除(尤其头部)用链表。

**考点三**:动态顺序表的**均摊分析**——倍增扩容使均摊插入为 O(1)。

**考点四**:顺序表上的**双指针技巧**——删除、去重、逆置、合并的核心。

**考点五**:关于"位序 vs 下标"的转换——位序 i 对应下标 i-1,越界判断用 `i < 1 || i > length` 或 `i > length+1`(插入时)。

---

### 十一、思考题(请作答)

第一题,设顺序表当前长度为 n,在等概率下,**插入一个元素平均要移动多少个元素**?**删除呢**?请分别写出推导过程。

第二题,写一个**O(n) 时间、O(1) 空间**的函数,从有序顺序表 L 中删除所有值在区间 `[s, t]` 范围内的元素(s < t)。

第三题,顺序表 A 和 B 都是升序的,长度都是 n。请设计一个算法,**找出两表合起来后的中位数**(第 n 个最小元素),要求时间 O(log n)。(提示:基于二分,考研名题,有些难度)

第四题,动态顺序表用**倍增扩容**时,连续插入 n 个元素(假设每次扩容从 1 开始),**总搬迁次数**是多少?为什么均摊是 O(1)?

第五题,设计一个算法,把顺序表**原地循环左移 k 位**。例如 `[1,2,3,4,5,6,7]` 左移 3 位后变成 `[4,5,6,7,1,2,3]`。要求 O(n) 时间 O(1) 空间。(提示:**三次逆置法**——这是非常优美的一道题)

---

## 数据结构复习:链表专题

作为教授,我先给你搭建整个项目的组织框架,然后一步步带你写链表代码。

### 一、项目文件组织方案

建议你创建如下目录结构,便于后续所有数据结构的学习:

```
DataStructure/
├── LinkedList/
│   ├── LinkedList.h          // 声明(结构体定义 + 函数原型)
│   ├── LinkedList.cpp        // 实现(函数体)
│   └── main.cpp              // 测试
├── SeqList/
├── Stack/
├── Queue/
├── KMP/
├── Tree/
└── BinaryTree/
```

#### 组织 `.h` 和 `.cpp` 的核心原则

你需要记住三条铁律:

**第一条:`.h` 文件只放"声明",`.cpp` 文件只放"实现"。** 结构体定义、函数原型、宏、常量放在 `.h` 里;函数体写在 `.cpp` 里。

**第二条:每个 `.h` 文件开头写 `#pragma once`,防止重复包含导致重复定义。** 这条指令告诉编译器"这个头文件在一次编译中只包含一次"。

**第三条:`.cpp` 文件要 `#include` 对应的 `.h`,`main.cpp` 只 `#include` 需要用到的 `.h`,绝对不要 `#include` 别人的 `.cpp`。**

---

### 二、链表结构体定义(放在 LinkedList.h 中)

现在请你在 `LinkedList/` 目录下创建 `LinkedList.h`,按我下面的讲解逐段写入。

cpp

```cpp
#pragma once   // 防止重复定义,必须放在文件最顶端

// ========== 1. 单链表节点结构(带头与不带头共用) ==========
typedef int ElemType;   // 用 typedef 把数据类型抽象出来,将来换类型只改这一行

typedef struct LNode {
    ElemType data;         // 数据域
    struct LNode *next;    // 指针域,指向下一个节点
} LNode, *LinkList;
// LNode 是"节点类型",LinkList 是"指向节点的指针"
// 这种双重 typedef 是严蔚敏教材的经典写法,你必须熟悉
```

这里要解释一个初学者必须理解的点:`LNode` 和 `LinkList` 本质上一个是结构体,一个是结构体指针。当我们强调"这是一个链表(头指针)"时用 `LinkList`,当我们强调"这是一个节点"时用 `LNode *`。两者可以互换,但语义不同。

接着继续写循环链表。循环链表的**结构体定义和单链表完全一样**,区别只在于尾节点的 `next` 指向头而不是 `NULL`,所以不需要重新定义结构体,可以复用 `LNode`。我们只需要为循环链表再起一个别名让语义更清晰:

cpp

```cpp
// ========== 2. 循环单链表 ==========
// 结构和单链表相同,区别是尾节点 next 指向头节点
typedef LNode  CLNode;
typedef LNode* CLinkList;
```

---

### 三、函数原型声明(继续写在 LinkedList.h 中)

接下来声明常用函数。我把"带头结点"和"不带头结点"分开命名,方便你对比两者差异:

cpp

```cpp
// ========== 带头结点单链表 ==========
bool InitList_H(LinkList &L);                    // 初始化(创建头结点)
bool ListInsert_H(LinkList &L, int i, ElemType e);  // 在第 i 位插入
bool ListDelete_H(LinkList &L, int i, ElemType &e); // 删除第 i 位,返回值
int  ListLength_H(LinkList L);                   // 求表长
LNode* GetElem_H(LinkList L, int i);             // 按位查找
LNode* LocateElem_H(LinkList L, ElemType e);     // 按值查找
void PrintList_H(LinkList L);                    // 遍历输出
void DestroyList_H(LinkList &L);                 // 销毁

// ========== 不带头结点单链表 ==========
bool InitList(LinkList &L);                      // 初始化(L = NULL)
bool ListInsert(LinkList &L, int i, ElemType e); // 插入(注意 i=1 要改 L 本身)
bool ListDelete(LinkList &L, int i, ElemType &e);// 删除
void PrintList(LinkList L);

// ========== 循环单链表(带头) ==========
bool InitCList(CLinkList &L);
bool CListInsertTail(CLinkList &L, ElemType e);  // 尾插,用于建表
void PrintCList(CLinkList L);
```

注意我在参数表里用了 `&L`(引用)。这一点对初学者非常关键:**当函数内部可能修改头指针本身(比如初始化、在第一个位置插入不带头链表)时,必须用引用传递**,否则修改只影响形参,调用者看不到变化。

---

### 四、下一步我要你做的事

现在请你:

1. 按上面的内容创建 `LinkedList.h`,自己手动敲一遍(不要复制,手写能帮你记住)。
2. 同时创建一个空的 `LinkedList.cpp`,里面先写一句 `#include "LinkedList.h"`,等我下一条讲函数实现。
3. 如果对 `typedef struct LNode` 的双重别名写法、`&L` 引用传参、`#pragma once` 有任何疑问,现在就问我。

文件创建完成后，继续实现以下内容：

- 带头结点链表的 `InitList_H` 和 `ListInsert_H`(头插与尾插两种建表)
- 不带头结点链表的 `InitList` 和 `ListInsert`(重点讲为什么 i=1 的插入要特殊处理)
- 循环链表的初始化与尾插建表
- 按位查找、按值查找、删除、销毁

## 数据结构复习:栈与队列(链式 + 顺序)

好,我们现在把**栈和队列**系统化地实现一遍,每种都写**顺序存储**和**链式存储**两个版本。这部分在后面树的非递归遍历、图的 BFS/DFS、表达式求值中都会用到,是基础中的基础。

---

### 一、项目文件组织

按你一贯的目录风格:

```
DataStructure/
├── Stack/
│   ├── SeqStack.h      // 顺序栈
│   ├── SeqStack.cpp
│   ├── LinkStack.h     // 链栈
│   ├── LinkStack.cpp
│   └── main.cpp
└── Queue/
    ├── SeqQueue.h      // 循环队列(顺序)
    ├── SeqQueue.cpp
    ├── LinkQueue.h     // 链队列
    ├── LinkQueue.cpp
    └── main.cpp
```

一个核心设计决策我先跟你说清楚:**顺序栈和链栈的结构体不能同名**,否则在同一个 main.cpp 里同时包含两个头文件会冲突。所以我们在函数和结构体名字上做区分:顺序栈用 `SqStack`、`Push_Sq`,链栈用 `LkStack`、`Push_Lk`。这样设计既能共存,也能清楚看出区别。

---

### 二、栈的两个核心概念(动手前先记牢)

栈是**后进先出(LIFO)**的结构,只允许在栈顶进行插入和删除。

**顺序栈**用数组实现,需要一个 `top` 指示栈顶位置。教材约定有两种:`top` 指向"栈顶元素"(初始 -1),或 `top` 指向"栈顶元素的下一个位置"(初始 0)。我们采用**第二种**,因为与考研严蔚敏教材一致,且边界处理更统一。

**链栈**用单链表实现,把**链表头当作栈顶**。这样 push/pop 都是 O(1),而且不需要头结点——加头结点反而多此一举。

---

### 三、顺序栈(SeqStack.h)

cpp

```cpp
#pragma once

#define MAXSIZE 100
typedef int SElemType;

typedef struct {
    SElemType data[MAXSIZE];
    int top;                // 栈顶指针:指向栈顶元素的下一个位置
} SqStack;

// ========== 顺序栈基本操作 ==========
bool InitStack_Sq(SqStack &S);
bool StackEmpty_Sq(SqStack S);
bool StackFull_Sq(SqStack S);
bool Push_Sq(SqStack &S, SElemType e);
bool Pop_Sq(SqStack &S, SElemType &e);
bool GetTop_Sq(SqStack S, SElemType &e);
int  StackLength_Sq(SqStack S);
void ClearStack_Sq(SqStack &S);
```

#### SeqStack.cpp 实现

cpp

```cpp
#include "SeqStack.h"

bool InitStack_Sq(SqStack &S) {
    S.top = 0;              // 约定:top 指向下一个空位
    return true;
}

bool StackEmpty_Sq(SqStack S) {
    return S.top == 0;
}

bool StackFull_Sq(SqStack S) {
    return S.top == MAXSIZE;
}

bool Push_Sq(SqStack &S, SElemType e) {
    if (StackFull_Sq(S)) return false;
    S.data[S.top] = e;      // 先放数据
    S.top++;                // 再移指针
    return true;
}

bool Pop_Sq(SqStack &S, SElemType &e) {
    if (StackEmpty_Sq(S)) return false;
    S.top--;                // 先移指针
    e = S.data[S.top];      // 再取数据
    return true;
}

bool GetTop_Sq(SqStack S, SElemType &e) {
    if (StackEmpty_Sq(S)) return false;
    e = S.data[S.top - 1];  // 栈顶元素在 top-1 位置
    return true;
}

int StackLength_Sq(SqStack S) {
    return S.top;
}

void ClearStack_Sq(SqStack &S) {
    S.top = 0;              // 不用真的擦数据,重置指针即可
}
```

**注意 `Push` 和 `Pop` 的"先后顺序"**:push 是"先写数据再移指针",pop 是"先移指针再取数据"。这和 top 的约定有关——`top` 指向下一个空位,所以栈顶元素在 `top-1`。如果你采用 `top = -1` 的约定,顺序就要颠倒。

---

### 四、链栈(LinkStack.h)

cpp

```cpp
#pragma once

typedef int SElemType;

typedef struct StackNode {
    SElemType data;
    struct StackNode *next;
} StackNode, *LkStack;      // LkStack 就是指向栈顶节点的指针

// ========== 链栈基本操作 ==========
bool InitStack_Lk(LkStack &S);
bool StackEmpty_Lk(LkStack S);
bool Push_Lk(LkStack &S, SElemType e);
bool Pop_Lk(LkStack &S, SElemType &e);
bool GetTop_Lk(LkStack S, SElemType &e);
int  StackLength_Lk(LkStack S);
void DestroyStack_Lk(LkStack &S);
```

#### LinkStack.cpp 实现

cpp

```cpp
#include "LinkStack.h"

bool InitStack_Lk(LkStack &S) {
    S = nullptr;            // 空栈就是空指针,不需要头结点
    return true;
}

bool StackEmpty_Lk(LkStack S) {
    return S == nullptr;
}

bool Push_Lk(LkStack &S, SElemType e) {
    StackNode *p = new StackNode;
    p->data = e;
    p->next = S;            // 新节点指向原栈顶
    S = p;                  // 新节点成为新栈顶
    return true;
}

bool Pop_Lk(LkStack &S, SElemType &e) {
    if (S == nullptr) return false;
    StackNode *p = S;       // 保存原栈顶
    e = S->data;
    S = S->next;            // 栈顶下移
    delete p;               // 释放原栈顶
    return true;
}

bool GetTop_Lk(LkStack S, SElemType &e) {
    if (S == nullptr) return false;
    e = S->data;
    return true;
}

int StackLength_Lk(LkStack S) {
    int count = 0;
    while (S != nullptr) {
        count++;
        S = S->next;
    }
    return count;
}

void DestroyStack_Lk(LkStack &S) {
    while (S != nullptr) {
        StackNode *p = S;
        S = S->next;
        delete p;
    }
}
```

**关键对比**:链栈的 push/pop 本质上就是**在链表头插入/删除**,对照你之前写的链表代码看,应该秒懂。另外链栈**理论上不会满**(只要内存够),所以没有 `StackFull` 函数。

---

### 五、队列的核心概念

队列是**先进先出(FIFO)**的结构,队尾入队、队头出队。

**顺序队列**有个著名的"假溢出"问题:数据不断入队出队后,`front` 和 `rear` 都往后移动,数组前面大量空位却没法用。解决方案是**循环队列**——把数组首尾相接,用 `% MAXSIZE` 实现"绕圈"。

循环队列有个新问题:**队空和队满的判断条件都是 `front == rear`**,怎么区分?有三种方案,我们用最经典的"**牺牲一个单元**":约定 `(rear + 1) % MAXSIZE == front` 为满,`front == rear` 为空。这样队列实际最多存 MAXSIZE-1 个元素。

**链队列**用带头结点的单链表,设 `front` 指向头结点,`rear` 指向尾节点。加头结点是为了让空队和非空队的操作统一,这和链栈不同,你要特别注意。

---

### 六、循环队列(SeqQueue.h)

cpp

```cpp
#pragma once

#define MAXSIZE 100
typedef int QElemType;

typedef struct {
    QElemType data[MAXSIZE];
    int front;              // 队头指针:指向队头元素
    int rear;               // 队尾指针:指向队尾元素的下一个位置
} SqQueue;

// ========== 循环队列基本操作 ==========
bool InitQueue_Sq(SqQueue &Q);
bool QueueEmpty_Sq(SqQueue Q);
bool QueueFull_Sq(SqQueue Q);
bool EnQueue_Sq(SqQueue &Q, QElemType e);
bool DeQueue_Sq(SqQueue &Q, QElemType &e);
bool GetHead_Sq(SqQueue Q, QElemType &e);
int  QueueLength_Sq(SqQueue Q);
```

#### SeqQueue.cpp 实现

cpp

```cpp
#include "SeqQueue.h"

bool InitQueue_Sq(SqQueue &Q) {
    Q.front = Q.rear = 0;
    return true;
}

bool QueueEmpty_Sq(SqQueue Q) {
    return Q.front == Q.rear;
}

bool QueueFull_Sq(SqQueue Q) {
    return (Q.rear + 1) % MAXSIZE == Q.front;   // 牺牲一个单元
}

bool EnQueue_Sq(SqQueue &Q, QElemType e) {
    if (QueueFull_Sq(Q)) return false;
    Q.data[Q.rear] = e;                         // 先放数据到 rear
    Q.rear = (Q.rear + 1) % MAXSIZE;            // rear 后移(循环)
    return true;
}

bool DeQueue_Sq(SqQueue &Q, QElemType &e) {
    if (QueueEmpty_Sq(Q)) return false;
    e = Q.data[Q.front];                        // 先取队头数据
    Q.front = (Q.front + 1) % MAXSIZE;          // front 后移(循环)
    return true;
}

bool GetHead_Sq(SqQueue Q, QElemType &e) {
    if (QueueEmpty_Sq(Q)) return false;
    e = Q.data[Q.front];
    return true;
}

int QueueLength_Sq(SqQueue Q) {
    return (Q.rear - Q.front + MAXSIZE) % MAXSIZE;
    // 加 MAXSIZE 再取模,避免 rear < front 时出现负数
}
```

**这段代码的精华在三处:**

第一,`(rear + 1) % MAXSIZE == front` 判满——牺牲一个单元法。第二,`rear = (rear + 1) % MAXSIZE` 实现循环——取模运算让下标自动回到 0。第三,`(rear - front + MAXSIZE) % MAXSIZE` 求长度——加 MAXSIZE 防止负数,这个技巧你一定要记住,考研选择题常考。

---

### 七、链队列(LinkQueue.h)

cpp

```cpp
#pragma once

typedef int QElemType;

typedef struct QNode {
    QElemType data;
    struct QNode *next;
} QNode;

typedef struct {
    QNode *front;           // 指向头结点(不是第一个数据节点!)
    QNode *rear;            // 指向最后一个数据节点
} LkQueue;

// ========== 链队列基本操作 ==========
bool InitQueue_Lk(LkQueue &Q);
bool QueueEmpty_Lk(LkQueue Q);
bool EnQueue_Lk(LkQueue &Q, QElemType e);
bool DeQueue_Lk(LkQueue &Q, QElemType &e);
bool GetHead_Lk(LkQueue Q, QElemType &e);
int  QueueLength_Lk(LkQueue Q);
void DestroyQueue_Lk(LkQueue &Q);
```

#### LinkQueue.cpp 实现

cpp

```cpp
#include "LinkQueue.h"

bool InitQueue_Lk(LkQueue &Q) {
    Q.front = Q.rear = new QNode;   // 创建头结点,front 和 rear 都指它
    Q.front->next = nullptr;
    return true;
}

bool QueueEmpty_Lk(LkQueue Q) {
    return Q.front == Q.rear;       // 头尾指针相同即为空
}

bool EnQueue_Lk(LkQueue &Q, QElemType e) {
    QNode *p = new QNode;
    p->data = e;
    p->next = nullptr;
    Q.rear->next = p;               // 挂到尾节点后面
    Q.rear = p;                     // 更新尾指针
    return true;
}

bool DeQueue_Lk(LkQueue &Q, QElemType &e) {
    if (Q.front == Q.rear) return false;
    QNode *p = Q.front->next;       // 第一个数据节点
    e = p->data;
    Q.front->next = p->next;        // 头结点绕过 p
    if (Q.rear == p) Q.rear = Q.front;  // 注意:删的是最后一个节点时,rear 要回到头结点
    delete p;
    return true;
}

bool GetHead_Lk(LkQueue Q, QElemType &e) {
    if (Q.front == Q.rear) return false;
    e = Q.front->next->data;
    return true;
}

int QueueLength_Lk(LkQueue Q) {
    int count = 0;
    QNode *p = Q.front->next;       // 跳过头结点
    while (p != nullptr) {
        count++;
        p = p->next;
    }
    return count;
}

void DestroyQueue_Lk(LkQueue &Q) {
    while (Q.front != nullptr) {
        QNode *p = Q.front;
        Q.front = Q.front->next;
        delete p;
    }
    Q.rear = nullptr;
}
```

**链队列最容易错的一个点**:在 `DeQueue_Lk` 中,当你删除的是最后一个数据节点时,`rear` 会变成悬空指针,必须让 `rear` 回到 `front`(头结点)。很多教材和博客的代码在这里有 bug,你要警惕。

---

### 八、测试代码示例(Stack/main.cpp)

cpp

```cpp
#include "SeqStack.h"
#include "LinkStack.h"
#include <iostream>
using namespace std;

int main() {
    // 测试顺序栈
    SqStack S1;
    InitStack_Sq(S1);
    Push_Sq(S1, 1); Push_Sq(S1, 2); Push_Sq(S1, 3);
    int e;
    cout << "顺序栈出栈: ";
    while (!StackEmpty_Sq(S1)) {
        Pop_Sq(S1, e);
        cout << e << " ";           // 期望: 3 2 1
    }
    cout << endl;

    // 测试链栈
    LkStack S2;
    InitStack_Lk(S2);
    Push_Lk(S2, 10); Push_Lk(S2, 20); Push_Lk(S2, 30);
    cout << "链栈出栈:   ";
    while (!StackEmpty_Lk(S2)) {
        Pop_Lk(S2, e);
        cout << e << " ";           // 期望: 30 20 10
    }
    cout << endl;

    DestroyStack_Lk(S2);
    return 0;
}
```

队列的 main.cpp 你照着这个模式自己写,入队 1 2 3,出队应该得到 1 2 3(FIFO)。

---

### 九、四种实现的对比总结

一张对照表帮你理清脑子(我在 prose 里呈现,避免密集 bullet):

**栈顶/队头位置**:顺序栈用数组末尾,链栈用链表头;顺序队用 front 下标,链队用头结点之后。**是否需要头结点**:链栈不需要,链队需要(统一空队操作)。**满的判断**:顺序栈 `top == MAXSIZE`,顺序队 `(rear+1)%MAXSIZE == front`,链式结构理论上都不会满。**空的判断**:顺序栈 `top == 0`,链栈 `S == nullptr`,顺序队 `front == rear`(下标相等),链队 `front == rear`(指针相等)。

---

### 十、思考题(请作答)

第一题,顺序栈中我们约定 `top` 指向"下一个空位",初始值是 0;如果改成 `top` 指向"栈顶元素",初始值应该是多少?对应的 `Push` 和 `Pop` 顺序要怎么调整?

第二题,循环队列为什么要"牺牲一个单元"?除了这种方法,还有哪些方法区分队空和队满?(至少再说一个)

第三题,链队列出队时,为什么删除最后一个节点后,`rear` 必须指回 `front`?如果不处理会发生什么?(提示:想一下 rear 指向被 delete 的内存会怎样)
