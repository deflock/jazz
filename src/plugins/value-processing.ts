import postcss from 'postcss';

import Parser from '../parsers';
import * as Ast from '../parsers/Ast';
import { PostcssPlugin } from '../types';
import Scope from '../utils/Scope';
import { isVariableDeclaration } from '../utils/Variables';
import { Reducer } from '../utils/evaluate';

// const ParseCache = new WeakMap<postcss.Node, T>()

const valueProcessingPlugin: PostcssPlugin = (css, { opts }) => {
  const { files, from } = opts;
  const file = files[from!];

  const parser = Parser.get(css);

  const members = file.scope || (file.scope = new Scope());
  const reducer = new Reducer(members);

  css.walk((node) => {
    if (node.type === 'decl') {
      const parsed = reducer.reduce(parser.value(node));

      node.value = parsed.toString();

      if (isVariableDeclaration(node.prop)) {
        const name = node.prop.slice(1);
        // if (name in values) {
        //   throw node.error(
        //     `Cannot redefine an existing variable: ${node.prop}`,
        //     {
        //       word: node.prop,
        //     },
        //   );
        // }

        members.setVariable(name, parsed.body.clone());

        node.remove();
      } else {
        node.prop = reducer.reduce(parser.prop(node)).toString();
      }
    }
  });

  // file.values = values;
};

// importsPlugin.postcssPlugin = 'modular-css-values-local';

export default valueProcessingPlugin;
