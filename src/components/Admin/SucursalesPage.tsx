import React, { useState, useEffect } from 'react';
import { sucursalService } from '../../services/sucursalService';
import { empresaService } from '../../services/empresaService';
import type { Sucursal, Empresa, CreateSucursalDTO, EstadoSucursal } from '../../types';
import '../Admin/EmpresasPage.css'; // Reuse styles

export const SucursalesPage: React.FC = () => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSucursal, setEditingSucursal] = useState<Sucursal | null>(null);
  const [formData, setFormData] = useState<CreateSucursalDTO>({
    empresaId: 0,
    codigo: '',
    nombre: '',
    esPrincipal: false,
    estado: 'ACTIVO'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEmpresas();
  }, []);

  useEffect(() => {
    if (selectedEmpresa) {
      loadSucursales(selectedEmpresa);
    }
  }, [selectedEmpresa]);

  const loadEmpresas = async () => {
    try {
      const data = await empresaService.getActive();
      setEmpresas(data);
      if (data.length > 0 && !selectedEmpresa) {
        setSelectedEmpresa(data[0].id);
      }
    } catch (err) {
      console.error('Error loading empresas:', err);
      setError('Error al cargar empresas');
    }
  };

  const loadSucursales = async (empresaId: number) => {
    try {
      setLoading(true);
      const data = await sucursalService.getByEmpresa(empresaId);
      setSucursales(data);
    } catch (err) {
      console.error('Error loading sucursales:', err);
      setError('Error al cargar sucursales');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    if (!selectedEmpresa) return;
    setEditingSucursal(null);
    setFormData({
      empresaId: selectedEmpresa,
      codigo: '',
      nombre: '',
      esPrincipal: false,
      estado: 'ACTIVO'
    });
    setShowModal(true);
  };

  const handleEdit = (sucursal: Sucursal) => {
    setEditingSucursal(sucursal);
    setFormData({
      empresaId: sucursal.empresaId,
      codigo: sucursal.codigo,
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      telefono: sucursal.telefono,
      email: sucursal.email,
      esPrincipal: sucursal.esPrincipal,
      estado: sucursal.estado
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSucursal) {
        await sucursalService.update(editingSucursal.id, formData);
      } else {
        await sucursalService.create(formData);
      }
      setShowModal(false);
      if (selectedEmpresa) loadSucursales(selectedEmpresa);
    } catch (err) {
      console.error('Error saving sucursal:', err);
      setError('Error al guardar sucursal');
    }
  };

  const handleSetPrincipal = async (id: number) => {
    try {
      await sucursalService.setPrincipal(id);
      if (selectedEmpresa) loadSucursales(selectedEmpresa);
    } catch (err) {
      console.error('Error setting principal:', err);
      setError('Error al establecer sucursal principal');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;

    try {
      await sucursalService.delete(id);
      if (selectedEmpresa) loadSucursales(selectedEmpresa);
    } catch (err) {
      console.error('Error deleting sucursal:', err);
      setError('Error al eliminar sucursal');
    }
  };

  return (
    <div className="empresas-page">
      <div className="page-header">
        <h1>Gestión de Sucursales</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            className="form-control"
            style={{ width: '250px' }}
            value={selectedEmpresa || ''}
            onChange={(e) => setSelectedEmpresa(parseInt(e.target.value))}
          >
            <option value="">Seleccione empresa</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nombre}
              </option>
            ))}
          </select>
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!selectedEmpresa}
          >
            Nueva Sucursal
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Cargando sucursales...</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Código</th>
                <th>Nombre</th>
                <th>Dirección</th>
                <th>Principal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {sucursales.map((sucursal) => (
                <tr key={sucursal.id}>
                  <td>{sucursal.id}</td>
                  <td>{sucursal.codigo}</td>
                  <td>{sucursal.nombre}</td>
                  <td>{sucursal.direccion || '-'}</td>
                  <td>{sucursal.esPrincipal ? '⭐' : '-'}</td>
                  <td>
                    <span
                      className={`badge ${
                        sucursal.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {sucursal.estado}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(sucursal)}
                    >
                      Editar
                    </button>
                    {!sucursal.esPrincipal && (
                      <button
                        className="btn btn-sm btn-success"
                        onClick={() => handleSetPrincipal(sucursal.id)}
                      >
                        Marcar Principal
                      </button>
                    )}
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(sucursal.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Código *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Dirección</label>
                <textarea
                  className="form-control"
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label>Teléfono</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  className="form-control"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.esPrincipal}
                    onChange={(e) =>
                      setFormData({ ...formData, esPrincipal: e.target.checked })
                    }
                  />{' '}
                  Sucursal Principal
                </label>
              </div>

              <div className="form-group">
                <label>Estado *</label>
                <select
                  className="form-control"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value as EstadoSucursal })
                  }
                  required
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSucursal ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
