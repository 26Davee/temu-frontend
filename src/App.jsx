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
    const totalMonto = nuevoPedido.articulos.reduce(
      (acc, a) => acc + a.cantidad * a.precioUnit,
      0
    );
    const familiar = `${nuevoPedido.nombre} ${nuevoPedido.apellido}`;
    const body = {
      familiar,
      totalMonto,
      fecha: nuevoPedido.fecha,
      codigo: nuevoPedido.codigo,
      comentarios: nuevoPedido.comentarios,
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
    <div style={{ maxWidth: '720px', margin: 'auto', padding: '1rem', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1 style={{ fontSize: '2.2rem', marginBottom: '1.5rem', textAlign: 'center', color: '#1a1a1a' }}>📦 Gestión de Pedidos Temu</h1>

      <div style={{ marginBottom: '2rem', border: '1px solid #ccc', borderRadius: '10px', padding: '1.5rem', backgroundColor: '#f9f9f9' }}>
        <h2 style={{ marginBottom: '1rem' }}>📝 Información del Pedido</h2>

        <label>Nombre</label>
        <input name="nombre" placeholder="Ej. Juan" value={nuevoPedido.nombre} onChange={handleChange} style={inputStyle} />

        <label>Apellido</label>
        <input name="apellido" placeholder="Ej. Pérez" value={nuevoPedido.apellido} onChange={handleChange} style={inputStyle} />

        <label>Código de pedido (opcional)</label>
        <input name="codigo" placeholder="Ej. PED1234" value={nuevoPedido.codigo} onChange={handleChange} style={inputStyle} />

        <label>Fecha del pedido</label>
        <input name="fecha" type="date" value={nuevoPedido.fecha} onChange={handleChange} style={inputStyle} />

        <label>Comentarios adicionales</label>
        <textarea name="comentarios" placeholder="Observaciones, preferencias, etc." value={nuevoPedido.comentarios} onChange={handleChange} style={textAreaStyle} />

        <h3 style={{ marginTop: '2rem' }}>📦 Artículos del pedido</h3>
        {nuevoPedido.articulos.map((art, i) => (
          <div key={i} style={{ marginBottom: '1rem', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <input placeholder="Artículo" value={art.nombre} onChange={(e) => handleArticuloChange(i, 'nombre', e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: '150px' }} />
            <input type="number" placeholder="Cantidad" value={art.cantidad} onChange={(e) => handleArticuloChange(i, 'cantidad', e.target.value)} style={{ ...inputStyle, width: '100px' }} />
            <input type="number" placeholder="Precio" value={art.precioUnit} onChange={(e) => handleArticuloChange(i, 'precioUnit', e.target.value)} style={{ ...inputStyle, width: '100px' }} />
          </div>
        ))}

        <button onClick={agregarArticulo} style={secondaryButton}>+ Agregar artículo</button>
        <br /><br />
        <button onClick={enviarPedido} style={mainButton}>✅ Enviar Pedido</button>
      </div>

      <h2 style={{ marginTop: '2rem' }}>📚 Lista de Pedidos</h2>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '1.5rem' }}>
        <input type="text" placeholder="Buscar por nombre" value={filtro.texto} onChange={e => setFiltro({ ...filtro, texto: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
        <select value={filtro.estado} onChange={e => setFiltro({ ...filtro, estado: e.target.value })} style={{ ...inputStyle, flex: 1 }}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => (
            <option key={e.label} value={e.label}>{e.icon} {e.label}</option>
          ))}
        </select>
        <input type="date" value={filtro.fecha} onChange={e => setFiltro({ ...filtro, fecha: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
        <button onClick={() => setFiltro({ estado: '', texto: '', fecha: '' })} style={secondaryButton}>🔄 Limpiar filtros</button>
      </div>

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {pedidosFiltrados.map((pedido) => (
          <li key={pedido.id} style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><strong>{pedido.familiar}</strong> — {pedido.estado} — ${pedido.totalMonto}</span>
              <div>
                <button onClick={() => setPedidos(pedidos.map(p => p.id === pedido.id ? { ...p, mostrar: !p.mostrar } : p))}>👁 Ver</button>
                <button onClick={() => eliminarPedido(pedido.id)} style={{ marginLeft: '5px', backgroundColor: '#dc3545', color: '#fff', border: 'none', borderRadius: '5px', padding: '5px 10px', cursor: 'pointer' }}>🗑 Eliminar</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              {ESTADOS.map((estado) => (
                <button key={estado.label} onClick={() => actualizarEstado(pedido.id, estado.label)} disabled={pedido.estado === estado.label} style={{ padding: '5px 10px', fontSize: '0.75rem', borderRadius: '6px', backgroundColor: pedido.estado === estado.label ? '#1a73e8' : '#e0e0e0', color: pedido.estado === estado.label ? '#fff' : '#333', border: 'none', cursor: pedido.estado === estado.label ? 'default' : 'pointer' }}>
                  {estado.icon} {estado.label}
                </button>
              ))}
            </div>

            {pedido.mostrar && (
              <div style={{ marginTop: '0.5rem', marginLeft: '1rem', backgroundColor: '#f1f1f1', padding: '0.8rem', borderRadius: '6px', fontSize: '0.95rem' }}>
                <p><strong>Comentarios:</strong> {pedido.comentarios || 'Ninguno'}</p>
                <p><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString() || 'Desconocida'}</p>
                <p><strong>Total original:</strong> ${pedido.totalMonto}</p>
                <p><strong>Artículos:</strong></p>
                <ul style={{ marginLeft: '1rem' }}>
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

const inputStyle = {
  width: '100%',
  padding: '8px',
  borderRadius: '6px',
  border: '1px solid #ccc'
};

const textAreaStyle = {
  ...inputStyle,
  height: '80px',
  resize: 'vertical'
};

const mainButton = {
  padding: '10px 20px',
  borderRadius: '8px',
  border: 'none',
  backgroundColor: '#1a73e8',
  color: '#fff',
  fontWeight: 'bold',
  cursor: 'pointer'
};

const secondaryButton = {
  padding: '6px 12px',
  borderRadius: '6px',
  border: '1px solid #aaa',
  backgroundColor: '#eee',
  cursor: 'pointer'
};

export default App;
