# DCVC 参考文献与阅读覆盖核查

本表保存论文中可核实的书目信息及结构覆盖范围。参考条目保持作者所列版本与年份，不将书目中每篇文献都标记为已全文精读。正文和补充材料的引用编号独立。PDF 抽取后的排版换行合并为单行；原始 PDF 仍是拼写与排版核对依据。

## 结构覆盖

| 材料位置 | 覆盖内容 | 讲解文件 |
| --- | --- | --- |
| 正文第 1 页 | 标题、作者、摘要、Introduction 第 1 至 2 段 | [第 1 轮](DCVC_精读01_标题摘要与引言.md) |
| 正文第 2 页 | Figure 1、引言其余两段、贡献导语及四项列表 | [第 2 轮](DCVC_精读02_Figure1与引言贡献.md) |
| 正文第 3 页 | Section 2 三段、Section 3 导语、Section 3.1 开始 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 4 至 5 页 | 公式 1 的说明、公式 2/3、Figure 2/3、特征和新内容的分析、熵模型过渡 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 5 至 6 页 | Section 3.2，公式 4/5，Figure 4，三种先验与快速变体 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 6 页 | Section 3.3 两段与公式 6 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 7 页 | Section 3.4、公式 7、Section 4.1 的数据与测试设置 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 7 至 8 页 | Section 4.2，Table 1、Figures 5/6、复杂度 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 8 至 9 页 | Section 4.3，Tables 2/3，两类消融 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 9 至 10 页 | Section 4.4 跨页段落、Figure 7 | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 10 页 | Section 5 三段，正文无独立 Conclusion | [第 3 部分](DCVC_精读03_正文方法与实验.md) |
| 正文第 11 至 12 页 | 40 项书目保留，关键工作的关系分析 | 本文件与第 3 部分 |
| 补充第 1 至 2 页 | 开篇、Section 1 四组结构说明、Figures 1/2/3 | [第 4 部分](DCVC_精读04_补充材料与总结.md) |
| 补充第 2 至 3 页 | Section 2 全部段落、Table 1 与四阶段训练 | [第 4 部分](DCVC_精读04_补充材料与总结.md) |
| 补充第 3 页 | Section 3 数据来源、脚注、I 帧档位、命令参数、GOP 与帧数 | [第 4 部分](DCVC_精读04_补充材料与总结.md) |
| 补充第 3 至 5 页 | Section 4 跨页内容与 Figures 4/5 | [第 4 部分](DCVC_精读04_补充材料与总结.md) |
| 补充第 5 至 6 页 | Section 5，Figures 6/7，维度与 MEMC 消融 | [第 4 部分](DCVC_精读04_补充材料与总结.md) |
| 补充第 6 至 7 页 | Section 6 两段、Figure 8、15 项书目 | 本文件与第 4 部分 |

页码为对应 PDF 文件中的页面序号。Figure/Table 2 个编号体系已区分；全部图片均由相应原 PDF 裁切，未重绘。正文图表出现在排版中较早位置时，按首次实质讨论处讲解，未将浮动位置误算为段落顺序。

## 关键参考工作的作用

- 正文 [3,4]：DVC/DVCPro，是框架与实验的直接参照。
- 正文 [12,15,16,17]：理解条件编码、解码端信息和显式模式选择的先前研究；交叉核查范围见第 3 部分，未独立复现实验结果。
- 正文 [13,14,19,20]：图像压缩、GDN、超先验、自回归和 I 帧模型的来源。
- 正文 [30,40]：信息论与 BD-Rate 指标基础；正文 [30] 列出的是其所用重印版本的书目信息。
- 正文 [31,32,33,34,35,36,38,39]：实现、光流、数据、测试条件、工具与公开结果来源；本次未将所有数据、模型或工具逐一下载运行。
- 补充 [15]：未来方向中的 Transformer 综述，不是本模型已经采用 Transformer 的证据。

## 正文参考文献 40 项

[1] B. Girod, E. G. Steinbach, and N. Faerber, “Comparison of the H. 263 and H. 261 video compression standards,” in Standards and Common Interfaces for Video Information Systems: A Critical Review, 1995.

[2] B. Bross, J. Chen, J.-R. Ohm, G. J. Sullivan, and Y.-K. Wang, “Developments in international video coding standardization after AVC, with an overview of Versatile Video Coding (VVC),” Proceedings of the IEEE, 2021.

[3] G. Lu, W. Ouyang, D. Xu, X. Zhang, C. Cai, and Z. Gao, “DVC: an end-to-end deep video compression framework,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, pp. 11006–11015, 2019.

[4] G. Lu, X. Zhang, W. Ouyang, L. Chen, Z. Gao, and D. Xu, “An end-to-end learning framework for video compression,” IEEE transactions on pattern analysis and machine intelligence, 2020.

[5] G. Lu, C. Cai, X. Zhang, L. Chen, W. Ouyang, D. Xu, and Z. Gao, “Content adaptive and error propagation aware deep video compression,” in European Conference on Computer Vision, pp. 456–472, Springer, 2020.

[6] R. Yang, F. Mentzer, L. V. Gool, and R. Timofte, “Learning for video compression with hierarchical quality and recurrent enhancement,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, 2020.

[7] J. Lin, D. Liu, H. Li, and F. Wu, “M-LVC: multiple frames prediction for learned video compression,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, 2020.

[8] A. Djelouah, J. Campos, S. Schaub-Meyer, and C. Schroers, “Neural inter-frame compression for video coding,” in Proceedings of the IEEE/CVF International Conference on Computer Vision (ICCV), October 2019.

[9] E. Agustsson, D. Minnen, N. Johnston, J. Balle, S. J. Hwang, and G. Toderici, “Scale-space flow for end-to-end optimized video compression,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, pp. 8503–8512, 2020.

[10] C.-Y. Wu, N. Singhal, and P. Krähenbühl, “Video compression through image interpolation,” in ECCV, 2018.

[11] R. Yang, Y. Yang, J. Marino, and S. Mandt, “Hierarchical autoregressive modeling for neural video compression,” 9th International Conference on Learning Representations, ICLR, 2021.

[12] T. Ladune, P. Philippe, W. Hamidouche, L. Zhang, and O. Déforges, “Optical flow and mode selection for learning-based video coding,” in 22nd IEEE International Workshop on Multimedia Signal Processing, 2020.

[13] J. Ballé, D. Minnen, S. Singh, S. J. Hwang, and N. Johnston, “Variational image compression with a scale hyperprior,” 6th International Conference on Learning Representations, ICLR, 2018.

[14] D. Minnen, J. Ballé, and G. Toderici, “Joint autoregressive and hierarchical priors for learned image compression,” arXiv preprint arXiv:1809.02736, 2018.

[15] J. Liu, S. Wang, W.-C. Ma, M. Shah, R. Hu, P. Dhawan, and R. Urtasun, “Conditional entropy coding for efficient video compression,” arXiv preprint arXiv:2008.09180, 2020.

[16] O. Rippel, S. Nair, C. Lew, S. Branson, A. G. Anderson, and L. Bourdev, “Learned video compression,” in Proceedings of the IEEE/CVF International Conference on Computer Vision, pp. 3454–3463, 2019.

[17] T. Ladune, P. Philippe, W. Hamidouche, L. Zhang, and O. Déforges, “Conditional coding for flexible learned video compression,” in Neural Compression: From Information Theory to Applications – Workshop @ ICLR, 2021.

[18] L. Theis, W. Shi, A. Cunningham, and F. Huszár, “Lossy image compression with compressive autoen- coders,” arXiv preprint arXiv:1703.00395, 2017.

[19] J. Ballé, V. Laparra, and E. P. Simoncelli, “End-to-end optimized image compression,” arXiv preprint arXiv:1611.01704, 2017.

[20] Z. Cheng, H. Sun, M. Takeuchi, and J. Katto, “Learned image compression with discretized gaussian mixture likelihoods and attention modules,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, pp. 7939–7948, 2020.

[21] G. Toderici, S. M. O’Malley, S. J. Hwang, D. Vincent, D. Minnen, S. Baluja, M. Covell, and R. Sukthankar, “Variable rate image compression with recurrent neural networks,” arXiv preprint arXiv:1511.06085, 2015.

[22] G. Toderici, D. Vincent, N. Johnston, S. Jin Hwang, D. Minnen, J. Shor, and M. Covell, “Full resolution image compression with recurrent neural networks,” in Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition, pp. 5306–5314, 2017.

[23] N. Johnston, D. Vincent, D. Minnen, M. Covell, S. Singh, T. Chinen, S. J. Hwang, J. Shor, and G. Toderici, “Improved lossy image compression with priming and spatially adaptive bit rates for recurrent networks,” in Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition, pp. 4385–4393, 2018.

[24] J. Pessoa, H. Aidos, P. Tomás, and M. A. Figueiredo, “End-to-end learning of video compression using spatio-temporal autoencoders,” in 2020 IEEE Workshop on Signal Processing Systems (SiPS), pp. 1–6, IEEE, 2020.

[25] A. Habibian, T. v. Rozendaal, J. M. Tomczak, and T. S. Cohen, “Video compression with rate-distortion autoencoders,” in Proceedings of the IEEE/CVF International Conference on Computer Vision, pp. 7033– 7042, 2019.

[26] Z. Hu, Z. Chen, D. Xu, G. Lu, W. Ouyang, and S. Gu, “Improving deep video compression by resolution- adaptive flow coding,” in European Conference on Computer Vision, pp. 193–209, Springer, 2020.

[27] W. Bao, W.-S. Lai, C. Ma, X. Zhang, Z. Gao, and M.-H. Yang, “Depth-aware video frame interpolation,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, pp. 3703–3712, 2019.

[28] S. Niklaus and F. Liu, “Softmax splatting for video frame interpolation,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, pp. 5437–5446, 2020.

[29] H. Wang, W. Gan, S. Hu, J. Y. Lin, L. Jin, L. Song, P. Wang, I. Katsavounidis, A. Aaron, and C.-C. J. Kuo, “MCL-JCV: a JND-based H. 264/AVC video quality assessment dataset,” in 2016 IEEE International Conference on Image Processing (ICIP), pp. 1509–1513, IEEE, 2016.

[30] C. E. Shannon, “A mathematical theory of communication,” ACM SIGMOBILE mobile computing and communications review, vol. 5, no. 1, pp. 3–55, 2001.

[31] “PyTorchVideoCompression.” https://github.com/ZhihaoHu/PyTorchVideoCompression. On- line; accessed 12 April 2021.

[32] A. Ranjan and M. J. Black, “Optical flow estimation using a spatial pyramid network,” in Proceedings of the IEEE conference on computer vision and pattern recognition, pp. 4161–4170, 2017.

[33] T. Xue, B. Chen, J. Wu, D. Wei, and W. T. Freeman, “Video enhancement with task-oriented flow,” International Journal of Computer Vision (IJCV), vol. 127, no. 8, pp. 1106–1125, 2019.

[34] F. Bossen et al., “Common test conditions and software reference configurations,” in JCTVC-L1100, vol. 12, 2013.

[35] “Ultra video group test sequences.” http://ultravideo.cs.tut.fi. Online; accessed 12 April 2021.

[36] J. Bégaint, F. Racapé, S. Feltman, and A. Pushparaja, “CompressAI: a PyTorch library and evaluation platform for end-to-end compression research,” arXiv preprint arXiv:2011.03029, 2020.

[37] D. Xu, G. Lu, R. Yang, and R. Timofte, “Learned image and video compression with deep neural networks,” in 2020 IEEE International Conference on Visual Communications and Image Processing, VCIP 2020, Macau, China, December 1-4, 2020, pp. 1–3, IEEE, 2020.

[38] D. Xu, G. Lu, R. Yang, and R. Timofte, “Tutorial: Learned image and video compression with deep neural networks.” https://drive.google.com/file/d/162omgk0CmHPBj4J7vWsNr8N9SPn5j97F/ view. Online; accessed 12 April 2021.

[39] “Ffmpeg.” https://www.ffmpeg.org/. Online; accessed 12 April 2021.

[40] G. Bjontegaard, “Calculation of average PSNR differences between RD-curves,” VCEG-M33, 2001.

## 补充材料参考文献 15 项

[1] J. Ballé, V. Laparra, and E. P. Simoncelli, “End-to-end optimized image compression,” arXiv preprint arXiv:1611.01704, 2017.

[2] D. Minnen, J. Ballé, and G. Toderici, “Joint autoregressive and hierarchical priors for learned image compression,” arXiv preprint arXiv:1809.02736, 2018.

[3] A. Ranjan and M. J. Black, “Optical flow estimation using a spatial pyramid network,” in Proceedings of the IEEE conference on computer vision and pattern recognition, pp. 4161–4170, 2017.

[4] G. Lu, X. Zhang, W. Ouyang, L. Chen, Z. Gao, and D. Xu, “An end-to-end learning framework for video compression,” IEEE transactions on pattern analysis and machine intelligence, 2020.

[5] J. Lin, D. Liu, H. Li, and F. Wu, “M-LVC: multiple frames prediction for learned video compression,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, 2020.

[6] “PyTorchVideoCompression.” https://github.com/ZhihaoHu/PyTorchVideoCompression. On- line; accessed 12 April 2021.

[7] T. Xue, B. Chen, J. Wu, D. Wei, and W. T. Freeman, “Video enhancement with task-oriented flow,” International Journal of Computer Vision (IJCV), vol. 127, no. 8, pp. 1106–1125, 2019.

[8] H. Wang, W. Gan, S. Hu, J. Y. Lin, L. Jin, L. Song, P. Wang, I. Katsavounidis, A. Aaron, and C.-C. J. Kuo, “MCL-JCV: a JND-based H. 264/AVC video quality assessment dataset,” in 2016 IEEE International Conference on Image Processing (ICIP), pp. 1509–1513, IEEE, 2016.

[9] “Ultra video group test sequences.” http://ultravideo.cs.tut.fi. Online; accessed 12 April 2021.

[10] F. Bossen et al., “Common test conditions and software reference configurations,” in JCTVC-L1100, vol. 12, 2013.

[11] J. Bégaint, F. Racapé, S. Feltman, and A. Pushparaja, “CompressAI: a PyTorch library and evaluation platform for end-to-end compression research,” arXiv preprint arXiv:2011.03029, 2020.

[12] Z. Cheng, H. Sun, M. Takeuchi, and J. Katto, “Learned image compression with discretized gaussian mixture likelihoods and attention modules,” in Proceedings of the IEEE/CVF Conference on Computer Vision and Pattern Recognition, pp. 7939–7948, 2020.

[13] J. Ballé, D. Minnen, S. Singh, S. J. Hwang, and N. Johnston, “Variational image compression with a scale hyperprior,” 6th International Conference on Learning Representations, ICLR, 2018.

[14] “Ffmpeg.” https://www.ffmpeg.org/. Online; accessed 12 April 2021.

[15] S. Khan, M. Naseer, M. Hayat, S. W. Zamir, F. S. Khan, and M. Shah, “Transformers in vision: A survey,” arXiv preprint arXiv:2101.01169, 2021.
