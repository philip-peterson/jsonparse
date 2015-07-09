JSONParse.js
============

What?
-----

It's a library for parsing JSON, using UnityScript (the programming language used in Unity).

Demo
----
```javascript

var dataString = "{\"name\": \"Bob\", \"age\": 22, \"hobbies\": [\"biking\", \"fishing\", \"swimming\"]}";

var parsed = JSONParse.JSONParse(dataString);


print("The person's name is " + parsed["name"] + ", and he is " + parsed["age"].ToString() + 
       ". \n\n His hobbies: " + String.Join(", ", parsed["hobbies"]) + "." );

```
