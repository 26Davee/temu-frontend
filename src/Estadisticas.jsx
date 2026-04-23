import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed'];

const Estadisticas = ({ API_URL }) => {
  const [data, setData] = useState(null);
  const [vista, setVista] = useState('mes');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/estadisticas`)
      .then((res) => res.json())
      .then((response) => {
        setData(response);
        setError('');
      })
      .catch(() => setError('No se pudieron cargar las estadisticas.'));
  }, [API_URL]);

  const datosBarra = useMemo(() => Object.entries(data?.totalPorMes || {}).map(([mes, total]) => ({
    mes,
    total
  })), [data]);

  const datosTorta = useMemo(() => Object.entries(data?.porEstado || {}).map(([estado, valor], index) => ({
    name: estado,
    value: valor,
    color: COLORS[index % COLORS.length]
  })), [data]);

  const datosPersona = useMemo(() => Object.entries(data?.porPersona || {}).map(([persona, monto]) => ({
    persona,
    monto
  })), [data]);

  const resultadoPersona = nombre.trim()
    ? datosPersona.find((persona) => persona.persona.toLowerCase().includes(nombre.toLowerCase()))
    : null;

  if (error) return <p className="alert">{error}</p>;
  if (!data) return <p className="muted">Cargando estadisticas...</p>;

  return (
    <div className="estadisticas">
      <div className="form-group">
        <label>Vista</label>
        <select value={vista} onChange={(event) => setVista(event.target.value)}>
          <option value="mes">Por mes</option>
          <option value="estado">Por estado</option>
          <option value="persona">Por persona</option>
        </select>
      </div>

      {vista === 'mes' && (
        <div className="grafico">
          <h3>Pedidos por mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={datosBarra}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {vista === 'estado' && (
        <div className="grafico">
          <h3>Pedidos por estado</h3>
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
                {datosTorta.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
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
          <h3>Total por persona</h3>
          <input
            type="text"
            placeholder="Buscar cliente"
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
          />
          {resultadoPersona ? (
            <p>
              <strong>{resultadoPersona.persona}</strong> registra un total de{' '}
              <strong>${Number(resultadoPersona.monto).toFixed(2)}</strong>.
            </p>
          ) : (
            nombre && <p className="muted">No se encontraron coincidencias.</p>
          )}
        </div>
      )}

      <div className="estadistica-card">
        <span>Total entregado</span>
        <strong>${Number(data.montoEntregado || 0).toFixed(2)}</strong>
      </div>
    </div>
  );
};

export default Estadisticas;
