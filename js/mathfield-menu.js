'use strict';

// ─────────────────────────────────────────────────────────────
// MATHFIELD MENU — Custom MathLive Context Menu
//
// Adds "Rewrite" and "Math" submenus to MathLive's context menu:
// - Rewrite: Apply CAS operations (factor, simplify, expand) to current selection
// - Math: Insert CAS operation wrappers
//
// Inspired by B. Parisse's mathfield.js (math2d.html).
// ─────────────────────────────────────────────────────────────

/**
 * Apply a CAS command to the current selection in a math-field.
 * Replaces the selected expression with the result.
 * 
 * @param {HTMLElement} mf - The math-field element
 * @param {string} command - GIAC command to apply (e.g., 'factor', 'simplify')
 */
function evalMathfieldSelection(mf, command) {
  if (!mf || typeof mf.getValue !== 'function') {
    console.error('[mathfield-menu] Invalid math-field element');
    return;
  }

  // 1. Get the selection as MathJSON
  const selectionRange = mf.selection;
  let selectionJson;
  try {
    selectionJson = mf.getValue(selectionRange, 'math-json');
  } catch (e) {
    console.error('[mathfield-menu] Failed to get selection:', e);
    return;
  }

  if (!selectionJson || selectionJson === '""' || selectionJson === 'null') {
    console.log('[mathfield-menu] No selection or empty selection');
    return;
  }

  // 2. Parse MathJSON
  let parsedJson;
  try {
    parsedJson = JSON.parse(selectionJson);
  } catch (e) {
    console.error('[mathfield-menu] Invalid MathJSON:', e);
    return;
  }

  // 3. Convert MathJSON to GIAC syntax
  if (typeof mathJsonToGiac !== 'function') {
    console.error('[mathfield-menu] mathJsonToGiac function not available');
    return;
  }
  const giacExpr = mathJsonToGiac(parsedJson);
  if (!giacExpr) {
    console.log('[mathfield-menu] Empty GIAC expression from MathJSON');
    return;
  }

  // 4. Build GIAC command: latex(command(expression))
  const giacCommand = 'latex(' + command + '(' + giacExpr + '))';
  console.log('[mathfield-menu] Evaluating:', giacCommand);

  // 5. Evaluate with GIAC
  if (typeof caseval !== 'function' || !giacReady) {
    console.error('[mathfield-menu] GIAC not ready');
    return;
  }

  let result;
  try {
    result = caseval(giacCommand);
  } catch (e) {
    console.error('[mathfield-menu] GIAC evaluation error:', e);
    return;
  }

  if (!result || result.startsWith('Error') || result.startsWith('error')) {
    console.error('[mathfield-menu] GIAC returned error:', result);
    return;
  }

  // 6. Clean up the result (remove surrounding quotes if present)
  result = result.replace(/^"|"$/g, '');
  
  // 7. Wrap in parentheses for safety
  result = '(' + result + ')';
  
  // 8. Delete the current selection
  mf.executeCommand('deleteBackward');

  // 9. Insert the result
  mf.focus();
  mf.insert(result, {
    selectionMode: 'after',
    insertionMode: 'replaceSelection',
    focus: true
  });

  console.log('[mathfield-menu] Replaced selection with:', result);
}

/**
 * Configure custom menu items for a math-field element.
 * Adds "Rewrite" and "Math" submenus for CAS operations.
 * 
 * @param {HTMLElement} mf - The math-field element to configure
 */
function configureMathfieldMenu(mf) {
  if (!mf || typeof mf.menuItems === 'undefined') {
    console.warn('[mathfield-menu] math-field does not support custom menus');
    return;
  }

  // Defer menu configuration until the element is ready
  requestAnimationFrame(() => {
    try {
      // Remove Compute Engine built-in menu items (ce-*)
      const filteredItems = (mf.menuItems || []).filter(
        item => !item.id?.startsWith('ce-')
      );

      // Build localized menu labels
      const rewriteLabel = typeof t === 'function' ? t('menuRewrite') : 'Rewrite';
      const mathLabel = typeof t === 'function' ? t('menuMath') : 'Math';
      const factorSelLabel = typeof t === 'function' ? t('menuFactorSelection') : 'Factor selection';
      const simplifySelLabel = typeof t === 'function' ? t('menuSimplifySelection') : 'Simplify selection';
      const expandSelLabel = typeof t === 'function' ? t('menuExpandSelection') : 'Expand selection';
      const factorLabel = typeof t === 'function' ? t('menuFactor') : 'Factor';
      const simplifyLabel = typeof t === 'function' ? t('menuSimplify') : 'Simplify';
      const expandLabel = typeof t === 'function' ? t('menuExpand') : 'Expand';
      const diffLabel = typeof t === 'function' ? t('menuDiff') : 'Differentiate';
      const integrateLabel = typeof t === 'function' ? t('menuIntegrate') : 'Integrate';

      // Custom menu items
      const customMenuItems = [
        {
          label: rewriteLabel,
          submenu: [
            {
              label: factorSelLabel,
              onMenuSelect: () => evalMathfieldSelection(mf, 'factor'),
            },
            {
              label: simplifySelLabel,
              onMenuSelect: () => evalMathfieldSelection(mf, 'simplify'),
            },
            {
              label: expandSelLabel,
              onMenuSelect: () => evalMathfieldSelection(mf, 'expand'),
            },
          ]
        },
        {
          label: mathLabel,
          submenu: [
            {
              label: factorLabel,
              onMenuSelect: () => mf.insert('\\operatorname{factor}\\left({#@}\\right)'),
            },
            {
              label: simplifyLabel,
              onMenuSelect: () => mf.insert('\\operatorname{simplify}\\left({#@}\\right)'),
            },
            {
              label: expandLabel,
              onMenuSelect: () => mf.insert('\\operatorname{expand}\\left({#@}\\right)'),
            },
            {
              label: diffLabel,
              onMenuSelect: () => mf.insert('\\operatorname{diff}\\left({#@}\\right)'),
            },
            {
              label: integrateLabel,
              onMenuSelect: () => mf.insert('\\operatorname{integrate}\\left({#@}\\right)'),
            },
          ]
        },
      ];

      // Merge custom items with existing menu
      mf.menuItems = [...customMenuItems, ...filteredItems];
      
      console.log('[mathfield-menu] Custom menu configured');
    } catch (e) {
      console.error('[mathfield-menu] Failed to configure menu:', e);
    }
  });
}
