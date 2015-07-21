#pragma strict

import System.Collections.Generic;
import System;

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
         return handleArray();
      }
      if (source[ctr] == '{') {
         return handleObject();
      }
      if (source[ctr] == 'n') {
         return handleNull();
      }
      if (source[ctr] == 'f') {
         return handleFalse();
      }
      if (source[ctr] == 't') {
         return handleTrue();
      }
      if (source[ctr] == '"') {
         return handleString();
      }
      
      return handleNumber();
      
   }
   
   function handleArray() : Array {
      var v : Array = [];
      if (!consume('['  [0])) {
         throw new Exception("Expected array");
      }
      while (true) {
         skip();
         if (consume(']'  [0])) {
            return v;
         }
         else {
            v.Push(handleGeneric());
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
      return "foo";
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
      
      returnVal = returnVal * Mathf.Pow(10, tenPower);
      
      // TODO exponent
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
   
   function peek() : String {
      if (ctr == source.length) {
         return "";
      }
      return source[ctr].ToString();
   }
   
   function expectEof() {
      if (ctr == source.length) {
         return true;
      }
      else {
         throw new Exception("Trailing characters detected (expected EOF)");
      }
   }
   
   function consumeString(s : String) {
      if (ctr + s.length >= source.length) {
         throw new Exception(String.Format("Unexpected EOF when expecting '{}'", s));
      }
      for (var i = 0; i < s.length; i++) {
         if (s[i] != source[ctr+i]) {
            return false;
         }
      }
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
