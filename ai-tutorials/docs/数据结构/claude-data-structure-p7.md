# 用自己写的栈和队列重做二叉树的非递归遍历 & 层序遍历

非常好的想法!**用自己写的数据结构支撑更上层的算法**——这正是数据结构课程的核心训练。之前我们用了 `std::stack` 和 `std::queue` 作为"黑盒",现在你要把它们换成自己的 `SqStack`、`LkQueue`,这一步能让你真正理解"栈和队列不是语法糖,而是有明确底层结构的工具"。

---

### 一、先梳理替换思路

我们之前的非递归遍历用了 `std::stack<BiTNode*>`,层序遍历用了 `std::queue<BiTNode*>`。现在要换成自己的栈和队列,但有个**关键问题**:我们之前的 `SqStack` 存的是 `int`(`SElemType = int`),但二叉树遍历要存 `BiTNode*`(节点指针)。

有两种解决方案:

**方案一:修改原 SqStack.h 把 SElemType 改成 `BiTNode*`**——简单但破坏了栈的通用性,而且栈和二叉树耦合了,不推荐。

**方案二:为二叉树遍历专门写一个"节点指针栈"和"节点指针队列"**——结构体和函数重新命名,与原来的 int 栈/队列共存,互不干扰。这是**更工程化的做法**,也是我们要采用的方案。

(顺便提一句:真正的工业级做法是用 C++ 模板 `template<typename T>`,但这是后期内容,现在我们用"复制一份改类型"的朴素做法,保持你对结构本身的理解。)

---

### 二、文件组织

在 `BinaryTree/` 目录下新增两个文件,专门给二叉树的遍历用:

```
DataStructure/
└── BinaryTree/
    ├── BinaryTree.h          // 之前已有
    ├── BinaryTree.cpp        // 之前已有,本次要修改
    ├── BiTreeStack.h         // 新增:存节点指针的顺序栈
    ├── BiTreeStack.cpp       // 新增
    ├── BiTreeQueue.h         // 新增:存节点指针的链队列
    ├── BiTreeQueue.cpp       // 新增
    └── main.cpp
```

我选择**顺序栈 + 链队列**的组合。为什么?栈用顺序存储简单高效,大小可预估;队列用链式避免"假溢出"且无容量限制。这也是教材和工程常见的搭配。当然你也可以反过来用,结构完全对称,原理一致。

---

### 三、BiTreeStack.h(存 BiTNode* 的顺序栈)

cpp

```cpp
#pragma once
#include "BinaryTree.h"             // 为了拿到 BiTNode 的定义

#define STACK_MAXSIZE 100

typedef struct {
    BiTNode *data[STACK_MAXSIZE];    // 存的是节点指针,不是 int 了
    int top;                         // top 指向下一个空位
} BiStack;

// ========== 基本操作(命名加 _Bi 后缀,避免和 int 栈冲突)==========
bool InitStack_Bi(BiStack &S);
bool StackEmpty_Bi(BiStack S);
bool StackFull_Bi(BiStack S);
bool Push_Bi(BiStack &S, BiTNode *e);
bool Pop_Bi(BiStack &S, BiTNode *&e);    // 注意:BiTNode* 的引用
bool GetTop_Bi(BiStack S, BiTNode *&e);
```

特别注意 `Pop_Bi` 的参数 `BiTNode *&e`:这是**"节点指针的引用"**,因为我们要把弹出的指针带回给调用者。不写 `&` 的话,e 只是形参副本,外面拿不到。

### 四、BiTreeStack.cpp 实现

cpp

```cpp
#include "BiTreeStack.h"

bool InitStack_Bi(BiStack &S) {
    S.top = 0;
    return true;
}

bool StackEmpty_Bi(BiStack S) {
    return S.top == 0;
}

bool StackFull_Bi(BiStack S) {
    return S.top == STACK_MAXSIZE;
}

bool Push_Bi(BiStack &S, BiTNode *e) {
    if (StackFull_Bi(S)) return false;
    S.data[S.top] = e;
    S.top++;
    return true;
}

bool Pop_Bi(BiStack &S, BiTNode *&e) {
    if (StackEmpty_Bi(S)) return false;
    S.top--;
    e = S.data[S.top];
    return true;
}

bool GetTop_Bi(BiStack S, BiTNode *&e) {
    if (StackEmpty_Bi(S)) return false;
    e = S.data[S.top - 1];
    return true;
}
```

和你之前写的 int 顺序栈**逻辑完全一样**,只是把 `SElemType` 换成了 `BiTNode*`。这也再次证明:**栈就是栈,不关心里面装什么**,这就是数据结构的抽象威力。

---

### 五、BiTreeQueue.h(存 BiTNode* 的链队列)

cpp

```cpp
#pragma once
#include "BinaryTree.h"

// 队列节点:里面装的是 BiTNode 指针
typedef struct BiQNode {
    BiTNode *data;
    struct BiQNode *next;
} BiQNode;

typedef struct {
    BiQNode *front;                  // 指向头结点
    BiQNode *rear;                   // 指向尾节点
} BiQueue;

bool InitQueue_Bi(BiQueue &Q);
bool QueueEmpty_Bi(BiQueue Q);
bool EnQueue_Bi(BiQueue &Q, BiTNode *e);
bool DeQueue_Bi(BiQueue &Q, BiTNode *&e);
void DestroyQueue_Bi(BiQueue &Q);
```

**结构嵌套关系一定要搞清楚**:`BiQNode` 是队列的节点,里面的 `data` 字段存的是二叉树节点 `BiTNode*`(指针)。不要把队列节点和二叉树节点搞混——它们是两种不同的节点!

### 六、BiTreeQueue.cpp 实现

cpp

```cpp
#include "BiTreeQueue.h"

bool InitQueue_Bi(BiQueue &Q) {
    Q.front = Q.rear = new BiQNode;  // 创建头结点
    Q.front->next = nullptr;
    return true;
}

bool QueueEmpty_Bi(BiQueue Q) {
    return Q.front == Q.rear;
}

bool EnQueue_Bi(BiQueue &Q, BiTNode *e) {
    BiQNode *p = new BiQNode;
    p->data = e;
    p->next = nullptr;
    Q.rear->next = p;                // 挂到尾节点之后
    Q.rear = p;                      // 更新尾指针
    return true;
}

bool DeQueue_Bi(BiQueue &Q, BiTNode *&e) {
    if (Q.front == Q.rear) return false;
    BiQNode *p = Q.front->next;      // 第一个数据节点
    e = p->data;
    Q.front->next = p->next;
    if (Q.rear == p) Q.rear = Q.front;   // 删到最后一个时,rear 回到头结点
    delete p;
    return true;
}

void DestroyQueue_Bi(BiQueue &Q) {
    while (Q.front != nullptr) {
        BiQNode *p = Q.front;
        Q.front = Q.front->next;
        delete p;
    }
    Q.rear = nullptr;
}
```

这里的坑我在链队列章节已经讲过:**出队最后一个节点时,rear 必须回到 front**,否则 rear 变成野指针,下次入队就会崩溃。这个点考研选择题也考过。

---

### 七、重写二叉树的三个遍历函数(BinaryTree.cpp)

现在进入核心部分——把 `std::stack` 和 `std::queue` 全部换掉。我把三个非递归遍历和层序遍历都重写一遍。

#### 7.1 修改 BinaryTree.cpp 的 include 部分

cpp

```cpp
#include "BinaryTree.h"
#include "BiTreeStack.h"      // 用自己的栈
#include "BiTreeQueue.h"      // 用自己的队列
#include <iostream>
using namespace std;

// 注意:原来的 <stack> 和 <queue> 不再需要了
```

#### 7.2 非递归先序遍历(重写)

cpp

```cpp
void PreOrder_NonRec(BiTree T) {
    if (T == nullptr) return;
    BiStack S;
    InitStack_Bi(S);
    Push_Bi(S, T);

    while (!StackEmpty_Bi(S)) {
        BiTNode *p;
        Pop_Bi(S, p);               // 弹栈访问
        cout << p->data << " ";
        // 先压右,后压左,保证左孩子先出栈
        if (p->rchild) Push_Bi(S, p->rchild);
        if (p->lchild) Push_Bi(S, p->lchild);
    }
}
```

对照之前用 `std::stack` 的版本:结构完全一样,只是 `S.push(x)` 变成 `Push_Bi(S, x)`,`S.top(); S.pop();` 合并成 `Pop_Bi(S, p)`。

**一个工程上的小改进**:我们的 `Pop_Bi` 一步到位取值并弹栈,比 STL 的 top+pop 两步更紧凑。这是你自己写数据结构的小小乐趣。

#### 7.3 非递归中序遍历(重写)

cpp

```cpp
void InOrder_NonRec(BiTree T) {
    BiStack S;
    InitStack_Bi(S);
    BiTNode *p = T;

    while (p != nullptr || !StackEmpty_Bi(S)) {
        if (p != nullptr) {
            Push_Bi(S, p);          // 一路向左压栈
            p = p->lchild;
        } else {
            Pop_Bi(S, p);           // 左边到底,弹栈访问
            cout << p->data << " ";
            p = p->rchild;          // 转向右子树
        }
    }
}
```

**注意**:之前我用了 `S.top()` 和 `S.pop()` 分两步,但实际上中序的这个位置只需要"取并弹",所以用 `Pop_Bi` 合二为一更优雅。

#### 7.4 非递归后序遍历(重写,最复杂)

后序遍历需要"读栈顶但不弹出",判断是否该转向右子树。之前用 `S.top()` 可以做到这点,我们的栈有 `GetTop_Bi` 对应:

cpp

```cpp
void PostOrder_NonRec(BiTree T) {
    BiStack S;
    InitStack_Bi(S);
    BiTNode *p = T;
    BiTNode *lastVisited = nullptr;     // 上次访问的节点

    while (p != nullptr || !StackEmpty_Bi(S)) {
        if (p != nullptr) {
            Push_Bi(S, p);
            p = p->lchild;
        } else {
            BiTNode *top;
            GetTop_Bi(S, top);          // 只看不弹
            // 有右子树且未访问过 → 转向右子树
            if (top->rchild != nullptr && top->rchild != lastVisited) {
                p = top->rchild;
            } else {
                // 弹出并访问
                Pop_Bi(S, top);
                cout << top->data << " ";
                lastVisited = top;
                // p 保持 nullptr,下轮继续弹
            }
        }
    }
}
```

对比之前版本,`S.top()` → `GetTop_Bi(S, top)`,`S.pop()` → `Pop_Bi(S, top)`。逻辑完全一致。

#### 7.5 层序遍历(重写)

cpp

```cpp
void LevelOrder(BiTree T) {
    if (T == nullptr) return;
    BiQueue Q;
    InitQueue_Bi(Q);
    EnQueue_Bi(Q, T);

    while (!QueueEmpty_Bi(Q)) {
        BiTNode *p;
        DeQueue_Bi(Q, p);
        cout << p->data << " ";
        if (p->lchild) EnQueue_Bi(Q, p->lchild);
        if (p->rchild) EnQueue_Bi(Q, p->rchild);
    }
    DestroyQueue_Bi(Q);                 // 用完销毁
}
```

这里我额外加了 `DestroyQueue_Bi(Q)`——链队列的头结点是 `new` 出来的,不销毁会泄漏内存。而顺序栈是栈变量,函数结束自动释放,不用手动清。**这是链式和顺序的又一个区别,你要记住**。

---

### 八、main.cpp(和之前完全相同)

cpp

```cpp
#include "BinaryTree.h"
#include <iostream>
using namespace std;

int main() {
    BiTree T;
    cout << "按先序输入(# 表示空),例如 AB#D##C##:" << endl;
    CreateBiTree(T);

    cout << "非递归先序: "; PreOrder_NonRec(T);  cout << endl;
    cout << "非递归中序: "; InOrder_NonRec(T);   cout << endl;
    cout << "非递归后序: "; PostOrder_NonRec(T); cout << endl;
    cout << "层序遍历:   "; LevelOrder(T);       cout << endl;

    DestroyTree(T);
    return 0;
}
```

用 `AB#D##C##` 测试,输出应该是:

```
非递归先序: A B D C 
非递归中序: B D A C 
非递归后序: D B C A 
层序遍历:   A B C D
```

**注意**:main.cpp 里**不需要**包含 `BiTreeStack.h` 和 `BiTreeQueue.h`——它们只是 BinaryTree.cpp 的内部实现细节。这就是"**接口与实现分离**"的原则:外部使用者只关心 BinaryTree.h 提供的遍历函数,底层用什么栈、什么队列不关心。这是优秀的工程分层。

---

### 九、编译命令提示

四个 .cpp 文件一起编译:

bash

```bash
g++ -o bitree main.cpp BinaryTree.cpp BiTreeStack.cpp BiTreeQueue.cpp
```

如果你用 IDE(VS / CLion / VS Code),把这四个 .cpp 都加入项目即可。

---

### 十、关于 "include 循环依赖" 的一个提醒

你可能注意到:

- `BiTreeStack.h` 包含了 `BinaryTree.h`(因为要用 `BiTNode`)
- `BinaryTree.cpp` 包含了 `BiTreeStack.h`

这是**单向依赖**,没问题:栈依赖二叉树节点定义,二叉树实现依赖栈的操作。如果你写成"BinaryTree.h 里反过来也 include BiTreeStack.h",就会形成循环依赖导致编译错误。**永远让依赖方向单一**,这是 C/C++ 头文件管理的铁律。

`#pragma once` 可以防止单文件被重复包含,但**防不住循环依赖**——循环依赖是设计问题,不是技术问题。

---

### 十一、思考题(请作答)

第一题,如果我把层序遍历也改用顺序队列(循环队列)而不是链队列,会有什么限制?(提示:考虑队列大小)

第二题,为什么后序遍历用 `GetTop_Bi` "看但不弹"比 `Pop_Bi` "弹了再压回去"更好?(提示:想想效率和代码简洁性)

第三题,如果把"顺序栈 + 链队列"改成"链栈 + 循环队列"可以吗?代码要改哪些地方?**函数的语义和时间复杂度会变吗**?

---

### 十二、下一步方向

这一步你做完、理解透了,就真正体会到"数据结构"的工程意义了——**栈和队列不是 STL 的魔法,而是你亲手能造出来的工具**。接下来可以:

**(A)** 学**线索二叉树**(考研高频,要用到中序遍历思想)。**(B)** 学**二叉搜索树 BST**(插入、查找、删除)。**(C)** 学**哈夫曼树**(优先队列/最小堆应用)。**(D)** 学**树、森林与二叉树的相互转换**(你最初列表中的内容)。**(E)** 先回答思考题,我批改。

告诉我你的选择。