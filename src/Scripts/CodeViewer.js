/// <reference path="../../components/google-code-prettify/prettify.js" />

/* global prettyPrint */
/* exported CodeViewer */

var CodeViewer = (function ()
{
	"use strict";

	var paneLoadStatus =
		{
			html: false,
			script: false,
			css: false
		};

	var fontSizes =
		{
			HTMLView: 12,
			ScriptView: 12,
			CSSView: 12
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
	} // end getQueryParams()


	function setupPage()
	{
		var queryParams = getQueryParams(), url = queryParams.url, preName;

		function onLargerClickHandlerCreator(preName)
		{ return function () { fontSizes[preName]++; document.getElementById(preName).style.fontSize = fontSizes[preName] + "px"; }; }

		function onSmallerClickHandlerCreator(preName)
		{ return function () { fontSizes[preName]--; document.getElementById(preName).style.fontSize = fontSizes[preName] + "px"; }; }

		for (preName in fontSizes) if (fontSizes.hasOwnProperty(preName))
		{
			document.getElementById(preName).style.fontSize = fontSizes[preName] + "px";
			document.getElementById(preName + "LargerFontButton").onclick = onLargerClickHandlerCreator(preName);
			document.getElementById(preName + "SmallerFontButton").onclick = onSmallerClickHandlerCreator(preName);
		}

		sizeCodePanes();
		document.getElementById("PageViewFrame").src = url;
		loadCode(url, "HTMLView");

		window.onresize = sizeCodePanes;
	} // end setupPage()


	function loadCode(url, viewContainerName)
	{
		if (!window.XMLHttpRequest && "ActiveXObject" in window)
			window.XMLHttpRequest = function () { return new window.ActiveXObject("MSXML2.XMLHttp"); };

		var request = new XMLHttpRequest();
		request.open("GET", url, true);
		request.onreadystatechange =
			(function(capturedURL, capturedRequest, capturedViewContainerName)
			{
				return function () { onLoadCodeStateChange(capturedURL, capturedRequest, capturedViewContainerName); };
			})(url, request, viewContainerName);
		request.send();
	} // end loadCode()


	function onLoadCodeStateChange(url, request, viewContainerName)
	{
		var responseText, styleSheetExp, scriptExp, styleSheetExpResult, scriptExpResult, styleSheetURL, scriptURL,
			targetViewContainer = document.getElementById(viewContainerName), scriptSearchFinished = false;

		if (request.readyState !== 4)
			return;
		if (request.status !== 200 && request.status !== 304)
		{
			window.alert("error: " + request.status + ": " + request.statusText);
			return;
		}

		responseText = request.responseText;

		if (viewContainerName === "HTMLView")
		{
			styleSheetExp = /<link\s+.*?(?:rel="stylesheet"\s+.*?href="([^"]+)")|(?:href="([^"]+)"\s+.*?rel="stylesheet").*?>/i;
			styleSheetExpResult = styleSheetExp.exec(responseText);
			if (styleSheetExpResult)
			{
				styleSheetURL = styleSheetExpResult[1] ? styleSheetExpResult[1] : styleSheetExpResult[2];
				loadCode(styleSheetURL, "CSSView");
			}

			scriptExp = /<script\s+.*?(?:type="text\/javascript"\s+.*?src="([^"]+)")|(?:src="([^"]+)"\s+.*?type="text\/javascript").*?>/gi;
			scriptExpResult = scriptExp.exec(responseText);
			while (scriptExpResult && !scriptSearchFinished)
			{
				scriptURL = scriptExpResult[1] ? scriptExpResult[1] : scriptExpResult[2];
				if (/requestanimationframe\.(?:.*?\.)?js$/i.test(scriptURL)
					|| /concert\.(?:.*?\.)?js$/i.test(scriptURL))
				{
					scriptURL = null;
					scriptExpResult = scriptExp.exec(responseText);
				}
				else
					scriptSearchFinished = true;
			}
			if (scriptURL)
				loadCode(scriptURL, "ScriptView");
			else
			{
				document.getElementById("ScriptViewFileName").innerHTML = "(no javascript loaded)";
				document.getElementById("ScriptView").innerHTML = "";
				paneLoadStatus.script = true;
			}
		}

		targetViewContainer.innerHTML = document.createElement("pre").appendChild(document.createTextNode(responseText)).parentNode.innerHTML;

		if (viewContainerName === "HTMLView")
		{
			document.getElementById("HTMLViewFileName").innerHTML = url;
			paneLoadStatus.html = true;
		}
		else if (viewContainerName === "CSSView")
		{
			document.getElementById("CSSViewFileName").innerHTML = url;
			paneLoadStatus.css = true;
		}
		else if (viewContainerName === "ScriptView")
		{
			document.getElementById("ScriptViewFileName").innerHTML = url;
			paneLoadStatus.script = true;
		}

		if (paneLoadStatus.html && paneLoadStatus.css && paneLoadStatus.script)
			prettyPrint();
	} // end onLoadCodeStateChange()


	function sizeCodePanes()
	{
		var i, viewWindowElements = ["PageView", "CodeView1", "CodeView2", "CodeView3"],
			preElements = ["ScriptView", "HTMLView", "CSSView"],
			titleHeight = document.getElementById("PageTitle").offsetHeight,
			newPaneHeight = (typeof window.innerHeight === "undefined") ? 300 : ((window.innerHeight - titleHeight) / 2 - 4),
			viewSectionTopBarHeight = document.getElementById("ScriptViewTopBar").offsetHeight,
			preHeight = newPaneHeight - 2 - viewSectionTopBarHeight;

		for (i = 0; i < viewWindowElements.length; i++)
			document.getElementById(viewWindowElements[i]).style.height = newPaneHeight + "px";

		document.getElementById("PageViewFrame").style.height = newPaneHeight - 2 + "px";

		for(i = 0; i < preElements.length; i++)
			document.getElementById(preElements[i]).style.height = preHeight + "px";
	} // end sizeCodePanes()


	var publicInterface =
		{
			setupPage: setupPage
		};

	return publicInterface;
})(); // end CodeViewer singleton definition
