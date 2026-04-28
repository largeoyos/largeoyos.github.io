# 数据结构复习:顺序表

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