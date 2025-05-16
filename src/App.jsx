import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState({ estado: '', texto: '', fecha: '' });
  const [nuevoPedido, setNuevoPedido] = useState({
    nombre: '',
    apellido: '',
    codigo: '',
    fecha: new Date().toISOString().split('T')[0],
    comentarios: '',
    estado: 'PENDIENTE',
    articulos: [{ nombre: '', cantidad: 1, precioUnit: 0 }]
  });

  const ESTADOS = [
    { label: 'PENDIENTE', icon: '🕐' },
    { label: 'SALIDO', icon: '🛫' },
    { label: 'ADUANA', icon: '📦' },
    { label: 'RUTA', icon: '🚚' },
    { label: 'ENTREGADO', icon: '✅' }
  ];

  useEffect(() => {
    fetch('https://temu-pedidos-production.up.railway.app/pedidos')
      .then(res => res.json())
      .then(data => setPedidos(data))
      .catch(err => console.error('Error al cargar pedidos', err));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido({ ...nuevoPedido, [name]: value });
  };

  const handleArticuloChange = (index, field, value) => {
    const updated = [...nuevoPedido.articulos];
    updated[index][field] = field === 'cantidad' || field === 'precioUnit' ? parseFloat(value) : value;
    setNuevoPedido({ ...nuevoPedido, articulos: updated });
  };

  const agregarArticulo = () => {
    setNuevoPedido({
      ...nuevoPedido,
      articulos: [...nuevoPedido.articulos, { nombre: '', cantidad: 1, precioUnit: 0 }]
    });
  };

  const enviarPedido = async () => {
    const totalMonto = nuevoPedido.articulos.reduce((acc, a) => acc + a.cantidad * a.precioUnit, 0);
    const familiar = `${nuevoPedido.nombre} ${nuevoPedido.apellido}`;
    const body = {
      familiar,
      totalMonto,
      fecha: nuevoPedido.fecha,
      codigo: nuevoPedido.codigo,
      comentarios: nuevoPedido.comentarios,
      estado: nuevoPedido.estado,
      articulos: nuevoPedido.articulos
    };

    try {
      const res = await fetch('https://temu-pedidos-production.up.railway.app/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setPedidos([data, ...pedidos]);
      setNuevoPedido({
        nombre: '',
        apellido: '',
        codigo: '',
        fecha: new Date().toISOString().split('T')[0],
        comentarios: '',
        estado: 'PENDIENTE',
        articulos: [{ nombre: '', cantidad: 1, precioUnit: 0 }]
      });
    } catch (error) {
      alert('Error al enviar pedido');
    }
  };

  const actualizarEstado = async (id, estadoNuevo) => {
    try {
      await fetch(`https://temu-pedidos-production.up.railway.app/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoNuevo })
      });
      setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: estadoNuevo } : p));
    } catch (error) {
      alert('Error al cambiar estado');
    }
  };

  const eliminarPedido = async (id) => {
    const confirmar = window.confirm('¿Seguro que deseas eliminar este pedido?');
    if (!confirmar) return;

    try {
      await fetch(`https://temu-pedidos-production.up.railway.app/pedidos/${id}`, {
        method: 'DELETE'
      });
      setPedidos(pedidos.filter(p => p.id !== id));
    } catch (error) {
      alert('Error al eliminar el pedido');
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const coincideEstado = filtro.estado ? p.estado === filtro.estado : true;
    const coincideTexto = filtro.texto ? p.familiar.toLowerCase().includes(filtro.texto.toLowerCase()) : true;
    const coincideFecha = filtro.fecha ? p.fecha.startsWith(filtro.fecha) : true;
    return coincideEstado && coincideTexto && coincideFecha;
  });

  return (
    <div className="app-container">
      <h1 className="app-title">📦 Gestión de Pedidos Temu</h1>

      <div className="form-container">
        <h2>📝 Información del Pedido</h2>

        <label>Nombre</label>
        <input name="nombre" placeholder="Ej. David" value={nuevoPedido.nombre} onChange={handleChange} className="input" />

        <label>Apellido</label>
        <input name="apellido" placeholder="Ej. Espinoza" value={nuevoPedido.apellido} onChange={handleChange} className="input" />

        <label>Código de pedido (opcional)</label>
        <input name="codigo" placeholder="Dx000000007" value={nuevoPedido.codigo} onChange={handleChange} className="input" />

        <label>Fecha del pedido</label>
        <input name="fecha" type="date" value={nuevoPedido.fecha} onChange={handleChange} className="input" />

        <label>Comentarios adicionales</label>
        <textarea name="comentarios" placeholder="Observaciones, preferencias, etc." value={nuevoPedido.comentarios} onChange={handleChange} className="textarea" />

        <label>Estado inicial</label>
        <select name="estado" value={nuevoPedido.estado} onChange={handleChange} className="input">
          {ESTADOS.map(e => (
            <option key={e.label} value={e.label}>{e.icon} {e.label}</option>
          ))}
        </select>

        <h3>📦 Artículos del pedido</h3>
        {nuevoPedido.articulos.map((art, i) => (
          <div key={i} className="articulo-row">
            <input placeholder="Artículo" value={art.nombre} onChange={(e) => handleArticuloChange(i, 'nombre', e.target.value)} className="input flex" />
            <input type="number" placeholder="Cantidad" value={art.cantidad} onChange={(e) => handleArticuloChange(i, 'cantidad', e.target.value)} className="input small" />
            <input type="number" placeholder="Precio" value={art.precioUnit} onChange={(e) => handleArticuloChange(i, 'precioUnit', e.target.value)} className="input small" />
          </div>
        ))}

        <button onClick={agregarArticulo} className="secondary-button">+ Agregar artículo</button>
        <br /><br />
        <button onClick={enviarPedido} className="main-button">✅ Enviar Pedido</button>
      </div>

      <h2 className="lista-titulo">📚 Lista de Pedidos</h2>

      <div className="filtros">
        <input type="text" placeholder="Buscar por nombre" value={filtro.texto} onChange={e => setFiltro({ ...filtro, texto: e.target.value })} className="input flex" />
        <select value={filtro.estado} onChange={e => setFiltro({ ...filtro, estado: e.target.value })} className="input flex">
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => (
            <option key={e.label} value={e.label}>{e.icon} {e.label}</option>
          ))}
        </select>
        <input type="date" value={filtro.fecha} onChange={e => setFiltro({ ...filtro, fecha: e.target.value })} className="input flex" />
        <button onClick={() => setFiltro({ estado: '', texto: '', fecha: '' })} className="secondary-button">🔄 Limpiar filtros</button>
      </div>

      <ul className="lista-pedidos">
        {pedidosFiltrados.map((pedido) => (
          <li key={pedido.id} className="pedido-item">
            <div className="pedido-header">
              <span><strong>{pedido.familiar}</strong> — {pedido.estado} — ${pedido.totalMonto}</span>
              <div>
                <button onClick={() => setPedidos(pedidos.map(p => p.id === pedido.id ? { ...p, mostrar: !p.mostrar } : p))}>👁 Ver</button>
                <button onClick={() => eliminarPedido(pedido.id)} className="btn-eliminar">🗑 Eliminar</button>
              </div>
            </div>

            <div className="estado-botones">
              {ESTADOS.map((estado) => (
                <button key={estado.label} onClick={() => actualizarEstado(pedido.id, estado.label)} disabled={pedido.estado === estado.label} className={pedido.estado === estado.label ? 'estado-activo' : 'estado-normal'}>
                  {estado.icon} {estado.label}
                </button>
              ))}
            </div>

            {pedido.mostrar && (
              <div className="pedido-detalle">
                <p><strong>Comentarios:</strong> {pedido.comentarios || 'Ninguno'}</p>
                <p><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString() || 'Desconocida'}</p>
                <p><strong>Total original:</strong> ${pedido.totalMonto}</p>
                <p><strong>Artículos:</strong></p>
                <ul>
                  {pedido.articulos?.map((art, i) => (
                    <li key={i}>🛒 {art.nombre} — {art.cantidad} × ${art.precioUnit}</li>
                  ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
