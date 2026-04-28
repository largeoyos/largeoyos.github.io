# 数据结构复习:线索二叉树

好,我们进入**线索二叉树**。这是二叉树里最抽象、也是考研最容易失分的章节。我会花较多篇幅讲清楚**它为什么存在**、**规则是什么**、**代码怎么写**。

提醒你一点:线索二叉树的代码不难,但**理解它在做什么**是难点。如果你第一次读不懂,不要慌,跟着我的推导走一遍再回头看代码。

---

### 一、为什么要有线索二叉树?

先看一个观察:**n 个节点的二叉链表,一共有 2n 个指针域,其中只有 n-1 个用于指向孩子,剩下 n+1 个都是空指针**。

证明这个结论:n 个节点共 2n 个指针域;每个节点(除根)都有一个"从父节点指向它"的指针,共 n-1 个有效指针;所以空指针数 = 2n - (n-1) = n+1。

**这些空指针浪费了,能不能利用起来?**

线索二叉树的想法是:**让左空指针指向它的中序前驱,让右空指针指向它的中序后继**。这样遍历二叉树就不需要递归或栈了,沿着线索直接走就行,空间 O(1)。

这个想法的价值在:**某些应用中要反复遍历同一棵树**(比如表达式树的求值、语法树的多次扫描),线索化一次,之后每次遍历都是 O(n) 无栈遍历。

---

### 二、三种线索化(先后中)

根据遍历顺序不同,线索化分为三种:

**中序线索二叉树**(最常用,考研必考)、**先序线索二叉树**、**后序线索二叉树**。

我们**重点讲中序**,先序后序的代码只需改动递归顺序,留作你的练习。为什么中序最常用?因为在中序线索二叉树上,**找后继和找前驱都是 O(1) 或 O(h)**,非常规整;先序和后序要找某些方向的前驱/后继会很麻烦。

---

### 三、结构体设计(重点,容易错)

既然我们要让"空指针"变成"指向前驱/后继的线索",就必须能区分:**这个指针到底是指向孩子,还是指向线索?**

解决方案:**每个指针加一个标志位**。

cpp

```cpp
typedef struct ThreadNode {
    ElemType data;
    struct ThreadNode *lchild, *rchild;
    int ltag, rtag;           // 0 表示孩子,1 表示线索
} ThreadNode, *ThreadTree;
```

规则:

`ltag = 0`:lchild 指向左孩子(正常)。`ltag = 1`:lchild 指向**中序前驱**(线索)。`rtag = 0`:rchild 指向右孩子(正常)。`rtag = 1`:rchild 指向**中序后继**(线索)。

每个节点仅增加 2 个标志位(通常用 bool 或 1 bit),代价极小,收益巨大。

---

### 四、一棵树的中序线索化结果(先手画一遍)

先别急着看代码,我们手动线索化下面这棵树,帮你建立直觉:

```
        A
       / \
      B   C
     / \
    D   E
```

**中序遍历序列**:D B E A C。

根据这个序列,每个节点的前驱后继是:

|节点|中序前驱|中序后继|
|---|---|---|
|D|无|B|
|B|D|E|
|E|B|A|
|A|E|C|
|C|A|无|

现在看哪些节点有空指针需要线索化:

D 的 lchild 空 → 线索指向 D 的前驱(无,设为 NULL,ltag=1)。D 的 rchild 空 → 线索指向 B(ltag=1,rtag=1)。E 的 lchild 空 → 线索指向 B。E 的 rchild 空 → 线索指向 A。C 的 lchild 空 → 线索指向 A。C 的 rchild 空 → 无后继,设为 NULL,rtag=1。

B 和 A 的指针都没空,不需要线索化。

**请你一定拿笔在草稿纸上画一遍**,把每个节点的 lchild、rchild、ltag、rtag 填出来。没画过这一步的同学,代码永远看不懂。

---

### 五、项目文件组织

```
DataStructure/
└── ThreadTree/
    ├── ThreadTree.h
    ├── ThreadTree.cpp
    └── main.cpp
```

---

### 六、ThreadTree.h

cpp

```cpp
#pragma once

typedef char ElemType;

// ========== 线索二叉树节点 ==========
typedef struct ThreadNode {
    ElemType data;
    struct ThreadNode *lchild, *rchild;
    int ltag, rtag;                     // 0=孩子,1=线索
} ThreadNode, *ThreadTree;

// ========== 基本操作 ==========
void CreateThreadTree(ThreadTree &T);              // 按先序建普通二叉树(# 表空)
void InThread(ThreadTree p, ThreadTree &pre);      // 中序线索化的递归核心
void CreateInThread(ThreadTree T);                 // 对外的中序线索化接口

// ========== 基于线索的遍历 ==========
ThreadNode* FirstNode(ThreadNode *p);              // 中序序列下,以 p 为根的子树的第一个节点
ThreadNode* NextNode(ThreadNode *p);               // p 的中序后继
void InOrder_Thread(ThreadTree T);                 // 非递归、无栈的中序遍历
```

---

### 七、ThreadTree.cpp 核心实现

#### 7.1 建普通二叉树(先序方式,# 表空)

这一步先建一棵普通二叉树,**初始所有 tag 都置 0**,线索化之后再改。

cpp

```cpp
#include "ThreadTree.h"
#include <iostream>
using namespace std;

void CreateThreadTree(ThreadTree &T) {
    ElemType ch;
    cin >> ch;
    if (ch == '#') {
        T = nullptr;
    } else {
        T = new ThreadNode;
        T->data = ch;
        T->ltag = 0;                    // 初始都是 0,稍后线索化时才可能改 1
        T->rtag = 0;
        CreateThreadTree(T->lchild);
        CreateThreadTree(T->rchild);
    }
}
```

#### 7.2 中序线索化(算法核心,必须背熟)

**核心思想**:中序遍历的过程中,对每个节点 p:

- 如果 p 的 lchild 为空,把 lchild 指向前驱 pre,ltag = 1。
- 如果前驱 pre 的 rchild 为空,把 rchild 指向当前节点 p,rtag = 1(也就是说,pre 的后继就是 p)。

**关键点**:pre 必须用**引用传递**或**全局变量**,因为递归过程中要不断更新它。我们用引用。

cpp

```cpp
void InThread(ThreadTree p, ThreadTree &pre) {
    if (p == nullptr) return;
    
    InThread(p->lchild, pre);           // 递归线索化左子树
    
    // ---- 访问当前节点 p:处理线索 ----
    if (p->lchild == nullptr) {
        p->lchild = pre;                // 左线索指向前驱
        p->ltag = 1;
    }
    if (pre != nullptr && pre->rchild == nullptr) {
        pre->rchild = p;                // 前驱的右线索指向当前节点
        pre->rtag = 1;
    }
    pre = p;                            // 更新 pre 为当前节点
    
    InThread(p->rchild, pre);           // 递归线索化右子树
}
```

**请务必盯着这段代码看三遍**:

第一遍看骨架——就是一个标准的中序递归(左-根-右),"访问根"部分被替换成了"处理线索"。

第二遍看线索处理——两个 if 分别处理"当前节点的左空指针"和"前驱的右空指针"。为什么要处理前驱的右空指针?因为只有到了当前节点 p,我们才知道前驱 pre 的后继是谁(就是 p)。

第三遍看 `pre = p`——每访问完一个节点就更新 pre,为下一次迭代做准备。

#### 7.3 对外接口(处理边界)

上面的 `InThread` 是递归核心,但有个细节:**中序序列的最后一个节点,它的右指针永远没被处理**(因为 pre 更新后,后面没有节点来帮它设置右线索了)。需要在外部包一层处理:

cpp

```cpp
void CreateInThread(ThreadTree T) {
    ThreadTree pre = nullptr;           // 最开始没有前驱
    if (T != nullptr) {
        InThread(T, pre);
        // 处理最后一个节点(pre 此时指向中序序列最后一个节点)
        pre->rchild = nullptr;
        pre->rtag = 1;                  // 表示"没有后继"
    }
}
```

第一次看到这个"尾处理"你可能不理解,其实它对应的就是中序序列最后一个节点(比如前面例子中的 C)的右线索应该指向 NULL 且 rtag=1。如果不做这步,C 的 rchild 在建树时是 nullptr,但 rtag 还是 0——这会让后续遍历代码**误以为 C 的右孩子是空**(rtag=0 意味着"正常的右孩子"),虽然值是 nullptr 不会崩,但语义不对,考研题会判错。

---

### 八、基于线索的遍历(O(1) 空间!)

线索建好后,遍历不再需要栈或递归。关键是两个辅助函数:**找某子树的第一个节点**、**找某节点的后继**。

#### 8.1 FirstNode:中序序列的第一个节点

中序序列的第一个节点就是**整棵树最左下的节点**(一直往左走到 ltag=1 为止)。

cpp

```cpp
ThreadNode* FirstNode(ThreadNode *p) {
    while (p->ltag == 0) {              // 有左孩子就往左走
        p = p->lchild;
    }
    return p;
}
```

**注意终止条件是 `ltag == 0`,不是 `lchild != nullptr`**!因为线索化后 lchild 可能指向前驱(不是 nullptr),这时不能再往下走。这是**初学者最容易错的地方**。

#### 8.2 NextNode:中序后继

分两种情况:

**情况一**:如果 p 有右子树(rtag=0),则 p 的中序后继是**右子树的第一个节点**(右子树的最左下节点)。

**情况二**:如果 p 没有右子树(rtag=1),则 rchild 本身就是后继(线索)。

cpp

```cpp
ThreadNode* NextNode(ThreadNode *p) {
    if (p->rtag == 0) {
        return FirstNode(p->rchild);    // 右子树的第一个节点
    } else {
        return p->rchild;               // 线索直接指向后继
    }
}
```

#### 8.3 中序遍历(无栈,纯线索驱动)

有了上面两个函数,中序遍历就是两行的循环:

cpp

```cpp
void InOrder_Thread(ThreadTree T) {
    if (T == nullptr) return;
    for (ThreadNode *p = FirstNode(T); p != nullptr; p = NextNode(p)) {
        cout << p->data << " ";
    }
}
```

**这段代码的优雅程度是本章的巅峰**:像访问链表一样访问二叉树,空间 O(1),无栈无递归。**这就是线索化的全部价值所在**。

---

### 九、完整测试(main.cpp)

cpp

```cpp
#include "ThreadTree.h"
#include <iostream>
using namespace std;

int main() {
    ThreadTree T;
    cout << "按先序输入(# 表空),例如 ABD##E##C##:" << endl;
    CreateThreadTree(T);                // 建普通二叉树
    CreateInThread(T);                  // 中序线索化
    
    cout << "中序遍历(基于线索): ";
    InOrder_Thread(T);
    cout << endl;
    return 0;
}
```

用输入 `ABD##E##C##` 对应前面那棵例子树,期望输出:

```
中序遍历(基于线索): D B E A C
```

---

### 十、常见疑问(必须搞清楚)

**疑问一:为什么叫"中序"线索二叉树?**

因为我们是按中序遍历的前驱/后继来设置线索的。如果按先序设置,叫先序线索二叉树;按后序设置,叫后序线索二叉树。**同一棵树,三种线索化后形态不同**,别搞混。

**疑问二:加了线索之后,普通的递归遍历还能用吗?**

能用,但必须判断 tag:访问 lchild 前要确认 ltag==0,不然会顺着线索走回前驱,变成死循环。所以一旦线索化,通常就专用线索遍历,不再混用。

**疑问三:线索化可以"反悔"吗?**

难。要还原成普通二叉树,需要遍历一遍把所有 tag=1 的指针改回 nullptr。所以**线索化是一个半永久操作**。

**疑问四:先序和后序线索化,对应的 FirstNode、NextNode 怎么写?**

先序线索化的 `NextNode` 相对好写(当前有左孩子就是左孩子,否则沿线索),后序线索化的 `NextNode` **最难**(要找父节点,一般节点没有父指针的话做不了),所以后序线索化通常需要加三叉链表或额外处理,实际应用很少。**考研只需掌握中序**。

---

### 十一、思考题(请作答)

第一题,对下面这棵树进行中序线索化,写出每个节点线索化后的 lchild、rchild、ltag、rtag:

```
      1
     / \
    2   3
         \
          4
```

第二题,在中序线索二叉树中,**如何找一个节点 p 的中序前驱**?写出 `PreNode(p)` 的伪代码。(提示:这是 NextNode 的对称版本——考虑"p 有左子树"和"p 没有左子树"两种情况)

第三题,为什么后序线索二叉树的 `NextNode` 比中序难写?具体难在哪一步?

第四题,假设一棵二叉树有 100 个节点,线索化之后总共用到了多少条线索?(提示:用那个"空指针数 = n+1"的结论,但要小心最后一个节点的右线索指向 NULL 是否计入)