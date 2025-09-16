import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Box, TextField, Button, Alert } from "@mui/material";

export const LoginForm: React.FC = () => {
  const { login } = useAuth();
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState<string|null>(null);
  const submit=async(e:React.FormEvent)=> {
    e.preventDefault();
    try { await login(username,password); }
    catch(err:any){ setError("Credenciales inválidas"); }
  };
  return (
    <Box component="form" onSubmit={submit} sx={{maxWidth:320}}>
      {error && <Alert severity="error">{error}</Alert>}
      <TextField fullWidth label="Usuario" margin="normal" value={username} onChange={e=>setUsername(e.target.value)} />
      <TextField fullWidth label="Contraseña" type="password" margin="normal" value={password} onChange={e=>setPassword(e.target.value)} />
      <Button variant="contained" type="submit" fullWidth sx={{mt:2}}>Ingresar</Button>
    </Box>
  );
};