import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceRoot = fileURLToPath(new URL('./src/', import.meta.url));
const layers = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];
const extraPublicEntries = new Set(['features/book-appointment/model.ts']);

function describe(filename) {
  const relative = path.relative(sourceRoot, filename).replaceAll('\\', '/');
  const [layer, slice, library] = relative.split('/');
  if (!layers.includes(layer)) return null;
  const unit =
    layer === 'app'
      ? layer
      : layer === 'shared' && slice === 'lib'
        ? `${layer}/${slice}/${library}`
        : `${layer}/${slice}`;
  return { relative, layer, unit, rank: layers.indexOf(layer) };
}

export function checkFsdImport(filename, source) {
  if (typeof source !== 'string' || !source.startsWith('.')) return null;
  const origin = describe(filename);
  const target = describe(path.resolve(path.dirname(filename), source));
  if (!target) return null;
  // Imports may omit .ts and index.ts, just as Vite's resolver allows.
  const entry = target.relative.replace(/\.ts$/, '').replace(/\/index$/, '');
  const isPublic = entry === target.unit || extraPublicEntries.has(target.relative);

  if (origin) {
    if (target.rank < origin.rank) return 'upward';
    if (origin.layer === target.layer) {
      if (origin.unit === target.unit) {
        if (isPublic && origin.relative !== target.relative) return 'selfPublic';
        return null;
      }
      if (!['app', 'shared'].includes(origin.layer)) return 'sibling';
    }
  }
  return isPublic ? null : 'private';
}

export default {
  rules: {
    boundaries: {
      meta: {
        type: 'problem',
        schema: [],
        messages: {
          upward: 'FSD: a module may import only its own slice or a lower layer.',
          sibling: 'FSD: slices on the same layer must not import each other.',
          private: 'FSD: import through the target module’s public API (index.ts).',
          selfPublic: 'FSD: use a direct relative import inside a module, not its own public API.',
        },
      },
      create(context) {
        function check(node) {
          const source = node.source ?? node.argument;
          if (!source || typeof source.value !== 'string') return;
          const messageId = checkFsdImport(context.filename, source.value);
          if (messageId) context.report({ node: source, messageId });
        }
        return {
          ImportDeclaration: check,
          ExportNamedDeclaration: check,
          ExportAllDeclaration: check,
          ImportExpression: check,
          TSImportType: check,
        };
      },
    },
  },
};
