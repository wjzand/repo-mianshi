import type {
  Interview,
  AbilityScores,
  InterviewStats,
  AbilityTrend,
  TopQuestion,
} from '@/types/interview';
import {
  strengthAnalysisMap,
  weaknessSuggestionsMap,
  communicationTags,
  pressureTags,
  matchTags,
} from '@/data/tags';

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function calculateAbilityScores(interview: Interview): AbilityScores {
  const { overallRating = 0, questions = [], strengths = [], weaknesses = [] } = interview;
  const allTags = [...strengths, ...weaknesses].map((t) => t.content);

  const techQuestions = questions.filter(
    (q) => q.category === 'technical' || q.rating
  );
  const projectQuestions = questions.filter(
    (q) => q.category === 'project' || (q.question && q.question.includes('项目'))
  );

  const techAvgRating = techQuestions.length > 0
    ? techQuestions.reduce((sum, q) => sum + (q.rating || 0), 0) / techQuestions.length
    : 0;
  const projectAvgRating = projectQuestions.length > 0
    ? projectQuestions.reduce((sum, q) => sum + (q.rating || 0), 0) / projectQuestions.length
    : 0;

  const communicationBonus = Math.min(
    allTags.filter((tag) => communicationTags.includes(tag)).length * 5,
    10
  );
  const pressureBonus = allTags.includes('抗压能力好') ? 10 : allTags.includes('紧张') ? -10 : 0;
  const matchBonus = allTags.filter((tag) => matchTags.includes(tag)).length * 5;

  const technical = techAvgRating > 0 ? techAvgRating * 20 : overallRating * 15;
  const communication = overallRating * 15 + communicationBonus;
  const logic = questions.length > 0
    ? (questions.reduce((sum, q) => sum + (q.rating || overallRating), 0) / questions.length) * 18
    : overallRating * 18;
  const project = projectAvgRating > 0 ? projectAvgRating * 20 : overallRating * 15;
  const pressure = overallRating * 16 + pressureBonus;
  const match = overallRating * 18 + matchBonus;

  return {
    technical: clampScore(technical),
    communication: clampScore(communication),
    logic: clampScore(logic),
    project: clampScore(project),
    pressure: clampScore(pressure),
    match: clampScore(match),
  };
}

export function generateAnalysisText(interview: Interview): string {
  const { strengths = [], weaknesses = [], overallRating = 0 } = interview;

  const parts: string[] = [];

  if (overallRating >= 4) {
    parts.push(`本次面试整体表现优秀，综合评分为${overallRating}分，展现了良好的综合素质。`);
  } else if (overallRating >= 3) {
    parts.push(`本次面试整体表现良好，综合评分为${overallRating}分，有不少可圈可点之处。`);
  } else if (overallRating > 0) {
    parts.push(`本次面试综合评分为${overallRating}分，仍有较大提升空间。`);
  }

  if (strengths.length > 0) {
    parts.push('【优势分析】');
    strengths.forEach((tag) => {
      const analysis = strengthAnalysisMap[tag.content as keyof typeof strengthAnalysisMap];
      if (analysis) {
        parts.push(`· ${analysis}`);
      }
    });
  }

  if (weaknesses.length > 0) {
    parts.push('【不足分析】');
    weaknesses.forEach((tag) => {
      const suggestions = weaknessSuggestionsMap[tag.content as keyof typeof weaknessSuggestionsMap];
      if (suggestions) {
        parts.push(`· 在「${tag.content}」方面还有提升空间，建议针对性加强练习。`);
      }
    });
  }

  return parts.join('\n');
}

export function generateSuggestions(interview: Interview): string[] {
  const { weaknesses = [] } = interview;
  const suggestions: string[] = [];

  weaknesses.forEach((tag) => {
    const tagSuggestions = weaknessSuggestionsMap[tag.content as keyof typeof weaknessSuggestionsMap];
    if (tagSuggestions) {
      suggestions.push(...tagSuggestions);
    }
  });

  if (suggestions.length === 0) {
    suggestions.push('继续保持良好的面试状态，多进行模拟面试练习。');
    suggestions.push('深入研究目标公司和岗位，准备更有针对性的面试内容。');
    suggestions.push('每次面试后及时复盘，总结经验教训，持续迭代提升。');
  }

  return [...new Set(suggestions)].slice(0, 10);
}

export function calculateStats(interviews: Interview[]): InterviewStats {
  const total = interviews.length;
  const passCount = interviews.filter((i) => i.result === 'pass').length;
  const pendingCount = interviews.filter((i) => i.result === 'pending').length;
  const failCount = interviews.filter((i) => i.result === 'fail').length;

  const passRate = total > 0 ? Math.round((passCount / total) * 100) : 0;

  const ratedInterviews = interviews.filter((i) => i.overallRating > 0);
  const avgRating = ratedInterviews.length > 0
    ? Number(
        (
          ratedInterviews.reduce((sum, i) => sum + i.overallRating, 0) / ratedInterviews.length
        ).toFixed(1)
      )
    : 0;

  return {
    total,
    passRate,
    avgRating,
    passCount,
    pendingCount,
    failCount,
  };
}

export function getTopQuestions(interviews: Interview[], topN: number = 10): TopQuestion[] {
  const questionCount: Record<string, number> = {};

  interviews.forEach((interview) => {
    interview.questions?.forEach((q) => {
      const title = q.question?.trim();
      if (title) {
        questionCount[title] = (questionCount[title] || 0) + 1;
      }
    });
  });

  return Object.entries(questionCount)
    .map(([title, count]) => ({ title, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}

export function getAbilityTrend(interviews: Interview[]): AbilityTrend {
  const sortedInterviews = [...interviews].sort(
    (a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime()
  );

  function averageScores(interviewList: Interview[]): AbilityScores {
    if (interviewList.length === 0) {
      return { technical: 0, communication: 0, logic: 0, project: 0, pressure: 0, match: 0 };
    }

    const scoresList = interviewList.map(calculateAbilityScores);
    const keys: (keyof AbilityScores)[] = [
      'technical',
      'communication',
      'logic',
      'project',
      'pressure',
      'match',
    ];

    const result: Partial<AbilityScores> = {};
    keys.forEach((key) => {
      result[key] = Math.round(
        scoresList.reduce((sum, s) => sum + s[key], 0) / scoresList.length
      );
    });

    return result as AbilityScores;
  }

  const earlyInterviews = sortedInterviews.slice(0, 5);
  const recentInterviews = sortedInterviews.slice(-5);

  return {
    early: averageScores(earlyInterviews),
    recent: averageScores(recentInterviews),
  };
}
