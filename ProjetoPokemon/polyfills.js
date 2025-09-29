// Polyfills para React Native
// Este arquivo deve ser importado antes de qualquer SDK que use APIs do navegador

// Polyfill para window
if (typeof global !== 'undefined' && typeof global.window === 'undefined') {
  global.window = global;
}

// Polyfill para window.calSage (erro específico do TCGdex SDK)
if (typeof global !== 'undefined' && typeof global.window !== 'undefined') {
  if (typeof global.window.calSage === 'undefined') {
    global.window.calSage = undefined;
  }
}

// Polyfill para sessionStorage
if (typeof sessionStorage === 'undefined') {
  global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0
  };
}

// Polyfill para localStorage
if (typeof localStorage === 'undefined') {
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    key: () => null,
    length: 0
  };
}

// Polyfill para window.sessionStorage
if (typeof global !== 'undefined' && typeof global.window !== 'undefined') {
  if (typeof global.window.sessionStorage === 'undefined') {
    global.window.sessionStorage = global.sessionStorage;
  }
  
  if (typeof global.window.localStorage === 'undefined') {
    global.window.localStorage = global.localStorage;
  }
}

console.log('✅ Polyfills para React Native carregados');


