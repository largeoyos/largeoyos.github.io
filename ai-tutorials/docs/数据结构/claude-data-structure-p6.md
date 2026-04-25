# 数据结构复习:二叉树专题   
 
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

---

### 十一、下一步

下一次对话我们会讲:

**(A)** 线索二叉树(中序线索化及其遍历,考研高频);**(B)** 二叉搜索树 BST(插入、查找、删除,尤其删除的三种情况);**(C)** 二叉树进阶题(构造二叉树 from 前序+中序、判断对称、最近公共祖先等)。

请告诉我你想先走哪个方向,或者先回答思考题,我帮你批改。