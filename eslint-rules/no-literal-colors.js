// Anti-drift rule for the semantic-token migration: forbids literal colors
// (hex, rgb()/rgba()/hsl(), 'white'/'black') in component code. Colors must
// come from the theme (palette tokens, theme.vars, chartTokens, statusRoles).
//
// Scope/allowlist is configured in eslint.config.js (theme files, exports,
// public/print pages). One-off legitimate literals use:
//   // eslint-disable-next-line ripser/no-literal-colors -- <motivo>
//
// Severity is 'warn' while the migration is in flight; flips to 'error' in
// the final batch. The warning count doubles as the migration progress metric.

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const COLOR_FN_RE = /\b(?:rgb|rgba|hsl|hsla)\(/;
const NAMED = new Set(['white', 'black']);

const isColorLiteral = (value) =>
  typeof value === 'string' &&
  (HEX_RE.test(value) || COLOR_FN_RE.test(value) || NAMED.has(value.trim().toLowerCase()));

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow literal colors in components; use theme tokens (palette/status/charts) instead.',
    },
    schema: [],
    messages: {
      literal:
        'Color literal "{{value}}": usá un token del theme (palette, status.*, charts.*) en vez de un color hardcodeado.',
    },
  },
  create(context) {
    const report = (node, value) =>
      context.report({
        node,
        messageId: 'literal',
        data: { value: String(value).slice(0, 40) },
      });

    return {
      Literal(node) {
        if (isColorLiteral(node.value)) report(node, node.value);
      },
      TemplateElement(node) {
        const raw = node.value?.raw ?? '';
        if (HEX_RE.test(raw) || COLOR_FN_RE.test(raw)) report(node, raw);
      },
    };
  },
};
