import { simulationDB, failQuestionDB } from './db';
import type {
  SimulationReport,
  SimulationAnswer,
  SimulationDimension,
  FailQuestion,
} from '../types/simulation';
import { DIMENSION_LABELS, DIMENSION_QUESTIONS, DIMENSION_REFERENCES } from '../types/simulation';
import type { Interview, InterviewQuestion } from '../types/interview';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function getSimulationReports(): Promise<SimulationReport[]> {
  try {
    const reports = await simulationDB.getAll();
    return reports.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error('Failed to get simulation reports:', error);
    return [];
  }
}

export async function getSimulationReportById(id: string): Promise<SimulationReport | undefined> {
  try {
    return await simulationDB.get(id);
  } catch (error) {
    console.error('Failed to get simulation report:', error);
    return undefined;
  }
}

export async function saveSimulationReport(report: SimulationReport): Promise<SimulationReport> {
  try {
    await simulationDB.add(report);
    return report;
  } catch (error) {
    console.error('Failed to save simulation report:', error);
    throw error;
  }
}

export async function deleteSimulationReport(id: string): Promise<void> {
  try {
    await simulationDB.delete(id);
  } catch (error) {
    console.error('Failed to delete simulation report:', error);
    throw error;
  }
}

export async function getFailQuestions(): Promise<FailQuestion[]> {
  try {
    const questions = await failQuestionDB.getAll();
    return questions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch (error) {
    console.error('Failed to get fail questions:', error);
    return [];
  }
}

export async function addFailQuestion(question: FailQuestion): Promise<FailQuestion> {
  try {
    await failQuestionDB.add(question);
    return question;
  } catch (error) {
    console.error('Failed to add fail question:', error);
    throw error;
  }
}

export async function deleteFailQuestion(id: string): Promise<void> {
  try {
    await failQuestionDB.delete(id);
  } catch (error) {
    console.error('Failed to delete fail question:', error);
    throw error;
  }
}

export async function syncFailQuestionsFromInterviews(interviews: Interview[]): Promise<void> {
  try {
    const existing = await failQuestionDB.getAll();
    const existingKeys = new Set(existing.map((q) => q.sourceId + ':' + q.question));

    const newFailQuestions: FailQuestion[] = [];
    for (const interview of interviews) {
      for (const q of interview.questions) {
        if (q.rating < 3 && !existingKeys.has(interview.id + ':' + q.question)) {
          newFailQuestions.push({
            id: generateId(),
            question: q.question,
            originalAnswer: q.answer,
            source: 'interview',
            sourceId: interview.id,
            weaknessTags: interview.weaknesses.map((w) => w.content),
            suggestion: generateSuggestion(q),
            dimension: guessDimension(q.question),
            createdAt: new Date().toISOString(),
          });
        }
      }
    }

    if (newFailQuestions.length > 0) {
      await failQuestionDB.bulkAdd(newFailQuestions);
    }
  } catch (error) {
    console.error('Failed to sync fail questions:', error);
  }
}

function guessDimension(question: string): SimulationDimension {
  const lower = question.toLowerCase();
  if (lower.includes('自我介绍') || lower.includes('介绍自己') || lower.includes('介绍你')) return 'self_intro';
  if (lower.includes('项目') || lower.includes('挑战') || lower.includes('贡献')) return 'project';
  if (lower.includes('技术') || lower.includes('闭包') || lower.includes('算法') || lower.includes('框架') || lower.includes('优化') || lower.includes('原理')) return 'technical';
  if (lower.includes('团队') || lower.includes('冲突') || lower.includes('压力') || lower.includes('合作') || lower.includes('经历')) return 'behavior';
  if (lower.includes('薪资') || lower.includes('工资') || lower.includes('薪酬')) return 'salary';
  if (lower.includes('想问') || lower.includes('想了解')) return 'counter_question';
  return 'technical';
}

function generateSuggestion(q: InterviewQuestion): string {
  if (!q.answer || q.answer.trim().length < 20) {
    return '回答内容过于简短，建议使用STAR法则组织答案，提供具体案例支撑。';
  }
  if (q.rating === 1) {
    return '回答与问题匹配度较低，建议先理解问题核心，再从多角度展开分析。';
  }
  return '回答有一定基础但深度不够，建议补充具体数据、案例，加强逻辑层次。';
}

export function generateSimulationQuestions(
  dimensions: SimulationDimension[],
  count: number,
  failQuestions: FailQuestion[],
  includeFailQuestions: boolean
): { id: string; question: string; referenceAnswer: string; dimension: SimulationDimension; duration: number }[] {
  const questions: { id: string; question: string; referenceAnswer: string; dimension: SimulationDimension; duration: number }[] = [];
  const usedQuestions = new Set<string>();

  if (includeFailQuestions && failQuestions.length > 0) {
    const relevantFailQ = failQuestions.filter((fq) => dimensions.includes(fq.dimension));
    const failQToUse = relevantFailQ.length > 0 ? relevantFailQ : failQuestions;
    const failCount = Math.min(Math.ceil(count * 0.3), failQToUse.length);

    const shuffled = [...failQToUse].sort(() => Math.random() - 0.5);
    for (let i = 0; i < failCount; i++) {
      const fq = shuffled[i];
      if (!usedQuestions.has(fq.question)) {
        usedQuestions.add(fq.question);
        questions.push({
          id: generateId(),
          question: fq.question,
          referenceAnswer: fq.suggestion || DIMENSION_REFERENCES[fq.dimension],
          dimension: fq.dimension,
          duration: 180,
        });
      }
    }
  }

  const remainingCount = count - questions.length;
  const dimQueue: SimulationDimension[] = [];
  while (dimQueue.length < remainingCount + dimensions.length) {
    const shuffled = [...dimensions].sort(() => Math.random() - 0.5);
    dimQueue.push(...shuffled);
  }

  for (let i = 0; i < remainingCount; i++) {
    const dim = dimQueue[i];
    const pool = DIMENSION_QUESTIONS[dim].filter((q) => !usedQuestions.has(q));
    if (pool.length > 0) {
      const q = pool[Math.floor(Math.random() * pool.length)];
      usedQuestions.add(q);
      questions.push({
        id: generateId(),
        question: q,
        referenceAnswer: DIMENSION_REFERENCES[dim],
        dimension: dim,
        duration: 180,
      });
    }
  }

  return questions.slice(0, count);
}

export function evaluateAnswer(
  question: string,
  answer: string,
  dimension: SimulationDimension
): SimulationAnswer['scores'] & { feedback: string; highlights: string[]; improvements: string[]; improvedAnswer: string } {
  const len = answer.trim().length;

  let completeness = 20;
  let clarity = 30;
  let evidence = 20;
  let fluency = 30;

  if (len > 10) completeness += 15;
  if (len > 50) completeness += 15;
  if (len > 100) completeness += 15;
  if (len > 200) completeness += 15;
  if (len > 300) completeness += 10;
  if (len > 500) completeness += 5;

  const hasStructure = /首先|其次|然后|最后|第一|第二|第三|一方面|另一方面|综上|总结/.test(answer);
  const hasExample = /例如|比如|举个例子|在我的项目中|曾经|有一次/.test(answer);
  const hasData = /\d+%|\d+倍|\d+人|\d+万|\d+个|\d+次/.test(answer);
  const hasLogic = /因此|所以|导致|原因|结果|影响|关键|核心|本质/.test(answer);

  if (hasStructure) { clarity += 20; fluency += 10; }
  if (hasExample) evidence += 25;
  if (hasData) evidence += 15;
  if (hasLogic) { clarity += 15; fluency += 10; }

  completeness = Math.min(100, completeness);
  clarity = Math.min(100, clarity);
  evidence = Math.min(100, evidence);
  fluency = Math.min(100, fluency);

  const highlights: string[] = [];
  const improvements: string[] = [];

  if (hasStructure) highlights.push('回答结构清晰，层次分明');
  if (hasExample) highlights.push('使用了具体案例支撑观点');
  if (hasData) highlights.push('用数据量化了成果');
  if (hasLogic) highlights.push('逻辑推理严密，因果关系清晰');
  if (len > 200) highlights.push('回答内容充实，展开充分');

  if (!hasStructure) improvements.push('建议使用"首先、其次、最后"等连接词组织回答结构');
  if (!hasExample) improvements.push('缺少具体案例，建议用STAR法则补充实际经历');
  if (!hasData) improvements.push('建议用数据量化你的成果和贡献');
  if (len < 50) improvements.push('回答过于简短，需要更充分地展开论述');
  if (len < 100 && !hasExample) improvements.push('内容不够丰满，尝试从多个角度深入分析');

  const avgScore = (completeness + clarity + evidence + fluency) / 4;
  let feedback = '';
  if (avgScore >= 75) feedback = '回答整体表现优秀，结构清晰、案例充实。继续保持这种面试状态。';
  else if (avgScore >= 55) feedback = '回答基本合格，有一定逻辑和内容，但在案例支撑和结构化方面还有提升空间。';
  else if (avgScore >= 35) feedback = '回答需要加强，建议多准备具体案例，使用STAR法则组织答案，让回答更有说服力。';
  else feedback = '回答过于简短或缺乏结构，建议重新组织思路，从背景、行动、结果三个维度展开。';

  const dimLabel = DIMENSION_LABELS[dimension];
  let improvedAnswer = '';
  if (len < 100) {
    improvedAnswer = `建议参考结构：关于${dimLabel}类问题，可以从以下几个维度展开：1）背景说明——描述具体场景和挑战；2）你的行动——详细说明你采取了哪些措施；3）结果与反思——用数据说明成果，总结经验教训。结合你自身的经历来丰富内容。`;
  } else {
    improvedAnswer = `你的回答有一定内容，建议：1）加入更具体的案例和数据支撑；2）使用STAR法则重新组织结构；3）在结尾增加总结和反思。这样会让回答更有说服力和层次感。`;
  }

  return {
    completeness,
    clarity,
    evidence,
    fluency,
    feedback,
    highlights,
    improvements,
    improvedAnswer,
  };
}
