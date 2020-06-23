const { promises: fs, readFileSync } = require('fs');
const path = require('path');

const peg = require('pegjs');

const dest = path.resolve(__dirname, '../src/parsers/');
const grammar = readFileSync(require.resolve('./grammar.pegjs'), 'utf-8');

const generate = async () => {
  try {
    const parser = peg.generate(grammar, {
      output: 'source',
      format: 'commonjs',
      allowedStartRules: [
        'imports',
        'exports',
        'at_composes',
        'values',
        'selector',
        'declaration_prop',
        'declaration_value',
        'for_condition',
        'each_condition',
        'callable_declaration',
        'call_expression',
        'selector',

        // for tests
        'UnaryExpression',
        // 'BinaryExpression',
        'Expression',
        'ExpressionWithDivision',
        'ListExpression',
        'Numeric',
        'MathCallExpression',
        'Function',
        'Url',
      ],
      optimize: 'speed',
      tspegjs: {
        noTslint: true,
        customHeader: '/* eslint-disable */',
      },
      trace: true,
      plugins: [require('ts-pegjs')],
    });

    await fs.writeFile(path.join(dest, `parser.ts`), parser);
  } catch (err) {
    console.error(err);
  }
};

generate();
