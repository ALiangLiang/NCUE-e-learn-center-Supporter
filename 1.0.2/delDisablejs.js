var content = "	document.onmousedown =document.mouseup =window.onmousedown =window.mouseup =document.onselectstart =document.onbeforecopy =document.onbeforecut  =document.oncontextmenu =document.oncopy =document.oncut = document.ondragstart =document.onhelp = window.onbeforeunload = null;";
var script = document.createElement("script");
script.type = "text/javascript";
script.textContent = content;
document.documentElement.appendChild(script);