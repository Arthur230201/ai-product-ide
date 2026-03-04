/** 供 PRD bundle 使用：在浏览器中从 window.ReactDOM 取 ReactDOM */
module.exports = typeof window !== 'undefined' ? window.ReactDOM : undefined;
