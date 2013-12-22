/**
 * An implementation of part of the jQuery API using Vanilla.
 */
(function () {

	function elementMatches(element, selector) {
		return element.webkitMatchesSelector ? element.webkitMatchesSelector(selector) :
			element.mozMatchesSelector ? element.mozMatchesSelector(selector) :
			element.msMatchesSelecter ? element.msMatchesSelector(selector) :
			undefined;
	}

	var api = {

		filter: function (by) {
			var predicate = typeof by === "function" ?
				by : function (element) {
					return elementMatches(element, by);
				}

			return vanilla(Array.prototype.filter.call(this, predicate));
		},

		first: function () {
			return this[0] ;
		},

		last: function () {
			var length = this.length;
			return length > 0 ? this[this.length - 1] : undefined;
		},

		get: function (index) {
			return this[index];
		}

	};


}).call(this);