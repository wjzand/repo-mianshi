import { useMemo } from 'react'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  type ChartOptions,
} from 'chart.js'
import { Doughnut } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend)

interface PieDataItem {
  label: string
  value: number
  color: string
}

interface PieChartProps {
  data: PieDataItem[]
  height?: number
}

export default function PieChart({ data, height = 260 }: PieChartProps) {
  const total = useMemo(
    () => data.reduce((sum, item) => sum + item.value, 0),
    [data]
  )

  const chartData = useMemo(
    () => ({
      labels: data.map((item) => item.label),
      datasets: [
        {
          data: data.map((item) => item.value),
          backgroundColor: data.map((item) => item.color),
          borderColor: '#fff',
          borderWidth: 3,
          hoverOffset: 8,
          spacing: 2,
        },
      ],
    }),
    [data]
  )

  const options = useMemo<ChartOptions<'doughnut'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '62%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: '#4E5969',
            font: { size: 12 },
            padding: 16,
            usePointStyle: true,
            pointStyle: 'circle',
            generateLabels: (chart) => {
              const datasets = chart.data.datasets
              return chart.data.labels?.map((label, i) => {
                const value = datasets[0].data[i] as number
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
                return {
                  text: `${label}  ${percentage}%`,
                  fillStyle: datasets[0].backgroundColor?.[i] as string,
                  strokeStyle: '#fff',
                  lineWidth: 2,
                  hidden: false,
                  index: i,
                  pointStyle: 'circle',
                }
              }) || []
            },
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
            label: (ctx) => {
              const value = ctx.parsed
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0'
              return ` ${ctx.label}: ${value} (${percentage}%)`
            },
          },
        },
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 900,
        easing: 'easeOutQuart',
      },
    }),
    [total]
  )

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  )
}
