# 教学管理模块流程图

本文档包含教学管理模块三大核心功能（作业管理、考勤管理、讨论管理）的用户操作流程图。

***

## 1. 作业管理功能流程图

### 1.1 教师端作业管理流程

```mermaid
flowchart TD
    StartT([教师进入作业管理页面]) --> AuthT[验证JWT Token<br/>确认教师身份]
    AuthT --> FetchT[GET<br/>/api/teacher/courses/:id]
    FetchT --> FetchAssign[GET<br/>/api/teacher/courses/:id/assignments]
    FetchAssign --> DisplayT[渲染作业列表<br/>展示提交统计]
    
    DisplayT --> ClickCreate[点击发布作业]
    ClickCreate --> ModalT[弹出发布模态框]
    ModalT --> FillForm[填写标题、内容<br/>截止时间]
    FillForm --> ValidateT{前端表单验证<br/>必填项非空<br/>时间合法}
    ValidateT -->|验证失败| ShowErrT[显示错误提示]
    ShowErrT --> FillForm
    ValidateT -->|验证通过| SubmitAssign[POST<br/>/api/teacher/courses/:id/assignments]
    SubmitAssign --> InsertDB[数据库插入作业记录]
    InsertDB --> SuccessT{创建成功?}
    SuccessT -->|失败| ShowErrT2[显示错误信息]
    SuccessT -->|成功| UpdateListT[更新本地作业列表]
    UpdateListT --> CloseModalT[关闭模态框]
    CloseModalT --> DisplayT
    
    DisplayT --> ClickView[点击查看提交]
    ClickView --> FetchSub[GET<br/>/api/teacher/courses/:id/assignments/:aid/submissions]
    FetchSub --> ShowSubList[展示学生提交列表<br/>包含状态和成绩]
    ShowSubList --> GradeStudent[输入分数和评语]
    GradeStudent --> SubmitGrade[PUT<br/>/api/teacher/courses/:id/assignments/:aid/submissions]
    SubmitGrade --> UpdateGradeDB[更新成绩到数据库]
    UpdateGradeDB --> DoneT([完成])
    
    style StartT fill:#3b82f6,color:#fff
    style DoneT fill:#22c55e,color:#fff
    style ValidateT fill:#f59e0b
    style SuccessT fill:#8b5cf6
```

### 1.2 学生端作业管理流程

```mermaid
flowchart TD
    StartS([学生进入作业页面]) --> AuthS[验证JWT Token]
    AuthS --> FetchCourseS[GET<br/>/api/student/courses/:id]
    FetchCourseS --> FetchAssignS[GET<br/>/api/student/courses/:id/assignments]
    FetchAssignS --> DisplayS[渲染作业列表<br/>展示个人提交状态]
    
    DisplayS --> CheckStatus{检查作业状态}
    CheckStatus -->|已提交| ShowSubmitted[显示提交时间和成绩]
    ShowSubmitted --> DoneS1([完成])
    
    CheckStatus -->|未提交| CheckExpired{是否已过期}
    CheckExpired -->|未过期| ClickSubmit[点击提交作业]
    CheckExpired -->|已过期| ShowExpired[显示已过期提示]
    ShowExpired --> DoneS2([完成])
    
    ClickSubmit --> ModalS[弹出提交模态框]
    ModalS --> InputContent[输入作业内容]
    InputContent --> SubmitS[POST<br/>/api/student/courses/:id/assignments]
    SubmitS --> InsertSub[数据库插入提交记录]
    InsertSub --> RefreshS[重新获取作业列表]
    RefreshS --> CloseModalS[关闭模态框]
    CloseModalS --> DoneS3([完成])
    
    style StartS fill:#3b82f6,color:#fff
    style DoneS1 fill:#22c55e,color:#fff
    style DoneS2 fill:#ef4444,color:#fff
    style DoneS3 fill:#22c55e,color:#fff
    style CheckStatus fill:#8b5cf6
    style CheckExpired fill:#f59e0b
```

***

## 2. 考勤管理功能流程图

### 2.1 教师端考勤管理流程

```mermaid
flowchart TD
    StartAT([教师进入考勤管理页面]) --> AuthAT[验证JWT Token<br/>确认教师身份]
    AuthAT --> FetchAT[GET<br/>/api/teacher/courses/:id/attendances]
    FetchAT --> DisplayAT[渲染签到列表<br/>标识进行中签到]
    
    DisplayAT --> ClickPublish[点击发布签到]
    ClickPublish --> InputAT[填写签到标题<br/>设置签到时长]
    InputAT --> SubmitAT[POST<br/>/api/teacher/courses/:id/attendances]
    SubmitAT --> GenCode[服务器生成签到码]
    GenCode --> CreateAT[创建签到记录<br/>状态设为进行中]
    CreateAT --> ShowCode[页面显示签到码<br/>实时展示签到人数]
    
    ShowCode --> MonitorAT{监听签到进行}
    MonitorAT -->|学生签到| UpdateCount[实时更新已签到人数]
    MonitorAT -->|时间到或手动结束| ClickEnd[点击结束签到]
    ClickEnd --> EndAT[PUT<br/>/api/teacher/courses/:id/attendances/:aid/end]
    EndAT --> SetEnded[更新签到状态为已结束]
    SetEnded --> MoveToHistory[移至历史签到列表]
    MoveToHistory --> DoneAT([完成])
    
    DisplayAT --> ViewHistory[查看历史签到]
    ViewHistory --> ShowHistory[展示历史签到详情<br/>包含统计数据]
    ShowHistory --> DoneAT2([完成])
    
    style StartAT fill:#3b82f6,color:#fff
    style DoneAT fill:#22c55e,color:#fff
    style DoneAT2 fill:#22c55e,color:#fff
    style MonitorAT fill:#f59e0b
    style GenCode fill:#8b5cf6
```

### 2.2 学生端考勤管理流程

```mermaid
flowchart TD
    StartAS([学生进入签到页面]) --> AuthAS[验证JWT Token]
    AuthAS --> FetchAS[GET<br/>/api/student/courses/:id/attendances]
    FetchAS --> DisplayAS[渲染签到列表<br/>标识进行中签到]
    
    DisplayAS --> FindActive{是否有进行中签到}
    FindActive -->|有| ShowActive[高亮显示进行中签到]
    ShowActive --> InputCode[输入签到码]
    FindActive -->|无| BrowseHistory[浏览历史签到记录]
    BrowseHistory --> DoneAS1([完成])
    
    InputCode --> ClickSubmitAS[点击提交签到]
    ClickSubmitAS --> SubmitAS[POST<br/>/api/student/courses/:id/attendances<br/>发送签到码]
    SubmitAS --> VerifyAS{验证签到码<br/>检查是否超时<br/>检查是否重复签到}
    VerifyAS -->|验证失败| ShowErrorAS[显示错误提示]
    ShowErrorAS --> InputCode
    VerifyAS -->|验证成功| RecordAS[记录学生签到信息]
    RecordAS --> RefreshAS[刷新签到列表]
    RefreshAS --> ShowSuccessAS[显示签到成功]
    ShowSuccessAS --> DoneAS2([完成])
    
    DisplayAS --> CheckMissed{检查是否有漏签}
    CheckMissed -->|有漏签| ShowMissed[红色标识未签到记录]
    ShowMissed --> DoneAS3([完成])
    
    style StartAS fill:#3b82f6,color:#fff
    style DoneAS1 fill:#22c55e,color:#fff
    style DoneAS2 fill:#22c55e,color:#fff
    style DoneAS3 fill:#ef4444,color:#fff
    style FindActive fill:#8b5cf6
    style VerifyAS fill:#f59e0b
```

***

## 3. 讨论管理功能流程图

### 3.1 教师端讨论管理流程

```mermaid
flowchart TD
    StartDT([教师进入讨论管理页面]) --> AuthDT[验证JWT Token<br/>确认教师身份]
    AuthDT --> FetchDT[GET<br/>/api/teacher/courses/:id/discussions]
    FetchDT --> DisplayDT[渲染讨论列表<br/>展示评论数]
    
    DisplayDT --> ClickPublishD[点击发布讨论]
    ClickPublishD --> ModalDT[弹出发布模态框]
    ModalDT --> FillD[填写标题和内容]
    FillD --> ValidateD{表单验证<br/>非空检查}
    ValidateD -->|失败| ShowErrD[显示错误提示]
    ShowErrD --> FillD
    ValidateD -->|通过| SubmitD[POST<br/>/api/teacher/courses/:id/discussions]
    SubmitD --> InsertD[数据库插入讨论主题]
    InsertD --> SuccessD{创建成功?}
    SuccessD -->|失败| ShowErrD2[显示错误]
    SuccessD -->|成功| UpdateListD[更新本地列表]
    UpdateListD --> CloseModalD[关闭模态框]
    CloseModalD --> DisplayDT
    
    DisplayDT --> ViewComments[查看讨论详情<br/>浏览学生评论]
    ViewComments --> DoneDT([完成])
    
    style StartDT fill:#3b82f6,color:#fff
    style DoneDT fill:#22c55e,color:#fff
    style ValidateD fill:#f59e0b
    style SuccessD fill:#8b5cf6
```

### 3.2 学生端讨论管理流程

```mermaid
flowchart TD
    StartDS([学生进入讨论页面]) --> AuthDS[验证JWT Token]
    AuthDS --> FetchDS[GET<br/>/api/student/courses/:id/discussions]
    FetchDS --> DisplayDS[渲染讨论列表]
    
    DisplayDS --> ClickExpand[点击查看评论]
    ClickExpand --> ExpandArea[展开评论区域]
    ExpandArea --> FetchComments[GET<br/>/api/student/courses/:id/discussions/:topicId/comments]
    FetchComments --> ShowComments[显示评论列表]
    ShowComments --> DisplayDS
    
    ClickExpand --> InputComment[输入评论内容]
    InputComment --> SubmitComment[POST<br/>/api/student/courses/:id/discussions/:topicId/comments]
    SubmitComment --> InsertComment[数据库插入评论]
    InsertComment --> AppendComment[本地追加新评论]
    AppendComment --> UpdateCount[更新评论计数]
    UpdateCount --> DoneDS1([完成])
    
    DisplayDS --> BrowseAll[浏览所有讨论主题]
    BrowseAll --> DoneDS2([完成])
    
    style StartDS fill:#3b82f6,color:#fff
    style DoneDS1 fill:#22c55e,color:#fff
    style DoneDS2 fill:#22c55e,color:#fff
    style ExpandArea fill:#8b5cf6
```

***

## 完整教学管理模块流程图（全景）

```mermaid
flowchart TD
    subgraph 教师端流程
        TeacherHome[教师首页] --> TeacherCourse[选择课程]
        TeacherCourse --> TeacherAssign[作业管理]
        TeacherCourse --> TeacherAttend[考勤管理]
        TeacherCourse --> TeacherDiscuss[讨论管理]
        
        TeacherAssign --> PublishA[发布作业]
        PublishA --> ViewSub[查看提交]
        ViewSub --> Grade[批改打分]
        
        TeacherAttend --> CreateAT[创建签到]
        CreateAT --> ShowCode[显示签到码]
        ShowCode --> EndAT[结束签到]
        
        TeacherDiscuss --> CreateD[发布讨论]
        CreateD --> ViewCommentsT[查看评论]
    end
    
    subgraph 学生端流程
        StudentHome[学生首页] --> StudentCourse[选择课程]
        StudentCourse --> StudentAssign[作业列表]
        StudentCourse --> StudentAttend[签到页面]
        StudentCourse --> StudentDiscuss[讨论区]
        
        StudentAssign --> CheckStatus{检查状态}
        CheckStatus --> SubmitA[提交作业]
        CheckStatus --> ViewGrade[查看成绩]
        
        StudentAttend --> InputCode[输入签到码]
        InputCode --> VerifyS[验证签到]
        VerifyS --> ShowResult[显示结果]
        
        StudentDiscuss --> Expand[展开讨论]
        Expand --> LoadComments[加载评论]
        LoadComments --> PostComment[发表评论]
    end
    
    style TeacherHome fill:#3b82f6,color:#fff
    style StudentHome fill:#3b82f6,color:#fff
    style PublishA fill:#22c55e
    style SubmitA fill:#22c55e
    style CreateAT fill:#f59e0b
    style InputCode fill:#f59e0b
    style CreateD fill:#8b5cf6
    style Expand fill:#8b5cf6
```

***

## API 接口汇总

### 课程相关

| 方法     | 路径                                        | 功能       |
| ------ | ----------------------------------------- | -------- |
| GET    | /api/teacher/courses                      | 获取课程列表   |
| POST   | /api/teacher/courses                      | 创建新课程    |
| GET    | /api/teacher/courses/:id                  | 获取课程详情   |
| GET    | /api/teacher/courses/:id/classes          | 获取班级绑定状态 |
| POST   | /api/teacher/courses/:id/classes/:classId | 绑定班级     |
| DELETE | /api/teacher/courses/:id/classes/:classId | 解绑班级     |

### 作业相关

| 方法   | 路径                                                    | 功能     |
| ---- | ----------------------------------------------------- | ------ |
| GET  | /api/teacher/courses/:id/assignments                  | 获取作业列表 |
| POST | /api/teacher/courses/:id/assignments                  | 创建作业   |
| GET  | /api/teacher/courses/:id/assignments/:aid/submissions | 获取学生提交 |
| PUT  | /api/teacher/courses/:id/assignments/:aid/submissions | 批改作业   |
| GET  | /api/student/courses/:id/assignments                  | 获取作业列表 |
| POST | /api/student/courses/:id/assignments                  | 提交作业   |

### 考勤相关

| 方法   | 路径                                            | 功能     |
| ---- | --------------------------------------------- | ------ |
| GET  | /api/teacher/courses/:id/attendances          | 获取签到列表 |
| POST | /api/teacher/courses/:id/attendances          | 创建签到   |
| PUT  | /api/teacher/courses/:id/attendances/:aid/end | 结束签到   |
| GET  | /api/student/courses/:id/attendances          | 获取签到列表 |
| POST | /api/student/courses/:id/attendances          | 提交签到   |

### 讨论相关

| 方法   | 路径                                                     | 功能     |
| ---- | ------------------------------------------------------ | ------ |
| GET  | /api/teacher/courses/:id/discussions                   | 获取讨论列表 |
| POST | /api/teacher/courses/:id/discussions                   | 创建讨论   |
| GET  | /api/student/courses/:id/discussions                   | 获取讨论列表 |
| GET  | /api/student/courses/:id/discussions/:topicId/comments | 获取评论   |
| POST | /api/student/courses/:id/discussions/:topicId/comments | 发表评论   |

