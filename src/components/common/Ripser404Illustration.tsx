// Ilustración 404 de Ripser: heladera exhibidora convertida en mascota que se
// perdió por el camino (recorrido punteado, plano en el piso, ficha
// desenchufada). Port fiel del handoff de diseño (HTML/CSS puro, hi-fi):
// lienzo FIJO de 960x640 con coordenadas absolutas que se escala completo al
// ancho del host — NO convertir a unidades relativas. Los colores son finales
// de la pieza (no siguen el theme); el archivo está en la allowlist de
// ripser/no-literal-colors. Animaciones en Ripser404Illustration.css.
import React, { useEffect, useRef } from 'react';
import ripserLogo from '../../assets/ripser-404-logo.png';
import './Ripser404Illustration.css';

const abs = (left: number, top: number, width: number, height: number): React.CSSProperties => ({
  position: 'absolute',
  left,
  top,
  width,
  height,
});

/** Ojo con párpado (blink) y pupila (look). Se usa dos veces. */
const Eye: React.FC<{ left: number }> = ({ left }) => (
  <div
    style={{
      ...abs(left, 30, 46, 52),
      borderRadius: '23px/26px',
      overflow: 'hidden',
      background: 'linear-gradient(180deg,#FFFFFF,#F2F8FC)',
      boxShadow: 'inset 0 -3px 0 rgba(118,168,199,.18),0 2px 3px rgba(30,70,105,.08)',
    }}
  >
    <div
      style={{
        ...abs(12, 15, 22, 22),
        borderRadius: '50%',
        background: 'radial-gradient(circle at 34% 28%,#1E3A52,#101F2E 72%)',
        animation: 'rip-look 8s ease-in-out infinite',
      }}
    >
      <div style={{ ...abs(12, 3, 7, 7), borderRadius: '50%', background: '#FFFFFF', opacity: 0.92 }} />
    </div>
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(180deg,#DCEBF5,#CBE1EF)',
        transformOrigin: '50% 0',
        animation: 'rip-blink 6.4s ease-in-out infinite',
      }}
    />
  </div>
);

/** Brazo con mano; el gesto de "no sé" alterna rip-arm-l / rip-arm-r. */
const Arm: React.FC<{ left: number; anim: 'rip-arm-l' | 'rip-arm-r' }> = ({ left, anim }) => (
  <div
    style={{
      ...abs(left, 250, 26, 106),
      borderRadius: 13,
      background: 'linear-gradient(90deg,#31404F,#161F2A 72%)',
      transformOrigin: '50% 13px',
      animation: `${anim} 5.4s ease-in-out infinite`,
    }}
  >
    <div
      style={{
        position: 'absolute',
        left: -8,
        bottom: -20,
        width: 42,
        height: 42,
        borderRadius: '50%',
        background: 'radial-gradient(circle at 36% 30%,#39495F,#161F2A 74%)',
      }}
    />
  </div>
);

const Caster: React.FC<{ left: number }> = ({ left }) => (
  <div
    style={{
      ...abs(left, 412, 38, 38),
      borderRadius: '50%',
      background: 'radial-gradient(circle at 34% 30%,#3C4C5E,#131C26 70%)',
      boxShadow: 'inset 0 0 0 7px #1B2632,0 5px 9px rgba(8,38,66,.22)',
    }}
  />
);

const Ripser404Illustration: React.FC = () => {
  const hostRef = useRef<HTMLDivElement>(null);

  // Único "JS" de la pieza: escala el lienzo 960x640 al ancho disponible
  // (máx. 1) vía las CSS vars --rip-s / --rip-h, igual que el handoff.
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const fit = () => {
      const s = Math.min(1, el.clientWidth / 960);
      el.style.setProperty('--rip-s', String(s));
      el.style.setProperty('--rip-h', `${Math.round(640 * s)}px`);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={hostRef}
      className="ripser-404"
      aria-hidden="true"
      style={{ width: '100%', display: 'block', fontFamily: 'Manrope,Helvetica,Arial,sans-serif' }}
    >
      <div style={{ position: 'relative', width: '100%', height: 'var(--rip-h,640px)' }}>
        <div
          style={{
            ...abs(0, 0, 960, 640),
            transformOrigin: '0 0',
            transform: 'scale(var(--rip-s,1))',
          }}
        >
          {/* Recorrido punteado + marcador de origen */}
          <div
            style={{
              ...abs(108, 392, 330, 150),
              borderBottom: '3px dashed rgba(10,50,85,.2)',
              borderRadius: '52%',
              transform: 'rotate(-7deg)',
            }}
          />
          <div
            style={{
              ...abs(84, 498, 54, 54),
              borderRadius: '50%',
              background: 'rgba(0,80,152,.16)',
              animation: 'rip-marker 3.6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              ...abs(100, 514, 22, 22),
              borderRadius: '50%',
              background: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(10,50,85,.22),inset 0 0 0 5px #005098',
            }}
          />

          {/* Plano caído en el piso */}
          <div
            style={{
              ...abs(186, 500, 112, 76),
              borderRadius: 5,
              background: 'linear-gradient(160deg,#FFFFFF,#F1F5F8)',
              transform: 'rotate(-13deg)',
              boxShadow: '0 10px 18px rgba(10,50,85,.13)',
            }}
          >
            <div style={{ ...abs(14, 16, 64, 5), borderRadius: 3, background: '#CBD9E4' }} />
            <div style={{ ...abs(14, 31, 82, 5), borderRadius: 3, background: '#DDE6EE' }} />
            <div style={{ ...abs(14, 46, 50, 5), borderRadius: 3, background: '#DDE6EE' }} />
          </div>

          {/* Sombras de contacto */}
          <div
            style={{
              ...abs(280, 466, 400, 70),
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at 50% 50%,rgba(10,50,85,.24) 0%,rgba(10,50,85,.12) 46%,rgba(10,50,85,0) 72%)',
              animation: 'rip-shadow 7s ease-in-out infinite',
            }}
          />
          <div
            style={{
              ...abs(334, 484, 292, 34),
              borderRadius: '50%',
              background:
                'radial-gradient(ellipse at 50% 50%,rgba(8,38,66,.3) 0%,rgba(8,38,66,.1) 58%,rgba(8,38,66,0) 78%)',
            }}
          />

          {/* Ficha desenchufada */}
          <div
            style={{
              ...abs(654, 500, 62, 20),
              borderRadius: 4,
              background: 'linear-gradient(180deg,#2A3A4C,#16202B)',
              boxShadow: '0 7px 12px rgba(10,50,85,.16)',
            }}
          />
          <div style={{ ...abs(712, 504, 13, 5), borderRadius: 2, background: '#9FB2C2' }} />
          <div style={{ ...abs(712, 513, 13, 5), borderRadius: 2, background: '#9FB2C2' }} />

          {/* Personaje */}
          <div style={abs(260, 52, 440, 560)}>
            <div
              style={{
                ...abs(0, 0, 440, 560),
                transformOrigin: '50% 94%',
                animation: 'rip-idle 7s ease-in-out infinite',
              }}
            >
              {/* Cable */}
              <div
                style={{
                  ...abs(352, 352, 74, 112),
                  borderTop: '7px solid #1B2632',
                  borderRight: '7px solid #1B2632',
                  borderTopRightRadius: 74,
                }}
              />

              {/* Patas + ruedas */}
              <div
                style={{
                  ...abs(126, 398, 34, 20),
                  borderRadius: '0 0 5px 5px',
                  background: 'linear-gradient(90deg,#2B3949,#141D27)',
                }}
              />
              <div
                style={{
                  ...abs(262, 398, 34, 20),
                  borderRadius: '0 0 5px 5px',
                  background: 'linear-gradient(90deg,#2B3949,#141D27)',
                }}
              />
              <Caster left={124} />
              <Caster left={260} />

              {/* Brazos (gesto de "no sé") */}
              <Arm left={14} anim="rip-arm-l" />
              <Arm left={398} anim="rip-arm-r" />

              {/* Mueble de madera (frente) */}
              <div
                style={{
                  ...abs(40, 270, 339, 130),
                  borderRadius: '10px 3px 3px 10px',
                  overflow: 'hidden',
                  background:
                    'repeating-linear-gradient(178deg,rgba(255,255,255,.05) 0 1px,rgba(90,60,25,.05) 1px 2px,rgba(0,0,0,0) 2px 13px),linear-gradient(100deg,#CFB68F 0%,#C0A47C 42%,#AF9269 74%,#A0855C 100%)',
                }}
              >
                <div
                  style={{
                    ...abs(0, 42, 339, 3),
                    width: '100%',
                    background: 'linear-gradient(180deg,rgba(0,0,0,.09),rgba(255,255,255,.07))',
                  }}
                />
                <div
                  style={{
                    ...abs(0, 88, 339, 3),
                    width: '100%',
                    background: 'linear-gradient(180deg,rgba(0,0,0,.09),rgba(255,255,255,.07))',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 0,
                    width: '100%',
                    height: 18,
                    background: 'linear-gradient(180deg,rgba(70,45,15,.18),rgba(70,45,15,.3))',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    bottom: 18,
                    width: '100%',
                    height: 26,
                    background: 'linear-gradient(180deg,rgba(255,214,150,0),rgba(255,214,150,.16))',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    width: 16,
                    height: '100%',
                    background: 'linear-gradient(90deg,rgba(255,255,255,.14),rgba(255,255,255,0))',
                  }}
                />

                {/* Placa con el logo */}
                <div
                  style={{
                    ...abs(112, 38, 128, 44),
                    borderRadius: 7,
                    background: 'linear-gradient(180deg,#FFFFFF,#F4F7FA)',
                    boxShadow: '0 3px 6px rgba(60,40,15,.22),inset 0 0 0 1px rgba(10,50,85,.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '7px 11px',
                  }}
                >
                  <img
                    src={ripserLogo}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>

                {/* Display con segmentos de alerta */}
                <div
                  style={{
                    ...abs(34, 46, 56, 28),
                    borderRadius: 6,
                    background: 'linear-gradient(180deg,#16222F,#0D141C)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,.08),0 2px 4px rgba(60,40,15,.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                  }}
                >
                  <div
                    style={{
                      width: 10,
                      height: 4,
                      borderRadius: 2,
                      background: '#FF7A72',
                      animation: 'rip-dot 2.4s steps(1,end) infinite',
                    }}
                  />
                  <div style={{ width: 10, height: 4, borderRadius: 2, background: '#FF7A72', opacity: 0.3 }} />
                  <div
                    style={{
                      width: 10,
                      height: 4,
                      borderRadius: 2,
                      background: '#FF7A72',
                      animation: 'rip-dot 2.4s steps(1,end) infinite 1.2s',
                    }}
                  />
                </div>
              </div>

              {/* Lateral del mueble (fuga) */}
              <div
                style={{
                  ...abs(379, 270, 27, 145),
                  background: 'linear-gradient(170deg,#96794F,#7A6238 78%,#6B5530)',
                  clipPath: 'polygon(0% 0%,100% 10.3%,100% 100%,0% 89.7%)',
                }}
              />

              {/* Cenefa (tapa del mueble) */}
              <div
                style={{
                  ...abs(40, 258, 366, 31),
                  background: 'linear-gradient(100deg,#EFE2CB 0%,#DFCFAE 62%,#C4AB80 90%,#A78C5D 100%)',
                  clipPath: 'polygon(0% 0%,92.6% 0%,100% 48.4%,100% 100%,92.6% 51.6%,0% 51.6%)',
                }}
              />

              {/* Marco de la vitrina + cristal */}
              <div
                style={{
                  ...abs(40, 40, 340, 224),
                  borderRadius: '16px 3px 3px 16px',
                  background: 'linear-gradient(100deg,#27343F 0%,#1B2530 46%,#141C26 100%)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.1)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 16,
                    top: 16,
                    right: 16,
                    bottom: 16,
                    borderRadius: 9,
                    overflow: 'hidden',
                    background: 'linear-gradient(178deg,#F4FCFF 0%,#E2F2FA 46%,#CFE7F5 78%,#C2DEEF 100%)',
                    boxShadow: 'inset 0 6px 14px rgba(30,70,105,.13),inset 0 -3px 8px rgba(30,70,105,.1)',
                  }}
                >
                  {/* LED + derrame cálido */}
                  <div
                    style={{
                      ...abs(20, 7, 268, 8),
                      borderRadius: 5,
                      background: 'linear-gradient(90deg,#FFF0D2,#FFD98F 46%,#FFF0D2)',
                      boxShadow: '0 0 20px 7px rgba(255,198,112,.6)',
                      animation: 'rip-led 6s ease-in-out infinite',
                    }}
                  />
                  <div
                    style={{
                      ...abs(0, 15, 308, 64),
                      width: '100%',
                      background: 'linear-gradient(180deg,rgba(255,205,130,.22),rgba(255,205,130,0))',
                    }}
                  />

                  {/* Bandejas + tinte frío inferior */}
                  <div
                    style={{
                      ...abs(0, 122, 308, 9),
                      width: '100%',
                      background: 'linear-gradient(180deg,rgba(255,255,255,.5),rgba(118,168,199,.34))',
                    }}
                  />
                  <div
                    style={{
                      ...abs(0, 160, 308, 9),
                      width: '100%',
                      background: 'linear-gradient(180deg,rgba(255,255,255,.42),rgba(118,168,199,.26))',
                    }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      bottom: 0,
                      width: '100%',
                      height: 10,
                      background: 'linear-gradient(180deg,rgba(150,190,215,.2),rgba(120,170,200,.4))',
                    }}
                  />

                  {/* Reflejos del cristal */}
                  <div
                    style={{
                      ...abs(-58, -80, 112, 380),
                      background:
                        'linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.42),rgba(255,255,255,0))',
                      transform: 'rotate(16deg)',
                    }}
                  />
                  <div
                    style={{
                      ...abs(24, -80, 34, 380),
                      background:
                        'linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.26),rgba(255,255,255,0))',
                      transform: 'rotate(16deg)',
                    }}
                  />

                  {/* Ojos, cejas y boca */}
                  <Eye left={72} />
                  <Eye left={190} />
                  <div
                    style={{ ...abs(70, 14, 50, 7), borderRadius: 4, background: '#17293A', transform: 'rotate(-13deg)' }}
                  />
                  <div
                    style={{ ...abs(190, 20, 50, 7), borderRadius: 4, background: '#17293A', transform: 'rotate(3deg)' }}
                  />
                  <div
                    style={{
                      ...abs(132, 88, 44, 20),
                      borderBottom: '5px solid #17293A',
                      borderRadius: '0 0 24px 24px',
                    }}
                  />
                </div>
              </div>

              {/* Lateral de la vitrina (fuga) */}
              <div
                style={{
                  ...abs(379, 40, 27, 239),
                  background: 'linear-gradient(170deg,#1A242F,#101821 76%,#0C1219)',
                  clipPath: 'polygon(0% 0%,100% 6.3%,100% 100%,0% 93.7%)',
                }}
              />

              {/* Tapa superior de madera + canto claro */}
              <div
                style={{
                  ...abs(38, 22, 368, 33),
                  background: 'linear-gradient(100deg,#E7D7B8 0%,#D3BE97 60%,#B69B70 90%,#9C815A 100%)',
                  clipPath: 'polygon(0% 0%,92.7% 0%,100% 45.5%,100% 100%,92.7% 54.5%,0% 54.5%)',
                }}
              />
              <div
                style={{
                  ...abs(38, 22, 341, 4),
                  background: 'linear-gradient(90deg,rgba(255,255,255,.5),rgba(255,255,255,.18))',
                }}
              />
            </div>

            {/* El "?" flotante (fuera del wrapper de idle, como el handoff) */}
            <div
              style={{
                position: 'absolute',
                left: -16,
                top: 10,
                fontFamily: 'Manrope,Helvetica,Arial,sans-serif',
                fontWeight: 800,
                fontSize: 76,
                lineHeight: 1,
                color: '#D9922F',
                animation: 'rip-q 6s ease-in-out infinite',
              }}
            >
              ?
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ripser404Illustration;
