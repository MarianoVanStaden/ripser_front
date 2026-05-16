import { useEffect, useState } from 'react';
import {
  Box,
  MenuItem,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import CatalogoTablaCRUD from './CatalogoTablaCRUD';
import {
  areaApi,
  bandaJerarquicaApi,
  competenciaApi,
  departamentoApi,
  eppApi,
  lugarTrabajoApi,
  nivelEducacionApi,
  nivelExperienciaApi,
  nivelJerarquicoApi,
  riesgoApi,
  sectorApi,
  tipoFormacionApi,
  unidadNegocioApi,
} from '../../../api/services/catalogosApi';
import type {
  Area,
  BandaJerarquica,
  Competencia,
  CreateBandaJerarquicaPayload,
  CreateCompetenciaPayload,
  CreateDepartamentoPayload,
  CreateLugarTrabajoPayload,
  CreateNivelEducacionPayload,
  CreateNivelExperienciaPayload,
  CreateNivelJerarquicoPayload,
  CreateRiesgoPayload,
  CreateSectorPayload,
  Departamento,
  LugarTrabajo,
  NivelEducacion,
  NivelExperiencia,
  NivelJerarquico,
  Riesgo,
  Sector,
  TipoCompetencia,
  NivelSeveridad,
} from '../../../types/catalogos.types';

/**
 * Página administradora para los 13 catálogos del Manual de Puestos.
 * Cada tab usa <CatalogoTablaCRUD/> + sus extras (orden, FKs, enums).
 */
export default function CatalogosRRHHPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Catálogos — Manual de Puestos</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Listas de referencia administrables por empresa: estructura organizacional, bandas y niveles, competencias, riesgos, EPP y requerimientos formales.
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
      >
        <Tab label="Áreas" />
        <Tab label="Departamentos" />
        <Tab label="Sectores" />
        <Tab label="Unidades de Negocio" />
        <Tab label="Lugares de Trabajo" />
        <Tab label="Bandas Jerárquicas" />
        <Tab label="Niveles Jerárquicos" />
        <Tab label="Competencias" />
        <Tab label="Riesgos" />
        <Tab label="EPP" />
        <Tab label="Niveles de Educación" />
        <Tab label="Tipos de Formación" />
        <Tab label="Niveles de Experiencia" />
      </Tabs>

      {tab === 0 && (
        <CatalogoTablaCRUD
          titulo="Área"
          pluralLabel="áreas"
          api={areaApi}
        />
      )}

      {tab === 1 && <DepartamentosTab />}
      {tab === 2 && <SectoresTab />}

      {tab === 3 && (
        <CatalogoTablaCRUD
          titulo="Unidad de Negocio"
          pluralLabel="unidades de negocio"
          api={unidadNegocioApi}
        />
      )}

      {tab === 4 && (
        <CatalogoTablaCRUD<LugarTrabajo, CreateLugarTrabajoPayload>
          titulo="Lugar de Trabajo"
          pluralLabel="lugares de trabajo"
          api={lugarTrabajoApi}
          extraColumns={[{ header: 'Dirección', render: (r) => r.direccion ?? '—' }]}
          renderExtraFields={(state, update) => (
            <>
              <TextField
                label="Dirección"
                fullWidth
                value={state.direccion ?? ''}
                onChange={(e) => update({ direccion: e.target.value })}
              />
              <TextField
                label="Sucursal ID (opcional)"
                fullWidth
                type="number"
                value={state.sucursalId ?? ''}
                onChange={(e) => update({ sucursalId: e.target.value ? Number(e.target.value) : undefined })}
              />
            </>
          )}
          buildPayload={(s) => ({
            codigo: s.codigo!,
            nombre: s.nombre!,
            descripcion: s.descripcion?.trim() || undefined,
            activo: s.activo ?? true,
            direccion: s.direccion?.trim() || undefined,
            sucursalId: s.sucursalId,
          })}
        />
      )}

      {tab === 5 && (
        <CatalogoTablaCRUD<BandaJerarquica, CreateBandaJerarquicaPayload>
          titulo="Banda Jerárquica"
          pluralLabel="bandas jerárquicas"
          api={bandaJerarquicaApi}
          extraColumns={[{ header: 'Orden', render: (r) => r.orden, align: 'right' }]}
          renderExtraFields={(state, update) => (
            <TextField
              label="Orden"
              fullWidth
              type="number"
              value={state.orden ?? ''}
              onChange={(e) => update({ orden: e.target.value ? Number(e.target.value) : undefined })}
              helperText="Las bandas se ordenan ascendentemente por este valor"
            />
          )}
        />
      )}

      {tab === 6 && (
        <CatalogoTablaCRUD<NivelJerarquico, CreateNivelJerarquicoPayload>
          titulo="Nivel Jerárquico"
          pluralLabel="niveles jerárquicos"
          api={nivelJerarquicoApi}
          extraColumns={[{ header: 'Orden', render: (r) => r.orden ?? '—', align: 'right' }]}
          renderExtraFields={(state, update) => (
            <TextField
              label="Orden"
              fullWidth
              type="number"
              value={state.orden ?? ''}
              onChange={(e) => update({ orden: e.target.value ? Number(e.target.value) : undefined })}
            />
          )}
        />
      )}

      {tab === 7 && <CompetenciasTab />}

      {tab === 8 && (
        <CatalogoTablaCRUD<Riesgo, CreateRiesgoPayload>
          titulo="Riesgo"
          pluralLabel="riesgos"
          api={riesgoApi}
          extraColumns={[{ header: 'Severidad', render: (r) => r.nivelSeveridad ?? 'MEDIO' }]}
          renderExtraFields={(state, update) => (
            <TextField
              select
              label="Nivel de Severidad"
              fullWidth
              value={state.nivelSeveridad ?? 'MEDIO'}
              onChange={(e) => update({ nivelSeveridad: e.target.value as NivelSeveridad })}
            >
              <MenuItem value="BAJO">Bajo</MenuItem>
              <MenuItem value="MEDIO">Medio</MenuItem>
              <MenuItem value="ALTO">Alto</MenuItem>
              <MenuItem value="CRITICO">Crítico</MenuItem>
            </TextField>
          )}
        />
      )}

      {tab === 9 && (
        <CatalogoTablaCRUD
          titulo="EPP"
          pluralLabel="elementos de protección"
          api={eppApi}
        />
      )}

      {tab === 10 && (
        <CatalogoTablaCRUD<NivelEducacion, CreateNivelEducacionPayload>
          titulo="Nivel de Educación"
          pluralLabel="niveles de educación"
          api={nivelEducacionApi}
          extraColumns={[{ header: 'Orden', render: (r) => r.orden ?? '—', align: 'right' }]}
          renderExtraFields={(state, update) => (
            <TextField
              label="Orden"
              fullWidth
              type="number"
              value={state.orden ?? ''}
              onChange={(e) => update({ orden: e.target.value ? Number(e.target.value) : undefined })}
            />
          )}
        />
      )}

      {tab === 11 && (
        <CatalogoTablaCRUD
          titulo="Tipo de Formación"
          pluralLabel="tipos de formación"
          api={tipoFormacionApi}
        />
      )}

      {tab === 12 && (
        <CatalogoTablaCRUD<NivelExperiencia, CreateNivelExperienciaPayload>
          titulo="Nivel de Experiencia"
          pluralLabel="niveles de experiencia"
          api={nivelExperienciaApi}
          extraColumns={[
            { header: 'Años mín.', render: (r) => r.aniosMinimos ?? '—', align: 'right' },
            { header: 'Orden', render: (r) => r.orden ?? '—', align: 'right' },
          ]}
          renderExtraFields={(state, update) => (
            <Stack direction="row" spacing={2}>
              <TextField
                label="Años mínimos"
                type="number"
                fullWidth
                value={state.aniosMinimos ?? ''}
                onChange={(e) => update({ aniosMinimos: e.target.value ? Number(e.target.value) : undefined })}
              />
              <TextField
                label="Orden"
                type="number"
                fullWidth
                value={state.orden ?? ''}
                onChange={(e) => update({ orden: e.target.value ? Number(e.target.value) : undefined })}
              />
            </Stack>
          )}
        />
      )}
    </Box>
  );
}

// ======================== TABS CON DEPENDENCIA DE OTRO CATÁLOGO ========================

function DepartamentosTab() {
  const [areas, setAreas] = useState<Area[]>([]);
  useEffect(() => { void areaApi.list().then(setAreas).catch(() => setAreas([])); }, []);

  return (
    <CatalogoTablaCRUD<Departamento, CreateDepartamentoPayload>
      titulo="Departamento"
      pluralLabel="departamentos"
      api={departamentoApi}
      extraColumns={[{ header: 'Área', render: (r) => r.areaNombre ?? '—' }]}
      renderExtraFields={(state, update) => (
        <TextField
          select
          label="Área"
          fullWidth
          value={state.areaId ?? ''}
          onChange={(e) => update({ areaId: e.target.value ? Number(e.target.value) : undefined })}
        >
          <MenuItem value=""><em>— Sin área —</em></MenuItem>
          {areas.map((a) => (
            <MenuItem key={a.id} value={a.id}>{a.nombre}</MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

function SectoresTab() {
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  useEffect(() => { void departamentoApi.list().then(setDepartamentos).catch(() => setDepartamentos([])); }, []);

  return (
    <CatalogoTablaCRUD<Sector, CreateSectorPayload>
      titulo="Sector"
      pluralLabel="sectores"
      api={sectorApi}
      extraColumns={[{ header: 'Departamento', render: (r) => r.departamentoNombre ?? '—' }]}
      renderExtraFields={(state, update) => (
        <TextField
          select
          label="Departamento"
          fullWidth
          value={state.departamentoId ?? ''}
          onChange={(e) => update({ departamentoId: e.target.value ? Number(e.target.value) : undefined })}
        >
          <MenuItem value=""><em>— Sin departamento —</em></MenuItem>
          {departamentos.map((d) => (
            <MenuItem key={d.id} value={d.id}>{d.nombre}</MenuItem>
          ))}
        </TextField>
      )}
    />
  );
}

function CompetenciasTab() {
  const [niveles, setNiveles] = useState<NivelJerarquico[]>([]);
  useEffect(() => { void nivelJerarquicoApi.list().then(setNiveles).catch(() => setNiveles([])); }, []);

  return (
    <CatalogoTablaCRUD<Competencia, CreateCompetenciaPayload>
      titulo="Competencia"
      pluralLabel="competencias"
      api={competenciaApi}
      extraColumns={[
        { header: 'Tipo', render: (r) => r.tipo },
        { header: 'Nivel mín.', render: (r) => r.nivelJerarquicoMinimoNombre ?? '—' },
      ]}
      renderExtraFields={(state, update) => (
        <Stack spacing={2}>
          <TextField
            select
            label="Tipo"
            fullWidth
            required
            value={state.tipo ?? ''}
            onChange={(e) => update({ tipo: e.target.value as TipoCompetencia })}
          >
            <MenuItem value="CORPORATIVA">Corporativa</MenuItem>
            <MenuItem value="JERARQUICA">Jerárquica</MenuItem>
            <MenuItem value="FUNCIONAL">Funcional</MenuItem>
          </TextField>
          <TextField
            select
            label="Nivel jerárquico mínimo (opcional)"
            fullWidth
            value={state.nivelJerarquicoMinimoId ?? ''}
            onChange={(e) =>
              update({ nivelJerarquicoMinimoId: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <MenuItem value=""><em>— Sin requisito —</em></MenuItem>
            {niveles.map((n) => (
              <MenuItem key={n.id} value={n.id}>{n.nombre}</MenuItem>
            ))}
          </TextField>
        </Stack>
      )}
      buildPayload={(s) => {
        if (!s.tipo) return 'El tipo de competencia es obligatorio';
        return {
          codigo: s.codigo!,
          nombre: s.nombre!,
          descripcion: s.descripcion?.trim() || undefined,
          activo: s.activo ?? true,
          tipo: s.tipo,
          nivelJerarquicoMinimoId: s.nivelJerarquicoMinimoId,
        };
      }}
    />
  );
}

