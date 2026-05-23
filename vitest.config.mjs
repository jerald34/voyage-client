export default {
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    css: {
      modules: {
        classNameStrategy: 'non-scoped',
      },
    },
  },
};
