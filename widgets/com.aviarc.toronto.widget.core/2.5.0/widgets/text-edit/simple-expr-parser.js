/*
  Based on ndef.parser, by Raphael Graf(r@undefined.ch)
  http://www.undefined.ch/mparser/index.html

  Code from: https://github.com/silentmatt/js-expression-eval
*/
YAHOO.namespace("com.aviarc.framework.toronto.widget.core.v2_5_0");
    
Toronto.widget.core.v2_5_0.ExpressionParser = function (scope) {
    function object(o) {
        function F() {}
        F.prototype = o;
        return new F();
    }
    
    var TNUMBER = 0;
    var TOP1 = 1;
    var TOP2 = 2;
    var TVAR = 3;
    var TFUNCALL = 4;
    
    function Token(type_, index_, prio_, number_) {
        this.type_ = type_;
        this.index_ = index_ || 0;
        //this.prio_ = prio_ || 0;
        this.number_ = (number_ !== undefined && number_ !== null) ? number_ : 0;
        this.toString = function () {
            switch (this.type_) {
                case TNUMBER:  return this.number_;
                case TOP1:
                case TOP2:
                case TVAR:     return this.index_;
                default:       return "Invalid Token";
            }
        };
    }
    
    function Expression(tokens, ops1, ops2) {
        this.tokens = tokens;
        this.ops1 = ops1;
        this.ops2 = ops2;
    }
    
    Expression.prototype = {
        evaluate: function (values) {
            values = values || {};
            var nstack = [];
            var n1;
            var n2;
            var f;
            var L = this.tokens.length;
            var item;
            var i = 0;
            for (i = 0; i < L; i++) {
                item = this.tokens[i];
                var type_ = item.type_;
                if (type_ === TNUMBER) {
                    nstack.push(item.number_);
                }
                else if (type_ === TOP2) {
                    n2 = nstack.pop();
                    n1 = nstack.pop();
                    f = this.ops2[item.index_];
                    nstack.push(f(n1, n2));
                }
                else if (type_ === TVAR) {
                    if (item.index_ in values) {
                        nstack.push(values[item.index_]);
                    }
                    else if (item.index_ in this.functions) {
                        nstack.push(this.functions[item.index_]);
                    }
                    else {
                        throw new Error("undefined variable: " + item.index_);
                    }
                }
                else if (type_ === TOP1) {
                    n1 = nstack.pop();
                    f = this.ops1[item.index_];
                    nstack.push(f(n1));
                }
                else if (type_ === TFUNCALL) {
                    n1 = nstack.pop();
                    f = nstack.pop();
                    if (f.apply && f.call) {
                        if (Object.prototype.toString.call(n1) == "[object Array]") {
                            nstack.push(f.apply(undefined, n1));
                        }
                        else {
                            nstack.push(f.call(undefined, n1));
                        }
                    }
                    else {
                        throw new Error(f + " is not a function");
                    }
                }
                else {
                    throw new Error("invalid Expression");
                }
            }
            if (nstack.length > 1) {
                throw new Error("invalid Expression (parity)");
            }
            return nstack[0];
        }
    };
    
    function add(a, b) { return Number(a) + Number(b); }
    function sub(a, b) { return a - b; }
    function mul(a, b) { return a * b; }
    function div(a, b) { return a / b; }
    function mod(a, b) { return a % b; }
    function neg(a)    { return -a; }
    
    function Parser() {
        this.success = false;
        this.errormsg = "";
        this.expression = "";
        
        this.pos = 0;
        
        this.tokennumber = 0;
        this.tokenprio = 0;
        this.tokenindex = 0;
        this.tmpprio = 0;
        
        this.ops1 = {
            "-": neg
        };
        
        this.ops2 = {
            "+": add,
            "-": sub,
            "*": mul,
            "/": div,
            "%": mod
        };
        
    }
    
    Parser.parse = function (expr) {
        return new Parser().parse(expr);
    };
    
    Parser.evaluate = function (expr, variables) {
        return Parser.parse(expr).evaluate(variables);
    };
    
    Parser.Expression = Expression;
    
    var PRIMARY = 1 << 0;
    var OPERATOR = 1 << 1;
    var LPAREN = 1 << 3;
    var RPAREN = 1 << 4;
    var SIGN = 1 << 6;
    
    Parser.prototype = {
        parse: function (expr) {
            this.errormsg = "";
            this.success = true;
            var operstack = [];
            var tokenstack = [];
            this.tmpprio = 0;
            var expected = (PRIMARY | LPAREN | SIGN);
            var noperators = 0;
            this.expression = expr;
            this.pos = 0;
            
            while (this.pos < this.expression.length) {
                if (this.isOperator()) {
                    if (this.isSign() && (expected & SIGN)) {
                        if (this.isNegativeSign()) {
                            this.tokenprio = 2;
                            this.tokenindex = "-";
                            noperators++;
                            this.addfunc(tokenstack, operstack, TOP1);
                        }
                        expected = (PRIMARY | LPAREN | SIGN);
                    }
                    else {
                        if ((expected & OPERATOR) === 0) {
                            this.error_parsing(this.pos, "unexpected operator");
                        }
                        noperators += 2;
                        this.addfunc(tokenstack, operstack, TOP2);
                        expected = (PRIMARY | LPAREN | SIGN);
                    }
                }
                else if (this.isNumber()) {
                    if ((expected & PRIMARY) === 0) {
                        this.error_parsing(this.pos, "unexpected number");
                    }
                    var token = new Token(TNUMBER, 0, 0, this.tokennumber);
                    tokenstack.push(token);
                    
                    expected = (OPERATOR | RPAREN );
                }
                else if (this.isLeftParenth()) {
                    if ((expected & LPAREN) === 0) {
                        this.error_parsing(this.pos, "unexpected \"(\"");
                    }
                    
                    expected = (PRIMARY | LPAREN | SIGN);
                }
                else if (this.isRightParenth()) {
                    if ((expected & RPAREN) === 0) {
                        this.error_parsing(this.pos, "unexpected \")\"");
                    }
                    
                    expected = (OPERATOR | RPAREN | LPAREN );
                }
                else if (this.isOp2()) {
                    this.addfunc(tokenstack, operstack, TOP2);
                    noperators += 2;
                    expected = (LPAREN);
                }
                else if (this.isOp1()) {
                    this.addfunc(tokenstack, operstack, TOP1);
                    noperators++;
                    expected = (LPAREN);
                }
                else if (this.isWhite()) {
                }
                else {
                    if (this.errormsg === "") {
                        this.error_parsing(this.pos, "unknown character");
                    }
                    else {
                        this.error_parsing(this.pos, this.errormsg);
                    }
                }
            }
            if (this.tmpprio < 0 || this.tmpprio >= 10) {
                this.error_parsing(this.pos, "unmatched \"()\"");
            }
            while (operstack.length > 0) {
                var tmp = operstack.pop();
                tokenstack.push(tmp);
            }
            if (noperators + 1 !== tokenstack.length) {
                this.error_parsing(this.pos, "parity");
            }
        
            return new Expression(tokenstack, object(this.ops1), object(this.ops2));
        },
        
        evaluate: function (expr, variables) {
            return this.parse(expr).evaluate(variables);
        },
        
        error_parsing: function (column, msg) {
            this.success = false;
            this.errormsg = "parse error [column " + (column) + "]: " + msg;
            throw new Error(this.errormsg);
        },
    
        addfunc: function (tokenstack, operstack, type_) {
            var operator = new Token(type_, this.tokenindex, this.tokenprio + this.tmpprio, 0);
            while (operstack.length > 0) {
                if (operator.prio_ <= operstack[operstack.length - 1].prio_) {
                    tokenstack.push(operstack.pop());
                }
                else {
                    break;
                }
            }
            operstack.push(operator);
        },
        
        isNumber: function () {
            var r = false;
            var str = "";
            while (this.pos < this.expression.length) {
                var code = this.expression.charCodeAt(this.pos);
                if ((code >= 48 && code <= 57) || code === 46) {
                    str += this.expression.charAt(this.pos);
                    this.pos++;
                    this.tokennumber = parseFloat(str);
                    r = true;
                }
                else {
                    break;
                }
            }
            return r;
        },
        
        isOperator: function () {
            var code = this.expression.charCodeAt(this.pos);
            if (code === 43) { // +
                this.tokenprio = 0;
                this.tokenindex = "+";
            }
            else if (code === 45) { // -
                this.tokenprio = 0;
                this.tokenindex = "-";
            }
            else if (code === 42) { // *
                this.tokenprio = 1;
                this.tokenindex = "*";
            }
            else if (code === 47) { // /
                this.tokenprio = 2;
                this.tokenindex = "/";
            }
            else if (code === 37) { // %
                this.tokenprio = 2;
                this.tokenindex = "%";
            }
            else {
                return false;
            }
            this.pos++;
            return true;
        },
        
        isSign: function () {
            var code = this.expression.charCodeAt(this.pos - 1);
            if (code === 45 || code === 43) { // - +
                return true;
            }
            return false;
        },
        
        isPositiveSign: function () {
            var code = this.expression.charCodeAt(this.pos - 1);
            if (code === 43) { // -
                return true;
            }
            return false;
        },
        
        isNegativeSign: function () {
            var code = this.expression.charCodeAt(this.pos - 1);
            if (code === 45) { // -
                return true;
            }
            return false;
        },
        
        isLeftParenth: function () {
            var code = this.expression.charCodeAt(this.pos);
            if (code === 40) { // (
                this.pos++;
                this.tmpprio += 10;
                return true;
            }
            return false;
        },
        
        isRightParenth: function () {
            var code = this.expression.charCodeAt(this.pos);
            if (code === 41) { // )
                this.pos++;
                this.tmpprio -= 10;
                return true;
            }
            return false;
        },

        isWhite: function () {
            var code = this.expression.charCodeAt(this.pos);
            if (code === 32 || code === 9 || code === 10 || code === 13) {
                this.pos++;
                return true;
            }
            return false;
        },

        isOp1: function () {
            var str = "";
            for (var i = this.pos; i < this.expression.length; i++) {
                var c = this.expression.charAt(i);
                if (c.toUpperCase() === c.toLowerCase()) {
                    if (i === this.pos || (c != '_' && (c < '0' || c > '9'))) {
                        break;
                    }
                }
                str += c;
            }
            if (str.length > 0 && (str in this.ops1)) {
                this.tokenindex = str;
                this.tokenprio = 5;
                this.pos += str.length;
                return true;
            }
            return false;
        },
        
        isOp2: function () {
            var str = "";
            for (var i = this.pos; i < this.expression.length; i++) {
                var c = this.expression.charAt(i);
                if (c.toUpperCase() === c.toLowerCase()) {
                    if (i === this.pos || (c != '_' && (c < '0' || c > '9'))) {
                        break;
                    }
                }
                str += c;
            }
            if (str.length > 0 && (str in this.ops2)) {
                this.tokenindex = str;
                this.tokenprio = 5;
                this.pos += str.length;
                return true;
            }
            return false;
        }
    };
    
    scope.Parser = Parser;
    return Parser;
}(typeof exports === 'undefined' ? {} : exports);

