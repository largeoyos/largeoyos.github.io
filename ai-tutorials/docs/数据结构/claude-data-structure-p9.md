# 数据结构复习:树、森林与二叉树的相互转换

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

---

### 十一、下一步方向

转换章节啃完,你的"树族谱"就完整了:一般树、森林、二叉树三者的等价关系已经建立。接下来可以选:

**(A)** 学**二叉搜索树 BST**(插入、查找、重点是删除的三种情况)。**(B)** 学**哈夫曼树和哈夫曼编码**(考研大题高频,构造过程是必会的)。**(C)** 学**堆和堆排序**(完全二叉树的数组存储应用)。**(D)** 回到前面还没做完的**顺序表**章节(你最初列的清单里还有这一项)。**(E)** 先答思考题再继续。

告诉我你想走哪个方向。