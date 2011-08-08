JSONParse.js
============

What?
-----

It's a library for parsing JSON, using UnityScript (the programming language used in Unity).

Why?
----

Because JSON is the fat-free XML, and because UnityScript is not JavaScript (even though 
everybody says it is.).

Who?
----

[Philip Peterson](http://ironmagma.com/).


Demo
----
```javascript

var dataString = "{\"name\": \"Bob\", \"age\": 22, \"hobbies\": [\"biking\", \"fishing\", \"swimming\"]}";

var parsed = (JSONParse.JSONParse(dataString) as Hashtable);


print("The person's name is " + parsed["name"] + ", and he is " + parsed["age"].ToString() + 
       ". \n\n His hobbies: " + String.Join(", ", parsed["hobbies"]) + "." );

```
