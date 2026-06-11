import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type ChartOptions,
  type ChartDataset,
  type ScriptableContext,
  type Color,
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
)

interface LineDataset {
  label: string
  data: number[]
  color: string
}

interface LineChartProps {
  labels: string[]
  datasets: LineDataset[]
  height?: number
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default function LineChart({ labels, datasets, height = 260 }: LineChartProps) {
  const chartData = useMemo(
    () => ({
      labels,
      datasets: datasets.map((ds) => {
        const backgroundColorFn = (context: ScriptableContext<'line'>): Color => {
          const { ctx, chartArea } = context.chart
          if (!chartArea) return hexToRgba(ds.color, 0.15)
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
          gradient.addColorStop(0, hexToRgba(ds.color, 0.35))
          gradient.addColorStop(1, hexToRgba(ds.color, 0.02))
          return gradient
        }
        return {
          label: ds.label,
          data: ds.data,
          borderColor: ds.color,
          backgroundColor: backgroundColorFn,
          borderWidth: 2.5,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: ds.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: ds.color,
          pointHoverBorderWidth: 2,
        } as ChartDataset<'line', number[]>
      }),
    }),
    [labels, datasets]
  )

  const options = useMemo<ChartOptions<'line'>>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
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
          boxPadding: 4,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: '#86909C',
            font: { size: 11 },
            maxRotation: 0,
            autoSkipPadding: 20,
          },
          border: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(198, 205, 217, 0.3)',
          },
          ticks: {
            color: '#86909C',
            font: { size: 11 },
            padding: 8,
          },
          border: {
            display: false,
          },
        },
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
    }),
    []
  )

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}
