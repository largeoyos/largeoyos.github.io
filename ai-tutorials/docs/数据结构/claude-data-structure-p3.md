# 数据结构复习:栈与队列(链式 + 顺序)

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

---

### 十一、下一步方向

你可以选择:

**(A)** 基于栈实现应用题:括号匹配、表达式求值(中缀转后缀)、进制转换——这些是栈最经典的应用,考研大题常考。**(B)** 基于队列实现应用题:用两个栈实现队列、用两个队列实现栈、队列解杨辉三角。**(C)** 直接进入 **KMP 算法**(你最初提到要学的内容)。**(D)** 回到二叉树,接着学线索二叉树或 BST。

告诉我你想先走哪个方向,或者先回答上面三道思考题,我来批改。