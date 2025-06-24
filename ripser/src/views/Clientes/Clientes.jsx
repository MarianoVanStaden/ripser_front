import { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import GestionClientes from './GestionClientes';
import CreditosPersonales from './CreditosPersonales';
import CuentaCorriente from './CuentaCorriente';
import CarpetaCliente from './CarpetaCliente';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ width: '100%' }}>
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

export default function Clientes() {
  const [tab, setTab] = useState(0);

  const handleTabChange = (_, newValue) => setTab(newValue);

  return (
    <Box
      sx={{
        marginLeft: '290px',
        padding: 2,
        background: '#f5f5f5',
        minHeight: '100vh'
      }}
    >
      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="Gestión" />
        <Tab label="Créditos Personales" />
        <Tab label="Cuenta Corriente" />
        <Tab label="Carpeta del Cliente" />
      </Tabs>
      <TabPanel value={tab} index={0}><GestionClientes /></TabPanel>
      <TabPanel value={tab} index={1}><CreditosPersonales /></TabPanel>
      <TabPanel value={tab} index={2}><CuentaCorriente /></TabPanel>
      <TabPanel value={tab} index={3}><CarpetaCliente /></TabPanel>
    </Box>
  );
}