var content = function() {
	(function() {
		XMLDocument.prototype._clearDOM = function () {
			while (this.hasChildNodes())
				this.removeChild(this.firstChild);
		};
		XMLDocument.prototype._copyDOM = function (oDoc) {
			this._clearDOM();
			if (oDoc.nodeType == NODE_DOCUMENT || oDoc.nodeType == NODE_DOCUMENT_FRAGMENT) {
				var oNodes = oDoc.childNodes;
				for (var i = 0; i < oNodes.length; i++)
					this.appendChild(this.importNode(oNodes[i], true));
			} else if (oDoc.nodeType == NODE_ELEMENT)
				this.appendChild(this.importNode(oDoc, true));
		};
		XMLDocument.prototype.load = function (url) {
			var xhr = new XMLHttpRequest(),
			temp = this;
			xhr.open("POST", url);
			xhr.setRequestHeader("Content-Type", "application/xml");
			xhr.addEventListener("load", function () {
				temp._copyDOM(xhr.responseXML);
			}, false);
			xhr.send();
		}
	})();
}

var script = document.createElement("script");
script.type = "text/javascript";
script.innerHTML = content;
document.documentElement.appendChild(script);