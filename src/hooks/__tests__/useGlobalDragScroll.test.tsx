import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { useGlobalDragScroll } from '../useGlobalDragScroll';

/**
 * jsdom no hace layout: `scrollWidth`/`clientWidth` son siempre 0. Se stubean
 * por elemento para simular un contenedor que desborda en X, que es la única
 * condición que el hook mide del DOM real.
 */
function makeScrollable(overflowX = 'auto', scrollWidth = 1000, clientWidth = 400) {
  const el = document.createElement('div');
  el.style.overflowX = overflowX;
  Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true });
  Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true });
  // scrollLeft es un no-op en jsdom: se lo hace un campo común para poder leerlo.
  let left = 0;
  Object.defineProperty(el, 'scrollLeft', {
    get: () => left,
    set: (v: number) => { left = v; },
    configurable: true,
  });
  return el;
}

const Harness = () => {
  useGlobalDragScroll();
  return null;
};

/** mousedown en `target`, arrastre de `dx` px, y mouseup. */
function drag(target: Element, dx: number) {
  target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0, clientX: 100 }));
  document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: 100 + dx }));
  document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
}

describe('useGlobalDragScroll', () => {
  let scroller: HTMLElement;
  let cell: HTMLElement;

  beforeEach(() => {
    render(<Harness />);
    scroller = makeScrollable();
    cell = document.createElement('td');
    scroller.appendChild(cell);
    document.body.appendChild(scroller);
  });

  afterEach(() => {
    scroller.remove();
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  });

  it('panea el contenedor que desborda al arrastrar', () => {
    drag(cell, -120);
    expect(scroller.scrollLeft).toBe(120);
  });

  it('ignora movimientos por debajo del umbral (es un click, no un arrastre)', () => {
    drag(cell, -2);
    expect(scroller.scrollLeft).toBe(0);
  });

  it('no dispara sobre elementos interactivos', () => {
    const button = document.createElement('button');
    scroller.appendChild(button);
    drag(button, -120);
    expect(scroller.scrollLeft).toBe(0);
  });

  it('ignora contenedores sin desborde horizontal', () => {
    const flat = makeScrollable('auto', 400, 400);
    const inner = document.createElement('td');
    flat.appendChild(inner);
    document.body.appendChild(flat);

    drag(inner, -120);
    expect(flat.scrollLeft).toBe(0);
    flat.remove();
  });

  it('ignora contenedores con overflow-x no scrollable', () => {
    const hidden = makeScrollable('hidden');
    const inner = document.createElement('td');
    hidden.appendChild(inner);
    document.body.appendChild(hidden);

    drag(inner, -120);
    expect(hidden.scrollLeft).toBe(0);
    hidden.remove();
  });

  it('respeta el opt-out data-drag-scroll en un ancestro', () => {
    const wrapper = document.createElement('div');
    wrapper.setAttribute('data-drag-scroll', 'self');
    document.body.appendChild(wrapper);
    const own = makeScrollable();
    const inner = document.createElement('td');
    own.appendChild(inner);
    wrapper.appendChild(own);

    drag(inner, -120);
    expect(own.scrollLeft).toBe(0);
    wrapper.remove();
  });

  it('suprime el click que sigue a un arrastre', () => {
    let clicked = false;
    scroller.addEventListener('click', () => { clicked = true; });

    drag(cell, -120);
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(clicked).toBe(false);
  });

  it('deja pasar el click cuando no hubo arrastre', () => {
    let clicked = false;
    scroller.addEventListener('click', () => { clicked = true; });

    drag(cell, -2);
    cell.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(clicked).toBe(true);
  });

  it('limpia los estilos de arrastre del body al soltar', () => {
    drag(cell, -120);
    expect(document.body.style.cursor).toBe('');
    expect(document.body.style.userSelect).toBe('');
  });
});
