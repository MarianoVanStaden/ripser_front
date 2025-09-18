import React, { useEffect, useState } from 'react';
import { Fab, Fade } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

const ScrollToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Fade in={visible}>
      <Fab
        color="primary"
        size="small"
        aria-label="Volver arriba"
        onClick={handleClick}
        sx={{
          position: 'fixed',
          bottom: 125,
          right: 32,
          zIndex: 1300,
        }}
      >
        <KeyboardArrowUpIcon />
      </Fab>
    </Fade>
  );
};

export default ScrollToTopButton;