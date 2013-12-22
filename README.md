Vanilla
=======

A library that lets the standards DOM API act on collections of nodes.

Examples:
$("li").style.position = "absolute";
$("li").addEventListener("click", fn, false);
$("li").classList.toggle("active");

Work in progress.

Browsers must support:
* __proto__ (can be fixed later)
* getters and setters using get prop() and set prop()
* Object.defineProperty
* Array iteration methods (map, reduce, forEach, etc.)