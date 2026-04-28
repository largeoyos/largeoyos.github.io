# 数据结构复习:链表专题

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

等你准备好后,告诉我"文件建好了",我会接着带你实现:

- 带头结点链表的 `InitList_H` 和 `ListInsert_H`(头插与尾插两种建表)
- 不带头结点链表的 `InitList` 和 `ListInsert`(重点讲为什么 i=1 的插入要特殊处理)
- 循环链表的初始化与尾插建表
- 按位查找、按值查找、删除、销毁