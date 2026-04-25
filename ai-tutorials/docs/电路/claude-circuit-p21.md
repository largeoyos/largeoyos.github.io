# 5.3 电路元件的相量形式

前面我们把"正弦波"翻译成了"相量"，把"微积分"翻译成了"乘除 jω"。现在要做一件事：把电阻、电感、电容这三个基本元件的 VCR，也**全部翻译成相量形式**。

翻译完之后你会看到一个奇妙的结果：**三种完全不同的元件，将拥有同一种数学形式**。这就是相量法的真正威力。

---

### 一、电阻 R 的相量形式

时域 VCR：u=Riu = Ri u=Ri

假设 i(t)=Imcos⁡(ωt+φ)i(t) = I_m \cos(\omega t + \varphi) i(t)=Im​cos(ωt+φ)，则 u(t)=RImcos⁡(ωt+φ)u(t) = RI_m \cos(\omega t + \varphi) u(t)=RIm​cos(ωt+φ)

**观察**：电压和电流**同频率、同相位**，幅值差 R 倍。

转成相量：

U˙=RI˙\boxed{\dot{U} = R\dot{I}}U˙=RI˙​

**这就是相量形式的"欧姆定律"**，和时域形式一模一样——电阻是最朴素的，不改变相位。

**相量图**（复平面上表示）：

```
         Im
          ↑
          │     
          │        → U = RI  (同方向，U 更长)
          │     
          │      → I
          │     
        0 ┼────────────→  Re
```

U˙\dot{U} U˙ 和 I˙\dot{I} I˙ 是**同向**的两个复向量。

---

### 二、电感 L 的相量形式 ⭐

时域 VCR：u=Ldidtu = L \dfrac{di}{dt} u=Ldtdi​

用我们刚学的"微分 → 乘 jω"规则：

U˙=jωL⋅I˙\boxed{\dot{U} = j\omega L \cdot \dot{I}}U˙=jωL⋅I˙​

**这里面藏着两个重要信息**，请你仔细品：

---

**请你先思考**：jωLj\omega L jωL 是一个复数，它的**模**和**辐角**分别是什么？它对 I˙\dot{I} I˙ 做了什么"操作"？

---

答案：

- **模**：∣jωL∣=ωL|j\omega L| = \omega L ∣jωL∣=ωL
- **辐角**：∠(jωL)=90°\angle(j\omega L) = 90° ∠(jωL)=90°（因为 j=1∠90°j = 1\angle 90° j=1∠90°）

所以 U˙=(ωL)∠90°⋅I˙\dot{U} = (\omega L)\angle 90° \cdot \dot{I} U˙=(ωL)∠90°⋅I˙，意思是：

> **对电感：电压的幅值 = 电流幅值 × ωL；电压的相位比电流超前 90°**

**这正是电感的物理本质**！电感"反抗电流变化"的特性，在相量图上就是"电压领先电流 90°"。

**相量图**：

```
         Im
          ↑
          │        → U = jωL·I  (垂直方向，超前 90°)
          │        │
          │        │
          │        │
          │     → I
        0 ┼────────────→  Re
```

**记忆口诀**：电感"**电压超前**"。

---

### 三、电容 C 的相量形式 ⭐

时域 VCR：i=Cdudti = C \dfrac{du}{dt} i=Cdtdu​

相量化：I˙=jωC⋅U˙\dot{I} = j\omega C \cdot \dot{U} I˙=jωC⋅U˙

整理成 "电压 = ? × 电流" 的形式：

U˙=1jωCI˙=−jωCI˙\boxed{\dot{U} = \frac{1}{j\omega C} \dot{I} = \frac{-j}{\omega C}\dot{I}}U˙=jωC1​I˙=ωC−j​I˙​

（用到 1/j=−j1/j = -j 1/j=−j，因为 j⋅(−j)=−j2=1j \cdot (-j) = -j^2 = 1 j⋅(−j)=−j2=1）

**分析**：

- **模**：∣1jωC∣=1ωC\left|\dfrac{1}{j\omega C}\right| = \dfrac{1}{\omega C} ​jωC1​​=ωC1​
- **辐角**：∠(1/jωC)=−90°\angle(1/j\omega C) = -90° ∠(1/jωC)=−90°

所以：

> **对电容：电压幅值 = 电流幅值 × 1/(ωC)；电压相位比电流滞后 90°**

**相量图**：

```
         Im
          ↑
          │     → I
          │     
        0 ┼────────────→  Re
          │     │
          │     │
          │     │
          │     ↓ U  (超后 90°)
```

**记忆口诀**：电容"**电流超前**"。

---

### 四、三个元件对比总结

请务必把下面这张表**刻在脑子里**：

|元件|时域 VCR|相量 VCR|U˙\dot{U} U˙ 与 I˙\dot{I} I˙ 的相位关系|
|---|---|---|---|
|电阻 R|u=Riu = Ri u=Ri|U˙=RI˙\dot{U} = R\dot{I} U˙=RI˙|同相|
|电感 L|u=L di/dtu = L \, di/dt u=Ldi/dt|U˙=jωL I˙\dot{U} = j\omega L \, \dot{I} U˙=jωLI˙|U˙\dot{U} U˙ 超前 I˙\dot{I} I˙ 90°|
|电容 C|i=C du/dti = C \, du/dt i=Cdu/dt|U˙=1jωCI˙\dot{U} = \dfrac{1}{j\omega C} \dot{I} U˙=jωC1​I˙|U˙\dot{U} U˙ 滞后 I˙\dot{I} I˙ 90°|

---

**一个非常关键的观察**：三个元件的相量 VCR，**都长得像欧姆定律**！

U˙=Z⋅I˙\dot{U} = Z \cdot \dot{I}U˙=Z⋅I˙

只是那个"Z"对不同元件不同：

- 电阻：Z=RZ = R Z=R
- 电感：Z=jωLZ = j\omega L Z=jωL
- 电容：Z=1/(jωC)Z = 1/(j\omega C) Z=1/(jωC)

这个 Z 就叫**阻抗**——下一节的主角。

---