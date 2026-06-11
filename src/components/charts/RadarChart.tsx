import { useMemo } from 'react'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartDataset,
} from 'chart.js'
import { Radar } from 'react-chartjs-2'
import type { AbilityScores } from '@/types/interview'

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

type SimulationRadarData = {
  labels: string[]
  values: number[]
}

const LABELS = ['技术能力', '沟通表达', '逻辑思维', '项目经验', '抗压能力', '岗位匹配']

const ABILITY_KEYS: Array<keyof AbilityScores> = [
  'technical',
  'communication',
  'logic',
  'project',
  'pressure',
  'match',
]

function isAbilityScores(data: AbilityScores | SimulationRadarData): data is AbilityScores {
  return typeof data === 'object' && 'technical' in data
}

interface RadarChartProps {
  data: AbilityScores | SimulationRadarData
  comparisonData?: AbilityScores | SimulationRadarData
  height?: number
}

export default function RadarChart({
  data,
  comparisonData,
  height = 320,
}: RadarChartProps) {
  const chartData = useMemo(() => {
    const labels = isAbilityScores(data) ? LABELS : data.labels
    const mainData = isAbilityScores(data)
      ? ABILITY_KEYS.map((key) => data[key] ?? 0)
      : data.values
    const datasets: ChartDataset<'radar'>[] = [
      {
        label: '当前能力',
        data: mainData,
        backgroundColor: 'rgba(255, 125, 0, 0.25)',
        borderColor: 'rgba(255, 125, 0, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 125, 0, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 125, 0, 1)',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ]

    if (comparisonData) {
      const compData = isAbilityScores(comparisonData)
        ? ABILITY_KEYS.map((key) => comparisonData[key] ?? 0)
        : comparisonData.values
      datasets.push({
        label: '对比数据',
        data: compData,
        backgroundColor: 'rgba(22, 93, 255, 0.1)',
        borderColor: 'rgba(22, 93, 255, 0.8)',
        borderWidth: 2,
        borderDash: [6, 4],
        pointBackgroundColor: 'rgba(22, 93, 255, 0.8)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(22, 93, 255, 0.8)',
        pointRadius: 3,
        pointHoverRadius: 5,
      })
    }

    return { labels, datasets }
  }, [data, comparisonData])

  const options = useMemo<ChartOptions<'radar'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#4E5969',
            font: { size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(29, 33, 41, 0.9)',
          titleColor: '#fff',
          bodyColor: '#fff',
          cornerRadius: 8,
          padding: 12,
          titleFont: { size: 13 },
          bodyFont: { size: 12 },
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.r} 分`,
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: 100,
          beginAtZero: true,
          ticks: {
            stepSize: 20,
            color: '#86909C',
            backdropColor: 'transparent',
            font: { size: 10 },
          },
          pointLabels: {
            color: '#4E5969',
            font: { size: 12, weight: 500 },
            padding: 12,
          },
          grid: {
            color: 'rgba(198, 205, 217, 0.4)',
          },
          angleLines: {
            color: 'rgba(198, 205, 217, 0.4)',
          },
        },
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
        easing: 'easeOutQuart',
      },
    }),
    []
  )

  return (
    <div style={{ height }}>
      <Radar data={chartData} options={options} />
    </div>
  )
}
