(function () {

	var root = this,
		_$ = this.$,
		_$$ = this.$$,
		_vanilla = this.vanilla;

	function vanilla() {

		if (typeof arguments[0] ===  "string") {

			// We assume this is a selector. The context is an element that can be passed in as an optional 2nd argument.
			var selector = arguments[0], context = arguments[1];
			var nodeList = context ? context.filter(function (element) {
				return elementMatches(element, selector);
			}) : document.querySelectorAll(selector);
			var nodeArray = toArray(nodeList);
			nodeArray.__proto__ = vanilla.prototype;
			return nodeArray;

		} else if (isArrayLike(arguments[0])) {
			// Anything that has a length is treated as an array.
			var nodeArray = toArray(arguments[0]);
			nodeArray.__proto__ = vanilla.prototype;
			return nodeArray;

		} else if (arguments[0].nodeType) {
			return vanilla([arguments[0]]);
		} else {
			throw "Don't know what to do";
		}

	}

	vanilla.noConflict = function () {
		root.$ = _$;
		root.$$ = _$$;
		root.vanilla = _vanilla;

		return vanilla;
	}

	// Utility functions for adding properties and methods to the vanilla prototype.

	function isArrayLike(item) {
		return typeof item !== "undefined" && typeof item !== "string" &&
			typeof item.length !== "undefined" && typeof item.nodeType === "undefined";
	}

	function toArray(arrayLike) {
		return Array.prototype.slice.call(arrayLike);
	}

	/**
	 * Returns a getter function for the property name. If wrap is true, the getter returns a vanilla object.
	 */
	function getter(propertyName, wrap, unique) {
		return function () {
			var result = this.flatMap(function (element) {
				return element[propertyName];
			});
			if (unique) {
				result = result.filter(function (element, index) {
					return result.indexOf(element) === index;
				});
			}
			return wrap ? vanilla(result) : result;
		}
	}

	/**
	 * Returns a setter function for the property name.
	 * A setter accepts a string or an array of strings. If the value is a string, all elements will have the property
	 * set to that string. If the value is an array, the elements will have the property value taken from the array at the
	 * corresponding position, if defined.
	 */
	function setter(propertyName) {
		return function (value) {
			if (isArrayLike(value)) {
				var length = value.length;
				this.forEach(function (element, index) {
					element[propertyName] = value[index % length];
				});
			} else {
				this.forEach(function (element) {
					element[propertyName] = value;
				});
			}
		}
	}

	/**
	 * Defines a property on the vanilla prototype.
	 */
	function property(name, get, set, wrap, unique) {
		Object.defineProperty(vanilla.prototype, name, {
			get: get ? getter(name, wrap, unique) : undefined,
			set: set ? setter(name) : undefined,
			configurable: true // We must be able to override this.
		});
	}

	/**
	 * Defines a method that returns void.
	 */
	function voidMethod(name) {
		vanilla.prototype[name] = function () {
			var splat = arguments;
			this.forEach(function (node) {
				if (name in node) {
					node[name].apply(node, splat);
				}
			});
		}
	}

	function mapMethod(name) {
		vanilla.prototype[name] = function () {
			var splat = arguments;
			return this.map(function (node) {
				return name in node ? node[name].apply(node, splat) : undefined;
			});
		}
	}

	/**
	 * Defines a method that returns a vanilla object.
	 */
	function vanillaFlatMapMethod(name) {
		vanilla.prototype[name] = function () {
			var splat = arguments;
			return vanilla(this.flatMap(function (node) {
				return name in node ? node[name].apply(node, splat) : undefined;
			}));
		}
	}

	function elementMatches(element, selector) {
		return element.webkitMatchesSelector ? element.webkitMatchesSelector(selector) :
			element.mozMatchesSelector ? element.mozMatchesSelector(selector) :
			element.msMatchesSelecter ? element.msMatchesSelector(selector) :
			undefined;
	}

	// The vanilla prototype. Most properties and methods are created using the utility functions, but some don't fit in the patterns.
	vanilla.prototype = {

		__proto__: Array.prototype,

		one: function () {
			if (arguments.length === 0) {
				return one(this);
			} else {
				return one(arguments[0], this);
			}
		},

		flatMap: function (callback) {
			return this.map(callback)
				.reduce(function (result, item) {
					return item !== null && typeof item !== "undefined" ?
						result.concat(
							isArrayLike(item) ? toArray(item) : item
						) : result;
				}, []);
		},

		// NODE METHODS

		appendChild: function (child) {
			return vanilla(this.map(function (node, index) {
				return node.appendChild(index === 0 ? child : child.cloneNode(true));
			}));
		},

		contains: function (otherNode) {
			// Since otherNode can be contained by only one ancestor node, return true if one of the nodes contains it.
			return this.some(function (node) {
				return node.contains(otherNode);
			});
		},

		insertBefore: function (newNode, referenceNode) {
			referenceNode = referenceNode || null;
			var position = -1;
			if (this.length > 1 && referenceNode) {
				position = referenceNode.parentNode.childNodes.indexOf(referenceNode);
			}
			return vanilla(this.map(function (node, index) {
				if (index === 0) {
					return node.insertBefore(newNode, referenceNode);
				} else {
					return node.insertBefore(newNode.cloneNode(true), node.childNodes[position] || null);
				}
			}));
		},

		removeChild: function (child) {
			var position = -1;
			if (this.length > 1) {
				position = child.parentNode.childNodes.indexOf(child);
			}
			return vanilla(this.map(function (node, index) {
				if (index === 0) {
					return node.removeChild(child);
				} else {
					var removeNode = node.childNodes[position];
					return removeNode ? node.removeChild(removeNode) : undefined;
				}
			}));
		},

		replaceChild: function (newChild, oldChild) {
			var position = -1;
			if (this.length > 1) {
				position = oldChild.parentNode.childNodes.indexOf(oldChild);
			}
			return vanilla(this.map(function (node, index) {
				if (index === 0) {
					return node.replaceChild(newChild, oldChild);
				} else {
					var replaceNode = node.childNodes[position];
					return replaceNode ? node.replaceChild(newChild.cloneNode(true), replaceNode) : undefined;
				}
			}));

		},

		// ELEMENT METHODS

		matches: function (selector) {
			return this.map(function (element) {
				return elementMatches(element, selector);
			});
		},

		// non-standard
		getComputedStyle: function (pseudoElement) {
			return this.map(function (element) {
				return root.getComputedStyle(element, pseudoElement || null);
			});
		},

		// PROPERTIES

		get classList() {
			return this.hasOwnProperty("_classList") ? this._classList : this._classList = new ClassList(this);
		},

		get style() {
			return this.hasOwnProperty("_style") ? this._style : this._style = new Style(this);
		},

		// ARRAY METHODS
		// Vanilla.filter should return a new vanilla object.
		filter: function (callback) {
			return vanilla(Array.prototype.filter.call(this, callback));
		}

	};

	// VOID METHODS
	("addEventListener,insertAdjacentHTML,remove,removeAttribute,removeEventListener,setAttribute").split(",")
		.forEach(function (methodName) {
		voidMethod(methodName);
	});

	// MAP METHODS
	("cloneNode,hasChildNodes,getClientRects,hasAttribute").split(",")
		.forEach(function (methodName) {
		mapMethod(methodName);
	});

	// VANILLA FLATMAP METHODS
	("getElementsByClassName,getElementsByTagName,querySelector,querySelectorAll").split(",")
		.forEach(function (methodName) {
		vanillaFlatMapMethod(methodName);
	});

	// MAPPED PROPERTIES
	// These properties only have getters, and return a new vanilla object:
	var singleNode = ("firstChild,lastChild,nextSibling,previousSibling," +
		"firstElementChild,lastElementChild,nextElementSibling,previousElementSibling").split(",");
	singleNode.forEach(function (propertyName) {
		property(propertyName, true, false, true, false);
	});

	// These properties only have getters, and return a new vanilla object:
	var multipleNode = ("childNodes,children").split(",");
	multipleNode.forEach(function (propertyName) {
		property(propertyName, true, false, true, false);
	});

	// These properties only have getters, and return a new vanilla object containing unique elements:
	var singleUniqueNode = ("parentNode,parentElement").split(",");
	singleUniqueNode.forEach(function (propertyName) {
		property(propertyName, true, false, true, true);
	});

	// These properties only have getters, and return an array:
	var readonly = ("nodeName,nodeType,childElementCount,clientHeight,clientLeft,clientTop,clientWidth,scrollHeight,scrollWidth,tagName").split(",");
	readonly.forEach(function (propertyName) {
		property(propertyName, true, false, false, false);
	});

	// These properties have getters and setters, and return an array:
	var mutable = ("nodeValue,textContent,className,id,innerHTML,outerHTML,scrollLeft,scrollTop").split(",");
	mutable.forEach(function (propertyName) {
		property(propertyName, true, true, false, false);
	});

	// ClassList object ===========================================================================

	function ClassList(collection) {
		this._collection = collection;
	}

	ClassList.prototype = {
		add: function (className) {
			this._collection.forEach(function (element) {
				element.classList.add(className);
			});
		},
		remove: function (className) {
			this._collection.forEach(function (element) {
				element.classList.remove(className);
			});
		},
		toggle: function (className) {
			this._collection.forEach(function (element) {
				element.classList.toggle(className);
			});
		},
		contains: function (className) {
			return this._collection.map(function (element) {
				return element.classList.contains(className);
			});
		}
	}

	// Style object ===============================================================================

	function Style(collection) {
		this._collection = collection;
	}

	Style.prototype = {

		// METHODS

		getPropertyPriority: function (propertyName) {
			return this._collection.map(function (element) {
				return element.style.getPropertyPriority(propertyName);
			});
		},

		getPropertyValue: function (propertyName) {
			return this._collection.map(function (element) {
				return element.style.getPropertyValue(propertyName);
			});
		},

		removeProperty: function (propertyName) {
			this._collection.forEach(function (element) {
				element.style.removeProperty(propertyName);
			});
		},

		setProperty: function (propertyName, value, priority) {
			this._collection.forEach(function (element) {
				element.style.setProperty(propertyName, value, priority);
			});
		},


		// ATTRIBUTES

		get cssText() {
			return this._collection.map(function (element) {
				return element.style.cssText;
			});
		},

		set cssText(value) {
			this._collection.forEach(function (element) {
				element.style.cssText = value;
			});
		}

	};

	// VANILLA SINGLE ELEMENT =====================================================================

	function one() {

		var nodeArray = vanilla.apply(this, arguments);

		nodeArray.__proto__ = one.prototype;
		nodeArray.splice(1, Infinity);

		return nodeArray;
	}

	one.prototype = {

		__proto__: vanilla.prototype,

		// For style and classList we still return wrappers, to handle the case when there are no elements.
		get style() {
			return this.hasOwnProperty("_style") ? this._style : this._style = new StyleOne(this);
		},

		get classList() {
			return this.hasOwnProperty("_classList") ? this._classList : this._classList = new ClassListOne(this);
		},

		getComputedStyle: function (pseudoElement) {
			return vanilla.prototype.getComputedStyle.call(this, pseudoElement)[0];
		},

		matches: function (selector) {
			return vanilla.prototype.matches.call(this, selector)[0] || undefined;
		}

	}

	function getterOne(propertyName, wrap) {
		return function () {
			var result = this[0] ? this[0][propertyName] : undefined;
			return wrap ? vanilla.one(result) : result;
		}
	}

	function propertyOne(name, get, set, wrap) {
		Object.defineProperty(one.prototype, name, {
			get: get ? getterOne(name, wrap) : undefined,
			set: set ? setter(name) : undefined, // We can't override setters or access them in the parent prototype, so we recreate the same accessor here.
			configurable: true
		});
	}

	// Create readonly properties.
	readonly.forEach(function (propertyName) {
		propertyOne(propertyName, true, false, false);
	});

	// Create mutable properties.
	mutable.forEach(function (propertyName) {
		propertyOne(propertyName, true, true, false);
	});

	// Create properties that return a single element:
	singleNode.concat(singleUniqueNode).forEach(function (propertyName) {
		propertyOne(propertyName, true, false, true);
	});

	// ClassListOne object
	function ClassListOne(collection) {
		this._collection = collection;
	}

	ClassListOne.prototype = {

		__proto__: ClassList.prototype,

		contains: function (className) {
			return ClassList.prototype.contains.call(this, className)[0];
		}

	};

	// StyleOne object

	function StyleOne(collection) {
		this._collection = collection;
	}

	StyleOne.prototype = {

		__proto__: Style.prototype,

		getPropertyPriority: function (propertyName) {
			return Style.prototype.getPropertyPriority.call(this, propertyName)[0];
		},

		getPropertyValue: function (propertyName) {
			return Style.prototype.getPropertyValue.call(this, propertyName)[0];
		}

	};

	// CSS PROPERTIES
	vanilla.registerCSSProperty = function (cssName) {
		var jsName = cssName === "float" ? "cssFloat" :
				cssName.split("-").map(function (part, index) {
					return index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1);
				}).join("");

		Object.defineProperty(Style.prototype, jsName, {
			get: function () {
				return this.getPropertyValue(cssName);
			},
			set: function (value) {
				if (isArrayLike(value)) {
					var length = value.length;
					this._collection.forEach(function (element, index) {
						element.style.setProperty(cssName, value[index % length]);
					});
				} else {
					this.setProperty(cssName, value);
				}
			}
		});

		Object.defineProperty(StyleOne.prototype, jsName, {
			get: function () {
				return this.getPropertyValue(cssName);
			},
			set: function (value) {
				this.setProperty(cssName, value);
			}
		});

	}

	vanilla.registerCSSProperties = function (cssNames) {
		cssNames.forEach(vanilla.registerCSSProperty);
	}

	vanilla.registerCSSProperties(("bottom,display,float,height,left,opacity,position,right,top,visibility,width,z-index").split(","));

	// EXPORT =====================================================================================

	root.$ = root.vanilla = vanilla;
	vanilla.one = one;
	root.$$ = one;

}).call(this);