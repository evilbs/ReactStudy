var data = {
	'a': { name: 'a', c: 'mediumslateblue' },
	'b': { name: 'b', c: 'deeppink' },
	'c': { name: 'c', c: 'goldenrod' },
	'd': { name: 'd', c: 'forestgreen' },
	'e': { name: 'e', c: 'dodgerblue' },
	'f': { name: 'f', c: 'gray' }
}
 
/** 
 * react diff 算法 
*/
function diff(prevChildren, nextChildren, container) {
	var nodes = container.childNodes;
	var updates = [];
	var lastIndex = 0;
	var nextIndex = 0;
	var nodes = container.childNodes;
	var lastPlaceNode = null;
	for (var name in nextChildren) {
		var prevChild = prevChildren && prevChildren[name];
		var nextChild = nextChildren[name];
		if (prevChild && prevChild.element === nextChild.element) {
			//元素位置移动
			if (prevChild.mountIndex < lastIndex) {
				updates.push({
					type: 'move',
					element: prevChild,
					fromIndex: prevChild.mountIndex,
					fromNode: nodes[prevChild.mountIndex],
					afterNode: lastPlaceNode
				});
			}

			lastIndex = Math.max(prevChild.mountIndex, lastIndex);
			lastPlaceNode = nodes[prevChild.mountIndex];
		} else {
			//元素新增
			if (prevChild) {
				lastIndex = Math.max(prevChild.mountIndex, lastIndex);
			}

			var box = createBox(nextChild.element);
			updates.push({
				type: 'add',
				element: nextChild,
				fromNode: box,
				afterIndex: nextIndex,
				afterNode: lastPlaceNode
			});

			lastPlaceNode = box;
		}

		nextIndex++;
	}

	for (var name in prevChildren) {
		//元素删除 
		var nextChild = nextChildren[name];
		if (!nextChild) {
			updates.push({
				type: 'remove',
				fromNode: nodes[prevChildren[name].mountIndex]
			});
		}
	}

	return updates;
}

/**
 * 增量更新到dom
 */
function patch(updates, container) {
	for (var index in updates) {
		var update = updates[index];
		if (update.type === "move") {
			var nodes = container.childNodes;
			var pNode = update.fromNode;
			var aNode = update.afterNode ? update.afterNode.nextSibling : container.firstChild;

			container.insertBefore(pNode, aNode);
		} else if (update.type === "add") {
			var nodes = container.childNodes;
			var pNode = createBox(update.element.element);
			var aNode = update.afterNode ? update.afterNode.nextSibling : container.firstChild;
			container.insertBefore(pNode, aNode);
		} else if (update.type === "remove") {
			container.removeChild(update.fromNode);
		}
	}
}


/**
 * DOMComponent
 */
function DOMComponent(children, container) {
	this.children = children;
	this.container = container;
}

DOMComponent.prototype.render = function () {
	var frame = document.createDocumentFragment();
	for (var name in this.children) {
		var div = createBox(this.children[name].element);
		frame.appendChild(div);
	}

	this.container.appendChild(frame);
}

DOMComponent.prototype.receiveComponent = function (nextChildren) {
	var updates = diff(this.children, nextChildren, document.getElementById("container"));
	patch(updates, this.container);
	logUpdates(updates);
	this.children = nextChildren;
}

/**开始测试 */
var initData = "a,b,c,d";
var initChildren = createElements(initData);
document.getElementById('txtValue').value = initData;
var domComponent = new DOMComponent(initChildren, document.getElementById('container'));
domComponent.render();

btnUpdate.onclick = function () {
	var value = document.getElementById('txtValue').value;
	var nextChildren = createElements(value);
	domComponent.receiveComponent(nextChildren);
}


/**
 * 根据用户输入的元素字符串，转换成element
 */
function createElements(elements) {
	var children = {};
	var handledNode = {};
	var elements = elements[elements.length - 1] === ',' ? elements.slice(0, -1) : elements;
	var elementNodes = elements.split(',');
	for (var i = 0; i < elementNodes.length; i++) {
		var dataKey = elementNodes[i];
		var element = data[dataKey];
		if (!element) {
			var error = '不存在元素:' + dataKey;
			alert(error);
			throw error;
		}

		if (handledNode.hasOwnProperty(dataKey)) {
			alert('不能有重复元素');
			throw '不能有重复元素';
		}

		var key = generateKey(element);
		children[key] = {
			element: element,
			mountIndex: i
		}
		handledNode[dataKey] = undefined;
	}

	return children;
}


function createBox(element) {
	var div = document.createElement('div');
	div.innerHTML = element.name + "<br/>" + new Date().getTime();
	div.className = "box";
	div.style.backgroundColor = element.c;
	return div;
}


function generateKey(el) {
	var key = ":" + el.name;
	return key
}


function logUpdates(updates) {
	var str = "";
	for (var name in updates) {
		var update = updates[name];
		str += "类型:" + update.type + "<br/>";
	}
	document.getElementById('logs').innerHTML = str;
}
