'use strict';

// Shared application state
let cellCounter = 0;
let cells = [];
let showDebug = false;
let reactiveMode = true;
let observableRuntime = null;
let observableModule = null;
let cellVariableMap = new Map();   // cellId → { variable, defines, references }
let variableOwnerMap = new Map();  // variableName → cellId
let viewMode = 'code';             // 'code' | 'report'
let currentKernel = 'giac-js';     // active kernel ID
let defaultKernel = 'giac-js';     // user's default kernel preference (persisted in localStorage)

/**
 * KaTeX "trust" setting for formulas from notebooks and results (SEC-003):
 * only \href and \url to http(s) addresses; no \htmlClass, \includegraphics, …
 */
var KATEX_TRUST = function(context) {
  return (context.command === '\\href' || context.command === '\\url') && (context.protocol === 'http' || context.protocol === 'https');
};
