window.LITERATURE_DATA = {
  "meta": {
    "title": "神经视频编码 · 文献档案",
    "updated": "2026-10-29T04:24:57.035302+00:00",
    "total": 138,
    "newCount": 0,
    "fields": [
      {
        "id": "01",
        "label": "概率模型与量化",
        "short": "熵模型",
        "description": "潜变量分布、侧信息、量化与解码依赖",
        "color": "#b76b32"
      },
      {
        "id": "02",
        "label": "表示变换与时域参考",
        "short": "表示与参考",
        "description": "像素、特征、运动与时间条件放在哪里",
        "color": "#267b72"
      },
      {
        "id": "03",
        "label": "实时执行与硬件",
        "short": "实时系统",
        "description": "完整编解码延迟、并行度与硬件成本",
        "color": "#9a6c50"
      },
      {
        "id": "04",
        "label": "参考失效与混合编码",
        "short": "参考失效",
        "description": "场景切换、误差传播与条件可靠性",
        "color": "#a85140"
      },
      {
        "id": "05",
        "label": "双向结构与时间调度",
        "short": "双向编码",
        "description": "未来参考、层次结构和等待延迟",
        "color": "#84714a"
      },
      {
        "id": "06",
        "label": "内容适配与编码端搜索",
        "short": "编码端搜索",
        "description": "潜变量或参数优化的收益与总成本",
        "color": "#4d8276"
      },
      {
        "id": "07",
        "label": "隐式表示与逐实例压缩",
        "short": "隐式表示",
        "description": "网络参数、嵌入和每视频拟合的码量",
        "color": "#6c708c"
      },
      {
        "id": "08",
        "label": "感知与生成式编码",
        "short": "感知生成",
        "description": "感知真实感、像素失真与时间一致性",
        "color": "#a8637a"
      },
      {
        "id": "09",
        "label": "评价方法与证据边界",
        "short": "评价方法",
        "description": "RD、视觉指标、数据集和统计比较",
        "color": "#b76b32"
      },
      {
        "id": "10",
        "label": "训练策略与量化一致性",
        "short": "训练与量化",
        "description": "训练域、长链、松弛目标与数值稳定性",
        "color": "#267b72"
      },
      {
        "id": "11",
        "label": "目标码率控制与跨帧分配",
        "short": "码率控制",
        "description": "预算、前瞻与跨帧依赖下的分配",
        "color": "#9a6c50"
      },
      {
        "id": "12",
        "label": "可伸缩编码与分层依赖",
        "short": "可伸缩编码",
        "description": "空间、质量和位深层的独立性与代价",
        "color": "#a85140"
      },
      {
        "id": "13",
        "label": "丢包恢复与联合信源信道编码",
        "short": "网络传输",
        "description": "擦除、反馈、信道变化与同步",
        "color": "#84714a"
      },
      {
        "id": "14",
        "label": "面向机器视觉的编码",
        "short": "机器视觉",
        "description": "像素保真与下游任务性能的取舍",
        "color": "#4d8276"
      },
      {
        "id": "15",
        "label": "内容域迁移_HDR屏幕与全景",
        "short": "内容与数据",
        "description": "屏幕、HDR、全景及训练测试分布",
        "color": "#6c708c"
      },
      {
        "id": "16",
        "label": "标准兼容_跨平台一致性与神经包装",
        "short": "部署与兼容",
        "description": "整数推理、数值一致性及标准封装",
        "color": "#a8637a"
      }
    ],
    "readingLevels": [
      {
        "id": "selected",
        "label": "方法／实验选读",
        "description": "实际选读过指定章节，不等于全文完成"
      },
      {
        "id": "screen",
        "label": "摘要／引言筛查",
        "description": "用于收录与选题，方法和实验尚待深入"
      },
      {
        "id": "prior",
        "label": "承接既有阅读笔记",
        "description": "历史深入笔记没有统一页码表，保留原证据"
      },
      {
        "id": "none",
        "label": "已收录，待阅读",
        "description": "下载与提取不算阅读"
      }
    ],
    "relationNote": "连线表示本项目整理的阅读路径，不是自动提取的论文引用或作者继承声明。",
    "evidenceNote": "代码审阅、环境预检、离线分析和实际模型实验分别标记；相关实验不等于论文完整复现。 公开版原文入口指向官方来源；本地执行记录与研究计划未公开，相关标签不代表已验证或完成复现。",
    "sourceCatalog": "",
    "readingUpdateCount": 3,
    "readingUpdateNote": "参考可靠性三篇方法/实验选读：31完整新页、1部分页、16图表页；0新增论文/PDF/模型。"
  },
  "papers": [
    {
      "id": "OFENH",
      "title": "Offline and Online Optical Flow Enhancement for Deep Video Compression",
      "authors": [
        "Chuanbo Tang",
        "Xihua Sheng",
        "Zhuoyuan Li",
        "Haotian Zhang",
        "Li Li",
        "Dong Liu"
      ],
      "year": 2024,
      "venue": "AAAI 2024",
      "version": "AAAI 2024 proceedings",
      "fields": [
        "06",
        "10"
      ],
      "tags": [
        "编码端搜索",
        "训练与量化"
      ],
      "summary": "离线运动训练加在线运动潜变量优化",
      "question": "重点问题：潜变量或参数优化的收益与总成本？",
      "caveat": "编码搜索和离线训练成本仍存在",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        6,
        7
      ],
      "localPdf": "https://ojs.aaai.org/index.php/AAAI/article/download/28317/28623",
      "sourceUrl": "https://ojs.aaai.org/index.php/AAAI/article/download/28317/28623",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "77f0a34f64a2eff050d9b2bef80bea7f466d773998a2637035953dff473f2f03",
      "pages": 9,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "PEIAVC",
      "title": "Parameter-Efficient Instance-Adaptive Neural Video Compression",
      "authors": [
        "Seungjun Oh",
        "Hyunmo Yang",
        "Eunbyung Park"
      ],
      "year": 2024,
      "venue": "",
      "version": "ACCV 2024 proceedings",
      "fields": [
        "06",
        "10"
      ],
      "tags": [
        "编码端搜索",
        "训练与量化"
      ],
      "summary": "卷积解码器的低秩逐实例适配",
      "question": "重点问题：潜变量或参数优化的收益与总成本？",
      "caveat": "适配参数须量化熵编码并传输",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        12
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ACCV2024/papers/Oh_Parameter-Efficient_Instance-Adaptive_Neural_Video_Compression_ACCV_2024_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/ACCV2024/papers/Oh_Parameter-Efficient_Instance-Adaptive_Neural_Video_Compression_ACCV_2024_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "精读笔记（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a699fe2bd3c69664fa3012a86f8fc4553575a56f5707520d777f87a3dadeceb0",
      "pages": 18,
      "addedThisRound": false,
      "relations": [
        {
          "id": "IADP",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        },
        {
          "id": "DCVCDT",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCVCDT",
      "title": "Neural Video Compression with Domain Transfer",
      "authors": [
        "Tiange Zhang",
        "Rongqun Lin",
        "Xiandong Meng",
        "Haofeng Wang",
        "Xing Tian",
        "Qi Zhang",
        "Siwei Ma"
      ],
      "year": 2026,
      "venue": "arXiv 2026",
      "version": "arXiv v1, 2026-05-13",
      "fields": [
        "06",
        "10"
      ],
      "tags": [
        "编码端搜索",
        "训练与量化"
      ],
      "summary": "编码端优化内容潜变量，原解码器不改",
      "question": "重点问题：潜变量或参数优化的收益与总成本？",
      "caveat": "搜索耗时、RGB/YUV损失和计时分支",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://arxiv.org/pdf/2605.13476v1",
      "sourceUrl": "https://arxiv.org/pdf/2605.13476v1",
      "codeUrl": "https://github.com/SunnyMass/DCVC-DT",
      "notes": [
        {
          "label": "DCMVC与DCVC_DT_上下文调制和推理适配",
          "url": "../notes/DCMVC%E4%B8%8EDCVC_DT_%E4%B8%8A%E4%B8%8B%E6%96%87%E8%B0%83%E5%88%B6%E5%92%8C%E6%8E%A8%E7%90%86%E9%80%82%E9%85%8D.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "27cc03f8e0c22d90624edaff7b7bb4bc5e24f6859c9ed787d5ed35de5ca6e0e7",
      "pages": 5,
      "addedThisRound": false,
      "relations": [
        {
          "id": "PEIAVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        },
        {
          "id": "C3",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "B_CANF",
      "title": "Hierarchical B-Frame Video Coding Using Two-Layer CANF Without Motion Coding",
      "authors": [
        "David Alexandre",
        "Hsueh-Ming Hang",
        "Wen-Hsiao Peng"
      ],
      "year": 2023,
      "venue": "",
      "version": "CVPR 2023 proceedings",
      "fields": [
        "05",
        "02"
      ],
      "tags": [
        "双向编码",
        "表示与参考"
      ],
      "summary": "用低分辨率基础层替代运动传输",
      "question": "重点问题：未来参考、层次结构和等待延迟？",
      "caveat": "仍有运动/扭曲计算；需要双向结构",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2023/papers/Alexandre_Hierarchical_B-Frame_Video_Coding_Using_Two-Layer_CANF_Without_Motion_Coding_CVPR_2023_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2023/papers/Alexandre_Hierarchical_B-Frame_Video_Coding_Using_Two-Layer_CANF_Without_Motion_Coding_CVPR_2023_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "4c2639ddde0b12f2b8ff6619bf0d9a9925872f9345973861af38355f385745f7",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCVCB",
      "title": "Bi-Directional Deep Contextual Video Compression",
      "authors": [
        "Xihua Sheng",
        "Li Li",
        "Dong Liu",
        "Shiqi Wang"
      ],
      "year": 2024,
      "venue": "",
      "version": "arXiv v1",
      "fields": [
        "05",
        "02"
      ],
      "tags": [
        "双向编码",
        "表示与参考"
      ],
      "summary": "双向上下文、运动差分和层次质量",
      "question": "重点问题：未来参考、层次结构和等待延迟？",
      "caveat": "未来帧等待、RA结构和缓冲",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        4,
        5,
        6
      ],
      "localPdf": "https://arxiv.org/pdf/2408.08604v1",
      "sourceUrl": "https://arxiv.org/pdf/2408.08604v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "75c2417f3c236a7742a6364da46d68e90b67a2eaff4c688518cb46830a2411bf",
      "pages": 13,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "BIECVC",
      "title": "BiECVC: Gated Diversification of Bidirectional Contexts for Learned Video Compression",
      "authors": [
        "Wei Jiang",
        "Junru Li",
        "Kai Zhang",
        "Li Zhang"
      ],
      "year": 2025,
      "venue": "",
      "version": "arXiv v1",
      "fields": [
        "05",
        "02"
      ],
      "tags": [
        "双向编码",
        "表示与参考"
      ],
      "summary": "双向局部/非局部上下文与条件感知门控",
      "question": "重点问题：未来参考、层次结构和等待延迟？",
      "caveat": "额外参考、长训练和门控不能混为单项贡献",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        5,
        6
      ],
      "localPdf": "https://arxiv.org/pdf/2505.09193v1",
      "sourceUrl": "https://arxiv.org/pdf/2505.09193v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "2d98b9ac5b1b6408a7940e02af731703756a6512908666fb4990366a347b4b89",
      "pages": 19,
      "addedThisRound": false,
      "relations": [
        {
          "id": "MASKCRT",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        },
        {
          "id": "DCMVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "MASKCRT",
      "title": "MaskCRT: Masked Conditional Residual Transformer for Learned Video Compression",
      "authors": [
        "Yi-Hsin Chen",
        "Hong-Sheng Xie",
        "Cheng-Wei Chen",
        "Zong-Lin Gao",
        "Martin Benjak",
        "Wen-Hsiao Peng",
        "Jörn Ostermann"
      ],
      "year": 2023,
      "venue": "",
      "version": "arXiv v1 (2023); arXiv v2 page reports TCSVT acceptance (2024); v2 not downloaded",
      "fields": [
        "04",
        "02"
      ],
      "tags": [
        "参考失效",
        "表示与参考"
      ],
      "summary": "软掩码混合条件与条件残差编码",
      "question": "重点问题：场景切换、误差传播与条件可靠性？",
      "caveat": "门控已有先行研究；部分熵论证有假设",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5,
        6,
        7
      ],
      "localPdf": "https://arxiv.org/pdf/2312.15829v1",
      "sourceUrl": "https://arxiv.org/pdf/2312.15829v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "1ef5d16c4608c918c7e2f1330ddcf865117bf591ad265b6cb8e47230e7eebaae",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "EPA",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        },
        {
          "id": "BIECVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "ARHYPER",
      "title": "Joint Autoregressive and Hierarchical Priors for Learned Image Compression",
      "authors": [
        "David Minnen",
        "Johannes Ballé",
        "George Toderici"
      ],
      "year": 2018,
      "venue": "NeurIPS 2018",
      "version": "NeurIPS 2018 proceedings",
      "fields": [
        "01"
      ],
      "tags": [
        "熵模型"
      ],
      "summary": "联合层次与自回归概率先验",
      "question": "重点问题：潜变量分布、侧信息、量化与解码依赖？",
      "caveat": "逐样本依赖带来串行解码成本",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4
      ],
      "localPdf": "https://papers.nips.cc/paper_files/paper/2018/file/53edebc543333dfbf7c5933af792c9c4-Paper.pdf",
      "sourceUrl": "https://papers.nips.cc/paper_files/paper/2018/file/53edebc543333dfbf7c5933af792c9c4-Paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "7b6a04f0729ee56fa633cfbb1153977c4a25d9a002b3d07d45999b284fb9809a",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "HYPERPRIOR",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        },
        {
          "id": "CHENG2020",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "HYPERPRIOR",
      "title": "Variational image compression with a scale hyperprior",
      "authors": [
        "Johannes Ballé",
        "David Minnen",
        "Saurabh Singh",
        "Sung Jin Hwang",
        "Nick Johnston"
      ],
      "year": 2018,
      "venue": "ICLR 2018",
      "version": "ICLR 2018; arXiv v1",
      "fields": [
        "01"
      ],
      "tags": [
        "熵模型"
      ],
      "summary": "用超先验侧信息预测潜变量分布",
      "question": "重点问题：潜变量分布、侧信息、量化与解码依赖？",
      "caveat": "超潜变量本身占比特；主要为图像基础",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://arxiv.org/pdf/1802.01436v1",
      "sourceUrl": "https://arxiv.org/pdf/1802.01436v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "79cc8182c936d13a4cc15274e8c7b20c86802a53d425f86b136f61591dbf50b5",
      "pages": 20,
      "addedThisRound": false,
      "relations": [
        {
          "id": "CAE2017",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        },
        {
          "id": "ARHYPER",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "ELIC",
      "title": "ELIC: Efficient Learned Image Compression With Unevenly Grouped Space-Channel Contextual Adaptive Coding",
      "authors": [
        "Dailan He",
        "Ziming Yang",
        "Weikun Peng",
        "Rui Ma",
        "Hongwei Qin",
        "Yan Wang"
      ],
      "year": 2022,
      "venue": "",
      "version": "CVPR 2022 proceedings",
      "fields": [
        "01"
      ],
      "tags": [
        "熵模型"
      ],
      "summary": "不均匀通道组配合组内棋盘形成默认10个条件组；主变换和熵模型共同决定整体质量与耗时。",
      "question": "分组消融说明哪些取舍，网络分项怎样对应真实文件到像素计时？",
      "caveat": "49.16ms为网络总延迟；分项和50.02ms及正文微秒表述存在未解释差异。表3是分别训练模型，不是同权重调度对照。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2022/papers/He_ELIC_Efficient_Learned_Image_Compression_With_Unevenly_Grouped_Space-Channel_Contextual_CVPR_2022_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2022/papers/He_ELIC_Efficient_Learned_Image_Compression_With_Unevenly_Grouped_Space-Channel_Contextual_CVPR_2022_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "依赖与计时精读（本地记录未公开）",
          "url": ""
        },
        {
          "label": "逐页与计时证据（本地记录未公开）",
          "url": ""
        },
        {
          "label": "官方补充材料（本地记录未公开）",
          "url": ""
        }
      ],
      "evidence": [],
      "sha256": "e176c9ad822c9757f4070b3d64d7e8f5c54d80fc4bb612820ac17b5c0e5a80ca",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "CCM",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 本轮主文完整读页2,3,4,5,6,7,8；新覆盖2,5,6,7,8。补充、重读及图注范围见阶段证据，未声称阅读全文。"
    },
    {
      "id": "HEM",
      "title": "Hybrid Spatial-Temporal Entropy Modelling for Neural Video Compression",
      "authors": [
        "Jiahao Li",
        "Bin Li",
        "Yan Lu"
      ],
      "year": 2022,
      "venue": "ACM Multimedia 2022",
      "version": "ACM MM 2022; arXiv v1",
      "fields": [
        "01",
        "02"
      ],
      "tags": [
        "熵模型",
        "表示与参考"
      ],
      "summary": "时间潜变量先验、双空间先验及自适应量化",
      "question": "重点问题：潜变量分布、侧信息、量化与解码依赖？",
      "caveat": "概率模型和量化控制耦合",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://arxiv.org/pdf/2207.05894v1",
      "sourceUrl": "https://arxiv.org/pdf/2207.05894v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "6ecb56fd0d799474dbfb71cfc8fdede2d0318d186e7eb4d4852f40ab14463556",
      "pages": 17,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CGT",
      "title": "Context Guided Transformer Entropy Modeling for Video Compression",
      "authors": [
        "Junlong Tong",
        "Wei Zhang",
        "Yaohui Jin",
        "Xiaoyu Shen"
      ],
      "year": 2025,
      "venue": "",
      "version": "ICCV 2025 proceedings",
      "fields": [
        "01",
        "02"
      ],
      "tags": [
        "熵模型",
        "表示与参考"
      ],
      "summary": "压缩时间上下文并学习位置解码顺序",
      "question": "重点问题：潜变量分布、侧信息、量化与解码依赖？",
      "caveat": "概率建模加速不等于完整解码同幅加速",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        4,
        5,
        6
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2025/papers/Tong_Context_Guided_Transformer_Entropy_Modeling_for_Video_Compression_ICCV_2025_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2025/papers/Tong_Context_Guided_Transformer_Entropy_Modeling_for_Video_Compression_ICCV_2025_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cdd9769ce9f69103465cc6abf37d95630d52aaf0ab3abc913d45a6b405b29254",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "FVD",
      "title": "Towards Accurate Generative Models of Video: A New Metric & Challenges",
      "authors": [
        "Thomas Unterthiner",
        "Sjoerd van Steenkiste",
        "Karol Kurach",
        "Raphael Marinier",
        "Marcin Michalski",
        "Sylvain Gelly"
      ],
      "year": 2018,
      "venue": "",
      "version": "arXiv v1",
      "fields": [
        "09"
      ],
      "tags": [
        "评价方法"
      ],
      "summary": "比较视频特征分布及生成质量",
      "question": "重点问题：RD、视觉指标、数据集和统计比较？",
      "caveat": "需要样本群体；不是单帧失真/单视频闪烁分数",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        6
      ],
      "localPdf": "https://arxiv.org/pdf/1812.01717v1",
      "sourceUrl": "https://arxiv.org/pdf/1812.01717v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cfab168acaa1266d13088b7f6accd8d6d4218e7dbbca18410640bfab1f75a493",
      "pages": 16,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DISTS",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        },
        {
          "id": "BD_BIBLE",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "LPIPS",
      "title": "The Unreasonable Effectiveness of Deep Features as a Perceptual Metric",
      "authors": [
        "Richard Zhang",
        "Phillip Isola",
        "Alexei A. Efros",
        "Eli Shechtman",
        "Oliver Wang"
      ],
      "year": 2018,
      "venue": "",
      "version": "CVPR 2018 proceedings",
      "fields": [
        "09"
      ],
      "tags": [
        "评价方法"
      ],
      "summary": "从人类相似性判断研究深层特征距离",
      "question": "重点问题：RD、视觉指标、数据集和统计比较？",
      "caveat": "图像特征指标不能单独证明时序或像素保真",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        4,
        5,
        6
      ],
      "localPdf": "https://openaccess.thecvf.com/content_cvpr_2018/papers/Zhang_The_Unreasonable_Effectiveness_CVPR_2018_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content_cvpr_2018/papers/Zhang_The_Unreasonable_Effectiveness_CVPR_2018_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "6809251d37d9d9847335e27da3bd71fdab15197219841ebe9706e6e3d18cc35b",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "VIF",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        },
        {
          "id": "DISTS",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "PD_TRADEOFF",
      "title": "The Perception-Distortion Tradeoff",
      "authors": [
        "Yochai Blau",
        "Tomer Michaeli"
      ],
      "year": 2018,
      "venue": "",
      "version": "CVPR 2018 proceedings",
      "fields": [
        "09"
      ],
      "tags": [
        "评价方法"
      ],
      "summary": "分析感知-失真最优边界",
      "question": "重点问题：RD、视觉指标、数据集和统计比较？",
      "caveat": "不意味着任意两种次优方法不能同时改善",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://openaccess.thecvf.com/content_cvpr_2018/papers/Blau_The_Perception-Distortion_Tradeoff_CVPR_2018_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content_cvpr_2018/papers/Blau_The_Perception-Distortion_Tradeoff_CVPR_2018_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "db120c6c9a750ccc1e33f8e435493c6e2dcb6257b53814298a197c23872a318e",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "RDP2019",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DISTS",
      "title": "Image Quality Assessment: Unifying Structure and Texture Similarity",
      "authors": [
        "Keyan Ding",
        "Kede Ma",
        "Shiqi Wang",
        "Eero P. Simoncelli"
      ],
      "year": 2020,
      "venue": "",
      "version": "arXiv v1 (2020); not dated by later journal issue",
      "fields": [
        "09"
      ],
      "tags": [
        "评价方法"
      ],
      "summary": "联合结构与纹理统计并容忍纹理重采样",
      "question": "重点问题：RD、视觉指标、数据集和统计比较？",
      "caveat": "合理纹理不等于原纹理逐像素正确",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://arxiv.org/pdf/2004.07728v1",
      "sourceUrl": "https://arxiv.org/pdf/2004.07728v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "78d27addf507b91d41b60facc0852c67bb361a7033eb1deb8721016e2b0315a4",
      "pages": 14,
      "addedThisRound": false,
      "relations": [
        {
          "id": "LPIPS",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        },
        {
          "id": "FVD",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "BD_BIBLE",
      "title": "The Bjontegaard Bible: Why your Way of Comparing Video Codecs May Be Wrong",
      "authors": [
        "Christian Herglotz",
        "Hannah Och",
        "Anna Meyer",
        "Geetha Ramasubbu",
        "Lena Eichermüller",
        "Matthias Kränzler",
        "Fabian Brand",
        "Kristian Fischer",
        "Dat Thanh Nguyen",
        "Andy Regensky",
        "André Kaup"
      ],
      "year": 2023,
      "venue": "",
      "version": "arXiv v1; later revisions not compared",
      "fields": [
        "09"
      ],
      "tags": [
        "评价方法"
      ],
      "summary": "检验BD积分的插值、采样与范围误差",
      "question": "重点问题：RD、视觉指标、数据集和统计比较？",
      "caveat": "论文误差分布不能当成本项目置信区间",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        10,
        11
      ],
      "localPdf": "https://arxiv.org/pdf/2304.12852v1",
      "sourceUrl": "https://arxiv.org/pdf/2304.12852v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "c4162153c57d8604c5f9802f72aec93abbf0673099f82b48a73e90a8e9f92ca5",
      "pages": 18,
      "addedThisRound": false,
      "relations": [
        {
          "id": "FVD",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        },
        {
          "id": "USTC_TD",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DIFFVC",
      "title": "Diffusion-based Perceptual Neural Video Compression with Temporal Diffusion Information Reuse",
      "authors": [
        "Wenzhuo Ma",
        "Zhenzhong Chen"
      ],
      "year": 2025,
      "venue": "",
      "version": "arXiv v1; later journal version not compared",
      "fields": [
        "08",
        "09"
      ],
      "tags": [
        "感知生成",
        "评价方法"
      ],
      "summary": "扩散条件重建与时间信息复用",
      "question": "重点问题：感知真实感、像素失真与时间一致性？",
      "caveat": "感知指标、采样和时间一致性；阅读范围见下方记录",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        4,
        5,
        6
      ],
      "localPdf": "https://arxiv.org/pdf/2501.13528v1",
      "sourceUrl": "https://arxiv.org/pdf/2501.13528v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "aca12c80ac34c7417f8aa6750acd16fe957b86d00376d1ebbb021ca5769faed4",
      "pages": 16,
      "addedThisRound": false,
      "relations": [
        {
          "id": "CDC_DIFFUSION",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        },
        {
          "id": "S2VC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DIFFVC_OSD",
      "title": "DiffVC-OSD: One-Step Diffusion-based Perceptual Neural Video Compression Framework",
      "authors": [
        "Wenzhuo Ma",
        "Zhenzhong Chen"
      ],
      "year": 2025,
      "venue": "",
      "version": "arXiv v1",
      "fields": [
        "08",
        "09"
      ],
      "tags": [
        "感知生成",
        "评价方法"
      ],
      "summary": "单步扩散和时间上下文适配",
      "question": "重点问题：感知真实感、像素失真与时间一致性？",
      "caveat": "速度/节码率摘要数字未复核测试口径",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4
      ],
      "localPdf": "https://arxiv.org/pdf/2508.07682v1",
      "sourceUrl": "https://arxiv.org/pdf/2508.07682v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "bd246fbeb2ef9011243199d199e693bcf4b516d6dc8ce9523757a6f32d46dcfa",
      "pages": 5,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "GIVIC",
      "title": "GIViC: Generative Implicit Video Compression",
      "authors": [
        "Ge Gao",
        "Siyue Teng",
        "Tianhao Peng",
        "Fan Zhang",
        "David Bull"
      ],
      "year": 2025,
      "venue": "",
      "version": "ICCV 2025 proceedings",
      "fields": [
        "07",
        "08"
      ],
      "tags": [
        "隐式表示",
        "感知生成"
      ],
      "summary": "共享时空先验、隐式扩散与逐GOP潜变量拟合",
      "question": "重点问题：网络参数、嵌入和每视频拟合的码量？",
      "caveat": "MSE引导、RA条件和完整拟合时间",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5,
        6,
        7
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2025/papers/Gao_GIViC_Generative_Implicit_Video_Compression_ICCV_2025_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2025/papers/Gao_GIViC_Generative_Implicit_Video_Compression_ICCV_2025_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "beb54c829e11923c672348dcb61cdbf3e0bfe50b5756b677784423ed4926cb79",
      "pages": 12,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "GNVCVD",
      "title": "Generative Neural Video Compression via Video Diffusion Prior",
      "authors": [
        "Qi Mao",
        "Hao Cheng",
        "Tinghan Yang",
        "Libiao Jin",
        "Siwei Ma"
      ],
      "year": 2026,
      "venue": "",
      "version": "CVPR 2026 proceedings",
      "fields": [
        "08",
        "09"
      ],
      "tags": [
        "感知生成",
        "评价方法"
      ],
      "summary": "视频原生扩散先验细化已压缩时空潜变量",
      "question": "重点问题：感知真实感、像素失真与时间一致性？",
      "caveat": "序列窗口、感知目标与当前代码Coming Soon",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5,
        6,
        7
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2026/papers/Mao_Generative_Neural_Video_Compression_via_Video_Diffusion_Prior_CVPR_2026_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2026/papers/Mao_Generative_Neural_Video_Compression_via_Video_Diffusion_Prior_CVPR_2026_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "8c812cb63a65f5a65286730f6c314cc83cd5b858bf1e1e250ee1a0ed36e5b9cc",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "S2VC",
      "title": "Single-step Diffusion-based Video Coding with Semantic-Temporal Guidance",
      "authors": [
        "Naifu Xue",
        "Zhaoyang Jia",
        "Jiahao Li",
        "Bin Li",
        "Zihan Zheng",
        "Yuan Zhang",
        "Yan Lu"
      ],
      "year": 2026,
      "venue": "",
      "version": "CVPR 2026 proceedings",
      "fields": [
        "08",
        "09"
      ],
      "tags": [
        "感知生成",
        "评价方法"
      ],
      "summary": "单步生成、已解码特征语义引导和时间传播",
      "question": "重点问题：感知真实感、像素失真与时间一致性？",
      "caveat": "单步不等于实时；评价主要感知与时序指标",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        4,
        5,
        6,
        7
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2026/papers/Xue_Single-step_Diffusion-based_Video_Coding_with_Semantic-Temporal_Guidance_CVPR_2026_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2026/papers/Xue_Single-step_Diffusion-based_Video_Coding_with_Semantic-Temporal_Guidance_CVPR_2026_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cf832eb41371a3b5e6e6a62b65af49afe70905e642eb455e18c9d60374adacb2",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DIFFVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "NERV",
      "title": "NeRV: Neural Representations for Videos",
      "authors": [
        "Hao Chen",
        "Bo He",
        "Hanyu Wang",
        "Yixuan Ren",
        "Ser-Nam Lim",
        "Abhinav Shrivastava"
      ],
      "year": 2021,
      "venue": "NeurIPS 2021",
      "version": "NeurIPS 2021 proceedings",
      "fields": [
        "07",
        "06",
        "03"
      ],
      "tags": [
        "隐式表示",
        "编码端搜索",
        "实时系统"
      ],
      "summary": "从帧索引生成图像，以网络存储视频",
      "question": "重点问题：网络参数、嵌入和每视频拟合的码量？",
      "caveat": "拟合/模型压缩；不能只报未压缩回归PSNR",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://papers.nips.cc/paper_files/paper/2021/file/b44182379bf9fae976e6ae5996e13cd8-Paper.pdf",
      "sourceUrl": "https://papers.nips.cc/paper_files/paper/2021/file/b44182379bf9fae976e6ae5996e13cd8-Paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "e0cf1be74ec6e0c9545a2fd9b2c1326b98e8ac3d450d7e033d497dd074907434",
      "pages": 12,
      "addedThisRound": false,
      "relations": [
        {
          "id": "ENERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "HINERV",
      "title": "HiNeRV: Video Compression with Hierarchical Encoding-based Neural Representation",
      "authors": [
        "Ho Man Kwan",
        "Ge Gao",
        "Fan Zhang",
        "Andrew Gower",
        "David Bull"
      ],
      "year": 2023,
      "venue": "NeurIPS 2023",
      "version": "NeurIPS 2023 proceedings",
      "fields": [
        "07",
        "06"
      ],
      "tags": [
        "隐式表示",
        "编码端搜索"
      ],
      "summary": "层次位置编码与帧/块统一表示",
      "question": "重点问题：网络参数、嵌入和每视频拟合的码量？",
      "caveat": "训练、剪枝、量化与访问粒度",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5,
        6
      ],
      "localPdf": "https://papers.nips.cc/paper_files/paper/2023/file/e5dc475c370ff42f2f96dddf8191a40c-Paper-Conference.pdf",
      "sourceUrl": "https://papers.nips.cc/paper_files/paper/2023/file/e5dc475c370ff42f2f96dddf8191a40c-Paper-Conference.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "0f246ec9d14ce8fdc9151d8250fd6a64accf225cc266c65b5a0fa28638e705e4",
      "pages": 13,
      "addedThisRound": false,
      "relations": [
        {
          "id": "FFNERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        },
        {
          "id": "NVRC",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "HNERV",
      "title": "HNeRV: A Hybrid Neural Representation for Videos",
      "authors": [
        "Hao Chen",
        "Matthew Gwilliam",
        "Ser-Nam Lim",
        "Abhinav Shrivastava"
      ],
      "year": 2023,
      "venue": "",
      "version": "CVPR 2023 proceedings",
      "fields": [
        "07",
        "06"
      ],
      "tags": [
        "隐式表示",
        "编码端搜索"
      ],
      "summary": "内容自适应嵌入和表示容量分配",
      "question": "重点问题：网络参数、嵌入和每视频拟合的码量？",
      "caveat": "嵌入与模型的完整码率需共同核算",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_HNeRV_A_Hybrid_Neural_Representation_for_Videos_CVPR_2023_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2023/papers/Chen_HNeRV_A_Hybrid_Neural_Representation_for_Videos_CVPR_2023_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "89a881e138d37611bf3ff7218eedc0efb73b84c378e597b4072f3cf2788c035f",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "C3",
      "title": "C3: High-Performance and Low-Complexity Neural Compression from a Single Image or Video",
      "authors": [
        "Hyunjik Kim",
        "Matthias Bauer",
        "Lucas Theis",
        "Jonathan Richard Schwarz",
        "Emilien Dupont"
      ],
      "year": 2024,
      "venue": "",
      "version": "CVPR 2024 proceedings",
      "fields": [
        "07",
        "06",
        "03"
      ],
      "tags": [
        "隐式表示",
        "编码端搜索",
        "实时系统"
      ],
      "summary": "每视频块拟合小网络、潜变量与熵模型",
      "question": "重点问题：网络参数、嵌入和每视频拟合的码量？",
      "caveat": "编码很慢；低MAC不是完整时钟或实时编码",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        7,
        8
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2024/papers/Kim_C3_High-Performance_and_Low-Complexity_Neural_Compression_from_a_Single_Image_CVPR_2024_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2024/papers/Kim_C3_High-Performance_and_Low-Complexity_Neural_Compression_from_a_Single_Image_CVPR_2024_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "89626409a7749b4db0763f795210a9f072f563063a90cdf3065e8d57655f1842",
      "pages": 12,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVCDT",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DVC",
      "title": "DVC: An End-to-End Deep Video Compression Framework",
      "authors": [
        "Guo Lu",
        "Wanli Ouyang",
        "Dong Xu",
        "Xiaoyun Zhang",
        "Chunlei Cai",
        "Zhiyong Gao"
      ],
      "year": 2019,
      "venue": "CVPR 2019",
      "version": "official proceedings PDF",
      "fields": [
        "02"
      ],
      "tags": [
        "表示与参考"
      ],
      "summary": "端到端连接运动、补偿和残差压缩",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "运动与残差的总码率均要计入",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://openaccess.thecvf.com/content_CVPR_2019/papers/Lu_DVC_An_End-To-End_Deep_Video_Compression_Framework_CVPR_2019_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content_CVPR_2019/papers/Lu_DVC_An_End-To-End_Deep_Video_Compression_Framework_CVPR_2019_paper.pdf",
      "codeUrl": "https://github.com/GuoLusjtu/DVC",
      "notes": [
        {
          "label": "DVC到DCVC_条件编码的收益与边界",
          "url": "../notes/DVC%E5%88%B0DCVC_%E6%9D%A1%E4%BB%B6%E7%BC%96%E7%A0%81%E7%9A%84%E6%94%B6%E7%9B%8A%E4%B8%8E%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "4815ae4aab698cc9c35199558d61b6ef8477a76e2b9666fdb88957a6b7900978",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "RIPPEL",
      "title": "Learned Video Compression",
      "authors": [
        "Oren Rippel",
        "Sanjay Nair",
        "Carissa Lew",
        "Steve Branson",
        "Alexander G. Anderson",
        "Lubomir Bourdev"
      ],
      "year": 2019,
      "venue": "",
      "version": "ICCV 2019 proceedings",
      "fields": [
        "02"
      ],
      "tags": [
        "表示与参考"
      ],
      "summary": "学习时域状态、补偿及空间码率分配",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "低延迟条件下的结果，非自动实时",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1
      ],
      "localPdf": "https://openaccess.thecvf.com/content_ICCV_2019/papers/Rippel_Learned_Video_Compression_ICCV_2019_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content_ICCV_2019/papers/Rippel_Learned_Video_Compression_ICCV_2019_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "6ac8f66ebf5717ce359b92440bea08d5e0ba9e02b0095d85a1c3b1031df5d00e",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "SSF",
      "title": "Scale-Space Flow for End-to-End Optimized Video Compression",
      "authors": [
        "Eirikur Agustsson",
        "David Minnen",
        "Nick Johnston",
        "Johannes Ballé",
        "Sung Jin Hwang",
        "George Toderici"
      ],
      "year": 2020,
      "venue": "",
      "version": "CVPR 2020 proceedings",
      "fields": [
        "02"
      ],
      "tags": [
        "表示与参考"
      ],
      "summary": "尺度空间扭曲表达运动不确定性",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "预测与运动率失真联合；不是纯光流准确率任务",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://openaccess.thecvf.com/content_CVPR_2020/papers/Agustsson_Scale-Space_Flow_for_End-to-End_Optimized_Video_Compression_CVPR_2020_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content_CVPR_2020/papers/Agustsson_Scale-Space_Flow_for_End-to-End_Optimized_Video_Compression_CVPR_2020_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "f21c83f8bd86fc5859d2b695c96c7bff9b67f47f084e0f859fd76171fb7a5c47",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCVC",
      "title": "Deep Contextual Video Compression",
      "authors": [
        "Jiahao Li",
        "Bin Li",
        "Yan Lu"
      ],
      "year": 2021,
      "venue": "NeurIPS 2021",
      "version": "official proceedings PDF",
      "fields": [
        "02"
      ],
      "tags": [
        "表示与参考"
      ],
      "summary": "参考作为变换、重建和熵模型条件",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "有损条件和有限模型不能只靠理想熵不等式比较",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://papers.neurips.cc/paper/2021/file/96b250a90d3cf0868c83f8c965142d2a-Paper.pdf",
      "sourceUrl": "https://papers.neurips.cc/paper/2021/file/96b250a90d3cf0868c83f8c965142d2a-Paper.pdf",
      "codeUrl": "https://github.com/DeepMC-DCVC/DCVC",
      "notes": [
        {
          "label": "DVC到DCVC_条件编码的收益与边界",
          "url": "../notes/DVC%E5%88%B0DCVC_%E6%9D%A1%E4%BB%B6%E7%BC%96%E7%A0%81%E7%9A%84%E6%94%B6%E7%9B%8A%E4%B8%8E%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "f4061fe85f1035e8ddfa64e00b4046339c226e20ea8e0ca1b05052843bf38fc2",
      "pages": 12,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        },
        {
          "id": "DCVCDC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "FVC",
      "title": "FVC: A New Framework Towards Deep Video Compression in Feature Space",
      "authors": [
        "Zhihao Hu",
        "Guo Lu",
        "Dong Xu"
      ],
      "year": 2021,
      "venue": "",
      "version": "CVPR 2021 proceedings",
      "fields": [
        "02"
      ],
      "tags": [
        "表示与参考"
      ],
      "summary": "在特征域进行运动、残差与多帧融合",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "可变形运算、参考存储与实现成本",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2021/papers/Hu_FVC_A_New_Framework_Towards_Deep_Video_Compression_in_Feature_CVPR_2021_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2021/papers/Hu_FVC_A_New_Framework_Towards_Deep_Video_Compression_in_Feature_CVPR_2021_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "becd3f2529629d9980a2f060f9be25785f8e1209dc5d230703ab56f046c99ea5",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "TCM",
      "title": "Temporal Context Mining for Learned Video Compression",
      "authors": [
        "Xihua Sheng",
        "Jiahao Li",
        "Bin Li",
        "Li Li",
        "Dong Liu",
        "Yan Lu"
      ],
      "year": 2021,
      "venue": "",
      "version": "arXiv v1 (2021); related IEEE TMM DOI 10.1109/TMM.2022.3220421",
      "fields": [
        "02"
      ],
      "tags": [
        "表示与参考"
      ],
      "summary": "传播特征、多尺度上下文与并行友好概率模型",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "本地读2021预印本，后续TMM版本未逐版比较",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5
      ],
      "localPdf": "https://arxiv.org/pdf/2111.13850v1",
      "sourceUrl": "https://arxiv.org/pdf/2111.13850v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "ad3df2a1003b9bb0f01046f2ef0030a2d0753130ed27e967d291c15d586a1064",
      "pages": 23,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCVCDC",
      "title": "Neural Video Compression with Diverse Contexts",
      "authors": [
        "Jiahao Li",
        "Bin Li",
        "Yan Lu"
      ],
      "year": 2023,
      "venue": "CVPR 2023",
      "version": "official proceedings PDF",
      "fields": [
        "02",
        "01",
        "10"
      ],
      "tags": [
        "表示与参考",
        "熵模型",
        "训练与量化"
      ],
      "summary": "多样化上下文与分阶段潜变量编码",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "运动、内容分支各有依赖阶段",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2023/papers/Li_Neural_Video_Compression_With_Diverse_Contexts_CVPR_2023_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2023/papers/Li_Neural_Video_Compression_With_Diverse_Contexts_CVPR_2023_paper.pdf",
      "codeUrl": "https://github.com/microsoft/DCVC",
      "notes": [
        {
          "label": "DC_上下文与概率模型精读",
          "url": "../notes/DC_%E4%B8%8A%E4%B8%8B%E6%96%87%E4%B8%8E%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E7%B2%BE%E8%AF%BB.md.html"
        },
        {
          "label": "研究报告（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [
        {
          "label": "候选I模型实际文件RD（本地记录未公开）",
          "url": "",
          "type": "experiment",
          "scope": "仅候选I模型；来源身份未证为微软原件，两个图案点失败，无DC P/视频复现。"
        },
        {
          "label": "I/P与门控源码审阅（本地记录未公开）",
          "url": "",
          "type": "code",
          "scope": "固定源码的结构事实，非训练配方或根因证明。"
        }
      ],
      "sha256": "9c17b4b76fe03b09eedaafb58523befebe9e36d89c45675b0f443bbf9cbb8374",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        },
        {
          "id": "DCVCFM",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCVCFM",
      "title": "Neural Video Compression with Feature Modulation",
      "authors": [
        "Jiahao Li",
        "Bin Li",
        "Yan Lu"
      ],
      "year": 2024,
      "venue": "CVPR 2024",
      "version": "official proceedings PDF",
      "fields": [
        "02",
        "04",
        "11"
      ],
      "tags": [
        "表示与参考",
        "参考失效",
        "码率控制"
      ],
      "summary": "特征调制、码率范围和传播控制",
      "question": "重点问题：像素、特征、运动与时间条件放在哪里？",
      "caveat": "周期、训练链长与内容有关",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2024/papers/Li_Neural_Video_Compression_with_Feature_Modulation_CVPR_2024_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2024/papers/Li_Neural_Video_Compression_with_Feature_Modulation_CVPR_2024_paper.pdf",
      "codeUrl": "https://github.com/microsoft/DCVC",
      "notes": [
        {
          "label": "FM_方法与消融精读",
          "url": "../notes/FM_%E6%96%B9%E6%B3%95%E4%B8%8E%E6%B6%88%E8%9E%8D%E7%B2%BE%E8%AF%BB.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        }
      ],
      "evidence": [
        {
          "label": "隔离熵模块预检（本地记录未公开）",
          "url": "",
          "type": "environment",
          "scope": "14符号原版模块往返，不是FM整模型编解码。"
        },
        {
          "label": "检查点来源与结构审计（本地记录未公开）",
          "url": "",
          "type": "code",
          "scope": "尚缺有效官方训练权重，未完成模型复现。"
        }
      ],
      "sha256": "f2559b8c20a94731202a3bdb662d4c751127501f9099774296fb829db0f348c7",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVCDC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        },
        {
          "id": "DCVCRT",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        },
        {
          "id": "DCMVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        },
        {
          "id": "NAFNet",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "SURVEY_IJCAI2025",
      "title": "Emerging Advances in Learned Video Compression: Models, Systems and Beyond",
      "authors": [
        "Chuanmin Jia",
        "Feng Ye",
        "Siwei Ma",
        "Wen Gao",
        "Huifang Sun",
        "Leonardo Chiariglione"
      ],
      "year": 2025,
      "venue": "IJCAI 2025",
      "version": "IJCAI 2025 Survey Track",
      "fields": [
        "09"
      ],
      "tags": [
        "评价方法"
      ],
      "summary": "从模型到优化、系统和标准化的总体综述",
      "question": "重点问题：RD、视觉指标、数据集和统计比较？",
      "caveat": "本轮补读PDF6–7页的系统/扩展主题；原研究判断仍回到一手论文",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        6,
        7
      ],
      "localPdf": "https://www.ijcai.org/proceedings/2025/1165.pdf",
      "sourceUrl": "https://www.ijcai.org/proceedings/2025/1165.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "ed02623ae4739a5d6d8aefeeaf6b5ea35ec54e1727b8d2d84e6cde68f56473b2",
      "pages": 9,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "MOBILENVC",
      "title": "MobileNVC: Real-Time 1080p Neural Video Compression on a Mobile Device",
      "authors": [
        "Ties van Rozendaal",
        "Tushar Singhal",
        "Hoang Le",
        "Guillaume Sautiere",
        "Amir Said",
        "Krishna Buska",
        "Anjuman Raha",
        "Dimitris Kalatzis",
        "Hitarth Mehta",
        "Frank Mayer",
        "Liang Zhang",
        "Markus Nagel",
        "Auke Wiggers"
      ],
      "year": 2024,
      "venue": "",
      "version": "WACV 2024 proceedings",
      "fields": [
        "03",
        "16"
      ],
      "tags": [
        "实时系统",
        "部署与兼容"
      ],
      "summary": "手机硬件友好的块扭曲、整数推理和流水线",
      "question": "重点问题：完整编解码延迟、并行度与硬件成本？",
      "caveat": "实时解码与约3FPS编码分开；量化有RD成本",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5,
        7
      ],
      "localPdf": "https://openaccess.thecvf.com/content/WACV2024/papers/van_Rozendaal_MobileNVC_Real-Time_1080p_Neural_Video_Compression_on_a_Mobile_Device_WACV_2024_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/WACV2024/papers/van_Rozendaal_MobileNVC_Real-Time_1080p_Neural_Video_Compression_on_a_Mobile_Device_WACV_2024_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        }
      ],
      "evidence": [],
      "sha256": "39559c1260c55aa18c7bd3ada0595fbcf9c0307b57e09e71cb74b6ccd96cb4d9",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "COMPRESSAI",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        },
        {
          "id": "DCVCRT",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCVCRT",
      "title": "Towards Practical Real-Time Neural Video Compression",
      "authors": [
        "Zhaoyang Jia",
        "Bin Li",
        "Jiahao Li",
        "Wenxuan Xie",
        "Linfeng Qi",
        "Houqiang Li",
        "Yan Lu"
      ],
      "year": 2025,
      "venue": "CVPR 2025",
      "version": "official proceedings PDF",
      "fields": [
        "03",
        "16",
        "02",
        "04"
      ],
      "tags": [
        "实时系统",
        "部署与兼容",
        "表示与参考",
        "参考失效"
      ],
      "summary": "隐式时域建模、低分辨率运算及执行优化",
      "question": "重点问题：完整编解码延迟、并行度与硬件成本？",
      "caveat": "GPU端到端成本；已有本项目真实流证据",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/papers/Jia_Towards_Practical_Real-Time_Neural_Video_Compression_CVPR_2025_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/papers/Jia_Towards_Practical_Real-Time_Neural_Video_Compression_CVPR_2025_paper.pdf",
      "codeUrl": "https://github.com/microsoft/DCVC",
      "notes": [
        {
          "label": "RT_复杂度与可验证假设",
          "url": "../notes/RT_%E5%A4%8D%E6%9D%82%E5%BA%A6%E4%B8%8E%E5%8F%AF%E9%AA%8C%E8%AF%81%E5%81%87%E8%AE%BE.md.html"
        },
        {
          "label": "DCVC学习笔记",
          "url": "../DCVC%E5%AD%A6%E4%B9%A0%E7%AC%94%E8%AE%B0.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [
        {
          "label": "实际视频码流与刷新RD（本地记录未公开）",
          "url": "",
          "type": "experiment",
          "scope": "原生720p单片段、多码率刷新对照；不是完整论文测试集排名。"
        },
        {
          "label": "受控图案P阈值实验（本地记录未公开）",
          "url": "",
          "type": "experiment",
          "scope": "固定首I和受控图案的机制实验，具体成功点见报告。"
        }
      ],
      "sha256": "84844e2a0b57a62b8992f8e54dec58843a6b1a2d9e8e0f2be87365b8e5d238f6",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVCFM",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        },
        {
          "id": "DCVCUF",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        },
        {
          "id": "MOBILENVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        },
        {
          "id": "GRACE",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCVCUF",
      "title": "Ultra-Fast Neural Video Compression",
      "authors": [
        "Jiahao Li",
        "Wenxuan Xie",
        "Zhaoyang Jia",
        "Bin Li",
        "Zongyu Guo",
        "Xiaoyi Zhang",
        "Yan Lu"
      ],
      "year": 2026,
      "venue": "arXiv 2026",
      "version": "arXiv v1, 2026-06-03",
      "fields": [
        "03",
        "16",
        "01",
        "05"
      ],
      "tags": [
        "实时系统",
        "部署与兼容",
        "熵模型",
        "双向编码"
      ],
      "summary": "分块吞吐和熵解码的执行路线",
      "question": "重点问题：完整编解码延迟、并行度与硬件成本？",
      "caveat": "HT/LD等分支应在同一条件分别评价",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://arxiv.org/pdf/2606.04410v1",
      "sourceUrl": "https://arxiv.org/pdf/2606.04410v1",
      "codeUrl": "https://github.com/microsoft/DCVC",
      "notes": [
        {
          "label": "UF_分块吞吐与熵解码精读",
          "url": "../notes/UF_%E5%88%86%E5%9D%97%E5%90%9E%E5%90%90%E4%B8%8E%E7%86%B5%E8%A7%A3%E7%A0%81%E7%B2%BE%E8%AF%BB.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        }
      ],
      "evidence": [
        {
          "label": "分块与计时合同（本地记录未公开）",
          "url": "",
          "type": "code",
          "scope": "固定源码与计算合同；未运行UF神经模型。"
        }
      ],
      "sha256": "0953a59fad84b48c08639bd2d0542a9814543bd077123f1d54bb5db636d34eb5",
      "pages": 15,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVCRT",
          "type": "reading_path",
          "reason": "建议阅读顺序：从DVC走到实时DCVC"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DCMVC",
      "title": "Neural Video Compression with Context Modulation",
      "authors": [
        "Chuanbo Tang",
        "Zhuoyuan Li",
        "Yifan Bian",
        "Li Li",
        "Dong Liu"
      ],
      "year": 2025,
      "venue": "CVPR 2025",
      "version": "CVPR 2025 official proceedings PDF",
      "fields": [
        "04",
        "10"
      ],
      "tags": [
        "参考失效",
        "训练与量化"
      ],
      "summary": "像素派生与传播上下文互补融合",
      "question": "重点问题：场景切换、误差传播与条件可靠性？",
      "caveat": "额外运动计算与长训练贡献需分开",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/papers/Tang_Neural_Video_Compression_with_Context_Modulation_CVPR_2025_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/papers/Tang_Neural_Video_Compression_with_Context_Modulation_CVPR_2025_paper.pdf",
      "codeUrl": "https://github.com/Austin4USTC/DCMVC",
      "notes": [
        {
          "label": "DCMVC与DCVC_DT_上下文调制和推理适配",
          "url": "../notes/DCMVC%E4%B8%8EDCVC_DT_%E4%B8%8A%E4%B8%8B%E6%96%87%E8%B0%83%E5%88%B6%E5%92%8C%E6%8E%A8%E7%90%86%E9%80%82%E9%85%8D.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a8ac83961d31471e88521bab52315a1675f6a30048185bc40da4dc6838b570c9",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "BIECVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        },
        {
          "id": "DCVCFM",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "UIIC",
      "title": "Real-Time Neural Video Compression with Unified Intra and Inter Coding",
      "authors": [
        "Hui Xiang",
        "Yifan Bian",
        "Li Li",
        "Jingran Wu",
        "Xianguo Zhang",
        "Dong Liu"
      ],
      "year": 2026,
      "venue": "CVPR 2026",
      "version": "official CVF open access PDF",
      "fields": [
        "04",
        "10"
      ],
      "tags": [
        "参考失效",
        "训练与量化"
      ],
      "summary": "统一处理帧内/帧间信息与参考退化",
      "question": "重点问题：场景切换、误差传播与条件可靠性？",
      "caveat": "既有笔记标明评价和真实流证据边界",
      "readingLevel": "prior",
      "readingLabel": "承接既有阅读笔记",
      "readPages": [],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2026/papers/Xiang_Real-Time_Neural_Video_Compression_with_Unified_Intra_and_Inter_Coding_CVPR_2026_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2026/papers/Xiang_Real-Time_Neural_Video_Compression_with_Unified_Intra_and_Inter_Coding_CVPR_2026_paper.pdf",
      "codeUrl": "https://github.com/ihuixiang/UIIC",
      "notes": [
        {
          "label": "UIIC_统一帧内帧间与刷新问题",
          "url": "../notes/UIIC_%E7%BB%9F%E4%B8%80%E5%B8%A7%E5%86%85%E5%B8%A7%E9%97%B4%E4%B8%8E%E5%88%B7%E6%96%B0%E9%97%AE%E9%A2%98.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cbf2be87c76a175935dcd04a4269febfeb57b6230f21145bb6c20f0302139c53",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "VCT",
      "title": "VCT: A Video Compression Transformer",
      "authors": [
        "Fabian Mentzer",
        "George Toderici",
        "David Minnen",
        "Sung Jin Hwang",
        "Sergi Caelles",
        "Mario Lucic",
        "Eirikur Agustsson"
      ],
      "year": 2022,
      "venue": "NeurIPS 2022",
      "version": "NeurIPS 2022 proceedings",
      "fields": [
        "01",
        "02",
        "03"
      ],
      "tags": [
        "熵模型",
        "表示与参考",
        "实时系统"
      ],
      "summary": "独立帧潜变量的时间概率建模及LRP",
      "question": "重点问题：潜变量分布、侧信息、量化与解码依赖？",
      "caveat": "块内16步、较大Transformer、不同训练数据",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        3,
        4,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://papers.nips.cc/paper_files/paper/2022/file/54dcf25318f9de5a7a01f0a4125c541e-Paper-Conference.pdf",
      "sourceUrl": "https://papers.nips.cc/paper_files/paper/2022/file/54dcf25318f9de5a7a01f0a4125c541e-Paper-Conference.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [
        {
          "label": "参考状态源码审计（本地记录未公开）",
          "url": "",
          "type": "code",
          "scope": "源码依赖检查，无模型实测。"
        }
      ],
      "sha256": "7cb0c9369e44ed3480ee14d3eb559ab2ad7395805b21f94858cdcb5cbfc3a788",
      "pages": 13,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "EPA",
      "title": "Content Adaptive and Error Propagation Aware Deep Video Compression",
      "authors": [
        "Guo Lu",
        "Chunlei Cai",
        "Xiaoyun Zhang",
        "Li Chen",
        "Wanli Ouyang",
        "Dong Xu",
        "Zhiyong Gao"
      ],
      "year": 2020,
      "venue": "",
      "version": "ECCV 2020 proceedings",
      "fields": [
        "10"
      ],
      "tags": [
        "训练与量化"
      ],
      "summary": "用联合多帧训练关注误差传播，并研究内容自适应编码。",
      "question": "重点问题：训练域、长链、松弛目标与数值稳定性？",
      "caveat": "训练链长、在线更新与新增算力不能混为单项结构收益。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        6,
        7,
        8,
        13
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2020/papers_ECCV/papers/123470443.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2020/papers_ECCV/papers/123470443.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "d1e18b2cd0e64425438a274711da7388bf988faa39db2a14c865937777cde422",
      "pages": 17,
      "addedThisRound": false,
      "relations": [
        {
          "id": "MASKCRT",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "UQ",
      "title": "Universally Quantized Neural Compression",
      "authors": [
        "Eirikur Agustsson",
        "Lucas Theis"
      ],
      "year": 2020,
      "venue": "NeurIPS 2020",
      "version": "NeurIPS 2020 proceedings",
      "fields": [
        "10",
        "01"
      ],
      "tags": [
        "训练与量化",
        "熵模型"
      ],
      "summary": "用通用量化连接加性噪声训练与实际量化过程。",
      "question": "重点问题：训练域、长链、松弛目标与数值稳定性？",
      "caveat": "随机量化的共享信息和率失真条件需要明确；不是任意实现都自动一致。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        4,
        7
      ],
      "localPdf": "https://papers.neurips.cc/paper_files/paper/2020/file/92049debbe566ca5782a3045cf300a3c-Paper.pdf",
      "sourceUrl": "https://papers.neurips.cc/paper_files/paper/2020/file/92049debbe566ca5782a3045cf300a3c-Paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "08b8083612738e071ada26042e7f1b7fa08200ed1d08768b451937143776c88a",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "NRC",
      "title": "Neural Rate Control for Learned Video Compression",
      "authors": [
        "Yiwei Zhang",
        "Guo Lu",
        "Yunuo Chen",
        "Shen Wang",
        "Yibo Shi",
        "Jing Wang",
        "Li Song"
      ],
      "year": 2024,
      "venue": "ICLR 2024",
      "version": "ICLR 2024 proceedings",
      "fields": [
        "11",
        "06"
      ],
      "tags": [
        "码率控制",
        "编码端搜索"
      ],
      "summary": "用分层预算与码率实现模块控制目标码率。",
      "question": "重点问题：预算、前瞻与跨帧依赖下的分配？",
      "caveat": "要同时检查目标误差、帧预算和前瞻等待，不能只比较固定质量RD。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        4,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://proceedings.iclr.cc/paper_files/paper/2024/file/8c1d92835eb4e601f396c97ec60439fe-Paper-Conference.pdf",
      "sourceUrl": "https://proceedings.iclr.cc/paper_files/paper/2024/file/8c1d92835eb4e601f396c97ec60439fe-Paper-Conference.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "b5989f47b2de1570de08dc83aaac5887a8b310f04fe48f710e2ad7b72af897e5",
      "pages": 15,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "BAO",
      "title": "Bit Allocation using Optimization",
      "authors": [
        "Tongda Xu",
        "Han Gao",
        "Chenjian Gao",
        "Yuanyuan Wang",
        "Dailan He",
        "Jinyong Pi",
        "Jixiang Luo",
        "Ziyu Zhu",
        "Mao Ye",
        "Hongwei Qin",
        "Yan Wang",
        "Jingjing Liu",
        "Ya-Qin Zhang"
      ],
      "year": 2023,
      "venue": "ICML 2023",
      "version": "ICML 2023 proceedings",
      "fields": [
        "11",
        "06"
      ],
      "tags": [
        "码率控制",
        "编码端搜索"
      ],
      "summary": "利用未来帧依赖优化当前比特分配与潜变量。",
      "question": "重点问题：预算、前瞻与跨帧依赖下的分配？",
      "caveat": "准确、近似与截断算法分开；编码搜索时间与实际码流计费另核。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://proceedings.mlr.press/v202/xu23c/xu23c.pdf",
      "sourceUrl": "https://proceedings.mlr.press/v202/xu23c/xu23c.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "精读笔记（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "1412be76906d1155b4a48767f4cb2dc7fa5880b2ef46e41add4cb88f20ebc3ec",
      "pages": 23,
      "addedThisRound": false,
      "relations": [
        {
          "id": "SGA",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        },
        {
          "id": "IADP",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "ELFVC",
      "title": "ELF-VC: Efficient Learned Flexible-Rate Video Coding",
      "authors": [
        "Oren Rippel",
        "Alexander G. Anderson",
        "Kedar Tatwawadi",
        "Sanjay Nair",
        "Craig Lytle",
        "Lubomir Bourdev"
      ],
      "year": 2021,
      "venue": "",
      "version": "ICCV 2021 proceedings",
      "fields": [
        "11",
        "06"
      ],
      "tags": [
        "码率控制",
        "编码端搜索"
      ],
      "summary": "把灵活码率与高效学习式视频编码共同设计。",
      "question": "重点问题：预算、前瞻与跨帧依赖下的分配？",
      "caveat": "不同质量设置、时延和硬件下的数字不可直接混用。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        4
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2021/papers/Rippel_ELF-VC_Efficient_Learned_Flexible-Rate_Video_Coding_ICCV_2021_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2021/papers/Rippel_ELF-VC_Efficient_Learned_Flexible-Rate_Video_Coding_ICCV_2021_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "115d2bbe1f17811023c2b17f2b0e9d60906f391cfd13fac21a20c72554c4a798",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "GRACE",
      "title": "GRACE: Loss-Resilient Real-Time Video through Neural Codecs",
      "authors": [
        "Yihua Cheng",
        "Ziyi Zhang",
        "Hanchen Li",
        "Anton Arapin",
        "Yue Zhang",
        "Qizheng Zhang",
        "Yuhan Liu",
        "Kuntai Du",
        "Xu Zhang",
        "Francis Y. Yan",
        "Amrita Mazumdar",
        "Nick Feamster",
        "Junchen Jiang"
      ],
      "year": 2024,
      "venue": "USENIX NSDI 2024",
      "version": "NSDI 2024 proceedings",
      "fields": [
        "13",
        "03"
      ],
      "tags": [
        "网络传输",
        "实时系统"
      ],
      "summary": "让神经视频编码面向丢包恢复，并设计传输和重同步系统。",
      "question": "重点问题：擦除、反馈、信道变化与同步？",
      "caveat": "公开模型入口不等于原系统网络复现；当前本地只有合同与源码审阅。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        5,
        6,
        7,
        8,
        9,
        10
      ],
      "localPdf": "https://www.usenix.org/system/files/nsdi24-cheng.pdf",
      "sourceUrl": "https://www.usenix.org/system/files/nsdi24-cheng.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [
        {
          "label": "丢包与重同步合同（本地记录未公开）",
          "url": "",
          "type": "code",
          "scope": "静态合同和数学例子，不是网络复现。"
        }
      ],
      "sha256": "73e3b0d733c21de0c2809b943475c60f297c72296e9701b2dd62384374bb0b28",
      "pages": 24,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVCRT",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        },
        {
          "id": "WRAPPER",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        },
        {
          "id": "DEEPWIVE",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        },
        {
          "id": "RELVIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DEEPWIVE",
      "title": "DeepWiVe: Deep-Learning-Aided Wireless Video Transmission",
      "authors": [
        "Tze-Yang Tung",
        "Deniz Gündüz"
      ],
      "year": 2021,
      "venue": "",
      "version": "arXiv 2111.13034v1; not a claim to be the later journal version",
      "fields": [
        "13"
      ],
      "tags": [
        "网络传输"
      ],
      "summary": "联合设计视频表示与无线信道传输。",
      "question": "重点问题：擦除、反馈、信道变化与同步？",
      "caveat": "信道使用次数和信噪比不是传统文件bpp，须统一传输条件。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        4,
        5,
        6,
        7
      ],
      "localPdf": "https://arxiv.org/pdf/2111.13034v1",
      "sourceUrl": "https://arxiv.org/pdf/2111.13034v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "4d1e566263f5eed104e1be9c9540d8c66a96f24574727c3e6b9c1f0bcc0df013",
      "pages": 13,
      "addedThisRound": false,
      "relations": [
        {
          "id": "SWINJSCC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        },
        {
          "id": "GRACE",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "TASKCTRL",
      "title": "Task-Aware Encoder Control for Deep Video Compression",
      "authors": [
        "Xingtong Ge",
        "Jixiang Luo",
        "Xinjie Zhang",
        "Tongda Xu",
        "Guo Lu",
        "Dailan He",
        "Jing Geng",
        "Yan Wang",
        "Jun Zhang",
        "Hongwei Qin"
      ],
      "year": 2024,
      "venue": "",
      "version": "CVPR 2024 proceedings",
      "fields": [
        "14"
      ],
      "tags": [
        "机器视觉"
      ],
      "summary": "在编码端控制压缩，使重建更适合下游视觉任务。",
      "question": "重点问题：像素保真与下游任务性能的取舍？",
      "caveat": "任务改善不自动等价于像素保真或对其他任务的泛化。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        4,
        5,
        6
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2024/papers/Ge_Task-Aware_Encoder_Control_for_Deep_Video_Compression_CVPR_2024_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2024/papers/Ge_Task-Aware_Encoder_Control_for_Deep_Video_Compression_CVPR_2024_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "e99f64584750267094e9dc2f52400481f17c4d5bc8282d74f6a565ee8c42b9f0",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "TRANSTIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "HDRSVC",
      "title": "High Dynamic Range Video Compression: A Large-Scale Benchmark Dataset and A Learned Bit-depth Scalable Compression Algorithm",
      "authors": [
        "Zhaoyi Tian",
        "Feifeng Wang",
        "Shiwei Wang",
        "Zihao Zhou",
        "Yao Zhu",
        "Liquan Shen"
      ],
      "year": 2025,
      "venue": "",
      "version": "CVPR 2025 proceedings",
      "fields": [
        "12",
        "15",
        "09"
      ],
      "tags": [
        "可伸缩编码",
        "内容与数据",
        "评价方法"
      ],
      "summary": "构建HDR视频数据并研究位深可伸缩压缩。",
      "question": "重点问题：空间、质量和位深层的独立性与代价？",
      "caveat": "必须保留位深、色彩转换和基础/增强层的完整码量。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        4,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/papers/Tian_High_Dynamic_Range_Video_Compression_A_Large-Scale_Benchmark_Dataset_and_CVPR_2025_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/papers/Tian_High_Dynamic_Range_Video_Compression_A_Large-Scale_Benchmark_Dataset_and_CVPR_2025_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "3aec4b8786a3ab2cfba525844c86b2a0444786625a0f89f93b7734e02d227f9b",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "S_NVRC",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "N360",
      "title": "Beyond Perspective: Neural 360-Degree Video Compression",
      "authors": [
        "Andy Regensky",
        "Marc Windsheimer",
        "Fabian Brand",
        "André Kaup"
      ],
      "year": 2025,
      "venue": "",
      "version": "ICCV 2025 proceedings",
      "fields": [
        "15"
      ],
      "tags": [
        "内容与数据"
      ],
      "summary": "利用全景投影几何与时域编码适配360度视频。",
      "question": "重点问题：屏幕、HDR、全景及训练测试分布？",
      "caveat": "投影域与视口域评价分开；本地核过源码但未运行该模型。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        3,
        4,
        5,
        6,
        7
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2025/papers/Regensky_Beyond_Perspective_Neural_360-Degree_Video_Compression_ICCV_2025_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2025/papers/Regensky_Beyond_Perspective_Neural_360-Degree_Video_Compression_ICCV_2025_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [
        {
          "label": "固定源码审读（本地记录未公开）",
          "url": "",
          "type": "code",
          "scope": "固定源码核对，未运行模型。"
        }
      ],
      "sha256": "43ce6e7e7dd13b07854fd9c64e7c5a1245798434a57093c92af34d014c47265a",
      "pages": 11,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "LSCD",
      "title": "LSCD: A Large-Scale Screen Content Dataset for Video Compression",
      "authors": [
        "Yuhao Cheng",
        "Siru Zhang",
        "Yiqiang Yan",
        "Rong Chen",
        "Yun Zhang"
      ],
      "year": 2023,
      "venue": "",
      "version": "arXiv 2308.09332v1",
      "fields": [
        "15",
        "09"
      ],
      "tags": [
        "内容与数据",
        "评价方法"
      ],
      "summary": "提供用于屏幕视频压缩研究的大规模内容数据集。",
      "question": "重点问题：屏幕、HDR、全景及训练测试分布？",
      "caveat": "屏幕文本和线条的局部失真未必被平均自然图像指标充分覆盖。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        4,
        5,
        8
      ],
      "localPdf": "https://arxiv.org/pdf/2308.09332v1",
      "sourceUrl": "https://arxiv.org/pdf/2308.09332v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cc60f2f6644f0b00d3d52e89974f4111f86742074887bcb3f4308b45abd54cd0",
      "pages": 21,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "NERSC",
      "title": "NeR-SC: Adapting Neural Video Representation to Screen Content",
      "authors": [
        "Ruohan Shi",
        "Jiaoyan Zhao",
        "Haogang Feng"
      ],
      "year": 2026,
      "venue": "",
      "version": "arXiv 2605.27024v1; preprint",
      "fields": [
        "15"
      ],
      "tags": [
        "内容与数据"
      ],
      "summary": "把逐视频神经表示适配到屏幕内容。",
      "question": "重点问题：屏幕、HDR、全景及训练测试分布？",
      "caveat": "骨干源码不等于该论文完整可复现实现，参数和拟合成本需计入。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        2,
        3,
        5
      ],
      "localPdf": "https://arxiv.org/pdf/2605.27024v1",
      "sourceUrl": "https://arxiv.org/pdf/2605.27024v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "8f7f427269f49d64eb98f8e13bbdf64d5a179c68ca86edff57f62a4434e1c4c5",
      "pages": 6,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "WRAPPER",
      "title": "Perceptual Video Compression with Neural Wrapping",
      "authors": [
        "Muhammad Umar Karim Khan",
        "Aaron Chadha",
        "Mohammad Ashraful Anam",
        "Yiannis Andreopoulos"
      ],
      "year": 2025,
      "venue": "",
      "version": "CVPR 2025 proceedings",
      "fields": [
        "16",
        "08"
      ],
      "tags": [
        "部署与兼容",
        "感知生成"
      ],
      "summary": "用神经前后处理包裹标准视频编解码器以改善感知效果。",
      "question": "重点问题：整数推理、数值一致性及标准封装？",
      "caveat": "标准码流兼容不代表接收端没有神经处理成本。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        4,
        5,
        6,
        8
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/papers/Khan_Perceptual_Video_Compression_with_Neural_Wrapping_CVPR_2025_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/papers/Khan_Perceptual_Video_Compression_with_Neural_Wrapping_CVPR_2025_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "c104b160e585d9f1f3495ed689fd8f256329cd459032bc51167b0064d063d916",
      "pages": 12,
      "addedThisRound": false,
      "relations": [
        {
          "id": "GRACE",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "MS_SSIM_2003",
      "title": "Multi-scale Structural Similarity for Image Quality Assessment",
      "authors": [
        "Zhou Wang",
        "Eero P. Simoncelli",
        "Alan C. Bovik"
      ],
      "year": 2003,
      "venue": "",
      "version": "Author-hosted Asilomar 2003 paper",
      "fields": [
        "09",
        "08"
      ],
      "tags": [
        "评价方法",
        "感知生成"
      ],
      "summary": "多尺度结构相似度与尺度权重标定；本轮与实际彩色屏幕保真评价分列",
      "question": "重点问题：RD、视觉指标、数据集和统计比较？",
      "caveat": "原始灰度/主观验证范围不直接保证屏幕颜色和任务保真；当前仅三帧实际输出评分",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5
      ],
      "localPdf": "https://ece.uwaterloo.ca/~z70wang/publications/msssim.pdf",
      "sourceUrl": "https://ece.uwaterloo.ca/~z70wang/publications/msssim.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "研究报告（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [
        {
          "label": "彩色屏幕评分复核（本地记录未公开）",
          "url": "",
          "type": "analysis",
          "scope": "三帧既有实际输出的离线指标，不是论文评价集复现。"
        }
      ],
      "sha256": "0770681d228ed8cf14e52add95385296a7d189fe3f97a3b5e551578e37e7d1aa",
      "pages": 5,
      "addedThisRound": false,
      "relations": [
        {
          "id": "SSIM_2004",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        },
        {
          "id": "VIF",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "NIC_SPECTRAL",
      "title": "Neural Image Compression: Generalization, Robustness, and Spectral Biases",
      "authors": [
        "Kelsey Lieberman",
        "James Diffenderfer",
        "Charles Godfrey",
        "Bhavya Kailkhura"
      ],
      "year": 2023,
      "venue": "NeurIPS 2023",
      "version": "NeurIPS2023 proceedings",
      "fields": [
        "10",
        "15"
      ],
      "tags": [
        "训练与量化",
        "内容与数据"
      ],
      "summary": "研究神经图像压缩的泛化、鲁棒性与频谱偏差。",
      "question": "重点问题：训练域、长链、松弛目标与数值稳定性？",
      "caveat": "图像域观察不能直接证明本项目视频时域退化根因。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        17,
        18,
        19,
        32,
        33,
        34,
        35,
        36,
        37
      ],
      "localPdf": "https://papers.neurips.cc/paper_files/paper/2023/file/f3c5e56274140e0420baa3916c529210-Paper-Conference.pdf",
      "sourceUrl": "https://papers.neurips.cc/paper_files/paper/2023/file/f3c5e56274140e0420baa3916c529210-Paper-Conference.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "精读笔记（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "ab57838c34fd1d32c32b98ce14a950d1cc081f17582846e7fee382be606d9ad1",
      "pages": 41,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "FFL",
      "title": "Focal Frequency Loss for Image Reconstruction and Synthesis",
      "authors": [
        "Liming Jiang",
        "Bo Dai",
        "Wayne Wu",
        "Chen Change Loy"
      ],
      "year": 2021,
      "venue": "",
      "version": "ICCV2021 proceedings",
      "fields": [
        "10",
        "15"
      ],
      "tags": [
        "训练与量化",
        "内容与数据"
      ],
      "summary": "用动态频率权重强调重建困难的频率成分。",
      "question": "重点问题：训练域、长链、松弛目标与数值稳定性？",
      "caveat": "无权FFT-L2等价于像素L2；频率权重与梯度路径才带来目标变化。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2021/papers/Jiang_Focal_Frequency_Loss_for_Image_Reconstruction_and_Synthesis_ICCV_2021_paper.pdf",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2021/papers/Jiang_Focal_Frequency_Loss_for_Image_Reconstruction_and_Synthesis_ICCV_2021_paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "精读笔记（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "93b714f58eb3003a52ea16b66fac6a7c92415ada20bbc5b26c7da40af57cd887",
      "pages": 11,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "IADP",
      "title": "Overfitting for Fun and Profit: Instance-Adaptive Data Compression",
      "authors": [
        "Ties van Rozendaal",
        "Iris A.M. Huijben",
        "Taco S. Cohen"
      ],
      "year": 2021,
      "venue": "ICLR 2021",
      "version": "arXiv2101.08687v2,2021-06-01;ICLR2021 accepted manuscript",
      "fields": [
        "06",
        "07"
      ],
      "tags": [
        "编码端搜索",
        "隐式表示"
      ],
      "summary": "逐实例更新压缩模型，同时计入模型更新的传输代价。",
      "question": "重点问题：潜变量或参数优化的收益与总成本？",
      "caveat": "参数码率、量化后解码器与独立接收端必须共同核对。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        12,
        13,
        14,
        15,
        16
      ],
      "localPdf": "https://arxiv.org/pdf/2101.08687v2",
      "sourceUrl": "https://arxiv.org/pdf/2101.08687v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "研究报告（本地记录未公开）",
          "url": ""
        },
        {
          "label": "精读笔记（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        }
      ],
      "evidence": [],
      "sha256": "404a6973e208ef3040c7de20885e0b99f2a85cb2e298e675a724cb9580492df4",
      "pages": 18,
      "addedThisRound": false,
      "relations": [
        {
          "id": "BAO",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        },
        {
          "id": "PEIAVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "SGA",
      "title": "Improving Inference for Neural Image Compression",
      "authors": [
        "Yibo Yang",
        "Robert Bamler",
        "Stephan Mandt"
      ],
      "year": 2020,
      "venue": "NeurIPS 2020",
      "version": "NeurIPS 2020 proceedings",
      "fields": [
        "06",
        "01",
        "10"
      ],
      "tags": [
        "编码端搜索",
        "熵模型",
        "训练与量化"
      ],
      "summary": "用随机退火等方式优化压缩潜变量，减小推理时量化间隙。",
      "question": "重点问题：潜变量或参数优化的收益与总成本？",
      "caveat": "SGA与SGA+BB分开；估计熵不等于完整文件码率。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9
      ],
      "localPdf": "https://papers.nips.cc/paper_files/paper/2020/file/066f182b787111ed4cb65ed437f0855b-Paper.pdf",
      "sourceUrl": "https://papers.nips.cc/paper_files/paper/2020/file/066f182b787111ed4cb65ed437f0855b-Paper.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "研究报告（本地记录未公开）",
          "url": ""
        },
        {
          "label": "精读笔记（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "补充材料（单独PDF，不计独立论文）",
          "url": "../reference/papers/SGA-NeurIPS2020-supp.pdf"
        }
      ],
      "evidence": [
        {
          "label": "相关DC I搜索探针（本地记录未公开）",
          "url": "",
          "type": "analysis",
          "scope": "自有STE对照，不是SGA原方法复现。"
        }
      ],
      "sha256": "c7ae2e82656927a0b6721b7ec34d6af9a4f895661b892028841246d5a96fa0b6",
      "pages": 12,
      "addedThisRound": false,
      "relations": [
        {
          "id": "BAO",
          "type": "reading_path",
          "reason": "建议阅读顺序：内容适配究竟付出什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "NAFNet",
      "title": "Simple Baselines for Image Restoration",
      "authors": [
        "Liangyu Chen",
        "Xiaojie Chu",
        "Xiangyu Zhang",
        "Jian Sun"
      ],
      "year": 2022,
      "venue": "",
      "version": "ECCV 2022 ECVA proceedings PDF",
      "fields": [
        "10",
        "04",
        "02"
      ],
      "tags": [
        "训练与量化",
        "参考失效",
        "表示与参考"
      ],
      "summary": "用SimpleGate、预归一化及残差缩放建立图像复原基线。",
      "question": "重点问题：训练域、长链、松弛目标与数值稳定性？",
      "caveat": "该论文不是视频codec；其训练经验不构成任意FP32推理的安全保证。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136670017.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136670017.pdf",
      "codeUrl": "https://github.com/megvii-research/NAFNet",
      "notes": [
        {
          "label": "精读笔记（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [
        {
          "label": "固定源码与训练边界（本地记录未公开）",
          "url": "",
          "type": "code",
          "scope": "只审阅源码与选页，没有运行NAFNet模型。"
        }
      ],
      "sha256": "3bf796aae4bba78a371b272edd90a225f5263ec5b980591a4e99e39dca452ab4",
      "pages": 17,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DCVCFM",
          "type": "reading_path",
          "reason": "建议阅读顺序：不可靠参考与训练范围"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "E2EIC",
      "title": "End-to-end Optimized Image Compression",
      "authors": [
        "Johannes Ballé",
        "Valero Laparra",
        "Eero P. Simoncelli"
      ],
      "year": 2017,
      "venue": "ICLR 2017",
      "version": "ICLR 2017 author final PDF",
      "fields": [
        "01",
        "02",
        "10"
      ],
      "tags": [
        "非线性变换",
        "GDN",
        "量化代理",
        "率失真训练",
        "熵模型",
        "表示与参考",
        "训练与量化"
      ],
      "summary": "将图像送入多级卷积与 GDN 非线性分析变换，随后做均匀标量量化和熵编码，再用可学习合成变换重建。训练中以均匀噪声替代不可微量化，联合优化码率与失真；文章明确区分熵估计和实际码流，并报告实际码率。",
      "question": "同一潜变量分布中，量化代理带来的训练误差与熵模型不匹配分别如何影响实际 bpp？",
      "caveat": "这是静态图像基础模型。论文比较对象、颜色处理、图像裁边与现代 DCVC 视频实验不同；官网后续 TensorFlow 代码和无熵编码的 MATLAB 示例也不能直接当作论文原始完整实现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://www.cns.nyu.edu/~lcv/iclr2017/",
      "sourceUrl": "https://www.cns.nyu.edu/~lcv/iclr2017/",
      "codeUrl": "https://github.com/tensorflow/compression",
      "notes": [
        {
          "label": "E2EIC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "E2EIC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "E2EIC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "6494a7f4903cb22e8ba07afe1b3e4c2ad99484ee75f91b5dff6fe31de1efd0cf",
      "pages": 27,
      "addedThisRound": false,
      "relations": [
        {
          "id": "CAE2017",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CHENG2020",
      "title": "Learned Image Compression with Discretized Gaussian Mixture Likelihoods and Attention Modules",
      "authors": [
        "Zhengxue Cheng",
        "Heming Sun",
        "Masaru Takeuchi",
        "Jiro Katto"
      ],
      "year": 2020,
      "venue": "CVPR 2020",
      "version": "CVPR 2020 proceedings PDF",
      "fields": [
        "01",
        "02"
      ],
      "tags": [
        "高斯混合",
        "熵模型",
        "注意力",
        "图像压缩",
        "表示与参考"
      ],
      "summary": "把潜变量概率从较受限制的分布族扩展为离散化高斯混合，并在变换中引入简化注意力模块。熵模型通过更准确的概率分配改善编码长度，也改变率失真训练中的梯度；注意力则改善表示和重建。",
      "question": "高斯混合的额外参数和概率计算耗时，能否被真实码流节省抵消？在强时域条件下仍有多少剩余收益？",
      "caveat": "作者接近 VVC 的表述针对 VTM 5.2 intra 和所列图像测试条件，不是当前 VVC 配置或视频压缩结论；不能用 MS-SSIM 优化模型的视觉示例替代 PSNR 结论。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content_CVPR_2020/html/Cheng_Learned_Image_Compression_With_Discretized_Gaussian_Mixture_Likelihoods_and_Attention_CVPR_2020_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content_CVPR_2020/html/Cheng_Learned_Image_Compression_With_Discretized_Gaussian_Mixture_Likelihoods_and_Attention_CVPR_2020_paper.html",
      "codeUrl": "https://github.com/ZhengxueCheng/Learned-Image-Compression-with-GMM-and-Attention",
      "notes": [
        {
          "label": "CHENG2020_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CHENG2020_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CHENG2020_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "50cd3e3983777141747e328d415978a68f17c9c7a0ee8ec6837b0dcedce94f41",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "ARHYPER",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        },
        {
          "id": "CHARM",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CCM",
      "title": "Checkerboard Context Model for Efficient Learned Image Compression",
      "authors": [
        "Dailan He",
        "Yaoyan Zheng",
        "Baocheng Sun",
        "Yan Wang",
        "Hongwei Qin"
      ],
      "year": 2021,
      "venue": "CVPR 2021",
      "version": "CVPR 2021 proceedings PDF",
      "fields": [
        "01",
        "03"
      ],
      "tags": [
        "棋盘上下文",
        "并行熵解码",
        "空间依赖",
        "复杂度",
        "熵模型",
        "实时系统"
      ],
      "summary": "两轮棋盘条件预测将空间依赖分为锚点与非锚点；实际熵流仍分块按顺序解出。",
      "question": "参数预测、实际熵解码、重排和完整输出分别占多少时间？",
      "caveat": "Minnen/Kodak作者total44.63倍与参数预测274.19倍分母不同；AD计时是否包含未明确，原表单位和分项和存在疑点。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2021/html/He_Checkerboard_Context_Model_for_Efficient_Learned_Image_Compression_CVPR_2021_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2021/html/He_Checkerboard_Context_Model_for_Efficient_Learned_Image_Compression_CVPR_2021_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "CCM_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CCM_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CCM_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "依赖与计时精读（本地记录未公开）",
          "url": ""
        },
        {
          "label": "逐页与计时证据（本地记录未公开）",
          "url": ""
        },
        {
          "label": "官方补充材料（本地记录未公开）",
          "url": ""
        }
      ],
      "evidence": [],
      "sha256": "6a33083a3cf3705208267cd7219e46d63a0b1a0322222c9b425361c89b1515c2",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "CHARM",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        },
        {
          "id": "ELIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 本轮主文完整读页3,4,5,6,7,8；新覆盖3,7,8。补充、重读及图注范围见阶段证据，未声称阅读全文。"
    },
    {
      "id": "COMPRESSAI",
      "title": "CompressAI: a PyTorch library and evaluation platform for end-to-end compression research",
      "authors": [
        "Jean Bégaint",
        "Fabien Racapé",
        "Simon Feltman",
        "Akshay Pushparaja"
      ],
      "year": 2020,
      "venue": "arXiv preprint",
      "version": "arXiv:2011.03029v1 (2020-11-05)",
      "fields": [
        "03",
        "10"
      ],
      "tags": [
        "工具库",
        "率失真评价",
        "实际码流",
        "复现",
        "实时系统",
        "训练与量化"
      ],
      "summary": "提供面向压缩研究的 PyTorch 层、量化与熵模型操作、参考架构和评价工具，把训练、推理、真实编解码及传统 codec 对比组织到可重复流程中。论文中的模型由作者重新实现和训练，并报告 Kodak 的率失真评价。",
      "question": "同一模型的理论概率长度、熵编码流长度和带头信息文件长度是否一致？重新训练的模型应怎样与原论文权重区分？",
      "caveat": "2020 v1 论文当时主要实现静态图像压缩，不能以该论文推断今天库的全部功能；复现架构不等于复用原论文训练数据、训练过程或权重。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2011.03029v1",
      "sourceUrl": "https://arxiv.org/abs/2011.03029v1",
      "codeUrl": "https://github.com/InterDigitalInc/CompressAI",
      "notes": [
        {
          "label": "COMPRESSAI_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "COMPRESSAI_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "COMPRESSAI_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "f69c375c5654fa59deac522223daded776799dbbecacd02c2f9303a86f5de30b",
      "pages": 19,
      "addedThisRound": false,
      "relations": [
        {
          "id": "MOBILENVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从算法到可用系统"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "BITSWAP",
      "title": "Bit-Swap: Recursive Bits-Back Coding for Lossless Compression with Hierarchical Latent Variables",
      "authors": [
        "Friso H. Kingma",
        "Pieter Abbeel",
        "Jonathan Ho"
      ],
      "year": 2019,
      "venue": "ICML 2019 (PMLR 97)",
      "version": "ICML 2019 proceedings PDF",
      "fields": [
        "01"
      ],
      "tags": [
        "无损压缩",
        "bits-back",
        "ANS",
        "层次潜变量",
        "熵模型"
      ],
      "summary": "研究潜变量生成模型如何产生真正可解码的无损码流。通过在具有马尔可夫层次结构的潜变量模型中递归安排 bits-back 与 ANS 编解码，减少直接推广 BB-ANS 时随潜变量层数增长的额外位开销。",
      "question": "种子比特和有限长度开销如何计入单样本码率？若改成有损视频潜变量，是否仍满足所需后验与解码顺序？",
      "caveat": "这是无损压缩方法，指标中的 bits per dimension 不能直接当 RGB 视频 bpp。其层次结构假设和 bits-back 开销必须保留，不能据此宣称 DCVC 加上 VAE 就自动省码。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://proceedings.mlr.press/v97/kingma19a.html",
      "sourceUrl": "https://proceedings.mlr.press/v97/kingma19a.html",
      "codeUrl": "https://github.com/fhkingma/bitswap",
      "notes": [
        {
          "label": "BITSWAP_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "BITSWAP_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "BITSWAP_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "27de63ac467a0529276f44b3aaab75d241179fa03d4fd54521c72855d96b2582",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CANFVC",
      "title": "CANF-VC: Conditional Augmented Normalizing Flows for Video Compression",
      "authors": [
        "Yung-Han Ho",
        "Chih-Peng Chang",
        "Peng-Yu Chen",
        "Alessandro Gnutti",
        "Wen-Hsiao Peng"
      ],
      "year": 2022,
      "venue": "ECCV 2022",
      "version": "ECCV 2022 ECVA proceedings PDF",
      "fields": [
        "01",
        "02"
      ],
      "tags": [
        "条件编码",
        "归一化流",
        "运动编码",
        "视频压缩",
        "熵模型",
        "表示与参考"
      ],
      "summary": "用条件增强归一化流建立帧间条件生成模型，以运动补偿参考作为条件；并把条件编码思想延伸至运动编码。它把“只编码预测残差”的设计重新表述为学习给定参考后的分布，与条件 VAE 路线形成对照。",
      "question": "更强条件生成模型的收益来自变换表达力、运动条件还是熵模型？相同训练、参考结构和实际码流口径下如何分离？",
      "caveat": "条件熵的理论关系不保证有限容量、有限训练模型必然优于残差模型；复杂度、参考状态和测试配置仍需独立核对。本轮未运行 CANF-VC，也不把作者优于当时方法的结论外推到 DCVC-RT。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136760193.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136760193.pdf",
      "codeUrl": "https://github.com/NYCU-MAPL/CANF-VC",
      "notes": [
        {
          "label": "CANFVC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CANFVC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CANFVC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "2e02bf7b01115676c7b976b473ae13aa4584df428c3e1957604b05a1c5886d32",
      "pages": 17,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CAE2017",
      "title": "Lossy Image Compression with Compressive Autoencoders",
      "authors": [
        "Lucas Theis",
        "Wenzhe Shi",
        "Andrew Cunningham",
        "Ferenc Huszár"
      ],
      "year": 2017,
      "venue": "ICLR 2017",
      "version": "ICLR 2017 author-hosted proceedings PDF",
      "fields": [
        "01",
        "10"
      ],
      "tags": [
        "量化梯度",
        "熵代理",
        "自动编码器",
        "亚像素卷积",
        "熵模型",
        "训练与量化"
      ],
      "summary": "将可学习编码器、解码器与离散概率模型联合优化。为避免 rounding 的零梯度，前向仍执行舍入，只在反向传播中使用平滑代理的导数；论文明确指出变换的有限表达力和量化都可能带来失真。",
      "question": "前向真实量化和反向代理梯度分别保证了什么？若所有分支都改成同一种代理，概率学习与重建学习是否会失配？",
      "caveat": "本轮只读摘要、完整引言及方法开头；未完整读完量化代理推导或复现速度。早期图像基线与现代视频 codec 的训练规模、硬件和评价条件不同。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://theis.io/publications/20/",
      "sourceUrl": "https://theis.io/publications/20/",
      "codeUrl": "",
      "notes": [
        {
          "label": "CAE2017_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CAE2017_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CAE2017_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "149dd49732c1a8ad92de54b5c5a4bcd7875c76e76e5040a9b07de680c5fd8f15",
      "pages": 19,
      "addedThisRound": false,
      "relations": [
        {
          "id": "E2EIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        },
        {
          "id": "HYPERPRIOR",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CHARM",
      "title": "Channel-wise Autoregressive Entropy Models for Learned Image Compression",
      "authors": [
        "David Minnen",
        "Saurabh Singh"
      ],
      "year": 2020,
      "venue": "ICIP 2020",
      "version": "arXiv:2007.08739v1 (2020-07-17), author preprint of ICIP 2020",
      "fields": [
        "01",
        "03",
        "10"
      ],
      "tags": [
        "通道分组",
        "自回归熵模型",
        "潜变量残差预测",
        "并行解码",
        "熵模型",
        "实时系统",
        "训练与量化"
      ],
      "summary": "当前通道片依赖已修正支持片；解码后LRP结果继续作为后续条件。first-K与最近K支持具有不同依赖。",
      "question": "固定实现、权重与码流下，潜在独立后缀是否真实并行，是否影响完整解码耗时？",
      "caveat": "论文未给可横比的端到端测速表；固定官方源码为教育示例，默认first5、卷积及整除规则与主论文设置不同。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8
      ],
      "localPdf": "https://arxiv.org/abs/2007.08739v1",
      "sourceUrl": "https://arxiv.org/abs/2007.08739v1",
      "codeUrl": "https://github.com/tensorflow/compression/blob/dda8cb4c4364e657d13491227e886ff8014f7243/models/ms2020.py",
      "notes": [
        {
          "label": "CHARM_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CHARM_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CHARM_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "依赖与计时精读（本地记录未公开）",
          "url": ""
        },
        {
          "label": "逐页与计时证据（本地记录未公开）",
          "url": ""
        },
        {
          "label": "固定教学实现与论文差异（本地记录未公开）",
          "url": ""
        }
      ],
      "evidence": [],
      "sha256": "6abdb7310058010b8ed8b9abb129d9ff4b4b9a812010eeca316c36d62af92006",
      "pages": 16,
      "addedThisRound": false,
      "relations": [
        {
          "id": "CHENG2020",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        },
        {
          "id": "CCM",
          "type": "reading_path",
          "reason": "建议阅读顺序：理解潜变量、量化与熵编码"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 本轮主文完整读页2,3,4,5,6,7,8；新覆盖4,5,6,7,8。补充、重读及图注范围见阶段证据，未声称阅读全文。"
    },
    {
      "id": "SEVC",
      "title": "Augmented Deep Contexts for Spatially Embedded Video Coding",
      "authors": [
        "Yifan Bian",
        "Chuanbo Tang",
        "Li Li",
        "Dong Liu"
      ],
      "year": 2025,
      "venue": "CVPR 2025, pp. 2094–2104",
      "version": "CVF open-access accepted proceedings version; 11 pages; downloaded 2026-10-26",
      "fields": [
        "12"
      ],
      "tags": [
        "空间可伸缩",
        "低分辨率参考",
        "条件编码",
        "大运动",
        "新生物体",
        "比特分配",
        "可伸缩编码"
      ],
      "summary": "先编码4倍下采样的视频，使用其中的运动、特征和潜变量作为当前高分辨率帧的空间参考；MFCA逐级修正运动与特征，空间潜变量再查询多个历史潜变量形成熵先验。联合训练协调两部分码率。",
      "question": "空间基底的额外比特何时能抵消时间预测失效的代价？应按大运动、新出现区域和普通运动分层测量，并把两层比特都计入总码率。",
      "caveat": "论文以DCVC-DC为基底；页6为RGB/BT.601、96帧、IP32实验，不能直接与其他颜色/刷新设置的DCVC-RT结果拼接。低分辨率可解码不等于已验证任意层切换。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/html/Bian_Augmented_Deep_Contexts_for_Spatially_Embedded_Video_Coding_CVPR_2025_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/html/Bian_Augmented_Deep_Contexts_for_Spatially_Embedded_Video_Coding_CVPR_2025_paper.html",
      "codeUrl": "https://github.com/EsakaK/SEVC",
      "notes": [
        {
          "label": "SEVC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "2476aeb076b3558abe235cd458fcaa9c5e54b0df717988835376b70c84bdb972",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "LBSVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "USTC_TD",
      "title": "USTC-TD: A Test Dataset and Benchmark for Image and Video Coding in 2020s",
      "authors": [
        "Zhuoyuan Li",
        "Junqi Liao",
        "Chuanbo Tang",
        "Haotian Zhang",
        "Yuqi Li",
        "Yifan Bian",
        "Xihua Sheng",
        "Xinmin Feng",
        "Yao Li",
        "Changsheng Gao",
        "Li Li",
        "Dong Liu",
        "Feng Wu"
      ],
      "year": 2026,
      "venue": "IEEE Transactions on Multimedia 28, pp. 269–284 (early access 2025)",
      "version": "Accepted author manuscript; body current version 2025-03-13; IEEE accepted watermark 2025; final journal issue 2026. Local PDF is not the edited version of record.",
      "fields": [
        "09",
        "15"
      ],
      "tags": [
        "测试集",
        "照明",
        "镜头",
        "内容泛化",
        "主观评价",
        "基准",
        "评价方法",
        "内容与数据"
      ],
      "summary": "构建40幅4K图像和10段1080p视频，主动覆盖场景、纹理、运动及照明、镜头、阴影等因素；同时报告传统与学习式编码器的客观和主观质量基准。",
      "question": "已有DCVC-RT小片段是否遗漏低光、复杂照明和镜头变化？可按因素选择新增片段，并先审计训练集重叠。",
      "caveat": "这是测试集，不是训练库；本轮只读PDF第1–2页，未下载数据、未复现基准。作者网站数据使用限制需在后续使用时核对。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2409.08481",
      "sourceUrl": "https://arxiv.org/abs/2409.08481",
      "codeUrl": "",
      "notes": [
        {
          "label": "USTC_TD_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "80f427dfe157cdb7e95586b4163b62898c54db49e6c3ca09cc4e8beab4301ea2",
      "pages": 16,
      "addedThisRound": false,
      "relations": [
        {
          "id": "BD_BIBLE",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        },
        {
          "id": "BVI_CC",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "BVI_DVC",
      "title": "BVI-DVC: A Training Database for Deep Video Compression",
      "authors": [
        "Di Ma",
        "Fan Zhang",
        "David R. Bull"
      ],
      "year": 2021,
      "venue": "IEEE Transactions on Multimedia 24, pp. 3847–3858 (early access 2021; issue 2022)",
      "version": "arXiv:2003.13552v2, 2020-10-08; 11-page preprint. TMM publication metadata recorded separately; preprint compares three databases, institutional final abstract says five.",
      "fields": [
        "10"
      ],
      "tags": [
        "训练集",
        "动态纹理",
        "分辨率",
        "10bit",
        "泛化",
        "数据泄漏",
        "训练与量化"
      ],
      "summary": "从200个源片段生成4种分辨率共800条视频，覆盖动态纹理和10bit内容；用相同训练配置比较多种CNN和传统编码增强工具，以隔离训练材料对压缩效果的影响。",
      "question": "性能提升来自结构还是训练分布？计划应固定网络与训练预算，只改变数据源，同时按源视频而非不同分辨率副本划分训练测试。",
      "caveat": "本地是2020 v2预印本，主要实验为HEVC增强工具，不是DCVC端到端复现。多分辨率800条不代表800个独立场景；本轮未下载视频。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://arxiv.org/abs/2003.13552v2",
      "sourceUrl": "https://arxiv.org/abs/2003.13552v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "BVI_DVC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "467a733c5e93357567996b336f5147a35ad1a92333ed0c2744e67c03c1110677",
      "pages": 11,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "BVI_CC",
      "title": "BVI-CC: A Dataset for Research on Video Compression and Quality Assessment",
      "authors": [
        "Angeliki Katsenou",
        "Fan Zhang",
        "Mariana Afonso",
        "Goce Dimitrov",
        "David R. Bull"
      ],
      "year": 2022,
      "venue": "Frontiers in Signal Processing 2:874200",
      "version": "Publisher version, published 2022-04-11; 14 pages",
      "fields": [
        "09"
      ],
      "tags": [
        "MOS",
        "主观评价",
        "跨编码器",
        "自适应码率",
        "分辨率",
        "评价协议",
        "评价方法"
      ],
      "summary": "以9个源序列、306种编码构造HEVC、AV1和VVC比较，结合客观指标、实验室主观评分和跨分辨率RD凸包测试；重点是保持比较配置和评价资料可复核。",
      "question": "相同PSNR或VMAF的编码结果是否有一致的人眼排序？可先形成盲测配对与评分协议，再讨论少数片段的主观差异。",
      "caveat": "只读摘要/引言，尚未精读受试者筛选、置信区间和实验细则；论文时期编码器版本结论不可当成当前codec排名。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://www.frontiersin.org/journals/signal-processing/articles/10.3389/frsip.2022.874200/full",
      "sourceUrl": "https://www.frontiersin.org/journals/signal-processing/articles/10.3389/frsip.2022.874200/full",
      "codeUrl": "",
      "notes": [
        {
          "label": "BVI_CC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "4c0e1641510fb3f9a6d80a069b293161b5968034de502cde88052a0c44f53d50",
      "pages": 14,
      "addedThisRound": false,
      "relations": [
        {
          "id": "USTC_TD",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "SSIM_2004",
      "title": "Image Quality Assessment: From Error Visibility to Structural Similarity",
      "authors": [
        "Zhou Wang",
        "Alan C. Bovik",
        "Hamid R. Sheikh",
        "Eero P. Simoncelli"
      ],
      "year": 2004,
      "venue": "IEEE Transactions on Image Processing 13(4), pp. 600–612",
      "version": "Author-hosted manuscript, printed header April 2004; local PDF 14 pages differs from final typeset pagination",
      "fields": [
        "09"
      ],
      "tags": [
        "SSIM",
        "全参考",
        "结构相似度",
        "PSNR局限",
        "图像质量",
        "评价方法"
      ],
      "summary": "把图像质量比较分为局部亮度、对比度和结构，强调相同MSE的失真可以有不同结构损失；为PSNR之外的全参考评价提供经典基础。",
      "question": "在相近bpp下，DCVC-RT的模糊、纹理丢失和亮度偏差是否被PSNR与SSIM不同排序？实现须固定动态范围、窗口和颜色通道。",
      "caveat": "SSIM原论文评价静态图像；逐帧平均不能验证时域稳定性。读了摘要/引言及页4–5局部方法，但未完整推导后续公式和验证表。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        4,
        5
      ],
      "localPdf": "https://ece.uwaterloo.ca/~z70wang/publications/ssim.pdf",
      "sourceUrl": "https://ece.uwaterloo.ca/~z70wang/publications/ssim.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "SSIM_2004_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "c83f6f0f5357eb2714ce084d97bef4006358574d06ba546210e505149438b489",
      "pages": 14,
      "addedThisRound": false,
      "relations": [
        {
          "id": "MS_SSIM_2003",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "VIF",
      "title": "Image Information and Visual Quality",
      "authors": [
        "Hamid Rahim Sheikh",
        "Alan C. Bovik"
      ],
      "year": 2006,
      "venue": "IEEE Transactions on Image Processing 15(2), pp. 430–444",
      "version": "Author-hosted journal draft (26 pages; footer DRAFT); final journal metadata is 2006, not the URL folder year 2004",
      "fields": [
        "09"
      ],
      "tags": [
        "VIF",
        "自然场景统计",
        "全参考",
        "信息保真",
        "感知评价",
        "评价方法"
      ],
      "summary": "在自然场景统计、失真通道和视觉系统模型下，比较失真后可提取的参考信息与原始参考信息，形成视觉信息保真度；补充像素误差与结构相似度两种视角。",
      "question": "纹理细节损失与轻微对比度变化在信息保真指标下如何排序？应把它作为补充证据，而非默认替代人眼或视频时域评价。",
      "caveat": "本地为作者DRAFT版而非15页最终排版；只读摘要与引言，尚未核验实现常数、VMAF中的具体VIF变体或视频适用性。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://live.ece.utexas.edu/research/Quality/VIF.htm",
      "sourceUrl": "https://live.ece.utexas.edu/research/Quality/VIF.htm",
      "codeUrl": "",
      "notes": [
        {
          "label": "VIF_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "512adf4b413109f7b86f829713030384f8b80e8434984e2bc6c07a32e0d3217f",
      "pages": 26,
      "addedThisRound": false,
      "relations": [
        {
          "id": "MS_SSIM_2003",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        },
        {
          "id": "LPIPS",
          "type": "reading_path",
          "reason": "建议阅读顺序：建立可信的评价口径"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "LSVC",
      "title": "LSVC: A Learning-Based Stereo Video Compression Framework",
      "authors": [
        "Zhenghao Chen",
        "Guo Lu",
        "Zhihao Hu",
        "Shan Liu",
        "Wei Jiang",
        "Dong Xu"
      ],
      "year": 2022,
      "venue": "CVPR 2022, pp. 6073–6082",
      "version": "CVF open-access accepted proceedings version; 10 pages",
      "fields": [
        "15"
      ],
      "tags": [
        "双目视频",
        "视差",
        "运动补偿",
        "自动驾驶",
        "特征域",
        "内容与数据"
      ],
      "summary": "在同一视图的时间参考之外引入另一视图的已解码参考，通过运动与视差补偿降低两类冗余，并压缩预测后的运动/视差残差。",
      "question": "扩展到双目时，额外视差比特和交叉视图依赖是否值得？应同时考察两视图总码率、解码顺序和机器视觉任务质量。",
      "caveat": "摘要/引言围绕校准、校正后的汽车双目数据；不能推广到任意多摄像头。未确认官方代码仓库，也未复现双目实验。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2022/html/Chen_LSVC_A_Learning-Based_Stereo_Video_Compression_Framework_CVPR_2022_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2022/html/Chen_LSVC_A_Learning-Based_Stereo_Video_Compression_Framework_CVPR_2022_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "LSVC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "e3f7a786667e9ddbb19ea610a56f0f7e55fdbe6b7bbb3b3fd5637480be5af6e1",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "PNVC",
      "title": "PNVC: Towards Practical INR-based Video Compression",
      "authors": [
        "Ge Gao",
        "Ho Man Kwan",
        "Fan Zhang",
        "David Bull"
      ],
      "year": 2025,
      "venue": "AAAI 2025, 39(3), pp. 3068–3076",
      "version": "Local PDF is arXiv:2409.00953v1, 2024-09-02 (10 pages); AAAI2025 proceedings identity verified separately; not assumed byte-identical",
      "fields": [
        "07",
        "03"
      ],
      "tags": [
        "INR",
        "低延迟",
        "随机访问",
        "预训练再过拟合",
        "重参数化",
        "复杂度",
        "隐式表示",
        "实时系统"
      ],
      "summary": "把自编码器预训练与内容专属过拟合结合，用ModMixer重参数化、分层质量控制和熵模型，尝试保留INR解码效率并支持低延迟和随机访问配置。",
      "question": "预训练再过拟合能否降低短GOP上的适配成本？应分别报告采集等待、编码耗时、首帧延迟和解码吞吐，而不是只报FPS。",
      "caveat": "本文脚注的latency主要指预测结构的帧延迟，并非全部墙钟编码耗时。只读摘要/引言；作者称代码将公开，本轮未验证已可用官方实现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://ojs.aaai.org/index.php/AAAI/article/view/32315",
      "sourceUrl": "https://ojs.aaai.org/index.php/AAAI/article/view/32315",
      "codeUrl": "",
      "notes": [
        {
          "label": "PNVC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "f68b794943b7311a5f468db3e4164eaa14979c93e8ff64989df1ac40fcc0bd6e",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "NVRC",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        },
        {
          "id": "S_NVRC",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "MLVC",
      "title": "M-LVC: Multiple Frames Prediction for Learned Video Compression",
      "authors": [
        "Jianping Lin",
        "Dong Liu",
        "Houqiang Li",
        "Feng Wu"
      ],
      "year": 2020,
      "venue": "CVPR 2020",
      "version": "CVPR 2020 proceedings PDF",
      "fields": [
        "02"
      ],
      "tags": [
        "多参考帧",
        "运动矢量预测",
        "运动补偿",
        "残差细化",
        "表示与参考"
      ],
      "summary": "把过去多帧及其运动矢量共同用于当前帧预测：先预测当前运动、编码运动预测误差，再用多帧运动补偿生成预测图像，并通过运动和残差细化网络改善重建。其核心是把可复用的历史信息从单帧扩大到多帧，配合分阶段率失真训练。",
      "question": "在同样的参考缓存、解码延迟和码率预算下，多帧运动预测主要节省运动比特还是残差比特？",
      "caveat": "增加参考帧会增加缓存、运动处理和训练成本。作者对 H.265 的比较依赖当时编码器设置，不能直接外推为相对当前 DCVC-RT 的优势。本轮没有运行模型，也未审计完整码流开销。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content_CVPR_2020/html/Lin_M-LVC_Multiple_Frames_Prediction_for_Learned_Video_Compression_CVPR_2020_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content_CVPR_2020/html/Lin_M-LVC_Multiple_Frames_Prediction_for_Learned_Video_Compression_CVPR_2020_paper.html",
      "codeUrl": "https://github.com/JianpingLin/M-LVC_CVPR2020",
      "notes": [
        {
          "label": "MLVC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "MLVC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "MLVC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "b2810f6e4f3c5334616190469ef3c44440c09e290d332cacb65ef59967e6325b",
      "pages": 9,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "HLVC",
      "title": "Learning for Video Compression with Hierarchical Quality and Recurrent Enhancement",
      "authors": [
        "Ren Yang",
        "Fabian Mentzer",
        "Luc Van Gool",
        "Radu Timofte"
      ],
      "year": 2020,
      "venue": "CVPR 2020",
      "version": "CVPR 2020 proceedings PDF",
      "fields": [
        "02",
        "05"
      ],
      "tags": [
        "层次质量",
        "双向预测",
        "循环增强",
        "质量特征",
        "表示与参考",
        "双向编码"
      ],
      "summary": "在一个帧组内安排三层重建质量：高质量图像帧提供参考，中间层采用双向深度压缩，底层采用单次运动估计服务多帧的压缩方式，再由按质量特征加权的循环网络进行增强。设计把参考质量分配与解码后增强结合起来。",
      "question": "在包含质量特征等边信息、相同重排延迟和完整 GoP 比特数时，层次质量分配与循环增强分别贡献多少？",
      "caveat": "双向或未来参考会引入等待及重排，不能直接与低延迟 P 帧方案等同。引言提到将帧质量信息写入码流，后续需核查开销。层次质量安排本身不等于可按层截断的可伸缩码流；作者使用的 x265 预设也必须对齐。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content_CVPR_2020/html/Yang_Learning_for_Video_Compression_With_Hierarchical_Quality_and_Recurrent_Enhancement_CVPR_2020_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content_CVPR_2020/html/Yang_Learning_for_Video_Compression_With_Hierarchical_Quality_and_Recurrent_Enhancement_CVPR_2020_paper.html",
      "codeUrl": "https://github.com/RenYang-home/HLVC",
      "notes": [
        {
          "label": "HLVC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "HLVC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "HLVC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "863fa3a31b1d36f77e140576e6a0293854239616eb25109d7f1fbe126e618fc3",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "RLVC",
      "title": "Learning for Video Compression with Recurrent Auto-Encoder and Recurrent Probability Model",
      "authors": [
        "Ren Yang",
        "Fabian Mentzer",
        "Luc Van Gool",
        "Radu Timofte"
      ],
      "year": 2021,
      "venue": "IEEE Journal of Selected Topics in Signal Processing (2021)",
      "version": "arXiv:2006.13560v4 (2020-12-06), accepted author version",
      "fields": [
        "01",
        "02"
      ],
      "tags": [
        "循环自编码器",
        "循环概率模型",
        "时域潜变量",
        "状态传播",
        "熵模型",
        "表示与参考"
      ],
      "summary": "把循环状态引入编码器、解码器和概率模型。变换侧通过状态保留过去帧的信息，熵模型侧利用过去潜变量的统计依赖，分别减少表示冗余与概率预测误差；这些模块通过率失真目标协同训练。",
      "question": "参考像素、参考特征与循环隐藏状态，在长序列、场景切换、随机接入和状态重置下各会损失什么信息？",
      "caveat": "有限维循环状态不意味着无损保存全部历史；长程误差传播和状态同步需要单独测试。条件交叉熵的理论动机也不保证有限容量学习模型在每个序列都节省码率。论文性能尚未本地复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2006.13560v4",
      "sourceUrl": "https://arxiv.org/abs/2006.13560v4",
      "codeUrl": "https://github.com/RenYang-home/RLVC",
      "notes": [
        {
          "label": "RLVC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "RLVC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "RLVC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "c522f8f7e383277611ae1efebda674cf084baa411c1ab646191055bfc9c0e57f",
      "pages": 17,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 所存 PDF 首页将 Fabian Mentzer 拼作 Fabian Menzter；结构化作者名按 arXiv 正式元数据和作者官方项目页的 Mentzer 登记，保留此差异。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "ALPHAVC",
      "title": "AlphaVC: High-Performance and Efficient Learned Video Compression",
      "authors": [
        "Yibo Shi",
        "Yunying Ge",
        "Jing Wang",
        "Jue Mao"
      ],
      "year": 2022,
      "venue": "ECCV 2022",
      "version": "ECCV 2022 ECVA proceedings PDF",
      "fields": [
        "01",
        "02",
        "03"
      ],
      "tags": [
        "条件帧内帧",
        "概率跳过",
        "像素到特征运动预测",
        "编解码复杂度",
        "熵模型",
        "表示与参考",
        "实时系统"
      ],
      "summary": "针对传统学习式视频压缩的质量与速度瓶颈，提出帧组起点的条件 I 帧、像素到特征的运动预测，以及依据概率分布跳过部分熵编码工作的机制。设计同时处理跨帧误差传播、运动估计质量和熵编解码耗时。",
      "question": "概率跳过能节省多少实际熵编码时间，又依赖怎样的符号重建和码流同步条件？条件 I 帧究竟具有什么随机接入能力？",
      "caveat": "引言分别报告相对 VTM-IPP 与 VTM-LDP 的结果，前者单参考和平坦 QP、后者多参考与动态 QP，不能混用两个基线数字。“条件 I 帧”名称不自动保证独立可解码。本轮只筛读引言，具体依赖和跳过规则仍需方法与代码核查。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136790605.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136790605.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "ALPHAVC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ALPHAVC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ALPHAVC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a52b12b0975b9f8168e45c1f315f1a309a11d17edf87761d1f7f74b56cf66333",
      "pages": 16,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "ENERV",
      "title": "E-NeRV: Expedite Neural Video Representation with Disentangled Spatial-Temporal Context",
      "authors": [
        "Zizhang Li",
        "Mengmeng Wang",
        "Huaijin Pi",
        "Kechun Xu",
        "Jianbiao Mei",
        "Yong Liu"
      ],
      "year": 2022,
      "venue": "ECCV 2022",
      "version": "ECCV 2022 ECVA proceedings PDF",
      "fields": [
        "07",
        "06"
      ],
      "tags": [
        "INR",
        "时空解耦",
        "每视频优化",
        "模型容量",
        "隐式表示",
        "编码端搜索"
      ],
      "summary": "将按帧索引生成整帧的 NeRV 表示拆成空间与时间上下文，降低耦合映射中的冗余参数，并在后续卷积阶段注入时间信息。作者希望用更有效的参数分配，获得更快拟合和更好的表示质量。",
      "question": "时空解耦带来的收益，在计入模型量化、熵编码、参数头部和每视频拟合时间后，还能保留多少？",
      "caveat": "表示误差、模型参数量和实际压缩后比特数是不同量。摘要的收敛加速是特定训练设置下的作者结果，不等于端到端编码必然同比加速；也不能忽略视频特定优化成本。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136950263.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136950263.pdf",
      "codeUrl": "https://github.com/kyleleey/E-NeRV",
      "notes": [
        {
          "label": "ENERV_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ENERV_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ENERV_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ENERV_page1（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "5ae5e3633e4f066d3c19161d3b0d28343d5429772c3f3b7d54c179882c5b4768",
      "pages": 18,
      "addedThisRound": false,
      "relations": [
        {
          "id": "NERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        },
        {
          "id": "DNERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。 作者 Huaijin Pi 已在 PDF 第1页渲染图上核对，修正下载脚本初始元数据中的 Huajin 拼写。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DNERV",
      "title": "Towards Scalable Neural Representation for Diverse Videos",
      "authors": [
        "Bo He",
        "Xitong Yang",
        "Hanyu Wang",
        "Zuxuan Wu",
        "Hao Chen",
        "Shuaiyi Huang",
        "Yixuan Ren",
        "Ser-Nam Lim",
        "Abhinav Shrivastava"
      ],
      "year": 2023,
      "venue": "CVPR 2023",
      "version": "CVPR 2023 proceedings PDF",
      "fields": [
        "07",
        "06"
      ],
      "tags": [
        "INR",
        "多视频共享",
        "内容运动解耦",
        "关键帧条件",
        "隐式表示",
        "编码端搜索"
      ],
      "summary": "D-NeRV 面向多段不同内容的视频，利用关键帧条件并将片段特定内容与运动分离，以共享网络表达更多视频；通过时域依赖和中间运动表示复用像素信息，减少逐视频独立网络的扩展负担。",
      "question": "共享模型的大小如何在多个视频之间摊销，关键帧的实际码率又如何与运动和网络参数一起计费？",
      "caveat": "标题中的 scalable 指多样视频表示和模型扩展，不能直接理解为按空间或质量分层可截断的码流。单视频过拟合与整组视频共享训练的协议、解码端预置模型和关键帧成本必须统一。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://boheumd.github.io/D-NeRV/",
      "sourceUrl": "https://boheumd.github.io/D-NeRV/",
      "codeUrl": "https://github.com/boheumd/D-NeRV",
      "notes": [
        {
          "label": "DNERV_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DNERV_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DNERV_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "0c46bc4de27dfae5c0a7472431d48c2b61ab796b2cbf09d85dbf6b766cfee29d",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "ENERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        },
        {
          "id": "FFNERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "FFNERV",
      "title": "FFNeRV: Flow-Guided Frame-Wise Neural Representations for Videos",
      "authors": [
        "Joo Chan Lee",
        "Daniel Rho",
        "Jong Hwan Ko",
        "Eunbyung Park"
      ],
      "year": 2023,
      "venue": "ACM Multimedia 2023",
      "version": "arXiv:2212.12294v2 (2023-08-07), author version",
      "fields": [
        "07",
        "02",
        "06"
      ],
      "tags": [
        "INR",
        "光流引导",
        "邻帧复用",
        "时间网格",
        "量化感知训练",
        "隐式表示",
        "表示与参考",
        "编码端搜索"
      ],
      "summary": "用光流引导相邻帧聚合，让帧级 INR 显式复用时域重复内容；结合一维多分辨率时间网格、分组和逐点卷积，以及面向压缩的量化处理，减少把相近像素反复记进网络权重的负担。",
      "question": "引入光流与邻帧聚合后，节省的权重比特是否足以抵消流表示、网格参数和额外解码访问的成本？",
      "caveat": "必须统计所有模型、网格和运动相关参数以及每视频优化开销；帧插值能力不等同于压缩性能。该方法与一次前向的通用视频编码器训练和使用协议不同，不能只比较解码帧率或参数量。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://maincold2.github.io/ffnerv/",
      "sourceUrl": "https://maincold2.github.io/ffnerv/",
      "codeUrl": "https://github.com/maincold2/FFNeRV",
      "notes": [
        {
          "label": "FFNERV_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FFNERV_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FFNERV_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a41c62a2eb66763f0f9bd6fe6f5ead8c7dff828f1c37d4d502e0efe2f19fbdfc",
      "pages": 15,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DNERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        },
        {
          "id": "HINERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "NVRC",
      "title": "NVRC: Neural Video Representation Compression",
      "authors": [
        "Ho Man Kwan",
        "Ge Gao",
        "Fan Zhang",
        "Andrew Gower",
        "David Bull"
      ],
      "year": 2024,
      "venue": "NeurIPS 2024",
      "version": "NeurIPS 2024 proceedings PDF",
      "fields": [
        "07",
        "01",
        "06"
      ],
      "tags": [
        "INR",
        "率失真优化",
        "参数熵模型",
        "分组量化",
        "层次参数压缩",
        "隐式表示",
        "熵模型",
        "编码端搜索"
      ],
      "summary": "把神经视频表示的权重与特征网格纳入显式率失真优化，并学习量化与概率模型参数；使用分组量化、针对不同对象的熵模型和层次参数压缩，减少仅优化重建质量后再压缩权重造成的错配。",
      "question": "率失真训练应当把哪些权重、网格、量化参数和熵模型参数都计入码率？层次编码是否把模型本身的开销充分算入？",
      "caveat": "所存为 NeurIPS 2024 正式论文版本，摘要节码率数字与网上其他修订版并不完全相同，不能混引。RGB444 与 YUV420、随机接入 VTM 与低延迟编码器需要分开比较；视频特定优化时间也属于成本。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://hmkx.github.io/nvrc/",
      "sourceUrl": "https://hmkx.github.io/nvrc/",
      "codeUrl": "",
      "notes": [
        {
          "label": "NVRC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "NVRC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "NVRC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "9f49b16ecd2ccb299a9950d4056b2bff58341b711aedbbfabc3064421c23aef8",
      "pages": 23,
      "addedThisRound": false,
      "relations": [
        {
          "id": "HINERV",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        },
        {
          "id": "PNVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "FLAVC",
      "title": "FLAVC: Learned Video Compression with Feature Level Attention",
      "authors": [
        "Chun Zhang",
        "Heming Sun",
        "Jiro Katto"
      ],
      "year": 2025,
      "venue": "CVPR 2025",
      "version": "CVPR 2025 proceedings PDF",
      "fields": [
        "01",
        "02"
      ],
      "tags": [
        "视频注意力",
        "特征级上下文",
        "重叠分块",
        "Transformer-CNN",
        "熵模型",
        "表示与参考"
      ],
      "summary": "采用特征级自注意力与交叉注意力表达较大范围依赖，结合密集重叠分块保留局部信息，并混合 Transformer 与 CNN 编解码模块。设计围绕如何在控制注意力开销的同时利用当前与参考特征的信息展开。",
      "question": "特征级注意力相比逐像素或逐块注意力，减少了哪些计算与存储，损失了哪些空间对应细节？",
      "caveat": "每像素 MAC 数不能代替真实编解码时间、内存访问或缓存大小。作者使用的 HM/VTM 版本、颜色格式和参考结构须与复现实验对齐。本轮没有运行注意力模块或验证实时性。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/html/Zhang_FLAVC_Learned_Video_Compression_with_Feature_Level_Attention_CVPR_2025_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/html/Zhang_FLAVC_Learned_Video_Compression_with_Feature_Level_Attention_CVPR_2025_paper.html",
      "codeUrl": "https://github.com/Z-CV-code/FLAVC",
      "notes": [
        {
          "label": "FLAVC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FLAVC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FLAVC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "b07a1006bb956d06d977c000189dbdf7ac4f31df85c2650a39a6d51abf900fd4",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "LIC_TCM",
      "title": "Learned Image Compression with Mixed Transformer-CNN Architectures",
      "authors": [
        "Jinming Liu",
        "Heming Sun",
        "Jiro Katto"
      ],
      "year": 2023,
      "venue": "CVPR 2023",
      "version": "CVPR 2023 proceedings PDF",
      "fields": [
        "01",
        "02"
      ],
      "tags": [
        "图像压缩",
        "混合变换",
        "局部全局依赖",
        "通道切片",
        "熵模型",
        "表示与参考"
      ],
      "summary": "并行组合 CNN 的局部建模与 Swin Transformer 的非局部建模，构造混合变换模块；在熵模型中加入通道压缩的窗口注意力，并调整通道切片数量，在相关性建模与解码串行成本之间取舍。",
      "question": "混合结构的率失真收益来自变换还是熵模型，减少通道切片能否在相同硬件上降低真正的解码延迟？",
      "caveat": "这里 TCM 指 Transformer-CNN Mixture，与视频文献 Temporal Context Mining 的同名缩写不同。仍是静态图像论文，VTM 帧内比较与视频低延迟结果不可直接拼接；同时改动变换和熵模型需要独立消融。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2023/html/Liu_Learned_Image_Compression_With_Mixed_Transformer-CNN_Architectures_CVPR_2023_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2023/html/Liu_Learned_Image_Compression_With_Mixed_Transformer-CNN_Architectures_CVPR_2023_paper.html",
      "codeUrl": "https://github.com/jmliu206/LIC_TCM",
      "notes": [
        {
          "label": "LIC_TCM_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LIC_TCM_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LIC_TCM_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "0d51e5c48648a908119f76fb5ec570b340e737da780c220b75b8d9fe04291068",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "MLIC",
      "title": "MLIC: Multi-Reference Entropy Model for Learned Image Compression",
      "authors": [
        "Wei Jiang",
        "Jiayu Yang",
        "Yongqi Zhai",
        "Peirong Ning",
        "Feng Gao",
        "Ronggang Wang"
      ],
      "year": 2023,
      "venue": "ACM Multimedia 2023",
      "version": "arXiv:2211.07273v10 (2024-09-13), author revision of ACM MM 2023 paper",
      "fields": [
        "01"
      ],
      "tags": [
        "图像压缩",
        "多参考熵模型",
        "棋盘上下文",
        "通道上下文",
        "全局注意力",
        "熵模型"
      ],
      "summary": "组合通道、局部空间和全局空间依赖，利用已解码通道切片预测当前切片相关性，并通过棋盘形式的局部建模减少逐像素串行计算。论文同时讨论 MEM 与更强的 MEM+，都属于这一篇工作。",
      "question": "跨切片复用注意力图在视频潜变量上是否仍成立，两个棋盘阶段乘上多个通道切片后的真实串行路径有多长？",
      "caveat": "所存是 ACM MM 2023 工作的 arXiv v10（2024-09-13）修订版，共27页，不能说是原始会议排版。每切片两阶段不等于整个解码只有两阶段；当前作者仓库还展示后续 MLIC++，不能把现版本代码默认当作本论文固定实现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2211.07273v10",
      "sourceUrl": "https://arxiv.org/abs/2211.07273v10",
      "codeUrl": "https://github.com/JiangWeibeta/MLIC",
      "notes": [
        {
          "label": "MLIC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "MLIC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "MLIC_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "7eb5bfa35186cc4131530df20b743477495490990f521db195c5db36cb710e0d",
      "pages": 27,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CONTEXTFORMER",
      "title": "Contextformer: A Transformer with Spatio-Channel Attention for Context Modeling in Learned Image Compression",
      "authors": [
        "A. Burakhan Koyuncu",
        "Han Gao",
        "Atanas Boev",
        "Georgii Gaikov",
        "Elena Alshina",
        "Eckehard Steinbach"
      ],
      "year": 2022,
      "venue": "ECCV 2022",
      "version": "ECCV 2022 ECVA proceedings PDF",
      "fields": [
        "01"
      ],
      "tags": [
        "图像压缩",
        "空间通道注意力",
        "熵上下文",
        "自回归成本",
        "熵模型"
      ],
      "summary": "将 Transformer 上下文建模扩展到空间与通道两个维度，自适应利用潜变量间依赖来预测概率，并讨论无需重新训练的运行时间优化。核心关注在更丰富的上下文中提高概率预测，而非单独增大图像变换网络。",
      "question": "空间与通道联合注意力能消除多少概率模型误差，它对应的解码依赖图又形成多少必须串行等待的步骤？",
      "caveat": "静态图像的压缩收益不能直接外推至视频。强上下文仍可能带来显著因果串行开销，作者的运行时间优化需进一步结合方法和代码核查。引言中的前向/后向适应术语应按实际边信息与已解码上下文解释，不能机械复述术语。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136790436.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2022/papers_ECCV/papers/136790436.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "CONTEXTFORMER_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CONTEXTFORMER_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CONTEXTFORMER_fulltext（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cb415a79f4d44711701fd04b0327ebbfee7f87b0619f8dcff9653d0d7fe41c73",
      "pages": 18,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "LBSVC",
      "title": "Learning-Based Scalable Video Coding with Spatial and Temporal Prediction",
      "authors": [
        "Martin Benjak",
        "Yi-Hsin Chen",
        "Wen-Hsiao Peng",
        "Jörn Ostermann"
      ],
      "year": 2023,
      "venue": "IEEE VCIP 2023",
      "version": "Author-hosted 5-page manuscript; VCIP December 2023 identity verified on Leibniz University Hannover publication list; not asserted byte-identical to IEEE proceedings",
      "fields": [
        "12",
        "16",
        "02"
      ],
      "tags": [
        "空间可伸缩",
        "VVC基本层",
        "条件编码",
        "解码端运动估计",
        "超分辨率",
        "可伸缩编码",
        "部署与兼容",
        "表示与参考"
      ],
      "summary": "将低分辨率VVC基本层与神经条件增强层结合；增强层融合基本层超分辨率结果和高分辨率时域参考，在解码端估计运动以减少运动信息传输。",
      "question": "省去运动矢量码率后，解码端光流计算和双模式编码选择增加多少代价？应同时核算基本层、增强层和模式位，并与同配置低延迟VVC比较。",
      "caveat": "标准兼容性首先适用于基本层，完整增强层仍需神经解码器；无运动矢量传输不等于零辅助信息或零运动计算。作者的高分辨率性能结论尚未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://www.tnt.uni-hannover.de/research/multimedia_coding.php",
      "sourceUrl": "https://www.tnt.uni-hannover.de/research/multimedia_coding.php",
      "codeUrl": "",
      "notes": [
        {
          "label": "LBSVC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LBSVC_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "0c59fc222f99eba53ca674a971df91d52edf9eb2e3bed8f39839a781fc07be27",
      "pages": 5,
      "addedThisRound": false,
      "relations": [
        {
          "id": "SEVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        },
        {
          "id": "FA_SCALABLE",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "FA_SCALABLE",
      "title": "Frequency-aware Learned Image Compression for Quality Scalability",
      "authors": [
        "Hyomin Choi",
        "Fabien Racapé",
        "Shahab Hamidi-Rad",
        "Mateen Ulhaq",
        "Simon Feltman"
      ],
      "year": 2022,
      "venue": "IEEE VCIP 2022",
      "version": "Local PDF arXiv:2301.01290v1, 2023-01-03, 5 pages; authors mark Presented at VCIP 2022 and PDF has 2022 IEEE footer; publication year and preprint upload year differ",
      "fields": [
        "12",
        "02"
      ],
      "tags": [
        "质量可伸缩",
        "小波",
        "OctConv",
        "ROI增强",
        "图像编码",
        "可伸缩编码",
        "表示与参考"
      ],
      "summary": "用嵌入小波分解的OctConv区分低频与高频潜变量，分别产生基本和增强码流；解码器可选择第二质量层，也可仅增强指定ROI。",
      "question": "同一压缩表示的增量增强与重新编码得到不同码率有何差异？ROI节省应怎样计入掩码、超先验和选择信令，并在真实字节数上验证？",
      "caveat": "本文展示的是图像的两级质量扩展和ROI增强，不能据此推断连续码率、任意数量质量层或视频时序稳定性。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1
      ],
      "localPdf": "https://arxiv.org/abs/2301.01290v1",
      "sourceUrl": "https://arxiv.org/abs/2301.01290v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "FA_SCALABLE_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FA_SCALABLE_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "658069b3e09c41fc9eb424730cda028a9dcc52015d9cd11b631a74ecc7ec9a64",
      "pages": 5,
      "addedThisRound": false,
      "relations": [
        {
          "id": "LBSVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        },
        {
          "id": "COMPASS",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "COMPASS",
      "title": "COMPASS: High-Efficiency Deep Image Compression with Arbitrary-scale Spatial Scalability",
      "authors": [
        "Jongmin Park",
        "Jooyoung Lee",
        "Munchurl Kim"
      ],
      "year": 2023,
      "venue": "ICCV 2023, pp. 12826–12835",
      "version": "Official CVF open-access accepted-paper version, 10 pages; CVF watermark says identical to accepted version except watermark",
      "fields": [
        "12",
        "07"
      ],
      "tags": [
        "空间可伸缩",
        "LIFF",
        "隐式层间预测",
        "共享增强模块",
        "累计码率",
        "可伸缩编码",
        "隐式表示"
      ],
      "summary": "利用局部隐式滤波函数LIFF预测相邻分辨率层，增强层共享预测与压缩模块，通过联合率失真目标支持推理时选择不同层数与缩放比例。",
      "question": "任意缩放比例下，层间预测增益是否能抵消累计基本层开销？应在相同目标分辨率、骨干和总码流大小下比较分层与独立编码。",
      "caveat": "研究对象为图像；INR用于层间预测，不应直接归类为逐视频过拟合的NeRV编码。摘要中的最大BD-rate收益不是平均跨内容收益。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2023/html/Park_COMPASS_High-Efficiency_Deep_Image_Compression_with_Arbitrary-scale_Spatial_Scalability_ICCV_2023_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2023/html/Park_COMPASS_High-Efficiency_Deep_Image_Compression_with_Arbitrary-scale_Spatial_Scalability_ICCV_2023_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "COMPASS_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "COMPASS_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a783c81798c5fa610013ba18b15f8fe1ff1743470becf5fff2fadfe9c697eb47",
      "pages": 10,
      "addedThisRound": false,
      "relations": [
        {
          "id": "FA_SCALABLE",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        },
        {
          "id": "S_NVRC",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "S_NVRC",
      "title": "Scalable Neural Video Representation Compression",
      "authors": [
        "Tianhao Peng",
        "Ho Man Kwan",
        "Fan Zhang",
        "Shan Liu",
        "David Bull"
      ],
      "year": 2026,
      "venue": "arXiv preprint",
      "version": "arXiv:2609.04273v1, 2026-09-02, 11 pages; no accepted venue verified",
      "fields": [
        "12",
        "07",
        "03"
      ],
      "tags": [
        "分层码流",
        "INR",
        "NVRC++",
        "特征网格",
        "复杂度可伸缩",
        "可伸缩编码",
        "隐式表示",
        "实时系统"
      ],
      "summary": "在NVRC++上按粗到细排列特征网格、按嵌套前缀组织网络通道，对多个工作点联合优化，试图从单次拟合的分层码流分别控制码率和解码复杂度。",
      "question": "固定复杂度改变网格码率、固定码率改变网络宽度时，实际率失真前沿是否单调？应把每视频训练耗时、参数和网格总字节同时纳入比较。",
      "caveat": "2026年预印本；与NVRC/NVRC++为不同论文，不能合并实验结论。作者称代码将提供，本轮未证实已有可用官方实现，UVG上的作者BD-rate不可当成我们的实测。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2609.04273v1",
      "sourceUrl": "https://arxiv.org/abs/2609.04273v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "S_NVRC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "S_NVRC_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        },
        {
          "label": "领域07分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/07_%E9%9A%90%E5%BC%8F%E8%A1%A8%E7%A4%BA%E4%B8%8E%E9%80%90%E5%AE%9E%E4%BE%8B%E5%8E%8B%E7%BC%A9.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "3e41f9e223188ec421951cdbd14fc66e2cff19f8d0a51b6b3a907c6735d6e388",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "COMPASS",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        },
        {
          "id": "HDRSVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：一份表示如何分层使用"
        },
        {
          "id": "PNVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：逐视频表示的编码预算"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "PTQ_CROSS",
      "title": "Post-Training Quantization for Cross-Platform Learned Image Compression",
      "authors": [
        "Dailan He",
        "Ziming Yang",
        "Yuan Chen",
        "Qi Zhang",
        "Hongwei Qin",
        "Yan Wang"
      ],
      "year": 2022,
      "venue": "arXiv preprint",
      "version": "arXiv:2202.07513v2, 2022-11-30, 25 pages including appendices; PDF says Preprint. Under review.; no accepted venue asserted",
      "fields": [
        "16",
        "01",
        "03"
      ],
      "tags": [
        "PTQ",
        "整数推理",
        "跨平台一致性",
        "CDF",
        "GMM",
        "部署与兼容",
        "熵模型",
        "实时系统"
      ],
      "summary": "将跨平台浮点差异导致的熵解码失配分为模型推理与熵参数离散化两环；用训练后量化、整数算子及快速参数离散化实现可重复的概率预测。",
      "question": "只固定网络权重是否足够？需同时审计激活重定标、舍入、饱和、概率参数离散化及CDF构造，并用CPU/GPU交叉编解码比较符号序列。",
      "caveat": "确定性首先针对熵模型及其离散化路径；图像实验不能自动保证带递归参考的视频解码重建逐位相同。本文不是本轮完成的整数部署实验。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://arxiv.org/abs/2202.07513v2",
      "sourceUrl": "https://arxiv.org/abs/2202.07513v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "PTQ_CROSS_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "PTQ_CROSS_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "21ca59942fb8bfaf5feb6cd3cfecdf2eef960e43aa1b4ad9f12de69110d32e9b",
      "pages": 25,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "DEVICE_INTEROP",
      "title": "Device Interoperability for Learned Image Compression with Weights and Activations Quantization",
      "authors": [
        "Esin Koyuncu",
        "Timofey Solovyev",
        "Elena Alshina",
        "André Kaup"
      ],
      "year": 2022,
      "venue": "Picture Coding Symposium (PCS) 2022",
      "version": "Local PDF arXiv:2212.01330v1, 2022-12-02, 5 pages; page 2 identifies PCS 2022 presentation; author manuscript not asserted identical to proceedings",
      "fields": [
        "16",
        "01",
        "03"
      ],
      "tags": [
        "int16",
        "熵网络",
        "权重与激活量化",
        "JPEG AI CfP",
        "累加溢出",
        "部署与兼容",
        "熵模型",
        "实时系统"
      ],
      "summary": "对使用颜色分离条件编码、上下文和GMM的图像模型，仅将熵参数子网络的权重与激活整数化，研究跨设备解码和压缩损失的折中。",
      "question": "int16权重与激活配int32累加时如何避免溢出？不同颜色分支与GMM参数的校准范围是否使CDF完全一致，而不仅是平均率失真接近？",
      "caveat": "基线来自JPEG AI征集响应，不等于最终JPEG AI标准兼容实现；作者关闭在线优化和后滤波研究量化，不能把该结果套用到完整工具链。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2212.01330v1",
      "sourceUrl": "https://arxiv.org/abs/2212.01330v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "DEVICE_INTEROP_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DEVICE_INTEROP_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "6f91f156823363c12af55e1f189a959e27edb499831716179501d5e6e816e73f",
      "pages": 5,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "CGSLIM",
      "title": "Complexity-guided Slimmable Decoder for Efficient Deep Video Compression",
      "authors": [
        "Zhihao Hu",
        "Dong Xu"
      ],
      "year": 2023,
      "venue": "CVPR 2023, pp. 14358–14367",
      "version": "Official CVF open-access accepted-paper version, 10 pages; separate supplementary material not included",
      "fields": [
        "03",
        "12",
        "01"
      ],
      "tags": [
        "cgSlimDecoder",
        "SaEC",
        "通道选择",
        "复杂度率失真",
        "DVC/FVC/DCVC",
        "实时系统",
        "可伸缩编码",
        "熵模型"
      ],
      "summary": "通过复杂度率失真目标学习不同解码模块的通道宽度，让一个解码器覆盖多种预算；另用超先验判断可跳过的潜变量，减少熵解码工作。",
      "question": "同一MAC预算下，不同模块的通道分配比统一缩窄好多少？应将神经推理、熵解码、内存访问分开计时，核对所谓跳过是否仍需预测计算。",
      "caveat": "解码复杂度可伸缩与一条分层码流的质量可伸缩并不等价；引言声称适配DVC/FVC/DCVC，本轮未验证DCVC-RT上的可迁移性。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2023/html/Hu_Complexity-Guided_Slimmable_Decoder_for_Efficient_Deep_Video_Compression_CVPR_2023_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2023/html/Hu_Complexity-Guided_Slimmable_Decoder_for_Efficient_Deep_Video_Compression_CVPR_2023_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "CGSLIM_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CGSLIM_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "968c1baad4dee5725cf2292ca9d33453cabb9799f7a12703c6e02c3d09a2d2e6",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "PICO",
      "title": "What Matters in Practical Learned Image Compression",
      "authors": [
        "Kedar Tatwawadi",
        "Parisa Rahimzadeh",
        "Zhanghao Sun",
        "Zhiqi Chen",
        "Ziyun Yang",
        "Sanjay Nair",
        "Divija Hasteer",
        "Oren Rippel"
      ],
      "year": 2026,
      "venue": "CVPR 2026",
      "version": "Official CVF open-access accepted-paper version, 11 pages, proceedings pagination starts 12095; not the separate supplementary file",
      "fields": [
        "03",
        "08",
        "16",
        "09"
      ],
      "tags": [
        "PICO",
        "感知压缩",
        "端侧延迟",
        "NAS",
        "文字伪影",
        "主观评价",
        "实时系统",
        "感知生成",
        "部署与兼容",
        "评价方法"
      ],
      "summary": "通过大规模结构消融和设备性能感知的架构搜索，联合优化图像编码的运行时间与感知质量，并加入文字和分块伪影的专门训练约束。",
      "question": "在相同移动设备、编译优化、图像大小和画质评价协议下，感知模型与DCVC-RT图像分支的时延/质量优势如何变化？需要主观与保真指标并列。",
      "caveat": "作者报告的是图像压缩和特定iPhone平台性能；主观BD-rate及静态纹理效果不能推导视频时间一致性，也不能与PSNR BD-rate直接换算。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2026/html/Tatwawadi_What_Matters_in_Practical_Learned_Image_Compression_CVPR_2026_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2026/html/Tatwawadi_What_Matters_in_Practical_Learned_Image_Compression_CVPR_2026_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "PICO_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "PICO_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a1d44f0132c67faa92aeac09a5e7eb93a623e4715fdaf2e95eee97338fb4da8b",
      "pages": 11,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "ST_GREED",
      "title": "ST-GREED: Space-Time Generalized Entropic Differences for Frame Rate Dependent Video Quality Prediction",
      "authors": [
        "Pavan C. Madhusudana",
        "Neil Birkbeck",
        "Yilin Wang",
        "Balu Adsumilli",
        "Alan C. Bovik"
      ],
      "year": 2021,
      "venue": "IEEE Transactions on Image Processing, vol. 30, 2021",
      "version": "Author-hosted 12-page 2021 manuscript; journal identity verified in UT Austin LIVE publications list; file has local pagination 1–12",
      "fields": [
        "09",
        "08"
      ],
      "tags": [
        "ST-GREED",
        "高帧率",
        "时域失真",
        "GGD",
        "全参考评价",
        "评价方法",
        "感知生成"
      ],
      "summary": "以空间和时间带通响应的广义高斯熵差构建质量特征，再用回归器融合，专门处理帧率变化与压缩共同引起的主观质量差异。",
      "question": "丢帧、降帧率或插帧时，逐帧PSNR与简单平均SSIM遗漏了什么？需要对齐显示时间并采用适合异帧率的评价，再看真实播放。",
      "caveat": "这是需要参考视频和训练回归器的评价模型，不是编码器；LIVE-YT-HFR上的作者相关性不能保证对生成式闪烁或当前DCVC数据都有效。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://live.ece.utexas.edu/publications.php",
      "sourceUrl": "https://live.ece.utexas.edu/publications.php",
      "codeUrl": "",
      "notes": [
        {
          "label": "ST_GREED_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ST_GREED_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "2a67ef16f5cb53643eb375f779b205dbd2a2783f294cf6349c930df0f217bbce",
      "pages": 12,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "FUNQUE",
      "title": "FUNQUE: Fusion of Unified Quality Evaluators",
      "authors": [
        "Abhinau K. Venkataramanan",
        "Cosmin Stejerean",
        "Alan C. Bovik"
      ],
      "year": 2022,
      "venue": "IEEE ICIP 2022",
      "version": "Author-hosted 5-page ICIP paper; arXiv:2202.11241 metadata says Accepted at ICIP 2022; not the later FUNQUE+ journal extension",
      "fields": [
        "09",
        "03",
        "08"
      ],
      "tags": [
        "FUNQUE",
        "VMAF对照",
        "小波",
        "HVS",
        "共享特征计算",
        "评价方法",
        "实时系统",
        "感知生成"
      ],
      "summary": "把不同质量特征放到共享的感知加权小波域，复用变换计算再融合特征，探索主观预测相关性与评估吞吐的共同改进。",
      "question": "对大量RD实验，质量指标本身耗时占比多高？共享变换能否在一致训练划分和失真覆盖下兼顾评价成本与可靠性？",
      "caveat": "指标融合依赖数据分布和回归器；其相关性优于某基线的作者报告不等于在所有新编解码失真上优于VMAF。本条不是FUNQUE+。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2202.11241",
      "sourceUrl": "https://arxiv.org/abs/2202.11241",
      "codeUrl": "",
      "notes": [
        {
          "label": "FUNQUE_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FUNQUE_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "6789656a78e37c2288140f909db86338a44e141d7693985ccdae04ac1be9250e",
      "pages": 5,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "BVI_AOM",
      "title": "BVI-AOM: A New Training Dataset for Deep Video Compression Optimization",
      "authors": [
        "Jakub Nawała",
        "Yuxuan Jiang",
        "Fan Zhang",
        "Xiaoqing Zhu",
        "Joel Sole",
        "David Bull"
      ],
      "year": 2024,
      "venue": "IEEE VCIP 2024",
      "version": "Local PDF arXiv:2408.03265v3, 2024-10-23, 5 pages; VCIP identity verified via author repository/related DOI; institutional camera-ready PDF returned 403",
      "fields": [
        "10",
        "09",
        "15"
      ],
      "tags": [
        "BVI-AOM",
        "训练数据",
        "多分辨率",
        "AVM",
        "内容覆盖",
        "训练与量化",
        "评价方法",
        "内容与数据"
      ],
      "summary": "提出覆盖不同纹理和亮度内容的多分辨率训练集，以两类网络和两类AVM编码工具检验训练数据影响；956条片段由239条UHD来源及其缩小版本构成。",
      "question": "应按239条源内容分组划分训练/验证，如何避免同源缩放片段泄漏？暗场、高对比内容覆盖能否缓解DCVC-RT当前样本的分布偏差？",
      "caveat": "956不等于956个独立场景；这是训练数据而非天然独立测试集。作者在AVM神经工具上的收益不能直接外推为端到端DCVC收益，实际使用还须核对来源许可。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2408.03265v3",
      "sourceUrl": "https://arxiv.org/abs/2408.03265v3",
      "codeUrl": "",
      "notes": [
        {
          "label": "BVI_AOM_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "BVI_AOM_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "1374a6a9ed53639ef0f57a81073ad6d4633a7289df81aaffd68a5884b3f0a2af",
      "pages": 5,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "SSIM_GUIDE",
      "title": "A Hitchhiker’s Guide to Structural Similarity",
      "authors": [
        "Abhinau K. Venkataramanan",
        "Chengyang Wu",
        "Alan C. Bovik",
        "Ioannis Katsavounidis",
        "Zafar Shahid"
      ],
      "year": 2021,
      "venue": "IEEE Access, vol. 9, pp. 28872–28896, 2021",
      "version": "Author-hosted 25-page IEEE Access manuscript; DOI and 2021 acceptance printed, but publication date placeholders/local pages remain; not asserted publisher-final pagination copy",
      "fields": [
        "09"
      ],
      "tags": [
        "SSIM",
        "MS-SSIM",
        "评估实现",
        "池化",
        "动态范围",
        "可复核性",
        "评价方法"
      ],
      "summary": "系统讨论不同SSIM/MS-SSIM实现的行为差异，以及缩放、颜色、观察条件和时空池化选择对质量测量的影响，强调测量工具一致性。",
      "question": "当前脚本的data_range、窗口、padding、颜色转换、缩放和逐帧聚合是否与对照文献一致？同名SSIM分数在不同实现之间能否直接比较？",
      "caveat": "SSIM不是唯一感知真值，论文推荐与其验证数据库和观察条件有关；本轮未跑SSIM实现间数值审计，也未把作者建议强行当成统一标准。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://live.ece.utexas.edu/publications.php",
      "sourceUrl": "https://live.ece.utexas.edu/publications.php",
      "codeUrl": "",
      "notes": [
        {
          "label": "SSIM_GUIDE_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "SSIM_GUIDE_read_pages（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "ac5947d377c1e2c50d9644761b4e05dab3c3fa13d9dccb33b9c4e431ab9365ed",
      "pages": 25,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。"
    },
    {
      "id": "TRANSTIC",
      "title": "TransTIC: Transferring Transformer-based Image Compression from Human Perception to Machine Perception",
      "authors": [
        "Yi-Hsin Chen",
        "Ying-Chieh Weng",
        "Chia-Hao Kao",
        "Cheng Chien",
        "Wei-Chen Chiu",
        "Wen-Hsiao Peng"
      ],
      "year": 2023,
      "venue": "ICCV 2023",
      "version": "CVF open-access accepted proceedings version, ICCV 2023",
      "fields": [
        "14",
        "06"
      ],
      "tags": [
        "机器视觉",
        "视觉提示",
        "任务适配",
        "图像压缩",
        "编码端搜索"
      ],
      "summary": "作者保留面向人眼训练的 Transformer 图像编解码器，在编码端加入由当前图像生成的实例提示，在解码端加入任务提示，让同一骨干生成面向不同视觉任务的码流。设计重点是任务准确率与传输比特的联合权衡。",
      "question": "任务提示和提示生成器的训练、部署、共享成本如何计算？切换到未见任务时能否继续保留骨干，还是需要额外任务训练？",
      "caveat": "固定骨干不等于零训练迁移；单任务定制码流也不等于一条码流同时服务任意任务。本轮只读摘要和完整引言，未审阅实现或复现率–准确率实验。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2023/html/Chen_TransTIC_Transferring_Transformer-based_Image_Compression_from_Human_Perception_to_Machine_ICCV_2023_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2023/html/Chen_TransTIC_Transferring_Transformer-based_Image_Compression_from_Human_Perception_to_Machine_ICCV_2023_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "TRANSTIC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "5a5509bcd0525ed39a9425beb8a9ab5017c3ca1abfbffa4145f566cc2c931812",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "TASKCTRL",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        },
        {
          "id": "TTFT_LIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "TTFT_LIC",
      "title": "Test-Time Fine-Tuning of Image Compression Models for Multi-Task Adaptability",
      "authors": [
        "Unki Park",
        "Seongmoon Jeong",
        "Youngchan Jang",
        "Gyeong-Moon Park",
        "Jong Hwan Ko"
      ],
      "year": 2025,
      "venue": "CVPR 2025",
      "version": "CVF open-access accepted proceedings version, CVPR 2025",
      "fields": [
        "14",
        "06"
      ],
      "tags": [
        "测试时适配",
        "SVD-LoRA",
        "机器视觉",
        "参数开销",
        "编码端搜索"
      ],
      "summary": "作者针对每张图像和目标任务在测试时优化编码器与解码器的 SVD-LoRA。解码端尽量只调整并传输奇异值成分，以减少逐实例更新的参数码量，目标是适配预训练时未见的机器视觉任务。",
      "question": "把新增参数比特与优化耗时计入后，单任务码率收益是否仍然成立？在相同推理预算下应如何选择迭代次数与秩？",
      "caveat": "开放集适配依赖可用的任务优化信号，并伴随测试时计算和解码端更新。作者的 BD-rate 数字是率–任务指标结果，不能直接当成 PSNR–bpp 改善。未执行代码或模型。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/html/Park_Test-Time_Fine-Tuning_of_Image_Compression_Models_for_Multi-Task_Adaptability_CVPR_2025_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/html/Park_Test-Time_Fine-Tuning_of_Image_Compression_Models_for_Multi-Task_Adaptability_CVPR_2025_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "TTFT_LIC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        }
      ],
      "evidence": [],
      "sha256": "3d030ae5096ad42db0b7f7daf4f33cfb78e8dd37324b674a091fe5466f59c355",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "TRANSTIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        },
        {
          "id": "TRANSVFC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "ACCELIR",
      "title": "AccelIR: Task-Aware Image Compression for Accelerating Neural Restoration",
      "authors": [
        "Juncheol Ye",
        "Hyunho Yeo",
        "Jinwoo Park",
        "Dongsu Han"
      ],
      "year": 2023,
      "venue": "CVPR 2023",
      "version": "CVF open-access accepted proceedings version, CVPR 2023",
      "fields": [
        "14",
        "03",
        "11"
      ],
      "tags": [
        "图像恢复",
        "块级质量分配",
        "端到端代价",
        "传统编码控制",
        "机器视觉",
        "实时系统",
        "码率控制"
      ],
      "summary": "作者先离线建立图像块在不同压缩质量下的恢复质量与码量画像，在线用轻量网络选择画像并分配块级质量。通过较合适的压缩输入补偿轻量恢复网络的能力损失，在固定图像大小和恢复质量下减少恢复计算。",
      "question": "同一码量下，改变 JPEG/WebP 块质量是否比单纯换一个更大的恢复模型有效？离线画像对新内容、退化类型和恢复模型有多稳健？",
      "caveat": "这是传统图像编码与下游恢复的系统协同，并非新的视频熵模型。成本不能只看恢复网络，还要计入画像、选择器和编码；未复现论文计算节省比例。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2023/html/Ye_AccelIR_Task-Aware_Image_Compression_for_Accelerating_Neural_Restoration_CVPR_2023_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2023/html/Ye_AccelIR_Task-Aware_Image_Compression_for_Accelerating_Neural_Restoration_CVPR_2023_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "ACCELIR_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        }
      ],
      "evidence": [],
      "sha256": "308ec49135dcae7466b2a2c331df082fa306864f06b3e08f63caec7c5f3df3e0",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "TRANSVFC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        },
        {
          "id": "UIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "UIC",
      "title": "A Unified Image Compression Method for Human Perception and Multiple Vision Tasks",
      "authors": [
        "Sha Guo",
        "Lin Sui",
        "Chenlin Zhang",
        "Zhuo Chen",
        "Wenhan Yang",
        "Lingyu Duan"
      ],
      "year": 2024,
      "venue": "ECCV 2024",
      "version": "ECVA open-access ECCV 2024 proceedings version",
      "fields": [
        "14",
        "08"
      ],
      "tags": [
        "多任务",
        "开放集",
        "扩散先验",
        "统一表示",
        "机器视觉",
        "感知生成"
      ],
      "summary": "作者用多任务协同嵌入提取紧凑表示，再借助记忆库和扩散模型学习跨任务共性，兼顾人眼重建及已见、未见机器任务。其目标是用通用表示缓解单一任务特征压缩缺少泛化能力的问题。",
      "question": "一个统一码流的通用性需要付出多少单任务冗余？未见任务的提升来自编码信息还是扩散先验，二者如何分离验证？",
      "caveat": "作者报告的是多种任务指标下的率–性能变化；不能与 PSNR BD-rate 混用。扩散生成的感知合理性不等于原始细节忠实性；这里只筛读到完整引言，未精读实验和实现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3,
        4
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2024/papers_ECCV/html/9009_ECCV_2024_paper.php",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2024/papers_ECCV/html/9009_ECCV_2024_paper.php",
      "codeUrl": "",
      "notes": [
        {
          "label": "UIC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "2c076e14e247df915984ab5500bc06bb5c3a5cdf16c0a4063e3cd1d3f13badc9",
      "pages": 17,
      "addedThisRound": false,
      "relations": [
        {
          "id": "ACCELIR",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        },
        {
          "id": "ACCMPEG",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。 ECVA landing page spells Chen-Lin Zhang; PDF first page uses Chenlin Zhang, retained here.",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "ACCMPEG",
      "title": "AccMPEG: Optimizing Video Encoding for Video Analytics",
      "authors": [
        "Kuntai Du",
        "Qizheng Zhang",
        "Anton Arapin",
        "Haodong Wang",
        "Zhengxu Xia",
        "Junchen Jiang"
      ],
      "year": 2022,
      "venue": "MLSys 2022",
      "version": "MLSys 2022 official proceedings PDF with artifact appendix",
      "fields": [
        "14",
        "03",
        "11"
      ],
      "tags": [
        "视频分析",
        "宏块QP",
        "编码控制",
        "准确率梯度",
        "机器视觉",
        "实时系统",
        "码率控制"
      ],
      "summary": "作者用便宜的质量选择器预测 16×16 宏块质量对服务器任务准确率的影响，再调用常见视频编码器的 ROI 编码。系统同时追求较小摄像端计算、较低编码与传输延迟，以及足够的任务准确率。",
      "question": "在固定网络和端侧资源下，宏块质量控制能否比全帧统一 QP 改善时延–准确率曲线？换任务网络或换场景后，选择器需要多快重校准？",
      "caveat": "任务重要区域未必等于检测框；背景上下文也可能重要。原文摘要与引言对评估 DNN 数量的表述有差异，本记录不据此确定总数。未运行其 FFmpeg/模型或核实速度。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://uchi-jcl.github.io/group-website/publication/accmpeg/",
      "sourceUrl": "https://uchi-jcl.github.io/group-website/publication/accmpeg/",
      "codeUrl": "https://github.com/KuntaiDu/AccMPEG/tree/MLSys",
      "notes": [
        {
          "label": "ACCMPEG_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        }
      ],
      "evidence": [],
      "sha256": "6b63d60f40419fbe453d135ce294a16aa9006b6dd0a0f308e0dfb00cb856f928",
      "pages": 17,
      "addedThisRound": false,
      "relations": [
        {
          "id": "UIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        },
        {
          "id": "BOTTLENETPP",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "BOTTLENETPP",
      "title": "BottleNet++: An End-to-End Approach for Feature Compression in Device-Edge Co-Inference Systems",
      "authors": [
        "Jiawei Shao",
        "Jun Zhang"
      ],
      "year": 2020,
      "venue": "ICC Workshops 2020; archived arXiv author version",
      "version": "arXiv:1910.14315v5, 2020-06-05; first submitted 2019-10-31",
      "fields": [
        "14",
        "13",
        "03"
      ],
      "tags": [
        "切分推理",
        "特征压缩",
        "联合信源信道",
        "端边协作",
        "机器视觉",
        "网络传输",
        "实时系统"
      ],
      "summary": "作者在切分网络的中间特征处插入轻量编码器、不可训练信道层和解码器，以端到端方式同时压缩特征并抵抗信道扰动。它利用任务网络对特征误差的容忍度，使更早切分成为可能，减少设备侧计算。",
      "question": "在任务准确率约束下，特征传输节约能否抵消新增编解码计算？切分点、信道条件和特征瓶颈应如何联合选择？",
      "caveat": "目标是分类推理而非图像重建，AWGN 带宽压缩比与 BEC 比特压缩比不是同一种单位，不能直接换算成视频 bpp。只筛读摘要与完整引言，未验证通信模型实现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/1910.14315v5",
      "sourceUrl": "https://arxiv.org/abs/1910.14315v5",
      "codeUrl": "https://github.com/shaojiawei07/BottleNetPlusPlus",
      "notes": [
        {
          "label": "BOTTLENETPP_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "b4eabe8e9ae97485b0032984a56e912d9c40777d2a0e466c83f7705c33998282",
      "pages": 6,
      "addedThisRound": false,
      "relations": [
        {
          "id": "ACCMPEG",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "DEEPJSCC",
      "title": "Deep Joint Source-Channel Coding for Wireless Image Transmission",
      "authors": [
        "Eirina Bourtsoulatze",
        "David Burth Kurka",
        "Deniz Gündüz"
      ],
      "year": 2019,
      "venue": "IEEE TCCN 2019; archived arXiv author version",
      "version": "arXiv:1809.01733v4, 2019-06-17; first submitted 2018-09-04",
      "fields": [
        "13",
        "10"
      ],
      "tags": [
        "JSCC",
        "AWGN",
        "瑞利衰落",
        "悬崖效应",
        "网络传输",
        "训练与量化"
      ],
      "summary": "作者用卷积编解码网络直接把图像映射为复数信道符号，将噪声信道作为训练中的固定层，学习同时压缩与抗噪的表示。论文重点展示有限带宽和信道失配时，质量随 SNR 较平滑变化的特点。",
      "question": "在相同信道使用次数、功率和延迟下，学习式联合编码相对压缩加纠错的优势在哪些 SNR 范围成立？训练信道与实际信道不同时会怎样？",
      "caveat": "这不是可直接落盘比较的熵编码码流；信道带宽比 k/n 不等于 bpp。有限块长实验并不推翻 Shannon 分离定理的渐近条件；未复现论文通信仿真。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/1809.01733v4",
      "sourceUrl": "https://arxiv.org/abs/1809.01733v4",
      "codeUrl": "",
      "notes": [
        {
          "label": "DEEPJSCC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "ed0494782f43d27c777337091acdd7f14d43a719fa9534de94130152d55ce84a",
      "pages": 13,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DEEPJSCC_F",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "DEEPJSCC_F",
      "title": "DeepJSCC-f: Deep Joint Source-Channel Coding of Images with Feedback",
      "authors": [
        "David Burth Kurka",
        "Deniz Gündüz"
      ],
      "year": 2020,
      "venue": "IEEE JSAIT, accepted/to appear according to arXiv comments; archived 2020 author version",
      "version": "arXiv:1911.11174v2, 2020-04-09; first submitted 2019-11-25",
      "fields": [
        "13",
        "12"
      ],
      "tags": [
        "反馈",
        "JSCC",
        "可变长度",
        "渐进传输",
        "网络传输",
        "可伸缩编码"
      ],
      "summary": "作者把信道带宽分成多个块，后续发送内容依赖原图和经反馈获知的接收端重建状态，逐层改善重建。框架讨论有噪和无噪反馈，并可在满足质量目标后停止发送以支持可变长度传输。",
      "question": "反馈链路的带宽、噪声与往返等待计入后，最优精化层数是多少？它与仅接收 ACK/NACK 的重传方案应如何做公平比较？",
      "caveat": "论文使用的是信道输出反馈，不可等同免费且瞬时的确认信号。质量收益、平均发送长度与端到端时延需分开；本轮引言横跨 PDF 1–7 页，未执行反馈仿真。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7
      ],
      "localPdf": "https://arxiv.org/abs/1911.11174v2",
      "sourceUrl": "https://arxiv.org/abs/1911.11174v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "DEEPJSCC_F_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a6c5aa47fec271bc51127e0303acf8bd0716d048ca82f6e34ba719c0ccd6e10b",
      "pages": 35,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DEEPJSCC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        },
        {
          "id": "DEEPJSCC_L",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "DEEPJSCC_L",
      "title": "Bandwidth-Agile Image Transmission with Deep Joint Source-Channel Coding",
      "authors": [
        "David Burth Kurka",
        "Deniz Gündüz"
      ],
      "year": 2021,
      "venue": "Archived arXiv author version",
      "version": "arXiv:2009.12480v2, 2021-06-14; first submitted 2020-09-26",
      "fields": [
        "13",
        "12"
      ],
      "tags": [
        "带宽自适应",
        "渐进精化",
        "多描述",
        "JSCC",
        "网络传输",
        "可伸缩编码"
      ],
      "summary": "作者设计可按多层发送的联合信源信道编码：渐进精化要求按顺序接收，多描述则允许任意子集抵达。接收更多层时获得更高质量，三种网络结构探索计算、存储与编码效果的取舍。",
      "question": "在固定总信道使用量下，分层或多描述损失了多少单层最优性能？有序前缀接收与任意子集丢失必须分别评估。",
      "caveat": "按层接收的信道模型不能直接代表实际视频数据包突发丢失；本文对象是图像且输出为信道符号。本轮只读摘要和完整引言，未验证多描述编码器和各层资源。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6
      ],
      "localPdf": "https://arxiv.org/abs/2009.12480v2",
      "sourceUrl": "https://arxiv.org/abs/2009.12480v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "DEEPJSCC_L_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域12分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/12_%E5%8F%AF%E4%BC%B8%E7%BC%A9%E7%BC%96%E7%A0%81%E4%B8%8E%E5%88%86%E5%B1%82%E4%BE%9D%E8%B5%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "c590c7b85b15919cba158f8ef1a5534de145c1831ea829d013267a8a1f54f13a",
      "pages": 32,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DEEPJSCC_F",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        },
        {
          "id": "SWINJSCC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "SWINJSCC",
      "title": "SwinJSCC: Taming Swin Transformer for Deep Joint Source-Channel Coding",
      "authors": [
        "Ke Yang",
        "Sixian Wang",
        "Jincheng Dai",
        "Xiaoqi Qin",
        "Kai Niu",
        "Ping Zhang"
      ],
      "year": 2024,
      "venue": "Archived arXiv author version",
      "version": "arXiv:2308.09361v2, 2024-07-05; first submitted 2023-08-18",
      "fields": [
        "13",
        "11",
        "03"
      ],
      "tags": [
        "Swin Transformer",
        "空间调制",
        "多码率",
        "高分辨率",
        "网络传输",
        "码率控制",
        "实时系统"
      ],
      "summary": "作者用 Swin Transformer 提高联合编码的表示能力，再加入 Channel ModNet 与 Rate ModNet，让单个模型适应不同 SNR 和传输带宽。调制作用于潜表示，码率模块通过可学习掩码控制传输资源。",
      "question": "更大表示能力、信道调制和码率调制分别带来多少收益？要在高分辨率、同设备和完整收发链路下比较，而不只比较 FLOPs。",
      "caveat": "论文的图像传输 CBR、SNR 与视频熵码流 bpp 不是统一评价轴；速度依赖实际实现和硬件。已读摘要、完整引言及系统模型开头，未审阅公开仓库或跑模型。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://arxiv.org/abs/2308.09361v2",
      "sourceUrl": "https://arxiv.org/abs/2308.09361v2",
      "codeUrl": "https://github.com/semcomm/SwinJSCC",
      "notes": [
        {
          "label": "SWINJSCC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "1bad60d13c5b44297f435fb9cfd846e40a0f013560f84b65730a524dfbb5d3c4",
      "pages": 14,
      "addedThisRound": false,
      "relations": [
        {
          "id": "DEEPJSCC_L",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        },
        {
          "id": "DEEPWIVE",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。另外查看第3页系统模型开头，不据此升级为方法精读。"
    },
    {
      "id": "TRANSVFC",
      "title": "TransVFC: A Transformable Video Feature Compression Framework for Machines",
      "authors": [
        "Yuxiao Sun",
        "Yao Zhao",
        "Meiqin Liu",
        "Chao Yao",
        "Huihui Bai",
        "Chunyu Lin",
        "Weisi Lin"
      ],
      "year": 2025,
      "venue": "Pattern Recognition 171 (2026), 112091; archived author version",
      "version": "arXiv:2503.23772v2, 2025-10-17; final journal issue March 2026",
      "fields": [
        "14",
        "02"
      ],
      "tags": [
        "视频特征压缩",
        "多任务",
        "特征空间迁移",
        "时域冗余",
        "机器视觉",
        "表示与参考"
      ],
      "summary": "作者通过视频特征编解码消除时域冗余，并用感知引导的条件编码得到重建特征；之后用轻量 FST 把特征映射到不同任务空间。新增任务主要训练 FST，避免重新部署整个上游编码器和下游网络。",
      "question": "特征空间迁移能保留多少任务无关信息？时间预测收益与任务迁移收益应怎样拆开，新增任务 FST 的训练和部署成本多大？",
      "caveat": "率–任务性能不等于视频重建 RD；FST 仍需新任务训练，并非无条件泛化。保存的是 2025-10 的作者接收稿，正式期刊卷期为 2026；未检出或执行其代码。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3,
        4
      ],
      "localPdf": "https://arxiv.org/abs/2503.23772v2",
      "sourceUrl": "https://arxiv.org/abs/2503.23772v2",
      "codeUrl": "https://github.com/Ws-Syx/TransVFC",
      "notes": [
        {
          "label": "TRANSVFC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域14分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/14_%E9%9D%A2%E5%90%91%E6%9C%BA%E5%99%A8%E8%A7%86%E8%A7%89%E7%9A%84%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "47a8d9f244ecc41d1a781c80e2c63f2db5de8d15b032fccca375d34f2487fdd5",
      "pages": 25,
      "addedThisRound": false,
      "relations": [
        {
          "id": "TTFT_LIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        },
        {
          "id": "ACCELIR",
          "type": "reading_path",
          "reason": "建议阅读顺序：压缩给机器看什么"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "RELVIC",
      "title": "ReLViC: Loss-Resilient Learned Video Coding with Dispersed Packetization and Controllable Packet Dependencies",
      "authors": [
        "Xuyang Chen",
        "Daquan Feng",
        "Xianfu Chen",
        "Xiang-Gen Xia"
      ],
      "year": 2026,
      "venue": "arXiv preprint",
      "version": "arXiv:2608.30202v1, 2026-08-31; preprint, no peer-reviewed venue verified",
      "fields": [
        "13",
        "04"
      ],
      "tags": [
        "丢包恢复",
        "分包依赖",
        "潜变量恢复",
        "突发丢包",
        "网络传输",
        "参考失效"
      ],
      "summary": "作者把空间邻近潜变量分散到不同包，用共享 Transformer 既估计熵模型参数又恢复缺失潜变量，并用周期重置的包上下文控制依赖跨度。训练分阶段加入时域建模和掩码恢复，目标是在突发丢包下稳定视频质量。",
      "question": "缩短包依赖长度付出多少无丢包码率代价？在相同突发丢包轨迹、播放截止时间和总网络码量下，是否胜过 DCVC 加 FEC 或 GRACE？",
      "caveat": "目前核对的是 2026-08-31 arXiv v1 预印本，未确认同行评审发表。引言中的最大 g−1 依赖跨度是包上下文描述，不可自行外推为全视频误差传播上界；未复现实验。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2608.30202v1",
      "sourceUrl": "https://arxiv.org/abs/2608.30202v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "RELVIC_note（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域13分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/13_%E4%B8%A2%E5%8C%85%E6%81%A2%E5%A4%8D%E4%B8%8E%E8%81%94%E5%90%88%E4%BF%A1%E6%BA%90%E4%BF%A1%E9%81%93%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        }
      ],
      "evidence": [],
      "sha256": "27af00973dd9510d5d9c7fa0f7c1472b3c1ede6a8a40efb1d4b911c16fbdc9a4",
      "pages": 13,
      "addedThisRound": false,
      "relations": [
        {
          "id": "GRACE",
          "type": "reading_path",
          "reason": "建议阅读顺序：从文件压缩走向有噪信道"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言；页码为本地 PDF 一基页码，末页仅声称相关段落已读。"
    },
    {
      "id": "EXTREME_GAN",
      "title": "Generative Adversarial Networks for Extreme Learned Image Compression",
      "authors": [
        "Eirikur Agustsson",
        "Michael Tschannen",
        "Fabian Mentzer",
        "Radu Timofte",
        "Luc Van Gool"
      ],
      "year": 2019,
      "venue": "ICCV 2019",
      "version": "ICCV 2019 official proceedings PDF",
      "fields": [
        "08",
        "09"
      ],
      "tags": [
        "GAN",
        "极低码率",
        "语义侧信息",
        "感知生成",
        "评价方法"
      ],
      "summary": "在极低码率下用GAN合成未能存储的细节；区分不需语义图的生成压缩与依赖语义图的选择性生成压缩。",
      "question": "生成区域的语义信息与额外侧信息应如何计费？人眼偏好、输入忠实性与任务可用性是否一致？",
      "caveat": "合成纹理并非还原输入中真实的纹理。选择性模式需要语义/实例图及其码量；不能把它与无侧信息模式混算，也不能把作者主观偏好收益直接换成PSNR节码率。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content_ICCV_2019/html/Agustsson_Generative_Adversarial_Networks_for_Extreme_Learned_Image_Compression_ICCV_2019_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content_ICCV_2019/html/Agustsson_Generative_Adversarial_Networks_for_Extreme_Learned_Image_Compression_ICCV_2019_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "EXTREME_GAN_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "EXTREME_GAN_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "5b3bdb192d5c98dc87550419da9802b85397d36c3f703e5a037f2060364d6fc8",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "RDP2019",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        },
        {
          "id": "HIFIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 Complete PDF pages1–2 including abstract and full introduction; not full paper or proofs. Figure captions read, no visual performance assessment."
    },
    {
      "id": "HIFIC",
      "title": "High-Fidelity Generative Image Compression",
      "authors": [
        "Fabian Mentzer",
        "George Toderici",
        "Michael Tschannen",
        "Eirikur Agustsson"
      ],
      "year": 2020,
      "venue": "NeurIPS 2020",
      "version": "NeurIPS 2020 official proceedings PDF",
      "fields": [
        "08",
        "09"
      ],
      "tags": [
        "感知压缩",
        "GAN",
        "主观评价",
        "感知生成",
        "评价方法"
      ],
      "summary": "将学习式码率模型、配对失真目标与对抗训练结合，研究自然感和输入相似性的折中，并用多种指标及主观评价检查重建。",
      "question": "把LPIPS、FID和PSNR并列后，哪些纹理看似合理但与输入不一致？进入视频后应增加哪些时间一致性证据？",
      "caveat": "作者的主观比较依赖具体数据与设置；文中也指出没有单项指标完整预测主观排序。图像生成结果不能证明视频时域稳定，本轮未运行模型。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://papers.nips.cc/paper_files/paper/2020/hash/8a50bae297807da9e97722a0b3fd8f27-Abstract.html",
      "sourceUrl": "https://papers.nips.cc/paper_files/paper/2020/hash/8a50bae297807da9e97722a0b3fd8f27-Abstract.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "HIFIC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "HIFIC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "16b9bd009e35154314fbc2810dc0758ceb38404680bb93b22efd07fb8453ae4e",
      "pages": 12,
      "addedThisRound": false,
      "relations": [
        {
          "id": "EXTREME_GAN",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        },
        {
          "id": "CDC_DIFFUSION",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 Complete PDF pages1–2 including abstract and full introduction; not full paper or proofs. Figure captions read, no visual performance assessment."
    },
    {
      "id": "RDP2019",
      "title": "Rethinking Lossy Compression: The Rate-Distortion-Perception Tradeoff",
      "authors": [
        "Yochai Blau",
        "Tomer Michaeli"
      ],
      "year": 2019,
      "venue": "ICML 2019 (PMLR 97)",
      "version": "ICML 2019 (PMLR 97) official proceedings PDF",
      "fields": [
        "08",
        "09"
      ],
      "tags": [
        "率失真感知",
        "信息论",
        "评价口径",
        "感知生成",
        "评价方法"
      ],
      "summary": "把码率、逐样本失真与输出分布的感知约束同时纳入最优编码分析；在指定条件下，更强感知约束会抬高率失真最优边界。",
      "question": "在同一码量下，像素误差、配对特征距离与分布接近分别测量什么？如何避免把次优模型的改进误说成突破理论边界？",
      "caveat": "理论针对最优可达边界及规定的源和距离，不代表任意两种次优方法不可能同时改善三个指标。本文初筛未逐项核完证明；Bernoulli/MNIST例子不是自然视频实验。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://proceedings.mlr.press/v97/blau19a.html",
      "sourceUrl": "https://proceedings.mlr.press/v97/blau19a.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "RDP2019_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "RDP2019_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        }
      ],
      "evidence": [],
      "sha256": "85eb68407a3248ac4ac9e38859f2b83290515383388e8f894e885f96a0e0d93b",
      "pages": 11,
      "addedThisRound": false,
      "relations": [
        {
          "id": "PD_TRADEOFF",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        },
        {
          "id": "EXTREME_GAN",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 Complete PDF pages1–2 including abstract and full introduction; not full paper or proofs. Figure captions read, no visual performance assessment."
    },
    {
      "id": "CDC_DIFFUSION",
      "title": "Lossy Image Compression with Conditional Diffusion Models",
      "authors": [
        "Ruihan Yang",
        "Stephan Mandt"
      ],
      "year": 2023,
      "venue": "NeurIPS 2023",
      "version": "NeurIPS 2023 official proceedings PDF",
      "fields": [
        "08",
        "01"
      ],
      "tags": [
        "条件扩散",
        "内容潜变量",
        "生成式解码",
        "感知生成",
        "熵模型"
      ],
      "summary": "保留可熵编码的内容潜变量，把重建器改成条件扩散模型；内容被传输，部分纹理在解码时生成，可沿保真和感知目标调整。",
      "question": "相同内容码量下，扩散采样步数、随机性和重建目标如何改变配对误差、分布指标与完整解码时间？",
      "caveat": "少量采样步骤不等于实际实时，也不证明生成细节来自输入。图像上的FID或失真结果不能直接移植为视频时序结论；没有下载权重或运行采样。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://papers.nips.cc/paper_files/paper/2023/hash/ccf6d8b4a1fe9d9c8192f00c713872ea-Abstract-Conference.html",
      "sourceUrl": "https://papers.nips.cc/paper_files/paper/2023/hash/ccf6d8b4a1fe9d9c8192f00c713872ea-Abstract-Conference.html",
      "codeUrl": "https://github.com/buggyyang/CDC_compression",
      "notes": [
        {
          "label": "CDC_DIFFUSION_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "CDC_DIFFUSION_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域08分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/08_%E6%84%9F%E7%9F%A5%E4%B8%8E%E7%94%9F%E6%88%90%E5%BC%8F%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cc467774e14edc87ef52aad8e748f43582ba06881f52bc5e18a04aa9323ddf09",
      "pages": 25,
      "addedThisRound": false,
      "relations": [
        {
          "id": "HIFIC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        },
        {
          "id": "DIFFVC",
          "type": "reading_path",
          "reason": "建议阅读顺序：从感知理论到生成式重建"
        }
      ],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 Complete PDF pages1–2 including abstract and full introduction; not full paper or proofs. Figure captions read, no visual performance assessment."
    },
    {
      "id": "DVCPRO",
      "title": "An End-to-End Learning Framework for Video Compression",
      "authors": [
        "Guo Lu",
        "Xiaoyun Zhang",
        "Wanli Ouyang",
        "Li Chen",
        "Zhiyong Gao",
        "Dong Xu"
      ],
      "year": 2020,
      "venue": "IEEE TPAMI (2020 accepted author proof)",
      "version": "Author-hosted IEEE Proof; accepted 2020-04-01; DOI 10.1109/TPAMI.2020.2988453; not final paginated issue PDF",
      "fields": [
        "02",
        "01",
        "03",
        "10"
      ],
      "tags": [
        "DVC期刊扩展",
        "轻量网络",
        "自适应量化",
        "表示与参考",
        "熵模型",
        "实时系统",
        "训练与量化"
      ],
      "summary": "DVC期刊扩展：保留运动补偿加残差的可训练混合结构，分别以DVC_Lite和DVC_Pro处理速度/效率取舍，并加入共享模型的自适应量化。",
      "question": "在相同GOP与码率口径下，运动/残差网络增强、重建精炼和自适应量化分别贡献多少收益与解码成本？",
      "caveat": "这是作者主页的IEEE Proof，不能标作最终出版PDF。是已有DVC的实质期刊扩展，不是一个与DVC无关的新谱系；单模型多质量点不等于达到指定目标码率。未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        16
      ],
      "localPdf": "https://guolusjtu.github.io/guoluhomepage/paper/TPAMI2988453.pdf",
      "sourceUrl": "https://guolusjtu.github.io/guoluhomepage/paper/TPAMI2988453.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "DVCPRO_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DVCPRO_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DVCPRO_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DVCPRO（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "49be1eefc2a782ecdd5af0d273e4a7d8197af4067837711f3bcc15a05d92b429",
      "pages": 17,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 六位作者按已视看PDF首页顺序录入。year=2020对应本地proof的接收/版权年份；未用后续卷期年份冒充此文件版本。p2正文98–118行明确期刊扩展，p16参考[25]为CVPR2019 DVC。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 完整摘要与引言起始段；含作者、DOI、接收日期；p2: 只计引言续文至正文行118，Related Work之前；p16: 只读参考文献[25]条目以核对前作身份，未读整页。不等于全文、方法或实验精读。"
    },
    {
      "id": "BEPIC",
      "title": "Extending Neural P-Frame Codecs for B-Frame Coding",
      "authors": [
        "Reza Pourreza",
        "Taco Cohen"
      ],
      "year": 2021,
      "venue": "ICCV 2021",
      "version": "CVF ICCV2021 open-access accepted paper",
      "fields": [
        "02",
        "05"
      ],
      "tags": [
        "P-to-B改造",
        "插值参考",
        "GOP",
        "表示与参考",
        "双向编码"
      ],
      "summary": "先用前后参考插值成一个虚拟参考，再交给现有P帧编解码器传输运动修正和残差；同一P帧网络可参与P/B帧编码。",
      "question": "插值错误应以额外运动修正还是残差补偿？在相同等待帧数与GOP下，P-to-B改造的收益如何变化？",
      "caveat": "需要未来已解码参考；额外等待和插值计算不能忽略。引言UVG的28.5%节码率是作者报告的特定P帧基线比较，不能直接外推到DCVC-RT。未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/ICCV2021/html/Pourreza_Extending_Neural_P-Frame_Codecs_for_B-Frame_Coding_ICCV_2021_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/ICCV2021/html/Pourreza_Extending_Neural_P-Frame_Codecs_for_B-Frame_Coding_ICCV_2021_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "BEPIC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "BEPIC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "BEPIC_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "BEPIC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "d7678b611bdbfcc73bf9c68494d85b727dc718fcc52778e85098bcef3a7cab37",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 作者和标题按CVF首页视看核对；不是B-CANF或DCVCB的别名。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 摘要与引言起始段；视看首页图1和作者；p2: 只读引言续文及图2说明，至Related work标题前。不等于全文、方法或实验精读。"
    },
    {
      "id": "VCII",
      "title": "Video Compression through Image Interpolation",
      "authors": [
        "Chao-Yuan Wu",
        "Nayan Singhal",
        "Philipp Krähenbühl"
      ],
      "year": 2018,
      "venue": "ECCV 2018",
      "version": "CVF ECCV2018 author-created version; watermark states content identical to published LNCS version",
      "fields": [
        "02",
        "05"
      ],
      "tags": [
        "早期层次插值",
        "补充代码",
        "锚点帧",
        "表示与参考",
        "双向编码"
      ],
      "summary": "将视频编码组织为递归的层次图像插值：先编码锚点，再用运动对齐参考特征并发送补充代码来消除插值歧义。",
      "question": "锚点间隔、层次数和运动侧信息量如何影响误差传播与最终码率？不同层是否必须独立网络？",
      "caveat": "这是2018年早期路线。作者的H.264可比结论不能当作现代配置排名；运动预估、训练目标、码流开销和多模型成本仍待方法章节核对。未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://arxiv.org/abs/1804.06919",
      "sourceUrl": "https://arxiv.org/abs/1804.06919",
      "codeUrl": "https://github.com/chaoyuaw/pytorch-vcii",
      "notes": [
        {
          "label": "VCII_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "VCII_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "VCII_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "VCII（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "5348265535631d3fa3d86b51be5f9a0a5d9405b4d13a87cb092049bd3aeb026b",
      "pages": 16,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 姓名变音符按首页还原。作者GitHub链接已访问，README说明部分功能尚未提供；有代码链接不等于可完整复现。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 摘要与引言起始段，视看首页；p2: 引言续文与图1说明；p3: 只读页首引言最后段，至Related Work前。不等于全文、方法或实验精读。"
    },
    {
      "id": "NEURALINTER",
      "title": "Neural Inter-Frame Compression for Video Coding",
      "authors": [
        "Abdelaziz Djelouah",
        "Joaquim Campos",
        "Simone Schaub-Meyer",
        "Christopher Schroers"
      ],
      "year": 2019,
      "venue": "ICCV 2019",
      "version": "CVF ICCV2019 open-access accepted paper",
      "fields": [
        "02",
        "05"
      ],
      "tags": [
        "潜空间残差",
        "运动融合联合解码",
        "共享图像编码器",
        "表示与参考",
        "双向编码"
      ],
      "summary": "把运动与融合系数联合解码，并在潜空间表达插值残差，使关键帧和中间帧可以复用同一个图像自编码器。",
      "question": "共享图像/残差潜空间是否真正减少参数与解码成本，同时避免关键帧和中间帧质量不匹配？",
      "caveat": "共享表示与联合合成不自动保证端到端更快；需要单独核算运动、残差、解码网络成本。引言定性对照不是本项目重建效果实验，未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content_ICCV_2019/html/Djelouah_Neural_Inter-Frame_Compression_for_Video_Coding_ICCV_2019_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content_ICCV_2019/html/Djelouah_Neural_Inter-Frame_Compression_for_Video_Coding_ICCV_2019_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "NEURALINTER_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "NEURALINTER_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "NEURALINTER_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "NEURALINTER（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "5be44d282ec234253f82059cffb0a6f617b176e4226eaa82799a5e20737ef5e5",
      "pages": 9,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 四作者顺序按首页，来源为CVF官方ICCV2019。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 摘要与引言起始段；作者及首页图1视看；p2: 只读引言续文和贡献列表，至Related Work前。不等于全文、方法或实验精读。"
    },
    {
      "id": "LHBDC",
      "title": "End-to-End Rate-Distortion Optimized Learned Hierarchical Bi-Directional Video Compression",
      "authors": [
        "M. Akın Yılmaz",
        "A. Murat Tekalp"
      ],
      "year": 2021,
      "venue": "IEEE TIP (accepted manuscript, 2021)",
      "version": "arXiv:2112.09529v1, 2021-12-17; PDF states TIP accepted 2021-12-15",
      "fields": [
        "02",
        "05",
        "10"
      ],
      "tags": [
        "层次双向",
        "掩码融合",
        "运动预测",
        "表示与参考",
        "双向编码",
        "训练与量化"
      ],
      "summary": "将层次双向运动补偿纳入端到端率失真优化，并引入双向融合掩码、光流下采样和时间光流预测来降低预测及运动码量成本。",
      "question": "层次参考带来的增益在多大程度上来自GOP与训练范围变化，多少来自运动码量和掩码设计？",
      "caveat": "层次B帧有未来参考和调度等待；和低延迟单向模型的RD差异不能仅解释为模型更强。此PDF为2021接收稿，不混作最终期刊版。未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1
      ],
      "localPdf": "https://arxiv.org/abs/2112.09529v1",
      "sourceUrl": "https://arxiv.org/abs/2112.09529v1",
      "codeUrl": "https://github.com/makinyilmaz/LHBDC/",
      "notes": [
        {
          "label": "LHBDC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LHBDC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LHBDC_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LHBDC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "7bc97d7ac233ad91570e9f19db5640333aa74b4463d02ba39958456b2b5aaf09",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 首页明确是ICIP2020工作的显著扩展/重写；本轮只收这一份扩展稿，没有再收早期版本。作者缩写保留PDF写法；year表示本地版本年份。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 摘要和完整Introduction；结束于II Related Work前，未把同页相关工作计为阅读。不等于全文、方法或实验精读。"
    },
    {
      "id": "DCVCLCG",
      "title": "Long-term Temporal Context Gathering for Neural Video Compression",
      "authors": [
        "Linfeng Qi",
        "Zhaoyang Jia",
        "Jiahao Li",
        "Bin Li",
        "Houqiang Li",
        "Yan Lu"
      ],
      "year": 2024,
      "venue": "ECCV 2024",
      "version": "ECVA ECCV2024 official paper08346;19-pagePDF:maintextpp.1-14 andReferencespp.15-19; externally mentioned supplementary materials are not appended.",
      "fields": [
        "02",
        "04",
        "01"
      ],
      "tags": [
        "长期参考",
        "簇内检索",
        "误差传播",
        "量化先验",
        "表示与参考",
        "参考失效",
        "熵模型"
      ],
      "summary": "LCG从周期更新的长期键中，以前一重建特征为查询做内容分簇和簇内top-4检索，再与短期上下文融合，并以质量参数显式调制熵先验。它保留历史条件依赖；作者明确承认场景变化可能受无关长期参考干扰而退化。",
      "question": "在常规长链受益与场景切换过时参考之间，周期更新、可靠性判定和是否切断重建依赖分别解决什么？新增检索与移除offset diversity的成本如何拆开？",
      "caveat": "本轮是正文方法/实验选读，没有模型实测或源码核验。T32长期缓冲更新不等于I帧刷新；buffer不等于峰值显存；作者计时伴随架构简化。p8复杂度式的代数问题不用于否定作者RD/耗时；外部补充材料未读。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12,
        13,
        14
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/08346.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/08346.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "DCVCLCG_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DCVCLCG_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DCVCLCG_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DCVCLCG（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        },
        {
          "label": "参考可靠性精读（本地记录未公开）",
          "url": ""
        },
        {
          "label": "本轮阅读范围（本地记录未公开）",
          "url": ""
        },
        {
          "label": "三路线比较（本地记录未公开）",
          "url": ""
        },
        {
          "label": "claim_matrix（本地记录未公开）",
          "url": ""
        },
        {
          "label": "selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "arithmetic_checks（本地记录未公开）",
          "url": ""
        },
        {
          "label": "p05（本地记录未公开）",
          "url": ""
        },
        {
          "label": "p06（本地记录未公开）",
          "url": ""
        },
        {
          "label": "p08（本地记录未公开）",
          "url": ""
        },
        {
          "label": "p13（本地记录未公开）",
          "url": ""
        },
        {
          "label": "p14（本地记录未公开）",
          "url": ""
        }
      ],
      "evidence": [],
      "sha256": "d8bcb25a93b6ff5029475bd9a94ab45e2d7272480c46e05c3fdb951529c33c51",
      "pages": 19,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 六作者及共同实习标记按首页核验；只根据ECVA正式版本定身份，不把其他DCVC家族条目重命名为LCG。 已纠正旧版“含补充章节”：正文p1–14、参考文献p15–19；外部supplement未取得。旧字段保存在阶段before与原始历史记录。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 摘要与引言起始段，视看首页；p2: 引言续文与图1框架说明；p3: 完整引言末段和贡献列表；第4页才开始Related Works。不等于全文、方法或实验精读。 新阶段：完整读取PDF p4-14共11页（正文相关工作、方法、设置、实验、消融、复杂度与局限）；这些页此前未涉及。p5/6/8/13/14图表实际视觉核对。p15-19仅章节/页首边界检查，不计完整或部分科研阅读页。此前p1-3摘要/引言记录保留，本轮未重读该范围；外部supplement未取得。"
    },
    {
      "id": "LSTEC",
      "title": "L-STEC: Learned Video Compression with Long-term Spatio-Temporal Enhanced Context",
      "authors": [
        "Tiange Zhang",
        "Zhimeng Huang",
        "Xiandong Meng",
        "Kai Zhang",
        "Zhipin Deng",
        "Siwei Ma"
      ],
      "year": 2025,
      "venue": "arXiv preprint (author comments: DCC 2026 oral)",
      "version": "arXiv:2512.12790v1, 2025-12-14; author abstract-page comments say DCC2026 oral accepted",
      "fields": [
        "02",
        "04",
        "10"
      ],
      "tags": [
        "LSTM参考链",
        "像素特征融合",
        "长链纹理",
        "表示与参考",
        "参考失效",
        "训练与量化"
      ],
      "summary": "以LSTM延长参考链，再把像素域warp得到的空间信息和时域特征通过多感受野网络融合，针对长链遗忘与纹理丢失。",
      "question": "LSTM状态和直接长期特征检索解决的是同一问题吗？像素路径的收益来自补回纹理还是缓解状态漂移？",
      "caveat": "保存的是2025预印本v1；DCC2026 oral仅按作者摘要页comments附注，不冒称已核验会议终稿。37.01%/31.65%是相对DCVC-TCM的作者报告，不能当作相对RT的收益；未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2512.12790v1",
      "sourceUrl": "https://arxiv.org/abs/2512.12790v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "LSTEC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LSTEC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LSTEC_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "LSTEC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "92d6adf0ccff900b1eecc40bbc66ba2e21783f9bf5eec99df62587b1888f6b13",
      "pages": 10,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 PDF首页与arXiv作者链接均有六作者；页面自动生成句子中的“and 4 other authors”计数有误，未采信该自动句子。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 摘要与引言起始段；作者顺序与v1水印视看；p2: 只读引言续文和贡献列表，至Related Work前。不等于全文、方法或实验精读。"
    },
    {
      "id": "VLVC",
      "title": "Versatile Learned Video Compression",
      "authors": [
        "Runsen Feng",
        "Zongyu Guo",
        "Zhizheng Zhang",
        "Weiping Li",
        "Zhibo Chen"
      ],
      "year": 2021,
      "venue": "arXiv preprint",
      "version": "arXiv:2111.03386v2, 2022-01-05; first submission 2021-11-05; not labeled NeurIPS accepted or 2026 journal version",
      "fields": [
        "02",
        "05"
      ],
      "tags": [
        "多参考统一表示",
        "voxel flow",
        "LD与RA",
        "表示与参考",
        "双向编码"
      ],
      "summary": "用带时间坐标的3D voxel flow统一单/多参考、单/双向预测；再用多项式运动轨迹预测降低需要传输的运动信息。",
      "question": "统一运动表示是否能在同一模型中适应参考数与时间距离变化？多项式拟合在加速运动或遮挡下是否仍可靠？",
      "caveat": "v2 PDF有五作者，而arXiv摘要页列表仅四位；本条以实际PDF为准。不要误标NeurIPS2021录用，也不把2026期刊信息混入v2。作者MS-SSIM领先主张需要重查配置；未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2111.03386v2",
      "sourceUrl": "https://arxiv.org/abs/2111.03386v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "VLVC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "VLVC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "VLVC_requests（本地记录未公开）",
          "url": ""
        },
        {
          "label": "VLVC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域05分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/05_%E5%8F%8C%E5%90%91%E7%BB%93%E6%9E%84%E4%B8%8E%E6%97%B6%E9%97%B4%E8%B0%83%E5%BA%A6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "ba9f5d8fb954a78b66acbccd1981023ba558eb65bfa5a2e9f8dfb06e00e48558",
      "pages": 14,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。 PDF首页顺序是Runsen Feng、Zongyu Guo、Zhizheng Zhang、Weiping Li、Zhibo Chen；摘要页漏Weiping Li。year=2021为初始公开年份，文件版本日期是2022-01-05。搜索发现2026期刊工作，但未混入本条作者/实验。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 摘要与完整引言初筛；页码为本地PDF一基页码。p1: 摘要与引言起始段；视看作者和v2水印；p2: 只读引言续文、图1说明和结构导读，至Related Work前。不等于全文、方法或实验精读。"
    },
    {
      "id": "ADAPT_RC",
      "title": "Adaptive Rate Control for Deep Video Compression with Rate-Distortion Prediction",
      "authors": [
        "Bowen Gu",
        "Hao Chen",
        "Ming Lu",
        "Jie Yao",
        "Zhan Ma"
      ],
      "year": 2025,
      "venue": "DCC 2025",
      "version": "arXiv:2412.18834v2 (2025-05-08); first submission 2024-12-25",
      "fields": [
        "11",
        "02"
      ],
      "tags": [
        "码率控制",
        "表示与参考"
      ],
      "summary": "作者从未压缩的当前帧与参考帧预测 R-λ、D-λ 关系，在 mini-GOP 内寻找目标失真并反推逐帧编码参数。为了减少原始参考与实际重建参考的差异，预测器加入受预测失真控制的噪声；固定低分辨率输入用来约束预测开销。该路线把“选择可变码率参数”推进到“预测内容对应的码率关系”。",
      "question": "在场景切换、参考质量突变或刷新间隔改变时，预测器的关系拟合误差和真实码流预算误差如何分离？固定低分辨率输入会不会遗漏细纹理造成的码率尖峰？",
      "caveat": "作者报告的是自己的编码器、数据和mini-GOP配置下的结果。本轮只筛读摘要与引言，未核验实验表、实际码流或延迟。不能把无预编码等同于无前视或零控制开销；后续还需核对λ的目标函数约定。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2412.18834v2",
      "sourceUrl": "https://arxiv.org/abs/2412.18834v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "ADAPT_RC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ADAPT_RC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "ADAPT_RC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "a235774ff6a1d779aff18b6afe21e9a4cab5f90ec093fd929f12c719a9926add",
      "pages": 11,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 完整摘要与引言：PDF p.1及p.2至“2 Related Work”之前；p.2只计引言部分，非整页通读。另浏览p.3背景和方法开头，未计为方法精读。"
    },
    {
      "id": "DYN_ROUTE_RC",
      "title": "Learned Rate Control for Frame-Level Adaptive Neural Video Compression via Dynamic Neural Network",
      "authors": [
        "Chenhao Zhang",
        "Wei Gao"
      ],
      "year": 2024,
      "venue": "ECCV 2024",
      "version": "ECVA ECCV 2024 proceedings PDF 11394",
      "fields": [
        "11",
        "03"
      ],
      "tags": [
        "码率控制",
        "实时系统"
      ],
      "summary": "作者用可伸缩的 Dynamic-Route Autoencoder 生成不同码率与复杂度的编码路径；Rate Control Agent 预测各路径码率，再通过滑动窗口选择路径。Joint-Routes Optimization 共同训练不同路径，使一个模型在带宽和算力两个维度可调。",
      "question": "路径选择是离散的，其最小可达码率间隔是否决定精度下限？动态切路的实测耗时、峰值显存、路径信令与时间参考状态是否计入总成本？",
      "caveat": "摘要写平均 BD-rate 降低14.8%，引言叙述写13.1%；本轮仅记录文本差异，不擅自解释或拿任一数字作统一结论。平均码率误差也不能替代每帧/滑动窗口超额峰值。尚无本地复现，复杂度收益需后续按相同硬件实测。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/11394.pdf",
      "sourceUrl": "https://www.ecva.net/papers/eccv_2024/papers_ECCV/papers/11394.pdf",
      "codeUrl": "",
      "notes": [
        {
          "label": "DYN_ROUTE_RC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DYN_ROUTE_RC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "DYN_ROUTE_RC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        }
      ],
      "evidence": [],
      "sha256": "e0c4075c8f8485e40e6dbcbbcfa01bfb471b0d851e643c0b6ea2148911f7bb8b",
      "pages": 17,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p.1–2及p.3至“2 Related Works”之前，覆盖摘要与完整引言；p.3仅引言尾部，不计整页通读。"
    },
    {
      "id": "FEEDBACK_RC",
      "title": "Feedback-Driven Rate Control for Learned Video Compression",
      "authors": [
        "Zhiheng Xu",
        "Xuerui Ma",
        "Chunhua Peng",
        "Hao Zhang"
      ],
      "year": 2026,
      "venue": "arXiv preprint",
      "version": "arXiv:2604.20104v1 (2026-04-22)",
      "fields": [
        "11",
        "02"
      ],
      "tags": [
        "码率控制",
        "表示与参考"
      ],
      "summary": "作者先在 DCVC 类条件编码路径引入 λ 条件调制形成单模型多码率接口，再用对数域 PI/PID 根据目标码率与熵模型估计码率之差在线更新 λ；预算约束的双分支 GRU 在基本控制量上预测修正。引言说明实际实现采用更稳健的 PI 配置。",
      "question": "反馈若使用估计熵而不使用最终文件字节数，CDF离散化、头信息与封装偏差会如何累积？可先设计同一段视频上 estimated bpp 与 actual bpp 的逐帧误差记录，再决定是否值得接入控制器。",
      "caveat": "这是2026年arXiv v1预印本，尚未核验正式发表状态。本轮没有训练或执行控制器，作者所报误差/BD-rate不是本地结果；稳定平均码率不代表有限缓冲区不会溢出。估计码率闭环与真实码流闭环必须分开。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2604.20104v1",
      "sourceUrl": "https://arxiv.org/abs/2604.20104v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "FEEDBACK_RC_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FEEDBACK_RC_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "FEEDBACK_RC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "d5a62d2fddb171ee8061db30a21cd2d6c1567b2a5beba755569fba65da6e6de6",
      "pages": 21,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p.1及p.2至“2 Related Work”之前，覆盖摘要与完整引言；p.2相关工作未计入本次声明的筛读范围。"
    },
    {
      "id": "YUV420_CANF",
      "title": "Learned Video Compression for YUV 4:2:0 Content Using Flow-based Conditional Inter-frame Coding",
      "authors": [
        "Yung-Han Ho",
        "Chih-Hsuan Lin",
        "Peng-Yu Chen",
        "Mu-Jung Chen",
        "Chih-Peng Chang",
        "Wen-Hsiao Peng",
        "Hsueh-Ming Hang"
      ],
      "year": 2022,
      "venue": "ISCAS 2022",
      "version": "arXiv:2210.08225v1 (2022-10-15); accepted ISCAS 2022",
      "fields": [
        "11",
        "15",
        "02"
      ],
      "tags": [
        "码率控制",
        "内容与数据",
        "表示与参考"
      ],
      "summary": "作者用条件增强归一化流编码帧间信息，并以 space-to-depth 将 Y 分量与低分辨率 UV 合成六通道输入。调制网络调整卷积特征：I帧采用连续 λ，P帧采用四个离散 λ；推理先选一对参数，再固定P帧参数微调I帧参数逼近码率。",
      "question": "调 I 帧以匹配整体码率会同时改变全部后续参考质量，码率与失真变化是否单调？不同GOP下这种间接控制是否会失效？YUV加权PSNR和RGB指标如何分别影响对方法的判断？",
      "caveat": "与既有ECCV2022 CANF-VC是相关但独立论文：本稿ISCAS2022、7位作者、5页，p.2使用DVC-Pro式运动coder；ECCV稿5位作者、17页，摘要与引言明确还将条件编码用于运动。两者有大量概念重叠，不能当作相互独立的模型证据累加。作者报告的YUV结果不能直接与本地RGB PSNR比较。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://arxiv.org/abs/2210.08225v1",
      "sourceUrl": "https://arxiv.org/abs/2210.08225v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "YUV420_CANF_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "YUV420_CANF_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "YUV420_CANF（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "aa983cbec199ff05f8602ee93925914ce698340e1d63615c66542fcb1c2ba365",
      "pages": 5,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 完整摘要和引言在PDF p.1；另实际阅读p.2–3的系统、YUV变换、可变码率训练及评价口径开头；未审p.4–5结果与参考文献。不宣称全文精读。"
    },
    {
      "id": "COND_AE",
      "title": "Variable Rate Deep Image Compression With a Conditional Autoencoder",
      "authors": [
        "Yoojin Choi",
        "Mostafa El-Khamy",
        "Jungwon Lee"
      ],
      "year": 2019,
      "venue": "ICCV 2019",
      "version": "CVF ICCV 2019 accepted paper (pp.3146-3154)",
      "fields": [
        "11",
        "01"
      ],
      "tags": [
        "码率控制",
        "熵模型"
      ],
      "summary": "作者把拉格朗日乘子 λ 作为条件输入，使一个自编码器覆盖多个率失真目标；另训练混合量化步长，形成以 λ 粗调、量化间隔 Δ 细调的双控制接口。与递归渐进编码相比，这一思路通过条件参数改变工作点，无需为更高质量增加递归迭代。",
      "question": "在DCVC系模型里，训练时λ条件、推理时量化步长、特征增益分别改变哪些分布？熵模型是否同步条件化，码流如何让解码端获得这些参数？",
      "caveat": "本稿是2019年图像压缩研究，仅作为条件控制与量化机制基础。Kodak图像结果不支持视频误差传播、跨帧预算或实时性结论；可变码率接口本身不保证给定目标码率可被一次命中。未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content_ICCV_2019/html/Choi_Variable_Rate_Deep_Image_Compression_With_a_Conditional_Autoencoder_ICCV_2019_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content_ICCV_2019/html/Choi_Variable_Rate_Deep_Image_Compression_With_a_Conditional_Autoencoder_ICCV_2019_paper.html",
      "codeUrl": "",
      "notes": [
        {
          "label": "COND_AE_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "COND_AE_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "COND_AE（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域01分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/01_%E6%A6%82%E7%8E%87%E6%A8%A1%E5%9E%8B%E4%B8%8E%E9%87%8F%E5%8C%96.md.html"
        }
      ],
      "evidence": [],
      "sha256": "59fd35fcaab3405807ac3eff4e6316de7b26a4a1f8d042146fe391a9bdce0c0e",
      "pages": 9,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 实际阅读PDF p.1–2（印刷页3146–3147），含摘要与完整引言；未展开后续方法、训练或实验全文。"
    },
    {
      "id": "NNVC_DESIGN",
      "title": "Designs and Implementations in Neural Network-based Video Coding",
      "authors": [
        "Yue Li",
        "Junru Li",
        "Chaoyi Lin",
        "Kai Zhang",
        "Li Zhang",
        "Franck Galpin",
        "Thierry Dumas",
        "Hongtao Wang",
        "Muhammed Coban",
        "Jacob Ström",
        "Du Liu",
        "Kenneth Andersson"
      ],
      "year": 2023,
      "venue": "arXiv preprint",
      "version": "arXiv:2309.05846v2 (2023-09-13)",
      "fields": [
        "16",
        "03",
        "02"
      ],
      "tags": [
        "部署与兼容",
        "实时系统",
        "表示与参考"
      ],
      "summary": "论文总结当时 JVET NNVC 的混合编码路线：在VVC框架中加入神经帧内预测和神经环内滤波，保留传统模式决策与其他工具。引言强调神经预测还要协调MPM候选和变换选择；滤波要考虑过度滤波、时间滤波及与RDO的配合。",
      "question": "把神经模块接入传统codec时，收益来自独立模块还是模式选择与其他工具的协同？与端到端DCVC比较时，应如何固定anchor、AI/RA/LD配置、色彩分量、码流兼容性和解码算力？",
      "caveat": "本稿固定在2023年NNVC-4.0探索实现，不能当作2026年规范或VVC标准已采纳这些工具的证据。首页脚注明确VTM-11.0_nnvc并非裸VTM-11.0，含MCTF、RDO去块和高层语法差异。这里的“混合框架”也不等于生成码流能被原有VVC解码器直接解码。未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2309.05846v2",
      "sourceUrl": "https://arxiv.org/abs/2309.05846v2",
      "codeUrl": "https://vcgit.hhi.fraunhofer.de/jvet-ahg-nnvc/VVCSoftware_VTM",
      "notes": [
        {
          "label": "NNVC_DESIGN_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "NNVC_DESIGN_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "NNVC_DESIGN（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域03分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/03_%E5%AE%9E%E6%97%B6%E6%89%A7%E8%A1%8C%E4%B8%8E%E7%A1%AC%E4%BB%B6.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        }
      ],
      "evidence": [],
      "sha256": "cc48df7f488a856593800525c4596ec3ef976a1c01017d52a312fcccbb99e5e8",
      "pages": 13,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p.1及p.2至“II. NN-BASED INTRA PREDICTION”之前，覆盖摘要与完整引言；p.2后续工具细节未计为已精读。首页脚注含anchor组成与软件地址。"
    },
    {
      "id": "MPAI_EEV",
      "title": "MPAI-EEV: Standardization Efforts of Artificial Intelligence based End-to-End Video Coding",
      "authors": [
        "Chuanmin Jia",
        "Feng Ye",
        "Fanke Dong",
        "Kai Lin",
        "Leonardo Chiariglione",
        "Siwei Ma",
        "Huifang Sun",
        "Wen Gao"
      ],
      "year": 2023,
      "venue": "arXiv preprint",
      "version": "arXiv:2309.07589v1 (2023-09-14)",
      "fields": [
        "16",
        "02",
        "15"
      ],
      "tags": [
        "部署与兼容",
        "表示与参考",
        "内容与数据"
      ],
      "summary": "作者回顾当时 MPAI-EEV 端到端神经视频编码的需求、验证模型和探索活动，并把它与在传统编码器中加入AI工具的MPAI-EVC区分。引言把模型接口、可更新性、内容适应与标准制定连接起来，后文路线图指向OpenDVC起步的EEV验证模型及无人机视频研究。",
      "question": "面向长期归档的神经码流需要怎样固定模型版本、算子数值与解码环境？“可更新模型”与“多年后仍可解码”之间，应增加哪些独立于RD的证据？",
      "caveat": "这是2023年作者提交稿的历史描述，未代表2026年MPAI标准当前状态。首页保留LaTeX模板页眉“VOL.14, NO.8, AUGUST2021”，不应把它误作发表年或期刊信息；实际按arXiv:2309.07589v1记录。感知指标上的作者结论不能外推PSNR全面优于VVC或跨平台互操作已解决。未复现。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2309.07589v1",
      "sourceUrl": "https://arxiv.org/abs/2309.07589v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "MPAI_EEV_阅读卡（本地记录未公开）",
          "url": ""
        },
        {
          "label": "MPAI_EEV_selected（本地记录未公开）",
          "url": ""
        },
        {
          "label": "MPAI_EEV（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域16分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/16_%E6%A0%87%E5%87%86%E5%85%BC%E5%AE%B9_%E8%B7%A8%E5%B9%B3%E5%8F%B0%E4%B8%80%E8%87%B4%E6%80%A7%E4%B8%8E%E7%A5%9E%E7%BB%8F%E5%8C%85%E8%A3%85.md.html"
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "ec9952afec031e34363cde4ce74f6a3f47fa513494130396144063534eea56a3",
      "pages": 14,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p.1及p.2至“II. EEV”之前，覆盖摘要与完整引言；p.2需求分析和p.3路线图仅浏览，未计作完整精读。"
    },
    {
      "id": "PQA_RQA",
      "title": "Prediction and Reference Quality Adaptation for Learned Video Compression",
      "authors": [
        "Xihua Sheng",
        "Li Li",
        "Dong Liu",
        "Houqiang Li"
      ],
      "year": 2025,
      "venue": "IEEE Transactions on Image Processing",
      "version": "Author manuscript arXiv:2406.14118v3, 24 March 2025; PDF header IEEE TIP, internal current-version date 25 March 2025",
      "fields": [
        "02",
        "04",
        "10"
      ],
      "tags": [
        "表示与参考",
        "参考失效",
        "训练与量化"
      ],
      "summary": "PQA对每侧本地上下文作空间/通道软门控；RQA由已解码参考产生动态空间核；repeat-long先重复首P再级联17帧。三者适配历史质量但不切断时域依赖。",
      "question": "在相同训练数据、I模型与完整文件码率下，局部相关性门控和参考质量动态变换各解决什么问题？19帧repeat-long的真实计算/反传跨度多大？",
      "caveat": "19对32并非同预算因果对照；置信图不是校准错误概率。YUV全帧ClassE相对FM+46.7%且实现解码0.85s/1080p，不能外推RT性能、抗丢包或数值稳定性。作者结果未经本地复现。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        10,
        11,
        12,
        13,
        14
      ],
      "localPdf": "https://arxiv.org/abs/2406.14118v3",
      "sourceUrl": "https://arxiv.org/abs/2406.14118v3",
      "codeUrl": "",
      "notes": [
        {
          "label": "PQA_RQA（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        },
        {
          "label": "参考可靠性精读（本地记录未公开）",
          "url": ""
        },
        {
          "label": "本轮阅读范围（本地记录未公开）",
          "url": ""
        },
        {
          "label": "三路线比较（本地记录未公开）",
          "url": ""
        },
        {
          "label": "claim_matrix（本地记录未公开）",
          "url": ""
        },
        {
          "label": "author_ablation（本地记录未公开）",
          "url": ""
        },
        {
          "label": "evaluation_contract（本地记录未公开）",
          "url": ""
        },
        {
          "label": "selected_text_actually_read（本地记录未公开）",
          "url": ""
        }
      ],
      "evidence": [],
      "sha256": "e905d2ba0d554b942dd4b976d3a695c7dd2e251db1e5d2c161c9e663133cce22",
      "pages": 16,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p1摘要与引言、p2引言续文直到II. RELATED WORK之前；p2相关工作未计阅读。首页已视觉核对作者和版本。 新阶段：本轮完整文字选读PDFp3–7、p10–14共10页；p8仅表IV–VI；实际目视p4/6/7/13/14。十个完整文字页均此前未涉及。此前p1–2初筛保留，不宣称全文精读。"
    },
    {
      "id": "DUAL_ALIGN",
      "title": "Error-Propagation-Free Learned Video Compression With Dual-Domain Progressive Temporal Alignment",
      "authors": [
        "Han Li",
        "Shaohui Li",
        "Wenrui Dai",
        "Chenglin Li",
        "Xinlong Pan",
        "Haipeng Wang",
        "Junni Zou",
        "Hongkai Xiong"
      ],
      "year": 2025,
      "venue": "arXiv preprint; manuscript marked UNDER REVIEW",
      "version": "arXiv:2512.10450v1, 11 December 2025; no acceptance verified",
      "fields": [
        "02",
        "04",
        "11"
      ],
      "tags": [
        "表示与参考",
        "参考失效",
        "码率控制"
      ],
      "summary": "按论文的直接round量化与独立逐帧变换，在固定q且正确熵往返条件下断开重建反馈；历史仍通过运动、双域对齐和Gaussian概率参数影响码长与解码同步。",
      "question": "源码是否严格保持与历史无关的量化符号及逆调制输入？匹配双端历史替换与单端状态损坏会分别改变码长、潜变量和像素中的哪些量？",
      "caveat": "在审v1；无源码/模型复现。图8仅ShakeDry96帧/GOP32；无传播不代表抗丢包。表V参数44.6M与正文46.9M不一致，均保留。共同锚点BD-rate差不当独立pairwise收益。 2026-10-29有界入口检查尚未核实作者完整实现，四项源码合同未闭合；不代表全网无代码。",
      "readingLevel": "selected",
      "readingLabel": "方法／实验选读",
      "readPages": [
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        11,
        12
      ],
      "localPdf": "https://arxiv.org/abs/2512.10450v1",
      "sourceUrl": "https://arxiv.org/abs/2512.10450v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "DUAL_ALIGN（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "参考可靠性精读（本地记录未公开）",
          "url": ""
        },
        {
          "label": "本轮阅读范围（本地记录未公开）",
          "url": ""
        },
        {
          "label": "三路线比较（本地记录未公开）",
          "url": ""
        },
        {
          "label": "claim_matrix（本地记录未公开）",
          "url": ""
        },
        {
          "label": "author_measurements（本地记录未公开）",
          "url": ""
        },
        {
          "label": "作者实现入口核查（本地记录未公开）",
          "url": ""
        },
        {
          "label": "四项源码合同状态（本地记录未公开）",
          "url": ""
        }
      ],
      "evidence": [],
      "sha256": "8ff4aa55acec137c3f4d545b542b1a862324ec611d97b14190b14626406bb6ba",
      "pages": 14,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p1摘要与引言、p2引言直到II. RELATED WORK之前；p2相关工作不计。首页视觉确认UNDER REVIEW。 新阶段：本轮完整阅读PDF p3-12共10页，均为前轮未涉及页；涵盖方法、量化、时域依赖、训练、主实验和消融。视觉查看p4/5/6/9/10/11。前轮p1-2仅摘要/引言；本轮不声称14页全文通读。"
    },
    {
      "id": "ECVC",
      "title": "ECVC: Exploiting Non-Local Correlations in Multiple Frames for Contextual Video Compression",
      "authors": [
        "Wei Jiang",
        "Junru Li",
        "Kai Zhang",
        "Li Zhang"
      ],
      "year": 2025,
      "venue": "CVPR 2025",
      "version": "CVF open-access accepted version, proceedings pp. 7331-7341",
      "fields": [
        "02",
        "04",
        "10"
      ],
      "tags": [
        "表示与参考",
        "参考失效",
        "训练与量化"
      ],
      "summary": "作者在两个历史参考中联合提取局部运动和非局部相似性，以线性交叉注意力控制开销；同时引入部分级联微调，降低训练短链与测试长链的分布差。论文将表示能力增强和训练误差管理作为两个独立增益来源。",
      "question": "多参考非局部信息与长序列微调的收益能否拆开？新增参考/注意力对场景切换及RT的访存和延迟预算有什么代价？",
      "caveat": "摘要的10.5%/11.5%是相对共同VTM锚点的表述，不能直接当作相对DCVC-FM的码率比；尚未审表格积分口径。作者仓库页面目前只见README与assets，不能称已具可运行复现代码。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://openaccess.thecvf.com/content/CVPR2025/html/Jiang_ECVC_Exploiting_Non-Local_Correlations_in_Multiple_Frames_for_Contextual_Video_CVPR_2025_paper.html",
      "sourceUrl": "https://openaccess.thecvf.com/content/CVPR2025/html/Jiang_ECVC_Exploiting_Non-Local_Correlations_in_Multiple_Frames_for_Contextual_Video_CVPR_2025_paper.html",
      "codeUrl": "https://github.com/JiangWeibeta/ECVC",
      "notes": [
        {
          "label": "ECVC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域10分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/10_%E8%AE%AD%E7%BB%83%E7%AD%96%E7%95%A5%E4%B8%8E%E9%87%8F%E5%8C%96%E4%B8%80%E8%87%B4%E6%80%A7.md.html"
        }
      ],
      "evidence": [],
      "sha256": "56aaef73685e51e038e2d04d7e872cab82026bceaed2cc674ef0d97b6ceffdec",
      "pages": 11,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p1摘要与引言、p2引言直到2. Related Works之前，含图1的局部/非局部相关解释；未读后续实验。首页视觉核对。"
    },
    {
      "id": "CAI_LVC",
      "title": "Content-Adaptive Inference for State-of-the-art Learned Video Compression",
      "authors": [
        "Ahmet Bilican",
        "M. Akın Yılmaz",
        "A. Murat Tekalp"
      ],
      "year": 2025,
      "venue": "IEEE Open Journal of Signal Processing, vol. 6, pp. 498-506",
      "version": "arXiv:2510.07283v2, 10 October 2025; arXiv journal reference DOI 10.1109/OJSP.2025.3564817",
      "fields": [
        "02",
        "06",
        "15"
      ],
      "tags": [
        "表示与参考",
        "编码端搜索",
        "内容与数据"
      ],
      "summary": "作者把大运动序列上的退化解释为训练与测试运动幅值分布不一致，通过推理时自适应帧下采样改善光流估计，并用运动向量缩放改善流编码；不需要微调模型参数。引言特别强调逐视频观察可能揭示平均RD掩盖的失效。",
      "question": "运动尺度归一化在不同分辨率、快速运动和遮挡下何时获益？针对没有显式光流流的DCVC-RT，哪些原则可迁移、哪些模块不可照搬？",
      "caveat": "作者“up to 41%”是单视频最大收益，不是总体平均；本轮仅初筛，未核最优尺度选择开销、解码同步与多率控制。不能把流缩放与源视频降低分辨率混为一谈。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2
      ],
      "localPdf": "https://arxiv.org/abs/2510.07283v2",
      "sourceUrl": "https://arxiv.org/abs/2510.07283v2",
      "codeUrl": "https://github.com/KUIS-AI-Tekalp-Research-Group/video-compression/tree/master/OJSP2025",
      "notes": [
        {
          "label": "CAI_LVC（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "8d51ef868fdc70cc7675e8a908f5138bc4dc1620b8a9e6e00a16ded32f40fb5b",
      "pages": 9,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p1摘要与引言、p2引言尾段及图1说明，到II. Related Work and Novelty之前；p2其余相关工作未计。首页视觉核对。"
    },
    {
      "id": "MOTION_RATE",
      "title": "Content-Adaptive Motion Rate Adaption for Learned Video Compression",
      "authors": [
        "Chih-Hsuan Lin",
        "Yi-Hsin Chen",
        "Wen-Hsiao Peng"
      ],
      "year": 2022,
      "venue": "Picture Coding Symposium (PCS) 2022",
      "version": "Author arXiv:2302.06293v1, 13 February 2023; author page and arXiv say accepted PCS 2022",
      "fields": [
        "06",
        "11",
        "15"
      ],
      "tags": [
        "编码端搜索",
        "码率控制",
        "内容与数据"
      ],
      "summary": "作者用块级alpha图控制运动编码与帧内容编码的比特权衡，并在测试时优化图而不是直接更新整个模型；引入look-ahead，使当前帧决策考虑后续帧代价。动机是训练/测试域差导致特定序列编码次优。",
      "question": "局部比特分配改善来自当前运动编码还是后续参考质量？与只优化当前帧相比，look-ahead的RD收益、编码耗时和延迟如何交换？",
      "caveat": "该工作基于CANF条件编码，与RT架构不同；没有本地复现。alpha图同步/隐式信令及优化迭代成本需读方法和实验后核对，不应默认零额外码率或实时。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1
      ],
      "localPdf": "https://arxiv.org/abs/2302.06293v1",
      "sourceUrl": "https://arxiv.org/abs/2302.06293v1",
      "codeUrl": "",
      "notes": [
        {
          "label": "MOTION_RATE（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域06分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/06_%E5%86%85%E5%AE%B9%E9%80%82%E9%85%8D%E4%B8%8E%E7%BC%96%E7%A0%81%E7%AB%AF%E6%90%9C%E7%B4%A2.md.html"
        },
        {
          "label": "领域11分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/11_%E7%9B%AE%E6%A0%87%E7%A0%81%E7%8E%87%E6%8E%A7%E5%88%B6%E4%B8%8E%E8%B7%A8%E5%B8%A7%E5%88%86%E9%85%8D.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "4ad98891b71a04e677d409acb2f824670768e3f9a5ee22130a329306f6cda359",
      "pages": 5,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p1摘要和完整引言，截止II. RELATED WORK之前；p2虽抽取输出但本卡不把方法段列为精读证据。首页视觉核对。"
    },
    {
      "id": "LSVC_LTR",
      "title": "Exploring Learned Surveillance Video Coding with Long-Term Reference and Adaptive Long–Short Modeling",
      "authors": [
        "Yuansheng Wu",
        "Liangchao Hu",
        "Xiaodan Song"
      ],
      "year": 2026,
      "venue": "Sensors 2026, 26(8), 2461",
      "version": "Publisher PDF; published 16 April 2026, publisher version notes list updated record 17 April 2026",
      "fields": [
        "02",
        "04",
        "15"
      ],
      "tags": [
        "表示与参考",
        "参考失效",
        "内容与数据"
      ],
      "summary": "作者针对静态背景、重复内容与周期运动的监控场景，在EEM-4.1中加入长期参考。长期参考质量更高不自动等于总成本更低，因此同时学习长短参考的软选择、上下文融合与历史运动引导。",
      "question": "长期参考的额外运动开销何时超过重复背景收益？场景切换后应何时废弃长期参考，参考增强与刷新间隔应怎样联动？",
      "caveat": "EEM源代码需授权，不能把论文链接当无条件可复现；本文自己说明RD尚不及DCVC-FM，不能只摘相对较弱基线的收益称SOTA。本轮未验证22页中的实验、复杂度及授权资源。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        2,
        3
      ],
      "localPdf": "https://www.mdpi.com/1424-8220/26/8/2461",
      "sourceUrl": "https://www.mdpi.com/1424-8220/26/8/2461",
      "codeUrl": "",
      "notes": [
        {
          "label": "LSVC_LTR（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域02分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/02_%E8%A1%A8%E7%A4%BA%E5%8F%98%E6%8D%A2%E4%B8%8E%E6%97%B6%E5%9F%9F%E5%8F%82%E8%80%83.md.html"
        },
        {
          "label": "领域04分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/04_%E5%8F%82%E8%80%83%E5%A4%B1%E6%95%88%E4%B8%8E%E6%B7%B7%E5%90%88%E7%BC%96%E7%A0%81.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "df1f45c8d506c42f16d442ab3c6ce582500d6e3fe3958426e911a388fc3b55dc",
      "pages": 22,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p1摘要/引言，p2完整引言续文，p3仅引言尾部和贡献直到2. Related Work之前；首页视觉核对作者、刊名与日期。"
    },
    {
      "id": "PROJECTION360",
      "title": "Projection-Aware End-to-End Learned Video Compression for 360-Degree Video",
      "authors": [
        "Niloofar Maani"
      ],
      "year": 2023,
      "venue": "Thesis manuscript; archived as arXiv preprint in 2026, no conference acceptance verified",
      "version": "Cover dated April 2023; arXiv:2608.28689v2 watermark dated 4 September 2026. year uses document date, not archive date.",
      "fields": [
        "09",
        "15"
      ],
      "tags": [
        "评价方法",
        "内容与数据"
      ],
      "summary": "学位论文以SSF为编码器比较360投影，把源投影转换、编解码和逆投影组成统一评估流程，并采用JVET 360测试条件和360Lib指标。引言说明投影改变采样与运动形态；可微重投影层并不含可学习参数。",
      "question": "同一球面内容换投影后，码率差源于采样密度、光流估计还是重投影误差？平面PSNR与球面加权PSNR会不会给出相反排序？",
      "caveat": "封面2023与归档2026分开保留，不宣称2026新方法；原文摘要有H.264/HEVC措辞错误，卡片不沿用该混称。没有读取结果表，不采纳搜索摘要中的最优投影排名为验证结论。",
      "readingLevel": "screen",
      "readingLabel": "摘要／引言筛查",
      "readPages": [
        1,
        11,
        17,
        18,
        19
      ],
      "localPdf": "https://arxiv.org/abs/2608.28689v2",
      "sourceUrl": "https://arxiv.org/abs/2608.28689v2",
      "codeUrl": "",
      "notes": [
        {
          "label": "PROJECTION360（本地记录未公开）",
          "url": ""
        },
        {
          "label": "领域09分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/09_%E8%AF%84%E4%BB%B7%E6%96%B9%E6%B3%95%E4%B8%8E%E8%AF%81%E6%8D%AE%E8%BE%B9%E7%95%8C.md.html"
        },
        {
          "label": "领域15分析",
          "url": "../notes/%E9%A2%86%E5%9F%9F%E5%88%86%E6%9E%90/15_%E5%86%85%E5%AE%B9%E5%9F%9F%E8%BF%81%E7%A7%BB_HDR%E5%B1%8F%E5%B9%95%E4%B8%8E%E5%85%A8%E6%99%AF.md.html"
        }
      ],
      "evidence": [],
      "sha256": "0d57c4eace58adee189f806d4ff801ef10ba952205c6da65051ab0f5f2f59ae6",
      "pages": 85,
      "addedThisRound": false,
      "relations": [],
      "metadataNote": "作者信息依据本地PDF首页。",
      "readingNote": "页码为本地PDF的一基页码；累计选页不等于全文精读。无统一页码的历史笔记按原记录保留。 PDF p1封面核验；p11英文摘要（印刷页V）；p17-19完整Chapter 1 Introduction（印刷页1-3）。p20为空白，不计。85页全文未精读，结果章节未读。"
    }
  ],
  "paths": [
    {
      "id": "core",
      "title": "从DVC走到实时DCVC",
      "description": "先追踪信息如何送到解码器，再比较额外依赖与完整执行成本。",
      "paperIds": [
        "DVC",
        "DCVC",
        "DCVCDC",
        "DCVCFM",
        "DCVCRT",
        "DCVCUF"
      ]
    },
    {
      "id": "entropy",
      "title": "理解潜变量、量化与熵编码",
      "description": "从基本率失真训练到超先验、空间／通道依赖和实际量化。",
      "paperIds": [
        "E2EIC",
        "CAE2017",
        "HYPERPRIOR",
        "ARHYPER",
        "CHENG2020",
        "CHARM",
        "CCM",
        "ELIC"
      ]
    },
    {
      "id": "adapt",
      "title": "内容适配究竟付出什么",
      "description": "区分潜变量搜索、模型更新码率和完整编码预算。",
      "paperIds": [
        "SGA",
        "BAO",
        "IADP",
        "PEIAVC",
        "DCVCDT",
        "C3"
      ]
    },
    {
      "id": "evaluate",
      "title": "建立可信的评价口径",
      "description": "从结构相似度到感知、时序与RD积分；数据条件始终跟随结果。",
      "paperIds": [
        "SSIM_2004",
        "MS_SSIM_2003",
        "VIF",
        "LPIPS",
        "DISTS",
        "FVD",
        "BD_BIBLE",
        "USTC_TD",
        "BVI_CC"
      ]
    },
    {
      "id": "deploy",
      "title": "从算法到可用系统",
      "description": "比较实际编解码工具、移动设备、网络恢复和标准封装。",
      "paperIds": [
        "COMPRESSAI",
        "MOBILENVC",
        "DCVCRT",
        "GRACE",
        "WRAPPER"
      ]
    },
    {
      "id": "reference",
      "title": "不可靠参考与训练范围",
      "description": "读参考失效、双向门控及训练长链，回到已有场景切换实验。",
      "paperIds": [
        "EPA",
        "MASKCRT",
        "BIECVC",
        "DCMVC",
        "DCVCFM",
        "NAFNet"
      ]
    },
    {
      "id": "generative",
      "title": "从感知理论到生成式重建",
      "description": "区分配对失真、分布接近与输入细节忠实性；再看视频时间一致性。",
      "paperIds": [
        "PD_TRADEOFF",
        "RDP2019",
        "EXTREME_GAN",
        "HIFIC",
        "CDC_DIFFUSION",
        "DIFFVC",
        "S2VC"
      ]
    },
    {
      "id": "machines",
      "title": "压缩给机器看什么",
      "description": "把任务准确率、特征可迁移性和完整传输量放到同一评价表。",
      "paperIds": [
        "TASKCTRL",
        "TRANSTIC",
        "TTFT_LIC",
        "TRANSVFC",
        "ACCELIR",
        "UIC",
        "ACCMPEG",
        "BOTTLENETPP"
      ]
    },
    {
      "id": "network",
      "title": "从文件压缩走向有噪信道",
      "description": "分清文件字节、信道使用次数、丢包模型与反馈依赖。",
      "paperIds": [
        "DEEPJSCC",
        "DEEPJSCC_F",
        "DEEPJSCC_L",
        "SWINJSCC",
        "DEEPWIVE",
        "GRACE",
        "RELVIC"
      ]
    },
    {
      "id": "scalable",
      "title": "一份表示如何分层使用",
      "description": "区别独立码率模型、可伸缩码流与空间/时间基础层的额外成本。",
      "paperIds": [
        "SEVC",
        "LBSVC",
        "FA_SCALABLE",
        "COMPASS",
        "S_NVRC",
        "HDRSVC"
      ]
    },
    {
      "id": "inr",
      "title": "逐视频表示的编码预算",
      "description": "同时记录拟合时间、模型与嵌入码量、解码吞吐和预测等待。",
      "paperIds": [
        "NERV",
        "ENERV",
        "DNERV",
        "FFNERV",
        "HINERV",
        "NVRC",
        "PNVC",
        "S_NVRC"
      ]
    }
  ],
  "relations": [
    {
      "source": "DVC",
      "target": "DCVC",
      "type": "reading_path",
      "label": "建议阅读顺序：从DVC走到实时DCVC"
    },
    {
      "source": "DCVC",
      "target": "DCVCDC",
      "type": "reading_path",
      "label": "建议阅读顺序：从DVC走到实时DCVC"
    },
    {
      "source": "DCVCDC",
      "target": "DCVCFM",
      "type": "reading_path",
      "label": "建议阅读顺序：从DVC走到实时DCVC"
    },
    {
      "source": "DCVCFM",
      "target": "DCVCRT",
      "type": "reading_path",
      "label": "建议阅读顺序：从DVC走到实时DCVC"
    },
    {
      "source": "DCVCRT",
      "target": "DCVCUF",
      "type": "reading_path",
      "label": "建议阅读顺序：从DVC走到实时DCVC"
    },
    {
      "source": "E2EIC",
      "target": "CAE2017",
      "type": "reading_path",
      "label": "建议阅读顺序：理解潜变量、量化与熵编码"
    },
    {
      "source": "CAE2017",
      "target": "HYPERPRIOR",
      "type": "reading_path",
      "label": "建议阅读顺序：理解潜变量、量化与熵编码"
    },
    {
      "source": "HYPERPRIOR",
      "target": "ARHYPER",
      "type": "reading_path",
      "label": "建议阅读顺序：理解潜变量、量化与熵编码"
    },
    {
      "source": "ARHYPER",
      "target": "CHENG2020",
      "type": "reading_path",
      "label": "建议阅读顺序：理解潜变量、量化与熵编码"
    },
    {
      "source": "CHENG2020",
      "target": "CHARM",
      "type": "reading_path",
      "label": "建议阅读顺序：理解潜变量、量化与熵编码"
    },
    {
      "source": "CHARM",
      "target": "CCM",
      "type": "reading_path",
      "label": "建议阅读顺序：理解潜变量、量化与熵编码"
    },
    {
      "source": "CCM",
      "target": "ELIC",
      "type": "reading_path",
      "label": "建议阅读顺序：理解潜变量、量化与熵编码"
    },
    {
      "source": "SGA",
      "target": "BAO",
      "type": "reading_path",
      "label": "建议阅读顺序：内容适配究竟付出什么"
    },
    {
      "source": "BAO",
      "target": "IADP",
      "type": "reading_path",
      "label": "建议阅读顺序：内容适配究竟付出什么"
    },
    {
      "source": "IADP",
      "target": "PEIAVC",
      "type": "reading_path",
      "label": "建议阅读顺序：内容适配究竟付出什么"
    },
    {
      "source": "PEIAVC",
      "target": "DCVCDT",
      "type": "reading_path",
      "label": "建议阅读顺序：内容适配究竟付出什么"
    },
    {
      "source": "DCVCDT",
      "target": "C3",
      "type": "reading_path",
      "label": "建议阅读顺序：内容适配究竟付出什么"
    },
    {
      "source": "SSIM_2004",
      "target": "MS_SSIM_2003",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "MS_SSIM_2003",
      "target": "VIF",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "VIF",
      "target": "LPIPS",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "LPIPS",
      "target": "DISTS",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "DISTS",
      "target": "FVD",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "FVD",
      "target": "BD_BIBLE",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "BD_BIBLE",
      "target": "USTC_TD",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "USTC_TD",
      "target": "BVI_CC",
      "type": "reading_path",
      "label": "建议阅读顺序：建立可信的评价口径"
    },
    {
      "source": "COMPRESSAI",
      "target": "MOBILENVC",
      "type": "reading_path",
      "label": "建议阅读顺序：从算法到可用系统"
    },
    {
      "source": "MOBILENVC",
      "target": "DCVCRT",
      "type": "reading_path",
      "label": "建议阅读顺序：从算法到可用系统"
    },
    {
      "source": "DCVCRT",
      "target": "GRACE",
      "type": "reading_path",
      "label": "建议阅读顺序：从算法到可用系统"
    },
    {
      "source": "GRACE",
      "target": "WRAPPER",
      "type": "reading_path",
      "label": "建议阅读顺序：从算法到可用系统"
    },
    {
      "source": "EPA",
      "target": "MASKCRT",
      "type": "reading_path",
      "label": "建议阅读顺序：不可靠参考与训练范围"
    },
    {
      "source": "MASKCRT",
      "target": "BIECVC",
      "type": "reading_path",
      "label": "建议阅读顺序：不可靠参考与训练范围"
    },
    {
      "source": "BIECVC",
      "target": "DCMVC",
      "type": "reading_path",
      "label": "建议阅读顺序：不可靠参考与训练范围"
    },
    {
      "source": "DCMVC",
      "target": "DCVCFM",
      "type": "reading_path",
      "label": "建议阅读顺序：不可靠参考与训练范围"
    },
    {
      "source": "DCVCFM",
      "target": "NAFNet",
      "type": "reading_path",
      "label": "建议阅读顺序：不可靠参考与训练范围"
    },
    {
      "source": "PD_TRADEOFF",
      "target": "RDP2019",
      "type": "reading_path",
      "label": "建议阅读顺序：从感知理论到生成式重建"
    },
    {
      "source": "RDP2019",
      "target": "EXTREME_GAN",
      "type": "reading_path",
      "label": "建议阅读顺序：从感知理论到生成式重建"
    },
    {
      "source": "EXTREME_GAN",
      "target": "HIFIC",
      "type": "reading_path",
      "label": "建议阅读顺序：从感知理论到生成式重建"
    },
    {
      "source": "HIFIC",
      "target": "CDC_DIFFUSION",
      "type": "reading_path",
      "label": "建议阅读顺序：从感知理论到生成式重建"
    },
    {
      "source": "CDC_DIFFUSION",
      "target": "DIFFVC",
      "type": "reading_path",
      "label": "建议阅读顺序：从感知理论到生成式重建"
    },
    {
      "source": "DIFFVC",
      "target": "S2VC",
      "type": "reading_path",
      "label": "建议阅读顺序：从感知理论到生成式重建"
    },
    {
      "source": "TASKCTRL",
      "target": "TRANSTIC",
      "type": "reading_path",
      "label": "建议阅读顺序：压缩给机器看什么"
    },
    {
      "source": "TRANSTIC",
      "target": "TTFT_LIC",
      "type": "reading_path",
      "label": "建议阅读顺序：压缩给机器看什么"
    },
    {
      "source": "TTFT_LIC",
      "target": "TRANSVFC",
      "type": "reading_path",
      "label": "建议阅读顺序：压缩给机器看什么"
    },
    {
      "source": "TRANSVFC",
      "target": "ACCELIR",
      "type": "reading_path",
      "label": "建议阅读顺序：压缩给机器看什么"
    },
    {
      "source": "ACCELIR",
      "target": "UIC",
      "type": "reading_path",
      "label": "建议阅读顺序：压缩给机器看什么"
    },
    {
      "source": "UIC",
      "target": "ACCMPEG",
      "type": "reading_path",
      "label": "建议阅读顺序：压缩给机器看什么"
    },
    {
      "source": "ACCMPEG",
      "target": "BOTTLENETPP",
      "type": "reading_path",
      "label": "建议阅读顺序：压缩给机器看什么"
    },
    {
      "source": "DEEPJSCC",
      "target": "DEEPJSCC_F",
      "type": "reading_path",
      "label": "建议阅读顺序：从文件压缩走向有噪信道"
    },
    {
      "source": "DEEPJSCC_F",
      "target": "DEEPJSCC_L",
      "type": "reading_path",
      "label": "建议阅读顺序：从文件压缩走向有噪信道"
    },
    {
      "source": "DEEPJSCC_L",
      "target": "SWINJSCC",
      "type": "reading_path",
      "label": "建议阅读顺序：从文件压缩走向有噪信道"
    },
    {
      "source": "SWINJSCC",
      "target": "DEEPWIVE",
      "type": "reading_path",
      "label": "建议阅读顺序：从文件压缩走向有噪信道"
    },
    {
      "source": "DEEPWIVE",
      "target": "GRACE",
      "type": "reading_path",
      "label": "建议阅读顺序：从文件压缩走向有噪信道"
    },
    {
      "source": "GRACE",
      "target": "RELVIC",
      "type": "reading_path",
      "label": "建议阅读顺序：从文件压缩走向有噪信道"
    },
    {
      "source": "SEVC",
      "target": "LBSVC",
      "type": "reading_path",
      "label": "建议阅读顺序：一份表示如何分层使用"
    },
    {
      "source": "LBSVC",
      "target": "FA_SCALABLE",
      "type": "reading_path",
      "label": "建议阅读顺序：一份表示如何分层使用"
    },
    {
      "source": "FA_SCALABLE",
      "target": "COMPASS",
      "type": "reading_path",
      "label": "建议阅读顺序：一份表示如何分层使用"
    },
    {
      "source": "COMPASS",
      "target": "S_NVRC",
      "type": "reading_path",
      "label": "建议阅读顺序：一份表示如何分层使用"
    },
    {
      "source": "S_NVRC",
      "target": "HDRSVC",
      "type": "reading_path",
      "label": "建议阅读顺序：一份表示如何分层使用"
    },
    {
      "source": "NERV",
      "target": "ENERV",
      "type": "reading_path",
      "label": "建议阅读顺序：逐视频表示的编码预算"
    },
    {
      "source": "ENERV",
      "target": "DNERV",
      "type": "reading_path",
      "label": "建议阅读顺序：逐视频表示的编码预算"
    },
    {
      "source": "DNERV",
      "target": "FFNERV",
      "type": "reading_path",
      "label": "建议阅读顺序：逐视频表示的编码预算"
    },
    {
      "source": "FFNERV",
      "target": "HINERV",
      "type": "reading_path",
      "label": "建议阅读顺序：逐视频表示的编码预算"
    },
    {
      "source": "HINERV",
      "target": "NVRC",
      "type": "reading_path",
      "label": "建议阅读顺序：逐视频表示的编码预算"
    },
    {
      "source": "NVRC",
      "target": "PNVC",
      "type": "reading_path",
      "label": "建议阅读顺序：逐视频表示的编码预算"
    },
    {
      "source": "PNVC",
      "target": "S_NVRC",
      "type": "reading_path",
      "label": "建议阅读顺序：逐视频表示的编码预算"
    }
  ]
};
