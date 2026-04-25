# Claude responded: 好，我直接把那道题讲清楚，然后进入第二章。

好，我直接把那道题讲清楚，然后进入第二章。

---

### 刚才那道题的解答

**关键突破口**：右边 3Ω 电阻**开路**（另一端悬空），所以通过 3Ω 的电流为 0，3Ω 上压降为 0。这意味着：

Ux=UCCVSU_x = U_{CCVS}Ux​=UCCVS​

**左回路 KVL**（12V → 2Ω → CCVS → 地，顺时针绕）：

12−2I−UCCVS=012 - 2I - U_{CCVS} = 012−2I−UCCVS​=0

代入受控源约束 UCCVS=5IU_{CCVS} = 5I UCCVS​=5I：

12−2I−5I=0  ⟹  I=127≈1.71A12 - 2I - 5I = 0 \implies I = \frac{12}{7} \approx 1.71 \text{A}12−2I−5I=0⟹I=712​≈1.71A

所以：

- I=127I = \frac{12}{7} I=712​ A ≈ 1.71 A
- UCCVS=5I=607U_{CCVS} = 5I = \frac{60}{7} UCCVS​=5I=760​ V ≈ 8.57 V
- Ux=UCCVS=607U_x = U_{CCVS} = \frac{60}{7} Ux​=UCCVS​=760​ V ≈ 8.57 V

**核心思路**：受控源的约束方程 UCCVS=5IU_{CCVS} = 5I UCCVS​=5I 和回路 KVL 方程**联立**，就能解出来。这就是含受控源电路的标准处理方法。

---