import type { ChartOptions } from 'chart.js';

/**
 * Configuración para gráficos de tipo Doughnut (Dona/Torta)
 * Usado para distribución por método de pago
 */
export const pieChartOptions: ChartOptions<'doughnut'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right',
      labels: {
        font: {
          size: 12,
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        padding: 15,
        usePointStyle: true,
        pointStyle: 'circle',
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      padding: 12,
      bodyFont: {
        size: 13,
      },
      titleFont: {
        size: 14,
        weight: 'bold',
      },
      callbacks: {
        label: (context) => {
          const label = context.label || '';
          const value = context.parsed || 0;
          const dataset = context.dataset;
          const total = (dataset.data as number[]).reduce((acc: number, val: number) => acc + val, 0);
          const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';

          return `${label}: $${value.toLocaleString('es-AR')} (${percentage}%)`;
        },
      },
    },
  },
  cutout: '60%', // Convierte en dona en lugar de torta completa
};

/**
 * Configuración para gráficos de barras agrupadas
 * Usado para comparación de Ingresos vs Egresos por método de pago
 */
export const barChartOptions: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 13,
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        padding: 15,
        usePointStyle: true,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: $${value.toLocaleString('es-AR')}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 11,
        },
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
        },
        callback: function (value) {
          if (typeof value === 'number') {
            return '$' + value.toLocaleString('es-AR');
          }
          return value;
        },
      },
    },
  },
};

/**
 * Configuración para gráficos de líneas temporales
 * Usado para evolución del flujo de caja en el tiempo
 */
export const lineChartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  plugins: {
    legend: {
      position: 'top',
      labels: {
        font: {
          size: 13,
          family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
        },
        padding: 15,
        usePointStyle: true,
      },
    },
    tooltip: {
      enabled: true,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderWidth: 1,
      padding: 12,
      callbacks: {
        title: (tooltipItems) => {
          // Mostrar la fecha formateada
          return tooltipItems[0].label;
        },
        label: (context) => {
          const label = context.dataset.label || '';
          const value = context.parsed.y;
          return `${label}: $${value.toLocaleString('es-AR')}`;
        },
      },
    },
  },
  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        font: {
          size: 10,
        },
        maxRotation: 45,
        minRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: {
          size: 11,
        },
        callback: function (value) {
          if (typeof value === 'number') {
            return '$' + value.toLocaleString('es-AR');
          }
          return value;
        },
      },
    },
  },
  elements: {
    line: {
      tension: 0.4, // Suavizado de líneas
    },
    point: {
      radius: 3,
      hitRadius: 10,
      hoverRadius: 5,
    },
  },
};

/**
 * Colores predefinidos para datasets de Chart.js
 */
export const chartColors = {
  // Colores para métodos de pago
  efectivo: '#4CAF50',
  transferencia: '#2196F3',
  cheque: '#FF9800',
  tarjetaCredito: '#9C27B0',
  tarjetaDebito: '#00BCD4',
  financiacion: '#FFC107',
  otro: '#9E9E9E',

  // Colores para ingresos/egresos
  ingresos: '#4CAF50',
  egresos: '#F44336',
  flujoNeto: '#2196F3',

  // Colores secundarios (con transparencia para áreas)
  ingresosAlpha: 'rgba(76, 175, 80, 0.2)',
  egresosAlpha: 'rgba(244, 67, 54, 0.2)',
  flujoNetoAlpha: 'rgba(33, 150, 243, 0.2)',
};

/**
 * Configuración común para todos los gráficos
 */
export const commonChartOptions = {
  font: {
    family: "'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  animation: {
    duration: 750,
    easing: 'easeInOutQuart' as const,
  },
};
