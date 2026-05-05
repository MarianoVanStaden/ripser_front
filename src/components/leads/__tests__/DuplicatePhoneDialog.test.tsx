import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate before importing the component
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import { DuplicatePhoneDialog } from '../DuplicatePhoneDialog';
import type { DuplicatePhoneError } from '../../../types/lead.types';

const makeLead = (overrides: Partial<DuplicatePhoneError> = {}): DuplicatePhoneError => ({
  tipo: 'TELEFONO_DUPLICADO',
  existingId: 42,
  existingType: 'LEAD',
  existingNombre: 'Juan Pérez',
  telefono: '1112345678',
  ...overrides,
});

const renderDialog = (props: Partial<Parameters<typeof DuplicatePhoneDialog>[0]> = {}) => {
  const onClose = vi.fn();
  render(
    <MemoryRouter>
      <DuplicatePhoneDialog
        open={true}
        error={makeLead()}
        onClose={onClose}
        {...props}
      />
    </MemoryRouter>
  );
  return { onClose };
};

describe('DuplicatePhoneDialog', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('no renderiza nada cuando error es null', () => {
    render(
      <MemoryRouter>
        <DuplicatePhoneDialog open={true} error={null} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra el teléfono y el nombre del lead duplicado', () => {
    renderDialog();

    expect(screen.getByText(/1112345678/)).toBeInTheDocument();
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument();
  });

  it('muestra "lead" cuando existingType es LEAD', () => {
    renderDialog({ error: makeLead({ existingType: 'LEAD' }) });

    expect(screen.getByText('lead')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir al lead existente/i })).toBeInTheDocument();
  });

  it('muestra "cliente" cuando existingType es CLIENTE', () => {
    renderDialog({ error: makeLead({ existingType: 'CLIENTE', existingId: 99 }) });

    expect(screen.getByText('cliente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ir al cliente existente/i })).toBeInTheDocument();
  });

  it('llama a onClose al hacer click en Cancelar', () => {
    const { onClose } = renderDialog();

    fireEvent.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalledOnce();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navega a /leads/:id y llama onClose al confirmar con tipo LEAD', () => {
    const { onClose } = renderDialog({ error: makeLead({ existingId: 42, existingType: 'LEAD' }) });

    fireEvent.click(screen.getByRole('button', { name: /ir al lead existente/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/leads/42');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('navega a /clientes/detalle/:id y llama onClose al confirmar con tipo CLIENTE', () => {
    const { onClose } = renderDialog({
      error: makeLead({ existingId: 99, existingType: 'CLIENTE' }),
    });

    fireEvent.click(screen.getByRole('button', { name: /ir al cliente existente/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/clientes/detalle/99');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('no renderiza el dialog cuando open=false', () => {
    render(
      <MemoryRouter>
        <DuplicatePhoneDialog open={false} error={makeLead()} onClose={vi.fn()} />
      </MemoryRouter>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
