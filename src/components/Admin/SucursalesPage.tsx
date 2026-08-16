import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sucursalService } from '../../services/sucursalService';
import { empresaService } from '../../services/empresaService';
import type { Sucursal, CreateSucursalDTO, EstadoSucursal } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import '../Admin/EmpresasPage.css'; // Reuse styles

export const SucursalesPage: React.FC = () => {
  const { esSuperAdmin } = useAuth();
  const { empresaId: userEmpresaId } = useTenant();
  // sucursales/empresas/loading se derivan de queries (ver abajo).
  const [selectedEmpresa, setSelectedEmpresa] = useState<number | null>(null);
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

  const queryClient = useQueryClient();

  const empresasQuery = useQuery({
    queryKey: ['empresas-activas', esSuperAdmin, userEmpresaId],
    queryFn: async () => {
      const data = await empresaService.getActive();
      // Si no es SUPER_ADMIN, filtrar solo su empresa
      return (!esSuperAdmin && userEmpresaId) ? data.filter(e => e.id === userEmpresaId) : data;
    },
  });
  const empresas = empresasQuery.data ?? [];

  // Auto-seleccionar la empresa del usuario o la primera cuando cargan las empresas.
  useEffect(() => {
    if (empresas.length > 0 && !selectedEmpresa) {
      const defaultEmpresa = userEmpresaId && empresas.find(e => e.id === userEmpresaId);
      setSelectedEmpresa(defaultEmpresa ? defaultEmpresa.id : empresas[0].id);
    }
  }, [empresas, selectedEmpresa, userEmpresaId]);

  const sucursalesQuery = useQuery({
    queryKey: ['sucursales', selectedEmpresa],
    queryFn: () => sucursalService.getByEmpresa(selectedEmpresa!),
    enabled: selectedEmpresa != null,
  });
  const sucursales = sucursalesQuery.data ?? [];
  const loading = sucursalesQuery.isFetching && selectedEmpresa != null;
  const loadError = empresasQuery.error
    ? 'Error al cargar empresas'
    : sucursalesQuery.error ? 'Error al cargar sucursales' : null;
  const loadSucursales = () => queryClient.invalidateQueries({ queryKey: ['sucursales', selectedEmpresa] });

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

  const saveMutation = useMutation({
    mutationFn: () => editingSucursal
      ? sucursalService.update(editingSucursal.id, formData)
      : sucursalService.create(formData),
    onSuccess: () => { setShowModal(false); loadSucursales(); },
    onError: (err) => { console.error('Error saving sucursal:', err); setError('Error al guardar sucursal'); },
  });
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate();
  };

  const setPrincipalMutation = useMutation({
    mutationFn: (id: number) => sucursalService.setPrincipal(id),
    onSuccess: () => loadSucursales(),
    onError: (err) => { console.error('Error setting principal:', err); setError('Error al establecer sucursal principal'); },
  });
  const handleSetPrincipal = (id: number) => setPrincipalMutation.mutate(id);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sucursalService.delete(id),
    onSuccess: () => loadSucursales(),
    onError: (err) => { console.error('Error deleting sucursal:', err); setError('Error al eliminar sucursal'); },
  });
  const handleDelete = (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return;
    deleteMutation.mutate(id);
  };

  return (
    <div className="empresas-page">
      <div className="page-header">
        <h1>Gestión de Sucursales</h1>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {esSuperAdmin ? (
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
          ) : (
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
              {empresas.find(e => e.id === selectedEmpresa)?.nombre || 'Mi Empresa'}
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!selectedEmpresa}
          >
            Nueva Sucursal
          </button>
        </div>
      </div>

      {(error || loadError) && <div className="alert alert-danger">{error || loadError}</div>}

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
                    {esSuperAdmin && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(sucursal.id)}
                      >
                        Eliminar
                      </button>
                    )}
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
