 
import React, { useState, useEffect } from 'react';
 
import { sucursalService } from '../../services/sucursalService';
 
import { empresaService } from '../../services/empresaService';
 
import type { Sucursal, Empresa, CreateSucursalDTO, EstadoSucursal } from '../../types';
 
import { useAuth } from '../../context/AuthContext';
 
import { useTenant } from '../../context/TenantContext';
 
import '../Admin/EmpresasPage.css'; // Reuse styles
 

 
export const SucursalesPage: React.FC = () => {
 
  const { esSuperAdmin } = useAuth();
 
  const { empresaId: userEmpresaId } = useTenant();
 
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
/* eslint-disable react-hooks/exhaustive-deps */
  }, [userEmpresaId, esSuperAdmin]);
 

 
  useEffect(() => {
 
    if (selectedEmpresa) {
 
      loadSucursales(selectedEmpresa);
 
    }
 
  }, [selectedEmpresa]);
 

 
  const loadEmpresas = async () => {
 
    try {
 
      const data = await empresaService.getActive();
 

 
      // Si no es SUPER_ADMIN, filtrar solo su empresa
 
      let empresasFiltradas = data;
 
      if (!esSuperAdmin && userEmpresaId) {
 
        empresasFiltradas = data.filter(e => e.id === userEmpresaId);
 
      }
 

 
      setEmpresas(empresasFiltradas);
 

 
      // Auto-seleccionar la empresa del usuario o la primera
 
      if (empresasFiltradas.length > 0 && !selectedEmpresa) {
 
        const defaultEmpresa = userEmpresaId && empresasFiltradas.find(e => e.id === userEmpresaId);
 
        setSelectedEmpresa(defaultEmpresa ? defaultEmpresa.id : empresasFiltradas[0].id);
 
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
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      <div className="page-header">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <h1>Gestión de Sucursales</h1>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          {esSuperAdmin ? (
 
            <select
 
              className="form-control"
 
              style={{ width: '250px' }}
 
              value={selectedEmpresa || ''}
 
              onChange={(e) => setSelectedEmpresa(parseInt(e.target.value))}
 
            >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <option value="">Seleccione empresa</option>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {empresas.map((empresa) => (
 
                <option key={empresa.id} value={empresa.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {empresa.nombre}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </option>
 
              ))}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </select>
 
          ) : (
 
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {empresas.find(e => e.id === selectedEmpresa)?.nombre || 'Mi Empresa'}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </div>
 
          )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <button
 
            className="btn btn-primary"
 
            onClick={handleCreate}
 
            disabled={!selectedEmpresa}
 
          >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            Nueva Sucursal
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
        </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {error && <div className="alert alert-danger">{error}</div>}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {loading ? (
 
        <div className="loading">Cargando sucursales...</div>
 
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
                <th>Código</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Nombre</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Dirección</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Principal</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Estado</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <th>Acciones</th>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </tr>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            </thead>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <tbody>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              {sucursales.map((sucursal) => (
 
                <tr key={sucursal.id}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{sucursal.id}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{sucursal.codigo}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{sucursal.nombre}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{sucursal.direccion || '-'}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>{sucursal.esPrincipal ? '⭐' : '-'}</td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <span
 
                      className={`badge ${
 
                        sucursal.estado === 'ACTIVO' ? 'badge-success' : 'badge-danger'
 
                      }`}
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      {sucursal.estado}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </span>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  </td>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <td className="actions">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    <button
 
                      className="btn btn-sm btn-info"
 
                      onClick={() => handleEdit(sucursal)}
 
                    >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      Editar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {!sucursal.esPrincipal && (
 
                      <button
 
                        className="btn btn-sm btn-success"
 
                        onClick={() => handleSetPrincipal(sucursal.id)}
 
                      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        Marcar Principal
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </button>
 
                    )}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                    {esSuperAdmin && (
 
                      <button
 
                        className="btn btn-sm btn-danger"
 
                        onClick={() => handleDelete(sucursal.id)}
 
                      >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                        Eliminar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                      </button>
 
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
      {/* Modal */}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
      {showModal && (
 
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
            <div className="modal-header">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <h2>{editingSucursal ? 'Editar Sucursal' : 'Nueva Sucursal'}</h2>
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
                <label>Código *</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="text"
 
                  className="form-control"
 
                  value={formData.codigo}
 
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
 
                  required
 
                />
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label>Nombre *</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="text"
 
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
                <label>Dirección</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <textarea
 
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
                <label>Teléfono</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="text"
 
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
                <label>Email</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <input
 
                  type="email"
 
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
                <label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <input
 
                    type="checkbox"
 
                    checked={formData.esPrincipal}
 
                    onChange={(e) =>
 
                      setFormData({ ...formData, esPrincipal: e.target.checked })
 
                    }
 
                  />{' '}
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Sucursal Principal
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              </div>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */

/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
              <div className="form-group">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <label>Estado *</label>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <select
 
                  className="form-control"
 
                  value={formData.estado}
 
                  onChange={(e) =>
 
                    setFormData({ ...formData, estado: e.target.value as EstadoSucursal })
 
                  }
 
                  required
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  <option value="ACTIVO">ACTIVO</option>
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
                <button
 
                  type="button"
 
                  className="btn btn-secondary"
 
                  onClick={() => setShowModal(false)}
 
                >
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  Cancelar
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                </button>
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                <button type="submit" className="btn btn-primary">
/* eslint-disable react-hooks/exhaustive-deps, @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
                  {editingSucursal ? 'Actualizar' : 'Crear'}
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
