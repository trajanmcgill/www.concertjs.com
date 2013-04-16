/// <reference path="../../Components/google-code-prettify/prettify.js" />

var CodeViewer = (function ()
{
	var paneLoadStatus =
		{
			html: false,
			script: false,
			css: false
		};

	function getQueryParams()
	{
		var i, assignmentHalves, varName, valueString, paramArray, queryParams = {}, queryText = window.location.search;

		if (queryText.length > 0)
			queryText = queryText.substr(1);

		paramArray = queryText.split("&");
		for (i = 0; i < paramArray.length; i++)
		{
			assignmentHalves = paramArray[i].split("=");
			varName = assignmentHalves[0];
			valueString = decodeURIComponent(assignmentHalves[1]);
			if (typeof queryParams[varName] === "undefined")
				queryParams[varName] = valueString;
			else if (typeof queryParams[varName] === "string")
				queryParams[varName] = [queryParams[varName], valueString];
			else
				queryParams[varName].push(valueString);
		}

		return queryParams;
	}

	function setupPage()
	{
		var queryParams = getQueryParams(), url = queryParams["url"];

		sizeCodePanes();
		document.getElementById("PageViewFrame").src = url;
		loadCode(url, "HTMLView");

		window.onresize = sizeCodePanes;
	}

	function loadCode(url, viewContainerName)
	{
		if (!window.XMLHttpRequest && "ActiveXObject" in window)
			window.XMLHttpRequest = function () { return new ActiveXObject("MSXML2.XMLHttp"); };

		var request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.onreadystatechange =
			function ()
			{
				var responseText, styleSheetExp, scriptExp, styleSheetExpResult, scriptExpResult, styleSheetURL, scriptURL,
					targetViewContainer = document.getElementById(viewContainerName);

				if (request.readyState !== 4)
					return;
				if (request.status !== 200 && request.status !== 304)
				{
					alert("error: " + request.status + ": " + request.statusText);
					return;
				}

				responseText = request.responseText;

				if (viewContainerName === "HTMLView")
				{
					styleSheetExp = /<link\s+.*?(?:rel="stylesheet"\s+.*?href="([^"]+)")|(?:href="([^"]+)"\s+.*?rel="stylesheet").*?>/i;
					styleSheetExpResult = styleSheetExp.exec(responseText);
					if (styleSheetExpResult)
						styleSheetURL = styleSheetExpResult[1] ? styleSheetExpResult[1] : styleSheetExpResult[2];
					loadCode(styleSheetURL, "CSSView");

					scriptExp = /<script\s+.*?(?:type="text\/javascript"\s+.*?src="([^"]+)")|(?:src="([^"]+)"\s+.*?type="text\/javascript").*?>/gi;
					scriptExpResult = scriptExp.exec(responseText);
					if (scriptExpResult)
					{
						scriptURL = scriptExpResult[1] ? scriptExpResult[1] : scriptExpResult[2];
						if (/requestanimationframe\.js/i.test(scriptURL))
						{
							scriptExpResult = scriptExp.exec(responseText);
							if (scriptExpResult)
								scriptURL = scriptExpResult[1] ? scriptExpResult[1] : scriptExpResult[2];
							else
								scriptURL = null;
						}

						if (scriptURL)
							loadCode(scriptURL, "ScriptView");
					}
				}

				targetViewContainer.innerHTML = document.createElement("pre").appendChild(document.createTextNode(responseText)).parentNode.innerHTML;

				if (viewContainerName === "HTMLView")
					paneLoadStatus.html = true;
				else if (viewContainerName === "CSSView")
					paneLoadStatus.css = true;
				else if (viewContainerName === "ScriptView")
					paneLoadStatus.script = true;

				if (paneLoadStatus.html && paneLoadStatus.css && paneLoadStatus.script)
					prettyPrint();
			};
		request.send();
	}

	function sizeCodePanes()
	{
		var i, elements = ["PageView", "PageViewFrame", "CodeView1", "CodeView2", "CodeView3"],
			titleHeight = document.getElementById("PageTitle").offsetHeight,
			newPaneHeight = (typeof window.innerHeight === "undefined") ? "300px" : (((window.innerHeight - titleHeight) / 2 - 4) + "px");

		for (i = 0; i < elements.length; i++)
			document.getElementById(elements[i]).style.height = newPaneHeight;
	}

	
	var publicInterface =
		{
			setupPage: setupPage
		};

	return publicInterface;
})();