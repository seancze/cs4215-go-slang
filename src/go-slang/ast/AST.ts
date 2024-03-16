//Constants
export enum Tag {
    BLOCK = "blk",
    VAR = "let",
    ASSMT = "assmt",
    FUNC = "fun",
    COND = "cond",
    RET = "ret",
    FOR = "while",
    SEQ = "seq",
    APP = "app",
    NAME = "nam",
    LIT = "lit",
    BINOP = "binop",
    UNOP = "unop",
    LOGOP = "LOG",
    PARAMS = "params",
    IDENTS = "idents",
    MULTIVAR = "multivar",
    MULTIASSMT = "multiassmt",
    EXPRLIST = "exprlist",
    STMTLIST = "stmtlist",
}

export enum LOGOP {
    LOGICAL_AND = "&&",
    LOGICAL_OR = "||"
}

export enum UNOP {
    INT_NEGATE = '-',
    BOOL_NEGATE = '!',
}

export enum BINOP {
    PLUS = '+',
    MINUS = '-',
    TIMES = '*',
    DIV = '/',
    LT = '<',
    GT = '>',
    LTE = '<=',
    GTE = '>=',
    EQ = '=='
}

export interface ASTNode {
   tag: string; 
}

// To make visitor work
export interface ParamListNode extends ASTNode {
    tag: Tag.PARAMS;
    params: string[];
}

export interface IdListNode extends ASTNode {
    tag: Tag.IDENTS;
    IDENTS: string[];
}

export interface MultiVarDeclNode extends ASTNode {
    tag: Tag.MULTIVAR;
    list: VarDeclNode[];
}

export interface MultiAssmtNode extends ASTNode {
    tag: Tag.MULTIASSMT;
    list: AssignNode[];
}

export interface ExpressionListNode extends ASTNode {
    tag: Tag.EXPRLIST;
    list: ExprNode[];
}

export interface StmtListNode extends ASTNode {
    tag: Tag.STMTLIST;
    list: StmtNode[];
}


// statements

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface StmtNode extends ASTNode {}

export interface SequenceNode extends ASTNode {
    tag: Tag.SEQ;
    body: StmtNode[];
}

export interface BlockNode extends StmtNode {
    tag: Tag.BLOCK;
    body: SequenceNode | StmtNode;
}

export interface VarDeclNode extends StmtNode {
    tag: Tag.VAR;
    sym: string;
    expr: ExprNode;
    //const isConst = false;
}

export interface ConstDeclNode extends StmtNode {
    tag: Tag.VAR;
    sym: string;
    expr: ExprNode;
    //const isConst = false;
}

export interface AssignNode extends StmtNode {
    tag: Tag.ASSMT;
    sym: string
    expr: ExprNode;
}

export interface FuncDeclNode extends StmtNode {
    tag: Tag.FUNC;
    sym: string;
    prms: string[];
    body: BlockNode;
    _arity: Number;
}

export interface IfStmtNode extends StmtNode {
    tag: Tag.COND;
    pred: ExprNode;
    cons: BlockNode;
    alt: BlockNode | IfStmtNode;
}

export interface ReturnStmtNode extends StmtNode {
    tag: Tag.RET;
    expr: ExprNode[];
    _arity: Number;
}

export interface ForStmtNode extends StmtNode {
    tag: Tag.FOR;
    pred: ExprNode;
    body: BlockNode;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExpressionStmtNode extends StmtNode {}

// expression

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ExprNode extends ASTNode {}

export interface LiteralNode extends ExprNode {
    tag: Tag.LIT;
    val: Number | boolean;
}

export interface NameNode extends ExprNode {
    tag: Tag.NAME;
    sym: string;
}

export interface FuncAppNode extends ExprNode, ExpressionStmtNode {
    tag: Tag.APP;
    fun: NameNode;
    args: ExprNode[];
    _arity: Number;
}

export interface BinOpNode extends ExprNode, ExpressionStmtNode {
    tag: Tag.BINOP;
    sym: BINOP;
    frst: ExprNode;
    scnd: ExprNode;
}

export interface UnOpNode extends ExprNode, ExpressionStmtNode {
    tag: Tag.UNOP;
    sym: UNOP;
    frst: ExprNode;
}

export interface LogicalNode extends ExprNode, ExpressionStmtNode {
    tag: Tag.LOGOP;
    sym: LOGOP;
    frst: ExprNode;
    scnd: ExprNode;    
}