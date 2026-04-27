import React, { useMemo } from 'react';
import {
  Box,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Tooltip,
  Link,
  Chip,
} from '@mui/material';
import type { DocumentoComercial, TipoDocumento } from '../../../types';
import { formatFechaCorta, getTipoChipProps } from './utils';

interface CadenaDocumentosStepperProps {
  /** Cadena ordenada Presupuesto -> Nota Pedido -> Factura. */
  cadena: DocumentoComercial[];
  /** Documento actualmente seleccionado dentro de la cadena. */
  currentId: number;
  /** Handler cuando el usuario clickea otro documento de la cadena. */
  onSelect: (doc: DocumentoComercial) => void;
}

const ORDEN_TIPOS: TipoDocumento[] = [
  'PRESUPUESTO',
  'NOTA_PEDIDO',
  'FACTURA',
  'NOTA_CREDITO',
];

/**
 * Mini-stepper que visualiza la cadena Presupuesto -> Nota Pedido -> Factura
 * (y opcionalmente Nota de Crédito) y permite saltar entre documentos relacionados.
 */
const CadenaDocumentosStepper: React.FC<CadenaDocumentosStepperProps> = ({
  cadena,
  currentId,
  onSelect,
}) => {
  const cadenaOrdenada = useMemo(() => {
    return [...cadena].sort(
      (a, b) =>
        ORDEN_TIPOS.indexOf(a.tipoDocumento) -
        ORDEN_TIPOS.indexOf(b.tipoDocumento),
    );
  }, [cadena]);

  if (cadenaOrdenada.length === 0) {
    return null;
  }

  const activeStep = Math.max(
    0,
    cadenaOrdenada.findIndex((d) => d.id === currentId),
  );

  return (
    <Box sx={{ mt: 1, mb: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Cadena del documento
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel>
        {cadenaOrdenada.map((doc) => {
          const tipoProps = getTipoChipProps(doc.tipoDocumento);
          const isCurrent = doc.id === currentId;
          return (
            <Step key={doc.id} completed={false}>
              <StepLabel
                StepIconProps={{
                  sx: {
                    color: isCurrent ? `${tipoProps.color}.main` : undefined,
                  },
                }}
              >
                <Box display="flex" flexDirection="column" alignItems="center" gap={0.5}>
                  <Chip
                    label={tipoProps.label}
                    color={tipoProps.color === 'default' ? undefined : tipoProps.color}
                    size="small"
                    variant={isCurrent ? 'filled' : 'outlined'}
                  />
                  <Tooltip title={`Emisión: ${formatFechaCorta(doc.fechaEmision)}`}>
                    <Box component="span">
                      {isCurrent ? (
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {doc.numeroDocumento}
                        </Typography>
                      ) : (
                        <Link
                          component="button"
                          type="button"
                          underline="hover"
                          onClick={() => onSelect(doc)}
                          sx={{ fontWeight: 500, cursor: 'pointer' }}
                        >
                          {doc.numeroDocumento}
                        </Link>
                      )}
                    </Box>
                  </Tooltip>
                </Box>
              </StepLabel>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default CadenaDocumentosStepper;
