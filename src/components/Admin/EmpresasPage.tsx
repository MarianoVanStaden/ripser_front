 
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
/* eslint-disable react-hooks/exhaustive-deps */
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
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <div className="page-header">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <h1>Gestión de Empresas</h1>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        {esSuperAdmin && (
 
          <button className="btn btn-primary" onClick={handleCreate}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <i className="icon-plus"></i> Nueva Empresa
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </button>
 
        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {error && <div className="alert alert-danger">{error}</div>}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {loading ? (
 
        <div className="loading">Cargando empresas...</div>
 
      ) : (
 
        <div className="table-responsive">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <table className="table">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <thead>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <tr>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>ID</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Nombre</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>CUIT</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Email</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Teléfono</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Estado</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Fecha Creación</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Acciones</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </tr>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </thead>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <tbody>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {empresas.map((empresa) => (
 
                <tr key={empresa.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{empresa.id}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{empresa.nombre}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{empresa.cuit || '-'}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{empresa.email || '-'}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{empresa.telefono || '-'}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <span className={`badge ${getEstadoClass(empresa.estado)}`}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {empresa.estado}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </span>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{new Date(empresa.fechaCreacion).toLocaleDateString()}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td className="actions">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <button
 
                      className="btn btn-sm btn-info"
 
                      onClick={() => handleEdit(empresa)}
 
                      title="Editar"
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Editar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {esSuperAdmin && (
 
                      <>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        {empresa.estado === 'ACTIVO' ? (
 
                          <button
 
                            className="btn btn-sm btn-warning"
 
                            onClick={() => handleSuspend(empresa.id)}
 
                            title="Suspender"
 
                          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            Suspender
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </button>
 
                        ) : (
 
                          <button
 
                            className="btn btn-sm btn-success"
 
                            onClick={() => handleReactivate(empresa.id)}
 
                            title="Reactivar"
 
                          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                            Reactivar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          </button>
 
                        )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        <button
 
                          className="btn btn-sm btn-danger"
 
                          onClick={() => handleDelete(empresa.id)}
 
                          title="Eliminar"
 
                        >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                          Eliminar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </>
 
                    )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </tr>
 
              ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </tbody>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </table>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </div>
 
      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {/* Modal for create/edit */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {showModal && (
 
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <div className="modal-header">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <h2>{editingEmpresa ? 'Editar Empresa' : 'Nueva Empresa'}</h2>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <button className="close-button" onClick={() => setShowModal(false)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                ×
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <form onSubmit={handleSave}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label htmlFor="nombre">Nombre *</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="text"
 
                  id="nombre"
 
                  className="form-control"
 
                  value={formData.nombre}
 
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
 
                  required
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label htmlFor="razonSocial">Razón Social</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="text"
 
                  id="razonSocial"
 
                  className="form-control"
 
                  value={formData.razonSocial || ''}
 
                  onChange={(e) => setFormData({ ...formData, razonSocial: e.target.value })}
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label htmlFor="cuit">CUIT</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="text"
 
                  id="cuit"
 
                  className="form-control"
 
                  value={formData.cuit || ''}
 
                  onChange={(e) => setFormData({ ...formData, cuit: e.target.value })}
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label htmlFor="email">Email</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="email"
 
                  id="email"
 
                  className="form-control"
 
                  value={formData.email || ''}
 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label htmlFor="telefono">Teléfono</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="text"
 
                  id="telefono"
 
                  className="form-control"
 
                  value={formData.telefono || ''}
 
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label htmlFor="direccion">Dirección</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <textarea
 
                  id="direccion"
 
                  className="form-control"
 
                  value={formData.direccion || ''}
 
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
 
                  rows={3}
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label htmlFor="estado">Estado *</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <select
 
                  id="estado"
 
                  className="form-control"
 
                  value={formData.estado}
 
                  onChange={(e) =>
 
                    setFormData({ ...formData, estado: e.target.value as EstadoEmpresa })
 
                  }
 
                  required
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <option value="ACTIVO">ACTIVO</option>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <option value="SUSPENDIDO">SUSPENDIDO</option>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <option value="INACTIVO">INACTIVO</option>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </select>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="modal-footer">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <button type="submit" className="btn btn-primary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {editingEmpresa ? 'Actualizar' : 'Crear'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </form>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </div>
 
      )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
    </div>
 
  );
 
};
