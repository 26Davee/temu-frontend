import { useEffect, useState } from 'react';
import './App.css';
import Estadisticas from './Estadisticas';

function App() {
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [clientesFrecuentes, setClientesFrecuentes] = useState([]);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [filtro, setFiltro] = useState({ estado: '', texto: '', fecha: '', codigo: '' });
  const [nuevoPedido, setNuevoPedido] = useState({
    nombre: '',
    apellido: '',
    codigo: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'PENDIENTE',
    comentarios: '',
    articulos: [{ nombre: '', cantidad: 1, precioUnit: 0 }]
  });
  const [imagenes, setImagenes] = useState([]);

  const ESTADOS = [
    { label: 'PENDIENTE', icon: '🕐' },
    { label: 'SALIDO', icon: '🛫' },
    { label: 'ADUANA', icon: '📦' },
    { label: 'RUTA', icon: '🚚' },
    { label: 'ENTREGADO', icon: '✅' }
  ];

  useEffect(() => {
    fetch('http://localhost:3000/pedidos')
      .then(res => res.json())
      .then(data => Array.isArray(data) ? setPedidos(data) : setPedidos([]))
      .catch(() => setPedidos([]));

    const guardados = localStorage.getItem('clientesFrecuentes');
    if (guardados) setClientesFrecuentes(JSON.parse(guardados));
  }, []);

  const guardarClienteFrecuente = (nombre, apellido) => {
    const cliente = `${nombre.trim()} ${apellido.trim()}`;
    if (!clientesFrecuentes.includes(cliente)) {
      const actualizados = [...clientesFrecuentes, cliente];
      setClientesFrecuentes(actualizados);
      localStorage.setItem('clientesFrecuentes', JSON.stringify(actualizados));
    }
  };

  const eliminarClienteFrecuente = (cliente) => {
    const actualizados = clientesFrecuentes.filter(c => c !== cliente);
    setClientesFrecuentes(actualizados);
    localStorage.setItem('clientesFrecuentes', JSON.stringify(actualizados));
  };

  const seleccionarCliente = (cliente) => {
    const [nombre, ...apellidoArr] = cliente.split(' ');
    setNuevoPedido({ ...nuevoPedido, nombre, apellido: apellidoArr.join(' ') });
  };

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

    const formData = new FormData();
    formData.append('familiar', familiar);
    formData.append('totalMonto', totalMonto);
    formData.append('fecha', nuevoPedido.fecha);
    formData.append('comentarios', nuevoPedido.comentarios);
    formData.append('estado', nuevoPedido.estado);
    formData.append('articulos', JSON.stringify(nuevoPedido.articulos));
    imagenes.forEach((img) => formData.append('imagenes', img));

    try {
      const res = await fetch('http://localhost:3000/pedidos-con-foto', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error');
      alert("✅ Pedido enviado con éxito");
      guardarClienteFrecuente(nuevoPedido.nombre, nuevoPedido.apellido);
      setPedidos([data, ...pedidos]);
      setNuevoPedido({
        nombre: '', apellido: '', codigo: data.codigo || '', fecha: new Date().toISOString().split('T')[0],
        estado: 'PENDIENTE', comentarios: '', articulos: [{ nombre: '', cantidad: 1, precioUnit: 0 }]
      });
      setImagenes([]);
    } catch (error) {
      alert('Error: ' + error.message);
    }
  };

  const actualizarEstado = async (id, estadoNuevo) => {
    try {
      await fetch(`http://localhost:3000/pedidos/${id}/estado`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoNuevo })
      });
      setPedidos(pedidos.map(p => p.id === id ? { ...p, estado: estadoNuevo } : p));
    } catch {
      alert('Error al cambiar estado');
    }
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este pedido?')) return;
    try {
      await fetch(`http://localhost:3000/pedidos/${id}`, { method: 'DELETE' });
      setPedidos(pedidos.filter(p => p.id !== id));
    } catch {
      alert('Error al eliminar el pedido');
    }
  };

  const pedidosFiltrados = pedidos.filter(p => {
    const c1 = filtro.estado ? p.estado === filtro.estado : true;
    const c2 = filtro.texto ? p.familiar.toLowerCase().includes(filtro.texto.toLowerCase()) : true;
    const c3 = filtro.fecha ? p.fecha.startsWith(filtro.fecha) : true;
    const c4 = filtro.codigo ? p.codigo?.toLowerCase().includes(filtro.codigo.toLowerCase()) : true;
    return c1 && c2 && c3 && c4;
  });

  return (
    <main className="container">
      <header className="section header-section">
        <h1 className="title">📦 Gestión de Pedidos Temu</h1>
      </header>

      <section className="section form-section">
        <h2 className="subtitle">📝 Nuevo Pedido</h2>

        {clientesFrecuentes.length > 0 && (
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Clientes frecuentes:</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {clientesFrecuentes.map(cliente => (
                <div key={cliente} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <button className="btn-secondary" onClick={() => seleccionarCliente(cliente)}>{cliente}</button>
                  <button className="btn-delete" onClick={() => eliminarClienteFrecuente(cliente)}>✖</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label>Nombre</label>
            <input name="nombre" value={nuevoPedido.nombre} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input name="apellido" value={nuevoPedido.apellido} onChange={handleChange} />
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
              {ESTADOS.map(e => <option key={e.label} value={e.label}>{e.icon} {e.label}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Comentarios</label>
            <textarea name="comentarios" value={nuevoPedido.comentarios} onChange={handleChange} />
          </div>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label>📎 Adjuntar foto del pedido (opcional)</label>
          <input type="file" multiple accept="image/*" onChange={e => setImagenes([...e.target.files])} />
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
          <input type="text" placeholder="Buscar por código" value={filtro.codigo} onChange={e => setFiltro({ ...filtro, codigo: e.target.value })} />
          <select value={filtro.estado} onChange={e => setFiltro({ ...filtro, estado: e.target.value })}>
            <option value="">Todos</option>
            {ESTADOS.map(e => <option key={e.label} value={e.label}>{e.icon} {e.label}</option>)}
          </select>
          <input type="date" value={filtro.fecha} onChange={e => setFiltro({ ...filtro, fecha: e.target.value })} />
          <button onClick={() => setFiltro({ estado: '', texto: '', fecha: '', codigo: '' })} className="btn-secondary">🔄 Limpiar filtros</button>
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
                {ESTADOS.map(estado => (
                  <button key={estado.label} onClick={() => actualizarEstado(pedido.id, estado.label)} disabled={pedido.estado === estado.label} className={pedido.estado === estado.label ? 'btn-selected' : ''}>
                    {estado.icon} {estado.label}
                  </button>
                ))}
              </div>
              {pedido.mostrar && (
                <div className="pedido-detalles">
                  <p><strong>Código:</strong> {pedido.codigo}</p>
                  <p><strong>Comentarios:</strong> {pedido.comentarios || 'Ninguno'}</p>
                  <p><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString()}</p>
                  <p><strong>Total:</strong> ${pedido.totalMonto}</p>
                  <ul>
                    {pedido.articulos.map((art, i) => (
                      <li key={i}>🛒 {art.nombre} — {art.cantidad} × ${art.precioUnit}</li>
                    ))}
                  </ul>
                  {pedido.imagenes && pedido.imagenes.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <strong>📷 Capturas:</strong>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {pedido.imagenes.map((img, i) => (
                          <img
                            key={i}
                            src={`http://localhost:3000${img.url}`}
                            alt="Pedido"
                            width={100}
                            style={{ cursor: 'zoom-in', borderRadius: '6px' }}
                            onClick={() => setImagenAmpliada(`http://localhost:3000${img.url}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
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

      {imagenAmpliada && (
        <div
          onClick={() => setImagenAmpliada(null)}
          style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 9999, cursor: 'pointer'
          }}
        >
          <img
            src={imagenAmpliada}
            alt="Ampliada"
            style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '8px' }}
          />
        </div>
      )}
    </main>
  );
}

export default App;
