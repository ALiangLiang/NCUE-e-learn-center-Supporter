
var art = "function disable_control(val) {	if(val == false) return;	var toolbar1 = document.getElementById('toolbar');	var toolbar2 = document.getElementById('toolbar1');	toolbar1.rows[0].cells[0].firstChild.rows[0].cells[1].style.display = val ? '' : 'none';	toolbar1.rows[0].cells[0].firstChild.rows[0].cells[2].style.display = val ? '' : 'none';	toolbar1.rows[0].cells[0].firstChild.rows[0].cells[3].style.display = val ? '' : 'none';	toolbar2.rows[0].cells[0].firstChild.rows[1].cells[0].style.display = val ? '' : 'none';	toolbar2.rows[0].cells[0].firstChild.rows[2].cells[0].style.display = val ? '' : 'none';}";
var script = document.createElement("script");
script.type = "text/javascript";
script.textContent = art;
document.documentElement.appendChild(script);