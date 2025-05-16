import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384'];

const Estadisticas = () => {
  const [data, setData] = useState(null);
  const [vista, setVista] = useState('mes');
  const [nombre, setNombre] = useState('');

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

  const datosPersona = Object.entries(data.porPersona || {}).map(([persona, monto]) => ({
    persona,
    monto
  }));

  const resultadoPersona = nombre.trim()
    ? datosPersona.find(p => p.persona.toLowerCase().includes(nombre.toLowerCase()))
    : null;

  return (
    <div className="estadisticas">
      <h2>📊 Estadísticas de Pedidos</h2>

      <div className="form-group">
        <label>Selecciona vista:</label>
        <select value={vista} onChange={(e) => setVista(e.target.value)}>
          <option value="mes">📅 Por Mes</option>
          <option value="estado">📦 Por Estado</option>
          <option value="persona">👤 Por Persona</option>
        </select>
      </div>

      {vista === 'mes' && (
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
      )}

      {vista === 'estado' && (
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
      )}

      {vista === 'persona' && (
        <div className="grafico">
          <h3>👤 Total por Persona</h3>
          <input
            type="text"
            placeholder="Escribe el nombre..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '8px', marginBottom: '1rem' }}
          />
          {resultadoPersona ? (
            <p><strong>{resultadoPersona.persona}</strong> ha pedido un total de <strong>${resultadoPersona.monto.toFixed(2)}</strong></p>
          ) : (
            nombre && <p>❌ No se encontró ninguna coincidencia.</p>
          )}
        </div>
      )}

      <div className="estadistica-card">
        <h3>💰 Total entregado:</h3>
        <p><strong>${data.montoEntregado.toFixed(2)}</strong></p>
      </div>
    </div>
  );
};

export default Estadisticas;
