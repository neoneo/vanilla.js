Vanilla
=======

A library that lets the standards DOM API act on collections of nodes.

Examples:

    $("li").style.position = "absolute";
    $("li").addEventListener("click", fn, false);
    $("li").classList.toggle("active");

Getters return an array of values:

    $("li").classList.contains("active"); // e.g. [false, false, true, false]
    $("div").style.display; // e.g. ["none", "block", "block"]

Setters accept a single value, or an array of values:

	$("li").className = "disabled"; // All elements get this class.
	$("li").id = ["item1", "item2", "item3"] // The values are distributed over the elements.

Browsers must support:

- \__proto__ (can be fixed later)
- getters and setters using get prop() and set prop()
- Object.defineProperty
- Array iteration methods (map, reduce, forEach, etc.)

Work in progress.