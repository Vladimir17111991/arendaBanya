import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Linter } from 'eslint';
import fsd, { checkFsdImport } from '../eslint.fsd.js';

const source = (file) => fileURLToPath(new URL(`../src/${file}`, import.meta.url));

test('FSD accepts lower-layer public APIs and private imports within a slice', () => {
  const allowed = [
    ['pages/cabinet/ui/CabinetView.vue', '../../../features/manage-clients/index.ts'],
    ['features/manage-clients/ui/ClientsPanel.vue', '../../../entities/practice/index'],
    ['features/manage-clients/ui/ClientsPanel.vue', '../../../entities/practice'],
    ['features/book-appointment/ui/BookingForm.vue', '../model/useBookingForm.ts'],
    ['features/book-appointment/index.ts', './ui/BookingForm.vue'],
    ['app/ui/AppShell.vue', '../providers/useSiteNavigation.ts'],
    ['shared/ui/SectionLink.vue', '../routing/index.ts'],
    ['widgets/work-gallery/ui/WorkGallery.vue', '../../../shared/lib/scroll/index.ts'],
    ['pages/booking/ui/BookingView.vue', '../../../features/book-appointment/model.ts'],
  ];
  for (const [file, dependency] of allowed) {
    assert.equal(checkFsdImport(source(file), dependency), null, `${file}: ${dependency}`);
  }
});

test('FSD rejects upward, sibling, private API and own-barrel imports', () => {
  const rejected = [
    [
      'entities/practice/model/practice.ts',
      '../../../features/book-appointment/index.ts',
      'upward',
    ],
    ['features/manage-clients/ui/ClientsPanel.vue', '../../manage-catalog/index.ts', 'sibling'],
    ['pages/home/ui/ServicesView.vue', '../../cabinet/index.ts', 'sibling'],
    [
      'widgets/work-gallery/ui/WorkGallery.vue',
      '../../../entities/practice/model/practice.ts',
      'private',
    ],
    ['features/book-appointment/ui/BookingForm.vue', '../index.ts', 'selfPublic'],
    ['shared/ui/SectionLink.vue', '../../entities/practice/index.ts', 'upward'],
  ];
  for (const [file, dependency, expected] of rejected) {
    assert.equal(checkFsdImport(source(file), dependency), expected, `${file}: ${dependency}`);
  }
});

test('ESLint enforces FSD for imports, re-exports and lazy imports', () => {
  const linter = new Linter();
  const config = { plugins: { fsd }, rules: { 'fsd/boundaries': 'error' } };
  const filename = source('features/manage-clients/ui/example.js');
  for (const code of [
    "import { App } from '../../../app/index.ts';",
    "export { App } from '../../../app/index.ts';",
    "export * from '../../../app/index.ts';",
    "const lazy = () => import('../../../app/index.ts');",
  ]) {
    const messages = linter.verify(code, config, { filename });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].ruleId, 'fsd/boundaries');
    assert.equal(messages[0].messageId, 'upward');
  }
});
