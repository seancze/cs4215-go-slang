import { ASTNode } from "../../ast/AST"
import { parse } from "../../parser/parser"
import { typecheck } from "../typechecker"
describe('Basic typecheck test', () => {
  test('basic correct var tests outside func body', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a string = "hello"
        var b bool = true
        var f float = 1.1
        var mut1,mut2 Mutex = mutex
        var wg WaitGroup = mutex
        var xx int = x
        func main() {
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic correct var tests in func body', async () => {
    const program = `
      func main() {
        var x, y, z int = 1, 2, 3
        a string := "hello"
        var b bool = true
        var f float = 1.1
        var mut1,mut2 Mutex = mutex
        var wg WaitGroup = mutex
        xx int := x
      }
        `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic incorrect var tests outside func body', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a string = 1
        var b bool = true
        var f float = 1.1
        func main() {
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in variable declaration; declared type: string, actual type: int")
  });
  test('basic incorrect var tests in func body', async () => {
    const program = `
      func main() {
        var x, y, z int = 1, 2, 3
        a string := "hello"
        var b bool = 1
        var f float = 1.1
      }
        `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in variable declaration; declared type: bool, actual type: int")
  });

  test('basic incorrect number of var expressions outside func body', async () => {
    const program = `
        var x, y, z int = 1, 2
        var b bool = true
        var f float = 1.1
        func main() {
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too few expressions on the RHS of variable declaration!")
  });

  test('basic incorrect number of var expressions tests in func body', async () => {
    const program = `
      func main() {
        var x, y, z int = 1, 2
        a string := "hello"
        var f float = 1.1
      }
        `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too few expressions on the RHS of variable declaration!")
  });

  test('basic incorrect number of var expressions outside func body', async () => {
    const program = `
        var x, y, z int = 1, 2, 3, 4
        var b bool = true
        var f float = 1.1
        func main() {
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too many expressions on the RHS of variable declaration!")
  });

  test('basic incorrect number of var expressions tests in func body', async () => {
    const program = `
      func main() {
        var x, y, z int = 1, 2, 3, 4
        a string := "hello"
        var f float = 1.1
      }
        `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too many expressions on the RHS of variable declaration!")
  });

  test('basic function app', async () => {
    const program = `
        func inc() int {
            return 1
        }
        func main() {
          var x, y, z int = inc(), 2, 3
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic function app incorrect number of return', async () => {
    const program = `
        func inc() int {
            return 1
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too few expressions on the RHS of variable declaration!")
  });
  test('basic function app correct number of return', async () => {
    const program = `
        func inc() (int, int, int) {
            return 1, 2, 3
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow("Too many expressions on the RHS!")
  });
  test('basic function declaration incorrect return', async () => {
    const program = `
        func inc() (int, int, string) {
            return 1, 2, 3
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("expected return types int, int, string but got int, int, int in function inc")
  });
  test('basic function declaration correct return', async () => {
    const program = `
        func inc() (int, int, int) {
            return 1, 2, 3
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow("expected return types int, int, string but got int, int, int in function inc")
  });
  test('basic function app but sequence does not end in terminating statement', async () => {
    const program = `
        func inc() (int, int, int) {
            return 1, 2, 3
            var x int = 1
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in function declaration; expected return type: int, int, int actual return type: null")
  });
  test('basic conditional statement non terminating but correct return', async () => {
    const program = `
        func inc() (int, int, int) {
            x int:= 1
            if x < 1 {
                return 11, 22, 33
            }
            return 1, 2, 3
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).not.toThrow();
  });
  
  test('basic conditional statement non terminating but incorrect return', async () => {
    const program = `
        func inc() (int, int, int) {
            x int:= 1
            if x < 1 || x < 2 {
                return "hello"
            }
            return 1, 2, 3
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("expected return types int, int, int but got string in function inc");
  });

  test('basic conditional statement terminating correct return', async () => {
    const program = `
        func inc() (int, int, int) {
            x int:= 1
            if x < 1 {
                return 11, 22, 33
            } else if x < 1 || x < 2 {
                return 21, 22, 23
            } else {
                return 31, 32, 33
            }
            return 1, 2, 3
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic conditional statement terminating incorrect return', async () => {
    const program = `
        func inc() (int, int, int) {
            x int:= 1
            if x < 1 {
                return 11, 22, 33
            } else if x < 1 || x < 2 {
                return 21, 22
            } else {
                return 31, 32, 33
            }
            return 1, 2, 3
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("expected return types int, int, int but got int, int in function inc")
  });

  test('basic conditional statement make sure it is non terminating but correct return', async () => {
    const program = `
        func inc() (int, int, int) {
            x int:= 1      
            return 1, 2, 3
            if x < 1 {
                return 11, 22, 33
            }
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("type error in function declaration; expected return type: int, int, int actual return type: null");
  });

  test('basic conditional statement make sure it is non terminating with else branch but correct return', async () => {
    const program = `
        func inc() (int, int, int) {
            x int:= 1      
            return 1, 2, 3
            if x < 1 {
                return 11, 22, 33
            } else {
              y int := x
            }
        }
        func main() {
          var x, y, z int = inc()
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("type error in function declaration; expected return type: int, int, int actual return type: null");
  });

  test('basic lambda', async () => {
    const program = `
        func main() {
          var x, y, z int = func(a, b, c int) (int, int, int) {
            return a,b,c
          }(1,2,3)
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).not.toThrow("type error in function declaration; expected return type: int, int, int actual return type: null");
  });

  test('basic lambda with wrong body', async () => {
    const program = `
        func main() {
          var x, y, z int = func(a, b, c int) int {
            return a,b,c
          }(1,2,3)
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("expected return types int but got int, int, int in function lambda");
  });

  test('basic lambda with wrong args', async () => {
    const program = `
        func main() {
          var x, y, z int = func(a, b, c int) (int, int, int) {
            return a,b,c
          }(1,2,"world")
          a string := "hello"
          var f float = 1.1
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("type error in application; expected argument types: int, int, int, actual argument types: int, int, string");
  });

  test('basic for statement predicate is bool literal', async () => {
    const program = `
        func main() {
          for true {

          }
        }
          `
    const outputAst: ASTNode = parse(program)
    console.dir(outputAst, { depth: 100 })
    expect(() => typecheck(outputAst)).not.toThrow("expected predicate type: bool, actual predicate type: undefined");
  });

  test('basic for statement predicate is bool', async () => {
    const program = `
        func main() {
          x int := 1
          for x < 1 || x < 2 {

          }
        }
          `
    const outputAst: ASTNode = parse(program)
    console.dir(outputAst, { depth: 100 })
    expect(() => typecheck(outputAst)).not.toThrow("expected predicate type: bool, actual predicate type: undefined");
  });

  test('basic for statement predicate is not bool', async () => {
    const program = `
        func main() {
          x int := 1
          for x {

          }
        }
          `
    const outputAst: ASTNode = parse(program)
    console.dir(outputAst, { depth: 100 })
    expect(() => typecheck(outputAst)).toThrow("expected predicate type: bool, actual predicate type: int");
  });

  test('basic for statement predicate is not bool expr', async () => {
    const program = `
        func main() {
          x int := 1
          for x + 3 / 2 % 6 {

          }
        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("expected predicate type: bool, actual predicate type: int");
  });

  test('basic for statement has correct return statement in body', async () => {
    const program = `
        func inc() int {
          x int := 1
          for x < 3{
            return 1
          }
          return x
        }
        func main() {

        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).not.toThrow();
  });

  test('basic for statement has incorrect return statement in body', async () => {
    const program = `
        func inc() int {
          x int := 1
          for x < 3{
            return "hi"
          }
          return x
        }
        func main() {

        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("expected return types int but got string in function inc");
  });

  test('basic for statement is not a terminating statement in body', async () => {
    const program = `
        func inc() int {
          x int := 1
          for x < 3 {
            return 1
          }
        }
        func main() {

        }
          `
    const outputAst: ASTNode = parse(program)
    //console.dir(outputAst, {depth: 100})
    expect(() => typecheck(outputAst)).toThrow("type error in function declaration; expected return type: int actual return type: null");
  });

  test('basic correct var outside func body and assign inside func body', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a string = "hello"
        var b bool = true
        var f float = 1.1
        var mut1,mut2 Mutex = mutex
        var wg1, wg2 WaitGroup = mutex
        var xx int = x
        func main() {
          x = 2
          a = "world"
          y,z,b,f,mut1, wg1, wg2 = x, 6, false, 3.3, mut2, wg2, wg1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic correct var tests in func body and assign inside func body', async () => {
    const program = `
      func main() {
        var x, y, z int = 1, 2, 3
        a string := "hello"
        var b bool = true
        var f float = 1.1
        var mut1,mut2 Mutex = mutex
        var wg1,wg2 WaitGroup = mutex
        xx int := x

        x = 2
        a = "world"
        y,z,b,f,mut1, wg1, wg2 = x, 6, false, 3.3, mut2, wg2, wg1
      }
        `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic correct var tests outside func body but incorrect assign inside func body', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a string = "hello"
        var b bool = true
        var f float = 1.1
        var mut1,mut2 Mutex = mutex
        var wg1,wg2 WaitGroup = mutex
        func main() {
          x = 2
          a = "world"
          y,z,b,f,mut1 = x, 6, false, 3.3, wg2
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in assignment; declared type: mutex, actual type: waitgroup")
  });

  test('basic correct var tests inside func body but incorrect assign inside func body', async () => {
    const program = `
        
        func main() {
          var x, y, z int = 1, 2, 3
          var a string = "hello"
          var b bool = true
          var f float = 1.1
          var mut1,mut2 Mutex = mutex
          var wg1,wg2 WaitGroup = mutex

          x = 2
          a = "world"
          y,z,b,f,mut1 = x, 6, false, 3.3, wg2
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in assignment; declared type: mutex, actual type: waitgroup")
  });

  test('basic incorrect number of assignment expressions inside func body with var declaration outside of func body', async () => {
    const program = `
        var x, y int = 1, 2
        var b bool = true
        var f float = 1.1
        func main() {
          x, b, f = 10
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too few expressions on the RHS of assignment!")
  });

  test('basic incorrect number of assignment expressions inside func body with var declaration inside of func body', async () => {
    const program = `
      func main() {
        var x, y int = 1, 2
        a string := "hello"
        var f float = 1.1

        x, y = 3
      }
        `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too few expressions on the RHS of assignment!")
  });

  test('basic incorrect number of assignment expressions inside func body with var declaration outside of func body', async () => {
    const program = `
      var x, y, z int = 1, 2, 3
      var b bool = true
      var f float = 1.1
      func main() {
        x,y,z = 10, 90, 99, 1000
      }
        `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too many expressions on the RHS of assignment!")
  });

  test('basic incorrect number of assignment expressions inside func body with var declaration inside of func body', async () => {
    const program = `
    func main() {
      var x, y, z int = 1, 2, 3
      a string := "hello"
      var f float = 1.1
      x,y,z = 10, 90, 99, 1000
    }
      `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too many expressions on the RHS of assignment!")
  });

  test('basic correct var outside func body and assign inside func body with function return', async () => {
    const program = `
        func inc() (int, int, int) {
          return 11, 22, 33
        }
        var x, y, z int = 1, 2, 3
        var a string = "hello"
        var b bool = true
        var f float = 1.1
        var mut1,mut2 Mutex = mutex
        var wg1, wg2 WaitGroup = mutex
        var xx int = x
        func main() {
          x = 2
          a = "world"
          b,f,x,y,z,mut1, wg1, wg2 = false, 3.3, inc(), mut2, wg2, wg1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic correct var outside func body and assign inside func body with function return and wrong number of assignments', async () => {
    const program = `
        func inc() (int, int, int) {
          return 11, 22, 33
        }
        var x, y, z int = 1, 2, 3
        var a string = "hello"
        var b bool = true
        var f float = 1.1
        var mut1,mut2 Mutex = mutex
        var wg1, wg2 WaitGroup = mutex
        var xx int = x
        func main() {
          x = 2
          a = "world"
          b,f,x,y,mut1, wg1, wg2 = false, 3.3, inc(), mut2, wg2, wg1
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Too many expressions on the RHS of assignment!")
  });

  test('basic make channel outside of func body', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a chan int = make(chan int)
        var b bool = true
        var c, d chan bool = make(chan bool, 2), make(chan bool)
        func main() {
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic make channel inside of func body', async () => {
    const program = `
        
        func main() {
          var x, y, z int = 1, 2, 3
          var a chan int = make(chan int)
          var b bool = true
          var c, d chan bool = make(chan bool, 2), make(chan bool)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic make channel outside of func body with wrong chan type', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a chan bool = make(chan int)
        var b bool = true
        var c, d chan bool = make(chan bool, 2), make(chan bool)
        func main() {
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in variable declaration; declared type: chan bool, actual type: chan int")
  });

  test('basic make channel inside of func body with wrong chan type', async () => {
    const program = `
        
        func main() {
          var x, y, z int = 1, 2, 3
          var a chan int = make(chan bool)
          var b bool = true
          var c, d chan bool = make(chan bool, 2), make(chan bool)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in variable declaration; declared type: chan int, actual type: chan bool")
  });

  //// here
  test('basic make channel outside of func body with reassign', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a chan int = make(chan int)
        var b bool = true
        var c, d chan bool = make(chan bool, 2), make(chan bool)
        func main() {
          d = make(chan bool)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic make channel inside of func body', async () => {
    const program = `
        
        func main() {
          var x, y, z int = 1, 2, 3
          var a chan int = make(chan int)
          var b bool = true
          var c, d chan bool = make(chan bool, 2), make(chan bool)
          d = make(chan bool)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic make channel outside of func body with wrong chan type with wrong reassign', async () => {
    const program = `
        var x, y, z int = 1, 2, 3
        var a chan int = make(chan int)
        var b bool = true
        var c, d chan bool = make(chan bool, 2), make(chan bool)
        func main() {
          d = make(chan int)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in assignment; declared type: chan bool, actual type: chan int")
  });

  test('basic make channel inside of func body with wrong assignment type', async () => {
    const program = `
        
        func main() {
          var x, y, z int = 1, 2, 3
          var a chan int = make(chan int)
          var b bool = true
          var c, d chan bool = make(chan bool, 2), make(chan bool)
          a = make(chan bool)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in assignment; declared type: chan int, actual type: chan bool")
  });

  test('basic mutex lock test', async () => {
    const program = `
        
        func main() {
          var x Mutex = mutex
          Lock(x)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic wrong mutex lock test', async () => {
    const program = `
        
        func main() {
          var x Mutex = mutex
          var y int = 1
          Lock(y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in lock; expected type: mutex actual type: int")
  });

  test('basic mutex unlock test', async () => {
    const program = `
        
        func main() {
          var x Mutex = mutex
          Unlock(x)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic wrong mutex unlock test', async () => {
    const program = `
        
        func main() {
          var x Mutex = mutex
          var y int = 1
          Unlock(y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in unlock; expected type: mutex actual type: int")
  });

  test('basic waitgroup done test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          Done(x)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic wrong waitgroup done test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y int = 1
          Done(y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in done; expected type: waitgroup actual type: int")
  });

  test('basic waitgroup wait test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          Wait(x)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic wrong waitgroup wait test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y int = 1
          Wait(y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in wait; expected type: waitgroup actual type: int")
  });

  test('basic sleep test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y int = 1
          sleep(5)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic wrong sleep test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y bool = false
          sleep(y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in application; expected argument types: int, actual argument types: bool")
  });

  test('basic sleep expr test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y int = 1
          sleep(5 + y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic wrong sleep test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y bool = false
          sleep(y || y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("type error in application; expected argument types: int, actual argument types: bool")
  });

  test('basic Println test', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y int = 1
          Println(y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).not.toThrow()
  });

  test('basic wrong Println test no args', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y bool = false
          Println()
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Println expects 1 arguement of any type")
  });

  test('basic wrong Println test too many args', async () => {
    const program = `
        
        func main() {
          var x WaitGroup = wg
          var y bool = false
          Println(x, y)
        }
          `
    const outputAst: ASTNode = parse(program)
    expect(() => typecheck(outputAst)).toThrow("Println expects 1 arguement of any type")
  });
  
})