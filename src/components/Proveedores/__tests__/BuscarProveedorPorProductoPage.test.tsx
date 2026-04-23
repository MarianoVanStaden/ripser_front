import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';

vi.mock('../../../api/services/proveedorSearchApi', () => ({
  proveedorSearchApi: {
    searchProductos: vi.fn(),
    searchCategorias: vi.fn(),
    proveedoresPorProducto: vi.fn(),
    proveedoresPorCategoria: vi.fn(),
  },
}));

import { proveedorSearchApi } from '../../../api/services/proveedorSearchApi';
import BuscarProveedorPorProductoPage from '../BuscarProveedorPorProductoPage';

const mocked = vi.mocked(proveedorSearchApi, true);

const bomba = { id: 1, label: 'Bomba sumergible 1HP', codigo: 'BOM001', tipo: 'PRODUCTO' as const };
const bombaCat = { id: 99, label: 'Bombas', codigo: undefined, tipo: 'CATEGORIA' as const };

const oferta = {
  proveedorId: 10,
  razonSocial: 'Proveedor Alfa',
  email: 'alfa@test.com',
  telefono: '1234-5678',
  ciudad: 'La Plata',
  provincia: 'BUENOS_AIRES',
  productoId: 1,
  productoNombre: 'Bomba sumergible 1HP',
  productoCodigo: 'BOM001',
  precioProveedor: 12345.5,
  activo: true,
};

const ofertaSinPrecio = { ...oferta, proveedorId: 11, razonSocial: 'Proveedor Beta', precioProveedor: null };

const renderPage = () =>
  render(
    <MemoryRouter>
      <BuscarProveedorPorProductoPage />
    </MemoryRouter>,
  );

describe('BuscarProveedorPorProductoPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.searchProductos.mockResolvedValue([]);
    mocked.searchCategorias.mockResolvedValue([]);
    mocked.proveedoresPorProducto.mockResolvedValue([]);
    mocked.proveedoresPorCategoria.mockResolvedValue([]);
  });

  it('renderiza el título y el input con autofocus', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /buscar proveedor por producto/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/buscar producto o categoría/i)).toHaveFocus();
  });

  it('no llama al backend cuando hay menos de 2 caracteres', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'a');

    // Dale tiempo al debounce (300ms) + un colchón
    await new Promise((r) => setTimeout(r, 500));

    expect(mocked.searchProductos).not.toHaveBeenCalled();
    expect(mocked.searchCategorias).not.toHaveBeenCalled();
  });

  it('dispara búsquedas paralelas de productos y categorías tras el debounce', async () => {
    mocked.searchProductos.mockResolvedValue([bomba]);
    mocked.searchCategorias.mockResolvedValue([bombaCat]);

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');

    await waitFor(() => {
      expect(mocked.searchProductos).toHaveBeenCalledWith('bomb');
      expect(mocked.searchCategorias).toHaveBeenCalledWith('bomb');
    });

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /bomba sumergible 1hp/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^bombas/i })).toBeInTheDocument();
    });
  });

  it('al seleccionar un producto carga los proveedores y muestra la tabla', async () => {
    mocked.searchProductos.mockResolvedValue([bomba]);
    mocked.proveedoresPorProducto.mockResolvedValue([oferta]);

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');

    const option = await screen.findByRole('option', { name: /bomba sumergible 1hp/i });
    await user.click(option);

    await waitFor(() => {
      expect(mocked.proveedoresPorProducto).toHaveBeenCalledWith(1);
    });

    expect(await screen.findByText('Proveedor Alfa')).toBeInTheDocument();
    expect(screen.getByText(/\$12\.345,5/)).toBeInTheDocument();
    expect(screen.getByText(/1 proveedor encontrado/i)).toBeInTheDocument();
  });

  it('pluraliza el resumen correctamente para múltiples resultados', async () => {
    mocked.searchProductos.mockResolvedValue([bomba]);
    mocked.proveedoresPorProducto.mockResolvedValue([oferta, ofertaSinPrecio]);

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');
    await user.click(await screen.findByRole('option', { name: /bomba sumergible 1hp/i }));

    expect(await screen.findByText(/2 proveedores encontrados/i)).toBeInTheDocument();
  });

  it('muestra "Sin precio" cuando precioProveedor es null (no $0)', async () => {
    mocked.searchProductos.mockResolvedValue([bomba]);
    mocked.proveedoresPorProducto.mockResolvedValue([ofertaSinPrecio]);

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');
    await user.click(await screen.findByRole('option', { name: /bomba sumergible 1hp/i }));

    expect(await screen.findByText(/sin precio/i)).toBeInTheDocument();
    expect(screen.queryByText('$0')).not.toBeInTheDocument();
  });

  it('al seleccionar una categoría usa proveedoresPorCategoria', async () => {
    mocked.searchCategorias.mockResolvedValue([bombaCat]);
    mocked.proveedoresPorCategoria.mockResolvedValue([oferta]);

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');
    await user.click(await screen.findByRole('option', { name: /^bombas/i }));

    await waitFor(() => {
      expect(mocked.proveedoresPorCategoria).toHaveBeenCalledWith(99);
      expect(mocked.proveedoresPorProducto).not.toHaveBeenCalled();
    });
  });

  it('muestra empty state cuando no hay proveedores para la selección', async () => {
    mocked.searchProductos.mockResolvedValue([bomba]);
    mocked.proveedoresPorProducto.mockResolvedValue([]);

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');
    await user.click(await screen.findByRole('option', { name: /bomba sumergible 1hp/i }));

    expect(await screen.findByText(/no hay proveedores que ofrezcan/i)).toBeInTheDocument();
  });

  it('muestra error cuando falla el fetch de proveedores', async () => {
    mocked.searchProductos.mockResolvedValue([bomba]);
    mocked.proveedoresPorProducto.mockRejectedValue(new Error('500'));

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');
    await user.click(await screen.findByRole('option', { name: /bomba sumergible 1hp/i }));

    expect(await screen.findByText(/no se pudieron cargar los proveedores/i)).toBeInTheDocument();
  });

  it('el chip de filtro activo permite limpiar la selección', async () => {
    mocked.searchProductos.mockResolvedValue([bomba]);
    mocked.proveedoresPorProducto.mockResolvedValue([oferta]);

    const user = userEvent.setup();
    renderPage();
    await user.type(screen.getByPlaceholderText(/buscar producto o categoría/i), 'bomb');
    await user.click(await screen.findByRole('option', { name: /bomba sumergible 1hp/i }));

    await screen.findByText('Proveedor Alfa');

    const chip = screen.getByText(/producto: bomba sumergible 1hp/i).closest('.MuiChip-root');
    expect(chip).toBeTruthy();

    const deleteBtn = chip!.querySelector('[data-testid="CancelIcon"]');
    expect(deleteBtn).toBeTruthy();
    await user.click(deleteBtn!);

    await waitFor(() => {
      expect(screen.queryByText('Proveedor Alfa')).not.toBeInTheDocument();
    });
  });
});
