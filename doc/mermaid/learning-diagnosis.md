# 学情诊断流程图

## 1. 学情诊断完整数据流图

```mermaid
flowchart LR
    subgraph 前端层
        subgraph 教师端
            TeacherDiagnosis[教师学情诊断页面<br/>/teacher/course/[id]/diagnosis]
            TeacherOverview[课程整体学情总览]
            TeacherStudents[学生个体学情分析]
        end
        
        subgraph 学生端
            StudentDiagnosis[学生学情诊断页面<br/>/student/course/[id]/diagnosis]
            StudentReport[个人学情报告展示]
        end
    end
    
    subgraph API层
        TeacherDiagnosisAPI[GET /api/teacher/courses/[id]/diagnosis<br/>教师学情诊断API]
        StudentDiagnosisAPI[GET /api/student/courses/[id]/diagnosis<br/>学生学情诊断API]
    end
    
    subgraph 数据处理层
        DataCollection[数据收集模块]
        ScoreCalculation[综合得分计算]
        SuggestionGenerator[学习建议生成]
        GradePrediction[成绩等级预测]
    end
    
    subgraph 数据库层
        StudentsDB[students表]
        VideosDB[course_videos表<br/>video_play_duration表]
        ResourcesDB[course_resources表<br/>resource_downloads表]
        DiscussionDB[discussion_topics表<br/>topic_comments表]
        AttendanceDB[course_attendance表<br/>attendance_records表]
        AssignmentDB[assignment_topics表<br/>assignments表]
    end
    
    subgraph 机器学习服务层
        PythonGRPC[Python gRPC服务]
        ModelInference[模型推理预测]
    end
    
    TeacherDiagnosis-->|切换标签|TeacherOverview
    TeacherDiagnosis-->|切换标签|TeacherStudents
    StudentDiagnosis-->|显示|StudentReport
    
    TeacherDiagnosis-->|请求|TeacherDiagnosisAPI
    StudentDiagnosis-->|请求|StudentDiagnosisAPI
    
    TeacherDiagnosisAPI-->|调用|DataCollection
    StudentDiagnosisAPI-->|调用|DataCollection
    
    DataCollection-->|查询|StudentsDB
    DataCollection-->|查询|VideosDB
    DataCollection-->|查询|ResourcesDB
    DataCollection-->|查询|DiscussionDB
    DataCollection-->|查询|AttendanceDB
    DataCollection-->|查询|AssignmentDB
    
    DataCollection-->|原始数据|ScoreCalculation
    ScoreCalculation-->|计算结果|SuggestionGenerator
    SuggestionGenerator-->|生成建议|GradePrediction
    
    GradePrediction-->|必须调用|PythonGRPC
    PythonGRPC-->|预测结果|ModelInference
    ModelInference-->|返回等级|GradePrediction
    PythonGRPC-->|失败|Err503[API返回503]
    
    TeacherDiagnosisAPI-->|返回JSON|TeacherDiagnosis
    StudentDiagnosisAPI-->|返回JSON|StudentDiagnosis
```

## 2. 成绩预测流程图

```mermaid
flowchart TD
    Start([开始成绩预测])-->CollectData[收集学习行为数据]
    
    CollectData-->GetVideo[获取音视频学习完成率]
    CollectData-->GetMaterial[获取资料自主学习完成率]
    CollectData-->GetChapter[获取章节学习次数]
    CollectData-->GetDiscussion[获取讨论参与度]
    CollectData-->GetAttendance[获取签到完成率]
    CollectData-->GetAssignment[获取作业完成情况]
    
    GetVideo-->NormalizeData[数据标准化处理]
    GetMaterial-->NormalizeData
    GetChapter-->NormalizeData
    GetDiscussion-->NormalizeData
    GetAttendance-->NormalizeData
    GetAssignment-->NormalizeData
    
    NormalizeData-->CalcScore[计算综合得分]
    
    CalcScore-->CallGRPC[调用Python gRPC服务]
    CallGRPC-->SendFeatures[发送特征向量]
    SendFeatures-->LoadModel[加载预训练模型<br/>best_model.pkl]
    LoadModel-->ApplyScaler[应用标准化器<br/>scaler.pkl]
    ApplyScaler-->Inference[模型推理预测]
    Inference-->GetPrediction[获取预测等级]
    
    CallGRPC-->|超时或连接失败|Fail503[返回503学情预测服务不可用]
    
    GetPrediction-->GenerateSuggestions[生成学习建议]
    
    GenerateSuggestions-->AssembleResult[组装预测结果]
    
    AssembleResult-->ReturnResult[返回预测结果]
    
    ReturnResult-->End([结束])
    
    style CalcScore fill:#4ade80
    style CallGRPC fill:#3b82f6
    style LoadModel fill:#8b5cf6
```

## 3. 班级学情总览流程图

```mermaid
flowchart LR
    Start([进入课程学情诊断])-->AuthCheck[鉴权与课程归属校验]
    AuthCheck-->BatchQuery[批查询全班学情特征]
    BatchQuery-->GrpcBatch[批量调用Python gRPC预测]
    GrpcBatch-->|任一次失败|Fail503[整请求返回503]
    GrpcBatch-->|全部成功|CalcCourseStats[计算课程整体统计]
    CalcCourseStats-->AvgScore[计算平均综合得分]
    CalcCourseStats-->VideoStats[统计视频学习情况]
    CalcCourseStats-->AssignmentStats[统计作业完成情况]
    CalcCourseStats-->DiscussionStats[统计讨论参与情况]
    CalcCourseStats-->AttendanceStats[统计签到情况]
    VideoStats-->RenderCharts[渲染Chart.js图表]
    AssignmentStats-->RenderCharts
    DiscussionStats-->RenderCharts
    AttendanceStats-->RenderCharts
    AvgScore-->RenderCharts
    RenderCharts-->ShowOverview[展示班级学情总览]
    ShowOverview-->CanSwitch{切换标签?}
    CanSwitch-->|是|LoadStudents[加载学生个体学情]
    CanSwitch-->|否|StayOverview[停留在总览]
    StayOverview-->EndNode([结束])
    LoadStudents-->StudentList[学生列表展示]
    StudentList-->ClickStudent[点击展开学生详情]
    ClickStudent-->RenderStudentCharts[渲染学生个人图表]
    RenderStudentCharts-->ShowGrade[显示预测成绩等级]
    ShowGrade-->ShowSuggestions[显示学习建议]
```

## 4. 个人学情报告流程图

```mermaid
flowchart TD
    Start([进入个人学情诊断])-->CheckAuth{检查登录状态}
    
    CheckAuth-->|未登录|Redirect[重定向登录页]
    CheckAuth-->|已登录|FetchData[获取学情数据]
    
    FetchData-->GetCourse[获取课程信息]
    FetchData-->GetLearningData[获取学习行为数据]
    
    GetLearningData-->APICall[调用学情诊断API]
    
    APICall-->CollectFeatures{收集5项特征}
    
    CollectFeatures-->VideoLearning[音视频学习完成率]
    CollectFeatures-->MaterialLearning[资料自主学习完成率]
    CollectFeatures-->ChapterCount[章节学习次数]
    CollectFeatures-->Discussion[讨论参与度]
    CollectFeatures-->Attendance[签到完成率]
    
    VideoLearning-->Calculate[计算综合得分]
    MaterialLearning-->Calculate
    ChapterCount-->Calculate
    Discussion-->Calculate
    Attendance-->Calculate
    
    Calculate-->PredictGrade[预测成绩等级]
    Calculate-->GenerateSuggestions[生成学习建议]
    
    GenerateSuggestions-->RenderPage[渲染页面]
    
    RenderPage-->InitCharts[初始化Chart.js图表]
    
    InitCharts-->CreateDoughnut1[创建综合得分环形图]
    InitCharts-->CreateDoughnut2[创建视频学习环形图]
    InitCharts-->CreateDoughnut3[创建资料学习环形图]
    InitCharts-->CreateDoughnut4[创建讨论参与环形图]
    InitCharts-->CreateDoughnut5[创建签到完成环形图]
    
    CreateDoughnut1-->ShowReport[展示个人学情报告]
    CreateDoughnut2-->ShowReport
    CreateDoughnut3-->ShowReport
    CreateDoughnut4-->ShowReport
    CreateDoughnut5-->ShowReport
    
    ShowReport-->DisplayAssignment[展示作业情况]
    ShowReport-->DisplaySuggestions[展示学习建议]
    ShowReport-->DisplayPrediction[展示预测等级]
    
    DisplayAssignment-->UserAction{用户操作}
    DisplaySuggestions-->UserAction
    DisplayPrediction-->UserAction
    
    UserAction-->|离开|End([结束])
    UserAction-->|刷新|FetchData
```

## 5. 学情诊断数据处理时序图

```mermaid
sequenceDiagram
    autonumber
    participant User as 用户
    participant Front as 前端页面
    participant API as Next.js API
    participant DB as PostgreSQL
    participant ML as Python gRPC服务
    
    User->>Front: 点击"学情诊断"
    Front->>API: GET /api/[teacher/student]/courses/[id]/diagnosis
    API->>API: withAuth验证token
    
    API->>DB: 查询课程UUID
    DB-->>API: 返回课程ID
    
    API->>DB: 查询该课程的学生列表
    DB-->>API: 返回学生列表
    
    loop 对每个学生处理
        API->>DB: 查询视频学习数据
        API->>DB: 查询资源学习数据
        API->>DB: 查询讨论参与数据
        API->>DB: 查询签到记录数据
        API->>DB: 查询作业完成数据
        
        DB-->>API: 返回各项原始数据
        
        API->>API: 计算各项完成率百分比
        API->>API: 计算综合得分(加权平均)
        API->>API: 生成学习建议
        
        API->>API: 预测成绩等级
        Note over API: 视频25% + 资料20% + 讨论15% +<br/>签到20% + 作业20% = 总分100
    end
    
    API->>DB: 查询课程整体统计数据
    DB-->>API: 返回课程统计
    
    API->>API: 计算课程平均得分、完成率等
    
    API-->>Front: 返回完整学情数据JSON
    
    Front->>Front: 解析数据并初始化Chart.js
    Front->>Front: 渲染环形图、统计卡片
    
    Front-->>User: 展示完整学情诊断页面
    
    alt 教师端
        User->>Front: 点击学生卡片展开
        Front->>Front: 渲染该学生的详细图表
    end
```

## 6. 学业风险预警流程图

```mermaid
flowchart TD
    Start([风险预警检查])-->GetStudents[获取班级所有学生]
    
    GetStudents-->ForEach{遍历每个学生}
    
    ForEach-->CalcScore[计算综合得分]
    
    CalcScore-->CheckScore{综合得分 < 60?}
    
    CheckScore-->|是|HighRisk[高风险预警]
    HighRisk-->AddRed[标记红色警告]
    
    CheckScore-->|否|CheckMedium{60 ≤ 得分 < 75?}
    
    CheckMedium-->|是|MediumRisk[中风险预警]
    MediumRisk-->AddYellow[标记黄色警告]
    
    CheckMedium-->|否|CheckGood{75 ≤ 得分 < 90?}
    
    CheckGood-->|是|Normal[正常状态]
    CheckGood-->|否|Excellent[优秀状态]
    
    AddRed-->CheckVideo{视频完成率 < 50?}
    AddYellow-->CheckVideo
    Normal-->CheckVideo
    Excellent-->CheckVideo
    
    CheckVideo-->|是|VideoProblem[视频学习问题]
    VideoProblem-->AddVideoSuggestion[增加视频学习建议]
    
    CheckVideo-->|否|CheckAssignment{作业提交率 < 60?}
    
    CheckAssignment-->|是|AssignmentProblem[作业完成问题]
    AssignmentProblem-->AddAssignmentSuggestion[增加作业建议]
    
    CheckAssignment-->|否|CheckAttendance{签到率 < 70?}
    
    CheckAttendance-->|是|AttendanceProblem[签到问题]
    AttendanceProblem-->AddAttendanceSuggestion[增加签到建议]
    
    CheckAttendance-->|否|CheckDiscussion{讨论参与度 < 30?}
    
    CheckDiscussion-->|是|DiscussionProblem[讨论参与问题]
    DiscussionProblem-->AddDiscussionSuggestion[增加讨论建议]
    
    AddVideoSuggestion-->Next{下一个学生?}
    AddAssignmentSuggestion-->Next
    AddAttendanceSuggestion-->Next
    AddDiscussionSuggestion-->Next
    
    Next-->|是|ForEach
    Next-->|否|GenerateReport[生成风险预警报告]
    
    GenerateReport-->ShowDashboard[展示在教师仪表盘]
    
    ShowDashboard-->End([结束])
    
    style HighRisk fill:#ef4444
    style MediumRisk fill:#f59e0b
    style Excellent fill:#22c55e
```
