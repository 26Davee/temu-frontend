import { useEffect, useState } from 'react';
import './App.css';
import Estadisticas from './Estadisticas';

function App() {
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState({ estado: '', texto: '', fecha: '' });
  const [nuevoPedido, setNuevoPedido] = useState({
    nombre: '',
    apellido: '',
    codigo: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'PENDIENTE',
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
      .then(data => {
        if (Array.isArray(data)) {
          setPedidos(data);
        } else {
          console.warn("La respuesta de /pedidos no es un arreglo:", data);
          setPedidos([]);
        }
      })
      .catch(err => {
        console.error('Error al cargar pedidos', err);
        setPedidos([]);
      });
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

    console.log("📦 Enviando pedido:", body);

    try {
      const respuesta = await fetch('https://temu-pedidos-production.up.railway.app/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!respuesta.ok) {
        const error = await respuesta.json();
        console.error("❌ Error desde el servidor:", error);
        throw new Error(error.detalle || error.error || 'Error inesperado al enviar el pedido');
      }

      const data = await respuesta.json();
      alert("✅ Pedido enviado con éxito");
      console.log("🎉 Respuesta del servidor:", data);

      setPedidos((prevPedidos) => [data, ...(Array.isArray(prevPedidos) ? prevPedidos : [])]);

      setNuevoPedido({
        nombre: '',
        apellido: '',
        codigo: data.codigo || '',
        fecha: new Date().toISOString().split('T')[0],
        estado: 'PENDIENTE',
        comentarios: '',
        articulos: [{ nombre: '', cantidad: 1, precioUnit: 0 }]
      });

    } catch (error) {
      console.error("🚨 Error en envío:", error);
      alert("Error al enviar pedido: " + error.message);
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

  const pedidosFiltrados = Array.isArray(pedidos)
    ? pedidos.filter(p => {
        const coincideEstado = filtro.estado ? p.estado === filtro.estado : true;
        const coincideTexto = filtro.texto ? p.familiar.toLowerCase().includes(filtro.texto.toLowerCase()) : true;
        const coincideFecha = filtro.fecha ? p.fecha.startsWith(filtro.fecha) : true;
        return coincideEstado && coincideTexto && coincideFecha;
      })
    : [];

  return (
    <main className="container">
      <header className="section header-section">
        <h1 className="title">📦 Gestión de Pedidos Temu</h1>
      </header>

      <section className="section form-section">
        <h2 className="subtitle">📝 Nuevo Pedido</h2>
        <div className="form-grid">
          <div className="form-group">
            <label>Nombre</label>
            <input name="nombre" value={nuevoPedido.nombre} onChange={handleChange} placeholder="David" />
          </div>

          <div className="form-group">
            <label>Apellido</label>
            <input name="apellido" value={nuevoPedido.apellido} onChange={handleChange} placeholder="Espinoza" />
          </div>

          <div className="form-group">
            <label>Código</label>
            <input name="codigo" value={nuevoPedido.codigo} readOnly placeholder="Generado automáticamente" />
          </div>


          <div className="form-group">
            <label>Fecha</label>
            <input type="date" name="fecha" value={nuevoPedido.fecha} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Estado</label>
            <select name="estado" value={nuevoPedido.estado} onChange={handleChange}>
              {ESTADOS.map((e) => (
                <option key={e.label} value={e.label}>
                  {e.icon} {e.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Comentarios</label>
            <textarea name="comentarios" value={nuevoPedido.comentarios} onChange={handleChange} placeholder="Observaciones o detalles" />
          </div>
        </div>

        <h3>📦 Artículos</h3>
        {nuevoPedido.articulos.map((art, i) => (
          <div key={i} className="articulo-row">
            <input placeholder="Artículo" value={art.nombre} onChange={(e) => handleArticuloChange(i, 'nombre', e.target.value)} />
            <input type="number" placeholder="Cantidad" value={art.cantidad} onChange={(e) => handleArticuloChange(i, 'cantidad', e.target.value)} />
            <input type="number" placeholder="Precio" value={art.precioUnit} onChange={(e) => handleArticuloChange(i, 'precioUnit', e.target.value)} />
          </div>
        ))}
        <button onClick={agregarArticulo} className="btn-secondary">+ Agregar artículo</button>
        <button onClick={enviarPedido} className="btn-primary">✅ Enviar Pedido</button>
      </section>

      <section className="section">
        <h2 className="subtitle">📚 Lista de Pedidos</h2>
        <div className="filter-bar">
          <input type="text" placeholder="Buscar por nombre" value={filtro.texto} onChange={e => setFiltro({ ...filtro, texto: e.target.value })} />
          <select value={filtro.estado} onChange={e => setFiltro({ ...filtro, estado: e.target.value })}>
            <option value="">Todos</option>
            {ESTADOS.map(e => (
              <option key={e.label} value={e.label}>{e.icon} {e.label}</option>
            ))}
          </select>
          <input type="date" value={filtro.fecha} onChange={e => setFiltro({ ...filtro, fecha: e.target.value })} />
          <button onClick={() => setFiltro({ estado: '', texto: '', fecha: '' })} className="btn-secondary">🔄 Limpiar filtros</button>
        </div>

        <ul className="pedido-list">
          {pedidosFiltrados.map(pedido => (
            <li key={pedido.id} className="pedido-item">
              <div className="pedido-header">
                <span><strong>{pedido.familiar}</strong> — {pedido.estado} — ${pedido.totalMonto}</span>
                <div>
                  <button onClick={() => setPedidos(pedidos.map(p => p.id === pedido.id ? { ...p, mostrar: !p.mostrar } : p))}>👁 Ver</button>
                  <button onClick={() => eliminarPedido(pedido.id)} className="btn-delete">🗑 Eliminar</button>
                </div>
              </div>
              <div className="estado-buttons">
                {ESTADOS.map((estado) => (
                  <button key={estado.label} onClick={() => actualizarEstado(pedido.id, estado.label)} disabled={pedido.estado === estado.label} className={pedido.estado === estado.label ? 'btn-selected' : ''}>
                    {estado.icon} {estado.label}
                  </button>
                ))}
              </div>
              {pedido.mostrar && (
                <div className="pedido-detalles">
                  <p><strong>Comentarios:</strong> {pedido.comentarios || 'Ninguno'}</p>
                  <p><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString()}</p>
                  <p><strong>Total:</strong> ${pedido.totalMonto}</p>
                  <ul>
                    {pedido.articulos.map((art, i) => (
                      <li key={i}>🛒 {art.nombre} — {art.cantidad} × ${art.precioUnit}</li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="section">
        <button className="btn-secondary" onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}>
          📈 {mostrarEstadisticas ? 'Ocultar estadísticas' : 'Ver estadísticas'}
        </button>
        {mostrarEstadisticas && <Estadisticas />}
      </section>
    </main>
  );
}

export default App;
