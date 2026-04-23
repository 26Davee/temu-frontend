import { useEffect, useMemo, useState } from 'react';
import './App.css';
import Estadisticas from './Estadisticas';

const API_URL = import.meta.env.VITE_API_URL || 'https://temu-pedidos-production.up.railway.app';
const ESTADOS = ['PENDIENTE', 'SALIDO', 'ADUANA', 'RUTA', 'ENTREGADO'];
const pedidoInicial = {
  nombre: '',
  apellido: '',
  codigo: '',
  fecha: new Date().toISOString().split('T')[0],
  estado: 'PENDIENTE',
  comentarios: '',
  articulos: [{ nombre: '', cantidad: 1, precioUnit: 0 }]
};

function App() {
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
  const [pedidos, setPedidos] = useState([]);
  const [clientesFrecuentes, setClientesFrecuentes] = useState([]);
  const [imagenAmpliada, setImagenAmpliada] = useState(null);
  const [filtro, setFiltro] = useState({ estado: '', texto: '', fecha: '', codigo: '' });
  const [nuevoPedido, setNuevoPedido] = useState(pedidoInicial);
  const [imagenes, setImagenes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    cargarPedidos();

    const guardados = localStorage.getItem('clientesFrecuentes');
    if (guardados) {
      setClientesFrecuentes(JSON.parse(guardados));
    }
  }, []);

  const cargarPedidos = async () => {
    try {
      setCargando(true);
      const res = await fetch(`${API_URL}/pedidos`);
      const data = await res.json();
      setPedidos(Array.isArray(data) ? data : []);
      setError('');
    } catch {
      setPedidos([]);
      setError('No se pudieron cargar los pedidos.');
    } finally {
      setCargando(false);
    }
  };

  const guardarClienteFrecuente = (nombre, apellido) => {
    const cliente = `${nombre.trim()} ${apellido.trim()}`.trim();
    if (!cliente || clientesFrecuentes.includes(cliente)) return;

    const actualizados = [...clientesFrecuentes, cliente];
    setClientesFrecuentes(actualizados);
    localStorage.setItem('clientesFrecuentes', JSON.stringify(actualizados));
  };

  const eliminarClienteFrecuente = (cliente) => {
    const actualizados = clientesFrecuentes.filter((item) => item !== cliente);
    setClientesFrecuentes(actualizados);
    localStorage.setItem('clientesFrecuentes', JSON.stringify(actualizados));
  };

  const seleccionarCliente = (cliente) => {
    const [nombre, ...apellidoArr] = cliente.split(' ');
    setNuevoPedido((pedido) => ({ ...pedido, nombre, apellido: apellidoArr.join(' ') }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setNuevoPedido((pedido) => ({ ...pedido, [name]: value }));
  };

  const handleArticuloChange = (index, field, value) => {
    const updated = nuevoPedido.articulos.map((articulo, currentIndex) => {
      if (currentIndex !== index) return articulo;
      const nextValue = field === 'cantidad' || field === 'precioUnit'
        ? Number(value)
        : value;

      return { ...articulo, [field]: nextValue };
    });

    setNuevoPedido((pedido) => ({ ...pedido, articulos: updated }));
  };

  const agregarArticulo = () => {
    setNuevoPedido((pedido) => ({
      ...pedido,
      articulos: [...pedido.articulos, { nombre: '', cantidad: 1, precioUnit: 0 }]
    }));
  };

  const eliminarArticulo = (index) => {
    setNuevoPedido((pedido) => ({
      ...pedido,
      articulos: pedido.articulos.filter((_, currentIndex) => currentIndex !== index)
    }));
  };

  const enviarPedido = async (event) => {
    event.preventDefault();

    const articulosValidos = nuevoPedido.articulos.filter((articulo) => articulo.nombre.trim());
    if (!nuevoPedido.nombre.trim() || !nuevoPedido.apellido.trim() || articulosValidos.length === 0) {
      setError('Completa el cliente y al menos un articulo.');
      return;
    }

    const totalMonto = articulosValidos.reduce(
      (acc, articulo) => acc + articulo.cantidad * articulo.precioUnit,
      0
    );
    const familiar = `${nuevoPedido.nombre} ${nuevoPedido.apellido}`.trim();

    const formData = new FormData();
    formData.append('familiar', familiar);
    formData.append('totalMonto', totalMonto);
    formData.append('fecha', nuevoPedido.fecha);
    formData.append('comentarios', nuevoPedido.comentarios);
    formData.append('estado', nuevoPedido.estado);
    formData.append('articulos', JSON.stringify(articulosValidos));
    imagenes.forEach((img) => formData.append('imagenes', img));

    try {
      const res = await fetch(`${API_URL}/pedidos-con-foto`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) throw new Error(data?.error || 'Error al enviar el pedido.');

      guardarClienteFrecuente(nuevoPedido.nombre, nuevoPedido.apellido);
      setPedidos((actuales) => [data, ...actuales]);
      setNuevoPedido({ ...pedidoInicial, fecha: new Date().toISOString().split('T')[0] });
      setImagenes([]);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const actualizarEstado = async (id, estadoNuevo) => {
    try {
      const res = await fetch(`${API_URL}/pedidos/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: estadoNuevo })
      });

      if (!res.ok) throw new Error();
      setPedidos((actuales) => actuales.map((pedido) => (
        pedido.id === id ? { ...pedido, estado: estadoNuevo } : pedido
      )));
    } catch {
      setError('No se pudo cambiar el estado.');
    }
  };

  const eliminarPedido = async (id) => {
    if (!window.confirm('Seguro que deseas eliminar este pedido?')) return;

    try {
      const res = await fetch(`${API_URL}/pedidos/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setPedidos((actuales) => actuales.filter((pedido) => pedido.id !== id));
      setError('');
    } catch {
      setError('No se pudo eliminar el pedido.');
    }
  };

  const pedidosFiltrados = useMemo(() => pedidos.filter((pedido) => {
    const coincideEstado = filtro.estado ? pedido.estado === filtro.estado : true;
    const coincideTexto = filtro.texto
      ? pedido.familiar.toLowerCase().includes(filtro.texto.toLowerCase())
      : true;
    const coincideFecha = filtro.fecha ? pedido.fecha.startsWith(filtro.fecha) : true;
    const coincideCodigo = filtro.codigo
      ? pedido.codigo?.toLowerCase().includes(filtro.codigo.toLowerCase())
      : true;

    return coincideEstado && coincideTexto && coincideFecha && coincideCodigo;
  }), [pedidos, filtro]);

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Panel de pedidos</p>
          <h1>Gestion de Pedidos</h1>
        </div>
        <button className="btn-secondary" onClick={cargarPedidos} type="button">
          Actualizar
        </button>
      </header>

      {error && <p className="alert">{error}</p>}

      <section className="surface">
        <div className="section-heading">
          <h2>Nuevo pedido</h2>
          <span>{imagenes.length} imagenes adjuntas</span>
        </div>

        <form onSubmit={enviarPedido}>
          {clientesFrecuentes.length > 0 && (
            <div className="form-group">
              <label>Clientes frecuentes</label>
              <div className="chip-list">
                {clientesFrecuentes.map((cliente) => (
                  <span className="chip" key={cliente}>
                    <button type="button" onClick={() => seleccionarCliente(cliente)}>
                      {cliente}
                    </button>
                    <button
                      aria-label={`Eliminar ${cliente}`}
                      className="chip-remove"
                      onClick={() => eliminarClienteFrecuente(cliente)}
                      type="button"
                    >
                      x
                    </button>
                  </span>
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
              <label>Codigo</label>
              <input name="codigo" value={nuevoPedido.codigo} readOnly placeholder="Generado por el sistema" />
            </div>
            <div className="form-group">
              <label>Fecha</label>
              <input type="date" name="fecha" value={nuevoPedido.fecha} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Estado inicial</label>
              <select name="estado" value={nuevoPedido.estado} onChange={handleChange}>
                {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>
            <div className="form-group full">
              <label>Comentarios</label>
              <textarea name="comentarios" value={nuevoPedido.comentarios} onChange={handleChange} />
            </div>
            <div className="form-group full">
              <label>Imagenes del pedido</label>
              <input type="file" multiple accept="image/*" onChange={(event) => setImagenes([...event.target.files])} />
            </div>
          </div>

          <div className="section-heading compact">
            <h3>Articulos</h3>
            <button className="btn-secondary" onClick={agregarArticulo} type="button">
              Agregar articulo
            </button>
          </div>

          <div className="article-list">
            {nuevoPedido.articulos.map((articulo, index) => (
              <div className="article-row" key={`articulo-${index}`}>
                <input
                  placeholder="Articulo"
                  value={articulo.nombre}
                  onChange={(event) => handleArticuloChange(index, 'nombre', event.target.value)}
                />
                <input
                  min="1"
                  type="number"
                  placeholder="Cantidad"
                  value={articulo.cantidad}
                  onChange={(event) => handleArticuloChange(index, 'cantidad', event.target.value)}
                />
                <input
                  min="0"
                  step="0.01"
                  type="number"
                  placeholder="Precio"
                  value={articulo.precioUnit}
                  onChange={(event) => handleArticuloChange(index, 'precioUnit', event.target.value)}
                />
                <button
                  className="btn-delete"
                  disabled={nuevoPedido.articulos.length === 1}
                  onClick={() => eliminarArticulo(index)}
                  type="button"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>

          <div className="actions">
            <button className="btn-primary" type="submit">Guardar pedido</button>
          </div>
        </form>
      </section>

      <section className="surface">
        <div className="section-heading">
          <h2>Pedidos</h2>
          <span>{pedidosFiltrados.length} resultados</span>
        </div>

        <div className="filter-bar">
          <input type="text" placeholder="Buscar por cliente" value={filtro.texto} onChange={(event) => setFiltro({ ...filtro, texto: event.target.value })} />
          <input type="text" placeholder="Buscar por codigo" value={filtro.codigo} onChange={(event) => setFiltro({ ...filtro, codigo: event.target.value })} />
          <select value={filtro.estado} onChange={(event) => setFiltro({ ...filtro, estado: event.target.value })}>
            <option value="">Todos los estados</option>
            {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
          </select>
          <input type="date" value={filtro.fecha} onChange={(event) => setFiltro({ ...filtro, fecha: event.target.value })} />
          <button className="btn-secondary" onClick={() => setFiltro({ estado: '', texto: '', fecha: '', codigo: '' })} type="button">
            Limpiar
          </button>
        </div>

        {cargando ? (
          <p className="muted">Cargando pedidos...</p>
        ) : (
          <ul className="pedido-list">
            {pedidosFiltrados.map((pedido) => (
              <li key={pedido.id} className="pedido-item">
                <div className="pedido-header">
                  <div>
                    <strong>{pedido.familiar}</strong>
                    <span>{pedido.codigo || 'Sin codigo'} · {pedido.estado}</span>
                  </div>
                  <strong>${Number(pedido.totalMonto).toFixed(2)}</strong>
                </div>

                <div className="estado-buttons">
                  {ESTADOS.map((estado) => (
                    <button
                      key={estado}
                      onClick={() => actualizarEstado(pedido.id, estado)}
                      disabled={pedido.estado === estado}
                      className={pedido.estado === estado ? 'btn-selected' : ''}
                      type="button"
                    >
                      {estado}
                    </button>
                  ))}
                </div>

                <div className="pedido-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setPedidos((actuales) => actuales.map((item) => (
                      item.id === pedido.id ? { ...item, mostrar: !item.mostrar } : item
                    )))}
                    type="button"
                  >
                    {pedido.mostrar ? 'Ocultar detalle' : 'Ver detalle'}
                  </button>
                  <button className="btn-delete" onClick={() => eliminarPedido(pedido.id)} type="button">
                    Eliminar
                  </button>
                </div>

                {pedido.mostrar && (
                  <div className="pedido-detalles">
                    <p><strong>Comentarios:</strong> {pedido.comentarios || 'Ninguno'}</p>
                    <p><strong>Fecha:</strong> {new Date(pedido.fecha).toLocaleDateString()}</p>
                    <ul>
                      {pedido.articulos.map((articulo) => (
                        <li key={articulo.id}>
                          {articulo.nombre} · {articulo.cantidad} x ${Number(articulo.precioUnit).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                    {pedido.imagenes && pedido.imagenes.length > 0 && (
                      <div className="image-list">
                        {pedido.imagenes.map((img) => (
                          <button key={img.id || img.url} onClick={() => setImagenAmpliada(img.url)} type="button">
                            <img src={img.url} alt="Pedido" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface">
        <div className="section-heading">
          <h2>Estadisticas</h2>
          <button className="btn-secondary" onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)} type="button">
            {mostrarEstadisticas ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {mostrarEstadisticas && <Estadisticas API_URL={API_URL} />}
      </section>

      {imagenAmpliada && (
        <div className="image-modal" onClick={() => setImagenAmpliada(null)}>
          <img src={imagenAmpliada} alt="Pedido ampliado" />
        </div>
      )}
    </main>
  );
}

export default App;
