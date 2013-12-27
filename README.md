Vanilla
=======

A library that lets the standards DOM API act on collections of nodes.

Examples:

    $("li").style.position = "absolute";
    $("li").addEventListener("click", fn, false);
    $("li").classList.toggle("active");

Getters return an array of values:

    $("li").classList.contains("active"); // e.g. [false, false, true, false]
    $("div").style.display; // e.g. ["none", "block", null]

Or a new vanilla object, if nodes are returned:

    $("li").firstChild.clientHeight; // e.g. [35, 35, 35]

Setters accept a single value, or an array of values:

	$("li").className = "disabled"; // All elements get this class.
	$("li").style.color = ["red", "blue"] // The values are distributed over the elements.

API:

`vanilla(selector[, context] | element | elements)`

Creates a new vanilla object that contains elements that match the selector, or wraps the element(s).

`.getComputedStyle([pseudoElement])`

Maps to `window.getComputedStyle`.

`.one([selector])`

Returns the first element in the set that matches the selector, wrapped in a vanilla.one object (below).

`.noConflict()`

Reverts the `vanilla`, `$` and `$$` variables to their previous state and returns the vanilla function.

Single elements
---------------

$$ returns a vanilla.one object containing 0 or 1 elements. It should therefore behave exactly like a naked element, except
that for some of the getters a vanilla object is returned:

    $$("li").children.style.display = "none";

Browsers
========

Browsers must support:

- \__proto__ (can be fixed later)
- getters and setters using get prop() and set prop()
- element.classList
- style.getPropertyValue / .setProperty
- Object.defineProperty
- Array iteration methods (map, reduce, forEach, etc.)

Proof of concept. Overhaul needed.