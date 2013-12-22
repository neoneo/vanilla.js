(function (root) {

	function flatmap(callback) {
		return this.map(callback)
			.reduce(function (result, elements) {
				return result.concat(elements);
			}, [])
			.filter(function (element) {
				return element !== null && element !== undefined;
			});
	}

	function propertyGetter(propertyName, wrap) {
		return function () {
			var result = flatmap.call(this, function (element) {
				return element[propertyName];
			});
			return wrap ? Vanilla(result) : result;
		}
	}

	function propertySetter(propertyName) {
		return function (value) {
			this.forEach(function (element) {
				element[propertyName] = value;
			});
		}
	}

	function mapProperty(object, name, get, set, wrap) {
		Object.defineProperty(object, name, {
			get: get ? propertyGetter(name, wrap) : undefined,
			set: set ? propertySetter(name) : undefined,
			configurable: false
		});
	}

	function elementMatches(element, selector) {
		return element.webkitMatchesSelector ? element.webkitMatchesSelector(selector) :
			element.mozMatchesSelector ? element.mozMatchesSelector(selector) :
			element.msMatchesSelecter ? element.msMatchesSelector(selector) :
			undefined;
	}

	function mapMethod(object, name) {
		Object.defineProperty(object, name, {
			value: function () {
				var splat = arguments;
				this.forEach(function (element) {
					element[name].apply(element, splat);
				});
			}
		});
	}

	function Vanilla() {

		if (typeof arguments[0] ===  "string") {

			// We assume this is a selector. The context is an element that can be passed in as an optional 2nd argument.
			var selector = arguments[0], context = arguments[1];
			var nodeList = (context || document).querySelectorAll(selector);
			//var nodeArray = Array.prototype.slice.call(nodeList);
			nodeList.__proto__ = Vanilla.prototype;
			return nodeList;

		} else if (Array.isArray(arguments[0])) {

			var nodeArray = Array.prototype.slice.call(arguments[0]);
			nodeArray.__proto__ = Vanilla.prototype;
			return nodeArray;

		} else if (arguments[0].nodeType && arguments[0].nodeType === 1) {
			return Vanilla([arguments[0]]);
		} else {
			throw "Don't know what to do";
		}

	}

	Vanilla.prototype = {

		__proto__: Array.prototype,

		// MAPPED METHODS

		addEventListener: function (type, callback, useCapture) {
			this.forEach(function (element) {
				element.addEventListener(type, callback, useCapture);
			});
		},

		removeEventListener: function (type, callback, useCapture) {
			this.forEach(function (element) {
				element.removeEventListener(type, callback, useCapture);
			});
		},

		getElementsByClassName: function (className) {
			return flatmap.call(this, function (element) {
				return element.getElementsByClassName(className);
			});
		},

		getElementsByTagName: function (tagName) {
			return flatmap.call(this, function (element) {
				return element.getElementsByTagName(tagName);
			});
		},

		querySelector: function (selector) {
			return flatmap.call(this, function (element) {
				return element.querySelector(selector);
			});
		},

		querySelectorAll: function (selector) {
			return flatmap.call(this, function (element) {
				return element.querySelectorAll(selector);
			})
		},

		get classList() {
			return new ClassList(this);
		},

		get style() {
			return new Style(this);
		},

		// PREDICATES

		matches: function (selector) {
			return this.every(function (element) {
				return elementMatches(element, selector);
			});
		},

		hasAttribute: function (name) {
			return this.every(function (element) {
				return element.hasAttribute(name);
			});
		},

		// JQUERY LIKE METHODS
		filter: function (by) {
			var predicate = typeof by === "function" ?
				by : function (element) {
					return elementMatches(element, by);
				}

			return Vanilla(Array.prototype.filter.call(this, predicate));
		},

		first: function () {
			return this[0];
		},

		last: function () {
			var length = this.length;
			return length > 0 ? this[this.length - 1] : undefined;
		},

		get: function (index) {
			return this[index];
		}

	};

	// MAPPED METHODS
	("remove,removeAttribute,setAttribute").split(",")
		.forEach(function (methodName) {
			mapMethod(Vanilla.prototype, methodName);
		});

	// MAPPED PROPERTIES
	("childNodes,firstChild,lastChild,nextSibling,previousSibling,parentNode," +
		"children,firstElementChild,lastElementChild,nextElementSibling,previousElementSibling,parentElement").split(",")
		.forEach(function (propertyName) {
			// These properties only have getters, and return a new Vanilla object.
			mapProperty(Vanilla.prototype, propertyName, true, false, true);
		});

	("className,textContent,innerHTML").split(",")
		.forEach(function (propertyName) {
			// The properties have getters and setters, and return an array.
			mapProperty(Vanilla.prototype, propertyName, true, true, false);
		});

	// ClassList
	function ClassList(collection) {
		this.collection = collection;
	}

	ClassList.prototype = {
		add: function (className) {
			this.collection.forEach(function (element) {
				element.classList.add(className);
			});
		},
		remove: function (className) {
			this.collection.forEach(function (element) {
				element.classList.remove(className);
			});
		},
		toggle: function (className) {
			this.collection.forEach(function (element) {
				element.classList.toggle(className);
			});
		}
	}

	// Style
	function Style(collection) {
		this.collection = collection;
	}

	Style.prototype = {

		// METHODS

		removeProperty: function (propertyName) {
			this.collection.forEach(function (element) {
				element.style.removeProperty(propertyName);
			});
		},

		setProperty: function (propertyName, value, priority) {
			this.collection.forEach(function (element) {
				element.style.setProperty(propertyName, value, priority);
			});
		},

		getPropertyValue: function (propertyName) {
			return flatmap.call(this.collection, function (element) {
				return element.style.getPropertyValue(propertyName);
			});
		},

		// ATTRIBUTES

		set cssText(value) {
			this.collection.forEach(function (element) {
				element.style.cssText = value;
			});
		}

	};

	// PROPERTIES
	("animation,animation-delay,animation-direction,animation-duration,animation-fill-mode,animation-iteration-count,animation-name," +
		"animation-play-state,animation-timing-function,background,background-attachment,background-clip,background-color," +
		"background-image,background-origin,background-position,background-repeat,background-size,border,border-bottom,border-bottom-color," +
		"border-bottom-left-radius,border-bottom-right-radius,border-bottom-style,border-bottom-width,border-collapse,border-color," +
		"border-image,border-image-outset,border-image-repeat,border-image-slice,border-image-source,border-image-width,border-left," +
		"border-left-color,border-left-style,border-left-width,border-radius,border-right-border-right-color,border-right-style," +
		"border-right-width,border-spacing,border-style,border-top,border-top-color,border-top-left-radius,border-top-right-radius," +
		"border-top-style,border-top-width,border-width,bottom,box-shadow,box-sizing,break-after,break-before,caption-side,clip,clip-path," +
		"color,columns,column-count,column-fill,column-gap,column-rule,column-rule-color,column-rule-style,column-rule-width,column-span" +
		"column-width,content,counter-increment"
		).split(",")
		.forEach(function (cssPropertyName) {
			var propertyName = cssPropertyName.split("-")
				.map(function (part, index) {
					return index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1);
				}).join("");

			Object.defineProperty(Style.prototype, propertyName, {
				get: function () {
					return this.getPropertyValue(cssPropertyName);
				},
				set: function (value) {
					this.setProperty(cssPropertyName, value);
				}
			});
		});

	root.$ = Vanilla;

}).call(this);