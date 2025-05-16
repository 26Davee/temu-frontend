import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384'];

const Estadisticas = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('https://temu-pedidos-production.up.railway.app/estadisticas')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error('Error al cargar estadísticas', err));
  }, []);

  if (!data) return <p>Cargando estadísticas...</p>;

  const datosBarra = Object.entries(data.totalPorMes).map(([mes, total]) => ({
    mes,
    total
  }));

  const datosTorta = Object.entries(data.porEstado).map(([estado, valor], i) => ({
    name: estado,
    value: valor,
    color: COLORS[i % COLORS.length]
  }));

  return (
    <div className="estadisticas">
      <h2>📊 Estadísticas de Pedidos</h2>

      <div className="estadistica-card">
        <h3>💰 Total entregado:</h3>
        <p><strong>${data.montoEntregado.toFixed(2)}</strong></p>
      </div>

      <div className="grafico">
        <h3>📅 Pedidos por Mes</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={datosBarra}>
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grafico">
        <h3>📦 Pedidos por Estado</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={datosTorta}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {datosTorta.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Estadisticas;
