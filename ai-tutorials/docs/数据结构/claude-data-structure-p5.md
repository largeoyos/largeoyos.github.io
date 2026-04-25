# 数据结构复习:树专题

好,我们进入树的学习。**树是数据结构中最重要的非线性结构之一**,也是后续学习二叉树、图、平衡树、B树的基础。我会按照"概念 → 存储结构 → 代码实现 → 常用操作"的顺序带你学。

在开始之前请你先告诉我:你已经学过二叉树了吗?如果还没学,我建议顺序是**先二叉树 → 再一般树和森林**,因为一般树最常用的存储方式是"孩子兄弟表示法",本质上就是把一般树转成二叉树。

不过你的指令是直接学"树",所以我按**一般树(普通树)**来讲。如果后续你想学二叉树或"树和森林的转换",再告诉我。

---

### 一、树的基本概念(必须先搞清楚)

一棵树由若干节点构成,满足:有且仅有一个**根节点**;除根外,每个节点有且仅有一个**父节点**;每个节点可以有零个或多个**孩子节点**。

几个你必须分清的术语:

**度**:一个节点的孩子数叫节点的度;整棵树中最大的节点度叫树的度。**深度/高度**:从根到某节点的路径长度(边数)+1 叫深度,从某节点到最深叶子的路径长度 +1 叫高度。**叶子**:度为 0 的节点。**森林**:m 棵互不相交的树的集合。

这些概念后面写代码会用到,比如"求树的度"、"求树的高度"都是经典题。

---

### 二、树的三种存储结构

一般树的存储比二叉树复杂,因为每个节点的孩子数不固定。教材上有三种经典方案,你都要会写:

**方案一:双亲表示法(顺序存储)**。用数组存节点,每个节点记录自己的父节点下标。优点是找父节点 O(1),缺点是找孩子要遍历整个数组。

**方案二:孩子表示法(链式存储)**。每个节点挂一个孩子链表。优点是找孩子快,缺点是找父节点要遍历。

**方案三:孩子兄弟表示法(二叉链表)**。每个节点存两个指针:第一个孩子 + 下一个兄弟。这种方式把一般树**变成了一棵二叉树**,是考研和实际工程中最常用的。

---

### 三、项目文件组织

按你之前的目录结构,新建:

```
DataStructure/
└── Tree/
    ├── Tree.h          // 三种存储结构的定义 + 函数声明
    ├── Tree.cpp        // 函数实现
    └── main.cpp        // 测试
```

---

### 四、三种结构体定义(写在 Tree.h 中)

请你手动敲下面的代码到 `Tree.h`:

cpp

```cpp
#pragma once

#define MAX_TREE_SIZE 100
typedef char ElemType;   // 节点数据类型,用 char 便于肉眼观察

// ========== 方案一:双亲表示法 ==========
typedef struct {
    ElemType data;       // 节点数据
    int parent;          // 父节点在数组中的下标,根节点为 -1
} PTNode;

typedef struct {
    PTNode nodes[MAX_TREE_SIZE];   // 节点数组
    int n;                          // 当前节点数
} PTree;


// ========== 方案二:孩子表示法 ==========
typedef struct CTNode {             // 孩子链表中的节点
    int child;                      // 孩子在顺序表中的下标
    struct CTNode *next;            // 下一个孩子
} CTNode, *ChildPtr;

typedef struct {
    ElemType data;
    ChildPtr firstChild;            // 指向第一个孩子的指针
} CTBox;

typedef struct {
    CTBox nodes[MAX_TREE_SIZE];
    int n, root;                    // 节点数、根节点下标
} CTree;


// ========== 方案三:孩子兄弟表示法(重点!) ==========
typedef struct CSNode {
    ElemType data;
    struct CSNode *firstChild;      // 指向第一个孩子
    struct CSNode *nextSibling;     // 指向下一个兄弟
} CSNode, *CSTree;
```

看到第三种结构了吗?**每个节点只有两个指针**,本质上就是二叉树的节点!这就是为什么说"一般树可以转成二叉树"——孩子兄弟表示法就是转换规则。

---

### 五、函数声明(继续写在 Tree.h)

我们重点实现**孩子兄弟表示法**的操作,因为它最实用,也是考研高频考点:

cpp

```cpp
// ========== 孩子兄弟表示法常用操作 ==========
bool InitTree_CS(CSTree &T);                       // 初始化(置空)
CSNode* CreateNode(ElemType e);                    // 创建单个节点
int TreeDepth(CSTree T);                           // 求树的深度
int TreeNodeCount(CSTree T);                       // 统计节点总数
int LeafCount(CSTree T);                           // 统计叶子数
int TreeDegree(CSTree T);                          // 求树的度
CSNode* FindNode(CSTree T, ElemType e);            // 按值查找
void PreOrder(CSTree T);                           // 先根遍历
void PostOrder(CSTree T);                          // 后根遍历
void LevelOrder(CSTree T);                         // 层序遍历
void DestroyTree(CSTree &T);                       // 销毁
```

---

### 六、核心函数实现(写在 Tree.cpp)

#### 6.1 基础:初始化与创建节点

cpp

```cpp
#include "Tree.h"
#include <iostream>
#include <queue>
using namespace std;

bool InitTree_CS(CSTree &T) {
    T = nullptr;        // 空树就是空指针
    return true;
}

CSNode* CreateNode(ElemType e) {
    CSNode *p = new CSNode;
    p->data = e;
    p->firstChild = nullptr;
    p->nextSibling = nullptr;
    return p;
}
```

#### 6.2 求树的深度(递归,重点理解)

一般树的深度 = max(所有子树深度) + 1。在孩子兄弟表示法下,一个节点的"所有孩子"是:`firstChild`, `firstChild->nextSibling`, `firstChild->nextSibling->nextSibling`...

cpp

```cpp
int TreeDepth(CSTree T) {
    if (T == nullptr) return 0;
    
    int maxChildDepth = 0;
    CSNode *p = T->firstChild;      // 遍历 T 的所有孩子
    while (p != nullptr) {
        int d = TreeDepth(p);        // 递归求以 p 为根的子树深度
        if (d > maxChildDepth) maxChildDepth = d;
        p = p->nextSibling;          // 通过兄弟链走到下一个孩子
    }
    return maxChildDepth + 1;        // 加上当前层
}
```

**关键点**:这里的递归和二叉树不同。二叉树只递归左右两个孩子,而一般树要通过 `nextSibling` 循环遍历所有孩子,每个孩子都递归一次。

#### 6.3 统计节点总数

cpp

```cpp
int TreeNodeCount(CSTree T) {
    if (T == nullptr) return 0;
    int count = 1;                   // 算上自己
    CSNode *p = T->firstChild;
    while (p != nullptr) {
        count += TreeNodeCount(p);   // 累加每棵子树的节点数
        p = p->nextSibling;
    }
    return count;
}
```

#### 6.4 统计叶子节点数

叶子的判定:**在孩子兄弟表示法里,`firstChild == nullptr` 就是叶子**(没有孩子)。注意 `nextSibling` 不影响判定,因为兄弟不是孩子。

cpp

```cpp
int LeafCount(CSTree T) {
    if (T == nullptr) return 0;
    if (T->firstChild == nullptr) {
        // 当前节点是叶子,但还要统计它的所有兄弟子树里的叶子
        return 1 + LeafCount(T->nextSibling);
    }
    // 非叶子:统计孩子子树 + 兄弟子树里的叶子
    return LeafCount(T->firstChild) + LeafCount(T->nextSibling);
}
```

这里有个初学者容易错的点:**递归一般树时,`nextSibling` 也要递归下去**,否则会漏掉兄弟那一整片。写法和二叉树的 `left/right` 对称处理很像,但含义完全不同。

#### 6.5 先根遍历(递归)

先访问根,再依次先根遍历每棵子树:

cpp

```cpp
void PreOrder(CSTree T) {
    if (T == nullptr) return;
    cout << T->data << " ";          // 访问根
    CSNode *p = T->firstChild;
    while (p != nullptr) {
        PreOrder(p);                 // 递归每棵子树
        p = p->nextSibling;
    }
}
```

#### 6.6 后根遍历

先依次后根遍历每棵子树,最后访问根:

cpp

```cpp
void PostOrder(CSTree T) {
    if (T == nullptr) return;
    CSNode *p = T->firstChild;
    while (p != nullptr) {
        PostOrder(p);
        p = p->nextSibling;
    }
    cout << T->data << " ";          // 最后访问根
}
```

**注意**:一般树**没有中序遍历**的概念,因为孩子数不固定,无法定义"中间"位置。只有先根和后根。

#### 6.7 层序遍历(借助队列)

cpp

```cpp
void LevelOrder(CSTree T) {
    if (T == nullptr) return;
    queue<CSNode*> Q;
    Q.push(T);
    while (!Q.empty()) {
        CSNode *node = Q.front(); Q.pop();
        cout << node->data << " ";
        // 把 node 的所有孩子入队
        CSNode *p = node->firstChild;
        while (p != nullptr) {
            Q.push(p);
            p = p->nextSibling;
        }
    }
}
```

#### 6.8 销毁(后序释放,顺序不能错)

cpp

```cpp
void DestroyTree(CSTree &T) {
    if (T == nullptr) return;
    DestroyTree(T->firstChild);      // 先释放孩子
    DestroyTree(T->nextSibling);     // 再释放兄弟
    delete T;                        // 最后释放自己
    T = nullptr;
}
```

必须按"孩子 → 兄弟 → 自己"的顺序,否则会丢失指针导致内存泄漏。

---

### 七、测试用例(main.cpp)

我们手动建一棵树来验证。假设目标树:

```
        A
      / | \
     B  C  D
    /|     |
   E F     G
```

对应孩子兄弟表示法的形态:`A->firstChild=B`, `B->nextSibling=C->nextSibling=D`, `B->firstChild=E`, `E->nextSibling=F`, `D->firstChild=G`。

cpp

```cpp
#include "Tree.h"
#include <iostream>
using namespace std;

int main() {
    // 手动构建上面那棵树
    CSTree A = CreateNode('A');
    CSTree B = CreateNode('B');
    CSTree C = CreateNode('C');
    CSTree D = CreateNode('D');
    CSTree E = CreateNode('E');
    CSTree F = CreateNode('F');
    CSTree G = CreateNode('G');

    A->firstChild = B;
    B->nextSibling = C;
    C->nextSibling = D;
    B->firstChild = E;
    E->nextSibling = F;
    D->firstChild = G;

    cout << "先根遍历: ";  PreOrder(A);   cout << endl;  // A B E F C D G
    cout << "后根遍历: ";  PostOrder(A);  cout << endl;  // E F B C G D A
    cout << "层序遍历: ";  LevelOrder(A); cout << endl;  // A B C D E F G
    cout << "节点总数: " << TreeNodeCount(A) << endl;    // 7
    cout << "叶子数: "   << LeafCount(A)     << endl;    // 4 (E, F, C, G)
    cout << "树的深度: " << TreeDepth(A)     << endl;    // 3

    DestroyTree(A);
    return 0;
}
```

建议你自己在纸上画出这棵树,再手动追踪一遍三种遍历,看结果对不对——**这是检验你是否真正理解的关键**。

---

### 八、思考题(请你回答)

学完这一节,请先回答我以下问题再进行下一步,这些是考试和面试高频:

第一,在孩子兄弟表示法里,为什么判断叶子用 `firstChild == nullptr` 而不是 `nextSibling == nullptr`?

第二,如果让你实现"求树的度"(即所有节点中孩子数的最大值),你会怎么写?试着自己写一下,然后给我看。

第三,一般树的后根遍历,等价于将它转成二叉树后的什么遍历?(提示:和先根、中序、后序的哪一个相同?)

---

### 九、下一步

你可以告诉我接下来想做什么:

你可以选择:(A) 先让我解答上面三个思考题再继续;(B) 直接开始"二叉树"专题,包括二叉树的定义、四种遍历(先中后层)、线索二叉树、二叉搜索树等;(C) 学习"树、森林、二叉树的相互转换"算法;(D) 补充一般树的双亲表示法和孩子表示法的完整代码实现。

请选一个方向,或者告诉我你的疑问。

- [ ]