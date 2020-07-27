import * as Ast from './Ast';
import type { Callable } from './Interop';
import type { Value } from './Values';

export type VariableMember = {
  type: 'variable';
  source?: string;
  node: Value;
};

export type ClassReferenceMember = {
  type: 'class';
  source?: string;
  identifier: string;
  selector: Ast.ClassSelector;
  composes: Ast.ClassSelector[];
};

export type FunctionMember = {
  type: 'function';
  source?: string;
  callable: Callable;
  node?: Ast.CallableDeclaration;
};

export type MixinMember = {
  type: 'mixin';
  source?: string;
  node: Ast.MixinAtRule;
};

export type Content = {
  type: 'mixin';
  source?: string;
  node: Ast.CallableDeclaration;
};

export type Member =
  | VariableMember
  | ClassReferenceMember
  | FunctionMember
  | MixinMember;

type Identifier = Ast.Ident | Ast.Variable | Ast.ClassReference;

export default class ModuleMembers extends Map<string, Member> {
  addAll(members: ModuleMembers) {
    for (const [key, item] of members) this.set(key, { ...item });
  }

  *entries() {
    yield* super.entries();
  }

  get(key: string | Identifier) {
    return super.get(`${key}`);
  }

  set(key: string | Identifier, member: Member) {
    return super.set(`${key}`, member);
  }
}