import path from 'path';
import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';

const GRPC_URL =
  process.env.GRPC_STUDENT_ANALYSIS_URL || '127.0.0.1:50051';
const PROTO_PATH = path.join(
  process.cwd(),
  'python/proto/student_analysis.proto'
);
const DEADLINE_MS = 3000;

export type LearningFeatures = {
  videoLearning: number;
  materialLearning: number;
  chapterStudyCount: number;
  discussion: number;
  attendance: number;
};

export type GradePrediction = {
  grade: string;
  gradeCode: number;
  confidence: number;
  modelVersion?: string;
};

/** 学情预测服务不可用或推理失败时抛出，由 API 映射为 503 */
export class PredictionServiceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'PredictionServiceError';
    if (cause !== undefined) {
      (this as Error & { cause?: unknown }).cause = cause;
    }
  }
}

type PredictRequest = {
  video_learning: number;
  material_learning: number;
  chapter_study_count: number;
  discussion: number;
  attendance: number;
};

type PredictResponse = {
  grade: string;
  grade_code: number;
  confidence: number;
};

type ModelInfoResponse = {
  model_name: string;
  model_version: string;
  features: string[];
};

type StudentAnalysisClient = {
  PredictGrade: (
    request: PredictRequest,
    options: { deadline: Date },
    callback: (error: grpc.ServiceError | null, response: PredictResponse) => void
  ) => void;
  GetModelInfo: (
    request: Record<string, never>,
    options: { deadline: Date },
    callback: (error: grpc.ServiceError | null, response: ModelInfoResponse) => void
  ) => void;
};

let client: StudentAnalysisClient | null = null;
let cachedModelVersion: string | undefined;

function getClient(): StudentAnalysisClient {
  if (client) {
    return client;
  }

  const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  });

  const proto = grpc.loadPackageDefinition(packageDefinition) as unknown as {
    student_analysis: {
      StudentAnalysisService: new (
        address: string,
        credentials: grpc.ChannelCredentials
      ) => StudentAnalysisClient;
    };
  };

  client = new proto.student_analysis.StudentAnalysisService(
    GRPC_URL,
    grpc.credentials.createInsecure()
  );

  return client;
}

function withDeadline(): { deadline: Date } {
  return { deadline: new Date(Date.now() + DEADLINE_MS) };
}

/**
 * 调用 Python gRPC 预测成绩等级。失败时抛出 PredictionServiceError，禁止规则降级。
 */
export async function predictGradeByFeatures(
  features: LearningFeatures
): Promise<GradePrediction> {
  const stub = getClient();

  const response = await new Promise<PredictResponse>((resolve, reject) => {
    stub.PredictGrade(
      {
        video_learning: Number(features.videoLearning) || 0,
        material_learning: Number(features.materialLearning) || 0,
        chapter_study_count: Math.round(Number(features.chapterStudyCount) || 0),
        discussion: Number(features.discussion) || 0,
        attendance: Number(features.attendance) || 0,
      },
      withDeadline(),
      (error, res) => {
        if (error) {
          reject(
            new PredictionServiceError(
              '学情预测服务不可用',
              error
            )
          );
          return;
        }
        resolve(res);
      }
    );
  });

  let modelVersion = cachedModelVersion;
  if (!modelVersion) {
    try {
      modelVersion = await fetchModelVersion();
      cachedModelVersion = modelVersion;
    } catch {
      // 模型版本为可选元数据，不影响预测结果本身
    }
  }

  return {
    grade: response.grade,
    gradeCode: response.grade_code,
    confidence: response.confidence,
    modelVersion,
  };
}

async function fetchModelVersion(): Promise<string | undefined> {
  const stub = getClient();
  const info = await new Promise<ModelInfoResponse>((resolve, reject) => {
    stub.GetModelInfo({}, withDeadline(), (error, res) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(res);
    });
  });
  return info.model_version || info.model_name;
}

/**
 * 批量预测；任一次失败则整体失败（不降级、不部分填补）。
 */
export async function predictGradesByFeaturesBatch(
  featuresList: LearningFeatures[],
  concurrency = 5
): Promise<GradePrediction[]> {
  const results: GradePrediction[] = new Array(featuresList.length);
  let index = 0;

  async function worker() {
    while (index < featuresList.length) {
      const current = index;
      index += 1;
      results[current] = await predictGradeByFeatures(featuresList[current]);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, Math.max(featuresList.length, 1)) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}
