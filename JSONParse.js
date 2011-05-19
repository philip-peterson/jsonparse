/*

JSONParse.js
A JSON Parser for the Unity Game Engine
 
Based on json_parse by Douglas Crockford
Ported by Philip Peterson (ironmagma/ppeterson) for the Starry Expanse Project

Last updated 3/5/11

 */



private static var at : int;

private static var ch : String;

private static var escapee = {
            "\"": "\"",
            "\\": "\\",
            "/": "/",
            "b": "b",
            "f": "\f",
            "n": "\n",
            "r": "\r",
            "t": "\t"
            };
            
private static var text : String;

private static function error (m) : void {
    throw new System.Exception("SyntaxError: \nMessage: "+m+
                        "\nAt: "+at+
                        "\nText: "+text);
}

private static function next (c) : System.String {

    if(c && c != ch) {
        error("Expected '" + c + "' instead of '" + ch + "'");
    }
    
    
    if(text.length >= at+1) {
        ch = text.Substring(at, 1);
    }
    else {
        ch = "";
    }
    
    at++;
    return ch;
    
}

private static function next () {
    return next(null);
}

private static function number () : Number {
    var number;
    var string = "";
    
    if(ch == "-") {
        string = "-";
        next("-");
    }
    while(ch in ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
        string += ch;
        next();
    }
    if(ch == ".") {
        string += ".";
        while(next() && ch in ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
            string += ch;
        }
    }
    if(ch == "e" || ch == "E") {
        string += ch;
        next();
        if(ch == "-" || ch == "+") {
            string += ch;
            next();
        }
        while(ch in ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) {
            string += ch;
            next();
        }
    }
    number = Number.Parse(string);
    
    if (System.Double.IsNaN(number)) {
        error("Bad number");
    } else {
        return number;
    }
    
}


private static function string () : System.String {
    var hex : int;
    var i : int;
    var string : String = "";
    var uffff : int;
    
    if(ch == "\"") {
        while(next()) {
            if(ch == "\"") {
                next();
                return string;
            } else if (ch == "\\") {
                next();
                if(ch == "u") {
                    uffff = 0;
                    for(i = 0; i < 4; i++) {
                        hex = System.Convert.ToInt32(next(), 16);
                        if (hex == Mathf.Infinity || hex == Mathf.NegativeInfinity) {
                            break;
                        }
                        uffff = uffff * 16 + hex;
                    }
                    var m : char = uffff;
                    string += m;
                } else if(ch in escapee) {
                    string += escapee[ch];
                } else {
                    break;
                }
            } else {
                string += ch;
            }
        }
    }
    error("Bad string");
};



private static function white () : void {
    while(ch && (ch.length >= 1 && ch.Chars[0] <= 32)) { // if it's whitespace
        next();
    }   
}

private static function value () : System.Object {
    white();
    // Again, we have to pass on the switch() statement.
    
    if(ch == "{") {
        return object();
    } else if(ch == "[") {
        return array();
    } else if(ch == "\"") {
        return string();
    } else if(ch == "-") {
        return number();
    } else {
        return (ch in ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]) ? number() : word();
    }
    
};

private static function word () {
    // We don't use a switch() statement because
    // otherwise Unity will complain about
    // unreachable code (in reality it's not unreachable).
    
    if(ch == "t") {
        next("t");
        next("r");
        next("u");
        next("e");
        return true;
    } else if (ch == "f") {
        next("f");
        next("a");
        next("l");
        next("s");
        next("e");
        return false;
    } else if (ch == "n") {
        next("n");
        next("u");
        next("l");
        next("l");
        return null;
    } else if (ch == "") { 
        return null; // Todo: why is it doing this?
    }
    
    error("Unexpected '" + ch + "'");
}

private static function array () {
    
    var array : Array = new Array();
    
    if(ch == "[") {
        next("[");
        white();
        if(ch == "]") {
            next("]");
            return array; // empty array
        }
        while(ch) {
            array.Push(value());
            white();
            if(ch == "]") {
                next("]");
                return array;
            }
            next(",");
            white();
        }
    }
    error("Bad array");
};

private static function object () {
    
    var key;
    var object = {};
    
    if(ch == "{") {
        next("{");
        white();
        if(ch == "}") {
            next("}");
            return object; // empty object
        }
        while(ch) {
            key = string();
            white();
            next(":");
            object[key] = value();
            white();
            if (ch == "}") {
                next("}");
                return object;
            }
            next(",");
            white();
        }
    }
    error("Bad object");
}



public static function JSONParse (source, reviver) {
    var result;
    
    text = source;
    at = 0;
    ch = " ";
    result = value();
    white();
    if (ch) {
        error("Syntax error");
    }
    
    if(reviver) {
        var walk : Function;
        walk = function(holder, key) {
            var k;
            var v;
            var value = holder[key];
            if(value && (typeof value == Boo.Lang.Hash || System.Type.GetType(value).IsArray)) {
                for(k in value) {
                    v = walk(value, k);
                    if(v != null) {
                        value[k] = v;
                    } else {
                        value.Remove(k);
                    }
                }
            }
            return reviver(holder, key, value);
        };
        return walk({"": result}, "");
    } else {
        return result;
    }
}

public static function JSONParse (source) {
    return JSONParse(source, null);
}
