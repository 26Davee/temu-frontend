import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384'];

const Estadisticas = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/estadisticas')
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
        <BarChart width={350} height={250} data={datosBarra}>
          <XAxis dataKey="mes" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="total" fill="#0088FE" />
        </BarChart>
      </div>

      <div className="grafico">
        <h3>📦 Pedidos por Estado</h3>
        <PieChart width={300} height={250}>
          <Pie
            data={datosTorta}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {datosTorta.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </div>
    </div>
  );
};

export default Estadisticas;
