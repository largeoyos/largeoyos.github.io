# 5.2 相量法基础 ⭐（本章核心中的核心）

现在我们要攻克"**复数表示波**"这个你的痛点。

**请你跟着我，我要慢慢把这件事讲清楚。** 这部分不着急，一步都不要跳。

---

### 一、先说说"为什么需要复数"—— 动机

假设现在有一个 RLC 串联电路，接到正弦电源 us=Umcos⁡ωtu_s = U_m\cos\omega t us​=Um​cosωt。用 KVL 列方程：

us=Ri+Ldidt+1C∫i dtu_s = Ri + L\frac{di}{dt} + \frac{1}{C}\int i \, dtus​=Ri+Ldtdi​+C1​∫idt

这是一个**微分积分方程**。要求 i(t)i(t) i(t)，得解微分方程——很麻烦。

**有没有办法把这种方程变成普通的代数方程？**

有！这就是**相量法**的目的。它把**微积分方程**变成**代数方程**，代价是：**我们要用复数来表示正弦波**。

---

### 二、预备知识：复数的三种形式

快速复习一下（你说学过复数，应该不陌生）：

**代数形式**：A=a+jbA = a + jb A=a+jb（电路里用 j 不用 i，因为 i 被电流占了）

**几何形式**：AA A 是复平面上的一个点（或向量）

```
        Im
         ↑
         │      • A = a + jb
       b ┤     ╱
         │    ╱
         │   ╱
         │  ╱
         │ ╱
         │╱
       0 ┼─────────→  Re
               a
```

**极坐标形式（模角式）**：A=∣A∣∠θA = |A| \angle \theta A=∣A∣∠θ

- 模 ∣A∣=a2+b2|A| = \sqrt{a^2 + b^2} ∣A∣=a2+b2​
- 辐角 θ=arctan⁡(b/a)\theta = \arctan(b/a) θ=arctan(b/a)

**指数形式**（欧拉公式）：

A=∣A∣ejθA = |A| e^{j\theta}A=∣A∣ejθ

#### 欧拉公式（⭐ 本章理论基石）

ejθ=cos⁡θ+jsin⁡θ\boxed{e^{j\theta} = \cos\theta + j\sin\theta}ejθ=cosθ+jsinθ​

这个公式是**连接复数和三角函数的桥梁**。以后我们会反复用它。

---

### 三、把正弦波"升维"到复数（核心一跃）

现在最关键的一步来了。**请集中注意力**。

#### 第 1 步：观察一个奇妙的等式

考虑这个复指数：

ejωte^{j\omega t}ejωt

由欧拉公式：ejωt=cos⁡(ωt)+jsin⁡(ωt)e^{j\omega t} = \cos(\omega t) + j\sin(\omega t) ejωt=cos(ωt)+jsin(ωt)

取它的**实部**：

Re[ejωt]=cos⁡(ωt)\text{Re}\left[e^{j\omega t}\right] = \cos(\omega t)Re[ejωt]=cos(ωt)

**发现了吗**：一个正弦波 cos⁡(ωt)\cos(\omega t) cos(ωt)，可以写成一个旋转的复指数 ejωte^{j\omega t} ejωt 的**实部**！

#### 第 2 步：一般的正弦波

对 i(t)=Imcos⁡(ωt+φ)i(t) = I_m \cos(\omega t + \varphi) i(t)=Im​cos(ωt+φ)：

i(t)=ImRe[ej(ωt+φ)]=Re[Imejφ⋅ejωt]i(t) = I_m \text{Re}\left[e^{j(\omega t + \varphi)}\right] = \text{Re}\left[I_m e^{j\varphi} \cdot e^{j\omega t}\right]i(t)=Im​Re[ej(ωt+φ)]=Re[Im​ejφ⋅ejωt]

中间的 ImejφI_m e^{j\varphi} Im​ejφ 是一个**与时间无关**的常数（复数）——它只含幅值信息 ImI_m Im​ 和相位信息 φ\varphi φ。

ejωte^{j\omega t} ejωt 这一部分包含"时间"和"角频率"——但在同频率的电路里，它对每个量都一样！

#### 第 3 步：相量的定义

既然在同频率电路里，ejωte^{j\omega t} ejωt 对所有量都一样，我们就**把它"省略"**，只保留含信息的那个复数常数——这就叫**相量**（phasor）：

I˙=Imejφ=Im∠φ\boxed{\dot{I} = I_m e^{j\varphi} = I_m \angle \varphi}I˙=Im​ejφ=Im​∠φ​

> **相量**是一个**复数**，含有正弦波的幅值和初相信息。频率 ω\omega ω 不在相量里（因为同电路里都一样）。

顶上的小点（或箭头）表示"这是相量，不是普通复数"。

#### 第 4 步：有效值相量

工程上常用**有效值相量**（把幅值换成有效值）：

I˙=I∠φ=Im2∠φ\dot{I} = I \angle \varphi = \frac{I_m}{\sqrt{2}} \angle \varphiI˙=I∠φ=2​Im​​∠φ

本课程之后**默认用有效值相量**，除非特别说明。

---

### 四、相量的物理图像：旋转的向量

想象复平面上有一个向量，长度 ImI_m Im​，初始角度 φ\varphi φ。让它以角速度 ω\omega ω **逆时针旋转**：

```
   时刻 t=0                 时刻 t>0（转了 ωt）
   
      Im                        Im
       ↑                          ↑
       │ • I_m∠φ                  │    •←旋转向量
       │╱                         │   ╱
       │                          │  ╱
     0 ┼─→  Re                  0 ┼─────→ Re
                                  │
                                  │ 投影到实轴就是 i(t)
                                  ↓
                                cos(ωt+φ)
```

**关键图像**：

- 旋转向量的**实部投影** = 时域正弦波
- 向量的**长度** = 正弦波的幅值
- 向量**当前的辐角** = 当前的相位（ωt+φ\omega t + \varphi ωt+φ）

**相量就是"抓拍" t=0 时刻的那个向量**。因为所有量都以同样的 ω\omega ω 旋转，它们的**相对关系**不变——抓拍一瞬间就够了。

---

### 五、相量法为什么能"化微积分为代数"？

这是相量法的威力所在。我现在演示给你看。

#### 关键技巧：微分 → 乘 jω

假设 i(t)=Imcos⁡(ωt+φ)i(t) = I_m \cos(\omega t + \varphi) i(t)=Im​cos(ωt+φ)，其相量 I˙=Im∠φ\dot{I} = I_m \angle \varphi I˙=Im​∠φ。

求导：

didt=−ωImsin⁡(ωt+φ)=ωImcos⁡(ωt+φ+90°)\frac{di}{dt} = -\omega I_m \sin(\omega t + \varphi) = \omega I_m \cos(\omega t + \varphi + 90°)dtdi​=−ωIm​sin(ωt+φ)=ωIm​cos(ωt+φ+90°)

这个导数对应的相量是：ωIm∠(φ+90°)\omega I_m \angle(\varphi + 90°) ωIm​∠(φ+90°)

而 ωIm∠(φ+90°)=Im∠φ⋅ω∠90°=I˙⋅jω\omega I_m \angle(\varphi + 90°) = I_m \angle\varphi \cdot \omega \angle 90° = \dot{I} \cdot j\omega ωIm​∠(φ+90°)=Im​∠φ⋅ω∠90°=I˙⋅jω

（因为 ∠90°=cos⁡90°+jsin⁡90°=j\angle 90° = \cos 90° + j\sin 90° = j ∠90°=cos90°+jsin90°=j）

**结论**：

didt⟷jωI˙\boxed{\frac{di}{dt} \quad \longleftrightarrow \quad j\omega \dot{I}}dtdi​⟷jωI˙​

**时域求导 = 相量域乘 jω**！

#### 类似地：积分 → 除以 jω

∫i dt⟷I˙jω\boxed{\int i \, dt \quad \longleftrightarrow \quad \frac{\dot{I}}{j\omega}}∫idt⟷jωI˙​​

#### 这意味着什么？

回到最开始的 RLC 串联微积分方程：

us=Ri+Ldidt+1C∫i dtu_s = Ri + L\frac{di}{dt} + \frac{1}{C}\int i \, dtus​=Ri+Ldtdi​+C1​∫idt

**相量化**（每一项替换）：

U˙s=RI˙+jωLI˙+1jωCI˙\dot{U}_s = R\dot{I} + j\omega L \dot{I} + \frac{1}{j\omega C}\dot{I}U˙s​=RI˙+jωLI˙+jωC1​I˙

提取 I˙\dot{I} I˙：

U˙s=[R+jωL+1jωC]I˙\dot{U}_s = \left[R + j\omega L + \frac{1}{j\omega C}\right]\dot{I}U˙s​=[R+jωL+jωC1​]I˙

**这是一个代数方程！** 没有求导、没有积分。方括号里那一坨复数叫"阻抗"（下一节详细讲）。

---

### 六、消化一下——你需要记住的核心

现在停下来，把这几件事"钉"在脑子里：

|时域|⟷|相量域|
|---|---|---|
|i(t)=Imcos⁡(ωt+φ)i(t) = I_m\cos(\omega t + \varphi) i(t)=Im​cos(ωt+φ)||I˙=I∠φ\dot{I} = I\angle\varphi I˙=I∠φ（有效值）|
|didt\dfrac{di}{dt} dtdi​||jωI˙j\omega \dot{I} jωI˙|
|∫i dt\int i \, dt ∫idt||I˙jω\dfrac{\dot{I}}{j\omega} jωI˙​|
|微分方程||代数方程|

**整个相量法的"交易"**：

> 我用**复数**这个更复杂的数，换来了**代数方程**这个更简单的方程。

对于正弦稳态分析，这笔交易**非常划算**。

---

### 🎯 检验你跨过这个坎了吗

请你用自己的话回答（不查书不看上面）：

1. **相量是什么？** 它是实数还是复数？为什么用它能表示正弦波？
2. **为什么** "时域求导" 对应 "相量乘 jω"？不用严谨推导，说出关键理由即可。
3. 已知一个电流 i(t)=52cos⁡(100t+30°)i(t) = 5\sqrt{2}\cos(100t + 30°) i(t)=52​cos(100t+30°) A，写出它的**有效值相量**（给出模和辐角）。

---

这三题答出来，说明你真的跨过了"复数表示波"这个坎。答完我们就继续讲 **5.3 元件的相量形式**、**5.4 阻抗与导纳**。如果答不上来，告诉我卡在哪，我从那里重讲。