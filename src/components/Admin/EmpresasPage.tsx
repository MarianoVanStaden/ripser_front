import React, { useState, useEffect } from 'react';
import { empresaService } from '../../services/empresaService';
import type { Empresa, CreateEmpresaDTO, EstadoEmpresa } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import './EmpresasPage.css';

export const EmpresasPage: React.FC = () => {
  const { esSuperAdmin, user } = useAuth();
  const { empresaId } = useTenant();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState<CreateEmpresaDTO>({
    nombre: '',
    estado: 'ACTIVO'
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🏢 EmpresasPage mounted:', {
      esSuperAdmin,
      empresaId,
      username: user?.username,
      userRoles: user?.roles
    });
    loadEmpresas();
  }, [empresaId, esSuperAdmin]);

  const loadEmpresas = async () => {
    try {
      setLoading(true);
      console.log('📥 EmpresasPage: Loading empresas...', { esSuperAdmin, empresaId });
      const data = await empresaService.getAll();
      console.log(`📊 Empresas loaded from API: ${data.length} total`);

      // Si no es SUPER_ADMIN, filtrar solo su empresa
      if (!esSuperAdmin && empresaId) {
        const filtered = data.filter(e => e.id === empresaId);
        console.log(`🔒 Regular user: Filtered to ${filtered.length} empresa(s)`);
        setEmpresas(filtered);
      } else {
        console.log(`🔑 SuperAdmin: Showing all ${data.length} empresas`);
        setEmpresas(data);
      }
    } catch (err) {
      console.error('❌ Error loading empresas:', err);
      setError('Error al cargar empresas');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingEmpresa(null);
    setFormData({ nombre: '', estado: 'ACTIVO' });
    setShowModal(true);
  };

  const handleEdit = (empresa: Empresa) => {
    setEditingEmpresa(empresa);
    setFormData({
      nombre: empresa.nombre,
      cuit: empresa.cuit,
      razonSocial: empresa.razonSocial,
      email: empresa.email,
      telefono: empresa.telefono,
      direccion: empresa.direccion,
      estado: empresa.estado
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmpresa) {
        await empresaService.update(editingEmpresa.id, formData);
      } else {
        await empresaService.create(formData);
      }
      setShowModal(false);
      loadEmpresas();
    } catch (err) {
      console.error('Error saving empresa:', err);
      setError('Error al guardar empresa');
    }
  };

  const handleSuspend = async (id: number) => {
    if (!confirm('¿Está seguro de suspender esta empresa?')) return;

    try {
      await empresaService.suspend(id);
      loadEmpresas();
    } catch (err) {
      console.error('Error suspending empresa:', err);
      setError('Error al suspender empresa');
    }
  };

  const handleReactivate = async (id: number) => {
    try {
      await empresaService.reactivate(id);
      loadEmpresas();
    } catch (err) {
      console.error('Error reactivating empresa:', err);
      setError('Error al reactivar empresa');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) return;

    try {
      await empresaService.delete(id);
      loadEmpresas();
    } catch (err) {
      console.error('Error deleting empresa:', err);
      setError('Error al eliminar empresa');
    }
  };

  const getEstadoClass = (estado: EstadoEmpresa) => {
    switch (estado) {
      case 'ACTIVO':
        return 'badge-success';
      case 'SUSPENDIDO':
        return 'badge-warning';
      case 'INACTIVO':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  };

  return (
    <div className="empresas-page">
      <div className="page-header">
        <h1>Gestión de Empresas</h1>
        {esSuperAdmin && (
          <button className="btn btn-primary" onClick={handleCreate}>
            <i className="icon-plus"></i> Nueva Empresa
          </button>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {loading ? (
        <div className="loading">Cargando empresas...</div>
      ) : (
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>CUIT</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {empresas.map((empresa) => (
                <tr key={empresa.id}>
                  <td>{empresa.id}</td>
                  <td>{empresa.nombre}</td>
                  <td>{empresa.cuit || '-'}</td>
                  <td>{empresa.email || '-'}</td>
                  <td>{empresa.telefono || '-'}</td>
                  <td>
                    <span className={`badge ${getEstadoClass(empresa.estado)}`}>
                      {empresa.estado}
                    </span>
                  </td>
                  <td>{new Date(empresa.fechaCreacion).toLocaleDateString()}</td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-info"
                      onClick={() => handleEdit(empresa)}
                      title="Editar"
                    >
                      Editar
                    </button>

                    {esSuperAdmin && (
                      <>
                        {empresa.estado === 'ACTIVO' ? (
                          <button
                            className="btn btn-sm btn-warning"
                            onClick={() => handleSuspend(empresa.id)}
                            title="Suspender"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleReactivate(empresa.id)}
                            title="Reactivar"
                          >
                            Reactivar
                          </button>
                        )}

                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(empresa.id)}
                          title="Eliminar"
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal for create/edit */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
              <button className="close-button" onClick={() => setShowModal(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  className="form-control"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="razonSocial">Razón Social</label>
                <input
                  type="text"
                  id="razonSocial"
                  className="form-control"
                  value={formData.razonSocial || ''}
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="cuit">CUIT</label>
                <input
                  type="text"
                  id="cuit"
                  className="form-control"
                  value={formData.cuit || ''}
                  onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-control"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="text"
                  id="telefono"
                  className="form-control"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="direccion">Dirección</label>
                <textarea
                  id="direccion"
                  className="form-control"
                  value={formData.direccion || ''}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label htmlFor="estado">Estado *</label>
                <select
                  id="estado"
                  className="form-control"
                  value={formData.estado}
                  onChange={(e) =>
                    setFormData({ ...formData, estado: e.target.value as EstadoEmpresa })
                  }
                  required
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
                  <option value="INACTIVO">INACTIVO</option>
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingEmpresa ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
