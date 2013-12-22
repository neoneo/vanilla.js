(function () {

	var root = this,
		_$ = this.$,
		_vanilla = this.vanilla;

	function vanilla() {

		if (typeof arguments[0] ===  "string") {

			// We assume this is a selector. The context is an element that can be passed in as an optional 2nd argument.
			var selector = arguments[0], context = arguments[1];
			var nodeList = (context || document).querySelectorAll(selector);
			//var nodeArray = Array.prototype.slice.call(nodeList);
			nodeList.__proto__ = vanilla.prototype;
			return nodeList;

		} else if (Array.isArray(arguments[0])) {

			var nodeArray = Array.prototype.slice.call(arguments[0]);
			nodeArray.__proto__ = vanilla.prototype;
			return nodeArray;

		} else if (arguments[0].nodeType && arguments[0].nodeType === 1) {
			return vanilla([arguments[0]]);
		} else {
			throw "Don't know what to do";
		}

	}

	vanilla.noConflict = function () {
		root.$ = _$;
		root.vanilla = _vanilla;

		return vanilla;
	}

	// Utility functions for adding properties and methods to the vanilla prototype.

	/**
	 * Returns a getter function for the property name. If wrap is true, the getter returns a vanilla object.
	 */
	function getter(propertyName, wrap) {
		return function () {
			var result = this.map(function (element) {
				return element[propertyName];
			});
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
			if (typeof value === "string") {
				this.forEach(function (element) {
					element[propertyName] = value;
				});
			} else if (Array.isArray(value)) {
				var length = value.length;
				this.every(function (element, index) {
					if (index < length) {
						element[propertyName] = value[index];
						return true;
					}
					return false;
				});
			}
		}
	}

	/**
	 * Defines a property on the vanilla prototype.
	 */
	function property(name, get, set, wrap) {
		Object.defineProperty(vanilla.prototype, name, {
			get: get ? getter(name, wrap) : undefined,
			set: set ? setter(name) : undefined
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

	// The vanilla prototype. Most properties and methods are created using the utility functions, but some don't fit in the patterns.
	vanilla.prototype = {

		__proto__: Array.prototype,

		flatMap: function (callback) {
			return this.map(callback)
				.reduce(function (result, elements) {
					return elements ? result.concat(elements) : result;
				}, []);
		},

		// NODE METHODS

		appendChild: function (child) {
			return this.map(function (node, index) {
				return node.appendChild(index === 0 ? child : child.cloneNode(true));
			});
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
			return this.map(function (node, index) {
				if (index === 0) {
					return node.insertBefore(newNode, referenceNode);
				} else {
					return node.insertBefore(newNode.cloneNode(true), node.childNodes[position] || null);
				}
			});
		},

		removeChild: function (child) {
			var position = -1;
			if (this.length > 1) {
				position = child.parentNode.childNodes.indexOf(child);
			}
			return this.map(function (node, index) {
				if (index === 0) {
					return node.removeChild(child);
				} else {
					var removeNode = node.childNodes[position];
					return removeNode ? node.removeChild(removeNode) : undefined;
				}
			});
		},

		replaceChild: function (newChild, oldChild) {
			var position = -1;
			if (this.length > 1) {
				position = oldChild.parentNode.childNodes.indexOf(oldChild);
			}
			return this.map(function (node, index) {
				if (index === 0) {
					return node.replaceChild(newChild, oldChild);
				} else {
					var replaceNode = node.childNodes[position];
					return replaceNode ? node.replaceChild(newChild.cloneNode(true), replaceNode) : undefined;
				}
			});

		},

		// ELEMENT METHODS

		matches: function (selector) {
			return this.map(function (element) {
				return element.webkitMatchesSelector ? element.webkitMatchesSelector(selector) :
					element.mozMatchesSelector ? element.mozMatchesSelector(selector) :
					element.msMatchesSelecter ? element.msMatchesSelector(selector) :
					undefined;
			});
		},

		// PROPERTIES

		get classList() {
			return this.hasOwnProperty("_classList") ? this._classList : this._classList = new ClassList(this);
		},

		get style() {
			return this.hasOwnProperty("_style") ? this._style : this._style = new Style(this);
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
	("childNodes,firstChild,lastChild,nextSibling,previousSibling,parentNode," +
		"children,firstElementChild,lastElementChild,nextElementSibling,previousElementSibling,parentElement").split(",")
		.forEach(function (propertyName) {
			property(propertyName, true, false, true);
		});

	// These properties only have getters, and return an array:
	("nodeName,nodeType,childElementCount,clientHeight,clientLeft,clientTop,clientWidth,scrollHeight,scrollWidth,tagName").split(",")
		.forEach(function (propertyName) {
			property(propertyName, true, false, false);
		});

	// These properties have getters and setters, and return an array:
	("nodeValue,textContent,className,id,innerHTML,outerHTML,scrollLeft,scrollTop").split(",")
		.forEach(function (propertyName) {
			property(propertyName, true, true, false);
		});

	// ClassList object ===========================================================================

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
		},
		contains: function (className) {
			return this.collection.map(function (element) {
				return element.classList.contains(className);
			});
		}
	}

	// Style object ===============================================================================

	function Style(collection) {
		this.collection = collection;
	}

	Style.prototype = {

		// METHODS

		getPropertyPriority: function (propertyName) {
			return this.collection.map(function (element) {
				return element.style.getPropertyPriority(propertyName);
			});
		},

		getPropertyValue: function (propertyName) {
			return this.collection.map(function (element) {
				return element.style.getPropertyValue(propertyName);
			});
		},

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


		// ATTRIBUTES

		get cssText() {
			return this.collection.map(function (element) {
				return element.style.cssText;
			});
		},

		set cssText(value) {
			this.collection.forEach(function (element) {
				element.style.cssText = value;
			});
		}

	};

	// CSS PROPERTIES
	("align-content,align-items,align-self,animation,animation-delay,animation-direction,animation-duration,animation-fill-mode," +
		"animation-iteration-count,animation-name," +
		"animation-play-state,animation-timing-function,background,background-attachment,background-clip,background-color," +
		"background-image,background-origin,background-position,background-repeat,background-size,border,border-bottom,border-bottom-color," +
		"border-bottom-left-radius,border-bottom-right-radius,border-bottom-style,border-bottom-width,border-collapse,border-color," +
		"border-image,border-image-outset,border-image-repeat,border-image-slice,border-image-source,border-image-width,border-left," +
		"border-left-color,border-left-style,border-left-width,border-radius,border-right-border-right-color,border-right-style," +
		"border-right-width,border-spacing,border-style,border-top,border-top-color,border-top-left-radius,border-top-right-radius," +
		"border-top-style,border-top-width,border-width,bottom,box-shadow,box-sizing,break-after,break-before,caption-side,clip,clip-path," +
		"color,columns,column-count,column-fill,column-gap,column-rule,column-rule-color,column-rule-style,column-rule-width,column-span," +
		"column-width,content,counter-increment,counter-reset,cursor,direction,display,empty-cells,filter,flex,flex-basis,flex-direction," +
		"flex-flow,flex-grow,flex-shrink,flex-wrap,float,font,font-family,font-feature-settings,font-size,font-size-adjust,font-stretch," +
		"font-style,font-variant,font-weight,height,image-rendering,image-orientation,ime-mode,justify-content,left,letter-spacing," +
		"line-height,list-style,list-style-image,list-style-position,list-style-type,margin,margin-bottom,margin-left,margin-right," +
		"margin-top,max-height,max-width,min-height,min-width,opacity,order,orphans,outline,outline-color,outline-offset,outline-style," +
		"outline-width,overflow,overflow-wrap,overflow-x,overflow-y,padding,padding-bottom,padding-left,padding-right,padding-top," +
		"page-break-after,page-break-before,page-break-inside,perspective,perspective-origin,pointer-events,position,quotes,resize," +
		"right,table-layout,tab-size,text-align,text-align-last,text-decoration,text-decoration-color,text-decoration-line," +
		"text-decoration-style,text-indent,text-overflow,text-rendering,text-shadow,text-transform,text-underline-position,top,transform," +
		"transform-origin,transform-style,transition,transition-delay,transition-duration,transition-property,transition-timing-function," +
		"unicode-bidi,unicode-range,vertical-align,visibility,white-space,widows,width,word-break,word-spacing,word-wrap,writing-mode,z-index,zoom"
		).split(",")
		.forEach(function (cssPropertyName) {
			var propertyName = cssPropertyName === "float" ? "cssFloat" :
				cssPropertyName.split("-").map(function (part, index) {
					return index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1);
				}).join("");

			Object.defineProperty(Style.prototype, propertyName, {
				get: function () {
					return this.getPropertyValue(cssPropertyName);
				},
				set: function (value) {
					if (typeof value === "string") {
						this.setProperty(cssPropertyName, value);
					} else if (Array.isArray(value)) {
						var length = value.length;
						this.collection.every(function (element, index) {
							if (index < length) {
								element.style.setProperty(cssPropertyName, value[index]);
								return true;
							}
							return false;
						});
					}
				}
			});
		});

	root.$ = root.vanilla = vanilla;

}).call(this);