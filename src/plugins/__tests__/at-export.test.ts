import path from 'path';

import postcss from 'postcss';

import * as Ast from '../../parsers/Ast';
import Scope from '../../utils/Scope';
import { EXPORTS } from '../../utils/Symbols';
import plugin from '../at-export';

describe('@export', () => {
  function run(css: string, opts: any) {
    return postcss(plugin).process(css, {
      parser: require('postcss-scss'),
      from: '/foo.js',
      resolve: (from: string, to: string) => {
        return path.join(path.dirname(from), to);
      },
      ...opts,
    } as any);
  }

  it.each([
    [
      `@export $bar, $foo from './other'`,

      new Map([
        ['$bar', { type: 'variable', node: new Ast.Numeric(1, 'px') }],
        ['$foo', { type: 'variable', node: new Ast.Color('red') }],
      ]),
    ],
    [
      `@export * from './other'`,
      new Map([
        ['$bar', { type: 'variable', node: new Ast.Numeric(1, 'px') }],
        ['$foo', { type: 'variable', node: new Ast.Color('red') }],
      ]),
    ],
    [
      `@export $bar as $baz, $foo;`,
      new Map([
        ['$baz', { type: 'variable', node: new Ast.Numeric(1, 'px') }],
        ['$foo', { type: 'variable', node: new Ast.Color('red') }],
      ]),
      new Map([
        ['$bar', { type: 'variable', node: new Ast.Numeric(1, 'px') }],
        ['$foo', { type: 'variable', node: new Ast.Color('red') }],
      ]),
    ],
  ])(
    'should export variables for: %s',
    async (css, expected, local: any = {}) => {
      const exports = new Scope();

      await run(css, {
        resolve: (from: string, to: string) => {
          return path.join(path.dirname(from), to);
        },
        files: {
          '/foo.js': {
            [EXPORTS]: exports,
            scope: new Scope({ members: local }),
          },
          '/other': {
            [EXPORTS]: new Scope({
              members: new Map([
                ['$bar', { type: 'variable', node: new Ast.Numeric(1, 'px') }],
                ['$foo', { type: 'variable', node: new Ast.Color('red') }],
              ]),
            }),
          },
        },
      } as any);

      const result: any = new Map();
      expected.forEach((value, key) => {
        result.set(key, expect.objectContaining(value));
      });

      expect(exports.members).toEqual(result);
    },
  );

  it.each([
    // [`@export $bar, $foo from './none'`, '"./none" does not export anything'],
    [`@export $baz, $foo from './other'`, '"./other" does not export $baz'],
    [`@export ( $baz );`, 'There is no local $baz declared.'],
  ])('should throw variables for: %s', async (css, error) => {
    await expect(() =>
      run(css, {
        resolve: (from: string, to: string) => {
          return path.join(path.dirname(from), to);
        },
        files: {
          '/foo.js': { scope: new Scope() },
          '/other': {
            [EXPORTS]: new Scope({
              members: new Map([
                ['$bar', { type: 'variable', node: new Ast.Numeric(1, 'px') }],
                ['$foo', { type: 'variable', node: new Ast.Color('red') }],
              ]),
            }),
          },
          '/none': { [EXPORTS]: new Scope() },
        },
      } as any),
    ).rejects.toThrowError(error);
  });
});
