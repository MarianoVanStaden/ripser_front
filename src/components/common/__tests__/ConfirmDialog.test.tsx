import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, userEvent } from '../../../test/renderWithProviders';
import ConfirmDialog from '../ConfirmDialog';

const setup = (props: Partial<React.ComponentProps<typeof ConfirmDialog>> = {}) => {
  const onConfirm = vi.fn();
  const onClose = vi.fn();
  const utils = renderWithProviders(
    <ConfirmDialog
      open
      title="Convertir a factura"
      description="¿Confirmás la conversión?"
      confirmLabel="Convertir"
      onConfirm={onConfirm}
      onClose={onClose}
      {...props}
    />,
  );
  return { onConfirm, onClose, ...utils };
};

describe('ConfirmDialog', () => {
  it('no renderiza nada cuando open=false', () => {
    setup({ open: false });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('muestra título, descripción, warning e itemDetails', () => {
    setup({
      warning: 'Esta acción no se puede deshacer',
      itemDetails: <span>NP-123 · Juan Pérez</span>,
    });
    expect(screen.getByText('Convertir a factura')).toBeInTheDocument();
    expect(screen.getByText('¿Confirmás la conversión?')).toBeInTheDocument();
    expect(screen.getByText(/no se puede deshacer/i)).toBeInTheDocument();
    expect(screen.getByText(/NP-123/)).toBeInTheDocument();
  });

  it('llama onConfirm al confirmar y onClose al cancelar', async () => {
    const user = userEvent.setup();
    const { onConfirm, onClose } = setup();

    await user.click(screen.getByRole('button', { name: /convertir/i }));
    expect(onConfirm).toHaveBeenCalledOnce();
    // El dialog no se cierra solo: el caller controla el ciclo tras el await.
    expect(onClose).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /cancelar/i }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  describe('guard de doble-submit (loading)', () => {
    // pointerEventsCheck:0 → user-event intenta el click aunque el botón esté
    // deshabilitado; así probamos que el handler NO se dispara (el guard real).
    const guardUser = () => userEvent.setup({ pointerEventsCheck: 0 });

    it('deshabilita Confirmar mientras loading → un segundo click no dispara la operación', async () => {
      const user = guardUser();
      const { onConfirm } = setup({ loading: true });

      const confirmBtn = screen.getByRole('button', { name: /convertir/i });
      expect(confirmBtn).toBeDisabled();

      await user.click(confirmBtn); // click sobre botón deshabilitado
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('también deshabilita Cancelar mientras loading (no se puede abandonar a mitad)', async () => {
      const user = guardUser();
      const { onClose } = setup({ loading: true });

      const cancelBtn = screen.getByRole('button', { name: /cancelar/i });
      expect(cancelBtn).toBeDisabled();
      await user.click(cancelBtn);
      expect(onClose).not.toHaveBeenCalled();
    });

    it('muestra el label de carga por defecto (confirmLabel + …)', () => {
      setup({ loading: true });
      expect(screen.getByRole('button', { name: 'Convertir…' })).toBeInTheDocument();
    });

    it('flujo real: primer click confirma, y al pasar a loading el botón queda bloqueado', async () => {
      const user = guardUser();
      const { onConfirm, rerender } = setup();

      await user.click(screen.getByRole('button', { name: /convertir/i }));
      expect(onConfirm).toHaveBeenCalledOnce();

      // El parent, en onConfirm, setea loading=true (como hace NotasPedidoPage).
      rerender(
        <ConfirmDialog
          open
          title="Convertir a factura"
          confirmLabel="Convertir"
          loading
          onConfirm={onConfirm}
          onClose={vi.fn()}
        />,
      );

      const confirmBtn = screen.getByRole('button', { name: /convertir/i });
      expect(confirmBtn).toBeDisabled();
      await user.click(confirmBtn);
      // Sigue en 1: el guard evitó el segundo documento comercial.
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });
});
