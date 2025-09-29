// Polyfills para React Native
import 'react-native-url-polyfill/auto';

// Polyfill para APIs do navegador no React Native
if (typeof global !== 'undefined') {
  // Garantir que window existe
  if (typeof global.window === 'undefined') {
    global.window = {};
  }
  
  // Polyfill para calSage (erro específico do SDK)
  if (typeof global.window.calSage === 'undefined') {
    global.window.calSage = undefined;
  }
  
  // Polyfill para sessionStorage
  if (typeof global.window.sessionStorage === 'undefined') {
    global.window.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };
  }
  
  // Polyfill para localStorage se necessário
  if (typeof global.window.localStorage === 'undefined') {
    global.window.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };
  }
  
  // Polyfill para URL se necessário
  if (typeof global.URL === 'undefined') {
    global.URL = require('react-native-url-polyfill/auto').URL;
  }
  
  // Polyfill para fetch se necessário
  if (typeof global.fetch === 'undefined') {
    global.fetch = require('react-native-url-polyfill/auto').fetch;
  }
}

console.log('Polyfills carregados com sucesso');
