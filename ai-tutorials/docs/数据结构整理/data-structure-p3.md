## 数据结构复习:树专题

好,我们进入树的学习。**树是数据结构中最重要的非线性结构之一**,也是后续学习二叉树、图、平衡树、B树的基础。我会按照"概念 → 存储结构 → 代码实现 → 常用操作"的顺序带你学。

开始前应先确认是否掌握二叉树。若尚未学习，建议按照**先二叉树，再一般树和森林**的顺序，因为一般树常用的“孩子兄弟表示法”本质上是把一般树转换为二叉树。

本节直接讲解**一般树（普通树）**。二叉树以及树与森林的转换可作为后续专题。

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

本节结束后可完成以下高频考试与面试题：

第一,在孩子兄弟表示法里,为什么判断叶子用 `firstChild == nullptr` 而不是 `nextSibling == nullptr`?

第二,如果让你实现"求树的度"(即所有节点中孩子数的最大值),你会怎么写?试着自己写一下,然后给我看。

第三,一般树的后根遍历,等价于将它转成二叉树后的什么遍历?(提示:和先根、中序、后序的哪一个相同?)

##  数据结构复习:二叉树专题

好,我们进入**二叉树**的学习。这是数据结构里最核心的章节,没有之一——后续的 BST、AVL、红黑树、堆、哈夫曼树、B树都建立在二叉树之上。我会按"概念 → 存储 → 遍历 → 线索化 → BST"的顺序带你扎实地走一遍。

这节内容比较多,我会分成**几次对话**完成。本次先讲:**二叉树的概念、两种存储结构、四种遍历(递归+非递归)、常用操作**。线索二叉树和 BST 留到下次。

---

### 一、二叉树的基本概念(必须记牢)

二叉树和一般树的**本质区别**:每个节点最多有两个孩子,且**左右孩子有严格区分**。即使只有一个孩子,也要指明是左孩子还是右孩子,不能混用。这是二叉树和一般树最容易混淆的地方。

几种特殊的二叉树你要分清:

**满二叉树**:每一层都填满,叶子全在最后一层,节点数为 2^h - 1。**完全二叉树**:除最后一层外每层填满,最后一层节点连续靠左排列。完全二叉树的重要性在于它可以用数组高效存储。**二叉搜索树(BST)**:左子树所有值 < 根 < 右子树所有值。**平衡二叉树(AVL)**:左右子树高度差不超过 1 的 BST。

几个必须记住的**性质**(考研常考):

第一,非空二叉树第 i 层最多有 2^(i-1) 个节点。第二,深度为 h 的二叉树最多有 2^h - 1 个节点。第三,任意二叉树中,**叶子数 n0 = 度为 2 的节点数 n2 + 1**。这个公式推导:总节点数 n = n0 + n1 + n2,总分支数 = n - 1 = n1 + 2·n2,联立可得。第四,具有 n 个节点的完全二叉树深度为 ⌊log₂n⌋ + 1。

---

### 二、两种存储结构

**顺序存储**:用数组存,下标 i 的节点,左孩子在 2i,右孩子在 2i+1,父节点在 i/2(下标从 1 开始)。**仅适合完全二叉树**,否则浪费空间。

**链式存储**(二叉链表,最常用):每个节点含 data、左指针、右指针。这是我们这一节的主角。

---

### 三、项目文件组织

```
DataStructure/
└── BinaryTree/
    ├── BinaryTree.h
    ├── BinaryTree.cpp
    └── main.cpp
```

---

### 四、结构体定义(写到 BinaryTree.h)

cpp

```cpp
#pragma once

typedef char ElemType;

// ========== 二叉链表节点 ==========
typedef struct BiTNode {
    ElemType data;
    struct BiTNode *lchild;
    struct BiTNode *rchild;
} BiTNode, *BiTree;
```

注意这里的双重 typedef 写法和链表专题一样:`BiTNode` 表示节点本身,`BiTree` 表示指向节点的指针(也就是"一棵二叉树"用它的根指针表示)。

---

### 五、函数声明(继续写到 BinaryTree.h)

cpp

```cpp
// ========== 建树 ==========
bool InitTree(BiTree &T);                            // 初始化
BiTNode* CreateNode(ElemType e);                     // 创建单个节点
void CreateBiTree(BiTree &T);                        // 按先序输入创建(# 表示空)

// ========== 四种遍历(递归) ==========
void PreOrder(BiTree T);                             // 先序:根 左 右
void InOrder(BiTree T);                              // 中序:左 根 右
void PostOrder(BiTree T);                            // 后序:左 右 根
void LevelOrder(BiTree T);                           // 层序

// ========== 四种遍历(非递归,重点!) ==========
void PreOrder_NonRec(BiTree T);
void InOrder_NonRec(BiTree T);
void PostOrder_NonRec(BiTree T);

// ========== 常用操作 ==========
int  TreeDepth(BiTree T);                            // 求深度
int  NodeCount(BiTree T);                            // 节点总数
int  LeafCount(BiTree T);                            // 叶子数
int  NodeCountDeg2(BiTree T);                        // 度为2的节点数
BiTNode* FindNode(BiTree T, ElemType e);             // 按值查找
void DestroyTree(BiTree &T);                         // 销毁
```

---

### 六、核心实现(写到 BinaryTree.cpp)

#### 6.1 建树(先序方式,# 表示空)

这是考研最常见的建树方式。用户按**先序遍历顺序**输入字符,遇到 `#` 表示空子树。

例如:输入 `AB#D##C##` 构造的树是:

```
    A
   / \
  B   C
   \
    D
```

cpp

```cpp
#include "BinaryTree.h"
#include <iostream>
#include <stack>
#include <queue>
using namespace std;

bool InitTree(BiTree &T) {
    T = nullptr;
    return true;
}

BiTNode* CreateNode(ElemType e) {
    BiTNode *p = new BiTNode;
    p->data = e;
    p->lchild = p->rchild = nullptr;
    return p;
}

void CreateBiTree(BiTree &T) {
    ElemType ch;
    cin >> ch;
    if (ch == '#') {
        T = nullptr;                 // 空节点
    } else {
        T = new BiTNode;
        T->data = ch;
        CreateBiTree(T->lchild);     // 递归建左子树
        CreateBiTree(T->rchild);     // 递归建右子树
    }
}
```

**关键理解**:`&T` 的引用必不可少,因为我们要修改调用者的指针本身。如果不用引用,递归返回后父节点的 `lchild/rchild` 仍然是 nullptr。

#### 6.2 递归遍历(三兄弟长得极像)

cpp

```cpp
void PreOrder(BiTree T) {
    if (T == nullptr) return;
    cout << T->data << " ";          // 根
    PreOrder(T->lchild);             // 左
    PreOrder(T->rchild);             // 右
}

void InOrder(BiTree T) {
    if (T == nullptr) return;
    InOrder(T->lchild);              // 左
    cout << T->data << " ";          // 根
    InOrder(T->rchild);              // 右
}

void PostOrder(BiTree T) {
    if (T == nullptr) return;
    PostOrder(T->lchild);            // 左
    PostOrder(T->rchild);            // 右
    cout << T->data << " ";          // 根
}
```

**记忆口诀**:先中后指的是**根**的位置。递归是自然的,难点在非递归。

#### 6.3 层序遍历(用队列)

cpp

```cpp
void LevelOrder(BiTree T) {
    if (T == nullptr) return;
    queue<BiTNode*> Q;
    Q.push(T);
    while (!Q.empty()) {
        BiTNode *p = Q.front(); Q.pop();
        cout << p->data << " ";
        if (p->lchild) Q.push(p->lchild);
        if (p->rchild) Q.push(p->rchild);
    }
}
```

---

### 七、非递归遍历(重点中的重点)

非递归遍历是考研和面试**必考**的。核心思想:用**栈**模拟系统递归调用栈。

#### 7.1 非递归先序

思路:访问一个节点,把它的右孩子先压栈(后访问),再处理左孩子。

cpp

```cpp
void PreOrder_NonRec(BiTree T) {
    if (T == nullptr) return;
    stack<BiTNode*> S;
    S.push(T);
    while (!S.empty()) {
        BiTNode *p = S.top(); S.pop();
        cout << p->data << " ";      // 访问根
        if (p->rchild) S.push(p->rchild);  // 先压右(后出)
        if (p->lchild) S.push(p->lchild);  // 后压左(先出)
    }
}
```

**为什么先压右再压左?** 栈是 LIFO,后进先出。我们希望左孩子先被处理,所以左孩子后压栈。

#### 7.2 非递归中序(最经典,必须背熟)

思路:**沿着左链一路往下压栈,到头后弹出访问,然后转向右子树重复**。

cpp

```cpp
void InOrder_NonRec(BiTree T) {
    stack<BiTNode*> S;
    BiTNode *p = T;
    while (p != nullptr || !S.empty()) {
        if (p != nullptr) {
            S.push(p);               // 一路向左压栈
            p = p->lchild;
        } else {
            p = S.top(); S.pop();    // 左边到底,弹出访问
            cout << p->data << " ";
            p = p->rchild;           // 转向右子树
        }
    }
}
```

这段代码一定要**自己手动模拟一遍**才能真正理解。建议拿上面那棵 `ABCD` 的树,在纸上画出栈的变化过程。

#### 7.3 非递归后序(最难,需要标记)

后序的难点在于:访问一个节点时,必须确保**它的左右子树都已经访问完**。所以要记录"上一个被访问的节点",判断我们是从左子树回来还是从右子树回来。

cpp

```cpp
void PostOrder_NonRec(BiTree T) {
    stack<BiTNode*> S;
    BiTNode *p = T;
    BiTNode *lastVisited = nullptr;  // 上一个访问的节点

    while (p != nullptr || !S.empty()) {
        if (p != nullptr) {
            S.push(p);
            p = p->lchild;           // 一路向左
        } else {
            BiTNode *top = S.top();
            // 右子树存在且未访问过,则转向右子树
            if (top->rchild != nullptr && top->rchild != lastVisited) {
                p = top->rchild;
            } else {
                cout << top->data << " ";  // 访问当前节点
                lastVisited = top;
                S.pop();
                // p 保持 nullptr,下一轮继续弹栈
            }
        }
    }
}
```

这段代码是**历年考研真题重灾区**,建议反复练习直到能默写。关键在于 `lastVisited` 的作用:防止从右子树返回后又重新进入右子树造成死循环。
就是防止左右中从右回来又进中了

---

### 八、常用操作

#### 8.1 求深度

cpp

```cpp
int TreeDepth(BiTree T) {
    if (T == nullptr) return 0;
    int ld = TreeDepth(T->lchild);
    int rd = TreeDepth(T->rchild);
    return (ld > rd ? ld : rd) + 1;
}
```

#### 8.2 节点数 / 叶子数 / 度为2的节点数

cpp

```cpp
int NodeCount(BiTree T) {
    if (T == nullptr) return 0;
    return NodeCount(T->lchild) + NodeCount(T->rchild) + 1;
}

int LeafCount(BiTree T) {
    if (T == nullptr) return 0;
    if (T->lchild == nullptr && T->rchild == nullptr) return 1;
    return LeafCount(T->lchild) + LeafCount(T->rchild);
}

int NodeCountDeg2(BiTree T) {
    if (T == nullptr) return 0;
    int self = (T->lchild != nullptr && T->rchild != nullptr) ? 1 : 0;
    return self + NodeCountDeg2(T->lchild) + NodeCountDeg2(T->rchild);
}
```

#### 8.3 按值查找

cpp

```cpp
BiTNode* FindNode(BiTree T, ElemType e) {
    if (T == nullptr) return nullptr;
    if (T->data == e) return T;
    BiTNode *p = FindNode(T->lchild, e);
    if (p != nullptr) return p;
    return FindNode(T->rchild, e);   // 左边找不到再找右边
}
```

#### 8.4 销毁(后序释放)

cpp

```cpp
void DestroyTree(BiTree &T) {
    if (T == nullptr) return;
    DestroyTree(T->lchild);
    DestroyTree(T->rchild);
    delete T;
    T = nullptr;
}
```

必须是**后序**,因为要先把孩子释放了,才能释放自己,否则孩子指针丢失。

---

### 九、测试代码(main.cpp)

cpp

```cpp
#include "BinaryTree.h"
#include <iostream>
using namespace std;

int main() {
    BiTree T;
    cout << "按先序输入(# 表示空),例如 AB#D##C##:" << endl;
    CreateBiTree(T);

    cout << "递归先序: "; PreOrder(T);  cout << endl;
    cout << "递归中序: "; InOrder(T);   cout << endl;
    cout << "递归后序: "; PostOrder(T); cout << endl;
    cout << "层序遍历: "; LevelOrder(T);cout << endl;

    cout << "非递归先序: "; PreOrder_NonRec(T);  cout << endl;
    cout << "非递归中序: "; InOrder_NonRec(T);   cout << endl;
    cout << "非递归后序: "; PostOrder_NonRec(T); cout << endl;

    cout << "节点总数: " << NodeCount(T) << endl;
    cout << "叶子数:   " << LeafCount(T) << endl;
    cout << "度2节点: "  << NodeCountDeg2(T) << endl;
    cout << "树深度:   " << TreeDepth(T) << endl;

    DestroyTree(T);
    return 0;
}
```

用 `AB#D##C##` 测试,预期输出:

```
递归先序: A B D C
递归中序: B D A C
递归后序: D B C A
层序遍历: A B C D
```

建议你**在纸上画出这棵树**,手动推出三种遍历,再和程序输出对照。

---

### 十、思考题(请作答再继续)

第一,一棵二叉树有 50 个叶子节点,30 个度为 1 的节点,请问总节点数是多少?(用性质 n0 = n2 + 1)

第二,**先序序列 + 中序序列**可以唯一确定一棵二叉树;**先序 + 后序**呢?能否唯一确定?为什么?

第三,非递归后序遍历为什么需要 `lastVisited` 变量?如果去掉会发生什么?

## 数据结构复习:用自己写的栈和队列重做二叉树的非递归遍历 & 层序遍历

**用自己写的数据结构支撑更上层的算法**——这正是数据结构课程的核心训练。之前我们用了 `std::stack` 和 `std::queue` 作为"黑盒",现在你要把它们换成自己的 `SqStack`、`LkQueue`,这一步能让你真正理解"栈和队列不是语法糖,而是有明确底层结构的工具"。

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

## 数据结构复习:线索二叉树

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

## 数据结构复习:树、森林与二叉树的相互转换

好,我们进入一个**非常重要但常被忽视**的知识点。这节内容考研选择题年年出,原理非常优美——它揭示了一个深刻事实:**普通树、森林、二叉树这三种看似不同的结构,本质上是同一种东西的不同表达形式**。

这节我会**先花大量篇幅讲清楚转换规则**(这是本章真正的重点),然后给出代码实现。因为只要规则懂了,代码是 10 分钟就能敲出来的事;规则不懂,代码写出来也是懵的。

---

### 一、核心洞察(先建立直觉)

回忆一下你之前学过的"孩子兄弟表示法":每个节点只有两个指针,一个指向**第一个孩子**,一个指向**下一个兄弟**。

cpp

```cpp
typedef struct CSNode {
    ElemType data;
    struct CSNode *firstChild;      // 指向第一个孩子
    struct CSNode *nextSibling;     // 指向下一个兄弟
} CSNode, *CSTree;
```

现在你盯着这个结构体看——**它不就是二叉树的节点吗?** 只是把 lchild 改叫 firstChild,rchild 改叫 nextSibling 而已!

这就是本章的核心秘密:**孩子兄弟表示法本身就是"把一般树画成二叉树"的规则**。我们所谓的"转换",其实就是给同一个数据结构换个视角来看。

---

### 二、转换规则(三条口诀)

#### 2.1 一般树 → 二叉树(口诀:"左孩子,右兄弟")

**规则**:对原树中每个节点,保留它和**第一个孩子**的连线作为二叉树中的**左分支**;把它所有孩子之间的**兄弟关系**改画成**右分支**。

我用一个例子带你走一遍。原一般树:

```
        A
      / | \
     B  C  D
    /|     |
   E F     G
```

**转换步骤**:

第一步,连兄弟。B-C、C-D 是兄弟,连起来;E-F 是兄弟,连起来。

```
        A
      / | \
     B--C--D
    /|     |
   E-F     G
```

第二步,每个节点只保留与**第一个孩子**的连线,删除其他孩子连线。A 只留 A-B,删掉 A-C、A-D;B 只留 B-E,删掉 B-F;D 只留 D-G。

```
        A
       /
      B---C---D
     /        |
    E---F     G
```

第三步,旋转——把每条"兄弟连线"看作右分支,"第一个孩子连线"看作左分支。得到:

```
        A
       /
      B
     / \
    E   C
     \   \
      F   D
         /
        G
```

**这就是转换结果**。你可以验证:在二叉树里,A 的左孩子是 B(B 确实是 A 的第一个孩子);B 的右孩子是 C(C 确实是 B 在原树中的下一个兄弟);B 的左孩子是 E,E 的右孩子是 F,都符合规则。

**一个必须记住的性质**:**一般树转成二叉树后,根节点没有右子树**。因为根节点没有兄弟(它是树的顶点)。这是考研选择题的送分点。

#### 2.2 二叉树 → 一般树(反向操作)

**规则**:反过来执行。对二叉树中每个节点 p,如果它有右孩子 r,那么 r 是 p 的父节点在一般树中的下一个兄弟;r 的右孩子是再下一个兄弟……

**操作化描述**:从二叉树还原一般树,对于每个节点 p,把 p 的右孩子、右孩子的右孩子、右孩子的右孩子的右孩子……全部变成 **p 的父节点**的孩子。然后删除这些右连线,改画成 p 父节点向它们发出的分支。

#### 2.3 森林 → 二叉树(口诀:"把森林的根串成兄弟")

森林是**多棵树的集合**,比如 F = {T1, T2, T3}:

```
    A         E         H
   / \        |        / \
  B   C       F       I   J
              |
              G
```

**规则两步**:

第一步,每棵树**独立转成二叉树**(用 2.1 的规则)。

第二步,**把第二棵树的根接到第一棵树根的右子树,把第三棵树的根接到第二棵树根的右子树,依此类推**。换句话说,各棵树的根按顺序被串成一个"右分支链"。

结果:

```
        A
       / \
      B   E
       \ / \
        C F H
             \
              I
               \
                J
```

(F 下面还有 G,我没全画完,但你应该看出结构了。)

**性质**:森林转二叉树后,**根节点的右子树反映了其他树**,根节点的左子树反映了第一棵树。这和"一般树转二叉树根没有右子树"是对偶的——因为森林中有多棵树,所以根可以有右子树。

#### 2.4 二叉树 → 森林(反向)

看一棵二叉树:如果根的右子树为空,那么它对应一棵一般树;如果根的右子树非空,那么它对应森林。

**操作**:反复剥离——把当前二叉树根节点的右子树**整个拆下来**,作为新的一棵树的根继续处理。每一次剥离产生森林中的一棵树。

---

### 三、三个操作总结

用一句话总结这一整章:

**"把一般树/森林的兄弟关系,在二叉树里画成右分支;把第一个孩子关系,画成左分支。"**

记住这一句,所有转换题都能做。

---

### 四、遍历序列的对应关系(考研重点)

这是本章**真正的高频考点**:转换前后,哪些遍历序列保持不变?

|一般树|森林|对应二叉树|
|---|---|---|
|先根遍历|先序遍历(依次遍历每棵树)|**先序遍历**|
|后根遍历|**中序遍历**(依次后根)|**中序遍历**|

**重点结论(必须背下来)**:

一般树的**先根遍历**序列 = 对应二叉树的**先序**序列。一般树的**后根遍历**序列 = 对应二叉树的**中序**序列。森林的**先序遍历**序列 = 对应二叉树的**先序**序列。森林的**中序遍历**(即对每棵树后根,然后依次)= 对应二叉树的**中序**序列。

**注意**:一般树和森林都**没有"中序遍历"**(因为孩子数不固定,没有"中间"的概念),但转成二叉树后可以有中序——这个中序对应的就是一般树的后根遍历。这是最容易被出题人卡住的地方。

#### 一个示例验证

还是 2.1 的那棵树:

```
原一般树:
        A
      / | \
     B  C  D
    /|     |
   E F     G
```

**先根遍历**(根→各子树先根):A B E F C D G。

转换后的二叉树(2.1 里画的那个):

```
        A
       /
      B
     / \
    E   C
     \   \
      F   D
         /
        G
```

**二叉树先序**(根→左→右):A B E F C D G。**完全一致**!

**一般树后根**:E F B C G D A。

**二叉树中序**(左→根→右):E F B C G D A。**完全一致**!

这两个对应关系不是巧合——**它们本质上是同一个遍历过程,只是换个视角描述**。你理解了这一点,转换这一章就彻底通了。

---

### 五、项目文件组织

```
DataStructure/
└── Convert/
    ├── Convert.h
    ├── Convert.cpp
    └── main.cpp
```

---

### 六、Convert.h

我们要给出两种结构:一般树节点(标准"多孩子数组"表示)、二叉树节点(就是孩子兄弟表示法 = 二叉链表)。

cpp

```cpp
#pragma once

#define MAX_CHILDREN 10
typedef char ElemType;

// ========== 一般树(多孩子数组表示法)==========
// 便于我们"自然地"定义一棵一般树
typedef struct GTNode {
    ElemType data;
    int childCount;
    struct GTNode *children[MAX_CHILDREN];
} GTNode, *GTree;

// ========== 二叉树(孩子兄弟表示法)==========
typedef struct BTNode {
    ElemType data;
    struct BTNode *lchild;      // 对应"第一个孩子"
    struct BTNode *rchild;      // 对应"下一个兄弟"
} BTNode, *BTree;

// ========== 辅助函数 ==========
GTNode* CreateGTNode(ElemType e);
BTNode* CreateBTNode(ElemType e);
void AddChild(GTNode *parent, GTNode *child);

// ========== 核心转换函数 ==========
BTree GTreeToBTree(GTree T);                        // 一般树 → 二叉树
GTree BTreeToGTree(BTree T);                        // 二叉树 → 一般树

// ========== 森林相关(森林用"根节点数组"表示)==========
BTree ForestToBTree(GTree forest[], int n);         // 森林 → 二叉树

// ========== 遍历(用于验证转换正确性)==========
void PreOrder_G(GTree T);                           // 一般树先根遍历
void PostOrder_G(GTree T);                          // 一般树后根遍历
void PreOrder_B(BTree T);                           // 二叉树先序
void InOrder_B(BTree T);                            // 二叉树中序
```

---

### 七、Convert.cpp 实现

#### 7.1 基础建树工具

cpp

```cpp
#include "Convert.h"
#include <iostream>
using namespace std;

GTNode* CreateGTNode(ElemType e) {
    GTNode *p = new GTNode;
    p->data = e;
    p->childCount = 0;
    for (int i = 0; i < MAX_CHILDREN; i++) p->children[i] = nullptr;
    return p;
}

BTNode* CreateBTNode(ElemType e) {
    BTNode *p = new BTNode;
    p->data = e;
    p->lchild = p->rchild = nullptr;
    return p;
}

void AddChild(GTNode *parent, GTNode *child) {
    parent->children[parent->childCount++] = child;
}
```

#### 7.2 一般树 → 二叉树(核心算法)

这是本章最关键的代码,请**仔细看逻辑**:

cpp

```cpp
BTree GTreeToBTree(GTree T) {
    if (T == nullptr) return nullptr;

    // 1. 把一般树的根复制为二叉树的根
    BTNode *bt = CreateBTNode(T->data);

    // 2. 把第一个孩子递归转换,挂到 bt->lchild
    if (T->childCount > 0) {
        bt->lchild = GTreeToBTree(T->children[0]);

        // 3. 其余孩子依次挂在"右兄弟链"上
        BTNode *curr = bt->lchild;
        for (int i = 1; i < T->childCount; i++) {
            curr->rchild = GTreeToBTree(T->children[i]);
            curr = curr->rchild;            // 移动到新挂上的节点,继续挂下一个
        }
    }
    return bt;
}
```

**这段代码的核心逻辑**(请对照转换规则理解):

第一步,当前节点独立转换为二叉树节点。

第二步,把当前节点的**第一个孩子**转成二叉树,挂到**左分支**。这直接对应规则"第一个孩子→左分支"。

第三步,剩下的孩子们原本是"彼此的兄弟",所以在二叉树中要串成**右分支链**。我们用 `curr` 作为"链尾指针",每挂一个新兄弟就把 curr 往后移。这直接对应规则"兄弟关系→右分支"。

#### 7.3 二叉树 → 一般树(反向)

cpp

```cpp
GTree BTreeToGTree(BTree T) {
    if (T == nullptr) return nullptr;

    GTNode *gt = CreateGTNode(T->data);

    // 从 T->lchild 开始,沿着 rchild 链走,每个都是 gt 的孩子
    BTNode *p = T->lchild;
    while (p != nullptr) {
        GTNode *child = BTreeToGTree(p);    // 递归转换这棵子树
        AddChild(gt, child);                // 加入 gt 的孩子列表
        p = p->rchild;                      // 沿着"兄弟链"继续
    }
    return gt;
}
```

理解关键:**在二叉树里,从 T->lchild 开始,沿着 rchild 一直走,访问到的节点在原一般树中都是 T 的直接孩子**。这是 7.2 的逆过程。

#### 7.4 森林 → 二叉树

cpp

```cpp
BTree ForestToBTree(GTree forest[], int n) {
    if (n == 0) return nullptr;

    // 1. 第一棵树转成二叉树,作为结果的根
    BTree root = GTreeToBTree(forest[0]);

    // 2. 剩下的树依次转换,挂到前一个根的"右子树"
    BTNode *curr = root;
    for (int i = 1; i < n; i++) {
        curr->rchild = GTreeToBTree(forest[i]);
        curr = curr->rchild;                 // 移到新挂上的根,继续往后挂
    }
    return root;
}
```

**注意这段代码和 7.2 中的"挂兄弟链"逻辑几乎一模一样**。这不是巧合——森林就是"一堆根组成的兄弟关系",和一般树里孩子之间的兄弟关系,在二叉树中都表示为"右分支链"。**森林和一般树在二叉树视角下是等价的**,这是本章最深刻的洞察。

#### 7.5 遍历函数(用于验证)

cpp

```cpp
void PreOrder_G(GTree T) {
    if (T == nullptr) return;
    cout << T->data << " ";                  // 先访问根
    for (int i = 0; i < T->childCount; i++) {
        PreOrder_G(T->children[i]);          // 再依次先根遍历每棵子树
    }
}

void PostOrder_G(GTree T) {
    if (T == nullptr) return;
    for (int i = 0; i < T->childCount; i++) {
        PostOrder_G(T->children[i]);
    }
    cout << T->data << " ";                  // 最后访问根
}

void PreOrder_B(BTree T) {
    if (T == nullptr) return;
    cout << T->data << " ";
    PreOrder_B(T->lchild);
    PreOrder_B(T->rchild);
}

void InOrder_B(BTree T) {
    if (T == nullptr) return;
    InOrder_B(T->lchild);
    cout << T->data << " ";
    InOrder_B(T->rchild);
}
```

---

### 八、测试代码(main.cpp)

我们手动建出本章开头的那棵一般树,验证遍历序列的对应关系:

cpp

```cpp
#include "Convert.h"
#include <iostream>
using namespace std;

int main() {
    // 建一般树:
    //         A
    //       / | \
    //      B  C  D
    //     /|     |
    //    E F     G
    GTree A = CreateGTNode('A');
    GTree B = CreateGTNode('B');
    GTree C = CreateGTNode('C');
    GTree D = CreateGTNode('D');
    GTree E = CreateGTNode('E');
    GTree F = CreateGTNode('F');
    GTree G = CreateGTNode('G');

    AddChild(A, B); AddChild(A, C); AddChild(A, D);
    AddChild(B, E); AddChild(B, F);
    AddChild(D, G);

    // 一般树遍历
    cout << "一般树先根: "; PreOrder_G(A);  cout << endl;  // A B E F C D G
    cout << "一般树后根: "; PostOrder_G(A); cout << endl;  // E F B C G D A

    // 转换为二叉树
    BTree bt = GTreeToBTree(A);

    // 验证对应关系!
    cout << "二叉树先序: "; PreOrder_B(bt); cout << endl;  // A B E F C D G (== 先根)
    cout << "二叉树中序: "; InOrder_B(bt);  cout << endl;  // E F B C G D A (== 后根)

    return 0;
}
```

**运行后你会看到四行输出正好两两相等**:

```
一般树先根: A B E F C D G
一般树后根: E F B C G D A
二叉树先序: A B E F C D G
二叉树中序: E F B C G D A
```

**这就是本章最有力的证明**——代码跑出来的结果完美验证了理论。

---

### 九、常见易错点归纳

第一个易错点,一般树转二叉树后,**根节点一定没有右子树**。但森林转二叉树后,**根可以有右子树**。

第二个易错点,"后根遍历"对应的是二叉树"**中序**",不是"后序"。这是考试最爱挖的坑。

第三个易错点,一般树没有"中序"的概念,**只有先根和后根**。有人试图套用中序会得到错误答案。

第四个易错点,转换过程中节点的**数量不变,值不变**,只是指针重新组织。转换不增加也不减少节点。

第五个易错点,**同一棵二叉树**可以对应**一棵一般树**,也可以对应**一片森林**,取决于根的右子树是否为空。考试时如果题目说"转换成森林",就要从根的右子树开始剥离。

---

### 十、思考题(请作答)

第一题,下面这棵二叉树:

```
        A
       / \
      B   C
     / \
    D   E
         \
          F
```

请把它转换成**森林**,画出森林的样子。(提示:先看根有没有右子树,有 → 说明是森林)

第二题,一棵一般树有 n 个节点,转换成二叉树后,它的**右指针空指针**有多少个?(提示:右指针代表"下一个兄弟",没有兄弟时就是空。想一下,什么样的节点在原一般树中是"最后一个孩子"——它在二叉树中右指针就为空)

第三题,以下哪组遍历序列**不能**由同一棵二叉树对应(即转换前后的对应关系): (A) 一般树先根 `A B C`,二叉树先序 `A B C` (B) 一般树后根 `C B A`,二叉树中序 `C B A` (C) 一般树后根 `A B C`,二叉树后序 `C B A` (D) 森林先序 `A B C`,二叉树先序 `A B C`

第四题,给定森林的先序遍历 `A B C D` 和中序遍历 `B A D C`,这片森林由几棵树组成?每棵树的根是什么?(提示:先还原二叉树,再拆成森林)

## 数据结构复习:哈夫曼树和哈夫曼编码

好,我们来学**哈夫曼树**(Huffman Tree),这是考研大题的**常客**,也是数据结构里少有的"纯应用型"算法——它直接解决了一个实际问题:**如何用最少的比特数对一段文本进行编码**。

本章特点:**概念不难,但手算过程容易出错;代码有一定套路,需要熟练**。我会按"问题引入 → 手工构造 → 代码实现 → 编码译码"的顺序讲。

---

### 一、问题引入:为什么需要哈夫曼编码?

假设你要传输一段文本,只包含 5 种字符 `{A, B, C, D, E}`,出现频率分别是 `{5, 9, 12, 13, 16}`(共 55 次)。

**方案一:等长编码**(定长码)。5 个字符需要至少 3 位二进制(2^3=8 ≥ 5):A=000, B=001, C=010, D=011, E=100。总比特数 = 55 × 3 = **165 位**。

**方案二:变长编码**。让**出现频率高的字符用短编码,低频字符用长编码**,整体就能省比特。这是哈夫曼编码的核心思想。

**但变长编码有个陷阱**:比如 A=0, B=01, C=1,那么比特流 "01" 既可以解码为 A+C,也可以解码为 B,产生歧义。

**解决方法是"前缀码"(Prefix Code)**:**任何字符的编码都不能是其他字符编码的前缀**。哈夫曼编码保证是前缀码,因此无歧义。

---

### 二、核心概念(必记)

**路径长度**:从根到某节点经过的**边数**。

**节点的带权路径长度(WPL of node)**:节点的权值 × 从根到它的路径长度。

**树的带权路径长度(WPL)**:所有**叶子节点**的带权路径长度之和。**注意只算叶子!**

**哈夫曼树(最优二叉树)**:在所有以给定权值为叶子的二叉树中,**WPL 最小**的那棵。

**公式**:WPL = Σ(wi × li),其中 wi 是第 i 个叶子的权值,li 是它的路径长度。

#### 一个 WPL 计算示例

对于权值 `{5, 9, 12, 13, 16}`,如果你构造出一棵二叉树:

```
          55
         /  \
       22    33
      / \   / \
     9   13 16 17
               / \
              5   12
```

叶子的路径长度:9→2, 13→2, 16→2, 5→3, 12→3。

WPL = 9×2 + 13×2 + 16×2 + 5×3 + 12×3 = 18 + 26 + 32 + 15 + 36 = **127**。

这是"一种"树,不一定最优。**哈夫曼算法就是构造 WPL 最小那棵的算法**。

---

### 三、哈夫曼算法(手工构造,必须熟练)

**算法流程**:

第一步,把 n 个权值看作 n 棵**只有根的单节点树**,放入集合 F。

第二步,从 F 中选出**权值最小的两棵树**作为左右子树,构造一棵新的二叉树,新根的权值是两棵子树根的**权值之和**。

第三步,从 F 中**删除这两棵子树**,**加入新合并出来的树**。

第四步,重复第二、三步,直到 F 中只剩**一棵树**——这就是哈夫曼树。

**关键规则**:每次合并两棵最小的。这是贪心算法的经典应用。

#### 手工构造示例(权值 {5, 9, 12, 13, 16})

**初始 F**:{5}, {9}, {12}, {13}, {16}

**第一次合并**:选最小的 5 和 9,合并成新树根为 14。F 变为:{12}, {13}, {14}, {16}。

```
   14
  /  \
 5    9
```

**第二次合并**:选最小的 12 和 13,合并成 25。F 变为:{14}, {16}, {25}。

```
   25
  /  \
 12   13
```

**第三次合并**:选最小的 14 和 16,合并成 30。F 变为:{25}, {30}。

```
   30
  /  \
 14   16
/  \
5   9
```

**第四次合并**:25 和 30 合并成 55。F 只剩 1 棵,结束。

最终哈夫曼树:

```
            55
          /    \
        25      30
       /  \    /  \
      12  13  14   16
              / \
             5   9
```

WPL = 5×4 + 9×4 + 12×2 + 13×2 + 16×2 = 20 + 36 + 24 + 26 + 32 = **138**。

嗯?这比前面手工凑的 127 还大?**不对,我前面那棵树不是合法的二叉树构造**——让我重新算前面那棵:叶子其实是 9, 13, 16, 5, 12 分别在路径长度 2, 2, 2, 3, 3 处,但这是我随便画的一棵树,**那棵树对应的合并顺序并不合法**,所以那个 127 是一个假象(不可达)。真正由哈夫曼算法构造出来的最小 WPL 是 **138**。

让我再验证一下哈夫曼树的 WPL:叶子 12 路径长度 2,叶子 13 路径长度 2,叶子 16 路径长度 2,叶子 5 路径长度 3(经 30→14→5),叶子 9 路径长度 3。

12×2 + 13×2 + 16×2 + 5×3 + 9×3 = 24 + 26 + 32 + 15 + 27 = **124**。

**等一下,让我再数一遍路径长度**。哈夫曼树如下:

```
            55            ← 层 0(根)
          /    \
        25      30        ← 层 1
       /  \    /  \
      12  13  14   16     ← 层 2
              / \
             5   9        ← 层 3
```

路径长度 = 从根到叶子的**边数** = 层数(根在第 0 层)。12、13、14、16 都在第 2 层,但 14 不是叶子!叶子是 12、13、16(第 2 层),5、9(第 3 层)。

WPL = 12×2 + 13×2 + 16×2 + 5×3 + 9×3 = 24 + 26 + 32 + 15 + 27 = **124**。

这才是正确答案。**哈夫曼算法保证 124 是所有可能构造中最小的 WPL**。

**一条重要规则**:哈夫曼算法每步产生的新根节点(内部节点)**不是叶子**,不参与 WPL 计算。只有原始权值对应的 n 个节点才是叶子。

---

### 四、哈夫曼编码(从哈夫曼树导出)

构造完哈夫曼树后,**为每条左分支标 0、每条右分支标 1**(或反过来,只要一致),从根到叶子路径上的 0/1 串就是该叶子字符的编码。

上面那棵哈夫曼树:

```
            55
          0/    \1
        25        30
       0/ \1     0/ \1
      12  13   14   16
              0/ \1
              5   9
```

编码:

- 12 → `00`
- 13 → `01`
- 16 → `11`
- 5 → `100`
- 9 → `101`

**这些编码都是前缀码**:没有任何一个是另一个的前缀(你可以自己验证)。

用这些编码传 55 次总比特数 = 12×2 + 13×2 + 16×2 + 5×3 + 9×3 = 124 位。对比等长编码的 165 位,**节省 25%**。这就是哈夫曼编码的价值。

---

### 五、项目文件组织

```
DataStructure/
└── Huffman/
    ├── Huffman.h
    ├── Huffman.cpp
    └── main.cpp
```

---

### 六、Huffman.h(结构体设计是难点)

教材经典的实现是**静态三叉链表**:用数组存哈夫曼树,每个节点记录 weight、parent、lchild、rchild 四个字段。为什么要有 parent?因为**编码时要从叶子回溯到根**,需要父指针。

cpp

```cpp
#pragma once

#define MAX_N 100                // 最多叶子数
#define MAX_NODES (2*MAX_N - 1)  // n 个叶子的哈夫曼树共 2n-1 个节点

// ========== 哈夫曼树节点(静态三叉链表)==========
typedef struct {
    int weight;                  // 权值
    int parent;                  // 父节点下标(0 表示无父节点,即根)
    int lchild;                  // 左孩子下标(0 表示无)
    int rchild;                  // 右孩子下标
} HTNode;

typedef HTNode HuffmanTree[MAX_NODES + 1];   // 下标 1..2n-1 使用,0 表示"空"

// 哈夫曼编码表:每个字符的编码是一个字符串(由 '0' '1' 组成)
typedef char* HuffmanCode[MAX_N + 1];        // 下标 1..n

// ========== 函数声明 ==========
void CreateHuffmanTree(HuffmanTree HT, int w[], int n);      // 构造哈夫曼树
void CreateHuffmanCode(HuffmanTree HT, HuffmanCode HC, int n); // 生成编码
int  WPL(HuffmanTree HT, int n);                             // 计算 WPL
```

**为什么用数组而不是动态指针?**

三个原因:其一,哈夫曼树节点数固定(**n 个叶子 → 正好 2n-1 个节点**,这是一个可证明的定理),适合静态分配。其二,用下标取代指针方便调试(可以直接打印整个数组看结构)。其三,这是严蔚敏教材的经典写法,考研必须掌握。

**一个小技巧**:数组下标从 1 开始用,下标 0 保留为"空"标志(类似于"NULL 指针")。这样判断"是否到达根"可以用 `parent == 0`。

---

### 七、Huffman.cpp 核心实现

#### 7.1 辅助函数:找权值最小的两个节点

cpp

```cpp
#include "Huffman.h"
#include <iostream>
#include <climits>
#include <cstring>
using namespace std;

// 在 HT[1..k] 中,parent==0 的节点里,找权值最小的两个,返回它们的下标 s1, s2
// s1 对应更小的权值
void Select(HuffmanTree HT, int k, int &s1, int &s2) {
    int min1 = INT_MAX, min2 = INT_MAX;
    s1 = s2 = 0;
    for (int i = 1; i <= k; i++) {
        if (HT[i].parent == 0) {              // 只考虑"尚未被合并"的节点
            if (HT[i].weight < min1) {
                min2 = min1; s2 = s1;
                min1 = HT[i].weight; s1 = i;
            } else if (HT[i].weight < min2) {
                min2 = HT[i].weight; s2 = i;
            }
        }
    }
}
```

这是哈夫曼算法的**关键辅助函数**。一个常见实现是用**最小堆(优先队列)**来做,可以把每次选取的时间从 O(n) 降到 O(log n),但对于初学者来说**线性查找足够清晰**,容易写对。考试写伪代码时也是这么写的。

#### 7.2 构造哈夫曼树(核心函数)

cpp

```cpp
void CreateHuffmanTree(HuffmanTree HT, int w[], int n) {
    if (n <= 1) return;
    int total = 2 * n - 1;                  // 节点总数

    // 初始化所有节点
    for (int i = 1; i <= total; i++) {
        HT[i].weight = 0;
        HT[i].parent = HT[i].lchild = HT[i].rchild = 0;
    }

    // 填入 n 个叶子的权值(下标 1..n)
    for (int i = 1; i <= n; i++) {
        HT[i].weight = w[i - 1];            // w 数组从 0 起
    }

    // 合并 n-1 次,生成下标 n+1 .. 2n-1 的内部节点
    for (int i = n + 1; i <= total; i++) {
        int s1, s2;
        Select(HT, i - 1, s1, s2);          // 在前 i-1 个节点中找最小的两个

        HT[s1].parent = i;
        HT[s2].parent = i;
        HT[i].lchild = s1;
        HT[i].rchild = s2;
        HT[i].weight = HT[s1].weight + HT[s2].weight;
    }
}
```

**这段代码完全按手工构造流程来写**。外层循环 `n-1` 次(从 n+1 到 2n-1),每次合并两个最小的节点。**合并后要更新三处**:两个子节点的 parent,新节点的 lchild、rchild、weight。

#### 7.3 生成哈夫曼编码

思路:对每个叶子节点,从它出发**沿 parent 向上走到根**,途中记录"我是父节点的左孩子还是右孩子",得到一串 0/1。**这串 0/1 是倒过来的**(从叶子到根),所以要反转才能得到正确的编码。

cpp

```cpp
void CreateHuffmanCode(HuffmanTree HT, HuffmanCode HC, int n) {
    char temp[MAX_N + 1];                   // 临时存当前叶子的编码(倒序)

    for (int i = 1; i <= n; i++) {          // 对每个叶子
        int pos = n;                        // 从 temp 末尾往前填(编码长度 < n)
        temp[pos--] = '\0';                 // 字符串结束符

        int c = i;                          // 当前节点
        int p = HT[i].parent;               // 父节点

        while (p != 0) {                    // 未到达根
            if (HT[p].lchild == c) {
                temp[pos--] = '0';          // 左分支 → 0
            } else {
                temp[pos--] = '1';          // 右分支 → 1
            }
            c = p;
            p = HT[p].parent;
        }

        // 把 temp[pos+1 .. n-1] 拷贝出来,作为第 i 个字符的编码
        int len = n - 1 - pos;
        HC[i] = new char[len + 1];
        strcpy(HC[i], &temp[pos + 1]);
    }
}
```

**难点在于"倒序填充"**:我们从 temp 的末尾往前填,这样**填完后从 pos+1 开始读就是正确顺序**。如果顺序填再反转,要写个 reverse 函数,反而啰嗦。这是一个值得学会的小技巧。

#### 7.4 计算 WPL

cpp

```cpp
int WPL(HuffmanTree HT, int n) {
    int wpl = 0;
    for (int i = 1; i <= n; i++) {          // 只算前 n 个(叶子)
        int len = 0;
        int p = HT[i].parent;
        while (p != 0) {
            len++;
            p = HT[p].parent;
        }
        wpl += HT[i].weight * len;
    }
    return wpl;
}
```

**注意只对 1..n(叶子)求和**,不要对内部节点求和。

---

### 八、测试代码(main.cpp)

cpp

```cpp
#include "Huffman.h"
#include <iostream>
using namespace std;

int main() {
    int w[] = {5, 9, 12, 13, 16};
    int n = 5;

    HuffmanTree HT;
    HuffmanCode HC;

    CreateHuffmanTree(HT, w, n);
    CreateHuffmanCode(HT, HC, n);

    cout << "哈夫曼树结构(下标 weight parent lchild rchild):" << endl;
    for (int i = 1; i <= 2 * n - 1; i++) {
        cout << i << "\t" << HT[i].weight << "\t"
             << HT[i].parent << "\t"
             << HT[i].lchild << "\t"
             << HT[i].rchild << endl;
    }

    cout << "\n哈夫曼编码:" << endl;
    for (int i = 1; i <= n; i++) {
        cout << "权值 " << HT[i].weight << " → " << HC[i] << endl;
    }

    cout << "\nWPL = " << WPL(HT, n) << endl;

    // 释放编码字符串
    for (int i = 1; i <= n; i++) delete[] HC[i];

    return 0;
}
```

预期输出(可能因为"选最小两个时遇到平手"的选择顺序不同而略有差异,但 WPL 必然是 124):

```
哈夫曼编码:
权值 5  → 100
权值 9  → 101
权值 12 → 00
权值 13 → 01
权值 16 → 11

WPL = 124
```

---

### 九、编码与译码流程

有了哈夫曼编码表后,**编码**(字符 → 比特流)就是简单查表拼接。**译码**(比特流 → 字符)稍复杂一些:

**译码规则**:从比特流的第一位开始,从哈夫曼树**根**出发,读到 0 走左、读到 1 走右;**走到叶子就输出一个字符,并回到根**重新开始下一个字符。

cpp

```cpp
void Decode(HuffmanTree HT, int n, const char *bitStream) {
    int root = 2 * n - 1;                   // 根节点下标
    int p = root;

    for (int i = 0; bitStream[i] != '\0'; i++) {
        if (bitStream[i] == '0') p = HT[p].lchild;
        else p = HT[p].rchild;

        if (HT[p].lchild == 0 && HT[p].rchild == 0) {  // 到达叶子
            cout << "权值 " << HT[p].weight << " ";
            p = root;                       // 回到根,继续解码
        }
    }
    cout << endl;
}
```

**译码的正确性依赖于前缀码性质**——只有前缀码才能保证"走到叶子立即能判断一个字符结束",不会有歧义。

---

### 十、几个易错点 & 考点总结

**考点一**:n 个叶子的哈夫曼树共有多少节点?答:**2n - 1** 个。推导:每次合并产生 1 个新节点,合并 n-1 次,加上原有 n 个叶子,共 2n-1。

**考点二**:哈夫曼树是否唯一?**不唯一**。如果出现权值相等的情况,选哪两个合并会影响树的形态,但 **WPL 相同**(都是最优值)。另外,左右子树交换也不改变 WPL。

**考点三**:哈夫曼树**没有度为 1 的节点**。推导:每次合并都产生一个有左右两个子树的新节点,不可能出现只有一个孩子的内部节点。

**考点四**:哈夫曼编码的长度不一定等于 ⌈log₂n⌉,可能**更短(高频字符)**也可能**更长(低频字符)**。

**考点五**:前缀码的判断——**所有字符都在叶子上,没有字符在内部节点**,就一定是前缀码。这是因为如果字符 A 的编码是字符 B 的前缀,意味着 A 对应的节点是 B 路径上的祖先,那 A 就是内部节点了。

---

### 十一、思考题(请作答)

第一题,给定权值 `{7, 5, 2, 4}`,请**手工构造**哈夫曼树,写出每个叶子的编码,并计算 WPL。

第二题,有 8 种字符,其使用频率分别是 `{1, 4, 5, 7, 10, 15, 20, 30}`,求哈夫曼编码的平均码长(即 WPL / 频率总和)。

第三题,如果有一棵二叉树,所有叶子都标记权值,但它**不是**哈夫曼树,它的 WPL 和真正的哈夫曼树的 WPL 相比,一定更大吗?还是可能相等?(提示:考虑权值相等的情况)

第四题,如果给定的权值全部相等(比如都是 1,共 n 个),构造出的哈夫曼树**长什么样**?它的 WPL 是多少?

第五题,能否对字符 `{A, B, C}` 给出编码 `{A=0, B=10, C=1}`,使它成为前缀码?如果不能,请说明理由。
