export type SimulationMode = 'practice' | 'exam';
export type SimulationStatus = 'setup' | 'ongoing' | 'completed';
export type SimulationDimension = 'self_intro' | 'project' | 'technical' | 'behavior' | 'salary' | 'counter_question';
export type FailQuestionSource = 'interview' | 'simulation';

export interface SimulationQuestion {
  id: string;
  question: string;
  referenceAnswer: string;
  dimension: SimulationDimension;
  duration: number;
}

export interface SimulationAnswer {
  questionId: string;
  question: string;
  answer: string;
  audioUrl: string | null;
  duration: number;
  scores: {
    completeness: number;
    clarity: number;
    evidence: number;
    fluency: number;
  };
  feedback: string;
  highlights: string[];
  improvements: string[];
  improvedAnswer: string;
}

export interface SimulationConfig {
  position: string;
  round: string;
  questionCount: 3 | 5 | 10;
  dimensions: SimulationDimension[];
  includeFailQuestions: boolean;
  mode: SimulationMode;
}

export interface SimulationSession {
  id: string;
  config: SimulationConfig;
  status: SimulationStatus;
  questions: SimulationQuestion[];
  answers: SimulationAnswer[];
  currentQuestionIndex: number;
  startedAt: string;
  completedAt: string | null;
  totalScore: number;
  dimensionScores: Record<SimulationDimension, number>;
}

export interface SimulationReport {
  id: string;
  sessionId: string;
  config: SimulationConfig;
  answers: SimulationAnswer[];
  totalScore: number;
  dimensionScores: Record<SimulationDimension, number>;
  comparedToLast: Record<string, number>;
  suggestions: string[];
  createdAt: string;
}

export interface FailQuestion {
  id: string;
  question: string;
  originalAnswer: string;
  source: FailQuestionSource;
  sourceId: string;
  weaknessTags: string[];
  suggestion: string;
  dimension: SimulationDimension;
  createdAt: string;
}

export const DIMENSION_LABELS: Record<SimulationDimension, string> = {
  self_intro: '自我介绍',
  project: '项目深挖',
  technical: '技术基础',
  behavior: '行为面试',
  salary: '薪资谈判',
  counter_question: '反问环节',
};

export const DIMENSION_QUESTIONS: Record<SimulationDimension, string[]> = {
  self_intro: [
    '请做一个自我介绍',
    '用一分钟时间介绍你自己',
    '请简要介绍你的背景和核心优势',
  ],
  project: [
    '介绍一下你做过的最有挑战的项目',
    '你在项目中扮演什么角色？最大的贡献是什么？',
    '项目中遇到最大的困难是什么？你是如何解决的？',
    '如果重新做这个项目，你会有什么不同的做法？',
  ],
  technical: [
    '请解释一下你对闭包的理解，并举一个实际应用的例子',
    'Vue和React的核心区别是什么？你会如何选择？',
    '浏览器从输入URL到页面渲染经历了哪些步骤？',
    '如何实现一个深拷贝？有哪些注意事项？',
    '解释一下事件循环机制，宏任务和微任务有什么区别？',
    '项目中做过哪些性能优化？效果如何？',
  ],
  behavior: [
    '说一次你和同事意见不合的经历，你是怎么处理的？',
    '描述一次你在压力下完成任务的经历',
    '分享一个你主动推动改进的案例',
    '你是如何快速学习一项新技术的？',
  ],
  salary: [
    '你的期望薪资是多少？',
    '如果给你低于期望的offer，你会怎么考虑？',
    '你目前的薪资构成是怎样的？',
  ],
  counter_question: [
    '你有什么想问我们的吗？',
    '对于这个岗位，你还有什么想了解的？',
    '你对团队有什么期待？',
  ],
};

export const DIMENSION_REFERENCES: Record<SimulationDimension, string> = {
  self_intro: '建议从教育背景、工作经历、核心技能、职业目标四个维度简洁介绍，控制在2-3分钟内，突出与岗位匹配的亮点。避免流水账式叙述，重点放在与目标岗位相关的经验上。',
  project: '使用STAR法则：Situation(背景)、Task(任务)、Action(行动)、Result(结果)，突出思考过程和技术深度。用数据量化成果，强调个人贡献。',
  technical: '回答要有层次：先给出核心概念定义，再展开原理分析，最后结合实际应用举例。避免纯理论背诵，展示理解深度。',
  behavior: '使用STAR法则，客观描述情境，强调个人行动和决策过程，展示团队协作能力，总结收获和反思。语速适中，条理清晰。',
  salary: '做好市场调研，给出合理区间而非固定数字。可以反问对方预算范围，展现灵活性和诚意。强调价值匹配而非单纯数字。',
  counter_question: '可以问：团队规模和构成、技术栈和未来规划、岗位的核心挑战、公司培养机制。避免问薪资、加班等敏感或已公开的信息。',
};
