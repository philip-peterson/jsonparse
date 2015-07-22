#pragma strict

import System.Collections.Generic;
import System;
import System.Text;

class JSONParse {

	var source : String;
	var ctr : int;
	
	
	function JSONParse(source : String) {
		this.source = source;
		this.ctr = 0;
	}

	function Parse() {
		skip();
		var result : Object = handleGeneric();
		skip();
		expectEof();
		return result;
	}
	
	function handleGeneric() : Object {
		if (source[ctr] == '[') {
			Debug.Log("GENERIC: ARRAY");
			return handleArray();
		}
		if (source[ctr] == '{') {
			Debug.Log("GENERIC: OBJ");
			return handleObject();
		}
		if (source[ctr] == 'n') {
			Debug.Log("GENERIC: NULL");
			return handleNull();
		}
		if (source[ctr] == 'f') {
			Debug.Log("GENERIC: BOOLF");
			return handleFalse();
		}
		if (source[ctr] == 't') {
			Debug.Log("GENERIC: BOOLT");
			return handleTrue();
		}
		if (source[ctr] == '"') {
		Debug.Log("GENERIC: STRING");
			return handleString();
		}
		Debug.Log("GENERIC: NUM");
		return handleNumber();
		
	}
	
	function handleArray() : Array {
		Debug.Log("Called handle");
		Debug.Log("Called handle 2");
		var v : Array = new Array();
		if (!consume('['  [0])) {
			throw new Exception("Expected array");
		}
		while (true) {
			Debug.Log("iteration v is now " + v);
			skip();
			if (consume(']'  [0])) {
				return v;
			}
			else {
				Debug.Log("before call v " + v);
				var x = handleGeneric();
				Debug.Log("Got generic! x is " + (x == null));
				new Array().Add(x);
				Debug.Log("after call v");
				skip();
				if (!consume(','  [0])) {
					if (consume(']'  [0])) {
						return v;
					}
					else {
						throw new Exception("Expected a ',' or ']' after array element");
					}
				}
			}
		}
		
		return null; // to satisfy compiler
	}
	
	function handleObject() : Dictionary.<String, Object> {
		var dict = new Dictionary.<String, Object>();
		if (!consume('{'  [0])) {
			throw new Exception("Expected object");
		}
		while (true) {
			skip();
			if (consume('}'  [0])) {
				return dict;
			}
			else {
				var key = handleString();
				skip();
				if (!consume(':'  [0])) {
					throw new Exception("Expected ':' separating object key and value");
				}
				skip();
				var val = handleGeneric();
				dict[handleString()] = val;
				skip();
				if (!consume(','  [0])) {
					if (consume('}'  [0])) {
						return dict;
					}
					else {
						throw new Exception("Expected a ',' or '}' after object key-value pair");
					}
				}
			}
		}
		
		return null; // to satisfy compiler
	}
	
	function handleString() {
		expect('"');
		
		if (consume('"'  [0])) {
			return "";
		}
		
		var myString = ""; // TODO optimize with StringBuilder
		var bytes : byte[] = new byte[2];
		
		
		while(true) {
			if (eof()) {
				throw new Exception("Encountered EOF while scanning string literal.");
			}
			var c : char = peekc();
			if (c == '"'  [0]) {
				Debug.Log("End quote. breaking out of loop");
				break;
			}
			else if (c == '\\'  [0]) {
				// handle slash
				ctr++;
				if (eof()) {
					throw new Exception("Encountered EOF while scanning string literal.");
				}
				switch(c) {
					case '\\':
						myString += "\\";
						ctr++;
						break;
					case 'b':
						myString += "\b";
						ctr++;
						break;
					case 'f':
						myString += "\f";
						ctr++;
						break;
					case 'n':
						myString += "\n";
						ctr++;
						break;
					case 'r':
						myString += "\r";
						ctr++;
						break;
					case 't':
						myString += "\t";
						ctr++;
						break;
					case 'u':
						ctr++;
						
						Debug.Log("in the u, ctr = " + ctr);
						for (var j = 0; j < 2; j++) {
							var bite = 0;
							for (var i = 0; i < 2; i++) {
								if (eof()) {
									throw new Exception("Encountered EOF while scanning string literal.");
								}
								bite = bite * 16 + parseInt(peekc());
								ctr++;
							}
							bytes[1-j] = bite;
						}
						myString += Encoding.GetEncoding("UTF-16").GetString(bytes);
						Debug.Log("String is now done. peek is " + peekc());
						break;
					default:
						throw new Exception(String.Format("Unexpected character after slash: '{0}'", c));
						break;
				}
			}
			else {
				Debug.Log("Regular char "+c);
				myString += c;
				ctr++;
			}
		}
		
		expect('"');
		
		return myString;
	}
	
	function handleTrue() : boolean {
		if (!consumeString("true")) {
			throw new Exception("Expected 'true'");
		}
		return true;
	}

	function handleFalse() : boolean {
		if (!consumeString("false")) {
			throw new Exception("Expected 'false'");
		}
		return false;
	}
		
	function handleNull() : Object {
		if (!consumeString("null")) {
			throw new Exception("Expected 'null'");
		}
		return null;
	}
	
	function handleNumber() {
		var negative = false;
		var octal = false;
		
		var number : Array = [];
		var exponent : Array = [];
		var mantissa : Array = [];
		
		var exponentNegative = false;
		
		var next : String;
		
		if (consume('-'  [0])) {
			negative = true;
		}
		if (!consume('0'  [0])) {
			next = peek();
			if (next.length == 0) {
				throw new Exception("Encountered EOF while scanning number");
			}
			
			if (isDigit1thru9(next[0])) {
				number.Push(intFromChar(next[0]));
				ctr++;
			}
		
			next = peek();
			while(next.length && isDigit(next[0])) {
				number.Push(intFromChar(next[0]));
				ctr++;
				next = peek();
			}
		}
		
		next = peek();
		if (next.Equals('.')) {
			consume('.'  [0]);
			next = peek();
			if (!isDigit(next)) {
				throw new Exception("Expected digit after decimal point");
			}
			do {
				mantissa.Push(intFromChar(next[0]));
				ctr++;
				next = peek();
			} while (isDigit(next));
		}
		
		next = peek();
		if (next.Equals('e') || next.Equals('E')) {
			consume(next[0]);
			if (consume('-'  [0])) {
				exponentNegative = true;
			}
			else {
				consume('+'  [0]);
			}
			
			next = peek();
			if (!isDigit(next)) {
				throw new Exception("Expected digit after exponent marker");
			}
			do {
				exponent.Push(intFromChar(next[0]));
				ctr++;
				next = peek();
			} while (isDigit(next));
		}
		
		var returnVal : double = 0;
		var i : int;
		for (i = 0; i < number.length; i++) {
			returnVal = returnVal * 10 + (number[i] cast int);
		}
		
		for (i = 0; i < mantissa.length; i++) {
			returnVal += (mantissa[i] cast int)*(Mathf.Pow(10, -(i+1)));
		}
		
		var tenPower : int = 0;
		
		for (i = 0; i < exponent.length; i++) {
			tenPower = tenPower * 10 + (exponent[i] cast int);
		}
		
		returnVal = returnVal * Mathf.Pow(10, exponentNegative ? -tenPower : tenPower);
		
		return returnVal;
	}
	
	function intFromChar(c : char) : int {
		return ((c cast int) - ('0'[0] cast int));
	}
	
	function isDigit1thru9(c : char) {
		return c >= '1'[0] && c <= '9'[0];
	}
	
	function isDigit(c : char) {
		return c >= '0'[0] && c <= '9'[0];
	}
	
	function isDigit(s : String) {
		return s.length > 0 && isDigit(s[0]);
	}
	
	function eof() : boolean {
		return ctr == source.length;
	}
	
	function peekc() : char {
		return source[ctr];
	}
	
	function peek() : String {
		if (eof()) {
			return "";
		}
		return peekc().ToString();
	}
	
	function expectEof() {
		if (ctr == source.length) {
			return true;
		}
		else {
			throw new Exception("Trailing characters detected (expected EOF)");
		}
	}
	
	function expect(s : String) {
		if (!consumeString(s)) {
			throw new Exception(String.Format("Expected '{0}'.", s));
		}
	}
	
	function consumeString(s : String) {
		if (ctr + s.length >= source.length) {
			throw new Exception(String.Format("Unexpected EOF when expecting '{0}'", s));
		}
		for (var i = 0; i < s.length; i++) {
			if (s[i] != source[ctr+i]) {
				return false;
			}
		}
		ctr += s.length;
		return true;
	}
	
	function consume(c : char) : boolean {
		if (ctr == source.length) {
			throw new Exception("Unexpected EOF");
		}
		else {
			if (source[ctr] == c) {
				ctr++;
				return true;
			}
			else {
				return false;
			}
		}
	}
	
	function parseInt(c : char) : int {
		if (
			(c >= '0'[0] && c <= '9'[0])
			|| (c >= 'A'[0] && c <= 'F'[0])
			|| (c >= 'a'[0] && c <= 'f'[0])
		) {
			return System.Convert.ToInt32(c.ToString(), 16);
		}
		else {
			throw new Exception(String.Format("Invalid hex digit: '{0}'", c));
		}
	}
	
	// Skips whitespace
	function skip() {
		while (
			ctr < source.length
			&& (
				source[ctr] == 0x20
				|| source[ctr] == 0x09
				|| source[ctr] == 0x0A
				|| source[ctr] == 0x0D
			)
		) {
			ctr++;
		}
	}
	
}
