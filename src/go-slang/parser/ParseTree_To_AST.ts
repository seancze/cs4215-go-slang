import { ErrorNode } from 'antlr4ts/tree/ErrorNode'
import { ParseTree } from 'antlr4ts/tree/ParseTree'
import { RuleNode } from 'antlr4ts/tree/RuleNode'
import { TerminalNode } from 'antlr4ts/tree/TerminalNode'

import { AssignNode, ASTNode, BINOP, BinOpNode, BlockNode, ExpressionListNode, ExpressionStmtNode, ExprNode, ForStmtNode, FuncAppNode, FuncDeclNode, FunctionLiteralNode, GoStmtNode, IdListNode, IfStmtNode, LiteralNode, LogicalNode, LOGOP, NameNode, ParamDeclNode, ParamListNode, ResultNode, ReturnStmtNode, SequenceNode,  SignatureNode,  StmtNode, Tag, TypeListNode, TypeNode, UNOP, UnOpNode, VarDeclNode } from '../ast/AST'

import {
  ArgumentsContext,
  Assign_opContext,
  AssignmentContext,
  BINOPContext,
  BlockContext,
  EosContext,
  ExpressionContext,
  ExpressionListContext,
  ExpressionStmtContext,
  ForStmtContext,
  FUNCAPPContext,
  FuncAppContext,
  FuncDeclContext,
  FunctionLitContext,
  Global_scopeContext,
  GoStmtContext,
  IdentifierListContext,
  IfStmtContext,
  LiteralContext,
  LOGOPContext,
  OperandContext,
  OperandNameContext,
  ParameterDeclContext,
  ParametersContext,
  PRIMARYContext,
  PrimaryExprContext,
  RELOPContext,
  ResultContext,
  ReturnStmtContext,
  SignatureContext,
  SimpleStmtContext,
  StatementContext,
  StatementListContext,
  Type_Context,
  TypeListContext,
  UNARYOPContext,
  VarDeclContext
} from '../lang/SimpleParser'
import { SimpleParserVisitor } from '../lang/SimpleParserVisitor'

export class ParseTree_To_AST implements SimpleParserVisitor<ASTNode> {
  visitGlobal_scope(ctx: Global_scopeContext): BlockNode {
    const nodes: SequenceNode = this.visitChildren(ctx);

    const mainCall: FuncAppNode = {
        tag: Tag.APP,
        fun: {tag: Tag.NAME, sym: 'main'},
        args: [],
        _arity: 0
      };
    nodes.stmts.push(mainCall);

    return {
      tag: Tag.BLOCK,
      body: nodes
    };
  }

  visitForStmt(ctx: ForStmtContext): ForStmtNode {
    return {
      tag: Tag.FOR,
      pred: this.visitExpression(ctx.expression()),
      body: this.visitBlock(ctx.block())
    };
  }

  visitFUNCAPP(ctx: FUNCAPPContext): FuncAppNode {
    //console.log("THIS IS FUNC APP: " + ctx.funcApp().IDENTIFIER().text);
    const res = this.visitFuncApp(ctx.funcApp());
    //console.log(res);
    return res;
  }

  //take note that expr here is a list of return expression and not just a singular one like in cs4215 homeworks
  visitReturnStmt(ctx: ReturnStmtContext): ReturnStmtNode {
    const expr = ctx.expressionList();
    const exprList: ExprNode[] = expr ? this.visitExpressionList(expr).list : []; 

    return {
      tag: Tag.RET,
      expr: exprList, 
      _arity: exprList.length
    };
  }

  visitIfStmt(ctx: IfStmtContext): IfStmtNode {
    // empty block by default
    let alt: BlockNode | IfStmtNode = { tag: Tag.BLOCK, body: { tag: Tag.SEQ, stmts: [] } };

    if (ctx.ELSE()) {
      let k = undefined;
      if ((k = ctx.ifStmt())) {
        alt = this.visitIfStmt(k)
      } else if ((k = ctx.block(1))) {
        alt = this.visitBlock(k)
      } else {
        //TODO: should probably throw a parsing error here
      }
    }

    return {
      tag: Tag.COND,
      pred: this.visitExpression(ctx.expression()),
      cons: this.visitBlock(ctx.block(0)),
      alt: alt
    };
  }

  visitPRIMARY(ctx: PRIMARYContext): ExprNode {
    return this.visitPrimaryExpr(ctx.primaryExpr())
  }

  visitUNARYOP(ctx: UNARYOPContext): UnOpNode {
    return {
      tag: Tag.UNOP,
      sym: ctx.EXCLAMATION() ? UNOP.BOOL_NEGATE : UNOP.INT_NEGATE,
      frst: this.visitExpression(ctx.expression())
    };
  }

  visitBINOP(ctx: BINOPContext): BinOpNode {
    // can probably refactor this but eh..... maybe next time
    const sym: BINOP = ctx._bin_op.text === "+"
                        ? BINOP.PLUS
                        : ctx._bin_op.text === "-"
                        ? BINOP.MINUS
                        : ctx._bin_op.text === "*"
                        ? BINOP.TIMES
                        : BINOP.MINUS;
    return {
      tag: Tag.BINOP,
      sym: sym,
      frst: this.visitExpression(ctx.expression()[0]),
      scnd: this.visitExpression(ctx.expression()[1])
    };
  }

  // Note: relational operators like < are treated as Binary Operations inline with prof's implementation
  visitRELOP(ctx: RELOPContext): BinOpNode {
    const sym: BINOP = ctx._rel_op.text === "<"
                        ? BINOP.LT
                        : ctx._rel_op.text === ">"
                        ? BINOP.GT
                        : ctx._rel_op.text === "<="
                        ? BINOP.LTE
                        : ctx._rel_op.text === ">="
                        ? BINOP.GTE
                        : BINOP.EQ;

    return {
      tag: Tag.BINOP,
      sym: sym,
      frst: this.visitExpression(ctx.expression()[0]),
      scnd: this.visitExpression(ctx.expression()[1])
    }
  }

  visitLOGOP(ctx: LOGOPContext): LogicalNode {
    return {
      tag: Tag.LOGOP,
      sym: ctx.LOGICAL_AND() ? LOGOP.LOGICAL_AND : LOGOP.LOGICAL_OR,
      frst: this.visitExpression(ctx.expression()[0]),
      scnd: this.visitExpression(ctx.expression()[1])
    };
  }

  visitFuncDecl(ctx: FuncDeclContext): FuncDeclNode {
    const res  = this.visitSignature(ctx.signature());

    return {
      tag: Tag.FUNC,
      sym: this.visitTerminal(ctx.IDENTIFIER()),
      prms: res.params.params,
      body: this.visitBlock(ctx.block()),
      _arity: res.params.params.length,
      paramTypes: res.params.types,
      returnTypes: res.result.resultTypes,
    };
  }

  visitSignature(ctx: SignatureContext): SignatureNode {
    const k = ctx.parameters();
    let params: ParamListNode = { tag: Tag.PARAMS, params: [], types: [] };
    if (k) {
      params = this.visitParameters(k)
    }

    const ret = ctx.result();
    let returnTypes: ResultNode = { tag: Tag.RES, resultTypes: []};
    if(ret) {
      returnTypes = this.visitResult(ret);
    }
    return { tag: Tag.SIG, params: params, result: returnTypes};
  }

  // result node unboxes the types into string
  visitResult(ctx: ResultContext): ResultNode {
    const types: string[] = [];
    let ret;
    if((ret = ctx.typeList())) {
      const r = this.visitTypeList(ret).types;
      for(let i = 0; i < r.length; ++i) {
        types.push(r[i].type);
      }
    } else if((ret = ctx.type_())) {
      types.push(this.visitType_(ret).type);
    } else {
      throw Error("unknown function result syntax")
    }
    return { tag: Tag.RES, resultTypes: types };
  }

  visitTypeList(ctx: TypeListContext) : TypeListNode {
    const res: TypeNode[] = [];
    const typeList = ctx.type_();
    const len = typeList.length;
    for(let i = 0; i < len; ++i) {
      res.push(this.visitType_(typeList[i]));
    }
    return { tag: Tag.TYPELIST, types: res };
  }

  visitType_(ctx: Type_Context): TypeNode {
    let type = undefined;
    if(ctx.BOOL()) {
      type = "bool";
    } else if(ctx.FLOAT()) {
      type = "float";
    } else if (ctx.INT()) {
      type = "int";
    } else if (ctx.STRING()){
      type = "string";
    } else {
      throw Error("unknown or undeclared type");
    }
    return { tag: Tag.TYPE, type: type };
  }

  visitParameters(ctx: ParametersContext): ParamListNode {
    const list = ctx.parameterDecl();
    const params: string[] = [];
    const types: string[] = [];
    for (let i = 0; i < list.length; ++i) {
      const res = this.visitParameterDecl(list[i]);
      for(let j = 0; j < res.IDENTS.IDENTS.length; ++j) {
        params.push(res.IDENTS.IDENTS[j]);
        types.push(res.type);
      }
    }
    return { tag: Tag.PARAMS, params: params, types: types };
  }

  visitParameterDecl(ctx: ParameterDeclContext): ParamDeclNode {
    const k = ctx.identifierList()
    if (k === undefined) return { tag: Tag.PARAMS, IDENTS: { tag: Tag.IDENTS, IDENTS: [] }, type: "nil" };

    const typeContext = ctx.type_();
    let type = "undefined";
    if(typeContext) {
      type = this.visitType_(typeContext).type;
    }

    return { tag: Tag.PARAMS, IDENTS: this.visitIdentifierList(k), type: type };
  }

  visitBlock(ctx: BlockContext): BlockNode {
    const stmts = ctx.statementList();

    return {
      tag: Tag.BLOCK,
      body: stmts == undefined ? { tag: Tag.SEQ, stmts: [] } : this.visitStatementList(stmts)
    };
  }

  /* old version keeping for fall back reasons
  visitVarDecl(ctx: VarDeclContext): VarDeclNode {
    return {
      tag: Tag.VAR,
      sym: this.visitTerminal(ctx.IDENTIFIER()),
      expr: this.visitExpression(ctx.expression())
    };
  }

  visitMultiAssignment(ctx: MultiAssignmentContext): MultiAssmtNode {
    const variables = this.visitIdentifierList(ctx.identifierList());
    const assignments = this.visitExpressionList(ctx.expressionList());

    const nodes: AssignNode[] = [];

    for (let i = 0; i < variables.IDENTS.length; ++i) {
      nodes.push({
        tag: Tag.ASSMT,
        sym: variables.IDENTS[i],
        expr: assignments.list[i]
      });
    }

    return {tag: Tag.MULTIASSMT, list: nodes };
  }

  visitAssignment(ctx: AssignmentContext): AssignNode {
    return {
      tag: Tag.ASSMT,
      sym: this.visitTerminal(ctx.IDENTIFIER()),
      expr: this.visitExpression(ctx.expression())
    };
  }
  */

visitVarDecl(ctx: VarDeclContext): VarDeclNode {
  const variables = this.visitIdentifierList(ctx.identifierList());
  const assignments = this.visitExpressionList(ctx.expressionList());
  
  const type = this.visitType_(ctx.type_()).type;

  return {tag: Tag.VAR, syms: variables, assignments: assignments , type: type};
}

visitAssignment(ctx: AssignmentContext): AssignNode {
  const variables = this.visitIdentifierList(ctx.identifierList());
  const exprs = this.visitExpressionList(ctx.expressionList());

  return {
    tag: Tag.ASSMT,
    syms: variables,
    exprs: exprs
  };
}
  

  visitIdentifierList(list: IdentifierListContext): IdListNode {
    const id: IdListNode = { tag: Tag.IDENTS, IDENTS: [] };
    const nList = list.IDENTIFIER()

    for (let i = 0; i < nList.length; ++i) {
        // TODO: check if this is correct
    //   id.push({
    //     tag: 'nam',
    //     sym: this.visitTerminal(nList[i])
    //   })
        id.IDENTS.push(this.visitTerminal(nList[i]));
    }

    return id
  }

  // unused function for now. we're only allowing = . can consider -=, +=, etc in the future
  visitAssign_op(ctx: Assign_opContext): any {
    return
  }

  visitExpression(ctx: ExpressionContext): ExprNode {
    //console.log("THIS IS IN VISIT EXPR " + ctx.ruleIndex);
    const res = ctx.accept(this);
    //console.log("in expr: ")
    //console.log(res);
    return res;
  }

  visitPrimaryExpr(ctx: PrimaryExprContext): ExprNode {
    // probably shouldnt have used k as a variable name everywhere... im a degen so we'll stick with this for now
    const k = ctx.operand();
    return this.visitOperand(k)
  }

  visitArguments(ctx: ArgumentsContext): ExpressionListNode {
    let k = undefined;
    if ((k = ctx.expressionList())) {
      return this.visitExpressionList(k)
    }
    return { tag: Tag.EXPRLIST, list: [] };
  }

  visitFuncApp(ctx: FuncAppContext): FuncAppNode {
    const argList: ExprNode[] = this.visitArguments(ctx.arguments()).list;
    let k;
    if((k = ctx.IDENTIFIER())) {
      return {
        tag: Tag.APP,
        fun: {tag: Tag.NAME, sym: this.visitTerminal(k)},
        args: argList,
        _arity: argList.length
      };
    } else if((k = ctx.functionLit())) {
      return {
        tag: Tag.APP,
        fun: this.visitFunctionLit(k),
        args: argList,
        _arity: argList.length 
      }
    } else {
      throw Error("unknown function application syntax");
    }
  }

  visitOperand(ctx: OperandContext): ExprNode {
    let k = undefined;
    if ((k = ctx.literal())) {
      return this.visitLiteral(k)
    } else if ((k = ctx.operandName())) {
      return this.visitOperandName(k)
    } else {
        k = ctx.expression();
        // should be a safe cast since Operand can only be a literal, or a name, or an expression
        return this.visitExpression(k as ExpressionContext);
    }
  }

  visitOperandName(ctx: OperandNameContext): NameNode {
    return {
      tag: Tag.NAME,
      sym: this.visitTerminal(ctx.IDENTIFIER())
    };
  }

  visitLiteral(ctx: LiteralContext): LiteralNode {
    let k = undefined
    const ret: LiteralNode = { tag: Tag.LIT, val: false};

    if ((k = ctx.NIL_LIT())) {
        ret.val = this.visitTerminal(k);
    } else if ((k = ctx.FLOAT_LIT())) {
      ret.val = parseFloat(this.visitTerminal(k));
    } else if ((k = ctx.TRUE())) {
      ret.val = true;
    } else if ((k = ctx.FALSE())) {
      ret.val = false;
    } else if ((k = ctx.string_())) {
      // string node is strange
      let str = k.RAW_STRING_LIT()
      if(str) {
        ret.val = this.visitTerminal(str);
      } else if(str = k.INTERPRETED_STRING_LIT()) {
        ret.val = this.visitTerminal(str);
      } else {
        throw Error("parser found string that is not one of the string types");
      }
      ret.val = (ret.val as string).slice(1, -1)
    } else if((k=ctx.functionLit())) {
      // we return a lam node
      return this.visitFunctionLit(k);
    } else {
        k = ctx.DECIMAL_LIT();
        // should be safe cast
        ret.val = parseInt(this.visitTerminal(k as TerminalNode), 10);
    }

    return ret;
  }

  visitFunctionLit(ctx: FunctionLitContext): FunctionLiteralNode {
    const res  = this.visitSignature(ctx.signature());

    return {
      tag: Tag.LAM,
      val: "funcLit",
      prms: res.params.params,
      body: this.visitBlock(ctx.block()),
      _arity: res.params.params.length,
      paramTypes: res.params.types,
      returnTypes: res.result.resultTypes,
    };   
  }

  visitStatementList(ctx: StatementListContext): SequenceNode {
    const stmtContextes = ctx.statement();
    const stmts: StmtNode[] = [];

    for (let i = 0; i < stmtContextes.length; ++i) {
      const res = this.visitStatement(stmtContextes[i]);
      stmts.push(res);
    }

    return {
      tag: Tag.SEQ,
      stmts: stmts
    }
  }

  visitStatement(ctx: StatementContext): StmtNode {
    let k = undefined;
    if ((k = ctx.simpleStmt())) {
      const res = this.visitSimpleStmt(k)
      return res;
    } else if ((k = ctx.ifStmt())) {
      return this.visitIfStmt(k)
    } else if ((k = ctx.returnStmt())) {
      return this.visitReturnStmt(k)
    } else if ((k = ctx.forStmt())) {
        return this.visitForStmt(k);
    } else if ((k = ctx.goStmt())) {
      return this.visitGoStmt(k);
    } else {
      k = ctx.block();
      // should be safe cast
      return this.visitBlock(k as BlockContext);
    }
  }

  visitGoStmt(ctx: GoStmtContext): GoStmtNode {
    return { tag: Tag.GO, funcApp: this.visitFuncApp(ctx.funcApp())}
  }

  visitExpressionStmt(ctx: ExpressionStmtContext): ExpressionStmtNode {
     return this.visitExpression(ctx.expression());
  }

  visitSimpleStmt(ctx: SimpleStmtContext): StmtNode {
    let k = undefined;
    if ((k = ctx.assignment())) {
      return this.visitAssignment(k)
    } else if ((k = ctx.expressionStmt())) {
      const res = this.visitExpressionStmt(k);
      return res;
    } else if ((k = ctx.varDecl())) {
      return this.visitVarDecl(k)
    } else {
        k = ctx.funcDecl();
        // should be safe cast
        return this.visitFuncDecl(k as FuncDeclContext);
    }
  }

  visitExpressionList(ctx: ExpressionListContext): ExpressionListNode {
    const list = ctx.expression();
    const exprList: ExprNode[] = [];

    for (let i = 0; i < list.length; ++i) {
      exprList.push(this.visitExpression(list[i]));
    }
    
    return { tag: Tag.EXPRLIST, list: exprList };
  }

  //unused for now
  visitEos(ctx: EosContext): any {
    return
  }

  visit(tree: ParseTree): ASTNode {
    return tree.accept(this);
  }

  /* old ver
visitChildren(node: RuleNode): SequenceNode {
    const nodes: StmtNode[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const res = node.getChild(i).accept(this)
      if (res) {
        if(res.tag == Tag.VAR) {
          nodes.push(res);
        } else if(res.tag == Tag.MULTIVAR) {
          nodes.push(...(res as MultiVarDeclNode).list);
        } else if(res.tag == Tag.FUNC){
          nodes.push(res);
        }
      }
    }
    return { tag:Tag.SEQ, stmts: nodes };
  }
  */

  // should only be used by visitGlobalScope
  visitChildren(node: RuleNode): SequenceNode {
    const nodes: StmtNode[] = [];
    for (let i = 0; i < node.childCount; i++) {
      const res = node.getChild(i).accept(this)
      if (res) {
        if(res.tag == Tag.VAR) {
          nodes.push(res);
        } else if(res.tag == Tag.FUNC){
          nodes.push(res);
        }
      }
    }
    return { tag:Tag.SEQ, stmts: nodes };
  }

  visitTerminal(node: TerminalNode): any {
    return node.toString();
  }

  visitErrorNode(node: ErrorNode): any {
    throw new Error('Method not implemented.')
  }
}
