import { AtRule, Root } from 'postcss';

import * as Ast from '../parsers/Ast';
import { ParsedRule } from './visitor';

export type VariableMember = {
  type: 'variable';
  source?: string;
  node: Ast.ReducedExpression;
};

export type FunctionMember = {
  type: 'function';
  source?: string;
  fn: (...args: Ast.Expression[]) => Ast.ReducedExpression;
  node?: Ast.CallableDeclaration;
};

export type MixinMember = {
  type: 'mixin';
  source?: string;
  node: Ast.CallableDeclaration;
};

export type Content = {
  type: 'mixin';
  source?: string;
  node: Ast.CallableDeclaration;
};

export type ParentSelectorMember = Ast.List<Ast.List>;
export type CurrentRuleMember = ParsedRule;
export type CurrentArgumentList = Ast.ArgumentList;

export type Member = VariableMember | FunctionMember | MixinMember;

const HOIST = Symbol('children to hoist');

type Hoistable = ParsedRule | AtRule;
type RuleWithChildren = ParsedRule & { [HOIST]: WeakSet<Hoistable> };

type Identifier = Ast.Ident | Ast.Variable;

export default class Scope {
  readonly members = new Map<string, Member>();

  parent: Scope | null = null;

  private _rule: ParsedRule | null = null;

  private _arguments: Ast.ArgumentList | null = null;

  private _content: Root | null = null;

  constructor(opts: { members?: Map<string, Member> } = {}) {
    if (opts) {
      this.members = opts.members ?? new Map<string, Member>();
    }
  }

  get arguments() {
    return this._arguments || this.parent?._arguments || null;
  }

  set arguments(args: Ast.ArgumentList | null) {
    this._arguments = args;
  }

  get contentBlock() {
    return this._content || this.parent?._content || null;
  }

  set contentBlock(content: Root | null) {
    this._content = content;
  }

  get currentRule() {
    return this._rule || this.parent?.currentRule || null;
  }

  set currentRule(rule: ParsedRule | null) {
    this._rule = rule;
  }

  createChildScope() {
    const inner = new Scope();
    inner.parent = this;
    return inner;
  }

  close() {
    const { parent } = this;
    this.parent = null;
    return parent;
  }

  from(scope: Scope, namespace?: string) {
    for (const [key, value] of scope.members.entries()) {
      if (
        value.type === 'variable' ||
        value.type === 'function' ||
        value.type === 'mixin'
      )
        this.set(namespace ? `${namespace}.${key}` : key, { ...value });
    }

    return this;
  }

  // toHoist(node: ParsedRule | AtRule) {
  //   this.rule![HOIST].add(node);
  // }

  getWithScope(ident: Identifier): [Member, Scope] | [null, null] {
    const member = this.members.get(ident.toString());

    return (
      (member ? [member, this] : this.parent?.getWithScope(ident)) || [
        null,
        null,
      ]
    );
  }

  get(ident: Identifier | string): Member | undefined {
    return this.members.get(ident.toString()) ?? this.parent?.get(ident);
  }

  getVariable(ident: Ast.Variable | string) {
    const member = this.get(ident);
    return member?.type === 'variable' ? member : undefined;
  }

  getFunction(ident: Ast.Ident | string) {
    const member = this.get(ident);
    return member?.type === 'function' ? member : undefined;
  }

  getMixin(ident: Ast.Ident | string) {
    const member = this.get(ident);
    return member?.type === 'mixin' ? member : undefined;
  }

  set(ident: Identifier | string, member: Member) {
    const name = String(ident);
    if (this.members.has(name)) {
      return false;
    }

    this.members.set(name, member);

    return true;
  }

  setVariable(
    name: Ast.Variable | string,
    node: Ast.ReducedExpression,
    source?: string,
  ) {
    return this.set(typeof name === 'string' ? new Ast.Variable(name) : name, {
      type: 'variable',
      node,
      source,
    });
  }

  setFunction(name: string, fn: any, source?: string) {
    return this.set(new Ast.Ident(name), { type: 'function', fn, source });
  }

  setMixin(name: string, node: Ast.CallableDeclaration, source?: string) {
    return this.set(new Ast.Ident(name), { type: 'mixin', node, source });
  }
}
