window.onload = function() { 
	var nodes = document.querySelector("#loginForm > div:nth-child(2) > table > tbody > tr:nth-child(2) > td").children;
	for(var i = 0; i < nodes.length; i++)
		nodes[i].setAttribute("type", "button");
}
/*
因為瀏覽器對沒設定type的button有不同的行為，所以加上type來防止button被submit設定type的button有不同的行為，所以加上type來防止button被submit
http://www.dotblogs.com.tw/city7/archive/2013/06/13/105470.aspx
*/