// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, act, cleanup } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';

let cart: ReturnType<typeof useCart>;

function Capture() {
  cart = useCart();
  return null;
}

const renderCart = () => render(
  <CartProvider>
    <Capture />
  </CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  it('starts empty', () => {
    renderCart();
    expect(cart.items).toHaveLength(0);
    expect(cart.getCount()).toBe(0);
    expect(cart.getTotal()).toBe(0);
  });

  it('adds an item and reports count/total', () => {
    renderCart();
    act(() => {
      cart.addItem({ id: 1, variant: 1, price: 15000, url: 'photo.jpg', startNo: '101', eventName: 'Grand Prix' });
    });
    expect(cart.items).toHaveLength(1);
    expect(cart.getCount()).toBe(1);
    expect(cart.getTotal()).toBe(15000);
    expect(cart.isInCart(1, 1)).toBe(true);
  });

  it('does not add duplicate photo+variant', () => {
    renderCart();
    act(() => {
      cart.addItem({ id: 1, variant: 1, price: 15000, url: 'photo.jpg', startNo: '101', eventName: 'Grand Prix' });
      cart.addItem({ id: 1, variant: 1, price: 15000, url: 'photo.jpg', startNo: '101', eventName: 'Grand Prix' });
    });
    expect(cart.getCount()).toBe(1);
  });

  it('removes an item', () => {
    renderCart();
    act(() => {
      cart.addItem({ id: 1, variant: 1, price: 15000, url: 'photo.jpg', startNo: '101', eventName: 'Grand Prix' });
    });
    act(() => {
      cart.removeItem(1, 1);
    });
    expect(cart.items).toHaveLength(0);
    expect(cart.isInCart(1, 1)).toBe(false);
  });

  it('clears the cart and localStorage', () => {
    renderCart();
    act(() => {
      cart.addItem({ id: 1, variant: 1, price: 15000, url: 'photo.jpg', startNo: '101', eventName: 'Grand Prix' });
    });
    act(() => {
      cart.clearCart();
    });
    expect(cart.items).toHaveLength(0);
    expect(localStorage.getItem('racephoto_cart')).toBe('[]');
  });
});
