import React from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import heladera404 from '../assets/heladera-404.png';
import ripserLogo from '../assets/ripser-404-logo.png';
import './NotFoundPage.css';

/**
 * Catch-all interno de la app (Route path="*"): URL sin match (bookmark
 * inválido, link viejo, typo). Diseño "heladera humanizada" del handoff
 * (export estático HTML/CSS) portado a React; estilos en NotFoundPage.css.
 */
const NotFoundPage: React.FC = () => {
  const location = useLocation();

  return (
    <main className="r404">
      <div className="r404__art">
        <img src={heladera404} alt="Vitrina Ripser sosteniendo un cartel de 404" />
      </div>

      <div className="r404__panel">
        <div className="r404__blob" />
        <div className="r404__content">
          <img className="r404__logo" src={ripserLogo} alt="Ripser Instalaciones Comerciales" />
          <div className="r404__num">404</div>
          <h1 className="r404__title">Página no encontrada</h1>
          <div className="r404__rule" />
          <p className="r404__text">Ups… la página que buscás no existe o fue movida.</p>
          <p className="r404__text">Volvé al inicio y seguimos encontrando lo que necesitás.</p>

          <div className="r404__actions">
            {/* `/` cae en DashboardEntry, que manda a cada rol a SU pantalla de
                inicio (RRHH, cobranzas, transporte, etc.) — no siempre al Dashboard. */}
            <RouterLink className="r404__btn" to="/">
              <span className="r404__home">
                <i />
                <i />
              </span>
              Ir al inicio
            </RouterLink>
          </div>

          <p className="r404__help">
            La ruta <code>{location.pathname}</code> no existe en el sistema.
          </p>
        </div>
      </div>
    </main>
  );
};

export default NotFoundPage;
