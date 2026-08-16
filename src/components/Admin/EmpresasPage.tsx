import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { empresaService } from '../../services/empresaService';
import type { Empresa, CreateEmpresaDTO, EstadoEmpresa } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import './EmpresasPage.css';

export const EmpresasPage: React.FC = () => {
  const { esSuperAdmin } = useAuth();
  const { empresaId } = useTenant();
  // empresas/loading se derivan del query ['empresas', esSuperAdmin, empresaId].
  const [showModal, setShowModal] = useState(false);
  const [editingEmpresa, setEditingEmpresa] = useState<Empresa | null>(null);
  const [formData, setFormData] = useState<CreateEmpresaDTO>({
    nombre: '',
    estado: 'ACTIVO'
  });
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const empresasQuery = useQuery({
    queryKey: ['empresas', esSuperAdmin, empresaId],
    queryFn: async () => {
      const data = await empresaService.getAll();
      // Si no es SUPER_ADMIN, filtrar solo su empresa
      return (!esSuperAdmin && empresaId) ? data.filter(e => e.id === empresaId) : data;
    },
  });
  const empresas = empresasQuery.data ?? [];
  const loading = empresasQuery.isPending;
  const loadError = empresasQuery.error ? 'Error al cargar empresas' : null;
  const loadEmpresas = () => queryClient.invalidateQueries({ queryKey: ['empresas', esSuperAdmin, empresaId] });

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

  const saveMutation = useMutation({
    mutationFn: () => editingEmpresa
      ? empresaService.update(editingEmpresa.id, formData)
      : empresaService.create(formData),
    onSuccess: () => { setShowModal(false); loadEmpresas(); },
    onError: (err) => { console.error('Error saving empresa:', err); setError('Error al guardar empresa'); },
  });
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const suspendMutation = useMutation({
    mutationFn: (id: number) => empresaService.suspend(id),
    onSuccess: () => loadEmpresas(),
    onError: (err) => { console.error('Error suspending empresa:', err); setError('Error al suspender empresa'); },
  });
  const handleSuspend = (id: number) => {
    if (!confirm('¿Está seguro de suspender esta empresa?')) return;
    suspendMutation.mutate(id);
  };

  const reactivateMutation = useMutation({
    mutationFn: (id: number) => empresaService.reactivate(id),
    onSuccess: () => loadEmpresas(),
    onError: (err) => { console.error('Error reactivating empresa:', err); setError('Error al reactivar empresa'); },
  });
  const handleReactivate = (id: number) => reactivateMutation.mutate(id);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => empresaService.delete(id),
    onSuccess: () => loadEmpresas(),
    onError: (err) => { console.error('Error deleting empresa:', err); setError('Error al eliminar empresa'); },
  });
  const handleDelete = (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta empresa? Esta acción no se puede deshacer.')) return;
    deleteMutation.mutate(id);
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

      {(error || loadError) && <div className="alert alert-danger">{error || loadError}</div>}

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
