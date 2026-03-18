import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

// Mock useAuth and usePermisos
const mockUseAuth = vi.fn();
const mockUsePermisos = vi.fn();

vi.mock('../../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../hooks/usePermisos', () => ({
  usePermisos: () => mockUsePermisos(),
}));

import ProtectedRoute from '../ProtectedRoute';

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ProtectedRoute', () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    // Default: authenticated user with all permissions
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin', roles: ['ADMIN'] },
      loading: false,
      esSuperAdmin: false,
    });
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: () => true,
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  it('renders children when user is authenticated', () => {
    renderWithRouter(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('shows loading state while auth is validating', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true, esSuperAdmin: false });

    renderWithRouter(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Cargando...')).toBeInTheDocument();
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('redirects to login when no user', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: false, esSuperAdmin: false });

    renderWithRouter(
      <ProtectedRoute>
        <div>Content</div>
      </ProtectedRoute>
    );

    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('shows access denied when module permission is missing', () => {
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => false,
      tieneRol: () => true,
    });

    renderWithRouter(
      <ProtectedRoute requiredModulo={'VENTAS' as any}>
        <div>Ventas Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('No tienes permisos para acceder a este módulo.')).toBeInTheDocument();
    expect(screen.queryByText('Ventas Page')).not.toBeInTheDocument();
  });

  it('renders children when user has required module permission', () => {
    mockUsePermisos.mockReturnValue({
      tienePermiso: (mod: string) => mod === 'VENTAS',
      tieneRol: () => true,
    });

    renderWithRouter(
      <ProtectedRoute requiredModulo={'VENTAS' as any}>
        <div>Ventas Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Ventas Page')).toBeInTheDocument();
  });

  it('shows access denied when required roles are missing', () => {
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: () => false,
    });

    renderWithRouter(
      <ProtectedRoute requiredRoles={['ADMIN' as any]}>
        <div>Admin Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('Tu rol no tiene permisos para acceder a esta página.')).toBeInTheDocument();
  });

  it('renders children when user has required role', () => {
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: (...roles: string[]) => roles.includes('ADMIN'),
    });

    renderWithRouter(
      <ProtectedRoute requiredRoles={['ADMIN' as any]}>
        <div>Admin Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Page')).toBeInTheDocument();
  });

  it('blocks non-superadmin from superadmin routes', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'user' },
      loading: false,
      esSuperAdmin: false,
    });

    renderWithRouter(
      <ProtectedRoute requireSuperAdmin>
        <div>Super Admin Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('Esta página requiere permisos de Super Administrador.')).toBeInTheDocument();
  });

  it('allows superadmin to access superadmin routes', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'super' },
      loading: false,
      esSuperAdmin: true,
    });

    renderWithRouter(
      <ProtectedRoute requireSuperAdmin>
        <div>Super Admin Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Super Admin Page')).toBeInTheDocument();
  });

  it('blocks non-admin from requireAdminEmpresa routes', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'vendedor' },
      loading: false,
      esSuperAdmin: false,
    });
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: () => false,
    });

    renderWithRouter(
      <ProtectedRoute requireAdminEmpresa>
        <div>Admin Empresa Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('Esta página requiere permisos de Administrador de Empresa.')).toBeInTheDocument();
  });

  it('allows superadmin to bypass requireAdminEmpresa', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'super' },
      loading: false,
      esSuperAdmin: true,
    });
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: () => false,
    });

    renderWithRouter(
      <ProtectedRoute requireAdminEmpresa>
        <div>Admin Empresa Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Admin Empresa Page')).toBeInTheDocument();
  });

  it('blocks non-gerente from requireGerenteSucursal routes', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'user' },
      loading: false,
      esSuperAdmin: false,
    });
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: () => false,
    });

    renderWithRouter(
      <ProtectedRoute requireGerenteSucursal>
        <div>Gerente Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Acceso Denegado')).toBeInTheDocument();
    expect(screen.getByText('Esta página requiere permisos de Gerente de Sucursal o superior.')).toBeInTheDocument();
  });

  it('allows ADMIN_EMPRESA role to access requireGerenteSucursal routes', () => {
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'admin_emp' },
      loading: false,
      esSuperAdmin: false,
    });
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: (...roles: string[]) => roles.includes('ADMIN_EMPRESA'),
    });

    renderWithRouter(
      <ProtectedRoute requireGerenteSucursal>
        <div>Gerente Page</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Gerente Page')).toBeInTheDocument();
  });

  it('shows "Volver al Dashboard" button on access denied', () => {
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => false,
      tieneRol: () => true,
    });

    renderWithRouter(
      <ProtectedRoute requiredModulo={'VENTAS' as any}>
        <div>Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Volver al Dashboard')).toBeInTheDocument();
  });

  it('skips role check when requiredRoles is empty', () => {
    mockUsePermisos.mockReturnValue({
      tienePermiso: () => true,
      tieneRol: () => false,
    });

    renderWithRouter(
      <ProtectedRoute requiredRoles={[]}>
        <div>Content</div>
      </ProtectedRoute>
    );

    expect(screen.getByText('Content')).toBeInTheDocument();
  });
});
