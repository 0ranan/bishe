# 课程业务流程示意（图6）

对应说明书「课程业务流程示意（文字链路与页面跳转）」。可在支持 Mermaid 的编辑器（如 VS Code 插件、GitHub、Typora）中预览并导出为 PNG/SVG 插入论文。

---

## 总览：从登录到课程各模块

```mermaid
flowchart TB
    subgraph entry["① 系统入口"]
        A([浏览器访问系统地址]) --> B[登录页：身份切换 / 学号或工号 / 密码 / 验证码]
        B --> C{登录成功}
        C -->|否| B
        C -->|学生| S0[学生中心 · 我的课程]
        C -->|教师| T0[教师工作台 · 课程与班级]
        C -->|管理员教师| M0[教师管理 /admin/teachers]
    end

    subgraph student_path["② 学生端 · 课程业务"]
        S0 --> S1[课程卡片列表]
        S1 --> S2[进入课程 · 代办界面]
        S2 --> SM{课程功能侧边栏}
        SM --> SA[课程签到]
        SM --> SB[课程章节]
        SM --> SC[课程附件]
        SM --> SD[课程讨论]
        SM --> SE[学情诊断]
        SM --> SF[课程作业]
        SM --> SG[AI 助教]
        SM --> SH[视频列表 → 播放页]
    end

    subgraph teacher_path["③ 教师端 · 课程业务"]
        T0 --> T1[我的课程 / 我的班级 · 发布或关联课程]
        T1 --> T2[进入课程 · 教学主页]
        T2 --> TM{导航菜单 · 教学功能}
        TM --> TA[课程签到]
        TM --> TB[课程章节]
        TM --> TC[课程附件]
        TM --> TD[课程讨论]
        TM --> TE[学情诊断]
        TM --> TF[课程作业]
        TM --> TG[AI 助教]
        TM --> TH[视频教学页]
    end

    subgraph admin_path["④ 管理扩展"]
        M0 --> M1[新增 / 编辑教师账号与角色]
    end

    style A fill:#e0f2fe
    style B fill:#fef3c7
    style C fill:#ddd6fe
    style S2 fill:#dbeafe
    style T2 fill:#dcfce7
    style M0 fill:#fce7f3
```

---

## 简化版（适合幻灯片 / 单栏排版）

```mermaid
flowchart TB
    Login([登录]) --> Hub{角色}
    Hub -->|学生| SC[学生中心]
    Hub -->|教师| TC[教师工作台]
    SC --> Course[进入课程]
    TC --> Course
    Course --> Menu[课程功能菜单]
    Menu --> M1[签到]
    Menu --> M2[章节]
    Menu --> M3[附件]
    Menu --> M4[讨论]
    Menu --> M5[学情诊断]
    Menu --> M6[作业]
    Menu --> M7[AI 助教]
    Menu --> M8[视频]
```

---

## 导出图片建议

1. **VS Code**：安装「Markdown Preview Mermaid Support」或「Mermaid Chart」，打开本文件预览后截图或使用 Mermaid Live Editor（https://mermaid.live）粘贴代码块内语句导出 SVG/PNG。
2. **说明书**：将总览图导出为高清 PNG，在 Word 中作为「图6 课程业务流程示意」插入。
