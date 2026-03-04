/** 供 PRD bundle 使用：在浏览器中从 window.React 取 React，不打包 react 本体 */
module.exports = typeof window !== 'undefined' ? window.React : undefined;
