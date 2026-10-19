import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PHASE_DEVELOPMENT_SERVER, PHASE_PRODUCTION_BUILD, PHASE_PRODUCTION_SERVER } from 'next/constants.js';
import config from '../next.config.mjs';

test('isolates development output by port without changing production output', () => {
  const previous = process.env.PORT;
  try {
    delete process.env.PORT;
    assert.equal(config(PHASE_DEVELOPMENT_SERVER).distDir, '.next-dev-3000');
    process.env.PORT = '3001';
    assert.equal(config(PHASE_DEVELOPMENT_SERVER).distDir, '.next-dev-3001');
    assert.equal(config(PHASE_PRODUCTION_BUILD).distDir, '.next');
    assert.equal(config(PHASE_PRODUCTION_SERVER).distDir, '.next');
    assert.equal(config(PHASE_PRODUCTION_BUILD).output, 'standalone');
    process.env.PORT = '../invalid';
    assert.throws(() => config(PHASE_DEVELOPMENT_SERVER), /numeric/);
  } finally {
    if (previous === undefined) delete process.env.PORT;
    else process.env.PORT = previous;
  }
});
